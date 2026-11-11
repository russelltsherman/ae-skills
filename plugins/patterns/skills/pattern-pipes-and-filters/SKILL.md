---
name: pattern-pipes-and-filters
description: Reference for the pipes and filters (pipeline) architecture pattern - what it is, the forces it answers, when it fits and when it doesn't, its costs, the simpler alternative, and what it means for components, contracts and data ownership. Use when weighing a pipeline or pipes-and-filters design, or reviewing a design that uses one.
---

# Pipes and filters (pipeline)

## What it is

Processing is split into a sequence of independent steps (**filters**), each doing one transformation and passing its output to the next through a **pipe**, such as a stream, queue or file. Filters know nothing about each other, only the data format on their pipes. Steps can be reordered, replaced, reused or run in parallel.

## Forces it answers

- **Reuse and recombination** of processing steps.
- **Independent scaling** of slow steps.
- **Simplicity** of each step, which is easy to test alone.

## When it fits

- Data processing, ETL, media transcoding, compilers, log and event processing.
- Work that is naturally a sequence of transformations on a stream of items.

## When not to use it, and the simpler alternative

- **Simpler alternative:** one program that runs the steps as function calls, when steps never need to be scaled, reused or rearranged separately.
- It fits poorly for interactive request/response work, or when steps need shared state or a lot of back-and-forth.

## Costs and risks

- Overhead of serializing data between steps, especially across processes.
- Error handling and partial failures across a long pipeline need design: retries, dead letters, reprocessing.
- End-to-end latency is the sum of the steps.

## What it means for the design

- Filters may be components, or stages inside one component; the pipe infrastructure may be a component or platform service.
- The data format on each pipe is a contract between adjacent filters.
- Each filter owns only its transformation; the data belongs to the pipeline's source and sink.

## What it leaves to component design

Step boundaries, the pipe technology, batching, back-pressure and error handling.

## Source

- David Garlan and Mary Shaw, ["An Introduction to Software Architecture"](https://www.cs.cmu.edu/afs/cs/project/able/ftp/intro_softarch/intro_softarch.pdf), 1994, and Mary Shaw and David Garlan, *Software Architecture: Perspectives on an Emerging Discipline*, Prentice Hall, 1996.
- Frank Buschmann, Regine Meunier, Hans Rohnert, Peter Sommerlad and Michael Stal, [*Pattern-Oriented Software Architecture, Volume 1: A System of Patterns*](https://www.wiley.com/en-us/Pattern-Oriented+Software+Architecture%2C+Volume+1%2C+A+System+of+Patterns-p-9780471958697), Wiley, 1996, "Pipes and Filters".
