/* Steps 2, 3 and 4: Customer truth, The real work and the real cost, The ask. Same engine as Step 1: tap questions, mirrors, real stories, then a mission with proof.
   Validation rule: every claim climbs a ladder (Guess, Asked, Seen by a third party, Paid). The missions are where claims are checked by other people. */
(function () {
  const PF = (window.PF = window.PF || {});
  const money = PF.inr;
  const val = (S, id) => (S.ans && S.ans[id] ? S.ans[id].v : undefined);
  const MS = (S, n) => { S.ms = S.ms || {}; return (S.ms[n] = S.ms[n] || {}); };
  PF.MS = MS;
  PF.readW = (t) => { if (PF._wc && PF._wc[t]) return PF._wc[t]; try { return JSON.parse(localStorage.getItem("pf-w-" + t)); } catch (e) { return null; } };
  const pctOf = (a, b) => (b ? Math.round((a / b) * 100) : 0);

  // ======================= ITEMS =======================
  const MONEY_B = [0, 10000, 25000, 50000, 100000, 250000, 500000, 1000000, 2500000, 5000000, 10000000];
  const bucket = (id, label, why) => ({ fmt: "band", vals: MONEY_B, def: 3, money: true, text: () => `How much of your money goes to ${label}?`, hint: "Choose 0 if you will not spend on it.", why });
  Object.assign(PF.ITEMS, {
    // ---- Step 2, round 1: who is in the sale ----
    sRoles: { fmt: "multi", excl: "only", text: () => "Who takes part in the decision to buy? Tick everyone.", opts: [{ v: "user", label: "The person who uses it" }, { v: "decider", label: "The person who decides" }, { v: "payer", label: "The person who pays" }, { v: "influencer", label: "Friends, reviews or social media" }, { v: "gate", label: "A gatekeeper: admin, IT or a purchase team" }, { v: "blocker", label: "Someone who may say no: a parent, boss or partner" }, { v: "only", label: "Just the user, nobody else" }], why: "The person who uses a product, the person who decides and the person who pays are often three different people." },
    sFirstSay: { fmt: "single", text: () => "Whose 'yes' do you need first?", opts: [{ v: "user", label: "The user" }, { v: "decider", label: "The person who decides" }, { v: "payer", label: "The person who pays" }, { v: "gate", label: "The gatekeeper" }, { v: "unknown", label: "I do not know" }], why: "A sale usually stops at the first person who can say no." },
    sPayerReach: { fmt: "single", ord: true, text: () => "Can you reach the person who pays within a week?", opts: [{ v: "easy", label: "Yes, easily" }, { v: "effort", label: "Yes, with effort" }, { v: "no", label: "No" }, { v: "who", label: "I am not sure who would pay" }], why: "You cannot validate demand by talking to the wrong person." },
    sListSource: { fmt: "multi", text: () => "Where will your first 20 conversations come from? Tick every source.", opts: [{ v: "friends", label: "Friends and family" }, { v: "class", label: "Classmates" }, { v: "strangers", label: "Strangers on campus or in the street" }, { v: "shops", label: "Shops or markets" }, { v: "groups", label: "WhatsApp or online groups" }, { v: "cold", label: "Cold messages to strangers" }, { v: "partners", label: "Referrals and partners" }], why: "Friends are kind. Strangers are honest." },
    sFriendShare: { fmt: "single", ord: true, text: () => "How many of your first 20 will be friends or family?", opts: [{ v: "none", label: "None" }, { v: "few", label: "1 to 5" }, { v: "half", label: "6 to 10" }, { v: "most", label: "11 to 15" }, { v: "all", label: "16 to 20" }], why: "If most of your sample loves you, the sample is not a test." },
    sKnow: { fmt: "tf", knowledge: true, correct: false, text: () => "Friends and family are the best people to test your idea on.", expl: "False. People who love you say yes to be kind. Strangers with the problem tell you the truth, and the person who pays matters more than the person who likes you." },
    // ---- Step 2, round 2: selling on the ground ----
    fsGut: { fmt: "reflex", seconds: 8, text: () => "Gut answer, 8 seconds: most people I talk to will say yes.", opts: [{ v: true, label: "TRUE" }, { v: false, label: "FALSE" }], why: "Your fast answer, to be compared with a reasoned one." },
    fsDaily: { fmt: "band", vals: [2, 3, 5, 8, 10, 15, 20, 30, 50], def: 3, unit: "people a day", text: () => "How many people can you realistically talk to about this each day?", hint: "Count real conversations, not messages sent.", why: "Selling is a daily job with a daily number." },
    fsClose: { fmt: "single", ord: true, text: () => "Out of 100 people you talk to, how many will buy?", opts: [1, 2, 5, 10, 20, 30, 50].map((n) => ({ v: n, label: n + " out of 100" })), why: "Most first-time sellers guess far too high." },
    fsMeet: { fmt: "single", ord: true, text: () => "How long does it take to explain and close one sale?", opts: [{ v: "lt10", label: "Under 10 minutes" }, { v: "half", label: "About 30 minutes" }, { v: "hour", label: "About an hour" }, { v: "several", label: "Several meetings" }, { v: "weeks", label: "Weeks" }], why: "Long sales need fewer, bigger customers. Short sales need many." },
    fsChannel: { fmt: "multi", excl: "come", text: () => "How will you actually reach them? Tick every way.", opts: [{ v: "walk", label: "Walking up to people or door to door" }, { v: "call", label: "Phone calls" }, { v: "dm", label: "WhatsApp or direct messages" }, { v: "stall", label: "A stall or an event" }, { v: "ads", label: "Online ads" }, { v: "refer", label: "Referrals" }, { v: "come", label: "They will come to me" }], why: "'They will come to me' means nobody is selling." },
    "reveal:funnel": { fmt: "reveal", kind: "funnel" },
    // ---- Step 2, round 3: what a NO means ----
    cLadder: { fmt: "single", knowledge: true, correct: "deposit", text: () => "Which is the strongest sign that someone will really buy?", opts: [{ v: "nice", label: "They said it is a great idea" }, { v: "details", label: "They asked you to send details" }, { v: "price", label: "They asked the price" }, { v: "deposit", label: "They paid a deposit or pre-ordered" }, { v: "share", label: "They shared it with friends" }], expl: "A deposit. Compliments cost nothing, and 'send me details' is often a polite no. Money, or a real commitment of time or reputation, is the first honest signal." },
    cNoPlan: { fmt: "single", text: () => "When someone says no, what will you do?", opts: [{ v: "argue", label: "Try to convince them" }, { v: "why", label: "Ask why, and note the reason" }, { v: "stop", label: "Thank them and move on without asking" }, { v: "change", label: "Change the idea right away" }, { v: "ignore", label: "Ignore it, they do not understand" }], why: "A no is the cheapest lesson you will get." },
    cPrice: { fmt: "single", text: (c) => `At what price will you test? Your price from Step 1 is ${money(PF.val(c.S, "price"))}.`, opts: [{ v: "mine", label: "My own price" }, { v: "half", label: "Half my price" }, { v: "double", label: "Double my price" }, { v: "free", label: "Free, to get feedback" }, { v: "see", label: "I will decide when I see their reaction" }], why: "A free test only proves that people like free things." },
    cDeposit: { fmt: "tf", conf: true, text: () => "I am ready to ask people for a small deposit or pre-order in these conversations.", why: "Without a commitment, 'yes' is only an opinion." },
    cExpect: { fmt: "single", ord: true, text: () => "How many of your 20 conversations do you expect to end in a clear no?", opts: [{ v: "few", label: "0 to 2" }, { v: "some", label: "3 to 5" }, { v: "many", label: "6 to 10" }, { v: "most", label: "11 to 15" }, { v: "nearly", label: "16 to 20" }], why: "Real founders expect many no's. Expecting almost none is a sign of wishful thinking." },
    // ---- Step 3, round 1: the twelve jobs ----
    jobs: { fmt: "matrix", text: () => "Running one order takes twelve jobs. For each, who does it, and do you know the time and cost?", rows: [["source", "Sourcing what you sell"], ["quality", "Quality checks"], ["pack", "Packing and storage"], ["dispatch", "Dispatch and delivery"], ["returns", "Returns and complaints"], ["support", "Customer support"], ["pay", "Collecting and matching payments"], ["comply", "Licences, tax and compliance"], ["stock", "Stock and inventory"], ["hire", "Hiring and training"], ["accounts", "Accounts and bookkeeping"], ["market", "Marketing and finding customers"]], who: [["me", "Me"], ["hire", "Someone I will hire"], ["partner", "A partner"], ["nobody", "Nobody yet"]], know: [["yes", "Yes"], ["rough", "Roughly"], ["no", "No"]], why: "Most plans describe the idea and skip the work. Every job without an owner is a job that will not get done." },
    opsLive: { fmt: "single", ord: true, text: () => "Have you spent a full working day inside a business like yours?", opts: [{ v: "many", label: "Yes, more than once" }, { v: "once", label: "Yes, once" }, { v: "outside", label: "I have only watched from outside" }, { v: "no", label: "No, never" }], why: "The work has a thousand small surprises. Investors back people who have already met them." },
    // ---- Step 3, round 2: people and hours ----
    tHours: { fmt: "band", vals: [5, 10, 15, 20, 30, 40, 50, 60], def: 3, unit: "hours a week", text: () => "How many hours a week can you work on this?", hint: "Be honest about studies, exams and everything else.", why: "Your hours are the first limit on the business." },
    tNeed: { fmt: "band", vals: [10, 20, 40, 60, 80, 120, 160, 200], def: 2, unit: "hours a week", text: () => "How many hours a week does all the work you listed really need?", hint: "Add up every job, selling included.", why: "A plan that needs three of you is not a one-person plan." },
    tHires: { fmt: "band", vals: [0, 1, 2, 3, 5, 8, 12], def: 2, unit: "people", text: () => "How many people besides you will you need in the first year?", why: "People are the biggest cost in most businesses." },
    tPay: { fmt: "band", vals: [0, 5000, 8000, 12000, 15000, 20000, 30000, 50000], def: 3, money: true, text: () => "What will you pay each person per month?", hint: "Choose 0 only if they work for free, which rarely lasts.", why: "Free helpers leave when something better comes along." },
    tManage: { fmt: "single", ord: true, text: () => "Have you ever managed people doing real work?", opts: [{ v: "many", label: "Yes, many people" }, { v: "few", label: "Yes, a few people" }, { v: "class", label: "Only classmates on projects" }, { v: "no", label: "No" }], why: "Managing people is a skill, and it is learned slowly." },
    tScenario: { fmt: "single", text: () => "A key helper stops turning up and tells you nothing. What do you do first?", opts: [{ v: "scold", label: "Scold them in front of the others" }, { v: "talk", label: "Talk to them privately and find out why" }, { v: "replace", label: "Replace them straight away" }, { v: "quiet", label: "Do their work yourself and say nothing" }, { v: "hope", label: "Hope it fixes itself" }], why: "How you handle this one moment shows how you will handle a team." },
    "reveal:team": { fmt: "reveal", kind: "team" },
    // ---- Step 3, round 3: the cheapest proof ----
    mvp: { fmt: "single", text: () => "What is the cheapest way to prove that customers want this?", opts: [{ v: "full", label: "Build the full app or website first" }, { v: "landing", label: "A landing page with a sign-up or pre-order form" }, { v: "whatsapp", label: "A WhatsApp catalogue and pre-orders" }, { v: "manual", label: "Do it by hand for 5 customers" }, { v: "proto", label: "A clickable prototype to show people" }, { v: "none", label: "No proof needed, I am sure" }], why: "You do not need a finished product to raise funds. You need proof that people want it." },
    mvpCost: { fmt: "band", vals: [0, 2000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000], def: 3, money: true, text: () => "What will it cost to get that first proof?", why: "The cheaper the proof, the more tests you can run before the money is gone." },
    mvpBelieve: { fmt: "tf", conf: true, text: () => "I need a finished product before I can ask anyone to pay.", why: "Many successful products took money before they existed." },
    // ---- Step 3, round 4: every rupee ----
    bStock: bucket("bStock", "stock or the product itself", "Every rupee needs a bucket."),
    bPeople: bucket("bPeople", "people", "People cost more than they look."),
    bMarketing: bucket("bMarketing", "marketing and selling", "Selling is often the biggest cost."),
    bTools: bucket("bTools", "software, tools and technology", "Tools look small and add up."),
    bSpace: bucket("bSpace", "rent and space", "Space is a fixed cost, due even without sales."),
    bBuffer: bucket("bBuffer", "a safety buffer for surprises", "Plans meet bad months. A buffer is what keeps you alive."),
    bOther: bucket("bOther", "anything else", "Money with no bucket is hope, not a plan."),
    "reveal:buckets": { fmt: "reveal", kind: "buckets" },
    // ---- Step 4, round 1: burn ----
    bGut: { fmt: "reflex", seconds: 8, text: () => "Gut answer, 8 seconds: customers won with discounts will keep buying when the discounts end.", opts: [{ v: true, label: "TRUE" }, { v: false, label: "FALSE" }], why: "Your quick answer, to be compared with a reasoned one." },
    bDisc: { fmt: "band", vals: [0, 50, 100, 200, 300, 500, 1000], def: 2, money: true, text: () => "How much discount or free gift will you give each new customer?", hint: "Choose 0 if you will sell at full price.", why: "A discount is cash you give away." },
    bCust: { fmt: "band", vals: [10, 50, 100, 500, 1000, 5000, 10000], def: 3, unit: "customers", text: () => "How many customers do you want to win with it?", why: "Total burn is the discount times the number of customers." },
    bStay: { fmt: "single", ord: true, text: () => "When the discount ends, how many of 100 will keep buying?", opts: [10, 20, 30, 50, 70, 90].map((n) => ({ v: n, label: n + " out of 100" })), why: "Discount buyers often leave when the discount does." },
    "reveal:burn": { fmt: "reveal", kind: "burn" },
    // ---- Step 4, round 2: break-even ----
    gStart: { fmt: "band", vals: [5, 10, 20, 50, 100, 200, 500, 1000], def: 3, unit: "orders", text: () => "How many orders will you do in your first month?", why: "The start sets how long the climb takes." },
    gRate: { fmt: "single", ord: true, text: () => "How fast will your monthly orders grow?", opts: [{ v: 5, label: "5% more each month" }, { v: 10, label: "10% more each month" }, { v: 20, label: "20% more each month" }, { v: 40, label: "40% or more each month" }], why: "Fast growth is rare. Slow growth means you pay fixed costs for longer." },
    gOwner: { fmt: "tf", conf: true, text: () => "I will take no pay until the business breaks even.", why: "Founders who live on air often burn out before break-even." },
    "reveal:breakeven": { fmt: "reveal", kind: "breakeven" },
    // ---- Step 4, round 3: the ask ----
    askPick: { fmt: "single", text: () => "Which number will you ask for?", optsFn: (S) => { const be = PF.s4.breakeven(S), q = PF.s3.quoted(S); const o = []; if (be && be.cash !== null) o.push({ v: "be", label: `${money(Math.round((be.cash * 1.2) / 1000) * 1000)}: the cash to reach break-even, with a 20% cushion` }); o.push({ v: "quote", label: `${money(Math.round(q.realAsk / 1000) * 1000)}: what my real quotes say I need` }); const md = val(S, "moneyDream"); if (md) o.push({ v: "dream", label: `${money(md)}: the number I first imagined` }); o.push({ v: "whatever", label: "Whatever investors are willing to give" }); return o; }, why: "An ask without a reason is a wish." },
    askUse: { fmt: "multi", text: () => "What will the money buy? Tick the top three.", opts: [{ v: "stock", label: "Stock or the product" }, { v: "people", label: "People" }, { v: "marketing", label: "Marketing and selling" }, { v: "tools", label: "Tools and technology" }, { v: "space", label: "Rent and space" }, { v: "buffer", label: "A safety buffer" }, { v: "other", label: "Something else" }], why: "Investors read the use of funds before they read anything else." },
    askMilestone: { fmt: "single", text: () => "What will the money get you in twelve months?", opts: [{ v: "c100", label: "My first 100 paying customers" }, { v: "be", label: "Break-even in my first city" }, { v: "repeat", label: "A sales process that repeats without me" }, { v: "prod", label: "A finished product" }, { v: "vague", label: "Growth" }], why: "A milestone must be something a stranger could check." },
    askConf: { fmt: "tf", conf: true, text: () => "I can explain every rupee of this ask to a stranger.", why: "If you cannot, the investor will find the gap in your first question." },
    "reveal:askline": { fmt: "reveal", kind: "askline" },
  });

  // ======================= COMPUTATIONS =======================
  PF.s2 = {
    funnel(S) {
      const d = val(S, "fsDaily"), c = val(S, "fsClose"); if (!d || !c) return null;
      const contacts = Math.ceil(10 / (c / 100)); return { contacts, days: Math.ceil(contacts / d), daily: d, close: c };
    },
    // everything the interviewers told us (verified answers only)
    demand(S) {
      const m = MS(S, 2), dev = PF.deviceId(), same = !!m.allowSame;
      const all = (m.witnesses || []).map((w) => PF.readW(w.token)).filter((r) => r && r.k === "interview");
      const ok = all.filter((r) => same || r.device !== dev), n = ok.length;
      const price = val(S, "price"), c = (f) => ok.filter(f).length;
      const strangers = c((r) => r.rel === "stranger"), payers = c((r) => ["payer", "both"].includes(r.role));
      const payYes = c((r) => r.pay === "yes"), payMaybe = c((r) => r.pay === "maybe"), dep = c((r) => r.dep === "yes");
      const face = c((r) => ["often", "sometimes"].includes(r.face)), paidBefore = c((r) => r.today === "paid" || r.today === "mix" || (r.spent && r.spent !== "none"));
      const sPay = ok.filter((r) => r.rel === "stranger"), fPay = ok.filter((r) => r.rel !== "stranger");
      const sYes = sPay.filter((r) => r.pay === "yes").length, fYes = fPay.filter((r) => r.pay === "yes").length;
      const reasons = {}; ok.forEach((r) => { if (r.pay !== "yes" && r.why) reasons[r.why] = (reasons[r.why] || 0) + 1; });
      const pc = (x) => pctOf(x, n);
      let level = "none"; if (n >= 5) { const fr = pc(face), py = pc(payYes), dp = pc(dep); level = (dp >= 20 || (py >= 50 && fr >= 60)) ? "strong" : ((py < 25 && dp < 5) || fr < 40) ? "weak" : "mixed"; }
      return { n, strangers, payers, payYes: pc(payYes), payMaybe: pc(payMaybe), dep: pc(dep), face: pc(face), paidBefore: pc(paidBefore), strangerYes: sPay.length ? pctOf(sYes, sPay.length) : null, friendYes: fPay.length ? pctOf(fYes, fPay.length) : null, reasons, level, price, payersYes: payers ? pctOf(ok.filter((r) => ["payer", "both"].includes(r.role) && ["yes", "maybe"].includes(r.pay)).length, payers) : null };
    },
  };
  const BUCKETS = [["bStock", "Stock or product"], ["bPeople", "People"], ["bMarketing", "Marketing and selling"], ["bTools", "Tools and technology"], ["bSpace", "Rent and space"], ["bBuffer", "Safety buffer"], ["bOther", "Anything else"]];
  PF.BUCKETS = BUCKETS;
  PF.s3 = {
    team(S) {
      const have = val(S, "tHours"), need = val(S, "tNeed"), hires = val(S, "tHires") || 0, pay = val(S, "tPay") || 0; if (!have || !need) return null;
      return { have, need, ratio: need / have, short: Math.max(0, need - have), hires, pay, peopleMonthly: hires * pay };
    },
    buckets(S) {
      const rows = BUCKETS.map(([k, label]) => ({ key: k, label, amt: val(S, k) || 0 })); const total = rows.reduce((a, r) => a + r.amt, 0);
      return { rows, total, md: val(S, "moneyDream"), peak: (PF.flow(S) || {}).peakCash || null };
    },
    // main costs that must be proven with real quotes: the biggest three of the first five buckets
    mainCosts(S) { return PF.s3.buckets(S).rows.filter((r) => ["bStock", "bPeople", "bMarketing", "bTools", "bSpace"].includes(r.key) && r.amt > 0).sort((a, b) => b.amt - a.amt).slice(0, 3); },
    quoted(S) {
      const b = PF.s3.buckets(S), q = (MS(S, 3).quotes || {}); let backed = 0, real = 0;
      const rows = b.rows.map((r) => { const list = (q[r.key] || []).filter((x) => x.vendor && x.vendor.trim().length > 1 && Number(x.amt) > 0), avg = list.length >= 2 ? list.reduce((a, x) => a + Number(x.amt), 0) / list.length : null; const revised = avg === null ? r.amt : avg; backed += avg === null ? 0 : Math.min(r.amt, avg); real += revised; return Object.assign({}, r, { quotes: list.length, avg, revised }); });
      return { rows, total: b.total, backed, backedPct: b.total ? Math.round((backed / b.total) * 100) : 0, realAsk: real || b.total };
    },
  };
  PF.s4 = {
    burn(S) {
      const d = val(S, "bDisc"), n = val(S, "bCust"), stay = val(S, "bStay"); if (d === undefined || !n || !stay) return null;
      const f = PF.flow(S), burn = d * n, kept = n * (stay / 100), perKept = kept ? burn / kept : Infinity, ask = PF.s4.askAmount(S);
      return { d, n, stay, burn, kept, perKept, ltv: f ? f.ltv : null, ask, share: ask ? burn / ask : null };
    },
    breakeven(S) {
      const f = PF.flow(S), start = val(S, "gStart"), g = val(S, "gRate"); if (!f || !start || !g) return null;
      const c = f.base.contribution, t = PF.s3.team(S), fixed = Math.max(f.base.fixed || 0, t ? t.peopleMonthly : 0);
      const rows = []; let cum = 0, min = 0, beMonth = null;
      for (let m = 1; m <= 36; m++) { const orders = start * Math.pow(1 + g / 100, m - 1), profit = orders * c - fixed; cum += profit; min = Math.min(min, cum); rows.push({ m, orders, profit, cum }); if (beMonth === null && profit >= 0 && c > 0) beMonth = m; }
      return { c, fixed, rows, months: beMonth, cash: c > 0 && beMonth !== null ? Math.max(0, -min) : null, never: !(c > 0) || beMonth === null };
    },
    askAmount(S) {
      const sm = S.ask && S.ask.amount; if (sm) return sm; const a = val(S, "askPick"), be = PF.s4.breakeven(S), q = PF.s3.quoted(S);
      if (a === "be" && be && be.cash !== null) return Math.round((be.cash * 1.2) / 1000) * 1000; if (a === "quote") return Math.round(q.realAsk / 1000) * 1000; if (a === "dream") return val(S, "moneyDream") || q.realAsk; return q.realAsk;
    },
  };

  // ======================= UNITS (rounds) =======================
  const U2 = [
    { id: 1, title: "Who is in the sale?", finds: "Who really decides and pays, and who you will talk to.", items: ["sRoles", "sFirstSay", "sPayerReach", "sListSource", "sFriendShare", "sKnow"], prelude: [
      { h: "A sale has a cast", p: "The person who uses it, the person who decides and the person who pays can be three different people. You must find the real customer." },
      { h: "Talk to the right people", p: "Friends say yes to be kind. We plan conversations with strangers who have the problem, and with the person who pays." },
      { h: "No guessing this time", p: "Step 1 was about your answers. Step 2 is about other people's answers. You will go and collect them." }],
      story: { slot: true, theme: "A founder who built for the user while the payer said no", why: "Shows why the person who pays must be tested separately." } },
    { id: 2, title: "Selling on the ground", finds: "How many conversations it takes to win a customer.", items: ["fsGut", "fsDaily", "fsClose", "fsMeet", "fsChannel", "reveal:funnel"], prelude: [
      { h: "Selling is a daily number", p: "Contacts a day, a close rate, a time per sale. These three numbers decide how long it takes to win customers." },
      { h: "Gut first, then head", p: "You will answer one question fast, and then think. The gap shows how optimistic you are." },
      { h: "Nobody finds you", p: "A product does not sell itself. Someone has to walk up to people, every day." }],
      story: { title: "Zappos: testing demand before holding any stock", body: ["Before Zappos, founder Nick Swinmurn tested whether people would buy shoes online without trying them on. In his own account in Fortune, he photographed shoes at local stores, posted them on a website, and bought a pair from the store only after a customer ordered it.", "The site was called Shoesite.com. When an order came in, he bought the shoes and shipped them. He had no inventory and almost no cost, and the first orders told him people would buy."], teaches: "You can test demand by selling by hand before you build anything. The first sale is the best research.", source: { label: "Fortune: Nick Swinmurn, Zappos' silent founder (2012)", url: "https://fortune.com/2012/09/05/nick-swinmurn-zappos-silent-founder/" } } },
    { id: 3, title: "What a no really means", finds: "How you will read the answers you get.", items: ["cLadder", "cNoPlan", "cPrice", "cDeposit", "cExpect"], prelude: [
      { h: "Words are cheap", p: "People say 'great idea' to be polite. Money, a deposit or a pre-order is the first honest answer." },
      { h: "A no is data", p: "Every no tells you the price, the product, the person or the timing is wrong. Collect your no's like a treasure." },
      { h: "Now go and ask", p: "After this round you will send out links and collect real answers from real people. That is Mission 2." }],
      story: { slot: true, theme: "A founder who heard 'send me details' and counted it as a yes", why: "Shows the difference between interest and commitment." } },
  ];
  const U3 = [
    { id: 1, title: "The twelve jobs", finds: "Whether you know the real work behind one order.", items: ["jobs", "opsLive"], prelude: [
      { h: "An idea is a sentence. A business is a thousand jobs", p: "Sourcing, packing, delivery, returns, payments, tax, hiring. Each job costs time and money, and each needs an owner." },
      { h: "Who does each job?", p: "You will mark an owner for twelve jobs and say whether you know their time and cost." },
      { h: "Seen from outside is not seen", p: "Watching a business from outside shows you the front. The real work is behind it." }],
      story: { slot: true, theme: "A founder surprised by a job nobody had planned", why: "Shows why every job needs an owner before launch." } },
    { id: 2, title: "People and hours", finds: "Whether you have the hours and the skill to run it.", items: ["tHours", "tNeed", "tHires", "tPay", "tManage", "tScenario", "reveal:team"], prelude: [
      { h: "Your hours are a limit", p: "You have a fixed number of hours. The work needs a number too. The gap between them is what you must hire." },
      { h: "People cost money and attention", p: "Every person costs salary and your time. Some need more of your time than they give back." },
      { h: "Managing is a skill", p: "A helper who stops turning up is a test. How you handle it shows how you will handle a team." }],
      story: { slot: true, theme: "A founder who hired friends and lost the friendships", why: "Shows how team problems start." } },
    { id: 3, title: "The cheapest proof", finds: "How to prove demand without building the whole thing.", items: ["mvp", "mvpCost", "mvpBelieve"], prelude: [
      { h: "Do you need an MVP?", p: "A minimum product is a way to test. You may not need one to start. You do need proof that people want it." },
      { h: "Cheap beats clever", p: "A page, a form or a manual service can test demand for a fraction of the cost of an app." },
      { h: "Proof is the product", p: "To investors, proof that people want it is worth more than the product you hoped to build." }],
      story: { title: "Buffer: a landing page and a pricing page before any product", body: ["Before building Buffer, Joel Gascoigne put up a simple landing page that explained the idea and offered a sign-up. A button for plans and pricing led to a short message saying the product was not quite ready and inviting people to leave their e-mail.", "As reported by Zurb, many visitors clicked through and left their e-mail, while only a few clicked on the paid plans. That gap told him how many visitors could become paying customers. Another write-up reports that the first customers paid about seven weeks later."], teaches: "A page and a pricing button can test demand for almost no money. Interest and willingness to pay are different, and you can measure both.", source: { label: "Zurb: putting up a price plans page before you build", url: "https://zurb.com/blog/putting-up-a-price-plans-page-before-you-" } } },
    { id: 4, title: "Every rupee of your ask", finds: "Where each rupee will go, and how that compares with your own numbers.", items: ["bStock", "bPeople", "bMarketing", "bTools", "bSpace", "bBuffer", "bOther", "reveal:buckets"], prelude: [
      { h: "Money needs buckets", p: "A rupee with no bucket is hope. You will split your money across the seven places it can go." },
      { h: "Compare with your first number", p: "In Step 1 you gave a first number. We bring it back to see how far your buckets are from it." },
      { h: "Then prove it", p: "Next comes Mission 3. For your three biggest buckets you will collect real quotes. The part your quotes support is the part that is backed." }],
      story: { slot: true, theme: "A founder who asked for a big round and could not explain the use of funds", why: "Shows why backed money matters." } },
  ];
  const U4 = [
    { id: 1, title: "Who pays for the discounts?", finds: "What your discount plan really costs, and who stays.", items: ["bGut", "bDisc", "bCust", "bStay", "reveal:burn"], prelude: [
      { h: "Discounts are cash", p: "Every rupee off is a rupee you do not collect. Total burn is the discount times the number of customers." },
      { h: "Big names had big backers", p: "Companies you admire spent huge sums on discounts. It was their investors' money, and they could wait years for it to pay back." },
      { h: "What matters is who stays", p: "A discount only pays off if the customers it buys are still buying after it ends." }],
      story: { slot: true, theme: "A discount-led startup that won customers and could not keep them", why: "Shows why retention decides whether burn was worth it." } },
    { id: 2, title: "Break-even and the long road", finds: "How long until the business pays for itself, and how much cash that takes.", items: ["gStart", "gRate", "gOwner", "reveal:breakeven"], prelude: [
      { h: "Break-even is a month, not a hope", p: "It is the first month when what you earn on orders covers what you spend. We will find that month from your own numbers." },
      { h: "Fixed costs are due on the first", p: "Rent and salaries are paid whether customers come or not. Until you break even, you burn cash." },
      { h: "The money you need is the climb", p: "Cash needed is the deepest point your cash reaches before you break even." }],
      story: { slot: true, theme: "A company that grew fast and ran out of cash before break-even", why: "Shows why runway matters." } },
    { id: 3, title: "The ask, and why", finds: "Whether your ask has a reason you can defend.", items: ["askPick", "askUse", "askMilestone", "askConf", "reveal:askline"], prelude: [
      { h: "An ask is a sentence with a reason", p: "'I am raising this much, to reach that, in this many months, and this share is backed by real quotes.'" },
      { h: "Choose a number you can defend", p: "We list the numbers your own work produced. You pick one and say why." },
      { h: "Then the smoke test", p: "In Mission 4 you test demand with real strangers and real money. If it passes, you are ready for investors." }],
      story: { title: "Dropbox: a short video before the finished product", body: ["Dropbox founder Drew Houston has described how a short demo video, released on Digg during the private beta in 2008, brought a waiting list of about 75,000 people within 24 hours. His team had expected 15,000 at most, he told TechCrunch.", "The video showed what the product would do and included a form to join the waiting list. The product was still limited, but the sign-ups showed real demand before the money and effort went in."], teaches: "A cheap test can show demand before the full product exists. Sign-ups are interest. Pre-orders and deposits are commitment.", source: { label: "TechCrunch: How Dropbox got its first 10 million users (2011)", url: "https://techcrunch.com/2011/11/01/founder-storie-how-dropbox-got-its-first-10-million-users/" } } },
  ];
  PF.STEPS = [
    { id: 1, name: "The idea on trial", units: PF.UNITS },
    { id: 2, name: "Customer truth", units: U2, theme: "c" },
    { id: 3, name: "The real work and the real cost", units: U3, theme: "d" },
    { id: 4, name: "The ask", units: U4, theme: "e" },
  ];
  PF.setStep = (n) => { PF.UNITS = PF.STEPS[Math.max(1, Math.min(4, n)) - 1].units; };

  // ======================= CHECKS =======================
  PF.extraChecks = [(S, add, v, has) => {
    const wp = v("whoPays"), roles = v("sRoles") || [], src = v("sListSource") || [], fsch = v("fsChannel") || [];
    if (roles.includes("payer") && ["no", "who"].includes(v("sPayerReach"))) add("s2a", 2, "You cannot reach the person who pays", "You listed a payer in the sale, but you cannot reach that person. Without them your demand test is incomplete.", ["sRoles", "sPayerReach"]);
    if (["half"].includes(v("sFriendShare"))) add("s2b", 1, "A lot of friends in your sample", "Half your first 20 conversations are friends or family. They will be kinder than strangers.", ["sFriendShare"]);
    if (["most", "all"].includes(v("sFriendShare"))) add("s2b", 2, "Your sample is mostly friends", "Most of your first 20 conversations are friends or family. That is a fan club, not a test.", ["sFriendShare"]);
    if (["parents", "business", "ads"].includes(wp) && has("sRoles") && !roles.includes("payer") && !roles.includes("only")) add("s2c", 1, "Someone else pays, but no payer is in your sale", "You said someone other than the user pays, but you did not list a payer in the decision.", ["whoPays", "sRoles"]);
    if (v("fsClose") >= 30) add("s2d", 1, "A very high close rate", "You expect to sell to 30 or more out of 100 people you talk to. First-time sellers usually win far fewer.", ["fsClose"]);
    if (v("fsGut") === true && v("fsClose") <= 10) add("g4", 1, "Gut and head disagree", "Your fast answer said most people will say yes. After thinking, you expect 10 in 100 or fewer. The second answer is usually closer.", ["fsGut", "fsClose"]);
    if (fsch.includes("come")) add("s2f", 2, "Nobody is selling", "You ticked 'they will come to me'. Selling is a job, and nobody has been given it.", ["fsChannel"]);
    if (["argue", "ignore"].includes(v("cNoPlan"))) add("s2g", 1, "You will argue with the people you learn from", "Arguing with a no, or ignoring it, throws away the cheapest lesson you will get.", ["cNoPlan"]);
    if (["free", "see"].includes(v("cPrice"))) add("s2h", 2, "A free test proves nothing", "Testing at no price, or deciding on the spot, will not tell you whether people will pay.", ["cPrice"]);
    if (v("cDeposit") === false) add("s2i", 1, "Without a commitment, yes is an opinion", "You are not ready to ask for a deposit or pre-order. Then every yes you hear is only an opinion.", ["cDeposit"]);
    if (v("cExpect") === "few") add("s2j", 1, "You expect almost nobody to refuse", "You expect 0 to 2 of 20 to say no. Real conversations end in many no's.", ["cExpect"]);
    // step 3
    const jobs = v("jobs") || {}, nob = Object.values(jobs).filter((r) => r && r.who === "nobody").length, unk = Object.values(jobs).filter((r) => r && r.know === "no").length;
    if (nob >= 3) add("s3a", 2, nob + " of 12 jobs have no owner", "Nobody is responsible yet for " + nob + " of the twelve jobs that run an order.", ["jobs"]); else if (nob >= 1) add("s3a", 1, nob + " job without an owner", "At least one of the twelve jobs has no owner yet.", ["jobs"]);
    if (unk >= 6) add("s3b", 1, "You do not know the time or cost of " + unk + " jobs", "For " + unk + " of the twelve jobs you do not know how long or how much.", ["jobs"]);
    if (["outside", "no"].includes(v("opsLive"))) add("s3c", 2, "You have not seen the work", "You have not spent a full working day inside a business like yours.", ["opsLive"]);
    const t = PF.s3.team(S);
    if (t && t.ratio > 1.5) add("s3d", 2, "The work needs " + PF.num(t.ratio, 1) + " times your hours", "You have " + t.have + " hours a week and the work needs " + t.need + ". You are short by " + t.short + " hours.", ["tHours", "tNeed"]);
    if (t && t.hires === 0 && t.need > t.have) add("s3e", 2, "No hires, but not enough hours", "You plan no hires, yet the work needs more hours than you have.", ["tHires", "tNeed", "tHours"]);
    if (v("tManage") === "no" && t && t.hires >= 3) add("s3f", 1, "Three or more hires, no experience managing", "You plan to hire " + t.hires + " people and have never managed people doing real work.", ["tManage", "tHires"]);
    if (["scold", "quiet", "hope"].includes(v("tScenario"))) add("s3g", 1, "A shaky first move with a missing helper", "Scolding in public, saying nothing or hoping it fixes itself will not keep a team.", ["tScenario"]);
    if (["full", "none"].includes(v("mvp"))) add("s3h", 2, "Building before proving", "You plan to build everything first, or skip proof. Investors want proof that people want it.", ["mvp"]);
    if (v("mvpBelieve") === true) add("s3h2", 1, "'I need a finished product first'", "You believe you need a finished product before asking anyone to pay. Many products took money before they existed.", ["mvpBelieve"]);
    const b = PF.s3.buckets(S), allB = ["bStock", "bPeople", "bMarketing", "bTools", "bSpace", "bBuffer", "bOther"].every((k) => has(k));
    if (allB && v("bBuffer") === 0) add("s3i", 1, "No safety buffer", "You set the safety buffer to nothing. A bad month will arrive.", ["bBuffer"]);
    if (allB && b.peak && b.total > 3 * b.peak) add("s3j", 2, "Your buckets are far above your own estimate", "Your buckets add up to " + money(b.total) + ". Your own numbers in Step 1 suggested about " + money(b.peak) + ".", ["bStock", "bPeople", "bMarketing"]);
    if (allB && b.peak && b.total < 0.5 * b.peak) add("s3j", 2, "Your buckets are below half of your own estimate", "Your buckets add up to " + money(b.total) + ", but your own numbers in Step 1 suggested about " + money(b.peak) + ".", ["bStock", "bPeople", "bMarketing"]);
    if (allB && t && t.peopleMonthly * 12 > v("bPeople") * 1.5 && v("bPeople") > 0) add("s3k", 2, "Your people budget does not cover your own hires", "You plan " + t.hires + " hires at " + money(t.pay) + " a month, which is " + money(t.peopleMonthly * 12) + " a year. Your people bucket is " + money(v("bPeople")) + ".", ["bPeople", "tHires", "tPay"]);
    // step 4
    const bn = PF.s4.burn(S);
    if (bn && bn.ltv > 0 && bn.perKept > bn.ltv) add("s4a", 2, "A lasting customer costs more than they are worth", "Each customer who stays costs you " + money(bn.perKept) + " in discounts. A customer is worth about " + money(bn.ltv) + " in a year.", ["bDisc", "bCust", "bStay"]);
    if (v("bGut") === true && v("bStay") <= 30) add("g5", 1, "Gut and head disagree", "Your fast answer said discount customers will stay. After thinking, you expect 30 in 100 or fewer.", ["bGut", "bStay"]);
    if (bn && bn.share !== null && bn.share > 0.5) add("s4c", 2, "Half your raise would go on discounts", "Your discounts cost " + money(bn.burn) + ", which is " + Math.round(bn.share * 100) + "% of your ask.", ["bDisc", "bCust"]);
    const be = PF.s4.breakeven(S);
    if (be && (be.never || be.months > 24)) add("s4d", 2, be.never ? "At these numbers you never break even" : "Break-even is " + be.months + " months away", be.never ? "With your contribution per order and your costs, orders never cover fixed costs within three years." : "Your own numbers reach break-even in month " + be.months + ". That is a long time to be funded.", ["gStart", "gRate"]);
    const ask = PF.s4.askAmount(S);
    if (be && be.cash !== null && has("askPick") && ask && be.cash > ask) add("s4e", 2, "Your ask runs out before break-even", "Your numbers need about " + money(be.cash) + " to reach break-even. Your ask is " + money(ask) + ".", ["askPick", "gStart"]);
    if (["dream", "whatever"].includes(v("askPick"))) add("s4f", 2, "An ask with no reason", "You picked a number with no calculation behind it. Investors will ask where it comes from.", ["askPick"]);
    if (["prod", "vague"].includes(v("askMilestone"))) add("s4g", 1, "A milestone nobody can check", "'A finished product' or 'growth' cannot be checked by a stranger.", ["askMilestone"]);
    if (v("askConf") === false) add("s4h", 1, "You cannot explain every rupee", "You said you could not explain every rupee of your ask.", ["askConf"]);
  }];

  // ======================= validated numbers: claims climb the ladder =======================
  PF.upgradeTags = (S, step) => {
    const up = {}; const t = S.tags = S.tags || {};
    const set = (k, lvl) => { const rank = { guess: 0, asked: 1, tested: 2, paid: 3 }; if (rank[lvl] > (rank[t[k]] || 0)) { t[k] = lvl; up[k] = lvl; } };
    if (step === 2) { const d = PF.s2.demand(S); set("price", d.dep > 0 ? "paid" : "asked"); set("recvDays", "asked"); if (d.paidBefore > 0) set("custFreq", "asked"); }
    if (step === 3) { set("cost", "tested"); const q = (MS(S, 3).quotes || {}); const terms = Object.values(q).flat().filter((x) => x && x.terms && x.terms !== "unknown"); if (terms.length >= 2) set("supTerms", "tested"); }
    if (step === 4) { set("cac", "tested"); set("volume", "asked"); }
    return up;
  };

  // ======================= the investor-ready gate =======================
  PF.gate = (S) => {
    const d = PF.s2.demand(S), q = PF.s3.quoted(S), be = PF.s4.breakeven(S), ask = PF.s4.askAmount(S), cs = PF.castle(S), wp = val(S, "whoPays");
    const m4 = MS(S, 4), m2 = MS(S, 2), m3 = MS(S, 3);
    const payerRate = wp && wp !== "users" ? d.payersYes : (d.n ? d.payYes + d.payMaybe : null);
    const checks = [
      { id: "demand", label: "Customers showed demand in real conversations", ok: ["strong", "mixed"].includes(d.level), note: "Your interviews read '" + d.level + "'.", fix: 2 },
      { id: "payer", label: wp && wp !== "users" ? "The people who pay said they would pay" : "The users said they would pay", ok: payerRate !== null && payerRate >= 40, note: payerRate === null ? "No payer answers yet." : "Positive answers: " + payerRate + "%.", fix: 2 },
      { id: "backed", label: "At least half of your money is backed by real quotes", ok: q.backedPct >= 50, note: "Backed: " + q.backedPct + "%.", fix: 3 },
      { id: "runway", label: "Your ask reaches break-even within 24 months", ok: !!(be && !be.never && be.months <= 24 && be.cash !== null && be.cash <= ask), note: be ? (be.never ? "Never breaks even." : "Break-even in month " + be.months + ", cash needed " + money(be.cash) + " against an ask of " + money(ask) + ".") : "Break-even not worked out.", fix: 4 },
      { id: "smoke", label: "Your smoke test passed", ok: !!(m4.verdict && m4.verdict.ok), note: m4.verdict ? (m4.verdict.ok ? "Passed." : "Not accepted yet.") : "Not submitted.", fix: 4 },
      { id: "castle", label: "No more than half of your plan stands on guesses", ok: cs.pctGuess <= 50, note: cs.pctGuess + "% still floats on guesses.", fix: 1 },
    ];
    return { checks, ready: checks.every((c) => c.ok) };
  };

  // ======================= sample founder for demos =======================
  PF.demoFill = (S, step) => {
    const A = (v, c) => ({ v, t: 1, ...(c ? { conf: c } : {}) });
    Object.assign(S.ans, { sRoles: A(["user", "decider", "payer"]), sFirstSay: A("payer"), sPayerReach: A("effort"), sListSource: A(["strangers", "shops", "groups"]), sFriendShare: A("few"), sKnow: A(false), fsGut: A(true), fsDaily: A(10), fsClose: A(5), fsMeet: A("half"), fsChannel: A(["walk", "dm"]), cLadder: A("deposit"), cNoPlan: A("why"), cPrice: A("mine"), cDeposit: A(true, 75), cExpect: A("many") });
    if (step >= 3) Object.assign(S.ans, { jobs: A({ source: { who: "me", know: "rough" }, quality: { who: "me", know: "yes" }, pack: { who: "hire", know: "rough" }, dispatch: { who: "partner", know: "yes" }, returns: { who: "me", know: "rough" }, support: { who: "me", know: "yes" }, pay: { who: "me", know: "yes" }, comply: { who: "partner", know: "no" }, stock: { who: "me", know: "rough" }, hire: { who: "me", know: "no" }, accounts: { who: "partner", know: "yes" }, market: { who: "me", know: "rough" } }), opsLive: A("once"), tHours: A(30), tNeed: A(40), tHires: A(1), tPay: A(12000), tManage: A("few"), tScenario: A("talk"), mvp: A("whatsapp"), mvpCost: A(5000), mvpBelieve: A(false, 75), bStock: A(250000), bPeople: A(250000), bMarketing: A(100000), bTools: A(25000), bSpace: A(50000), bBuffer: A(100000), bOther: A(25000) });
    if (step >= 4) Object.assign(S.ans, { bGut: A(false), bDisc: A(100), bCust: A(100), bStay: A(50), gStart: A(100), gRate: A(10), gOwner: A(true, 75), askPick: A("be"), askUse: A(["stock", "people", "marketing"]), askMilestone: A("c100"), askConf: A(true, 75) });
  };
})();
