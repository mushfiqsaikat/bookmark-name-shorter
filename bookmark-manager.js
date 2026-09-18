import { shortenBookmarkTitle } from "./title.js";

/**
 * Rename one URL bookmark when its title contains a spaced hyphen.
 * Returns true only when an update succeeds.
 */
export async function renameBookmark(bookmark, bookmarksApi, logger = console) {
  if (!bookmark?.url) {
    return false;
  }

  const shortenedTitle = shortenBookmarkTitle(bookmark.title);
  if (shortenedTitle === bookmark.title) {
    return false;
  }

  try {
    await bookmarksApi.update(bookmark.id, { title: shortenedTitle });
    return true;
  } catch (error) {
    logger.warn(`Could not shorten bookmark ${bookmark.id}.`, error);
    return false;
  }
}

/**
 * Re-check a bookmark after Chrome's bookmark dialog changes its title.
 * The dialog can overwrite the title set by the onCreated handler when it closes.
 */
export async function renameChangedBookmark(
  bookmarkId,
  changeInfo,
  bookmarksApi,
  logger = console,
) {
  if (
    typeof changeInfo?.title !== "string" ||
    shortenBookmarkTitle(changeInfo.title) === changeInfo.title
  ) {
    return false;
  }

  let bookmarks;

  try {
    bookmarks = await bookmarksApi.get(bookmarkId);
  } catch (error) {
    logger.warn(`Could not read bookmark ${bookmarkId}.`, error);
    return false;
  }

  return renameBookmark(bookmarks[0], bookmarksApi, logger);
}

function collectUrlBookmarks(nodes, bookmarks = []) {
  for (const node of nodes) {
    if (node.url) {
      bookmarks.push(node);
    }

    if (node.children) {
      collectUrlBookmarks(node.children, bookmarks);
    }
  }

  return bookmarks;
}

/**
 * Traverse the full bookmark tree and shorten URL bookmark titles.
 * Individual update failures are handled by renameBookmark so cleanup continues.
 */
export async function cleanupExistingBookmarks(bookmarksApi, logger = console) {
  let tree;

  try {
    tree = await bookmarksApi.getTree();
  } catch (error) {
    logger.warn("Could not read the bookmark tree.", error);
    return { processed: 0, renamed: 0 };
  }

  const bookmarks = collectUrlBookmarks(tree);
  let renamed = 0;

  for (const bookmark of bookmarks) {
    if (await renameBookmark(bookmark, bookmarksApi, logger)) {
      renamed += 1;
    }
  }

  return { processed: bookmarks.length, renamed };
}
