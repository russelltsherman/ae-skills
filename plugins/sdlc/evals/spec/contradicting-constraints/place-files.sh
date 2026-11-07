#!/usr/bin/env bash
# The todo-list fixture project and its change directory, with the plugin's
# planning rules copied at run time so the case tests the shipped rules.
# Committed, so the session has a git context.
set -eu
cp -R "$(dirname "$0")/files/." .
cp -R "$(dirname "$0")/../../../.specs/_rules" .specs/
git init -q
git add -A
git -c user.name=eval -c user.email=eval@example.com commit -q -m scaffold
