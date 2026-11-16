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
it. Before creating any page, also read `reference/NAMING.md`: page filenames are the vault's
link targets, and its rules keep them unique, predictable and stable. The vault's structure and frontmatter follow OKF v0.1; bodies use Obsidian `[[wikilinks]]`
(an Obsidian convention, NOT OKF — OKF uses markdown links).

Pick the operation that matches the user's intent: Ingest, Query, or Lint.

## Ingest
Trigger: the user gives you a source (URL, file path, pasted text, or "save these takeaways").

Handle EACH source independently. If given several at once, run the gate (steps 1-2) on each one
on its own — a usable source must never carry a broken one through, and one failure must never
abort the usable ones. Report a per-source PASS/FAIL summary at the end.

Steps (per source):
1. Read the source. For a URL use WebFetch (the raw copy is downloaded separately in step 4); for a PDF/file use Read; for pasted text use it
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
4. Check whether the source is already in the vault (see "Re-ingesting a source" below); if
   it is, follow that section through the remaining steps. Then store the raw copy in the
   vault's `raw/` directory (see "Raw copies" below). Do this before writing any wiki page, so
   every page you write can point at a copy that already exists.
5. Determine the page type per the schema: `Article`/`Paper` (sources/), `Concept`
   (concepts/), `Entity` (entities/), `Note`/`Decision`/`Goal` (notes/). Name every new page by
   `reference/NAMING.md`: search for an existing page under any name first, pick the prefix
   from what the thing is, give concepts and entities `aliases:`, and create a page only when
   the idea can carry one.
6. Create or update the source page in the vault's `sources/` with full frontmatter and a
   faithful `# Summary` plus `# Citations`. Set `resource:` to the raw copy's vault-relative path
   (`raw/<file>`) and `origin:` to where it came from (the URL, or the path the user gave).
   Write only what you actually extracted — never invent fields, findings, or citations to fill
   a sparse source; if it is that sparse, it should have failed the gate. Follow "Carrying a
   source over faithfully" below.
7. Create or update related `concepts/` and `entities/` pages, following the same faithfulness
   rules. Add `[[wikilinks]]` in BOTH directions between related pages. Reuse existing pages; do
   not duplicate.
8. Set/refresh `timestamp` on every page you touch (ISO 8601).
9. Append an entry to the vault's `log.md` under today's `## YYYY-MM-DD` heading using
   `**Creation**`/`**Update**` prefixes and wikilinks to changed pages.
10. Run the validator (see Validator below). Fix any errors; resolve warnings where reasonable.
    Report what you changed.

### Raw copies
The vault keeps an immutable copy of every ingested source in `raw/`, so a page's claims can
always be checked against exactly what was read, and the link to it travels with the vault
instead of pointing at a path that only exists on one machine.

- **Local file** (Markdown, PDF, text…): copy it byte-for-byte with `cp`. Keep its original
  filename.
- **URL**: download the original with `curl -fsSL -o raw/<name> <url>`, naming it after the
  last path segment plus the right extension (`.html`, `.pdf`…). WebFetch returns a processed
  rendering, not the document, so it is for reading only, never for the copy. If the download
  fails but WebFetch worked, save WebFetch's text as `raw/<name>.md` and say in the source
  page's summary that the raw copy is an extraction, not the original.
