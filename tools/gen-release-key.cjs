// Makes the RELEASE signing key pair (ECDSA P-256). Usage: node tools/gen-release-key.cjs <private-key-output-path>
// Public key -> printed (saved as release-public-key.json and shipped in the build). Private key -> the path you give. Keep it offline.
// Whoever holds the private key can sign a release that every checker will accept.
const { webcrypto: c } = require("node:crypto"), fs = require("node:fs");
(async () => {
  const out = process.argv[2]; if (!out) { console.error("give a path for the private key file"); process.exit(1); }
  const kp = await c.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
  fs.writeFileSync(out, JSON.stringify(await c.subtle.exportKey("jwk", kp.privateKey)), { mode: 0o600 });
  console.log(JSON.stringify(await c.subtle.exportKey("jwk", kp.publicKey)));
})();
