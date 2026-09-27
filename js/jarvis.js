/* =====================================================================
   MARK I — J.A.R.V.I.S. layer (loaded after main.js)
   Status bar with voice pattern · command line · hero targeting rings ·
   telemetry jitter · targeting brackets · synthesized audio toggle
   ===================================================================== */
(() => {
  'use strict';
  const HUD = window.MK1;
  if (!HUD) return;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const hasGSAP = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  /* ------------------------------------------------------------------
     Targeting brackets on every tilt card
  ------------------------------------------------------------------ */
  $$('[data-tilt]').forEach((card) => {
    const lock = document.createElement('span');
    lock.className = 'lock';
    lock.setAttribute('aria-hidden', 'true');
    lock.innerHTML = '<i></i><i></i><i></i><i></i><b>Target locked</b>';
    card.appendChild(lock);
  });

  /* ------------------------------------------------------------------
     Telemetry readouts that drift like live sensors
  ------------------------------------------------------------------ */
  const jitters = $$('[data-jit]');
  const drift = () => {
    jitters.forEach((el) => {
      const base = parseFloat(el.dataset.jit);
      const spread = parseFloat(el.dataset.spread || '0.4');
      const dec = parseInt(el.dataset.dec || '1', 10);
      el.textContent = (base + (Math.random() - 0.5) * spread).toFixed(dec) + (el.dataset.unit || '');
    });
  };
  drift();
  setInterval(drift, 720);

  /* ------------------------------------------------------------------
     Hero targeting rings around the reactor (2D HUD over the 3D core)
  ------------------------------------------------------------------ */
  const heroRings = $('#hero-rings');
  if (heroRings) {
    HUD.buildRings(heroRings, [
      // viewBox radius 210 == the 3D reactor's outer edge; everything here sits just outside it
      { type: 'circle', r: 228, w: 1, opacity: 0.22 },
      { type: 'ticks', r: 214, n: 96, len: 5, w: 1, every: 12, spin: 'cw', speed: 140 },
      { type: 'arcs', r: 238, segs: 3, gap: 44, w: 1.6, spin: 'ccw', speed: 55, cls: 'ring--soft' },
      { type: 'labels', r: 252, start: 45, items: ['MK-I', 'PWR', 'SYS', 'NAV'] },
      { type: 'brackets', r: 218, size: 18, w: 1.5, cls: 'ring--brackets ring--armed' },
    ]);
    const hud = $('#hero-hud');
    const inner = $('.hero__hud-inner', hud);
    if (hud && inner && !isTouch && !prefersReduced) {
      window.addEventListener('pointermove', (e) => {
        const x = e.clientX / window.innerWidth - 0.5;
        const y = e.clientY / window.innerHeight - 0.5;
        inner.style.transform = `rotateX(${(-y * 14).toFixed(2)}deg) rotateY(${(x * 18).toFixed(2)}deg)`;
      }, { passive: true });
    }
  }

  /* ------------------------------------------------------------------
     J.A.R.V.I.S. status bar
  ------------------------------------------------------------------ */
  const bar = $('#jarvis');
  const msgEl = $('#jarvis-msg');
  const waveEl = $('#jarvis-wave');
  let speaking = 0;
  if (waveEl) HUD.wave(waveEl, () => (speaking ? 1 : 0.16));

  let current = '';
  let sayToken = 0;
  const say = (text) => {
    if (!msgEl || text === current) return;
    current = text;
    const token = ++sayToken;
    speaking = 1;
    HUD.type(msgEl, text, { cps: 52, onChar: () => HUD.audio.tick() }).then(() => { if (token === sayToken) speaking = 0; });
  };

  const LINES = {
    top: 'Systems online. Welcome to the Mark I initiative, recruit.',
    briefing: 'Mission briefing loaded. One weekend, one prototype. Rather like the original.',
    tracks: 'Four suit systems available. I would choose the one you can finish, sir.',
    timeline: 'Mission log synced. The clock starts at 11:00 and it does not stop.',
    rewards: 'Prize pool: one lakh rupees. I would strongly suggest registering.',
    sponsors: 'Allied organisations confirmed. Stark Industries sends its regards.',
    faq: 'Query database online. Ask me anything. Press slash to open a channel.',
    register: 'Recruit intake form ready. Shall we, sir?',
  };

  window.addEventListener('mk1:booted', () => {
    if (bar) bar.classList.add('is-on');
    setTimeout(() => say(LINES.top), 900);
  });
  // If the boot was skipped or absent, still show the bar.
  setTimeout(() => { if (bar && !bar.classList.contains('is-on') && !document.getElementById('boot')) { bar.classList.add('is-on'); say(LINES.top); } }, 8000);

  if (hasGSAP) {
    Object.keys(LINES).forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      ScrollTrigger.create({
        trigger: el, start: 'top 50%', end: 'bottom 50%',
        onToggle: (self) => { if (self.isActive && bar && bar.classList.contains('is-on')) say(LINES[id]); },
      });
    });
  }

  /* ------------------------------------------------------------------
     J.A.R.V.I.S. command line
  ------------------------------------------------------------------ */
  const term = $('#term');
  const log = $('#term-log');
  const form = $('#term-form');
  const input = $('#term-input');
  const openBtn = $('#jarvis-open');
  const closeBtn = $('#term-close');
  const lenisScroll = (id) => { const a = document.querySelector(`.nav__links a[href="#${id}"]`) || document.querySelector(`a[href="#${id}"]`); a ? a.click() : document.getElementById(id) && document.getElementById(id).scrollIntoView({ behavior: 'smooth' }); };

  const print = (text, who) => {
    if (!log) return Promise.resolve();
    const line = document.createElement('div');
    line.className = who === 'user' ? 'u' : 'j';
    log.appendChild(line);
    log.scrollTop = log.scrollHeight;
    if (who === 'user') { line.textContent = text; return Promise.resolve(); }
    speaking = 1;
    return HUD.type(line, text, { cps: 60, onChar: () => { HUD.audio.tick(); log.scrollTop = log.scrollHeight; } }).then(() => { speaking = 0; });
  };

  const COMMANDS = {
    help: () => print('Protocols: register · tracks · timeline · prizes · faq · sponsors · date · venue · team · overload · clear. Or simply ask.'),
    register: () => { lenisScroll('register'); return print('Opening the recruit intake form. Do try to spell your team name correctly.'); },
    'suit up': () => COMMANDS.register(),
    tracks: () => { lenisScroll('tracks'); return print('Four suit systems: J.A.R.V.I.S. (AI & ML), Repulsor (Web & App), Arc Reactor (Hardware & IoT), Nanotech (Open Innovation).'); },
    systems: () => COMMANDS.tracks(),
    timeline: () => { lenisScroll('timeline'); return print('Check-in 09:00, hacking begins 11:00 Saturday, hands off keyboards 10:00 Sunday, ceremony 14:00.'); },
    schedule: () => COMMANDS.timeline(),
    prizes: () => { lenisScroll('rewards'); return print('₹50,000 for the champion, ₹25,000 and ₹10,000 for runners-up, ₹3,750 per track winner. One lakh in total.'); },
    rewards: () => COMMANDS.prizes(),
    faq: () => { lenisScroll('faq'); return print('Query database opened.'); },
    sponsors: () => { lenisScroll('sponsors'); return print('Title partner: Stark Industries. Powered by GeeksforGeeks.'); },
    date: () => print('14 to 15 November 2026. Twenty-four hours. Bring a hoodie; the floor is cold at 4 AM.'),
    when: () => COMMANDS.date(),
    venue: () => print('Bennett University, Greater Noida. 28.4501° N, 77.5859° E.'),
    where: () => COMMANDS.venue(),
    team: () => print('Teams of two to four. Solo recruits are matched at check-in.'),
    cost: () => print('Free. Meals, caffeine and Wi-Fi included. Sleep is not.'),
    overload: () => {
      const c = document.getElementById('reactor');
      lenisScroll('top');
      setTimeout(() => { for (let i = 0; i < 3; i++) c && c.dispatchEvent(new MouseEvent('click', { bubbles: true })); }, 900);
      return print('Pushing the reactor to 400%. For the record, sir, I advised against this.');
    },
    jarvis: () => print('At your service.'),
    hello: () => print('Good evening. How may I assist?'),
    hi: () => COMMANDS.hello(),
    hey: () => COMMANDS.hello(),
    thanks: () => print('Of course, sir.'),
    'thank you': () => COMMANDS.thanks(),
    clear: () => { if (log) log.innerHTML = ''; return Promise.resolve(); },
    exit: () => { closeTerm(); return Promise.resolve(); },
    close: () => COMMANDS.exit(),
  };

  const FUZZY = [
    [/regist|sign ?up|join|apply|suit/, 'register'], [/track|system|theme|categor/, 'tracks'],
    [/time|schedule|agenda|when|hour/, 'timeline'], [/priz|reward|win|cash|money/, 'prizes'],
    [/faq|question/, 'faq'], [/sponsor|partner/, 'sponsors'], [/venue|where|location|place|campus/, 'venue'],
    [/team|member|size|solo/, 'team'], [/cost|fee|price|free|pay/, 'cost'], [/overload|400|boom|explode/, 'overload'],
    [/hello|hi\b|hey|good (morning|evening)/, 'hello'], [/thank/, 'thanks'], [/help|what can/, 'help'],
  ];

  const run = (raw) => {
    const cmd = raw.trim().toLowerCase().replace(/[?.!]+$/, '');
    if (!cmd) return;
    print(raw.trim(), 'user');
    HUD.audio.blip();
    if (COMMANDS[cmd]) return COMMANDS[cmd]();
    const hit = FUZZY.find(([re]) => re.test(cmd));
    if (hit) return COMMANDS[hit[1]]();
    return print("I'm afraid I don't have that protocol, sir. Try 'help'.");
  };

  const openTerm = () => {
    if (!term) return;
    term.classList.add('is-open');
    term.setAttribute('aria-hidden', 'false');
    bar && bar.classList.add('is-hidden');
    HUD.audio.confirm();
    if (log && !log.children.length) print('Channel open. Type a protocol or ask a question. Type help to list protocols.');
    setTimeout(() => input && input.focus(), 120);
  };
  const closeTerm = () => {
    if (!term) return;
    term.classList.remove('is-open');
    term.setAttribute('aria-hidden', 'true');
    bar && bar.classList.remove('is-hidden');
    input && input.blur();
  };

  openBtn && openBtn.addEventListener('click', openTerm);
  closeBtn && closeBtn.addEventListener('click', closeTerm);
  form && form.addEventListener('submit', (e) => { e.preventDefault(); run(input.value); input.value = ''; });
  document.addEventListener('keydown', (e) => {
    const typing = /^(input|textarea|select)$/i.test(document.activeElement && document.activeElement.tagName);
    if (e.key === '/' && !typing) { e.preventDefault(); term && term.classList.contains('is-open') ? closeTerm() : openTerm(); }
    if (e.key === 'Escape' && term && term.classList.contains('is-open')) closeTerm();
  });

  /* ------------------------------------------------------------------
     Audio toggle (synthesized, opt-in, remembered)
  ------------------------------------------------------------------ */
  const toggle = $('#audio-toggle');
  const setAudio = (on, silent) => {
    HUD.audio.enabled = on;
    if (on && HUD.audio.init() && !silent) HUD.audio.confirm();
    if (toggle) {
      toggle.setAttribute('aria-pressed', String(on));
      toggle.classList.toggle('is-on', on);
      const icon = toggle.querySelector('i');
      if (icon) icon.className = on ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
    }
    try { localStorage.setItem('mk1-audio', on ? '1' : '0'); } catch (_) { /* ignore */ }
  };
  let wanted = false;
  try { wanted = localStorage.getItem('mk1-audio') === '1'; } catch (_) { /* ignore */ }
  if (wanted) {
    // Browsers need a gesture before sound; arm it on the first interaction.
    const arm = () => { setAudio(true, true); window.removeEventListener('pointerdown', arm); window.removeEventListener('keydown', arm); };
    window.addEventListener('pointerdown', arm);
    window.addEventListener('keydown', arm);
    if (toggle) { toggle.setAttribute('aria-pressed', 'true'); toggle.classList.add('is-on'); const icon = toggle.querySelector('i'); if (icon) icon.className = 'fa-solid fa-volume-high'; }
  }
  toggle && toggle.addEventListener('click', () => setAudio(!HUD.audio.enabled));

  if (!isTouch) {
    let last = 0;
    document.addEventListener('pointerover', (e) => {
      if (!HUD.audio.enabled) return;
      const t = e.target.closest('a, button, .faq__q, [data-tilt]');
      if (!t) return;
      const now = performance.now();
      if (now - last < 70) return;
      last = now;
      HUD.audio.blip();
    });
  }
  window.addEventListener('reactor:overload', () => HUD.audio.alarm());
})();
