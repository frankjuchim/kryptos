'use strict';
// Dev-Portal (TECHNIK §16.4): Anmeldung über das Mini-Portal läuft Ende-zu-Ende gegen Kryptos (ohne Netz, supertest);
// Rücksprung nur zeichengenau, Seiten CSP-tauglich (keine Inline-Skripte/-Styles).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const H = require('./helpers');
const S = require('../src/security');
const { createDevPortal } = require('./devportal/server');

const PORTAL = 'http://localhost:3100';
const PLATTFORM = 'http://localhost:3000';

function aufbau() {
  const dp = createDevPortal({ portalUrl: PORTAL, plattformUrl: PLATTFORM });
  const app = H.makeApp({ portalUrl: PORTAL, plattformUrl: PLATTFORM, portalPublicKey: dp.publicPem });
  return { dp, app };
}

/** /sso/start bei Kryptos → Auswahlseite im Dev-Portal → Link „wer“ → /sso/ende bei Kryptos. */
async function anmelden(app, dp, wer, ziel = '/') {
  const c = request.agent(app);
  const start = await c.get('/sso/start?ziel=' + encodeURIComponent(ziel)).expect(302);
  const u = new URL(start.headers.location);
  assert.equal(u.origin, PORTAL);
  const auswahl = await request(dp.app).get(u.pathname + u.search).expect(200);
  const links = [...auswahl.text.matchAll(/href="(\/sso\/weiter\?[^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, '&'));
  const link = links.find((l) => new URLSearchParams(l.split('?')[1]).get('wer') === wer);
  assert.ok(link, `Auswahl ${wer}`);
  const weiter = await request(dp.app).get(link).expect(302);
  const ende = new URL(weiter.headers.location);
  assert.equal(ende.origin + ende.pathname, PLATTFORM + '/sso/ende');
  const r = await c.get(ende.pathname + ende.search);
  return { c, r };
}

test('Dev-Portal: Schüler „Mika R.“ landet nach der Anmeldung auf /spiel, mit zwei Kursen', async () => {
  const { dp, app } = aufbau();
  const { c, r } = await anmelden(app, dp, 'mika');
  assert.equal(r.status, 302);
  assert.equal(r.headers.location, '/spiel');
  assert.match(r.headers['set-cookie'].join(';'), new RegExp(S.COOKIE_SCHUELER + '='));
  assert.equal((await c.get('/spiel')).status, 200);
  const s = (await c.get('/api/sitzung').set('Host', 'localhost:3000')).body;
  assert.equal(s.rolle, 'schueler');
  assert.equal(s.name, 'Mika R.');
  assert.deepEqual(s.kurse.map((k) => [k.id, k.name]).sort(), [['k:1', 'LK 13 (eA)'], ['k:2', 'GK 12 (gA)']]);
});

test('Dev-Portal: Lehrkraft und Admin landen auf /lehrer; keine_berechtigung → 403, Abbrechen → /?abgebrochen=1', async () => {
  const { dp, app } = aufbau();
  for (const wer of ['lehrkraft', 'admin']) {
    const { r } = await anmelden(app, dp, wer);
    assert.equal(r.headers.location, '/lehrer', wer);
  }
  assert.equal((await anmelden(app, dp, 'keine_berechtigung')).r.status, 403);
  assert.equal((await anmelden(app, dp, 'abgebrochen')).r.headers.location, '/?abgebrochen=1');
});

test('Dev-Portal: Rücksprung nur zeichengenau, sonst Fehlerseite ohne Weiterleitung; Seiten ohne Inline-Skripte', async () => {
  const { dp } = aufbau();
  const q = (x) => '/sso/autorisieren?' + new URLSearchParams({ plattform: 'kryptos', ruecksprung: PLATTFORM + '/sso/ende', state: 'A'.repeat(22), ziel: '/', ...x });
  assert.equal((await request(dp.app).get(q({}))).status, 200);
  for (const x of [{ ruecksprung: 'http://boese.example/sso/ende' }, { ruecksprung: PLATTFORM + '/sso/ende/' }, { plattform: 'algoquest' }, { state: '' }]) {
    const r = await request(dp.app).get(q(x));
    assert.equal(r.status, 400, JSON.stringify(x));
    assert.equal(r.headers.location, undefined);
  }
  for (const pfad of ['/', q({})]) {
    const r = await request(dp.app).get(pfad);
    assert.match(r.headers['content-security-policy'], /script-src 'none'/);
    assert.doesNotMatch(r.text, /<script|style=|\son[a-z]+=/i, pfad);
  }
  assert.match((await request(dp.app).get('/sso/schluessel.pem')).text, /BEGIN PUBLIC KEY/);
});

test('Dev-Portal: Verbund-Knöpfe rufen die Verbund-API mit gültigem Token auf (Übersicht, Umbenennen, Löschen)', async () => {
  let app = null;
  // fetch an die Kryptos-App (supertest) weiterreichen
  const holen = async (url, o) => {
    const u = new URL(url);
    let r = request(app)[o.method.toLowerCase()](u.pathname).set(o.headers);
    if (o.body) r = r.send(JSON.parse(o.body));
    const a = await r;
    return { status: a.status, text: async () => a.text };
  };
  const dp = createDevPortal({ portalUrl: PORTAL, plattformUrl: PLATTFORM, fetch: holen });
  app = H.makeApp({ portalUrl: PORTAL, plattformUrl: PLATTFORM, portalPublicKey: dp.publicPem });
  // Kurs k:1 durch eine Anmeldung anlegen
  await anmelden(app, dp, 'mika');
  const ueb = await request(dp.app).post('/verbund/uebersicht').type('form').send({ kurs: 'k:1' }).expect(200);
  assert.match(ueb.text, /→ 200/);
  assert.match(ueb.text, /&quot;kurs&quot;: &quot;k:1&quot;/);
  await request(dp.app).post('/verbund/umbenennen').type('form').send({ kurs: 'k:1', name: 'LK 13 neu' }).expect(200);
  assert.equal(app.locals.db.prepare("SELECT name FROM kurse WHERE kurs_id = 'k:1'").get().name, 'LK 13 neu');
  const l = await request(dp.app).post('/verbund/loeschen').type('form').send({ sub: 's:1' }).expect(200);
  assert.match(l.text, /&quot;geloescht&quot;: 3/);
});

test('Dev-Portal: Ole B. und Nia T. im LK 13 (Plan M7 E117)', () => {
  const { KONTEN, KURSE } = require('./devportal/server');
  assert.deepEqual(KONTEN.ole, { sub: 's:3', rolle: 'schueler', name: 'Ole B.', kurse: ['k:1'] });
  assert.deepEqual(KONTEN.nia, { sub: 's:4', rolle: 'schueler', name: 'Nia T.', kurse: ['k:1'] });
  assert.equal(KURSE['k:1'], 'LK 13 (eA)');
  assert.equal(new Set(Object.values(KONTEN).map((k) => k.sub)).size, Object.keys(KONTEN).length, 'sub eindeutig');
});
