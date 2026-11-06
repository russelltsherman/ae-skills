#!/usr/bin/env bats
# Tests for scripts/lint-specs.sh (spec: .specs/check-target/20261105-1022-create/spec.md).
# Each fixture in tests/fixtures/<case>/ is a .specs/ tree: the clean change
# directory with one fault. The lint always runs with /bin/bash, which is
# Bash 3.2 on macOS (R18).

LINT="$BATS_TEST_DIRNAME/../scripts/lint-specs.sh"
FIX="$BATS_TEST_DIRNAME/fixtures"
CHANGE=demo-feature/20240229-2359-create

lint() { run /bin/bash "$LINT" "$@"; }

# Lint fixture $1 and expect exit 1 with every other argument in the output.
fails_with() {
  local case=$1 want
  shift
  lint "$FIX/$case"
  echo "$output"
  [ "$status" -eq 1 ]
  for want in "$@"; do
    [[ "$output" == *"$want"* ]] || { echo "missing: $want"; return 1; }
  done
}

passes() {
  lint "$FIX/$1"
  echo "$output"
  [ "$status" -eq 0 ]
  [ -z "$output" ]
}

# R7: interface and exit codes

@test "R7: the clean fixture passes with exit 0 and no output" {
  passes clean
}

@test "R7: a missing <specs-dir> exits 2" {
  lint "$FIX/no-such-dir"
  [ "$status" -eq 2 ]
}

@test "R7: an unknown option exits 2" {
  lint --verbose
  [ "$status" -eq 2 ]
}

@test "R7: more than one argument exits 2" {
  lint "$FIX/clean" "$FIX/clean"
  [ "$status" -eq 2 ]
}

@test "R7: problems print as <path>:<line>: <message> and exit 1" {
  fails_with fm-unknown-key "$FIX/fm-unknown-key/$CHANGE/intent.md:8: unknown key: status"
}

@test "R7: a problem with no single line prints as <path>: <message>" {
  fails_with fm-missing-key "$FIX/fm-missing-key/$CHANGE/intent.md: missing required key: risk"
}

@test "R7: defaults to .specs in the current directory" {
  mkdir -p "$BATS_TEST_TMPDIR/w"
  cp -R "$FIX/fm-unknown-key" "$BATS_TEST_TMPDIR/w/.specs"
  cd "$BATS_TEST_TMPDIR/w"
  lint
  [ "$status" -eq 1 ]
  [[ "$output" == ".specs/$CHANGE/intent.md:8: unknown key: status" ]]
}

@test "R15: --rules prints only key and section lines" {
  lint --rules
  [ "$status" -eq 0 ]
  [[ "$output" == *"intent|key|origin|required|person ticket incident scan band"* ]]
  [[ "$output" == *"plan|section|4|Proof"* ]]
  ! echo "$output" | grep -q '|title|'
  ! echo "$output" | grep -q '|ids|'
}

# R8: change-directory names

@test "R8: a feature that is not a slug" {
  fails_with bad-feature-slug "feature name Bad_Feature is not a slug"
}

@test "R8: a change name without the <YYYYMMDD-HHMM>-<slug> shape, whose documents are still linted" {
  fails_with bad-change-name "change name create-20240101 is not <YYYYMMDD-HHMM>-<slug>" \
    "create-20240101/intent.md:8: unknown key: status"
}

@test "R8: an empty change slug" {
  fails_with empty-change-slug "change slug is empty in 20240101-1200-"
}

@test "R8: a change slug with characters outside a-z, 0-9 and -" {
  fails_with bad-change-slug "change slug Create_It is not a slug"
}

@test "R8: month 13" {
  fails_with bad-month "timestamp 20241301-1200 is not a real date and time"
}

@test "R8: April 31" {
  fails_with bad-day "timestamp 20240431-1200 is not a real date and time"
}

