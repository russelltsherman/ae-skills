# okf

Personal knowledge-base maintainer for Claude Code. Bundles a single **skill** that maintains an
[Open Knowledge Format](https://github.com/GoogleCloudPlatform/knowledge-catalog/tree/main/okf)
(OKF v0.1) vault — the agent-owned wiki layer of a "second brain" that the user browses in Obsidian.

The skill separates **machinery from data**: the skill prose, the OKF schema contract, and the
bundle validator travel with this plugin; the `vault/` it operates on lives in the user's own
knowledge-base repo and is always addressed relative to the current working directory.

## Operations

The skill picks one of three operations from the user's intent:

- **Ingest** — read a source (URL, PDF, pasted text, or chat takeaways), gate it for completeness,
  store a verbatim copy in `raw/`, then create/update `sources/`, `concepts/`, and `entities/`
  pages with bidirectional `[[wikilinks]]` and a `log.md` entry. Source pages point at their raw
  copy (`resource: raw/<file>`), so links travel with the vault; confidence levels, caveats and
  open questions are carried over rather than flattened. Pages are named `<prefix>-<name>` by
  kind (`pattern-cqrs`, `method-test-driven-development`, `person-kent-beck`,
  `research-pattern-cqrs`), so the same idea gets the same name on every ingest. A source that can't be genuinely read is reported as a
  `**Failure**`, never papered over with a stub.
- **Query** — answer "what do I know about X" from the vault's own pages first, citing them.
- **Lint** — run the validator plus scan for contradictions, stale timestamps, orphan pages, and
  broken links; fix only after the user confirms.

## Layout

```
okf/
├── .claude-plugin/plugin.json
├── skills/okf/
│   ├── SKILL.md                  # the maintainer skill (Ingest / Query / Lint)
│   ├── reference/SCHEMA.md       # the OKF vault schema contract the skill obeys
│   ├── reference/NAMING.md       # page naming rules: <prefix>-<name>, aliases, when to make a page
│   └── trigger-eval.json         # triggering eval cases (should/should-not fire)
├── evals/okf/                    # skill eval cases (claude plugin eval --eval-dir evals/okf)
└── scripts/okf-validate/
    ├── okf_validate.py           # OKF v0.1 bundle validator (PyYAML)
    ├── test_okf_validate.py      # pytest suite
    └── requirements.txt          # PyYAML>=6.0
```

## Configuration — where's the vault?

As an installed plugin, the skill can be invoked from any working directory, so it does **not**
assume `./vault`. It resolves the vault from a per-project settings file:

```
.claude/okf.local.md
```

```markdown
---
vault_path: /absolute/path/to/your/vault
---
```

On first use in a repo, if that file is missing the skill **asks** for the absolute path to your
vault, confirms it exists, and writes the file so it won't ask again. The file is user-local —
add it to `.gitignore`:

```gitignore
.claude/*.local.md
```

The vault itself (your `raw/`, `sources/`, `concepts/`, `entities/`, `notes/`, `index.md`, `log.md`, and
`.obsidian/`) lives in your own knowledge-base repo, separate from this plugin.

## Validator

The skill validates the vault by running:

```
python3 "${CLAUDE_PLUGIN_ROOT}/scripts/okf-validate/okf_validate.py" vault
```

It enforces: parseable frontmatter with a non-empty `type` (error); presence of recommended
`title`/`description`/`timestamp` and valid ISO-8601 timestamps (warnings); that no `timestamp`
is in the future, more than 5 minutes past the current UTC time (warning, with file and value:
the skill takes timestamps from `date -u`, so a future one was guessed); resolvable
`[[wikilinks]]` (warning); that no `[[wikilink]]` is split across lines, which Obsidian does not
render (warning, with file and line); that a `resource: raw/…` names an existing raw copy (warning); that no
two `.md` files share a filename stem, `raw/` included (error); and that pages in `concepts/`,
`entities/`, `sources/` and `notes/` use that folder's filename prefix, with concepts and entities
carrying the prefix as their first tag (warnings; see `reference/NAMING.md`). It otherwise skips
the top-level `raw/` directory, which holds verbatim sources rather than pages. Exit code `0` = no
errors, `1` = errors, `2` = usage/dependency problem.

Run the tests with:

```
pytest plugins/okf/scripts/okf-validate/
```

## Requirements

- Python 3 with `PyYAML` (`pip install pyyaml`) for the validator.
- A vault directory named `vault/` in the working repo, structured per `reference/SCHEMA.md`.
