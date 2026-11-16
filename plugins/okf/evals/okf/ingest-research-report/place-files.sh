#!/usr/bin/env bash
# A small OKF vault (one concept, one Shopify entity page that tells only Shopify's own success
# story) plus the research report to ingest. Points the okf skill at the vault.
set -eu
cp -R "$(dirname "$0")/files/." .
mkdir -p .claude
printf -- '---\nvault_path: %s/vault\n---\n' "$(pwd)" > .claude/okf.local.md
