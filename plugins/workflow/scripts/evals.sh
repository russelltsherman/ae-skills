#!/usr/bin/env bash
# evals: run each skill's eval cases with `claude plugin eval`, or one skill's
# with SKILL=<skill>. Extra options come from ARGS. These are billed model runs;
# `make check` never runs this script.
# shellcheck source=lib.sh source-path=SCRIPTDIR
. "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

need claude

# command_only <skill>: true when the SKILL.md front matter has
# `disable-model-invocation: true`.
command_only() {
  local f="skills/$1/SKILL.md" line n=0
  while IFS= read -r line || [ -n "$line" ]; do
    line=${line%$'\r'}
    n=$((n + 1))
    if [ "$n" -eq 1 ]; then
      [ "$line" = "---" ] || return 1
      continue
    fi
    [ "$line" = "---" ] && return 1
    if printf '%s\n' "$line" | grep -qE '^disable-model-invocation:[[:space:]]*true[[:space:]]*$'; then
      return 0
    fi
  done < "$f"
  return 1
}

# grants <skill>: fill the grants array from evals/<skill>/allow-tools, one
# grant per line, skipping blank lines and lines starting with #.
grants() {
  local f="evals/$1/allow-tools" line
  grants=()
  [ -f "$f" ] || return 0
  while IFS= read -r line || [ -n "$line" ]; do
    line=${line%$'\r'}
    line="${line#"${line%%[![:space:]]*}"}"
    line="${line%"${line##*[![:space:]]}"}"
    [ -z "$line" ] && continue
    case "$line" in '#'*) continue ;; esac
    grants+=("$line")
  done < "$f"
}

# Select the skills.
all="$(skills)"
if [ -z "${SKILL:-}" ]; then
  selected="$all"
elif in_list "$SKILL" "$all"; then
  selected="$SKILL"
else
  problem "skills/$SKILL" "no skill named $SKILL"
  exit 1
fi

# ARGS: split on whitespace, no quote handling, no glob expansion.
extra=()
read -r -a extra <<< "${ARGS:-}"

failed=""
for skill in $selected; do
  header "evals $skill"

  if [ -z "$(cases "$skill")" ]; then
    problem "evals/$skill" "no eval cases"
    failed="$failed $skill"
    continue
  fi

  args=(plugin eval . --eval-dir "evals/$skill" --scaffold --no-publish)
  if command_only "$skill"; then
    args+=(--ablation none)
  fi
  if [ "${#extra[@]}" -gt 0 ]; then
    args+=("${extra[@]}")
  fi
  grants "$skill"
  if [ "${#grants[@]}" -gt 0 ]; then
    args+=(--allow-tools "${grants[@]}")
  fi

  claude "${args[@]}" || failed="$failed $skill"
done

if [ -n "$failed" ]; then
  echo "evals: failed:$failed"
  exit 1
fi
echo "evals: all passed"
