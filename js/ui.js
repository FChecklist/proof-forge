/* Proof Forge, Step 1: screens and flow. Every answer is a tap. State is saved after each tap, so a closed tab resumes where it stopped. */
(function () {
  const PF = (window.PF = window.PF || {});
  const e = PF.esc, $app = document.getElementById("app");
  const fresh = () => ({ v: 1, screen: "intro", profile: null, seed: 0, daydream: 50, flavour: null, shape: null, router: {}, ans: {}, tags: {}, mirror: {}, shown: [], u: 0, qi: 0, pi: 0, queue: {}, sub: null, t0: null, rebuild: {}, mission: {} });
  let S = PF.store.load() || fresh();
  const save = () => PF.store.save(S);
  const go = (screen, extra) => { Object.assign(S, extra || {}, { screen, sub: null }); save(); render(); window.scrollTo(0, 0); };
  PF.getState = () => S;
  PF.setState = (n) => { S = n; save(); render(); };
  const unit = () => PF.UNITS[S.u];
  const shapeOf = () => PF.SHAPES[S.shape] || PF.SHAPES.seller;
  const flavourOf = () => (PF.FLAVOURS.find((f) => f.id === S.flavour) || {}).label || "your idea";

  // ---------- helpers ----------
  function buildQueue(u) {
    const un = PF.UNITS[u]; let ids = un.items.slice();
    (un.grp || []).forEach((g, gi) => { const picked = g.map((i) => ids[i]); const sh = PF.shuffle(picked, PF.rng(S.seed + u * 101 + gi)); g.forEach((i, k) => (ids[i] = sh[k])); });
    return ids.filter((id) => { const it = PF.ITEMS[id]; return !it.only || it.only(S); });
  }
  const queue = () => { if (!S.queue[S.u]) S.queue[S.u] = buildQueue(S.u); return S.queue[S.u]; };
  const curId = () => queue()[S.qi];
  const optsFor = (id) => { const it = PF.ITEMS[id]; if (!it.opts || it.ord || it.fmt === "pair" || it.fmt === "reflex" || it.fmt === "tf") return it.opts; const keep = it.opts.filter((o) => o.v === it.excl), rest = it.opts.filter((o) => o.v !== it.excl); return PF.shuffle(rest, PF.rng(S.seed + PF.hash(id))).concat(keep); };
  const clock = () => { if (!S.t0) return "00:00"; const s = Math.floor((Date.now() - S.t0) / 1000); return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); };
  const money = (n) => PF.inr(n);

  // ---------- chrome ----------
  function topbar() {
    const dots = PF.UNITS.map((u, i) => `<i class="dot ${i < S.u ? "done" : i === S.u && ["unitIntro", "prelude", "q", "story", "mirror"].includes(S.screen) ? "now" : ""}" title="Unit ${i + 1}: ${e(u.title)}"></i>`).join("");
    return `<header class="top"><div class="wrap in"><a class="brand" href="#" data-act="home"><span class="mark">PF</span><span>Proof Forge<small>Step 1: Your ₹1 cycle</small></span></a><div class="dots" aria-label="Units">${dots}</div><div class="meta"><span id="clock" title="Session clock">${clock()}</span><button class="mini" data-act="reset" title="Start over (clears this browser)">Reset</button></div></div></header>`;
  }
  function render() {
    const fn = SCREENS[S.screen] || SCREENS.intro;
    $app.innerHTML = topbar() + `<main class="wrap main" id="main">${fn()}</main>`;
    afterRender();
  }
  let timer = null, reflexT = null;
  function afterRender() {
    clearTimeout(reflexT);
    if (S.screen === "q" && !S.sub) {
      const it = PF.ITEMS[curId()];
      if (it && it.fmt === "reflex") { S.rfs = Date.now(); const bar = document.getElementById("rbar"); if (bar) { requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.width = "0%"; })); } reflexT = setTimeout(() => answer(curId(), null, { to: true }), it.seconds * 1000); }
      if (it && it.fmt === "band") initBand(it);
    }
    if (S.screen === "missionSubmit" && PF.missionUI) PF.missionUI.after();
  }
  setInterval(() => { const c = document.getElementById("clock"); if (c) c.textContent = clock(); }, 1000);

  // ---------- recording answers ----------
  function answer(id, v, extra) {
    const it = PF.ITEMS[id]; clearTimeout(reflexT);
    S.ans[id] = Object.assign({ v, t: Date.now() }, extra || {});
    if (it.fmt === "reflex" && !(extra && extra.to)) S.ans[id].ms = Date.now() - (S.rfs || Date.now());
    if (!S.t0) S.t0 = Date.now();
    if (it.knowledge) { S.sub = { kind: "fb", id }; save(); return render(); }
    if (it.conf && (!extra || !extra.to)) { S.sub = { kind: "conf", id }; save(); return render(); }
    next();
  }
  function next() { S.sub = null; S.qi++; if (S.qi >= queue().length) { save(); return go("story"); } save(); render(); window.scrollTo(0, 0); }

  // ---------- band slider ----------
  function bandText(it, idx) { const v = it.vals[idx]; return it.money ? money(v) : v.toLocaleString("en-IN") + (it.unit === "%" ? "%" : it.unit ? " " + it.unit : ""); }
  function initBand(it) {
    const r = document.getElementById("band"), out = document.getElementById("bandval"); if (!r) return;
    const set = (i) => { i = Math.max(0, Math.min(it.vals.length - 1, i)); r.value = i; out.textContent = bandText(it, i); }; set(Number(r.value));
    r.oninput = () => set(Number(r.value));
    document.getElementById("bminus").onclick = () => set(Number(r.value) - 1); document.getElementById("bplus").onclick = () => set(Number(r.value) + 1);
    document.getElementById("bdone").onclick = () => answer(curId(), it.vals[Number(r.value)]);
  }

  // ---------- reveals ----------
  const statTile = (label, value, tone, sub) => `<div class="tile ${tone || ""}"><b>${value}</b><span>${e(label)}</span>${sub ? `<em>${sub}</em>` : ""}</div>`;
  function mapHTML(f) {
    const b = f.base, n = shapeOf().noun;
    const step = (t, big, sm) => `<div class="mstep"><span>${t}</span><b>${big}</b><em>${sm || ""}</em></div>`, arr = `<div class="marr" aria-hidden="true">→</div>`;
    return `<div class="map">${step("You put in", "₹1,00,000", "to start one cycle")}${arr}${step("It buys", Math.round(b.unitsBought).toLocaleString("en-IN") + " " + n + "s", "at " + money(b.cost) + " each")}${arr}${step("It waits", (b.stock + b.deliv) + " days", "stock, making, delivery")}${arr}${step("Customers pay", money(b.rev), "after " + b.recv + " more days")}${arr}${step("Back as", money(b.rev * (1 - b.leaks)), "after leaks, before fixed costs")}</div><p class="loop">↺ This loop takes <b>${PF.num(b.cycleDays, 0)} days</b>${b.negative ? " (customers fund you: check that this is real)" : ""}. In a year it can run <b>${PF.num(b.cyclesYr, 1)} times</b>.</p>`;
  }
  const REVEALS = {
    agg(f) { const a = f.agg; if (!a) return "<p>Answer the price and your cut first.</p>"; return `<h2>The aggregator's arithmetic</h2><p class="lead2">To earn <b>₹10 lakh a month</b> from a ${PF.num(f.base.cutPct, 0)}% cut, you must move:</p><div class="tiles">${statTile("of orders per month", money(a.gmv), "amber")}${statTile("orders per month", Math.round(a.orders).toLocaleString("en-IN"), "amber")}${statTile("orders every single day", Math.round(a.perDay).toLocaleString("en-IN"), "red")}</div><p class="note">Suppliers must be signed, customers won, and nobody must go around you. Which of these will you do first?</p>`; },
    cycle(f) {
      const b = f.base, rows = [["1 day", 365, "₹3.65 crore"], ["1 week", 52, "₹52 lakh"], ["1 month", 12, "₹12 lakh"]];
      const pick = b.cycleDays <= 3 ? 0 : b.cycleDays <= 10 ? 1 : 2;
      return `<h2>Your money cycle</h2>${mapHTML(f)}<div class="tiles">${statTile("days for money to go round", PF.num(b.cycleDays, 0), b.cycleDays > 30 ? "red" : "")}${statTile("rounds in a year", PF.num(b.cyclesYr, 1))}${statTile("yearly sales from ₹1 lakh (best case)", money(b.turnover1L), "amber")}</div><table class="tbl"><caption>On a base of ₹1 lakh, how the cycle changes the year</caption><thead><tr><th>Cycle</th><th>Rounds a year</th><th>Yearly turnover</th></tr></thead><tbody>${rows.map((r, i) => `<tr class="${i === pick ? "hl" : ""}"><th>${r[0]}</th><td>${r[1]}</td><td>${r[2]}</td></tr>`).join("")}</tbody></table><p class="note">Your cycle is closest to the <b>${rows[pick][0]}</b> row. Notice: these are best-case numbers, and your plan assumes everything sells and everyone pays.</p>`;
    },
    leaks(f) {
      const b = f.base, n = shapeOf().noun;
      return `<h2>What is really left</h2><div class="tiles">${statTile("earned on each " + n + " after all costs", money(b.contribution), b.contribution <= 0 ? "red" : "green")}${statTile("monthly profit at your own plan", money(b.monthlyProfit), b.monthlyProfit < 0 ? "red" : "green")}${statTile(n + "s a month to break even", b.breakEven === Infinity ? "never" : b.breakEven.toLocaleString("en-IN"), b.breakEven > b.V ? "red" : "green", "your plan: " + b.V.toLocaleString("en-IN"))}${statTile("profit on one ₹1 lakh cycle", money(b.profitCycle), b.profitCycle <= 0 ? "red" : "green")}</div><p class="note">${b.contribution <= 0 ? "At these numbers every sale loses money. More sales make it worse." : b.breakEven > b.V ? "At your own planned volume you lose " + money(-b.monthlyProfit) + " every month." : "On paper this works. Step 2 will test whether customers really behave like this."}</p>`;
    },
    repeat(f) {
      const bars = [["Month 1", 100], ["Month 2", f.m2 * 100], ["Month 3", f.m3 * 100], ["Month 6", f.m6 * 100]];
      const lc = f.ltvCac;
      return `<h2>Do they come back?</h2><div class="tiles">${statTile("a customer is worth in a year", money(f.ltv), "")}${statTile("it costs to win one", money(PF.val(S, "cac")), "")}${statTile("value for every ₹1 spent winning them", lc === null ? "n/a" : lc === Infinity ? "unlimited?" : PF.num(lc, 1) + "x", lc !== null && lc !== Infinity && lc < 1 ? "red" : lc !== null && lc !== Infinity && lc < 3 ? "amber" : "green")}</div><div class="bars" role="img" aria-label="Customers still buying">${bars.map((b) => `<div class="bar"><i style="height:${Math.max(4, b[1])}%"></i><span>${PF.num(b[1], 0)}</span><em>${b[0]}</em></div>`).join("")}</div><p class="note">If you stopped winning new customers today, your month-6 sales would be <b>${PF.num(f.m6 * 100, 0)}%</b> of month 1. That is the sales your business keeps by itself.</p>`;
    },
    stress(f) {
      const b = f.base, s = f.stress, list = PF.stressFrom(S);
      return `<h2>The bad month</h2><p class="lead2">Your own numbers, with the problems you ticked${Object.values(list).some(Boolean) ? "" : " (none, so nothing changed)"}.</p><div class="cmp"><div><h3>Plan</h3><p>Money cycle <b>${PF.num(b.cycleDays, 0)} days</b></p><p>Monthly profit <b class="${b.monthlyProfit < 0 ? "neg" : ""}">${money(b.monthlyProfit)}</b></p><p>Money stuck <b>${money(b.wc)}</b></p></div><div class="bad"><h3>Bad month</h3><p>Money cycle <b>${PF.num(s.cycleDays, 0)} days</b></p><p>Monthly profit <b class="${s.monthlyProfit < 0 ? "neg" : ""}">${money(s.monthlyProfit)}</b></p><p>Money stuck <b>${money(s.wc)}</b></p></div></div><div class="peak"><span>First estimate of the money you need to survive six bad months</span><b>${money(f.peakCash)}</b></div><p class="note">Step 3 will test this against real quotes. Remember it: this is the number your 'ask' must stand on.</p>`;
    },
  };

  // ---------- screens ----------
  const SCREENS = {
    intro() {
      return `<section class="hero2"><p class="eyebrow">Proof Forge · Step 1 of 12</p><h1>Your ₹1 cycle</h1><p class="lead">Find out exactly how money will move through your idea, from first rupee in to last rupee out. Tap to answer. Nothing to type except your name.</p>
      <div class="card form"><label for="nm">Your name</label><input id="nm" autocomplete="name" maxlength="60" value="${e((S.profile || {}).name || "")}"><label for="st">Your startup or idea (a name for it)</label><input id="st" maxlength="80" value="${e((S.profile || {}).startup || "")}">
      <label class="chk"><input type="checkbox" id="c18"> I am 18 or older.</label>
      <label class="chk"><input type="checkbox" id="cc"> I understand the hard questions are <b>thought experiments to test how committed I am</b>. Nobody is asking me to take money from my family, or to do anything I do not choose to do. I can pause any time.</label>
      <button class="btn" id="startbtn" data-act="start" disabled>Begin the 60-minute session</button></div>
      <ul class="how"><li><b>6 units</b> of about 10 minutes</li><li><b>Tap only.</b> True or false, choose, tick, slide</li><li>Questions come back later in <b>different shapes</b></li><li>The score rewards <b>honesty</b>, not big claims</li></ul><p class="small demo">Just looking? <a href="#demo=results" data-act="reload">Open a sample founder's result</a> · <a href="#demo=q:chain" data-act="reload">a sample question</a> · <a href="#demo=fail" data-act="reload">a rejected mission</a> · <a href="#demo=pass" data-act="reload">an accepted mission</a></p></section>`;
    },
    daydream() {
      return `<section class="center"><p class="eyebrow">Before we start</p><h1>Be honest: how ready is your idea to get funded?</h1><p class="lead">0 means nobody would invest. 100 means investors will queue up. Your answer stays hidden until the end.</p><div class="card"><div class="big" id="ddv">${S.daydream}</div><input type="range" id="dd" min="0" max="100" value="${S.daydream}" aria-label="Readiness from 0 to 100"><div class="ends"><span>Not ready</span><span>Investors will queue</span></div><button class="btn" data-act="ddok">Lock in my answer</button></div></section>`;
    },
    flavour() {
      const groups = {}; PF.FLAVOURS.forEach((f) => { (groups[f.shape] = groups[f.shape] || []).push(f); });
      const order = ["seller", "aggregator", "maker", "outlet", "service", "digital", "content", "heavy", "router"];
      return `<section><p class="eyebrow">Your idea</p><h1>Which one is closest to what you want to build?</h1><p class="lead">Pick the nearest. If nothing fits, choose the last one at the bottom.</p><div class="flav">${order.filter((o) => groups[o]).map((o) => `<div class="fgrp"><h3>${o === "router" ? "Not sure" : e(PF.SHAPES[o].name)}</h3><div class="chips">${groups[o].map((f) => `<button class="chip" data-act="flavour" data-id="${f.id}">${e(f.label)}</button>`).join("")}</div></div>`).join("")}</div></section>`;
    },
    router() {
      const i = Object.keys(S.router).length, q = PF.ROUTER[i];
      return `<section class="center"><p class="eyebrow">Three quick taps · ${i + 1} of 3</p><h1>${e(q.text)}</h1><div class="opts">${q.opts.map((o) => `<button class="opt" data-act="route" data-id="${q.id}" data-v="${o[0]}">${e(o[1])}</button>`).join("")}</div></section>`;
    },
    unitIntro() {
      const un = unit();
      return `<section class="center"><p class="eyebrow">Unit ${S.u + 1} of ${PF.UNITS.length} · about ${un.min} minutes</p><h1>${e(un.title)}</h1><p class="lead">What we will find out: <b>${e(un.finds)}</b></p><p class="small">Your idea: ${e(flavourOf())}</p><button class="btn" data-act="unitgo">Start</button></section>`;
    },
    prelude() {
      const un = unit(), c = un.prelude[S.pi];
      return `<section class="center prel"><p class="eyebrow">Before the questions · ${S.pi + 1} of ${un.prelude.length}</p><div class="card big2"><h1>${e(c.h)}</h1><p>${e(c.p)}</p></div><button class="btn" data-act="pnext">${S.pi + 1 < un.prelude.length ? "Next" : "Start the questions"}</button></section>`;
    },
    q() {
      const q = queue(), id = curId(), it = PF.ITEMS[id], c = PF.ctx(S), n = S.qi + 1;
      const head = `<div class="qhead"><span>Unit ${S.u + 1} · Question ${n} of ${q.length}</span><div class="prog"><i style="width:${Math.round((S.qi / q.length) * 100)}%"></i></div></div>`;
      if (it.fmt === "reveal") { const fl = PF.flow(S); return `<section>${head}<div class="card reveal">${fl ? REVEALS[it.kind](fl) : "<p>Some answers are missing, so the numbers cannot be shown yet.</p>"}</div><button class="btn" data-act="qnext">Continue</button></section>`; }
      if (S.sub && S.sub.kind === "conf") return `<section class="center">${head}<h1>How sure are you of that answer?</h1><div class="opts three"><button class="opt" data-act="conf" data-v="50">Not sure<small>50%</small></button><button class="opt" data-act="conf" data-v="75">Fairly sure<small>75%</small></button><button class="opt" data-act="conf" data-v="100">Certain<small>100%</small></button></div></section>`;
      if (S.sub && S.sub.kind === "fb") { const a = S.ans[id], ok = a.v === it.correct; return `<section class="center">${head}<div class="card fb ${ok ? "ok" : "no"}"><h2>${ok ? "Correct" : "Not quite"}</h2><p>${e(it.expl)}</p></div><button class="btn" data-act="qnext">Continue</button></section>`; }
      const text = e(it.text(c)), why = it.why ? `<details class="why"><summary>Why we ask</summary><p>${e(it.why)}</p></details>` : "";
      let body = "";
      if (it.fmt === "single") body = `<div class="opts">${optsFor(id).map((o) => `<button class="opt" data-act="pick" data-v='${e(JSON.stringify(o.v))}'>${e(o.label)}</button>`).join("")}</div>`;
      else if (it.fmt === "tf") body = `<div class="opts two"><button class="opt tf t" data-act="pick" data-v="true">TRUE</button><button class="opt tf f" data-act="pick" data-v="false">FALSE</button></div>`;
      else if (it.fmt === "pair") body = `<div class="opts two pair">${it.opts.map((o) => `<button class="opt" data-act="pick" data-v='${e(JSON.stringify(o.v))}'>${e(o.label)}</button>`).join("")}</div>`;
      else if (it.fmt === "reflex") body = `<div class="rtime"><i id="rbar" style="width:100%;transition:width ${it.seconds}s linear"></i></div><div class="opts two"><button class="opt tf t" data-act="pick" data-v="true">TRUE</button><button class="opt tf f" data-act="pick" data-v="false">FALSE</button></div><p class="small">Do not overthink. If time runs out, that hesitation is data too.</p>`;
      else if (it.fmt === "multi") { const cur = (S.cur || []); body = `<div class="opts multi">${optsFor(id).map((o) => `<button class="opt tick ${cur.includes(o.v) ? "on" : ""}" aria-pressed="${cur.includes(o.v)}" data-act="tick" data-v="${e(o.v)}"><i></i>${e(o.label)}</button>`).join("")}</div><button class="btn" data-act="mdone" ${cur.length ? "" : "disabled"}>Done</button>`; }
      else if (it.fmt === "band") body = `<div class="band"><div class="bandval" id="bandval">${bandText(it, it.def)}</div><div class="bandctl"><button class="mini2" id="bminus" aria-label="Less">−</button><input type="range" id="band" min="0" max="${it.vals.length - 1}" value="${S.ans[id] && it.vals.indexOf(S.ans[id].v) >= 0 ? it.vals.indexOf(S.ans[id].v) : it.def}" aria-label="Choose an amount"><button class="mini2" id="bplus" aria-label="More">+</button></div>${it.hint ? `<p class="small">${e(it.hint)}</p>` : ""}<button class="btn" id="bdone">Lock it in</button></div>`;
      else if (it.fmt === "matrix") { const m = S.cur || {}; const done = it.rows.every((r) => m[r[0]] && m[r[0]].who && m[r[0]].know); body = `<div class="matrix">${it.rows.map((r) => `<div class="mrow"><h3>${e(r[1])}</h3><div class="mq">Who does it?</div><div class="chips">${it.who.map((w) => `<button class="chip ${m[r[0]] && m[r[0]].who === w[0] ? "on" : ""} ${w[0] === "nobody" ? "warn" : ""}" data-act="mx" data-r="${r[0]}" data-k="who" data-v="${w[0]}">${e(w[1])}</button>`).join("")}</div><div class="mq">Do you know the time and cost?</div><div class="chips">${it.know.map((w) => `<button class="chip ${m[r[0]] && m[r[0]].know === w[0] ? "on" : ""} ${w[0] === "no" ? "warn" : ""}" data-act="mx" data-r="${r[0]}" data-k="know" data-v="${w[0]}">${e(w[1])}</button>`).join("")}</div></div>`).join("")}</div><button class="btn" data-act="mxdone" ${done ? "" : "disabled"}>Done</button>`; }
      else if (it.fmt === "ledger") return ledgerScreen(head, why);
      return `<section>${head}<h1 class="qtext">${text}</h1>${body}${why}</section>`;
    },
    story() {
      const st = unit().story;
      if (st.slot) return `<section class="center"><p class="eyebrow">A real startup story</p><div class="card slot"><h2>Story slot</h2><p>A real, sourced story goes here before launch.</p><p><b>Theme:</b> ${e(st.theme)}</p><p class="small">${e(st.why)}</p></div><button class="btn" data-act="snext">Continue</button></section>`;
      return `<section class="center"><p class="eyebrow">A real startup story</p><div class="card story"><h2>${e(st.title)}</h2>${st.body.map((p) => `<p>${e(p)}</p>`).join("")}<p class="teach"><b>What this teaches:</b> ${e(st.teaches)}</p><p class="small">Source: <a href="${e(st.source.url)}" target="_blank" rel="noopener">${e(st.source.label)}</a></p></div><button class="btn" data-act="snext">Continue</button></section>`;
    },
    mirror() {
      const un = unit(), ids = new Set(un.items), list = mirrorList();
      return `<section><p class="eyebrow">The mirror · Unit ${S.u + 1}</p><h1>${list.length ? "Your answers do not agree. Look closely." : "Mirror clear: your answers agree."}</h1>${list.map((c) => `<div class="card mir"><h3>${e(c.title)}</h3><p>${e(c.msg)}</p><p class="small">Which is closer to the truth?</p><div class="chips">${[["first", "My first answer"], ["second", "My second answer"], ["unsure", "I am not sure"]].map((o) => `<button class="chip ${S.mirror[c.id] === o[0] ? "on" : ""}" data-act="mir" data-id="${c.id}" data-v="${o[0]}">${o[1]}</button>`).join("")}</div></div>`).join("")}${list.length ? '<p class="small">"I am not sure" is a valid, honest answer.</p>' : ""}<button class="btn" data-act="mnext" ${list.every((c) => S.mirror[c.id]) ? "" : "disabled"}>${S.u + 1 < PF.UNITS.length ? "Next unit" : "See my results"}</button></section>`;
    },
    results() { return resultsScreen(); },
    rebuild() { return rebuildScreen(); },
    missionBrief() { return PF.missionUI.brief(S); },
    missionSubmit() { return PF.missionUI.submit(S); },
    verdict() { return PF.missionUI.verdict(S); },
  };

  function mirrorList() {
    const un = unit(), ids = new Set(un.items), inUnit = (c) => c.q.some((q) => ids.has(q)) && c.q.every((q) => S.ans[q]);
    return PF.checks(S).filter((c) => inUnit(c) && !S.shown.includes(c.id));
  }

  function ledgerScreen(head, why) {
    const c = PF.castle(S), n = shapeOf();
    const show = (id) => { const v = PF.val(S, id); const sf = PF.val(S, "cut"); if (v === undefined && id !== "cost") return "not answered"; if (id === "cost") return n.cut ? PF.num(sf, 0) + "% cut" : money(v); if (["price", "cac"].includes(id)) return money(v); if (id === "volume") return Number(v).toLocaleString("en-IN") + " a month"; if (id === "custFreq") return PF.freqLabel(v); if (id === "supTerms") return v < 0 ? "advance" : v + " days"; if (id === "recvDays") return v + " days"; if (id === "sellThrough") return v + "%"; return String(v); };
    return `<section>${head}<h1 class="qtext">How do you know each number in your plan?</h1><div class="ledger">${c.list.map((a) => `<div class="lrow"><div><b>${e(a.label)}</b><span>${e(show(a.id))}</span></div><div class="chips">${[["guess", "I guessed"], ["asked", "I asked a few people"], ["tested", "I have a receipt or data"]].map((o) => `<button class="chip ${a.tag === o[0] ? "on" : ""} ${o[0]}" data-act="tag" data-id="${a.id}" data-v="${o[0]}">${o[1]}</button>`).join("")}</div></div>`).join("")}</div>${castleHTML(c)}<button class="btn" data-act="ledgerdone" ${c.list.every((a) => a.tag) ? "" : "disabled"}>Done</button>${why}</section>`;
  }
  function castleHTML(c) {
    return `<div class="castle" aria-label="Castle meter"><div class="tower">${c.list.map((a) => `<div class="blk ${a.tag || "none"}"><span>${e(a.label)}</span></div>`).join("")}</div><div class="cinfo"><b>${c.pctGuess}%</b><span>of your plan floats on guesses</span><em>Solid blocks are tested. Dashed blocks float in the air.</em></div></div>`;
  }

  function resultsScreen() {
    const r = PF.reality(S), f = PF.flow(S), c = r.castle, ch = r.checks;
    const alts = PF.val(S, "alts"), nob = ch.find((x) => x.id === "o1");
    const tile = (label, value, tone, sub) => statTile(label, value, tone, sub);
    const tiles = f ? [
      tile("alternatives you found", alts === undefined ? "n/a" : alts, alts === 0 ? "amber" : ""),
      tile("chain links with no owner", nob ? nob.title.split(" ")[0] : "0", nob ? "red" : "green"),
      tile("days for your money to go round", PF.num(f.base.cycleDays, 0), f.base.cycleDays > 30 ? "red" : ""),
      tile("first estimate of money needed", money(f.peakCash), "amber"),
      tile("sales a month to break even", f.base.breakEven === Infinity ? "never" : f.base.breakEven.toLocaleString("en-IN"), f.base.breakEven > f.base.V ? "red" : "green", "plan: " + f.base.V.toLocaleString("en-IN")),
      tile("value per ₹1 spent winning a customer", f.ltvCac === null ? "n/a" : f.ltvCac === Infinity ? "n/a" : PF.num(f.ltvCac, 1) + "x", f.ltvCac !== null && f.ltvCac !== Infinity && f.ltvCac < 1 ? "red" : ""),
      tile("month-6 sales with no new customers", PF.num(f.m6 * 100, 0) + "%", f.m6 < 0.2 ? "red" : ""),
      tile("of your plan stands on guesses", c.pctGuess + "%", c.pctGuess > 50 ? "red" : "amber"),
    ].join("") : "";
    const gap = S.daydream - r.score;
    return `<section><p class="eyebrow">Step 1 result · ${e((S.profile || {}).startup || "")}</p><h1>Your daydream meets your numbers</h1>
    <div class="card gauge"><div><span>You felt your idea was</span><b>${S.daydream}/100</b><div class="gbar"><i style="width:${S.daydream}%"></i></div></div><div><span>Your answers say</span><b class="${r.score < 50 ? "neg" : ""}">${r.score}/100</b><div class="gbar real"><i style="width:${r.score}%"></i></div></div></div>
    <p class="lead2">${gap > 20 ? "A gap of <b>" + gap + " points</b>. That gap is the daydream. It is normal at this stage, and closing it is the whole program." : gap > 5 ? "A gap of <b>" + gap + " points</b>. You were a little optimistic, which is normal." : "Your feeling and your numbers are close. That is rare and good."}</p>
    <h2>Your Reality Card</h2><div class="tiles">${tiles}</div>
    ${f ? `<h2>Your money flow</h2><div class="card">${mapHTML(f)}</div>` : ""}
    <h2>The castle</h2><div class="card">${castleHTML(c)}</div>
    <h2>Where your points went</h2><div class="card"><ul class="ded">${r.items.length ? r.items.map((i) => `<li><span>${e(i.label)}</span><b>−${i.pts}</b></li>`).join("") : "<li>Nothing to deduct. Very good.</li>"}</ul></div>
    <h2>Badges</h2><div class="badges">${PF.badges(S).map((b) => `<div class="badge ${b.got ? "got" : ""}"><b>${b.got ? "★" : "☆"} ${e(b.name)}</b><span>${e(b.desc)}</span></div>`).join("")}</div>
    <button class="btn" data-act="torebuild">Rebuild your idea: what survives?</button></section>`;
  }

  const FIXES = {
    c7: ["Pick a niche the big players ignore and test it with 10 people", "Lock in 3 customers or suppliers with a written promise", "Build something that takes a rival more than a year to copy, like a community or exclusive supply"],
    c1: ["Spend 30 minutes finding 5 real alternatives and list them", "Ask 5 customers what they use today", "Rewrite your pitch as 'like X, but for Y' and see if it still excites you"],
    c2: ["Ask 5 customers what they pay for today in this area", "Check whether anyone has tried and quit", "Go back to the searches with a different set of words"],
    c8: ["Name an owner for every empty link this week", "Do one order by hand, start to finish", "Find a partner who already does the missing link"],
    o1: ["Name an owner for every empty link this week", "Do one order by hand, start to finish", "Find a partner who already does the missing link"],
    f1: ["Pick 2 channels and contact 20 people in each this week", "Ask 3 shops or partners to sell it for you", "Give 5 people a free first trial and ask for payment on the second"],
    f2: ["Spend one full day shadowing someone who does this work", "Work 7 days inside a similar business", "Ask 5 people in the field what surprised them most"],
    c3: ["Ask your supplier for 30 days credit", "Ask customers to pay in advance", "Write down who pays first and when, with real dates"],
    l1: ["Raise the price by 20% and test it with 10 customers", "Cut the cost per sale by changing what you sell", "Sell only the part of your offer that makes money"],
    l2: ["Cut fixed costs to the bare minimum for 3 months", "Raise your price", "Choose a smaller first target you can actually reach"],
    l3: ["Find a channel that costs a quarter as much", "Raise what a customer is worth with a second product or a subscription", "Measure the real cost of winning 20 customers"],
    c5: ["Run one week at full price with 10 customers and count who comes back", "Replace discounts with a reason to return", "Ask customers why they would return without a discount"],
    c6: ["Ask 10 customers how often they would really buy", "Look at how often similar businesses see repeat purchases", "Plan for the lower number and see if it still works"],
    c10: ["Track 20 real customers for 3 months", "Ask people who stopped why they stopped", "Plan with the lower number"],
    castle: ["Test your three most important guessed numbers this week", "Ask five real customers the price question", "Get one real quote for your biggest cost"],
  };
  const alias = { c7b: "c7", c1b: "c1", g1: "c1", g2: "c5" };
  function flagsToFix() {
    const r = PF.reality(S), seen = new Set(), out = [];
    r.checks.slice().sort((a, b) => b.sev - a.sev).forEach((c) => { const k = alias[c.id] || c.id; if (FIXES[k] && !seen.has(k) && out.length < 3) { seen.add(k); out.push({ id: k, title: c.title, msg: c.msg }); } });
    if (r.castle.pctGuess >= 40 && out.length < 4) out.push({ id: "castle", title: "Your plan floats on guesses", msg: r.castle.pctGuess + "% of your plan is guesswork." });
    return out;
  }
  function rebuildScreen() {
    const fl = flagsToFix(), done = fl.every((f) => S.rebuild[f.id] !== undefined);
    if (!fl.length) return `<section class="center"><h1>Nothing serious to rebuild</h1><p class="lead">Your answers agree and your numbers work on paper. Mission 1 will test them in the real world.</p><button class="btn" data-act="tomission">Go to Mission 1</button></section>`;
    return `<section><p class="eyebrow">Rebuild</p><h1>Pick one fix for each problem. Then test it this week.</h1><p class="lead">Breaking the idea is half the work. What survives is the version you can take to investors.</p>${fl.map((f) => `<div class="card rb"><h3>${e(f.title)}</h3><p class="small">${e(f.msg)}</p><div class="opts">${FIXES[f.id].map((t, i) => `<button class="opt ${S.rebuild[f.id] === i ? "on" : ""}" data-act="fix" data-id="${f.id}" data-v="${i}">${e(t)}</button>`).join("")}</div></div>`).join("")}${done ? `<div class="card v2"><h2>Your idea, version 2</h2><p><b>${e(flavourOf())}</b> for ${e((S.profile || {}).startup || "your startup")}.</p><ul>${fl.map((f) => `<li>${e(FIXES[f.id][S.rebuild[f.id]])}</li>`).join("")}</ul></div>` : ""}<button class="btn" data-act="tomission" ${done ? "" : "disabled"}>Go to Mission 1</button></section>`;
  }

  // ---------- events ----------
  document.addEventListener("input", (ev) => {
    const t = ev.target;
    if (t.id === "nm" || t.id === "st" || t.id === "c18" || t.id === "cc") { const nm = document.getElementById("nm").value.trim(), ok = nm.length >= 2 && document.getElementById("c18").checked && document.getElementById("cc").checked; const b = document.getElementById("startbtn"); if (b) b.disabled = !ok; }
    if (t.id === "dd") { S.daydream = Number(t.value); document.getElementById("ddv").textContent = t.value; }
  });
  document.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-act]"); if (!b) return; const act = b.dataset.act, d = b.dataset;
    const jv = () => { try { return JSON.parse(d.v); } catch (x) { return d.v; } };
    if (act === "home") { ev.preventDefault(); return; }
    if (act === "reload") { setTimeout(() => location.reload(), 30); return; }
    if (act === "reset") { if (confirm("Clear everything and start over?")) { PF.store.reset(); S = fresh(); render(); } return; }
    if (act === "start") { const nm = document.getElementById("nm").value.trim(), st = document.getElementById("st").value.trim(); S.profile = { name: nm, startup: st || "My idea" }; S.seed = PF.hash(nm.toLowerCase() + "|" + st.toLowerCase()); return go("daydream"); }
    if (act === "ddok") return go("flavour");
    if (act === "flavour") { const f = PF.FLAVOURS.find((x) => x.id === d.id); S.flavour = f.id; if (f.shape === "router") { S.router = {}; return go("router"); } S.shape = f.shape; return go("unitIntro"); }
    if (act === "route") { S.router[d.id] = d.v; if (Object.keys(S.router).length < 3) return go("router"); S.shape = PF.routeShape(S.router); return go("unitIntro"); }
    if (act === "unitgo") { S.pi = 0; S.qi = 0; S.cur = null; if (!S.t0) S.t0 = Date.now(); return go("prelude"); }
    if (act === "pnext") { if (S.pi + 1 < unit().prelude.length) { S.pi++; return go("prelude"); } S.qi = 0; S.cur = null; return go("q"); }
    if (act === "pick") return answer(curId(), jv());
    if (act === "tick") { const it = PF.ITEMS[curId()]; let cur = S.cur || []; const v = d.v; if (it.excl && v === it.excl) cur = cur.includes(v) ? [] : [v]; else { cur = cur.filter((x) => x !== it.excl); cur = cur.includes(v) ? cur.filter((x) => x !== v) : cur.concat(v); } S.cur = cur; return render(); }
    if (act === "mdone") { const v = S.cur || []; S.cur = null; return answer(curId(), v); }
    if (act === "mx") { const m = S.cur || {}; m[d.r] = Object.assign({}, m[d.r], { [d.k]: d.v }); S.cur = m; return render(); }
    if (act === "mxdone") { const v = S.cur; S.cur = null; return answer(curId(), v); }
    if (act === "conf") { const id = S.sub.id; S.ans[id].conf = Number(d.v); S.sub = null; return next(); }
    if (act === "qnext") { return next(); }
    if (act === "tag") { S.tags[d.id] = d.v; save(); return render(); }
    if (act === "ledgerdone") return next();
    if (act === "snext") { const ids = mirrorList(); if (!ids.length) { return advanceUnit(); } return go("mirror"); }
    if (act === "mir") { S.mirror[d.id] = d.v; save(); return render(); }
    if (act === "mnext") { mirrorList().forEach((c) => S.shown.push(c.id)); return advanceUnit(); }
    if (act === "torebuild") return go("rebuild");
    if (act === "fix") { S.rebuild[d.id] = Number(d.v); save(); return render(); }
    if (act === "tomission") return go("missionBrief");
    if (PF.missionUI && PF.missionUI.click && PF.missionUI.click(act, d, S, { go, save, render })) return;
  });
  function advanceUnit() { if (S.u + 1 < PF.UNITS.length) { S.u++; S.qi = 0; S.pi = 0; S.cur = null; return go("unitIntro"); } return go("results"); }


  // ---------- demo routes: index.html#demo=results | q:price | mirror:3 | story:2 | rebuild | mission | submit | fail | pass ----------
  function applyDemo() {
    const m = /#demo=([^&]+)/.exec(location.hash); if (!m) return;
    const raw = decodeURIComponent(m[1]), ci = raw.indexOf(":"), k = ci < 0 ? raw : raw.slice(0, ci), arg = ci < 0 ? "" : raw.slice(ci + 1); const P = PF.persona(); Object.assign(S, P);
    const unitOf = (id) => PF.UNITS.findIndex((u) => u.items.includes(id));
    if (k === "results") { S.screen = "results"; S.u = 5; }
    else if (k === "rebuild") { S.screen = "rebuild"; S.u = 5; }
    else if (k === "mission") { S.screen = "missionBrief"; S.u = 5; }
    else if (k === "submit" || k === "fail" || k === "pass") {
      S.u = 5; S.screen = "missionSubmit"; const mm = (S.mission = { issuedAt: Date.now(), witnesses: [] }); const f = (mm.f = { buy: 2000, sell: 2600, days: 20, buyers: 5, surprise: "slow", why: k === "pass" ? "time" : null, files: { buy: [{ name: "receipt1.jpg", size: 90000 }], sale: [{ name: "pay1.png", size: 40000 }, { name: "pay2.png", size: 41000 }, { name: "pay3.png", size: 42000 }] } });
      if (k !== "submit") { const rels = k === "pass" ? ["stranger", "stranger", "friend", "classmate", "stranger"] : ["stranger", "friend", "family"]; rels.forEach((rel, i) => { const t = "demo" + i + k; mm.witnesses.push({ token: t }); try { localStorage.setItem("pf-w-" + t, JSON.stringify({ answer: "yes", pay: "upi", rel, at: Date.now(), device: "sim-" + i })); } catch (x) { /* ignore */ } }); mm.verdict = PF.missionUI.evaluate(S); S.screen = "verdict"; }
    } else if (k === "q" && arg) { const u = unitOf(arg); S.u = u; S.queue = {}; S.screen = "q"; S.qi = Math.max(0, queue().indexOf(arg)); }
    else if (k === "story" || k === "mirror") { S.u = Number(arg || 1) - 1; S.screen = k; }
    else if (k === "intro") { PF.store.reset(); Object.assign(S, fresh()); }
    save();
  }

  // test helper: answer the current screen with a random valid response
  PF.ui = {
    auto(max) {
      for (let i = 0; i < (max || 400) && !["results", "rebuild", "missionBrief", "missionSubmit", "verdict"].includes(S.screen); i++) {
        const r = PF.rng(PF.hash("auto" + i + S.screen + S.qi));
        const scr = S.screen;
        if (scr === "intro") { S.profile = { name: "Test Founder", startup: "TestCo" }; S.seed = 1234; go("daydream"); }
        else if (scr === "daydream") { S.daydream = 78; go("flavour"); }
        else if (scr === "flavour") { S.flavour = S.flavour || "ecom"; S.shape = PF.FLAVOURS.find((f) => f.id === S.flavour).shape; go("unitIntro"); }
        else if (scr === "unitIntro") { S.pi = 0; S.qi = 0; go("prelude"); }
        else if (scr === "prelude") { S.qi = 0; go("q"); }
        else if (scr === "q") {
          const id = curId(), it = PF.ITEMS[id];
          if (S.sub && S.sub.kind === "conf") { S.ans[S.sub.id].conf = [50, 75, 100][Math.floor(r() * 3)]; S.sub = null; next(); }
          else if (S.sub && S.sub.kind === "fb") next();
          else if (it.fmt === "reveal") next();
          else if (it.fmt === "ledger") { PF.castle(S).list.forEach((a) => (S.tags[a.id] = ["guess", "asked", "tested"][Math.floor(r() * 3)])); next(); }
          else if (it.fmt === "band") answer(id, it.vals[Math.floor(r() * it.vals.length)]);
          else if (it.fmt === "multi") { const o = it.opts.filter((x) => x.v !== it.excl); const k = o.filter(() => r() < 0.5).map((x) => x.v); answer(id, k.length ? k : [o[0].v]); }
          else if (it.fmt === "matrix") { const m = {}; it.rows.forEach((x) => (m[x[0]] = { who: it.who[Math.floor(r() * 4)][0], know: it.know[Math.floor(r() * 3)][0] })); answer(id, m); }
          else if (it.fmt === "tf" || it.fmt === "reflex") answer(id, r() < 0.5);
          else { const o = it.opts[Math.floor(r() * it.opts.length)]; answer(id, o.v); }
        }
        else if (scr === "story") { const l = mirrorList(); if (!l.length) advanceUnit(); else go("mirror"); }
        else if (scr === "mirror") { mirrorList().forEach((c) => { S.mirror[c.id] = "unsure"; S.shown.push(c.id); }); advanceUnit(); }
      }
      return S.screen;
    },
  };
  PF.ui.render = render; PF.ui.go = go;
  applyDemo();
  render();
})();
