'use strict';
// Interaktion chiffre (AUFGABENFORMAT_KRYPTO §8.1): zeichenweise ver-/entschlüsseln mit Feedback je Zeichen,
// Schrittprüfung (Präfix), Fallen-Diagnose (§9.2) und Validator mit Neuberechnung über die Bibliothek.
// Kanonische Antwort: Buchstaben/hex/paare → Zeichenkette (leeres Kästchen = '_'), zahlen → Liste aus Ganzzahl/null.
// Die kanonische Form ist ein Fixpunkt von bereinige (Review M3 K1: der Boss bereinigt gespeicherte Antworten erneut).

const K = require('../../../public/static/js/shared/krypto');
const C = require('../../content/checker');
const D = require('../diagnose');
const { FALLEN_IDS } = require('../../domain');

const { AntwortFehler } = C;
const MAX_TEXT = 2000;
const MAX_LISTE = 800;
const RICHTUNGEN = ['ver', 'ent'];
const AUSGABEN = ['buchstaben', 'zahlen', 'hex', 'paare'];
const HILFSZEILEN = ['zahlen', 'schluessel', 'positionen'];
const MIT_SCHLUESSELZEILE = ['vigenere', 'autokey', 'porta'];
const PAARE = ['polybios', 'adfgvx'];

const istObjekt = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
/** Platzhalter für ein leeres Kästchen in der kanonischen Form (übersteht die krypto-Normalisierung). */
const LUECKE = '_';
const zahlenAusgabe = (ia) => ia.ausgabe === 'zahlen';

/** Ein Text (ganze Antwort) normalisieren; der Lücken-Platzhalter _ bleibt stehen (Idempotenz). */
function normText(ia, s) {
  return s.split(LUECKE).map((t) => normTeil(ia, t)).join(LUECKE);
}

/** Textstück ohne Lücken: hex → nur 0–9A–F, sonst krypto-Normalisierung. */
function normTeil(ia, s) {
  if (ia.ausgabe === 'hex') {
    const h = s.toUpperCase().replace(/\s+/g, '');
    if (!/^[0-9A-F]*$/.test(h)) throw new AntwortFehler('Hex-Antwort: nur 0–9 und A–F.');
    return h;
  }
  return K.normalisieren(s);
}

function ganzzahlOderNull(x) {
  if (x === null || x === undefined || x === '') return null;
  if (typeof x === 'number' && Number.isInteger(x)) return x;
  if (typeof x === 'string') {
    const t = x.trim();
    if (t === '') return null;
    if (/^[+-]?\d+$/.test(t)) return Number(t);
  }
  throw new AntwortFehler('Antwort muss ganze Zahlen enthalten.');
}

/** Antwort (oder Lösungstext) in die kanonische Form bringen; unbrauchbare Form → AntwortFehler (400). */
function kanonisch(ia, antwort) {
  let a = antwort;
  if (istObjekt(a)) {
    if (Object.hasOwn(a, 'text')) a = a.text;
    else if (Object.hasOwn(a, 'zeichen')) a = a.zeichen;
    else throw new AntwortFehler('Antwort muss Text oder eine Liste sein.');
  }
  if (a === undefined || a === null) return zahlenAusgabe(ia) ? [] : '';
  if (typeof a === 'number') a = String(a);
  if (typeof a === 'string') {
    if (a.length > MAX_TEXT) throw new AntwortFehler('Antwort ist zu lang.');
    if (zahlenAusgabe(ia)) {
      const teile = a.split(/[\s,;]+/).filter((x) => x !== '');
      if (teile.length > MAX_LISTE) throw new AntwortFehler('Antwort ist zu lang.');
      return teile.map(ganzzahlOderNull);
    }
    return normText(ia, a);
  }
  if (!Array.isArray(a)) throw new AntwortFehler('Antwort muss Text oder eine Liste sein.');
  if (a.length > MAX_LISTE) throw new AntwortFehler('Antwort ist zu lang.');
  if (zahlenAusgabe(ia)) return a.map(ganzzahlOderNull);
  return a
    .map((x) => {
      if (x === null || x === undefined) return LUECKE;
      if (typeof x === 'number') x = String(x);
      if (typeof x !== 'string' || x.length > 20) throw new AntwortFehler('Je Kästchen ein Zeichen.');
      const n = normText(ia, x);
      if (n.length > 1) throw new AntwortFehler('Je Kästchen ein Zeichen.');
      return n.length ? n : LUECKE;
    })
    .join('');
}

const bereinige = (ia, antwort) => kanonisch(ia, antwort);

function istLeer(ia, a) {
  if (Array.isArray(a)) return a.every((x) => x === null);
  return String(a).split(LUECKE).join('').trim() === '';
}

