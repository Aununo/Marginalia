---
title: Hello World
date: 2026-03-25
category: technical
summary: A playground post for checking how headings, lists, links, code blocks, tables, footnotes, and inline HTML render on the post page.
tags:
  - hello world
  - markdown
  - playground
preview_image: /img/posts/hello-world.svg
preview_alt: Preview image for Hello World
listed: true
format: markdown
slug: hello-world
---

[TOC]

This post is a compact playground for validating how different Markdown syntaxes render in the current post template.

## Paragraphs And Inline Styles

This paragraph mixes *italic*, **bold**, ***bold italic***, `inline code`, a [normal link](/public/posts.html), and an auto link <https://www.example.com>.

Hard line breaks can be tested here.  
This line should stay directly below the previous one.

You can also test escaped characters like \*literal asterisks\* and \`literal backticks\`.

## Lists

### Unordered

- First item
- Second item
    - Nested item A
    - Nested item B
- Third item

### Ordered

1. Step one
2. Step two
3. Step three

### Potential GFM-Only Syntax

- [x] Task list item
- [ ] Another task list item
- ~~Strikethrough sample~~

## Blockquote

> Good post typography should make quoted text feel distinct without breaking the reading rhythm.
>
> Second line in the same quote block.

## Code Blocks

```js
const greeting = "hello world";

function renderPost(title) {
  return `${title} is ready for markdown testing.`;
}

console.log(renderPost(greeting));
```

```bash
python3 scripts/build_posts.py
```

## Table

| Syntax | Example | Expected |
| :-- | :-- | :-- |
| Inline code | `npm run build` | Monospace chip |
| Link | [Posts](/public/posts.html) | Underlined link |
| Bold | **strong** | Heavier weight |

## Definition List

Markdown
: A lightweight markup language for writing formatted text.

Static site
: A site generated ahead of time into HTML, CSS, and JS.

## Footnotes

Footnotes are useful for side comments.[^note]

Another footnote can carry a longer explanation.[^long]

## Abbreviation

The HTML and CSS acronyms below should expand via the abbreviation extension.

*[HTML]: HyperText Markup Language
*[CSS]: Cascading Style Sheets

## Image

![Hello World preview image](/img/posts/hello-world.svg)

## Gallery

:::gallery
![Warm editor layout](/img/posts/hello-world.svg)
![Blueprint notes](/img/posts/gallery-frame-1.svg)
![Reading rhythm](/img/posts/gallery-frame-2.svg)
![Soft archive view](/img/posts/gallery-frame-3.svg)
![Compact preview panel](/img/posts/gallery-frame-4.svg)
:::

## Horizontal Rule

---

## Inline HTML

Some syntax is easier to test with raw HTML: <kbd>Cmd</kbd> + <kbd>K</kbd>, <mark>highlight</mark>, and <del>deleted text</del>.

<details>
<summary>Collapsible HTML block</summary>

This block uses raw HTML inside Markdown. It is handy for checking spacing around embedded elements.

</details>

[^note]: This is a short footnote.
[^long]: If this renders as a footnote section at the bottom, the extension is working.
