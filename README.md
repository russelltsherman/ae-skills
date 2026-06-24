# ae-skills

Russell Sherman's Claude Code plugin marketplace — collections of [Agent Skills](https://docs.claude.com/en/docs/claude-code/skills) for agentic engineering workflows.

The marketplace publishes three plugins:

- **`skills`** — a broad collection of authoring and workflow skills (source [`plugins/skills/`](plugins/skills/), skills under [`plugins/skills/skills/`](plugins/skills/skills/)).
- **`cli`** — skills for driving common command-line tools (source [`plugins/cli/`](plugins/cli/), skills under [`plugins/cli/skills/`](plugins/cli/skills/)).
- **`rnd`** — research & development toolkit: authoring skills plus the `/ae-research` and `/ae-code-review` commands and their retry-hardened workflows (source [`plugins/rnd/`](plugins/rnd/), skills under [`plugins/rnd/skills/`](plugins/rnd/skills/)).

Each skill is a directory containing a `SKILL.md` (with YAML frontmatter and instructions) plus any supporting scripts or references. The `rnd` plugin additionally ships slash commands (`plugins/rnd/commands/`) and Workflow scripts (`plugins/rnd/workflows/`).

## `skills` plugin

| Skill | Description |
| --- | --- |
| [mcp-builder](plugins/skills/skills/mcp-builder/SKILL.md) | Build high-quality MCP (Model Context Protocol) servers in Python (FastMCP) or Node/TypeScript (MCP SDK). |
| [obsidian](plugins/skills/skills/obsidian/SKILL.md) | Operate an Obsidian vault from an agent — notes, YAML frontmatter, wikilinks, tags, daily notes, and Dataview/Templater/Tasks formats. |
| [skill-creator](plugins/skills/skills/skill-creator/SKILL.md) | Create, modify, improve, and measure the performance of skills, including evals, benchmarking, and description optimization. |
| [teach](plugins/skills/skills/teach/SKILL.md) | Teach the user a new skill or concept, within this workspace. |
| [using-git-worktrees](plugins/skills/skills/using-git-worktrees/SKILL.md) | Use Git worktrees correctly — bare-repo layout, parallel worktrees without collisions, and the full lifecycle. |
| [workflow-creator](plugins/skills/skills/workflow-creator/SKILL.md) | Author runnable workflow scripts for Claude Code's Workflow tool — deterministic multi-agent orchestration in plain JavaScript control flow. |
| [writing-bash-scripts](plugins/skills/skills/writing-bash-scripts/SKILL.md) | Write robust, ShellCheck-clean bash scripts — portability, conventions, and CLI scaffolding. |
| [writing-dockerfiles](plugins/skills/skills/writing-dockerfiles/SKILL.md) | Author and harden production-grade Dockerfiles and container images — multi-stage builds, size, security, and healthchecks. |
| [writing-github-actions](plugins/skills/skills/writing-github-actions/SKILL.md) | Author secure, efficient GitHub Actions workflows and actions — matrix builds, caching, artifacts, OIDC, and permissions. |
| [writing-gitlab-pipelines](plugins/skills/skills/writing-gitlab-pipelines/SKILL.md) | Write, review, and optimize GitLab CI/CD pipelines (`.gitlab-ci.yml`) — stages/jobs, caching/artifacts, environments, and scanning. |

## `cli` plugin

