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

## Refreshing the video index

The approved-channels list lives in `tools/build_video_index.py`. To pull the
channels' newest videos into the search index:

```bash
brew install yt-dlp   # once
python3 tools/build_video_index.py
git add videos.json && git commit -m "Refresh video index" && git push
```

Takes a few minutes; do it every month or two.
