'use strict';
// Abzeichen (Regeln im Code), Scoreboard-Sichtbarkeit, Beamer-Board.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const H = require('./helpers');
const { RICHTIG, FALSCH, LEVEL_AUFGABEN } = require('./fixtures/antworten');

async function erhalten(s) {
  return (await s.get('/api/profil')).body.abzeichen.filter((a) => a.erhalten).map((a) => a.key);
}

test('Erste Schritte, Weltenbummler, Zehnerserie, Welt gemeistert, Fallensucher', async () => {
  const { s } = await H.szenario();
  const r = await s.post(`/api/aufgaben/${LEVEL_AUFGABEN[0]}/pruefen`).send({ antwort: RICHTIG[LEVEL_AUFGABEN[0]] });
  assert.deepEqual(r.body.neueAbzeichen.map((b) => b.key).sort(), ['erste_schritte', 'weltenbummler']);
  for (const id of LEVEL_AUFGABEN.slice(1, 9)) await s.post(`/api/aufgaben/${id}/pruefen`).send({ antwort: RICHTIG[id] });
  assert.ok(!(await erhalten(s)).includes('zehnerserie'), 'erst 9 in Folge');
  // Fehlversuch unterbricht die Serie nicht rückwirkend, aber setzt sie zurück
  await s.post(`/api/aufgaben/${LEVEL_AUFGABEN[9]}/pruefen`).send({ antwort: FALSCH[LEVEL_AUFGABEN[9]] });
  for (const id of LEVEL_AUFGABEN.slice(9)) await s.post(`/api/aufgaben/${id}/pruefen`).send({ antwort: RICHTIG[id] });
  const p = (await s.get('/api/profil')).body;
  // Serie: 9 vor dem Fehlversuch, danach alle übrigen außer der fehlversuchten Aufgabe
  const serie = Math.max(9, LEVEL_AUFGABEN.length - 10);
  assert.equal(p.serie.serie_max, serie);
  const keys = await erhalten(s);
  assert.equal(keys.includes('zehnerserie'), serie >= 10);
  assert.ok(keys.includes('welt9_gemeistert'), 'alle Level-Aufgaben gelöst');
  // Der Fehlversuch betraf eine Aufgabe ohne Falle → Fallensucher trotzdem erreicht
  assert.ok(keys.includes('fallensucher'));
});

test('Zehnerserie: 10 Aufgaben in Folge ohne Fehlversuch', async () => {
  const { s } = await H.szenario();
  for (const id of LEVEL_AUFGABEN.slice(0, 10)) await s.post(`/api/aufgaben/${id}/pruefen`).send({ antwort: RICHTIG[id] });
  assert.ok((await erhalten(s)).includes('zehnerserie'));
});

test('Fallensucher: je Falle drei (bzw. alle vorhandenen) Aufgaben ohne Fehlversuch', async () => {
  const { s } = await H.szenario();
  for (const id of LEVEL_AUFGABEN) await s.post(`/api/aufgaben/${id}/pruefen`).send({ antwort: RICHTIG[id] });
  assert.ok((await erhalten(s)).includes('fallensucher'));
  const { s: s2 } = await H.szenario();
  // alle Level-Aufgaben mit P9 (aus der Fixture) zuerst falsch beantworten
  const W = require('./fixtures/welt_beispiel.json');
  const p9 = W.aufgaben.filter((a) => LEVEL_AUFGABEN.includes(a.id) && (a.fallen || []).includes('P9')).map((a) => a.id);
  assert.ok(p9.length > 0);
  for (const id of p9) await s2.post(`/api/aufgaben/${id}/pruefen`).send({ antwort: FALSCH[id] });
  for (const id of LEVEL_AUFGABEN) await s2.post(`/api/aufgaben/${id}/pruefen`).send({ antwort: RICHTIG[id] });
  assert.ok(!(await erhalten(s2)).includes('fallensucher'));
});

