/* The product's life cycle on the founder's device: schema versions and migration, stage e-mails, refund claims, "My data" (see, export, delete),
   and the "a newer version is ready" notice. Everything here runs in the founder's browser; the server only stores and relays. */
(function () {
  const PF = (window.PF = window.PF || {}), e = PF.esc, MS = PF.MS;
  PF.SCHEMA = 2;
  const post = (url, body) => fetch(url, { method: "POST", headers: Object.assign({ "content-type": "application/json" }, PF.hdr()), body: JSON.stringify(body) }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  const ver = () => (PF.CONFIG && PF.CONFIG.version) || "dev";

  // ---- versions: data saved by an older release is brought forward, in place, and the history of releases that touched it is kept
  PF.migrate = (S) => {
    if (!S) return S; let v = S.sv || 1;
    if (v < 2) { S.consents = S.consents || {}; S.vers = S.vers || []; S.mails = S.mails || {}; v = 2; } // v1 (first release) had none of these
    S.sv = v; S.vers = S.vers || []; S.consents = S.consents || {}; S.mails = S.mails || {};
    const last = S.vers[S.vers.length - 1];
    if (!last || last.v !== ver()) S.vers.push({ v: ver(), at: Date.now(), from: last ? last.v : null });
    return S;
  };

  if (!(PF.CONFIG && PF.CONFIG.demo)) document.documentElement.classList.add("nodemo");
  const L = (PF.life = {});
  L.boot = (S) => {
    PF.migrate(S);
    if (S.access && !PF.vault.access) PF.vault.access = S.access; else if (!S.access && PF.vault.access) S.access = PF.vault.access;
    if (PF.mail.on() && S.access && PF.vault.id && PF.vault.id() && !S.mails.vc) { S.mails.vc = 1; L.mailIf(S, { e: "vault_created" }); }
    L.watch();
  };
  L.mailIf = (S, b) => { if (!PF.mail.on() || !S.access || S.consents.stageMail === false || !PF.vault.id()) return; post("/api/n", Object.assign({ t: S.access, v: PF.vault.id() }, b)); };

  // ---- a step was passed: e-mail the founder; at Step 9 and 12 also open the refund claim (the pack is locked to the audit key)
  L.passed = (S, n) => {
    S.mails = S.mails || {}; const k = "s" + n; if (S.mails[k]) return; S.mails[k] = 1; PF.store.save(S);
    if (n <= 11) L.mailIf(S, { e: "step_done", step: n });
    if (n === 9) L.claim(S, "A"); if (n === 12) L.claim(S, "B");
  };
  L.claim = async (S, kind) => {
    if (!PF.mail.on() || !S.access || !PF.CONFIG.auditKey || !PF.vault.id()) return;
    try { const pack = await PF.vault.auditPack(PF.auditBundle(S), PF.CONFIG.auditKey); const r = await post("/api/c", { t: S.access, v: PF.vault.id(), kind, code: PF.claimCode(S), pack }); if (r && r.ok) { S.mails["claim" + kind] = r.code; PF.store.save(S); } } catch (x) { /* retried the next time the verdict is opened */ S.mails["s" + (kind === "A" ? 9 : 12)] = 0; }
  };
  const v0 = PF.missionUI.verdict;
  PF.missionUI.verdict = (S) => { const m = (S.step || 1) === 1 ? (S.mission || {}) : MS(S, S.step || 1); if (m.verdict && m.verdict.ok) setTimeout(() => L.passed(S, S.step || 1), 0); return v0(S); };
  const c0 = PF.missionUI.click;
  PF.missionUI.click = (act, d, S, h) => {
    if (act === "mdemo" && !(PF.CONFIG && PF.CONFIG.demo)) return true; // demo shortcuts exist only in test builds: they would write readable data to the device
    if (act === "mydata") { if (S.screen !== "mydata") S.prevScreen = S.screen; h.go("mydata"); return true; }
    if (act === "mdback") { h.go(S.prevScreen && S.prevScreen !== "mydata" ? S.prevScreen : "intro"); return true; }
    if (act === "mdexport") { L.exportData(S); return true; }
    if (act === "mdmail") { S.consents.stageMail = S.consents.stageMail === false; h.save(); h.render(); return true; }
    if (act === "mddel") { L.del(S); return true; }
    if (act === "mdreload") { PF.vault.flush().finally(() => location.reload()); return true; }
    return c0(act, d, S, h);
  };

  // ---- My data: see what we keep, take it with you, delete it
  L.exportData = (S) => {
    const out = { exportedAt: new Date().toISOString(), software: ver(), vaultId: PF.vault.id && PF.vault.id(), yourData: S };
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: "application/json" })); a.download = "proof-forge-my-data.json"; a.click();
  };
  L.del = async (S) => {
    if (!confirm("Delete your vault for good? Everything you entered is erased from our storage and cannot be brought back, even by us.")) return;
    try { await PF.vault.del(); localStorage.removeItem("pf-vault-id"); PF.vault.lock(); document.body.innerHTML = '<main class="wrap main"><section class="center"><h1>Your vault is deleted</h1><p class="lead">Your data has been erased from our storage. You can close this page. Your payment record stays with the payment service, and a pseudonymous activity record stays for audit (see the privacy notice).</p></section></main>'; }
    catch (x) { alert("Could not delete right now. Check your connection and try again."); }
  };
  L.myData = (S) => {
    const mail = S.consents.stageMail !== false, hist = (S.vers || []).slice(-5).map((x) => `<li><span>${e(x.v)}</span><span class="small">${new Date(x.at).toLocaleString()}${x.from ? " (from " + e(x.from) + ")" : ""}</span></li>`).join("");
    return `<section><p class="eyebrow">Your data, your control</p><h1>My data</h1>
    <div class="card"><h2>What we keep</h2><ul class="ded"><li><span>Your answers and progress</span><span class="small">Locked on your device. We store only the locked copy. We cannot read it.</span></li><li><span>Answers from other people (funders, accountants, customers)</span><span class="small">Locked with a key that only you hold. We cannot read them.</span></li><li><span>An activity record</span><span class="small">Time, event, vault id, a random browser id, software version, and a scrambled address. Never what you typed.</span></li><li><span>Your payment</span><span class="small">Held by the payment service (IT Services by Rajat Agarwal / Razorpay). Your e-mail travels inside your private access link and is used only for the e-mails below.</span></li></ul></div>
    <div class="card"><h2>E-mails about your progress</h2><p class="small">We e-mail you when you pass a step, and when a refund is earned or sent. ${mail ? "These are on." : "These are off."}</p><button class="btn ghost" data-act="mdmail">${mail ? "Turn them off" : "Turn them on"}</button></div>
    <div class="card"><h2>Take your data with you</h2><p class="small">Download everything in your vault as a readable file.</p><button class="btn ghost" data-act="mdexport">Download my data</button></div>
    <div class="card"><h2>Software versions</h2><p class="small">You are running <b>${e(ver())}</b>. Your data format is version ${S.sv}. When a newer release opens older data, it is brought forward safely.</p><ul class="ded">${hist}</ul></div>
    <div class="card no"><h2>Delete my vault</h2><p class="small">Erases your locked data from our storage. This cannot be undone. A refund you have not yet claimed cannot be claimed afterwards.</p><button class="btn" data-act="mddel">Delete my vault</button></div>
    <p class="small"><a href="privacy.html" target="_blank" rel="noopener">Privacy notice</a> · <a href="terms.html" target="_blank" rel="noopener">Terms</a> · Grievance: rajatsiroffice@gmail.com</p>
    <button class="btn ghost" data-act="mdback">Back</button></section>`;
  };

  // ---- a newer release is out: tell the founder, save first, then reload into it
  L.watch = () => {
    if (L.watching || !PF.mail.on()) return; L.watching = true;
    const check = async () => {
      try { const v = await (await fetch("/version.json", { cache: "no-store" })).json(), m = JSON.parse(v.manifest);
        if (m.version !== ver() && !document.getElementById("pf-newver")) { const b = document.createElement("div"); b.id = "pf-newver"; b.setAttribute("role", "status"); b.style.cssText = "position:fixed;top:0;left:0;right:0;background:#0E7C6E;color:#fff;padding:10px;text-align:center;z-index:99"; b.innerHTML = 'A newer version of Proof Forge is ready. Your work is saved. <button class="mini" data-act="mdreload">Update now</button>'; document.body.appendChild(b); } } catch (x) { /* offline */ }
    };
    setInterval(check, 300000); window.addEventListener("focus", check); setTimeout(check, 4000);
  };
})();
