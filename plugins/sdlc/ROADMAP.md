# Roadmap: sdlc

Work breakdown for the root intent in [`INTENT.md`](INTENT.md): the foundation, the check-target and eval-target, the components and skills built on them, the design decisions they depend on, and the phases they are built in.

Each item below becomes its own feature in `.specs/`, with its first build in a change directory `.specs/<feature>/<YYYYMMDD-HHMM>-create/` holding its `intent.md`, `spec.md` and `plan.md`. Directory names follow `.specs/_rules/naming.md` (feature slug = component name plus a type suffix, e.g. `intent-skill`); documents follow the templates beside it. Roadmap IDs are stable so specs and plans can cite them. In Phase 0, every change directory is written by hand. F1, F2 and F3 are planned together as one feature, `.specs/plugin-foundation/`; F4, F5 and F6 each get their own.

## Design decisions

Decided early because later components depend on them. Each one is settled in the phase shown, and recorded as an ADR-style note in the repo.

| ID | Decision | Phase | Proposed default, or what was settled |
|---|---|---|---|
| D1 | Artifact home: folder layout and change IDs | 0 | **Settled** in `.specs/_rules/naming.md`: `.specs/<feature>/<YYYYMMDD-HHMM>-<change>/{intent,spec,plan}.md`, kebab-case slugs, `_`-prefixed names reserved for rules |
| D2 | Artifact header and status lifecycle, and how a solo approval is recorded | 0 | **Settled** in the `.specs/_rules/` templates: flat `key: value` front matter with no `status` key; a document is approved when the operator asks for the next one and it exists; plan approval is a `Plan-Approved-By:` trailer on the first implementation commit; `C`, `Q`, `R`, `K` IDs are never renumbered |
| D3 | Templates for intent, spec and plan | 0 | **Settled**: `.specs/_rules/{intent,spec,plan}_template.md`. Each project owns a copy: skills read `${CLAUDE_PROJECT_DIR}/.specs/_rules/`, and `init` copies them from the plugin's own `${CLAUDE_PLUGIN_ROOT}/.specs/_rules/`, so this repo's rules are the shipped canonical copy (operator decision, 2026-11-05) |
| D4 | Plugin-vs-project file split, and the marker that opts a project in | 0 | Harness ships in the plugin; `init` scaffolds project files (`CLAUDE.md` section, `REVIEW.md`, `.specs/` with `_rules/`, `evals/`, and the `.claude/sdlc.md` marker, committed with the project so CI and hooks see it, in place of `.claude/sdlc.local.md` (operator decision, 2026-11-06)) |
| D5 | Skill authoring conventions (structure, triggers, when a capability is a skill, subagent, command or hook) | 0 | **Settled**: follow the playbook's rule (skill for knowledge applied consistently, hook for anything that must hold); every skill is built and changed under the `policy-skill-authoring` policy skill, a build-time tool only (C7) |
| D6 | check-target: the one command that verifies the harness | 0 | **Settled**: `make check` runs `claude plugin validate --strict .` (warnings fail), `claude plugin validate --profile directory .` (listing problems such as a short README fail; listing warnings such as a missing icon do not, until Phase 7), `shellcheck` on every shell script, and a lint of every `intent.md`, `spec.md` and `plan.md` in `.specs/` against its template's front-matter keys and required headings. Hook tests join it when they exist (operator decision, 2026-11-05). It never runs evals and makes no model calls; evals run under the eval-target (D11, INTENT constraint 12) |
| D7 | Script language for hooks and tools | 0 | **Settled**: Bash + `jq`; Python stdlib only where Bash gets unreadable |
| D8 | Git workflow for a solo developer (branches, PRs, what merge means) | 1 | Branch per change, PR when review exists (see Q2). Interim, until this is settled: agents do not commit; the operator reviews and decides when to commit (operator decision, 2026-11-05) |
| D9 | How `plan` relates to built-in plan mode | 1 | `plan` runs inside plan mode and writes `plan.md` on approval |
| D10 | How project policy skills are found and applied by `spec` and `review` | 1 | Convention-based discovery in the project's `.claude/skills/`, listed in the spec's `skills:` front-matter key |
| D11 | eval-target: where eval cases live, how they run, and their budget | 0 | `evals/<skill>/<case>/` at the plugin root, run with `claude plugin eval --eval-dir evals/<skill> .` by a separate `make evals` target, for every skill or one with `SKILL=<skill>`; `make check` never runs it. If `claude plugin eval` does not fit, the playbook's JSON format, run in a worktree at `from` with `claude -p --plugin-dir` and an isolated config dir |
| D12 | Hook catalog: which hooks block, which advise, and how they stay inert in projects that have not opted in | 2 | Plugin `hooks/hooks.json`; every hook exits early without the D4 marker; blocking only where a rule must hold |
| D13 | Permissions and autonomy defaults (allowlist, auto mode for routine work) | 2 | Allowlist the inner loop (`make *`, `git *`), written into project settings by `init`; auto mode after hooks exist |
| D14 | Review policy shape (`REVIEW.md` passes, severity, nit cap) | 3 | The playbook's three passes: bugs, security, compliance with spec and plan |
| D15 | CI platform and where agent jobs run | 4 | GitHub Actions with `claude -p`; the plugin's own CI loads it from the checkout, a project's CI installs a pinned version |
| D16 | Release and environment model | 5 | The plugin's own release (version bump, tag, marketplace entry) is the first gated target; a stub release tool for projects without one |
| D17 | Metrics: which leading and lagging indicators are collected, and from where | 3 | Git-derived timings per change (intent → spec → plan → merge) |
| D18 | Process metrics and control bands for the Maintain loop | 6 | Bands on process metrics (eval pass rate, PR cycle time, CI failure rate) |
| D19 | Source of truth versus external trackers (GitHub Issues) | 6 | Repo is the source of truth; issues link to commits |
| D20 | Upgrading project files when templates or artifact formats change | 7 | Format version in each scaffolded file; `init` migrates |
| D21 | Dev loop: which plugin version builds the next one | 0 | Build with the installed, pinned release; test work in progress with `--plugin-dir ./plugins/sdlc`. To verify before the first release: how a relative-path marketplace entry is pinned to a release tag (`claude plugin tag` creates `sdlc--v<version>`), and whether `--plugin-dir` overrides an installed `sdlc` of the same name or loads both |
| D22 | Where dev artifacts (this intent, the roadmap, `.specs/`, `refs/`) live relative to the shipped plugin folder | 0 | Stay in `plugins/sdlc/`; git installs ship only tracked files and `refs/` is ignored. The project `CLAUDE.md` lives at `.claude/CLAUDE.md`: a `CLAUDE.md` at the plugin root fails `claude plugin validate --strict` (operator decision, 2026-11-05). Revisit if shipped clutter matters |

