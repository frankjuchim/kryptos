'use strict';
// Verbundvertrag (README Teil H): Plattform-Manifest unter /api/plattform.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const request = require('supertest');
const H = require('./helpers');
const { pruefeManifest } = require('../scripts/vertrag_pruefen');

// Bis zu den eigenen Welten (M5) zählt das Manifest die Kern-Fixture Welt 9 (Zahlen aus der Fixture berechnet).
const W = require('./fixtures/welt_beispiel.json');
const AUF = new Map(W.aufgaben.map((a) => [a.id, a]));
const LEVEL_IDS = W.levels.flatMap((l) => l.aufgaben);
/** Level-Punkte der Welt 9 (Bezugsmenge, labs v1.2: alle sichtbaren Level-Aufgaben) */
const MAX = LEVEL_IDS.reduce((sum, id) => sum + (AUF.get(id).punkte ?? { 1: 10, 2: 20, 3: 30 }[AUF.get(id).stufe]), 0);
const SEED = path.join(__dirname, 'fixtures', 'seed_beispiel');
const FAEHIGKEITEN = ['gast', 'themen', 'lehrkraft-materialien', 'boss', 'training', 'warmup', 'scoreboard', 'beamer', 'urkunden', 'fallen-profil', 'labor', 'funkraum', 'arena', 'niveau'];

test('Manifest (TECHNIK §6.9): vertragsgemäß, Felder exakt, Version wie /healthz, CORS und Cache', async () => {
  const app = H.makeApp({ seedDir: SEED });
  const r = await request(app).get('/api/plattform').expect(200);
  assert.equal(r.headers['access-control-allow-origin'], '*');
  assert.equal(r.headers['cache-control'], 'public, max-age=300');
  const m = r.body;
  assert.deepEqual(pruefeManifest(m), []);
  assert.deepEqual(Object.keys(m), ['vertrag', 'id', 'name', 'titel', 'themenfeld', 'kurs', 'niveaus', 'beschreibung', 'farbe', 'version', 'basis', 'icon', 'urls', 'auth', 'umfang', 'welten', 'faehigkeiten']);
  assert.equal(m.vertrag, '1.2', 'labs-Vertrag v1.2');
  assert.deepEqual(m.niveaus, ['eA', 'gA'], 'VERTRAG §7/§9: für eA und gA');
  assert.equal(m.id, 'kryptos');
  assert.equal(m.name, 'Kryptos');
  assert.equal(m.titel, 'Kryptos – Die Zeitreise der Geheimschriften');
  assert.equal(m.themenfeld, 'Kryptologie');
  assert.equal(m.kurs, 'Informatik eA und gA, Niedersachsen, Abitur ab 2027');
  assert.match(m.beschreibung, /^Eine Zeitreise durch 2500 Jahre Geheimschriften/);
  assert.equal(m.farbe, '#B07D2B');
  assert.equal(m.basis, 'https://kryptos.test');
  assert.equal(m.icon, '/static/favicon.svg');
  assert.deepEqual(m.urls, { start: '/', gast: '/gast', themen: '/themen', lehrkraft: '/lehrer', datenschutz: '/datenschutz', healthz: '/healthz', ssoStart: '/sso/start', ssoEnde: '/sso/ende', niveaus: '/themen#niveaus' });
  assert.deepEqual(m.auth, { modus: 'portal', portal: 'https://portal.test', sso: true });
  assert.deepEqual(m.umfang, { welten: 1, level: W.levels.length, aufgaben: LEVEL_IDS.length + W.boss.pool.length, bosse: 1 }, 'aus dem Katalog berechnet');
  assert.deepEqual(m.welten, [{ nr: 9, titel: 'Die Testwelt', farbe: '#5B6B7C', level: 2 }]);
  assert.deepEqual(m.faehigkeiten, FAEHIGKEITEN);
  for (const f of ['labor', 'funkraum', 'arena', 'niveau']) assert.ok(m.faehigkeiten.includes(f), f);
  const h = (await request(app).get('/healthz')).body;
  assert.equal(h.version, m.version);
  // nie Kurs-, Schüler- oder Lösungsdaten
  const k = H.kurs(app, 'LK 13');
  H.teilnahme(app, k, H.konto(app, 'schueler', 'Mika R.'), 'Mika R.');
  const text = JSON.stringify((await request(app).get('/api/plattform')).body);
  assert.ok(!text.includes('k:'), 'keine Kurs-ID');
  assert.doesNotMatch(text, /\b[asl]:\d/, 'keine sub');
  for (const v of ['loesung', 'Mika', 'LK 13', 'kurscode']) assert.ok(!text.toLowerCase().includes(v.toLowerCase()), v);
});

