// Krypto-Bibliothek (public/static/js/shared/krypto.js) – Spec-Vektoren und Eigenschaften.
// Spec-Vektor-first: Jeder Wert stammt aus einer Welt-Spec (Prüfprotokoll §12, Level-Tabellen, Akten, Bosse,
// Warm-up), TECHNIK §5.2, dem Plan oder materialien/Videos/*/video.json; die Quelle steht im Testnamen.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const K = require('../public/static/js/shared/krypto.js');

const ohne = (s) => s.replace(/\s+/g, '');
const GROSS = (s) => ohne(s).toUpperCase();

// Deterministischer PRNG für die Eigenschaftstests (mulberry32, wie im Zwilling-Vergleich).
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const zufall = mulberry32(20261012);
const ganz = (min, max) => min + Math.floor(zufall() * (max - min + 1));
const ZEICHEN = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZäöüßÄÖÜ  ,.!-?é';
function zufallsText(maxLaenge = 60, vorrat = ZEICHEN) {
  let s = '';
  const n = ganz(0, maxLaenge);
  for (let i = 0; i < n; i++) s += vorrat[ganz(0, vorrat.length - 1)];
  return s;
}
const zufallsWort = (min = 1, max = 10) => {
  let s = '';
  const n = ganz(min, max);
  for (let i = 0; i < n; i++) s += K.ALPHABET[ganz(0, 25)];
  return s;
};
const RUNDEN = 500;

// ───────────────────────────── Task 10: Grundlagen ─────────────────────────────

