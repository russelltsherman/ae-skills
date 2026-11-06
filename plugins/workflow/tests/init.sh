#!/usr/bin/env bash
# Tests for skills/init/init.sh. Run: bash tests/init.sh
# Each case makes its own temporary directory, runs the script from inside it,
# and checks the one line it prints, its exit status, empty stderr, and the
# files left behind. No fixtures are checked in, and no model is called.
# Conditions passed to check are single-quoted on purpose: check evals them
# after the run, so their $variables must not expand at the call.
# shellcheck disable=SC2016

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT="$ROOT/skills/init/init.sh"
# pwd -P, so paths match what git prints on systems where the temp dir is a symlink.
TMP_ROOT="$(cd "$(mktemp -d)" && pwd -P)"
trap 'chmod -R u+w "$TMP_ROOT" 2>/dev/null; rm -rf "$TMP_ROOT"' EXIT

FAILS=0
OUT=""
ERR=""
STATUS=0

if ! command -v git >/dev/null 2>&1; then
  echo "git: not installed"
  exit 1
fi

# A PATH holding only what the script needs besides git, so git can't be found
# on any OS layout (on macOS and merged-/usr Linux, git sits beside mkdir).
NOGIT="$TMP_ROOT/nogit-bin"
mkdir -p "$NOGIT"
for t in bash mkdir rmdir; do
  ln -s "$(command -v "$t")" "$NOGIT/$t"
done

AS_ROOT=0
[ "$(id -u)" -eq 0 ] && AS_ROOT=1

# newdir: a fresh empty directory, printed.
newdir() {
  mktemp -d "$TMP_ROOT/case.XXXXXX"
}

# newrepo: a fresh git repository, printed.
newrepo() {
  local d
  d=$(newdir)
  git -C "$d" init -q
  printf '%s\n' "$d"
}

# run <dir> [args...]: run the script from <dir>; sets OUT, ERR, STATUS.
# RUN_PATH and RUN_UMASK, when set, apply to that run only.
run() {
  local d=$1 errf="$TMP_ROOT/stderr"
  shift
  OUT=$(
    cd "$d" || exit 99
    [ -n "${RUN_UMASK:-}" ] && umask "$RUN_UMASK"
    if [ -n "${RUN_PATH:-}" ]; then
      PATH="$RUN_PATH" bash "$SCRIPT" "$@" 2>"$errf"
    else
      bash "$SCRIPT" "$@" 2>"$errf"
    fi
  )
  STATUS=$?
  ERR=$(cat "$errf")
}

# check <name> <want line> [condition...]: one ok/FAIL line. The run must print
# exactly <want line>, nothing on stderr, and exit 0; each condition is a shell
# expression that must be true afterwards.
check() {
  local name=$1 want=$2 why=""
  shift 2
  [ "$STATUS" -eq 0 ] || why="$why; exit $STATUS, want 0"
  [ "$OUT" = "$want" ] || why="$why; printed [$OUT], want [$want]"
  [ -z "$ERR" ] || why="$why; stderr: $ERR"
  local c
  for c in "$@"; do
    eval "$c" || why="$why; not true: $c"
  done
  if [ -z "$why" ]; then
    echo "ok   $name"
  else
    echo "FAIL $name (${why#; })"
    FAILS=$((FAILS + 1))
  fi
}

skip() {
  echo "skip $1 ($2)"
}

# is_star <file>: the file holds exactly "*" and a newline.
is_star() {
  [ "$(od -An -c "$1" | tr -d ' \n')" = '*\n' ]
}

# --- created ---

d=$(newrepo)
run "$d"
check "git repository, from the root" "Created $d/.handoff/.gitignore." \
  'is_star "$d/.handoff/.gitignore"'

d=$(newrepo)
mkdir -p "$d/a/b"
run "$d/a/b"
check "git repository, from a subdirectory" "Created $d/.handoff/.gitignore." \
  'is_star "$d/.handoff/.gitignore"' '[ ! -e "$d/a/b/.handoff" ]'

d=$(newdir)
run "$d"
check "not a git repository" "Created $d/.handoff/.gitignore." \
  'is_star "$d/.handoff/.gitignore"'

d=$(newdir)
RUN_PATH=$NOGIT run "$d"
check "git not on PATH" "Created $d/.handoff/.gitignore." \
  'is_star "$d/.handoff/.gitignore"'

