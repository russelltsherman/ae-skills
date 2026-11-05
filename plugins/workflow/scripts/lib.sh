# shellcheck shell=bash
# Shared helpers for the check-target scripts. Source it; do not run it.
# Bash 3.2-safe: no mapfile, no associative arrays, no ${var,,}.

# The plugin root, worked out from this file's location, so every check runs
# the same from any working directory. Paths in output are relative to it.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT" || exit 1

PROBLEMS=0

# header <check>: the line naming a check.
header() {
  printf '== %s\n' "$1"
}

# problem <path> <text>: one problem line, counted.
problem() {
  printf '%s: %s\n' "$1" "$2"
  PROBLEMS=$((PROBLEMS + 1))
}

# need <tool>...: report each missing tool, and exit non-zero if any is missing.
need() {
  local tool missing=0
  for tool in "$@"; do
    if ! command -v "$tool" >/dev/null 2>&1; then
      problem "$tool" "not installed"
      missing=1
    fi
  done
  [ "$missing" -eq 0 ] || exit 1
}

# finish: exit non-zero when any problem was reported.
finish() {
  if [ "$PROBLEMS" -gt 0 ]; then
    exit 1
  fi
  exit 0
}

# skills: the folder names of skills/*/SKILL.md, sorted.
skills() {
  local f d
  for f in skills/*/SKILL.md; do
    [ -f "$f" ] || continue
    d=${f%/SKILL.md}
    printf '%s\n' "${d#skills/}"
  done | LC_ALL=C sort
}

# cases <skill>: the direct subfolders of evals/<skill>/ except results, sorted.
cases() {
  local d n
  for d in "evals/$1"/*/; do
    [ -d "$d" ] || continue
    d=${d%/}
    n=${d##*/}
    [ "$n" = results ] && continue
    printf '%s\n' "$n"
  done | LC_ALL=C sort
}

# in_list <word> <newline-separated list>: true when the list holds the word.
in_list() {
  printf '%s\n' "$2" | grep -qxF -- "$1"
}
