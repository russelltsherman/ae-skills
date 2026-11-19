#!/usr/bin/env bash
set -eu
git init -q
printf '# Inventory service\n\nRun `make test` before every commit.\nIndent with tabs.\n' > AGENTS.md
