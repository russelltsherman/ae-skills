---
description: Review the current diff for correctness bugs and reuse/simplification/efficiency cleanups at the given effort level (low/medium: fewer, high-confidence findings; high→max: broader coverage, may include uncertain findings). Pass --comment to post findings as inline PR comments, or --fix to apply the findings to the working tree after the review.
argument-hint: [low|medium|high|xhigh|max] [--fix] [--comment] [<target>]
allowed-tools: Bash, Read, Grep, Glob, Agent, Workflow, mcp__github_inline_comment__create_inline_comment
---

# /ae-code-review

Faithful reproduction of the built-in `/code-review` command (extracted from Claude binary
`2.1.190`). Reviews the current diff for correctness bugs and reuse/simplification/efficiency
cleanups. `low`/`medium` run inline; `high`/`xhigh`/`max` route to the resilient **`review`**
workflow (the same finder→verify→synthesize engine, in the background). The built-in `ultra`
(cloud) level is intentionally **omitted** — it is not locally reproducible.

The argument string is `$ARGUMENTS`.

## Step 1 — Parse the arguments

From `$ARGUMENTS`, extract, in any order:

- **level** — the first bare word if it is one of `low`, `medium`, `high`, `xhigh`, `max`.
  If no level word is present, default to **`medium`**.
- **`--fix`** — apply findings to the working tree after the review (see *Applying fixes* below).
- **`--comment`** — post findings as inline PR comments (see *Posting to GitHub* below).
- **target** — everything left over: a PR number, branch, ref range, file path, or free-form
  instruction (e.g. "only review src/foo.ts", "focus on error handling"). May be empty.

## Step 2 — Route by effort

- **`low`** → run the **Cell: low** review inline.
- **`medium`** → run the **Cell: medium** review inline.
- **`high` / `xhigh` / `max`** → run the workflow:

  ```
  Workflow({ scriptPath: "${CLAUDE_PLUGIN_ROOT}/workflows/review.js", args: '<level> <target>' })
  ```

  Everything after the level in the args string is passed to the workflow as the review target /
  instructions. If the user gave additional instructions for this review elsewhere in the
  conversation (a scope restriction, files to focus on, things to skip), append them to the args
  string so the workflow honors them. The workflow runs the same finder angles and verify pass as
  the inline review, in the background; the verified findings arrive as a task notification. When
  they arrive, present the findings ranked most-severe first (or note that nothing survived
  verification).

  If the `Workflow` tool is unavailable in this session, fall back to running the matching inline
  cell (**Cell: high** for `high`, **Cell: xhigh / max** for `xhigh`/`max`) and note the fallback.

In all cases, present findings most-severe first; correctness bugs always outrank cleanup findings.

## Step 3 — Apply `--comment` / `--fix` if set

After producing the findings list, run the *Posting to GitHub* and/or *Applying fixes* sections
below for whichever flags were passed.

---

# Finder angles (shared)

The inline cells below reference these. **Correctness angles** hunt for bugs; **cleanup angles**
hunt for cleanup in the changed code. Each angle is an independent reviewer — do not let one
angle's conclusions suppress another's.

### Angle A — line-by-line diff scan

Read every hunk in the diff, line by line. Then Read the enclosing function for
each hunk — bugs in unchanged lines of a touched function are in scope (the PR
re-exposes or fails to fix them). For every line ask: what input, state, timing,
or platform makes this line wrong? Look for inverted/wrong conditions,
off-by-one, null/undefined deref, missing `await`, falsy-zero checks,
wrong-variable copy-paste, error swallowed in catch, unescaped regex metachars.

### Angle B — removed-behavior auditor

For every line the diff DELETES or replaces, name the invariant or behavior it
enforced, then search the new code for where that invariant is re-established.
If you can't find it, that's a candidate: a removed guard, a dropped error
path, a narrowed validation, a deleted test that was covering a real case.

### Angle C — cross-file tracer

