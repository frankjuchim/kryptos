/* Kryptos – Krypto-Bibliothek (gemeinsam für Server und Browser, kein Build), TECHNIK §5
 *
 * Regeln (TECHNIK §5.1): rein (keine DOM-, Netz-, Zeit- oder Zufallszugriffe), deterministisch, keine
 * Abhängigkeiten, ES2020. Fehlerhafte Parameter → KryptoFehler mit deutscher Meldung. Alle Rückgaben von
 * Verfahren sind GROSSBUCHSTABEN ohne Leerzeichen (Darstellung klein/gruppiert macht die Oberfläche).
 * Eingaben werden mit nurBuchstaben() normalisiert (außer wo Ziffern Teil des Alphabets sind).
 *
 * Zählbasis: Buchstabenwerte standardmäßig A = 1 … Z = 26 (Abitur-Anlage, Design §6.1); Verschiebungen und
 * Schlüsselbuchstaben A = 0; die affine Chiffre rechnet standardmäßig mit A = 0 (W1).
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Krypto = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  class KryptoFehler extends Error {
    constructor(meldung) {
      super(meldung);
      this.name = 'KryptoFehler';
    }
  }

  // ───────────────────────────── Hilfen (intern) ─────────────────────────────

  function pruefeGanzzahl(n, name) {
    if (!Number.isInteger(n)) throw new KryptoFehler(`${name} muss eine ganze Zahl sein.`);
    return n;
  }

  function pruefeText(text, name = 'Text') {
    if (typeof text !== 'string') throw new KryptoFehler(`${name} muss als Zeichenkette angegeben werden.`);
    return text;
  }

  function pruefeRichtung(richtung) {
    if (richtung !== 'ver' && richtung !== 'ent') {
      throw new KryptoFehler('Richtung muss „ver“ (verschlüsseln) oder „ent“ (entschlüsseln) sein.');
    }
    return richtung;
  }

  function ggT(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) [a, b] = [b, a % b];
    return a;
  }

  // ───────────────────────────── Grundlagen ─────────────────────────────

  /** kleinster nicht negativer Rest (EH) */
  function mod(a, m) {
    pruefeGanzzahl(a, 'Zahl');
    pruefeGanzzahl(m, 'Modul');
    if (m <= 0) throw new KryptoFehler('Der Modul muss größer als 0 sein.');
    return ((a % m) + m) % m;
  }

  /** Buchstabe → Wert: A → basis, …, Z → basis + 25 */
  function wert(b, basis = 1) {
    pruefeGanzzahl(basis, 'Zählbasis');
    const n = nurBuchstaben(pruefeText(b, 'Buchstabe'));
    if (n.length !== 1) throw new KryptoFehler('Es wird genau ein Buchstabe A–Z erwartet.');
    return ALPHABET.indexOf(n) + basis;
  }

  /** Wert → Buchstabe: ALPHABET[mod(n − basis, 26)] (bei basis 1: 0 → Z, 26 → Z, 27 → A) */
  function buchstabe(n, basis = 1) {
    pruefeGanzzahl(n, 'Buchstabenwert');
    pruefeGanzzahl(basis, 'Zählbasis');
    return ALPHABET[mod(n - basis, 26)];
  }

  /** Schlüsselbuchstabe → Verschiebung (Anlage: A = Verschiebung 0) */
  function verschiebung(schluesselbuchstabe) {
    return wert(schluesselbuchstabe, 0);
  }

  /** Normalisierung „krypto“ (AUFGABENFORMAT_KRYPTO §5.1) */
  function normalisieren(text, { ziffern = true } = {}) {
    pruefeText(text);
    let s = text.normalize('NFC');
    s = s.replace(/[äÄ]/g, 'AE').replace(/[öÖ]/g, 'OE').replace(/[üÜ]/g, 'UE').replace(/[ßẞ]/g, 'SS');
    s = s.toUpperCase();
    s = s.normalize('NFD').replace(/[̀-ͯ]/g, '');
    return s.replace(ziffern ? /[^A-Z0-9]/g : /[^A-Z]/g, '');
  }

  function nurBuchstaben(text) {
    return normalisieren(text, { ziffern: false });
  }

  /** Normalisierung „bits“ (Delta §5.2): Leerraum sowie _ | . entfernen, alles andere bleibt stehen */
  function normBits(text) {
    return pruefeText(text).replace(/[\s_|.]/g, '');
  }

  /** Gruppen zu n Zeichen (Leerraum der Eingabe wird vorher entfernt) */
  function gruppieren(text, n = 5, trenner = ' ') {
    pruefeText(text);
    pruefeGanzzahl(n, 'Gruppengröße');
    if (n < 1) throw new KryptoFehler('Die Gruppengröße muss mindestens 1 sein.');
    const s = text.replace(/\s+/g, '');
    const teile = [];
    for (let i = 0; i < s.length; i += n) teile.push(s.slice(i, i + n));
    return teile.join(trenner);
  }

  /** Kleinschreibung für die Klartext-Anzeige */
  function klein(text) {
    return pruefeText(text).toLowerCase();
  }

  /** Liste der Buchstabenwerte */
  function zahlen(text, basis = 1) {
    return [...nurBuchstaben(text)].map((c) => wert(c, basis));
  }

  /** Umkehrung von zahlen (mit mod) */
  function ausZahlen(liste, basis = 1) {
    if (!Array.isArray(liste)) throw new KryptoFehler('Es wird eine Liste von Zahlen erwartet.');
    return liste.map((n) => buchstabe(n, basis)).join('');
  }

  // ───────────────────────────── Monoalphabetisch ─────────────────────────────

  function verschiebeText(t, k) {
    let aus = '';
    for (const c of t) aus += ALPHABET[(ALPHABET.indexOf(c) + k) % 26];
    return aus;
  }

  /** Caesar: jeder Buchstabe um k (ent: −k) verschoben, mod 26 */
  function caesar(text, k, richtung = 'ver') {
    pruefeGanzzahl(k, 'Verschiebung k');
    pruefeRichtung(richtung);
    const t = nurBuchstaben(text);
    return verschiebeText(t, mod(richtung === 'ver' ? k : -k, 26));
  }

  /** Brute-Force-Liste der Chiffrierscheibe: [{k, text}] mit text = Entschlüsselung mit k, k = 0…25 */
  function alleCaesar(text) {
    const t = nurBuchstaben(text);
    const liste = [];
    for (let k = 0; k < 26; k++) liste.push({ k, text: verschiebeText(t, mod(-k, 26)) });
    return liste;
  }

  /** Atbash: A ↔ Z, B ↔ Y … (involutorisch) */
  function atbash(text) {
    let aus = '';
    for (const c of nurBuchstaben(text)) aus += ALPHABET[25 - ALPHABET.indexOf(c)];
    return aus;
  }

  function affinSchluesselGueltig(a) {
    return Number.isInteger(a) && ggT(a, 26) === 1;
  }

  function inversMod26(a) {
    const r = mod(a, 26);
    for (let x = 1; x < 26; x++) if ((r * x) % 26 === 1) return x;
    return null;
  }

  /** Affine Chiffre c = a·p + b (mod 26) mit Zählbasis basis (Standard A = 0, W1) */
  function affin(text, a, b = 0, richtung = 'ver', basis = 0) {
    pruefeGanzzahl(a, 'Faktor a');
    pruefeGanzzahl(b, 'Summand b');
    pruefeRichtung(richtung);
    if (basis !== 0 && basis !== 1) throw new KryptoFehler('Die Zählbasis muss 0 (A = 0) oder 1 (A = 1) sein.');
    if (!affinSchluesselGueltig(a)) {
      throw new KryptoFehler('Der Faktor a muss teilerfremd zu 26 sein, sonst ist die Verschlüsselung nicht umkehrbar.');
    }
    const t = nurBuchstaben(text);
    let aus = '';
    if (richtung === 'ver') {
      for (const c of t) aus += buchstabe(a * wert(c, basis) + b, basis);
    } else {
      const ai = inversMod26(a);
      for (const c of t) aus += buchstabe(ai * (wert(c, basis) - b), basis);
    }
    return aus;
  }

  /** Schlüsselwort ohne Doppelte, dann der Rest (alphabetisch oder ab dem Buchstaben nach dem letzten) */
  function schluesselwortAlphabet(wort, { rest = 'alphabetisch' } = {}) {
    if (rest !== 'alphabetisch' && rest !== 'ab_letztem') {
      throw new KryptoFehler('Die Option rest muss „alphabetisch“ oder „ab_letztem“ sein.');
    }
    const gesehen = [];
    for (const c of nurBuchstaben(pruefeText(wort, 'Schlüsselwort'))) if (!gesehen.includes(c)) gesehen.push(c);
    let reihenfolge = ALPHABET;
    if (rest === 'ab_letztem' && gesehen.length > 0) {
      const start = ALPHABET.indexOf(gesehen[gesehen.length - 1]) + 1;
      reihenfolge = ALPHABET.slice(start) + ALPHABET.slice(0, start);
    }
    for (const c of reihenfolge) if (!gesehen.includes(c)) gesehen.push(c);
    return gesehen.join('');
  }

  function pruefeGeheimalphabet(geheimalphabet) {
    const g = nurBuchstaben(pruefeText(geheimalphabet, 'Geheimtextalphabet'));
    if (g.length !== 26 || new Set(g).size !== 26) {
      throw new KryptoFehler('Das Geheimtextalphabet muss jeden der 26 Buchstaben genau einmal enthalten.');
    }
    return g;
  }

  /** inverse Permutation */
  function umkehrAlphabet(geheimalphabet) {
    const g = pruefeGeheimalphabet(geheimalphabet);
    const inv = new Array(26);
    for (let i = 0; i < 26; i++) inv[ALPHABET.indexOf(g[i])] = ALPHABET[i];
    return inv.join('');
  }

  /** monoalphabetische Substitution: geheimalphabet[i] ist das Bild von ALPHABET[i] */
  function substitution(text, geheimalphabet, richtung = 'ver') {
    let g = pruefeGeheimalphabet(geheimalphabet);
    pruefeRichtung(richtung);
    if (richtung === 'ent') g = umkehrAlphabet(g);
    let aus = '';
    for (const c of nurBuchstaben(text)) aus += g[ALPHABET.indexOf(c)];
    return aus;
  }

  return {
    // Grundlagen
    ALPHABET,
    KryptoFehler,
    mod,
    wert,
    buchstabe,
    verschiebung,
    normalisieren,
    nurBuchstaben,
    normBits,
    gruppieren,
    klein,
    zahlen,
    ausZahlen,
    // Monoalphabetisch
    caesar,
    alleCaesar,
    atbash,
    affin,
    affinSchluesselGueltig,
    schluesselwortAlphabet,
    substitution,
    umkehrAlphabet,
  };
});
