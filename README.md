# StockUp

An inventory workbench growing from an undergraduate **Process Analysis and Requirement Engineering** case study. The original requirements and the later software extension are separate editions in this repository.

**[Open the working prototype](https://ahmad-527.github.io/stockup-inventory/)** · [Read the original coursework case study](COURSEWORK.md) · [Research status](docs/flagship/STATUS.json)

## Working workflow prototype · 0.1

Receive stock, find it by SKU/scanner code, record issues and eligible returns, move it between two locations, perform a blind physical count, and review discrepancies before changing balances. Every quantity change has a reference and a movement row. Stock in transit stays separate from available stock. Old count snapshots cannot overwrite later movements.

The interface includes inventory search/filters and item details, saved count sessions, discrepancy review, transfer receipt/return, movement history, atomic catalogue CSV import, stock/movement CSV reports and full JSON backup/restore. Pieces use whole numbers; kilograms support three decimal places. Start with an empty workspace or a clearly fictional sample stockroom.

This is a **browser-local, single-operator research prototype**, developed with Codex assistance. It is not a production warehouse service or a validated flagship. It has no accounts, team permissions, cloud sync, camera scanning, RFID, lot/expiry tracking, purchasing, forecasts or accounting valuation. Use synthetic records while evaluating it. Browser-origin storage and downloaded backups are unencrypted; export backups regularly. Other pages on the same hosting origin may share access to browser storage.

### Run on a PC

Use the [browser preview](https://ahmad-527.github.io/stockup-inventory/) without installation, or use Node.js 22+ locally:

```sh
git clone https://github.com/ahmad-527/stockup-inventory.git
cd stockup-inventory
node scripts/serve.mjs
```

Open `http://127.0.0.1:4174`. The server binds to this computer only. No package installation or API key is needed. Open through HTTP/HTTPS; double-clicking `index.html` is not a supported launch method. This is not an installable/offline PWA. Stock and workspace storage are separate for different browser origins.

```sh
node --test tests/*.test.mjs
node scripts/benchmark-core.mjs
```

See [verification and practical limits](docs/flagship/VERIFICATION.md) before treating test results as assurance. Tests cover stock conservation, precision, conflict/refusal, repeat actions, transfer resolution, import/restore boundaries and the local server. They do not establish operational benefits, complete accessibility, independent security review or real-device usability.

### Why this direction, and what remains

The report's elicitation findings prioritise accurate stock, locations, receiving checks, identification, roles and recovery. Existing inventory apps already support many of these tasks. The current hypothesis is that a smaller, clear count/reconciliation workflow might reduce setup and correction effort for a bounded stockroom job; this advantage is **not yet demonstrated**.

The flagship standard remains **100 relevant peer-reviewed critical appraisals and 20 qualified app workflow benchmarks**, plus comparative practitioner/user validation. Current evidence: **2 focused full-text appraisals**, 346 unreviewed metadata candidates, 4 initial official-source desk profiles, 1 partial read-only comparator walkthrough and **0 complete qualified app benchmarks**. No new user study has been conducted. The shared 200-paper foundation is separate. Do not interpret the running prototype as completion of these gates.

- [Opportunity and contradictory evidence](docs/flagship/OPPORTUNITY.md)
- [Research protocol](docs/flagship/RESEARCH_PROTOCOL.md), [paper appraisals](docs/flagship/PAPER_APPRAISALS.md) and [comparator register](docs/flagship/COMPARATORS.md)
- [Requirements and traceability](docs/flagship/REQUIREMENTS.md), [design directions](docs/flagship/DESIGN.md), [architecture and risks](docs/flagship/ARCHITECTURE_AND_RISKS.md)

## Original coursework edition

The [original case-study tag](https://github.com/ahmad-527/stockup-inventory/tree/coursework-case-study-v1) preserves the first public edition. It contains ten transcribed requirements, twelve use-case tables, the original diagram and clearly labelled later review/acceptance proposals. The author confirmed the interviews and questionnaires were real activities; participating businesses and response-level records are not identified in the supplied report. The original Word files remain unchanged privately, with administrative covers and student identifiers excluded from the public case study.

- [Original requirements](docs/REQUIREMENTS.md), [use cases](docs/USE_CASES.md), [diagram](docs/use-case-diagram-original.png)
- [Source/preparation note](docs/SOURCE_NOTE.md), [later review](docs/REVIEW.md), [original acceptance proposals](docs/ACCEPTANCE_PLAN.md)

Portfolio project: **Ahmad Sajjad Siddiqui**. Later application, tests, research appraisals and documentation were prepared with Codex assistance in October 2026. No blanket licence is granted to historical artifacts. No third-party papers, competitor imagery, private participant records or credentials are bundled.
