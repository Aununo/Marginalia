#!/usr/bin/env python3
"""Generate the friends page with a rotating Ferris wheel layout."""

from __future__ import annotations

import os
from datetime import datetime
from html import escape
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
FRIENDS_DATA = ROOT / "content" / "friends.yml"
FRIENDS_PAGE_PATH = ROOT / "public" / "friends.html"

ASSET_VERSION = os.environ.get("SITE_ASSET_VERSION") or datetime.now().strftime("%Y%m%d-%H%M%S")
THEME_BOOT_SCRIPT = (
    "<script>\n"
    "    (function(){document.documentElement.classList.add('fonts-loading');try{var theme=localStorage.getItem('theme');if(theme==='dark'){document.documentElement.setAttribute('data-theme','dark');}else{document.documentElement.removeAttribute('data-theme');}}catch(e){}}());\n"
    "  </script>"
)

BASE_RADIUS = 180
RADIUS_GROWTH_PER_FRIEND = 32
MAX_RADIUS = 400
WHEEL_SPEED = 45  # seconds per full rotation
STRUCTURAL_SPOKES = 16
RIM_LIGHTS = 32


def load_friends() -> list[dict[str, str]]:
    if not FRIENDS_DATA.exists():
        return []
    data = yaml.safe_load(FRIENDS_DATA.read_text(encoding="utf-8"))
    friends = data.get("friends", []) if isinstance(data, dict) else []
    normalized: list[dict[str, str]] = []
    for item in friends:
        if not isinstance(item, dict):
            continue
        name = str(item.get("name", "")).strip()
        url = str(item.get("url", "")).strip()
        if not name or not url:
            continue
        normalized.append(
            {
                "name": name,
                "url": url,
                "avatar": str(item.get("avatar", "/img/icon.svg")).strip() or "/img/icon.svg",
                "description": str(item.get("description", "")).strip(),
            }
        )
    return normalized


def build_friends_page(friends: list[dict[str, str]]) -> str:
    num = len(friends)
    radius = min(MAX_RADIUS, BASE_RADIUS + max(0, num - 2) * RADIUS_GROWTH_PER_FRIEND)

    structure_html = ""
    for i in range(STRUCTURAL_SPOKES):
        angle = i * (360 / STRUCTURAL_SPOKES)
        structure_html += f'\n        <div class="ferris-truss" style="--angle: {angle:.1f}deg;"></div>'

    lights_html = ""
    for i in range(RIM_LIGHTS):
        angle = i * (360 / RIM_LIGHTS)
        lights_html += f'\n        <span class="ferris-light" style="--angle: {angle:.1f}deg;"></span>'

    cabin_arms_html = ""
    cabins_html = ""
    for i, friend in enumerate(friends):
        angle = i * (360 / num) if num > 0 else 0
        angle_str = f"{angle:.1f}"
        cabin_arms_html += f'\n        <div class="ferris-cabin-arm" style="--angle: {angle_str}deg;"></div>'
        cabins_html += f"""
        <a class="ferris-cabin" href="{escape(friend['url'], quote=True)}" target="_blank" rel="noopener noreferrer" style="--angle: {angle_str}deg;">
          <div class="ferris-cabin-inner">
            <div class="ferris-cabin-swing">
              <span class="ferris-cabin-bar" aria-hidden="true"></span>
              <img class="ferris-avatar" src="{escape(friend['avatar'], quote=True)}" alt="{escape(friend['name'], quote=True)}" loading="lazy">
              <div class="ferris-info">
                <span class="ferris-name">{escape(friend['name'])}</span>
                <span class="ferris-desc">{escape(friend['description'])}</span>
              </div>
            </div>
          </div>
        </a>"""

    if num == 0:
        wheel_content = '      <p class="ferris-empty">No friends yet. The wheel awaits its first passenger.</p>'
    else:
        wheel_content = f"""      <div class="ferris-stand" aria-hidden="true">
        <div class="ferris-stand__leg"></div>
        <div class="ferris-stand__leg"></div>
        <div class="ferris-stand__brace ferris-stand__brace--left"></div>
        <div class="ferris-stand__brace ferris-stand__brace--right"></div>
        <div class="ferris-stand__crossbar"></div>
        <div class="ferris-stand__axle"></div>
        <div class="ferris-platform"></div>
      </div>

      <div class="ferris-wheel">
        <div class="ferris-rim ferris-rim--outer"></div>
        <div class="ferris-rim ferris-rim--middle"></div>
        <div class="ferris-rim ferris-rim--inner"></div>
        <div class="ferris-light-ring" aria-hidden="true">{lights_html}
        </div>{structure_html}{cabin_arms_html}
        <div class="ferris-hub">
          <span class="ferris-hub__ring"></span>
          <span class="ferris-hub__cap"></span>
        </div>
{cabins_html}
      </div>"""

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Friends / Runzhuo Gan</title>
  {THEME_BOOT_SCRIPT}
  <link rel="icon" href="/img/icon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&family=Jost:ital,wght@0,100..900;1,100..900&family=Spectral:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;0,800;1,200;1,300;1,400;1,500;1,600;1,700;1,800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/static/style.css?v={ASSET_VERSION}">
  <script src="/js/site.js?v={ASSET_VERSION}" defer></script>