For each function the diff changes, find its callers (Grep for the symbol) and
check whether the change breaks any call site: a new precondition, a changed
return shape, a new exception, a timing/ordering dependency. Also check callees:
does a parallel change in the same PR make a call unsafe?

### Angle D — language-pitfall specialist

Scan for the classic pitfalls of the diff's language/framework — for example:
JS falsy-zero, `==` coercion, closure-captured loop var; Python mutable default
args, late-binding closures; Go nil-map write, range-var capture; SQL injection;
timezone/DST drift; float equality. Flag any instance the diff introduces.

### Angle E — wrapper/proxy correctness

When the PR adds or modifies a type that wraps another (cache, proxy, decorator,
adapter): check that every method routes to the wrapped instance and not back
through a registry/session/global — e.g. a caching provider holding a
`delegate` field that resolves IDs via `session.get(...)` instead of
`delegate.get(...)` will re-enter the cache or recurse. Also check that the
wrapper forwards all the methods the callers actually use.

> `medium`/`high` use **Angles A–C** (3 correctness); `xhigh`/`max` use **Angles A–E** (5).

### Reuse

The angles above hunt for bugs; this one and the next two hunt for cleanup in
the changed code. Flag new code that re-implements something the codebase
already has — Grep shared/utility modules and files adjacent to the change,
and name the existing helper to call instead.

### Simplification

Flag unnecessary complexity the diff adds: redundant or derivable state,
copy-paste with slight variation, deep nesting, dead code left behind. Name
the simpler form that does the same job.

### Efficiency

Flag wasted work the diff introduces: redundant computation or repeated I/O,
independent operations run sequentially, blocking work added to startup or
hot paths. Also flag long-lived objects built from closures or captured
environments — they keep the entire enclosing scope alive for the object's
lifetime (a memory leak when that scope holds large values); prefer a
class/struct that copies only the fields it needs. Name the cheaper
alternative.

### Altitude

Check that each change is implemented at the right depth, not as a fragile
bandaid. Special cases layered on shared infrastructure are a sign the fix
isn't deep enough — prefer generalizing the underlying mechanism over adding
special cases.

### Conventions (CLAUDE.md)

