/* ── Config ──────────────────────────────────────────── */
var API_BASE = 'https://api.swisstablesoccer.ch/rankings';

var CATEGORIES = [
  { id: 'OS', label: 'Open Singles' },
  { id: 'OD', label: 'Open Doubles' },
  { id: 'OC', label: 'Open Combined' },
  { id: 'WS', label: 'Women Singles' },
  { id: 'WD', label: 'Women Doubles' },
  { id: 'MX', label: 'Open Mixed' },
  { id: 'JS', label: 'Junior Singles' },
  { id: 'JD', label: 'Junior Doubles' },
  { id: 'SS', label: 'Senior O50 Singles' },
  { id: 'SD', label: 'Senior O50 Doubles' }
];

/* ── State ───────────────────────────────────────────── */
var activeCategory = 'OS';

/* ── Helpers ─────────────────────────────────────────── */

/**
 * Convert a 2-letter ISO country code to a flag emoji.
 */
function countryFlag(code) {
  if (!code || code.length !== 2) return '';
  try {
    return String.fromCodePoint(
      code.toUpperCase().charCodeAt(0) - 65 + 0x1F1E6,
      code.toUpperCase().charCodeAt(1) - 65 + 0x1F1E6
    );
  } catch (e) { return ''; }
}

/**
 * Minimal HTML-escape (attribute-safe).
 */
function escapeHtml(str) {
  return $('<div>').text(str == null ? '' : String(str)).html();
}

/* ── URL helpers ─────────────────────────────────────── */

/**
 * Read a URL query-string and return an object.
 */
function parseQuery() {
  var params = {};
  var search = window.location.search.slice(1);
  if (!search) return params;
  search.split('&').forEach(function (pair) {
    var kv = pair.split('=');
    if (kv[0]) params[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || '');
  });
  return params;
}

/**
 * Push active category into the URL (no page reload).
 */
function updateUrl() {
  var p = new URLSearchParams();
  p.set('cat', activeCategory);
  history.replaceState(null, '', '?' + p.toString());
}

/* ── Fetch ───────────────────────────────────────────── */
/**
 * Fetch rankings for the given category abbreviation.
 * GET https://api.swisstablesoccer.ch/rankings/{cat}
 */
function fetchRankings(cat) {
  return $.getJSON(API_BASE + '/' + encodeURIComponent(cat));
}

/* ── Render ──────────────────────────────────────────── */
function renderTable(data) {
  /* API returns { page, pages, standings: [ { rank, team: [{player, country, …}], points, … } ] } */
  var rows = Array.isArray(data) ? data : (data.standings || []);

  if (rows.length === 0) {
    $('#rankingBody').html(
      '<tr class="state-row"><td colspan="4">No rankings available.</td></tr>'
    );
    return;
  }

  var html = $.map(rows, function (r) {
    var rank   = r.rank != null ? r.rank : '-';
    var isTop3 = typeof rank === 'number' && rank <= 3;

    /* ── Player cell – first (or only) team member ── */
    var member     = (r.team && r.team[0]) || {};
    var playerName = member.player || '-';

    /* ── Country cell ── */
    var rawCountry  = member.country || '';
    var code        = rawCountry.toUpperCase().slice(0, 2);
    var flag        = countryFlag(code);
    var countryCell = flag
      ? '<span class="country-flag">' + flag + '</span><span class="country-code">' + escapeHtml(code) + '</span>'
      : (code ? '<span class="country-code">' + escapeHtml(code) + '</span>' : '-');

    /* ── Points cell ── */
    var points = r.points != null ? r.points : '-';

    return '<tr>' +
      '<td class="col-rank"><span class="r-rank' + (isTop3 ? ' is-top3' : '') + '">' + escapeHtml(rank) + '</span></td>' +
      '<td><span class="r-name">' + escapeHtml(playerName) + '</span></td>' +
      '<td class="col-country">' + countryCell + '</td>' +
      '<td class="col-points text-end"><span class="r-points">' + escapeHtml(points) + '</span></td>' +
      '</tr>';
  }).join('');

  $('#rankingBody').html(html);
}

/* ── State helpers ───────────────────────────────────── */
function showLoading() {
  $('#rankingBody').html(
    '<tr class="state-row"><td colspan="4">' +
    '<span class="spinner-border spinner-border-sm text-secondary me-2" role="status"></span>' +
    'Loading…</td></tr>'
  );
}

function showError(msg) {
  $('#rankingBody').html(
    '<tr class="state-row is-error"><td colspan="4">' +
    '<i class="fa-solid fa-triangle-exclamation me-2"></i>' + escapeHtml(msg) + '</td></tr>'
  );
}

/* ── Load a category ─────────────────────────────────── */
function loadCategory(cat) {
  activeCategory = cat;
  updateUrl();

  /* Update active tab highlight */
  $('#rankingTabs .ranking-tab').each(function () {
    var isActive = $(this).data('cat') === cat;
    $(this).toggleClass('active', isActive).attr('aria-selected', String(isActive));
  });

  showLoading();
  fetchRankings(cat)
    .done(function (data) { renderTable(data); })
    .fail(function (xhr) {
      showError('Failed to load rankings (HTTP ' + (xhr.status || '?') + ').');
    });
}

/* ── Build tab bar ───────────────────────────────────── */
function buildTabs(initialCat) {
  var $tabs = $('#rankingTabs');
  $tabs.empty();
  $.each(CATEGORIES, function (_, cat) {
    var isActive = cat.id === initialCat;
    $('<button>')
      .addClass('ranking-tab' + (isActive ? ' active' : ''))
      .attr({ 'data-cat': cat.id, 'role': 'tab', 'aria-selected': String(isActive) })
      .text(cat.label)
      .on('click', function () { loadCategory(cat.id); })
      .appendTo($tabs);
  });
}

/* ── Initialise ──────────────────────────────────────── */
$(function () {
  var params = parseQuery();
  var initialCat = (params.cat && CATEGORIES.some(function (c) { return c.id === params.cat; })) ? params.cat : 'OS';

  buildTabs(initialCat);
  loadCategory(initialCat);
});

