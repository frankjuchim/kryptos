'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const D = require('./dom_attrappe');
const SITZUNG_S = { rolle: 'schueler', name: 'Mika R.', kurs: { id: 'k:1', name: 'LK 13 (eA)', niveau: 'eA' }, kurse: [{ id: 'k:1', name: 'LK 13 (eA)', aktiv: true }], portal: 'https://portal.test', version: '0.2.0' };
const BASIS = ['common.js', 'krypto/oberflaeche.js', 'krypto/kopfzeile.js'];
test('Labor-Seite: Raster nach Epoche, gesperrt mit Grund, Boss-Banner', async () => {
  const werkzeuge = [{ id: 'scheibe', titel: 'Chiffrierscheibe', welt: 0, frei: true, grund: null }, { id: 'haeufigkeit', titel: 'Häufigkeits-Analysator', welt: 1, frei: false, grund: 'lehrkraft' }, { id: 'vigenere', titel: 'Vigenère-Werkbank', welt: 2, frei: false, grund: 'welt' }];
  const k = D.lade([...BASIS, 'krypto/labor/registry.js', 'krypto/labor/seite.js'], { url: 'http://x.test/labor#/', fetch: { 'GET /api/sitzung': { status: 200, body: SITZUNG_S }, 'GET /api/labor': { status: 200, body: { boss: false, werkzeuge } } } });
  await k.ruhe();
  const haupt = k.document.getElementById('haupt');
  assert.deepEqual(k.alle(haupt, 'section.labor-epoche').map((s) => s.getAttribute('data-epoche')), ['0', '1', '2']);
  assert.equal(k.eins(haupt, 'a.werkzeug-karte').getAttribute('href'), '#/scheibe');
  assert.match(k.text(k.eins(haupt, '.werkzeug-karte.gesperrt')), /Deine Lehrkraft schaltet dieses Werkzeug später frei/);
});

