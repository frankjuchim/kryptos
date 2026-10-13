'use strict';
// Review M6 W1/W2: Boss-Sperre im alten Tab und im Gastmodus. /api/labor wird vor jedem Öffnen eines Werkzeugs frisch
// gefragt (Vollseite und Dialog); bei Rückkehr in den Tab (visibilitychange/focus) wird neu gefragt und ein offenes
// Werkzeug bei laufendem Kampf geschlossen (mit Hinweis). Gastmodus: mit Schüler-Sitzung dieselbe Sperre.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const D = require('./dom_attrappe');

const SITZUNG_S = { rolle: 'schueler', name: 'Mika R.', kurs: { id: 'k:1', name: 'LK 13 (eA)', niveau: 'eA' }, kurse: [{ id: 'k:1', name: 'LK 13 (eA)', aktiv: true }], portal: 'https://portal.test', version: '0.3.1' };
const BASIS = ['common.js', 'krypto/oberflaeche.js', 'krypto/kopfzeile.js'];
const LABOR = [...BASIS, 'shared/krypto.js', 'render.js', 'krypto/diagnose_chips.js', 'krypto/labor/registry.js', 'krypto/bloecke.js', 'krypto/labor/bausteine.js', 'krypto/labor/scheibe.js'];
const zeit = () => new Promise((r) => setTimeout(r, 5)); // hashchange der Attrappe kommt über einen echten Timer

/** /api/labor als umschaltbare Route: zustand.boss = true simuliert den Kampfbeginn in einem anderen Tab. */
function laborRoute(zustand) {
  return () => ({
    status: 200,
    body: {
      boss: zustand.boss,
      niveau: 'eA',
      welten: [0, 1, 9],
      werkzeuge: [
        { id: 'scheibe', titel: 'Chiffrierscheibe', welt: 0, frei: !zustand.boss, grund: zustand.boss ? 'boss' : null },
        { id: 'haeufigkeit', titel: 'Häufigkeits-Analysator', welt: 1, frei: !zustand.boss, grund: zustand.boss ? 'boss' : null }
      ]
    }
  });
}
const zaehle = (k) => k.anfragen.filter((a) => a.pfad === '/api/labor').length;
const sichtbar = (k) => k.wert('document.dispatchEvent(new Event("visibilitychange")); 0');

test('Labor-Seite (alter Tab): Rückkehr in den Tab fragt /api/labor neu und schließt das offene Werkzeug bei Kampf', async () => {
  const zustand = { boss: false };
  const k = D.lade([...LABOR, 'krypto/labor/seite.js'], { url: 'http://x.test/labor#/scheibe', fetch: { 'GET /api/sitzung': { status: 200, body: SITZUNG_S }, 'GET /api/labor': laborRoute(zustand) } });
  await k.ruhe();
  const haupt = k.document.getElementById('haupt');
  assert.ok(k.eins(haupt, '.scheibe-drehknopf'), 'Scheibe offen');
  zustand.boss = true; // Kampf beginnt in einem anderen Tab
  const vorher = zaehle(k);
  sichtbar(k);
  await k.ruhe();
  assert.equal(zaehle(k), vorher + 1, 'bei Rückkehr neu gefragt');
  assert.equal(k.alle(haupt, '.scheibe-drehknopf').length, 0, 'Werkzeug geschlossen');
  assert.match(k.text(haupt), /Während eines Boss-Kampfs ist das Labor geschlossen/);
  assert.match(k.text(haupt), /Werkzeug wurde geschlossen/);
  // focus direkt danach: keine zweite gleichzeitige Anfrage, keine Fehler
  k.window.dispatchEvent(k.wert('new Event("focus")'));
  await k.ruhe();
  assert.equal(k.alle(haupt, '.scheibe-drehknopf').length, 0);
});

test('Labor-Seite (alter Tab): Wechsel zu einem anderen Werkzeug fragt /api/labor frisch – im Kampf gesperrt, nichts geladen', async () => {
  const zustand = { boss: false };
  const k = D.lade([...BASIS, 'krypto/labor/registry.js', 'krypto/labor/seite.js'], { url: 'http://x.test/labor#/', fetch: { 'GET /api/sitzung': { status: 200, body: SITZUNG_S }, 'GET /api/labor': laborRoute(zustand) } });
  await k.ruhe();
  const haupt = k.document.getElementById('haupt');
  assert.ok(k.eins(haupt, 'a.werkzeug-karte[href="#/haeufigkeit"]'), 'Raster mit freiem Werkzeug');
  zustand.boss = true;
  k.window.location.hash = '#/haeufigkeit';
  await zeit();
  await k.ruhe();
  assert.match(k.text(haupt), /Während eines Boss-Kampfs ist das Labor geschlossen/);
  assert.deepEqual(k.skripte, [], 'kein Modul nachgeladen');
});

