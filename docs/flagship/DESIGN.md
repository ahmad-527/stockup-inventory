# Interaction and visual design

Later Codex-assisted prototype design, 30 October 2026. A design choice is not user validation.

Three directions were considered before selecting the prototype identity:

| Direction | Interaction / visual language | Tradeoff |
|---|---|---|
| A · Field notebook | Warm paper, deep green navigation, lime selection, generous reading hierarchy; overview leads to a count/review workspace | Selected provisionally for an owner/operator moving between a desk and shelves. Dense catalogue remains a table, not dozens of decorative cards. |
| B · Warehouse console | Charcoal, compact grids, amber exceptions; keyboard-first movement queue, scanner entry always prominent | Better candidate for sustained specialist desktop/scanner work; higher first-use density. Requires actual warehouse task evidence. |
| C · Pocket counter | Bright neutral single-column screens, oversized numeric count entry, explicit one-item-at-a-time progress | Better candidate for handheld counting; slower catalogue-wide comparison and review on desktop. Requires real phone tests. |

These are distinct **concept explorations**, not three completed interactive designs or tested alternatives. G2 still requires comparative design exploration with actual user/job evidence before choosing the flagship identity. The prototype implements A to test the workflow, without copying competitor branding or compositions.

## Tokens and component rules

- System font stack; no remote font/tracker. Body 15px, heading hierarchy 36/19/15px desktop, scaled for narrow screens. Numeric columns use tabular figures and explicit units.
- Background `#f5f6f1`, text `#182b25`, muted text `#596b63`, primary `#123d31`, active navigation `#d1e99a`; measured text contrast is part of verification, not presumed from colour choice.
- 8–24px component rhythm, 16px panel radius, 44px minimum main controls. Clear labels, visible keyboard focus, native dialog and native input/select semantics. No colour-only warnings.
- Responsive sidebar becomes horizontally scrollable navigation. Tables keep labelled columns and intentional local scrolling; the page itself must not overflow. A local table scroll does not establish comfortable real-phone usability.
- Task-first overview: actual low-stock items, saved counts and unresolved transfers. No invented revenue, carbon, accuracy or productivity chart. Category bars count distinct catalogue items; quantities with different units are never added.
- Forms retain invalid input on error. Blind-entry counts use explicit zero, missing values remain blank; reviewed differences mean **physical minus expected**. Movement after the snapshot blocks application.
- Count entry is saved explicitly. Navigation is blocked when count entries are unsaved; browser closing prompts where supported. Restart resumes committed drafts. This is not an offline-installable PWA; cached/reloaded pages without a network are unverified.
- Transfers show dispatch, in-transit and full receipt/return. Receiving is a deliberate confirmation, not an automatic destination increment at dispatch.
- No pretend team/avatar/role-switcher or decorative action. User-facing language says what happened and what to do next; prototype/operating limits remain visible without implying certifications.

## States and open evaluation

Cover first use, empty inventory, no matches, validation error, storage unavailable, stale tab, stock moved during count, incomplete count, applied/cancelled count, pending/resolved transfer, invalid import/backup and confirmation/cancellation. Verify keyboard, focus/escape, narrow layouts, long text and real downloaded bytes. WCAG 2.2 AA is a target; automated/manual spot checks do not establish complete conformance. Screen readers, affected-user tests, real phones and comparative usability remain open.
