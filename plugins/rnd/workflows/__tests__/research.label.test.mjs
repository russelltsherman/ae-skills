// Unit tests for the Fetch-phase label helper in ../research.js.
//
// Same block-extraction trick as research.retry/limiter tests: the workflow file
// can't be imported (its body runs at load and calls runtime globals), so we
// extract the self-contained "fetch label (testable)" block and evaluate it in
// isolation. This tests the REAL source — no duplication.
//
// Run: node --test plugins/rnd/workflows/__tests__/research.label.test.mjs

import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC = readFileSync(join(__dirname, "..", "research.js"), "utf8")

const START = "// --- fetch label (testable) "
const END = "// --- end fetch label "
const startIdx = SRC.indexOf(START)
const endIdx = SRC.indexOf(END)
assert.ok(startIdx !== -1 && endIdx !== -1 && endIdx > startIdx,
  "could not locate the testable fetch-label block markers in research.js")
const BLOCK = SRC.slice(startIdx, endIdx)

function loadLabel() {
  const factory = new Function(BLOCK + "\nreturn { fetchHost, fetchLabel };")
  return factory()
}

test("absolute https URL → bare hostname", () => {
  const { fetchLabel } = loadLabel()
  assert.equal(fetchLabel({ url: "https://www.example.com/a/b?q=1" }), "fetch:example.com")
})

test("strips a leading www.", () => {
  const { fetchHost } = loadLabel()
  assert.equal(fetchHost("https://www.nytimes.com/x"), "nytimes.com")
  assert.equal(fetchHost("https://news.ycombinator.com/x"), "news.ycombinator.com")
})

test("scheme-less URL is recovered via https:// prefix (the old 'unknown' case)", () => {
  const { fetchLabel } = loadLabel()
  assert.equal(fetchLabel({ url: "example.com/page" }), "fetch:example.com")
  assert.equal(fetchLabel({ url: "www.example.org/path?x=1" }), "fetch:example.org")
})

test("protocol-relative URL (//host/path) is recovered", () => {
  const { fetchHost } = loadLabel()
  assert.equal(fetchHost("//cdn.example.net/a"), "cdn.example.net")
})

test("unparseable URL falls back to a slug of the title, not 'unknown'", () => {
  const { fetchLabel } = loadLabel()
  assert.equal(
    fetchLabel({ url: "not a url at all", title: "Deep Dive Into Rate Limiting" }),
    "fetch:Deep Dive Into Rate Limiting"
  )
})

test("title fallback collapses whitespace and truncates to 40 chars", () => {
  const { fetchLabel } = loadLabel()
  const out = fetchLabel({ url: "", title: "  A   very    long\ttitle that exceeds the forty character budget easily  " })
  assert.equal(out, "fetch:A very long title that exceeds the forty")
  assert.ok(out.length <= "fetch:".length + 40)
})

test("no usable url and no title → 'fetch:unknown' (graceful last resort)", () => {
  const { fetchLabel } = loadLabel()
  assert.equal(fetchLabel({ url: "", title: "" }), "fetch:unknown")
  assert.equal(fetchLabel({}), "fetch:unknown")
  assert.equal(fetchLabel(null), "fetch:unknown")
})

test("fetchHost returns null (not the string 'unknown') for bad input", () => {
  const { fetchHost } = loadLabel()
  assert.equal(fetchHost(""), null)
  assert.equal(fetchHost(null), null)
  assert.equal(fetchHost(undefined), null)
  assert.equal(fetchHost(42), null)
})
