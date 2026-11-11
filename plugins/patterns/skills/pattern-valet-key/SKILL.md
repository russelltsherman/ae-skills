---
name: pattern-valet-key
description: Reference for the valet key pattern - what it is, the forces it answers, when it fits and when it doesn't, its costs, the simpler alternative, and what it means for components, contracts and data ownership. Use when letting clients upload or download data directly from storage, or reviewing how a design moves large files.
---

# Valet key

## What it is

Instead of passing data through the application, the application gives the client a short-lived token or signed URL (the **valet key**) granting limited access to one specific resource in storage. The client then reads or writes the storage directly.

## Forces it answers

- **Scalability and cost:** the application does not carry large transfers.
- **Security:** access is narrow, time-limited and revocable.

## When it fits

- Uploads and downloads of files, media and backups.
- Clients that can talk to cloud storage directly.

## When not to use it, and the simpler alternative

- **Simpler alternative:** stream the data through the application, when files are small and traffic is low.
- Skip it when every transfer must be inspected or transformed by the application.

## Costs and risks

- The application loses direct control: validation must happen after upload.
- Token scope and lifetime must be chosen carefully; a leaked key grants access.
- Harder auditing of who accessed what.

## What it means for the design

- Storage becomes a dependency that clients reach directly.
- The contract includes how clients obtain and use keys.
- The application still owns the data; storage holds it on the application's behalf.

## What it leaves to component design

Token scope, expiry, post-upload validation and audit logging.

## Source

- Alex Homer, John Sharp, Larry Brader, Masashi Narumoto and Trent Swanson, *Cloud Design Patterns: Prescriptive Architecture Guidance for Cloud Applications*, Microsoft patterns & practices, 2014, <https://learn.microsoft.com/en-us/previous-versions/msp-n-p/dn568099(v=pandp.10)>, "Valet Key Pattern".
