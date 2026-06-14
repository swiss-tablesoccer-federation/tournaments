var DOCUMENT_CATEGORIES = [
  {
    key: 'documentsCategory_antiDoping',
    docs: [
      {
        key: 'documentsDoc_dopingStatut',
        files: {
          de: 'doping-statut-de.md',
          en: 'doping-statut-en.md',
          fr: 'doping-statut-fr.md',
          it: 'doping-statut-it.md'
        }
      },
      {
        key: 'documentsDoc_swissSportIntegrity',
        files: {
          de: 'swiss-sport-integrity-de.md',
          en: 'swiss-sport-integrity-en.md',
          fr: 'swiss-sport-integrity-fr.md'
        }
      }
    ]
  },
  {
    key: 'documentsCategory_finance',
    docs: [
      { key: 'documentsDoc_finanzreglementTurnierLizenzwesen', file: 'finanzreglement-turnier-und-lizenzwesen-de.md' }
    ]
  },
  {
    key: 'documentsCategory_organisation',
    docs: [
      { key: 'documentsDoc_statuten', file: 'statuten-de.md' },
      { key: 'documentsDoc_reglementSportkommission', file: 'reglement-sportkommission-de.md' },
      { key: 'documentsDoc_uebersichtVerbandsbeitrittStf', file: 'uebersicht-verbandsbeitritt-stf-de.md' }
    ]
  },
  {
    key: 'documentsCategory_sponsoringMarketing',
    docs: [
      { key: 'documentsDoc_partnermappeSwissTablesoccer', file: 'partnermappe-swiss-tablesoccer-de.md' },
      { key: 'documentsDoc_partnermappeFinals2024', file: 'partnermappe-finals-2024-de.md' }
    ]
  },
  {
    key: 'documentsCategory_sport',
    docs: [
      { key: 'documentsDoc_reglementQualifikationItsfWorldCup', file: 'reglement-qualifikation-itsf-world-cup-de.md' },
      { key: 'documentsDoc_regelwerkItsf', file: 'regelwerk-itsf-de.md' },
      { key: 'documentsDoc_reglementSwissTablesoccerLeague', file: 'reglement-swiss-tablesoccer-league-de.md' },
      { key: 'documentsDoc_reglementIndividualsport', file: 'reglement-individualsport-de.md' }
    ]
  },
  {
    key: 'documentsCategory_swissOlympicMembership',
    docs: [
      { key: 'documentsDoc_sportanerkennungSwissOlympic', file: 'sportanerkennung-swiss-olympic-de.md' }
    ]
  },
  {
    key: 'documentsCategory_rulingEthics',
    docs: [
      { key: 'documentsDoc_reglementDisziplinarverfahren', file: 'reglement-disziplinarverfahren-de.md' },
      { key: 'documentsDoc_meldeformularDisziplinarverfahren', file: 'meldeformular-disziplinarverfahren-de.md' },
      { key: 'documentsDoc_ethikCharta', file: 'ethik-charta-de.md' },
      { key: 'documentsDoc_ethikStatutSwissOlympic', file: 'ethik-statut-swiss-olympic-de.md' }
    ]
  }
];

<<<<<<< HEAD
var LINK_ONLY_TARGETS = {};
var currentDocumentFile = null;
var currentDocumentRequestId = 0;

function getActiveLang() {
  return (typeof currentLang === 'string' && currentLang) ? currentLang : 'de';
}

function getDocFile(doc) {
  var lang = getActiveLang();
  var files = doc.files || {};
  var fallbackOrder = [lang, 'de', 'en', 'fr', 'it'];
  var i;

  if (doc.file) return doc.file;

  for (i = 0; i < fallbackOrder.length; i++) {
    if (files[fallbackOrder[i]]) return files[fallbackOrder[i]];
  }

  return null;
}

=======
var DOCUMENTS_BY_FILE = {};
var currentDocumentFile = null;
var currentDocumentRequestId = 0;
var isDownloadingPdf = false;

DOCUMENT_CATEGORIES.forEach(function (category) {
  category.docs.forEach(function (doc) {
    DOCUMENTS_BY_FILE[doc.file] = doc;
  });
});

