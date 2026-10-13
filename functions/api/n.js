// Stage e-mails. The app tells us a stage was reached; we open the access token to learn where to send it, check the vault belongs to that payment,
// send each e-mail once, and store nothing about the buyer. No token, no vault, no e-mail.
import { json, limited } from "./_lib.js";
import { openToken } from "./_access.js";
import { render, send } from "./_mail.js";
const ID = /^[a-f0-9]{32}$/;
export async function onRequestPost({ request, env }) {
  if (await limited(env, request, "np", 120)) return json({ error: "slow down" }, 429);
  const raw = await request.text(); if (raw.length > 2500) return json({ error: "too large" }, 413);
  let b; try { b = JSON.parse(raw); } catch (e) { return json({ error: "bad body" }, 400); }
  const tok = await openToken(env.ACCESS_SECRET, b && b.t); if (!tok) return json({ error: "bad token" }, 403);
  if (!ID.test(b.v || "")) return json({ error: "bad vault" }, 400);
  const ev = b.e, step = Number(b.step);
  if (!["vault_created", "step_done"].includes(ev) || (ev === "step_done" && !(Number.isInteger(step) && step >= 1 && step <= 11))) return json({ error: "bad event" }, 400);
  const v = await env.DB.prepare("SELECT pay FROM vault WHERE id = ?").bind(b.v).first(); if (!v || v.pay !== tok.p) return json({ error: "no such vault" }, 404);
  const k = tok.p + "|" + b.v + "|" + ev + (ev === "step_done" ? step : "");
  if (await env.DB.prepare("SELECT k FROM notify_sent WHERE k = ?").bind(k).first()) return json({ ok: true, already: true });
  await env.DB.prepare("INSERT OR IGNORE INTO notify_sent (k, at) VALUES (?, ?)").bind(k, Date.now()).run();
  const sent = await send(env, tok.e, render(ev, { name: tok.n, startup: tok.s, step }), "n-" + k);
  return json({ ok: true, sent });
}
