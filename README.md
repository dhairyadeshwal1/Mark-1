# MARK I — Recruitment terminal

A Marvel-themed event site for **MARK I**, a 24-hour hackathon by the
GeeksforGeeks Student Chapter, Bennett University. Built for the Junior Core
Technical Team Round 1 task (Marvel × Web Design).

**Live site:** _add your GitHub Pages URL here_

---

## Concept

Tony Stark built the Mark I in a cave, in a weekend, out of scraps. That is a
hackathon. The site takes that one idea, **"Build your first suit."**, and
presents the event the way Stark Industries would: not as a poster, but as a
working recruitment terminal run by J.A.R.V.I.S.

So it is designed as an interface rather than a landing page. A fixed top bar
holds the module tabs and a live clock. Every section is a bordered panel with
a small monospace label, and the content is laid out as data rows and tables:
an event file, a mission briefing with a stats column, four suit systems as a
list, the schedule as a mission log, rewards as a table, a query database and a
recruit intake form. One accent colour, no decoration that does not carry
information.

The only living element is J.A.R.V.I.S. himself, modelled in Three.js after
his Age of Ultron form: a golden sphere of thousands of glowing nodes with
orbital bands and rings, framed in the overview panel with a telemetry strip.
He also materializes inside the boot sequence, sits as a small orb in the
status line, comments on each module as you scroll, and answers questions in
a command line.

| Section | Module |
| --- | --- |
| Hero | 01 Overview: J.A.R.V.I.S. core + event file |
| About | 02 Mission briefing |
| Tracks | 03 Suit systems |
| Schedule | 04 Mission log |
| Prizes | 05 Rewards |
| Sponsors | Allied organisations |
| FAQ | 06 Query database |
| Registration | 07 Recruitment |

## Interactions

- **Suit-initialization boot**: rotating tick rings, a gold progress ring,
  phase readouts, a timestamped system log typing in, six suit-system gauges
  and J.A.R.V.I.S. materializing in the core, ending with a lock, a flash and
  a visor-split reveal. Shortened on repeat visits in the same session; ESC
  skips it.
- **J.A.R.V.I.S. in 3D** (Three.js + Unreal bloom): hot amber core, layered
  node shells, streaks between neighbours, clustered orbital bands, thin
  great-circle rings and drifting dust. Tilts toward the cursor, spins up on
  scroll, pauses rendering when off-screen. Tap three times to overload.
- **Status line**: a J.A.R.V.I.S. orb and a typed message that changes per
  module.
- **Command line** (press `/` or use the button): `help`, `register`,
  `systems`, `log`, `prizes`, `venue`, `overload` and plain questions, with
  typed replies that also navigate the page.
- **Live data**: clock, session timer, countdown to the event, telemetry
  values that drift like real sensors, stat counters.
- **Queries accordion** and a **registration form** with inline validation, a
  transmitting state and a recruit ID on success.
- **Optional synthesized audio** (top-bar toggle): hover blips, confirmation
  tones and an overload alarm from the Web Audio API, no sound files.
- **Fallbacks**: `prefers-reduced-motion` respected, CSS-only core when WebGL
  is unavailable, readable without JavaScript, responsive from 360px up.

## Tech stack

- HTML5, CSS3 (custom properties, grid), vanilla JavaScript
- [GSAP 3.12](https://gsap.com/) for the boot timeline only
- [Three.js r160](https://threejs.org/) with `UnrealBloomPass` for J.A.R.V.I.S.
- Web Audio API for opt-in synthesized sounds
- No build step. Open `index.html` or serve the folder.

## Project structure

```
.
├── index.html          # modules, panels and content
├── css/ui.css          # the whole design system
├── js/hud.js           # toolkit: SVG ring builder, 2D orb, typewriter, synth audio
├── js/main.js          # boot sequence, navigation, clock, countdown, reveals, form
├── js/jarvis.js        # status line, command line, telemetry, audio toggle
├── js/jarvis3d.js      # Three.js J.A.R.V.I.S. core (ES module)
├── assets/favicon.svg
└── docs/plans/         # design document
```

## Run locally

```bash
python -m http.server 5173
# then open http://127.0.0.1:5173
```

## Deploy to GitHub Pages

1. Push this folder to a GitHub repository (branch `main`).
2. Repository **Settings → Pages → Build and deployment**: Source = "Deploy from
   a branch", Branch = `main`, folder = `/ (root)`. Save.
3. The site goes live at `https://<username>.github.io/<repo>/` within a
   minute. All asset paths are relative, so it works from a sub-path.

## Hooking up real registrations

`js/main.js` simulates the submission. Replace the `setTimeout` block inside the
form submit handler with a `fetch()` to Formspree, Google Apps Script, Supabase
or your own endpoint; the `data` object already contains every field.

## Resources and assets used

| Resource | Use |
| --- | --- |
| Google Fonts: [Rajdhani](https://fonts.google.com/specimen/Rajdhani), [Share Tech Mono](https://fonts.google.com/specimen/Share+Tech+Mono), [Inter](https://fonts.google.com/specimen/Inter) | Interface, data and reading typography |
| [Font Awesome 6.5.2](https://fontawesome.com/) | Icons |
| [GSAP 3.12.5](https://gsap.com/) | Boot timeline |
| [Three.js 0.160.0](https://threejs.org/) | 3D J.A.R.V.I.S. core and bloom |
| Inline SVG and canvas | Favicon, boot rings, 2D orb |

No stock photography or Marvel imagery is used. All graphics are original CSS,
SVG, canvas and Three.js geometry.

## Credits

Designed and built by **Dhairya** for the GeeksforGeeks Student Chapter,
Bennett University.

Fan-made concept for a student event. Not affiliated with, endorsed by, or
connected to Marvel Entertainment or The Walt Disney Company. Iron Man,
J.A.R.V.I.S., Stark Industries and related names are trademarks of their
respective owners.
