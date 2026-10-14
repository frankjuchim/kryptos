'use strict';
// Kursverwaltung: Einstellungen, Schülerliste, CSV, Auswertung, Backup/Restore, Kata, Urkunden, Vorschau.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const H = require('./helpers');
const { RICHTIG, FALSCH } = require('./fixtures/antworten');
const W = require('./fixtures/welt_beispiel.json');

test('Kurs vom Portal: Kurs-ID, Board-Schlüssel, Standard-Einstellungen (ohne „anmeldung“), Validierung', async () => {
  const { lk, kurs } = await H.szenario();
  const k = (await lk.get(`/api/lehrer/kurse/${kurs.id}`).expect(200)).body;
  assert.match(k.kurs, /^k:\d+$/);
  assert.match(k.boardSchluessel, /^[A-Za-z0-9_-]{12}$/);
  assert.deepEqual(k.einstellungen, { welten: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], boss: 'auto', scoreboard: true, beamer: false, niveau: 'eA', kuer: 'frei', werkzeuge: {} });
  assert.equal((await lk.patch(`/api/lehrer/kurse/${k.id}`).send({ einstellungen: { boss: 'irgendwie' } })).status, 400);
  assert.equal((await lk.patch(`/api/lehrer/kurse/${k.id}`).send({ einstellungen: { welten: 'alle' } })).status, 400);
  const r = await lk.patch(`/api/lehrer/kurse/${k.id}`).send({ einstellungen: { welten: [4, 4, 2], scoreboard: false, anmeldung: false } });
  assert.deepEqual(r.body.einstellungen.welten, [2, 4]);
  assert.equal(r.body.einstellungen.scoreboard, false);
  assert.ok(!('anmeldung' in r.body.einstellungen), 'Einstellung „anmeldung“ wird ignoriert (TECHNIK §6.5)');
});

test('Schülerliste: Name, Punkte, gelöst, Teilnahme aktiv, zuletzt aktiv – ohne Codes und Kennungen', async () => {
  const { app, s, lk, kurs } = await H.szenario();
  await H.schuelerClient(app, kurs, 'Tim T.');
  const weg = H.konto(app, 'schueler', 'Uta U.');
  H.teilnahme(app, kurs, weg, 'Uta U.', { aktiv: false }); // Kurs fehlt im letzten Token: Lernstand bleibt sichtbar
  await s.post('/api/aufgaben/W9-L1-04/pruefen').send({ antwort: RICHTIG['W9-L1-04'] });
  const liste = (await lk.get(`/api/lehrer/kurse/${kurs.id}/schueler`)).body;
  assert.deepEqual(liste.map((x) => x.name).sort(), ['Lena S.', 'Tim T.', 'Uta U.']);
  const lena = liste.find((x) => x.name === 'Lena S.');
  assert.equal(lena.punkte, 10);
  assert.equal(lena.geloest, 1);
  assert.equal(lena.aktiv, true);
  assert.ok(lena.zuletztAktiv);
  assert.equal(liste.find((x) => x.name === 'Uta U.').aktiv, false);
  const text = JSON.stringify(liste);
  assert.ok(!text.includes('"code"') && !text.includes(s.sub), 'keine Codes, keine sub');
});

