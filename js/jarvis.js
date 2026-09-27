/* =====================================================================
   MARK I — J.A.R.V.I.S. layer (loaded after main.js)
   Status line with orb · per-module commentary · command line ·
   telemetry drift · opt-in synthesized audio
   ===================================================================== */
(() => {
  'use strict';
  const HUD = window.MK1;
  if (!HUD) return;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  /* ---------- telemetry drift ---------- */
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
  setInterval(drift, 900);

  /* ---------- status line ---------- */
  const bar = $('#jarvis');
  const msgEl = $('#jarvis-msg');
  const orbEl = $('#jarvis-orb');
  let speaking = 0;
  if (orbEl) HUD.orb(orbEl, { points: 260, core: 100, ringPts: 70, radius: 0.42, dot: 2.4, get: () => ({ alpha: speaking ? 1 : 0.85, speed: speaking ? 3.2 : 1 }) });

  let current = '';
  let sayToken = 0;
  const say = (text) => {
    if (!msgEl || text === current) return;
    current = text;
    const token = ++sayToken;
    speaking = 1;
    HUD.type(msgEl, text, { cps: 60, onChar: () => HUD.audio.tick() }).then(() => { if (token === sayToken) speaking = 0; });
  };

  const LINES = {
    overview: 'Systems online. Welcome to the Mark I initiative, recruit.',
    briefing: 'Mission briefing loaded. One weekend, one prototype. Rather like the original.',
    systems: 'Four suit systems available. I would choose the one you can finish, sir.',
    log: 'Mission log synced. The clock starts at 11:00 and it does not stop.',
    rewards: 'Prize pool: one lakh rupees. I would strongly suggest registering.',
    allies: 'Allied organisations confirmed. Stark Industries sends its regards.',
    queries: 'Query database online. Press slash if you would rather ask me directly.',
    recruit: 'Recruit intake form ready. Shall we, sir?',
  };

  window.addEventListener('mk1:booted', () => { if (bar) bar.classList.add('is-on'); setTimeout(() => say(LINES.overview), 600); });
  setTimeout(() => { if (bar && !bar.classList.contains('is-on') && !document.getElementById('boot')) { bar.classList.add('is-on'); say(LINES.overview); } }, 9000);

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting && bar && bar.classList.contains('is-on')) say(LINES[en.target.id]); });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    Object.keys(LINES).forEach((id) => { const el = document.getElementById(id); el && io.observe(el); });
  }

  /* ---------- command line ---------- */
  const term = $('#term');
  const log = $('#term-log');
  const form = $('#term-form');
  const input = $('#term-input');
  const openBtn = $('#jarvis-open');
  const closeBtn = $('#term-close');
  const go = (id) => { const el = document.getElementById(id); el && el.scrollIntoView({ behavior: 'smooth', block: 'start' }); };

  const print = (text, who) => {
    if (!log) return Promise.resolve();
    const line = document.createElement('div');
    line.className = who === 'user' ? 'u' : 'j';
    log.appendChild(line);
    log.scrollTop = log.scrollHeight;
    if (who === 'user') { line.textContent = text; return Promise.resolve(); }
    speaking = 1;
    return HUD.type(line, text, { cps: 65, onChar: () => { HUD.audio.tick(); log.scrollTop = log.scrollHeight; } }).then(() => { speaking = 0; });
  };

  const COMMANDS = {
    help: () => print('Protocols: register · systems · log · prizes · queries · allies · date · venue · team · cost · overload · clear. Or simply ask.'),
    register: () => { go('recruit'); return print('Opening the recruit intake form. Do try to spell your team name correctly.'); },
    'suit up': () => COMMANDS.register(),
    systems: () => { go('systems'); return print('Four suit systems: J.A.R.V.I.S. (AI & ML), Repulsor (web & app), Arc Reactor (hardware & IoT), Nanotech (open innovation).'); },
    tracks: () => COMMANDS.systems(),
    log: () => { go('log'); return print('Check-in 09:00, hacking begins 11:00 Saturday, hands off keyboards 10:00 Sunday, ceremony 14:00.'); },
    timeline: () => COMMANDS.log(),
    schedule: () => COMMANDS.log(),
    prizes: () => { go('rewards'); return print('₹50,000 for the champion, ₹25,000 and ₹10,000 for runners-up, ₹3,750 per system winner. One lakh in total.'); },
    rewards: () => COMMANDS.prizes(),
    queries: () => { go('queries'); return print('Query database opened.'); },
    faq: () => COMMANDS.queries(),
    allies: () => { go('allies'); return print('Title partner: Stark Industries. Powered by GeeksforGeeks.'); },
    sponsors: () => COMMANDS.allies(),
    date: () => print('14 to 15 November 2026. Twenty-four hours. Bring a hoodie; the floor is cold at 4 AM.'),
    when: () => COMMANDS.date(),
    venue: () => print('Bennett University, Greater Noida. 28.4501° N, 77.5859° E.'),
    where: () => COMMANDS.venue(),
    team: () => print('Teams of two to four. Solo recruits are matched at check-in.'),
    cost: () => print('Free. Meals, caffeine and Wi-Fi included. Sleep is not.'),
    overload: () => {
      go('overview');
      setTimeout(() => { const c = document.getElementById('jarvis-core'); for (let i = 0; i < 3; i++) c && c.dispatchEvent(new MouseEvent('click', { bubbles: true })); }, 900);
      return print('Pushing my core to 400%. For the record, sir, I advised against this.');
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
    [/regist|sign ?up|join|apply|suit/, 'register'], [/track|system|theme|categor/, 'systems'],
    [/time|schedule|agenda|when|hour|log/, 'log'], [/priz|reward|win|cash|money/, 'prizes'],
    [/faq|question|quer/, 'queries'], [/sponsor|partner|all(y|ies)/, 'allies'], [/venue|where|location|place|campus/, 'venue'],
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
    HUD.audio.confirm();
    if (log && !log.children.length) print('Channel open. Type a protocol or ask a question. Type help to list protocols.');
    setTimeout(() => input && input.focus(), 100);
  };
  const closeTerm = () => {
    if (!term) return;
    term.classList.remove('is-open');
    term.setAttribute('aria-hidden', 'true');
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

  /* ---------- audio toggle (synthesized, opt-in, remembered) ---------- */
  const toggle = $('#audio-toggle');
  const paint = (on) => {
    if (!toggle) return;
    toggle.setAttribute('aria-pressed', String(on));
    toggle.classList.toggle('is-on', on);
    const icon = toggle.querySelector('i');
    if (icon) icon.className = on ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
  };
  const setAudio = (on, silent) => {
    HUD.audio.enabled = on;
    if (on && HUD.audio.init() && !silent) HUD.audio.confirm();
    paint(on);
    try { localStorage.setItem('mk1-audio', on ? '1' : '0'); } catch (_) { /* ignore */ }
  };
  let wanted = false;
  try { wanted = localStorage.getItem('mk1-audio') === '1'; } catch (_) { /* ignore */ }
  if (wanted) {
    const arm = () => { setAudio(true, true); window.removeEventListener('pointerdown', arm); window.removeEventListener('keydown', arm); };
    window.addEventListener('pointerdown', arm);
    window.addEventListener('keydown', arm);
    paint(true);
  }
  toggle && toggle.addEventListener('click', () => setAudio(!HUD.audio.enabled));
  if (!isTouch) {
    let last = 0;
    document.addEventListener('pointerover', (e) => {
      if (!HUD.audio.enabled || !e.target.closest('a, button, .faq__q, .list__row')) return;
      const now = performance.now();
      if (now - last < 90) return;
      last = now;
      HUD.audio.blip();
    });
  }
  window.addEventListener('reactor:overload', () => HUD.audio.alarm());
})();
