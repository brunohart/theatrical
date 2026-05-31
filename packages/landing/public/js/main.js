/**
 * main.js — small orchestration + progressive enhancement flags.
 * Module scripts (cursor/grain/animations/nav) self-init; this sets
 * up shared state and the year stamp in the credits roll.
 */
(function () {
  const root = document.documentElement;

  // Smooth in-page anchor scrolling that respects reduced motion.
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', id);
    });
  });

  // Credits year stamp.
  const year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();

  // Mark JS-enabled (for any CSS that wants to assume enhancement).
  root.classList.add('js');
})();