/** Lösungen in kanonischer Form: text und alternativen. */
function loesungen(ia, lo) {
  const l = istObjekt(lo) ? lo : {};
  const alle = [l.text, ...(Array.isArray(l.alternativen) ? l.alternativen : [])].filter((x) => typeof x === 'string');
  return alle.map((x) => kanonisch(ia, x));
}

const alsListe = (x) => (Array.isArray(x) ? x : [...x]);
const gleich = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

function pruefe(ia, lo, a, teilweise, opt = {}) {
  const ls = loesungen(ia, lo);
  const haupt = ls[0] !== undefined ? ls[0] : zahlenAusgabe(ia) ? [] : '';
  const mitDiagnose = (r, extra) => {
    if (!r.ok && opt.diagnose && !istLeer(ia, a)) {
      const d = D.chiffre(ia, lo, a, { ...extra, loesung: haupt, kanon: (t) => kanonisch(ia, t) });
      if (d.length) r.diagnose = d;
    }
    return r;
  };
  if (teilweise) {
    const r = C.folgenPruefung(alsListe(a), ls.map(alsListe), (x, y) => x === y, true);
    return mitDiagnose({ ok: r.ok, vollstaendig: r.vollstaendig, ersteFalschePosition: r.ersteFalschePosition }, { teilweise: true, ersteFalschePosition: r.ersteFalschePosition });
  }
  const al = alsListe(a);
  const ok = ls.some((l) => gleich(al, alsListe(l)));
  const hl = alsListe(haupt);
  const n = Math.max(al.length, hl.length);
  const zeichen = [];
  for (let i = 0; i < n; i++) zeichen.push(i < al.length && i < hl.length && al[i] === hl[i] && al[i] !== LUECKE && al[i] !== null);
  return mitDiagnose({ ok, zeichen }, {});
}

const muster = (ia, lo) => (istObjekt(lo) ? lo.text : '');

/** Anzeige einer kanonischen Form (Zahlen mit Leerzeichen). */
const anzeige = (x) => (Array.isArray(x) ? x.join(' ') : String(x));

/** Ist eine Alternative durch eine bekannte Variante erklärbar (I/J vertauscht, Füllzeichen X am Ende)? */
function bekannteVariante(text, alt) {
  if (Array.isArray(text) || Array.isArray(alt)) return false;
  const ij = (s) => s.replace(/J/g, 'I');
  return ij(text) === ij(alt) || alt === text + 'X' || text === alt + 'X';
}