test('Fleißig, Unermüdlich, Ohne Tipp, Trainingsprofi, Kata-Meister (Regeln über Datenstand)', async () => {
  const { app, s } = await H.szenario();
  const db = app.locals.db;
  const sid = db.prepare('SELECT id FROM schueler').get().id;
  const svc = app.locals.services;
  // Kata-Meister: 30 Karten in Fach 5
  const karten = db.prepare('SELECT id FROM katas LIMIT 30').all();
  assert.equal(karten.length, 0, 'Testszenario lädt keine Kata-Seeds');
  for (let i = 0; i < 30; i++) {
    db.prepare("INSERT INTO katas (id, welt, kategorie, titel, aufgabe, loesung) VALUES (?, 1, 'verschluesseln', 't', 'a', 'l')").run('K' + i);
    db.prepare("INSERT INTO leitner (schueler_id, kata_id, box, due_at) VALUES (?, ?, 5, '2030-01-01')").run(sid, 'K' + i);
  }
  // Trainingsprofi: 100 gelöste Trainingsaufgaben
  const ins = db.prepare("INSERT INTO training (schueler_id, welt, generator, seed, daten, status, tag, created_at) VALUES (?, 4, 'stapel', 1, '{}', 'geloest', '2026-10-01', '2026-10-01')");
  for (let i = 0; i < 100; i++) ins.run(sid);
  const neu = svc.stand.pruefeAbzeichen({ id: sid }).map((b) => b.key);
  assert.ok(neu.includes('kata_meister') && neu.includes('trainingsprofi'), neu.join());
  // Regeln für 50/150 gelöste und 20 Stufe-3 ohne Tipp: Schwellen im Code
  const defs = svc.stand.definitionen().map((d) => d.key);
  for (const k of ['fleissig', 'unermuedlich', 'ohne_tipp', 'makellos', 'welt9_gemeistert', 'boss9_besiegt']) assert.ok(defs.includes(k), k);
  // Abzeichen werden nur einmal vergeben
  assert.deepEqual(svc.stand.pruefeAbzeichen({ id: sid }), []);
  void s;
});

test('Fleißig (50), Unermüdlich (150), Ohne Tipp (20 × Stufe 3) mit einer großen Testwelt', async () => {
  const fs = require('node:fs');
  const os = require('node:os');
  const path = require('node:path');
  const aufgaben = Array.from({ length: 160 }, (_, i) => ({
    id: `W8-L1-${String(i + 1).padStart(3, '0')}`,
    titel: 'Aufgabe ' + (i + 1),
    stufe: i < 25 ? 3 : 1,
    kategorie: 'modulo',
    tipps: ['Tipp'],
    inhalt: [{ t: 'text', md: 'Wie viel ist 1? [[g]]' }],
    interaktion: { kind: 'gaps', felder: { g: { typ: 'zahl' } } },
    loesung: { g: ['1'] },
    erklaerung: [{ t: 'text', md: 'Eins.' }]
  }));
  const welt = { version: 2, welt: 8, titel: 'Die Großwelt', farbe: '#336699', levels: [{ id: 'W8-L1', titel: 'Viel', aufgaben: aufgaben.map((a) => a.id) }], aufgaben };
  const datei = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'aql-gross-')), 'welt8.json');
  fs.writeFileSync(datei, JSON.stringify(welt));
  const uhr = H.uhr();
  const { s } = await H.szenario({ weltDateien: [datei], now: uhr });
  await s.post('/api/aufgaben/W8-L1-001/tipp').send({});
  for (let i = 0; i < 150; i++) {
    uhr.vor(1000); // Rate-Limit (90 Prüfungen pro Minute) nicht auslösen
    const id = aufgaben[i].id;
    const r = await s.post(`/api/aufgaben/${id}/pruefen`).send({ antwort: { g: '1' } });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    const k = (r.body.neueAbzeichen || []).map((b) => b.key);
    if (i === 49) assert.ok(k.includes('fleissig'), 'nach 50');
    if (i === 20) assert.ok(k.includes('ohne_tipp'), '21 Stufe-3 gelöst, eine davon mit Tipp → 20 ohne Tipp');
    if (i === 149) assert.ok(k.includes('unermuedlich'), 'nach 150');
  }
});

test('Scoreboard: Sichtbarkeit, Filter je Welt, eigener Eintrag, gleiche Punkte = gleicher Platz, keine ids', async () => {
  const { app, s, lk, kurs } = await H.szenario();
  const t = await H.schuelerClient(app, kurs, 'Tim T.');
  const u = await H.schuelerClient(app, kurs, 'Uta U.');
  await s.post('/api/aufgaben/W9-L1-01/pruefen').send({ antwort: RICHTIG['W9-L1-01'] }); // 10
  await t.post('/api/aufgaben/W9-L1-04/pruefen').send({ antwort: RICHTIG['W9-L1-04'] }); // 10
  await u.post('/api/aufgaben/W9-L1-02/pruefen').send({ antwort: RICHTIG['W9-L1-02'] }); // 20
  let sb = (await s.get('/api/scoreboard')).body;
  assert.deepEqual(sb.liste.map((r) => [r.platz, r.name, r.punkte]), [[1, 'Uta U.', 20], [2, 'Lena S.', 10], [2, 'Tim T.', 10]]);
  assert.equal(sb.liste.find((r) => r.ich).name, 'Lena S.');
  assert.ok(sb.liste.every((r) => !('id' in r)), 'keine internen ids');
  sb = (await s.get('/api/scoreboard?welt=4')).body;
  assert.ok(sb.liste.every((r) => r.punkte === 0));
  // ausschalten
  await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { scoreboard: false } });
  assert.equal((await s.get('/api/scoreboard')).status, 403);
  assert.equal((await s.get('/api/welten')).body.scoreboard, false);
  assert.equal((await lk.get(`/api/lehrer/kurse/${kurs.id}/scoreboard`)).status, 200, 'Lehrkraft sieht es weiterhin');
  // anderer Kurs sieht nichts davon
  const k2 = await H.kursAnlegen(lk, 'Anderer Kurs');
  const x = await H.schuelerClient(app, k2, 'Xaver X.');
  assert.deepEqual((await x.get('/api/scoreboard')).body.liste.map((r) => r.name), ['Xaver X.']);
});

