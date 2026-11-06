#!/usr/bin/env bash
# `make evals`: run the skills' eval cases with `claude plugin eval`. These are
# real, billed model runs. Every selected skill runs even after one fails; the
# run ends with one summary line and exits 1 when any skill failed.
# Reads SKILL (one skill, or empty for all) and ARGS (extra options for every
# run) from the environment; make passes its command-line variables there.
# Spec: .specs/eval-target/20261106-0657-create/spec.md
#
# Bash 3.2 features only, plus the POSIX features of the utilities it calls
# that BSD and GNU share (spec R14).

cd "$(dirname "$0")/.." || exit 2

SKILL=${SKILL-}
ARGS=${ARGS-}

errlog=$(mktemp "${TMPDIR:-/tmp}/evals.XXXXXX") || exit 2
trap 'rm -f "$errlog"' EXIT

# Every directory directly under evals/, by name, in name order.
eval_dirs() {
  [ -d evals ] || return 0
  find evals -mindepth 1 -maxdepth 1 -type d | sed 's|^evals/||' | sort
}

# command_only <skill>: true when skills/<skill>/SKILL.md has the front-matter
# line `disable-model-invocation: true` (R5).
command_only() {
  local f="skills/$1/SKILL.md"
  [ -f "$f" ] || return 1
  awk '
    NR == 1 && $0 != "---" { exit }
    NR > 1 && $0 == "---" { exit }
    NR > 1 && $0 == "disable-model-invocation: true" { found = 1; exit }
    END { exit !found }
  ' "$f"
}

# Select (R2, R3).
selected=()
skipped=''
if [ -z "$SKILL" ]; then
  while IFS= read -r name; do
    if [ -d "skills/$name" ]; then
      selected+=("$name")
    else
      skipped="$skipped $name"
    fi
  done < <(eval_dirs)
else
  if [ ! -d "evals/$SKILL" ]; then
    list=$(eval_dirs | tr '\n' ' ' | sed 's/ $//')
    echo "evals: no directory evals/$SKILL/; skills with evals: ${list:-none}"
    exit 1
  fi
  selected=("$SKILL")
fi

# ARGS: split on whitespace, quotes not interpreted, never globbed (R6).
IFS=$' \t\n'
set -f
# shellcheck disable=SC2206 # word splitting of ARGS is intended (spec R6)
extra=($ARGS)
set +f

if [ -n "$skipped" ]; then
  echo "evals: skipped (no skills/<name>/):$skipped"
fi

# Run (R4, R7, R8, R9).
passed=''
failed=''
for name in ${selected[@]+"${selected[@]}"}; do
  args=(. --eval-dir "evals/$name" --no-publish --scaffold)
  if command_only "$name"; then
    args+=(--ablation none)
  fi
  args+=(${extra[@]+"${extra[@]}"})
  echo "== $name"
  # stdin and stdout stay the terminal's; only stderr is copied to the log.
  { claude plugin eval "${args[@]}" 2>&1 1>&3 3>&- | tee -a "$errlog" >&2; } 3>&1
  if [ "${PIPESTATUS[0]}" -eq 0 ]; then
    passed="${passed:+$passed }$name"
  else
    failed="${failed:+$failed }$name"
  fi
done

# Report (R9, R10).
echo "evals: passed: ${passed:-none}; failed: ${failed:-none}"
if grep -q 'is not a trusted plugin directory' "$errlog"; then
  echo "evals: this plugin directory is not trusted yet. Run make evals once in a terminal and answer y to trust it."
fi
[ -z "$failed" ]
