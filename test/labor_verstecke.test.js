'use strict';
// Werkzeug „Versteckte Botschaften“ (Plan M10 Task 231, E183) nach der Krypto-Werkstatt (Ideen von A. Bodendiek):
// Nullchiffre (Brief schreiben mit Wortvorschlägen, Brief aufdecken) und Punktmethode (Punkte stechen, Punkte finden mit Lupe).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { oeffne, Krypto: K } = require('./hilfen_labor');

const klick = (w, sel) => w.k.klick(w.k.eins(w.flaeche, sel));
const stempel = (w, b) => klick(w, `button.station-stempel[data-buchstabe="${b}"]`);

test('Nullchiffre: Brief wächst, Aufdecken = Krypto.nullchiffre', () => {
  const w = oeffne('verstecke');
  w.k.klick(w.k.eins(w.flaeche, 'button.station-stempel[data-buchstabe="T"]'));
  const vorschlag = w.k.eins(w.flaeche, '.verstecke-vorschlaege button');
  w.k.klick(vorschlag);
  assert.equal(K.nullchiffre(w.zustand().brief), 'T');
  for (const b of 'EE') {
    stempel(w, b);
    klick(w, '.verstecke-vorschlaege button');
  }
  assert.equal(K.nullchiffre(w.zustand().brief), 'TEE');
  assert.equal(w.zustand().ausgabe, w.zustand().brief);
  assert.equal(w.zustand().eingabe, 'tee');
  assert.equal(w.k.alle(w.flaeche, '.verstecke-brief .verstecke-wort').length, 3, 'drei Wörter im Brief');
  assert.equal(w.k.alle(w.flaeche, '.verstecke-brief .zaehlt').length, 3, 'zählender Buchstabe markiert');
  // eigenes Wort: nur, wenn es zur Leseregel passt
  stempel(w, 'N');
  w.k.tippe(w.k.eins(w.flaeche, '.verstecke-eigen input'), 'Bach');
  klick(w, '.verstecke-eigen button');
  assert.equal(K.nullchiffre(w.zustand().brief), 'TEE');
  assert.match(w.text('.station-erklaerung'), /N/);
  w.k.eins(w.flaeche, '.verstecke-eigen input').value = '';
  w.k.tippe(w.k.eins(w.flaeche, '.verstecke-eigen input'), 'Nebelhorn');
  klick(w, '.verstecke-eigen button');
  assert.equal(K.nullchiffre(w.zustand().brief), 'TEEN');
});

test('Nullchiffre: Leseregel 2 filtert Vorschläge nach dem 2. Buchstaben', () => {
  const w = oeffne('verstecke');
  klick(w, '.verstecke-stelle [data-stelle="2"]');
  stempel(w, 'A');
  const vorschlaege = w.k.alle(w.flaeche, '.verstecke-vorschlaege button').map((b) => w.k.text(b));
  assert.ok(vorschlaege.length >= 2, 'mehrere Vorschläge');
  for (const v of vorschlaege) assert.equal(K.nurBuchstaben(v)[1], 'A', v);
  w.k.klick(w.k.eins(w.flaeche, '.verstecke-vorschlaege button'));
  assert.equal(K.nullchiffre(w.zustand().brief, 2), 'A');
  assert.equal(w.zustand().stelle, 2);
  // jeder Buchstabe hat für jede Leseregel einen Vorschlag
  for (const st of [1, 2, 3]) {
    const v = oeffne('verstecke', { voreinstellung: { stelle: st } });
    for (const b of K.ALPHABET) {
      stempel(v, b);
      assert.ok(v.k.alle(v.flaeche, '.verstecke-vorschlaege button').length >= 1, `Stelle ${st}, ${b}`);
    }
  }
});

test('Nullchiffre: Brief aufdecken – in jedem Wort den zählenden Buchstaben antippen', () => {
  const w = oeffne('verstecke', { voreinstellung: { richtung: 'ent' } });
  for (const knopf of w.k.alle(w.flaeche, '.verstecke-briefwahl button')) {
    w.k.klick(knopf);
    const { brief, stelle } = w.zustand();
    const woerter = brief.split(/[^A-Za-zÄÖÜäöüß]+/).filter(Boolean);
    // falscher Buchstabe → Hinweis, nichts geschrieben
    const falsch = stelle === 1 ? 1 : 0;
    klick(w, `.verstecke-brief [data-wort="0"][data-pos="${falsch}"]`);
    assert.equal(w.zustand().ausgabe, '');
    assert.match(w.text('.station-erklaerung'), /Noch nicht/);
    woerter.forEach((_, i) => klick(w, `.verstecke-brief [data-wort="${i}"][data-pos="${stelle - 1}"]`));
    assert.equal(w.zustand().ausgabe, K.klein(K.nullchiffre(brief, stelle)));
  }
});

