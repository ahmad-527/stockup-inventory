import {
  applyCommand,
  emptyState,
  seedState,
  validateState,
  StockError,
} from "./core.mjs";
const DB = "stockup-research-v1";
export async function openStore() {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore("workspaces");
    r.onerror = () =>
      reject(
        new Error(
          "Browser storage is unavailable. Enable site storage or try a regular browser window.",
        ),
      );
    r.onblocked = () =>
      reject(
        new Error(
          "Close other StockUp tabs, then reload to update browser storage.",
        ),
      );
    r.onsuccess = () => resolve(r.result);
  });
}
export async function read(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("workspaces", "readonly"),
      r = tx.objectStore("workspaces").get("main");
    tx.oncomplete = () => resolve(r.result || null);
    tx.onerror = () => reject(tx.error);
  });
}
export function transact(db, action) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("workspaces", "readwrite"),
      store = tx.objectStore("workspaces"),
      r = store.get("main");
    let result, error;
    r.onsuccess = () => {
      try {
        result = action(r.result || null);
        store.put(result, "main");
      } catch (e) {
        error = e;
        tx.abort();
      }
    };
    tx.oncomplete = () => resolve(result);
    tx.onabort = () =>
      reject(
        error ||
          new Error(
            "Storage write failed; no changes were committed. Check available browser storage.",
          ),
      );
    tx.onerror = () => {
      error ||= tx.error;
    };
  });
}
export const initialise = (db, demo) =>
  transact(
    db,
    (old) =>
      old ||
      (demo ? seedState(crypto.randomUUID()) : emptyState(crypto.randomUUID())),
  );
export const commit = (
  db,
  c,
  revision,
  workspaceId,
  id = crypto.randomUUID(),
) =>
  transact(db, (old) => {
    if (!old || old.workspaceId !== workspaceId)
      throw new StockError(
        "STALE",
        "Workspace was replaced. Reload before continuing.",
      );
    return applyCommand(old, c, {
      id,
      at: new Date().toISOString(),
      expectedRevision: revision,
    });
  });
export function restore(db, raw, revision, workspaceId) {
  if (typeof raw !== "string" || raw.length > 12_000_000)
    throw new Error("Backup exceeds the 12 MB limit.");
  const value = validateState(JSON.parse(raw));
  return transact(db, (old) => {
    if (!old || old.revision !== revision || old.workspaceId !== workspaceId)
      throw new StockError(
        "STALE",
        "Workspace changed. Export it and review before restoring.",
      );
    // A new identity invalidates existing forms, even if the restored revision matches.
    return { ...value, workspaceId: crypto.randomUUID() };
  });
}
