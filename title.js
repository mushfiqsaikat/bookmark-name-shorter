const SPACED_HYPHEN = /\s+-\s+/;

/**
 * Keep the part of a bookmark title before its first spaced ASCII hyphen.
 * Hyphens inside words are intentionally ignored.
 */
export function shortenBookmarkTitle(title) {
  if (typeof title !== "string") {
    return title;
  }

  const separatorIndex = title.search(SPACED_HYPHEN);
  if (separatorIndex === -1) {
    return title;
  }

  const shortenedTitle = title.slice(0, separatorIndex).trim();
  return shortenedTitle || title;
}
