/* Private vault: the founder's data is encrypted on their own device (AES-256-GCM, WebCrypto) before it is stored anywhere.
   We (and anyone who gets the stored data) only ever hold ciphertext. The data key is wrapped twice: by a key from the passphrase
   (PBKDF2-SHA256, 600,000 rounds) and by a key from a one-time recovery code. Lose both and nothing can bring the data back: that is by design.
   Optionally the encrypted blob is also copied to our free storage (PF.CONFIG.api) so the founder can restore on another device. */
(function () {
  const PF = (window.PF = window.PF || {}), enc = new TextEncoder(), dec = new TextDecoder(), S_ = crypto.subtle, ITER = 600000;
  const b64 = (buf) => { const a = new Uint8Array(buf); let s = ""; for (let i = 0; i < a.length; i += 8192) s += String.fromCharCode.apply(null, a.subarray(i, i + 8192)); return btoa(s); };
  const ub64 = (t) => Uint8Array.from(atob(t), (c) => c.charCodeAt(0));
  const rnd = (n) => crypto.getRandomValues(new Uint8Array(n));
  const hex = (u) => Array.from(u, (x) => x.toString(16).padStart(2, "0")).join("");
  const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const newCode = () => { const r = rnd(20); let s = ""; for (const x of r) s += ALPHA[x % 32]; return s.match(/.{4}/g).join("-"); };
  const kek = async (secret, salt, iter) => S_.deriveKey({ name: "PBKDF2", salt, iterations: iter, hash: "SHA-256" }, await S_.importKey("raw", enc.encode(secret), "PBKDF2", false, ["deriveKey"]), { name: "AES-GCM", length: 256 }, false, ["wrapKey", "unwrapKey"]);
  const wrap = async (dk, secret, iter) => { const salt = rnd(16), iv = rnd(12), k = await kek(secret, salt, iter); return { salt: b64(salt), iv: b64(iv), wk: b64(await S_.wrapKey("raw", dk, k, { name: "AES-GCM", iv })) }; };
  const unwrap = async (w, secret, iter) => S_.unwrapKey("raw", ub64(w.wk), await kek(secret, ub64(w.salt), iter), { name: "AES-GCM", iv: ub64(w.iv) }, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  const META = "pf-vault-meta", DATA = "pf-vault-data";
  let key = null, mem = null, timer = null;
  const V = (PF.vault = {});
  V.meta = () => { try { return JSON.parse(localStorage.getItem(META)); } catch (e) { return null; } };
  V.exists = () => !!V.meta();
  V.unlocked = () => !!key;
  V.encrypt = async (obj, k) => { const iv = rnd(12); return JSON.stringify({ iv: b64(iv), ct: b64(await S_.encrypt({ name: "AES-GCM", iv }, k || key, enc.encode(JSON.stringify(obj)))) }); };
  V.decrypt = async (text, k) => { const o = JSON.parse(text); return JSON.parse(dec.decode(await S_.decrypt({ name: "AES-GCM", iv: ub64(o.iv) }, k || key, ub64(o.ct)))); };

  // create a vault; returns the one-time recovery code and the vault id (shown once, the founder keeps both)
  V.create = async (pass, initial) => {
    if (!pass || pass.length < 10) throw new Error("Passphrase must be at least 10 characters.");
    const dk = await S_.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]), code = newCode();
    const meta = { v: 1, iter: ITER, id: hex(rnd(16)), secret: hex(new Uint8Array(await S_.digest("SHA-256", enc.encode("pf-write|" + code.replace(/-/g, ""))))).slice(0, 32), pass: await wrap(dk, pass, ITER), rec: await wrap(dk, code.replace(/-/g, ""), ITER) };
    localStorage.setItem(META, JSON.stringify(meta));
    key = await unwrap(meta.pass, pass, ITER); mem = initial || null; await flush();
    return { code, id: meta.id };
  };
  V.unlock = async (pass, byCode) => { const m = V.meta(); if (!m) throw new Error("No vault on this device."); key = await unwrap(byCode ? m.rec : m.pass, byCode ? pass.replace(/-/g, "").toUpperCase() : pass, m.iter); const t = localStorage.getItem(DATA); mem = t ? await V.decrypt(t) : null; return true; };
  V.lock = () => { key = null; mem = null; };

  const flush = async () => { if (!key) return; if (mem === null) { localStorage.removeItem(DATA); return; } const t = await V.encrypt(mem); localStorage.setItem(DATA, t); if (PF.mail && PF.mail.pushVault) PF.mail.pushVault(V.meta(), t); };
  V.flush = flush;
  // the app's store now keeps plain data in memory only; what reaches storage is ciphertext
  V.install = () => {
    PF.store.load = () => mem; PF.store.save = (s) => { mem = s; clearTimeout(timer); timer = setTimeout(flush, 400); }; PF.store.reset = () => { mem = null; clearTimeout(timer); flush(); };
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") { clearTimeout(timer); flush(); } });
  };
  // restore on another device from the remote copy: needs the vault id and the passphrase (or recovery code)
  V.restore = async (id, pass, byCode) => {
    const r = await fetch("/api/v/" + encodeURIComponent(id)); if (!r.ok) throw new Error("No vault with that id.");
    const j = await r.json(); const meta = Object.assign(j.meta, { id }); if (byCode) meta.secret = hex(new Uint8Array(await S_.digest("SHA-256", enc.encode("pf-write|" + pass.replace(/-/g, "").toUpperCase())))).slice(0, 32); localStorage.setItem(META, JSON.stringify(meta)); localStorage.setItem(DATA, j.blob); return V.unlock(pass, byCode);
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
