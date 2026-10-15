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
  assert.equal(k.vertragVersion, '1.3');
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
test('VERTRAG_VERSION: nur 1.3 (labs-Vertrag, Standard); 1.2, 1.1 und andere Werte brechen ab – auch im Testmodus', () => {
  assert.equal(ladeKonfig({ ...gueltig, VERTRAG_VERSION: '1.3' }).vertragVersion, '1.3');
  assert.equal(ladeKonfig({ ...gueltig, VERTRAG_VERSION: ' 1.3 ' }).vertragVersion, '1.3');
  assert.equal(ladeKonfig({ ...gueltig, VERTRAG_VERSION: undefined }).vertragVersion, '1.3');
  for (const test of [false, true]) {
    for (const v of ['1.2', '1.1', '1.0', '1.4', '2.0']) assert.throws(() => ladeKonfig({ ...gueltig, VERTRAG_VERSION: v }, { test }), /VERTRAG_VERSION muss 1\.3 sein/, v);
  }
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

// ── M9 Task 205: https im Betrieb (E149), Schlüssel-Bereinigung (E150), Startzeile ohne Geheimnisse (E151), DATA_DIR-Probe ──
const fs = require('node:fs');
const os = require('node:os');
const pfad = require('node:path');
const { spawn, spawnSync } = require('node:child_process');
const { konfigZusammenfassung, pruefeDatenDir } = require('../src/verbund/konfig');

const PEM = SCHLUESSEL_1;
const PRIVAT_PEM = crypto.generateKeyPairSync('ed25519').privateKey.export({ type: 'pkcs8', format: 'pem' });
const SERVER = pfad.join(__dirname, '..', 'src', 'server.js');
const KONFIG_PRUEFEN = pfad.join(__dirname, '..', 'src', 'verbund', 'konfig_pruefen.js');
const ALS_ROOT = typeof process.getuid === 'function' && process.getuid() === 0;

test('production: http nur für localhost (E149)', () => {
  const p = { ...gueltig, NODE_ENV: 'production' };
  assert.throws(() => ladeKonfig({ ...p, PLATTFORM_URL: 'http://kryptos.example' }), /PLATTFORM_URL muss im Betrieb mit https:\/\//);
  assert.throws(() => ladeKonfig({ ...p, PORTAL_URL: 'http://labs.example' }), /PORTAL_URL muss im Betrieb mit https:\/\//);
  assert.equal(ladeKonfig({ ...p, PLATTFORM_URL: 'http://localhost:3000', PORTAL_URL: 'http://127.0.0.1:3100' }).plattformUrl, 'http://localhost:3000');
  assert.equal(ladeKonfig({ ...p, PORTAL_URL: 'http://[::1]:3100' }).portalUrl, 'http://[::1]:3100');
  // „localhost“ nur als ganzer Rechnername, nicht als Präfix
  assert.throws(() => ladeKonfig({ ...p, PLATTFORM_URL: 'http://localhost.boese.example' }), /PLATTFORM_URL muss im Betrieb mit https:\/\//);
  assert.equal(ladeKonfig({ ...gueltig, PLATTFORM_URL: 'http://kryptos.example' }).plattformUrl, 'http://kryptos.example'); // ohne production erlaubt
});

test('PORTAL_PUBLIC_KEY eingefügt mit Anführungszeichen, CRLF, Rand-Leerzeichen (Review Focus 2)', () => {
  for (const roh of [`"${PEM}"`, `'${PEM}'`, PEM.replace(/\n/g, '\r\n'), `  ${PEM}  `, `"${PEM.replace(/\n/g, '\\n')}"`, PEM.replace(/\n/g, '\\r\\n')])
    assert.equal(ladeKonfig({ ...gueltig, PORTAL_PUBLIC_KEY: roh }).schluessel.length, 1, JSON.stringify(roh.slice(0, 40)));
});

test('privater Schlüssel statt öffentlichem → eigener Abbruch ohne Schlüsseltext (E150)', () => {
  const pruefe = (e) => /privaten Schlüssel/.test(e.message) && !e.message.includes('BEGIN') && !e.message.includes(PRIVAT_PEM.split('\n')[1]);
  assert.throws(() => ladeKonfig({ ...gueltig, PORTAL_PUBLIC_KEY: PRIVAT_PEM }), pruefe);
  assert.throws(() => ladeKonfig({ ...gueltig, PORTAL_PUBLIC_KEY: PRIVAT_PEM.replace(/\n/g, '\\n') }), pruefe);
  assert.throws(() => ladeKonfig({ ...gueltig, PORTAL_PUBLIC_KEY: PEM + PRIVAT_PEM }), pruefe, 'auch zusammen mit einem öffentlichen');
  assert.throws(() => ladeKonfig({ ...gueltig, PORTAL_PUBLIC_KEY: PRIVAT_PEM }, { test: true }), pruefe, 'auch im Testmodus');
});

test('konfigZusammenfassung: keine Geheimnisse, Fingerabdruck je Schlüssel (E151)', () => {
  const k = ladeKonfig({ ...gueltig, PORTAL_PUBLIC_KEY: zweiBloeckeEinzeilig, DATA_DIR: '/tmp/kr', PORT: '3000' });
  const z = konfigZusammenfassung(k);
  assert.deepEqual(Object.keys(z).sort(), ['dataDir', 'fingerabdruecke', 'plattformId', 'plattformUrl', 'port', 'portalUrl', 'schluessel', 'trustProxy', 'vertrag'].sort());
  assert.equal(z.schluessel, 2);
  assert.equal(z.fingerabdruecke.length, 2);
  for (const f of z.fingerabdruecke) assert.match(f, /^sha256:[0-9a-f]{16}$/);
  assert.notEqual(z.fingerabdruecke[0], z.fingerabdruecke[1]);
  const erwartet = 'sha256:' + crypto.createHash('sha256').update(crypto.createPublicKey(SCHLUESSEL_1).export({ type: 'spki', format: 'der' })).digest('hex').slice(0, 16);
  assert.equal(z.fingerabdruecke[0], erwartet);
  assert.equal(z.vertrag, '1.3');
  assert.equal(z.dataDir, '/tmp/kr');
  assert.equal(z.port, 3000);
  const text = JSON.stringify(z);
  assert.ok(!text.includes(gueltig.SESSION_SECRET) && !text.includes('BEGIN') && !text.includes(SCHLUESSEL_1.split('\n')[1]));
});

test('datenDir_nicht_beschreibbar: deutscher Abbruch (Review Focus 1)', (t) => {
  const tmp = fs.mkdtempSync(pfad.join(os.tmpdir(), 'kr-konfig-'));
  t.after(() => {
    try { fs.chmodSync(pfad.join(tmp, 'nurlesbar'), 0o700); } catch { /* egal */ }
    fs.rmSync(tmp, { recursive: true, force: true });
  });
  // beschreibbar: wird angelegt, Probe-Datei bleibt nicht liegen
  const neu = pfad.join(tmp, 'a', 'b');
  pruefeDatenDir(neu);
  assert.deepEqual(fs.readdirSync(neu), []);
  // ein Pfad unter einer Datei ist auch für root nicht anlegbar
  fs.writeFileSync(pfad.join(tmp, 'datei'), 'x');
  assert.throws(() => pruefeDatenDir(pfad.join(tmp, 'datei', 'data')), /Konfiguration: DATA_DIR .* ist nicht beschreibbar/);
  // Ordner nur lesbar (wie ein root-eigenes CapRover-Volume für den Benutzer node); als root greifen Rechte nicht
  if (!ALS_ROOT) {
    const nurLesbar = pfad.join(tmp, 'nurlesbar');
    fs.mkdirSync(nurLesbar, { mode: 0o500 });
    fs.chmodSync(nurLesbar, 0o500);
    assert.throws(() => pruefeDatenDir(nurLesbar), /DATA_DIR .* ist nicht beschreibbar/);
  }
});

const SERVER_ENV = (daten, port) => ({
  PATH: process.env.PATH,
  HOME: process.env.HOME,
  NODE_ENV: 'production',
  ...gueltig,
  PLATTFORM_URL: 'https://kryptos.test',
  DATA_DIR: daten,
  PORT: String(port)
});

test('server.js: Startzeile „Konfiguration: …“ ohne SESSION_SECRET und PEM; Exit 1 bei nicht beschreibbarem DATA_DIR', { timeout: 60000 }, async (t) => {
  const tmp = fs.mkdtempSync(pfad.join(os.tmpdir(), 'kr-start-'));
  t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
  // nicht beschreibbar → Exit 1 mit deutscher Meldung, kein Stacktrace
  fs.writeFileSync(pfad.join(tmp, 'datei'), 'x');
  const r = spawnSync(process.execPath, [SERVER], { env: SERVER_ENV(pfad.join(tmp, 'datei', 'data'), 0), encoding: 'utf8', timeout: 20000 });
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stderr, /Kryptos startet nicht\. Konfiguration: DATA_DIR .* ist nicht beschreibbar/);
  assert.doesNotMatch(r.stderr, /\n\s+at /, 'kein Stacktrace');
  // gültig → Startzeile
  const port = 20000 + Math.floor(Math.random() * 20000);
  const kind = spawn(process.execPath, [SERVER], { env: SERVER_ENV(pfad.join(tmp, 'data'), port), stdio: ['ignore', 'pipe', 'pipe'] });
  let log = '';
  kind.stdout.on('data', (d) => (log += d));
  kind.stderr.on('data', (d) => (log += d));
  try {
    let bereit = false;
    for (let i = 0; i < 150 && !bereit && kind.exitCode === null; i++) {
      try {
        bereit = (await fetch(`http://127.0.0.1:${port}/healthz`)).ok;
      } catch {
        await new Promise((res) => setTimeout(res, 100));
      }
    }
    assert.ok(bereit, log);
    for (let i = 0; i < 50 && !/Konfiguration:/.test(log); i++) await new Promise((res) => setTimeout(res, 50));
    const zeile = log.split('\n').find((z) => z.includes('Konfiguration:'));
    assert.ok(zeile, log);
    const z = JSON.parse(zeile.slice(zeile.indexOf('Konfiguration:') + 'Konfiguration:'.length));
    assert.equal(z.plattformId, 'kryptos');
    assert.equal(z.schluessel, 1);
    assert.ok(!log.includes(gueltig.SESSION_SECRET), 'SESSION_SECRET im Log');
    assert.ok(!log.includes('BEGIN') && !log.includes(PEM.split('\n')[1]), 'Schlüssel im Log');
    assert.ok(!fs.existsSync(pfad.join(tmp, 'data', '.schreibprobe')));
  } finally {
    kind.kill('SIGTERM');
    await new Promise((res) => (kind.exitCode !== null ? res() : kind.once('exit', res)));
  }
});

test('konfig_pruefen.js: Exit 0 mit „✔ Konfiguration in Ordnung“, Exit 1 mit Meldung bei fehlendem PORTAL_URL', (t) => {
  const tmp = fs.mkdtempSync(pfad.join(os.tmpdir(), 'kr-kp-'));
  t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
  const env = SERVER_ENV(pfad.join(tmp, 'data'), 0);
  const ok = spawnSync(process.execPath, [KONFIG_PRUEFEN], { env, encoding: 'utf8', timeout: 20000 });
  assert.equal(ok.status, 0, ok.stdout + ok.stderr);
  assert.match(ok.stdout, /✔ Konfiguration in Ordnung/);
  assert.match(ok.stdout, /sha256:[0-9a-f]{16}/);
  assert.ok(!(ok.stdout + ok.stderr).includes(gueltig.SESSION_SECRET) && !(ok.stdout + ok.stderr).includes('BEGIN'));
  const ohne = { ...env };
  delete ohne.PORTAL_URL;
  const f = spawnSync(process.execPath, [KONFIG_PRUEFEN], { env: ohne, encoding: 'utf8', timeout: 20000 });
  assert.equal(f.status, 1);
  assert.match(f.stderr, /Konfiguration: PORTAL_URL fehlt/);
  const p = spawnSync(process.execPath, [KONFIG_PRUEFEN], { env: { ...env, PORTAL_PUBLIC_KEY: PRIVAT_PEM }, encoding: 'utf8', timeout: 20000 });
  assert.equal(p.status, 1);
  assert.match(p.stderr, /privaten Schlüssel/);
  assert.ok(!(p.stdout + p.stderr).includes('BEGIN'));
});
