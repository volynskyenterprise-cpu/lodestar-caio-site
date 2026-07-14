const test = require('node:test');
const assert = require('node:assert/strict');
const {
  esc, today, uid, daysUntil, normalizeState,
  snapExposures, scoreSnapshot,
  policyBrokerage, policyEscrowTitle
} = require('../js/console-core.js');

test('esc()', async (t) => {
  await t.test('escapes &, <, >, "', () => {
    assert.equal(esc('<b>"Tom & Jerry"</b>'), '&lt;b&gt;&quot;Tom &amp; Jerry&quot;&lt;/b&gt;');
  });
  await t.test('leaves apostrophes untouched (matches the double-quoted attribute usage everywhere it is called)', () => {
    assert.equal(esc("O'Brien & Sons"), "O'Brien &amp; Sons");
  });
  await t.test('treats null/undefined/empty as empty string', () => {
    assert.equal(esc(null), '');
    assert.equal(esc(undefined), '');
    assert.equal(esc(''), '');
  });
  await t.test('is idempotent-safe for plain text with no special chars', () => {
    assert.equal(esc('Wilshire Escrow'), 'Wilshire Escrow');
  });
});

test('uid()', async (t) => {
  await t.test('produces a short base36 token', () => {
    const id = uid();
    assert.match(id, /^[a-z0-9]+$/);
    assert.ok(id.length > 0 && id.length <= 7);
  });
  await t.test('does not collide across many calls', () => {
    const ids = new Set(Array.from({ length: 2000 }, () => uid()));
    assert.equal(ids.size, 2000);
  });
});

test('daysUntil()', async (t) => {
  await t.test('counts forward to a future date', () => {
    const d = new Date();
    d.setDate(d.getDate() + 10);
    const iso = d.toISOString().slice(0, 10);
    // Allow +-1 for the current time-of-day rounding.
    assert.ok(Math.abs(daysUntil(iso) - 10) <= 1);
  });
  await t.test('is negative for a past date', () => {
    const d = new Date();
    d.setDate(d.getDate() - 5);
    const iso = d.toISOString().slice(0, 10);
    assert.ok(daysUntil(iso) < 0);
  });
  await t.test('falls back to 9999 on an unparseable date instead of throwing', () => {
    assert.equal(daysUntil('not-a-date'), 9999);
    assert.equal(daysUntil(''), 9999);
    assert.equal(daysUntil(undefined), 9999);
  });
});

test('normalizeState()', async (t) => {
  const DEFAULTS = { identity: { name: 'Default Name' }, clients: [{ id: '1' }], snapshots: [] };

  await t.test('falls back to a clone of defaults when raw is null', () => {
    const result = normalizeState(null, DEFAULTS);
    assert.deepEqual(result, DEFAULTS);
    assert.notEqual(result, DEFAULTS);
    assert.notEqual(result.clients, DEFAULTS.clients);
  });

  await t.test('falls back to defaults when raw has no identity (e.g. {} or a stray array)', () => {
    assert.deepEqual(normalizeState({}, DEFAULTS), DEFAULTS);
    assert.deepEqual(normalizeState({ clients: [] }, DEFAULTS), DEFAULTS);
  });

  await t.test('keeps a valid state as-is', () => {
    const raw = { identity: { name: 'Stan' }, clients: [{ id: 'a' }], snapshots: [], policies: [], vendors: [], risks: [], engagements: [], proposals: [] };
    const result = normalizeState(raw, DEFAULTS);
    assert.equal(result, raw);
    assert.equal(result.identity.name, 'Stan');
  });

  await t.test('resets any of the seven array fields that were corrupted to a non-array', () => {
    const raw = { identity: { name: 'Stan' }, clients: 'oops', snapshots: null, policies: 42 };
    const result = normalizeState(raw, DEFAULTS);
    assert.deepEqual(result.clients, []);
    assert.deepEqual(result.snapshots, []);
    assert.deepEqual(result.policies, []);
    ['vendors', 'risks', 'engagements', 'proposals'].forEach((k) => {
      assert.deepEqual(result[k], []);
    });
  });
});

test('snapExposures()', async (t) => {
  const qs = [
    { q: 'Q1', exp: 'exp1' },
    { q: 'Q2', exp: 'exp2' },
    { q: 'Q3', exp: 'exp3' },
    { q: 'Q4', exp: 'exp4' }
  ];

  await t.test('buckets red and yellow answers, ignores green/na/unanswered', () => {
    const { reds, yellows } = snapExposures(qs, { 0: 'red', 1: 'yellow', 2: 'green', 3: 'na' });
    assert.deepEqual(reds, [qs[0]]);
    assert.deepEqual(yellows, [qs[1]]);
  });

  await t.test('handles a missing answers map without throwing', () => {
    const { reds, yellows } = snapExposures(qs, undefined);
    assert.deepEqual(reds, []);
    assert.deepEqual(yellows, []);
  });

  await t.test('handles an empty/undefined question list', () => {
    assert.deepEqual(snapExposures([], { 0: 'red' }), { reds: [], yellows: [] });
    assert.deepEqual(snapExposures(undefined, { 0: 'red' }), { reds: [], yellows: [] });
  });
});

