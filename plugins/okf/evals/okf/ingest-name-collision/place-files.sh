#!/usr/bin/env bash
# A vault that already has pattern-vertical-slice (the code-organisation pattern), its research
# source and Jimmy Bogard's entity page, plus a fictional article about vertical slicing as a
# delivery practice: same words, different idea.
set -eu
cp -R "$(dirname "$0")/files/." .
mkdir -p .claude
printf -- '---\nvault_path: %s/vault\n---\n' "$(pwd)" > .claude/okf.local.md
