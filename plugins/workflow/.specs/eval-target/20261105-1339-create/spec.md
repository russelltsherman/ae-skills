---
agent: claude
operator: Russell Sherman
skills: none
---
# Spec: Create eval-target

## Requirements
- R1. The `Makefile` at the plugin root has a `.PHONY` target `evals`. `make evals` runs the eval cases of every skill; `make evals SKILL=<skill>` runs only that skill's.
- R2. A skill and its cases are found as `make check` finds them (`check-target/20261105-1153-create R6`): a skill is a folder in `skills/` holding a `SKILL.md`, and a case is a direct subfolder of `evals/<skill>/` other than `results/`.
- R3. Each selected skill gets one run, from the plugin directory: `claude plugin eval . --eval-dir evals/<skill> --scaffold --no-publish`, plus the options in R4, R5 and R6. `--trust-plugin` is never passed.
- R4. A skill whose `SKILL.md` front matter has `disable-model-invocation: true` gets `--ablation none`. Any other skill gets no `--ablation` option, so the CLI's default baseline arm runs.
- R5. When `evals/<skill>/allow-tools` exists, each of its lines that is not blank and does not start with `#` is one grant, with surrounding whitespace trimmed. The grants are passed to that skill's run as one `--allow-tools` option, one argument per grant. With no file, or no grants in it, no `--allow-tools` option is passed (operator decision, 2026-11-05).
- R6. `ARGS` is split on whitespace, with no quote handling, and each word is passed to every run as its own argument (operator decision, 2026-11-05).
- R7. `claude plugin eval`'s output is shown unchanged, and its stdin and stdout stay connected to the terminal, so its first-run trust prompt can be answered by hand.
- R8. A skill fails when its run exits non-zero. It also fails, without a run, when it has no cases. `SKILL=<name>` naming no skill fails with a problem line and runs nothing.
- R9. `make evals` runs every selected skill even when an earlier one fails, ends with a summary line naming the skills that failed (or saying all passed), and exits non-zero when any skill failed.
- R10. No cost limit, model or run count is set unless given in `ARGS`.
- R11. `make evals` sets no `CLAUDE_CONFIG_DIR`, token or other environment of its own.
- R12. `make check` is unchanged: it does not run `make evals`, and it passes with an `allow-tools` file present in `evals/<skill>/`.
- R13. `.claude/CLAUDE.md` gets a `## Evals` section listing `make evals`, `make evals SKILL=<skill>` and `ARGS`, and noting that evals are billed model runs. It lists no other commands (operator decisions, 2026-11-05; heading renamed from `## Commands` during implementation).

## Design
- **Files (R1).**
  - `Makefile`: adds `evals` to `.PHONY` and a target running `bash scripts/evals.sh`, with `SKILL` and `ARGS` passed as environment variables (`SKILL="$(SKILL)" ARGS="$(ARGS)"`).
  - `scripts/evals.sh`: sources `scripts/lib.sh` for the plugin root, `header`, `problem`, `need`, `skills`, `cases` and `in_list` (R2). It needs only `claude` (`need claude`).
- **Selecting skills (R1, R8).** With `SKILL` empty, the list is `skills`. With `SKILL` set, it is that one name if `in_list` finds it, otherwise the script prints `skills/<name>: no skill named <name>` and exits non-zero.
- **Per skill.** `header "evals <skill>"`, then:
  - No cases (`cases <skill>` empty): `evals/<skill>: no eval cases`, recorded as failed, no run (R8).
  - Otherwise the arguments are built in a Bash array: `plugin eval . --eval-dir evals/<skill> --scaffold --no-publish`, then `--ablation none` when command-only (R4), then the `ARGS` words (R6), then `--allow-tools` and the grants last (R5). Grants go last because `--allow-tools` takes a list and would otherwise take the words after it. The target `.` comes first, as the docs require for list options.
  - `claude "${args[@]}"` runs with no pipe or redirect (R7). A non-zero exit, including 2 from a cost ceiling in `ARGS`, records the skill as failed (R8).
- **Command-only check (R4).** The front matter is the lines between line 1 `---` and the next `---` in `SKILL.md`. The skill is command-only when one of those lines matches `^disable-model-invocation:[[:space:]]*true[[:space:]]*$`. Any other form counts as not command-only, so the baseline still runs.
- **`allow-tools` (R5).** Read with `while IFS= read -r`, trimming whitespace and a trailing `\r`, skipping blank lines and lines starting with `#`. Example: `Write`, `Edit`, `Bash(git status *)` on three lines become `--allow-tools Write Edit "Bash(git status *)"`.
- **Summary (R9).** `evals: failed: <skills>` and exit 1, or `evals: all passed` and exit 0.
- **Results.** Each run writes to the CLI's default, `evals/<skill>/results/<timestamp>/`, with the HTML report beside it. `evals/*/results/` is already in `.gitignore`, and the lints already skip `results/`.
- **`make check` (R12).** No change is needed. `cases` and `lint-evals` only look at folders under `evals/`, so a file like `allow-tools` is never treated as a case, and `claude plugin eval` only finds cases by `case.yaml` or `prompt.md`.

## Out of scope / Deferred
- Tests for `scripts/evals.sh`. It is proved by running `make evals` in the plan (operator decision, 2026-11-05).
- Listing `make check` in `.claude/CLAUDE.md`. Only this change's command is added (operator decision, 2026-11-05).
- Passing `--trust-plugin`, and running evals in CI or from a hook. C6 leaves trust to the author.
- A default cost limit, model or run count. C10, and the CLI's own defaults apply.
- Quoting in `ARGS`. Grants containing spaces go in `allow-tools` instead (R6).
- Checking that `allow-tools` grants are valid tool names. The CLI reports them.
- Running skills in parallel. Each skill runs in turn; `-j` in `ARGS` sets the CLI's concurrency within a skill.

## How each constraint is met
| Constraint | Met by |
| :---- | :---- |
| C1 | R1, R2, R3. |
| C2 | R1. |
| C3 | R3. |
| C4 | R4. |
| C5 | R3. |
| C6 | R3, R7. |
| C7 | R8, R9. |
| C8 | R8. |
| C9 | R6. |
| C10 | R10. |
| C11 | R11. |
| C12 | R5. |
| C13 | R12. |
| C14 | R12. |
| C15 | Design, Files. `scripts/evals.sh` is Bash only. |

## Open questions from the intent
None.

## Areas of concern
None.
