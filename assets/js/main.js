/* ── Config ──────────────────────────────────────────── */
var API_BASE   = 'https://api.swisstablesoccer.ch/tournaments';
var TOUR_ID    = 78;

/* ── State ───────────────────────────────────────────── */
var allTournaments    = [];
var visibleTournaments = [];
var suppressUrlUpdate = false;
var apiTourName       = null;   /* tour name returned by API; null = use fallback */
var dataLoaded        = false;  /* true once first successful fetch completes */
var shareTooltip      = null;
var calTooltip        = null;

/* ── Helpers ─────────────────────────────────────────── */

/**
 * Format a date range as "10 - 11 Jan" or "28 Mar - 1 Apr".
 */
function formatDateRange(start, end) {
  if (!start) return '-';
  var s = new Date(start + 'T00:00:00');
  var e = (end && end !== start) ? new Date(end + 'T00:00:00') : null;
  var optsDay  = { day: 'numeric' };
  var optsFull = { day: 'numeric', month: 'short' };
  if (!e) {
    return s.toLocaleDateString('en-GB', optsFull);
  }
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return s.toLocaleDateString('en-GB', optsDay) + ' - ' + e.toLocaleDateString('en-GB', optsFull);
  }
  return s.toLocaleDateString('en-GB', optsFull) + ' - ' + e.toLocaleDateString('en-GB', optsFull);
}

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
 * Returns true when a tournament's end date is before today.
 */
function isPast(t) {
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date((t.end_on || t.start_on) + 'T00:00:00') < today;
}

/**
 * Minimal HTML-escape (attribute-safe).
 */
function escapeHtml(str) {
  return $('<div>').text(str == null ? '' : String(str)).html();
}

/**
 * Return the abbreviated display label for a category name.
 */
function getCategoryAbbr(catName) {
  if (!catName) return catName;
  var n = catName.toUpperCase();
  /* STRT+ must be checked before plain STRT to avoid substring collision */
  if (n.indexOf('STRT+') !== -1 || n.indexOf('STRT +') !== -1 ||
      (n.indexOf('REGIO') !== -1 && n.indexOf('PRO') !== -1)) {
    return 'STRT+';
  }
  if (n.indexOf('STRT') !== -1 || n.indexOf('REGIO') !== -1) return 'STRT';
  if (n.indexOf('STS') !== -1 || n.indexOf('SERIES') !== -1) return 'STS';
  if (n.indexOf('STL') !== -1 || n.indexOf('LEAGUE') !== -1) return 'STL';
  if (n.indexOf('CUP') !== -1) return 'Cup';
  return catName;
}

/**
 * Return an <img> for the ITSF tier badge when the tournament name
 * contains "ITSF 250", "ITSF 500", or "ITSF 750", otherwise empty string.
 */
function getItsfBadge(name) {
  if (!name) return '';
  var n = name.toUpperCase();
  var tier = '';
  if (n.indexOf('ITSF 750') !== -1) tier = '750';
  else if (n.indexOf('ITSF 500') !== -1) tier = '500';
  else if (n.indexOf('ITSF 250') !== -1) tier = '250';
  if (!tier) return '';
  return '<img src="assets/img/itsf_' + tier + '.svg" class="itsf-badge" alt="ITSF ' + tier + '">';
}

/**
 * Return the background colour and font-size for a category badge.
 * Prominence order: STS > STRT+ > STRT > STL > Cup > (other)
 */
