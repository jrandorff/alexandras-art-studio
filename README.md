# Alexandra's Art Studio 🩷

A kid-built (with Dad) art website: drawing videos, style tips, supply
checklists, and inspiration. Axolotl-themed by order of the client.

**Live:** https://jrandorff.github.io/alexandras-art-studio/
(On iPhone: Share → Add to Home Screen for the full-screen app.)

## Features

- **🎬 Videos** — search ~5,800 drawing lessons, strictly limited to approved
  channels (Art for Kids Hub, Draw So Cute). Tap 🩷 to save favorites
  (stored in the browser; "copy my list" backs them up to the clipboard).
- **🎨 Styles** — how to draw realistic / cartoon / manga / watercolor / pixel art.
- **🖍️ Supplies** — mark each item **✔️ Have** or **🛒 Need**; the shopping-list view
  shows only Need items, and the Idea Machine sometimes suggests making an idea
  with a supply you have.
- **💡 Ideas** — a daily drawing challenge + the Idea Machine
  (subject + twist + setting spinner).

## How it works

Static site, no backend, no accounts, no API keys. All content lives in
editable data files:

| File | What's in it |
|---|---|
| `videos.json` | The searchable video index (generated — see below) |
| `prompts.json` | Idea Machine words + daily challenges — **add your own!** |
| `supplies.json` | The supplies checklist |

## Syncing favorites & supplies between devices

Favorites and supply check-offs live in each device's browser. To move them:

- **🔄 sync button** (next to My Favorites): shows a QR code — scan it with the
  other device's camera (or copy the sync link and send it). Opening the link
  merges everything in. All data travels inside the link itself; no server.
- **Chromebook** (can't receive links or scan): commit her favorites into
  `family-state.json` in this repo (`{"f": ["videoId1", "videoId2", …]}` — the
  "copy my list" button exports the full objects; take the `id` values).
  Every device then starts with those favorites baked in, school included.
  Un-hearting a baked-in favorite hides it on that device only.

## Refreshing the video index

**It refreshes itself**: a GitHub Action (`.github/workflows/refresh-videos.yml`)
re-fetches the channels every Monday and commits `videos.json` if anything
changed. A sanity check refuses to commit a suspiciously small index, so a bad
fetch can never break search — worst case it catches up the following week.
You can also trigger it any time from the repo's Actions tab ("Run workflow").

The approved-channels list lives in `tools/build_video_index.py` — add a channel
there and the weekly refresh picks it up. Manual fallback (needs `brew install yt-dlp`):

```bash
python3 tools/build_video_index.py
git add videos.json && git commit -m "Refresh video index" && git push
```
