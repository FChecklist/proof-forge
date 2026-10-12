// Local stand-in for the hosted site: serves dist/ and runs the REAL /api functions against an in-memory D1.
// Run: node test/dev-cloud.mjs [port]   (build first: node tools/build-dist.cjs)
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url";
import * as W from "../functions/api/w/[token].js"; import * as G from "../functions/api/g/[token].js"; import * as V from "../functions/api/v/[id].js"; import { fakeD1 } from "./fake-d1.mjs";
const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "dist"), env = { DB: fakeD1() }, port = Number(process.argv[2] || 8230);
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".txt": "text/plain", ".svg": "image/svg+xml" };
export const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://localhost");
  const m = /^\/api\/(w|g|v)\/([^/]+)$/.exec(u.pathname);
  if (m) {
    const chunks = []; for await (const c of req) chunks.push(c); const body = Buffer.concat(chunks);
    const request = new Request("http://localhost" + req.url, { method: req.method, headers: Object.assign({ "cf-connecting-ip": "9.9.9.9" }, req.headers), body: ["GET", "HEAD"].includes(req.method) ? undefined : body });
    const mod = { w: W, g: G, v: V }[m[1]], fn = mod["onRequest" + req.method[0] + req.method.slice(1).toLowerCase()];
    const r = fn ? await fn({ request, env, params: { token: m[2], id: m[2] } }) : new Response("no", { status: 405 });
    res.writeHead(r.status, Object.fromEntries(r.headers)); res.end(Buffer.from(await r.arrayBuffer())); return;
  }
  let f = path.join(dist, u.pathname === "/" ? "index.html" : u.pathname); if (!f.startsWith(dist) || !fs.existsSync(f)) { res.writeHead(404); res.end("nf"); return; }
  res.writeHead(200, { "content-type": MIME[path.extname(f)] || "application/octet-stream" }); res.end(fs.readFileSync(f));
});
server.listen(port, "127.0.0.1", () => console.log("cloud stand-in on http://127.0.0.1:" + port));
export { env };
