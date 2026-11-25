// Guard: every page carries exactly one approved "१३९" mark, and the shared CSS has the approved look. Run: node test/mark139.test.cjs
const assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path");
const ROOT = path.join(__dirname, "..");
const MARK = '<div class="mark139" lang="hi" aria-hidden="true"><span>१३९</span></div>';
const CSS = [
  '.mark139{position:absolute;top:0;left:0;right:0;margin:0;padding:1px 0 0;text-align:center;line-height:1;pointer-events:none;user-select:none;z-index:2147483647;font-family:"Noto Sans Devanagari","Mukta","Nirmala UI","Mangal","Kohinoor Devanagari","Devanagari Sangam MN",sans-serif;font-size:6px;font-weight:700;color:#0B2A6B}',
  ".mark139 span{display:inline-block;border-bottom:.5px solid #7A1010;padding-bottom:.5px}",
];
const count = (s, sub) => s.split(sub).length - 1;
const pages = fs.readdirSync(ROOT).filter((f) => f.endsWith(".html"));
assert.ok(pages.length >= 5, "pages found: " + pages);
for (const f of pages) {
  const s = fs.readFileSync(path.join(ROOT, f), "utf8");
  assert.equal(count(s, 'class="mark139"'), 1, f + ": exactly one mark139");
  assert.ok(s.includes("<body>" + MARK), f + ": the approved markup is the first child of body");
  assert.ok(/href="style\.css"/.test(s), f + ": loads the shared stylesheet");
}
// screens that replace the whole body from script
const life = fs.readFileSync(path.join(ROOT, "js/life.js"), "utf8");
assert.equal(count(life, 'class="mark139"'), 1, "js/life.js: the vault-deleted screen carries one mark");
assert.ok(life.includes("document.body.innerHTML = '" + MARK + "<main"), "js/life.js: approved markup");
for (const f of ["style.css", "style.template.css"]) {
  const s = fs.readFileSync(path.join(ROOT, f), "utf8");
  for (const rule of CSS) assert.equal(count(s, rule), 1, f + ": approved CSS rule present once: " + rule.slice(0, 30));
}
console.log("mark139: " + pages.length + " pages + 1 script screen + 2 stylesheets OK");
