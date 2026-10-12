'use strict';
// Fallen-Diagnose (AUFGABENFORMAT_KRYPTO §9): Kandidaten typischer Fehlrechnungen (Bibliothek: verfahren.varianten,
// bei fremden Chiffren loesung.fehlmuster) werden mit der falschen Antwort verglichen. Die Texte sind fest und
// verraten nie Lösungszeichen – sie beschreiben nur das Fehlmuster. Rückgabe je Teil höchstens zwei Einträge
// { p, code, text }, Priorität P3 > P1 > P2 > P4 > P9, danach P5–P10 nach Nummer.

const K = require('../../public/static/js/shared/krypto');
const { FALLEN } = require('./fach');

const PRIORITAET = Object.freeze(['P3', 'P1', 'P2', 'P4', 'P9']);

/** Feste Texte, Schlüssel `art:code`, Rückfall `*:code` (Tasks 27–29 ergänzen weitere Interaktionen). */
const TEXTE = Object.freeze({
  'chiffre:richtung': 'Du hast in die falsche Richtung verschoben – beim Entschlüsseln wird zurückgerechnet.',
  '*:reihenfolge': 'Die Stufen müssen in umgekehrter Reihenfolge zurückgerechnet werden.',
  '*:permutation': 'Du hast die Umordnung nicht umgekehrt (inverse Permutation/Drehrichtung).',
  '*:zaehlbasis': 'Alle Zeichen liegen genau eine Stelle daneben – prüfe die Nummerierung (A = 1 oder A = 0).',
  '*:position': 'Der Schlüssel ist um eine Stelle versetzt angelegt.',
  '*:null_statt_z': 'Rest 0 bedeutet bei A = 1 den Buchstaben Z (26).',
  '*:ueberlauf': 'Über Z hinaus geht es wieder bei A weiter – rechne mod 26.',
  '*:negativ': 'mod liefert den kleinsten nicht negativen Rest.',
  '*:paare': 'Prüfe die Paarbildung: Doppelbuchstaben trennen, J = I, Füllzeichen.',
  '*:fuellung': 'Prüfe Füllzeichen und die unvollständige letzte Zeile.'
});

/** Text zu Interaktion, Falle und Code; unbekannter Code → allgemeiner Hinweis auf die Falle. */
function text(art, p, code) {
  const t = TEXTE[`${art}:${code}`] || TEXTE[`*:${code}`];
  if (t) return t;
  const f = FALLEN[p];
  return f ? `Achtung, Falle ${p}: ${f.titel}.` : `Achtung, Falle ${p}.`;
}

const istLeerEintrag = (x) => x === undefined || x === null || x === ' ' || x === '';

/** Falsche Positionen: jede Position bis zur größeren Länge, an der die Antwort nicht der Lösung gleicht. */
function falschePositionen(antwort, loesung) {
  const out = [];
  const n = Math.max(antwort.length, loesung.length);
  for (let i = 0; i < n; i++) if (i >= loesung.length || antwort[i] !== loesung[i]) out.push(i);
  return out;
}

const gleich = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

/**
 * Passt ein Kandidat zur Antwort? Vollständig gleich – oder (mindestens 4 nicht leere Eingaben, mindestens eine falsche
 * Position und ≥ 80 % der falschen Positionen durch den Kandidaten erklärt). Leere Eingaben erklären nie etwas.
 */
function passt(antwort, loesung, kandidat) {
  if (gleich(antwort, kandidat)) return true;
  if (antwort.filter((x) => !istLeerEintrag(x)).length < 4) return false;
  const falsch = falschePositionen(antwort, loesung);
  if (!falsch.length) return false;
  const erklaert = falsch.filter((i) => i < antwort.length && !istLeerEintrag(antwort[i]) && antwort[i] === kandidat[i]).length;
  return erklaert / falsch.length >= 0.8 - 1e-9;
}

function rang(p) {
  const i = PRIORITAET.indexOf(p);
  return i >= 0 ? i : PRIORITAET.length + (Number(String(p).slice(1)) || 99);
}

/** Treffer nach Priorität sortieren, Duplikate entfernen, höchstens zwei, mit festem Text. */
function auswaehlen(art, treffer) {
  const gesehen = new Set();
  const out = [];
  const sortiert = treffer.map((t, i) => ({ ...t, i })).sort((a, b) => rang(a.p) - rang(b.p) || a.i - b.i);
  for (const t of sortiert) {
    const k = `${t.p}:${t.code}`;
    if (gesehen.has(k)) continue;
    gesehen.add(k);
    out.push({ p: t.p, code: t.code, text: text(art, t.p, t.code) });
    if (out.length === 2) break;
  }
  return out;
}

/**
 * Umbruchstellen (nur caesar/vigenere, A = 1): `null` = Ergebnis Z (Rest 0), `ueber` = Wert außerhalb 1…26 ohne mod.
 * ver: x = wert(p) + s, ent: x = wert(c) − s; s = k bzw. Verschiebung des Schlüsselbuchstabens.
 */
