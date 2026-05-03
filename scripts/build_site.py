#!/usr/bin/env python3

from __future__ import annotations

import os
import re
import subprocess
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
STATIC_PAGES = [
    ROOT / "index.html",
    ROOT / "public" / "about.html",
    ROOT / "public" / "contact.html",
    ROOT / "public" / "gallery.html",
    ROOT / "public" / "projects.html",
    ROOT / "public" / "friends.html",
]
BUILD_POSTS_SCRIPT = ROOT / "scripts" / "build_posts.py"
BUILD_FRIENDS_SCRIPT = ROOT / "scripts" / "build_friends.py"

ASSET_PATTERNS = [
    (re.compile(r'(/static/style\.css)(?:\?v=[^"]+)?'), '/static/style.css?v={asset_version}'),
    (re.compile(r'(/static/posts\.css)(?:\?v=[^"]+)?'), '/static/posts.css?v={asset_version}'),
    (re.compile(r'(/js/site\.js)(?:\?v=[^"]+)?'), '/js/site.js?v={asset_version}'),
]
LAST_UPDATED_PATTERN = re.compile(r'(<time datetime=")[^"]+(">)[^<]+(</time>)')


def human_date(dt: datetime) -> str:
    return f"{dt.strftime('%B')} {dt.day}, {dt.year}"


def update_static_page(path: Path, asset_version: str, updated_at: datetime) -> None:
    text = path.read_text(encoding="utf-8")

    for pattern, replacement in ASSET_PATTERNS:
        text = pattern.sub(replacement.format(asset_version=asset_version), text)

    if path.name == "index.html":
        text = LAST_UPDATED_PATTERN.sub(
            lambda match: f'{match.group(1)}{updated_at.date().isoformat()}{match.group(2)}{human_date(updated_at)}{match.group(3)}',
            text,
        )

    path.write_text(text, encoding="utf-8")


def main() -> None:
    updated_at = datetime.now()
    asset_version = updated_at.strftime("%Y%m%d-%H%M%S")

    env = os.environ.copy()
    env["SITE_ASSET_VERSION"] = asset_version
    subprocess.run(["python3", str(BUILD_POSTS_SCRIPT)], check=True, cwd=ROOT, env=env)
    subprocess.run(["python3", str(BUILD_FRIENDS_SCRIPT)], check=True, cwd=ROOT, env=env)

    for path in STATIC_PAGES:
        update_static_page(path, asset_version, updated_at)

    print(f"Built site with asset version {asset_version}")


if __name__ == "__main__":
    main()
