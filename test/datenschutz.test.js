'use strict';
// Datenschutz (TECHNIK §15): Löschung nach sub entfernt alle personenbezogenen Zeilen (VERTRAG §6, TECHNIK §7.3).
// Die Abfrage ist generisch: jede Tabelle mit einer Spalte sub, schueler_id oder von_schueler_id wird durchsucht –
// neue Tabellen fallen so automatisch unter den Test.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const H = require('./helpers');

const PERSONEN_SPALTEN = ['sub', 'schueler_id', 'von_schueler_id'];

/** { tabelle: [spalten] } aller Tabellen mit personenbezogenen Spalten. */
function personenTabellen(db) {
  const out = {};
  for (const { name } of db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").all()) {
    const spalten = db.prepare(`PRAGMA table_info(${name})`).all().map((c) => c.name).filter((c) => PERSONEN_SPALTEN.includes(c));
    if (spalten.length) out[name] = spalten;
  }
  return out;
}

/** Zeilen je Tabelle, die zur sub bzw. zu ihren Teilnahme-ids gehören. */
function treffer(db, sub, teilnahmeIds) {
  const out = {};
  for (const [tab, spalten] of Object.entries(personenTabellen(db))) {
    let n = 0;
    for (const s of spalten) {
      if (s === 'sub') n += db.prepare(`SELECT COUNT(*) AS n FROM ${tab} WHERE sub = ?`).get(sub).n;
      else if (teilnahmeIds.length) n += db.prepare(`SELECT COUNT(*) AS n FROM ${tab} WHERE ${s} IN (${teilnahmeIds.map(() => '?').join(',')})`).get(...teilnahmeIds).n;
    }
    out[tab] = n;
  }
  return out;
}

test('Löschung nach sub: keine Zeile mit der sub oder ihren Teilnahme-ids in irgendeiner Tabelle', async () => {
  const app = H.makeApp();
  const db = app.locals.db;
  const k1 = H.kurs(app, 'LK 13 (eA)');
  const k2 = H.kurs(app, 'GK 12 (gA)');
  const mika = H.konto(app, 'schueler', 'Mika R.');
  const ida = H.konto(app, 'schueler', 'Ida K.');
  const t = [H.teilnahme(app, k1, mika, 'Mika R.'), H.teilnahme(app, k2, mika, 'Mika R.', { aktiv: false })];
  const tIda = [H.teilnahme(app, k1, ida, 'Ida K.'), H.teilnahme(app, k2, ida, 'Ida K.')];
  H.befuelle(app, k1, [t[0], tIda[0]], { gemeinsamesTeam: true });
  H.befuelle(app, k2, [t[1], tIda[1]]);

  const tabellen = personenTabellen(db);
  for (const tab of ['konten', 'schueler', 'kurs_lehrkraefte', 'fortschritt', 'fallen_zaehler', 'ide_erledigt', 'abzeichen', 'erfolge', 'training', 'boss_versuche', 'leitner', 'team_mitglieder', 'funk_nachrichten', 'funk_teilnahmen', 'arena_versuche']) {
    assert.ok(tabellen[tab], `${tab} wird durchsucht`);
  }
  const vorher = treffer(db, mika, t);
  for (const tab of Object.keys(tabellen).filter((x) => x !== 'kurs_lehrkraefte')) assert.ok(vorher[tab] > 0, `Testdaten in ${tab}`);

  const r = await request(app).post('/api/verbund/loeschen').set('Authorization', 'Bearer ' + H.verbundToken('loeschen')).send({ sub: mika });
  assert.deepEqual([r.status, r.body], [200, { geloescht: 3 }]);
  const nachher = treffer(db, mika, t);
  for (const [tab, n] of Object.entries(nachher)) assert.equal(n, 0, `${tab}: noch ${n} Zeile(n)`);
  // Ida bleibt vollständig
  const idaRest = treffer(db, ida, tIda);
  for (const tab of ['konten', 'schueler', 'fortschritt', 'team_mitglieder', 'funk_nachrichten', 'arena_versuche']) assert.ok(idaRest[tab] > 0, `Ida: ${tab}`);
  // Volltextsuche: Name taucht nirgends mehr auf
  for (const tab of Object.keys(tabellen)) {
    const spalten = db.prepare(`PRAGMA table_info(${tab})`).all().filter((c) => /TEXT/i.test(c.type)).map((c) => c.name);
    for (const s of spalten) assert.equal(db.prepare(`SELECT COUNT(*) AS n FROM ${tab} WHERE ${s} LIKE '%Mika%'`).get().n, 0, `${tab}.${s}`);
  }
});

