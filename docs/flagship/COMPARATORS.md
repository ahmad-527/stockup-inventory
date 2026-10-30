# Comparator register

30 October 2026. **0 / 20 qualified complete hands-on benchmarks.** Four products have initial official-source desk research; InvenTree also has one partial read-only demo walkthrough. The remainder are discovery candidates requiring qualification. This is not a top-20 ranking. Comparable popularity, relevant module adoption, current costs and effectiveness remain unestablished.

| Candidate | Role / evidence so far | What remains |
|---|---|---|
| Odoo Inventory | Direct; [19.0 count documentation](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/warehouses_storage/inventory_management/count_products.html) read | Actual scenario, tier, adoption, recovery/export/accessibility |
| Zoho Inventory | Direct; [stock-count documentation](https://www.zoho.com/inventory/help/items/stock-counting.html) read | Same; examine web/mobile handoff and add-on constraints |
| Sortly | Direct; [stock-count documentation](https://help.sortly.com/stock-counts) read | Same; inspect plan-dependent access without assuming a gap |
| InvenTree | Direct/adjacent stockroom; [official demo](https://inventree.org/demo) and partial walkthrough below | Full write/count/recovery tasks; popularity/effectiveness |
| inFlow Inventory | Proposed direct candidate | Qualify category/market/adoption, sources and actual flows |
| Cin7 Core | Proposed direct candidate | Same |
| Cin7 Omni | Proposed direct candidate, potentially overlapping vendor | Establish distinct qualified product/workflow, avoid duplicate padding |
| Unleashed | Proposed direct candidate | Qualify category/market/adoption, sources and actual flows |
| Finale Inventory | Proposed direct candidate | Same |
| Fishbowl | Proposed direct/adjacent candidate | Same |
| ERPNext stock module | Proposed direct/adjacent baseline | Same; suite adoption is not module usage |
| Dolibarr stock module | Proposed adjacent baseline | Same |
| Katana | Proposed manufacturing-adjacent candidate | Relevance to first segment must earn inclusion |
| MRPeasy | Proposed manufacturing-adjacent candidate | Same |
| Microsoft Dynamics 365 Business Central | Proposed suite baseline | Same; do not infer module popularity from suite totals |
| Oracle NetSuite inventory | Proposed suite baseline, also named in coursework | Verify current suitability/costs; historical report is not evidence |
| SAP Business One inventory | Proposed suite baseline | Qualify access, relevant adoption and actual task equivalence |
| Shopify inventory | Proposed retail-adjacent baseline | Qualify task equivalence and platform dependency |
| Square inventory | Proposed retail-adjacent baseline | Qualify region and task equivalence |
| Lightspeed Retail inventory | Proposed retail-adjacent baseline | Qualify region and task equivalence |

The strongest feasible comparison also includes a protected spreadsheet with an append-only movement log. It does not fill the app quota automatically. Adjacent candidates that fail relevance must be replaced, not counted to reach twenty.

## InvenTree partial observation

- Official hosted demo; 30 October 2026, English, desktop in-app Chromium browser. Login page displayed **1.7.0 dev | 567**. This development demo is not a pinned stable release.
- Used the publicly documented **reader** role. No production/customer records uploaded; no account created or terms accepted; no database mutations performed.
- Completed sign-in, Dashboard → Stock → Stock Locations → Stock Items, and entered a search term. Locations and stock table exposed hierarchical paths, batch/status, stocktake date, column/filter/export controls and pagination. An empty-state message appeared while records loaded; wait for settled data before making absence claims.
- Visual/interaction observation: dense tabbed data tools; controls include technical accessible names such as `table-search-input`. A read-only role makes viewing accessible while intentionally restricting changes. This does not establish how an editor's essential tasks perform.
- Not completed: receiving/issuing, blind count, intervening movement, approval, transfer resolution, restart/export-byte/restore, keyboard/screen-reader/mobile evaluation, timed comparison or independent user assessment.
- Consequence: treat as **partial**, with no credit toward twenty complete benchmarks. No measured StockUp advantage follows from this walkthrough.
