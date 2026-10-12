/* Deployment settings.
   cloud:false = a local file, everything stays in this browser (encrypted). cloud:true = hosted with the Pages Functions in /functions:
   the founder's locked data and the encrypted answers from other people live in our free D1 storage, and nothing readable is kept on the device.
   demo:true lets #demo= links run unencrypted for testing. It is false in the deployed build.
   auditKey = the audit team's PUBLIC key (JWK, RSA-OAEP). The matching private key never lives in this repo: make it with tools/gen-audit-key.cjs. */
window.PF = window.PF || {};
PF.CONFIG = { cloud: false, demo: true, auditKey: null };