test('Manifest: basis aus PLATTFORM_URL; VERTRAG_VERSION nur 1.2 (ältere Fassungen abgelehnt)', async () => {
  const app = H.makeApp({ seedDir: SEED, plattformUrl: 'https://kryptos.example', portalUrl: 'https://portal.example' });
  const m = (await request(app).get('/api/plattform')).body;
  assert.deepEqual(pruefeManifest(m), []);
  assert.equal(m.vertrag, '1.2');
  assert.deepEqual(m.niveaus, ['eA', 'gA']);
  assert.equal(m.basis, 'https://kryptos.example');
  assert.deepEqual(m.auth, { modus: 'portal', portal: 'https://portal.example', sso: true });
  assert.equal((await request(H.makeApp({ seedDir: SEED, vertragVersion: '1.2' })).get('/api/plattform')).body.vertrag, '1.2');
  assert.throws(() => H.makeApp({ vertragVersion: '1.1' }), /VERTRAG_VERSION muss 1\.2 sein/);
});

test('Manifest: Umfang aus dem leeren Katalog (keine Welten) bleibt vertragsgemäß', async () => {
  const app = H.makeApp({ seedDir: null, weltDateien: [] });
  const m = (await request(app).get('/api/plattform')).body;
  assert.deepEqual(pruefeManifest(m), []);
  assert.deepEqual(m.umfang, { welten: 0, level: 0, aufgaben: 0, bosse: 0 });
});

test('pruefeManifest erkennt Vertragsverstöße', () => {
  assert.ok(pruefeManifest(null).length);
  const f = pruefeManifest({ vertrag: '2.0', id: 'Algo Quest', urls: {}, auth: { modus: 'x', sso: true }, faehigkeiten: [] });
  for (const teil of ['vertrag', 'id:', 'urls.gast', 'auth.modus', 'urls.ssoStart', '"gast"']) assert.ok(f.some((x) => x.includes(teil)), teil);
});

/* ===================== Verbund-API (VERTRAG §6, TECHNIK §6.7–§6.8, §6.12 T11/T12) ===================== */

const crypto = require('node:crypto');
const { signiere } = require('../src/jwt');

const bearer = (t) => 'Bearer ' + t;
/** Verbund-Aufruf wie vom Portal: ohne Origin und Cookies, nur mit Bearer-Token. */
function vb(app, methode, pfad, zweck, extra, o) {
  const r = request(app)[methode](pfad);
  return zweck === null ? r : r.set('Authorization', bearer(H.verbundToken(zweck, extra, { app, ...o })));
}
const loeschen = (app, body, extra) => vb(app, 'post', '/api/verbund/loeschen', 'loeschen', extra).send(body);
const kid = (k) => encodeURIComponent(k.kurs);

