/* =====================================================================
   MARK I — interaction layer
   Boot sequence · smooth scroll · reveals · HUD · cursor · forms
   ===================================================================== */
(() => {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  const isNarrow = () => window.matchMedia('(max-width: 900px)').matches;
  const hasGSAP = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ------------------------------------------------------------------
     Smooth scroll (Lenis) wired into GSAP's ticker
  ------------------------------------------------------------------ */
  let lenis = null;
  if (!prefersReduced && hasGSAP && typeof Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 0.95 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  const scrollTo = (target) => {
    if (target === '#top') {
      if (lenis) lenis.scrollTo(0, { duration: 1.4 });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = $(target);
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: -72, duration: 1.4 });
    else el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /* ------------------------------------------------------------------
     Film grain: a 160px noise tile rasterised once (cheap to composite)
  ------------------------------------------------------------------ */
  (() => {
    const noiseEl = $('.noise');
    if (!noiseEl || prefersReduced) return;
    try {
      const size = 160;
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const ctx = c.getContext('2d');
      const img = ctx.createImageData(size, size);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = (Math.random() * 255) | 0;
        d[i] = d[i + 1] = d[i + 2] = v;
        d[i + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
      noiseEl.style.backgroundImage = `url(${c.toDataURL('image/png')})`;
    } catch (_) { noiseEl.remove(); }
  })();

  /* ------------------------------------------------------------------
     Toast
  ------------------------------------------------------------------ */
  const toastEl = $('#toast');
  let toastTimer;
  const toast = (html, ms = 3600) => {
    if (!toastEl) return;
    toastEl.innerHTML = html;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), ms);
  };

  /* ------------------------------------------------------------------
     Mobile menu
  ------------------------------------------------------------------ */
  const burger = $('#burger');
  const menu = $('#menu');
  const setMenu = (open) => {
    if (!menu || !burger) return;
    menu.classList.toggle('is-open', open);
    burger.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('menu-open', open);
    if (lenis) open ? lenis.stop() : lenis.start();
  };
  burger && burger.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* ------------------------------------------------------------------
     Anchor navigation
  ------------------------------------------------------------------ */
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2 || !$(id)) return;
      e.preventDefault();
      setMenu(false);
      // let the menu's clip-path close before moving
      setTimeout(() => scrollTo(id), menu && menu.classList.contains('is-open') ? 250 : 0);
    });
  });

  /* ------------------------------------------------------------------
     Initial states for intro animation (only when GSAP is available,
     so the page stays readable if a CDN fails)
  ------------------------------------------------------------------ */
  if (hasGSAP) {
    gsap.set('.char', { yPercent: 110 });
    gsap.set('[data-hero]', { opacity: 0, y: 28 });
    gsap.set('.nav', { opacity: 0, y: -12 });
  }

  /* ------------------------------------------------------------------
     Boot sequence — J.A.R.V.I.S. suit initialization
  ------------------------------------------------------------------ */
  const boot = $('#boot');
  const HUD = window.MK1;
  const seenBoot = (() => { try { return sessionStorage.getItem('mk1-boot') === '1'; } catch (_) { return false; } })();
  let bootDone = false;
  let stopBootFx = null;

  const heroIntro = () => {
    if (!hasGSAP) { window.dispatchEvent(new CustomEvent('mk1:booted')); return; }
    const canvasOpacity = isNarrow() ? 0.7 : 1;
    const tl = gsap.timeline({
      defaults: { ease: 'power4.out' },
      onComplete: () => window.dispatchEvent(new CustomEvent('mk1:booted')),
    });
    tl.to('.hero__canvas', { opacity: canvasOpacity, duration: 1.8, ease: 'power2.out' }, 0)
      .to('.char', {
        yPercent: 0, duration: 1.2, stagger: 0.07,
        onComplete: () => { const t = $('.hero__title'); t && t.classList.add('is-in'); },
      }, 0.1)
      .to('.nav', { opacity: 1, y: 0, duration: 0.9 }, 0.4)
      .to('[data-hero]', { opacity: 1, y: 0, duration: 1, stagger: 0.09 }, 0.5)
      .to('.hud', { opacity: 1, duration: 0.9, stagger: 0.08 }, 0.9)
      .to('.hero__hud', { opacity: 1, duration: 1.4, ease: 'power2.out' }, 0.7);
  };

  const finishBoot = (fast) => {
    if (bootDone) return;
    bootDone = true;
    try { sessionStorage.setItem('mk1-boot', '1'); } catch (_) { /* ignore */ }
    if (lenis) lenis.start();
    if (!boot) { heroIntro(); return; }
    if (!hasGSAP) { boot.remove(); heroIntro(); return; }
    if (HUD && HUD.audio.enabled) HUD.audio.confirm();
    const d = fast ? 0.6 : 1;
    boot.classList.add('is-locked');
    const tl = gsap.timeline({ onComplete: () => { boot.remove(); if (stopBootFx) stopBootFx(); } });
    tl.to('.boot__flash', { opacity: 0.92, duration: 0.14, ease: 'power2.in' }, 0.28 * d)
      .to('.boot__flash', { opacity: 0, duration: 0.6, ease: 'power2.out' })
      .to('.boot__stage', { opacity: 0, scale: 1.14, duration: 0.55 * d, ease: 'power3.in' }, 0.32 * d)
      .to('.boot__corner', { opacity: 0, duration: 0.3 }, 0.5 * d)
      .to('.boot__visor--top', { yPercent: -100, duration: 1 * d, ease: 'power4.inOut', onStart: heroIntro }, 0.62 * d)
      .to('.boot__visor--bottom', { yPercent: 100, duration: 1 * d, ease: 'power4.inOut' }, 0.62 * d);
  };

  const runBoot = () => {
    if (!boot) { heroIntro(); return; }
    if (!hasGSAP || !HUD) { boot.remove(); heroIntro(); return; }
    if (lenis) lenis.stop();
    window.scrollTo(0, 0);

    const quick = seenBoot;
    const dur = quick ? 1.4 : 4.4;

    // Ring assembly
    const rings = $('#boot-rings');
    rings && HUD.buildRings(rings, [
      { type: 'circle', r: 206, w: 1, opacity: 0.22 },
      { type: 'ticks', r: 192, n: 120, len: 6, w: 1, every: 10, spin: 'cw', speed: 90 },
      { type: 'arcs', r: 174, segs: 4, gap: 16, w: 2, spin: 'ccw', speed: 45 },
      { type: 'ticks', r: 152, n: 48, len: 8, w: 1.2, every: 6, spin: 'cw', speed: 70 },
      { type: 'circle', r: 136, w: 1, dash: '2 7', opacity: 0.55, spin: 'ccw', speed: 160 },
      { type: 'progress', r: 120, w: 3, id: 'boot-ring-fill' },
      { type: 'arcs', r: 102, segs: 3, gap: 42, w: 4, spin: 'cw', speed: 9, cls: 'ring--bright' },
      { type: 'circle', r: 80, w: 1, dash: '1 5', opacity: 0.5, spin: 'ccw', speed: 36 },
      { type: 'brackets', r: 64, size: 14, w: 2, cls: 'ring--brackets' },
    ]);
    const ringFill = $('#boot-ring-fill');
    const ringLen = ringFill ? parseFloat(ringFill.dataset.len) : 0;

    // Hex memory map
    const hexmap = $('#boot-hexmap');
    const cells = [];
    if (hexmap) { for (let i = 0; i < 96; i++) { const c = document.createElement('i'); hexmap.appendChild(c); cells.push(c); } }
    const order = cells.map((_, i) => i).sort(() => Math.random() - 0.5);
    const memEl = $('#boot-mem');

    // Voice pattern
    const waveEl = $('#boot-wave');
    let amp = 0.2;
    const stopWave = waveEl ? HUD.wave(waveEl, () => amp) : () => {};

    const pct = $('#boot-pct');
    const phase = $('#boot-phase');
    const logEl = $('#boot-log');
    const sysCount = $('#boot-sys-count');
    const gauges = $$('#boot-gauges li');
    const t0 = performance.now();
    const stamp = () => {
      const ms = performance.now() - t0;
      const mm = String(Math.floor(ms / 60000)).padStart(2, '0');
      const ss = String(Math.floor(ms / 1000) % 60).padStart(2, '0');
      const cs = String(Math.floor(ms / 10) % 100).padStart(2, '0');
      return `${mm}:${ss}.${cs}`;
    };

    const LOG = [
      ['SYS', 'Stark OS 9.2.1 kernel loaded'],
      ['PWR', 'Arc reactor output nominal at 3.0 GJ/s'],
      ['NET', 'Uplink established: Bennett University, Greater Noida'],
      ['SYS', 'Calibrating repulsor drivers and flight stabilizers'],
      ['SEC', 'Recruit clearance verified. Welcome to the initiative'],
      ['AI', 'J.A.R.V.I.S. online. Good evening, recruit'],
    ];
    const addLog = (k, m) => {
      if (!logEl) return;
      const li = document.createElement('li');
      li.innerHTML = `<span class="t">${stamp()}</span><span class="k">[${k}]</span><span class="m"></span>`;
      logEl.appendChild(li);
      const mEl = li.querySelector('.m');
      HUD.type(mEl, m, { cps: 110, instant: quick, onChar: () => HUD.audio.tick() }).then(() => li.classList.add('ok'));
    };

    const counter = { v: 0 };
    // J.A.R.V.I.S. materializes in the core as the sequence progresses
    const orbEl = $('#boot-orb');
    const stopOrb = orbEl ? HUD.orb(orbEl, { radius: 0.235, dot: 1.25, get: () => ({ alpha: Math.max(0.1, counter.v / 100), speed: 1 + counter.v / 50 }) }) : () => {};
    stopBootFx = () => { stopWave(); stopOrb(); };
    const mem = { n: 0 };
    let done = 0;
    const tl = gsap.timeline({ onComplete: () => finishBoot(false) });

    // percent + progress ring + phases
    tl.to(counter, {
      v: 100, duration: dur * 0.9, ease: 'power1.inOut',
      onUpdate: () => {
        const v = Math.round(counter.v);
        if (pct) pct.textContent = String(v).padStart(2, '0');
        if (ringFill) ringFill.style.strokeDashoffset = String(ringLen * (1 - v / 100));
        if (phase) phase.textContent = v < 30 ? 'INITIALIZING' : v < 62 ? 'CALIBRATING' : v < 96 ? 'SYNCING' : 'ONLINE';
      },
    }, 0);
    // log lines
    LOG.forEach((entry, i) => tl.call(addLog, entry, 0.15 + (i / LOG.length) * dur * 0.7));
    // gauges
    gauges.forEach((li, i) => {
      const target = [100, 100, 98, 100, 100, 97][i] || 100;
      const o = { v: 0 };
      tl.to(o, {
        v: target, duration: dur * 0.3, ease: 'power2.out',
        onUpdate: () => {
          const b = li.querySelector('b');
          const em = li.querySelector('em');
          if (b) b.style.width = `${o.v}%`;
          if (em) em.textContent = `${Math.round(o.v)}%`;
        },
        onComplete: () => { li.classList.add('ok'); done += 1; if (sysCount) sysCount.textContent = `${done}/${gauges.length}`; },
      }, 0.3 + i * (dur * 0.1));
    });
    // memory map
    tl.to(mem, {
      n: cells.length, duration: dur * 0.8, ease: 'none',
      onUpdate: () => {
        const n = Math.floor(mem.n);
        for (let k = 0; k < n; k++) cells[order[k]].classList.add('on');
        if (memEl) memEl.textContent = `${n} / ${cells.length}`;
      },
    }, 0.2);
    // voice line
    const quoteEl = $('#boot-quote');
    tl.call(() => {
      amp = 1;
      if (quoteEl) {
        HUD.type(quoteEl, 'Good evening. All systems are nominal. Shall we build something that flies?', { cps: 55, instant: quick, onChar: () => HUD.audio.tick() })
          .then(() => { amp = 0.25; });
      }
    }, [], dur * 0.5);
    tl.to({}, { duration: 0.35 });

    if (HUD.audio.enabled) HUD.audio.sweep();

    const skip = () => { if (bootDone) return; tl.kill(); finishBoot(true); };
    const skipBtn = $('#boot-skip');
    skipBtn && skipBtn.addEventListener('click', skip);
    const onKey = (e) => { if (e.key === 'Escape') { skip(); document.removeEventListener('keydown', onKey); } };
    document.addEventListener('keydown', onKey);
  };

  runBoot();

  /* ------------------------------------------------------------------
     HUD clock + countdown
  ------------------------------------------------------------------ */
  const hudClock = $('#hud-clock');
  const pad = (n) => String(n).padStart(2, '0');
  const tickClock = () => {
    if (!hudClock) return;
    const d = new Date();
    hudClock.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };
  tickClock();
  setInterval(tickClock, 1000);

  const EVENT_START = new Date('2026-11-14T10:00:00+05:30').getTime();
  const cd = {
    days: $('[data-cd="days"]'), hours: $('[data-cd="hours"]'),
    mins: $('[data-cd="mins"]'), secs: $('[data-cd="secs"]'),
  };
  const tickCountdown = () => {
    if (!cd.days) return;
    let diff = Math.max(0, EVENT_START - Date.now());
    if (diff === 0) {
      const label = $('.countdown__label');
      if (label) label.textContent = 'LIVE NOW';
    }
    const days = Math.floor(diff / 86400000); diff -= days * 86400000;
    const hours = Math.floor(diff / 3600000); diff -= hours * 3600000;
    const mins = Math.floor(diff / 60000); diff -= mins * 60000;
    const secs = Math.floor(diff / 1000);
    const set = (el, v) => { const s = pad(v); if (el.textContent !== s) el.textContent = s; };
    set(cd.days, days); set(cd.hours, hours); set(cd.mins, mins); set(cd.secs, secs);
  };
  tickCountdown();
  setInterval(tickCountdown, 1000);

  /* ------------------------------------------------------------------
     Nav: hide on scroll down, glass when scrolled, active section
  ------------------------------------------------------------------ */
  const nav = $('#nav');
  let lastY = 0;
  const onScroll = (y) => {
    if (!nav) return;
    nav.classList.toggle('is-scrolled', y > 40);
    const goingDown = y > lastY && y > 160;
    nav.classList.toggle('is-hidden', goingDown && !document.body.classList.contains('menu-open'));
    lastY = y;
  };
  if (lenis) lenis.on('scroll', ({ scroll }) => onScroll(scroll));
  else window.addEventListener('scroll', () => onScroll(window.scrollY), { passive: true });

  /* ------------------------------------------------------------------
     Scroll-driven motion (GSAP + ScrollTrigger)
  ------------------------------------------------------------------ */
  if (hasGSAP) {
    // progress bar
    gsap.to('#progress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

    // active nav link
    $$('[data-nav]').forEach((link) => {
      const section = $(`#${link.dataset.nav}`);
      if (!section) return;
      ScrollTrigger.create({
        trigger: section, start: 'top 45%', end: 'bottom 45%',
        onToggle: (self) => link.classList.toggle('is-active', self.isActive),
      });
    });

    // hero parallax
    if (!prefersReduced) {
      gsap.to('.hero__inner', { y: 140, opacity: 0.2, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to(['.hero__canvas', '.hero__hud'], { y: 90, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to('.hud', { opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: '20% top', end: '60% top', scrub: true } });
    }

    // word splitting for display headings
    const splitWords = (el) => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach((node) => {
        const parts = node.textContent.split(/(\s+)/);
        const frag = document.createDocumentFragment();
        parts.forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          const span = document.createElement('span');
          span.className = 'word';
          span.textContent = part;
          frag.appendChild(span);
        });
        node.parentNode.replaceChild(frag, node);
      });
      return $$('.word', el);
    };

    // generic reveals
    $$('[data-reveal]').forEach((el) => {
      if (el.dataset.reveal === 'words') {
        const words = splitWords(el);
        gsap.from(words, {
          opacity: 0, yPercent: 60, rotateX: -40, transformOrigin: '50% 100%',
          duration: 1.1, ease: 'power4.out', stagger: 0.045,
          scrollTrigger: {
            trigger: el, start: 'top 88%', once: true,
            onEnter: () => { el.classList.add('glitch'); setTimeout(() => el.classList.remove('glitch'), 700); },
          },
        });
      } else {
        gsap.from(el, {
          opacity: 0, y: 44, duration: 1.1, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        });
      }
    });

    // counters
    $$('[data-count]').forEach((el) => {
      const end = Number(el.dataset.count) || 0;
      const suffix = el.dataset.suffix || '';
      ScrollTrigger.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter: () => {
          const o = { v: 0 };
          gsap.to(o, { v: end, duration: 1.9, ease: 'power2.out', onUpdate: () => { el.textContent = Math.round(o.v) + suffix; } });
        },
      });
    });

    // timeline: charging line + active dots
    if ($('#tl')) {
      gsap.to('#tl-fill', {
        scaleY: 1, ease: 'none',
        scrollTrigger: { trigger: '#tl', start: 'top 55%', end: 'bottom 55%', scrub: 0.4 },
      });
      $$('[data-tl]').forEach((item) => {
        ScrollTrigger.create({
          trigger: item, start: 'top 55%',
          onEnter: () => item.classList.add('is-active'),
          onLeaveBack: () => item.classList.remove('is-active'),
        });
        gsap.from(item, {
          opacity: 0, x: -24, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: item, start: 'top 90%', once: true },
        });
      });
    }

    // keep triggers accurate once web fonts settle
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
    window.addEventListener('load', () => ScrollTrigger.refresh());
  }

  /* ------------------------------------------------------------------
     Pointer-driven effects (desktop only)
  ------------------------------------------------------------------ */
  if (!isTouch) {
    // 3D tilt + spotlight
    $$('[data-tilt]').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        card.style.setProperty('--ry', `${((x - 0.5) * 9).toFixed(2)}deg`);
        card.style.setProperty('--rx', `${((0.5 - y) * 9).toFixed(2)}deg`);
        card.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
        card.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
      });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });

    // magnetic buttons
    if (hasGSAP && !prefersReduced) {
      $$('.magnetic').forEach((btn) => {
        btn.addEventListener('pointermove', (e) => {
          const r = btn.getBoundingClientRect();
          const dx = e.clientX - (r.left + r.width / 2);
          const dy = e.clientY - (r.top + r.height / 2);
          gsap.to(btn, { x: dx * 0.28, y: dy * 0.28, duration: 0.5, ease: 'power3.out' });
        });
        btn.addEventListener('pointerleave', () => {
          gsap.to(btn, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.45)' });
        });
      });
    }

    // custom cursor
    if (!prefersReduced) {
      const cursor = $('#cursor');
      const dot = $('.cursor__dot', cursor);
      const ring = $('.cursor__ring', cursor);
      const label = $('#cursor-label');
      if (cursor && dot && ring) {
        document.body.classList.add('has-cursor');
        let tx = window.innerWidth / 2, ty = window.innerHeight / 2;
        let dx = tx, dy = ty, rx = tx, ry = ty;
        let visible = false;

        window.addEventListener('pointermove', (e) => {
          tx = e.clientX; ty = e.clientY;
          if (!visible) { visible = true; cursor.style.opacity = '1'; }
        });
        document.addEventListener('mouseleave', () => { visible = false; cursor.style.opacity = '0'; });
        window.addEventListener('pointerdown', () => cursor.classList.add('is-down'));
        window.addEventListener('pointerup', () => cursor.classList.remove('is-down'));

        const HOVER = 'a, button, [data-cursor], input, select, .check, .faq__q';
        document.addEventListener('pointerover', (e) => {
          const t = e.target.closest(HOVER);
          if (!t) return;
          cursor.classList.add('is-hover');
          label.textContent = t.dataset.cursor || '';
        });
        document.addEventListener('pointerout', (e) => {
          const t = e.target.closest(HOVER);
          if (t && !(e.relatedTarget && t.contains(e.relatedTarget))) {
            cursor.classList.remove('is-hover');
            label.textContent = '';
          }
        });

        const loop = () => {
          dx += (tx - dx) * 0.55; dy += (ty - dy) * 0.55;
          rx += (tx - rx) * 0.18; ry += (ty - ry) * 0.18;
          dot.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
          ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
          label.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
        };
        if (hasGSAP) gsap.ticker.add(loop);
        else (function raf() { loop(); requestAnimationFrame(raf); })();
        cursor.style.opacity = '0';
        cursor.style.transition = 'opacity 0.3s';
      }
    }
  }

  /* ------------------------------------------------------------------
     FAQ accordion
  ------------------------------------------------------------------ */
  const faqItems = $$('.faq__item');
  faqItems.forEach((item) => {
    const q = $('.faq__q', item);
    if (!q) return;
    q.addEventListener('click', () => {
      const willOpen = !item.classList.contains('is-open');
      faqItems.forEach((other) => {
        other.classList.remove('is-open');
        $('.faq__q', other).setAttribute('aria-expanded', 'false');
      });
      if (willOpen) {
        item.classList.add('is-open');
        q.setAttribute('aria-expanded', 'true');
      }
      if (hasGSAP) setTimeout(() => ScrollTrigger.refresh(), 550);
    });
  });

  /* ------------------------------------------------------------------
     Registration form (client-side demo; see README for hooking a backend)
  ------------------------------------------------------------------ */
  const form = $('#reg-form');
  if (form) {
    const submitBtn = $('#submit-btn');
    const fields = $$('.field', form);

    const validateField = (field) => {
      const input = $('input, select', field);
      if (!input) return true;
      const valid = input.checkValidity();
      field.classList.toggle('is-invalid', !valid);
      return valid;
    };

    fields.forEach((field) => {
      const input = $('input, select', field);
      input && input.addEventListener('input', () => { if (field.classList.contains('is-invalid')) validateField(field); });
      input && input.addEventListener('change', () => { if (field.classList.contains('is-invalid')) validateField(field); });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const allValid = fields.map(validateField).every(Boolean);
      if (!allValid) {
        if (hasGSAP && !prefersReduced) gsap.fromTo(form, { x: -7 }, { x: 7, duration: 0.06, repeat: 5, yoyo: true, clearProps: 'x' });
        const first = $('.field.is-invalid input, .field.is-invalid select', form);
        first && first.focus();
        return;
      }

      submitBtn.classList.add('is-loading');
      const data = Object.fromEntries(new FormData(form).entries());

      // Simulated transmission. Replace with fetch() to your endpoint (Formspree, Google Apps Script, Supabase...).
      setTimeout(() => {
        submitBtn.classList.remove('is-loading');
        const firstName = (data.captain || 'recruit').trim().split(/\s+/)[0];
        const id = 'MK1-' + Array.from({ length: 4 }, () => '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(Math.random() * 32)]).join('');
        $('#success-name').textContent = firstName;
        $('#success-id').textContent = id;
        form.classList.add('is-success');
        try { localStorage.setItem('mk1-registration', JSON.stringify({ ...data, id, at: Date.now() })); } catch (_) { /* ignore */ }
        toast(`<b>Registration logged.</b> Recruit ID ${id}`);
      }, 1500);
    });

    const resetBtn = $('#reset-btn');
    resetBtn && resetBtn.addEventListener('click', () => {
      form.reset();
      fields.forEach((f) => f.classList.remove('is-invalid'));
      form.classList.remove('is-success');
      const first = $('#team');
      first && first.focus();
    });
  }

  /* ------------------------------------------------------------------
     Reactor events (from reactor.js)
  ------------------------------------------------------------------ */
  window.addEventListener('reactor:overload', () => {
    toast('<b>J.A.R.V.I.S.:</b> Core output at 400%. Sir, I would advise against that.', 4200);
  });
  window.addEventListener('reactor:fail', () => {
    const hero = $('.hero');
    hero && hero.classList.add('no-webgl');
  });
})();
