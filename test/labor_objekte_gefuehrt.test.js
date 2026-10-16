'use strict';
// M12 „Objekte in den Aufgaben“ (Plan Tasks 254–258, E233–E238): Im geführten Modus wird das Objekt der Station selbst
// bedient – Holzstab, Zaun, Karton, Ring – statt einer Tabelle. Vor der Freigabe keine Lösung im DOM, kein Orakel (K12
// prüft das zusätzlich für alle Prüflinge); hier: Objekt da, keine Ersatztabelle, Markierung, Einträge am Objekt.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { oeffne, Krypto: K } = require('./hilfen_labor');
const BED = require('./hilfen_werkzeug_bediener');

const panel = (id, aufgabe, v) => oeffne(id, { voreinstellung: v, umgebung: { rolle: 'schueler', gefuehrt: { aufgabe } }, ruhig: true });
const markiert = (w) => w.k.alle(w.flaeche, '.gefuehrt-mechanik .gefuehrt-markiert');
const anzahl = (w) => Number(/von (\d+)/.exec(w.k.text(w.k.eins(w.flaeche, '.gefuehrt-zaehler')))[1]);
const feld = (w) => w.k.eins(w.flaeche, 'input.gefuehrt-eintrag-feld');
/** Texte und Attribute der Fläche, normalisiert A–Z */
function alles(w) {
  const t = [];
  const lauf = (el) => {
    if (el.nodeType === 3) t.push(el.textContent);
    if (el.nodeType !== 1) return;
    for (const n of el.getAttributeNames()) t.push(el.getAttribute(n));
    el.childNodes.forEach(lauf);
  };
  lauf(w.flaeche);
  return t.join(' ').toUpperCase().replace(/[^A-Z]/g, '');
}
/** Objekt zuerst: die Mechanik steht vor den Angaben, keine Ersatztabelle */
function objektZuerst(w, sel) {
  const s = w.k.eins(w.flaeche, 'section.gefuehrt.gefuehrt-mit-objekt');
  assert.ok(s, 'geführt mit Objekt');
  const kinder = [...s.children].map((x) => x.className);
  assert.ok(kinder.indexOf('gefuehrt-mechanik') < kinder.findIndex((c) => /labor-textfeld/.test(c)), `Objekt vor den Angaben: ${kinder.join(', ')}`);
  assert.ok(w.k.eins(w.flaeche, `.gefuehrt-mechanik ${sel}`), `Objekt ${sel} in der Mechanik`);
  assert.equal(w.k.alle(w.flaeche, 'table.gefuehrt-tabelle').length, 0, 'keine Ersatztabelle');
}

/* ---------- Task 254: Skytale am Holzstab ---------- */

const L103 = { reiter: ['skytale'], text: 'wir halten den pass', umfang: 3, richtung: 'ver' }; // W0-L1-03
const L104 = { reiter: ['skytale'], text: 'NUMRA BOUCK REHOG HSMEX CMNXH TFX', umfang: 4, richtung: 'ent' }; // W0-L1-04

