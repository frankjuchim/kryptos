'use strict';
// Abgleich Spec-Tabellen ↔ Seed (Plan M5 Task 73, Review Focus 3): Für jeden Abschnitt in S.UMFANG muss jede
// Aufgabe der Welt-Spec im Seed stehen – mit Titel, Stufe, Niveau, Kategorie, Fallen, Interaktionsarten und
// choice-Lösungen wie in der Spec – und der Level-Kopf muss zur Spec und zu den Entscheidungen E39/E63 passen.
// Bis die Inhalts-Tasks ihre Abschnitte eintragen, prüft die Datei nur den Spec-Parser.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const S = require('./hilfen_spec');
const { WELT_PLAN, LAB_KATEGORIE_NAMEN } = require('../src/krypto/fach');

const summe = (o) => Object.values(o || {}).reduce((a, b) => a + b, 0);
// werkzeug: ids vergleichen (M6 E70 – Einträge dürfen { id, voreinstellung } sein)
const alsListe = (w) => (w === undefined || w === null ? [] : Array.isArray(w) ? w : [w]).map((e) => (e && typeof e === 'object' ? e.id : e));

test('Spec-Parser: Aufgaben je Level, Boss-Pool, Archivfund und Warm-up wie WELT_PLAN', () => {
  for (const welt of S.WELTEN) {
    const plan = WELT_PLAN.find((p) => p.nr === welt);
    const aufgaben = S.specAufgaben(welt);
    const levels = S.specLevels(welt);
    assert.deepEqual(levels.map((l) => l.nr), plan.levels.map((l) => l.id), `W${welt}: Level-Nummern`);
    for (const [i, l] of levels.entries()) {
      const p = plan.levels[i];
      assert.equal(l.niveau, p.niveau, `W${welt} ${l.nr}: Niveau`);
      assert.equal(l.titel, p.titel.replace(/^Kür: /, ''), `W${welt} ${l.nr}: Titel`);
      assert.equal(aufgaben.filter((a) => a.abschnitt === l.id).length, summe(p.aufgaben), `W${welt} ${l.nr}: Aufgabenzahl`);
      assert.ok(l.merkkasten && l.merkkasten.length >= 40, `W${welt} ${l.nr}: Merkkasten`);
      assert.ok(l.rolle, `W${welt} ${l.nr}: Rolle (E39)`);
    }
    assert.equal(aufgaben.filter((a) => a.art === 'boss').length, summe(plan.boss.pool), `W${welt}: Boss-Pool`);
    assert.equal(aufgaben.filter((a) => a.art === 'warmup').length, 12, `W${welt}: Warm-up`);
    const af = aufgaben.filter((a) => a.art === 'archivfund');
    assert.equal(af.length, 1, `W${welt}: Archivfund`);
    assert.equal(af[0].id, `W${welt}-A-01`);
    assert.ok(af[0].titel, `W${welt}: Archivfund-Titel aus §0.1`);
    // Stufen und Niveaus lesbar
    for (const a of aufgaben.filter((x) => x.art === 'lab' || x.art === 'boss')) {
      assert.ok([1, 2, 3].includes(a.stufe), `${a.specId}: Stufe`);
      assert.ok(['kern', 'eA', 'ergaenzung', 'kuer'].includes(a.niveau), `${a.specId}: Niveau ${a.niveau}`);
      assert.ok(Object.hasOwn(LAB_KATEGORIE_NAMEN, a.kategorie), `${a.specId}: Kategorie ${a.kategorie}`);
      assert.ok(S.kindsErwartet(a.interaktion, a.id).length >= 1, `${a.specId}: Interaktion „${a.interaktion}“ nicht abbildbar`);
    }
    // choice-Lösungen lesbar (E62/E64; M8 E130: ohne Kennung über den Text, E131: feste Lösungen)
    for (const a of aufgaben.filter((x) => x.interaktion && S.kindsErwartet(x.interaktion, x.id).includes('choice'))) {
      if (S.CHOICE_OHNE_KENNUNG[a.id]) {
        const lo = S.normalisiert(a.loesung);
        for (const t of Object.values(S.CHOICE_OHNE_KENNUNG[a.id]).flat()) assert.ok(lo.includes(S.normalisiert(t)), `${a.specId}: „${t}“ steht nicht in der Spec-Lösung`);
        continue;
      }
      if (S.CHOICE_FEST[a.id]) continue;
      const t = S.loesungsTeile(String(a.loesung));
      const gelesen = t ? Object.values(t).map(S.kennungen).filter(Boolean) : [S.kennungen(a.loesung)].filter(Boolean);
      assert.ok(gelesen.length, `${a.specId}: choice-Lösung „${a.loesung}“ nicht lesbar`);
    }
  }
});

