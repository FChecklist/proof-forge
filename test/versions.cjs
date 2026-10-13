// Versions, sync between an old and a new release, "My data", and the tamper stop screen. Run after: node tools/build-dist.cjs audit-public-key.json
// (a signed, non-demo build). It rebuilds the release itself to simulate a new version.
const { chromium } = require("C:/ct/ct/node_modules/@playwright/test"), assert = require("node:assert/strict"), fs = require("node:fs"), cp = require("node:child_process"), path = require("node:path");
const ROOT = path.join(__dirname, ".."), PORT = 8232, B = "http://127.0.0.1:" + PORT, log = (...a) => console.log(...a);
const build = (version) => { fs.writeFileSync(path.join(ROOT, "VERSION"), version + "\n"); cp.execSync("node tools/build-dist.cjs audit-public-key.json", { cwd: ROOT, stdio: "pipe" }); };
(async () => {
  const orig = fs.readFileSync(path.join(ROOT, "VERSION"), "utf8");
  const { start, SECRET } = await import("./dev-cloud.mjs"); const { mintToken } = await import("../functions/api/_access.js");
  try {
    build("1.0.0"); const srv = await start(PORT);
    const token = await mintToken(SECRET, { p: "pay_VERSIONS0001", q: 1, e: "v@example.com", n: "Vee", s: "VeeCo", at: 1 });
    const b = await chromium.launch(), ctx = await b.newContext(), p = await ctx.newPage(); p.on("dialog", (d) => d.accept());
    await p.goto(B + "/index.html#access=" + token); await p.waitForSelector("#p1", { timeout: 20000 });
    const PASS = "correct horse battery"; await p.fill("#p1", PASS); await p.fill("#p2", PASS); await p.click("#mk"); await p.waitForSelector("#go", { timeout: 30000 });
    const vid = (await p.innerText("div[style*=monospace]")).trim(); await p.check("#ok"); await p.click("#go"); await p.waitForSelector("#nm");
    await p.fill("#nm", "Vee"); await p.fill("#st", "VeeCo"); await p.check("#c18"); await p.check("#cc"); await p.click("#startbtn"); await p.waitForTimeout(500);
    // pretend this data was saved by the FIRST release (schema 1: none of the newer fields)
    await p.evaluate(() => { const S = PF.getState(); S.sv = 1; delete S.consents; delete S.mails; S.vers = []; S.marker = "from-release-1"; PF.store.save(S); return PF.vault.flush(); });
    await p.waitForTimeout(800);
    log("1. data saved by release 1.0.0 in the old format (schema 1)");
    // ---- a newer release goes live while the founder still has the page open
    build("1.1.0");
    await p.evaluate(() => window.dispatchEvent(new Event("focus"))); await p.waitForSelector("#pf-newver", { timeout: 10000 });
    log("2. the open page noticed the newer release and showed the update notice");
    await p.click("#pf-newver [data-act=mdreload]"); await p.waitForSelector("#un", { timeout: 20000 });
    await p.fill("#p1", PASS); await p.click("#un"); await p.waitForFunction(() => window.PF && PF.getState && PF.getState().profile, null, { timeout: 30000 });
    const S = await p.evaluate(() => { const S = PF.getState(); return { sv: S.sv, marker: S.marker, consents: S.consents, mails: !!S.mails, vers: S.vers.map((x) => x.v + (x.from ? "<-" + x.from : "")), ver: PF.CONFIG.version }; });
    assert.equal(S.marker, "from-release-1", "nothing from the old release was lost"); assert.equal(S.sv, 2, "the old format was brought forward"); assert.ok(S.consents && S.mails, "new fields exist");
    assert.ok(/^1\.1\.0/.test(S.ver) && S.vers.length === 1 && S.vers[0].startsWith(S.ver), "the version history records the release that opened it: " + JSON.stringify(S.vers));
    log("3. the new release opened the old data: migrated schema 1 -> 2, nothing lost; history =", JSON.stringify(S.vers));
    await p.waitForTimeout(2200); await p.evaluate(() => PF.vault.flush());
    const row = (await (await fetch(B + "/__db")).json()).vault[0]; assert.ok(/^1\.1\.0/.test(row.app_version), "our records show the new software version: " + row.app_version); assert.equal(row.schema_v, 2);
    log("4. kept with us: vault software version =", row.app_version, "| data schema =", row.schema_v);
    // ---- My data: export, e-mail switch, delete
    await p.click("[data-act=mydata]"); await p.waitForSelector("text=My data");
    const dl = p.waitForEvent("download"); await p.click("[data-act=mdexport]"); const f = await dl; const txt = fs.readFileSync(await f.path(), "utf8"); assert.ok(txt.includes("from-release-1") && txt.includes("VeeCo"), "the export holds the founder's own readable data");
    await p.click("[data-act=mdmail]"); assert.equal(await p.evaluate(() => PF.getState().consents.stageMail), false, "e-mails switched off");
    log("5. My data: download works; e-mail switch works");
    await p.click("[data-act=mddel]"); await p.waitForSelector("text=Your vault is deleted", { timeout: 15000 });
    const gone = await fetch(B + "/api/v/" + vid); assert.equal(gone.status, 404, "the vault is erased from our storage"); assert.ok(!(await p.evaluate(() => localStorage.getItem("pf-vault-id"))), "and the device forgets it");
    log("6. delete my vault: erased from our storage and from the device");
    await b.close();
    // ---- tamper: change one shipped file after the release was signed
    const ctx2 = await (await chromium.launch()).newContext(), q = await ctx2.newPage(); const target = path.join(ROOT, "dist", "js", "vault.js"); fs.appendFileSync(target, "\n// tampered\n");
    await q.goto(B + "/index.html#access=" + token); await q.waitForTimeout(2500);
    assert.ok((await q.innerText("body")).includes("does not match our published release") && !(await q.$("#p1")), "a tampered copy refuses to ask for a passphrase");
    log("7. a tampered copy shows the stop screen and asks for no passphrase");
    await ctx2.browser().close(); srv.server.close(); log("VERSIONS PASSED");
  } finally { fs.writeFileSync(path.join(ROOT, "VERSION"), orig); }
  process.exit(0);
})().catch((e) => { console.error("VERSIONS FAILED:", String(e.message).split("\n")[0]); fs.writeFileSync(path.join(ROOT, "VERSION"), "1.0.0\n"); process.exit(1); });
