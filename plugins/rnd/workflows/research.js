export const meta = {
  name: "research",
  description: "Resilient deep-research: fan-out web searches, fetch sources, adversarially verify claims, synthesize a cited report — with per-task retry on failed/empty agent steps.",
  whenToUse: "Drop-in replacement for the built-in deep-research, driven by /ae-research. Use when you want a fact-checked, cited research report and want individual failed/empty agent steps (scope, search, fetch, verify, synthesis) automatically retried before degrading gracefully. Pass the question as args.",
  phases: [
    { title: "Scope", detail: "Decompose question (from args) into 5 search angles" },
    { title: "Search", detail: "5 parallel WebSearch agents, one per angle" },
    { title: "Fetch", detail: "URL-dedup, fetch top 15 sources, extract falsifiable claims" },
    { title: "Verify", detail: "3-vote adversarial verification per claim (need 2/3 refutes to kill)" },
    { title: "Synthesize", detail: "Merge semantic dupes, rank by confidence, cite sources" },
  ],
}

// research: Scope → pipeline(Search → URL-dedup → Fetch+Extract) → 3-vote Verify → Synthesize
// Faithful reproduction of the built-in `deep-research` workflow, plus a per-task retry
// wrapper (withRetry) so individual failed/empty agent steps are re-attempted instead of
// re-running the whole ~94-call pipeline. Question is passed via
// Workflow({ scriptPath: "${CLAUDE_PLUGIN_ROOT}/workflows/research.js", args: '<question>' }).
//
// Note: agent() already auto-retries terminal API errors internally before returning null,
// so withRetry adds value mainly for empty-but-valid outputs (0 search hits, 0 claims,
// 0 findings) and as a second chance on null (terminal death / synthesis failure).

const VOTES_PER_CLAIM = 3
const REFUTATIONS_REQUIRED = 2
const MAX_FETCH = 15
const MAX_VERIFY_CLAIMS = 25

// --- retry helpers (testable) -------------------------------------------------
// This block is pure JS (no workflow primitives except an injected `log`) and is
// unit-tested by __tests__/research.retry.test.mjs, which extracts the text
// between these markers and evaluates it in isolation. Keep it self-contained.
const MAX_ATTEMPTS = 3 // 1 try + 2 retries, per failed task
let retriesUsed = 0

// Emptiness predicates: a structurally-valid result that carries no usable payload.
const isEmptyScope = (r) => !r || !Array.isArray(r.angles) || r.angles.length < 3
const isEmptySearch = (r) => !r || !Array.isArray(r.results) || r.results.length === 0
const isEmptyExtract = (ext) => !ext || !Array.isArray(ext.claims) || ext.claims.length === 0
const isEmptyReport = (rep) => !rep || !Array.isArray(rep.findings) || rep.findings.length === 0
const never = () => false // for verify votes: retry on null only, never on "empty"

// Retry a single agent task on null/undefined, empty-but-valid output, OR a thrown
// error. Catching throws is an INTENTIONAL improvement over the built-in deep-research:
// agent({schema}) THROWS a TelemetrySafeError when it exhausts its own internal
// StructuredOutput retries (it does not return null), and the built-in's bare
// `await agent(...)` for scope/synthesis would crash the whole run. Here we retry, then
// after MAX_ATTEMPTS return the last value (null on persistent throw) so the caller's
// existing salvage / graceful-degrade path runs instead of the workflow crashing.
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
// --- end retry helpers --------------------------------------------------------

// --- concurrency limiter (testable) -------------------------------------------
// Bounds how many agent() calls execute simultaneously. The fan-out phases —
// search (up to 6 angles), fetch (up to MAX_FETCH sources), and especially the
// 3-vote verify across up to MAX_VERIFY_CLAIMS claims (≈75 agents) — each spawn
// agents that hit WebSearch/WebFetch + the LLM, and running too many at once
// trips API / web-search rate limits. The workflow runtime only caps at
// min(16, cores-2), which is host-dependent and still too high for external
// rate limits; this gate imposes a fixed, lower ceiling regardless of host.
// Pure JS (no workflow primitives) so it is unit-tested in isolation by
// __tests__/research.limiter.test.mjs via the same block-extraction trick.
//
// Tune MAX_CONCURRENT_AGENTS down if you still see 429s, up to go faster.
const MAX_CONCURRENT_AGENTS = 4

