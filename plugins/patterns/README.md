# patterns

Reference skills for well-known software architecture patterns. Each `pattern-*` skill describes one pattern the same way, so an agent can weigh patterns against each other and against simpler alternatives instead of reaching for whatever is fashionable.

## Install

From the `ae-skills` marketplace:

```
/plugin marketplace add russelltsherman/ae-skills
/plugin install patterns@ae-skills
```

## Using the skills

The skills are model-invocable: Claude loads one when a design question calls for it, such as "should this be microservices?" or "review this event-driven design". You can also call one directly, for example `/patterns:pattern-saga`.

They are written to work in any project. The [`blueprint`](../blueprint/) plugin builds on them: its `/hld` skill draws options for significant design choices from the pattern skills, always including the simpler alternative each one names, and reviews the architecture against them. A pattern a `blueprint` project adopts is recorded in its decision record's `patterns:` front matter and in the Patterns section of `ARCHITECTURE.md`.

## What each skill covers

Every skill has the same sections:

1. **What it is**
2. **Forces it answers**: the quality properties it improves
3. **When it fits**
4. **When not to use it, and the simpler alternative**
5. **Costs and risks**
6. **What it means for the design**: the components, contracts and data ownership it implies
7. **What it leaves to component design**
8. **Source**

## Patterns

| Area | Skills |
| --- | --- |
| System structure | `pattern-client-server`, `pattern-layered`, `pattern-modular-monolith`, `pattern-service-based`, `pattern-microservices`, `pattern-microkernel`, `pattern-pipes-and-filters`, `pattern-space-based`, `pattern-serverless`, `pattern-cloud-native`, `pattern-orchestration-driven-soa` |
| Boundaries and integration | `pattern-bounded-context`, `pattern-api-gateway`, `pattern-anti-corruption-layer`, `pattern-sidecar` |
| Inside a component | `pattern-hexagonal`, `pattern-onion`, `pattern-clean-architecture`, `pattern-vertical-slice`, `pattern-mvc` |
| Communication and events | `pattern-event-driven`, `pattern-pub-sub`, `pattern-saga`, `pattern-transactional-outbox`, `pattern-queue-based-load-leveling`, `pattern-priority-queue`, `pattern-claim-check` |
| Data | `pattern-database-per-service`, `pattern-cqrs`, `pattern-event-sourcing`, `pattern-controller-responder`, `pattern-sharding`, `pattern-cache-aside`, `pattern-static-content-hosting`, `pattern-valet-key` |
| Resilience and load | `pattern-retry`, `pattern-circuit-breaker`, `pattern-bulkhead`, `pattern-throttling` |
| Scale and tenancy | `pattern-multi-tenancy`, `pattern-deployment-stamps`, `pattern-geode` |
| Migration | `pattern-strangler` |

## Adding your own

A project can add patterns of its own as skills named `pattern-<name>` in its `.claude/skills/` directory. Use the same eight sections, so they can be compared with the built-in ones, and always name the simpler alternative.

## Sources

Every skill's Source section names its primary source: the publication where the pattern was first named or described, or, where no single originator exists, the earliest authoritative description.

The initial list of fourteen patterns came from Red Hat's [14 software architecture patterns](https://www.redhat.com/en/blog/14-software-architecture-patterns). Most of the cloud patterns trace back to Microsoft's *Cloud Design Patterns* (2014), whose current versions are in the [Azure Architecture Center](https://learn.microsoft.com/azure/architecture/patterns).
