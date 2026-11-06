#!/usr/bin/env bash
# Lint the planning documents in a .specs/ tree against the rules in
# .specs/_rules/: change-directory names, front matter, title, sections,
# ID bullets, and the IDs each document must carry from the one before it.
#
#   lint-specs.sh [<specs-dir>]   lint <specs-dir>, default .specs
#   lint-specs.sh --rules         print the rules the template tables hold
#
# Prints one problem per line, as <path>:<line>: <message> or <path>: <message>.
# Exits 0 with no problems, 1 with problems, 2 on a usage error or a missing
# <specs-dir>.
# Spec: .specs/check-target/20261105-1022-create/spec.md
#
# Bash 3.2 features only, plus the POSIX features of awk, sed, grep, find,
# sort, cut and tr that BSD and GNU share (spec R18).

export LC_ALL=C

# Every rule the lint checks, one per line (spec R15):
#   <doc>|key|<key>|<required>|<allowed values, space-separated, or empty>
#   <doc>|section|<n>|<heading>
#   <doc>|title|<prefix>
#   <doc>|ids|<section>|<ID letter>
# --rules prints the key and section lines, which tests/rules.bats compares
# with the tables in .specs/_rules/*_template.md. Title and ids lines are
# covered by the fixtures in tests/lint.bats instead.
RULES='intent|key|agent|required|
intent|key|operator|required|
intent|key|origin|required|person ticket incident scan band
intent|key|type|required|feature fix chore
intent|key|risk|required|routine elevated
intent|key|spec|required|required skipped
intent|key|links|if origin=ticket|
intent|section|1|Problem
intent|section|2|Proposed outcome
intent|section|3|Affected users and systems
intent|section|4|Constraints
intent|section|5|Open questions
intent|section|6|Action already taken
intent|title|Intent
intent|ids|Constraints|C
intent|ids|Open questions|Q
spec|key|agent|required|
spec|key|operator|required|
spec|key|skills|required|
spec|section|1|Requirements
spec|section|2|Design
spec|section|3|Out of scope / Deferred
spec|section|4|How each constraint is met
spec|section|5|Open questions from the intent
spec|section|6|Areas of concern
spec|title|Spec
spec|ids|Requirements|R
spec|ids|Areas of concern|K
plan|key|agent|required|
plan|key|operator|required|
plan|section|1|Files that change
plan|section|2|Order of work
plan|section|3|Risks
plan|section|4|Proof
plan|title|Plan'