test('Löschung nach sub einer Lehrkraft: Konto und Kurszuordnungen weg, Kurse bleiben', async () => {
  const app = H.makeApp();
  const k = H.kurs(app);
  const lk = H.konto(app, 'lehrkraft', 'Frau K.');
  H.zuordnen(app, k, lk);
  const r = await request(app).post('/api/verbund/loeschen').set('Authorization', 'Bearer ' + H.verbundToken('loeschen')).send({ sub: lk });
  assert.deepEqual(r.body, { geloescht: 1 });
  for (const [tab, n] of Object.entries(treffer(app.locals.db, lk, []))) assert.equal(n, 0, tab);
  assert.equal(H.zaehle(app, 'kurse'), 1);
});

test('Löschvermerke: nachSub/nachKurs merken nur Kennung und Zeit; nicht im Backup', async () => {
  const app = H.makeApp();
  const db = app.locals.db;
  const k = H.kurs(app);
  const mika = H.konto(app, 'schueler', 'Mika R.');
  H.teilnahme(app, k, mika, 'Mika R.');
  const bearer = (z) => 'Bearer ' + H.verbundToken(z);
  await request(app).post('/api/verbund/loeschen').set('Authorization', bearer('loeschen')).send({ sub: mika }).expect(200);
  await request(app).post('/api/verbund/loeschen').set('Authorization', bearer('loeschen')).send({ kurs: k.kurs }).expect(200);
  await request(app).post('/api/verbund/loeschen').set('Authorization', bearer('loeschen')).send({ sub: 's:99999' }).expect(200);
  const zeilen = db.prepare('SELECT art, schluessel, zeit FROM loeschungen ORDER BY art, schluessel').all();
  assert.deepEqual(zeilen.map((r) => [r.art, r.schluessel]), [['kurs', k.kurs], ['sub', mika], ['sub', 's:99999']]);
  for (const r of zeilen) assert.ok(!Number.isNaN(Date.parse(r.zeit)), 'ISO-Zeit');
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM loeschungen WHERE schluessel LIKE '%Mika%' OR zeit LIKE '%Mika%'").get().n, 0, 'kein Name');
  const { TABLES } = require('../src/db');
  assert.ok(!TABLES.includes('loeschungen'), 'nie im Backup');
  assert.ok(!('loeschungen' in app.locals.services.daten.exportieren().tables));
});

test('Restore holt Gelöschte nicht zurück: gelöschte Konten/Kurse samt abhängigen Zeilen werden herausgefiltert, alle Sitzungen enden', async () => {
  const app = H.makeApp();
  const db = app.locals.db;
  const k1 = H.kurs(app, 'LK 13 (eA)');
  const k2 = H.kurs(app, 'GK 12 (gA)');
  const mika = H.konto(app, 'schueler', 'Mika R.');
  const ida = H.konto(app, 'schueler', 'Ida K.');
  const lk = H.konto(app, 'lehrkraft', 'Frau K.');
  H.zuordnen(app, k1, lk);
  H.zuordnen(app, k2, lk);
  const t = [H.teilnahme(app, k1, mika, 'Mika R.'), H.teilnahme(app, k2, mika, 'Mika R.')];
  const tIda = [H.teilnahme(app, k1, ida, 'Ida K.'), H.teilnahme(app, k2, ida, 'Ida K.')];
  H.befuelle(app, k1, [t[0], tIda[0]], { gemeinsamesTeam: true });
  H.befuelle(app, k2, [t[1], tIda[1]]);
  const backup = app.locals.services.daten.exportieren();
  const gen = (sub) => db.prepare('SELECT session_gen FROM konten WHERE sub = ?').get(sub).session_gen;
  const genVorher = gen(ida);

  // Portal löscht Mika (Konto) und den Kurs k2; danach spielt der Superadmin das alte Backup ein
  const bearer = () => 'Bearer ' + H.verbundToken('loeschen');
  await request(app).post('/api/verbund/loeschen').set('Authorization', bearer()).send({ sub: mika }).expect(200);
  await request(app).post('/api/verbund/loeschen').set('Authorization', bearer()).send({ kurs: k2.kurs }).expect(200);
  const zeit = db.prepare("SELECT zeit FROM loeschungen WHERE schluessel = ?").get(mika).zeit;
  const counts = app.locals.services.daten.wiederherstellen(backup);

  // Mika: in keiner Tabelle (auch nicht über Teilnahme-ids)
  for (const [tab, n] of Object.entries(treffer(db, mika, t))) assert.equal(n, 0, `${tab}: ${n} Zeile(n) von Mika`);
  // Kurs k2 mit allem darunter weg
  assert.equal(H.zaehle(app, 'kurse', 'kurs_id = ?', k2.kurs), 0);
  for (const tab of ['schueler', 'kurs_lehrkraefte', 'teams', 'funk_szenarien', 'arena', 'falsche_antworten', 'erfolge']) {
    assert.equal(H.zaehle(app, tab, 'kurs_id = ?', k2.id), 0, `${tab} von k2`);
  }
  // Ida in k1, Lehrkraft und k1 bleiben
  assert.equal(H.zaehle(app, 'schueler', 'id = ?', tIda[0]), 1);
  assert.equal(H.zaehle(app, 'fortschritt', 'schueler_id = ?', tIda[0]), 1);
  assert.equal(H.zaehle(app, 'kurs_lehrkraefte', 'sub = ?', lk), 1);
  assert.equal(H.zaehle(app, 'kurse', 'kurs_id = ?', k1.kurs), 1);
  assert.equal(counts.konten, 2, 'Zählung nach dem Filtern');
  // alle Sitzungen enden; Löschvermerke bleiben unverändert
  assert.equal(gen(ida), genVorher + 1);
  assert.equal(gen(lk), genVorher + 1);
  assert.equal(db.prepare('SELECT zeit FROM loeschungen WHERE schluessel = ?').get(mika).zeit, zeit);
  assert.equal(H.zaehle(app, 'loeschungen'), 2);
});

