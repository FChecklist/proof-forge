(function () {
  const q = new URLSearchParams(location.search), t = q.get("t"), who = q.get("n") || "a student founder", what = q.get("u") || "a new idea", price = Number(q.get("p") || 0);
  const el = document.getElementById("w"), key = "pf-go-" + t, dev = PF.deviceId();
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const read = () => { try { return JSON.parse(localStorage.getItem(key)) || { visits: {}, signups: [], preorders: [] }; } catch (e) { return { visits: {}, signups: [], preorders: [] }; } };
  const write = (g) => localStorage.setItem(key, JSON.stringify(g));
  document.getElementById("sub").textContent = what;
  const K = PF.wc.keyFromHash(), cloud = PF.CONFIG.cloud && location.protocol !== "file:" && !!K;
  const post = (e) => PF.wc.seal(e, K).then((c) => fetch("/api/g/" + t, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ c }) })).then((r) => { if (!r.ok) throw new Error("x"); });
  if (t && cloud) { if (!localStorage.getItem("pf-gvis-" + t)) post({ t: "visit", device: dev, at: Date.now() }).then(() => localStorage.setItem("pf-gvis-" + t, "1")).catch(() => {}); }
  else if (t) { const g = read(); g.visits[dev] = g.visits[dev] || Date.now(); write(g); }
  let rel = null, done = null;
  function draw() {
    if (!t) { el.innerHTML = '<section class="center"><h1>This link is not valid.</h1></section>'; return; }
    if (done) { el.innerHTML = '<section class="center"><h1>Thank you.</h1><p class="lead">' + (done === "pre" ? "Your pre-order is noted." : "You are on the list.") + "</p></section>"; return; }
    const chips = [["stranger", "I do not know them"], ["friend", "Friend"], ["family", "Family"], ["classmate", "Classmate"]].map((x) => '<button class="chip ' + (rel === x[0] ? "on" : "") + '" data-r="' + x[0] + '">' + x[1] + "</button>").join("");
    el.innerHTML = '<section><p class="eyebrow">Early access</p><h1>' + esc(what) + '</h1><p class="lead">' + esc(who) + " is building this and wants to know if you would use it. Join the list, or reserve yours.</p>"
      + '<div class="card"><h2>How do you know ' + esc(who) + '?</h2><div class="chips">' + chips + "</div></div>"
      + '<div class="chips"><button class="btn" id="su" ' + (rel ? "" : "disabled") + ">Join the waiting list</button>" + (price ? '<button class="btn ghost" id="pre" ' + (rel ? "" : "disabled") + ">Pre-order for ₹" + price.toLocaleString("en-IN") + " (demo: no payment)</button>" : "") + '</div><p class="small">Prototype page. In the real product a pre-order takes a real deposit.</p></section>';
    el.querySelectorAll("[data-r]").forEach((b) => (b.onclick = () => { rel = b.dataset.r; draw(); }));
    const go = (k, list) => {
      if (cloud) { post({ t: list === "signups" ? "signup" : "pre", rel, device: dev, at: Date.now() }).then(() => { done = k; draw(); }).catch(() => alert("Could not send. Check your connection and try again.")); return; }
      const g = read(); g[list].push({ rel, device: dev, at: Date.now() }); write(g); done = k; draw(); };
    const su = document.getElementById("su"); if (su) su.onclick = () => go("su", "signups");
    const pre = document.getElementById("pre"); if (pre) pre.onclick = () => go("pre", "preorders");
  }
  draw();
})();
