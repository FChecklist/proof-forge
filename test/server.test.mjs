// Tests the Pages Functions against the in-memory D1. Run: node test/server.test.mjs
import * as W from "../functions/api/w/[token].js";
import * as Vt from "../functions/api/v/[id].js";
import * as Gt from "../functions/api/g/[token].js";
import { fakeD1 } from "./fake-d1.mjs";
import assert from "node:assert/strict";
const DB = fakeD1(), env = { DB };
const mk = (u, m, body, h) => new Request("http://x" + u, { method: m, body, headers: Object.assign({ "cf-connecting-ip": "1.2.3.4" }, h || {}) });
const seal = (n) => JSON.stringify({ c: JSON.stringify({ iv: "AAAAAAAAAAAAAAAA", ct: "Zm9v" + n }) });
const post = (tok, body) => W.onRequestPost({ request: mk("/api/w/" + tok, "POST", body), env, params: { token: tok } });
const get = (tok) => W.onRequestGet({ request: mk("/api/w/" + tok, "GET"), env, params: { token: tok } });
const T = "wabcdefgh12345";
assert.equal((await post(T, seal("1"))).status, 201);
assert.equal((await post(T, seal("2"))).status, 409, "an answer can never be overwritten");
assert.ok((await (await get(T)).json()).c.includes("Zm9v1"));
assert.equal((await get("wnothere12345")).status, 404);
assert.equal((await post("bad token", seal("x"))).status, 400, "bad token");
assert.equal((await post("wzzzzzzzzzz1", JSON.stringify({ k: "buy", answer: "yes" }))).status, 400, "plain answers are refused: the server accepts ciphertext only");
assert.equal((await post("wzzzzzzzzzz2", JSON.stringify({ c: "not json" }))).status, 400);
assert.equal((await post("wzzzzzzzzzz3", JSON.stringify({ c: JSON.stringify({ iv: "short", ct: "x" }) }))).status, 400);
assert.equal((await post("wzzzzzzzzzz4", "x".repeat(7000))).status, 413);
assert.ok(![...DB.t.witness.values()].some((r) => JSON.stringify(r).includes("1.2.3.4")), "no raw IP stored");
// visitor events
const gp = (b) => Gt.onRequestPost({ request: mk("/api/g/" + T, "POST", b), env, params: { token: T } });
assert.equal((await gp(seal("a"))).status, 201); assert.equal((await gp(seal("b"))).status, 201);
const ev = await (await Gt.onRequestGet({ request: mk("/api/g/" + T, "GET"), env, params: { token: T } })).json(); assert.equal(ev.events.length, 2);
// vault
const id = "a".repeat(32), put = (secret, body) => Vt.onRequestPut({ request: mk("/api/v/" + id, "PUT", JSON.stringify(body), { "x-write": secret }), env, params: { id } });
assert.equal((await put("s".repeat(20), { meta: { v: 1 }, blob: "CIPHERTEXT" })).status, 200);
assert.equal((await put("t".repeat(20), { meta: { v: 1 }, blob: "EVIL" })).status, 403, "another secret cannot overwrite");
assert.equal((await put("s".repeat(20), { meta: { v: 1, secret: "leak" }, blob: "x" })).status, 400);
assert.equal((await put("s".repeat(20), { meta: { v: 1 }, blob: "CIPHERTEXT2" })).status, 200);
assert.equal((await (await Vt.onRequestGet({ request: mk("/api/v/" + id, "GET"), env, params: { id } })).json()).blob, "CIPHERTEXT2");
// rate limit
let last = 0; for (let i = 0; i < 125; i++) last = (await post("wlimit" + String(i).padStart(6, "0"), seal("r" + i))).status;
assert.equal(last, 429, "a flood from one address is stopped");
console.log("server tests: all passed");
