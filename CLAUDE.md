# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Static marketing site for **Lodestar CAIO** (Stan Volynsky's fractional Chief AI Officer
practice for regulated real-estate firms). Plain HTML/CSS/vanilla JS, no build step, no
package manager, no dependencies, no server-side code. Deployed via GitHub Pages to
`lodestarcaio.com` (custom domain set via `CNAME`).

## Commands

There is no build/lint/test tooling in this repo.

- **Preview locally**: open any `.html` file directly in a browser (e.g. `index.html`), or
  serve the directory with any static file server (`python3 -m http.server`) if you need
  root-relative paths to resolve.
- **Deploy**: push to `main` — GitHub Pages serves directly from the branch root, no CI/build
  step involved.

## Site structure

| File | Purpose |
|---|---|
| `index.html` | Home page — hero, problem/compliance-surface, "why Lodestar", how-we-engage cards, FAQ, contact CTA |
| `about.html` | About/credentials page for Stan Volynsky |
| `rung-0.html` | Standalone "Rung 0 AI Audit" interactive scoring tool (public, linked from nav) |
| `console-7c3f9a2b.html` | Private internal practice-management SPA (see below) — **not** part of the public marketing funnel |
| `404.html` | Not-found page |
| `styles.css` | Shared stylesheet for `index.html`, `about.html`, `404.html` |
| `robots.txt` / `sitemap.xml` | Crawler directives; sitemap only lists `index.html` and `about.html` |
| `CNAME` | GitHub Pages custom domain (`lodestarcaio.com`) |

`rung-0.html` and `console-7c3f9a2b.html` are self-contained: all CSS/JS is inlined in the
file rather than pulled from `styles.css`, so they don't need the shared stylesheet.

## Marketing pages (`index.html`, `about.html`, `404.html`)

- Share one design system defined in `styles.css`, using CSS custom properties (`--navy`,
  `--gold`, `--ink`, `--muted`, etc.) for the navy/gold brand palette.
- Same header/nav/footer markup is duplicated across each page (no templating) — when
  changing nav links, contact info, or footer content, **update all three pages**
  (`index.html`, `about.html`, and mirror relevant bits in `404.html`) to keep them in sync.
- Section layout follows a consistent block pattern: `<section>` → `.wrap` container →
  content, with alternating background via the `.alt` class.
- Inline SVGs (logo mark, hero "rings" graphic) are duplicated per-page rather than shared —
  keep them identical when editing brand assets.
- Key contact/business facts baked into markup in multiple places — keep consistent when
  updating:
  - Booking link: `https://calendar.app.google/qBp6McgzXVwvroJd9`
  - Email: `StanV@lodestarcaio.com`
  - Phone: `(818) 259-0667` / `tel:+18182590667`
  - Credentials: CA-Certified Residential Appraiser (AR035422), Licensed Broker (DRE 01495869)
- `sitemap.xml` and `robots.txt` intentionally exclude `console-7c3f9a2b.html` — do not add it
  to the sitemap or remove its `Disallow` entry.

## `rung-0.html` — Rung 0 AI Audit tool

Single-file interactive scoring widget (public). Content model:
- `LAYERS` array defines six audit layers (Provenance, Privilege, Containment, Separation,
  Consequence, Authorization). The first five are `graded:true` (Sound/Partial/Open); the
  sixth (`l6`, Authorization) is `graded:false, gate:true` (Sealed/Unsealed) and acts as a
  hard gate — `verdict()` blocks the whole audit if `l6 === "unsealed"`, regardless of the
  other five scores.
- State lives in an in-memory `state` object keyed by layer id (not persisted — resets on
  reload). `render()` draws layer cards, `verdict()` computes and displays the overall
  outcome (idle / blocked / open / conditional / cleared).
- To add or edit a layer, edit the `LAYERS` array; grading logic in `verdict()` assumes
  exactly one gate layer evaluated first, then any `"open"` graded layer, then any
  `"partial"` layer, else cleared.

## `console-7c3f9a2b.html` — internal practice console

A private, unlisted single-page app (deliberately obscure filename, `noindex, nofollow`,
and disallowed in `robots.txt`) that Stan uses to run his own practice — **not** a customer-
facing or product feature to promote in marketing copy. Vanilla JS, no framework, no bundler.

- **State**: a single `state` object persisted to `localStorage` under the key
  `lodestar_caio_v1` (`load()`/`save()`). Falls back to `structuredClone(DEFAULTS)` if
  nothing is stored. All data stays client-side in the browser — there is no backend.
- **Routing**: `ROUTES` is an ordered array of `[routeId, label, icon]` driving the sidebar
  nav; `route` is the current page id, `go(r)` switches routes and re-renders. `render()`
  rebuilds the nav, page title/subtitle, and calls `VIEWS[route]()` to produce the page HTML,
  then runs any route-specific init (`initSnapshot()`, `buildPolicy()`, `buildVet()`, ...).
- **Modules/routes**: Dashboard, AI Governance Snapshot (scoring questionnaire →
  written readout), Proposal Generator, Policy Generator (per-segment AI-use policy text,
  e.g. `policyBrokerage()`, `policyEscrowTitle()`), Tool/Vendor Vetting, Risk Register,
  Clients & Pipeline, Engagements & Retainers, Outreach Studio, Knowledge Base, Settings.
- Import/export: `exportData()` downloads the whole `state` as JSON; `importData()` reads a
  JSON file back in, replacing `state` if it has an `identity` key.
- When editing this file, keep it a single self-contained HTML file (no external `<script>`/
  `<link>` deps) — it's meant to work fully offline/locally.

## Conventions

- No JS framework, no CSS preprocessor, no module bundler anywhere in this repo — keep new
  work dependency-free and inline-able the same way.
- Prefer editing existing inline `<style>`/`<script>` blocks over introducing separate asset
  files, to preserve each page's single-file, no-build nature.
