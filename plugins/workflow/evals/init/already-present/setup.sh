#!/usr/bin/env bash
set -eu
git init -q
mkdir .handoff
printf 'keep me\n' >.handoff/.gitignore
