#!/usr/bin/env python3
"""okf-validate: validate an OKF v0.1 bundle plus this vault's conventions.

Usage: python okf_validate.py <vault_dir>
Exit code 0 = no errors (warnings allowed). 1 = at least one error. 2 = usage/dep problem.
"""
import os
import re
import sys
from datetime import date, datetime, timedelta, timezone

try:
    import yaml
except ImportError:
    sys.stderr.write("ERROR: PyYAML is required. Run: pip install pyyaml\n")
    sys.exit(2)

RESERVED = {"index.md", "log.md"}
KNOWN_TYPES = {"Article", "Paper", "Concept", "Entity", "Note", "Decision", "Goal"}
RECOMMENDED = ("title", "description", "timestamp")
RAW_DIR = "raw"
# How far past the current time a page timestamp may be before it is reported: room for clock
# skew between the machine that wrote the page and the one validating it, nothing more.
FUTURE_TOLERANCE = timedelta(minutes=5)
# Filename prefixes allowed for a page directly inside each folder (see reference/NAMING.md).
PREFIXES = {
    "concepts": ("pattern", "method", "artifact", "topic"),
    "entities": ("person", "org", "tool", "place"),
    "sources": ("research", "article", "paper", "book", "meeting", "chat"),
    "notes": ("note", "decision", "goal"),
}
# Folders whose pages must carry their prefix as the first tag.
TAGGED_BY_PREFIX = ("concepts", "entities")

FM_RE = re.compile(r"^---\r?\n(.*?)\r?\n---\r?\n?", re.DOTALL)
# A wikilink lives on one line: Obsidian does not render [[...]] that contains a newline, so
# neither pattern may match across one. SPLIT_WIKILINK_RE finds the links that do span lines.
WIKILINK_RE = re.compile(r"\[\[([^\]\|#\n]+)(?:[#\|][^\]\n]*)?\]\]")
SPLIT_WIKILINK_RE = re.compile(r"\[\[[^\[\]\n]*\n[^\[\]]*\]\]")
CODE_FENCE_RE = re.compile(r"```.*?```", re.DOTALL)
INLINE_CODE_RE = re.compile(r"`[^`]*`")


def _blank(m):
    """Blank out a code match but keep its newlines, so offsets and line numbers still hold."""
    return re.sub(r"[^\n]", " ", m.group(0))


def strip_code(text):
    """Blank fenced and inline code so prose like `[[x]]` is not read as a link."""
    return INLINE_CODE_RE.sub(_blank, CODE_FENCE_RE.sub(_blank, text))


def check_split_wikilinks(rel, text):
    """Warnings for each [[...]] that spans a line break, with the line where it starts."""
    out = []
    for m in SPLIT_WIKILINK_RE.finditer(text):
        line = text.count("\n", 0, m.start()) + 1
        shown = re.sub(r"\s*\n\s*", " ", m.group(0))
        out.append("%s:%d: wikilink split across lines: %s (Obsidian does not render it; "
                   "keep the whole link on one line)" % (rel, line, shown))
    return out


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


def parse_timestamp(value):
    """Return the timestamp as an aware UTC datetime, a date (date-only value), or None.

    PyYAML turns unquoted ISO timestamps into datetime/date objects: tz-bearing ones come back
    aware, ones without an offset come back naive. A naive value is taken to be UTC, which is
    what the vault writes (`...Z`). Quoted values arrive as strings and are parsed the same way.
    """
    if isinstance(value, str):
        s = value.strip().replace("Z", "+00:00").replace("z", "+00:00")
        # Date first: datetime.fromisoformat would read a bare date as midnight.
        try:
            value = date.fromisoformat(s)
        except ValueError:
            try:
                value = datetime.fromisoformat(s)
            except ValueError:
                return None
    if isinstance(value, datetime):
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)
    if isinstance(value, date):
        return value
    return None