// createLimiter(n) returns a function that takes a thunk and runs it only once
// fewer than n thunks are in flight, queueing the rest. Each call gets its own
// promise that settles with the thunk's resolution/rejection, so callers
// (withRetry, parallel) keep their existing throw/null semantics. Leaf-only use
// (no gated call awaits another gated call) means it cannot deadlock.
function createLimiter(limit) {
  let active = 0
  const queue = []
  const pump = () => {
    if (active >= limit || queue.length === 0) return
    active++
    const { thunk, resolve, reject } = queue.shift()
    Promise.resolve()
      .then(thunk)
      .then(resolve, reject)
      .finally(() => { active--; pump() })
  }
  return (thunk) => new Promise((resolve, reject) => {
    queue.push({ thunk, resolve, reject })
    pump()
  })
}
// --- end concurrency limiter --------------------------------------------------

// The single gate shared by every agent() call in this run. gatedAgent is a
// drop-in for agent(...) that defers execution until a concurrency slot is free.
const gate = createLimiter(MAX_CONCURRENT_AGENTS)
const gatedAgent = (...callArgs) => gate(() => agent(...callArgs))

// --- fetch label (testable) ---------------------------------------------------
// The Fetch-phase progress labels were showing "fetch:unknown" whenever a search
// agent returned a URL that `new URL()` rejects — most commonly a scheme-less
// URL like "example.com/page". Recover a hostname by retrying with an https://
// prefix, and when even that fails fall back to a short slug of the source title
// so the operator still sees *what* is being fetched, not "unknown". Pure JS, so
// it is unit-tested in isolation by __tests__/research.label.test.mjs.
const fetchHost = (url) => {
  if (typeof url !== "string" || !url.trim()) return null
  const strip = (h) => h.replace(/^www\./, "")
  try { return strip(new URL(url).hostname) } catch {}
  // No scheme? Prepend https:// and retry (handles "example.com/x", "//host/x").
  try { return strip(new URL("https://" + url.replace(/^\/+/, "")).hostname) } catch {}
  return null
}
const fetchLabel = (source) => {
  const host = fetchHost(source && source.url)
  if (host) return "fetch:" + host
  const title = ((source && source.title) || "").trim().replace(/\s+/g, " ")
  if (title) return "fetch:" + title.slice(0, 40)
  return "fetch:unknown"
}
// --- end fetch label ----------------------------------------------------------

// ─── Schemas ───
const SCOPE_SCHEMA = {
  type: "object", required: ["question", "angles", "summary"],
  properties: {
    question: { type: "string" },
    summary: { type: "string" },
    angles: { type: "array", minItems: 3, maxItems: 6, items: {
      type: "object", required: ["label", "query"],
      properties: {
        label: { type: "string" },
        query: { type: "string" },
        rationale: { type: "string" },
      },
    }},
  },
}
const SEARCH_SCHEMA = {
  type: "object", required: ["results"],
  properties: {
    results: { type: "array", maxItems: 6, items: {
      type: "object", required: ["url", "title", "relevance"],
      properties: {
        url: { type: "string" },
        title: { type: "string" },
        snippet: { type: "string" },
        relevance: { enum: ["high", "medium", "low"] },
      },
    }},
  },
}
const EXTRACT_SCHEMA = {
  type: "object", required: ["claims", "sourceQuality"],
  properties: {
    sourceQuality: { enum: ["primary", "secondary", "blog", "forum", "unreliable"] },
    publishDate: { type: "string" },
    claims: { type: "array", maxItems: 5, items: {
      type: "object", required: ["claim", "quote", "importance"],
      properties: {
        claim: { type: "string" },
        quote: { type: "string" },
        importance: { enum: ["central", "supporting", "tangential"] },
      },
    }},
  },
}
const VERDICT_SCHEMA = {
  type: "object", required: ["refuted", "evidence", "confidence"],
  properties: {
    refuted: { type: "boolean" },
    evidence: { type: "string" },
    confidence: { enum: ["high", "medium", "low"] },
    counterSource: { type: "string" },
  },
}
const REPORT_SCHEMA = {
  type: "object", required: ["summary", "findings", "caveats"],
  properties: {
    summary: { type: "string" },
    findings: { type: "array", items: {
      type: "object", required: ["claim", "confidence", "sources", "evidence"],
      properties: {
        claim: { type: "string" },
        confidence: { enum: ["high", "medium", "low"] },
        sources: { type: "array", items: { type: "string" } },
        evidence: { type: "string" },
        vote: { type: "string" },
      },
    }},
    caveats: { type: "string" },
    openQuestions: { type: "array", items: { type: "string" } },
  },
}

