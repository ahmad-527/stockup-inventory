import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { request } from "node:http";
test("loopback server serves only app assets and rejects cross-host/method/path access", async (t) => {
  const child = spawn(process.execPath, ["scripts/serve.mjs"], {
    env: { ...process.env, PORT: "4187" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  t.after(() => child.kill());
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Test server did not become ready.")),
      5000,
    );
    child.once("error", reject);
    child.stdout.once("data", () => {
      clearTimeout(timeout);
      resolve();
    });
    child.stderr.once("data", (raw) => {
      clearTimeout(timeout);
      reject(new Error(String(raw)));
    });
  });
  const get = (path = "/", method = "GET", host = "127.0.0.1:4187") =>
    new Promise((resolve, reject) => {
      const req = request(
        {
          host: "127.0.0.1",
          port: 4187,
          path,
          method,
          headers: { Host: host },
        },
        (res) => {
          let body = "";
          res.on("data", (b) => (body += b));
          res.on("end", () =>
            resolve({ status: res.statusCode, headers: res.headers, body }),
          );
        },
      );
      req.on("error", reject);
      req.end();
    });
  const page = await get();
  assert.equal(page.status, 200);
  assert.match(page.body, /Inventory workbench/);
  assert.equal(page.headers["x-content-type-options"], "nosniff");
  assert.equal((await get("/core.mjs")).status, 200);
  assert.equal((await get("/core.mjs", "HEAD")).body, "");
  assert.equal((await get("/", "POST")).status, 403);
  assert.equal((await get("/", "GET", "evil.invalid")).status, 403);
  assert.equal((await get("/%2e%2e%2fpackage.json")).status, 404);
  assert.equal((await get("/.git/config")).status, 404);
});
