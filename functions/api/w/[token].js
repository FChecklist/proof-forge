// Witness mailbox. A funder, accountant or customer posts one answer. It can be read with the token and never changed:
// the founder cannot edit what other people said about them. No compute beyond a validation and one row.
import { json, sha, cleanRecord } from "../_lib.js";
const TOKEN = /^w[a-z0-9]{8,40}$/;
export async function onRequestPost({ request, env, params }) {
  if (!TOKEN.test(params.token)) return json({ error: "bad token" }, 400);
  const raw = await request.text(); if (raw.length > 2048) return json({ error: "too large" }, 413);
  let rec; try { rec = cleanRecord(JSON.parse(raw)); } catch (e) { rec = null; }
  if (!rec) return json({ error: "bad record" }, 400);
  const ip = request.headers.get("cf-connecting-ip") || "", ipHash = await sha((env.IP_SALT || "pf") + "|" + ip);
  const r = await env.DB.prepare("INSERT OR IGNORE INTO witness (token, rec, ip_hash, at) VALUES (?, ?, ?, ?)").bind(params.token, JSON.stringify(rec), ipHash, Date.now()).run();
  if (!r.meta || r.meta.changes === 0) return json({ error: "already answered" }, 409);
  return json({ ok: true }, 201);
}
export async function onRequestGet({ env, params }) {
  if (!TOKEN.test(params.token)) return json({ error: "bad token" }, 400);
  const row = await env.DB.prepare("SELECT rec, at FROM witness WHERE token = ?").bind(params.token).first();
  return row ? json({ rec: JSON.parse(row.rec), at: row.at }) : json({ error: "not found" }, 404);
}
