# WF-T005 — Ship OK, ERP checkpoints and document release

**Prerequisite:** `WF-T001` COMPLETE; approver and ERP boundary decisions resolved.

## Context

Read `REQUIREMENT.md` WF-11–WF-14, the Sales 3.6–3.7 and Customer 2.7 phases, and the BA coverage matrix.

## Work

Implement CarChief requests and Finance approvals/rejections for Ship OK and document release, with mandatory rejection reasons, Salesperson portal/email-intent notification and permitted resubmission. Keep ERP/IBQ as explicit manual/external checkpoints. Customer visibility requires Finance-approved release and a server-owned Salesperson `visibleToCustomer` checkbox; upload alone is insufficient.

## Tests and acceptance

Test authorized/unauthorized approval, rejection/return paths, repeated commands, checkpoint evidence, pre-release document denial and post-release visibility. Demonstrate salesperson request → approval → upload → customer vault.
