/* ── About page ──────────────────────────────────────────── */

var COMMITTEES_API = 'https://api.swisstablesoccer.ch/committees';

/**
 * Fetch a markdown file for the given base name and current language,
 * parse it with marked.js, and inject the result into the target element.
 * Falls back to English if the language-specific file is unavailable.
 */
function loadMarkdown(baseName, targetId) {
  var lang = (typeof currentLang !== 'undefined' ? currentLang : 'en');
  var url = './' + baseName + '-' + lang + '.md';
  var $target = $('#' + targetId);

  fetch(url)
    .then(function (res) {
      if (!res.ok) return fetch('./' + baseName + '-en.md');
      return res;
    })
    .then(function (res) { return res.text(); })
    .then(function (text) {
      $target.html(marked.parse(text));
    })
    .catch(function () {
      $target.empty();
    });
}

/* ── Committees rendering ─────────────────────────────────── */

function renderMemberCard(member) {
  var p = member.person;
  var fullName = p.first_name + ' ' + p.last_name;
  var $img = $('<img>')
    .addClass('member-avatar')
    .attr('src', p.image)
    .attr('alt', fullName)
    .on('error', function () {
      $(this).attr('src', 'https://app.tablesoccer.org/icon/profile.svg');
    });

  return $('<div>').addClass('member-card')
    .append($img)
    .append(
      $('<div>').addClass('member-info')
        .append($('<div>').addClass('member-name').text(fullName))
        .append($('<div>').addClass('member-title').text(member.title))
    );
}

function renderCommittee(committee, level) {
  var $block = $('<div>').addClass('committee-block').addClass('committee-level-' + level);

  $block.append($('<div>').addClass('committee-name').text(committee.name));

  if (committee.members && committee.members.length) {
    var sorted = committee.members.slice().sort(function (a, b) { return a.rank - b.rank; });
    var $members = $('<div>').addClass('committee-members');
    sorted.forEach(function (m) { $members.append(renderMemberCard(m)); });
    $block.append($members);
  }

  if (committee.committees && committee.committees.length) {
    var $subs = $('<div>').addClass('committee-subs');
    committee.committees.forEach(function (sub) {
      $subs.append(renderCommittee(sub, level + 1));
    });
    $block.append($subs);
  }

  return $block;
}

function loadCommittees() {
  var $content = $('#committees-content');
  $content.html(
    '<div class="text-center text-secondary py-3">' +
    '<span class="spinner-border spinner-border-sm me-2" role="status"></span>' +
    (typeof tr === 'function' ? tr('loading') : 'Loading\u2026') +
    '</div>'
  );

  fetch(COMMITTEES_API)
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function (data) {
      $content.empty();
      if (!data || !data.length) {
        $content.html('<p class="text-muted text-center py-3">' + (typeof tr === 'function' ? tr('aboutFailedCommittees') : 'No data available.') + '</p>');
        return;
      }
      data.forEach(function (committee) {
        $content.append(renderCommittee(committee, 0));
      });
    })
    .catch(function () {
      $content.html('<p class="text-danger text-center py-3">' + (typeof tr === 'function' ? tr('aboutFailedCommittees') : 'Failed to load organisation.') + '</p>');
    });
}

/* ── Initialisation ──────────────────────────────────────── */

$(function () {
  loadMarkdown('about', 'about-text');
  loadMarkdown('values', 'values-text');
  loadCommittees();

  document.addEventListener('langChanged', function () {
    loadMarkdown('about', 'about-text');
    loadMarkdown('values', 'values-text');
  });
});
