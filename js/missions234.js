/* Missions 2, 3 and 4, the dispatcher, the extra reveals and the investor-ready gate.
   Local prototype: interview/shadow/sign-up pages (witness.html, go.html) store answers in this browser's localStorage. A server does the same checks in production. */
(function () {
  const PF = (window.PF = window.PF || {});
  const e = PF.esc, money = PF.inr, MS = PF.MS, val = PF.val;
  const base = () => location.href.replace(/index\.html.*$/, "").replace(/#.*$/, "").replace(/\?.*$/, "");
  const prof = (S) => S.profile || {};
  const wlink = (S, kind, t) => base() + "witness.html?k=" + kind + "&t=" + t + "&n=" + encodeURIComponent(prof(S).name || "") + "&u=" + encodeURIComponent(prof(S).startup || "") + "&p=" + (val(S, "price") || 0) + "&pr=" + encodeURIComponent(PF.problemSentence(S) || "");
  const golink = (S, t) => base() + "go.html?t=" + t + "&n=" + encodeURIComponent(prof(S).name || "") + "&u=" + encodeURIComponent(prof(S).startup || "") + "&p=" + (val(S, "price") || 0);
  const newTok = (p) => p + Math.random().toString(36).slice(2, 10);
  const chipRow = (list, cur, act, key) => `<div class="chips">${list.map((x) => `<button class="chip ${cur === x[0] ? "on" : ""}" data-act="${act}" data-k="${key}" data-v="${x[0]}">${e(x[1])}</button>`).join("")}</div>`;
  const tile = (label, value, tone, sub) => `<div class="tile ${tone || ""}"><b>${value}</b><span>${e(label)}</span>${sub ? `<em>${e(sub)}</em>` : ""}</div>`;
  const wrows = (S, m, kind, label, okRel) => (m.witnesses || []).map((w, i) => { const r = PF.readW(w.token), same = r && r.device === PF.deviceId() && !m.allowSame; const st = !r ? "Waiting" : same ? "Same device: does not count" : r.answer === "no" ? "Says no" : "Confirmed" + (r.rel ? " (" + r.rel + ")" : ""); return `<div class="wrow ${!r ? "wait" : st.startsWith("Confirmed") ? "ok" : "bad"}"><span>${label} ${i + 1}</span><b>${st}</b><div class="chips"><button class="chip" data-act="wcopy" data-link="${e(wlink(S, kind, w.token))}">Copy link</button><a class="chip" target="_blank" rel="noopener" href="${e(wlink(S, kind, w.token))}">Open (demo)</a></div></div>`; }).join("");

  // ---------- extra reveals ----------
  const R = (PF.REVEALS_EXTRA = {});
  R.funnel = (S) => {
    const f = PF.s2.funnel(S); if (!f) return "<p>Answer the two numbers first.</p>";
    return `<h2>Your selling arithmetic</h2><p class="lead2">To win just <b>10 customers</b> at a close rate of ${f.close} in 100, you must talk to:</p><div class="tiles">${tile("people to talk to", f.contacts.toLocaleString("en-IN"), f.contacts > 100 ? "amber" : "")}${tile("days at " + f.daily + " conversations a day", f.days, f.days > 20 ? "red" : "")}${tile("conversations you refused to count: friends", "0", "")}</div><p class="note">${f.days > 20 ? "Winning ten customers takes you more than three weeks of full selling. Ask yourself whether you can do this next to your studies." : "That is a realistic week or two of selling. Now go and test whether the close rate is true."}</p>`;
  };
  R.team = (S) => {
    const t = PF.s3.team(S); if (!t) return "<p>Answer the hours first.</p>";
    return `<h2>Your people maths</h2><div class="tiles">${tile("hours a week you have", t.have, "")}${tile("hours a week the work needs", t.need, t.ratio > 1.5 ? "red" : "amber")}${tile("hours you are short", t.short, t.short > 0 ? "red" : "green")}${tile("monthly cost of the people you plan", money(t.peopleMonthly), "")}${tile("per year", money(t.peopleMonthly * 12), "")}</div><p class="note">${t.short > 0 ? "You are short by " + t.short + " hours a week. Either you hire for them, which costs money, or the plan is smaller than you think." : "On hours, your plan fits. The question is whether you know the work as well as the hours."}</p>`;
  };
  R.buckets = (S) => {
    const b = PF.s3.buckets(S), t = b.total || 1;
    return `<h2>Where every rupee goes</h2><table class="tbl"><thead><tr><th>Bucket</th><th>Amount</th><th>Share</th></tr></thead><tbody>${b.rows.map((r) => `<tr><th>${e(r.label)}</th><td>${money(r.amt)}</td><td>${Math.round((r.amt / t) * 100)}%</td></tr>`).join("")}<tr class="hl"><th>Total</th><td>${money(b.total)}</td><td>100%</td></tr></tbody></table><div class="tiles">${tile("your total", money(b.total), "")}${b.md ? tile("the number you first imagined", money(b.md), "amber") : ""}${b.peak ? tile("what your own numbers suggested", money(b.peak), "amber") : ""}</div><p class="note">None of these amounts are proven yet. Mission 3 asks you to collect real quotes for your three biggest buckets. The part your quotes support is the part that is backed.</p>`;
  };
  R.burn = (S) => {
    const b = PF.s4.burn(S); if (!b) return "<p>Answer the discount questions first.</p>";
    return `<h2>What your discount really costs</h2><div class="tiles">${tile("total given away", money(b.burn), "amber")}${tile("customers who stay", Math.round(b.kept).toLocaleString("en-IN"), "")}${tile("discount cost per customer who stays", b.perKept === Infinity ? "n/a" : money(b.perKept), b.ltv && b.perKept > b.ltv ? "red" : "")}${b.ltv ? tile("what a customer is worth in a year", money(b.ltv), "") : ""}</div><p class="note">${b.ltv && b.perKept > b.ltv ? "Each customer who stays costs more in discounts than they bring in a year. This is how companies burn money." : "Discounts are a cost of finding customers. Count them like one."}</p>`;
  };
  R.breakeven = (S) => {
    const be = PF.s4.breakeven(S); if (!be) return "<p>Answer the growth questions first.</p>";
    const pick = [3, 6, 12, 18, 24, 36].map((m) => be.rows[m - 1]);
    return `<h2>The long road to break-even</h2><div class="tiles">${tile("earned on each order", money(be.c), be.c <= 0 ? "red" : "")}${tile("fixed costs a month", money(be.fixed), "")}${tile("break-even month", be.never ? "never" : be.months, be.never || be.months > 24 ? "red" : "green")}${tile("cash needed to get there", be.cash === null ? "n/a" : money(be.cash), "amber")}</div><table class="tbl"><thead><tr><th>Month</th><th>Orders</th><th>Profit that month</th><th>Total cash</th></tr></thead><tbody>${pick.map((r) => `<tr><th>${r.m}</th><td>${Math.round(r.orders).toLocaleString("en-IN")}</td><td>${money(r.profit)}</td><td class="${r.cum < 0 ? "neg" : ""}">${money(r.cum)}</td></tr>`).join("")}</tbody></table><p class="note">${be.never ? "At these numbers the business never covers its fixed costs. Fix price, cost or growth before asking anyone for money." : "The deepest point of the table is the money you must raise, before any cushion."}</p>`;
  };
  R.askline = (S) => {
    const q = PF.s3.quoted(S), ask = PF.s4.askAmount(S), be = PF.s4.breakeven(S), d = PF.s2.demand(S);
    return `<h2>Your ask, in one line</h2><blockquote class="psent">I am raising ${money(ask)} to reach my first 100 paying customers, with ${q.backedPct}% of it backed by real quotes${be && !be.never ? ", and my numbers reach break-even in month " + be.months : ""}.</blockquote><div class="tiles">${tile("backed by real quotes so far", q.backedPct + "%", q.backedPct >= 50 ? "green" : "red")}${tile("customers who said they would pay", d.n ? d.payYes + "%" : "no interviews yet", d.payYes >= 40 ? "green" : "amber")}${tile("your real ask by your quotes", money(q.realAsk), "")}</div><p class="note">Numbers marked as not yet proven will be tested in Mission 4 with real strangers and real money.</p>`;
  };

  // ---------- Mission 2 ----------
  const READ = [["strong", "Most would pay"], ["mixed", "Some would pay"], ["weak", "Few or none would pay"]];
  const NEXT = [["price", "Change the price"], ["customer", "Change who the customer is"], ["product", "Change the product"], ["more", "Keep going and test more"], ["drop", "Drop this idea"]];
  const M2 = {
    evaluate(S) {
      const m = MS(S, 2), d = PF.s2.demand(S), wp = val(S, "whoPays"), need = wp && wp !== "users", fails = [], pass = [];
      const ck = (ok, o, f, fix) => (ok ? pass.push(o) : fails.push({ t: f, fix }));
      ck(d.n >= 12, d.n + " interviews confirmed", "Only " + d.n + " confirmed interviews (those from your own device do not count). You need 12.", "Send links to more people. Each answers in 40 seconds on their own phone.");
      ck(d.strangers >= 5, d.strangers + " strangers among them", "Only " + d.strangers + " were strangers. You need 5 who are not friends or family.", "Talk to people you did not know before: shops, markets, classes, groups.");
      if (need) ck(d.payers >= 3, d.payers + " people who pay were interviewed", "Someone other than the user pays, but only " + d.payers + " payer interview(s). You need 3.", "Interview the people who will actually pay: parents, owners, managers.");
      ck(!!m.reading, "You gave your honest reading", "You have not said how you read the answers.", "Pick the line that matches what people told you.");
      ck(!!m.nextAct, "You chose your next move", "You have not said what you will do next.", "Pick your next move.");
      const over = m.reading === "strong" && d.level === "weak" || (m.reading === "strong" && d.level === "mixed" && d.payYes < 30);
      ck(!over, "Your reading matches the answers", "You wrote 'most would pay', but only " + d.payYes + "% said yes. Read the answers again.", "Update your reading to match what people said.");
      return { ok: fails.length === 0, fails, pass, d };
    },
    brief(S) {
      const wp = val(S, "whoPays"), need = wp && wp !== "users";
      return `<section><p class="eyebrow">Mission 2</p><h1>Ask real people, and listen</h1><p class="lead">Your numbers have so far come from your own head. Now other people answer. Each person gets a link, opens it on their own phone, and answers in 40 seconds. Step 3 opens only when enough real answers come in.</p>
      <div class="card"><h2>What to do</h2><ol class="steps"><li>Send the link to <b>at least 12 people</b>, at least <b>5 strangers</b>${need ? ", and <b>3 people who would pay</b> (not only users)" : ""}.</li><li>Do not explain or sell. Say: "Please answer 6 quick taps for a student project."</li><li>When their answers arrive, read them honestly.</li><li>Say what you will do next, whatever they said.</li></ol></div>
      <div class="card"><h2>What the checker needs</h2><ul class="ded"><li><span>Confirmed interviews</span><b>12 or more</b></li><li><span>Of those, strangers</span><b>5 or more</b></li>${need ? "<li><span>People who pay</span><b>3 or more</b></li>" : ""}<li><span>Your honest reading and next move</span><b>chosen</b></li></ul></div>
      <p class="small">What counts as strong: 20% or more put down a deposit, or half say yes at your price and most feel the problem often. A weak result is not a failure. Facing it early is the whole point, and it is rewarded.</p>
      <button class="btn" data-act="mstart">I accept the mission</button></section>`;
    },
    submit(S) {
      const m = MS(S, 2), d = PF.s2.demand(S);
      return `<section><p class="eyebrow">Mission 2 · interviews</p><h1>Collect the answers</h1>
      <div class="card"><h2>Interview links</h2><p class="small">One link per person. Each answers on their own phone. Links opened on your own device do not count.</p><div id="wlist">${wrows(S, m, "interview", "Person") || '<p class="small">No links yet.</p>'}</div><div class="chips"><button class="btn small" data-act="madd">Add an interview link</button><button class="chip" data-act="mdemo">Demo: simulate 14 people</button><label class="chk inline"><input type="checkbox" id="msame" ${m.allowSame ? "checked" : ""}> Demo: accept answers from this device</label></div></div>
      ${d.n ? `<div class="card"><h2>What they said so far</h2><div class="tiles">${tile("interviews", d.n, "")}${tile("feel it often or sometimes", d.face + "%", d.face < 40 ? "red" : "")}${tile("would pay your price", d.payYes + "%", d.payYes < 25 ? "red" : "")}${tile("would put down a deposit", d.dep + "%", d.dep < 5 ? "red" : "")}</div>${d.strangerYes !== null && d.friendYes !== null ? `<p class="note">Strangers who said yes: <b>${d.strangerYes}%</b>. Friends and family who said yes: <b>${d.friendYes}%</b>.</p>` : ""}</div>` : ""}
      <div class="card"><h2>Your honest reading</h2><label class="lab">What do the answers say?</label>${chipRow(READ, m.reading, "mset", "reading")}<label class="lab">What will you do next?</label>${chipRow(NEXT, m.nextAct, "mset", "nextAct")}</div>
      <button class="btn" data-act="msubmit">Submit for checking</button></section>`;
    },
    verdict(S) {
      const m = MS(S, 2), v = m.verdict; if (!v) return "<p>No result yet.</p>"; const d = PF.s2.demand(S);
      const reasons = Object.entries(d.reasons).sort((a, b) => b[1] - a[1]).slice(0, 3).map((r) => ({ price: "The price felt too high", need: "They do not feel the need", trust: "They do not trust a new seller", timing: "Not the right time", other: "Another reason" }[r[0]] + " (" + r[1] + ")"));
      const body = `<div class="card"><h2>What your customers told you</h2><div class="tiles">${tile("said yes at your price", d.payYes + "%", d.payYes < 25 ? "red" : "green")}${tile("would put down a deposit", d.dep + "%", d.dep < 5 ? "red" : "green")}${tile("feel the problem often", d.face + "%", d.face < 40 ? "red" : "")}${tile("strangers who said yes", d.strangerYes === null ? "n/a" : d.strangerYes + "%", "")}</div>${reasons.length ? `<p class="note"><b>Why the others said no:</b> ${e(reasons.join("; "))}.</p>` : ""}<p class="note">Reading from the answers: <b>${{ strong: "strong demand", mixed: "mixed demand", weak: "weak demand", none: "not enough answers" }[d.level]}</b>.</p></div>`;
      if (v.ok) return `<section class="center"><p class="eyebrow">Mission 2 · checked</p><h1>Proof accepted</h1><div class="card cele"><div class="cele-ico">🏆</div><div><h3>Gate to Step 3: OPEN</h3><p class="small">${PF.game.g(S).xp} XP in total</p></div></div><div class="card ok"><h2>What passed</h2><ul class="ded">${v.pass.map((p) => `<li><span>✓ ${e(p)}</span></li>`).join("")}</ul></div>${body}<button class="btn" data-act="nextstep">Begin Step 3</button> <button class="btn ghost" data-act="mreview">Edit my proof</button></section>`;
      return `<section><p class="eyebrow">Mission 2 · checked</p><h1>Not accepted yet</h1><div class="card no"><h2>Gate to Step 3: LOCKED</h2><ul class="fails">${v.fails.map((x) => `<li><b>${e(x.t)}</b><span>Next step: ${e(x.fix)}</span></li>`).join("")}</ul></div>${d.n ? body : ""}<button class="btn" data-act="mreview">Fix and resubmit</button></section>`;
    },
    click(act, d, S, h) {
      const m = MS(S, 2);
      if (act === "mdemo") { m.witnesses = m.witnesses || []; const R = [["stranger", "often", "mix", "yes", "maybe", "yes", "price"], ["stranger", "sometimes", "none", "maybe", "no", "no", "price"], ["classmate", "often", "paid", "yes", "yes", "yes", "other"], ["stranger", "often", "mix", "payer", "yes", "yes", "other"], ["friend", "sometimes", "free", "yes", "yes", "no", "other"], ["stranger", "rarely", "none", "no", "no", "no", "need"], ["stranger", "often", "paid", "both", "yes", "yes", "other"], ["family", "sometimes", "none", "yes", "maybe", "no", "price"], ["stranger", "often", "mix", "payer", "maybe", "no", "trust"], ["friend", "often", "paid", "yes", "yes", "yes", "other"], ["stranger", "sometimes", "mix", "payer", "no", "no", "price"], ["stranger", "often", "paid", "user", "yes", "no", "timing"], ["classmate", "sometimes", "none", "payer", "maybe", "no", "need"], ["stranger", "often", "mix", "both", "yes", "yes", "other"]];
        R.forEach((x, i) => { const t = newTok("sim"), role = ["payer", "both", "user", "yes"].includes(x[3]) ? (x[3] === "yes" ? "user" : x[3]) : "user"; m.witnesses.push({ token: t }); localStorage.setItem("pf-w-" + t, JSON.stringify({ k: "interview", rel: x[0], face: x[1], today: x[2], role, pay: x[4], dep: x[5], why: x[6], spent: x[2] === "none" || x[2] === "free" ? "none" : "some", device: "sim-" + i, at: Date.now() })); }); h.save(); h.render(); return true; }
      return false;
    },
    award(S, v, G) {
      const d = v.d; G.award(S, "m2:attempt", 10, "Submitted interviews");
      for (let i = 0; i < Math.min(12, d.n); i++) G.award(S, "m2:int:" + i, 10, "A real answer collected");
      if (d.strangers >= 5) G.award(S, "m2:str", 40, "5 strangers interviewed");
      if (v.ok && d.level === "weak") G.award(S, "m2:weak", 50, "Courage: you faced weak demand");
      if (v.ok) { G.award(S, "m2:pass", 150, "Gate to Step 3 opened"); G.celebrate(S, "Gate to Step 3 is OPEN", "Real people answered", 150); }
    },
    after() { const same = document.getElementById("msame"), S = PF.getState(); if (same) same.onchange = () => { (MS(S, S.step)).allowSame = same.checked; PF.store.save(S); PF.ui.render(); }; },
  };

  // ---------- Mission 3 ----------
  const TERMS = [["advance", "Pay in advance"], ["credit", "Credit allowed"], ["unknown", "Not stated"]];
  const quoteSlots = (m, key) => { m.quotes = m.quotes || {}; const q = (m.quotes[key] = m.quotes[key] || [{}, {}, {}]); while (q.length < 3) q.push({}); return q; };
  const M3 = {
    evaluate(S) {
      const m = MS(S, 3), dev = PF.deviceId(), main = PF.s3.mainCosts(S), fails = [], pass = [];
      const ck = (ok, o, f, fix) => (ok ? pass.push(o) : fails.push({ t: f, fix }));
      main.forEach((r) => { const list = quoteSlots(m, r.key).filter((x) => x.vendor && x.vendor.trim().length > 1 && Number(x.amt) > 0), vendors = new Set(list.map((x) => x.vendor.trim().toLowerCase()));
        ck(list.length >= 2 && vendors.size >= 2, r.label + ": " + list.length + " real quotes", r.label + ": " + list.length + " valid quote(s) from " + vendors.size + " vendor(s). You need 2 from different vendors.", "Ask two different vendors or suppliers for a written price for " + r.label.toLowerCase() + "."); });
      const files = (m.files || []).length; ck(files >= 2, files + " quote files attached", "Only " + files + " quote file(s). Attach at least 2 (a message screenshot, an e-mail or a price list).", "Attach the screenshots or PDFs of the quotes.");
      const ws = (m.witnesses || []).map((w) => PF.readW(w.token)).filter((r) => r && r.k === "operator" && r.answer === "yes" && (m.allowSame || r.device !== dev));
      ck(ws.length >= 1, ws.length + " operator confirmed your day", "No operator has confirmed that you spent a day working in their business.", "Spend a day inside a business like yours. Ask the owner to confirm your visit with the link.");
      const q = PF.s3.quoted(S);
      return { ok: fails.length === 0, fails, pass, q };
    },
    brief(S) {
      const main = PF.s3.mainCosts(S);
      return `<section><p class="eyebrow">Mission 3</p><h1>Replace your estimates with real prices</h1><p class="lead">Your money buckets are guesses until a vendor writes a price. Collect real quotes for your three biggest costs, and spend one day inside a real business like yours. Step 4 opens only when this is done.</p>
      <div class="card"><h2>Your three biggest costs</h2><ul class="ded">${main.map((r) => `<li><span>${e(r.label)}</span><b>${money(r.amt)}</b></li>`).join("") || "<li><span>No bucket filled yet. Go back to Round 4.</span></li>"}</ul></div>
      <div class="card"><h2>What to do</h2><ol class="steps"><li>For each of the three costs, get <b>2 quotes</b> from different vendors.</li><li>Attach proof: a message screenshot, an e-mail or a price list.</li><li>Spend <b>one working day</b> inside a business like yours. Send the owner the link to confirm your visit.</li></ol></div>
      <p class="small">Your total will be corrected to match the average of your quotes. The part your quotes support is called backed. At least half of your ask must be backed before you can approach investors.</p>
      <button class="btn" data-act="mstart">I accept the mission</button></section>`;
    },
    submit(S) {
      const m = MS(S, 3), main = PF.s3.mainCosts(S);
      const block = main.map((r) => `<div class="card"><h2>${e(r.label)} <small>(your number: ${money(r.amt)})</small></h2>${quoteSlots(m, r.key).map((x, i) => `<div class="qrow"><input class="alt-in" data-q="${r.key}" data-i="${i}" data-f="vendor" placeholder="Vendor name" value="${e(x.vendor || "")}" aria-label="Vendor ${i + 1}"><input class="alt-in" type="number" min="0" data-q="${r.key}" data-i="${i}" data-f="amt" placeholder="Amount in rupees" value="${x.amt || ""}" aria-label="Amount ${i + 1}">${chipRow(TERMS, x.terms, "qterm", r.key + "|" + i)}</div>`).join("")}</div>`).join("");
      const files = (m.files || []);
      return `<section><p class="eyebrow">Mission 3 · quotes</p><h1>Bring the real prices</h1>${block}
      <div class="card"><h2>Proof of quotes</h2><p class="small">Screenshots, e-mails or price lists. At least 2.</p><input type="file" id="pf-quotes" accept="image/*,application/pdf" multiple><ul class="flist">${files.map((x) => `<li>${e(x.name)} <em>${Math.round(x.size / 1024)} KB</em></li>`).join("")}</ul></div>
      <div class="card"><h2>A day inside a business</h2><p class="small">The owner or manager opens the link on their own phone and confirms your visit.</p><div id="wlist">${wrows(S, m, "operator", "Operator") || '<p class="small">No link yet.</p>'}</div><div class="chips"><button class="btn small" data-act="madd">Add an operator link</button><button class="chip" data-act="mdemo">Demo: simulate an operator and sample quotes</button><label class="chk inline"><input type="checkbox" id="msame" ${m.allowSame ? "checked" : ""}> Demo: accept answers from this device</label></div></div>
      <button class="btn" data-act="msubmit">Submit for checking</button></section>`;
    },
    verdict(S) {
      const m = MS(S, 3), v = m.verdict; if (!v) return "<p>No result yet.</p>"; const q = PF.s3.quoted(S);
      const tbl = `<div class="card"><h2>Your numbers against the real prices</h2><table class="tbl"><thead><tr><th>Bucket</th><th>You said</th><th>Quotes say</th><th>Backed</th></tr></thead><tbody>${q.rows.filter((r) => r.amt > 0).map((r) => `<tr><th>${e(r.label)}</th><td>${money(r.amt)}</td><td>${r.avg === null ? "no quotes" : money(r.avg)}</td><td>${r.avg === null ? "no" : "yes"}</td></tr>`).join("")}<tr class="hl"><th>Total</th><td>${money(q.total)}</td><td>${money(q.realAsk)}</td><td>${q.backedPct}%</td></tr></tbody></table><p class="note">${q.backedPct >= 50 ? "More than half your money is backed by real quotes. That is what investors look for." : "Less than half is backed. You can still pass the mission, but investors will want more."}</p></div>`;
      if (v.ok) return `<section class="center"><p class="eyebrow">Mission 3 · checked</p><h1>Proof accepted</h1><div class="card cele"><div class="cele-ico">🏆</div><div><h3>Gate to Step 4: OPEN</h3><p class="small">${PF.game.g(S).xp} XP in total</p></div></div><div class="card ok"><h2>What passed</h2><ul class="ded">${v.pass.map((p) => `<li><span>✓ ${e(p)}</span></li>`).join("")}</ul></div>${tbl}<button class="btn" data-act="nextstep">Begin Step 4</button> <button class="btn ghost" data-act="mreview">Edit my proof</button></section>`;
      return `<section><p class="eyebrow">Mission 3 · checked</p><h1>Not accepted yet</h1><div class="card no"><h2>Gate to Step 4: LOCKED</h2><ul class="fails">${v.fails.map((x) => `<li><b>${e(x.t)}</b><span>Next step: ${e(x.fix)}</span></li>`).join("")}</ul></div><button class="btn" data-act="mreview">Fix and resubmit</button></section>`;
    },
    click(act, d, S, h) {
      const m = MS(S, 3);
      if (act === "qterm") { const [k, i] = d.k.split("|"); quoteSlots(m, k)[Number(i)].terms = d.v; h.save(); h.render(); return true; }
      if (act === "mdemo") { PF.s3.mainCosts(S).forEach((r, bi) => { const q = quoteSlots(m, r.key); q[0] = { vendor: "Vendor A" + bi, amt: Math.round(r.amt * 0.9), terms: "advance" }; q[1] = { vendor: "Vendor B" + bi, amt: Math.round(r.amt * 1.1), terms: "credit" }; }); m.files = [{ name: "quote1.png", size: 60000 }, { name: "quote2.pdf", size: 80000 }]; const t = newTok("sim"); (m.witnesses = m.witnesses || []).push({ token: t }); localStorage.setItem("pf-w-" + t, JSON.stringify({ k: "operator", answer: "yes", hours: "8", device: "sim-op", at: Date.now() })); h.save(); h.render(); return true; }
      return false;
    },
    award(S, v, G) {
      G.award(S, "m3:attempt", 10, "Submitted quotes");
      v.pass.forEach((p, i) => { if (/real quotes/.test(p)) G.award(S, "m3:q:" + p.split(":")[0], 30, "Real quotes collected"); });
      if (v.pass.some((p) => /operator confirmed/.test(p))) G.award(S, "m3:op", 40, "A day inside a real business");
      if (v.q.backedPct >= 50) G.award(S, "m3:backed", 60, "Half your money is backed");
      if (v.ok) { G.award(S, "m3:pass", 150, "Gate to Step 4 opened"); G.celebrate(S, "Gate to Step 4 is OPEN", "Real prices in hand", 150); }
    },
    after() {
      const S = PF.getState(), m = MS(S, 3), f = document.getElementById("pf-quotes");
      if (f) f.onchange = () => { m.files = (m.files || []).concat(Array.from(f.files).map((x) => ({ name: x.name, size: x.size }))); PF.store.save(S); PF.ui.render(); };
      document.querySelectorAll("[data-q]").forEach((el) => { el.onchange = () => { quoteSlots(m, el.dataset.q)[Number(el.dataset.i)][el.dataset.f] = el.value; PF.store.save(S); }; });
      M2.after();
    },
  };

  // ---------- Mission 4 ----------
  const goRead = (t) => { try { return JSON.parse(localStorage.getItem("pf-go-" + t)) || { visits: {}, signups: [], preorders: [] }; } catch (x) { return { visits: {}, signups: [], preorders: [] }; } };
  const goStats = (S) => {
    const m = MS(S, 4), dev = PF.deviceId(); if (!m.goToken) return { visits: 0, signups: 0, signupsV: 0, pre: 0, preV: 0 };
    const g = goRead(m.goToken), ok = (x) => m.allowSame || x.device !== dev;
    const vis = Object.keys(g.visits).filter((d) => m.allowSame || d !== dev).length, su = g.signups.filter(ok), pr = g.preorders.filter(ok);
    return { visits: vis, signups: g.signups.length, signupsV: su.filter((x) => x.rel === "stranger").length + su.filter((x) => x.rel !== "stranger").length, signupsS: su.filter((x) => x.rel === "stranger").length, pre: g.preorders.length, preV: pr.length, preS: pr.filter((x) => x.rel === "stranger").length };
  };
  const M4 = {
    evaluate(S) {
      const m = MS(S, 4), g = goStats(S), q = PF.s3.quoted(S), fails = [], pass = [];
      const ck = (ok, o, f, fix) => (ok ? pass.push(o) : fails.push({ t: f, fix }));
      ck(!!m.goToken, "Your tracked link exists", "You have not created your test link.", "Create the test link and put it in front of strangers.");
      ck(g.visits >= 100, g.visits + " different people visited", "Only " + g.visits + " different visitors. You need 100.", "Share the link where strangers will see it: groups, markets, posters with the link, small paid ads.");
      const okSign = g.signups >= 10 && g.signupsS >= 3, okPre = g.pre >= 3 && g.preS >= 3;
      ck(okSign || okPre, okPre ? g.pre + " pre-orders, " + g.preS + " from strangers" : g.signups + " sign-ups, " + g.signupsS + " from strangers", "You have " + g.signups + " sign-ups (" + g.signupsS + " strangers) and " + g.pre + " pre-orders (" + g.preS + " strangers). You need 10 sign-ups with 3 strangers, or 3 pre-orders from strangers.", "Ask visitors to join the waiting list or pre-order. Pre-orders are the stronger signal.");
      ck(!!m.askDecision, "You decided about your ask", "You have not decided what to do about your ask.", "Keep your ask or reduce it to what your quotes support.");
      if (m.askDecision === "keep" && q.backedPct < 50) ck(false, "", "You kept an ask that is only " + q.backedPct + "% backed by quotes. Investors will see this at once.", "Reduce your ask to " + money(Math.round(q.realAsk / 1000) * 1000) + " or collect more quotes.");
      return { ok: fails.length === 0, fails, pass, g };
    },
    brief(S) {
      return `<section><p class="eyebrow">Mission 4</p><h1>The smoke test</h1><p class="lead">Investors do not want your opinion of your idea. They want to see strangers act on it. You will make one tracked link, put it in front of at least 100 different people, and count how many sign up or pre-order.</p>
      <div class="card"><h2>What to do</h2><ol class="steps"><li>Create your test link.</li><li>Put it where <b>strangers</b> will see it: groups, markets, posters, a small paid ad.</li><li>The page counts different visitors, sign-ups and pre-orders on its own.</li><li>Decide what to do with your ask in the light of your quotes.</li></ol></div>
      <div class="card"><h2>What the checker needs</h2><ul class="ded"><li><span>Different people who visited</span><b>100 or more</b></li><li><span>Sign-ups, with strangers among them</span><b>10 sign-ups, 3 strangers</b></li><li><span>or pre-orders from strangers</span><b>3 or more</b></li><li><span>Your decision on the ask</span><b>made</b></li></ul></div>
      <p class="small">In this local prototype the page runs in your browser. In the real product it runs on a server and pre-orders take real deposits.</p><button class="btn" data-act="mstart">I accept the mission</button></section>`;
    },
    submit(S) {
      const m = MS(S, 4), g = goStats(S), q = PF.s3.quoted(S), ask = PF.s4.askAmount(S), real = Math.round(q.realAsk / 1000) * 1000;
      return `<section><p class="eyebrow">Mission 4 · smoke test</p><h1>Count the strangers</h1>
      <div class="card"><h2>Your test link</h2>${m.goToken ? `<p class="small">Share this link. Nothing else is needed.</p><div class="chips"><button class="chip" data-act="wcopy" data-link="${e(golink(S, m.goToken))}">Copy link</button><a class="chip" target="_blank" rel="noopener" href="${e(golink(S, m.goToken))}">Open the page (demo)</a><button class="chip" data-act="mdemo">Demo: simulate 120 visitors</button></div><label class="chk inline"><input type="checkbox" id="msame" ${m.allowSame ? "checked" : ""}> Demo: count visits from this device</label>` : '<button class="btn small" data-act="mgo">Create my test link</button>'}</div>
      <div class="card"><h2>So far</h2><div class="tiles">${tile("different people visited", g.visits, g.visits < 100 ? "amber" : "green")}${tile("sign-ups", g.signups + " (" + (g.signupsS || 0) + " strangers)", "")}${tile("pre-orders", g.pre + " (" + (g.preS || 0) + " strangers)", "")}</div></div>
      <div class="card"><h2>Your ask</h2><p class="small">Your quotes back ${q.backedPct}% of your money. At the real prices you need ${money(real)}. You asked for ${money(ask)}.</p>${chipRow([["keep", "Keep my ask of " + money(ask)], ["reduce", "Reduce it to " + money(real)]], m.askDecision, "mset", "askDecision")}</div>
      <button class="btn" data-act="msubmit">Submit for checking</button></section>`;
    },
    verdict(S) {
      const m = MS(S, 4), v = m.verdict; if (!v) return "<p>No result yet.</p>";
      if (v.ok) return `<section class="center"><p class="eyebrow">Mission 4 · checked</p><h1>Smoke test passed</h1><div class="card cele"><div class="cele-ico">🏆</div><div><h3>Strangers acted on your idea</h3><p class="small">${PF.game.g(S).xp} XP in total</p></div></div><div class="card ok"><h2>What passed</h2><ul class="ded">${v.pass.map((p) => `<li><span>✓ ${e(p)}</span></li>`).join("")}</ul></div><button class="btn" data-act="togate">Check if I am ready for investors</button> <button class="btn ghost" data-act="mreview">Edit my proof</button></section>`;
      return `<section><p class="eyebrow">Mission 4 · checked</p><h1>Not accepted yet</h1><div class="card no"><h2>Smoke test: not passed</h2><ul class="fails">${v.fails.map((x) => `<li><b>${e(x.t)}</b><span>Next step: ${e(x.fix)}</span></li>`).join("")}</ul></div><button class="btn" data-act="mreview">Fix and resubmit</button></section>`;
    },
    click(act, d, S, h) {
      const m = MS(S, 4);
      if (act === "mgo") { m.goToken = newTok("go"); h.save(); h.render(); return true; }
      if (act === "mdemo") { const t = m.goToken, g = goRead(t); for (let i = 0; i < 120; i++) g.visits["sim-v" + i] = Date.now(); for (let i = 0; i < 14; i++) g.signups.push({ rel: i % 3 === 0 ? "friend" : "stranger", device: "sim-s" + i, at: Date.now() }); for (let i = 0; i < 4; i++) g.preorders.push({ rel: i === 0 ? "friend" : "stranger", device: "sim-p" + i, at: Date.now() }); localStorage.setItem("pf-go-" + t, JSON.stringify(g)); h.save(); h.render(); return true; }
      return false;
    },
    award(S, v, G) {
      G.award(S, "m4:attempt", 10, "Submitted smoke test");
      if (v.g.visits >= 100) G.award(S, "m4:vis", 40, "100 strangers saw it");
      if (v.g.signups >= 10) G.award(S, "m4:su", 40, "10 sign-ups");
      if (v.g.pre >= 3) G.award(S, "m4:pre", 80, "Strangers pre-ordered");
      if (v.ok) { G.award(S, "m4:pass", 200, "Smoke test passed"); G.celebrate(S, "Smoke test passed", "Strangers acted on your idea", 200); }
    },
    after() { M2.after(); },
  };
  (PF.missions = PF.missions || {})[2] = M2; PF.missions[3] = M3; PF.missions[4] = M4;

  // ---------- dispatcher ----------
  const cur = () => PF.missions[PF.getState().step || 1];
  const dispatch = {
    brief: (S) => cur().brief(S), submit: (S) => cur().submit(S), verdict: (S) => cur().verdict(S),
    evaluate: (S) => cur().evaluate(S),
    after: () => { const c = cur(); if (c.after) c.after(); },
    click(act, d, S, h) {
      const n = S.step || 1, m = n === 1 ? null : MS(S, n), G = PF.game;
      if (n === 1) return PF.missions[1].click(act, d, S, h);
      if (act === "mstart") { m.issuedAt = m.issuedAt || Date.now(); m.witnesses = m.witnesses || []; h.go("missionSubmit"); return true; }
      if (act === "mset") { m[d.k] = d.v; h.save(); h.render(); return true; }
      if (act === "madd") { (m.witnesses = m.witnesses || []).push({ token: newTok("w"), at: Date.now() }); h.save(); h.render(); return true; }
      if (act === "wcopy") { try { navigator.clipboard.writeText(d.link); } catch (x) { /* ignore */ } alert("Link copied. Send it on WhatsApp.\n\n" + d.link); return true; }
      if (act === "msubmit") {
        const prev = m.verdict; m.verdict = PF.missions[n].evaluate(S); m.attempts = (m.attempts || 0) + 1;
        if (prev && !prev.ok) G.award(S, "m" + n + ":retry:" + m.attempts, 20, "Grit: tried again after a rejection");
        PF.missions[n].award(S, m.verdict, G);
        if (m.verdict.ok) { if (n === 4 && m.askDecision === "reduce") S.ask = { amount: Math.round(PF.s3.quoted(S).realAsk / 1000) * 1000 }; PF.upgradeTags(S, n); }
        G.checkBadges(S); h.go("missionVerdict"); return true;
      }
      if (act === "mreview") { h.go("missionSubmit"); return true; }
      return PF.missions[n].click(act, d, S, h);
    },
  };
  PF.missionUI = dispatch;
  window.addEventListener("storage", () => { const S = PF.getState && PF.getState(); if (S && ["missionSubmit"].includes(S.screen)) PF.ui.render(); });

  // ---------- the investor-ready gate ----------
  PF.gateHTML = (S) => {
    const g = PF.gate(S), G = PF.game, ok = g.ready;
    if (ok) { G.award(S, "gate:ready", 300, "Ready for investors"); }
    return `<section class="${ok ? "center" : ""}"><p class="eyebrow">After Step 4</p><h1>${ok ? "You are ready to approach investors" : "Not ready for investors yet"}</h1><p class="lead">${ok ? "Every test below passed on evidence from other people, not on your own opinion." : "These are the checks an investor will make. Fix the ones that failed, then come back."}</p>
    <div class="card ${ok ? "ok" : "no"}"><ul class="gate">${g.checks.map((c) => `<li class="${c.ok ? "ok" : "bad"}"><b>${c.ok ? "✓" : "✗"} ${e(c.label)}</b><span>${e(c.note)}</span>${c.ok ? "" : `<button class="chip" data-act="fixstep" data-n="${c.fix}">Go and fix this</button>`}</li>`).join("")}</ul></div>
    ${ok ? `<div class="card cele"><div class="cele-ico">🚀</div><div><h3>+300 XP · Ready for investors</h3><p class="small">${G.g(S).xp} XP in total. Steps 5 to 12 take you from here to a signed cheque.</p></div></div>` : ""}</section>`;
  };
})();
