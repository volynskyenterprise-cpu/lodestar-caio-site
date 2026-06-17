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
