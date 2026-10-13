/* Kryptos – Funkraum-Szenario „Schlüsseltausch vor Eves Augen“ (W4 §9.3, Plan M7 Task 140). Nur Regeln dieses Typs; Zustandsautomat,
   Sichtbarkeits-Grundregeln, Versionen, Grenzen und Löschung macht der Dienst (dienst.js). Gerüst aus Task 134 –
   Inhalte folgen in Task 140. Vertrag: Plan M7 „Szenario-Typ-Vertrag“. */
'use strict';
const L = require('../loeschen');

module.exports = {
  typ: 'schluesseltausch',
  /** beim Start (vorbereitung → laeuft): konfig- und Rollen-Zustände anlegen (Zufall nur über ctx.zufallBytes) */
  start() {
    return {};
  },
  /** Aktionen: name → (ctx, sz, betrachter, body) → Antwort (Task 140) */
  aktionen: {},
  /** anonyme Auswertung (nur Zahlen, ids, Codes) – generisch bis Task 140 */
  auswertung(ctx, sz) {
    return L.auswertungGenerisch(ctx.db, sz.id);
  }
};