test('scoreSnapshot()', async (t) => {
  const mk = (n) => Array.from({ length: n }, (_, i) => ({ q: `Q${i}`, exp: `exp${i}`, move: `move${i}` }));

  await t.test('scores 0 / level green when nothing is answered', () => {
    const r = scoreSnapshot(mk(5), {});
    assert.equal(r.scored, 0);
    assert.equal(r.risk, 0);
    assert.equal(r.level, 'green');
    assert.equal(r.levelTxt, 'LOW exposure');
  });

  await t.test('scores 0 / level green when everything is green', () => {
    const qs = mk(3);
    const r = scoreSnapshot(qs, { 0: 'green', 1: 'green', 2: 'green' });
    assert.equal(r.risk, 0);
    assert.equal(r.level, 'green');
    assert.equal(r.greens.length, 3);
  });

  await t.test('scores 100 / level red when everything is red', () => {
    const qs = mk(2);
    const r = scoreSnapshot(qs, { 0: 'red', 1: 'red' });
    assert.equal(r.risk, 100);
    assert.equal(r.level, 'red');
  });

  await t.test('the yellow boundary (risk === 20) is inclusive of the yellow level', () => {
    // 5 questions, 2 yellow, 3 green -> (0*2 + 2) / (5*2) * 100 = 20
    const qs = mk(5);
    const r = scoreSnapshot(qs, { 0: 'yellow', 1: 'yellow', 2: 'green', 3: 'green', 4: 'green' });
    assert.equal(r.risk, 20);
    assert.equal(r.level, 'yellow');
  });

  await t.test('the red boundary (risk === 50) is inclusive of the red level', () => {
    // 2 questions, 1 red, 1 green -> (1*2 + 0) / (2*2) * 100 = 50
    const qs = mk(2);
    const r = scoreSnapshot(qs, { 0: 'red', 1: 'green' });
    assert.equal(r.risk, 50);
    assert.equal(r.level, 'red');
  });

  await t.test('stays green just under the yellow threshold', () => {
    // 10 questions, 1 yellow, 9 green -> (0 + 1) / 20 * 100 = 5
    const qs = mk(10);
    const answers = {};
    qs.forEach((_, i) => { answers[i] = i === 0 ? 'yellow' : 'green'; });
    const r = scoreSnapshot(qs, answers);
    assert.equal(r.risk, 5);
    assert.equal(r.level, 'green');
  });

  await t.test('"answered" counts every answer key, "scored" only counts red/yellow/green (not na)', () => {
    const qs = mk(4);
    const r = scoreSnapshot(qs, { 0: 'red', 1: 'na', 2: 'green', 3: 'na' });
    assert.equal(r.answered, 4);
    assert.equal(r.scored, 2);
  });
});

test('policyBrokerage()', async (t) => {
  await t.test('falls back to bracketed placeholders when fields are missing', () => {
    const text = policyBrokerage({});
    assert.match(text, /\[Firm Name\]/);
    assert.match(text, /\[name, DRE #\]/);
    assert.match(text, /\[contact\]/);
    assert.match(text, /Maintained with Lodestar CAIO\./);
  });

  await t.test('substitutes supplied firm/broker/contact/date/practice', () => {
    const text = policyBrokerage({
      firm: 'Barbara Baker Realty',
      broker: 'Barbara Baker, DRE 12345',
      contact: 'ops@bbrealty.com',
      date: '2026-01-01',
      practice: 'Acme Governance'
    });
    assert.match(text, /AI USE POLICY — Barbara Baker Realty/);
    assert.match(text, /Responsible broker: Barbara Baker, DRE 12345/);
    assert.match(text, /Questions to: ops@bbrealty.com/);
    assert.match(text, /Effective date: 2026-01-01/);
    assert.match(text, /Maintained with Acme Governance\./);
  });

  await t.test('falls back to email when contact is missing', () => {
    const text = policyBrokerage({ email: 'stan@lodestarcaio.com' });
    assert.match(text, /Questions to: stan@lodestarcaio.com/);
  });
});

test('policyEscrowTitle()', async (t) => {
  await t.test('falls back to bracketed placeholders when fields are missing', () => {
    const text = policyEscrowTitle({});
    assert.match(text, /\[Company Name\]/);
    assert.match(text, /Qualified individual \/ ISP owner: \[name\]/);
  });

  await t.test('substitutes supplied fields', () => {
    const text = policyEscrowTitle({ firm: 'Wilshire Escrow', broker: 'Eric Shewfelt', date: '2026-02-02' });
    assert.match(text, /AI USE POLICY — Wilshire Escrow/);
    assert.match(text, /Qualified individual \/ ISP owner: Eric Shewfelt/);
    assert.match(text, /Effective date: 2026-02-02/);
  });
});

test('today()', () => {
  assert.equal(today(), new Date().toISOString().slice(0, 10));
});
