'use strict';
// Plattform-Verbund InfoLabs, Phase 1 (VERTRAG.md v1.1 §5–§7, Testliste docs/INTEGRATION.md §5 im Repo frankjuchim/labs):
// SSO-Empfänger /sso/start + /sso/ende, Verbund-API, Manifest mit SSO.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const request = require('supertest');
const H = require('./helpers');
const { signiere } = require('../src/jwt');
const { pruefeManifest } = require('../scripts/vertrag_pruefen');

const PORTAL = 'https://portal.example';
const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
const fremd = crypto.generateKeyPairSync('ed25519');
// wie in CapRover: einzeilig mit „\n“
const PEM_EINZEILIG = publicKey.export({ type: 'spki', format: 'pem' }).trim().replace(/\n/g, '\\n');
const UMGEBUNG = { PORTAL_URL: PORTAL, PORTAL_PUBLIC_KEY: PEM_EINZEILIG, AUTH_MODUS: 'beides', PLATTFORM_URL: 'https://algoquest.example' };

const jetzt = () => Math.floor(Date.now() / 1000);
let jtiZaehler = 0;
function token(felder = {}, { key = privateKey } = {}) {
  const iat = jetzt();
  return signiere(
    {
      iss: PORTAL,
      aud: 'algoquest',
      sub: 's:1042',
      rolle: 'schueler',
      name: 'Lena S.',
      kurse: [{ id: 'k:17', name: 'LK Informatik 13', rolle: 'mitglied' }],
      iat,
      exp: iat + 90,
      jti: `jti-${process.pid}-${++jtiZaehler}-${crypto.randomBytes(8).toString('hex')}`,
      v: 1,
      ...felder
    },
    key
  );
}
const verbundToken = (zweck, felder = {}, o) => token({ sub: 'portal', zweck, rolle: undefined, name: undefined, kurse: undefined, exp: jetzt() + 50, ...felder }, o);

const app = (extra = {}) => H.makeApp({ umgebung: UMGEBUNG, ...extra });

/** /sso/start aufrufen: liefert state (aus der Weiterleitung) – der Agent hat danach das state-Cookie. */
async function start(c, ziel = '/spiel') {
  const r = await c.get('/sso/start?ziel=' + encodeURIComponent(ziel)).expect(302);
  const u = new URL(r.headers.location);
  assert.equal(u.origin + u.pathname, PORTAL + '/sso/autorisieren');
  return u;
}

async function ssoAnmelden(a, felder = {}, ziel = '/spiel') {
  const c = H.client(a);
  const u = await start(c, ziel);
  const r = await c.get(`/sso/ende?token=${token(felder)}&state=${u.searchParams.get('state')}&ziel=${encodeURIComponent(u.searchParams.get('ziel'))}`);
  return { c, r };
}

test('Manifest mit SSO: vertragsgemäß (v1.1), ssoStart/ssoEnde, auth.sso true', async () => {
  const m = (await request(app()).get('/api/plattform').expect(200)).body;
  assert.deepEqual(pruefeManifest(m), []);
  assert.equal(m.vertrag, '1.2');
  assert.equal(m.urls.ssoStart, '/sso/start');
  assert.equal(m.urls.ssoEnde, '/sso/ende');
  assert.deepEqual(m.auth, { modus: 'beides', portal: PORTAL, sso: true });
  // ohne Schlüssel kein SSO
  const m2 = (await request(H.makeApp({ umgebung: { PORTAL_URL: PORTAL, AUTH_MODUS: 'beides' } })).get('/api/plattform')).body;
  assert.equal(m2.auth.sso, false);
  assert.equal(m2.urls.ssoStart, null);
});

test('/sso/start: state ≥ 22 Zeichen im Cookie, Rücksprung und ziel; unsichere Ziele → /', async () => {
  const c = H.client(app());
  const r = await c.get('/sso/start?ziel=%2Fspiel').expect(302);
  const u = new URL(r.headers.location);
  assert.equal(u.searchParams.get('plattform'), 'algoquest');
  assert.equal(u.searchParams.get('ruecksprung'), 'https://algoquest.example/sso/ende');
  assert.match(u.searchParams.get('state'), /^[A-Za-z0-9\-_.~]{22,}$/);
  assert.equal(u.searchParams.get('ziel'), '/spiel');
  const cookie = r.headers['set-cookie'].find((x) => x.startsWith('aq_sso_state='));
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=Lax/i);
  assert.match(cookie, /Max-Age=600/);
  for (const boese of ['//boese.example', '/\\boese.example', 'https://boese.example', 'spiel']) {
    const x = new URL((await c.get('/sso/start?ziel=' + encodeURIComponent(boese))).headers.location);
    assert.equal(x.searchParams.get('ziel'), '/', boese);
  }
});