test('T11: Verbund-API ohne gültiges Token → 401 „Token ungültig.“ ohne Details', async () => {
  const app = H.makeApp();
  const iat = Math.floor(Date.now() / 1000);
  const fremd = crypto.generateKeyPairSync('ed25519').privateKey;
  const roh = (felder, key = H.PORTAL_SCHLUESSEL.privateKey) =>
    signiere({ iss: H.PORTAL, aud: 'kryptos', sub: 'portal', zweck: 'loeschen', iat, exp: iat + 60, jti: crypto.randomBytes(12).toString('hex'), v: 1, ...felder }, key);
  const faelle = {
    'ohne Token': null,
    'kein Bearer': 'Basic abc',
    'falsches aud': bearer(roh({ aud: 'algoquest' })),
    'falsches iss': bearer(roh({ iss: 'https://boese.example' })),
    'falscher zweck': bearer(roh({ zweck: 'kurs-uebersicht' })),
    'exp − iat = 61': bearer(roh({ exp: iat + 61 })),
    abgelaufen: bearer(roh({ iat: iat - 200, exp: iat - 140 })),
    'sub ≠ portal': bearer(roh({ sub: 'l:1' })),
    'falsche Signatur': bearer(roh({}, fremd)),
    'v fehlt': bearer(roh({ v: undefined }))
  };
  for (const [fall, kopf] of Object.entries(faelle)) {
    const r = request(app).post('/api/verbund/loeschen');
    if (kopf) r.set('Authorization', kopf);
    const a = await r.send({ sub: 's:1' });
    assert.equal(a.status, 401, fall);
    assert.deepEqual(a.body, { error: 'Token ungültig.' }, fall);
    assert.equal(a.headers['cache-control'], 'no-store', fall);
  }
  // wiederverwendet (jti einmalig, auch mit Präfix v: getrennt von SSO-jti)
  const t = roh({});
  assert.equal((await request(app).post('/api/verbund/loeschen').set('Authorization', bearer(t)).send({ sub: 's:1' })).status, 200);
  const zweit = await request(app).post('/api/verbund/loeschen').set('Authorization', bearer(t)).send({ sub: 's:1' });
  assert.deepEqual([zweit.status, zweit.body], [401, { error: 'Token ungültig.' }]);
  assert.equal(H.zaehle(app, 'sso_jti', "jti LIKE 'v:%'"), 1);
  // auch nach Neustart (gleiche DB): jti steht persistent in sso_jti
  const row = app.locals.db.prepare("SELECT jti FROM sso_jti WHERE jti LIKE 'v:%'").get();
  assert.ok(row.jti.startsWith('v:'));
  // Schlüssel 2 von 2 (Schlüsselwechsel) wird angenommen
  const neu = crypto.generateKeyPairSync('ed25519');
  const zwei = H.makeApp({ portalPublicKey: H.PORTAL_PEM + '\n' + neu.publicKey.export({ type: 'spki', format: 'pem' }) });
  const r2 = await request(zwei).post('/api/verbund/loeschen').set('Authorization', bearer(H.verbundToken('loeschen', {}, { key: neu.privateKey }))).send({ sub: 's:1' });
  assert.deepEqual([r2.status, r2.body], [200, { geloescht: 0 }]);
});

test('Verbund-API ohne Portal-Konfiguration → 401; keine Origin-Prüfung', async () => {
  const app = H.makeApp({ portalPublicKey: null });
  assert.equal((await loeschen(app, { sub: 's:1' })).status, 401);
  const ok = H.makeApp();
  const r = await loeschen(ok, { sub: 's:1' }).set('Origin', 'https://portal.test');
  assert.equal(r.status, 200, 'fremde Herkunft schadet nicht (serverseitiger Aufruf)');
});

test('T12: loeschen {sub} zweimal → 200 {geloescht: n>0}, dann {geloescht: 0}', async () => {
  const app = H.makeApp();
  const k1 = H.kurs(app, 'LK 13');
  const k2 = H.kurs(app, 'GK 12');
  const sub = H.konto(app, 'schueler', 'Mika R.');
  H.teilnahme(app, k1, sub, 'Mika R.');
  H.teilnahme(app, k2, sub, 'Mika R.', { aktiv: false });
  const a = await loeschen(app, { sub });
  assert.deepEqual([a.status, a.body], [200, { geloescht: 3 }], 'Konto + 2 Teilnahmen');
  const b = await loeschen(app, { sub });
  assert.deepEqual([b.status, b.body], [200, { geloescht: 0 }]);
  assert.equal(H.zaehle(app, 'konten', 'sub = ?', sub), 0);
  assert.equal(H.zaehle(app, 'kurse'), 2, 'Kurse bleiben');
});

test('loeschen: Body-Prüfung → 400 (beides, keins, Format)', async () => {
  const app = H.makeApp();
  for (const body of [{ sub: 's:1', kurs: 'k:1' }, {}, { sub: 'x:1' }, { sub: 's:' }, { sub: 1042 }, { kurs: 'k:abc' }, { kurs: '17' }, [], 'sub']) {
    const r = await loeschen(app, body);
    assert.equal(r.status, 400, JSON.stringify(body));
    assert.ok(typeof r.body.error === 'string');
  }
});

