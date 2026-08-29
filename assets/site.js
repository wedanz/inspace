/* INSPACE STUDIO — static site behaviour. Vanilla JS, no dependencies, safe to enqueue in WordPress. */
(function () {
  'use strict';
  var HEAD = 52;
  var d = document;

  function on(el, ev, fn, o) { if (el) el.addEventListener(ev, fn, o); }
  function all(sel, root) { return Array.prototype.slice.call((root || d).querySelectorAll(sel)); }

  /* ---------- header: transparent over media, solid once scrolled ---------- */
  var header = d.querySelector('[data-header]');
  function headerState() {
    if (!header) return;
    var solid = window.scrollY > window.innerHeight * 0.6 || d.documentElement.classList.contains('menu-open');
    header.style.background = solid ? 'var(--color-bg)' : 'transparent';
    header.style.borderBottom = solid ? '2px solid var(--color-divider)' : '2px solid transparent';
    header.style.backdropFilter = solid ? 'none' : 'blur(2px)';
    var ink = solid ? 'var(--color-text)' : 'rgba(247,243,238,0.95)';
    all('[data-header] .om-bar-links a, [data-header] > div > span, [data-header] .om-menu-btn').forEach(function (el) {
      // leave the filled CTA pill alone — it carries its own background/colour pair
      if (el.style.background || el.style.backgroundColor) return;
      el.style.color = ink;
    });
    var btn = d.querySelector('.om-menu-btn');
    if (btn) btn.style.borderBottomColor = ink;
  }
  on(window, 'scroll', headerState, { passive: true });
  headerState();

  /* ---------- mobile drawer ---------- */
  var drawer = d.querySelector('[data-drawer]');
  function setMenu(open) {
    if (!drawer) return;
    drawer.style.display = open ? 'grid' : 'none';
    d.documentElement.classList.toggle('menu-open', open);
    var btn = d.querySelector('.om-menu-btn');
    if (btn) { btn.textContent = open ? 'Close' : 'Menu'; btn.setAttribute('aria-expanded', open ? 'true' : 'false'); }
    headerState();
  }

  /* ---------- hero / project carousel ---------- */
  function slidesIn(section) { return all('.wp-slide', section); }
  function showSlide(section, idx) {
    var slides = slidesIn(section);
    if (!slides.length) return;
    var n = (idx + slides.length) % slides.length;
    section.setAttribute('data-current', String(n));
    slides.forEach(function (s, i) {
      var on_ = i === n;
      s.style.opacity = on_ ? '1' : '0';
      s.style.transform = on_ ? 'scale(1)' : 'scale(1.04)';
      s.style.pointerEvents = on_ ? 'auto' : 'none';
    });
    all('.wp-dots span', section).forEach(function (dot, i) {
      dot.style.background = i === n ? '#ffffff' : 'rgba(255,255,255,0.3)';
    });
  }

  /* ---------- before / after compare ---------- */
  all('.wp-compare').forEach(function (input) {
    var section = input.closest('section') || input.parentNode;
    function apply() {
      var pct = input.value + '%';
      all('[data-compare="after"]', section).forEach(function (el) { el.style.clipPath = 'inset(0 0 0 ' + pct + ')'; });
      all('[data-compare="move"]', section).forEach(function (el) { el.style.left = pct; });
      var label = section.querySelector('[data-compare-label]');
      if (label) label.textContent = input.value + '%';
    }
    on(input, 'input', apply);
    on(input, 'change', apply);
    apply();
  });

  /* ---------- journal gallery arrows ---------- */
  function galleryGo(dir) {
    var rail = d.querySelector('[data-gallery]');
    if (!rail) return;
    var cards = Array.prototype.slice.call(rail.children);
    var cur = Number(rail.getAttribute('data-index') || 0);
    var next = Math.max(0, Math.min(cards.length - 1, cur + dir));
    rail.setAttribute('data-index', String(next));
    rail.scrollTo({ left: cards[next].offsetLeft - rail.offsetLeft, behavior: 'smooth' });
    var out = d.querySelector('[data-gallery-index]');
    if (out) out.textContent = ('0' + (next + 1)).slice(-2);
  }

  /* ---------- filters + pagination ---------- */
  function grids() {
    return all('[data-card]').reduce(function (acc, card) {
      var g = card.parentNode;
      if (acc.indexOf(g) === -1) acc.push(g);
      return acc;
    }, []);
  }
  var state = { filter: null, page: 0 };

  function visibleCards(grid) {
    return all('[data-card]', grid).filter(function (c) {
      return !state.filter || state.filter === 'All' || c.getAttribute('data-cat') === state.filter;
    });
  }

  function renderPager(pager, total, per) {
    var last = Math.max(0, Math.ceil(total / per) - 1);
    if (state.page > last) state.page = last;
    var nums = '';
    for (var i = 0; i <= last; i++) {
      nums += i === state.page
        ? '<span data-pager-num data-active aria-current="page">' + (i + 1) + '</span>'
        : '<span data-pager-num role="button" tabindex="0" data-goto="' + i + '">' + (i + 1) + '</span>';
    }
    pager.innerHTML =
      '<button type="button" data-pager-arrow data-step="-1"' + (state.page === 0 ? ' disabled' : '') + '><span style="font-size:14px;line-height:1">\u2190</span>Previous</button>' +
      '<div class="wp-pager-nums">' + nums + '</div>' +
      '<button type="button" data-pager-arrow data-step="1"' + (state.page >= last ? ' disabled' : '') + '>Next<span style="font-size:14px;line-height:1">\u2192</span></button>';
  }

  function pagerFor(grid) {
    var next = grid.nextElementSibling;
    return next && next.classList && next.classList.contains('wp-pager') ? next : null;
  }

  function applyList(scrollToList) {
    grids().forEach(function (grid) {
      var vis = visibleCards(grid);
      var pager = pagerFor(grid);
      var per = pager ? Number(pager.getAttribute('data-per-page') || 6) : Infinity;
      if (pager) renderPager(pager, vis.length, per);
      all('[data-card]', grid).forEach(function (c) { c.hidden = true; });
      var slice = pager ? vis.slice(state.page * per, state.page * per + per) : vis.slice(0, 3);
      slice.forEach(function (c) { c.hidden = false; });

      var empty = grid.querySelector('[data-empty-state]');
      if (!vis.length) {
        if (!empty) {
          empty = d.createElement('p');
          empty.setAttribute('data-empty-state', '');
          empty.style.cssText = 'grid-column: 1 / -1; font-size: 13px; letter-spacing: 0.04em; color: color-mix(in srgb, var(--color-text) 60%, transparent); padding: 24px 0;';
          empty.textContent = 'Nothing matches this filter yet.';
          grid.appendChild(empty);
        }
      } else if (empty) {
        empty.remove();
      }

      var count = d.querySelector('[data-project-count]');
      if (count) count.textContent = ('0' + vis.length).slice(-2);
      if (scrollToList) {
        var top = grid.getBoundingClientRect().top + window.scrollY - HEAD - 24;
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      }
    });
  }

  function setFilter(label, btn) {
    state.filter = label;
    state.page = 0;
    var group = btn.closest('div');
    var row = group ? group.parentNode : d;
    all('[data-action="filter"]', row).forEach(function (b) {
      var active = b === btn;
      /* keep theme colour, only weight the state */
      b.style.borderBottomColor = active ? 'currentColor' : 'transparent';
      b.style.opacity = active ? '1' : '0.5';
    });
    applyList(false);
  }

  /* ---------- delegated clicks ---------- */
  on(d, 'click', function (e) {
    var t = e.target.closest('[data-action], [data-pager-arrow], [data-goto]');
    if (!t) return;
    if (t.hasAttribute('data-pager-arrow')) {
      if (t.disabled) return;
      state.page += Number(t.getAttribute('data-step'));
      if (state.page < 0) state.page = 0;
      applyList(true);
      return;
    }
    if (t.hasAttribute('data-goto')) { state.page = Number(t.getAttribute('data-goto')); applyList(true); return; }
    var act = t.getAttribute('data-action');
    if (act === 'menu') { setMenu(!drawer || drawer.style.display === 'none'); e.preventDefault(); }
    else if (act === 'menu-close') { setMenu(false); }
    else if (act === 'hero-prev' || act === 'hero-next') {
      var section = t.closest('section');
      var cur = Number(section.getAttribute('data-current') || 0);
      showSlide(section, cur + (act === 'hero-next' ? 1 : -1));
    }
    else if (act === 'gallery-prev') galleryGo(-1);
    else if (act === 'gallery-next') galleryGo(1);
    else if (act === 'filter') { setFilter(t.getAttribute('data-filter'), t); e.preventDefault(); }
  });
  on(d, 'keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var t = e.target.closest && e.target.closest('[data-goto]');
    if (!t) return;
    e.preventDefault();
    state.page = Number(t.getAttribute('data-goto'));
    applyList(true);
  });

  /* ---------- init ---------- */
  all('section').forEach(function (s) { if (slidesIn(s).length) showSlide(s, 0); });
  setMenu(false);
  var firstFilter = d.querySelector('[data-action="filter"]');
  if (firstFilter) {
    state.filter = firstFilter.getAttribute('data-filter');
    firstFilter.style.borderBottomColor = 'currentColor';
    firstFilter.style.opacity = '1';
  }
  if (d.querySelector('[data-card]') || d.querySelector('.wp-pager')) applyList(false);
  /* ---------- capture / zoom guard (matches the prototype) ---------- */
  var shield = d.querySelector('[data-shield]');
  function setShield(on) { if (shield) shield.style.display = on ? 'flex' : 'none'; }
  (function () {
    var vp = d.querySelector('meta[name="viewport"]');
    if (vp) vp.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no');
    var show = function () { setShield(true); };
    var hide = function () { setShield(false); };
    on(window, 'keydown', function (e) {
      var k = e.key;
      if (k === 'PrintScreen' || (e.metaKey && e.shiftKey && ['3', '4', '5', 'S', 's'].indexOf(k) > -1)) { show(); e.preventDefault(); return; }
      if ((e.ctrlKey || e.metaKey) && ['+', '-', '=', '_', '0'].indexOf(k) > -1) e.preventDefault();
      if ((e.ctrlKey || e.metaKey) && (k === 'p' || k === 'P')) { show(); e.preventDefault(); }
    });
    on(window, 'keyup', function (e) {
      if (e.key !== 'PrintScreen') return;
      try { navigator.clipboard.writeText(''); } catch (err) {}
      setTimeout(hide, 1200);
    });
    on(d, 'visibilitychange', function () { if (d.hidden) show(); else setTimeout(hide, 250); });
    on(window, 'beforeprint', show);
    on(window, 'afterprint', hide);
    on(d, 'contextmenu', function (e) { e.preventDefault(); });
    on(window, 'wheel', function (e) { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
    on(d, 'gesturestart', function (e) { e.preventDefault(); });
    on(d, 'gesturechange', function (e) { e.preventDefault(); });
    var last = 0;
    on(d, 'touchend', function (e) {
      var n = Date.now();
      if (n - last < 320) e.preventDefault();
      last = n;
    }, { passive: false });
    setShield(false);
  })();

  on(window, 'resize', headerState);
})();
