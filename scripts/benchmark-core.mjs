// Synthetic lab timing only. This does not measure browser interaction or field percentiles.
import { performance } from "node:perf_hooks";
import { cpus } from "node:os";
import { emptyState, applyCommand, validateState } from "../app/core.mjs";
const at = "2026-10-30T10:00:00.000Z";
const rows = Array.from({ length: 1000 }, (_, i) => ({
  sku: `PERF-${i}`,
  name: `Synthetic item ${i}`,
  category: "Fixture",
  unit: "pcs",
  barcode: "",
  min: "0",
  max: "100",
}));
const s = applyCommand(
  emptyState("performance-workspace"),
  { type: "importItems", rows },
  { id: "perf_catalogue_0001", at, expectedRevision: 0 },
);
for (let i = 0; i < 10000; i++) {
  const id = `perf_receipt_${i}`;
  s.movements.push({
    id: id + "_0",
    at,
    itemId: s.items[i % 1000].id,
    locationId: i % 2 ? "shop" : "store",
    kind: "receive",
    delta: 1000,
    reference: "Synthetic lab receipt",
  });
  s.operations.push(id);
}
s.revision = s.operations.length;
validateState(s);
const measure = (fn) => {
  const times = [];
  fn();
  for (let i = 0; i < 21; i++) {
    const start = performance.now();
    fn();
    times.push(performance.now() - start);
  }
  times.sort((a, b) => a - b);
  return {
    samples: 21,
    p50_ms: +times[10].toFixed(2),
    p95_ms: +times[19].toFixed(2),
    max_ms: +times[20].toFixed(2),
  };
};
const context = { id: "perf_count_new_0001", at, expectedRevision: s.revision };
const result = {
  date: "2026-10-30",
  runtime: process.version,
  platform: process.platform,
  cpu: cpus()[0].model,
  items: 1000,
  movement_rows: 10000,
  lab_target_ms: 500,
  start_count: measure(() =>
    applyCommand(
      s,
      {
        type: "startCount",
        name: "Synthetic performance count",
        locationId: "shop",
      },
      context,
    ),
  ),
  restore_validation: measure(() => validateState(s)),
  limits:
    "Node core only, warm same-machine samples; no browser, IndexedDB, real-phone, cold-start or field latency claim.",
};
console.log(JSON.stringify(result, null, 2));