test('loeschen {kurs}: Kurs mit Teilnahmen, Lernstand, Teams, Funkraum, Arena weg; Konten und andere Kurse bleiben', async () => {
  const app = H.makeApp();
  const k = H.kurs(app, 'LK 13');
  const anderer = H.kurs(app, 'GK 12');
  const lk = H.konto(app, 'lehrkraft', 'Frau K.');
  H.zuordnen(app, k, lk);
  H.zuordnen(app, anderer, lk);
  const subs = ['Mika R.', 'Ida K.'].map((n) => H.konto(app, 'schueler', n));
  const t = subs.map((s, i) => H.teilnahme(app, k, s, ['Mika R.', 'Ida K.'][i]));
  const tAnders = H.teilnahme(app, anderer, subs[0], 'Mika R.');
  H.befuelle(app, k, t);
  H.befuelle(app, anderer, [tAnders]);
  const vorher = H.zaehle(app, 'fortschritt');
  const r = await loeschen(app, { kurs: k.kurs });
  assert.deepEqual([r.status, r.body], [200, { geloescht: 3 }], 'Kurs + 2 Teilnahmen');
  assert.equal(H.zaehle(app, 'kurse', 'id = ?', k.id), 0);
  for (const tab of ['schueler', 'kurs_lehrkraefte', 'teams', 'funk_szenarien', 'arena', 'falsche_antworten', 'erfolge']) assert.equal(H.zaehle(app, tab, 'kurs_id = ?', k.id), 0, tab);
  const inK = (tab, spalte = 'schueler_id') => H.zaehle(app, tab, `${spalte} IN (${t.join(',')})`);
  for (const tab of ['fortschritt', 'fallen_zaehler', 'ide_erledigt', 'abzeichen', 'training', 'boss_versuche', 'leitner', 'funk_teilnahmen', 'team_mitglieder', 'arena_versuche']) assert.equal(inK(tab), 0, tab);
  for (const tab of ['funk_rollen', 'funk_nachrichten', 'funk_ereignisse', 'arena_chiffren']) {
    const eigen = tab.startsWith('funk') ? 'szenario_id IN (SELECT id FROM funk_szenarien)' : 'arena_id IN (SELECT id FROM arena)';
    assert.equal(H.zaehle(app, tab, `NOT (${eigen})`), 0, tab + ' ohne Waisen');
  }
  // anderer Kurs vollständig erhalten
  assert.equal(H.zaehle(app, 'fortschritt'), vorher - 2);
  assert.equal(H.zaehle(app, 'schueler', 'kurs_id = ?', anderer.id), 1);
  assert.equal(H.zaehle(app, 'funk_szenarien', 'kurs_id = ?', anderer.id), 1);
  assert.equal(H.zaehle(app, 'arena', 'kurs_id = ?', anderer.id), 1);
  assert.equal(H.zaehle(app, 'konten'), 3, 'Konten bleiben (Portal löscht kurslose Schüler separat)');
  assert.deepEqual((await loeschen(app, { kurs: k.kurs })).body, { geloescht: 0 }, 'idempotent');
});

