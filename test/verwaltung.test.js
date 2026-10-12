'use strict';
// Kursverwaltung: Einstellungen, Löschfunktionen, QR-Code, CSV, Auswertung, Backup/Restore, Kata.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const H = require('./helpers');
const { RICHTIG, FALSCH } = require('./fixtures/antworten');

test('Kurs anlegen: Kurscode 6 Zeichen ohne 0/O/1/I; Standard-Einstellungen; Validierung', async () => {
  const { lk } = await H.szenario();
  const k = await H.kursAnlegen(lk, 'Kurs B');
  assert.match(k.code, /^[A-HJ-NP-Z2-9]{6}$/);
  assert.deepEqual(k.einstellungen, { welten: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], boss: 'auto', scoreboard: true, beamer: false, anmeldung: true, kursart: 'eA' });
  assert.equal((await lk.post('/api/lehrer/kurse').send({ name: '' })).status, 400);
  assert.equal((await lk.patch(`/api/lehrer/kurse/${k.id}`).send({ einstellungen: { boss: 'irgendwie' } })).status, 400);
  assert.equal((await lk.patch(`/api/lehrer/kurse/${k.id}`).send({ einstellungen: { welten: 'alle' } })).status, 400);
  const r = await lk.patch(`/api/lehrer/kurse/${k.id}`).send({ name: 'Kurs B2', einstellungen: { welten: [4, 4, 2], scoreboard: false } });
  assert.deepEqual(r.body.einstellungen.welten, [2, 4]);
  assert.equal(r.body.name, 'Kurs B2');
});

test('Schülerliste: Name, Code, Punkte, gelöst, zuletzt aktiv; umbenennen mit Konfliktprüfung', async () => {
  const { app, s, lk, kurs } = await H.szenario();
  await H.schuelerClient(app, kurs.code, 'Tim T.');
  await s.post('/api/aufgaben/W9-L1-04/pruefen').send({ antwort: RICHTIG['W9-L1-04'] });
  const liste = (await lk.get(`/api/lehrer/kurse/${kurs.id}/schueler`)).body;
  const lena = liste.find((x) => x.name === 'Lena S.');
  assert.equal(lena.code, s.code);
  assert.equal(lena.punkte, 10);
  assert.equal(lena.geloest, 1);
  assert.ok(lena.zuletztAktiv);
  assert.equal((await lk.patch(`/api/lehrer/kurse/${kurs.id}/schueler/${lena.id}`).send({ name: 'tim t.' })).status, 409);
  assert.equal((await lk.patch(`/api/lehrer/kurse/${kurs.id}/schueler/${lena.id}`).send({ name: 'Lena M.' })).body.name, 'Lena M.');
  assert.equal((await s.get('/api/profil')).body.name, 'Lena M.', 'Sitzung bleibt gültig');
});

test('Löschen: einzelner Schüler (mit Lernstand), alle Schüler (Bestätigung), Kurs (Bestätigung)', async () => {
  const { app, s, lk, kurs } = await H.szenario();
  const db = app.locals.db;
  await s.post('/api/aufgaben/W9-L1-04/pruefen').send({ antwort: FALSCH['W9-L1-04'] });
  await s.post('/api/aufgaben/W9-L1-04/pruefen').send({ antwort: RICHTIG['W9-L1-04'] });
  const t = await H.schuelerClient(app, kurs.code, 'Tim T.');
  await t.post('/api/aufgaben/W9-L1-01/pruefen').send({ antwort: FALSCH['W9-L1-01'] });
  const liste = (await lk.get(`/api/lehrer/kurse/${kurs.id}/schueler`)).body;
  const lena = liste.find((x) => x.name === 'Lena S.');
  assert.equal((await lk.delete(`/api/lehrer/kurse/${kurs.id}/schueler/${lena.id}`)).status, 200);
  assert.equal((await s.get('/api/profil')).status, 401);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM fortschritt WHERE schueler_id = ?').get(lena.id).n, 0);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM abzeichen WHERE schueler_id = ?').get(lena.id).n, 0);
  // alle löschen: falsche Bestätigung
  assert.equal((await lk.post(`/api/lehrer/kurse/${kurs.id}/alle-schueler-loeschen`).send({ bestaetigung: 'falsch' })).status, 400);
  const r = await lk.post(`/api/lehrer/kurse/${kurs.id}/alle-schueler-loeschen`).send({ bestaetigung: 'LK Informatik 13' });
  assert.deepEqual(r.body, { geloescht: 1 });
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM falsche_antworten').get().n, 0, 'Statistik-Antworten gelöscht');
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM fallen_zaehler').get().n, 0);
  // Kurs löschen
  assert.equal((await lk.delete(`/api/lehrer/kurse/${kurs.id}`).send({ bestaetigung: 'nein' })).status, 400);
  assert.equal((await lk.delete(`/api/lehrer/kurse/${kurs.id}`).send({ bestaetigung: ' LK Informatik 13 ' })).status, 200);
  assert.equal((await lk.get(`/api/lehrer/kurse/${kurs.id}`)).status, 404);
});

