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
  then create/update `sources/`, `concepts/`, and `entities/` pages with bidirectional
  `[[wikilinks]]` and a `log.md` entry. A source that can't be genuinely read is reported as a
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
│   └── trigger-eval.json         # triggering eval cases (should/should-not fire)
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

The vault itself (your `sources/`, `concepts/`, `entities/`, `notes/`, `index.md`, `log.md`, and
`.obsidian/`) lives in your own knowledge-base repo, separate from this plugin.

## Validator

The skill validates the vault by running:

```
python3 "${CLAUDE_PLUGIN_ROOT}/scripts/okf-validate/okf_validate.py" vault
```

It enforces: parseable frontmatter with a non-empty `type` (error); presence of recommended
`title`/`description`/`timestamp` and valid ISO-8601 timestamps (warnings); and resolvable
`[[wikilinks]]` (warning). Exit code `0` = no errors, `1` = errors, `2` = usage/dependency problem.

Run the tests with:

```
pytest plugins/okf/scripts/okf-validate/
```

## Requirements

- Python 3 with `PyYAML` (`pip install pyyaml`) for the validator.
- A vault directory named `vault/` in the working repo, structured per `reference/SCHEMA.md`.