function umbruchStellen(v, eingabe, richtung) {
  const leer = { null: [], ueber: [] };
  if (!v || (v.typ !== 'caesar' && v.typ !== 'vigenere')) return leer;
  const t = K.nurBuchstaben(String(eingabe || ''));
  const schl = v.typ === 'vigenere' ? K.nurBuchstaben(String(v.schluessel || '')) : '';
  if (v.typ === 'vigenere' && !schl.length) return leer;
  const out = { null: [], ueber: [] };
  for (let i = 0; i < t.length; i++) {
    const s = v.typ === 'caesar' ? Number(v.k) : K.verschiebung(schl[i % schl.length]);
    const w = K.wert(t[i], 1);
    if (richtung === 'ver') {
      const x = w + s;
      if (x === 26) out.null.push(i);
      else if (x > 26) out.ueber.push(i);
    } else {
      const x = w - s;
      if (x === 0) out.null.push(i);
      else if (x < 0) out.ueber.push(i);
    }
  }
  return out;
}

/** Text- bzw. Zahlenantwort als Liste von Einträgen (Zeichen bzw. Zahlen). */
const alsListe = (x) => (Array.isArray(x) ? x : [...String(x)]);

/** Kandidaten der Interaktion chiffre: [{ p, code, liste }]. */
function chiffreKandidaten(ia, lo, kanon) {
  const v = ia.verfahren || {};
  if (v.typ === 'frei') {
    return (Array.isArray(lo && lo.fehlmuster) ? lo.fehlmuster : [])
      .filter((f) => f && typeof f.text === 'string')
      .map((f) => ({ p: f.p, code: f.code, liste: alsListe(kanon(f.text)) }));
  }
  const ausgabe = ia.ausgabe === 'zahlen' ? 'zahlen' : 'buchstaben';
  let varianten = [];
  try {
    varianten = K.verfahren.varianten(v, String(ia.eingabe || ''), ia.richtung, { basis: ia.basis ?? 1, ausgabe });
  } catch {
    varianten = [];
  }
  return varianten.map((k) => ({ p: k.p, code: k.code, liste: ausgabe === 'zahlen' ? k.text : alsListe(kanon(k.text)) }));
}

/**
 * Diagnose der Interaktion chiffre (Delta §9.2). antwort: kanonische Form (Zeichenkette bzw. Zahlenliste);
 * kanon(text) bringt Lösungs- und Kandidatentexte in dieselbe Form (Std. krypto-Normalisierung), loesung (optional)
 * ist die kanonische Hauptlösung (Std. kanon(lo.text)).
 */
function chiffre(ia, lo, antwort, { teilweise = false, ersteFalschePosition = null, loesung, kanon = (x) => K.normalisieren(String(x)) } = {}) {
  if (!ia || ia.diagnose === false) return [];
  const a = alsListe(antwort);
  const l = alsListe(loesung !== undefined ? loesung : kanon(lo && typeof lo.text === 'string' ? lo.text : ''));
  const kandidaten = chiffreKandidaten(ia, lo, kanon);
  if (teilweise) {
    if (ersteFalschePosition === null || ersteFalschePosition !== a.length - 1) return [];
    const pos = ersteFalschePosition;
    if (istLeerEintrag(a[pos])) return [];
    return auswaehlen('chiffre', kandidaten.filter((k) => k.liste[pos] === a[pos]));
  }
  // (a) vollständige Treffer gehen vor
  const voll = kandidaten.filter((k) => gleich(a, k.liste));
  if (voll.length) return auswaehlen('chiffre', voll);
  // (b) Teilübereinstimmung und Positionsregel „Umbruchstellen“ (P2, Buchstabenausgabe caesar/vigenere)
  const treffer = kandidaten.filter((k) => passt(a, l, k.liste));
  const v = ia.verfahren || {};
  if (ia.ausgabe !== 'zahlen' && (v.typ === 'caesar' || v.typ === 'vigenere') && a.length === l.length) {
    const falsch = falschePositionen(a, l);
    if (falsch.length && falsch.every((i) => !istLeerEintrag(a[i]))) {
      const u = umbruchStellen(v, ia.eingabe, ia.richtung);
      const nullSet = new Set(u.null);
      const alle = new Set([...u.null, ...u.ueber]);
      if (falsch.every((i) => nullSet.has(i))) treffer.push({ p: 'P2', code: 'null_statt_z' });
      else if (falsch.every((i) => alle.has(i))) treffer.push({ p: 'P2', code: ia.richtung === 'ent' ? 'negativ' : 'ueberlauf' });
    }
  }
  return auswaehlen('chiffre', treffer);
}

module.exports = { PRIORITAET, TEXTE, text, passt, auswaehlen, umbruchStellen, chiffre, falschePositionen };