test('ALPHABET und KryptoFehler', () => {
  assert.equal(K.ALPHABET, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  const f = new K.KryptoFehler('x');
  assert.ok(f instanceof Error);
  assert.equal(f.name, 'KryptoFehler');
});

test('rest_null_ist_z', () => {
  assert.equal(K.buchstabe(26, 1), 'Z');
  assert.equal(K.buchstabe(0, 1), 'Z');
  assert.equal(K.buchstabe(27, 1), 'A');
  assert.equal(K.buchstabe(26), 'Z'); // Standardbasis 1
  assert.equal(K.buchstabe(0, 0), 'A');
  assert.equal(K.buchstabe(26, 0), 'A');
  assert.equal(K.buchstabe(-1, 1), 'Y');
});

test('mod (Plan, Video 01: 15 mod 12 = 3; 27 mod 26 = 1; 26 mod 26 = 0; −6 mod 26 = 20)', () => {
  assert.equal(K.mod(-6, 26), 20);
  assert.equal(K.mod(26, 26), 0);
  assert.equal(K.mod(15, 12), 3);
  assert.equal(K.mod(27, 26), 1);
  assert.equal(K.mod(-26, 26), 0);
  assert.throws(() => K.mod(3, 0), K.KryptoFehler);
  assert.throws(() => K.mod(1.5, 26), K.KryptoFehler);
});

test('wert: A → basis … Z → basis + 25', () => {
  assert.equal(K.wert('A'), 1);
  assert.equal(K.wert('z'), 26);
  assert.equal(K.wert('A', 0), 0);
  assert.equal(K.wert('Z', 0), 25);
  assert.throws(() => K.wert('AB'), K.KryptoFehler);
  assert.throws(() => K.wert('1'), K.KryptoFehler);
});

test('verschiebung: Schlüsselbuchstabe A = 0', () => {
  assert.equal(K.verschiebung('A'), 0);
  assert.equal(K.verschiebung('L'), 11);
  assert.equal(K.verschiebung('z'), 25);
});

test('normalisieren_umlaute', () => {
  assert.equal(K.nurBuchstaben('Grüße, Bob!'), 'GRUESSEBOB');
  assert.equal(K.normalisieren('Grüße, Bob!'), K.normalisieren('GRUESSEBOB'));
});

test('normalisieren: Tabelle Delta §5.1 und Grenzfälle', () => {
  assert.equal(K.normalisieren('Treffpunkt am Hafen!'), 'TREFFPUNKTAMHAFEN');
  assert.equal(K.normalisieren('bohvs vjnnp'), 'BOHVSVJNNP');
  assert.equal(K.normalisieren('Grüße aus Köln'), 'GRUESSEAUSKOELN');
  assert.equal(K.normalisieren('Café – 12 Uhr'), 'CAFE12UHR');
  assert.equal(K.normalisieren('A-D-F-G-V-X'), 'ADFGVX');
  assert.equal(K.normalisieren('ÄÖÜẞ äöüß'), 'AEOEUESSAEOEUESS');
  assert.equal(K.normalisieren('Ça, Ñandú, Élan'), 'CANANDUELAN');
  // NFC: zerlegtes ü (u + U+0308) zählt wie ü
  assert.equal(K.normalisieren('Grüße'), 'GRUESSE');
  assert.equal(K.normalisieren('Zeile 1\nZeile\t2'), 'ZEILE1ZEILE2');
  assert.equal(K.normalisieren('Café – 12 Uhr', { ziffern: false }), 'CAFEUHR');
  assert.equal(K.nurBuchstaben('Café – 12 Uhr'), 'CAFEUHR');
  assert.equal(K.normalisieren(''), '');
  assert.equal(K.nurBuchstaben('1234 !?'), '');
  assert.throws(() => K.normalisieren(null), K.KryptoFehler);
  assert.throws(() => K.nurBuchstaben(42), K.KryptoFehler);
});

test('normBits (Delta §5.2)', () => {
  assert.equal(K.normBits('0100 0001'), '01000001');
  assert.equal(K.normBits(' 01_00|00.01\n'), '01000001');
  assert.equal(K.normBits('0102'), '0102'); // andere Zeichen bleiben stehen
});

test('gruppieren, klein, zahlen, ausZahlen', () => {
  assert.equal(K.gruppieren('ABCDEFGHIJKL'), 'ABCDE FGHIJ KL');
  assert.equal(K.gruppieren('ABCDE FGHIJ KL'), 'ABCDE FGHIJ KL');
  assert.equal(K.gruppieren('ABCDEF', 2, '·'), 'AB·CD·EF');
  assert.equal(K.gruppieren('', 5), '');
  assert.throws(() => K.gruppieren('ABC', 0), K.KryptoFehler);
  assert.equal(K.klein('GEHEIMBOTSCHAFT'), 'geheimbotschaft');
  assert.deepEqual(K.zahlen('Abz'), [1, 2, 26]);
  assert.deepEqual(K.zahlen('ABZ', 0), [0, 1, 25]);
  assert.equal(K.ausZahlen([1, 2, 26]), 'ABZ');
  assert.equal(K.ausZahlen([0, 27, 52]), 'ZAZ');
  assert.equal(K.ausZahlen([0, 1, 25], 0), 'ABZ');
  assert.throws(() => K.ausZahlen([1.5]), K.KryptoFehler);
});

// ───────────────────────────── Caesar ─────────────────────────────

test('caesar (Plan, Video 01)', () => {
  assert.equal(K.caesar('treffpunktambrunnen', 6), 'ZXKLLVATQZGSHXATTKT');
  assert.equal(K.caesar('RPSPTXMZEDNSLQE', 11, 'ent'), 'GEHEIMBOTSCHAFT');
  // Video 01: Geheimtextalphabet k = 6; t → Z, u → A, r → X, e → K; P3: RPSPT mit +11 → cadae; −11 ≡ +15
  assert.equal(K.caesar(K.ALPHABET, 6), 'GHIJKLMNOPQRSTUVWXYZABCDEF');
  assert.equal(K.caesar('ture', 6), 'ZAXK');
  assert.equal(K.caesar('RPSPT', 11), 'CADAE');
  assert.equal(K.caesar('RPSPTXMZEDNSLQE', 15), 'GEHEIMBOTSCHAFT');
  assert.equal(K.caesar('a', 6, 'ent'), 'U'); // P2: 1 − 6 = −5 → 21 → u
});

test('caesar grenzfaelle', () => {
  assert.equal(K.caesar('ABC', 0), 'ABC');
  assert.equal(K.caesar('ABC', 26), 'ABC');
  assert.equal(K.caesar('ABC', -1), 'ZAB');
  assert.equal(K.caesar('ABC', 25), 'ZAB');
  assert.equal(K.caesar('', 5), '');
  assert.equal(K.caesar('Grüße!', 1), 'HSVFTTF');
  assert.throws(() => K.caesar('ABC', 1.5), K.KryptoFehler);
  assert.throws(() => K.caesar('ABC', '3'), K.KryptoFehler);
  assert.throws(() => K.caesar('ABC', 3, 'rueck'), K.KryptoFehler);
});

test('caesar: SPEC W0 §12 Prüfprotokoll', () => {
  // Akte W0·2: AW k = 3, A1 k = 7, A2 k = 10, Abi k = 25
  assert.equal(K.caesar('rueckzug ins lager', 3), GROSS('UXHFN CXJLQ VODJH U'));
  assert.equal(K.caesar('die legion zieht nach norden', 7), GROSS('KPLSL NPVUG PLOAU HJOUV YKLU'));
  assert.equal(K.caesar('GSBLB KEMRO XWORB GKCCO B', 10, 'ent'), 'WIRBRAUCHENMEHRWASSER');
  assert.equal(K.caesar('bote', 25), 'ANSD');
  // Formelwerte (W,3) (X,5) (Z,1) (T,6) (Y,1) (H,25) (N,12) (S,7) (V,4) → Z, C, A, Z, Z, G, Z, Z, Z
  const formel = [['W', 3, 'Z'], ['X', 5, 'C'], ['Z', 1, 'A'], ['T', 6, 'Z'], ['Y', 1, 'Z'], ['H', 25, 'G'], ['N', 12, 'Z'], ['S', 7, 'Z'], ['V', 4, 'Z']];
  for (const [p, k, c] of formel) {
    assert.equal(K.caesar(p, k), c, `${p}, k = ${k}`);
    assert.equal(K.buchstabe(K.wert(p) + k), c, `Formel ${p}, k = ${k}`);
  }
  // Akte W0·2 A3: TYHN mit k = 6, 1, 25, 12 → ZZGZ; Boss W0-B-07: SVH mit 7, 4, 25 → ZZG
  assert.equal([...'TYHN'].map((c, i) => K.caesar(c, [6, 1, 25, 12][i])).join(''), 'ZZGZ');
  assert.equal([...'SVH'].map((c, i) => K.caesar(c, [7, 4, 25][i])).join(''), 'ZZG');
  // Brute Force A4 (k = 19) / Lab 04 (k = 17)
  assert.equal(K.caesar('LXGTM MTZMA XNMX', 19, 'ent'), 'SENATTAGTHEUTE');
  assert.equal(K.caesar('LXGTM', 1, 'ent'), 'KWFSL');
  assert.equal(K.alleCaesar('LXGTM MTZMA XNMX')[19].text, 'SENATTAGTHEUTE');
  assert.equal(K.alleCaesar('BLIZV INRIK VKRDK FI')[17].text, 'KURIERWARTETAMTOR');
  // Known-Plaintext A5 (k = 11) / Lab 05 (F ↔ R: k = 14) / Boss 08 (k = 9)
  assert.equal(K.caesar('galliaestomnisdivisa', 11), 'RLWWTLPDEZXYTDOTGTDL');
  assert.equal(K.mod(K.wert('F') - K.wert('R'), 26), 14);
  assert.equal(K.caesar('castra', 9), 'LJBCAJ');
  assert.equal(K.mod(K.wert('L') - K.wert('C'), 26), 9);
  // Caesar ∘ Caesar: 9 + 20 / 15 + 11 / 8 + 18
  assert.equal(K.caesar('hilfe', 9), 'QRUON');
  assert.equal(K.caesar(K.caesar('hilfe', 9), 20), 'KLOIH');
  assert.equal(K.caesar('hilfe', 3), 'KLOIH');
  assert.equal(K.caesar('feldzug', 15), 'UTASOJV');
  assert.equal(K.caesar(K.caesar('feldzug', 15), 11), 'FELDZUG');
  assert.equal(K.caesar(K.caesar('tribun', 8), 18), 'TRIBUN');
  // Lab 0.2: ave k 4 / IMOTQ k 12 / quiz k 9
  assert.equal(K.caesar('ave', 4), 'EZI');
  assert.equal(K.caesar('IMOTQ', 12, 'ent'), 'WACHE');
  assert.equal(K.caesar('quiz', 9), 'ZDRI');
  // Boss 03 / 06
  assert.equal(K.caesar('legat', 6), 'RKMGZ');
  assert.equal(K.caesar('PYLLU NCGMY HUN', 20, 'ent'), 'VERRATIMSENAT');
  // Struktogramm-Trace hof k 4 / nil k 20
  assert.equal(K.caesar('hof', 4), 'LSJ');
  assert.equal(K.caesar('nil', 20), 'HCF');
  // Hauptprogramm-Ausgabe LSG: bruteForce(ZUDBZ DRZQ)[25] = avecaesar
  assert.equal(K.alleCaesar('ZUDBZ DRZQ')[25].text, 'AVECAESAR');
});

test('caesar: Warm-up W1/W2/W3', () => {
  assert.equal(K.caesar('YMDE', 12, 'ent'), 'MARS'); // WU-W1-10
  assert.equal(K.caesar('rom', 3), 'URP'); // WU-W2-01
  assert.equal(K.caesar('KDIHQ', 3, 'ent'), 'HAFEN'); // WU-W3-09
  assert.equal(K.buchstabe(24 + 5), 'C'); // W2-Warm-up ((24 + 5 − 1) mod 26) + 1 = 3
});

test('alleCaesar (Plan, Video 01)', () => {
  const liste = K.alleCaesar('GTVAMPTVAX');
  assert.equal(liste.length, 26);
  assert.equal(liste[19].text, 'NACHTWACHE');
  assert.equal(liste[19].k, 19);
  assert.deepEqual(liste[0], { k: 0, text: 'GTVAMPTVAX' });
  assert.deepEqual(K.alleCaesar('').map((z) => z.text), new Array(26).fill(''));
});

// ───────────────────────────── Atbash ─────────────────────────────

test('atbash (SPEC W0 §12)', () => {
  assert.equal(K.atbash('caesar'), 'XZVHZI');
  assert.equal(K.atbash('legion'), 'OVTRLM');
  assert.equal(K.atbash('mauer'), 'NZFVI');
  assert.equal(K.atbash('mond'), 'NLMW');
  assert.equal(K.atbash(K.ALPHABET), 'ZYXWVUTSRQPONMLKJIHGFEDCBA');
  assert.equal(K.atbash(''), '');
});

// ───────────────────────────── Affin ─────────────────────────────

test('affin: nur teilerfremde a', () => {
  assert.throws(() => K.affin('A', 2, 0), K.KryptoFehler);
  assert.throws(() => K.affin('A', 13, 0), K.KryptoFehler); // W1-L2-03: m = 13 nicht umkehrbar
  assert.throws(() => K.affin('A', 0, 0), K.KryptoFehler);
  assert.throws(() => K.affin('A', 1.5, 0), K.KryptoFehler);
  assert.throws(() => K.affin('A', 5, 0.5), K.KryptoFehler);
  assert.equal(K.affinSchluesselGueltig(13), false);
  assert.equal(K.affinSchluesselGueltig(2), false);
  assert.equal(K.affinSchluesselGueltig(0), false);
  assert.equal(K.affinSchluesselGueltig(1.5), false);
  // W1-B-08: aus 4, 5, 13, 17, 22, 25 nur 5, 17, 25
  assert.deepEqual([4, 5, 13, 17, 22, 25].filter(K.affinSchluesselGueltig), [5, 17, 25]);
  // W1-L2-05: 12 gültige m → 312 Schlüssel
  assert.equal(Array.from({ length: 26 }, (_, m) => m).filter(K.affinSchluesselGueltig).length * 26, 312);
  assert.equal(K.affinSchluesselGueltig(27), true);
  assert.equal(K.affinSchluesselGueltig(-1), true);
});

test('affin: Standard A = 0 (W1)', () => {
  assert.equal(K.affin('dattel', 5, 6), 'VGXXAJ');
  assert.equal(K.affin('VGXXAJ', 5, 6, 'ent'), 'DATTEL');
  assert.equal(K.affin('A', 7), 'A'); // b = 0 Standard: multiplikativ
});

test('affin: SPEC W1 §12 Prüfprotokoll (mod 26, A = 0)', () => {
  assert.equal(K.affin('sultan', 7, 3), 'ZNCGDQ');
  assert.equal(K.affin('harun', 5, 0), 'JAHWN');
  assert.equal(K.affin('minarett', 11, 4), 'GOREJWFF');
  assert.equal(K.affin('RWEZWI', 9, 2, 'ent'), 'TIGRIS');
  assert.equal(K.affin('CPQN', 21, 7, 'ent'), 'BOTE');
  assert.equal(K.affin('sklave', 5, 8), 'UGLIJC');
  assert.equal(K.affin('LVTNI', 11, 3, 'ent'), 'WESIR');
  // Known-Plaintext (3,10) · (11,6) · (7,11): e → W, n → X · e → Y, n → T · e → N, n → Y
  assert.equal(K.affin('en', 3, 10), 'WX');
  assert.equal(K.affin('en', 11, 6), 'YT');
  assert.equal(K.affin('en', 7, 11), 'NY');
  // Doppelt affin (3,5) ∘ (7,2) auf karawane = (21,11)
  assert.equal(K.affin(K.affin('karawane', 3, 5), 7, 2), 'NLELFLYR');
  assert.equal(K.affin('karawane', 21, 11), 'NLELFLYR');
  // Spiegel-Kurier c = t − p (A = 0) = affin mit a = 25 (≡ −1): basar t 4 / dinar t 9 / Involution
  assert.equal(K.affin('basar', 25, 4), 'DEMEN');
  assert.equal(K.affin('dinar', -1, 9), 'GBWJS');
  assert.equal(K.affin('GBWJS', 25, 9), 'DINAR');
  assert.equal(K.affin(K.affin('basar', 25, 4), 25, 4), 'BASAR');
});

test('affin: Option basis 1 (TECHNIK §5.2, Verifikation)', () => {
  // A = 1: dattel (5,6) → ((5·p + 6 − 1) mod 26) + 1
  const erwartet = [...'DATTEL'].map((c) => K.buchstabe(5 * K.wert(c, 1) + 6, 1)).join('');
  assert.equal(K.affin('dattel', 5, 6, 'ver', 1), erwartet);
  assert.notEqual(K.affin('dattel', 5, 6, 'ver', 1), 'VGXXAJ');
  assert.equal(K.affin(erwartet, 5, 6, 'ent', 1), 'DATTEL');
  assert.throws(() => K.affin('A', 5, 6, 'ver', 2), K.KryptoFehler);
});

// ───────────────────────────── Schlüsselwort-Alphabet, Substitution ─────────────────────────────

test('schluesselwortAlphabet (SPEC W1 §0, §12; Video 02)', () => {
  assert.equal(K.schluesselwortAlphabet('SCHERAZADE'), 'SCHERAZDBFGIJKLMNOPQTUVWXY');
  const tafel = {
    KALIF: 'KALIFBCDEGHJMNOPQRSTUVWXYZ',
    ZEDER: 'ZEDRABCFGHIJKLMNOPQSTUVWXY',
    PAPYRUS: 'PAYRUSBCDEFGHIJKLMNOQTVWXZ',
    SULTAN: 'SULTANBCDEFGHIJKMOPQRVWXYZ',
    YASMIN: 'YASMINBCDEFGHJKLOPQRTUVWXZ',
    WUESTENWIND: 'WUESTNIDABCFGHJKLMOPQRVXYZ',
    TUSCHE: 'TUSCHEABDFGIJKLMNOPQRVWXYZ',
    ZIFFER: 'ZIFERABCDGHJKLMNOPQSTUVWXY',
  };
  for (const [w, a] of Object.entries(tafel)) assert.equal(K.schluesselwortAlphabet(w), a, w);
  assert.equal(K.schluesselwortAlphabet('OASE').slice(0, 8), 'OASEBCDF');
  assert.equal(K.schluesselwortAlphabet('kalif'), tafel.KALIF);
  // Fixpunkte: KALIF 14, SCHERAZADE 0, ZEDER 0, PAPYRUS 1, SULTAN 5, YASMIN 1, WUESTENWIND 3, TUSCHE 5, ZIFFER 0
  const fix = (a) => [...a].filter((c, i) => c === K.ALPHABET[i]).length;
  const soll = { KALIF: 14, SCHERAZADE: 0, ZEDER: 0, PAPYRUS: 1, SULTAN: 5, YASMIN: 1, WUESTENWIND: 3, TUSCHE: 5, ZIFFER: 0 };
  for (const [w, n] of Object.entries(soll)) assert.equal(fix(K.schluesselwortAlphabet(w)), n, `Fixpunkte ${w}`);
});

test('schluesselwortAlphabet: Rest ab dem letzten Buchstaben, Grenzfälle', () => {
  assert.equal(K.schluesselwortAlphabet('KALIF', { rest: 'ab_letztem' }), 'KALIFGHJMNOPQRSTUVWXYZBCDE');
  assert.equal(K.schluesselwortAlphabet('', {}), K.ALPHABET);
  assert.equal(K.schluesselwortAlphabet('AAAA'), K.ALPHABET);
  assert.equal(K.schluesselwortAlphabet('Zwölf'), 'ZWOELFABCDGHIJKMNPQRSTUVXY');
  assert.throws(() => K.schluesselwortAlphabet('KALIF', { rest: 'rueckwaerts' }), K.KryptoFehler);
});

test('substitution: SPEC W1 §12 Prüfprotokoll', () => {
  const S = K.schluesselwortAlphabet;
  assert.equal(K.substitution('der kalif schlaeft', S('KALIF')), GROSS('IFRHK JEBSL DJKFB T'));
  assert.equal(K.substitution('mond', S('KALIF')), 'MONI');
  assert.equal(K.substitution('tausend und eine nacht', S('SCHERAZADE')), GROSS('QSTPR KETKE RBKRK SHDQ'));
  assert.equal(K.substitution('VRPBO', S('SCHERAZADE'), 'ent'), 'WESIR');
  assert.equal(K.substitution('harun', S('SULTAN')), 'CSORI');
  assert.equal(K.substitution('RDBPDQ', S('YASMIN'), 'ent'), 'TIGRIS');
  assert.equal(K.substitution('kurier', S('WUESTENWIND')), 'CQMATM');
  // Archivfund W1 (PAPYRUS)
  assert.equal(
    K.substitution('ZPUCG URDUZ UDYCU IQIRR QSDIR UNORU INYCG QUNNU G', S('PAPYRUS'), 'ent'),
    GROSS('zaehlediezeichenunddufindestdenschluessel'),
  );
  // Lab W1-L1-07 (SULTAN, 56)
  const c7 = 'TDAPQ AOIAP QACAI CAGGR AUAOT AOPQS TQRIT TDAWS LCABA CQDCO AORIT A';
  assert.equal(K.substitution(c7, S('SULTAN'), 'ent'), GROSS('diesternestehenhellueberderstadtunddiewachegehtihrerunde'));
  assert.equal(K.substitution('diesternestehenhellueberderstadtunddiewachegehtihrerunde', S('SULTAN')), GROSS(c7));
  // Akte W1·1 A4 (ZEDER, 206)
  const c4 = `RAPIZ JGBQD FGDIS AGLAI ZPZVZ LALZD FEZQP ZQGAS PZACS QAGRA
NBABB APTLR NZNGA PGLRA PLZDF SPZQS ASQGA ZLAGL APMZQ AAGLR
GAEUA PQSAD ISQGD FFGLS APRAL YAJSA LTLRV ZPSAS EGQRG AVZAD
FSAPQ DFJZB ALRMD FRAPH TLCAI TPGAP EAKAP ISGFL TLRQD FJZAC
SZJZP K`;
  const k4 = 'derkalifschickteinekarawanenachbasrasietraegtseidepfefferundpapierindernachtrastetsieaneineroaseeindiebverstecktsichhinterdenzeltenundwartetbisdiewaechterschlafendochderjungekurierbemerktihnundschlaegtalarm';
  assert.equal(K.substitution(c4, S('ZEDER'), 'ent'), GROSS(k4));
  assert.equal(K.substitution(k4, S('ZEDER')), GROSS(c4));
  // NOMEN-850 (Buchstabenteil, TUSCHE): liegt / schickt nach / reitet mit nach / L3-02 3947H OWTOQ HQ005 862DK 35 / flieht nach
  const T = S('TUSCHE');
  assert.equal(K.substitution('liegt', T), 'IDHAQ');
  assert.equal(K.substitution('PSBDSGQ', T, 'ent') + K.substitution('KTSB', T, 'ent'), 'SCHICKTNACH');
  assert.equal(K.substitution('OHDQHQ', T, 'ent'), 'REITET');
  assert.equal(K.substitution('JDQ', T, 'ent'), 'MIT');
  assert.equal(K.substitution('HOWTOQHQ', T, 'ent'), 'ERWARTET');
  assert.equal(K.substitution('DK', T, 'ent'), 'IN');
  assert.equal(K.substitution('EIDHBQKTSB', T, 'ent'), 'FLIEHTNACH');
});

test('substitution und umkehrAlphabet: Grenzfälle', () => {
  const kalif = K.schluesselwortAlphabet('KALIF');
  const inv = K.umkehrAlphabet(kalif);
  assert.equal(inv.length, 26);
  assert.equal(K.substitution(K.substitution('wesir', kalif), inv), 'WESIR');
  assert.equal(K.umkehrAlphabet(K.umkehrAlphabet(kalif)), kalif);
  assert.equal(K.umkehrAlphabet(K.ALPHABET), K.ALPHABET);
  assert.equal(K.substitution('', kalif), '');
  assert.equal(K.substitution('abc', kalif.toLowerCase()), 'KAL');
  assert.throws(() => K.substitution('abc', 'ABC'), K.KryptoFehler);
  assert.throws(() => K.substitution('abc', 'A'.repeat(26)), K.KryptoFehler);
  assert.throws(() => K.umkehrAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYY'), K.KryptoFehler);
});

test('ver∘ent = id (500 Zufallsfälle je Verfahren) – monoalphabetisch', () => {
  for (let i = 0; i < RUNDEN; i++) {
    const t = zufallsText();
    const n = K.nurBuchstaben(t);
    const k = ganz(-30, 60);
    assert.equal(K.caesar(K.caesar(t, k), k, 'ent'), n, `caesar ${JSON.stringify(t)} k=${k}`);
    assert.equal(K.caesar(K.caesar(n, k, 'ent'), k), n);
    assert.equal(K.atbash(K.atbash(t)), n);
    let a;
    do a = ganz(-30, 60); while (!K.affinSchluesselGueltig(a));
    const b = ganz(-5, 40);
    const basis = ganz(0, 1);
    assert.equal(K.affin(K.affin(t, a, b, 'ver', basis), a, b, 'ent', basis), n, `affin a=${a} b=${b} basis=${basis}`);
    const alpha = K.schluesselwortAlphabet(zufallsWort(0, 12), { rest: zufall() < 0.5 ? 'alphabetisch' : 'ab_letztem' });
    assert.equal(new Set(alpha).size, 26);
    assert.equal(K.substitution(K.substitution(t, alpha), alpha, 'ent'), n);
    assert.equal(K.substitution(K.substitution(t, alpha), K.umkehrAlphabet(alpha)), n);
  }
});

// ───────────────────────────── Task 11: Polyalphabetisch ─────────────────────────────

test('vigenere (Plan, Boss W2-B-02/06)', () => {
  assert.equal(K.vigenere('kanal', 'ROT'), 'BOGRZ');
  assert.equal(K.vigenere('HEDKZRMAGP', 'VELA', 'ent'), 'MASKENBALL');
});

test('vigenere: SPEC W2 §12 Prüfprotokoll', () => {
  // A = 1-Rechnungen: r/K → B, w/H → D, z/B → A, t/M → F, m/D → P, s/N → F
  for (const [p, s, c] of [['r', 'K', 'B'], ['w', 'H', 'D'], ['z', 'B', 'A'], ['t', 'M', 'F'], ['m', 'D', 'P'], ['s', 'N', 'F']]) {
    assert.equal(K.vigenere(p, s), c, `${p}/${s}`);
  }
  // Archivfund LAGUNE (64 Zeichen)
  const af = 'derratvonvenedigliestunserebriefebenutzeabjetztnurnochdasquadrat';
  const afC = 'OEXLN XGOTP RRPDO AYMPS ZOAWP RKVEM PFKVR RFTFY NFUEZ TGRFR TIPLO AYKHE ORGN';
  assert.equal(K.vigenere(af, 'LAGUNE'), GROSS(afC));
  assert.equal(K.vigenere(afC, 'LAGUNE', 'ent'), GROSS(af));
  // Merkkasten DAME
  assert.equal(K.vigenere('markusplatz', 'DAME'), GROSS('PADOX SBPDT L'));
  // Vigenère 2.1
  assert.equal(K.vigenere('anna', 'BBC'), 'BOPB');
  assert.equal(K.vigenere('gondel', 'BOTE'), 'HCGHFZ');
  assert.equal(K.vigenere('r', 'K') + K.vigenere('w', 'H') + K.vigenere('z', 'B'), 'BDA');
  assert.equal(K.vigenere('JSADV BZAER WL', 'ROSA', 'ent'), 'SEIDENHANDEL');
  assert.equal(K.vigenere('seidenhandel', 'ROSA'), GROSS('JSADV BZAER WL'));
  assert.equal(K.vigenere('kanalsperre', 'NEBEL'), GROSS('XEOEW FTFVC R'));
  assert.equal(K.vigenere('WYISX MRZWN VWHGD FFIIS XH', 'TURM', 'ent'), GROSS('dergesandtekommtmorgen'));
  assert.equal(K.vigenere('kanalwache', 'RIVA'), GROSS('BIIAC EVCYM'));
  assert.equal(K.vigenere('venedig', 'DDDD'), GROSS('YHQHG LJ'));
  assert.equal(K.vigenere('hafenwache', 'ABAB'), GROSS('HBFFN XADHF'));
  assert.equal(K.vigenere('hafenwache', 'AB'), GROSS('HBFFN XADHF'));
  // Known-Plaintext: hafenmauer ↔ AOWXB DTIVK, Schlüsselstrom TORTORTORT
  assert.equal(K.vigenere('AOWXB DTIVK', 'hafenmauer', 'ent'), 'TORTORTORT');
  assert.equal(K.vigenere('hafenmauer', 'TOR'), GROSS('AOWXB DTIVK'));
  // Akte W2·1 A4c: Vigenère statt Autokey – Fehler an Position 1 bleibt lokal
  assert.equal(K.vigenere('dogenpalast', 'MURANO'), 'PIXEADMFRSG');
  assert.equal(K.vigenere('PAXEADMFRSG', 'MURANO', 'ent'), 'DGGENPALAST');
  // Teiltext-Aufgabe: VCVIZ TSWLE UKXMY ↔ ruderbootamsteg (EIS); Akte W2·2 A2: die/CHS → FPW
  assert.equal(K.vigenere('VCVIZ TSWLE UKXMY', 'EIS', 'ent'), 'RUDERBOOTAMSTEG');
  assert.equal(K.vigenere('die', 'CHS'), 'FPW');
  // Mehrfach-Vigenère: AB dann CDE = CEEDDF
  assert.equal(K.vigenere('seidenstoffeundglasperlen', 'CEEDDF'), GROSS('UIMGH SUXSI IJWRH JOFUT IUOJP'));
  // Depeschen-Chiffre P-Falle: gewöhnliches Vigenère liefert XSXEYFSQBOFEC (nicht XSXEZ …)
  assert.equal(K.vigenere('gefahramkanal', 'ROSE'), 'XSXEYFSQBOFEC');
  // Warm-up: bote/LUNA → MIGE; ebbe/BBCC → FCDG
  assert.equal(K.vigenere('bote', 'LUNA'), 'MIGE');
  assert.equal(K.vigenere('ebbe', 'BBCC'), 'FCDG');
});

test('mehrfach-vigenere = vigenere mit Summenschlüssel', () => {
  assert.equal(K.vigenere(K.vigenere('seidenstoffeundglasperlen', 'AB'), 'CDE'), 'UIMGHSUXSIIJWRHJOFUTIUOJP');
});

test('vigenere: lange Texte W2 (Eves Brief WACHS 228, Lab-Text GOLD 162, L2.2-06)', () => {
  const E = `ZIGNS HEGYW WUUCW JEFPY ARTLA YHVKW JHCMW JAOHT ANFKW NGGZS
JDVLT NIPNL ZIGIJ EEHLV ARFPH HOOHL ENFPW XRKLX AEPAZ WLVLF
ZIGUS IEPKW NVGYT QEPKW PEPPF CEPBS HEUAV EEDYA AFGLJ OTUWS
ATKUV ARPHU DTWUV RETIJ ANPAV EEDYA AFGKS JAEOV EEIHD AETLK
AGGSL WMOVJ CEPDW ETGYF WCJNW JUC`;
  const klar = 'diegaleereausvenedigerreichtdenhafenamabenddergesandtebringtdiebriefederdiplomatindiebriefeenthaltendienamenderverbuendeteningenualestdiebriefeerstspaetindernachtundverbrenntdiebriefedanachdiegaleeresegeltammorgenweiternachgenua';
  assert.equal(K.nurBuchstaben(E).length, 228);
  assert.equal(K.vigenere(E, 'WACHS', 'ent'), GROSS(klar));
  assert.equal(K.vigenere(klar, 'WACHS'), GROSS(E));
  const e7 = 'JSCGU UPHSD QDKBR WJWPJ KGLQJ HPQGA DRTBE DMRTH MSDDT REHTP CLTUP QKRWH MSDFN SYNKO FVMSY XGRTH CONKK OXWUF OHYDL OGGEH YYPQT HOLKU PVGBO WKBYL IVEXT RWDKG DWJWP JKGLQ JHPQT ONKJS CPKGD HNSCH OB';
  assert.equal(K.nurBuchstaben(e7).length, 162);
  const d7 = K.vigenere(e7, 'GOLD', 'ent');
  assert.equal(d7.slice(0, 16), 'DERDOGEEMPFAENGT');
  assert.equal(K.vigenere(d7, 'GOLD'), GROSS(e7));
  const tt = 'WBXDN KBXKX PTKMX GTGWX KUKNX VDXGX UXGWX FYBLV AFTKD MTNYW XGTUX GW';
  assert.equal(K.caesar(tt, 19, 'ent'), GROSS('diekurierewartenanderbrueckenebendemfischmarktaufdenabend'));
  assert.equal(K.vigenere(tt, 'T', 'ent'), K.caesar(tt, 19, 'ent'));
});

test('vigenere: Video 03, W3 (FUNKGITTER, W3-L3-05), Warm-up W3', () => {
  assert.equal(K.vigenere('die', 'KRY'), 'NZC');
  assert.equal([...'KRYPTOS'].map((s) => K.vigenere('e', s)).join(''), 'OVCTXSW');
  assert.equal(K.vigenere('Wetterbericht fuer die Nordsee', 'FUNKE'), 'BYGDIWVRBMHBGPYJLQSISIENWJY');
  assert.equal(K.vigenere('morgenrot', 'LUNA'), 'XIEGPHEOE');
  assert.equal(K.caesar(K.vigenere('morgenrot', 'LUNA'), 5), 'CNJLUMJTJ');
  assert.equal(K.vigenere('morgenrot', 'QZSF'), 'CNJLUMJTJ');
  assert.equal(K.vigenere('n', 'F'), 'S');
});

test('grenzfaelle_vigenere', () => {
  assert.equal(K.vigenere('abc', 'A'), 'ABC');
  assert.equal(K.vigenere('abc', 'AAAA'), 'ABC');
  assert.equal(K.vigenere('', 'KEY'), '');
  assert.equal(K.vigenere('a b-c!', 'b'), 'BCD'); // nur über Buchstaben gezählt
  assert.equal(K.vigenere('aaa', 'Ä'), 'AEA'); // Schlüssel normalisiert: Ä → AE
  assert.throws(() => K.vigenere('abc', ''), K.KryptoFehler);
  assert.throws(() => K.vigenere('abc', '123'), K.KryptoFehler);
  assert.throws(() => K.vigenere('abc', 'KEY', 'zurueck'), K.KryptoFehler);
  assert.throws(() => K.vigenere('abc', null), K.KryptoFehler);
});

test('autokey (Plan, SPEC W2 §12)', () => {
  assert.equal(K.autokey('ALVEHRA', 'ZU', 'ent'), 'BRUNNEN');
  assert.equal(K.autokey('brunnen', 'ZU'), 'ALVEHRA');
  assert.equal(K.autokey('palazzo', 'RIO'), GROSS('GIZPZ KO'));
  assert.equal(K.autokey('dogenpalast', 'MURANO'), GROSS('PIXEA DDZGW G'));
  assert.equal(K.autokey('galeerenimhafen', 'ZUG'), GROSS('FURKE CIRZQ UIRLN'));
  // Fehlerfortpflanzung: Fehler an Position 1 → Fehler an Position 1 und 7
  assert.equal(K.autokey('PAXEADDZGWG', 'MURANO', 'ent'), 'DGGENPATAST');
  assert.equal(K.autokey('', 'ZU'), '');
  assert.equal(K.autokey('abc', 'AAAA'), 'ABC'); // Schlüssel länger als Text
  assert.throws(() => K.autokey('abc', ''), K.KryptoFehler);
});

test('porta (W2-Tafel)', () => {
  assert.equal(K.porta('BKPWEZP', 'SIEGEL'), 'STEMPEL');
  assert.equal(K.porta('nachtwache', 'LUNA'), 'FQWULGUPPU');
  assert.equal(K.porta('serenissima', 'PORTA'), 'MXMVAOMAZZT');
  assert.equal(K.porta('FQWULGUPPU', 'LUNA'), 'NACHTWACHE');
  assert.equal(K.porta('stempel', 'SIEGEL'), GROSS('BKPWE ZP'));
  // Akte W2·1 Abi b: a mit A → N, a mit C → Z; W2-L21-07: Schlüssel A und B gleichwertig
  assert.equal(K.porta('a', 'A'), 'N');
  assert.equal(K.porta('a', 'C'), 'Z');
  assert.equal(K.porta('hafen', 'A'), K.porta('hafen', 'B'));
  // optionale Richtung wird angenommen (involutorisch)
  assert.equal(K.porta('FQWULGUPPU', 'LUNA', 'ent'), 'NACHTWACHE');
  assert.throws(() => K.porta('abc', 'KEY', 'quer'), K.KryptoFehler);
  assert.throws(() => K.porta('abc', ''), K.KryptoFehler);
  assert.equal(K.porta('', 'LUNA'), '');
});

test('porta: involutorisch und ohne Fixpunkte (alle 26 × 26)', () => {
  for (const s of K.ALPHABET) {
    for (const p of K.ALPHABET) {
      const c = K.porta(p, s);
      assert.notEqual(c, p, `${p}/${s}`);
      assert.equal(K.porta(c, s), p);
    }
  }
});

// ───────────────────────────── Quadrate, Bigramme ─────────────────────────────

test('quadrat 5×5 und 6×6 (SPEC W0, W2, W3)', () => {
  assert.deepEqual(K.quadrat('RIALTO'), ['RIALT', 'OBCDE', 'FGHKM', 'NPQSU', 'VWXYZ']);
  assert.deepEqual(K.quadrat('GONDEL'), ['GONDE', 'LABCF', 'HIKMP', 'QRSTU', 'VWXYZ']);
  assert.deepEqual(K.quadrat('MURANO'), ['MURAN', 'OBCDE', 'FGHIK', 'LPQST', 'VWXYZ']);
  assert.deepEqual(K.quadrat('BRIEFTAUBE'), ['BRIEF', 'TAUCD', 'GHKLM', 'NOPQS', 'VWXYZ']);
  assert.deepEqual(K.quadrat('KOMPASS'), ['KOMPA', 'SBCDE', 'FGHIL', 'NQRTU', 'VWXYZ']);
  assert.deepEqual(K.quadrat('ATHEN'), ['ATHEN', 'BCDFG', 'IKLMO', 'PQRSU', 'VWXYZ']);
  assert.deepEqual(K.quadrat('KORINTH'), ['KORIN', 'THABC', 'DEFGL', 'MPQSU', 'VWXYZ']);
  assert.deepEqual(K.quadrat('FERNSCHREIBER'), ['FERNS', 'CHIBA', 'DGKLM', 'OPQTU', 'VWXYZ']);
  assert.deepEqual(K.quadrat(), ['ABCDE', 'FGHIK', 'LMNOP', 'QRSTU', 'VWXYZ']);
  assert.deepEqual(K.quadrat('ZEPPELIN18', { groesse: 6 }), ['ZEPLIN', '18ABCD', 'FGHJKM', 'OQRSTU', 'VWXY02', '345679']);
  assert.deepEqual(K.quadrat('FERNSPRECHER9', { groesse: 6 }), ['FERNSP', 'CH9ABD', 'GIJKLM', 'OQTUVW', 'XYZ012', '345678']);
  assert.deepEqual(K.quadrat('JOJO'), ['IOABC', 'DEFGH', 'KLMNP', 'QRSTU', 'VWXYZ']); // J → I
  assert.deepEqual(K.quadrat('', { ij: 'J' }), ['ABCDE', 'FGHJK', 'LMNOP', 'QRSTU', 'VWXYZ']);
  assert.throws(() => K.quadrat('ABC', { groesse: 4 }), K.KryptoFehler);
  assert.throws(() => K.quadrat('ABC', { ij: 'K' }), K.KryptoFehler);
});

test('playfairPaare ballett', () => assert.deepEqual(K.playfairPaare('ballett'), ['BA', 'LX', 'LE', 'TX', 'TX']));

test('playfairPaare: SPEC W2 (Akte W2·4 A2, Warm-up, ballon) und Grenzfälle', () => {
  assert.equal(K.playfairPaare('dasschiffsegeltmorgen').join(' '), 'DA SX SC HI FX FS EG EL TM OR GE NX');
  assert.equal(K.playfairPaare('kaffee').join(' '), 'KA FX FE EX');
  assert.equal(K.playfairPaare('ballon').join(' '), 'BA LX LO NX');
  assert.equal(K.playfairPaare('wasserweg').join(' '), 'WA SX SE RW EG');
  assert.equal(K.playfairPaare('jagd').join(' '), 'IA GD');
  assert.deepEqual(K.playfairPaare(''), []);
  assert.deepEqual(K.playfairPaare('a'), ['AX']);
  assert.deepEqual(K.playfairPaare('xx'), ['XQ', 'XQ']); // „XX“-Paar → XQ, auch beim Auffüllen
  assert.deepEqual(K.playfairPaare('abx'), ['AB', 'XQ']); // ungerade Länge, letzter Buchstabe X
  assert.deepEqual(K.playfairPaare('aaa'), ['AX', 'AX', 'AX']);
  assert.deepEqual(K.playfairPaare('aab', { fuellzeichen: 'Q', fuellzeichenX: 'Z' }), ['AQ', 'AB']);
  assert.throws(() => K.playfairPaare('abc', { fuellzeichen: 'XY' }), K.KryptoFehler);
  assert.throws(() => K.playfairPaare('abc', { fuellzeichen: 'X', fuellzeichenX: 'X' }), K.KryptoFehler);
  assert.throws(() => K.playfairPaare('abc', { fuellzeichen: 'J' }), K.KryptoFehler);
});

test('playfair RIALTO', () => {
  const q = 'RIALTOBCDEFGHKMNPQSUVWXYZ';
  assert.equal(K.playfair('HU', 'RIALTO'), 'MQ');
  assert.equal(K.playfair('WI', 'RIALTO'), 'IB');
  assert.equal(K.playfair('HU', q), 'MQ'); // fertiges Quadrat als Schlüssel ergibt dasselbe
});

test('playfair: SPEC W2 §12 Prüfprotokoll', () => {
  assert.deepEqual(['OD', 'BG', 'RS'].map((p) => K.playfair(p, 'RIALTO')), ['BE', 'GP', 'LN']);
  assert.equal(K.playfair('wasserweg', 'RIALTO'), GROSS('XIQYU DIVBM'));
  assert.equal(K.playfair('dasschiffsegeltmorgen', 'RIALTO'), GROSS('CLQYQ DGAHV KNBMD TEUFO MBQV'));
  assert.equal(K.playfair('HLIRO UUQTB AY', 'RIALTO', 'ent'), 'KARTENSPIELX'); // ent entfernt keine Füllzeichen
  assert.equal(K.playfair('GAURO TEOFH RDDHO UEZTF', 'RIALTO', 'ent'), GROSS('hinterdemglockenturm'));
  assert.equal(K.playfair('jagd', 'RIALTO'), 'ALKB');
  // AB → XY ⇒ BA → YX; kein Doppel im Geheimtextpaar; kein Fixbuchstabe
  const L = K.quadrat('RIALTO').join('');
  for (const a of L) {
    for (const b of L) {
      if (a === b) continue;
      const c = K.playfair(a + b, 'RIALTO');
      assert.equal(K.playfair(b + a, 'RIALTO'), c[1] + c[0]);
      assert.notEqual(c[0], c[1]);
      assert.ok(c[0] !== a && c[1] !== b);
    }
  }
});

test('grenzfaelle_playfair', () => {
  assert.equal(K.playfair('', 'RIALTO'), '');
  assert.equal(K.playfair('xx', 'RIALTO').length, 4);
  assert.equal(K.playfair(K.playfair('xx', 'RIALTO'), 'RIALTO', 'ent'), 'XQXQ');
  assert.equal(K.playfair(K.playfair('abc', 'RIALTO'), 'RIALTO', 'ent'), 'ABCX');
  assert.throws(() => K.playfair('ABC', 'RIALTO', 'ent'), K.KryptoFehler); // ungerade Länge
  assert.throws(() => K.playfair('AABB', 'RIALTO', 'ent'), K.KryptoFehler); // Doppel kann kein Geheimtext sein
  assert.throws(() => K.playfair('ab', 'RIALTO', 'seitwaerts'), K.KryptoFehler);
});

test('kreuzquadrat GONDEL/MURANO', () => {
  assert.equal(K.kreuzquadrat('mehl', 'GONDEL', 'MURANO'), 'KCFQ');
  assert.equal(K.kreuzquadrat('seidenballen', 'GONDEL', 'MURANO'), 'TBIANEDNOQNE');
  assert.equal(K.kreuzquadrat('fa', 'GONDEL', 'MURANO'), 'DE');
  assert.equal(K.kreuzquadrat('FBNSROBNCM', 'GONDEL', 'MURANO', 'ent'), 'KONTORBUCH');
});

test('kreuzquadrat: SPEC W2 §12, Level 2.4, Akte W2·4', () => {
  assert.equal(K.kreuzquadrat('kommandant', 'GONDEL', 'MURANO'), GROSS('FBFDE OADNS'));
  assert.equal(K.kreuzquadrat('kontorbuch', 'GONDEL', 'MURANO'), GROSS('FBNSR OBNCM'));
  assert.equal(K.kreuzquadrat('TBIAN EDNOQ NE', 'GONDEL', 'MURANO', 'ent'), GROSS('seidenballen'));
  // O = U (GONDEL): EE → EE, GO → OG, GL → GL
  assert.deepEqual(['EE', 'GO', 'GL'].map((p) => K.kreuzquadrat(p, 'GONDEL', 'GONDEL')), ['EE', 'OG', 'GL']);
  // 18 von 625 Paaren bleiben unverändert
  const L = K.quadrat('GONDEL').join('');
  let fix = 0;
  for (const a of L) for (const b of L) if (K.kreuzquadrat(a + b, 'GONDEL', 'MURANO') === a + b) fix++;
  assert.equal(fix, 18);
});

test('grenzfaelle_kreuzquadrat', () => {
  assert.equal(K.kreuzquadrat('', 'GONDEL', 'MURANO'), '');
  assert.equal(K.kreuzquadrat('m', 'GONDEL', 'MURANO'), K.kreuzquadrat('mx', 'GONDEL', 'MURANO'));
  assert.equal(K.kreuzquadrat('m', 'GONDEL', 'MURANO', 'ver', { fuellzeichen: 'Q' }), K.kreuzquadrat('mq', 'GONDEL', 'MURANO'));
  assert.equal(K.kreuzquadrat('ja', 'GONDEL', 'MURANO'), K.kreuzquadrat('ia', 'GONDEL', 'MURANO'));
  assert.throws(() => K.kreuzquadrat('ABC', 'GONDEL', 'MURANO', 'ent'), K.KryptoFehler);
  assert.throws(() => K.kreuzquadrat('ab', 'GONDEL', 'MURANO', 'ver', { fuellzeichen: '1' }), K.KryptoFehler);
});

test('zweiQuadratZahl (Papier-Boss W2)', () => {
  assert.equal(K.zweiQuadratZahl('h', 'BRIEFTAUBE', 'KOMPASS', '3142'), 'O');
  assert.equal(K.zweiQuadratZahl('anna', 'BRIEFTAUBE', 'KOMPASS', '2222'), 'QKKQ');
  assert.equal(K.zweiQuadratZahl('rat', 'BRIEFTAUBE', 'KOMPASS', '3142'), 'QGK');
  assert.equal(K.zweiQuadratZahl('QGK', 'BRIEFTAUBE', 'KOMPASS', '3142', 'ent'), 'RAT');
});

test('zweiQuadratZahl: SPEC W2 §6, §12', () => {
  const zq = (t, s, r = 'ver') => K.zweiQuadratZahl(t, 'BRIEFTAUBE', 'KOMPASS', s, r);
  assert.equal(zq('nachtwache', '3142'), GROSS('SGPWV OOTOD'));
  assert.equal(zq('WVCIQ XDQVA', '3142', 'ent'), 'ANKERPLATZ');
  assert.equal(zq('ankerplatz', '3142'), 'WVCIQXDQVA');
  // Gegenbeispiel doppelt: rat → QGK → DNC
  assert.equal(zq(zq('rat', '3142'), '3142'), 'DNC');
  // Q1 = Q2: 3142 dann 1203 = 4340
  const zz = (t, s) => K.zweiQuadratZahl(t, 'BRIEFTAUBE', 'BRIEFTAUBE', s);
  assert.equal(zz(zz('abcdefghik', '3142'), '1203'), zz('abcdefghik', '4340'));
  // Fixpunkte bei k = 0: N, V, W, X, Y, Z
  const L = K.quadrat('BRIEFTAUBE').join('');
  assert.equal([...L].filter((c) => zq(c, '0') === c).join(''), 'NVWXYZ');
  // silberflotte: Fehlerfortpflanzung (ein Geheimtextbuchstabe fehlt → ab dort falsch)
  const g = zq('silberflotte', '3142');
  assert.equal(zq(g.slice(0, 3) + g.slice(4), '3142', 'ent'), 'SILCOSEWVVQ');
  // kein einzelner Zahlenschlüssel ersetzt die doppelte Verschlüsselung mit 3142 (Brute Force über 625)
  let ersatz = 0;
  for (let n = 0; n < 625; n++) {
    const s = [n % 5, Math.floor(n / 5) % 5, Math.floor(n / 25) % 5, Math.floor(n / 125)].join('');
    if ([...L].every((c) => zq(c.repeat(4), s) === zq(zq(c.repeat(4), '3142'), '3142'))) ersatz++;
  }
  assert.equal(ersatz, 0);
});

test('grenzfaelle_zweiQuadratZahl', () => {
  const zq = (t, s, r) => K.zweiQuadratZahl(t, 'BRIEFTAUBE', 'KOMPASS', s, r);
  assert.equal(zq('', '3142'), '');
  assert.equal(zq('anna', [2, 2, 2, 2]), 'QKKQ'); // Liste von Ziffern
  assert.equal(zq('jagd', '0'), zq('iagd', '0'));
  assert.throws(() => zq('abc', '35'), K.KryptoFehler); // Ziffer 5 nicht erlaubt
  assert.throws(() => zq('abc', ''), K.KryptoFehler);
  assert.throws(() => zq('abc', '3a'), K.KryptoFehler);
  assert.throws(() => zq('abc', [1, 7]), K.KryptoFehler);
});

test('polybios: SPEC W0 §12 (Standard, KORINTH, Fackelchiffre ATHEN)', () => {
  assert.equal(K.polybios('rom'), '423432');
  assert.equal(K.polybios('troia'), '4442342411');
  assert.equal(K.polybios('legion'), ohne('31 15 22 24 34 33'));
  assert.equal(K.polybios('olympia'), ohne('34 31 54 32 35 24 11'));
  assert.equal(K.polybios('forum'), ohne('21 34 42 45 32'));
  assert.equal(K.polybios('33 15 43 44 34 42', {}, 'ent'), 'NESTOR');
  assert.equal(K.polybios('21 34 42 45 32', {}, 'ent'), 'FORUM');
  assert.equal(K.polybios('sieg', { schluessel: 'KORINTH' }), ohne('44 14 32 34'));
  // Fackelchiffre: Atbash, dann Polybios mit Quadrat ATHEN (KORINTH)
  const fackel = (t, s) => K.polybios(K.atbash(t), { schluessel: s });
  assert.equal(fackel('feuer', 'ATHEN'), ohne('45 51 24 51 31'));
  assert.equal(fackel('hilfe', 'ATHEN'), ohne('44 43 35 45 51'));
  assert.equal(fackel('quelle', 'ATHEN'), ohne('31 24 51 35 35 51'));
  assert.equal(fackel('rauch', 'ATHEN'), ohne('31 55 24 53 44'));
  assert.equal(fackel('perser', 'KORINTH'), ohne('11 51 14 22 51 14'));
  assert.equal(K.atbash(K.polybios('13 43 12 34 55 35', { schluessel: 'ATHEN' }, 'ent')), 'SIGNAL');
  // W0-L4-07: q und r ergeben beide 31 (Atbash q → J = I)
  assert.equal(fackel('q', 'ATHEN'), '31');
  assert.equal(fackel('r', 'ATHEN'), '31');
});

test('polybios: Kopf ADFGX/ADFGVX (SPEC W3 §12)', () => {
  assert.equal(K.polybios('wolke', { schluessel: 'FERNSCHREIBER', kopf: 'ADFGX' }), 'XDGAFGFFAD');
  assert.equal(K.polybios('post', { schluessel: 'ZEPPELIN18', kopf: 'ADFGVX' }), 'AFGAGGGV');
  assert.equal(K.polybios('AAGXFD', { schluessel: 'ZEPPELIN18', kopf: 'ADFGVX' }, 'ent'), 'ZUG');
  assert.equal(K.polybios('nebel4', { schluessel: 'ZEPPELIN18', kopf: 'ADFGVX' }), 'AXADDGADAGXD');
  assert.equal(K.polybios('ankunft8', { schluessel: 'ZEPPELIN18', kopf: 'ADFGVX' }), 'DFAXFVGXAXFAGVDD');
  assert.equal(K.polybios('tor', { schluessel: 'FERNSPRECHER9', kopf: 'ADFGVX' }), 'GFGAAF');
});

test('grenzfaelle_polybios', () => {
  assert.equal(K.polybios(''), '');
  assert.equal(K.polybios('j'), K.polybios('i'));
  assert.equal(K.polybios('Café – 12'), K.polybios('cafe')); // 5×5: Ziffern fallen weg
  assert.throws(() => K.polybios('123', {}, 'ent'), K.KryptoFehler); // ungerade Länge
  assert.throws(() => K.polybios('16', {}, 'ent'), K.KryptoFehler); // 6 nicht im Kopf
  assert.throws(() => K.polybios('ab', { kopf: '1234' }), K.KryptoFehler);
  assert.throws(() => K.polybios('ab', { kopf: '11234' }), K.KryptoFehler);
  assert.throws(() => K.polybios('ab', {}, 'quer'), K.KryptoFehler);
});

test('adfgvx: SPEC W3 §12 (Level 3.4, Akte W3·4)', () => {
  assert.equal(K.adfgvx('nebel4', 'ZEPPELIN18', 'KARL'), 'XGGADADDDAAX');
  assert.equal(K.adfgvx('DGDVA AAVFG FX', 'ZEPPELIN18', 'BAUM', 'ent'), 'WOLKE5');
  assert.equal(K.adfgvx('XFDGA DXFGA XGFA', 'ZEPPELIN18', 'HAND', 'ent'), 'MORGEN6');
  assert.equal(K.adfgvx('ankunft8', 'ZEPPELIN18', 'WOLF'), GROSS('XXADA GFDFV XVDFA G'));
  assert.equal(K.adfgvx('funk2', 'ZEPPELIN18', 'TOR'), 'AAVGXVFXFX');
  assert.equal(K.adfgvx('GADGF DDGVF VGGDF AADXA', 'ZEPPELIN18', 'TOR', 'ent'), 'BRIEFTAUBE');
  // fertiges 36-Zeichen-Quadrat und Zeilenliste wirken wie das Schlüsselwort
  const q36 = 'ZEPLIN18ABCDFGHJKMOQRSTUVWXY02345679';
  assert.equal(K.adfgvx('nebel4', q36, 'KARL'), 'XGGADADDDAAX');
  assert.equal(K.adfgvx('nebel4', K.quadrat('ZEPPELIN18', { groesse: 6 }), 'KARL'), 'XGGADADDDAAX');
});

test('grenzfaelle_adfgvx', () => {
  assert.equal(K.adfgvx('', 'ZEPPELIN18', 'KARL'), '');
  assert.equal(K.adfgvx('a', 'ZEPPELIN18', 'KARLSRUHE'), 'FD'); // Schlüssel länger als Text: Spalte A (Rang 1) zuerst
  assert.equal(K.adfgvx('FD', 'ZEPPELIN18', 'KARLSRUHE', 'ent'), 'A');
  // gleiche Buchstaben: links zuerst (AAAA = Reihenfolge 1 2 3 4, ANNA = 1 3 4 2); Zahlenfolge wird übernommen
  assert.equal(K.adfgvx('nebel4', 'ZEPPELIN18', 'AAAA'), 'ADAXGGAAXDDD');
  assert.equal(K.adfgvx('nebel4', 'ZEPPELIN18', [1, 2, 3, 4]), 'ADAXGGAAXDDD');
  assert.equal(K.adfgvx('nebel4', 'ZEPPELIN18', 'ANNA'), K.adfgvx('nebel4', 'ZEPPELIN18', [1, 3, 4, 2]));
  assert.equal(K.adfgvx('nebel4', 'ZEPPELIN18', 'KARL'), K.adfgvx('nebel4', 'ZEPPELIN18', [2, 1, 4, 3]));
  assert.throws(() => K.adfgvx('abc', 'ZEPPELIN18', [1, 1, 2]), K.KryptoFehler);
  assert.throws(() => K.adfgvx('abc', 'ZEPPELIN18', ''), K.KryptoFehler);
  assert.throws(() => K.adfgvx('ADF', 'ZEPPELIN18', 'KARL', 'ent'), K.KryptoFehler);
  assert.throws(() => K.adfgvx('ADFB', 'ZEPPELIN18', 'KARL', 'ent'), K.KryptoFehler);
});

test('kein zweiQuadrat (Namenskollision, Verifikation H2)', () => {
  assert.equal(K.zweiQuadrat, undefined);
});

test('ver∘ent = id (500 Zufallsfälle je Verfahren) – polyalphabetisch und Bigramme', () => {
  const ohneJ = (s) => s.replace(/J/g, 'I');
  for (let i = 0; i < RUNDEN; i++) {
    const t = zufallsText();
    const n = K.nurBuchstaben(t);
    const s = zufallsWort(1, 8);
    assert.equal(K.vigenere(K.vigenere(t, s), s, 'ent'), n, `vigenere ${JSON.stringify(t)} ${s}`);
    assert.equal(K.vigenere(K.vigenere(n, s, 'ent'), s), n);
    assert.equal(K.autokey(K.autokey(t, s), s, 'ent'), n, `autokey ${JSON.stringify(t)} ${s}`);
    assert.equal(K.autokey(K.autokey(n, s, 'ent'), s), n);
    assert.equal(K.porta(K.porta(t, s), s), n, `porta ${JSON.stringify(t)} ${s}`);
    // Playfair: ent liefert die vorbereiteten Paare (Füllzeichen bleiben stehen)
    const w1 = zufallsWort(0, 10);
    const w2 = zufallsWort(0, 10);
    assert.equal(K.playfair(K.playfair(t, w1), w1, 'ent'), K.playfairPaare(t).join(''), `playfair ${JSON.stringify(t)} ${w1}`);
    // Kreuzquadrat: ent liefert den Text mit I = J und angehängtem X bei ungerader Länge
    const kq = ohneJ(n) + (n.length % 2 ? 'X' : '');
    assert.equal(K.kreuzquadrat(K.kreuzquadrat(t, w1, w2), w1, w2, 'ent'), kq, `kreuzquadrat ${JSON.stringify(t)} ${w1}/${w2}`);
    const zs = Array.from({ length: ganz(1, 6) }, () => ganz(0, 4)).join('');
    assert.equal(K.zweiQuadratZahl(K.zweiQuadratZahl(t, w1, w2, zs), w1, w2, zs, 'ent'), ohneJ(n), `zweiQuadratZahl ${zs}`);
    assert.equal(K.polybios(K.polybios(t, { schluessel: w1 }), { schluessel: w1 }, 'ent'), ohneJ(n));
    const t6 = zufallsText(40, 'abcxyzäöü0123456789 ,.');
    const n6 = K.normalisieren(t6);
    const opt6 = { schluessel: w1 + '1', kopf: 'ADFGVX' };
    assert.equal(K.polybios(K.polybios(t6, opt6), opt6, 'ent'), n6);
    const sp = zufallsWort(1, 9);
    assert.equal(K.adfgvx(K.adfgvx(t6, w2 + '9', sp), w2 + '9', sp, 'ent'), n6, `adfgvx ${JSON.stringify(t6)} ${sp}`);
  }
});
