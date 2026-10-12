'use strict';
// Verbund-Konfiguration (TECHNIK §6.1, VERTRAG §8): ladeKonfig(env, { test }).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { ladeKonfig } = require('../src/verbund/konfig');

const pem = () => crypto.generateKeyPairSync('ed25519').publicKey.export({ type: 'spki', format: 'pem' });
const SCHLUESSEL_1 = pem();
const SCHLUESSEL_2 = pem();
// so, wie man den Schlüssel in ein einzeiliges Feld (CapRover) einfügt: Zeilenumbrüche als „\n“
const zweiBloeckeEinzeilig = (SCHLUESSEL_1 + SCHLUESSEL_2).replace(/\n/g, '\\n');

const gueltig = {
  PLATTFORM_URL: 'https://kryptos.test',
  PORTAL_URL: 'https://portal.test',
  PORTAL_PUBLIC_KEY: SCHLUESSEL_1,
  SESSION_SECRET: 's'.repeat(32)
};

test('gültige Konfiguration: Standardwerte und Felder', () => {
  const k = ladeKonfig({ ...gueltig });
  assert.equal(k.plattformId, 'kryptos');
  assert.equal(k.plattformUrl, 'https://kryptos.test');
  assert.equal(k.portalUrl, 'https://portal.test');
  assert.equal(k.schluessel.length, 1);
  assert.ok(k.schluessel[0] instanceof crypto.KeyObject);
  assert.match(k.portalPublicKey, /^-----BEGIN PUBLIC KEY-----/);
  assert.equal(k.sessionSecret, 's'.repeat(32));
  assert.equal(k.vertragVersion, '1.1');
  assert.equal(k.authModus, 'portal');
  assert.equal(k.port, 80);
  assert.equal(k.trustProxy, 1);
  assert.ok(k.dataDir.length > 0);
});