function getDocumentHash(file) {
  return '#doc=' + encodeURIComponent(file);
}

function getDocumentFileFromHash() {
  var match = window.location.hash.match(/^#doc=(.+)$/);
  if (!match) return null;

  try {
    var file = decodeURIComponent(match[1]);
    return DOCUMENTS_BY_FILE[file] ? file : null;
  } catch (e) {
    return null;
  }
}

function getFirstDocumentFile() {
  for (var i = 0; i < DOCUMENT_CATEGORIES.length; i++) {
    if (DOCUMENT_CATEGORIES[i].docs.length) return DOCUMENT_CATEGORIES[i].docs[0].file;
  }
  return null;
}

function isMobileDocumentsLayout() {
  return window.matchMedia('(max-width: 575px)').matches;
}

function scrollToDocumentViewer() {
  var viewerCard = document.querySelector('.document-viewer-card');
  if (!viewerCard || !isMobileDocumentsLayout()) return;

  viewerCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

>>>>>>> origin/main
function getSafeUrl(url) {
  if (typeof url !== 'string' || !url.trim()) return '';
  if (url.charAt(0) === '#') return url;

  try {
    var parsed = new URL(url, window.location.href);
    return /^(https?:|mailto:|tel:)$/.test(parsed.protocol) ? parsed.href : '';
  } catch (e) {
    return '';
  }
}

<<<<<<< HEAD
function extractSingleLinkTarget(markdownText) {
  var trimmed = String(markdownText || '').trim();
  var plainUrl = trimmed.match(/^(https?:\/\/\S+)$/i);
  var bracketUrl = trimmed.match(/^<\s*(https?:\/\/[^>\s]+)\s*>$/i);
  var markdownLink = trimmed.match(/^\[[^\]]+\]\(\s*(https?:\/\/[^)\s]+)(?:\s+["'][^"']*["'])?\s*\)$/i);

  if (plainUrl) return getSafeUrl(plainUrl[1]);
  if (bracketUrl) return getSafeUrl(bracketUrl[1]);
  if (markdownLink) return getSafeUrl(markdownLink[1]);
  return '';
}

function renderMarkdown(text) {
  if (window.marked && typeof window.marked.parse === 'function') {
    return window.marked.parse(text);
  }

  return '<pre>' + String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;') + '</pre>';
}

function renderViewerChrome() {
  if ($('#documentViewer').length) return;
=======
function resolveDocumentFile(url) {
  if (typeof url !== 'string' || !url.trim()) return null;

  try {
    var parsed = new URL(url, window.location.href);
    var filename = parsed.pathname.split('/').pop();
    return DOCUMENTS_BY_FILE[filename] ? filename : null;
  } catch (e) {
    return null;
  }
}

function renderViewerChrome() {
  var $viewer = $('#documentViewer');
  if ($viewer.length) return;
>>>>>>> origin/main

  $('.documents-card').empty().append(
    $('<div>').addClass('documents-layout').append(
      $('<div>').addClass('documents-browser').append(
        $('<div>').attr('id', 'documentsList')
      ),
      $('<section>')
        .addClass('document-viewer-card')
        .append(
          $('<div>').addClass('document-viewer-header').append(
            $('<div>').addClass('document-viewer-heading').append(
<<<<<<< HEAD
              $('<div>').addClass('document-viewer-label').text('Document'),
              $('<h2>').addClass('document-viewer-title').attr('id', 'documentViewerTitle')
            )
          )
        )
        .append(
          $('<div>').addClass('document-viewer-status').attr('id', 'documentViewerStatus'),
          $('<article>').addClass('document-viewer-content document-markdown').attr('id', 'documentViewer')
=======
              $('<div>')
                .addClass('document-viewer-label')
                .attr('id', 'documentViewerLabel'),
              $('<h2>')
                .addClass('document-viewer-title')
                .attr('id', 'documentViewerTitle')
            ),
            $('<button>')
              .addClass('document-viewer-action')
              .attr({
                id: 'documentViewerDownload',
                type: 'button'
              })
              .append(
                $('<i>')
                  .addClass('fa-solid fa-download')
                  .attr('aria-hidden', 'true')
              )
              .on('click', function () {
                downloadCurrentDocumentPdf();
              })
          )
        )
        .append(
          $('<div>')
            .addClass('document-viewer-status')
            .attr('id', 'documentViewerStatus'),
          $('<article>')
            .addClass('document-viewer-content document-markdown')
            .attr('id', 'documentViewer')
>>>>>>> origin/main
        )
    )
  );
}

