#!/usr/bin/env python3
"""Add a piece to the gallery.

    python3 tools/add_art.py ~/Downloads/IMG_1234.heic "Sunset Axolotl"

Converts/resizes via sips (macOS built-in), writes gallery/<slug>.jpg,
appends to gallery.json, then prints the commit command.
Accepts HEIC, PNG, JPG — anything sips can read.
"""
import json
import pathlib
import re
import subprocess
import sys
from datetime import date

ROOT = pathlib.Path(__file__).resolve().parent.parent
MAX_EDGE = 1200  # web-friendly size


def main() -> None:
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    src, title = pathlib.Path(sys.argv[1]).expanduser(), sys.argv[2]
    if not src.exists():
        sys.exit(f"no such file: {src}")

    slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-") or "art"
    out = ROOT / "gallery" / f"{slug}.jpg"
    n = 2
    while out.exists():
        out = ROOT / "gallery" / f"{slug}-{n}.jpg"
        n += 1
    out.parent.mkdir(exist_ok=True)

    subprocess.run(
        ["sips", "-s", "format", "jpeg", "-Z", str(MAX_EDGE), str(src), "--out", str(out)],
        check=True, capture_output=True,
    )

    gj = ROOT / "gallery.json"
    data = json.loads(gj.read_text()) if gj.exists() else []
    data.append({"src": f"gallery/{out.name}", "title": title, "date": date.today().isoformat()})
    gj.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")

    print(f"added {out.name} ({out.stat().st_size // 1024} KB)")
    print(f'now run:  git add -A && git commit -m "Gallery: {title}" && git push')


if __name__ == "__main__":
    main()
