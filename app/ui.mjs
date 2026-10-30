import {
  balance,
  totalOnHand,
  inTransit,
  itemStatus,
  displayQty as q,
  stockVersion,
  parseItemsCsv,
  stockCsv,
  csvCell,
  validateState,
} from "./core.mjs";
import { openStore, read, initialise, commit, restore } from "./storage.mjs";
const $ = (s) => document.querySelector(s);
const root = $("#root"),
  modal = $("#modal");
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const paths = {
  box: "M12 3 3 8l9 5 9-5-9-5ZM3 8v9l9 5 9-5V8M12 13v9M7.5 5.5l9 5",
  overview: "M3 3h7v7H3ZM14 3h7v7h-7ZM3 14h7v7H3ZM14 14h7v7h-7Z",
  count: "M8 5H5v16h14V5h-3M8 3h8v4H8ZM8 14l3 3 5-6",
  transfer: "M3 7h16m-4-4 4 4-4 4M21 17H5m4-4-4 4 4 4",
  clock: "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  settings: "M3 7h18M3 17h18M8 4v6M16 14v6",
  plus: "M12 5v14M5 12h14",
  search: "m16 16 5 5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z",
  arrow: "M5 12h14m-5-5 5 5-5 5",
  down: "M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5",
  warning: "M12 3 2 21h20L12 3ZM12 9v5M12 17v1",
  close: "m6 6 12 12M18 6 6 18",
  check: "m5 12 4 4L19 6",
  leaf: "M20 4C8 2 2 9 7 16s15 2 13-12ZM6 20l10-11",
};
const icon = (n) =>
  `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[n] || paths.box}"/></svg>`;
const art = () =>
  `<svg viewBox="0 0 220 180" fill="none" aria-hidden="true"><path d="m24 100 77-44 91 53-77 45-91-54Z" fill="#c3d6a6"/><path d="m54 75 48-28 49 28-48 28-49-28Z" fill="#f7fae9" stroke="currentColor" stroke-width="2"/><path d="m54 75 49 28v53l-49-28V75Zm49 28 48-28v53l-48 28v-53Z" fill="#d5e6bc" stroke="currentColor" stroke-width="2"/><path d="m79 61 48 28v20M103 103v53" stroke="currentColor" stroke-width="2"/><rect x="137" y="25" width="56" height="68" rx="7" fill="#fff" stroke="currentColor" stroke-width="2"/><path d="m148 48 5 5 10-12M148 70h31M168 49h12M148 80h22" stroke="currentColor" stroke-width="2"/><rect x="150" y="19" width="30" height="12" rx="4" fill="#d1e99a" stroke="currentColor" stroke-width="2"/></svg>`;
let db,
  state,
  view = "overview",
  search = "",
  category = "",
  status = "",
  location = "",
  selectedCount = "",
  formContext,
  toastTimer,
  externalChange = false;
const channel =
  typeof BroadcastChannel === "function"
    ? new BroadcastChannel("stockup-changes")
    : null;
channel?.addEventListener("message", () => {
  externalChange = true;
  showExternalChange();
});
const item = (id) => state.items.find((p) => p.id === id);
const loc = (id) => state.locations.find((l) => l.id === id)?.name || id;
const stamp = (value) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
const activeCounts = () =>
  state.counts.filter((c) => ["counting", "review"].includes(c.status));
const pending = () => state.transfers.filter((t) => t.status === "dispatched");
function toast(message) {
  $("#notice").textContent = message;
  $("#notice").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("#notice").classList.remove("show"), 5500);
}
function showExternalChange() {
  const banner = $("#workspace-error");
  if (banner)
    banner.innerHTML = `Another tab changed this workspace. Refresh before submitting. <button data-act="refresh">Refresh workspace</button>`;
}
function showError(e) {
  const target = modal.open ? $("#modal-error") : $("#workspace-error");
  if (target) {
    target.textContent = e.message || "Unable to complete this action.";
    if (e.code === "STALE") {
      const retry = document.createElement("button");
      retry.type = "button";
      retry.dataset.act = modal.open ? "close-refresh" : "refresh";
      retry.textContent = modal.open
        ? "Close form and refresh"
        : "Refresh workspace";
      target.append(" ", retry);
    }
    target.tabIndex = -1;
    target.focus();
  }
}
function countDirty() {
  const f = $("#count-form");
  if (!f || !state) return false;
  const c = state.counts.find((c) => c.id === f.dataset.id);
  return (
    c?.status === "counting" &&
    c.lines.some(
      (l) =>
        f.elements.namedItem(l.itemId)?.value !==
        (l.counted === null ? "" : q(l.counted)),
    )
  );
}
async function execute(
  c,
  context = { revision: state.revision, workspaceId: state.workspaceId },
  renderNow = true,
) {
  state = await commit(db, c, context.revision, context.workspaceId);
  channel?.postMessage("changed");
  externalChange = false;
  if (renderNow) render();
  return state;
}
function pill(value) {
  return `<span class="pill ${value === "Low stock" ? "warn" : value === "Out of stock" ? "red" : ["In range", "applied", "received"].includes(value) ? "" : "gray"}">${esc(value)}</span>`;
}
function selectOptions(items, selected = "") {
  return items
    .map(
      ([v, t]) =>
        `<option value="${esc(v)}" ${v === selected ? "selected" : ""}>${esc(t)}</option>`,
    )
    .join("");
}
const locationOptions = (selected) =>
  selectOptions(
    state.locations.map((l) => [l.id, l.name]),
    selected,
  );
