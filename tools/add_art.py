#!/usr/bin/env python3
"""Add one or more pieces to the gallery.

    python3 tools/add_art.py ~/Downloads/IMG_1234.heic "Sunset Axolotl"
    python3 tools/add_art.py penguin.heic "Penguin!" wolf.heic "Wolf Howling"

Arguments come in FILE "TITLE" pairs — as many pairs as you like.
Converts/resizes via sips (macOS built-in), writes gallery/<slug>.jpg,
appends to gallery.json, then commits and pushes so it goes live.
Accepts HEIC, PNG, JPG — anything sips can read.

Pass --no-push to stop after writing the files (commit by hand later).
"""
import json
import pathlib
import re
import subprocess
import sys
from datetime import date

ROOT = pathlib.Path(__file__).resolve().parent.parent
MAX_EDGE = 1200  # web-friendly size


def add_piece(src: pathlib.Path, title: str, data: list) -> str:
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
    data.append({"src": f"gallery/{out.name}", "title": title, "date": date.today().isoformat()})
    print(f"added {out.name} ({out.stat().st_size // 1024} KB) — “{title}”")
    return title


def git(*cmd: str) -> subprocess.CompletedProcess:
    return subprocess.run(["git", "-C", str(ROOT), *cmd], capture_output=True, text=True)


def publish(label: str) -> None:
    """Commit and push. Rebases first — the weekly index bot commits here too."""
    git("add", "-A")
    if git("commit", "-m", f"Gallery: {label}").returncode != 0:
        sys.exit("nothing to commit — did the art already get published?")

    pull = git("pull", "--rebase")
    if pull.returncode != 0:
        sys.exit(f"couldn't sync with GitHub:\n{pull.stderr}\nFix, then run: git push")

    push = git("push")
    if push.returncode != 0:
        sys.exit(f"commit saved but push failed:\n{push.stderr}\nTry again with: git push")

    print("\n🎉 published! it goes live in about a minute:")
    print("   https://jrandorff.github.io/alexandras-art-studio/  (Gallery tab)")


def main() -> None:
    args = [a for a in sys.argv[1:] if a != "--no-push"]
    do_push = "--no-push" not in sys.argv[1:]
    if not args or len(args) % 2 != 0:
        sys.exit(__doc__)
    pairs = [(pathlib.Path(f).expanduser(), t) for f, t in zip(args[::2], args[1::2])]

    # validate every file BEFORE touching anything, so a typo can't half-apply a batch
    missing = [str(src) for src, _ in pairs if not src.exists()]
    if missing:
        sys.exit("no such file(s):\n  " + "\n  ".join(missing))

    gj = ROOT / "gallery.json"
    data = json.loads(gj.read_text()) if gj.exists() else []
    titles = [add_piece(src, title, data) for src, title in pairs]
    gj.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")

    label = titles[0] if len(titles) == 1 else f"{len(titles)} new pieces"
    if do_push:
        publish(label)
    else:
        print(f'\nnot pushed. to publish:  git add -A && git commit -m "Gallery: {label}" && git push')


if __name__ == "__main__":
    main()
