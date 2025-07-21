async function getJinaMarkdown(url) {
  const markdown = await fetch('https://r.jina.ai/' + url, {
    headers: {
      "X-No-Cache": true,
      "X-Md-Heading-Style": "setext",
    }
  })
    .then(response => response.text());
  return markdown;
}

function stealFavicon(url) {
  document.querySelector("link[rel='shortcut icon']").href = "https://corsproxy.io/?url=https://www.google.com/s2/favicons?domain=" + url
}