@test "R8: February 29 outside a leap year" {
  fails_with not-leap-year "timestamp 20230229-1200 is not a real date and time"
}

@test "R8: February 29 in a century year that is not a leap year" {
  fails_with century-not-leap "timestamp 21000229-1200 is not a real date and time"
}

@test "R8: February 29 in a leap year passes (the clean fixture)" {
  [ -d "$FIX/clean/demo-feature/20240229-2359-create" ]
  passes clean
}

@test "R8: hour 24" {
  fails_with bad-hour "timestamp 20240101-2400 is not a real date and time"
}

@test "R8: minute 60" {
  fails_with bad-minute "timestamp 20240101-1260 is not a real date and time"
}

@test "R8: features starting with _ are skipped" {
  passes underscore-skipped
}

# R9: front matter

@test "R9: front matter that does not open on line 1" {
  fails_with fm-no-open "intent.md:1: front matter must open with --- on line 1"
}

@test "R9: a front matter line that is not flat" {
  fails_with fm-not-flat "intent.md:3: front matter line is not a flat key: value line"
}

@test "R9: a key with no space after the colon" {
  fails_with fm-no-space "intent.md:6: front matter line is not a flat key: value line"
}

@test "R9: front matter that is never closed" {
  fails_with fm-not-closed "intent.md: front matter is not closed with ---"
}

@test "R9: a missing required key" {
  fails_with fm-missing-key "intent.md: missing required key: risk"
}

@test "R9: a missing required key in a spec" {
  fails_with fm-spec-missing-skills "spec.md: missing required key: skills"
}

@test "R9: an unknown key" {
  fails_with fm-unknown-key "intent.md:8: unknown key: status"
}

@test "R9: an unknown key in a plan" {
  fails_with fm-plan-unknown-key "plan.md:4: unknown key: skills"
}

@test "R9: a duplicate key" {
  fails_with fm-duplicate-key "intent.md:3: duplicate key: agent"
}

@test "R9: an empty value" {
  fails_with fm-empty-value "intent.md:3: empty value for key: operator"
}

@test "R9: a value outside the allowed set" {
  fails_with fm-bad-value "intent.md:6: value high for key risk is not one of: routine elevated"
}

@test "R9: links missing when origin is ticket" {
  fails_with fm-links-ticket "intent.md: missing key: links (required when origin is ticket)"
}

@test "R9: links given when origin is ticket passes" {
  passes fm-links-given
}

# R10: title and sections

@test "R10: a missing title line" {
  fails_with title-missing "intent.md:9: first line after the front matter must be # Intent: <title>"
}

@test "R10: the wrong title prefix" {
  fails_with title-wrong-prefix "intent.md:9: first line after the front matter must be # Intent: <title>"
}

@test "R10: an empty title" {
  fails_with title-empty "intent.md:9: first line after the front matter must be # Intent: <title>"
}

@test "R10: a missing section" {
  fails_with section-missing "intent.md: missing section ## Affected users and systems"
}

@test "R10: a misspelled section" {
  fails_with section-misspelled "intent.md:14: unexpected section ## Proposed Outcome (not in the template)" \
    "intent.md: missing section ## Proposed outcome"
}

@test "R10: a misordered section" {
  fails_with section-misordered "intent.md:14: section ## Problem is out of order"
}

@test "R10: an extra section" {
  fails_with section-extra "intent.md:27: unexpected section ## Notes (not in the template)"
}

@test "R10: a repeated section" {
  fails_with section-duplicate "plan.md:19: section ## Risks appears more than once"
}

@test "R10: a heading inside a fenced block does not count" {
  passes fenced-heading
}

@test "R10: a heading quoted in backticks inside a sentence does not count" {
  passes quoted-heading
}

# R11: ID bullets

@test "R11: a bullet with the wrong ID letter" {
  fails_with id-wrong-letter "intent.md:21: bullet in ## Constraints must read - C<n>. <text>"
}