test('Auswertung: Matrix, Boss, Aufgabenstatistik (inkl. häufiger falscher Antworten), Fallen-Profil', async () => {
  const { app, s, lk, kurs } = await H.szenario();
  const t = await H.schuelerClient(app, kurs, 'Tim T.');
  await s.post('/api/aufgaben/W9-L1-03/pruefen').send({ antwort: FALSCH['W9-L1-03'] });
  await t.post('/api/aufgaben/W9-L1-03/pruefen').send({ antwort: FALSCH['W9-L1-03'] });
  await t.post('/api/aufgaben/W9-L1-03/pruefen').send({ antwort: RICHTIG['W9-L1-03'] });
  const d = (await lk.get(`/api/lehrer/kurse/${kurs.id}/auswertung`)).body;
  assert.deepEqual(d.matrix.levels.map((l) => l.id), W.levels.map((l) => l.id));
  const tim = d.matrix.zeilen.find((z) => z.name === 'Tim T.');
  assert.equal(tim.werte[0].punkte, 15);
  assert.ok(Math.abs(tim.werte[0].anteil - 15 / 90) < 1e-9);
  const a = d.aufgaben.find((x) => x.id === 'W9-L1-03');
  assert.equal(a.versucht, 2);
  assert.equal(a.geloest, 1);
  assert.equal(a.quote, 0.5);
  assert.equal(a.fehlversucheSchnitt, 1);
  assert.equal(a.falscheAntworten[0].anzahl, 2);
  assert.match(a.falscheAntworten[0].antwort, /"<"/);
  const p9 = d.fallen.find((f) => f.p === 'P9');
  assert.deepEqual([p9.fehlversuche, p9.schueler, p9.schuelerGesamt], [2, 2, 2]);
  assert.deepEqual(d.boss.welten, [{ nr: 9, titel: 'Der Testdrache' }]);
});

test('CSV-Export: Übersicht/Matrix/Aufgaben, Semikolon, UTF-8-BOM, Formel-Injektion entschärft', async () => {
  const { app, s, lk, kurs } = await H.szenario();
  await H.schuelerClient(app, kurs, '-Minus M.');
  await s.post('/api/aufgaben/W9-L1-04/pruefen').send({ antwort: RICHTIG['W9-L1-04'] });
  const get = (art) =>
    lk
      .get(`/api/lehrer/kurse/${kurs.id}/export.csv?art=${art}`)
      .buffer(true)
      .parse((res, cb) => {
        let d = '';
        res.setEncoding('utf8');
        res.on('data', (c) => (d += c));
        res.on('end', () => cb(null, d));
      });
  const u = await get('uebersicht');
  assert.equal(u.status, 200);
  assert.match(u.headers['content-type'], /text\/csv/);
  assert.match(u.headers['content-disposition'], /attachment; filename="kryptos_uebersicht_LK_Informatik_13\.csv"/);
  assert.equal(u.body.charCodeAt(0), 0xfeff);
  const zeilen = u.body.slice(1).trim().split('\r\n');
  assert.match(zeilen[0], /^Name;Punkte gesamt;/);
  assert.ok(zeilen.some((z) => z.startsWith('Lena S.;10;10;0;0;')), zeilen.join('\n'));
  assert.ok(zeilen.some((z) => z.startsWith("'-Minus M.;")), 'führendes - wird entschärft');
  const m = await get('matrix');
  assert.match(m.body, /9\.1 Blöcke und Lücken \(%\)/);
  const a = await get('aufgaben');
  assert.match(a.body, /W9-L1-04;Konstruktor erkennen;9;W9-L1;1;begriffe;;1;1;0;100;0/);
});