test('Superadmin löscht Lehrkraft samt Kursen und Schülern', async () => {
  const { app, admin, lk, kurs } = await H.szenario();
  const db = app.locals.db;
  assert.equal((await admin.delete(`/api/admin/lehrkraefte/${lk.lkId}`)).status, 200);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM kurse WHERE id = ?').get(kurs.id).n, 0);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM schueler').get().n, 0);
  assert.equal((await lk.get('/api/lehrer/kurse')).status, 401);
});

test('QR-Code: SVG mit Beitritts-Link', async () => {
  const { lk, kurs } = await H.szenario();
  const r = await lk.get(`/api/lehrer/kurse/${kurs.id}/qr.svg`).buffer(true).parse((res, cb) => {
    let d = '';
    res.on('data', (c) => (d += c));
    res.on('end', () => cb(null, d));
  });
  assert.equal(r.status, 200);
  assert.match(r.headers['content-type'], /image\/svg\+xml/);
  assert.match(r.body, /^<svg/);
  assert.match(r.body, /<path/);
});

test('Auswertung: Matrix, Boss, Aufgabenstatistik (inkl. häufiger falscher Antworten), Fallen-Profil', async () => {
  const { app, s, lk, kurs } = await H.szenario();
  const t = await H.schuelerClient(app, kurs.code, 'Tim T.');
  await s.post('/api/aufgaben/W9-L1-03/pruefen').send({ antwort: FALSCH['W9-L1-03'] });
  await t.post('/api/aufgaben/W9-L1-03/pruefen').send({ antwort: FALSCH['W9-L1-03'] });
  await t.post('/api/aufgaben/W9-L1-03/pruefen').send({ antwort: RICHTIG['W9-L1-03'] });
  const d = (await lk.get(`/api/lehrer/kurse/${kurs.id}/auswertung`)).body;
  assert.deepEqual(d.matrix.levels.map((l) => l.id), ['W9-L1', 'W9-L2']);
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
  await H.schuelerClient(app, kurs.code, '-Minus M.');
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
  assert.match(u.headers['content-disposition'], /attachment; filename="algoquest-lab_uebersicht_LK_Informatik_13\.csv"/);
  assert.equal(u.body.charCodeAt(0), 0xfeff);
  const zeilen = u.body.slice(1).trim().split('\r\n');
  assert.match(zeilen[0], /^Name;Code;Punkte gesamt;/);
  assert.ok(zeilen.some((z) => z.startsWith(`Lena S.;${s.code};10;10;0;0;`)), zeilen.join('\n'));
  assert.ok(zeilen.some((z) => z.startsWith("'-Minus M.;")), 'führendes - wird entschärft');
  const m = await get('matrix');
  assert.match(m.body, /9\.1 Blöcke und Lücken \(%\)/);
  const a = await get('aufgaben');
  assert.match(a.body, /W9-L1-04;Konstruktor erkennen;9;W9-L1;1;begriffe;;1;1;0;100;0/);
});

