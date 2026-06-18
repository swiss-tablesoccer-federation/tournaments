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
          fr: 'swiss-sport-integrity-fr.md',
          it: 'swiss-sport-integrity-it.md'
        }
      }
    ]
  },
  {
    key: 'documentsCategory_finance',
    docs: [
      { 
        key: 'documentsDoc_finanzreglementTurnierLizenzwesen', 
        files: {
          de: 'finanzreglement-de.md',
          en: 'finanzreglement-en.md',
          fr: 'finanzreglement-fr.md',
          it: 'finanzreglement-it.md'
        }
      },
      { 
        key: 'documentsDoc_lizenzierung', 
        files: {
          de: 'lizenzierung-in-coral-de.md',
          en: 'lizenzierung-in-coral-en.md',
          fr: 'lizenzierung-in-coral-fr.md',
          it: 'lizenzierung-in-coral-it.md'
        }
      }
    ]
  },
  {
    key: 'documentsCategory_organisation',
    docs: [
      { 
        key: 'documentsDoc_statuten', 
        files: {
          de: 'statuten-de.md',
          en: 'statuten-en.md',
          fr: 'statuten-fr.md',
          it: 'statuten-it.md'
        }
      },
      { 
        key: 'documentsDoc_reglementSportkommission', 
        files: {
          de: 'reglement-sportkommission-de.md',
          en: 'reglement-sportkommission-en.md',
          fr: 'reglement-sportkommission-fr.md',
          it: 'reglement-sportkommission-it.md'
        }
      },
      { 
        key: 'documentsDoc_uebersichtVerbandsbeitrittStf', 
          files: {
              de: 'verbandsbeitritt-stf-de.md',
              en: 'verbandsbeitritt-stf-en.md',
              fr: 'verbandsbeitritt-stf-fr.md',
              it: 'verbandsbeitritt-stf-it.md'
          }
        }
    ]
  },
  /*
  {
    key: 'documentsCategory_sponsoringMarketing',
    docs: [
      { key: 'documentsDoc_partnermappeSwissTablesoccer', file: 'partnermappe-swiss-tablesoccer-de.md' },
      { key: 'documentsDoc_partnermappeFinals2024', file: 'partnermappe-finals-2024-de.md' }
    ]
  },
  */
  {
    key: 'documentsCategory_sport',
    docs: [
      { 
        key: 'documentsDoc_reglementQualifikationItsfWorldCup', 
        files: {
          de: 'reglement-qualifikation-itsf-world-cup-de.md',
          en: 'reglement-qualifikation-itsf-world-cup-en.md',
          fr: 'reglement-qualifikation-itsf-world-cup-fr.md',
          it: 'reglement-qualifikation-itsf-world-cup-it.md'
        }
      },
      { 
        key: 'documentsDoc_regelwerkItsf', 
        files: {
          de: 'regelwerk-itsf-de.md',
          en: 'regelwerk-itsf-en.md',
          fr: 'regelwerk-itsf-fr.md',
          it: 'regelwerk-itsf-it.md'
        }
      },
      { 
        key: 'documentsDoc_reglementSwissTablesoccerLeague', 
        files: {
          de: 'reglement-swiss-tablesoccer-league-de.md',
          en: 'reglement-swiss-tablesoccer-league-en.md',
          fr: 'reglement-swiss-tablesoccer-league-fr.md',
          it: 'reglement-swiss-tablesoccer-league-it.md'
        }
      },
      { 
        key: 'documentsDoc_reglementIndividualsport', 
        files: {
          de: 'reglement-individualsport-de.md',
          en: 'reglement-individualsport-en.md',
          fr: 'reglement-individualsport-fr.md',
          it: 'reglement-individualsport-it.md'
        }
      }
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
      { 
        key: 'documentsDoc_reglementDisziplinarverfahren', 
        files: {
          de: 'reglement-disziplinarverfahren-de.md',
          en: 'reglement-disziplinarverfahren-en.md',
          fr: 'reglement-disziplinarverfahren-fr.md',
          it: 'reglement-disziplinarverfahren-it.md'
        }
      },
      { 
        key: 'documentsDoc_meldeformularDisziplinarverfahren', 
        files: {
          de: 'meldeformular-disziplinarverfahren-de.md',
          en: 'meldeformular-disziplinarverfahren-en.md',
          fr: 'meldeformular-disziplinarverfahren-fr.md',
          it: 'meldeformular-disziplinarverfahren-it.md'
        }
      },
      { 
        key: 'documentsDoc_ethikCharta', 
        files: {
          de: 'ethik-charta-de.md',
          en: 'ethik-charta-en.md',
          fr: 'ethik-charta-fr.md',
          it: 'ethik-charta-it.md'
        }
      },
      { 
        key: 'documentsDoc_ethikStatutSwissOlympic', 
        files: {
          de: 'ethik-statut-swiss-olympic-de.md',
          en: 'ethik-statut-swiss-olympic-en.md',
          fr: 'ethik-statut-swiss-olympic-fr.md',
          it: 'ethik-statut-swiss-olympic-it.md'
        }
      }
    ]
  }
];

