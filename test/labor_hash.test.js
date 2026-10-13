'use strict';
// Kryptolabor: Hash-Labor (W5 §9.1, Plan M6 Task 123, E68, E75, E89).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { oeffne, Krypto: K } = require('./hilfen_labor');
test('Schritt für Schritt: KH(nebel) = 9, Rundentabelle = Protokoll, Hinweis auf entfallene Zeichen', () => {
  const w = oeffne('hash', { voreinstellung: { text: 'Nebel 42' } });
  assert.equal(w.zustand().wert, 9);
  assert.deepEqual(w.k.alle(w.flaeche, 'table.runden-tabelle tbody tr').map((z) => w.k.alle(z, 'td,th').map((c) => w.k.text(c)).join('|')), K.kryptosHash('nebel', { protokoll: true }).schritte.map((s) => [s.buchstabe, s.w, s.vorher, s.summe, s.nachher].join('|')));
  assert.match(w.text('.labor-hinweis'), /Ziffern und Leerzeichen entfallen/);
});
test('Lawine: KH und SHA-256 aus der Bibliothek, Bitzähler über xorBits', () => {
  const w = oeffne('hash', { voreinstellung: { reiter: ['lawine'] } });
  w.k.tippe(w.k.eins(w.flaeche, 'input.lawine-a'), 'abc');
  w.k.tippe(w.k.eins(w.flaeche, 'input.lawine-b'), 'abd');
  assert.equal(w.zustand().shaA, K.sha256('abc'));
  const bits = (h) => K.vonHex(h).map((b) => K.byteZuBits(b)).join('');
  const anders = [...K.xorBits(bits(K.sha256('abc')), bits(K.sha256('abd')))].filter((c) => c === '1').length;
  assert.equal(w.zustand().verschiedeneBits, anders);
  assert.match(w.text('.lawine-zaehler'), new RegExp(`${anders} von 256 Bits verschieden`));
});
test('Kollisionssuche: heute und morgen landen in Fach 22 – Kollision nach 2 Wörtern', () => {
  const w = oeffne('hash', { voreinstellung: { reiter: ['kollision'] } });
  const feld = w.k.eins(w.flaeche, 'input.kollision-wort');
  for (const wort of ['heute', 'morgen']) { w.k.tippe(feld, wort); w.k.taste(feld, 'Enter'); }
  assert.equal(w.zustand().kollisionNach, 2);
  assert.ok(w.k.eins(w.flaeche, 'ol.faecher li[data-fach="22"]').classList.contains('kollision'));
  assert.match(w.text('.faecher-info'), /Spätestens beim 30\. Wort/);
});
test('Kollisionsbaukasten: bote, j = 2, a → bato (Beitrag 19); unmöglicher Ausgleich', () => {
  const w = oeffne('hash', { voreinstellung: { reiter: ['baukasten'], text: 'bote' } });
  w.k.tippe(w.k.eins(w.flaeche, 'input.baukasten-buchstabe'), 'a');
  w.k.taste(w.k.eins(w.flaeche, '.labor-zahl [role="spinbutton"]'), 'ArrowUp'); // j = 2
  assert.match(w.text('.baukasten-beitrag'), /= 19/);
  w.k.klick(w.k.eins(w.flaeche, 'button.ausgleichen'));
  assert.equal(w.zustand().baukasten.wort, 'bato');
  assert.equal(K.kryptosHash('bato').wert, K.kryptosHash('bote').wert);
});
test('Passwort & Salz: Salz aus umgebung.zufall, ohne Salz gleiche Werte, Login', () => {
  const folge = [0, 0.5, 0.1, 0.2, 0.9, 0.95];
  let i = 0;
  const w = oeffne('hash', { voreinstellung: { reiter: ['passwort'] }, umgebung: { zufall: () => folge[i++ % folge.length] } });
  const felder = w.k.alle(w.flaeche, 'input.konto-passwort');
  w.k.tippe(felder[0], 'sonne'); w.k.tippe(felder[1], 'sonne');
  const z = w.zustand();
  assert.deepEqual(z.konten.map((x) => x.salz), [K.buchstabe(1) + K.buchstabe(14), K.buchstabe(3) + K.buchstabe(6), K.buchstabe(24) + K.buchstabe(25)]);
  assert.equal(z.konten[0].wert, K.kryptosHash(z.konten[0].salz + 'sonne').wert);
  w.k.klick(w.k.eins(w.flaeche, 'input.ohne-salz'));
  assert.equal(w.zustand().konten[0].wert, w.zustand().konten[1].wert);
  w.k.tippe(w.k.eins(w.flaeche, 'input.login-passwort'), 'sonne');
  w.k.klick(w.k.eins(w.flaeche, 'button.login'));
  assert.match(w.text('.login-ergebnis'), /Anmeldung erfolgreich/);
  assert.match(w.text('.passwort-warnung'), /Argon2\/bcrypt/);
});
test('Prüfsummen: regal/lager – S gleich (14), G verschieden (26/0)', () => {
  const w = oeffne('hash', { voreinstellung: { reiter: ['pruefsumme'] } });
  w.k.tippe(w.k.eins(w.flaeche, 'input.pruef-a'), 'regal');
  w.k.tippe(w.k.eins(w.flaeche, 'input.pruef-b'), 'lager');
  assert.deepEqual(w.zustand().pruefsummen, { S: [14, 14], G: [26, 0] });
  assert.match(w.text('.pruef-s'), /gleich/);
  assert.match(w.text('.pruef-g'), /verschieden/);
});

