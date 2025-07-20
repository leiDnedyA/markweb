const START_URL = 'https://leidnedya.github.io/markweb/introduction.html';
// const START_URL = 'https://paulgraham.com/greatwork.html';
let currentUrl = '';
let currParaBookmarkIndex = 0;

const urlInput = document.querySelector('#url-input');
const inputForm = document.querySelector('#input-form');
const container = document.querySelector('#content');
const statusBar = document.querySelector('#status-bar');
const bookmarksDropdown = document.querySelector('#bookmarks');
const bookmarkContainer = document.querySelector('#bookmark-container');
const nextBookmarkParaButton = document.querySelector('#next-bookmark')
const loadBookmarkButton = document.querySelector('#load-bookmark');
const addBookmarkButton = document.querySelector('#add-bookmark-button');
const deleteBookmarkButton = document.querySelector('#delete-bookmark-button');

function parseJinaResponse(input) {
  const lines = input.split('\n');

  const titleLine = lines.find(line => line.startsWith('Title:'));
  const urlLine = lines.find(line => line.startsWith('URL Source:'));
  const contentIndex = lines.findIndex(line => line.startsWith('Markdown Content:'));

  const title = titleLine ? titleLine.replace('Title:', '').trim() : '';
  const url = urlLine ? urlLine.replace('URL Source:', '').trim() : '';
  const content = contentIndex !== -1 ? lines.slice(contentIndex + 1).join('\n') : '';

  return {
    title,
    url,
    content
  };
}

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
  bookmarksDropdown.innerHTML = '<option disabled selected value> -- select a bookmark -- </option>';
  const bookmarkUrls = Object.keys(bookmarks);
  bookmarkContainer.style.display = bookmarkUrls.length === 0 ? 'none' : 'block';
  bookmarkUrls.forEach(key => {
    const option = document.createElement('option');
    option.innerText = key;
    option.value = key;
    bookmarksDropdown.appendChild(option);
  });
}

const renderParagraphJumpButton = () => {
  const bookmarkedParas = getBookmarks()?.[currentUrl]?.bookmarkedParas;
  nextBookmarkParaButton.style.display = (bookmarkedParas && bookmarkedParas?.length > 0) ? 'flex' : 'none';
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
  const markdown = await fetch('https://r.jina.ai/' + url, {
    headers: {
      "X-No-Cache": true,
      "X-Md-Heading-Style": "setext",
    }
  })
    .then(response => response.text());
  return markdown;
}

function preProcessHTML(html, bookmarkedParas) {
  let pIndex = 0;
  return html
    .replaceAll(
      /<a href="(https?:\/\/[^"]+)">([\s\S]*?)<\/a>/g,
      (_, url, text) => {
        return `<a href="#" 
          onmouseover="showStatus('${url}')"
          onmouseout="hideStatus()"
          onclick="handleLinkClick(event, '${url}');">${text}</a><a class="new-tab" href="${url}" target="_blank">&rarr;</a>`
      }
    )
    .replaceAll(
      /<p>([\s\S]*?)<\/p>/g,
      (_, content) => {
        const isBookmarked = bookmarkedParas && bookmarkedParas.includes(`${pIndex}`);
        const result = `<p>
          ${`
            <span
              class="bookmark-indicator ${isBookmarked ? 'bookmarked' : ''}"
            >
              <a data-paragraph-index="${pIndex}" class="bookmarkButton" href="#">
              ${bookmarkSvg(
          isBookmarked ? '#fff' : '#aaa'
        )}
              </a>
            </span>
            `}
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
        renderBookmarksDropdown();
      }
    });
}

async function loadPage(url) {
  console.log(`loading ${url}`)
  currentUrl = url;

  const bookmarks = getBookmarks();
  const isBookmarked = bookmarks.hasOwnProperty(url);
  if (!isBookmarked) {
    content.innerHTML = `loading <em>${url}</em>`
  }

  const rawMarkdown = isBookmarked ? bookmarks[url].mdContent : await urlToMarkdown(url);
  const {
    title,
    content: markdown
  } = parseJinaResponse(rawMarkdown);
  const rawHtml = marked.parse(markdown);
  const html = preProcessHTML(rawHtml, isBookmarked ? bookmarks[url].bookmarkedParas : undefined);

  content.innerHTML = html;
  document.title = title;
  postProcessHTML(url, rawMarkdown);

  renderParagraphJumpButton();

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
      renderBookmarksDropdown();
    }
  }
  deleteBookmarkButton.onclick = async (e) => {
    e.preventDefault();
    const value = bookmarksDropdown.value;
    if (!value) return;
    if (!confirm('Are you sure you want to remove the bookmark for ' + value + '?')) {
      return
    }
    deleteBookmark(value);
    renderBookmarksDropdown();
    await loadPage(START_URL);
  };
  nextBookmarkParaButton.onclick = () => {
    const bookmarkedParas = getBookmarks()?.[currentUrl].bookmarkedParas;
    if (bookmarkedParas.length > 0) {
      this.scrollToBookmarkPara(currParaBookmarkIndex % bookmarkedParas.length);
      currParaBookmarkIndex++;
    }
  }
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