test('Backup/Restore (JSON): Kennung kryptos/1, Tabellenliste ohne flüchtige Tabellen, vollständige Rücksicherung', async () => {
  const { app, admin, s, kurs } = await H.szenario();
  const { TABLES } = require('../src/db');
  await s.post('/api/aufgaben/W9-L1-04/pruefen').send({ antwort: RICHTIG['W9-L1-04'] });
  const backup = (await admin.get('/api/admin/backup')).body;
  assert.equal(backup.app, 'kryptos');
  assert.equal(backup.format, 1);
  assert.deepEqual(Object.keys(backup.tables), TABLES);
  for (const t of ['sso_jti', 'funk_szenarien', 'funk_rollen', 'funk_nachrichten', 'funk_ereignisse', 'arena', 'arena_chiffren', 'arena_versuche']) assert.ok(!(t in backup.tables), t);
  assert.equal(backup.tables.schueler.length, 1);
  assert.equal(backup.tables.konten.length, 3);
  // Daten verändern, dann wiederherstellen
  await H.schuelerClient(app, kurs, 'Später S.');
  assert.equal((await admin.post('/api/admin/restore').send({ app: 'algoquest-lab', format: 2, tables: {} })).status, 400);
  assert.equal((await admin.post('/api/admin/restore').send({ ...backup, format: 2 })).status, 400);
  assert.equal((await admin.post('/api/admin/restore').send({ ...backup, tables: { ...backup.tables, sso_jti: [] } })).status, 400, 'flüchtige Tabellen nie im Backup');
  assert.equal((await admin.post('/api/admin/restore').send({ ...backup, tables: { ...backup.tables, schueler: [{ ...backup.tables.schueler[0], hack: 1 }] } })).status, 400);
  const r = await admin.post('/api/admin/restore').send(backup);
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(app.locals.db.prepare('SELECT COUNT(*) AS n FROM schueler').get().n, 1);
  // Nach der Rücksicherung enden alle Sitzungen (session_gen + 1); neue Sitzung → Punkte sind da
  assert.equal((await s.get('/api/profil')).status, 401);
  assert.equal((await admin.get('/api/admin/inhalte')).status, 401);
  const neu = H.alsSchueler(app, s.sub, s.id);
  assert.equal((await neu.get('/api/profil')).body.punkte.gesamt, 10);
});

test('Kata: Seed aus seed/warmup, Ziehen/Antworten (Leitner), Import nur für Superadmin', async () => {
  const path = require('node:path');
  const app = H.makeApp({ seedDir: path.join(__dirname, 'fixtures', 'seed_beispiel') });
  const admin = await H.adminClient(app);
  const lk = await H.lehrkraftClient(app);
  const kurs = await H.kursAnlegen(lk);
  const s = await H.schuelerClient(app, kurs);
  const meta = (await s.get('/api/kata/meta')).body;
  const gesamt = meta.welten.reduce((x, w) => x + w.anzahl, 0);
  assert.equal(gesamt, 4, 'alle Warm-up-Karten der Fixture geladen: ' + gesamt);
  let z = (await s.post('/api/kata/ziehen').send({ welt: '4' })).body;
  assert.equal(z.card.welt, 4);
  const a = (await s.post('/api/kata/antwort').send({ kataId: z.card.id, ergebnis: 'gewusst' })).body;
  assert.deepEqual([a.vorher, a.fach], [1, 2]);
  assert.equal((await s.post('/api/kata/antwort').send({ kataId: z.card.id, ergebnis: 'super' })).status, 400);
  const st = (await s.get('/api/kata/statistik?welt=4')).body;
  assert.equal(st.faecher[2], 1);
  z = (await s.post('/api/kata/ziehen').send({ welt: '4', excludeId: a.kataId })).body;
  assert.notEqual(z.card.id, a.kataId);
  // Import
  const karte = { id: 'X-1', welt: 2, kategorie: 'verschluesseln', titel: 'T', aufgabe: 'A', loesung: 'L' };
  assert.equal((await admin.post('/api/admin/katas/import').send({ version: 1, karten: [karte] })).body.neu, 1);
  assert.equal((await admin.post('/api/admin/katas/import').send({ version: 1, karten: [{ ...karte, kategorie: 'Erfunden' }] })).status, 400);
});

