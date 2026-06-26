#!/usr/bin/env python3
"""okf-validate: validate an OKF v0.1 bundle plus this vault's conventions.

Usage: python okf_validate.py <vault_dir>
Exit code 0 = no errors (warnings allowed). 1 = at least one error. 2 = usage/dep problem.
"""
import os
import re
import sys
from datetime import date, datetime

try:
    import yaml
except ImportError:
    sys.stderr.write("ERROR: PyYAML is required. Run: pip install pyyaml\n")
    sys.exit(2)

RESERVED = {"index.md", "log.md"}
KNOWN_TYPES = {"Article", "Paper", "Concept", "Entity", "Note", "Decision", "Goal"}
RECOMMENDED = ("title", "description", "timestamp")

FM_RE = re.compile(r"^---\r?\n(.*?)\r?\n---\r?\n?", re.DOTALL)
WIKILINK_RE = re.compile(r"\[\[([^\]\|#]+)(?:[#\|][^\]]*)?\]\]")
CODE_FENCE_RE = re.compile(r"```.*?```", re.DOTALL)
INLINE_CODE_RE = re.compile(r"`[^`]*`")


def strip_code(text):
    """Remove fenced and inline code so prose like `[[x]]` is not read as a link."""
    return INLINE_CODE_RE.sub("", CODE_FENCE_RE.sub("", text))


def parse_frontmatter(text):
    """Return (data_dict, error_str). data_dict is None if no frontmatter block."""
    m = FM_RE.match(text)
    if not m:
        return None, None
    try:
        data = yaml.safe_load(m.group(1))
    except (yaml.YAMLError, ValueError) as e:
        # PyYAML raises a bare ValueError (not YAMLError) for out-of-range implicit
        # timestamps such as `2026-13-99`; catch both so the validator never crashes.
        return False, "unparseable YAML frontmatter: %s" % e
    if data is None:
        data = {}
    if not isinstance(data, dict):
        return False, "frontmatter is not a mapping"
    return data, None


def is_iso8601(value):
    # PyYAML parses unquoted ISO timestamps into datetime/date objects; accept those.
    if isinstance(value, (datetime, date)):
        return True
    if not isinstance(value, str):
        return False
    s = value.strip().replace("Z", "+00:00")
    for candidate in (s, s.split("T")[0]):
        try:
            datetime.fromisoformat(candidate)
            return True
        except ValueError:
            continue
    return False


def collect_md_files(root):
    out = []
    for dirpath, _dirs, files in os.walk(root):
        for name in files:
            if name.endswith(".md"):
                out.append(os.path.join(dirpath, name))
    return sorted(out)


def validate_bundle(root):
    """Return (errors, warnings) as lists of strings."""
    errors, warnings = [], []
    files = collect_md_files(root)
    stems = {os.path.splitext(os.path.basename(p))[0] for p in files}

    for path in files:
        rel = os.path.relpath(path, root)
        base = os.path.basename(path)
        with open(path, "r", encoding="utf-8") as fh:
            text = fh.read()

        data, err = parse_frontmatter(text)

        if base in RESERVED:
            if base == "index.md" and data not in (None, False):
                extra = set(data.keys()) - {"okf_version"}
                if rel == "index.md" and extra:
                    warnings.append("%s: root index.md should only carry okf_version (extra: %s)"
                                    % (rel, ", ".join(sorted(extra))))
            continue

        if data is None:
            errors.append("%s: missing YAML frontmatter" % rel)
            continue
        if data is False:
            errors.append("%s: %s" % (rel, err))
            continue
        if not str(data.get("type", "")).strip():
            errors.append("%s: frontmatter missing non-empty 'type'" % rel)
        elif data["type"] not in KNOWN_TYPES:
            warnings.append("%s: unknown type '%s'" % (rel, data["type"]))

        for field in RECOMMENDED:
            if field not in data:
                warnings.append("%s: missing recommended field '%s'" % (rel, field))
        if "timestamp" in data and not is_iso8601(data["timestamp"]):
            warnings.append("%s: 'timestamp' is not valid ISO 8601" % rel)

        for stem in WIKILINK_RE.findall(strip_code(text)):
            if stem.strip() not in stems:
                warnings.append("%s: wikilink [[%s]] has no matching file" % (rel, stem.strip()))

    return errors, warnings


def main(argv):
    if len(argv) != 2:
        sys.stderr.write("Usage: python okf_validate.py <vault_dir>\n")
        return 2
    root = argv[1]
    if not os.path.isdir(root):
        sys.stderr.write("ERROR: not a directory: %s\n" % root)
        return 2
    errors, warnings = validate_bundle(root)
    for w in warnings:
        print("WARN: %s" % w)
    for e in errors:
        print("ERROR: %s" % e)
    print("\n%d error(s), %d warning(s)" % (len(errors), len(warnings)))
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
