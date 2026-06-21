var HALL_OF_FAME_API = 'https://api.swisstablesoccer.ch/hall-of-fame';

function syncHallOfFameTitle() {
  document.title = 'Swiss Tablesoccer Federation - ' + ((typeof tr === 'function') ? tr('pageTitle_hallOfFame') : 'Hall of Fame');
}

function getCategorySortKey(categoryName) {
  var value = String(categoryName || '').toLowerCase();
  var family = 99;
  var discipline = 99;

  if (value.indexOf('open') !== -1 || value.indexOf('men') !== -1) {
    family = 0;
  } else if (value.indexOf('women') !== -1) {
    family = 1;
  } else if (value.indexOf('mixed') !== -1) {
    family = 2;
  } else if (value.indexOf('senior') !== -1) {
    family = 3;
  } else if (value.indexOf('junior') !== -1) {
    family = 4;
  }

  if (value.indexOf('doubles') !== -1) {
    discipline = 0;
  } else if (value.indexOf('singles') !== -1) {
    discipline = 1;
  }

  return [family, discipline, value];
}

function compareCategoryNames(leftName, rightName) {
  var left = getCategorySortKey(leftName);
  var right = getCategorySortKey(rightName);

  if (left[0] !== right[0]) return left[0] - right[0];
  if (left[1] !== right[1]) return left[1] - right[1];
  return left[2].localeCompare(right[2]);
}

function compareYearsDesc(leftYear, rightYear) {
  return Number(rightYear) - Number(leftYear);
}

function slugifyCategoryName(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'discipline';
}

function assignCategoryAnchorIds(categories) {
  var used = Object.create(null);

  categories.forEach(function (category) {
    var base = 'hof-' + slugifyCategoryName(category.category);
    var count = used[base] || 0;
    used[base] = count + 1;
    category.anchorId = count ? (base + '-' + (count + 1)) : base;
  });
}

