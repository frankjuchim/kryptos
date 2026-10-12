'use strict';
// Kopien aus frankjuchim/labs müssen byte-gleich bleiben (TECHNIK §2.1, §15): src/jwt.js, scripts/vertrag_pruefen.js.
// Neue labs-Fassung übernehmen = Datei kopieren und den SHA-256 in test/fixtures/labs_hashes.json mit Quelle aktualisieren.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const BASIS = path.join(__dirname, '..');
const HASHES = require('./fixtures/labs_hashes.json');

const dateien = Object.keys(HASHES).filter((k) => !k.startsWith('_'));

test('Fixture nennt genau jwt.js und vertrag_pruefen.js', () => {
  assert.deepEqual(dateien.sort(), ['scripts/vertrag_pruefen.js', 'src/jwt.js']);
});

for (const datei of dateien) {
  test(`${datei} ist byte-gleich zur labs-Fassung`, () => {
    const pfad = path.join(BASIS, datei);
    assert.ok(fs.existsSync(pfad), `${datei} fehlt`);
    const ist = crypto.createHash('sha256').update(fs.readFileSync(pfad)).digest('hex');
    assert.equal(ist, HASHES[datei], `${datei} weicht von frankjuchim/labs ab (${HASHES._quelle})`);
  });
}
