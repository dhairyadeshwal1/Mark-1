/* =====================================================================
   MARK I — J.A.R.V.I.S. core (Three.js)
   A golden holographic consciousness after the Age of Ultron look:
   a hot amber core, layered point shells, streaks between nodes,
   clustered orbital bands, thin great-circle rings and drifting dust,
   all additive under bloom. Tilts toward the cursor, spins up on
   scroll, overloads on three taps.
   ===================================================================== */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const canvas = document.getElementById('jarvis-core');
const hero = canvas && canvas.closest('.core-view'); // the panel viewport the sphere fills
const fail = () => window.dispatchEvent(new CustomEvent('reactor:fail'));
const EDGE = 1.3; // visual radius of the sphere in world units

if (!canvas || !hero || !window.WebGLRenderingContext) {
  fail();
} else {
  try {
    init();
  } catch (err) {
    console.warn('[jarvis] WebGL unavailable, using CSS fallback.', err);
    fail();
  }
}

/** Soft round sprite so points glow instead of rendering as squares. */
function dotTexture() {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.22, 'rgba(255,255,255,0.85)');
  g.addColorStop(0.55, 'rgba(255,255,255,0.2)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function init() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const narrow = () => window.innerWidth < 900;

  /* ---------- renderer / scene / camera ---------- */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setClearColor(0x05080d, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 60);
  camera.position.set(0, 0, 7.2);

  const jarvis = new THREE.Group(); // cursor tilt
  const spin = new THREE.Group(); // self rotation
  jarvis.add(spin);
  scene.add(jarvis);

  /* ---------- palette (HDR amber, tone-mapped later) ---------- */
  const AMBER = { core: [2.0, 1.3, 0.55], mid: [1.7, 0.95, 0.3], edge: [1.35, 0.55, 0.14] };
  const tint = new THREE.Color(1, 1, 1);
  const mats = [];
  const sprite = dotTexture();

  const track = (m) => { m.userData.base = m.color.clone(); mats.push(m); return m; };
  const pointsMat = (size, opacity) => {
    const m = track(new THREE.PointsMaterial({
      size, map: sprite, vertexColors: true, transparent: true, opacity,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    }));
    m.userData.baseSize = size; // point sizes are rescaled with the sphere in layout()
    return m;
  };
  const rnd = (a, b) => a + Math.random() * (b - a);
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const onSphere = (r) => {
    const u = Math.random() * 2 - 1;
    const ph = Math.random() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    return [r * s * Math.cos(ph), r * u, r * s * Math.sin(ph)];
  };
  const fib = (i, n, r) => {
    const y = 1 - (i / (n - 1)) * 2;
    const s = Math.sqrt(1 - y * y);
    const th = Math.PI * (3 - Math.sqrt(5)) * i;
    return [Math.cos(th) * s * r, y * r, Math.sin(th) * s * r];
  };
  const cloud = (count, gen, size, opacity) => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const p = gen(i);
      pos[i * 3] = p[0]; pos[i * 3 + 1] = p[1]; pos[i * 3 + 2] = p[2];
      col[i * 3] = p[3][0]; col[i * 3 + 1] = p[3][1]; col[i * 3 + 2] = p[3][2];
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return new THREE.Points(g, pointsMat(size, opacity));
  };

  /* ---------- 1. hot core ---------- */
  const core = cloud(1700, () => {
    const r = 0.46 * Math.pow(Math.random(), 0.72);
    const p = onSphere(r);
    return [p[0], p[1], p[2], mix(AMBER.core, AMBER.mid, r / 0.46)];
  }, 0.058, 0.95);

  /* ---------- 2. inner shell ---------- */
  const inner = cloud(1000, (i) => {
    const p = fib(i, 1000, 0.74);
    const j = 0.025;
    return [p[0] + rnd(-j, j), p[1] + rnd(-j, j), p[2] + rnd(-j, j), AMBER.mid];
  }, 0.034, 0.7);

  /* ---------- 3. outer shell ---------- */
  const SHELL_N = 3400;
  const shellPos = [];
  const shell = cloud(SHELL_N, (i) => {
    const p = fib(i, SHELL_N, 1.0);
    const j = 0.04;
    const q = [p[0] + rnd(-j, j), p[1] + rnd(-j, j), p[2] + rnd(-j, j)];
    shellPos.push(q);
    return [q[0], q[1], q[2], mix(AMBER.mid, AMBER.edge, Math.random())];
  }, 0.04, 0.85);

  /* ---------- 4. streaks between neighbouring nodes ---------- */
  {
    const segs = [];
    let made = 0;
    for (let k = 0; k < 12000 && made < 800; k++) {
      const a = shellPos[(Math.random() * SHELL_N) | 0];
      const b = shellPos[(Math.random() * SHELL_N) | 0];
      const dx = a[0] - b[0]; const dy = a[1] - b[1]; const dz = a[2] - b[2];
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (d > 0.08 && d < 0.3) { segs.push(a[0], a[1], a[2], b[0], b[1], b[2]); made += 1; }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(segs, 3));
    const m = track(new THREE.LineBasicMaterial({ color: new THREE.Color(1.2, 0.62, 0.18), transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false }));
    spin.add(new THREE.LineSegments(g, m));
  }
  spin.add(core, inner, shell);

  /* ---------- 5. clustered orbital bands on tilted pivots ---------- */
  const bands = [];
  [[1.06, 0.55, 0.2, 0.42], [1.14, -0.4, 1.0, -0.3], [1.22, 1.1, -0.5, 0.26], [1.3, -0.9, 0.35, -0.2], [1.18, 0.2, 2.1, 0.5]]
    .forEach(([r, tx, tz, speed], bi) => {
      const pivot = new THREE.Group();
      pivot.rotation.set(tx, 0, tz);
      const pts = cloud(560, () => {
        const seg = (Math.random() * 6) | 0;
        const a = seg * (Math.PI / 3) + Math.random() * (Math.PI / 3) * (0.5 + 0.5 * Math.abs(Math.sin(seg * 1.7 + bi)));
        const rr = r + rnd(-0.015, 0.015);
        return [Math.cos(a) * rr, rnd(-0.012, 0.012), Math.sin(a) * rr, bi % 2 ? AMBER.edge : AMBER.mid];
      }, 0.03, 0.8);
      pivot.add(pts);
      spin.add(pivot);
      bands.push({ pivot, speed });
    });

  /* ---------- 6. thin great-circle rings ---------- */
  const ringMat = track(new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 0.8, 0.25), transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
  const rings = [];
  [[1.1, 0.4, 0.9, 0.35], [1.24, -1.0, 0.2, -0.22], [1.02, 1.3, 1.9, 0.5]].forEach(([r, tx, tz, speed]) => {
    const g = new THREE.Group();
    g.rotation.set(tx, 0, tz);
    const mesh = new THREE.Mesh(new THREE.TorusGeometry(r, 0.0045, 6, 220), ringMat);
    mesh.rotation.x = Math.PI / 2;
    g.add(mesh);
    spin.add(g);
    rings.push({ g, speed });
  });

  /* ---------- 7. dust ---------- */
  const dust = cloud(520, () => {
    const p = onSphere(rnd(1.4, 2.8));
    return [p[0], p[1], p[2], AMBER.edge];
  }, 0.028, 0.4);
  spin.add(dust);

  /* ---------- 8. halo ---------- */
  const haloMat = track(new THREE.SpriteMaterial({ map: sprite, color: new THREE.Color(1.0, 0.45, 0.12), transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false }));
  const halo = new THREE.Sprite(haloMat);
  halo.scale.setScalar(3.8);
  halo.position.z = -0.3;
  jarvis.add(halo);

  /* ---------- post-processing ---------- */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.7, 0.6, 0.38);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  /* ---------- layout ---------- */
  const layout = () => {
    const w = hero.clientWidth || window.innerWidth;
    const h = hero.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    // Half-resolution bloom is fine on large panels; small ones need full res or the glow turns blocky.
    const bloomScale = w < 900 ? 1 : 0.5;
    bloom.setSize(Math.round(w * bloomScale), Math.round(h * bloomScale));
    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    // Centre the sphere and fit it to the shorter side of the panel viewport.
    const halfH = camera.position.z * Math.tan((camera.fov * Math.PI) / 360);
    const halfW = halfH * camera.aspect;
    const s = (Math.min(halfW, halfH) * (narrow() ? 0.8 : 0.84)) / EDGE;
    jarvis.scale.setScalar(s);
    jarvis.position.set(0, 0, 0);
    // Point sprites do not scale with the group, so shrink them with the sphere
    // (1.2 is the desktop reference scale) to keep the node structure readable.
    const k = Math.max(0.35, jarvis.scale.x / 1.2);
    mats.forEach((m) => { if (m.userData.baseSize) m.size = m.userData.baseSize * k; });
  };
  layout();
  let resizeTimer;
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(layout, 120); });

  /* ---------- input ---------- */
  const mouse = { x: 0, y: 0 };
  window.addEventListener('pointermove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -((e.clientY / window.innerHeight) * 2 - 1);
  }, { passive: true });

  let lastScroll = window.scrollY;
  const state = { boost: 0, overload: 0 };
  window.addEventListener('scroll', () => {
    const delta = Math.abs(window.scrollY - lastScroll);
    lastScroll = window.scrollY;
    if (!reduced) state.boost = Math.min(state.boost + delta * 0.012, 5);
  }, { passive: true });

  // easter egg: three taps on the core
  let taps = 0;
  let tapTimer;
  let overloading = false;
  canvas.addEventListener('click', () => {
    taps += 1;
    clearTimeout(tapTimer);
    tapTimer = setTimeout(() => { taps = 0; }, 1400);
    if (taps >= 3) { taps = 0; overload(); }
  });

  const overload = () => {
    if (overloading) return;
    overloading = true;
    state.overload = 14;
    const g = window.gsap;
    if (g) {
      g.to(bloom, { strength: 2.1, duration: 0.55, yoyo: true, repeat: 1, ease: 'power2.inOut' });
      g.to(tint, { r: 1.9, g: 0.5, b: 0.45, duration: 0.55, yoyo: true, repeat: 1, ease: 'power2.inOut' });
      g.fromTo(spin.scale, { x: 1, y: 1, z: 1 }, { x: 1.08, y: 1.08, z: 1.08, duration: 0.3, yoyo: true, repeat: 3, ease: 'power1.inOut' });
    }
    window.dispatchEvent(new CustomEvent('reactor:overload'));
    setTimeout(() => { overloading = false; }, 2800);
  };

  /* ---------- render loop (paused when the hero is off-screen) ---------- */
  let visible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; }, { threshold: 0 }).observe(hero);
  }
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !rafId) { last = performance.now(); frame(); }
  });

  const lerp = (a, b, t) => a + (b - a) * t;
  let last = performance.now();
  let t = 0;
  let rafId = 0;

  function frame() {
    if (document.hidden) { rafId = 0; return; }
    rafId = requestAnimationFrame(frame);
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (!visible) return;
    t += dt;

    state.boost *= 0.94;
    state.overload *= 0.955;
    const speed = reduced ? 0.15 : 1 + state.boost * 0.6 + state.overload;

    spin.rotation.y += dt * 0.12 * speed;
    core.rotation.y -= dt * 0.22 * speed;
    core.rotation.x += dt * 0.07 * speed;
    inner.rotation.x += dt * 0.05 * speed;
    inner.rotation.y -= dt * 0.04 * speed;
    shell.rotation.z += dt * 0.03 * speed;
    bands.forEach((b) => { b.pivot.rotation.y += dt * b.speed * speed; });
    rings.forEach((r) => { r.g.rotation.y += dt * r.speed * speed; r.g.rotation.z += dt * r.speed * 0.15 * speed; });
    dust.rotation.y += dt * 0.02 * speed;

    const flicker = state.overload > 0.1 ? Math.sin(t * 40) * 0.03 : 0;
    const pulse = 1 + Math.sin(t * 1.7) * 0.018 + flicker;
    if (!overloading) spin.scale.setScalar(pulse);
    shell.material.opacity = 0.8 + Math.sin(t * 9.1) * 0.05 + Math.sin(t * 23.3) * 0.03;
    core.material.opacity = 0.9 + Math.sin(t * 3.1) * 0.06;
    mats.forEach((m) => m.color.copy(m.userData.base).multiply(tint));

    const idleX = Math.cos(t * 0.35) * 0.08;
    const idleY = Math.sin(t * 0.45) * 0.14;
    const targetX = reduced ? idleX : idleX + mouse.y * 0.32;
    const targetY = reduced ? idleY : idleY + mouse.x * 0.42;
    jarvis.rotation.x = lerp(jarvis.rotation.x, targetX, 0.045);
    jarvis.rotation.y = lerp(jarvis.rotation.y, targetY, 0.045);

    composer.render();
  }
  frame();

  // Debug handle used by the QA harness; harmless in production.
  window.__mk1 = { renderer, scene, camera, composer, reactor: jarvis, bloom, state };
  hero.classList.add('has-webgl');
  window.dispatchEvent(new CustomEvent('reactor:ready'));
}
