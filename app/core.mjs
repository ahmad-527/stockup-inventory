// Deterministic inventory rules. All quantities are integer thousandths, never floats.
export const SCHEMA = 1;
export const LIMITS = {
  items: 1000,
  movements: 20000,
  counts: 200,
  countLines: 10000,
  quantity: 1_000_000_000,
};
export class StockError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}
const fail = (code, message) => {
  throw new StockError(code, message);
};
const need = (ok, message) => {
  if (!ok) fail("INVALID", message);
};
export function text(value, name, max = 120, optional = false) {
  need(typeof value === "string", `${name} must be text.`);
  const v = value.trim();
  need(
    (optional || v.length > 0) &&
      v.length <= max &&
      !/[\u0000-\u001f\u007f]/u.test(v),
    `${name} must contain ${optional ? "0" : "1"}–${max} printable characters.`,
  );
  return v;
}
export function quantity(value, unit, zero = false) {
  need(["pcs", "kg"].includes(unit), "Unknown unit.");
  need(
    typeof value === "string" && /^(0|[1-9]\d{0,6})(\.\d{1,3})?$/.test(value),
    "Use a plain positive number with at most 3 decimal places.",
  );
  const [a, b = ""] = value.split(".");
  const q = Number(a) * 1000 + Number(b.padEnd(3, "0"));
  need(
    Number.isSafeInteger(q) && q <= LIMITS.quantity && (zero ? q >= 0 : q > 0),
    "Quantity is outside the supported range.",
  );
  need(unit !== "pcs" || q % 1000 === 0, "Pieces must be whole numbers.");
  return q;
}
export function displayQty(q) {
  return String(q / 1000);
}
export function emptyState(id) {
  return {
    schema: SCHEMA,
    workspaceId: id,
    revision: 0,
    name: "My stockroom",
    locations: [
      { id: "shop", name: "Shop floor" },
      { id: "store", name: "Stockroom" },
    ],
    items: [],
    movements: [],
    transfers: [],
    counts: [],
    operations: [],
  };
}
export function balance(s, itemId, locationId) {
  return s.movements.reduce(
    (q, m) =>
      q + (m.itemId === itemId && m.locationId === locationId ? m.delta : 0),
    0,
  );
}
export function stockVersion(s, itemId, locationId) {
  return (
    s.movements
      .filter((m) => m.itemId === itemId && m.locationId === locationId)
      .at(-1)?.id || "none"
  );
}
export const totalOnHand = (s, itemId) =>
  s.locations.reduce((q, l) => q + balance(s, itemId, l.id), 0);
export const inTransit = (s, itemId) =>
  s.transfers
    .filter((t) => t.itemId === itemId && t.status === "dispatched")
    .reduce((q, t) => q + t.quantity, 0);
export function itemStatus(s, item) {
  const q = totalOnHand(s, item.id);
  return q === 0
    ? "Out of stock"
    : q <= item.min
      ? "Low stock"
      : q > item.max && item.max > 0
        ? "Above target"
        : "In range";
}
const getItem = (s, id) => {
  const p = s.items.find((p) => p.id === id);
  need(p, "Item no longer exists.");
  return p;
};
const getLocation = (s, id) => {
  need(
    s.locations.some((l) => l.id === id),
    "Choose a valid location.",
  );
  return id;
};
const unique = (rows, key) =>
  new Set(rows.map((r) => r[key])).size === rows.length;
