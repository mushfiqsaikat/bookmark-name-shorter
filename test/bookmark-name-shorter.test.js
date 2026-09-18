import assert from "node:assert/strict";
import test from "node:test";

import {
  cleanupExistingBookmarks,
  renameChangedBookmark,
  renameBookmark,
} from "../bookmark-manager.js";
import {
  runBookmarkCleanup,
  runManualCleanup,
} from "../cleanup-controller.js";
import { shortenBookmarkTitle } from "../title.js";

test("shortens a title at the first common separator", () => {
  assert.equal(
    shortenBookmarkTitle("Article Title - Website Name"),
    "Article Title",
  );
  assert.equal(
    shortenBookmarkTitle("Article - Section - Website"),
    "Article",
  );
  assert.equal(shortenBookmarkTitle("Article – Website"), "Article");
  assert.equal(shortenBookmarkTitle("Article—Website"), "Article");
  assert.equal(shortenBookmarkTitle("Article:Website"), "Article");
  assert.equal(shortenBookmarkTitle("Article : Website"), "Article");
  assert.equal(shortenBookmarkTitle("Article | Website"), "Article");
  assert.equal(
    shortenBookmarkTitle("Article | Section — Website"),
    "Article",
  );
});

test("preserves hyphens inside words and titles without a separator", () => {
  assert.equal(
    shortenBookmarkTitle("A state-of-the-art guide"),
    "A state-of-the-art guide",
  );
  assert.equal(shortenBookmarkTitle("Plain title"), "Plain title");
  assert.equal(shortenBookmarkTitle("A|B testing"), "A|B testing");
});

test("trims the retained title and accepts whitespace around the separator", () => {
  assert.equal(
    shortenBookmarkTitle("  Article Title   -   Website  "),
    "Article Title",
  );
  assert.equal(shortenBookmarkTitle("Article\t-\tWebsite"), "Article");
});

test("does not create an empty title", () => {
  assert.equal(shortenBookmarkTitle(" - Website"), " - Website");
  assert.equal(shortenBookmarkTitle("— Website"), "— Website");
  assert.equal(shortenBookmarkTitle(":Website"), ":Website");
  assert.equal(shortenBookmarkTitle(" | Website"), " | Website");
});

test("renameBookmark updates URL bookmarks but ignores folders", async () => {
  const updates = [];
  const bookmarksApi = {
    update: async (...args) => updates.push(args),
  };

  assert.equal(
    await renameBookmark(
      { id: "1", title: "Article - Site", url: "https://example.com" },
      bookmarksApi,
    ),
    true,
  );
  assert.equal(
    await renameBookmark(
      { id: "2", title: "Folder - Name" },
      bookmarksApi,
    ),
    false,
  );
  assert.deepEqual(updates, [["1", { title: "Article" }]]);
});

test("re-shortens a title overwritten by Chrome's bookmark dialog", async () => {
  const updates = [];
  const bookmarksApi = {
    get: async (id) => [
      {
        id,
        title: "WordPress ORG flag - Google Docs",
        url: "https://docs.google.com/document/example",
      },
    ],
    update: async (...args) => updates.push(args),
  };

  assert.equal(
    await renameChangedBookmark(
      "5",
      { title: "WordPress ORG flag - Google Docs" },
      bookmarksApi,
    ),
    true,
  );
  assert.deepEqual(updates, [["5", { title: "WordPress ORG flag" }]]);
});

test("ignores unrelated bookmark changes and shortened title updates", async () => {
  let reads = 0;
  const bookmarksApi = {
    get: async () => {
      reads += 1;
      return [];
    },
  };

  assert.equal(
    await renameChangedBookmark("6", { url: "https://example.com" }, bookmarksApi),
    false,
  );
  assert.equal(
    await renameChangedBookmark("6", { title: "Already short" }, bookmarksApi),
    false,
  );
  assert.equal(reads, 0);
});

test("cleanup traverses folders and continues after an update failure", async () => {
  const updates = [];
  const warnings = [];
  const bookmarksApi = {
    getTree: async () => [
      {
        id: "root",
        title: "Root - Folder",
        children: [
          { id: "1", title: "First - Site", url: "https://one.example" },
          {
            id: "folder",
            title: "Nested - Folder",
            children: [
              { id: "2", title: "Protected - Site", url: "https://two.example" },
              { id: "3", title: "Already short", url: "https://three.example" },
              { id: "4", title: "Last—Site", url: "https://four.example" },
            ],
          },
        ],
      },
    ],
    update: async (id, changes) => {
      if (id === "2") {
        throw new Error("Managed bookmark");
      }
      updates.push([id, changes]);
    },
  };
  const logger = {
    warn: (...args) => warnings.push(args),
  };

  const result = await cleanupExistingBookmarks(bookmarksApi, logger);

  assert.deepEqual(result, { processed: 4, renamed: 2 });
  assert.deepEqual(updates, [
    ["1", { title: "First" }],
    ["4", { title: "Last" }],
  ]);
  assert.equal(warnings.length, 1);
});

test("shares one cleanup operation between overlapping triggers", async () => {
  let resolveTree;
  let treeReads = 0;
  const bookmarksApi = {
    getTree: () => {
      treeReads += 1;
      return new Promise((resolve) => {
        resolveTree = resolve;
      });
    },
  };

  const firstCleanup = runBookmarkCleanup(bookmarksApi);
  const secondCleanup = runBookmarkCleanup(bookmarksApi);

  assert.strictEqual(firstCleanup, secondCleanup);
  await Promise.resolve();
  assert.equal(treeReads, 1);
  resolveTree([]);
  assert.deepEqual(await firstCleanup, { processed: 0, renamed: 0 });
});

test("manual cleanup shows and clears a renamed-count badge", async () => {
  const updates = [];
  const badgeCalls = [];
  let clearBadge;
  const chromeApi = {
    bookmarks: {
      getTree: async () => [
        {
          id: "root",
          children: [
            { id: "7", title: "Example – Site", url: "https://example.com" },
          ],
        },
      ],
      update: async (...args) => updates.push(args),
    },
    action: {
      setBadgeBackgroundColor: async (details) => {
        badgeCalls.push(["background", details]);
      },
      setBadgeText: async (details) => {
        badgeCalls.push(["text", details]);
      },
    },
  };

  const result = await runManualCleanup(chromeApi, {
    scheduleClear: (callback) => {
      clearBadge = callback;
      return 1;
    },
  });

  assert.deepEqual(result, { processed: 1, renamed: 1 });
  assert.deepEqual(updates, [["7", { title: "Example" }]]);
  assert.deepEqual(badgeCalls, [
    ["background", { color: "#2563EB" }],
    ["text", { text: "1" }],
  ]);

  clearBadge();
  await Promise.resolve();
  assert.deepEqual(badgeCalls.at(-1), ["text", { text: "" }]);
});
