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
  'schaubild-ergaenzen:schluesselart': 'Öffentlicher und privater Schlüssel sind vertauscht.',
  'schaubild-ergaenzen:inhaber': 'Der Schlüssel gehört der falschen Person.',
  'schaubild-ergaenzen:schluesselrolle': 'Schlüsselart und Inhaber passen nicht – wer signiert, wer prüft, wer verschlüsselt?',
  'bits-rechnen:verknuepfung': 'Prüfe die Verknüpfung: Bei XOR ergibt 1 ⊕ 1 = 0 und 0 ⊕ 0 = 0.',
  'bits-rechnen:bitreihenfolge': 'Das höchstwertige Bit steht links – prüfe die Bitreihenfolge.',
  'bits-rechnen:ascii': 'Der ASCII-Wert liegt um eins daneben – zähle die Zweierpotenzen noch einmal nach.',
  'bits-rechnen:transposition': 'Nach der S-Box fehlt die Transposition (Zeile ↔ Spalte).',
  'bits-rechnen:richtung': 'Du hast in Entschlüsselungsrichtung gerechnet (S⁻¹ statt S, Rundenschlüssel falsch rotiert oder Runde rückwärts).',
  'zuordnung:richtung': 'Du hast die Tabelle in der falschen Richtung gelesen – gesucht ist zu jedem Geheimtextbuchstaben der Klartextbuchstabe.',
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

/** Zuordnung (Objekt) groß: Schlüssel und Werte je ein Buchstabe, sonst übersprungen. */
function grossePaare(z) {
  const out = {};
  if (!z || typeof z !== 'object') return out;
  for (const [k, v] of Object.entries(z)) {
    if (typeof k !== 'string' || typeof v !== 'string') continue;
    const kk = K.nurBuchstaben(k);
    const vv = K.nurBuchstaben(v);
    if (kk.length === 1 && vv.length === 1) out[kk] = vv;
  }
  return out;
}

/**
 * Diagnose der Interaktion zuordnung (Delta §9.3, präzisiert E11). V = vergebene Paare (g → x) ohne Vorgaben.
 * P3 richtung: D = falsche Paare aus V, deren x selbst ein Geheimbuchstabe der Lösung ist (nur diese sind entscheidbar);
 * |D| ≥ 3 und ≥ 80 % von D erfüllen loesung[x] = g. P1 zaehlbasis: |V| ≥ 3 und für ein d ∈ {+1, −1} liegen ≥ 80 % von V
 * genau d Alphabetstellen neben der Lösung (mod 26).
 */
function zuordnung(ia, lo, a) {
  if (!ia || ia.diagnose === false) return [];
  const loZu = grossePaare(lo && lo.zuordnung);
  const vorgabe = grossePaare(ia.vorgabe);
  const V = Object.entries((a && a.zuordnung) || {}).filter(([g]) => !(g in vorgabe) && g in loZu);
  const treffer = [];
  const D = V.filter(([g, x]) => x !== loZu[g] && x in loZu);
  if (D.length >= 3 && D.filter(([g, x]) => loZu[x] === g).length / D.length >= 0.8 - 1e-9) treffer.push({ p: 'P3', code: 'richtung' });
  if (V.length >= 3) {
    for (const d of [1, -1]) {
      const n = V.filter(([g, x]) => x === K.buchstabe(K.wert(loZu[g], 1) + d, 1)).length;
      if (n / V.length >= 0.8 - 1e-9) {
        treffer.push({ p: 'P1', code: 'zaehlbasis' });
        break;
      }
    }
  }
  return auswaehlen('zuordnung', treffer);
}

/**
 * Diagnose der Interaktion schaubild-ergaenzen (Delta §9.5), je falsch belegtem schluessel-Feld: eine akzeptierte
 * Antwort mit gleichem inhaber → P9 schluesselart; sonst eine mit gleicher art → P9 inhaber; sonst P9 schluesselrolle.
 */
