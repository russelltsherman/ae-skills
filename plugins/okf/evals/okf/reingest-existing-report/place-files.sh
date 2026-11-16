#!/usr/bin/env bash
# A vault that already ingested the CQRS report the old way: source page with an absolute
# resource path from another machine, no raw copy, no open questions; a CQRS concept page
# that also carries lines from the microservices and ISR sources; a Netflix page that
# overstates RAW Hollow's consistency. Plus the same report, to ingest again.
set -eu
cp -R "$(dirname "$0")/files/." .
mkdir -p .claude
printf -- '---\nvault_path: %s/vault\n---\n' "$(pwd)" > .claude/okf.local.md
