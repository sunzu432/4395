/*
 * Page logic: banner, concept list with expandable components/subcomponents,
 * side panel, and group / filter / sort / search. Everything is built with DOM
 * APIs and textContent (never innerHTML), so content in data.js can't inject markup.
 */
(function () {
  'use strict';

  var cfg = window.APP_CONFIG || {};
  var concepts = window.CONCEPTS;
  var root = document.getElementById('app');
  var brandEl = document.getElementById('brand');

  /* ---------- tiny DOM helper ---------- */

  function append(parent, child) {
    if (child === null || child === undefined || child === false) return;
    if (Array.isArray(child)) { child.forEach(function (c) { append(parent, c); }); return; }
    parent.appendChild(typeof child === 'object' ? child : document.createTextNode(String(child)));
  }

  function h(tag, attrs) {
    var el = document.createElement(tag);
    var a = attrs || {};
    Object.keys(a).forEach(function (k) {
      var v = a[k];
      if (v === undefined || v === null || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'value') el.value = v;
      else if (k.indexOf('on') === 0) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : String(v));
    });
    for (var i = 2; i < arguments.length; i++) append(el, arguments[i]);
    return el;
  }

  var uidCounter = 0;
  function uid(prefix) { uidCounter += 1; return prefix + '-' + uidCounter; }

  /* ---------- banner ---------- */

  (function renderBrand() {
    var name = cfg.companyName || 'Company Name';
    brandEl.textContent = '';
    if (cfg.logoUrl) brandEl.appendChild(h('img', { class: 'brand-logo', src: cfg.logoUrl, alt: '' }));
    brandEl.appendChild(h('span', { class: 'brand-name', text: name }));
    document.title = (cfg.headline ? cfg.headline + ' | ' : '') + name;
    if (/^#[0-9a-f]{3,8}$/i.test(cfg.accentColor || '')) {
      document.documentElement.style.setProperty('--accent', cfg.accentColor);
    }
  })();

  /* ---------- data validation ---------- */

  function validate(list) {
    var errors = [];
    if (!Array.isArray(list) || list.length === 0) {
      return ['window.CONCEPTS must be a non-empty list. Check js/data.js.'];
    }
    var seen = {};
    list.forEach(function (c, i) {
      var label = 'Concept ' + (i + 1) + (c && c.id ? ' ("' + c.id + '")' : '');
      if (!c || typeof c !== 'object') { errors.push(label + ' is not an object.'); return; }
      if (!c.id) errors.push(label + ' is missing "id".');
      else if (seen[c.id]) errors.push(label + ': duplicate concept id "' + c.id + '".');
      else seen[c.id] = true;
      if (!c.name) errors.push(label + ' is missing "name".');
      if (c.components !== undefined && !Array.isArray(c.components)) {
        errors.push(label + ': "components" must be a list.');
        return;
      }
      var seenK = {};
      (c.components || []).forEach(function (k, j) {
        var kl = label + ', component ' + (j + 1) + (k && k.id ? ' ("' + k.id + '")' : '');
        if (!k || typeof k !== 'object') { errors.push(kl + ' is not an object.'); return; }
        if (!k.id) errors.push(kl + ' is missing "id".');
        else if (seenK[k.id]) errors.push(kl + ': duplicate component id "' + k.id + '" in this concept.');
        else seenK[k.id] = true;
        if (!k.name) errors.push(kl + ' is missing "name".');
        if (k.subcomponents !== undefined && !Array.isArray(k.subcomponents)) {
          errors.push(kl + ': "subcomponents" must be a list.');
          return;
        }
        (k.subcomponents || []).forEach(function (s, m) {
          var sl = kl + ', subcomponent ' + (m + 1);
          if (!s || typeof s !== 'object') { errors.push(sl + ' is not an object.'); return; }
          if (!s.id) errors.push(sl + ' is missing "id".');
          if (!s.name) errors.push(sl + ' is missing "name".');
        });
      });
    });
    return errors;
  }

  var dataErrors = validate(concepts);
  if (dataErrors.length) {
    root.textContent = '';
    root.appendChild(h('section', { class: 'card error-card', role: 'alert' },
      h('h1', { text: 'Content problem in js/data.js' }),
      h('p', { text: 'Fix these and reload the page:' }),
      h('ul', null, dataErrors.map(function (e) { return h('li', { text: e }); }))
    ));
    return;
  }

  /* ---------- state ---------- */

  var state = { q: '', filter: '', sort: 'name', grouped: false, selectedId: null };
  var overrides = {};   // open/closed choices made by clicking chevrons (key -> boolean)
  var lastOpener = null;

  var collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
  function cmp(a, b) { return collator.compare(String(a == null ? '' : a), String(b == null ? '' : b)); }

  var SORTS = {
    'name': function (a, b) { return cmp(a.name, b.name); },
    'name-desc': function (a, b) { return cmp(b.name, a.name); },
    'id': function (a, b) { return cmp(a.id, b.id); },
    'group': function (a, b) { return cmp(a.group, b.group) || cmp(a.name, b.name); }
  };

  function lower(s) { return String(s == null ? '' : s).toLowerCase(); }
  function has(field, q) { return lower(field).indexOf(q) !== -1; }

  // Decides if a concept matches the search, and which of its nested rows
  // contain the match (those get auto-expanded so the match is visible).
  function match(c, q) {
    var res = { show: true, openConcept: false, openComps: {} };
    if (!q) return res;
    var self = has(c.name, q) || has(c.id, q) || has(c.group, q) || has(c.definition, q);
    var nested = false;
    (c.components || []).forEach(function (k) {
      var kSelf = has(k.name, q) || has(k.id, q);
      var sub = (k.subcomponents || []).some(function (s) { return has(s.name, q) || has(s.id, q); });
      if (sub) res.openComps[k.id] = true;
      if (kSelf || sub) nested = true;
    });
    res.show = self || nested;
    res.openConcept = nested;
    return res;
  }

  function groupLabel(c) { return c.group || 'Ungrouped'; }

  function visibleConcepts() {
    var q = state.q.trim().toLowerCase();
    var out = [];
    concepts.forEach(function (c) {
      if (state.filter && groupLabel(c) !== state.filter) return;
      var m = match(c, q);
      if (m.show) out.push({ c: c, m: m });
    });
    var by = SORTS[state.sort];
    out.sort(function (x, y) {
      if (state.grouped) {
        var g = cmp(groupLabel(x.c), groupLabel(y.c));
        if (g) return g;
      }
      return by(x.c, y.c);
    });
    return out;
  }

  function isOpen(key, auto) {
    return Object.prototype.hasOwnProperty.call(overrides, key) ? overrides[key] : !!auto;
  }

  /* ---------- page skeleton ---------- */

  var listEl = h('ul', { class: 'list', id: 'concept-list' });
  var countEl = h('p', { class: 'count', 'aria-live': 'polite' });

  var groupBtn = h('button', {
    class: 'tool-btn', type: 'button', 'aria-pressed': 'false',
    title: 'Group rows by concept group',
    onclick: function () {
      state.grouped = !state.grouped;
      groupBtn.setAttribute('aria-pressed', String(state.grouped));
      renderList();
    }
  }, 'Group');

  var groups = [];
  concepts.forEach(function (c) { var g = groupLabel(c); if (groups.indexOf(g) === -1) groups.push(g); });
  groups.sort(cmp);

  var filterSel = h('select', {
    id: 'filter', onchange: function (e) { state.filter = e.target.value; renderList(); }
  }, h('option', { value: '', text: 'All groups' }),
    groups.map(function (g) { return h('option', { value: g, text: g }); }));

  var sortSel = h('select', {
    id: 'sort', onchange: function (e) { state.sort = e.target.value; renderList(); }
  },
    h('option', { value: 'name', text: 'Name (A–Z)' }),
    h('option', { value: 'name-desc', text: 'Name (Z–A)' }),
    h('option', { value: 'id', text: 'Concept ID' }),
    h('option', { value: 'group', text: 'Concept Group' }));

  var searchInput = h('input', {
    id: 'search', type: 'search', placeholder: 'Search', autocomplete: 'off',
    'aria-label': 'Search concepts, components and subcomponents',
    oninput: function (e) { state.q = e.target.value; overrides = {}; renderList(); }
  });

  var toolbar = h('div', { class: 'toolbar', role: 'group', 'aria-label': 'Group, filter, sort and search' },
    groupBtn,
    h('label', { class: 'tool', for: 'filter' }, h('span', { text: 'Filter' }), filterSel),
    h('label', { class: 'tool', for: 'sort' }, h('span', { text: 'Sort' }), sortSel),
    h('div', { class: 'search-wrap' }, searchInput));

  var thead = h('div', { class: 'thead cols', 'aria-hidden': 'true' },
    h('span', { text: 'Main Concept' }), h('span', { text: 'Concept ID' }), h('span', { text: 'Concept Group' }));

  root.appendChild(h('section', { class: 'intro' },
    h('h1', { text: cfg.headline || 'Heading' }),
    cfg.subtext ? h('p', { class: 'subtext', text: cfg.subtext }) : null));
  root.appendChild(toolbar);
  root.appendChild(countEl);
  root.appendChild(h('div', { class: 'table' }, thead, listEl));

  /* ---------- side panel ---------- */

  var panelTitle = h('h2', { id: 'panel-title', tabindex: '-1' });
  var panelId = h('dd');
  var panelGroup = h('dd');
  var panelDef = h('dd', { class: 'def' });
  var closeBtn = h('button', { class: 'panel-close', type: 'button', 'aria-label': 'Close details', onclick: closePanel }, '×');
  var panel = h('aside', { class: 'panel', id: 'detail-panel', role: 'dialog', 'aria-modal': 'false', 'aria-labelledby': 'panel-title' },
    closeBtn,
    panelTitle,
    h('dl', null,
      h('dt', { text: 'Concept ID' }), panelId,
      h('dt', { text: 'Concept Group' }), panelGroup,
      h('dt', { text: 'Definition' }), panelDef));
  var scrim = h('div', { class: 'scrim', onclick: closePanel });
  document.body.appendChild(scrim);
  document.body.appendChild(panel);

  function markSelected() {
    Array.prototype.forEach.call(listEl.querySelectorAll('.concept'), function (li) {
      var on = state.selectedId !== null && li.getAttribute('data-id') === state.selectedId;
      li.classList.toggle('selected', on);
    });
  }

  function openPanel(c, opener) {
    state.selectedId = c.id;
    lastOpener = c.id;
    panelTitle.textContent = c.name;
    panelId.textContent = c.id;
    panelGroup.textContent = c.group || '—';
    panelDef.textContent = c.definition || 'No definition provided.';
    panel.classList.add('show');
    scrim.classList.add('show');
    document.body.classList.add('panel-open');
    markSelected();
    panelTitle.focus();
  }

  function closePanel() {
    if (!panel.classList.contains('show')) return;
    panel.classList.remove('show');
    scrim.classList.remove('show');
    document.body.classList.remove('panel-open');
    state.selectedId = null;
    markSelected();
    var back = null;
    Array.prototype.forEach.call(listEl.querySelectorAll('.name-link'), function (b) {
      if (b.getAttribute('data-id') === lastOpener) back = b;
    });
    if (back) back.focus();
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closePanel();
  });

  /* ---------- list rendering ---------- */

  function chevron(open, controlsId, label, onToggle) {
    var btn = h('button', {
      class: 'chev', type: 'button', 'aria-expanded': String(open), 'aria-controls': controlsId, 'aria-label': label
    }, h('span', { class: 'chev-icon', 'aria-hidden': 'true' }));
    btn.addEventListener('click', function () {
      var now = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(now));
      onToggle(now);
    });
    return btn;
  }

  function renderSubs(c, k, subs, show) {
    var ul = h('ul', { class: 'subs' });
    ul.appendChild(h('li', { class: 'subhead cols', 'aria-hidden': 'true' },
      h('span', { text: 'Subcomponent Name' }), h('span', { text: 'Subcomponent ID' }), h('span')));
    subs.forEach(function (s) {
      ul.appendChild(h('li', { class: 'srow cols' },
        h('span', { class: 'cell', text: s.name }),
        h('span', { class: 'cell mono', 'data-label': 'ID', text: s.id }),
        h('span')));
    });
    return ul;
  }

  function renderComponent(c, k, it) {
    var subs = k.subcomponents || [];
    var key = 'k:' + c.id + '/' + k.id;
    var open = subs.length > 0 && isOpen(key, it.m.openComps[k.id]);
    var subsId = uid('subs');
    var li = h('li', { class: 'comp' + (open ? ' open' : '') });
    var subsEl = subs.length ? renderSubs(c, k, subs) : null;
    if (subsEl) { subsEl.id = subsId; if (!open) subsEl.hidden = true; }
    var toggle = subs.length
      ? chevron(open, subsId, 'Show subcomponents of ' + k.name, function (now) {
          overrides[key] = now; subsEl.hidden = !now; li.classList.toggle('open', now);
        })
      : h('span', { class: 'chev-spacer' });
    li.appendChild(h('div', { class: 'crow cols' },
      h('div', { class: 'main' }, toggle, h('span', { class: 'cname', text: k.name })),
      h('span', { class: 'cell mono', 'data-label': 'ID', text: k.id }),
      h('span')));
    if (subsEl) li.appendChild(subsEl);
    return li;
  }

  function renderConcept(it) {
    var c = it.c;
    var comps = c.components || [];
    var key = 'c:' + c.id;
    var open = comps.length > 0 && isOpen(key, it.m.openConcept);
    var detailId = uid('detail');
    var li = h('li', { class: 'concept' + (open ? ' open' : '') + (state.selectedId === c.id ? ' selected' : ''), 'data-id': c.id });

    var detail = null;
    if (comps.length) {
      detail = h('div', { class: 'detail', id: detailId });
      if (!open) detail.hidden = true;
      detail.appendChild(h('div', { class: 'subhead cols', 'aria-hidden': 'true' },
        h('span', { text: 'Component Name' }), h('span', { text: 'Component ID' }), h('span')));
      var ul = h('ul', { class: 'comps' });
      comps.forEach(function (k) { ul.appendChild(renderComponent(c, k, it)); });
      detail.appendChild(ul);
    }

    var toggle = detail
      ? chevron(open, detailId, 'Show components of ' + c.name, function (now) {
          overrides[key] = now; detail.hidden = !now; li.classList.toggle('open', now);
        })
      : h('span', { class: 'chev-spacer' });

    var nameBtn = h('button', {
      class: 'name-link', type: 'button', 'data-id': c.id, 'aria-controls': 'detail-panel', text: c.name,
      onclick: function () { openPanel(c, nameBtn); }
    });

    li.appendChild(h('div', { class: 'row cols' },
      h('div', { class: 'main' }, toggle, nameBtn),
      h('span', { class: 'cell mono', 'data-label': 'ID', text: c.id }),
      h('span', { class: 'cell', 'data-label': 'Group', text: c.group || '—' })));
    if (detail) li.appendChild(detail);
    return li;
  }

  function renderList() {
    var items = visibleConcepts();
    listEl.textContent = '';
    countEl.textContent = items.length + ' of ' + concepts.length + (concepts.length === 1 ? ' concept' : ' concepts');

    if (!items.length) {
      listEl.appendChild(h('li', { class: 'empty' },
        h('p', { text: 'No concepts match your search or filter.' }),
        h('button', {
          class: 'tool-btn', type: 'button', text: 'Clear search and filter',
          onclick: function () {
            state.q = ''; state.filter = ''; overrides = {};
            searchInput.value = ''; filterSel.value = '';
            renderList();
          }
        })));
      return;
    }

    var counts = {};
    items.forEach(function (it) { var g = groupLabel(it.c); counts[g] = (counts[g] || 0) + 1; });
    var last = null;
    items.forEach(function (it) {
      if (state.grouped) {
        var g = groupLabel(it.c);
        if (g !== last) {
          listEl.appendChild(h('li', { class: 'group-head', role: 'presentation', text: g + ' (' + counts[g] + ')' }));
          last = g;
        }
      }
      listEl.appendChild(renderConcept(it));
    });
  }

  renderList();
})();
