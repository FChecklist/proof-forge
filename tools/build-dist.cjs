// Builds dist/ for Cloudflare Pages. Usage: node tools/build-dist.cjs [audit-public-key.json]
// The deployed build runs in cloud mode with demo links switched off, and ships the audit PUBLIC key if given.
const fs = require("node:fs"), path = require("node:path"), root = path.join(__dirname, ".."), out = path.join(root, "dist");
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(path.join(out, "js"), { recursive: true });
for (const f of ["index.html", "witness.html", "go.html", "style.css"]) fs.copyFileSync(path.join(root, f), path.join(out, f));
if (fs.existsSync(path.join(root, "assets"))) fs.cpSync(path.join(root, "assets"), path.join(out, "assets"), { recursive: true });
for (const f of fs.readdirSync(path.join(root, "js"))) fs.copyFileSync(path.join(root, "js", f), path.join(out, "js", f));
const key = process.argv[2] ? JSON.parse(fs.readFileSync(process.argv[2], "utf8")) : null;
fs.writeFileSync(path.join(out, "js", "config.js"), "window.PF = window.PF || {};\nPF.CONFIG = " + JSON.stringify({ cloud: true, demo: false, auditKey: key }) + ";\n");
fs.writeFileSync(path.join(out, "_headers"), [
  "/*", "  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
  "  X-Content-Type-Options: nosniff", "  X-Frame-Options: DENY", "  Referrer-Policy: no-referrer", "  Permissions-Policy: camera=(), microphone=(), geolocation=()", "  X-Robots-Tag: noindex", "/api/*", "  Cache-Control: no-store", ""].join("\n"));
fs.writeFileSync(path.join(out, "robots.txt"), "User-agent: *\nDisallow: /\n");
console.log("dist ready:", fs.readdirSync(out).join(", "));
