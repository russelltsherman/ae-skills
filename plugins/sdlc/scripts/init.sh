#!/usr/bin/env bash
# Set up a project for the sdlc plugin.
#
#   init.sh <plugin-root> <project-dir>
#
# Copies the planning rules from <plugin-root>/.specs/_rules/, writes the
# .claude/sdlc.md opt-in marker and adds the sdlc section to .claude/CLAUDE.md.
# It creates only what is missing, never overwrites, and never runs git.
# Spec: .specs/init-skill/20261106-0658-create/spec.md
#
# Bash 3.2 only (no associative arrays, mapfile or case-changing expansions),
# and only bash, cp, mkdir, grep, tail and jq (spec R14).
set -u

if [ $# -ne 2 ]; then
  printf 'usage: init.sh <plugin-root> <project-dir>\n' >&2
  exit 2
fi
plugin_root=$1
project=$2

report=()

# Print what was done so far, then the error, and stop (R9).
abort() {
  if [ ${#report[@]} -gt 0 ]; then
    printf '%s\n' "${report[@]}"
  fi
  printf 'error: %s\n' "$1" >&2
  exit 1
}

# --- 1. Check the inputs before writing anything (R9) ---

command -v jq >/dev/null 2>&1 || abort "jq is not on PATH"

[ -d "$project" ] || abort "project directory does not exist: $project"

rules_src=$plugin_root/.specs/_rules
rule_files=()
if [ -d "$rules_src" ]; then
  for f in "$rules_src"/*; do
    if [ -f "$f" ]; then
      rule_files+=("$f")
    fi
  done
fi
[ ${#rule_files[@]} -gt 0 ] || abort "no rule files in $rules_src"

manifest=$plugin_root/.claude-plugin/plugin.json
version=$(jq -r '.version // empty' "$manifest" 2>/dev/null)
[ -n "$version" ] || abort "cannot read version from $manifest"

# --- Texts (R4, R6) ---

marker_text() {
  printf '%s\n' \
    '---' \
    "sdlc_version: $version" \
    '---' \
    '# sdlc' \
    '' \
    "This file opts this project in to the \`sdlc\` plugin. The plugin's hooks act only in projects that have it." \
    '' \
    'Commit this file with the project, so CI and hooks see it too.'
}

section_text() {
  printf '%s\n' \
    '<!-- sdlc:begin -->' \
    '## sdlc' \
    '' \
    "This project uses the \`sdlc\` plugin. Its planning documents live in \`.specs/\`; read the rules in \`.specs/_rules/\` before creating, finding or editing anything there." \
    '<!-- sdlc:end -->'
}

# --- 2. Rules (R3) ---

mkdir -p "$project/.specs/_rules" 2>/dev/null || abort "cannot create .specs/_rules"
for src in "${rule_files[@]}"; do
  rel=.specs/_rules/${src##*/}
  if [ -e "$project/$rel" ] || [ -L "$project/$rel" ]; then
    report+=("skipped $rel (exists)")
  else
    cp "$src" "$project/$rel" 2>/dev/null || abort "cannot write $rel"
    report+=("created $rel")
  fi
done

# --- 3. Marker (R4) ---

rel=.claude/sdlc.md
if [ -e "$project/$rel" ] || [ -L "$project/$rel" ]; then
  report+=("skipped $rel (exists)")
else
  { mkdir -p "$project/.claude" && marker_text > "$project/$rel"; } 2>/dev/null \
    || abort "cannot write $rel"
  report+=("created $rel")
fi

# --- 4. Section (R5, R6, R7) ---

rel=.claude/CLAUDE.md
file=$project/$rel
if [ ! -e "$file" ]; then
  section_text > "$file" 2>/dev/null || abort "cannot write $rel"
  report+=("created $rel")
elif grep -qxF '<!-- sdlc:begin -->' "$file"; then
  report+=("skipped $rel (has sdlc section)")
else
  # Decide what goes before the section, before the file is opened for append.
  # An empty file gets the section alone; otherwise end the last line if it
  # is not ended, then add one blank line.
  newlines=0
  if [ -s "$file" ]; then
    newlines=1
    if [ -n "$(tail -c 1 "$file")" ]; then
      newlines=2
    fi
  fi
  {
    if [ "$newlines" -ge 2 ]; then printf '\n'; fi
    if [ "$newlines" -ge 1 ]; then printf '\n'; fi
    section_text
  } >> "$file" 2>/dev/null || abort "cannot write $rel"
  report+=("updated $rel (added sdlc section)")
fi

# --- 5. Report (R8) ---

printf '%s\n' "${report[@]}"
exit 0
