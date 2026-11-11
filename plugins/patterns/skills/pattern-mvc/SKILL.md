---
name: pattern-mvc
description: Reference for the model-view-controller (MVC) architecture pattern - what it is, the forces it answers, when it fits and when it doesn't, its costs, the simpler alternative, and what it means for components, contracts and data ownership. Use when weighing MVC or reviewing a design that uses it.
---

# Model-view-controller (MVC)

## What it is

An interactive application is split into three roles. The **model** holds the data and the rules about it. The **view** presents the model to the user. The **controller** handles the user's input and turns it into changes to the model. In the original Smalltalk form each view has its own controller, and views update themselves when the model changes. In later web frameworks ("Model 2"), one controller handles a request, updates the model and picks which view to render. Variants include MVP and MVVM.

## Forces it answers

- **Several views of the same data**, such as a web page, an API and a report, without duplicating the rules.
- **Testability** of the rules apart from the user interface.
- **Parallel work** on user interface and logic.

## When it fits

- Interactive applications with a user interface: web applications, desktop and mobile applications.
- Frameworks that already provide MVC structure.

## When not to use it, and the simpler alternative

- **Simpler alternative:** for a small page or tool, keep data and presentation together, or let the framework's default structure stand.
- It is a structure inside one application, not a way to split a system into components; it does not answer distribution, scaling or availability.

## Costs and risks

- The added layers of abstraction add code and indirection for simple screens.
- Controllers or models tend to grow into "fat" classes without discipline.
- Two-way data binding variants can make data flow hard to follow.

## What it means for the design

- Usually inside one component; rarely visible at the architecture level beyond naming the component's style.
- No new contracts between components.
- The model owns the application's data within that component.

## What it leaves to component design

Almost everything: which variant to use, the framework, how views bind to models, and where validation sits.

## Source

- Trygve Reenskaug, "Thing-Model-View-Editor" and "Models-Views-Controllers", Xerox PARC notes, 1979, archived as ["The original MVC reports"](https://hdl.handle.net/10852/9621).
