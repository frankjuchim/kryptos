'use strict';
// QR-Weiterleitung /level/<nr> (Plan M5 Task 98, E50), Level-Detail mit Akte und Video (K38), seed/videos.json (E51).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const request = require('supertest');
const H = require('./helpers');

const WURZEL = path.join(__dirname, '..');
const WELTEN = [0, 1, 2].map((n) => path.join(WURZEL, 'seed', 'welten', `welt${n}.json`));
const FIXTURES = path.join(__dirname, 'fixtures');
const ziel = (z) => '/sso/start?ziel=' + encodeURIComponent(z);

test('/level/<nr> ohne Sitzung: über den SSO-Start mit ziel=/spiel#/level/<id> (Hash bleibt erhalten, TECHNIK §6.2)', async () => {
  const app = H.makeApp({ weltDateien: WELTEN });
  let r = await request(app).get('/level/0.1').expect(302);
  assert.equal(r.headers.location, ziel('/spiel#/level/W0-L1'));
  assert.equal(r.headers['cache-control'], 'no-store');
  r = await request(app).get('/level/K1').expect(302);
  assert.equal(r.headers.location, ziel('/spiel#/level/W2-L5'));
  r = await request(app).get('/level/2.3').expect(302);
  assert.equal(r.headers.location, ziel('/spiel#/level/W2-L3'));
  // Der SSO-Start übernimmt das Ziel unverändert (Regel §6.2.4: genau ein führender „/“, ≤ 300 Zeichen)
  const { sicheresZiel } = require('../src/verbund/sso');
  assert.equal(sicheresZiel('/spiel#/level/W0-L1'), '/spiel#/level/W0-L1');
});

test('/level/<nr>: unbekannte oder ungültige Nummer → 404-Seite', async () => {
  const app = H.makeApp({ weltDateien: WELTEN });
  for (const u of ['/level/9.9', '/level/x', '/level/0.9', '/level/K9', '/level/0.1.2', '/level/%2e%2e', '/level/']) {
    const r = await request(app).get(u);
    assert.equal(r.status, 404, u);
    if (u !== '/level/') assert.match(r.headers['content-type'], /html/, u);
  }
});

test('/level/<nr> mit Sitzung: Schüler direkt auf die Level-Seite, Lehrkraft in die Vorschau der Welt', async () => {
  const { app, s, lk } = await H.szenario({ weltDateien: WELTEN });
  let r = await s.get('/level/0.1').expect(302);
  assert.equal(r.headers.location, '/spiel#/level/W0-L1');
  r = await s.get('/level/K1').expect(302);
  assert.equal(r.headers.location, '/spiel#/level/W2-L5');
  r = await lk.get('/level/1.2').expect(302);
  assert.equal(r.headers.location, '/lehrer#/vorschau/welt/1');
  await request(app).get('/level/0.4').expect(302);
});

test('Level-Detail: akteDatei { titel, url } aus seed/akten.json, video { nr, titel, url: null } aus seed/videos.json', async () => {
  const { s } = await H.szenario({ seedDir: path.join(FIXTURES, 'seed_beispiel'), arbeitsblaetterDir: path.join(FIXTURES, 'materialien', 'Akten_PDF') });
  const l = (await s.get('/api/levels/W9-L1').expect(200)).body.level;
  assert.deepEqual(l.akteDatei, { titel: 'Akte W9·1 – Blöcke und Lücken', url: '/akten/Welt_9_Testwelt/KR_W9-AB1_Bloecke_und_Luecken.pdf' });
  assert.deepEqual(l.video, { nr: 1, titel: 'Testvideo', url: null });
  assert.equal(l.akte, 'Akte W9·1 – Blöcke und Lücken');
  const l3 = (await s.get('/api/levels/W9-L3').expect(200)).body.level;
  assert.equal(l3.akteDatei, null, 'Akte ohne Eintrag in akten.json: kein PDF-Knopf');
  assert.equal(l3.video, null);
  await s.get(l.akteDatei.url).expect(200).expect('Content-Type', 'application/pdf');
});

test('Level-Detail mit den echten Seeds: Akte als PDF für jedes Level W0–W2', async () => {
  const { s, lk, kurs } = await H.szenario({ weltDateien: [], seedDir: path.join(WURZEL, 'seed') });
  await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { welten: [0, 1, 2], kuer: 'frei' } }).expect(200);
  for (const id of ['W0-L1', 'W1-L3', 'W2-L5']) {
    const l = (await s.get(`/api/levels/${id}`).expect(200)).body.level;
    assert.ok(l.akteDatei && /^\/akten\/Welt_\d_\w+\/KR_W\d_Akte/.test(l.akteDatei.url), `${id}: ${JSON.stringify(l.akteDatei)}`);
    assert.ok(l.akteDatei.titel.startsWith(l.akte.split(' – ')[0]), id);
  }
  const v = (await s.get('/api/levels/W0-L2').expect(200)).body.level.video;
  assert.deepEqual(v, { nr: 1, titel: 'Caesar, das Alphabet A = 1 und Modulo', url: null });
});

test('seed/videos.json: Videos 0–7 mit den Titeln aus Design §11, url null (nicht öffentlich, E51); Validator ohne Video-Hinweise', () => {
  const v = JSON.parse(fs.readFileSync(path.join(WURZEL, 'seed', 'videos.json'), 'utf8'));
  assert.deepEqual(v.videos.map((x) => x.nr), [0, 1, 2, 3, 4, 5, 6, 7]);
  for (const x of v.videos) assert.equal(x.url, null);
  assert.equal(v.videos[0].titel, 'Kryptos: So funktioniert die Zeitreise');
  assert.equal(v.videos[7].titel, 'Abi-Check: Fremde Chiffren in 5 Schritten + die 10 Fallen');
  // Level-Videos der Seeds: Nummer und Titel wie in videos.json
  for (const datei of WELTEN) {
    for (const l of JSON.parse(fs.readFileSync(datei, 'utf8')).levels) {
      if (l.video) assert.equal(l.video.titel, v.videos[l.video.nr].titel, l.id);
    }
  }
  require('../src/krypto').registriere();
  const { validiereDateien } = require('../src/content/validator');
  const hinweise = validiereDateien(WELTEN).flatMap((e) => e.warnungen).filter((w) => /video/i.test(w.meldung));
  assert.deepEqual(hinweise, []);
});
