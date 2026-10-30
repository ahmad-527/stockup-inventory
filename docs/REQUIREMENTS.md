# StockUp Requirements

The ten statements below are transcribed from section 4.1 of `Pare Final.docx`. **FR-01 to FR-10 are portfolio review labels added later**, not identifiers supplied in the original report. Original wording is preserved, including its imprecision. No implementation or successful test is inferred.

## FR 01 Product records

> The system must enable the users to add new inventory items along with details such as name, description, prices etc.

**Source:** section 4.1, statement 1. **Use-case relationship:** UC-01, UC-11.

**Later acceptance proposal:** Define an item identity rule; verify valid creation, duplicate identity rejection and correction of invalid fields.

## FR 02 Stock quantity changes

> The users shall be able to update inventory quantities based on purchases, sales and returns made.

**Source:** section 4.1, statement 2. **Use-case relationship:** UC-02, UC-08, UC-12.

**Later acceptance proposal:** Define movement types and quantity precision; verify receipts, issues and eligible returns reconcile to the recorded balance.

## FR 03 Availability and location

> The system must be able to provide real-time availability and location of each inventory item.

**Source:** section 4.1, statement 3. **Use-case relationship:** UC-08.

**Later acceptance proposal:** Define which availability/location states are displayed and an observable freshness target for a stated workload.

## FR 04 Stock thresholds and alerts

> The system should let the users set minimum and maximum stock levels so that automated reorder alerts can be generated

**Source:** section 4.1, statement 4. **Use-case relationship:** UC-03.

**Later acceptance proposal:** Specify threshold boundaries and whether a trigger produces an alert, a draft request or an authorised order; test boundary and repeat-trigger behaviour.

## FR 05 Item categories

> The system should be able to support categorizing the inventory item so that they can be stored in an organized way.

**Source:** section 4.1, statement 5. **Use-case relationship:** UC-04.

**Later acceptance proposal:** Define category changes and filtering; verify reclassification preserves item and movement history.

## FR 06 Expiry and serial information

> The user should be able to track the additional details of the items in the inventory like expiry dates and serial numbers.

**Source:** section 4.1, statement 6. **Use-case relationship:** Wider scope; no dedicated numbered use case.

**Later acceptance proposal:** Choose item, lot and serial granularity; define required dates, uniqueness rules and unknown values before checking expiry or traceability.

## FR 07 Change history

> The system shall be able to provide audit functionality and keep track of all the changes made to the system by the users involved

**Source:** section 4.1, statement 7. **Use-case relationship:** UC-05 partly overlaps; distinguish audit concepts.

**Later acceptance proposal:** Specify an attributable change record and retention/correction rules; distinguish event history from a physical stock count.

## FR 08 Transfers between locations

> The system shall allow transfers of inventory between the different locations of the organization

**Source:** section 4.1, statement 8. **Use-case relationship:** Wider scope; no dedicated numbered use case.

**Later acceptance proposal:** Define dispatch, in-transit and receipt behaviour; verify stock is conserved across locations and interrupted transfers can be resolved.

## FR 09 Bulk import and export

> The system shall allow importing and exporting large data into and out of the system as in the initial stages so that the database can be set up efficiently

**Source:** section 4.1, statement 9. **Use-case relationship:** UC-06.

**Later acceptance proposal:** Specify schema, units, error handling and export scope; check malformed rows, duplicates, interrupted imports and unsafe spreadsheet text.

## FR 10 Search and filtering

> The system shall enable the users to search and filter for items so that they can effectively retrieve information.

**Source:** section 4.1, statement 10. **Use-case relationship:** No dedicated numbered use case.

**Later acceptance proposal:** Define searchable fields and filters; verify expected inclusion/exclusion, empty results and a workload-specific response target.

## Wider specified scope

Sections 2.2 and 3.2 additionally discuss barcode/RFID, suppliers and purchase orders, units such as boxes and kilograms, warehouse operations, returns/refunds, batch/serial tracking, stock valuation, forecasting and ERP/WMS integration. These broader descriptions are not consistently resolved into the ten statements or detailed use cases. See the later review.

The report names Java/JRE, MySQL, HTML5, CSS3 and JavaScript as an intended environment. This is a proposed technology description, not a verified software stack or build instruction.

Sections 4.2 and 4.3 describe usability, responsive interfaces, role access, performance, scalability, security, backup/recovery and integration. Their qualitative wording needs measurable workload, timing, recovery and access criteria before implementation can be accepted. No performance values have been invented to fill those gaps.