test('m12_skytale_ver_stempeln_auf_den_stab', () => {
  const w = panel('skytale', 'W0-L1-03', L103);
  objektZuerst(w, 'svg.stab-objekt');
  // 16 Buchstaben + 2 Füllzeichen auf dem Stab, dann 6 Runden abwickeln
  assert.equal(anzahl(w), 18 + 6);
  const felder = w.k.alle(w.flaeche, '.gefuehrt-mechanik svg .stab-buchstabe.gefuehrt-eintrag');
  assert.equal(felder.length, 18, 'ein Feld je Platz auf dem Stab');
  assert.ok(felder.every((x) => w.k.text(x) === ''), 'Stab anfangs leer');
  const m = markiert(w);
  assert.equal(m.length, 1);
  assert.ok(m[0].classList.contains('stab-naechst'), 'nur das nächste Feld leuchtet');
  // Stempeln trägt ein und geht weiter
  const stempel = (b) => w.k.klick(w.k.eins(w.flaeche, `.gefuehrt-mechanik .station-stempel[data-buchstabe="${b}"]`));
  stempel('W');
  stempel('I');
  assert.equal(w.k.text(felder[0]), 'w');
  assert.equal(w.k.text(felder[1]), 'i');
  assert.match(w.k.text(w.k.eins(w.flaeche, '.gefuehrt-zaehler')), /^Schritt 3 von 24/);
  assert.equal(felder[1].getAttribute('data-zeile'), '0');
  assert.equal(felder[1].getAttribute('data-windung'), '1');
  assert.equal(felder[6].getAttribute('data-zeile'), '1', 'Zeile 2 beginnt nach 6 Feldern (L = ⌈18/3⌉)');
  // Abwickeln: Runde 1 – die Windung ist markiert, Feld für die ganze Runde, Stempelkasten weg
  BED.gehe(w, 18);
  const m2 = markiert(w);
  assert.equal(m2.length, 1);
  assert.ok(m2[0].classList.contains('stab-windung'));
  assert.equal(m2[0].getAttribute('data-windung'), '0');
  assert.equal(feld(w).getAttribute('maxlength'), null, 'Runde als Text');
  assert.equal(w.k.eins(w.flaeche, '.gefuehrt-mechanik .station-stempelkasten').closest('[hidden]') !== null, true, 'Stempel nur beim Stempeln');
  w.k.tippe(feld(w), 'abc');
  assert.equal(w.k.text(w.k.alle(w.flaeche, '.stab-gefuehrt-band .gefuehrt-eintrag')[0]), 'ABC', 'Band zeigt nur deinen Eintrag');
  // nichts gerechnet: ohne eigene Einträge kein Geheimtext
  assert.ok(!alles(w).includes('WTPIEARNS'));
});

test('m12_skytale_ver_vergleich_nach_freigabe', () => {
  const w = panel('skytale', 'W0-L1-03', L103);
  const klar = 'WIRHALTENDENPASSXX';
  [...klar].forEach((b, i) => BED.trage(w, i, b));
  const geheim = K.skytale(klar, 3);
  for (let c = 0; c < 6; c++) BED.trage(w, 18 + c, geheim.slice(c * 3, c * 3 + 3));
  w.k.wert('KRGefuehrt').freigeben('W0-L1-03');
  assert.match(w.k.text(w.k.eins(w.flaeche, '.gefuehrt-fazit')), /24 von 24/);
});

test('m12_skytale_ent_aufgewickelt_entlang_lesen', () => {
  const w = panel('skytale', 'W0-L1-04', L104);
  objektZuerst(w, 'svg.stab-objekt');
  assert.equal(anzahl(w), 4, 'eine Zeile je Schritt');
  const fest = w.k.alle(w.flaeche, '.gefuehrt-mechanik svg .stab-buchstabe').filter((x) => !x.classList.contains('gefuehrt-eintrag'));
  assert.equal(fest.map((x) => w.k.text(x)).join(''), 'NUMRABOUCKREHOGHSMEXCMNXHTFX', 'Geheimtext aufgewickelt – im DOM in Geheimtext-Reihenfolge');
  assert.equal(fest[1].getAttribute('data-zeile'), '1');
  assert.equal(fest[4].getAttribute('data-windung'), '1');
  assert.ok(!alles(w).includes('NACHSCHUB'), 'kein Klartext am Stück');
  const m = markiert(w);
  assert.equal(m.length, 1);
  assert.ok(m[0].classList.contains('stab-zeilenmarke'));
  assert.equal(m[0].getAttribute('data-zeile'), '0');
  w.k.tippe(feld(w), 'nachsch');
  assert.equal(w.k.text(w.k.alle(w.flaeche, '.stab-gefuehrt-band .gefuehrt-eintrag')[0]), 'nachsch', 'Band „Dein Klartext“ aus Einträgen');
  BED.trage(w, 1, 'ubkommt');
  BED.trage(w, 2, 'morgenf');
  BED.trage(w, 3, 'ruehxxx');
  w.k.wert('KRGefuehrt').freigeben('W0-L1-04');
  assert.match(w.k.text(w.k.eins(w.flaeche, '.gefuehrt-fazit')), /4 von 4/);
});

