---
agent: claude
operator: Russell Sherman
skills: none
---
# Spec: Create eval-target

## Requirements
- R1. `make evals`, run from the plugin directory, runs the eval cases of the selected skills. It reads two optional make variables, `SKILL` and `ARGS`.
- R2. With `SKILL` unset or empty, the selected skills are every directory `evals/<name>/` directly under `evals/` for which `skills/<name>/` is a directory, in name order (operator decision, 2026-11-06). Files under `evals/` are ignored. A selected directory with no eval cases is still selected. Every other directory directly under `evals/` is not run. When there is at least one, `make evals` prints, before the first run, one line `evals: skipped (no skills/<name>/): <name> <name>…` in name order. Skipped directories do not change the summary or the exit status (operator decision, 2026-11-06). When `evals/` is missing or no directory is selected, no skill runs, the summary reads `evals: passed: none; failed: none`, and `make evals` exits 0 (operator decision, 2026-11-06).
- R3. With `SKILL` set and no directory `evals/<SKILL>/`, `make evals` runs nothing. It prints `evals: no directory evals/<SKILL>/; skills with evals: <skill> <skill>…` (every directory directly under `evals/`, in name order, or `none` when there are none) and exits non-zero: `scripts/evals.sh` exits 1, and make reports a failed recipe with its own status, 2. With `SKILL` set and `evals/<SKILL>/` a directory, that one skill is selected, whether or not `skills/<SKILL>/` exists (operator decision, 2026-11-06).
- R4. Each selected skill runs as `claude plugin eval . --eval-dir evals/<skill> --no-publish --scaffold`, followed by `--ablation none` for a command-only skill, followed by the words of `ARGS`. The `.` target comes first so that a variadic option in `ARGS`, such as `--allow-tools`, cannot swallow it.
- R5. A skill is command-only when `skills/<skill>/SKILL.md` exists and its front matter (the lines between the opening `---` on line 1 and the next `---`) has the line `disable-model-invocation: true`. Any other skill, including one with no `SKILL.md`, keeps the tool's default baseline arm.
- R6. `ARGS` is split on whitespace; quotes in it are not interpreted (operator decision, 2026-11-06). Its words go last on every run, so an option that repeats one from R4 overrides it, since the tool takes an option's last value (operator decision, 2026-11-06). With `SKILL` unset, `ARGS` applies to every skill's run.
- R7. Runs pass no `--trust-plugin`, `--max-cost-usd` or `--runs`, and set no `CLAUDE_CONFIG_DIR`. Each run's stdin and stdout are the terminal's, untouched; only its stderr is copied (and still shown) so R10 can read it. In a terminal, the tool's trust prompt therefore still asks.
- R8. A skill passes when its run exits 0 and fails when it exits non-zero, whatever the reason, including a directory with no eval cases.
- R9. Every selected skill runs, even after one fails. Each run's output is headed `== <skill>`. The command ends with one summary line, `evals: passed: <skills or none>; failed: <skills or none>`, and exits non-zero when any skill failed (`scripts/evals.sh` exits 1; make then exits 2), else 0.
- R10. When any run's stderr contains `is not a trusted plugin directory`, `make evals` prints, once, after the summary line: `evals: this plugin directory is not trusted yet. Run make evals once in a terminal and answer y to trust it.`
- R11. The plugin's `.gitignore` ignores `evals/*/results/`.
- R12. `.claude/CLAUDE.md` lists `make evals`, `make evals SKILL=<skill>` and `ARGS` under Commands, says the runs are real and billed and never part of `make check`, and says the operator trusts the directory once by running `make evals` in a terminal.
- R13. `make check` does not call `make evals` or `scripts/evals.sh`, and `scripts/evals.sh` does not call `make check` or `scripts/check.sh`.
- R14. `scripts/evals.sh` uses only features of Bash 3.2 (no associative arrays, `mapfile` or case-changing expansions), plus POSIX features of `awk`, `sed`, `grep`, `find` and `sort` that the BSD and GNU versions share. No Python.

