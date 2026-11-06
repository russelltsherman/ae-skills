#!/usr/bin/env bash
set -eu
git init -q
mkdir -p .handoff
printf '*\n' > .handoff/.gitignore
printf 'PLACED BY SCAFFOLD - must stay unchanged\n' > ".handoff/$(date +%Y%m%d-%H%M)-billing.md"
