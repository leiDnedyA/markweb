import { marked } from 'https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js';
import { hideStatus, renderBookmarksDropdown, renderBookmarkJumpButton, scrollToBookmark, showStatus } from './view.js';
import { deleteBookmark, getBookmarkedBlocks, getBookmarks, saveBookmark, toggleBlockBookmark } from './data/bookmarks.js';
import { bookmarkSvg } from './svg.js';
import { getJinaMarkdown, stealFavicon } from './data/requests.js';

const START_URL = 'https://leidnedya.github.io/markweb/introduction.html';

// Kept in the same shape as a Jina response so that bookmarking the demo page
// caches markdown that parseJinaResponse can read back.
const DEMO_MARKDOWN = `Title: Welcome to Markweb!
URL Source: ${START_URL}
Markdown Content:

# About Markweb

Markweb de-clutters the web for reading.  
To understand how links work, try clicking the '→' sign beside  
this link, and then click the link itself: [How to Do Great Work (Paul Graham)](https://paulgraham.com/greatwork.html).

To open Markweb from a webpage (let's say you're coming from \`https://example.com\`), you can simply add  
\`leidnedya.github.io/markweb/#<your-url-here>\` before the URL.

![demo gif](./demo.gif)
`;

let currentUrl = null;
let currentMarkdown = null;
let currBlockBookmarkIndex = 0;

const urlInput = document.querySelector('#url-input');
const inputForm = document.querySelector('#input-form');
const nextBookmarkBlockButton = document.querySelector('#next-bookmark')
const loadBookmarkButton = document.querySelector('#load-bookmark');
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

function bookmarkIndicator(kind, index, isBookmarked) {
  return `
    <span
      class="bookmark-indicator ${isBookmarked ? 'bookmarked' : ''}"
    >
      <a data-bookmark-kind="${kind}" data-bookmark-index="${index}" class="bookmarkButton" href="#">
      ${bookmarkSvg(isBookmarked ? '#fff' : '#aaa')}
      </a>
    </span>
    `;
}

function preProcessHTML(html, bookmark) {
  const bookmarkedParas = getBookmarkedBlocks(bookmark, 'paragraph');
  const bookmarkedHeaders = getBookmarkedBlocks(bookmark, 'header');
  let pIndex = 0;
  let hIndex = 0;
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
        const isBookmarked = bookmarkedParas.includes(`${pIndex}`);
        const result = `<p>
          ${bookmarkIndicator('paragraph', pIndex, isBookmarked)}
          ${content}
        </p>`;
        pIndex++;
        return result;
      })
    .replaceAll(
      /<h([1-6])([^>]*)>([\s\S]*?)<\/h\1>/g,
      (_, level, attributes, content) => {
        const isBookmarked = bookmarkedHeaders.includes(`${hIndex}`);
        const result = `<h${level}${attributes}>
          ${bookmarkIndicator('header', hIndex, isBookmarked)}
          ${content}
        </h${level}>`;
        hIndex++;
        return result;
      })
}

// Update the dom after rendering the HTML
function postProcessHTML(url, markdown) {
  document.querySelectorAll('.bookmarkButton')
    .forEach(anchor => {
      const { bookmarkKind, bookmarkIndex } = anchor.dataset;
      anchor.onclick = (e) => {
        e.preventDefault();
        toggleBlockBookmark(url, markdown, bookmarkKind, bookmarkIndex);
        loadPage(url);
        renderBookmarksDropdown(getBookmarks());
      }
    });
}

async function loadPage(url, isDemo = false) {
  console.log(`loading ${url}`)
  currentUrl = url;

  urlInput.value = url;

  const bookmarks = getBookmarks();
  const isBookmarked = bookmarks.hasOwnProperty(url);
  if (!isBookmarked) {
    content.innerHTML = `<span>loading <em>${url}</em></span>`
  }

  try {
    console.log(...arguments)
    const rawMarkdown = isDemo ?
      DEMO_MARKDOWN :
      (isBookmarked ? bookmarks[url].mdContent : await getJinaMarkdown(url));
    currentMarkdown = rawMarkdown;
    const {
      title,
      content: markdown
    } = parseJinaResponse(rawMarkdown);
    const rawHtml = marked.parse(markdown);
    const html = preProcessHTML(rawHtml, isBookmarked ? bookmarks[url] : undefined);

    content.innerHTML = html;
    document.title = title;
    postProcessHTML(url, rawMarkdown);

    stealFavicon(url);

    currBlockBookmarkIndex = 0;
    renderBookmarkJumpButton();

    console.log(`loaded.`);
  } catch (err) {
    console.error(err);
    alert('Failed to get cleaned page content, please try again later.')
    return;
  }
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
  loadPage(hashUrl ? hashUrl : START_URL, !hashUrl);
  renderBookmarksDropdown(getBookmarks());
  loadBookmarkButton.onclick = async (e) => {
    e.preventDefault();
    const value = bookmarksDropdown.value
    if (value) {
      await loadPage(value);
      renderBookmarksDropdown(getBookmarks());
    }
  }
  nextBookmarkBlockButton.onclick = () => {
    if (scrollToBookmark(currBlockBookmarkIndex)) {
      currBlockBookmarkIndex++;
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
