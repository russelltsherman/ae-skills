#!/usr/bin/env bats
# Tests for scripts/init.sh (spec: .specs/init-skill/20261106-0658-create/spec.md).
# The script is always run with /bin/bash, which is Bash 3.2 on macOS (R14).

SCRIPT="$BATS_TEST_DIRNAME/../scripts/init.sh"

setup() {
  PLUGIN="$BATS_TEST_TMPDIR/plugin"
  PROJ="$BATS_TEST_TMPDIR/project"
  mkdir -p "$PLUGIN/.claude-plugin" "$PLUGIN/.specs/_rules/sub" "$PROJ"
  printf '{"name":"sdlc","version":"9.8.7"}\n' > "$PLUGIN/.claude-plugin/plugin.json"
  printf 'rule a\n' > "$PLUGIN/.specs/_rules/a.md"
  printf 'rule b\n' > "$PLUGIN/.specs/_rules/b.md"
  printf 'not copied\n' > "$PLUGIN/.specs/_rules/sub/c.md"
  printf 'not copied\n' > "$PLUGIN/.specs/_rules/.hidden"

  EXPECTED_SECTION="$BATS_TEST_TMPDIR/section.txt"
  cat > "$EXPECTED_SECTION" <<'EOF'
<!-- sdlc:begin -->
## sdlc

This project uses the `sdlc` plugin. Its planning documents live in `.specs/`; read the rules in `.specs/_rules/` before creating, finding or editing anything there.
<!-- sdlc:end -->
EOF

  EXPECTED_MARKER="$BATS_TEST_TMPDIR/marker.txt"
  cat > "$EXPECTED_MARKER" <<'EOF'
---
sdlc_version: 9.8.7
---
# sdlc

This file opts this project in to the `sdlc` plugin. The plugin's hooks act only in projects that have it.

Commit this file with the project, so CI and hooks see it too.
EOF
}

run_init() {
  run /bin/bash "$SCRIPT" "$PLUGIN" "$PROJ"
}

# Snapshot every file under the project with its checksum, to prove nothing changed.
snapshot() {
  (cd "$PROJ" && find . -type f -not -path './.git/*' | LC_ALL=C sort | while IFS= read -r f; do cksum "$f"; done)
}

