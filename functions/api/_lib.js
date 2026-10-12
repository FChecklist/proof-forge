export const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json", "cache-control": "no-store", "x-content-type-options": "nosniff" } });
export const sha = async (t) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t))), (b) => b.toString(16).padStart(2, "0")).join("");
export const KINDS = ["buy", "interview", "connector", "msg", "pitch", "meet", "review", "docs", "funder", "operator", "sales", "pnl"];
// a witness answer is a flat object of short taps and bounded numbers. Anything else is refused.
export function cleanRecord(o) {
  if (!o || typeof o !== "object" || Array.isArray(o)) return null;
  const keys = Object.keys(o); if (keys.length < 2 || keys.length > 24 || !KINDS.includes(o.k)) return null;
  const out = {};
  for (const k of keys) {
    if (!/^[a-z]{1,12}$/.test(k)) return null; const v = o[k];
    if (typeof v === "string") { if (v.length > 200) return null; out[k] = v; } else if (typeof v === "number") { if (!Number.isFinite(v) || Math.abs(v) > 1e12) return null; out[k] = v; } else return null;
  }
  return out;
}
