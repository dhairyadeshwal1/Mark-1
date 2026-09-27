/* =====================================================================
   MARK I — terminal behaviour
   Boot sequence · navigation · clock and countdown · reveals · counters ·
   queries accordion · registration form · toast
   ===================================================================== */
(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof gsap !== 'undefined';
  const HUD = window.MK1;

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
     Mobile menu + anchors
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
  };
  burger && burger.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const el = id.length > 1 && $(id);
      if (!el) return;
      e.preventDefault();
      setMenu(false);
      el.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
    });
  });

  /* ------------------------------------------------------------------
     Boot sequence — J.A.R.V.I.S. suit initialization
  ------------------------------------------------------------------ */
  const boot = $('#boot');
  const seenBoot = (() => { try { return sessionStorage.getItem('mk1-boot') === '1'; } catch (_) { return false; } })();
  let bootDone = false;
  let stopBootFx = null;

  const bringUp = () => {
    $$('.module--overview [data-reveal]').forEach((el, i) => setTimeout(() => el.classList.add('is-in'), 120 + i * 140));
    setTimeout(() => window.dispatchEvent(new CustomEvent('mk1:booted')), 900);
  };

  const finishBoot = (fast) => {
    if (bootDone) return;
    bootDone = true;
    try { sessionStorage.setItem('mk1-boot', '1'); } catch (_) { /* ignore */ }
    if (!boot) { bringUp(); return; }
    if (!hasGSAP) { boot.remove(); bringUp(); return; }
    if (HUD && HUD.audio.enabled) HUD.audio.confirm();
    const d = fast ? 0.6 : 1;
    boot.classList.add('is-locked');
    const tl = gsap.timeline({ onComplete: () => { boot.remove(); if (stopBootFx) stopBootFx(); } });
    tl.to('.boot__flash', { opacity: 0.8, duration: 0.14, ease: 'power2.in' }, 0.28 * d)
      .to('.boot__flash', { opacity: 0, duration: 0.5, ease: 'power2.out' })
      .to('.boot__stage', { opacity: 0, duration: 0.45 * d, ease: 'power2.in' }, 0.32 * d)
      .to('.boot__visor--top', { yPercent: -100, duration: 0.9 * d, ease: 'power4.inOut', onStart: bringUp }, 0.6 * d)
      .to('.boot__visor--bottom', { yPercent: 100, duration: 0.9 * d, ease: 'power4.inOut' }, 0.6 * d);
  };

  const runBoot = () => {
    if (!boot) { bringUp(); return; }
    if (!hasGSAP || !HUD) { boot.remove(); bringUp(); return; }
    window.scrollTo(0, 0);
    const quick = seenBoot;
    const dur = quick ? 1.3 : 4.2;

    const rings = $('#boot-rings');
    rings && HUD.buildRings(rings, [
      { type: 'circle', r: 206, w: 1, opacity: 0.2 },
      { type: 'ticks', r: 192, n: 120, len: 6, w: 1, every: 10, spin: 'cw', speed: 90 },
      { type: 'arcs', r: 174, segs: 4, gap: 16, w: 1.5, spin: 'ccw', speed: 45 },
      { type: 'ticks', r: 152, n: 48, len: 8, w: 1.2, every: 6, spin: 'cw', speed: 70 },
      { type: 'progress', r: 122, w: 2.5, id: 'boot-ring-fill' },
      { type: 'arcs', r: 104, segs: 3, gap: 42, w: 3, spin: 'cw', speed: 9, cls: 'ring--bright' },
      { type: 'brackets', r: 64, size: 14, w: 2, cls: 'ring--brackets' },
    ]);
    const ringFill = $('#boot-ring-fill');
    const ringLen = ringFill ? parseFloat(ringFill.dataset.len) : 0;

    const pct = $('#boot-pct');
    const phase = $('#boot-phase');
    const logEl = $('#boot-log');
    const sysCount = $('#boot-sys-count');
    const gauges = $$('#boot-gauges li');
    const counter = { v: 0 };
    const orbEl = $('#boot-orb');
    const stopOrb = orbEl ? HUD.orb(orbEl, { radius: 0.235, dot: 1.25, get: () => ({ alpha: Math.max(0.1, counter.v / 100), speed: 1 + counter.v / 50 }) }) : () => {};
    stopBootFx = stopOrb;

    const t0 = performance.now();
    const stamp = () => {
      const ms = performance.now() - t0;
      const ss = String(Math.floor(ms / 1000) % 60).padStart(2, '0');
      const cs = String(Math.floor(ms / 10) % 100).padStart(2, '0');
      return `00:${ss}.${cs}`;
    };
    const LOG = [
      ['SYS', 'Stark OS 9.2.1 kernel loaded'],
      ['PWR', 'Arc reactor output nominal at 3.0 GJ/s'],
      ['NET', 'Uplink established: Bennett University, Greater Noida'],
      ['SYS', 'Calibrating repulsor drivers and flight stabilizers'],
      ['SEC', 'Recruit clearance verified'],
      ['AI', 'J.A.R.V.I.S. online. Good evening. Shall we build something that flies?'],
    ];
    const addLog = (k, m) => {
      if (!logEl) return;
      const li = document.createElement('li');
      li.innerHTML = `<span class="t">${stamp()}</span><span class="k">[${k}]</span><span class="m"></span>`;
      logEl.appendChild(li);
      HUD.type(li.querySelector('.m'), m, { cps: 110, instant: quick, onChar: () => HUD.audio.tick() }).then(() => li.classList.add('ok'));
    };

    let done = 0;
    const tl = gsap.timeline({ onComplete: () => finishBoot(false) });
    tl.to(counter, {
      v: 100, duration: dur * 0.9, ease: 'power1.inOut',
      onUpdate: () => {
        const v = Math.round(counter.v);
        if (pct) pct.textContent = String(v).padStart(2, '0');
        if (ringFill) ringFill.style.strokeDashoffset = String(ringLen * (1 - v / 100));
        if (phase) phase.textContent = v < 30 ? 'INITIALIZING' : v < 62 ? 'CALIBRATING' : v < 96 ? 'SYNCING' : 'ONLINE';
      },
    }, 0);
    LOG.forEach((entry, i) => tl.call(addLog, entry, 0.15 + (i / LOG.length) * dur * 0.72));
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
    tl.to({}, { duration: 0.35 });

    const skip = () => { if (bootDone) return; tl.kill(); finishBoot(true); };
    const skipBtn = $('#boot-skip');
    skipBtn && skipBtn.addEventListener('click', skip);
    const onKey = (e) => { if (e.key === 'Escape') { skip(); document.removeEventListener('keydown', onKey); } };
    document.addEventListener('keydown', onKey);
  };
  runBoot();

  /* ------------------------------------------------------------------
     Clock, session uptime, countdown
  ------------------------------------------------------------------ */
  const pad = (n) => String(n).padStart(2, '0');
  const clockEl = $('#hud-clock');
  const uptimeEl = $('#uptime');
  const sessionStart = Date.now();
  const tickClock = () => {
    const d = new Date();
    if (clockEl) clockEl.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    if (uptimeEl) {
      const s = Math.floor((Date.now() - sessionStart) / 1000);
      uptimeEl.textContent = `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
    }
  };
  tickClock();
  setInterval(tickClock, 1000);

  const EVENT_START = new Date('2026-11-14T10:00:00+05:30').getTime();
  const cd = { days: $('[data-cd="days"]'), hours: $('[data-cd="hours"]'), mins: $('[data-cd="mins"]'), secs: $('[data-cd="secs"]') };
  const tickCountdown = () => {
    if (!cd.days) return;
    let diff = Math.max(0, EVENT_START - Date.now());
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
     Active module in the top bar
  ------------------------------------------------------------------ */
  const navLinks = $$('[data-nav]');
  if ('IntersectionObserver' in window && navLinks.length) {
    const byId = new Map(navLinks.map((a) => [a.dataset.nav, a]));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        navLinks.forEach((a) => a.classList.remove('is-active'));
        const a = byId.get(en.target.id);
        a && a.classList.add('is-active');
      });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
    byId.forEach((_, id) => { const s = document.getElementById(id); s && io.observe(s); });
  }

  /* ------------------------------------------------------------------
     Reveals and counters
  ------------------------------------------------------------------ */
  const reveals = $$('[data-reveal]').filter((el) => !el.closest('.module--overview'));
  const counters = $$('[data-count]');
  const countUp = (el) => {
    const end = Number(el.dataset.count) || 0;
    const t0 = performance.now();
    const dur = 1400;
    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        if (en.target.hasAttribute('data-reveal')) en.target.classList.add('is-in');
        if (en.target.hasAttribute('data-count')) countUp(en.target);
        obs.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    reveals.forEach((el) => io.observe(el));
    counters.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-in'));
    counters.forEach((el) => { el.textContent = el.dataset.count; });
  }

  /* ------------------------------------------------------------------
     Queries accordion
  ------------------------------------------------------------------ */
  const faqItems = $$('.faq__item');
  faqItems.forEach((item) => {
    const q = $('.faq__q', item);
    if (!q) return;
    q.addEventListener('click', () => {
      const willOpen = !item.classList.contains('is-open');
      faqItems.forEach((other) => { other.classList.remove('is-open'); $('.faq__q', other).setAttribute('aria-expanded', 'false'); });
      if (willOpen) { item.classList.add('is-open'); q.setAttribute('aria-expanded', 'true'); }
    });
  });

  /* ------------------------------------------------------------------
     Registration form (client-side demo; see README for a real endpoint)
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
      ['input', 'change'].forEach((ev) => input && input.addEventListener(ev, () => { if (field.classList.contains('is-invalid')) validateField(field); }));
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const allValid = fields.map(validateField).every(Boolean);
      if (!allValid) {
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
      }, 1400);
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
     Core events (from jarvis3d.js)
  ------------------------------------------------------------------ */
  window.addEventListener('reactor:ready', () => { const v = $('.core-view'); v && v.classList.add('is-live'); });
  window.addEventListener('reactor:fail', () => { const v = $('.core-view'); v && v.classList.add('no-webgl'); });
  window.addEventListener('reactor:overload', () => toast('<b>J.A.R.V.I.S.:</b> Core output at 400%. Sir, I would advise against that.', 4200));
})();
