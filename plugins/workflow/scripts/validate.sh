#!/usr/bin/env bash
# validate: both `claude plugin validate` commands, output passed through unchanged.
# shellcheck source=lib.sh source-path=SCRIPTDIR
. "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

header validate
need claude jq

status=0
claude plugin validate --strict . || status=1
claude plugin validate --profile directory . || status=1
exit "$status"
