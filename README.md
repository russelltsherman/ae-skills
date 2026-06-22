# ae-skills

Russell Sherman's Claude Code plugin — a collection of [Agent Skills](https://docs.claude.com/en/docs/claude-code/skills) for agentic engineering workflows.

Skills live under [`src/skills/`](src/skills/). Each is a directory containing a `SKILL.md` (with YAML frontmatter and instructions) plus any supporting scripts or references.

## Skills Index

| Skill | Description |
| --- | --- |
| [mcp-builder](src/skills/mcp-builder/SKILL.md) | Build high-quality MCP (Model Context Protocol) servers in Python (FastMCP) or Node/TypeScript (MCP SDK). |
| [obsidian](src/skills/obsidian/SKILL.md) | Operate an Obsidian vault from an agent — notes, YAML frontmatter, wikilinks, tags, daily notes, and Dataview/Templater/Tasks formats. |
| [skill-creator](src/skills/skill-creator/SKILL.md) | Create, modify, improve, and measure the performance of skills, including evals, benchmarking, and description optimization. |
| [teach](src/skills/teach/SKILL.md) | Teach the user a new skill or concept, within this workspace. |
| [using-argo-workflows-cli](src/skills/using-argo-workflows-cli/SKILL.md) | Submit, monitor, debug, and manage Argo Workflows from the CLI — WorkflowTemplates, DAGs, cron schedules, and retries. |
| [using-argocd-cli](src/skills/using-argocd-cli/SKILL.md) | Operate Argo CD GitOps continuous delivery with the `argocd` CLI — sync, diff, health, rollbacks, app-of-apps, and ApplicationSets. |
| [using-aws-cli](src/skills/using-aws-cli/SKILL.md) | Operate the AWS CLI (`aws` v2) — profiles/SSO, `--query` output shaping, pagination, waiters, per-service ops, and scripting. |
| [using-claude-cli](src/skills/using-claude-cli/SKILL.md) | Drive the Claude Code CLI itself — headless/print mode, subagents, session resume, permissions, cost, and scripted orchestration. |
| [using-codex-cli](src/skills/using-codex-cli/SKILL.md) | Operate the OpenAI Codex CLI safely — approval/sandbox modes, `codex exec` automation, AGENTS.md, config profiles, and MCP server mode. |
| [using-crossplane-cli](src/skills/using-crossplane-cli/SKILL.md) | Work with the Crossplane CLI and control-plane resources — providers, Compositions, XRDs/claims, xpkg packaging, and render/trace. |
| [using-devcontainer-cli](src/skills/using-devcontainer-cli/SKILL.md) | Author, run, and debug Dev Containers with the `@devcontainers/cli` and `devcontainer.json` — lifecycle hooks, features, and CI. |
| [using-gemini-cli](src/skills/using-gemini-cli/SKILL.md) | Use Google's Gemini CLI — interactive/non-interactive invocation, approval/sandbox modes, GEMINI.md context, settings, MCP, and subagents. |
| [using-git-worktrees](src/skills/using-git-worktrees/SKILL.md) | Use Git worktrees correctly — bare-repo layout, parallel worktrees without collisions, and the full lifecycle. |
| [using-github-cli](src/skills/using-github-cli/SKILL.md) | Read/metadata queries and scripting with the GitHub CLI (`gh`) — `--json`/`--jq`, GraphQL, automation, and extensions (reads only). |
| [using-glab-cli](src/skills/using-glab-cli/SKILL.md) | Drive GitLab from the CLI with `glab` — merge requests, issues, pipelines, releases, and raw API calls. |
| [using-graphite-cli](src/skills/using-graphite-cli/SKILL.md) | Drive all version-control work — commits, branches, PRs, stacks, conflict resolution — through the Graphite CLI (`gt`). |
| [using-helm-cli](src/skills/using-helm-cli/SKILL.md) | Operate Helm for release management — install/upgrade/rollback/uninstall, chart authoring, values, OCI repos, hooks, and testing. |
| [using-kubectl-cli](src/skills/using-kubectl-cli/SKILL.md) | Inspect, query, debug, and change a Kubernetes cluster with kubectl — context/namespace safety, rollouts, debugging, and RBAC. |
| [using-kustomize-cli](src/skills/using-kustomize-cli/SKILL.md) | Author and operate Kustomize overlays — bases/overlays/components, patches, generators, transformers, and GitOps pipelines. |
| [using-omlx-cli](src/skills/using-omlx-cli/SKILL.md) | Run local LLM inference on Apple Silicon with the omlx CLI — serve models, OpenAI-compatible API, MCP, and memory tuning. |
| [using-terraform-cli](src/skills/using-terraform-cli/SKILL.md) | Author and run Terraform/OpenTofu safely — state and backends, version pinning, refactoring, secrets, and CI/CD. |
| [workflow-creator](src/skills/workflow-creator/SKILL.md) | Author runnable workflow scripts for Claude Code's Workflow tool — deterministic multi-agent orchestration in plain JavaScript control flow. |
| [writing-adr](src/skills/writing-adr/SKILL.md) | Author and manage Architecture Decision Records (ADRs) using MADR 4.0 — record, supersede, and deprecate decisions. |
| [writing-bash-scripts](src/skills/writing-bash-scripts/SKILL.md) | Write robust, ShellCheck-clean bash scripts — portability, conventions, and CLI scaffolding. |
| [writing-dockerfiles](src/skills/writing-dockerfiles/SKILL.md) | Author and harden production-grade Dockerfiles and container images — multi-stage builds, size, security, and healthchecks. |
| [writing-github-actions](src/skills/writing-github-actions/SKILL.md) | Author secure, efficient GitHub Actions workflows and actions — matrix builds, caching, artifacts, OIDC, and permissions. |
| [writing-gitlab-pipelines](src/skills/writing-gitlab-pipelines/SKILL.md) | Write, review, and optimize GitLab CI/CD pipelines (`.gitlab-ci.yml`) — stages/jobs, caching/artifacts, environments, and scanning. |
| [writing-prds](src/skills/writing-prds/SKILL.md) | Author a Product Requirements Document (PRD) through a problem-first guided conversation with SMART metrics and user stories. |

## Installation

This repository is a [Claude Code plugin marketplace](https://docs.claude.com/en/docs/claude-code/plugins) named `ae-skills` that publishes a single plugin, `skills`, bundling all of the skills above.

Inside Claude Code, add the marketplace and install the plugin:

```
/plugin marketplace add russelltsherman/ae-skills
/plugin install skills@ae-skills
```

The first command registers this GitHub repo as a marketplace; the second installs the `skills` plugin from it. You can also browse and install interactively with `/plugin`.

To update later, refresh the marketplace and reinstall:

```
/plugin marketplace update ae-skills
```

To remove the plugin or the marketplace:

```
/plugin uninstall skills@ae-skills
/plugin marketplace remove ae-skills
```

The marketplace manifest lives in [`.claude-plugin/marketplace.json`](.claude-plugin/marketplace.json) and the plugin manifest in [`src/.claude-plugin/plugin.json`](src/.claude-plugin/plugin.json).
