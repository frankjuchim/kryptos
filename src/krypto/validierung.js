'use strict';
// Krypto-Zusatzprüfungen für den Validator (Hooks nach TECHNIK §4.2, registriert in src/krypto/index.js).
// Task 26: loesung._fehlmuster in gaps-Teilen (Delta §9.6); Tasks 30/31 ergänzen Welt-, Level-, Aufgaben- und Boss-Regeln.

const C = require('../content/checker');
const F = require('../content/format');
const { FALLEN_IDS } = require('../domain');

const istObjekt = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
const CODE = /^[a-z_]{1,30}$/;

/** _fehlmuster eines gaps-Teils: { feld: [{ wert, p, code }, …] } (1–5 je Feld), nie gleich einer akzeptierten Lösung. */
function pruefeFehlmuster(ia, lo, lort, fa) {
  const fm = lo._fehlmuster;
  const o = `${lort}._fehlmuster`;
  if (!istObjekt(fm)) return fa(o, '_fehlmuster muss ein Objekt { feld: [ … ] } sein.');
  const felder = istObjekt(ia.felder) ? ia.felder : {};
  for (const [id, liste] of Object.entries(fm)) {
    if (!(id in felder)) {
      fa(o, `_fehlmuster: Feld „${id}“ gibt es nicht in felder.`);
      continue;
    }
    if (!Array.isArray(liste) || liste.length < 1 || liste.length > 5) {
      fa(`${o}.${id}`, '_fehlmuster: je Feld eine Liste mit 1–5 Einträgen.');
      continue;
    }
    liste.forEach((m, i) => {
      const oi = `${o}.${id}[${i}]`;
      if (!istObjekt(m) || !(typeof m.wert === 'string' || typeof m.wert === 'number') || String(m.wert).trim() === '') {
        return fa(oi, '_fehlmuster: Eintrag braucht wert (Text oder Zahl), p und code.');
      }
      if (!FALLEN_IDS.includes(m.p)) fa(oi, '_fehlmuster: p muss P1–P10 sein.');
      if (typeof m.code !== 'string' || !CODE.test(m.code)) fa(oi, '_fehlmuster: code muss aus a–z und _ bestehen (höchstens 30 Zeichen).');
      if (lo[id] !== undefined && C.feldRichtig(felder[id], m.wert, Array.isArray(lo[id]) ? lo[id] : [lo[id]])) {
        fa(oi, `_fehlmuster gleicht einer akzeptierten Lösung („${m.wert}“).`);
      }
    });
  }
}

/** Hook aufgabe: je gaps-Teil mit _fehlmuster. */
function aufgabe(a, fa) {
  F.teile(a).forEach((t, i, alle) => {
    const ia = t.interaktion;
    const lo = t.loesung;
    if (!istObjekt(ia) || ia.kind !== 'gaps' || !istObjekt(lo) || lo._fehlmuster === undefined) return;
    pruefeFehlmuster(ia, lo, alle.length > 1 ? `loesung[${i}]` : 'loesung', fa);
  });
}

module.exports = { aufgabe };
