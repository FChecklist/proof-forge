/* Self-check. Before the founder is asked for a passphrase, this copy of the app checks itself against the signed release list (version.json):
   the list must carry our release signature, and every file the browser would load must match its fingerprint. A mismatch means this copy is not the
   release we published. This catches damaged or swapped files. It cannot be the only line of defence, because code that has been swapped could also skip the check:
   the independent check is tools/verify-live.cjs, run from outside against the live site. */
(function () {
  const PF = (window.PF = window.PF || {}), S_ = crypto.subtle;
  const hex = (b) => Array.from(new Uint8Array(b), (x) => x.toString(16).padStart(2, "0")).join("");
  PF.integrity = {
    async check() {
      try {
        if (!PF.mail.on() || !PF.CONFIG.releaseKey) return { ok: true, skipped: true };
        const v = await (await fetch("/version.json", { cache: "no-store" })).json();
        const pub = await S_.importKey("jwk", PF.CONFIG.releaseKey, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
        const sig = Uint8Array.from(atob(v.sig), (c) => c.charCodeAt(0));
        if (!(await S_.verify({ name: "ECDSA", hash: "SHA-256" }, pub, sig, new TextEncoder().encode(v.manifest)))) return { ok: false, why: "The release list is not signed by us." };
        const m = JSON.parse(v.manifest), bad = [];
        await Promise.all(Object.entries(m.files).map(async ([f, h]) => { try { const r = await fetch("/" + f, { cache: "no-store" }); if (!r.ok || hex(await S_.digest("SHA-256", await r.arrayBuffer())) !== h) bad.push(f); } catch (e) { bad.push(f); } }));
        if (bad.length) return { ok: false, why: bad.length + " file(s) differ from the published release.", bad };
        if (PF.CONFIG.version && PF.CONFIG.version !== m.version) return { ok: false, why: "Version mismatch." };
        return { ok: true, version: m.version };
      } catch (e) { return { ok: false, why: "Could not verify this copy." }; }
    },
  };
})();
