var NEWS_POSTS = [];
var NEWS_FILTERED = [];
var NEWS_SELECTED_FILE = null;

function getNewsLanguage() {
  var raw = '';
  try {
    raw = String(localStorage.getItem('stf_lang') || '').toLowerCase();
  } catch (e) {}
  return /^(de|fr|it|en)$/.test(raw) ? raw : 'de';
}

function getNewsBasePath() {
  return './' + getNewsLanguage();
}

function getRequestedPostFromUrl() {
  try {
    var search = new URLSearchParams(window.location.search);
    return search.get('post') || '';
  } catch (e) {
    return '';
  }
}

function syncNewsTitle() {
  var suffix = (typeof tr === 'function') ? tr('pageTitle_news') : 'News';
  document.title = 'Swiss Tablesoccer Federation - ' + suffix;
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '');
}

function getPostDateWithYear(post) {
  var rawDate = String((post && post.date) || '').trim();
  var file = String((post && post.file) || '');
  var match = file.match(/^(\d{4})-(\d{2})-(\d{2})-/);

  if (!match) return rawDate;

  var year = match[1];
  var isoDate = match[1] + '-' + match[2] + '-' + match[3];

  if (!rawDate) return isoDate;
  if (/\b\d{4}\b/.test(rawDate)) return rawDate;

  return rawDate + ' ' + year;
}

function getPostMetaText(post) {
  return [getPostDateWithYear(post), post.author].filter(Boolean).join(' | ');
}

function updateNewsCount() {
  $('#newsCount').text(tr('newsCount', { count: NEWS_FILTERED.length }));
}

function setStatus(kind, text) {
  var $status = $('#newsStatus');
  $status.removeClass('is-loading is-error is-empty').addClass(kind || 'is-empty');
  $status.text(text || '');
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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
      if (pretty.length > 56) pretty = pretty.slice(0, 53) + '...';
      return pretty;
    }
  } catch (e) {}

  if (href.indexOf('/') === 0) {
    var shortPath = href;
    if (shortPath.length > 56) shortPath = shortPath.slice(0, 53) + '...';
    return shortPath;
  }

  return 'Link';
}

function buildLinkAttributes(rawHref) {
  var href = String(rawHref || '').trim();
  if (!href) return 'href="#"';

  var escapedHref = escapeHtml(href);
  var isLocal = href.indexOf('/') === 0 || href.indexOf('./') === 0 || href.indexOf('../') === 0 || href.indexOf('#') === 0 || href.indexOf('?') === 0;
  var isMailOrTel = /^(mailto:|tel:)/i.test(href);

  if (isLocal || isMailOrTel) return 'href="' + escapedHref + '"';

  if (/^https?:\/\//i.test(href)) {
    try {
      var parsed = new URL(href, window.location.origin);
      if (parsed.origin !== window.location.origin) {
        return 'href="' + escapedHref + '" target="_blank" rel="noopener"';
      }
    } catch (e) {
      return 'href="' + escapedHref + '" target="_blank" rel="noopener"';
    }
  }

  return 'href="' + escapedHref + '"';
}

function normalizeMarkdownLinks(text) {
  return String(text || '')
    .replace(/\]\s+\(([^)]+)\)/g, ']($1)')
    .replace(/\[(https?:\/\/[^\]]+)\]\((https?:\/\/[^)]+)\)/gi, function (_, labelUrl, hrefUrl) {
      return '[' + labelUrl.trim() + '](' + hrefUrl.trim() + ')';
    });
}

function renderNewsMarkdown(content) {
  if (!(window.marked && typeof window.marked.parse === 'function')) {
    return '<pre>' + escapeHtml(content) + '</pre>';
  }

  var renderer = new window.marked.Renderer();
  renderer.link = function () {
    var href = '';
    var title = '';
    var text = '';
    var token = arguments[0];

    if (token && typeof token === 'object') {
      href = token.href || '';
      title = token.title || '';
      text = token.text || '';
      if (!text && token.tokens && this.parser && typeof this.parser.parseInline === 'function') {
        text = this.parser.parseInline(token.tokens);
      }
    } else {
      href = arguments[0] || '';
      title = arguments[1] || '';
      text = arguments[2] || '';
    }

    text = String(text || '').replace(/<[^>]+>/g, '').trim();
    var label = getReadableLinkLabel(text, href);
    var attrs = buildLinkAttributes(href);
    var titleAttr = title ? ' title="' + escapeHtml(title) + '"' : '';
    return '<a ' + attrs + titleAttr + '>' + escapeHtml(label) + '</a>';
  };

  return window.marked.parse(normalizeMarkdownLinks(content), { renderer: renderer });
}

