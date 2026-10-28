# Contributing

Thanks for helping! Phone Home is a small vanilla-JS Manifest V3 extension. No bundler, no framework.

## Setup
1. Clone the repo.
2. Run `./build.sh`. It creates `dist/full` and `dist/lite` from `src/` and `manifests/`.
3. Load `dist/full` (or `dist/lite`) via `chrome://extensions` > Developer mode > Load unpacked.
4. After editing `src/`, run `./build.sh` again and press the reload icon on the extension.

## Guidelines
- Edit `src/`, never `dist/` by hand.
- Keep the Lite edition free of risky permissions (no `cookies`, no `declarativeNetRequest`).
- Header and cookie changes must stay limited to the extension's own frames (`initiatorDomains` = extension ID) and must stay opt-in where they weaken a site's protections.
- No analytics, no network calls to our own servers.
- Use `textContent`, not `innerHTML`, for anything that comes from storage or user input.

## Reporting a site that does not work
Open an issue with the site, your Chrome version, what you see (blank, error page, login loop) and whether **Pop out** works. Many sites block framing on purpose, so a "won't fix, use Pop out" answer is common.

## Ideas welcome
Side panel mode, per-tile zoom, keyboard navigation, theme packs, Firefox port.