| Skill | Description |
| --- | --- |
| [using-argo-workflows-cli](plugins/cli/skills/using-argo-workflows-cli/SKILL.md) | Submit, monitor, debug, and manage Argo Workflows from the CLI — WorkflowTemplates, DAGs, cron schedules, and retries. |
| [using-argocd-cli](plugins/cli/skills/using-argocd-cli/SKILL.md) | Operate Argo CD GitOps continuous delivery with the `argocd` CLI — sync, diff, health, rollbacks, app-of-apps, and ApplicationSets. |
| [using-aws-cli](plugins/cli/skills/using-aws-cli/SKILL.md) | Operate the AWS CLI (`aws` v2) — profiles/SSO, `--query` output shaping, pagination, waiters, per-service ops, and scripting. |
| [using-claude-cli](plugins/cli/skills/using-claude-cli/SKILL.md) | Drive the Claude Code CLI itself — headless/print mode, subagents, session resume, permissions, cost, and scripted orchestration. |
| [using-codex-cli](plugins/cli/skills/using-codex-cli/SKILL.md) | Operate the OpenAI Codex CLI safely — approval/sandbox modes, `codex exec` automation, AGENTS.md, config profiles, and MCP server mode. |
| [using-crossplane-cli](plugins/cli/skills/using-crossplane-cli/SKILL.md) | Work with the Crossplane CLI and control-plane resources — providers, Compositions, XRDs/claims, xpkg packaging, and render/trace. |
| [using-devcontainer-cli](plugins/cli/skills/using-devcontainer-cli/SKILL.md) | Author, run, and debug Dev Containers with the `@devcontainers/cli` and `devcontainer.json` — lifecycle hooks, features, and CI. |
| [using-gemini-cli](plugins/cli/skills/using-gemini-cli/SKILL.md) | Use Google's Gemini CLI — interactive/non-interactive invocation, approval/sandbox modes, GEMINI.md context, settings, MCP, and subagents. |
| [using-github-cli](plugins/cli/skills/using-github-cli/SKILL.md) | Read/metadata queries and scripting with the GitHub CLI (`gh`) — `--json`/`--jq`, GraphQL, automation, and extensions (reads only). |
| [using-glab-cli](plugins/cli/skills/using-glab-cli/SKILL.md) | Drive GitLab from the CLI with `glab` — merge requests, issues, pipelines, releases, and raw API calls. |
| [using-graphite-cli](plugins/cli/skills/using-graphite-cli/SKILL.md) | Drive all version-control work — commits, branches, PRs, stacks, conflict resolution — through the Graphite CLI (`gt`). |
| [using-helm-cli](plugins/cli/skills/using-helm-cli/SKILL.md) | Operate Helm for release management — install/upgrade/rollback/uninstall, chart authoring, values, OCI repos, hooks, and testing. |
| [using-kubectl-cli](plugins/cli/skills/using-kubectl-cli/SKILL.md) | Inspect, query, debug, and change a Kubernetes cluster with kubectl — context/namespace safety, rollouts, debugging, and RBAC. |
| [using-kustomize-cli](plugins/cli/skills/using-kustomize-cli/SKILL.md) | Author and operate Kustomize overlays — bases/overlays/components, patches, generators, transformers, and GitOps pipelines. |
| [using-omlx-cli](plugins/cli/skills/using-omlx-cli/SKILL.md) | Run local LLM inference on Apple Silicon with the omlx CLI — serve models, OpenAI-compatible API, MCP, and memory tuning. |
| [using-terraform-cli](plugins/cli/skills/using-terraform-cli/SKILL.md) | Author and run Terraform/OpenTofu safely — state and backends, version pinning, refactoring, secrets, and CI/CD. |

## `rnd` plugin

Skills:

| Skill | Description |
| --- | --- |
| [designing-architecture](plugins/rnd/skills/designing-architecture/SKILL.md) | Choose and apply a software architecture pattern through a structured decision workflow — requirements/constraints, project sizing, pattern selection, and directory structure. |
| [writing-adr](plugins/rnd/skills/writing-adr/SKILL.md) | Author and manage Architecture Decision Records (ADRs) using MADR 4.0 — record, supersede, and deprecate decisions. |
| [writing-prds](plugins/rnd/skills/writing-prds/SKILL.md) | Author a Product Requirements Document (PRD) through a problem-first guided conversation with SMART metrics and user stories. |

Commands:

| Command | Description |
| --- | --- |
| [`/ae-research`](plugins/rnd/commands/ae-research.md) | Research one ad-hoc topic, or a whole topics file (`@`-prefixed), with the resilient research workflow — saving a cited Markdown report per topic. |
| [`/ae-code-review`](plugins/rnd/commands/ae-code-review.md) | Review the current diff for correctness bugs and reuse/simplification/efficiency cleanups at a chosen effort level (`low`/`medium` inline; `high`/`xhigh`/`max` via the `review` workflow). `--fix` applies findings; `--comment` posts inline PR comments. |

Workflows (invoked by the commands via `scriptPath`):

| Workflow | Description |
| --- | --- |
| [research.js](plugins/rnd/workflows/research.js) | Resilient deep-research — fan-out web searches, fetch sources, adversarially verify claims, synthesize a cited report, with per-task retry on failed/empty agent steps. |
| [research-batch.js](plugins/rnd/workflows/research-batch.js) | Run the resilient research workflow over a to-do list of topics, sequentially, one structured report per topic — failures are captured, never dropped. |
| [review.js](plugins/rnd/workflows/review.js) | Resilient workflow-backed code review — one finder per review angle, an independent verifier per candidate, then a ranked, capped findings report, with per-task retry. |

## Installation

This repository is a [Claude Code plugin marketplace](https://docs.claude.com/en/docs/claude-code/plugins) named `ae-skills`.

Inside Claude Code, add the marketplace and install whichever plugin(s) you want:

```
/plugin marketplace add russelltsherman/ae-skills
/plugin install skills@ae-skills
/plugin install cli@ae-skills
/plugin install rnd@ae-skills
```

The first command registers this GitHub repo as a marketplace; the others install plugins from it. You can also browse and install interactively with `/plugin`.

To update later, refresh the marketplace and reinstall:

```
/plugin marketplace update ae-skills
```

To remove a plugin or the marketplace:

```
/plugin uninstall skills@ae-skills
/plugin uninstall cli@ae-skills
/plugin uninstall rnd@ae-skills
/plugin marketplace remove ae-skills
```

The marketplace manifest lives in [`.claude-plugin/marketplace.json`](.claude-plugin/marketplace.json); the plugin manifests in [`plugins/skills/.claude-plugin/plugin.json`](plugins/skills/.claude-plugin/plugin.json), [`plugins/cli/.claude-plugin/plugin.json`](plugins/cli/.claude-plugin/plugin.json), and [`plugins/rnd/.claude-plugin/plugin.json`](plugins/rnd/.claude-plugin/plugin.json).