/* ---------- M7 Task 148: Gesamtprüfung Funkraum/Arena (Design §12, TECHNIK §15, Review Focus 1–4) ---------- */
const F = require('./hilfen_funk');
const WETT = require('node:path').join(__dirname, '..', 'seed', 'funkraum', 'wettknacken.json');
const bearerVon = (app, zweck) => 'Bearer ' + H.verbundToken(zweck, {}, { app });

test('Löschung nach sub mitten in Funkraum und offener Arena: keine Zeile der Person; Team-Ergebnis bleibt', async () => {
  const f = await F.arenaMitChiffren(2, { phase: 'angriff', proTeam: 2, extra: { funkraumDatei: WETT } });
  const sz = await F.starte(f, 'wettknacken');
  const mika = f.teams[0].s[0];
  await mika.put(`/api/funk/${sz.id}/zuordnung`).send({ zuordnung: { U: 'e' } }).expect(200);
  await f.angriff(0, 1, { klartext: F.TEXT2 }).expect(200); // Angriff durch teams[0].c = Mika
  assert.ok(H.zaehle(f.app, 'arena_versuche', 'schueler_id = ?', mika.id) > 0, 'Testdaten: Versuch von Mika');
  await request(f.app).post('/api/verbund/loeschen').set('Authorization', bearerVon(f.app, 'loeschen')).send({ sub: mika.sub }).expect(200);
  for (const [tab, n] of Object.entries(treffer(f.db, mika.sub, [mika.id]))) assert.equal(n, 0, tab);
  assert.equal(H.zaehle(f.app, 'arena_chiffren', 'team_id = ?', f.teams[0].id), 1, 'Team hat noch ein Mitglied');
  assert.equal(H.zaehle(f.app, 'funk_rollen', 'team_id = ?', f.teams[0].id), 1);
  assert.deepEqual(F.fundstellen(f.db, 'Mika'), []);
  // das übrige Teammitglied spielt weiter (Stand, Arena-Liste)
  const ida = f.teams[0].s[1];
  await F.stand(ida, sz.id).expect(200);
  await ida.get(`/api/arena/${f.arenaId}/chiffren`).expect(200);
});

test('Whitelist auf jedem Weg in funk_nachrichten.inhalt (Review Focus 3)', async () => {
  const wege = [
    ['botenlauf', 0, 'nachrichten', () => ({ text: 'grüße', klartext: 'x' })],
    ['botenlauf', 0, 'nachrichten', () => ({ text: 'HALLO\nWELT', klartext: 'hallo welt' })],
    ['schluesseltausch', 0, 'oeffentlich', () => ({ wert: 'A 1' })],
    ['doppelter-schluessel', 0, 'nachrichten', () => ({ text: 'ZZ!', klartext: 'HEUTE', abschnitt: 1 })],
    ['mallory', 2, 'mallory', (f) => ({ aktion: 'schluessel', an: f.teams[0].id, etikett: 'S41; DROP', zertifikat: 'keins' })]
  ];
  for (const [typ, team, pfad, body] of wege) {
    const f = await F.kursMitTeams(3);
    const sz = await F.starte(f, typ);
    await f.teams[team].c.post(`/api/funk/${sz.id}/${pfad}`).send(body(f)).expect(400);
    assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM funk_nachrichten').get().n, 0, typ);
  }
});

