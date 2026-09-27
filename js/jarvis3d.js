/* =====================================================================
   MARK I — J.A.R.V.I.S. core (Three.js)
   A golden holographic consciousness after the Age of Ultron look:
   a hot amber core, layered node shells, streaks between neighbours,
   clustered orbital bands, thin great-circle rings and drifting dust,
   all additive under bloom.

   Interaction (all on the canvas):
     hover   nodes light up under the cursor, he turns to face you
     drag    rotate with inertia (horizontal drags on touch, so the
             page still scrolls vertically)
     tap     ripple wave across the surface from the touch point
     hold    charge; release to discharge a pulse; hold on to overload
     ×3 tap  overload
     pinch / ctrl+wheel   zoom
   Emits `jarvis:interact` {kind} so the status line can answer, and
   listens for `jarvis:voice` to flicker the core while he speaks.
   ===================================================================== */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const canvas = document.getElementById('jarvis-core');
const view = canvas && canvas.closest('.core-view');
const fail = () => window.dispatchEvent(new CustomEvent('reactor:fail'));
const EDGE = 1.3; // visual radius of the sphere in world units
const BASE_Z = 7.2;

/* ---------- point shader: touch glow, ripples, charge, voice ---------- */
const VERT = /* glsl */ `
  attribute vec3 aColor;
  uniform float uTime, uTouchAmt, uCharge, uVoice, uSize, uPixelRatio, uScale, uTouchW, uChargeW;
  uniform vec3 uTouch;
  uniform vec4 uRipples[4];
  varying vec3 vColor;
  varying float vGlow;
  void main() {
    vec3 p = position;
    float r = length(p);
    vec3 nl = r > 1e-4 ? p / r : vec3(0.0, 0.0, 1.0);
    vec3 nw = normalize((modelMatrix * vec4(p, 1.0)).xyz);
    float glow = 0.0;

    // nodes near the cursor brighten and lift off the surface
    float d = distance(nw, normalize(uTouch));
    float prox = smoothstep(0.62, 0.04, d) * uTouchAmt * uTouchW;
    glow += prox;
    p += nl * prox * 0.11;

    // expanding wave from each tap / discharge point
    for (int i = 0; i < 4; i++) {
      float t0 = uRipples[i].w;
      if (t0 < 0.0) continue;
      float age = uTime - t0;
      if (age < 0.0 || age > 2.4) continue;
      float dd = distance(nw, normalize(uRipples[i].xyz));
      float front = age * 1.15;
      float w = exp(-pow((dd - front) * 5.5, 2.0)) * (1.0 - age / 2.4);
      glow += w * 1.1 * max(uTouchW, 0.5);
      p += nl * w * 0.15;
    }

    // charge: swell, jitter, brighten
    float jit = uCharge * 0.05 * sin(uTime * 37.0 + p.x * 41.0 + p.y * 23.0 + p.z * 17.0);
    p *= 1.0 + uCharge * 0.10 * uChargeW + jit;
    glow += uCharge * 0.42 * uChargeW;
    glow += uVoice * 0.35 * uChargeW;

    vColor = aColor;
    vGlow = glow;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = uSize * uPixelRatio * (1.0 + glow * 0.7) * (uScale / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;
const FRAG = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uOpacity;
  uniform vec3 uTint;
  varying vec3 vColor;
  varying float vGlow;
  void main() {
    float a = texture2D(uMap, gl_PointCoord).a;
    vec3 c = vColor * uTint * (1.0 + vGlow * 1.2) + vec3(1.0, 0.92, 0.75) * vGlow * 0.35;
    gl_FragColor = vec4(c, a * uOpacity);
  }
`;

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
  return new THREE.CanvasTexture(c);
}

