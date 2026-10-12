/* Talks to our free storage (same-origin Pages Functions). With PF.CONFIG.api empty it does nothing and the app stays fully offline. */
(function () {
  const PF = (window.PF = window.PF || {});
  PF.mail = {
    on: () => location.protocol !== "file:" && !!(PF.CONFIG && PF.CONFIG.cloud),
    base: () => "",
    async pushVault(meta, blob) {
      if (!this.on() || !meta || !meta.secret) return;
      const m = { v: meta.v, iter: meta.iter, pass: meta.pass, rec: meta.rec };
      try { await fetch(this.base() + "/api/v/" + meta.id, { method: "PUT", headers: { "x-write": meta.secret, "content-type": "application/json" }, body: JSON.stringify({ meta: m, blob }) }); } catch (e) { /* offline: the local ciphertext is still safe */ }
    },
    // pull the answers other people posted. They are cached under the same keys the app already reads.
    async sync(S) {
      if (!this.on()) return 0; let n = 0;
      const toks = []; Object.values(S.ms || {}).forEach((m) => (m.witnesses || []).forEach((w) => { if (!PF.readW(w.token) && /^w[a-z0-9]{8,40}$/.test(w.token)) toks.push(w.token); }));
      await Promise.all(toks.map(async (t) => { try { const r = await fetch(this.base() + "/api/w/" + t); if (r.ok) { const j = await r.json(); localStorage.setItem("pf-w-" + t, JSON.stringify(j.rec)); n++; } } catch (e) { /* ignore */ } }));
      return n;
    },
  };
})();