test('loeschen {sub}: Lernstand, Teammitgliedschaft, eigene Funkraum-Nachrichten und Arena-Versuche weg; leere Teams samt Rollen und Chiffren', async () => {
  const app = H.makeApp();
  const k = H.kurs(app, 'LK 13');
  const mika = H.konto(app, 'schueler', 'Mika R.');
  const ida = H.konto(app, 'schueler', 'Ida K.');
  const ole = H.konto(app, 'schueler', 'Ole P.');
  const tMika = H.teilnahme(app, k, mika, 'Mika R.');
  const tIda = H.teilnahme(app, k, ida, 'Ida K.');
  const tOle = H.teilnahme(app, k, ole, 'Ole P.');
  // Mika allein in Team 1, Ida in Team 2; Ole kommt zu Ida (Team mit verbleibendem Mitglied)
  const { teams, chiffren } = H.befuelle(app, k, [tMika, tIda]);
  app.locals.db.prepare('INSERT INTO team_mitglieder (team_id, schueler_id) VALUES (?, ?)').run(teams[1], tOle);
  const r = await loeschen(app, { sub: mika });
  assert.deepEqual(r.body, { geloescht: 2 });
  assert.equal(H.zaehle(app, 'teams', 'id = ?', teams[0]), 0, 'Team 1 ohne Mitglieder gelöscht');
  assert.equal(H.zaehle(app, 'funk_rollen', 'team_id = ?', teams[0]), 0);
  assert.equal(H.zaehle(app, 'arena_chiffren', 'id = ?', chiffren[0]), 0, 'Chiffre des leeren Teams gelöscht');
  assert.equal(H.zaehle(app, 'funk_nachrichten', 'von_schueler_id = ?', tMika), 0);
  assert.equal(H.zaehle(app, 'arena_versuche', 'schueler_id = ?', tMika), 0);
  // Team 2 bleibt mit Chiffre (Team-Ergebnis ohne Personenbezug)
  assert.equal(H.zaehle(app, 'teams', 'id = ?', teams[1]), 1);
  assert.equal(H.zaehle(app, 'arena_chiffren', 'id = ?', chiffren[1]), 1);
  assert.equal(H.zaehle(app, 'fortschritt', 'schueler_id = ?', tIda), 1, 'Lernstand der anderen bleibt');
  // Ida löschen: Team 2 hat noch Ole → bleibt
  await loeschen(app, { sub: ida });
  assert.equal(H.zaehle(app, 'teams', 'id = ?', teams[1]), 1);
  // Lehrkraft löschen: kurs_lehrkraefte weg, Kurs bleibt
  const lk = H.konto(app, 'lehrkraft', 'Frau K.');
  H.zuordnen(app, k, lk);
  assert.deepEqual((await loeschen(app, { sub: lk })).body, { geloescht: 1 });
  assert.equal(H.zaehle(app, 'kurs_lehrkraefte', 'sub = ?', lk), 0);
  assert.equal(H.zaehle(app, 'kurse', 'id = ?', k.id), 1);
});

test('loeschen-Dienst: nachSub/nachKurs direkt, je eine Transaktion', () => {
  const L = require('../src/verbund/loeschen');
  const app = H.makeApp();
  const k = H.kurs(app);
  const s = H.konto(app, 'schueler', 'Mika R.');
  H.befuelle(app, k, [H.teilnahme(app, k, s, 'Mika R.')]);
  assert.equal(L.nachSub(app.locals.db, s), 2);
  assert.equal(L.nachSub(app.locals.db, s), 0);
  assert.equal(L.nachKurs(app.locals.db, k.kurs), 1);
  assert.equal(L.nachKurs(app.locals.db, k.kurs), 0);
});

test('Kursübersicht: Format VERTRAG §6, nur freigeschaltete Welten, inaktive Teilnahmen dabei, keine Freitexte/Teamnamen', async () => {
  const app = H.makeApp();
  const k = H.kurs(app, 'LK 13');
  const mika = H.konto(app, 'schueler', 'Mika R.');
  const ida = H.konto(app, 'schueler', 'Ida K.');
  const tMika = H.teilnahme(app, k, mika, 'Mika R.');
  const tIda = H.teilnahme(app, k, ida, 'Ida K.', { aktiv: false });
  H.befuelle(app, k, [tMika, tIda]);
  // Mika: zusätzlich 26 Punkte → 36 von MAX Level-Punkten der Welt 9
  app.locals.db.prepare("INSERT INTO fortschritt (schueler_id, aufgabe_id, status, punkte, updated_at) VALUES (?, 'W9-L2-01', 'geloest', 26, ?)").run(tMika, new Date().toISOString());
  const r = await vb(app, 'get', `/api/verbund/kurse/${kid(k)}/uebersicht`, 'kurs-uebersicht');
  assert.equal(r.status, 200);
  assert.equal(r.headers['cache-control'], 'no-store');
  const u = r.body;
  assert.deepEqual(Object.keys(u).sort(), ['kurs', 'schueler', 'stand', 'welten']);
  assert.equal(u.kurs, k.kurs);
  assert.ok(!Number.isNaN(Date.parse(u.stand)));
  const m = u.schueler.find((x) => x.sub === mika);
  assert.deepEqual(Object.keys(m).sort(), ['anteil', 'geloest', 'punkte', 'sub', 'zuletzt']);
  assert.equal(m.geloest, 2);
  assert.equal(m.punkte, 36 + 5, 'Level + Boss (wie Scoreboard)');
  assert.equal(m.anteil, Math.round((36 / MAX) * 100) / 100);
  assert.ok(u.schueler.some((x) => x.sub === ida), 'inaktive Teilnahme dabei');
  assert.deepEqual(u.welten, [{ nr: 9, titel: 'Die Testwelt', anteil: Math.round(((36 / MAX + 10 / MAX) / 2) * 100) / 100 }]);
  const text = JSON.stringify(u);
  for (const v of ['Team Skytale', 'GEHEIMTEXT', 'Mika', 'Ida', 'FALSCH', 'Erste Schritte', 'Verfahren', 'loesung']) assert.ok(!text.includes(v), v);
  // Welt nicht freigeschaltet → nicht in der Übersicht, anteil 0
  app.locals.db.prepare('UPDATE kurse SET einstellungen = ? WHERE id = ?').run(JSON.stringify({ welten: [0, 1] }), k.id);
  const leer = (await vb(app, 'get', `/api/verbund/kurse/${kid(k)}/uebersicht`, 'kurs-uebersicht')).body;
  assert.deepEqual(leer.welten, []);
  assert.equal(leer.schueler.find((x) => x.sub === mika).anteil, 0);
});

