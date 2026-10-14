'use strict';
// Richtige und falsche Antworten zu test/fixtures/welt_beispiel.json (für API- und E2E-Tests).
const RICHTIG = {
  'W9-L1-01': { g1: '9', g2: '3', g3: '4', g4: 'length' },
  'W9-L1-02': { c1: '1', c2: '3', c3: '6', art: 'Zählschleife', op: '<' },
  'W9-L1-03': { g1: '≤', g2: 'anzahl' },
  'W9-L1-04': ['a'],
  'W9-L1-05': ['a', 'c'],
  'W9-L1-06': { e1: 'w', e2: 'b', e3: 'i' },
  'W9-L2-01': ['a', 'b', 'c', 'd', 'e'],
  'W9-L2-02': [[3], { g1: '<' }],
  'W9-L2-03': ['', 'L', 'LL', 'LR', 'LRL', 'LRR', 'R', 'RR', 'RRL'],
  'W9-L2-04': '5(3(1,4),8(-,9))',
  'W9-L2-05': [[0, 1], [1, 2], [2, 3]],
  'W9-L2-06': [4, 7, 5],
  'W9-L2-07': [[0, 1], [0, 3], [1, 0], [1, 2], [2, 2]],
  'W9-L2-08': ['7', '5', '1'],
  'W9-L2-09': ['A', 'X', 'B', 'Y'],
  'W9-L4-01': { q1: 's' },
  'W9-B-01': { g1: '3' },
  'W9-B-02': { g1: '2' },
  'W9-B-03': ['b'],
  'W9-B-04': ['1', '3'],
  'W9-B-06': { g1: '3' }
};
const FALSCH = {
  'W9-L1-01': { g1: '9', g2: '2', g3: '4', g4: 'length' },
  'W9-L1-02': { c1: '1', c2: '2', c3: '6', art: 'while', op: '<=' },
  'W9-L1-03': { g1: '<', g2: 'anzahl' },
  'W9-L1-04': ['b'],
  'W9-L1-05': ['a'],
  'W9-L1-06': { e1: 'w', e2: 'i', e3: 'i' },
  'W9-L2-01': ['a', 'b', 'c', 'd', 'x'],
  'W9-L2-02': [[4], { g1: '<' }],
  'W9-L2-03': ['', 'R'],
  'W9-L2-04': '5(3(-,4),8(-,9))',
  'W9-L2-05': [[0, 1], [3, 4]],
  'W9-L2-06': [4, 6],
  'W9-L2-07': [[0, 1]],
  'W9-L2-08': ['3', '7', '5', '1'],
  'W9-L2-09': ['A', 'X', 'B', 'C', 'Y'],
  'W9-L4-01': { q1: 'T' },
  'W9-B-01': { g1: '3.4' },
  'W9-B-02': { g1: '3' },
  'W9-B-03': ['a'],
  'W9-B-04': ['3', '1'],
  'W9-B-06': { g1: '2' }
};
Object.assign(RICHTIG, {
  'W9-A-01': 'treffpunkt',
  'W9-L5-01': 'zuverlaessig', 'W9-L5-02': ['B', 'O', 'G', 'R', 'Z', 'N', 'W', 'S', 'K'], 'W9-L5-03': [9, 11, 19, 5, 14],
  'W9-L5-04': ['26 1 2 3 4', '24, 25, 26, 20, 21'], 'W9-L5-05': 'NHQZS FJKRH JS', 'W9-L5-06': 'rfnep ktfut',
  'W9-L5-07': 'Mondfinsternis', 'W9-L5-08': 'UVMGE OVFCC F', 'W9-B-05': 'treffpunkt'
});
Object.assign(FALSCH, {
  'W9-A-01': 'HFSTTDIBYH', 'W9-L5-01': 'ZUVERLAESSIX', 'W9-L5-02': 'BOGRZNWSL', 'W9-L5-03': [9, 11, 19, 5, 15],
  'W9-L5-04': ['26 1 2 3 4', '24 25 0 20 21'], 'W9-L5-05': 'NHOOBHGIHIQZ', 'W9-L5-06': 'RFNEPKTFTU',
  'W9-L5-07': 'MSNZFWZIDEVNES', 'W9-L5-08': 'FCCFVOEGMVU', 'W9-B-05': 'BHONVZCDUB'
});
/** Fallen-Diagnose (Delta §9): je Zeile eine Fehlantwort und die erwarteten [p, code] */
const DIAGNOSE = [
  { aufgabe: 'W9-L5-01', antwort: 'FABKXRGKYYOM', erwartet: [['P3', 'richtung']] },
  { aufgabe: 'W9-L5-01', antwort: 'YTUDQKZDRRHF', erwartet: [['P1', 'zaehlbasis']] },
  { aufgabe: 'W9-L5-01', antwort: '0UVERLAESSIG', erwartet: [['P2', 'null_statt_z']] },
  { aufgabe: 'W9-L5-01', antwort: 'ZUB', teilweise: true, erwartet: [['P3', 'richtung']] },
  { aufgabe: 'W9-L5-07', antwort: 'MSNZFWZIDEVNES', erwartet: [['P3', 'reihenfolge']] },
  { aufgabe: 'W9-L5-06', antwort: 'UTFNRFKEPT', erwartet: [['P3', 'permutation']] },
  { aufgabe: 'W9-L5-06', antwort: 'RFNXEPKXTFUT', erwartet: [['P4', 'fuellung']] },
  { aufgabe: 'W9-L5-03', antwort: '5 7 15 1 10', erwartet: [['P1', 'zaehlbasis']] },
  { aufgabe: 'W9-L5-02', antwort: 'YTEOELTXI', erwartet: [['P1', 'position']] },
  { aufgabe: 'W9-L5-02', antwort: 'YTEOELTXQ', erwartet: [['P1', 'position']] },
  { aufgabe: 'W9-L5-02', antwort: 'YTE', erwartet: [] },
  { aufgabe: 'W9-L5-02', antwort: 'COFRZOWSJ', erwartet: [['P2', 'ueberlauf']] }, // Umbruchstellen je um 1 daneben
  { aufgabe: 'W9-L5-04', teil: 0, antwort: [0, 1, 2, 3, 4], erwartet: [['P2', 'null_statt_z']] },
  { aufgabe: 'W9-L5-04', teil: 0, antwort: [26, 27, 28, 29, 30], erwartet: [['P2', 'ueberlauf']] },
  { aufgabe: 'W9-L5-04', teil: 1, antwort: [-2, -1, 0, 20, 21], erwartet: [['P2', 'negativ']] },
  { aufgabe: 'W9-L5-05', antwort: 'NHOOBHGIHIQZ', erwartet: [['P4', 'paare']] },
  { aufgabe: 'W9-L5-08', antwort: 'FCCFVOEGMVU', erwartet: [['P4', 'regel']] },
  { aufgabe: 'W9-L5-08', antwort: 'STKECMTDAAD', erwartet: [['P3', 'richtung']] }
];
// Task 26: erwartete Fehlantworten in gaps (Delta §9.6)
RICHTIG['W9-L5-09'] = { g1: 'a', g2: 'B', g3: ' c ', wert: '26' };
FALSCH['W9-L5-09'] = { g1: 'A', g2: 'B', g3: 'C', wert: '0' };
DIAGNOSE.push(
  { aufgabe: 'W9-L5-09', antwort: { g1: 'A', g2: 'B', g3: 'C', wert: '0' }, erwartet: [['P2', 'null_statt_z']] },
  { aufgabe: 'W9-L5-09', antwort: { g1: 'A', g2: 'B', g3: 'C', wert: '25' }, erwartet: [] }
);
// Task 27: Interaktion zuordnung (Delta §8.2, §9.3)
const ZU = { A: 'h', B: 'i', F: 'l', G: 'a', H: 'c', I: 'd', J: 'm', K: 'n', L: 'o', N: 'f', Q: 'r', R: 's', S: 'g', T: 't', U: 'u', Z: 'z' };
Object.assign(RICHTIG, { 'W9-L3-01': { zuordnung: ZU }, 'W9-L3-02': { A: 'H', B: 'I', D: 'K', F: 'L', J: 'M', K: 'N', M: 'E', N: 'F', Q: 'R', S: 'G', T: 'T' } });
Object.assign(FALSCH, { 'W9-L3-01': { zuordnung: { ...ZU, A: 'x' } }, 'W9-L3-02': { A: 'H', B: 'I', D: 'K', F: 'L', J: 'M', K: 'N', M: 'E', N: 'F', Q: 'S', S: 'G', T: 'T' } });
DIAGNOSE.push(
  // Klar → Geheim eingetragen (Verschlüsselungsrichtung); M bleibt Vorgabe – 9 entscheidbare Paare, alle erklärt
  { aufgabe: 'W9-L3-01', antwort: { zuordnung: { A: 'G', B: 'E', F: 'N', G: 'S', H: 'A', I: 'B', J: 'C', K: 'D', L: 'F', N: 'K', Q: 'P', R: 'Q', S: 'R', T: 'T', U: 'U', Z: 'Z' } }, erwartet: [['P3', 'richtung']] },
  // alle 16 vergebenen Paare eine Stelle weiter
  { aufgabe: 'W9-L3-01', antwort: { zuordnung: { A: 'I', B: 'J', F: 'M', G: 'B', H: 'D', I: 'E', J: 'N', K: 'O', L: 'P', N: 'G', Q: 'S', R: 'T', S: 'H', T: 'U', U: 'V', Z: 'A' } }, erwartet: [['P1', 'zaehlbasis']] },
  { aufgabe: 'W9-L3-01', antwort: { zuordnung: { A: 'X', B: 'Q' } }, erwartet: [] }
);
// Task 28: Interaktion schaubild-ergaenzen (Delta §8.3, §9.5)
const SIG = { s1: { art: 'privat', inhaber: 'A' }, s2: { art: 'oeffentlich', inhaber: 'A' } };
Object.assign(RICHTIG, { 'W9-L6-05': SIG, 'W9-L6-06': { z1: 'Zertifikat', z2: 'mallory' } });
Object.assign(FALSCH, { 'W9-L6-05': { ...SIG, s1: { art: 'oeffentlich', inhaber: 'A' } }, 'W9-L6-06': { z1: 'Signatur', z2: 'Mallory' } });
DIAGNOSE.push(
  { aufgabe: 'W9-L6-05', antwort: { ...SIG, s1: { art: 'oeffentlich', inhaber: 'A' } }, erwartet: [['P9', 'schluesselart']] },
  { aufgabe: 'W9-L6-05', antwort: { ...SIG, s1: { art: 'privat', inhaber: 'B' } }, erwartet: [['P9', 'inhaber']] },
  { aufgabe: 'W9-L6-05', antwort: { ...SIG, s1: { art: 'oeffentlich', inhaber: 'B' } }, erwartet: [['P9', 'schluesselrolle']] },
  { aufgabe: 'W9-L6-05', antwort: { s1: { art: 'oeffentlich', inhaber: 'A' }, s2: { art: 'oeffentlich', inhaber: 'B' } }, erwartet: [['P9', 'schluesselart'], ['P9', 'inhaber']] }
);
// Task 29: Interaktion bits-rechnen (Delta §8.4, §9.4)
Object.assign(RICHTIG, { 'W9-L6-01': '0010 0001', 'W9-L6-02': { c1: '01101001' }, 'W9-L6-03': { bits: '0100 1011' }, 'W9-L6-04': 'A',
  'W9-L3-03': '1101 1000 0110 1110', 'W9-L3-04': [13, 3, 7, 5] });
