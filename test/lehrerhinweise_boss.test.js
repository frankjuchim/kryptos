'use strict';
// Plan M8 Task 198: Die Boss-Tabelle („Boss online“) in den Lehrerhinweisen jeder Welt (Materialquelle
// quellen/material/W<n>/lehrerhinweise_W<n>.json) stimmt mit dem Seed überein: alle Pool-ids, Stufe (★), Niveau (wo die
// Tabelle es nennt) und die Spalte „Fallen“ = `fallen` der Seed-Aufgabe („–“ bei leer).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const S = require('./hilfen_spec');

/** Boss-Tabelle einer Lehrerhinweise-Quelle: Tabelle mit ≥ 14 Zeilen, deren erste Zelle eine Boss-id nennt */
function bossTabelle(welt) {
  const d = JSON.parse(fs.readFileSync(path.join(S.WURZEL, 'quellen', 'material', `W${welt}`, `lehrerhinweise_W${welt}.json`), 'utf8'));
  return (d.bloecke || []).find((b) => b.t === 'tabelle' && (b.zeilen || []).length >= 14 && b.zeilen.filter((z) => /B-?\d{2}/.test(String(z[0]))).length >= 14);
}
const idVon = (welt, zelle) => {
  const m = /B-?(\d{2})/.exec(String(zelle));
  return m ? `W${welt}-B-${m[1]}` : null;
};

for (const welt of S.WELTEN) {
  test(`Lehrerhinweise W${welt}: Boss-Tabelle mit Fallen-Spalte wie im Seed`, () => {
    const w = S.seed(welt);
    const t = bossTabelle(welt);
    assert.ok(t, 'Boss-Tabelle gefunden');
    const iFallen = t.kopf.indexOf('Fallen');
    assert.ok(iFallen >= 0, 'Spalte „Fallen“');
    if (Array.isArray(t.breiten)) assert.equal(t.breiten.length, t.kopf.length, 'breiten je Spalte');
    const kopfSpalten = t.kopf.map((k, i) => (/ID|Stufe|Niv/.test(k) ? i : -1)).filter((i) => i >= 0);
    const ids = t.zeilen.map((z) => idVon(welt, z[0]));
    assert.deepEqual(ids, w.boss.pool, 'ids vollständig in Seed-Reihenfolge');
    t.zeilen.forEach((z, r) => {
      const a = w.aufgaben.find((x) => x.id === ids[r]);
      const kopfText = kopfSpalten.map((i) => String(z[i])).join(' ');
      assert.equal((kopfText.match(/★/g) || []).length, a.stufe, `${a.id}: Stufe`);
      const niveau = /\beA\b/.test(kopfText) ? 'eA' : /\bkern\b/.test(kopfText) ? 'kern' : null;
      if (niveau) assert.equal(niveau, a.niveau || 'kern', `${a.id}: Niveau`);
      assert.equal(z[iFallen], a.fallen && a.fallen.length ? a.fallen.join(', ') : '–', `${a.id}: Fallen`);
    });
  });
}
