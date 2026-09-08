#!/usr/bin/env python3
"""Rebuild videos.json from the approved channels' public upload lists.

Usage:
    python3 tools/build_video_index.py              # fetches fresh via yt-dlp (takes a few minutes)
    python3 tools/build_video_index.py a.json b.json  # convert pre-downloaded yt-dlp dumps (same order as CHANNELS)

Requires yt-dlp (brew install yt-dlp) for the fetch path.
The search in the app is limited to whatever channels are listed here — this
file IS the allowlist.
"""
import json
import pathlib
import subprocess
import sys
from datetime import date, timedelta

CHANNELS = [
    ("https://www.youtube.com/@artforkidshub/videos", "Art for Kids Hub"),
    ("https://www.youtube.com/@drawsocute/videos", "Draw So Cute"),
]

OUT = pathlib.Path(__file__).resolve().parent.parent / "videos.json"
FRESH_DAYS = 30          # how long a video stays in the "recently arrived" list


def fetch(url: str) -> dict:
    print(f"fetching {url} …", file=sys.stderr)
    raw = subprocess.run(
        ["yt-dlp", "--flat-playlist", "-J", url],
        capture_output=True, text=True, check=True,
    ).stdout
    return json.loads(raw)


def main() -> None:
    dumps = (
        [json.load(open(p)) for p in sys.argv[1:]]
        if len(sys.argv) > 1
        else [fetch(url) for url, _ in CHANNELS]
    )
    channels = [name for _, name in CHANNELS]
    videos = []
    for ci, dump in enumerate(dumps):
        count = 0
        for e in dump.get("entries", []):
            vid, title = e.get("id"), e.get("title")
            if not vid or not title:
                continue
            videos.append({"id": vid, "t": title, "c": ci})
            count += 1
        print(f"{channels[ci]}: {count} videos", file=sys.stderr)

    # Track when each video first showed up, so the app can show "New this week".
    # Anything older than FRESH_DAYS is dropped, keeping the map tiny.
    today = date.today().isoformat()
    cutoff = (date.today() - timedelta(days=FRESH_DAYS)).isoformat()
    previous = json.loads(OUT.read_text()) if OUT.exists() else None
    first_seen = {}
    if previous:
        known = {v["id"] for v in previous["videos"]}
        first_seen = {i: d for i, d in previous.get("firstSeen", {}).items() if d >= cutoff}
        arrived = [v["id"] for v in videos if v["id"] not in known]
        for i in arrived:
            first_seen[i] = today
        print(f"{len(arrived)} new since the last refresh", file=sys.stderr)
    # (no previous index: start empty rather than flagging all 5,000 as brand new)

    OUT.write_text(json.dumps({"channels": channels, "videos": videos, "firstSeen": first_seen},
                              ensure_ascii=False, separators=(",", ":")))
    print(f"wrote {OUT} ({OUT.stat().st_size // 1024} KB, {len(videos)} videos, "
          f"{len(first_seen)} flagged recent)", file=sys.stderr)


if __name__ == "__main__":
    main()