<<<<<<< HEAD
=======
function updateViewerMeta(doc) {
  $('#documentViewerLabel').text(tr('documentsViewerLabel'));
  $('#documentViewerTitle').text(doc ? tr(doc.key) : '');
  $('#documentViewerDownload')
    .attr('title', tr('documentsDownloadPdf'))
    .attr('aria-label', tr('documentsDownloadPdf'));
}

function setDownloadButtonState(disabled) {
  $('#documentViewerDownload').prop('disabled', !!disabled);
}

function getDocumentPdfFilename(file) {
  return String(file || 'document')
    .replace(/\.md$/i, '.pdf')
    .replace(/[^\w.\-]+/g, '-');
}

function groupPdfHeadingBlocks($container) {
  $container.find('h1, h2, h3, h4').each(function () {
    var $heading = $(this);
    var $next = $heading.next();
    var $group;

    if (!$next.length || !$next.is('p, ul, ol, blockquote, table, pre')) return;

    $group = $('<div>')
      .addClass('document-pdf-heading-group')
      .insertBefore($heading)
      .append($heading, $next);

    if ($heading.is('h1, h2') && $group.prev().length) {
      $group.addClass('document-pdf-heading-group-page');
    }
  });
}

function createPdfExportNode(markdownText) {
  var $root = $('<div>').addClass('document-pdf-export-root');
  var $export = $('<div>')
    .addClass('document-markdown document-pdf-export')
    .css({
      width: '172mm',
      padding: '0',
      background: '#ffffff',
      color: '#333333'
    });

  $export.html(renderMarkdown(markdownText));
  enhanceDocumentLinks($export);
  groupPdfHeadingBlocks($export);
  $root.append($export);

  $('body').append($root);
  return $root;
}

function downloadCurrentDocumentPdf() {
  var doc = currentDocumentFile ? DOCUMENTS_BY_FILE[currentDocumentFile] : null;
  var $exportRoot = null;

  if (!doc || isDownloadingPdf || !window.html2pdf || !$('#documentViewer').children().length) return;

  isDownloadingPdf = true;
  setDownloadButtonState(true);

  fetch(doc.file)
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.text();
    })
    .then(function (markdownText) {
      $exportRoot = createPdfExportNode(markdownText);

      return window.html2pdf().set({
        margin: 19,
        filename: getDocumentPdfFilename(doc.file),
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] }
      }).from($exportRoot.find('.document-pdf-export').get(0)).save();
    })
    .catch(function () {
      setViewerStatus('error', tr('documentsDownloadFailed'));
    })
    .then(function () {
      if ($exportRoot) $exportRoot.remove();
      isDownloadingPdf = false;
      setDownloadButtonState(!currentDocumentFile || !$('#documentViewer').children().length);
    });
}

>>>>>>> origin/main
function setViewerStatus(type, message) {
  $('#documentViewerStatus')
    .removeClass('is-loading is-error is-empty')
    .addClass(type ? 'is-' + type : '')
    .html(message || '');
}

<<<<<<< HEAD
function updateActiveDocumentLink() {
  $('.document-link').removeClass('is-active').attr('aria-current', null);

  if (!currentDocumentFile) return;
  $('.document-link[data-doc-file="' + currentDocumentFile + '"]')
    .addClass('is-active')
    .attr('aria-current', 'page');
}

