#!/usr/bin/env bash
# The steps of `make check`: verify the plugin harness without model calls.
# Every step runs even after one fails; the run ends with one summary line
# and exits 1 when any step failed.
# Spec: .specs/check-target/20261105-1022-create/spec.md
#
# Bash 3.2 features only, plus the POSIX features of the utilities it calls
# that BSD and GNU share (spec R18).

cd "$(dirname "$0")/.." || exit 2

missing=' '
failed=''

# need <tool>...: fail, without running anything, when a tool is missing (R6).
need() {
  local t ok=0
  for t in "$@"; do
    case $missing in
      *" $t "*)
        echo "not run: missing tool: $t"
        ok=1
        ;;
    esac
  done
  return $ok
}

# R2
step_tools() {
  local t ok=0
  for t in git jq shellcheck bats claude; do
    if ! command -v "$t" >/dev/null 2>&1; then
      echo "missing tool: $t"
      missing="$missing$t "
      ok=1
    fi
  done
  return $ok
}

# R3
step_validate_strict() {
  need claude || return 1
  claude plugin validate --strict .
}

# R4
step_validate_directory() {
  need claude || return 1
  claude plugin validate --profile directory .
}

# R5: files git does not ignore that end in .sh or start with an sh or bash
# shebang. Paths that are not regular files are skipped.
step_shellcheck() {
  need git shellcheck || return 1
  local f first files=()
  while IFS= read -r -d '' f; do
    [ -f "$f" ] || continue
    case $f in
      *.sh)
        files+=("$f")
        continue
        ;;
    esac
    first=''
    IFS= read -r first <"$f"
    if printf '%s\n' "$first" | grep -Eq '^#!.*[/ ](ba)?sh([[:space:]]|$)'; then
      files+=("$f")
    fi
  done < <(git ls-files -z --cached --others --exclude-standard)
  if [ ${#files[@]} -eq 0 ]; then
    echo "no shell scripts"
    return 0
  fi
  shellcheck "${files[@]}"
}

# R7 to R14
step_lint() {
  bash scripts/lint-specs.sh .specs
}

# R17
step_tests() {
  need bats || return 1
  bats tests/
}

run() {
  echo "== $1"
  if ! "$2"; then
    failed="$failed $1"
  fi
}

run tools step_tools
run validate-strict step_validate_strict
run validate-directory step_validate_directory
run shellcheck step_shellcheck
run lint step_lint
run tests step_tests

if [ -n "$failed" ]; then
  echo "check: failed:$failed"
  exit 1
fi
echo "check: all passed"
