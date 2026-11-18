function getCompetitionSlug() {
  return document.documentElement.dataset.competition || 'stl';
}

function syncCompetitionTitle() {
  var slug = getCompetitionSlug();
  var suffix = (typeof tr === 'function')
    ? tr('pageTitle_' + slug)
    : (slug === 'stc' ? 'Swiss Tablesoccer Cup' : 'Swiss Tablesoccer League');
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

function parseCompetitionMarkdown(markdown) {
  var lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n');
  var heroLines = [];
  var groups = [];
  var group = null;
  var card = null;

  lines.forEach(function (line) {
    if (line.indexOf('## ') === 0) {
      group = { title: line.slice(3).trim(), introLines: [], cards: [] };
      card = null;
      groups.push(group);
    } else if (line.indexOf('### ') === 0 && group) {
      card = { title: line.slice(4).trim(), bodyLines: [] };
      group.cards.push(card);
    } else if (card) {
      card.bodyLines.push(line);
    } else if (group) {
      group.introLines.push(line);
    } else {
      heroLines.push(line);
    }
  });

  return { heroMarkdown: heroLines.join('\n').trim(), groups: groups };
}

function renderCompetitionContent(markdown, targetId) {
  var parsed = parseCompetitionMarkdown(markdown);
  var parts = [];

  if (parsed.heroMarkdown) {
    parts.push('<div class="stl-hero">' + marked.parse(parsed.heroMarkdown) + '</div>');
  }

  parsed.groups.forEach(function (group) {
    var introMarkdown = group.introLines.join('\n').trim();
    var introHtml = introMarkdown ? marked.parse(introMarkdown) : '';

    parts.push('<h1 class="finals-main-title">' + escapeHtml(group.title) + '</h1>');

    if (!group.cards.length) {
      var groupEditions = splitCompetitionEditions(introMarkdown);
      if (groupEditions.editions.length) {
        parts.push('<section class="stl-editions">' + renderCompetitionEditions(groupEditions, 2) + '</section>');
      } else if (introHtml) {
        parts.push('<section class="stl-card">' + introHtml + '</section>');
      }
      return;
    }

    group.cards.forEach(function (card, index) {
      var bodyMarkdown = card.bodyLines.join('\n').trim();
      var editionList = splitCompetitionEditions(bodyMarkdown);
      var mediaMarkdown = '';
      var mediaMatch = bodyMarkdown.match(/^\[?!\[[^\]]*\]\([^)]*\)(\]\([^)]*\))?\s*(\n|$)/);

      if (editionList.editions.length) {
        parts.push(
          '<section class="stl-editions">' +
            '<h2>' + escapeHtml(card.title) + '</h2>' +
            renderCompetitionEditions(editionList, 3) +
          '</section>'
        );
        return;
      }

      if (mediaMatch) {
        mediaMarkdown = mediaMatch[0].trim();
        bodyMarkdown = bodyMarkdown.slice(mediaMatch[0].length).trim();
      }

      var cardHtml =
        '<section class="stl-card">' +
          '<h2>' + escapeHtml(card.title) + '</h2>' +
          (bodyMarkdown ? marked.parse(bodyMarkdown) : '') +
        '</section>';

      if (index === 0 && introHtml) {
        parts.push(
          '<div class="stl-row">' +
            '<section class="stl-card stl-card-media">' + introHtml + '</section>' +
            cardHtml +
          '</div>'
        );
      } else if (mediaMarkdown) {
        parts.push(
          '<div class="stl-row is-reversed">' +
            cardHtml +
            '<section class="stl-card stl-card-media stl-card-photo">' + marked.parse(mediaMarkdown) + '</section>' +
          '</div>'
        );
      } else {
        parts.push(cardHtml);
      }
    });
  });

  $('#' + targetId).html(parts.join(''));
  openExternalCompetitionButtonsInNewTab(document.getElementById(targetId));
}

function loadCompetitionMarkdown() {
  var slug = getCompetitionSlug();
  var lang = (typeof currentLang !== 'undefined' ? currentLang : 'de');
  var $target = $('#competition-content');
  var primary = './' + slug + '-' + lang + '.md';

  fetch(primary)
    .then(function (res) {
      if (!res.ok) return fetch('./' + slug + '-de.md');
      return res;
    })
    .then(function (res) { return res.text(); })
    .then(function (text) {
      renderCompetitionContent(text, 'competition-content');
    })
    .catch(function () {
      $target.html('<p class="text-danger">Inhalt konnte nicht geladen werden.</p>');
    });
}

$(function () {
  syncCompetitionTitle();
  loadCompetitionMarkdown();

  document.addEventListener('langChanged', function () {
    syncCompetitionTitle();
    loadCompetitionMarkdown();
  });
});
