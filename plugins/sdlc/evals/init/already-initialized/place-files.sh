#!/usr/bin/env bash
# A project already set up for sdlc, committed, so a grader can tell that init changes and commits nothing.
set -eu
cp -R "$(dirname "$0")/files/." .
git init -q
git add -A
git -c user.name=eval -c user.email=eval@example.com commit -q -m scaffold