## Components

The foundation, check-target and eval-target come first; everything after them is grouped by playbook stage. Names are tentative except the three already chosen.

### Foundation

F1, F2 and F3 are one feature, `.specs/plugin-foundation/`.

- [x] **F1. Plugin scaffold**: `.claude-plugin/plugin.json` and the `sdlc` entry in the `ae-skills` marketplace (`../../.claude-plugin/marketplace.json`), describing the plugin the same way.
- [x] **F2. Project `CLAUDE.md`** at `.claude/CLAUDE.md` (D22) for developing the plugin itself, under a page: commands, conventions, things Claude gets wrong.
- [x] **F3. Root intent, roadmap, artifact home and templates** (D1–D3): `INTENT.md`, this file, and the naming rule and templates in `.specs/_rules/`; the intents for `intent`, `spec` and `plan` are in `.specs/` in the template format.

### init

- [ ] **F4. Minimal `init`**: create `.specs/` with `_rules/` copied from the plugin (D3), the opt-in marker and the `CLAUDE.md` section (D4), enough for the plugin's own repo to adopt the plugin.

### check-target

- [ ] **F5. check-target** `make check` (D6, D7), feature `.specs/check-target/`. One command that verifies the harness and makes no model calls; the feedback loop for building the harness. Its parts:
  - `claude plugin validate --strict .` and `claude plugin validate --profile directory .`.
  - `shellcheck` on every shell script, except under `refs/` and `skills/*-workspace/`.
  - The document lint: every `intent.md`, `spec.md` and `plan.md` in `.specs/` against its template in `.specs/_rules/`, shipped in `scripts/` so later hooks and skills can run it in any project.
  - Tests for the lint, run as a step of `make check`.
  - `make check` running every step even after one fails, and exiting non-zero when any failed.
  - The command, listed in `.claude/CLAUDE.md` (F2).

### eval-target

- [ ] **F6. eval-target** `make evals` (D11), feature `.specs/eval-target/`. One command that runs the skills' eval cases as real, billed model runs. It sits beside F5, which never runs evals. Its parts:
  - One `claude plugin eval --eval-dir evals/<skill> .` run for every skill, or for one skill with `make evals SKILL=<skill>`.
  - The options each run needs, such as `--scaffold` and `--no-publish`, settled in its own intent.
  - Extra `claude plugin eval` options passed through `ARGS`.
  - Every selected skill is run even after one fails, a summary line at the end, and a non-zero exit when any skill failed.
  - The command, listed in `.claude/CLAUDE.md` (F2).

### Stage 1: Plan

- [ ] **`intent`**: brainstorm with the originator, ask the analyst questions (scope, users, constraints, success), create a change directory per `.specs/_rules/naming.md`, write `intent.md` from `intent_template.md`, and stop for correction before commit.

### Stage 2: Design

- [ ] **`spec`**: read an approved `intent.md`, apply project policy skills (D10), write `spec.md` from `spec_template.md` with numbered requirements, a constraint-to-requirement table, carried-forward open questions and flagged concerns, including conflicts between skills.
- [ ] **Example policy skills** (security, UX, brand) that show `spec` and `review` how policy is applied. Shipped as examples that `init` copies in, owned by the project.

