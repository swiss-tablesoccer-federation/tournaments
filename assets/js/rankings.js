/* ── Config ──────────────────────────────────────────── */
var API_BASE = 'https://api.swisstablesoccer.ch/rankings';
var TOUR_ID  = 78;

/* ── State ───────────────────────────────────────────── */
var allRankings = [];
var suppressUrlUpdate = false;

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

/* ── URL param helpers ───────────────────────────────── */

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
 * Push current filter state into the URL (no page reload).
 */
function updateUrl() {
  if (suppressUrlUpdate) return;
  var p = new URLSearchParams();
  var season = $('#seasonSelect').val();
  var cat    = $('#categorySelect').val();
  if (season) p.set('season', season);
  if (cat)    p.set('cat', cat);
  var qs = p.toString();
  history.replaceState(null, '', qs ? ('?' + qs) : window.location.pathname);
}

/* ── Fetch ───────────────────────────────────────────── */
/**
 * Fetch ranking data for the given season.
 */
function fetchRankings(seasonId) {
  var url = API_BASE + '?tour=' + TOUR_ID + (seasonId ? '&season=' + seasonId : '');
  return $.getJSON(url);
}

/* ── Populate a <select> with {id, name} items ───────── */
function populateSelect($sel, items, placeholder, preselect) {
  $sel.empty().append($('<option>').val('').text(placeholder));
  $.each(items, function (_, item) {
    $sel.append($('<option>').val(item.id).text(item.name));
  });
  if (preselect != null) $sel.val(preselect);
}

/* ── Load a season (re-fetches when season changes) ───── */
function loadSeason(seasonId, preselectCat) {
  showLoading();
  fetchRankings(seasonId)
    .done(function (data) {
      allRankings = data.rankings || [];
      populateSelect($('#categorySelect'), data.categories || [], 'All', preselectCat);
      renderTable();
    })
    .fail(function (xhr) {
      showError('Failed to load rankings (HTTP ' + (xhr.status || '?') + ').');
    });
}

/* ── Render the table based on current filter state ───── */
function renderTable() {
  var catFilter = $('#categorySelect').val();

  updateUrl();

  var rows = $.grep(allRankings, function (r) {
    if (catFilter && String(r.category && r.category.id) !== catFilter) return false;
    return true;
  });

  /* Stats */
  $('#statsText').text('Showing ' + rows.length + ' of ' + allRankings.length);

  if (rows.length === 0) {
    $('#rankingBody').html(
      '<tr class="state-row"><td colspan="4">No rankings match your filters.</td></tr>'
    );
    return;
  }

  var html = $.map(rows, function (r) {
    var rank   = r.rank != null ? r.rank : '-';
    var isTop3 = typeof rank === 'number' && rank <= 3;

    /* ── Player cell ── */
    var playerName = (r.player && r.player.name) || (r.name) || '-';

    /* ── Country cell ── */
    var rawCountry  = (r.player && r.player.country) || r.country || '';
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
      '<td class="col-points"><span class="r-points">' + escapeHtml(points) + '</span></td>' +
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
  $('#statsText').text('');
}

function showError(msg) {
  $('#rankingBody').html(
    '<tr class="state-row is-error"><td colspan="4">' +
    '<i class="fa-solid fa-triangle-exclamation me-2"></i>' + escapeHtml(msg) + '</td></tr>'
  );
}

/* ── Share button ────────────────────────────────────── */
function copyCurrentUrl($btn, tooltip) {
  navigator.clipboard.writeText(window.location.href).then(function () {
    tooltip.show();
    setTimeout(function () { tooltip.hide(); }, 2000);
  }).catch(function () {
    /* Fallback for browsers without Clipboard API */
    try {
      var ta = document.createElement('textarea');
      ta.value = window.location.href;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy'); /* deprecated but widely supported as fallback */
      document.body.removeChild(ta);
      tooltip.show();
      setTimeout(function () { tooltip.hide(); }, 2000);
    } catch (err) {
      /* Both methods failed – silently ignore */
    }
  });
}

$(function () {
  var $btn = $('#shareBtn');
  var tooltip = new bootstrap.Tooltip($btn[0], { trigger: 'manual' });
  $btn.on('click', function () { copyCurrentUrl($btn, tooltip); });

  /* Expand filters by default on non-mobile viewports */
  if (window.innerWidth >= 576) {
    $('#filterCollapse').addClass('show');
    $('#filterToggle').attr('aria-expanded', 'true');
  }
});

/* ── Event listeners ─────────────────────────────────── */
$('#seasonSelect').on('change', function () { loadSeason($(this).val()); });
$('#categorySelect').on('change', renderTable);

/* ── Initialise ──────────────────────────────────────── */
$(function () {
  var params = parseQuery();

  showLoading();
  fetchRankings(params.season || null)
    .done(function (data) {
      allRankings = data.rankings || [];

      /* Season selector – honour URL param */
      suppressUrlUpdate = true;
      $.each(data.seasons || [], function (_, s) {
        var $opt = $('<option>').val(s.id).text(s.name);
        var isSelected = params.season
          ? String(s.id) === String(params.season)
          : s.id === data.season;
        if (isSelected) {
          $opt.prop('selected', true);
        }
        $('#seasonSelect').append($opt);
      });
      suppressUrlUpdate = false;

      populateSelect($('#categorySelect'), data.categories || [], 'All', params.cat);

      renderTable();
    })
    .fail(function (xhr) {
      showError('Failed to load data (HTTP ' + (xhr.status || '?') + ').');
    });
});
