# Glossary: `blueprint`

Terms used in the project's HLD: [SYSTEM.md](SYSTEM.md), [ARCHITECTURE.md](ARCHITECTURE.md), [ROADMAP.md](ROADMAP.md) and [docs/adr/](docs/adr/).

These terms follow the operator's answers from 2026-11-09 and 2026-11-10: planning documents are living, decision records form an immutable chain, every document carries a status, upper-case names mark agent steering documents, the plan covers one change, LLD is organized by component, every LLD directory names a component in the HLD, which lives in each project root, a repository can hold several nested projects, the lint checks that cited IDs exist and are current, `lld` flags a boundary crossing instead of writing it into the LLD, and two design skills, `hld` and `lld`, cover the two levels with no gates between documents. Terms marked † depend on a question still open in the [open questions](SYSTEM.md#open-questions) of `SYSTEM.md`.

**People and roles**

| Term | Meaning |
| --- | --- |
| Operator | The person who runs the skills and makes every decision. Decides what to work on, in any order. |
| Agent | The model running a skill. Acting as an expert architect and analyst, it reviews documents for gaps and contradictions, interviews the operator until each is settled, then writes to the templates. It proposes options with trade-offs and never settles a decision. |

**Design levels**

| Term | Meaning |
| --- | --- |
| High-level design (HLD) | What the system is made of and why: components, the contracts between them, data ownership, quality targets and decisions. Lives in the project root as `SYSTEM.md`, `ARCHITECTURE.md` and `ROADMAP.md`, with decision records in `docs/adr/`. Every component the LLD designs must be named in it. Covers one project, within one repository †. |
| Low-level design (LLD) | How one component is built: requirements, the design inside the component, the proof for each requirement, and the plan for the change in progress. Lives in `.blueprints/<component>/` in the project root. |
| Project | A directory with its own HLD in its root, where `init` ran. A git repository holds one or more projects. |
| Nested project | A project inside another project. It implements one component `M` of its parent, and its system intent may cite that component. |
| Living document | A document that is edited as the system changes, so once merged it describes the current state of the project. Every `blueprint` planning document is living and carries `status: living`, and git keeps the history. The plan and decision records are the exceptions. |

**HLD documents and IDs**

| Term | ID | Meaning |
| --- | --- | --- |
| System intent | | `SYSTEM.md`. The system's problem, constraints (including what is in scope) and quality targets. |
| System quality target | `SQT` | A measurable property the system must have, such as latency, cost or availability. Should carry a number, but no skill or lint enforces that. |
| System constraint | `SC` | Something the whole design must respect: a goal the system is in scope to achieve, or a limit such as a platform, budget, regulation or existing system. |
| Architecture | | `ARCHITECTURE.md`. The components, the technology the system is built with, the contracts between them, which component owns which data, and where each quality target is met. |
| Component | `M` | A part of the system with a clear boundary and responsibility. Each component has its own LLD directory, and may be a nested project. |
| Contract | `I` | What one component promises another: an API, an event, a schema or a file format. Listed under the component that provides it. |
| Data ownership | | Which single component is the source of truth for a piece of data and may write it. |
| Decision record | `D` | `docs/adr/NNNN-<slug>.md` in the project root, holding decision `D<n>`: file `0003-<slug>.md` is cited as `D3`. An architecture decision record (ADR). One significant choice: the question, at least two real options (one of them the simplest workable option), estimates against the targets, and a proposed solution that becomes the chosen solution when the operator reviews and accepts it. Status `proposed`, `accepted`, `rejected`, `deprecated` or `superseded by D<n>` (the MADR statuses). Never edited once accepted, except to change its status. |
| Supersede | | Replace an accepted decision with a new decision record that names the one it replaces in its `supersedes:` front matter. The old record stays, with its status changed to `superseded by D<n>`, so the records form a chain that shows how each choice changed and why. |
| Simplest workable option | | The least complex option that meets the targets. Every decision record must list it, as a check against over-engineering. |
| Roadmap | | `ROADMAP.md`. The architecture's components grouped by phase, saying what each phase builds for each component and, where it applies, which components must be built first. A component may appear in more than one phase. The LLD does not refer to phases. |
| Phase | | A group of components on the roadmap that are built together, in order. |

**LLD documents and IDs**

