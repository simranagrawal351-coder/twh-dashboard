# Plutonik · TWH Workspace

Private internal planning dashboard for the TWH account, built from the user's brief and reviewed Canva sources.

## Included

- Brand and business brief with the 65% retail / 35% bespoke priority.
- Research records for eight client-named competitors; unresearched fields remain empty.
- Strategy, dependencies, production plans and team allocation.
- 15 proposed core content concepts and 15 proposed trial variants with source links.
- Editable vendor directory, service scope, budget assumptions, document links, decisions and reports.
- D1-backed records, optimistic revision checks and unsaved-draft protection.
- Owner-private Sites access, protected page and API, source-link validation.

The calendar records planning and publishing status; it does not publish to social platforms. Canva and Drive links do not automatically sync. Vendor contacts, dates, final copy, approvals and analytics require real inputs. Commercials remain proposals or rate-card starting prices until agreed.

## Data

`app/data.ts` provides the initial brief. Saved overrides and new records live in D1. Revisions prevent stale writes. Generated schema migrations are in `drizzle/`; do not modify applied migrations.

## Local workflow

Use the Sites plugin workflow for builds and publication. The development server runs on loopback. The starter's local sign-in simulation is documented in `app/chatgpt-auth.ts` and the Sites skill. No development database records are shipped in the deployment archive.

## Validation completed

Type checking and production build; responsive overview and mobile navigation; local authenticated API read/write/reload; stale revision conflicts; invalid links and negative cost rejection; scheduled-date and published-link requirements; UI save; unsaved-draft discard protection; WebMCP valid and invalid record actions.