test('m12_skytale_frei_bleibt_station', () => {
  // eigene Werte: die Station wie bisher (Stabwahl, Stempel, Abwickeln)
  const w = oeffne('skytale', { voreinstellung: { reiter: ['skytale'], text: 'kiesel', umfang: 3 }, ruhig: true });
  assert.ok(w.k.eins(w.flaeche, '.stab-station svg.stab-objekt'));
  assert.equal(w.k.alle(w.flaeche, 'section.gefuehrt').length, 0);
});

/* ---------- Task 255: Gartenzaun und Pflügen am Objekt ---------- */

const L105 = { reiter: ['gartenzaun'], text: 'die mauer haelt stand', zeilen: 3, richtung: 'ver' }; // W0-L1-05
const L106 = { reiter: ['gartenzaun'], text: 'BTNID NEWGO ESNUT RES', zeilen: 2, richtung: 'ent' }; // W0-L1-06

test('m12_zaun_ver_zickzack_am_zaun', () => {
  const w = panel('skytale', 'W0-L1-05', L105);
  objektZuerst(w, 'svg.zaun-objekt');
  assert.equal(w.k.alle(w.flaeche, '.gefuehrt-mechanik svg .zaun-schiene').length, 3, 'drei Schienen');
  assert.equal(anzahl(w), 18 + 3, '18 Buchstaben im Zickzack, dann 3 Schienen lesen');
  const plaetze = w.k.alle(w.flaeche, '.gefuehrt-mechanik svg .zaun-platz');
  assert.equal(plaetze.length, 18);
  assert.deepEqual(plaetze.slice(0, 5).map((p) => p.getAttribute('data-schiene')), ['0', '1', '2', '1', '0'], 'Zickzack');
  const m = markiert(w);
  assert.equal(m.length, 1);
  assert.equal(m[0].getAttribute('data-position'), '0');
  w.k.klick(w.k.eins(w.flaeche, '.gefuehrt-mechanik .station-stempel[data-buchstabe="D"]'));
  assert.equal(w.k.text(plaetze[0].querySelector('.gefuehrt-eintrag')), 'd', 'dein Buchstabe steht im Zaun');
  assert.equal(markiert(w)[0].getAttribute('data-position'), '1');
  BED.gehe(w, 18);
  const m2 = markiert(w);
  assert.equal(m2.length, 1);
  assert.ok(m2[0].classList.contains('zaun-schienenmarke'));
  assert.equal(m2[0].getAttribute('data-schiene'), '0');
  w.k.tippe(feld(w), 'dah');
  assert.equal(w.k.text(w.k.alle(w.flaeche, '.zaun-gefuehrt-band .gefuehrt-eintrag')[0]), 'DAH');
  assert.ok(!alles(w).includes('DAHTNIMUR'));
});

