'use strict';
// Neue Blöcke (AUFGABENFORMAT_KRYPTO §7): alphabet, haeufigkeit, quadrat, bits, schaubild, matrix, werkzeug.
// Je Block texte(b) (Texte, in denen Lücken [[id]] stehen dürfen – Kern-Hook format.js → blockTexte) und
// validiere(b, fe, we, kontext) mit Neuberechnung über die Bibliothek (quadrat, xorBits, schablonePruefen).
// Fehler = fe(meldung), Hinweis = we(meldung). Rechnen ausschließlich über public/static/js/shared/krypto.js.

const K = require('../../public/static/js/shared/krypto');
const { WERKZEUG_IDS, werkzeug, pruefeVoreinstellung, pruefeBlockFelder } = require('./werkzeuge');

const LUECKE = /^\[\[[A-Za-z0-9_-]{1,40}\]\]$/;
const istObjekt = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
const istText = (x) => typeof x === 'string' && x.trim().length > 0;
const istLuecke = (x) => typeof x === 'string' && LUECKE.test(x.trim());
const zeichenAnzahl = (s) => [...s].length;
const liste = (x) => (Array.isArray(x) ? x : []);
const nurTexte = (arr) => arr.filter((x) => typeof x === 'string');
const BUCHSTABE = /^[A-Za-z]$/;

/** Fehler der Bibliothek als Meldung (KryptoFehler) – andere Fehler werden weitergereicht. */
function bibliothek(fn, fe) {
  try {
    return fn();
  } catch (e) {
    if (e && e.name === 'KryptoFehler') {
      fe(e.message);
      return undefined;
    }
    throw e;
  }
}

function pruefeTitel(b, fe) {
  if (b.titel !== undefined && typeof b.titel !== 'string') fe('titel muss ein Text sein.');
}

/* ---------- 7.1 alphabet ---------- */

const alphabet = {
  texte: (b) => nurTexte(liste(b.zeilen).flatMap((z) => (istObjekt(z) && Array.isArray(z.werte) ? z.werte : []))),
  validiere(b, fe, we) {
    if (b.basis !== 0 && b.basis !== 1) fe('basis muss 0 oder 1 sein.');
    if (b.zahlen !== undefined && typeof b.zahlen !== 'boolean') fe('zahlen muss true oder false sein.');
    pruefeTitel(b, fe);
    if (b.markiert !== undefined && (!Array.isArray(b.markiert) || !b.markiert.every((x) => Number.isInteger(x) && x >= 0 && x <= 25))) {
      fe('markiert muss eine Liste von Spalten 0–25 sein.');
    }
    if (!Array.isArray(b.zeilen) || b.zeilen.length < 1 || b.zeilen.length > 4) return fe('zeilen muss eine Liste mit 1–4 Zeilen sein.');
    const buchstabenZeilen = [];
    b.zeilen.forEach((z, i) => {
      const o = `Zeile ${i + 1}`;
      if (!istObjekt(z)) return fe(`${o} ist kein Objekt { label, werte }.`);
      if (!istText(z.label) || zeichenAnzahl(z.label) > 20) fe(`${o}: label fehlt oder ist länger als 20 Zeichen.`);
      let eintraege = null;
      if (typeof z.werte === 'string') {
        if (/^[A-Za-z·]{26}$/.test(z.werte)) eintraege = [...z.werte];
      } else if (Array.isArray(z.werte) && z.werte.length === 26) {
        const ok = z.werte.every((x) => typeof x === 'string' && (x === '' || zeichenAnzahl(x) === 1 || istLuecke(x)));
        if (ok) eintraege = z.werte;
      }
      if (!eintraege) return fe(`${o}: werte braucht 26 Einträge (Text aus Buchstaben/„·“ oder Liste aus einem Zeichen, "", "·" oder einer Lücke [[id]]).`);
      if (eintraege.every((x) => BUCHSTABE.test(x))) buchstabenZeilen.push({ nr: i + 1, werte: eintraege.map((x) => x.toUpperCase()) });
    });
    // Hinweis: zwei reine Buchstabenzeilen → Zuordnung Zeile 1 → Zeile 2 muss eine Bijektion sein
    for (let i = 1; i < buchstabenZeilen.length; i++) {
      const a = buchstabenZeilen[i - 1];
      const c = buchstabenZeilen[i];
      if (new Set(a.werte).size !== 26 || new Set(c.werte).size !== 26) {
        we(`Zuordnung Zeile ${a.nr} → Zeile ${c.nr} ist keine Bijektion (Buchstaben kommen doppelt vor).`);
      }
    }
  }
};

