// Builds dist/ for Cloudflare Pages and SIGNS the release.
// Usage: node tools/build-dist.cjs [audit-public-key.json] [release-private-key.jwk]
// The deployed build runs in cloud mode with demo links off. version.json lists the SHA-256 of every shipped file and is signed with the release key.
const fs = require("node:fs"), path = require("node:path"), cp = require("node:child_process"), { webcrypto: c, createHash } = require("node:crypto");
const root = path.join(__dirname, ".."), out = path.join(root, "dist");
const sha = (b) => createHash("sha256").update(b).digest("hex");
(async () => {
  fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(path.join(out, "js"), { recursive: true });
  for (const f of ["index.html", "witness.html", "go.html", "style.css", "privacy.html", "terms.html"]) fs.copyFileSync(path.join(root, f), path.join(out, f));
  if (fs.existsSync(path.join(root, "assets"))) fs.cpSync(path.join(root, "assets"), path.join(out, "assets"), { recursive: true });
  for (const f of fs.readdirSync(path.join(root, "js"))) fs.copyFileSync(path.join(root, "js", f), path.join(out, "js", f));
  const version = fs.readFileSync(path.join(root, "VERSION"), "utf8").trim();
  let commit = "nogit"; try { commit = cp.execSync("git rev-parse --short HEAD", { cwd: root }).toString().trim(); } catch (e) { /* not a repo */ }
  const release = version + "+" + commit;
  const audit = process.argv[2] ? JSON.parse(fs.readFileSync(process.argv[2], "utf8")) : null;
  const relPub = JSON.parse(fs.readFileSync(path.join(root, "release-public-key.json"), "utf8"));
  fs.writeFileSync(path.join(out, "js", "config.js"), "window.PF = window.PF || {};\nPF.CONFIG = " + JSON.stringify({ cloud: true, demo: false, auditKey: audit, releaseKey: relPub, version: release }) + ";\n");
  fs.writeFileSync(path.join(out, "_headers"), [
    "/*", "  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
    "  X-Content-Type-Options: nosniff", "  X-Frame-Options: DENY", "  Referrer-Policy: no-referrer", "  Permissions-Policy: camera=(), microphone=(), geolocation=()", "  X-Robots-Tag: noindex", "/api/*", "  Cache-Control: no-store", "/version.json", "  Cache-Control: no-store", ""].join("\n"));
  fs.writeFileSync(path.join(out, "robots.txt"), "User-agent: *\nDisallow: /\n");
  // fingerprint every shipped file (not _headers, which the host does not serve as a file, and not version.json itself)
  const files = {}, walk = (d, rel) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const r = rel ? rel + "/" + e.name : e.name; if (e.isDirectory()) walk(path.join(d, e.name), r); else if (!["_headers", "version.json"].includes(r)) files[r] = sha(fs.readFileSync(path.join(d, e.name))); } };
  walk(out, "");
  const manifest = { version: release, builtAt: new Date().toISOString(), files: Object.fromEntries(Object.entries(files).sort()) };
  const body = JSON.stringify(manifest);
  const keyPath = process.argv[3] || path.join(process.env.USERPROFILE || "", "Documents", "proof-forge-RELEASE-PRIVATE-KEY.jwk");
  const priv = await c.subtle.importKey("jwk", JSON.parse(fs.readFileSync(keyPath, "utf8")), { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const sig = Buffer.from(await c.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, priv, Buffer.from(body))).toString("base64");
  fs.writeFileSync(path.join(out, "version.json"), JSON.stringify({ manifest: body, sig }));
  console.log("dist ready, release", release, "-", Object.keys(files).length, "files fingerprinted and signed");
})().catch((e) => { console.error(e.message); process.exit(1); });
