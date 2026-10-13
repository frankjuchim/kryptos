'use strict';
// Kryptolabor: Modulo-Uhr & Farbmischer (W4 §9.1, Plan M6 Task 121, E80).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { oeffne, Krypto: K } = require('./hilfen_labor');

test('Uhr: 23 + 7 auf der 26er-Uhr → 4 (D), Multiplizieren mit teileMitRest', () => {
  const w = oeffne('modulo', { voreinstellung: { modul: 26 } });
  w.k.tippe(w.k.eins(w.flaeche, 'input.uhr-a'), '23');
  w.k.tippe(w.k.eins(w.flaeche, 'input.uhr-b'), '7');
  assert.equal(w.zustand().zeiger, K.mod(30, 26));
  assert.match(w.text('.uhr-zeile'), /23 \+ 7 = 30 = 1 · 26 \+ 4 → 4/);
  w.k.klick(w.k.eins(w.flaeche, '.uhr-op [data-op="mal"]'));
  w.k.tippe(w.k.eins(w.flaeche, 'input.uhr-a'), '7');
  w.k.tippe(w.k.eins(w.flaeche, 'input.uhr-b'), '9');
  assert.match(w.text('.uhr-zeile'), /7 · 9 = 63 = 2 · 26 \+ 11/);
  // Beschriftung A = 1 … Z = 26: Feld 4 heißt D
  w.k.klick(w.k.eins(w.flaeche, '[data-beschriftung="buchstaben"]'));
  assert.equal(w.k.text(w.k.eins(w.flaeche, 'svg.uhr [data-feld="4"] text')), 'D');
});

test('Potenzieren und Wertetabelle: 3 mod 17 Primitivwurzel, 2 nicht (ord 8)', () => {
  const w = oeffne('modulo', { voreinstellung: { reiter: ['tabelle'], modul: 17, g: 3 } });
  assert.deepEqual(w.zustand().potenzen, Array.from({ length: 16 }, (_, i) => K.modpow(3, i + 1, 17)));
  assert.match(w.text('.tabelle-kopf'), /3 ist Primitivwurzel/);
  const z = oeffne('modulo', { voreinstellung: { reiter: ['tabelle'], modul: 17, g: 2 } });
  assert.match(z.text('.tabelle-kopf'), /ord\(2\) = 8/);
  // Potenzieren auf der Uhr: Pfad g¹ … gˣ, je Schritt Rest
  const u = oeffne('modulo', { voreinstellung: { modul: 17 } });
  u.k.klick(u.k.eins(u.flaeche, '.uhr-op [data-op="hoch"]'));
  u.k.tippe(u.k.eins(u.flaeche, 'input.uhr-a'), '3');
  u.k.tippe(u.k.eins(u.flaeche, 'input.uhr-b'), '4');
  assert.deepEqual(u.zustand().potenzen, [1, 2, 3, 4].map((x) => K.modpow(3, x, 17)));
  assert.equal(u.zustand().zeiger, K.modpow(3, 4, 17));
  assert.match(u.text('.uhr-zeile'), /3⁴ = 10 · 3 = 30 = 1 · 17 \+ 13 → 13/);
});

test('Inverses: 3 mod 26 = 9, 4 mod 26 kein Inverses (ggT 2)', () => {
  const w = oeffne('modulo', { voreinstellung: { reiter: ['inverses'], modul: 26, a: 3 } });
  assert.equal(w.zustand().inverses, 9);
  assert.equal(w.k.eins(w.flaeche, 'tr.treffer').dataset.x, '9');
  const v = oeffne('modulo', { voreinstellung: { reiter: ['inverses'], modul: 26, a: 4 } });
  assert.match(v.text('.labor-hinweis'), /kein Inverses, weil ggT = 2/);
});

test('Farbmischer: Nachspiel in vier Schritten, Endfarben gleich, Eve-Mischung anders, Mit Zahlen ohne Logarithmus', () => {
  const w = oeffne('modulo', { voreinstellung: { reiter: ['farbmischer'] } });
  const leiste = w.k.eins(w.flaeche, '.nachspiel');
  assert.match(w.k.text(w.k.eins(leiste, '.nachspiel-zaehler')), /von 4/);
  w.k.taste(leiste, 'End');
  assert.deepEqual(w.zustand().alice, w.zustand().bob);
  w.k.klick(w.k.eins(w.flaeche, 'button.eve-mischen'));
  assert.notDeepEqual(w.zustand().eve, w.zustand().alice);
  w.k.klick(w.k.eins(w.flaeche, 'input.mit-zahlen'));
  for (const [f, v] of [['p', '23'], ['g', '5'], ['a', '6'], ['b', '15']]) w.k.tippe(w.k.eins(w.flaeche, `input.dh-${f}`), v);
  assert.deepEqual([w.zustand().A, w.zustand().B, w.zustand().K], [K.dh.oeffentlich(5, 6, 23), K.dh.oeffentlich(5, 15, 23), K.dh.gemeinsam(19, 6, 23)]);
  assert.doesNotMatch(w.text('.eve-leiste'), /a = 6|b = 15/);
  w.k.tippe(w.k.eins(w.flaeche, 'input.dh-g'), '2');
  assert.match(w.text('.labor-hinweis'), /keine Primitivwurzel/);
});

test('Farbmischer: Töpfe mit Muster und Namen (Farbe nie einziges Signal), Mischung per CSSOM', () => {
  const w = oeffne('modulo', { voreinstellung: { reiter: ['farbmischer'] } });
  const toepfe = w.k.alle(w.flaeche, 'button.topf');
  assert.deepEqual(toepfe.map((t) => t.dataset.farbe), ['gelb', 'rot', 'blau']);
  for (const t of toepfe) assert.ok(t.querySelector('.muster') && /Gelb|Rot|Blau/.test(w.k.text(t)));
  w.k.taste(w.k.eins(w.flaeche, '.nachspiel'), 'End');
  assert.match(w.text('.farb-alice .farbname'), /Gelb.*Rot.*Blau/);
});

test('Modulo: reduzierte Bewegung – Zeiger ohne Animation', () => {
  const w = oeffne('modulo', { ruhig: true });
  w.k.tippe(w.k.eins(w.flaeche, 'input.uhr-b'), '5');
  assert.equal(w.k.eins(w.flaeche, 'line.zeiger').classList.contains('animiert'), false);
  const b = oeffne('modulo');
  b.k.tippe(b.k.eins(b.flaeche, 'input.uhr-b'), '5');
  assert.equal(b.k.eins(b.flaeche, 'line.zeiger').classList.contains('animiert'), true);
});
