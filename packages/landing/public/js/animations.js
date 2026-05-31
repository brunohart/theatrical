/**
 * GSAP-powered load timeline + scroll reveals.
 * Extends the designedbybruno motion language:
 * "objects settling onto a table" — staggered, power3/power4 ease.
 * Cinema additions: sprocket-rail parallax, underline draw-on.
 */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || typeof gsap === 'undefined') {
    // Fail-safe: un-hide anything the pre-paint flag cloaked.
    document.documentElement.classList.remove('has-motion');
    return;
  }

  document.documentElement.classList.add('has-motion');
  if (gsap.registerPlugin && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }

  // ─── Page load: the reel threads up ───
  function initLoad() {
    const tl = gsap.timeline({ defaults: { duration: 0.8, ease: 'power3.out' } });

    tl.fromTo('.nav', { opacity: 0, y: -16 }, { opacity: 1, y: 0 }, 0.1);
    tl.fromTo('.hero__kicker', { opacity: 0, y: 16 }, { opacity: 1, y: 0 }, 0.25);
    tl.fromTo('.hero__title', { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 1, ease: 'power4.out' }, 0.35);
    tl.fromTo('.hero__tagline', { opacity: 0, y: 30 }, { opacity: 1, y: 0 }, 0.65);
    tl.fromTo('.hero__actions', { opacity: 0, y: 24 }, { opacity: 1, y: 0 }, 0.8);
    tl.fromTo('.hero__filmstrip', { opacity: 0, y: 20 }, { opacity: 1, y: 0 }, 0.95);

    // hero projector glow breathes up
    tl.fromTo('.hero__glow', { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 1.4, ease: 'power2.out' }, 0.2);

    // draw the hero underline once it's settled
    tl.add(() => {
      document.querySelectorAll('.hero .underline-draw').forEach((el) => el.classList.add('is-drawn'));
    }, 1.1);
  }

  // ─── Scroll reveals ───
  function initReveals() {
    document.querySelectorAll('[data-reveal]').forEach((el) => {
      if (el.closest('.hero')) { gsap.set(el, { clearProps: 'all' }); return; }
      gsap.fromTo(el,
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 85%', once: true }
        }
      );
    });

    // staggered children (cards in a grid)
    document.querySelectorAll('[data-reveal-stagger]').forEach((group) => {
      gsap.fromTo(group.children,
        { opacity: 0, y: 40 },
        {
          opacity: 1, y: 0, duration: 0.7, stagger: 0.1, ease: 'power3.out',
          scrollTrigger: { trigger: group, start: 'top 82%', once: true }
        }
      );
    });

    // draw underlines as section titles enter
    document.querySelectorAll('[data-reveal] .underline-draw, .act__title .underline-draw').forEach((el) => {
      ScrollTrigger.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter: () => el.classList.add('is-drawn')
      });
    });
  }

  // ─── Sprocket-rail parallax ───
  function initSprockets() {
    document.querySelectorAll('.sprockets').forEach((rail) => {
      gsap.to(rail, {
        backgroundPositionY: '-200px',
        ease: 'none',
        scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: true }
      });
    });
    // also drift the perforation pattern containers
    gsap.utils.toArray('.sprockets__perf').forEach((p, i) => {
      gsap.to(p, {
        y: () => (i % 2 ? 40 : -40),
        ease: 'none',
        scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: true }
      });
    });
  }

  // ─── Card hover parallax (image/inner drifts toward cursor) ───
  function initCardParallax() {
    document.querySelectorAll('.sdk-card, .essay-card').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(card, { rotateX: -y * 4, rotateY: x * 6, transformPerspective: 800, duration: 0.5, ease: 'power2.out' });
      });
      card.addEventListener('mouseleave', () => {
        gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.6, ease: 'power2.out' });
      });
    });
  }

  function init() {
    initLoad();
    if (typeof ScrollTrigger !== 'undefined') { initReveals(); initSprockets(); }
    initCardParallax();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