/* ---------- Schüler-Seite (M4 Tasks 57–60) ---------- */
const SPIEL = [...BASIS, 'shared/krypto.js', 'render.js', 'interact.js', 'krypto/diagnose_chips.js', 'krypto/labor/registry.js', 'krypto/bloecke.js', 'krypto/interaktionen.js', 'aufgabe.js', 'krypto/zeitleiste.js', 'krypto/epoche.js', 'krypto/level.js', 'krypto/profil.js', 'krypto/spiel.js'];
const welt = (nr, extra = {}) => ({ nr, titel: `Welt ${nr}`, epoche: 'Testepoche', jahr: { von: 1900 + nr, bis: 2000, anzeige: '1900 – 2000' }, farbe: '#5B6B7C', akzentHell: '#C9D3DD', frei: true, punkte: 10, maxPunkte: 40, anteil: 0.25, training: true, archivfund: { titel: 'Die Testdepesche', status: 'offen' }, kapitel: null, boss: { titel: 'Testboss', frei: false, grund: 'Erst 60 % der Level-Punkte.', besiegt: false }, levels: [{ id: `W${nr}-L1`, nr: '1', titel: 'Blöcke', niveau: 'kern', rolle: 'kryptografie', akte: 'Akte W9·1 – Blöcke und Lücken', anzahl: 4, geloest: 4, punkte: 40, maxPunkte: 40, anteil: 1 }, { id: `W${nr}-L3`, nr: '3', titel: 'Analyse', niveau: 'eA', rolle: 'kryptoanalyse', anzahl: 2, geloest: 0, punkte: 0, maxPunkte: 20, anteil: 0 }, { id: `W${nr}-L4`, nr: 'K1', titel: 'Kür', niveau: 'kuer', kuer: true, rolle: 'kryptoanalyse', anzahl: 1, geloest: 0, punkte: 0, maxPunkte: 10, anteil: 0 }], ...extra });
const spielFetch = (welten) => ({ 'GET /api/sitzung': { status: 200, body: SITZUNG_S }, 'GET /api/welten': { status: 200, body: { welten, scoreboard: true, niveau: 'eA' } }, 'GET /api/profil': { status: 200, body: { rang: { name: 'Schreiber', index: 1, anteil: 0.12, naechster: { name: 'Chiffreur', ab: 0.3 } }, punkte: { gesamt: 10 }, welten: [], fallen: [], abzeichen: [] } }, 'GET /api/labor': { status: 200, body: { boss: false, werkzeuge: [] } } });
test('Zeitleiste: Position logarithmisch, Mindestabstand, Tore frei/gesperrt, Entsiegeln einmalig', async () => {
  const k = D.lade(SPIEL, { url: 'http://x.test/spiel#/', fetch: spielFetch([welt(9), welt(8, { frei: false, titel: 'Die Antike' })]) });
  k.medien['(prefers-reduced-motion: reduce)'] = true;
  await k.ruhe();
  const Z = k.wert('KRZeitleiste');
  assert.equal(Z.position(-500), 0);
  assert.equal(Z.position(2026), 1);
  assert.ok(Z.position(850) > Z.position(-50));
  const px = Z.verteile([0, 0.01, 0.02, 0.9], 1000, 140);
  assert.ok(px.every((x, i) => i === 0 || x - px[i - 1] >= 140) && px.at(-1) <= 1000);
  const haupt = k.document.getElementById('haupt');
  assert.match(k.text(k.eins(haupt, 'h1')), /Willkommen zurück, Mika R\./);
  assert.equal(k.eins(haupt, 'a.tor').getAttribute('href'), '#/epoche/9');
  const zu = k.eins(haupt, '.tor.gesperrt');
  assert.match(k.text(zu), /noch verschlüsselt/);
  assert.doesNotMatch(k.text(zu), /Antike/, 'Titel gesperrter Epochen nur als Geheimtext');
  assert.deepEqual(JSON.parse(k.window.localStorage.getItem('kr_entsiegelt')), [9]);
  assert.deepEqual([...k.wert('KR.RAENGE')], require('../src/krypto/fach').RAENGE.map((r) => r.name));
});
test('Epoche: Level-Karten mit Aktenzeichen, Rolle, Niveau nur ≠ Kern, Kür-Abschnitt, Boss gesperrt mit Grund', async () => {
  const k = D.lade(SPIEL, { url: 'http://x.test/spiel#/epoche/9', fetch: spielFetch([welt(9)]) });
  await k.ruhe();
  const haupt = k.document.getElementById('haupt');
  const karten = k.alle(haupt, 'a.karte-akte');
  assert.deepEqual(karten.map((a) => a.getAttribute('href')), ['#/level/W9-L1', '#/level/W9-L3', '#/level/W9-L4']);
  assert.match(k.text(karten[0]), /Akte W9·1/);
  assert.match(k.text(karten[0]), /🛡 Kryptografie/);
  assert.equal(k.alle(karten[0], '.chip-niveau').length, 0);
  assert.equal(k.text(k.eins(karten[1], '.chip-niveau')), 'eA');
  assert.ok(k.eins(haupt, 'section.kuer a.karte-akte[href="#/level/W9-L4"]'));
  assert.match(k.text(k.eins(haupt, '.boss-karte')), /Erst 60 % der Level-Punkte/);
  assert.equal(k.document.documentElement.style.getPropertyValue('--akzent'), '#5B6B7C');
  assert.ok(k.eins(haupt, 'a[href="#/archivfund/9"]'));
});
test('Kurswahl: aktive Kurse, Wahl sendet POST /api/sitzung/kurs und lädt neu', async () => {
  const s = { ...SITZUNG_S, kurse: [{ id: 'k:1', name: 'LK 13 (eA)', aktiv: true }, { id: 'k:2', name: 'GK 12 (gA)', aktiv: true }, { id: 'k:3', name: 'Alt', aktiv: false }] };
  const k = D.lade(SPIEL, { url: 'http://x.test/spiel#/kurs', fetch: { ...spielFetch([welt(9)]), 'GET /api/sitzung': { status: 200, body: s }, 'POST /api/sitzung/kurs': { status: 200, body: { ok: true } } } });
  await k.ruhe();
  const haupt = k.document.getElementById('haupt');
  const knoepfe = k.alle(haupt, 'button.kurs-waehlen');
  assert.equal(knoepfe.length, 2, 'nur aktive Kurse');
  assert.match(k.text(haupt), /aktueller Kurs/);
  k.klick(knoepfe[1]);
  await k.ruhe();
  assert.deepEqual(k.anfragen.find((a) => a.pfad === '/api/sitzung/kurs').body, { kurs: 'k:2' });
  assert.equal(k.neugeladen, 1);
});
test('Router: unbekannte Route → Zeitleiste; Lehrkraft-Sitzung → Startseite', async () => {
  let k = D.lade(SPIEL, { url: 'http://x.test/spiel#/gibtsnicht', fetch: spielFetch([welt(9)]) });
  await k.ruhe();
  assert.match(k.text(k.document.getElementById('haupt')), /Willkommen zurück/);
  assert.match(k.document.title, /Zeitleiste · Kryptos/);
  k = D.lade(SPIEL, { url: 'http://x.test/spiel#/', fetch: { ...spielFetch([]), 'GET /api/sitzung': { status: 200, body: { rolle: 'lehrkraft', name: 'Frau M.', kurse: [] } } } });
  await k.ruhe();
  assert.deepEqual(k.navigiert, ['/']);
});
test('Zeitleiste: Epochen ohne Seed (fach.WELTEN) erscheinen als „noch verschlüsselt“, nicht anklickbar', async () => {
  const k = D.lade(SPIEL, { url: 'http://x.test/spiel#/', fetch: spielFetch([welt(9)]) });
  k.medien['(prefers-reduced-motion: reduce)'] = true;
  await k.ruhe();
  const haupt = k.document.getElementById('haupt');
  assert.equal(k.alle(haupt, 'ol.tore li.tor-li').length, 8, '7 Epochen + Testwelt 9');
  assert.equal(k.alle(haupt, '.tor.gesperrt').length, 7);
  assert.equal(k.alle(haupt, '.tor.gesperrt[href], .tor.gesperrt a').length, 0);
  assert.deepEqual(k.roh(k.wert('KRZeitleiste.EPOCHEN').map((e) => e.titel)), require('../src/krypto/fach').WELTEN.map((w) => w.titel));
});
test('Level: Archivwissen, Aufgabenliste mit Status, Werkzeug-Karte nur wenn frei, IDE-Schalter', async () => {
  const level = { welt: { nr: 9, titel: 'Testwelt', farbe: '#5B6B7C' }, niveau: 'eA', level: { id: 'W9-L1', nr: '1', titel: 'Blöcke', niveau: 'kern', rolle: 'kryptografie', werkzeug: ['scheibe', 'haeufigkeit'], akte: 'Akte W9·1 – Blöcke und Lücken', video: { nr: 1, titel: 'Testvideo' }, ide: 'Test-IDE', intro: [{ t: 'hinweis', md: '**Archivwissen:** A = 1' }], maxPunkte: 20 }, aufgaben: [{ id: 'W9-L1-01', titel: 'Eins', stufe: 1, punkte: 10, kategorie: 'entschluesseln', niveau: 'kern', status: 'geloest', erreicht: 10, arten: ['gaps'] }, { id: 'W9-L1-02', titel: 'Zwei', stufe: 2, punkte: 20, kategorie: 'modulo', niveau: 'ergaenzung', status: 'offen', erreicht: 0, arten: ['gaps'] }], ideErledigt: false, vorher: null, nachher: { id: 'W9-L2', titel: 'Zwei' } };
  const f = { ...spielFetch([welt(9)]), 'GET /api/levels/W9-L1': { status: 200, body: level }, 'GET /api/labor': { status: 200, body: { boss: false, werkzeuge: [{ id: 'scheibe', titel: 'Chiffrierscheibe', welt: 0, frei: true, grund: null }, { id: 'haeufigkeit', titel: 'Häufigkeits-Analysator', welt: 1, frei: false, grund: 'lehrkraft' }] } }, 'POST /api/levels/W9-L1/ide': { status: 200, body: { erledigt: true } } };
  const k = D.lade(SPIEL, { url: 'http://x.test/spiel#/level/W9-L1', fetch: f });
  await k.ruhe();
  const haupt = k.document.getElementById('haupt');
  assert.match(k.text(k.eins(haupt, 'section.archivwissen')), /A = 1/);
  const li = k.alle(haupt, 'ol.aufgaben-liste li');
  assert.match(k.text(li[0]), /gelöst/);
  assert.match(k.text(li[1]), /Modulo-Rechnen/);
  assert.equal(k.text(k.eins(li[1], '.chip-niveau')), 'E');
  assert.deepEqual(k.alle(haupt, 'a.werkzeug-link').map((a) => a.getAttribute('href')), ['/labor#/scheibe']);
  assert.match(k.text(haupt), /Erklärvideo Nr\. 1: Testvideo/);
  k.klick(k.eins(haupt, 'input.ide-erledigt'));
  await k.ruhe();
  assert.deepEqual(k.anfragen.find((a) => a.pfad === '/api/levels/W9-L1/ide').body, { erledigt: true });
  assert.equal(k.window.localStorage.getItem('kr_zuletzt'), '"W9-L1"');
});
test('Aufgabe: Prüfen sendet die Antwort, Diagnose-Chip erscheint, Erklärung nach dem Lösen', async () => {
  const a = { id: 'W9-L5-01', titel: 'Caesar', stufe: 1, punkte: 10, kategorie: 'entschluesseln', niveau: 'kern', fallen: ['P3'], tippsAnzahl: 1, inhalt: [{ t: 'text', md: 'Entschlüssele.' }], interaktion: { kind: 'chiffre', richtung: 'ent', verfahren: { typ: 'caesar', k: 3 }, eingabe: 'CXY' } };
  let n = 0;
  const f = { ...spielFetch([welt(9)]), 'GET /api/aufgaben/W9-L5-01': { status: 200, body: { aufgabe: a, zustand: { status: 'offen', fehlversuche: 0, tippsGenutzt: 0, moeglich: 10 }, ort: { welt: { nr: 9, titel: 'Testwelt', farbe: '#5B6B7C' }, level: { id: 'W9-L5', nr: '5', titel: 'Werkbank' }, index: 0, anzahl: 1, vorher: null, nachher: null } } }, 'POST /api/aufgaben/W9-L5-01/pruefen': () => (++n === 1 ? { status: 200, body: { ok: false, diagnose: [{ p: 'P3', code: 'richtung', text: 'Richtung.' }], teile: [{ ok: false, zeichen: [false, false, false] }], zustand: { status: 'offen', fehlversuche: 1, moeglich: 8 } } } : { status: 200, body: { ok: true, geloest: true, punkteErhalten: 8, loesung: { text: 'ZUV' }, erklaerung: [{ t: 'text', md: 'Zurückrechnen.' }], zustand: { status: 'geloest', punkte: 8 } } }) };
  const k = D.lade(SPIEL, { url: 'http://x.test/spiel#/aufgabe/W9-L5-01', fetch: f });
  await k.ruhe();
  const haupt = k.document.getElementById('haupt');
  k.alle(haupt, 'input.kaestchen').forEach((x, i) => k.tippe(x, 'FAB'[i]));
  k.klick(k.eins(haupt, '#pruefen'));
  await k.ruhe();
  assert.deepEqual(k.anfragen.find((x) => x.pfad === '/api/aufgaben/W9-L5-01/pruefen').body, { antwort: ['F', 'A', 'B'] });
  assert.match(k.text(haupt), /P3 Umkehrung falsch/);
  k.alle(haupt, 'input.kaestchen').forEach((x, i) => { x.value = ''; k.tippe(x, 'ZUV'[i]); });
  k.klick(k.eins(haupt, '#pruefen'));
  await k.ruhe();
  assert.match(k.text(haupt), /Zurückrechnen\./);
});
test('Archivfund: Kopfzusatz, ohne Punkte, Prüfen an /api/archivfund/<nr>/pruefen, Link zur Epoche', async () => {
  const a = { id: 'W9-A-01', titel: 'Depesche', stufe: 1, punkte: 0, kategorie: 'entschluesseln', inhalt: [{ t: 'text', md: 'Was steht da?' }], interaktion: { kind: 'chiffre', richtung: 'ent', verfahren: { typ: 'caesar', k: 3 }, eingabe: 'DE' } };
  const f = { ...spielFetch([welt(9)]), 'GET /api/archivfund/9': { status: 200, body: { welt: { nr: 9, titel: 'Testwelt', farbe: '#5B6B7C' }, titel: 'Die Testdepesche', aufgabe: a, zustand: { status: 'offen', fehlversuche: 0, tippsGenutzt: 0, moeglich: 0 } } }, 'POST /api/archivfund/9/pruefen': { status: 200, body: { ok: true, geloest: true, punkteErhalten: 0, zustand: { status: 'geloest', punkte: 0 } } } };
  const k = D.lade(SPIEL, { url: 'http://x.test/spiel#/archivfund/9', fetch: f });
  await k.ruhe();
  const haupt = k.document.getElementById('haupt');
  assert.match(k.text(k.eins(haupt, '.aufgabe-kopf')), /Archivfund – ohne Punkte.*Einstiegsrätsel der Epoche/);
  assert.doesNotMatch(k.text(k.eins(haupt, '.aufgabe-kopf')), /\d\s*Punkte/);
  k.alle(haupt, 'input.kaestchen').forEach((x, i) => k.tippe(x, 'AB'[i]));
  k.klick(k.eins(haupt, '#pruefen'));
  await k.ruhe();
  assert.ok(k.anfragen.some((x) => x.pfad === '/api/archivfund/9/pruefen'));
  assert.match(k.text(haupt), /Entschlüsselt! \(Archivfund – ohne Punkte\)/);
  assert.ok(k.eins(haupt, 'a[href="#/epoche/9"]'));
});
test('Boss-Kampf: keine Werkzeug-Blöcke, kein Labor-Link, Antwort wird gespeichert; Auswertung mit Diagnose', async () => {
  const aufgabe = { id: 'W9-B-05', titel: 'Depesche', stufe: 3, punkte: 30, kategorie: 'entschluesseln', niveau: 'kern', inhalt: [{ t: 'text', md: 'Entschlüsseln Sie.' }, { t: 'werkzeug', id: 'vigenere' }], interaktion: { kind: 'chiffre', richtung: 'ent', verfahren: { typ: 'vigenere' }, schluesselVerdeckt: true, eingabe: 'XZWJN' }, antwort: null };
  const jetzt = new Date().toISOString();
  const ende = new Date(Date.now() + 25 * 60000).toISOString();
  const f = { ...spielFetch([welt(9)]), 'GET /api/boss/kampf/5': { status: 200, body: { id: 5, welt: { nr: 9, titel: 'Testwelt', farbe: '#5B6B7C' }, titel: 'Testboss', start: jetzt, deadline: ende, serverZeit: jetzt, maxPunkte: 30, laeuft: true, aufgaben: [aufgabe] } }, 'PUT /api/boss/kampf/5/antwort': { status: 200, body: { gespeichert: true, anzahl: 1 } } };
  const k = D.lade(SPIEL, { url: 'http://x.test/spiel#/kampf/5', fetch: f });
  await k.ruhe();
  const haupt = k.document.getElementById('haupt');
  assert.equal(k.alle(haupt, '.block-werkzeug, .werkzeug-karte').length, 0);
  assert.equal(k.alle(k.document, 'a[href^="/labor"]').length, 0, 'kein Labor-Link während des Kampfs');
  assert.ok(k.eins(haupt, '[role="timer"]'));
  k.tippe(k.eins(haupt, 'input.kaestchen'), 'T');
  await new Promise((r) => setTimeout(r, 900));
  await k.ruhe();
  assert.deepEqual(k.anfragen.find((a) => a.methode === 'PUT').body, { aufgabeId: 'W9-B-05', antwort: ['T', '', '', '', ''] });
});
test('Boss-Auswertung zeigt Diagnose-Chips und Lösung', async () => {
  const jetzt = new Date().toISOString();
  const a = { id: 'W9-B-05', titel: 'Depesche', stufe: 3, punkte: 30, kategorie: 'entschluesseln', inhalt: [], interaktion: { kind: 'chiffre', richtung: 'ent', verfahren: { typ: 'vigenere', schluessel: 'EIS' }, eingabe: 'XZWJN' }, ok: false, erreicht: 0, antwort: 'BHOND', diagnose: [{ p: 'P3', code: 'richtung', text: 'Richtung.' }], loesung: { text: 'TREFF' }, erklaerung: [{ t: 'text', md: 'Zurück.' }] };
  const f = { ...spielFetch([welt(9)]), 'GET /api/boss/kampf/6': { status: 200, body: { id: 6, welt: { nr: 9, titel: 'Testwelt', farbe: '#5B6B7C' }, titel: 'Testboss', start: jetzt, deadline: jetzt, serverZeit: jetzt, maxPunkte: 30, laeuft: false, ende: jetzt, punkte: 0, anteil: 0, besiegt: false, aufgaben: [a] } } };
  const k = D.lade(SPIEL, { url: 'http://x.test/spiel#/kampf/6', fetch: f });
  await k.ruhe();
  const haupt = k.document.getElementById('haupt');
  assert.match(k.text(haupt), /P3 Umkehrung falsch/);
  assert.match(k.text(haupt), /Zurück\./);
  assert.ok(k.eins(k.document, 'a[href="/labor"]'), 'Labor-Link nach dem Kampf wieder da');
});
test('Boss-Übersicht, Trainingsplatz und Warm-up', async () => {
  const f = {
    ...spielFetch([welt(9)]),
    'GET /api/boss/9': { status: 200, body: { welt: { nr: 9, titel: 'Testwelt', farbe: '#5B6B7C' }, boss: { titel: 'Testboss', dauerMin: 30, anzahl: 4 }, frei: false, grund: 'Erst 60 % der Level-Punkte.', laufend: null, gesperrtBis: null, bester: null, versuche: [] } },
    'GET /api/training/9': { status: 200, body: { welt: { nr: 9, titel: 'Testwelt', farbe: '#5B6B7C' }, generatoren: [{ key: 'caesar', titel: 'Caesar' }], heute: 3, maxProTag: 30, geloestGesamt: 5, offen: null } },
    'POST /api/training/9/neu': { status: 201, body: { id: 7, status: 'offen', fehlversuche: 0, aufgabe: { id: 'T-7', titel: 'Übung', stufe: 1, punkte: 1, inhalt: [{ t: 'text', md: 'Rechne.' }], interaktion: { kind: 'gaps', felder: { a: { loesung: [] } } } } } },
    'GET /api/kata/meta': { status: 200, body: { welten: [{ welt: 9, anzahl: 2 }], kategorien: [{ kategorie: 'modulo', anzahl: 2 }], weltNamen: [{ nr: 9, name: 'Testwelt' }] } },
    'GET /api/kata/statistik': { status: 200, body: { neu: 2, faecher: [0, 0, 0, 0, 0, 0], faellig: 2, gesamt: 2, wiederholungen: 0, gewusst: 0, teilweise: 0, nicht: 0 } },
    'POST /api/kata/ziehen': { status: 200, body: { card: { id: 'K1', welt: 9, kategorie: 'modulo', titel: 'Rest', aufgabe: 'Berechne 7 mod 3.', loesung: '1', minuten: 2 }, neu: true, fach: 0, faellig: 2, gesamt: 2 } }
  };
  let k = D.lade(SPIEL, { url: 'http://x.test/spiel#/boss/9', fetch: f });
  await k.ruhe();
  let haupt = k.document.getElementById('haupt');
  assert.match(k.text(haupt), /keine Werkzeuge/);
  assert.match(k.text(haupt), /Erst 60 % der Level-Punkte/);
  assert.ok(k.eins(haupt, 'button.boss-start').disabled);
  k = D.lade(SPIEL, { url: 'http://x.test/spiel#/training/9', fetch: f });
  await k.ruhe();
  haupt = k.document.getElementById('haupt');
  assert.match(k.text(haupt), /heute 3 von 30 Punkten/);
  assert.match(k.text(haupt), /Übung/);
  assert.ok(k.anfragen.some((a) => a.pfad === '/api/training/9/neu'));
  k = D.lade(SPIEL, { url: 'http://x.test/spiel#/warmup', fetch: f });
  await k.ruhe();
  haupt = k.document.getElementById('haupt');
  assert.match(k.text(k.eins(haupt, 'h1')), /Warm-up/);
  assert.match(k.text(haupt), /Modulo-Rechnen/, 'Kategorien mit Anzeigenamen');
  k.klick(k.eins(haupt, 'button.karte-ziehen'));
  await k.ruhe();
  assert.match(k.text(haupt), /Berechne 7 mod 3\./);
  assert.doesNotMatch(k.text(haupt), /XP|Kata/);
});
test('Profil: Rang mit nächster Schwelle, Artefakte, Abzeichen-Symbole, Fallen-Radar mit Tabelle', async () => {
  const fallen = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'P10'].map((p, i) => ({ p, titel: 'T' + p, text: '', fehlversuche: i === 2 ? 4 : 0 }));
  const profil = { name: 'Mika R.', kurs: { name: 'LK 13 (eA)' }, punkte: { gesamt: 120, level: 100, boss: 20, training: 0 }, geloest: 11, rang: { name: 'Schreiber', index: 1, anteil: 0.2, naechster: { name: 'Chiffreur', ab: 0.3 }, punkte: 24, maxPunkte: 120 }, serie: { serie: 2, serie_max: 5 }, abzeichen: [{ key: 'boss9_besiegt', icon: '⚔️', name: 'Testboss besiegt', beschreibung: '…', erhalten: true, am: null }, { key: 'erste_schritte', icon: '👣', name: 'Erste Schritte', beschreibung: '…', erhalten: false, am: null }], welten: [{ nr: 0, titel: 'Die Antike', farbe: '#B5523B', frei: true, punkte: 10, maxPunkte: 100, boss: { punkte: 20, max: 30 }, training: 0 }], fallen, scoreboard: true };
  const f = { ...spielFetch([welt(9)]), 'GET /api/profil': { status: 200, body: profil } };
  const k = D.lade(SPIEL, { url: 'http://x.test/spiel#/profil', fetch: f });
  await k.ruhe();
  const haupt = k.document.getElementById('haupt');
  assert.match(k.text(haupt), /noch 10 % bis Chiffreur/);
  assert.equal(k.wert('KRProfil').symbol('boss3_besiegt'), 'a-lochstreifen');
  assert.equal(k.wert('KRProfil').symbol('unbekannt'), null);
  const radar = k.eins(haupt, 'figure.fallen-radar');
  assert.equal(k.eins(radar, 'polygon.radar-wert').getAttribute('points').trim().split(/\s+/).length, 10);
  assert.equal(k.alle(radar, 'table.fallen-tabelle tbody tr').length, 10);
  assert.equal(k.eins(radar, 'svg').getAttribute('aria-describedby'), k.eins(radar, 'table').getAttribute('id'));
});
test('Scoreboard: Umschalter, eigene Zeile „(du)“, 20-s-Timer; ausgeschaltet → Hinweis; Abzeichen-Toast', async () => {
  const sb = { welt: null, liste: [{ platz: 1, name: 'Ida K.', punkte: 30, abzeichen: 2, ich: false }, { platz: 2, name: 'Mika R.', punkte: 10, abzeichen: 1, ich: true }], welten: [{ nr: 9, titel: 'Testwelt' }] };
  let k = D.lade(SPIEL, { url: 'http://x.test/spiel#/scoreboard', fetch: { ...spielFetch([welt(9)]), 'GET /api/scoreboard': { status: 200, body: sb } } });
  await k.ruhe();
  let haupt = k.document.getElementById('haupt');
  assert.equal(k.alle(haupt, 'table tbody tr').length, 2);
  assert.match(k.text(k.eins(haupt, 'tr[aria-current="true"]')), /Mika R\. \(du\)/);
  assert.equal(k.eins(haupt, 'button[aria-pressed="true"]').textContent, 'Gesamt');
  assert.ok(k.timer.some((t) => t.ms === 20000 && t.wiederholt));
  k = D.lade(SPIEL, { url: 'http://x.test/spiel#/scoreboard', fetch: { ...spielFetch([welt(9)]), 'GET /api/welten': { status: 200, body: { welten: [welt(9)], scoreboard: false, niveau: 'eA' } } } });
  await k.ruhe();
  haupt = k.document.getElementById('haupt');
  assert.match(k.text(haupt), /Das Scoreboard ist in deinem Kurs ausgeschaltet\./);
  k.wert('KRProfil').abzeichenToast([{ key: 'erste_schritte', name: 'Erste Schritte', icon: '👣' }]);
  await new Promise((r) => setTimeout(r, 700));
  assert.match(k.text(k.document.getElementById('toast')), /Abzeichen: Erste Schritte/);
});

