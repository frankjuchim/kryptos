'use strict';
// Werkzeug „Codes & Signale“ (Plan M10 Task 230, E184–E186) nach der Krypto-Werkstatt (Ideen von A. Bodendiek):
// Morse-Trommel (Rand = kurz, Fell = lang, Pause), Klopfcode am Rohr (Polybios-Standardquadrat), Freimaurer-Schlüsselbild.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { oeffne, Krypto: K } = require('./hilfen_labor');

const klick = (w, sel) => w.k.klick(w.k.eins(w.flaeche, sel));
const trommle = (w, code) => {
  for (const c of code) klick(w, `button.signale-trommel-${c === '·' ? 'rand' : 'fell'}`);
  klick(w, 'button.signale-pause');
};

test('Morse: Tafel antippen und trommeln = Krypto.morse', () => {
  const w = oeffne('signale');
  w.k.klick(w.k.eins(w.flaeche, '.signale-tafel [data-buchstabe="S"]'));
  for (const t of ['rand', 'rand', 'rand']) w.k.klick(w.k.eins(w.flaeche, `button.signale-trommel-${t}`));
  w.k.klick(w.k.eins(w.flaeche, 'button.signale-pause'));
  assert.equal(w.zustand().ausgabe, K.morse('s'));
  assert.equal(w.zustand().eingabe, 's');
  assert.equal(w.zustand().reiter, 'morse');
  // geführt: falscher Schlag wird nicht geschrieben, Hinweis
  klick(w, '.signale-tafel [data-buchstabe="O"]');
  klick(w, 'button.signale-trommel-rand');
  assert.match(w.text('.station-erklaerung'), /Fell/);
  trommle(w, '–––');
  assert.equal(w.zustand().ausgabe, K.morse('so'));
  // Pause ohne Schläge = Wortlücke
  klick(w, 'button.signale-pause');
  trommle(w, K.morse('e'));
  assert.equal(w.zustand().ausgabe, K.morse('so e'));
  assert.equal(w.zustand().eingabe, 'so e');
});

test('Morse empfangen: Schläge → Buchstabe', () => {
  const w = oeffne('signale', { voreinstellung: { richtung: 'ent' } });
  klick(w, 'button.signale-trommel-fell');
  klick(w, 'button.signale-trommel-rand');
  klick(w, 'button.signale-pause');
  assert.equal(w.zustand().ausgabe, 'n');
  assert.equal(K.morse(w.zustand().eingabe, 'ent'), 'N');
  // ungültige Schlagfolge: Hinweis, nichts geschrieben
  for (let i = 0; i < 6; i++) klick(w, 'button.signale-trommel-fell');
  klick(w, 'button.signale-pause');
  assert.equal(w.zustand().ausgabe, 'n');
  assert.match(w.text('.station-erklaerung'), /Tafel/);
  // Tafel zeigt beim Empfangen die passenden Kandidaten
  klick(w, 'button.signale-trommel-rand');
  assert.ok(w.k.alle(w.flaeche, '.signale-tafel [data-buchstabe].kandidat').length > 1);
});

test('Klopfcode = Krypto.polybios (senden und empfangen)', async () => {
  const w = oeffne('signale', { voreinstellung: { reiter: ['klopfcode'] }, ruhig: true });
  for (const b of 'TAL') klick(w, `.signale-quadrat [data-buchstabe="${b}"]`);
  await w.k.ruhe();
  assert.equal(w.zustand().ausgabe, K.polybios('tal'));
  assert.equal(w.zustand().eingabe, 'tal');
  assert.match(w.text('.station-baender output.geheim'), /4\s*4/);
  const e = oeffne('signale', { voreinstellung: { reiter: ['klopfcode'], richtung: 'ent' } });
  const klopfe = (n) => {
    for (let i = 0; i < n; i++) e.k.klick(e.k.eins(e.flaeche, 'button.signale-rohr'));
    e.k.klick(e.k.eins(e.flaeche, 'button.signale-pause'));
  };
  klopfe(3);
  klopfe(4);
  assert.equal(e.zustand().ausgabe, K.klein(K.polybios('34', {}, 'ent')));
  klopfe(7);
  assert.match(e.text('.station-erklaerung'), /höchstens 5/);
});

