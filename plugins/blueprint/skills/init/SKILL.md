---
name: init
description: Scaffold a blueprint project in the current directory. Copies the plugin's templates into .blueprints/_rules/, where the project owns and can adapt them, and adds a short blueprint section to the project's CLAUDE.md. Safe to re-run; never overwrites a file the project has changed without asking.
disable-model-invocation: true
---

# init

Set up the current working directory as a `blueprint` project. A project is a directory with its own high-level design (HLD) in its root. Its rules and its low-level design (LLD) live under `.blueprints/`.

`init` writes only scaffolding. It does not write `SYSTEM.md`, `ARCHITECTURE.md`, `ROADMAP.md`, decision records or any LLD document. Those come from `hld` and `lld`.

## 1. Check where you are

- The project root is the current working directory. Tell the operator which directory that is before you write anything.
- **Nested project.** Look for a `.blueprints/_rules/` directory in each parent directory up to the repository root. If one exists, this would be a nested project: a project inside another, implementing one of the parent's components. Tell the operator which parent project you found, and ask them to confirm that this directory should be a nested project. If they confirm, remind them that `SYSTEM.md` will name the parent component in its `implements:` front matter when they run `hld`.
- **Already initialized.** If `.blueprints/_rules/` already exists here, this is a re-run. Carry on: the steps below fill in only what is missing, and ask before changing anything else.

## 2. Copy the rules

The plugin's rules are in `${CLAUDE_PLUGIN_ROOT}/.blueprints/_rules/`. That is one `*_template.md` file per document type, plus any naming rules beside them. Copy every file there into `.blueprints/_rules/` in the project root, creating the directory if needed.

The project owns its copy and may have adapted it, so treat existing files with care:

- **Missing in the project:** copy it.
- **Identical to the plugin's file:** leave it alone.
- **Different from the plugin's file:** do not overwrite it. Show the operator the differences and ask, file by file, whether to keep the project's version, take the plugin's version, or merge the two.

Never delete a file from `.blueprints/_rules/`, even one the plugin no longer ships. Report it instead.

## 3. Add the CLAUDE.md section

Add the section below to `CLAUDE.md` in the project root, creating the file if it does not exist. The section sits between its two marker comments, so a re-run can find it.

- **No section yet:** append it to the end of the file.
- **Identical section already there:** leave it alone.
- **Different section already there:** show the operator the differences and ask before replacing the text between the markers.

Leave everything outside the markers untouched.

```markdown
<!-- blueprint:start -->
## Planning with blueprint

This project plans its work with the `blueprint` plugin.

- High-level design, in this directory: `SYSTEM.md`, `ARCHITECTURE.md`, `ROADMAP.md`, and decision records in `docs/adr/`. Work on it with `/hld`.
- Low-level design, one directory per component: `.blueprints/<component>/`, holding `INTENT.md`, `SPEC.md`, `PROOFS.md` and `PLAN.md`. Work on it with `/lld <component>`.
- Templates: `.blueprints/_rules/`. Every planning document follows its template there.
- Agents propose options with trade-offs. The operator decides.
<!-- blueprint:end -->
```

## 4. Report

List every file you created, changed or left alone, and any question still waiting on the operator. Then suggest the next step: `/hld` to start the high-level design.
