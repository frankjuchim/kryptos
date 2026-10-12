'use strict';
// Interaktion zuordnung (AUFGABENFORMAT_KRYPTO §8.2): Substitutions-Werkbank. Die Antwort ordnet Geheimbuchstaben
// Klarbuchstaben zu; Vorgaben erzwingt der Server. Feedback: Anteil richtiger Textstellen, bei feedback: buchstaben
// zusätzlich richtig/falsch je vergebenem Geheimbuchstaben. Fallen-Diagnose nach §9.3, Validator mit Neuberechnung.
// Kanonische Antwort: { zuordnung: { G: 'K', … } } – Großbuchstaben, nur belegte Werte, Schlüssel sortiert.

const K = require('../../../public/static/js/shared/krypto');
const C = require('../../content/checker');
const D = require('../diagnose');

const { AntwortFehler } = C;
const PRUEFEN = ['klartext', 'zuordnung'];
const FEEDBACK = ['anteil', 'buchstaben'];
const MAX_SCHLUESSEL = 200;

const istObjekt = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
const geheim = (ia) => K.nurBuchstaben(typeof ia.geheimtext === 'string' ? ia.geheimtext : '');

/** Ein Buchstabe nach nurBuchstaben oder null (leer); mehr als ein Buchstabe → null mit Fehlerkennung. */
function einBuchstabe(x) {
  if (typeof x !== 'string') return { ok: false };
  const n = K.nurBuchstaben(x);
  if (n.length > 1) return { ok: false };
  return { ok: true, b: n };
}

/** Zuordnung (Objekt) groß und bereinigt; unbrauchbare Einträge werden übersprungen (für Lösung/Vorgabe). */
function grossZuordnung(z) {
  const out = {};
  if (!istObjekt(z)) return out;
  for (const [k, v] of Object.entries(z)) {
    const kk = einBuchstabe(k);
    const vv = einBuchstabe(v);
    if (kk.ok && kk.b && vv.ok && vv.b) out[kk.b] = vv.b;
  }
  return out;
}

const sortiert = (o) => Object.fromEntries(Object.keys(o).sort().map((k) => [k, o[k]]));

function bereinige(ia, antwort) {
  let a = antwort;
  if (a === undefined || a === null) a = {};
  if (!istObjekt(a)) throw new AntwortFehler('Antwort muss eine Zuordnung sein.');
  if ('zuordnung' in a) {
    a = a.zuordnung;
    if (a === undefined || a === null) a = {};
    if (!istObjekt(a)) throw new AntwortFehler('Antwort muss eine Zuordnung sein.');
  }
  const eintraege = Object.entries(a);
  if (eintraege.length > MAX_SCHLUESSEL) throw new AntwortFehler('Antwort ist zu lang.');
  const vorkommend = new Set(geheim(ia));
  const out = {};
  for (const [k, v] of eintraege) {
    const kk = einBuchstabe(k);
    if (!kk.ok || !kk.b) throw new AntwortFehler('Je Eintrag genau ein Geheimbuchstabe.');
    if (!vorkommend.has(kk.b)) throw new AntwortFehler(`Der Buchstabe ${kk.b} kommt im Geheimtext nicht vor.`);
    if (v === undefined || v === null || v === '') continue;
    const vv = einBuchstabe(v);
    if (!vv.ok) throw new AntwortFehler('Je Geheimbuchstabe höchstens ein Klarbuchstabe.');
    if (vv.b) out[kk.b] = vv.b;
  }
  // Vorgaben erzwingen (überschreiben die Antwort)
  Object.assign(out, grossZuordnung(ia.vorgabe));
  return { zuordnung: sortiert(out) };
}

function istLeer(ia, a) {
  const vorgabe = grossZuordnung(ia.vorgabe);
  return Object.keys((a && a.zuordnung) || {}).every((k) => k in vorgabe);
}

/** Klartext aus Geheimtext und Zuordnung; nicht vergebene Buchstaben → '?'. */
function klartextVon(g, z) {
  return [...g].map((c) => z[c] || '?').join('');
}

function pruefe(ia, lo, a, teilweise, opt = {}) {
  const g = geheim(ia);
  const z = (a && a.zuordnung) || {};
  const loZu = grossZuordnung(lo && lo.zuordnung);
  const soll = lo && typeof lo.klartext === 'string' ? K.nurBuchstaben(lo.klartext) : klartextVon(g, loZu);
  const ist = klartextVon(g, z);
  let richtig = 0;
  for (let i = 0; i < g.length; i++) if (ist[i] === soll[i]) richtig++;
  const anteil = g.length ? richtig / g.length : 0;
  const ok = (ia.pruefen || 'klartext') === 'zuordnung' ? Object.keys(loZu).every((k) => z[k] === loZu[k]) : ist === soll;
  const r = { ok, anteil };
  if (ia.feedback === 'buchstaben') {
    const vorgabe = grossZuordnung(ia.vorgabe);
    r.buchstaben = {};
    for (const k of Object.keys(z)) if (!(k in vorgabe)) r.buchstaben[k] = z[k] === loZu[k];
  }
  if (!ok && opt.diagnose && !istLeer(ia, a)) {
    const d = D.zuordnung(ia, lo, a);
    if (d.length) r.diagnose = d;
  }
  return r;
}

