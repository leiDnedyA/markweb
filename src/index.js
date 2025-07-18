const START_URL = 'lobste.rs';

const cache = {};

const urlInput = document.querySelector('#url-input');
const inputForm = document.querySelector('#input-form');
const container = document.querySelector('#content');

async function parseUrl(url) {
  if (cache.hasOwnProperty(url)) {
    return cache[url];
  }
  const markdown = await fetch('https://r.jina.ai/' + url)
    .then(response => response.text());
  const html = marked.parse(markdown)
    .replaceAll(
      /<a href="(https?:\/\/[^"]+)">([\s\S]*?)<\/a>/g,
      (_, url, text) =>
        `<a href="#" onclick="handleLinkClick(event, '${url}');">${text}</a>(<a href="${url}" target="_blank">+</a>)`
    )
  cache[url] = html;
  return html;
}

async function loadPage(url) {
  content.innerHTML = `loading <em><a href="${url}">${url}</a></em>`
  console.log(`loading ${url}`)
  const html = await parseUrl(url);
  content.innerHTML = html;
  console.log(`loaded.`);
}

async function handleLinkClick(e, url) {
  e?.preventDefault();
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
