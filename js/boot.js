/* Start-up gate: create or unlock the private vault, then load the app. Demo links (#demo=) run unencrypted for testing. */
(function () {
  const PF = window.PF, V = PF.vault, app = document.getElementById("app"), e = PF.esc;
  const start = () => { const s = document.createElement("script"); s.src = "js/ui.js"; document.body.appendChild(s); };
  const shell = (h) => { app.innerHTML = '<header class="top"><div class="wrap in"><span class="brand"><span>Proof Forge</span></span></div></header><main class="wrap main"><section class="center">' + h + "</section></main>"; };
  const err = (m) => { const x = document.getElementById("verr"); if (x) x.textContent = m; };
  const busy = (on) => document.querySelectorAll("button").forEach((b) => (b.disabled = on));
  function createView() {
    shell('<p class="eyebrow">Your private vault</p><h1>Only you can read your data</h1><p class="lead">Everything you enter is locked on this device with a key made from your passphrase. We keep only the locked copy. We cannot read it, and we cannot reset it. Choose a passphrase you will remember (10 characters or more).</p>'
      + '<div class="card form"><label for="p1">Passphrase</label><input id="p1" type="password" autocomplete="new-password"><label for="p2">Again</label><input id="p2" type="password" autocomplete="new-password"><p id="verr" class="note"></p><button class="btn" id="mk">Create my vault</button>' + (PF.mail.on() ? '<p class="small">Already have one on another device? <a href="#" id="rs">Restore it</a></p>' : "") + "</div>");
    document.getElementById("mk").onclick = async () => {
      const a = document.getElementById("p1").value, b = document.getElementById("p2").value; if (a !== b) return err("The two passphrases differ."); if (a.length < 10) return err("Use at least 10 characters.");
      busy(true); try { const legacy = V.plainLegacy(), r = await V.create(a, legacy); if (legacy) localStorage.removeItem("pf-step1-v1"); V.install(); codeView(r); } catch (x) { busy(false); err(String(x.message || x)); }
    };
    const rs = document.getElementById("rs"); if (rs) rs.onclick = (ev) => { ev.preventDefault(); restoreView(); };
  }
  function codeView(r) {
    shell('<p class="eyebrow">Save this now</p><h1>Your recovery code</h1><p class="lead">If you forget your passphrase, this code is the only other way in. It is shown once. Write it down or save it somewhere safe.</p><div class="card"><div class="big" style="font-size:22px;letter-spacing:2px;word-break:break-all">' + e(r.code) + '</div><p class="small">Vault id: ' + e(r.id) + ' (needed to restore on another device)</p></div><label class="chk"><input type="checkbox" id="ok"> I have saved my recovery code.</label><button class="btn" id="go" disabled>Open Proof Forge</button>');
    document.getElementById("ok").onchange = (ev) => (document.getElementById("go").disabled = !ev.target.checked);
    document.getElementById("go").onclick = start;
  }
  function unlockView() {
    shell('<p class="eyebrow">Your private vault</p><h1>Unlock</h1><div class="card form"><label for="p1">Passphrase or recovery code</label><input id="p1" type="password" autocomplete="current-password"><p id="verr" class="note"></p><button class="btn" id="un">Unlock</button></div>');
    const go = async () => { const v = document.getElementById("p1").value; busy(true); try { await V.unlock(v, /^[A-Za-z2-9]{4}(-[A-Za-z2-9]{4}){4}$/.test(v)); V.install(); start(); } catch (x) { busy(false); err("That did not unlock the vault."); } };
    document.getElementById("un").onclick = go; document.getElementById("p1").onkeydown = (ev) => { if (ev.key === "Enter") go(); };
  }
  function restoreView() {
    shell('<p class="eyebrow">Restore</p><h1>Restore my vault</h1><div class="card form"><label for="vid">Vault id</label><input id="vid" autocomplete="off"><label for="p1">Passphrase or recovery code</label><input id="p1" type="password"><p id="verr" class="note"></p><button class="btn" id="rs2">Restore</button></div>');
    document.getElementById("rs2").onclick = async () => { const id = document.getElementById("vid").value.trim(), v = document.getElementById("p1").value; busy(true); try { await V.restore(id, v, /^[A-Za-z2-9]{4}(-[A-Za-z2-9]{4}){4}$/.test(v)); V.install(); start(); } catch (x) { busy(false); err("Could not restore. Check the id and the passphrase."); } };
  }
  if (/demo=/.test(location.hash) || !window.crypto || !crypto.subtle) start(); else if (V.exists()) unlockView(); else createView();
})();