test('Schüler: gültiges Token → Konto, Kurs, Sitzung; Weiterleitung auf ziel; no-referrer; Profil ohne Code', async () => {
  const a = app();
  const { c, r } = await ssoAnmelden(a, {}, '/spiel');
  assert.equal(r.status, 302);
  assert.equal(r.headers.location, '/spiel');
  assert.equal(r.headers['referrer-policy'], 'no-referrer');
  assert.match(r.headers['cache-control'], /no-store/);
  const s = (await c.get('/api/sitzung').expect(200)).body;
  assert.equal(s.schueler.name, 'Lena S.');
  assert.equal(s.schueler.kurs, 'LK Informatik 13');
  assert.equal(s.schueler.portal, true);
  assert.deepEqual(s.verbund, { portal: PORTAL, sso: true, lokal: true });
  const p = (await c.get('/api/profil').expect(200)).body;
  assert.equal(p.portal, true);
  assert.equal(p.code, '');
  // Upsert: zweite Anmeldung mit neuem Namen legt nichts doppelt an
  await ssoAnmelden(a, { name: 'Lena Sch.' });
  const db = a.locals.db;
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM schueler WHERE sub = 's:1042'").get().n, 1);
  assert.equal(db.prepare("SELECT name FROM schueler WHERE sub = 's:1042'").get().name, 'Lena Sch.');
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM kurse WHERE portal_id = 'k:17'").get().n, 1);
  // Portal-Schüler können sich nicht lokal mit Name + leerem Code anmelden
  assert.equal((await H.client(a).post('/api/schueler/anmelden').send({ name: 'Lena Sch.', code: '' })).status, 401);
});

test('Schüler in zwei Kursen: Kurswechsel; Kurs fehlt im Token → kein Zugang mehr, Lernstand bleibt', async () => {
  const a = app();
  const zwei = [
    { id: 'k:17', name: 'LK Informatik 13', rolle: 'mitglied' },
    { id: 'k:18', name: 'AG Informatik', rolle: 'mitglied' }
  ];
  const { c } = await ssoAnmelden(a, { sub: 's:7', name: 'Tom K.', kurse: zwei });
  const s = (await c.get('/api/sitzung')).body;
  assert.equal(s.schueler.kurse.length, 2);
  const anderer = s.schueler.kurse.find((k) => k.name === 'AG Informatik');
  await c.post('/api/kurs-wechseln').send({ kursId: anderer.id }).expect(200);
  assert.equal((await c.get('/api/sitzung')).body.schueler.kurs, anderer.name);
  // fremder Kurs → 404
  assert.equal((await c.post('/api/kurs-wechseln').send({ kursId: 99999 })).status, 404);
  // neue Anmeldung nur noch mit k:17 → Zeile in k:18 ohne Zugang, aber vorhanden
  const { c: c2 } = await ssoAnmelden(a, { sub: 's:7', name: 'Tom K.', kurse: [zwei[0]] });
  assert.equal((await c2.get('/api/sitzung')).body.schueler.kurse.length, 1); // nur ein Kurs → keine Auswahl im Kopf
  assert.equal((await c.get('/api/sitzung')).body.schueler, null); // alte Sitzung in k:18 endet
  const db = a.locals.db;
  assert.deepEqual(db.prepare("SELECT k.portal_id AS p, s.zugang AS z FROM schueler s JOIN kurse k ON k.id = s.kurs_id WHERE s.sub = 's:7' ORDER BY p").all().map((x) => [x.p, x.z]), [['k:17', 1], ['k:18', 0]]);
  // ziel mit ?kurs= wählt den Kurs
  const { r } = await ssoAnmelden(a, { sub: 's:7', name: 'Tom K.', kurse: zwei }, '/spiel?kurs=k:18');
  assert.equal(r.headers.location, '/spiel?kurs=k:18');
});

