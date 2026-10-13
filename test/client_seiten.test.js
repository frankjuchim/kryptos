'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const D = require('./dom_attrappe');
const SITZUNG_S = { rolle: 'schueler', name: 'Mika R.', kurs: { id: 'k:1', name: 'LK 13 (eA)', niveau: 'eA' }, kurse: [{ id: 'k:1', name: 'LK 13 (eA)', aktiv: true }], portal: 'https://portal.test', version: '0.2.0' };
const BASIS = ['common.js', 'krypto/oberflaeche.js', 'krypto/kopfzeile.js'];
test('Labor-Seite: Raster nach Epoche, gesperrt mit Grund, Boss-Banner', async () => {
  const werkzeuge = [{ id: 'scheibe', titel: 'Chiffrierscheibe', welt: 0, frei: true, grund: null }, { id: 'haeufigkeit', titel: 'Häufigkeits-Analysator', welt: 1, frei: false, grund: 'lehrkraft' }, { id: 'vigenere', titel: 'Vigenère-Werkbank', welt: 2, frei: false, grund: 'welt' }];
  const k = D.lade([...BASIS, 'krypto/labor/registry.js', 'krypto/labor/seite.js'], { url: 'http://x.test/labor#/', fetch: { 'GET /api/sitzung': { status: 200, body: SITZUNG_S }, 'GET /api/labor': { status: 200, body: { boss: false, werkzeuge } } } });
  await k.ruhe();
  const haupt = k.document.getElementById('haupt');
  assert.deepEqual(k.alle(haupt, 'section.labor-epoche').map((s) => s.getAttribute('data-epoche')), ['0', '1', '2']);
  assert.equal(k.eins(haupt, 'a.werkzeug-karte').getAttribute('href'), '#/scheibe');
  assert.match(k.text(k.eins(haupt, '.werkzeug-karte.gesperrt')), /Deine Lehrkraft schaltet dieses Werkzeug später frei/);
});
