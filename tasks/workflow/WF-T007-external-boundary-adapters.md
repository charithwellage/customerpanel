# WF-T007 — External and manual boundary records

**Prerequisite:** `WF-T001` COMPLETE and `DEC-WF-EXTERNAL-BOUNDARIES` resolved.

## Context

Read the architecture integration-boundary section and the BA coverage matrix. Do not implement live vendors.

## Work

Define provisional checkpoint records and adapter interfaces for VBMS, Oracle NetSuite, auction media, bank verification, email, WhatsApp and ERP/IBQ. Each records pending, acknowledged, failed and manually confirmed outcomes without claiming delivery.

## Tests and acceptance

Contract-test each adapter boundary, secret handling, retries, audit metadata and production mock-disable behavior. Acceptance requires explicit integration ownership and no live vendor dependency in the MVP.