// ─── Phase 0: Scope — decompose question into search angles ───
phase("Scope")
const QUESTION = (typeof args === "string" && args.trim()) || ""
if (!QUESTION) {
  return { error: "No research question provided. Pass it as args: Workflow({scriptPath: '.../workflows/research.js', args: '<question>'})." }
}
const scope = await withRetry(() => gatedAgent(
  "Decompose this research question into complementary search angles.\n\n" +
  "## Question\n" + QUESTION + "\n\n" +
  "## Task\n" +
  "Generate 5 distinct web search queries that together cover the question from different angles. Pick angles that suit the question's domain. Examples:\n" +
  "- broad/primary  · academic/technical  · recent news  · contrarian/skeptical  · practitioner/implementation\n" +
  "- For medical: anatomy · common causes · serious differentials · authoritative refs · red flags\n" +
  "- For tech: state-of-art · benchmarks · limitations · industry adoption · cost/tradeoffs\n\n" +
  "Make queries specific enough to surface high-signal results. Avoid redundancy.\n" +
  "Return: the question (verbatim or lightly normalized), a 1-2 sentence decomposition strategy, and the angles.\n\nStructured output only.",
  { label: "scope", schema: SCOPE_SCHEMA }
), { label: "scope", isEmpty: isEmptyScope })
if (!scope) {
  return { error: "Scope agent returned no result — cannot decompose the research question.", stats: { retriesUsed } }
}
log("Q: " + QUESTION.slice(0, 80) + (QUESTION.length > 80 ? "…" : ""))
log("Decomposed into " + scope.angles.length + " angles: " + scope.angles.map(a => a.label).join(", "))

// ─── Dedup state — accumulates across searchers as they complete ───
const normURL = u => {
  try {
    const p = new URL(u)
    return (p.hostname.replace(/^www\./, "") + p.pathname.replace(/\/$/, "")).toLowerCase()
  } catch { return u.toLowerCase() }
}
const seen = new Map()
const dupes = []
const budgetDropped = []
const relRank = { high: 0, medium: 1, low: 2 }
let fetchSlots = MAX_FETCH

// ─── Prompts ───
const SEARCH_PROMPT = (angle) =>
  "## Web Searcher: " + angle.label + "\n\n" +
  "Research question: \"" + QUESTION + "\"\n\n" +
  "Your angle: **" + angle.label + "** — " + (angle.rationale || "") + "\n" +
  "Search query: `" + angle.query + "`\n\n" +
  "## Task\nUse WebSearch with the query above (or a refined version). Return the top 4-6 most relevant results.\n" +
  "Rank by relevance to the ORIGINAL question, not just the search query. Skip obvious SEO spam/content farms.\n" +
  "Include a short snippet capturing why each result is relevant.\n\nStructured output only."

const FETCH_PROMPT = (source, angle) =>
  "## Source Extractor\n\n" +
  "Research question: \"" + QUESTION + "\"\n\n" +
  "Fetch and extract key claims from this source:\n" +
  "**URL:** " + source.url + "\n**Title:** " + source.title + "\n**Found via:** " + angle + " search\n\n" +
  "## Task\n1. Use WebFetch to retrieve the page content.\n" +
  "2. Assess source quality: primary research/institution? secondary reporting? blog/opinion? forum? unreliable?\n" +
  "3. Extract 2-5 FALSIFIABLE claims that bear on the research question. Each claim must:\n" +
  "   - be a concrete, checkable statement (not vague generalities)\n" +
  "   - include a direct quote from the source as support\n" +
  "   - be rated central/supporting/tangential to the research question\n" +
  "4. Note publish date if available.\n\n" +
  "If the fetch fails or the page is irrelevant/paywalled, return claims: [] and sourceQuality: \"unreliable\".\n\nStructured output only."

