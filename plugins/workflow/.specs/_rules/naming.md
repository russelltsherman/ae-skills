# Naming: change directories

Every directory under a feature describes one change. Planning documents for that change live inside it:

```
.specs/<feature>/<YYYYMMDD-HHMM>-<change>/<document>.md
```

This rule covers directory names only. File names inside a change directory belong to each document's template.

## Slugs

Both `<feature>` and `<change>` are slugs: lowercase kebab-case using only `a-z`, `0-9` and `-`. Slugs never contain `_`; names starting with `_` (such as `_rules/`) are reserved for rules and are never features.

- **Feature**: the component's name plus a type suffix, e.g. `intent-skill`, `policy-spec-format-skill`. Changes to the files in `.specs/_rules/` use the feature `specs-rules`.
- **Change**: what is being done to the feature. A component's first build is always `create`. Later changes get a short descriptive slug, e.g. `add-reconcile-mode`.

## Timestamp

`<YYYYMMDD-HHMM>` is the time the change directory is created, from `date +%Y%m%d-%H%M`. Never backdate it and never rename it.

## Creating a change directory

1. List the existing features in `.specs/`. If the work belongs to one of them, use its slug exactly.
2. If the feature slug or the `<change>` slug within that feature already exists, stop and ask the user. A new feature must get a different slug.
3. Create the directory.

## Finding a change directory

Only directories matching `.specs/<feature>/<YYYYMMDD-HHMM>-<change>/` are change directories. Ignore everything else, including `_rules/`.

- `<feature>/<change>`: the exact directory.
- `<change>` alone: the change with that slug under any feature.
- No argument: the most recent change directory, by its timestamp across all features, that contains the input document the stage needs (`intent.md` for spec; for plan, `spec.md`, or `intent.md` when it says `spec: skipped`).

If more than one directory matches, list them and ask the user which one is meant. Never pick one silently.