Object.assign(FALSCH, { 'W9-L6-01': '0010 0011', 'W9-L6-02': { c1: '0110 1000' }, 'W9-L6-03': '01001100', 'W9-L6-04': 'a',
  'W9-L3-03': '1101 1000 0110 1111', 'W9-L3-04': [3, 5, 7] });
DIAGNOSE.push(
  { aufgabe: 'W9-L6-01', antwort: '0100 1010', erwartet: [['P4', 'verknuepfung']] },
  { aufgabe: 'W9-L6-01', antwort: '0110 1011', erwartet: [['P4', 'verknuepfung']] },
  { aufgabe: 'W9-L6-01', antwort: '1000 0100', erwartet: [['P4', 'bitreihenfolge']] },
  { aufgabe: 'W9-L6-03', antwort: '0100 1010', erwartet: [['P1', 'ascii']] },
  { aufgabe: 'W9-L6-04', antwort: 'B', erwartet: [['P1', 'ascii']] },
  { aufgabe: 'W9-L6-04', antwort: '@', erwartet: [['P1', 'ascii']] },
  { aufgabe: 'W9-L3-03', antwort: '1101 1011 0011 1000', erwartet: [['P4', 'transposition']] },
  { aufgabe: 'W9-L3-03', antwort: '0111 1000 1011 0000', erwartet: [['P3', 'richtung']] },
  { aufgabe: 'W9-L3-03', antwort: '1010 0001 1001 1011', erwartet: [['P3', 'richtung']] },
  { aufgabe: 'W9-L3-04', antwort: [3, 5, 7], erwartet: [] }
);
// Plan M8 Task 166: KRYPTOS-16-Schritte (schritt, text)
Object.assign(RICHTIG, { 'W9-L3-05': '0110 1111 0111 0110', 'W9-L3-06': { bits: '1011 0100 0011 1001' } });
Object.assign(FALSCH, { 'W9-L3-05': '0111 0001 0100 0111', 'W9-L3-06': '1101 0110 0010 0011' });
DIAGNOSE.push(
  { aufgabe: 'W9-L3-05', antwort: '0100 1000 1010 0100', erwartet: [['P3', 'richtung']] },
  { aufgabe: 'W9-L3-06', antwort: '1101 0110 0010 0011', erwartet: [['P3', 'richtung']] }
);
// Review M3 W1: Knack-Aufgabe im Kryptoanalyse-Level (Schlüssel verdeckt)
Object.assign(RICHTIG, { 'W9-L2-10': 'wolke nzieh enauf' });
Object.assign(FALSCH, { 'W9-L2-10': 'WOLKENZIEHENAUX' });
// Task 34: Niveau – Ergänzung (RSA) und eA-Aufgabe im kern-Level W9-L5
Object.assign(RICHTIG, { 'W9-L5-10': { c: '31' }, 'W9-L5-11': ['a'] });
Object.assign(FALSCH, { 'W9-L5-10': { c: '64' }, 'W9-L5-11': ['b'] });
const LEVEL_AUFGABEN = Object.keys(RICHTIG).filter((id) => id.includes('-L'));
module.exports = { RICHTIG, FALSCH, LEVEL_AUFGABEN, DIAGNOSE };
