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
  { aufgabe: 'W9-L5-02', antwort: '0O0RZ0WS0', erwartet: [['P2', 'ueberlauf']] },
  { aufgabe: 'W9-L5-04', teil: 0, antwort: [0, 1, 2, 3, 4], erwartet: [['P2', 'null_statt_z']] },
  { aufgabe: 'W9-L5-04', teil: 0, antwort: [26, 27, 28, 29, 30], erwartet: [['P2', 'ueberlauf']] },
  { aufgabe: 'W9-L5-04', teil: 1, antwort: [-2, -1, 0, 20, 21], erwartet: [['P2', 'negativ']] },
  { aufgabe: 'W9-L5-05', antwort: 'NHOOBHGIHIQZ', erwartet: [['P4', 'paare']] },
  { aufgabe: 'W9-L5-08', antwort: 'FCCFVOEGMVU', erwartet: [['P4', 'regel']] },
  { aufgabe: 'W9-L5-08', antwort: 'STKECMTDAAD', erwartet: [['P3', 'richtung']] }
];
const LEVEL_AUFGABEN = Object.keys(RICHTIG).filter((id) => id.includes('-L'));
module.exports = { RICHTIG, FALSCH, LEVEL_AUFGABEN, DIAGNOSE };
