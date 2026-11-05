#!/usr/bin/env bash
# lint-evals: every skill has eval cases, every folder in evals/ is a skill, and
# every case folder has a goal line, a matching name, prompt.md, graders and the
# files named under context:.
# shellcheck source=lib.sh source-path=SCRIPTDIR
. "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

header lint-evals
need jq

re_name='^name:[[:space:]]*([A-Za-z0-9._-]+)[[:space:]]*$'
re_kv='^[[:space:]]+([A-Za-z0-9_-]+):[[:space:]]+([^[:space:]].*)$'
re_plain='^[A-Za-z0-9._/-]+$'

# check_case_yaml <case folder>: goal line, name, and context files.
# case.yaml is read line by line; only the simple forms are understood, and any
# other form of name: or context: is reported as "cannot read", not guessed at.
check_case_yaml() {
  local dir=$1 file="$1/case.yaml" case_name=${1##*/}
  local line first="" n=0 names=0 name="" name_bad=0
  local contexts=0 in_ctx=0 ctx_bad=0 ctx_files="" val f

  if [ ! -f "$file" ]; then
    problem "$file" "missing"
    return
  fi

  while IFS= read -r line || [ -n "$line" ]; do
    line=${line%$'\r'}
    n=$((n + 1))
    [ "$n" -eq 1 ] && first=$line

    if [ "$in_ctx" -eq 1 ]; then
      case "$line" in
        '') continue ;;
        ' '* | $'\t'*)
          case "${line#"${line%%[![:space:]]*}"}" in '#'*) continue ;; esac
          if [[ $line =~ $re_kv ]]; then
            val=${BASH_REMATCH[2]}
            val=${val%"${val##*[![:space:]]}"}
            if [[ $val =~ $re_plain ]]; then
              ctx_files="$ctx_files$val"$'\n'
            else
              ctx_bad=1
            fi
          else
            ctx_bad=1
          fi
          continue
          ;;
        *) in_ctx=0 ;;
      esac
    fi

    case "$line" in
      name:*)
        names=$((names + 1))
        if [[ $line =~ $re_name ]]; then
          name=${BASH_REMATCH[1]}
        else
          name_bad=1
        fi
        ;;
      context:*)
        contexts=$((contexts + 1))
        val=${line#context:}
        val=${val#"${val%%[![:space:]]*}"}
        case "$val" in
          '' | '#'*) in_ctx=1 ;;
          *) ctx_bad=1 ;;
        esac
        ;;
    esac
  done <"$file"

  case "$first" in
    '# Goal: Checks that'*) ;;
    *) problem "$file" 'line 1 does not start with "# Goal: Checks that"' ;;
  esac

  if [ "$names" -eq 0 ]; then
    problem "$file" "no top-level name"
  elif [ "$names" -gt 1 ] || [ "$name_bad" -eq 1 ]; then
    problem "$file" "cannot read name"
  elif [ "$name" != "$case_name" ]; then
    problem "$file" "name \"$name\" does not match folder $case_name"
  fi

  if [ "$contexts" -gt 1 ] || [ "$ctx_bad" -eq 1 ]; then
    problem "$file" "cannot read context"
  else
    while IFS= read -r f; do
      [ -n "$f" ] || continue
      [ -e "$dir/$f" ] || problem "$file" "context file $f not found"
    done <<<"$ctx_files"
  fi
}

# check_case <case folder>
check_case() {
  local dir=$1 g found=0
  check_case_yaml "$dir"
  [ -f "$dir/prompt.md" ] || problem "$dir/prompt.md" "missing"
  for g in "$dir"/graders/*.md; do
    [ -f "$g" ] && found=1 && break
  done
  [ "$found" -eq 1 ] || problem "$dir/graders" "no .md files"
}

skill_list=$(skills)

for s in $skill_list; do
  case_list=$(cases "$s")
  if [ -z "$case_list" ]; then
    problem "evals/$s" "no eval cases"
    continue
  fi
  for c in $case_list; do
    check_case "evals/$s/$c"
  done
done

for d in evals/*/; do
  [ -d "$d" ] || continue
  d=${d%/}
  n=${d##*/}
  in_list "$n" "$skill_list" || problem "evals/$n" "no skill named $n"
done

finish
