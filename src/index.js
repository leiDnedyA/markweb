const START_URL = 'https://leidnedya.github.io/markweb/introduction.html';
let currentUrl = '';

const cache = {};

const urlInput = document.querySelector('#url-input');
const inputForm = document.querySelector('#input-form');
const container = document.querySelector('#content');
const statusBar = document.querySelector('#status-bar');
const bookmarksDropdown = document.querySelector('#bookmarks');
const bookmarkContainer = document.querySelector('#bookmark-container');
const loadBookmarkButton = document.querySelector('#load-bookmark');
const addBookmarkButton = document.querySelector('#add-bookmark-button');
const deleteBookmarkButton = document.querySelector('#delete-bookmark-button');

function getDomPath(element) {
  const path = [];
  while (element && element.nodeType === Node.ELEMENT_NODE) {
    let selector = element.nodeName.toLowerCase();
    if (element.id) {
      selector += `#${element.id}`;
    } else if (element.className) {
      selector += `.${Array.from(element.classList).join('.')}`;
    }
    // Add more logic for nth-child if needed for uniqueness
    path.unshift(selector);
    element = element.parentNode;
  }
  return path.join(' > ');
}

function showStatus(text) {
  statusBar.style.display = 'block';
  statusBar.innerText = text;
}

function hideStatus() {
  statusBar.style.display = 'none';
}

function scrollToBookmarkPara(bookmarkIndex) {
  document.querySelector(`[data-paragraph-index="${getBookmarks()[currentUrl].bookmarkedParas[bookmarkIndex]}"]`)
    ?.parentElement.parentElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    })
}

function renderBookmarksDropdown() {
  const bookmarks = getBookmarks();
  bookmarksDropdown.innerHTML = '';
  const bookmarkUrls = Object.keys(bookmarks);
  bookmarkContainer.style.display = bookmarkUrls.length === 0 ? 'none' : 'block';
  bookmarkUrls.forEach(key => {
    const option = document.createElement('option');
    option.innerText = key;
    option.value = key;
    bookmarksDropdown.appendChild(option);
  });
}

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

async function urlToMarkdown(url) {
  if (cache.hasOwnProperty(url)) {
    return cache[url];
  }
  const markdown = await fetch('https://r.jina.ai/' + url, {
    headers: {
      "X-No-Cache": true
    }
  })
    .then(response => response.text());
  return markdown;
}

function preProcessHTML(html, bookmarkParas) {
  let pIndex = 0;
  return html
    .replaceAll(
      /<a href="(https?:\/\/[^"]+)">([\s\S]*?)<\/a>/g,
      (_, url, text) => {
        return `<a href="#" 
          onmouseover="showStatus('${url}')"
          onmouseout="hideStatus()"
          onclick="handleLinkClick(event, '${url}');">${text}</a><a class="new-tab" href="${url}" target="_blank">+</a>`
      }
    )
    .replaceAll(
      /<p>([\s\S]*?)<\/p>/g,
      (_, content) => {
        const isBookmarked = bookmarkParas && bookmarkParas.includes(`${pIndex}`);
        const result = `<p>
          ${isBookmarked ? `<span class="bookmark-indicator">${bookmarkSvg}</span>` : ''}
          <span class="tooltip"><a data-paragraph-index="${pIndex}" class="bookmarkButton" href="#">${isBookmarked ? 'Unbookmark Paragraph' : 'Bookmark Paragraph'
          }</a></span>
          ${content}
        </p>`;
        pIndex++;
        return result;
      })
}

// Update the dom after rendering the HTML
function postProcessHTML(url, markdown) {
  document.querySelectorAll('.bookmarkButton')
    .forEach(anchor => {
      const pIndex = anchor.dataset.paragraphIndex;
      anchor.onclick = (e) => {
        e.preventDefault();
        const bookmarks = getBookmarks();
        console.log({ bookmarks })
        if (!bookmarks.hasOwnProperty(url)) {
          saveBookmark(url, markdown, pIndex);
        } else {
          const bookmark = bookmarks[url];
          const bookmarkedParas = bookmark.bookmarkedParas;
          if (bookmarkedParas.includes(pIndex)) {
            bookmark.bookmarkedParas = bookmarkedParas.filter(i => `${i}` !== `${pIndex}`);
          } else {
            bookmark.bookmarkedParas.push(pIndex);
          }
          localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
        }
        loadPage(url);
      }
    });
}

async function loadPage(url) {
  console.log(`loading ${url}`)
  currentUrl = url;

  const bookmarks = getBookmarks();
  const isBookmarked = bookmarks.hasOwnProperty(url);
  if (isBookmarked) {
    deleteBookmarkButton.style.display = 'block';
  } else {
    deleteBookmarkButton.style.display = 'none';
    content.innerHTML = `loading <em>${url}</em>`
  }

  const markdown = isBookmarked ? bookmarks[url].mdContent : await urlToMarkdown(url);
  const rawHtml = marked.parse(markdown);
  const html = preProcessHTML(rawHtml, isBookmarked ? bookmarks[url].bookmarkedParas : undefined);
  content.innerHTML = html;
  postProcessHTML(url, markdown);

  console.log(`loaded.`);
}

async function handleLinkClick(e, url) {
  e?.preventDefault();
  hideStatus();
  await loadPage(url);
  history.pushState(url, url);
}

window.onload = () => {
  handleLinkClick(null, START_URL);
  renderBookmarksDropdown();
  loadBookmarkButton.onclick = async (e) => {
    e.preventDefault();
    const value = bookmarksDropdown.value
    if (value) {
      await loadPage(value);
    }
  }
  deleteBookmarkButton.onclick = async (e) => {
    e.preventDefault();
    deleteBookmark(currentUrl);
    renderBookmarksDropdown();
    await loadPage(START_URL);
  };
}

window.addEventListener('popstate', (e) => {
  e.preventDefault();
  loadPage(e.state);
})

inputForm.onsubmit = async (e) => {
  e.preventDefault();
  const url = urlInput.value;
  await loadPage(url);
  history.pushState(url, url)
}