test('Backup/Restore (JSON): vollständige Rücksicherung, Schutz vor fremden Formaten', async () => {
  const { app, admin, s, kurs } = await H.szenario();
  await s.post('/api/aufgaben/W9-L1-04/pruefen').send({ antwort: RICHTIG['W9-L1-04'] });
  const backup = (await admin.get('/api/admin/backup')).body;
  assert.equal(backup.app, 'algoquest-lab');
  assert.equal(backup.format, 2);
  assert.equal(backup.tables.schueler.length, 1);
  // Daten verändern, dann wiederherstellen
  await H.schuelerClient(app, kurs.code, 'Später S.');
  assert.equal((await admin.post('/api/admin/restore').send({ app: 'algoquest', format: 1, tables: {} })).status, 400);
  assert.equal((await admin.post('/api/admin/restore').send({ ...backup, tables: { ...backup.tables, boese: [] } })).status, 400);
  assert.equal((await admin.post('/api/admin/restore').send({ ...backup, tables: { ...backup.tables, schueler: [{ ...backup.tables.schueler[0], hack: 1 }] } })).status, 400);
  const r = await admin.post('/api/admin/restore').send(backup);
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(app.locals.db.prepare('SELECT COUNT(*) AS n FROM schueler').get().n, 1);
  // Schüler kann weiterspielen, Punkte sind da
  const c = H.client(app);
  assert.equal((await c.post('/api/schueler/anmelden').send({ kurscode: kurs.code, name: 'Lena S.', code: s.code })).status, 200);
  assert.equal((await c.get('/api/profil')).body.punkte.gesamt, 10);
  // Admin-Login funktioniert weiter
  assert.equal((await H.client(app).post('/api/lehrer/anmelden').send({ email: H.ADMIN_EMAIL, passwort: H.ADMIN_PW })).status, 200);
});

test('Kata: Seed aus seed/warmup, Ziehen/Antworten (Leitner), Import nur für Superadmin', async () => {
  const path = require('node:path');
  const app = H.makeApp({ seedDir: path.join(__dirname, 'fixtures', 'seed_beispiel') });
  const admin = await H.adminClient(app);
  const lk = await H.lehrkraftClient(app, admin);
  const kurs = await H.kursAnlegen(lk);
  const s = await H.schuelerClient(app, kurs.code);
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
  const t = await H.schuelerClient(app, kurs.code, 'Tim T.');
  await s.post('/api/aufgaben/W9-L1-02/pruefen').send({ antwort: RICHTIG['W9-L1-02'] });
  await t.post('/api/aufgaben/W9-L1-04/pruefen').send({ antwort: RICHTIG['W9-L1-04'] });
  const d = (await lk.get(`/api/lehrer/kurse/${kurs.id}/urkunden`)).body;
  assert.equal(d.kurs.name, 'LK Informatik 13');
  assert.deepEqual(d.raenge, ['Lehrling', 'Schreiber', 'Chiffreur', 'Kryptoanalytiker', 'Meister der Chiffren']);
  assert.equal(d.anzahl, 2);
  assert.deepEqual(d.schueler.map((x) => [x.name, x.platz, x.punkte, x.rang]), [['Lena S.', 1, 20, 'Lehrling'], ['Tim T.', 2, 10, 'Lehrling']]);
  assert.deepEqual(d.schueler[0].abzeichen.map((b) => b.name).sort(), ['Erste Schritte', 'Weltenbummler']);
  assert.ok(!JSON.stringify(d).includes(s.code), 'keine Schülercodes auf Urkunden');
  assert.equal((await s.get(`/api/lehrer/kurse/${kurs.id}/urkunden`)).status, 401);
  const andere = await H.lehrkraftClient(app, admin, 'andere@schule.de');
  assert.equal((await andere.get(`/api/lehrer/kurse/${kurs.id}/urkunden`)).status, 404);
  assert.equal((await admin.get(`/api/lehrer/kurse/${kurs.id}/urkunden`)).status, 200);
  const seite = await lk.get('/lehrer/urkunden?kurs=' + kurs.id);
  assert.equal(seite.status, 200);
  assert.match(seite.text, /<title>Urkunden · Kryptos/); // Platzhalter bis M4 (Urkunden-Oberfläche)
});

test('Aufgaben-Vorschau für Lehrkräfte: Welten mit Level-Infos und Boss-Pool, Aufgaben mit Lösung und Erklärung', async () => {
  const { s, lk, admin } = await H.szenario();
  const w = (await lk.get('/api/lehrer/vorschau')).body.welten.find((x) => x.nr === 9);
  assert.equal(w.levels[0].ab, 'AB 1 – Beispiel, Teil A');
  assert.equal(w.levels[0].ide, 'AQ_W9_Beispiel_Geruest.txt – Level 9.1');
  assert.equal(w.levels[1].aufgaben.length, 9);
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