function enhanceDocumentLinks($container) {
  $container.find('a').each(function () {
    var $link = $(this);
    var safeHref = getSafeUrl($link.attr('href'));
=======
function enhanceDocumentLinks($container) {
  $container.find('a').each(function () {
    var $link = $(this);
    var originalHref = $link.attr('href');
    var safeHref = getSafeUrl(originalHref);
    var embeddedFile = resolveDocumentFile(originalHref);

>>>>>>> origin/main
    if (!safeHref) {
      $link.replaceWith($link.text());
      return;
    }

<<<<<<< HEAD
    $link.attr('href', safeHref).attr('target', '_blank').attr('rel', 'noopener');
  });
}

function isMobileDocumentsLayout() {
  return window.matchMedia('(max-width: 575px)').matches;
}

function scrollToDocumentViewer() {
  var viewerCard = document.querySelector('.document-viewer-card');
  if (!viewerCard || !isMobileDocumentsLayout()) return;
  viewerCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderExternalLinkPlaceholder(linkTarget) {
  var safeTarget = getSafeUrl(linkTarget);
  var $viewer = $('#documentViewer');
  var $card;

  if (!safeTarget) {
    $viewer.empty();
    return;
  }

  $card = $('<a>')
    .addClass('document-external-link-card')
    .attr('href', safeTarget)
    .attr('target', '_blank')
    .attr('rel', 'noopener')
    .append(
      $('<i>')
        .addClass('fa-solid fa-arrow-up-right-from-square')
        .attr('aria-hidden', 'true'),
      $('<span>').addClass('document-external-link-url').text(safeTarget)
    );

  $viewer.empty().append($card);
}

function loadDocument(file, title, shouldScroll) {
  var requestId = ++currentDocumentRequestId;

  currentDocumentFile = file;
  $('#documentViewerTitle').text(title || '');
  updateActiveDocumentLink();
  setViewerStatus(
    'loading',
    '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>' + tr('loading')
  );
  $('#documentViewer').removeClass('is-external');
  $('#documentViewer').empty();

  fetch(file)
=======
    if (embeddedFile) {
      $link
        .attr('href', getDocumentHash(embeddedFile))
        .attr('data-doc-file', embeddedFile)
        .removeAttr('target')
        .removeAttr('rel');
      return;
    }

    $link
      .attr('href', safeHref)
      .attr('target', '_blank')
      .attr('rel', 'noopener');
  });

  $container.find('img').each(function () {
    var $img = $(this);
    var safeSrc = getSafeUrl($img.attr('src'));

    if (!safeSrc) {
      $img.remove();
      return;
    }

    $img.attr('src', safeSrc).attr('loading', 'lazy');
  });
}

function renderMarkdown(text) {
  if (window.marked && typeof window.marked.parse === 'function') {
    return window.marked.parse(text);
  }

  return '<pre>' + escapeHtml(text) + '</pre>';
}

function updateActiveDocumentLink() {
  $('.document-link').removeClass('is-active').attr('aria-current', null);

  if (!currentDocumentFile) return;

  $('.document-link[data-doc-file="' + currentDocumentFile + '"]')
    .addClass('is-active')
    .attr('aria-current', 'page');
}

function loadDocument(file, options) {
  var doc = DOCUMENTS_BY_FILE[file];
  var requestId;
  var shouldScrollToViewer;

  options = options || {};
  if (!doc) return;

  currentDocumentFile = file;
  requestId = ++currentDocumentRequestId;
  shouldScrollToViewer = !!options.scrollToViewer;

  updateViewerMeta(doc);
  updateActiveDocumentLink();
  setViewerStatus(
    'loading',
    '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>' +
      tr('loading')
  );
  $('#documentViewer').empty();
  setDownloadButtonState(true);

  if (options.updateHash !== false && window.location.hash !== getDocumentHash(file)) {
    window.location.hash = getDocumentHash(file);
  }

  fetch(doc.file)
>>>>>>> origin/main
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.text();
    })
    .then(function (text) {
<<<<<<< HEAD
      var linkTarget;

      if (requestId !== currentDocumentRequestId) return;
      linkTarget = extractSingleLinkTarget(text);
      LINK_ONLY_TARGETS[file] = linkTarget;

      if (linkTarget) {
        setViewerStatus('empty', '');
        $('#documentViewer').addClass('is-external');
        renderExternalLinkPlaceholder(linkTarget);
        window.open(linkTarget, '_blank', 'noopener');
        if (shouldScroll) scrollToDocumentViewer();
        return;
      }

      $('#documentViewer').removeClass('is-external');
      $('#documentViewer').html(renderMarkdown(text));
      enhanceDocumentLinks($('#documentViewer'));
      setViewerStatus('', '');
      if (shouldScroll) scrollToDocumentViewer();
    })
    .catch(function () {
      if (requestId !== currentDocumentRequestId) return;
      setViewerStatus('error', tr('failedToLoadData', { status: '?' }));
=======
      if (requestId !== currentDocumentRequestId) return;

      var $viewer = $('#documentViewer');
      $viewer.html(renderMarkdown(text));
      enhanceDocumentLinks($viewer);
      setViewerStatus('', '');
      setDownloadButtonState(false);
      if (shouldScrollToViewer) scrollToDocumentViewer();
    })
    .catch(function () {
      if (requestId !== currentDocumentRequestId) return;

      setViewerStatus('error', tr('documentsFailedToLoad'));
      setDownloadButtonState(true);
      if (shouldScrollToViewer) scrollToDocumentViewer();
>>>>>>> origin/main
    });
}

