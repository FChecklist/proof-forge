/* Talks to our free storage (same-origin Pages Functions). Answers from other people arrive as ciphertext and are opened here, in memory only.
   With PF.CONFIG.cloud false (a local file) it does nothing and the app stays fully offline. */
(function () {
  const PF = (window.PF = window.PF || {});
  PF._wc = PF._wc || {}; PF._go = PF._go || {};
  PF.mail = {
    on: () => location.protocol !== "file:" && !!(PF.CONFIG && PF.CONFIG.cloud),
    busy: false,
    async sync(S) {
      if (!this.on() || !S.wkeys) return 0; let n = 0;
      const toks = []; Object.values(S.ms || {}).forEach((m) => (m.witnesses || []).forEach((w) => { if (!PF._wc[w.token] && S.wkeys[w.token] && /^w[a-z0-9]{8,40}$/.test(w.token)) toks.push(w.token); }));
      await Promise.all(toks.map(async (t) => { try { const r = await fetch("/api/w/" + t); if (r.ok) { PF._wc[t] = await PF.wc.open((await r.json()).c, S.wkeys[t]); n++; } } catch (e) { /* not there yet, or not for this key */ } }));
      const m4 = (S.ms || {})[4], gt = m4 && m4.goToken;
      if (gt && S.wkeys[gt]) { try { const r = await fetch("/api/g/" + gt); if (r.ok) {
        const list = (await r.json()).events, g = { visits: {}, signups: [], preorders: [] };
        for (const ev of list) { try { const e = await PF.wc.open(ev.c, S.wkeys[gt]); if (e.t === "visit") g.visits[e.device] = e.at; else if (e.t === "signup") g.signups.push(e); else if (e.t === "pre") g.preorders.push(e); } catch (x) { /* ignore a bad event */ } }
        const before = JSON.stringify(PF._go[gt] || {}); PF._go[gt] = g; if (JSON.stringify(g) !== before) n++; } } catch (e) { /* offline */ } }
      return n;
    },
  };
})();
