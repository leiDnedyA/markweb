/*
 * Bookmark structure: 
 * {
 *  "https://example.com": {
 *    mdContent: "# Welcome to example.com\nThis is a ...",
 *    bookmarkedParas: [2, 5, ...]
 *  }
 * }
 * */

function getBookmarks() {
  return localStorage.getItem('bookmarks')
    ? JSON.parse(localStorage.getItem('bookmarks')) : {};
}

function saveBookmark(url, mdContent, paragraphIndex = undefined) {
  const bookmarks = getBookmarks();
  const newBookmarks = { ...bookmarks };
  if (bookmarks.hasOwnProperty(url)) {
    newBookmarks[url].mdContent = mdContent;
    const currParas = newBookmarks[url].bookmarkedParas;
    newBookmarks[url].bookmarkedParas =
      paragraphIndex !== undefined ?
        (currParas ? [...currParas, paragraphIndex] : [paragraphIndex]) :
        (currParas || []);
  } else {
    newBookmarks[url] = {
      mdContent: mdContent,
      bookmarkedParas: paragraphIndex ? [paragraphIndex] : []
    }
    localStorage.setItem('bookmarks', JSON.stringify(newBookmarks))
  }
}

function deleteBookmark(url) {
  const bookmarks = getBookmarks();
  if (!bookmarks.hasOwnProperty(url)) {
    const message = 'Error: tried deleting page from bookmarks, but the page is not currently bookmarked';
    alert(message);
    throw new Error(message);
  }
  delete bookmarks[url];
  localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
}