function getCategoryStyle(catName) {
  if (!catName) return { bg: '#666666' };
  var n = catName.toUpperCase();
  /* Check STRT+ / Regio Tour Pro BEFORE plain STRT to avoid substring collision */
  if (n.indexOf('STRT+') !== -1 || n.indexOf('STRT +') !== -1 ||
      (n.indexOf('REGIO') !== -1 && n.indexOf('PRO') !== -1)) {
    /* Swiss Tablesoccer Regio Tour Pro – darker red, 60% opacity */
    return { bg: 'rgba(168,0,15,0.6)' };
  }
  if (n.indexOf('STRT') !== -1 || n.indexOf('REGIO') !== -1) {
    /* Swiss Tablesoccer Regio Tour – grey */
    return { bg: '#7a7a7a' };
  }
  if (n.indexOf('STS') !== -1 || n.indexOf('SERIES') !== -1) {
    /* Swiss Tablesoccer Series – darker red */
    return { bg: '#a8000f' };
  }
  if (n.indexOf('STL') !== -1 || n.indexOf('LEAGUE') !== -1) {
    /* Swiss Tablesoccer League – red */
    return { bg: '#E30613' };
  }
  if (n.indexOf('CUP') !== -1) {
    /* Swiss Tablesoccer Cup – red */
    return { bg: '#E30613' };
  }
  return { bg: '#666666' };
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
  var cat    = $('#categorySelect').val();
  var table  = $('#playgroundSelect').val();
  var q      = $('#searchInput').val().trim();
  var hide   = $('#hidePast').is(':checked');
  if (cat)    p.set('cat', cat);
  if (table)  p.set('table', table);
  if (q)      p.set('search', q);
  if (!hide)  p.set('show_past', '1');
  var qs = p.toString();
  history.replaceState(null, '', qs ? ('?' + qs) : window.location.pathname);
}

/* ── Fetch ───────────────────────────────────────────── */
/**
 * Fetch tournament data for the given season.
 */
