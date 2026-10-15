'use strict';
// Prüflinge und Werkzeug-Modelle (Plan M11 Task 241, E201, E212, E224–E226): Angaben aus den Aufgaben, Lösungskriterium,
// Modelle für alle rechnenden Reiter (oder Grund in OHNE_RECHNUNG) und Gleichlauf Modell ↔ echtes Modul.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const P = require('../werkzeuge/krypto/prueflinge');
const M = require('../werkzeuge/krypto/werkzeug_modelle');
const { WERKZEUGE } = require('../src/krypto/werkzeuge');
const { oeffne, Krypto: K } = require('./hilfen_labor');
const BEDIENER = require('./hilfen_werkzeug_bediener');

const ALLE = P.prueflinge({ papier: false });
const pr = (id) => ALLE.find((p) => p.id === id);
const A = (id) => P.angaben(pr(id));

test('angaben_aus_aufgaben', () => {
  assert.deepEqual(A('W0-L2-02').texte, ['IMOTQ']);
  assert.ok(A('W0-L2-02').schluessel.includes('k=12'));
  assert.ok(A('W2-L1-02').texte.includes('GONDEL') && A('W2-L1-02').schluessel.includes('BOTE'));
  assert.deepEqual([...A('W4-L2-04').zahlen].sort((a, b) => a - b), [3, 5, 17]);
  assert.deepEqual(A('W3-L1-02').bits, ['01100011', '11010101']);
  // weitere Quellen: Fleißner-Löcher, Ring t, Warm-up, Boss, Gast
  assert.ok(A('W0-L1-07').schluessel.includes('loch=1,3;2,2;3,1;4,4'));
  assert.ok(A('W6-L2-04').schluessel.includes('t=5') && A('W6-L2-04').schluessel.includes('UHR'));
  for (const q of ['lab', 'archivfund', 'boss', 'gast', 'warmup']) assert.ok(ALLE.some((p) => p.quelle === q), q);
});

test('loesungskriterium', () => {
  const p = (id) => ALLE.find((x) => x.id === id);
  assert.equal(P.istVerrat([{ art: 'text', wert: 'WACHE' }], p('W0-L2-02')).verrat, true);
  assert.equal(P.istVerrat([{ art: 'text', wert: 'WACH' }], p('W0-L2-02')).verrat, false);
  assert.equal(P.istVerrat([{ art: 'zahl', wert: '13', etikett: 'd' }], p('W4-L2-04')).verrat, true);
  assert.equal(P.istVerrat([{ art: 'zahl', wert: '13' }], p('W4-L2-04')).verrat, false);
  assert.equal(P.istVerrat([{ art: 'text', wert: 'HAFFK' }], p('W5-L1-07')).verrat, true); // Prädikat hash-ziel
  assert.equal(P.istVerrat([{ art: 'text', wert: 'HAFEN' }], p('W5-L1-07')).verrat, false, 'gegebene Nachricht');
  assert.equal(P.istVerrat([{ art: 'text', wert: 'eiz' }], p('W0-L2-01')).verrat, false);
  assert.equal(P.istVerrat([{ art: 'text', wert: 'ezi' }], p('W0-L2-01')).verrat, true, '3 Zeichen als ganzes Wort');
  assert.equal(P.istVerrat([{ art: 'bits', wert: '1011 0110' }], p('W3-L1-02')).verrat, true);
  assert.equal(P.istVerrat([{ art: 'folge', werte: [6, 2, 12, 4] }], p('W4-L1-06')).verrat, true, 'Wertetabelle');
  assert.equal(P.istVerrat([{ art: 'folge', werte: [6, 2] }], p('W4-L1-06')).verrat, false);
});

test('modelle_decken_alle_reiter_ab', () => {
  const fehlt = [];
  for (const w of WERKZEUGE) {
    const liste = w.reiter.length ? w.reiter.map((r) => `${w.id}.${r}`) : [w.id];
    for (const wr of liste) {
      const grund = M.OHNE_RECHNUNG[wr];
      if (M.MODELLE[wr]) continue;
      if (typeof grund === 'string' && grund.length >= 10) continue;
      fehlt.push(wr);
    }
  }
  if (!M.MODELLE.baukasten && !(M.OHNE_RECHNUNG.baukasten || '').length) fehlt.push('baukasten');
  assert.deepEqual(fehlt, []);
  for (const wr of Object.keys(M.MODELLE)) assert.ok(!M.OHNE_RECHNUNG[wr], `${wr}: Modell und OHNE_RECHNUNG zugleich`);
});

test('modelle_liefern_zustaende_ohne_fehler', () => {
  for (const p of ALLE.filter((x) => ['W0-L2-02', 'W2-L1-02', 'W4-L2-04', 'W3-L1-02', 'W5-L1-02', 'W3-L5-01'].includes(x.id))) {
    const a = P.angaben(p);
    for (const [wr, m] of Object.entries(M.MODELLE)) {
      for (const z of m.zustaende(a)) {
        assert.ok(['allgemein', 'angaben', 'katalog'].includes(z.art), `${wr}: art`);
        assert.ok(z.eingaben && Array.isArray(z.ausgaben), `${wr}: eingaben/ausgaben`);
      }
    }
  }
});

test('modell_gleich_werkzeug', () => {
  // je Reiter mit Bediener: die Modell-Ausgaben für das Beispiel und feste Eingaben stehen im Text des echten Moduls
  // (Lehrkraft-Umgebung: kein Erkenner, alles frei)
  let geprueft = 0;
  for (const [wr, faelle] of Object.entries(BEDIENER.FAELLE)) {
    const m = M.MODELLE[wr];
    assert.ok(m, `${wr}: Modell fehlt`);
    for (const fall of faelle) {
      const z = [...m.zustaende(fall.angaben)].find((x) => fall.passt(x));
      assert.ok(z, `${wr}: kein Zustand für ${JSON.stringify(fall.angaben)}`);
      const w = BEDIENER.bediene(wr, z, { umgebung: { rolle: 'lehrkraft' } });
      const text = K.normalisieren(w.k.text(w.flaeche));
      for (const a of z.ausgaben.filter((x) => (x.art === 'text' || x.art === 'bits') && !x.nach)) {
        const soll = a.art === 'bits' ? a.wert.replace(/[^01]/g, '') : K.normalisieren(a.wert);
        if (!soll) continue;
        const ist = a.art === 'bits' ? text.replace(/[^01]/g, '') : text;
        // Bits zeigt das Modul auch als Hex (Ergebnis der Bit-Lupe)
        const hex = a.art === 'bits' && soll.length % 8 === 0 ? K.hex(Array.from({ length: soll.length / 8 }, (_, i) => K.bitsZuByte(soll.slice(8 * i, 8 * i + 8)))) : null;
        assert.ok(ist.includes(soll) || (hex && text.includes(hex)), `${wr} (${z.bedienung}): „${soll.slice(0, 30)}“ fehlt im Modul`);
      }
      geprueft++;
    }
  }
  assert.ok(geprueft >= 20, `geprüft: ${geprueft}`);
});

test('modell_mini_enigma_rechnet_w3_l5', () => {
  const a = { texte: ['FADE'], schluessel: ['st=A'], zahlen: [], bits: [] };
  const z = [...M.MODELLE['runden.enigma'].zustaende(a)].find((x) => x.eingaben.schluessel.includes('st=A') && x.bedienung.includes('ver'));
  assert.ok(z.ausgaben.some((x) => K.normalisieren(x.wert) === 'CHEA'), 'fade → CHEA (Befund)');
  assert.equal(z.ausAngaben, true);
});
