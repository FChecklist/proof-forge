// Makes the audit team's key pair. Usage: node tools/gen-audit-key.cjs <private-key-output-path>
// The PUBLIC key is printed (paste it into js/config.js as PF.CONFIG.auditKey). The PRIVATE key is written to the path you give.
// Keep the private file offline, outside this repository. Whoever holds it can open every audit pack.
const { webcrypto: c } = require("node:crypto"), fs = require("node:fs");
(async () => {
  const out = process.argv[2]; if (!out) { console.error("give a path for the private key file"); process.exit(1); }
  const kp = await c.subtle.generateKey({ name: "RSA-OAEP", modulusLength: 3072, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["wrapKey", "unwrapKey"]);
  fs.writeFileSync(out, JSON.stringify(await c.subtle.exportKey("jwk", kp.privateKey)), { mode: 0o600 });
  console.log(JSON.stringify(await c.subtle.exportKey("jwk", kp.publicKey)));
})();
