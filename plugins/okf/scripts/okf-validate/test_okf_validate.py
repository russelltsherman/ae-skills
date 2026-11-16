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
    "tags: [pattern]\n"
    "description: d\n"
    "timestamp: 2026-06-26T00:00:00Z\n"
    "---\n\n"
    "# Summary\nLinks to [[note-other]].\n"
)
OTHER = (
    "---\ntype: Note\ntitle: O\ndescription: d\ntimestamp: 2026-06-26T00:00:00Z\n---\n\nbody\n"
)


def test_clean_bundle_has_no_errors_or_warnings(tmp_path):
    write(tmp_path, "concepts/pattern-a.md", GOOD)
    write(tmp_path, "notes/note-other.md", OTHER)
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


def test_raw_dir_is_skipped(tmp_path):
    # Verbatim source copies have no frontmatter and may contain stray [[links]].
    write(tmp_path, "raw/report.md", "# A report\nSee [[nowhere]].\n")
    errors, warnings = v.validate_bundle(str(tmp_path))
    assert errors == []
    assert warnings == []


def test_resource_pointing_at_existing_raw_copy_is_clean(tmp_path):
    write(tmp_path, "raw/report.md", "# A report\n")
    write(tmp_path, "sources/research-s.md", GOOD.replace("type: Concept\n", "type: Article\nresource: raw/report.md\n"))
    write(tmp_path, "notes/note-other.md", OTHER)
    errors, warnings = v.validate_bundle(str(tmp_path))
    assert errors == []
    assert warnings == []


def test_resource_pointing_at_missing_raw_copy_warns(tmp_path):
    write(tmp_path, "sources/s.md", GOOD.replace("type: Concept\n", "type: Article\nresource: raw/gone.pdf\n"))
    write(tmp_path, "notes/other.md", OTHER)
    _, warnings = v.validate_bundle(str(tmp_path))
    assert any("no matching raw copy" in w for w in warnings)


def test_nested_raw_dir_is_not_skipped(tmp_path):
    # Only the vault's top-level raw/ is exempt; a raw/ folder inside notes/ holds real pages.
    write(tmp_path, "notes/raw/n.md", "# no frontmatter\n")
    errors, _ = v.validate_bundle(str(tmp_path))
    assert any("missing YAML frontmatter" in e for e in errors)


# --- naming (reference/NAMING.md) ---

def page(type_, tags):
    return ("---\ntype: %s\ntitle: t\ndescription: d\ntags: %s\n"
            "timestamp: 2026-06-26T00:00:00Z\n---\nbody\n" % (type_, tags))


def test_well_named_pages_are_clean(tmp_path):
    write(tmp_path, "concepts/pattern-cqrs.md", page("Concept", "[pattern, web]"))
    write(tmp_path, "concepts/method-test-driven-development.md", page("Concept", "[method]"))
    write(tmp_path, "entities/person-kent-beck.md", page("Entity", "[person, tdd]"))
    write(tmp_path, "sources/research-pattern-cqrs.md", page("Article", "[research]"))
    write(tmp_path, "notes/decision-keep-billing.md", page("Decision", "[decision]"))
    errors, warnings = v.validate_bundle(str(tmp_path))
    assert errors == []
    assert warnings == []


def test_unprefixed_concept_warns(tmp_path):
    write(tmp_path, "concepts/cqrs.md", page("Concept", "[pattern]"))
    _, warnings = v.validate_bundle(str(tmp_path))
    assert any("concepts/cqrs.md: filename should start with" in w for w in warnings)


def test_prefix_from_another_folder_warns(tmp_path):
    # person- is an entity prefix; it is not valid for a concept page.
    write(tmp_path, "concepts/person-kent-beck.md", page("Concept", "[person]"))
    _, warnings = v.validate_bundle(str(tmp_path))
    assert any("filename should start with" in w for w in warnings)


def test_first_tag_must_match_prefix(tmp_path):
    write(tmp_path, "concepts/method-vertical-slicing.md", page("Concept", "[pattern, method]"))
    _, warnings = v.validate_bundle(str(tmp_path))
    assert any("first tag should be 'method'" in w for w in warnings)


