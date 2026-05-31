/**
 * Nav — frosted backdrop once the hero scrolls past.
 */
(function () {
  const nav = document.querySelector('.nav');
  if (!nav) return;

  let ticking = false;
  function update() {
    nav.classList.toggle('is-stuck', window.scrollY > 48);
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  update();
})();
