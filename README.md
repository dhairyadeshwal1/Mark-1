# MARK I — Build your first suit.

A Marvel-inspired event landing page for **MARK I**, a 24-hour hackathon by the
GeeksforGeeks Student Chapter, Bennett University. Built for the Junior Core
Technical Team Round 1 task (Marvel × Web Design).

**Live site:** _add your GitHub Pages URL here_

---

## Concept

Tony Stark built the Mark I in a cave, in a weekend, out of scraps. That is a
hackathon. The whole site leans on that one idea: **"Build your first suit."**

Instead of pasting Marvel posters onto a template, the page is designed as a
Stark Industries HUD. Every visual on the page is original: the 3D arc reactor is
modelled in Three.js, the HUD chrome is CSS and SVG, and the typography does the
cinematic work. Nothing is copyrighted Marvel artwork, which keeps the site
clean to publish and makes it feel crafted rather than collaged.

The event language carries the metaphor throughout:

| Section          | Framed as              |
| ---------------- | ---------------------- |
| Preloader        | J.A.R.V.I.S. boot sequence |
| About            | Mission Briefing       |
| Tracks           | Suit Systems (J.A.R.V.I.S., Repulsor, Arc Reactor, Nanotech) |
| Schedule         | Mission Log            |
| Prizes           | Rewards                |
| Sponsors         | Allied Organizations (fictional Marvel corporations) |
| FAQ              | Query Database         |
| Registration     | Recruitment: "Suit up." |

## What's interactive

- **J.A.R.V.I.S. suit-initialization boot**: a full-screen HUD with rotating
  tick rings, a gold progress ring, phase readouts, a timestamped system log
  typing in, six suit-system gauges, a voice-pattern waveform with a typed
  greeting and a hex memory map, ending in a targeting lock, a flash and a
  visor-split reveal. Shortened on repeat visits in the same session,
  skippable with ESC.
- **J.A.R.V.I.S. status bar** with a live voice waveform that comments on
  each section as you scroll.
- **J.A.R.V.I.S. command line** (press `/` or tap Talk): type `help`,
  `register`, `tracks`, `prizes`, `overload` or a plain question and get typed
  replies that also navigate the page.
- **Targeting HUD** around the reactor: rotating rings, corner brackets and
  live telemetry chips that drift like real sensors. Cards get snap-in
  targeting brackets on hover ("TARGET LOCKED") and headings glitch on reveal.
- **Optional synthesized audio** (nav toggle): hover blips, confirmation tones
  and an overload alarm generated with the Web Audio API, no sound files.
- **Live 3D arc reactor** (Three.js + Unreal bloom). Ten copper-wrapped coils,
  housing rings, HUD tick ring and drifting particles. It tilts toward the
  cursor, spins faster when you scroll, and pauses rendering when off-screen.
- **Easter egg:** tap the reactor three times to overload it.
- **Custom HUD cursor** with a lagging reticle ring and contextual labels
  (desktop only).
- **Lenis smooth scroll** wired into GSAP ScrollTrigger.
- **Scroll choreography:** hero parallax, word-by-word heading reveals,
  animated stat counters, a timeline whose line "charges" as you scroll and
  lights each milestone, nav that hides on scroll down.
- **Magnetic buttons**, 3D-tilting cards with spotlight and scan-line sweep,
  live countdown to the event, live HUD clock, marquee ticker.
- **Registration form** with inline validation, transmitting state, and a HUD
  success panel that issues a recruit ID.
- **Accessibility and fallbacks:** semantic HTML, keyboard focus states,
  `prefers-reduced-motion` support (smooth scroll off, animations instant,
  reactor idles), CSS-only reactor if WebGL is unavailable, readable without JS.
- **Fully responsive** from 360px phones to ultrawide desktops.

## Tech stack

- HTML5, CSS3 (custom properties, grid, `color-mix`, masks), vanilla JavaScript
- [GSAP 3.12](https://gsap.com/) + ScrollTrigger — animation and scroll choreography
- [Lenis 1.1](https://lenis.darkroom.engineering/) — smooth scrolling
- [Three.js r160](https://threejs.org/) — arc reactor, with `UnrealBloomPass`
- Web Audio API — opt-in synthesized HUD sounds, no audio files
- No build step. Open `index.html` or serve the folder.

## Project structure

```
.
├── index.html          # page structure and content
├── css/styles.css      # design system, components, responsive rules
├── css/hud.css         # J.A.R.V.I.S. layer: boot, rings, targeting, terminal
├── js/hud.js           # HUD toolkit: SVG ring builder, waveform, typewriter, synth audio
├── js/main.js          # boot sequence, scroll, reveals, cursor, forms
├── js/jarvis.js        # status bar, command line, telemetry, targeting brackets
├── js/reactor.js       # Three.js arc reactor (ES module)
├── assets/favicon.svg
└── docs/plans/         # design document
```

## Run locally

```bash
# any static server works
python -m http.server 5173
# then open http://127.0.0.1:5173
```

## Deploy to GitHub Pages

1. Push this folder to a GitHub repository (branch `main`).
2. Repository **Settings → Pages → Build and deployment**: Source = "Deploy from
   a branch", Branch = `main`, folder = `/ (root)`. Save.
3. The site goes live at `https://<username>.github.io/<repo>/` within a minute.
   All asset paths are relative, so it works from a sub-path.

## Hooking up real registrations

`js/main.js` simulates the submission. Replace the `setTimeout` block inside the
form submit handler with a `fetch()` to Formspree, Google Apps Script, Supabase
or your own endpoint; the `data` object already contains every field.

## Resources and assets used

| Resource | Use |
| --- | --- |
| Google Fonts: [Bebas Neue](https://fonts.google.com/specimen/Bebas+Neue), [Rajdhani](https://fonts.google.com/specimen/Rajdhani), [Inter](https://fonts.google.com/specimen/Inter), [Orbitron](https://fonts.google.com/specimen/Orbitron), [Share Tech Mono](https://fonts.google.com/specimen/Share+Tech+Mono) | Display, HUD labels, body, numerals and terminal typography |
| [Font Awesome 6.5.2](https://fontawesome.com/) | Icons |
| [GSAP 3.12.5](https://gsap.com/) | Animation, ScrollTrigger |
| [Lenis 1.1.18](https://github.com/darkroomengineering/lenis) | Smooth scroll |
| [Three.js 0.160.0](https://threejs.org/) | 3D reactor and bloom |
| SVG `feTurbulence` | Film-grain overlay (generated inline, no image files) |

No stock photography or Marvel imagery is used. All graphics are original CSS,
SVG and Three.js geometry.

## Credits

Designed and built by **Dhairya** for the GeeksforGeeks Student Chapter,
Bennett University.

Fan-made concept for a student event. Not affiliated with, endorsed by, or
connected to Marvel Entertainment or The Walt Disney Company. Iron Man, Stark
Industries and related names are trademarks of their respective owners.
