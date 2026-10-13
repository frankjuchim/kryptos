'use strict';
// Warm-up-Karten W0–W2 (Plan M5 Task 89, E47): seed/warmup/w<n>.json gegen Welt-Spec §7 (Aufgabe, Lösung) und
// Materialquelle quellen/material/W<n>/warmup_W<n>.json (Titel, Kategorie, Minuten); Kern-Import lädt alle 36 Karten.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const S = require('./hilfen_spec');
const H = require('./helpers');

const material = (welt) => JSON.parse(fs.readFileSync(path.join(S.WURZEL, 'quellen', 'material', `W${welt}`, `warmup_W${welt}.json`), 'utf8'));
/** Spec-Text ohne Prüfvermerk „✔ nachgerechnet“ (normalisiert verglichen) */
const ohneVermerk = (t) => String(t).replace(/✔\s*nachgerechnet/g, '');

for (const welt of [0, 1, 2]) {
  test(`Warm-up W${welt}: 12 Karten, ids, Titel/Kategorie/Minuten wie Materialquelle, Texte wie Spec §7`, () => {
    const wu = S.warmup(welt);
    assert.ok(wu, `seed/warmup/w${welt}.json fehlt`);
    assert.equal(wu.version, 1);
    assert.equal(wu.karten.length, 12);
    const ids = wu.karten.map((k) => k.id);
    assert.deepEqual(ids, Array.from({ length: 12 }, (_, i) => `WU-W${welt}-${String(i + 1).padStart(2, '0')}`));
    const mat = material(welt);
    const spec = S.specAufgaben(welt).filter((a) => a.art === 'warmup');
    for (const k of wu.karten) {
      assert.equal(k.welt, welt, `${k.id}: welt`);
      const m = mat.karten.find((x) => x.id === k.id);
      assert.ok(m, `${k.id} fehlt in der Materialquelle`);
      assert.equal(k.titel, m.titel, `${k.id}: titel`);
      assert.equal(k.kategorie, m.kategorie, `${k.id}: kategorie`);
      assert.equal(k.minuten, m.minuten, `${k.id}: minuten`);
      const s = spec.find((x) => x.id === k.id);
      assert.ok(s, `${k.id} fehlt in Spec §7`);
      assert.ok(S.normalisiert(k.aufgabe).includes(S.normalisiert(s.inhalt)), `${k.id}: aufgabe enthält den Spec-Text`);
      assert.ok(S.normalisiert(k.loesung).includes(S.normalisiert(ohneVermerk(s.loesung))), `${k.id}: loesung enthält die Spec-Lösung`);
      assert.doesNotMatch(k.aufgabe + k.loesung, /nachgerechnet/, `${k.id}: ohne Prüfvermerk`);
      // Kein Leck: die Lösung steht nicht schon auf der Vorderseite (nur Rechenergebnisse ≥ 3 Zeichen prüfbar)
      for (const m2 of String(k.loesung).matchAll(/`([A-Z ]{3,})`/g)) {
        assert.ok(!S.normalisiert(k.aufgabe).includes(S.normalisiert(m2[1])) || /KALIF|OASE/.test(m2[1]), `${k.id}: Lösung ${m2[1]} steht in der Aufgabe`);
      }
    }
  });
}

test('Warm-up W0–W2: Kern-Seed lädt 36 Karten ohne Fehler', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kr-wu-'));
  fs.mkdirSync(path.join(dir, 'warmup'));
  for (const n of [0, 1, 2]) fs.copyFileSync(path.join(S.WURZEL, 'seed', 'warmup', `w${n}.json`), path.join(dir, 'warmup', `w${n}.json`));
  const app = H.makeApp({ seedDir: dir });
  const svc = app.locals.services;
  const u = svc.kata.meta();
  assert.deepEqual(u.welten.map((w) => [w.welt, w.anzahl]), [[0, 12], [1, 12], [2, 12]]);
  assert.equal(svc.kata.liste({}).length, 36);
});
