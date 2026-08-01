var HOME_NEWS_PAGE_SIZE = 15;
var HOME_ALL_POSTS = [];
var HOME_FILTERED_POSTS = [];
var HOME_STATE = { page: 1, year: 'all' };
var HOME_YEAR_BASE = null;

function getNewsLanguage() {
  var raw = '';
  try {
    raw = String(localStorage.getItem('stf_lang') || '').toLowerCase();
  } catch (e) {}
  return /^(de|fr|it|en)$/.test(raw) ? raw : 'de';
}

function getNewsBasePath() {
  return '/news/' + getNewsLanguage();
}

function syncHomeTitle() {
  var suffix = (typeof tr === 'function') ? tr('pageTitle_news') : 'News';
  document.title = 'Swiss Tablesoccer Federation - ' + suffix;
}

function parseStateFromUrl() {
  var search = new URLSearchParams(window.location.search);
  var pageRaw = parseInt(search.get('page') || '1', 10);
  var offsetRaw = parseInt(search.get('offset') || '0', 10);
  var yearRaw = String(search.get('year') || 'all').trim();

  var page = Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1;
  if (search.has('offset') && !search.has('page') && Number.isFinite(offsetRaw) && offsetRaw >= 0) {
    page = Math.floor(offsetRaw / HOME_NEWS_PAGE_SIZE) + 1;
  }

  var year = /^(all|current|minus1|older)$/.test(yearRaw) ? yearRaw : 'all';
  return { page: page, year: year };
}

function buildStateUrl(state) {
  var params = new URLSearchParams();
  if (state.year && state.year !== 'all') params.set('year', state.year);
  if (state.page && state.page > 1) params.set('page', String(state.page));
  var query = params.toString();
  return query ? '/?' + query : '/';
}

function updateUrlFromState() {
  try {
    history.replaceState(null, '', buildStateUrl(HOME_STATE));
  } catch (e) {}
}

function getPostDateWithYear(post) {
  var rawDate = String((post && post.date) || '').trim();
  var file = String((post && post.file) || '');
  var match = file.match(/^(\d{4})-(\d{2})-(\d{2})-/);

  if (!match) return rawDate;

  var year = match[1];
  if (!rawDate) return match[1] + '-' + match[2] + '-' + match[3];
  if (/\b\d{4}\b/.test(rawDate)) return rawDate;
  return rawDate + ' ' + year;
}

function getPostYear(post) {
  var file = String((post && post.file) || '');
  var m = file.match(/^(\d{4})-(\d{2})-(\d{2})-/);
  if (m) return m[1];

  var rawDate = String((post && post.date) || '');
  var y = rawDate.match(/\b(19|20)\d{2}\b/);
  return y ? y[0] : '';
}

function getYearBase(posts) {
  var years = posts
    .map(getPostYear)
    .filter(function (y) { return /^\d{4}$/.test(y); })
    .map(function (y) { return Number(y); });

  if (!years.length) return new Date().getFullYear();
  return Math.max.apply(null, years);
}

function getExcerptFromMarkdown(text) {
  var lines = String(text || '').split('\n');
  var useful = [];
  var i;

  for (i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line) continue;
    if (line.indexOf('# ') === 0) continue;
    if (/^\*[^*]+\*$/.test(line)) continue;
    if (line.indexOf('![') === 0) continue;
    if (line.indexOf('- ') === 0) continue;
    useful.push(line);
    if (useful.join(' ').length > 280) break;
  }

  return buildExcerptWithSafeLinks(useful.join(' '), 280);
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeMarkdownLinks(text) {
  return String(text || '')
    .replace(/\]\s+\(([^)]+)\)/g, ']($1)')
    .replace(/\[(https?:\/\/[^\]]+)\]\((https?:\/\/[^)]+)\)/gi, function (_, labelUrl, hrefUrl) {
      return '[' + labelUrl.trim() + '](' + hrefUrl.trim() + ')';
    });
}