var LINK_ONLY_TARGETS = {};
var currentDocumentFile = null;
var currentDocumentKey = null;
var currentDocumentRequestId = 0;
var isPdfExportRunning = false;

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

function getPdfFileName(file) {
  var baseName = String(file || 'document')
    .split('/')
    .pop()
    .replace(/\.md$/i, '');
  return (baseName || 'document') + '.pdf';
}

function setDownloadButtonDisabled(disabled) {
  $('#documentDownloadPdfBtn').prop('disabled', !!disabled);
}

function updateViewerHeaderTexts() {
  $('#documentViewerLabel').text(tr('documentsViewerLabel'));
  $('#documentDownloadPdfBtn')
    .attr('title', tr('documentsDownloadPdf'))
    .attr('aria-label', tr('documentsDownloadPdf'));
}

function preparePdfHeadingGroups($content) {
  var headingSelector = 'h1, h2';

  $content.find('.document-pdf-heading-group, .document-pdf-heading-group-page').each(function () {
    var $group = $(this);
    $group.replaceWith($group.contents());
  });

  $content.find(headingSelector).each(function () {
    var $heading = $(this);
    var $next = $heading.next();
    var $group = $('<div>').addClass('document-pdf-heading-group');

    if ($heading.is('h1, h2')) {
      $group.addClass('document-pdf-heading-group-page');
    }

    $heading.before($group);
    $group.append($heading);

    if ($next.length && $next.is('p, ul, ol, blockquote, table, pre')) {
      $group.append($next);
    }
  });
}

function generatePdfFromCurrentDocument() {
  var sourceFile = currentDocumentFile;
  var $button = $('#documentDownloadPdfBtn');

  if (!sourceFile || isPdfExportRunning || LINK_ONLY_TARGETS[sourceFile]) return;
  if (typeof window.html2pdf !== 'function') {
    alert(tr('documentsDownloadFailed'));
    return;
  }

  isPdfExportRunning = true;
  setDownloadButtonDisabled(true);

  fetch(sourceFile)
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.text();
    })
    .then(function (markdownText) {
      var $exportRoot = $('<div>').addClass('document-pdf-export-root');
      var $exportContent = $('<div>')
        .addClass('document-pdf-export document-markdown')
        .css({ width: '172mm' })
        .html(renderMarkdown(markdownText));
      var options = {
        margin: 19,
        filename: getPdfFileName(sourceFile),
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] }
      };

      if (extractSingleLinkTarget(markdownText)) {
        throw new Error('link-only-document');
      }

      enhanceDocumentLinks($exportContent);
      preparePdfHeadingGroups($exportContent);
      $exportRoot.append($exportContent);
      $('body').append($exportRoot);

      return window.html2pdf()
        .set(options)
        .from($exportContent[0])
        .save()
        .then(function () {
          $exportRoot.remove();
        })
        .catch(function (error) {
          $exportRoot.remove();
          throw error;
        });
    })
    .catch(function () {
      alert(tr('documentsDownloadFailed'));
    })
    .then(function () {
      isPdfExportRunning = false;
      setDownloadButtonDisabled(!currentDocumentFile || !!LINK_ONLY_TARGETS[currentDocumentFile]);
      $button.blur();
    });
}

