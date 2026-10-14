'use strict';
// Werkzeug „Polybios & Playfair“ (Plan M10 Task 229, E180, E186) nach der Krypto-Werkstatt (Ideen von A. Bodendiek):
// Polybios-Quadrat zum Antippen (Zeile/Spalte, Zahlenpaare), eigenes Quadrat mit Schlüsselwort, Fackeltelegraph,
// Klopfzeichen (Ton optional, Standard aus); Playfair ab Welt 2 mit Paar, Regel und Ergebnis aus Krypto.playfairSchritte.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { oeffne, Krypto: K } = require('./hilfen_labor');

const feld = (w, b) => w.k.eins(w.flaeche, `.quadrat-feld[data-buchstabe="${b}"]`);
const tippe = (w, text) => {
  for (const b of K.nurBuchstaben(text)) w.k.klick(feld(w, b === 'J' ? 'I' : b));
};
const quadratText = (w) => w.k.alle(w.flaeche, '.quadrat-feld').map((f) => f.dataset.buchstabe).join('');

test('Polybios: Antippen → Paare = Krypto.polybios', () => {
  const w = oeffne('quadrat');
  for (const b of ['W', 'O', 'L', 'F']) w.k.klick(w.k.eins(w.flaeche, `.quadrat-feld[data-buchstabe="${b}"]`));
  assert.equal(w.zustand().ausgabe, K.polybios('wolf'));
  assert.match(w.text('.quadrat-feld[data-buchstabe="I"]'), /I\/J/);
  assert.equal(w.zustand().eingabe, 'wolf');
  assert.equal(w.zustand().reiter, 'polybios');
  assert.equal(w.k.eins(w.flaeche, '.station-baender output.geheim').textContent, '52 34 31 21', 'Zahlenpaare mit Lücken');
  // Zeile und Spalte des letzten Buchstabens leuchten, das Panel zeigt Buchstabe und Paar
  assert.equal(w.k.eins(w.flaeche, '.quadrat-kopf[data-zeile="2"]').classList.contains('an'), true);
  assert.equal(w.k.eins(w.flaeche, '.quadrat-kopf[data-spalte="1"]').classList.contains('an'), true);
  assert.equal(w.text('.quadrat-gross'), 'F');
  assert.match(w.text('.quadrat-koordinaten'), /2\s*1/);
  // Fackeltelegraph: links 2 Fackeln (Zeile), rechts 1 (Spalte)
  assert.equal(w.k.alle(w.flaeche, '.quadrat-fackeln-links .quadrat-flamme.an').length, 2);
  assert.equal(w.k.alle(w.flaeche, '.quadrat-fackeln-rechts .quadrat-flamme.an').length, 1);
  // ⌫ Zurück nimmt den letzten Buchstaben weg
  w.k.klick(w.k.eins(w.flaeche, 'button.station-zurueck'));
  assert.equal(w.zustand().ausgabe, K.polybios('wol'));
});

test('Polybios entschlüsseln: Zeile, dann Spalte antippen = Krypto.polybios(…, ent)', () => {
  const w = oeffne('quadrat', { voreinstellung: { richtung: 'ent' } });
  const kopf = (art, n) => w.k.klick(w.k.eins(w.flaeche, `button.quadrat-kopf[data-${art}="${n}"]`));
  for (const [z, s] of [[4, 4], [1, 5], [3, 5]]) {
    kopf('zeile', z);
    kopf('spalte', s);
  }
  assert.equal(w.zustand().eingabe, '441535');
  assert.equal(w.zustand().ausgabe, K.klein(K.polybios('441535', {}, 'ent')));
  assert.equal(w.zustand().richtung, 'ent');
  // Spalte ohne Zeile → Hinweis, nichts geschrieben
  kopf('spalte', 2);
  assert.equal(w.zustand().eingabe, '441535');
  assert.match(w.text('.station-erklaerung'), /Zeile/);
});