function buildExcerptWithSafeLinks(text, maxLen) {
  var source = normalizeMarkdownLinks(String(text || ''));
  var regex = /\[([^\]]+)\]\(([^)\s]+)\)/g;
  var tokens = [];
  var lastIndex = 0;
  var match;
  var out = '';
  var visibleLen = 0;
  var limit = typeof maxLen === 'number' && maxLen > 0 ? maxLen : 280;
  var i;

  while ((match = regex.exec(source)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', text: source.slice(lastIndex, match.index) });
    }
    tokens.push({
      type: 'link',
      raw: match[0],
      label: match[1] || ''
    });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < source.length) {
    tokens.push({ type: 'text', text: source.slice(lastIndex) });
  }

  for (i = 0; i < tokens.length; i++) {
    var token = tokens[i];
    if (visibleLen >= limit) break;

    if (token.type === 'text') {
      var remaining = limit - visibleLen;
      if (token.text.length <= remaining) {
        out += token.text;
        visibleLen += token.text.length;
      } else {
        out += token.text.slice(0, Math.max(0, remaining)).trimEnd();
        visibleLen = limit;
        break;
      }
    } else {
      var label = String(token.label || '');
      if (visibleLen + label.length <= limit) {
        out += token.raw;
        visibleLen += label.length;
      } else {
        break;
      }
    }
  }

  out = out.trim();
  if (out.length < source.trim().length) {
    out += '...';
  }
  return out;
}