@test "R11: a bullet with no . after the ID" {
  fails_with id-missing-dot "intent.md:21: bullet in ## Constraints must read - C<n>. <text>"
}

@test "R11: an ID with a leading zero" {
  fails_with id-leading-zero "intent.md:21: bullet in ## Constraints must read - C<n>. <text>"
}

@test "R11: a bad requirement bullet in a spec" {
  fails_with id-spec-requirement "spec.md:11: bullet in ## Requirements must read - R<n>. <text>"
}

@test "R11: a bad concern bullet in a spec" {
  fails_with id-spec-concern "spec.md:29: bullet in ## Areas of concern must read - K<n>. <text>"
}

@test "R11: a duplicate ID" {
  fails_with id-duplicate "intent.md:23: duplicate ID C1 in ## Constraints"
}

@test "R11: a withdrawn constraint not in the Withdrawn: <reason>. Was: <text>. form" {
  fails_with id-withdrawn-form "intent.md:22: withdrawn C2 must read Withdrawn: <reason>. Was: <original text>."
}

@test "R11: a withdrawn requirement not in the Withdrawn: <reason>. Was: <text>. form" {
  fails_with id-r-withdrawn-form "spec.md:10: withdrawn R2 must read Withdrawn: <reason>. Was: <original text>."
}

@test "R11: a section whose only content is None. passes (the clean fixture)" {
  grep -q '^None\.$' "$FIX/clean/$CHANGE/intent.md"
  passes clean
}

# R12: titles

@test "R12: spec and plan titles that differ from the intent's" {
  fails_with title-mismatch "spec.md:6: title Other change does not match the intent title Demo change" \
    "plan.md:5: title Demo Change does not match the intent title Demo change"
}

# R13: constraint table and open questions

@test "R13: an intent C ID missing from the constraint table, withdrawn ones included" {
  fails_with c-missing "spec.md: C2 from intent.md is missing from ## How each constraint is met"
}

@test "R13: a C ID repeated in the constraint table" {
  fails_with c-repeated "spec.md:24: C1 appears more than once in ## How each constraint is met"
}

@test "R13: a C ID in the constraint table that the intent lacks" {
  fails_with c-unknown "spec.md:24: C9 in ## How each constraint is met is not in intent.md"
}

@test "R13: an intent Q ID missing from the spec" {
  fails_with q-missing "spec.md: Q1 from intent.md is missing from ## Open questions from the intent"
}

@test "R13: a Q ID repeated in the spec" {
  fails_with q-repeated "spec.md:27: Q1 appears more than once in ## Open questions from the intent"
}

@test "R13: a Q ID in the spec that the intent lacks" {
  fails_with q-unknown "spec.md:27: Q2 in ## Open questions from the intent is not in intent.md"
}

@test "R13: a change directory with only an intent passes" {
  passes intent-only
}

# R14: requirement IDs in the plan

@test "R14: an R ID missing from Order of work" {
  fails_with r-missing-order "plan.md: R3 from spec.md is not cited in ## Order of work"
}

@test "R14: an R ID missing from Proof" {
  fails_with r-missing-proof "plan.md: R1 from spec.md is not cited in ## Proof"
}

@test "R14: a withdrawn R ID need not be cited (the clean fixture)" {
  grep -q '^- R2\. Withdrawn:' "$FIX/clean/$CHANGE/spec.md"
  ! grep -q 'R2' "$FIX/clean/$CHANGE/plan.md"
  passes clean
}

@test "R14: a range counts only for its two endpoints" {
  fails_with r-range "plan.md: R3 from spec.md is not cited in ## Order of work"
  ! echo "$output" | grep -q 'R1 from\|R4 from'
}

@test "R14: IDs count only as whole words" {
  fails_with r-whole-word "plan.md: R1 from spec.md is not cited in ## Order of work"
  ! echo "$output" | grep -q 'R3 from'
}