test('Spec-Parser W3–W6 (Plan M8 Task 171): Zeilenzahlen, ids (E120), Niveau-/Merkkasten-Varianten, Tipps, Mapping', () => {
  const zahl = (welt, art) => S.specAufgaben(welt).filter((a) => a.art === art).length;
  assert.deepEqual([3, 4, 5, 6].map((w) => zahl(w, 'lab')), [35, 23, 23, 30], 'Lab-Zeilen (gezählt 14.10.2026)');
  assert.deepEqual([3, 4, 5, 6].map((w) => zahl(w, 'boss')), [15, 15, 15, 15], 'Boss-Zeilen');
  assert.deepEqual([3, 4, 5, 6].map((w) => zahl(w, 'warmup')), [12, 12, 12, 12], 'Warm-up-Zeilen');
  assert.equal(S.technischeId('W3-L1-00'), 'W3-A-01');
  assert.equal(S.technischeId('W3-K2-04'), 'W3-L5-04');
  assert.equal(S.technischeId('W4-K3-02'), 'W4-L3-02');
  assert.deepEqual(S.specLevels(3).map((l) => l.id), ['W3-L1', 'W3-L2', 'W3-L3', 'W3-L4', 'W3-L5']);
  assert.deepEqual(S.specLevels(4).map((l) => l.id), ['W4-L1', 'W4-L2', 'W4-L3']);
  assert.equal(S.specLevels(3)[4].titel, 'Die Enigma', 'Titel ohne „(vereinfacht)“');
  assert.deepEqual(S.specLevels(6).map((l) => l.ds), [[17], [17], [17, 18]], 'DS_FEST (E146)');
  assert.deepEqual([3, 4, 5, 6].map((w) => S.specAufgaben(w).find((a) => a.art === 'archivfund').titel),
    ['Der Lochstreifen von 1917', 'Der Brief mit dem verlorenen Schlüssel', 'Die gefälschte Website', 'Eves Chiffre']);
  assert.ok(S.specLevels(6)[0].merkkasten.startsWith('Im Abitur gehen Punkte selten verloren'), 'Merkkasten als eingerückter Fließtext (W6)');
  assert.deepEqual(S.tippsAus('T1: 8 · 7 = 56. T2: Der letzte Rest.'), ['8 · 7 = 56.', 'Der letzte Rest.']);
  assert.deepEqual(S.tippsAus('1: Lesereihenfolge 0, 3. / 2: A bedeutet 0.'), ['Lesereihenfolge 0, 3.', 'A bedeutet 0.']);
  assert.equal(S.specAufgaben(6).find((a) => a.id === 'W6-L2-10').niveau, 'kern', 'E132: „kern (D: eA)“ → kern');
  assert.ok(S.specAufgaben(6).find((a) => a.id === 'W6-L2-06').inhalt.includes('\nA) '), '<br> → Zeilenumbruch');
  assert.deepEqual(S.kindsErwartet('zuordnung', 'W4-L2-03'), ['match'], 'E127');
  assert.deepEqual(S.kindsErwartet('gaps (Freitext mit Hash-Prüfer)', 'W5-L1-07'), ['hash-ziel'], 'E126');
  assert.deepEqual(S.kindsErwartet('choice + gaps (Begründung, lines)', 'W3-L2-08'), ['choice'], 'E129');
  assert.deepEqual(S.kindsErwartet('bits-rechnen', 'W3-L1-04'), ['bits-rechnen', 'gaps'], 'E128');
  assert.deepEqual(S.kindsErwartet('`bits-rechnen` (Matrix)'), ['bits-rechnen']);
  assert.deepEqual(S.kindsErwartet(S.specAufgaben(3).find((a) => a.art === 'archivfund').interaktion, 'W3-A-01'), ['bits-rechnen', 'gaps'], 'Archivfund W3 aus dem Absatz');
  assert.deepEqual(S.kindsErwartet(null, 'W5-A-01'), ['gaps', 'choice'], 'E134');
  assert.deepEqual(S.choiceLoesung({ loesung: '(1) w (2) w (3) f (4) f (5) w' }), ['1', '2', '5'], 'w/f je Aussage (E130)');
  assert.deepEqual(S.choiceLoesung({ loesung: 'a) B b) A c) B' }, 2), ['b'], 'je Stufe');
  assert.deepEqual(S.choiceLoesung({ loesung: '**(B)**' }), ['b'], 'fett');
  assert.deepEqual(S.choiceLoesung({ loesung: 'korrekt: (1), (2) ✔' }), ['1', '2']);
  assert.deepEqual(S.choiceText({ id: 'W4-L2-02' }), ['Bobs öffentlicher Schlüssel']);
});

