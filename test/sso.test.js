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

/* ---------- /sso/ende (TECHNIK §6.3, Testfälle §6.12) ---------- */

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const FREMD = crypto.generateKeyPairSync('ed25519');
const LK_KURSE = [
  { id: 'k:17', name: 'LK Informatik 13', rolle: 'lehrkraft' },
  { id: 'k:18', name: 'GK Informatik 12', rolle: 'lehrkraft' }
];

/** /sso/start mit neuem (oder gegebenem) Client, dann /sso/ende mit Token bzw. Parametern. */
async function ende(app, { token, felder, key, ziel = '/', fehler, state, client: c = H.client(app) } = {}) {
  const u = await H.ssoStart(c, ziel);
  const st = state === undefined ? u.searchParams.get('state') : state;
  const tk = fehler !== undefined ? undefined : token !== undefined ? token : H.ssoToken(felder, { key, app });
  const r = await c.get(H.endeUrl({ token: tk, state: st === null ? undefined : st, ziel: u.searchParams.get('ziel'), fehler }));
  return { c, r, token: tk };
}

const sitzungsCookies = (r) => (r.headers['set-cookie'] || []).filter((x) => /^kr_[sl]=[^;]/.test(x));
const zaehle = (app, sql, ...p) => app.locals.db.prepare(sql).get(...p).n;

function erwarteFehler(r, status, grund) {
  assert.equal(r.status, status, `Status (Grund ${r.headers['x-kryptos-grund']})`);
  assert.equal(r.headers['x-kryptos-grund'], grund);
  assert.equal(r.headers['referrer-policy'], 'no-referrer');
  assert.match(r.headers['cache-control'], /no-store/);
  assert.match(r.headers['content-type'], /text\/html/);
  assert.deepEqual(sitzungsCookies(r), [], 'keine Sitzung');
}

test('T1 gültig: 302 auf ziel, kr_s gesetzt, Konto s:1042, Teilnahme in k:17, state-Cookie gelöscht', async () => {
  const app = H.makeApp();
  const { c, r } = await ende(app, { ziel: '/spiel#w2' });
  assert.equal(r.status, 302);
  assert.equal(r.headers.location, '/spiel#w2');
  assert.equal(r.headers['referrer-policy'], 'no-referrer');
  assert.match(r.headers['cache-control'], /no-store/);
  const cookies = r.headers['set-cookie'].join('\n');
  assert.match(cookies, /kr_s=[^;]+;.*HttpOnly/i);
  assert.match(cookies, /kr_l=;/, 'Lehrkraft-Cookie gelöscht');
  assert.match(cookies, /kr_sso_state=;.*Path=\/sso/, 'state-Cookie gelöscht');
  const db = app.locals.db;
  const konto = db.prepare("SELECT * FROM konten WHERE sub = 's:1042'").get();
  assert.deepEqual([konto.rolle, konto.name], ['schueler', 'Lena S.']);
  assert.ok(konto.last_login_at);
  const k = db.prepare("SELECT * FROM kurse WHERE kurs_id = 'k:17'").get();
  assert.equal(k.name, 'LK Informatik 13');
  assert.equal(k.aktiv, 1);
  assert.match(k.board_schluessel, /^[A-Za-z0-9_-]{12}$/);
  assert.deepEqual(app.locals.services.kurse.einstellungen(k.einstellungen).welten.length > 0, true);
  const t = db.prepare("SELECT * FROM schueler WHERE sub = 's:1042'").all();
  assert.equal(t.length, 1);
  assert.deepEqual([t[0].kurs_id, t[0].name, t[0].name_key, t[0].aktiv], [k.id, 'Lena S.', 'lena s.', 1]);
  // Sitzung funktioniert
  const p = (await c.get('/api/profil').expect(200)).body;
  assert.equal(p.name, 'Lena S.');
  assert.equal(zaehle(app, "SELECT COUNT(*) AS n FROM sso_jti WHERE jti LIKE 's:%'"), 1);
});

