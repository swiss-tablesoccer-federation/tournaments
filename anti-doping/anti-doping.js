function syncAntiDopingTitle() {
  var suffix = (typeof tr === 'function') ? tr('pageTitle_antiDoping') : 'Anti-Doping';
  document.title = 'Swiss Tablesoccer Federation - ' + suffix;
}

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

function extractSectionImage(markdown) {
  var imageRegex = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/;
  var match = String(markdown || '').match(imageRegex);

  if (!match) {
    return { alt: '', src: '', body: markdown };
  }

  var bodyWithoutImage = String(markdown || '').replace(imageRegex, '').trim();
  return {
    alt: match[1] || '',
    src: match[2] || '',
    body: bodyWithoutImage
  };
}

function buildSplitSectionHtml(section, index) {
  var bodyMarkdown = section.bodyLines.join('\n').trim();
  var imageParts = extractSectionImage(bodyMarkdown);
  var bodyHtml = imageParts.body ? marked.parse(imageParts.body) : '';
  var reversed = (index % 2 === 1) ? ' is-reversed' : '';

  if (imageParts.src) {
    return (
      '<section class="finals-split-section' + reversed + '">' +
        '<div class="finals-section-media">' +
          '<img src="' + escapeHtml(imageParts.src) + '" alt="' + escapeHtml(imageParts.alt || section.title) + '" loading="lazy" decoding="async" />' +
        '</div>' +
        '<div class="finals-section-text">' +
          '<h2>' + escapeHtml(section.title) + '</h2>' +
          bodyHtml +
        '</div>' +
      '</section>'
    );
  }

  return (
    '<section class="finals-split-section anti-doping-tail-card">' +
      '<div class="finals-section-text">' +
        '<h2>' + escapeHtml(section.title) + '</h2>' +
        bodyHtml +
      '</div>' +
    '</section>'
  );
}

function renderAntiDopingMarkdown(markdown) {
  var parsed = splitMarkdownSections(markdown);
  var parts = [];
  var sections = parsed.sections || [];
  var splitUntil = Math.max(sections.length - 2, 0);
  var i;

  if (parsed.h1) {
    parts.push('<h1 class="finals-main-title">' + escapeHtml(parsed.h1) + '</h1>');
  }

  if (parsed.introMarkdown) {
    parts.push('<div class="finals-intro">' + marked.parse(parsed.introMarkdown) + '</div>');
  }

  for (i = 0; i < splitUntil; i++) {
    parts.push(buildSplitSectionHtml(sections[i], i));
  }

  if (sections.length >= 2) {
    parts.push('<div class="anti-doping-tail-grid">');
    parts.push(buildSplitSectionHtml(sections[sections.length - 2], sections.length - 2));
    parts.push(buildSplitSectionHtml(sections[sections.length - 1], sections.length - 1));
    parts.push('</div>');
  } else if (sections.length === 1) {
    parts.push(buildSplitSectionHtml(sections[0], 0));
  }

  $('#anti-doping-content').html(parts.join(''));
}

function loadAntiDopingMarkdown() {
  var lang = (typeof currentLang !== 'undefined' ? currentLang : 'de');
  var $target = $('#anti-doping-content');
  var primary = './anti-doping-' + lang + '.md';

  fetch(primary)
    .then(function (res) {
      if (!res.ok) return fetch('./anti-doping-de.md');
      return res;
    })
    .then(function (res) {
      if (!res.ok) throw new Error('missing markdown');
      return res.text();
    })
    .then(function (text) {
      renderAntiDopingMarkdown(text);
    })
    .catch(function () {
      $target.html('<p class="text-danger">Inhalt konnte nicht geladen werden.</p>');
    });
}

$(function () {
  syncAntiDopingTitle();
  loadAntiDopingMarkdown();

  document.addEventListener('langChanged', function () {
    syncAntiDopingTitle();
    loadAntiDopingMarkdown();
  });
});
