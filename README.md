# Bookmark Name Shorter

A small Chrome extension that removes trailing website names from bookmark
titles.

## Supported title formats

The extension keeps everything before the first supported separator:

| Format | Original bookmark title | Saved bookmark title |
| --- | --- | --- |
| Spaced hyphen | `How to Cook Rice - YouTube` | `How to Cook Rice` |
| Spaced en dash | `Article Title – Website` | `Article Title` |
| Compact en dash | `Article Title–Website` | `Article Title` |
| Spaced em dash | `Article Title — Website` | `Article Title` |
| Compact em dash | `Article Title—Website` | `Article Title` |
| Spaced colon | `Article Title : Website` | `Article Title` |
| Compact colon | `Article Title:Website` | `Article Title` |
| Spaced vertical bar | `Article Title | Website` | `Article Title` |

To protect legitimate names, unspaced ASCII hyphens and vertical bars are not
treated as separators. For example, `state-of-the-art`, `Title-Website`, and
`A|B testing` remain unchanged.

## Install

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode**.
3. Select **Load unpacked**.
4. Choose this project folder.

When the extension is installed or updated, it cleans matching titles throughout
the existing bookmark library. Every newly created URL bookmark is also shortened
automatically. Bookmark folders and URLs are never changed.

The blue bookmark icon identifies the extension in Chrome's toolbar and
extensions menu. Its artwork is sized to fill the toolbar canvas while retaining
a small anti-clipping margin. Click the icon to clean existing bookmarks again;
a temporary badge shows how many titles were renamed.

Chrome may briefly show the original title before the extension applies the
shortened one. The bookmark dialog itself may keep showing the original title;
after you select **Done**, the saved bookmark is shortened.

## Production build

Create a Chrome-ready ZIP archive in `dist/`:

```text
npm run build
```

## Test

With Node.js installed, run:

```text
npm test
```
