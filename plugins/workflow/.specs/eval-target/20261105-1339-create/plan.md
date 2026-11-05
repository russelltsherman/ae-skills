---
agent: claude
operator: Russell Sherman
---
# Plan: Create eval-target

## Files that change
- Makefile
- scripts/evals.sh (new)
- .claude/CLAUDE.md
- ROADMAP.md

## Order of work
1. Prove the nested eval folder before writing any code. From the plugin directory, run by hand `claude plugin eval . --eval-dir evals/greet --scaffold --no-publish --ablation none --runs 1 --case greets-on-command`. It must find the `greets-on-command` case, write its results to `evals/greet/results/<timestamp>/`, and create nothing under `evals/results/` or `evals/greet/evals/`. If any of that does not hold, stop and raise it with the operator; D4 and spec R3 depend on it (R3). Done 2026-11-05 by the operator: the case passed (score 1.00, $0.05), results and `report.html` were written to `evals/greet/results/2026-11-05T23-36-16-737Z/`, neither `evals/results/` nor `evals/greet/evals/` was created, and `git status` showed nothing new under `evals/`.
2. Write `scripts/evals.sh`. It sources `scripts/lib.sh`, which sets the plugin root and `cd`s into it, then runs `need claude`. It is Bash 3.2-safe, like the other scripts: no `mapfile`, no associative arrays, no `${var,,}` (R2, R11).
   - **Select skills.** With `SKILL` empty, the list is `skills`. With `SKILL` set and `in_list "$SKILL" "$(skills)"` true, the list is that one name. Otherwise it prints `skills/<name>: no skill named <name>` with `problem` and exits 1 before any run (R1, R2, R8).
   - **Split `ARGS` once.** `read -r -a extra <<< "$ARGS"` splits on whitespace with no quote handling and no glob expansion, so `--case 'greet*'` is passed as the two words `--case` and `'greet*'` and a `*` is never matched against files (R6, R10).
   - **For each skill**, `header "evals <skill>"`, then:
     - When `cases <skill>` is empty, `problem "evals/<skill>" "no eval cases"`, record the skill as failed, and go to the next skill with no run (R8).
     - Build the arguments in an array: `plugin eval . --eval-dir "evals/<skill>" --scaffold --no-publish`; then `--ablation none` when the skill is command-only; then the `extra` words; then `--allow-tools` and the grants, last, only when there is at least one grant. Each optional part is appended only when it is non-empty, so no empty array is expanded (R3, R4, R5, R6).
     - Run `claude "${args[@]}"` with no pipe, redirect or subshell capture. A non-zero exit records the skill as failed (R3, R7, R8).
   - **Command-only check**, a function `command_only <skill>`: read `skills/<skill>/SKILL.md` line by line. Line 1 must be `---`; the front matter is the lines up to the next `---`. The skill is command-only when one of those lines, with a trailing `\r` removed, matches `^disable-model-invocation:[[:space:]]*true[[:space:]]*$`. Anything else, including no front matter, is not command-only (R4).
   - **Grants**, a function `grants <skill>`: when `evals/<skill>/allow-tools` exists, read it with `while IFS= read -r line || [ -n "$line" ]` (so a last line with no newline is still read), remove a trailing `\r`, trim leading and trailing whitespace, skip blank lines and lines starting with `#`, and append each remaining line to the `grants` array as one element (R5).
   - **Summary.** After the loop, print `evals: failed: <skills>` (space-separated) and exit 1, or `evals: all passed` and exit 0 (R9).
   - The script exports nothing and sets no environment variable (R11).
3. Add the target to the `Makefile`: `evals` joins the `.PHONY` line, and the target is `@SKILL="$(SKILL)" ARGS="$(ARGS)" bash scripts/evals.sh`. Update the file's header comment to say `make evals` makes billed model runs and is never run by `make check` (R1, R12).
4. Add a `## Evals` section to `.claude/CLAUDE.md`, after `## Checks`: `make evals` runs every skill's eval cases, `make evals SKILL=<skill>` runs one skill's, `ARGS="..."` passes extra `claude plugin eval` options to every run, and evals are billed model runs. It lists no other command (R13).
5. Run every item in `## Proof`.
6. Mark F6 done in `ROADMAP.md` once every item in `## Proof` passes (R1).