# One pass over one document (spec R9, R10, R11). Prints problems as
# P|<problem line> and records for the cross-document checks as D|<record>:
#   title|<line>|<title>         the title after the prefix
#   id|<letter>|<id>|<withdrawn 0/1>|<line>   an ID bullet
#   tc|<C id>|<line>             a row of the spec's constraint table
#   tq|<Q id>|<line>             a Q bullet in the spec's open questions
#   ow|<R id> and pf|<R id>      a whole-word R ID in the plan's
#                                Order of work or Proof
# shellcheck disable=SC2016 # an awk program, not shell: nothing should expand
DOC_AWK='
function trim(s) { sub(/^[ \t]+/, "", s); sub(/[ \t]+$/, "", s); return s }
function problem(line, msg) {
  if (line != "") print "P|" FILENAME ":" line ": " msg
  else print "P|" FILENAME ": " msg
}
function rec(s) { print "D|" s }
function in_set(v, set,    a, n, i) {
  n = split(set, a, " ")
  for (i = 1; i <= n; i++) if (a[i] == v) return 1
  return 0
}
function check_required(    i, k, r, cv) {
  for (i = 1; i <= nkeys; i++) {
    k = keyname[i]; r = req[k]
    if (k in seen) continue
    if (r == "required") problem("", "missing required key: " k)
    else if (r ~ /^if /) {
      split(substr(r, 4), cv, "=")
      if (val[cv[1]] == cv[2]) problem("", "missing key: " k " (required when " cv[1] " is " cv[2] ")")
    }
  }
}
BEGIN {
  n = split(ENVIRON["LINT_RULES"], rl, "\n")
  for (i = 1; i <= n; i++) {
    split(rl[i], f, "|")
    if (f[1] != doc) continue
    if (f[2] == "key") { nkeys++; keyname[nkeys] = f[3]; req[f[3]] = f[4]; vals[f[3]] = f[5]; known[f[3]] = 1 }
    else if (f[2] == "section") { nsec++; secname[f[3] + 0] = f[4]; secidx[f[4]] = f[3] + 0 }
    else if (f[2] == "title") prefix = f[3]
    else if (f[2] == "ids") idletter[f[3]] = f[4]
  }
  fm = 0          # 0 before, 1 inside, 2 after the front matter
  want_title = 0; fence = 0; cur = ""; nh = 0; maxidx = 0
}
{ sub(/\r$/, "") }
NR == 1 {
  if ($0 == "---") { fm = 1; next }
  problem(1, "front matter must open with --- on line 1")
  fm = 2; want_title = 1
}
fm == 1 {
  if ($0 == "---") { fm = 2; want_title = 1; check_required(); next }
  if ($0 !~ /^[A-Za-z_][A-Za-z0-9_-]*:/) { problem(NR, "front matter line is not a flat key: value line"); next }
  k = $0; sub(/:.*/, "", k)
  v = $0; sub(/^[^:]*:/, "", v)
  if (v != "" && v !~ /^ /) { problem(NR, "front matter line is not a flat key: value line"); next }
  v = trim(v)
  if (k in seen) { problem(NR, "duplicate key: " k); next }
  seen[k] = 1; val[k] = v
  if (!(k in known)) { problem(NR, "unknown key: " k); next }
  if (v == "") { problem(NR, "empty value for key: " k); next }
  if (vals[k] != "" && !in_set(v, vals[k])) problem(NR, "value " v " for key " k " is not one of: " vals[k])
  next
}
want_title {
  want_title = 0
  t = "# " prefix ": "
  if (index($0, t) == 1 && trim(substr($0, length(t) + 1)) != "") {
    rec("title|" NR "|" trim(substr($0, length(t) + 1)))
    next
  }
  problem(NR, "first line after the front matter must be # " prefix ": <title>")
}
/^[ ]*(```|~~~)/ { fence = !fence; next }
fence { next }
/^## / {
  h = trim(substr($0, 4))
  nh++; hname[nh] = h; hline[nh] = NR; cur = h
  next
}
(cur in idletter) && /^- / {
  L = idletter[cur]
  if ($0 !~ ("^- " L "[1-9][0-9]*\\. [^ ]")) {
    problem(NR, "bullet in ## " cur " must read - " L "<n>. <text>")
    next
  }
  id = substr($0, 3); sub(/\..*/, "", id)
  text = trim(substr($0, length(id) + 5))
  if ((cur, id) in idseen) problem(NR, "duplicate ID " id " in ## " cur)
  idseen[cur, id] = 1
  wd = 0
  if ((L == "C" || L == "R") && text ~ /^Withdrawn/) {
    wd = 1
    if (text !~ /^Withdrawn: .+\. Was: .+\.$/) problem(NR, "withdrawn " id " must read Withdrawn: <reason>. Was: <original text>.")
  }
  rec("id|" L "|" id "|" wd "|" NR)
  next
}
doc == "spec" && cur == "How each constraint is met" && /^\|/ {
  split($0, cell, "|"); c = trim(cell[2])
  if (c ~ /^C[0-9]+$/) rec("tc|" c "|" NR)
  next
}
doc == "spec" && cur == "Open questions from the intent" && /^- Q[0-9]+\./ {
  q = substr($0, 3); sub(/\..*/, "", q)
  rec("tq|" q "|" NR)
  next
}
doc == "plan" && (cur == "Order of work" || cur == "Proof") {
  tag = (cur == "Proof") ? "pf" : "ow"
  line = $0; off = 0
  while (match(substr(line, off + 1), /R[0-9]+/)) {
    st = off + RSTART; en = st + RLENGTH - 1
    b = (st > 1) ? substr(line, st - 1, 1) : ""
    a = substr(line, en + 1, 1)
    if (b !~ /[A-Za-z0-9_]/ && a !~ /[A-Za-z0-9_]/) rec(tag "|" substr(line, st, RLENGTH))
    off = en
  }
}
END {
  if (NR == 0) { problem("", "file is empty"); exit }
  if (fm == 1) { problem("", "front matter is not closed with ---"); exit }
  if (want_title) problem("", "missing title line # " prefix ": <title>")
  for (i = 1; i <= nh; i++) {
    h = hname[i]
    if (!(h in secidx)) { problem(hline[i], "unexpected section ## " h " (not in the template)"); continue }
    if (h in hseen) { problem(hline[i], "section ## " h " appears more than once"); continue }
    hseen[h] = 1
    if (secidx[h] < maxidx) problem(hline[i], "section ## " h " is out of order")
    else maxidx = secidx[h]
  }
  for (i = 1; i <= nsec; i++) if (!(secname[i] in hseen)) problem("", "missing section ## " secname[i])
}
'

usage() {
  printf 'usage: lint-specs.sh [<specs-dir>] | --rules\n' >&2
  exit 2
}

# Records of one kind from a document's records: lines starting <kind>|.
records() { printf '%s\n' "$1" | grep "^$2|"; }

# IDs of one letter from a document's id records, in order, once each.
# $3 = 1 leaves out withdrawn IDs.
ids() {
  records "$1" id | awk -F'|' -v l="$2" -v live="${3:-0}" \
    '$2 == l && !(live && $4 == 1) && !seen[$3]++ { print $3 }'
}

# Feature names are slugs of a-z, 0-9 and - (spec R8).
check_feature_name() {
  case $2 in
    '' | *[!a-z0-9-]*) echo "$1: feature name $2 is not a slug of a-z, 0-9 and -" ;;
  esac
}

# YYYYMMDD-HHMM is a real date and time (spec R8).
valid_timestamp() {
  local y=$((10#${1:0:4})) mo=$((10#${1:4:2})) d=$((10#${1:6:2}))
  local h=$((10#${1:9:2})) mi=$((10#${1:11:2})) max
  case $mo in
    1 | 3 | 5 | 7 | 8 | 10 | 12) max=31 ;;
    4 | 6 | 9 | 11) max=30 ;;
    2)
      if [ $((y % 4)) -eq 0 ] && { [ $((y % 100)) -ne 0 ] || [ $((y % 400)) -eq 0 ]; }; then
        max=29
      else
        max=28
      fi
      ;;
    *) return 1 ;;
  esac
  [ "$d" -ge 1 ] && [ "$d" -le "$max" ] && [ "$h" -le 23 ] && [ "$mi" -le 59 ]
}

# Change names are <YYYYMMDD-HHMM>-<slug> (spec R8).
check_change_name() {
  local re='^([0-9]{8}-[0-9]{4})-(.*)$' ts slug
  if ! [[ $2 =~ $re ]]; then
    echo "$1: change name $2 is not <YYYYMMDD-HHMM>-<slug>"
    return
  fi
  ts=${BASH_REMATCH[1]}
  slug=${BASH_REMATCH[2]}
  case $slug in
    '') echo "$1: change slug is empty in $2" ;;
    *[!a-z0-9-]*) echo "$1: change slug $slug is not a slug of a-z, 0-9 and -" ;;
  esac
  valid_timestamp "$ts" || echo "$1: timestamp $ts is not a real date and time"
}

# The spec's and plan's titles equal the intent's (spec R12).
check_title() {
  local t ln title
  t=$(records "$1" title | sed -n 1p)
  [ -n "$t" ] || return 0
  ln=${t#title|}
  ln=${ln%%|*}
  title=${t#title|*|}
  [ "$title" = "$3" ] || echo "$2:$ln: title $title does not match the intent title $3"
}

# Every ID in $1 (the intent's) appears exactly once among the $3 records of
# the spec ($2), and no ID there is unknown (spec R13).
check_once() {
  local want=$1 recs=$2 kind=$3 path=$4 section=$5 id n ln
  for id in $want; do
    n=$(records "$recs" "$kind" | grep -c "^$kind|$id|")
    if [ "$n" -eq 0 ]; then
      echo "$path: $id from intent.md is missing from ## $section"
    elif [ "$n" -gt 1 ]; then
      ln=$(records "$recs" "$kind" | grep "^$kind|$id|" | sed -n 2p | cut -d'|' -f3)
      echo "$path:$ln: $id appears more than once in ## $section"
    fi
  done
  records "$recs" "$kind" | while IFS='|' read -r _ id ln; do
    case " $want " in
      *" $id "*) ;;
      *) echo "$path:$ln: $id in ## $section is not in intent.md" ;;
    esac
  done
}

# Lint the documents in one change directory, then compare them.
lint_change() {
  local dir=$1 d out recs ri='' rs='' rp='' ti r
  for d in intent spec plan; do
    [ -f "$dir/$d.md" ] || continue
    out=$(LINT_RULES="$RULES" awk -v doc="$d" "$DOC_AWK" "$dir/$d.md")
    printf '%s\n' "$out" | sed -n 's/^P|//p'
    recs=$(printf '%s\n' "$out" | sed -n 's/^D|//p')
    case $d in
      intent) ri=$recs ;;
      spec) rs=$recs ;;
      plan) rp=$recs ;;
    esac
  done

  if [ -f "$dir/intent.md" ]; then
    ti=$(records "$ri" title | sed -n 1p)
    if [ -n "$ti" ]; then
      ti=${ti#title|*|}
      [ -f "$dir/spec.md" ] && check_title "$rs" "$dir/spec.md" "$ti"
      [ -f "$dir/plan.md" ] && check_title "$rp" "$dir/plan.md" "$ti"
    fi
    if [ -f "$dir/spec.md" ]; then
      check_once "$(ids "$ri" C | tr '\n' ' ')" "$rs" tc "$dir/spec.md" 'How each constraint is met'
      check_once "$(ids "$ri" Q | tr '\n' ' ')" "$rs" tq "$dir/spec.md" 'Open questions from the intent'
    fi
  fi

  if [ -f "$dir/spec.md" ] && [ -f "$dir/plan.md" ]; then
    for r in $(ids "$rs" R 1); do
      printf '%s\n' "$rp" | grep -qx "ow|$r" ||
        echo "$dir/plan.md: $r from spec.md is not cited in ## Order of work"
      printf '%s\n' "$rp" | grep -qx "pf|$r" ||
        echo "$dir/plan.md: $r from spec.md is not cited in ## Proof"
    done
  fi
}

# Walk <specs-dir>/<feature>/ and <specs-dir>/<feature>/<change>/, skipping
# features that start with _ (spec R8).
lint_tree() {
  local top=$1 p rel feature
  find "$top" -path "$top/*/*/*" -prune -o -path "$top/*" -type d -print | sort |
    while IFS= read -r p; do
      rel=${p#"$top"/}
      feature=${rel%%/*}
      case $feature in _*) continue ;; esac
      case $rel in
        */*)
          check_change_name "$p" "${rel#*/}"
          lint_change "$p"
          ;;
        *) check_feature_name "$p" "$feature" ;;
      esac
    done
}

if [ $# -gt 1 ]; then usage; fi
case ${1:-} in
  --rules)
    printf '%s\n' "$RULES" | grep -E '^[a-z]+\|(key|section)\|' | sort
    exit 0
    ;;
  -*) usage ;;
esac

specs_dir=${1:-.specs}
[ "$specs_dir" = / ] || specs_dir=${specs_dir%/}
if [ ! -d "$specs_dir" ]; then
  printf 'lint-specs.sh: no such directory: %s\n' "$specs_dir" >&2
  exit 2
fi

problems=$(lint_tree "$specs_dir")
if [ -n "$problems" ]; then
  printf '%s\n' "$problems"
  exit 1
fi
exit 0
