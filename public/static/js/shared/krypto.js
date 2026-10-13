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

  // ───────────────────────────── Polyalphabetisch ─────────────────────────────

  function schluesselBuchstaben(schluessel) {
    const s = nurBuchstaben(pruefeText(schluessel, 'Schlüssel'));
    if (s.length === 0) throw new KryptoFehler('Der Schlüssel muss mindestens einen Buchstaben enthalten.');
    return s;
  }

  /** Vigenère: Position i (nur über Buchstaben gezählt) um verschiebung(schluessel[i mod L]) verschoben */
  function vigenere(text, schluessel, richtung = 'ver') {
    const s = schluesselBuchstaben(schluessel);
    pruefeRichtung(richtung);
    const t = nurBuchstaben(text);
    const vz = richtung === 'ver' ? 1 : -1;
    let aus = '';
    for (let i = 0; i < t.length; i++) {
      aus += ALPHABET[mod(ALPHABET.indexOf(t[i]) + vz * ALPHABET.indexOf(s[i % s.length]), 26)];
    }
    return aus;
  }

  /** Autokey: Schlüsselstrom = Schlüssel + Klartext (beim Entschlüsseln fortlaufend rekonstruiert) */
  function autokey(text, schluessel, richtung = 'ver') {
    const s = schluesselBuchstaben(schluessel);
    pruefeRichtung(richtung);
    const t = nurBuchstaben(text);
    const strom = [...s];
    let aus = '';
    for (let i = 0; i < t.length; i++) {
      const k = ALPHABET.indexOf(strom[i]);
      if (richtung === 'ver') {
        aus += ALPHABET[(ALPHABET.indexOf(t[i]) + k) % 26];
        strom.push(t[i]);
      } else {
        const p = ALPHABET[mod(ALPHABET.indexOf(t[i]) - k, 26)];
        aus += p;
        strom.push(p);
      }
    }
    return aus;
  }

  /**
   * Porta-Tafel (W2): Schlüsselbuchstabe mit Index s (A = 0) → j = ⌊s/2⌋; Klartextindex x:
   * x < 13 → 13 + ((x − j) mod 13), sonst (x − 13 + j) mod 13. Involutorisch; die Richtung wird nur geprüft.
   */
  function porta(text, schluessel, richtung = 'ver') {
    const s = schluesselBuchstaben(schluessel);
    pruefeRichtung(richtung);
    const t = nurBuchstaben(text);
    let aus = '';
    for (let i = 0; i < t.length; i++) {
      const j = Math.floor(ALPHABET.indexOf(s[i % s.length]) / 2);
      const x = ALPHABET.indexOf(t[i]);
      aus += ALPHABET[x < 13 ? 13 + mod(x - j, 13) : mod(x - 13 + j, 13)];
    }
    return aus;
  }

  /**
   * Pendel-Schlüsselfolge (W6 §2): Wort vorwärts, dann rückwärts ohne die Endbuchstaben zu wiederholen
   * (SAND → SANDNA, Periode 2L − 2; L = 1: das Wort selbst); mit laenge auf diese Länge fortgesetzt.
   */
  function pendelFolge(wort, laenge = null) {
    const w = schluesselBuchstaben(wort);
    const periode = w.length === 1 ? w : w + [...w.slice(1, -1)].reverse().join('');
    if (laenge === null || laenge === undefined) return periode;
    pruefeGanzzahl(laenge, 'Die Länge');
    if (laenge < 0) throw new KryptoFehler('Die Länge darf nicht negativ sein.');
    let aus = '';
    while (aus.length < laenge) aus += periode;
    return aus.slice(0, laenge);
  }

  const STROM_MODI = ['vigenere', 'autokey', 'pendel'];

  /**
   * Schlüsselstrom (W2 §9.1 Reiter 2): Schlüsselbuchstabe je Buchstabe von nurBuchstaben(text). vigenere: Schlüssel
   * wiederholt; autokey: Schlüssel + Klartext (ent: Klartext aus der Entschlüsselung); pendel: pendelFolge.
   */
  function schluesselstrom(text, schluessel, { modus = 'vigenere', richtung = 'ver' } = {}) {
    if (!STROM_MODI.includes(modus)) throw new KryptoFehler('Der Modus muss „vigenere“, „autokey“ oder „pendel“ sein.');
    pruefeRichtung(richtung);
    const s = schluesselBuchstaben(schluessel);
    const t = nurBuchstaben(text);
    const n = t.length;
    if (modus === 'pendel') return pendelFolge(s, n);
    if (modus === 'autokey') return (s + (richtung === 'ver' ? t : autokey(t, s, 'ent'))).slice(0, n);
    let aus = '';
    for (let i = 0; i < n; i++) aus += s[i % s.length];
    return aus;
  }

  // ───────────────────────────── Quadrate und Bigramme ─────────────────────────────

  const ZIFFERN = '0123456789';

  function pruefeIJ(ij) {
    if (ij !== 'I' && ij !== 'J') throw new KryptoFehler('Die Option ij muss „I“ (J → I) oder „J“ (I → J) sein.');
    return ij;
  }

  /** Text für ein Quadrat vorbereiten: 5×5 nur Buchstaben mit I/J-Zusammenfassung, 6×6 Buchstaben und Ziffern */
  function quadratText(text, groesse, ij) {
    if (groesse === 6) return normalisieren(pruefeText(text));
    const t = nurBuchstaben(text);
    return ij === 'I' ? t.replace(/J/g, 'I') : t.replace(/I/g, 'J');
  }

  /** Schlüsselquadrat 5×5 (ohne J bzw. ohne I) oder 6×6 (A–Z0–9) → Liste von Zeilen */
  function quadrat(schluessel = '', { groesse = 5, ij = 'I' } = {}) {
    if (groesse !== 5 && groesse !== 6) throw new KryptoFehler('Ein Quadrat hat die Größe 5 (5 × 5) oder 6 (6 × 6).');
    pruefeIJ(ij);
    if (Array.isArray(schluessel)) schluessel = schluessel.join('');
    const zeichen = [];
    let vorrat;
    if (groesse === 6) vorrat = ALPHABET + ZIFFERN;
    else vorrat = ij === 'I' ? ALPHABET.replace('J', '') : ALPHABET.replace('I', '');
    for (const c of quadratText(pruefeText(schluessel, 'Schlüssel'), groesse, ij) + vorrat) {
      if (!zeichen.includes(c)) zeichen.push(c);
    }
    const zeilen = [];
    for (let z = 0; z < groesse; z++) zeilen.push(zeichen.slice(z * groesse, (z + 1) * groesse).join(''));
    return zeilen;
  }

  /** Zeilenliste → Positionstabelle Zeichen → [Zeile, Spalte] (0-basiert) */
  function positionen(zeilen) {
    const pos = new Map();
    zeilen.forEach((zeile, z) => [...zeile].forEach((c, s) => pos.set(c, [z, s])));
    return pos;
  }

  /** ij: 'I' bzw. 'J' (Quadrat ohne J bzw. ohne I) oder null (jeder Buchstabe A–Z erlaubt) */
  function pruefeFuellzeichen(f, name, ij = 'I') {
    if (typeof f !== 'string' || !/^[A-Z]$/.test(f.toUpperCase())) {
      throw new KryptoFehler(`${name} muss genau ein Buchstabe A–Z sein.`);
    }
    const g = f.toUpperCase();
    if (ij !== null && g === (ij === 'I' ? 'J' : 'I')) throw new KryptoFehler(`${name} kommt im Quadrat nicht vor.`);
    return g;
  }

  /** Playfair-Paare: J → I; gleiches Paar AA → AX + Rest neu paaren (bei XX: XQ); ungerade Länge auffüllen */
  function playfairPaare(text, { fuellzeichen = 'X', fuellzeichenX = 'Q', ij = 'I' } = {}) {
    pruefeIJ(ij);
    const f = pruefeFuellzeichen(fuellzeichen, 'Das Füllzeichen', ij);
    const fx = pruefeFuellzeichen(fuellzeichenX, 'Das Ersatz-Füllzeichen', ij);
    if (f === fx) throw new KryptoFehler('Füllzeichen und Ersatz-Füllzeichen müssen verschieden sein.');
    const t = quadratText(text, 5, ij);
    const paare = [];
    let i = 0;
    while (i < t.length) {
      const a = t[i];
      const b = t[i + 1];
      if (b === undefined || a === b) {
        paare.push(a + (a === f ? fx : f));
        i += 1;
      } else {
        paare.push(a + b);
        i += 2;
      }
    }
    return paare;
  }

  /** Playfair: Zeile → rechts (ent links), Spalte → darunter (ent darüber), sonst Rechteck; ent entfernt keine Füllzeichen */
  function playfair(text, schluessel, richtung = 'ver', optionen = {}) {
    pruefeRichtung(richtung);
    const opt = optionen || {};
    const ij = pruefeIJ(opt.ij === undefined ? 'I' : opt.ij);
    const q = quadrat(schluessel, { groesse: 5, ij });
    let paare;
    if (richtung === 'ver') {
      paare = playfairPaare(text, opt);
    } else {
      playfairPaare('', opt); // Füllzeichen-Optionen auch beim Entschlüsseln prüfen (wie Kreuzquadrat)
      const t = quadratText(text, 5, ij);
      if (t.length % 2) throw new KryptoFehler('Ein Playfair-Geheimtext hat eine gerade Anzahl von Buchstaben.');
      paare = [];
      for (let i = 0; i < t.length; i += 2) {
        if (t[i] === t[i + 1]) {
          throw new KryptoFehler('Ein Playfair-Geheimtext enthält kein Paar aus zwei gleichen Buchstaben.');
        }
        paare.push(t[i] + t[i + 1]);
      }
    }
    return playfairRechne(q, paare, richtung);
  }

  /** Playfair-Regeln auf fertige Paare anwenden (gleiche Buchstaben werden wie „gleiche Zeile“ behandelt) */
  function playfairRechne(q, paare, richtung) {
    const pos = positionen(q);
    const d = richtung === 'ver' ? 1 : 4; // 4 ≡ −1 (mod 5)
    let aus = '';
    for (const p of paare) {
      const [z1, s1] = pos.get(p[0]);
      const [z2, s2] = pos.get(p[1]);
      if (z1 === z2) aus += q[z1][(s1 + d) % 5] + q[z2][(s2 + d) % 5];
      else if (s1 === s2) aus += q[(z1 + d) % 5][s1] + q[(z2 + d) % 5][s2];
      else aus += q[z1][s2] + q[z2][s1];
    }
    return aus;
  }

  /**
   * Kreuzquadrat (Level 2.4, Akte W2·4): Paar (a, b), a in O bei (zₐ, sₐ), b in U bei (z_b, s_b)
   * → c₁ = U[zₐ][s_b], c₂ = O[z_b][sₐ]; ungerade Länge → Füllzeichen anhängen; keine Regel für Doppelbuchstaben.
   */
  function kreuzquadrat(text, oben, unten, richtung = 'ver', { fuellzeichen = 'X' } = {}) {
    pruefeRichtung(richtung);
    const f = pruefeFuellzeichen(fuellzeichen, 'Das Füllzeichen');
    const O = quadrat(oben);
    const U = quadrat(unten);
    const posO = positionen(O);
    const posU = positionen(U);
    let t = quadratText(text, 5, 'I');
    if (t.length % 2) {
      if (richtung === 'ent') throw new KryptoFehler('Ein Kreuzquadrat-Geheimtext hat eine gerade Anzahl von Buchstaben.');
      t += f;
    }
    let aus = '';
    for (let i = 0; i < t.length; i += 2) {
      if (richtung === 'ver') {
        const [za, sa] = posO.get(t[i]);
        const [zb, sb] = posU.get(t[i + 1]);
        aus += U[za][sb] + O[zb][sa];
      } else {
        const [r1, t1] = posU.get(t[i]);
        const [r2, t2] = posO.get(t[i + 1]);
        aus += O[r1][t2] + U[r2][t1];
      }
    }
    return aus;
  }

  function zahlenschluesselListe(zahlenschluessel) {
    let liste;
    if (Array.isArray(zahlenschluessel)) liste = zahlenschluessel;
    else if (typeof zahlenschluessel === 'string') liste = [...zahlenschluessel.replace(/\s+/g, '')].map((c) => (/^[0-9]$/.test(c) ? Number(c) : NaN));
    // Kein Zahlenschlüssel als Zahl: eine führende 0 ginge verloren (0314 → 314).
    else throw new KryptoFehler('Der Zahlenschlüssel muss aus den Ziffern 0 bis 4 bestehen.');
    if (liste.length === 0 || !liste.every((k) => Number.isInteger(k) && k >= 0 && k <= 4)) {
      throw new KryptoFehler('Der Zahlenschlüssel muss aus den Ziffern 0 bis 4 bestehen.');
    }
    return liste;
  }

  /**
   * Zwei-Quadrat mit Zahlenschlüssel (Papier-Boss W2, SPEC W2 §6): Klartextbuchstabe in Q1 bei (z, s),
   * Ziffer k (zyklisch) → Q2[(z + k) mod 5][s]; ent sucht in Q2 und rechnet (z − k) mod 5 in Q1.
   */
  function zweiQuadratZahl(text, q1, q2, zahlenschluessel, richtung = 'ver') {
    pruefeRichtung(richtung);
    const ks = zahlenschluesselListe(zahlenschluessel);
    const Q1 = quadrat(q1);
    const Q2 = quadrat(q2);
    const pos1 = positionen(Q1);
    const pos2 = positionen(Q2);
    const t = quadratText(text, 5, 'I');
    let aus = '';
    for (let i = 0; i < t.length; i++) {
      const k = ks[i % ks.length];
      if (richtung === 'ver') {
        const [z, s] = pos1.get(t[i]);
        aus += Q2[(z + k) % 5][s];
      } else {
        const [z, s] = pos2.get(t[i]);
        aus += Q1[mod(z - k, 5)][s];
      }
    }
    return aus;
  }

  /** Polybios: ver → Paare „Zeilenkopf Spaltenkopf“ ohne Leerzeichen; ent aus Paaren zurück. Kopf mit 5 oder 6 Zeichen. */
  function polybios(text, optionen = {}, richtung = 'ver') {
    const { schluessel = '', kopf = '12345', ij = 'I' } = optionen || {};
    pruefeRichtung(richtung);
    pruefeIJ(ij);
    const k = normalisieren(pruefeText(String(kopf), 'Kopf'));
    if ((k.length !== 5 && k.length !== 6) || new Set(k).size !== k.length) {
      throw new KryptoFehler('Der Kopf muss aus 5 oder 6 verschiedenen Zeichen bestehen.');
    }
    const groesse = k.length;
    const q = quadrat(schluessel, { groesse, ij });
    if (richtung === 'ver') {
      const pos = positionen(q);
      let aus = '';
      for (const c of quadratText(text, groesse, ij)) {
        const [z, s] = pos.get(c);
        aus += k[z] + k[s];
      }
      return aus;
    }
    const t = normalisieren(pruefeText(text));
    if (t.length % 2) throw new KryptoFehler('Ein Polybios-Geheimtext besteht aus Paaren von Koordinaten.');
    let aus = '';
    for (let i = 0; i < t.length; i += 2) {
      const z = k.indexOf(t[i]);
      const s = k.indexOf(t[i + 1]);
      if (z < 0 || s < 0) throw new KryptoFehler(`Im Geheimtext dürfen nur die Zeichen ${k.split('').join(', ')} vorkommen.`);
      aus += q[z][s];
    }
    return aus;
  }

  /**
   * ADFGVX: Polybios 6×6 mit Kopf ADFGVX, dann Spaltentransposition (unvollständige letzte Zeile, ohne Auffüllen);
   * ent: erst Transposition invertieren, dann Paare lesen. quadrat36: 36-Zeichen-Quadrat, Zeilenliste oder
   * Schlüsselwort (wird wie bei quadrat(…, { groesse: 6 }) ergänzt).
   */
  function adfgvx(text, quadrat36, schluessel, richtung = 'ver') {
    pruefeRichtung(richtung);
    const q = quadrat(quadrat36, { groesse: 6 }).join('');
    spaltenReihenfolge(schluessel); // Schlüssel vorab prüfen
    const opt = { schluessel: q, kopf: 'ADFGVX' };
    if (richtung === 'ver') return spaltentransposition(polybios(text, opt), schluessel);
    const c = normalisieren(pruefeText(text));
    if (/[^ADFGVX]/.test(c)) throw new KryptoFehler('Im Geheimtext dürfen nur die Zeichen A, D, F, G, V, X vorkommen.');
    if (c.length % 2) throw new KryptoFehler('Ein ADFGVX-Geheimtext hat eine gerade Anzahl von Zeichen.');
    return polybios(spaltentransposition(c, schluessel, 'ent'), opt, 'ent');
  }

  // ───────────────────────────── Transposition ─────────────────────────────

  function pruefeFuellzeichenOderNull(f) {
    if (f === null) return null;
    return pruefeFuellzeichen(f, 'Das Füllzeichen', null);
  }

  /** Gartenzaun: Zickzack ab Schiene 1 (oben), Schienen nacheinander lesen, kein Füllzeichen */
  function gartenzaun(text, zeilen, richtung = 'ver') {
    pruefeGanzzahl(zeilen, 'Die Anzahl der Schienen');
    if (zeilen < 2) throw new KryptoFehler('Ein Gartenzaun hat mindestens 2 Schienen.');
    pruefeRichtung(richtung);
    const t = nurBuchstaben(text);
    // Schiene je Position im Zickzack
    const muster = [];
    let z = 0;
    let d = 1;
    for (let i = 0; i < t.length; i++) {
      muster.push(z);
      if (z === 0) d = 1;
      else if (z === zeilen - 1) d = -1;
      z += d;
    }
    // Lesereihenfolge: Positionen nach Schiene, innerhalb der Schiene von links nach rechts
    const reihenfolge = muster.map((r, i) => i).sort((a, b) => muster[a] - muster[b] || a - b);
    const aus = new Array(t.length);
    reihenfolge.forEach((pos, k) => {
      if (richtung === 'ver') aus[k] = t[pos];
      else aus[pos] = t[k];
    });
    return aus.join('');
  }

  /**
   * Skytale (W0): Raster mit umfang Zeilen und m = ⌈n/umfang⌉ Spalten zeilenweise füllen, spaltenweise lesen;
   * leere Zellen am Ende mit dem Füllzeichen (Standard X); fuellzeichen: null überspringt sie.
   * ent: Mit Füllzeichen muss die Länge ein Vielfaches von umfang sein; Füllzeichen bleiben stehen.
   */
  function skytale(text, umfang, richtung = 'ver', { fuellzeichen = 'X' } = {}) {
    pruefeGanzzahl(umfang, 'Der Umfang');
    if (umfang < 2) throw new KryptoFehler('Der Umfang der Skytale muss mindestens 2 sein.');
    pruefeRichtung(richtung);
    const f = pruefeFuellzeichenOderNull(fuellzeichen);
    let t = nurBuchstaben(text);
    if (richtung === 'ent' && f !== null && t.length % umfang) {
      throw new KryptoFehler('Die Länge des Geheimtextes muss ein Vielfaches des Umfangs sein.');
    }
    const m = Math.ceil(t.length / umfang);
    if (richtung === 'ver' && f !== null) t += f.repeat(umfang * m - t.length);
    const n = t.length; // belegte Zellen: die ersten n in Zeilenreihenfolge
    const zellen = [];
    for (let s = 0; s < m; s++) for (let z = 0; z < umfang; z++) if (z * m + s < n) zellen.push(z * m + s);
    const aus = new Array(n);
    zellen.forEach((pos, k) => {
      if (richtung === 'ver') aus[k] = t[pos];
      else aus[pos] = t[k];
    });
    return aus.join('');
  }

  function drehe(feld, groesse, drehung) {
    const [z, s] = feld;
    return drehung === 'rechts' ? [s, groesse + 1 - z] : [groesse + 1 - s, z];
  }

  /** Prüft eine Drehschablone: { ok, fehler, abgedeckt } – jedes Feld genau einmal frei über 4 Drehungen */
  function schablonePruefen(groesse, schablone) {
    const fehler = [];
    if (!Number.isInteger(groesse) || groesse < 2 || groesse % 2) {
      return { ok: false, fehler: ['Die Größe der Schablone muss eine gerade Zahl ab 2 sein.'], abgedeckt: 0 };
    }
    if (!Array.isArray(schablone)) return { ok: false, fehler: ['Die Schablone muss eine Liste von Löchern sein.'], abgedeckt: 0 };
    const soll = (groesse * groesse) / 4;
    if (schablone.length !== soll) fehler.push(`Die Schablone braucht genau ${soll} Löcher.`);
    const loecher = [];
    for (const l of schablone) {
      const ok = Array.isArray(l) && l.length === 2 && l.every((v) => Number.isInteger(v) && v >= 1 && v <= groesse);
      if (!ok) fehler.push(`Das Loch ${JSON.stringify(l)} liegt nicht im Raster ${groesse} × ${groesse}.`);
      else loecher.push(l);
    }
    const zaehler = new Map();
    let stellung = loecher;
    for (let r = 0; r < 4; r++) {
      for (const [z, s] of stellung) zaehler.set(`${z},${s}`, (zaehler.get(`${z},${s}`) || 0) + 1);
      stellung = stellung.map((l) => drehe(l, groesse, 'rechts'));
    }
    for (const [feld, n] of zaehler) if (n > 1) fehler.push(`Feld (${feld}) wird mehrfach frei.`);
    return { ok: fehler.length === 0, fehler, abgedeckt: zaehler.size };
  }

  /**
   * Fleißner-Drehschablone (W0): Löcher (Zeile, Spalte ab 1) in Grundstellung; je Stellung Löcher zeilenweise von
   * links oben füllen, dann 90° drehen (rechts: (z, s) → (s, n + 1 − z)); Raster zeilenweise lesen. Blöcke zu
   * groesse² Zeichen, letzter Block mit Füllzeichen. ent: Länge Vielfaches von groesse², Füllzeichen bleiben stehen.
   */
  function fleissner(text, groesse, schablone, richtung = 'ver', { drehung = 'rechts', fuellzeichen = 'X' } = {}) {
    pruefeRichtung(richtung);
    if (drehung !== 'rechts' && drehung !== 'links') throw new KryptoFehler('Die Drehung muss „rechts“ oder „links“ sein.');
    const f = pruefeFuellzeichen(fuellzeichen, 'Das Füllzeichen', null);
    const pruefung = schablonePruefen(groesse, schablone);
    if (!pruefung.ok) throw new KryptoFehler(`Ungültige Schablone: ${pruefung.fehler[0]}`);
    const flaeche = groesse * groesse;
    // Füllreihenfolge der Felder (0-basierte Rasterindizes)
    const reihenfolge = [];
    let stellung = schablone.map((l) => l.slice());
    for (let r = 0; r < 4; r++) {
      const sortiert = stellung.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
      for (const [z, s] of sortiert) reihenfolge.push((z - 1) * groesse + (s - 1));
      stellung = stellung.map((l) => drehe(l, groesse, drehung));
    }
    let t = nurBuchstaben(text);
    if (richtung === 'ent' && t.length % flaeche) {
      throw new KryptoFehler(`Die Länge des Geheimtextes muss ein Vielfaches von ${flaeche} sein.`);
    }
    if (richtung === 'ver' && t.length % flaeche) t += f.repeat(flaeche - (t.length % flaeche));
    let aus = '';
    for (let b = 0; b < t.length; b += flaeche) {
      const block = t.slice(b, b + flaeche);
      const raster = new Array(flaeche);
      if (richtung === 'ver') {
        reihenfolge.forEach((pos, k) => (raster[pos] = block[k]));
        aus += raster.join('');
      } else {
        aus += reihenfolge.map((pos) => block[pos]).join('');
      }
    }
    return aus;
  }

  /** Wort → Rangfolge 1…n (alphabetisch, gleiche Buchstaben von links nach rechts); Zahlenliste wird übernommen */
  function spaltenReihenfolge(schluessel) {
    if (Array.isArray(schluessel)) {
      const n = schluessel.length;
      const ok = n > 0 && schluessel.every((r) => Number.isInteger(r) && r >= 1 && r <= n) && new Set(schluessel).size === n;
      if (!ok) throw new KryptoFehler('Eine Zahlenfolge als Schlüssel muss jede Zahl von 1 bis n genau einmal enthalten.');
      return schluessel.slice();
    }
    const w = schluesselBuchstaben(schluessel);
    const idx = [...w].map((c, i) => i).sort((a, b) => (w[a] < w[b] ? -1 : w[a] > w[b] ? 1 : a - b));
    const rang = new Array(w.length);
    idx.forEach((i, r) => (rang[i] = r + 1));
    return rang;
  }

  /**
   * Spaltentransposition (W3 Baukasten): zeilenweise in n = Schlüssellänge Spalten schreiben, Spalten in der
   * Rangfolge von oben nach unten lesen; unvollständige letzte Zeile erlaubt (die ersten L mod n Spalten sind
   * länger), Standard ohne Auffüllen; mit fuellzeichen wird das Rechteck aufgefüllt. ent entfernt nichts.
   */
  function spaltentransposition(text, schluessel, richtung = 'ver', { fuellzeichen = null } = {}) {
    pruefeRichtung(richtung);
    const rang = spaltenReihenfolge(schluessel);
    const f = pruefeFuellzeichenOderNull(fuellzeichen);
    const n = rang.length;
    let t = nurBuchstaben(text);
    if (richtung === 'ver') {
      if (f !== null && t.length % n) t += f.repeat(n - (t.length % n));
      let aus = '';
      for (let r = 1; r <= n; r++) {
        const sp = rang.indexOf(r);
        for (let i = sp; i < t.length; i += n) aus += t[i];
      }
      return aus;
    }
    const L = t.length;
    const spalten = new Array(n);
    let p = 0;
    for (let r = 1; r <= n; r++) {
      const sp = rang.indexOf(r);
      const laenge = Math.floor(L / n) + (sp < L % n ? 1 : 0);
      spalten[sp] = t.slice(p, p + laenge);
      p += laenge;
    }
    let aus = '';
    for (let i = 0; i < L; i++) aus += spalten[i % n][Math.floor(i / n)];
    return aus;
  }

  /** Text rückwärts (normalisiert) */
  function umkehrung(text) {
    return [...nurBuchstaben(text)].reverse().join('');
  }

  /**
   * Blockrotation: Folge (Text oder Liste von Bytes 0–255) in Blöcke zu `block`; jeder Block um `um` nach links
   * (ein kürzerer letzter Block der Länge m um `um mod m`); ent nach rechts. Text wird normalisiert.
   */
  function blockrotation(folge, block, um, richtung = 'ver') {
    pruefeGanzzahl(block, 'Die Blocklänge');
    if (block < 2) throw new KryptoFehler('Die Blocklänge muss mindestens 2 sein.');
    pruefeGanzzahl(um, 'Die Drehung');
    pruefeRichtung(richtung);
    let elemente;
    const istListe = Array.isArray(folge);
    if (istListe) {
      if (!folge.every((b) => Number.isInteger(b) && b >= 0 && b <= 255)) {
        throw new KryptoFehler('Bytes müssen ganze Zahlen von 0 bis 255 sein.');
      }
      elemente = folge.slice();
    } else {
      elemente = [...nurBuchstaben(folge)];
    }
    const aus = [];
    for (let i = 0; i < elemente.length; i += block) {
      const teil = elemente.slice(i, i + block);
      const r = mod(richtung === 'ver' ? um : -um, teil.length);
      aus.push(...teil.slice(r), ...teil.slice(0, r));
    }
    return istListe ? aus : aus.join('');
  }

  /** Skytale-Raster (W0 §9.1): umfang Zeilen (2–30) mit m = ⌈n/umfang⌉ Spalten, zeilenweise gefüllt */
  function skytaleRaster(text, umfang, { fuellzeichen = 'X' } = {}) {
    pruefeGanzzahl(umfang, 'Der Umfang');
    if (umfang < 2 || umfang > 30) throw new KryptoFehler('Der Umfang der Skytale liegt zwischen 2 und 30.');
    const f = pruefeFuellzeichenOderNull(fuellzeichen);
    let t = nurBuchstaben(text);
    const m = Math.ceil(t.length / umfang);
    if (f !== null) t += f.repeat(umfang * m - t.length);
    const zeilen = [];
    for (let z = 0; z < umfang; z++) zeilen.push(t.slice(z * m, (z + 1) * m));
    return zeilen;
  }

  /** Schiene (ab 0) je Position im Zickzack des Gartenzauns; zeilen 2–10, laenge ≥ 0 */
  function gartenzaunSchienen(laenge, zeilen) {
    pruefeGanzzahl(laenge, 'Die Länge');
    if (laenge < 0) throw new KryptoFehler('Die Länge darf nicht negativ sein.');
    pruefeGanzzahl(zeilen, 'Die Anzahl der Schienen');
    if (zeilen < 2 || zeilen > 10) throw new KryptoFehler('Ein Gartenzaun hat 2 bis 10 Schienen.');
    const muster = [];
    let z = 0;
    let d = 1;
    for (let i = 0; i < laenge; i++) {
      muster.push(z);
      if (z === 0) d = 1;
      else if (z === zeilen - 1) d = -1;
      z += d;
    }
    return muster;
  }

  function pruefeSchablonenGroesse(groesse) {
    if (!Number.isInteger(groesse) || groesse < 2 || groesse > 10 || groesse % 2) {
      throw new KryptoFehler('Die Größe der Schablone muss eine gerade Zahl von 2 bis 10 sein.');
    }
    return groesse;
  }

  /**
   * Fleißner-Stellungen (W0 §9.1): vier Listen der Löcher [z, s] (ab 1) je Stellung, zeilenweise sortiert; prüft nur
   * die Größe und dass jedes Loch im Raster liegt (auch unvollständige Schablonen).
   */
  function fleissnerStellungen(groesse, loecher, { drehung = 'rechts' } = {}) {
    pruefeSchablonenGroesse(groesse);
    if (drehung !== 'rechts' && drehung !== 'links') throw new KryptoFehler('Die Drehung muss „rechts“ oder „links“ sein.');
    if (!Array.isArray(loecher)) throw new KryptoFehler('Die Schablone muss eine Liste von Löchern sein.');
    for (const l of loecher) {
      const ok = Array.isArray(l) && l.length === 2 && l.every((v) => Number.isInteger(v) && v >= 1 && v <= groesse);
      if (!ok) throw new KryptoFehler(`Das Loch ${JSON.stringify(l)} liegt nicht im Raster ${groesse} × ${groesse}.`);
    }
    const aus = [];
    let stellung = loecher.map((l) => l.slice());
    for (let r = 0; r < 4; r++) {
      aus.push(stellung.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]));
      stellung = stellung.map((l) => drehe(l, groesse, drehung));
    }
    return aus;
  }

  /** Drehgruppen: Matrix groesse × groesse mit Gruppennummer (ab 0, Reihenfolge des ersten Auftretens zeilenweise) */
  function fleissnerDrehgruppen(groesse) {
    pruefeSchablonenGroesse(groesse);
    const gruppe = Array.from({ length: groesse }, () => new Array(groesse).fill(-1));
    let naechste = 0;
    for (let z = 1; z <= groesse; z++) {
      for (let s = 1; s <= groesse; s++) {
        if (gruppe[z - 1][s - 1] >= 0) continue;
        let feld = [z, s];
        for (let r = 0; r < 4; r++) {
          gruppe[feld[0] - 1][feld[1] - 1] = naechste;
          feld = drehe(feld, groesse, 'rechts');
        }
        naechste++;
      }
    }
    return gruppe;
  }

  /** Ring (W6 §2): Felder 0 … n − 1 ab Feld 0 in Sprüngen von t gelesen; n 4–12, t 1 … n − 1 */
  function ringFolge(n, t) {
    pruefeGanzzahl(n, 'Die Feldzahl');
    if (n < 4 || n > 12) throw new KryptoFehler('Ein Ring hat 4 bis 12 Felder.');
    pruefeGanzzahl(t, 'Der Ringschritt');
    if (t < 1 || t > n - 1) throw new KryptoFehler(`Der Ringschritt liegt zwischen 1 und ${n - 1}.`);
    const folge = [];
    for (let i = 0; i < n; i++) folge.push((i * t) % n);
    const nieGelesen = [];
    for (let f = 0; f < n; f++) if (!folge.includes(f)) nieGelesen.push(f);
    return { folge, nieGelesen };
  }

  /**
   * Ring-Transposition (W6 §2, Eves Uhrwerk Stufe 1): Blöcke zu `block` Zeichen (letzter mit Füllzeichen), gelesen in
   * ringFolge(block, t).folge; t und block müssen teilerfremd sein; ent verlangt eine Länge als Vielfaches von block.
   */
  function ring(text, t, richtung = 'ver', { block = 8, fuellzeichen = 'X' } = {}) {
    pruefeRichtung(richtung);
    const { folge } = ringFolge(block, t);
    if (ggT(t, block) !== 1) throw new KryptoFehler('Der Ring ist nicht umkehrbar – t und n müssen teilerfremd sein.');
    const f = pruefeFuellzeichen(fuellzeichen, 'Das Füllzeichen', null);
    let s = nurBuchstaben(text);
    if (richtung === 'ent' && s.length % block) {
      throw new KryptoFehler(`Die Länge des Geheimtextes muss ein Vielfaches von ${block} sein.`);
    }
    if (s.length % block) s += f.repeat(block - (s.length % block));
    let aus = '';
    for (let b = 0; b < s.length; b += block) {
      const teil = s.slice(b, b + block);
      if (richtung === 'ver') {
        aus += folge.map((feld) => teil[feld]).join('');
      } else {
        const felder = new Array(block);
        folge.forEach((feld, j) => (felder[feld] = teil[j]));
        aus += felder.join('');
      }
    }
    return aus;
  }

  // ───────────────────────────── Bits, ASCII, XOR ─────────────────────────────

  /** ASCII-Wert eines Zeichens (EH-Anlage: nur 32–126) */
  function ascii(zeichen) {
    pruefeText(zeichen, 'Zeichen');
    if (zeichen.length !== 1) throw new KryptoFehler('Es wird genau ein Zeichen erwartet.');
    const n = zeichen.charCodeAt(0);
    if (n < 32 || n > 126) throw new KryptoFehler('Nur Zeichen mit ASCII-Wert 32 bis 126 sind erlaubt (keine Umlaute).');
    return n;
  }

  function zeichenAusAscii(n) {
    pruefeGanzzahl(n, 'ASCII-Wert');
    if (n < 32 || n > 126) throw new KryptoFehler('Der ASCII-Wert muss zwischen 32 und 126 liegen.');
    return String.fromCharCode(n);
  }

  /** Text → ASCII-Bytes (nicht normalisiert, Leerzeichen erlaubt, nur 32–126) */
  function textZuBytes(text) {
    return [...pruefeText(text)].map(ascii);
  }

  function bytesZuText(bytes) {
    if (!Array.isArray(bytes)) throw new KryptoFehler('Es wird eine Liste von Bytes erwartet.');
    return bytes.map(zeichenAusAscii).join('');
  }

  function pruefeBytes(bytes) {
    if (!Array.isArray(bytes) || !bytes.every((b) => Number.isInteger(b) && b >= 0 && b <= 255)) {
      throw new KryptoFehler('Bytes müssen ganze Zahlen von 0 bis 255 sein.');
    }
    return bytes;
  }

  /** Zahl → Bitfolge der Breite `breite`, höchstwertiges Bit links */
  function byteZuBits(n, breite = 8) {
    pruefeGanzzahl(n, 'Zahl');
    pruefeGanzzahl(breite, 'Bitbreite');
    if (breite < 1 || breite > 32) throw new KryptoFehler('Die Bitbreite muss zwischen 1 und 32 liegen.');
    if (n < 0 || n >= 2 ** breite) throw new KryptoFehler(`Die Zahl passt nicht in ${breite} Bit.`);
    return n.toString(2).padStart(breite, '0');
  }

  function reineBits(bits) {
    const b = normBits(bits);
    if (/[^01]/.test(b)) throw new KryptoFehler('Eine Bitfolge besteht nur aus 0 und 1.');
    return b;
  }

  function bitsZuByte(bits) {
    const b = reineBits(bits);
    if (b.length === 0 || b.length > 32) throw new KryptoFehler('Es werden 1 bis 32 Bits erwartet.');
    return parseInt(b, 2);
  }

  /** Text → Bits (8 je Zeichen), gruppiert zu `gruppe` Bits (0 = ohne Leerzeichen) */
  function textZuBits(text, { gruppe = 4 } = {}) {
    pruefeGanzzahl(gruppe, 'Gruppengröße');
    if (gruppe < 0) throw new KryptoFehler('Die Gruppengröße darf nicht negativ sein (0 = ohne Gruppen).');
    const bits = textZuBytes(text).map((b) => byteZuBits(b)).join('');
    return gruppe > 0 ? gruppieren(bits, gruppe) : bits;
  }

  function bitsZuText(bits) {
    const b = reineBits(bits);
    if (b.length % 8) throw new KryptoFehler('Die Anzahl der Bits muss ein Vielfaches von 8 sein.');
    let aus = '';
    for (let i = 0; i < b.length; i += 8) aus += zeichenAusAscii(parseInt(b.slice(i, i + 8), 2));
    return aus;
  }

  function bitweise(folgen, op) {
    if (folgen.length < 2) throw new KryptoFehler('Es werden mindestens zwei Bitfolgen erwartet.');
    const b = folgen.map(reineBits);
    if (!b.every((x) => x.length === b[0].length)) throw new KryptoFehler('Die Bitfolgen müssen gleich lang sein.');
    let aus = '';
    for (let i = 0; i < b[0].length; i++) aus += b.map((x) => Number(x[i])).reduce(op);
    return aus;
  }

  /** bitweises XOR gleich langer Bitfolgen (Ergebnis ohne Leerzeichen) */
  function xorBits(...folgen) {
    return bitweise(folgen, (a, b) => a ^ b);
  }

  function undBits(a, b) {
    return bitweise([a, b], (x, y) => x & y);
  }

  function oderBits(a, b) {
    return bitweise([a, b], (x, y) => x | y);
  }

  /** Bytes (Liste) oder KRYPTOS-16-Block (Zahl 0–65535, 4 Hexziffern) → Hex in Großbuchstaben */
  function hex(bytes) {
    if (Number.isInteger(bytes)) {
      if (bytes < 0 || bytes > 0xffff) throw new KryptoFehler('Ein Block hat 16 Bit (0 bis FFFF).');
      return bytes.toString(16).toUpperCase().padStart(4, '0');
    }
    return pruefeBytes(bytes).map((b) => b.toString(16).toUpperCase().padStart(2, '0')).join('');
  }

  function vonHex(text) {
    const h = pruefeText(text).replace(/\s+/g, '').toUpperCase();
    if (/[^0-9A-F]/.test(h) || h.length % 2) throw new KryptoFehler('Hex besteht aus Paaren der Zeichen 0–9 und A–F.');
    const aus = [];
    for (let i = 0; i < h.length; i += 2) aus.push(parseInt(h.slice(i, i + 2), 16));
    return aus;
  }

  /** zyklische Rotation einer Bitfolge nach links (negativ: rechts) */
  function rotiereBits(bits, um) {
    pruefeGanzzahl(um, 'Drehung');
    const b = reineBits(bits);
    if (b.length === 0) return '';
    const r = mod(um, b.length);
    return b.slice(r) + b.slice(0, r);
  }

  /**
   * XOR mit wiederholtem Schlüssel: ver – Text (ASCII 32–126, nicht normalisiert) oder Bytes ⊕ Schlüsselbytes →
   * Hex ohne Leerzeichen; ent – Hex ⊕ Schlüsselbytes → Text (ASCII 32–126). Schlüssel: Text oder Bytes.
   */
  function xor(textOderBytes, schluessel, richtung = 'ver') {
    pruefeRichtung(richtung);
    const k = Array.isArray(schluessel) ? pruefeBytes(schluessel) : textZuBytes(pruefeText(schluessel, 'Schlüssel'));
    if (k.length === 0) throw new KryptoFehler('Der Schlüssel darf nicht leer sein.');
    let daten;
    if (richtung === 'ver') daten = Array.isArray(textOderBytes) ? pruefeBytes(textOderBytes) : textZuBytes(textOderBytes);
    else daten = Array.isArray(textOderBytes) ? pruefeBytes(textOderBytes) : vonHex(textOderBytes);
    const ergebnis = daten.map((b, i) => b ^ k[i % k.length]);
    if (richtung === 'ver') return hex(ergebnis);
    if (!ergebnis.every((b) => b >= 32 && b <= 126)) {
      throw new KryptoFehler('Das Ergebnis enthält Bytes außerhalb von ASCII 32–126 (falscher Schlüssel?).');
    }
    return bytesZuText(ergebnis);
  }

  // ───────────────────────────── KRYPTOS-16 (SPEC W3 §0a) ─────────────────────────────

  const SBOX = [0xc, 0xf, 0x3, 0x9, 0x7, 0xa, 0x8, 0x6, 0x1, 0x2, 0x4, 0xe, 0xb, 0x5, 0xd, 0x0];
  const SBOX_INV = new Array(16);
  SBOX.forEach((v, i) => (SBOX_INV[v] = i));

  function pruefeBlock(x, name = 'Block') {
    if (!Number.isInteger(x) || x < 0 || x > 0xffff) throw new KryptoFehler(`${name} muss eine 16-Bit-Zahl (0 bis FFFF) sein.`);
    return x;
  }

  function pruefeRunden(r) {
    if (!Number.isInteger(r) || r < 1) throw new KryptoFehler('Die Rundenzahl muss eine ganze Zahl ab 1 sein.');
    return r;
  }

  /** K₁ = K, K_{i+1} = K_i um 4 Bit zyklisch nach links */
  function k16Rundenschluessel(schluessel16, runde) {
    pruefeBlock(schluessel16, 'Der Schlüssel');
    pruefeRunden(runde);
    const r = ((runde - 1) % 4) * 4;
    return ((schluessel16 << r) | (schluessel16 >>> (16 - r))) & 0xffff;
  }

  /** S-Box (ent: S⁻¹) auf jede Zeile = Vierergruppe */
  function k16Sbox(block16, richtung = 'ver') {
    pruefeBlock(block16);
    pruefeRichtung(richtung);
    const t = richtung === 'ver' ? SBOX : SBOX_INV;
    let aus = 0;
    for (let z = 0; z < 4; z++) aus |= t[(block16 >>> (12 - 4 * z)) & 0xf] << (12 - 4 * z);
    return aus;
  }

  /** Transposition der 4×4-Bitmatrix: Bit (z, s) → (s, z); selbstinvers */
  function k16Transponiere(block16) {
    pruefeBlock(block16);
    let aus = 0;
    for (let z = 0; z < 4; z++) {
      for (let s = 0; s < 4; s++) {
        const bit = (block16 >>> (15 - (4 * z + s))) & 1;
        aus |= bit << (15 - (4 * s + z));
      }
    }
    return aus;
  }

  function pruefeSboxOption(sbox) {
    if (typeof sbox !== 'boolean') throw new KryptoFehler('Die Option sbox ist true oder false.');
    return sbox;
  }

  /** eine Runde: ver XOR → S-Box → Transposition; ent Transposition → S⁻¹ → XOR; sbox: false lässt Schritt (2) weg */
  function k16Runde(block16, rundenschluessel, richtung = 'ver', { sbox = true } = {}) {
    pruefeBlock(block16);
    pruefeBlock(rundenschluessel, 'Der Rundenschlüssel');
    pruefeRichtung(richtung);
    pruefeSboxOption(sbox);
    const S = (x, r) => (sbox ? k16Sbox(x, r) : x);
    if (richtung === 'ver') return k16Transponiere(S(block16 ^ rundenschluessel, 'ver'));
    return S(k16Transponiere(block16), 'ent') ^ rundenschluessel;
  }

  function k16Verschluesseln(block16, schluessel16, { runden = 4, protokoll = false, sbox = true } = {}) {
    pruefeBlock(block16);
    pruefeBlock(schluessel16, 'Der Schlüssel');
    pruefeRunden(runden);
    pruefeSboxOption(sbox);
    let x = block16;
    const liste = [];
    for (let r = 1; r <= runden; r++) {
      const k = k16Rundenschluessel(schluessel16, r);
      const nachXor = x ^ k;
      const nachSBox = sbox ? k16Sbox(nachXor) : nachXor;
      const nachTransposition = k16Transponiere(nachSBox);
      if (protokoll) liste.push({ runde: r, eingang: x, schluessel: k, nachXor, nachSBox, nachTransposition });
      x = nachTransposition;
    }
    return protokoll ? { ergebnis: x, runden: liste } : x;
  }

  function k16Entschluesseln(block16, schluessel16, { runden = 4, sbox = true } = {}) {
    pruefeBlock(block16);
    pruefeBlock(schluessel16, 'Der Schlüssel');
    pruefeRunden(runden);
    pruefeSboxOption(sbox);
    let x = block16;
    for (let r = runden; r >= 1; r--) x = k16Runde(x, k16Rundenschluessel(schluessel16, r), 'ent', { sbox });
    return x;
  }

  /** Lawine: je Runde die Bitpositionen (1 = höchstwertig … 16), die sich unterscheiden, wenn Bit `bit` kippt */
  function k16Lawine(block16, schluessel16, bit, { runden = 4, sbox = true } = {}) {
    pruefeGanzzahl(bit, 'Bitposition');
    if (bit < 1 || bit > 16) throw new KryptoFehler('Die Bitposition liegt zwischen 1 und 16.');
    const a = k16Verschluesseln(block16, schluessel16, { runden, protokoll: true, sbox }).runden;
    const b = k16Verschluesseln(block16 ^ (1 << (16 - bit)), schluessel16, { runden, protokoll: true, sbox }).runden;
    return a.map((ra, i) => {
      const d = ra.nachTransposition ^ b[i].nachTransposition;
      const positionen = [];
      for (let p = 1; p <= 16; p++) if ((d >>> (16 - p)) & 1) positionen.push(p);
      return { runde: ra.runde, positionen, anzahl: positionen.length };
    });
  }

  /** Betriebsmodi ECB/CBC auf einer Liste von 16-Bit-Blöcken (CBC: Cⱼ = E(Pⱼ ⊕ Cⱼ₋₁), C₀ = IV) */
  function k16Modus(bloecke, schluessel, art, iv = null, { richtung = 'ver', runden = 4 } = {}) {
    if (!Array.isArray(bloecke)) throw new KryptoFehler('Es wird eine Liste von Blöcken erwartet.');
    bloecke.forEach((b) => pruefeBlock(b));
    pruefeRichtung(richtung);
    if (art !== 'ECB' && art !== 'CBC') throw new KryptoFehler('Der Betriebsmodus muss „ECB“ oder „CBC“ sein.');
    if (art === 'CBC') pruefeBlock(iv, 'Der Initialisierungsvektor');
    const E = (x) => k16Verschluesseln(x, schluessel, { runden });
    const D = (x) => k16Entschluesseln(x, schluessel, { runden });
    if (art === 'ECB') return bloecke.map(richtung === 'ver' ? E : D);
    const aus = [];
    let vorher = iv;
    for (const b of bloecke) {
      if (richtung === 'ver') {
        vorher = E(b ^ vorher);
        aus.push(vorher);
      } else {
        aus.push(D(b) ^ vorher);
        vorher = b;
      }
    }
    return aus;
  }

  /** Text → 16-Bit-Blöcke mit Auffüllen (immer): ungerade → Byte 01, gerade → Block 0202 (§0a.7) */
  function k16TextZuBloecken(text) {
    const bytes = textZuBytes(text);
    if (bytes.length % 2) bytes.push(1);
    else bytes.push(2, 2);
    const aus = [];
    for (let i = 0; i < bytes.length; i += 2) aus.push((bytes[i] << 8) | bytes[i + 1]);
    return aus;
  }

  /** Blöcke → Text, Füllbytes werden geprüft und entfernt */
  function k16BloeckeZuText(bloecke) {
    if (!Array.isArray(bloecke) || bloecke.length === 0) throw new KryptoFehler('Es wird eine nicht leere Liste von Blöcken erwartet.');
    const bytes = [];
    for (const b of bloecke) bytes.push(pruefeBlock(b) >>> 8, b & 0xff);
    const n = bytes[bytes.length - 1];
    if ((n !== 1 && n !== 2) || (n === 2 && bytes[bytes.length - 2] !== 2)) {
      throw new KryptoFehler('Die Füllbytes am Ende sind ungültig (01 bzw. 02 02 erwartet).');
    }
    return bytesZuText(bytes.slice(0, bytes.length - n));
  }

  const BITWEG_VARIANTEN = ['kryptos16', 'ohneSBox', 'rm16'];

  /** Bitnummer 1…16 (b1 = MSB) → [Zeile, Spalte] ab 0 und zurück */
  const bitZS = (p) => [Math.floor((p - 1) / 4), (p - 1) % 4];
  const zsBit = (z, s) => 4 * z + s + 1;
  const aufsteigend = (liste) => [...new Set(liste)].sort((a, b) => a - b);

  /**
   * Bit-Verfolgung (W3 §9.2): Weg eines Klartextbits durch die Runden als Mengen von Bitnummern. XOR behält die
   * Positionen (schluessel = beteiligte Bits der ursprünglichen Schlüsselmatrix K); Mitte: S-Box → alle vier Bits der
   * betroffenen Zeilen („beeinflusst“), ohne S-Box unverändert, RM-16 Zeilenrotation; Transposition (z, s) → (s, z).
   */
  function k16Bitweg(bit, { variante = 'kryptos16', runden = null } = {}) {
    pruefeGanzzahl(bit, 'Bitposition');
    if (bit < 1 || bit > 16) throw new KryptoFehler('Die Bitposition liegt zwischen 1 und 16.');
    if (!BITWEG_VARIANTEN.includes(variante)) throw new KryptoFehler('Die Variante ist „kryptos16“, „ohneSBox“ oder „rm16“.');
    const r = runden === null || runden === undefined ? (variante === 'rm16' ? 3 : 4) : runden;
    pruefeRunden(r);
    if (r > 16) throw new KryptoFehler('Die Bit-Verfolgung zeigt höchstens 16 Runden.');
    let menge = [bit];
    const liste = [];
    const schluesselbits = [];
    for (let i = 1; i <= r; i++) {
      const nachXor = menge.slice();
      const schluessel = aufsteigend(nachXor.map((p) => ((p - 1 + 4 * (i - 1)) % 16) + 1));
      let nachMitte;
      if (variante === 'kryptos16') {
        const zeilen = new Set(nachXor.map((p) => bitZS(p)[0]));
        nachMitte = aufsteigend([...zeilen].flatMap((z) => [0, 1, 2, 3].map((s) => zsBit(z, s))));
      } else if (variante === 'ohneSBox') {
        nachMitte = nachXor.slice();
      } else {
        nachMitte = aufsteigend(nachXor.map((p) => {
          const [z, s] = bitZS(p);
          return zsBit(z, mod(s - z, 4));
        }));
      }
      const nachTransposition = aufsteigend(nachMitte.map((p) => {
        const [z, s] = bitZS(p);
        return zsBit(s, z);
      }));
      for (const k of schluessel) if (!schluesselbits.includes(k)) schluesselbits.push(k);
      liste.push({ runde: i, nachXor, nachMitte, nachTransposition, schluessel });
      menge = nachTransposition;
    }
    return { runden: liste, ende: menge, schluesselbits };
  }

  /** Schwarz-Weiß-Raster (Zeilen aus # . bzw. 1 0, Maße Vielfache von 4) → Blöcke, Kachel = 4 × 4 Pixel = b1 … b16 */
  function k16Kacheln(raster) {
    if (!Array.isArray(raster) || raster.length === 0 || !raster.every((z) => typeof z === 'string')) {
      throw new KryptoFehler('Das Bild ist eine Liste von Zeilen.');
    }
    const hoehe = raster.length;
    const breite = raster[0].length;
    if (breite === 0 || breite % 4 || hoehe % 4 || !raster.every((z) => z.length === breite)) {
      throw new KryptoFehler('Breite und Höhe des Bildes müssen Vielfache von 4 sein (alle Zeilen gleich lang).');
    }
    if (!raster.every((z) => /^[#.10]*$/.test(z))) throw new KryptoFehler('Ein Bild besteht nur aus # und . (oder 1 und 0).');
    const bloecke = [];
    for (let ty = 0; ty < hoehe; ty += 4) {
      for (let tx = 0; tx < breite; tx += 4) {
        let w = 0;
        for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) w = 2 * w + ('#1'.includes(raster[ty + y][tx + x]) ? 1 : 0);
        bloecke.push(w);
      }
    }
    return bloecke;
  }

  /** Blöcke → Raster aus # und . mit `breite` Pixeln je Zeile (Vielfaches von 4) */
  function k16AusKacheln(bloecke, breite) {
    if (!Array.isArray(bloecke) || bloecke.length === 0) throw new KryptoFehler('Es wird eine nicht leere Liste von Blöcken erwartet.');
    bloecke.forEach((b) => pruefeBlock(b));
    pruefeGanzzahl(breite, 'Die Breite');
    if (breite < 4 || breite % 4) throw new KryptoFehler('Die Breite muss ein Vielfaches von 4 sein.');
    const jeZeile = breite / 4;
    if (bloecke.length % jeZeile) throw new KryptoFehler('Die Zahl der Blöcke passt nicht zur Breite.');
    const zeilen = [];
    for (let k = 0; k < bloecke.length; k += jeZeile) {
      for (let y = 0; y < 4; y++) {
        let zeile = '';
        for (let j = 0; j < jeZeile; j++) {
          const bits = byteZuBits(bloecke[k + j], 16).slice(4 * y, 4 * y + 4);
          zeile += bits.replace(/1/g, '#').replace(/0/g, '.');
        }
        zeilen.push(zeile);
      }
    }
    return zeilen;
  }

  const kryptos16 = {
    SBOX: SBOX.slice(),
    SBOX_INV: SBOX_INV.slice(),
    rundenschluessel: k16Rundenschluessel,
    sbox: k16Sbox,
    transponiere: k16Transponiere,
    runde: k16Runde,
    verschluesseln: k16Verschluesseln,
    entschluesseln: k16Entschluesseln,
    lawine: k16Lawine,
    modus: k16Modus,
    textZuBloecken: k16TextZuBloecken,
    bloeckeZuText: k16BloeckeZuText,
    bitweg: k16Bitweg,
    kacheln: k16Kacheln,
    ausKacheln: k16AusKacheln,
  };

  // ───────────────────────────── RM-16 (SPEC W3 §6 Abbildung 1) ─────────────────────────────

  /** Zeilenrotation: Zeile z (ab 1) um z − 1 Stellen zyklisch nach links (ent: nach rechts) */
  function rm16Rotation(block16, richtung) {
    let aus = 0;
    for (let z = 0; z < 4; z++) {
      const zeile = (block16 >>> (12 - 4 * z)) & 0xf;
      const r = richtung === 'ver' ? z : (4 - z) % 4;
      aus |= (((zeile << r) | (zeile >>> (4 - r))) & 0xf) << (12 - 4 * z);
    }
    return aus;
  }

  /** K₁ = K, Kᵢ₊₁ = Kᵢ mit allen Zeilen eine Zeile nach oben (Zeile 1 wird Zeile 4) */
  function rm16Rundenschluessel(schluessel16, runde) {
    return k16Rundenschluessel(schluessel16, runde);
  }

  /** eine Runde: ver (1) XOR, (2) Zeilenrotation, (3) Transposition; ent umgekehrt */
  function rm16Runde(block16, rundenschluessel, richtung = 'ver') {
    pruefeBlock(block16);
    pruefeBlock(rundenschluessel, 'Der Rundenschlüssel');
    pruefeRichtung(richtung);
    if (richtung === 'ver') return k16Transponiere(rm16Rotation(block16 ^ rundenschluessel, 'ver'));
    return rm16Rotation(k16Transponiere(block16), 'ent') ^ rundenschluessel;
  }

  function rm16Verschluesseln(block16, schluessel16, { runden = 3, protokoll = false } = {}) {
    pruefeBlock(block16);
    pruefeBlock(schluessel16, 'Der Schlüssel');
    pruefeRunden(runden);
    let x = block16;
    const liste = [];
    for (let r = 1; r <= runden; r++) {
      const k = rm16Rundenschluessel(schluessel16, r);
      const nachXor = x ^ k;
      const nachRotation = rm16Rotation(nachXor, 'ver');
      const nachTransposition = k16Transponiere(nachRotation);
      if (protokoll) liste.push({ runde: r, eingang: x, schluessel: k, nachXor, nachRotation, nachTransposition });
      x = nachTransposition;
    }
    return protokoll ? { ergebnis: x, runden: liste } : x;
  }

  function rm16Entschluesseln(block16, schluessel16, { runden = 3 } = {}) {
    pruefeBlock(block16);
    pruefeBlock(schluessel16, 'Der Schlüssel');
    pruefeRunden(runden);
    let x = block16;
    for (let r = runden; r >= 1; r--) x = rm16Runde(x, rm16Rundenschluessel(schluessel16, r), 'ent');
    return x;
  }

  const rm16 = {
    rundenschluessel: rm16Rundenschluessel,
    runde: rm16Runde,
    verschluesseln: rm16Verschluesseln,
    entschluesseln: rm16Entschluesseln,
  };

  // ───────────────────────────── Mini-Enigma (SPEC W3 Kür K2) ─────────────────────────────

  const ME = 'ABCDEFGH';

  /** Walze (Bilder von A … H, Permutation) und Reflektor (fixpunktfreie Involution) prüfen → Indexlisten */
  function meVerdrahtung(optionen) {
    const { walze = 'DAHBFCGE', reflektor = 'EGHFADBC' } = optionen || {};
    const w = pruefeText(walze, 'Die Walze').toUpperCase();
    if (!/^[A-H]{8}$/.test(w) || new Set(w).size !== 8) throw new KryptoFehler('Die Walze ordnet A … H jeweils einen anderen Buchstaben A–H zu.');
    const r = pruefeText(reflektor, 'Der Reflektor').toUpperCase();
    const ok = /^[A-H]{8}$/.test(r) && [...r].every((c, i) => c !== ME[i] && r[ME.indexOf(c)] === ME[i]);
    if (!ok) throw new KryptoFehler('Der Reflektor verbindet A … H paarweise (jeder Buchstabe mit einem anderen).');
    const W = [...w].map((c) => ME.indexOf(c));
    const Winv = new Array(8);
    W.forEach((b, a) => (Winv[b] = a));
    return { W, Winv, R: [...r].map((c) => ME.indexOf(c)) };
  }

  function meBuchstabe(x, name) {
    const b = pruefeText(x, name).toUpperCase();
    if (!/^[A-H]$/.test(b)) throw new KryptoFehler(`${name} ist ein Buchstabe A–H.`);
    return ME.indexOf(b);
  }

  /** Stationen x + s, W, − s, R, + s, W⁻¹, − s (alles mod 8) */
  function meStationen(x, s, v) {
    const a = (x + s) % 8;
    const b = v.W[a];
    const c = mod(b - s, 8);
    const d = v.R[c];
    const e = (d + s) % 8;
    const f = v.Winv[e];
    return [a, b, c, d, e, f, mod(f - s, 8)];
  }

  /**
   * Mini-Enigma (W3 K2): erster Buchstabe in der Startstellung, danach vor jedem Buchstaben eine Stellung weiter;
   * x ↦ W⁻¹(R(W(x + s) − s) + s) − s. Nur A–H; involutorisch (richtung wird nur geprüft).
   */
  function miniEnigma(text, stellung = 'A', richtung = 'ver', optionen = {}) {
    pruefeRichtung(richtung);
    const v = meVerdrahtung(optionen);
    const s0 = meBuchstabe(stellung, 'Die Stellung');
    const t = nurBuchstaben(text);
    if (/[^A-H]/.test(t)) throw new KryptoFehler('Die Mini-Enigma kennt nur die Buchstaben A–H.');
    let aus = '';
    for (let i = 0; i < t.length; i++) aus += ME[meStationen(ME.indexOf(t[i]), (s0 + i) % 8, v)[6]];
    return aus;
  }

  /** Bild von A … H in einer Stellung (Zeile der Stellungstabelle) */
  miniEnigma.tabelle = function (stellung = 'A', optionen = {}) {
    const v = meVerdrahtung(optionen);
    const s = meBuchstabe(stellung, 'Die Stellung');
    return [...ME].map((c, x) => ME[meStationen(x, s, v)[6]]).join('');
  };

  /** Stromweg eines Buchstabens: { eingang, stationen (7 Buchstaben), ausgang } */
  miniEnigma.weg = function (buchstabe, stellung = 'A', optionen = {}) {
    const v = meVerdrahtung(optionen);
    const x = meBuchstabe(buchstabe, 'Der Buchstabe');
    const s = meBuchstabe(stellung, 'Die Stellung');
    const stationen = meStationen(x, s, v).map((i) => ME[i]);
    return { eingang: ME[x], stationen, ausgang: stationen[6] };
  };

  // ───────────────────────────── KRYPTOS-Hash (SPEC W5 §0a) ─────────────────────────────

  /** KH: normalisieren (nur Buchstaben), A = 1 … Z = 26, h = 0, je Buchstabe h ← (3h + w) mod 29 */
  function kryptosHash(text, { protokoll = false } = {}) {
    let h = 0;
    const schritte = [];
    for (const c of nurBuchstaben(text)) {
      const w = ALPHABET.indexOf(c) + 1;
      const summe = 3 * h + w;
      const nachher = summe % 29;
      if (protokoll) schritte.push({ buchstabe: c.toLowerCase(), w, vorher: h, summe, nachher });
      h = nachher;
    }
    return protokoll ? { wert: h, schritte } : { wert: h };
  }

  /** erste Kollision in kürzester-zuerst-Reihenfolge über `alphabet` (Standard a–z), höchstens `max` Versuche */
  kryptosHash.kollisionSuchen = function (text, { max = 10000, alphabet = 'abcdefghijklmnopqrstuvwxyz' } = {}) {
    pruefeGanzzahl(max, 'Höchstzahl der Versuche');
    const zeichen = [...new Set(nurBuchstaben(pruefeText(alphabet, 'Alphabet')).toLowerCase())];
    if (zeichen.length === 0) throw new KryptoFehler('Das Alphabet muss mindestens einen Buchstaben enthalten.');
    const ziel = kryptosHash(text).wert;
    const eigen = nurBuchstaben(text);
    let versuche = 0;
    const stellen = [0];
    while (versuche < max) {
      const kandidat = stellen.map((i) => zeichen[i]).join('');
      // der Text selbst ist kein Kandidat: weder Kollision noch Versuch (TECHNIK §5.2)
      if (kandidat.toUpperCase() !== eigen) {
        versuche++;
        if (kryptosHash(kandidat).wert === ziel) return { text: kandidat, wert: ziel, versuche };
      }
      // nächster Kandidat (Zähler zur Basis |alphabet|, bei Überlauf eine Stelle länger)
      let p = stellen.length - 1;
      while (p >= 0 && stellen[p] === zeichen.length - 1) stellen[p--] = 0;
      if (p < 0) stellen.unshift(0);
      else stellen[p]++;
    }
    return null;
  };

  /**
   * Kollisionsbaukasten (W5 §9.1): Buchstabe an Position j vom Ende (j ≥ 1; der letzte, j = 0, gleicht aus) wird `neu`;
   * beitrag = (3ʲ · Δ) mod 29; der letzte Buchstabe wird so gewählt, dass der KH-Wert gleich bleibt (Wert 1–26,
   * sonst wort: null). Wort klein.
   */
  kryptosHash.ausgleichen = function (wort, j, neu) {
    const w = nurBuchstaben(pruefeText(wort, 'Das Wort'));
    pruefeGanzzahl(j, 'Die Position j');
    if (j < 1 || j >= w.length) throw new KryptoFehler('Die Position j zählt vom Ende ab 1 und liegt im Wort (der letzte Buchstabe gleicht aus).');
    const n = nurBuchstaben(pruefeText(neu, 'Der neue Buchstabe'));
    if (n.length !== 1) throw new KryptoFehler('Es wird genau ein neuer Buchstabe A–Z erwartet.');
    const i = w.length - 1 - j;
    const delta = wert(n) - wert(w[i]);
    const beitrag = mod(modpow(3, j, 29) * delta, 29);
    const letzter = mod(wert(w[w.length - 1]) - beitrag, 29);
    if (letzter < 1 || letzter > 26) return { beitrag, wort: null };
    const neuesWort = w.slice(0, i) + n + w.slice(i + 1, w.length - 1) + buchstabe(letzter);
    return { beitrag, wort: neuesWort.toLowerCase() };
  };

  const PRUEFSUMMEN = ['summe', 'gewichtet'];

  /** Prüfsummen (W5 §0a): S(t) = (Σ wᵢ) mod modul, G(t) = (Σ i · wᵢ) mod modul (i ab 1, A = 1; Text wie KH normalisiert) */
  function pruefsumme(text, art = 'summe', modul = 29) {
    if (!PRUEFSUMMEN.includes(art)) throw new KryptoFehler('Die Prüfsumme ist „summe“ oder „gewichtet“.');
    pruefeGanzzahl(modul, 'Der Modul');
    if (modul < 2 || modul > 1000) throw new KryptoFehler('Der Modul liegt zwischen 2 und 1000.');
    const w = zahlen(text);
    return mod(w.reduce((s, x, i) => s + (art === 'gewichtet' ? (i + 1) * x : x), 0), modul);
  }

  // ───────────────────────────── SHA-256 (FIPS 180-4, eigene Umsetzung, Plan M6 E68) ─────────────────────────────

  const SHA_K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01,
    0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
    0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
    0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08,
    0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];
  const SHA_H0 = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];

  /** Text → UTF-8-Bytes (einzelne Ersatzzeichen U+D800–U+DFFF → KryptoFehler) */
  function utf8Bytes(text) {
    const aus = [];
    for (const zeichen of text) {
      const c = zeichen.codePointAt(0);
      if (c >= 0xd800 && c <= 0xdfff) throw new KryptoFehler('Der Text enthält ein ungültiges Zeichen (einzelnes Ersatzzeichen).');
      if (c < 0x80) aus.push(c);
      else if (c < 0x800) aus.push(0xc0 | (c >>> 6), 0x80 | (c & 0x3f));
      else if (c < 0x10000) aus.push(0xe0 | (c >>> 12), 0x80 | ((c >>> 6) & 0x3f), 0x80 | (c & 0x3f));
      else aus.push(0xf0 | (c >>> 18), 0x80 | ((c >>> 12) & 0x3f), 0x80 | ((c >>> 6) & 0x3f), 0x80 | (c & 0x3f));
    }
    return aus;
  }

  const rotr = (x, n) => ((x >>> n) | (x << (32 - n))) >>> 0;

  /** SHA-256 über die UTF-8-Bytes des unveränderten Texts → 64 Hexziffern GROSS */
  function sha256(text) {
    const bytes = utf8Bytes(pruefeText(text));
    const bitLaenge = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    const hoch = Math.floor(bitLaenge / 0x100000000);
    const tief = bitLaenge >>> 0;
    for (const wort of [hoch, tief]) bytes.push((wort >>> 24) & 0xff, (wort >>> 16) & 0xff, (wort >>> 8) & 0xff, wort & 0xff);
    const H = SHA_H0.slice();
    const W = new Array(64);
    for (let b = 0; b < bytes.length; b += 64) {
      for (let t = 0; t < 16; t++) {
        const i = b + 4 * t;
        W[t] = ((bytes[i] << 24) | (bytes[i + 1] << 16) | (bytes[i + 2] << 8) | bytes[i + 3]) >>> 0;
      }
      for (let t = 16; t < 64; t++) {
        const s0 = rotr(W[t - 15], 7) ^ rotr(W[t - 15], 18) ^ (W[t - 15] >>> 3);
        const s1 = rotr(W[t - 2], 17) ^ rotr(W[t - 2], 19) ^ (W[t - 2] >>> 10);
        W[t] = (W[t - 16] + s0 + W[t - 7] + s1) >>> 0;
      }
      let [a, bb, c, d, e, f, g, h] = H;
      for (let t = 0; t < 64; t++) {
        const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        const ch = (e & f) ^ (~e & g);
        const T1 = (h + S1 + ch + SHA_K[t] + W[t]) >>> 0;
        const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        const maj = (a & bb) ^ (a & c) ^ (bb & c);
        const T2 = (S0 + maj) >>> 0;
        h = g;
        g = f;
        f = e;
        e = (d + T1) >>> 0;
        d = c;
        c = bb;
        bb = a;
        a = (T1 + T2) >>> 0;
      }
      [a, bb, c, d, e, f, g, h].forEach((x, i) => (H[i] = (H[i] + x) >>> 0));
    }
    return H.map((x) => x.toString(16).toUpperCase().padStart(8, '0')).join('');
  }

  /**
   * Hash als Zahl < modul (Signatur-Simulator, Plan M6 E69): kh → KH-Wert mod modul; sha256 → erste 8 Hexziffern als
   * Zahl mod modul. modul 2 … 10⁹.
   */
  function hashZahl(text, { verfahren = 'kh', modul } = {}) {
    if (verfahren !== 'kh' && verfahren !== 'sha256') throw new KryptoFehler('Das Hashverfahren ist „kh“ oder „sha256“.');
    pruefeGanzzahl(modul, 'Der Modul');
    if (modul < 2 || modul > 1e9) throw new KryptoFehler('Der Modul liegt zwischen 2 und 1 000 000 000.');
    if (verfahren === 'kh') return mod(kryptosHash(text).wert, modul);
    return mod(parseInt(sha256(text).slice(0, 8), 16), modul);
  }

  // ───────────────────────────── Kryptoanalyse ─────────────────────────────

  /**
   * Buchstabenhäufigkeiten deutscher Texte in Prozent.
   * Quelle: A. Beutelspacher, Kryptologie (Springer Spektrum) – identisch in SPEC W1 und W2 §0.9; Summe 100,00 %
   * (ß als ss gezählt), I_D = Σ p² = 0,0762.
   */
  const DEUTSCH = Object.freeze({
    A: 6.51, B: 1.89, C: 3.06, D: 5.08, E: 17.4, F: 1.66, G: 3.01, H: 4.76, I: 7.55, J: 0.27, K: 1.21, L: 3.44, M: 2.53,
    N: 9.78, O: 2.51, P: 0.79, Q: 0.02, R: 7.0, S: 7.27, T: 6.15, U: 4.35, V: 0.67, W: 1.89, X: 0.03, Y: 0.04, Z: 1.13,
  });

  /** absolute Häufigkeiten {A: n, …, Z: n} (immer 26 Schlüssel) */
  function haeufigkeiten(text) {
    const h = {};
    for (const c of ALPHABET) h[c] = 0;
    for (const c of nurBuchstaben(text)) h[c]++;
    return h;
  }

  /** relative Häufigkeiten (Summe 1; leerer Text: alle 0) */
  function anteile(text) {
    const h = haeufigkeiten(text);
    const n = Object.values(h).reduce((a, b) => a + b, 0);
    const a = {};
    for (const c of ALPHABET) a[c] = n ? h[c] / n : 0;
    return a;
  }

  /** vorkommende Buchstaben absteigend nach Häufigkeit, bei Gleichstand alphabetisch */
  function rangfolge(text) {
    const h = haeufigkeiten(text);
    return [...ALPHABET].filter((c) => h[c] > 0).sort((a, b) => h[b] - h[a] || (a < b ? -1 : 1));
  }

  /** k Teiltexte: Teiltext j enthält die Positionen j, j + k, j + 2k, … (ab 0) */
  function teiltexte(text, k) {
    pruefeGanzzahl(k, 'Die Anzahl der Teiltexte');
    if (k < 1) throw new KryptoFehler('Die Anzahl der Teiltexte muss mindestens 1 sein.');
    const t = nurBuchstaben(text);
    const aus = new Array(k).fill('');
    for (let i = 0; i < t.length; i++) aus[i % k] += t[i];
    return aus;
  }

  /** häufigste Bigramme (überlappend gezählt): [{ bigramm, anzahl }], Gleichstand alphabetisch */
  function bigramme(text, { top = 10 } = {}) {
    pruefeGanzzahl(top, 'Anzahl');
    const t = nurBuchstaben(text);
    const z = new Map();
    for (let i = 0; i + 1 < t.length; i++) z.set(t.slice(i, i + 2), (z.get(t.slice(i, i + 2)) || 0) + 1);
    return [...z]
      .map(([bigramm, anzahl]) => ({ bigramm, anzahl }))
      .sort((a, b) => b.anzahl - a.anzahl || (a.bigramm < b.bigramm ? -1 : 1))
      .slice(0, Math.max(0, top));
  }

  /** I = Σ nᵢ(nᵢ − 1) / (n(n − 1)); n < 2 → null */
  function koinzidenzindex(text) {
    const h = haeufigkeiten(text);
    const n = Object.values(h).reduce((a, b) => a + b, 0);
    if (n < 2) return null;
    return Object.values(h).reduce((s, x) => s + x * (x - 1), 0) / (n * (n - 1));
  }

  /** Bruch des Koinzidenzindex für die Anzeige: { zaehler: Σ nᵢ(nᵢ − 1), nenner: n(n − 1) }; n < 2 → null */
  function koinzidenzindexBruch(text) {
    const h = haeufigkeiten(text);
    const n = Object.values(h).reduce((a, b) => a + b, 0);
    if (n < 2) return null;
    return { zaehler: Object.values(h).reduce((s, x) => s + x * (x - 1), 0), nenner: n * (n - 1) };
  }

  /** Mittel der Koinzidenzindizes der k Teiltexte (k 1–40) mit mindestens 2 Zeichen; keiner → null */
  function mittlererKoinzidenzindex(text, k) {
    pruefeGanzzahl(k, 'Die Anzahl der Teiltexte');
    if (k < 1 || k > 40) throw new KryptoFehler('Die Anzahl der Teiltexte liegt zwischen 1 und 40.');
    const werte = teiltexte(text, k).map(koinzidenzindex).filter((w) => w !== null);
    if (werte.length === 0) return null;
    return werte.reduce((a, b) => a + b, 0) / werte.length;
  }

  /**
   * N-Gramme (W1 §9.1): überlappend gezählte Folgen der Länge n (1–5) als [{ folge, anzahl, positionen (ab 0) }],
   * absteigend nach Anzahl, Gleichstand alphabetisch, höchstens top (≥ 1).
   */
  function ngramme(text, { n = 2, top = 10 } = {}) {
    pruefeGanzzahl(n, 'Die Länge n');
    if (n < 1 || n > 5) throw new KryptoFehler('Die Länge der N-Gramme liegt zwischen 1 und 5.');
    pruefeGanzzahl(top, 'Anzahl');
    if (top < 1) throw new KryptoFehler('Es muss mindestens ein N-Gramm angezeigt werden.');
    const t = nurBuchstaben(text);
    const z = new Map();
    for (let i = 0; i + n <= t.length; i++) {
      const f = t.slice(i, i + n);
      if (!z.has(f)) z.set(f, []);
      z.get(f).push(i);
    }
    return [...z]
      .map(([folge, positionen]) => ({ folge, anzahl: positionen.length, positionen }))
      .sort((a, b) => b.anzahl - a.anzahl || (a.folge < b.folge ? -1 : 1))
      .slice(0, top);
  }

  /**
   * Teil-Substitution (W1 §9.2): je Buchstabe von nurBuchstaben(text) der zugeordnete Klartextbuchstabe (klein) oder
   * `unbekannt`. zuordnung: Objekt Geheim → Klar (normalisiert; leerer Wert = nicht zugeordnet; mehr als ein Buchstabe
   * oder widersprüchliche Doppelungen → KryptoFehler).
   */
  function teilsubstitution(text, zuordnung, { unbekannt = '·' } = {}) {
    if (!istObjekt(zuordnung)) throw new KryptoFehler('Die Zuordnung muss ein Objekt Geheimtext → Klartext sein.');
    pruefeText(unbekannt, 'Das Zeichen für Unbekannt');
    const tabelle = new Map();
    for (const [g, k] of Object.entries(zuordnung)) {
      const gn = nurBuchstaben(g);
      const kn = nurBuchstaben(pruefeText(k, 'Ein Klartextbuchstabe'));
      if (gn.length !== 1) throw new KryptoFehler('Jeder Geheimtextbuchstabe der Zuordnung ist genau ein Buchstabe A–Z.');
      if (kn.length > 1) throw new KryptoFehler('Einem Geheimtextbuchstaben wird höchstens ein Klartextbuchstabe zugeordnet.');
      if (kn.length === 0) continue;
      if (tabelle.has(gn) && tabelle.get(gn) !== kn) throw new KryptoFehler(`Dem Buchstaben ${gn} sind zwei verschiedene Klartextbuchstaben zugeordnet.`);
      tabelle.set(gn, kn);
    }
    let aus = '';
    for (const c of nurBuchstaben(text)) aus += tabelle.has(c) ? tabelle.get(c).toLowerCase() : unbekannt;
    return aus;
  }

  /**
   * Mustersuche (W1 §9.2): Startpositionen (ab 0) der Teilfolgen von nurBuchstaben(text) mit demselben
   * Gleichheitsmuster wie `muster` (A–Z, auch klein, Länge 2–12; „ABA“ = erster und dritter gleich, zweiter verschieden).
   */
  function musterSuchen(text, muster) {
    pruefeText(muster, 'Das Muster');
    const m = muster.toUpperCase();
    if (!/^[A-Z]{2,12}$/.test(m)) throw new KryptoFehler('Das Muster besteht aus 2 bis 12 Buchstaben A–Z.');
    const t = nurBuchstaben(text);
    const treffer = [];
    for (let i = 0; i + m.length <= t.length; i++) {
      let passt = true;
      for (let a = 0; a < m.length && passt; a++) {
        for (let b = a + 1; b < m.length; b++) {
          if ((m[a] === m[b]) !== (t[i + a] === t[i + b])) {
            passt = false;
            break;
          }
        }
      }
      if (passt) treffer.push(i);
    }
    return treffer;
  }

  /** Teilertabelle (W2 §9.1 Reiter 3): { t: Anzahl der durch t teilbaren Abstände } für t = von … bis (1 ≤ von ≤ bis ≤ 100) */
  function teilerTabelle(abstaende, { von = 2, bis = 20 } = {}) {
    if (!Array.isArray(abstaende) || !abstaende.every((d) => Number.isInteger(d) && d >= 1)) {
      throw new KryptoFehler('Die Abstände sind eine Liste ganzer Zahlen ab 1.');
    }
    pruefeGanzzahl(von, 'Der kleinste Teiler');
    pruefeGanzzahl(bis, 'Der größte Teiler');
    if (von < 1 || bis < von || bis > 100) throw new KryptoFehler('Die Teiler liegen zwischen 1 und 100 (von ≤ bis).');
    const tabelle = {};
    for (let t = von; t <= bis; t++) tabelle[t] = abstaende.filter((d) => d % t === 0).length;
    return tabelle;
  }

  /** Primfaktoren aufsteigend mit Vielfachheit (1 → []); n ganz, 1 … 10⁷ */
  function primfaktoren(n) {
    pruefeGanzzahl(n, 'Zahl');
    if (n < 1 || n > 1e7) throw new KryptoFehler('Die Zahl liegt zwischen 1 und 10 000 000.');
    const faktoren = [];
    let rest = n;
    for (let p = 2; p * p <= rest; p++) {
      while (rest % p === 0) {
        faktoren.push(p);
        rest /= p;
      }
    }
    if (rest > 1) faktoren.push(rest);
    return faktoren;
  }

  /** Friedman: k ≈ (iD − iZ)·n / ((n − 1)·I − iZ·n + iD) (Design §6.4: iZ = 0,038, nie 1/26); Nenner 0 → null */
  function friedmanWert(n, I, { iD = 0.076, iZ = 0.038 } = {}) {
    pruefeGanzzahl(n, 'Textlänge n');
    if (n < 2) throw new KryptoFehler('Die Textlänge muss mindestens 2 sein.');
    if (typeof I !== 'number' || !Number.isFinite(I) || I < 0 || I > 1) throw new KryptoFehler('Der Koinzidenzindex liegt zwischen 0 und 1.');
    const nenner = (n - 1) * I - iZ * n + iD;
    if (nenner === 0) return null; // keine Schätzung möglich (wie koinzidenzindex bei n < 2)
    return ((iD - iZ) * n) / nenner;
  }

  function friedman(text, optionen = {}) {
    const n = nurBuchstaben(text).length;
    const I = koinzidenzindex(text);
    return I === null ? null : friedmanWert(n, I, optionen);
  }

  /**
   * Kasiski (SPEC W2 §9, Reiter 3): Wiederholungen ab Länge `min` (3–6) ohne Obergrenze (bis n/2), nur maximale
   * (eine Folge, die mit denselben Positionen in einer längeren enthalten ist, entfällt), sortiert nach Länge,
   * Anzahl, erster Position; höchstens `anzahl`. abstaende je Folge: zwischen aufeinanderfolgenden Vorkommen.
   * Gesamt-abstaende (Grundlage der Teilertabelle 2–20): jedes Paar aufeinanderfolgender Vorkommen einmal – ein Paar,
   * das schon in einer längeren Folge mit demselben Abstand steckt, zählt nicht erneut. vorschlag: Teiler mit
   * Anzahl > 0, absteigend nach Anzahl, bei Gleichstand größerer Teiler zuerst.
   */
  function kasiski(text, { min = 3, anzahl = 30 } = {}) {
    pruefeGanzzahl(min, 'Mindestlänge');
    if (min < 3 || min > 6) throw new KryptoFehler('Die Mindestlänge liegt zwischen 3 und 6.');
    pruefeGanzzahl(anzahl, 'Anzahl');
    const t = nurBuchstaben(text);
    const n = t.length;
    // Gruppen gleicher Folgen der Länge L als Positionslisten; Verlängern um ein Zeichen verteilt eine Gruppe nach dem
    // folgenden Buchstaben (ohne Teilzeichenketten, Review M6). Gespeichert werden nur maximale Gruppen: weder alle
    // Vorkommen nach rechts noch alle nach links mit demselben Zeichen verlängerbar (auch über n/2 hinaus).
    // Aufwand höchstens Summe der Gruppengrößen über alle Längen – 3000 Zeichen periodisch in wenigen Millisekunden.
    const code = Int8Array.from(t, (c) => ALPHABET.indexOf(c));
    const maximal = []; // { laenge, positionen (Int32Array, aufsteigend) }
    let L = min;
    const start = new Map();
    for (let i = 0; i + L <= n; i++) {
      const f = t.slice(i, i + L);
      if (!start.has(f)) start.set(f, []);
      start.get(f).push(i);
    }
    let ebene = [...start.values()].filter((p) => p.length >= 2).map((p) => Int32Array.from(p));
    const anzahlJe = new Int32Array(26);
    while (ebene.length && L <= Math.floor(n / 2)) {
      const naechste = [];
      for (const p of ebene) {
        // Positionen am Textende stehen hinten (aufsteigend sortiert)
        let ende = p.length;
        while (ende > 0 && p[ende - 1] + L >= n) ende--;
        const amEnde = ende < p.length;
        let links = p[0] > 0;
        const vorne = links ? code[p[0] - 1] : -1;
        anzahlJe.fill(0);
        let verschieden = 0;
        for (let j = 0; j < p.length; j++) {
          const i = p[j];
          if (links && (i === 0 || code[i - 1] !== vorne)) links = false;
          if (j < ende && anzahlJe[code[i + L]]++ === 0) verschieden++;
        }
        const rechts = !amEnde && verschieden === 1;
        if (!rechts && !links) maximal.push({ laenge: L, positionen: p });
        if (verschieden === 1) {
          if (ende >= 2) naechste.push(amEnde ? p.subarray(0, ende) : p); // eine Fortsetzung: Positionen bleiben (ohne Kopie)
        } else if (verschieden > 1) {
          const eimer = [];
          for (let c = 0; c < 26; c++) if (anzahlJe[c] >= 2) eimer[c] = { q: new Int32Array(anzahlJe[c]), k: 0 };
          for (let j = 0; j < ende; j++) {
            const e = eimer[code[p[j] + L]];
            if (e) e.q[e.k++] = p[j];
          }
          for (const e of eimer) if (e) naechste.push(e.q);
        }
      }
      ebene = naechste;
      L++;
    }
    maximal.sort((a, b) => b.laenge - a.laenge || b.positionen.length - a.positionen.length || a.positionen[0] - b.positionen[0]);
    const wiederholungen = maximal.slice(0, Math.max(0, anzahl)).map(({ laenge, positionen: q }) => {
      const positionen = Array.from(q);
      return { folge: t.slice(positionen[0], positionen[0] + laenge), positionen, abstaende: positionen.slice(1).map((p, i) => p - positionen[i]) };
    });
    // Gesamt-Abstände ohne Doppelzählung (Paare, die in einer längeren Folge mit gleichem Abstand liegen): Paar (a, d) der
    // Länge l ist gedeckt, wenn ein früheres Paar mit demselben d bei q.a ≤ a beginnt und bis a + l reicht. Je d ein
    // Fenwick-Baum (Präfix-Maximum des Endes über den Anfang) – sonst quadratisch bei langen periodischen Texten.
    const abstaende = [];
    const baeume = new Map(); // d → Map(Index → größtes Ende)
    const hoechstesEnde = (d, a) => {
      const b = baeume.get(d);
      let m = -1;
      if (b) for (let i = a + 1; i > 0; i -= i & -i) m = Math.max(m, b.get(i) ?? -1);
      return m;
    };
    const eintragen = (d, a, ende) => {
      if (!baeume.has(d)) baeume.set(d, new Map());
      const b = baeume.get(d);
      for (let i = a + 1; i <= n + 1; i += i & -i) if (!((b.get(i) ?? -1) >= ende)) b.set(i, ende);
    };
    for (const w of wiederholungen) {
      const l = w.folge.length;
      for (let i = 1; i < w.positionen.length; i++) {
        const a = w.positionen[i - 1];
        const d = w.positionen[i] - a;
        if (hoechstesEnde(d, a) < a + l) {
          abstaende.push(d);
          eintragen(d, a, a + l);
        }
      }
    }
    const teiler = {};
    for (let k = 2; k <= 20; k++) teiler[k] = abstaende.filter((d) => d % k === 0).length;
    const vorschlag = Object.keys(teiler)
      .map(Number)
      .filter((k) => teiler[k] > 0)
      .sort((a, b) => teiler[b] - teiler[a] || b - a);
    return { wiederholungen, abstaende, teiler, vorschlag };
  }

  /**
   * Verschiebung eines Teiltexts schätzen (SPEC W2 §9, Reiter 6): Korrelation mit DEUTSCH
   * χ(v) = Σₓ p_D(x) · f_T((x + v) mod 26); Vorschlag = v mit größtem χ (bei Gleichstand kleineres v).
   */
  function verschiebungSchaetzen(teiltext) {
    const f = anteile(teiltext);
    const werte = [];
    for (let v = 0; v < 26; v++) {
      let chi = 0;
      for (let x = 0; x < 26; x++) chi += (DEUTSCH[ALPHABET[x]] / 100) * f[ALPHABET[(x + v) % 26]];
      werte.push(chi);
    }
    // Rangfolge exakt in ganzen Zahlen (Prozent · 100 · Anzahl), damit ein mathematischer Gleichstand nicht durch
    // Rundung der Gleitkommasumme entschieden wird (SPEC W2 §9: Gleichstand → kleineres v)
    const h = haeufigkeiten(teiltext);
    const exakt = [];
    for (let v = 0; v < 26; v++) {
      let summe = 0;
      for (let x = 0; x < 26; x++) summe += Math.round(DEUTSCH[ALPHABET[x]] * 100) * h[ALPHABET[(x + v) % 26]];
      exakt.push(summe);
    }
    const reihenfolge = werte.map((w, v) => v).sort((a, b) => exakt[b] - exakt[a] || a - b);
    const kandidaten = reihenfolge.slice(0, 3).map((v) => ({ k: v, buchstabe: ALPHABET[v], wert: werte[v] }));
    return { k: reihenfolge[0], buchstabe: ALPHABET[reihenfolge[0]], werte, kandidaten };
  }

  /** χ²-Abweichung der Häufigkeiten von DEUTSCH: Σ (nᵢ − Eᵢ)² / Eᵢ mit Eᵢ = n · pᵢ; leerer Text → null */
  function chiQuadrat(text) {
    const h = haeufigkeiten(text);
    const n = Object.values(h).reduce((a, b) => a + b, 0);
    if (n === 0) return null;
    let s = 0;
    for (const c of ALPHABET) {
      const e = (n * DEUTSCH[c]) / 100;
      s += (h[c] - e) ** 2 / e;
    }
    return s;
  }

  // ───────────────────────────── Zahlentheorie, asymmetrisch, Schlüsselzahl ─────────────────────────────

  /** erweiterter Euklid in Tabellenform (W4 Akte W4·K3): Zeilen (a, b, q, r), letzte Zeile (ggT, 0); x, y von unten */
  function erweiterterEuklid(a, b) {
    pruefeGanzzahl(a, 'a');
    pruefeGanzzahl(b, 'b');
    if (a < 0 || b < 0) throw new KryptoFehler('Der erweiterte Euklid erwartet Zahlen ≥ 0.');
    const schritte = [];
    let x = a;
    let y = b;
    while (y !== 0) {
      schritte.push({ a: x, b: y, q: Math.floor(x / y), r: x % y });
      [x, y] = [y, x % y];
    }
    schritte.push({ a: x, b: 0, q: null, r: null, x: 1, y: 0 });
    for (let i = schritte.length - 2; i >= 0; i--) {
      const u = schritte[i + 1];
      schritte[i].x = u.y;
      schritte[i].y = u.x - schritte[i].q * u.y;
    }
    return { ggt: x, x: schritte[0].x, y: schritte[0].y, schritte };
  }

  /** a⁻¹ mod m (kleinster nicht negativer Rest) oder null, wenn ggT(a, m) ≠ 1 */
  function inverses(a, m) {
    pruefeGanzzahl(a, 'a');
    pruefeGanzzahl(m, 'Modul');
    if (m < 2) throw new KryptoFehler('Der Modul muss mindestens 2 sein.');
    const e = erweiterterEuklid(mod(a, m), m);
    return e.ggt === 1 ? mod(e.x, m) : null;
  }

  /** schnelles Potenzieren (BigInt intern); protokoll: Tabelle (exponent, basis, ergebnis) wie potenzMod (W4 K3) */
  function modpow(basis, exponent, modul, { protokoll = false } = {}) {
    pruefeGanzzahl(basis, 'Basis');
    pruefeGanzzahl(exponent, 'Exponent');
    pruefeGanzzahl(modul, 'Modul');
    if (exponent < 0) throw new KryptoFehler('Der Exponent darf nicht negativ sein.');
    if (modul < 1) throw new KryptoFehler('Der Modul muss mindestens 1 sein.');
    const m = BigInt(modul);
    let b = ((BigInt(basis) % m) + m) % m;
    let e = BigInt(exponent);
    let r = 1n % m;
    const schritte = [{ exponent: Number(e), basis: Number(b), ergebnis: Number(r) }];
    while (e > 0n) {
      if (e & 1n) r = (r * b) % m;
      b = (b * b) % m;
      e >>= 1n;
      if (protokoll) schritte.push({ exponent: Number(e), basis: Number(b), ergebnis: Number(r) });
    }
    return protokoll ? { wert: Number(r), schritte } : Number(r);
  }

  /** Primzahltest durch Probedivision (n < 10⁷) */
  function istPrim(n) {
    pruefeGanzzahl(n, 'Zahl');
    if (n >= 1e7) throw new KryptoFehler('Der Primzahltest ist nur für Zahlen unter 10 000 000 vorgesehen.');
    if (n < 2) return false;
    if (n % 2 === 0) return n === 2;
    for (let t = 3; t * t <= n; t += 2) if (n % t === 0) return false;
    return true;
  }

  /** Ordnung von a modulo m: kleinstes x ≥ 1 mit aˣ ≡ 1 (mod m); ggT(a, m) ≠ 1 → null; m 2 … 10⁶ */
  function ordnung(a, m) {
    pruefeGanzzahl(a, 'a');
    pruefeGanzzahl(m, 'Modul');
    if (m < 2 || m > 1e6) throw new KryptoFehler('Der Modul liegt zwischen 2 und 1 000 000.');
    if (ggT(a, m) !== 1) return null;
    const b = mod(a, m);
    let w = b;
    let x = 1;
    while (w !== 1) {
      w = (w * b) % m;
      x++;
    }
    return x;
  }

  /** Teilen mit Rest: { q, r } mit a = q · m + r und r = mod(a, m) */
  function teileMitRest(a, m) {
    const r = mod(a, m);
    return { q: (a - r) / m, r };
  }

  /** Probedivision (W4 §9.2, Eve-Modus): Proben t = 2, 3, 4, … solange t² ≤ n → { teiler (erster oder null), versuche }; n 2 … 10⁷ */
  function probedivision(n) {
    pruefeGanzzahl(n, 'Zahl');
    if (n < 2 || n > 1e7) throw new KryptoFehler('Die Zahl liegt zwischen 2 und 10 000 000.');
    let versuche = 0;
    for (let t = 2; t * t <= n; t++) {
      versuche++;
      if (n % t === 0) return { teiler: t, versuche };
    }
    return { teiler: null, versuche };
  }

  function pruefeNichtNegativ(n, name) {
    pruefeGanzzahl(n, name);
    if (n < 0) throw new KryptoFehler(`${name} darf nicht negativ sein.`);
    return n;
  }

  const rsa = {
    /** { N, phi, e, d }; e Std. = kleinstes e ≥ 3 mit ggT(e, φ) = 1; p ≠ q prim */
    schluessel(p, q, e = null) {
      if (!istPrim(p) || !istPrim(q)) throw new KryptoFehler('p und q müssen Primzahlen sein.');
      if (p === q) throw new KryptoFehler('p und q müssen verschieden sein.');
      const N = p * q;
      const phi = (p - 1) * (q - 1);
      if (e === null || e === undefined) {
        e = 3;
        while (e < phi && ggT(e, phi) !== 1) e++;
      }
      pruefeGanzzahl(e, 'e');
      if (e < 2 || e >= phi || ggT(e, phi) !== 1) throw new KryptoFehler('e muss zwischen 2 und φ(N) − 1 liegen und teilerfremd zu φ(N) sein.');
      return { N, phi, e, d: inverses(e, phi) };
    },
    /** zulässige öffentliche Exponenten: alle e mit 3 ≤ e < φ und ggT(e, φ) = 1 (aufsteigend); p ≠ q prim (Review M6) */
    eKandidaten(p, q) {
      if (!istPrim(p) || !istPrim(q)) throw new KryptoFehler('p und q müssen Primzahlen sein.');
      if (p === q) throw new KryptoFehler('p und q müssen verschieden sein.');
      const phi = (p - 1) * (q - 1);
      const liste = [];
      for (let e = 3; e < phi; e++) if (ggT(e, phi) === 1) liste.push(e);
      return liste;
    },
    verschluesseln(m, e, N) {
      pruefeNichtNegativ(m, 'Die Klarzahl');
      pruefeGanzzahl(N, 'N');
      if (m >= N) throw new KryptoFehler('Die Klarzahl muss kleiner als N sein.');
      return modpow(m, pruefeNichtNegativ(e, 'e'), N);
    },
    entschluesseln(c, d, N) {
      pruefeNichtNegativ(c, 'Die Geheimzahl');
      pruefeGanzzahl(N, 'N');
      if (c >= N) throw new KryptoFehler('Die Geheimzahl muss kleiner als N sein.');
      return modpow(c, pruefeNichtNegativ(d, 'd'), N);
    },
    /** Signatur s = hᵈ mod N (0 ≤ h < N, Plan M6 E69) */
    signieren(h, d, N) {
      pruefeNichtNegativ(h, 'Der Hashwert');
      pruefeGanzzahl(N, 'N');
      if (N < 2) throw new KryptoFehler('N muss mindestens 2 sein.');
      if (h >= N) throw new KryptoFehler('Der Hashwert muss kleiner als N sein.');
      return modpow(h, pruefeNichtNegativ(d, 'd'), N);
    },
    /** Prüfung: sᵉ mod N (0 ≤ s < N) – mit dem Hashwert der Nachricht vergleichen */
    pruefen(s, e, N) {
      pruefeNichtNegativ(s, 'Die Signatur');
      pruefeGanzzahl(N, 'N');
      if (N < 2) throw new KryptoFehler('N muss mindestens 2 sein.');
      if (s >= N) throw new KryptoFehler('Die Signatur muss kleiner als N sein.');
      return modpow(s, pruefeNichtNegativ(e, 'e'), N);
    },
  };

  function pruefeDhModul(p) {
    pruefeGanzzahl(p, 'p');
    if (p < 2) throw new KryptoFehler('Der Modul p muss mindestens 2 sein.');
    return p;
  }

  const dh = {
    /** g^geheim mod p */
    oeffentlich(g, geheim, p) {
      return modpow(g, pruefeNichtNegativ(geheim, 'Die geheime Zahl'), pruefeDhModul(p));
    },
    /** B^a mod p */
    gemeinsam(fremdOeffentlich, geheim, p) {
      return modpow(fremdOeffentlich, pruefeNichtNegativ(geheim, 'Die geheime Zahl'), pruefeDhModul(p));
    },
    /** kleinstes x ≥ 1 mit g^x ≡ A (mod p), p < 10 000 (Brute Force); null, wenn es keins gibt */
    dlogKlein(g, A, p) {
      pruefeDhModul(p);
      if (p >= 10000) throw new KryptoFehler('Der diskrete Logarithmus wird nur für p < 10 000 durchprobiert.');
      pruefeGanzzahl(g, 'g');
      pruefeGanzzahl(A, 'A');
      const ziel = mod(A, p);
      let w = 1;
      for (let x = 1; x <= p; x++) {
        w = (w * mod(g, p)) % p;
        if (w === ziel) return x;
      }
      return null;
    },
  };

  /** n Teilnehmende: symmetrisch n(n − 1)/2 Schlüssel, asymmetrisch 2n (n Schlüsselpaare) */
  function schluesselanzahl(n) {
    pruefeGanzzahl(n, 'Teilnehmerzahl');
    if (n < 2) throw new KryptoFehler('Es braucht mindestens 2 Teilnehmende.');
    return { symmetrisch: (n * (n - 1)) / 2, asymmetrisch: 2 * n };
  }

  function ggTOeffentlich(a, b) {
    pruefeGanzzahl(a, 'a');
    pruefeGanzzahl(b, 'b');
    return ggT(a, b);
  }

  // ───────────────────────────── Baukasten (SPEC W3 Tabelle B, TECHNIK §9.2) ─────────────────────────────

  function tiefFrieren(o) {
    if (o && typeof o === 'object') {
      Object.values(o).forEach(tiefFrieren);
      Object.freeze(o);
    }
    return o;
  }

  const istObjekt = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);

  /**
   * Stufen-Katalog nach SPEC W3 Tabelle B (verbindlich für Plattform, Gerüst, Arena, Papier). Wertebereiche hier nach
   * W3; das Verfahrens-Objekt (verfahren.TYPEN) folgt AUFGABENFORMAT_KRYPTO §6 – Unterschiede: TECHNIK §9.2.
   */
  const STUFEN = tiefFrieren([
    { typ: 'caesar', kuerzel: 'CAE', name: 'Caesar', parameter: { k: { art: 'zahl', min: 0, max: 25 } }, einordnung: 'mono', ausgabe: 'buchstaben', nurZuletzt: false },
    { typ: 'substitution', kuerzel: 'SUB', name: 'Schlüsselwort-Substitution', parameter: { schluesselwort: { art: 'wort', min: 1, max: 26 } }, einordnung: 'mono', ausgabe: 'buchstaben', nurZuletzt: false },
    { typ: 'vigenere', kuerzel: 'VIG', name: 'Vigenère', parameter: { schluessel: { art: 'wort', min: 1, max: 20 } }, einordnung: 'poly', ausgabe: 'buchstaben', nurZuletzt: false },
    { typ: 'spaltentransposition', kuerzel: 'SPA', name: 'Spaltentransposition', parameter: { schluessel: { art: 'wort', min: 2, max: 10 } }, einordnung: 'transposition', ausgabe: 'buchstaben', nurZuletzt: false },
    { typ: 'gartenzaun', kuerzel: 'ZAU', name: 'Gartenzaun', parameter: { zeilen: { art: 'zahl', min: 2, max: 6 } }, einordnung: 'transposition', ausgabe: 'buchstaben', nurZuletzt: false },
    { typ: 'blockrotation', kuerzel: 'ROT', name: 'Blockrotation', parameter: { block: { art: 'zahl', min: 2, max: 9 }, um: { art: 'zahl', min: 1, max: 8, kleinerAls: 'block' } }, einordnung: 'transposition', ausgabe: 'buchstaben', nurZuletzt: false },
    { typ: 'umkehrung', kuerzel: 'UMK', name: 'Umkehrung', parameter: {}, einordnung: 'transposition', ausgabe: 'buchstaben', nurZuletzt: false },
    { typ: 'xor', kuerzel: 'XOR', name: 'XOR mit Schlüsselwort', parameter: { schluessel: { art: 'wort', min: 1, max: 20 } }, einordnung: 'poly', ausgabe: 'bytes', nurZuletzt: true },
  ]);
  const MAX_STUFEN = 4;
  const PRUEFTEXTE = ['Ebbe und Flut', 'A'];

  function stufeNach(typ) {
    return STUFEN.find((s) => s.typ === typ);
  }

  /** Wert gegen eine Parameterbeschreibung { art: 'zahl'|'wort', min, max } prüfen → Fehlertext oder null */
  function wertFehler(name, wert, spec) {
    if (spec.art === 'zahl') {
      if (!Number.isInteger(wert) || wert < spec.min || wert > spec.max) return `„${name}“ muss eine ganze Zahl von ${spec.min} bis ${spec.max} sein.`;
    } else if (spec.art === 'wort') {
      if (typeof wert !== 'string' || !/^[A-Za-z]+$/.test(wert) || wert.length < spec.min || wert.length > spec.max) {
        return `„${name}“ muss ein Wort aus ${spec.min} bis ${spec.max} Buchstaben A–Z sein.`;
      }
    }
    return null;
  }

  /** statische Prüfung und Auflösung der Platzhalter → { fehler, stufen: [{ typ, param }] } */
  function baukastenAufloesen(verfahren, schluessel) {
    const fehler = [];
    const stufen = [];
    if (!istObjekt(verfahren)) return { fehler: ['Das Verfahren muss ein Objekt sein.'], stufen };
    const s = schluessel === undefined || schluessel === null ? {} : schluessel;
    if (!istObjekt(s)) return { fehler: ['Der Schlüssel muss ein Objekt sein.'], stufen };
    if (verfahren.version !== 1) fehler.push('Unbekannte Version des Verfahrens (erwartet: 1).');
    if (verfahren.name !== undefined && (typeof verfahren.name !== 'string' || verfahren.name.length > 40 || !/^[A-Za-zÄÖÜäöüß0-9 -]*$/.test(verfahren.name))) {
      fehler.push('Der Name hat höchstens 40 Zeichen (Buchstaben, Ziffern, Leerzeichen, Bindestrich).');
    }
    const liste = verfahren.stufen;
    if (!Array.isArray(liste) || liste.length < 1 || liste.length > MAX_STUFEN) {
      fehler.push(`Ein Verfahren besteht aus 1 bis ${MAX_STUFEN} Stufen.`);
      return { fehler, stufen };
    }
    const benutzt = new Set();
    liste.forEach((st, i) => {
      const nr = i + 1;
      const def = istObjekt(st) ? stufeNach(st.typ) : null;
      if (!def) {
        fehler.push(`Stufe ${nr}: unbekannte Stufe.`);
        return;
      }
      const roh = st.param === undefined ? {} : st.param;
      if (!istObjekt(roh)) {
        fehler.push(`Stufe ${nr}: Parameter müssen ein Objekt sein.`);
        return;
      }
      const param = {};
      for (const name of Object.keys(roh)) if (!(name in def.parameter)) fehler.push(`Stufe ${nr}: unbekannter Parameter „${name}“.`);
      for (const [name, spec] of Object.entries(def.parameter)) {
        let wert = roh[name];
        if (wert === undefined) {
          fehler.push(`Stufe ${nr}: Parameter „${name}“ fehlt.`);
          continue;
        }
        if (typeof wert === 'string' && wert.startsWith('$')) {
          if (!/^\$[a-z][a-z0-9]{0,11}$/.test(wert)) {
            fehler.push(`Stufe ${nr}: ungültiger Platzhalter „${wert}“.`);
            continue;
          }
          const schl = wert.slice(1);
          if (!(schl in s)) {
            fehler.push(`Stufe ${nr}: Der Schlüssel enthält keinen Wert für „${wert}“.`);
            continue;
          }
          benutzt.add(schl);
          wert = s[schl];
        }
        const f = wertFehler(name, wert, spec);
        if (f) fehler.push(`Stufe ${nr}: ${f}`);
        else param[name] = spec.art === 'wort' ? wert.toUpperCase() : wert;
      }
      if (def.typ === 'blockrotation' && Number.isInteger(param.block) && Number.isInteger(param.um) && param.um >= param.block) {
        fehler.push(`Stufe ${nr}: Die Drehung muss kleiner als die Blocklänge sein.`);
      }
      stufen.push({ typ: def.typ, param });
    });
    for (const k of Object.keys(s)) if (!benutzt.has(k)) fehler.push(`Der Schlüsselwert „${k}“ wird in keiner Stufe verwendet.`);
    const xorStellen = stufen.map((st, i) => (st.typ === 'xor' ? i : -1)).filter((i) => i >= 0);
    if (xorStellen.length > 1) fehler.push('XOR darf höchstens einmal vorkommen.');
    if (xorStellen.some((i) => i !== liste.length - 1)) fehler.push('XOR darf nur als letzte Stufe stehen (die Ausgabe ist kein Buchstabentext mehr).');
    return { fehler, stufen };
  }

  function stufeAnwenden(typ, p, t, richtung) {
    switch (typ) {
      case 'caesar': return caesar(t, p.k, richtung);
      case 'substitution': return substitution(t, schluesselwortAlphabet(p.schluesselwort), richtung);
      case 'vigenere': return vigenere(t, p.schluessel, richtung);
      case 'spaltentransposition': return spaltentransposition(t, p.schluessel, richtung);
      case 'gartenzaun': return gartenzaun(t, p.zeilen, richtung);
      case 'blockrotation': return blockrotation(t, p.block, p.um, richtung);
      case 'umkehrung': return umkehrung(t);
      case 'xor': return richtung === 'ver' ? xor(t, p.schluessel) : xor(t, p.schluessel, 'ent');
      default: throw new KryptoFehler('Unbekannte Stufe.');
    }
  }

  function baukastenStufen(verfahren, schluessel) {
    const { fehler, stufen } = baukastenAufloesen(verfahren, schluessel);
    if (fehler.length) throw new KryptoFehler(fehler[0]);
    return stufen;
  }

  /** { geheimtext, zwischen: [Ergebnis je Stufe] }; protokoll: zusätzlich stufen: [{ typ, kuerzel, param, ergebnis }] */
  function baukastenVerschluesseln(verfahren, schluessel, klartext, { protokoll = false } = {}) {
    const stufen = baukastenStufen(verfahren, schluessel);
    let t = nurBuchstaben(klartext);
    const zwischen = [];
    const protokollListe = [];
    for (const st of stufen) {
      t = stufeAnwenden(st.typ, st.param, t, 'ver');
      zwischen.push(t);
      if (protokoll) protokollListe.push({ typ: st.typ, kuerzel: stufeNach(st.typ).kuerzel, param: { ...st.param }, ergebnis: t });
    }
    const erg = { geheimtext: t, zwischen };
    if (protokoll) erg.stufen = protokollListe;
    return erg;
  }

  /** Stufen rückwärts, jede invertiert (bei XOR als letzter Stufe ist der Geheimtext Hex) */
  function baukastenEntschluesseln(verfahren, schluessel, geheimtext) {
    const stufen = baukastenStufen(verfahren, schluessel);
    let t = pruefeText(geheimtext);
    for (let i = stufen.length - 1; i >= 0; i--) t = stufeAnwenden(stufen[i].typ, stufen[i].param, t, 'ent');
    return nurBuchstaben(t);
  }

  /**
   * Umkehrbarkeits- und Qualitätsprüfung (SPEC W3 Level 3.3, TECHNIK §9.3): { ok, fehler, hinweise: [{ p, text }] }.
   * Fehler: Format, Bereiche, XOR nur einmal und zuletzt, Platzhalter; Rundreise für den eigenen Text, „Ebbe und Flut“
   * und einen Text der Länge 1. Hinweise (blockieren nicht): P7, P8, P6 sowie „nur Substitutionsstufen“ (p: null).
   */
  function baukastenPruefe(verfahren, schluessel, { klartext = null } = {}) {
    const { fehler, stufen } = baukastenAufloesen(verfahren, schluessel);
    const hinweise = [];
    if (fehler.length === 0) {
      const texte = (klartext === null ? [] : [pruefeText(klartext)]).concat(PRUEFTEXTE);
      for (const t of texte) {
        try {
          const g = baukastenVerschluesseln(verfahren, schluessel, t).geheimtext;
          if (baukastenEntschluesseln(verfahren, schluessel, g) !== nurBuchstaben(t)) fehler.push(`Entschlüsseln liefert für „${t.slice(0, 20)}“ nicht den Klartext.`);
        } catch (e) {
          if (!(e instanceof KryptoFehler)) throw e;
          fehler.push(`Umkehrbarkeit nicht prüfbar: ${e.message}`);
        }
      }
      const n = klartext === null ? null : nurBuchstaben(klartext).length;
      stufen.forEach((st, i) => {
        const p = st.param;
        if (st.typ === 'caesar' && p.k === 0) hinweise.push({ p: 'P7', text: `Stufe ${i + 1}: Caesar mit k = 0 verändert nichts.` });
        if (st.typ === 'vigenere' && /^A+$/.test(p.schluessel)) hinweise.push({ p: 'P7', text: `Stufe ${i + 1}: Ein Vigenère-Schlüssel nur aus A verändert nichts.` });
        else if (st.typ === 'vigenere' && p.schluessel.length > 1 && new Set(p.schluessel).size === 1) hinweise.push({ p: 'P7', text: `Stufe ${i + 1}: Lauter gleiche Schlüsselbuchstaben – das ist nur eine Caesar-Verschiebung.` });
        if (st.typ === 'xor' && new Set(p.schluessel).size === 1) hinweise.push({ p: 'P7', text: `Stufe ${i + 1}: XOR mit nur einem Schlüsselbuchstaben ist monoalphabetisch.` });
        if (st.typ === 'spaltentransposition' && n !== null && p.schluessel.length >= n && spaltenReihenfolge(p.schluessel).every((r, j) => r === j + 1)) {
          hinweise.push({ p: 'P7', text: `Stufe ${i + 1}: Spaltenschlüssel in alphabetischer Reihenfolge und mindestens so lang wie der Text – die Reihenfolge bleibt.` });
        }
        if (i > 0) {
          const a = stufen[i - 1].typ;
          const b = st.typ;
          const verschiebung = ['caesar', 'vigenere'];
          if (verschiebung.includes(a) && verschiebung.includes(b)) hinweise.push({ p: 'P8', text: `Stufen ${i} und ${i + 1} verschmelzen zu einer Verschiebung (kein Gewinn an Sicherheit).` });
          if (a === 'substitution' && b === 'substitution') hinweise.push({ p: 'P8', text: `Stufen ${i} und ${i + 1}: Zwei Substitutionen ergeben wieder eine Substitution.` });
          if (a === 'umkehrung' && b === 'umkehrung') hinweise.push({ p: 'P8', text: `Stufen ${i} und ${i + 1}: Zweimal umkehren hebt sich auf.` });
        }
      });
      const arten = stufen.map((st) => stufeNach(st.typ).einordnung);
      if (arten.every((a) => a === 'transposition')) hinweise.push({ p: 'P6', text: 'Nur Transpositionsstufen: Die Häufigkeitsverteilung bleibt erhalten.' });
      else if (arten.every((a) => a !== 'transposition')) hinweise.push({ p: null, text: 'Nur Substitutionsstufen: Wortgrenzen und Reihenfolge der Buchstaben bleiben erhalten.' });
    }
    return { ok: fehler.length === 0, fehler, hinweise };
  }

  const baukasten = {
    STUFEN,
    MAX_STUFEN,
    pruefe: baukastenPruefe,
    verschluesseln: baukastenVerschluesseln,
    entschluesseln: baukastenEntschluesseln,
  };

  // ───────────────────────────── Verfahrens-Objekt (AUFGABENFORMAT_KRYPTO §6) ─────────────────────────────

  const P = (art, weiteres = {}) => ({ art, pflicht: false, ...weiteres });
  const PF = (art, weiteres = {}) => ({ art, pflicht: true, ...weiteres });

  const TYPEN = tiefFrieren({
    caesar: { parameter: { k: PF('zahl', { min: 0, max: 25 }) }, involutorisch: false, art: 'substitution' },
    atbash: { parameter: {}, involutorisch: true, art: 'substitution' },
    affin: { parameter: { a: PF('zahl', { min: 1, max: 25 }), b: P('zahl', { min: 0, max: 25 }), basis: P('auswahl', { werte: [0, 1] }) }, involutorisch: false, art: 'substitution' },
    substitution: { parameter: { alphabet: P('alphabet'), schluesselwort: P('wort'), rest: P('auswahl', { werte: ['alphabetisch', 'ab_letztem'] }) }, einsVon: ['alphabet', 'schluesselwort'], involutorisch: false, art: 'substitution' },
    vigenere: { parameter: { schluessel: PF('wort') }, involutorisch: false, art: 'substitution' },
    autokey: { parameter: { schluessel: PF('wort') }, involutorisch: false, art: 'substitution' },
    porta: { parameter: { schluessel: PF('wort') }, involutorisch: true, art: 'substitution' },
    playfair: { parameter: { schluessel: PF('wort'), fuellzeichen: P('buchstabe'), fuellzeichenX: P('buchstabe'), ij: P('auswahl', { werte: ['I', 'J'] }) }, involutorisch: false, art: 'substitution' },
    kreuzquadrat: { parameter: { oben: PF('wort'), unten: PF('wort'), fuellzeichen: P('buchstabe') }, involutorisch: false, art: 'substitution' },
    zweiquadrat_zahl: { parameter: { q1: PF('wort'), q2: PF('wort'), zahlenschluessel: PF('zahlenschluessel') }, involutorisch: false, art: 'substitution' },
    polybios: { parameter: { schluessel: P('text'), kopf: P('kopf'), ij: P('auswahl', { werte: ['I', 'J'] }) }, involutorisch: false, art: 'substitution' },
    adfgvx: { parameter: { quadrat: PF('quadrat36'), schluessel: PF('wortOderZahlen') }, involutorisch: false, art: 'kombination' },
    gartenzaun: { parameter: { zeilen: PF('zahl', { min: 2, max: 10 }) }, involutorisch: false, art: 'transposition' },
    skytale: { parameter: { umfang: PF('zahl', { min: 2, max: 20 }), fuellzeichen: P('buchstabeOderNull') }, involutorisch: false, art: 'transposition' },
    fleissner: { parameter: { groesse: PF('auswahl', { werte: [4, 6, 8] }), schablone: PF('schablone'), drehung: P('auswahl', { werte: ['rechts', 'links'] }), fuellzeichen: P('buchstabe') }, involutorisch: false, art: 'transposition' },
    spaltentransposition: { parameter: { schluessel: PF('wortOderZahlen'), fuellzeichen: P('buchstabeOderNull') }, involutorisch: false, art: 'transposition' },
    umkehrung: { parameter: {}, involutorisch: true, art: 'transposition' },
    blockrotation: { parameter: { block: PF('zahl', { min: 2, max: 16 }), um: PF('zahl', { min: 1, max: 15, kleinerAls: 'block' }) }, involutorisch: false, art: 'transposition' },
    xor: { parameter: { schluessel: P('ascii'), schluesselBits: P('bits') }, einsVon: ['schluessel', 'schluesselBits'], involutorisch: false, art: 'substitution' },
    baukasten: { parameter: { verfahren: PF('objekt'), schluessel: PF('objekt') }, involutorisch: false, art: 'kombination' },
    frei: { parameter: { name: P('text') }, involutorisch: false, art: 'frei' },
  });

  function typWertFehler(name, w, spec, v) {
    const f = `„${name}“`;
    switch (spec.art) {
      case 'zahl':
        if (!Number.isInteger(w) || w < spec.min || w > spec.max) return `${f} muss eine ganze Zahl von ${spec.min} bis ${spec.max} sein.`;
        if (spec.kleinerAls && Number.isInteger(v[spec.kleinerAls]) && w >= v[spec.kleinerAls]) return `${f} muss kleiner als „${spec.kleinerAls}“ sein.`;
        return null;
      case 'auswahl':
        return spec.werte.includes(w) ? null : `${f} muss einer der Werte ${spec.werte.join(', ')} sein.`;
      case 'wort':
        return typeof w === 'string' && nurBuchstaben(w).length > 0 ? null : `${f} muss mindestens einen Buchstaben enthalten.`;
      case 'text':
        return typeof w === 'string' ? null : `${f} muss eine Zeichenkette sein.`;
      case 'buchstabe':
        return typeof w === 'string' && /^[A-Za-z]$/.test(w) ? null : `${f} muss genau ein Buchstabe sein.`;
      case 'buchstabeOderNull':
        return w === null || (typeof w === 'string' && /^[A-Za-z]$/.test(w)) ? null : `${f} muss ein Buchstabe oder null sein.`;
      case 'alphabet':
        return typeof w === 'string' && nurBuchstaben(w).length === 26 && new Set(nurBuchstaben(w)).size === 26 ? null : `${f} muss alle 26 Buchstaben genau einmal enthalten.`;
      case 'zahlenschluessel':
        try { zahlenschluesselListe(w); return null; } catch (e) { return `${f}: ${e.message}`; }
      case 'kopf': {
        const k = typeof w === 'string' ? normalisieren(w) : '';
        return (k.length === 5 || k.length === 6) && new Set(k).size === k.length ? null : `${f} muss aus 5 oder 6 verschiedenen Zeichen bestehen.`;
      }
      case 'quadrat36': {
        const q = typeof w === 'string' ? normalisieren(w) : '';
        return q.length === 36 && new Set(q).size === 36 ? null : `${f} muss aus den 36 Zeichen A–Z und 0–9 bestehen (jedes genau einmal).`;
      }
      case 'wortOderZahlen':
        try { spaltenReihenfolge(w); return null; } catch (e) { return `${f}: ${e.message}`; }
      case 'schablone': {
        const r = schablonePruefen(v.groesse, w);
        return r.ok ? null : `${f}: ${r.fehler[0]}`;
      }
      case 'ascii':
        try { if (typeof w !== 'string' || w.length === 0) throw new KryptoFehler('mindestens ein Zeichen.'); textZuBytes(w); return null; } catch (e) { return `${f} muss aus ASCII-Zeichen 32–126 bestehen.`; }
      case 'bits': {
        const b = typeof w === 'string' ? normBits(w) : '';
        return /^[01]+$/.test(b) && b.length % 8 === 0 ? null : `${f} muss aus ganzen Bytes (Vielfache von 8 Bits) bestehen.`;
      }
      case 'objekt':
        return istObjekt(w) ? null : `${f} muss ein Objekt sein.`;
      default:
        return `${f}: unbekannte Parameterart.`;
    }
  }

  /** Parameterprüfung eines Verfahrens-Objekts: { ok, fehler } */
  function verfahrenPruefe(v) {
    if (!istObjekt(v)) return { ok: false, fehler: ['Das Verfahren muss ein Objekt mit „typ“ sein.'] };
    const def = Object.prototype.hasOwnProperty.call(TYPEN, v.typ) ? TYPEN[v.typ] : null;
    if (!def) return { ok: false, fehler: [`Unbekannter Verfahrenstyp „${v.typ}“.`] };
    const fehler = [];
    for (const k of Object.keys(v)) if (k !== 'typ' && !(k in def.parameter)) fehler.push(`Unbekannter Parameter „${k}“.`);
    for (const [name, spec] of Object.entries(def.parameter)) {
      if (v[name] === undefined) {
        if (spec.pflicht) fehler.push(`Parameter „${name}“ fehlt.`);
        continue;
      }
      const f = typWertFehler(name, v[name], spec, v);
      if (f) fehler.push(f);
    }
    if (def.einsVon) {
      const da = def.einsVon.filter((n) => v[n] !== undefined);
      if (da.length !== 1) fehler.push(`Genau einer der Parameter ${def.einsVon.map((n) => `„${n}“`).join(' oder ')} ist anzugeben.`);
    }
    if (v.typ === 'affin' && Number.isInteger(v.a) && !affinSchluesselGueltig(v.a)) fehler.push('„a“ muss teilerfremd zu 26 sein.');
    if (v.typ === 'playfair' && fehler.length === 0) {
      // Füllzeichen-Kombination wie in playfairPaare (z. B. fuellzeichen „Q“ mit Standard-fuellzeichenX „Q“)
      try {
        playfairPaare('', opt(v, ['fuellzeichen', 'fuellzeichenX', 'ij']));
      } catch (e) {
        if (!(e instanceof KryptoFehler)) throw e;
        fehler.push(e.message);
      }
    }
    if (v.typ === 'baukasten' && fehler.length === 0) fehler.push(...baukastenAufloesen(v.verfahren, v.schluessel).fehler);
    return { ok: fehler.length === 0, fehler };
  }

  function bitsZuBytes(bits) {
    const b = normBits(bits);
    const aus = [];
    for (let i = 0; i < b.length; i += 8) aus.push(parseInt(b.slice(i, i + 8), 2));
    return aus;
  }

  function opt(v, felder) {
    const o = {};
    for (const f of felder) if (v[f] !== undefined) o[f] = v[f];
    return o;
  }

  /** reine Berechnung ohne Prüfung (für anwenden und varianten) */
  function rechne(v, text, richtung) {
    switch (v.typ) {
      case 'caesar': return caesar(text, v.k, richtung);
      case 'atbash': return atbash(text);
      case 'affin': return affin(text, v.a, v.b === undefined ? 0 : v.b, richtung, v.basis === undefined ? 0 : v.basis);
      case 'substitution': {
        const g = v.alphabet !== undefined ? v.alphabet : schluesselwortAlphabet(v.schluesselwort, opt(v, ['rest']));
        return substitution(text, g, richtung);
      }
      case 'vigenere': return vigenere(text, v.schluessel, richtung);
      case 'autokey': return autokey(text, v.schluessel, richtung);
      case 'porta': return porta(text, v.schluessel, richtung);
      case 'playfair': return playfair(text, v.schluessel, richtung, opt(v, ['fuellzeichen', 'fuellzeichenX', 'ij']));
      case 'kreuzquadrat': return kreuzquadrat(text, v.oben, v.unten, richtung, opt(v, ['fuellzeichen']));
      case 'zweiquadrat_zahl': return zweiQuadratZahl(text, v.q1, v.q2, v.zahlenschluessel, richtung);
      case 'polybios': return polybios(text, opt(v, ['schluessel', 'kopf', 'ij']), richtung);
      case 'adfgvx': return adfgvx(text, v.quadrat, v.schluessel, richtung);
      case 'gartenzaun': return gartenzaun(text, v.zeilen, richtung);
      case 'skytale': return skytale(text, v.umfang, richtung, opt(v, ['fuellzeichen']));
      case 'fleissner': return fleissner(text, v.groesse, v.schablone, richtung, opt(v, ['drehung', 'fuellzeichen']));
      case 'spaltentransposition': return spaltentransposition(text, v.schluessel, richtung, opt(v, ['fuellzeichen']));
      case 'umkehrung': return umkehrung(text);
      case 'blockrotation': return blockrotation(text, v.block, v.um, richtung);
      case 'xor': {
        const k = v.schluessel !== undefined ? v.schluessel : bitsZuBytes(v.schluesselBits);
        return richtung === 'ver' ? xor(normalisieren(text), k) : xor(text, k, 'ent');
      }
      case 'baukasten':
        return richtung === 'ver' ? baukastenVerschluesseln(v.verfahren, v.schluessel, text).geheimtext : baukastenEntschluesseln(v.verfahren, v.schluessel, text);
      default:
        throw new KryptoFehler('Für eine fremde Chiffre („frei“) gibt es keine Berechnung.');
    }
  }

  function pruefeAusgabe(ausgabe, basis) {
    if (ausgabe !== 'buchstaben' && ausgabe !== 'zahlen') throw new KryptoFehler('Die Ausgabe muss „buchstaben“ oder „zahlen“ sein.');
    if (basis !== 0 && basis !== 1) throw new KryptoFehler('Die Zählbasis muss 0 oder 1 sein.');
  }

  function ausgeben(ergebnis, ausgabe, basis) {
    if (ausgabe === 'buchstaben') return ergebnis;
    if (!/^[A-Z]*$/.test(ergebnis)) throw new KryptoFehler('Eine Zahlenausgabe gibt es nur für Ergebnisse aus Buchstaben.');
    return zahlen(ergebnis, basis);
  }

  /** Dispatcher: prüft das Verfahren und wendet es an; ausgabe 'zahlen' liefert Buchstabenwerte zur Zählbasis basis */
  function verfahrenAnwenden(v, text, richtung = 'ver', { basis = 1, ausgabe = 'buchstaben' } = {}) {
    pruefeRichtung(richtung);
    pruefeAusgabe(ausgabe, basis);
    const pr = verfahrenPruefe(v);
    if (!pr.ok) throw new KryptoFehler(pr.fehler[0]);
    if (v.typ === 'frei') throw new KryptoFehler('Für eine fremde Chiffre („frei“) gibt es keine Berechnung.');
    return ausgeben(rechne(v, text, richtung), ausgabe, basis);
  }

  const TRANSPOSITIONEN = ['gartenzaun', 'skytale', 'fleissner', 'spaltentransposition', 'blockrotation'];

  /**
   * Kandidaten typischer Fehlrechnungen (Delta §9.2): [{ p, code, text }] – text ist die Ausgabe in der gewählten
   * Ausgabeform; Reihenfolge P3, P1, P2, P4; Kandidaten gleich der richtigen Lösung oder doppelt entfallen.
   */
  function verfahrenVarianten(v, text, richtung = 'ver', { basis = 1, ausgabe = 'buchstaben' } = {}) {
    let korrekt;
    try {
      korrekt = verfahrenAnwenden(v, text, richtung, { basis, ausgabe });
    } catch (e) {
      if (e instanceof KryptoFehler) return [];
      throw e;
    }
    const gegen = richtung === 'ver' ? 'ent' : 'ver';
    const def = TYPEN[v.typ];
    const liste = [];
    const gesehen = new Set([JSON.stringify(korrekt)]);
    const dazu = (p, code, berechne) => {
      let t;
      try {
        t = berechne();
      } catch (e) {
        if (e instanceof KryptoFehler) return;
        throw e;
      }
      const s = JSON.stringify(t);
      if (gesehen.has(s)) return;
      gesehen.add(s);
      liste.push({ p, code, text: t });
    };
    const aus = (erg) => ausgeben(erg, ausgabe, basis);
    // P3: Richtung, Reihenfolge, Permutation
    if (v.typ === 'baukasten' && richtung === 'ent') {
      dazu('P3', 'reihenfolge', () => {
        let t = text;
        for (const st of baukastenStufen(v.verfahren, v.schluessel)) t = stufeAnwenden(st.typ, st.param, t, 'ent');
        return aus(nurBuchstaben(t));
      });
    } else if (v.typ === 'adfgvx' && richtung === 'ent') {
      const q = quadrat(v.quadrat, { groesse: 6 }).join('');
      dazu('P3', 'reihenfolge', () => aus(spaltentransposition(polybios(text, { schluessel: q, kopf: 'ADFGVX' }, 'ent'), v.schluessel, 'ent')));
    } else if (!def.involutorisch && v.typ !== 'baukasten') {
      const code = TRANSPOSITIONEN.includes(v.typ) ? 'permutation' : 'richtung';
      dazu('P3', code, () => {
        try {
          return aus(rechne(v, text, gegen));
        } catch (e) {
          if (v.typ === 'skytale' && e instanceof KryptoFehler) return aus(rechne({ ...v, fuellzeichen: null }, text, gegen));
          throw e;
        }
      });
      if (v.typ === 'fleissner') dazu('P3', 'permutation', () => aus(rechne({ ...v, drehung: v.drehung === 'links' ? 'rechts' : 'links' }, text, richtung)));
    }
    // P3: affin entschlüsseln mit t nach statt vor der Multiplikation abgezogen, p' = m⁻¹ · c − t (SPEC W1 §8)
    if (v.typ === 'affin' && richtung === 'ent') {
      const bas = v.basis === undefined ? 0 : v.basis;
      const b = v.b === undefined ? 0 : v.b;
      dazu('P3', 'reihenfolge', () => aus([...nurBuchstaben(text)].map((c) => buchstabe(inversMod26(v.a) * wert(c, bas) - b, bas)).join('')));
    }
    // P1: Zählbasis und Position
    if (v.typ === 'caesar') {
      dazu('P1', 'zaehlbasis', () => aus(caesar(text, v.k + 1, richtung)));
      dazu('P1', 'zaehlbasis', () => aus(caesar(text, v.k - 1, richtung)));
    }
    if (['vigenere', 'autokey', 'porta'].includes(v.typ)) {
      dazu('P1', 'zaehlbasis', () => aus(rechne({ ...v, schluessel: caesar(v.schluessel, 1) }, text, richtung)));
    }
    if (v.typ === 'affin') dazu('P1', 'zaehlbasis', () => aus(rechne({ ...v, basis: v.basis === 1 ? 0 : 1 }, text, richtung)));
    if (v.typ === 'vigenere') {
      const s = nurBuchstaben(v.schluessel);
      if (s.length > 1) dazu('P1', 'position', () => aus(vigenere(text, s.slice(1) + s[0], richtung)));
    }
    // P2: nur Zahlenausgabe mit A = 1 (Caesar, Vigenère)
    if (ausgabe === 'zahlen' && basis === 1 && (v.typ === 'caesar' || v.typ === 'vigenere')) {
      const t = nurBuchstaben(text);
      const s = v.typ === 'caesar' ? null : nurBuchstaben(v.schluessel);
      const vz = richtung === 'ver' ? 1 : -1;
      const roh = [...t].map((c, i) => wert(c) + vz * (s === null ? v.k : verschiebung(s[i % s.length])));
      dazu('P2', 'null_statt_z', () => korrekt.map((z) => (z === 26 ? 0 : z)));
      if (richtung === 'ver') dazu('P2', 'ueberlauf', () => roh.map((r, i) => (r > 26 ? r : korrekt[i])));
      else dazu('P2', 'negativ', () => roh.map((r, i) => (r < 1 ? r : korrekt[i])));
    }
    // P4: Paarbildung (Playfair) und Füllzeichen (Transposition)
    if (v.typ === 'playfair' && richtung === 'ver') {
      dazu('P4', 'paare', () => {
        const ij = v.ij === undefined ? 'I' : v.ij;
        let t = quadratText(text, 5, ij);
        if (t.length % 2) t += (v.fuellzeichen || 'X').toUpperCase();
        const paare = [];
        for (let i = 0; i < t.length; i += 2) paare.push(t.slice(i, i + 2));
        return aus(playfairRechne(quadrat(v.schluessel, { groesse: 5, ij }), paare, 'ver'));
      });
    }
    if (v.typ === 'skytale') dazu('P4', 'fuellung', () => aus(rechne({ ...v, fuellzeichen: v.fuellzeichen === null ? 'X' : null }, text, richtung)));
    if (v.typ === 'spaltentransposition') dazu('P4', 'fuellung', () => aus(rechne({ ...v, fuellzeichen: v.fuellzeichen ? null : 'X' }, text, richtung)));
    return liste;
  }

  const verfahren = {
    TYPEN,
    pruefe: verfahrenPruefe,
    anwenden: verfahrenAnwenden,
    varianten: verfahrenVarianten,
  };

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
    // Polyalphabetisch und Bigramme (kein zweiQuadrat – Namenskollision, Verifikation H2)
    vigenere,
    autokey,
    porta,
    pendelFolge,
    schluesselstrom,
    quadrat,
    playfairPaare,
    playfair,
    kreuzquadrat,
    zweiQuadratZahl,
    polybios,
    adfgvx,
    // Transposition
    gartenzaun,
    skytale,
    fleissner,
    schablonePruefen,
    spaltenReihenfolge,
    spaltentransposition,
    umkehrung,
    blockrotation,
    skytaleRaster,
    gartenzaunSchienen,
    fleissnerStellungen,
    fleissnerDrehgruppen,
    ringFolge,
    ring,
    // Bits, ASCII, XOR
    ascii,
    zeichenAusAscii,
    textZuBytes,
    bytesZuText,
    byteZuBits,
    bitsZuByte,
    textZuBits,
    bitsZuText,
    xorBits,
    undBits,
    oderBits,
    xor,
    hex,
    vonHex,
    rotiereBits,
    // Moderne Toy-Verfahren
    kryptos16,
    rm16,
    miniEnigma,
    kryptosHash,
    pruefsumme,
    sha256,
    hashZahl,
    // Kryptoanalyse
    DEUTSCH,
    haeufigkeiten,
    anteile,
    rangfolge,
    teiltexte,
    bigramme,
    ngramme,
    koinzidenzindex,
    koinzidenzindexBruch,
    mittlererKoinzidenzindex,
    teilsubstitution,
    musterSuchen,
    teilerTabelle,
    primfaktoren,
    friedman,
    friedmanWert,
    kasiski,
    verschiebungSchaetzen,
    chiQuadrat,
    // Zahlentheorie, asymmetrisch, Schlüsselzahl
    ggT: ggTOeffentlich,
    erweiterterEuklid,
    inverses,
    modpow,
    istPrim,
    ordnung,
    teileMitRest,
    probedivision,
    rsa,
    dh,
    schluesselanzahl,
    // Verfahrens-Objekt und Baukasten
    verfahren,
    baukasten,
  };
});
