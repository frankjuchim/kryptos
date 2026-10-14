'use strict';
// Interaktion hash-ziel (AUFGABENFORMAT_KRYPTO §8.5, Plan M8 E126): eine Nachricht mit vorgegebenem KRYPTOS-Hash
// (SPEC W5 §0a) eingeben – Kollision (ungleich: die Ausgangsnachricht) oder Urbild (praefix). Richtig ⇔
// KH(Eingabe) = ziel, Eingabe nicht in ungleich, beginnt mit praefix, mindestens ein Buchstabe. Feedback `wert`
// (KH der Eingabe – verrät keine Lösung, im Boss gibt der Dienst kein Feedback weiter). Validator: Musterantwort
// loesung.beispiel erfüllt alle Bedingungen (Neuberechnung über die Bibliothek).
// Kanonische Antwort: nurBuchstaben der Eingabe (A–Z, Umlaute aufgelöst), höchstens 60 Zeichen.

const K = require('../../../public/static/js/shared/krypto');
const C = require('../../content/checker');

const { AntwortFehler } = C;
const MAX_ZEICHEN = 60;
const MAX_ROH = 200;
const KLEIN = /^[a-z]{1,60}$/;

const istObjekt = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
const kh = (t) => K.kryptosHash(t).wert;
const gross = (t) => K.nurBuchstaben(String(t));

function bereinige(ia, antwort) {
  let a = istObjekt(antwort) ? antwort.text : antwort;
  if (a === undefined || a === null) a = '';
  if (typeof a !== 'string') throw new AntwortFehler('Antwort muss Text sein.');
  if (a.length > MAX_ROH) throw new AntwortFehler('Antwort ist zu lang.');
  const t = K.nurBuchstaben(a);
  if (t.length > MAX_ZEICHEN) throw new AntwortFehler('Antwort ist zu lang.');
  return t;
}

const istLeer = (ia, a) => a === '';

/** Bedingungen der Interaktion für einen kanonischen Text: { ok, wert, verboten, ohnePraefix } */
function bewerte(ia, t) {
  const ungleich = Array.isArray(ia.ungleich) ? ia.ungleich.map(gross) : [];
  const praefix = typeof ia.praefix === 'string' ? gross(ia.praefix) : '';
  const wert = t ? kh(t) : null;
  const verboten = ungleich.includes(t);
  const ohnePraefix = !t.startsWith(praefix);
  return { ok: t.length > 0 && wert === ia.ziel && !verboten && !ohnePraefix, wert, verboten, ohnePraefix };
}

const HINWEISE = Object.freeze({
  ausgangsnachricht: 'Das ist die Ausgangsnachricht – gesucht ist eine andere Nachricht mit demselben Hash.',
  praefix: 'Die Nachricht beginnt nicht mit dem vorgegebenen Anfang.'
});

function pruefe(ia, lo, a, teilweise, opt = {}) {
  const b = bewerte(ia, a);
  const r = { ok: b.ok };
  if (b.wert !== null) r.wert = b.wert;
  if (!b.ok && opt.diagnose && a !== '') {
    // Hinweise ohne Fallen-Nummer (Plan M8 E126): keine P-Nummer, keine Zählung in fallen_zaehler
    const d = [];
    if (b.verboten) d.push({ p: null, code: 'ausgangsnachricht', text: HINWEISE.ausgangsnachricht });
    if (b.ohnePraefix) d.push({ p: null, code: 'praefix', text: HINWEISE.praefix });
    if (d.length) r.diagnose = d;
  }
  return r;
}

const muster = (ia, lo) => (istObjekt(lo) && typeof lo.beispiel === 'string' ? lo.beispiel : '');

function validiere(ia, lo, aufgabe, ort, fa) {
  const lort = ort.replace('interaktion', 'loesung');
  let ok = true;
  const f = (o, m) => {
    ok = false;
    fa(o, m);
  };
  if (ia.verfahren !== 'kryptosHash') f(ort, 'verfahren muss kryptosHash sein.');
  if (!Number.isInteger(ia.ziel) || ia.ziel < 0 || ia.ziel > 28) f(ort, 'ziel muss eine ganze Zahl 0–28 sein.');
  if (ia.ungleich !== undefined && (!Array.isArray(ia.ungleich) || !ia.ungleich.length || !ia.ungleich.every((x) => typeof x === 'string' && KLEIN.test(x)))) {
    f(ort, 'ungleich muss eine Liste von Wörtern aus a–z sein.');
  }
  if (ia.praefix !== undefined && (typeof ia.praefix !== 'string' || !/^[a-z]{1,20}$/.test(ia.praefix))) f(ort, 'praefix muss aus 1–20 Buchstaben a–z bestehen.');
  if (ia.ungleich === undefined && ia.praefix === undefined) f(ort, 'Es braucht ungleich (Kollision) oder praefix (Urbild).');
  for (const k of Object.keys(ia)) if (!['kind', 'verfahren', 'ziel', 'ungleich', 'praefix', 'diagnose'].includes(k)) f(ort, `Unbekanntes Feld ${k}.`);
  if (!istObjekt(lo) || typeof lo.beispiel !== 'string' || !KLEIN.test(lo.beispiel)) return fa(lort, 'beispiel (Musterantwort aus a–z) fehlt.');
  if (!ok) return;
  // Neuberechnung: die Musterantwort erfüllt alle Bedingungen
  const b = bewerte(ia, gross(lo.beispiel));
  if (b.wert !== ia.ziel) fa(lort, `Neuberechnung ergibt KH(${lo.beispiel}) = ${b.wert} statt ${ia.ziel}.`);
  if (b.verboten) fa(lort, 'beispiel darf nicht in ungleich stehen.');
  if (b.ohnePraefix) fa(lort, 'beispiel beginnt nicht mit praefix.');
}

const vertrag = Object.freeze({
  bereinige,
  istLeer,
  pruefe,
  muster,
  validiere,
  schritt: false,
  boss: Object.freeze({ erlaubt: true })
});

function registriere(F) {
  F.registriereInteraktion('hash-ziel', vertrag);
}

module.exports = { vertrag, registriere, HINWEISE };
