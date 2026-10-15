'use strict';
// Review-Fund 3: KRErkennerSpeicher (sessionStorage je Tab) – Rundlauf, Fehler ohne Ausnahme, nur Fortsetzungen.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const QUELLE = fs.readFileSync(path.join(__dirname, '..', 'public', 'static', 'js', 'krypto', 'erkenner_speicher.js'), 'utf8');
function lade(sessionStorage) {
  const ctx = vm.createContext({ sessionStorage, JSON });
  vm.runInContext(`${QUELLE}\nthis.S = KRErkennerSpeicher;`, ctx);
  return ctx.S;
}

test('speicher_rundlauf_je_werkzeug', () => {
  const m = new Map();
  const S = lade({ getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) });
  assert.equal(S.lade('scheibe'), null);
  S.speichere('scheibe', { alle: ['NA'] });
  S.speichere('skytale', { skytale: [] });
  assert.deepEqual(JSON.parse(JSON.stringify(S.lade('scheibe'))), { alle: ['NA'] });
  assert.deepEqual([...m.keys()], ['kr-erkenner']);
});

test('speicher_gesperrt_ohne_ausnahme', () => {
  const S = lade({ getItem() { throw new Error('gesperrt'); }, setItem() { throw new Error('voll'); } });
  assert.equal(S.lade('scheibe'), null);
  assert.doesNotThrow(() => S.speichere('scheibe', { alle: ['NA'] }));
  const kaputt = lade({ getItem: () => '{kaputt', setItem() {} });
  assert.equal(kaputt.lade('scheibe'), null);
});