test('Kursübersicht: unbekannter Kurs → 404, falscher zweck → 401', async () => {
  const app = H.makeApp();
  const k = H.kurs(app);
  assert.equal((await vb(app, 'get', '/api/verbund/kurse/k%3A999999/uebersicht', 'kurs-uebersicht')).status, 404);
  assert.equal((await vb(app, 'get', '/api/verbund/kurse/quatsch/uebersicht', 'kurs-uebersicht')).status, 404);
  assert.equal((await vb(app, 'get', `/api/verbund/kurse/${kid(k)}/uebersicht`, 'loeschen')).status, 401);
});

test('kurs-aendern: Name übernommen, aktiv:false sperrt Schüler-API (403), aktiv:true entsperrt; unbekannter Kurs ohne Anlage', async () => {
  const app = H.makeApp();
  const k = H.kurs(app, 'LK 13');
  const s = await H.schuelerClient(app, k, 'Mika R.');
  const aendern = (body) => vb(app, 'post', `/api/verbund/kurse/${kid(k)}`, 'kurs-aendern').send(body);
  assert.deepEqual((await aendern({ name: '  LK 13 (eA)  ' })).body, { ok: true });
  assert.equal(app.locals.db.prepare('SELECT name FROM kurse WHERE id = ?').get(k.id).name, 'LK 13 (eA)');
  assert.equal((await s.get('/api/welten')).status, 200);
  assert.deepEqual((await aendern({ aktiv: false })).body, { ok: true });
  const g = await s.get('/api/welten');
  assert.deepEqual([g.status, g.body.error], [403, 'Kryptos ist für deinen Kurs abgeschaltet.']);
  assert.deepEqual((await aendern({ aktiv: true })).body, { ok: true });
  assert.equal((await s.get('/api/welten')).status, 200);
  // Prüfung des Bodys
  for (const body of [{ name: '' }, { name: '   ' }, { name: 'x'.repeat(81) }, { name: 7 }, { aktiv: 'nein' }, { aktiv: 0 }, []]) {
    assert.equal((await aendern(body)).status, 400, JSON.stringify(body));
  }
  assert.equal((await vb(app, 'post', '/api/verbund/kurse/quatsch', 'kurs-aendern').send({ name: 'x' })).status, 400);
  // unbekannter Kurs: ok, aber keine Anlage (kommt beim nächsten SSO)
  const n = H.zaehle(app, 'kurse');
  assert.deepEqual((await vb(app, 'post', '/api/verbund/kurse/k%3A424242', 'kurs-aendern').send({ name: 'Neu', aktiv: false })).body, { ok: true });
  assert.equal(H.zaehle(app, 'kurse'), n);
});

