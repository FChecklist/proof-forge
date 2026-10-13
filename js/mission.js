/* Mission 1: run one real money cycle and bring proof. The gate to Session 2 opens only when the proof passes the checks.
   Local prototype: witnesses confirm through witness.html in the same browser (stored in localStorage). In production the same checks run on the server. */
(function () {
  const PF = (window.PF = window.PF || {});
  const e = PF.esc, money = PF.inr;
  const M = (S) => (S.mission = S.mission || {});
  const F = (S) => { const m = M(S); m.f = m.f || { buy: 2000, sell: 0, days: 0, buyers: 0, surprise: null, why: null, files: { buy: [], sale: [] }, links: ["", "", "", "", ""] }; if (!m.f.links) m.f.links = ["", "", "", "", ""]; return m.f; };
  const AMOUNTS = [500, 1000, 2000, 5000, 10000, 25000], SALES = [0, 500, 1000, 2000, 3000, 5000, 8000, 12000, 20000, 40000], DAYS = [3, 5, 7, 10, 15, 20, 30];
  const SURPRISE = [["slow", "Selling took far longer than I thought"], ["price", "People would not pay my price"], ["cost", "Costs were higher than planned"], ["pay", "Customers paid later than I expected"], ["effort", "It took far more effort than I expected"], ["easy", "It was easier than I expected"]];
  const WHY = [["demand", "Demand was weaker than I assumed"], ["time", "Everything took longer"], ["cost", "My cost numbers were off"], ["price", "My price was wrong"], ["small", "The test was too small to be reliable"]];
  const validUrl = (u) => { try { const x = new URL(String(u).trim()); return /^https?:$/.test(x.protocol) && x.hostname.includes("."); } catch (e) { return false; } };
  const wkey = (t) => "pf-w-" + t;
  const readW = (t) => PF.readW(t); // opened answers held in memory first, then (demo builds) the browser
  const base = () => location.href.replace(/index\.html.*$/, "").replace(/#.*$/, "").replace(/\?.*$/, "");

  const predicted = (S) => { const f = PF.flow(S); if (!f) return null; return { days: Math.round(f.base.cycleDays), profitPct: (f.base.rev * (1 - f.base.leaks)) / 100000 - 1 }; };

  function evaluate(S) {
    const m = M(S), f = F(S), fails = [], pass = [], dev = PF.deviceId();
    const ws = (m.witnesses || []).map((w) => ({ w, r: readW(w.token) })).filter((x) => x.r);
    const demoSame = !!m.allowSame;
    const valid = ws.filter((x) => x.r.answer === "yes" && (demoSame || x.r.device !== dev));
    const selfFlag = ws.filter((x) => x.r.device === dev && !demoSame).length;
    const strangers = valid.filter((x) => x.r.rel === "stranger").length;
    const check = (ok, okText, failText, fix) => (ok ? pass.push(okText) : fails.push({ t: failText, fix }));
    const names = (f.files.buy.concat(f.files.sale)).map((x) => x.name + "|" + x.size), dupes = names.length - new Set(names).size;
    const urls = (f.links || []).filter(validUrl).map((u) => { const x = new URL(u.trim()); return x.hostname.replace(/^www\./, "") + x.pathname.replace(/\/$/, "") + x.search; });
    const hosts = new Set(urls.map((u) => u.split("/")[0]));
    check(urls.length >= 5 && new Set(urls).size === urls.length && hosts.size >= 3, "5 real alternatives listed, on " + hosts.size + " different sites", "You listed " + urls.length + " working link(s)" + (new Set(urls).size !== urls.length ? ", with repeats" : "") + (hosts.size < 3 ? ", on only " + hosts.size + " site(s)" : "") + ". You need 5 different alternatives on at least 3 different sites.", "Find 5 real alternatives to your idea and paste their links. They must be on at least 3 different websites.");
    check(f.files.buy.length >= 1, "Purchase proof uploaded (" + f.files.buy.length + ")", "No proof of what you bought. Upload at least 1 receipt or payment screenshot.", "Upload the purchase receipt or your UPI debit screenshot.");
    check(f.files.sale.length >= 3, "Sales payment proof uploaded (" + f.files.sale.length + ")", "Only " + f.files.sale.length + " sales payment screenshots. You need at least 3.", "Upload at least 3 screenshots or receipts of customers paying you.");
    check(dupes === 0, "No duplicate proof files", dupes + " proof file(s) look duplicated (same name and size).", "Remove duplicates and upload each proof once.");
    check(valid.length >= 5, valid.length + " buyers confirmed", "Only " + valid.length + " verified buyers. You need at least 5." + (selfFlag ? " " + selfFlag + " confirmation(s) came from your own device and do not count." : ""), "Send the buyer link to more real buyers. They must open it on their own phone.");
    check(strangers >= 2, strangers + " strangers among them", "Only " + strangers + " of your buyers were strangers. You need at least 2 people who are not friends or family.", "Sell to at least 2 people you did not know before.");
    check(f.buyers >= 5, "You report at least 5 buyers", "You reported " + f.buyers + " buyers. The mission needs at least 5.", "Complete at least 5 real sales.");
    check(f.days > 0 && f.sell > 0, "Days and sales amount reported", "You have not reported the days taken and the money received.", "Fill in how long the cycle really took and what you received.");
    const pr = predicted(S); let gapMsg = null, bigGap = false;
    if (pr && f.days > 0) {
      const actualPct = f.buy ? f.sell / f.buy - 1 : 0, gDays = Math.abs(f.days - pr.days) / Math.max(1, pr.days), gProfit = Math.abs(actualPct - pr.profitPct);
      bigGap = gDays > 0.3 || gProfit > 0.3;
      gapMsg = { predDays: pr.days, actDays: f.days, predPct: Math.round(pr.profitPct * 100), actPct: Math.round(actualPct * 100) };
    }
    check(!bigGap || !!f.why, bigGap ? "You explained the gap" : "Your real numbers are close to your prediction", "Your real result is far from your prediction. Tell us why, in the box below.", "Pick the reason that best explains the gap.");
    check(!!f.surprise, "You named your biggest surprise", "You have not said what surprised you most.", "Pick what surprised you most.");
    return { ok: fails.length === 0, fails, pass, gapMsg, bigGap, valid: valid.length, strangers };
  }

  function chips(list, cur, act, key) { return `<div class="chips">${list.map((x) => `<button class="chip ${String(cur) === String(Array.isArray(x) ? x[0] : x) ? "on" : ""}" data-act="${act}" data-k="${key}" data-v="${Array.isArray(x) ? x[0] : x}">${e(Array.isArray(x) ? x[1] : (key === "buy" || key === "sell" ? money(x) : x))}</button>`).join("")}</div>`; }

  const M1 = {
    evaluate,
    brief(S) {
      const pr = predicted(S), f = PF.flow(S);
      return `<section><p class="eyebrow">Mission 1</p><h1>Prove the idea is not only in your head</h1><p class="lead">Your numbers are a story until money moves. Find the real alternatives, then run one real money cycle and bring proof. Step 2 opens only when the proof passes. Take the time you need.</p>
      <div class="card"><h2>What to do</h2><ol class="steps"><li>Find 5 real alternatives to your idea and note their links.</li><li>Choose something you can buy and resell. Keep it small and legal.</li><li>Buy it. Keep the receipt or the payment screenshot.</li><li>Sell it to at least <b>5 real buyers</b>, including <b>2 strangers</b>.</li><li>Get paid. Keep proof of every payment.</li><li>Send each buyer a confirmation link. They answer in 20 seconds.</li></ol></div>
      <div class="card"><h2>What the checker needs</h2><ul class="ded"><li><span>Real alternatives, with links</span><b>5, on 3 or more sites</b></li><li><span>Purchase proof</span><b>1 or more</b></li><li><span>Customer payment proofs</span><b>3 or more</b></li><li><span>Buyers who confirm on their own phones</span><b>5 or more</b></li><li><span>Of those, strangers</span><b>2 or more</b></li><li><span>Days taken, money in and out</span><b>reported</b></li><li><span>If you are far from your prediction</span><b>say why</b></li></ul></div>
      ${pr ? `<div class="card"><h2>What you predicted</h2><p>Your money cycle: <b>${pr.days} days</b>. Gain on the money you put in: <b>${Math.round(pr.profitPct * 100)}%</b>. We will compare these with what really happens.</p></div>` : ""}
      <p class="small">Honest note: this is a local prototype, and links are only format-checked here (a server will open each one). Witness links work in this browser for the demo. In the real product the same checks run on a server, and a person can still review any proof at your 1:1.</p>
      <button class="btn" data-act="mstart">I accept the mission</button></section>`;
    },
    submit(S) {
      const m = M(S), f = F(S), pr = predicted(S), ws = m.witnesses || [];
      const rows = ws.map((w, i) => { const r = readW(w.token), st = !r ? "Waiting" : r.answer !== "yes" ? "Says no" : r.device === PF.deviceId() && !m.allowSame ? "Same device: does not count" : r.rel === "stranger" ? "Confirmed (stranger)" : "Confirmed (" + r.rel + ")"; return `<div class="wrow ${!r ? "wait" : st.startsWith("Confirmed") ? "ok" : "bad"}"><span>Buyer ${i + 1}</span><b>${st}</b><div class="chips"><button class="chip" data-act="mcopy" data-t="${w.token}">Copy link</button><a class="chip" target="_blank" rel="noopener" href="witness.html?t=${w.token}&n=${encodeURIComponent((S.profile || {}).name || "")}&u=${encodeURIComponent((S.profile || {}).startup || "")}">Open as buyer (demo)</a></div></div>`; }).join("");
      const fileList = (arr) => (arr.length ? `<ul class="flist">${arr.map((x) => `<li>${e(x.name)} <em>${Math.round(x.size / 1024)} KB</em></li>`).join("")}</ul>` : '<p class="small">Nothing added yet.</p>');
      return `<section><p class="eyebrow">Mission 1 · submit proof</p><h1>Bring the proof</h1>
      <div class="card"><h2>The numbers</h2><label class="lab">Money you spent buying</label>${chips(AMOUNTS, f.buy, "mset", "buy")}<label class="lab">Money you received from customers</label>${chips(SALES, f.sell, "mset", "sell")}<label class="lab">Days from buying to being paid</label>${chips(DAYS, f.days, "mset", "days")}<label class="lab">Number of buyers</label>${chips([0, 1, 2, 3, 4, 5, 6, 8, 10, 15], f.buyers, "mset", "buyers")}</div>
      <div class="card"><h2>Five real alternatives</h2><p class="small">Real businesses or products that already do something like your idea. Paste each link.</p>${(f.links || []).map((u, i) => `<input class="alt-in" type="url" data-i="${i}" placeholder="https://..." value="${e(u)}" aria-label="Alternative ${i + 1} link">`).join("")}</div><div class="card"><h2>Purchase proof</h2><p class="small">Receipt or payment screenshot of what you bought.</p><input type="file" id="pf-buy" accept="image/*,application/pdf" multiple>${fileList(f.files.buy)}<h2>Customer payment proof</h2><p class="small">Screenshots or receipts of customers paying you. At least 3.</p><input type="file" id="pf-sale" accept="image/*,application/pdf" multiple>${fileList(f.files.sale)}</div>
      <div class="card"><h2>Buyer confirmations</h2><p class="small">Each buyer opens their own link on their own phone and answers in 20 seconds. Links from your own device do not count.</p><div id="wlist">${rows || '<p class="small">No buyer links yet.</p>'}</div><div class="chips"><button class="btn small" data-act="madd">Add a buyer link</button><button class="chip" data-act="mdemo">Demo: simulate 6 buyers</button><label class="chk inline"><input type="checkbox" id="msame" ${m.allowSame ? "checked" : ""}> Demo: accept confirmations from this device</label></div></div>
      <div class="card"><h2>Your reflection</h2><label class="lab">What surprised you most?</label><div class="chips">${SURPRISE.map((x) => `<button class="chip ${f.surprise === x[0] ? "on" : ""}" data-act="mset" data-k="surprise" data-v="${x[0]}">${e(x[1])}</button>`).join("")}</div><label class="lab">If your result is far from your prediction, why?${pr ? " (You predicted " + pr.days + " days.)" : ""}</label><div class="chips">${WHY.map((x) => `<button class="chip ${f.why === x[0] ? "on" : ""}" data-act="mset" data-k="why" data-v="${x[0]}">${e(x[1])}</button>`).join("")}</div></div>
      <button class="btn" data-act="msubmit">Submit for checking</button></section>`;
    },
    verdict(S) {
      const m = M(S), v = m.verdict; if (!v) return "<p>No result yet.</p>";
      const g = v.gapMsg;
      const gap = g ? `<div class="card"><h2>Prediction against reality</h2><div class="cmp"><div><h3>You predicted</h3><p>Cycle <b>${g.predDays} days</b></p><p>Gain <b>${g.predPct}%</b></p></div><div class="bad"><h3>What happened</h3><p>Cycle <b>${g.actDays} days</b></p><p>Gain <b>${g.actPct}%</b></p></div></div><p class="note">${v.bigGap ? "Your real numbers are far from your prediction. That is the daydream meeting the field. Update your Money Flow Sheet with these real numbers before Session 2." : "Your real numbers are close to your prediction. Good model. Step 2 tests whether customers outside your circle behave the same way."}</p></div>` : "";
      if (v.ok) return `<section class="center"><p class="eyebrow">Mission 1 · checked</p><h1>Proof accepted</h1><div class="card cele"><div class="cele-ico">🏆</div><div><h3>Gate to Step 2: OPEN</h3><p class="small">+150 XP · Level ${PF.game.level(PF.game.g(S).xp).n}: ${e(PF.game.level(PF.game.g(S).xp).name)} · ${PF.game.g(S).xp} XP in total</p></div></div><div class="card ok"><h2>What passed</h2><ul class="ded">${v.pass.map((p) => `<li><span>✓ ${e(p)}</span></li>`).join("")}</ul></div>${gap}<div class="card locked open"><h2>Step 2: Customer truth</h2><p>Unlocked.</p></div><button class="btn" data-act="nextstep">Begin Step 2</button> <button class="btn ghost" data-act="mreview">Edit my proof</button></section>`;
      return `<section><p class="eyebrow">Mission 1 · checked</p><h1>Not accepted yet</h1><div class="card no"><h2>Gate to Step 2: LOCKED</h2><p>${v.fails.length} thing(s) to fix. Fix them and submit again.</p><ul class="fails">${v.fails.map((x) => `<li><b>${e(x.t)}</b><span>Next step: ${e(x.fix)}</span></li>`).join("")}</ul></div>${gap}<div class="card locked"><h2>Step 2: Customer truth</h2><p>Locked until the proof passes.</p></div><button class="btn" data-act="mreview">Fix and resubmit</button></section>`;
    },
    click(act, d, S, h) {
      const m = M(S), f = F(S);
      if (act === "mstart") { m.issuedAt = m.issuedAt || Date.now(); m.witnesses = m.witnesses || []; h.go("missionSubmit"); return true; }
      if (act === "mset") { const k = d.k; f[k] = ["buy", "sell", "days", "buyers"].includes(k) ? Number(d.v) : d.v; h.save(); h.render(); return true; }
      if (act === "madd") { const t = PF.MH.tok(); (m.witnesses = m.witnesses || []).push({ token: t, at: Date.now() }); h.save(); h.render(); return true; }
      if (act === "mcopy") { const link = base() + "witness.html?t=" + d.t + "&n=" + encodeURIComponent((S.profile || {}).name || "") + "&u=" + encodeURIComponent((S.profile || {}).startup || "") + PF.wsuffix(S, d.t); try { navigator.clipboard.writeText(link); } catch (x) { /* ignore */ } d.copied = true; alert("Link copied. Send it to your buyer on WhatsApp.\n\n" + link); return true; }
      if (act === "mdemo") { m.witnesses = m.witnesses || []; const rels = ["stranger", "stranger", "classmate", "friend", "stranger", "family"]; rels.forEach((rel, i) => { const t = "sim" + Date.now().toString(36) + i; m.witnesses.push({ token: t, at: Date.now() }); localStorage.setItem(wkey(t), JSON.stringify({ answer: "yes", pay: "upi", rel, at: Date.now(), device: "sim-device-" + i })); }); h.save(); h.render(); return true; }
      if (act === "msubmit") {
        const G = PF.game, prev = m.verdict; m.verdict = evaluate(S); m.attempts = (m.attempts || 0) + 1; const v = m.verdict;
        G.award(S, "m:attempt", 10, "Submitted proof");
        if (prev && !prev.ok) G.award(S, "m:retry:" + m.attempts, 20, "Grit: tried again after a rejection");
        if (v.pass.some((t) => /alternatives listed/.test(t))) G.award(S, "m:alts", 40, "5 real alternatives found");
        if (v.pass.some((t) => /Purchase proof/.test(t))) G.award(S, "m:buy", 30, "Purchase proof uploaded");
        if (v.pass.some((t) => /Sales payment proof/.test(t))) G.award(S, "m:sale", 30, "Customer payment proofs");
        for (let i = 0; i < Math.min(6, v.valid); i++) G.award(S, "m:buyer:" + i, 15, "A real buyer confirmed");
        if (v.ok) { G.award(S, "m:pass", 150, "Gate opened"); G.celebrate(S, "Gate to Step 2 is OPEN", "Your proof was accepted", 150); }
        G.checkBadges(S); h.go("missionVerdict"); return true; }
      if (act === "mreview") { h.go("missionSubmit"); return true; }
      return false;
    },
    after() {
      const buy = document.getElementById("pf-buy"), sale = document.getElementById("pf-sale"), S = PF.getState(), f = F(S);
      const bind = (el, key) => { if (!el) return; el.onchange = () => { const files = Array.from(el.files).map((x) => ({ name: x.name, size: x.size, mod: x.lastModified })); f.files[key] = f.files[key].concat(files); PF.store.save(S); PF.ui.render(); }; };
      bind(buy, "buy"); bind(sale, "sale");
      document.querySelectorAll(".alt-in").forEach((el) => { el.onchange = () => { f.links[Number(el.dataset.i)] = el.value; PF.store.save(S); }; });
      const same = document.getElementById("msame"); if (same) same.onchange = () => { M(S).allowSame = same.checked; PF.store.save(S); PF.ui.render(); };
    },
  };
  (PF.missions = PF.missions || {})[1] = M1;
  window.addEventListener("storage", () => { const S = PF.getState && PF.getState(); if (S && S.screen === "missionSubmit") PF.ui.render(); });
})();
