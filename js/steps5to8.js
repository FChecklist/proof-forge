/* Steps 5 to 8: Find the right money, Get a warm door, Reach out, Pitch to outsiders. Same engine and rules as Steps 1 to 4:
   tap answers, a mirror of contradictions, then a mission whose proof comes from OTHER people. */
(function () {
  const PF = (window.PF = window.PF || {});
  const e = PF.esc, money = PF.inr, val = PF.val, MS = PF.MS;
  const pctOf = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  const ROUTES = { grant: { l: "A grant or government programme", min: 200000, max: 5000000 }, accel: { l: "An accelerator or incubator", min: 2500000, max: 10000000 }, angel: { l: "Angel investors", min: 1000000, max: 20000000 }, vc: { l: "A venture capital fund", min: 10000000, max: 1000000000 }, loan: { l: "A bank or small-business loan", min: 100000, max: 5000000 }, own: { l: "Family, friends or my own savings", min: 0, max: 500000 } };
  PF.ROUTES = ROUTES;
  const dil = (S) => { const a = PF.s4.askAmount(S), v = val(S, "rVal"); return v && a ? Math.round((a / (v + a)) * 100) : null; };
  PF.dilution = dil;

  Object.assign(PF.ITEMS, {
    rK1: { fmt: "single", knowledge: true, correct: "grant", text: () => "Which kind of money does not have to be paid back and takes no share of your company?", opts: [{ v: "loan", label: "A loan" }, { v: "angel", label: "Angel money" }, { v: "grant", label: "A grant" }, { v: "vc", label: "Venture capital" }], expl: "A grant. A loan must be repaid with interest, and angels and venture funds buy a share of the company." },
    rK2: { fmt: "tf", knowledge: true, correct: false, text: () => "Investors back the idea. The founder matters much less.", expl: "False. Early on, investors back the founder first: can this person find the truth, sell, and keep going? That is why your proof from Steps 2 to 4 matters." },
    rK3: { fmt: "single", knowledge: true, correct: "5", text: () => "A very early startup with a prototype and a few customers is usually best placed to raise money from:", opts: [{ v: "1", label: "Large venture capital funds" }, { v: "5", label: "Grants, programmes and angels" }, { v: "3", label: "The stock market" }, { v: "4", label: "Banks, without any security" }], expl: "Grants, programmes and angels. Large funds usually write much bigger cheques and want a business with traction. Early money comes from people who bet on founders." },
    rRoute: { fmt: "single", text: () => "Which kind of money fits you best right now?", opts: Object.keys(ROUTES).map((k) => ({ v: k, label: ROUTES[k].l })), why: "Each route wants different proof and gives different things up." },
    rElig: { fmt: "multi", excl: "none", text: () => "Which of these can you honestly say today? Tick all that are true.", opts: [{ v: "entity", label: "I have a registered company or LLP" }, { v: "rev", label: "I have real revenue from strangers" }, { v: "proto", label: "I have a working prototype or service" }, { v: "team", label: "I have at least one co-founder or teammate" }, { v: "full", label: "I work on this full time" }, { v: "none", label: "None of these yet" }], why: "Most programmes screen on exactly these." },
    rGive: { fmt: "band", vals: [0, 5, 10, 15, 20, 25, 30, 40], def: 3, unit: "%", text: () => "How much of your company are you willing to give for this money?", why: "You pay for equity money with a share of your future." },
    rVal: { fmt: "band", vals: [1000000, 5000000, 10000000, 25000000, 50000000, 100000000, 250000000], def: 3, money: true, text: () => "What do you think your company is worth today?", hint: "The worth of the whole company, before the new money.", why: "The higher the number, the less of your company you give away. Investors will test it." },
    "reveal:dilution": { fmt: "reveal", kind: "dilution" },
    nNet: { fmt: "multi", excl: "none", text: () => "Who do you know who could open a door to money or to investors? Tick all.", opts: [{ v: "founder", label: "A founder or entrepreneur" }, { v: "investor", label: "An investor or someone who funds startups" }, { v: "bank", label: "A banker, CA or lawyer who knows investors" }, { v: "prof", label: "A professor or mentor with industry links" }, { v: "alumni", label: "Alumni who now run something" }, { v: "rel", label: "A relative in business" }, { v: "none", label: "Nobody yet" }], why: "Money follows trust, and trust travels through people." },
    nWarm: { fmt: "single", knowledge: true, correct: "trust", text: () => "Why does an introduction beat a cold message?", opts: [{ v: "trust", label: "The investor trusts the person who sent you" }, { v: "free", label: "It is free" }, { v: "long", label: "You can write a longer message" }, { v: "fast", label: "It is not different" }], expl: "Because someone they trust has already vouched for you. A warm intro is read, and a cold message is judged in seconds." },
    nAsk: { fmt: "single", text: () => "How will you ask someone for an introduction?", opts: [{ v: "note", label: "Send a short note they can forward as it is" }, { v: "mind", label: "Say 'keep me in mind if you hear of anything'" }, { v: "money", label: "Ask them to invest directly" }, { v: "deck", label: "Send my full deck and ask what they think" }], why: "A good ask is specific, small and easy to forward." },
    nGive: { fmt: "single", text: () => "What will you offer the person who opens the door?", opts: [{ v: "thanks", label: "Updates and thanks, whatever happens" }, { v: "nothing", label: "Nothing, they will want to help" }, { v: "equity", label: "A share of the company" }, { v: "later", label: "I will think about it later" }], why: "People who help once want to see what happened." },
    nScript: { fmt: "tf", conf: true, text: () => "I can say who I am, what I do and what I want in 30 seconds.", why: "That is the whole of a good introduction." },
    nCount: { fmt: "band", vals: [3, 5, 8, 12, 20], def: 1, unit: "people", text: () => "How many people will you ask for an introduction?", why: "Most people say yes and then do nothing. You need several." },
    oK1: { fmt: "single", knowledge: true, correct: "call", text: () => "What should your first message to an investor ask for?", opts: [{ v: "money", label: "The money" }, { v: "call", label: "A short call or a reply" }, { v: "feedback", label: "Free advice on anything" }, { v: "deck", label: "That they read your deck" }], expl: "A short call or a reply. A first message that asks for money asks for too much from a stranger." },
    oK2: { fmt: "single", knowledge: true, correct: "number", text: () => "Which opening line is strongest?", opts: [{ v: "hello", label: "Hi, hope you are well." }, { v: "number", label: "We took 14 pre-orders from strangers last month. May I send you 3 lines?" }, { v: "vision", label: "We are changing the world of retail." }, { v: "ask", label: "Please invest in us." }], expl: "The one with a real number. Proof in the first line is the only reason a stranger keeps reading." },
    oFollow: { fmt: "single", ord: true, text: () => "If nobody replies, how many times will you follow up?", opts: [{ v: 0, label: "Never" }, { v: 1, label: "Once" }, { v: 3, label: "Three times, a few days apart" }, { v: 8, label: "Every day until they answer" }], why: "Replies often come on the second or third polite message. Daily pressure ends the conversation." },
    oSend: { fmt: "band", vals: [10, 20, 30, 50, 100], def: 1, unit: "messages", text: () => "How many people will you message in the first round?", why: "Rejection and silence are normal. You need a big enough sample." },
    oExpect: { fmt: "band", vals: [2, 5, 10, 20, 30, 50, 70], def: 3, unit: "%", text: () => "What share of them do you expect to reply?", why: "Cold messages to busy people are answered far less than you hope." },
    oNo: { fmt: "single", text: () => "An investor says no. What do you do?", opts: [{ v: "ask", label: "Thank them and ask what was missing" }, { v: "argue", label: "Explain why they are wrong" }, { v: "drop", label: "Never write to them again" }, { v: "same", label: "Send the same message again next week" }], why: "A no with a reason is a free lesson, and the door stays open." },
    pK1: { fmt: "single", knowledge: true, correct: "problem", text: () => "In a pitch, what comes first?", opts: [{ v: "team", label: "The team's degrees" }, { v: "problem", label: "A real problem and who has it" }, { v: "price", label: "The price list" }, { v: "ask", label: "The ask" }], expl: "A real problem and who has it. If the listener does not feel the problem, nothing after it matters." },
    pWho: { fmt: "single", text: () => "In one tap, who pays you?", opts: [{ v: "users", label: "The people who use it" }, { v: "parents", label: "Parents or family of the user" }, { v: "business", label: "A business or an institution" }, { v: "ads", label: "Advertisers" }, { v: "other", label: "Someone else" }], why: "If you cannot answer this in a second, the listener cannot either." },
    pBE: { fmt: "band", vals: [3, 6, 9, 12, 18, 24, 36], def: 3, unit: "months", text: () => "From memory: in which month does your business break even?", why: "An investor will ask. If your answer changes between questions, they will stop believing the rest." },
    pAsk: { fmt: "single", text: () => "From memory: how much are you asking for?", optsFn: (S) => { const a = PF.s4.askAmount(S), o = [a, Math.round(a * 0.6 / 1000) * 1000, Math.round(a * 1.5 / 1000) * 1000, Math.round(a * 2.5 / 1000) * 1000].filter((x, i, l) => l.indexOf(x) === i); return o.sort((x, y) => x - y).map((x) => ({ v: x, label: money(x) })); }, ord: true, why: "You must know your own number without looking." },
    pHard: { fmt: "single", knowledge: true, correct: "own", text: () => "An investor says: 'A big company will copy you.' What is the strongest answer?", opts: [{ v: "no", label: "They never will." }, { v: "own", label: "They might. Here is what we have that is hard to copy: our customers, our data and our speed." }, { v: "legal", label: "We will sue them." }, { v: "angry", label: "That is a negative way to think." }], expl: "Agree it is possible, then name what is hard to copy. Denial sounds naive, and anger ends the meeting." },
    pEnd: { fmt: "tf", conf: true, text: () => "I can answer 'What do you need from us?' in one clear sentence.", why: "Every pitch must end with a specific ask." },
  });

  PF.s5 = { tags: (S) => {} };
  PF.s6 = {
    conn(S) {
      const m = MS(S, 6), dev = PF.deviceId(), all = (m.witnesses || []).map((w) => PF.readW(w.token)).filter((r) => r && r.k === "connector"), ok = all.filter((r) => m.allowSame || r.device !== dev);
      return { n: ok.length, willing: ok.filter((r) => r.willing === "yes").length, knows: ok.filter((r) => r.know === "well").length, fwd: ok.filter((r) => r.fwd === "yes").length, nonFam: ok.filter((r) => r.rel !== "family").length };
    },
  };
  PF.s7 = {
    stats(S) {
      const m = MS(S, 7), dev = PF.deviceId(), all = (m.witnesses || []).map((w) => PF.readW(w.token)).filter((r) => r && r.k === "msg"), ok = all.filter((r) => m.allowSame || r.device !== dev), n = ok.length;
      const avg = (f) => (n ? ok.reduce((a, r) => a + Number(r[f] || 0), 0) / n : 0);
      return { n, clear: avg("clear"), want: avg("want"), reply: pctOf(ok.filter((r) => r.reply === "yes").length, n), sent: m.sent || 0, replies: m.replies || 0, meetings: m.meetings || 0, rate: m.sent ? Math.round(((m.replies || 0) / m.sent) * 100) : null };
    },
  };
  PF.s8 = {
    stats(S) {
      const m = MS(S, 8), dev = PF.deviceId(), all = (m.witnesses || []).map((w) => PF.readW(w.token)).filter((r) => r && r.k === "pitch"), ok = all.filter((r) => m.allowSame || r.device !== dev), n = ok.length;
      const avg = (f) => (n ? ok.reduce((a, r) => a + Number(r[f] || 0), 0) / n : 0), doubts = {};
      ok.forEach((r) => { if (r.doubt) doubts[r.doubt] = (doubts[r.doubt] || 0) + 1; });
      return { n, strangers: ok.filter((r) => r.rel === "stranger").length, clear: avg("clear"), believe: avg("believe"), meet: pctOf(ok.filter((r) => r.meet === "yes").length, n), who: pctOf(ok.filter((r) => r.who === "yes").length, n), doubts };
    },
  };

  const U5 = [
    { id: 1, title: "The routes to money", finds: "What each kind of money wants and gives up.", items: ["rK1", "rK2", "rK3"], prelude: [{ h: "There is more than one kind of money", p: "Grants, loans, angels, programmes and venture funds each want something different. The wrong route wastes months." }, { h: "Founder first", p: "At this stage people fund you, not only the idea. Your proof from Steps 2 to 4 is your evidence." }, { h: "Size matters", p: "A cheque of ₹10 lakh and one of ₹10 crore come from different people." }], story: { slot: true, theme: "A startup that chased the wrong kind of investor for a year", why: "Shows why matching the route to the stage matters." } },
    { id: 2, title: "Your best fit", finds: "Which route fits your stage, your ask and your proof.", items: ["rRoute", "rElig", "rGive", "rVal", "reveal:dilution"], prelude: [{ h: "Match the route to you", p: "You will choose a route, say what you can honestly claim, and say what you would give up." }, { h: "Equity has a price", p: "Every rupee of equity money costs a share of your future. We will show your price." }, { h: "Then go and check", p: "In Mission 5 you will find 8 real programmes or investors and check whether they really fit you." }], story: { slot: true, theme: "A founder who gave away too much too early", why: "Shows dilution in real life." } },
  ];
  const U6 = [
    { id: 1, title: "Who do you know?", finds: "Which doors you can open, and how you will ask.", items: ["nNet", "nWarm", "nAsk", "nGive", "nScript", "nCount"], prelude: [{ h: "Money follows trust", p: "Most startup money comes through someone who knows someone. An introduction is your strongest tool." }, { h: "Make it easy to say yes", p: "A short, specific note that someone can forward as it is gets forwarded. A long, vague one does not." }, { h: "Then ask real people", p: "In Mission 6 five people tell us, in their own taps, whether they would open a door for you." }], story: { slot: true, theme: "A founder who got a first cheque through a friend of a friend", why: "Shows how introductions work." } },
  ];
  const U7 = [
    { id: 1, title: "The first message", finds: "How a stranger will read your first line.", items: ["oK1", "oK2", "oNo"], prelude: [{ h: "Busy people read in seconds", p: "An investor decides in three lines whether to keep reading. Put proof in the first one." }, { h: "Ask for something small", p: "Ask for a short call or a reply. Never ask a stranger for money in the first message." }, { h: "A no is a lesson", p: "Ask what was missing. The door stays open." }], story: { slot: true, theme: "A cold message that got a reply and why", why: "Shows what a strong first message does." } },
    { id: 2, title: "Your numbers for the round", finds: "What you expect, and what you will measure.", items: ["oSend", "oExpect", "oFollow"], prelude: [{ h: "You will measure it", p: "In Mission 7 you send real messages and count replies. We compare your guess with the real result." }, { h: "Follow up politely", p: "Many replies come on the second or third message. Daily pressure ends the conversation." }, { h: "Silence is normal", p: "Most messages are never answered. A low reply rate is not a failure. Not measuring is." }], story: { slot: true, theme: "A founder who sent 100 messages and learned from the 6 replies", why: "Shows how to read low reply rates." } },
  ];
  const U8 = [
    { id: 1, title: "Know your own story", finds: "Whether you can say your numbers without looking.", items: ["pK1", "pWho", "pBE", "pAsk", "pEnd"], prelude: [{ h: "Your numbers, from memory", p: "An investor will ask your break-even month and your ask. If you hesitate, they stop trusting the rest." }, { h: "One clear story", p: "Problem, who pays, proof, ask. In that order." }, { h: "We will compare with your real work", p: "Your answers are checked against your own numbers from earlier steps." }], story: { slot: true, theme: "A founder who lost an investor by changing a number mid-meeting", why: "Shows why consistency counts." } },
    { id: 2, title: "The hard question", finds: "How you answer an investor who doubts you.", items: ["pHard"], prelude: [{ h: "Every pitch has a hard question", p: "'A big company will copy you.' 'Why you?' 'What if customers leave?'" }, { h: "Agree, then answer", p: "Admit what is true, then show what you have that is hard to copy." }, { h: "Then pitch to outsiders", p: "In Mission 8 five people who are not your friends hear your pitch and rate it." }], story: { slot: true, theme: "A founder who turned a doubt into a deal", why: "Shows how to answer a doubt." } },
  ];
  const T = { 5: "a", 6: "b", 7: "c", 8: "d" };
  PF.STEPS.push({ id: 5, name: "Find the right money", units: U5, theme: T[5] }, { id: 6, name: "Get a warm door", units: U6, theme: T[6] }, { id: 7, name: "Reach out", units: U7, theme: T[7] }, { id: 8, name: "Pitch to outsiders", units: U8, theme: T[8] });
  PF.setStep = (n) => { PF.UNITS = PF.STEPS[Math.max(1, Math.min(PF.STEPS.length, n)) - 1].units; };
  PF.lastStep = 8;

  PF.extraChecks.push((S, add, v, has) => {
    const ask = PF.s4.askAmount(S), r = ROUTES[v("rRoute")];
    if (r && ask && (ask > r.max * 1.5 || ask < r.min * 0.4)) add("s5a", 2, "Your ask does not fit that route", "You chose " + r.l.toLowerCase() + ", which usually gives " + money(r.min) + " to " + money(r.max) + ". Your ask is " + money(ask) + ".", ["rRoute"]);
    const el = v("rElig") || [];
    if (["vc", "angel", "accel"].includes(v("rRoute")) && !el.includes("entity") && has("rElig")) add("s5b", 1, "No company yet", "Equity investors need a company to invest in. You do not have one registered.", ["rRoute", "rElig"]);
    const d = dil(S);
    if (d !== null && has("rGive") && v("rGive") < d) add("s5c", 2, "You will give more than you said", "To raise " + money(ask) + " at that value you give about " + d + "% of the company, but you said you would give " + v("rGive") + "%.", ["rGive", "rVal"]);
    if (v("rK2") === false || v("rVal") >= 100000000 && !(el.includes("rev"))) { if (v("rVal") >= 100000000 && !el.includes("rev") && has("rElig")) add("s5d", 2, "A big valuation with no revenue", "You value the company at " + money(v("rVal")) + " but you have no revenue from strangers.", ["rVal", "rElig"]); }
    if (has("nNet") && (v("nNet") || []).includes("none") && v("nCount") >= 8) add("s6a", 2, "You plan many asks and know nobody", "You plan to ask " + v("nCount") + " people, but you listed nobody who can open a door.", ["nNet", "nCount"]);
    if (["mind", "money", "deck"].includes(v("nAsk"))) add("s6b", 1, "A hard ask to forward", "That kind of ask is hard to say yes to. A short note that can be forwarded as it is works best.", ["nAsk"]);
    if (v("nGive") === "equity" || v("nGive") === "nothing") add("s6c", 1, "Nothing real offered back", "Offering equity for a favour, or nothing, will not build a lasting helper.", ["nGive"]);
    if (v("nScript") === false) add("s6d", 1, "No 30-second line yet", "You cannot yet say who you are, what you do and what you want in 30 seconds.", ["nScript"]);
    if (v("oExpect") >= 50) add("s7a", 2, "You expect most to reply", "Cold messages to busy people rarely get half of them to reply.", ["oExpect"]);
    if (["argue", "drop"].includes(v("oNo"))) add("s7b", 1, "A no ends the conversation", "Arguing or giving up wastes the lesson in a no.", ["oNo"]);
    if (v("oFollow") === 0 || v("oFollow") === 8) add("s7c", 1, "Follow-up that will not work", "Never following up, or following up every day, both lose replies.", ["oFollow"]);
    if (v("pWho") && v("whoPays") && ((v("whoPays") === "users") !== (v("pWho") === "users") || (v("whoPays") !== "users" && v("pWho") !== v("whoPays")))) add("s8a", 2, "You told a different story about who pays", "In Step 1 you said " + v("whoPays") + " pays. Now you said " + v("pWho") + ".", ["pWho", "whoPays"]);
    const be = PF.s4.breakeven(S);
    if (be && !be.never && has("pBE") && Math.abs(be.months - v("pBE")) > 6) add("s8b", 2, "You do not remember your own break-even", "Your numbers say month " + be.months + ". You said month " + v("pBE") + ".", ["pBE"]);
    if (has("pAsk") && v("pAsk") !== ask) add("s8c", 2, "You do not remember your own ask", "Your ask is " + money(ask) + ". You picked " + money(v("pAsk")) + ".", ["pAsk"]);
    if (v("pEnd") === false) add("s8d", 1, "No clear ask at the end", "You cannot yet say what you need in one sentence.", ["pEnd"]);
  });

  const old = PF.demoFill;
  PF.demoFill = (S, step) => {
    old(S, step); const A = (x, c) => ({ v: x, t: 1, ...(c ? { conf: c } : {}) });
    Object.assign(S.ans, { rK1: A("grant"), rK2: A(false), rK3: A("5"), rRoute: A("angel"), rElig: A(["entity", "rev", "proto"]), rGive: A(15), rVal: A(25000000), nNet: A(["founder", "prof"]), nWarm: A("trust"), nAsk: A("note"), nGive: A("thanks"), nScript: A(true, 75), nCount: A(8), oK1: A("call"), oK2: A("number"), oNo: A("ask"), oSend: A(30), oExpect: A(10), oFollow: A(3), pK1: A("problem"), pWho: A("users"), pBE: A(12), pAsk: A(PF.s4.askAmount(S)), pEnd: A(true, 75), pHard: A("own") });
  };

  // ---------- reveal ----------
  PF.REVEALS_EXTRA.dilution = (S) => {
    const a = PF.s4.askAmount(S), v = val(S, "rVal"), d = dil(S), say = val(S, "rGive"); if (!v) return "<p>Answer the worth first.</p>";
    return `<h2>What the money costs in shares</h2><div class="tiles"><div class="tile"><b>${money(a)}</b><span>your ask</span></div><div class="tile"><b>${money(v)}</b><span>what you say the company is worth</span></div><div class="tile ${d > say ? "red" : "green"}"><b>${d}%</b><span>of your company you give away</span><em>you said ${say}%</em></div></div><p class="note">${d > say ? "You will give more than you said. Every investor does this sum in seconds." : "That matches what you said. An investor will test the worth, and your proof is what defends it."}</p>`;
  };

  // ---------- missions ----------
  const validUrl = (u) => { try { const x = new URL(String(u).trim()); return /^https?:$/.test(x.protocol) && x.hostname.includes("."); } catch (er) { return false; } };
  const base = () => location.href.replace(/index\.html.*$/, "").replace(/#.*$/, "").replace(/\?.*$/, "");
  const prof = (S) => S.profile || {};
  const wl = (S, kind, t) => base() + "witness.html?k=" + kind + "&t=" + t + "&n=" + encodeURIComponent(prof(S).name || "") + "&u=" + encodeURIComponent(prof(S).startup || "") + "&p=" + (val(S, "price") || 0) + "&pr=" + encodeURIComponent(PF.problemSentence(S) || "");
  const tok = () => "w" + Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => (b % 36).toString(36)).join("");
  const chipRow = (list, cur, act, key) => `<div class="chips">${list.map((x) => `<button class="chip ${String(cur) === String(x[0]) ? "on" : ""}" data-act="${act}" data-k="${key}" data-v="${x[0]}">${e(x[1])}</button>`).join("")}</div>`;
  const tile = (label, value, tone) => `<div class="tile ${tone || ""}"><b>${value}</b><span>${e(label)}</span></div>`;
  const rows = (S, m, kind, label) => (m.witnesses || []).map((w, i) => { const r = PF.readW(w.token), same = r && r.device === PF.deviceId() && !m.allowSame; const st = !r ? "Waiting" : same ? "Same device: does not count" : "Answered"; return `<div class="wrow ${!r ? "wait" : st === "Answered" ? "ok" : "bad"}"><span>${label} ${i + 1}</span><b>${st}</b><div class="chips"><button class="chip" data-act="wcopy" data-link="${e(wl(S, kind, w.token))}">Copy link</button><a class="chip" target="_blank" rel="noopener" href="${e(wl(S, kind, w.token))}">Open (demo)</a></div></div>`; }).join("");
  const sameBox = (m) => `<label class="chk inline"><input type="checkbox" id="msame" ${m.allowSame ? "checked" : ""}> Demo: accept answers from this device</label>`;
  const verdictShell = (S, n, v, extra, nextTxt) => v.ok
    ? `<section class="center"><p class="eyebrow">Mission ${n} · checked</p><h1>Proof accepted</h1><div class="card cele"><div class="cele-ico">🏆</div><div><h3>${nextTxt ? "Gate to Step " + (n + 1) + ": OPEN" : "Mission " + n + " passed"}</h3><p class="small">${PF.game.g(S).xp} XP in total</p></div></div><div class="card ok"><h2>What passed</h2><ul class="ded">${v.pass.map((p) => `<li><span>✓ ${e(p)}</span></li>`).join("")}</ul></div>${extra}${nextTxt ? `<button class="btn" data-act="nextstep">${nextTxt}</button> ` : '<p class="note">Steps 9 to 12 are the next part of the journey.</p>'}<button class="btn ghost" data-act="mreview">Edit my proof</button></section>`
    : `<section><p class="eyebrow">Mission ${n} · checked</p><h1>Not accepted yet</h1><div class="card no"><h2>${nextTxt ? "Gate to Step " + (n + 1) + ": LOCKED" : "Mission " + n + ": not passed"}</h2><ul class="fails">${v.fails.map((x) => `<li><b>${e(x.t)}</b><span>Next step: ${e(x.fix)}</span></li>`).join("")}</ul></div>${extra}<button class="btn" data-act="mreview">Fix and resubmit</button></section>`;
  const bindInputs = () => { const S = PF.getState(); document.querySelectorAll("[data-p]").forEach((el) => { el.onchange = () => { const m = MS(S, S.step); const row = (m.prog = m.prog || [])[Number(el.dataset.i)] || ((m.prog[Number(el.dataset.i)] = {})); row[el.dataset.f] = el.dataset.f === "min" || el.dataset.f === "max" ? Number(el.value) : el.value; PF.store.save(S); }; });
    const same = document.getElementById("msame"); if (same) same.onchange = () => { MS(S, S.step).allowSame = same.checked; PF.store.save(S); PF.ui.render(); };
    const f = document.getElementById("pf-shots"); if (f) f.onchange = () => { const m = MS(S, S.step); m.files = (m.files || []).concat(Array.from(f.files).map((x) => ({ name: x.name, size: x.size }))); PF.store.save(S); PF.ui.render(); }; };
  const shotsCard = (m, t) => `<div class="card"><h2>Proof</h2><p class="small">${t}</p><input type="file" id="pf-shots" accept="image/*,application/pdf" multiple><ul class="flist">${(m.files || []).map((x) => `<li>${e(x.name)} <em>${Math.round(x.size / 1024)} KB</em></li>`).join("")}</ul></div>`;
  const fakeW = (m, obj, i) => { const t = "sim" + Math.random().toString(36).slice(2, 8); (m.witnesses = m.witnesses || []).push({ token: t }); localStorage.setItem("pf-w-" + t, JSON.stringify(Object.assign({ device: "sim-" + i, at: Date.now() }, obj))); };

  // Mission 5: eight real programmes
  const ELIG = [["yes", "I fit"], ["maybe", "Maybe"], ["no", "I do not fit"]];
  const rowsP = (m) => { m.prog = m.prog || []; while (m.prog.length < 8) m.prog.push({}); return m.prog; };
  const M5 = {
    evaluate(S) {
      const m = MS(S, 5), ask = PF.s4.askAmount(S), fails = [], pass = [], p = rowsP(m);
      const ck = (ok, o, f, fix) => (ok ? pass.push(o) : fails.push({ t: f, fix }));
      const valid = p.filter((x) => x.name && x.name.trim().length > 1 && validUrl(x.url) && x.max >= x.min && x.max > 0), hosts = new Set(valid.map((x) => new URL(x.url.trim()).hostname.replace(/^www\./, "")));
      ck(valid.length >= 8 && hosts.size >= 5, valid.length + " real programmes or investors, on " + hosts.size + " sites", "Only " + valid.length + " complete rows, on " + hosts.size + " site(s). You need 8 on at least 5 different sites.", "Give each a name, a working link, and the smallest and largest cheque they give.");
      const fit = valid.filter((x) => x.min <= ask * 1.5 && x.max >= ask / 1.5); ck(fit.length >= 3, fit.length + " that give cheques near your ask", "Only " + fit.length + " give cheques near your ask of " + money(ask) + ". You need 3.", "Find programmes whose cheque range includes your ask, or change your ask.");
      const yes = valid.filter((x) => x.elig === "yes"); ck(yes.length >= 2, yes.length + " you honestly fit", "You say you fit only " + yes.length + ". You need 2.", "Read each programme's rules and mark honestly. If none fit, change the route.");
      ck(valid.every((x) => x.elig), "Every row has an honest fit mark", "Some rows have no fit mark.", "Mark each row: I fit, Maybe, or I do not fit.");
      ck(!!m.route, "You chose your first target", "You have not chosen your first target.", "Pick which route you will try first.");
      return { ok: fails.length === 0, fails, pass, fit: fit.length };
    },
    brief(S) { return `<section><p class="eyebrow">Mission 5</p><h1>Find eight real doors</h1><p class="lead">Name eight real programmes, grants or investors, with a working link, the cheques they give, and whether you honestly fit. Step 6 opens only when at least 3 give cheques near your ask and you fit at least 2.</p><div class="card"><h2>What the checker needs</h2><ul class="ded"><li><span>Real programmes, on different sites</span><b>8 on 5 sites</b></li><li><span>Cheques near your ask of ${money(PF.s4.askAmount(S))}</span><b>3 or more</b></li><li><span>That you honestly fit</span><b>2 or more</b></li><li><span>Your first target</span><b>chosen</b></li></ul></div><button class="btn" data-act="mstart">I accept the mission</button></section>`; },
    submit(S) {
      const m = MS(S, 5), p = rowsP(m);
      return `<section><p class="eyebrow">Mission 5 · eight doors</p><h1>List them</h1><div class="card">${p.map((x, i) => `<div class="qrow"><input class="alt-in" data-p="1" data-i="${i}" data-f="name" placeholder="Programme or investor ${i + 1}" value="${e(x.name || "")}"><input class="alt-in" type="url" data-p="1" data-i="${i}" data-f="url" placeholder="https://..." value="${e(x.url || "")}"><input class="alt-in" type="number" data-p="1" data-i="${i}" data-f="min" placeholder="Smallest cheque in rupees" value="${x.min || ""}"><input class="alt-in" type="number" data-p="1" data-i="${i}" data-f="max" placeholder="Largest cheque in rupees" value="${x.max || ""}">${chipRow(ELIG, x.elig, "pelig", i + "|f")}</div>`).join("")}<div class="chips"><button class="chip" data-act="mdemo">Demo: fill 8 sample rows</button></div></div><div class="card"><h2>Your first target</h2>${chipRow(Object.keys(ROUTES).map((k) => [k, ROUTES[k].l]), m.route, "mset", "route")}</div><button class="btn" data-act="msubmit">Submit for checking</button></section>`;
    },
    verdict(S) { const m = MS(S, 5); return verdictShell(S, 5, m.verdict, "", "Begin Step 6"); },
    click(act, d, S, h) { const m = MS(S, 5); if (act === "pelig") { const i = Number(d.k.split("|")[0]); rowsP(m)[i].elig = d.v; h.save(); h.render(); return true; }
      if (act === "mdemo") { const a = PF.s4.askAmount(S), hs = ["startupindia.gov.in", "nasscom.in", "ah.vc", "sidbi.in", "indianangelnetwork.com", "ycombinator.com", "ivycap.com", "birac.nic.in"]; m.prog = hs.map((h2, i) => ({ name: "Programme " + (i + 1), url: "https://www." + h2 + "/apply", min: Math.round(a * 0.5), max: Math.round(a * 2), elig: i < 3 ? "yes" : "maybe" })); m.route = "angel"; h.save(); h.render(); return true; } return false; },
    award(S, v, G) { G.award(S, "m5:attempt", 10, "Submitted the eight doors"); if (v.fit >= 3) G.award(S, "m5:fit", 50, "Doors that fit your ask"); if (v.ok) { G.award(S, "m5:pass", 150, "Gate to Step 6 opened"); G.celebrate(S, "Gate to Step 6 is OPEN", "You found real doors", 150); } },
    after: bindInputs,
  };

  // Mission 6: five connectors
  const M6 = {
    evaluate(S) { const c = PF.s6.conn(S), fails = [], pass = [], ck = (ok, o, f, fix) => (ok ? pass.push(o) : fails.push({ t: f, fix }));
      ck(c.n >= 5, c.n + " people answered", "Only " + c.n + " answered. You need 5.", "Send the link to more people who might open a door.");
      ck(c.willing >= 3, c.willing + " would open a door", "Only " + c.willing + " said they would open a door. You need 3.", "Ask people who know investors, founders or mentors.");
      ck(c.fwd >= 2, c.fwd + " would forward your note", "Only " + c.fwd + " would forward a short note from you. You need 2.", "Write a note someone can forward as it is, and ask again.");
      ck(c.nonFam >= 3, c.nonFam + " are not family", "Only " + c.nonFam + " are not family. You need 3.", "Ask mentors, professors, alumni or founders.");
      return { ok: fails.length === 0, fails, pass, c }; },
    brief(S) { return `<section><p class="eyebrow">Mission 6</p><h1>Find who will open a door</h1><p class="lead">Send five people your short note and a link. In 30 seconds each tells us, in taps, whether they know someone who could help and whether they would forward your note. Step 7 opens when enough of them say yes.</p><div class="card"><h2>What the checker needs</h2><ul class="ded"><li><span>People who answered</span><b>5</b></li><li><span>Would open a door</span><b>3</b></li><li><span>Would forward your note</span><b>2</b></li><li><span>Not family</span><b>3</b></li></ul></div><button class="btn" data-act="mstart">I accept the mission</button></section>`; },
    submit(S) { const m = MS(S, 6), c = PF.s6.conn(S); return `<section><p class="eyebrow">Mission 6 · doors</p><h1>Ask five people</h1><div class="card"><div id="wlist">${rows(S, m, "connector", "Person") || '<p class="small">No links yet.</p>'}</div><div class="chips"><button class="btn small" data-act="madd">Add a link</button><button class="chip" data-act="mdemo">Demo: simulate 6 people</button>${sameBox(m)}</div></div><div class="card"><h2>So far</h2><div class="tiles">${tile("answered", c.n)}${tile("would open a door", c.willing)}${tile("would forward your note", c.fwd)}</div></div><button class="btn" data-act="msubmit">Submit for checking</button></section>`; },
    verdict(S) { const m = MS(S, 6); return verdictShell(S, 6, m.verdict, "", "Begin Step 7"); },
    click(act, d, S, h) { const m = MS(S, 6); if (act === "mdemo") { [["mentor", "well", "yes", "yes"], ["alumni", "slightly", "yes", "yes"], ["friend", "well", "maybe", "no"], ["family", "slightly", "no", "no"], ["stranger", "well", "yes", "yes"], ["classmate", "slightly", "yes", "no"]].forEach((x, i) => fakeW(m, { k: "connector", rel: x[0], know: x[1], willing: x[2], fwd: x[3] }, i)); h.save(); h.render(); return true; } return false; },
    award(S, v, G) { G.award(S, "m6:attempt", 10, "Asked for introductions"); for (let i = 0; i < Math.min(5, v.c.n); i++) G.award(S, "m6:c:" + i, 15, "A real answer"); if (v.ok) { G.award(S, "m6:pass", 150, "Gate to Step 7 opened"); G.celebrate(S, "Gate to Step 7 is OPEN", "Doors that open", 150); } },
    after: bindInputs,
  };

  // Mission 7: real outreach
  const NUMS = [0, 1, 2, 3, 5, 8, 10, 15, 20, 30, 50];
  const M7 = {
    evaluate(S) { const s = PF.s7.stats(S), m = MS(S, 7), fails = [], pass = [], ck = (ok, o, f, fix) => (ok ? pass.push(o) : fails.push({ t: f, fix }));
      ck(s.sent >= 20, s.sent + " messages sent", "You reported " + s.sent + " messages. You need 20.", "Send real messages to 20 different people who could fund or help.");
      ck(s.replies <= s.sent, "Replies do not exceed messages", "You report more replies than messages.", "Correct the numbers.");
      const need = Math.min(5, s.replies); ck((m.files || []).length >= Math.max(3, need), (m.files || []).length + " proof screenshots", "Only " + (m.files || []).length + " screenshots. You need at least " + Math.max(3, need) + ".", "Attach screenshots of your messages and every reply.");
      ck(s.n >= 3, s.n + " outsiders rated your message", "Only " + s.n + " outsiders rated your message. You need 3.", "Show your message to 3 people who are not friends and send each the rating link.");
      ck(s.n === 0 || (s.clear >= 3 && s.want >= 3), "Your message is clear and the ask is clear", "Raters scored clarity " + s.clear.toFixed(1) + " and the ask " + s.want.toFixed(1) + " out of 4. You need 3 in both.", "Rewrite the message: proof in the first line and one small ask.");
      return { ok: fails.length === 0, fails, pass, s }; },
    brief(S) { return `<section><p class="eyebrow">Mission 7</p><h1>Send real messages and count</h1><p class="lead">Message at least 20 real people, with a short note that has proof in the first line. Report what happened, show your message to three outsiders for a rating, and attach screenshots. Step 8 opens when the proof is in.</p><div class="card"><h2>What the checker needs</h2><ul class="ded"><li><span>Messages sent</span><b>20 or more</b></li><li><span>Screenshots of messages and replies</span><b>3 or more</b></li><li><span>Outsiders who rate the message</span><b>3, scoring 3 of 4</b></li></ul></div><p class="small">You expected ${val(S, "oExpect") || "?"}% to reply. We will compare.</p><button class="btn" data-act="mstart">I accept the mission</button></section>`; },
    submit(S) { const m = MS(S, 7), s = PF.s7.stats(S); return `<section><p class="eyebrow">Mission 7 · outreach</p><h1>Report what happened</h1><div class="card"><h2>The numbers</h2><label class="lab">Messages sent</label>${chipRow(NUMS.concat([75, 100]).map((x) => [x, x]), m.sent, "mset7", "sent")}<label class="lab">Replies received</label>${chipRow(NUMS.map((x) => [x, x]), m.replies, "mset7", "replies")}<label class="lab">Calls or meetings agreed</label>${chipRow(NUMS.map((x) => [x, x]), m.meetings, "mset7", "meetings")}</div>${shotsCard(m, "Screenshots of the messages you sent and every reply.")}<div class="card"><h2>Ratings of your message</h2><div id="wlist">${rows(S, m, "msg", "Rater") || '<p class="small">No links yet.</p>'}</div><div class="chips"><button class="btn small" data-act="madd">Add a rating link</button><button class="chip" data-act="mdemo">Demo: sample numbers and 4 raters</button>${sameBox(m)}</div></div><button class="btn" data-act="msubmit">Submit for checking</button></section>`; },
    verdict(S) { const m = MS(S, 7), s = m.verdict && m.verdict.s, exp = val(S, "oExpect"); const extra = s && s.rate !== null ? `<div class="card"><h2>Expectation against reality</h2><div class="tiles">${tile("you expected", exp + "%")}${tile("really replied", s.rate + "%", s.rate < exp ? "red" : "green")}${tile("meetings agreed", s.meetings)}</div><p class="note">${s.rate < exp / 2 ? "Far fewer replied than you expected. That is normal for cold messages, and it is why you measure." : "Close to what you expected."}</p></div>` : ""; return verdictShell(S, 7, m.verdict, extra, "Begin Step 8"); },
    click(act, d, S, h) { const m = MS(S, 7); if (act === "mset7") { m[d.k] = Number(d.v); h.save(); h.render(); return true; }
      if (act === "mdemo") { m.sent = 30; m.replies = 5; m.meetings = 2; m.files = [{ name: "m1.png", size: 1 }, { name: "m2.png", size: 1 }, { name: "m3.png", size: 1 }, { name: "m4.png", size: 1 }, { name: "m5.png", size: 1 }]; [[4, 4, "yes"], [3, 3, "maybe"], [4, 3, "yes"], [3, 4, "no"]].forEach((x, i) => fakeW(m, { k: "msg", clear: x[0], want: x[1], reply: x[2] }, i)); h.save(); h.render(); return true; } return false; },
    award(S, v, G) { G.award(S, "m7:attempt", 10, "Reported your outreach"); if (v.s.sent >= 20) G.award(S, "m7:sent", 50, "20 real messages sent"); if (v.s.replies > 0) G.award(S, "m7:rep", 30, "Real replies"); if (v.s.meetings > 0) G.award(S, "m7:meet", 60, "A meeting agreed"); if (v.ok) { G.award(S, "m7:pass", 150, "Gate to Step 8 opened"); G.celebrate(S, "Gate to Step 8 is OPEN", "You reached out", 150); } },
    after: bindInputs,
  };

  // Mission 8: pitch to five outsiders
  const DOUBT = { price: "The price", market: "The market is too small", trust: "I do not trust the team", copy: "It can be copied", unclear: "I did not understand it", other: "Something else" };
  const M8 = {
    evaluate(S) { const s = PF.s8.stats(S), m = MS(S, 8), fails = [], pass = [], ck = (ok, o, f, fix) => (ok ? pass.push(o) : fails.push({ t: f, fix }));
      ck(s.n >= 5, s.n + " outsiders rated your pitch", "Only " + s.n + " outsiders rated you. You need 5.", "Pitch to more people who are not your friends and send each the rating link.");
      ck(s.strangers >= 3, s.strangers + " strangers", "Only " + s.strangers + " strangers. You need 3.", "Pitch to people you did not know before.");
      ck(s.n === 0 || s.who >= 60, s.who + "% could say who pays", "Only " + s.who + "% could say who pays. You need 60%.", "Your pitch does not say clearly who pays. Say it in the first minute.");
      ck(s.n === 0 || (s.clear >= 3 && s.believe >= 2.5), "Clear and believable enough", "Clarity " + s.clear.toFixed(1) + " and belief " + s.believe.toFixed(1) + " out of 4. You need 3 and 2.5.", "Cut the pitch to problem, who pays, proof, ask.");
      ck(!!m.fix, "You chose the doubt you will fix", "You have not said which doubt you will fix first.", "Pick the doubt you heard most, and decide to fix it.");
      return { ok: fails.length === 0, fails, pass, s }; },
    brief(S) { return `<section><p class="eyebrow">Mission 8</p><h1>Pitch to five people who owe you nothing</h1><p class="lead">Give your pitch, in five minutes, to five people who are not your friends. Each opens a link afterwards and rates it in taps. This is the closest test to a real investor meeting.</p><div class="card"><h2>What the checker needs</h2><ul class="ded"><li><span>Outsiders who rate you</span><b>5, with 3 strangers</b></li><li><span>Who could say who pays</span><b>60% or more</b></li><li><span>Clarity and belief</span><b>3 and 2.5 out of 4</b></li><li><span>The doubt you will fix</span><b>chosen</b></li></ul></div><button class="btn" data-act="mstart">I accept the mission</button></section>`; },
    submit(S) { const m = MS(S, 8), s = PF.s8.stats(S); const top = Object.entries(s.doubts).sort((a, b) => b[1] - a[1]).slice(0, 4); return `<section><p class="eyebrow">Mission 8 · pitch</p><h1>Collect the ratings</h1><div class="card"><div id="wlist">${rows(S, m, "pitch", "Listener") || '<p class="small">No links yet.</p>'}</div><div class="chips"><button class="btn small" data-act="madd">Add a rating link</button><button class="chip" data-act="mdemo">Demo: simulate 6 listeners</button>${sameBox(m)}</div></div>${s.n ? `<div class="card"><h2>What they said so far</h2><div class="tiles">${tile("clarity out of 4", s.clear.toFixed(1))}${tile("belief out of 4", s.believe.toFixed(1))}${tile("would take a meeting", s.meet + "%")}${tile("could say who pays", s.who + "%")}</div></div>` : ""}<div class="card"><h2>The doubt you will fix first</h2>${chipRow(top.length ? top.map((x) => [x[0], DOUBT[x[0]] + " (" + x[1] + ")"]) : Object.entries(DOUBT), m.fix, "mset", "fix")}</div><button class="btn" data-act="msubmit">Submit for checking</button></section>`; },
    verdict(S) { const m = MS(S, 8); return verdictShell(S, 8, m.verdict, "", "Begin Step 9"); },
    click(act, d, S, h) { const m = MS(S, 8); if (act === "mdemo") { [["stranger", 4, 3, "yes", "yes", "price"], ["stranger", 3, 3, "maybe", "yes", "market"], ["stranger", 4, 4, "yes", "yes", "copy"], ["classmate", 3, 2, "maybe", "no", "price"], ["friend", 4, 3, "yes", "yes", "price"], ["stranger", 3, 3, "no", "yes", "price"]].forEach((x, i) => fakeW(m, { k: "pitch", rel: x[0], clear: x[1], believe: x[2], meet: x[3], who: x[4], doubt: x[5] }, i)); h.save(); h.render(); return true; } return false; },
    award(S, v, G) { G.award(S, "m8:attempt", 10, "Collected pitch ratings"); for (let i = 0; i < Math.min(5, v.s.n); i++) G.award(S, "m8:l:" + i, 20, "An outsider heard your pitch"); if (v.s.meet >= 50) G.award(S, "m8:meet", 60, "Half would take a meeting"); if (v.ok) { G.award(S, "m8:pass", 200, "Pitch tested on outsiders"); G.celebrate(S, "Pitch tested on outsiders", "Five outsiders rated you", 200); } },
    after: bindInputs,
  };
  PF.MH = { rows, chipRow, tile, bindInputs, shotsCard, fakeW, sameBox, wl, tok };
  PF.missions[5] = M5; PF.missions[6] = M6; PF.missions[7] = M7; PF.missions[8] = M8;
})();
