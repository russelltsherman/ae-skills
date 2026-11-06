---
name: release-notes
description: Writes release notes for a version from the merged pull requests since the last tag. Use when the user asks for release notes, a changelog entry or a summary of what shipped in a release.
---

# Release notes

1. Find the last tag with `git describe --tags --abbrev=0`.
2. List the pull requests merged since that tag.
3. Write one bullet per pull request, in plain words, so that customers who recieve the notes understand what changed. Keep each bullet under 15 words.
4. Put breaking changes first, under a **Breaking** heading.
