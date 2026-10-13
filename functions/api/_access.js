// The access token. Minted by the coach site when a payment is VERIFIED, opened here. Stateless: nothing is stored to check it.
// It is AES-GCM sealed with a secret both sites share (ACCESS_SECRET), so it cannot be forged or edited, and the buyer's e-mail inside it is unreadable
// to anyone without that secret. We open it only to send the buyer an e-mail. One payment of N startups opens N vaults, and no more.
const enc = new TextEncoder(), dec = new TextDecoder();
const b64u = (b) => btoa(String.fromCharCode.apply(null, new Uint8Array(b))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const ub64u = (t) => { t = t.replace(/-/g, "+").replace(/_/g, "/"); while (t.length % 4) t += "="; return Uint8Array.from(atob(t), (c) => c.charCodeAt(0)); };
const key = async (secret) => crypto.subtle.importKey("raw", await crypto.subtle.digest("SHA-256", enc.encode("pf-access|" + secret)), "AES-GCM", false, ["encrypt", "decrypt"]);
export async function mintToken(secret, obj) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  return b64u(iv) + "." + b64u(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await key(secret), enc.encode(JSON.stringify(obj))));
}
export async function openToken(secret, token) {
  try {
    if (!secret || typeof token !== "string" || token.length > 1200 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) return null;
    const [iv, ct] = token.split("."), o = JSON.parse(dec.decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: ub64u(iv) }, await key(secret), ub64u(ct))));
    return o && /^\w{6,40}$/.test(o.p || "") && Number.isInteger(o.q) && o.q >= 1 && o.q <= 5 ? o : null;
  } catch (e) { return null; }
}
