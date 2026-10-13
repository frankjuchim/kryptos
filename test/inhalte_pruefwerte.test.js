'use strict';
// Abgleich Prüfwerte (§12 der Welt-Specs, quellen/pruefwerte/W<n>.json) ↔ Seed (Plan M5 Task 73, Review Focus 2):
// Jeder nachgerechnete Wert aus Lab, Boss-Pool, Archivfund und Warm-up findet sich in der zugehörigen Seed-Aufgabe –
// sobald deren Abschnitt in S.UMFANG steht. Einträge einer Prüfwert-Gruppe (aufgabe + gapsFeld bzw. gapsFelder, E44)
// müssen exakt der Hauptlösung des Felds (bzw. Feld i ↔ Wert i) entsprechen.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const S = require('./hilfen_spec');

const ARTEN = ['lab', 'bosspool', 'archivfund', 'warmup'];
const AUFGABEN_ID = /(WU-W\d-\d{2}|W\d-(?:L\d{1,2}-\d{2}|K\d-\d{2}|B-\d{2}|AF))(?![\d-])/;

const pruefwerte = (welt) => JSON.parse(fs.readFileSync(path.join(S.WURZEL, 'quellen', 'pruefwerte', `W${welt}.json`), 'utf8')).werte;

/** Spec-id des Eintrags: aus `ort`, sonst aus der genannten Spec-Zeile („Z. 1104“), Archivfund ohne id → W<n>-AF */
function specIdVon(welt, e) {
  const m = AUFGABEN_ID.exec(e.ort || '');
  if (m) return m[1];
  const z = /SPEC_Kryptos_W\d_[A-Za-z]+\.md Z\. (\d+)/.exec(e.ort || '');
  if (z) {
    const zeile = S.specZeilen(welt)[Number(z[1]) - 1] || '';
    const n = /^\|\s*(W\d-(?:L\d{1,2}-\d{2}|K\d-\d{2}|B-\d{2}|AF)|WU-W\d-\d{2})\s*\|/.exec(zeile);
    if (n) return n[1];
  }
  if (e.art === 'archivfund') return `W${welt}-AF`;
  return null;
}

/** erwartet als Text (Listen und Objekte verbunden) */
const alsText = (x) => (Array.isArray(x) ? x.map(alsText).join(' ') : x && typeof x === 'object' ? Object.values(x).map(alsText).join(' ') : String(x));
const zahl = (x) => {
  const n = Number(String(x).trim().replace(',', '.'));
  return Number.isFinite(n) && String(x).trim() !== '' ? n : null;
};

test('Prüfwerte: jeder Eintrag (lab, bosspool, archivfund, warmup) ist einer Spec-Aufgabe zugeordnet', () => {
  for (const welt of [0, 1, 2]) {
    const ids = new Set(S.specAufgaben(welt).map((a) => a.specId));
    ids.add(`W${welt}-AF`);
    for (const e of pruefwerte(welt).filter((x) => ARTEN.includes(x.art))) {
      const sid = specIdVon(welt, e);
      assert.ok(sid, `${e.id}: keine Aufgaben-id in „${e.ort}“`);
      assert.ok(ids.has(sid), `${e.id}: ${sid} steht nicht in der Spec`);
    }
  }
});

for (const welt of [0, 1, 2]) {
  test(`Welt ${welt}: Prüfwerte der Abschnitte in UMFANG stehen im Seed`, (t) => {
    const umfang = new Set(S.UMFANG[welt]);
    if (!umfang.size) return t.skip('UMFANG leer (noch kein Abschnitt eingetragen)');
    const w = S.seed(welt);
    const wu = S.warmup(welt);
    for (const e of pruefwerte(welt).filter((x) => ARTEN.includes(x.art))) {
      const sid = specIdVon(welt, e);
      const id = S.technischeId(sid);
      if (!umfang.has(S.abschnittVon(id))) continue;
      const quelle = e.art === 'warmup' ? wu && (wu.karten || []).find((k) => k.id === id) : w && (w.aufgaben || []).find((a) => a.id === id);
      assert.ok(quelle, `${e.id}: ${id} fehlt im Seed`);
      if (e.aufgabe !== undefined && typeof e.gapsFeld === 'string') {
        // Prüfwert-Gruppe (E44): exakt die Hauptlösung des Felds
        assert.equal(e.aufgabe, id, `${e.id}: aufgabe ${e.aufgabe} ≠ ${id}`);
        const lo = S.teile(quelle).map((x) => x.loesung).find((x) => x && Object.hasOwn(x, e.gapsFeld));
        assert.ok(lo, `${e.id}: Feld ${e.gapsFeld} fehlt in der Lösung von ${id}`);
        const haupt = [].concat(lo[e.gapsFeld])[0];
        const erw = Array.isArray(e.erwartet) && e.erwartet.length === 1 ? e.erwartet[0] : e.erwartet;
        if (zahl(erw) !== null && zahl(haupt) !== null) assert.equal(zahl(haupt), zahl(erw), `${e.id}: ${id}.${e.gapsFeld}`);
        else assert.equal(S.normalisiert(haupt), S.normalisiert(alsText(erw)), `${e.id}: ${id}.${e.gapsFeld}`);
        continue;
      }
      if (e.aufgabe !== undefined && Array.isArray(e.gapsFelder)) {
        // Prüfwert-Gruppe mit mehreren Feldern (E44): Element i (Liste) bzw. Zeichen i (Zeichenkette) = Hauptlösung von Feld i
        assert.equal(e.aufgabe, id, `${e.id}: aufgabe ${e.aufgabe} ≠ ${id}`);
        const werte = Array.isArray(e.erwartet) ? e.erwartet : [...S.normalisiert(e.erwartet)];
        assert.equal(werte.length, e.gapsFelder.length, `${e.id}: Anzahl Werte ↔ gapsFelder`);
        e.gapsFelder.forEach((f, i) => {
          const lo = S.teile(quelle).map((x) => x.loesung).find((x) => x && Object.hasOwn(x, f));
          assert.ok(lo, `${e.id}: Feld ${f} fehlt in der Lösung von ${id}`);
          const haupt = [].concat(lo[f])[0];
          if (zahl(werte[i]) !== null && zahl(haupt) !== null) assert.equal(zahl(haupt), zahl(werte[i]), `${e.id}: ${id}.${f}`);
          else assert.equal(S.normalisiert(haupt), S.normalisiert(alsText(werte[i])), `${e.id}: ${id}.${f}`);
        });
        continue;
      }
      const soll = S.normalisiert(alsText(e.erwartet));
      assert.ok(S.normalisiert(S.texte(quelle)).includes(soll), `${e.id}: „${alsText(e.erwartet)}“ (${e.verfahren}) kommt in ${id} nicht vor`);
    }
  });
}
