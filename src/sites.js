// Shared config + helpers (loaded by the new tab page and, in the Full edition, the background worker)
const MOBILE_UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36";

// Apps you can add with one click. Not every site will work inside a frame:
// use "Pop out" for the ones that refuse.
const PRESETS = [
  { id: "instagram", name: "Instagram", url: "https://www.instagram.com/", accent: "#e1306c", domains: ["instagram.com"], cookieDomains: ["instagram.com"], mobileUA: true, spoofFetchMeta: false },
  { id: "facebook", name: "Facebook", url: "https://m.facebook.com/", accent: "#1877f2", domains: ["facebook.com"], cookieDomains: ["facebook.com"], mobileUA: true, spoofFetchMeta: true },
  { id: "reddit", name: "Reddit", url: "https://www.reddit.com/", accent: "#ff4500", domains: ["reddit.com"], cookieDomains: ["reddit.com"], mobileUA: true, spoofFetchMeta: false },
  // WhatsApp Web refuses mobile user-agents, so it keeps the desktop one.
  { id: "whatsapp", name: "WhatsApp", url: "https://web.whatsapp.com/", accent: "#25d366", domains: ["whatsapp.com"], cookieDomains: ["whatsapp.com"], mobileUA: false, spoofFetchMeta: true },
  { id: "youtube", name: "YouTube", url: "https://m.youtube.com/", accent: "#ff0033", domains: ["youtube.com"], cookieDomains: ["youtube.com"], mobileUA: true, spoofFetchMeta: false },
  { id: "x", name: "X", url: "https://x.com/", accent: "#1d9bf0", domains: ["x.com"], cookieDomains: ["x.com"], mobileUA: true, spoofFetchMeta: false },
  { id: "threads", name: "Threads", url: "https://www.threads.net/", accent: "#a78bfa", domains: ["threads.net"], cookieDomains: ["threads.net"], mobileUA: true, spoofFetchMeta: true },
  { id: "telegram", name: "Telegram", url: "https://web.telegram.org/a/", accent: "#229ed9", domains: ["telegram.org"], cookieDomains: ["telegram.org"], mobileUA: false, spoofFetchMeta: false },
  { id: "linkedin", name: "LinkedIn", url: "https://www.linkedin.com/", accent: "#0a66c2", domains: ["linkedin.com"], cookieDomains: ["linkedin.com"], mobileUA: true, spoofFetchMeta: false },
  { id: "pinterest", name: "Pinterest", url: "https://www.pinterest.com/", accent: "#e60023", domains: ["pinterest.com"], cookieDomains: ["pinterest.com"], mobileUA: true, spoofFetchMeta: false },
];

const DEFAULT_TILE_IDS = ["instagram", "facebook", "reddit", "whatsapp"];

// "https://m.example.co.uk/x" -> "example.co.uk" (simple heuristic, good enough for tiles)
function deriveDomain(url) {
  const host = new URL(url).hostname.replace(/^(www|m|mobile|web)\./, "");
  const parts = host.split(".");
  if (parts.length <= 2) return host;
  const tld = parts[parts.length - 1];
  const sld = parts[parts.length - 2];
  if (tld.length === 2 && sld.length <= 3) return parts.slice(-3).join(".");
  return parts.slice(-2).join(".");
}

function makeCustomTile(name, url, accent, mobile) {
  const d = deriveDomain(url);
  return {
    id: "custom-" + Date.now().toString(36),
    name,
    url,
    accent: accent || "#8b5cf6",
    domains: [d],
    cookieDomains: [d],
    mobileUA: !!mobile,
    spoofFetchMeta: false,
  };
}

function defaultTiles() {
  return DEFAULT_TILE_IDS.map((id) => JSON.parse(JSON.stringify(PRESETS.find((p) => p.id === id))));
}

async function loadTiles() {
  const { tiles } = await chrome.storage.local.get("tiles");
  return Array.isArray(tiles) ? tiles : defaultTiles();
}
