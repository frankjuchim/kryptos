'use strict';
// SSO-Empfänger (VERTRAG §5, TECHNIK §6.2–§6.4, Testfälle §6.12 = INTEGRATION.md §5 T1–T10 + Zusätze).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const H = require('./helpers');

/* ---------- /sso/start (TECHNIK §6.2) ---------- */

test('sso/start: Weiterleitung zeichengenau', async () => {
  const agent = H.client(H.makeApp());
  const r = await agent.get('/sso/start?ziel=/spiel%23w2');
  assert.equal(r.status, 302);
  const u = new URL(r.headers.location);
  assert.equal(u.origin + u.pathname, 'https://portal.test/sso/autorisieren');
  assert.deepEqual([...u.searchParams.keys()], ['plattform', 'ruecksprung', 'state', 'ziel']);
  assert.equal(u.searchParams.get('plattform'), 'kryptos');
  assert.equal(u.searchParams.get('ruecksprung'), 'https://kryptos.test/sso/ende');
  assert.match(u.searchParams.get('state'), /^[A-Za-z0-9_-]{22}$/);
  assert.equal(u.searchParams.get('ziel'), '/spiel#w2');
  assert.equal(r.headers.location, `https://portal.test/sso/autorisieren?plattform=kryptos&ruecksprung=https%3A%2F%2Fkryptos.test%2Fsso%2Fende&state=${u.searchParams.get('state')}&ziel=%2Fspiel%23w2`);
  assert.match(r.headers['cache-control'], /no-store/);
  const cookie = r.headers['set-cookie'].find((x) => x.startsWith('kr_sso_state='));
  assert.ok(cookie, 'state-Cookie gesetzt');
  // Attribute einzeln (die Reihenfolge legt Express fest)
  assert.match(cookie, /;\s*Path=\/sso(;|$)/);
  assert.match(cookie, /;\s*Max-Age=600(;|$)/);
  assert.match(cookie, /;\s*HttpOnly/i);
  assert.match(cookie, /;\s*SameSite=Lax/i);
  assert.doesNotMatch(cookie, /Secure/i, 'ohne HTTPS kein Secure');
  // jeder Start erzeugt einen neuen state
  const r2 = await agent.get('/sso/start?ziel=/spiel');
  assert.notEqual(new URL(r2.headers.location).searchParams.get('state'), u.searchParams.get('state'));
});

test('sso/start: hinter HTTPS (TRUST_PROXY) mit Secure', async () => {
  const app = H.makeApp({ trustProxy: 1 });
  const r = await H.client(app).get('/sso/start').set('X-Forwarded-Proto', 'https');
  assert.match(r.headers['set-cookie'].find((x) => x.startsWith('kr_sso_state=')), /;\s*Secure/i);
});

test('sso/start: ziel //boese.example, /\\boese, https://x, ohne „/“, zu lang, mit Steuerzeichen → /', async () => {
  const c = H.client(H.makeApp());
  for (const boese of ['//boese.example', '/\\boese.example', 'https://boese.example', 'spiel', '', '/' + 'a'.repeat(300), '/\t/boese.example', '/spiel\n']) {
    const u = new URL((await c.get('/sso/start?ziel=' + encodeURIComponent(boese)).expect(302)).headers.location);
    assert.equal(u.searchParams.get('ziel'), '/', JSON.stringify(boese));
  }
  // ziel mehrfach (Liste) → /
  const u = new URL((await c.get('/sso/start?ziel=/a&ziel=/b').expect(302)).headers.location);
  assert.equal(u.searchParams.get('ziel'), '/');
  // ohne ziel → /
  assert.equal(new URL((await c.get('/sso/start')).headers.location).searchParams.get('ziel'), '/');
  // erlaubt: genau 300 Zeichen, Query und Hash
  const lang = '/' + 'a'.repeat(299);
  assert.equal(new URL((await c.get('/sso/start?ziel=' + encodeURIComponent(lang))).headers.location).searchParams.get('ziel'), lang);
  assert.equal(new URL((await c.get('/sso/start?ziel=' + encodeURIComponent('/lehrer?kurs=3#/auswertung'))).headers.location).searchParams.get('ziel'), '/lehrer?kurs=3#/auswertung');
});

test('sso/start: Rate-Limit 300 Anfragen / 10 min je IP → 429', async () => {
  const c = H.client(H.makeApp());
  for (let i = 0; i < 300; i++) assert.equal((await c.get('/sso/start')).status, 302);
  const r = await c.get('/sso/start');
  assert.equal(r.status, 429);
  assert.ok(Number(r.headers['retry-after']) > 0);
});

test('sso/start: ohne Portal-Konfiguration → 503, keine Weiterleitung', async () => {
  const app = H.makeApp({ portalUrl: null, portalPublicKey: null, plattformUrl: null });
  const r = await H.client(app).get('/sso/start');
  assert.equal(r.status, 503);
  assert.equal(r.headers.location, undefined);
});