function validiere(ia, lo, aufgabe, ort, fa, wa) {
  const lort = ort.replace('interaktion', 'loesung');
  if (!RICHTUNGEN.includes(ia.richtung)) fa(ort, 'richtung muss ver oder ent sein.');
  const v = ia.verfahren;
  let verfahrenOk = false;
  if (!istObjekt(v)) fa(ort, 'verfahren (Objekt mit typ) fehlt.');
  else {
    const p = K.verfahren.pruefe(v);
    if (!p.ok) for (const m of p.fehler) fa(ort, `verfahren: ${m}`);
    verfahrenOk = p.ok;
  }
  const typ = istObjekt(v) ? v.typ : undefined;
  let eingabeOk = false;
  if (typeof ia.eingabe !== 'string') fa(ort, 'eingabe (Text) fehlt.');
  else {
    const n = K.normalisieren(ia.eingabe).length;
    if (n < 1 || n > 400) fa(ort, `eingabe muss nach der Normalisierung 1–400 Zeichen haben (hat ${n}).`);
    else eingabeOk = true;
  }
  if (ia.basis !== undefined && ia.basis !== 0 && ia.basis !== 1) fa(ort, 'basis muss 0 oder 1 sein.');
  const ausgabe = ia.ausgabe === undefined ? 'buchstaben' : ia.ausgabe;
  if (!AUSGABEN.includes(ausgabe)) fa(ort, `ausgabe muss ${AUSGABEN.join(' | ')} sein.`);
  else if (ausgabe === 'hex' && typ !== 'xor') fa(ort, 'ausgabe hex gibt es nur bei xor.');
  else if (ausgabe === 'paare' && !PAARE.includes(typ)) fa(ort, 'ausgabe paare gibt es nur bei polybios und adfgvx.');
  else if (ausgabe === 'zahlen' && (typ === 'xor' || PAARE.includes(typ))) fa(ort, 'ausgabe zahlen gibt es nicht bei xor, polybios und adfgvx.');
  if (ia.darstellung !== undefined && !['zeichenweise', 'zeile'].includes(ia.darstellung)) fa(ort, 'darstellung muss zeichenweise oder zeile sein.');
  if (ia.hilfszeilen !== undefined) {
    if (!Array.isArray(ia.hilfszeilen) || !ia.hilfszeilen.every((h) => HILFSZEILEN.includes(h))) fa(ort, `hilfszeilen muss eine Liste aus ${HILFSZEILEN.join(', ')} sein.`);
    else if (ia.hilfszeilen.includes('schluessel') && !MIT_SCHLUESSELZEILE.includes(typ)) fa(ort, `hilfszeilen: schluessel gibt es nur bei ${MIT_SCHLUESSELZEILE.join(', ')}.`);
  }
  for (const k of ['schritt', 'diagnose']) if (ia[k] !== undefined && typeof ia[k] !== 'boolean') fa(ort, `${k} muss true oder false sein.`);
  if (ia.gruppe !== undefined && ia.gruppe !== 0 && ia.gruppe !== 5) fa(ort, 'gruppe muss 0 oder 5 sein.');

  // Lösung
  if (typeof lo.text !== 'string' || lo.text.trim() === '') return fa(lort, 'text (Lösung) fehlt.');
  const kanon = (x) => {
    try {
      return kanonisch(ia, x);
    } catch (e) {
      fa(lort, `Lösung „${x}“ ist keine gültige Antwort: ${e.message}`);
      return null;
    }
  };
  const text = kanon(lo.text);
  if (text === null) return;
  if (!(Array.isArray(text) ? text.length : text.length)) fa(lort, 'text (Lösung) ist nach der Normalisierung leer.');
  if (lo.alternativen !== undefined) {
    if (!Array.isArray(lo.alternativen) || !lo.alternativen.every((x) => typeof x === 'string')) fa(lort, 'alternativen muss eine Liste von Texten sein.');
    else
      for (const roh of lo.alternativen) {
        const alt = kanon(roh);
        if (alt === null) continue;
        if (anzeige(alt) === anzeige(text)) fa(lort, `alternative „${roh}“ gleicht text.`);
        else if (!bekannteVariante(text, alt)) wa(lort, `alternative „${roh}“ ist durch keine bekannte Variante erklärbar (I/J vertauscht, Füllzeichen X am Ende angehängt/weggelassen).`);
      }
  }
  if (typ === 'frei') {
    if (typeof aufgabe.pruefnachweis !== 'string' || !aufgabe.pruefnachweis.trim()) fa('pruefnachweis', 'pruefnachweis fehlt (fremde Chiffre).');
    if (lo.fehlmuster !== undefined) {
      if (!Array.isArray(lo.fehlmuster) || lo.fehlmuster.length > 5) fa(lort, 'fehlmuster muss eine Liste mit höchstens 5 Einträgen sein.');
      else
        lo.fehlmuster.forEach((f, i) => {
          const o = `${lort}.fehlmuster[${i}]`;
          if (!istObjekt(f) || typeof f.text !== 'string') return fa(o, 'Eintrag braucht text, p und code.');
          const k = kanon(f.text);
          if (k !== null && anzeige(k) === anzeige(text)) fa(o, 'text eines Fehlmusters darf nicht die Lösung sein.');
          if (!FALLEN_IDS.includes(f.p)) fa(o, 'p muss P1–P10 sein.');
          if (typeof f.code !== 'string' || !/^[a-z_]{1,30}$/.test(f.code)) fa(o, 'code muss aus a–z und _ bestehen (höchstens 30 Zeichen).');
        });
    }
    return;
  }
  if (lo.fehlmuster !== undefined) fa(lort, 'fehlmuster nur bei fremden Chiffren (verfahren.typ frei).');
  // Neuberechnung
  if (!verfahrenOk || !eingabeOk || !RICHTUNGEN.includes(ia.richtung)) return;
  let erwartet;
  try {
    erwartet = K.verfahren.anwenden(v, ia.eingabe, ia.richtung, { basis: ia.basis ?? 1, ausgabe: zahlenAusgabe(ia) ? 'zahlen' : 'buchstaben' });
  } catch (e) {
    if (e && e.name === 'KryptoFehler') return fa(ort, `Verfahren nicht anwendbar: ${e.message}`);
    throw e;
  }
  const soll = Array.isArray(erwartet) ? erwartet : kanon(erwartet);
  if (soll !== null && anzeige(soll) !== anzeige(text)) fa(lort, `Neuberechnung ergibt ${anzeige(soll)} statt ${anzeige(text)}.`);
}

const vertrag = Object.freeze({
  bereinige,
  istLeer,
  pruefe,
  muster,
  validiere,
  schritt: (ia) => ia.schritt !== false,
  boss: Object.freeze({ erlaubt: true })
});

function registriere(F) {
  F.registriereInteraktion('chiffre', vertrag);
}

module.exports = { vertrag, registriere, kanonisch };
