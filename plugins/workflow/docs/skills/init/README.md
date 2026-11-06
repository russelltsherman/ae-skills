# init

Prepares a project for the `workflow` skills that write files into it, by creating `.handoff/.gitignore`. Source of truth: [`skills/init/SKILL.md`](../../../skills/init/SKILL.md).

## What it does

`/workflow:init` creates `.handoff/.gitignore`, containing `*`, so that `/handoff` can be used in the project and nothing it writes to `.handoff/` is ever committed. `/handoff` never creates that file itself: when it is missing, `/handoff` writes nothing and tells you to run `/workflow:init`. Running it again is always safe. An existing file is left exactly as it is, and the reply is one line saying what happened.

## When to use it

- The first time you use `/handoff` in a project, or when `/handoff` tells you to run `/workflow:init`.
- After cloning a project, before using `/handoff` there.

Not for:

- Setting up anything else in a project, such as its own `.gitignore`. `/workflow:init` changes nothing outside `.handoff/`, and any text after the command is ignored.
- Setting up sdlc. `/workflow:init` has nothing to do with `/sdlc:init`.

It runs only when you type `/workflow:init`; the model never starts it.

## How to use it

Type the command in the project. It takes no arguments and asks nothing.

```
> /workflow:init
Created /home/me/src/shop/.handoff/.gitignore.
```

Run again in the same project:

```
> /workflow:init
Already present, left unchanged: /home/me/src/shop/.handoff/.gitignore.
```

## Details

### Why the qualified name

`/init` is a built-in Claude Code command, so this skill is always called by its qualified name, `/workflow:init`.

### Where the file goes

Inside a git repository, `.handoff/.gitignore` is created at the repository's root, even when you run the command from a subdirectory. Outside a git repository, or when `git` is not installed, it is created in the current directory. This is the same place `/handoff` looks, so `/handoff` always finds the file `/workflow:init` made.

### What the file contains

The file contains `*`. Git then ignores everything in `.handoff/`, including `.gitignore` itself, so the file is never committed either. That means a fresh clone of the project has no `.handoff/.gitignore`, and you run `/workflow:init` again there before `/handoff` works.

### Existing files are never changed

If `.handoff/.gitignore` already exists, with any content, or as a symlink (even a broken one), it is left unchanged. It is your file, and `/handoff` only checks that it exists.

### The three replies

The reply is always one line, in one of three forms:

- `Created <path>.` The file did not exist and now does.
- `Already present, left unchanged: <path>.` The file was already there.
- `Nothing changed: <reason> (<path>).` Something is in the way, and nothing was created, moved or deleted. The reason is one of:
  - `.handoff/.gitignore is not a file`, for example a directory with that name;
  - `.handoff is not a directory`, for example a regular file named `.handoff`;
  - `cannot create .handoff/`, when the directory can't be created there;
  - `cannot write .handoff/.gitignore`, when the file can't be written.

`<path>` is always the absolute path of `.handoff/.gitignore`. If shell execution for skills is turned off by policy (the `disableSkillShellExecution` setting), the setup can't run, and the reply says so in one `Nothing changed:` line.

## Limits

- It creates only `.handoff/.gitignore`. Other files that later `workflow` skills need will be added to it by later changes.
- It doesn't check or repair the contents of an existing `.handoff/.gitignore`.
- It never reads or edits the project's own `.gitignore`.

## Test cases

The skill's test cases live in [`evals/init/`](../../../evals/init/). Each goal is the first line of the case's `case.yaml`.

The evals run with no baseline, because the skill is command-only. The setup script's edge cases (symlinks, permissions, no `git`) are tested without model calls by `tests/init.sh`, which `make tests` runs.

| Case | Goal |
| :---- | :---- |
| `already-present` | Checks that an existing .handoff/.gitignore with content other than * is left unchanged and the reply is exactly the Already present line. |
| `creates-gitignore` | Checks that in a git repository with no .handoff/, /workflow:init creates .handoff/.gitignore containing *, replies with exactly the Created line, and calls no tools. |
| `handoff-is-a-file` | Checks that when .handoff is a regular file, nothing changes and the reply is exactly one Nothing changed line saying .handoff is not a directory. |
| `ignores-arguments` | Checks that text after /workflow:init changes nothing: .handoff/.gitignore is created containing *, the reply is exactly the Created line, and no tools are called. |
| `outside-git-repo` | Checks that outside a git repository /workflow:init creates .handoff/.gitignore containing * in the current directory and replies with exactly the Created line. |
| `project-gitignore-untouched` | Checks that the project's own .gitignore is byte-for-byte unchanged when /workflow:init creates .handoff/.gitignore. |