d=$(newrepo)
run "$d" foo --bar
check "extra arguments are ignored" "Created $d/.handoff/.gitignore." \
  'is_star "$d/.handoff/.gitignore"' '[ "$(ls -A "$d/.handoff")" = .gitignore ]'

d=$(newrepo)
mkdir "$d/real"
ln -s real "$d/.handoff"
run "$d"
check ".handoff is a symlink to a directory" "Created $d/.handoff/.gitignore." \
  'is_star "$d/real/.gitignore"' '[ -L "$d/.handoff" ]'

d=$(newrepo)
printf 'node_modules/\n' >"$d/.gitignore"
cp "$d/.gitignore" "$TMP_ROOT/project-gitignore"
run "$d"
check "project .gitignore untouched" "Created $d/.handoff/.gitignore." \
  'cmp -s "$d/.gitignore" "$TMP_ROOT/project-gitignore"'

# --- already present ---

d=$(newrepo)
mkdir "$d/.handoff"
printf 'keep me' >"$d/.handoff/.gitignore"
touch -t 202001010000 "$d/.handoff/.gitignore"
run "$d"
check "already present, other content" "Already present, left unchanged: $d/.handoff/.gitignore." \
  '[ "$(cat "$d/.handoff/.gitignore")" = "keep me" ]' \
  '[ -z "$(find "$d/.handoff/.gitignore" -newermt 2020-01-02)" ]'

d=$(newrepo)
mkdir "$d/.handoff"
printf 'target\n' >"$d/target"
ln -s ../target "$d/.handoff/.gitignore"
run "$d"
check "symlink to a file" "Already present, left unchanged: $d/.handoff/.gitignore." \
  '[ -L "$d/.handoff/.gitignore" ]' '[ "$(cat "$d/target")" = target ]'

d=$(newrepo)
mkdir "$d/.handoff"
ln -s ../missing "$d/.handoff/.gitignore"
run "$d"
check "broken symlink" "Already present, left unchanged: $d/.handoff/.gitignore." \
  '[ -L "$d/.handoff/.gitignore" ]' '[ ! -e "$d/missing" ]'

# --- nothing changed ---

d=$(newrepo)
mkdir -p "$d/.handoff/.gitignore"
run "$d"
check "directory at .handoff/.gitignore" \
  "Nothing changed: .handoff/.gitignore is not a file ($d/.handoff/.gitignore)." \
  '[ -d "$d/.handoff/.gitignore" ]' '[ -z "$(ls -A "$d/.handoff/.gitignore")" ]'

d=$(newrepo)
printf 'notes\n' >"$d/.handoff"
run "$d"
check ".handoff is a regular file" \
  "Nothing changed: .handoff is not a directory ($d/.handoff/.gitignore)." \
  '[ -f "$d/.handoff" ]' '[ "$(cat "$d/.handoff")" = notes ]'

d=$(newrepo)
ln -s missing "$d/.handoff"
run "$d"
check ".handoff is a broken symlink" \
  "Nothing changed: .handoff is not a directory ($d/.handoff/.gitignore)." \
  '[ -L "$d/.handoff" ]' '[ ! -e "$d/missing" ]'

if [ "$AS_ROOT" -eq 1 ]; then
  skip "target directory not writable" "running as root"
  skip ".handoff/ not writable" "running as root"
  skip ".handoff/ created, then the write fails" "running as root"
else
  d=$(newdir)
  chmod a-w "$d"
  run "$d"
  check "target directory not writable" \
    "Nothing changed: cannot create .handoff/ ($d/.handoff/.gitignore)." \
    '[ ! -e "$d/.handoff" ]'
  chmod u+w "$d"

  d=$(newrepo)
  mkdir "$d/.handoff"
  chmod a-w "$d/.handoff"
  run "$d"
  check ".handoff/ not writable" \
    "Nothing changed: cannot write .handoff/.gitignore ($d/.handoff/.gitignore)." \
    '[ -d "$d/.handoff" ]' '[ -z "$(ls -A "$d/.handoff")" ]'
  chmod u+w "$d/.handoff"

  d=$(newrepo)
  RUN_UMASK=0277 run "$d"
  check ".handoff/ created, then the write fails" \
    "Nothing changed: cannot write .handoff/.gitignore ($d/.handoff/.gitignore)." \
    '[ ! -e "$d/.handoff" ]'
fi

if [ "$FAILS" -gt 0 ]; then
  echo "$FAILS FAIL"
  exit 1
fi
echo "all ok"
