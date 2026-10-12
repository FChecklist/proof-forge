// Visitor events for the Step 4 smoke test (a visit, a sign-up, a pre-order). Each is sealed. Many per token, capped.
import { json, sealed, limited, ipHash } from "../_lib.js";
const TOKEN = /^w[a-z0-9]{8,40}$/, CAP = 3000;
export async function onRequestPost({ request, env, params }) {
  if (!TOKEN.test(params.token)) return json({ error: "bad token" }, 400);
  if (await limited(env, request, "gp", 90)) return json({ error: "slow down" }, 429);
  const raw = await request.text(); if (raw.length > 6000) return json({ error: "too large" }, 413);
  const c = sealed(raw); if (!c) return json({ error: "bad record" }, 400);
  const n = await env.DB.prepare("SELECT COUNT(*) AS n FROM go_event WHERE token = ?").bind(params.token).first();
  if (n && n.n >= CAP) return json({ error: "full" }, 409);
  await env.DB.prepare("INSERT INTO go_event (token, c, ip_hash, at) VALUES (?, ?, ?, ?)").bind(params.token, c, await ipHash(env, request), Date.now()).run();
  return json({ ok: true }, 201);
}
export async function onRequestGet({ request, env, params }) {
  if (!TOKEN.test(params.token)) return json({ error: "bad token" }, 400);
  if (await limited(env, request, "gg", 600)) return json({ error: "slow down" }, 429);
  const rows = await env.DB.prepare("SELECT c, at FROM go_event WHERE token = ? ORDER BY id LIMIT 3000").bind(params.token).all();
  return json({ events: (rows.results || []).map((r) => ({ c: r.c, at: r.at })) });
}