const SPIEL = [...BASIS, 'shared/krypto.js', 'render.js', 'interact.js', 'krypto/diagnose_chips.js', 'krypto/labor/registry.js', 'krypto/bloecke.js', 'krypto/interaktionen.js', 'aufgabe.js', 'krypto/zeitleiste.js', 'krypto/epoche.js', 'krypto/level.js', 'krypto/profil.js', 'krypto/spiel.js', 'krypto/labor/bausteine.js', 'krypto/labor/scheibe.js'];
const welt9 = { nr: 9, titel: 'Welt 9', epoche: 'Testepoche', jahr: { von: 1909, bis: 2000, anzeige: '1909 – 2000' }, farbe: '#5B6B7C', akzentHell: '#C9D3DD', frei: true, punkte: 0, maxPunkte: 10, anteil: 0, training: false, archivfund: null, kapitel: null, boss: null, levels: [] };
function spielFetch(zustand) {
  const a = { id: 'W9-L1-01', titel: 'Caesar', stufe: 1, punkte: 10, kategorie: 'entschluesseln', niveau: 'kern', inhalt: [{ t: 'werkzeug', id: 'scheibe' }], interaktion: { kind: 'chiffre', richtung: 'ent', verfahren: { typ: 'caesar', k: 3 }, eingabe: 'CXY' } };
  return {
    'GET /api/sitzung': { status: 200, body: SITZUNG_S },
    'GET /api/welten': { status: 200, body: { welten: [welt9], scoreboard: false, niveau: 'eA' } },
    'GET /api/profil': { status: 200, body: { rang: { name: 'Schreiber', index: 1, anteil: 0.12 }, punkte: { gesamt: 10 }, welten: [], fallen: [], abzeichen: [] } },
    'GET /api/labor': laborRoute(zustand),
    'GET /api/aufgaben/W9-L1-01': { status: 200, body: { aufgabe: a, zustand: { status: 'offen', fehlversuche: 0, tippsGenutzt: 0, moeglich: 10 }, ort: { welt: { nr: 9, titel: 'Testwelt', farbe: '#5B6B7C' }, level: { id: 'W9-L1', nr: '1', titel: 'Blöcke' }, index: 0, anzahl: 1, vorher: null, nachher: null } } }
  };
}

test('Aufgabe (alter Tab): Werkzeug-Knopf fragt /api/labor vor dem Dialog frisch – Kampf läuft → Umgebung gesperrt „boss“', async () => {
  const zustand = { boss: false };
  const k = D.lade(SPIEL, { url: 'http://x.test/spiel#/aufgabe/W9-L1-01', fetch: spielFetch(zustand) });
  k.wert('globalThis.__dialog = []; KRLabor.dialog = (id, v, u) => { __dialog.push([id, u]); };');
  await k.ruhe();
  const knopf = k.eins(k.document, 'button.werkzeug-oeffnen');
  assert.equal(knopf.disabled, false);
  zustand.boss = true;
  const vorher = zaehle(k);
  k.klick(knopf);
  await k.ruhe();
  assert.equal(zaehle(k), vorher + 1, 'frisch gefragt');
  assert.deepEqual(k.roh(k.wert('__dialog')), [['scheibe', { modus: 'lab', rolle: 'schueler', niveau: 'eA', welten: [0, 1, 9], gesperrt: 'boss', level: 'W9-L1' }]]);
});

test('Aufgabe (alter Tab): offener Werkzeug-Dialog wird bei Rückkehr in den Tab und laufendem Kampf geschlossen (Hinweis)', async () => {
  const zustand = { boss: false };
  const k = D.lade(SPIEL, { url: 'http://x.test/spiel#/aufgabe/W9-L1-01', fetch: spielFetch(zustand) });
  await k.ruhe();
  k.klick(k.eins(k.document, 'button.werkzeug-oeffnen'));
  await k.ruhe();
  const dialog = k.eins(k.document, 'dialog.werkzeug-dialog');
  assert.ok(dialog && k.eins(dialog, '.scheibe-drehknopf'), 'Scheibe im Dialog offen');
  zustand.boss = true;
  sichtbar(k);
  await k.ruhe();
  assert.equal(k.alle(dialog, '.scheibe-drehknopf').length, 0, 'Werkzeug geschlossen');
  assert.match(k.text(dialog), /Während eines Boss-Kampfs ist das Labor geschlossen/);
  assert.match(k.text(dialog), /Werkzeug wurde geschlossen/);
});