test('AUTH_MODUS ≠ portal bricht ab', () => assert.throws(() => ladeKonfig({ ...gueltig, AUTH_MODUS: 'lokal' }), /nur AUTH_MODUS=portal/));
test('AUTH_MODUS=portal ist erlaubt (auch ausdrücklich gesetzt)', () => assert.equal(ladeKonfig({ ...gueltig, AUTH_MODUS: 'portal' }).authModus, 'portal'));
test('SESSION_SECRET < 32 Zeichen bricht ab', () => assert.throws(() => ladeKonfig({ ...gueltig, SESSION_SECRET: 'x'.repeat(31) }), /SESSION_SECRET/));
test('SESSION_SECRET fehlt → Abbruch', () => assert.throws(() => ladeKonfig({ ...gueltig, SESSION_SECRET: undefined }), /SESSION_SECRET/));
test('PORTAL_PUBLIC_KEY einzeilig mit \\n und zwei Blöcken', () => assert.equal(ladeKonfig({ ...gueltig, PORTAL_PUBLIC_KEY: zweiBloeckeEinzeilig }).schluessel.length, 2));
test('PORTAL_PUBLIC_KEY fehlt oder ohne Schlüssel → Abbruch', () => {
  assert.throws(() => ladeKonfig({ ...gueltig, PORTAL_PUBLIC_KEY: undefined }), /PORTAL_PUBLIC_KEY/);
  assert.throws(() => ladeKonfig({ ...gueltig, PORTAL_PUBLIC_KEY: 'kein Schlüssel' }), /PORTAL_PUBLIC_KEY/);
});
test('PLATTFORM_URL ohne Schrägstrich am Ende', () => assert.throws(() => ladeKonfig({ ...gueltig, PLATTFORM_URL: 'https://kryptos.test/' })));
test('PORTAL_URL ohne Schrägstrich am Ende', () => assert.throws(() => ladeKonfig({ ...gueltig, PORTAL_URL: 'https://portal.test/' }), /PORTAL_URL/));
test('PLATTFORM_URL/PORTAL_URL fehlen oder sind keine http(s)-Adressen → Abbruch', () => {
  assert.throws(() => ladeKonfig({ ...gueltig, PLATTFORM_URL: undefined }), /PLATTFORM_URL/);
  assert.throws(() => ladeKonfig({ ...gueltig, PORTAL_URL: '' }), /PORTAL_URL/);
  assert.throws(() => ladeKonfig({ ...gueltig, PORTAL_URL: 'ftp://portal.test' }), /PORTAL_URL/);
  assert.throws(() => ladeKonfig({ ...gueltig, PLATTFORM_URL: 'https://kryptos.test/pfad?x=1' }), /PLATTFORM_URL/);
});
test('PLATTFORM_ID Format', () => {
  assert.throws(() => ladeKonfig({ ...gueltig, PLATTFORM_ID: 'Kryptos!' }), /PLATTFORM_ID/);
  assert.equal(ladeKonfig({ ...gueltig, PLATTFORM_ID: 'kryptos-test' }).plattformId, 'kryptos-test');
});
test('VERTRAG_VERSION: 1.1 (Standard) oder 1.2, sonst Abbruch', () => {
  assert.equal(ladeKonfig({ ...gueltig, VERTRAG_VERSION: '1.2' }).vertragVersion, '1.2');
  assert.throws(() => ladeKonfig({ ...gueltig, VERTRAG_VERSION: '2.0' }), /VERTRAG_VERSION/);
});
test('ADMIN_EMAIL/ADMIN_PASSWORD werden nicht gelesen', () => {
  const k = ladeKonfig({ ...gueltig, ADMIN_EMAIL: 'admin', ADMIN_PASSWORD: 'geheim-1234567' });
  assert.ok(!JSON.stringify(k).includes('geheim-1234567'));
  assert.ok(!Object.keys(k).some((x) => /admin/i.test(x)));
});
test('DATA_DIR, PORT, TRUST_PROXY werden übernommen', () => {
  const k = ladeKonfig({ ...gueltig, DATA_DIR: '/tmp/kr', PORT: '3000', TRUST_PROXY: 'false' });
  assert.equal(k.dataDir, '/tmp/kr');
  assert.equal(k.port, 3000);
  assert.equal(k.trustProxy, false);
  assert.throws(() => ladeKonfig({ ...gueltig, PORT: 'achtzig' }), /PORT/);
});
test('Testmodus: fehlende Pflichtwerte brechen nicht ab, ungültige schon', () => {
  const k = ladeKonfig({}, { test: true });
  assert.equal(k.plattformId, 'kryptos');
  assert.equal(k.portalUrl, null);
  assert.equal(k.plattformUrl, null);
  assert.deepEqual(k.schluessel, []);
  assert.ok(k.sessionSecret.length >= 32, 'zufälliges Geheimnis');
  assert.throws(() => ladeKonfig({ AUTH_MODUS: 'beides' }, { test: true }), /nur AUTH_MODUS=portal/);
  assert.throws(() => ladeKonfig({ PLATTFORM_URL: 'https://kryptos.test/' }, { test: true }));
});

test('server.js: ohne Pflichtwerte Startabbruch mit deutscher Meldung (Exit 1)', () => {
  const { spawnSync } = require('node:child_process');
  const path = require('node:path');
  const env = { PATH: process.env.PATH, HOME: process.env.HOME, NODE_ENV: 'production' };
  const r = spawnSync(process.execPath, [path.join(__dirname, '..', 'src', 'server.js')], { env, encoding: 'utf8', timeout: 20000 });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /Kryptos startet nicht\. Konfiguration: PLATTFORM_URL fehlt/);
  const r2 = spawnSync(process.execPath, [path.join(__dirname, '..', 'src', 'server.js')], { env: { ...env, ...gueltig, AUTH_MODUS: 'beides' }, encoding: 'utf8', timeout: 20000 });
  assert.equal(r2.status, 1);
  assert.match(r2.stderr, /nur AUTH_MODUS=portal/);
});