</head>
<body>
  <canvas class="bubble-canvas" aria-hidden="true"></canvas>

  <nav class="nav">
    <div class="nav-inner">
      <div class="brand serif-brand"><a class="brand-link" href="/">Runzhuo Gan</a></div>
      <div class="nav-links">
        <a href="/public/about.html">About</a>
        <a href="/public/posts.html">Posts</a>
        <a href="/public/gallery.html">Gallery</a>
        <a href="/public/projects.html">Projects</a>
        <a href="/public/friends.html" aria-current="page">Friends</a>
        <a href="/public/contact.html">Contact</a>
      </div>
      <div class="nav-actions">
        <a class="icon-link" href="https://github.com/Aununo" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 22v-4a4 4 0 0 0-.88-2.65c2.9-.33 5.88-1.42 5.88-6.35a4.94 4.94 0 0 0-1.32-3.42 4.6 4.6 0 0 0-.08-3.36s-1.07-.34-3.52 1.3a12.14 12.14 0 0 0-6.16 0c-2.45-1.64-3.52-1.3-3.52-1.3a4.6 4.6 0 0 0-.08 3.36A4.94 4.94 0 0 0 4 9c0 4.91 2.97 6.02 5.88 6.35A4 4 0 0 0 9 18v4"/>
            <path d="M9 18c-4 1.5-5-2-7-2"/>
          </svg>
        </a>
        <button class="theme-btn" onclick="toggleTheme()" aria-label="Toggle theme">
          <svg class="theme-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"></path>
          </svg>
        </button>
        <button class="search-link" onclick="toggleSearch()" aria-label="Search">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5"></circle>
            <path d="M16 16l5 5"></path>
          </svg>
        </button>
      </div>
    </div>
  </nav>

  <main class="page-content">
    <div class="container">
      <div class="hero">
        <span class="eyebrow">Friends</span>
        <h1>People worth knowing.</h1>
        <p>A collection of friends and their corners of the internet.</p>
      </div>

      <div class="ferris-ride" style="--radius: {radius}px; --speed: {WHEEL_SPEED}s;">
{wheel_content}
      </div>
    </div>

    <div class="footer">
      <span>Copyright &copy; Runzhuo Gan</span>
    </div>
  </main>
</body>
</html>
"""


def main() -> None:
    friends = load_friends()
    html = build_friends_page(friends)
    FRIENDS_PAGE_PATH.write_text(html, encoding="utf-8")
    print(f"Built friends page with {len(friends)} link(s) -> {FRIENDS_PAGE_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
