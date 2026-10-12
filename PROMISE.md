# The deal: decision record (updated 2026-10-12)

Owner model: the founder pays Rs 19,999 and earns it back.
- Tier A, Step 9: money in the founder's bank is at least 25% of the funding target they set -> half back (Rs 9,999).
- Tier B, Step 12: monthly sales >= 50% of the sales target, money raised in total >= 50% of the funding target, net margin >= 50% of the margin they stated -> all Rs 19,999 back in total.

## What I accepted, changed and added
- **Accepted:** the whole rebate idea. It is better than a funding guarantee: we promise nothing about third parties, and only pay founders who actually delivered.
- **Changed Step order:** money cannot be in the bank at Step 9 if terms and papers come after it. Step 9 now holds meetings, terms, papers and the money. Steps 10-12 are now sales, profit, and the rest of the money plus the claim.
- **Interpretation to confirm:** "50% of the profit % they said" = achieved margin >= half the stated margin (stated 20% -> need 10%). "Funds 100%" read as 100% of the fee back.
- **Targets are set in Step 1, revised once in Step 2, locked when Mission 2 passes, never lowered.** Floors: funding >= Rs 5 lakh, monthly sales >= Rs 1 lakh, margin 5-50%. The investor-ready gate checks the Step 4 ask is within half and double of the funding target. A warning shows when the margin target exceeds the founder's own cost numbers.
- **Anti-gaming (the refund makes cheating pay, so proof is strict):** money counts only when a funder confirms it AND bank proof is attached; founders' own money counts 0; money from friends/family counts at most equal to money from strangers (so at most half); one confirmation per device. Sales: latest 30 days only, accountant-confirmed, >= 10 customer confirmations of which >= 70% strangers, no customer > 40%, <= 50% from people they know, ledger + bank files. Profit: accountant states sales and net profit after every cost for the same 30 days as Mission 10 (within 10%). A person audits every claim before payment; a false claim ends the refund.
- **Business reality:** at these bars most founders will not earn the refund. The Rs 19,999 is effectively a commitment deposit. That is fine, and honest, if it is advertised that way ("get it back as you earn it"), not as a guarantee of funding.

## Owner/lawyer decisions still open
Floors above; refund timing (suggest: paid after audit and a 30-day no-reversal check); tax/GST treatment of a refund; refund terms in the sale contract; who audits.

## Punchline (2026-10-12)
Rejected: "get it back as you earn it" (flat), "Make it work, and it's free" (vague). Current: **"₹19,999 to start. ₹0 if you win."** with the conditions directly under it on the intro screen ("win" = the Step 9 and Step 12 targets). Alternates: "Back yourself. We will pay you back." / "Your startup pays your fee." / "Raise it. Prove it. Get it back." Never use an unconditional "free" or "guaranteed".

## Architecture (no server compute, free tier only)
- All logic runs on the founder's laptop or phone. Their data is encrypted on the device (AES-256-GCM; key wrapped by a PBKDF2-600k passphrase key and by a one-time recovery code). We hold only ciphertext (optional copy in Cloudflare D1 for restore on another device). Lost passphrase and recovery code = data lost, by design.
- Witness answers (funders, accountants, customers) go to an append-only D1 mailbox the founder cannot edit. IPs are stored only as salted hashes, for fraud checks at audit.
- At claim time the founder locks their bundle to the audit team's public key (RSA-OAEP + AES-GCM). Generate the pair with tools/gen-audit-key.cjs; the private key stays offline.
- Free only: Cloudflare Pages + Functions + D1. No R2 (may need a card), so bank statements and papers are not stored by us; the founder sends them with the audit pack.
- Not deployed. To deploy: create the D1 database, run migrations/0001_init.sql, bind it as DB, set PF.CONFIG.cloud = true and PF.CONFIG.auditKey.

## Versioning, tamper evidence and our records (2026-10-12)
- Every release has a version (file VERSION + git commit). `node tools/build-dist.cjs` fingerprints every shipped file (SHA-256) into version.json and signs it with the RELEASE key (private key at C:\Users\Dell\Documents\proof-forge-RELEASE-PRIVATE-KEY.jwk, offline, owner-held; public key release-public-key.json).
- Inside the page, js/integrity.js checks the signature and every file before it asks for a passphrase; on a mismatch it shows a stop screen. Swapped code could skip that, so the real defence is OUTSIDE: `node tools/verify-live.cjs <site>` uses the public key in this repo and exits 1 on any change. Schedule it (hourly) from somewhere we control; any failure means act at once and rotate the Cloudflare token.
- Our records (D1 audit_log, hash-chained so an edited or removed row is detected): time, event (vault_open, vault_save, answer, visitor), vault id, browser id (random, made by the browser; NOT a hardware id, which websites cannot and should not read), software version, salted address hash. Never content. State this in the privacy notice.