## Risks
- `--allow-tools` takes a list, so words after it would be read as grants, and the CLI wants the target before list options (spec Design: Per skill). The target `.` comes first and `--allow-tools` comes last. The stub check in `## Proof` shows the exact argument order.
- On Bash 3.2, `"${arr[@]}"` on an empty array is an error under `set -u`, and an unquoted `$ARGS` would glob-expand `*` (spec R6). The script does not use `set -u`, appends optional parts only when non-empty, and splits `ARGS` with `read -r -a`, which does not glob. The stub check passes a `*` in `ARGS`.
- A nested `--eval-dir evals/<skill>` is not shown in the CLI help, which says "Directory name (below the plugin)" (spec R3). D4 relies on it. Step 1 proves it by hand before any code is written, and the work stops there if it does not hold.
- A `claude` call whose output is piped or captured would hide the first-run trust prompt or wait on it with no terminal (spec R7). The call has no pipe, redirect or `$( )`, and the stub check reports whether stdin and stdout are terminals. This directory is already trusted, so the prompt does not appear in the real run. A run from an untrusted copy, answering the prompt by hand, is deferred (operator decision, 2026-11-05).
- Grants are checked only through the stub, which shows the `--allow-tools` arguments. No skill has an `allow-tools` file yet, so a real run that confirms the grants reach the CLI is deferred until one does. The CLI's `not granted ...` line is how to check it then (operator decision, 2026-11-05).
- A front matter line written another way, such as `disable-model-invocation: "true"`, is not read as command-only, and the baseline arm runs at twice the cost (spec Design: Command-only check). This is the spec's decision: a wrong guess costs money, not a wrong result. The only skill today, `greet`, uses the plain form.
- A skill's real run can fail because of the model, not the script, so `make evals SKILL=greet` may exit non-zero on a good script. The proof judges the script by the stub checks; the real run is judged by where its results land and by its summary line matching its exit status.
- Real runs are billed. The real run in `## Proof` is one skill with `ARGS="--runs 1"`, and every other check uses the stub.
- `make check`'s shellcheck now covers `scripts/evals.sh` (R12). The proof runs `make check` after the script is written.

## Proof
Most checks use a stub `claude`: a script in a temporary folder, put first on `PATH`, that prints `tty` or `notty` for stdin and stdout (`[ -t 0 ]`, `[ -t 1 ]`), each argument on its own line in brackets, and `CLAUDE_CONFIG_DIR=<value>`, then exits with the value of `STUB_EXIT` (default 0). The folder is removed afterwards. No model is called. Temporary skills and files added below are removed afterwards, and `git status` shows only this plan's files changed.

- Step 1, nested eval folder: the hand run finds `greets-on-command`, its results are in `evals/greet/results/<timestamp>/`, and `evals/results/` and `evals/greet/evals/` do not exist (R3).
- Stub, defaults: `PATH=<stub>:$PATH make evals` prints `== evals greet`, then the arguments `[plugin] [eval] [.] [--eval-dir] [evals/greet] [--scaffold] [--no-publish] [--ablation] [none]` and nothing else, then `evals: all passed`; `echo $?` prints 0. Neither `--trust-plugin`, `--allow-tools`, `--max-cost-usd`, `--model` nor `--runs` appears (R1, R2, R3, R4, R10).
- Stub, terminal and environment: run from a terminal, the stub prints `tty` for stdin and stdout, and `CLAUDE_CONFIG_DIR=` is empty when the shell's is unset (R7, R11).
- Stub, `ARGS`: `make evals ARGS="--runs 1 --case greets-*"` passes `[--runs] [1] [--case] [greets-*]` after `[none]`, with the `*` not expanded (R6).
- Stub, grants: with `evals/greet/allow-tools` holding a `# comment` line, a blank line, `  Write  `, `Bash(git status *)`, and `Edit` with a `\r\n` ending and no final newline, the arguments end `[--allow-tools] [Write] [Bash(git status *)] [Edit]`, after the `ARGS` words. With the file holding only a comment, no `--allow-tools` is passed (R5).
- `make check` with that `allow-tools` file present: it prints `check: all passed` and exits 0, and `lint-evals` reports nothing for it (R12).
- Stub, baseline arm: a temporary `skills/demo/SKILL.md` without `disable-model-invocation`, with one case folder `evals/demo/hello/`: `make evals SKILL=demo` passes no `--ablation` (R4).
- Stub, failures: with `skills/demo/SKILL.md` and no `evals/demo/`, `make evals` prints `evals/demo: no eval cases`, makes no stub call for `demo`, still runs `greet`, and ends `evals: failed: demo`. With `STUB_EXIT=1`, both `demo` and `greet` are listed. `echo $?` prints 2 (make's status for a failed recipe), and `bash scripts/evals.sh` run directly exits 1 (R8, R9).
- Stub, unknown skill: `make evals SKILL=nope` prints `skills/nope: no skill named nope`, makes no stub call, and exits non-zero. `make evals SKILL=greet-workspace` does the same, since that folder has no `SKILL.md` (R2, R8).
- Real run, R3 and R7: `make evals SKILL=greet ARGS="--runs 1"` runs `claude plugin eval` with its output shown unchanged. Results land in `evals/greet/results/<timestamp>/` with the HTML report beside them, the output names no claude.ai report link, the last line is `evals: all passed` or `evals: failed: greet`, and the exit status matches that line. `git status` shows nothing new under `evals/greet/results/`.
- `make check` on the finished tree prints `check: all passed` and exits 0, so `scripts/evals.sh` passes shellcheck (R12).
- R12, `make check` does not run evals: `grep -nE 'evals\.sh|plugin eval' scripts/check.sh scripts/validate.sh scripts/shellcheck.sh scripts/lint-readmes.sh scripts/lint-evals.sh` finds nothing.
- R13: `.claude/CLAUDE.md` has a `## Evals` section naming `make evals`, `make evals SKILL=<skill>` and `ARGS`, saying evals are billed model runs, and naming no other command.
- Running from another directory: `PATH=<stub>:$PATH make -C plugins/workflow evals` from the repo root prints the same arguments as from the plugin directory (spec Design: Files).
