#!/usr/bin/env bash
# The shellcheck check: every .sh file in the plugin, except under results/ or *-workspace/
# folders, with shellcheck's defaults and no .shellcheckrc. The planning folder is pruned, unread.
# shellcheck source=lib.sh source-path=SCRIPTDIR
. "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

header shellcheck
need shellcheck jq

files=()
while IFS= read -r f; do
  files+=("${f#./}")
done < <(
  find . -path ./.specs -prune -o \
    \( -type d \( -name results -o -name '*-workspace' \) \) -prune -o \
    -type f -name '*.sh' -print | LC_ALL=C sort
)

[ "${#files[@]}" -eq 0 ] && exit 0
shellcheck --norc "${files[@]}"