test('Keine Freitexte nach außen: Kursübersicht (Verbund), Beamer-Board, Manifest', async () => {
  const f = await F.arenaMitChiffren(3, { phase: 'beurteilung', beschreibung: 'BESCHREIBUNGSTEXT' });
  await f.teams[0].c.put(`/api/arena/${f.arenaId}/beurteilung`).send({ text: 'BEURTEILUNGSTEXT' }).expect(200);
  const sz = await F.starte(f, 'botenlauf');
  await f.teams[0].c.post(`/api/funk/${sz.id}/nachrichten`).send({ text: 'FUNKINHALT', klartext: 'haltet' }).expect(200);
  await f.lk.patch(`/api/lehrer/kurse/${f.kurs.id}`).send({ einstellungen: { beamer: true } }).expect(200);
  const texte = [
    (await request(f.app).get(`/api/verbund/kurse/${encodeURIComponent(f.kurs.kurs)}/uebersicht`).set('Authorization', bearerVon(f.app, 'kurs-uebersicht')).expect(200)).text,
    (await H.client(f.app).get(`/api/board/${f.kurs.boardSchluessel}`).expect(200)).text,
    (await H.client(f.app).get('/api/plattform').expect(200)).text
  ];
  assert.match(texte[1], /Unknackbar/, 'Board zeigt Abzeichen-Erfolge (ohne Team und Inhalt)');
  for (const t of texte) for (const n of ['BESCHREIBUNGSTEXT', 'BEURTEILUNGSTEXT', 'FUNKINHALT', 'Team Skytale', 'Team Scheibe', 'Team Quadrat']) assert.ok(!t.includes(n), n);
});

test('Beurteilung und Beschreibung nur für das eigene Team und die Lehrkraft (TECHNIK §9.6)', async () => {
  const f = await F.arenaMitChiffren(2, { phase: 'beurteilung', beschreibung: 'BESCHREIBUNGSTEXT' });
  await f.teams[0].c.put(`/api/arena/${f.arenaId}/beurteilung`).send({ text: 'BEURTEILUNGSTEXT' }).expect(200);
  const fremd = (await f.teams[1].c.get(`/api/arena/${f.arenaId}/chiffren`).expect(200)).text;
  assert.ok(!fremd.includes('BEURTEILUNGSTEXT'), 'fremde Beurteilung');
  assert.ok(!(await f.teams[1].c.get('/api/arena').expect(200)).text.includes('BEURTEILUNGSTEXT'), 'fremder Status');
  assert.equal((await f.teams[0].c.get('/api/arena').expect(200)).body.eigene.beurteilung, 'BEURTEILUNGSTEXT', 'eigener Status');
  const regie = (await f.lk.get(`/api/lehrer/arena/${f.arenaId}`).expect(200)).text;
  assert.ok(regie.includes('BEURTEILUNGSTEXT'));
  const beamer = (await f.lk.get(`/api/lehrer/arena/${f.arenaId}/beamer`).expect(200)).text;
  for (const n of ['BEURTEILUNGSTEXT', 'BESCHREIBUNGSTEXT']) assert.ok(!beamer.includes(n), n);
});

test('Kurs gelöscht (Verbund): Funkraum, Arena, Teams und Teilnahmen des Kurses vollständig weg', async () => {
  const f = await F.arenaMitChiffren(3, { phase: 'angriff' });
  const sz = await F.starte(f, 'botenlauf');
  await f.teams[0].c.post(`/api/funk/${sz.id}/nachrichten`).send({ text: 'FUNKINHALT', klartext: 'haltet' }).expect(200);
  await f.angriff(0, 1, { klartext: 'falsch geraten' }).expect(200);
  await request(f.app).post('/api/verbund/loeschen').set('Authorization', bearerVon(f.app, 'loeschen')).send({ kurs: f.kurs.kurs }).expect(200);
  for (const tab of ['teams', 'team_mitglieder', 'funk_szenarien', 'funk_rollen', 'funk_nachrichten', 'funk_ereignisse', 'funk_teilnahmen', 'arena', 'arena_chiffren', 'arena_versuche']) {
    assert.equal(H.zaehle(f.app, tab), 0, tab);
  }
  for (const n of ['FUNKINHALT', 'Team Skytale']) assert.deepEqual(F.fundstellen(f.db, n), [], n);
  assert.deepEqual(F.fundstellen(f.db, 'Mika'), ['konten.name'], 'nur das Konto bleibt (Portal verwaltet es, VERTRAG §6)');
});