### Stage 3: Build

- [ ] **`plan`**: from an approved `spec.md`, produce `plan.md` from `plan_template.md` naming files, order of work, risks and proof, citing R-numbers (D9).
- [ ] **`build`**: implement an approved plan with the feedback loop, keeping `plan.md` in sync when the work departs from it.
- [ ] **Subagents**: `verifier` (runs the app and checks behavior against `plan.md`, reports only), `researcher` (explores the codebase without flooding the main context), `simplifier` (strips needless complexity after implementation).
- [ ] **Parallel work guidance**: worktree conventions for running independent plan steps in separate sessions.
- [ ] **`learn`**: fold a repeated mistake into `CLAUDE.md` (the "mistake twice" rule) and flag stale lines.

### Stage 4: Test

- [ ] **Feedback-loop conventions**: the `CLAUDE.md` verification block (scaffolded by `init`), single-command targets, "fix the code, not the test".
- [ ] **Hooks** (D12): test-file lock during fix tasks; verify-before-done (Stop hook); plan-sync check (diff departs from `plan.md`); formatter and lint after edits; secret guard; protected paths.
- [ ] **Evals for the harness's own skills**, starting with `intent`, `spec`, `plan`, run by the eval-target (F6).
- [ ] **`eval`**: turn a merged change or an incident into a new eval case.

### Stage 5: Deploy

- [ ] **`REVIEW.md` template** (D14).
- [ ] **`review`**: review a branch or PR against `REVIEW.md`, `spec.md` and `plan.md`; findings ranked by severity and tagged by pass.
- [ ] **`shepherd`**: sweep unresolved review comments and failing checks on a PR, fix, push, repeat until only human approval remains.
- [ ] **CI workflows** (D15): harness check, evals on changes to skills, hooks, agents or `evals/` plus nightly, PR review, failed-build triage.
- [ ] **Release gate pattern** (D16): `PreToolUse` hook that allows, asks or denies per environment and explains the route to approval.
- [ ] **`release`**: prepare a release, call the gated tool, roll back on failure. First target: releasing the plugin itself.

### Stage 6: Maintain

- [ ] **Detection script and `bands.yaml`** (D18): deterministic, unit-tested, rolling baseline with Western Electric rules.
- [ ] **`watch`**: scheduled, headless; on a breach, diagnose within the tier's tools and write `intent.md` from `intent_template.md` with `origin: band` and `operator: pending`.
- [ ] **`triage`**: work the queue of agent-written intents: fix now, schedule, dismiss (dismissals tune the bands).
- [ ] **`metrics`**: report the playbook's leading and lagging indicators from git and PR history (D17).

### Distribution

- [ ] **Full `init`**: scaffold every per-project file (D4) into a new or existing repo, and migrate them on upgrade (D20).
- [ ] **Public release**: README and install docs, marketplace listing, upgrade notes.

## Phases

Each phase lists what is built and how the harness is used to build it. A phase is done when its components are released and in daily use on the next phase.

**Phase 0: Foundation, check-target and eval-target (by hand).** Decisions D1–D7, D11, D21, D22, then in order: the foundation (F1–F3), minimal `init` (F4), the check-target (F5), and the eval-target (F6). The eval-target comes before Phase 1 because every skill is built under `policy-skill-authoring` (D5), whose eval loop runs on it. Nothing exists to dogfood yet, so this is the only hand-made phase. Keep it as small as possible. It ends with the first plugin release, installed into this repo, which Phase 1 is built with.

**Phase 1: Front of the chain.** `intent`, then `spec`, then `plan` (D8–D10).
Dogfood: once `intent` is released, every later component starts as an `intent.md` written with it. `plan` is specified from a spec written by `spec`. The intents for `intent`, `spec` and `plan` were written by hand in Phase 0, before `intent` existed.

**Phase 2: Build and test loop.** Feedback-loop conventions, the first hooks, `verifier` subagent, evals for the Phase 1 skills, `build`, `learn` (D12, D13).
Dogfood: from here, changes to any harness skill must keep its evals green; hooks guard the harness's own tests.

**Phase 3: Review.** `REVIEW.md`, `review`, `shepherd`, `metrics` (D14, D17).
Dogfood: every harness change goes through a PR reviewed by `review` against its own spec and plan; timings start being measured.

**Phase 4: CI.** Workflows for checks, evals and review (D15).
Dogfood: the harness's own PRs are gated by its own CI.

**Phase 5: Deploy gates.** Release gate pattern and `release` (D16).
Dogfood: plugin releases go through the gate. Then proven on the real project from Q3, which has a deploy target of its own.

**Phase 6: Maintain.** Detection, `watch`, `triage` (D18, D19).
Dogfood: watch the harness's own process metrics (eval pass rate, PR cycle time, CI failure rate), so a breach produces an `intent.md` that improves the harness.

**Phase 7: Public release.** Full `init`, upgrade path, public docs and marketplace listing (D20). Only after the plugin has carried at least one real project outside this monorepo through every stage it covers.
