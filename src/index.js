const START_URL = 'https://leidnedya.github.io/markweb/introduction.html';

const cache = {};

const urlInput = document.querySelector('#url-input');
const inputForm = document.querySelector('#input-form');
const container = document.querySelector('#content');
const statusBar = document.querySelector('#status-bar');
const bookmarksDropdown = document.querySelector('#bookmarks');

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

function renderBookmarksDropdown() {
  const bookmarks = getBookmarks();
  bookmarksDropdown.innerHTML = '';
  Object.keys(bookmarks).forEach(key => {
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

function preProcessHTML(html) {
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
        const result = `<p>
          <span class="tooltip"><a data-paragraph-index="${pIndex}" class="bookmarkButton" href="#">Add bookmark</a></span>
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
        alert(`i: ${pIndex}`);
        saveBookmark(url, markdown, pIndex);
      }
    });
}

async function loadPage(url) {
  content.innerHTML = `loading <em>${url}</em>`
  console.log(`loading ${url}`)
  const markdown = await urlToMarkdown(url);
  const rawHtml = marked.parse(markdown);
  const html = preProcessHTML(rawHtml);
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
}

window.addEventListener('popstate', (e) => {
  e.preventDefault();
  loadPage(e.state);
})

inputForm.onsubmit = async (e) => {
  e.preventDefault();
  await loadPage(urlInput.value);
  history.pushState(url, url)
}
