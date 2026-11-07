#!/usr/bin/env bash
# The todo-list fixture project with the plugin's planning rules, committed,
# so a grader can tell that the run commits nothing.
set -eu
cp -R "$(dirname "$0")/files/." .
mkdir -p .specs/_rules
cp "$(dirname "$0")"/../../../.specs/_rules/*.md .specs/_rules/
git init -q
git add -A
git -c user.name=eval -c user.email=eval@example.com commit -q -m scaffold
