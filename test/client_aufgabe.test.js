'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'); const path = require('node:path');
const D = require('./dom_attrappe');
const { FALLEN, LAB_KATEGORIE_NAMEN } = require('../src/krypto/fach');
const SKRIPTE = ['common.js', 'shared/krypto.js', 'render.js', 'interact.js', 'krypto/oberflaeche.js', 'krypto/diagnose_chips.js', 'aufgabe.js'];
test('KR.FALLEN/KR.KATEGORIEN = fach.js', () => {
  const k = D.lade(SKRIPTE);
  assert.deepEqual({ ...k.wert('KR.FALLEN') }, Object.fromEntries(Object.entries(FALLEN).map(([p, f]) => [p, f.titel])));
  assert.deepEqual({ ...k.wert('KR.KATEGORIEN') }, LAB_KATEGORIE_NAMEN);
});
test('KRDiag.chips: höchstens zwei, Link auf /themen#fallen-P3, Text als Textknoten', () => {
  const k = D.lade(SKRIPTE);
  const el = k.wert('KRDiag').chips([{ p: 'P3', code: 'richtung', text: 'Du hast in die falsche Richtung verschoben.' }, { p: 'P1', code: 'zaehlbasis', text: 'a' }, { p: 'P2', code: 'x', text: 'b' }]);
  assert.equal(k.alle(el, 'a.chip-falle').length, 2);
  assert.equal(k.text(k.eins(el, 'a.chip-falle')), 'P3 Umkehrung falsch');
  assert.equal(k.eins(el, 'a.chip-falle').getAttribute('href'), '/themen#fallen-P3');
  assert.equal(k.wert('KRDiag').chips([]), null);
});
test('AQI.aufgabe: ctx.modus, zusatz und kontext.aufgabe; Schritt-Schalter (E29)', () => {
  const k = D.lade(SKRIPTE);
  let gesehen = null; let kontextAufgabe = null;
  k.wert('AQR').registriere('testblock', (b, ctx) => { gesehen = ctx; return k.document.createElement('div'); });
  k.wert('AQI').registriere('testia', (ia, kontext) => { kontextAufgabe = kontext.aufgabe; return { kind: 'testia', ui: k.document.createElement('div'), antwort: () => 'x', leer: () => false, setze() {}, feedback() {}, loesung() {}, sperren() {} }; });
  k.wert('AQI').schrittArten.add('testia');
  const a = { id: 'W9-L1-01', inhalt: [{ t: 'testblock' }], interaktion: { kind: 'testia' } };
  const c = k.wert('AQI').aufgabe(a, { modus: 'boss', zusatz: { werkzeugFrei: () => false, modus: 'lab' }, schritt: async () => ({}) });
  assert.equal(gesehen.modus, 'boss', 'zusatz überschreibt modus nicht');
  assert.equal(gesehen.werkzeugFrei('x'), false);
  assert.equal(kontextAufgabe, a);
  assert.ok(k.eins(c.el, 'label.check input[type="checkbox"]'), 'Schritt-Schalter sichtbar');
});
test('AQA: Kopf mit Kategorie-Name, Fallen-Chips, Niveau nur bei eA/E/Kür; Diagnose nach falscher Antwort', async () => {
  const k = D.lade(SKRIPTE);
  const a = { id: 'W9-L1-01', titel: 'Test', stufe: 2, punkte: 20, kategorie: 'entschluesseln', niveau: 'kern', fallen: ['P3'], tippsAnzahl: 0, inhalt: [{ t: 'text', md: 'Frage' }], interaktion: { kind: 'gaps', felder: { g1: {} } } };
  a.inhalt[0].md = 'Antwort: [[g1]]';
  const el = k.wert('AQA').ansicht({ aufgabe: a, zustand: { status: 'offen', fehlversuche: 0, moeglich: 20 }, modus: 'lab', anzeige: k.wert('KRDiag.anzeige'), pruefen: async () => ({ ok: false, diagnose: [{ p: 'P3', code: 'richtung', text: 'Richtung.' }], zustand: { status: 'offen', fehlversuche: 1, moeglich: 15 } }), aufdecken: async () => ({}) });
  k.document.body.appendChild(el);
  assert.match(k.text(k.eins(el, '.aufgabe-kopf')), /Entschlüsseln/);
  assert.ok(k.eins(el, '.aufgabe-kopf a.chip-falle'));
  assert.equal(k.alle(el, '.aufgabe-kopf .chip-niveau').length, 0, 'Kern-Chip im Lab ausgeblendet');
  k.tippe(k.eins(el, 'input.luecke'), 'X');
  k.klick(k.eins(el, '#pruefen'));
  await k.ruhe();
  assert.match(k.text(k.eins(el, '[aria-live="polite"]')), /P3 Umkehrung falsch/);
});
test('Kern-Klassen aus render.js, interact.js, aufgabe.js haben eine CSS-Regel', () => {
  const js = ['render.js', 'interact.js', 'aufgabe.js'].map((f) => fs.readFileSync(path.join(__dirname, '..', 'public', 'static', 'js', f), 'utf8')).join('\n');
  const css = fs.readdirSync(path.join(__dirname, '..', 'public', 'static', 'css')).map((f) => fs.readFileSync(path.join(__dirname, '..', 'public', 'static', 'css', f), 'utf8')).join('\n');
  const klassen = new Set();
  for (const m of js.matchAll(/class:\s*'([^'$]+)'|classList\.(?:add|toggle|remove)\('([\w-]+)'/g)) for (const c of (m[1] || m[2]).split(/\s+/)) if (c && !c.endsWith('-')) klassen.add(c);
  const fehlt = [...klassen].filter((c) => !new RegExp(`\\.${c}(?![\\w-])`).test(css));
  assert.deepEqual(fehlt, [], 'Klassen ohne Regel in aufgaben.css/komponenten.css');
});
test('AQA: ohnePunkte (Archivfund) – Kopf ohne „0 Punkte“, Rückmeldungen ohne Punktzahlen', async () => {
  const k = D.lade(SKRIPTE);
  const a = { id: 'W9-AF', titel: 'Fund', stufe: 1, punkte: 0, kategorie: 'entschluesseln', niveau: 'kern', fallen: [], tippsAnzahl: 0, inhalt: [{ t: 'text', md: 'Antwort: [[g1]]' }], interaktion: { kind: 'gaps', felder: { g1: {} } } };
  const el = k.wert('AQA').ansicht({ aufgabe: a, zustand: { status: 'offen', fehlversuche: 0, moeglich: 0 }, modus: 'lab', ohnePunkte: 'Archivfund – ohne Punkte', pruefen: async () => ({ ok: false, zustand: { status: 'offen', fehlversuche: 1, moeglich: 0 } }), aufdecken: async () => ({}) });
  k.document.body.appendChild(el);
  const kopf = k.text(k.eins(el, '.aufgabe-kopf'));
  assert.doesNotMatch(kopf, /\d+\s*Punkte?/);
  assert.match(kopf, /Archivfund – ohne Punkte/);
  k.tippe(k.eins(el, 'input'), 'x');
  k.klick(k.eins(el, '#pruefen'));
  await k.ruhe();
  assert.doesNotMatch(k.text(el), /Punkte möglich/);
});
