/* Deployment settings. cloud:false = fully offline, everything stays on this device.
   cloud:true (set when hosted with the Pages Functions in /functions) copies the encrypted vault and the witness answers to our free D1 storage. auditKey = the audit team's PUBLIC key (JWK, RSA-OAEP).
   The matching private key never lives in this repo: make it with tools/gen-audit-key.cjs and keep it offline. */
window.PF = window.PF || {};
PF.CONFIG = { cloud: false, auditKey: null };