/* ---------- Öffentliche Seiten (M4 Task 61) ---------- */
test('Start: Sitzung leitet weiter; ohne Sitzung Anmelden-Knopf, Hinweis bei ?abgebrochen=1, Fakten aus dem Manifest', async () => {
  let k = D.lade([...BASIS, 'krypto/start.js'], { url: 'http://x.test/', fetch: { 'GET /api/sitzung': { status: 200, body: SITZUNG_S } } });
  await k.ruhe();
  assert.equal(k.navigiert.at(-1), '/spiel');
  k = D.lade([...BASIS, 'krypto/start.js'], { url: 'http://x.test/', fetch: { 'GET /api/sitzung': { status: 200, body: { rolle: 'lehrkraft', name: 'Frau M.', kurse: [] } } } });
  await k.ruhe();
  assert.equal(k.navigiert.at(-1), '/lehrer');
  k = D.lade([...BASIS, 'krypto/start.js'], { url: 'http://x.test/?abgebrochen=1', fetch: { 'GET /api/sitzung': { status: 200, body: { rolle: null, kurse: [], portal: 'https://portal.test' } }, 'GET /api/plattform': { status: 200, body: { umfang: { welten: 7, level: 26, aufgaben: 307, bosse: 7 } } } } });
  await k.ruhe();
  const haupt = k.document.getElementById('haupt');
  assert.equal(k.eins(haupt, 'a.knopf-primaer').getAttribute('href'), '/sso/start?ziel=%2Fspiel');
  assert.match(k.text(haupt), /Die Anmeldung wurde abgebrochen/);
  assert.match(k.text(haupt), /26\s*Level/);
  assert.ok(k.eins(haupt, 'a[href="/gast"]'));
  assert.ok(k.eins(haupt, 'a[href="/themen"]'));
});
test('Themen: Anker #fallen-P3 und #niveaus, Niveau-Chips aus /api/niveaus', async () => {
  const themen = { welten: [{ nr: 9, titel: 'Testwelt', farbe: '#5B6B7C', levels: [{ id: 'W9-L1', nr: '1', titel: 'Blöcke', niveau: 'kern', aufgaben: 4, abBlatt: { titel: 'Akte W9·1 – Blöcke', url: null, demo: false } }], boss: null, training: [], warmup: 0, arbeitsblaetter: [], weitere: [] }], kategorien: [], fallen: [{ p: 'P3', titel: 'Umkehrung falsch', text: 'Erläuterung', anzahl: 1, orte: [] }] };
  const niveaus = { niveaus: ['eA', 'gA'], kategorien: [{ id: 'kern', kurz: 'Kern', lang: 'Kern', gA: true, eA: true }], welten: [{ nr: 0, titel: 'Die Antike', quelle: 'plan', levels: [{ id: '0.1', titel: 'Skytale', niveau: 'kern', aufgaben: { kern: 7 }, hinweis: '', akte: null }], boss: null }], weitere: [] };
  const k = D.lade([...BASIS, 'krypto/themen.js'], { url: 'http://x.test/themen', fetch: { 'GET /api/sitzung': { status: 200, body: { rolle: null, kurse: [] } }, 'GET /api/themen': { status: 200, body: themen }, 'GET /api/niveaus': { status: 200, body: niveaus } } });
  const sektion = k.document.createElement('section'); sektion.setAttribute('id', 'niveaus');
  k.document.getElementById('haupt').appendChild(sektion);
  await k.ruhe();
  assert.ok(k.document.getElementById('fallen-P3'));
  assert.match(k.text(k.document.getElementById('fallen-P3')), /P3 Umkehrung falsch/);
  assert.ok(k.document.getElementById('welt-9'));
  assert.match(k.text(k.document.getElementById('niveaus')), /Skytale/);
  assert.match(k.text(k.document.getElementById('haupt')), /nach der Anmeldung/, 'Akte ohne url');
});
test('Board: Liste, Welt-Fortschritt, Aktualisierung alle 20 s, 404-Hinweis', async () => {
  let n = 0;
  const k = D.lade([...BASIS, 'krypto/board.js'], { url: 'http://x.test/board/abcdefgh1234', fetch: { 'GET /api/board/abcdefgh1234': () => { n++; return { status: 200, body: { kurs: { name: 'LK 13 (eA)' }, schueler: 2, liste: [{ platz: 1, name: 'Mika R.', punkte: 50, rang: 'Schreiber' }, { platz: 2, name: 'Ida K.', punkte: 30, rang: 'Lehrling' }], welten: [{ nr: 9, titel: 'Testwelt', farbe: '#5B6B7C', anteil: 0.4 }], erfolge: [] } }; } } });
  await k.ruhe();
  assert.equal(k.alle(k.document, 'table.board-liste tbody tr').length, 2);
  assert.match(k.text(k.document.getElementById('haupt')), /40 %/);
  assert.equal(n, 1);
  assert.ok(k.timer.some((t) => t.ms === 20000 && t.wiederholt), 'setInterval 20 s');
  const k2 = D.lade([...BASIS, 'krypto/board.js'], { url: 'http://x.test/board/falsch', fetch: { 'GET /api/board/falsch': { status: 404, body: { error: 'x' } } } });
  await k2.ruhe();
  assert.match(k2.text(k2.document.getElementById('haupt')), /Kein Board für diesen Schlüssel/);
});
test('Datenschutz: Link auf die Portal-Erklärung aus der Sitzung', async () => {
  const k = D.lade([...BASIS, 'krypto/datenschutz.js'], { url: 'http://x.test/datenschutz', fetch: { 'GET /api/sitzung': { status: 200, body: { rolle: null, kurse: [], portal: 'https://portal.test' } } } });
  const a = k.document.createElement('a'); a.setAttribute('id', 'portal-datenschutz'); a.setAttribute('href', '/sso/portal');
  k.document.getElementById('haupt').appendChild(a);
  await k.ruhe();
  assert.equal(a.getAttribute('href'), 'https://portal.test/datenschutz');
});
