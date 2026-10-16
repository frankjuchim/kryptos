'use strict';
// 1.3.1 (Folgeauftrag M12): ADFGVX-Quadrat 6 × 6 und Spaltentransposition als Objekte im Werkzeug „Polybios & Playfair“
// (Reiter „ADFGVX“ und „Spalten“, erst ab Welt 3). Frei: Quadrat mit Kopf A D F G V X, Raster mit Schlüsselwort-Kopf und
// Rangfolge; geführt: am Quadrat bzw. am Raster, ohne Ersatztabelle, ohne Lösung im DOM (K12 prüft zusätzlich).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { oeffne, Krypto: K } = require('./hilfen_labor');
const BED = require('./hilfen_werkzeug_bediener');

const frei = (v, umgebung = {}) => oeffne('quadrat', { voreinstellung: v, umgebung: { rolle: 'lehrkraft', ...umgebung }, ruhig: true });
const panel = (aufgabe, v) => oeffne('quadrat', { voreinstellung: v, umgebung: { rolle: 'schueler', gefuehrt: { aufgabe } }, ruhig: true });
const markiert = (w) => w.k.alle(w.flaeche, '.gefuehrt-mechanik .gefuehrt-markiert');
const anzahl = (w) => Number(/von (\d+)/.exec(w.k.text(w.k.eins(w.flaeche, '.gefuehrt-zaehler')))[1]);
const feld = (w) => w.k.eins(w.flaeche, 'input.gefuehrt-eintrag-feld');
const Q = K.quadrat('AMSEL3', { groesse: 6 }); // eigenes Schlüsselwort (in keinem Material)

/* ---------- frei ---------- */

test('adfgvx_frei: Quadrat 6 × 6 mit Kopf ADFGVX, Stufe 1 und Stufe 2 = Krypto', () => {
  const w = frei({ reiter: ['adfgvx'], text: 'nordwind', schluesselwort: 'AMSEL3', schluessel: 'ULME', richtung: 'ver' });
  const q = w.k.eins(w.flaeche, 'table.adfgvx-quadrat');
  assert.ok(q, 'Quadrat als Objekt');
  assert.deepEqual(w.k.alle(q, 'thead th').map((x) => w.k.text(x)), [...'ADFGVX']);
  assert.deepEqual(w.k.alle(q, 'tbody th').map((x) => w.k.text(x)), [...'ADFGVX']);
  assert.equal(w.k.alle(q, 'tbody td').map((x) => w.k.text(x)).join(''), Q.join(''));
  const zwischen = K.polybios('nordwind', { schluessel: 'AMSEL3', kopf: 'ADFGVX' });
  assert.equal(w.zustand().zwischen, zwischen);
  assert.equal(w.zustand().ausgabe, K.adfgvx('nordwind', Q.join(''), 'ULME'));
  const r = w.k.eins(w.flaeche, 'table.spalten-raster');
  assert.ok(r, 'Raster mit Schlüsselwort-Kopf');
  assert.deepEqual(w.k.alle(r, 'thead tr.spalten-wort th').map((x) => w.k.text(x)), [...'ULME']);
  assert.deepEqual(w.k.alle(r, 'thead tr.spalten-rang th').map((x) => w.k.text(x)), K.spaltenReihenfolge('ULME').map(String));
  // entschlüsseln
  const e = frei({ reiter: ['adfgvx'], text: K.adfgvx('nordwind', Q.join(''), 'ULME'), schluesselwort: 'AMSEL3', schluessel: 'ULME', richtung: 'ent' });
  assert.equal(e.zustand().ausgabe, 'NORDWIND');
});

test('spalten_frei: Raster mit Schlüsselwort und Rangfolge = Krypto.spaltentransposition', () => {
  const w = frei({ reiter: ['spalten'], text: 'leuchtturm', schluessel: 'ULME', richtung: 'ver' });
  assert.ok(w.k.eins(w.flaeche, 'table.spalten-raster'));
  assert.equal(w.zustand().ausgabe, K.spaltentransposition('leuchtturm', 'ULME'));
  const e = frei({ reiter: ['spalten'], text: K.spaltentransposition('leuchtturm', 'ULME'), schluessel: 'ULME', richtung: 'ent' });
  assert.equal(e.zustand().ausgabe, 'LEUCHTTURM');
});

test('adfgvx_und_spalten_erst_ab_welt_3', () => {
  const w = oeffne('quadrat', { umgebung: { rolle: 'schueler', welten: [0, 1, 2] } });
  const reiter = w.k.alle(w.flaeche, '[role="tab"]').map((t) => t.dataset.reiter);
  assert.ok(!reiter.includes('adfgvx') && !reiter.includes('spalten'), reiter.join(','));
  const v = oeffne('quadrat', { umgebung: { rolle: 'schueler', welten: [0, 1, 2, 3] } });
  const r3 = v.k.alle(v.flaeche, '[role="tab"]').map((t) => t.dataset.reiter);
  assert.ok(r3.includes('adfgvx') && r3.includes('spalten'), r3.join(','));
});

/* ---------- geführt ---------- */

