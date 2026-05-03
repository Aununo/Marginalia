#!/usr/bin/env python3

from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass
from datetime import datetime
from html import escape
from pathlib import Path
from typing import Any
from xml.etree import ElementTree as etree

import markdown
import yaml
from markdown.extensions import Extension
from markdown.inlinepatterns import SimpleTagInlineProcessor
from markdown.preprocessors import Preprocessor
from markdown.treeprocessors import Treeprocessor


ROOT = Path(__file__).resolve().parent.parent
CONTENT_DIR = ROOT / "content" / "posts"
PUBLIC_DIR = ROOT / "public"
PUBLIC_POSTS_DIR = PUBLIC_DIR / "posts"
SEARCH_INDEX_PATH = PUBLIC_DIR / "search-index.json"
POSTS_PAGE_PATH = PUBLIC_DIR / "posts.html"

CATEGORY_META = {
    "technical": {"label": "Technical", "class_name": "technical"},
    "reflection": {"label": "Reflection", "class_name": "reflection"},
    "article": {"label": "Article", "class_name": "article"},
    "literature": {"label": "Literature", "class_name": "literature"},
    "life": {"label": "Life", "class_name": "life"},
}
CATEGORY_ORDER = ["technical", "reflection", "article", "literature", "life"]
DEFAULT_PREVIEW_IMAGE = "/img/posts/hello-world.svg"
ASSET_VERSION = os.environ.get("SITE_ASSET_VERSION") or datetime.now().strftime("%Y%m%d-%H%M%S")
THEME_BOOT_SCRIPT = (
    "<script>\n"
    "    (function(){document.documentElement.classList.add('fonts-loading');try{var theme=localStorage.getItem('theme');if(theme==='dark'){document.documentElement.setAttribute('data-theme','dark');}else{document.documentElement.removeAttribute('data-theme');}}catch(e){}}());\n"
    "  </script>"
)
TASK_LIST_MARKER = re.compile(r"^\[([ xX])\]\s+(.*)$", re.S)
GALLERY_DIRECTIVE_START = re.compile(r"^\s*:::\s*gallery\s*$")
GALLERY_DIRECTIVE_END = re.compile(r"^\s*:::\s*$")
GALLERY_IMAGE_MARKER = re.compile(
    r'^\s*!\[(?P<alt>[^\]]*)\]\((?P<src><[^>]+>|[^)\s]+?)(?:\s+(?:"(?P<title_double>[^"]*)"|\'(?P<title_single>[^\']*)\'))?\)\s*$'
)


def merge_classes(element: etree.Element, *classes: str) -> None:
    current = [class_name for class_name in element.get("class", "").split() if class_name]
    for class_name in classes:
        if class_name not in current:
            current.append(class_name)
    if current:
        element.set("class", " ".join(current))


class TaskListTreeprocessor(Treeprocessor):
    def run(self, root: etree.Element) -> etree.Element:
        for list_element in root.iter():
            if list_element.tag not in {"ul", "ol"}:
                continue

            has_task_items = False
            for list_item in list_element:
                if list_item.tag != "li":
                    continue
                if self._convert_list_item(list_item):
                    has_task_items = True

            if has_task_items:
                merge_classes(list_element, "task-list")

        return root

    def _convert_list_item(self, list_item: etree.Element) -> bool:
        if self._convert_container(list_item):
            merge_classes(list_item, "task-list-item")
            return True

        for child in list_item:
            if child.tag == "p" and self._convert_container(child):
                merge_classes(list_item, "task-list-item")
                return True

        return False

    def _convert_container(self, container: etree.Element) -> bool:
        text = container.text or ""
        match = TASK_LIST_MARKER.match(text)
        if not match:
            return False

        checkbox = etree.Element(
            "input",
            {
                "type": "checkbox",
                "disabled": "disabled",
                "class": "task-list-item-checkbox",
                "aria-hidden": "true",
            },
        )
        if match.group(1).lower() == "x":
            checkbox.set("checked", "checked")

        container.text = ""
        checkbox.tail = match.group(2)
        container.insert(0, checkbox)
        return True


def normalize_gallery_caption(raw_alt: str) -> tuple[str, bool]:
    alt = raw_alt.strip()
    if alt.startswith("_"):
        return alt[1:].lstrip(), False
    return alt, bool(alt)


def parse_gallery_image(line: str) -> dict[str, str | bool] | None:
    match = GALLERY_IMAGE_MARKER.match(line.strip())
    if not match:
        return None

    src = match.group("src").strip()
    if src.startswith("<") and src.endswith(">"):
        src = src[1:-1].strip()

    alt_text, show_caption = normalize_gallery_caption(match.group("alt"))
    title = (match.group("title_double") or match.group("title_single") or "").strip()
    return {
        "src": src,
        "alt": alt_text,
        "title": title,
        "show_caption": show_caption,
    }


