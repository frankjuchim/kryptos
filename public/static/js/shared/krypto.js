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
    const pos = positionen(q);
    let paare;
    if (richtung === 'ver') {
      paare = playfairPaare(text, opt);
    } else {
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
    else if (Number.isInteger(zahlenschluessel)) liste = [...String(zahlenschluessel)].map(Number);
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

  /** eine Runde: ver XOR → S-Box → Transposition; ent Transposition → S⁻¹ → XOR */
  function k16Runde(block16, rundenschluessel, richtung = 'ver') {
    pruefeBlock(block16);
    pruefeBlock(rundenschluessel, 'Der Rundenschlüssel');
    pruefeRichtung(richtung);
    if (richtung === 'ver') return k16Transponiere(k16Sbox(block16 ^ rundenschluessel));
    return k16Sbox(k16Transponiere(block16), 'ent') ^ rundenschluessel;
  }

  function k16Verschluesseln(block16, schluessel16, { runden = 4, protokoll = false } = {}) {
    pruefeBlock(block16);
    pruefeBlock(schluessel16, 'Der Schlüssel');
    pruefeRunden(runden);
    let x = block16;
    const liste = [];
    for (let r = 1; r <= runden; r++) {
      const k = k16Rundenschluessel(schluessel16, r);
      const nachXor = x ^ k;
      const nachSBox = k16Sbox(nachXor);
      const nachTransposition = k16Transponiere(nachSBox);
      if (protokoll) liste.push({ runde: r, eingang: x, schluessel: k, nachXor, nachSBox, nachTransposition });
      x = nachTransposition;
    }
    return protokoll ? { ergebnis: x, runden: liste } : x;
  }

  function k16Entschluesseln(block16, schluessel16, { runden = 4 } = {}) {
    pruefeBlock(block16);
    pruefeBlock(schluessel16, 'Der Schlüssel');
    pruefeRunden(runden);
    let x = block16;
    for (let r = runden; r >= 1; r--) x = k16Runde(x, k16Rundenschluessel(schluessel16, r), 'ent');
    return x;
  }

  /** Lawine: je Runde die Bitpositionen (1 = höchstwertig … 16), die sich unterscheiden, wenn Bit `bit` kippt */
  function k16Lawine(block16, schluessel16, bit, { runden = 4 } = {}) {
    pruefeGanzzahl(bit, 'Bitposition');
    if (bit < 1 || bit > 16) throw new KryptoFehler('Die Bitposition liegt zwischen 1 und 16.');
    const a = k16Verschluesseln(block16, schluessel16, { runden, protokoll: true }).runden;
    const b = k16Verschluesseln(block16 ^ (1 << (16 - bit)), schluessel16, { runden, protokoll: true }).runden;
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
      versuche++;
      if (kandidat.toUpperCase() !== eigen && kryptosHash(kandidat).wert === ziel) return { text: kandidat, wert: ziel, versuche };
      // nächster Kandidat (Zähler zur Basis |alphabet|, bei Überlauf eine Stelle länger)
      let p = stellen.length - 1;
      while (p >= 0 && stellen[p] === zeichen.length - 1) stellen[p--] = 0;
      if (p < 0) stellen.unshift(0);
      else stellen[p]++;
    }
    return null;
  };

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

  /** Friedman: k ≈ (iD − iZ)·n / ((n − 1)·I − iZ·n + iD) (Design §6.4: iZ = 0,038, nie 1/26) */
  function friedmanWert(n, I, { iD = 0.076, iZ = 0.038 } = {}) {
    pruefeGanzzahl(n, 'Textlänge n');
    if (n < 2) throw new KryptoFehler('Die Textlänge muss mindestens 2 sein.');
    if (typeof I !== 'number' || !Number.isFinite(I) || I < 0 || I > 1) throw new KryptoFehler('Der Koinzidenzindex liegt zwischen 0 und 1.');
    return ((iD - iZ) * n) / ((n - 1) * I - iZ * n + iD);
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
    const gruppen = []; // { laenge, positionen }
    // Gruppen gleicher Folgen der Länge L; nur wiederholte Positionen werden verlängert
    let L = min;
    let aktuell = new Map();
    for (let i = 0; i + L <= n; i++) {
      const f = t.slice(i, i + L);
      if (!aktuell.has(f)) aktuell.set(f, []);
      aktuell.get(f).push(i);
    }
    while (L <= Math.floor(n / 2)) {
      const wiederholt = [...aktuell.values()].filter((p) => p.length >= 2);
      if (wiederholt.length === 0) break;
      for (const p of wiederholt) gruppen.push({ laenge: L, positionen: p });
      const naechste = new Map();
      for (const p of wiederholt) {
        for (const i of p) {
          if (i + L + 1 > n) continue;
          const f = t.slice(i, i + L + 1);
          if (!naechste.has(f)) naechste.set(f, []);
          naechste.get(f).push(i);
        }
      }
      aktuell = naechste;
      L++;
    }
    // maximal: weder alle Vorkommen nach rechts noch alle nach links mit demselben Zeichen verlängerbar
    const maximal = gruppen.filter(({ laenge, positionen: p }) => {
      const rechts = p.every((i) => i + laenge < n && t[i + laenge] === t[p[0] + laenge]);
      const links = p.every((i) => i > 0 && t[i - 1] === t[p[0] - 1]);
      return !rechts && !links;
    });
    maximal.sort((a, b) => b.laenge - a.laenge || b.positionen.length - a.positionen.length || a.positionen[0] - b.positionen[0]);
    const wiederholungen = maximal.slice(0, Math.max(0, anzahl)).map(({ laenge, positionen }) => ({
      folge: t.slice(positionen[0], positionen[0] + laenge),
      positionen: positionen.slice(),
      abstaende: positionen.slice(1).map((p, i) => p - positionen[i]),
    }));
    // Gesamt-Abstände ohne Doppelzählung (Paare, die in einer längeren Folge mit gleichem Abstand liegen)
    const abstaende = [];
    const paare = []; // { a, ende, d }
    for (const w of wiederholungen) {
      const l = w.folge.length;
      for (let i = 1; i < w.positionen.length; i++) {
        const a = w.positionen[i - 1];
        const d = w.positionen[i] - a;
        const gedeckt = paare.some((q) => q.d === d && q.a <= a && a + l <= q.ende);
        if (!gedeckt) {
          abstaende.push(d);
          paare.push({ a, ende: a + l, d });
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
    const reihenfolge = werte.map((w, v) => v).sort((a, b) => werte[b] - werte[a] || a - b);
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
    kryptosHash,
    // Kryptoanalyse
    DEUTSCH,
    haeufigkeiten,
    anteile,
    rangfolge,
    teiltexte,
    bigramme,
    koinzidenzindex,
    friedman,
    friedmanWert,
    kasiski,
    verschiebungSchaetzen,
    chiQuadrat,
  };
});
