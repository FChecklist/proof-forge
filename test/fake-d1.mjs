// In-memory stand-in for D1, enough for the statements the functions use. An unknown statement throws, so a new query cannot slip past the tests.
export function fakeD1() {
  const t = { witness: new Map(), vault: new Map(), rl: new Map(), go: [], log: [], access: new Map(), notify: new Map(), claims: new Map() };
  const run = (sql, a) => {
    t.writes = (t.writes || 0) + 1; // every statement that changes data, as a measure of how hard we lean on the free write limit
    if (sql.startsWith("INSERT OR IGNORE INTO witness")) { if (t.witness.has(a[0])) return 0; t.witness.set(a[0], { c: a[1], ip_hash: a[2], at: a[3] }); return 1; }
    if (sql.startsWith("INSERT INTO go_event")) { t.go.push({ token: a[0], c: a[1], ip_hash: a[2], at: a[3] }); return 1; }
    if (sql.startsWith("INSERT INTO audit_log")) { t.log.push({ id: t.log.length + 1, at: a[0], event: a[1], ref: a[2], version: a[3], device: a[4], ip_hash: a[5], prev_hash: a[6], hash: a[7] }); return 1; }
    if (sql.startsWith("INSERT INTO vault")) { const old = t.vault.get(a[0]); t.vault.set(a[0], { id: a[0], secret_hash: a[1], meta: a[2], blob: a[3], at: a[4], pay: old ? old.pay : a[5], app_version: a[6], schema_v: a[7] }); return 1; }
    if (sql.startsWith("DELETE FROM vault")) { return t.vault.delete(a[0]) ? 1 : 0; }
    if (sql.startsWith("INSERT INTO access_use")) { t.access.set(a[1], { pay: a[0], at: a[2] }); return 1; }
    if (sql.startsWith("INSERT OR IGNORE INTO notify_sent")) { if (t.notify.has(a[0])) return 0; t.notify.set(a[0], a[1]); return 1; }
    if (sql.startsWith("INSERT INTO claims")) { t.claims.set(a[0], { k: a[0], code: a[1], vault: a[2], pay: a[3], kind: a[4], amount: a[5], pack: a[6], status: "submitted", at: a[7] }); return 1; }
    if (sql.startsWith("INSERT OR REPLACE INTO rl")) { t.rl.set(a[0], { n: a[1], win: a[2] }); return 1; }
    throw new Error("unhandled run: " + sql);
  };
  const first = (sql, a) => {
    if (sql.includes("FROM rl")) return t.rl.get(a[0]) || null;
    if (sql.includes("FROM audit_log")) return t.log.length ? { hash: t.log[t.log.length - 1].hash } : null;
    if (sql.includes("FROM witness")) return t.witness.get(a[0]) || null;
    if (sql.includes("COUNT(*)") && sql.includes("go_event")) return { n: t.go.filter((e) => e.token === a[0]).length };
    if (sql.includes("COUNT(*)") && sql.includes("access_use")) return { n: [...t.access.values()].filter((x) => x.pay === a[0]).length };
    if (sql.includes("FROM notify_sent")) return t.notify.has(a[0]) ? { k: a[0] } : null;
    if (sql.includes("FROM claims")) { const c = t.claims.get(a[0]); return c ? { code: c.code } : null; }
    if (sql.includes("FROM vault")) return t.vault.get(a[0]) || null;
    throw new Error("unhandled first: " + sql);
  };
  return { t, prepare(sql) {
    const mk = (a) => ({ async run() { return { meta: { changes: run(sql, a) } }; }, async first() { return first(sql, a); },
      async all() { if (sql.includes("FROM go_event")) return { results: t.go.filter((e) => e.token === a[0]) }; throw new Error("unhandled all: " + sql); } });
    return Object.assign({ bind: (...a) => mk(a) }, mk([]));
  } };
}
