/* Proof Forge gamification. Rule: points follow TRUTH, PROOF and GRIT, never big claims.
   - Truth XP: answering honestly, spotting your own contradictions, saying "I am not sure" when you are not.
   - Proof XP: real evidence in missions (receipts, confirmed buyers, real links), never a self-reported readiness score.
   - Grit XP: facing a hard verdict, retrying after a rejection.
   Each reward is paid once per item, so it cannot be farmed. Stars rate consistency, not how good the idea is. */
(function () {
  const PF = (window.PF = window.PF || {});
  const esc = PF.esc;
  const LEVELS = [
    { n: 1, name: "Dreamer", xp: 0, icon: "💭" }, { n: 2, name: "Questioner", xp: 500, icon: "🔍" }, { n: 3, name: "Tester", xp: 1400, icon: "🧪" }, { n: 4, name: "Validator", xp: 3000, icon: "✅" },
    { n: 5, name: "Operator", xp: 5200, icon: "⚙️" }, { n: 6, name: "Pitch-ready", xp: 8000, icon: "🎤" }, { n: 7, name: "Deal-maker", xp: 11000, icon: "🤝" }, { n: 8, name: "Funded", xp: 14500, icon: "🚀" },
  ];
  const G = (PF.game = { LEVELS, queue: [], soundOn: false });
  G.g = (S) => (S.game = S.game || { xp: 0, coins: 0, once: {}, badges: [], streak: 0, best: 0, rounds: {}, sound: false, levelUp: null, celebrate: null });
  G.level = (xp) => {
    let L = LEVELS[0]; for (const l of LEVELS) if (xp >= l.xp) L = l;
    const next = LEVELS[LEVELS.indexOf(L) + 1];
    return Object.assign({}, L, { next, pct: next ? Math.round(((xp - L.xp) / (next.xp - L.xp)) * 100) : 100, toNext: next ? next.xp - xp : 0 });
  };
  G.stars = (S) => Object.values(G.g(S).rounds).reduce((a, b) => a + b, 0);

  // pay a reward once per key; returns the XP actually paid
  G.award = (S, key, xp, label) => {
    const g = G.g(S); if (key) { if (g.once[key]) return 0; g.once[key] = 1; }
    const before = G.level(g.xp).n; g.xp += xp; g.coins += Math.max(1, Math.round(xp / 4));
    G.queue.push({ xp, label }); const after = G.level(g.xp).n; if (after > before) g.levelUp = after;
    return xp;
  };

  // ---------- small sensory rewards ----------
  const vib = (ms) => { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* not supported */ } };
  G.beep = (freqs) => {
    if (!G.soundOn) return;
    try {
      const ctx = G.ctx || (G.ctx = new (window.AudioContext || window.webkitAudioContext)()); const t0 = ctx.currentTime;
      freqs.forEach((f, i) => { const o = ctx.createOscillator(), gn = ctx.createGain(), t = t0 + i * 0.09; o.type = "triangle"; o.frequency.value = f; gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(0.14, t + 0.02); gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.22); o.connect(gn); gn.connect(ctx.destination); o.start(t); o.stop(t + 0.25); });
    } catch (e) { /* audio blocked */ }
  };
  G.pop = (t) => {
    const d = document.createElement("div"); d.className = "gpop"; d.setAttribute("role", "status");
    d.innerHTML = `<b>+${t.xp} XP</b><span>${esc(t.label)}</span>`; document.body.appendChild(d); setTimeout(() => d.remove(), 2000);
  };
  G.flush = () => { const q = G.queue.splice(0); q.slice(0, 3).forEach((t, i) => setTimeout(() => G.pop(t), i * 280)); if (q.length) { G.beep([660, 880]); vib(18); } };
  G.confetti = (n) => {
    const sym = ["₹", "$", "£", "€", "★", "✓"], col = ["#DB2777", "#6D28D9", "#0E7490", "#B45309", "#0B8F5E", "#1D4ED8"], box = document.createElement("div"); box.className = "confetti"; box.setAttribute("aria-hidden", "true");
    for (let i = 0; i < (n || 46); i++) { const s = document.createElement("span"); s.textContent = sym[i % sym.length]; s.style.left = Math.random() * 100 + "%"; s.style.color = col[i % col.length]; s.style.animationDelay = Math.random() * 0.7 + "s"; s.style.animationDuration = 1.8 + Math.random() * 1.6 + "s"; s.style.fontSize = 18 + Math.random() * 20 + "px"; box.appendChild(s); }
    document.body.appendChild(box); setTimeout(() => box.remove(), 4200); G.beep([523, 659, 784, 1047]); vib([30, 40, 60]);
  };

  // ---------- stars and the end-of-round summary ----------
  const HONESTY = ["c1", "c1b", "g1", "g2", "g3", "c3", "c4", "c5", "c6", "c8", "c9", "c10", "c12", "c15", "c19"]; // answers that disagree: about honesty, not about how good the idea is
  G.roundEnd = (S, u) => {
    const un = PF.UNITS[u], g = G.g(S), kk = (S.step || 1) + ":" + u;
    const flags = PF.checks(S).filter((c) => HONESTY.includes(c.id) && c.q.some((q) => un.items.includes(q)) && c.q.every((q) => S.ans[q]));
    const calc = 1 + (flags.length <= 1 ? 1 : 0) + (flags.length === 0 ? 1 : 0), parts = [];
    const add = (k, xp, label) => { const got = G.award(S, k, xp, label); if (got) parts.push({ xp: got, label }); };
    if (g.rounds[kk] === undefined) { g.rounds[kk] = calc; g.streak = calc >= 2 ? g.streak + 1 : 0; g.best = Math.max(g.best, g.streak); }
    const stars = g.rounds[kk];
    add("round:" + kk, 25, "Round finished");
    if (stars >= 2) add("star2:" + kk, 15, "Answers agreed with each other");
    if (stars === 3) add("star3:" + kk, 20, "Perfect consistency");
    if (g.streak >= 2) add("streak:" + kk, 10 * Math.min(g.streak, 5), "Momentum x" + g.streak);
    G.checkBadges(S);
    return { u, stars, parts, flags: flags.length, streak: g.streak };
  };

  // ---------- badges ----------
  G.badgeList = (S) => {
    const ans = (id) => (S.ans[id] ? S.ans[id].v : undefined), v = PF.verdict ? PF.verdict(S) : { level: "standing" };
    const extra = [
      { id: "sharp", name: "Sharp Eye", desc: "Looked squarely at your first contradiction", got: Object.keys(S.mirror || {}).length >= 1 },
      { id: "brave", name: "Brave", desc: "Faced a hard verdict and picked your fixes", got: v.level !== "standing" && Object.keys(S.rebuild || {}).length >= 1 },
      { id: "gut", name: "Gut and Head", desc: "Your fast and slow answers matched", got: ans("nooneelse") !== undefined && ans("nooneelse") !== null && ans("nooneelse2") !== undefined && (ans("nooneelse") === true) === (ans("nooneelse2") === "none") },
      { id: "gate", name: "Gate Opener", desc: "Your mission proof was accepted", got: !!(S.mission && S.mission.verdict && S.mission.verdict.ok) },
      { id: "grit", name: "Comeback", desc: "Rejected once, fixed it, passed", got: !!(S.mission && S.mission.verdict && S.mission.verdict.ok && (S.mission.attempts || 0) >= 2) },
    ];
    return PF.badges(S).concat(extra);
  };
  G.checkBadges = (S) => { const g = G.g(S); G.badgeList(S).forEach((b) => { if (b.got && !g.badges.includes(b.id)) { g.badges.push(b.id); G.award(S, "badge:" + b.id, 20, "Badge: " + b.name); } }); };

  // ---------- celebrations ----------
  G.celebrate = (S, title, sub, xp) => { const g = G.g(S); g.celebrate = { title, sub, xp }; setTimeout(() => G.confetti(60), 120); };
})();
