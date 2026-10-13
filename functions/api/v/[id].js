// Encrypted vault copy. The server only ever holds ciphertext and the wrapped keys; it cannot read either.
// The first write CREATES the vault and needs a valid access token (proof of a verified payment; one token opens as many vaults as startups paid for).
// It claims the id with a secret (stored hashed). Later writes must present the same secret. A founder can delete their vault at any time.
import { json, sha, limited, logEvent } from "../_lib.js";
import { openToken } from "../_access.js";
const ID = /^[a-f0-9]{32}$/, MAXB = 1500000, VER = /^[0-9A-Za-z.+_-]{1,40}$/;
export async function onRequestGet({ request, env, params }) {
  if (!ID.test(params.id)) return json({ error: "bad id" }, 400);
  if (await limited(env, request, "vg", 60)) return json({ error: "slow down" }, 429);
  const row = await env.DB.prepare("SELECT meta, blob, at, app_version, schema_v FROM vault WHERE id = ?").bind(params.id).first();
  if (!row) return json({ error: "not found" }, 404);
  await logEvent(env, request, "vault_open", params.id);
  return json({ meta: JSON.parse(row.meta), blob: row.blob, at: row.at, av: row.app_version, sv: row.schema_v });
}
export async function onRequestPut({ request, env, params }) {
  if (!ID.test(params.id)) return json({ error: "bad id" }, 400);
  if (await limited(env, request, "vp", 1800)) return json({ error: "slow down" }, 429);
  const secret = request.headers.get("x-write") || ""; if (secret.length < 16 || secret.length > 160) return json({ error: "secret required" }, 401);
  const raw = await request.text(); if (raw.length > MAXB) return json({ error: "too large" }, 413);
  let b; try { b = JSON.parse(raw); } catch (e) { return json({ error: "bad body" }, 400); }
  if (!b || typeof b.blob !== "string" || !b.meta || typeof b.meta !== "object" || "secret" in b.meta) return json({ error: "bad body" }, 400);
  const av = VER.test(request.headers.get("x-pf-version") || "") ? request.headers.get("x-pf-version") : "-", sv = Number.isInteger(b.sv) && b.sv >= 0 && b.sv < 1000 ? b.sv : 0;
  const h = await sha(secret), cur = await env.DB.prepare("SELECT secret_hash, pay FROM vault WHERE id = ?").bind(params.id).first();
  let pay = cur ? cur.pay : null;
  if (cur && cur.secret_hash !== h) return json({ error: "wrong secret" }, 403);
  if (!cur) {
    // creating: needs proof of a verified payment, and a free seat on it
    if (!env.ACCESS_SECRET) return json({ error: "not configured" }, 503);
    const tok = await openToken(env.ACCESS_SECRET, request.headers.get("x-access") || ""); if (!tok) return json({ error: "access link needed" }, 403);
    const used = await env.DB.prepare("SELECT COUNT(*) AS n FROM access_use WHERE pay = ?").bind(tok.p).first();
    if (used && used.n >= tok.q) return json({ error: "all seats on this payment are used" }, 403);
    await env.DB.prepare("INSERT INTO access_use (pay, vault, at) VALUES (?, ?, ?)").bind(tok.p, params.id, Date.now()).run();
    pay = tok.p;
  }
  await env.DB.prepare("INSERT INTO vault (id, secret_hash, meta, blob, at, pay, app_version, schema_v) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET meta = excluded.meta, blob = excluded.blob, at = excluded.at, app_version = excluded.app_version, schema_v = excluded.schema_v").bind(params.id, h, JSON.stringify(b.meta), b.blob, Date.now(), pay, av, sv).run();
  await logEvent(env, request, cur ? "vault_save" : "vault_create", params.id);
  return json({ ok: true });
}
export async function onRequestDelete({ request, env, params }) {
  if (!ID.test(params.id)) return json({ error: "bad id" }, 400);
  if (await limited(env, request, "vd", 30)) return json({ error: "slow down" }, 429);
  const secret = request.headers.get("x-write") || "", cur = await env.DB.prepare("SELECT secret_hash FROM vault WHERE id = ?").bind(params.id).first();
  if (!cur) return json({ error: "not found" }, 404);
  if (cur.secret_hash !== (await sha(secret))) return json({ error: "wrong secret" }, 403);
  await env.DB.prepare("DELETE FROM vault WHERE id = ?").bind(params.id).run();
  await logEvent(env, request, "vault_delete", params.id);
  return json({ ok: true });
}