function addItem(s, c, id) {
  need(
    s.items.length < LIMITS.items,
    "Prototype limit: 1,000 items. Export a backup before expanding your workspace.",
  );
  const sku = text(c.sku, "SKU", 40).toUpperCase();
  need(
    /^[A-Z0-9][A-Z0-9._-]*$/.test(sku),
    "Use letters, digits, dots, hyphens or underscores in SKU.",
  );
  need(!s.items.some((p) => p.sku === sku), `SKU ${sku} already exists.`);
  const barcode = text(c.barcode || "", "Barcode", 80, true);
  need(
    !barcode || !s.items.some((p) => p.barcode === barcode),
    "Barcode already belongs to another item.",
  );
  const min = quantity(c.min || "0", c.unit, true),
    max = quantity(c.max || "0", c.unit, true);
  need(max >= min, "Target stock must be at least the minimum.");
  s.items.push({
    id,
    sku,
    name: text(c.name, "Item name", 100),
    category: text(c.category || "General", "Category", 50),
    barcode,
    unit: c.unit,
    min,
    max,
  });
}
export function applyCommand(input, c, context) {
  need(c && typeof c === "object" && context, "Missing command.");
  const { id, at, expectedRevision } = context;
  need(
    typeof id === "string" && /^[a-zA-Z0-9_-]{8,80}$/.test(id),
    "Invalid operation identifier.",
  );
  need(
    typeof at === "string" &&
      /^\d{4}-\d\d-\d\dT/.test(at) &&
      Number.isFinite(Date.parse(at)),
    "Invalid timestamp.",
  );
  // Retry of the same committed operation is harmless, including after another write.
  if (input.operations.includes(id)) return input;
  if (input.revision !== expectedRevision)
    fail(
      "STALE",
      "This workspace changed in another tab. Your entry has not been applied. Refresh the workspace and review your entry.",
    );
  const s = structuredClone(input);
  need(
    s.operations.length < 30000,
    "Prototype history limit reached. Keep a backup; start a separate workspace.",
  );
  let n = 0;
  const move = (itemId, locationId, delta, kind, reference, extra = {}) => {
    const p = getItem(s, itemId);
    getLocation(s, locationId);
    need(
      Number.isSafeInteger(delta) &&
        Math.abs(delta) <= LIMITS.quantity &&
        (p.unit !== "pcs" || delta % 1000 === 0),
      "Invalid movement precision.",
    );
    const next = balance(s, itemId, locationId) + delta;
    need(
      next >= 0 && next <= LIMITS.quantity,
      "Not enough stock at this location, or quantity limit exceeded.",
    );
    need(
      s.movements.length < LIMITS.movements,
      "Prototype limit: 20,000 movement rows.",
    );
    s.movements.push({
      id: `${id}_${n++}`,
      itemId,
      locationId,
      delta,
      kind,
      reference,
      at,
      ...extra,
    });
  };
  switch (c.type) {
    case "addItem":
      addItem(s, c, id);
      break;
    case "updateItem": {
      const p = getItem(s, c.itemId);
      p.name = text(c.name, "Item name", 100);
      p.category = text(c.category, "Category", 50);
      p.min = quantity(c.min, p.unit, true);
      p.max = quantity(c.max, p.unit, true);
      need(p.max >= p.min, "Target stock must be at least the minimum.");
      break;
    }
    case "move": {
      need(
        ["receive", "issue", "return", "writeoff"].includes(c.kind),
        "Choose a movement type.",
      );
      const q = quantity(c.quantity, getItem(s, c.itemId).unit);
      const reason = text(c.reference, "Reference / reason");
      move(
        c.itemId,
        c.locationId,
        ["issue", "writeoff"].includes(c.kind) ? -q : q,
        c.kind,
        reason,
      );
      break;
    }
    case "dispatch": {
      need(s.transfers.length < 3000, "Prototype transfer limit reached.");
      const p = getItem(s, c.itemId);
      getLocation(s, c.to);
      need(c.from !== c.to, "Choose two different locations.");
      const q = quantity(c.quantity, p.unit),
        reference = text(c.reference, "Transfer reference");
      move(p.id, c.from, -q, "dispatch", reference, { transferId: id });
      s.transfers.push({
        id,
        itemId: p.id,
        from: c.from,
        to: c.to,
        quantity: q,
        reference,
        at,
        status: "dispatched",
      });
      break;
    }
    case "receiveTransfer":
    case "cancelTransfer": {
      const t = s.transfers.find((t) => t.id === c.transferId);
      need(
        t?.status === "dispatched",
        "This transfer has already been resolved.",
      );
      const received = c.type === "receiveTransfer";
      move(
        t.itemId,
        received ? t.to : t.from,
        t.quantity,
        received ? "transfer receipt" : "transfer returned",
        t.reference,
        { transferId: t.id },
      );
      t.status = received ? "received" : "returned";
      t.resolvedAt = at;
      break;
    }
    case "startCount": {
      need(
        s.counts.length < LIMITS.counts,
        "Prototype limit: 200 count sessions.",
      );
      need(
        s.counts.reduce((n, c) => n + c.lines.length, 0) + s.items.length <=
          LIMITS.countLines,
        "Prototype limit: 10,000 historical count lines. Keep a full backup.",
      );
      getLocation(s, c.locationId);
      need(s.items.length > 0, "Add an item before starting a count.");
      need(
        !s.counts.some(
          (x) =>
            ["counting", "review"].includes(x.status) &&
            x.locationId === c.locationId,
        ),
        "An unfinished count already exists for this location.",
      );
      s.counts.push({
        id,
        name: text(c.name, "Count name", 80),
        locationId: c.locationId,
        at,
        status: "counting",
        lines: s.items.map((p) => ({
          itemId: p.id,
          expected: balance(s, p.id, c.locationId),
          version: stockVersion(s, p.id, c.locationId),
          counted: null,
        })),
      });
      break;
    }
    case "saveCount":
    case "enterCount": {
      const count = s.counts.find((x) => x.id === c.countId);
      need(
        count?.status === "counting",
        "This count is no longer open for entry.",
      );
      const entries =
        c.type === "saveCount"
          ? c.entries
          : [{ itemId: c.itemId, quantity: c.quantity }];
      need(
        Array.isArray(entries) &&
          entries.length <= LIMITS.items &&
          unique(entries, "itemId"),
        "Invalid count entries.",
      );
      for (const e of entries) {
        const line = count.lines.find((x) => x.itemId === e.itemId);
        need(line, "Item is outside this count.");
        line.counted = quantity(e.quantity, getItem(s, e.itemId).unit, true);
      }
      if (c.review) {
        need(
          count.lines.every((x) => x.counted !== null),
          "Enter every count, including explicit zeros, before review.",
        );
        count.status = "review";
      }
      break;
    }
    case "reviewCount": {
      const count = s.counts.find((x) => x.id === c.countId);
      need(count?.status === "counting", "This count is not awaiting entry.");
      need(
        count.lines.every((x) => x.counted !== null),
        "Enter every count, including explicit zeros, before review.",
      );
      count.status = "review";
      break;
    }
    case "editCount": {
      const count = s.counts.find((x) => x.id === c.countId);
      need(count?.status === "review", "Count is not in review.");
      count.status = "counting";
      break;
    }
    case "cancelCount": {
      const count = s.counts.find((x) => x.id === c.countId);
      need(
        count && ["counting", "review"].includes(count.status),
        "This count is already closed.",
      );
      count.status = "cancelled";
      count.closedAt = at;
      break;
    }
    case "applyCount": {
      const count = s.counts.find((x) => x.id === c.countId);
      need(count?.status === "review", "Review the count before applying.");
      need(
        count.lines.every((x) => x.counted !== null),
        "Count is incomplete.",
      );
      if (
        count.lines.some(
          (x) => x.version !== stockVersion(s, x.itemId, count.locationId),
        )
      )
        fail(
          "COUNT_MOVED",
          "Stock moved after this count started. No balances were changed. Cancel this count and start a fresh physical count.",
        );
      const reason = text(c.reference, "Adjustment reason");
      for (const line of count.lines)
        move(
          line.itemId,
          count.locationId,
          line.counted - line.expected,
          "count adjustment",
          reason,
          { countId: count.id },
        );
      count.status = "applied";
      count.closedAt = at;
      count.reason = reason;
      break;
    }
    case "importItems": {
      need(
        Array.isArray(c.rows) &&
          c.rows.length > 0 &&
          c.rows.length <= LIMITS.items,
        "Import 1–1,000 rows.",
      );
      for (let i = 0; i < c.rows.length; i++)
        addItem(s, c.rows[i], `${id}_item${i}`);
      break;
    }
    case "rename":
      s.name = text(c.name, "Workspace name", 60);
      break;
    default:
      fail("INVALID", "Unknown operation.");
  }
  s.operations.push(id);
  s.revision++;
  return s;
}