test('Lehrkraft: Kurse laut Token (auch Mitlehrkraft), nur diese sichtbar; Superadmin aus dem Portal sieht alle', async () => {
  const a = app();
  // Schüler zuerst: Kurs k:17 entsteht
  await ssoAnmelden(a);
  const { c, r } = await ssoAnmelden(a, { sub: 'l:5', rolle: 'lehrkraft', name: 'Frau Muster', kurse: [{ id: 'k:17', name: 'LK Informatik 13', rolle: 'lehrkraft' }] }, '/');
  assert.equal(r.headers.location, '/lehrer');
  const ich = (await c.get('/api/lehrer/ich').expect(200)).body;
  assert.equal(ich.portal, true);
  assert.equal(ich.name, 'Frau Muster');
  const kurse = (await c.get('/api/lehrer/kurse').expect(200)).body;
  assert.equal(kurse.length, 1);
  assert.equal(kurse[0].portal, true);
  const sch = (await c.get(`/api/lehrer/kurse/${kurse[0].id}/schueler`).expect(200)).body;
  assert.deepEqual(sch.map((x) => [x.name, x.portal]), [['Lena S.', true]]);
  // Portal-Lehrkräfte legen keine Kurse an, Portal-Kurse werden nicht hier gelöscht, Portal-Schüler nicht umbenannt
  assert.equal((await c.post('/api/lehrer/kurse').send({ name: 'Neuer Kurs' })).status, 403);
  assert.equal((await c.delete(`/api/lehrer/kurse/${kurse[0].id}`).send({ bestaetigung: 'LK Informatik 13' })).status, 403);
  assert.equal((await c.patch(`/api/lehrer/kurse/${kurse[0].id}/schueler/${sch[0].id}`).send({ name: 'X Y' })).status, 403);
  // Einstellungen ändern geht
  await c.patch(`/api/lehrer/kurse/${kurse[0].id}`).send({ einstellungen: { scoreboard: false } }).expect(200);
  // Mitlehrkraft
  const { c: m } = await ssoAnmelden(a, { sub: 'l:6', rolle: 'lehrkraft', name: 'Herr Beispiel', kurse: [{ id: 'k:17', name: 'LK Informatik 13', rolle: 'lehrkraft' }] }, '/lehrer');
  assert.equal((await m.get('/api/lehrer/kurse')).body.length, 1);
  // Kurs fehlt im nächsten Token → Zugang weg
  const { c: m2 } = await ssoAnmelden(a, { sub: 'l:6', rolle: 'lehrkraft', name: 'Herr Beispiel', kurse: [] }, '/lehrer');
  assert.equal((await m2.get('/api/lehrer/kurse')).body.length, 0);
  assert.equal((await m2.get(`/api/lehrer/kurse/${kurse[0].id}`)).status, 404);
  // lokale Lehrkraft sieht den Portal-Kurs nicht
  const admin = await H.adminClient(a);
  const lk = await H.lehrkraftClient(a, admin);
  assert.equal((await lk.get('/api/lehrer/kurse')).body.length, 0);
  // Superadmin aus dem Portal: alle Kurse, Verwaltung erlaubt
  const { c: su } = await ssoAnmelden(a, { sub: 'a:1', rolle: 'superadmin', name: 'Superadmin', kurse: [{ id: 'k:17', name: 'LK Informatik 13', rolle: 'lehrkraft' }] }, '/lehrer');
  assert.ok((await su.get('/api/lehrer/kurse')).body.length >= 1);
  await su.get('/api/admin/lehrkraefte').expect(200);
  // lokaler Superadmin bleibt unverändert anmeldbar
  await H.adminClient(a);
});

