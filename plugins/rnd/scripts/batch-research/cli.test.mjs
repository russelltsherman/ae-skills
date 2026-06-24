// Integration tests for cli.mjs — the only place /ae-research touches disk.
// Each test runs the real CLI as a subprocess against a throwaway temp dir, so
// it exercises filesystem behavior end-to-end (render + write + README regen).
//
// Run: node --test plugins/rnd/scripts/batch-research/cli.test.mjs

import { test } from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const CLI = join(__dirname, "cli.mjs")
const DATE = "2026-06-24"

function tmp() {
  return mkdtempSync(join(tmpdir(), "ae-research-cli-"))
}
function run(args, cwd) {
  return execFileSync("node", [CLI, ...args], { cwd, encoding: "utf8" })
}

const FULL_ENTRY = {
  topic: "spec driven design",
  slug: "spec-driven-design",
  report: {
    summary: "Spec-driven development inverts the code/spec relationship.",
    findings: [
      {
        claim: "SDD makes the specification the primary artifact.",
        confidence: "high",
        sources: ["https://github.com/github/spec-kit"],
        evidence: "Spec-kit: 'code serves specifications.'",
      },
    ],
    caveats: "Source mix is vendor-heavy.",
    openQuestions: ["Does SDD improve quality?"],
    sources: [{ url: "https://github.com/github/spec-kit", quality: "primary" }],
    stats: { angles: 5, retriesUsed: 0 },
  },
  error: null,
}

// --- write-one ---

test("write-one renders a single report and regenerates the README", () => {
  const dir = tmp()
  try {
    const researchDir = join(dir, "research")
    const resultFile = join(dir, "one.json")
    writeFileSync(resultFile, JSON.stringify(FULL_ENTRY))

    const out = run(["write-one", resultFile, researchDir, DATE], dir)

    const reportPath = join(researchDir, "spec-driven-design.md")
    assert.ok(existsSync(reportPath), "report file was written")
    const md = readFileSync(reportPath, "utf8")
    assert.match(md, /^# spec driven design$/m)
    assert.match(md, /SDD makes the specification the primary artifact/)

    const readme = readFileSync(join(researchDir, "README.md"), "utf8")
    assert.match(readme, /\[spec driven design\]\(spec-driven-design\.md\)/)
    assert.match(out, /spec driven design →/)
    assert.match(out, /README index now lists 1/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("write-one is incremental: two calls leave both reports + a 2-entry index", () => {
  const dir = tmp()
  try {
    const researchDir = join(dir, "research")

    const a = join(dir, "a.json")
    writeFileSync(a, JSON.stringify(FULL_ENTRY))
    run(["write-one", a, researchDir, DATE], dir)
    // After the FIRST call the report is already on disk — the whole point.
    assert.ok(existsSync(join(researchDir, "spec-driven-design.md")))

    const b = join(dir, "b.json")
    writeFileSync(
      b,
      JSON.stringify({ topic: "domain driven design", slug: "domain-driven-design", report: null, error: "workflow timed out" })
    )
    const out = run(["write-one", b, researchDir, DATE], dir)

    assert.ok(existsSync(join(researchDir, "domain-driven-design.md")))
    const incomplete = readFileSync(join(researchDir, "domain-driven-design.md"), "utf8")
    assert.match(incomplete, /⚠️ \*\*Incomplete\*\* — workflow timed out/)
    assert.match(out, /\(incomplete\)/)

    const readme = readFileSync(join(researchDir, "README.md"), "utf8")
    assert.match(readme, /domain-driven-design\.md/)
    assert.match(readme, /spec-driven-design\.md/)
    assert.match(out, /README index now lists 2/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("write-one derives the slug from the topic when slug is omitted", () => {
  const dir = tmp()
  try {
    const researchDir = join(dir, "research")
    const resultFile = join(dir, "noslug.json")
    const { slug, ...rest } = FULL_ENTRY
    writeFileSync(resultFile, JSON.stringify(rest))
    run(["write-one", resultFile, researchDir, DATE], dir)
    assert.ok(existsSync(join(researchDir, "spec-driven-design.md")))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("write-one rejects an array (must be a single object)", () => {
  const dir = tmp()
  try {
    const researchDir = join(dir, "research")
    const resultFile = join(dir, "arr.json")
    writeFileSync(resultFile, JSON.stringify([FULL_ENTRY]))
    assert.throws(() => run(["write-one", resultFile, researchDir, DATE], dir), /single .* object/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("write-one preserves backticks/code in report content (no fence corruption)", () => {
  const dir = tmp()
  try {
    const researchDir = join(dir, "research")
    const resultFile = join(dir, "ticks.json")
    const entry = {
      topic: "x",
      slug: "x",
      report: { summary: "Use ```bash and `inline` code.", findings: [{ claim: "c", confidence: "high", sources: [], evidence: "e" }], caveats: "" },
      error: null,
    }
    writeFileSync(resultFile, JSON.stringify(entry))
    run(["write-one", resultFile, researchDir, DATE], dir)
    const md = readFileSync(join(researchDir, "x.md"), "utf8")
    assert.match(md, /Use ```bash and `inline` code\./)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

// --- write (array) still works after the refactor ---

test("write renders every entry in the array and indexes them", () => {
  const dir = tmp()
  try {
    const researchDir = join(dir, "research")
    const resultsFile = join(dir, "results.json")
    writeFileSync(
      resultsFile,
      JSON.stringify([
        FULL_ENTRY,
        { topic: "domain driven design", slug: "domain-driven-design", report: { findings: [] }, error: null },
      ])
    )
    const out = run(["write", resultsFile, researchDir, DATE], dir)
    assert.ok(existsSync(join(researchDir, "spec-driven-design.md")))
    assert.ok(existsSync(join(researchDir, "domain-driven-design.md")))
    assert.match(out, /Wrote 2 report\(s\): 1 complete, 1 incomplete/)
    assert.match(out, /README index now lists 2/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
