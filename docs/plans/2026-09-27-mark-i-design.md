# MARK I — Design Document

Date: 27 September 2026
Task: GFG Student Chapter, Bennett University — Junior Core Technical Team, Round 1 (Marvel × Web Design)
Deadline: same day, 12:00 AM

## Goal

A cinematic, immersive, event-ready landing page for a Marvel-themed hackathon that
does not read as a college assignment. Judged on design thinking, creativity, UI/UX,
frontend execution, responsiveness, interactions, attention to detail and overall
experience.

## Decisions

| Decision | Choice | Why |
| --- | --- | --- |
| Marvel theme | Stark Expo / Iron Man HUD | Tony Stark is an engineer; a tech event framed as Stark prototype work fits without forcing it. Room for HUD-style interactions. |
| Event format | 24-hour hackathon | Richest content: tracks, timeline, prizes, sponsors, team registration. |
| Event name | MARK I | The first suit, built in a cave in a weekend. The hackathon metaphor is the concept. Tagline: "Build your first suit." |
| Stack | HTML + CSS + JS, GSAP, Lenis, Three.js via CDN | No build step under deadline; deploys to GitHub Pages as-is. |
| Imagery | None from Marvel or stock | Original CSS/SVG/Three.js only. Legally clean and more crafted. |
| Hosting | GitHub Pages | Free, same repo as submission. |

## Visual system

- Palette: near-black `#07070a` base, hot-rod red `#e23636`, gold `#f2c14e`,
  arc cyan `#5ee7ff`, GFG green `#2f8d46` used once for the chapter tag.
- Type: Bebas Neue (display), Rajdhani (HUD labels and numerics), Inter (body).
- Motifs: corner brackets, `// 01 — Section` labels, scan lines, film grain,
  faint grid, blinking status dots, tabular numerics.

## Page flow

1. Boot sequence (J.A.R.V.I.S. system checks, progress ring, wipe).
2. Hero: 3D arc reactor, oversized "MARK I", tagline, description, CTAs, event meta,
   live countdown, four HUD corner readouts.
3. Ticker with key facts.
4. Mission Briefing: sticky headline, copy, badges, animated stat counters.
5. Suit Systems: four track cards (J.A.R.V.I.S., Repulsor, Arc Reactor, Nanotech).
6. Mission Log: two-day timeline with a scroll-charged progress line.
7. Rewards: four prize tiers.
8. Allied Organizations: fictional Marvel corporations plus GeeksforGeeks.
9. Query Database: FAQ accordion.
10. Recruitment: registration form with validation and HUD success state.
11. Footer with giant outlined wordmark.

## Interactions

Custom reticle cursor, magnetic buttons, Lenis smooth scroll, GSAP ScrollTrigger
reveals, tilt cards with spotlight and scan sweep, hide-on-scroll nav with active
section state, reactor tilts to cursor and spins up on scroll, three-tap reactor
overload easter egg with J.A.R.V.I.S. toast, countdown and HUD clock.

## Resilience

- `prefers-reduced-motion`: Lenis off, animations near-instant, reactor idles.
- No WebGL: CSS-only reactor fallback.
- CDN failure: page content remains visible; only motion is lost.
- No JS: boot overlay is hidden via `<noscript>`.
- Touch devices: cursor, tilt and magnetic effects disabled.

## Out of scope

Real backend for registrations (documented hook point), analytics, CMS.