const VERIFY_PROMPT = (claim, v) =>
  "## Adversarial Claim Verifier (voter " + (v + 1) + "/" + VOTES_PER_CLAIM + ")\n\n" +
  "Be SKEPTICAL. Try to REFUTE this claim. ≥" + REFUTATIONS_REQUIRED + "/" + VOTES_PER_CLAIM + " refutations kill it.\n\n" +
  "## Research question\n" + QUESTION + "\n\n" +
  "## Claim under review\n\"" + claim.claim + "\"\n\n" +
  "**Source:** " + claim.sourceUrl + " (" + claim.sourceQuality + ")\n" +
  "**Supporting quote:** \"" + claim.quote + "\"\n\n" +
  "## Checklist\n" +
  "1. Is the claim actually supported by the quote, or is it an overreach/misread?\n" +
  "2. WebSearch for contradicting evidence — does any credible source dispute or heavily qualify this?\n" +
  "3. Is the source quality sufficient for the claim's strength? (extraordinary claims need primary sources)\n" +
  "4. Is the claim outdated? (check dates — old claims about fast-moving fields are suspect)\n" +
  "5. Is this a marketing claim / press release / cherry-picked benchmark / forum speculation?\n\n" +
  "**refuted=true** if: unsupported by quote / contradicted / low-quality source for strong claim / outdated / marketing fluff.\n" +
  "**refuted=false** ONLY if: claim is well-supported, current, and source quality matches claim strength.\n" +
  "Default to refuted=true if uncertain.\n\nStructured output only. Evidence MUST be specific."

// ─── Pipeline: search → dedup → fetch+extract (no barrier) ───
const searchResults = await pipeline(
  scope.angles,

  angle => withRetry(() => gatedAgent(SEARCH_PROMPT(angle), {
    label: "search:" + angle.label, phase: "Search", schema: SEARCH_SCHEMA
  }), { label: "search:" + angle.label, isEmpty: isEmptySearch }).then(r => {
    if (!r) return null
    log(angle.label + ": " + r.results.length + " results")
    return { angle: angle.label, results: r.results }
  }),

  searchResult => {
    const sorted = [...searchResult.results].sort((a, b) => relRank[a.relevance] - relRank[b.relevance])
    const novel = sorted.filter(r => {
      const key = normURL(r.url)
      if (seen.has(key)) {
        dupes.push({ ...r, angle: searchResult.angle, dupOf: seen.get(key) })
        return false
      }
      if (fetchSlots <= 0 && relRank[r.relevance] >= 1) {
        budgetDropped.push({ ...r, angle: searchResult.angle })
        return false
      }
      seen.set(key, { angle: searchResult.angle, title: r.title })
      fetchSlots--
      return true
    })
    if (novel.length < searchResult.results.length) {
      log(searchResult.angle + ": " + novel.length + " novel (" + (searchResult.results.length - novel.length) + " filtered)")
    }
    return parallel(
      novel.map(source => () => {
        const label = fetchLabel(source)
        return withRetry(() => gatedAgent(FETCH_PROMPT(source, searchResult.angle), {
          label,
          phase: "Fetch",
          schema: EXTRACT_SCHEMA,
        }), { label, isEmpty: isEmptyExtract }).then(ext => {
          // User-skip → null; drop it (filtered by searchResults.flat().filter(Boolean))
          // rather than throwing into .catch() and mislabeling it "unreliable".
          if (!ext) return null
          return {
            url: source.url, title: source.title, angle: searchResult.angle,
            sourceQuality: ext.sourceQuality, publishDate: ext.publishDate,
            claims: ext.claims.map(c => ({ ...c, sourceUrl: source.url, sourceQuality: ext.sourceQuality })),
          }
        }).catch(e => {
          log("fetch failed: " + source.url + " — " + (e.message || e))
          return { url: source.url, title: source.title, angle: searchResult.angle, sourceQuality: "unreliable", claims: [] }
        })
      })
    )
  }
)

