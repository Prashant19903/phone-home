# Phone Home

Turn your browser's new tab page into a wall of phones. Each tile is a live, phone-shaped screen running Instagram, WhatsApp Web, Reddit, Facebook or any site you add, already logged in with your browser session.

Apple TV style look: animated aurora background, glass panels, focus glow in each app's colour, and a small mascot (Builder Bot) in the corner.

> Status: early prototype (v0.4). Built for Chromium browsers (Chrome, Edge, Brave, Opera).

## Two editions

| | **Full** (`dist/full`) | **Lite** (`dist/lite`) |
|---|---|---|
| Live frames on the new tab | Yes | No, apps open in a phone-sized window |
| Strips frame-blocking headers | Yes (only for this extension's own frames) | No |
| Mobile user-agent | Yes | No |
| Cookie fix for logins | Optional button | No |
| Permissions | storage, cookies, declarativeNetRequest, per-site host access | storage only |
| Store friendly | No, install from GitHub | Much closer, but not reviewed |

## Install (Full or Lite)
1. Run `./build.sh` (or use the prebuilt `dist/` folders).
2. Open `chrome://extensions` and turn on **Developer mode**.
3. **Load unpacked** and pick `dist/full` (or `dist/lite`).
4. Open a new tab. Click a phone to load that app.

## Using it
- **+ Add app**: pick a preset or add any `https://` site (name, colour, mobile view on/off). Non-preset sites ask for permission to that site.
- **Drag** a tile's title bar to reorder (a moved frame reloads).
- Hover a tile for **Pop out** (phone-sized window), **Reload**, **Close**, **✕ Remove**.
- **Size / Auto**: Auto fits the phones to your window.
- **Mascot** can be switched off in the header. Click it for a line.

## Logins inside frames (Full)
Sites inside an extension frame are "third party", so Chrome may not send your login cookies.
- Click **Fix login** once, then **Reload** the frame. It rewrites those sites' cookies as `SameSite=None; Secure`.
- If you block third-party cookies, allow these sites in `chrome://settings/cookies`.
- This weakens CSRF protection for those cookies. It never runs unless you click the button.

## How it works (Full)
- `declarativeNetRequest` rules apply only to requests started by this extension's own pages (`initiatorDomains` = the extension ID). Normal tabs are never touched.
- For frame loads of your tiles: remove `X-Frame-Options` and CSP, set a mobile user-agent (except sites that reject it, like WhatsApp Web), and for some Meta sites make the request look like a top-level navigation.
- Rules are rebuilt from your tile list whenever it changes.

## Privacy
- No analytics, no tracking, no servers. Nothing leaves your browser.
- Settings (tile list, size) are stored in `chrome.storage.local`.
- The Full edition reads cookies only for the sites in your tile list, and only when you press **Fix login**.

## Known limits
- Not every site works in a frame (banking, Google sign-in, anything with strict anti-framing). Use **Pop out**.
- Sub-resource requests inside frames keep your desktop user-agent; the mobile layout comes from the 390 px frame width.
- Only `https://` sites.
- Not suitable for the Chrome Web Store in its Full form.

## Terms of service
Embedding or automating some sites may go against their terms. You use this at your own risk and with your own accounts.

## Project layout
```
src/        shared source (sites.js, background.js, newtab.*)
manifests/  full.json and lite.json
build.sh    builds dist/full and dist/lite
```

## Contributing
Issues and pull requests are welcome. Ideas: side panel mode, per-tile zoom, keyboard navigation, theme packs, Firefox port.

## License
MIT. See `LICENSE`.
