# Plutonik · TWH Workspace

Private internal planning dashboard for the TWH account, built from the user's brief and reviewed Canva sources.

## Included

- Brand and business brief with the 65% retail / 35% bespoke priority.
- Research records for eight client-named competitors; unresearched fields remain empty.
- Grouped navigation: Workspace, Brand, Plan, Create, Manage and Internal.
- Overview aggregates inputs, decisions, actions, blockers, upcoming dates and confirmed decisions across workstreams.
- Separate Strategy and Launch destinations, with positioning, audience, messaging and opportunity tabs inside Strategy.
- Production plans, an asset register linked to content, and team allocation.
- 15 proposed core content concepts and 15 proposed trial variants with source links.
- Editable vendor directory, service scope, budget assumptions, document links, decisions and reports.
- D1-backed records, optimistic revision checks and unsaved-draft protection.
- Owner-private Sites access, protected page and API, source-link validation.
- Personal Private Planning notes, filtered and write-protected by authenticated account identity on the server. These notes never enter Overview. Other sections follow site access; this does not implement agency/client role permissions for the rest of the workspace.

The calendar records planning and publishing status; it does not publish to social platforms. Canva and Drive links do not automatically sync. Vendor contacts, dates, final copy, approvals and analytics require real inputs. Commercials remain proposals or rate-card starting prices until agreed.

## Data

`app/data.ts` provides the initial brief. Saved overrides and new records live in D1. Revisions prevent stale writes. Generated schema migrations are in `drizzle/`; do not modify applied migrations.

`app/workflow.ts` assigns existing brief records to workstreams without overwriting saved values. Linked decisions replace their related requirement in the attention count; completed and archived items remain accessible in workstream history. Old combined-section hash links resolve to the corresponding new destination.

## Local workflow

Use the Sites plugin workflow for builds and publication. The development server runs on loopback. The starter's local sign-in simulation is documented in `app/chatgpt-auth.ts` and the Sites skill. No development database records are shipped in the deployment archive.

## Validation completed

Type checking and production build; responsive overview and mobile navigation; local authenticated API read/write/reload; stale revision conflicts; invalid links and negative cost rejection; scheduled-date and published-link requirements; UI save; unsaved-draft discard protection; WebMCP valid and invalid record actions.

For the workstream revision: five workflow tests cover attention aggregation, duplicate requirements, resolved/archived work and private-note exclusion. Local API checks verify asset/launch/decision/private-note persistence, date and workstream validation, and rejection of reads and writes to another account's private notes. Browser checks cover the separate Strategy destination, Overview decision links and uninterrupted file search.