function init() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const narrow = () => window.innerWidth < 900;
  const stateEl = document.getElementById('core-state');
  const hintEl = document.getElementById('core-hint');
  const audio = () => (window.MK1 && window.MK1.audio && window.MK1.audio.enabled ? window.MK1.audio : null);
  const emit = (kind, detail = {}) => window.dispatchEvent(new CustomEvent('jarvis:interact', { detail: { kind, ...detail } }));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------- renderer / scene / camera ---------- */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setClearColor(0x05080d, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 60);
  camera.position.set(0, 0, BASE_Z);
  let targetZ = BASE_Z;

  const jarvis = new THREE.Group(); // faces the cursor
  const spin = new THREE.Group(); // self rotation + drag
  jarvis.add(spin);
  scene.add(jarvis);

  /* ---------- palette and shared uniforms ---------- */
  const AMBER = { core: [2.0, 1.3, 0.55], mid: [1.7, 0.95, 0.3], edge: [1.35, 0.55, 0.14] };
  const tint = new THREE.Color(1, 1, 1);
  const ripples = Array.from({ length: 4 }, () => new THREE.Vector4(0, 0, 1, -1));
  const shared = {
    uTime: { value: 0 },
    uTouch: { value: new THREE.Vector3(0, 0, 1) },
    uTouchAmt: { value: 0 },
    uCharge: { value: 0 },
    uVoice: { value: 0 },
    uTint: { value: tint },
    uScale: { value: 300 },
    uPixelRatio: { value: renderer.getPixelRatio() },
    uRipples: { value: ripples },
    uMap: { value: dotTexture() },
  };
  const pointMats = [];
  const tintMats = [];
  const track = (m) => { m.userData.base = m.color.clone(); tintMats.push(m); return m; };
  const pointsMat = (size, opacity, touchW, chargeW) => {
    const m = new THREE.ShaderMaterial({
      uniforms: { ...shared, uSize: { value: size }, uOpacity: { value: opacity }, uTouchW: { value: touchW }, uChargeW: { value: chargeW } },
      vertexShader: VERT, fragmentShader: FRAG,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    m.userData.baseSize = size;
    pointMats.push(m);
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
  const cloud = (count, gen, size, opacity, touchW, chargeW) => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const p = gen(i);
      pos[i * 3] = p[0]; pos[i * 3 + 1] = p[1]; pos[i * 3 + 2] = p[2];
      col[i * 3] = p[3][0]; col[i * 3 + 1] = p[3][1]; col[i * 3 + 2] = p[3][2];
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
    return new THREE.Points(g, pointsMat(size, opacity, touchW, chargeW));
  };

  /* ---------- 1. hot core ---------- */
  const core = cloud(1700, () => {
    const r = 0.46 * Math.pow(Math.random(), 0.72);
    const p = onSphere(r);
    return [p[0], p[1], p[2], mix(AMBER.core, AMBER.mid, r / 0.46)];
  }, 0.058, 0.95, 0.3, 1.5);

  /* ---------- 2. inner shell ---------- */
  const inner = cloud(1000, (i) => {
    const p = fib(i, 1000, 0.74);
    const j = 0.025;
    return [p[0] + rnd(-j, j), p[1] + rnd(-j, j), p[2] + rnd(-j, j), AMBER.mid];
  }, 0.034, 0.7, 0.8, 0.9);

  /* ---------- 3. outer shell ---------- */
  const SHELL_N = 3400;
  const shellPos = [];
  const shell = cloud(SHELL_N, (i) => {
    const p = fib(i, SHELL_N, 1.0);
    const j = 0.04;
    const q = [p[0] + rnd(-j, j), p[1] + rnd(-j, j), p[2] + rnd(-j, j)];
    shellPos.push(q);
    return [q[0], q[1], q[2], mix(AMBER.mid, AMBER.edge, Math.random())];
  }, 0.04, 0.85, 1.0, 0.7);

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
      }, 0.03, 0.8, 0.7, 0.5);
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
  }, 0.028, 0.4, 0.25, 0.3);
  spin.add(dust);

  /* ---------- 8. halo ---------- */
  const haloMat = track(new THREE.SpriteMaterial({ map: shared.uMap.value, color: new THREE.Color(1.0, 0.45, 0.12), transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false }));
  const halo = new THREE.Sprite(haloMat);
  halo.scale.setScalar(3.8);
  halo.position.z = -0.3;
  jarvis.add(halo);

  /* ---------- post-processing ---------- */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const BLOOM_BASE = 0.7;
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), BLOOM_BASE, 0.6, 0.38);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  /* ---------- layout ---------- */
  const layout = () => {
    const w = view.clientWidth || window.innerWidth;
    const h = view.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    // Half-resolution bloom is fine on large panels; small ones need full res or the glow turns blocky.
    const bloomScale = w < 900 ? 1 : 0.5;
    bloom.setSize(Math.round(w * bloomScale), Math.round(h * bloomScale));
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    shared.uScale.value = h * 0.5;
    shared.uPixelRatio.value = renderer.getPixelRatio();

    // Centre the sphere and fit it to the shorter side of the panel viewport.
    const halfH = BASE_Z * Math.tan((camera.fov * Math.PI) / 360);
    const halfW = halfH * camera.aspect;
    const s = (Math.min(halfW, halfH) * (narrow() ? 0.8 : 0.84)) / EDGE;
    jarvis.scale.setScalar(s);
    jarvis.position.set(0, 0, 0);
    // Point sprites do not scale with the group, so shrink them with the sphere
    // (1.2 is the desktop reference scale) to keep the node structure readable.
    const k = Math.max(0.35, s / 1.2);
    pointMats.forEach((m) => { m.uniforms.uSize.value = m.userData.baseSize * k; });
  };
  layout();
  let resizeTimer;
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(layout, 120); });

  /* ---------- state ---------- */
  const state = { boost: 0, overload: 0, charge: 0, hover: 0 };
  const look = { x: 0, y: 0 }; // where he should face, -1..1
  let hoverTarget = 0;
  let hoverAmt = 0;
  let touchValid = false;
  let voiceTarget = 0;
  let voice = 0;
  let flash = 0;
  let t = 0;
  let rippleIdx = 0;
  const Y = new THREE.Vector3(0, 1, 0);
  const X = new THREE.Vector3(1, 0, 0);

  const addRipple = (dir) => {
    const r = ripples[rippleIdx++ % ripples.length];
    r.set(dir.x, dir.y, dir.z, t);
  };
  const hintOff = () => { hintEl && hintEl.classList.add('is-off'); };

  /* ---------- hit testing against the sphere ---------- */
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const hitSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1);
  const hitPt = new THREE.Vector3();
  const hitAt = (clientX, clientY) => {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -(((clientY - r.top) / r.height) * 2 - 1));
    raycaster.setFromCamera(ndc, camera);
    hitSphere.radius = jarvis.scale.x * 1.12;
    return raycaster.ray.intersectSphere(hitSphere, hitPt) ? hitPt.clone().normalize() : null;
  };
  const inCanvas = (clientX, clientY) => {
    const r = canvas.getBoundingClientRect();
    return clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom;
  };
  const updateHover = (e) => {
    const r = canvas.getBoundingClientRect();
    look.x = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1) * 0.9;
    look.y = clamp(-(((e.clientY - r.top) / r.height) * 2 - 1), -1, 1) * 0.9;
    const dir = hitAt(e.clientX, e.clientY);
    touchValid = !!dir;
    if (dir) shared.uTouch.value.copy(dir);
    hoverTarget = 1;
  };

  /* ---------- pointer: drag, tap, hold, pinch ---------- */
  const pointers = new Map();
  let pinch = null;
  let dragging = false;
  let moved = 0;
  let downAt = 0;
  let lastX = 0;
  let lastY = 0;
  let downDir = null;
  let velX = 0;
  let velY = 0;
  let spinSaidAt = -10;
  let taps = 0;
  let tapTimer;

  let charging = false;
  let chargeStart = 0;
  let charge = 0;
  let chargeTickAt = 0;
  let chargeDir = null;
  let chargeTimer;

  const startCharge = () => {
    charging = true;
    chargeStart = t;
    chargeDir = downDir || new THREE.Vector3(0, 0, 1);
    velX = velY = 0;
    hintOff();
    emit('charge');
  };
  const endCharge = (fire) => {
    if (!charging) return;
    charging = false;
    if (fire && charge > 0.2) {
      flash = 0.5 + charge * 0.9;
      addRipple(chargeDir);
      addRipple(chargeDir.clone().negate());
      velY += (Math.random() - 0.5) * 0.06 * charge;
      velX += (Math.random() - 0.5) * 0.03 * charge;
      const a = audio(); a && a.discharge();
      emit('discharge', { level: charge });
    }
  };
  const overload = () => {
    if (state.overload > 1) return;
    state.overload = 14;
    endCharge(false);
    window.dispatchEvent(new CustomEvent('reactor:overload'));
    emit('overload');
  };
  const tap = (dir) => {
    addRipple(dir || new THREE.Vector3(0, 0, 1));
    const a = audio(); a && a.ping();
    taps += 1;
    clearTimeout(tapTimer);
    tapTimer = setTimeout(() => { taps = 0; }, 1400);
    if (taps >= 3) { taps = 0; overload(); } else emit('ping');
  };

  const onDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    try { canvas.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, z: targetZ };
      dragging = false;
      clearTimeout(chargeTimer);
      endCharge(false);
      return;
    }
    dragging = true;
    view.classList.add('is-dragging');
    moved = 0;
    downAt = performance.now();
    lastX = e.clientX;
    lastY = e.clientY;
    velX = velY = 0;
    downDir = hitAt(e.clientX, e.clientY);
    updateHover(e);
    clearTimeout(chargeTimer);
    chargeTimer = setTimeout(() => { if (dragging && moved < 8 && !pinch) startCharge(); }, 380);
    emit('press');
  };
  const onMove = (e) => {
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      targetZ = clamp(pinch.z * (pinch.d / d), 4.6, 9.6);
      return;
    }
    updateHover(e);
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    moved += Math.abs(dx) + Math.abs(dy);
    lastX = e.clientX;
    lastY = e.clientY;
    if (charging) { if (moved > 40) endCharge(false); return; }
    if (moved > 8) { clearTimeout(chargeTimer); hintOff(); }
    const k = 0.0065;
    spin.rotateOnWorldAxis(Y, dx * k);
    spin.rotateOnWorldAxis(X, dy * k);
    velY = clamp(dx * k, -0.14, 0.14);
    velX = clamp(dy * k, -0.14, 0.14);
    if (Math.abs(dx) > 22 && t - spinSaidAt > 8) { spinSaidAt = t; emit('spin'); }
  };
  const onUp = (e) => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
    try { canvas.releasePointerCapture(e.pointerId); } catch (_) { /* ignore */ }
    clearTimeout(chargeTimer);
    const wasDragging = dragging;
    dragging = false;
    view.classList.remove('is-dragging');
    if (charging) endCharge(e.type === 'pointerup');
    else if (wasDragging && e.type === 'pointerup' && moved < 8 && performance.now() - downAt < 420) tap(downDir);
    if (!inCanvas(e.clientX, e.clientY)) { hoverTarget = 0; touchValid = false; }
  };
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  canvas.addEventListener('pointerleave', () => { if (!dragging) { hoverTarget = 0; touchValid = false; } });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  canvas.addEventListener('wheel', (e) => {
    if (!e.ctrlKey) return; // trackpad pinch arrives as ctrl+wheel; plain wheel keeps scrolling the page
    e.preventDefault();
    targetZ = clamp(targetZ + e.deltaY * 0.01, 4.6, 9.6);
  }, { passive: false });

  // He follows the cursor anywhere on the page, more strongly over his own panel.
  window.addEventListener('pointermove', (e) => {
    if (e.target === canvas || dragging) return;
    look.x = ((e.clientX / window.innerWidth) * 2 - 1) * 0.5;
    look.y = -((e.clientY / window.innerHeight) * 2 - 1) * 0.5;
  }, { passive: true });

  let lastScroll = window.scrollY;
  window.addEventListener('scroll', () => {
    const delta = Math.abs(window.scrollY - lastScroll);
    lastScroll = window.scrollY;
    if (!reduced) state.boost = Math.min(state.boost + delta * 0.012, 5);
  }, { passive: true });

  window.addEventListener('jarvis:overload', overload);
  window.addEventListener('jarvis:voice', (e) => { voiceTarget = e.detail && e.detail.on ? 1 : 0; });

  /* ---------- render loop (paused when the panel is off-screen) ---------- */
  let visible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; }, { threshold: 0 }).observe(view);
  }
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !rafId) { last = performance.now(); frame(); }
  });

  let last = performance.now();
  let rafId = 0;
  let stateText = '';
  const setState = (label, hot) => {
    if (!stateEl || label === stateText) return;
    stateText = label;
    stateEl.textContent = label;
    stateEl.classList.toggle('is-hot', !!hot);
  };

  function frame() {
    if (document.hidden) { rafId = 0; return; }
    rafId = requestAnimationFrame(frame);
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (!visible) return;
    t += dt;
    shared.uTime.value = t;

    // smoothed inputs
    hoverAmt += (hoverTarget - hoverAmt) * 0.08;
    voice += (voiceTarget - voice) * 0.1;
    flash *= 0.86;
    if (flash < 0.004) flash = 0;
    state.boost *= 0.94;
    state.overload *= 0.955;
    if (state.overload < 0.01) state.overload = 0;
    const ovl = Math.min(1, state.overload / 14);

    if (charging) {
      charge = Math.min(1, (t - chargeStart) / 1.6);
      if (t - chargeTickAt > 0.1) { chargeTickAt = t; const a = audio(); a && a.chargeTick(charge); }
      if (t - chargeStart > 3.2) overload();
    } else if (charge > 0.002) charge *= 0.85;
    else charge = 0;
    state.charge = charge;
    state.hover = hoverAmt;

    shared.uTouchAmt.value = hoverAmt * (touchValid ? 1 : 0);
    shared.uCharge.value = charge;
    shared.uVoice.value = voice * (0.55 + 0.45 * Math.sin(t * 16)) * (0.7 + 0.3 * Math.sin(t * 7.3));

    // colour and bloom respond to charge, discharge and overload
    tint.setRGB(
      Math.max(0, 1 + charge * 0.1 + flash * 0.35 + ovl * 0.7),
      Math.max(0, 1 + charge * 0.06 + flash * 0.3 - ovl * 0.45),
      Math.max(0, 1 + flash * 0.2 - ovl * 0.5),
    );
    tintMats.forEach((m) => m.color.copy(m.userData.base).multiply(tint));
    bloom.strength = BLOOM_BASE + charge * 0.4 + flash * 0.5 + ovl * 0.8;
    haloMat.opacity = 0.22 + hoverAmt * 0.06 + charge * 0.15 + flash * 0.15;
    halo.scale.setScalar(3.8 * (1 + hoverAmt * 0.06 + charge * 0.35 + ovl * 0.2));

    // motion
    const speed = reduced ? 0.15 : 1 + state.boost * 0.6 + state.overload + charge * 2.5 + hoverAmt * 0.35;
    if (!dragging && !charging) {
      velY *= 0.94; velX *= 0.94;
      if (Math.abs(velY) > 1e-4) spin.rotateOnWorldAxis(Y, velY);
      if (Math.abs(velX) > 1e-4) spin.rotateOnWorldAxis(X, velX);
    }
    spin.rotateOnWorldAxis(Y, dt * 0.12 * speed);
    core.rotation.y -= dt * 0.22 * speed;
    core.rotation.x += dt * 0.07 * speed;
    inner.rotation.x += dt * 0.05 * speed;
    inner.rotation.y -= dt * 0.04 * speed;
    shell.rotation.z += dt * 0.03 * speed;
    bands.forEach((b) => { b.pivot.rotation.y += dt * b.speed * speed; });
    rings.forEach((r) => { r.g.rotation.y += dt * r.speed * speed; r.g.rotation.z += dt * r.speed * 0.15 * speed; });
    dust.rotation.y += dt * 0.02 * speed;

    const flicker = state.overload > 0.1 ? Math.sin(t * 40) * 0.03 : 0;
    const pulse = 1 + Math.sin(t * 1.7) * 0.018 + flicker + (state.overload > 0.1 ? Math.sin(t * 22) * 0.04 : 0);
    spin.scale.setScalar(pulse * (1 + charge * 0.04));
    shell.material.uniforms.uOpacity.value = 0.8 + Math.sin(t * 9.1) * 0.05 + Math.sin(t * 23.3) * 0.03;
    core.material.uniforms.uOpacity.value = 0.9 + Math.sin(t * 3.1) * 0.06 + voice * 0.08 * Math.sin(t * 14);

    // he turns toward the cursor
    const idleX = Math.cos(t * 0.35) * 0.08;
    const idleY = Math.sin(t * 0.45) * 0.14;
    const lookW = 0.28 + hoverAmt * 0.2;
    const targetX = reduced ? idleX : idleX + look.y * lookW;
    const targetY = reduced ? idleY : idleY + look.x * lookW * 1.3;
    if (!dragging) {
      jarvis.rotation.x = lerp(jarvis.rotation.x, targetX, 0.05);
      jarvis.rotation.y = lerp(jarvis.rotation.y, targetY, 0.05);
    }
    camera.position.z += (targetZ - camera.position.z) * 0.12;

    // panel readout
    if (ovl > 0.05) setState('OVERLOAD', true);
    else if (flash > 0.05) setState('DISCHARGE', true);
    else if (charging) setState(`CHARGING ${Math.round(charge * 100)}%`, true);
    else if (dragging) setState('MANUAL', false);
    else if (hoverAmt > 0.3) setState('TRACKING', false);
    else if (voice > 0.3) setState('SPEAKING', false);
    else setState('IDLE', false);

    composer.render();
  }
  frame();

  // Debug handle used by the QA harness; harmless in production.
  window.__mk1 = { renderer, scene, camera, composer, reactor: jarvis, spin, bloom, state, overload, addRipple };
  view.classList.add('has-webgl');
  window.dispatchEvent(new CustomEvent('reactor:ready'));
}

/* ---------- bootstrap (last, so every const above is initialised) ---------- */
if (!canvas || !view || !window.WebGLRenderingContext) {
  fail();
} else {
  try {
    init();
  } catch (err) {
    console.warn('[jarvis] WebGL unavailable, using CSS fallback.', err);
    fail();
  }
}
