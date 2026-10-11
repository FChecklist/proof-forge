/* Proof Forge, Step 1 engine: seeded randomness, storage, money-flow maths, consistency checks, scoring. No AI, no network. */
(function () {
  const PF = (window.PF = window.PF || {});

  // ---------- randomness (same founder gets the same shuffle, another founder a different one) ----------
  PF.hash = (s) => { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  PF.rng = (seed) => { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  PF.shuffle = (arr, r) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // ---------- formatting ----------
  const trim = (x) => (x.indexOf(".") >= 0 ? x.replace(/\.?0+$/, "") : x);
  PF.inr = (n) => {
    if (n === null || n === undefined || !isFinite(n)) return "n/a";
    const a = Math.abs(n), s = n < 0 ? "-" : "";
    if (a >= 1e7) return s + "₹" + trim((a / 1e7).toFixed(2)) + " crore";
    if (a >= 1e5) return s + "₹" + trim((a / 1e5).toFixed(2)) + " lakh";
    return s + "₹" + Math.round(a).toLocaleString("en-IN");
  };
  PF.num = (n, d = 1) => (n === null || n === undefined || !isFinite(n) ? "n/a" : trim(Number(n).toFixed(d)));
  PF.esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  // ---------- storage ----------
  PF.store = {
    key: "pf-step1-v1",
    load() { try { return JSON.parse(localStorage.getItem(this.key)); } catch (e) { return null; } },
    save(s) { try { localStorage.setItem(this.key, JSON.stringify(s)); } catch (e) { /* private mode */ } },
    reset() { try { localStorage.removeItem(this.key); } catch (e) { /* ignore */ } },
  };
  PF.deviceId = () => { try { let d = localStorage.getItem("pf-device"); if (!d) { d = "d" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36); localStorage.setItem("pf-device", d); } return d; } catch (e) { return "d-none"; } };

  // ---------- the money-flow maths ----------
  const FREQ = { once: 1, year: 1, few: 3, month: 12, week: 50, day: 250 }; // purchases per year for each answer
  PF.FREQ = FREQ;
  const FREQ_ORDER = ["once", "year", "few", "month", "week", "day"];
  PF.FREQ_ORDER = FREQ_ORDER;
  const val = (S, id) => (S.ans && S.ans[id] ? S.ans[id].v : undefined);
  PF.val = val;

  function calc(S, st) {
    st = st || {};
    const shape = PF.SHAPES[S.shape] || PF.SHAPES.seller;
    const price = val(S, "price"); if (!price) return null;
    const cutPct = val(S, "cut");
    const cost0 = shape.cut ? price * (1 - (cutPct || 10) / 100) : val(S, "cost");
    if (cost0 === undefined || cost0 === null) return null;
    const stock = val(S, "stockDays") || 0, deliv = val(S, "delivDays") || 0;
    const recv0 = val(S, "recvDays") || 0, pay0 = val(S, "supTerms") || 0;
    const recv = recv0 + (st.late ? 15 : 0);
    const pay = st.advance ? -7 : pay0;
    const raw = stock + deliv + recv - pay;
    const cycleDays = Math.max(1, raw), negative = raw <= 0;
    const cost = cost0 * (st.cost ? 1.1 : 1);
    const sell0 = (val(S, "sellThrough") || 100) / 100, sell = sell0 * (st.sales ? 0.7 : 1);
    const ret = ((val(S, "returns") || 0) / 100) * (st.returns ? 2 : 1), bd = (val(S, "badDebt") || 0) / 100;
    const leaks = (val(S, "leakPct") || 0) / 100;
    const fixed = val(S, "fixed") || 0, V = val(S, "volume") || 0;
    const revPerSold = price * (1 - ret) * (1 - bd);
    const costPerSold = cost / sell;
    const contribution = revPerSold * (1 - leaks) - costPerSold;
    const monthlyUnits = V * (st.sales ? 0.7 : 1);
    const monthlyProfit = monthlyUnits * contribution - fixed;
    const breakEven = contribution > 0 ? Math.ceil(fixed / contribution) : Infinity;
    const unitsBought = 100000 / cost, sold = unitsBought * sell;
    const rev = sold * revPerSold;
    const profitCycle = rev * (1 - leaks) - 100000;
    const cyclesYr = 365 / cycleDays;
    const purchasesMonth = sell0 > 0 ? (V / sell0) * cost : 0;
    const wc = (purchasesMonth / 30) * cycleDays;
    return { price, cost, cutPct, cycleDays, negative, cyclesYr, revPerSold, costPerSold, contribution, monthlyUnits, monthlyProfit, breakEven, profitCycle, rev, turnover1L: sold * revPerSold * cyclesYr, wc, fixed, V, stock, deliv, recv, pay, sell, ret, bd, leaks, unitsBought };
  }
  PF.calc = calc;

  PF.stressFrom = (S) => {
    const list = val(S, "stress") || [];
    return { sales: list.includes("sales"), late: list.includes("late"), cost: list.includes("cost"), advance: list.includes("advance"), returns: list.includes("returns") };
  };
  PF.flow = (S) => {
    const base = calc(S); if (!base) return null;
    const stress = calc(S, PF.stressFrom(S));
    const peakCash = stress.wc + (stress.monthlyProfit < 0 ? -stress.monthlyProfit * 6 : 0);
    // repeat engine
    const f = FREQ[val(S, "custFreq")] || 1, m2 = (val(S, "m2") || 0) / 100, m3 = (val(S, "m3") || 0) / 100, m6 = (val(S, "m6") || 0) / 100;
    const retAvg = (1 + m2 + m3 + m6) / 4;
    const ltv = Math.max(0, base.contribution) * f * (f <= 1 ? 1 : retAvg);
    const cac = val(S, "cac");
    const ltvCac = cac === undefined ? null : cac === 0 ? Infinity : ltv / cac;
    let agg = null;
    if ((PF.SHAPES[S.shape] || {}).cut && base.cutPct) { const gmv = 1000000 / (base.cutPct / 100); const orders = gmv / base.price; agg = { gmv, orders, perDay: orders / 30 }; }
    return { base, stress, peakCash, ltv, ltvCac, m2, m3, m6, agg, f };
  };

  // ---------- consistency checks: the answers must agree with each other ----------
  PF.checks = (S) => {
    const out = [], v = (id) => val(S, id), has = (id) => v(id) !== undefined && v(id) !== null;
    const add = (id, sev, title, msg, q) => out.push({ id, sev, title, msg, q: q || [] });
    const alts = v("alts"), looked = (v("looked") || []).filter((x) => x !== "nowhere").length;
    if (v("nooneelse") === true && alts >= 3) add("c1", 2, "Nobody else, or " + alts + " alternatives?", "Your gut said nobody else does this, yet you found " + alts + " alternatives. Both cannot be true.", ["nooneelse", "alts"]);
    if (v("nooneelse") === true && looked === 0 && has("looked")) add("c1b", 1, "Nobody else, but you have not looked", "You said nobody else does this, but you have not searched anywhere yet. That is a belief, not a finding.", ["nooneelse", "looked"]);
    if (looked >= 5 && alts === 0) add("c2", 1, "Searched widely, found nothing", "Zero alternatives after searching " + looked + " places is very rare. Either the search was shallow or nobody pays for this.", ["looked", "alts"]);
    if (has("nooneelse") && has("nooneelse2") && S.ans.nooneelse.v !== null && (S.ans.nooneelse.v === true) !== (v("nooneelse2") === "none")) add("g1", 1, "Gut and reason disagree", "Your first, fast answer on 'nobody else does this' changed after you thought about it. Which one do you trust?", ["nooneelse", "nooneelse2"]);
    if (v("copy") === true && ["cheaper", "tech"].includes(v("edge"))) add("c7", 2, "Your edge can be copied", "Your reason to win is '" + (v("edge") === "cheaper" ? "cheaper" : "new technology") + "', and you agree a small team could copy it within 30 days.", ["edge", "copy"]);
    if (v("edge") === "nothing") add("c7b", 2, "No edge yet", "You said there is nothing yet that makes customers pick you. That is honest, and it is the first thing to fix.", ["edge"]);
    const chain = v("chain") || {}, nobody = Object.values(chain).filter((r) => r && r.who === "nobody").length, unknownT = Object.values(chain).filter((r) => r && r.know === "no").length;
    if (v("knowDeliver") === true && (chain.deliver && chain.deliver.who === "nobody" || chain.make && chain.make.who === "nobody")) add("c8", 2, "You know who delivers, but nobody does", "You said you know exactly who delivers, but the chain shows nobody yet for delivery or making.", ["knowDeliver", "chain"]);
    if (v("firstCust") === "findme") add("f1", 1, "'They will find me'", "Hoping customers find you is not a plan. Nobody gets found without a push.", ["firstCust"]);
    if (["watched", "read", "none"].includes(v("fieldOps"))) add("f2", v("fieldOps") === "watched" ? 1 : 2, "Not yet seen in the field", "Nobody in your plan has done this work in the real world for a month. Field reality will surprise you.", ["fieldOps"]);
    const b = calc(S);
    if (has("payFirst") && b) { const customerFirst = b.recv < b.pay; const sayCust = v("payFirst") === "customer"; if (b.recv !== b.pay && sayCust !== customerFirst) add("c3", 2, "Who pays first?", "You said " + (sayCust ? "your customer pays first" : "you pay first") + ", but your own payment terms say the opposite.", ["payFirst", "supTerms", "recvDays"]); }
    if (v("prepaid") === true && (v("recvDays") || 0) >= 15) add("c4", 2, "Prepaid, or 15+ days late?", "You said most customers pay before delivery, yet you also said they pay after " + v("recvDays") + " days.", ["prepaid", "recvDays"]);
    if ((v("leaks") || []).filter((x) => x !== "none").length >= 4 && (v("leakPct") || 0) <= 5) add("c9", 1, "Many leaks, tiny cost?", "You ticked " + (v("leaks") || []).length + " kinds of costs but said they take 5% or less. Please recheck.", ["leaks", "leakPct"]);
    const sf = FREQ_ORDER.indexOf(v("selfFreq")), cf = FREQ_ORDER.indexOf(v("custFreq"));
    if (sf >= 0 && cf >= 0 && cf - sf >= 2) add("c6", 2, "You would buy rarely, they will buy often", "You would buy this " + PF.freqLabel(v("selfFreq")) + ", but expect customers to buy " + PF.freqLabel(v("custFreq")) + ". You are more demanding than your customers?", ["selfFreq", "custFreq"]);
    const cb = v("comeback") || [];
    if (v("discountDep") === true && cb.includes("discount") && cb.length === 1) add("c5", 2, "Discount-only loyalty", "You said customers will stay without discounts, but discounts are the only reason you ticked for them coming back.", ["discountDep", "comeback"]);
    if (has("discountDep") && S.ans.discountDep.v !== null && has("discountDep2") && (S.ans.discountDep.v === true) !== (v("discountDep2") === "same")) add("g2", 1, "Gut and reason disagree", "Fast answer: 'customers still buy without discounts'. After thinking: the opposite. The second answer is usually closer to the truth.", ["discountDep", "discountDep2"]);
    if (has("m2") && has("m6") && v("m6") > v("m2")) add("c10", 1, "More customers return later than earlier?", "You said more come back in month 6 than in month 2. Customers rarely return in growing numbers.", ["m2", "m6"]);
    if (b && has("leakPct") && has("sellThrough") && has("returns") && has("badDebt") && b.contribution <= 0) add("l1", 3, "You lose money on every sale", "At your own numbers each " + (PF.SHAPES[S.shape] || {}).noun + " earns " + PF.inr(b.contribution) + " after costs. Growth would only make the loss bigger.", ["price", "cost", "leakPct"]);
    if (b && has("volume") && has("fixed") && b.contribution > 0 && b.V && b.breakEven > b.V) add("l2", 2, "Your own plan does not break even", "You need " + b.breakEven.toLocaleString("en-IN") + " " + (PF.SHAPES[S.shape] || {}).noun + "s a month to break even, but you plan " + b.V.toLocaleString("en-IN") + ".", ["volume", "fixed"]);
    const fl = PF.flow(S);
    if (fl && has("cac") && has("m6") && has("custFreq") && has("leakPct") && fl.ltvCac !== null && fl.ltvCac !== Infinity && fl.ltvCac < 1) add("l3", 3, "Winning a customer costs more than they are worth", "A customer is worth about " + PF.inr(fl.ltv) + " in a year and costs " + PF.inr(v("cac")) + " to win.", ["cac"]);
    if (v("cac") === 0) add("l4", 1, "Customers for free?", "Your time and free offers are costs too. 'Zero' usually means 'not measured'.", ["cac"]);
    if (nobody > 0) add("o1", Math.min(2, nobody > 2 ? 2 : 1), nobody + " link" + (nobody > 1 ? "s" : "") + " in your chain have no owner", "Nobody is responsible yet for " + nobody + " step(s) between a sale and the money.", ["chain"]);
    return out;
  };
  PF.freqLabel = (k) => ({ once: "once ever", year: "once a year", few: "every few months", month: "monthly", week: "weekly", day: "daily" }[k] || k);

  // ---------- castle meter: how much of the plan stands on tested ground ----------
  PF.ASSUMPTIONS = [
    { id: "price", label: "Price", imp: 3 }, { id: "cost", label: "Cost to make or buy", imp: 3 }, { id: "supTerms", label: "Supplier payment terms", imp: 2 },
    { id: "recvDays", label: "When customers pay", imp: 2 }, { id: "volume", label: "Sales per month", imp: 3 }, { id: "sellThrough", label: "How much actually sells", imp: 2 },
    { id: "custFreq", label: "How often they buy again", imp: 3 }, { id: "cac", label: "Cost to win a customer", imp: 3 },
  ];
  PF.castle = (S) => {
    const list = PF.ASSUMPTIONS.map((a) => {
      const shape = PF.SHAPES[S.shape] || {};
      const label = a.id === "cost" && shape.cut ? "Your cut per order" : a.label;
      return { ...a, label, tag: (S.tags || {})[a.id] || null };
    });
    const total = list.reduce((s, a) => s + a.imp, 0);
    const guess = list.reduce((s, a) => s + (a.tag === "tested" || a.tag === "asked" ? 0 : a.imp), 0);
    const tested = list.reduce((s, a) => s + (a.tag === "tested" ? a.imp : a.tag === "asked" ? a.imp * 0.5 : 0), 0);
    return { list, total, pctGuess: Math.round((guess / total) * 100), pctTested: Math.round((tested / total) * 100) };
  };

  // ---------- reality score: transparent, every deduction is shown to the founder ----------
  PF.reality = (S) => {
    const items = [], checks = PF.checks(S), c = PF.castle(S);
    let score = 100;
    const pen = (label, pts) => { if (pts > 0) { items.push({ label, pts: Math.round(pts) }); score -= pts; } };
    pen("Answers that contradict each other", Math.min(30, checks.filter((x) => x.sev >= 2 || x.id.startsWith("g")).length * 6));
    pen("Smaller inconsistencies", Math.min(10, checks.filter((x) => x.sev === 1 && !x.id.startsWith("g")).length * 2));
    pen("Plan stands on guesses (castle in the air)", c.pctGuess * 0.25);
    pen("Money does not work (loss, break-even, customer cost)", Math.min(25, checks.filter((x) => x.id.startsWith("l") && x.id !== "l4").length * 10));
    const nob = checks.find((x) => x.id === "o1"); if (nob) pen("Chain links with no owner", nob.sev * 4);
    return { score: Math.max(5, Math.round(score)), items, checks, castle: c };
  };

  PF.badges = (S) => {
    const ch = PF.checks(S), c = PF.castle(S), out = [];
    const looked = (PF.val(S, "looked") || []).filter((x) => x !== "nowhere").length;
    out.push({ id: "mirror", name: "Mirror Clear", desc: "No contradictions found", got: ch.filter((x) => x.sev >= 2).length === 0 });
    out.push({ id: "looked", name: "Looked Outside", desc: "Searched 5 or more places before claiming a gap", got: looked >= 5 });
    out.push({ id: "clock", name: "Knows the Clock", desc: "A positive, believable money cycle", got: !!(PF.flow(S) && !PF.flow(S).base.negative) });
    out.push({ id: "chain", name: "Chain Complete", desc: "Every link has an owner", got: !ch.find((x) => x.id === "o1") });
    out.push({ id: "proof", name: "Proof-minded", desc: "At least half the plan is asked or tested", got: c.pctTested >= 50 });
    const rows = (PF.val(S, "chain") || {}); out.push({ id: "honest", name: "Honest Gap", desc: "Admitted at least one thing is still a guess", got: Object.keys(S.tags || {}).some((k) => S.tags[k] === "guess") });
    return out;
  };
})();
