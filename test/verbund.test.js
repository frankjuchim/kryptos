'use strict';
// Verbundvertrag (README Teil H): Plattform-Manifest unter /api/plattform.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const request = require('supertest');
const H = require('./helpers');
const { pruefeManifest } = require('../scripts/vertrag_pruefen');

// Kryptos: bis zu den eigenen Welten (M5) zählt das Manifest die Kern-Fixture Welt 9.
const SEED = path.join(__dirname, 'fixtures', 'seed_beispiel');

test('Manifest: öffentlich, vertragsgemäß, Version wie /healthz, CORS für das Portal', async () => {
  const app = H.makeApp({ seedDir: SEED, portalPublicKey: null }); // ohne Portal-Schlüssel
  const r = await request(app).get('/api/plattform').expect(200);
  assert.equal(r.headers['access-control-allow-origin'], '*');
  const m = r.body;
  assert.deepEqual(pruefeManifest(m), []);
  assert.equal(m.id, 'kryptos');
  assert.equal(m.vertrag, '1.2');
  assert.deepEqual(m.niveaus, ['eA', 'gA']);
  assert.match(m.kurs, /eA und gA/);
  assert.equal(m.urls.niveaus, '/themen#niveaus');
  assert.equal(m.urls.ssoStart, null, 'ohne Portal-Schlüssel (Test) kein SSO');
  assert.equal(m.auth.modus, 'portal');
  assert.equal(m.auth.sso, false);
  assert.equal(m.umfang.welten, 1);
  assert.equal(m.umfang.aufgaben, 21, 'Fixture Welt 9: 15 Level-Aufgaben + 6 Boss-Aufgaben');
  const h = (await request(app).get('/healthz')).body;
  assert.equal(h.version, m.version);
  // keine Lösungen, keine Kurs- oder Schülerdaten
  const text = JSON.stringify(m);
  for (const v of ['loesung', 'kurscode', 'schueler', 'code"']) assert.ok(!text.toLowerCase().includes(v), v);
});

test('Manifest: Verbund-Konfiguration (PORTAL_URL, PLATTFORM_URL, Schlüssel) wird übernommen; Modus immer portal', async () => {
  const crypto = require('node:crypto');
  const pem = crypto.generateKeyPairSync('ed25519').publicKey.export({ type: 'spki', format: 'pem' });
  const app = H.makeApp({ seedDir: SEED, portalUrl: 'https://portal.example', plattformUrl: 'https://kryptos.example', portalPublicKey: pem });
  const m = (await request(app).get('/api/plattform')).body;
  assert.deepEqual(pruefeManifest(m), []);
  assert.deepEqual(m.auth, { modus: 'portal', portal: 'https://portal.example', sso: true });
  assert.equal(m.urls.ssoStart, '/sso/start');
  assert.equal(m.basis, 'https://kryptos.example');
});

test('pruefeManifest erkennt Vertragsverstöße', () => {
  assert.ok(pruefeManifest(null).length);
  const f = pruefeManifest({ vertrag: '2.0', id: 'Algo Quest', urls: {}, auth: { modus: 'x', sso: true }, faehigkeiten: [] });
  for (const teil of ['vertrag', 'id:', 'urls.gast', 'auth.modus', 'urls.ssoStart', '"gast"']) assert.ok(f.some((x) => x.includes(teil)), teil);
});