test('m12_zaun_ent_schiene_fuer_schiene_dann_zickzack', () => {
  const w = panel('skytale', 'W0-L1-06', L106);
  objektZuerst(w, 'svg.zaun-objekt');
  assert.equal(anzahl(w), 18 + 1, '18 Geheimtextbuchstaben einlegen, dann einmal im Zickzack lesen');
  const m = markiert(w);
  assert.equal(m.length, 1);
  assert.equal(m[0].getAttribute('data-schiene'), '0');
  assert.equal(m[0].getAttribute('data-position'), '0');
  BED.gehe(w, 9);
  assert.equal(markiert(w)[0].getAttribute('data-schiene'), '1', 'nach 9 Buchstaben die zweite Schiene');
  assert.equal(markiert(w)[0].getAttribute('data-position'), '1');
  BED.gehe(w, 18);
  assert.ok(markiert(w)[0].classList.contains('zaun-zickzack'));
  // Reihenfolge im DOM: Schiene für Schiene (wie eingelegt) – nie Position für Position
  const k = K.nurBuchstaben('BTNID NEWGO ESNUT RES');
  [...k].forEach((b, i) => BED.trage(w, i, b));
  const dom = w.k.alle(w.flaeche, '.gefuehrt-mechanik svg .zaun-platz .gefuehrt-eintrag').map((x) => w.k.text(x)).join('');
  assert.equal(dom, k, 'DOM-Reihenfolge = Einlege-Reihenfolge');
  BED.trage(w, 18, 'botensindunterwegs');
  w.k.wert('KRGefuehrt').freigeben('W0-L1-06');
  assert.match(w.k.text(w.k.eins(w.flaeche, '.gefuehrt-fazit')), /19 von 19/);
});

test('m12_pfluegen_auf_dem_karopapier', () => {
  const w = panel('skytale', 'W9-L1-01', { reiter: ['pfluegen'], text: 'zwiebelturm', k: 4, richtung: 'ver' });
  if (!w.k.eins(w.flaeche, 'section.gefuehrt')) return; // eigene Werte: frei (nur Aufgabenwerte führen)
  objektZuerst(w, 'table.pflug-tabelle');
});

/* ---------- Task 256: Fleißner-Schablone am Karton ---------- */

const L107 = { reiter: ['fleissner'], text: 'athen sendet hilfe', schablone: [[1, 3], [2, 2], [3, 1], [4, 4]], groesse: 4, richtung: 'ver' }; // W0-L1-07

test('m12_fleissner_ver_durch_die_loecher', () => {
  const w = panel('skytale', 'W0-L1-07', L107);
  objektZuerst(w, '.karton.fleissner-gefuehrt');
  assert.equal(anzahl(w), 16 + 4, '16 Buchstaben durch die Löcher, dann 4 Zeilen ablesen');
  const karton = w.k.eins(w.flaeche, '.gefuehrt-mechanik .karton');
  assert.equal(karton.getAttribute('data-lage'), '1');
  const frei = w.k.alle(karton, '.fleissner-loch.frei');
  assert.equal(frei.length, 4, 'vier Löcher in Lage 1');
  const m = markiert(w);
  assert.equal(m.length, 1);
  assert.deepEqual([m[0].getAttribute('data-z'), m[0].getAttribute('data-s')], ['1', '3'], 'erstes Loch zeilenweise');
  w.k.klick(w.k.eins(w.flaeche, '.gefuehrt-mechanik .station-stempel[data-buchstabe="A"]'));
  assert.equal(w.k.text(w.k.eins(karton, '.fleissner-loch[data-z="1"][data-s="3"] .gefuehrt-eintrag')), 'a');
  BED.gehe(w, 4);
  assert.equal(karton.getAttribute('data-lage'), '2', 'nach vier Buchstaben gedreht');
  BED.gehe(w, 16);
  assert.ok(karton.classList.contains('abgehoben'), 'zum Ablesen abgehoben');
  const m2 = markiert(w);
  assert.equal(m2.length, 1);
  assert.equal(m2[0].getAttribute('data-zeile'), '1');
  w.k.tippe(feld(w), 'dnai');
  assert.equal(w.k.text(w.k.alle(w.flaeche, '.karton-gefuehrt-band .gefuehrt-eintrag')[0]), 'DNAI');
  assert.equal(w.k.alle(w.flaeche, 'table.gefuehrt-tabelle').length, 0);
});

