# Submission notes — MARK I

Paste-ready material for the GFG Student Chapter submission form.

## Links

- **Live website:** `https://<your-github-username>.github.io/<repo-name>/` (fill in after enabling GitHub Pages)
- **GitHub repository:** `https://github.com/<your-github-username>/<repo-name>`

## Brief explanation of the concept

> **MARK I — "Build your first suit."**
>
> Tony Stark built the Mark I in a cave, in a weekend, out of scraps. That is exactly what a hackathon is, so the site presents a 24-hour hackathon by the GFG Student Chapter at Bennett University the way Stark Industries would: as a recruitment terminal run by J.A.R.V.I.S., not as a poster.
>
> It is designed as an interface rather than a landing page. A fixed top bar holds the module tabs and a live clock; every section is a bordered panel with a monospace label and the content is laid out as data rows and tables: an event file, a mission briefing, four suit systems (J.A.R.V.I.S., Repulsor, Arc Reactor, Nanotech), the schedule as a mission log, rewards, a query database and a recruit intake form. One accent colour, nothing decorative that does not carry information.
>
> The only living element is J.A.R.V.I.S. himself, modelled in Three.js after his Age of Ultron form: a golden sphere of thousands of glowing nodes with orbital bands and rings, sitting in the overview panel above a telemetry strip. He responds to being handled: hover and the nodes under the cursor light up while he turns to face you, drag to spin him, tap to send a ripple across his surface, hold to charge him and release to discharge a pulse, hold on and he overloads. A readout in the panel reports his state and he answers each action in the status line. He also materializes during a suit-initialization boot sequence, lives as a small orb in the status line, comments on each module as you scroll, and answers typed questions in a command line (press slash).
>
> The page is fully responsive from 360 px phones to desktops, respects `prefers-reduced-motion`, falls back to a CSS-only core when WebGL is unavailable and stays readable without JavaScript. No Marvel artwork or stock photography is used; everything on screen is original CSS, SVG, canvas and Three.js geometry.

## Tech stack

HTML5 · CSS3 · vanilla JavaScript · GSAP 3.12 (boot timeline) · Three.js r160 (UnrealBloomPass) · Web Audio API. No build step.

## Resources and assets used

| Resource | Purpose |
| --- | --- |
| Google Fonts — Rajdhani, Share Tech Mono, Inter | Interface, data and reading typography |
| Font Awesome 6.5.2 (CDN) | Icons |
| GSAP 3.12.5 (cdnjs) | Boot sequence timeline |
| Three.js 0.160.0 (jsDelivr) | 3D J.A.R.V.I.S. core and bloom post-processing |
| Inline SVG / canvas | Favicon, boot rings, 2D orb |

No images from Unsplash or Pexels were needed; all visuals are generated.

## Deploying to GitHub Pages (2 minutes)

```bash
git remote add origin https://github.com/<your-github-username>/<repo-name>.git
git push -u origin main
```

Then on GitHub: **Settings → Pages → Build and deployment → Source: "Deploy from a branch" → Branch: `main` / `(root)` → Save**. The live URL appears at the top of that page within a minute. Copy it into `README.md` and this file.