test('Spec-Parser: id-Abbildung (E38) und Interaktions-Mapping (E40, E64, E65)', () => {
  assert.equal(S.technischeId('W2-L21-03'), 'W2-L1-03');
  assert.equal(S.technischeId('W2-K1-02'), 'W2-L5-02');
  assert.equal(S.technischeId('W0-AF'), 'W0-A-01');
  assert.equal(S.technischeId('W2-A'), 'W2-A-01');
  assert.equal(S.technischeId('W0-B-07'), 'W0-B-07');
  assert.equal(S.abschnittVon('W2-L5-02'), 'W2-L5');
  assert.equal(S.abschnittVon('WU-W1-03'), 'WU-W1');
  assert.deepEqual(S.kindsErwartet('`chiffre` + `matrix`'), ['chiffre']);
  assert.deepEqual(S.kindsErwartet('mehrteilig: `gaps` + `choice`'), ['gaps', 'choice']);
  assert.deepEqual(S.kindsErwartet('`quadrat` (ergänzen) + `chiffre`'), ['gaps', 'chiffre']);
  assert.deepEqual(S.kindsErwartet('`grid` (4 × 4)', 'W0-L1-07'), ['chiffre']);
  assert.deepEqual(S.kindsErwartet('grid', 'W2-L2-04'), ['gaps']);
  assert.deepEqual(S.kindsErwartet('mehrteilig: `gaps` + `choice`', 'W1-L1-05'), ['gaps']);
  assert.deepEqual(S.kindsErwartet('chiffre + quadrat', 'W2-L1-05'), ['gaps', 'chiffre']);
  assert.deepEqual(S.choiceLoesung({ loesung: 'a) u ∈ {2, 3} ✔ nachgerechnet; b) (B)' }, 1), ['b']);
  assert.deepEqual(S.choiceLoesung({ loesung: 'A, B, D ✔ nachgerechnet (…)' }), ['a', 'b', 'd']);
  assert.deepEqual(S.choiceLoesung({ loesung: '(1), (3), (5)' }), ['1', '3', '5']);
  assert.deepEqual(S.choiceLoesung({ loesung: 'a) `X`; b) k = 0; c) nein – Caesar ∘ Caesar' }, 2), ['nein']);
});

