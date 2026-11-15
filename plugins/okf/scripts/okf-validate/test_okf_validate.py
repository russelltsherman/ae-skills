"""Tests for okf_validate. Run: pytest plugins/okf/scripts/okf-validate/"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import okf_validate as v  # noqa: E402


def write(tmp_path, rel, body):
    p = tmp_path / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(body, encoding="utf-8")
    return p


GOOD = (
    "---\n"
    "type: Concept\n"
    "title: A\n"
    "description: d\n"
    "timestamp: 2026-06-26T00:00:00Z\n"
    "---\n\n"
    "# Summary\nLinks to [[other]].\n"
)
OTHER = (
    "---\ntype: Note\ntitle: O\ndescription: d\ntimestamp: 2026-06-26T00:00:00Z\n---\n\nbody\n"
)


def test_clean_bundle_has_no_errors_or_warnings(tmp_path):
    write(tmp_path, "concepts/a.md", GOOD)
    write(tmp_path, "notes/other.md", OTHER)
    errors, warnings = v.validate_bundle(str(tmp_path))
    assert errors == []
    assert warnings == []


def test_missing_frontmatter_is_error(tmp_path):
    write(tmp_path, "concepts/a.md", "# no frontmatter\n")
    errors, _ = v.validate_bundle(str(tmp_path))
    assert any("missing YAML frontmatter" in e for e in errors)


def test_missing_type_is_error(tmp_path):
    write(tmp_path, "concepts/a.md", "---\ntitle: x\n---\nbody\n")
    errors, _ = v.validate_bundle(str(tmp_path))
    assert any("missing non-empty 'type'" in e for e in errors)


def test_unparseable_frontmatter_is_error(tmp_path):
    write(tmp_path, "concepts/a.md", "---\ntype: : :\n  bad: [\n---\nbody\n")
    errors, _ = v.validate_bundle(str(tmp_path))
    assert errors  # some error reported


def test_reserved_files_exempt_from_type(tmp_path):
    write(tmp_path, "index.md", '---\nokf_version: "0.1"\n---\n# Index\n')
    write(tmp_path, "log.md", "# Update Log\n")
    errors, _ = v.validate_bundle(str(tmp_path))
    assert errors == []


def test_unknown_type_is_warning_not_error(tmp_path):
    write(tmp_path, "x/a.md", "---\ntype: Banana\ntitle: t\ndescription: d\n"
                              "timestamp: 2026-06-26T00:00:00Z\n---\nbody\n")
    errors, warnings = v.validate_bundle(str(tmp_path))
    assert errors == []
    assert any("unknown type 'Banana'" in w for w in warnings)


def test_broken_wikilink_is_warning(tmp_path):
    write(tmp_path, "concepts/a.md", "---\ntype: Concept\ntitle: t\ndescription: d\n"
                                     "timestamp: 2026-06-26T00:00:00Z\n---\nSee [[ghost]].\n")
    _errors, warnings = v.validate_bundle(str(tmp_path))
    assert any("[[ghost]]" in w for w in warnings)


def test_bad_timestamp_is_warning(tmp_path):
    write(tmp_path, "concepts/a.md", "---\ntype: Concept\ntitle: t\ndescription: d\n"
                                     "timestamp: not-a-date\n---\nbody\n")
    _errors, warnings = v.validate_bundle(str(tmp_path))
    assert any("not valid ISO 8601" in w for w in warnings)


def test_bare_datetime_timestamp_is_valid(tmp_path):
    # Unquoted ISO timestamps load as datetime objects; they must NOT warn.
    write(tmp_path, "concepts/a.md", "---\ntype: Concept\ntitle: t\ndescription: d\n"
                                     "timestamp: 2026-06-26T00:00:00Z\n---\nbody\n")
    _errors, warnings = v.validate_bundle(str(tmp_path))
    assert not any("ISO 8601" in w for w in warnings)


def test_wikilink_in_inline_code_is_not_flagged(tmp_path):
    write(tmp_path, "concepts/a.md", "---\ntype: Concept\ntitle: t\ndescription: d\n"
                                     "timestamp: 2026-06-26T00:00:00Z\n---\nThe `[[ghost]]` syntax.\n")
    _errors, warnings = v.validate_bundle(str(tmp_path))
    assert not any("ghost" in w for w in warnings)


def test_out_of_range_timestamp_does_not_crash(tmp_path):
    # PyYAML raises a bare ValueError on 2026-13-99; the validator must report, not crash.
    write(tmp_path, "concepts/a.md", "---\ntype: Concept\ntitle: t\ndescription: d\n"
                                     "timestamp: 2026-13-99\n---\nbody\n")
    errors, _warnings = v.validate_bundle(str(tmp_path))
    assert any("unparseable" in e for e in errors)