test('m12_fleissner_ent_lage_fuer_lage', () => {
  const geheim = K.fleissner('athensendethilfe', 4, L107.schablone, 'ver');
  const w = panel('skytale', 'W9-L1-01', { ...L107, text: geheim, richtung: 'ent' });
  objektZuerst(w, '.karton.fleissner-gefuehrt');
  assert.equal(anzahl(w), 4, 'je Lage ein Schritt');
  const karton = w.k.eins(w.flaeche, '.gefuehrt-mechanik .karton');
  assert.equal(w.k.alle(karton, '.loch-zeichen').map((x) => w.k.text(x)).join(''), geheim, 'Geheimtext zeilenweise unter dem Karton');
  BED.gehe(w, 2);
  assert.equal(karton.getAttribute('data-lage'), '3');
  assert.equal(markiert(w).length, 1);
  BED.trage(w, 0, 'athe');
  assert.equal(w.k.text(w.k.alle(w.flaeche, '.karton-gefuehrt-band .gefuehrt-eintrag')[0]), 'athe');
  ['athe', 'nsen', 'deth', 'ilfe'].forEach((x, i) => BED.trage(w, i, x));
  w.k.wert('KRGefuehrt').freigeben('W9-L1-01');
  assert.match(w.k.text(w.k.eins(w.flaeche, '.gefuehrt-fazit')), /4 von 4/);
});

/* ---------- Task 257: Ring ohne Sprungpfeile ---------- */

test('m12_ring_ver_am_ring', () => {
  const w = panel('skytale', 'W6-L2-01', { reiter: ['ring'], text: 'ZEITMASC', t: 5, richtung: 'ver' });
  objektZuerst(w, 'svg.ring-gefuehrt');
  assert.equal(w.k.alle(w.flaeche, '.gefuehrt-mechanik svg .ring-feld').length, 8);
  assert.equal(w.k.alle(w.flaeche, '.gefuehrt-mechanik .ring-sprung, .gefuehrt-mechanik line[marker-end]').length, 0, 'keine Sprungpfeile (wären die Lesereihenfolge)');
  assert.equal(anzahl(w), 8 + 8);
  // Schritt 1: Start bei Feld 0 markiert
  let m = markiert(w);
  assert.equal(m.length, 1);
  assert.equal(m[0].getAttribute('data-feld'), '0');
  // Folgeschritt aus deinem Eintrag: Feld davor = dein Eintrag
  BED.trage(w, 0, '0');
  BED.trage(w, 1, '7'); // falsch eingetragen – markiert wird trotzdem dein Feld
  BED.gehe(w, 2);
  m = markiert(w);
  assert.equal(m[0].getAttribute('data-feld'), '7');
  // Buchstaben-Schritt: Feld aus deiner Lesereihenfolge
  BED.gehe(w, 9);
  m = markiert(w);
  assert.equal(m.length, 1);
  assert.equal(m[0].getAttribute('data-feld'), '7', 'Nr. 1 deiner Reihenfolge');
  w.k.tippe(feld(w), 'c');
  assert.equal(w.k.text(w.k.eins(w.flaeche, '.ring-gefuehrt-band .gefuehrt-eintrag')).replace(/\s/g, ''), '·C······', 'Band: Buchstabe 2 ist deiner');
});

test('m12_ring_ent_felder_aus_eintraegen', () => {
  const w = panel('skytale', 'W6-L2-04', { reiter: ['ring'], text: 'TVZLT LEA', t: 5, richtung: 'ent' });
  objektZuerst(w, 'svg.ring-gefuehrt');
  assert.equal(w.k.alle(w.flaeche, '.gefuehrt-mechanik .ring-sprung').length, 0);
  // Geheimtext als Band mit Positionen, im DOM in Geheimtext-Reihenfolge
  assert.equal(w.k.alle(w.flaeche, '.ring-geheim-zeichen').map((x) => w.k.text(x)).join(''), 'TVZLTLEA');
  BED.trage(w, 8, 'm');
  assert.equal(w.k.text(w.k.eins(w.flaeche, '.gefuehrt-mechanik svg .ring-feld[data-feld="0"] .gefuehrt-eintrag')), 'm', 'dein Klartextbuchstabe im Feld 0');
});

