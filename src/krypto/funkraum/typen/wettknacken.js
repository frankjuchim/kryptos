/* Kryptos – Funkraum-Szenario „Wettknacken“ (W1 §9.2/§9.3, Plan M7 Task 138). Nur Regeln dieses Typs; Zustandsautomat,
   Sichtbarkeits-Grundregeln, Versionen, Grenzen und Löschung macht der Dienst (dienst.js). Gerüst aus Task 134 –
   Inhalte folgen in Task 138. Vertrag: Plan M7 „Szenario-Typ-Vertrag“. */
'use strict';
const L = require('../loeschen');

module.exports = {
  typ: 'wettknacken',
  /** beim Start (vorbereitung → laeuft): konfig- und Rollen-Zustände anlegen (Zufall nur über ctx.zufallBytes) */
  start() {
    return {};
  },
  /** Aktionen: name → (ctx, sz, betrachter, body) → Antwort (Task 138) */
  aktionen: {},
  /** anonyme Auswertung (nur Zahlen, ids, Codes) – generisch bis Task 138 */
  auswertung(ctx, sz) {
    return L.auswertungGenerisch(ctx.db, sz.id);
  }
};
