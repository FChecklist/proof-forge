/* Outcomes: the three things the programme is for.
   1. outside money confirmed  2. a started company  3. a way found.
   Also: Step 9 needs a live lead, and a founder with no lead gets a right-sized "Plan B", never a made-up promise.
   Funding is never claimed by us: it is only counted when the funder confirms it (Mission 12). */
(function () {
  const PF = window.PF, e = PF.esc, money = PF.inr, MS = PF.MS;
  const ok = (S, n) => !!(MS(S, n).verdict && MS(S, n).verdict.ok);

  PF.fundingStatus = (S) => {
    const m12 = PF.missions[12], s = m12.stats(S), m9 = PF.missions[9].stats(S);
    if (s.received) return { level: 4, label: "Money in the bank", amount: s.amount };
    if (s.signed) return { level: 3, label: "Signed agreement", amount: s.amount };
    if (m9.follow) return { level: 2, label: "Live lead: someone asked to continue", amount: 0 };
    if (m9.n) return { level: 1, label: "Meetings held, no live lead yet", amount: 0 };
    return { level: 0, label: "Not yet at the investor door", amount: 0 };
  };

  PF.outcomes = (S) => {
    const f = PF.fundingStatus(S), g = PF.gate(S), passed = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].filter((n) => ok(S, n)).length;
    const started = ok(S, 11) && ok(S, 4);
    return [
      { k: "funded", ico: "💰", t: "Raised funding", done: f.level >= 3, note: f.level >= 3 ? f.label + (f.amount ? ", " + money(f.amount) + " confirmed by the funder" : "") : "Now: " + f.label + ". Counted only when the funder confirms it." },
      { k: "started", ico: "🏢", t: "Started the startup", done: started, note: started ? "Real customers paid you in the smoke test and your company papers were confirmed by outsiders." : "Needs the smoke test (Step 4) and confirmed company papers (Step 11)." },
      { k: "way", ico: "🧭", t: "Found the way", done: passed >= 9 && g.ready, note: passed + " of 12 proof gates passed. " + (g.ready ? "Your numbers stand on real proof." : "Some of your numbers still stand on guesses.") },
    ];
  };
  PF.outcomesCard = (S) => `<div class="card"><h2>The three things this is for</h2><ul class="ded">${PF.outcomes(S).map((o) => `<li><span>${o.ico} ${e(o.t)} · <b>${o.done ? "DONE" : "not yet"}</b></span><span class="small">${e(o.note)}</span></li>`).join("")}</ul></div>`;

  // Plan B: when Step 9 gives no live lead, shrink the ask to what the proof supports and point to other routes.
  PF.planB = (S) => {
    const ask = PF.s4.askAmount(S), be = PF.s4.breakeven(S), cash = be && be.cash ? be.cash : null;
    const small = cash ? Math.max(Math.round(cash / 2 / 1000) * 1000, 10000) : Math.round(ask / 2 / 1000) * 1000;
    return `<div class="card"><h2>Plan B: nobody asked to continue, so change the ask, not the story</h2><p class="small">A flat "no" from three rooms usually means the cheque, the route or the proof is wrong for those rooms. Do not repeat the same pitch. Try this order:</p><ol class="small"><li><b>Shrink the first ask</b> to ${money(small)} (about half of what your plan needs before break-even), enough to run one more proven cycle. Smaller cheques close faster and from more kinds of people.</li><li><b>Change the route:</b> a government or incubator grant, a programme with a fixed cheque, a loan against your orders, or customers paying in advance. These care about proof more than polish.</li><li><b>Change the room:</b> ask the three people who said no for the one person they would show this to.</li><li><b>Add proof:</b> one more paid customer moves more doubts than a better deck.</li></ol><p class="small">Then hold three new meetings. The gate stays closed until someone outside offers a real next step.</p></div>`;
  };

  const M9 = PF.missions[9], ev9 = M9.evaluate, vd9 = M9.verdict;
  M9.evaluate = (S) => { const r = ev9(S), s = M9.stats(S);
    if (s.follow < 1) r.fails.push({ t: "No live lead: nobody offered a follow-up or an introduction", fix: "Funding is decided by the next step someone offers. Ask for it, or use Plan B below." }); else r.pass.push(s.follow + " live lead(s)");
    r.ok = r.fails.length === 0; return r; };
  M9.verdict = (S) => vd9(S) + (MS(S, 9).verdict && !MS(S, 9).verdict.ok && M9.stats(S).follow < 1 ? PF.planB(S) : "");

  const M12 = PF.missions[12], vd12 = M12.verdict;
  M12.verdict = (S) => vd12(S) + PF.outcomesCard(S);
})();