/* ---------- Gastmodus (Orchestrator-Entscheidung Review M6) ---------- */

const GAST = [...BASIS, 'shared/krypto.js', 'render.js', 'interact.js', 'krypto/diagnose_chips.js', 'krypto/labor/registry.js', 'krypto/bloecke.js', 'krypto/interaktionen.js', 'aufgabe.js', 'krypto/lehrer.js', 'krypto/gast.js', 'krypto/labor/bausteine.js', 'krypto/labor/scheibe.js'];
const seiteGast = (k) => k.document.body.classList.add('seite-gast');

test('Gast mit Schüler-Sitzung im Kampf: Scheibe gesperrt mit Hinweis, Demo-Aufgabe öffnet sie gesperrt', async () => {
  const zustand = { boss: true };
  const a = { id: 'W8-L1-01', titel: 'Scheibe', stufe: 1, punkte: 10, kategorie: 'entschluesseln', inhalt: [{ t: 'werkzeug', id: 'scheibe' }], interaktion: { kind: 'chiffre', richtung: 'ent', verfahren: { typ: 'caesar', k: 7 }, eingabe: 'UVYKS', schluesselVerdeckt: false } };
  const d = { aufgabe: a, zustand: { status: 'offen', fehlversuche: 0, tippsGenutzt: 0, tipps: [], punkte: 0, moeglich: 10 }, ort: { index: 0, anzahl: 6, vorher: null, nachher: null } };
  const k = D.lade(GAST, { url: 'http://x.test/gast#/labor/scheibe', fetch: { 'GET /api/sitzung': { status: 200, body: SITZUNG_S }, 'GET /api/labor': laborRoute(zustand), 'GET /api/gast/aufgaben/W8-L1-01': { status: 200, body: d } }, vorher: seiteGast });
  await k.ruhe();
  const haupt = k.document.getElementById('haupt');
  assert.equal(k.alle(haupt, '.scheibe-drehknopf').length, 0, 'Scheibe nicht offen');
  assert.match(k.text(haupt), /Während eines Boss-Kampfs ist das Labor geschlossen/);
  k.wert('globalThis.__d = []; KRLabor.dialog = (id, v, u) => { __d.push([id, u]); };');
  k.window.location.hash = '#/schueler/aufgabe/W8-L1-01';
  await zeit();
  await k.ruhe();
  k.klick(k.eins(k.document, 'button.werkzeug-oeffnen'));
  await k.ruhe();
  assert.deepEqual(k.roh(k.wert('__d')), [['scheibe', { modus: 'gast', rolle: null, gesperrt: 'boss' }]]);
});

test('Gast mit Schüler-Sitzung: offene Scheibe wird bei Rückkehr in den Tab und Kampfbeginn geschlossen', async () => {
  const zustand = { boss: false };
  const k = D.lade(GAST, { url: 'http://x.test/gast#/labor/scheibe', fetch: { 'GET /api/sitzung': { status: 200, body: SITZUNG_S }, 'GET /api/labor': laborRoute(zustand) }, vorher: seiteGast });
  await k.ruhe();
  const haupt = k.document.getElementById('haupt');
  assert.ok(k.eins(haupt, '.scheibe-drehknopf'), 'Scheibe offen');
  zustand.boss = true;
  sichtbar(k);
  await k.ruhe();
  assert.equal(k.alle(haupt, '.scheibe-drehknopf').length, 0);
  assert.match(k.text(haupt), /Werkzeug wurde geschlossen/);
});

test('Gast ohne Sitzung: kein /api/labor, Scheibe offen (bewusste Grenze, TECHNIK §10.3)', async () => {
  const k = D.lade(GAST, { url: 'http://x.test/gast#/labor/scheibe', fetch: { 'GET /api/sitzung': { status: 200, body: { rolle: null, kurse: [] } } }, vorher: seiteGast });
  await k.ruhe();
  assert.ok(k.eins(k.document, '.scheibe-drehknopf'));
  sichtbar(k);
  await k.ruhe();
  assert.equal(zaehle(k), 0, 'ohne Schüler-Sitzung keine Labor-Abfrage');
  assert.ok(k.eins(k.document, '.scheibe-drehknopf'));
});
