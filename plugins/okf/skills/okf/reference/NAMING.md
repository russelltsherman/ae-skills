# Page naming rules

Every wiki page's filename stem is how the vault refers to it: Obsidian resolves `[[stem]]` by
filename across the whole vault, regardless of folder. Names therefore have to be **unique**,
**predictable** (two ingests of related sources reach for the same name) and **stable** (renaming
breaks every link). These rules make the name a function of what the page is, not of how a
source happened to phrase it.

## Shape: `<prefix>-<name>`

The prefix says what kind of thing the page is. It must be one of the prefixes below for the
page's folder. The `title:` stays a free display name ("CQRS (Command Query Responsibility
Segregation)"); the filename is not derived from it.

### Concepts (`concepts/`)
| prefix | for | examples |
|---|---|---|
| `pattern-` | architecture and design patterns: how a system or its code is structured | `pattern-cqrs`, `pattern-hexagonal`, `pattern-vertical-slice`, `pattern-islands` |
| `method-` | development methodologies and practices: how people work, including AI-assisted practice | `method-test-driven-development`, `method-domain-driven-design`, `method-prompt-engineering`, `method-vertical-slicing` |
| `artifact-` | document types a method produces | `artifact-architecture-decision-record`, `artifact-product-requirements-document` |
| `topic-` | anything outside those domains | `topic-particle-accelerator`, `topic-open-knowledge-format` |

AI involvement does not create a category: an AI-assisted way of working is a `method-`, an
AI-specific system structure is a `pattern-`.

### Entities (`entities/`)
| prefix | for | examples |
|---|---|---|
| `person-` | a person, by full name | `person-kent-beck`, `person-eileen-uchitelle` |
| `org-` | a company, team, project body or institution | `org-shopify`, `org-cern` |
| `tool-` | software, a product, framework, library or service | `tool-astro`, `tool-packwerk`, `tool-claude` |
| `place-` | a physical place or facility | `place-large-hadron-collider` |

### Sources (`sources/`)
| prefix | for | name part |
|---|---|---|
| `research-` | an ae-research report | the stem of the concept the report distills: `research-pattern-cqrs` ↔ `pattern-cqrs` |
| `article-` | a web article, blog post, gist or online spec | `<author-or-site>-<short-title>`: `article-karpathy-llm-wiki` |
| `paper-` | an academic paper | `<first-author-surname>-<year>-<short-title>`: `paper-rafique-2013-tdd-meta-analysis` |
| `book-` | a book or book chapter | `<author-surname>-<short-title>`: `book-richards-fundamentals-of-software-architecture` |
| `meeting-` | notes or takeaways from a meeting or review | `<event>-<yyyy-mm-dd>`: `meeting-architecture-review-2026-11-16` |
| `chat-` | takeaways from a chat conversation | `<topic>-<yyyy-mm-dd>` |

A research report that covers no single concept (a survey) takes `research-<topic>` with the
name part built by the rules below. Never name a source page after a research question or a
raw filename.

### Notes (`notes/`)
`note-`, `decision-` or `goal-`, matching the page's `type`: `decision-keep-billing-in-monolith`.

## The name part
1. **Patterns with a canonical name use it exactly.** These come from the `patterns` plugin, so
   a vault page and a pattern skill for the same idea share a name: anti-corruption-layer,
   api-gateway, bounded-context, bulkhead, cache-aside, circuit-breaker, claim-check,
   clean-architecture, client-server, cloud-native, controller-responder, cqrs,
   database-per-service, deployment-stamps, event-driven, event-sourcing, geode, hexagonal,
   layered, microkernel, microservices, modular-monolith, multi-tenancy, mvc, onion,
   orchestration-driven-soa, pipes-and-filters, priority-queue, pub-sub,
   queue-based-load-leveling, retry, saga, serverless, service-based, sharding, sidecar,
   space-based, static-content-hosting, strangler, throttling, transactional-outbox, valet-key,
   vertical-slice. (`pattern-cqrs`, `pattern-event-driven`, `pattern-layered`.)
2. **Otherwise, spell it out.** Use the expanded term, not the acronym:
   `method-test-driven-development`, `pattern-single-page-application`. The acronym goes in
   `aliases:`.
3. **Drop words that only repeat the prefix**: `pattern-hexagonal`, not
   `pattern-hexagonal-architecture`; `method-prompt-engineering` keeps "engineering" because it
   is part of the name, not a restatement of "method". Keep the word if the rest no longer names
   the thing on its own (`pattern-clean-architecture`, `pattern-monolithic-architecture`).
4. **Singular**, unless the term itself is plural (`pattern-microservices`,
   `pattern-react-server-components`).
5. Lowercase ASCII, words joined by single hyphens; no dates except in `meeting-`/`chat-`
   sources and `paper-` years.

## Before creating a page
1. **Look for an existing page first.** Search stems, `title:` and `aliases:` across the vault
   for the idea under any name (acronym, expansion, synonym). If a page exists, extend it and add
   the new phrasing to its `aliases:` rather than create a second page.
2. **Give every new concept and entity page `aliases:`** listing its acronym, expansion and
   common synonyms (`aliases: [CQRS, Command Query Responsibility Segregation]`). Obsidian uses
   them for search and link completion, and the next ingest uses them to find the page.
3. **Make the prefix the first tag**: `tags: [pattern, web, backend]`, `tags: [person, tdd]`.
4. **Only create a page the idea can carry.** A new concept or entity page needs either a
   source that treats it as a distinct idea with substance of its own, or at least two pages
   that would link to it. Otherwise mention it on the page where it comes up. A person known
   only by a first name never gets a page; attribute their view on the page where it appears.
5. **One name, two meanings → two pages.** If a term means different things in different
   categories, each meaning gets its own page under its own prefix.
   - **Aliases:** each page lists only the phrasing that is unambiguously its own
     (`pattern-vertical-slice`: "Vertical slice architecture", "VSA";
     `method-vertical-slicing`: "Vertical slicing", "Thin slices"). The bare shared term
     ("vertical slices") goes on neither, so link suggestions never offer the wrong page under
     the right words. If the first page already lists the bare term, remove it from that page's
     `aliases:` when you create the second page, and say so in the log. Aliases are navigation,
     not claims, so this is not editing another source's content.
   - **Disambiguation link (always):** each page opens with one line naming the other and saying
     how they differ ("Not to be confused with [[pattern-vertical-slice|vertical slice
     architecture]], which organises code by feature."). A reader who arrived by the shared
     words may have wanted the other page; this line is for them and asserts nothing.
   - **Relationship link (only with a source):** if a source says how the two ideas relate
     (one enables or complements the other), add that under Related, citing the source. Don't
     infer a relationship from the shared name.
6. **Never rename during ingest.** An existing page keeps its filename even if it predates
   these rules; renaming touches every link to it and belongs in Lint, after the user agrees.

## Raw copies
Raw copies keep the original filename (see SKILL.md). Pasted text and chat takeaways have no
filename: store them as `raw/<source-page-stem>.txt`, so they don't appear in Obsidian as a
second note with a near-identical name.