- **Pasted text or chat takeaways**: write the text exactly as given to
  `raw/<source-page-stem>.txt` (`.txt`, so Obsidian doesn't show it as a second note).
- Whether a file in `raw/` is "the same source" is decided by the source page that points at
  it, not by filename: if an existing source page has the same `origin` (see "Re-ingesting a
  source" below), this is a re-ingest — overwrite that page's raw copy and log an `**Update**`;
  git history keeps the old version. Otherwise, if the name is already taken, the new source is
  a different one that happens to share a filename: add a short suffix (`-2`) rather than
  overwrite.
- Never edit a raw copy after it is stored, and never give it frontmatter. It is the source,
  not a wiki page; the validator skips `raw/` for that reason.

### Re-ingesting a source
A source may already be in the vault: the user re-runs an ingest, a report was regenerated, or
an older page was written before raw copies existed. Re-ingest updates what is there; it never
starts a parallel set of pages. Before step 4, look for an existing source page:

1. **Find it.** Match in this order, and stop at the first hit:
   - a source page whose `origin:` is this source (same URL, or same path);
   - a source page whose `resource:` ends in this source's filename — older pages stored the
     original path there, often an absolute path from another machine or a folder that no
     longer exists, so compare filenames, not whole paths;
   - a source page whose title clearly names the same document.
   If two pages match, don't guess: tell the user and ask which one to keep.
2. **Update it in place.** Keep the page's filename and its existing wikilinks so nothing that
   links to it breaks. Store the raw copy, then set `resource: raw/<file>` and `origin:`.
   Rewrite the summary against the source with the faithfulness rules below, and fill in
   whatever the old page lacks (open questions, confidence levels, missing citations). Keep
   anything the old page has that is still true of the source.
3. **Revise only what came from this source.** Concept and entity pages usually draw on several
   sources. On those, change, hedge or add the claims this source supports, and leave content
   that came from other sources alone, even though this source doesn't support it: it isn't
   unsupported, it's someone else's. If you can't tell where a line came from, keep it. Remove
   or correct a line only when *this* source contradicts it, and say so in the log entry.
4. **Don't duplicate index entries.** Update the existing `index.md` line in place if its
   description is now wrong; don't add a second one.
5. **Log it as an update.** Use `**Update**` lines in `log.md`, saying what changed (e.g.
   "added open questions and confidence levels; raw copy stored; resource now points at it").
6. **Unchanged source, nothing new?** If the source page already points at a raw copy that is
   byte-identical to the source and already meets the faithfulness rules, say so and stop,
   without touching timestamps or the log.

### Carrying a source over faithfully
A source page is a compressed copy of the source, and the concept and entity pages are
compressed again from it. Each compression tends to drop the hedges and keep the headlines, so
over several ingests the wiki becomes more certain than its sources ever were. These rules
exist to stop that drift. They matter most for structured research reports (findings with
confidence levels, caveats, open questions, refuted claims), but apply them to any source that
has these parts.

- **Keep how sure the source is.** If the source rates a claim (high/medium/low, a vote, "one
  vendor source"), carry the rating onto every page that repeats the claim — concept and entity
  pages included, not just the source page. A medium or low claim must not read as plain fact
  anywhere in the wiki. Where the source says a point is contested, say so and name both sides.
- **Keep the qualifications attached.** When the source qualifies a claim ("not strictly X",
  "self-reported, correlation not cause", "lab metrics only", "this framing has softened"), the
  qualification travels with the claim. Don't drop the qualifier to make a sentence shorter.
- **Keep an attribution an attribution.** If the source reports a position as one person's or
  one side's ("Martin defends TDD as…"), the wiki reports it the same way; don't restate it in
  the wiki's own voice as the conclusion.
- **Carry open questions over.** If the source lists open questions or gaps, give the source
  page an `# Open questions` section with them. They are the leads for the next round of
  research, and they're the part most often lost.
- **Note refuted claims briefly** on the source page, so a later ingest doesn't re-add them as
  fact.
- **Add nothing the source doesn't support.** Diagrams, examples and "Related" links are the
  usual places where unsupported content slips in — e.g. a diagram showing a design choice the
  source lists as an open question. If you draw on another vault page, link it so the claim's
  real origin is visible. A detail can't come from the source if the source doesn't contain it.
  This rule governs what you *add*; it is not a reason to delete what other sources put on a
  shared page.
- **Update existing pages the source challenges.** When a source critiques or qualifies
  something an existing concept or entity page states (a company's approach that failed, a
  person's claim that others dispute), add that to the existing page, linked to the new source
  page. A page that only records an entity's own account goes stale as soon as a critique is
  ingested.
- **Cite what the claims rest on.** In `# Citations`, include every source the kept findings
  cite as evidence, not only the most prominent ones. A study named in the summary should also
  appear as a citation.

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
   (no inbound `[[wikilinks]]`; reserved `index.md`/`log.md` are exempt), obvious gaps
   (referenced but missing pages), and naming problems: pages that break `reference/NAMING.md`,
   and pairs of pages that look like the same idea under two names. For each, propose the
   rename or merge, listing every file whose links it would rewrite.
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
- Obey the schema (`reference/SCHEMA.md`) and the naming rules (`reference/NAMING.md`). One
  concept per file; `<prefix>-<name>` filenames, unique across the vault; required `type`.
- Never rename an existing page during Ingest, even one that predates the naming rules;
  propose renames in Lint.
- Never overwrite the user's own words in `notes/`; augment around them.
- Never edit a stored raw copy in `raw/`; it is the immutable record of what was ingested.
- Never create a page to represent a source you could not actually read or that failed the
  completeness gate. Real content earns a page; a broken or empty source earns a `**Failure**`
  log line and a report — not a stub. When in doubt, fail loudly rather than fabricate quietly.
- End every write operation by running the validator and reporting the result.
