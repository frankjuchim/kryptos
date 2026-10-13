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

test('Farbmischer: Eves Mischung (Gelb doppelt) hebt sich deutlich von der gemeinsamen Farbe ab – hell und dunkel (ΔE_OK ≥ 0,08)', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const css = fs.readFileSync(path.join(__dirname, '..', 'public', 'static', 'css', 'tokens.css'), 'utf8');
  const werte = (name) => [...css.matchAll(new RegExp(`${name}:\\s*(#[0-9A-Fa-f]{6})`, 'g'))].map((m) => m[1]);
  const lin = (c) => { const x = c / 255; return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; };
  const ok = ([r8, g8, b8]) => {
    const [r, g, b] = [r8, g8, b8].map(lin);
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
  };
  const rgb = (t) => (String(t).match(/\d+/g) || []).slice(0, 3).map(Number);
  const hex = (x) => [1, 3, 5].map((i) => parseInt(x.slice(i, i + 2), 16));
  const [gelb, rot, blau] = ['--farbe-gelb', '--farbe-rot', '--farbe-blau'].map(werte);
  assert.ok(gelb.length >= 2, 'Tokens hell und dunkel');
  for (const i of [0, 1]) {
    const w = oeffne('modulo', { voreinstellung: { reiter: ['farbmischer'] } });
    const farbe = { gelb: gelb[i], rot: rot[i], blau: blau[i] };
    // getComputedStyle liefert die Topffarben der Tokens (hell bzw. dunkel)
    w.k.window.getComputedStyle = (el) => {
      const f = Object.keys(farbe).find((x) => el.classList && el.classList.contains(`farbe-${x}`));
      return { color: f ? `rgb(${hex(farbe[f]).join(', ')})` : '', getPropertyValue: () => '' };
    };
    const schalter = w.k.eins(w.flaeche, 'input.mit-zahlen');
    w.k.klick(schalter);
    w.k.klick(schalter); // neu zeichnen mit den Topffarben
    w.k.taste(w.k.eins(w.flaeche, '.nachspiel'), 'End');
    w.k.klick(w.k.eins(w.flaeche, 'button.eve-mischen'));
    const gemeinsam = rgb(w.k.eins(w.flaeche, '.farb-alice .farbkreis').style.getPropertyValue('--mischung'));
    const eve = rgb(w.k.eins(w.flaeche, '.eve-mischung .farbkreis').style.getPropertyValue('--mischung'));
    assert.equal(gemeinsam.length, 3);
    assert.equal(eve.length, 3);
    const [a, b] = [ok(gemeinsam), ok(eve)];
    const d = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
    assert.ok(d >= 0.08, `ΔE_OK ${d.toFixed(3)} (${i ? 'dunkel' : 'hell'})`);
    assert.match(w.text('.eve-mischung .farbname'), /Gelb doppelt/);
    assert.ok(w.k.alle(w.flaeche, '.eve-mischung .muster-gelb').length === 2, 'Muster zeigt Gelb doppelt');
  }
});
