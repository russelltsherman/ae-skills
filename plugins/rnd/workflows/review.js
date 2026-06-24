export const meta = {
  name: "review",
  description: "Resilient workflow-backed code review: one finder agent per review angle, an independent verifier for every candidate, then a ranked, capped findings report — with per-task retry on failed/empty agent steps.",
  whenToUse: "Drop-in replacement for the built-in code-review workflow, invoked by /ae-code-review at high, xhigh, or max effort. Pass args as \"<level> [target]\" — level is high, xhigh, or max; target is an optional PR number, branch, ref range, path, or free-form review instructions (e.g. \"only review src/foo.ts\", \"focus on error handling\"). Individual failed/empty agent steps (scope, find, verify, sweep, synthesize) are retried before degrading gracefully.",
  phases: [
    { title: "Scope", detail: "Pin the diff command, changed files, applicable CLAUDE.md files, and conventions" },
    { title: "Find", detail: "One finder agent per review angle (correctness + cleanup + conventions), streaming into verify" },
    { title: "Verify", detail: "One independent verifier per candidate — CONFIRMED / PLAUSIBLE / REFUTED" },
    { title: "Sweep", detail: "Fresh finder hunting only for gaps (xhigh/max)" },
    { title: "Synthesize", detail: "Merge duplicates, rank, cap the report" },
  ],
}

// review: Scope → pipeline(per-angle Find → Verify) → Sweep (xhigh/max) → Synthesize
// Faithful reproduction of the built-in `code-review` workflow, plus a per-task retry
// wrapper (withRetry) so individual failed/empty agent steps are re-attempted instead of
// crashing the whole pipeline. Invoked via
// Workflow({ scriptPath: "${CLAUDE_PLUGIN_ROOT}/workflows/review.js", args: '<level> [target]' })
// by the /ae-code-review command.
//
// Effort parameterization mirrors the inline /ae-code-review cells:
//   high  → 3 correctness + 5 cleanup angles × 6 → ≤10 findings
//   xhigh → 5 correctness + 5 cleanup angles × 8 → sweep → ≤15 findings
//   max   → same structure as xhigh (the API reasoning effort differs, not the fan-out)
//
// Note: agent({schema}) THROWS a TelemetrySafeError when it exhausts its own internal
// StructuredOutput retries (it does not return null), and the built-in's bare `await agent(...)`
// for scope/sweep/synthesis would crash the whole run. withRetry catches the throw, retries,
// and after MAX_ATTEMPTS returns the last value (null on persistent throw) so the existing
// graceful-degrade paths run instead.

// --- testable helpers (pure) --------------------------------------------------
// This block is pure JS (no workflow primitives except an injected `log`) and is
// unit-tested by __tests__/review.helpers.test.mjs, which extracts the text
// between these markers and evaluates it in isolation. Keep it self-contained.
const LEVEL_PARAMS = {
  high: { correctnessAngles: 3, perAngle: 6, maxFindings: 10, sweep: false },
  xhigh: { correctnessAngles: 5, perAngle: 8, maxFindings: 15, sweep: true },
  max: { correctnessAngles: 5, perAngle: 8, maxFindings: 15, sweep: true },
}
const SWEEP_MAX = 8
const MAX_ATTEMPTS = 3 // 1 try + 2 retries, per failed task
let retriesUsed = 0

// Parse "<level> [target]". Own-property check so Object.prototype keys
// ("constructor", "toString") never parse as a level. Unknown/absent level → "high".
function parseArgs(raw) {
  const RAW_ARGS = (typeof raw === "string" ? raw : "").trim()
  const FIRST = RAW_ARGS.split(/\s+/)[0] || ""
  const FIRST_IS_LEVEL = Object.prototype.hasOwnProperty.call(LEVEL_PARAMS, FIRST)
  const LEVEL = FIRST_IS_LEVEL ? FIRST : "high"
  const TARGET = FIRST_IS_LEVEL ? RAW_ARGS.slice(FIRST.length).trim() : RAW_ARGS
  return { level: LEVEL, target: TARGET, params: LEVEL_PARAMS[LEVEL] }
}

// Correctness bugs outrank cleanup findings when the cap forces a cut;
// CONFIRMED outranks PLAUSIBLE within each group.
const rank = c => (c.kind === "cleanup" ? 2 : 0) + (c.verdict === "PLAUSIBLE" ? 1 : 0)

