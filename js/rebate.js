/* The money-back model ("commitment deposit"), owner decision 2026-10-12.
   The founder pays Rs 19,999. It comes back as they EARN it:
     Tier A (end of Step 9): money in the bank is at least 25% of the funding target  -> Rs 9,999 back.
     Tier B (end of Step 12): sales at least 50% of the sales target, money raised at least 50% of the funding target,
                              net profit margin at least 50% of the margin they stated -> the rest back (all Rs 19,999 in total).
   We never promise that anyone will raise money. We return the fee to the founders who actually do the work.
   Targets are set in Step 1, revised once in Step 2, and locked when Mission 2 passes.
   Everything is proven by other people (funders, an accountant, customers) and audited by a person before any refund is paid.
   Steps: 9 = first money (meetings, terms, papers, 25% in the bank); 10 = sales; 11 = profit; 12 = the rest of the money and the claim. */
(function () {
  const PF = window.PF, e = PF.esc, money = PF.inr, val = PF.val, MS = PF.MS, H = PF.MH, G = PF.game;
  const FEE = 19999, HALF = 9999;
  PF.FEE = FEE;
  const FB = [500000, 1000000, 2500000, 5000000, 10000000, 25000000, 50000000];
  const SB = [100000, 250000, 500000, 1000000, 2500000, 5000000, 10000000];
  const MB = [5, 10, 15, 20, 25, 30, 40, 50];
  const okM = (S, n) => !!(MS(S, n).verdict && MS(S, n).verdict.ok);
  const num = (x) => { const n = Number(x); return Number.isFinite(n) && n > 0 ? n : 0; };

  // ======================= the three numbers =======================
  Object.assign(PF.ITEMS, {
    tFund: { fmt: "band", vals: FB, def: 2, money: true, text: () => "How much outside money will you raise for this business?", hint: "Money from people who are not you or your co-founders. This is your funding target and you will be held to it.", why: "Everything later is measured against the numbers you set here. Too low shows you do not believe in it. Too high and you cannot win. Choose what the plan needs." },
    tSales: { fmt: "band", vals: SB, def: 2, money: true, text: () => "What will your sales be in one month, once the business works?", hint: "Money received from customers in 30 days. This is your sales target.", why: "We will ask you to prove 30 days of real sales later. Half of this number is your bar." },
    tMargin: { fmt: "band", vals: MB, def: 3, unit: "%", text: () => "Of every 100 rupees of sales, how many rupees will be profit after ALL costs?", hint: "Net profit margin. Your margin target.", why: "Profit after goods, staff, rent, fees, returns, tax and interest. Half of this percentage is your bar." },
    "reveal:contract": { fmt: "reveal", kind: "contract" },
    rFund: { fmt: "band", vals: FB, def: 2, money: true, text: () => "After talking to real customers: how much outside money will you raise?", hint: "You may keep or change your Step 1 number. This is the last time you can change it.", why: "After Mission 2 passes, your three numbers are locked. They can never be lowered." },
    rSales: { fmt: "band", vals: SB, def: 2, money: true, text: () => "After talking to real customers: what monthly sales will you reach?", hint: "Keep or change your Step 1 number.", why: "Customers just told you what they would pay and how often." },
    rMargin: { fmt: "band", vals: MB, def: 3, unit: "%", text: () => "After talking to real customers: what net profit margin will you reach?", hint: "Keep or change your Step 1 number.", why: "The price they said they would pay moves this number most." },
    "reveal:contract2": { fmt: "reveal", kind: "contract" },
  });

  PF.contract = (S) => {
    if (S.contract && S.contract.locked) return S.contract;
    const pick = (a, b) => (val(S, b) !== undefined ? val(S, b) : val(S, a));
    const c = { fund: pick("tFund", "rFund"), sales: pick("tSales", "rSales"), margin: pick("tMargin", "rMargin") };
    if (okM(S, 2) && c.fund && c.sales && c.margin) S.contract = Object.assign({ locked: true, at: Date.now() }, c);
    return Object.assign({ locked: false }, c);
  };
  const modelMargin = (S) => { const f = PF.flow(S); return f && f.base && f.base.revPerSold ? Math.round((f.base.contribution / f.base.revPerSold) * 100) : null; };

  PF.REVEALS_EXTRA.contract = (S) => {
    const c = PF.contract(S); if (!c.fund || !c.sales || !c.margin) return "<p>Answer the three numbers first.</p>";
    const mm = modelMargin(S), t = PF.tile || ((l, v) => `<div class="tile"><b>${v}</b><span>${e(l)}</span></div>`);
    return `<h2>Your three numbers${c.locked ? " (locked)" : ""}</h2><div class="tiles">${H.tile("funding target", money(c.fund), "")}${H.tile("monthly sales target", money(c.sales), "")}${H.tile("profit margin target", c.margin + "%", mm !== null && c.margin > mm + 10 ? "red" : "")}</div>
    <p class="note">${mm !== null && c.margin > mm + 10 ? "Your own cost numbers give about " + mm + "% on each sale, below the " + c.margin + "% you want. Check this before you lock it." : "These are the numbers you will be measured against."}</p>
    <h3>How the Rs ${FEE.toLocaleString("en-IN")} comes back</h3>
    <ul class="ded"><li><span><b>Rs ${HALF.toLocaleString("en-IN")} back</b> at Step 9, when ${money(c.fund * 0.25)} (a quarter of your funding target) is in your bank account.</span></li>
    <li><span><b>The rest back</b> at Step 12, when you have shown sales of ${money(c.sales * 0.5)} in 30 days, ${money(c.fund * 0.5)} raised in total, and a profit margin of at least ${Math.round(c.margin * 5) / 10}%.</span></li></ul>
    <p class="small">${c.locked ? "These are locked. They can be raised, never lowered." : "You can change them once more in Step 2. They lock when Mission 2 passes."} We cannot promise anyone will raise money. We give the fee back to founders who do the work and get the result. Money counts only when a funder confirms it and it reached your bank. A person checks every claim before a refund is paid.</p>`;
  };

  // ======================= funding, sales and profit counting =======================
  const recsOf = (S, ns, kind) => {
    const dev = PF.deviceId(), out = {};
    ns.forEach((n) => { const m = MS(S, n); (m.witnesses || []).forEach((w) => { const r = PF.readW(w.token); if (r && r.k === kind && (m.allowSame || r.device !== dev)) out[r.device + "|" + w.token] = Object.assign({ n }, r); }); });
    // one confirmation per device for funders (the highest), so one person cannot be counted twice
    if (kind !== "funder") return Object.values(out);
    const best = {}; Object.values(out).forEach((r) => { if (!best[r.device] || num(r.amt) > num(best[r.device].amt)) best[r.device] = r; });
    return Object.values(best);
  };
  const proofCount = (S, ns, key) => ns.reduce((a, n) => a + (((MS(S, n).fl || {})[key] || []).length), 0);
  const REL_WEIGHT = { stranger: "u", friend: "r", family: "r", colleague: "r", self: "x" };

  PF.fundStats = (S) => {
    const all = recsOf(S, [9, 12], "funder"), rec = all.filter((r) => r.stage === "received"), sig = all.filter((r) => r.stage !== "verbal");
    const sum = (list, w) => list.filter((r) => REL_WEIGHT[r.know] === w).reduce((a, r) => a + num(r.amt), 0);
    const count = (list) => { const u = sum(list, "u"), r = sum(list, "r"); return { u, r, counted: u + Math.min(r, u), capped: r > u }; };
    const bank = proofCount(S, [9, 12], "bank"), needBank = rec.length;
    const R = count(rec), Sg = count(sig);
    return { n: all.length, received: bank >= needBank ? R.counted : 0, receivedClaimed: R.counted, signed: Sg.counted, capped: R.capped || Sg.capped, rawRelated: R.r, bank, needBank, hasStranger: R.u > 0 };
  };
  PF.salesStats = (S) => {
    const m = MS(S, 10), ca = recsOf(S, [10], "sales").filter((r) => ["ca", "accountant"].includes(r.role)), buys = recsOf(S, [10], "buy").filter((r) => r.answer === "yes");
    const claimed = num(m.sales), checked = ca.length ? Math.min(...ca.map((r) => num(r.amt))) : 0, verified = claimed && checked ? Math.min(claimed, checked) : 0;
    const strangers = buys.filter((r) => r.rel === "stranger").length;
    return { claimed, checked, verified, ca: ca.length, buys: buys.length, strangers, strangerPct: buys.length ? Math.round((strangers / buys.length) * 100) : 0, conc: ca.some((r) => r.conc === "gt40"), rel: ca.some((r) => r.relshare === "gt50"), files: ((m.fl || {}).sales || []).length, mismatch: !!(claimed && checked && Math.abs(claimed - checked) / Math.max(claimed, checked) > 0.1) };
  };
  PF.profitStats = (S) => {
    const m = MS(S, 11), ss = PF.salesStats(S), ca = recsOf(S, [11], "pnl").filter((r) => ["ca", "accountant"].includes(r.role));
    const rows = ca.map((r) => ({ sales: num(r.sales), profit: Number(r.profit), all: r.all, margin: num(r.sales) ? (Number(r.profit) / num(r.sales)) * 100 : null }));
    const worst = rows.length ? rows.slice().sort((a, b) => (a.margin ?? -999) - (b.margin ?? -999))[0] : null;
    const salesMatch = worst && ss.verified ? Math.abs(worst.sales - ss.verified) / Math.max(worst.sales, ss.verified) <= 0.1 : false;
    return { ca: rows.length, margin: worst ? worst.margin : null, allCosts: rows.length > 0 && rows.every((r) => r.all === "yes"), salesMatch, files: ((m.fl || {}).pnl || []).length, claimedMargin: m.margin === undefined || m.margin === "" ? null : Number(m.margin) };
  };

  PF.refund = (S) => {
    const c = PF.contract(S), f = PF.fundStats(S), a = okM(S, 9), b = okM(S, 10) && okM(S, 11) && okM(S, 12);
    return { fee: FEE, c, f, a, b, back: b ? FEE : a ? HALF : 0, bar25: c.fund ? c.fund * 0.25 : 0, bar50: c.fund ? c.fund * 0.5 : 0 };
  };
  PF.outcomesCard = (S) => {
    const r = PF.refund(S), f = r.f;
    const row = (ok, t, note) => `<li><span>${ok ? "✓" : "○"} <b>${e(t)}</b></span><span class="small">${e(note)}</span></li>`;
    return `<div class="card ${r.b ? "ok" : ""}"><h2>Your deposit: ${money(r.back)} of ${money(FEE)} earned</h2><ul class="ded">
      ${row(r.a, "Step 9: first money in the bank", r.c.fund ? money(f.received) + " in the bank, bar " + money(r.bar25) + " (a quarter of " + money(r.c.fund) + ")" : "Set your targets first.")}
      ${row(okM(S, 10), "Step 10: sales", okM(S, 10) ? "Proven" : "Half of your sales target, proven for 30 days")}
      ${row(okM(S, 11), "Step 11: profit", okM(S, 11) ? "Proven" : "Half of your margin target, proven by an accountant")}
      ${row(okM(S, 12), "Step 12: half the money raised", okM(S, 12) ? "Proven" : money(f.received) + " of " + money(r.bar50))}
    </ul><p class="small">A person audits every claim before any refund is paid. A false claim ends the refund.</p></div>`;
  };

  PF.planB = (S) => {
    const r = PF.refund(S), ask = r.c.fund || PF.s4.askAmount(S), small = Math.max(Math.round((ask * 0.25) / 1000) * 1000, 100000);
    return `<div class="card"><h2>Plan B: the money has not reached your bank</h2><p class="small">Three honest causes: the cheque is the wrong size, the route is wrong, or the proof is too thin. Try this order, not the same pitch again.</p><ol class="small"><li><b>Shrink the first cheque.</b> Ask for ${money(small)} to run one more proven cycle. Smaller cheques close faster and from more kinds of people. Your target stays ${money(ask)}; this is only the first piece.</li><li><b>Change the route:</b> a grant or incubator, a programme with a fixed cheque, a loan against orders, or customers paying in advance.</li><li><b>Change the room:</b> ask each person who said no for the one person they would show this to.</li><li><b>Add proof:</b> one more paid stranger moves more doubts than a better deck.</li></ol></div>`;
  };

  // ======================= new items for Steps 9 to 12 =======================
  Object.assign(PF.ITEMS, {
    f9K1: { fmt: "tf", knowledge: true, correct: true, text: () => "For the first refund, money counts only when it has reached your bank account.", expl: "True. A promise, a term sheet or an e-mail is not money. The funder confirms it and your bank statement shows it." },
    f9Who: { fmt: "single", text: () => "Where will your first quarter of the money come from?", opts: [{ v: "strangers", label: "Investors or a programme I did not know before" }, { v: "grant", label: "A grant or a government scheme" }, { v: "famfriends", label: "Family and friends only" }, { v: "loan", label: "A loan" }, { v: "unknown", label: "I do not know yet" }], why: "Money from people who know you counts, but at most half of what you count may be from them. At least some must come from strangers." },
    "reveal:first25": { fmt: "reveal", kind: "first25" },
    sK1: { fmt: "single", knowledge: true, correct: "paid", text: () => "When does a sale count here?", opts: [{ v: "paid", label: "When a customer's money has reached you and was not given back" }, { v: "order", label: "When a customer places an order" }, { v: "promise", label: "When a customer says they will buy" }, { v: "invoice", label: "When I send the invoice" }], expl: "Only money that reached you and stayed counts. Orders that are cancelled or refunded do not." },
    sK2: { fmt: "tf", knowledge: true, correct: false, text: () => "Sales to friends and family count as much as sales to strangers.", expl: "False. Friends buy to be kind. Strangers buy because it is worth it. Here, sales to people you know are capped." },
    sWin: { fmt: "single", text: () => "Which 30 days will you use to show your sales?", opts: [{ v: "last", label: "The latest complete 30 days" }, { v: "best", label: "My best 30 days" }, { v: "festival", label: "A festival or one-off month" }, { v: "pick", label: "Whichever looks best" }], why: "The accountant checks the latest complete 30 days. A cherry-picked month is rejected." },
    sNow: { fmt: "band", vals: [0, 25000, 50000, 100000, 250000, 500000, 1000000, 2500000, 5000000], def: 3, money: true, text: () => "What were your sales in the latest complete 30 days?", hint: "Money received from customers.", why: "Where you stand today. The bar is half of your sales target." },
    sConc: { fmt: "band", vals: [5, 10, 20, 30, 40, 60, 80, 100], def: 3, unit: "%", text: () => "What share of those sales came from your single biggest customer?", why: "One customer above 40% is a risk, not a market. It is not accepted." },
    sRel: { fmt: "band", vals: [0, 10, 20, 30, 50, 70, 100], def: 2, unit: "%", text: () => "What share of those sales came from friends and family?", why: "Sales to people you know are counted at a cap. More than half of your sales must come from strangers." },
    sPlan: { fmt: "multi", excl: "none", text: () => "How will you close the gap to your sales bar? Tick all.", opts: [{ v: "channel", label: "Reach more customers in a channel that already works" }, { v: "price", label: "Test a higher price" }, { v: "repeat", label: "Bring back customers who already bought" }, { v: "partner", label: "A reseller or partner" }, { v: "none", label: "I have no plan yet" }], why: "A gap with no plan is a wish." },
    "reveal:salesgap": { fmt: "reveal", kind: "salesgap" },
    pK1: { fmt: "single", knowledge: true, correct: "all", text: () => "Profit for this programme is sales minus:", opts: [{ v: "all", label: "Every cost of running the business in those 30 days" }, { v: "goods", label: "Only the cost of the goods" }, { v: "cash", label: "Only costs I paid in cash" }, { v: "ads", label: "Everything except marketing" }], expl: "Every cost: goods, staff, rent, fees, returns, tax and interest. Leaving costs out is how profit becomes imaginary." },
    pK2: { fmt: "tf", knowledge: true, correct: false, text: () => "A 50% markup on cost means a 50% profit margin.", expl: "False. Cost 100, price 150: profit 50 on sales of 150 is a 33% margin. Margin is measured on sales." },
    pForget: { fmt: "multi", excl: "none", text: () => "Which costs have you counted in your profit? Tick only those you counted.", opts: [{ v: "tax", label: "GST and tax paid" }, { v: "returns", label: "Refunds and returns" }, { v: "fees", label: "Platform and payment fees" }, { v: "rent", label: "Rent and electricity" }, { v: "staff", label: "Staff pay, and my own pay if I take any" }, { v: "interest", label: "Loan interest" }, { v: "none", label: "I have not counted any of these" }], why: "These are the costs founders forget. Each one comes out of profit." },
    pNow: { fmt: "band", vals: [-20, -10, 0, 5, 10, 15, 20, 25, 30, 40], def: 4, unit: "%", text: () => "What net margin did the latest 30 days give?", hint: "A loss is allowed. Pick a negative number if you lost money.", why: "Where you stand today. The bar is half of the margin you set." },
    "reveal:margin": { fmt: "reveal", kind: "margin" },
    pLever: { fmt: "single", text: () => "If your margin is under the bar, what do you do first?", opts: [{ v: "price", label: "Test a higher price on real customers" }, { v: "cost", label: "Get a quote to cut my biggest cost" }, { v: "mix", label: "Sell more of what earns the most" }, { v: "cut", label: "Stop what earns nothing" }, { v: "wait", label: "Wait and see" }], why: "Margin moves by price, cost or mix. Waiting moves nothing." },
    fK1: { fmt: "single", knowledge: true, correct: "proof", text: () => "The second round of money is easier when:", opts: [{ v: "proof", label: "You show, in numbers, what you did with the first money" }, { v: "more", label: "You ask for a bigger amount" }, { v: "deck", label: "You have a better deck" }, { v: "wait", label: "You wait until you are sure" }], expl: "What you did with the first money is the best evidence there is." },
    fK2: { fmt: "tf", knowledge: true, correct: false, text: () => "Raising more than the plan needs is always safer.", expl: "False. Extra money costs extra shares and teaches bad spending. Raise what the plan needs." },
    fRest: { fmt: "single", text: () => "Where will the rest of your target come from?", opts: [{ v: "same", label: "The funder who already backed me" }, { v: "new", label: "New investors" }, { v: "grant", label: "A grant or a programme" }, { v: "loan", label: "A loan against orders" }, { v: "unknown", label: "I do not know yet" }], why: "Half of your target must be in the bank, from funders who confirm it." },
    "reveal:fundgap": { fmt: "reveal", kind: "fundgap" },
    fHonest: { fmt: "tf", conf: true, text: () => "Everything I submit for the final check is true and complete.", why: "A person audits it. One false number ends the refund." },
    fKeep: { fmt: "multi", excl: "none", text: () => "Which papers will you keep ready for the audit? Tick all.", opts: [{ v: "bank", label: "Bank statements" }, { v: "inv", label: "Invoices or a sales ledger" }, { v: "gst", label: "GST returns" }, { v: "pnl", label: "Profit and loss, prepared by an accountant" }, { v: "agr", label: "The signed funding agreements" }, { v: "none", label: "None, I will find them" }], why: "The audit asks for these first." },
    "reveal:score": { fmt: "reveal", kind: "score" },
  });

  PF.REVEALS_EXTRA.first25 = (S) => {
    const r = PF.refund(S); if (!r.c.fund) return "<p>Set your targets first.</p>";
    return `<h2>Your first quarter</h2><div class="tiles">${H.tile("funding target", money(r.c.fund), "")}${H.tile("first quarter in the bank", money(r.bar25), "amber")}${H.tile("refund when it is there", money(HALF), "green")}</div><p class="note">Before the money can arrive, investors read your terms and check your papers. Step 9 walks you through meetings, terms and papers, then the money itself.</p>`;
  };
  PF.REVEALS_EXTRA.salesgap = (S) => {
    const c = PF.contract(S), now = val(S, "sNow"); if (!c.sales || now === undefined) return "<p>Answer the sales questions first.</p>";
    const bar = c.sales * 0.5, pct = Math.round((now / c.sales) * 100);
    return `<h2>Where you stand</h2><div class="tiles">${H.tile("sales target", money(c.sales), "")}${H.tile("the bar (half)", money(bar), "amber")}${H.tile("you said you sell", money(now), now >= bar ? "green" : "red")}</div><p class="note">${now >= bar ? "You say you are above the bar. The accountant will check it." : "You are at " + pct + "% of your target. You need " + money(bar - now) + " more a month to reach the bar."}</p>`;
  };
  PF.REVEALS_EXTRA.margin = (S) => {
    const c = PF.contract(S), now = val(S, "pNow"); if (!c.margin || now === undefined) return "<p>Answer the profit questions first.</p>";
    const bar = Math.round(c.margin * 5) / 10, mm = modelMargin(S);
    return `<h2>Where you stand</h2><div class="tiles">${H.tile("margin target", c.margin + "%", "")}${H.tile("the bar (half)", bar + "%", "amber")}${H.tile("you said you earn", now + "%", now >= bar ? "green" : "red")}${mm !== null ? H.tile("your Step 1 numbers gave", mm + "%", "") : ""}</div><p class="note">${now >= bar ? "You say you are above the bar. The accountant will check the figure." : "You are " + Math.round((bar - now) * 10) / 10 + " points under the bar."}</p>`;
  };
  PF.REVEALS_EXTRA.fundgap = (S) => {
    const r = PF.refund(S); if (!r.c.fund) return "<p>Set your targets first.</p>";
    return `<h2>Money raised so far</h2><div class="tiles">${H.tile("funding target", money(r.c.fund), "")}${H.tile("the bar (half)", money(r.bar50), "amber")}${H.tile("in your bank, confirmed", money(r.f.received), r.f.received >= r.bar50 ? "green" : "red")}</div><p class="note">Money from people who know you counts, but at most half of the total counted. The rest must come from strangers.</p>`;
  };
  PF.REVEALS_EXTRA.score = (S) => PF.outcomesCard(S);

  // ======================= the steps =======================
  const old9 = PF.STEPS.filter((s) => s.id >= 9).map((s) => s.units[0]);
  const first = { id: 1, title: "Your first quarter", finds: "What the first piece of money is, and where it comes from.", items: ["f9K1", "f9Who", "reveal:first25"], prelude: [{ h: "A quarter is a start", p: "You set a funding target. The first goal is one quarter of it in your bank account. That brings back the first half of your deposit." }, { h: "Money has a road", p: "Meetings, then terms, then papers, then the money. We walk the road in that order." }] };
  const U9 = [first, old9[0], old9[1], old9[2], old9[3]].map((u, i) => Object.assign({}, u, { id: i + 1 }));
  const U10 = [
    { id: 1, title: "What counts as a sale", finds: "What the accountant will accept as sales.", items: ["sK1", "sK2", "sWin"], prelude: [{ h: "Sales are cash that stayed", p: "A sale is money from a customer that reached you and was not refunded. Orders, promises and invoices are not sales yet." }, { h: "Strangers matter more", p: "Friends and family buy to be kind. Strangers buy because it is worth it. We count both, with a cap on people you know." }] },
    { id: 2, title: "Where you stand", finds: "How far you are from the sales bar and how you will close the gap.", items: ["sNow", "sConc", "sRel", "reveal:salesgap", "sPlan"], prelude: [{ h: "Half your target", p: "The bar for the full refund is half of the monthly sales you set in Step 1 and Step 2, shown for 30 real days." }] },
  ];
  const U11 = [
    { id: 1, title: "What profit really is", finds: "Whether you count every cost.", items: ["pK1", "pK2", "pForget"], prelude: [{ h: "Profit is what is left", p: "After goods, staff, rent, fees, returns, tax and interest. Most first-time numbers forget two or three of these." }] },
    { id: 2, title: "Where you stand", finds: "How far you are from the margin bar and what you will change.", items: ["pNow", "reveal:margin", "pLever"], prelude: [{ h: "Half your margin", p: "The bar is half of the profit percentage you set. An accountant confirms the figure from the same 30 days as your sales." }] },
  ];
  const U12 = [
    { id: 1, title: "The rest of the money", finds: "Where the second half of the funding will come from.", items: ["fK1", "fK2", "fRest", "reveal:fundgap"], prelude: [{ h: "Half the target", p: "For the full refund, half of your funding target must be in your bank in total, confirmed by the funders." }] },
    { id: 2, title: "The final check", finds: "Whether your claim will survive an audit.", items: ["fHonest", "fKeep", "reveal:score"], prelude: [{ h: "A person checks it", p: "Before any refund is paid, a person looks at your papers. Keep them ready. One false number ends the refund." }] },
  ];
  PF.STEPS = PF.STEPS.filter((s) => s.id < 9).concat([
    { id: 9, name: "Get the first money", units: U9, theme: "e" },
    { id: 10, name: "Prove your sales", units: U10, theme: "a" },
    { id: 11, name: "Prove your profit", units: U11, theme: "b" },
    { id: 12, name: "The rest of the money, and the claim", units: U12, theme: "c" },
  ]);
  PF.setStep = (n) => { PF.UNITS = PF.STEPS[Math.max(1, Math.min(PF.STEPS.length, n)) - 1].units; };

  // targets live in Step 1 (last round) and Step 2 (last round)
  const u1 = PF.STEPS[0].units; u1[u1.length - 1].items = u1[u1.length - 1].items.concat(["tFund", "tSales", "tMargin", "reveal:contract"]);
  const u2 = PF.STEPS[1].units; u2[u2.length - 1].items = u2[u2.length - 1].items.concat(["rFund", "rSales", "rMargin", "reveal:contract2"]);

  PF.extraChecks.push((S, add, v, has) => {
    const mm = modelMargin(S), tm = v("rMargin") !== undefined ? v("rMargin") : v("tMargin");
    if (mm !== null && tm !== undefined && tm > mm + 10) add("t1", 2, "Your profit target is above what your own numbers give", "Your cost numbers give about " + mm + "% on each sale. You set " + tm + "%.", ["tMargin", "rMargin"]);
    if (v("f9K1") === false) add("t2", 1, "Money is not a promise", "Only money in your bank counts.", ["f9K1"]);
    if (v("f9Who") === "famfriends") add("t3", 2, "Family and friends only", "At most half of the money you count may come from people who know you.", ["f9Who"]);
    if (v("sK2") === true) add("t4", 1, "Friends' money is not the same as strangers'", "People who know you buy to be kind.", ["sK2"]);
    if (["best", "festival", "pick"].includes(v("sWin"))) add("t5", 2, "Cherry-picked 30 days", "The accountant checks the latest complete 30 days.", ["sWin"]);
    if (has("sConc") && v("sConc") > 40) add("t6", 2, "One customer is most of your sales", "Above 40% from one customer is not accepted.", ["sConc"]);
    if (has("sRel") && v("sRel") > 50) add("t7", 2, "Mostly friends and family", "More than half of your sales must come from strangers.", ["sRel"]);
    if (has("sPlan") && (v("sPlan") || []).includes("none")) add("t8", 1, "No plan to close the sales gap", "A gap with no plan is a wish.", ["sPlan"]);
    if (v("pK2") === true) add("t9", 1, "Markup is not margin", "A 50% markup is a 33% margin.", ["pK2"]);
    if (has("pForget") && (v("pForget") || []).includes("none")) add("t10", 2, "You counted none of the usual costs", "Tax, returns, fees, rent, staff pay and interest all come out of profit.", ["pForget"]);
    if (["wait"].includes(v("pLever"))) add("t11", 1, "Waiting moves nothing", "Margin moves by price, cost or mix.", ["pLever"]);
    if (v("fK2") === true) add("t12", 1, "More money is not safer", "Extra money costs extra shares.", ["fK2"]);
    if (v("fRest") === "unknown") add("t13", 1, "No idea where the rest comes from", "Half of your target must be in the bank.", ["fRest"]);
    if (v("fHonest") === false) add("t14", 2, "You are not sure your claim is true", "A person audits it. A false number ends the refund.", ["fHonest"]);
    if (has("fKeep") && (v("fKeep") || []).includes("none")) add("t15", 1, "No papers ready for the audit", "The audit asks for them first.", ["fKeep"]);
  });

  // ======================= missions =======================
  const T = (S, kind, w) => H.wl(S, kind, w);
  const wl = (S, m, kind, label) => (m.witnesses || []).filter((w) => w.kind === kind).map((w, i) => { const r = PF.readW(w.token), same = r && r.device === PF.deviceId() && !m.allowSame, st = !r ? "Waiting" : same ? "Same device: does not count" : "Answered"; return `<div class="wrow ${!r ? "wait" : st === "Answered" ? "ok" : "bad"}"><span>${label} ${i + 1}</span><b>${st}</b><div class="chips"><button class="chip" data-act="wcopy" data-link="${e(T(S, kind, w.token))}">Copy link</button><a class="chip" target="_blank" rel="noopener" href="${e(T(S, kind, w.token))}">Open (demo)</a></div></div>`; }).join("");
  const sec = (S, m, kind, label, title, help) => `<div class="card"><h2>${e(title)}</h2><p class="small">${e(help)}</p><div id="wl-${kind}">${wl(S, m, kind, label) || '<p class="small">No links yet.</p>'}</div><div class="chips"><button class="btn small" data-act="madk" data-kind="${kind}">Add a link</button></div></div>`;
  const proof = (m, key, text) => `<div class="card"><h2>Proof</h2><p class="small">${e(text)}</p><input type="file" id="pf-f-${key}" data-key="${key}" accept="image/*,application/pdf,.csv,.xlsx" multiple><ul class="flist">${(((m.fl || {})[key]) || []).map((x) => `<li>${e(x.name)} <em>${Math.round(x.size / 1024)} KB</em></li>`).join("")}</ul></div>`;
  const numIn = (m, key, label, ph) => `<div class="card"><label for="n-${key}"><b>${e(label)}</b></label><input id="n-${key}" data-nkey="${key}" type="number" inputmode="numeric" placeholder="${e(ph)}" value="${m[key] === undefined ? "" : e(String(m[key]))}"></div>`;
  const bindAll = () => {
    const S = PF.getState();
    document.querySelectorAll("input[type=file][data-key]").forEach((el) => { el.onchange = () => { const m = MS(S, S.step); m.fl = m.fl || {}; m.fl[el.dataset.key] = (m.fl[el.dataset.key] || []).concat(Array.from(el.files).map((x) => ({ name: x.name, size: x.size }))); PF.store.save(S); PF.ui.render(); }; });
    document.querySelectorAll("input[data-nkey]").forEach((el) => { el.onchange = () => { MS(S, S.step)[el.dataset.nkey] = el.value === "" ? undefined : Number(el.value); PF.store.save(S); PF.ui.render(); }; });
    const same = document.getElementById("msame"); if (same) same.onchange = () => { MS(S, S.step).allowSame = same.checked; PF.store.save(S); PF.ui.render(); };
  };
  const ck = (fails, pass) => (ok, o, f, fix) => (ok ? pass.push(o) : fails.push({ t: f, fix }));
  const tile = H.tile;
  const sim = (m, kind, obj, i) => { H.fakeW(m, Object.assign({ k: kind }, obj), i); m.witnesses[m.witnesses.length - 1].kind = kind; };
  const shell = (S, n, v, extra, nextTxt, okTitle) => v.ok
    ? `<section class="center"><p class="eyebrow">Mission ${n} · checked</p><h1>${okTitle}</h1><div class="card ok"><h2>What passed</h2><ul class="ded">${v.pass.map((p) => `<li><span>✓ ${e(p)}</span></li>`).join("")}</ul></div>${extra}${nextTxt ? `<button class="btn" data-act="nextstep">${nextTxt}</button> ` : ""}<button class="btn ghost" data-act="mreview">Edit my proof</button></section>`
    : `<section><p class="eyebrow">Mission ${n} · checked</p><h1>Not accepted yet</h1><div class="card no"><h2>${nextTxt ? "Gate to Step " + (n + 1) + ": LOCKED" : "Mission " + n + ": not passed"}</h2><ul class="fails">${v.fails.map((x) => `<li><b>${e(x.t)}</b><span>Next step: ${e(x.fix)}</span></li>`).join("")}</ul></div>${extra}<button class="btn" data-act="mreview">Fix and resubmit</button></section>`;
  const addKind = (act, d, S, h) => { if (act !== "madk") return false; const m = MS(S, S.step); (m.witnesses = m.witnesses || []).push({ token: H.tok(), at: Date.now(), kind: d.kind }); h.save(); h.render(); return true; };

  // ---- Mission 9: first money ----
  const M9 = {
    evaluate(S) {
      const m = MS(S, 9), fails = [], pass = [], c = ck(fails, pass), r = PF.refund(S), f = r.f;
      const meet = recsOf(S, [9], "meet").filter((x) => x.held === "yes"), rev = recsOf(S, [9], "review").filter((x) => x.rev !== "no"), docs = recsOf(S, [9], "docs");
      c(meet.length >= 3, meet.length + " meetings confirmed", "Only " + meet.length + " confirmed meetings. You need 3.", "Meet more people and send each the confirmation link.");
      c(meet.some((x) => ["investor", "programme"].includes(x.rel)), "A meeting with an investor or programme", "No meeting was confirmed by an investor or a funding programme.", "Book one.");
      c(rev.length >= 2 && rev.some((x) => ["lawyer", "ca"].includes(x.role)), rev.length + " reviewers read the terms, one a lawyer or accountant", "Two people must read the terms, one of them a lawyer or chartered accountant.", "Send the review link to a lawyer or CA.");
      c(!(rev.some((x) => x.rec === "no") && m.decision === "sign") && !!m.decision, "Your decision about the terms matches the advice", "You have not decided, or you chose to sign after a reviewer said not to.", "Choose what you will do with the terms.");
      const files = ((m.fl || {}).docs || []).length, claimed = (val(S, "eDocs") || []).filter((x) => x !== "none").length;
      c(files >= Math.max(3, claimed) && docs.length >= 2 && docs.some((x) => ["ca", "cs"].includes(x.role)) && docs.filter((x) => x.seen === "all" && x.order === "yes").length >= 2, files + " papers uploaded and confirmed in order", "Upload one file for each paper you ticked (at least 3). Two people must confirm they are in order, one an accountant or company secretary.", "Upload your papers and send the confirmation links.");
      c(r.c.fund > 0, "Your funding target is locked", "Your targets are not locked yet.", "Pass Mission 2 first.");
      c(f.hasStranger, "Part of the money came from a stranger", "Money from people who know you counts for at most half. None of it came from a stranger.", "Bring at least one investor, programme or lender you did not know.");
      c(f.needBank === 0 || f.bank >= f.needBank, "Bank proof attached for each payment", "A funder says money was sent, but you attached no bank proof for it.", "Attach the bank credit screenshot or statement.");
      c(f.received >= r.bar25, money(f.received) + " in your bank, a quarter of your target is " + money(r.bar25), "Confirmed money in your bank is " + money(f.received) + ". The bar is " + money(r.bar25) + " (a quarter of " + money(r.c.fund) + ").", "Get a funder to confirm money received, or use Plan B below.");
      return { ok: fails.length === 0, fails, pass, f };
    },
    brief: (S) => `<section><p class="eyebrow">Mission 9</p><h1>Get the first quarter of your money</h1><p class="lead">Investors meet you, read the terms, check your papers, then pay. You show all four, with proof from other people. At the end, a quarter of your funding target must be in your bank account. Do that and half of your deposit comes back.</p><div class="card"><h2>The four proofs</h2><ul class="ded"><li><span>3 meetings, one with an investor or a funding programme</span></li><li><span>2 people read the terms, one a lawyer or chartered accountant</span></li><li><span>Your papers uploaded, 2 people confirm them in order</span></li><li><span>Money in your bank: ${money(PF.refund(S).bar25)} or more, confirmed by the funder, with bank proof</span></li></ul></div><button class="btn" data-act="mstart">I accept the mission</button></section>`,
    submit(S) {
      const m = MS(S, 9), r = PF.refund(S), f = r.f;
      return `<section><p class="eyebrow">Mission 9 · first money</p><h1>Collect the proof</h1>${sec(S, m, "meet", "Meeting", "1. Meetings", "Each person confirms the meeting and their main doubt.")}${sec(S, m, "review", "Reviewer", "2. The terms", "A lawyer or accountant reads the terms. It records their view, it is not legal advice.")}
      <div class="card"><h2>Your decision about the terms</h2>${H.chipRow([["sign", "Sign as offered"], ["change", "Sign with changes"], ["walk", "Walk away"]], m.decision, "mset", "decision")}</div>
      ${proof(m, "docs", "One file per paper you ticked: registration, founders' agreement, share table, bank account.")}${sec(S, m, "docs", "Confirmer", "3. The papers", "An accountant or company secretary confirms they are in order.")}
      ${sec(S, m, "funder", "Funder", "4. The money", "The funder confirms how much, at which stage, and whether you knew them before.")}${proof(m, "bank", "The bank credit screenshot or statement for each payment.")}
      <div class="card"><h2>So far</h2><div class="tiles">${tile("in your bank, confirmed", money(f.received), f.received >= r.bar25 ? "green" : "red")}${tile("bar (a quarter)", money(r.bar25), "amber")}${tile("signed but not yet paid", money(Math.max(0, f.signed - f.received)), "")}</div>${f.capped ? '<p class="note">Money from people who know you is capped at half of what is counted.</p>' : ""}<div class="chips"><button class="chip" data-act="mdemo">Demo: simulate the whole step</button>${H.sameBox(m)}</div></div>
      <button class="btn" data-act="msubmit">Submit for checking</button></section>`;
    },
    verdict: (S) => { const v = MS(S, 9).verdict; return shell(S, 9, v, v.ok ? `<div class="card cele"><div class="cele-ico">💰</div><div><h3>${money(HALF)} of your deposit earned</h3><p class="small">A person audits it before it is paid.</p></div></div>` : PF.planB(S), "Begin Step 10", "First money is in"); },
    click(act, d, S, h) {
      if (addKind(act, d, S, h)) return true;
      if (act !== "mdemo") return false;
      const m = MS(S, 9), c = PF.contract(S); m.witnesses = [];
      [["investor", "traction"], ["programme", "market"], ["mentor", "copy"]].forEach((x, i) => sim(m, "meet", { rel: x[0], held: "yes", obj: x[1], next: "follow" }, i));
      [["lawyer", "change"], ["ca", "sign"]].forEach((x, i) => sim(m, "review", { role: x[0], rev: "yes", conc: "1", rec: x[1] }, "r" + i));
      [["ca"], ["cs"]].forEach((x, i) => sim(m, "docs", { role: x[0], seen: "all", order: "yes" }, "d" + i));
      sim(m, "funder", { rel: "investor", stage: "received", amt: Math.round(c.fund * 0.3), know: "stranger" }, "f0");
      m.decision = "change"; m.fl = { docs: ["a", "b", "c", "d"].map((n) => ({ name: n + ".pdf", size: 1000 })), bank: [{ name: "credit.png", size: 1000 }] };
      h.save(); h.render(); return true;
    },
    award(S, v, G) { G.award(S, "m9:attempt", 10, "Reported your first-money proof"); if (v.f.signed) G.award(S, "m9:signed", 150, "A signed agreement"); if (v.f.received) G.award(S, "m9:recv", 300, "Money in the bank"); if (v.ok) { G.award(S, "m9:pass", 400, "A quarter of the money in your bank"); G.celebrate(S, "First money is in", "Half your deposit is earned", 400); } },
    after: bindAll,
  };

  // ---- Mission 10: sales ----
  const M10 = {
    evaluate(S) {
      const m = MS(S, 10), s = PF.salesStats(S), c0 = PF.contract(S), bar = c0.sales * 0.5, fails = [], pass = [], c = ck(fails, pass);
      c(s.claimed > 0, "You stated your 30-day sales", "You have not stated your sales for the latest 30 days.", "Type the number.");
      c(s.ca >= 1, "An accountant checked the figure", "No accountant or CA has confirmed your sales figure.", "Send the accountant link.");
      c(!s.mismatch, "Your figure matches the accountant's", "Your figure and the accountant's differ by more than 10%. The lower one is used.", "Agree the figure with your accountant.");
      c(s.verified >= bar, money(s.verified) + " in 30 days, the bar is " + money(bar), "Your checked sales are " + money(s.verified) + ". The bar is " + money(bar) + " (half of " + money(c0.sales) + ").", "Sell more, or be honest and wait.");
      c(s.buys >= 10 && s.strangerPct >= 70, s.buys + " customers confirmed, " + s.strangerPct + "% strangers", "At least 10 customers must confirm they bought, and at least 70% must be strangers. You have " + s.buys + ", " + s.strangerPct + "% strangers.", "Send the buyer link to customers.");
      c(!s.conc, "No one customer above 40%", "The accountant says one customer is more than 40% of your sales.", "Sell to more customers.");
      c(!s.rel, "Most sales came from strangers", "The accountant says more than half of your sales came from people you know.", "Sell to more strangers.");
      c(s.files >= 2, s.files + " ledger or statement files", "Upload at least 2 files: the sales ledger or invoices, and the bank statement.", "Upload them.");
      return { ok: fails.length === 0, fails, pass, s };
    },
    brief: (S) => `<section><p class="eyebrow">Mission 10</p><h1>Prove 30 days of real sales</h1><p class="lead">Show the latest complete 30 days of sales. An accountant confirms the figure, at least 10 customers confirm they bought (most of them strangers), and you upload the ledger and bank statement. The bar is half of your sales target: ${money(PF.contract(S).sales * 0.5)}.</p><button class="btn" data-act="mstart">I accept the mission</button></section>`,
    submit(S) {
      const m = MS(S, 10), s = PF.salesStats(S), c0 = PF.contract(S);
      return `<section><p class="eyebrow">Mission 10 · sales</p><h1>Collect the proof</h1>${numIn(m, "sales", "Your sales in the latest complete 30 days (rupees)", "e.g. 300000")}${sec(S, m, "sales", "Accountant", "The accountant", "A CA or accountant confirms the figure, the largest customer's share, and the share from people you know.")}${sec(S, m, "buy", "Customer", "Customers", "Each customer confirms they bought in the last 7 days. At least 10, most of them strangers.")}${proof(m, "sales", "The sales ledger or invoices, and the bank statement for the same 30 days.")}
      <div class="card"><h2>So far</h2><div class="tiles">${tile("checked sales", money(s.verified), s.verified >= c0.sales * 0.5 ? "green" : "red")}${tile("bar (half)", money(c0.sales * 0.5), "amber")}${tile("customers confirmed", s.buys + " (" + s.strangerPct + "% strangers)", s.buys >= 10 ? "green" : "")}</div><div class="chips"><button class="chip" data-act="mdemo">Demo: simulate the proof</button>${H.sameBox(m)}</div></div><button class="btn" data-act="msubmit">Submit for checking</button></section>`;
    },
    verdict: (S) => shell(S, 10, MS(S, 10).verdict, "", "Begin Step 11", "Sales proven"),
    click(act, d, S, h) {
      if (addKind(act, d, S, h)) return true;
      if (act !== "mdemo") return false;
      const m = MS(S, 10), c = PF.contract(S); m.witnesses = []; m.sales = Math.round(c.sales * 0.6);
      sim(m, "sales", { role: "ca", amt: Math.round(c.sales * 0.58), conc: "lt20", relshare: "lt30" }, "ca");
      for (let i = 0; i < 12; i++) sim(m, "buy", { answer: "yes", pay: "upi", rel: i < 2 ? "friend" : "stranger" }, "b" + i);
      m.fl = { sales: [{ name: "ledger.xlsx", size: 1000 }, { name: "bank.pdf", size: 1000 }] }; h.save(); h.render(); return true;
    },
    award(S, v, G) { G.award(S, "m10:attempt", 10, "Reported your sales"); if (v.s.ca) G.award(S, "m10:ca", 60, "An accountant checked your sales"); if (v.s.buys >= 10) G.award(S, "m10:buy", 80, "10 customers confirmed"); if (v.ok) { G.award(S, "m10:pass", 400, "Sales proven"); G.celebrate(S, "Sales proven", "Real customers paid you", 400); } },
    after: bindAll,
  };

  // ---- Mission 11: profit ----
  const M11 = {
    evaluate(S) {
      const m = MS(S, 11), p = PF.profitStats(S), c0 = PF.contract(S), bar = Math.round(c0.margin * 5) / 10, fails = [], pass = [], c = ck(fails, pass);
      c(p.ca >= 1, "An accountant prepared your profit figure", "No accountant or CA has confirmed your profit and loss.", "Send the accountant link.");
      c(p.allCosts, "All costs were counted", "The accountant says not all costs are in the profit figure.", "Include goods, staff, rent, fees, returns, tax and interest.");
      c(p.salesMatch, "Same sales as Mission 10", "The accountant's sales figure differs from the one proven in Mission 10, or Mission 10 has no checked figure.", "Use the same 30 days.");
      c(p.margin !== null && p.margin >= bar && p.margin > 0, p.margin !== null ? Math.round(p.margin * 10) / 10 + "% margin, the bar is " + bar + "%" : "Margin shown", "Your checked margin is " + (p.margin === null ? "not available" : Math.round(p.margin * 10) / 10 + "%") + ". The bar is " + bar + "% (half of " + c0.margin + "%).", "Raise price, cut cost or change the mix, then show a new 30 days.");
      c(p.files >= 2, p.files + " files", "Upload your profit and loss, and the bank statement.", "Upload them.");
      return { ok: fails.length === 0, fails, pass, p };
    },
    brief: (S) => `<section><p class="eyebrow">Mission 11</p><h1>Prove your profit</h1><p class="lead">For the same 30 days, an accountant states your sales and your net profit after every cost. The bar is a margin of at least ${Math.round(PF.contract(S).margin * 5) / 10}% (half of the ${PF.contract(S).margin}% you set).</p><button class="btn" data-act="mstart">I accept the mission</button></section>`,
    submit(S) {
      const m = MS(S, 11), p = PF.profitStats(S), c0 = PF.contract(S), bar = Math.round(c0.margin * 5) / 10;
      return `<section><p class="eyebrow">Mission 11 · profit</p><h1>Collect the proof</h1>${sec(S, m, "pnl", "Accountant", "The accountant", "A CA or accountant states the sales, the net profit, and whether every cost is counted.")}${proof(m, "pnl", "The profit and loss statement, and the bank statement.")}
      <div class="card"><h2>So far</h2><div class="tiles">${tile("checked margin", p.margin === null ? "none yet" : Math.round(p.margin * 10) / 10 + "%", p.margin !== null && p.margin >= bar ? "green" : "red")}${tile("bar (half)", bar + "%", "amber")}</div><div class="chips"><button class="chip" data-act="mdemo">Demo: simulate the proof</button>${H.sameBox(m)}</div></div><button class="btn" data-act="msubmit">Submit for checking</button></section>`;
    },
    verdict: (S) => shell(S, 11, MS(S, 11).verdict, "", "Begin Step 12", "Profit proven"),
    click(act, d, S, h) {
      if (addKind(act, d, S, h)) return true;
      if (act !== "mdemo") return false;
      const m = MS(S, 11), c = PF.contract(S), s = PF.salesStats(S), sales = s.verified || Math.round(c.sales * 0.58); m.witnesses = [];
      sim(m, "pnl", { role: "ca", sales: sales, profit: Math.round(sales * (c.margin * 0.7) / 100), all: "yes" }, "ca");
      m.fl = { pnl: [{ name: "pnl.pdf", size: 1000 }, { name: "bank.pdf", size: 1000 }] }; h.save(); h.render(); return true;
    },
    award(S, v, G) { G.award(S, "m11:attempt", 10, "Reported your profit"); if (v.p.ca) G.award(S, "m11:ca", 60, "An accountant stated your profit"); if (v.ok) { G.award(S, "m11:pass", 400, "Profit proven"); G.celebrate(S, "Profit proven", "Real profit, confirmed", 400); } },
    after: bindAll,
  };

  // ---- Mission 12: the rest of the money, and the claim ----
  const M12 = {
    evaluate(S) {
      const m = MS(S, 12), r = PF.refund(S), f = r.f, fails = [], pass = [], c = ck(fails, pass);
      c(okM(S, 9), "Step 9 passed", "Step 9 is not passed.", "Go back to Step 9.");
      c(okM(S, 10), "Sales proven in Mission 10", "Sales are not proven.", "Pass Mission 10.");
      c(okM(S, 11), "Profit proven in Mission 11", "Profit is not proven.", "Pass Mission 11.");
      c(f.needBank === 0 || f.bank >= f.needBank, "Bank proof attached for each payment", "Money is reported as received but bank proof is missing.", "Attach the bank credit or statement.");
      c(f.received >= r.bar50, money(f.received) + " in your bank, the bar is " + money(r.bar50), "Confirmed money in your bank is " + money(f.received) + ". The bar is " + money(r.bar50) + " (half of " + money(r.c.fund) + ").", "Raise more, or use Plan B below.");
      c(f.hasStranger, "Part of the money came from strangers", "None of the money came from a stranger.", "Bring a funder who did not know you.");
      c(m.honest === "yes", "You confirmed the claim is true and complete", "You have not confirmed your claim.", "Tap the confirmation.");
      return { ok: fails.length === 0, fails, pass, f };
    },
    brief: (S) => `<section><p class="eyebrow">Mission 12 · the last one</p><h1>Raise the rest, then claim</h1><p class="lead">Half of your funding target (${money(PF.refund(S).bar50)}) must be in your bank in total, with funders confirming it. With sales and profit already proven, that completes all three tests and your whole deposit is earned. A person audits every claim before the refund is paid.</p><button class="btn" data-act="mstart">I accept the mission</button></section>`,
    submit(S) {
      const m = MS(S, 12), r = PF.refund(S), f = r.f;
      return `<section><p class="eyebrow">Mission 12 · the rest of the money</p><h1>Confirm the money and claim</h1>${sec(S, m, "funder", "Funder", "New money since Step 9", "Each funder confirms how much, at which stage, and whether you knew them before.")}${proof(m, "bank", "The bank credit screenshot or statement for each new payment.")}
      <div class="card"><h2>So far</h2><div class="tiles">${tile("in your bank, in total", money(f.received), f.received >= r.bar50 ? "green" : "red")}${tile("bar (half)", money(r.bar50), "amber")}</div></div>
      <div class="card"><h2>Your claim</h2><p class="small">Everything I submit is true and complete. I understand a person audits it, and that a false claim ends the refund.</p>${H.chipRow([["yes", "Yes, it is true and complete"]], m.honest, "mset", "honest")}<div class="chips"><button class="chip" data-act="mdemo">Demo: simulate the money</button>${H.sameBox(m)}</div></div>
      <button class="btn" data-act="msubmit">Submit my claim</button></section>`;
    },
    verdict: (S) => { const v = MS(S, 12).verdict; return shell(S, 12, v, (v.ok ? `<div class="card cele"><div class="cele-ico">🏁</div><div><h3>Your whole deposit of ${money(FEE)} is earned</h3><p class="small">A person audits your papers, then pays the refund. Claim code: ${e(PF.claimCode(S))}</p></div></div><div class="card"><h2>Send us your audit pack</h2><p class="small">Everything stays locked unless you claim. This button locks your claim bundle so that only our audit team can open it. Send us the file together with your bank statements and papers.</p><button class="btn" data-act="mpack">Download my audit pack</button></div>` : PF.planB(S)) + PF.outcomesCard(S), null, "You did it"); },
    click(act, d, S, h) {
      if (addKind(act, d, S, h)) return true;
      if (act === "mpack") { PF.downloadAuditPack(S); return true; }
      if (act !== "mdemo") return false;
      const m = MS(S, 12), c = PF.contract(S); m.witnesses = [];
      sim(m, "funder", { rel: "investor", stage: "received", amt: Math.round(c.fund * 0.3), know: "stranger" }, "f1");
      m.fl = { bank: [{ name: "credit2.png", size: 1000 }] }; m.honest = "yes"; h.save(); h.render(); return true;
    },
    award(S, v, G) { G.award(S, "m12:attempt", 10, "Submitted your claim"); if (v.ok) { G.award(S, "m12:pass", 800, "All three tests passed"); G.celebrate(S, "Whole deposit earned", "Sales, profit and money, all proven", 800); } },
    after: bindAll,
  };
  PF.auditBundle = (S) => { const wit = {}; Object.values(S.ms || {}).forEach((m) => (m.witnesses || []).forEach((w) => { wit[w.token] = PF.readW(w.token); })); return { v: 1, at: Date.now(), claim: PF.claimCode(S), profile: S.profile, contract: PF.contract(S), refund: PF.refund(S), answers: S.ans, missions: S.ms, witnessRecords: wit }; };
  PF.downloadAuditPack = async (S) => {
    if (!PF.CONFIG.auditKey) return alert("The audit team's key is not set on this site yet, so a pack cannot be made.");
    const text = await PF.vault.auditPack(PF.auditBundle(S), PF.CONFIG.auditKey), a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "application/json" })); a.download = "proof-forge-audit-" + PF.claimCode(S) + ".pfaudit"; a.click();
  };
  PF.claimCode = (S) => { const id = PF.vault && PF.vault.id && PF.vault.id(); S.claimYear = S.claimYear || new Date().getFullYear(); const n = id ? parseInt(id.slice(0, 7), 16) % 100000 : ((S.seed || 1) * 7919) % 100000; return "PF-" + String(n).padStart(5, "0") + "-" + S.claimYear; };
  PF.missions[9] = M9; PF.missions[10] = M10; PF.missions[11] = M11; PF.missions[12] = M12;

  // the investor-ready gate also checks that the ask and the locked funding target agree
  const gate0 = PF.gate;
  PF.gate = (S) => { const g = gate0(S), c = PF.contract(S), ask = PF.s4.askAmount(S);
    if (c.fund && ask) g.checks.push({ id: "target", label: "Your ask and your funding target agree", ok: ask >= c.fund * 0.5 && ask <= c.fund * 2, note: "Your ask is " + money(ask) + " and your funding target is " + money(c.fund) + ". They must be within half and double of each other.", fix: 4 });
    g.ready = g.checks.every((x) => x.ok); return g; };

  // levels: one more at the top, since Step 9 no longer ends the journey
  G.LEVELS.push({ n: 9, name: "Earner", xp: 13500, icon: "🏁" });

  // demo founder
  const demo0 = PF.demoFill;
  PF.demoFill = (S, step) => { demo0(S, step); const A = (x) => ({ v: x, t: 1 }); Object.assign(S.ans, { tFund: A(2500000), tSales: A(500000), tMargin: A(20) });
    if (step >= 3) S.contract = { locked: true, at: Date.now(), fund: 2500000, sales: 500000, margin: 20 }; };
})();
