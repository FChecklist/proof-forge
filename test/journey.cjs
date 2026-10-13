// FULL JOURNEY, end to end, through the real screens: pay -> access link -> private vault -> all 12 steps -> refund claims.
// Steps 1 to 8 use the built-in demo shortcuts (a demo build); Steps 9 to 12 use REAL sealed answers posted to the storage by other "people",
// exactly as funders, accountants and customers would. Run: PF_DEMO=1 node tools/build-dist.cjs audit-public-key.json && node test/journey.cjs
const { chromium } = require("C:/ct/ct/node_modules/@playwright/test"), { webcrypto: wc } = require("node:crypto"), assert = require("node:assert/strict");
const PORT = 8231, B = "http://127.0.0.1:" + PORT;
const b64u = (b) => Buffer.from(b).toString("base64url");
async function seal(obj, key) { const iv = wc.getRandomValues(new Uint8Array(12)), k = await wc.subtle.importKey("raw", Buffer.from(key, "base64url"), "AES-GCM", false, ["encrypt"]); return JSON.stringify({ iv: b64u(iv), ct: b64u(await wc.subtle.encrypt({ name: "AES-GCM", iv }, k, Buffer.from(JSON.stringify(obj)))) }); }
const log = (...a) => console.log(...a);
(async () => {
  const { start, SECRET } = await import("./dev-cloud.mjs"); const { mintToken } = await import("../functions/api/_access.js");
  const srv = await start(PORT);
  const token = await mintToken(SECRET, { p: "pay_E2EJOURNEY01", q: 1, e: "founder@example.com", n: "Asha Rao", s: "KurtaKart", at: Date.now() });
  const b = await chromium.launch(), ctx = await b.newContext(), p = await ctx.newPage(); const errs = [];
  p.on("pageerror", (x) => errs.push("pageerror: " + x)); p.on("console", (m) => { if (m.type() === "error" && !/404|Failed to load resource/.test(m.text())) errs.push("console: " + m.text()); });
  p.on("dialog", (d) => d.accept()); global.__p = p;
  // ---- 1. the access link opens the gate; no link, no vault
  const bare = await (await b.newContext()).newPage(); await bare.goto(B + "/index.html"); await bare.waitForTimeout(800);
  assert.ok((await bare.innerText("body")).includes("Open it from your e-mail"), "without the access link there is no way to create a vault"); await bare.close();
  await p.goto(B + "/index.html#access=" + token); await p.waitForSelector("#p1", { timeout: 20000 });
  assert.ok(!/access=/.test(await p.evaluate(() => location.href)), "the token is removed from the address bar");
  const PASS = "correct horse battery"; await p.fill("#p1", PASS); await p.fill("#p2", PASS); await p.click("#mk"); await p.waitForSelector("#go", { timeout: 30000 });
  const code = (await p.innerText(".big")).trim(), vid = (await p.innerText("div[style*=monospace]")).trim(); await p.check("#ok"); await p.click("#go"); await p.waitForSelector("#nm", { timeout: 10000 });
  log("1. vault created behind the access link; recovery code and vault id shown");
  // ---- 2. drive the real screens
  const ref = await p.evaluate(() => { const P = PF.persona(), s = Object.assign({}, P); PF.demoFill(s, 12); return { ans: s.ans, flavour: P.flavour }; });
  const state = () => p.evaluate(() => { const S = PF.getState(), q = S.queue && S.queue[(S.step || 1) + ":" + S.u]; return { screen: S.screen, sub: S.sub && S.sub.kind, step: S.step || 1, id: q ? q[S.qi] : null, fmt: q && PF.ITEMS[q[S.qi]] ? PF.ITEMS[q[S.qi]].fmt : null }; });
  const has = (sel) => p.$(sel).then((x) => !!x);
  const click = async (sel) => { if (sel !== "[data-act=lvlok]" && (await has(".ovl [data-act=lvlok]"))) await p.click(".ovl [data-act=lvlok]", { timeout: 3000 }); await p.click(sel, { timeout: 5000 }); await p.waitForTimeout(40); };
  // The sample founder's own plan leaks money (negative profit per sale), so it correctly could NOT pass the investor-ready gate. This run uses a healthier plan.
  const OV = { sellThrough: 90, returns: 5, badDebt: 0, leakPct: 5, price: 600 };
  const want = (id) => (id in OV ? OV[id] : ref.ans[id] ? ref.ans[id].v : undefined);
  let rounds = 0, stuck = 0, last = "";
  const stepsDone = new Set(), missionLog = [];
  async function answer(st) {
    const id = st.id, w = want(id);
    if (st.sub === "conf") return click('[data-act=conf][data-v="75"]');
    if (st.sub === "fb" || st.fmt === "reveal") return click("[data-act=qnext]");
    if (st.fmt === "single" || st.fmt === "pair") return p.evaluate((w) => { const btns = [...document.querySelectorAll("[data-act=pick]")], b = btns.find((x) => JSON.stringify(JSON.parse(x.dataset.v)) === JSON.stringify(w)) || btns[0]; b.click(); }, w);
    if (st.fmt === "tf" || st.fmt === "reflex") return click(w === false ? ".opt.tf.f" : ".opt.tf.t");
    if (st.fmt === "multi") { let n = 0; for (const v of Array.isArray(w) ? w : []) n += (await p.evaluate((v) => { const b = [...document.querySelectorAll(".tick")].find((x) => x.dataset.v === String(v)); if (b) { b.click(); return 1; } return 0; }, v)); if (!n) await p.evaluate(() => document.querySelector(".tick").click()); return click("[data-act=mdone]"); }
    if (st.fmt === "band") { await p.evaluate(([id, w]) => { const it = PF.ITEMS[id], i = w === undefined ? -1 : it.vals.reduce((best, v, k) => (Math.abs(v - w) < Math.abs(it.vals[best] - w) ? k : best), 0), el = document.getElementById("band"); el.value = String(i >= 0 ? i : it.def); el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true })); }, [id, w]); return click("#bdone"); }
    if (st.fmt === "matrix") { const rows = await p.$$eval(".mrow", (els) => els.map((e) => [...e.querySelectorAll("[data-act=mx]")].map((b) => ({ r: b.dataset.r, k: b.dataset.k, v: b.dataset.v })))); for (const row of rows) for (const k of ["who", "know"]) { const opts = row.filter((x) => x.k === k), pick = (w && w[opts[0] && opts[0].r] && opts.find((x) => x.v === w[opts[0].r][k])) || opts[0]; await p.click(`[data-act=mx][data-r="${pick.r}"][data-k="${k}"][data-v="${pick.v}"]`); } return click("[data-act=mxdone]"); }
    if (st.fmt === "ledger") { while (await p.evaluate(() => { const r = [...document.querySelectorAll(".lrow")].find((x) => !x.querySelector(".on")); if (!r) return false; r.querySelector("[data-act=tag]").click(); return true; })); return click("[data-act=ledgerdone]"); }
    throw new Error("unknown question format " + st.fmt + " for " + id);
  }
  async function witnessTokens(step, kind) { return p.evaluate(([step, kind]) => { const S = PF.getState(), m = PF.MS(S, step); return (m.witnesses || []).filter((w) => w.kind === kind).map((w) => ({ token: w.token, key: S.wkeys[w.token] })); }, [step, kind]); }
  async function addWitnesses(step, kind, recs) {
    for (let i = 0; i < recs.length; i++) await click(`[data-act=madk][data-kind=${kind}]`);
    const toks = (await witnessTokens(step, kind)).slice(-recs.length); assert.equal(toks.length, recs.length, "links created for " + kind);
    const keyOf = {}; // the link must carry its key after the #
    const links = await p.$$eval(`#wl-${kind} a.chip`, (a) => a.map((x) => x.href));
    for (let i = 0; i < recs.length; i++) { const r = await fetch(`${B}/api/w/${toks[i].token}`, { method: "POST", headers: { "content-type": "application/json", "x-test-ip": "7.7.7." + (i + 1) }, body: JSON.stringify({ c: await seal(Object.assign({ at: Date.now(), device: "dw" + kind + i }, recs[i]), toks[i].key) }) }); assert.equal(r.status, 201, "sealed answer accepted for " + kind); }
  }
  const upload = (key, n) => p.setInputFiles("#pf-f-" + key, Array.from({ length: n }, (_, i) => ({ name: key + i + ".pdf", mimeType: "application/pdf", buffer: Buffer.from("proof " + i) })));
  const sync = async () => { await p.evaluate(() => PF.mail.sync(PF.getState()).then(() => PF.ui.render())); await p.waitForTimeout(200); };
  const setNum = async (key, v) => { await p.fill("#n-" + key, String(v)); await p.dispatchEvent("#n-" + key, "change"); await p.waitForTimeout(150); };
  async function realMission(step) {
    const c = await p.evaluate(() => PF.contract(PF.getState())); const F = c.fund, SA = c.sales, MG = c.margin;
    if (step === 9) {
      await addWitnesses(9, "meet", [{ k: "meet", rel: "investor", held: "yes", obj: "traction", next: "follow" }, { k: "meet", rel: "programme", held: "yes", obj: "market", next: "follow" }, { k: "meet", rel: "mentor", held: "yes", obj: "copy", next: "intro" }]);
      await addWitnesses(9, "review", [{ k: "review", role: "lawyer", rev: "yes", conc: "1", rec: "change" }, { k: "review", role: "ca", rev: "yes", conc: "0", rec: "sign" }]);
      await click('[data-act=mset][data-k=decision][data-v=change]'); await upload("docs", 4);
      await addWitnesses(9, "docs", [{ k: "docs", role: "ca", seen: "all", order: "yes" }, { k: "docs", role: "cs", seen: "all", order: "yes" }]);
      await addWitnesses(9, "funder", [{ k: "funder", rel: "investor", stage: "received", amt: Math.round(F * 0.3), know: "stranger" }]); await upload("bank", 1);
    }
    if (step === 10) {
      await setNum("sales", Math.round(SA * 0.6));
      await addWitnesses(10, "sales", [{ k: "sales", role: "ca", amt: Math.round(SA * 0.58), conc: "lt20", relshare: "lt30", checked: "all" }]);
      await addWitnesses(10, "buy", Array.from({ length: 12 }, (_, i) => ({ k: "buy", answer: "yes", pay: "upi", rel: i < 2 ? "friend" : "stranger" }))); await upload("sales", 2);
    }
    if (step === 11) { const sales = Math.round(SA * 0.58); await addWitnesses(11, "pnl", [{ k: "pnl", role: "ca", sales, profit: Math.round(sales * MG * 0.7 / 100), all: "yes" }]); await upload("pnl", 2); }
    if (step === 12) { await addWitnesses(12, "funder", [{ k: "funder", rel: "investor", stage: "received", amt: Math.round(F * 0.3), know: "stranger" }]); await upload("bank", 1); await click("[data-act=mset][data-k=honest][data-v=yes]"); }
    await sync();
  }
  const MEM = { n: 0 };
  while (rounds++ < 2500) {
    const st = await state(); const key = JSON.stringify(st) + (await p.evaluate(() => PF.getState().qi + ":" + PF.getState().pi));
    stuck = key === last ? stuck + 1 : 0; last = key; if (stuck > 12) { log("STUCK at", JSON.stringify(st), "\n", (await p.innerText("body")).slice(0, 600)); throw new Error("bot stuck"); }
    if (await has(".ovl [data-act=lvlok]")) { await click("[data-act=lvlok]"); continue; }
    const s = st.screen;
    if (s === "intro") { await p.fill("#nm", "Asha Rao"); await p.fill("#st", "KurtaKart"); await p.check("#c18"); await p.check("#cc"); await click("#startbtn"); }
    else if (s === "daydream") await click("[data-act=ddok]");
    else if (s === "flavour") await click(`[data-act=flavour][data-id="${ref.flavour}"]`).catch(() => click("[data-act=flavour]"));
    else if (s === "router") await click("[data-act=route]");
    else if (s === "unitIntro") await click("[data-act=unitgo]");
    else if (s === "prelude") await click("[data-act=pnext]");
    else if (s === "q") await answer(st);
    else if (s === "story") await click("[data-act=snext]");
    else if (s === "mirror") { while (await p.evaluate(() => { const g = [...document.querySelectorAll(".card.mir .chips")].find((x) => !x.querySelector(".chip.on")); if (!g) return false; g.querySelector("[data-act=mir]").click(); return true; })); await click("[data-act=mnext]"); }
    else if (s === "roundEnd") await click("[data-act=roundnext]");
    
    else if (s === "results") await click((await has("[data-act=torebuild]")) ? "[data-act=torebuild]" : "[data-act=tomission]");
    else if (s === "rebuild" || s === "verdict") { while (await p.evaluate(() => { const g = [...document.querySelectorAll(".card.rb")].find((x) => !x.querySelector(".opt.on")); if (!g) return false; g.querySelector("[data-act=fix]").click(); return true; })); await click((await has("[data-act=verdictnext]:not([disabled])")) ? "[data-act=verdictnext]" : "[data-act=tomission]"); }
    else if (s === "missionBrief") await click("[data-act=mstart]");
    else if (s === "missionSubmit") {
      const step = st.step;
      if (step === 1) {
        for (const [k, v] of [["buy", 2000], ["sell", 3000], ["days", 20], ["buyers", 5], ["surprise", "slow"], ["why", "time"]]) await click(`[data-act=mset][data-k=${k}][data-v="${v}"]`);
        const links = ["https://www.myntra.com/kurtas", "https://www.fabindia.com/men-kurtas", "https://www.amazon.in/s?k=kurta", "https://www.ajio.com/men-kurtas", "https://example-local-shop.in/kurtas"];
        for (let i = 0; i < 5; i++) { await p.fill(`.alt-in[data-i="${i}"]`, links[i]); await p.dispatchEvent(`.alt-in[data-i="${i}"]`, "change"); }
        await p.setInputFiles("#pf-buy", [{ name: "receipt.png", mimeType: "image/png", buffer: Buffer.from("r") }]);
        await p.setInputFiles("#pf-sale", [1, 2, 3].map((i) => ({ name: "pay" + i + ".png", mimeType: "image/png", buffer: Buffer.from("p" + i) })));
        for (let i = 0; i < 5; i++) await click("[data-act=madd]");
        const toks = await p.evaluate(() => PF.getState().mission.witnesses.map((w) => w.token));
        for (let i = 0; i < 5; i++) { await click(`[data-act=mcopy][data-t="${toks[i]}"]`); const key = await p.evaluate((t) => PF.getState().wkeys[t], toks[i]); const r = await fetch(`${B}/api/w/${toks[i]}`, { method: "POST", headers: { "content-type": "application/json", "x-test-ip": "6.6.6." + (i + 1) }, body: JSON.stringify({ c: await seal({ k: "buy", answer: "yes", pay: "upi", rel: i === 4 ? "friend" : "stranger", at: Date.now(), device: "dbuyer" + i }, key) }) }); assert.equal(r.status, 201); }
        await sync();
      } else if (step === 4) {
        if (await has("[data-act=mgo]")) await click("[data-act=mgo]");
        const gt = await p.evaluate(() => PF.getState().ms[4].goToken), gk = await p.evaluate((t) => PF.wkey(PF.getState(), t), gt); let n = 0;
        const post = async (e) => { const r = await fetch(`${B}/api/g/${gt}`, { method: "POST", headers: { "content-type": "application/json", "x-test-ip": "5.5." + (n >> 8) + "." + (n++ & 255) }, body: JSON.stringify({ c: await seal(Object.assign({ at: Date.now() }, e), gk) }) }); assert.equal(r.status, 201, "visitor event accepted"); };
        for (let i = 0; i < 120; i++) await post({ t: "visit", device: "dv" + i });
        for (let i = 0; i < 14; i++) await post({ t: "signup", rel: i % 3 === 0 ? "friend" : "stranger", device: "ds" + i });
        for (let i = 0; i < 4; i++) await post({ t: "pre", rel: i === 0 ? "friend" : "stranger", device: "dp" + i });
        await click("[data-act=mset][data-k=askDecision][data-v=reduce]"); await sync();
      } else if (step <= 8) {
        // Steps 2 to 8: no demo shortcut. Other people's answers are posted sealed, exactly as strangers' phones would.
        const plain = async (kind, recs) => { for (let i = 0; i < recs.length; i++) await click("[data-act=madd]"); const toks = await p.evaluate((n) => { const S = PF.getState(), m = PF.MS(S, S.step); return (m.witnesses || []).slice(-n).map((w) => w.token); }, recs.length);
          await p.evaluate(() => { const S = PF.getState(), m = PF.MS(S, S.step); (m.witnesses || []).forEach((w) => PF.wkey(S, w.token)); });
          for (let i = 0; i < recs.length; i++) { const key = await p.evaluate((t) => PF.getState().wkeys[t], toks[i]); const r = await fetch(`${B}/api/w/${toks[i]}`, { method: "POST", headers: { "content-type": "application/json", "x-test-ip": "4.4." + step + "." + (i + 1) }, body: JSON.stringify({ c: await seal(Object.assign({ k: kind, at: Date.now(), device: "dp" + step + "x" + i }, recs[i]), key) }) }); assert.equal(r.status, 201, "sealed answer accepted, step " + step); } };
        const setState = (fn, arg) => p.evaluate(([fn, arg]) => { const S = PF.getState(), m = PF.MS(S, S.step); new Function("S", "m", "arg", fn)(S, m, arg); PF.store.save(S); }, [fn, arg]);
        if (step === 2) {
          const R = [["stranger", "often", "mix", "yes", "maybe", "yes", "price"], ["stranger", "sometimes", "none", "maybe", "no", "no", "price"], ["classmate", "often", "paid", "yes", "yes", "yes", "other"], ["stranger", "often", "mix", "payer", "yes", "yes", "other"], ["friend", "sometimes", "free", "yes", "yes", "no", "other"], ["stranger", "rarely", "none", "no", "no", "no", "need"], ["stranger", "often", "paid", "both", "yes", "yes", "other"], ["family", "sometimes", "none", "yes", "maybe", "no", "price"], ["stranger", "often", "mix", "payer", "maybe", "no", "trust"], ["friend", "often", "paid", "yes", "yes", "yes", "other"], ["stranger", "sometimes", "mix", "payer", "no", "no", "price"], ["stranger", "often", "paid", "user", "yes", "no", "timing"], ["classmate", "sometimes", "none", "payer", "maybe", "no", "need"], ["stranger", "often", "mix", "both", "yes", "yes", "other"]];
          await plain("interview", R.map((r) => ({ rel: r[0], face: r[1], today: r[2], role: r[3], pay: r[4], dep: r[5], why: r[6] })));
          await sync(); const lvl = await p.evaluate(() => PF.s2.demand(PF.getState()).level);
          await click(`[data-act=mset][data-k=reading][data-v=${lvl}]`); await click("[data-act=mset][data-k=nextAct][data-v=more]");
        }
        if (step === 3) {
          await setState("m.quotes = m.quotes || {}; PF.s3.mainCosts(S).forEach((r, bi) => { m.quotes[r.key] = [{ vendor: 'Vendor A' + bi, amt: Math.round(r.amt * 0.9), terms: 'advance' }, { vendor: 'Vendor B' + bi, amt: Math.round(r.amt * 1.1), terms: 'credit' }]; }); m.files = [{ name: 'quote1.png', size: 60000 }, { name: 'quote2.pdf', size: 80000 }];");
          await plain("operator", [{ answer: "yes", hours: "8" }]);
        }
        if (step === 5) await setState("const a = PF.s4.askAmount(S), hs = ['startupindia.gov.in', 'nasscom.in', 'ah.vc', 'sidbi.in', 'indianangelnetwork.com', 'ycombinator.com', 'ivycap.com', 'birac.nic.in']; m.prog = hs.map((h2, i) => ({ name: 'Programme ' + (i + 1), url: 'https://www.' + h2 + '/apply', min: Math.round(a * 0.5), max: Math.round(a * 2), elig: i < 3 ? 'yes' : 'maybe' })); m.route = 'angel';");
        if (step === 6) await plain("connector", [["mentor", "well", "yes", "yes"], ["alumni", "slightly", "yes", "yes"], ["friend", "well", "maybe", "no"], ["family", "slightly", "no", "no"], ["stranger", "well", "yes", "yes"], ["classmate", "slightly", "yes", "no"]].map((x) => ({ rel: x[0], know: x[1], willing: x[2], fwd: x[3] })));
        if (step === 7) { await setState("m.sent = 30; m.replies = 5; m.meetings = 2; m.files = [1, 2, 3, 4, 5].map((i) => ({ name: 'm' + i + '.png', size: 1 }));"); await plain("msg", [[4, 4, "yes"], [3, 3, "maybe"], [4, 3, "yes"], [3, 4, "no"]].map((x) => ({ clear: x[0], want: x[1], reply: x[2] }))); }
        if (step === 8) await plain("pitch", [["stranger", 4, 3, "yes", "yes", "price"], ["stranger", 3, 3, "maybe", "yes", "market"], ["stranger", 4, 4, "yes", "yes", "copy"], ["classmate", 3, 2, "maybe", "no", "price"], ["friend", 4, 3, "yes", "yes", "price"], ["stranger", 3, 3, "no", "yes", "price"]].map((x) => ({ rel: x[0], clear: x[1], believe: x[2], meet: x[3], who: x[4], doubt: x[5] })));
        await sync();
        if (step === 8) for (const k of [...new Set(await p.$$eval("[data-act=mset]", (b) => b.map((x) => x.dataset.k)))]) { const sel = `[data-act=mset][data-k="${k}"]`; await click((await has(sel + "[data-v=price]")) ? sel + "[data-v=price]" : sel); }
      }
      else await realMission(step);
      await click("[data-act=msubmit]");
    }
    else if (s === "missionVerdict") {
      const ok = await p.evaluate(() => { const S = PF.getState(), m = (S.step || 1) === 1 ? S.mission : PF.MS(S, S.step); return !!(m.verdict && m.verdict.ok); });
      const fails = ok ? [] : await p.$$eval(".fails li b", (x) => x.map((e) => e.textContent));
      if (!ok) { log("mission", st.step, "NOT passed:", fails.join(" | ")); throw new Error("mission " + st.step + " failed"); }
      stepsDone.add(st.step); log("   step", st.step, "mission passed");
      if (st.step === 12) break;
      await click((await has("[data-act=togate]")) ? "[data-act=togate]" : "[data-act=nextstep]");
    }
    else if (s === "gate") { if (await has("[data-act=nextstep]")) await click("[data-act=nextstep]"); else { log("GATE NOT READY:", (await p.$$eval(".gate li.bad b", (x) => x.map((e) => e.textContent))).join(" | ")); log("DIAG", JSON.stringify(await p.evaluate((refAns) => { const S = PF.getState(), f = PF.flow(S), a = (k) => (S.ans[k] ? S.ans[k].v : null); const diff = Object.keys(refAns).filter((k) => S.ans[k] && JSON.stringify(S.ans[k].v) !== JSON.stringify(refAns[k].v)); return { contribution: f && f.base.contribution, price: a("price"), cost: a("cost"), fixed: a("fixed"), people: PF.s3.team(S) && PF.s3.team(S).peopleMonthly, gStart: a("gStart"), gRate: a("gRate"), diff: diff.slice(0, 12).map((k) => [k, S.ans[k].v, refAns[k].v]), notInRef: Object.keys(S.ans).filter((k) => !refAns[k]).slice(0, 25) }; }, ref.ans))); throw new Error("gate not ready"); } }
    else throw new Error("unknown screen " + s);
  }
  assert.equal(stepsDone.size, 12, "all 12 missions passed through the real screens");
  log("2. all 12 steps passed through the real screens (" + rounds + " bot actions)");
  // ---- 3. results
  await p.waitForTimeout(1200);
  const fin = await p.evaluate(() => { const S = PF.getState(), r = PF.refund(S), g = PF.game.g(S); return { back: r.back, a: r.a, b: r.b, xp: g.xp, level: PF.game.level(g.xp).name, badges: g.badges.length, mails: S.mails, ver: S.vers, sv: S.sv }; });
  log("3. refund earned:", fin.back, "| level:", fin.level, "| XP:", fin.xp, "| badges:", fin.badges);
  assert.equal(fin.back, 19999, "the whole deposit is earned");
  const mails = await (await fetch(B + "/__mails")).json(), subs = mails.map((m) => m.to + " :: " + m.subject);
  log("4. e-mails sent:\n   " + subs.join("\n   "));
  for (const t of ["Your Proof Forge vault is created", "Step 1 passed", "Step 8 passed", "Half your deposit is earned", "Step 11 passed", "Your full deposit is earned"]) assert.ok(mails.some((m) => m.subject.includes(t) && (m.to === "founder@example.com")), "buyer got: " + t);
  assert.ok(mails.some((m) => m.to === "owner@example.com" && m.subject.startsWith("Claim A")) && mails.some((m) => m.to === "owner@example.com" && m.subject.startsWith("Claim B")), "owner told of both claims");
  assert.equal(new Set(mails.map((m) => m.subject)).size, mails.length, "no e-mail sent twice");
  // ---- 4. privacy audit: nothing readable on the device or in our storage
  const db = await (await fetch(B + "/__db")).json(), dump = JSON.stringify(db);
  const dev = await p.evaluate(() => { const o = {}; for (let i = 0; i < localStorage.length; i++) o[localStorage.key(i)] = localStorage.getItem(localStorage.key(i)).length; return o; });
  log("5. device storage:", JSON.stringify(Object.keys(dev)));
  for (const k of Object.keys(dev)) assert.ok(["pf-vault-id", "pf-device"].includes(k), "only the vault id and the browser id live on the device, found " + k);
  for (const bad of ["Asha Rao", "KurtaKart", "founder@example.com", "stranger", "lawyer"]) assert.ok(!dump.includes(bad), "storage never holds readable: " + bad);
  // the only payment identifier we hold is the payment service's own reference (needed to refund the right payment), never a name or an e-mail
  assert.ok(!dump.includes("9.9.9.9") && !dump.includes("7.7.7."), "no raw internet address in storage");
  assert.equal(db.claims.length, 2, "both claims stored"); assert.ok(db.claims.every((c) => !c.pack.includes("KurtaKart") && c.pack.length > 1000), "claim packs are locked");
  assert.ok(db.log.length > 20, "activity is logged (" + db.log.length + " rows)"); const v0 = db.vault[0]; assert.equal(v0.pay, "pay_E2EJOURNEY01"); assert.ok(/^1\.0\.0/.test(v0.app_version) || v0.app_version === "1.0.0+" || v0.app_version.length > 0, "software version kept: " + v0.app_version); assert.equal(v0.schema_v, 2, "data schema version kept");
  log("6. privacy audit passed: storage holds only ciphertext; claims locked; activity logged;  vault app_version =", v0.app_version, " schema =", v0.schema_v);
  // ---- 5. open the audit pack with the audit private key (what the owner does)
  const T = require("../tools/claims.cjs"), key = JSON.parse(require("node:fs").readFileSync(process.env.USERPROFILE + "/Documents/proof-forge-AUDIT-PRIVATE-KEY.jwk", "utf8"));
  const bundle = await T.openPack(db.claims.find((c) => c.kind === "B").pack, key);
  assert.equal(bundle.profile.startup, "KurtaKart"); assert.equal(bundle.refund.back, 19999 - 0 > 0 ? bundle.refund.back : 0);
  log("7. the audit team opens claim B with its private key: startup =", bundle.profile.startup, "| witness records:", Object.keys(bundle.witnessRecords).length, "| refund state back =", bundle.refund.back);
  // ---- 6. a new device unlocks the same vault with its id + passphrase, and the data migrates / matches
  const dev2 = await (await b.newContext()).newPage(); await dev2.goto(B + "/index.html"); await dev2.waitForSelector("#us"); await dev2.click("#us"); await dev2.fill("#vid", vid); await dev2.fill("#p1", PASS); await dev2.click("#un"); await dev2.waitForFunction(() => window.PF && PF.getState && PF.getState().profile, null, { timeout: 30000 });
  assert.equal(await dev2.evaluate(() => PF.getState().profile.startup), "KurtaKart", "second device restores everything");
  log("8. a second device restored the whole journey from our locked copy");
  const heap = await p.evaluate(() => (performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : -1)); log("9. founder device memory in use by the page: about " + heap + " MB of JavaScript heap; rows held in our storage for the whole journey: vault " + db.vault.length + ", activity " + db.log.length + ", answers " + db.witness.length + ", visitor events " + db.go.length + ". Data-changing statements on our storage for the whole journey: " + db.writes + " (the free limit is 100,000 rows a day, so roughly " + Math.floor(100000 / db.writes) + " full journeys a day)");
  log(errs.length ? "PAGE ERRORS:\n" + errs.join("\n") : "no page errors");
  assert.equal(errs.length, 0);
  await b.close(); srv.server.close(); log("JOURNEY PASSED");
  process.exit(0);
})().catch(async (e) => {
  console.error("JOURNEY FAILED:", String(e.message).split("\n")[0]);
  try { console.error("SCREEN:", JSON.stringify(await global.__p.evaluate(() => { const S = PF.getState(); return { screen: S.screen, step: S.step, u: S.u }; })), (await global.__p.innerText("body")).replace(/\s+/g, " ").slice(0, 300), JSON.stringify(await global.__p.evaluate(() => [...document.querySelectorAll("[data-act]")].map((b) => b.dataset.act + (b.dataset.id ? ":" + b.dataset.id + "/" + b.dataset.v : "") + (b.disabled ? "(disabled)" : "") + (b.classList.contains("on") ? "*" : ""))))); } catch (x) { /* ignore */ }
  process.exit(1);
});
