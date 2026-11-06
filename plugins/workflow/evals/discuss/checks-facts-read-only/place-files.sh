#!/usr/bin/env bash
set -eu
git init -q -b main
printf '# Project\n' > README.md
mkdir -p config
printf 'max_upload_mb: 37\nmax_files_per_request: 5\n' > config/limits.yaml
git add -A
git diff --cached --quiet || git -c user.name=eval -c user.email=eval@example.invalid commit -q -m 'scaffold'
