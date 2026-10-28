// Full edition only. Not used by the Lite edition.
importScripts("sites.js");

// Rules apply ONLY to requests started by this extension's own pages,
// so normal tabs are never touched.
async function applyRules() {
  const tiles = await loadTiles();
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const initiator = [chrome.runtime.id];
  const rules = [];
  let id = 1;

  for (const site of tiles) {
    // Allow the site to load inside our iframes
    rules.push({
      id: id++,
      priority: 1,
      action: {
        type: "modifyHeaders",
        responseHeaders: [
          { header: "x-frame-options", operation: "remove" },
          { header: "content-security-policy", operation: "remove" },
          { header: "content-security-policy-report-only", operation: "remove" },
        ],
      },
      condition: {
        initiatorDomains: initiator,
        requestDomains: site.domains,
        resourceTypes: ["sub_frame"],
      },
    });

    // Mobile user-agent for the frame's main document request
    if (site.mobileUA) {
      rules.push({
        id: id++,
        priority: 1,
        action: {
          type: "modifyHeaders",
          requestHeaders: [{ header: "user-agent", operation: "set", value: MOBILE_UA }],
        },
        condition: {
          initiatorDomains: initiator,
          requestDomains: site.domains,
          resourceTypes: ["sub_frame"],
        },
      });
    }

    // Some sites reject requests that look like iframe loads:
    // make the frame's main request look like a normal top-level navigation.
    if (site.spoofFetchMeta) {
      rules.push({
        id: id++,
        priority: 1,
        action: {
          type: "modifyHeaders",
          requestHeaders: [
            { header: "sec-fetch-dest", operation: "set", value: "document" },
            { header: "sec-fetch-site", operation: "set", value: "none" },
            { header: "sec-fetch-mode", operation: "set", value: "navigate" },
            { header: "sec-fetch-user", operation: "set", value: "?1" },
          ],
        },
        condition: {
          initiatorDomains: initiator,
          requestDomains: site.domains,
          resourceTypes: ["sub_frame"],
        },
      });
    }
  }

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existing.map((r) => r.id),
    addRules: rules,
  });
}

// Opt-in (button click only): re-set cookies as SameSite=None; Secure so they are sent inside iframes.
async function fixCookies() {
  const tiles = await loadTiles();
  let count = 0;
  for (const site of tiles) {
    for (const domain of site.cookieDomains) {
      let cookies = [];
      try {
        cookies = await chrome.cookies.getAll({ domain });
      } catch (e) {
        continue; // no permission for this site yet
      }
      for (const c of cookies) {
        if (c.partitionKey) continue;
        if (c.sameSite === "no_restriction" && c.secure) continue;
        const host = c.domain.startsWith(".") ? c.domain.slice(1) : c.domain;
        const details = {
          url: "https://" + host + c.path,
          name: c.name,
          value: c.value,
          path: c.path,
          secure: true,
          httpOnly: c.httpOnly,
          sameSite: "no_restriction",
          storeId: c.storeId,
        };
        if (!c.hostOnly) details.domain = c.domain;
        if (c.expirationDate) details.expirationDate = c.expirationDate;
        try {
          await chrome.cookies.set(details);
          count++;
        } catch (e) {
          // some cookies (e.g. special prefixes) may refuse; skip them
        }
      }
    }
  }
  return count;
}

chrome.runtime.onInstalled.addListener(applyRules);
chrome.runtime.onStartup.addListener(applyRules);

// Rebuild the rules whenever the tile list changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.tiles) applyRules();
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id) return;
  if (msg === "fixCookies") {
    fixCookies().then((n) => sendResponse({ ok: true, count: n }));
    return true; // async response
  }
  if (msg === "applyRules") {
    applyRules().then(() => sendResponse({ ok: true }));
    return true;
  }
});
