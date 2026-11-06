#!/usr/bin/env bash
# check: run every check, even after a failure, then print a summary line.
dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

failed=""
for c in validate shellcheck lint-readmes lint-evals tests; do
  bash "$dir/$c.sh" || failed="$failed $c"
done

if [ -n "$failed" ]; then
  echo "check: failed:$failed"
  exit 1
fi
echo "check: all passed"