test('Urkunden: je Schüler Name, Rang, Punkte, Platz, Abzeichen; nur eigene Kurse', async () => {
  const { app, admin, s, lk, kurs } = await H.szenario();
  const t = await H.schuelerClient(app, kurs, 'Tim T.');
  await s.post('/api/aufgaben/W9-L1-02/pruefen').send({ antwort: RICHTIG['W9-L1-02'] });
  await t.post('/api/aufgaben/W9-L1-04/pruefen').send({ antwort: RICHTIG['W9-L1-04'] });
  const d = (await lk.get(`/api/lehrer/kurse/${kurs.id}/urkunden`)).body;
  assert.equal(d.kurs.name, 'LK Informatik 13');
  assert.deepEqual(d.raenge, ['Lehrling', 'Schreiber', 'Chiffreur', 'Kryptoanalytiker', 'Meister der Chiffren']);
  assert.equal(d.anzahl, 2);
  assert.deepEqual(d.schueler.map((x) => [x.name, x.platz, x.punkte, x.rang]), [['Lena S.', 1, 20, 'Lehrling'], ['Tim T.', 2, 10, 'Lehrling']]);
  assert.deepEqual(d.schueler[0].abzeichen.map((b) => b.name).sort(), ['Erste Schritte', 'Weltenbummler']);
  assert.ok(d.schueler.every((x) => x.abzeichen.every((b) => typeof b.key === 'string')), 'Abzeichen mit key (K14, Siegel der Urkunde)');
  assert.ok(!JSON.stringify(d).includes(s.sub), 'keine Konto-Kennungen auf Urkunden');
  assert.equal((await s.get(`/api/lehrer/kurse/${kurs.id}/urkunden`)).status, 401);
  const andere = await H.lehrkraftClient(app, { name: 'Herr Andere' });
  assert.equal((await andere.get(`/api/lehrer/kurse/${kurs.id}/urkunden`)).status, 404);
  assert.equal((await admin.get(`/api/lehrer/kurse/${kurs.id}/urkunden`)).status, 200);
  const seite = await lk.get('/lehrer/urkunden?kurs=' + kurs.id);
  assert.equal(seite.status, 200);
  assert.match(seite.text, /<title>Urkunden · Kryptos/);
  assert.match(seite.text, /\/static\/css\/druck\.css\?v=/);
  assert.match(seite.text, /krypto\/urkunden\.js\?v=/);
});

test('Aufgaben-Vorschau für Lehrkräfte: Welten mit Level-Infos und Boss-Pool, Aufgaben mit Lösung und Erklärung', async () => {
  const { s, lk, admin } = await H.szenario();
  const w = (await lk.get('/api/lehrer/vorschau')).body.welten.find((x) => x.nr === 9);
  assert.equal(w.levels[0].ab, 'AB 1 – Beispiel, Teil A');
  assert.equal(w.levels[0].ide, 'AQ_W9_Beispiel_Geruest.txt – Level 9.1');
  assert.equal(w.levels[1].aufgaben.length, W.levels[1].aufgaben.length);
  assert.deepEqual(w.levels[1].aufgaben[1].arten, ['lines', 'gaps']);
  assert.equal(w.boss.pool.length, 6);
  const a = (await lk.get('/api/lehrer/vorschau/W9-L2-02')).body;
  assert.deepEqual(a.loesung, [{ zeilen: [3] }, { g1: ['<'] }]);
  assert.deepEqual(a.muster, [[3], { g1: '<' }]);
  assert.ok(a.erklaerung.length && a.tipps.length);
  assert.deepEqual([a.ort.level.id, a.ort.index, a.ort.vorher, a.ort.nachher], ['W9-L2', 1, 'W9-L2-01', 'W9-L2-03']);
  const b = (await admin.get('/api/lehrer/vorschau/W9-B-03')).body;
  assert.equal(b.ort.boss.titel, 'Der Testdrache');
  assert.equal(b.loesung.richtig[0], 'b');
  assert.equal((await lk.get('/api/lehrer/vorschau/W9-X-99')).status, 404);
  // Schüler haben keinen Zugriff
  assert.equal((await s.get('/api/lehrer/vorschau/W9-L2-02')).status, 401);
  // Vorschau verändert keine Lernstände
  assert.equal((await s.get('/api/aufgaben/W9-L2-02')).body.zustand.status, 'offen');
});