function renderDisciplineNav(categories) {
  var $nav = $('#hof-discipline-nav');
  $nav.empty();

  if (!categories.length) return;

  categories.forEach(function (category) {
    if (!category.anchorId) return;

    var words = String(category.category || '').trim().split(/\s+/).filter(Boolean);
    var shortLabel = '';
    if (words.length === 1) {
      shortLabel = words[0].charAt(0).toUpperCase();
    } else if (words.length > 1) {
      shortLabel = (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
    }

    $nav.append(
      $('<a>')
        .addClass('hof-discipline-link')
        .attr('href', '#' + category.anchorId)
        .attr('data-target-id', category.anchorId)
        .attr('aria-label', category.category)
        .append(
          $('<span>').addClass('hof-link-label-full').text(category.category),
          $('<span>').addClass('hof-link-label-short').text(shortLabel || category.category)
        )
    );
  });
}

function setActiveDisciplineLink(targetId) {
  $('.hof-discipline-link').removeClass('is-active');
  if (!targetId) return;
  $('.hof-discipline-link[data-target-id="' + targetId + '"]').addClass('is-active');
}

function updateActiveDisciplineFromScroll() {
  var container = document.querySelector('.page-hall-of-fame .page-content');
  if (!container) return;

  var sections = Array.prototype.slice.call(document.querySelectorAll('.hof-category-section[id]'));
  if (!sections.length) return;

  var containerTop = container.getBoundingClientRect().top;
  var triggerLine = containerTop + 160;
  var activeId = sections[0].id;

  sections.forEach(function (section) {
    if (section.getBoundingClientRect().top <= triggerLine) {
      activeId = section.id;
    }
  });

  setActiveDisciplineLink(activeId);
}

function normalizeHallOfFameResponse(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return [];

  return Object.keys(data)
    .filter(function (category) {
      return data[category] && typeof data[category] === 'object' && !Array.isArray(data[category]);
    })
    .map(function (category) {
      var years = Object.keys(data[category])
        .filter(function (year) {
          return /^\d{4}$/.test(year) && data[category][year] && typeof data[category][year] === 'object';
        })
        .sort(compareYearsDesc)
        .map(function (year) {
          var yearData = data[category][year];
          var placements = [1, 2, 3]
            .map(function (rank) {
              var entry = yearData[String(rank)];
              if (!entry || typeof entry !== 'object') return null;

              return {
                rank: Number(entry.rank) || rank,
                players: Array.isArray(entry.players) ? entry.players : []
              };
            })
            .filter(Boolean)
            .sort(function (a, b) {
              return a.rank - b.rank;
            });

          return {
            year: year,
            placements: placements
          };
        })
        .filter(function (year) {
          return year.placements.length;
        });

      return {
        category: category,
        years: years
      };
    })
    .filter(function (category) {
      return category.years.length;
    })
    .sort(function (a, b) {
      return compareCategoryNames(a.category, b.category);
    });
}

function formatPlayers(players) {
  var names = (Array.isArray(players) ? players : [])
    .map(function (player) {
      return player && typeof player.name === 'string' ? player.name.trim() : '';
    })
    .filter(Boolean);

  return names.length ? names.join('\n') : ((typeof tr === 'function') ? tr('membersNotAvailable') : 'Not available');
}

function renderPlacementCard(placement) {
  var placeKey = 'hallOfFamePlace' + placement.rank;

  return $('<article>').addClass('hof-podium-card place-' + placement.rank).append(
    $('<span>').addClass('hof-place-badge').text(String(placement.rank)),
    $('<span>').addClass('hof-place-label').text((typeof tr === 'function') ? tr(placeKey) : (placement.rank + '. place')),
    $('<div>').addClass('hof-place-players').text(formatPlayers(placement.players))
  );
}

function renderHistoryRow(yearEntry) {
  function getPlacement(rank) {
    var placement = yearEntry.placements.find(function (entry) {
      return entry.rank === rank;
    });
    return placement ? formatPlayers(placement.players) : ((typeof tr === 'function') ? tr('membersNotAvailable') : 'Not available');
  }

  return $('<tr>').append(
    $('<th>').addClass('hof-year-col').attr('scope', 'row').append(
      $('<span>').addClass('hof-year-rotated').text(yearEntry.year)
    ),
    $('<td>').addClass('hof-player-cell').text(getPlacement(1)),
    $('<td>').addClass('hof-player-cell').text(getPlacement(2)),
    $('<td>').addClass('hof-player-cell').text(getPlacement(3))
  );
}

function renderCategorySection(category) {
  var currentYearEntry = category.years[0];
  var previousYears = category.years.slice(1);
  var $section = $('<section>').addClass('hof-category-section');
  if (category.anchorId) $section.attr('id', category.anchorId);

  $section.append(
    $('<div>').addClass('hof-category-header').append(
      $('<h2>').addClass('hof-category-title').text(category.category),
      currentYearEntry
        ? $('<div>').addClass('hof-current-year').text(
            (typeof tr === 'function') ? tr('hallOfFameLatestWinnersYear', { year: currentYearEntry.year }) : ('Champions of ' + currentYearEntry.year)
          )
        : null
    )
  );

  if (currentYearEntry) {
    var $podiumCards = $('<div>').addClass('hof-podium-cards');
    currentYearEntry.placements.forEach(function (placement) {
      $podiumCards.append(renderPlacementCard(placement));
    });

    $section.append(
      $('<div>').addClass('hof-current-podium').append(
        $podiumCards
      )
    );
  }

  if (previousYears.length) {
    var $table = $('<table>').addClass('hof-history-table');
    $table.append(
      $('<thead>').append(
        $('<tr>').append(
          $('<th>').addClass('hof-year-col').attr('scope', 'col').append(
            $('<span>').addClass('hof-year-rotated').text((typeof tr === 'function') ? tr('hallOfFameYear') : 'Year')
          ),
          $('<th>').attr('scope', 'col').text((typeof tr === 'function') ? tr('hallOfFamePlace1') : '1st place'),
          $('<th>').attr('scope', 'col').text((typeof tr === 'function') ? tr('hallOfFamePlace2') : '2nd place'),
          $('<th>').attr('scope', 'col').text((typeof tr === 'function') ? tr('hallOfFamePlace3') : '3rd place')
        )
      )
    );

    var $tbody = $('<tbody>');
    previousYears.forEach(function (yearEntry) {
      $tbody.append(renderHistoryRow(yearEntry));
    });
    $table.append($tbody);

    $section.append(
      $('<div>').addClass('hof-history-block').append(
        $('<div>').addClass('hof-subheading').text((typeof tr === 'function') ? tr('hallOfFamePodiumHistory') : 'Podium history'),
        $('<div>').addClass('hof-history-table-wrap').append($table)
      )
    );
  }

  return $section;
}

function renderHallOfFame(categories) {
  var $content = $('#hall-of-fame-content');
  $content.empty();

  if (!categories.length) {
    $('#hof-discipline-nav').empty();
    $content.html('<p class="text-secondary text-center py-3">' + ((typeof tr === 'function') ? tr('hallOfFameNoEntries') : 'No hall of fame entries available.') + '</p>');
    return;
  }

  assignCategoryAnchorIds(categories);
  renderDisciplineNav(categories);
  setActiveDisciplineLink(categories[0].anchorId);

  categories.forEach(function (category) {
    $content.append(renderCategorySection(category));
  });

  updateActiveDisciplineFromScroll();
}

function loadHallOfFame() {
  var $content = $('#hall-of-fame-content');
  $content.html(
    '<div class="text-center text-secondary py-3">' +
    '<span class="spinner-border spinner-border-sm me-2" role="status"></span>' +
    ((typeof tr === 'function') ? tr('loading') : 'Loading...') +
    '</div>'
  );

  fetch(HALL_OF_FAME_API)
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function (data) {
      renderHallOfFame(normalizeHallOfFameResponse(data));
    })
    .catch(function () {
      $content.html('<p class="text-danger text-center py-3">' + ((typeof tr === 'function') ? tr('hallOfFameFailedLoad') : 'Failed to load hall of fame.') + '</p>');
    });
}

$(function () {
  syncHallOfFameTitle();
  loadHallOfFame();

  $(document).on('click', '.hof-discipline-link', function (e) {
    e.preventDefault();
    var targetId = $(this).attr('data-target-id');
    if (!targetId) return;

    var el = document.getElementById(targetId);
    if (!el) return;
    setActiveDisciplineLink(targetId);
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  $('.page-content').on('scroll', function () {
    updateActiveDisciplineFromScroll();
  });

  document.addEventListener('langChanged', function () {
    syncHallOfFameTitle();
    loadHallOfFame();
  });
});