test('Polybios: Schlüsselwort-Quadrat = Krypto.quadrat (Voreinstellung und Stempel)', () => {
  const v = oeffne('quadrat', { voreinstellung: { schluesselwort: 'sternbild' } });
  assert.equal(quadratText(v), K.quadrat('STERNBILD').join(''));
  tippe(v, 'turm');
  assert.equal(v.zustand().ausgabe, K.polybios('turm', { schluessel: 'STERNBILD' }));
  assert.equal(v.zustand().schluesselwort, 'STERNBILD');

  const w = oeffne('quadrat');
  assert.equal(quadratText(w), K.quadrat('').join(''), 'Standardquadrat');
  w.k.klick(w.k.eins(w.flaeche, 'button.quadrat-wort-aendern'));
  for (const b of 'MOOR') w.k.klick(w.k.eins(w.flaeche, `.quadrat-wort-editor button.station-stempel[data-buchstabe="${b}"]`));
  assert.match(w.text('.quadrat-wort-streifen'), /doppelt/, 'doppelter Buchstabe wird gestrichen');
  w.k.klick(w.k.eins(w.flaeche, 'button.quadrat-wort-aufbauen'));
  assert.equal(quadratText(w), K.quadrat('MOOR').join(''));
  assert.equal(w.zustand().schluesselwort, 'MOOR');
  // Mindestens drei Buchstaben
  w.k.klick(w.k.eins(w.flaeche, 'button.quadrat-wort-aendern'));
  w.k.klick(w.k.eins(w.flaeche, '.quadrat-wort-editor button.station-stempel[data-buchstabe="A"]'));
  w.k.klick(w.k.eins(w.flaeche, 'button.quadrat-wort-aufbauen'));
  assert.match(w.text('.quadrat-wort-hinweis'), /3 Buchstaben/);
  assert.equal(w.zustand().schluesselwort, 'MOOR');
  w.k.klick(w.k.eins(w.flaeche, 'button.quadrat-wort-standard'));
  assert.equal(quadratText(w), K.quadrat('').join(''));
  // Während eine Nachricht steht, bleibt das Quadrat fest
  tippe(w, 'ab');
  assert.equal(w.k.eins(w.flaeche, 'button.quadrat-wort-aendern').disabled, true);
  w.k.klick(w.k.eins(w.flaeche, 'button.station-neu'));
  assert.equal(w.k.eins(w.flaeche, 'button.quadrat-wort-aendern').disabled, false);
});

test('Polybios: Klopfzeichen sichtbar als Schlagfolge, Ton aus, Herkunft, So funktioniert’s, Hintergrund', async () => {
  const w = oeffne('quadrat', { ruhig: true });
  tippe(w, 'wo');
  const klopf = w.text('.quadrat-klopfen');
  assert.match(klopf, /•{5}\s*•{2}/, 'W = 5 · 2');
  assert.match(klopf, /•{3}\s*•{4}/, 'O = 3 · 4');
  assert.equal(w.k.eins(w.flaeche, 'button.station-ton').getAttribute('aria-pressed'), 'false');
  w.k.klick(w.k.eins(w.flaeche, 'button.quadrat-klopfen-start'));
  await w.k.ruhe();
  assert.equal(w.k.audio, 0, 'ohne Schalter kein Ton');
  assert.equal(w.k.animiert.length, 0, 'ruhig: keine Animation');
  assert.equal(w.text('p.werkzeug-herkunft'), 'Ideen von A. Bodendiek (Krypto-Werkstatt)');
  assert.match(w.text('.station-so-gehts'), /Zeile/);
  assert.match(w.text('details.station-hintergrund'), /25!/);
  assert.match(w.text('details.station-hintergrund'), /10²⁵/);
});

test('Playfair: Paar, Regel und Ergebnis aus playfairSchritte', () => {
  const w = oeffne('quadrat', { voreinstellung: { reiter: ['playfair'], schluesselwort: 'KRYPTOLOGIE' } });
  for (const b of ['W', 'I']) w.k.klick(w.k.eins(w.flaeche, `.quadrat-feld[data-buchstabe="${b}"]`));
  const s = K.playfairSchritte('wi', 'KRYPTOLOGIE')[0];
  assert.equal(w.zustand().regel, s.regel);
  assert.equal(w.zustand().ausgabe, s.ergebnis);
  assert.equal(w.zustand().paar, 'WI');
  assert.equal(w.zustand().reiter, 'playfair');
  assert.equal(quadratText(w), K.quadrat('KRYPTOLOGIE').join(''));
  assert.ok(w.k.eins(w.flaeche, `.quadrat-regel[data-regel="${s.regel}"]`).classList.contains('an'), 'Regel markiert');
  for (const b of s.ergebnis) assert.ok(feld(w, b).classList.contains('ziel'), `Ziel ${b} markiert`);
});

test('Playfair: Doppelbuchstabe → X, Nachricht abschließen, gesamt = Krypto.playfair; Entschlüsseln', () => {
  const sw = 'LEUCHTFEUER';
  const w = oeffne('quadrat', { voreinstellung: { reiter: ['playfair'], schluesselwort: sw } });
  tippe(w, 'ballon');
  w.k.klick(w.k.eins(w.flaeche, 'button.quadrat-abschliessen'));
  assert.equal(w.zustand().ausgabe, K.playfair('ballon', sw));
  assert.equal(w.zustand().eingabe, K.klein(K.playfairSchritte('ballon', sw).map((x) => x.paar).join('')));
  assert.match(w.text('.station-erklaerung'), /X/);
  // Entschlüsseln: Paare des Geheimtexts antippen
  const geheim = K.playfair('ballon', sw);
  w.k.klick(w.k.eins(w.flaeche, '.labor-richtung [data-richtung="ent"]'));
  assert.equal(w.zustand().eingabe, '', 'Richtungswechsel beginnt eine neue Nachricht');
  tippe(w, geheim);
  assert.equal(w.zustand().ausgabe, K.klein(K.playfair(geheim, sw, 'ent')));
  assert.equal(w.k.eins(w.flaeche, 'button.quadrat-abschliessen').hidden, true, 'nur beim Verschlüsseln');
  // zwei gleiche Buchstaben bilden im Geheimtext kein Paar
  const vorher = w.zustand().eingabe;
  w.k.klick(feld(w, 'A'));
  w.k.klick(feld(w, 'A'));
  assert.equal(w.zustand().eingabe, vorher);
  assert.match(w.text('.station-erklaerung'), /gleiche/);
});

