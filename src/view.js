const statusBar = document.querySelector('#status-bar');
const bookmarksDropdown = document.querySelector('#bookmarks');
const bookmarkContainer = document.querySelector('#bookmark-container');
const nextBookmarkBlockButton = document.querySelector('#next-bookmark')

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

// Every bookmarked paragraph and header on the page, in the order they appear
function getBookmarkedBlockElements() {
  return Array.from(document.querySelectorAll('#content .bookmark-indicator.bookmarked'))
    .map(indicator => indicator.parentElement);
}

export function scrollToBookmark(bookmarkIndex) {
  const blocks = getBookmarkedBlockElements();
  if (blocks.length === 0) {
    return false;
  }
  blocks[bookmarkIndex % blocks.length].scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  });
  return true;
}

export const renderBookmarkJumpButton = () => {
  nextBookmarkBlockButton.style.display = getBookmarkedBlockElements().length > 0 ? 'flex' : 'none';
}