/** Seed-Aufgabe, Level und Fundort einer Spec-Aufgabe prüfen */
function pruefeAufgabe(welt, w, spec) {
  const a = (w.aufgaben || []).find((x) => x.id === spec.id);
  assert.ok(a, `${spec.id} (${spec.specId}) fehlt im Seed`);
  const o = `${spec.id} (${spec.specId})`;
  let levelNiveau = null;
  if (spec.art === 'lab') {
    const l = (w.levels || []).find((x) => x.id === spec.abschnitt);
    assert.ok(l && Array.isArray(l.aufgaben) && l.aufgaben.includes(spec.id), `${o} gehört zu Level ${spec.abschnitt}`);
    levelNiveau = l.niveau;
    assert.equal(a.titel, spec.titel, `${o}: Titel`);
  } else if (spec.art === 'boss') {
    assert.ok(w.boss && Array.isArray(w.boss.pool) && w.boss.pool.includes(spec.id), `${o} gehört zum Boss-Pool`);
    assert.equal(a.titel, LAB_KATEGORIE_NAMEN[spec.kategorie], `${o}: Boss-Titel = Kategorie-Name (E53)`);
  } else if (spec.art === 'archivfund') {
    assert.ok(w.archivfund && w.archivfund.aufgabe === spec.id, `${o} ist der Archivfund`);
    assert.equal(w.archivfund.titel, spec.titel, `${o}: Archivfund-Titel`);
    assert.equal(a.titel, spec.titel, `${o}: Titel`);
  }
  if (spec.stufe) assert.equal(a.stufe, spec.stufe, `${o}: Stufe`);
  const niveau = a.niveau !== undefined ? a.niveau : levelNiveau || 'kern';
  if (spec.niveau) assert.equal(niveau, spec.niveau, `${o}: Niveau`);
  if (spec.kategorie) assert.equal(a.kategorie, spec.kategorie, `${o}: Kategorie`);
  const fallen = new Set(a.fallen || []);
  if (spec.art === 'boss') for (const p of spec.fallen) assert.ok(fallen.has(p), `${o}: Falle ${p} aus der Erklärung (E53)`);
  else if (spec.art === 'lab') assert.deepEqual([...fallen].sort(), [...spec.fallen].sort(), `${o}: Fallen`);
  if (spec.interaktion || S.TEILE_ERGAENZT[spec.id]) assert.deepEqual(S.kindsSeed(a), S.kindsErwartet(spec.interaktion, spec.id), `${o}: Interaktionsarten zu „${spec.interaktion}“`);
  S.teile(a).forEach(({ interaktion: ia, loesung: lo }, i) => {
    if (!ia || ia.kind !== 'choice') return;
    if (S.CHOICE_OHNE_KENNUNG[spec.id]) {
      // M8 E130: Optionen ohne Kennung – die richtigen Optionen tragen die Lösungstexte
      const texte = (ia.optionen || []).filter((op) => ((lo && lo.richtig) || []).includes(op.id)).map((op) => S.normalisiert(op.md ?? op.text)).sort();
      assert.deepEqual(texte, (S.choiceText(spec, i) || []).map(S.normalisiert).sort(), `${o}: choice-Lösung über den Optionstext (E130)`);
      return;
    }
    const soll = S.choiceLoesung(spec, i);
    assert.ok(soll, `${o}: Spec-Lösung des choice-Teils ${i} nicht lesbar`);
    assert.deepEqual([...((lo && lo.richtig) || [])].sort(), [...soll].sort(), `${o}: choice-Lösung (E62)`);
    // „Mehrfachauswahl“ (W0–W2), „(mehrfach)“ und „(je Aussage w/f)“ (W3, M8 E130) → mehrfach
    if (!Array.isArray(a.interaktion)) assert.equal(!!ia.mehrfach, /Mehrfachauswahl|\(mehrfach\)|w\/f/.test(spec.interaktion), `${o}: mehrfach`);
  });
}

/** Level-Kopf gegen Spec §2 und E39/E63 */
function pruefeLevel(welt, w, abschnitt) {
  const sl = S.specLevels(welt).find((l) => l.id === abschnitt);
  assert.ok(sl, `Level ${abschnitt} fehlt in der Spec`);
  const l = (w.levels || []).find((x) => x.id === abschnitt);
  assert.ok(l, `Level ${abschnitt} fehlt im Seed`);
  assert.equal(l.nr, sl.nr, `${abschnitt}: nr`);
  if (sl.ds) assert.deepEqual(l.ds, sl.ds, `${abschnitt}: ds`);
  assert.equal(l.niveau, sl.niveau, `${abschnitt}: niveau`);
  assert.equal(l.rolle, sl.rolle, `${abschnitt}: rolle (E39)`);
  assert.deepEqual(alsListe(l.werkzeug), sl.werkzeug, `${abschnitt}: werkzeug (E63)`);
  // M6 E70: Reiter-Voreinstellungen (2.1 Vigenère nur Quadrat + Ver-/Entschlüsseln, 2.4 Bigramme + Histogramm)
  for (const e of Array.isArray(l.werkzeug) ? l.werkzeug : []) {
    const soll = ((S.REITER[sl.nr] || {})[typeof e === 'object' ? e.id : e]) || null;
    const ist = e && typeof e === 'object' && e.voreinstellung && Array.isArray(e.voreinstellung.reiter) ? e.voreinstellung.reiter : null;
    assert.deepEqual(ist, soll, `${abschnitt}: Reiter von ${typeof e === 'object' ? e.id : e} (E70)`);
  }
  if (sl.kuer) assert.equal(l.kuer, true, `${abschnitt}: kuer`);
  const akte = `Akte W${welt}·${sl.kuer ? sl.nr : sl.nr.split('.')[1]}`;
  assert.ok(typeof l.akte === 'string' && l.akte.startsWith(akte), `${abschnitt}: akte beginnt mit „${akte}“`);
  const intro = Array.isArray(l.intro) ? l.intro : [];
  assert.ok(intro[1] && String(intro[1].md).includes(sl.merkkasten.slice(0, 40)), `${abschnitt}: intro[1] enthält den Merkkasten (E60)`);
  const specIds = S.specAufgaben(welt).filter((a) => a.abschnitt === abschnitt).map((a) => a.id);
  assert.deepEqual([...l.aufgaben].sort(), [...specIds].sort(), `${abschnitt}: Aufgabenliste wie in der Spec`);
}

