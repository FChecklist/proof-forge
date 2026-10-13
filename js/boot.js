/* Start-up gate: create or unlock the private vault, then load the app. */
(function () {
  const PF = window.PF, V = PF.vault, app = document.getElementById("app"), e = PF.esc, CODE = /^[A-Za-z2-9]{4}(-[A-Za-z2-9]{4}){4}$/;
  const start = () => { const s = document.createElement("script"); s.src = "js/ui.js"; document.body.appendChild(s); };
  const shell = (h) => { app.innerHTML = '<header class="top"><div class="wrap in"><span class="brand"><span>Proof Forge</span></span></div></header><main class="wrap main"><section class="center">' + h + "</section></main>"; };
  const err = (m) => { const x = document.getElementById("verr"); if (x) x.textContent = m; };
  const busy = (on) => document.querySelectorAll("button").forEach((b) => (b.disabled = on));
  const cloud = PF.mail.on();
  // the access link from the e-mail carries a token after #access=. We keep it in memory, never in storage, and take it out of the address bar.
  (function () { const m = /[#&]access=([A-Za-z0-9_.-]{20,1200})/.exec(location.hash); if (m) { V.access = m[1]; try { history.replaceState(null, "", location.pathname + location.search); } catch (x) { /* ignore */ } } })();
  function noAccessView() {
    shell('<p class="eyebrow">Proof Forge</p><h1>Open it from your e-mail</h1><p class="lead">Proof Forge opens with the private link we e-mailed you after your payment. Open that e-mail and tap the link. If you cannot find it, paste the link below. Already have a vault? <a href="#" id="us">Unlock it</a>.</p><div class="card form"><label for="al">Your access link</label><input id="al" autocomplete="off"><p id="verr" class="note"></p><button class="btn" id="al-go">Continue</button></div><p class="small">No e-mail yet? Pay at the coaching site first, then the e-mail arrives within a minute.</p>');
    document.getElementById("al-go").onclick = () => { const v = document.getElementById("al").value, m = /access=([A-Za-z0-9_.-]{20,1200})/.exec(v) || /^([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/.exec(v.trim()); if (!m) return err("That does not look like the link we e-mailed you."); V.access = m[1]; createView(); };
    document.getElementById("us").onclick = (ev) => { ev.preventDefault(); unlockView(); };
  }
  function createView() {
    if (cloud && !V.access) return noAccessView();
    shell('<p class="eyebrow">Your private vault</p><h1>Only you can read your data</h1><p class="lead">Everything you enter is locked on your own device with a key made from your passphrase. We store the locked copy for you. We cannot read it and we cannot reset it. Choose a passphrase you will remember (10 characters or more).</p>'
      + '<div class="card form"><label for="p1">Passphrase</label><input id="p1" type="password" autocomplete="new-password"><label for="p2">Again</label><input id="p2" type="password" autocomplete="new-password"><p id="verr" class="note"></p><button class="btn" id="mk">Create my vault</button>' + (cloud ? '<p class="small">Already have one? <a href="#" id="us">Unlock it</a></p>' : "") + "</div>");
    document.getElementById("mk").onclick = async () => {
      const a = document.getElementById("p1").value, b = document.getElementById("p2").value; if (a !== b) return err("The two passphrases differ."); if (a.length < 10) return err("Use at least 10 characters.");
      busy(true); try { const legacy = cloud ? null : V.plainLegacy(), r = await V.create(a, legacy); if (legacy) localStorage.removeItem("pf-step1-v1"); V.install(); codeView(r); } catch (x) { busy(false); err(cloud ? "Could not reach our storage. Check your connection and try again." : String(x.message || x)); }
    };
    const us = document.getElementById("us"); if (us) us.onclick = (ev) => { ev.preventDefault(); unlockView(); };
  }
  function codeView(r) {
    shell('<p class="eyebrow">Save this now</p><h1>Your recovery code and vault id</h1><p class="lead">If you forget your passphrase, the recovery code is the only other way in. To open your vault on another device you also need the vault id. Both are shown once. Write them down or save them somewhere safe.</p><div class="card"><p class="small">Recovery code</p><div class="big" style="font-size:22px;letter-spacing:2px;word-break:break-all">' + e(r.code) + '</div><p class="small" style="margin-top:12px">Vault id</p><div style="word-break:break-all;font-family:monospace">' + e(r.id) + '</div></div><label class="chk"><input type="checkbox" id="ok"> I have saved my recovery code and vault id.</label><button class="btn" id="go" disabled>Open Proof Forge</button>');
    document.getElementById("ok").onchange = (ev) => (document.getElementById("go").disabled = !ev.target.checked);
    document.getElementById("go").onclick = start;
  }
  function unlockView() {
    shell('<p class="eyebrow">Your private vault</p><h1>Unlock</h1><div class="card form">' + (cloud ? '<label for="vid">Vault id</label><input id="vid" autocomplete="off" value="' + e(V.knownId()) + '">' : "") + '<label for="p1">Passphrase or recovery code</label><input id="p1" type="password" autocomplete="current-password"><p id="verr" class="note"></p><button class="btn" id="un">Unlock</button>' + (cloud ? '<p class="small">New here? <a href="#" id="nw">Create a vault</a></p>' : "") + "</div>");
    const go = async () => { const v = document.getElementById("p1").value, id = cloud ? document.getElementById("vid").value : null; busy(true); try { await V.unlock(id, v, CODE.test(v)); V.install(); start(); } catch (x) { busy(false); err("That did not unlock the vault."); } };
    document.getElementById("un").onclick = go; document.getElementById("p1").onkeydown = (ev) => { if (ev.key === "Enter") go(); };
    const nw = document.getElementById("nw"); if (nw) nw.onclick = (ev) => { ev.preventDefault(); createView(); };
  }
  function tamperView(r) { shell('<p class="eyebrow">Stop</p><h1>This copy does not match our published release</h1><p class="lead">Do not enter your passphrase here. Close this page and open Proof Forge from the address we gave you. If the problem stays, tell us. (' + e(r.why || "") + ")</p>"); }
  const go = () => { if (V.exists()) unlockView(); else createView(); };
  if ((PF.CONFIG.demo && /demo=/.test(location.hash)) || !window.crypto || !crypto.subtle) start();
  else if (!cloud) go();
  else { shell('<p class="lead">Checking that this is our genuine release…</p>'); PF.integrity.check().then((r) => { if (!r.ok) return tamperView(r); PF.verified = r.version || null; go(); }); }
})();
