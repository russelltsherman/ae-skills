// Unit tests for the concurrency limiter in ../research.js.
//
// Like research.retry.test.mjs, the workflow file can't be imported directly (its
// body runs at module load and calls workflow-runtime globals). We extract the
// self-contained "concurrency limiter (testable)" block verbatim and evaluate it
// in isolation. This tests the REAL source — no duplication.
//
// Run: node --test plugins/rnd/workflows/__tests__/research.limiter.test.mjs

import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC = readFileSync(join(__dirname, "..", "research.js"), "utf8")

const START = "// --- concurrency limiter (testable) "
const END = "// --- end concurrency limiter "
const startIdx = SRC.indexOf(START)
const endIdx = SRC.indexOf(END)
assert.ok(startIdx !== -1 && endIdx !== -1 && endIdx > startIdx,
  "could not locate the testable concurrency-limiter block markers in research.js")
const BLOCK = SRC.slice(startIdx, endIdx)

function loadLimiter() {
  const factory = new Function(
    BLOCK + "\nreturn { MAX_CONCURRENT_AGENTS, createLimiter };"
  )
  return factory()
}

// A deferred promise plus a hook the harness controls to release it.
function deferred() {
  let resolve, reject
  const promise = new Promise((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

test("MAX_CONCURRENT_AGENTS is a small positive integer", () => {
  const { MAX_CONCURRENT_AGENTS } = loadLimiter()
  assert.ok(Number.isInteger(MAX_CONCURRENT_AGENTS) && MAX_CONCURRENT_AGENTS >= 1)
  assert.ok(MAX_CONCURRENT_AGENTS <= 16, "must be at/below the runtime cap to actually throttle")
})

test("never exceeds the limit; peak concurrency is bounded", async () => {
  const { createLimiter } = loadLimiter()
  const limit = 3
  const gate = createLimiter(limit)

  let active = 0
  let peak = 0
  const gates = []
  // 10 tasks, each blocks on its own deferred so we control when slots free up.
  const promises = Array.from({ length: 10 }, () => {
    const d = deferred()
    gates.push(d)
    return gate(async () => {
      active++
      peak = Math.max(peak, active)
      await d.promise
      active--
      return "done"
    })
  })

  // Let microtasks settle: exactly `limit` tasks should be active.
  await new Promise((r) => setTimeout(r, 10))
  assert.equal(active, limit, "exactly `limit` tasks run before any completes")

  // Release one at a time; each release admits exactly one queued task.
  for (const d of gates) {
    d.resolve()
    await new Promise((r) => setTimeout(r, 5))
    assert.ok(active <= limit, "active count never exceeds the limit")
  }

  const out = await Promise.all(promises)
  assert.deepEqual(out, Array(10).fill("done"))
  assert.equal(peak, limit, "peak concurrency equals the limit, never more")
})

test("limit of 1 fully serializes execution", async () => {
  const { createLimiter } = loadLimiter()
  const gate = createLimiter(1)
  const order = []
  const tasks = [0, 1, 2].map((i) =>
    gate(async () => {
      order.push("start" + i)
      await new Promise((r) => setTimeout(r, 1))
      order.push("end" + i)
      return i
    })
  )
  const out = await Promise.all(tasks)
  assert.deepEqual(out, [0, 1, 2])
  // Serialized: every start is immediately followed by its own end.
  assert.deepEqual(order, ["start0", "end0", "start1", "end1", "start2", "end2"])
})

test("a thunk that throws rejects only its own promise; others proceed", async () => {
  const { createLimiter } = loadLimiter()
  const gate = createLimiter(2)
  const results = await Promise.allSettled([
    gate(async () => { throw new Error("boom") }),
    gate(async () => "ok-1"),
    gate(async () => "ok-2"),
  ])
  assert.equal(results[0].status, "rejected")
  assert.match(results[0].reason.message, /boom/)
  assert.equal(results[1].status, "fulfilled")
  assert.equal(results[1].value, "ok-1")
  assert.equal(results[2].value, "ok-2")
})

test("a thrown thunk still frees its slot (no leak/deadlock)", async () => {
  const { createLimiter } = loadLimiter()
  const gate = createLimiter(1)
  // With limit 1, if a throwing task failed to free its slot, the next would hang.
  await assert.rejects(gate(async () => { throw new Error("x") }))
  const out = await gate(async () => "recovered")
  assert.equal(out, "recovered", "slot was released after the throw")
})

test("resolves with the thunk's return value", async () => {
  const { createLimiter } = loadLimiter()
  const gate = createLimiter(4)
  const v = await gate(async () => ({ findings: [1, 2] }))
  assert.deepEqual(v, { findings: [1, 2] })
})

test("empty workload is a no-op", () => {
  const { createLimiter } = loadLimiter()
  const gate = createLimiter(4)
  assert.equal(typeof gate, "function")
})
