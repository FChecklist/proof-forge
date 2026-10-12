// In-memory stand-in for D1, enough for the statements the functions use.
export function fakeD1() {
  const t = { witness: new Map(), vault: new Map(), rl: new Map(), go: [] };
  return { t, prepare(sql) { return { bind(...a) { return {
    async run() {
      if (sql.startsWith("INSERT OR IGNORE INTO witness")) { if (t.witness.has(a[0])) return { meta: { changes: 0 } }; t.witness.set(a[0], { c: a[1], ip_hash: a[2], at: a[3] }); return { meta: { changes: 1 } }; }
      if (sql.startsWith("INSERT INTO go_event")) { t.go.push({ token: a[0], c: a[1], ip_hash: a[2], at: a[3] }); return { meta: { changes: 1 } }; }
      if (sql.startsWith("INSERT INTO vault")) { t.vault.set(a[0], { secret_hash: a[1], meta: a[2], blob: a[3], at: a[4] }); return { meta: { changes: 1 } }; }
      if (sql.startsWith("INSERT OR REPLACE INTO rl")) { t.rl.set(a[0], { n: a[1], win: a[2] }); return { meta: { changes: 1 } }; }
      throw new Error("unhandled run: " + sql);
    },
    async first() {
      if (sql.includes("FROM rl")) return t.rl.get(a[0]) || null;
      if (sql.includes("FROM witness")) return t.witness.get(a[0]) || null;
      if (sql.includes("COUNT(*)") && sql.includes("go_event")) return { n: t.go.filter((e) => e.token === a[0]).length };
      if (sql.includes("secret_hash")) { const r = t.vault.get(a[0]); return r ? { secret_hash: r.secret_hash } : null; }
      if (sql.includes("FROM vault")) return t.vault.get(a[0]) || null;
      throw new Error("unhandled first: " + sql);
    },
    async all() { if (sql.includes("FROM go_event")) return { results: t.go.filter((e) => e.token === a[0]) }; throw new Error("unhandled all: " + sql); } }; } }; } };
}