test('T1 Lehrkraft und Superadmin: kurs_lehrkraefte, Weiterleitung auf /lehrer, kr_s gelöscht', async () => {
  const app = H.makeApp();
  const { c, r } = await ende(app, { felder: { sub: 'l:5', rolle: 'lehrkraft', name: 'Frau Lehrer', kurse: LK_KURSE } });
  assert.equal(r.status, 302);
  assert.equal(r.headers.location, '/lehrer');
  const cookies = r.headers['set-cookie'].join('\n');
  assert.match(cookies, /kr_l=[^;]+;.*HttpOnly/i);
  assert.match(cookies, /kr_s=;/);
  assert.equal(zaehle(app, "SELECT COUNT(*) AS n FROM kurs_lehrkraefte WHERE sub = 'l:5' AND aktiv = 1"), 2);
  assert.equal(zaehle(app, 'SELECT COUNT(*) AS n FROM schueler'), 0);
  const kurse = (await c.get('/api/lehrer/kurse').expect(200)).body;
  assert.deepEqual(kurse.map((k) => k.kurs).sort(), ['k:17', 'k:18']);
  // Superadmin ohne eigene Kurse sieht alle Kurse der Plattform
  const { c: a, r: ra } = await ende(app, { felder: { sub: 'a:1', rolle: 'superadmin', name: 'Admin', kurse: [] }, ziel: '/lehrer#/admin' });
  assert.equal(ra.headers.location, '/lehrer#/admin');
  assert.equal((await a.get('/api/lehrer/kurse')).body.length, 2);
  assert.equal((await a.get('/api/admin/inhalte')).status, 200);
});

test('T2 falsche Signatur → 401 signatur', async () => {
  const { r } = await ende(H.makeApp(), { key: FREMD.privateKey });
  erwarteFehler(r, 401, 'signatur');
});

test('T3 aud algoquest → 401 aud', async () => {
  const { r } = await ende(H.makeApp(), { felder: { aud: 'algoquest' } });
  erwarteFehler(r, 401, 'aud');
});

test('T4 abgelaufen → 401 abgelaufen', async () => {
  const jetzt = Math.floor(Date.now() / 1000);
  const { r } = await ende(H.makeApp(), { felder: { iat: jetzt - 200, exp: jetzt - 110 } });
  erwarteFehler(r, 401, 'abgelaufen');
});

test('T4 mit App-Uhr: Token läuft nach 90 s ab', async () => {
  const uhr = H.uhr(Date.now());
  const app = H.makeApp({ now: uhr });
  const c = H.client(app);
  const u = await H.ssoStart(c);
  const token = H.ssoToken({}, { app });
  uhr.vor(91 * 1000);
  const r = await c.get(H.endeUrl({ token, state: u.searchParams.get('state') }));
  erwarteFehler(r, 401, 'abgelaufen');
});

test('T5 exp−iat=121 → 401 dauer', async () => {
  const jetzt = Math.floor(Date.now() / 1000);
  const { r } = await ende(H.makeApp(), { felder: { iat: jetzt, exp: jetzt + 121 } });
  erwarteFehler(r, 401, 'dauer');
  // genau 120 s ist erlaubt
  const { r: ok } = await ende(H.makeApp(), { felder: { iat: jetzt, exp: jetzt + 120 } });
  assert.equal(ok.status, 302);
});

test('T6 iss falsch → 401 iss; weitere Gründe: version, format', async () => {
  const app = H.makeApp();
  erwarteFehler((await ende(app, { felder: { iss: 'https://boese.example' } })).r, 401, 'iss');
  erwarteFehler((await ende(app, { felder: { v: 2 } })).r, 401, 'version');
  erwarteFehler((await ende(app, { token: 'kein.gueltiges.token' })).r, 401, 'format');
  erwarteFehler((await ende(app, { token: '' })).r, 401, 'format');
});

test('T7 wiederverwendet → 401 wiederverwendet', async () => {
  const app = H.makeApp();
  const { r, token } = await ende(app);
  assert.equal(r.status, 302);
  const { r: r2 } = await ende(app, { token });
  erwarteFehler(r2, 401, 'wiederverwendet');
});