function applyFilter() {
  var term = normalizeText($('#newsSearch').val());

  NEWS_FILTERED = NEWS_POSTS.filter(function (post) {
    if (!term) return true;
    return normalizeText(post.title).indexOf(term) !== -1 ||
      normalizeText(post.author).indexOf(term) !== -1 ||
      normalizeText(getPostDateWithYear(post)).indexOf(term) !== -1;
  });

  updateNewsCount();
  renderNewsList();

  if (!NEWS_FILTERED.length) {
    setStatus('is-empty', tr('newsNoResults'));
    $('#newsContent').empty();
    $('#newsTitle').text('-');
    $('#newsMeta').text('');
    return;
  }

  var stillSelected = NEWS_FILTERED.some(function (p) { return p.file === NEWS_SELECTED_FILE; });
  if (!stillSelected) {
    openNewsPost(NEWS_FILTERED[0]);
  }
}

function renderNewsList() {
  var $list = $('#newsList');
  $list.empty();

  NEWS_FILTERED.forEach(function (post) {
    var isActive = post.file === NEWS_SELECTED_FILE;
    var $link = $('<button type="button" class="document-link news-link"></button>');
    if (isActive) $link.addClass('is-active');

    var meta = getPostMetaText(post);
    $link.append('<i class="fa-regular fa-newspaper" aria-hidden="true"></i>');
    $link.append(
      $('<span class="news-link-text"></span>').append(
        $('<strong class="news-link-title"></strong>').text(post.title || post.file),
        $('<span class="news-link-meta"></span>').text(meta)
      )
    );

    $link.on('click', function () {
      openNewsPost(post);
    });

    $list.append($link);
  });
}

function openNewsPost(post) {
  if (!post || !post.file) return;

  NEWS_SELECTED_FILE = post.file;
  try {
    var url = new URL(window.location.href);
    url.searchParams.set('post', post.file);
    history.replaceState(null, '', url.pathname + url.search);
  } catch (e) {}

  renderNewsList();

  $('#newsTitle').text(post.title || post.file);
  $('#newsMeta').text(getPostMetaText(post));
  setStatus('is-loading', tr('loading'));

  fetch(getNewsBasePath() + '/' + post.file)
    .then(function (res) {
      if (!res.ok) throw new Error('missing post');
      return res.text();
    })
    .then(function (text) {
      var content = String(text || '')
        .replace(/^#\s+.+\n+/m, '')
        .replace(/^\*[^\n]+\*\n+/m, '');
      var html = renderNewsMarkdown(content);
      $('#newsContent').html(html);
      $('#newsStatus').text('');
      $('#newsContent').scrollTop(0);
    })
    .catch(function () {
      $('#newsContent').empty();
      setStatus('is-error', tr('newsFailedLoad'));
    });
}

function loadManifest() {
  setStatus('is-loading', tr('loading'));

  fetch(getNewsBasePath() + '/_manifest.json')
    .then(function (res) {
      if (!res.ok) throw new Error('manifest missing');
      return res.json();
    })
    .then(function (json) {
      var posts = Array.isArray(json.posts) ? json.posts : [];
      NEWS_POSTS = posts.filter(function (p) { return p && p.file; });
      NEWS_FILTERED = NEWS_POSTS.slice();
      updateNewsCount();

      if (!NEWS_POSTS.length) {
        setStatus('is-empty', tr('newsSelectPrompt'));
        return;
      }

      var requested = getRequestedPostFromUrl();
      var selected = NEWS_POSTS.find(function (p) { return p.file === requested; }) || NEWS_POSTS[0];
      openNewsPost(selected);
    })
    .catch(function () {
      setStatus('is-error', tr('newsFailedLoad'));
    });
}

$(function () {
  syncNewsTitle();
  loadManifest();

  $('#newsSearch').on('input', function () {
    applyFilter();
  });

  document.addEventListener('langChanged', function () {
    syncNewsTitle();
    NEWS_SELECTED_FILE = null;
    NEWS_POSTS = [];
    NEWS_FILTERED = [];
    updateNewsCount();
    renderNewsList();
    loadManifest();
  });
});