/* ---------- 7.2 haeufigkeit ---------- */

const haeufigkeit = {
  texte: () => [],
  validiere(b, fe, we) {
    pruefeTitel(b, fe);
    if (!['text', 'werte'].includes(b.quelle)) fe('quelle muss text oder werte sein.');
    if (b.quelle === 'text') {
      if (typeof b.text !== 'string' || b.text.length > 5000 || K.nurBuchstaben(b.text).length === 0) {
        fe('text fehlt, ist länger als 5000 Zeichen oder enthält keine Buchstaben.');
      } else {
        const n = K.nurBuchstaben(b.text).length;
        if (n < 50) we(`Häufigkeitsanalyse braucht längere Texte – P6 (nur ${n} Buchstaben).`);
      }
    }
    if (b.quelle === 'werte' || b.werte !== undefined) {
      const ok = istObjekt(b.werte) && Object.entries(b.werte).every(([k, v]) => /^[A-Z]$/.test(k) && typeof v === 'number' && Number.isFinite(v) && v >= 0);
      if (!ok) fe('werte muss ein Objekt aus Buchstaben A–Z → Zahl ≥ 0 sein.');
    }
    if (b.referenz !== undefined && b.referenz !== null && b.referenz !== 'deutsch') fe('referenz muss deutsch oder null sein.');
    if (b.sortierung !== undefined && !['alphabetisch', 'absteigend'].includes(b.sortierung)) fe('sortierung muss alphabetisch oder absteigend sein.');
    if (b.einheit !== undefined && !['absolut', 'prozent'].includes(b.einheit)) fe('einheit muss absolut oder prozent sein.');
    if (b.markiert !== undefined && (!Array.isArray(b.markiert) || !b.markiert.every((x) => typeof x === 'string' && BUCHSTABE.test(x)))) {
      fe('markiert muss eine Liste einzelner Buchstaben sein.');
    }
  }
};

/* ---------- 7.3 quadrat ---------- */

const QUADRAT_ARTEN = ['vigenere', 'playfair', 'polybios', 'frei'];

function verschiedeneZeichen(s, n) {
  return typeof s === 'string' && zeichenAnzahl(s) === n && new Set([...s]).size === n;
}