test('Token abgelehnt: falsche Signatur, aud, iss, abgelaufen, exp − iat > 120, Wiederverwendung, falsche Inhalte', async () => {
  const a = app();
  const faelle = [
    ['Signatur', token({}, { key: fremd.privateKey })],
    ['aud', token({ aud: 'andere' })],
    ['iss', token({ iss: 'https://boese.example' })],
    ['abgelaufen', token({ iat: jetzt() - 200, exp: jetzt() - 100 })],
    ['Dauer', token({ iat: jetzt(), exp: jetzt() + 121 })],
    ['v', token({ v: 2 })],
    ['sub', token({ sub: 'x:1' })],
    ['rolle passt nicht zu sub', token({ sub: 'l:1', rolle: 'schueler' })],
    ['kurse', token({ kurse: 'k:17' })],
    ['kaputt', 'abc.def.ghi']
  ];
  for (const [name, t] of faelle) {
    const c = H.client(a);
    const u = await start(c);
    const r = await c.get(`/sso/ende?token=${encodeURIComponent(t)}&state=${u.searchParams.get('state')}`);
    assert.equal(r.status, 401, name);
    assert.equal(r.headers['referrer-policy'], 'no-referrer', name);
    assert.equal((await c.get('/api/sitzung')).body.schueler, null, name);
  }
  // Wiederverwendung desselben Tokens (neuer state)
  const t = token();
  const c = H.client(a);
  let u = await start(c);
  assert.equal((await c.get(`/sso/ende?token=${t}&state=${u.searchParams.get('state')}`)).status, 302);
  u = await start(c);
  assert.equal((await c.get(`/sso/ende?token=${t}&state=${u.searchParams.get('state')}`)).status, 401);
  assert.equal(a.locals.db.prepare("SELECT COUNT(*) AS n FROM schueler WHERE sub = 's:1042'").get().n, 1);
});

test('state fehlt oder passt nicht → 401; state-Cookie wird gelöscht', async () => {
  const a = app();
  // ohne Cookie
  assert.equal((await H.client(a).get(`/sso/ende?token=${token()}&state=abcdefghijklmnopqrstuvwxyz`)).status, 401);
  // falscher state
  const c = H.client(a);
  await start(c);
  const r = await c.get(`/sso/ende?token=${token()}&state=falsch-falsch-falsch-falsch`);
  assert.equal(r.status, 401);
  assert.ok(r.headers['set-cookie'].some((x) => x.startsWith('aq_sso_state=;')));
  // state nur einmal verwendbar
  const c2 = H.client(a);
  const u = await start(c2);
  assert.equal((await c2.get(`/sso/ende?token=${token()}&state=${u.searchParams.get('state')}`)).status, 302);
  assert.equal((await c2.get(`/sso/ende?token=${token()}&state=${u.searchParams.get('state')}`)).status, 401);
});

test('Fehler vom Portal: keine_berechtigung → Hinweisseite, abgebrochen → Startseite; ziel=//boese.example → /', async () => {
  const a = app();
  let c = H.client(a);
  let u = await start(c);
  let r = await c.get(`/sso/ende?fehler=keine_berechtigung&state=${u.searchParams.get('state')}`);
  assert.equal(r.status, 403);
  assert.match(r.text, /deine Lehrkraft hat diese Plattform für deinen Kurs nicht freigeschaltet/);
  assert.match(r.text, /\/gast/);
  c = H.client(a);
  u = await start(c);
  r = await c.get(`/sso/ende?fehler=abgebrochen&state=${u.searchParams.get('state')}`);
  assert.equal(r.status, 302);
  assert.equal(r.headers.location, '/');
  c = H.client(a);
  u = await start(c);
  r = await c.get(`/sso/ende?token=${token()}&state=${u.searchParams.get('state')}&ziel=${encodeURIComponent('//boese.example')}`);
  assert.equal(r.status, 302);
  assert.equal(r.headers.location, '/spiel'); // Startseite der Schüler
  c = H.client(a);
  u = await start(c);
  r = await c.get(`/sso/ende?token=${token({ sub: 'l:9', rolle: 'lehrkraft', name: 'Frau X', kurse: [] })}&state=${u.searchParams.get('state')}&ziel=${encodeURIComponent('/\\boese.example')}`);
  assert.equal(r.headers.location, '/lehrer');
});

