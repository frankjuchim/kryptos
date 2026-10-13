'use strict';
// Kryptolabor „Häufigkeits-Analysator“ (W1 §9.1, Plan M6 Task 114): Anzeige = Krypto.* im Test-Realm.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { oeffne, Krypto: K } = require('./hilfen_labor');
const T = 'Im Labor zaehlen wir jeden Buchstaben einzeln und vergleichen das Ergebnis mit der deutschen Sprache';
const EVE = require('../quellen/pruefwerte/W2.json').werte.find((x) => x.id === 'W2-2-v1').eingabe[0];

test('Histogramm: n, Anzahlen = Krypto.haeufigkeiten, Warnung P6, Referenz nach Rang', () => {
  const w = oeffne('haeufigkeit', { voreinstellung: { text: T } });
  assert.match(w.text('.labor-laenge'), /n = 86 Buchstaben/);
  assert.match(w.text('.labor-hinweis'), /Kurzer Text.*\(P6\)/);
  const H = K.haeufigkeiten(T);
  for (const z of w.k.alle(w.flaeche, 'table.haeufigkeit-tabelle tbody tr')) assert.equal(Number(w.k.text(z.querySelector('td'))), H[w.k.text(z.querySelector('th'))]);
  w.k.klick(w.k.eins(w.flaeche, 'button[data-sortierung="absteigend"]'));
  const erste = w.k.alle(w.flaeche, 'table.haeufigkeit-tabelle tbody tr').slice(0, 3);
  assert.deepEqual(erste.map((z) => w.k.text(z.querySelector('th'))), K.rangfolge(T).slice(0, 3));
  assert.deepEqual(erste.map((z) => w.k.text(z.querySelector('td.deutsch-rang')).slice(0, 1)), ['E', 'N', 'I']);
  assert.equal(w.zustand().sortierung, 'absteigend');
  assert.match(w.text('.haeufigkeit-werkzeug'), /Referenz Deutsch nach Beutelspacher/);
  // Einheit umschalten: relativ → Prozentwerte (Anzeige über den Block, Anzahl bleibt Krypto.haeufigkeiten)
  w.k.klick(w.k.eins(w.flaeche, 'button[data-einheit="relativ"]'));
  assert.equal(w.zustand().einheit, 'relativ');
});

test('Fixture-Voreinstellung (W9): Text und Sortierung absteigend', () => {
  const w = oeffne('haeufigkeit', { voreinstellung: { text: 'IMQRH AGTZF', ansicht: 'absteigend' } });
  assert.equal(w.zustand().sortierung, 'absteigend');
  assert.equal(w.zustand().n, 10);
});

test('Bigramme/Trigramme: Top-Listen = Krypto.ngramme, Antippen markiert alle Vorkommen', () => {
  const S = 'die dichter und denker der dichten nacht';
  const w = oeffne('haeufigkeit', { voreinstellung: { text: S, reiter: ['bigramme'] } });
  assert.deepEqual(w.k.alle(w.flaeche, 'ol.ngramme-3 button').slice(0, 3).map((b) => b.dataset.folge), K.ngramme(S, { n: 3, top: 3 }).map((x) => x.folge));
  assert.deepEqual(w.k.alle(w.flaeche, 'ol.ngramme-2 button').map((b) => b.dataset.folge), K.ngramme(S, { n: 2, top: 15 }).map((x) => x.folge));
  assert.match(w.text('ol.ngramme-2 button'), /^[A-Z]{2} · \d+$/);
  w.k.klick(w.k.eins(w.flaeche, 'ol.ngramme-3 button[data-folge="CHT"]'));
  assert.equal(w.k.alle(w.flaeche, '.geheimtext mark.markiert').length, 3);
  assert.deepEqual(w.zustand().markiert, 'CHT');
  assert.equal(w.k.eins(w.flaeche, 'ol.ngramme-3 button[data-folge="CHT"]').getAttribute('aria-pressed'), 'true');
  w.k.klick(w.k.eins(w.flaeche, 'ol.ngramme-3 button[data-folge="CHT"]'));
  assert.equal(w.k.alle(w.flaeche, '.geheimtext mark.markiert').length, 0, 'zweites Antippen hebt auf');
  assert.equal(w.zustand().markiert, null);
});

test('Teiltexte und Kennzahlen nur ab Welt 2 (Kennzahlen nur eA); Werte aus der Bibliothek', () => {
  const w1 = oeffne('haeufigkeit', { umgebung: { welten: [0, 1], niveau: 'eA' } });
  assert.deepEqual(w1.k.alle(w1.flaeche, '[role="tab"]').map((t) => t.dataset.reiter), ['histogramm', 'bigramme']);
  const gA = oeffne('haeufigkeit', { umgebung: { welten: [0, 1, 2], niveau: 'gA' } });
  assert.ok(!gA.k.alle(gA.flaeche, '[role="tab"]').some((t) => t.dataset.reiter === 'kennzahlen'));
  const w = oeffne('haeufigkeit', { voreinstellung: { text: EVE, teiltexte: 5, reiter: ['teiltexte', 'kennzahlen'] } });
  assert.equal(w.ohneLeer('.teiltext .geheimtext'), K.teiltexte(EVE, 5)[0]);
  w.k.taste(w.k.alle(w.flaeche, '.labor-zahl [role="spinbutton"]')[1], 'ArrowUp'); // s = 2
  assert.equal(w.ohneLeer('.teiltext .geheimtext'), K.teiltexte(EVE, 5)[1]);
  assert.deepEqual([w.zustand().k, w.zustand().s], [5, 2]);
  w.reiter('kennzahlen');
  assert.match(w.text('.kennzahl-bruch'), /2434 \/ 51756/);
  assert.match(w.text('.kennzahl-wert'), /0,0470/);
  assert.match(w.text('.kennzahl-referenz'), /0,076.*0,038/);
});

test('Nachspiel „Zählen“: Schritt i zeigt die Häufigkeiten des Präfixes', () => {
  const w = oeffne('haeufigkeit', { voreinstellung: { text: 'abba' } });
  const leiste = w.k.eins(w.flaeche, '.nachspiel');
  w.k.taste(leiste, 'End');
  assert.match(w.k.text(w.k.eins(leiste, '.nachspiel-text')), /Buchstabe 4: A – A jetzt 2-mal/);
  w.k.taste(leiste, 'Home');
  assert.match(w.k.text(w.k.eins(leiste, '.nachspiel-text')), /Buchstabe 1: A – A jetzt 1-mal/);
  const zelle = (b) => w.k.alle(w.flaeche, 'table.haeufigkeit-tabelle tbody tr').find((z) => w.k.text(z.querySelector('th')) === b).querySelector('td');
  assert.equal(w.k.text(zelle('A')), '1');
  assert.equal(w.k.text(zelle('B')), '0');
});

test('Grenzen: keine Zuordnung, keine Entschlüsselung, kein Speicher, keine Anfragen', () => {
  const w = oeffne('haeufigkeit', { voreinstellung: { text: T } });
  assert.equal(w.k.alle(w.flaeche, 'input.werkbank-zuordnung, output.labor-ausgabe').length, 0);
  assert.match(w.text('.haeufigkeit-grenze'), /Substitutions-Werkbank/);
  assert.deepEqual(w.k.anfragen, []);
  assert.equal(w.k.window.localStorage.length, 0);
});
