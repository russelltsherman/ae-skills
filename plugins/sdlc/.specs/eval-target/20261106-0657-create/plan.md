---
agent: claude
operator: Russell Sherman
---
# Plan: Create eval-target

## Files that change
- Makefile
- scripts/evals.sh (new)
- .gitignore
- .claude/CLAUDE.md

## Order of work
1. Check that the check-target is built: `Makefile` with a `check` target, `scripts/check.sh` and `scripts/lint-specs.sh` exist, and `make check` runs. If any is missing, stop and tell the operator; this plan only edits the `Makefile`, it never creates it (operator decision, 2026-11-06) (R1).
2. Add the `evals` target to `Makefile`: `evals:` with the recipe `@bash scripts/evals.sh`, and add `evals` to `.PHONY` if the file declares one. Leave the `check` target unchanged (R1, R13).
3. Write `scripts/evals.sh` (`#!/usr/bin/env bash`), following the spec's Design:
   - Select skills from `$SKILL`. With it empty: every directory `evals/<name>/` with a matching `skills/<name>/` directory, in name order, none when `evals/` is missing. Print `evals: skipped (no skills/<name>/): …` once, before the first run, for the other directories, if there are any. With it set: `evals/$SKILL` whether or not `skills/$SKILL/` exists, or R3's message and exit 1 when `evals/$SKILL` is not a directory (R2, R3).
   - Detect a command-only skill with an `awk` read of the front matter of `skills/<skill>/SKILL.md` (R5).
   - Build the argument list in R4's order: `.`, `--eval-dir evals/<skill>`, `--no-publish`, `--scaffold`, `--ablation none` when command-only, then the words of `$ARGS`, split with `set -f` so they are not globbed and quotes are not interpreted. Pass no other options and set no environment (R4, R6, R7).
   - For each skill, print `== <skill>` and run `{ claude plugin eval "${args[@]}" 2>&1 1>&3 3>&- | tee -a "$errlog" >&2; } 3>&1`. Record pass or fail from `${PIPESTATUS[0]}`, and go on to the next skill whatever happened (R7, R8, R9).
   - Print `evals: passed: <skills or none>; failed: <skills or none>`. Then print R10's trust hint once if `grep -q 'is not a trusted plugin directory' "$errlog"` matches. Exit 1 if any skill failed, else 0. Create `$errlog` with `mktemp` and remove it in an `EXIT` trap (R9, R10).
   - Use only Bash 3.2 features, and never call `make check` or `scripts/check.sh` (R13, R14).
4. Add `evals/*/results/` to `.gitignore` (R11).
5. In `.claude/CLAUDE.md` under Commands, after the `make check` line, add `make evals`, `make evals SKILL=<skill>` and `ARGS="…"`. Say that the runs are real, billed model runs and never part of `make check`, and that the operator trusts the plugin directory once by running `make evals` in a terminal (R12).
6. Run every check under `## Proof`. Steps P1 and P3–P8 are run by Claude; P2 is run by the operator in a terminal (R1–R14).

## Risks
- Bash 3.2 with `set -u` treats `"${args[@]}"` on an empty array as unbound (spec R14). Use no `set -u`, or expand optional arrays as `${arr[@]+"${arr[@]}"}`.
- The trust hint depends on the tool's error text (spec R10). P1 checks it against the current `claude`; if the text changes later, the hint stays silent but the run still fails and shows the tool's own error.
- The `make check` lint step may stay red over older `.specs/` documents, which the check-target leaves to their own changes. Proof therefore relies on the shellcheck result for `scripts/evals.sh` and on the lint output for this change directory, not on `make check`'s exit status.
- Step 5 lands on top of the check-target's edit of the same Commands list (spec R12). It adds lines after `make check` and changes no existing line.
- The proof spends real money. Probes measured on 2026-11-06 cost about $0.04 per run with `--runs 1`, so P2–P4 together cost about $0.32. The proof copy has its real `evals/*` removed, so a bare run spends only on the probes.
- P2 records trust for the proof copy's temporary path in the operator's Claude config. This is harmless, and the operator can see it in the prompt.

