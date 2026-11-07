#!/usr/bin/env bash
# Run the unit tests in tests/.
set -eu
usage() {
  cat <<'USAGE'
Usage: scripts/test.sh [-v|--verbose] [<name>]
Run the unit tests in tests/ with python3's unittest.
  -v, --verbose  print each test as it runs
  <name>         run only tests/test_<name>.py
  -h, --help     show this help
USAGE
}
verbose=''
name=''
while [ $# -gt 0 ]; do
  case $1 in
    -h | --help) usage; exit 0 ;;
    -v | --verbose) verbose=-v ;;
    -*) echo "test.sh: unknown option: $1" >&2; usage >&2; exit 2 ;;
    *) name=$1 ;;
  esac
  shift
done
cd "$(dirname "$0")/.."
python3 -m unittest discover -s tests -p "test_${name:-*}.py" $verbose
