'use strict';
// Fachlisten Kryptos (src/krypto/fach.js): Welten, Kategorien, Fallen, Ränge, Teams, Plattformdaten (Design §2–§5).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const F = require('../src/krypto/fach');
const D = require('../src/domain');

test('fach: Welten, Fallen, Ränge', () => {
  assert.equal(F.PLATTFORM.id, 'kryptos');
  assert.deepEqual(F.WELTEN.map(w => w.titel), ['Die Antike','Das Haus der Weisheit','Le chiffre indéchiffrable','Das Maschinenzeitalter','Das Schlüsselproblem','Das Netz','Die Zeitmaschine']);
  assert.deepEqual(F.WELTEN.map(w => w.farbe), ['#B5523B','#1F4E8C','#7A2E2E','#556B2F','#1E7B4F','#0E7C86','#8A5F1A']);
  assert.deepEqual(Object.keys(F.FALLEN), ['P1','P2','P3','P4','P5','P6','P7','P8','P9','P10']);
  assert.equal(F.FALLEN.P3.titel, 'Umkehrung falsch');
  assert.deepEqual(F.RAENGE.map(r => [r.name, r.ab]), [['Lehrling',0],['Schreiber',0.1],['Chiffreur',0.3],['Kryptoanalytiker',0.55],['Meister der Chiffren',0.8]]);
  assert.equal(F.LAB_KATEGORIEN.length, 25);
});

test('fach: Plattformdaten, Kategorie-Namen, Teams', () => {
  assert.deepEqual(F.PLATTFORM, {
    id: 'kryptos',
    name: 'Kryptos',
    titel: 'Kryptos – Die Zeitreise der Geheimschriften',
    farbe: '#B07D2B',
    themenfeld: 'Kryptologie',
    kurs: 'Informatik eA und gA, Niedersachsen, Abitur ab 2027'
  });
  assert.deepEqual(F.WELTEN.map((w) => w.nr), [0, 1, 2, 3, 4, 5, 6]);
  assert.equal(new Set(F.LAB_KATEGORIEN).size, 25);
  for (const k of F.LAB_KATEGORIEN) {
    assert.match(k, /^[a-z]+(-[a-z]+)*$/, `Slug ${k}`);
    assert.ok(F.LAB_KATEGORIE_NAMEN[k], `Anzeigename für ${k}`);
  }
  assert.deepEqual(Object.keys(F.LAB_KATEGORIE_NAMEN), F.LAB_KATEGORIEN);
  for (const [p, f] of Object.entries(F.FALLEN)) {
    assert.ok(f.titel && f.text, `Falle ${p} mit Kurztitel und Erläuterung`);
  }
  assert.equal(F.TEAM_NAMEN.length, 12);
  assert.equal(new Set(F.TEAM_NAMEN).size, 12);
  for (const t of F.TEAM_NAMEN) assert.match(t, /^Team /);
  const text = JSON.stringify(F);
  assert.ok(!/Algo Quest/i.test(text), 'kein „Algo Quest“ in den Fachlisten');
});

test('domain: Kern-Namen kommen aus den Fachlisten', () => {
  assert.deepEqual(D.WELTEN.map((w) => w.titel), F.WELTEN.map((w) => w.titel));
  assert.equal(D.WELT_MAP[2].farbe, '#7A2E2E');
  assert.deepEqual(D.LAB_KATEGORIEN, F.LAB_KATEGORIEN);
  assert.deepEqual(D.KATA_KATEGORIEN, F.LAB_KATEGORIEN);
  assert.deepEqual(D.FALLEN_IDS, Object.keys(F.FALLEN));
  assert.deepEqual(D.FALLEN[2], { p: 'P3', titel: 'Umkehrung falsch', text: F.FALLEN.P3.text });
  assert.deepEqual(D.RAENGE, F.RAENGE);
  assert.equal(D.rangFuer(0.56).name, 'Kryptoanalytiker');
  assert.equal(D.PLATTFORM.id, 'kryptos');
  assert.deepEqual(D.TEAM_NAMEN, F.TEAM_NAMEN);
});
