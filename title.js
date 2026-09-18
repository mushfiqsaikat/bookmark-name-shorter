const COMMON_TITLE_SEPARATOR = /\s+-\s+|\s*[–—]\s*|\s+\|\s+/;

/**
 * Keep the part of a bookmark title before its first common site separator.
 * Unspaced ASCII hyphens inside words are intentionally ignored.
 */
export function shortenBookmarkTitle(title) {
  if (typeof title !== "string") {
    return title;
  }

  const separatorIndex = title.search(COMMON_TITLE_SEPARATOR);
  if (separatorIndex === -1) {
    return title;
  }

  const shortenedTitle = title.slice(0, separatorIndex).trim();
  return shortenedTitle || title;
}