for (const welt of S.WELTEN) {
  test(`Welt ${welt}: Abschnitte in UMFANG stehen vollständig und spec-treu im Seed`, (t) => {
    const umfang = S.UMFANG[welt];
    if (!umfang.length) return t.skip('UMFANG leer (noch kein Abschnitt eingetragen)');
    const w = S.seed(welt);
    const specs = S.specAufgaben(welt);
    for (const abschnitt of umfang) {
      if (abschnitt.startsWith('WU-')) {
        const wu = S.warmup(welt);
        assert.ok(wu && Array.isArray(wu.karten), `seed/warmup/w${welt}.json fehlt`);
        for (const s of specs.filter((x) => x.abschnitt === abschnitt)) assert.ok(wu.karten.some((k) => k.id === s.id), `${s.id} fehlt in seed/warmup/w${welt}.json`);
        continue;
      }
      assert.ok(w, `seed/welten/welt${welt}.json fehlt`);
      const liste = specs.filter((x) => x.abschnitt === abschnitt);
      assert.ok(liste.length, `Abschnitt ${abschnitt} gibt es in der Spec nicht`);
      for (const spec of liste) pruefeAufgabe(welt, w, spec);
      if (/-L\d+$/.test(abschnitt)) pruefeLevel(welt, w, abschnitt);
    }
  });

  test(`Welt ${welt}: keine Seed-Aufgabe außerhalb der Spec`, (t) => {
    const w = S.seed(welt);
    if (!w) return t.skip(`seed/welten/welt${welt}.json gibt es noch nicht`);
    const ids = new Set(S.specAufgaben(welt).map((a) => a.id));
    for (const a of w.aufgaben || []) assert.ok(ids.has(a.id), `${a.id} hat keine Zeile in ${S.SPEC_DATEIEN[welt]}`);
  });
}

// Plan M5 Task 79 (W1-L1-07): vorgegebene Häufigkeiten (Block haeufigkeit, quelle „werte“) müssen zum Geheimtext der
// Aufgabe passen (zuordnung.geheimtext bzw. chiffre-Eingabe) – gezählt mit Krypto.haeufigkeiten().
test('Vorgegebene Häufigkeiten (quelle „werte“) stimmen mit dem Geheimtext der Aufgabe überein', () => {
  const Krypto = require('../public/static/js/shared/krypto.js');
  let geprueft = 0;
  for (const welt of S.WELTEN) {
    const w = S.seed(welt);
    if (!w) continue;
    for (const a of w.aufgaben || []) {
      const bloecke = (a.inhalt || []).filter((b) => b && b.t === 'haeufigkeit' && b.quelle === 'werte');
      if (!bloecke.length) continue;
      const teile = Array.isArray(a.interaktion) ? a.interaktion : [a.interaktion];
      const quelle = teile.find((ia) => ia && (ia.kind === 'zuordnung' || ia.kind === 'chiffre'));
      assert.ok(quelle, `${a.id}: kein Geheimtext zum Häufigkeits-Block`);
      const gezaehlt = Krypto.haeufigkeiten(quelle.kind === 'zuordnung' ? quelle.geheimtext : quelle.eingabe);
      const ohneNull = Object.fromEntries(Object.entries(gezaehlt).filter(([, n]) => n > 0));
      for (const b of bloecke) {
        const soll = Object.fromEntries(Object.entries(b.werte).filter(([, n]) => n > 0));
        assert.deepEqual(soll, ohneNull, `${a.id}: Häufigkeiten`);
        geprueft++;
      }
    }
  }
  // kein Block mit quelle „werte“ in den Seeds (W1-L1-07 nutzt seit der Durchsicht nur die Werkbank) – dann ist nichts zu prüfen
  assert.ok(geprueft >= 0);
});

