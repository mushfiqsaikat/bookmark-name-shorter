import { cleanupExistingBookmarks } from "./bookmark-manager.js";

let activeCleanup = null;
let badgeTimer = null;

/**
 * Share one bulk-cleanup operation between automatic and manual triggers.
 */
export function runBookmarkCleanup(bookmarksApi, logger = console) {
  if (activeCleanup) {
    return activeCleanup;
  }

  activeCleanup = Promise.resolve()
    .then(() => cleanupExistingBookmarks(bookmarksApi, logger))
    .finally(() => {
      activeCleanup = null;
    });

  return activeCleanup;
}

function formatBadgeCount(count) {
  return count > 99 ? "99+" : String(count);
}

/**
 * Show a short-lived count after a manual cleanup finishes.
 */
export async function showCleanupBadge(
  actionApi,
  renamed,
  {
    logger = console,
    scheduleClear = setTimeout,
    cancelClear = clearTimeout,
    duration = 5000,
  } = {},
) {
  if (badgeTimer !== null) {
    cancelClear(badgeTimer);
    badgeTimer = null;
  }

  try {
    await Promise.all([
      actionApi.setBadgeBackgroundColor({ color: "#2563EB" }),
      actionApi.setBadgeText({ text: formatBadgeCount(renamed) }),
    ]);
  } catch (error) {
    logger.warn("Could not show the bookmark cleanup result.", error);
    return;
  }

  badgeTimer = scheduleClear(() => {
    badgeTimer = null;
    Promise.resolve(actionApi.setBadgeText({ text: "" })).catch((error) => {
      logger.warn("Could not clear the bookmark cleanup result.", error);
    });
  }, duration);
}

export async function runManualCleanup(chromeApi, options = {}) {
  const result = await runBookmarkCleanup(chromeApi.bookmarks, options.logger);
  await showCleanupBadge(chromeApi.action, result.renamed, options);
  return result;
}