function header(
  title,
  description,
  actions = "",
  eyebrow = "Inventory workbench",
) {
  return `<header class="page-head"><div><div class="eyebrow">${esc(eyebrow)}</div><h1>${esc(title)}</h1><p>${esc(description)}</p></div><div class="actions">${actions}</div></header>`;
}
function welcome() {
  root.innerHTML = `<main id="main" class="welcome"><section class="welcome-story"><div class="brand"><img src="mark.svg" alt="">StockUp</div><div class="eyebrow">Inventory, made clear</div><h1>Know what’s<br>really on<br>your shelves.</h1><p>A focused workspace for receiving, moving and counting stock. See every change. Resolve differences with confidence.</p><div class="welcome-art">${art()}</div></section><section class="welcome-start"><div><span class="preview">RESEARCH PROTOTYPE · 0.1</span><h2>Your stockroom starts here.</h2><p>Explore a fictional shop, or create an empty workspace. Records stay in this browser on this device.</p><div class="step-list"><div><b>1</b><p><strong>Receive and locate</strong><br>Keep a reason for every movement.</p></div><div><b>2</b><p><strong>Count, then compare</strong><br>Enter physical quantities before viewing differences.</p></div><div><b>3</b><p><strong>Review and recover</strong><br>Protect newer movements and keep portable backups.</p></div></div><div id="workspace-error" class="error" role="alert"></div><button class="primary" data-act="begin-demo">Explore sample stockroom ${icon("arrow")}</button><button data-act="begin-empty">Start an empty workspace ${icon("plus")}</button><div class="info"><strong>One operator. One browser workspace.</strong><br>No account, cloud sync or analytics. Browser storage can be cleared or evicted; export backups. No encryption at rest is provided. Use synthetic records while evaluating this prototype.</div><p class="small"><a href="https://github.com/ahmad-527/stockup-inventory">Original coursework, source and research status ↗</a></p></div></section></main>`;
}
function render() {
  if (!state) {
    welcome();
    return;
  }
  const nav = [
    ["overview", "Overview", "overview"],
    ["inventory", "Inventory", "box"],
    ["counts", "Stock counts", "count"],
    ["transfers", "Transfers", "transfer"],
    ["activity", "Activity", "clock"],
    ["settings", "Workspace", "settings"],
  ];
  root.innerHTML = `<div class="shell"><aside class="sidebar"><div class="brand"><img src="mark.svg" alt=""><span>StockUp<small>Inventory workbench</small></span></div><div class="navgroup">Workspace</div><nav aria-label="Workspace navigation">${nav.map(([id, name, ic]) => `<button data-view="${id}" ${view === id ? 'aria-current="page"' : ""}>${icon(ic)} ${name}${id === "counts" && activeCounts().length ? `<span class="count">${activeCounts().length}</span>` : id === "transfers" && pending().length ? `<span class="count">${pending().length}</span>` : ""}</button>`).join("")}</nav><div class="sidebar-foot"><strong>Clarity over guesswork.</strong><p>Count what’s there.<br>Keep the story behind it.</p><a href="https://github.com/ahmad-527/stockup-inventory">Coursework & research ↗</a></div></aside><div class="workspace"><div class="topbar"><span class="workspace-label">${esc(state.name)}</span><div class="topbar-meta"><span class="saved"><i class="local-dot"></i>Saved in this browser</span><span class="preview">RESEARCH PROTOTYPE</span></div></div><main id="main" class="main" tabindex="-1"><div id="workspace-error" class="error" role="alert"></div><div id="page"></div><p class="footer-note">Local prototype · Single operator · No cloud sync or access roles. Records are not encrypted. Export backups regularly. Counts and alerts support your review; no automatic orders, forecasts or accounting valuation are produced.</p></main></div></div>`;
  (
    ({
      overview: renderOverview,
      inventory: renderInventory,
      counts: renderCounts,
      transfers: renderTransfers,
      activity: renderActivity,
      settings: renderSettings,
    })[view] || renderOverview
  )();
  if (externalChange) showExternalChange();
}
function itemRows(rows, compact = false) {
  return rows
    .map((p) => {
      const qty = location
          ? balance(state, p.id, location)
          : totalOnHand(state, p.id),
        st = itemStatus(state, p);
      return `<tr><td><div class="item-cell"><span class="item-art">${icon(p.unit === "kg" ? "leaf" : "box")}</span><div><button class="item-name" data-act="detail" data-id="${esc(p.id)}">${esc(p.name)}</button><div class="sub mono">${esc(p.sku)}</div></div></div></td>${compact ? "" : `<td>${esc(p.category)}</td>`}<td class="right num"><strong>${q(qty)}</strong> <small class="muted">${p.unit}</small><progress class="level ${st === "Low stock" || st === "Out of stock" ? "low" : ""}" value="${Math.min(100, p.max ? Math.round((qty / p.max) * 100) : 100)}" max="100" aria-label="${esc(p.name)} stock against target"></progress></td>${compact ? "" : `<td class="right num">${q(inTransit(state, p.id))} <small class="muted">${p.unit}</small></td>`}<td>${pill(st)}</td></tr>`;
    })
    .join("");
}
function renderOverview() {
  const low = state.items.filter((p) =>
    ["Low stock", "Out of stock"].includes(itemStatus(state, p)),
  );
  const cats = [...new Set(state.items.map((p) => p.category))].sort();
  const stats = [
    ["Tracked items", state.items.length, "Distinct SKUs", "box"],
    ["Need attention", low.length, "At or below minimum", "warning"],
    ["Open counts", activeCounts().length, "Saved, ready to resume", "count"],
    [
      "In-transit transfers",
      pending().length,
      "Awaiting receipt or return",
      "transfer",
    ],
  ];
  $("#page").innerHTML =
    header(
      "A clearer view of your stock.",
      "Receive it. Find it. Count it. Keep every change visible.",
      `<button data-act="move">${icon("plus")} Record movement</button><button class="primary" data-act="start-count">${icon("count")} Start a count</button>`,
      "Stockroom overview",
    ) +
    `<div class="stats">${stats.map(([label, value, note, ic]) => `<section class="card stat"><div class="stat-top">${label}${icon(ic)}</div><strong class="num">${value}</strong><small>${note}</small></section>`).join("")}</div><section class="hero"><div><div class="eyebrow">From shelf to certainty</div><h2>A count is only useful<br>when you can trust the change.</h2><p>Enter what you see first. Review the difference next. Apply only when the stock snapshot is still current.</p><div class="actions"><button class="primary" data-act="${activeCounts().length ? "resume-count" : "start-count"}">${activeCounts().length ? "Resume stock count" : "Start a blind count"} ${icon("arrow")}</button><button class="quiet" data-view="activity">See movement history</button></div></div><div class="hero-art">${art()}</div></section><div class="grid"><div class="stack"><section class="card"><div class="card-head"><div><h2>Stock to review</h2><p>Minimums use total on-hand stock across both locations.</p></div><button class="quiet" data-act="show-low">View inventory ${icon("arrow")}</button></div>${low.length ? `<div class="table-wrap"><table class="compact-table"><thead><tr><th>Item</th><th class="right">On hand</th><th>Stock status</th></tr></thead><tbody>${itemRows(low.slice(0, 5), true)}</tbody></table></div><div class="table-foot">${low.length} item${low.length === 1 ? "" : "s"} at or below minimum · In-transit stock excluded.</div>` : `<div class="empty">${icon("check")}<h2>${state.items.length ? "No low-stock items." : "Your shelves are ready."}</h2><p>${state.items.length ? "Every item is above its configured minimum. Check physical stock before making purchasing decisions." : "Add your first item, then record a receipt to bring it into stock."}</p><button data-act="add-item">Add an item</button></div>`}</section></div><div class="stack"><section class="card"><div class="card-head"><div><h2>Next actions</h2><p>A small queue. A clear next step.</p></div></div><div class="focus-row"><span class="bubble">${icon("count")}</span><div><h3>${activeCounts().length ? "Finish your saved counts" : "Check a location"}</h3><p>${activeCounts().length ? `${activeCounts().length} open count${activeCounts().length > 1 ? "s" : ""} waiting for review.` : "Start with one location and a physical count."}</p></div><button class="quiet" data-view="counts" aria-label="Open stock counts">${icon("arrow")}</button></div><div class="focus-row"><span class="bubble">${icon("transfer")}</span><div><h3>${pending().length ? "Confirm arriving stock" : "Move between locations"}</h3><p>${pending().length ? `${pending().length} transfer${pending().length > 1 ? "s" : ""} still in transit.` : "Dispatch first. Record receipt on arrival."}</p></div><button class="quiet" data-view="transfers" aria-label="Open transfers">${icon("arrow")}</button></div><div class="focus-row"><span class="bubble">${icon("down")}</span><div><h3>Keep a recoverable copy</h3><p>Download a backup before major changes.</p></div><button class="quiet" data-act="backup" aria-label="Download workspace backup">${icon("down")}</button></div></section><section class="card pad"><h2>Across your shelves</h2><p class="muted small">Distinct items by category, not quantities.</p>${
      cats.length
        ? cats
            .map((c) => {
              const n = state.items.filter((p) => p.category === c).length;
              return `<div class="category-row"><span>${esc(c)}</span><progress class="bar" value="${n}" max="${state.items.length}" aria-label="${esc(c)} item count"></progress><strong class="num">${n}</strong></div>`;
            })
            .join("")
        : '<p class="muted small">Categories appear when you add items.</p>'
    }</section></div></div>`;
}
function renderInventory() {
  $("#page").innerHTML =
    header(
      "Inventory",
      "A place for each item. A reason for every change.",
      `<button data-act="export-stock">${icon("down")} Export stock</button><button class="primary" data-act="add-item">${icon("plus")} Add item</button>`,
    ) +
    `<section class="card"><div class="toolbar"><label class="searchbox"><span class="sr-only">Find an item</span>${icon("search")}<input id="item-search" type="search" placeholder="Find an item, SKU or scan a barcode" value="${esc(search)}" autocomplete="off"></label><label><span class="sr-only">Category</span><select id="category-filter">${selectOptions([["", "All categories"], ...[...new Set(state.items.map((p) => p.category))].sort().map((c) => [c, c])], category)}</select></label><label><span class="sr-only">Stock status</span><select id="status-filter">${selectOptions([["", "All stock statuses"], ...["Low stock", "Out of stock", "In range", "Above target"].map((x) => [x, x])], status)}</select></label><label><span class="sr-only">Quantity location</span><select id="location-filter">${selectOptions([["", "All locations"], ...state.locations.map((l) => [l.id, l.name])], location)}</select></label></div><div id="inventory-results"></div></section>`;
  updateInventory();
}
function updateInventory() {
  const needle = search.trim().toLocaleLowerCase();
  const rows = state.items.filter(
    (p) =>
      (!needle ||
        [p.name, p.sku, p.barcode, p.category].some((x) =>
          x.toLocaleLowerCase().includes(needle),
        )) &&
      (!category || p.category === category) &&
      (!status || itemStatus(state, p) === status),
  );
  $("#inventory-results").innerHTML = rows.length
    ? `<div class="table-wrap"><table><thead><tr><th>Item / SKU</th><th>Category</th><th class="right">${esc(location ? loc(location) : "On hand")}</th><th class="right">In transit</th><th>Overall status</th></tr></thead><tbody>${itemRows(rows)}</tbody></table></div><div class="table-foot"><span role="status">${rows.length} of ${state.items.length} items</span> · Status uses both locations; quantity column follows the location filter. Keyboard barcode scanners can enter a code in search and press Enter.</div>`
    : `<div class="empty">${icon("search")}<h2>${state.items.length ? "No matching items." : "No items yet."}</h2><p>${state.items.length ? "Try a different name, SKU or barcode, or clear your filters." : "Add an item or import your catalogue in Workspace. Opening balances are recorded as receipts."}</p><button data-act="${state.items.length ? "clear-filters" : "add-item"}">${state.items.length ? "Clear filters" : "Add your first item"}</button></div>`;
}
function renderCounts() {
  const c =
    state.counts.find((c) => c.id === selectedCount) || activeCounts().at(-1);
  if (c) selectedCount = c.id;
  $("#page").innerHTML =
    header(
      "Stock counts",
      "Count first. Compare second. Change stock only after review.",
      `<button class="primary" data-act="start-count">${icon("plus")} New count</button>`,
    ) +
    `<div class="info">Expected quantities are hidden during entry to support a blind count. This is an interaction aid, not a permission boundary. Reviewed differences are counted minus expected, in each item's unit. Stock movements after the count starts require a fresh count before applying.</div><div id="count-workspace"></div><section class="card"><div class="card-head"><div><h2>Count history</h2><p>Closed sessions stay available for inspection.</p></div></div>${
      state.counts.length
        ? `<div class="table-wrap"><table><thead><tr><th>Count</th><th>Location</th><th>Started</th><th>Status</th><th></th></tr></thead><tbody>${[
            ...state.counts,
          ]
            .reverse()
            .map(
              (x) =>
                `<tr><td><strong>${esc(x.name)}</strong><div class="sub">${x.lines.length} item lines</div></td><td>${esc(loc(x.locationId))}</td><td class="small">${stamp(x.at)}</td><td>${pill(x.status)}</td><td><button data-act="open-count" data-id="${esc(x.id)}">${["counting", "review"].includes(x.status) ? "Resume" : "Inspect"}</button></td></tr>`,
            )
            .join("")}</tbody></table></div>`
        : `<div class="empty">${icon("count")}<h2>Start with one location.</h2><p>Create a count, enter physical quantities, then review every difference. Draft entries are saved when you choose Save counts.</p><button data-act="start-count">Start a stock count</button></div>`
    }</section>`;
  if (!c) return;
  const conflict = c.lines.some(
    (l) => l.version !== stockVersion(state, l.itemId, c.locationId),
  );
  const done = c.lines.filter((l) => l.counted !== null).length,
    closed = !["counting", "review"].includes(c.status);
  $("#count-workspace").innerHTML =
    `<section class="card count-panel"><div class="card-head"><div><h2>${esc(c.name)}</h2><p>${esc(loc(c.locationId))} · ${stamp(c.at)}</p></div>${pill(c.status)}</div>${!closed ? `<div class="count-progress"><progress value="${done}" max="${c.lines.length}" aria-label="Saved count progress"></progress><strong>${done} / ${c.lines.length} saved</strong><span class="muted">${c.status === "counting" ? "Expected quantities hidden during entry" : "Review against the starting snapshot"}</span></div>` : ""}${conflict && !closed ? '<div class="pad"><div class="info warning">Stock moved after this count started. No adjustment can be applied. Keep this session as a cancelled record and start a fresh physical count.</div></div>' : ""}<form id="count-form" data-form="count" data-id="${esc(c.id)}" data-revision="${state.revision}" data-workspace="${esc(state.workspaceId)}"><div class="table-wrap"><table class="count-review"><thead><tr><th>Item / SKU</th>${c.status === "counting" ? "" : '<th class="right">Expected at start</th>'}<th class="right">${c.status === "counting" ? "Physical count" : "Counted"}</th>${c.status === "counting" ? "" : '<th class="right">Difference</th>'}</tr></thead><tbody>${c.lines
      .map((l) => {
        const p = item(l.itemId);
        return `<tr><td><strong>${esc(p.name)}</strong><div class="sub mono">${esc(p.sku)} · ${p.unit}</div></td>${c.status === "counting" ? "" : `<td class="right num">${q(l.expected)} ${p.unit}</td>`}<td class="right">${c.status === "counting" ? `<label class="sr-only" for="count-${esc(p.id)}">Count ${esc(p.sku)}</label><input class="count-input" id="count-${esc(p.id)}" name="${esc(p.id)}" inputmode="decimal" autocomplete="off" placeholder="Not counted" value="${l.counted === null ? "" : q(l.counted)}">` : `<strong class="num">${l.counted === null ? "Not counted" : q(l.counted) + " " + p.unit}</strong>`}</td>${c.status === "counting" ? "" : `<td class="right num">${l.counted === null ? "—" : (l.counted - l.expected > 0 ? "+" : "") + q(l.counted - l.expected) + " " + p.unit}</td>`}</tr>`;
      })
      .join(
        "",
      )}</tbody></table></div>${closed ? `<div class="table-foot">${c.status === "applied" ? `Applied ${stamp(c.closedAt)} · Reason: ${esc(c.reason)}` : "Cancelled · Balances were not changed by this session."}</div>` : `<div class="count-actions">${c.status === "review" ? '<label>Adjustment reason<input name="reference" maxlength="120" required placeholder="Explain the verified difference"></label>' : '<span class="small muted">Use 0 for a verified zero. Blank means not counted.</span>'}<div class="actions"><button type="button" class="danger" data-act="cancel-count" data-id="${esc(c.id)}">Cancel count</button>${c.status === "counting" ? '<button type="submit" name="mode" value="save">Save counts</button><button class="primary" type="submit" name="mode" value="review">Review differences</button>' : `<button type="button" data-act="edit-count" data-id="${esc(c.id)}">Edit entries</button><button type="submit" class="primary" ${conflict ? "disabled" : ""}>Apply reviewed count</button>`}</div></div>`}</form></section><div class="section-gap"></div>`;
}
function renderTransfers() {
  $("#page").innerHTML =
    header(
      "Transfers",
      "Dispatch stock now. Record its arrival when it gets there.",
      `<button class="primary" data-act="dispatch">${icon("transfer")} New transfer</button>`,
    ) +
    `<div class="info">Dispatched stock is in transit: it is unavailable at either location until received. A return restores the source location. This prototype handles full receipts and full returns only; inspect actual goods before confirming.</div><section class="card"><div class="card-head"><div><h2>Between your locations</h2><p>${pending().length} transfer${pending().length === 1 ? "" : "s"} awaiting resolution</p></div></div>${
      state.transfers.length
        ? `<div class="table-wrap"><table><thead><tr><th>Item / reference</th><th>Route</th><th class="right">Quantity</th><th>Status</th><th>Next step</th></tr></thead><tbody>${[
            ...state.transfers,
          ]
            .reverse()
            .map(
              (t) =>
                `<tr><td><strong>${esc(item(t.itemId).name)}</strong><div class="sub">${esc(t.reference)}</div></td><td class="small">${esc(loc(t.from))}<br>→ ${esc(loc(t.to))}</td><td class="right num">${q(t.quantity)} ${item(t.itemId).unit}</td><td>${pill(t.status === "dispatched" ? "In transit" : t.status)}</td><td>${t.status === "dispatched" ? `<div class="actions"><button data-act="resolve-transfer" data-id="${esc(t.id)}" data-kind="receiveTransfer">Receive</button><button class="quiet" data-act="resolve-transfer" data-id="${esc(t.id)}" data-kind="cancelTransfer">Return to source</button></div>` : `<span class="small muted">${stamp(t.resolvedAt)}</span>`}</td></tr>`,
            )
            .join("")}</tbody></table></div>`
        : `<div class="empty">${icon("transfer")}<h2>Every move has two ends.</h2><p>Transfer items between your shop floor and stockroom. Track what left, what arrived, and what is still in transit.</p><button data-act="dispatch">Create a transfer</button></div>`
    }</section>`;
}
function renderActivity() {
  $("#page").innerHTML =
    header(
      "Movement history",
      "A quantity ledger you can inspect and export.",
      `<button data-act="export-ledger">${icon("down")} Export movement CSV</button><button class="primary" data-act="move">${icon("plus")} Record movement</button>`,
    ) +
    `<div class="info">Movements cannot be silently edited or deleted through this interface. Correct errors with an explicit movement and reference, or a reviewed physical count. This local history is not a tamper-proof audit trail.</div><section class="card"><div class="card-head"><h2>${state.movements.length} movement rows</h2><span class="small muted">Most recent first · latest 250 shown</span></div>${
      state.movements.length
        ? `<div class="table-wrap"><table><thead><tr><th>Item</th><th>Movement / reference</th><th>Location</th><th class="right">Change</th><th>Recorded</th></tr></thead><tbody>${[
            ...state.movements,
          ]
            .reverse()
            .slice(0, 250)
            .map(
              (m) =>
                `<tr><td><button class="item-name" data-act="detail" data-id="${esc(m.itemId)}">${esc(item(m.itemId).name)}</button><div class="sub mono">${esc(item(m.itemId).sku)}</div></td><td><strong>${esc(m.kind)}</strong><div class="sub">${esc(m.reference)}</div></td><td>${esc(loc(m.locationId))}</td><td class="right num"><strong>${m.delta > 0 ? "+" : ""}${q(m.delta)}</strong> ${item(m.itemId).unit}</td><td class="small">${stamp(m.at)}</td></tr>`,
            )
            .join("")}</tbody></table></div>`
        : '<div class="empty"><h2>No stock movements yet.</h2><p>Add an item, then record its first receipt. Quantities are derived from this movement ledger.</p></div>'
    }</section>`;
}
function renderSettings() {
  $("#page").innerHTML =
    header(
      "Your workspace",
      "Keep your catalogue portable and your stock recoverable.",
    ) +
    `<div class="settings-grid"><section class="card pad"><h2>Workspace details</h2><p>One browser workspace with two fixed locations. No account or remote service.</p><form data-form="rename" data-revision="${state.revision}" data-workspace="${esc(state.workspaceId)}"><label>Workspace name<input name="name" value="${esc(state.name)}" maxlength="60" required></label><button type="submit" class="primary">Save name</button></form><div class="mini-list"><span class="pill gray">Shop floor</span><span class="pill gray">Stockroom</span></div></section><section class="card pad"><h2>Backup & restore</h2><p>JSON backups include items, movements, count sessions, transfers and references. They are unencrypted. Keep copies somewhere private.</p><button class="primary" data-act="backup">${icon("down")} Download full backup</button><p class="small">Restoring replaces this browser workspace after validation and confirmation. Export the current workspace first. Unsupported or inconsistent files are rejected.</p><label>Choose a StockUp JSON backup<input id="restore-file" class="file-input" type="file" accept=".json,application/json"></label><button data-act="restore-file">Inspect backup to restore</button></section><section class="card pad"><h2>Import item catalogue</h2><p>Import product definitions, not quantities. Balances start at zero and are recorded through receipts. The import is atomic: one invalid row rejects the entire file.</p><button data-act="template">${icon("down")} Download CSV template</button><label>Choose catalogue CSV<input id="import-file" class="file-input" type="file" accept=".csv,text/csv"></label><button data-act="import-file">Inspect CSV import</button><details class="paste-option"><summary>Paste CSV instead</summary><label>Catalogue CSV text<textarea id="catalogue-paste" spellcheck="false" placeholder="sku,name,category,unit,barcode,min,max"></textarea></label><button data-act="import-paste">Inspect pasted CSV</button></details><p class="small">Exact columns: <code>sku,name,category,unit,barcode,min,max</code>. Units: <code>pcs</code> (whole pieces), <code>kg</code> (up to 3 decimals). Maximum 1,000 total items.</p></section><section class="card pad"><h2>Scope & data control</h2><p>Nothing is sent by the app. Hosting still receives ordinary page requests. Browser storage is shared by tabs on this origin and can be cleared or evicted. Anyone using this browser profile can access it.</p><p>No multi-user roles, camera scanning, RFID, lots, expiry, partial transfer receipts, purchases, ERP sync, forecasts or accounting valuation are implemented.</p><p>The original coursework remains separate. The 100-paper / 20-app gate and practitioner validation remain open.</p><a href="https://github.com/ahmad-527/stockup-inventory/tree/main/docs/flagship">View evidence and known limits ↗</a></section></div>`;
}
function openModal(title, description, body, context) {
  formContext = context || {
    revision: state.revision,
    workspaceId: state.workspaceId,
  };
  modal.innerHTML = `<div class="modal-head"><div><h2 id="modal-title">${esc(title)}</h2><p>${esc(description)}</p></div><button class="quiet" data-act="close-modal" aria-label="Close dialog">${icon("close")}</button></div><div class="modal-body"><div id="modal-error" class="error" role="alert"></div>${body}</div>`;
  if (!modal.open) modal.showModal();
}
const formActions = (label) =>
  `<div class="modal-actions"><button type="button" data-act="close-modal">Cancel</button><button class="primary" type="submit">${label}</button></div>`;
