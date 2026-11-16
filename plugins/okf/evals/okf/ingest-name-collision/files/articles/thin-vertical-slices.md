# Thin vertical slices: shipping a feature one sliver at a time

*By Dana Okafor, deliverynotes.example, March 2026*

Most teams I coach plan work in horizontal layers: one ticket for the database schema, one for
the API, one for the UI. Nothing is usable until the last layer lands, so feedback arrives late
and integration problems pile up at the end. Vertical slicing is the alternative: cut each piece
of work as a thin, end-to-end increment that a user can actually exercise, touching every layer
it needs but only as much of each as that increment requires.

## How we slice

A slice should be independently releasable and demonstrable. For a "saved searches" feature,
the first slice might be: save one search with a fixed name, list it, nothing else. Renaming,
sharing and deleting come later as their own slices. We use the INVEST checklist (independent,
negotiable, valuable, estimable, small, testable) as a sanity check, and we split along
workflow steps, business-rule variations or data variations rather than along technical layers.

## What we've seen

On the three teams I worked with over the past year, moving to thin slices shortened the time
from starting a feature to first user feedback, in our estimate from roughly three weeks to under
one. We did not measure this rigorously; it is our teams' experience, and other factors changed
at the same time (we also adopted trunk-based development).

The main cost is up-front thinking: finding a slice that is both tiny and genuinely valuable is
hard, and the first slice often feels embarrassingly small. Teams with strict component
ownership (a "database team", a "frontend team") struggle most, because every slice crosses
their boundaries.

## Open question

I don't yet know how well this works for platform or infrastructure work, where there may be no
user-facing behaviour to slice. If you've tried it, I'd like to hear how it went.
