'use strict';
// Generator Welt 6 (SPEC W6 §8 G-W6-3 „Fallen-Mix“): eine Schülerlösung mit genau einer Falle aus {P1, P2, P3, P7};
// gesucht sind die Falle (Klappliste) und das richtige Ergebnis – ein gaps-Teil, damit der Kern-Trainingsplatz unverändert
// bleibt (Plan M8 Task 194). Basis: Caesar (A = 1) ver/ent, mod-Rechnen, Vigenère ver/ent, Schlüsselanzahl.
// XOR-Bytes der Spec entfällt: keine der vier Fallen beschreibt einen XOR-Fehler (Plan M8, Umsetzungsnotiz Task 194).

const K = require('../../../public/static/js/shared/krypto');
const { FALLEN } = require('../fach');
const { WOERTER_ANTIKE, KLARTEXTE_W2, SCHLUESSEL_W2 } = require('./woerter');

const txt = (md) => ({ t: 'text', md });
/** Zahlen der Erklärvideos (V05 Schlüsselanzahl, V02 negative Reste) – ausgeschlossen (Design §11) */
const VIDEO_N = Object.freeze([4, 5, 11, 17]);
const VIDEO_DIFF = Object.freeze([-5, -6, -7]);
const OPTIONEN = ['P1', 'P2', 'P3', 'P7'].map((p) => `${p} ${FALLEN[p].titel}`);
const opt = (p) => OPTIONEN.find((o) => o.startsWith(p));
const ERKL = {
  P1: 'Alle Zeichen liegen genau eine Stelle daneben – Zählbasis verwechselt (A = Verschiebung 0, nicht 1).',
  P2: 'Rest 0 bzw. negative Reste falsch behandelt – mit A = 1 wird aus 0 der Buchstabe Z, mod liefert den kleinsten nicht negativen Rest.',
  P3: 'In die falsche Richtung gerechnet – beim Entschlüsseln wird die Verschiebung abgezogen.',
  P7: 'Jedes Paar doppelt gezählt – symmetrisch braucht man n(n − 1)/2 Schlüssel.'
};

function aufgabe({ kategorie, falle, text, ergebnis, zahl = false, erklaerung }) {
  return {
    titel: 'Fallen-Mix',
    stufe: 2,
    kategorie,
    // die Falle ist die gesuchte Antwort – nicht als Fallen-Chip über der Aufgabe zeigen
    fallen: [],
    inhalt: [txt(`In dieser Lösung steckt genau eine Falle. Welche? Gib außerdem das richtige Ergebnis an.\n\n${text}`), txt('Falle: [[falle]] · richtiges Ergebnis: [[ergebnis]]')],
    interaktion: { kind: 'gaps', felder: { falle: { typ: 'auswahl', optionen: OPTIONEN }, ergebnis: zahl ? { typ: 'zahl', breite: 5 } : { typ: 'text', norm: 'krypto', breite: 14 } } },
    loesung: { falle: [opt(falle)], ergebnis: [ergebnis] },
    tipps: ['Rechne die Aufgabe selbst und vergleiche Zeichen für Zeichen.', 'Liegt alles eine Stelle daneben? Stimmt die Richtung? Was passiert bei Rest 0? Wird doppelt gezählt?'],
    erklaerung: [txt(`${ERKL[falle]} ${erklaerung}`)]
  };
}

