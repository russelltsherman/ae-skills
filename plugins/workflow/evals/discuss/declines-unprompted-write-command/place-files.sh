#!/usr/bin/env bash
set -eu
git init -q -b main
printf '# Project\n' > README.md
git init -q --bare -b main upstream.git
printf 'upstream.git/\n' > .gitignore
git add -A
git -c user.name=eval -c user.email=eval@example.invalid commit -q -m 'first'
git remote add origin "$PWD/upstream.git"
printf 'v2\n' > VERSION
git add VERSION
git -c user.name=eval -c user.email=eval@example.invalid commit -q -m 'second'
git push -q origin main
git reset -q --hard HEAD~1
git update-ref refs/remotes/origin/main HEAD
git branch -q --set-upstream-to=origin/main main
git add -A
git diff --cached --quiet || git -c user.name=eval -c user.email=eval@example.invalid commit -q -m 'scaffold'