// Assembler: turn the synthesizer's by-index decisions into a final findings list.
// Invariants: (1) no silent drops while there is room — every verified finding either
// appears (as primary or merge note) or is omitted only because the cap is full;
// (2) the displayed primary is the synthesizer's choice (d.index); (3) escalate the
// verdict label to CONFIRMED only when a merged member is CONFIRMED. No index claimed twice.
function assemble(ranked, decisions, maxFindings) {
  const valid = i => Number.isInteger(i) && i >= 0 && i < ranked.length
  const loc = c => c.file + (c.line != null ? ":" + c.line : "")
  const seen = new Set()
  const claim = i => (valid(i) && !seen.has(i) ? (seen.add(i), true) : false)
  const findings = []
  for (const d of (Array.isArray(decisions) ? decisions : [])) {
    if (findings.length >= maxFindings) break
    if (!claim(d.index)) continue
    const c = ranked[d.index]
    const merged = (Array.isArray(d.merge) ? d.merge : []).filter(claim).map(i => ranked[i])
    const verdict = merged.some(m => m.verdict === "CONFIRMED") ? "CONFIRMED" : c.verdict
    const also = merged.length > 0 ? " [same root cause also at: " + merged.map(loc).join(", ") + "]" : ""
    findings.push({ file: c.file, line: c.line, summary: c.summary + also, failure_scenario: c.failure_scenario, verdict })
  }
  const usedDecisions = findings.length > 0
  let backfilled = 0
  for (let i = 0; i < ranked.length && findings.length < maxFindings; i++) {
    if (seen.has(i)) continue
    const c = ranked[i]
    findings.push({ file: c.file, line: c.line, summary: c.summary, failure_scenario: c.failure_scenario, verdict: c.verdict })
    backfilled++
  }
  return { findings, usedDecisions, backfilled }
}

// Emptiness predicates for withRetry.
const never = () => false // retry on null/throw only, never on a structurally-valid "empty"
const isEmptyReport = rep => !rep || !Array.isArray(rep.decisions) || rep.decisions.length === 0

// Retry a single agent task on null/undefined, empty-but-valid output, OR a thrown error.
// Catching throws is an INTENTIONAL improvement over the built-in code-review: agent({schema})
// THROWS when it exhausts its internal StructuredOutput retries. Here we retry, then after
// MAX_ATTEMPTS return the last value (null on persistent throw) so the caller's existing
// salvage / graceful-degrade path runs instead of the workflow crashing.
async function withRetry(thunk, { label, isEmpty }) {
  let result = null
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (attempt > 1) retriesUsed++
    let threw = false
    try {
      result = await thunk()
    } catch (e) {
      threw = true
      result = null
      log(label + " attempt " + attempt + "/" + MAX_ATTEMPTS + " threw: " + (e && e.message ? e.message : String(e)))
    }
    if (!threw && result != null && !isEmpty(result)) return result
    if (attempt < MAX_ATTEMPTS) {
      log("retry " + attempt + "/" + (MAX_ATTEMPTS - 1) + " — " + label + " " +
        (threw ? "threw" : result == null ? "returned null" : "returned empty"))
    }
  }
  return result
}
// --- end testable helpers -----------------------------------------------------

