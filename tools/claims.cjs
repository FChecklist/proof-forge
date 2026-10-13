// Owner tool for refund claims. Nothing moves money unless you add --execute.
//   node tools/claims.cjs list                       claims waiting
//   node tools/claims.cjs open <code> [privkey]      decrypt the audit pack (needs the audit PRIVATE key file) and print a summary
//   node tools/claims.cjs approve <code>             dry run: shows the refund that WOULD be made
//   node tools/claims.cjs approve <code> --execute   audited and happy: refund through Razorpay, mark it paid, e-mail the buyer
// Needs env: CLOUDFLARE_API_TOKEN (with D1 permission), CLOUDFLARE_ACCOUNT_ID; for --execute also RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RESEND_API_KEY.
const fs = require("node:fs"), path = require("node:path"), { webcrypto: c } = require("node:crypto");
const CF = process.env.CF_API_BASE || "https://api.cloudflare.com/client/v4", RZP = process.env.RAZORPAY_BASE_URL || "https://api.razorpay.com";
const dbId = () => { if (process.env.D1_DATABASE_ID) return process.env.D1_DATABASE_ID; const t = fs.readFileSync(path.join(__dirname, "..", "wrangler.toml"), "utf8"), m = /database_id\s*=\s*"([0-9a-f-]{36})"/.exec(t); if (!m) throw new Error("no D1 database_id in wrangler.toml (deploy first)"); return m[1]; };
async function sql(query, params = []) {
  const r = await fetch(`${CF}/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/d1/database/${dbId()}/query`, { method: "POST", headers: { authorization: "Bearer " + process.env.CLOUDFLARE_API_TOKEN, "content-type": "application/json" }, body: JSON.stringify({ sql: query, params }) });
  const j = await r.json(); if (!j.success) throw new Error("D1: " + JSON.stringify(j.errors)); return j.result[0].results;
}
const b64 = (t) => Uint8Array.from(Buffer.from(t, "base64"));
async function openPack(pack, privJwk) {
  const p = JSON.parse(pack), priv = await c.subtle.importKey("jwk", privJwk, { name: "RSA-OAEP", hash: "SHA-256" }, false, ["unwrapKey"]);
  const ak = await c.subtle.unwrapKey("raw", b64(p.wk), priv, { name: "RSA-OAEP" }, { name: "AES-GCM", length: 256 }, false, ["decrypt"]), o = JSON.parse(p.body);
  return JSON.parse(Buffer.from(await c.subtle.decrypt({ name: "AES-GCM", iv: b64(o.iv) }, ak, b64(o.ct))).toString());
}
const refundPlan = (claim) => ({ payment: claim.pay, paise: claim.amount * 100, rupees: claim.amount, note: `Proof Forge claim ${claim.code} (${claim.kind})` });
async function rzp(pathname, init = {}) {
  const r = await fetch(RZP + pathname, { ...init, headers: { authorization: "Basic " + Buffer.from(process.env.RAZORPAY_KEY_ID + ":" + process.env.RAZORPAY_KEY_SECRET).toString("base64"), "content-type": "application/json" } });
  const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error && j.error.description || "Razorpay " + r.status); return j;
}
async function approve(code, execute) {
  const rows = await sql("SELECT k, code, vault, pay, kind, amount, status FROM claims WHERE code = ? ORDER BY kind", [code]); if (!rows.length) throw new Error("no claim " + code);
  for (const claim of rows) {
    if (claim.status === "refunded") { console.log(claim.kind + ": already refunded"); continue; }
    const plan = refundPlan(claim); console.log(`${claim.kind}: refund Rs ${plan.rupees} on ${plan.payment}` + (execute ? "" : "  (dry run: add --execute to pay)"));
    if (!execute) continue;
    const res = await rzp(`/v1/payments/${plan.payment}/refund`, { method: "POST", body: JSON.stringify({ amount: plan.paise, speed: "normal", notes: { reason: plan.note } }) });
    await sql("UPDATE claims SET status = 'refunded' WHERE k = ?", [claim.k]);
    console.log("   refund id " + res.id + " status " + res.status);
    const pay = await rzp(`/v1/payments/${plan.payment}`); // the buyer's e-mail lives with the payment service, not with us
    if (process.env.RESEND_API_KEY && pay.email) {
      const { render } = await import("file:///" + path.join(__dirname, "..", "functions", "api", "_mail.js").replace(/\\/g, "/")), tpl = render("refunded", { name: (pay.notes && pay.notes.name) || "there", amount: plan.rupees, code: claim.code });
      await fetch("https://api.resend.com/emails", { method: "POST", headers: { authorization: "Bearer " + process.env.RESEND_API_KEY, "content-type": "application/json", "idempotency-key": "r-" + claim.k }, body: JSON.stringify({ from: process.env.MAIL_FROM || "Rajat Agarwal, Startup Coach <coaching@veridian-aios.com>", to: [pay.email], subject: tpl.subject, text: tpl.text, html: tpl.html }) });
      console.log("   buyer e-mailed");
    }
  }
}
module.exports = { openPack, refundPlan, approve, sql };
if (require.main === module) (async () => {
  const [cmd, code, extra] = process.argv.slice(2);
  if (cmd === "list") { for (const r of await sql("SELECT code, kind, amount, status, at FROM claims ORDER BY at DESC LIMIT 50")) console.log(new Date(r.at).toISOString(), r.code, r.kind, "Rs " + r.amount, r.status); }
  else if (cmd === "open") {
    const key = JSON.parse(fs.readFileSync(extra && extra !== "--execute" ? extra : path.join(process.env.USERPROFILE || "", "Documents", "proof-forge-AUDIT-PRIVATE-KEY.jwk"), "utf8"));
    for (const r of await sql("SELECT kind, pack FROM claims WHERE code = ?", [code])) { const b = await openPack(r.pack, key); console.log("Claim", r.kind, "for", b.profile && b.profile.startup, "\nRefund state:", JSON.stringify(b.refund, null, 1).slice(0, 1500), "\nWitness records:", Object.keys(b.witnessRecords || {}).length); }
  } else if (cmd === "approve") await approve(code, process.argv.includes("--execute"));
  else console.log("usage: list | open <code> [privkey] | approve <code> [--execute]");
})().catch((e) => { console.error(e.message); process.exit(1); });
