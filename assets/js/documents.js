var DOCUMENT_CATEGORIES = [
  {
    key: 'documentsCategory_antiDoping',
    docs: [
      { key: 'documentsDoc_dopingStatut', file: 'doping-statut-de.md' },
      { key: 'documentsDoc_informationStf', file: 'information-stf-de.md' },
      { key: 'documentsDoc_informationAntiDoping', file: 'information-anti-doping-de.md' }
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

function renderDocuments() {
  var totalCount = 0;

  var html = DOCUMENT_CATEGORIES.map(function (category) {
    var docsHtml = category.docs.map(function (doc) {
      totalCount++;
      return (
        '<a class="document-link" href="' + encodeURI(doc.file) + '" target="_blank" rel="noopener">' +
          '<i class="fa-regular fa-file-lines" aria-hidden="true"></i>' +
          '<span>' + tr(doc.key) + '</span>' +
        '</a>'
      );
    }).join('');

    return (
      '<section class="document-category">' +
        '<h2 class="document-category-title">' + tr(category.key) + '</h2>' +
        '<div class="document-links">' + docsHtml + '</div>' +
      '</section>'
    );
  }).join('');

  $('#documentsList').html(html);
  $('#documentsCount').text(tr('documentsCount', { count: totalCount }));
}

$(function () {
  renderDocuments();
});

document.addEventListener('langChanged', function () {
  renderDocuments();
});