function openItem(id) {
  const p = item(id);
  if (!p) throw new Error("Item is no longer available.");
  const ms = state.movements
    .filter((m) => m.itemId === id)
    .slice(-8)
    .reverse();
  openModal(
    p.name,
    `${p.sku} · ${p.category} · ${p.unit}${p.barcode ? " · Barcode: " + p.barcode : ""}`,
    `<div class="actions"><button class="primary" data-act="move" data-id="${esc(id)}">Record movement</button><button data-act="edit-item" data-id="${esc(id)}">Edit details</button></div><div class="detail-numbers">${state.locations.map((l) => `<div><small>${esc(l.name)}</small><strong>${q(balance(state, id, l.id))}</strong> <small>${p.unit}</small></div>`).join("")}<div><small>In transit</small><strong>${q(inTransit(state, id))}</strong><small>${p.unit}</small></div></div><p class="small muted">Minimum ${q(p.min)} ${p.unit} · Target ${q(p.max)} ${p.unit} · ${esc(itemStatus(state, p))}</p><h3 class="detail-heading">Recent movement history</h3><div class="timeline">${ms.map((m) => `<div class="timeline-row"><div><strong>${esc(m.kind)} · ${esc(loc(m.locationId))}</strong><p>${esc(m.reference)} · ${stamp(m.at)}</p></div><strong class="num">${m.delta > 0 ? "+" : ""}${q(m.delta)} ${p.unit}</strong></div>`).join("") || '<p class="muted small">No movements recorded.</p>'}</div>`,
  );
}
function itemForm(p) {
  openModal(
    p ? "Edit item details" : "Add an inventory item",
    p
      ? "SKU, unit and barcode are fixed in this prototype to protect stock identity."
      : "Start with the item definition. Record opening quantities as a receipt.",
    `<form data-form="${p ? "update-item" : "add-item"}" data-id="${esc(p?.id || "")}"><div class="form-grid"><label class="full">Item name<input name="name" maxlength="100" required value="${esc(p?.name || "")}"></label>${p ? `<div class="info full">${esc(p.sku)} · ${p.unit} · Barcode ${esc(p.barcode || "not set")}</div>` : '<label>SKU<input name="sku" maxlength="40" required placeholder="e.g. NL-501" autocomplete="off"></label><label>Unit<select name="unit"><option value="pcs">Pieces (pcs)</option><option value="kg">Kilograms (kg)</option></select></label><label class="full">Barcode / scanner code <small>Optional. Exact match; no GTIN certification.</small><input name="barcode" maxlength="80" autocomplete="off"></label>'}<label class="full">Category<input name="category" maxlength="50" required value="${esc(p?.category || "General")}"></label><label>Minimum stock<input name="min" inputmode="decimal" required value="${p ? q(p.min) : "0"}"></label><label>Target stock<input name="max" inputmode="decimal" required value="${p ? q(p.max) : "0"}"></label></div>${formActions(p ? "Save details" : "Add item")}</form>`,
  );
}
function movementForm(id, transfer = false) {
  if (!state.items.length) {
    itemForm();
    return;
  }
  openModal(
    transfer ? "Dispatch a transfer" : "Record a stock movement",
    transfer
      ? "Source stock becomes unavailable until received or returned."
      : "Use a clear delivery, sale, return or correction reference.",
    `<form data-form="${transfer ? "dispatch" : "move"}"><div class="form-grid"><label class="full">Item<select name="itemId">${selectOptions(
      state.items.map((p) => [p.id, `${p.sku} · ${p.name} (${p.unit})`]),
      id || state.items[0].id,
    )}</select></label>${transfer ? `<label>From<select name="from">${locationOptions("shop")}</select></label><label>To<select name="to">${locationOptions("store")}</select></label>` : `<label>Movement<select name="kind"><option value="receive">Receive stock</option><option value="issue">Issue / sell stock</option><option value="return">Restockable customer return</option><option value="writeoff">Write off / reduce stock</option></select></label><label>Location<select name="locationId">${locationOptions("shop")}</select></label>`}<label class="full">Quantity<input name="quantity" inputmode="decimal" required autocomplete="off" placeholder="Whole pcs, or kg to 3 decimals"><small>Use the selected item's unit. No unit conversion is applied.</small></label><label class="full">${transfer ? "Transfer reference" : "Reference / reason"}<input name="reference" maxlength="120" required placeholder="e.g. Delivery DN-1042, checked on arrival"></label><div class="info full">Restockable returns increase available stock. Damaged goods must stay outside this prototype's available stock. It has no quarantine or reserved-stock accounting.</div></div>${formActions(transfer ? "Dispatch stock" : "Record movement")}</form>`,
  );
}
function newCount() {
  if (!state.items.length) {
    itemForm();
    return;
  }
  openModal(
    "Start a physical stock count",
    "All current catalogue items are included at this location. Pause stock movements while physically counting.",
    `<form data-form="start-count"><div class="form-grid"><label class="full">Count name<input name="name" required maxlength="80" value="${esc("Stock check · " + new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" }).format(new Date()))}"></label><label class="full">Location<select name="locationId">${locationOptions("shop")}</select></label></div><div class="info">Quantities are captured at the start. Enter actual physical counts before comparing. If stock moves after this snapshot, a fresh count will be required.</div>${formActions("Start blind count")}</form>`,
  );
}
function download(name, raw, type) {
  const url = URL.createObjectURL(new Blob([raw], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
const filename = (suffix) =>
  `stockup-${new Date().toISOString().slice(0, 10)}-${suffix}`;
async function backup() {
  const latest = await read(db);
  if (!latest) throw new Error("Workspace not available.");
  download(
    filename("backup.json"),
    JSON.stringify(latest, null, 2) + "\n",
    "application/json",
  );
  toast("Backup download started. Keep the unencrypted file private.");
}

document.addEventListener("input", (e) => {
  if (e.target.id === "item-search") {
    search = e.target.value;
    updateInventory();
  }
});
document.addEventListener("change", (e) => {
  if (e.target.id === "category-filter") category = e.target.value;
  else if (e.target.id === "status-filter") status = e.target.value;
  else if (e.target.id === "location-filter") location = e.target.value;
  else return;
  updateInventory();
});
document.addEventListener("keydown", (e) => {
  if (e.target.id === "item-search" && e.key === "Enter") {
    e.preventDefault();
    const match = state.items.find(
      (p) =>
        p.barcode === search.trim() ||
        p.sku.toLowerCase() === search.trim().toLowerCase(),
    );
    if (match) openItem(match.id);
    else toast("No exact SKU or barcode match. Search results remain below.");
  }
});
document.addEventListener("click", async (e) => {
  const b = e.target.closest("button");
  if (!b || (b.type === "submit" && b.closest("form"))) return;
  try {
    if (
      countDirty() &&
      (b.dataset.view ||
        (b.dataset.act &&
          ![
            "backup",
            "close-modal",
            "export-count-draft",
            "discard-refresh",
          ].includes(b.dataset.act)))
    ) {
      openModal(
        "Unsaved count entries",
        "Your physical observations have not been saved.",
        `<p>Keep editing and choose Save counts to commit them. If this workspace changed elsewhere, export these draft observations before refreshing.</p><div class="modal-actions"><button data-act="export-count-draft">Download draft CSV</button><button data-act="discard-refresh" class="danger">Discard unsaved entries and refresh</button><button data-act="close-modal" class="primary">Keep editing</button></div>`,
      );
      return;
    }
    if (b.dataset.view) {
      if (modal.open) modal.close();
      view = b.dataset.view;
      search = "";
      category = "";
      status = "";
      location = "";
      render();
      $("#main").focus();
      return;
    }
    const id = b.dataset.id;
    switch (b.dataset.act) {
      case "begin-demo":
      case "begin-empty":
        state = await initialise(db, b.dataset.act === "begin-demo");
        render();
        $("#main").focus();
        break;
      case "refresh":
        state = await read(db);
        externalChange = false;
        render();
        toast("Workspace refreshed. Review any open form before submitting.");
        break;
      case "close-modal":
        modal.close();
        break;
      case "close-refresh":
        modal.close();
        state = await read(db);
        externalChange = false;
        render();
        toast(
          "Workspace refreshed. Reopen the action and review the latest stock before submitting.",
        );
        break;
      case "export-count-draft": {
        const f = $("#count-form"),
          count = state.counts.find((c) => c.id === f.dataset.id);
        const rows = [
          ["count", "location", "sku", "physical_observation", "unit"],
          ...count.lines.map((l) => [
            count.name,
            loc(count.locationId),
            item(l.itemId).sku,
            f.elements.namedItem(l.itemId).value,
            item(l.itemId).unit,
          ]),
        ];
        download(
          filename("unsaved-count.csv"),
          rows.map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n",
          "text/csv;charset=utf-8",
        );
        toast(
          "Draft observations downloaded. This CSV is a reference, not a restorable workspace backup.",
        );
        break;
      }
      case "discard-refresh":
        modal.close();
        state = await read(db);
        externalChange = false;
        render();
        toast("Workspace refreshed. Unsaved form entries were discarded.");
        break;
      case "add-item":
        itemForm();
        break;
      case "edit-item":
        itemForm(item(id));
        break;
      case "detail":
        openItem(id);
        break;
      case "move":
        movementForm(id);
        break;
      case "dispatch":
        movementForm(undefined, true);
        break;
      case "start-count":
        newCount();
        break;
      case "resume-count":
        view = "counts";
        selectedCount = activeCounts().at(-1)?.id || "";
        render();
        break;
      case "open-count":
        selectedCount = id;
        renderCounts();
        break;
      case "show-low":
        view = "inventory";
        status = "Low stock";
        render();
        break;
      case "clear-filters":
        search = "";
        category = "";
        status = "";
        location = "";
        renderInventory();
        $("#item-search").focus();
        break;
      case "edit-count":
        await execute({ type: "editCount", countId: id });
        break;
      case "cancel-count": {
        const c = state.counts.find((c) => c.id === id);
        openModal(
          "Cancel this count?",
          `The saved entries in “${c.name}” remain in history. This does not change stock.`,
          `<form data-form="cancel-count" data-id="${esc(id)}"><p>To retry after stock has moved, start a new physical count with a fresh snapshot.</p>${formActions("Cancel count")}</form>`,
        );
        break;
      }
      case "resolve-transfer": {
        const t = state.transfers.find((t) => t.id === id),
          receive = b.dataset.kind === "receiveTransfer";
        openModal(
          receive
            ? "Confirm full transfer receipt"
            : "Confirm return to source",
          `${q(t.quantity)} ${item(t.itemId).unit} · ${item(t.itemId).name}`,
          `<form data-form="resolve-transfer" data-id="${esc(id)}" data-kind="${esc(b.dataset.kind)}"><p>${receive ? `Confirm the full quantity physically arrived at ${esc(loc(t.to))}.` : `Confirm the full quantity is physically back at ${esc(loc(t.from))}.`}</p><p class="muted small">Reference: ${esc(t.reference)}. Do not confirm a partial or damaged arrival; this prototype cannot account for it.</p>${formActions(receive ? "Receive full quantity" : "Return full quantity")}</form>`,
        );
        break;
      }
      case "backup":
        await backup();
        break;
      case "export-stock":
        download(
          filename("stock.csv"),
          stockCsv(await read(db)),
          "text/csv;charset=utf-8",
        );
        toast(
          "Stock CSV download started. Use a full JSON backup for restore.",
        );
        break;
      case "export-ledger": {
        const s = await read(db);
        const rows = [
          [
            "id",
            "recorded_at",
            "sku",
            "item",
            "location",
            "movement",
            "quantity",
            "unit",
            "reference",
          ],
          ...s.movements.map((m) => {
            const p = s.items.find((p) => p.id === m.itemId);
            return [
              m.id,
              m.at,
              p.sku,
              p.name,
              loc(m.locationId),
              m.kind,
              q(m.delta),
              p.unit,
              m.reference,
            ];
          }),
        ];
        download(
          filename("movements.csv"),
          rows.map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n",
          "text/csv;charset=utf-8",
        );
        toast("Movement CSV download started.");
        break;
      }
      case "template":
        download(
          "stockup-catalogue-template.csv",
          "sku,name,category,unit,barcode,min,max\r\nNEW-001,Example item,General,pcs,,2,10\r\n",
          "text/csv;charset=utf-8",
        );
        break;
      case "import-file":
      case "import-paste": {
        let raw;
        if (b.dataset.act === "import-paste") raw = $("#catalogue-paste").value;
        else {
          const file = $("#import-file").files[0];
          if (!file) throw new Error("Choose a CSV file first.");
          if (file.size > 1_000_000)
            throw new Error("CSV must be smaller than 1 MB.");
          raw = await file.text();
        }
        const rows = parseItemsCsv(raw);
        openModal(
          "Review catalogue import",
          `${rows.length} new item definitions. Existing records will be retained.`,
          `<form data-form="import" ><div class="info">Quantities are not imported. New items start at zero. Duplicate SKUs/barcodes or invalid rows reject the whole import.</div><div class="table-wrap"><table><thead><tr><th>SKU</th><th>Item</th><th>Unit</th></tr></thead><tbody>${rows
            .slice(0, 8)
            .map(
              (r) =>
                `<tr><td class="mono">${esc(r.sku)}</td><td>${esc(r.name)}</td><td>${esc(r.unit)}</td></tr>`,
            )
            .join(
              "",
            )}</tbody></table></div>${rows.length > 8 ? '<p class="small muted">First 8 rows shown; every row will be validated.</p>' : ""}${formActions("Import catalogue")}</form>`,
        );
        modal.pendingRows = rows;
        break;
      }
      case "restore-file": {
        const file = $("#restore-file").files[0];
        if (!file) throw new Error("Choose a backup file first.");
        if (file.size > 12_000_000)
          throw new Error("Backup must be smaller than 12 MB.");
        const raw = await file.text(),
          value = validateState(JSON.parse(raw));
        openModal(
          "Replace this browser workspace?",
          `Restore ${value.items.length} items and ${value.movements.length} movements from “${value.name}”.`,
          `<form data-form="restore"><div class="info warning">The current workspace will be replaced. Download its full backup first. Restore checks structure and stock consistency, not authorship or authenticity.</div><button type="button" data-act="backup">Download current backup</button><label class="confirm-check"><input name="confirm" type="checkbox" required> I have backed up this workspace and want to replace it.</label>${formActions("Restore backup")}</form>`,
        );
        modal.pendingBackup = raw;
        break;
      }
    }
  } catch (e) {
    showError(e);
  }
});
document.addEventListener("submit", async (e) => {
  const f = e.target;
  if (!f.dataset.form) return;
  e.preventDefault();
  const data = Object.fromEntries(new FormData(f));
  const mode = f.dataset.form,
    submit = e.submitter;
  if (submit?.disabled) return;
  if (submit) submit.disabled = true;
  const ctx = modal.open
    ? formContext
    : {
        revision: Number(f.dataset.revision),
        workspaceId: f.dataset.workspace,
      };
  try {
    let c,
      message = "Saved.";
    switch (mode) {
      case "add-item":
        c = { type: "addItem", ...data };
        message = "Item added. Record its opening stock as a receipt.";
        break;
      case "update-item":
        c = { type: "updateItem", itemId: f.dataset.id, ...data };
        message = "Item details saved. Historical movements retained.";
        break;
      case "move":
        c = { type: "move", ...data };
        message = "Stock movement recorded.";
        break;
      case "dispatch":
        c = { type: "dispatch", ...data };
        message = "Transfer dispatched. Stock is now in transit.";
        break;
      case "rename":
        c = { type: "rename", ...data };
        break;
      case "start-count":
        c = { type: "startCount", ...data };
        message = "Count started. Enter the quantities you physically observe.";
        break;
      case "cancel-count":
        c = { type: "cancelCount", countId: f.dataset.id };
        message = "Count cancelled. Stock unchanged.";
        break;
      case "resolve-transfer":
        c = { type: f.dataset.kind, transferId: f.dataset.id };
        message = "Transfer resolved and ledger updated.";
        break;
      case "count": {
        const count = state.counts.find((c) => c.id === f.dataset.id);
        if (count.status === "counting")
          c = {
            type: "saveCount",
            countId: count.id,
            entries: Object.entries(data)
              .filter(([, v]) => v !== "")
              .map(([itemId, quantity]) => ({ itemId, quantity })),
            review: submit?.value === "review",
          };
        else
          c = {
            type: "applyCount",
            countId: count.id,
            reference: data.reference,
          };
        message =
          c.type === "applyCount"
            ? "Reviewed count applied. Adjustments are in movement history."
            : c.review
              ? "Entries saved. Review the differences before applying."
              : "Count entries saved. You can resume later.";
        break;
      }
      case "import":
        c = { type: "importItems", rows: modal.pendingRows };
        message = "Catalogue imported. New items have zero opening balances.";
        break;
      case "restore": {
        if (data.confirm !== "on")
          throw new Error("Confirm that you backed up this workspace first.");
        state = await restore(
          db,
          modal.pendingBackup,
          ctx.revision,
          ctx.workspaceId,
        );
        modal.close();
        selectedCount = "";
        externalChange = false;
        channel?.postMessage("changed");
        render();
        toast("Backup restored. Review the inventory and history.");
        return;
      }
      default:
        throw new Error("Unknown form.");
    }
    await execute(c, ctx, false);
    if (mode === "start-count") {
      selectedCount = state.counts.at(-1).id;
      view = "counts";
    }
    if (modal.open) modal.close();
    render();
    toast(message);
    if (mode === "count")
      $("#count-workspace")?.scrollIntoView({ block: "start" });
  } catch (err) {
    showError(err);
  } finally {
    if (submit?.isConnected) submit.disabled = false;
  }
});
window.addEventListener("beforeunload", (e) => {
  if (countDirty()) {
    e.preventDefault();
    e.returnValue = "";
  }
});
try {
  db = await openStore();
  state = await read(db);
  if (state) validateState(state);
  render();
} catch (e) {
  root.innerHTML = `<main id="main" class="boot"><h1>StockUp</h1><div class="error" role="alert">${esc(e.message)}</div><p>No workspace has been reset. Try reopening in a regular browser window with site storage enabled.</p><p><a href="https://github.com/ahmad-527/stockup-inventory">Source and recovery guidance</a></p></main>`;
}
