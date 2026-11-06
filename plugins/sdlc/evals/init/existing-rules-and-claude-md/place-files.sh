#!/usr/bin/env bash
# The project's own rule files and .claude/CLAUDE.md, committed, so a grader can tell that init commits nothing.
set -eu
cp -R "$(dirname "$0")/files/." .
git init -q
git add -A
git -c user.name=eval -c user.email=eval@example.com commit -q -m scaffold