function schaubild(ia, lo, a) {
  if (!ia || ia.diagnose === false) return [];
  const treffer = [];
  for (const [id, feld] of Object.entries(ia.felder || {})) {
    if (!feld || feld.typ !== 'schluessel') continue;
    const w = a ? a[id] : null;
    if (!w || typeof w !== 'object') continue;
    const acc = (Array.isArray(lo && lo[id]) ? lo[id] : []).filter((x) => x && typeof x === 'object');
    if (!acc.length || acc.some((x) => x.art === w.art && x.inhaber === w.inhaber)) continue;
    if (acc.some((x) => x.inhaber === w.inhaber)) treffer.push({ p: 'P9', code: 'schluesselart' });
    else if (acc.some((x) => x.art === w.art)) treffer.push({ p: 'P9', code: 'inhaber' });
    else treffer.push({ p: 'P9', code: 'schluesselrolle' });
  }
  return auswaehlen('schaubild-ergaenzen', treffer);
}

/** Bitfolge je Byte (8er-Gruppen, Rest als letzte Gruppe) umgedreht. */
function jeByteUmgedreht(b) {
  let out = '';
  for (let i = 0; i < b.length; i += 8) out += [...b.slice(i, i + 8)].reverse().join('');
  return out;
}

/** Rundenschlüssel rechts statt links rotiert: K_i = K um 4(i − 1) Bit nach rechts. */
function rundenschluesselRechts(k, runde) {
  const r = ((runde - 1) % 4) * 4;
  return ((k >>> r) | (k << (16 - r))) & 0xffff;
}

/** KRYPTOS-16-Kandidaten (E5, SPEC W3 §0a) als Bitfolgen. */
function kryptos16Kandidaten(ia) {
  const k16 = K.kryptos16;
  const x0 = parseInt(K.normBits(ia.block), 2);
  const key = parseInt(K.normBits(ia.schluessel), 2);
  const R = ia.runden;
  const ent = ia.richtung === 'ent';
  const b16 = (n) => K.byteZuBits(n, 16);
  const rk = (r) => k16.rundenschluessel(key, r);
  const runden = (schritt, ks = rk) => {
    let x = x0;
    if (ent) for (let r = R; r >= 1; r--) x = schritt(x, ks(r));
    else for (let r = 1; r <= R; r++) x = schritt(x, ks(r));
    return x;
  };
  const out = [];
  // ohne Transposition
  out.push({ p: 'P4', code: 'transposition', liste: [...b16(runden((x, k) => (ent ? k16.sbox(x, 'ent') ^ k : k16.sbox(x ^ k))))] });
  // Gegenrichtung (ganze Runde rückwärts)
  out.push({ p: 'P3', code: 'richtung', liste: [...b16((ent ? k16.verschluesseln : k16.entschluesseln)(x0, key, { runden: R }))] });
  // S⁻¹ statt S (bzw. S statt S⁻¹)
  out.push({ p: 'P3', code: 'richtung', liste: [...b16(runden((x, k) => (ent ? k16.sbox(k16.transponiere(x), 'ver') ^ k : k16.transponiere(k16.sbox(x ^ k, 'ent')))))] });
  // Rundenschlüssel in Gegenrichtung rotiert (erst ab 2 Runden unterscheidbar)
  if (R >= 2) out.push({ p: 'P3', code: 'richtung', liste: [...b16(runden((x, k) => k16.runde(x, k, ent ? 'ent' : 'ver'), (r) => rundenschluesselRechts(key, r)))] });
  return out;
}