## Design
- The `Makefile` from the check-target gains a second target, `evals`, whose recipe is `bash scripts/evals.sh`. GNU make passes the command-line variables `SKILL` and `ARGS` to the recipe's environment unchanged, so the script reads `$SKILL` and `$ARGS` and the Makefile stays trivial. Being a shell script, it is shellchecked by the check-target's shellcheck step (R1, R13, R14).
- `scripts/evals.sh`:
  1. **Select:** with `SKILL` empty, `find evals -mindepth 1 -maxdepth 1 -type d` piped to `sort`, or nothing when `evals/` is missing. Each `evals/<name>` is selected when `skills/<name>` is a directory, and otherwise added to the skipped list, which is printed once before the first run when it is not empty. With `SKILL` set, check only that `evals/$SKILL` is a directory, failing per R3 when it is not (R2, R3).
  2. **Per skill:** build the argument list from R4: `.`, `--eval-dir`, `evals/<skill>`, `--no-publish`, `--scaffold`, plus `--ablation none` when an `awk` read of the `SKILL.md` front matter finds `disable-model-invocation: true` (R5), plus the unquoted expansion of `$ARGS` with globbing off (`set -f`) so its words are split but never expanded as paths (R6). Print `== <skill>`, then run `{ claude plugin eval "${args[@]}" 2>&1 1>&3 3>&- | tee -a "$errlog" >&2; } 3>&1`. Only stderr goes through `tee`; stdout stays the terminal on fd 3. Piping stdout makes the tool treat the run as non-interactive and refuse the trust prompt, while piping only stderr keeps the prompt; both were checked against `claude plugin eval` on 2026-11-06 (R7). A pipe is used rather than a process substitution, because Bash 3.2 cannot wait for one, so the log could still be incomplete when R10 reads it. Record the skill as passed or failed by `claude`'s exit status, `${PIPESTATUS[0]}` (R8).
  3. **Report:** print the summary line, then, if `grep -q 'is not a trusted plugin directory'` matches the stderr log, the trust hint. Exit 1 if any skill failed (R9, R10). The log is a `mktemp` file removed on exit.
- Ordering checked against the tool on 2026-11-06: an option given twice takes its last value (`--ablation bogus --ablation none` is accepted), and a target given first is not consumed by a later variadic option (R4, R6).
- The trust hint keys on the tool's error text. If that text changes, the hint stops printing, but the run still fails and the tool's own error still shows (R10).
- `.gitignore` gets the line `evals/*/results/`, where the tool writes each skill's results with `--eval-dir evals/<skill>` (R11).

## Out of scope / Deferred
- Automated tests for `make evals`. Its proof is a manual run in the plan (operator decision, 2026-11-06).
- `ARGS` values containing spaces, such as `--case 'a b'`. Quotes are not interpreted (operator decision, 2026-11-06).
- The fallback named in D11: the playbook's JSON format, run with `claude -p --plugin-dir` and an isolated config dir (C14, C16).
- A default cost cap or runs per case. The tool's defaults apply unless set through `ARGS` (C13).
- Running skills in parallel. Skills run one after another; `-j` in `ARGS` sets concurrency within each run.
- Running evals in CI, on changes or nightly. That is Phase 4 (D15).

## How each constraint is met
| Constraint | Met by |
| :---- | :---- |
| C1 | R1, R2, R3. |
| C2 | R4. |
| C3 | R6. |
| C4 | R9. |
| C5 | R13. |
| C6 | R14. Plain Bash and POSIX tools; `jq` is not needed. |
| C7 | R12. |
| C8 | R2. |
| C9 | R3. |
| C10 | R4. |
| C11 | R4, R7. |
| C12 | R4, R5. |
| C13 | R7. |
| C14 | R7. |
| C15 | R11. |
| C16 | R4. Design: `claude plugin eval` is the only `claude` call. |
| C17 | R7, R10. |
| C18 | R8. |
| C19 | R2, R8. |
| C20 | R3. |

## Open questions from the intent
None.

## Areas of concern
None.
