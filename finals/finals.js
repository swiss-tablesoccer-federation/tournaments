function syncFinalsTitle() {
  var suffix = (typeof tr === 'function') ? tr('pageTitle_finals') : 'Schweizermeisterschaft';
  document.title = 'Swiss Tablesoccer Federation - ' + suffix;
}

var FINALS_IMAGES = [
  '../assets/img/finals-01.png',
  '../assets/img/finals-02.png',
  '../assets/img/finals-03.png',
  '../assets/img/finals-04.png'
];

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function splitMarkdownSections(markdown) {
  var lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n');
  var h1 = '';
  var introLines = [];
  var sections = [];
  var currentSection = null;

  lines.forEach(function (line) {
    if (!h1 && line.indexOf('# ') === 0) {
      h1 = line.slice(2).trim();
      return;
    }

    if (line.indexOf('## ') === 0) {
      if (currentSection) sections.push(currentSection);
      currentSection = {
        title: line.slice(3).trim(),
        bodyLines: []
      };
      return;
    }

    if (currentSection) {
      currentSection.bodyLines.push(line);
    } else {
      introLines.push(line);
    }
  });

  if (currentSection) sections.push(currentSection);

  return {
    h1: h1,
    introMarkdown: introLines.join('\n').trim(),
    sections: sections
  };
}

function renderFinalsContent(markdown, targetId) {
  var parsed = splitMarkdownSections(markdown);
  var parts = [];

  if (parsed.h1) {
    parts.push('<h1 class="finals-main-title">' + escapeHtml(parsed.h1) + '</h1>');
  }

  if (parsed.introMarkdown) {
    parts.push('<div class="finals-intro">' + marked.parse(parsed.introMarkdown) + '</div>');
  }

  parsed.sections.forEach(function (section, index) {
    var bodyMarkdown = section.bodyLines.join('\n').trim();
    var bodyHtml = bodyMarkdown ? marked.parse(bodyMarkdown) : '';
    var image = FINALS_IMAGES[index % FINALS_IMAGES.length];
    var reversed = (index % 2 === 1) ? ' is-reversed' : '';

    parts.push(
      '<section class="finals-split-section' + reversed + '">' +
        '<div class="finals-section-media">' +
          '<img src="' + escapeHtml(image) + '" alt="Schweizermeisterschaft" loading="lazy" decoding="async" />' +
        '</div>' +
        '<div class="finals-section-text">' +
          '<h2>' + escapeHtml(section.title) + '</h2>' +
          bodyHtml +
        '</div>' +
      '</section>'
    );
  });

  $('#' + targetId).html(parts.join(''));
}

function loadFinalsMarkdown() {
  var lang = (typeof currentLang !== 'undefined' ? currentLang : 'de');
  var $target = $('#finals-content');
  var primary = './finals-' + lang + '.md';

  fetch(primary)
    .then(function (res) {
      if (!res.ok) return fetch('./finals-de.md');
      return res;
    })
    .then(function (res) { return res.text(); })
    .then(function (text) {
      renderFinalsContent(text, 'finals-content');
    })
    .catch(function () {
      $target.html('<p class="text-danger">Inhalt konnte nicht geladen werden.</p>');
    });
}

$(function () {
  syncFinalsTitle();
  loadFinalsMarkdown();

  document.addEventListener('langChanged', function () {
    syncFinalsTitle();
    loadFinalsMarkdown();
  });
});
