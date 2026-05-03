#!/usr/bin/env python3

from __future__ import annotations

import sys
import re
from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
CONTENT_DIR = ROOT / "content" / "posts"


def slugify(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"[^\w\s-]", "", value)
    value = re.sub(r"[-\s]+", "-", value)
    return value.strip("-") or "new-post"


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit('Usage: python3 scripts/new_post.py "Post Title" [category]')

    title = sys.argv[1].strip()
    category = sys.argv[2].strip().lower() if len(sys.argv) > 2 else "technical"
    slug = slugify(title)
    target = CONTENT_DIR / f"{slug}.md"

    if target.exists():
        raise SystemExit(f"{target} already exists")

    CONTENT_DIR.mkdir(parents=True, exist_ok=True)
    today = date.today().isoformat()
    template = f"""---
title: {title}
date: {today}
category: {category}
summary: Write a one-sentence summary here.
tags:
  - {category}
preview_image: /img/posts/hello-world.svg
preview_alt: Preview image for {title}
listed: true
format: markdown
slug: {slug}
---

# {title}

Start writing here.
"""
    target.write_text(template, encoding="utf-8")
    print(target.relative_to(ROOT))


if __name__ == "__main__":
    main()
