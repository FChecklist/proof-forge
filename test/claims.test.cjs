// Tests the owner's refund tool with Cloudflare and Razorpay replaced by stand-ins. Run: node test/claims.test.cjs
process.env.D1_DATABASE_ID = "00000000-0000-0000-0000-000000000000"; process.env.CLOUDFLARE_API_TOKEN = "t"; process.env.CLOUDFLARE_ACCOUNT_ID = "a";
process.env.RAZORPAY_KEY_ID = "k"; process.env.RAZORPAY_KEY_SECRET = "s"; process.env.RESEND_API_KEY = "re";
const assert = require("node:assert/strict"), { webcrypto: c } = require("node:crypto"), T = require("../tools/claims.cjs");
const calls = [], claims = [{ k: "v1|A", code: "PF-12345-2026", vault: "v1", pay: "pay_ABC123", kind: "A", amount: 9999, status: "submitted" }, { k: "v1|B", code: "PF-12345-2026", vault: "v1", pay: "pay_ABC123", kind: "B", amount: 10000, status: "submitted" }];
globalThis.fetch = async (u, init = {}) => {
  u = String(u); calls.push({ u, init });
  if (u.includes("/d1/database/")) { const b = JSON.parse(init.body); if (b.sql.startsWith("UPDATE claims")) { claims.find((x) => x.k === b.params[0]).status = "refunded"; return Response.json({ success: true, result: [{ results: [] }] }); } return Response.json({ success: true, result: [{ results: claims.filter((x) => x.code === b.params[0]) }] }); }
  if (u.endsWith("/refund")) return Response.json({ id: "rfnd_1", status: "processed" });
  if (u.includes("/v1/payments/pay_ABC123")) return Response.json({ email: "buyer@example.com", notes: { name: "Asha" } });
  if (u.includes("resend.com")) return Response.json({ id: "m" });
  throw new Error("unexpected " + u);
};
(async () => {
  const log = console.log; const out = []; console.log = (...a) => out.push(a.join(" "));
  await T.approve("PF-12345-2026", false); console.log = log;
  assert.ok(out.some((l) => l.includes("Rs 9999") && l.includes("dry run")) && out.some((l) => l.includes("Rs 10000")), "dry run shows both refunds");
  assert.equal(calls.filter((x) => x.u.includes("/refund")).length, 0, "a dry run moves no money");
  console.log = (...a) => out.push(a.join(" ")); await T.approve("PF-12345-2026", true); console.log = log;
  const refunds = calls.filter((x) => x.u.endsWith("/refund")).map((x) => JSON.parse(x.init.body).amount);
  assert.deepEqual(refunds, [999900, 1000000], "9,999 then 10,000 rupees, in paise: 19,999 in total");
  assert.deepEqual(claims.map((x) => x.status), ["refunded", "refunded"]);
  assert.ok(calls.some((x) => x.u.includes("resend.com") && JSON.parse(x.init.body).to[0] === "buyer@example.com"), "the buyer is e-mailed");
  const before = calls.length; await T.approve("PF-12345-2026", true); assert.equal(calls.filter((x) => x.u.endsWith("/refund")).length, 2, "never refunded twice");
  // the audit pack opens only with the audit private key
  const kp = await c.subtle.generateKey({ name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["wrapKey", "unwrapKey"]);
  const ak = await c.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]), iv = c.getRandomValues(new Uint8Array(12)), b64 = (b) => Buffer.from(b).toString("base64");
  const pack = JSON.stringify({ v: 1, wk: b64(await c.subtle.wrapKey("raw", ak, kp.publicKey, { name: "RSA-OAEP" })), body: JSON.stringify({ iv: b64(iv), ct: b64(await c.subtle.encrypt({ name: "AES-GCM", iv }, ak, Buffer.from(JSON.stringify({ claim: "PF-1", refund: { a: true } })))) }) });
  assert.equal((await T.openPack(pack, await c.subtle.exportKey("jwk", kp.privateKey))).claim, "PF-1");
  console.log("claims tool tests: all passed");
})().catch((e) => { console.error(e); process.exit(1); });