function renderViewerChrome() {
  if ($('#documentViewer').length) return;

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
              $('<div>').addClass('document-viewer-label').attr('id', 'documentViewerLabel'),
              $('<h2>').addClass('document-viewer-title').attr('id', 'documentViewerTitle')
            ),
            $('<button>')
              .addClass('document-viewer-action')
              .attr('id', 'documentDownloadPdfBtn')
              .attr('type', 'button')
              .prop('disabled', true)
              .append($('<i>').addClass('fa-solid fa-download').attr('aria-hidden', 'true'))
          )
        )
        .append(
          $('<div>').addClass('document-viewer-status').attr('id', 'documentViewerStatus'),
          $('<article>').addClass('document-viewer-content document-markdown').attr('id', 'documentViewer')
        )
    )
  );

  updateViewerHeaderTexts();
  $('#documentDownloadPdfBtn').on('click', generatePdfFromCurrentDocument);
}

function setViewerStatus(type, message) {
  $('#documentViewerStatus')
    .removeClass('is-loading is-error is-empty')
    .addClass(type ? 'is-' + type : '')
    .html(message || '');
}

function updateActiveDocumentLink() {
  $('.document-link').removeClass('is-active').attr('aria-current', null);

  if (!currentDocumentFile) return;
  $('.document-link[data-doc-file="' + currentDocumentFile + '"]')
    .addClass('is-active')
    .attr('aria-current', 'page');
}

function setCurrentDocumentHash(file) {
  var nextHash;

  if (typeof file !== 'string' || !file) return;
  nextHash = '#' + encodeURIComponent(file);
  if (window.location.hash === nextHash) return;
  window.location.hash = nextHash;
}

function getDocumentFileFromHash() {
  var raw = window.location.hash ? window.location.hash.slice(1) : '';

  if (!raw) return '';
  try {
    return decodeURIComponent(raw).trim();
  } catch (e) {
    return raw.trim();
  }
}

