const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const HTML_FILES = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'));

function readHtml(file) {
  return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

function extractLinks(html) {
  const links = [];
  const re = /(?:href|src)="([^"]*)"/g;
  let m;
  while ((m = re.exec(html))) links.push(m[1]);
  return links;
}

function extractIds(html) {
  const ids = new Set();
  const re = /\bid="([a-zA-Z0-9_-]+)"/g;
  let m;
  while ((m = re.exec(html))) ids.add(m[1]);
  return ids;
}

function isExternalOrSpecial(href) {
  return /^(https?:|mailto:|tel:|data:|javascript:|#)/i.test(href);
}

test('every local href/src across the HTML pages resolves to a real file', () => {
  const missing = [];
  for (const file of HTML_FILES) {
    const html = readHtml(file);
    for (const href of extractLinks(html)) {
      if (isExternalOrSpecial(href)) continue;
      const [target] = href.split('#');
      if (!target) continue; // pure "#anchor" already filtered above, but guard anyway
      const targetPath = path.join(ROOT, target);
      if (!fs.existsSync(targetPath)) {
        missing.push(`${file} -> ${href}`);
      }
    }
  }
  assert.deepEqual(missing, [], `broken local links found:\n${missing.join('\n')}`);
});

test('every in-page and cross-page #anchor link resolves to a real id', () => {
  const idsByFile = new Map(HTML_FILES.map((f) => [f, extractIds(readHtml(f))]));
  const missing = [];
  for (const file of HTML_FILES) {
    const html = readHtml(file);
    for (const href of extractLinks(html)) {
      if (!href.includes('#')) continue;
      if (/^(https?:|mailto:|tel:|data:|javascript:)/i.test(href)) continue;
      const [target, anchor] = href.split('#');
      if (!anchor) continue;
      const targetFile = target || file; // "#foo" means same page
      const ids = idsByFile.get(targetFile);
      if (!ids) continue; // target file existence is covered by the other test
      if (!ids.has(anchor)) {
        missing.push(`${file} -> ${href} (no id="${anchor}" in ${targetFile})`);
      }
    }
  }
  assert.deepEqual(missing, [], `broken anchor links found:\n${missing.join('\n')}`);
});

test('contact info (email, phone, booking link) is consistent across pages and the README', () => {
  const README = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
  const expectedEmail = 'StanV@lodestarcaio.com';
  const expectedTel = '+18182590667';
  const expectedBooking = 'https://calendar.app.google/qBp6McgzXVwvroJd9';

  assert.ok(README.includes(expectedEmail), 'README missing the canonical email');
  assert.ok(README.includes('(818) 259-0667'), 'README missing the canonical phone number');
  assert.ok(README.includes(expectedBooking), 'README missing the canonical booking link');

  for (const file of ['index.html', 'about.html']) {
    const html = readHtml(file);
    assert.ok(html.includes(`mailto:${expectedEmail}`), `${file} missing mailto: link to ${expectedEmail}`);
    assert.ok(html.includes(`tel:${expectedTel}`), `${file} missing tel: link to ${expectedTel}`);
    assert.ok(html.includes(expectedBooking), `${file} missing the booking link`);
  }
});

test('every HTML page has exactly one <title>', () => {
  for (const file of HTML_FILES) {
    const html = readHtml(file);
    const matches = html.match(/<title>/g) || [];
    assert.equal(matches.length, 1, `${file} should have exactly one <title>, found ${matches.length}`);
  }
});
