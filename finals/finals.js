function syncFinalsTitle() {
  var suffix = (typeof tr === 'function') ? tr('pageTitle_finals') : 'Schweizermeisterschaft';
  document.title = 'Swiss Tablesoccer Federation - ' + suffix;
}

var FINALS_IMAGES = [
  '../assets/img/finals-01.png',
  '../assets/img/finals-02.png',
  '../assets/img/finals-03.png'
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
  var $intro = $('<div>').html(marked.parse(parsed.introMarkdown));
  var $logo = $intro.find('.stc-logo-content').first().detach();

  if (!$logo.length) throw new Error('Finals logo card is missing');

  if (parsed.h1) {
    parts.push('<h1 class="finals-main-title">' + escapeHtml(parsed.h1) + '</h1>');
  }

  parts.push(
    '<div class="stl-row">' +
      '<section class="stl-card stl-card-media finals-logo-card">' + $logo[0].outerHTML + '</section>' +
      '<section class="stl-card">' + $intro.html() + '</section>' +
    '</div>'
  );

  parsed.sections.forEach(function (section, index) {
    var bodyMarkdown = section.bodyLines.join('\n').trim();
    var editions = splitCompetitionEditions(bodyMarkdown);

    if (editions.editions.length) {
      parts.push(
        '<section class="stl-editions">' +
          '<h2>' + escapeHtml(section.title) + '</h2>' +
          renderCompetitionEditions(editions, 3) +
        '</section>'
      );
      return;
    }

    var bodyHtml = bodyMarkdown ? marked.parse(bodyMarkdown) : '';
    var reversed = index % 2 === 0;
    var media = '<section class="stl-card stl-card-media stl-card-photo">' +
      '<img src="' + escapeHtml(FINALS_IMAGES[index % FINALS_IMAGES.length]) + '" alt="" loading="lazy" decoding="async" />' +
      '</section>';
    var content = '<section class="stl-card">' +
      '<h2>' + escapeHtml(section.title) + '</h2>' +
      bodyHtml +
      '</section>';

    parts.push(
      '<div class="stl-row' + (reversed ? ' is-reversed' : '') + '">' +
        (reversed ? content + media : media + content) +
      '</div>'
    );
  });

  $('#' + targetId).html(parts.join(''));
  openExternalCompetitionButtonsInNewTab(document.getElementById(targetId));
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
