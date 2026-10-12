# Proof Forge: Step 1, "Your idea on trial" then "Your ₹1 cycle" (local prototype)

Run: double-click `run.bat` (or `python -m http.server 8210` here) and open http://127.0.0.1:8210/index.html. No internet, no AI, no cost. State is saved in the browser (localStorage); the Reset button clears it.

Structure (owner decisions 2026-10-12): no timelines shown to anyone, each founder moves at their own pace; Chapter A (3 rounds) questions the idea itself and ends with a verdict (Standing / Fixable / Needs a new direction) plus fixes; Chapter B (4 rounds) is the Rs 1 cycle; Mission 1 = 5 real alternatives with links + one real money cycle with proof.

Demo links (a sample founder, "KurtaKart"): `#demo=verdict`, `#demo=results`, `#demo=q:chain`, `#demo=q:reveal:cycle`, `#demo=mirror:3`, `#demo=story:3`, `#demo=rebuild`, `#demo=mission`, `#demo=submit`, `#demo=fail`, `#demo=pass`.

What is built: 30 business flavours -> 8 shapes (+ a 3-tap router for "pure idea"); 6 units (prelude, tap questions, story, mirror); gut-vs-reason pairs; confidence taps; consistency checks; money-flow engine (cycle days, rotations, break-even, LTV, stress, first peak-cash estimate); castle meter; Reality Score and Reality Card; rebuild (Idea V2); Mission 1 with proof checks, buyer-confirmation page (`witness.html`) and a locked/open gate to Session 2.

Honest limits: 3 of 6 stories are real and sourced (Webvan, Dell, Groupon paper); 3 are placeholders until researched. Buyer confirmations are local (same browser) in this prototype; in production the same checks run on a server. Benchmarks are not shown because none is sourced yet. Name "Proof Forge" is a working name.
Files: js/engine.js (maths + checks + score), js/shapes.js, js/content.js (questions, units, stories), js/ui.js (screens), js/mission.js (Mission 1 + gate), witness.html.
