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

CHANNELS = [
    ("https://www.youtube.com/@artforkidshub/videos", "Art for Kids Hub"),
    ("https://www.youtube.com/@drawsocute/videos", "Draw So Cute"),
]

OUT = pathlib.Path(__file__).resolve().parent.parent / "videos.json"


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

    OUT.write_text(json.dumps({"channels": channels, "videos": videos},
                              ensure_ascii=False, separators=(",", ":")))
    print(f"wrote {OUT} ({OUT.stat().st_size // 1024} KB, {len(videos)} videos)", file=sys.stderr)


if __name__ == "__main__":
    main()
