# WF-T008 — Golden BA workflow acceptance

**Prerequisites:** `WF-T002`, `WF-T003`, `WF-T004`, `WF-T005`, `WF-T006`, `WF-T007` COMPLETE.

## Context

Read the full BA coverage matrix, revised requirements and implementation plan. This is a cross-application acceptance task, not a replacement for application phase acceptance.

## Work

Run the linked scenario: import → publish → price request/enquiry → screen/assign → negotiate → confirm → PI → TT hold/re-submit/approve → allocate → Ship OK → ERP checkpoint → document release → customer visibility.

## Tests and acceptance

Run unit, contract, integration and Playwright tests, including invalid transitions, timer expiry, duplicate allocation, wrong-role actions and pre-release document access. Rebuild/redeploy the target Docker stack, perform the manual supervisor walkthrough, record screenshots/results, update the tracker and produce a signed workflow acceptance summary.
