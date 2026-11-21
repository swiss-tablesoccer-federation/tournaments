var SPORT_HERO_IMAGE = 'https://images.squarespace-cdn.com/content/v1/6797790a8025010384cf53f2/1738025500758-6KI7037XWSNQ3GLXID7M/Corporate+Design+Handbuch+-+Bild+1.jpg';

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function splitSportMarkdown(markdown) {
  var lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n');
  var h1 = '';
  var introLines = [];
  var sections = [];
  var currentSection = null;

  lines.forEach(function (line) {
    if (!h1 && line.indexOf('# ') === 0) {
      h1 = line.slice(2).trim();
    } else if (line.indexOf('## ') === 0) {
      if (currentSection) sections.push(currentSection);
      currentSection = { title: line.slice(3).trim(), bodyLines: [] };
    } else if (currentSection) {
      currentSection.bodyLines.push(line);
    } else {
      introLines.push(line);
    }
  });
  if (currentSection) sections.push(currentSection);

  return {
    h1: h1,
    intro: introLines.join('\n').trim(),
    sections: sections
  };
}

function renderSportMarkdown(markdown) {
  var parsed = splitSportMarkdown(markdown);
  var parts = [];

  if (parsed.h1) {
    parts.push('<h1 class="finals-main-title">' + escapeHtml(parsed.h1) + '</h1>');
  }

  parts.push('<section class="sport-hero">');
  parts.push('<div class="sport-hero-image"><img src="' + SPORT_HERO_IMAGE + '" alt="' + escapeHtml(parsed.h1) + '" loading="eager" /></div>');
  parts.push('<div class="sport-hero-text">' + (parsed.intro ? marked.parse(parsed.intro) : '') + '</div>');
  parts.push('</section>');

  var cards = parsed.sections.map(function (section) {
    var body = section.bodyLines.join('\n').trim();
    return (
      '<article class="sport-card">' +
        '<h2>' + escapeHtml(section.title) + '</h2>' +
        (body ? marked.parse(body) : '') +
      '</article>'
    );
  });

  parts.push('<div class="sport-card-grid">' + cards.join('') + '</div>');
  $('#sport-content').html(parts.join(''));
}

function loadSportMarkdown() {
  var lang = (typeof currentLang !== 'undefined' ? currentLang : 'de');
  fetch('./sport-' + lang + '.md')
    .then(function (res) {
      if (!res.ok) return fetch('./sport-de.md');
      return res;
    })
    .then(function (res) {
      if (!res.ok) throw new Error('missing markdown');
      return res.text();
    })
    .then(renderSportMarkdown)
    .catch(function () {
      $('#sport-content').html('<p class="text-danger">Inhalt konnte nicht geladen werden.</p>');
    });
}

function syncSportTitle() {
  var suffix = (typeof tr === 'function') ? tr('pageTitle_sportsCommission') : 'Sportkommission';
  document.title = 'Swiss Tablesoccer Federation - ' + suffix;
}

$(function () {
  syncSportTitle();
  loadSportMarkdown();

  document.addEventListener('langChanged', function () {
    syncSportTitle();
    loadSportMarkdown();
  });
});