// Strict restore boundary: reject unsupported fields/versions and replay the quantity ledger.
export function validateState(s) {
  const keys = [
    "schema",
    "workspaceId",
    "revision",
    "name",
    "locations",
    "items",
    "movements",
    "transfers",
    "counts",
    "operations",
  ];
  need(
    s &&
      typeof s === "object" &&
      !Array.isArray(s) &&
      Object.keys(s).every((k) => keys.includes(k)) &&
      keys.every((k) => Object.hasOwn(s, k)),
    "Backup has missing or unsupported fields.",
  );
  need(s.schema === SCHEMA, "Unsupported backup version.");
  text(s.workspaceId, "Workspace ID", 80);
  text(s.name, "Workspace name", 60);
  need(
    Number.isSafeInteger(s.revision) && s.revision >= 0,
    "Invalid workspace revision.",
  );
  for (const key of [
    "locations",
    "items",
    "movements",
    "transfers",
    "counts",
    "operations",
  ])
    need(Array.isArray(s[key]), `Invalid ${key}.`);
  need(
    s.locations.length === 2 &&
      s.locations[0].id === "shop" &&
      s.locations[1].id === "store",
    "Unsupported location configuration.",
  );
  for (const l of s.locations) text(l.name, "Location", 50);
  need(
    s.items.length <= LIMITS.items &&
      s.movements.length <= LIMITS.movements &&
      s.counts.length <= LIMITS.counts &&
      s.transfers.length <= 3000 &&
      s.operations.length <= 30000,
    "Backup exceeds prototype limits.",
  );
  need(
    s.revision === s.operations.length &&
      unique(s.items, "id") &&
      unique(s.items, "sku") &&
      unique(s.movements, "id") &&
      unique(s.transfers, "id") &&
      unique(s.counts, "id"),
    "Duplicate identities or inconsistent revision.",
  );
  need(
    new Set(s.operations).size === s.operations.length &&
      s.operations.every(
        (x) => typeof x === "string" && /^[a-zA-Z0-9_-]{8,80}$/.test(x),
      ),
    "Invalid operation history.",
  );
  const tmp = emptyState(s.workspaceId);
  for (const p of s.items) {
    text(p.id, "Item ID", 100);
    need(
      Number.isSafeInteger(p.min) && Number.isSafeInteger(p.max),
      "Invalid thresholds.",
    );
    addItem(
      tmp,
      { ...p, min: displayQty(p.min), max: displayQty(p.max) },
      p.id,
    );
    need(p.sku === tmp.items.at(-1).sku, "Invalid SKU normalisation.");
  }
  const replay = new Map();
  const snapshots = new Map(),
    previous = new Map(),
    latest = new Map(),
    transferRows = new Map(),
    countRows = new Map();
  const group = (map, key, value) => {
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(value);
  };
  for (const m of s.movements) {
    text(m.id, "Movement ID", 100);
    const p = getItem(s, m.itemId);
    getLocation(s, m.locationId);
    need(
      [
        "receive",
        "issue",
        "return",
        "writeoff",
        "dispatch",
        "transfer receipt",
        "transfer returned",
        "count adjustment",
      ].includes(m.kind),
      "Invalid movement kind.",
    );
    text(m.reference, "Movement reference");
    need(Number.isFinite(Date.parse(m.at)), "Invalid movement date.");
    need(
      Number.isSafeInteger(m.delta) &&
        Math.abs(m.delta) <= LIMITS.quantity &&
        (p.unit !== "pcs" || m.delta % 1000 === 0),
      "Invalid movement quantity.",
    );
    need(
      !["receive", "return", "transfer receipt", "transfer returned"].includes(
        m.kind,
      ) || m.delta > 0,
      "Invalid positive movement.",
    );
    need(
      !["issue", "writeoff", "dispatch"].includes(m.kind) || m.delta < 0,
      "Invalid negative movement.",
    );
    const key = `${p.id}|${m.locationId}`,
      next = (replay.get(key) || 0) + m.delta;
    need(
      next >= 0 && next <= LIMITS.quantity,
      "Backup ledger contains impossible stock.",
    );
    replay.set(key, next);
    snapshots.set(m.id, {
      itemId: p.id,
      locationId: m.locationId,
      quantity: next,
    });
    previous.set(m.id, latest.get(key) || "none");
    latest.set(key, m.id);
    if (m.transferId) group(transferRows, m.transferId, m);
    if (m.countId) group(countRows, `${m.countId}|${m.itemId}`, m);
  }
  for (const t of s.transfers) {
    text(t.id, "Transfer ID", 80);
    getItem(s, t.itemId);
    getLocation(s, t.from);
    getLocation(s, t.to);
    need(
      t.from !== t.to &&
        ["dispatched", "received", "returned"].includes(t.status),
      "Invalid transfer state.",
    );
    need(
      quantity(displayQty(t.quantity), getItem(s, t.itemId).unit) ===
        t.quantity,
      "Invalid transfer quantity.",
    );
    text(t.reference, "Transfer reference");
    need(Number.isFinite(Date.parse(t.at)), "Invalid transfer date.");
    const ms = transferRows.get(t.id) || [],
      outgoing = ms.filter((m) => m.kind === "dispatch");
    need(
      outgoing.length === 1 &&
        outgoing[0].delta === -t.quantity &&
        outgoing[0].itemId === t.itemId &&
        outgoing[0].locationId === t.from,
      "Transfer dispatch does not reconcile.",
    );
    need(
      ms.length === (t.status === "dispatched" ? 1 : 2),
      "Transfer resolution does not reconcile.",
    );
    if (t.status !== "dispatched")
      need(
        ms.some(
          (m) =>
            m.delta === t.quantity &&
            m.itemId === t.itemId &&
            m.locationId === (t.status === "received" ? t.to : t.from) &&
            m.kind ===
              (t.status === "received"
                ? "transfer receipt"
                : "transfer returned"),
        ),
        "Invalid transfer resolution.",
      );
  }
  let countLineTotal = 0;
  for (const c of s.counts) {
    text(c.id, "Count ID", 80);
    text(c.name, "Count name", 80);
    getLocation(s, c.locationId);
    need(
      ["counting", "review", "applied", "cancelled"].includes(c.status) &&
        Array.isArray(c.lines) &&
        c.lines.length > 0 &&
        c.lines.length <= LIMITS.items &&
        unique(c.lines, "itemId"),
      "Invalid count state.",
    );
    countLineTotal += c.lines.length;
    need(
      countLineTotal <= LIMITS.countLines,
      "Backup exceeds historical count line limit.",
    );
    need(Number.isFinite(Date.parse(c.at)), "Invalid count date.");
    for (const l of c.lines) {
      const p = getItem(s, l.itemId);
      need(
        quantity(displayQty(l.expected), p.unit, true) === l.expected,
        "Invalid expected quantity.",
      );
      const snap = snapshots.get(l.version);
      need(
        typeof l.version === "string" &&
          (l.version === "none"
            ? l.expected === 0
            : snap &&
              snap.itemId === p.id &&
              snap.locationId === c.locationId &&
              snap.quantity === l.expected),
        "Invalid count snapshot.",
      );
      need(
        l.counted === null ||
          quantity(displayQty(l.counted), p.unit, true) === l.counted,
        "Invalid physical count.",
      );
      need(
        !["review", "applied"].includes(c.status) || l.counted !== null,
        "Incomplete reviewed count.",
      );
      if (c.status === "applied") {
        const ms = countRows.get(`${c.id}|${p.id}`) || [];
        need(
          ms.length === 1 &&
            ms[0].kind === "count adjustment" &&
            ms[0].locationId === c.locationId &&
            ms[0].delta === l.counted - l.expected &&
            previous.get(ms[0].id) === l.version,
          "Applied count does not reconcile.",
        );
      }
    }
  }
  for (const l of s.locations)
    need(
      s.counts.filter(
        (c) =>
          c.locationId === l.id && ["counting", "review"].includes(c.status),
      ).length <= 1,
      "Overlapping active counts.",
    );
  for (const m of s.movements) {
    need(
      !m.transferId || s.transfers.some((t) => t.id === m.transferId),
      "Orphaned transfer movement.",
    );
    need(
      !m.countId ||
        s.counts.some((c) => c.id === m.countId && c.status === "applied"),
      "Orphaned count movement.",
    );
    need(
      !["dispatch", "transfer receipt", "transfer returned"].includes(m.kind) ||
        m.transferId,
      "Transfer relationship is missing.",
    );
    need(
      m.kind !== "count adjustment" || m.countId,
      "Count relationship is missing.",
    );
  }
  return structuredClone(s);
}

