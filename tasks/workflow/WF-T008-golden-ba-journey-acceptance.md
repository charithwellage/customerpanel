# WF-T008 — Golden BA workflow acceptance

**Prerequisites:** `WF-T002`, `WF-T003`, `WF-T004`, `WF-T005`, `WF-T006`, `WF-T007` COMPLETE.

## Context

Read the full BA coverage matrix, revised requirements and implementation plan. This is a cross-application acceptance task, not a replacement for application phase acceptance.

## Work

Run the linked scenario: import → publish → normal-lead price request/enquiry → screen/assign → negotiate/48-hour exclusive hold → confirm → PI/72-hour reserved window → TT hold/re-submit/approve → allocate → Finance Ship OK → ERP checkpoint → Finance document release → `visibleToCustomer` → customer visibility. Include both timer-expiry release paths.

## Tests and acceptance

Run unit, contract, integration and Playwright tests, including invalid transitions, both timer expiry paths, duplicate allocation, wrong-role actions, held payment without reason, rejection reason/resubmission, mock email-outbox events, and pre-release or `visibleToCustomer=false` document access. Rebuild/redeploy the target Docker stack, perform the manual supervisor walkthrough, record screenshots/results, update the tracker and produce a signed workflow acceptance summary.

Also verify that each application remains installable, presents an offline shell, clears user-scoped caches on logout and blocks all finance/approval/document mutations while offline.