function getReadableLinkLabel(rawLabel, rawHref) {
  var label = String(rawLabel || '').trim();
  var href = String(rawHref || '').trim();
  var normalizedLabel = label.toLowerCase();
  var normalizedHref = href.toLowerCase();

  if (!label) return href || '';

  var looksLikeUrl = /^(https?:\/\/|www\.)/i.test(label) ||
    normalizedLabel === normalizedHref ||
    normalizedLabel === normalizedHref.replace(/^https?:\/\//, '');

  if (!looksLikeUrl) return label;

  if (/^mailto:/i.test(href)) {
    return href.replace(/^mailto:/i, '');
  }

  try {
    var parsed = /^https?:\/\//i.test(href) ? new URL(href) : null;
    if (parsed) {
      var host = parsed.hostname.replace(/^www\./i, '');
      var path = parsed.pathname === '/' ? '' : parsed.pathname;
      var pretty = host + path;
      if (pretty.length > 46) pretty = pretty.slice(0, 43) + '...';
      return pretty;
    }
  } catch (e) {}

  if (href.indexOf('/') === 0) {
    var shortPath = href;
    if (shortPath.length > 46) shortPath = shortPath.slice(0, 43) + '...';
    return shortPath;
  }

  return 'Link';
}

function renderExcerptHtml(text) {
  var source = normalizeMarkdownLinks(String(text || ''));

  function getLinkAttributes(rawHref) {
    var href = String(rawHref || '').trim();
    if (!href) return 'href="#"';

    if (/^(mailto:|tel:)/i.test(href) || href.indexOf('#') === 0 || href.indexOf('/') === 0 || href.indexOf('./') === 0 || href.indexOf('../') === 0 || href.indexOf('?') === 0) {
      return 'href="' + escapeHtml(href) + '"';
    }

    if (/^https?:\/\//i.test(href)) {
      try {
        var parsed = new URL(href, window.location.origin);
        if (parsed.origin !== window.location.origin) {
          return 'href="' + escapeHtml(href) + '" target="_blank" rel="noopener"';
        }
      } catch (e) {
        return 'href="' + escapeHtml(href) + '" target="_blank" rel="noopener"';
      }
      return 'href="' + escapeHtml(href) + '"';
    }

    return 'href="' + escapeHtml(href) + '"';
  }

  if (window.marked && typeof window.marked.parseInline === 'function' && typeof window.marked.Renderer === 'function') {
    var renderer = new window.marked.Renderer();
    renderer.link = function () {
      var href = '';
      var labelText = '';
      var token = arguments[0];

      if (token && typeof token === 'object') {
        href = token.href || '';
        labelText = token.text || '';
        if (!labelText && token.tokens && this.parser && typeof this.parser.parseInline === 'function') {
          labelText = this.parser.parseInline(token.tokens);
        }
      } else {
        href = arguments[0] || '';
        labelText = arguments[2] || '';
      }

      labelText = String(labelText || '').replace(/<[^>]+>/g, '').trim();
      var label = getReadableLinkLabel(labelText, href);
      return '<a ' + getLinkAttributes(href) + '>' + escapeHtml(label) + '</a>';
    };
    return window.marked.parseInline(source, { renderer: renderer });
  }

  return escapeHtml(source);
}

function renderNewsPreview(posts) {
  var cardsHtml = posts.map(function (post) {
    var meta = [getPostDateWithYear(post), post.author].filter(Boolean).join(' | ');
    var postUrl = '/news/?post=' + encodeURIComponent(post.file);
    var title = post.title || post.file;

    return (
      '<article class="home-feed-card">' +
        '<div class="home-feed-meta">' + escapeHtml(meta) + '</div>' +
        '<h2 class="home-feed-title"><a href="' + postUrl + '">' + escapeHtml(title) + '</a></h2>' +
        '<p class="home-feed-excerpt">' + renderExcerptHtml(post.excerpt || '') + '</p>' +
      '</article>'
    );
  }).join('');

  $('#homeNewsList').html(cardsHtml);
}

function getVisiblePages(current, total) {
  var pages = [];
  var i;

  if (total <= 7) {
    for (i = 1; i <= total; i++) pages.push(i);
    return pages;
  }

  pages.push(1);
  if (current > 4) pages.push('...');

  var start = Math.max(2, current - 1);
  var end = Math.min(total - 1, current + 1);
  for (i = start; i <= end; i++) pages.push(i);

  if (current < total - 3) pages.push('...');
  pages.push(total);
  return pages;
}

function renderPagination(totalPages, currentPage) {
  var $pager = $('#homeNewsPager');

  if (totalPages <= 1) {
    $pager.empty();
    return;
  }

  var prevDisabled = currentPage <= 1;
  var nextDisabled = currentPage >= totalPages;
  var parts = [];

  parts.push(
    '<button type="button" class="home-feed-page-btn is-nav" data-page="1"' +
    (prevDisabled ? ' disabled' : '') +
    ' aria-label="' + escapeHtml(tr('newsFirst')) + '"><i class="fa-solid fa-angles-left"></i></button>'
  );

  parts.push(
    '<button type="button" class="home-feed-page-btn is-nav" data-page="' + String(currentPage - 1) + '"' +
    (prevDisabled ? ' disabled' : '') +
    ' aria-label="' + escapeHtml(tr('newsPrev')) + '"><i class="fa-solid fa-chevron-left"></i></button>'
  );

  getVisiblePages(currentPage, totalPages).forEach(function (item) {
    if (item === '...') {
      parts.push('<span class="home-feed-page-ellipsis" aria-hidden="true">...</span>');
      return;
    }
    var isActive = item === currentPage;
    parts.push(
      '<button type="button" class="home-feed-page-btn' + (isActive ? ' is-active' : '') +
      '" data-page="' + String(item) + '"' + (isActive ? ' aria-current="page"' : '') + '>' +
      String(item) + '</button>'
    );
  });

  parts.push(
    '<button type="button" class="home-feed-page-btn is-nav" data-page="' + String(currentPage + 1) + '"' +
    (nextDisabled ? ' disabled' : '') +
    ' aria-label="' + escapeHtml(tr('newsNext')) + '"><i class="fa-solid fa-chevron-right"></i></button>'
  );

  parts.push(
    '<button type="button" class="home-feed-page-btn is-nav" data-page="' + String(totalPages) + '"' +
    (nextDisabled ? ' disabled' : '') +
    ' aria-label="' + escapeHtml(tr('newsLast')) + '"><i class="fa-solid fa-angles-right"></i></button>'
  );

  $pager.html(parts.join(''));
}

function renderYearFilterButtons(posts) {
  HOME_YEAR_BASE = getYearBase(posts);
  var currentYearLabel = String(HOME_YEAR_BASE);
  var previousYearLabel = String(HOME_YEAR_BASE - 1);

  var labels = [
    { key: 'current', text: currentYearLabel },
    { key: 'minus1', text: previousYearLabel },
    { key: 'older', text: tr('newsYearOlder') }
  ];

  var html = labels.map(function (item) {
    var active = HOME_STATE.year === item.key ? ' is-active' : '';
    return '<button type="button" class="home-feed-year-btn' + active + '" data-year-mode="' + item.key + '">' + escapeHtml(item.text) + '</button>';
  }).join('');

  $('#homeYearFilterButtons').html(html);
}

function filterPostsByState(posts) {
  if (HOME_STATE.year === 'all') return posts.slice();
  var base = HOME_YEAR_BASE || getYearBase(posts);
  return posts.filter(function (post) {
    var year = Number(getPostYear(post));
    if (!Number.isFinite(year)) return HOME_STATE.year === 'older';
    if (HOME_STATE.year === 'current') return year === base;
    if (HOME_STATE.year === 'minus1') return year === (base - 1);
    if (HOME_STATE.year === 'older') return year <= (base - 2);
    return true;
  });
}

function enrichPreviewPost(post) {
  if (post._excerpt) return Promise.resolve(post);

  return fetch(getNewsBasePath() + '/' + post.file)
    .then(function (res) { return res.ok ? res.text() : ''; })
    .then(function (text) {
      post._excerpt = getExcerptFromMarkdown(text);
      return post;
    })
    .catch(function () {
      post._excerpt = '';
      return post;
    });
}

function renderFilteredNews() {
  HOME_FILTERED_POSTS = filterPostsByState(HOME_ALL_POSTS);

  var totalPages = Math.max(1, Math.ceil(HOME_FILTERED_POSTS.length / HOME_NEWS_PAGE_SIZE));
  if (HOME_STATE.page > totalPages) HOME_STATE.page = totalPages;
  if (HOME_STATE.page < 1) HOME_STATE.page = 1;

  updateUrlFromState();
  renderPagination(totalPages, HOME_STATE.page);

  if (!HOME_FILTERED_POSTS.length) {
    $('#homeNewsList').html('<div class="state-row is-empty">' + escapeHtml(tr('newsNoResults')) + '</div>');
    return;
  }

  var start = (HOME_STATE.page - 1) * HOME_NEWS_PAGE_SIZE;
  var slice = HOME_FILTERED_POSTS.slice(start, start + HOME_NEWS_PAGE_SIZE);
  $('#homeNewsList').html('<div class="state-row">' + escapeHtml(tr('loading')) + '</div>');

  Promise.all(slice.map(enrichPreviewPost))
    .then(function (enriched) {
      enriched.forEach(function (p) { p.excerpt = p._excerpt || ''; });
      renderNewsPreview(enriched);
      renderPagination(totalPages, HOME_STATE.page);
    })
    .catch(function () {
      $('#homeNewsList').html('<div class="state-row is-error">' + escapeHtml(tr('newsFailedLoad')) + '</div>');
      $('#homeNewsPager').empty();
    });
}

function bindHomeEvents() {
  $('#homeYearFilterButtons').off('click').on('click', '.home-feed-year-btn[data-year-mode]', function () {
    var mode = String($(this).attr('data-year-mode') || 'all');
    if (!/^(current|minus1|older)$/.test(mode)) mode = 'all';
    HOME_STATE.year = HOME_STATE.year === mode ? 'all' : mode;
    HOME_STATE.page = 1;
    $('.home-feed-year-btn').removeClass('is-active');
    if (HOME_STATE.year === mode) {
      $(this).addClass('is-active');
    }
    renderFilteredNews();
  });

  $('#homeNewsPager').off('click').on('click', '.home-feed-page-btn[data-page]', function () {
    var page = parseInt($(this).attr('data-page') || '1', 10);
    if (!Number.isFinite(page) || page < 1 || $(this).is(':disabled')) return;
    HOME_STATE.page = page;
    renderFilteredNews();
  });
}

function loadHomeNews() {
  HOME_STATE = parseStateFromUrl();
  $('#homeNewsList').html('<div class="state-row">' + escapeHtml(tr('loading')) + '</div>');

  fetch(getNewsBasePath() + '/_manifest.json')
    .then(function (res) {
      if (!res.ok) throw new Error('manifest missing');
      return res.json();
    })
    .then(function (manifest) {
      var posts = Array.isArray(manifest.posts) ? manifest.posts : [];
      HOME_ALL_POSTS = posts.slice();
      renderYearFilterButtons(HOME_ALL_POSTS);
      bindHomeEvents();
      renderFilteredNews();
    })
    .catch(function () {
      $('#homeNewsList').html('<div class="state-row is-error">' + escapeHtml(tr('newsFailedLoad')) + '</div>');
      $('#homeNewsPager').empty();
    });
}

$(function () {
  syncHomeTitle();
  loadHomeNews();

  document.addEventListener('langChanged', function () {
    syncHomeTitle();
    HOME_ALL_POSTS = [];
    HOME_FILTERED_POSTS = [];
    HOME_YEAR_BASE = null;
    loadHomeNews();
  });
});