const objektZuerst = (w, sel) => {
  assert.ok(w.k.eins(w.flaeche, 'section.gefuehrt.gefuehrt-mit-objekt'), 'Objekt zuerst');
  assert.ok(w.k.eins(w.flaeche, `.gefuehrt-mechanik ${sel}`), sel);
  assert.equal(w.k.alle(w.flaeche, 'table.gefuehrt-tabelle').length, 0, 'keine Ersatztabelle');
};

test('adfgvx_gefuehrt_stufe1_ver (W3-L4-01): Buchstabe im Quadrat markiert, Paar selbst ablesen', () => {
  const w = panel('W3-L4-01', { reiter: ['adfgvx'], text: 'post', schluesselwort: 'ZEPPELIN18', richtung: 'ver' });
  objektZuerst(w, 'table.adfgvx-quadrat');
  assert.equal(anzahl(w), 4);
  const m = markiert(w);
  assert.equal(m.length, 1);
  assert.equal(m[0].getAttribute('data-zeichen'), 'P');
  w.k.tippe(feld(w), 'af');
  assert.equal(w.k.text(w.k.alle(w.flaeche, '.adfgvx-gefuehrt-band .gefuehrt-eintrag')[0]), 'AF');
  assert.ok(!K.normalisieren(w.k.text(w.flaeche)).includes('AFGAGGGV'));
});

test('adfgvx_gefuehrt_stufe1_ent (W3-L4-02): Zeile und Spalte markiert, Zeichen selbst ablesen', () => {
  const w = panel('W3-L4-02', { reiter: ['adfgvx'], text: 'AAGXF D', schluesselwort: 'ZEPPELIN18', richtung: 'ent' });
  objektZuerst(w, 'table.adfgvx-quadrat');
  assert.equal(anzahl(w), 3);
  const m = markiert(w);
  assert.deepEqual(m.map((x) => x.localName), ['th', 'th'], 'Zeilen- und Spaltenkopf');
  w.k.tippe(feld(w), 'z');
  assert.equal(feld(w).getAttribute('maxlength'), '1');
});

test('adfgvx_gefuehrt_ganz_ent (W3-L4-04): Rangfolge, Spalten füllen, Zeilen lesen, Paare – am Raster und am Quadrat', () => {
  const w = panel('W3-L4-04', { reiter: ['adfgvx'], text: 'DGDVA AAVFG FX', schluesselwort: 'ZEPPELIN18', schluessel: 'BAUM', richtung: 'ent' });
  objektZuerst(w, 'table.spalten-raster');
  assert.ok(w.k.eins(w.flaeche, '.gefuehrt-mechanik table.adfgvx-quadrat'));
  assert.equal(anzahl(w), 4 + 4 + 1 + 6);
  // Rangfolge selbst: Spalte B markiert
  assert.equal(markiert(w)[0].getAttribute('data-spalte'), '0');
  ['2', '1', '4', '3'].forEach((x, i) => BED.trage(w, i, x));
  // Spalte mit Nummer 1 (= A, deine Rangfolge) füllen
  BED.gehe(w, 4);
  assert.equal(markiert(w)[0].getAttribute('data-spalte'), '1');
  BED.trage(w, 4, 'DGD');
  const spalte = w.k.alle(w.flaeche, '.gefuehrt-mechanik table.spalten-raster td[data-spalte="1"] .gefuehrt-eintrag').map((x) => w.k.text(x)).join('');
  assert.equal(spalte, 'DGD', 'deine Spalte steht im Raster');
  const korrekt = ['2', '1', '4', '3', 'DGD', 'VAA', 'AVF', 'GFX', K.spaltentransposition('DGDVAAAVFGFX', 'BAUM', 'ent'), ...'wolke5'];
  korrekt.forEach((x, i) => BED.trage(w, i, x));
  w.k.wert('KRGefuehrt').freigeben('W3-L4-04');
  assert.match(w.k.text(w.k.eins(w.flaeche, '.gefuehrt-fazit')), /15 von 15/);
});

test('spalten_gefuehrt (W3-L4-03 ver, W3-L3-06 ent): am Raster, Spalten in deiner Rangfolge', () => {
  const v = panel('W3-L4-03', { reiter: ['spalten'], text: 'AXADD GADAG XD', schluessel: 'KARL', richtung: 'ver' });
  objektZuerst(v, 'table.spalten-raster');
  assert.equal(anzahl(v), 4 + 4);
  ['2', '1', '4', '3'].forEach((x, i) => BED.trage(v, i, x));
  BED.gehe(v, 4);
  assert.equal(markiert(v)[0].getAttribute('data-spalte'), '1', 'Nummer 1 laut deiner Rangfolge');
  assert.ok(!K.normalisieren(v.k.text(v.flaeche)).includes('XGGADADDDAAX'));
  const e = panel('W3-L3-06', { reiter: ['spalten'], text: 'OKTCA ELHRN', schluessel: 'TAL', richtung: 'ent' });
  objektZuerst(e, 'table.spalten-raster');
  assert.equal(anzahl(e), 3 + 3 + 1);
});
