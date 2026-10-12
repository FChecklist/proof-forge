/* Per-link encryption for answers from other people (funders, accountants, customers, visitors).
   The founder's device makes a random key for each link and puts it after the # in the link. A browser never sends the part after the #
   to any server, so our storage only ever holds ciphertext. The founder keeps the keys inside their own encrypted vault. */
(function () {
  const PF = (window.PF = window.PF || {}), enc = new TextEncoder(), dec = new TextDecoder(), S_ = crypto.subtle;
  const b64u = (buf) => btoa(String.fromCharCode.apply(null, new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const ub64u = (t) => { t = t.replace(/-/g, "+").replace(/_/g, "/"); while (t.length % 4) t += "="; return Uint8Array.from(atob(t), (c) => c.charCodeAt(0)); };
  const imp = (k) => S_.importKey("raw", ub64u(k), "AES-GCM", false, ["encrypt", "decrypt"]);
  PF.wc = {
    newKey: () => b64u(crypto.getRandomValues(new Uint8Array(16))),
    async seal(obj, key) { const iv = crypto.getRandomValues(new Uint8Array(12)); return JSON.stringify({ iv: b64u(iv), ct: b64u(await S_.encrypt({ name: "AES-GCM", iv }, await imp(key), enc.encode(JSON.stringify(obj)))) }); },
    async open(text, key) { const o = JSON.parse(text); return JSON.parse(dec.decode(await S_.decrypt({ name: "AES-GCM", iv: ub64u(o.iv) }, await imp(key), ub64u(o.ct)))); },
    keyFromHash: () => { const m = /[#&]k=([A-Za-z0-9_-]{16,64})/.exec(location.hash); return m ? m[1] : null; },
  };
  // the founder's side: one key per link, remembered in the (encrypted) state
  PF.wkey = (S, t) => { S.wkeys = S.wkeys || {}; if (!S.wkeys[t]) { S.wkeys[t] = PF.wc.newKey(); try { PF.store.save(S); } catch (e) { /* ignore */ } } return S.wkeys[t]; };
  PF.hdr = () => ({ "x-pf-version": (PF.CONFIG && PF.CONFIG.version) || "dev", "x-pf-device": PF.deviceId ? PF.deviceId() : "none" });
  PF.wsuffix = (S, t) => "#k=" + PF.wkey(S, t);
})();
