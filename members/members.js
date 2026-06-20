var MEMBERS_API = 'https://api.swisstablesoccer.ch/members';
var DEFAULT_MEMBER_IMAGE = 'https://app.tablesoccer.org/icon/organization.svg';

function loadMarkdown(baseName, targetId) {
  var lang = (typeof currentLang !== 'undefined' ? currentLang : 'en');
  var url = './' + baseName + '-' + lang + '.md';
  var $target = $('#' + targetId);

  fetch(url)
    .then(function (res) {
      if (!res.ok) return fetch('./' + baseName + '-en.md');
      return res;
    })
    .then(function (res) {
      if (!res.ok) throw new Error('Markdown not found');
      return res.text();
    })
    .then(function (text) {
      $target.html(marked.parse(text));
    })
    .catch(function () {
      $target.empty();
    });
}

function getSafeImageUrl(url) {
  if (typeof url !== 'string' || !url.trim()) return DEFAULT_MEMBER_IMAGE;

  try {
    var parsed = new URL(url, window.location.href);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') ? parsed.href : DEFAULT_MEMBER_IMAGE;
  } catch (e) {
    return DEFAULT_MEMBER_IMAGE;
  }
}

function findContactValues(member, type) {
  if (!member || !Array.isArray(member.contact)) return [];
  return member.contact
    .filter(function (item) {
      return item && item.type === type && typeof item.value === 'string' && item.value.trim();
    })
    .map(function (item) { return item.value.trim(); });
}

function formatAddress(value) {
  var parts = value.split(',').map(function (p) { return p.trim(); });
  var street = parts[0] || '';
  var city   = parts[1] || '';
  var postal = parts[2] || '';
  if (!street) return value;
  var line2 = (postal && city) ? (postal + ' ' + city) : (postal || city);
  return line2 ? (street + '\n' + line2) : street;
}

function sanitizeWebsiteUrl(value) {
  if (typeof value !== 'string') return null;
  var trimmed = value.trim();
  if (!trimmed) return null;

  var candidate = /^https?:\/\//i.test(trimmed) ? trimmed : ('https://' + trimmed);
  try {
    var parsed = new URL(candidate);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return parsed.href;
  } catch (e) {
    return null;
  }
}

var LABEL_ICONS = {
  membersStatus:  'fa-solid fa-circle-check',
  membersEmail:   'fa-solid fa-envelope',
  membersWebsite: 'fa-solid fa-globe',
  membersAddress: 'fa-solid fa-location-dot'
};

function appendValueRows($container, labelKey, values, renderFn) {
  var fallback = (typeof tr === 'function') ? tr('membersNotAvailable') : 'Not available';
  if (!values.length) values = [fallback];

  var iconClass = LABEL_ICONS[labelKey] || 'fa-solid fa-tag';
  var iconTitle = (typeof tr === 'function') ? tr(labelKey) : labelKey;

  values.forEach(function (value) {
    var node = renderFn ? renderFn(value) : $('<span>').text(value);
    var $icon = $('<i>').addClass(iconClass).addClass('directory-member-icon')
      .attr('title', iconTitle)
      .attr('aria-hidden', 'true');

    $container.append(
      $('<div>').addClass('directory-member-row')
        .append($('<div>').addClass('directory-member-label').append($icon))
        .append($('<div>').addClass('directory-member-value').append(node))
    );
  });
}

function renderMember(member) {
  var name = (member && typeof member.name === 'string' && member.name.trim())
    ? member.name.trim()
    : ((typeof tr === 'function') ? tr('membersNotAvailable') : 'Not available');

  var status = (member && typeof member.status === 'string' && member.status.trim())
    ? member.status.trim()
    : ((typeof tr === 'function') ? tr('membersNotAvailable') : 'Not available');

  var emails = findContactValues(member, 'email');
  var websites = findContactValues(member, 'website');
  var addresses = findContactValues(member, 'address');

  var $card = $('<article>').addClass('directory-member-card');
  var $head = $('<div>').addClass('directory-member-head');
  var $img = $('<img>')
    .addClass('directory-member-avatar')
    .attr('src', getSafeImageUrl(member && member.image))
    .attr('alt', name)
    .on('error', function () {
      $(this).attr('src', DEFAULT_MEMBER_IMAGE);
    });

  $head.append($img).append($('<div>').addClass('directory-member-name').text(name));

  var $meta = $('<div>').addClass('directory-member-meta');
  appendValueRows($meta, 'membersStatus', [status]);

  appendValueRows($meta, 'membersEmail', emails, function (email) {
    return $('<a>').attr('href', 'mailto:' + email).text(email);
  });

  appendValueRows($meta, 'membersWebsite', websites, function (website) {
    var safeUrl = sanitizeWebsiteUrl(website);
    if (!safeUrl) return $('<span>').text(website);
    return $('<a>').attr({ href: safeUrl, target: '_blank', rel: 'noopener' }).text(website);
  });

  appendValueRows($meta, 'membersAddress', addresses, function (address) {
    return $('<span>').text(formatAddress(address).split('\n').join(', '));
  });

  return $card.append($head).append($meta);
}