@test "fresh project: rules, marker and section are created and reported" {
  run_init
  [ "$status" -eq 0 ]
  cmp "$PLUGIN/.specs/_rules/a.md" "$PROJ/.specs/_rules/a.md"
  cmp "$PLUGIN/.specs/_rules/b.md" "$PROJ/.specs/_rules/b.md"
  [ ! -e "$PROJ/.specs/_rules/sub" ]
  [ ! -e "$PROJ/.specs/_rules/.hidden" ]
  cmp "$EXPECTED_MARKER" "$PROJ/.claude/sdlc.md"
  cmp "$EXPECTED_SECTION" "$PROJ/.claude/CLAUDE.md"
  [ "$output" = "created .specs/_rules/a.md
created .specs/_rules/b.md
created .claude/sdlc.md
created .claude/CLAUDE.md" ]
}

@test "re-run: nothing changes and every path is reported skipped" {
  run_init
  [ "$status" -eq 0 ]
  before=$(snapshot)
  run_init
  [ "$status" -eq 0 ]
  [ "$(snapshot)" = "$before" ]
  [ "$output" = "skipped .specs/_rules/a.md (exists)
skipped .specs/_rules/b.md (exists)
skipped .claude/sdlc.md (exists)
skipped .claude/CLAUDE.md (has sdlc section)" ]
}

@test "existing rules and CLAUDE.md without the section: rules kept, marker created, section appended" {
  mkdir -p "$PROJ/.specs/_rules" "$PROJ/.claude"
  printf 'my own rule a\n' > "$PROJ/.specs/_rules/a.md"
  printf 'my own rule b\n' > "$PROJ/.specs/_rules/b.md"
  printf '# Mine\n\nSome text.\n' > "$PROJ/.claude/CLAUDE.md"
  run_init
  [ "$status" -eq 0 ]
  [ "$(cat "$PROJ/.specs/_rules/a.md")" = "my own rule a" ]
  [ "$(cat "$PROJ/.specs/_rules/b.md")" = "my own rule b" ]
  cmp "$EXPECTED_MARKER" "$PROJ/.claude/sdlc.md"
  { printf '# Mine\n\nSome text.\n\n'; cat "$EXPECTED_SECTION"; } > "$BATS_TEST_TMPDIR/want"
  cmp "$BATS_TEST_TMPDIR/want" "$PROJ/.claude/CLAUDE.md"
  [ "$output" = "skipped .specs/_rules/a.md (exists)
skipped .specs/_rules/b.md (exists)
created .claude/sdlc.md
updated .claude/CLAUDE.md (added sdlc section)" ]
}

@test "blank-line rule: a file with no final newline gets a newline, a blank line, then the section" {
  mkdir -p "$PROJ/.claude"
  printf '# Mine' > "$PROJ/.claude/CLAUDE.md"
  run_init
  [ "$status" -eq 0 ]
  { printf '# Mine\n\n'; cat "$EXPECTED_SECTION"; } > "$BATS_TEST_TMPDIR/want"
  cmp "$BATS_TEST_TMPDIR/want" "$PROJ/.claude/CLAUDE.md"
}

@test "blank-line rule: a file ending in a blank line keeps it and gets one more" {
  mkdir -p "$PROJ/.claude"
  printf '# Mine\n\n' > "$PROJ/.claude/CLAUDE.md"
  run_init
  [ "$status" -eq 0 ]
  { printf '# Mine\n\n\n'; cat "$EXPECTED_SECTION"; } > "$BATS_TEST_TMPDIR/want"
  cmp "$BATS_TEST_TMPDIR/want" "$PROJ/.claude/CLAUDE.md"
}

@test "blank-line rule: an empty file ends up holding only the section" {
  mkdir -p "$PROJ/.claude"
  : > "$PROJ/.claude/CLAUDE.md"
  run_init
  [ "$status" -eq 0 ]
  cmp "$EXPECTED_SECTION" "$PROJ/.claude/CLAUDE.md"
  [[ "$output" == *"updated .claude/CLAUDE.md (added sdlc section)"* ]]
}

@test "a CLAUDE.md that already has the begin line is unchanged" {
  mkdir -p "$PROJ/.claude"
  printf '# Mine\n<!-- sdlc:begin -->\nold text\n<!-- sdlc:end -->\n' > "$PROJ/.claude/CLAUDE.md"
  cp "$PROJ/.claude/CLAUDE.md" "$BATS_TEST_TMPDIR/want"
  run_init
  [ "$status" -eq 0 ]
  cmp "$BATS_TEST_TMPDIR/want" "$PROJ/.claude/CLAUDE.md"
  [[ "$output" == *"skipped .claude/CLAUDE.md (has sdlc section)"* ]]
}

@test "a root CLAUDE.md is never changed" {
  printf '# Root\n' > "$PROJ/CLAUDE.md"
  run_init
  [ "$status" -eq 0 ]
  [ "$(cat "$PROJ/CLAUDE.md")" = "# Root" ]
  cmp "$EXPECTED_SECTION" "$PROJ/.claude/CLAUDE.md"
}

@test "a project path with a space works" {
  PROJ="$BATS_TEST_TMPDIR/my project"
  mkdir -p "$PROJ"
  run_init
  [ "$status" -eq 0 ]
  cmp "$PLUGIN/.specs/_rules/a.md" "$PROJ/.specs/_rules/a.md"
  cmp "$EXPECTED_MARKER" "$PROJ/.claude/sdlc.md"
  cmp "$EXPECTED_SECTION" "$PROJ/.claude/CLAUDE.md"
}

@test "a project in a git repository: nothing is committed" {
  git -C "$PROJ" init -q
  printf 'x\n' > "$PROJ/x.txt"
  git -C "$PROJ" add x.txt
  git -C "$PROJ" -c user.name=t -c user.email=t@example.com commit -q -m init
  head_before=$(git -C "$PROJ" rev-parse HEAD)
  run_init
  [ "$status" -eq 0 ]
  [ "$(git -C "$PROJ" rev-parse HEAD)" = "$head_before" ]
  [ "$(git -C "$PROJ" rev-list --count HEAD)" -eq 1 ]
  [ -z "$(git -C "$PROJ" diff --cached --name-only)" ]
}

@test "check fails: jq is not on PATH" {
  before=$(snapshot)
  PATH="$BATS_TEST_TMPDIR/empty-bin" run /bin/bash "$SCRIPT" "$PLUGIN" "$PROJ"
  [ "$status" -ne 0 ]
  [[ "$output" == *"jq is not on PATH"* ]]
  [ "$(snapshot)" = "$before" ]
}

@test "check fails: the project directory does not exist" {
  run /bin/bash "$SCRIPT" "$PLUGIN" "$BATS_TEST_TMPDIR/missing"
  [ "$status" -ne 0 ]
  [[ "$output" == *"project directory does not exist"* ]]
  [ ! -e "$BATS_TEST_TMPDIR/missing" ]
}

@test "check fails: the plugin root has no rule files" {
  rm -f "$PLUGIN/.specs/_rules/a.md" "$PLUGIN/.specs/_rules/b.md"
  before=$(snapshot)
  run_init
  [ "$status" -ne 0 ]
  [[ "$output" == *"no rule files"* ]]
  [ "$(snapshot)" = "$before" ]
  [ ! -e "$PROJ/.specs" ]
  [ ! -e "$PROJ/.claude" ]
}

@test "check fails: plugin.json has no version" {
  printf '{"name":"sdlc"}\n' > "$PLUGIN/.claude-plugin/plugin.json"
  run_init
  [ "$status" -ne 0 ]
  [[ "$output" == *"cannot read version"* ]]
  [ ! -e "$PROJ/.specs" ]
  [ ! -e "$PROJ/.claude" ]
}

@test "a write that fails after the checks reports what was created, then the error" {
  printf 'not a directory\n' > "$PROJ/.claude"
  run_init
  [ "$status" -ne 0 ]
  [ "${lines[0]}" = "created .specs/_rules/a.md" ]
  [ "${lines[1]}" = "created .specs/_rules/b.md" ]
  [[ "$output" == *"error: cannot write .claude/sdlc.md"* ]]
  [ "$(cat "$PROJ/.claude")" = "not a directory" ]
}
