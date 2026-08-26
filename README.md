# Two Player Chess — Vite + React + Thymeleaf

All source files live in this single folder (no `src/`/`public/` split).

```
chess-game/
├── package.json
├── vite.config.js
├── index.html              # used only during `npm run dev`
├── main.jsx                # React entry point
├── App.jsx                 # game logic + UI (chess.js)
├── App.css                 # all styling — external CSS, no inline/CSS-in-JS
├── thymeleaf-template/
│   └── chess-thymeleaf.html   # Thymeleaf template that embeds the built app
└── README.md
```

This file lives in its own subfolder (not the project root) so Vite's dev server doesn't try to
scan it as part of the app — Thymeleaf's `th:src="@{...}"` syntax isn't valid JS/HTML and will
break `npm run dev` if the file sits next to `index.html`.

## 1. Run it standalone (fastest way to try it)
```bash
npm install
npm run dev
```
Vite prints a local URL and a network URL (e.g. `http://192.168.x.x:5173`) — open the network URL
on your phone to play on mobile too, as long as both devices are on the same Wi-Fi.

## 2. Deploy standalone (Vercel, Netlify, GitHub Pages, etc.)
```bash
npm run build
```
Serves from the root path (`/chess-app.js`, `/chess-app.css`) — this is the one to use when the
site is deployed on its own domain/subdomain, e.g. Vercel. Vercel auto-detects Vite: build command
`npm run build`, output directory `dist`.

## 3. Build for embedding into a Thymeleaf page instead
```bash
npm run build:thymeleaf
```
This produces the same `dist/` folder but with assets prefixed `/chess/...` to match the static
resource path used in `chess-thymeleaf.html`. Use this build only when embedding into your Java
project — not for a standalone deploy like Vercel, or the asset paths won't resolve.

## 4. Wire it into your Java project's Thymeleaf template
1. Copy `dist/chess-app.js` and `dist/chess-app.css` (from the `build:thymeleaf` output) into your server's static resources folder,
   under a `chess/` path, e.g.:
   - **Spring Boot:** `src/main/resources/static/chess/`
   - **Xsemble / Tomcat webapp:** `webapp/chess/`
2. Use `thymeleaf-template/chess-thymeleaf.html` as-is, or copy its `<link>`/`<script>` tags and the
   `<div id="root"></div>` into your existing Thymeleaf layout. The `th:href`/`th:src` attributes
   use Thymeleaf's `@{...}` link expression, so the path resolves correctly no matter what context
   root your app is deployed under.
3. Serve that Thymeleaf template from a controller/servlet as you would any other page — no extra
   backend logic is needed since the whole game runs client-side in React.

### Note on `vite.config.js`
`base: "/chess/"` tells Vite to prefix any asset URLs it generates with `/chess/`, matching the
static folder path above. If you serve the built files from a different path, change `base` to
match (e.g. `base: "/static/chess/"`) and update `chess-thymeleaf.html` accordingly.

## Features
- Full chess rules via `chess.js` (legal moves, check, checkmate, stalemate, draws)
- Click-to-move with highlighted legal targets and capture indicators
- Pawn promotion picker, captured piece trays, move history, undo/reset
- Editable player names, turn indicator
- Responsive: stacks vertically on mobile, side-by-side board + history on laptop
