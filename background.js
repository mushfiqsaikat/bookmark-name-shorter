import {
  cleanupExistingBookmarks,
  renameChangedBookmark,
  renameBookmark,
} from "./bookmark-manager.js";

chrome.bookmarks.onCreated.addListener((_id, bookmark) => {
  void renameBookmark(bookmark, chrome.bookmarks);
});

chrome.bookmarks.onChanged.addListener((id, changeInfo) => {
  void renameChangedBookmark(id, changeInfo, chrome.bookmarks);
});

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install" || details.reason === "update") {
    void cleanupExistingBookmarks(chrome.bookmarks);
  }
});
