// Unit tests for the synthesize-failure salvage helper in ../research.js.
//
// Same block-extraction trick as research.label/retry/limiter tests: the workflow
// file can't be imported (its body runs at load and calls runtime globals), so we
// extract the self-contained "salvage findings (testable)" block and evaluate it
// in isolation. This tests the REAL source — no duplication.
//
// Run: node --test plugins/rnd/workflows/__tests__/research.salvage.test.mjs

import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC = readFileSync(join(__dirname, "..", "research.js"), "utf8")

const START = "// --- salvage findings (testable) "
const END = "// --- end salvage findings "
const startIdx = SRC.indexOf(START)
const endIdx = SRC.indexOf(END)
assert.ok(startIdx !== -1 && endIdx !== -1 && endIdx > startIdx,
  "could not locate the testable salvage-findings block markers in research.js")
const BLOCK = SRC.slice(startIdx, endIdx)

function loadSalvage() {
  const factory = new Function(BLOCK + "\nreturn { salvageFindings, confRank };")
  return factory()
}

test("maps each confirmed claim to a REPORT_SCHEMA-shaped finding", () => {
  const { salvageFindings } = loadSalvage()
  const out = salvageFindings([
    {
      claim: "X is true",
      sourceUrl: "https://example.com/x",
      quote: "the source says X",
      refutedVotes: 0,
      verdicts: [
        { refuted: false, confidence: "medium", evidence: "ev-medium" },
        { refuted: false, confidence: "high", evidence: "ev-high" },
      ],
    },
  ])
  assert.equal(out.length, 1)
  const f = out[0]
  assert.deepEqual(Object.keys(f).sort(), ["claim", "confidence", "evidence", "sources", "vote"])
  assert.equal(f.claim, "X is true")
  assert.equal(f.confidence, "high")            // best (highest) of medium/high
  assert.deepEqual(f.sources, ["https://example.com/x"])
  assert.equal(f.evidence, "ev-high")           // evidence from the best verdict
  assert.equal(f.vote, "2-0")                   // 2 valid, 0 refuted
})

test("vote string reflects refuted count; confidence from best non-refuted verdict", () => {
  const { salvageFindings } = loadSalvage()
  const [f] = salvageFindings([
    {
      claim: "Y",
      sourceUrl: "https://e.com/y",
      quote: "q",
      refutedVotes: 1,
      verdicts: [
        { refuted: true, confidence: "high", evidence: "refuting" },
        { refuted: false, confidence: "low", evidence: "supporting" },
      ],
    },
  ])
  assert.equal(f.confidence, "low")             // only non-refuted verdict is low
  assert.equal(f.evidence, "supporting")        // never use a refuting verdict's evidence
  assert.equal(f.vote, "1-1")
})

test("falls back to low confidence and quote evidence when no positive verdicts", () => {
  const { salvageFindings } = loadSalvage()
  const [f] = salvageFindings([
    { claim: "Z", sourceUrl: "https://e.com/z", quote: "quoted text", refutedVotes: 0, verdicts: [] },
  ])
  assert.equal(f.confidence, "low")
  assert.equal(f.evidence, "quoted text")
  assert.equal(f.vote, "0-0")
})

test("derives refutedVotes from verdicts when the field is absent", () => {
  const { salvageFindings } = loadSalvage()
  const [f] = salvageFindings([
    {
      claim: "W",
      sourceUrl: "https://e.com/w",
      quote: "q",
      verdicts: [
        { refuted: true, confidence: "high", evidence: "a" },
        { refuted: false, confidence: "medium", evidence: "b" },
        { refuted: false, confidence: "high", evidence: "c" },
      ],
    },
  ])
  assert.equal(f.vote, "2-1")                   // 3 verdicts, 1 refuted
  assert.equal(f.confidence, "high")
})

test("missing sourceUrl → empty sources array (never undefined)", () => {
  const { salvageFindings } = loadSalvage()
  const [f] = salvageFindings([
    { claim: "no source", quote: "", refutedVotes: 0, verdicts: [] },
  ])
  assert.deepEqual(f.sources, [])
  assert.equal(f.evidence, "")
})

test("empty / nullish input → empty array (no throw)", () => {
  const { salvageFindings } = loadSalvage()
  assert.deepEqual(salvageFindings([]), [])
  assert.deepEqual(salvageFindings(null), [])
  assert.deepEqual(salvageFindings(undefined), [])
})

test("every produced finding satisfies REPORT_SCHEMA's required finding fields", () => {
  const { salvageFindings } = loadSalvage()
  const out = salvageFindings([
    { claim: "a", sourceUrl: "https://e.com/a", quote: "qa", refutedVotes: 0,
      verdicts: [{ refuted: false, confidence: "medium", evidence: "ea" }] },
    { claim: "b", sourceUrl: "https://e.com/b", quote: "qb", refutedVotes: 0, verdicts: [] },
  ])
  for (const f of out) {
    for (const k of ["claim", "confidence", "sources", "evidence"]) {
      assert.ok(f[k] !== undefined, "finding missing required field: " + k)
    }
    assert.ok(["high", "medium", "low"].includes(f.confidence))
    assert.ok(Array.isArray(f.sources))
  }
})
