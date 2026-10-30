# Prototype verification, 30 October 2026

Scope: later Codex-assisted working prototype, **not a verified full flagship release candidate**. One agent implemented and checked it; no independent code review, practitioner study or user validation has occurred.

## Automated checks observed

**20 domain/import/recovery tests and 1 loopback-server test passed.** Node v24.22.1 on Windows. The server test initially hit a sandbox `EACCES` connecting to its own loopback port; it passed when rerun with local network access. That environment failure was not treated as a product defect. CI separately runs the suite on Node 22/Linux; consult the actual workflow result for the published revision.

Tests include exact fractional/whole quantities and limits; the independently derived 10−3+2 stock oracle; conservation during dispatch/receipt; source return and repeated resolution; negative-stock rollback; repeat-operation idempotence; stale revisions; explicit zero/incomplete counts; reasoned adjustments; net-zero intervening moves; unrelated-location changes; cancellation; all-or-nothing imports; quoted CSV including Windows line endings; formula-prefix neutralisation; backup round trips; invalid schema/units/stock/relationships; count snapshot consistency; fixed SKU/unit; and local server Host/method/path boundaries.

[Warm core lab measurements](PERFORMANCE.json): 1,000 items/10,000 movements, 21 samples per operation. Count-start p95 218.89ms; restore validation p95 74.28ms on the recorded development CPU. Both are below the proposed 500ms core budget. These are not browser/IndexedDB timings, real-device budgets, Core Web Vitals or field percentiles.

## Actual browser journeys observed

Chromium in-app browser; synthetic records only. These were UI actions through the real IndexedDB adapter, not direct injection into application state.

| Journey | Observed result |
|---|---|
| First use | Sample stockroom opened with 12 fictional items; independent empty origin opened with no records |
| Add/search/scanner code | Added QA-001; exact barcode search + Enter opened its details |
| Receipt/error/correction | Received 10; attempted issue of 11 rejected without losing input; corrected issue of 3 left 7 |
| Eligible return/transfer | Returned 2; dispatched 4; destination did not gain stock until full receipt; details then showed shop 5 / stockroom 4 / transit 0 |
| Draft count/restart | Incomplete review rejected; saved one observation, reloaded, resumed with that observation and other lines still missing |
| Unsaved-entry guard | Navigation opened a warning; Keep editing preserved entry; no automatic discard |
| Count review/apply | Entered all 13 counts, including explicit zero and kg decimals; expected/count/difference reviewed; one-piece discrepancy produced an adjustment with reason and retained receipt/history |
| Count vs newer movement | A second tab received stock after snapshot; old-tab apply rejected; after reload the count displayed the conflict and Apply was disabled; cancellation retained history |
| Stale-form recovery | A metadata change in a second tab invalidated an open movement form. Submit was refused and input retained. A missing refresh action was found, repaired and retested; explicit Close form and refresh worked. Rejected reference was absent from exported history |
| Backup bytes | Actual downloaded JSON: 21,462 bytes, SHA-256 `e238a1b43df88c37ff1d93e7ac8dda7c2e9443ed5b6ddf0e5351f7f19932ce68`; parsed/validated 13 items, 41 movements, applied/cancelled count sessions and shop 5 / stockroom 4 |
| Clean-origin restore | Uploaded that downloaded JSON into an empty `localhost` origin separate from the original `127.0.0.1` origin; inspected summary, confirmed replacement, restored; item details and history retained expected stock and adjustment/receipt references |
| Catalogue import | Pasted two rows with a duplicate existing SKU; full batch rejected and first row absent afterward. Retried a valid row successfully. Literal HTML-like item text remained text in preview and inventory |
| Responsive page layouts | Six screens at requested widths 360/768/1440: 18 checks without page-level horizontal overflow. Actual widths were 345, 753/768 and 1425/1440px with scrollbars. A compact overview table was refined and rechecked at 303px client/scroll width |
| Narrow form and keyboard | Movement dialog 322px client/scroll width at 345px page width; Tab reached its labelled item select; Escape closed it and restored focus to Record movement |
| Console | No captured warning/error entries in the checked final local journeys |

The browser's file-picker/download tooling had unusually long waits. A successful tool result was followed by checking the actual backup bytes and restored UI; the wait duration is not an application performance result. The CSV export button was exercised, and pure CSV content/escaping has tests, but **the browser-delivered CSV file bytes were not verified**. The pasted CSV route exercises the shared parsing/import/commit path; the CSV file-picker variant was not separately completed. Do not count those missing checks as passed.

## Remaining verification and product gates

G1 is open: 2/100 focused product paper appraisals; 0/20 qualified complete comparator benchmarks. G2's flagship segment, comparative designs, complete domain/role model and device budgets are open. The prototype covers a bounded functional subset; G3's full acceptance matrix remains open. G4 has zero practitioner/user participants. Candidate publication is not G5 validation or production support.

No complete WCAG criterion audit, automated accessibility audit, screen reader, 200%/400% zoom evaluation, real phone/scanner, non-Chromium browser, denied/quota-exhausted storage exercise, interrupted disk-write recovery, CSV downloaded-byte check, hostile full security audit, long-running workload, real warehouse use, multi-operator service or offline reload/install validation is claimed. No one was contacted and no external account, subscription or paid API was added.

The original coursework tag, original diagram and private Word hashes must remain unchanged at publication. Public artifacts must be allowlisted and checked for private paths, identifiers, secrets and unintended files. See the repository's current source tag and CI rather than interpreting this document as proof about future revisions.
