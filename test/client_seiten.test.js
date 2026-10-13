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
  const level = { welt: { nr: 9, titel: 'Testwelt', farbe: '#5B6B7C' }, niveau: 'eA', level: { id: 'W9-L1', nr: '1', titel: 'Blöcke', niveau: 'kern', rolle: 'kryptografie', werkzeug: ['scheibe', 'haeufigkeit'], akte: 'Akte W9·1 – Blöcke und Lücken', akteDatei: { titel: 'Akte W9·1 – Blöcke und Lücken', url: '/akten/Welt_9_Testwelt/KR_W9-AB1.pdf' }, video: { nr: 1, titel: 'Testvideo', url: null }, ide: 'Test-IDE', intro: [{ t: 'hinweis', md: '**Archivwissen:** A = 1' }], maxPunkte: 20 }, aufgaben: [{ id: 'W9-L1-01', titel: 'Eins', stufe: 1, punkte: 10, kategorie: 'entschluesseln', niveau: 'kern', status: 'geloest', erreicht: 10, arten: ['gaps'] }, { id: 'W9-L1-02', titel: 'Zwei', stufe: 2, punkte: 20, kategorie: 'modulo', niveau: 'ergaenzung', status: 'offen', erreicht: 0, arten: ['gaps'] }], ideErledigt: false, vorher: null, nachher: { id: 'W9-L2', titel: 'Zwei' } };
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
  // Akte als PDF (K38); Video ohne url: nur Titel, kein Link (E35/E51)
  const akte = k.eins(haupt, 'a.akte-pdf[href="/akten/Welt_9_Testwelt/KR_W9-AB1.pdf"]');
  assert.ok(akte);
  assert.match(k.text(akte), /Akte als PDF/);
  assert.equal(k.alle(haupt, '.video-hinweis a').length, 0);
  k.klick(k.eins(haupt, 'input.ide-erledigt'));
  await k.ruhe();
  assert.deepEqual(k.anfragen.find((a) => a.pfad === '/api/levels/W9-L1/ide').body, { erledigt: true });
  assert.equal(k.window.localStorage.getItem('kr_zuletzt'), '"W9-L1"');
});
test('Level: Video mit url als Link, ohne akteDatei kein PDF-Knopf', async () => {
  const level = { welt: { nr: 9, titel: 'Testwelt', farbe: '#5B6B7C' }, niveau: 'eA', level: { id: 'W9-L1', nr: '1', titel: 'Blöcke', niveau: 'kern', rolle: 'kryptografie', werkzeug: [], akte: null, akteDatei: null, video: { nr: 3, titel: 'Vigenère knacken', url: 'https://video.example/v3' }, intro: [], maxPunkte: 0 }, aufgaben: [], ideErledigt: false, vorher: null, nachher: null };
  const f = { ...spielFetch([welt(9)]), 'GET /api/levels/W9-L1': { status: 200, body: level }, 'GET /api/labor': { status: 200, body: { boss: false, werkzeuge: [] } } };
  const k = D.lade(SPIEL, { url: 'http://x.test/spiel#/level/W9-L1', fetch: f });
  await k.ruhe();
  const haupt = k.document.getElementById('haupt');
  assert.equal(k.alle(haupt, 'a.akte-pdf').length, 0);
  const a = k.eins(haupt, '.video-hinweis a[href="https://video.example/v3"]');
  assert.ok(a);
  assert.equal(a.getAttribute('rel'), 'noopener');
  assert.match(k.text(a), /Erklärvideo Nr\. 3: Vigenère knacken/);
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
test('Rang-Plakette: nach dem Lösen mit Punkten neu geladen, ohne Punkte nicht (Beobachtung M5 Task 79–82)', async () => {
  const a = { id: 'W9-L5-01', titel: 'Caesar', stufe: 1, punkte: 10, kategorie: 'entschluesseln', niveau: 'kern', fallen: [], tippsAnzahl: 0, inhalt: [{ t: 'text', md: 'Entschlüssele.' }], interaktion: { kind: 'chiffre', richtung: 'ent', verfahren: { typ: 'caesar', k: 3 }, eingabe: 'CXY' } };
  let profile = 0;
  const ort = { welt: { nr: 9, titel: 'Testwelt', farbe: '#5B6B7C' }, level: { id: 'W9-L5', nr: '5', titel: 'Werkbank' }, index: 0, anzahl: 1, vorher: null, nachher: null };
  const f = {
    ...spielFetch([welt(9)]),
    'GET /api/profil': () => ({ status: 200, body: { rang: { name: profile++ ? 'Schreiber' : 'Lehrling', index: 0, anteil: profile > 1 ? 0.12 : 0 }, punkte: { gesamt: 0 }, welten: [], fallen: [], abzeichen: [] } }),
    'GET /api/aufgaben/W9-L5-01': { status: 200, body: { aufgabe: a, zustand: { status: 'offen', fehlversuche: 0, tippsGenutzt: 0, moeglich: 10 }, ort } },
    'POST /api/aufgaben/W9-L5-01/pruefen': { status: 200, body: { ok: true, geloest: true, punkteErhalten: 10, loesung: { text: 'zuv' }, erklaerung: [], zustand: { status: 'geloest', punkte: 10 } } }
  };
  const k = D.lade(SPIEL, { url: 'http://x.test/spiel#/aufgabe/W9-L5-01', fetch: f });
  await k.ruhe();
  const plakette = k.document.getElementById('kopf-rang');
  assert.match(k.text(plakette), /Lehrling.*0 %/);
  const haupt = k.document.getElementById('haupt');
  k.alle(haupt, 'input.kaestchen').forEach((x, i) => k.tippe(x, 'zuv'[i]));
  k.klick(k.eins(haupt, '#pruefen'));
  await k.ruhe();
  assert.equal(k.anfragen.filter((x) => x.pfad === '/api/profil').length, 2, 'Profil nach dem Lösen neu geladen');
  assert.match(k.text(plakette), /Schreiber.*12 %/);
  // Archivfund (0 Punkte): kein erneuter Abruf
  const ohne = { ...f, 'POST /api/aufgaben/W9-L5-01/pruefen': { status: 200, body: { ok: true, geloest: true, punkteErhalten: 0, loesung: { text: 'zuv' }, erklaerung: [], zustand: { status: 'geloest', punkte: 0 } } } };
  profile = 0;
  const k2 = D.lade(SPIEL, { url: 'http://x.test/spiel#/aufgabe/W9-L5-01', fetch: ohne });
  await k2.ruhe();
  const h2 = k2.document.getElementById('haupt');
  k2.alle(h2, 'input.kaestchen').forEach((x, i) => k2.tippe(x, 'zuv'[i]));
  k2.klick(k2.eins(h2, '#pruefen'));
  await k2.ruhe();
  assert.equal(k2.anfragen.filter((x) => x.pfad === '/api/profil').length, 1, 'ohne Punkte kein neuer Abruf');
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
    'GET /api/boss/9': { status: 200, body: { welt: { nr: 9, titel: 'Testwelt', farbe: '#5B6B7C' }, boss: { titel: 'Testboss', dauerMin: 30, anzahl: 4, rahmen: 'Ein **Drache** bewacht <b>das</b> Testarchiv.' }, frei: false, grund: 'Erst 60 % der Level-Punkte.', laufend: null, gesperrtBis: null, bester: null, versuche: [] } },
    'GET /api/training/9': { status: 200, body: { welt: { nr: 9, titel: 'Testwelt', farbe: '#5B6B7C' }, generatoren: [{ key: 'caesar', titel: 'Caesar' }], heute: 3, maxProTag: 30, geloestGesamt: 5, offen: null } },
    'POST /api/training/9/neu': { status: 201, body: { id: 7, status: 'offen', fehlversuche: 0, aufgabe: { id: 'T-7', titel: 'Übung', stufe: 1, punkte: 1, inhalt: [{ t: 'text', md: 'Rechne.' }], interaktion: { kind: 'gaps', felder: { a: { loesung: [] } } } } } },
    'GET /api/kata/meta': { status: 200, body: { welten: [{ welt: 9, anzahl: 2 }], kategorien: [{ kategorie: 'modulo', anzahl: 2 }], weltNamen: [{ nr: 9, name: 'Testwelt' }] } },
    'GET /api/kata/statistik': { status: 200, body: { neu: 2, faecher: [0, 0, 0, 0, 0, 0], faellig: 2, gesamt: 2, wiederholungen: 0, gewusst: 0, teilweise: 0, nicht: 0 } },
    'POST /api/kata/ziehen': { status: 200, body: { card: { id: 'K1', welt: 9, kategorie: 'modulo', titel: 'Rest', aufgabe: 'Berechne 7 mod 3. Schreibe `rom` dazu.', loesung: '1', minuten: 2 }, neu: true, fach: 0, faellig: 2, gesamt: 2 } }
  };
  let k = D.lade(SPIEL, { url: 'http://x.test/spiel#/boss/9', fetch: f });
  await k.ruhe();
  let haupt = k.document.getElementById('haupt');
  assert.match(k.text(haupt), /keine Werkzeuge/);
  assert.match(k.text(haupt), /Erst 60 % der Level-Punkte/);
  assert.ok(k.eins(haupt, 'button.boss-start').disabled);
  // Rahmentext über den Regeln, Mini-Markdown als Textknoten (kein HTML)
  const rahmen = k.eins(haupt, '.boss-rahmen');
  assert.ok(rahmen, 'Rahmentext fehlt');
  assert.match(k.text(rahmen), /Ein Drache bewacht <b>das<\/b> Testarchiv\./);
  assert.equal(k.alle(rahmen, 'b').length, 0, 'kein HTML aus dem Rahmentext');
  assert.ok(k.eins(rahmen, 'strong'), 'Fettdruck aus Mini-Markdown');
  const kinder = rahmen.parentNode.children;
  assert.ok(kinder.indexOf(rahmen) < kinder.indexOf(k.eins(haupt, '.boss-regeln')), 'Rahmentext steht über den Regeln');
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
  // Warm-up-Texte als Mini-Markdown (Plan M5 Task 89: Klartext/Geheimtext in Backticks wie in Spec §7)
  assert.equal(k.text(k.eins(haupt, '.warmup-text code')), 'rom');
  assert.doesNotMatch(k.text(haupt), /`/);
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
  const themen = { welten: [{ nr: 9, titel: 'Testwelt', farbe: '#5B6B7C', levels: [{ id: 'W9-L1', nr: '1', titel: 'Blöcke', niveau: 'kern', aufgaben: 4, akte: { titel: 'Akte W9·1 – Blöcke', url: null, demo: false } }, { id: 'W9-L2', nr: '2', titel: 'Lücken', niveau: 'kern', aufgaben: 3, akte: { titel: 'Akte W9·2 – Lücken', url: '/akten/Welt_9_Testwelt/KR_W9_Akte2.pdf', demo: true } }], boss: null, training: [], warmup: 0, akten: [], weitere: [] }], werkzeugkarten: [{ nr: 1, titel: 'Abitur-Anlage kompakt', url: '/akten/00_Werkzeugkarten/KR_WK1.pdf', demo: false }, { nr: 2, titel: 'Die 5-Schritte-Methode', url: null, demo: false }], kategorien: [], fallen: [{ p: 'P3', titel: 'Umkehrung falsch', text: 'Erläuterung', anzahl: 1, orte: [] }] };
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
  // Akte mit url als Link (K15), Werkzeugkarten als Liste
  const akteLink = k.eins(k.document.getElementById('welt-9'), 'a.akte-link[href="/akten/Welt_9_Testwelt/KR_W9_Akte2.pdf"]');
  assert.ok(akteLink);
  assert.match(k.text(akteLink), /Akte W9·2 – Lücken/);
  const wk = k.document.getElementById('werkzeugkarten');
  assert.ok(wk, 'Abschnitt #werkzeugkarten');
  assert.equal(k.alle(wk, 'li').length, 2);
  assert.ok(k.eins(wk, 'a[href="/akten/00_Werkzeugkarten/KR_WK1.pdf"]'));
  assert.match(k.text(wk), /WK2 · Die 5-Schritte-Methode/);
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

/* ---------- Lehrkraft-Seite (M4 Tasks 62–64) ---------- */
const LEHRER = [...BASIS, 'shared/krypto.js', 'render.js', 'interact.js', 'krypto/diagnose_chips.js', 'krypto/labor/registry.js', 'krypto/bloecke.js', 'krypto/interaktionen.js', 'aufgabe.js', 'krypto/lehrer.js'];
const SITZUNG_L = { rolle: 'lehrkraft', name: 'Frau M.', kurse: [{ id: 'k:1', name: 'LK 13 (eA)', aktiv: true }], portal: 'https://portal.test' };
const KURS = { id: 3, kurs: 'k:1', name: 'LK 13 (eA)', aktiv: true, einstellungen: { welten: [0, 1, 2, 9], boss: 'auto', scoreboard: true, beamer: false, niveau: 'eA', kuer: 'frei', werkzeuge: { substitution: 'gesperrt' } }, boardSchluessel: 'abcdefgh1234', schueler: 2, zuletztAktiv: null };
const lehrerFetch = (extra = {}) => ({ 'GET /api/sitzung': { status: 200, body: SITZUNG_L }, 'GET /api/lehrer/ich': { status: 200, body: { rolle: 'lehrkraft', name: 'Frau M.' } }, 'GET /api/lehrer/kurse': { status: 200, body: [KURS] }, 'GET /api/lehrer/kurse/3': { status: 200, body: KURS }, 'GET /api/lehrer/werkzeuge': { status: 200, body: [{ id: 'scheibe', titel: 'Chiffrierscheibe', welt: 0, gast: true }, { id: 'substitution', titel: 'Substitutions-Werkbank', welt: 1, gast: false }] }, 'GET /api/lehrer/vorschau': { status: 200, body: { welten: [{ nr: 9, titel: 'Testwelt', levels: [], boss: null }] } }, ...extra });
const seiteLehrer = (k) => k.document.body.classList.add('seite-lehrer');
test('Lehrkraft: Kursliste mit lokaler id im Link und Portal-Kennung als Text (E21)', async () => {
  const k = D.lade(LEHRER, { url: 'http://x.test/lehrer#/', fetch: lehrerFetch(), vorher: seiteLehrer });
  await k.ruhe();
  const a = k.eins(k.document.getElementById('haupt'), 'a[href="#/kurs/3/schueler"]');
  assert.match(k.text(a.closest('tr')), /k:1/);
  assert.match(k.text(a.closest('tr')), /eA/);
});
test('Lehrkraft: leere Kursliste mit Hinweis aufs Portal; unbekannter Kurs → Fehlerbox', async () => {
  let k = D.lade(LEHRER, { url: 'http://x.test/lehrer#/', fetch: lehrerFetch({ 'GET /api/lehrer/kurse': { status: 200, body: [] } }), vorher: seiteLehrer });
  await k.ruhe();
  assert.match(k.text(k.document.getElementById('haupt')), /Kurse legen Sie im Portal an/);
  k = D.lade(LEHRER, { url: 'http://x.test/lehrer#/kurs/99/schueler', fetch: lehrerFetch(), vorher: seiteLehrer });
  await k.ruhe();
  assert.match(k.text(k.document.getElementById('haupt')), /Kurs nicht gefunden/);
  assert.ok(!k.anfragen.some((x) => x.pfad.startsWith('/api/lehrer/kurse/99')), 'keine Anfrage für fremde Kurse');
});
test('Lehrkraft: Schülerliste ohne Codes, inaktive gekennzeichnet; Tabs per Pfeiltaste', async () => {
  const liste = [{ id: 1, name: 'Mika R.', aktiv: true, punkte: 30, geloest: 3, abzeichen: 1, rang: 'Schreiber', zuletztAktiv: null }, { id: 2, name: 'Ida K.', aktiv: false, punkte: 0, geloest: 0, abzeichen: 0, rang: 'Lehrling', zuletztAktiv: null }];
  const k = D.lade(LEHRER, { url: 'http://x.test/lehrer#/kurs/3/schueler', fetch: lehrerFetch({ 'GET /api/lehrer/kurse/3/schueler': { status: 200, body: liste } }), vorher: seiteLehrer });
  await k.ruhe();
  const haupt = k.document.getElementById('haupt');
  const zeilen = k.alle(haupt, 'table.schueler-tabelle tbody tr');
  assert.equal(zeilen.length, 2);
  assert.match(k.text(zeilen[1]), /nicht mehr im Kurs \(Portal\)/);
  const tabs = k.alle(haupt, '.tabs[role="tablist"] button[role="tab"]');
  assert.equal(tabs.find((t) => t.getAttribute('aria-selected') === 'true').getAttribute('data-tab'), 'schueler');
  k.taste(tabs[0], 'ArrowRight');
  await k.ruhe();
  assert.equal(k.window.location.hash, '#/kurs/3/einstellungen');
});
test('Einstellungen: Niveau gA und Werkzeug-Freigabe senden nur Geänderte; gesperrter Kurs nur lesbar', async () => {
  const f = lehrerFetch({ 'PATCH /api/lehrer/kurse/3': (body) => ({ status: 200, body: { ...KURS, einstellungen: { ...KURS.einstellungen, ...body.einstellungen } } }) });
  let k = D.lade(LEHRER, { url: 'http://x.test/lehrer#/kurs/3/einstellungen', fetch: f, vorher: seiteLehrer });
  await k.ruhe();
  const form = k.eins(k.document, 'form.einstellungen');
  k.klick(k.eins(form, 'input[name="niveau"][value="gA"]'));
  const sel = k.eins(form, 'select[name="werkzeug-scheibe"]');
  assert.equal(k.eins(form, 'select[name="werkzeug-substitution"]').value, 'gesperrt');
  sel.value = 'gesperrt'; sel.dispatchEvent(new k.window.Event('change'));
  k.klick(k.eins(form, 'button[type="submit"]'));
  await k.ruhe();
  assert.deepEqual(k.anfragen.find((x) => x.methode === 'PATCH').body, { einstellungen: { niveau: 'gA', werkzeuge: { scheibe: 'gesperrt' } } });
  k = D.lade(LEHRER, { url: 'http://x.test/lehrer#/kurs/3/einstellungen', fetch: lehrerFetch({ 'GET /api/lehrer/kurse/3': { status: 200, body: { ...KURS, aktiv: false } }, 'GET /api/lehrer/kurse': { status: 200, body: [{ ...KURS, aktiv: false }] } }), vorher: seiteLehrer });
  await k.ruhe();
  assert.ok(k.alle(k.document, 'form.einstellungen input, form.einstellungen select').every((x) => x.disabled));
  assert.match(k.text(k.document.getElementById('haupt')), /im Portal abgeschaltet/);
});
test('Einstellungen: Welt abwählen behält nicht angezeigte Welten; Board-Link und neuer Schlüssel nach Bestätigung', async () => {
  const f = lehrerFetch({ 'PATCH /api/lehrer/kurse/3': (body) => ({ status: 200, body: { ...KURS, einstellungen: { ...KURS.einstellungen, ...body.einstellungen } } }), 'POST /api/lehrer/kurse/3/board-schluessel': { status: 200, body: { boardSchluessel: 'neuerschl123' } } });
  const k = D.lade(LEHRER, { url: 'http://x.test/lehrer#/kurs/3/einstellungen', fetch: f, vorher: seiteLehrer });
  await k.ruhe();
  const form = k.eins(k.document, 'form.einstellungen');
  assert.ok(k.eins(form, 'a[href="/board/abcdefgh1234"]'));
  k.klick(k.eins(form, 'input[name="welt"][value="9"]'));
  k.klick(k.eins(form, 'button[type="submit"]'));
  await k.ruhe();
  assert.deepEqual(k.anfragen.find((x) => x.methode === 'PATCH').body, { einstellungen: { welten: [0, 1, 2] } });
  k.klick(k.eins(form, 'button.board-neu'));
  await k.ruhe();
  const dlg = k.eins(k.document, 'dialog[open]');
  k.klick(k.alle(dlg, 'button').find((b) => /erzeugen/i.test(k.text(b))));
  await k.ruhe();
  assert.ok(k.anfragen.some((x) => x.methode === 'POST' && x.pfad === '/api/lehrer/kurse/3/board-schluessel'));
  assert.ok(k.eins(k.document, 'a[href="/board/neuerschl123"]'));
});
test('Auswertung: Matrix mit Niveau-Kopf und Text je Zelle, Fallen-Profil mit Kurztiteln, CSV-Links', async () => {
  const ausw = { kurs: KURS, niveau: 'gA', matrix: { levels: [{ id: 'W9-L1', nr: '1', titel: 'Blöcke', maxPunkte: 40 }], zeilen: [{ id: 1, name: 'Mika R.', aktiv: true, werte: [{ anteil: 0.75, punkte: 30, geloest: 3, angesehen: 0 }] }, { id: 2, name: 'Ida K.', aktiv: false, werte: [{ anteil: 0, punkte: 0, geloest: 0, angesehen: 0 }] }] }, boss: { welten: [], zeilen: [] }, aufgaben: [], fallen: [{ p: 'P3', titel: 'Umkehrung falsch', fehlversuche: 4, schueler: 1, schuelerGesamt: 2 }] };
  const k = D.lade(LEHRER, { url: 'http://x.test/lehrer#/kurs/3/auswertung', fetch: lehrerFetch({ 'GET /api/lehrer/kurse/3/auswertung': { status: 200, body: ausw } }), vorher: seiteLehrer });
  await k.ruhe();
  const haupt = k.document.getElementById('haupt');
  assert.match(k.text(k.eins(haupt, 'table.matrix-lehrkraft thead')), /Niveau: gA/);
  assert.equal(k.text(k.alle(haupt, 'table.matrix-lehrkraft tbody td')[0]), '75 %');
  assert.match(k.text(k.alle(haupt, 'table.matrix-lehrkraft tbody tr')[1]), /nicht mehr im Kurs/);
  assert.match(k.text(haupt), /P3 Umkehrung falsch/);
  assert.ok(k.eins(haupt, 'a[href="/themen#fallen-P3"]'));
  assert.ok(k.eins(haupt, 'a[href="/api/lehrer/kurse/3/export.csv?art=matrix"], button[data-csv="matrix"]'));
});
test('Vorschau: Niveau-Chips auch für Kern, Hinweis „im gA-Kurs ausgeblendet“, Aufgabe mit eingesetzter Lösung', async () => {
  const vw = { welten: [{ nr: 9, titel: 'Testwelt', farbe: '#5B6B7C', levels: [{ id: 'W9-L3', nr: '3', titel: 'Analyse', niveau: 'eA', rolle: 'kryptoanalyse', gAAusgeblendet: true, aufgaben: [{ id: 'W9-L3-01', titel: 'Werkbank', stufe: 3, punkte: 30, kategorie: 'haeufigkeitsanalyse', niveau: 'eA', fallen: [], arten: ['zuordnung'], gAAusgeblendet: true }] }, { id: 'W9-L1', nr: '1', titel: 'Blöcke', niveau: 'kern', rolle: 'kryptografie', gAAusgeblendet: false, aufgaben: [] }], boss: null, archivfund: null }] };
  const k = D.lade(LEHRER, { url: 'http://x.test/lehrer#/vorschau/welt/9', fetch: lehrerFetch({ 'GET /api/lehrer/vorschau': { status: 200, body: vw } }), vorher: seiteLehrer });
  await k.ruhe();
  const haupt = k.document.getElementById('haupt');
  assert.match(k.text(haupt), /im gA-Kurs ausgeblendet/);
  assert.ok(k.eins(haupt, 'a[href="#/vorschau/aufgabe/W9-L3-01"]'));
  assert.ok(k.alle(haupt, '.chip-niveau').some((c) => k.text(c) === 'K'), 'Kern-Chip in der Vorschau');
  const a = { id: 'W9-L1-01', titel: 'Lücke', stufe: 1, punkte: 10, kategorie: 'begriffe', niveau: 'kern', fallen: ['P3'], inhalt: [{ t: 'text', md: 'Antwort: [[g1]]' }], interaktion: { kind: 'gaps', felder: { g1: {} } } };
  const k2 = D.lade(LEHRER, { url: 'http://x.test/lehrer#/vorschau/aufgabe/W9-L1-01', fetch: lehrerFetch({ 'GET /api/lehrer/vorschau/W9-L1-01': { status: 200, body: { aufgabe: a, loesung: { g1: ['geheim'] }, muster: { g1: 'geheim' }, erklaerung: [{ t: 'text', md: 'Weil.' }], tipps: ['Denk nach.'], ort: { welt: { nr: 9, titel: 'Testwelt', farbe: '#5B6B7C' }, level: { id: 'W9-L1', nr: '1', titel: 'Blöcke' }, boss: null, index: 0, anzahl: 2, vorher: null, nachher: 'W9-L1-02' } } } }), vorher: seiteLehrer });
  await k2.ruhe();
  const h2 = k2.document.getElementById('haupt');
  assert.equal(k2.eins(h2, 'input').value, 'geheim');
  assert.match(k2.text(h2), /Denk nach\./);
  assert.match(k2.text(h2), /Weil\./);
  assert.ok(k2.eins(h2, 'a[href="#/vorschau/aufgabe/W9-L1-02"]'));
});
test('Materialien: Liste je Welt mit Download-Links und Sprungleiste', async () => {
  const m = { allgemein: [{ art: 'lehrerhinweise', titel: 'Gesamtübersicht', ds: [], dateien: [{ label: 'PDF', url: '/lehrkraft/dateien/a.pdf', lehrkraft: true }] }, { art: 'werkzeug', titel: 'WK1', ds: [], dateien: [{ label: 'Karte', url: '/akten/00_Werkzeugkarten/WK1.pdf', lehrkraft: false }] }], welten: [{ nr: 9, eintraege: [{ art: 'praesentation', titel: 'Folien Welt 9', ds: [1], dateien: [{ label: 'PDF', url: '/lehrkraft/dateien/b.pdf', lehrkraft: true }, { label: 'fehlt', url: null }] }, { art: 'boss', titel: 'Papier-Boss', dateien: [] }, { art: 'warmup', titel: 'Karten', dateien: [] }, { art: 'funkraum', titel: 'Rollen', dateien: [] }, { art: 'probeklausur', titel: 'PK', dateien: [] }, { art: 'hinweise', titel: 'LH', dateien: [] }] }] };
  const k = D.lade(LEHRER, { url: 'http://x.test/lehrer#/materialien', fetch: lehrerFetch({ 'GET /api/lehrer/materialien': { status: 200, body: m } }), vorher: seiteLehrer });
  await k.ruhe();
  const haupt = k.document.getElementById('haupt');
  assert.ok(k.eins(haupt, 'a[href="/lehrkraft/dateien/b.pdf"]'));
  assert.ok(k.eins(haupt, 'a[href="#material-welt-9"]'));
  assert.ok(k.document.getElementById('material-welt-9'));
  // Arten mit Anzeigenamen (Task 97), Schülerfassung unter /akten/
  const text = k.text(haupt);
  for (const s of ['Papier-Boss', 'Warm-up', 'Funkraum', 'Werkzeugkarte', 'Probeklausur', 'Lehrerhinweise']) assert.match(text, new RegExp(s), s);
  for (const roh of [/\bboss\b/, /\bwarmup\b/, /\bfunkraum\b/, /\bwerkzeug\b/, /\bprobeklausur\b/, /\bhinweise\b/]) assert.doesNotMatch(text, roh);
  assert.ok(k.eins(haupt, 'a[href="/akten/00_Werkzeugkarten/WK1.pdf"]'));
});
test('Scoreboard-Tab: Rangliste des Kurses, Aktualisierung alle 20 s', async () => {
  const sb = { welt: null, liste: [{ id: 1, name: 'Mika R.', punkte: 30, abzeichen: 1, geloest: 3, platz: 1 }] };
  const k = D.lade(LEHRER, { url: 'http://x.test/lehrer#/kurs/3/scoreboard', fetch: lehrerFetch({ 'GET /api/lehrer/kurse/3/scoreboard': { status: 200, body: sb } }), vorher: seiteLehrer });
  await k.ruhe();
  assert.match(k.text(k.document.getElementById('haupt')), /Mika R\./);
  assert.ok(k.timer.some((t) => t.ms === 20000 && t.wiederholt));
});
test('Urkunden: je Schüler eine Urkunde mit Rang und sieben Siegeln (erreicht/Umriss)', async () => {
  const u = { kurs: { id: 3, name: 'LK 13 (eA)' }, raenge: ['Lehrling', 'Schreiber', 'Chiffreur', 'Kryptoanalytiker', 'Meister der Chiffren'], anzahl: 2, schueler: [{ id: 1, name: 'Mika R.', punkte: 120, geloest: 11, rang: 'Chiffreur', platz: 1, abzeichen: [{ key: 'boss0_besiegt', icon: '⚔️', name: 'Bote besiegt' }] }, { id: 2, name: 'Ida K.', punkte: 20, geloest: 2, rang: 'Lehrling', platz: 2, abzeichen: [] }] };
  const k = D.lade([...BASIS, 'krypto/urkunden.js'], { url: 'http://x.test/lehrer/urkunden?kurs=3', fetch: { 'GET /api/sitzung': { status: 200, body: SITZUNG_L }, 'GET /api/lehrer/kurse/3/urkunden': { status: 200, body: u } } });
  await k.ruhe();
  const ur = k.eins(k.document, 'article.urkunde');
  assert.match(k.text(ur), /Mika R\./);
  assert.match(k.text(ur), /Chiffreur/);
  assert.match(k.text(ur), /Kryptos – Die Zeitreise der Geheimschriften/);
  assert.equal(k.alle(ur, '.siegel').length, 7);
  assert.equal(k.alle(ur, '.siegel.erreicht').length, 1);
  assert.equal(k.alle(k.document, 'article.urkunde').length, 2);
  // einzeln: nur die gewählte Urkunde
  const wahl = k.eins(k.document, 'select[name="auswahl"]');
  wahl.value = '2'; wahl.dispatchEvent(new k.window.Event('change'));
  await k.ruhe();
  assert.deepEqual(k.alle(k.document, 'article.urkunde').filter((x) => !x.hidden).map((x) => k.text(k.eins(x, '.urkunde-name'))), ['Ida K.']);
  k.klick(k.eins(k.document, 'button.drucken'));
  assert.equal(k.gedruckt, 1);
});
test('Verwaltung nur für den Superadmin', async () => {
  const k = D.lade(LEHRER, { url: 'http://x.test/lehrer#/admin/inhalte', fetch: lehrerFetch(), vorher: seiteLehrer });
  await k.ruhe();
  assert.match(k.text(k.document.getElementById('haupt')), /Nur für den Admin/);
  assert.ok(!k.anfragen.some((x) => x.pfad.startsWith('/api/admin')));
});
test('Verwaltung (Admin): Inhalte mit Zahlen und Neu-Laden nach Bestätigung, Wartungsbericht', async () => {
  const admin = { ...SITZUNG_L, rolle: 'superadmin', name: 'Admin' };
  const inh = { bericht: [{ datei: 'welt9.json', status: 'geladen', fehler: [], warnungen: 1, aufgaben: 45, ausgelassen: 0 }], welten: [{ nr: 9, titel: 'Testwelt', levels: 6, aufgaben: 45, bossPool: 6, maxPunkte: 700 }], katas: { welten: [{ welt: 9, anzahl: 3 }], kategorien: [], weltNamen: [] } };
  const f = lehrerFetch({ 'GET /api/sitzung': { status: 200, body: admin }, 'GET /api/admin/inhalte': { status: 200, body: inh }, 'POST /api/admin/inhalte/neu-laden': { status: 200, body: { ok: true, bericht: inh.bericht } }, 'GET /api/admin/wartung': { status: 200, body: { bericht: { zeit: '2026-10-13T02:00:00.000Z', anzahlen: { auftraege: 2 }, optimiert: true, fehler: [] } } } });
  let k = D.lade(LEHRER, { url: 'http://x.test/lehrer#/admin/inhalte', fetch: f, vorher: seiteLehrer });
  await k.ruhe();
  const haupt = k.document.getElementById('haupt');
  assert.match(k.text(haupt), /welt9\.json/);
  assert.match(k.text(haupt), /45/);
  k.klick(k.eins(haupt, 'button.neu-laden'));
  await k.ruhe();
  k.klick(k.alle(k.eins(k.document, 'dialog[open]'), 'button')[0]);
  await k.ruhe();
  assert.ok(k.anfragen.some((x) => x.methode === 'POST' && x.pfad === '/api/admin/inhalte/neu-laden'));
  k = D.lade(LEHRER, { url: 'http://x.test/lehrer#/admin/wartung', fetch: f, vorher: seiteLehrer });
  await k.ruhe();
  assert.match(k.text(k.document.getElementById('haupt')), /auftraege|Aufträge/);
});

/* ---------- Gastmodus (Task 65) ---------- */

const GAST = [...LEHRER, 'krypto/gast.js'];
const gastFetch = (extra = {}) => ({ 'GET /api/sitzung': { status: 200, body: { rolle: null, kurse: [] } }, ...extra });
const seiteGast = (k) => k.document.body.classList.add('seite-gast');

test('Gast: Demo-Aufgabe mit Scheibe frei, Hinweis „Nichts wird gespeichert“; Demo-Kurs nur lesend', async () => {
  const demo = { vorhanden: true, titel: 'Probe-Akte', farbe: '#8A5F1A', level: 'Reinschnuppern', intro: [], aufgaben: [{ id: 'W8-L1-01', titel: 'Scheibe', stufe: 1, punkte: 10, kategorie: 'entschluesseln', arten: ['chiffre'] }] };
  const k = D.lade(GAST, { url: 'http://x.test/gast#/schueler', fetch: gastFetch({ 'GET /api/gast/schueler': { status: 200, body: demo } }), vorher: seiteGast });
  await k.ruhe();
  const haupt = k.document.getElementById('haupt');
  assert.match(k.text(haupt), /Nichts wird gespeichert/);
  assert.ok(k.eins(haupt, 'a[href="#/schueler/aufgabe/W8-L1-01"]'));
  assert.ok(!k.anfragen.some((a) => a.pfad.startsWith('/api/lehrer')), 'Gast fragt keine Lehrkraft-API');
});

test('Gast: Übersicht mit drei Karten, Kopfzeile ohne Rolle', async () => {
  const k = D.lade(GAST, { url: 'http://x.test/gast#/', fetch: gastFetch(), vorher: seiteGast });
  await k.ruhe();
  const haupt = k.document.getElementById('haupt');
  assert.ok(k.eins(haupt, 'a[href="#/schueler"]'));
  assert.ok(k.eins(haupt, 'a[href^="#/lehrkraft"]'));
  assert.ok(k.eins(haupt, 'a[href="#/labor/scheibe"]'));
  assert.match(k.text(haupt), /Chiffrierscheibe/);
});

test('Gast: Demo-Aufgabe schickt Fehlversuche/Tipps mit, Werkzeug Scheibe frei', async () => {
  const a = { id: 'W8-L1-01', titel: 'Scheibe', stufe: 1, punkte: 10, kategorie: 'entschluesseln', fallen: ['P3'], tippsAnzahl: 1, inhalt: [{ t: 'text', md: 'Dreh.' }, { t: 'werkzeug', id: 'scheibe' }], interaktion: { kind: 'chiffre', richtung: 'ent', verfahren: { typ: 'caesar', k: 7 }, eingabe: 'UVYKS PJOA', schluesselVerdeckt: false } };
  const d = { aufgabe: a, zustand: { status: 'offen', fehlversuche: 0, tippsGenutzt: 0, tipps: [], punkte: 0, moeglich: 10 }, ort: { index: 0, anzahl: 6, vorher: null, nachher: 'W8-L1-02' } };
  const falsch = { ok: false, zustand: { status: 'offen', fehlversuche: 1, tippsGenutzt: 0, tipps: [], punkte: 0, moeglich: 8 } };
  const k = D.lade(GAST, { url: 'http://x.test/gast#/schueler/aufgabe/W8-L1-01', fetch: gastFetch({ 'GET /api/gast/aufgaben/W8-L1-01': { status: 200, body: d }, 'POST /api/gast/aufgaben/W8-L1-01/pruefen': { status: 200, body: falsch }, 'GET /api/labor/gast': { status: 404, body: {} } }), vorher: seiteGast });
  await k.ruhe();
  const haupt = k.document.getElementById('haupt');
  assert.match(k.text(haupt), /Nichts wird gespeichert/);
  const karte = k.eins(haupt, '.werkzeug-karte');
  assert.ok(!karte.classList.contains('gesperrt'), 'Scheibe ist im Gastmodus frei');
  k.alle(haupt, 'input.kaestchen').forEach((x, i) => k.tippe(x, 'ABCDEFGHI'[i]));
  k.klick(k.eins(haupt, '#pruefen'));
  await k.ruhe();
  k.klick(k.eins(haupt, '#pruefen'));
  await k.ruhe();
  const posts = k.anfragen.filter((x) => x.methode === 'POST');
  assert.equal(posts.length, 2);
  assert.equal(posts[1].body.fehlversuche, 1, 'Zähler aus dem Browser');
});

test('Gast-Lehrkraft: Auswertung mit Fallen-Profil, Einstellungen nur lesend', async () => {
  const lk = { kurs: { name: 'Demo-Kurs Informatik 12', schueler: 2 }, einstellungen: { welten: [0], boss: 'auto', scoreboard: true, beamer: true, niveau: 'eA', kuer: 'frei', werkzeuge: {} }, werkzeuge: ['scheibe'], levels: [{ id: 'W0-L1', nr: '1', titel: 'Erstes', maxPunkte: 40 }], schueler: [{ name: 'Lena S.', punkte: 30, geloest: 3, rang: 'Schreiber', zuletztAktiv: '2026-10-12T08:00:00Z' }], matrix: { zeilen: [{ name: 'Lena S.', werte: [{ anteil: 0.75, punkte: 30, geloest: 3, angesehen: 0 }] }] }, boss: { welten: [], zeilen: [] }, fallen: [{ p: 'P3', titel: 'Umkehrung falsch', fehlversuche: 4, schueler: 2, schuelerGesamt: 2 }], aufgaben: [], materialien: { welt0: [], weitere: 0 }, weltenGesamt: 1 };
  let k = D.lade(GAST, { url: 'http://x.test/gast#/lehrkraft/auswertung', fetch: gastFetch({ 'GET /api/gast/lehrkraft': { status: 200, body: lk } }), vorher: seiteGast });
  await k.ruhe();
  let haupt = k.document.getElementById('haupt');
  assert.ok(k.eins(haupt, '.fallen-profil'));
  assert.match(k.text(haupt), /75 %/);
  k = D.lade(GAST, { url: 'http://x.test/gast#/lehrkraft/einstellungen', fetch: gastFetch({ 'GET /api/gast/lehrkraft': { status: 200, body: lk } }), vorher: seiteGast });
  await k.ruhe();
  haupt = k.document.getElementById('haupt');
  const eingaben = k.alle(haupt, 'form.einstellungen input');
  assert.ok(eingaben.length > 0 && eingaben.every((x) => x.disabled), 'alle Eingaben gesperrt');
  assert.ok(k.eins(haupt, 'select[name="werkzeug-scheibe"]').disabled);
  assert.ok(k.eins(haupt, 'input[name="niveau"][value="eA"]').checked);
});
test('Review M4 W2: Niveau-Chip im Kurskopf nach dem Speichern aktualisiert', async () => {
  const f = lehrerFetch({ 'PATCH /api/lehrer/kurse/3': (body) => ({ status: 200, body: { ...KURS, einstellungen: { ...KURS.einstellungen, ...body.einstellungen } } }) });
  const k = D.lade(LEHRER, { url: 'http://x.test/lehrer#/kurs/3/einstellungen', fetch: f, vorher: seiteLehrer });
  await k.ruhe();
  const chip = () => k.text(k.eins(k.document, '.kurs-kopf .chip-kursniveau'));
  assert.equal(chip(), 'eA');
  const form = k.eins(k.document, 'form.einstellungen');
  k.klick(k.eins(form, 'input[name="niveau"][value="gA"]'));
  assert.equal(chip(), 'eA', 'ungespeichert: Chip unverändert');
  k.klick(k.eins(form, 'button[type="submit"]'));
  await k.ruhe();
  assert.equal(chip(), 'gA');
});
test('Review M4 K3: „Board öffnen“ nur bei gespeichertem Beamer-Board und vorhandenem Schlüssel', async () => {
  const f = lehrerFetch({ 'PATCH /api/lehrer/kurse/3': (body) => ({ status: 200, body: { ...KURS, einstellungen: { ...KURS.einstellungen, ...body.einstellungen } } }) });
  let k = D.lade(LEHRER, { url: 'http://x.test/lehrer#/kurs/3/einstellungen', fetch: f, vorher: seiteLehrer });
  await k.ruhe();
  const form = k.eins(k.document, 'form.einstellungen');
  const link = k.eins(form, 'a.board-link');
  assert.equal(link.hidden, true, 'Beamer aus → kein Link');
  k.klick(k.eins(form, 'input[name="beamer"]'));
  assert.equal(link.hidden, true, 'angehakt, aber nicht gespeichert → kein Link');
  k.klick(k.eins(form, 'button[type="submit"]'));
  await k.ruhe();
  assert.equal(link.hidden, false, 'gespeichert → Link');
  const ohne = { ...KURS, boardSchluessel: null, einstellungen: { ...KURS.einstellungen, beamer: true } };
  k = D.lade(LEHRER, { url: 'http://x.test/lehrer#/kurs/3/einstellungen', fetch: lehrerFetch({ 'GET /api/lehrer/kurse/3': { status: 200, body: ohne } }), vorher: seiteLehrer });
  await k.ruhe();
  assert.equal(k.eins(k.document, 'a.board-link').hidden, true, 'ohne Schlüssel kein Link');
});
test('Review M4 K2: ungespeicherte Einstellungen – Rückfrage beim Tabwechsel', async () => {
  const k = D.lade(LEHRER, { url: 'http://x.test/lehrer#/kurs/3/einstellungen', fetch: lehrerFetch({ 'GET /api/lehrer/kurse/3/auswertung': { status: 200, body: { kurs: KURS, niveau: 'eA', matrix: { levels: [], zeilen: [] }, boss: { welten: [], zeilen: [] }, aufgaben: [], fallen: [] } } }), vorher: seiteLehrer });
  const ruhe = async () => {
    await new Promise((r) => setTimeout(r, 5)); // hashchange der Attrappe kommt über einen echten Timer
    await k.ruhe();
  };
  await ruhe();
  const form = k.eins(k.document, 'form.einstellungen');
  // ohne Änderung: keine Rückfrage
  k.klick(k.eins(k.document, '#tab-auswertung'));
  await ruhe();
  assert.equal(k.window.location.hash, '#/kurs/3/auswertung');
  assert.equal(k.alle(k.document, 'dialog[open]').length, 0);
  k.window.location.hash = '#/kurs/3/einstellungen';
  await ruhe();
  k.klick(k.eins(k.document, 'form.einstellungen input[name="kuer"][value="gesperrt"]'));
  k.klick(k.eins(k.document, '#tab-auswertung'));
  await ruhe();
  let dlg = k.eins(k.document, 'dialog[open]');
  assert.match(k.text(dlg), /Ungespeicherte Änderungen verwerfen\?/);
  k.klick(k.alle(dlg, 'button').find((b) => /Weiter bearbeiten/.test(k.text(b))));
  await ruhe();
  assert.equal(k.window.location.hash, '#/kurs/3/einstellungen', 'Abbrechen: bleibt auf den Einstellungen');
  assert.equal(k.eins(k.document, 'form.einstellungen input[name="kuer"][value="gesperrt"]').checked, true, 'Änderung bleibt erhalten');
  k.klick(k.eins(k.document, '#tab-auswertung'));
  await ruhe();
  dlg = k.eins(k.document, 'dialog[open]');
  k.klick(k.alle(dlg, 'button').find((b) => /Verwerfen/.test(k.text(b))));
  await ruhe();
  assert.equal(k.window.location.hash, '#/kurs/3/auswertung');
  assert.equal(k.alle(k.document, 'form.einstellungen').length, 0);
  void form;
});
test('Review M4 K7: Kurswahl mit nur einem aktiven Kurs – kein „Du bist in mehreren Kursen“', async () => {
  const s = { ...SITZUNG_S, kurse: [{ id: 'k:1', name: 'LK 13 (eA)', aktiv: true }, { id: 'k:3', name: 'Alt', aktiv: false }] };
  let k = D.lade(SPIEL, { url: 'http://x.test/spiel#/kurs', fetch: { ...spielFetch([welt(9)]), 'GET /api/sitzung': { status: 200, body: s } } });
  await k.ruhe();
  let t = k.text(k.document.getElementById('haupt'));
  assert.doesNotMatch(t, /mehreren Kursen/);
  assert.match(t, /nur in einem Kurs/);
  k = D.lade(SPIEL, { url: 'http://x.test/spiel#/kurs', fetch: { ...spielFetch([welt(9)]), 'GET /api/sitzung': { status: 200, body: { ...SITZUNG_S, kurse: [{ id: 'k:1', name: 'LK 13 (eA)', aktiv: true }, { id: 'k:2', name: 'GK 12 (gA)', aktiv: true }] } } } });
  await k.ruhe();
  t = k.text(k.document.getElementById('haupt'));
  assert.match(t, /Du bist in mehreren Kursen/);
});