test('Beamer-Board: nur wenn aktiviert; Top 15, Weltfortschritt, letzte 8 Erfolge', async () => {
  const { app, s, lk, kurs } = await H.szenario();
  const pub = H.client(app);
  assert.equal((await pub.get('/api/board/' + kurs.boardSchluessel)).status, 404);
  await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { beamer: true } });
  for (let i = 0; i < 17; i++) await H.schuelerClient(app, kurs, 'Spieler ' + i);
  for (const id of LEVEL_AUFGABEN.slice(0, 3)) await s.post(`/api/aufgaben/${id}/pruefen`).send({ antwort: RICHTIG[id] });
  const b = (await pub.get('/api/board/' + kurs.boardSchluessel)).body;
  assert.equal(b.liste.length, 15);
  assert.equal(b.liste[0].name, 'Lena S.');
  assert.equal(b.schueler, 18);
  const w = b.welten.find((x) => x.nr === 9);
  assert.ok(w.anteil > 0 && w.anteil < 0.1);
  assert.ok(b.erfolge.length >= 2 && b.erfolge.length <= 8);
  assert.ok(b.erfolge.some((e) => e.text === 'Lena S. hat das Abzeichen „Erste Schritte“ erhalten'));
  // Umbenennen (im Portal, bei der nächsten Anmeldung übernommen) wirkt auch rückwirkend in den Erfolgen
  app.locals.db.prepare("UPDATE schueler SET name = 'Lena M.', name_key = 'lena m.' WHERE id = ?").run(s.id);
  const b2 = (await pub.get('/api/board/' + kurs.boardSchluessel)).body;
  assert.ok(b2.erfolge.every((e) => !e.text.includes('Lena S.')));
  assert.ok(b2.erfolge.some((e) => e.text.includes('Lena M.')));
  const text = JSON.stringify(b2);
  for (const geheim of [s.sub, kurs.kurs, kurs.boardSchluessel, '"id"']) assert.ok(!text.includes(geheim), `keine internen Kennungen: ${geheim}`);
  // nur der genaue Board-Schlüssel (nicht der Kurs-ID oder ein anderer Schlüssel)
  for (const falsch of [kurs.kurs, 'AAAAAAAAAAAA', kurs.boardSchluessel.slice(0, -1)]) assert.equal((await pub.get('/api/board/' + encodeURIComponent(falsch))).status, 404, falsch);
  // Seite selbst
  const seite = await pub.get('/board/' + kurs.boardSchluessel);
  assert.equal(seite.status, 200);
  assert.match(seite.text, /noindex/);
});

/* ---------- M7 Task 147: Funkraum-Veteran, Arena-Knacker, Unknackbar, Artefakte, Server-Icons (E100, E112) ---------- */
const F = require('./hilfen_funk');
const keys = async (c) => (await c.get('/api/profil').expect(200)).body.abzeichen.filter((a) => a.erhalten).map((a) => a.key);

test('Funkraum-Veteran nach drei verschiedenen Szenario-Typen (nicht nach dreimal Botenlauf)', async () => {
  const f = await F.kursMitTeams(3, { zufallBytes: F.festerZufall() });
  for (const typ of ['botenlauf', 'botenlauf', 'schluesseltausch']) {
    const sz = await F.starte(f, typ);
    await F.aktion(f, sz.id, 'beenden').expect(200);
    await F.aktion(f, sz.id, 'schliessen').expect(200);
  }
  assert.ok(!(await keys(f.teams[0].c)).includes('funkraum_veteran'));
  const sz = await F.starte(f, 'mallory');
  await F.aktion(f, sz.id, 'beenden').expect(200);
  for (const t of f.teams) assert.ok((await keys(t.c)).includes('funkraum_veteran'), t.name);
  // Erfolgsmeldung im Kurs (Beamer-Board) ohne Funkraum-Inhalte
  const erfolge = f.db.prepare("SELECT text FROM erfolge WHERE text LIKE '%Funkraum-Veteran%'").all();
  assert.equal(erfolge.length, 3);
});