test('kurs-aendern aktiv:false: laufendes Funkraum-Szenario beendet (Inhalte gelöscht), offene Arena gelöscht', async () => {
  const app = H.makeApp();
  const k = H.kurs(app);
  const s = H.konto(app, 'schueler', 'Mika R.');
  const t = H.teilnahme(app, k, s, 'Mika R.');
  const { szenario } = H.befuelle(app, k, [t]);
  const r = await vb(app, 'post', `/api/verbund/kurse/${kid(k)}`, 'kurs-aendern').send({ aktiv: false });
  assert.equal(r.status, 200);
  const sz = app.locals.db.prepare('SELECT * FROM funk_szenarien WHERE id = ?').get(szenario);
  assert.equal(sz.status, 'auswertung');
  assert.ok(sz.beendet_at);
  assert.equal(H.zaehle(app, 'funk_nachrichten', "szenario_id = ? AND (inhalt != '' OR klartext_hash IS NOT NULL)", szenario), 0);
  assert.equal(H.zaehle(app, 'funk_rollen', "szenario_id = ? AND zustand != '{}'", szenario), 0);
  assert.equal(H.zaehle(app, 'arena', "kurs_id = ? AND status != 'geschlossen'", k.id), 0);
  assert.equal(H.zaehle(app, 'arena_chiffren'), 0);
  // Lernstand bleibt
  assert.equal(H.zaehle(app, 'fortschritt', 'schueler_id = ?', t), 1);
});

test('Verbund-API: Rate-Limit 600 gültige Aufträge je 10 Minuten (gesamt) → 429', async () => {
  const app = H.makeApp();
  for (let i = 0; i < 600; i++) {
    const r = await loeschen(app, { sub: 's:1' });
    assert.equal(r.status, 200);
  }
  const r = await loeschen(app, { sub: 's:1' });
  assert.equal(r.status, 429);
  assert.ok(Number(r.headers['retry-after']) > 0);
});

test('Verbund-API: Flut ohne Token wird je IP gedrosselt (429), blockiert aber keine gültigen Löschaufträge', async () => {
  const app = H.makeApp();
  const status = [];
  for (let i = 0; i < 600; i++) status.push((await request(app).post('/api/verbund/loeschen').send({ sub: 's:1' })).status);
  assert.deepEqual([...new Set(status.slice(0, 120))], [401], 'die ersten 120 abgelehnten: 401');
  assert.deepEqual([...new Set(status.slice(120))], [429], 'danach gedrosselt');
  const ok = await loeschen(app, { sub: 's:1' });
  assert.deepEqual([ok.status, ok.body], [200, { geloescht: 0 }], 'gültiger Auftrag kommt trotzdem durch');
});

test('Verbund-API: JSON wird erst nach der Tokenprüfung gelesen (kaputtes JSON ohne Token → 401, mit Token → 400)', async () => {
  const app = H.makeApp();
  const ohne = await request(app).post('/api/verbund/loeschen').set('Content-Type', 'application/json').send('{x');
  assert.deepEqual([ohne.status, ohne.body], [401, { error: 'Token ungültig.' }]);
  const gross = await request(app).post('/api/verbund/kurse/k%3A1').set('Content-Type', 'application/json').send(JSON.stringify({ name: 'x'.repeat(200 * 1024) }));
  assert.equal(gross.status, 401, 'zu großer Body ohne Token → 401');
  const mit = await vb(app, 'post', '/api/verbund/loeschen', 'loeschen').set('Content-Type', 'application/json').send('{x');
  assert.deepEqual([mit.status, mit.body], [400, { error: 'Ungültiges JSON.' }]);
});

test('Verbund-API: jti bleibt nach echtem Neustart verbraucht (zwei App-Instanzen, gleiche DB-Datei)', async () => {
  const fs = require('node:fs');
  const os = require('node:os');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kryptos-verbund-'));
  const dbFile = path.join(dir, 'kryptos.db');
  try {
    const app1 = H.makeApp({ dbFile });
    const token = H.verbundToken('loeschen', {}, { app: app1 });
    assert.equal((await request(app1).post('/api/verbund/loeschen').set('Authorization', bearer(token)).send({ sub: 's:1' })).status, 200);
    app1.locals.db.close();
    const app2 = H.makeApp({ dbFile });
    const r = await request(app2).post('/api/verbund/loeschen').set('Authorization', bearer(token)).send({ sub: 's:1' });
    assert.deepEqual([r.status, r.body], [401, { error: 'Token ungültig.' }]);
    assert.equal((await loeschen(app2, { sub: 's:1' })).status, 200, 'neues Token geht');
    app2.locals.db.close();
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
