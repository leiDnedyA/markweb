const statusBar = document.querySelector('#status-bar');
const bookmarksDropdown = document.querySelector('#bookmarks');
const bookmarkContainer = document.querySelector('#bookmark-container');

function showStatus(text) {
  statusBar.style.display = 'block';
  statusBar.innerText = text;
}

function hideStatus() {
  statusBar.style.display = 'none';
}

function renderBookmarksDropdown(bookmarks) {
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

