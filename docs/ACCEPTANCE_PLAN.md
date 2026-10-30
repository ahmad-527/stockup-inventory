# StockUp Proposed Acceptance Plan

These are later proposals for evaluating a future implementation. **No executable StockUp implementation has been identified in the reviewed collection, and none of these checks is reported as passed.** The traceability CSV links each proposal to a source requirement.

## Stock accounting example

For an agreed whole-item movement policy, start with zero stock at two locations. Receive 10 items at A, issue 3, accept 2 restockable returns, then complete a transfer of 4 from A to B. Expected final balances are A = 5 and B = 4, with a total of 9. The example assumes accepted returns are eligible for available stock; damaged/quarantined returns require a separate policy. This is a proposed test oracle, not an executed application result.

## Required scenarios

- Item creation, correction, identity collisions and deactivation/history policy.
- Receipts, issues, returns and adjustments, including invalid quantities and repeated submissions.
- Transfer dispatch/receipt, cancellation and interruption, preserving quantity across locations.
- Physical-count reconciliation distinguished from the log of user changes.
- Administrator, manager, employee and warehouse-role permission boundaries.
- Threshold boundaries and repeated alert handling; no automatic supplier order without an explicit purchasing policy.
- Unknown/missing dates, lot/serial identity and the chosen expiry interpretation.
- Bulk import validation, partial failure/recovery, duplicates, units and safe export content.
- Search/filter correctness, empty/error states and workload-specific response targets.
- Backup restore from an independent copy, concurrent edits and recovery after interruption.

## Measurements to define

Choose a target user/workload, item/location/movement volumes, supported devices, task time/error goals, latency percentiles, recovery point/time, retention and access requirements. Numerical targets remain open until there is a justified context; they are not taken from unsupported performance wording in the original report.
