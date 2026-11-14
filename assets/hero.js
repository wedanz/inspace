/* Homepage hero: slides after the first load only when the slider gets near
   them (the current slide and the next one), never all eight at once.
   The URLs wait in data-src / data-srcset (see inspace_hero_slide_image()). */
(function () {
  'use strict';
  var hero = document.querySelector('[data-hero-lazy]');
  if (!hero) return;
  var slides = hero.querySelectorAll('.wp-slide');

  function load(i) {
    var slide = slides[(i + slides.length) % slides.length];
    if (!slide) return;
    // srcset before src, so the browser picks the right file the first time.
    slide.querySelectorAll('[data-srcset]').forEach(function (el) {
      el.setAttribute('srcset', el.getAttribute('data-srcset'));
      el.removeAttribute('data-srcset');
    });
    slide.querySelectorAll('[data-src]').forEach(function (el) {
      el.setAttribute('src', el.getAttribute('data-src'));
      el.removeAttribute('data-src');
    });
  }

  function loadAround() {
    var current = Number(hero.getAttribute('data-current') || 0);
    load(current);
    load(current + 1);
  }

  // Wait for the page (and the first slide) to finish, then follow the slider.
  function start() {
    loadAround();
    new MutationObserver(loadAround).observe(hero, { attributes: true, attributeFilter: ['data-current'] });
  }
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start);
})();