def test_missing_tags_on_entity_warns(tmp_path):
    write(tmp_path, "entities/org-shopify.md",
          "---\ntype: Entity\ntitle: t\ndescription: d\ntimestamp: 2026-06-26T00:00:00Z\n---\nbody\n")
    _, warnings = v.validate_bundle(str(tmp_path))
    assert any("first tag should be 'org'" in w for w in warnings)


def test_sources_need_no_matching_tag(tmp_path):
    write(tmp_path, "sources/article-karpathy-llm-wiki.md", page("Article", "[ai, wiki]"))
    _, warnings = v.validate_bundle(str(tmp_path))
    assert warnings == []


def test_pages_outside_prefixed_folders_are_not_name_checked(tmp_path):
    write(tmp_path, "x/anything.md", page("Note", "[x]"))
    _, warnings = v.validate_bundle(str(tmp_path))
    assert warnings == []


def test_duplicate_stem_across_folders_is_error(tmp_path):
    write(tmp_path, "concepts/pattern-cqrs.md", page("Concept", "[pattern]"))
    write(tmp_path, "sources/pattern-cqrs.md", page("Article", "[x]"))
    errors, _ = v.validate_bundle(str(tmp_path))
    assert any("duplicate filename stem 'pattern-cqrs'" in e for e in errors)


def test_raw_md_stem_colliding_with_page_is_error(tmp_path):
    # Obsidian indexes raw/*.md too, so [[stem]] would be ambiguous.
    write(tmp_path, "raw/research-pattern-cqrs.md", "# report\n")
    write(tmp_path, "sources/research-pattern-cqrs.md", page("Article", "[research]"))
    errors, _ = v.validate_bundle(str(tmp_path))
    assert any("duplicate filename stem 'research-pattern-cqrs'" in e for e in errors)


def test_raw_txt_does_not_count_as_stem(tmp_path):
    write(tmp_path, "raw/meeting-review-2026-11-16.txt", "pasted\n")
    write(tmp_path, "sources/meeting-review-2026-11-16.md", page("Article", "[meeting]"))
    errors, _ = v.validate_bundle(str(tmp_path))
    assert errors == []


def test_nested_index_files_are_not_duplicates(tmp_path):
    write(tmp_path, "index.md", '---\nokf_version: "0.1"\n---\n# Index\n')
    write(tmp_path, "x/index.md", "# sub index\n")
    errors, _ = v.validate_bundle(str(tmp_path))
    assert not any("duplicate" in e for e in errors)


def note_page(body):
    return "---\ntype: Note\ntitle: S\ndescription: d\ntimestamp: 2026-06-26T00:00:00Z\n---\n\n" + body


def test_link_split_inside_alias_warns_with_line(tmp_path):
    write(tmp_path, "notes/note-other.md", OTHER)
    write(tmp_path, "notes/note-s.md", note_page("Line one.\nSee [[note-other|the\n  other note]] here.\n"))
    errors, warnings = v.validate_bundle(str(tmp_path))
    assert errors == []
    split = [w for w in warnings if "wikilink split across lines" in w]
    assert len(split) == 1
    # Frontmatter is 6 lines, then a blank line, so the link starts on line 9.
    assert split[0].startswith(os.path.join("notes", "note-s.md") + ":9:")
    assert "[[note-other|the other note]]" in split[0]


def test_link_split_inside_target_warns_once_and_is_not_matched_as_link(tmp_path):
    write(tmp_path, "notes/note-s.md", note_page("See [[pattern-modular-monolith\n|modular monolith]].\n"))
    errors, warnings = v.validate_bundle(str(tmp_path))
    assert len(warnings) == 1
    assert "wikilink split across lines" in warnings[0]
    assert "has no matching file" not in warnings[0]


def test_link_regex_does_not_match_across_newlines():
    assert v.WIKILINK_RE.findall("a [[note-x|one\ntwo]] b") == []
    assert v.WIKILINK_RE.findall("a [[note-x\n]] b") == []
    assert v.WIKILINK_RE.findall("a [[note-x|one two]] b") == ["note-x"]


def test_unclosed_bracket_does_not_swallow_a_later_link(tmp_path):
    write(tmp_path, "notes/note-other.md", OTHER)
    write(tmp_path, "notes/note-s.md", note_page("Stray [[ bracket.\nThen [[note-other]].\n"))
    errors, warnings = v.validate_bundle(str(tmp_path))
    assert errors == []
    assert warnings == []


