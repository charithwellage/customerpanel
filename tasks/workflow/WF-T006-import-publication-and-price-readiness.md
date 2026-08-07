# WF-T006 — Import, media, publication and price readiness

**Prerequisite:** `WF-T001` COMPLETE; source-of-truth and MVP manual-boundary decisions resolved.

## Context

Read `REQUIREMENT.md` WF-01–WF-04 and SALES-10–SALES-20, `FRONT_END_ARCHITECTURE.md` §4, and the BA coverage matrix.

## Work

Implement import preflight, source/reference metadata, categorized media, price readiness, country visibility and Active/Deactive publication controls. Keep VBMS, NetSuite and auction retrieval as manual fixtures or later adapters.

## Tests and acceptance

Test malformed/duplicate/partial imports, media visibility, price-unready requests, country filtering, publication transitions and reset. Demonstrate import → price update → customer/public projection.
