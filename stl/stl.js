function syncStlTitle() {
  var suffix = (typeof tr === 'function') ? tr('pageTitle_stl') : 'Swiss Tablesoccer League';
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

function parseStlMarkdown(markdown) {
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

function splitStlEditions(markdown) {
  var introLines = [];
  var editions = [];
  var current = null;

  markdown.split('\n').forEach(function (line) {
    if (line.indexOf('#### ') === 0) {
      current = { title: line.slice(5).trim(), bodyLines: [] };
      editions.push(current);
    } else if (current) {
      current.bodyLines.push(line);
    } else {
      introLines.push(line);
    }
  });

  return { intro: introLines.join('\n').trim(), editions: editions };
}

function renderStlEditions(editionList, headingLevel) {
  return (editionList.intro ? marked.parse(editionList.intro) : '') +
    '<div class="stl-editions-grid">' +
      editionList.editions.map(function (edition) {
        var body = edition.bodyLines.join('\n').trim();
        return '<article class="stl-card stl-edition">' +
          '<h' + headingLevel + '>' + escapeHtml(edition.title) + '</h' + headingLevel + '>' +
          (body ? marked.parse(body) : '') +
          '</article>';
      }).join('') +
    '</div>';
}

function renderStlContent(markdown, targetId) {
  var parsed = parseStlMarkdown(markdown);
  var parts = [];

  if (parsed.heroMarkdown) {
    parts.push('<div class="stl-hero">' + marked.parse(parsed.heroMarkdown) + '</div>');
  }

  parsed.groups.forEach(function (group) {
    var introMarkdown = group.introLines.join('\n').trim();
    var introHtml = introMarkdown ? marked.parse(introMarkdown) : '';

    parts.push('<h1 class="finals-main-title">' + escapeHtml(group.title) + '</h1>');

    if (!group.cards.length) {
      var groupEditions = splitStlEditions(introMarkdown);
      if (groupEditions.editions.length) {
        parts.push('<section class="stl-editions">' + renderStlEditions(groupEditions, 2) + '</section>');
      } else if (introHtml) {
        parts.push('<section class="stl-card">' + introHtml + '</section>');
      }
      return;
    }

    group.cards.forEach(function (card, index) {
      var bodyMarkdown = card.bodyLines.join('\n').trim();
      var editionList = splitStlEditions(bodyMarkdown);
      var mediaMarkdown = '';
      var mediaMatch = bodyMarkdown.match(/^\[?!\[[^\]]*\]\([^)]*\)(\]\([^)]*\))?\s*(\n|$)/);

      if (editionList.editions.length) {
        parts.push(
          '<section class="stl-editions">' +
            '<h2>' + escapeHtml(card.title) + '</h2>' +
            renderStlEditions(editionList, 3) +
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
}

function loadStlMarkdown() {
  var lang = (typeof currentLang !== 'undefined' ? currentLang : 'de');
  var $target = $('#stl-content');
  var primary = './stl-' + lang + '.md';

  fetch(primary)
    .then(function (res) {
      if (!res.ok) return fetch('./stl-de.md');
      return res;
    })
    .then(function (res) { return res.text(); })
    .then(function (text) {
      renderStlContent(text, 'stl-content');
    })
    .catch(function () {
      $target.html('<p class="text-danger">Inhalt konnte nicht geladen werden.</p>');
    });
}

$(function () {
  syncStlTitle();
  loadStlMarkdown();

  document.addEventListener('langChanged', function () {
    syncStlTitle();
    loadStlMarkdown();
  });
});
