// EnJEL site behaviour: mobile menu, newsletter, publication and project filters, site search.
(function () {
  'use strict';
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var params = new URLSearchParams(location.search);
  var norm = function (s) { return String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, ''); };
  var words = function (q) { return norm(q).split(/[^\w₂–-]+/).filter(Boolean); };

  // ---------- Mobile menu ----------
  var header = $('.site-header');
  var toggle = $('.menu-toggle');
  if (header && toggle) {
    toggle.addEventListener('click', function () {
      var open = header.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    $$('#main-nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        header.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ---------- Animated logo: start when it scrolls into view ----------
  var motion = $('.logo-motion');
  if (motion && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('lm-wait');
    var io = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) {
        motion.classList.add('is-playing');
        io.disconnect();
      }
    }, { threshold: 0.4 });
    io.observe(motion);
  }

  // ---------- Newsletter (Formspree) ----------
  $$('form[data-newsletter]').forEach(function (form) {
    var status = $('.form-status', form);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (/YOUR_FORM_ID/.test(form.action)) {
        status.textContent = 'Sign-up isn’t connected yet. Please email info@enjel.org to join the list.';
        return;
      }
      status.textContent = 'Sending…';
      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (r) {
          if (!r.ok) throw new Error();
          form.reset();
          status.textContent = 'Thank you. You’re on the list.';
        })
        .catch(function () { status.textContent = 'Something went wrong. Please try again or email info@enjel.org.'; });
    });
  });

  // ---------- Research: publication search, filters, sort, pages ----------
  var pubRoot = $('#pub-results');
  if (pubRoot) {
    var PER_PAGE = 10;
    var items = $$('.pub', pubRoot);
    var filters = $('#pub-filters');
    var input = $('#pub-search');
    var sort = $('#sort');
    var count = $('#pub-count');
    var empty = $('#pub-empty');
    var pager = $('#pub-pages');
    var page = 1;

    if (params.get('q')) input.value = params.get('q');

    var update = function (keepPage) {
      if (!keepPage) page = 1;
      var checked = {};
      $$('input[type=checkbox]:checked', filters).forEach(function (c) {
        (checked[c.name] = checked[c.name] || []).push(c.value);
      });
      var terms = words(input.value);
      var match = items.filter(function (el) {
        var d = el.dataset;
        if (checked.pillar && !checked.pillar.some(function (v) { return d.pillar.split('|').indexOf(v) > -1; })) return false;
        if (checked.type && checked.type.indexOf(d.type) < 0) return false;
        if (checked.status && checked.status.indexOf(d.status) < 0) return false;
        if (checked.year && checked.year.indexOf(d.year) < 0) return false;
        var text = norm(d.text);
        return terms.every(function (t) { return text.indexOf(t) > -1; });
      });
      match.sort(sort.value === 'title'
        ? function (a, b) { return a.dataset.title.localeCompare(b.dataset.title); }
        : function (a, b) { return a.dataset.order - b.dataset.order; }); // file order: newest at the top

      var pages = Math.max(1, Math.ceil(match.length / PER_PAGE));
      page = Math.min(page, pages);
      items.forEach(function (el) { el.hidden = true; });
      match.forEach(function (el, i) {
        pubRoot.appendChild(el);
        el.hidden = Math.floor(i / PER_PAGE) + 1 !== page;
      });
      count.textContent = match.length;
      empty.hidden = match.length > 0;

      pager.innerHTML = '';
      pager.hidden = pages < 2;
      for (var p = 1; p <= pages; p++) {
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = p;
        if (p === page) b.setAttribute('aria-current', 'page');
        b.addEventListener('click', (function (n) {
          return function () { page = n; update(true); $('#publications').scrollIntoView(); };
        })(p));
        pager.appendChild(b);
      }
    };

    filters.addEventListener('change', function () { update(); });
    filters.addEventListener('reset', function () { setTimeout(function () { input.value = ''; update(); }, 0); });
    input.addEventListener('input', function () { update(); });
    $('#pub-search-form').addEventListener('submit', function (e) {
      e.preventDefault();
      update();
      $('#publications').scrollIntoView();
    });
    sort.addEventListener('change', function () { update(); });
    update();
    if (params.get('q')) $('#publications').scrollIntoView();

    // Cite: copy a plain-text citation
    $$('[data-cite]', pubRoot).forEach(function (btn) {
      btn.hidden = false;
      btn.addEventListener('click', function () {
        var note = btn.parentNode.querySelector('.copied');
        var text = btn.getAttribute('data-cite');
        var done = function () { note.textContent = 'Citation copied'; setTimeout(function () { note.textContent = ''; }, 2500); };
        if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, function () { window.prompt('Copy this citation:', text); });
        else window.prompt('Copy this citation:', text);
      });
    });
  }

  // ---------- Projects: category filter ----------
  var bar = $('[data-project-filter]');
  if (bar) {
    var cards = $$('[data-pillar]', $('main')).filter(function (el) { return el.matches('.featured, .pcard'); });
    var buttons = $$('.filter-btn', bar);
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var f = btn.dataset.filter;
        buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
        var shown = 0;
        cards.forEach(function (c) {
          c.hidden = !!f && c.dataset.pillar !== f;
          if (!c.hidden) shown++;
        });
        $('#project-count').textContent = shown;
        $('#project-empty').hidden = shown > 0;
      });
    });
  }

  // ---------- Site search ----------
  var results = $('#search-results');
  if (results) {
    var q = params.get('q') || '';
    var status = $('#search-status');
    $('#q').value = q;
    var escapeHtml = function (s) {
      return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
    };
    var highlight = function (text, terms) {
      var out = escapeHtml(text);
      terms.forEach(function (t) {
        var re = new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
        out = out.replace(re, '<mark>$1</mark>');
      });
      return out;
    };
    var snippet = function (text, terms) {
      var lower = norm(text);
      var at = terms.reduce(function (m, t) { var i = lower.indexOf(t); return i > -1 && (m < 0 || i < m) ? i : m; }, -1);
      var start = Math.max(0, at - 60);
      var s = text.slice(start, start + 220);
      return (start > 0 ? '…' : '') + s + (start + 220 < text.length ? '…' : '');
    };
    if (q.trim()) {
      status.textContent = 'Searching…';
      fetch('search-index.json')
        .then(function (r) { return r.json(); })
        .then(function (index) {
          var terms = words(q);
          var seen = {};
          var hits = index.map(function (e) {
            var t = norm(e.t), x = norm(e.x);
            var ok = terms.every(function (w) { return t.indexOf(w) > -1 || x.indexOf(w) > -1; });
            if (!ok) return null;
            var score = terms.reduce(function (s, w) { return s + (t.indexOf(w) > -1 ? 3 : 1); }, 0);
            return { e: e, score: score };
          }).filter(Boolean).sort(function (a, b) { return b.score - a.score; })
            .filter(function (h) { var k = h.e.t + h.e.u; if (seen[k]) return false; seen[k] = 1; return true; });

          status.textContent = hits.length
            ? hits.length + (hits.length === 1 ? ' result' : ' results') + ' for “' + q + '”'
            : 'No results for “' + q + '”. Try a shorter or different word.';
          results.innerHTML = hits.slice(0, 50).map(function (h) {
            return '<li><span class="rtype">' + escapeHtml(h.e.k) + '</span>' +
              '<a href="' + escapeHtml(h.e.u) + '">' + highlight(h.e.t, terms) + '</a>' +
              (h.e.x ? '<p>' + highlight(snippet(h.e.x, terms), terms) + '</p>' : '') + '</li>';
          }).join('');
          results.hidden = !hits.length;
        })
        .catch(function () { status.textContent = 'Search could not load. If you opened the file directly, run the local preview server (see README).'; });
    }
  }
})();