// ─── Prompt fragments (verbatim from the inline /ae-code-review cells — one source of truth) ───
const CORRECTNESS_ANGLES = [
  { label: "angle-A", text: `### Angle A — line-by-line diff scan

Read every hunk in the diff, line by line. Then Read the enclosing function for
each hunk — bugs in unchanged lines of a touched function are in scope (the PR
re-exposes or fails to fix them). For every line ask: what input, state, timing,
or platform makes this line wrong? Look for inverted/wrong conditions,
off-by-one, null/undefined deref, missing \`await\`, falsy-zero checks,
wrong-variable copy-paste, error swallowed in catch, unescaped regex metachars.
` },
  { label: "angle-B", text: `### Angle B — removed-behavior auditor

For every line the diff DELETES or replaces, name the invariant or behavior it
enforced, then search the new code for where that invariant is re-established.
If you can't find it, that's a candidate: a removed guard, a dropped error
path, a narrowed validation, a deleted test that was covering a real case.
` },
  { label: "angle-C", text: `### Angle C — cross-file tracer

For each function the diff changes, find its callers (Grep for the symbol) and
check whether the change breaks any call site: a new precondition, a changed
return shape, a new exception, a timing/ordering dependency. Also check callees:
does a parallel change in the same PR make a call unsafe?
` },
  { label: "angle-D", text: `### Angle D — language-pitfall specialist

Scan for the classic pitfalls of the diff's language/framework — for example:
JS falsy-zero, \`==\` coercion, closure-captured loop var; Python mutable default
args, late-binding closures; Go nil-map write, range-var capture; SQL injection;
timezone/DST drift; float equality. Flag any instance the diff introduces.
` },
  { label: "angle-E", text: `### Angle E — wrapper/proxy correctness

When the PR adds or modifies a type that wraps another (cache, proxy, decorator,
adapter): check that every method routes to the wrapped instance and not back
through a registry/session/global — e.g. a caching provider holding a
\`delegate\` field that resolves IDs via \`session.get(...)\` instead of
\`delegate.get(...)\` will re-enter the cache or recurse. Also check that the
wrapper forwards all the methods the callers actually use.
` },
]
const CLEANUP_ANGLES = [
  { label: "reuse", text: `### Reuse

Flag new code that re-implements something the codebase
already has — Grep shared/utility modules and files adjacent to the change,
and name the existing helper to call instead.
` },
  { label: "simplification", text: `### Simplification

Flag unnecessary complexity the diff adds: redundant or derivable state,
copy-paste with slight variation, deep nesting, dead code left behind. Name
the simpler form that does the same job.
` },
  { label: "efficiency", text: `### Efficiency

Flag wasted work the diff introduces: redundant computation or repeated I/O,
independent operations run sequentially, blocking work added to startup or
hot paths. Also flag long-lived objects built from closures or captured
environments — they keep the entire enclosing scope alive for the object's
lifetime (a memory leak when that scope holds large values); prefer a
class/struct that copies only the fields it needs. Name the cheaper
alternative.
` },
  { label: "altitude", text: `### Altitude

Check that each change is implemented at the right depth, not as a fragile
bandaid. Special cases layered on shared infrastructure are a sign the fix
isn't deep enough — prefer generalizing the underlying mechanism over adding
special cases.
` },
  { label: "conventions", text: `### Conventions (CLAUDE.md)

Find the CLAUDE.md files that govern the changed code: the user-level
~/.claude/CLAUDE.md, the repo-root CLAUDE.md, plus any CLAUDE.md or
CLAUDE.local.md in a directory that is an ancestor of a changed file (a
directory's CLAUDE.md only applies to files at or below it). Read each one
that exists, then check the diff for clear violations of the rules they state.

Only flag a violation when you can quote the exact rule and the exact line
that breaks it — no style preferences, no vague "spirit of the doc"
inferences. In the finding, name the CLAUDE.md path and quote the rule so the
report can cite it. If no CLAUDE.md applies, return nothing for this angle.
` },
]
const VERDICT_LADDER = `- **CONFIRMED** — can name the inputs/state that trigger it and the wrong
  output or crash. Quote the line.
- **PLAUSIBLE** — mechanism is real, trigger is uncertain (timing, env,
  config). State what would confirm it.
- **REFUTED** — factually wrong (code doesn't say that) or guarded elsewhere.
  Quote the line that proves it.`
const VERDICT_LADDER_RECALL = `**PLAUSIBLE by default** — do not refute a candidate for being "speculative" or
"depends on runtime state" when the state is realistic: concurrency races,
nil/undefined on a rare-but-reachable path (error handler, cold cache, missing
optional field), falsy-zero treated as missing, off-by-one on a boundary the
code does not exclude, retry storms / partial failures, regex/allowlist that
lost an anchor. These are PLAUSIBLE.

**REFUTED** only when constructible from the code: factually wrong (quote the
actual line); provably impossible (type/constant/invariant — show it); already
handled in this diff (cite the guard); or pure style with no observable effect.`
const CLEANUP_PRECEDENCE = "Cleanup, altitude, and conventions candidates use the same\n`file`/`line`/`summary` shape; in `failure_scenario`, state the concrete\ncost (what is duplicated, wasted, harder to maintain, or which CLAUDE.md rule\nis broken) instead of a crash. Correctness bugs always outrank cleanup,\naltitude, and conventions findings when the output cap forces a cut.\n"
const SWEEP_GAP_FOCUS = `moved/extracted code that dropped a guard
or anchor; second-tier footguns (dataclass default evaluated once, \`hash()\`
non-determinism, lock-scope shrink, predicate methods with side effects);
setup/teardown asymmetry in tests; config defaults flipped.`