export function parseItemsCsv(raw) {
  need(
    typeof raw === "string" && raw.length <= 1_000_000,
    "CSV must be smaller than 1 MB.",
  );
  // RFC 4180-style quoted fields, including commas/newlines. No silent row skipping.
  const rows = [];
  let row = [],
    field = "",
    quoted = false,
    closed = false;
  for (let i = 0; i <= raw.length; i++) {
    const ch = raw[i];
    if (quoted) {
      if (ch === undefined) fail("INVALID", "CSV has an unclosed quote.");
      if (ch === '"' && raw[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
        closed = true;
      } else field += ch;
    } else if (ch === '"' && !field && !closed) quoted = true;
    else if (ch === "\r" && raw[i + 1] === "\n") continue;
    else if (ch === "," || ch === "\n" || ch === undefined) {
      row.push(field.replace(/\r$/, ""));
      field = "";
      closed = false;
      if (ch !== ",") {
        if (
          !(
            ch === undefined &&
            row.length === 1 &&
            row[0] === "" &&
            rows.length
          )
        )
          rows.push(row);
        row = [];
      }
    } else {
      need(!closed && ch !== '"', "Malformed CSV quoting.");
      field += ch;
    }
  }
  need(
    rows.length >= 2 && rows.length <= 1001,
    "CSV needs a header and 1–1,000 data rows.",
  );
  need(
    rows[0].join(",").replace(/^\uFEFF/, "") ===
      "sku,name,category,unit,barcode,min,max",
    "CSV header must be sku,name,category,unit,barcode,min,max",
  );
  return rows.slice(1).map((r, i) => {
    need(r.length === 7, `CSV row ${i + 2} needs exactly 7 fields.`);
    return Object.fromEntries(
      ["sku", "name", "category", "unit", "barcode", "min", "max"].map(
        (k, j) => [k, r[j]],
      ),
    );
  });
}
export function csvCell(value) {
  let s = String(value);
  if (/^[\s]*[=+\-@\t\r]/u.test(s)) s = "'" + s;
  return '"' + s.replaceAll('"', '""') + '"';
}
export function stockCsv(s) {
  return (
    [
      [
        "sku",
        "name",
        "unit",
        ...s.locations.map((l) => l.name),
        "in_transit",
        "minimum",
        "target",
      ],
      ...s.items.map((p) => [
        p.sku,
        p.name,
        p.unit,
        ...s.locations.map((l) => displayQty(balance(s, p.id, l.id))),
        displayQty(inTransit(s, p.id)),
        displayQty(p.min),
        displayQty(p.max),
      ]),
    ]
      .map((r) => r.map(csvCell).join(","))
      .join("\r\n") + "\r\n"
  );
}
export function seedState(id = "synthetic-stockup-workspace") {
  let s = emptyState(id),
    seq = 0;
  const run = (c) => {
    s = applyCommand(s, c, {
      id: `sample_op_${String(++seq).padStart(4, "0")}`,
      at: "2026-10-30T08:00:00.000Z",
      expectedRevision: s.revision,
    });
  };
  s.name = "Northline Supply · sample";
  const rows = [
    [
      "NL-101",
      "Utility gloves",
      "Workshop",
      "pcs",
      "NL101",
      "8",
      "40",
      "6",
      "12",
    ],
    [
      "NL-102",
      "Canvas tool roll",
      "Workshop",
      "pcs",
      "NL102",
      "5",
      "24",
      "9",
      "16",
    ],
    [
      "NL-103",
      "Workshop apron",
      "Workshop",
      "pcs",
      "NL103",
      "4",
      "18",
      "3",
      "0",
    ],
    [
      "NL-201",
      "Insulated bottle · 750 ml",
      "Everyday",
      "pcs",
      "NL201",
      "8",
      "32",
      "14",
      "20",
    ],
    [
      "NL-202",
      "Steel lunch box",
      "Everyday",
      "pcs",
      "NL202",
      "6",
      "24",
      "7",
      "8",
    ],
    [
      "NL-203",
      "Notebook · grid",
      "Everyday",
      "pcs",
      "NL203",
      "10",
      "60",
      "24",
      "32",
    ],
    [
      "NL-301",
      "Cotton utility cord",
      "Materials",
      "kg",
      "NL301",
      "2",
      "10",
      "1.25",
      "3.5",
    ],
    [
      "NL-302",
      "Brass fasteners",
      "Materials",
      "kg",
      "NL302",
      "1",
      "8",
      "0.75",
      "2.5",
    ],
    [
      "NL-303",
      "Packing tape",
      "Materials",
      "pcs",
      "NL303",
      "12",
      "48",
      "0",
      "8",
    ],
    ["NL-401", "Desk tray", "Home", "pcs", "NL401", "4", "20", "8", "12"],
    [
      "NL-402",
      "Canvas tote",
      "Everyday",
      "pcs",
      "NL402",
      "10",
      "50",
      "18",
      "28",
    ],
    [
      "NL-403",
      "Adjustable wrench",
      "Workshop",
      "pcs",
      "NL403",
      "4",
      "16",
      "7",
      "10",
    ],
  ];
  for (const [sku, name, category, unit, barcode, min, max, a, b] of rows) {
    run({ type: "addItem", sku, name, category, unit, barcode, min, max });
    const itemId = s.items.at(-1).id;
    for (const [locationId, q] of [
      ["shop", a],
      ["store", b],
    ])
      if (q !== "0")
        run({
          type: "move",
          kind: "receive",
          itemId,
          locationId,
          quantity: q,
          reference: "Synthetic opening receipt",
        });
  }
  return s;
}
