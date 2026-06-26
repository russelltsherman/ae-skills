# OKF Vault Schema (the maintainer's contract)

This file defines how the `vault/` knowledge base is structured and maintained. The OKF
maintainer skill MUST obey it. The directory layout and YAML frontmatter follow Google's
Open Knowledge Format (OKF) v0.1; the operating model follows Karpathy's LLM-Wiki pattern.
CAVEAT: body cross-links use Obsidian `[[wikilinks]]`, which OKF does NOT define (OKF uses
standard markdown links). So this bundle is OKF-conformant in structure/frontmatter but NOT
in body link syntax. Portability to other OKF consumers (a wikilink->markdown export) is a
Phase 3 item, not done here.

## Layers
- Raw sources (immutable): external articles/PDFs/chats. NOT copied wholesale. A page in
  `sources/` records a faithful summary plus a `resource:` URI/path back to the original.
- Wiki (agent-owned): `concepts/` and `entities/`. The agent creates, updates, links, and
  keeps these consistent.
- Human layer: `notes/`. The user's own thinking. The agent organizes but treats user text
  as more authoritative than its own summaries; it does not silently overwrite user words.

## Directories and the `type` they hold
- `sources/`  -> type `Article` (web/doc) or `Paper` (PDF/book).
- `concepts/` -> type `Concept` (a distilled idea/technique/definition).
- `entities/` -> type `Entity` (person, org, tool, product, place).
- `notes/`    -> type `Note`, `Decision`, or `Goal`.
New topical subdirectories may emerge; place a file by its `type`, not by topic.

## File rules
- One concept per file. UTF-8 Markdown. Filename is kebab-case of the title, `.md`.
- Every non-reserved file starts with YAML frontmatter delimited by `---` lines.
- Reserved filenames: `index.md`, `log.md`. These are exempt from the frontmatter rules
  below (root `index.md` may carry only `okf_version`).

## Frontmatter
Required:
  type: <one of the types above; non-empty string>
Strongly recommended (include whenever known):
  title: <display name>
  description: <one sentence; used in previews and index entries>
  resource: <canonical URI or local path of the underlying asset; for sources>
  tags: [list, of, lowercase, tags]
  timestamp: <ISO 8601 datetime of last change, e.g. 2026-06-26T00:00:00Z>
Unknown extra keys are allowed and must be tolerated by consumers.

## Links
- Use Obsidian wikilinks in bodies: [[file-stem]] or [[file-stem|alias]]. The stem is the
  target filename without `.md` (e.g. [[open-knowledge-format]]).
- Links assert untyped relationships. Broken links are tolerated (may be planned pages).
- Citations to external sources go under a `# Citations` heading, numbered: `[1] [Title](url)`.

## Conventional body headings (use when relevant)
`# Summary`, `# Schema`, `# Examples`, `# Citations`.

## Reserved files
- Root `vault/index.md`: progressive-disclosure listing. Frontmatter limited to
  `okf_version: "0.1"`. Body is grouped bullet lists linking into the bundle.
- `vault/log.md`: chronological change log, newest first. Each entry is a `## YYYY-MM-DD`
  heading followed by bullets prefixed `**Creation**`, `**Update**`, or `**Deprecation**`.

## Maintainer operations (see the OKF skill)
- Ingest: read a source -> summarize -> create/locate its `sources/` page -> create/update
  related `concepts/` and `entities/` pages -> add wikilinks both directions -> append a
  `log.md` entry. Touching 5-15 pages per ingest is normal.
- Query: answer from vault pages first (not raw sources), cite the internal pages used; if
  the synthesized answer is durable, save it as a new `Concept` page.
- Lint: report contradictions, stale `timestamp`s, orphan pages (no inbound wikilinks;
  reserved `index.md`/`log.md` are exempt, and `index.md` links via markdown not wikilinks
  by design), broken links, and gaps. Fix only after the user confirms.

## Invariants the validator enforces
1. Every non-reserved `.md` has parseable frontmatter with a non-empty `type` (error if not).
   Malformed frontmatter — including an out-of-range implicit timestamp like `2026-13-99`,
   which PyYAML raises on — is reported as an error, never an uncaught crash.
2. Of the recommended fields, the validator warns ONLY on missing `title`, `description`, or
   `timestamp` — NOT on `resource`/`tags`, which are situational (e.g. concept pages have no
   `resource`). `timestamp`, when present, must be valid ISO 8601 or it warns. (So SCHEMA's
   "strongly recommended" list is broader than what the validator enforces, by design.)
3. Every wikilink resolves to an existing vault file (warning if not).