const allSources = searchResults.flat().filter(Boolean)
const allClaims = allSources.flatMap(s => s.claims)
const impRank = { central: 0, supporting: 1, tangential: 2 }
const qualRank = { primary: 0, secondary: 1, blog: 2, forum: 3, unreliable: 4 }

const rankedClaims = [...allClaims]
  .sort((a, b) => (impRank[a.importance] - impRank[b.importance]) || (qualRank[a.sourceQuality] - qualRank[b.sourceQuality]))
  .slice(0, MAX_VERIFY_CLAIMS)

log("Fetched " + allSources.length + " sources → " + allClaims.length + " claims → verifying top " + rankedClaims.length)

if (rankedClaims.length === 0) {
  return {
    question: QUESTION,
    summary: "No claims extracted. " + allSources.length + " sources fetched, all empty/failed. " + dupes.length + " URL dupes, " + budgetDropped.length + " budget-dropped.",
    findings: [], refuted: [], sources: allSources.map(s => ({ url: s.url, quality: s.sourceQuality })),
    stats: { angles: scope.angles.length, sources: allSources.length, claims: 0, dupes: dupes.length, retriesUsed },
  }
}

// ─── Verify: 3-vote adversarial ───
// Barrier here is intentional — claim pool must be fully assembled before ranking/verification.
phase("Verify")
const voted = (await parallel(
  rankedClaims.map(claim => () =>
    parallel(
      Array.from({ length: VOTES_PER_CLAIM }, (_, v) => () =>
        withRetry(() => gatedAgent(VERIFY_PROMPT(claim, v), {
          label: "v" + v + ":" + claim.claim.slice(0, 40),
          phase: "Verify",
          schema: VERDICT_SCHEMA,
        }), { label: "v" + v + ":" + claim.claim.slice(0, 40), isEmpty: never })
      )
    ).then(verdicts => {
      // A vote can be null (user-skip or agent error) — treat as abstain.
      const valid = verdicts.filter(Boolean)
      const refuted = valid.filter(v => v.refuted).length
      // Survive only if the claim was actually adjudicated: a quorum of
      // valid votes AND fewer than REFUTATIONS_REQUIRED refuting. Too many
      // abstentions = unverified, which must NOT pass into the report
      // (otherwise all-abstain → refuted=0 → false survive).
      const abstained = VOTES_PER_CLAIM - valid.length
      const survives = valid.length >= REFUTATIONS_REQUIRED && refuted < REFUTATIONS_REQUIRED
      log("\"" + claim.claim.slice(0, 50) + "…\": " + (valid.length - refuted) + "-" + refuted + (abstained > 0 ? " (" + abstained + " abstain)" : "") + " " + (survives ? "✓" : "✗"))
      return { ...claim, verdicts: valid, refutedVotes: refuted, survives }
    })
  )
)).filter(Boolean)

const confirmed = voted.filter(c => c.survives)
const killed = voted.filter(c => !c.survives)
log("Verify done: " + voted.length + " claims → " + confirmed.length + " confirmed, " + killed.length + " killed")

if (confirmed.length === 0) {
  return {
    question: QUESTION,
    summary: "All " + voted.length + " claims refuted by adversarial verification. Research inconclusive — sources may be low-quality or claims overstated.",
    findings: [],
    refuted: killed.map(c => ({ claim: c.claim, vote: (c.verdicts.length - c.refutedVotes) + "-" + c.refutedVotes, source: c.sourceUrl })),
    sources: allSources.map(s => ({ url: s.url, quality: s.sourceQuality, claimCount: s.claims.length })),
    stats: { angles: scope.angles.length, sources: allSources.length, claims: allClaims.length, verified: voted.length, confirmed: 0, killed: killed.length, retriesUsed },
  }
}

