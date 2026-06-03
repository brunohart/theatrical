/**
 * Film grain — a single STATIC patina over the whole page.
 * Paints one fixed monochrome noise tile (no animation, no jitter) for a
 * tactile, film-stock feel. Repaints only on resize (which clears the canvas).
 */
(function () {
  const canvas = document.querySelector('.grain');
  if (!canvas || !canvas.getContext) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  document.documentElement.classList.add('has-grain');

  const TILE = 140;
  const tile = document.createElement('canvas');
  tile.width = tile.height = TILE;
  const tctx = tile.getContext('2d');

  // Generate the noise tile ONCE — this is what makes the grain static.
  const img = tctx.createImageData(TILE, TILE);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = (Math.random() * 255) | 0;
    d[i] = d[i + 1] = d[i + 2] = v;
    d[i + 3] = 255;
  }
  tctx.putImageData(img, 0, 0);

  function paint() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const pat = ctx.createPattern(tile, 'repeat');
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  paint();
  window.addEventListener('resize', paint, { passive: true });
})();