def check_future_timestamp(rel, value, now):
    """Warning if a page's timestamp is later than `now` (aware UTC) plus the skew tolerance."""
    ts = parse_timestamp(value)
    if isinstance(ts, datetime):
        future = ts > now + FUTURE_TOLERANCE
    elif isinstance(ts, date):
        future = ts > now.date()
    else:
        return []
    if not future:
        return []
    return ["%s: timestamp %s is in the future (now %s); set it from the clock "
            "(date -u +%%Y-%%m-%%dT%%H:%%M:%%SZ), not a guess"
            % (rel, value.isoformat() if hasattr(value, "isoformat") else value,
               now.strftime("%Y-%m-%dT%H:%M:%SZ"))]


def collect_md_files(root):
    """Wiki pages only: the top-level raw/ directory holds verbatim source copies, not pages."""
    out = []
    for dirpath, dirs, files in os.walk(root):
        if dirpath == root and RAW_DIR in dirs:
            dirs.remove(RAW_DIR)
        for name in files:
            if name.endswith(".md"):
                out.append(os.path.join(dirpath, name))
    return sorted(out)


def collect_raw_md_files(root):
    """Markdown files under the top-level raw/ dir: not pages, but Obsidian indexes their stems."""
    out = []
    for dirpath, _dirs, files in os.walk(os.path.join(root, RAW_DIR)):
        out.extend(os.path.join(dirpath, n) for n in files if n.endswith(".md"))
    return sorted(out)


def stem_of(path):
    return os.path.splitext(os.path.basename(path))[0]


def check_duplicate_stems(root, paths):
    """One error per stem shared by two or more .md files: [[stem]] would be ambiguous."""
    by_stem = {}
    for p in paths:
        if os.path.basename(p) in RESERVED:
            continue
        by_stem.setdefault(stem_of(p), []).append(os.path.relpath(p, root))
    return ["duplicate filename stem '%s': %s" % (s, ", ".join(sorted(ps)))
            for s, ps in sorted(by_stem.items()) if len(ps) > 1]


def check_naming(rel, data):
    """Warnings for a page directly in a prefixed folder: filename prefix and first tag."""
    parts = rel.split(os.sep)
    if len(parts) != 2 or parts[0] not in PREFIXES:
        return []
    folder, stem = parts[0], stem_of(rel)
    prefix = next((p for p in PREFIXES[folder] if stem.startswith(p + "-")), None)
    if prefix is None:
        return ["%s: filename should start with one of %s (see NAMING.md)"
                % (rel, ", ".join(p + "-" for p in PREFIXES[folder]))]
    if folder in TAGGED_BY_PREFIX:
        tags = data.get("tags")
        first = tags[0] if isinstance(tags, list) and tags else None
        if first != prefix:
            return ["%s: first tag should be '%s' to match the filename prefix" % (rel, prefix)]
    return []


def validate_bundle(root, now=None):
    """Return (errors, warnings) as lists of strings.

    `now` is the reference time for the future-timestamp check (defaults to the current UTC
    time); a naive value is taken to be UTC.
    """
    if now is None:
        now = datetime.now(timezone.utc)
    elif now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)
    errors, warnings = [], []
    files = collect_md_files(root)
    stems = {stem_of(p) for p in files}
    errors.extend(check_duplicate_stems(root, files + collect_raw_md_files(root)))

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
        elif "timestamp" in data:
            warnings.extend(check_future_timestamp(rel, data["timestamp"], now))

        warnings.extend(check_naming(rel, data))

        resource = data.get("resource")
        if isinstance(resource, str) and resource.startswith(RAW_DIR + "/"):
            if not os.path.isfile(os.path.join(root, resource)):
                warnings.append("%s: resource '%s' has no matching raw copy" % (rel, resource))

        body = strip_code(text)
        warnings.extend(check_split_wikilinks(rel, body))
        for stem in WIKILINK_RE.findall(body):
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
