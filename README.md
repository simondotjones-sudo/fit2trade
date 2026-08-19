# Fit2Trade marketing website

A direct-deploy static website built with HTML, CSS and a small amount of vanilla JavaScript. There is no npm install, framework build or server runtime.

## Structure

- `index.html` — homepage
- Page folders — one readable `index.html` per route
- `assets/css/styles.css` — shared site styles
- `assets/js/main.js` — navigation behaviour and automatic footer year
- `assets/fonts` — licensed Gellix web fonts
- `assets/images` — Fit2Trade logo and favicon
- `partials/header.html` — master header and navigation markup
- `partials/footer.html` — master footer markup
- `scripts/sync-shared-layout.py` — local shared-layout synchronisation and validation
- `_redirects`, `_headers`, `robots.txt`, `sitemap.xml` — Netlify and search configuration

## Shared header and footer

The public pages remain complete static HTML files, but their header and footer are controlled by the two files in `partials/`.

When changing the navigation or footer:

1. Edit `partials/header.html` or `partials/footer.html`.
2. Run `python scripts/sync-shared-layout.py` from the repository root.
3. Run `python scripts/sync-shared-layout.py --check` before committing.
4. Commit the amended partials and every HTML page updated by the script.

The script is a local maintenance tool only. Netlify does not execute it, and the deployed website has no Python or client-side layout dependency.

## Deploy to Netlify

Connect this repository to Netlify. Netlify reads `netlify.toml` and publishes the repository root directly; no build command is required.

## Forms

Netlify detects two forms: `fit2trade-demo` and `early-years-access`. In Netlify, add an email notification for new form submissions and set the destination to `Simon@fit2trade.com`.