def render_gallery_html(lines: list[str]) -> list[str] | None:
    figures: list[str] = []
    count = 0
    for line in lines:
        if not line.strip():
            continue

        image = parse_gallery_image(line)
        if image is None:
            return None

        count += 1
        title_attr = ""
        if image["title"]:
            title_attr = f' title="{escape(str(image["title"]), quote=True)}"'

        figure_lines = [
            '  <figure class="post-gallery-item" tabindex="0">',
            (
                f'    <img src="{escape(str(image["src"]), quote=True)}" '
                f'alt="{escape(str(image["alt"]), quote=True)}"{title_attr}>'
            ),
        ]
        if image["show_caption"] or image["title"]:
            figure_lines.append("    <figcaption>")
            if image["show_caption"]:
                figure_lines.append(
                    f'      <span class="post-gallery-caption-title">{escape(str(image["alt"]))}</span>'
                )
            if image["title"]:
                figure_lines.append(
                    f'      <span class="post-gallery-caption-meta">{escape(str(image["title"]))}</span>'
                )
            figure_lines.append("    </figcaption>")
        figure_lines.append("  </figure>")
        figures.extend(figure_lines)

    if not figures:
        return None

    classes = "post-gallery"
    if count <= 3:
        classes += " post-gallery--few"

    return [
        f'<div class="{classes}" tabindex="0" aria-label="Scrollable image gallery">',
        *figures,
        "</div>",
    ]


class GalleryDirectivePreprocessor(Preprocessor):
    def run(self, lines: list[str]) -> list[str]:
        output: list[str] = []
        index = 0

        while index < len(lines):
            line = lines[index]
            if not GALLERY_DIRECTIVE_START.match(line):
                output.append(line)
                index += 1
                continue

            gallery_lines: list[str] = []
            index += 1
            while index < len(lines) and not GALLERY_DIRECTIVE_END.match(lines[index]):
                gallery_lines.append(lines[index])
                index += 1

            if index >= len(lines):
                output.append(line)
                output.extend(gallery_lines)
                break

            rendered_gallery = render_gallery_html(gallery_lines)
            if rendered_gallery is None:
                output.append(line)
                output.extend(gallery_lines)
                output.append(lines[index])
            else:
                indent = len(line) - len(line.lstrip())
                prefix = " " * indent
                output.append("")
                if indent > 0:
                    output.extend(prefix + gl for gl in rendered_gallery)
                    output.append(prefix)
                else:
                    output.extend(rendered_gallery)
                output.append("")

            index += 1

        return output


class GfmExtrasExtension(Extension):
    def extendMarkdown(self, md: markdown.Markdown) -> None:
        md.preprocessors.register(GalleryDirectivePreprocessor(md), "gallery-directive", 27)
        md.inlinePatterns.register(
            SimpleTagInlineProcessor(r"(?<!\\)(~~)(.+?)(~~)", "del"),
            "strikethrough",
            175,
        )
        md.treeprocessors.register(TaskListTreeprocessor(md), "task-list", 15)


def render_markdown(body: str, include_toc: bool = False) -> str:
    extensions: list[Any] = ["extra", "sane_lists", "codehilite", GfmExtrasExtension()]
    extension_configs: dict[str, Any] = {
        "codehilite": {
            "css_class": "codehilite",
            "guess_lang": False,
            "use_pygments": True,
        }
    }
    if include_toc:
        extensions.append("toc")
    return markdown.markdown(
        body,
        extensions=extensions,
        extension_configs=extension_configs,
        output_format="html5",
    )


@dataclass
class Post:
    slug: str
    title: str
    date_iso: str
    date_archive: str
    summary: str
    category: str
    category_label: str
    category_class: str
    tags: list[str]
    preview_image: str
    preview_alt: str
    listed: bool
    body_html: str

    @property
    def url(self) -> str:
        return f"/public/posts/{self.slug}.html"


def slugify(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"[^\w\s-]", "", value)
    value = re.sub(r"[-\s]+", "-", value)
    return value.strip("-") or "post"


def parse_front_matter(text: str) -> tuple[dict[str, Any], str]:
    if text.startswith("---\n"):
        _, rest = text.split("---\n", 1)
        if "\n---\n" not in rest:
            raise ValueError("Front matter block is missing a closing --- delimiter")
        front, body = rest.split("\n---\n", 1)
        return yaml.safe_load(front) or {}, body.lstrip()
    return {}, text