test('Hash-Labor: Beispiele eigens gewählt, Ergebnis erst nach der letzten Runde, unmöglicher Ausgleich, SHA-256 gekürzt, reduzierte Bewegung', () => {
  const w = oeffne('hash');
  const z = w.zustand();
  assert.equal(z.wert, K.kryptosHash('Kamin 3').wert);
  assert.match(w.text('.hash-normal'), /kamin/);
  assert.match(w.text('.hash-ergebnis'), /nach der letzten Runde/);
  w.k.taste(w.k.eins(w.flaeche, '.nachspiel'), 'End');
  assert.match(w.text('.hash-ergebnis'), new RegExp(`KH\\(kamin\\) = ${z.wert}`));
  // Baukasten: zange, j = 1, i → kein Buchstabe gleicht aus
  const b = oeffne('hash', { voreinstellung: { reiter: ['baukasten'] } });
  b.k.tippe(b.k.eins(b.flaeche, 'input.baukasten-buchstabe'), 'i');
  assert.equal(K.kryptosHash.ausgleichen('zange', 1, 'i').wort, null);
  b.k.klick(b.k.eins(b.flaeche, 'button.ausgleichen'));
  assert.match(b.text('.baukasten-ergebnis'), /Kein Buchstabe gleicht aus – anderen Buchstaben wählen/);
  assert.equal(b.zustand().baukasten.wort, null);
  // Passwort mit SHA-256: 16 Hexziffern, gekennzeichnet
  const p = oeffne('hash', { voreinstellung: { reiter: ['passwort'] }, umgebung: { zufall: () => 0 } });
  p.k.tippe(p.k.alle(p.flaeche, 'input.konto-passwort')[2], 'blau');
  p.k.klick(p.k.eins(p.flaeche, '.passwort-verfahren [data-verfahren="sha256"]'));
  assert.equal(p.zustand().konten[2].wert, K.sha256('AA' + 'blau').slice(0, 16));
  assert.match(p.text('.passwort-tabelle'), /gekürzt/);
  // reduzierte Bewegung: Wörter fallen ohne Animation
  const r = oeffne('hash', { voreinstellung: { reiter: ['kollision'] }, ruhig: true });
  const feld = r.k.eins(r.flaeche, 'input.kollision-wort');
  r.k.tippe(feld, 'ruder');
  r.k.taste(feld, 'Enter');
  assert.equal(r.k.alle(r.flaeche, 'ol.faecher li.neu').length, 0);
  assert.ok(r.k.eins(r.flaeche, `ol.faecher li[data-fach="${K.kryptosHash('ruder').wert}"]`).classList.contains('belegt'));
});