// ─── Synthesize ───
phase("Synthesize")
const confRank = { high: 0, medium: 1, low: 2 }
const block = confirmed.map((c, i) => {
  const best = c.verdicts.filter(v => !v.refuted).sort((a, b) => confRank[a.confidence] - confRank[b.confidence])[0]
  return "### [" + i + "] " + c.claim + "\n" +
    "Vote: " + (c.verdicts.length - c.refutedVotes) + "-" + c.refutedVotes + " · Source: " + c.sourceUrl + " (" + c.sourceQuality + ")\n" +
    "Quote: \"" + c.quote + "\"\nVerifier evidence (" + best.confidence + "): " + best.evidence + "\n"
}).join("\n")

const killedBlock = killed.length > 0
  ? "\n## Refuted claims (for transparency)\n" +
    killed.map(c => "- \"" + c.claim + "\" (" + c.sourceUrl + ", vote " + (c.verdicts.length - c.refutedVotes) + "-" + c.refutedVotes + ")").join("\n")
  : ""

const report = await withRetry(() => gatedAgent(
  "## Synthesis: research report\n\n" +
  "**Question:** " + QUESTION + "\n\n" +
  confirmed.length + " claims survived " + VOTES_PER_CLAIM + "-vote adversarial verification. Merge semantic duplicates and synthesize.\n\n" +
  "## Confirmed claims\n" + block + "\n" + killedBlock + "\n\n" +
  "## Instructions\n" +
  "1. Identify claims that say the same thing — merge them, combine their sources.\n" +
  "2. Group related claims into coherent findings. Each finding should directly address the research question.\n" +
  "3. Assign confidence per finding: high (multiple primary sources, unanimous votes), medium (secondary sources or split votes), low (single source or blog-quality).\n" +
  "4. Write a 3-5 sentence executive summary answering the research question.\n" +
  "5. Note caveats: what's uncertain, what sources were weak, what time-sensitivity applies.\n" +
  "6. List 2-4 open questions that emerged but weren't answered.\n\nStructured output only.",
  { label: "synthesize", schema: REPORT_SCHEMA }
), { label: "synthesize", isEmpty: isEmptyReport })

if (!report) {
  // Synthesis skipped/errored — salvage the verified claims raw rather
  // than throwing on report.findings and discarding the whole run.
  return {
    question: QUESTION,
    summary: "Synthesis step was skipped or failed — returning " + confirmed.length + " verified claims unmerged.",
    findings: [],
    confirmed: confirmed.map(c => ({ claim: c.claim, source: c.sourceUrl, quote: c.quote, vote: (c.verdicts.length - c.refutedVotes) + "-" + c.refutedVotes })),
    refuted: killed.map(c => ({ claim: c.claim, vote: (c.verdicts.length - c.refutedVotes) + "-" + c.refutedVotes, source: c.sourceUrl })),
    sources: allSources.map(s => ({ url: s.url, quality: s.sourceQuality, claimCount: s.claims.length })),
    stats: { angles: scope.angles.length, sources: allSources.length, claims: allClaims.length, verified: voted.length, confirmed: confirmed.length, killed: killed.length, afterSynthesis: 0, retriesUsed },
  }
}

return {
  question: QUESTION,
  ...report,
  refuted: killed.map(c => ({ claim: c.claim, vote: (c.verdicts.length - c.refutedVotes) + "-" + c.refutedVotes, source: c.sourceUrl })),
  sources: allSources.map(s => ({ url: s.url, quality: s.sourceQuality, angle: s.angle, claimCount: s.claims.length })),
  stats: {
    angles: scope.angles.length,
    sourcesFetched: allSources.length,
    claimsExtracted: allClaims.length,
    claimsVerified: voted.length,
    confirmed: confirmed.length,
    killed: killed.length,
    afterSynthesis: report.findings.length,
    urlDupes: dupes.length,
    budgetDropped: budgetDropped.length,
    retriesUsed,
    agentCalls: 1 + scope.angles.length + allSources.length + (voted.length * VOTES_PER_CLAIM) + 1 + retriesUsed,
  },
}
