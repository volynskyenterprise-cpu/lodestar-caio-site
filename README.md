# Lodestar CAIO — website

Static marketing site for Lodestar CAIO. No build step, no dependencies — plain HTML/CSS.
Open `index.html` in any browser to view locally.

## Files

| File | Purpose |
|---|---|
| `index.html` | Home page |
| `about.html` | About / credentials page |
| `styles.css` | Shared stylesheet for all pages |
| `404.html` | Not-found page |
| `robots.txt` | Crawler directives |
| `sitemap.xml` | Sitemap (references `lodestarcaio.com`) |
| `js/console-core.js` | Pure logic for `console-7c3f9a2b.html`, shared with the test suite |

## Publishing to GitHub Pages

The repo is already initialized and committed locally. To go live:

1. **Create an empty repo on GitHub** (no README, no .gitignore, no license):
   <https://github.com/new> → name it e.g. `lodestar-caio-site` → **Create repository**.

2. **Push** (run from this folder; Git Credential Manager will open a browser login the first time):
   ```sh
   git remote add origin https://github.com/<your-username>/lodestar-caio-site.git
   git push -u origin main
   ```

3. **Enable Pages**: repo → **Settings** → **Pages** → Source: **Deploy from a branch** →
   Branch: **main**, folder: **/ (root)** → **Save**.
   The site goes live at `https://<your-username>.github.io/lodestar-caio-site/` within a minute or two.

## Custom domain (lodestarcaio.com) — optional, after the github.io URL works

1. Add a file named `CNAME` at the repo root containing one line: `lodestarcaio.com`
2. At your DNS provider, point the domain at GitHub Pages:
   - Apex `lodestarcaio.com` → four `A` records: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `www` → `CNAME` to `<your-username>.github.io`
3. In repo Settings → Pages, set the custom domain and enable **Enforce HTTPS**.

## Contact wiring

- **Booking** — primary "Snapshot" CTAs open the Google Calendar booking page: <https://calendar.app.google/qBp6McgzXVwvroJd9>
- **Email** — `StanV@lodestarcaio.com`
- **Phone** — `(818) 259-0667` (`tel:+18182590667`), in the contact areas and footer.

## Tests

The marketing pages are static, but `console-7c3f9a2b.html` (a linked-but-unindexed internal
practice-management tool) has real business logic — Snapshot risk scoring, policy/proposal
templates, state persistence. That logic lives in `js/console-core.js`, shared as a plain
`<script>` by the page and via `require()` by the tests, so there's no build step either way.

```sh
npm test
```

Runs on Node's built-in test runner (`node --test`, no dependencies to install):

- `tests/console-core.test.js` — unit tests for the Snapshot scoring/exposure logic, state
  recovery from corrupted `localStorage`, date math, and the policy templates.
- `tests/static-pages.test.js` — checks that every local link/anchor across the HTML pages
  resolves, and that contact info stays consistent between the pages and this README.

CI (`.github/workflows/test.yml`) runs the suite on every push and pull request.