test('Punkte: setzen und finden = punkteSetzen/punktmethode; fehlt → Hinweis', () => {
  const w = oeffne('verstecke', { voreinstellung: { reiter: ['punkte'] } });
  const zeitung = w.zustand().zeitung;
  for (const b of 'KOM') stempel(w, b);
  assert.deepEqual(w.zustand().markiert, K.punkteSetzen(zeitung, 'kom').markiert);
  assert.equal(w.zustand().eingabe, 'kom');
  assert.equal(w.k.alle(w.flaeche, '.verstecke-zeitung-text .verstecke-zeichen.punkt').length, 3);
  stempel(w, 'Q');
  assert.equal(w.zustand().eingabe, 'kom', 'Q fehlt → nicht gestochen');
  assert.match(w.text('.station-erklaerung'), /kein/);
  // Sichtbarkeit der Punkte (Regler)
  const regler = w.k.eins(w.flaeche, 'input.verstecke-sichtbarkeit');
  w.k.tippe(regler, '80');
  assert.match(w.k.eins(w.flaeche, '.verstecke-zeitung').style.getPropertyValue('--punkt-deckkraft'), /0\.8/);
  // Finden: markierte Buchstaben antippen
  const f = oeffne('verstecke', { voreinstellung: { reiter: ['punkte'], richtung: 'ent' } });
  const punkte = f.k.alle(f.flaeche, '.verstecke-zeitung-text .verstecke-zeichen.punkt');
  assert.ok(punkte.length > 3);
  const ohne = f.k.alle(f.flaeche, '.verstecke-zeitung-text .verstecke-zeichen').find((e) => !e.classList.contains('punkt'));
  f.k.klick(ohne);
  assert.equal(f.zustand().ausgabe, '');
  for (const p of punkte) f.k.klick(p);
  assert.equal(f.zustand().ausgabe, K.klein(K.punktmethode(f.zustand().zeitung, f.zustand().markiert)));
});

test('Punkte finden: Lupe per Tastatur, ruhig ohne Animation', () => {
  const w = oeffne('verstecke', { voreinstellung: { reiter: ['punkte'], richtung: 'ent' }, ruhig: true });
  const lupe = w.k.eins(w.flaeche, '.verstecke-lupe');
  const x0 = Number.parseFloat(lupe.style.getPropertyValue('--lupe-x'));
  w.k.taste(lupe, 'ArrowRight');
  w.k.taste(lupe, 'ArrowDown');
  assert.ok(Number.parseFloat(lupe.style.getPropertyValue('--lupe-x')) > x0);
  assert.ok(w.k.eins(lupe, '.verstecke-lupe-inhalt'), 'vergrößerter Klon');
  assert.equal(w.k.animiert.length, 0);
});

test('verstecke: keine Vornamen in BEISPIEL, ruhig (Lupe ohne Animation), Herkunft', async () => {
  const src = require('node:fs').readFileSync('public/static/js/krypto/labor/verstecke.js', 'utf8');
  for (const n of ['Otto', 'Emma', 'Paul', 'Mia', 'Karl', 'Klaus', 'Edda', 'Uwe', 'Ute', 'Leo', 'Lena', 'Nina', 'Tim']) assert.doesNotMatch(src, new RegExp(`\\b${n}\\b`));
  const w = oeffne('verstecke', { ruhig: true });
  stempel(w, 'S');
  klick(w, '.verstecke-vorschlaege button');
  await w.k.ruhe();
  assert.equal(w.k.animiert.length, 0);
  assert.equal(w.text('p.werkzeug-herkunft'), 'Ideen von A. Bodendiek (Krypto-Werkstatt)');
  assert.match(w.text('details.station-hintergrund'), /Kerckhoffs/);
  assert.match(w.text('.station-so-gehts'), /Nullchiffre/);
  // Nachspiel sperrt die Stempel
  klick(w, 'button.station-nachspielen');
  assert.ok(w.k.alle(w.flaeche, 'button.station-stempel').every((b) => b.disabled));
  klick(w, 'button.station-nachspiel-ende');
  assert.ok(w.k.alle(w.flaeche, 'button.station-stempel').some((b) => !b.disabled));
  const L = w.k.wert('KRLabor');
  assert.equal(w.k.roh(L.WERKZEUGE.find((x) => x.id === 'verstecke')).art, 'zusatz');
});

test('Punktmethode (M10-Review Fund 4): Zeitungstext bricht nur zwischen Wörtern um – Buchstaben je Wort in einer Gruppe', () => {
  const w = oeffne('verstecke', { voreinstellung: { reiter: ['punkte'] } });
  for (const sel of ['.verstecke-zeitung-text', '.verstecke-lupe-inhalt']) {
    const ziel = w.k.eins(w.flaeche, sel);
    const kinder = [...ziel.childNodes];
    assert.ok(kinder.length > 5, `${sel}: Inhalt`);
    for (const k of kinder) {
      if (k.nodeType === 3) assert.match(k.textContent, /^\s+$/, `${sel}: zwischen den Wörtern nur Leerraum`);
      else assert.ok(k.classList.contains('verstecke-wort'), `${sel}: Wortgruppe statt einzelner Buchstabe`);
    }
    for (const g of w.k.alle(ziel, '.verstecke-wort')) assert.doesNotMatch(g.textContent, /\s/, 'kein Leerraum in einer Wortgruppe');
  }
});
