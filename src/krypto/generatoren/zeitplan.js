'use strict';
// Generator Welt 6 (SPEC W6 §8 G-W6-2 „Zeitplan“): Takt eA 2,25 min/BE bzw. gA 2,2 min/BE; 7–10 Teilaufgaben mit 2–6 BE,
// Summe 30 (eA) bzw. 25 (gA). Fragen: Minuten einer Teilaufgabe, kumuliert, Rückstand. Toleranz ± 0,5 min (K43).

const txt = (md) => ({ t: 'text', md });
const BUCHSTABEN = 'abcdefghij';
const komma = (x) => String(Math.round(x * 1000) / 1000).replace('.', ',');

/** n Teilaufgaben mit 2–6 BE und der Summe s */
function teilaufgaben(z, s) {
  for (;;) {
    const n = z.int(7, 10);
    const be = Array.from({ length: n }, () => z.int(2, 6));
    const diff = s - be.reduce((a, b) => a + b, 0);
    if (diff === 0) return be;
    // gleichmäßig nachjustieren, solange es die Grenzen erlauben
    let rest = diff;
    for (let i = 0; i < n && rest !== 0; i++) {
      const neu = Math.min(6, Math.max(2, be[i] + rest));
      rest -= neu - be[i];
      be[i] = neu;
    }
    if (rest === 0) return be;
  }
}

function zeitplan(z) {
  const eA = z.bool(0.5);
  const takt = eA ? 2.25 : 2.2;
  const summe = eA ? 30 : 25;
  const be = teilaufgaben(z, summe);
  const liste = be.map((b, i) => `(${BUCHSTABEN[i]}) ${b} BE`).join(', ');
  const kopf = `Krypto-Aufgabe im ${eA ? 'eA' : 'gA'}-Abitur (Takt ${komma(takt)} min je BE): ${liste}.`;
  const art = z.pick(['einzeln', 'kumuliert', 'rueckstand']);
  let frage;
  let wert;
  let erkl;
  if (art === 'einzeln') {
    const i = z.int(0, be.length - 1);
    wert = be[i] * takt;
    frage = `Wie viele Minuten sind für Teilaufgabe (${BUCHSTABEN[i]}) eingeplant? [[min]] min`;
    erkl = `${be[i]} · ${komma(takt)} = ${komma(wert)} min.`;
  } else if (art === 'kumuliert') {
    const i = z.int(2, be.length - 2);
    const bis = be.slice(0, i + 1).reduce((a, b) => a + b, 0);
    wert = bis * takt;
    frage = `Wie viele Minuten sind bis einschließlich Teilaufgabe (${BUCHSTABEN[i]}) eingeplant? [[min]] min`;
    erkl = `${be.slice(0, i + 1).join(' + ')} = ${bis} BE; ${bis} · ${komma(takt)} = ${komma(wert)} min.`;
  } else {
    const i = z.int(2, be.length - 3);
    const erledigt = be.slice(0, i + 1).reduce((a, b) => a + b, 0);
    const m = Math.round(erledigt * takt) + z.pick([-4, -2, 3, 5, 6, 8]);
    wert = m - erledigt * takt;
    frage = `Nach ${m} Minuten sind Teilaufgaben mit ${erledigt} BE erledigt. Wie viele Minuten liegst du hinter dem Plan (negativ: vor dem Plan)? [[min]] min`;
    erkl = `Plan: ${erledigt} · ${komma(takt)} = ${komma(erledigt * takt)} min; ${m} − ${komma(erledigt * takt)} = ${komma(wert)} min${wert < 0 ? ' – du liegst vor dem Plan' : ''}.`;
  }
  return {
    titel: 'Zeitplan im Abitur',
    stufe: art === 'einzeln' ? 1 : 2,
    kategorie: 'begriffe',
    fallen: ['P10'],
    inhalt: [txt(`${kopf} ${frage}`)],
    interaktion: { kind: 'gaps', felder: { min: { typ: 'zahl', breite: 6, toleranz: 0.5 } } },
    loesung: { min: [komma(wert)] },
    tipps: ['Minuten = BE · Takt.', 'Komma oder Punkt sind erlaubt; auf eine halbe Minute genau reicht.'],
    erklaerung: [txt(erkl)]
  };
}

module.exports = {
  zeitplan: { titel: 'Zeitplan', welten: [6], niveau: 'kern', make: zeitplan }
};