function enhanceDocumentLinks($container) {
  $container.find('a').each(function () {
    var $link = $(this);
    var safeHref = getSafeUrl($link.attr('href'));
    if (!safeHref) {
      $link.replaceWith($link.text());
      return;
    }

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

function loadDocument(file, title, shouldScroll, docKey) {
  var requestId = ++currentDocumentRequestId;

  currentDocumentFile = file;
  currentDocumentKey = docKey || null;
  setCurrentDocumentHash(file);
  setDownloadButtonDisabled(true);
  $('#documentViewerTitle').text(title || '');
  updateActiveDocumentLink();
  setViewerStatus(
    'loading',
    '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>' + tr('loading')
  );
  $('#documentViewer').removeClass('is-external');
  $('#documentViewer').empty();

  fetch(file)
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.text();
    })
    .then(function (text) {
      var linkTarget;

      if (requestId !== currentDocumentRequestId) return;
      linkTarget = extractSingleLinkTarget(text);
      LINK_ONLY_TARGETS[file] = linkTarget;

      if (linkTarget) {
        setViewerStatus('empty', '');
        $('#documentViewer').addClass('is-external');
        setDownloadButtonDisabled(true);
        renderExternalLinkPlaceholder(linkTarget);
        window.open(linkTarget, '_blank', 'noopener');
        if (shouldScroll) scrollToDocumentViewer();
        return;
      }

      $('#documentViewer').removeClass('is-external');
      $('#documentViewer').html(renderMarkdown(text));
      enhanceDocumentLinks($('#documentViewer'));
      setDownloadButtonDisabled(false);
      setViewerStatus('', '');
      if (shouldScroll) scrollToDocumentViewer();
    })
    .catch(function () {
      if (requestId !== currentDocumentRequestId) return;
      setDownloadButtonDisabled(true);
      setViewerStatus('error', tr('failedToLoadData', { status: '?' }));
    });
}

function renderDocuments(skipInitialLoad) {
  var totalCount = 0;
  var $list = $('#documentsList');
  var firstDoc = null;
  var defaultDoc = null;
  var hashDoc = null;

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
        .attr('href', file)
        .attr('data-doc-file', file)
        .on('click', function (event) {
          event.preventDefault();
          loadDocument(file, title, true, doc.key);
        });

      $('<i>').addClass('fa-regular fa-file-lines').attr('aria-hidden', 'true').appendTo($link);
      $('<span>').text(title).appendTo($link);
      $links.append($link);
    });

    $section.append($links);
    $list.append($section);
  });

  $('#documentsCount').text(tr('documentsCount', { count: totalCount }));
  hashDoc = findDocumentByFile(getDocumentFileFromHash(), true);

  if (!skipInitialLoad && (hashDoc || defaultDoc || firstDoc)) {
    var initialDoc = hashDoc ? { file: hashDoc.file, key: hashDoc.doc.key } : (defaultDoc || firstDoc);
    loadDocument(initialDoc.file, tr(initialDoc.key), false, initialDoc.key);
  } else if (!skipInitialLoad) {
    $('#documentViewerTitle').text('');
    setViewerStatus('empty', '');
    $('#documentViewer').empty();
  }
}

$(function () {
  renderViewerChrome();
  renderDocuments();
});

document.addEventListener('langChanged', function () {
  var previousDocumentKey = currentDocumentKey;
  updateViewerHeaderTexts();
  renderDocuments(!!previousDocumentKey);

  if (previousDocumentKey) {
    var doc = findDocumentByKey(previousDocumentKey);
    if (doc) {
      var file = getDocFile(doc);
      var title = tr(doc.key);
      loadDocument(file, title, false, doc.key);
    }
  }
});

window.addEventListener('hashchange', function () {
  var hashDoc = findDocumentByFile(getDocumentFileFromHash(), true);

  if (!hashDoc) return;
  if (hashDoc.file === currentDocumentFile) return;

  loadDocument(hashDoc.file, tr(hashDoc.doc.key), false, hashDoc.doc.key);
});

function findDocumentByKey(key) {
  var found = null;
  DOCUMENT_CATEGORIES.forEach(function (category) {
    if (!found) {
      category.docs.forEach(function (doc) {
        if (doc.key === key) {
          found = doc;
        }
      });
    }
  });
  return found;
}

function findDocumentByFile(file, searchAllLanguageFiles) {
  var found = null;

  if (!file) return null;

  DOCUMENT_CATEGORIES.forEach(function (category) {
    if (found) return;

    category.docs.forEach(function (doc) {
      var docFiles;
      var i;
      var activeFile;

      if (found) return;
      if (doc.file === file) {
        found = { doc: doc, file: doc.file };
        return;
      }

      docFiles = doc.files ? Object.keys(doc.files) : [];
      if (!docFiles.length) return;

      if (searchAllLanguageFiles) {
        for (i = 0; i < docFiles.length; i++) {
          if (doc.files[docFiles[i]] === file) {
            found = { doc: doc, file: doc.files[docFiles[i]] };
            return;
          }
        }
        return;
      }

      activeFile = getDocFile(doc);
      if (activeFile === file) {
        found = { doc: doc, file: activeFile };
      }
    });
  });

  return found;
}
