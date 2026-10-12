import io
def rd(p): return io.open(p, encoding='utf8', newline='').read()
def wr(p, s): io.open(p, 'w', encoding='utf8', newline='').write(s)
def sub(p, old, new, count=1):
    s = rd(p); assert old in s, (p, old[:60]); wr(p, s.replace(old, new, count))

# ---- server: audit log with a hash chain
sub('functions/api/_lib.js', 'export const ipHash =', '''// Append-only activity log. Each row carries the hash of the row before it, so editing or removing an old row breaks the chain and shows.
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
export const ipHash =''')
sub('functions/api/_lib.js', 'export const ipHash = async', 'export const ipHash0 = async') if False else None
sub('functions/api/w/[token].js', 'import { json, sealed, limited, ipHash } from "../_lib.js";', 'import { json, sealed, limited, ipHash, logEvent, sha } from "../_lib.js";')
sub('functions/api/w/[token].js', '  return json({ ok: true }, 201);', '  await logEvent(env, request, "answer", (await sha(params.token)).slice(0, 16));\n  return json({ ok: true }, 201);')
sub('functions/api/g/[token].js', 'import { json, sealed, limited, ipHash } from "../_lib.js";', 'import { json, sealed, limited, ipHash, logEvent, sha } from "../_lib.js";')
sub('functions/api/g/[token].js', '  return json({ ok: true }, 201);', '  await logEvent(env, request, "visitor", (await sha(params.token)).slice(0, 16));\n  return json({ ok: true }, 201);')
sub('functions/api/v/[id].js', 'import { json, sha, limited } from "../_lib.js";', 'import { json, sha, limited, logEvent } from "../_lib.js";')
sub('functions/api/v/[id].js', '  return row ? json({ meta: JSON.parse(row.meta), blob: row.blob, at: row.at }) : json({ error: "not found" }, 404);', '  if (!row) return json({ error: "not found" }, 404);\n  await logEvent(env, request, "vault_open", params.id);\n  return json({ meta: JSON.parse(row.meta), blob: row.blob, at: row.at });')
sub('functions/api/v/[id].js', '  return json({ ok: true });\n}', '  await logEvent(env, request, "vault_save", params.id);\n  return json({ ok: true });\n}')

# ---- migration
s = rd('migrations/0001_init.sql')
s += "CREATE TABLE IF NOT EXISTS audit_log (id INTEGER PRIMARY KEY AUTOINCREMENT, at INTEGER NOT NULL, event TEXT NOT NULL, ref TEXT, version TEXT, device TEXT, ip_hash TEXT, prev_hash TEXT NOT NULL, hash TEXT NOT NULL);\n"
wr('migrations/0001_init.sql', s)

# ---- fake D1
sub('test/fake-d1.mjs', 'go: [] };', 'go: [], log: [] };')
sub('test/fake-d1.mjs', '      if (sql.startsWith("INSERT INTO vault"))', '      if (sql.startsWith("INSERT INTO audit_log")) { t.log.push({ id: t.log.length + 1, at: a[0], event: a[1], ref: a[2], version: a[3], device: a[4], ip_hash: a[5], prev_hash: a[6], hash: a[7] }); return { meta: { changes: 1 } }; }\n      if (sql.startsWith("INSERT INTO vault"))')
sub('test/fake-d1.mjs', '      if (sql.includes("FROM rl"))', '      if (sql.includes("FROM audit_log")) return t.log.length ? { hash: t.log[t.log.length - 1].hash } : null;\n      if (sql.includes("FROM rl"))')

# ---- client: headers on every call to us
sub('js/wcrypto.js', '  PF.wsuffix =', '  PF.hdr = () => ({ "x-pf-version": (PF.CONFIG && PF.CONFIG.version) || "dev", "x-pf-device": PF.deviceId ? PF.deviceId() : "none" });\n  PF.wsuffix =')
sub('js/vault.js', 'headers: { "x-write": secret, "content-type": "application/json" }', 'headers: Object.assign({ "x-write": secret, "content-type": "application/json" }, PF.hdr())')
sub('js/vault.js', 'r = await fetch("/api/v/" + encodeURIComponent(id));', 'r = await fetch("/api/v/" + encodeURIComponent(id), { headers: PF.hdr() });')
sub('js/mail.js', 'const r = await fetch("/api/w/" + t);', 'const r = await fetch("/api/w/" + t, { headers: PF.hdr() });')
sub('js/mail.js', 'const r = await fetch("/api/g/" + gt);', 'const r = await fetch("/api/g/" + gt, { headers: PF.hdr() });')
sub('js/witness.js', 'headers: { "content-type": "application/json" }', 'headers: Object.assign({ "content-type": "application/json" }, PF.hdr())')
sub('js/go.js', 'headers: { "content-type": "application/json" }', 'headers: Object.assign({ "content-type": "application/json" }, PF.hdr())')
print("patched")
