#!/usr/bin/env bash
# The tests check: run each tests/*.sh in sorted order, and report each one that fails.
# shellcheck source=lib.sh source-path=SCRIPTDIR
. "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

header tests

for t in tests/*.sh; do
  [ -f "$t" ] || continue
  bash "$t" || problem "$t" "failed"
done

finish
