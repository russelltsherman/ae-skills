# OKF Vault Schema (the maintainer's contract)

This file defines how the `vault/` knowledge base is structured and maintained. The OKF
maintainer skill MUST obey it. The directory layout and YAML frontmatter follow Google's
Open Knowledge Format (OKF) v0.1; the operating model follows Karpathy's LLM-Wiki pattern.
CAVEAT: body cross-links use Obsidian `[[wikilinks]]`, which OKF does NOT define (OKF uses
standard markdown links). So this bundle is OKF-conformant in structure/frontmatter but NOT
in body link syntax. Portability to other OKF consumers (a wikilink->markdown export) is a
Phase 3 item, not done here.

## Layers
- Raw sources (immutable): external articles/PDFs/chats, copied verbatim into `raw/` at ingest
  and never edited afterwards. A page in `sources/` records a faithful summary, `resource:`
  pointing at its raw copy (`raw/<file>`, relative to the vault root), and `origin:` naming
  where the copy came from (URL or original path).
- Wiki (agent-owned): `concepts/` and `entities/`. The agent creates, updates, links, and
  keeps these consistent.
- Human layer: `notes/`. The user's own thinking. The agent organizes but treats user text
  as more authoritative than its own summaries; it does not silently overwrite user words.

## Directories and the `type` they hold
- `sources/`  -> type `Article` (web/doc) or `Paper` (PDF/book).
- `concepts/` -> type `Concept` (a distilled idea/technique/definition).
- `entities/` -> type `Entity` (person, org, tool, product, place).
- `notes/`    -> type `Note`, `Decision`, or `Goal`.
- `raw/`      -> no type: verbatim source copies (any format), outside the wiki. They carry no
  frontmatter, are never edited, and are exempt from every rule below.
New topical subdirectories may emerge; place a file by its `type`, not by topic.

## File rules
- One concept per file. UTF-8 Markdown, `.md`.
- Filenames follow `reference/NAMING.md`: `<prefix>-<name>`, where the prefix names the kind of
  page (`pattern-`, `method-`, `artifact-`, `topic-` for concepts; `person-`, `org-`, `tool-`,
  `place-` for entities; `research-`, `article-`, `paper-`, `book-`, `meeting-`, `chat-` for
  sources; `note-`, `decision-`, `goal-` for notes). The filename is not derived from `title:`.
- Every filename stem is unique across the whole vault, `raw/` included: Obsidian resolves
  `[[stem]]` by filename, whatever the folder.
- Every non-reserved file starts with YAML frontmatter delimited by `---` lines.
- Reserved filenames: `index.md`, `log.md`. These are exempt from the frontmatter rules
  below (root `index.md` may carry only `okf_version`).

## Frontmatter
Required:
  type: <one of the types above; non-empty string>
Strongly recommended (include whenever known):
  title: <display name>
  description: <one sentence; used in previews and index entries>
  resource: <for sources: the raw copy, as a vault-relative path `raw/<file>`>
  origin: <for sources: where the raw copy came from — URL or the path the user gave>
  (`origin` is a vault extension; OKF allows unknown extra keys.)
  tags: [list, of, lowercase, tags]   # first tag = the filename prefix (`pattern`, `person`…)
  aliases: [Acronym, Expanded Name, synonym]   # concepts and entities; Obsidian-native
  timestamp: <ISO 8601 datetime of last change, e.g. 2026-06-26T00:00:00Z>
Unknown extra keys are allowed and must be tolerated by consumers.

## Links
- Use Obsidian wikilinks in bodies: [[file-stem]] or [[file-stem|alias]]. The stem is the
  target filename without `.md` (e.g. [[topic-open-knowledge-format]]). In running prose,
  prefer the alias form for readability: [[pattern-cqrs|CQRS]].
- Links assert untyped relationships. Broken links are tolerated (may be planned pages).
- Citations to external sources go under a `# Citations` heading, numbered: `[1] [Title](url)`.

## Conventional body headings (use when relevant)
`# Summary`, `# Schema`, `# Examples`, `# Open questions` (source pages, when the source lists
any), `# Citations`.

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
4. Everything under `raw/` is skipped: no frontmatter, type, wikilink or naming checks. Its
   `.md` filenames still count for invariant 6, because Obsidian indexes them.
5. A `resource:` that starts with `raw/` must name an existing file in `raw/` (warning if not).
6. No two `.md` files anywhere in the vault share a filename stem (error): a wikilink to that
   stem would be ambiguous.
7. A page directly in `concepts/`, `entities/`, `sources/` or `notes/` has a stem starting with
   one of that folder's prefixes from `NAMING.md` (warning if not).
8. A page in `concepts/` or `entities/` has its prefix (without the hyphen) as its first tag
   (warning if not).
