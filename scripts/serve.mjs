import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve, extname, sep } from "node:path";
const folder = resolve(dirname(fileURLToPath(import.meta.url)), "../app");
const port = Number(process.env.PORT || 4174);
if (!Number.isInteger(port) || port < 1024 || port > 65535)
  throw new Error("PORT must be 1024–65535.");
const types = {
  ".html": "text/html; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
};
const server = createServer(async (req, res) => {
  const headers = {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Cache-Control": "no-store",
    "Cross-Origin-Resource-Policy": "same-origin",
    "X-Frame-Options": "DENY",
  };
  if (
    !["GET", "HEAD"].includes(req.method) ||
    ![`127.0.0.1:${port}`, `localhost:${port}`].includes(req.headers.host)
  ) {
    res.writeHead(403, headers).end("Forbidden");
    return;
  }
  try {
    const path = decodeURIComponent(
      new URL(req.url, `http://127.0.0.1:${port}`).pathname,
    );
    const file = resolve(folder, "." + (path === "/" ? "/index.html" : path));
    if (!file.startsWith(folder + sep) || !types[extname(file)]) {
      res.writeHead(404, headers).end("Not found");
      return;
    }
    const raw = await readFile(file);
    res.writeHead(200, { ...headers, "Content-Type": types[extname(file)] });
    res.end(req.method === "HEAD" ? undefined : raw);
  } catch {
    res.writeHead(404, headers).end("Not found");
  }
});
server.listen(port, "127.0.0.1", () =>
  process.stdout.write(`StockUp: http://127.0.0.1:${port}\n`),
);
