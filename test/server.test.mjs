// Tests the Pages Functions against the in-memory D1. Run: node test/server.test.mjs
import * as W from "../functions/api/w/[token].js";
import * as Vt from "../functions/api/v/[id].js";
import * as Gt from "../functions/api/g/[token].js";
import * as N from "../functions/api/n.js";
import * as C from "../functions/api/c.js";
import { mintToken } from "../functions/api/_access.js";
import { verifyChain } from "../functions/api/_lib.js";
import { fakeD1 } from "./fake-d1.mjs";
import assert from "node:assert/strict";
const DB = fakeD1(), env = { DB, ACCESS_SECRET: "test-secret-123", RESEND_API_KEY: "re_test", OWNER_EMAIL: "owner@example.com" };
const mails = []; const realFetch = globalThis.fetch;
globalThis.fetch = async (u, init) => { if (String(u).includes("api.resend.com")) { const b = JSON.parse(init.body); mails.push({ to: b.to[0], subject: b.subject, text: b.text, key: init.headers["idempotency-key"] }); return new Response("{}", { status: 200 }); } return realFetch(u, init); };
const mk = (u, m, body, h) => new Request("http://x" + u, { method: m, body, headers: Object.assign({ "cf-connecting-ip": "1.2.3.4" }, h || {}) });
const seal = (n) => JSON.stringify({ c: JSON.stringify({ iv: "AAAAAAAAAAAAAAAA", ct: "Zm9v" + n }) });
const post = (tok, body) => W.onRequestPost({ request: mk("/api/w/" + tok, "POST", body), env, params: { token: tok } });
const get = (tok) => W.onRequestGet({ request: mk("/api/w/" + tok, "GET"), env, params: { token: tok } });
const T = "wabcdefgh12345";
// ---- witness mailbox: ciphertext only, write once
assert.equal((await post(T, seal("1"))).status, 201);
assert.equal((await post(T, seal("2"))).status, 409, "an answer can never be overwritten");
assert.ok((await (await get(T)).json()).c.includes("Zm9v1"));
assert.equal((await get("wnothere12345")).status, 404);
assert.equal((await post("bad token", seal("x"))).status, 400);
assert.equal((await post("wzzzzzzzzzz1", JSON.stringify({ k: "buy", answer: "yes" }))).status, 400, "plain answers are refused");
assert.equal((await post("wzzzzzzzzzz2", JSON.stringify({ c: "not json" }))).status, 400);
assert.equal((await post("wzzzzzzzzzz3", JSON.stringify({ c: JSON.stringify({ iv: "short", ct: "x" }) }))).status, 400);
assert.equal((await post("wzzzzzzzzzz4", "x".repeat(7000))).status, 413);
assert.ok(![...DB.t.witness.values()].some((r) => JSON.stringify(r).includes("1.2.3.4")), "no raw IP stored");
const gp = (b) => Gt.onRequestPost({ request: mk("/api/g/" + T, "POST", b), env, params: { token: T } });
assert.equal((await gp(seal("a"))).status, 201); assert.equal((await gp(seal("b"))).status, 201);
assert.equal((await (await Gt.onRequestGet({ request: mk("/api/g/" + T, "GET"), env, params: { token: T } })).json()).events.length, 2);
// ---- vault: creation needs a verified-payment token and a free seat
const tok2 = await mintToken(env.ACCESS_SECRET, { p: "pay_ABC123XYZ", q: 2, e: "buyer@example.com", n: "Asha", s: "KurtaKart", at: 1 });
const idA = "a".repeat(32), idB = "b".repeat(32), idC = "c".repeat(32);
const put = (id, secret, body, h) => Vt.onRequestPut({ request: mk("/api/v/" + id, "PUT", JSON.stringify(body), Object.assign({ "x-write": secret, "x-pf-version": "1.0.0+abc" }, h || {})), env, params: { id } });
assert.equal((await put(idA, "s".repeat(20), { meta: { v: 1 }, blob: "CIPHERTEXT", sv: 2 })).status, 403, "no access link, no vault");
assert.equal((await put(idA, "s".repeat(20), { meta: { v: 1 }, blob: "C" }, { "x-access": "forged.token" })).status, 403, "a forged token is refused");
assert.equal((await put(idA, "s".repeat(20), { meta: { v: 1 }, blob: "CIPHERTEXT", sv: 2 }, { "x-access": tok2 })).status, 200);
assert.equal((await put(idB, "s".repeat(20), { meta: { v: 1 }, blob: "C2" }, { "x-access": tok2 })).status, 200, "second seat on the same payment");
assert.equal((await put(idC, "s".repeat(20), { meta: { v: 1 }, blob: "C3" }, { "x-access": tok2 })).status, 403, "a third vault on a 2-startup payment is refused");
assert.equal((await put(idA, "t".repeat(20), { meta: { v: 1 }, blob: "EVIL" })).status, 403, "another secret cannot overwrite");
assert.equal((await put(idA, "s".repeat(20), { meta: { v: 1, secret: "leak" }, blob: "x" })).status, 400, "a secret is never accepted in meta");
assert.equal((await put(idA, "s".repeat(20), { meta: { v: 1 }, blob: "CIPHERTEXT2", sv: 2 })).status, 200, "later saves need no token");
const got = await (await Vt.onRequestGet({ request: mk("/api/v/" + idA, "GET"), env, params: { id: idA } })).json();
assert.equal(got.blob, "CIPHERTEXT2"); assert.equal(got.av, "1.0.0+abc", "the software version is kept with us"); assert.equal(got.sv, 2, "and the data schema version");
// ---- stage e-mails: once each, only for a vault on that payment
const note = (b) => N.onRequestPost({ request: mk("/api/n", "POST", JSON.stringify(b)), env });
assert.equal((await note({ t: tok2, v: idA, e: "vault_created" })).status, 200);
assert.equal(mails.length, 1); assert.equal(mails[0].to, "buyer@example.com"); assert.ok(mails[0].text.includes("KurtaKart"));
await note({ t: tok2, v: idA, e: "vault_created" }); assert.equal(mails.length, 1, "an e-mail is sent once");
assert.equal((await note({ t: tok2, v: idA, e: "step_done", step: 1 })).status, 200); assert.equal(mails.length, 2); assert.ok(mails[1].subject.includes("Step 1"));
assert.equal((await note({ t: tok2, v: idA, e: "step_done", step: 12 })).status, 400, "step 12 is a claim, not a step e-mail");
assert.equal((await note({ t: "bad.token", v: idA, e: "vault_created" })).status, 403);
assert.equal((await note({ t: await mintToken(env.ACCESS_SECRET, { p: "pay_OTHER12345", q: 1, e: "x@y.com", n: "X", s: "Y", at: 1 }), v: idA, e: "vault_created" })).status, 404, "a vault from another payment is refused");
// ---- claims
const claim = (b) => C.onRequestPost({ request: mk("/api/c", "POST", JSON.stringify(b)), env });
const pack = "x".repeat(100);
const r1 = await claim({ t: tok2, v: idA, kind: "A", code: "PF-12345-2026", pack }); assert.equal(r1.status, 200); assert.equal((await r1.json()).amount, 9999);
assert.equal((await (await claim({ t: tok2, v: idA, kind: "A", code: "PF-12345-2026", pack })).json()).already, true, "one claim of each kind per vault");
assert.equal((await (await claim({ t: tok2, v: idA, kind: "B", code: "PF-12345-2026", pack })).json()).amount, 10000, "claim B tops up to the full fee: 9,999 + 10,000 = 19,999");
assert.ok(mails.some((m) => m.to === "buyer@example.com" && m.subject.includes("Half")), "buyer told half is earned");
assert.ok(mails.some((m) => m.to === "owner@example.com" && m.subject.startsWith("Claim A")), "owner told of the claim");
assert.equal((await claim({ t: tok2, v: idA, kind: "A", code: "bad", pack })).status, 400);
assert.equal(DB.t.claims.get(idA + "|A").pack, pack, "the pack is stored as sent (ciphertext)");
// ---- delete my vault
const del = (id, secret) => Vt.onRequestDelete({ request: mk("/api/v/" + id, "DELETE", undefined, { "x-write": secret }), env, params: { id } });
assert.equal((await del(idB, "wrong".repeat(5))).status, 403);
assert.equal((await del(idB, "s".repeat(20))).status, 200); assert.equal((await Vt.onRequestGet({ request: mk("/api/v/" + idB, "GET"), env, params: { id: idB } })).status, 404, "a deleted vault is gone");
assert.equal((await put(idC, "s".repeat(20), { meta: { v: 1 }, blob: "C3" }, { "x-access": tok2 })).status, 403, "deleting does not free the seat (stops abuse)");
// ---- rate limit
let last = 0; for (let i = 0; i < 125; i++) last = (await post("wlimit" + String(i).padStart(6, "0"), seal("r" + i))).status;
assert.equal(last, 429, "a flood from one address is stopped");
// ---- the activity log
assert.ok(DB.t.log.some((r) => r.event === "vault_create" && r.ref === idA) && DB.t.log.some((r) => r.event === "vault_delete") && DB.t.log.some((r) => r.event === "claim_A"), "key events are logged");
assert.ok(!JSON.stringify(DB.t.log).includes("1.2.3.4"), "no raw address in the log");
assert.equal(await verifyChain(DB.t.log), true, "the log chain verifies");
DB.t.log[2].event = "edited"; assert.equal(await verifyChain(DB.t.log), false, "editing an old log row is detected");
console.log("server tests: all passed (" + mails.length + " e-mails captured)");
