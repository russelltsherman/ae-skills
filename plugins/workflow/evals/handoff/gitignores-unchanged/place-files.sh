#!/usr/bin/env bash
set -eu
git init -q
mkdir -p .handoff
printf '*.md\n' > .handoff/.gitignore
printf 'node_modules/\n' > .gitignore