const quadrat = {
  texte: (b) => nurTexte(liste(b.zellen).flatMap((z) => (Array.isArray(z) ? z : []))),
  validiere(b, fe) {
    pruefeTitel(b, fe);
    if (!QUADRAT_ARTEN.includes(b.art)) return fe(`art muss ${QUADRAT_ARTEN.join(' | ')} sein.`);
    const groesse = b.groesse === undefined ? 5 : b.groesse;
    if (groesse !== 5 && groesse !== 6) return fe('groesse muss 5 oder 6 sein.');
    if (b.art === 'playfair' && groesse !== 5) return fe('groesse muss bei playfair 5 sein.');
    if (b.schluessel !== undefined && (typeof b.schluessel !== 'string' || K.nurBuchstaben(b.schluessel).length === 0)) fe('schluessel muss Buchstaben enthalten.');
    if (b.ij !== undefined && b.ij !== 'I' && b.ij !== 'J') fe('ij muss I oder J sein.');
    if (b.kopf !== undefined) {
      const ok = verschiedeneZeichen(b.kopf, groesse) || (istObjekt(b.kopf) && verschiedeneZeichen(b.kopf.zeilen, groesse) && verschiedeneZeichen(b.kopf.spalten, groesse));
      if (!ok) fe(`kopf muss ${groesse} verschiedene Zeichen haben (oder { zeilen, spalten } mit je ${groesse} Zeichen).`);
    }
    if (b.ausschnitt !== undefined) {
      if (b.art !== 'vigenere') fe('ausschnitt gibt es nur bei art vigenere.');
      else if (!Array.isArray(b.ausschnitt) || !b.ausschnitt.length || !b.ausschnitt.every((x) => typeof x === 'string' && BUCHSTABE.test(x))) {
        fe('ausschnitt muss eine Liste einzelner Buchstaben sein.');
      }
    }
    const kante = b.art === 'vigenere' ? 26 : groesse;
    if (b.hervorheben !== undefined) {
      const h = b.hervorheben;
      if (!istObjekt(h)) fe('hervorheben muss ein Objekt { zeile, spalte, zellen } sein.');
      else {
        for (const k of ['zeile', 'spalte']) if (h[k] !== undefined && !(typeof h[k] === 'string' && BUCHSTABE.test(h[k]))) fe(`hervorheben.${k} muss ein Buchstabe sein.`);
        if (h.zellen !== undefined) {
          const ok = Array.isArray(h.zellen) && h.zellen.every((p) => Array.isArray(p) && p.length === 2 && p.every((x) => Number.isInteger(x) && x >= 0 && x < kante));
          if (!ok) fe(`hervorheben.zellen: jede Zelle [z, s] muss im Quadrat liegen (0–${kante - 1}).`);
        }
      }
    }
    if (b.zellen === undefined) {
      if (b.art === 'frei') fe('zellen fehlt (art frei).');
      return;
    }
    if (b.art === 'vigenere') return fe('zellen gibt es nicht bei art vigenere.');
    const form = Array.isArray(b.zellen) && b.zellen.length === groesse && b.zellen.every((z) => Array.isArray(z) && z.length === groesse);
    if (!form) return fe(`zellen muss ${groesse} × ${groesse} Zellen haben (rechteckig).`);
    const gesehen = new Set();
    for (const z of b.zellen) {
      for (const c of z) {
        if (typeof c !== 'string' || !(c === '' || zeichenAnzahl(c) === 1 || istLuecke(c))) return fe('zellen: jede Zelle ist ein Zeichen, "" oder eine Lücke [[id]].');
        if (c === '' || istLuecke(c)) continue;
        const g = c.toUpperCase();
        if (gesehen.has(g)) fe(`Zeichen „${g}“ kommt doppelt vor.`);
        gesehen.add(g);
      }
    }
    // Neuberechnung: Schlüssel und Zellen müssen übereinstimmen
    if ((b.art === 'playfair' || b.art === 'polybios') && typeof b.schluessel === 'string') {
      const soll = bibliothek(() => K.quadrat(b.schluessel, { groesse, ij: b.ij || 'I' }), fe);
      if (!soll) return;
      for (let r = 0; r < groesse; r++) {
        const passt = b.zellen[r].every((c, s) => c === '' || istLuecke(c) || c.toUpperCase() === soll[r][s]);
        if (!passt) return fe(`zellen passen nicht zum Schlüssel (Zeile ${r + 1} erwartet ${soll[r]}).`);
      }
    }
  }
};

/* ---------- 7.4 bits ---------- */

const TRENNER = ['⊕', '=', '→'];
const istDatenzeile = (z) => istObjekt(z) && typeof z.bits === 'string';

