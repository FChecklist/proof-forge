export const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json", "cache-control": "no-store", "x-content-type-options": "nosniff" } });
export const sha = async (t) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t))), (b) => b.toString(16).padStart(2, "0")).join("");
// the server never sees plain answers: a record is {c: '{"iv":..., "ct":...}'} and nothing else.
export function sealed(raw) {
  let o; try { o = JSON.parse(raw); } catch (e) { return null; }
  if (!o || typeof o !== "object" || Object.keys(o).length !== 1 || typeof o.c !== "string" || o.c.length > 4096) return null;
  try { const c = JSON.parse(o.c); if (!c || typeof c.iv !== "string" || typeof c.ct !== "string" || !/^[A-Za-z0-9_-]{16}$/.test(c.iv) || !/^[A-Za-z0-9_-]+$/.test(c.ct)) return null; } catch (e) { return null; }
  return o.c;
}
// a small per-address limit so nobody can fill the free storage. The address is kept only as a salted hash.
export async function limited(env, request, bucket, max) {
  const ip = request.headers.get("cf-connecting-ip") || "", k = bucket + "|" + (await sha((env.IP_SALT || "pf") + "|" + ip)), win = Math.floor(Date.now() / 3600000);
  const cur = await env.DB.prepare("SELECT n, win FROM rl WHERE k = ?").bind(k).first(), n = cur && cur.win === win ? cur.n + 1 : 1;
  await env.DB.prepare("INSERT OR REPLACE INTO rl (k, n, win) VALUES (?, ?, ?)").bind(k, n, win).run();
  return n > max;
}
// Append-only activity log. Each row carries the hash of the row before it, so editing or removing an old row breaks the chain and shows.
// It records WHAT happened and WHERE from (pseudonymous ids, software version, salted address hash). Never what the founder typed.
export async function logEvent(env, request, event, ref) {
  try {
    const ok = (s, re) => (typeof s === "string" && re.test(s) ? s : "-");
    const ver = ok(request.headers.get("x-pf-version"), /^[0-9A-Za-z.+_-]{1,40}$/), dev = ok(request.headers.get("x-pf-device"), /^[0-9A-Za-z_-]{3,40}$/);
    const prev = await env.DB.prepare("SELECT hash FROM audit_log ORDER BY id DESC LIMIT 1").first(), row = { at: Date.now(), event, ref, ver, dev, ip: await ipHash(env, request) };
    const prevHash = prev ? prev.hash : "genesis", hash = await sha(prevHash + "|" + JSON.stringify(row));
    await env.DB.prepare("INSERT INTO audit_log (at, event, ref, version, device, ip_hash, prev_hash, hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(row.at, event, ref, ver, dev, row.ip, prevHash, hash).run();
  } catch (e) { /* logging must never block a founder */ }
}
export async function verifyChain(rows) {
  let prev = "genesis";
  for (const r of rows) { const row = { at: r.at, event: r.event, ref: r.ref, ver: r.version, dev: r.device, ip: r.ip_hash }; if (r.prev_hash !== prev || r.hash !== (await sha(prev + "|" + JSON.stringify(row)))) return false; prev = r.hash; }
  return true;
}
export const ipHash = async (env, request) => sha((env.IP_SALT || "pf") + "|" + (request.headers.get("cf-connecting-ip") || ""));
