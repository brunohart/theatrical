/**
 * Film grain — animated patina over the whole page.
 * Paints low-res monochrome noise to an offscreen tile and
 * scrolls/regenerates it a few times a second. Cheap, subtle.
 * Disabled under prefers-reduced-motion.
 */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  const canvas = document.querySelector('.grain');
  if (!canvas || !canvas.getContext) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  document.documentElement.classList.add('has-grain');

  const TILE = 140;          // noise tile resolution (kept small)
  const FPS = 12;            // grain "flicker" rate
  const interval = 1000 / FPS;

  const tile = document.createElement('canvas');
  tile.width = tile.height = TILE;
  const tctx = tile.getContext('2d');

  function makeNoise() {
    const img = tctx.createImageData(TILE, TILE);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = 255;
    }
    tctx.putImageData(img, 0, 0);
  }

  function size() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  size();
  window.addEventListener('resize', size, { passive: true });

  let last = 0;
  function paint(now) {
    requestAnimationFrame(paint);
    if (now - last < interval) return;
    last = now;
    makeNoise();
    const pat = ctx.createPattern(tile, 'repeat');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = pat;
    // jitter the origin so the grain drifts like real film
    ctx.save();
    ctx.translate((Math.random() * TILE) | 0, (Math.random() * TILE) | 0);
    ctx.fillRect(-TILE, -TILE, canvas.width + TILE * 2, canvas.height + TILE * 2);
    ctx.restore();
  }
  requestAnimationFrame(paint);

  // Pause when tab hidden to save cycles.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { last = Infinity; }
    else { last = 0; }
  });
})();
