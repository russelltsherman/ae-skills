#!/usr/bin/env bash
set -eu
git init -q
mkdir -p .claude
printf '# Inventory service\n\nRun `make test` before every commit.\nIndent with tabs.\n' > .claude/CLAUDE.md
