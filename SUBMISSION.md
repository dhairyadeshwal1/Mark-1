# Submission notes — MARK I

Paste-ready material for the GFG Student Chapter submission form.

## Links

- **Live website:** `https://<your-github-username>.github.io/<repo-name>/` (fill in after enabling GitHub Pages)
- **GitHub repository:** `https://github.com/<your-github-username>/<repo-name>`

## Brief explanation of the concept

> **MARK I — "Build your first suit."**
>
> Tony Stark built the Mark I in a cave, in a weekend, out of scraps. That is exactly what a hackathon is, so the site frames a 24-hour hackathon by the GFG Student Chapter at Bennett University as a Stark Industries prototype program. Every section speaks the same language: the preloader is a J.A.R.V.I.S. boot sequence, the tracks are "suit systems" (J.A.R.V.I.S., Repulsor, Arc Reactor, Nanotech), the schedule is a mission log, the sponsors are allied organisations from the Marvel universe, and registration is recruitment ("Suit up.").
>
> Instead of pasting Marvel posters onto a template, the whole site behaves like Tony's heads-up display, run by J.A.R.V.I.S. It opens with a suit-initialization boot: rotating tick rings, a progress ring, a timestamped system log typing in, suit-system gauges, a voice-pattern waveform with a typed greeting and a hex memory map, ending in a targeting lock, a flash and a visor-split reveal. Behind it floats J.A.R.V.I.S. himself, modelled in Three.js after his Age of Ultron form: a golden sphere of thousands of glowing nodes with orbital bands and rings, framed by rotating targeting rings and telemetry chips that drift like real sensors; he tilts toward the cursor and spins faster as you scroll. J.A.R.V.I.S. stays with you: a status bar with a live voice waveform comments on each section, and a command line (press slash) answers typed questions and navigates the page. Hex grids, scan-lines, film grain, corner brackets and optional synthesized HUD sounds complete the interface. Motion is choreographed with GSAP ScrollTrigger and Lenis smooth scroll: word-by-word heading reveals, a timeline that "charges" as you read it, animated stat counters, magnetic buttons, 3D-tilting cards with a spotlight and scan sweep, and a reticle cursor with contextual labels. Tap the reactor three times to overload it.
>
> The page is fully responsive from 360 px phones to ultrawide desktops, respects `prefers-reduced-motion`, falls back to a CSS reactor when WebGL is unavailable, and stays readable if JavaScript or a CDN fails. No Marvel artwork or stock photography is used; everything on screen is original CSS, SVG and Three.js geometry.

## Tech stack

HTML5 · CSS3 · vanilla JavaScript · GSAP 3.12 + ScrollTrigger · Lenis 1.1 · Three.js r160 (UnrealBloomPass) · Web Audio API. No build step.

## Resources and assets used

| Resource | Purpose |
| --- | --- |
| Google Fonts — Bebas Neue, Rajdhani, Inter, Orbitron, Share Tech Mono | Display, HUD labels, body, numerals and terminal typography |
| Font Awesome 6.5.2 (CDN) | Icons |
| GSAP 3.12.5 + ScrollTrigger (cdnjs) | Animation and scroll choreography |
| Lenis 1.1.18 (jsDelivr) | Smooth scrolling |
| Three.js 0.160.0 (jsDelivr) | 3D J.A.R.V.I.S. core and bloom post-processing |
| Inline SVG / canvas | Favicon, reactor logo mark, film-grain tile |

No images from Unsplash or Pexels were needed; all visuals are generated.

## Deploying to GitHub Pages (2 minutes)

```bash
git remote add origin https://github.com/<your-github-username>/<repo-name>.git
git push -u origin main
```

Then on GitHub: **Settings → Pages → Build and deployment → Source: "Deploy from a branch" → Branch: `main` / `(root)` → Save**. The live URL appears at the top of that page within a minute. Copy it into `README.md` and this file.
