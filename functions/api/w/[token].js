// Answer mailbox. A funder, accountant or customer posts one sealed answer. It can be read with the token and never changed.
// We hold ciphertext only: the key sits after the # in the link and never reaches us.
import { json, sealed, limited, ipHash } from "../_lib.js";
const TOKEN = /^w[a-z0-9]{8,40}$/;
export async function onRequestPost({ request, env, params }) {
  if (!TOKEN.test(params.token)) return json({ error: "bad token" }, 400);
  if (await limited(env, request, "wp", 120)) return json({ error: "slow down" }, 429);
  const raw = await request.text(); if (raw.length > 6000) return json({ error: "too large" }, 413);
  const c = sealed(raw); if (!c) return json({ error: "bad record" }, 400);
  const r = await env.DB.prepare("INSERT OR IGNORE INTO witness (token, c, ip_hash, at) VALUES (?, ?, ?, ?)").bind(params.token, c, await ipHash(env, request), Date.now()).run();
  if (!r.meta || r.meta.changes === 0) return json({ error: "already answered" }, 409);
  return json({ ok: true }, 201);
}
export async function onRequestGet({ request, env, params }) {
  if (!TOKEN.test(params.token)) return json({ error: "bad token" }, 400);
  if (await limited(env, request, "wg", 600)) return json({ error: "slow down" }, 429);
  const row = await env.DB.prepare("SELECT c, at FROM witness WHERE token = ?").bind(params.token).first();
  return row ? json({ c: row.c, at: row.at }) : json({ error: "not found" }, 404);
}
