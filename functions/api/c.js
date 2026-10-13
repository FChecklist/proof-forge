// Refund claims. A claim carries the founder's audit pack, locked to the audit team's key: we cannot read it. We record the claim, e-mail the buyer and the owner,
// and wait. A PERSON audits it, then runs tools/claims.cjs to refund. Nothing here moves money.
import { json, limited, logEvent } from "./_lib.js";
import { openToken } from "./_access.js";
import { render, send } from "./_mail.js";
const ID = /^[a-f0-9]{32}$/, FEE = 19999, HALF = 9999;
export async function onRequestPost({ request, env }) {
  if (await limited(env, request, "cp", 30)) return json({ error: "slow down" }, 429);
  const raw = await request.text(); if (raw.length > 1400000) return json({ error: "too large" }, 413);
  let b; try { b = JSON.parse(raw); } catch (e) { return json({ error: "bad body" }, 400); }
  const tok = await openToken(env.ACCESS_SECRET, b && b.t); if (!tok) return json({ error: "bad token" }, 403);
  if (!ID.test(b.v || "") || !["A", "B"].includes(b.kind) || typeof b.code !== "string" || !/^PF-[0-9]{5}-[0-9]{4}$/.test(b.code) || typeof b.pack !== "string" || b.pack.length < 50) return json({ error: "bad claim" }, 400);
  const v = await env.DB.prepare("SELECT pay FROM vault WHERE id = ?").bind(b.v).first(); if (!v || v.pay !== tok.p) return json({ error: "no such vault" }, 404);
  const amount = b.kind === "A" ? HALF : FEE - HALF; // claim B tops up from half to the full fee
  const key = b.v + "|" + b.kind;
  const dup = await env.DB.prepare("SELECT code FROM claims WHERE k = ?").bind(key).first(); if (dup) return json({ ok: true, already: true, code: dup.code });
  await env.DB.prepare("INSERT INTO claims (k, code, vault, pay, kind, amount, pack, status, at) VALUES (?, ?, ?, ?, ?, ?, ?, 'submitted', ?)").bind(key, b.code, b.v, tok.p, b.kind, amount, b.pack, Date.now()).run();
  await logEvent(env, request, "claim_" + b.kind, b.v);
  const p = { name: tok.n, startup: tok.s, code: b.code, amount, kind: b.kind, email: tok.e, pay: tok.p, vault: b.v };
  const [m1, m2] = await Promise.all([send(env, tok.e, render("claim_" + b.kind, p), "c-" + key), send(env, env.OWNER_EMAIL || "rajatsiroffice@gmail.com", render("owner_claim", p), "co-" + key)]);
  return json({ ok: true, code: b.code, amount, mailed: !!m1, ownerMailed: !!m2 });
}
