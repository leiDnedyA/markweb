const START_URL = 'https://leidnedya.github.io/markweb/introduction.html';

const cache = {};

const urlInput = document.querySelector('#url-input');
const inputForm = document.querySelector('#input-form');
const container = document.querySelector('#content');
const statusBar = document.querySelector('#status-bar');

function showStatus(text) {
  statusBar.style.display = 'block';
  statusBar.innerText = text;
}

function hideStatus() {
  statusBar.style.display = 'none';
}

async function parseUrl(url) {
  if (cache.hasOwnProperty(url)) {
    return cache[url];
  }
  const markdown = await fetch('https://r.jina.ai/' + url, {
    headers: {
      "X-No-Cache": true
    }
  })
    .then(response => response.text());
  const html = marked.parse(markdown)
    .replaceAll(
      /<a href="(https?:\/\/[^"]+)">([\s\S]*?)<\/a>/g,
      (_, url, text) =>
        `<a href="#" 
          onmouseover="showStatus('${url}')"
          onmouseout="hideStatus()"
          onclick="handleLinkClick(event, '${url}');">${text}</a><a class="new-tab" href="${url}" target="_blank">+</a>`
    )
  cache[url] = html;
  return html;
}

async function loadPage(url) {
  content.innerHTML = `loading <em>${url}</em>`
  console.log(`loading ${url}`)
  const html = await parseUrl(url);
  content.innerHTML = html;
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
