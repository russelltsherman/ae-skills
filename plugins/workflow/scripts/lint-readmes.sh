#!/usr/bin/env bash
# lint-readmes: every skill has docs/skills/<skill>/README.md with the title
# line, the SKILL.md link, the template's ## headings in order, and a Test cases
# table that matches evals/<skill>/.
# shellcheck source=lib.sh source-path=SCRIPTDIR
. "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

header lint-readmes
need jq

template=docs/skills/README_TEMPLATE.md
optional=$'Details\nLimits'
re_heading='^(#+)[[:space:]]+(.*[^[:space:]])[[:space:]]*$'

is_fence() {
  case "$1" in '```'* | '~~~'*) return 0 ;; esac
  return 1
}

trim() {
  local s=$1
  s=${s#"${s%%[![:space:]]*}"}
  s=${s%"${s##*[![:space:]]}"}
  printf '%s' "$s"
}

# The template's ## headings: those inside the fenced block under "## Template".
template_headings() {
  local line state=0 fence=0
  while IFS= read -r line || [ -n "$line" ]; do
    line=${line%$'\r'}
    if is_fence "$line"; then
      if [ "$state" -eq 1 ] && [ "$fence" -eq 0 ]; then
        state=2
        fence=1
        continue
      fi
      [ "$state" -eq 2 ] && return
      fence=$((1 - fence))
      continue
    fi
    if [ "$state" -eq 0 ] && [ "$fence" -eq 0 ] && [ "$line" = "## Template" ]; then
      state=1
    elif [ "$state" -eq 2 ]; then
      case "$line" in '## '*) trim "${line#'## '}" && echo ;; esac
    fi
  done <"$template"
}

# join <newline-separated list>: the items as "a, b, c".
join() {
  printf '%s\n' "$1" | sed '/^$/d' | paste -sd ',' - | sed 's/,/, /g'
}

# check_headings <readme>
check_headings() {
  local readme=$1 line fence=0 h2s="" current="" level text h seen="" known="" expected="" content
  content=$(cat "$readme")
  while IFS= read -r line || [ -n "$line" ]; do
    line=${line%$'\r'}
    if is_fence "$line"; then
      fence=$((1 - fence))
      continue
    fi
    [ "$fence" -eq 1 ] && continue
    [[ $line =~ $re_heading ]] || continue
    level=${#BASH_REMATCH[1]}
    text=${BASH_REMATCH[2]}
    if [ "$level" -eq 2 ]; then
      h2s="$h2s$text"$'\n'
      current=$text
    elif [ "$level" -ge 3 ] && [ "$current" != "Details" ]; then
      problem "$readme" "heading \"${BASH_REMATCH[1]} $text\" is not under ## Details"
    fi
  done <<<"$content"

  while IFS= read -r h; do
    [ -n "$h" ] || continue
    if ! in_list "$h" "$template_list"; then
      problem "$readme" "unknown ## heading \"$h\""
    elif in_list "$h" "$seen"; then
      problem "$readme" "duplicate ## heading \"$h\""
    else
      known="$known$h"$'\n'
    fi
    seen="$seen$h"$'\n'
  done <<<"$h2s"

  while IFS= read -r h; do
    [ -n "$h" ] || continue
    if in_list "$h" "$known"; then
      expected="$expected$h"$'\n'
    elif ! in_list "$h" "$optional"; then
      problem "$readme" "missing ## heading \"$h\""
    fi
  done <<<"$template_list"

  if [ "$known" != "$expected" ]; then
    problem "$readme" "## headings out of order: $(join "$known"); expected $(join "$expected")"
  fi
}

# check_table <readme> <skill>
check_table() {
  local readme=$1 skill=$2 line fence=0 state=0 rows=0 row c1 c2 goal first c
  local case_list seen="" content
  case_list=$(cases "$skill")
  content=$(cat "$readme")
  while IFS= read -r line || [ -n "$line" ]; do
    line=${line%$'\r'}
    if is_fence "$line"; then
      fence=$((1 - fence))
      [ "$state" -eq 2 ] && break
      continue
    fi
    [ "$fence" -eq 1 ] && continue
    if [ "$state" -eq 0 ]; then
      [ "$line" = "## Test cases" ] && state=1
      continue
    fi
    case "$line" in
      '|'*) state=2 ;;
      '## '*) break ;;
      *) [ "$state" -eq 2 ] && break
         continue ;;
    esac
    rows=$((rows + 1))
    [ "$rows" -eq 1 ] && continue
    [[ $line =~ ^\|[[:space:]:|-]+$ ]] && continue

    row=${line#|}
    c1=$(trim "${row%%|*}")
    c1=${c1#\`}
    c1=${c1%\`}
    c2=$(trim "${row#*|}")
    c2=$(trim "${c2%|}")

    if ! in_list "$c1" "$case_list"; then
      problem "$readme" "Test cases: row $c1 names no case"
      continue
    fi
    if in_list "$c1" "$seen"; then
      problem "$readme" "Test cases: duplicate row for $c1"
      continue
    fi
    seen="$seen$c1"$'\n'

    first=""
    [ -f "evals/$skill/$c1/case.yaml" ] && IFS= read -r first <"evals/$skill/$c1/case.yaml"
    first=${first%$'\r'}
    case "$first" in
      '# Goal: '*)
        goal=${first#'# Goal: '}
        [ "$c2" = "$goal" ] ||
          problem "$readme" "Test cases: goal for $c1 differs: README \"$c2\" vs case.yaml \"$goal\""
        ;;
      *) problem "$readme" "Test cases: goal for $c1 cannot be checked: case.yaml line 1 has no \"# Goal: \"" ;;
    esac
  done <<<"$content"

  for c in $case_list; do
    in_list "$c" "$seen" || problem "$readme" "Test cases: no row for case $c"
  done
}

template_list=""
[ -f "$template" ] && template_list=$(template_headings)
if [ -z "$template_list" ]; then
  problem "$template" "cannot read template headings"
  finish
fi

for s in $(skills); do
  readme="docs/skills/$s/README.md"
  if [ ! -f "$readme" ]; then
    problem "$readme" "missing"
    continue
  fi
  first=""
  IFS= read -r first <"$readme"
  first=${first%$'\r'}
  [ "$first" = "# $s" ] || problem "$readme" "line 1 is not \"# $s\""
  grep -qF "](../../../skills/$s/SKILL.md)" "$readme" ||
    problem "$readme" "no link to ../../../skills/$s/SKILL.md"
  check_headings "$readme"
  check_table "$readme" "$s"
done

finish