test('Arena-Knacker sofort für alle Mitglieder des angreifenden Teams; Unknackbar beim Ende der Angriffsphase (E100)', async () => {
  const f = await F.arenaMitChiffren(3, { phase: 'angriff', proTeam: 2 });
  await f.angriff(0, 1, { klartext: F.TEXT2 }).expect(200);
  for (const c of f.teams[0].s) assert.ok((await keys(c)).includes('arena_knacker'));
  assert.ok(!(await keys(f.teams[1].s[0])).includes('arena_knacker'));
  // Fehlversuch bringt nichts
  await f.angriff(2, 0, { klartext: F.TEXT2 }).expect(200);
  assert.ok(!(await keys(f.teams[2].s[0])).includes('arena_knacker'));
  for (const c of f.teams[0].s) assert.ok(!(await keys(c)).includes('unknackbar'), 'erst beim Ende der Angriffsphase');
  await f.phase('beurteilung');
  for (const c of [...f.teams[0].s, ...f.teams[2].s]) assert.ok((await keys(c)).includes('unknackbar'), c.name);
  for (const c of f.teams[1].s) assert.ok(!(await keys(c)).includes('unknackbar'));
});

test('Unknackbar auch, wenn die Frist die Angriffsphase beendet (E102)', async () => {
  const f = await F.arenaMitChiffren(2, { phase: 'werkstatt' });
  const bis = new Date(f.uhr() + 60 * 60 * 1000).toISOString();
  await f.lk.post(`/api/lehrer/arena/${f.arenaId}/phase`).send({ phase: 'angriff', angriffBis: bis }).expect(200);
  f.uhr.vor(2 * 60 * 60 * 1000);
  await f.teams[0].c.get(`/api/arena/${f.arenaId}/chiffren`).expect(200);
  assert.ok((await keys(f.teams[0].c)).includes('unknackbar'));
  assert.ok((await keys(f.teams[1].c)).includes('unknackbar'));
});

test('Artefakte und Server-Icons (E112): Boss-Abzeichen heißt „Artefakt: …“, Icons sind Sprite-Kennungen', async () => {
  const { s } = await H.szenario();
  const liste = (await s.get('/api/profil').expect(200)).body.abzeichen;
  for (const a of liste) assert.match(a.icon, /^a-[a-z]+$/, a.key);
  for (const k of ['funkraum_veteran', 'arena_knacker', 'unknackbar']) assert.ok(liste.some((a) => a.key === k), k);
  assert.equal(liste.find((a) => a.key === 'boss9_besiegt').icon, 'a-siegel', 'Fixture-Welt 9: kein Artefakt, Siegel');
  assert.equal(liste.find((a) => a.key === 'welt9_gemeistert').icon, 'a-welt');
  const A = require('../src/krypto/abzeichen');
  assert.deepEqual(A.abzeichenAnzeige({ key: 'boss0_besiegt', icon: '⚔️', name: 'Der Tribun besiegt', beschreibung: 'x', welt: 0 }), { key: 'boss0_besiegt', icon: 'a-skytale', name: 'Artefakt: Skytale', beschreibung: 'Der Tribun besiegt – das Artefakt der Epoche gehört dir.', welt: 0 });
  assert.deepEqual(A.abzeichenAnzeige({ key: 'boss9_besiegt', icon: '⚔️', name: 'X besiegt', beschreibung: 'y', welt: 9 }), { key: 'boss9_besiegt', icon: 'a-siegel', name: 'X besiegt', beschreibung: 'y', welt: 9 });
  assert.equal(A.abzeichenAnzeige({ key: 'unbekannt', icon: 'siegel', name: 'n', beschreibung: 'b' }).icon, 'siegel', 'unbekannte Abzeichen behalten ihr Icon');
  const D = require('./dom_attrappe');
  const k = D.lade(['common.js', 'krypto/oberflaeche.js', 'krypto/profil.js']);
  assert.deepEqual(k.roh(k.wert('KRProfil').ARTEFAKT), A.ARTEFAKT);
  assert.deepEqual(k.roh(k.wert('KRProfil').ARTEFAKT_NAME), A.ARTEFAKT_NAME);
});

test('Kern ohne Krypto-Hook: abzeichenAnzeige ist die Identität (K42)', async () => {
  const { STANDARD_OPTIONEN } = require('../src/services');
  const d = { key: 'boss0_besiegt', icon: '⚔️', name: 'n', beschreibung: 'b' };
  assert.equal(STANDARD_OPTIONEN.abzeichenAnzeige(d), d);
});
