/* ── Config ──────────────────────────────────────────── */
var API_BASE = 'https://api.swisstablesoccer.ch/rankings';

/* Pixels from the bottom of the scroll container that trigger loading the next page */
var SCROLL_TRIGGER_THRESHOLD = 200;

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
var currentRows    = [];
var currentPage    = 1;
var hasMore        = true;
var isLoadingMore  = false;

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
 * Fetch rankings for the given category abbreviation and page.
 * GET https://api.swisstablesoccer.ch/rankings/{cat}?page={page}
 */
function fetchRankings(cat, page) {
  return $.getJSON(API_BASE + '/' + encodeURIComponent(cat) + '?page=' + (page || 1));
}

/* ── Render ──────────────────────────────────────────── */
function renderRows(rows, startIdx) {
  return $.map(rows, function (r, i) {
    var idx    = startIdx + i;
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

    /* ── STF membership badge ── */
    var mships = member.memberships || [];
    if (mships.includes('STF')) {
      countryCell += '<span class="stf-badge">STF</span>';
    }

    /* ── Points cell ── */
    var points = r.points != null ? r.points : '-';

    return '<tr class="ranking-row" data-idx="' + idx + '">' +
      '<td class="col-rank"><span class="r-rank' + (isTop3 ? ' is-top3' : '') + '">' + escapeHtml(rank) + '</span></td>' +
      '<td><span class="r-name">' + escapeHtml(playerName) + '</span></td>' +
      '<td class="col-country">' + countryCell + '</td>' +
      '<td class="col-points text-end"><span class="r-points">' + escapeHtml(points) + '</span></td>' +
      '</tr>';
  }).join('');
}

function renderTable(data, append) {
  /* API returns { page, pages, standings: [ { rank, team: [{player, country, …}], points, … } ] } */
  var newRows = Array.isArray(data) ? data : (data.standings || []);

  /* Stop loading more pages if this response returned no entries */
  if (newRows.length === 0) {
    hasMore = false;
  }

  if (!append) {
    currentRows = newRows;
    hasMore = newRows.length > 0;
    if (currentRows.length === 0) {
      $('#rankingBody').html(
        '<tr class="state-row"><td colspan="4">No rankings available.</td></tr>'
      );
      return;
    }
    $('#rankingBody').html(renderRows(currentRows, 0));
  } else {
    if (newRows.length === 0) return;
    var startIdx = currentRows.length;
    currentRows = currentRows.concat(newRows);
    $('#rankingBody').append(renderRows(newRows, startIdx));
  }
}

/* ── Detail panel ────────────────────────────────────── */
var PLACEHOLDER_IMG = 'https://app.tablesoccer.org/icon/profile.svg';

function resetDetailPanel() {
  $('#playerDetail').html(
    '<div class="pd-placeholder">' +
    '<i class="fa-regular fa-hand-pointer me-2"></i>Select a player to view details' +
    '</div>'
  );
}