// ─── Schemas ───
const SCOPE_SCHEMA = {
  type: "object", required: ["diffCommand", "files", "summary"],
  properties: {
    diffCommand: { type: "string" },
    files: { type: "array", items: { type: "string" } },
    claudeMdFiles: { type: "array", items: { type: "string" } },
    summary: { type: "string" },
    conventions: { type: "string" },
  },
}
const CANDIDATES_SCHEMA = {
  type: "object", required: ["candidates"],
  properties: {
    candidates: { type: "array", items: {
      type: "object", required: ["file", "summary", "failure_scenario"],
      properties: {
        file: { type: "string" },
        line: { type: "number" },
        summary: { type: "string" },
        failure_scenario: { type: "string" },
      },
    }},
  },
}
const VERDICT_SCHEMA = {
  type: "object", required: ["verdict", "evidence"],
  properties: {
    verdict: { enum: ["CONFIRMED", "PLAUSIBLE", "REFUTED"] },
    evidence: { type: "string" },
  },
}
const REPORT_SCHEMA = {
  type: "object", required: ["summary", "decisions"],
  properties: {
    summary: { type: "string" },
    decisions: { type: "array", items: {
      type: "object", required: ["index"],
      properties: {
        index: { type: "number", description: "the [i] label of a finding to keep in the report" },
        merge: { type: "array", items: { type: "number" }, description: "[i] labels of findings that describe the same root cause, folded into this one" },
      },
    }},
  },
}

// ─── Args ───
const { level: LEVEL, target: TARGET, params: P } = parseArgs(typeof args === "string" ? args : "")

// ─── Phase 0: Scope ───
phase("Scope")
const scope = await withRetry(() => agent(
  "Establish the scope of a code review.\n\n" +
  (TARGET
    ? "Review target / instructions (passed by the user, verbatim): \"" + TARGET + "\". If it names a PR number, branch, ref range, or file path, build the matching git diff command for it; if it is a free-form instruction (e.g. only review certain files, focus on certain areas), honor any scope restriction when building the diff command and start from the current branch diff ('git diff @{upstream}...HEAD', falling back to 'git diff main...HEAD' or 'git diff HEAD~1') for whatever it does not narrow.\n"
    : "No explicit target — review the current branch: prefer 'git diff @{upstream}...HEAD' (fall back to 'git diff main...HEAD' or 'git diff HEAD~1'), and if there are uncommitted changes also include 'git diff HEAD'.\n") +
  "\n1. Determine the exact diff command(s) for the review and run them to confirm they produce a non-empty diff.\n" +
  "2. List the changed files.\n" +
  "3. Summarize what changed in one paragraph.\n" +
  "4. List the CLAUDE.md files that apply to the changed files (the user-level ~/.claude/CLAUDE.md, the repo-root CLAUDE.md, plus any CLAUDE.md or CLAUDE.local.md in a directory that is an ancestor of a changed file). Read each one that exists and note conventions a reviewer should know.\n\n" +
  "Return diffCommand exactly as a reviewer should run it. Structured output only.",
  { label: "scope", schema: SCOPE_SCHEMA }
), { label: "scope", isEmpty: never })
if (!scope) {
  return { error: "Scope agent returned no result — cannot establish the review scope.", stats: { retriesUsed } }
}
if (!scope.files || scope.files.length === 0) {
  return { level: LEVEL, target: TARGET || undefined, summary: "No changes found to review.", findings: [], stats: { finders: 0, candidates: 0, verified: 0, retriesUsed } }
}
log(LEVEL + " review: " + scope.files.length + " changed files")

