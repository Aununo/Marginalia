# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Marginalia** — a hand-crafted static personal site. No frameworks, no npm, no bundler. Vanilla HTML/CSS/JS on the frontend, Python scripts that turn Markdown into HTML.

## Commands

```bash
./start.sh              # Build + serve on localhost:8000
./start.sh 3000         # Build + serve on custom port
python3 scripts/build_site.py       # Build only (no server)
python3 scripts/build_posts.py      # Build posts only (called by build_site.py)
python3 scripts/new_post.py "Title" [category]  # Scaffold a new post
```

Python dependencies (no requirements.txt): `pip install markdown PyYAML pygments`

## Architecture

### Hand-written vs generated split

**Hand-written — edit directly:**
- `index.html` — home page
- `public/about.html`, `public/contact.html`, `public/gallery.html`, `public/projects.html`
- `static/style.css` — global + home + post styles
- `static/posts.css` — blog archive styles
- `js/site.js` — all site JS in one IIFE

**Generated on every build — do NOT edit directly:**
- `public/posts.html` — blog archive (overwritten by `build_posts.py`)
- `public/posts/*.html` — individual post pages (overwritten)
- `public/search-index.json` — search index (overwritten)

### Build pipeline

1. `build_site.py` stamps `?v=YYYYMMDD-HHMMSS` on CSS/JS references in all 5 hand-written HTML files, updates the `<time>` element in `index.html`, then calls `build_posts.py`.
2. `build_posts.py` reads `content/posts/*.md`, parses YAML front matter, renders Markdown to HTML with Pygments highlighting and custom extensions (task lists, strikethrough, `:::gallery` directive), generates the archive, individual post pages, and search index.

### Nav sync requirement

The navigation bar (About / Posts / Gallery / Projects / Contact) is duplicated across all 6 HTML files (5 hand-written + templates in `build_posts.py`). When changing nav links, update all of them. Each page's own link gets `aria-current="page"`.

## Content format

Posts live in `content/posts/*.md` with YAML front matter:

```yaml
---
title: Post Title
date: 2026-03-25
category: technical        # technical | reflection | article | literature | life
summary: One-sentence summary.
tags: [tag-one, tag-two]
preview_image: /img/posts/hello-world.svg
preview_alt: Alt text for preview image
listed: true               # false = hidden from archive
format: markdown           # markdown | html
slug: post-slug            # optional; defaults to slugified filename
---
```

Custom gallery directive in posts:
```markdown
:::gallery
![Alt](/img/posts/image1.svg)
![Alt](/img/posts/image2.svg "Title")
:::
```

Prefix alt text with `_` to hide the caption (e.g., `![_Hidden caption](/img/...)`).

## Code style

- **Python**: `from __future__ import annotations`, `pathlib.Path`, f-strings, HTML via f-string templates (no Jinja). Scripts are self-contained, resolve `ROOT` from `__file__`.
- **JS**: All in one IIFE (`js/site.js`). ES5-ish, no modules, no npm, no bundler.
- **CSS**: CSS custom properties for theming (`html[data-theme="dark"]`), `clamp()` for responsive sizing. Two files: `style.css` (global) and `posts.css` (archive only).
- **No test suite exists.** Test manually via `./start.sh` + browser.

## Deployment

Pushes to `main` trigger a GitHub Actions workflow (`.github/workflows/deploy.yml`) that builds the site and deploys via rsync over SSH. Required secrets: `SERVER_SSH_KEY`, `SERVER_HOST`, `SERVER_USER`, `SERVER_PATH`.
