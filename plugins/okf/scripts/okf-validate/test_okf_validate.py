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