| Term | ID | Meaning |
| --- | --- | --- |
| Component intent | | `.blueprints/<component>/INTENT.md`. The whole component's problem, outcome, constraints and quality targets in the operator's words, citing its component `M`. It describes the component as it should be, not the next change or phase. |
| Component quality target | `QT` | A measurable property one component must have. Should carry a number. Cites the system quality target `SQT` it serves, and never loosens it. |
| Constraint | `C` | Something one component must respect, stated by the operator: a goal the component is in scope to achieve, or a limit on it. |
| Open question | | Something the operator has not answered yet. Has no ID, since nothing cites it. Once answered, the answer is written into the document where it belongs and the question is removed. |
| Spec | | The component's `SPEC.md`. Numbered requirements and a design that stays inside the component, including the technology it uses, citing the decisions `D` and system quality targets `SQT` it relies on. |
| Requirement | `R` | A testable statement of what the component must do. Cites the constraints `C` and component quality targets `QT` it serves; every `C` and `QT` is served by at least one requirement. |
| Concern | | An undecided point inside the component that the operator must settle. Has no ID, since nothing cites it. Once settled, the answer is written into the spec's requirements or design and the concern is removed. A boundary crossing is never a concern: `lld` flags it as an HLD change instead. |
| Plan | | The component's `PLAN.md`. One change: only the gap between the spec and proofs and the code, as the files that change, the order of work and the risks. Not living. Status `proposed` until its work is done, then `completed`. Its last step writes lasting lessons where they belong and marks it `completed`. The next plan replaces it. |
| Lasting lesson | | Something learned during a change that stays true after it. A lesson about how the component behaves or is built goes into the spec, and the next plan gives any new requirement its proof; a lesson about how to verify a requirement goes into that requirement's proof in `PROOFS.md`; a lesson that crosses the boundary rule goes to `hld` as a decision. |
| Proofs | | The component's `PROOFS.md`. Living, like the intent and spec: the proof for each requirement of the component as it should be. `lld` updates it before writing each plan, so a proof for work in progress passes once that work is done. |
| Proof | | What shows a requirement is met: a test or command, or a manual check written as steps and the expected result. Every requirement has at least one, in `PROOFS.md`. |
| Change | | One increment of work that ends in merged code. The component's intent and spec are edited to describe it, and a plan is written for it, before the code is written. |

**Rules and checks**

| Term | Meaning |
| --- | --- |
| ID | A prefix plus a number, such as `M3` or `SC2`, that names one item. Each level has its own prefixes (HLD: `SC SQT M I D`, LLD: `C QT R`), so a citation shows which level it points to. IDs are scoped to one project and never renumbered or reused. |
| Withdrawn | An item that no longer applies. It keeps its ID and says it is withdrawn, so the ID is never reused. |
| Citation | A reference to an ID in another document, in the body or in front matter. Citations point downward only: a document cites the level above it. A citation resolves within its own project, except a nested project's citation of its parent component. |
| Boundary rule | The test for whether a change belongs to HLD. A change crosses the boundary if it adds, removes or splits a component, changes a contract, moves data ownership, changes a quality target, or contradicts a decision. |
| Boundary crossing | A component design that breaks the boundary rule. `lld` flags it, names the HLD change needed and keeps it out of the LLD documents; the operator takes it to `hld`. |
| Alignment | Agreement between the agent and the operator on every point a document makes. The design skills seek it before writing; anything still unsettled is recorded as an open question or concern. Nothing is formally approved, and no document gates another. |
| Status | The `status:` front matter key every document carries. Living documents: `living`. The plan: `proposed` or `completed`. Decision records: `proposed`, `accepted`, `rejected`, `deprecated` or `superseded by D<n>` (the MADR statuses). Dates are kept in front matter. |
| Front matter | The flat `key: value` lines at the top of a document, always including `status:`. Tooling parses them without a YAML library. |
| Rules | `.blueprints/_rules/` in the project root. The project's own copy of the templates and naming rules. `init` copies them in, and every skill reads them from there, never from the plugin. |
| Template | The skeleton of headings and front matter that a skill fills in for one document type. One file per type, `.blueprints/_rules/<document>_template.md`, where `<document>` is the name of the file it produces: `SYSTEM_template.md`, `ARCHITECTURE_template.md`, `ROADMAP_template.md`, `INTENT_template.md`, `SPEC_template.md`, `PLAN_template.md`, `PROOFS_template.md`, and `NNNN-ADR_template.md` for decision records, which are written to `docs/adr/NNNN-<slug>.md`. A template is not a steering document. |
| Policy skill | A skill named `policy-*` that `lld` applies to every design, such as a testing or security policy †. |

**Tooling**

| Term | Meaning |
| --- | --- |
| Skill | One `blueprint` command: `/init`, `/hld` or `/lld`. Each design skill covers every document type at its level. |
| Command-only | A skill that only the operator can start (`disable-model-invocation: true`). The model never invokes it on its own. |
| Lint | `lint-docs.sh`. Checks front matter including status, headings, and that every cited ID exists and is not withdrawn or superseded. It makes no model calls and cannot judge whether a design crosses a boundary. |
| `make check` | The offline gate: plugin validation, shellcheck, the lint and the lint's own tests. It makes no model calls and needs no network. |
| `make evals` | Billed evals of the plugin's skills. Kept out of `make check`. |
| Opt-in marker | The file `init` writes so the plugin knows the project uses `blueprint`. |
| Dogfooding | Using `blueprint` to plan `blueprint` itself, starting from `hld`. |
