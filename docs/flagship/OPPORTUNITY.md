# StockUp opportunity decision, 30 October 2026

Status: **research concept with a bounded workflow prototype**. The full flagship programme is not yet justified. This document is later Codex-assisted work, separate from the coursework.

## What the original report actually says

Section 2.1 describes individual and group interviews and a questionnaire. The author confirmed these were real activities. It identifies stakeholder roles (management, IT, developers, auditors, staff, customers and suppliers); it does not identify participating businesses, their industry, sample size or ranked pain points. Do not invent these details or require the author to re-prove ownership.

Section 2.2 compiles four groups of expectations: product information and identification/import/export/units; accurate quantities, locations and low/expired-stock alerts; purchasing, supplier information and verifying received goods; roles, recoverable backups and user activity history. These are reported elicitation findings, not measured adoption or business outcomes. The general introduction covers retail, warehousing, manufacturing and logistics without establishing a first segment.

## Provisional job and audience

Hypothesis: an owner/operator of a small non-regulated goods store or stockroom needs to receive, locate, move, count and correct stock without losing the reason for a quantity change. Start with one operator, two locations and piece/kg items. English is the prototype language. Germany/EU is a provisional research context borrowed from the portfolio's earlier market choice; it has **not** been independently selected for StockUp. No clinical, food-safety, pharmaceutical, accounting or compliance decision is supported.

The problem is credible; demand for a new app is not established. [DeHoratius and Raman (2008)](https://doi.org/10.1287/mnsc.1070.0789) analyse record errors in one retailer. This older single-chain finding cannot supply a present-day SME prevalence estimate or demonstrate StockUp's value. The publisher abstract was examined, not the full study; it is not counted toward the 100-paper requirement.

## Strong alternatives and adverse evidence

The strongest comparison must include an existing inventory product configured well, and a spreadsheet with a movement log and protected formulas. A simpler add-on or counting companion may be more valuable than replacing an inventory system.

- [Odoo 19 physical inventory](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/warehouses_storage/inventory_management/count_products.html) already documents count requests, expected-quantity visibility, history and warnings about intervening moves.
- [Zoho Inventory stock counting](https://www.zoho.com/inventory/help/items/stock-counting.html) documents mobile counting, approval, discrepancies and transaction visibility, with an add-on boundary.
- [Sortly stock counts](https://help.sortly.com/stock-counts) documents staged counting, review, permissions and exports, with plan boundaries.
- [InvenTree](https://inventree.org/demo) provides an open-source inventory alternative and an official public demo.

These official documents directly contradict any claim that counting, approvals, traceability or barcode support would be novel. They do not constitute completed hands-on benchmarks, comparable pricing, independently verified popularity or outcome evidence.

## Falsifiable improvement hypothesis

Test a small, explainable reconciliation workspace: blind entry; a clear expected/counted/difference review; refusal to apply a count when stock moved after its snapshot; correction through explicit movements; and portable records. The possible advantage is reduced setup and correction effort for a bounded job, **not missing competitor functionality**. Benchmark against Odoo and a protected spreadsheet using the same fixtures. Reject the app direction if task completion/error/recovery is no better, if setup savings are immaterial, or if existing configuration meets the need adequately.

Before any product decision, obtain a practitioner assessment of the proposed workflow and the original research context if available. No one has been contacted. No outreach or new user study is authorised by this document.

## What the prototype may establish

It can test data invariants, stale-count refusal, persistence/recovery and a concrete interaction design. It cannot establish real demand, operational accuracy, productivity gains, popularity or superiority. A browser-local single-operator prototype is not a multi-user warehouse service. G1 and G4 remain open; see [research status](STATUS.json).