/** Kandidaten der Interaktion bits-rechnen: [{ p, code, liste }]. */
function bitsKandidaten(ia, lo, kanon, soll) {
  const out = [];
  const textZuBitsVersetzt = (t, d) => {
    const codes = [...t].map((c) => c.charCodeAt(0) + d);
    if (!codes.every((n) => n >= 32 && n <= 126)) return null;
    return codes.map((n) => K.byteZuBits(n, 8)).join('');
  };
  switch (ia.operation) {
    case 'xor': {
      const ops = ia.operanden.map((o) => K.normBits(o));
      out.push({ p: 'P4', code: 'verknuepfung', liste: [...ops.slice(1).reduce((a, b) => K.undBits(a, b), ops[0])] });
      out.push({ p: 'P4', code: 'verknuepfung', liste: [...ops.slice(1).reduce((a, b) => K.oderBits(a, b), ops[0])] });
      if (typeof soll === 'string') out.push({ p: 'P4', code: 'bitreihenfolge', liste: [...jeByteUmgedreht(soll)] });
      break;
    }
    case 'ascii':
      if (ia.richtung === 'zu-text') {
        for (const d of [1, -1]) {
          const codes = [...String(soll || '')].map((c) => c.charCodeAt(0) + d);
          if (codes.length && codes.every((n) => n >= 32 && n <= 126)) out.push({ p: 'P1', code: 'ascii', liste: codes.map((n) => String.fromCharCode(n)) });
        }
      } else {
        for (const d of [1, -1]) {
          const b = textZuBitsVersetzt(ia.text, d);
          if (b) out.push({ p: 'P1', code: 'ascii', liste: [...b] });
        }
        if (typeof soll === 'string') out.push({ p: 'P4', code: 'bitreihenfolge', liste: [...jeByteUmgedreht(soll)] });
      }
      break;
    case 'kryptos16':
      out.push(...kryptos16Kandidaten(ia));
      break;
    case 'frei':
      for (const f of Array.isArray(lo && lo.fehlmuster) ? lo.fehlmuster : []) {
        if (!f || typeof f.text !== 'string') continue;
        let k;
        try {
          k = kanon(typeof lo.bits === 'string' ? { bits: f.text } : { text: f.text });
        } catch {
          continue;
        }
        out.push({ p: f.p, code: f.code, liste: [...k] });
      }
      break;
    default:
  }
  return out;
}

/**
 * Diagnose der Interaktion bits-rechnen (Delta §9.4), zweistufig wie chiffre: vollständige Treffer gehen vor, sonst
 * Teilübereinstimmung (passt). lawine: keine Diagnose. opt.loesung = kanonische Lösung, opt.kanon = Antwort-Normalisierung.
 */
function bits(ia, lo, a, { loesung, kanon = (x) => x } = {}) {
  if (!ia || ia.diagnose === false || ia.operation === 'lawine' || Array.isArray(a)) return [];
  let kandidaten;
  try {
    kandidaten = bitsKandidaten(ia, lo, kanon, loesung);
  } catch (e) {
    if (e && e.name === 'KryptoFehler') return [];
    throw e;
  }
  const al = [...String(a)];
  const voll = kandidaten.filter((k) => gleich(al, k.liste));
  if (voll.length) return auswaehlen('bits-rechnen', voll);
  const l = [...String(loesung === null || loesung === undefined ? '' : loesung)];
  return auswaehlen('bits-rechnen', kandidaten.filter((k) => passt(al, l, k.liste)));
}

/**
 * Zusatzdiagnose für gaps (Delta §9.6): erwartete Fehlantworten je Feld aus loesung._fehlmuster. Ein Feld, das falsch
 * beantwortet ist und einem Fehlmuster gleicht (gleiche Normalisierung wie die Prüfung), liefert dessen Falle.
 */
function gapsFehlmuster(ia, lo, a, ergebnis) {
  const C = require('../content/checker');
  const fm = lo && lo._fehlmuster;
  if (!fm || typeof fm !== 'object' || !ergebnis || !ergebnis.felder) return [];
  const treffer = [];
  for (const [id, feld] of Object.entries((ia && ia.felder) || {})) {
    if (ergebnis.felder[id] !== false || !Array.isArray(fm[id])) continue;
    const eingabe = a && a[id] !== undefined ? a[id] : '';
    for (const m of fm[id]) {
      if (m && (typeof m.wert === 'string' || typeof m.wert === 'number') && C.feldRichtig(feld, eingabe, [m.wert])) treffer.push({ p: m.p, code: m.code });
    }
  }
  return auswaehlen('gaps', treffer);
}

module.exports = { PRIORITAET, TEXTE, text, passt, auswaehlen, umbruchStellen, chiffre, falschePositionen, gapsFehlmuster, zuordnung, schaubild, bits };
