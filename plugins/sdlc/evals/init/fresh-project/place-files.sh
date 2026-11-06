#!/usr/bin/env bash
# An empty git project with one commit, so a grader can tell that init commits nothing.
set -eu
git init -q
git -c user.name=eval -c user.email=eval@example.com commit -q --allow-empty -m scaffold
