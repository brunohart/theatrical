/**
 * Custom cursor — a framing reticle / crop-mark.
 * Adapted from designedbybruno.net (lerp follow, hover reactions).
 * Physical metaphor: a camera operator framing the shot.
 */
(function () {
  const cursor = document.querySelector('.cursor');
  if (!cursor) return;

  // No custom cursor on touch / coarse pointers.
  if (window.matchMedia('(pointer: coarse)').matches) {
    cursor.remove();
    return;
  }

  document.documentElement.classList.add('has-cursor');

  let mouseX = 0, mouseY = 0;
  let cursorX = 0, cursorY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function animate() {
    const ease = 0.18;
    cursorX += (mouseX - cursorX) * ease;
    cursorY += (mouseY - cursorY) * ease;
    cursor.style.transform = `translate(${cursorX}px, ${cursorY}px)`;
    requestAnimationFrame(animate);
  }
  animate();

  const hoverTargets = 'a, button, .sdk-card, .essay-card, .project-card, [data-cursor-hover]';

  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(hoverTargets)) cursor.classList.add('cursor--hover');
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(hoverTargets)) cursor.classList.remove('cursor--hover');
  });
  document.addEventListener('mouseleave', () => cursor.classList.add('cursor--hidden'));
  document.addEventListener('mouseenter', () => cursor.classList.remove('cursor--hidden'));
})();