test('Abmelden: nur hier bzw. „Überall abmelden“ über das Portal; stille Neuanmeldung bei abgelaufener Sitzung', async () => {
  const a = app();
  const { c } = await ssoAnmelden(a);
  await c.get('/spiel').expect(200);
  const r = await c.get('/sso/abmelden').expect(302);
  assert.equal(r.headers.location, `${PORTAL}/sso/abmelden?ruecksprung=${encodeURIComponent('https://algoquest.example/')}`);
  assert.equal((await c.get('/api/sitzung')).body.schueler, null);
  // nach „Überall abmelden“ keine stille Neuanmeldung (Hinweis-Cookie gelöscht)
  await c.get('/spiel').expect(200);
  // Sitzung weg, Hinweis-Cookie da → still zum SSO
  const { c: c2 } = await ssoAnmelden(a);
  await c2.post('/api/schueler/abmelden').send({}).expect(200);
  const s = await c2.get('/spiel');
  assert.equal(s.status, 302);
  assert.equal(s.headers.location, '/sso/start?ziel=%2Fspiel');
  // ohne Portal-Anmeldung: keine Weiterleitung
  await H.client(a).get('/spiel').expect(200);
});

test('AUTH_MODUS=portal: lokale Anmeldung aus, geschützte Seiten leiten still zum SSO; lokal: kein SSO', async () => {
  const a = H.makeApp({ umgebung: { ...UMGEBUNG, AUTH_MODUS: 'portal' } });
  const c = H.client(a);
  assert.equal((await c.post('/api/schueler/anmelden').send({ name: 'X', code: 'ABC-234' })).status, 403);
  assert.equal((await c.post('/api/lehrer/anmelden').send({ email: H.ADMIN_EMAIL, passwort: H.ADMIN_PW })).status, 403);
  assert.equal((await c.get('/lehrer')).headers.location, '/sso/start?ziel=%2Flehrer');
  assert.equal((await c.get('/api/sitzung')).body.verbund.lokal, false);
  const l = H.makeApp({ umgebung: { ...UMGEBUNG, AUTH_MODUS: 'lokal' } });
  assert.equal((await request(l).get('/sso/start')).status, 404);
  assert.equal((await request(l).post('/api/verbund/loeschen').set('Authorization', `Bearer ${verbundToken('loeschen')}`).send({ sub: 's:1' })).status, 401);
});

test('Verbund-API: ohne/mit falschem Token oder zweck → 401; Löschen idempotent', async () => {
  const a = app();
  await ssoAnmelden(a);
  const v = (zweck, felder, o) => `Bearer ${verbundToken(zweck, felder, o)}`;
  const post = (pfad, auth, body) => {
    const r = request(a).post(pfad).send(body);
    return auth ? r.set('Authorization', auth) : r;
  };
  assert.equal((await post('/api/verbund/loeschen', null, { sub: 's:1042' })).status, 401);
  assert.equal((await post('/api/verbund/loeschen', v('kurs-aendern'), { sub: 's:1042' })).status, 401);
  assert.equal((await post('/api/verbund/loeschen', v('loeschen', { sub: 's:1' }), { sub: 's:1042' })).status, 401);
  assert.equal((await post('/api/verbund/loeschen', v('loeschen', { aud: 'x' }), { sub: 's:1042' })).status, 401);
  assert.equal((await post('/api/verbund/loeschen', v('loeschen', { iat: jetzt(), exp: jetzt() + 61 }), { sub: 's:1042' })).status, 401);
  assert.equal((await post('/api/verbund/loeschen', v('loeschen', {}, { key: fremd.privateKey }), { sub: 's:1042' })).status, 401);
  // Wiederverwendung
  const einmal = v('loeschen');
  let r = await post('/api/verbund/loeschen', einmal, { sub: 's:9999' });
  assert.deepEqual(r.body, { geloescht: 0 });
  assert.equal((await post('/api/verbund/loeschen', einmal, { sub: 's:9999' })).status, 401);
  // Inhalte prüfen
  assert.equal((await post('/api/verbund/loeschen', v('loeschen'), {})).status, 400);
  assert.equal((await post('/api/verbund/loeschen', v('loeschen'), { sub: 'drop table' })).status, 400);
  r = await post('/api/verbund/loeschen', v('loeschen'), { sub: 's:1042' });
  assert.deepEqual(r.body, { geloescht: 1 });
  r = await post('/api/verbund/loeschen', v('loeschen'), { sub: 's:1042' });
  assert.deepEqual(r.body, { geloescht: 0 });
  // Kurs löschen
  r = await post('/api/verbund/loeschen', v('loeschen'), { kurs: 'k:17' });
  assert.deepEqual(r.body, { geloescht: 1 });
  r = await post('/api/verbund/loeschen', v('loeschen'), { kurs: 'k:17' });
  assert.deepEqual(r.body, { geloescht: 0 });
  // Lehrkraft löschen
  await ssoAnmelden(a, { sub: 'l:5', rolle: 'lehrkraft', name: 'Frau Muster', kurse: [] });
  assert.deepEqual((await post('/api/verbund/loeschen', v('loeschen'), { sub: 'l:5' })).body, { geloescht: 1 });
});

