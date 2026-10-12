// Encrypted vault copy. The server only ever holds ciphertext and the wrapped keys; it cannot read either.
// The first write claims the id with a secret (stored hashed). Later writes must present the same secret.
import { json, sha, limited } from "../_lib.js";
const ID = /^[a-f0-9]{32}$/, MAXB = 1500000;
export async function onRequestGet({ request, env, params }) {
  if (!ID.test(params.id)) return json({ error: "bad id" }, 400);
  if (await limited(env, request, "vg", 60)) return json({ error: "slow down" }, 429);
  const row = await env.DB.prepare("SELECT meta, blob, at FROM vault WHERE id = ?").bind(params.id).first();
  return row ? json({ meta: JSON.parse(row.meta), blob: row.blob, at: row.at }) : json({ error: "not found" }, 404);
}
export async function onRequestPut({ request, env, params }) {
  if (!ID.test(params.id)) return json({ error: "bad id" }, 400);
  if (await limited(env, request, "vp", 900)) return json({ error: "slow down" }, 429);
  const secret = request.headers.get("x-write") || ""; if (secret.length < 16 || secret.length > 160) return json({ error: "secret required" }, 401);
  const raw = await request.text(); if (raw.length > MAXB) return json({ error: "too large" }, 413);
  let b; try { b = JSON.parse(raw); } catch (e) { return json({ error: "bad body" }, 400); }
  if (!b || typeof b.blob !== "string" || !b.meta || typeof b.meta !== "object" || "secret" in b.meta) return json({ error: "bad body" }, 400);
  const h = await sha(secret), cur = await env.DB.prepare("SELECT secret_hash FROM vault WHERE id = ?").bind(params.id).first();
  if (cur && cur.secret_hash !== h) return json({ error: "wrong secret" }, 403);
  await env.DB.prepare("INSERT INTO vault (id, secret_hash, meta, blob, at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET meta = excluded.meta, blob = excluded.blob, at = excluded.at").bind(params.id, h, JSON.stringify(b.meta), b.blob, Date.now()).run();
  return json({ ok: true });
}
