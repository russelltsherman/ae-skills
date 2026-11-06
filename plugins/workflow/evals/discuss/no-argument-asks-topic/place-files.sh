#!/usr/bin/env bash
set -eu
git init -q -b main
printf '# Project\n' > README.md
git add -A
git diff --cached --quiet || git -c user.name=eval -c user.email=eval@example.invalid commit -q -m 'scaffold'
