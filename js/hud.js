/* =====================================================================
   MARK I — HUD toolkit (loaded before main.js)
   SVG ring builder · waveform · typewriter · synthesized audio
   Exposed as window.MK1 so the boot sequence and the J.A.R.V.I.S. layer
   share one implementation.
   ===================================================================== */
(() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';

  const polar = (cx, cy, r, deg) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };

  const arcPath = (cx, cy, r, start, end) => {
    const [sx, sy] = polar(cx, cy, r, end);
    const [ex, ey] = polar(cx, cy, r, start);
    const large = end - start <= 180 ? 0 : 1;
    return `M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${r} ${r} 0 ${large} 0 ${ex.toFixed(2)} ${ey.toFixed(2)}`;
  };

  const make = (tag, attrs, parent) => {
    const n = document.createElementNS(NS, tag);
    Object.keys(attrs).forEach((k) => { if (attrs[k] !== '' && attrs[k] !== undefined) n.setAttribute(k, attrs[k]); });
    if (parent) parent.appendChild(n);
    return n;
  };

  /**
   * Build a layered HUD ring assembly inside an <svg viewBox="0 0 S S">.
   * Layer types: circle · ticks · arcs · progress · brackets · labels
   */
  function buildRings(svg, layers) {
    const vb = svg.viewBox.baseVal;
    const cx = vb.width / 2;
    const cy = vb.height / 2;
    layers.forEach((L) => {
      const cls = ['ring', L.cls || '', L.spin ? `ring--${L.spin}` : ''].join(' ').trim();
      const g = make('g', { class: cls, style: L.speed ? `animation-duration:${L.speed}s` : '' }, svg);
      g.style.transformOrigin = `${cx}px ${cy}px`;

      if (L.type === 'ticks') {
        for (let i = 0; i < L.n; i++) {
          const major = L.every && i % L.every === 0;
          const len = major ? L.len * 1.9 : L.len;
          const deg = (i / L.n) * 360;
          const [x1, y1] = polar(cx, cy, L.r, deg);
          const [x2, y2] = polar(cx, cy, L.r + len, deg);
          make('line', {
            x1: x1.toFixed(2), y1: y1.toFixed(2), x2: x2.toFixed(2), y2: y2.toFixed(2),
            'stroke-width': major ? L.w * 1.6 : L.w, opacity: major ? 1 : 0.55,
          }, g);
        }
      } else if (L.type === 'arcs') {
        const span = 360 / L.segs;
        for (let i = 0; i < L.segs; i++) {
          const s = i * span + L.gap / 2;
          make('path', { d: arcPath(cx, cy, L.r, s, s + span - L.gap), 'stroke-width': L.w, fill: 'none' }, g);
        }
      } else if (L.type === 'circle') {
        make('circle', {
          cx, cy, r: L.r, 'stroke-width': L.w, fill: L.fill || 'none',
          'stroke-dasharray': L.dash || '', opacity: L.opacity !== undefined ? L.opacity : 1,
        }, g);
      } else if (L.type === 'progress') {
        const len = (2 * Math.PI * L.r).toFixed(2);
        const c = make('circle', {
          cx, cy, r: L.r, 'stroke-width': L.w, fill: 'none', class: 'ring__progress', id: L.id || '',
          'stroke-linecap': 'round', 'stroke-dasharray': len, 'stroke-dashoffset': len,
        }, g);
        c.dataset.len = len;
        c.style.transformOrigin = `${cx}px ${cy}px`;
      } else if (L.type === 'brackets') {
        const d = L.r;
        const s = L.size;
        const corners = [
          [cx - d, cy - d, `M ${cx - d + s} ${cy - d} L ${cx - d} ${cy - d} L ${cx - d} ${cy - d + s}`],
          [cx + d, cy - d, `M ${cx + d - s} ${cy - d} L ${cx + d} ${cy - d} L ${cx + d} ${cy - d + s}`],
          [cx - d, cy + d, `M ${cx - d + s} ${cy + d} L ${cx - d} ${cy + d} L ${cx - d} ${cy + d - s}`],
          [cx + d, cy + d, `M ${cx + d - s} ${cy + d} L ${cx + d} ${cy + d} L ${cx + d} ${cy + d - s}`],
        ];
        corners.forEach(([x, y, d2]) => {
          const p = make('path', { d: d2, 'stroke-width': L.w, fill: 'none', class: 'ring__bracket' }, g);
          p.style.transformOrigin = `${x}px ${y}px`;
        });
      } else if (L.type === 'labels') {
        L.items.forEach((txt, i) => {
          const deg = L.start + i * (360 / L.items.length);
          const [x, y] = polar(cx, cy, L.r, deg);
          const t = make('text', { x: x.toFixed(2), y: y.toFixed(2), class: 'ring__label', 'text-anchor': 'middle', transform: `rotate(${deg} ${x.toFixed(2)} ${y.toFixed(2)})` }, g);
          t.textContent = txt;
        });
      }
    });
    return svg;
  }

  /** Animated voice-pattern waveform. getAmp() returns 0..1. Returns a stop() function. */
  function wave(canvas, getAmp, color = '127,227,255') {
    const ctx = canvas.getContext('2d');
    if (!ctx) return () => {};
    let t = 0;
    let running = true;
    const draw = () => {
      if (!running) return;
      requestAnimationFrame(draw);
      const amp = getAmp();
      t += 0.05 + amp * 0.12;
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      ctx.lineWidth = 1.4;
      for (let k = 0; k < 3; k++) {
        const jitter = amp > 0.5 ? 0.65 + Math.random() * 0.35 : 1;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${color},${(0.95 - k * 0.3).toFixed(2)})`;
        for (let x = 0; x <= W; x += 2) {
          const p = x / W;
          const env = Math.sin(p * Math.PI);
          const y = H / 2 + Math.sin(p * 16 + t * (1.4 + k * 0.5) + k * 1.7) * Math.cos(p * 5 - t * 0.6)
            * env * (H / 2 - 2) * (0.12 + amp * 0.88) * jitter;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    };
    draw();
    return () => { running = false; };
  }

  /**
   * 2D J.A.R.V.I.S. orb: a golden point sphere with core and tilted orbital
   * rings, drawn on a plain canvas so it is available before Three.js loads.
   * opts.get() returns { alpha: 0..1 (how materialized), speed: multiplier }.
   */
  function orb(canvas, opts = {}) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return () => {};
    const N = opts.points || 720;
    const golden = Math.PI * (3 - Math.sqrt(5));
    const pts = [];
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = golden * i;
      pts.push([Math.cos(th) * r + (Math.random() - 0.5) * 0.06, y + (Math.random() - 0.5) * 0.06, Math.sin(th) * r + (Math.random() - 0.5) * 0.06]);
    }
    const core = [];
    for (let i = 0; i < (opts.core || 240); i++) {
      const u = Math.random() * 2 - 1;
      const ph = Math.random() * Math.PI * 2;
      const r = 0.45 * Math.cbrt(Math.random());
      const s = Math.sqrt(1 - u * u);
      core.push([r * s * Math.cos(ph), r * u, r * s * Math.sin(ph)]);
    }
    const rings = [
      { r: 1.1, tx: 0.9, tz: 0.3, speed: 0.9 },
      { r: 1.2, tx: -0.6, tz: 1.1, speed: -0.6 },
      { r: 1.3, tx: 0.2, tz: -0.8, speed: 0.45 },
    ];
    const RP = opts.ringPts || 150;
    let t = 0;
    let running = true;
    const rotate = (p, rY, rX) => {
      const x1 = p[0] * Math.cos(rY) + p[2] * Math.sin(rY);
      const z1 = -p[0] * Math.sin(rY) + p[2] * Math.cos(rY);
      const y1 = p[1] * Math.cos(rX) - z1 * Math.sin(rX);
      const z2 = p[1] * Math.sin(rX) + z1 * Math.cos(rX);
      return [x1, y1, z2];
    };
    const draw = () => {
      if (!running) return;
      requestAnimationFrame(draw);
      const g = opts.get ? opts.get() : { alpha: 1, speed: 1 };
      const alpha = Math.max(0, Math.min(1, g.alpha === undefined ? 1 : g.alpha));
      t += 0.016 * (g.speed || 1);
      const W = canvas.width;
      const H = canvas.height;
      const cx = W / 2;
      const cy = H / 2;
      const R = Math.min(W, H) * (opts.radius || 0.36);
      const DOT = opts.dot || 1;
      ctx.clearRect(0, 0, W, H);
      if (alpha <= 0.01) return;
      ctx.globalCompositeOperation = 'lighter';
      const rotY = t * 0.5;
      const rotX = 0.35 + Math.sin(t * 0.3) * 0.15;
      const dot = (p, size, a, green) => {
        const d = 1 / (1 + p[2] * 0.25);
        ctx.fillStyle = `rgba(255,${green},80,${a.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(cx + p[0] * R * d, cy + p[1] * R * d, size * d * DOT, 0, 6.2832);
        ctx.fill();
      };
      const visible = Math.floor(pts.length * alpha);
      for (let i = 0; i < visible; i++) {
        const p = rotate(pts[i], rotY, rotX);
        dot(p, R * 0.012, (0.32 + (p[2] + 1) * 0.28) * alpha, 170);
      }
      for (let i = 0; i < core.length; i++) {
        const p = rotate(core[i], -rotY * 0.7, rotX);
        dot(p, R * 0.016, 0.55 * alpha, 205);
      }
      rings.forEach((rg, k) => {
        for (let i = 0; i < RP; i++) {
          const a0 = (i / RP) * Math.PI * 2 + t * rg.speed;
          const p0 = [Math.cos(a0) * rg.r, 0, Math.sin(a0) * rg.r];
          const y1 = -p0[2] * Math.sin(rg.tx);
          const z1 = p0[2] * Math.cos(rg.tx);
          const x2 = p0[0] * Math.cos(rg.tz) - y1 * Math.sin(rg.tz);
          const y2 = p0[0] * Math.sin(rg.tz) + y1 * Math.cos(rg.tz);
          const p = rotate([x2, y2, z1], rotY * 0.2, rotX);
          const seg = Math.sin(a0 * 3 + k) > -0.2 ? 1 : 0.22;
          dot(p, R * 0.01, 0.5 * seg * alpha, 150);
        }
      });
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.95);
      grd.addColorStop(0, `rgba(255,190,90,${(0.32 * alpha).toFixed(3)})`);
      grd.addColorStop(1, 'rgba(255,140,40,0)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
    };
    draw();
    return () => { running = false; };
  }

  /** Typewriter. Resolves when done. */
  function type(el, text, opts = {}) {
    const cps = opts.cps || 45;
    const onChar = opts.onChar || null;
    return new Promise((resolve) => {
      let i = 0;
      el.textContent = '';
      if (opts.instant) { el.textContent = text; resolve(); return; }
      const step = () => {
        i += 1;
        el.textContent = text.slice(0, i);
        if (onChar) onChar(text[i - 1]);
        if (i < text.length) setTimeout(step, 1000 / cps + Math.random() * 22);
        else resolve();
      };
      step();
    });
  }

  /** Tiny synthesized sound set (no audio files). Disabled until the user opts in. */
  const audio = {
    ctx: null,
    enabled: false,
    init() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return false;
        this.ctx = new AC();
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return true;
    },
    tone(freq, dur, kind, gain, slide) {
      if (!this.enabled || !this.ctx) return;
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = kind || 'square';
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
      g.gain.setValueAtTime(gain || 0.03, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(this.ctx.destination);
      o.start(t);
      o.stop(t + dur + 0.02);
    },
    blip() { this.tone(1400, 0.05, 'square', 0.018); },
    tick() { this.tone(2400, 0.018, 'square', 0.01); },
    confirm() { this.tone(660, 0.14, 'sine', 0.05, 1320); },
    sweep() { this.tone(160, 1.3, 'sawtooth', 0.025, 1500); this.tone(55, 1.5, 'sine', 0.06, 220); },
    alarm() { this.tone(520, 0.3, 'square', 0.03, 240); },
    ping() { this.tone(1300, 0.14, 'sine', 0.045, 520); },
    chargeTick(level) { this.tone(240 + level * 1100, 0.07, 'square', 0.014 + level * 0.02); },
    discharge() { this.tone(1400, 0.45, 'sawtooth', 0.05, 90); this.tone(70, 0.6, 'sine', 0.08, 30); },
  };

  window.MK1 = { buildRings, arcPath, polar, wave, orb, type, audio };
})();