// Durchsicht W1 (W1-L1-07): keine Häufigkeitsleiste doppelt – Block haeufigkeit und Werkbank (zuordnung mit
// haeufigkeit: true) über denselben Geheimtext; der Validator meldet das als Hinweis, hier ist es ein Fehler.
test('Keine doppelte Häufigkeitsleiste (Block haeufigkeit + Werkbank mit haeufigkeit: true) in den Seeds', () => {
  require('../src/krypto').registriere();
  const { validiereWelt } = require('../src/content/validator');
  for (const welt of S.WELTEN) {
    const w = S.seed(welt);
    if (!w) continue;
    const doppelt = validiereWelt(w, { datei: `welt${welt}.json` }).warnungen.filter((x) => /Häufigkeitsleiste doppelt/.test(x.meldung));
    assert.deepEqual(doppelt.map((x) => x.ort), [], `Welt ${welt}`);
  }
});

// Plan M5 E41 (Task 83): Porta-Tafeln (Block tabelle mit Titel „Porta-Tafel …“) – jede Zelle = Krypto.porta
// (Kopfzeile a–m = Klartextbuchstabe, erste Spalte „A/B“ … = Schlüsselbuchstaben-Paar).
test('Porta-Tafeln in den Seeds stimmen Zelle für Zelle mit Krypto.porta überein', () => {
  const Krypto = require('../public/static/js/shared/krypto.js');
  let tafeln = 0;
  for (const welt of S.WELTEN) {
    const w = S.seed(welt);
    if (!w) continue;
    for (const a of w.aufgaben || []) {
      for (const b of S.teile(a).flatMap((t) => [...(a.inhalt || []), ...((t.interaktion && t.interaktion.inhalt) || [])])) {
        if (!b || b.t !== 'tabelle' || !/^Porta-Tafel/.test(String(b.titel || ''))) continue;
        assert.equal(b.zeilen.length, 13, `${a.id}: 13 Zeilen`);
        b.zeilen.forEach((z, i) => {
          const paar = String.fromCharCode(65 + 2 * i) + '/' + String.fromCharCode(66 + 2 * i);
          assert.equal(z[0], paar, `${a.id}: Zeile ${i + 1}`);
          for (let s = 1; s < b.kopf.length; s++) assert.equal(z[s], Krypto.porta(b.kopf[s], paar[0]).toUpperCase(), `${a.id}: ${paar} / ${b.kopf[s]}`);
        });
        tafeln++;
      }
    }
  }
  if (S.UMFANG[2].includes('W2-L1')) assert.ok(tafeln >= 1, 'W2-L1-06 hat eine Porta-Tafel');
});

// Plan M8 Task 176: Mini-Enigma-Tafeln (Block tabelle „Mini-Enigma: Tabelle je Stellung …“) – jede Zelle =
// Krypto.miniEnigma.tabelle; W3-L5-04: die Positionen ohne Fixpunkt-Kollision und der „tatsächliche“ Klartext der Spec.
test('Mini-Enigma: Stellungstafeln und Positionen von BACH (W3-L5-04) stimmen mit der Bibliothek', (t) => {
  const Krypto = require('../public/static/js/shared/krypto.js');
  const w = S.seed(3);
  if (!w || !(S.UMFANG[3] || []).includes('W3-L5')) return t.skip('W3-L5 noch nicht im UMFANG');
  let tafeln = 0;
  for (const a of w.aufgaben) {
    for (const b of a.inhalt || []) {
      if (b.t !== 'tabelle' || !/^Mini-Enigma/.test(b.titel || '')) continue;
      assert.deepEqual(b.kopf, ['Stellung', ...'ABCDEFGH'], `${a.id}: Kopf`);
      assert.deepEqual(b.zeilen, [...'ABCDEFGH'].map((st) => [st, ...Krypto.miniEnigma.tabelle(st)]), `${a.id}: Zellen`);
      tafeln++;
    }
  }
  assert.ok(tafeln >= 2, 'Tafeln in W3-L5-01 und -02');
  const g = 'AFCCAGHHAF';
  const moeglich = [];
  for (let p = 0; p + 4 <= g.length; p++) if (![...'BACH'].some((c, i) => g[p + i] === c)) moeglich.push(String(p));
  const lo = w.aufgaben.find((a) => a.id === 'W3-L5-04').loesung;
  assert.deepEqual([lo.p1[0], lo.p2[0], lo.p3[0]], moeglich);
  assert.equal(Krypto.miniEnigma('chefhabach', 'C'), g, 'Spec: tatsächlich p = 6 (Klartext chefhabach, Start C)');
});
