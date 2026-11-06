#!/usr/bin/env bats
# Drift test: the rules hard-coded in scripts/lint-specs.sh match the Key and
# Section tables in the templates (spec: .specs/check-target/20261105-1022-create/spec.md R15).
# RULES_DIR overrides where the templates are read from.

LINT="$BATS_TEST_DIRNAME/../scripts/lint-specs.sh"

# Build key and section rule lines from one template's tables, skipping
# fenced examples. $1 = doc name, $2 = template path.
template_rules() {
  awk -v doc="$1" '
    function trim(s) { sub(/^[ \t]+/, "", s); sub(/[ \t]+$/, "", s); return s }
    function unquote(s) { s = trim(s); gsub(/`/, "", s); return s }
    /^```/ { fence = !fence; next }
    fence { next }
    /^\| *Key *\| *Required *\| *Values *\|/ { mode = "key"; next }
    /^\| *Section *\| *Contents *\|/ { mode = "section"; n = 0; next }
    !/^\|/ { mode = ""; next }
    mode != "" && /^\|[-: |]+$/ { next }
    mode == "key" {
      split($0, c, "|")
      key = unquote(c[2])
      r = trim(c[3])
      if (r == "yes") r = "required"
      else if (r ~ /^if `[^`]+` is `[^`]+`$/) { r = unquote(r); sub(/^if /, "if ", r); sub(/ is /, "=", r) }
      v = trim(c[4])
      if (v == "") vals = "<empty>"
      else if (v ~ /^`[^`]+`((, | or )`[^`]+`)*$/) {
        vals = v; gsub(/, | or /, " ", vals); gsub(/`/, "", vals)
      } else vals = ""
      print doc "|key|" key "|" r "|" vals
    }
    mode == "section" {
      split($0, c, "|")
      h = unquote(c[2]); sub(/^## /, "", h)
      print doc "|section|" ++n "|" h
    }
  ' "$2"
}

@test "rules in lint-specs.sh match the template tables" {
  dir=${RULES_DIR:-$BATS_TEST_DIRNAME/../.specs/_rules}
  expected=$(for d in intent spec plan; do template_rules "$d" "$dir/${d}_template.md"; done | LC_ALL=C sort)
  actual=$(/bin/bash "$LINT" --rules)
  run diff <(printf '%s\n' "$expected") <(printf '%s\n' "$actual")
  echo "$output"
  [ "$status" -eq 0 ]
}

@test "each template has a key table and a section table" {
  dir=${RULES_DIR:-$BATS_TEST_DIRNAME/../.specs/_rules}
  for d in intent spec plan; do
    out=$(template_rules "$d" "$dir/${d}_template.md")
    echo "$out" | grep -q "^$d|key|"
    echo "$out" | grep -q "^$d|section|"
  done
}
