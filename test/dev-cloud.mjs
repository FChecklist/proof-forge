// Local stand-in for the hosted site: serves dist/ and runs the REAL /api functions against an in-memory D1.
// E-mails go to a capture list (GET /__mails), not to the internet. GET /__db shows what the storage holds (for the privacy audit).
// Run: node test/dev-cloud.mjs [port]   (build first: node tools/build-dist.cjs)
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url";
import * as W from "../functions/api/w/[token].js"; import * as G from "../functions/api/g/[token].js"; import * as V from "../functions/api/v/[id].js"; import * as N from "../functions/api/n.js"; import * as C from "../functions/api/c.js";
import { fakeD1 } from "./fake-d1.mjs";
const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "dist");
export const SECRET = "e2e-shared-secret";
export function start(port = 8230) {
  const DB = fakeD1(), env = { DB, ACCESS_SECRET: SECRET, RESEND_API_KEY: "re_test", OWNER_EMAIL: "owner@example.com" }, mails = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (u, init) => { if (String(u).includes("api.resend.com")) { const b = JSON.parse(init.body); mails.push({ to: b.to[0], subject: b.subject, text: b.text }); return new Response("{}", { status: 200 }); } return realFetch(u, init); };
  const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".txt": "text/plain", ".svg": "image/svg+xml", ".json": "application/json", ".woff2": "font/woff2" };
  const server = http.createServer(async (req, res) => {
    const u = new URL(req.url, "http://localhost");
    if (u.pathname === "/__mails") { res.writeHead(200, { "content-type": "application/json" }); return res.end(JSON.stringify(mails)); }
    if (u.pathname === "/__db") { res.writeHead(200, { "content-type": "application/json" }); return res.end(JSON.stringify({ witness: [...DB.t.witness.entries()], go: DB.t.go, vault: [...DB.t.vault.values()], log: DB.t.log, claims: [...DB.t.claims.values()], access: [...DB.t.access.entries()] })); }
    const m = /^\/api\/(w|g|v)\/([^/]+)$/.exec(u.pathname), simple = /^\/api\/(n|c)$/.exec(u.pathname);
    if (m || simple) {
      const chunks = []; for await (const c of req) chunks.push(c); const body = Buffer.concat(chunks);
      const request = new Request("http://localhost" + req.url, { method: req.method, headers: Object.assign({}, req.headers, { "cf-connecting-ip": req.headers["x-test-ip"] || "9.9.9.9" }), body: ["GET", "HEAD"].includes(req.method) ? undefined : body });
      const mod = m ? { w: W, g: G, v: V }[m[1]] : { n: N, c: C }[simple[1]], fn = mod["onRequest" + req.method[0] + req.method.slice(1).toLowerCase()];
      const r = fn ? await fn({ request, env, params: { token: m && m[2], id: m && m[2] } }) : new Response("no", { status: 405 });
      res.writeHead(r.status, Object.fromEntries(r.headers)); return res.end(Buffer.from(await r.arrayBuffer()));
    }
    const f = path.join(dist, u.pathname === "/" ? "index.html" : u.pathname); if (!f.startsWith(dist) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end("nf"); }
    res.writeHead(200, { "content-type": MIME[path.extname(f)] || "application/octet-stream" }); res.end(fs.readFileSync(f));
  });
  return new Promise((ok) => server.listen(port, "127.0.0.1", () => ok({ server, env, mails, DB, port })));
}
if (process.argv[1] && process.argv[1].endsWith("dev-cloud.mjs")) start(Number(process.argv[2] || 8230)).then((s) => console.log("cloud stand-in on http://127.0.0.1:" + s.port));
