'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
function element(tag, attrs, kinder) {
  const k = [];
  const el = { tag, attrs: attrs || {}, kinder: k, dataset: {}, klassen: new Set(), classList: { add: (...c) => c.forEach((x) => el.klassen.add(x)) }, setAttribute(n, v) { el.attrs[n] = v; }, appendChild(x) { k.push(x); return x; }, addEventListener() {} };
  for (const x of [kinder].flat(Infinity)) if (x !== null && x !== undefined && x !== false) k.push(x);
  return el;
}
function lade() {
  const AQ = { h: (tag, attrs, ...kinder) => element(tag, attrs, kinder), s: (tag, attrs, ...kinder) => element(tag, attrs, kinder), toast() {}, mische: (x) => x, lade: () => false, speichere() {} };
  const ctx = vm.createContext({ AQ, AQBaum: {}, console });
  for (const f of ['render.js', 'interact.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'public', 'static', 'js', f), 'utf8') + `\n;globalThis.__${f[0]} = ${f === 'render.js' ? 'AQR' : 'AQI'};`, ctx);
  return { AQR: ctx.__r, AQI: ctx.__i };
}
test('AQR.registriere: neuer Block, Klassen, ctx durchgereicht; Kern-Typ und Dopplung werfen', () => {
  const { AQR } = lade();
  let gesehen = null;
  AQR.registriere('quadrat', (b, c) => { gesehen = c; return element('table', {}, []); });
  const el = AQR.block({ t: 'quadrat' }, 0, { modus: 'boss' });
  assert.ok(el.klassen.has('block') && el.klassen.has('block-quadrat'));
  assert.equal(gesehen.modus, 'boss');
  assert.throws(() => AQR.registriere('quadrat', () => null), /bereits registriert/);
  assert.throws(() => AQR.registriere('text', () => null), /bereits registriert/);
});
test('AQR.raster mit Buchstabenköpfen', () => {
  const { AQR } = lade();
  const t = AQR.raster([['a', 'b']], null, { kopf: ['X', 'Y'] });
  assert.deepEqual(t.kinder[0].kinder[0].kinder[0].kinder.slice(1).map((th) => th.kinder[0]), ['X', 'Y']); // div.scroll-x › table › thead › tr
});
test('AQI.registriere, schrittArten, teilFuer, gapBesitzer', () => {
  const { AQI } = lade();
  const teil = { kind: 'chiffre', besitzt: (id) => id === 'c1', feld: () => 'FELD' };
  AQI.registriere('chiffre', () => teil);
  AQI.schrittArten.add('chiffre');
  assert.equal(AQI.teilFuer({ kind: 'chiffre' }, {}, 0), teil);
  assert.equal(AQI.teilFuer({ kind: 'gibtsnicht' }, {}, 0).kind, '?');
  assert.ok(AQI.schrittArten.has('order') && AQI.schrittArten.has('chiffre'));
  assert.equal(AQI.gapBesitzer([{ kind: 'gaps', besitzt: () => false }, teil], 'c1'), teil);
  assert.equal(AQI.gapBesitzer([teil], 'zz'), undefined);
  assert.throws(() => AQI.registriere('gaps', () => null), /bereits registriert/);
});