test('Verbund-API: Kursübersicht (nur Kennzahlen) und Kurs umbenennen/sperren', async () => {
  const a = app();
  const { c } = await ssoAnmelden(a);
  // eine Aufgabe lösen, damit Kennzahlen entstehen
  const welten = (await c.get('/api/welten').expect(200)).body;
  assert.ok(welten);
  const get = (pfad, zweck = 'kurs-uebersicht') => request(a).get(pfad).set('Authorization', `Bearer ${verbundToken(zweck)}`);
  assert.equal((await request(a).get('/api/verbund/kurse/k%3A17/uebersicht')).status, 401);
  assert.equal((await get('/api/verbund/kurse/k%3A17/uebersicht', 'loeschen')).status, 401);
  assert.equal((await get('/api/verbund/kurse/k%3A99/uebersicht')).status, 404);
  const u = (await get('/api/verbund/kurse/k%3A17/uebersicht').expect(200)).body;
  assert.equal(u.kurs, 'k:17');
  assert.ok(Date.parse(u.stand));
  assert.equal(u.schueler.length, 1);
  assert.deepEqual(Object.keys(u.schueler[0]).sort(), ['anteil', 'geloest', 'punkte', 'sub', 'zuletzt']);
  assert.equal(u.schueler[0].sub, 's:1042');
  assert.ok(Array.isArray(u.welten) && u.welten.every((w) => typeof w.nr === 'number' && typeof w.titel === 'string' && w.anteil >= 0 && w.anteil <= 1));
  const text = JSON.stringify(u);
  for (const v of ['loesung', 'antwort', 'Lena']) assert.ok(!text.includes(v), v);
  // umbenennen und sperren
  const aendern = (body) => request(a).post('/api/verbund/kurse/k%3A17').set('Authorization', `Bearer ${verbundToken('kurs-aendern')}`).send(body);
  assert.equal((await request(a).post('/api/verbund/kurse/k%3A17').send({ aktiv: false })).status, 401);
  assert.deepEqual((await aendern({ name: 'LK Informatik 13 neu' })).body, { ok: true });
  assert.equal((await c.get('/api/sitzung')).body.schueler.kurs, 'LK Informatik 13 neu');
  await aendern({ aktiv: false }).expect(200);
  assert.equal((await c.get('/api/sitzung')).body.schueler, null);
  assert.equal((await c.get('/api/welten')).status, 401);
  // gesperrter Kurs: SSO-Anmeldung zeigt Hinweis
  const { r } = await ssoAnmelden(a);
  assert.equal(r.status, 403);
  assert.match(r.text, /gesperrt/);
  await aendern({ aktiv: true }).expect(200);
  const { c: wieder, r: r2 } = await ssoAnmelden(a);
  assert.equal(r2.status, 302);
  assert.equal((await wieder.get('/api/sitzung')).body.schueler.name, 'Lena S.');
  // unbekannter Kurs: ok, nichts angelegt
  assert.deepEqual((await request(a).post('/api/verbund/kurse/k%3A55').set('Authorization', `Bearer ${verbundToken('kurs-aendern')}`).send({ aktiv: false })).body, { ok: true });
  assert.equal(a.locals.db.prepare("SELECT COUNT(*) AS n FROM kurse WHERE portal_id = 'k:55'").get().n, 0);
});

