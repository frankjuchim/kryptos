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
// Katalog-Zustände mit Verrat, die erst ein Umbau behebt – nach Task 246 (D18) leer
const UMBAU_OFFEN = [];

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

test('schaubild_rollen_getauscht (E205, D18)', () => {
  // Der Simulator zeigt nur „Alice signiert, Bob prüft“ bzw. „Bob sendet seinen Schlüssel, Alice verschlüsselt“ –
  // die Schaubild-Aufgaben laufen mit getauschten Rollen, die Lösungen nennen den jeweils anderen Inhaber.
  const welt = (n) => JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'seed', 'welten', `welt${n}.json`), 'utf8')).aufgaben;
  const a = (n, id) => welt(n).find((x) => x.id === id);
  const sig = a(5, 'W5-L2-04');
  assert.deepEqual(sig.loesung.l2, [{ art: 'privat', inhaber: 'B' }]);
  assert.deepEqual(sig.loesung.l3, [{ art: 'oeffentlich', inhaber: 'B' }]);
  assert.equal(sig.inhalt[1].schritte[0].von, 'B', 'Bob signiert');
  const siegel = a(6, 'W6-L2-09');
  assert.deepEqual(siegel.loesung.la, [{ art: 'privat', inhaber: 'B' }]);
  assert.deepEqual(siegel.loesung.lb, [{ art: 'oeffentlich', inhaber: 'B' }]);
  const mitm = a(5, 'W5-L3-04');
  assert.equal(mitm.inhalt[1].schritte[0].von, 'A', 'Alice sendet ihren öffentlichen Schlüssel');
  assert.deepEqual(mitm.loesung.l4, [{ art: 'oeffentlich', inhaber: 'A' }]);
  assert.match(mitm.inhalt[0].md, /Bob fragt Alices öffentlichen Schlüssel an/);
  const src = fs.readFileSync(path.join(__dirname, '..', 'public', 'static', 'js', 'krypto', 'labor', 'signatur.js'), 'utf8');
  assert.match(src, /Alice signiert mit ihrem privaten Schlüssel/);
  assert.match(src, /Bob sendet seinen öffentlichen Schlüssel/);
});

test('umbau_werte (D18): W1-L1-04 b) Leistung für ein Jahr → e = 19, W6-L1-09 a) 26 · 25 · 24 = 15 600', () => {
  const welt = (n) => JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'seed', 'welten', `welt${n}.json`), 'utf8')).aufgaben;
  const w1 = welt(1).find((x) => x.id === 'W1-L1-04');
  // Review nach M11: umgekehrt gefragt – 26! : 3,2 · 10⁷ s ≈ 1,26 · 10¹⁹ /s
  assert.match(w1.interaktion[1].frage, /in einem Jahr/);
  assert.deepEqual(w1.loesung[1], { e: ['19'] });
  const log = Krypto.schluesselraum('substitution').log10 - Math.log10(3.2e7);
  assert.equal(Math.floor(log), 19);
  assert.equal(Math.round(10 ** (log - 19) * 10) / 10, 1.3);
  assert.equal(Krypto.suchdauer(Krypto.schluesselraum('substitution').log10, 1.3e19).text, '≈ 1 Jahr');
  const w6 = welt(6).find((x) => x.id === 'W6-L1-09');
  assert.match(w6.inhalt[0].md, /drei verschiedenen Buchstaben/);
  assert.deepEqual(w6.loesung.a, ['15600', '15.600']);
  assert.equal(26 * 25 * 24, 15600);
});

// Review-Fund 4 (E209): Reiter ohne geführten Modus sind mit jedem Angaben-Text nicht verfügbar – unabhängig davon, ob
// das Modell gerade einen Verrat findet (W2-A-01: Original-Geheimtext in Verschiebung und Korrektur)
test('k11_e209_alle_angaben_texte', () => {
  const fehlt = [];
  for (const p of P.prueflinge()) {
    for (const t of B.e209Texte(P.angaben(p))) {
      for (const wr of B.E209_TEXT) {
        if (P.AUSNAHMEN.some((a) => a.aufgabe === p.id && a.wr === wr)) continue;
        if (!E.erkannt(wr, { texte: [t] }, S)) fehlt.push(`${p.id} ${wr} ${t.slice(0, 30)}`);
      }
    }
  }
  assert.deepEqual(fehlt.slice(0, 15), [], `${fehlt.length} unerkannt`);
  const w2 = P.angaben(P.prueflinge().find((p) => p.id === 'W2-A-01')).texte.find((t) => t.length > 50);
  for (const wr of ['vigenere.verschiebung', 'vigenere.korrektur']) assert.ok(E.erkannt(wr, { texte: [w2] }, S), `W2-A-01 in ${wr}`);
});
