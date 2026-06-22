# Roadmap: workflow

Work breakdown for the root intent in [`INTENT.md`](INTENT.md): the foundation, the check-target and eval-target, the skills built on them, the design decisions they depend on, and the phases they are built in.

Each item below becomes its own feature in `.specs/`, with its first build in a change directory `.specs/<feature>/<YYYYMMDD-HHMM>-create/` holding its `intent.md`, `spec.md` and `plan.md`. Directory names follow `.specs/_rules/naming.md`; documents follow the templates beside it. Roadmap IDs are stable so specs and plans can cite them.

## Design decisions

| ID | Decision | Phase | Proposed default, or what was settled |
|---|---|---|---|
| D1 | Planning rules: whose copy of `.specs/_rules/` this repo follows | 0 | **Settled**: workflow owns its copy and may diverge from sdlc's; nothing syncs them (operator decision, 2026-11-05) |
| D2 | Where the project `CLAUDE.md` lives | 0 | `.claude/CLAUDE.md`. A `CLAUDE.md` at the plugin root fails `claude plugin validate --strict .` (checked 2026-11-05) |
| D3 | check-target: the one command that verifies the plugin | 0 | **Settled**: `make check` runs `claude plugin validate --strict .`, `claude plugin validate --profile directory .`, `shellcheck` on every shell script, a lint of each skill README against `docs/skills/README_TEMPLATE.md`, and a lint of each eval case folder. It does not lint `.specs/` and does not run evals. The lints are workflow's own, not sdlc's (operator decision, 2026-11-05) |
| D4 | Where eval cases live, and how they run | 0 | **Settled**: `evals/<skill>/<case>/` at the plugin root, run with `claude plugin eval --eval-dir evals/<skill> .`. A separate `make evals` target runs them; `make check` never does (operator decision, 2026-11-05) |
| D5 | Script language | 0 | **Settled**: Bash + `jq`; Python stdlib only where Bash gets unreadable (operator decision, 2026-11-05) |
| D6 | What minimal `init` scaffolds | 0 | **Settled**: `.handoff/.gitignore`. `handoff` never creates it and directs the user to `init` when it is missing (operator decision, 2026-11-05) |
| D7 | How workflow changes are planned | 0 | **Settled**: by hand under `.specs/_rules/` until sdlc's `intent`, `spec` and `plan` are released, then with each as it ships. When sdlc's opt-in marker is implemented, workflow runs sdlc's `init` and takes the marker (operator decision, 2026-11-05) |
| D8 | Git workflow | 0 | Interim: agents do not commit; the operator reviews and decides when to commit |
| D9 | Skill README location and format | 0 | `docs/skills/<skill>/README.md` per `docs/skills/README_TEMPLATE.md`, with its case list read from `evals/<skill>/` (D4) |

## Components

### Foundation

- [ ] **F1. Plugin scaffold**: `.claude-plugin/plugin.json` and the `workflow` entry in the `ae-skills` marketplace (`../../.claude-plugin/marketplace.json`).
- [ ] **F2. Project `CLAUDE.md`** at `.claude/CLAUDE.md` (D2): commands, conventions, things Claude gets wrong.
- [ ] **F3. Root intent, roadmap and planning rules** (D1, D7): `INTENT.md`, this file, and `.specs/_rules/`.
- [ ] **F4. Skill README template** (D9): `docs/skills/README_TEMPLATE.md`, which the README lint in F5 checks against.

### check-target

- [ ] **F5. check-target** `make check` (D3, D5), feature `.specs/check-target/`. One command that verifies the plugin and makes no model calls. Its parts:
  - `claude plugin validate --strict .` and `claude plugin validate --profile directory .`.
  - `shellcheck` on every `.sh` file, except under `results/` and `*-workspace/` folders.
  - The skill README lint: each `docs/skills/<skill>/README.md` against `docs/skills/README_TEMPLATE.md` (F4) and the skill's eval cases.
  - The eval case lint: each case folder in `evals/<skill>/<case>/` (D4).
  - A target for each check on its own (`make validate`, `make shellcheck`, `make lint-readmes`, `make lint-evals`), and `make check` running all of them even after one fails.
  - `tests/lints.sh`, the tests for the two lints.
  - The commands, listed in `.claude/CLAUDE.md` (F2).

### eval-target

- [ ] **F6. eval-target** `make evals` (D4), feature `.specs/eval-target/`. One command that runs the skills' eval cases as real, billed model runs. It sits beside F5, which never runs evals. Its parts:
  - One `claude plugin eval --eval-dir evals/<skill> .` run for every skill, or for one skill with `make evals SKILL=<skill>`.
  - The options each run needs: `--scaffold`, no baseline arm for a command-only skill, `--no-publish`, and no `--trust-plugin`.
  - Extra `claude plugin eval` options passed through `ARGS`.
  - Every selected skill is run even after one fails, a summary line at the end, and a non-zero exit when any skill failed, a skill with no cases included.

### Policy

- [ ] **S1. `policy-skill-authoring`**: every skill is built with the skill-creator skill and its full eval loop, each test case has a stated goal, and eval results are reviewable. Cases live in `evals/<skill>/<case>/` (D4), with eval labels (`eval_dir`, `EVAL:`) giving the case's real path. Built first, since every other skill is built under it (INTENT constraint 2), and must land before sdlc's `intent-skill` build starts.

### Session skills

Each is built under S1, with its eval cases in `evals/<skill>/` (D4) and its README in `docs/skills/<skill>/` (D9).

- [ ] **S2. Minimal `init`**, invoked as `/workflow:init` (INTENT constraint 1): creates `.handoff/.gitignore` in a project (D6).
- [ ] **S3. `handoff`**, invoked as `/handoff`: writes a handoff of the current session (decisions, open questions, dead ends, references) to a file in `.handoff/` so a fresh session can pick it up. When `.handoff/.gitignore` is missing it directs the user to `/workflow:init` (D6). Built after S2.
- [ ] **S4. `discuss`**, invoked as `/discuss`: starts a discussion in which the user's thinking is the product and nothing is written or changed until the discussion ends. Fits with `handoff` and `policy-skill-authoring`.

### Documentation

- [ ] **Plugin README**: lists every skill, the layout, install, and how to run `make check` and `make evals`.

## Phases

Each phase lists what is built. A phase is done when its components are released and in use.

**Phase 0: Foundation, check-target and eval-target (by hand).** D1–D9, then in order: the foundation (F1–F4), the check-target (F5), and the eval-target (F6). The eval-target comes before Phase 1 because S1's eval loop runs on it. Phase 0 is done when each target works as its spec says. `make check` is expected to fail until the Phase 1 work is done (missing READMEs and eval cases).

**Phase 1: Policy.** S1, built with skill-creator directly, since the policy it would be built under does not exist yet. It comes before the session skills because each of them, and sdlc's `intent` build, waits on it.

**Phase 2: Session skills.** S2, then S3, which relies on it; S4 in any order. Then the plugin README. `make check` passes on all of it.

**Phase 3: Adopt sdlc.** As sdlc's `intent`, `spec` and `plan` are released, workflow changes start with them (D7). When sdlc's opt-in marker is implemented, run sdlc's `init` here and take the marker.
