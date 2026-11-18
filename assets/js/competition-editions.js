function splitCompetitionEditions(markdown) {
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

function renderCompetitionEditions(editionList, headingLevel) {
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

function openExternalCompetitionButtonsInNewTab(container) {
  var selector = '.stl-edition li a, ' +
    '.stl-row.is-reversed > .stl-card:not(.stl-card-media) li a, ' +
    '.stc-actions a, .competition-action';

  container.querySelectorAll(selector).forEach(function (link) {
    if ((link.protocol === 'http:' || link.protocol === 'https:') &&
        link.origin !== window.location.origin) {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    }
  });
}
