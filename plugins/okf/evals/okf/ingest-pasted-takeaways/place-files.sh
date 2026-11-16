#!/usr/bin/env bash
# A small OKF vault with one concept page. Points the okf skill at the vault.
set -eu
cp -R "$(dirname "$0")/files/." .
mkdir -p .claude
printf -- '---\nvault_path: %s/vault\n---\n' "$(pwd)" > .claude/okf.local.md
