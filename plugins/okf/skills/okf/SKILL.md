---
name: okf
description: >-
  Maintain the personal OKF knowledge base in vault/. Use when the user wants to ingest a
  source into their knowledge base or notes (an article, URL, PDF, paper, raw thought, or
  takeaways from a chat), ask what their knowledge base knows about a topic, or check/lint
  the knowledge base for staleness, contradictions, orphans, or broken links. Triggers on
  phrases like "add this to my KB / notes / second brain", "save this to my knowledge base",
  "what do I know about X", "what's in my notes about X", or "lint/check my knowledge base".
  Do NOT use for ordinary coding, file edits, or web questions unrelated to the vault.
---

# OKF Knowledge Base Maintainer

You maintain a personal OKF v0.1 knowledge base — a "vault" the user browses in Obsidian. The
skill machinery (this prose, the schema contract, the validator) travels with this plugin; the
vault is the user's own data and lives wherever they keep it, NOT inside this plugin and not
necessarily in the current working directory. So always: **locate the vault, read the schema,
then run the operation.**

## Step 0 — Locate the vault (do this first, every time)
The vault's absolute path is stored per-project in `.claude/okf.local.md` (relative to the
current repo), as YAML frontmatter:

```
---
vault_path: /absolute/path/to/your/vault
---
```

1. Read `.claude/okf.local.md`. If it exists with a non-empty `vault_path`, use that absolute
   path as **the vault** for every step below, after confirming the directory exists.
2. If the file is missing, or `vault_path` is empty/invalid/points at a nonexistent directory,
   ASK the user for the absolute path to their OKF vault directory. Do NOT guess, and do NOT
   create a `vault/` in the current directory. Confirm the path is a directory that looks like a
   vault (it normally contains pages plus `index.md`/`log.md`, and an `.obsidian/` folder). Then
   write `.claude/okf.local.md` with their `vault_path` so you never have to ask again, and tell
   the user it's saved (it is user-local and should be gitignored — see the plugin README).

Throughout the operations below, **"the vault"** means this resolved absolute path. Substitute it
for every `vault` validator argument and every `vault/...` path (e.g. the vault's `log.md`).

Then read the OKF schema contract — bundled with this skill at `reference/SCHEMA.md` — and obey
it. The vault's structure and frontmatter follow OKF v0.1; bodies use Obsidian `[[wikilinks]]`
(an Obsidian convention, NOT OKF — OKF uses markdown links).

Pick the operation that matches the user's intent: Ingest, Query, or Lint.

## Ingest
Trigger: the user gives you a source (URL, file path, pasted text, or "save these takeaways").

Handle EACH source independently. If given several at once, run the gate (steps 1-2) on each one
on its own — a usable source must never carry a broken one through, and one failure must never
abort the usable ones. Report a per-source PASS/FAIL summary at the end.

Steps (per source):
1. Read the source. For a URL use WebFetch; for a PDF/file use Read; for pasted text use it
   directly; for chat takeaways use the conversation.
2. COMPLETENESS GATE — mandatory, before ANY write. State an explicit verdict for this source:
   USABLE or REJECT. REJECT if ANY of these is true:
   - you could not actually read/extract it (fetch failed, paywall, error, unreadable);
   - the body is empty, truncated, or a placeholder;
   - the summary/content is filler ("test", "TODO", "lorem ipsum", "n/a", or similar);
   - there are no substantive, verifiable findings — only a title, headings, or a link list.
   On REJECT: write NOTHING for this source — no source, concept, or entity pages — then report
   the failure to the user naming the source and the specific failing criterion, and record a
   `**Failure**` line in the vault's `log.md`. Never manufacture pages to stand in for a source
   you could not genuinely ingest; a stub that mimics knowledge is worse than an honest, reported
   gap, and it hides the failure. Only a USABLE verdict proceeds to step 3.
3. Tell the user the 2-5 key takeaways and confirm scope if ambiguous.
4. Determine the page type per the schema: `Article`/`Paper` (sources/), `Concept`
   (concepts/), `Entity` (entities/), `Note`/`Decision`/`Goal` (notes/).
5. Create or update the source page in the vault's `sources/` with full frontmatter (include
   `resource`) and a faithful `# Summary` plus `# Citations`. Write only what you actually
   extracted — never invent fields, findings, or citations to fill a sparse source; if it is that
   sparse, it should have failed the gate.
6. Create or update related `concepts/` and `entities/` pages. Add `[[wikilinks]]` in BOTH
   directions between related pages. Reuse existing pages; do not duplicate.
7. Set/refresh `timestamp` on every page you touch (ISO 8601).
8. Append an entry to the vault's `log.md` under today's `## YYYY-MM-DD` heading using
   `**Creation**`/`**Update**` prefixes and wikilinks to changed pages.
9. Run the validator (see Validator below). Fix any errors; resolve warnings where reasonable.
   Report what you changed.

## Query
Trigger: "what do I know about X", "what's in my notes about X".
Steps:
1. Search the vault for relevant pages (by filename, frontmatter, and body text).
2. Answer from those pages, citing them as `[[stem]]`. Do not re-read raw external sources
   unless the vault is insufficient; if it is, say so.
3. If the synthesized answer is durable and not already captured, offer to save it as a new
   `Concept` page (and if the user agrees, follow the Ingest write/log/validate steps).

## Lint
Trigger: "lint/check my knowledge base".
Steps:
1. Run the validator (see Validator below) and report errors/warnings.
2. Additionally scan for: contradictions between pages, stale `timestamp`s, orphan pages
   (no inbound `[[wikilinks]]`; reserved `index.md`/`log.md` are exempt), and obvious gaps
   (referenced but missing pages).
3. Present findings as a list. Apply fixes ONLY after the user confirms, then re-run the
   validator and append a `log.md` entry.

## Validator
The bundle validator ships with this plugin. Run it against the resolved vault path (Step 0):

```
python3 "${CLAUDE_PLUGIN_ROOT}/scripts/okf-validate/okf_validate.py" "<vault_path>"
```

`<vault_path>` is the absolute path from `.claude/okf.local.md`. It requires PyYAML
(`pip install pyyaml`; see `scripts/okf-validate/requirements.txt`). Exit code 0 = no errors
(warnings allowed), 1 = at least one error, 2 = usage/dependency problem.

## Always
- Locate the vault (Step 0) before any operation; never assume `./vault` or invent a path.
- Obey the schema (`reference/SCHEMA.md`). One concept per file; kebab-case filenames; required `type`.
- Never overwrite the user's own words in `notes/`; augment around them.
- Never create a page to represent a source you could not actually read or that failed the
  completeness gate. Real content earns a page; a broken or empty source earns a `**Failure**`
  log line and a report — not a stub. When in doubt, fail loudly rather than fabricate quietly.
- End every write operation by running the validator and reporting the result.
