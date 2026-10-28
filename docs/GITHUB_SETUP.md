# Publishing on GitHub (step by step)

## 1. Before you push
- **Screenshots:** take them with a test account or blur names, phone numbers and chats (WhatsApp and Instagram frames show real contacts). Save as `docs/screenshot.png` and add `![Phone Home](docs/screenshot.png)` under the title in `README.md`.
- **License name:** `LICENSE` says "TheAverageBuilder". Change it if you want your legal name there.
- Optional: a 10-15 second screen recording as `docs/demo.gif`.

## 2. Create the repo and push
With the GitHub website: create an empty public repo called `phone-home` (no README, no license), then:

```bash
cd phone-home-repo
git init
git add .
git commit -m "Initial release: Phone Home 0.4.0"
git branch -M main
git remote add origin https://github.com/<your-username>/phone-home.git
git push -u origin main
```

With the GitHub CLI instead:

```bash
gh repo create phone-home --public --source=. --remote=origin --push
```

## 3. Repo details
- **Description:** New tab page with live phone-shaped frames for Instagram, WhatsApp, Reddit and more. Apple TV style. Chrome extension (Manifest V3).
- **Topics:** `chrome-extension`, `manifest-v3`, `new-tab`, `productivity`, `social-media`, `javascript`, `browser-extension`
- Turn on **Issues**. Pin the "Known limits" section of the README.

## 4. First release
1. Run `./build.sh`, then zip the *contents* of each folder so `manifest.json` is at the top level:
   ```bash
   (cd dist/full && zip -r ../../phone-home-full-0.4.0.zip .)
   (cd dist/lite && zip -r ../../phone-home-lite-0.4.0.zip .)
   ```
2. On GitHub: **Releases > Draft a new release**, tag `v0.4.0`, paste the 0.4.0 section of `CHANGELOG.md`, attach both zips.
3. In the release text say: unzip, open `chrome://extensions`, Developer mode, Load unpacked, pick the unzipped folder.

## 5. Say it clearly in the README / post
- Full edition is for personal use and is not on the Chrome Web Store.
- No data leaves your browser, no analytics.
- Sites may restrict embedding; use at your own risk.
