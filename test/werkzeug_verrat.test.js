'use strict';
// K11 (Plan M11 Task 242, E211, E224, E225): Jede Bedienung eines Werkzeugs im freien Modus, die nur Angaben eines
// Prüflings einsetzt und eine Lösung ausgäbe, erkennt der Erkenner – das Werkzeug wechselt dann in den geführten Modus
// bzw. zeigt „nicht verfügbar“. Ausnahme nur W0-L2-04 (L60, Brute-Force-Liste erlaubt).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const P = require('../werkzeuge/krypto/prueflinge');
const M = require('../werkzeuge/krypto/werkzeug_modelle');
const B = require('../werkzeuge/krypto/erkenner_bauen');
const E = require('../public/static/js/krypto/labor/erkenner.js');
const Krypto = require('../public/static/js/shared/krypto.js');

const DATEN = path.join(__dirname, '..', 'public', 'static', 'js', 'krypto', 'labor', 'erkenner');
for (const d of fs.readdirSync(DATEN).filter((f) => f.endsWith('.js'))) new Function('KRErkenner', fs.readFileSync(path.join(DATEN, d), 'utf8'))(E);
const S = { rolle: 'schueler' };
// Katalog-Zustände mit Verrat, die erst ein Umbau behebt (Task 246 leert die Liste)
const UMBAU_OFFEN = ['W1-L1-04', 'W6-L1-09'];

let lauf = null;
/** einmal alle Prüflinge × Modelle × Zustände durchspielen */
function durchlauf() {
  if (lauf) return lauf;
  const verrat = [];
  const katalog = [];
  for (const p of P.prueflinge()) {
    const A = P.angaben(p);
    for (const [wr, m] of Object.entries(M.MODELLE)) {
      for (const z of m.zustaende(A)) {
        if (z.art === 'allgemein' || !B.nutztAngaben(z)) continue;
        if (P.AUSNAHMEN.some((a) => a.aufgabe === p.id && a.wr === wr)) continue;
        if (!P.istVerrat(z.ausgaben, p).verrat) continue;
        if (z.art === 'katalog') katalog.push(p.id);
        else verrat.push({ p, wr, z });
      }
    }
  }
  lauf = { verrat, katalog };
  return lauf;
}

test('k11_jeder_verrat_wird_erkannt', () => {
  const { verrat } = durchlauf();
  assert.ok(verrat.length > 500, `Verrat-Zustände: ${verrat.length}`);
  const fehlt = [];
  for (const { p, wr, z } of verrat) {
    if (!E.erkannt(wr, B.normalisiere(wr, z.eingaben), S)) fehlt.push(`${p.id}: ${wr} ${z.bedienung} gibt frei die Lösung aus`);
  }
  assert.deepEqual(fehlt.slice(0, 20), []);
});

test('k11_nicht_abdeckbar', () => {
  const { katalog } = durchlauf();
  assert.deepEqual([...new Set(katalog)].filter((id) => !UMBAU_OFFEN.includes(id)), []);
});

test('k11_hand', () => {
  for (const h of B.HAND) {
    assert.ok(h.grund && h.grund.length >= 10, `${h.aufgabe}: Grund`);
    assert.ok(E.erkannt(h.wr, { texte: [], schluessel: [], zahlen: [], bits: [], ...h.eingaben }, S), `${h.aufgabe} ${h.wr}`);
  }
  for (const id of ['W4-L3-07', 'W6-L1-03', 'W6-L1-04', 'W6-L1-06']) assert.ok(B.HAND.some((h) => h.aufgabe === id), id);
});

test('k11_erwuenscht_frei', () => {
  const pl = P.prueflinge({ papier: false });
  const frei = [['W1-A-01', ['substitution', 'haeufigkeit.histogramm']], ['W1-L1-07', ['substitution', 'haeufigkeit.histogramm']], ['W2-L2-06', ['haeufigkeit.histogramm']], ['W5-L1-07', ['hash.kollision']]];
  for (const [id, liste] of frei) {
    const A = P.angaben(pl.find((p) => p.id === id));
    for (const wr of liste) assert.equal(E.erkannt(wr, { texte: A.texte, schluessel: A.schluessel, zahlen: A.zahlen }, S), false, `${id} in ${wr}`);
  }
});

test('k11_ausnahmen_begruendet', () => {
  assert.equal(P.AUSNAHMEN.length, 1);
  const [a] = P.AUSNAHMEN;
  assert.equal(a.aufgabe, 'W0-L2-04');
  assert.equal(a.wr, 'scheibe.alle');
  assert.match(a.grund, /L60/);
});

test('k11_boss_nur_als_kennung', () => {
  // keine Boss-Angabe (Eingabe eines chiffre-Teils, ≥ 6 Zeichen) im Klartext in public/static/**
  const dateien = [];
  (function lauf(d) { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) lauf(p); else if (/\.(js|html|css|json)$/.test(f.name)) dateien.push(p); } })(path.join(__dirname, '..', 'public', 'static'));
  const inhalt = dateien.map((d) => [d, fs.readFileSync(d, 'utf8')]);
  const funde = [];
  for (const p of P.prueflinge({ papier: false }).filter((x) => x.quelle === 'boss')) {
    for (const ia of p.interaktionen || []) {
      if (!ia || typeof ia.eingabe !== 'string' || Krypto.normalisieren(ia.eingabe).length < 6) continue;
      for (const [d, src] of inhalt) if (src.includes(ia.eingabe)) funde.push(`${p.id} in ${path.basename(d)}`);
    }
  }
  assert.deepEqual(funde, []);
});