Find the CLAUDE.md files that govern the changed code: the user-level
~/.claude/CLAUDE.md, the repo-root CLAUDE.md, plus any CLAUDE.md or
CLAUDE.local.md in a directory that is an ancestor of a changed file (a
directory's CLAUDE.md only applies to files at or below it). Read each one
that exists, then check the diff for clear violations of the rules they state.

Only flag a violation when you can quote the exact rule and the exact line
that breaks it — no style preferences, no vague "spirit of the doc"
inferences. In the finding, name the CLAUDE.md path and quote the rule so the
report can cite it. If no CLAUDE.md applies, return nothing for this angle.

> **Cleanup precedence:** Cleanup, altitude, and conventions candidates use the same
> `file`/`line`/`summary` shape; in `failure_scenario`, state the concrete cost (what is
> duplicated, wasted, harder to maintain, or which CLAUDE.md rule is broken) instead of a crash.
> Correctness bugs always outrank cleanup, altitude, and conventions findings when the output
> cap forces a cut.

---

# Gather the diff (Phase 0, used by medium/high/xhigh/max cells)

Run `git diff @{upstream}...HEAD` (or `git diff main...HEAD` / `git diff HEAD~1`
if there's no upstream) to get the unified diff under review. If there are
uncommitted changes, or the range diff is empty, also run `git diff HEAD` and
include the working-tree changes in scope — the review often runs before the
commit. If a PR number, branch name, or file path was passed as an argument,
review that target instead. Treat this diff as the review scope.

---

# Cell: low

`low effort → 1 diff pass → no verify → ≤4 findings`

## Turn 1 — read

One tool call: read the unified diff (`git diff @{upstream}...HEAD; git diff HEAD`
to cover both committed and uncommitted changes, or `git diff main...HEAD` /
the target passed as an argument). Skip test/fixture
hunks (`test/`, `spec/`, `__tests__/`, `*_test.*`, `*.test.*`,
`fixtures/`, `testdata/`) — test-file changes are not reviewed at this level.
No subagents, no full-file reads.

## Turn 2 — findings

Flag runtime-correctness bugs visible from the hunk alone: inverted/wrong
condition, off-by-one, null/undefined deref where adjacent lines show the value
can be absent, removed guard, falsy-zero check, missing `await`,
wrong-variable copy-paste, error swallowed in a catch that should propagate.
Also flag — still from the hunk alone — new code that duplicates an existing
helper visible in the diff context, and dead code the diff leaves behind.

Do **not** flag style, naming, perf, missing tests, or anything outside the
hunk.

Output at most **4 findings**, most-severe first, one line each:
`path/to/file.ext:123 — what's wrong and the concrete failure`. If nothing
qualifies, output exactly `(none)`.

---

# Cell: medium

`medium effort → 3+5 angles × 6 candidates → 1-vote verify → ≤8 findings`

You are reviewing for **precision** at medium effort: every finding you surface
should be one a maintainer would act on.

Gather the diff (Phase 0 above).

## Phase 1 — Find candidates (3 correctness angles + 3 cleanup angles + 1 altitude angle + 1 conventions angle, up to 6 each)

Run **8 independent finder angles** via the Agent tool — correctness Angles **A, B, C** plus
cleanup **Reuse, Simplification, Efficiency, Altitude, Conventions** (all from *Finder angles*
above). Each surfaces **up to 6 candidate findings** with `file`, `line`, a one-line `summary`,
and a concrete `failure_scenario`.

Pass every candidate with a nameable failure scenario through — finders that
silently drop half-believed candidates bypass the verify step and are the
dominant cause of misses.

Then run **Verify (precision)** below, then emit **Output (≤8)**.

---

# Cell: high

`high effort → 3+5 angles × 6 candidates → 1-vote verify (recall-biased) → ≤10 findings`

(Inline fallback only — `high` normally routes to the `review` workflow.)

You are reviewing for **recall** at high effort: catch every real bug a careful
reviewer would catch in one sitting. At this level, catching real bugs matters
more than avoiding false positives. Err on the side of surfacing.

Gather the diff (Phase 0 above).

## Phase 1 — Find candidates (3 correctness angles + 3 cleanup angles + 1 altitude angle + 1 conventions angle, up to 6 each)

Run **8 independent finder angles** via the Agent tool — correctness Angles **A, B, C** plus the
five cleanup angles. Each surfaces **up to 6 candidate findings** with `file`, `line`, a one-line
`summary`, and a concrete `failure_scenario`.

Pass every candidate with a nameable failure scenario through — finders that
silently drop half-believed candidates bypass the verify step and are the
dominant cause of misses.

Then run **Verify (recall-biased)** below, then emit **Output (≤10)**.

---

# Cell: xhigh / max

`xhigh|max effort → 5+5 angles × 8 candidates → 1-vote verify → sweep → ≤15 findings`

(Inline fallback only — `xhigh`/`max` normally route to the `review` workflow.)

You are reviewing for **recall** at extra-high (`xhigh`) / maximum (`max`) effort: catch every
real bug. At this level, catching real bugs matters more than avoiding false positives — a
missed bug ships. Err on the side of surfacing.

Gather the diff (Phase 0 above).

## Phase 1 — Find candidates (5 correctness angles + 3 cleanup angles + 1 altitude angle + 1 conventions angle, up to 8 each)

Run **10 independent finder angles** via the Agent tool — correctness Angles **A–E** plus the
five cleanup angles. Each surfaces **up to 8 candidate findings**. Do NOT let one angle's
conclusions suppress another's — if two angles flag the same line for different reasons, record
both.

Then run **Verify (precision)** below. This is recall mode — a single non-REFUTED vote carries
the finding. Do NOT drop on uncertainty. Then run **Sweep** below, then emit **Output (≤15)**.

---

# Verify (precision) — Phase 2 (1-vote, 3-state)

Dedup candidates that point at the same line/mechanism, keeping the one with
the most concrete failure scenario. For each remaining candidate, run **one
verifier** via the Agent tool: give it the diff, the relevant
file(s), and the candidate, and have it return exactly one of:

- **CONFIRMED** — can name the inputs/state that trigger it and the wrong
  output or crash. Quote the line.
- **PLAUSIBLE** — mechanism is real, trigger is uncertain (timing, env,
  config). State what would confirm it.
- **REFUTED** — factually wrong (code doesn't say that) or guarded elsewhere.
  Quote the line that proves it.

Keep candidates where the vote is CONFIRMED or PLAUSIBLE.

# Verify (recall-biased) — Phase 2 (1-vote)

Dedup near-duplicates (same defect, same location, same reason → keep one). For
each remaining candidate, run **one verifier** via the Agent tool:
give it the diff, the relevant file(s), and the candidate; it returns exactly
one of **CONFIRMED / PLAUSIBLE / REFUTED**.

**PLAUSIBLE by default** — do not refute a candidate for being "speculative" or
"depends on runtime state" when the state is realistic: concurrency races,
nil/undefined on a rare-but-reachable path (error handler, cold cache, missing
optional field), falsy-zero treated as missing, off-by-one on a boundary the
code does not exclude, retry storms / partial failures, regex/allowlist that
lost an anchor. These are PLAUSIBLE.

**REFUTED** only when constructible from the code: factually wrong (quote the
actual line); provably impossible (type/constant/invariant — show it); already
handled in this diff (cite the guard); or pure style with no observable effect.

Keep **CONFIRMED and PLAUSIBLE**. Drop REFUTED.

# Sweep — Phase 3 (xhigh/max only)

Run **one more finder** as a fresh reviewer who has the verified list. Re-read
the diff and enclosing functions looking ONLY for defects not already listed.
Do not re-derive or re-confirm anything already there — the job is gaps. Focus
on what the first pass tends to miss: moved/extracted code that dropped a guard
or anchor; second-tier footguns (dataclass default evaluated once, `hash()`
non-determinism, lock-scope shrink, predicate methods with side effects);
setup/teardown asymmetry in tests; config defaults flipped.

Surface **up to 8 additional candidates**, each naming a defect not already on
the list. If nothing new, return an empty sweep — do not pad.

# Output

Return findings as a JSON array of at most **N** objects (N = 8 for medium, 10 for high, 15 for
xhigh/max):

```json
[
  {
    "file": "path/to/file.ext",
    "line": 123,
    "summary": "one-sentence statement of the bug",
    "failure_scenario": "concrete inputs/state → wrong output/crash"
  }
]
```

Ranked most-severe first. If more than N survive, keep the N most
severe. If nothing survives verification, return `[]`.

---

# Posting to GitHub (--comment)

The `--comment` flag was passed. After producing the findings list, if the
review target is a GitHub PR, post each finding as an inline PR comment via
`mcp__github_inline_comment__create_inline_comment` (one call per finding;
include a suggestion block only when it fully fixes the issue). If that tool
is not available in this session, fall back to `gh api` (repos/{owner}/{repo}/pulls/{pr}/comments)
or print the findings instead. If the target is not a PR, print the findings
to the terminal and note that `--comment` was ignored.

# Applying fixes (--fix)

The `--fix` flag was passed. After producing the findings list, apply the
findings to the working tree instead of stopping at the report: fix each one
directly — correctness bugs and reuse/simplification/efficiency cleanups alike.
Skip any finding whose fix would change intended behavior, require changes well
outside the reviewed diff, or that you judge to be a false positive — note the
skip rather than arguing with it. Finish with a brief summary of what was fixed
and what was skipped.