test('Freimaurer: Feld → Symbol, Rückweg', () => {
  const w = oeffne('signale', { voreinstellung: { reiter: ['freimaurer'] } });
  w.k.klick(w.k.eins(w.flaeche, '.signale-schluesselbild [data-figur="kreuz"][data-feld="2"][data-punkt="false"]'));
  assert.equal(w.zustand().eingabe, 't');
  assert.deepEqual(w.zustand().symbole, K.freimaurer('t').map(({ figur, feld, punkt }) => ({ figur, feld, punkt })));
  for (const s of K.freimaurer('ozean')) klick(w, `.signale-schluesselbild [data-figur="${s.figur}"][data-feld="${s.feld}"][data-punkt="${s.punkt}"]`);
  assert.equal(w.zustand().eingabe, 'tozean');
  assert.equal(w.k.alle(w.flaeche, '.station-baender svg.signale-symbol').length, 6, 'Symbole im Band');
  // Rückweg: Symbol in der Leiste wählen → Buchstabe
  klick(w, '.labor-richtung [data-richtung="ent"]');
  for (const s of K.freimaurer('wal')) klick(w, `.signale-symbolleiste [data-figur="${s.figur}"][data-feld="${s.feld}"][data-punkt="${s.punkt}"]`);
  assert.equal(w.zustand().ausgabe, 'wal');
  assert.ok(w.k.eins(w.flaeche, '.signale-schluesselbild [data-figur="gitter"][data-feld="3"][data-punkt="true"]').classList.contains('an'), 'L leuchtet');
});

test('Freimaurer: Übungsnachricht (stimmt/noch nicht) und Symbole zählen (P6)', () => {
  const w = oeffne('signale', { voreinstellung: { reiter: ['freimaurer'] } });
  const feld = w.k.eins(w.flaeche, '.signale-uebung textarea');
  w.k.tippe(feld, 'falsch');
  klick(w, 'button.signale-pruefen');
  assert.match(w.text('.signale-uebung-ergebnis'), /noch nicht/i);
  const loesung = w.k.alle(w.flaeche, '.signale-uebung svg.signale-symbol').length;
  assert.ok(loesung > 5, 'Übungsnachricht als Symbole');
  for (const s of K.freimaurer('see')) klick(w, `.signale-schluesselbild [data-figur="${s.figur}"][data-feld="${s.feld}"][data-punkt="${s.punkt}"]`);
  klick(w, 'button.signale-zaehlen');
  assert.match(w.text('.signale-zaehlung'), /2/);
  assert.match(w.text('.signale-zaehlung'), /P6/);
});

test('signale: Zusatz-Chip, ruhig, Ton aus, Herkunft', async () => {
  const w = oeffne('signale', { ruhig: true });
  trommle(w, K.morse('a'));
  await w.k.ruhe();
  assert.equal(w.k.animiert.length, 0);
  assert.equal(w.k.audio, 0);
  assert.equal(w.k.eins(w.flaeche, 'button.station-ton').getAttribute('aria-pressed'), 'false');
  assert.equal(w.text('p.werkzeug-herkunft'), 'Ideen von A. Bodendiek (Krypto-Werkstatt)');
  assert.match(w.text('details.station-hintergrund'), /Codierung/);
  assert.match(w.text('.station-so-gehts'), /Rand/);
  // Nachspiel sperrt die Trommel
  w.k.klick(w.k.eins(w.flaeche, 'button.station-nachspielen'));
  klick(w, 'button.signale-trommel-fell');
  klick(w, 'button.signale-pause');
  assert.equal(w.zustand().eingabe, 'a');
  klick(w, 'button.station-nachspiel-ende');
  const L = w.k.wert('KRLabor');
  assert.equal(w.k.roh(L.WERKZEUGE.find((x) => x.id === 'signale')).art, 'zusatz');
});
