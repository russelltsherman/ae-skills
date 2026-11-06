#!/usr/bin/env bash
set -eu
git init -q
mkdir -p .handoff
printf '*\n' > .handoff/.gitignore