test('Datenbank-Upgrade: Schema 3 ohne Verbund-Spalten wird ergänzt', () => {
  const Database = require('better-sqlite3');
  const fs = require('node:fs');
  const os = require('node:os');
  const path = require('node:path');
  const { openDatabase, SCHEMA } = require('../src/db');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aq-'));
  const datei = path.join(dir, 'alt.db');
  // altes Schema: ohne sub/portal_id/aktiv/zugang und ohne kurs_lehrkraefte
  const alt = SCHEMA.replace(/,\n\s+sub\s+TEXT[^\n]*\n\);/g, '\n);')
    .replace(/,\n\s+portal_id[^\n]*\n\s+aktiv[^\n]*\n\);/, '\n);')
    .replace(/,\n\s+sub\s+TEXT[^\n]*\n\s+zugang[^\n]*\n(\s+UNIQUE)/, ',\n$1')
    .replace(/CREATE TABLE IF NOT EXISTS kurs_lehrkraefte \([\s\S]*?\);/, '');
  const d = new Database(datei);
  d.exec(alt);
  d.prepare("INSERT INTO meta (key, value) VALUES ('schema_version', '3'), ('app', 'algoquest-lab')").run();
  assert.ok(!d.prepare('PRAGMA table_info(schueler)').all().some((x) => x.name === 'sub'));
  d.close();
  const db = openDatabase(datei);
  for (const [t, s] of [['lehrkraefte', 'sub'], ['kurse', 'portal_id'], ['kurse', 'aktiv'], ['schueler', 'sub'], ['schueler', 'zugang']]) {
    assert.ok(db.prepare(`PRAGMA table_info(${t})`).all().some((x) => x.name === s), `${t}.${s}`);
  }
  assert.equal(db.prepare("SELECT value FROM meta WHERE key = 'schema_version'").get().value, '4');
  db.close();
  fs.rmSync(dir, { recursive: true, force: true });
});

test('Konfiguration tolerant: Schlüssel mit Leerzeichen/Anführungszeichen/nur Base64, PORTAL_URL mit Punkt oder Schrägstrich', () => {
  const { verbundKonfig } = require('../src/verbundKonfig');
  const pem = publicKey.export({ type: 'spki', format: 'pem' }).trim();
  const b64 = pem.split('\n').slice(1, -1).join('');
  for (const k of [pem, PEM_EINZEILIG, pem.replace(/\n/g, ' '), `"${PEM_EINZEILIG}"`, b64, `${pem}\n${fremd.publicKey.export({ type: 'spki', format: 'pem' })}`]) {
    const c = verbundKonfig({ ...UMGEBUNG, PORTAL_PUBLIC_KEY: k });
    assert.equal(c.sso, true, k);
  }
  assert.equal(verbundKonfig({ ...UMGEBUNG, PORTAL_PUBLIC_KEY: 'unsinn' }).sso, false);
  for (const u of ['https://portal.example.', 'https://portal.example/', ' https://portal.example ']) assert.equal(verbundKonfig({ ...UMGEBUNG, PORTAL_URL: u }).portal, PORTAL, u);
});

