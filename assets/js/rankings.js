/* ── Config ──────────────────────────────────────────── */
var API_BASE = 'https://api.swisstablesoccer.ch/rankings';

/* Pixels from the bottom of the scroll container that trigger loading the next page */
var SCROLL_TRIGGER_THRESHOLD = 200;

/* Category IDs – labels are looked up via tr('cat_<id>') at render time */
var CATEGORIES = ['OS', 'OD', 'OC', 'WS', 'WD', 'MX', 'JS', 'JD', 'SS', 'SD'];

/* ── State ───────────────────────────────────────────── */
var activeCategory = 'OS';
var currentRows    = [];
var currentPage    = 1;
var hasMore        = true;
var isLoadingMore  = false;
var rankingsState  = 'init'; /* 'init' | 'loading' | 'loaded' | 'empty' | 'error' */

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
      showNoRankings();
      return;
    }
    rankingsState = 'loaded';
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
    '<i class="fa-regular fa-hand-pointer me-2"></i>' + tr('selectPlayer') +
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
        '<span class="pd-stat-lbl">' + tr('rankLabel') + '</span>' +
      '</div>' +
      '<div class="pd-stat">' +
        '<span class="pd-stat-val">' + escapeHtml(points) + '</span>' +
        '<span class="pd-stat-lbl">' + tr('pointsLabel') + '</span>' +
      '</div>' +
      '<div class="pd-stat">' +
        '<span class="pd-stat-val">' + escapeHtml(competitions) + '</span>' +
        '<span class="pd-stat-lbl">' + tr('competitionsLabel') + '</span>' +
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
      metaHtml += '<div class="pd-meta"><span class="pd-meta-lbl">' + tr('genderLabel') + '</span>' +
        '<span class="pd-meta-val">' + escapeHtml(gender) + '</span></div>';
    }
    if (code) {
      metaHtml += '<div class="pd-meta"><span class="pd-meta-lbl">' + tr('codeLabel') + '</span>' +
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
function showNoRankings() {
  rankingsState = 'empty';
  $('#rankingBody').html(
    '<tr class="state-row"><td colspan="4">' + tr('noRankingsAvailable') + '</td></tr>'
  );
}

function showLoading() {
  rankingsState = 'loading';
  $('#rankingBody').html(
    '<tr class="state-row"><td colspan="4">' +
    '<span class="spinner-border spinner-border-sm text-secondary me-2" role="status"></span>' +
    tr('loading') + '</td></tr>'
  );
}

function showError(msg) {
  rankingsState = 'error';
  $('#rankingBody').html(
    '<tr class="state-row is-error"><td colspan="4">' +
    '<i class="fa-solid fa-triangle-exclamation me-2"></i>' + escapeHtml(msg) + '</td></tr>'
  );
}

function showLoadingMore() {
  $('#rankingBody').append(
    '<tr class="state-row" id="loadingMoreRow"><td colspan="4">' +
    '<span class="spinner-border spinner-border-sm text-secondary me-2" role="status"></span>' +
    tr('loadingMore') + '</td></tr>'
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
      showError(tr('failedToLoadRankings', { status: xhr.status || '?' }));
    });
}

/* ── Build tab bar ───────────────────────────────────── */
function buildTabs(initialCat) {
  var $tabs = $('#rankingTabs');
  $tabs.empty();
  $.each(CATEGORIES, function (_, catId) {
    var isActive = catId === initialCat;
    $('<button>')
      .addClass('ranking-tab' + (isActive ? ' active' : ''))
      .attr({ 'data-cat': catId, 'role': 'tab', 'aria-selected': String(isActive) })
      .append($('<span>').addClass('tab-label').text(tr('cat_' + catId)))
      .append($('<span>').addClass('tab-abbr').text(catId))
      .on('click', function () { loadCategory(catId); })
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
  var initialCat = (params.cat && CATEGORIES.indexOf(params.cat) !== -1) ? params.cat : 'OS';

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

/* ── Language change handler ─────────────────────────── */
document.addEventListener('langChanged', function () {
  /* Rebuild tabs with translated labels */
  buildTabs(activeCategory);

  /* Update the detail panel */
  if ($('#playerDetail .pd-placeholder').length) {
    resetDetailPanel();
  } else {
    var $sel = $('#rankingBody .ranking-row.is-selected');
    if ($sel.length) {
      var idx = parseInt($sel.data('idx'), 10);
      if (!isNaN(idx) && currentRows[idx]) {
        renderDetail(currentRows[idx]);
      }
    }
  }

  /* Re-render persistent state messages */
  if (rankingsState === 'empty') {
    showNoRankings();
  }
});

