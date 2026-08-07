# Public Website Decision Register

Only named human authorities may resolve business decisions. Agents record evidence and stop at hard gates; they never infer a formula or policy from the POC.

| Decision ID | Status | Decision | Owner/evidence required | Applies to |
|---|---|---|---|---|
| DEC-PUB-FREIGHT-MODEL | OPEN | Confirm volume formula, rate selection/effective date, currency, insurance, discount sequence and rounding with worked examples. | Finance/logistics owner and approved examples | D01-P05-G001, T001, T002 |
| DEC-PUB-CITY-DELIVERY | OPEN | Confirm whether city delivery is offered, lookup inputs, combination with freight and no-rate behavior. | Logistics owner and approved examples | D01-P05-G001, T001, T002 |
| DEC-PUB-AI-SEARCH | DEFERRED | External AI search is outside Delivery 01; deterministic local parsing is the approved baseline. | Management may reopen with privacy/vendor approval | Phase 1.3 |
| DEC-PUB-FAQ-AI | DEFERRED | FAQ answers remain grounded in approved records; external AI is outside Delivery 01. | Management may reopen with content/vendor approval | Phase 1.7 |
| DEC-PUB-AUTH-BOUNDARY | RESOLVED | Use stand-in JWT demo identities; production identity is excluded. | Architecture plan | Phase 1.1 and 1.6 |
| DEC-PUB-SEO-SCOPE | RESOLVED | Complete public SEO, including PUB-24 redirects, is part of Delivery 01 Phase 1.8. Private applications remain protected from indexing; no separate SEO delivery exists. | Agreed roadmap | Phase 1.1, 1.4, 1.8 |
| DEC-PUB-RESERVATION-EXPIRY-ACTION | OPEN | RULE-05 fixes the default hold at 48 hours; automatic release versus manual release remains unconfirmed. Delivery 01 may expose expiry but must not claim an automatic action. | Sales operations owner | Phase 1.6 and later Sales delivery |
| DEC-WF-COLOUR-OWNERSHIP | OPEN | The draw.io JSON has no encoded colours. Confirm which nodes are CarChief UI, manual operation or future third-party integration. | BA/process owner | Before Customer/Salesperson task generation |
| DEC-WF-TIMER-SEMANTICS | OPEN | Confirm whether the BA negotiation 48-hour timer is the same as the reservation hold, and define both expiry outcomes. | Sales operations owner | Customer/Salesperson workflow |
| DEC-WF-PI-PAYMENT-WINDOW | OPEN | Confirm the 72-hour PI payment deadline, vehicle-hold behavior and expiry/cancellation transition. | Sales/finance owner | PI and payment phases |
| DEC-WF-PUBLICATION-PRICE | OPEN | Confirm Active/Deactive/Now On Sale meanings, country visibility before price readiness and price-request routing. | Product and country managers | Public and inventory phases |
| DEC-WF-EXTERNAL-BOUNDARIES | OPEN | Confirm which CSV, VBMS, NetSuite, auction media, bank verification, email, WhatsApp and ERP/IBQ steps remain manual for MVP. | Management and integration owners | All application deliveries |
| DEC-WF-SHIP-DOC-APPROVAL | OPEN | Confirm Ship OK/document-release approvers, rejection paths, second payment behavior and customer-visible status names. | Finance/logistics owner | Salesperson and Customer acceptance |

When resolving a row, change only its status to `RESOLVED` and add the named approver, date, decision text and evidence link below this table. Never place secrets or personal credentials here.

## Resolution records

None yet for the two Phase 1.5 hard gates or the six BA workflow gates. Customer/Salesperson workflow implementation remains blocked until the relevant `DEC-WF-*` decisions are resolved.