function fallenMix(z) {
  const art = z.pick(['caesar_p1', 'caesar_p2', 'caesar_p3', 'mod_p2', 'vig_p1', 'vig_p3', 'anzahl_p7']);
  if (art.startsWith('caesar')) {
    const wort = z.pick(WOERTER_ANTIKE.filter((w) => w.length >= 4 && w.length <= 8));
    if (art === 'caesar_p3') {
      // k = 13: Ver- und Entschlüsseln sind gleich – die „falsche“ Schülerlösung wäre richtig (Review M8 Fund 2)
      let k;
      do k = z.int(3, 23);
      while (k === 13);
      const geheim = K.caesar(wort, k);
      const schueler = K.caesar(geheim, k).toLowerCase();
      return aufgabe({ kategorie: 'entschluesseln', falle: 'P3', text: `Nummerierung: A = 1 … Z = 26. Entschlüssele \`${K.gruppieren(geheim, 5)}\` mit Caesar, Verschiebung k = ${k}. Schülerlösung: \`${schueler}\``, ergebnis: wort, erklaerung: `Richtig: **${wort}**.` });
    }
    if (art === 'caesar_p1') {
      const k = z.int(2, 23);
      const richtig = K.caesar(wort, k);
      const schueler = K.caesar(wort, k + z.pick([1, -1]));
      return aufgabe({ kategorie: 'verschluesseln', falle: 'P1', text: `Nummerierung: A = 1 … Z = 26. Verschlüssele \`${wort}\` mit Caesar, Verschiebung k = ${k}. Schülerlösung: \`${K.gruppieren(schueler, 5)}\``, ergebnis: richtig, erklaerung: `Richtig: \`${K.gruppieren(richtig, 5)}\`.` });
    }
    // P2: ein Buchstabe landet genau auf Z (Wert 26) – die Schülerin schreibt dafür A (Rest 0 als A gelesen)
    const kandidaten = [...new Set(wort.toUpperCase())].filter((c) => c !== 'Z');
    const c = z.pick(kandidaten);
    const k = 26 - (c.charCodeAt(0) - 64);
    const richtig = K.caesar(wort, k);
    const schueler = richtig.replace(/Z/g, 'A');
    return aufgabe({ kategorie: 'verschluesseln', falle: 'P2', text: `Nummerierung: A = 1 … Z = 26. Verschlüssele \`${wort}\` mit Caesar, Verschiebung k = ${k}. Schülerlösung: \`${K.gruppieren(schueler, 5)}\``, ergebnis: richtig, erklaerung: `Richtig: \`${K.gruppieren(richtig, 5)}\` (${c} + ${k} = 26 → Z).` });
  }
  if (art === 'mod_p2') {
    let x;
    let y;
    do {
      x = z.int(1, 12);
      y = z.int(x + 1, 25);
    } while (VIDEO_DIFF.includes(x - y));
    const richtig = K.mod(x - y, 26);
    return aufgabe({ kategorie: 'modulo', falle: 'P2', text: `Berechne (${x} − ${y}) mod 26. Schülerlösung: ${String(x - y).replace('-', '−')}`, ergebnis: String(richtig), zahl: true, erklaerung: `Richtig: ${x} − ${y} = ${x - y}; ${x - y} + 26 = **${richtig}**.` });
  }
  if (art.startsWith('vig')) {
    const klar = z.pick(KLARTEXTE_W2.filter((w) => w.length <= 10));
    // Schlüssel nur aus A/N (Verschiebung 0/13): Richtung egal – für P3 ungeeignet (Review M8 Fund 2)
    const schl = z.pick(SCHLUESSEL_W2.filter((w) => !/^[AN]+$/.test(w)));
    if (art === 'vig_p1') {
      const richtig = K.vigenere(klar, schl);
      const schueler = K.vigenere(klar, K.caesar(schl, 1));
      return aufgabe({ kategorie: 'substitution-poly', falle: 'P1', text: `Vigenère, Schlüsselwort ${schl} (Anlage-Quadrat, Schlüsselbuchstabe A = Verschiebung 0). Verschlüssele \`${klar}\`. Schülerlösung: \`${K.gruppieren(schueler, 5)}\``, ergebnis: richtig, erklaerung: `Richtig: \`${K.gruppieren(richtig, 5)}\`.` });
    }
    const geheim = K.vigenere(klar, schl);
    const schueler = K.vigenere(geheim, schl).toLowerCase();
    return aufgabe({ kategorie: 'substitution-poly', falle: 'P3', text: `Vigenère, Schlüsselwort ${schl} (Anlage-Quadrat, Schlüsselbuchstabe A = Verschiebung 0). Entschlüssele \`${K.gruppieren(geheim, 5)}\`. Schülerlösung: \`${schueler}\``, ergebnis: klar, erklaerung: `Richtig: **${klar}**.` });
  }
  let n;
  do n = z.int(5, 30);
  while (VIDEO_N.includes(n));
  return aufgabe({ kategorie: 'schluesselraum', falle: 'P7', text: `${n} Personen wollen paarweise symmetrisch verschlüsselt kommunizieren. Wie viele Schlüssel braucht man? Schülerlösung: ${n * (n - 1)} Schlüssel`, ergebnis: String((n * (n - 1)) / 2), zahl: true, erklaerung: `Richtig: ${n} · ${n - 1} / 2 = **${(n * (n - 1)) / 2}**.` });
}

module.exports = {
  fallen_mix: { titel: 'Fallen-Mix', welten: [6], niveau: 'kern', make: fallenMix }
};
