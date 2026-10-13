# Proof Forge

A 12-step, tap-only founder programme. Runs on the founder's own phone or laptop. The founder pays ₹19,999 per startup and earns it back: half at Step 9 (a quarter of their own funding target in the bank), all of it at Step 12 (half of their sales, profit and funding targets, each proven by other people). See `PROMISE.md` for the reasoning, `AUDIT.md` for the 18-point audit.

## How it is built
- **Everything runs in the browser** (static files, no AI, no server compute). Our server only stores ciphertext and relays messages.
- **Free only:** Cloudflare Pages + Pages Functions + D1; Resend (e-mail free tier); GitHub Actions (free minutes). No R2, no paid add-ons.
- **Privacy:** the founder's data is AES-256-GCM encrypted on their device (key from passphrase + recovery code) before it is stored; answers from other people are sealed with a per-link key that sits after the `#` of the link. The only things readable on the device are the vault id and a random browser id.
- **Payment:** the coach site (`C:\ct\startup-coach-site`) takes payment through IT Services by Rajat Agarwal / Razorpay, verifies it, and e-mails a private access link. The link carries a sealed token; the vault cannot be created without it.
- **Tamper evidence:** every release is fingerprinted and signed (`tools/build-dist.cjs`); the page checks itself, and `tools/verify-live.cjs` (run hourly by `.github/workflows/verify-live.yml`) checks the live site from outside.

## Folders
- `js/` the app (`engine, shapes, content, game, mission, steps234, missions234, steps5to8, steps9to12, rebate, stories, life, integrity, vault, wcrypto, mail, boot, ui`); `witness.html`, `go.html` the pages other people open; `privacy.html`, `terms.html`.
- `functions/api/` Pages Functions: `v` vault, `w` answer mailbox, `g` visitor events, `n` stage e-mails, `c` refund claims. `migrations/0001_init.sql` the D1 schema.
- `tools/` `build-dist.cjs` (build + sign), `verify-live.cjs`, `claims.cjs` (owner's refund tool), `gen-audit-key.cjs`, `gen-release-key.cjs`, `deploy.ps1`.
- `test/` `server.test.mjs`, `claims.test.cjs`, `journey.cjs` (the full 12-step end-to-end), `versions.cjs`.

## Run the tests
    node test/server.test.mjs
    node test/claims.test.cjs
    PF_DEMO=1 node tools/build-dist.cjs audit-public-key.json && node test/journey.cjs
    node tools/build-dist.cjs audit-public-key.json && node test/versions.cjs

## Deploy (free)
Needs a Cloudflare API token that also has Account > D1 > Edit. Then: `powershell -File tools/deploy.ps1`. Pages secrets (ACCESS_SECRET, IP_SALT, RESEND_API_KEY) are already set on the `proof-forge` project; the same ACCESS_SECRET is on the coach site. Then set the repository variable `SITE_URL` so the hourly check starts.

## Keys (never in this repo)
- Release signing key: `C:\Users\Dell\Documents\proof-forge-RELEASE-PRIVATE-KEY.jwk`. Audit key: `...\proof-forge-AUDIT-PRIVATE-KEY.jwk`. Back both up offline.
- `ACCESS_SECRET` and `IP_SALT` are in `C:\ct\ct\.env.local` (git-ignored) and in the Pages secrets.