function renderDocuments() {
  var totalCount = 0;
  var $list = $('#documentsList');
  var firstDoc = null;
  var defaultDoc = null;

  $list.empty();

  DOCUMENT_CATEGORIES.forEach(function (category) {
    var $section = $('<section>').addClass('document-category');
    $('<h2>').addClass('document-category-title').text(tr(category.key)).appendTo($section);

    var $links = $('<div>').addClass('document-links');
    category.docs.forEach(function (doc) {
      var file = getDocFile(doc);
      var title;
      var $link;

      if (!file) return;
      if (!firstDoc) firstDoc = { file: file, key: doc.key };
      if (doc.key === 'documentsDoc_statuten') defaultDoc = { file: file, key: doc.key };

      totalCount++;
      title = tr(doc.key);
      $link = $('<a>')
        .addClass('document-link')
<<<<<<< HEAD
        .attr('href', file)
        .attr('data-doc-file', file)
        .on('click', function (event) {
          event.preventDefault();
          loadDocument(file, title, true);
        });
=======
        .attr('href', getDocumentHash(doc.file))
        .attr('data-doc-file', doc.file)
        .on('click', function (event) {
          event.preventDefault();
          loadDocument(doc.file, { scrollToViewer: true });
        });

      $('<i>')
        .addClass('fa-regular fa-file-lines')
        .attr('aria-hidden', 'true')
        .appendTo($link);
      $('<span>').text(tr(doc.key)).appendTo($link);
>>>>>>> origin/main

      $('<i>').addClass('fa-regular fa-file-lines').attr('aria-hidden', 'true').appendTo($link);
      $('<span>').text(title).appendTo($link);
      $links.append($link);
    });

    $section.append($links);
    $list.append($section);
  });

  $('#documentsCount').text(tr('documentsCount', { count: totalCount }));
<<<<<<< HEAD

  if (defaultDoc || firstDoc) {
    var initialDoc = defaultDoc || firstDoc;
    loadDocument(initialDoc.file, tr(initialDoc.key), false);
  } else {
    $('#documentViewerTitle').text('');
    setViewerStatus('empty', '');
    $('#documentViewer').empty();
  }
=======
  updateActiveDocumentLink();
>>>>>>> origin/main
}

$(function () {
  renderViewerChrome();
  renderDocuments();

  var initialFile = getDocumentFileFromHash() || getFirstDocumentFile();
  if (initialFile) {
    loadDocument(initialFile, { updateHash: false });
  } else {
    updateViewerMeta(null);
    setViewerStatus('empty', tr('documentsSelectPrompt'));
    setDownloadButtonState(true);
  }

  window.addEventListener('hashchange', function () {
    var file = getDocumentFileFromHash();
    if (file && file !== currentDocumentFile) {
      loadDocument(file, { updateHash: false });
    }
  });
});

document.addEventListener('langChanged', function () {
  renderDocuments();
  updateViewerMeta(currentDocumentFile ? DOCUMENTS_BY_FILE[currentDocumentFile] : null);
  if (!currentDocumentFile) {
    setViewerStatus('empty', tr('documentsSelectPrompt'));
    setDownloadButtonState(true);
  } else if ($('#documentViewerStatus').hasClass('is-error')) {
    setViewerStatus('error', tr('documentsFailedToLoad'));
  }
});
