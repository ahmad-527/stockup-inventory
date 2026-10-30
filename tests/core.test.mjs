import test from "node:test";
import assert from "node:assert/strict";
import {
  emptyState,
  applyCommand,
  balance,
  totalOnHand,
  inTransit,
  quantity,
  seedState,
  validateState,
  parseItemsCsv,
  csvCell,
  stockCsv,
} from "../app/core.mjs";
function harness() {
  let state = emptyState("test-workspace"),
    n = 0;
  return {
    get state() {
      return state;
    },
    run(c, extra = {}) {
      state = applyCommand(state, c, {
        id: `test_operation_${++n}`,
        at: "2026-10-30T10:00:00.000Z",
        expectedRevision: state.revision,
        ...extra,
      });
      return state;
    },
  };
}
function product(h, unit = "pcs") {
  h.run({
    type: "addItem",
    sku: "TEST-1",
    name: "Test item",
    category: "General",
    unit,
    barcode: "TESTCODE",
    min: "2",
    max: "20",
  });
  return h.state.items[0].id;
}
const move = (h, id, kind, q, locationId = "shop") =>
  h.run({
    type: "move",
    itemId: id,
    kind,
    quantity: q,
    locationId,
    reference: "Verified fixture",
  });
test("fixed precision preserves kg; whole pieces and bounds are enforced", () => {
  assert.equal(quantity("0.125", "kg"), 125);
  assert.equal(quantity("1000000", "pcs"), 1_000_000_000);
  for (const v of ["1e3", "-1", "NaN", "01", "1.2345", "", "1000001"])
    assert.throws(() => quantity(v, "kg"));
  assert.throws(() => quantity("1.5", "pcs"));
  assert.equal(quantity("0", "pcs", true), 0);
  assert.throws(() => quantity("0", "pcs"));
});
test("independently derived receive/issue/return/transfer oracle conserves 9 pieces", () => {
  const h = harness(),
    id = product(h);
  move(h, id, "receive", "10");
  move(h, id, "issue", "3");
  move(h, id, "return", "2");
  h.run({
    type: "dispatch",
    itemId: id,
    from: "shop",
    to: "store",
    quantity: "4",
    reference: "Transfer fixture",
  });
  const t = h.state.transfers[0];
  assert.equal(balance(h.state, id, "shop"), 5000);
  assert.equal(balance(h.state, id, "store"), 0);
  assert.equal(inTransit(h.state, id), 4000);
  assert.equal(totalOnHand(h.state, id) + inTransit(h.state, id), 9000);
  h.run({ type: "receiveTransfer", transferId: t.id });
  assert.equal(balance(h.state, id, "store"), 4000);
  assert.equal(totalOnHand(h.state, id), 9000);
  assert.equal(inTransit(h.state, id), 0);
  validateState(h.state);
});
test("negative stock and same-location transfer fail atomically", () => {
  const h = harness(),
    id = product(h);
  move(h, id, "receive", "4");
  const before = structuredClone(h.state);
  assert.throws(() => move(h, id, "issue", "5"));
  assert.deepEqual(h.state, before);
  assert.throws(() =>
    h.run({
      type: "dispatch",
      itemId: id,
      from: "shop",
      to: "shop",
      quantity: "1",
      reference: "Bad transfer",
    }),
  );
  assert.deepEqual(h.state, before);
});
test("transfer return restores source once; a second resolution is rejected", () => {
  const h = harness(),
    id = product(h);
  move(h, id, "receive", "10");
  h.run({
    type: "dispatch",
    itemId: id,
    from: "shop",
    to: "store",
    quantity: "3",
    reference: "Fixture",
  });
  const t = h.state.transfers[0];
  h.run({ type: "cancelTransfer", transferId: t.id });
  assert.equal(balance(h.state, id, "shop"), 10000);
  assert.equal(inTransit(h.state, id), 0);
  assert.throws(() => h.run({ type: "receiveTransfer", transferId: t.id }));
  validateState(h.state);
});
test("duplicate operation is idempotent even after subsequent writes", () => {
  const h = harness(),
    id = product(h);
  const op = {
    type: "move",
    itemId: id,
    kind: "receive",
    quantity: "2",
    locationId: "shop",
    reference: "Fixture",
  };
  const context = {
    id: "same_operation_123",
    at: "2026-10-30T10:00:00Z",
    expectedRevision: h.state.revision,
  };
  const a = applyCommand(h.state, op, context),
    b = applyCommand(
      a,
      { type: "rename", name: "Changed" },
      { ...context, id: "later_operation_123", expectedRevision: a.revision },
    );
  assert.deepEqual(applyCommand(b, op, context), b);
  assert.equal(balance(b, id, "shop"), 2000);
});
test("stale revision cannot overwrite a later command", () => {
  const h = harness(),
    id = product(h),
    rev = h.state.revision;
  move(h, id, "receive", "1");
  assert.throws(
    () =>
      h.run({ type: "rename", name: "Stale write" }, { expectedRevision: rev }),
    (e) => e.code === "STALE",
  );
  assert.equal(balance(h.state, id, "shop"), 1000);
});
function reviewed(h, id, qty = "8") {
  h.run({ type: "startCount", name: "Physical fixture", locationId: "shop" });
  const c = h.state.counts.at(-1);
  h.run({ type: "enterCount", countId: c.id, itemId: id, quantity: qty });
  h.run({ type: "reviewCount", countId: c.id });
  return c.id;
}
test("blind count requires explicit values including zero before review", () => {
  const h = harness(),
    id = product(h);
  h.run({ type: "startCount", name: "Zero fixture", locationId: "shop" });
  const c = h.state.counts[0];
  assert.equal(c.lines[0].counted, null);
  assert.throws(() => h.run({ type: "reviewCount", countId: c.id }));
  h.run({
    type: "saveCount",
    countId: c.id,
    entries: [{ itemId: id, quantity: "0" }],
    review: true,
  });
  h.run({
    type: "applyCount",
    countId: c.id,
    reference: "Verified empty shelf",
  });
  assert.equal(balance(h.state, id, "shop"), 0);
  validateState(h.state);
});
test("reviewed count adjustment retains previous receipt and reason", () => {
  const h = harness(),
    id = product(h);
  move(h, id, "receive", "10");
  const cid = reviewed(h, id, "8");
  h.run({
    type: "applyCount",
    countId: cid,
    reference: "Two damaged pieces removed",
  });
  assert.equal(balance(h.state, id, "shop"), 8000);
  assert.equal(h.state.movements[0].delta, 10000);
  assert.equal(h.state.movements.at(-1).delta, -2000);
  assert.equal(
    h.state.movements.at(-1).reference,
    "Two damaged pieces removed",
  );
  validateState(h.state);
});
test("intervening movements refuse stale count even when net balance is unchanged", () => {
  const h = harness(),
    id = product(h);
  move(h, id, "receive", "10");
  const cid = reviewed(h, id);
  move(h, id, "issue", "1");
  move(h, id, "return", "1");
  const before = structuredClone(h.state);
  assert.throws(
    () =>
      h.run({
        type: "applyCount",
        countId: cid,
        reference: "Old physical observation",
      }),
    (e) => e.code === "COUNT_MOVED",
  );
  assert.deepEqual(h.state, before);
});
test("other location movement does not falsely invalidate a count", () => {
  const h = harness(),
    id = product(h);
  move(h, id, "receive", "10");
  const cid = reviewed(h, id);
  move(h, id, "receive", "2", "store");
  h.run({ type: "applyCount", countId: cid, reference: "Verified" });
  assert.equal(totalOnHand(h.state, id), 10000);
});
test("cancelled count preserves entries and does not adjust balances", () => {
  const h = harness(),
    id = product(h);
  move(h, id, "receive", "10");
  const cid = reviewed(h, id);
  h.run({ type: "cancelCount", countId: cid });
  assert.equal(balance(h.state, id, "shop"), 10000);
  assert.equal(h.state.counts[0].lines[0].counted, 8000);
  assert.throws(() =>
    h.run({ type: "applyCount", countId: cid, reference: "No" }),
  );
  validateState(h.state);
});
test("bulk import is all-or-nothing with duplicate identity and invalid precision", () => {
  const h = harness();
  const row = {
    sku: "ABC",
    name: "A",
    category: "General",
    unit: "pcs",
    barcode: "",
    min: "0",
    max: "2",
  };
  const before = structuredClone(h.state);
  assert.throws(() => h.run({ type: "importItems", rows: [row, row] }));
  assert.deepEqual(h.state, before);
  assert.throws(() =>
    h.run({
      type: "importItems",
      rows: [row, { ...row, sku: "DEF", min: "0.5" }],
    }),
  );
  assert.deepEqual(h.state, before);
});
test("CSV quoted commas and quote escaping work; malformed rows are rejected", () => {
  const rows = parseItemsCsv(
    'sku,name,category,unit,barcode,min,max\r\nA,"Box, \"\"large\"\"",General,pcs,,0,10\r\n',
  );
  assert.equal(rows[0].name, 'Box, "large"');
  for (const raw of [
    "a,b\n1,2",
    'sku,name,category,unit,barcode,min,max\nA,"bad,General,pcs,,0,1',
    'sku,name,category,unit,barcode,min,max\nA,"ok"no,General,pcs,,0,1',
  ])
    assert.throws(() => parseItemsCsv(raw));
});
test("quoted final CSV field permits a Windows CRLF terminator", () => {
  const rows = parseItemsCsv(
    'sku,name,category,unit,barcode,min,max\r\nABC,A,General,pcs,,0,"10"\r\n',
  );
  assert.equal(rows[0].max, "10");
});
test("restore rejects a count snapshot whose expected stock does not match its ledger version", () => {
  const h = harness(),
    id = product(h);
  move(h, id, "receive", "10");
  reviewed(h, id);
  const s = structuredClone(h.state);
  s.counts[0].lines[0].expected = 11000;
  assert.throws(() => validateState(s));
});
test("spreadsheet text formulas are neutralised in exports", () => {
  assert.equal(csvCell('=HYPERLINK("x")'), '"\'=HYPERLINK(""x"")"');
  assert.equal(csvCell(" \t+1"), '"\' \t+1"');
  assert.equal(csvCell("normal"), '"normal"');
});
test("backup round trip retains all supported data and stock", () => {
  const s = seedState();
  assert.deepEqual(validateState(JSON.parse(JSON.stringify(s))), s);
  assert.match(stockCsv(s), /NL-101/);
  assert.equal(s.items.length, 12);
});
test("restore rejects unknown schema, impossible quantities and orphaned transfer rows", () => {
  const s = seedState();
  const a = structuredClone(s);
  a.schema = 999;
  assert.throws(() => validateState(a));
  const b = structuredClone(s);
  b.movements[0].delta = -1;
  assert.throws(() => validateState(b));
  const c = structuredClone(s);
  c.movements[0].transferId = "unknown";
  assert.throws(() => validateState(c));
  const d = structuredClone(s);
  d.items[0].unit = "boxes";
  assert.throws(() => validateState(d));
});
test("transfer state tampering is rejected without silently inventing a receipt", () => {
  const h = harness(),
    id = product(h);
  move(h, id, "receive", "10");
  h.run({
    type: "dispatch",
    itemId: id,
    from: "shop",
    to: "store",
    quantity: "4",
    reference: "Fixture",
  });
  const s = structuredClone(h.state);
  s.transfers[0].status = "received";
  assert.throws(() => validateState(s));
});
test("metadata update cannot change SKU or units and checks minimum/target ordering", () => {
  const h = harness(),
    id = product(h);
  h.run({
    type: "updateItem",
    itemId: id,
    name: "Renamed",
    category: "New",
    min: "1",
    max: "4",
    unit: "kg",
    sku: "CHANGED",
  });
  assert.equal(h.state.items[0].unit, "pcs");
  assert.equal(h.state.items[0].sku, "TEST-1");
  assert.throws(() =>
    h.run({
      type: "updateItem",
      itemId: id,
      name: "X",
      category: "X",
      min: "5",
      max: "4",
    }),
  );
});
