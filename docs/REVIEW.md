# StockUp Later Requirements Review

This review was added during October 2026 portfolio preparation. It is separate from the original coursework and does not imply that these refinements or tests existed in the submission.

## What the coursework demonstrates

The specification connects stock records, inventory operations, roles and business integrations. It includes functional/interface/nonfunctional sections, constraints and assumptions, an original use-case diagram and twelve short use-case tables. The author confirmed that interviews and questionnaires were real elicitation activities. Participant counts, transcripts and response-level data were not supplied for this public case study.

## Decisions needed before an implementation

1. **Choose a bounded operating context.** Retail, wholesale, manufacturing, logistics and multi-warehouse operations have different needs. The original scope covers them broadly; it does not establish which user/job a new product should serve first.
2. **Separate alerts from purchasing.** The report describes both threshold alerts and automatic reordering. Specify the trigger, authorisation and resulting object before treating a threshold breach as an order.
3. **Separate two meanings of audit.** FR-07 calls for user/change history. UC-05 describes reconciling physical and system counts. A future design needs both concepts distinguished, with correction and evidence rules.
4. **Resolve stock identity and movement rules.** Units, quantity precision, lots/serials, locations, returns, adjustments and in-transit transfers need explicit invariants. Source statements do not establish how simultaneous or retried changes are handled.
5. **Make the role model consistent.** The tables name administrators, managers and employees; the diagram shows User, Employee and Administrator. Map the roles and permissions explicitly. A Supplier actor is drawn without a visible association in the supplied figure.
6. **Complete use-case behaviour.** The tables provide an actor and short description, with no detailed preconditions, alternate/error paths or acceptance results. The final unnumbered update case appears to overlap UC-02. Search, transfers and expiry/serial requirements lack dedicated numbered use cases.
7. **Clarify system boundaries.** A central database-update operation dominates the diagram. Separate user goals, internal persistence and external integration contracts in a later design; preserve the original diagram as historical evidence.
8. **Make quality claims testable.** Phrases such as minimal response time, large traffic, robust security and minimal downtime do not identify a workload or acceptance threshold. Define these from actual user and deployment needs. A technology list alone does not specify an application/service boundary.
9. **Treat business benefits as intended outcomes.** The coursework's stockout, cost, integration and forecasting statements are objectives or proposed behaviour. No deployed inventory results, forecast experiment, ERP integration test or measured savings were found in this reviewed package.

## Future product decision

An inventory application is not automatically justified by having a broad specification. Before committing to a flagship, compare current alternatives, identify a meaningful gap for a defined user and validate that gap. The portfolio's shared research foundation does not replace a product-specific review. The required domain-paper and qualified-app research, comparative UI/UX work and user validation have not been completed for StockUp.