test('Playfair: Übung – Ziel-Felder selbst finden, Rückmeldung nur zur Regel; ein Buchstabe – viele Bilder', () => {
  const sw = 'LEUCHTFEUER';
  const w = oeffne('quadrat', { voreinstellung: { reiter: ['playfair'], schluesselwort: sw } });
  const uebung = w.k.eins(w.flaeche, 'input.quadrat-uebung');
  w.k.klick(uebung);
  assert.equal(uebung.checked, true);
  w.k.klick(feld(w, 'W'));
  w.k.klick(feld(w, 'A'));
  const s = K.playfairSchritte('wa', sw)[0];
  assert.equal(w.zustand().ausgabe, '', 'Ergebnis erst nach der Übung');
  for (const b of s.ergebnis) assert.equal(feld(w, b).classList.contains('ziel'), false, 'Ziele nicht verraten');
  const falsch = K.quadrat(sw).join('').split('').find((b) => !s.ergebnis.includes(b) && b !== 'W' && b !== 'A');
  w.k.klick(feld(w, falsch));
  assert.match(w.text('.station-erklaerung'), /Noch nicht/);
  assert.doesNotMatch(w.text('.station-erklaerung'), new RegExp(`→ ${s.ergebnis}`));
  w.k.klick(feld(w, s.ergebnis[0]));
  w.k.klick(feld(w, s.ergebnis[1]));
  assert.equal(w.zustand().ausgabe, s.ergebnis);
  w.k.klick(uebung);
  // „Ein Buchstabe – viele Bilder“: derselbe Klartextbuchstabe mit verschiedenen Partnern
  tippe(w, 'wbwc');
  const bilder = new Set([s.ergebnis[0], ...K.playfairSchritte('wbwc', sw).map((x) => x.ergebnis[0])]);
  if (bilder.size > 1) assert.match(w.text('.quadrat-bilder'), /W/);
});

test('Playfair: in Welt 0/1 ausgeblendet (E180), Lehrkraft sieht den Reiter', () => {
  const w = oeffne('quadrat', { umgebung: { welten: [0, 1] } });
  assert.equal(w.k.alle(w.flaeche, '[role="tab"][data-reiter="playfair"]').length, 0);
  const v = oeffne('quadrat', { voreinstellung: { reiter: ['playfair'] }, umgebung: { welten: [0, 1] } });
  assert.notEqual(v.zustand().reiter, 'playfair');
  const l = oeffne('quadrat', { umgebung: { welten: [0], rolle: 'lehrkraft' } });
  assert.equal(l.k.alle(l.flaeche, '[role="tab"][data-reiter="playfair"]').length, 1);
});

test('quadrat: ruhig, nachspiel_sperrt_handgriffe, Herkunft, Ton aus', async () => {
  const w = oeffne('quadrat', { ruhig: true });
  tippe(w, 'turm');
  w.k.klick(w.k.eins(w.flaeche, 'button.station-nachspielen'));
  w.k.klick(w.k.eins(w.flaeche, '.nachspiel .nachspiel-abspielen'));
  assert.match(w.text('.station-sperrhinweis'), /Während des Nachspielens/);
  w.k.klick(feld(w, 'A'));
  assert.equal(w.zustand().eingabe, 'turm', 'Handgriffe gesperrt');
  await w.k.ruhe();
  assert.equal(w.k.animiert.length, 0);
  w.k.klick(w.k.eins(w.flaeche, 'button.station-nachspiel-ende'));
  w.k.klick(feld(w, 'A'));
  assert.equal(w.zustand().eingabe, 'turma');
  assert.equal(w.k.audio, 0);
  const p = oeffne('quadrat', { voreinstellung: { reiter: ['playfair'] }, ruhig: true });
  tippe(p, 'turm');
  p.k.klick(p.k.eins(p.flaeche, 'button.station-nachspielen'));
  assert.ok(p.k.eins(p.flaeche, '.nachspiel'), 'Nachspiel für Playfair');
  p.k.klick(feld(p, 'A'));
  assert.equal(p.zustand().eingabe, 'turm');
  assert.equal(p.text('p.werkzeug-herkunft'), 'Ideen von A. Bodendiek (Krypto-Werkstatt)');
  assert.match(p.text('details.station-hintergrund'), /25!/);
});
