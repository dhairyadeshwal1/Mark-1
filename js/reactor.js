/* =====================================================================
   MARK I — Arc Reactor (Three.js)
   Original geometry: core, ten copper-wrapped coils, housing rings,
   HUD tick ring, dashed arcs and drifting particles under bloom.
   ===================================================================== */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const canvas = document.getElementById('reactor');
const hero = canvas && canvas.closest('.hero');
const fail = () => window.dispatchEvent(new CustomEvent('reactor:fail'));

if (!canvas || !hero || !window.WebGLRenderingContext) {
  fail();
} else {
  try {
    init();
  } catch (err) {
    console.warn('[reactor] WebGL unavailable, using CSS fallback.', err);
    fail();
  }
}

function init() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const narrow = () => window.innerWidth < 900;

  /* ---------- renderer / scene / camera ---------- */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setClearColor(0x07070a, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 60);
  camera.position.set(0, 0, 7.2);

  const reactor = new THREE.Group();
  scene.add(reactor);

  /* ---------- materials ---------- */
  const metal = new THREE.MeshStandardMaterial({ color: 0x1f2229, metalness: 0.92, roughness: 0.34 });
  const metalLight = new THREE.MeshStandardMaterial({ color: 0x4b515e, metalness: 0.9, roughness: 0.3 });
  const copper = new THREE.MeshStandardMaterial({ color: 0xb8702f, metalness: 0.85, roughness: 0.38 });
  const coreMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.85, 1.7, 1.9) });
  const rimMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.2, 1.05, 1.3) });
  const backGlowMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.02, 0.22, 0.32), transparent: true, opacity: 0.85 });
  const tickMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.12, 0.62, 0.78) });
  const arcMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.1, 0.55, 0.7), transparent: true, opacity: 0.8, side: THREE.DoubleSide });

  /* ---------- core ---------- */
  const core = new THREE.Mesh(new THREE.CircleGeometry(0.36, 72), coreMat);
  core.position.z = 0.06;
  reactor.add(core);

  const rim = new THREE.Mesh(new THREE.RingGeometry(0.37, 0.45, 72), rimMat);
  rim.position.z = 0.05;
  reactor.add(rim);

  // three rotating inner shards (adds motion inside the core ring)
  const shards = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const shard = new THREE.Mesh(new THREE.RingGeometry(0.47, 0.5, 40, 1, (i / 3) * Math.PI * 2, Math.PI * 0.42), arcMat);
    shards.add(shard);
  }
  shards.position.z = 0.04;
  reactor.add(shards);

  const backGlow = new THREE.Mesh(new THREE.RingGeometry(0.52, 1.0, 72), backGlowMat);
  backGlow.position.z = -0.14;
  reactor.add(backGlow);

  /* ---------- housing rings ---------- */
  const innerHousing = new THREE.Mesh(new THREE.TorusGeometry(0.53, 0.035, 12, 96), metalLight);
  reactor.add(innerHousing);

  const outerHousing = new THREE.Mesh(new THREE.TorusGeometry(1.08, 0.075, 16, 120), metal);
  reactor.add(outerHousing);

  // bolts on the outer housing
  const bolts = new THREE.Group();
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.04, 12), metalLight);
    bolt.rotation.x = Math.PI / 2;
    bolt.position.set(Math.cos(a) * 1.08, Math.sin(a) * 1.08, 0.09);
    bolts.add(bolt);
  }
  reactor.add(bolts);

  /* ---------- ten copper-wrapped coils ---------- */
  const coils = new THREE.Group();
  const coilBody = new THREE.BoxGeometry(0.42, 0.2, 0.18);
  const wrap = new THREE.TorusGeometry(0.135, 0.014, 8, 28);
  for (let i = 0; i < 10; i++) {
    const g = new THREE.Group();
    g.rotation.z = (i / 10) * Math.PI * 2;
    const body = new THREE.Mesh(coilBody, metal);
    body.position.x = 0.78;
    g.add(body);
    for (let k = 0; k < 4; k++) {
      const t = new THREE.Mesh(wrap, copper);
      t.rotation.y = Math.PI / 2;
      t.position.x = 0.78 - 0.15 + k * 0.1;
      g.add(t);
    }
    coils.add(g);
  }
  reactor.add(coils);

  /* ---------- HUD tick ring ---------- */
  const ticks = new THREE.Group();
  const tickSmall = new THREE.BoxGeometry(0.018, 0.05, 0.01);
  const tickLarge = new THREE.BoxGeometry(0.022, 0.13, 0.01);
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    const mesh = new THREE.Mesh(i % 6 === 0 ? tickLarge : tickSmall, tickMat);
    mesh.position.set(Math.cos(a) * 1.3, Math.sin(a) * 1.3, 0);
    mesh.rotation.z = a + Math.PI / 2;
    ticks.add(mesh);
  }
  reactor.add(ticks);

  /* ---------- dashed outer arcs ---------- */
  const arcs = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const arc = new THREE.Mesh(new THREE.RingGeometry(1.5, 1.52, 48, 1, (i / 3) * Math.PI * 2, Math.PI * 0.5), arcMat);
    arcs.add(arc);
  }
  const arcs2 = new THREE.Group();
  for (let i = 0; i < 2; i++) {
    const arc = new THREE.Mesh(new THREE.RingGeometry(1.62, 1.625, 64, 1, (i / 2) * Math.PI * 2, Math.PI * 0.8), arcMat);
    arcs2.add(arc);
  }
  reactor.add(arcs, arcs2);

  /* ---------- particles ---------- */
  const COUNT = 420;
  const positions = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    const r = 1.4 + Math.random() * 2.2;
    const a = Math.random() * Math.PI * 2;
    positions[i * 3] = Math.cos(a) * r;
    positions[i * 3 + 1] = Math.sin(a) * r * 0.85;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 2.4;
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particles = new THREE.Points(particleGeo, new THREE.PointsMaterial({
    color: 0x5ee7ff, size: 0.028, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  }));
  reactor.add(particles);

  /* ---------- lights ---------- */
  const coreLight = new THREE.PointLight(0x5ee7ff, 6, 9, 2);
  coreLight.position.set(0, 0, 0.7);
  reactor.add(coreLight);
  const keyLight = new THREE.DirectionalLight(0xffe0b0, 2.2);
  keyLight.position.set(3, 4, 5);
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0x5ee7ff, 0.8);
  fillLight.position.set(-4, -2, 3);
  scene.add(fillLight);
  scene.add(new THREE.AmbientLight(0x3a3f4d, 0.7));

  /* ---------- post-processing ---------- */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.55, 0.45, 0.62);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  /* ---------- layout ---------- */
  const layout = () => {
    const w = hero.clientWidth || window.innerWidth;
    const h = hero.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    bloom.setSize(Math.round(w * 0.5), Math.round(h * 0.5));
    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    const halfH = camera.position.z * Math.tan((camera.fov * Math.PI) / 360);
    const halfW = halfH * camera.aspect;
    if (narrow()) {
      // Phones and tablets: pin the reactor near the top of the hero, sized by the
      // viewport, and tell CSS where its bottom edge is so the copy starts below it.
      const vh = window.innerHeight;
      const pxPerUnit = h / (2 * halfH);
      const radiusPx = Math.min(w * 0.42, vh * 0.22, 230);
      const centerPx = Math.min(radiusPx * 1.35, vh * 0.32);
      reactor.scale.setScalar(radiusPx / pxPerUnit / 1.65);
      reactor.position.set(0, halfH - centerPx / pxPerUnit, 0);
      hero.style.setProperty('--reactor-bottom', `${Math.round(centerPx + radiusPx)}px`);
    } else {
      const s = Math.min(1.05, (halfH * 0.92) / 1.65);
      reactor.scale.setScalar(s);
      reactor.position.set(halfW * 0.4, 0, 0);
      hero.style.removeProperty('--reactor-bottom');
    }
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

  // easter egg: three taps on the reactor
  let taps = 0, tapTimer;
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
      g.to(bloom, { strength: 1.6, duration: 0.55, yoyo: true, repeat: 1, ease: 'power2.inOut' });
      g.to(coreMat.color, { r: 2.4, g: 0.9, b: 0.3, duration: 0.55, yoyo: true, repeat: 1, ease: 'power2.inOut' });
      g.to(rimMat.color, { r: 1.8, g: 0.6, b: 0.2, duration: 0.55, yoyo: true, repeat: 1, ease: 'power2.inOut' });
      g.to(backGlowMat.color, { r: 0.45, g: 0.12, b: 0.02, duration: 0.55, yoyo: true, repeat: 1, ease: 'power2.inOut' });
      g.to(coreLight.color, { r: 1, g: 0.55, b: 0.2, duration: 0.55, yoyo: true, repeat: 1, ease: 'power2.inOut' });
      g.to(coreLight, { intensity: 18, duration: 0.55, yoyo: true, repeat: 1, ease: 'power2.inOut' });
      g.fromTo(reactor.scale, { x: reactor.scale.x, y: reactor.scale.y, z: reactor.scale.z },
        { x: reactor.scale.x * 1.06, y: reactor.scale.y * 1.06, z: reactor.scale.z * 1.06, duration: 0.3, yoyo: true, repeat: 3, ease: 'power1.inOut' });
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
    const speed = reduced ? 0.15 : 1 + state.boost + state.overload;

    coils.rotation.z += dt * 0.22 * speed;
    ticks.rotation.z -= dt * 0.12 * speed;
    arcs.rotation.z += dt * 0.35 * speed;
    arcs2.rotation.z -= dt * 0.2 * speed;
    shards.rotation.z -= dt * 0.9 * speed;
    bolts.rotation.z += dt * 0.05 * speed;
    particles.rotation.z += dt * 0.03 * speed;

    const pulse = 1 + Math.sin(t * 2.6) * 0.035 + (state.overload > 0.1 ? Math.sin(t * 30) * 0.02 : 0);
    core.scale.setScalar(pulse);
    rim.scale.setScalar(1 + Math.sin(t * 2.6 + 0.6) * 0.02);
    if (!overloading) coreLight.intensity = 6 + Math.sin(t * 2.6) * 0.9;

    const idleX = Math.cos(t * 0.35) * 0.08;
    const idleY = Math.sin(t * 0.45) * 0.14;
    const targetX = reduced ? idleX : idleX + mouse.y * 0.32;
    const targetY = reduced ? idleY : idleY + mouse.x * 0.42;
    reactor.rotation.x = lerp(reactor.rotation.x, targetX, 0.045);
    reactor.rotation.y = lerp(reactor.rotation.y, targetY, 0.045);

    composer.render();
  }
  frame();

  // Debug handle used by the QA harness; harmless in production.
  window.__mk1 = { renderer, scene, camera, composer, reactor, bloom, state };
  hero.classList.add('has-webgl');
  window.dispatchEvent(new CustomEvent('reactor:ready'));
}
