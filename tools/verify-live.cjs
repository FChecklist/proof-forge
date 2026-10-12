// Outside tamper check. Fetches the LIVE site, checks the release signature with the public key in THIS repo (not the one the site serves),
// then re-fingerprints every live file. Exit 0 = the site is exactly the signed release. Exit 1 = something changed.
// Usage: node tools/verify-live.cjs https://proof-forge.pages.dev   (run it on a schedule; any failure means act at once)
const fs = require("node:fs"), path = require("node:path"), { webcrypto: c, createHash } = require("node:crypto");
const base = (process.argv[2] || "").replace(/\/$/, ""); if (!base) { console.error("give the site address"); process.exit(2); }
const get = async (p) => { const r = await fetch(base + "/" + p, { cache: "no-store" }); if (!r.ok) throw new Error(p + " -> HTTP " + r.status); return Buffer.from(await r.arrayBuffer()); };
(async () => {
  const pub = await c.subtle.importKey("jwk", JSON.parse(fs.readFileSync(path.join(__dirname, "..", "release-public-key.json"), "utf8")), { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
  const v = JSON.parse((await get("version.json")).toString());
  if (!(await c.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, pub, Buffer.from(v.sig, "base64"), Buffer.from(v.manifest)))) { console.error("TAMPERED: the release list is not signed by our key"); process.exit(1); }
  const m = JSON.parse(v.manifest), bad = [];
  for (const [f, h] of Object.entries(m.files)) { try { if (createHash("sha256").update(await get(f)).digest("hex") !== h) bad.push(f + " (changed)"); } catch (e) { bad.push(f + " (" + e.message + ")"); } }
  if (bad.length) { console.error("TAMPERED: " + bad.length + " file(s) differ from release " + m.version + ":\n  " + bad.join("\n  ")); process.exit(1); }
  console.log("OK: the live site is exactly release " + m.version + " (" + Object.keys(m.files).length + " files verified)");
})().catch((e) => { console.error("CHECK FAILED:", e.message); process.exit(1); });