/* ---------- Task 258: Mini-Enigma am Stromweg ---------- */

test('m12_mini_enigma_stromweg_als_objekt', () => {
  const w = panel('runden', 'W3-L5-01', { reiter: ['enigma'], text: 'fade', stellung: 'A' });
  const s = w.k.eins(w.flaeche, 'section.gefuehrt.gefuehrt-mit-objekt');
  assert.ok(s, 'Objekt zuerst');
  const svg = w.k.eins(w.flaeche, '.gefuehrt-mechanik svg.stromweg');
  assert.ok(svg, 'Stromweg als Bild');
  assert.equal(w.k.alle(svg, '.strom-station').length, 7);
  assert.equal(w.k.alle(svg, '.strom-buchstabe.gefuehrt-eintrag').length, 7, 'Stationen nur mit deinen Einträgen');
  assert.ok(w.k.alle(svg, '.strom-buchstabe.gefuehrt-eintrag').every((x) => w.k.text(x) === ''));
  assert.equal(w.k.text(w.k.eins(svg, '.strom-eingang')), 'F', 'Eingang = Buchstabe der Angabe');
  assert.equal(w.k.alle(w.flaeche, '.gefuehrt-mechanik svg .gefuehrt-markiert').length, 1, 'nur die aktuelle Station');
  w.k.tippe(feld(w), 'c');
  assert.equal(w.k.text(w.k.alle(svg, '.strom-buchstabe.gefuehrt-eintrag')[0]), 'C');
  assert.equal(w.k.alle(w.flaeche, '.lampe.leuchtet').length, 0, 'Lampe erst nach der Freigabe');
});

/* ---------- Task 258: Inventar – jede Chiffre-Aufgabe mit passendem Objekt hat ein Panel ---------- */

test('m12_inventar_objekt_an_jeder_passenden_aufgabe', () => {
  // Verfahren mit anschaulichem Objekt im Labor (Stab, Zaun, Karton, Scheibe, Quadrat, Vigenère-Quadrat, Mini-Enigma, Ring)
  // 1.3.1: dazu ADFGVX (Quadrat 6 × 6) und Spaltentransposition (Spalten-Raster)
  const OBJEKT = new Set(['skytale', 'gartenzaun', 'fleissner', 'caesar', 'polybios', 'playfair', 'vigenere', 'autokey', 'porta', 'mini_enigma', 'uhrwerk', 'adfgvx', 'spaltentransposition', 'atbash', 'substitution', 'affin']); // 1.3.1: Alphabet-Leiste
  const AUSNAHMEN = new Map(); // seit 1.3.1 keine (W3-L4-01/02: ADFGVX-Quadrat)
  const fehlt = [];
  for (let n = 0; n <= 6; n++) {
    const w = require(`../seed/welten/welt${n}.json`);
    for (const a of w.aufgaben) {
      if (/-B-/.test(a.id)) continue; // Boss: Werkzeuge gesperrt
      const v = a.interaktion && a.interaktion.verfahren && a.interaktion.verfahren.typ;
      if (!OBJEKT.has(v) || AUSNAHMEN.has(a.id)) continue;
      if (!(a.inhalt || []).some((b) => b.t === 'werkzeug')) fehlt.push(`${a.id} (${v})`);
    }
  }
  assert.deepEqual(fehlt, []);
  // neu in M12: W3-L1-01 „Zeichen werden Bits“ mit der Bit-Lupe (Zeichen ↔ Bits, geführt)
  const w3 = require('../seed/welten/welt3.json').aufgaben.find((a) => a.id === 'W3-L1-01');
  const b = w3.inhalt.find((x) => x.t === 'werkzeug');
  assert.deepEqual([b.id, b.voreinstellung.reiter, b.gefuehrt], ['bitlupe', ['zeichen'], true]);
});