const bits = {
  texte: (b) => liste(b.zeilen).filter(istDatenzeile).map((z) => z.bits),
  validiere(b, fe) {
    pruefeTitel(b, fe);
    if (!Array.isArray(b.zeilen) || !b.zeilen.length) return fe('zeilen fehlt oder ist leer.');
    const daten = [];
    let formFehler = false;
    b.zeilen.forEach((z, i) => {
      const o = `Zeile ${i + 1}`;
      if (istObjekt(z) && z.trenner !== undefined && z.bits === undefined) {
        if (!TRENNER.includes(z.trenner)) {
          formFehler = true;
          fe(`${o}: trenner muss ${TRENNER.join(' | ')} sein.`);
        }
        return;
      }
      if (!istDatenzeile(z) || typeof z.label !== 'string') {
        formFehler = true;
        return fe(`${o}: weder Trennzeile { trenner: ⊕ | = | → } noch Datenzeile { label, bits }.`);
      }
      if (istLuecke(z.bits)) return daten.push({ luecke: true });
      const n = K.normBits(z.bits);
      if (!/^[01]+$/.test(n)) {
        formFehler = true;
        return fe(`${o}: bits: nur 0 und 1 oder genau eine Lücke [[id]].`);
      }
      daten.push({ luecke: false, bits: n });
    });
    const feste = daten.filter((d) => !d.luecke);
    const laenge = feste.length ? feste[0].bits.length : null;
    if (feste.some((d) => d.bits.length !== laenge)) {
      formFehler = true;
      fe('Datenzeilen müssen gleich lang sein.');
    }
    if (b.gruppe !== undefined && ![0, 4, 8].includes(b.gruppe)) fe('gruppe muss 0, 4 oder 8 sein.');
    if (b.markiert !== undefined) {
      const ok = Array.isArray(b.markiert) && b.markiert.every((x) => Number.isInteger(x) && x >= 0 && (laenge === null || x < laenge));
      if (!ok) fe(`markiert muss eine Liste von Bitpositionen sein (0 = links${laenge ? `, höchstens ${laenge - 1}` : ''}).`);
    }
    if (b.pruefe === undefined) return;
    if (b.pruefe !== 'xor') return fe('pruefe muss xor sein.');
    if (daten.length < 3) return fe('pruefe xor braucht mindestens zwei Datenzeilen vor der Ergebniszeile.');
    if (formFehler) return;
    const letzte = daten[daten.length - 1];
    const vorher = daten.slice(0, -1);
    if (letzte.luecke || vorher.some((d) => d.luecke)) return;
    const erwartet = bibliothek(() => K.xorBits(...vorher.map((d) => d.bits)), fe);
    if (erwartet !== undefined && erwartet !== letzte.bits) fe(`Neuberechnung: letzte Zeile muss ${erwartet} sein.`);
  }
};

/* ---------- 7.5 schaubild ---------- */

const AKTEUR_ARTEN = ['person', 'angreifer', 'ca', 'server'];

const schaubild = {
  texte: (b) => nurTexte(liste(b.schritte).map((s) => (istObjekt(s) ? s.text : null))),
  validiere(b, fe) {
    pruefeTitel(b, fe);
    const ids = new Set();
    if (!Array.isArray(b.akteure) || b.akteure.length < 2 || b.akteure.length > 6) fe('akteure muss 2–6 Akteure haben.');
    for (const a of liste(b.akteure)) {
      if (!istObjekt(a)) {
        fe('Akteur ist kein Objekt { id, name }.');
        continue;
      }
      if (typeof a.id !== 'string' || !/^[A-Z0-9]{1,4}$/.test(a.id)) fe(`Akteur-id „${a.id}“ ist ungültig (A–Z, 0–9, höchstens 4 Zeichen).`);
      else if (ids.has(a.id)) fe(`Akteur-id „${a.id}“ doppelt.`);
      else ids.add(a.id);
      if (!istText(a.name) || zeichenAnzahl(a.name) > 30) fe(`Akteur „${a.id}“: name fehlt oder ist länger als 30 Zeichen.`);
      if (a.art !== undefined && !AKTEUR_ARTEN.includes(a.art)) fe(`Akteur „${a.id}“: art muss ${AKTEUR_ARTEN.join(' | ')} sein.`);
    }
    if (!Array.isArray(b.schritte) || b.schritte.length < 1 || b.schritte.length > 12) return fe('schritte muss 1–12 Schritte haben.');
    if (!b.schritte.every((s, i) => istObjekt(s) && s.nr === i + 1)) fe('Schritte müssen lückenlos ab 1 nummeriert sein.');
    b.schritte.forEach((s, i) => {
      if (!istObjekt(s)) return;
      const o = `Schritt ${i + 1}`;
      for (const k of ['von', 'an']) if (!ids.has(s[k])) fe(`${o}: Akteur „${s[k]}“ ist unbekannt.`);
      if (!istText(s.text) || zeichenAnzahl(s.text) > 160) fe(`${o}: text fehlt oder ist länger als 160 Zeichen.`);
    });
  }
};

/* ---------- 7.6 matrix ---------- */

