# AI Model and Token Strategy

Use the weakest model that can safely complete the bounded task; capability, not vendor name, is authoritative.

| Tier | Typical models | Suitable work | Mandatory escalation |
|---|---|---|---|
| LOW | Luna/Haiku class | Read-only checks, documentation, static content, presentational components, simple deterministic tests | Any contract, migration, auth, money or cross-feature change |
| BALANCED | Sonnet/Terra class | Normal React slices, hooks, forms, bounded mock endpoints, integration and Playwright work | Unlisted architecture/security/calculation decisions |
| FRONTIER | Codex/Sol/Opus class | Workspace architecture, OpenAPI generation, JWT, Prisma/transactions, calculations, CI and security/release gates | Unresolved business authority still blocks even the strongest model |

## Token controls

- Start from the task file; read only the exact sections, evidence and POC paths named there.
- Use the latest phase summary as prior-phase context instead of rereading every document.
- Keep one execution log per task so a new developer can continue without reconstructing history.
- Run repository search only to verify boundaries and discover direct dependencies; do not load unrelated POC modules.
- Parallelize only stable, non-overlapping owned paths listed in `EXECUTION_ORDER.md`.
- A low-cost agent stops rather than expanding into unlisted OpenAPI, migrations, authentication, finance or shared architecture.
- Human engineers remain responsible for architecture approval, security, finance rules, QA, UAT and task approval.
