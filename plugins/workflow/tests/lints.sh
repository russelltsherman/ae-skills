#!/usr/bin/env bash
# Tests for scripts/lint-readmes.sh and scripts/lint-evals.sh. Run: bash tests/lints.sh
# Each case builds a small plugin tree in a temporary folder, makes one change,
# runs a lint, and checks its exit status and the problem lines it prints.
# No fixtures are checked in, and no model is called.

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP_ROOT="$(mktemp -d)"
trap 'rm -rf "$TMP_ROOT"' EXIT

FAILS=0
FX=""
BT=$(printf '\140')   # one backtick
FENCE="$BT$BT$BT"
GOAL="Checks that the reply says hi."

# fixture: a plugin with one skill, demo, a valid README and one valid case.
fixture() {
  FX="$(mktemp -d "$TMP_ROOT/fx.XXXXXX")"
  mkdir -p "$FX/scripts" "$FX/docs/skills/demo" "$FX/skills/demo" \
    "$FX/evals/demo/says-hi/graders"
  cp "$ROOT"/scripts/*.sh "$FX/scripts/"
  cp "$ROOT/docs/skills/README_TEMPLATE.md" "$FX/docs/skills/"
  printf -- '---\nname: demo\ndescription: Says hi.\n---\nSay hi.\n' >"$FX/skills/demo/SKILL.md"
  add_case demo says-hi "$GOAL"
  cat >"$FX/docs/skills/demo/README.md" <<README
# demo

A demo skill. Source of truth: [\`skills/demo/SKILL.md\`](../../../skills/demo/SKILL.md).

## What it does

It says hi.

## When to use it

- When you want a greeting.

## How to use it

\`\`\`
/demo
\`\`\`

## Details

### Greeting

It greets.

## Limits

- Only hi.

## Test cases

| Case | Goal |
| :---- | :---- |
| \`says-hi\` | $GOAL |
README
}

# add_case <skill> <case> <goal>: a valid case folder.
add_case() {
  local dir="$FX/evals/$1/$2"
  mkdir -p "$dir/graders"
  cat >"$dir/case.yaml" <<YAML
# Goal: $3
schema_version: "1.1"
name: $2
context:
  history_file: history.jsonl
expected_outcome: |
  It says hi.
YAML
  echo '{}' >"$dir/history.jsonl"
  echo '/demo' >"$dir/prompt.md"
  echo 'The reply says hi.' >"$dir/graders/01-says-hi.md"
}

readme() { printf '%s' "$FX/docs/skills/demo/README.md"; }
caseyaml() { printf '%s' "$FX/evals/demo/says-hi/case.yaml"; }

# edit <file> <sed expression>: edit a file in place (BSD and GNU sed).
edit() {
  sed "$2" "$1" >"$1.new" && mv "$1.new" "$1"
}

# expect <name> <script> <status: pass|fail> [<problem line>...]
# Runs the script in the current fixture and checks the result.
expect() {
  local name=$1 script=$2 want=$3 out status line ok=1 why=""
  shift 3
  out="$(cd / && PATH="${LINT_PATH:-$PATH}" "$BASH" "$FX/scripts/$script" 2>&1)"
  status=$?
  if [ "$want" = pass ] && [ "$status" -ne 0 ]; then
    ok=0 why="exit $status, want 0"
  elif [ "$want" = fail ] && [ "$status" -eq 0 ]; then
    ok=0 why="exit 0, want non-zero"
  fi
  for line in "$@"; do
    printf '%s\n' "$out" | grep -qxF -- "$line" || { ok=0; why="$why; no line: $line"; }
  done
  # R14: every problem line is "<path>: <problem>" with a path relative to the plugin.
  while IFS= read -r line; do
    case "$line" in '== '* | '') continue ;; esac
    if ! [[ $line =~ ^[^\ /].*:\  ]] || [[ $line == *"$FX"* ]]; then
      ok=0 why="$why; bad problem line: $line"
    fi
  done <<<"$out"
  if [ "$ok" -eq 1 ]; then
    echo "ok   $name"
  else
    echo "FAIL $name (${why#; })"
    printf '%s\n' "$out" | sed 's/^/     | /'
    FAILS=$((FAILS + 1))
  fi
}

R=docs/skills/demo/README.md
C=evals/demo/says-hi/case.yaml

# R6 to R13: the unchanged fixture passes both lints.
fixture
expect "fixture passes lint-readmes" lint-readmes.sh pass
expect "fixture passes lint-evals" lint-evals.sh pass

# R6: a *-workspace folder without SKILL.md is not a skill; results/ is not a case.
fixture
mkdir -p "$FX/skills/demo-workspace/iteration-1" "$FX/evals/demo/results/run-1"
expect "workspace and results ignored by lint-readmes" lint-readmes.sh pass
expect "workspace and results ignored by lint-evals" lint-evals.sh pass

# R7, R8, R9
fixture
rm "$(readme)"
expect "missing README" lint-readmes.sh fail "$R: missing"
fixture
edit "$(readme)" '1s/.*/# Demo/'
expect "wrong title line" lint-readmes.sh fail "$R: line 1 is not \"# demo\""
fixture
edit "$(readme)" 's|(../../../skills/demo/SKILL.md)|(SKILL.md)|'
expect "missing SKILL.md link" lint-readmes.sh fail "$R: no link to ../../../skills/demo/SKILL.md"

# R10: headings
fixture
edit "$(readme)" 's/^## What it does$/## What it is/'
expect "renamed ## heading" lint-readmes.sh fail \
  "$R: unknown ## heading \"What it is\"" "$R: missing ## heading \"What it does\""
fixture
edit "$(readme)" 's/^## When to use it$/## TMP/; s/^## How to use it$/## When to use it/; s/^## TMP$/## How to use it/'
expect "two ## headings swapped" lint-readmes.sh fail \
  "$R: ## headings out of order: What it does, How to use it, When to use it, Details, Limits, Test cases; expected What it does, When to use it, How to use it, Details, Limits, Test cases"
fixture
printf '\n## Notes\n\nMore.\n' >>"$(readme)"
expect "extra ## heading" lint-readmes.sh fail "$R: unknown ## heading \"Notes\""
fixture
edit "$(readme)" 's/^## Details$/### Example/'
expect "### under How to use it" lint-readmes.sh fail \
  "$R: heading \"### Example\" is not under ## Details"
fixture
edit "$(readme)" '/^## Details$/,/^## Test cases$/{/^## Test cases$/!d;}'
expect "no Details and no Limits passes" lint-readmes.sh pass
fixture
edit "$(readme)" "s/^It greets\\.\$/${FENCE}markdown\\n## Summary\\n${FENCE}/"
grep -qx '## Summary' "$(readme)" || echo "     (fixture edit did not add ## Summary)"
expect "## Summary in a fenced block is ignored" lint-readmes.sh pass

# R11: Test cases table
fixture
add_case demo says-bye "Checks that the reply says bye."
expect "case with no row" lint-readmes.sh fail "$R: Test cases: no row for case says-bye"
fixture
printf '| %s | Checks that nothing. |\n' "${BT}ghost$BT" >>"$(readme)"
expect "row for no case" lint-readmes.sh fail "$R: Test cases: row ghost names no case"
fixture
printf '| %s | %s |\n' "${BT}says-hi$BT" "$GOAL" >>"$(readme)"
expect "duplicate row" lint-readmes.sh fail "$R: Test cases: duplicate row for says-hi"
fixture
edit "$(readme)" 's/| Checks that the reply says hi\. |/| Checks that it says hello. |/'
expect "goal differs from case.yaml" lint-readmes.sh fail \
  "$R: Test cases: goal for says-hi differs: README \"Checks that it says hello.\" vs case.yaml \"$GOAL\""

# R12: folders in evals/
fixture
mkdir -p "$FX/skills/quiet"
echo 'Quiet.' >"$FX/skills/quiet/SKILL.md"
expect "skill with no cases" lint-evals.sh fail "evals/quiet: no eval cases"
fixture
mkdir -p "$FX/evals/stray/some-case"
expect "evals folder with no skill" lint-evals.sh fail "evals/stray: no skill named stray"

# R13: case files
fixture
edit "$(caseyaml)" '1s/.*/# Goal: says hi./'
expect "goal without 'Checks that '" lint-evals.sh fail \
  "$C: line 1 does not start with \"# Goal: Checks that\""
fixture
edit "$(caseyaml)" 's/^name: says-hi$/name: say-hi/'
expect "name differs from folder" lint-evals.sh fail "$C: name \"say-hi\" does not match folder says-hi"
fixture
rm "$FX/evals/demo/says-hi/prompt.md"
expect "missing prompt.md" lint-evals.sh fail "evals/demo/says-hi/prompt.md: missing"
fixture
rm "$FX"/evals/demo/says-hi/graders/*.md
expect "empty graders/" lint-evals.sh fail "evals/demo/says-hi/graders: no .md files"
fixture
rm "$FX/evals/demo/says-hi/history.jsonl"
expect "missing context file" lint-evals.sh fail "$C: context file history.jsonl not found"
fixture
edit "$(caseyaml)" '/^context:$/{N;s/.*/context: {history_file: history.jsonl}/;}'
expect "flow-map context" lint-evals.sh fail "$C: cannot read context"
fixture
cat >>"$(caseyaml)" <<'YAML'
execution:
  env:
    GIT_DIR: /nonexistent
YAML
expect "execution: after context: is not context" lint-evals.sh pass

# R3: a missing jq is reported by name.
NOJQ="$TMP_ROOT/nojq-bin"
mkdir -p "$NOJQ"
IFS=: read -r -a path_dirs <<<"$PATH"
for d in "${path_dirs[@]}"; do
  [ -d "$d" ] || continue
  for t in "$d"/*; do
    n=${t##*/}
    [ "$n" = jq ] && continue
    [ -x "$t" ] && [ ! -e "$NOJQ/$n" ] && ln -s "$t" "$NOJQ/$n"
  done
done
fixture
LINT_PATH="$NOJQ" expect "lint-readmes without jq" lint-readmes.sh fail "jq: not installed"
LINT_PATH="$NOJQ" expect "lint-evals without jq" lint-evals.sh fail "jq: not installed"

if [ "$FAILS" -gt 0 ]; then
  echo "$FAILS FAIL"
  exit 1
fi
echo "all ok"
