#!/usr/bin/env bash
# The todo-list fixture project and its change directory, with no
# .specs/_rules/: the project has not been set up by init.
# Committed, so the session has a git context.
set -eu
cp -R "$(dirname "$0")/files/." .
git init -q
git add -A
git -c user.name=eval -c user.email=eval@example.com commit -q -m scaffold