function renderDetail(entry) {
  var rank         = entry.rank         != null ? entry.rank         : '-';
  var points       = entry.points       != null ? entry.points       : '-';
  var competitions = entry.competitions != null ? entry.competitions : '-';
  var members      = (entry.team && entry.team.length) ? entry.team : [];
  var isTop3       = typeof rank === 'number' && rank <= 3;

  /* ── Stats row ── */
  var statsHtml =
    '<div class="pd-stats">' +
      '<div class="pd-stat">' +
        '<span class="pd-stat-val' + (isTop3 ? ' is-top3' : '') + '">#' + escapeHtml(rank) + '</span>' +
        '<span class="pd-stat-lbl">Rank</span>' +
      '</div>' +
      '<div class="pd-stat">' +
        '<span class="pd-stat-val">' + escapeHtml(points) + '</span>' +
        '<span class="pd-stat-lbl">Points</span>' +
      '</div>' +
      '<div class="pd-stat">' +
        '<span class="pd-stat-val">' + escapeHtml(competitions) + '</span>' +
        '<span class="pd-stat-lbl">Competitions</span>' +
      '</div>' +
    '</div>';

  /* ── Member cards ── */
  var membersHtml = $.map(members, function (m) {
    /* Only allow http/https image URLs; fall back to the placeholder for anything else */
    var rawImg  = m.image && /^https?:\/\//i.test(m.image) ? m.image : PLACEHOLDER_IMG;
    var imgSrc  = escapeHtml(rawImg);
    var name    = m.player   || '-';
    var country = (m.country || '').toUpperCase().slice(0, 2);
    var flag    = countryFlag(country);
    var gender  = m.gender || '';
    var code    = m.code   || '';
    var mships  = m.memberships || [];

    var countryHtml = country
      ? '<div class="pd-country">' +
          (flag ? '<span class="country-flag">' + flag + '</span> ' : '') +
          '<span class="country-code">' + escapeHtml(country) + '</span>' +
        '</div>'
      : '';

    var metaHtml = '';
    if (gender) {
      metaHtml += '<div class="pd-meta"><span class="pd-meta-lbl">Gender</span>' +
        '<span class="pd-meta-val">' + escapeHtml(gender) + '</span></div>';
    }
    if (code) {
      metaHtml += '<div class="pd-meta"><span class="pd-meta-lbl">Code</span>' +
        '<span class="pd-meta-val">' + escapeHtml(code) + '</span></div>';
    }

    var badgesHtml = mships.length
      ? '<div class="pd-badges">' +
          $.map(mships, function (ms) {
            return '<span class="pd-badge">' + escapeHtml(ms) + '</span>';
          }).join('') +
        '</div>'
      : '';

    return '<div class="pd-member">' +
      '<img class="pd-avatar" src="' + imgSrc + '" alt="' + escapeHtml(name) + '">' +
      '<div class="pd-name">' + escapeHtml(name) + '</div>' +
      countryHtml +
      (metaHtml ? '<div class="pd-metas">' + metaHtml + '</div>' : '') +
      badgesHtml +
    '</div>';
  }).join('');

  $('#playerDetail').html('<div class="pd-inner">' + statsHtml + membersHtml + '</div>');
  /* Fallback for broken avatar images – attached after DOM insertion to avoid inline handlers */
  $('#playerDetail .pd-avatar').on('error', function () {
    $(this).off('error').attr('src', PLACEHOLDER_IMG);
  });
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

function showLoadingMore() {
  $('#rankingBody').append(
    '<tr class="state-row" id="loadingMoreRow"><td colspan="4">' +
    '<span class="spinner-border spinner-border-sm text-secondary me-2" role="status"></span>' +
    'Loading more…</td></tr>'
  );
}

function hideLoadingMore() {
  $('#loadingMoreRow').remove();
}

/* ── Load a category ─────────────────────────────────── */
function loadCategory(cat) {
  activeCategory = cat;
  currentRows    = [];
  currentPage    = 1;
  hasMore        = true;
  isLoadingMore  = false;
  updateUrl();
  resetDetailPanel();

  /* Update active tab highlight */
  $('#rankingTabs .ranking-tab').each(function () {
    var isActive = $(this).data('cat') === cat;
    $(this).toggleClass('active', isActive).attr('aria-selected', String(isActive));
  });

  showLoading();
  fetchRankings(cat, 1)
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
      .append($('<span>').addClass('tab-label').text(cat.label))
      .append($('<span>').addClass('tab-abbr').text(cat.id))
      .on('click', function () { loadCategory(cat.id); })
      .appendTo($tabs);
  });
}

/* ── Infinite scroll ─────────────────────────────────── */
function setupScrollObserver() {
  var wrapper = document.querySelector('.table-scroll-wrapper');
  if (!wrapper) return;

  wrapper.addEventListener('scroll', function () {
    if (isLoadingMore || !hasMore) return;
    var distanceFromBottom = wrapper.scrollHeight - wrapper.scrollTop - wrapper.clientHeight;
    if (distanceFromBottom > SCROLL_TRIGGER_THRESHOLD) return;

    isLoadingMore = true;
    currentPage++;
    showLoadingMore();
    fetchRankings(activeCategory, currentPage)
      .done(function (data) {
        hideLoadingMore();
        renderTable(data, true);
      })
      .fail(function () {
        currentPage--;
        hideLoadingMore();
      })
      .always(function () {
        isLoadingMore = false;
      });
  });
}

/* ── Initialise ──────────────────────────────────────── */
$(function () {
  var params = parseQuery();
  var initialCat = (params.cat && CATEGORIES.some(function (c) { return c.id === params.cat; })) ? params.cat : 'OS';

  buildTabs(initialCat);
  loadCategory(initialCat);
  setupScrollObserver();

  /* Row click → show detail panel */
  $('#rankingBody').on('click', '.ranking-row', function () {
    var idx   = parseInt($(this).data('idx'), 10);
    var entry = currentRows[idx];
    if (!entry) return;
    $('#rankingBody .ranking-row').removeClass('is-selected');
    $(this).addClass('is-selected');
    renderDetail(entry);
  });
});

