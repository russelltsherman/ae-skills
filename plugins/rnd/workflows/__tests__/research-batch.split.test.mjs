// Unit tests for the per-run topic cap in ../research-batch.js.
//
// Same block-extraction trick as the research.* tests: the workflow body runs at
// load and calls runtime globals, so we extract the self-contained "run split
// (testable)" block and evaluate it in isolation. This tests the REAL source.
//
// Run: node --test plugins/rnd/workflows/__tests__/research-batch.split.test.mjs

import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC = readFileSync(join(__dirname, "..", "research-batch.js"), "utf8")

const START = "// --- run split (testable) "
const END = "// --- end run split "
const startIdx = SRC.indexOf(START)
const endIdx = SRC.indexOf(END)
assert.ok(startIdx !== -1 && endIdx !== -1 && endIdx > startIdx,
  "could not locate the testable run-split block markers in research-batch.js")
const { splitRun, MAX_TOPICS_PER_RUN } =
  new Function(SRC.slice(startIdx, endIdx) + "\nreturn { splitRun, MAX_TOPICS_PER_RUN };")()

const topics = (n) => Array.from({ length: n }, (_, i) => ({ topic: "t" + i, slug: "t" + i }))

test("default cap keeps a full run well under the 1,000-agent limit", () => {
  // ~100 agents per topic before retries; leave at least 2x headroom.
  assert.ok(MAX_TOPICS_PER_RUN * 100 <= 500)
})

test("a list within the cap runs entirely, nothing deferred", () => {
  const { now, deferred } = splitRun(topics(3), 5)
  assert.equal(now.length, 3)
  assert.deepEqual(deferred, [])
})

test("a long list is split in order: first `max` now, the rest deferred", () => {
  const { now, deferred } = splitRun(topics(12), 5)
  assert.deepEqual(now.map((t) => t.slug), ["t0", "t1", "t2", "t3", "t4"])
  assert.deepEqual(deferred.map((t) => t.slug), ["t5", "t6", "t7", "t8", "t9", "t10", "t11"])
})

test("an invalid max falls back to the default cap", () => {
  for (const bad of [0, -1, 2.5, "7", null, undefined]) {
    assert.equal(splitRun(topics(20), bad).now.length, MAX_TOPICS_PER_RUN)
  }
})
