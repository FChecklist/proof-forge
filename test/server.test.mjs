// Tests the Pages Functions with an in-memory stand-in for D1. Run: node test/server.test.mjs
import * as W from "../functions/api/w/[token].js";
import * as Vt from "../functions/api/v/[id].js";
import assert from "node:assert/strict";
const rows = { witness: new Map(), vault: new Map() };
const DB = { prepare(sql) { return { bind(...a) { return {
  async run() { if (sql.startsWith("INSERT OR IGNORE INTO witness")) { if (rows.witness.has(a[0])) return { meta: { changes: 0 } }; rows.witness.set(a[0], { rec: a[1], at: a[3] }); return { meta: { changes: 1 } }; }
    if (sql.startsWith("INSERT INTO vault")) { rows.vault.set(a[0], { secret_hash: a[1], meta: a[2], blob: a[3], at: a[4] }); return { meta: { changes: 1 } }; } },
  async first() { if (sql.includes("FROM witness")) return rows.witness.get(a[0]) || null; if (sql.includes("secret_hash")) { const r = rows.vault.get(a[0]); return r ? { secret_hash: r.secret_hash } : null; } if (sql.includes("FROM vault")) return rows.vault.get(a[0]) || null; } }; } }; } };
const env = { DB };
const post = (tok, body) => W.onRequestPost({ request: new Request("http://x/api/w/" + tok, { method: "POST", body: typeof body === "string" ? body : JSON.stringify(body), headers: { "cf-connecting-ip": "1.2.3.4" } }), env, params: { token: tok } });
const get = (tok) => W.onRequestGet({ env, params: { token: tok } });
const T = "wabcdefgh12345";
assert.equal((await post(T, { k: "funder", rel: "investor", stage: "received", amt: 750000, know: "stranger", device: "dx", at: 1 })).status, 201);
assert.equal((await post(T, { k: "funder", amt: 1 })).status, 409, "a witness answer can never be overwritten");
const g = await (await get(T)).json(); assert.equal(g.rec.amt, 750000);
assert.equal((await get("wnothere12345")).status, 404);
assert.equal((await post("bad token", { k: "buy", a: "x" })).status, 400, "bad token");
assert.equal((await post("wzzzzzzzzzz1", { k: "evil", a: "x" })).status, 400, "unknown kind");
assert.equal((await post("wzzzzzzzzzz2", { k: "buy", a: { x: 1 } })).status, 400, "nested value");
assert.equal((await post("wzzzzzzzzzz3", { k: "buy", a: "x".repeat(300) })).status, 400, "long string");
assert.equal((await post("wzzzzzzzzzz4", { k: "buy", a: 1e15 })).status, 400, "huge number");
assert.equal((await post("wzzzzzzzzzz5", "x".repeat(3000))).status, 413);
assert.ok(![...rows.witness.values()].some((r) => r.rec.includes("1.2.3.4")), "no raw IP stored");
const id = "a".repeat(32), put = (secret, body) => Vt.onRequestPut({ request: new Request("http://x", { method: "PUT", body: JSON.stringify(body), headers: { "x-write": secret } }), env, params: { id } });
assert.equal((await put("s".repeat(20), { meta: { v: 1 }, blob: "CIPHERTEXT" })).status, 200);
assert.equal((await put("t".repeat(20), { meta: { v: 1 }, blob: "EVIL" })).status, 403, "another secret cannot overwrite");
assert.equal((await put("s".repeat(20), { meta: { v: 1, secret: "leak" }, blob: "x" })).status, 400, "secret never accepted in meta");
assert.equal((await put("s".repeat(20), { meta: { v: 1 }, blob: "CIPHERTEXT2" })).status, 200);
const got = await (await Vt.onRequestGet({ env, params: { id } })).json(); assert.equal(got.blob, "CIPHERTEXT2");
console.log("server tests: all passed");
