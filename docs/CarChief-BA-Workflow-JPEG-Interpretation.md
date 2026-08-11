# CarChief BA Workflow JPEG Interpretation

**Source:** `/Users/prabodha/Downloads/ccc_current_user_journey.jpg`  
**Confirmed:** Business-owner clarification, 11 August 2026

The JPEG resolves the colour limitation in the earlier draw.io JSON export:

- **Blue:** CarChief application command, screen or status.
- **Clear/black:** Manual business activity.
- **Green:** External ERP/IBQ operation or checkpoint.

## Confirmed ownership

| Workflow area | CarChief responsibility | Manual/external boundary |
|---|---|---|
| Stock and pricing | Import stock/images, validate CSV, publish to customer projections, manage `Active` and `Now On Sale`, create a normal lead from a price request | Procurement, bidding, VBMS, auction image collection; ERP/NetSuite remains external |
| Negotiation | Start `Under Negotiation`, enforce the exclusive 48-hour reservation hold, release to `Now On Sale` on expiry | Support receives/screens WhatsApp enquiries and assigns country salesperson |
| PI and payment | Create PI, set `Under Negotiation With PI`, enforce the 72-hour hold, accept TT proof, hold/re-submit/approve/allocate payment | Customer pays bank; Finance manually checks bank statement |
| Notifications | Record deterministic Mock API outbox evidence now; AutoPulse sends real email later | Browser never sends or claims direct email delivery |
| Ship OK | Salesperson requests; Finance approves/rejects with a required reason; notify and permit resubmission | ERP/IBQ initiation and Finance ERP approval/rejection are external/manual checkpoints |
| Document release | Salesperson requests; Finance approves/rejects with reason; server exposes documents only after `visibleToCustomer` is enabled | ERP document-release steps remain external/manual checkpoints |

## Confirmed state rules

- `Active` and `Now On Sale` are independent vehicle fields.
- A price request creates a normal lead.
- The 48-hour negotiation timer is the reservation hold; expiry releases the vehicle to `Now On Sale`.
- The PI stage is `Under Negotiation With PI`; its 72-hour expiry releases the vehicle to `Now On Sale`.
- Finance approves/rejects Ship OK and document release in the future Salesperson Application.
- Finance rejection requires a reason and triggers Salesperson portal plus email notification; resubmission is allowed.
- Customer visibility requires both Finance-approved document release and the server-authoritative `visibleToCustomer` value. The future Salesperson Application owns that setting.

## Still open

- Document categories, file types, size limits, retention, storage, scanning and preview/download policy.
- Dashboard balance, credit-utilisation and count definitions.
- Detailed AutoPulse payloads and external ERP/IBQ adapter contracts.
- Country-specific price-ready visibility policy beyond the confirmed normal-lead price request behavior.