function fetchTournaments(seasonId) {
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

/* ── Render the table based on current filter state ───── */
function renderTable() {
  var hidePast  = $('#hidePast').is(':checked');
  var catFilter = $('#categorySelect').val();
  var pgFilter  = $('#playgroundSelect').val();
  var query     = $('#searchInput').val().trim().toLowerCase();

  updateUrl();

  var rows = $.grep(allTournaments, function (t) {
    if (hidePast && isPast(t)) return false;
    if (catFilter && String(t.category  && t.category.id)  !== catFilter) return false;
    if (pgFilter  && String(t.playground && t.playground.id) !== pgFilter) return false;
    if (query) {
      var hay = [t.name, t.locality, t.organization && t.organization.name]
        .join(' ').toLowerCase();
      if (hay.indexOf(query) === -1) return false;
    }
    return true;
  });
  visibleTournaments = rows;

  /* Stats */
  var total    = allTournaments.length;
  var upcoming = $.grep(allTournaments, function (t) { return !isPast(t); }).length;
  $('#statsText').text(
    tr('statsShowing', { shown: rows.length, total: total, upcoming: upcoming, past: total - upcoming })
  );

  if (rows.length === 0) {
    $('#tournamentBody').html(
      '<tr class="state-row"><td colspan="7">' + tr('noTournamentsMatch') + '</td></tr>'
    );
    return;
  }

  var html = $.map(rows, function (t) {
    var past = isPast(t);

    /* ── Category cell ── */
    var catLogo = t.category && t.category.logo;
    var catName = (t.category || {}).name || '-';
    var catStyle = getCategoryStyle(catName);
    var catCell = catLogo
      ? '<img src="' + escapeHtml(catLogo) + '" class="cat-logo" alt="' + escapeHtml(catName) + '">'
      : '<span class="cat-text" style="background:' + catStyle.bg + '">' +
          escapeHtml(getCategoryAbbr(catName)) + '</span>';

    /* ── Country cell ── */
    var code      = ((t.country || '').toUpperCase()).slice(0, 2);
    var flag      = countryFlag(code);
    var countryCell = flag
      ? '<span class="country-flag">' + flag + '</span><span class="country-code">' + escapeHtml(code) + '</span>'
      : '<span class="country-code">' + escapeHtml(t.locality || '-') + '</span>';

    /* ── Playground cell ── */
    var pgLogo = t.playground && t.playground.logo;
    var pgCell = pgLogo
      ? '<img src="' + escapeHtml(pgLogo) + '" class="pg-logo" alt="' + escapeHtml((t.playground || {}).name) + '">'
      : '<span class="pg-text">' + escapeHtml((t.playground || {}).name || '-') + '</span>';

    /* ── Action links ── */
    var actionLabel = (t.status === 'finished') ? tr('actionResults') : tr('actionRegister');
    var actionIcon  = (t.status === 'finished') ? 'fa-trophy' : 'fa-right-to-bracket';
    var siteLink = t.site
      ? '<a class="action-link" href="' + escapeHtml(t.site) + '" target="_blank" rel="noopener" aria-label="' + actionLabel + '">' +
        '<i class="fa-solid ' + actionIcon + ' action-icon-mobile" aria-hidden="true"></i>' +
        '<span class="action-text-desktop">' + actionLabel + '</span></a>'
      : '<span class="action-link is-disabled" aria-label="' + actionLabel + ' (unavailable)">' +
        '<i class="fa-solid ' + actionIcon + ' action-icon-mobile" aria-hidden="true"></i>' +
        '<span class="action-text-desktop">' + actionLabel + '</span></span>';

    var infoLink = t.info
      ? '<a class="action-link" href="' + escapeHtml(t.info) + '" target="_blank" rel="noopener" aria-label="' + tr('actionInfo') + '">' +
        '<i class="fa-solid fa-circle-info action-icon-mobile" aria-hidden="true"></i>' +
        '<span class="action-text-desktop">' + tr('actionInfo') + '</span></a>'
      : '<span class="action-link is-disabled" aria-label="' + tr('actionInfo') + ' (unavailable)">' +
        '<i class="fa-solid fa-circle-info action-icon-mobile" aria-hidden="true"></i>' +
        '<span class="action-text-desktop">' + tr('actionInfo') + '</span></span>';

    return '<tr class="' + (past ? 'is-past' : '') + '" data-cat="' + escapeHtml(getCategoryAbbr(catName)) + '">' +
      '<td class="col-cat">' + catCell + '</td>' +
      '<td class="col-itsf">' + getItsfBadge(t.name) + '</td>' +
      '<td><span class="t-name">' + escapeHtml(t.name || '-') + '</span></td>' +
      '<td class="col-country">' + countryCell + '</td>' +
      '<td class="t-date">' +
        '<span class="date-link" data-id="' + escapeHtml(String(t.id)) + '" ' +
              'role="button" title="Add to calendar" tabindex="0">' +
          formatDateRange(t.start_on, t.end_on) +
        '</span>' +
      '</td>' +
      '<td class="col-pg">' + pgCell + '</td>' +
      '<td class="text-end col-actions">' + siteLink + infoLink + '</td>' +
      '</tr>';
  }).join('');

  $('#tournamentBody').html(html);
}

/* ── State helpers ───────────────────────────────────── */
function showLoading() {
  $('#tournamentBody').html(
    '<tr class="state-row"><td colspan="7">' +
    '<span class="spinner-border spinner-border-sm text-secondary me-2" role="status"></span>' +
    tr('loadingTournaments') + '</td></tr>'
  );
  $('#statsText').text('');
}

function showError(msg) {
  $('#tournamentBody').html(
    '<tr class="state-row is-error"><td colspan="7">' +
    '<i class="fa-solid fa-triangle-exclamation me-2"></i>' + escapeHtml(msg) + '</td></tr>'
  );
}

/* ── Calendar / ICS export ───────────────────────────── */

/**
 * Pad a number to two digits.
 */
function padTwo(n) {
  return n < 10 ? '0' + n : String(n);
}

/**
 * Convert "YYYY-MM-DD" to "YYYYMMDD" for iCalendar DATE values.
 */
function toIcsDate(dateStr) {
  return dateStr.replace(/-/g, '');
}

/**
 * Return the day after dateStr as "YYYYMMDD".
 * iCalendar DTEND for all-day events is exclusive (the day after the last day).
 * Date components are parsed explicitly to avoid timezone-dependent behavior.
 */
function toIcsDateExclusive(dateStr) {
  var parts = dateStr.split('-');
  /* new Date(y, m, d) uses local time; passing d+1 lets Date handle roll-over */
  var next = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10) + 1);
  return String(next.getFullYear()) + padTwo(next.getMonth() + 1) + padTwo(next.getDate());
}

/**
 * Escape special characters for iCalendar text fields (RFC 5545 §3.3.11).
 */