def test_split_link_inside_code_fence_is_not_flagged(tmp_path):
    write(tmp_path, "notes/note-s.md", note_page("```\nexample [[note-x|a\nb]]\n```\n"))
    errors, warnings = v.validate_bundle(str(tmp_path))
    assert warnings == []


def test_split_link_after_code_reports_correct_line(tmp_path):
    write(tmp_path, "notes/note-other.md", OTHER)
    write(tmp_path, "notes/note-s.md", note_page("```\ncode\nmore\n```\nx [[note-other|a\nb]]\n"))
    _, warnings = v.validate_bundle(str(tmp_path))
    assert len(warnings) == 1 and ":12:" in warnings[0]


# --- future timestamps: `now` is injected so these never depend on the real clock -----------
from datetime import datetime, timedelta, timezone  # noqa: E402

NOW = datetime(2026, 11, 16, 19, 30, 0, tzinfo=timezone.utc)


def page_with_timestamp(ts):
    return ("---\ntype: Note\ntitle: O\ndescription: d\ntimestamp: %s\n---\n\nbody\n" % ts)


def future_warnings(tmp_path, ts, now=NOW):
    write(tmp_path, "notes/note-a.md", page_with_timestamp(ts))
    errors, warnings = v.validate_bundle(str(tmp_path), now=now)
    assert errors == []
    return [w for w in warnings if "in the future" in w]


def test_future_timestamp_warns_with_file_and_value(tmp_path):
    w = future_warnings(tmp_path, "2026-11-16T23:56:00Z")
    assert len(w) == 1
    assert "notes/note-a.md" in w[0] and "2026-11-16T23:56:00" in w[0]


def test_past_and_current_timestamps_do_not_warn(tmp_path):
    assert future_warnings(tmp_path, "2026-11-16T12:00:00Z") == []
    assert future_warnings(tmp_path, "2026-11-16T19:30:00Z") == []


def test_small_clock_skew_is_tolerated(tmp_path):
    assert future_warnings(tmp_path, "2026-11-16T19:34:59Z") == []
    assert len(future_warnings(tmp_path, "2026-11-16T19:35:01Z")) == 1


def test_offset_timestamp_is_compared_in_utc(tmp_path):
    # 21:00+02:00 is 19:00Z: in the past, even though 21:00 > 19:30 on its face.
    assert future_warnings(tmp_path, "2026-11-16T21:00:00+02:00") == []
    # 15:00-05:00 is 20:00Z: in the future.
    assert len(future_warnings(tmp_path, "2026-11-16T15:00:00-05:00")) == 1


def test_naive_timestamp_is_taken_as_utc(tmp_path):
    assert future_warnings(tmp_path, "2026-11-16T19:00:00") == []
    assert len(future_warnings(tmp_path, "2026-11-16T22:00:00")) == 1


def test_quoted_timestamp_is_checked_too(tmp_path):
    assert len(future_warnings(tmp_path, '"2026-11-17T00:00:00Z"')) == 1


def test_date_only_timestamp_warns_only_after_today(tmp_path):
    assert future_warnings(tmp_path, "2026-11-16") == []
    assert len(future_warnings(tmp_path, "2026-11-17")) == 1


def test_naive_now_is_taken_as_utc(tmp_path):
    naive = datetime(2026, 11, 16, 19, 30, 0)
    assert len(future_warnings(tmp_path, "2026-11-16T23:56:00Z", now=naive)) == 1


def test_future_check_defaults_to_real_clock(tmp_path):
    soon = (datetime.now(timezone.utc) + timedelta(days=1)).strftime("%Y-%m-%dT%H:%M:%SZ")
    write(tmp_path, "notes/note-a.md", page_with_timestamp(soon))
    _, warnings = v.validate_bundle(str(tmp_path))
    assert any("in the future" in w for w in warnings)


def test_invalid_timestamp_warns_once_not_as_future(tmp_path):
    write(tmp_path, "notes/note-a.md", page_with_timestamp("yesterday"))
    _, warnings = v.validate_bundle(str(tmp_path), now=NOW)
    assert any("not valid ISO 8601" in w for w in warnings)
    assert not any("in the future" in w for w in warnings)
