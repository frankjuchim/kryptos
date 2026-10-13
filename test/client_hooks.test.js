'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const D = require('./dom_attrappe');
const lade = () => {
  const k = D.lade(['common.js', 'render.js', 'interact.js']);
  return { k, AQR: k.wert('AQR'), AQI: k.wert('AQI') };
};
test('AQR.registriere: neuer Block, Klassen, ctx durchgereicht; Kern-Typ und Dopplung werfen', () => {
  const { k, AQR } = lade();
  let gesehen = null;
  AQR.registriere('quadrat', (b, c) => { gesehen = c; return k.document.createElement('table'); });
  const el = AQR.block({ t: 'quadrat' }, 0, { modus: 'boss' });
  assert.ok(el.classList.contains('block') && el.classList.contains('block-quadrat'));
  assert.equal(gesehen.modus, 'boss');
  assert.throws(() => AQR.registriere('quadrat', () => null), /bereits registriert/);
  assert.throws(() => AQR.registriere('text', () => null), /bereits registriert/);
});
test('AQR.raster mit Buchstabenköpfen', () => {
  const { k, AQR } = lade();
  const t = AQR.raster([['a', 'b']], null, { kopf: ['X', 'Y'] });
  assert.ok(t.classList.contains('scroll-x'));
  assert.deepEqual(k.alle(t, 'table thead th').slice(1).map((th) => k.text(th)), ['X', 'Y']); // div.scroll-x › table › thead › tr
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