function escapeIcs(str) {
  return String(str == null ? '' : str)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Build an iCalendar (RFC 5545) string from an array of tournament objects.
 */
function generateIcs(tournaments) {
  var lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Swiss Tablesoccer Federation//Tournament Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:STF Tournament Calendar'
  ];

  /* DTSTAMP is required by RFC 5545 §3.6.1 for every VEVENT */
  var now     = new Date();
  var dtstamp = now.getUTCFullYear() +
    String(now.getUTCMonth() + 1).padStart(2, '0') +
    String(now.getUTCDate()).padStart(2, '0') +
    'T' +
    String(now.getUTCHours()).padStart(2, '0') +
    String(now.getUTCMinutes()).padStart(2, '0') +
    String(now.getUTCSeconds()).padStart(2, '0') +
    'Z';

  $.each(tournaments, function (_, t) {
    var start = t.start_on || '';
    var end   = t.end_on   || start;
    if (!start) return;

    var eventLocation = [t.locality, t.country].filter(Boolean).join(', ');
    var url           = t.site || t.info || '';

    lines.push('BEGIN:VEVENT');
    lines.push('UID:stf-tournament-' + t.id + '@swisstablesoccer.ch');
    lines.push('DTSTAMP:' + dtstamp);
    lines.push('DTSTART;VALUE=DATE:' + toIcsDate(start));
    lines.push('DTEND;VALUE=DATE:'   + toIcsDateExclusive(end));
    lines.push('SUMMARY:'            + escapeIcs(t.name || ''));
    if (eventLocation) lines.push('LOCATION:' + escapeIcs(eventLocation));
    if (url)           lines.push('URL:'       + escapeIcs(url));
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  /* RFC 5545 requires CRLF line endings */
  return lines.join('\r\n');
}

/**
 * Trigger a download of the given ICS text as "stf-tournaments.ics".
 */
function downloadIcs(content) {
  var blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  var url  = URL.createObjectURL(blob);
  var a    = document.createElement('a');
  a.href     = url;
  a.download = 'stf-tournaments.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
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
  shareTooltip = new bootstrap.Tooltip($btn[0], { trigger: 'manual' });
  $btn.on('click', function () { copyCurrentUrl($btn, shareTooltip); });

  var $calBtn = $('#calendarBtn');
  calTooltip = new bootstrap.Tooltip($calBtn[0]);
  $calBtn.on('click', function () { downloadIcs(generateIcs(visibleTournaments)); });

  $('#tournamentBody').on('click keydown', '.date-link', function (e) {
    if (e.type === 'keydown') {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
    }
    var id = String($(this).data('id'));
    var t  = $.grep(allTournaments, function (x) { return String(x.id) === id; })[0];
    if (t) downloadIcs(generateIcs([t]));
  });

  /* Expand filters by default on non-mobile viewports */
  if (window.innerWidth >= 576) {
    $('#filterCollapse').addClass('show');
    $('#filterToggle').attr('aria-expanded', 'true');
  }
});

/* ── Event listeners ─────────────────────────────────── */
$('#categorySelect, #playgroundSelect').on('change', renderTable);
$('#hidePast').on('change', renderTable);
$('#searchInput').on('input', renderTable);

/* ── Initialise ──────────────────────────────────────── */
$(function () {
  var params = parseQuery();

  /* Apply URL params before first render */
  suppressUrlUpdate = true;
  if (params.show_past === '1') $('#hidePast').prop('checked', false);
  if (params.search)            $('#searchInput').val(params.search);
  suppressUrlUpdate = false;

  showLoading();
  fetchTournaments(null)
    .done(function (data) {
      apiTourName = data.tour_name || null;
      $('#tourTitle').text(apiTourName || tr('pageTitle_tournaments'));
      allTournaments = data.tournaments || [];
      dataLoaded = true;

      populateSelect($('#categorySelect'),   data.categories  || [], tr('all'), params.cat);
      populateSelect($('#playgroundSelect'), data.playgrounds || [], tr('all'), params.table);

      renderTable();
    })
    .fail(function (xhr) {
      apiTourName = null;
      $('#tourTitle').text(tr('pageTitle_tournaments'));
      showError(tr('failedToLoadData', { status: xhr.status || '?' }));
    });
});

/* ── Language change handler ─────────────────────────── */
document.addEventListener('langChanged', function () {
  /* Update page title if the API didn't supply one */
  if (!apiTourName) {
    $('#tourTitle').text(tr('pageTitle_tournaments'));
  }

  /* Update filter placeholder options */
  $('#categorySelect option[value=""]').text(tr('all'));
  $('#playgroundSelect option[value=""]').text(tr('all'));

  /* Update Bootstrap tooltip content */
  if (calTooltip)   calTooltip.setContent({ '.tooltip-inner': tr('calendarTooltip') });
  if (shareTooltip) shareTooltip.setContent({ '.tooltip-inner': tr('linkCopied') });

  /* Re-render table rows so action labels and status messages update */
  if (dataLoaded) {
    renderTable();
  }
});
