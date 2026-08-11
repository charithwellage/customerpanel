# CarChief BA Workflow Coverage Matrix

**Sources:** `/Users/prabodha/Downloads/car_chief_user_journey.json` and `/Users/prabodha/Downloads/ccc_current_user_journey.jpg` (BA workflow evidence, reconciled 11 August 2026)

## Evidence and colour limitation

The JSON export contains node labels and directed edges but not machine-readable node colour. The supplied JPEG and BA legend confirm the interpretation used here: **blue = CarChief UI**, **clear = current manual operation**, and **green = current external/ERP/IBQ operation**. Labels are evidence of the described step; they are not proof that a live integration exists.

| Workflow step | Application/module | Actor | State / target state | BA classification | Manual/external dependency | Current coverage | Required correction / target task | Open decision |
|---|---|---|---|---|---|---|---|---|
| Purchase order and bidding | Upstream procurement | Procurement team | Purchase order → bid | Manual / external | Procurement and auction operations | Missing | Add upstream boundary and fixture only; later integration task | Source of truth and ownership |
| Enter VBMS and update Oracle NetSuite | Upstream systems | Operations team | Procurement record captured | Future integration | VBMS, Oracle NetSuite | Missing | Add integration boundary; exclude from frontend MVP | Integration priority and API ownership |
| Download ERP CSV and upload to CarChief | Salesperson inventory/import | Staff operator | Imported stock pending validation | CarChief + manual | ERP CSV handoff | Partial: Phase 3.3 imports | Add source/reference metadata, preflight and commit result | CSV remains manual for MVP? |
| Auction vehicle and collect auction pictures | Inventory/media | Auction/operations team | Media gathered | Manual / external | Auction website | Partial: Phase 3.2 media | Add manual media source and later adapter task | Automated retrieval required? |
| Upload images to CarChief | Inventory/media | Staff operator | Media attached | CarChief | File handling and storage | Partial: Phase 3.2 | Add categorized media, ordering and visibility rules | File limits, scanning and retention |
| Country manager updates prices and re-uploads CSV | Inventory/pricing | Country manager | Price pending → price ready | CarChief + manual | Spreadsheet exchange | Partial: Phase 3.3 and masters | Add price-readiness and country scope | Authoritative price source |
| Price update completed? | Publication control | Staff operator | Pending → Active/Deactive; separate Now On Sale | CarChief | None | Partial | Keep `Active` and `Now On Sale` distinct; model price readiness/country visibility | Final country policy remains open |
| Stock displayed on Customer Portal | Customer inventory projection | Customer | Hidden → visible | CarChief | None | Partial: Customer showroom | Add customer/public projection rules | Country visibility |
| Customer can request a price | Public/customer enquiry | Customer/support | Price unavailable → normal lead | CarChief + support | WhatsApp may be manual | Corrected | Route to normal lead with routing metadata | Country policy remains open |
| Support screens and assigns country salesperson | Leads/CRM | Customer Support | New → screened → assigned | CarChief + manual | WhatsApp intake may be external | Partial: Phase 3.4 | Add screening and country assignment states | WhatsApp integration or source label only |
| Start negotiation and 48-hour timer | Leads/reservations | Salesperson | Assigned → Under Negotiation | CarChief | Server timer authority | Corrected | Same exclusive 48-hour reservation hold; expiry → Now On Sale | None |
| Customer confirms or cancels | Negotiation | Customer/salesperson | Under Negotiation → confirmed/cancelled | CarChief | None | Partial | Add confirmation/cancellation transitions; expiry releases to Now On Sale | Cancellation reason policy remains open |
| Create PI and start 72-hour timer | Quotations | Salesperson | Confirmed → Under Negotiation With PI | CarChief | Server timer authority | Corrected | Vehicle stays reserved for 72 hours; expiry → Now On Sale | None |
| Create TT and upload proof | Payments | Salesperson/customer | Payment pending | CarChief | Bank statement remains manual | Partial: payment submission | Add creator, proof and resubmission metadata | Who creates TT in each case |
| Finance holds, requests resubmission, approves/rejects | Finance | Finance team | Pending ↔ Held → Approved/Rejected | CarChief + manual | Bank statement/manual verification | Corrected | Hold reason, resubmission, idempotent allocation and mock email outbox; AutoPulse email later | Second-payment rules remain open |
| Allocate payment to invoice/vehicle | Finance/allocation | Finance/salesperson | Approved → allocated | CarChief | None | Partial: allocation | Add idempotency and remaining balance | Allocation authority |
| Request and approve Ship OK | Logistics/approval | Salesperson, Finance | Requested → Approved/Rejected | CarChief + ERP | ERP checkpoint | Corrected | Finance approval/rejection requires reason; notify Salesperson and permit resubmission | ERP return details remain open |
| Initiate IBQ / ERP Ship OK | ERP checkpoint | Middle person/finance | ERP request → approval/rejection | Manual / external | ERP/IBQ | Missing | Add integration/manual checkpoint task | ERP ownership |
| Request and approve document release | Document release | Salesperson, Finance | Requested → Approved/Rejected | CarChief + ERP | ERP payment/release workflow | Corrected | Finance rejection requires reason; notify/resubmit; ERP remains checkpoint | ERP return details remain open |
| Upload documents and expose to customer | Documents | Salesperson/Finance/customer | Restricted → released/visible | CarChief | Storage/scanning policy | Corrected | Require Finance-approved release and server `visibleToCustomer`; uploader role alone is insufficient | Categories, retention, file limits and scanning |

## Coverage conclusion

The confirmed workflow rules now map to Customer Delivery 02 and the future Salesperson workflow backlog. AutoPulse/Keycloak is the production backend/identity authority; the Mock API incrementally demonstrates only the required API, outbox and transition behavior until AutoPulse is available. Remaining decisions are limited to final document repository policy, country/publication rules, second-payment behaviour and live external/ERP details.