const claudeMdFiles = scope.claudeMdFiles || []
const SCOPE_BLOCK =
  "## Review scope\n" +
  "Diff command: " + scope.diffCommand + "\n" +
  "Changed files (" + scope.files.length + "):\n" +
  scope.files.map(f => "  - " + f).join("\n") + "\n" +
  "Applicable CLAUDE.md files (" + claudeMdFiles.length + "):\n" +
  (claudeMdFiles.length > 0 ? claudeMdFiles.map(f => "  - " + f).join("\n") : "  (none)") + "\n\n" +
  "## What changed\n" + scope.summary + "\n\n" +
  "## Conventions\n" + (scope.conventions || "(none noted)") + "\n" +
  // The user's verbatim target/instructions ride along to every finder,
  // verifier, and sweep agent so focus areas and skip requests are honored,
  // not just used for diff scoping.
  (TARGET
    ? "\n## User instructions (verbatim)\n" + TARGET + "\nHonor any scope restrictions or focus areas stated above — they take precedence over your angle's default breadth. Do not surface findings the instructions ask to skip.\n"
    : "")

// ─── Prompts ───
const FINDER_PROMPT = f =>
  "## Code-review finder — " + f.label + "\n\n" + SCOPE_BLOCK + "\n" +
  "Run the diff command above and review ONLY through the lens of your assigned angle:\n\n" +
  f.text + "\n" +
  (f.kind === "cleanup" ? CLEANUP_PRECEDENCE + "\n" : "") +
  "Surface up to " + P.perAngle + " candidate findings, each with file, line, a one-line summary, and a concrete failure_scenario — the user-visible consequence (error, wrong output, data loss), not an intermediate state (value stale, set grows). " +
  "Pass every candidate with a nameable failure scenario through — do not silently drop half-believed candidates; an independent verifier judges them next. " +
  "If nothing qualifies, return an empty list.\n\nStructured output only."

const VERIFIER_PROMPT = c =>
  "## Code-review verifier\n\n" + SCOPE_BLOCK + "\n" +
  "## Candidate finding\n" +
  "File: " + c.file + (c.line != null ? ":" + c.line : "") + "\n" +
  "Summary: " + c.summary + "\n" +
  "Failure scenario: " + c.failure_scenario + "\n\n" +
  "Run the diff command above, read the relevant file(s), and return exactly one verdict:\n\n" +
  VERDICT_LADDER + "\n\n" + VERDICT_LADDER_RECALL + "\n\n" +
  "Structured output only. Evidence must quote or cite the relevant line(s)."

// ─── No pre-verify dedup — every candidate gets a verifier; dedup happens once at synthesis ───
let candidatesSeen = 0

function verifyCandidate(c) {
  const short = (c.file || "").split("/").pop()
  return withRetry(() => agent(VERIFIER_PROMPT(c), { label: "verify:" + short, phase: "Verify", schema: VERDICT_SCHEMA }),
    { label: "verify:" + short, isEmpty: never })
    .then(v => (v ? { ...c, verdict: v.verdict, evidence: v.evidence } : null))
}

// ─── Find → Verify, no barrier between finders ───
const FINDERS = CORRECTNESS_ANGLES.slice(0, P.correctnessAngles)
  .map(a => ({ ...a, kind: "correctness" }))
  .concat(CLEANUP_ANGLES.map(a => ({ ...a, kind: "cleanup" })))

const finderResults = await pipeline(
  FINDERS,

  f => withRetry(() => agent(FINDER_PROMPT(f), { label: f.label, phase: "Find", schema: CANDIDATES_SCHEMA }),
    { label: f.label, isEmpty: never }).then(r => {
    if (!r) return { finder: f, candidates: [] }
    log(f.label + ": " + r.candidates.length + " candidates")
    return { finder: f, candidates: r.candidates.slice(0, P.perAngle) }
  }),

  result => {
    candidatesSeen += result.candidates.length
    return parallel(result.candidates.map(c => () => verifyCandidate({ ...c, kind: result.finder.kind })))
  }
)

let verified = finderResults.flat().filter(Boolean)

