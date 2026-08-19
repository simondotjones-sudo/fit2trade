# Fit2Trade marketing website

A direct-deploy static website built with HTML, CSS and a small amount of vanilla JavaScript. There is no npm install, framework build or server runtime.

## Structure

- `index.html` — homepage
- Page folders — one readable `index.html` per route
- `assets/css/styles.css` — shared site styles
- `assets/js/main.js` — navigation behaviour and automatic footer year
- `assets/fonts` — licensed Gellix web fonts
- `assets/images` — Fit2Trade logo and favicon
- `_redirects`, `_headers`, `robots.txt`, `sitemap.xml` — Netlify and search configuration

## Deploy to Netlify

Connect this repository to Netlify. Netlify reads `netlify.toml` and publishes the repository root directly; no build command is required.

## Forms

Netlify detects two forms: `fit2trade-demo` and `early-years-access`. In Netlify, add an email notification for new form submissions and set the destination to `sinon@fit2trade.com`.
