# Plutonik · TWH Workspace

An internal account workspace built from the user’s TWH brief and reviewed Canva decks. The source prompts are preserved verbatim in `docs/brief/`; the expanded calendar requirements are additive.

## Current experience

- Pulse: current account direction, dated upcoming work, open inputs/decisions and actual activity. It uses the same records as the working pages.
- Brand Guidelines: editable chapters, logo upload, colour palette/reordering and font specimens with WOFF2 upload. TWH’s exact approved palette and fonts are not invented.
- Research: market, audience, competitors, trends and reference bank, with observation → interpretation → implication → source. Seeded audience ideas are labelled hypotheses.
- Strategy: narrative direction, readiness gates, measures and an editable six-month roadmap.
- Campaigns & Launches: stages, briefs and links to content, production, assets and services.
- Content, Production and Account calendars: month/week/list/board views; search and filters; actual date edits and native drag/drop; retained dates in the workflow board; configurable list columns, widths and order stored per user.
- Dependency review: moving a dated record identifies affected dates and asks which should move. No downstream dates move by default.
- Assets: real R2 uploads, images/video/PDF previews, YouTube/Vimeo/Drive/Instagram embeds, collections, tags and version relationships. Uploads are limited to 25 MB; larger media uses a source link.
- Scope: proposed/approved fees and service definitions, with progress derived from linked deliverables in the selected cycle. Internal budgets and vendor costs are managed separately.
- Team & Partners, Files, Decisions, Reporting and Internal Management each use a layout suited to their purpose.
- Shared record editor, relationships, duplicate/archive/trash/restore, persistent ordering, global search, feedback and activity history. Clients can respond to shared work awaiting their approval.
- Simran is the confirmed account lead. The intended Google account is `simranagrawal351@gmail.com`.

## Persistence and permissions

D1 holds records, audit history, member permissions, user view preferences and calendar-event mappings. R2 holds uploads. Saved records override the server-only brief seed. Internal seed data is not shipped in the client bundle. Optimistic versions reject stale writes and stale approvals.

The verified Site owner is the administrator. Other identities receive explicit agency/client area assignments. Client records must also be deliberately marked shared; internal sections and sensitive fields are filtered on the server. Personal notes and their discussions are restricted to their owner. Workspace permissions do not change the private Site’s external access list or send invitations.

Contextual calendars derive stable `record-id--date-field` events from a shared date model. Changes propagate to all views, and open workspaces check for other saved edits every 20 seconds. Records and their history are retained when archived or moved to trash.

## Google Calendar: implemented, not yet authorised

The server includes OAuth with PKCE, short-lived single-use state, account-email verification, encrypted refresh tokens, stable event IDs, conditional updates, source-of-truth rules, conflict resolution and explicit deletion choices. API calls operate against the assigned lead’s primary calendar. Workspace edits sync after save when enabled for the record; Google changes are checked while the workspace is open and via **Sync now**.

The connection is currently **not active**. Configure `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` and a random `INTEGRATION_SECRET` of at least 32 characters as server secrets, enable Google’s Calendar API, register the site’s `/api/calendar/callback` address, then have Simran authorise through Integrations. Never commit these secrets. Live Google create/update and two-way sync require that setup and still need a real-account verification run. No external events were created during local testing.

Background webhook/push delivery is not configured. Google changes made while the workspace is closed are reconciled after it is reopened and sync runs. Canva/Drive source links work now; automated Sheets/Excel/Drive imports and source-field mapping are future adapters, not active connections.

## Source and operating boundaries

The 65% retail / 35% bespoke strategy, 15 core pieces and separately scoped 15 trial reels are preserved. Core retainer, rate-card references and optional services remain proposals or starting prices until agreed. Strategy/copy/management costs must be accounted for before the internal remaining balance is treated as profit.

Founder-led production, trade relationships, staged awareness/boosting/performance, website-readiness gates, AI/product accuracy and offline alignment remain in the source-backed seed. Contacts, actual dates, approvals, exact TWH identity assets and reporting results require real inputs.

Scheduling records does not publish to social platforms. External embeds follow their original sharing permissions. File revisions create new uploaded assets and link version records; the history is retained.

## Validation

Type checking and production build pass. Thirteen focused tests cover the shared event model, Sep 22 → Sep 25 rescheduling, dependency detection without mutation, real-date validation, sync conflict rules, calendar metadata, media URL handling, role/private-field restrictions and attention aggregation.

Local authenticated API checks cover campaign/shoot/content creation, persistent rescheduling, unchanged dependent dates, stale-write rejection, pending Google status with a stable mapping, activity, feedback, R2 uploads, byte ranges, authentication, deletion and restore. Temporary QA records are removed separately from user-created work. The Research and Calendar layouts and production editor have been inspected in the existing browser preview.

## Development and release

Use the Sites plugin’s build and publication workflow. Apply generated migrations in order (`drizzle/0000…`, then `0001…`); never edit applied migrations. Local development uses the starter’s sign-in simulation; the production build does not grant that development identity administrator access. Development databases, uploads and secrets are excluded from the release archive.
