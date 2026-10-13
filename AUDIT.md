# Proof Forge: the 18-point audit (2026-10-13)

Legend: DONE = built and tested here. READY = built and tested, waiting on one outside step. NOT TESTED LIVE = needs the real world.

| # | Item | Status | Evidence |
|---|---|---|---|
| 1 | Hourly outside tamper check on GitHub | READY | `.github/workflows/verify-live.yml` (hourly, free). GitHub's servers were unreachable from this laptop (connection timeouts), so the repo is not created yet. Once it is: set repo variable `SITE_URL`. `tools/verify-live.cjs` tested on a clean copy (passes) and a one-file change (fails, names the file). |
| 2 | Single-page website, all content | READY | `C:\ct\startup-coach-site`: punchline, the deal, the 12 real steps, form with privacy consent, FAQ, policy links. 29 tests pass; builds. Not deployed (its links point to the app, which is not live). Marketing claims taken from your deck (₹1 lakh crore, ~8x, "under 6 months", "10 seats a month") are not verified by me. |
| 3 | Sign-in to full life cycle | DONE | No accounts: pay -> private access link -> passphrase vault (+ recovery code + vault id) -> unlock on any device -> work -> My data (see, export, e-mail switch, delete). `test/journey.cjs`, `test/versions.cjs`. |
| 4 | Gamification | DONE | XP, 9 levels, stars, badges, coins, level-up screens. Full run reaches level 9 (Earner) with ~11,000 XP and 7 badges. Level scale fixed (it was unreachable). |
| 5 | All 12 steps run and tested | DONE | `test/journey.cjs`: every step through the real screens, 482 taps. Steps 1-12 use real sealed answers from other "people", not demo shortcuts. |
| 6 | E-mails at each stage | DONE (mocked sending) | Payment + access link; vault created; Steps 1-11 passed (11 mails); half deposit earned; full deposit earned; refund sent; owner alerts. Sent once each. Real delivery through Resend not tested live. |
| 7 | Payment through IT Services by Rajat Agarwal | NOT TESTED LIVE | Order opens through the central IT Services route (fallback direct Razorpay), notes carry product `startup_coach`; signature + amount checks; 29 tests. A real payment is needed to prove it end to end. |
| 8 | End-to-end testing | DONE | journey (all steps, claims, e-mails, privacy audit, second device), versions (migration, update notice, My data, delete, tamper stop), server, claims tool, coach site. All with the real security headers. |
| 9 | All edits completed | DONE | Punchline; rebate model; locked targets; cloud-first encrypted vault; sealed answers; versions and tamper evidence; hash-chained log; 8 new real, sourced stories added to the earlier ones; empty story slots removed; demo shortcuts hidden in the live build. |
| 10 | Uses the user's RAM, minimal server | DONE | Page uses ~10 MB of JavaScript memory. Server only stores/relays ciphertext: ~1,040 data-changing statements per full journey, so ~96 full journeys a day inside the free limit. |
| 11 | Encryption at every step | DONE | Device: only vault id + random browser id (checked). Storage: ciphertext only (names, e-mails, answers searched for and not found). Other people's answers sealed with per-link keys. Claims locked to the audit key. Honest exceptions: our records hold the payment reference (to refund the right payment), a scrambled address hash, event type, vault id, software version. |
| 12 | DPDP compliance | READY | Privacy notice, consent tick (recorded in the order), 18+ gate, see/export/delete in My data, grievance officer, retention, processors named. Needs: lawyer review; a scheduled job for the 12-month inactivity clean-up (promised, not built); processor agreements. |
| 13 | Software version kept with us | DONE | Each vault row stores software version + data schema; each device keeps its release history. |
| 14 | Sync between new and old version | DONE | Data saved in schema 1 opened by release 1.1.0: migrated to schema 2, nothing lost; open page shows "newer version ready" and reloads safely. |
| 15 | Whole product end to end | DONE locally | See 8. Not yet on the real internet (see "Blocked"). |
| 16 | Zero cost | DONE (with two notes) | Cloudflare Pages/Functions/D1 free (D1 5 GB, 5M reads and 100k writes a day; Functions 100k requests a day; static unlimited), Resend free (3,000 e-mails/month; a full journey sends 16), GitHub Actions free minutes, `pages.dev` address (a custom domain would cost). Notes: Razorpay charges per payment, and does not return its fee on a refund, so each full refund costs us roughly the gateway fee (about 2%, about ₹400-500; check your plan). |
| 17 | Payment cycle complete | READY | Pay -> verify -> access link -> program -> claim A/B (locked pack, e-mails) -> owner audits (`tools/claims.cjs open`) -> `approve --execute` refunds 9,999 then 10,000 through Razorpay and e-mails the buyer. Tested with stand-ins: dry run moves no money, refunds never twice. The first real refund must be watched. |
| 18 | End-to-end working | READY | As 15, once deployed. |

## Blocked (only you can do)
1. **Cloudflare token needs D1 permission** (Account > D1 > Edit), or the database cannot be created. Then `tools/deploy.ps1` finishes everything.
2. **GitHub**: network from this laptop timed out; retry later, or push from another network.
3. **Back up** the two private keys in `C:\Users\Dell\Documents` offline.
4. **Lawyer** to review `privacy.html`, `terms.html`, the refund promise, and the timelines promised in the terms (audit within 15 working days, payment within 7).
5. **Decide**: floors for targets (₹5 lakh funding, ₹1 lakh monthly sales, margin 5-50%).

## Known limits (honest)
- Proof is self-reported by people the founder chooses. Fake "strangers" on other devices can pass the automatic checks; the human audit and call-backs are the real defence.
- A swapped website could capture passphrases: mitigated (signed releases, in-page and outside checks, strict headers), not eliminated.
- No reminder or nudge e-mails (needs a scheduler).
- Refund claims need the audit public key in the build (done) and the founder's browser to be online at the Step 9 and Step 12 pass; if it was not, the claim is retried the next time the verdict screen opens.
