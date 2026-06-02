import React, { useEffect, useRef } from 'react';
import { T } from '../theme';

/** Fixed cinematic frame: letterbox bars, sprocket rails, projector wash, grain, reticle cursor. */
export function Chrome() {
  return (
    <>
      <div aria-hidden style={bar('top')} />
      <div aria-hidden style={bar('bottom')} />
      <div aria-hidden style={projector} />
      <Grain />
      <Cursor />
    </>
  );
}

const bar = (side: 'top' | 'bottom'): React.CSSProperties => ({
  position: 'fixed', left: 0, right: 0, [side]: 0, height: 'clamp(14px,2.4vw,26px)',
  background: T.ink, zIndex: 400, pointerEvents: 'none',
});

const projector: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
  background: 'radial-gradient(120% 60% at 50% -10%, rgba(212,98,43,0.10), transparent 60%)',
};

function Grain() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cv = ref.current!; const ctx = cv.getContext('2d', { alpha: true })!;
    const tile = document.createElement('canvas'); tile.width = tile.height = 130;
    const tctx = tile.getContext('2d')!;
    const size = () => { cv.width = innerWidth; cv.height = innerHeight; };
    size(); addEventListener('resize', size, { passive: true });
    let last = 0, raf = 0;
    const paint = (t: number) => {
      raf = requestAnimationFrame(paint);
      if (t - last < 83) return; last = t;
      const img = tctx.createImageData(130, 130); const d = img.data;
      for (let i = 0; i < d.length; i += 4) { const v = (Math.random() * 255) | 0; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
      tctx.putImageData(img, 0, 0);
      const p = ctx.createPattern(tile, 'repeat')!;
      ctx.clearRect(0, 0, cv.width, cv.height); ctx.fillStyle = p; ctx.fillRect(0, 0, cv.width, cv.height);
    };
    raf = requestAnimationFrame(paint);
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', size); };
  }, []);
  return <canvas ref={ref} aria-hidden style={{ position: 'fixed', inset: 0, zIndex: 300, pointerEvents: 'none', opacity: 0.04, mixBlendMode: 'multiply' }} />;
}

function Cursor() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (matchMedia('(pointer: coarse)').matches) return;
    const el = ref.current!; el.style.display = 'block';
    document.documentElement.style.cursor = 'none';
    let mx = 0, my = 0, cx = 0, cy = 0, raf = 0;
    const move = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; };
    addEventListener('mousemove', move);
    const tick = () => { raf = requestAnimationFrame(tick); cx += (mx - cx) * 0.2; cy += (my - cy) * 0.2; el.style.transform = `translate(${cx}px,${cy}px)`; };
    tick();
    const over = (e: MouseEvent) => { el.dataset.hot = (e.target as Element)?.closest?.('a,button,[data-hot]') ? '1' : ''; };
    addEventListener('mouseover', over);
    return () => { cancelAnimationFrame(raf); removeEventListener('mousemove', move); removeEventListener('mouseover', over); document.documentElement.style.cursor = ''; };
  }, []);
  return (
    <div ref={ref} aria-hidden style={{ display: 'none', position: 'fixed', top: 0, left: 0, zIndex: 9999, pointerEvents: 'none', mixBlendMode: 'difference' }}>
      <div style={{ position: 'absolute', width: 22, height: 22, margin: '-11px 0 0 -11px' }}>
        <span style={{ position: 'absolute', top: '50%', left: 0, width: '100%', height: 1, background: '#fff', transform: 'translateY(-50%)' }} />
        <span style={{ position: 'absolute', left: '50%', top: 0, height: '100%', width: 1, background: '#fff', transform: 'translateX(-50%)' }} />
      </div>
    </div>
  );
}