test('T7b wiederverwendet nach Neustart (gleiche DB) → 401', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kryptos-sso-'));
  const dbFile = path.join(dir, 'kryptos.db');
  try {
    const app1 = H.makeApp({ dbFile });
    const { r, token } = await ende(app1);
    assert.equal(r.status, 302);
    app1.locals.db.close();
    // „Neustart“: neue App, gleiche Datei, frischer Speicher
    const app2 = H.makeApp({ dbFile });
    const { r: r2 } = await ende(app2, { token });
    erwarteFehler(r2, 401, 'wiederverwendet');
    // ein neues Token geht weiterhin
    assert.equal((await ende(app2)).r.status, 302);
    app2.locals.db.close();
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('T8 state fehlt / ≠ Cookie / ohne Cookie → 401 state; state-Cookie ist danach verbraucht', async () => {
  const app = H.makeApp();
  erwarteFehler((await ende(app, { state: null })).r, 401, 'state');
  erwarteFehler((await ende(app, { state: 'A'.repeat(22) })).r, 401, 'state');
  // ohne Cookie (anderer Client als beim Start)
  const c = H.client(app);
  const u = await H.ssoStart(c);
  const r = await H.client(app).get(H.endeUrl({ token: H.ssoToken({}, { app }), state: u.searchParams.get('state') }));
  erwarteFehler(r, 401, 'state');
  // state-Cookie wird beim ersten /sso/ende gelöscht: zweiter Versuch mit demselben state scheitert
  const { c: c2, r: ok } = await ende(app);
  assert.equal(ok.status, 302);
  const r3 = await c2.get(H.endeUrl({ token: H.ssoToken({}, { app }), state: 'egal-aber-lang-genug-1234' }));
  erwarteFehler(r3, 401, 'state');
  // Fehlerseite ohne reflektierten Inhalt
  assert.doesNotMatch(r3.text, /egal-aber/);
});

test('T9 fehler=keine_berechtigung → 403 Seite, keine Sitzung; abgebrochen → 302 /?abgebrochen=1; anderer → 401 portal', async () => {
  const app = H.makeApp();
  const { r } = await ende(app, { fehler: 'keine_berechtigung' });
  assert.equal(r.status, 403);
  assert.match(r.text, /nicht freigeschaltet/);
  assert.match(r.text, /href="\/gast"/);
  assert.match(r.text, /href="\/sso\/portal"/);
  assert.equal(r.headers['referrer-policy'], 'no-referrer');
  assert.deepEqual(sitzungsCookies(r), []);
  const { r: ab } = await ende(app, { fehler: 'abgebrochen' });
  assert.equal(ab.status, 302);
  assert.equal(ab.headers.location, '/?abgebrochen=1');
  assert.deepEqual(sitzungsCookies(ab), []);
  erwarteFehler((await ende(app, { fehler: 'etwas_anderes' })).r, 401, 'portal');
  // fehler ohne gültigen state → state
  erwarteFehler((await ende(app, { fehler: 'keine_berechtigung', state: 'falsch-falsch-falsch-falsch' })).r, 401, 'state');
  assert.equal(zaehle(app, 'SELECT COUNT(*) AS n FROM konten'), 0);
  // /sso/portal führt zum Portal
  assert.equal((await H.client(app).get('/sso/portal')).headers.location, 'https://portal.test/');
});

test('T10 ziel=//boese.example, /\\boese, https://… → Startseite der Rolle', async () => {
  const app = H.makeApp();
  for (const boese of ['//boese.example', '/\\boese', 'https://boese.example/x']) {
    // das Portal reicht ziel unverändert zurück – auch ein böses
    const c = H.client(app);
    const u = await H.ssoStart(c, '/spiel');
    const r = await c.get(H.endeUrl({ token: H.ssoToken({}, { app }), state: u.searchParams.get('state'), ziel: boese }));
    assert.equal(r.status, 302, boese);
    assert.equal(r.headers.location, '/spiel', boese);
    const c2 = H.client(app);
    const u2 = await H.ssoStart(c2);
    const r2 = await c2.get(H.endeUrl({ token: H.ssoToken({ sub: 'l:9', rolle: 'lehrkraft', name: 'Herr K.', kurse: [] }, { app }), state: u2.searchParams.get('state'), ziel: boese }));
    assert.equal(r2.headers.location, '/lehrer', boese);
  }
});

test('Rolle passt nicht zum sub-Präfix, Kurs-id oder Kursrolle falsch, Name leer/zu lang → 401 inhalt', async () => {
  const app = H.makeApp();
  for (const felder of [
    { sub: 's:1', rolle: 'lehrkraft' },
    { sub: 'l:1', rolle: 'schueler' },
    { sub: 'a:1', rolle: 'lehrkraft', kurse: [] },
    { sub: 'x:1' },
    { sub: 's:abc' },
    { rolle: 'gast', sub: 's:1' },
    { kurse: [{ id: '17', name: 'LK', rolle: 'mitglied' }] },
    { kurse: [{ id: 'k:17', name: 'LK', rolle: 'lehrkraft' }] },
    { kurse: [{ id: 'k:17', name: '', rolle: 'mitglied' }] },
    { kurse: [{ id: 'k:17', name: 'x'.repeat(81), rolle: 'mitglied' }] },
    { kurse: 'k:17' },
    { name: '' },
    { name: 'x'.repeat(61) },
    { name: 42 },
    { sub: 'l:2', rolle: 'lehrkraft', kurse: [{ id: 'k:17', name: 'LK', rolle: 'mitglied' }] }
  ]) {
    erwarteFehler((await ende(app, { felder })).r, 401, 'inhalt');
  }
  assert.equal(zaehle(app, 'SELECT COUNT(*) AS n FROM konten'), 0);
  assert.equal(zaehle(app, 'SELECT COUNT(*) AS n FROM kurse'), 0);
  // > 200 Kurse passen nicht in ein Token (jwt.pruefe: ≤ 8192 Zeichen) – Regel direkt prüfen
  const { pruefeInhalt } = require('../src/verbund/sso');
  const basis = { sub: 's:1', rolle: 'schueler', name: 'Mika R.' };
  const kurse = (n) => Array.from({ length: n }, (_, i) => ({ id: `k:${i}`, name: 'K', rolle: 'mitglied' }));
  assert.equal(pruefeInhalt({ ...basis, kurse: kurse(200) }), true);
  assert.equal(pruefeInhalt({ ...basis, kurse: kurse(201) }), false);
});

test('Schlüsselwechsel: Token mit Schlüssel 2 von 2 angenommen (auch einzeilig mit „\\n“)', async () => {
  const alt = FREMD.publicKey.export({ type: 'spki', format: 'pem' });
  const beide = (alt + H.PORTAL_PEM).trim().replace(/\n/g, '\\n');
  const app = H.makeApp({ portalPublicKey: beide });
  assert.equal(app.locals.konfig.schluessel.length, 2);
  assert.equal((await ende(app)).r.status, 302, 'Schlüssel 2');
  assert.equal((await ende(app, { key: FREMD.privateKey })).r.status, 302, 'Schlüssel 1');
  const nurAlt = H.makeApp({ portalPublicKey: alt });
  erwarteFehler((await ende(nurAlt)).r, 401, 'signatur');
});

test('Kursabgleich: zweites Token ohne k:17 → Teilnahme inaktiv, Lernstand bleibt; k:19 neu, Namen aktualisiert', async () => {
  const app = H.makeApp();
  const db = app.locals.db;
  const k17 = { id: 'k:17', name: 'LK Informatik 13', rolle: 'mitglied' };
  const k18 = { id: 'k:18', name: 'AG Krypto', rolle: 'mitglied' };
  const c = await H.sso(app, { kurse: [k17, k18] });
  assert.equal(c.antwort.status, 302);
  // erste aktive Teilnahme nach Kursname: „AG Krypto“
  const t18 = db.prepare("SELECT s.id FROM schueler s JOIN kurse k ON k.id = s.kurs_id WHERE k.kurs_id = 'k:18'").get().id;
  assert.equal(c.id, t18);
  // Lernstand in k:17
  const t17 = db.prepare("SELECT s.id FROM schueler s JOIN kurse k ON k.id = s.kurs_id WHERE k.kurs_id = 'k:17'").get().id;
  db.prepare("INSERT INTO fortschritt (schueler_id, aufgabe_id, status, punkte, updated_at) VALUES (?, 'W9-L1-01', 'geloest', 10, ?)").run(t17, new Date().toISOString());
  // zweites Token: k:17 fehlt, k:18 umbenannt, k:19 neu; Name geändert
  const c2 = await H.sso(app, { name: 'Lena Sch.', kurse: [{ ...k18, name: 'AG Kryptologie' }, { id: 'k:19', name: 'Projektkurs', rolle: 'mitglied' }] });
  assert.equal(c2.antwort.status, 302);
  const zeilen = db
    .prepare("SELECT k.kurs_id AS kurs, k.name AS kursName, s.aktiv, s.name FROM schueler s JOIN kurse k ON k.id = s.kurs_id WHERE s.sub = 's:1042' ORDER BY k.kurs_id")
    .all();
  // k:17 fehlt im Token: Teilnahme inaktiv, Name und Kursname bleiben auf dem letzten Stand
  assert.deepEqual(zeilen.map((z) => [z.kurs, z.kursName, z.aktiv, z.name]), [
    ['k:17', 'LK Informatik 13', 0, 'Lena S.'],
    ['k:18', 'AG Kryptologie', 1, 'Lena Sch.'],
    ['k:19', 'Projektkurs', 1, 'Lena Sch.']
  ]);
  assert.equal(zaehle(app, 'SELECT COUNT(*) AS n FROM fortschritt WHERE schueler_id = ?', t17), 1, 'Lernstand bleibt');
  assert.equal(db.prepare("SELECT name FROM konten WHERE sub = 's:1042'").get().name, 'Lena Sch.');
  assert.equal(zaehle(app, 'SELECT COUNT(*) AS n FROM kurse'), 3);
  // Kurs wieder im Token → Teilnahme wieder aktiv, gleiche Zeile
  await H.sso(app, { kurse: [k17] });
  assert.equal(db.prepare('SELECT aktiv FROM schueler WHERE id = ?').get(t17).aktiv, 1);
  assert.equal(zaehle(app, "SELECT COUNT(*) AS n FROM schueler WHERE sub = 's:1042'"), 3);
});

test('Kursabgleich Lehrkraft: fehlender Kurs → kurs_lehrkraefte inaktiv; gesperrter Kurs bleibt gesperrt (aktiv nur über die Verbund-API)', async () => {
  const app = H.makeApp();
  const db = app.locals.db;
  await H.sso(app, { sub: 'l:5', rolle: 'lehrkraft', name: 'Frau Lehrer', kurse: LK_KURSE });
  db.prepare("UPDATE kurse SET aktiv = 0 WHERE kurs_id = 'k:18'").run();
  const c = await H.sso(app, { sub: 'l:5', rolle: 'lehrkraft', name: 'Frau Lehrer', kurse: [{ ...LK_KURSE[1], name: 'GK neu' }] });
  const zeilen = db.prepare("SELECT k.kurs_id AS kurs, kl.aktiv FROM kurs_lehrkraefte kl JOIN kurse k ON k.id = kl.kurs_id WHERE kl.sub = 'l:5' ORDER BY 1").all();
  assert.deepEqual(zeilen.map((z) => [z.kurs, z.aktiv]), [['k:17', 0], ['k:18', 1]]);
  const k18 = db.prepare("SELECT * FROM kurse WHERE kurs_id = 'k:18'").get();
  assert.deepEqual([k18.name, k18.aktiv], ['GK neu', 0]);
  assert.deepEqual((await c.get('/api/lehrer/kurse')).body.map((k) => k.kurs), ['k:18']);
});

test('Schüler nur in gesperrten Kursen → 403 kurs-gesperrt ohne Sitzung', async () => {
  const app = H.makeApp();
  await H.sso(app);
  app.locals.db.prepare("UPDATE kurse SET aktiv = 0 WHERE kurs_id = 'k:17'").run();
  const { r } = await ende(app);
  erwarteFehler(r, 403, 'kurs-gesperrt');
  assert.match(r.text, /gesperrt|abgeschaltet/);
  // Schüler-Token ohne Kurse (sollte das Portal nicht senden) → ebenfalls ohne Sitzung
  erwarteFehler((await ende(app, { felder: { sub: 's:77', kurse: [] } })).r, 403, 'kurs-gesperrt');
});

test('Schülername aus dem Portal, der die Kernregel verletzt, wird für die Teilnahme bereinigt', async () => {
  const app = H.makeApp();
  await H.sso(app, { sub: 's:5', name: 'Ü' });
  await H.sso(app, { sub: 's:6', name: 'Mika <R.> ' + 'x'.repeat(40) });
  const db = app.locals.db;
  const n5 = db.prepare("SELECT name, name_key FROM schueler WHERE sub = 's:5'").get();
  assert.ok(n5.name.length >= 2 && n5.name.length <= 30, n5.name);
  const n6 = db.prepare("SELECT name FROM schueler WHERE sub = 's:6'").get().name;
  assert.ok(n6.startsWith('Mika R.') && n6.length <= 30, n6);
  // Konto behält den Portal-Namen
  assert.equal(db.prepare("SELECT name FROM konten WHERE sub = 's:5'").get().name, 'Ü');
});

test('/sso/*: Token und URL landen nie im Log', async () => {
  const logs = [];
  const app = H.makeApp({ log: (m) => logs.push(String(m)) });
  const { token } = await ende(app);
  await ende(app, { token });
  await ende(app, { key: FREMD.privateKey });
  const sig = token.split('.')[2];
  for (const m of logs) {
    assert.ok(!m.includes(sig), 'Token im Log');
    assert.ok(!m.includes('/sso/ende'), 'URL im Log');
  }
});
