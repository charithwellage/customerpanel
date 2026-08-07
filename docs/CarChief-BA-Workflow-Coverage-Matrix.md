# CarChief BA Workflow Coverage Matrix

**Source:** `/Users/prabodha/Downloads/car_chief_user_journey.json` (draw.io export, reviewed 7 August 2026)

## Evidence and colour limitation

The export contains node labels and directed edges, but no encoded node style, fill or stroke colour. The blue/clear/green ownership classification below therefore follows the BA-provided legend and is provisional until the process owner confirms it. Labels are evidence of the described step; they are not proof that an external integration exists.

| Workflow step | Application/module | Actor | State / target state | BA classification | Manual/external dependency | Current coverage | Required correction / target task | Open decision |
|---|---|---|---|---|---|---|---|---|
| Purchase order and bidding | Upstream procurement | Procurement team | Purchase order → bid | Manual / external | Procurement and auction operations | Missing | Add upstream boundary and fixture only; later integration task | Source of truth and ownership |
| Enter VBMS and update Oracle NetSuite | Upstream systems | Operations team | Procurement record captured | Future integration | VBMS, Oracle NetSuite | Missing | Add integration boundary; exclude from frontend MVP | Integration priority and API ownership |
| Download ERP CSV and upload to CarChief | Salesperson inventory/import | Staff operator | Imported stock pending validation | CarChief + manual | ERP CSV handoff | Partial: Phase 3.3 imports | Add source/reference metadata, preflight and commit result | CSV remains manual for MVP? |
| Auction vehicle and collect auction pictures | Inventory/media | Auction/operations team | Media gathered | Manual / external | Auction website | Partial: Phase 3.2 media | Add manual media source and later adapter task | Automated retrieval required? |
| Upload images to CarChief | Inventory/media | Staff operator | Media attached | CarChief | File handling and storage | Partial: Phase 3.2 | Add categorized media, ordering and visibility rules | File limits, scanning and retention |
| Country manager updates prices and re-uploads CSV | Inventory/pricing | Country manager | Price pending → price ready | CarChief + manual | Spreadsheet exchange | Partial: Phase 3.3 and masters | Add price-readiness and country scope | Authoritative price source |
| Price update completed? | Publication control | Staff operator | Pending → Active/Deactive | CarChief | None | Missing distinction | Add separate lifecycle, sale and publication fields | Meaning of “Now On Sale” |
| Stock displayed on Customer Portal | Customer inventory projection | Customer | Hidden → visible | CarChief | None | Partial: Customer showroom | Add customer/public projection rules | Country visibility |
| Customer can request a price | Public/customer enquiry | Customer/support | Price unavailable → request created | CarChief + support | WhatsApp may be manual | Missing | Add price-request enquiry type and routing | Lead vs negotiation semantics |
| Support screens and assigns country salesperson | Leads/CRM | Customer Support | New → screened → assigned | CarChief + manual | WhatsApp intake may be external | Partial: Phase 3.4 | Add screening and country assignment states | WhatsApp integration or source label only |
| Start negotiation and 48-hour timer | Leads/reservations | Salesperson | Assigned → Under Negotiation | CarChief | Timer authority | Partial: 48-hour reservation only | Add negotiation state/timer separately | Same timer as reservation? |
| Customer confirms or cancels | Negotiation | Customer/salesperson | Under Negotiation → confirmed/cancelled | CarChief | None | Missing | Add confirmation/cancellation transitions | Expiry outcome |
| Create PI and start 72-hour timer | Quotations | Salesperson | Confirmed → Under Negotiation With PI | CarChief | Timer authority | Partial: PI builder | Add PI payment deadline and state | Vehicle hold during PI |
| Create TT and upload proof | Payments | Salesperson/customer | Payment pending | CarChief | Bank statement remains manual | Partial: payment submission | Add creator, proof and resubmission metadata | Who creates TT in each case |
| Finance holds, requests resubmission, approves/rejects | Finance | Finance team | Pending ↔ Held → Approved/Rejected | CarChief + manual | Bank statement/manual verification | Partial: approve/reject | Add hold reason, resubmission and notification intent | Email integration |
| Allocate payment to invoice/vehicle | Finance/allocation | Finance/salesperson | Approved → allocated | CarChief | None | Partial: allocation | Add idempotency and remaining balance | Allocation authority |
| Request and approve Ship OK | Logistics/approval | Salesperson, middle person, finance | Requested → Approved/Rejected | CarChief + ERP | ERP checkpoint | Missing | Add Ship OK task and state machine | Approver roles |
| Initiate IBQ / ERP Ship OK | ERP checkpoint | Middle person/finance | ERP request → approval/rejection | Manual / external | ERP/IBQ | Missing | Add integration/manual checkpoint task | ERP ownership |
| Request and approve document release | Document release | Salesperson, middle person, finance | Requested → Approved | CarChief + ERP | ERP payment/release workflow | Missing | Add release workflow and role checks | Rejection/return path |
| Upload documents and expose to customer | Documents | Middle person/customer | Restricted → released/visible | CarChief | Storage/scanning policy | Partial: document vault | Add approval-gated visibility | Categories, retention and scanning |

## Coverage conclusion

The current documents cover the three applications and the broad customer journey, but they under-specify the upstream stock lifecycle, separate publication states, support screening, the 72-hour PI stage, payment hold/resubmission, Ship OK, ERP checkpoints and document release. These gaps are addressed by the reconciliation plan and must be resolved before the Customer and Salesperson task sets are generated.
