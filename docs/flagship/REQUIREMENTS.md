# Bounded prototype requirements and traceability

Version 0.1, 30 October 2026. This defines a research instrument, not an approved full flagship scope. Targets below are engineering choices pending practitioner validation; they are not empirically established thresholds.

| ID / priority | Source and risk | Implemented boundary | Acceptance |
|---|---|---|---|
| SU-01 must | Original FR-01/05/10; ambiguous item identity | Unique normalised SKU and optional unique scanner code; categories; search/filter; item details; immutable unit/SKU in metadata editing | Duplicate/invalid identity rejected; barcode exact lookup; edits retain movements |
| SU-02 must | FR-02; incorrect/missing quantities | Receive, issue/sale, restockable return, write-off; required reference; no negative available stock | 10−3+2 movement oracle; invalid overissue changes nothing; fix input and retry |
| SU-03 must | FR-03/08; stock appearing at two locations | Two locations, dispatch/in transit/full receipt or full return | A=5, B=0, transit=4 before arrival; A=5, B=4 afterward; repeated resolution refused |
| SU-04 must | UC-05 vs FR-07 ambiguity; P-002 measurement limits | Physical count sessions separate from quantity history; blind entry, explicit zeros, save/resume, review, reason and atomic adjustment | Incomplete entry cannot review; expected/count/difference visible in review; signed quantity shown per unit |
| SU-05 must | Intervening-move risk; Odoo documents the same problem; engineering control | Snapshot version per item/location; stale workspace rejected; count cannot apply after any intervening movement for a counted line | Net-zero issue/return still invalidates snapshot; unrelated location does not; no partial application |
| SU-06 must | FR-09 and section 2.2 backup expectation | Atomic catalogue CSV import; stock/movement CSV export; full JSON backup and explicit replace-on-restore | Duplicates/invalid row reject all; malformed backup refused; verify actual exported bytes and clean-origin restore |
| SU-07 must | FR-04; false purchasing action | Configured global min/target; low/out/above/in-range labels; in-transit excluded from available stock | Boundary tests; labels describe configuration only; no automatic orders or forecasts |
| SU-08 must | Section 2.2 units; floating-point ambiguity | Integer thousandths, pcs whole / kg 3 decimals, max 1,000,000 units at one location | Decimal/boundary tests; no mixed-unit totals or unit conversion |
| SU-09 must | Recovery/usability policies | Invalid forms retained; explicit saved count drafts; unsaved-entry guard/export; actionable stale-write recovery | Browser restart, unsaved navigation, error correction and conflict flows |
| SU-10 must | Privacy/access/rights policies | One operator, browser-origin storage; no telemetry/API/external media; escaped text, CSP; clear storage/backup limits | Inspect requests/storage/export; text injection fixture; no role/auth/team claims |
| SU-11 should | P-001 objective-dependent policy results | Defer automatic count priorities and AI until representative task/data comparison | No fabricated AI recommendations or gains |

## Operating envelope and exclusions

Initial inspection: desktop Chromium; responsive checks at requested 360, 768 and 1440px widths. Actual layout viewport differs with scrollbars. Keyboard and mouse first; real handheld scanners, phone hardware and screen readers need separate testing. English only, no assumed German localisation.

Prototype hard limits: 1,000 catalogue items, 20,000 movement rows, 200 count sessions, 10,000 historical count lines, 3,000 transfers, 30,000 operations, 1 MB catalogue CSV and 12 MB backup JSON. These cap resource exposure; they are not validated service capacities. Initial lab target: ordinary core commands and restore validation under 500ms for a 1,000-item/10,000-row synthetic fixture on the development machine. Browser/field percentiles remain unmeasured.

No accounts, collaborative multi-user access, camera recognition, RFID, arbitrary locations, lot/serial/expiry tracking, damaged/quarantined/reserved stock, partial transfers, purchasing/sales orders, supplier integration, demand forecasting, financial valuation, background sync or installable/offline PWA is implemented. These original wider requirements remain future candidates, not hidden placeholders or advertised completed features.

No deployment benefit, superiority, security certification, WCAG conformance or production-support claim follows from prototype tests. G1/G4 remain open.