## Proof
All runs below happen in a copy of the plugin, unless they say otherwise. Every billed run passes `--runs 1`. Setup, run by Claude: `PROOF=$(mktemp -d)/sdlc && rsync -a --exclude refs/ --exclude 'evals/*' ./ "$PROOF/"`. Then, in `$PROOF`, add four probes:
- `evals/probe-pass/ok/prompt.md`: front matter `max_turns: 2`, `allowed_tools: [Read]`; body `Reply with exactly the word: ok`. Grader `evals/probe-pass/ok/graders/criteria.md`: `type: llm`, `weight: 1`; body `The response is the word ok.`
- `evals/probe-fail/never/`: the same prompt, and the grader `The response is the word banana.`
- `evals/probe-cmd/ok/`: a copy of `probe-pass/ok`.
- `evals/probe-empty/`: an empty directory.
- `evals/stray/`: an empty directory with no matching skill.
- For each of `probe-pass`, `probe-fail`, `probe-cmd` and `probe-empty`, a `skills/<name>/SKILL.md` with front matter `name: <name>`, `description: Proof probe`, and body `Proof probe; does nothing.` Only `skills/probe-cmd/SKILL.md` also has `disable-model-invocation: true`. No `skills/stray/` is created.

These probe shapes and their outcomes were checked against `claude plugin eval` on 2026-11-06: the `ok` grader passes, the `banana` grader fails with exit 1, the default baseline arm prints `Ablation: 2 arms` and `[without]` lines, and `--ablation none` prints neither.

- **P1** (Claude, no terminal; trust hint): `make evals SKILL=probe-pass ARGS="--runs 1"` in `$PROOF` shows the tool's `is not a trusted plugin directory` error, then `evals: passed: none; failed: probe-pass`, then the R10 hint line, and exits 2, from the script's exit 1 (R1, R7, R8, R9, R10).
- **P2** (the operator, in a terminal; trust prompt and default baseline): `cd $PROOF && make evals SKILL=probe-pass ARGS="--runs 1"`. The prompt `Trust this plugin directory? [y/N]` appears; answer `y`. The output shows `Ablation: 2 arms` and `[with]`/`[without]` runs, ends with `evals: passed: probe-pass; failed: none`, and exits 0. Results land under `evals/probe-pass/results/` (R4, R5, R7, R8, R9).
- **P3** (Claude; bare run): `make evals ARGS="--runs 1"`. Before the first heading, the line `evals: skipped (no skills/<name>/): stray` appears, and no `== stray` heading follows. Headings come in the order `== probe-cmd`, `== probe-empty`, `== probe-fail`, `== probe-pass`. Under `probe-cmd` there is no `Ablation:` or `[without]` line. `probe-empty` shows `No eval cases found`. `probe-fail` shows `✗`. The summary is `evals: passed: probe-cmd probe-pass; failed: probe-empty probe-fail`, no trust hint follows, and the exit status is 2 (R2, R4, R5, R8, R9, R10).
- **P4** (Claude; exact command line and ARGS override): `SKILL=probe-cmd ARGS="--runs 1 --ablation with-without" bash -x scripts/evals.sh`. The trace line for the run reads `claude plugin eval . --eval-dir evals/probe-cmd --no-publish --scaffold --ablation none --runs 1 --ablation with-without`, with no `--trust-plugin`, `--max-cost-usd` or other option. The output shows `[without]` runs, so the later `ARGS` option won (R4, R5, R6, R7).
- **P5** (Claude; free; ARGS splitting): `SKILL=probe-empty ARGS="--case 'a b' *" bash -x scripts/evals.sh`. The trace passes the words `--case`, `'a`, `b'` and `*` literally: quotes are kept and nothing is globbed. `grep -n CLAUDE_CONFIG_DIR scripts/evals.sh` prints nothing (R6, R7).
- **P6** (Claude; free; selection edges): `make evals SKILL=nope` prints `evals: no directory evals/nope/; skills with evals: probe-cmd probe-empty probe-fail probe-pass stray` and exits 2 without running `claude`. `make evals SKILL=stray` prints no skipped line, shows `== stray` and `No eval cases found`, then `evals: passed: none; failed: stray`, and exits 2. Then, after `rm -rf evals`, `make evals` prints `evals: passed: none; failed: none` and exits 0 (R2, R3).
- **P7** (Claude, in the real plugin directory; free): `git check-ignore -v evals/intent/results/x` names the `.gitignore` rule `evals/*/results/` (R11). Reading `.claude/CLAUDE.md` shows the Commands lines from step 5 (R12).
- **P8** (Claude, in the real plugin directory; free):
  - `grep -n evals scripts/check.sh` and `grep -nE 'make check|check\.sh' scripts/evals.sh` print nothing, and the `Makefile` `check` recipe is unchanged (R13).
  - `shellcheck scripts/evals.sh` exits 0, and so does `make check`'s shellcheck step. `grep -nE 'declare -A|mapfile|readarray|\$\{[^}]*(\^|,)' scripts/evals.sh` prints nothing. `command -v bash` is `/bin/bash`, version 3.2, so P1–P6 ran on Bash 3.2 (R14).
  - `scripts/lint-specs.sh .specs` reports nothing under `.specs/eval-target/`.