test('Phase 2: Zuordnung einspielen – Probelauf, Umstellung, Lernstand bleibt, Doppel aus SSO zusammengeführt, idempotent', async () => {
  const sz = await H.szenario({ umgebung: UMGEBUNG });
  const { app: a, admin, lk, kurs } = sz;
  const db = a.locals.db;
  const s2 = await H.schuelerClient(a, kurs.code, 'Tom K.');
  const lena = db.prepare("SELECT * FROM schueler WHERE name = 'Lena S.'").get();
  const tom = db.prepare("SELECT * FROM schueler WHERE name = 'Tom K.'").get();
  db.prepare("INSERT INTO abzeichen (schueler_id, schluessel, at) VALUES (?, 'erste_schritte', '2026-10-01T10:00:00Z')").run(lena.id);
  // Tom hat sich vorab schon über das Portal angemeldet → Doppel im SSO-Kurs k:1
  await ssoAnmelden(a, { sub: 's:43', name: 'Tom K.', kurse: [{ id: 'k:1', name: 'LK Informatik 13', rolle: 'mitglied' }] });
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM kurse WHERE portal_id = 'k:1'").get().n, 1);
  const zuordnung = {
    format: 'verbund-zuordnung', version: 1, quelle: 'algoquest', portal: PORTAL, erstellt: '2026-10-12T00:00:00Z',
    lehrkraefte: [{ altId: 1, sub: 'a:1', art: 'superadmin' }, { altId: lk.lkId, sub: 'l:2', art: 'neu' }],
    kurse: [{ altId: kurs.id, kursId: 'k:1', kurscode: kurs.code, art: 'neu' }],
    schueler: [{ altId: lena.id, sub: 's:42', art: 'neu' }, { altId: tom.id, sub: 's:43', art: 'neu' }, { altId: 9999, sub: 's:44', art: 'neu' }]
  };
  // Prüfungen der Datei
  assert.equal((await admin.post('/api/admin/verbund/zuordnung').send({ zuordnung: { ...zuordnung, quelle: 'andere' } })).status, 400);
  assert.equal((await admin.post('/api/admin/verbund/zuordnung').send({ zuordnung: { ...zuordnung, portal: 'https://x.example' } })).status, 400);
  assert.equal((await lk.post('/api/admin/verbund/zuordnung').send({ zuordnung })).status, 403);
  // Probelauf ändert nichts
  const p = (await admin.post('/api/admin/verbund/zuordnung').send({ zuordnung, probelauf: true }).expect(200)).body;
  assert.equal(p.probelauf, true);
  assert.equal(p.schueler, 2);
  assert.equal(db.prepare('SELECT sub FROM schueler WHERE id = ?').get(lena.id).sub, null);
  // Einspielen
  const r = (await admin.post('/api/admin/verbund/zuordnung').send({ zuordnung, probelauf: false }).expect(200)).body;
  assert.deepEqual([r.lehrkraefte, r.kurse, r.schueler], [1, 1, 2]);
  assert.ok(r.zusammengefuehrt >= 1);
  assert.ok(r.uebersprungen.some((t) => t.includes('9999')));
  assert.ok(r.hinweise.some((t) => t.includes('Superadmin')));
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM kurse WHERE portal_id = 'k:1'").get().n, 1);
  assert.equal(db.prepare("SELECT portal_id FROM kurse WHERE id = ?").get(kurs.id).portal_id, 'k:1');
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM schueler WHERE sub = 's:43'").get().n, 1);
  assert.equal(db.prepare("SELECT id FROM schueler WHERE sub = 's:43'").get().id, tom.id);
  // alte Sitzung endet, lokale Anmeldung mit Name + Code geht nicht mehr
  assert.equal((await sz.s.get('/api/sitzung')).body.schueler, null);
  assert.equal((await H.client(a).post('/api/schueler/anmelden').send({ name: 'Lena S.', code: sz.s.code })).status, 401);
  // Anmeldung über das Portal landet auf der alten Zeile mit Lernstand
  const { c } = await ssoAnmelden(a, { sub: 's:42', name: 'Lena S.', kurse: [{ id: 'k:1', name: 'LK Informatik 13', rolle: 'mitglied' }] });
  assert.equal((await c.get('/api/sitzung')).body.schueler.kurs, 'LK Informatik 13');
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM schueler WHERE sub = 's:42'").get().n, 1);
  assert.equal((await c.get('/api/profil')).body.abzeichen.filter((x) => x.erhalten).length, 1);
  // Lehrkraft über das Portal sieht ihren alten Kurs mit beiden Schülern
  const { c: l } = await ssoAnmelden(a, { sub: 'l:2', rolle: 'lehrkraft', name: 'Frau Lehrer', kurse: [{ id: 'k:1', name: 'LK Informatik 13', rolle: 'lehrkraft' }] }, '/lehrer');
  const kl = (await l.get('/api/lehrer/kurse')).body;
  assert.deepEqual(kl.map((k) => [k.id, k.schueler]), [[kurs.id, 2]]);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM lehrkraefte WHERE sub = 'l:2'").get().n, 1);
  // erneut einspielen: nichts mehr zu tun
  const r2 = (await admin.post('/api/admin/verbund/zuordnung').send({ zuordnung, probelauf: false }).expect(200)).body;
  assert.deepEqual([r2.lehrkraefte, r2.kurse, r2.schueler, r2.zusammengefuehrt], [0, 0, 0, 0]);
  // lokaler Superadmin bleibt anmeldbar
  await H.adminClient(a);
  assert.ok(s2);
});
