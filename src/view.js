const statusBar = document.querySelector('#status-bar');
const bookmarksDropdown = document.querySelector('#bookmarks');
const bookmarkContainer = document.querySelector('#bookmark-container');
const nextBookmarkParaButton = document.querySelector('#next-bookmark')

export function showStatus(text) {
  statusBar.style.display = 'block';
  statusBar.innerText = text;
}

export function hideStatus() {
  statusBar.style.display = 'none';
}

export function renderBookmarksDropdown(bookmarks) {
  bookmarksDropdown.innerHTML = '<option disabled selected value> -- select a bookmark -- </option>';
  const bookmarkUrls = Object.keys(bookmarks);
  bookmarkContainer.style.display = bookmarkUrls.length === 0 ? 'none' : 'flex';
  bookmarkUrls.forEach(key => {
    const option = document.createElement('option');
    option.innerText = key;
    option.value = key;
    bookmarksDropdown.appendChild(option);
  });
}

export function scrollToBookmarkPara(bookmarkIndex, bookmarks, url) {
  document.querySelector(`[data-paragraph-index="${bookmarks[url].bookmarkedParas[bookmarkIndex]}"]`)
    ?.parentElement.parentElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    })
}

export const renderParagraphJumpButton = (url, bookmarks) => {
  const bookmarkedParas = bookmarks?.[url]?.bookmarkedParas;
  nextBookmarkParaButton.style.display = (bookmarkedParas && bookmarkedParas?.length > 0) ? 'flex' : 'none';
}

