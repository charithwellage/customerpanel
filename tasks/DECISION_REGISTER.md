# Public Website Decision Register

Only named human authorities may resolve business decisions. Agents record evidence and stop at hard gates; they never infer a formula or policy from the POC.

| Decision ID | Status | Decision | Owner/evidence required | Applies to |
|---|---|---|---|---|
| DEC-PUB-FREIGHT-MODEL | OPEN | Confirm volume formula, rate selection/effective date, currency, insurance, discount sequence and rounding with worked examples. | Finance/logistics owner and approved examples | D01-P05-G001, T001, T002 |
| DEC-PUB-CITY-DELIVERY | OPEN | Confirm whether city delivery is offered, lookup inputs, combination with freight and no-rate behavior. | Logistics owner and approved examples | D01-P05-G001, T001, T002 |
| DEC-PUB-AI-SEARCH | DEFERRED | External AI search is outside Delivery 01; deterministic local parsing is the approved baseline. | Management may reopen with privacy/vendor approval | Phase 1.3 |
| DEC-PUB-FAQ-AI | DEFERRED | FAQ answers remain grounded in approved records; external AI is outside Delivery 01. | Management may reopen with content/vendor approval | Phase 1.7 |
| DEC-PUB-AUTH-BOUNDARY | RESOLVED | Use stand-in JWT demo identities; production identity is excluded. | Architecture plan | Phase 1.1 and 1.6 |
| DEC-PUB-SEO-SCOPE | RESOLVED | Delivery 01 includes semantic routes/basic metadata; full SEO and PUB-24 redirects remain Delivery 4. | Agreed roadmap | Phase 1.1, 1.4, 1.8 |
| DEC-PUB-RESERVATION-EXPIRY-ACTION | OPEN | RULE-05 fixes the default hold at 48 hours; automatic release versus manual release remains unconfirmed. Delivery 01 may expose expiry but must not claim an automatic action. | Sales operations owner | Phase 1.6 and later Sales delivery |

When resolving a row, change only its status to `RESOLVED` and add the named approver, date, decision text and evidence link below this table. Never place secrets or personal credentials here.

## Resolution records

None yet for the two Phase 1.5 hard gates.
