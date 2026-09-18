# Short Bookmark Names

A small Chrome extension that changes bookmark titles such as:

`How to Cook Rice - YouTube` → `How to Cook Rice`

Only a hyphen surrounded by whitespace is treated as a separator, so titles with
hyphenated words such as `state-of-the-art` are left alone.

## Install

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode**.
3. Select **Load unpacked**.
4. Choose this project folder.

When the extension is installed or updated, it cleans matching titles throughout
the existing bookmark library. Every newly created URL bookmark is also shortened
automatically. Bookmark folders and URLs are never changed.

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
