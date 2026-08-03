/*
 * Bookmark structure:
 * {
 *  "https://example.com": {
 *    mdContent: "# Welcome to example.com\nThis is a ...",
 *    bookmarkedParas: [2, 5, ...],
 *    bookmarkedHeaders: [0, 3, ...]
 *  }
 * }
 *
 * Paragraphs and headers are counted separately, each in the order they
 * appear on the page. Bookmarks saved before headers were bookmarkable have
 * no bookmarkedHeaders key, so always read them through getBookmarkedBlocks.
 * */

const BLOCK_KEYS = {
  paragraph: 'bookmarkedParas',
  header: 'bookmarkedHeaders'
};

export function getBookmarks() {
  return localStorage.getItem('bookmarks')
    ? JSON.parse(localStorage.getItem('bookmarks')) : {};
}

export function getBookmarkedBlocks(bookmark, kind) {
  return bookmark?.[BLOCK_KEYS[kind]] || [];
}

export function saveBookmark(url, mdContent, kind = undefined, index = undefined) {
  const bookmarks = getBookmarks();
  if (!bookmarks.hasOwnProperty(url)) {
    bookmarks[url] = {};
  }

  const bookmark = bookmarks[url];
  bookmark.mdContent = mdContent;
  bookmark.bookmarkedParas = getBookmarkedBlocks(bookmark, 'paragraph');
  bookmark.bookmarkedHeaders = getBookmarkedBlocks(bookmark, 'header');

  if (kind !== undefined && index !== undefined) {
    bookmark[BLOCK_KEYS[kind]] = [...bookmark[BLOCK_KEYS[kind]], index];
  }

  localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
}

// Bookmark the paragraph/header if it isn't bookmarked yet, un-bookmark it if it is.
export function toggleBlockBookmark(url, mdContent, kind, index) {
  const bookmarks = getBookmarks();
  if (!bookmarks.hasOwnProperty(url)) {
    saveBookmark(url, mdContent, kind, index);
    return;
  }

  const bookmark = bookmarks[url];
  const blocks = getBookmarkedBlocks(bookmark, kind);
  bookmark[BLOCK_KEYS[kind]] = blocks.some(i => `${i}` === `${index}`)
    ? blocks.filter(i => `${i}` !== `${index}`)
    : [...blocks, index];

  localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
}

export function deleteBookmark(url) {
  const bookmarks = getBookmarks();
  if (!bookmarks.hasOwnProperty(url)) {
    const message = 'Error: tried deleting page from bookmarks, but the page is not currently bookmarked';
    alert(message);
    throw new Error(message);
  }
  delete bookmarks[url];
  localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
}
