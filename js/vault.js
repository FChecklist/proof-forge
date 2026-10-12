/* Private vault. The founder's data lives on our storage, and ONLY as ciphertext. It is encrypted and decrypted on the founder's own device
   (WebCrypto, AES-256-GCM) in that device's memory. Nothing readable is ever written to the device's disk or to our servers.
   The data key is wrapped twice: by a key from the passphrase (PBKDF2-SHA256, 600,000 rounds) and by a key from a one-time recovery code.
   Lose both and nothing can bring the data back: that is by design.
   cloud mode (hosted): the only copy is on our storage; the device keeps just the vault id. Offline mode (a local file, no storage): the ciphertext is kept in this browser. */
(function () {
  const PF = (window.PF = window.PF || {}), enc = new TextEncoder(), dec = new TextDecoder(), S_ = crypto.subtle, ITER = 600000;
  const b64 = (buf) => { const a = new Uint8Array(buf); let s = ""; for (let i = 0; i < a.length; i += 8192) s += String.fromCharCode.apply(null, a.subarray(i, i + 8192)); return btoa(s); };
  const ub64 = (t) => Uint8Array.from(atob(t), (c) => c.charCodeAt(0));
  const rnd = (n) => crypto.getRandomValues(new Uint8Array(n));
  const hex = (u) => Array.from(new Uint8Array(u), (x) => x.toString(16).padStart(2, "0")).join("");
  const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const newCode = () => { const r = rnd(20); let s = ""; for (const x of r) s += ALPHA[x % 32]; return s.match(/.{4}/g).join("-"); };
  const kek = async (secret, salt, iter) => S_.deriveKey({ name: "PBKDF2", salt, iterations: iter, hash: "SHA-256" }, await S_.importKey("raw", enc.encode(secret), "PBKDF2", false, ["deriveKey"]), { name: "AES-GCM", length: 256 }, false, ["wrapKey", "unwrapKey"]);
  const wrap = async (dk, secret, iter) => { const salt = rnd(16), iv = rnd(12), k = await kek(secret, salt, iter); return { salt: b64(salt), iv: b64(iv), wk: b64(await S_.wrapKey("raw", dk, k, { name: "AES-GCM", iv })) }; };
  const unwrap = async (w, secret, iter) => S_.unwrapKey("raw", ub64(w.wk), await kek(secret, ub64(w.salt), iter), { name: "AES-GCM", iv: ub64(w.iv) }, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  const META = "pf-vault-meta", DATA = "pf-vault-data", VID = "pf-vault-id";
  let key = null, mem = null, meta = null, secret = null, timer = null, saving = Promise.resolve();
  const cloud = () => !!(PF.mail && PF.mail.on());
  const V = (PF.vault = {});
  V.exists = () => (cloud() ? !!localStorage.getItem(VID) : !!localStorage.getItem(META));
  V.knownId = () => localStorage.getItem(VID) || "";
  V.unlocked = () => !!key;
  V.encrypt = async (obj, k) => { const iv = rnd(12); return JSON.stringify({ iv: b64(iv), ct: b64(await S_.encrypt({ name: "AES-GCM", iv }, k || key, enc.encode(JSON.stringify(obj)))) }); };
  V.decrypt = async (text, k) => { const o = JSON.parse(text); return JSON.parse(dec.decode(await S_.decrypt({ name: "AES-GCM", iv: ub64(o.iv) }, k || key, ub64(o.ct)))); };
  // the write secret is derived from the data key itself, so any way of unlocking (passphrase or recovery code) can save
  const writeSecret = async (k) => hex(await S_.encrypt({ name: "AES-GCM", iv: new Uint8Array(12) }, k, enc.encode("pf-write-v1")));

  V.create = async (pass, initial) => {
    if (!pass || pass.length < 10) throw new Error("Passphrase must be at least 10 characters.");
    const dk = await S_.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]), code = newCode();
    meta = { v: 1, iter: ITER, id: hex(rnd(16)), pass: await wrap(dk, pass, ITER), rec: await wrap(dk, code.replace(/-/g, ""), ITER) };
    key = await unwrap(meta.pass, pass, ITER); secret = await writeSecret(key); mem = initial || {};
    await put(); // cloud mode: refuse to continue unless our storage has the locked copy
    if (cloud()) localStorage.setItem(VID, meta.id); else localStorage.setItem(META, JSON.stringify(meta));
    return { code, id: meta.id };
  };
  V.unlock = async (idOrNull, pass, byCode) => {
    let blob;
    if (cloud()) {
      const id = (idOrNull || "").trim(), r = await fetch("/api/v/" + encodeURIComponent(id)); if (!r.ok) throw new Error("not found");
      const j = await r.json(); meta = Object.assign(j.meta, { id }); blob = j.blob;
    } else { meta = JSON.parse(localStorage.getItem(META)); if (!meta) throw new Error("No vault on this device."); blob = localStorage.getItem(DATA); }
    key = await unwrap(byCode ? meta.rec : meta.pass, byCode ? pass.replace(/-/g, "").toUpperCase() : pass, meta.iter);
    secret = await writeSecret(key); mem = blob ? await V.decrypt(blob) : {};
    if (cloud()) localStorage.setItem(VID, meta.id);
    return true;
  };
  V.lock = () => { key = null; mem = null; meta = null; secret = null; };

  // push the locked copy. In cloud mode a failed save is reported on screen and retried; the data stays in memory meanwhile.
  const put = async () => {
    if (!key) return; const blob = mem === null ? null : await V.encrypt(mem);
    if (!cloud()) { if (blob === null) localStorage.removeItem(DATA); else localStorage.setItem(DATA, blob); return; }
    if (blob === null) return;
    const m = { v: meta.v, iter: meta.iter, pass: meta.pass, rec: meta.rec };
    const r = await fetch("/api/v/" + meta.id, { method: "PUT", headers: { "x-write": secret, "content-type": "application/json" }, body: JSON.stringify({ meta: m, blob }), keepalive: blob.length < 60000 });
    if (!r.ok) throw new Error("save failed " + r.status);
  };
  const banner = (on) => { let b = document.getElementById("pf-save-warn"); if (on && !b) { b = document.createElement("div"); b.id = "pf-save-warn"; b.setAttribute("role", "alert"); b.style.cssText = "position:fixed;bottom:0;left:0;right:0;background:#B91C1C;color:#fff;padding:10px;text-align:center;z-index:99"; b.textContent = "Could not save to our storage. Your work is safe in this window; keep it open. Retrying."; document.body.appendChild(b); } else if (!on && b) b.remove(); };
  const flush = (tries) => { saving = saving.then(() => put()).then(() => banner(false), () => { banner(true); setTimeout(() => flush((tries || 0) + 1), Math.min(30000, 2000 * ((tries || 0) + 1))); }); return saving; };
  V.flush = () => { clearTimeout(timer); return flush(0); };
  V.install = () => {
    PF.store.load = () => mem && Object.keys(mem).length ? mem : null; PF.store.save = (s) => { mem = s; clearTimeout(timer); timer = setTimeout(() => flush(0), 400); }; PF.store.reset = () => { mem = {}; clearTimeout(timer); flush(0); };
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") V.flush(); });
    window.addEventListener("beforeunload", (e) => { if (cloud() && timer) { e.preventDefault(); e.returnValue = ""; } });
  };
  V.plainLegacy = () => { try { return JSON.parse(localStorage.getItem("pf-step1-v1")); } catch (e) { return null; } };

  // the audit pack: the founder's claim bundle, readable only by the audit team's private key (hybrid RSA-OAEP + AES-GCM)
  V.auditPack = async (bundle, jwk) => {
    const pub = await S_.importKey("jwk", jwk, { name: "RSA-OAEP", hash: "SHA-256" }, false, ["wrapKey"]), ak = await S_.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
    return JSON.stringify({ v: 1, wk: b64(await S_.wrapKey("raw", ak, pub, { name: "RSA-OAEP" })), body: await V.encrypt(bundle, ak) });
  };
  V.auditOpen = async (pack, privJwk) => {
    const p = JSON.parse(pack), priv = await S_.importKey("jwk", privJwk, { name: "RSA-OAEP", hash: "SHA-256" }, false, ["unwrapKey"]);
    return V.decrypt(p.body, await S_.unwrapKey("raw", ub64(p.wk), priv, { name: "RSA-OAEP" }, { name: "AES-GCM", length: 256 }, false, ["decrypt"]));
  };
})();