def parse_date(value: str) -> tuple[str, str]:
    value = (value or "").strip()
    for fmt in ("%Y-%m-%d", "%m-%d-%Y", "%Y/%m/%d"):
        try:
            dt = datetime.strptime(value, fmt)
            return dt.strftime("%Y-%m-%d"), dt.strftime("%m-%d-%Y")
        except ValueError:
            continue
    return value, value


def strip_tags(html_text: str) -> str:
    text = re.sub(r"<[^>]+>", " ", html_text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def summarize(body: str, body_format: str) -> str:
    if body_format == "html":
        paragraph_match = re.search(r"<p[^>]*>(.*?)</p>", body, re.S)
        if paragraph_match:
            candidate = strip_tags(paragraph_match.group(1))
            if candidate:
                return candidate[:180]
        return strip_tags(body)[:180]
    html_body = render_markdown(body)
    return strip_tags(html_body)[:180]


def render_body(body: str, body_format: str) -> str:
    if body_format == "html":
        return body.strip()
    return render_markdown(body, include_toc=True)


def split_toc(body_html: str) -> tuple[str, str]:
    trimmed = body_html.strip()
    toc_match = re.match(r'(<div class="toc">.*?</div>)(.*)', trimmed, re.S)
    if not toc_match:
        return "", trimmed
    return toc_match.group(1), toc_match.group(2).lstrip()


def load_posts() -> list[Post]:
    posts: list[Post] = []
    for path in sorted(CONTENT_DIR.glob("*.md")):
        meta, body = parse_front_matter(path.read_text(encoding="utf-8"))
        slug = meta.get("slug") or slugify(path.stem)
        date_iso, date_archive = parse_date(str(meta.get("date", "")))
        category = str(meta.get("category", "article")).strip().lower() or "article"
        category_info = CATEGORY_META.get(
            category,
            {"label": category.title() or "Article", "class_name": "article"},
        )
        raw_tags = meta.get("tags", [])
        if isinstance(raw_tags, str):
            raw_tags = [raw_tags]
        tags = [str(tag).strip() for tag in raw_tags if str(tag).strip()]
        body_format = str(meta.get("format", "markdown")).strip().lower()
        summary = str(meta.get("summary", "")).strip() or summarize(body, body_format)
        preview_image = str(meta.get("preview_image", "")).strip() or DEFAULT_PREVIEW_IMAGE
        preview_alt = str(meta.get("preview_alt", "")).strip() or f"{meta.get('title', slug)} preview image"
        posts.append(
            Post(
                slug=slug,
                title=str(meta["title"]).strip(),
                date_iso=date_iso,
                date_archive=date_archive,
                summary=summary,
                category=category,
                category_label=category_info["label"],
                category_class=category_info["class_name"],
                tags=tags,
                preview_image=preview_image,
                preview_alt=preview_alt,
                listed=bool(meta.get("listed", True)),
                body_html=render_body(body, body_format),
            )
        )
    posts.sort(key=lambda post: post.date_iso, reverse=True)
    return posts


def build_posts_page(posts: list[Post]) -> str:
    listed_posts = [post for post in posts if post.listed]
    present_categories = []
    for category in CATEGORY_ORDER:
        if any(post.category == category for post in listed_posts):
            present_categories.append(category)
    for post in listed_posts:
        if post.category not in present_categories:
            present_categories.append(post.category)

    legend_html = "\n".join(
        f"""        <div class="legend-item" data-category="{escape(category)}">
          <div class="legend-color {escape(CATEGORY_META.get(category, {'class_name': 'article'})['class_name'])}"></div>
          <span>{escape(CATEGORY_META.get(category, {'label': category.title()})['label'])}</span>
        </div>"""
        for category in present_categories
    )

    entries_html = "\n".join(
        f"""        <a
          href="{escape(post.url)}"
          class="blog-entry {escape(post.category_class)}"
          data-category="{escape(post.category)}"
          data-subtitle="{escape(post.summary)}"
          data-image="{escape(post.preview_image)}">
          <span class="blog-date">{escape(post.date_archive)}</span>
          <span class="blog-title">{escape(post.title)}</span>
        </a>"""
        for post in listed_posts
    )

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Posts / Runzhuo Gan</title>
  {THEME_BOOT_SCRIPT}
  <link rel="icon" href="/img/icon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&family=Jost:ital,wght@0,100..900;1,100..900&family=Spectral:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;0,800;1,200;1,300;1,400;1,500;1,600;1,700;1,800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/static/style.css?v={ASSET_VERSION}">
  <link rel="stylesheet" href="/static/posts.css?v={ASSET_VERSION}">
  <script src="/js/site.js?v={ASSET_VERSION}" defer></script>
</head>
<body class="posts-page-body">
  <nav class="nav">
    <div class="nav-inner">
      <div class="brand serif-brand"><a class="brand-link" href="/">Runzhuo Gan</a></div>
      <div class="nav-links">
        <a href="/public/about.html">About</a>
        <a href="/public/posts.html" aria-current="page">Posts</a>
        <a href="/public/gallery.html">Gallery</a>
        <a href="/public/projects.html">Projects</a>
        <a href="/public/friends.html">Friends</a>
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
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>
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

  <main class="blog-page">
    <div class="blog-page-header">
      <span class="eyebrow">Posts</span>
      <h1>Notes, ideas, and things I'm learning.</h1>
    </div>
    <div class="blog-layout">
      <div class="category-legend">
{legend_html}
      </div>

      <div class="blog-list" id="blog-list">
{entries_html}
      </div>

      <div class="hover-preview">
        <div class="preview-content">
          <p class="preview-subtitle"></p>
          <img class="preview-image" src="" alt="">
        </div>
      </div>
    </div>
  </main>

</body>
</html>
"""


def build_post_page(post: Post) -> str:
    toc_html, post_body_html = split_toc(post.body_html)
    tags_html = ""
    if post.tags:
        tags_html = '<div class="post-tags">' + "".join(
            f'<span class="tag">{escape(tag)}</span>' for tag in post.tags
        ) + "</div>"
    shell_classes = "post-shell"
    toc_block = ""
    if toc_html:
        shell_classes += " has-toc"
        toc_block = f"""
      <aside class="post-sidebar" aria-label="Table of contents">
        <p class="post-sidebar-title">Content</p>
        {toc_html}
      </aside>"""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{escape(post.title)} / Runzhuo Gan</title>
  {THEME_BOOT_SCRIPT}
  <link rel="icon" href="/img/icon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&family=Jost:ital,wght@0,100..900;1,100..900&family=Spectral:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;0,800;1,200;1,300;1,400;1,500;1,600;1,700;1,800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/static/style.css?v={ASSET_VERSION}">
  <script src="/js/site.js?v={ASSET_VERSION}" defer></script>
</head>
<body class="post-page-body">
  <nav class="nav">
    <div class="nav-inner">
      <div class="brand serif-brand"><a class="brand-link" href="/">Runzhuo Gan</a></div>
      <div class="nav-links">
        <a href="/public/about.html">About</a>
        <a href="/public/posts.html" aria-current="page">Posts</a>
        <a href="/public/gallery.html">Gallery</a>
        <a href="/public/projects.html">Projects</a>
        <a href="/public/friends.html">Friends</a>
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
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>
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
  <main class="container post-container">
    <article class="hero post-article">
      <div class="{shell_classes}">
        <div class="post-main">
          <p class="post-back"><a href="/public/posts.html">← back to posts</a></p>
          <h1>{escape(post.title)}</h1>
          <p class="post-meta">{escape(post.date_iso)}</p>
          {tags_html}
          <div class="post-body">
            {post_body_html}
          </div>
        </div>{toc_block}
      </div>
    </article>
  </main>
</body>
</html>
"""


def build_search_index(posts: list[Post]) -> str:
    payload = [
        {
            "title": post.title,
            "date": post.date_iso,
            "summary": post.summary,
            "tags": post.tags,
            "url": post.url,
        }
        for post in posts
        if post.listed
    ]
    return json.dumps(payload, ensure_ascii=False, indent=2) + "\n"


def write_outputs(posts: list[Post]) -> None:
    PUBLIC_POSTS_DIR.mkdir(parents=True, exist_ok=True)
    POSTS_PAGE_PATH.write_text(build_posts_page(posts), encoding="utf-8")
    SEARCH_INDEX_PATH.write_text(build_search_index(posts), encoding="utf-8")
    expected = {f"{post.slug}.html" for post in posts}
    for existing in PUBLIC_POSTS_DIR.glob("*.html"):
        if existing.name not in expected:
            existing.unlink()
    for post in posts:
        (PUBLIC_POSTS_DIR / f"{post.slug}.html").write_text(build_post_page(post), encoding="utf-8")


def main() -> None:
    posts = load_posts()
    if not posts:
        raise SystemExit("No posts found in content/posts")
    write_outputs(posts)
    print(f"Built {len(posts)} posts from {CONTENT_DIR}")


if __name__ == "__main__":
    main()