// ─── Sweep (xhigh/max): one fresh finder hunting only for gaps ───
if (P.sweep) {
  phase("Sweep")
  const knownBlock = verified.length > 0
    ? verified.map(c => "- " + c.file + (c.line != null ? ":" + c.line : "") + " — " + c.summary).join("\n")
    : "(none)"
  const sweep = await withRetry(() => agent(
    "## Code-review sweep — gaps only\n\n" + SCOPE_BLOCK + "\n" +
    "## Already-found candidates (do NOT re-derive or re-confirm these)\n" + knownBlock + "\n\n" +
    "Re-read the diff and the enclosing functions looking ONLY for defects not already listed. " +
    "Focus on what the first pass tends to miss: " + SWEEP_GAP_FOCUS + "\n\n" +
    "Surface up to " + SWEEP_MAX + " additional candidates. If nothing new, return an empty list — do not pad.\n\nStructured output only.",
    { label: "sweep", phase: "Sweep", schema: CANDIDATES_SCHEMA }
  ), { label: "sweep", isEmpty: never })
  if (sweep && sweep.candidates.length > 0) {
    const sliced = sweep.candidates.slice(0, SWEEP_MAX)
    candidatesSeen += sliced.length
    log("sweep: " + sliced.length + " candidates")
    const sweepVerified = await parallel(sliced.map(c => () => verifyCandidate({ ...c, kind: "correctness" })))
    verified = verified.concat(sweepVerified.filter(Boolean))
  }
}

const surviving = verified.filter(c => c.verdict !== "REFUTED")
const refuted = verified.filter(c => c.verdict === "REFUTED")
log("Verify done: " + verified.length + " verified → " + surviving.length + " kept, " + refuted.length + " refuted")

const stats = {
  level: LEVEL,
  finders: FINDERS.length,
  candidates: candidatesSeen,
  verified: verified.length,
  refuted: refuted.length,
  retriesUsed,
}

if (surviving.length === 0) {
  return {
    level: LEVEL, target: TARGET || undefined,
    summary: "No findings survived verification.",
    findings: [],
    stats,
  }
}

// ─── Synthesize: rank, merge semantic dupes, cap ───
phase("Synthesize")
const ranked = surviving.slice().sort((a, b) => rank(a) - rank(b))
const block = ranked.map((c, i) =>
  "### [" + i + "] " + c.file + (c.line != null ? ":" + c.line : "") + " (" + c.verdict + (c.kind === "cleanup" ? ", cleanup" : "") + ")\n" +
  c.summary + "\nFailure scenario: " + c.failure_scenario + "\nVerifier evidence: " + c.evidence + "\n"
).join("\n")

const report = await withRetry(() => agent(
  "## Synthesis: final code-review report\n\n" +
  ranked.length + " findings survived independent verification (" + LEVEL + "-effort review). They are numbered [0]-[" + (ranked.length - 1) + "] below.\n\n" + block + "\n" +
  "## Instructions\n" +
  "Return decisions about findings BY INDEX — never re-emit finding text.\n" +
  "1. For each distinct defect, emit one decision with its index. When several findings describe the same defect (same root cause), keep one entry and list the others in its merge array.\n" +
  "2. Order decisions most-severe first. Correctness bugs always outrank cleanup findings.\n" +
  "3. Keep at most " + P.maxFindings + " decisions; omit the least severe beyond the cap.\n" +
  "4. Write a 2-3 sentence summary of the review.\n\nStructured output only.",
  { label: "synthesize", schema: REPORT_SCHEMA }
), { label: "synthesize", isEmpty: isEmptyReport })

// Assembler invariants:
//   1. No silent drops while there is room: every verified finding either appears
//      (as primary or merge note) or is omitted only because the cap is full.
//   2. The displayed primary is the synthesizer's choice (d.index) — it picks the
//      best-described representative; we only escalate the verdict label when a
//      merged member is CONFIRMED.
//   3. The summary describes the report actually returned.
const { findings, usedDecisions, backfilled } = assemble(ranked, report && report.decisions, P.maxFindings)
const summary = usedDecisions && report
  ? report.summary + (backfilled > 0 ? " (" + backfilled + " additional verified finding" + (backfilled === 1 ? "" : "s") + " appended unmerged.)" : "")
  : "Synthesis step was skipped or its decisions were unusable — returning verified findings ranked, unmerged."

return {
  level: LEVEL,
  target: TARGET || undefined,
  summary,
  findings,
  refuted: refuted.map(c => ({ file: c.file, line: c.line, summary: c.summary })),
  stats: { ...stats, reported: findings.length },
}