const muster = (ia, lo) => ({ zuordnung: istObjekt(lo) && istObjekt(lo.zuordnung) ? lo.zuordnung : {} });

function validiere(ia, lo, aufgabe, ort, fa, wa) {
  const lort = ort.replace('interaktion', 'loesung');
  const g = geheim(ia);
  if (typeof ia.geheimtext !== 'string' || g.length < 20 || g.length > 2000) fa(ort, 'geheimtext braucht 20–2000 Buchstaben.');
  const vorkommend = [...new Set(g)].sort();
  if (ia.pruefen !== undefined && !PRUEFEN.includes(ia.pruefen)) fa(ort, `pruefen muss ${PRUEFEN.join(' oder ')} sein.`);
  if (ia.feedback !== undefined && !FEEDBACK.includes(ia.feedback)) fa(ort, `feedback muss ${FEEDBACK.join(' oder ')} sein.`);
  if (ia.haeufigkeit !== undefined && typeof ia.haeufigkeit !== 'boolean') fa(ort, 'haeufigkeit muss true oder false sein.');
  if (ia.vorgabe !== undefined) {
    if (!istObjekt(ia.vorgabe)) fa(ort, 'vorgabe muss ein Objekt { "T": "e" } sein.');
    else
      for (const [k, v] of Object.entries(ia.vorgabe)) {
        const kk = einBuchstabe(k);
        const vv = einBuchstabe(v);
        if (!kk.ok || !kk.b || !vv.ok || !vv.b) fa(ort, `vorgabe „${k}“: Schlüssel und Wert je genau ein Buchstabe.`);
        else if (!vorkommend.includes(kk.b)) fa(ort, `vorgabe: Der Buchstabe ${kk.b} kommt im Geheimtext nicht vor.`);
      }
  }
  if (aufgabe && aufgabe.kategorie === 'haeufigkeitsanalyse' && g.length < 60) {
    wa(ort, `Häufigkeitsanalyse mit nur ${g.length} Buchstaben (< 60) ist unzuverlässig (P6).`);
  }

  // Lösung
  if (!istObjekt(lo.zuordnung)) return fa(lort, 'zuordnung (Objekt Geheim- → Klarbuchstabe) fehlt.');
  let formOk = true;
  for (const [k, v] of Object.entries(lo.zuordnung)) {
    const kk = einBuchstabe(k);
    const vv = einBuchstabe(v);
    if (!kk.ok || !kk.b || !vv.ok || !vv.b) {
      fa(lort, `zuordnung „${k}“: Schlüssel und Wert je genau ein Buchstabe.`);
      formOk = false;
    } else if (g.length && !vorkommend.includes(kk.b)) wa(lort, `zuordnung: ${kk.b} kommt im Geheimtext nicht vor.`);
  }
  if (!formOk) return;
  const loZu = grossZuordnung(lo.zuordnung);
  const gesehen = new Set();
  const doppelt = new Set();
  for (const v of Object.values(loZu)) (gesehen.has(v) ? doppelt : gesehen).add(v);
  if (doppelt.size) fa(lort, `loesung.zuordnung ist nicht injektiv (${[...doppelt].sort().join(', ')} doppelt).`);
  const fehlt = vorkommend.filter((c) => !(c in loZu));
  if (fehlt.length) fa(lort, `loesung.zuordnung deckt nicht alle Geheimtextbuchstaben ab (fehlt: ${fehlt.join(', ')}).`);
  if (istObjekt(ia.vorgabe)) {
    for (const [k, v] of Object.entries(grossZuordnung(ia.vorgabe))) {
      if (loZu[k] !== v) fa(ort, `vorgabe passt nicht zur Lösung (${k} → ${v}).`);
    }
  }
  if (typeof lo.klartext !== 'string' || !K.nurBuchstaben(lo.klartext)) return fa(lort, 'klartext (Lösung) fehlt.');
  const soll = K.nurBuchstaben(lo.klartext);
  const ist = klartextVon(g, loZu);
  if (g.length && ist !== soll) fa(lort, `Neuberechnung ergibt ${ist} statt ${soll}.`);
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
  F.registriereInteraktion('zuordnung', vertrag);
}

module.exports = { vertrag, registriere, grossZuordnung };
