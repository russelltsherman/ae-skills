---
name: pattern-static-content-hosting
description: Reference for the static content hosting architecture pattern - what it is, the forces it answers, when it fits and when it doesn't, its costs, the simpler alternative, and what it means for components, contracts and data ownership. Use when weighing static content hosting or a CDN, or reviewing a design that uses it.
---

# Static content hosting

## What it is

Content that rarely changes, such as images, scripts, stylesheets, documents and whole static pages, is served from object storage or a content delivery network instead of by the application servers. The application serves only dynamic content, and pages reference the static assets by URL.

## Forces it answers

- **Page load latency**, by serving assets from locations close to users.
- **Lower load and cost** on application servers.
- **Availability** of static content even when the dynamic application is degraded.

## When it fits

- Web and mobile applications with significant static assets or media.
- Sites that are mostly static, which can be served entirely from storage.
- Users spread over many regions.

## When not to use it, and the simpler alternative

- **Simpler alternative:** let the application server serve its own static files with good cache headers.
- Skip it for internal tools with few users in one place, and for content that changes per user or per request.

## Costs and risks

- Cache invalidation: stale assets after a deploy unless files are versioned by name or hash.
- Data consistency between the application and the assets it references during deploys.
- Another service to configure, secure and pay for, with possible storage and egress costs.

## What it means for the design

- A static hosting component or platform service beside the application.
- A contract for asset URLs and versioning between the build that publishes assets and the application that references them.
- The build or publishing process owns the assets; the application owns only references to them.

## What it leaves to component design

Asset versioning and naming, cache headers and lifetimes, the publishing step, and access control for private content.

## Source

- Alex Homer, John Sharp, Larry Brader, Masashi Narumoto and Trent Swanson, *Cloud Design Patterns: Prescriptive Architecture Guidance for Cloud Applications*, Microsoft patterns & practices, 2014, <https://learn.microsoft.com/en-us/previous-versions/msp-n-p/dn568099(v=pandp.10)>, "Static Content Hosting Pattern".
