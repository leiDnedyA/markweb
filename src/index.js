import { marked } from 'https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js';
import { hideStatus, renderBookmarksDropdown, renderParagraphJumpButton, scrollToBookmarkPara, showStatus } from './view.js';
import { deleteBookmark, getBookmarks, saveBookmark } from './data/bookmarks.js';
import { bookmarkSvg } from './svg.js';
import { getJinaMarkdown, stealFavicon } from './data/requests.js';

const START_URL = 'https://leidnedya.github.io/markweb/introduction.html';

let currentUrl = null;
let currentMarkdown = null;
let currParaBookmarkIndex = 0;

const urlInput = document.querySelector('#url-input');
const inputForm = document.querySelector('#input-form');
const nextBookmarkParaButton = document.querySelector('#next-bookmark')
const loadBookmarkButton = document.querySelector('#load-bookmark');
const deleteBookmarkButton = document.querySelector('#delete-bookmark-button');
const pageBookmarkButton = document.querySelector('#page-bookmark-button');
const bookmarksDropdown = document.querySelector('#bookmarks');

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
        renderBookmarksDropdown(getBookmarks());
      }
    });
}

async function loadPage(url) {
  console.log(`loading ${url}`)
  currentUrl = url;

  urlInput.value = url;

  const bookmarks = getBookmarks();
  const isBookmarked = bookmarks.hasOwnProperty(url);
  if (!isBookmarked) {
    content.innerHTML = `<span>loading <em>${url}</em></span>`
  }

  const rawMarkdown = isBookmarked ? bookmarks[url].mdContent : await getJinaMarkdown(url);
  currentMarkdown = rawMarkdown;

  const {
    title,
    content: markdown
  } = parseJinaResponse(rawMarkdown);
  const rawHtml = marked.parse(markdown);
  const html = preProcessHTML(rawHtml, isBookmarked ? bookmarks[url].bookmarkedParas : undefined);

  content.innerHTML = html;
  document.title = title;
  postProcessHTML(url, rawMarkdown);

  stealFavicon(url);

  renderParagraphJumpButton(currentUrl, getBookmarks());

  console.log(`loaded.`);
}

async function handleLinkClick(e, url) {
  e?.preventDefault();
  hideStatus();
  await loadPage(url);
  history.pushState(url, url);
}

window.onload = () => {

  window.showStatus = showStatus;
  window.hideStatus = hideStatus;
  window.handleLinkClick = handleLinkClick;

  const hashUrl = window.location.hash ? window.location.hash.slice(1) : null;
  handleLinkClick(null, hashUrl ? hashUrl : START_URL);
  renderBookmarksDropdown(getBookmarks());
  loadBookmarkButton.onclick = async (e) => {
    e.preventDefault();
    const value = bookmarksDropdown.value
    if (value) {
      await loadPage(value);
      renderBookmarksDropdown(getBookmarks());
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
    renderBookmarksDropdown(getBookmarks());
    await loadPage(START_URL);
  };
  nextBookmarkParaButton.onclick = () => {
    const bookmarkedParas = getBookmarks()?.[currentUrl].bookmarkedParas;
    if (bookmarkedParas.length > 0) {
      scrollToBookmarkPara(currParaBookmarkIndex % bookmarkedParas.length, getBookmarks(), currentUrl);
      currParaBookmarkIndex++;
    }
  }
  pageBookmarkButton.onclick = (e) => {
    e.preventDefault();
    const bookmarks = getBookmarks();
    if (bookmarks.hasOwnProperty(currentUrl)) {
      if (!confirm('Are you sure you want to remove the bookmark for ' + currentUrl + '?')) {
        return;
      }
      deleteBookmark(currentUrl);
    } else {
      saveBookmark(currentUrl, currentMarkdown);
    }
    renderBookmarksDropdown(getBookmarks());
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