const matrix = {
  texte: (b) => nurTexte(liste(b.zeilen).flatMap((z) => (Array.isArray(z) ? z : []))),
  validiere(b, fe) {
    pruefeTitel(b, fe);
    if (b.zeilen === undefined && b.schablone === undefined) return fe('matrix braucht zeilen oder eine schablone.');
    let zeilen = 0;
    let spalten = 0;
    if (b.zeilen !== undefined) {
      if (!Array.isArray(b.zeilen) || !b.zeilen.length || !b.zeilen.every((z) => Array.isArray(z) && z.every((c) => typeof c === 'string'))) {
        return fe('zeilen muss eine Liste von Zeilen (Listen von Texten) sein.');
      }
      zeilen = b.zeilen.length;
      spalten = b.zeilen[0].length;
      if (b.zeilen.some((z) => z.length !== spalten)) fe('Zeilen der matrix müssen gleich lang sein (leere Zellen als "").');
    }
    if (b.kopf !== undefined) {
      if (!Array.isArray(b.kopf) || !b.kopf.every((x) => typeof x === 'string')) fe('kopf muss eine Liste von Zeichen sein.');
      else if (b.zeilen !== undefined && b.kopf.length !== spalten) fe(`kopf muss so viele Einträge haben wie Spalten (${spalten}).`);
    }
    if (b.reihenfolge !== undefined) {
      const n = b.zeilen !== undefined ? spalten : Array.isArray(b.kopf) ? b.kopf.length : 0;
      if (b.reihenfolge === true) {
        if (!Array.isArray(b.kopf)) fe('reihenfolge true braucht kopf.');
      } else {
        const ok = Array.isArray(b.reihenfolge) && b.reihenfolge.length === n && [...b.reihenfolge].sort((x, y) => x - y).every((x, i) => x === i + 1);
        if (!ok) fe('reihenfolge muss eine Permutation von 1 bis n sein.');
      }
    }
    if (b.leserichtung !== undefined && !['zeilenweise', 'spaltenweise'].includes(b.leserichtung)) fe('leserichtung muss zeilenweise oder spaltenweise sein.');
    if (b.schablone !== undefined) {
      if (![4, 6, 8].includes(b.groesse)) fe('groesse muss 4, 6 oder 8 sein (Fleißner-Schablone).');
      else {
        // Neuberechnung: jede Zelle über die 4 Drehungen genau einmal frei (Löcher [z, s] ab 1)
        const r = K.schablonePruefen(b.groesse, b.schablone);
        if (!r.ok) for (const m of r.fehler) fe(m);
        if (b.zeilen === undefined) zeilen = spalten = b.groesse;
      }
      if (b.drehung !== undefined && !['rechts', 'links'].includes(b.drehung)) fe('drehung muss rechts oder links sein.');
      if (b.zeige !== undefined && !['schablone', 'stellungen'].includes(b.zeige)) fe('zeige muss schablone oder stellungen sein.');
    }
    if (b.markiert !== undefined) {
      const ok = Array.isArray(b.markiert) && b.markiert.every((p) => Array.isArray(p) && p.length === 2 && Number.isInteger(p[0]) && Number.isInteger(p[1]) && p[0] >= 0 && p[0] < zeilen && p[1] >= 0 && p[1] < spalten);
      if (!ok) fe('markiert: jede Zelle [z, s] muss in der matrix liegen (ab 0).');
    }
  }
};

/* ---------- 7.7 werkzeug ---------- */

const werkzeugBlock = {
  texte: () => [],
  validiere(b, fe) {
    const wz = werkzeug(b.id);
    if (!wz) fe(`Werkzeug „${b.id}“ ist unbekannt (${WERKZEUG_IDS.join(', ')}).`);
    if (b.titel !== undefined && !istText(b.titel)) fe('titel muss ein Text sein.');
    if (b.voreinstellung !== undefined) {
      if (!istObjekt(b.voreinstellung)) fe('voreinstellung muss ein Objekt sein.');
      else if (wz) pruefeVoreinstellung(wz, b.voreinstellung, fe); // Schlüssel, reiter, richtung, modus, variante (M6 E73)
    }
    pruefeBlockFelder(b, fe); // M11 (E217): gefuehrt, hinweis
  }
};

const BLOECKE = Object.freeze({ alphabet, haeufigkeit, quadrat, bits, schaubild, matrix, werkzeug: werkzeugBlock });

/** Alle Blöcke in die Kern-Registry eintragen. */
function registriere(F) {
  for (const [typ, vertrag] of Object.entries(BLOECKE)) F.registriereBlock(typ, vertrag);
}

module.exports = { BLOECKE, registriere };
