const LANDING_PAGE = 'aydendiel.dev';

const urlInput = document.querySelector('#url-input');
const inputForm = document.querySelector('#input-form');
const container = document.querySelector('#content');

async function loadPage(url) {
  const markdown = await fetch('https://r.jina.ai/' + url)
    .then(response => response.text());
  const html = marked.parse(markdown)
    .replaceAll(
      /<a href="(https?:\/\/[^"]+)">([\s\S]*?)<\/a>/g,
      (_, url, text) =>
        `<a href="#" onclick="handleLinkClick(event, '${url}');">${text}</a><a href="${url}">+</a>`
    )
  content.innerHTML = html;
}

async function handleLinkClick(e, url) {
  e.preventDefault();
  await loadPage(url);
}

window.onload = () => {
  loadPage(LANDING_PAGE);
}

inputForm.onsubmit = (e) => {
  e.preventDefault();
  loadPage(urlInput.value);
}