function normalizeMembersResponse(data) {
  if (!Array.isArray(data)) return [];

  if (data.length && data[0] && Array.isArray(data[0].members)) {
    return data
      .reduce(function (all, group) {
        if (group && Array.isArray(group.members)) return all.concat(group.members);
        return all;
      }, []);
  }

  return data.filter(function (item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  });
}

function loadMembers() {
  var $content = $('#members-content');
  $content.html(
    '<div class="text-center text-secondary py-3">' +
    '<span class="spinner-border spinner-border-sm me-2" role="status"></span>' +
    (typeof tr === 'function' ? tr('loading') : 'Loading...') +
    '</div>'
  );

  fetch(MEMBERS_API)
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function (data) {
      var members = normalizeMembersResponse(data);
      $content.empty();

      if (!members.length) {
        $content.html('<p class="text-secondary text-center py-3">' + (typeof tr === 'function' ? tr('membersNoEntries') : 'No members available.') + '</p>');
        return;
      }

      var sorted = members.slice().sort(function (a, b) {
        var left = (a && a.name ? String(a.name) : '').toLowerCase();
        var right = (b && b.name ? String(b.name) : '').toLowerCase();
        return left.localeCompare(right);
      });

      var $grid = $('<div>').addClass('members-grid');
      sorted.forEach(function (member) {
        $grid.append(renderMember(member));
      });
      $content.append($grid);

      geocodeAndPlotMembers(members);
    })
    .catch(function () {
      $content.html('<p class="text-danger text-center py-3">' + (typeof tr === 'function' ? tr('membersFailedLoad') : 'Failed to load members.') + '</p>');
    });
}

/* ── Map ─────────────────────────────────────────────────── */

var membersMap = null;

function initMap() {
  if (membersMap) return;
  membersMap = L.map('members-map', { scrollWheelZoom: false })
    .setView([46.85, 8.25], 8);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    maxZoom: 18
  }).addTo(membersMap);
}

function geocodeAndPlotMembers(members) {
  initMap();

  /* Collect one task per address across all members */
  var tasks = [];
  members.forEach(function (member) {
    if (!Array.isArray(member.contact)) return;
    member.contact.forEach(function (item) {
      if (item && item.type === 'address' && typeof item.value === 'string' && item.value.trim()) {
        tasks.push({ name: member.name || '', address: item.value.trim() });
      }
    });
  });

  /* Geocode sequentially, ≥ 1 s apart (Nominatim rate-limit) */
  var index = 0;
  function next() {
    if (index >= tasks.length) return;
    var task = tasks[index++];
    var query = encodeURIComponent(task.address);

    fetch('https://nominatim.openstreetmap.org/search?q=' + query + '&format=json&limit=1&countrycodes=ch', {
      headers: { 'Accept': 'application/json' }
    })
      .then(function (res) { return res.json(); })
      .then(function (results) {
        if (results && results.length) {
          var r = results[0];
          var formatted = formatAddress(task.address).split('\n').join(', ');
          var safeName = $('<span>').text(task.name).html();
          var safeAddr = $('<span>').text(formatted).html();
          L.marker([parseFloat(r.lat), parseFloat(r.lon)])
            .addTo(membersMap)
            .bindPopup('<strong>' + safeName + '</strong><br>' + safeAddr);
        }
      })
      .catch(function () { /* silently skip failed geocodes */ })
      .then(function () { setTimeout(next, 1100); }); /* always advance */
  }
  next();
}

$(function () {
  loadMembers();
  loadMarkdown('members', 'members-text');

  document.addEventListener('langChanged', function () {
    loadMarkdown('members', 'members-text');
  });
});
