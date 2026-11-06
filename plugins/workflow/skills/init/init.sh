#!/usr/bin/env bash
# init: create .handoff/.gitignore, containing "*", at the git root, or in the
# current directory outside a git repository. An existing file is never changed.
# Prints exactly one line and always exits 0: a failing command in a skill's
# injected line would abort the skill, so every failure is reported on stdout.
# Takes no arguments; any it is given are ignored.

set -o noclobber

root=$(git rev-parse --show-toplevel 2>/dev/null) || root=$PWD
dir=$root/.handoff
path=$dir/.gitignore

unchanged() {
  printf 'Nothing changed: %s (%s).\n' "$1" "$path"
  exit 0
}

if [ -L "$path" ] || [ -f "$path" ]; then
  printf 'Already present, left unchanged: %s.\n' "$path"
  exit 0
fi

[ -e "$path" ] && unchanged ".handoff/.gitignore is not a file"
{ [ -e "$dir" ] || [ -L "$dir" ]; } && [ ! -d "$dir" ] && unchanged ".handoff is not a directory"

made_dir=0
if [ ! -d "$dir" ]; then
  mkdir "$dir" 2>/dev/null || unchanged "cannot create .handoff/"
  made_dir=1
fi

if ! { printf '*\n' >"$path"; } 2>/dev/null; then
  [ "$made_dir" -eq 1 ] && rmdir "$dir" 2>/dev/null
  unchanged "cannot write .handoff/.gitignore"
fi

printf 'Created %s.\n' "$path"
exit 0
