# Architecture, risks and operation

This bounded browser-local prototype tests whether a stock-reconciliation workflow is worth developing. It intentionally does not model a shared authoritative warehouse service.

## Data and transaction boundary

`app/core.mjs` is a pure command/rule engine. Balances are derived from signed movement rows; quantities use safe integers in thousandths. Item unit/SKU cannot change after creation. A transfer dispatch removes available source stock, keeps quantity in transit, and restores it through exactly one full destination receipt or source return. No silent stock overwrite or movement deletion exists through the UI.

`app/storage.mjs` runs read/validate/write inside one IndexedDB read-write transaction. The UI updates saved state only after transaction completion. Expected revision prevents an old tab from overwriting a later write; a new workspace identity on restore also invalidates old forms. Operation IDs support repeat-command idempotence. Per-item/location movement identity protects a count even if intervening movements net to zero. Cancellation preserves count observations; it does not apply them.

JSON restore validates schema, sizes, identities, units, balance replay and transfer/count relationships before replacing records atomically. This detects structural/logical corruption, not a plausible malicious rewrite or authentic authorship. Exports are unencrypted. CSV cells with spreadsheet-formula prefixes are neutralised. The stock CSV is a report; the catalogue template is a different schema; the JSON file is the restorable backup.

## Trust boundary and selected controls

Assets: catalogue, locations, stock history, references and backups. Actors: one operator; another tab sharing origin; another person using the browser profile; malicious imported text/file; a malicious same-origin script or modified app. No authentication or role separation exists. A browser-local ledger is not immutable or tamper proof against developer tools, disk access, extensions or same-origin scripts.

All displayed imported/user strings are escaped. A restrictive CSP disallows remote scripts, connections, objects and forms; no runtime dependencies, remote fonts, analytics or application API calls are used. The loopback development server exposes only app files of known types, validates Host/method/path and sends no-store/nosniff/frame-denial headers. Production GitHub Pages controls its own headers; a meta CSP cannot establish frame-ancestor protection. Do not claim equivalent server-side security controls there.

Use [OWASP ASVS 5.0.0](https://asvs.owasp.org/) as a selection reference for input handling, encoding and storage/threat review; authentication/session/multi-tenant controls are not implemented by this prototype. No ASVS certification/level coverage is claimed. [WCAG 2.2](https://www.w3.org/TR/WCAG22/) AA is a target requiring criterion-level and assistive-technology evaluation, not a completed conformance claim.

**Shared-origin hosting matters:** project paths under one `github.io` host share browser-origin storage. Other same-origin code may access it. Keep public demos synthetic. Browser profile/device access, disk protection and downloaded files are the operator's responsibility. Clearing site data or storage eviction can remove the live workspace. Export copies outside browser storage; no remote recovery or automatic backup exists.

## Further flagship architecture decision

If research establishes a multi-person job, evaluate an authoritative transactional service/database, authenticated roles, count attribution/approval, physical-movement timing, offline conflict resolution, tenant isolation, retention and tested backup operations. The current browser state is not an acceptable shortcut for those requirements. Compare an add-on to an existing inventory platform before building a new service.

## Support, rollback and rights

Self-run research software; no 24/7 service, support contract or availability guarantee. No ongoing paid service was added. GitHub-hosted asset availability is controlled by GitHub. Download backups before upgrades; keep the matching source tag. A future breaking schema change must provide an explicit migration/rollback strategy before release. Current schema is 1; unsupported schemas are rejected.

Original coursework files/tag are preserved separately. Later app/docs/tests are Codex-assisted work for this portfolio. All shipped illustrations/icons are geometric SVG/code created for the extension; sample shop/items are fictional. No competitor assets, raw interview records, student identifiers, private PDFs or remotely hosted models are bundled. No blanket licence is added to the original repository.
