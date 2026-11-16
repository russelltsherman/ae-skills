---
type: Entity
title: Shopify
description: E-commerce platform running one of the largest Rails codebases as a monolith with tool-enforced component boundaries.
resource: https://shopify.engineering/
tags: [org, rails, monolith]
aliases: [Shopify]
timestamp: 2026-11-10T00:00:00Z
---

# Summary
Shopify's core is a Rails monolith (1,000+ developers). Rather than split into microservices, it
reorganised the code into domain components and enforced boundaries with Packwerk, making it the
main real-world example of a well-structured [[pattern-monolithic-architecture|monolith]]. Its lesson: a large
monolith's pain comes from missing boundaries, not the single deployable.
