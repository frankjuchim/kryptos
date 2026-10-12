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

// ───────────────────────────── Task 12: Transpositionen ─────────────────────────────

test('skytale: Pflicht-Vektor W0-L1-03 mit Standard-Füllzeichen X', () => {
  assert.equal(K.skytale('wir halten den pass', 3), 'WTPIEARNSHDSAEXLNX');
});

test('skytale: SPEC W0 §12 Prüfprotokoll', () => {
  // Archivfund u = 4
  assert.equal(K.skytale('DTTMI EBOEL ENFAI DLENA OUEUT FUS', 4, 'ent'), GROSS('dieflottelaeuftbeineumondaus'));
  assert.equal(K.skytale('dieflottelaeuftbeineumondaus', 4), GROSS('DTTMI EBOEL ENFAI DLENA OUEUT FUS'));
  // Akte W0·1: AW (u = 4) / A2 (u = 3) / A3 (u = 5) / Abi-Check (u = 3)
  assert.equal(K.skytale('das heer wartet am fluss', 4), GROSS('DETFA RELSW TUHAA SERMS'));
  assert.equal(K.skytale('schickt mehr bogenschuetzen', 3), GROSS('SHHCR UHBEI OTCGZ KEETN NMSXE CX'));
  assert.equal(K.skytale('DSDMI ESEPS RBNET PETLZ AIENU', 5, 'ent'), GROSS('derpassbeidentempelnistzu'));
  assert.equal(K.skytale('lysander kehrt heim', 3), GROSS('LETYR HSKEA EINHM DRX'));
  // Lab 04 (Füllzeichen bleiben beim Entschlüsseln stehen), Boss 04, Warm-up 03 (u = 2), W1-Warm-up (oasen, u = 2)
  assert.equal(K.skytale('NUMRA BOUCK REHOG HSMEX CMNXH TFX', 4, 'ent'), GROSS('nachschubkommtmorgenfruehxxx'));
  assert.equal(K.skytale('FRAEI GUMEE LR', 3, 'ent'), GROSS('feuerimlager'));
  assert.equal(K.skytale('eilbote', 2), GROSS('EOITL EBX'));
  assert.equal(K.skytale('oasen', 2), GROSS('OEANS X'));
  // „Gleichwertig: Skytale mit Umfang s anwenden“ (W0 §0)
  assert.equal(K.skytale('DTTMIEBOELENFAIDLENAOUEUTFUS', 7), K.skytale('DTTMIEBOELENFAIDLENAOUEUTFUS', 4, 'ent'));
});

test('grenzfaelle_skytale', () => {
  assert.equal(K.skytale('', 3), '');
  assert.equal(K.skytale('', 3, 'ent'), '');
  assert.equal(K.skytale('abc', 5), 'ABCXX'); // Umfang > Textlänge: eine Spalte
  assert.equal(K.skytale('ABCXX', 5, 'ent'), 'ABCXX');
  assert.equal(K.skytale('abcdefg', 3, 'ver', { fuellzeichen: 'Q' }), 'ADGBEQCFQ');
  // ohne Füllzeichen: leere Zellen werden übersprungen, ent rekonstruiert das Raster
  assert.equal(K.skytale('wir halten den pass', 3, 'ver', { fuellzeichen: null }), 'WTPIEARNSHDSAELN');
  assert.equal(K.skytale('WTPIEARNSHDSAELN', 3, 'ent', { fuellzeichen: null }), GROSS('wirhaltendenpass'));
  assert.equal(K.skytale('abcde', 4, 'ver', { fuellzeichen: null }), 'ACEBD'); // ganze leere Zeile
  assert.equal(K.skytale('ACEBD', 4, 'ent', { fuellzeichen: null }), 'ABCDE');
  assert.throws(() => K.skytale('ABCDE', 3, 'ent'), K.KryptoFehler); // mit Füllzeichen: Länge Vielfaches von u
  assert.throws(() => K.skytale('abc', 1), K.KryptoFehler);
  assert.throws(() => K.skytale('abc', 2.5), K.KryptoFehler);
  assert.throws(() => K.skytale('abc', 3, 'ver', { fuellzeichen: '1' }), K.KryptoFehler);
});

test('gartenzaun: SPEC W0 §12, W3 Akte W3·3', () => {
  assert.equal(K.gartenzaun('versorgung kommt spaet', 3), GROSS('VONMP ESRUG OMSAT RGKTE'));
  assert.equal(K.gartenzaun('pferde stehen bereit', 3), GROSS('PDEBI FRETH NEETE SER'));
  assert.equal(K.gartenzaun('SSFDP ASFED AATCI SNRHI', 4, 'ent'), GROSS('spartasschiffesindda'));
  assert.equal(K.gartenzaun('die mauer haelt stand', 3), GROSS('DAHTN IMURA LSADE EET'));
  assert.equal(K.gartenzaun('BTNID NEWGO ESNUT RES', 2, 'ent'), GROSS('botensindunterwegs'));
  assert.equal(K.gartenzaun('HEMBE IFKMT EESEL OUR', 3, 'ent'), GROSS('hilfekommtuebersee'));
  assert.equal(K.gartenzaun('seeschlacht', 2), GROSS('SECLC TESHA H'));
  // W3 Akte W3·3 A5: Caesar (k = 7) nach Gartenzaun (h = 3)
  const zw = K.caesar('DLBVU HPZOU UTYLH OMUYL ZNTL', 7, 'ent');
  assert.equal(zw, 'WEUONAISHNNMREAHFNRESGME');
  assert.equal(K.gartenzaun(zw, 3, 'ent'), GROSS('wirsehenunsmorgenamhafen'));
});

test('grenzfaelle_gartenzaun', () => {
  assert.equal(K.gartenzaun('', 3), '');
  assert.equal(K.gartenzaun('abc', 5), 'ABC'); // mehr Schienen als Buchstaben
  assert.equal(K.gartenzaun('ABC', 5, 'ent'), 'ABC');
  assert.equal(K.gartenzaun('abcdef', 6), 'ABCDEF');
  assert.throws(() => K.gartenzaun('abc', 1), K.KryptoFehler);
  assert.throws(() => K.gartenzaun('abc', 3, 'quer'), K.KryptoFehler);
});

test('fleissner: SPEC W0 §12 (Drehung im Uhrzeigersinn, Löcher zeilenweise)', () => {
  const s1 = [[1, 3], [2, 2], [3, 1], [4, 4]];
  const s2 = [[1, 2], [2, 1], [2, 3], [4, 4]];
  assert.equal(K.fleissner('athen sendet hilfe', 4, s1), GROSS('DNAIL TSEHF TENHE E'));
  assert.equal(K.fleissner('DNAILTSEHFTENHEE', 4, s1, 'ent'), GROSS('athensendethilfe'));
  assert.equal(K.fleissner('boten warten am tor', 4, s2), GROSS('TBNMO TTWOE ANRRA E'));
  assert.equal(K.fleissner('rueckzug zum hafen', 4, s2), GROSS('ZRKAU FEZEU UMGNH C'));
  assert.equal(K.fleissner('ZRKAUFEZEUUMGNHC', 4, s2, 'ent'), GROSS('rueckzugzumhafen'));
});

test('fleissner: Blöcke, Füllzeichen, Drehrichtung, Grenzfälle', () => {
  const s1 = [[1, 3], [2, 2], [3, 1], [4, 4]];
  assert.equal(K.fleissner('', 4, s1), '');
  assert.equal(K.fleissner('a', 4, s1).length, 16);
  assert.equal(K.fleissner(K.fleissner('a', 4, s1), 4, s1, 'ent'), 'A' + 'X'.repeat(15));
  const lang = 'athensendethilfeboten';
  const g = K.fleissner(lang, 4, s1);
  assert.equal(g.length, 32);
  assert.equal(g.slice(0, 16), 'DNAILTSEHFTENHEE');
  assert.equal(K.fleissner(g, 4, s1, 'ent'), GROSS(lang) + 'X'.repeat(11));
  // gegen den Uhrzeigersinn: Stellung 2 entsteht aus (z, s) → (5 − s, z)
  const links = K.fleissner('athensendethilfe', 4, s1, 'ver', { drehung: 'links' });
  assert.notEqual(links, 'DNAILTSEHFTENHEE');
  assert.equal(K.fleissner(links, 4, s1, 'ent', { drehung: 'links' }), GROSS('athensendethilfe'));
  assert.throws(() => K.fleissner('abc', 4, [[1, 1], [1, 4], [2, 2], [3, 3]]), K.KryptoFehler); // ungültige Schablone
  assert.throws(() => K.fleissner('abc', 4, s1, 'ver', { drehung: 'oben' }), K.KryptoFehler);
  assert.throws(() => K.fleissner('ABC', 4, s1, 'ent'), K.KryptoFehler); // Länge kein Vielfaches von 16
  assert.throws(() => K.fleissner('abc', 5, s1), K.KryptoFehler);
  // 6 × 6: Schablone aus je einem Feld jeder Drehgruppe
  const s6 = [[1, 1], [1, 2], [1, 3], [1, 4], [1, 5], [2, 2], [2, 3], [2, 4], [3, 3]];
  assert.equal(K.schablonePruefen(6, s6).ok, true);
  const t6 = 'diezweiteschablonehatsechsmalsechsfelder';
  assert.equal(K.fleissner(K.fleissner(t6, 6, s6), 6, s6, 'ent'), GROSS(t6) + 'X'.repeat(72 - 40));
});

test('schablonePruefen: SPEC W0 Akte W0·1 A7 (256 von 1820 Lochmengen; ungültig: 8 von 16 Feldern)', () => {
  const r = K.schablonePruefen(4, [[1, 1], [1, 4], [2, 2], [3, 3]]);
  assert.equal(r.ok, false);
  assert.equal(r.abgedeckt, 8);
  assert.ok(r.fehler.length > 0);
  assert.deepEqual(K.schablonePruefen(4, [[1, 3], [2, 2], [3, 1], [4, 4]]), { ok: true, fehler: [], abgedeckt: 16 });
  let gueltig = 0;
  let alle = 0;
  const felder = [];
  for (let z = 1; z <= 4; z++) for (let s = 1; s <= 4; s++) felder.push([z, s]);
  for (let a = 0; a < 16; a++) for (let b = a + 1; b < 16; b++) for (let c = b + 1; c < 16; c++) for (let d = c + 1; d < 16; d++) {
    alle++;
    if (K.schablonePruefen(4, [felder[a], felder[b], felder[c], felder[d]]).ok) gueltig++;
  }
  assert.equal(alle, 1820);
  assert.equal(gueltig, 256);
  assert.equal(K.schablonePruefen(4, [[1, 1], [1, 2], [1, 3]]).ok, false); // zu wenige Löcher
  assert.equal(K.schablonePruefen(4, [[0, 1], [1, 2], [1, 3], [2, 2]]).ok, false); // außerhalb
  assert.equal(K.schablonePruefen(5, []).ok, false); // ungerade Größe
});

test('spaltenReihenfolge', () => {
  assert.deepEqual(K.spaltenReihenfolge('ANNA'), [1, 3, 4, 2]);
  assert.deepEqual(K.spaltenReihenfolge('KARL'), [2, 1, 4, 3]);
  assert.deepEqual(K.spaltenReihenfolge('TAL'), [3, 1, 2]);
  assert.deepEqual(K.spaltenReihenfolge('funke'), [2, 5, 4, 3, 1]);
  assert.deepEqual(K.spaltenReihenfolge('AAAA'), [1, 2, 3, 4]);
  assert.deepEqual(K.spaltenReihenfolge([3, 1, 2]), [3, 1, 2]); // Zahlenliste wird übernommen
  assert.throws(() => K.spaltenReihenfolge(''), K.KryptoFehler);
  assert.throws(() => K.spaltenReihenfolge([1, 1, 2]), K.KryptoFehler);
  assert.throws(() => K.spaltenReihenfolge([0, 1]), K.KryptoFehler);
});

test('spaltentransposition: SPEC W3 (Baukasten FUNKGITTER, W3-L3-06)', () => {
  const s1 = K.vigenere('Wetterbericht fuer die Nordsee', 'FUNKE');
  assert.equal(K.spaltentransposition(s1, 'FUNKE'), GROSS('IMYIW BWHJS JDBPS NGRGQ EYVBL IY'));
  assert.equal(K.vigenere(K.spaltentransposition('IMYIW BWHJS JDBPS NGRGQ EYVBL IY', 'FUNKE', 'ent'), 'FUNKE', 'ent'), GROSS('wetterberichtfuerdienordsee'));
  // unvollständige Matrix: die ersten L mod n Spalten (von links) sind länger, nicht die zuerst gelesenen
  assert.equal(K.spaltentransposition('OKTCA ELHRN', 'TAL', 'ent'), 'LOCHKARTEN');
  assert.equal(K.spaltentransposition('lochkarten', 'TAL'), 'OKTCAELHRN');
  // ADFGVX-Stufe 2 (Level 3.4): NEBEL4/KARL
  assert.equal(K.spaltentransposition('AXADDGADAGXD', 'KARL'), 'XGGADADDDAAX');
});

test('grenzfaelle_transposition', () => {
  assert.equal(K.spaltentransposition('', 'TAL'), '');
  assert.equal(K.spaltentransposition('', 'TAL', 'ent'), '');
  assert.equal(K.spaltentransposition('ab', 'KARLSRUHE'), 'BA'); // Schlüssel länger als Text
  assert.equal(K.spaltentransposition('BA', 'KARLSRUHE', 'ent'), 'AB');
  assert.equal(K.spaltentransposition('lochkarten', [3, 1, 2]), 'OKTCAELHRN');
  // mit Füllzeichen: Rechteck wird aufgefüllt, ent entfernt nichts
  assert.equal(K.spaltentransposition('lochkarten', 'TAL', 'ver', { fuellzeichen: 'X' }), 'OKTXCAEXLHRN');
  assert.equal(K.spaltentransposition('OKTXCAEXLHRN', 'TAL', 'ent'), 'LOCHKARTENXX');
  assert.throws(() => K.spaltentransposition('abc', ''), K.KryptoFehler);
  assert.throws(() => K.spaltentransposition('abc', 'TAL', 'ver', { fuellzeichen: '1' }), K.KryptoFehler);
});

test('umkehrung (W3-L3-04, W3-L3-07)', () => {
  assert.equal(K.umkehrung('boje'), 'EJOB');
  assert.equal(K.caesar(K.umkehrung('boje'), 3), 'HMRE');
  const c7 = 'MLSNT WEVYP FAPEF PSECS PLQRF KESNL YCPO';
  assert.equal(K.caesar(c7, 11, 'ent'), GROSS('BAHCI LTKNE UPETU EHTRH EAFGU ZTHCA NRED'));
  assert.equal(K.umkehrung(K.caesar(c7, 11, 'ent')), GROSS('dernachtzugfaehrtheutepuenktlichab'));
  assert.equal(K.umkehrung(''), '');
  assert.equal(K.umkehrung('Grüße'), 'ESSEURG');
});

test('blockrotation (SPEC Prüfungen: KETTENSCHRIFT Stufe 1)', () => {
  assert.equal(K.blockrotation('baumhoehle', 4, 1), 'AUMBOEHHEL');
  assert.equal(K.blockrotation('AUMBOEHHEL', 4, 1, 'ent'), 'BAUMHOEHLE');
  assert.equal(K.blockrotation('EFANVKPXJO', 4, 1), 'FANEKPXVOJ');
  // b-fache Rotation ist wegen des kürzeren letzten Blocks keine Identität: anderquelle, b = 4 → ANDERQUELEL
  assert.equal(K.blockrotation('anderquelle', 4, 4), 'ANDERQUELEL');
  let t = 'ANDERQUELLE';
  for (let i = 0; i < 4; i++) t = K.blockrotation(t, 4, 1);
  assert.equal(t, 'ANDERQUELEL');
  assert.equal(K.blockrotation('baumhoehle', 2, 4), 'BAUMHOEHLE');
});

test('grenzfaelle_blockrotation', () => {
  assert.equal(K.blockrotation('', 4, 1), '');
  assert.equal(K.blockrotation('abc', 5, 2), 'CAB'); // Block länger als Text: letzter Block um 2 mod 3
  assert.equal(K.blockrotation('abcdefg', 3, 2, 'ent'), 'BCAEFDG');
  assert.deepEqual(K.blockrotation([1, 2, 3, 4, 5], 2, 1), [2, 1, 4, 3, 5]); // Bytes
  assert.deepEqual(K.blockrotation([2, 1, 4, 3, 5], 2, 1, 'ent'), [1, 2, 3, 4, 5]);
  assert.throws(() => K.blockrotation('abc', 1, 1), K.KryptoFehler);
  assert.throws(() => K.blockrotation('abc', 3, 1.5), K.KryptoFehler);
  assert.throws(() => K.blockrotation([1, 300], 2, 1), K.KryptoFehler);
});

test('ver∘ent = id (500 Zufallsfälle je Verfahren) – Transpositionen', () => {
  const s1 = [[1, 3], [2, 2], [3, 1], [4, 4]];
  for (let i = 0; i < RUNDEN; i++) {
    const t = zufallsText();
    const n = K.nurBuchstaben(t);
    const u = ganz(2, 25);
    const sky = K.skytale(t, u);
    assert.equal(K.skytale(sky, u, 'ent'), n + 'X'.repeat(sky.length - n.length), `skytale u=${u}`);
    assert.equal(K.skytale(K.skytale(t, u, 'ver', { fuellzeichen: null }), u, 'ent', { fuellzeichen: null }), n);
    const h = ganz(2, 12);
    assert.equal(K.gartenzaun(K.gartenzaun(t, h), h, 'ent'), n, `gartenzaun h=${h}`);
    assert.equal(K.gartenzaun(K.gartenzaun(n, h, 'ent'), h), n);
    const fl = K.fleissner(t, 4, s1, 'ver', { drehung: zufall() < 0.5 ? 'rechts' : 'links' });
    assert.equal(fl.length % 16, 0);
    const sp = zufall() < 0.3 ? [3, 1, 4, 2, 5].slice(0, ganz(1, 5)).map((x, j, a) => j + 1).reverse() : zufallsWort(1, 9);
    assert.equal(K.spaltentransposition(K.spaltentransposition(t, sp), sp, 'ent'), n, `spalten ${sp}`);
    assert.equal(K.spaltentransposition(K.spaltentransposition(n, sp, 'ent'), sp), n);
    assert.equal(K.umkehrung(K.umkehrung(t)), n);
    const b = ganz(2, 16);
    const um = ganz(-5, 20);
    assert.equal(K.blockrotation(K.blockrotation(t, b, um), b, um, 'ent'), n, `blockrotation ${b}/${um}`);
  }
  for (let i = 0; i < 100; i++) {
    const t = zufallsText();
    const d = zufall() < 0.5 ? 'rechts' : 'links';
    const fl = K.fleissner(t, 4, s1, 'ver', { drehung: d });
    const n = K.nurBuchstaben(t);
    assert.equal(K.fleissner(fl, 4, s1, 'ent', { drehung: d }), n + 'X'.repeat(fl.length - n.length));
  }
});

// ───────────────────────────── Task 13: Bits, ASCII, XOR ─────────────────────────────

const B8 = (s) => s.split('·').map((x) => K.bitsZuByte(x)); // „0100 1111 · 0101 0011“ → Bytes
const bits8 = (bytes) => bytes.map((b) => K.byteZuBits(b)).join('');

test('ascii Bereich 32–126', () => {
  assert.equal(K.ascii('A'), 65);
  assert.throws(() => K.ascii('ä'), K.KryptoFehler);
  assert.equal(K.ascii(' '), 32);
  assert.equal(K.ascii('~'), 126);
  assert.throws(() => K.ascii('AB'), K.KryptoFehler);
  assert.throws(() => K.ascii('\n'), K.KryptoFehler);
  assert.equal(K.zeichenAusAscii(82), 'R');
  assert.throws(() => K.zeichenAusAscii(127), K.KryptoFehler);
  assert.throws(() => K.zeichenAusAscii(31), K.KryptoFehler);
  // SPEC W0 §12: ASCII K / G / R / v
  assert.deepEqual(['K', 'G', 'R', 'v'].map(K.ascii), [75, 71, 82, 118]);
});

test('Bytes, Bits, Hex', () => {
  assert.deepEqual(K.textZuBytes('OK ok'), [79, 75, 32, 111, 107]);
  assert.equal(K.bytesZuText([79, 75]), 'OK');
  assert.throws(() => K.textZuBytes('Grüße'), K.KryptoFehler);
  assert.throws(() => K.bytesZuText([200]), K.KryptoFehler);
  assert.equal(K.byteZuBits(65), '01000001');
  assert.equal(K.byteZuBits(5, 4), '0101');
  assert.throws(() => K.byteZuBits(256), K.KryptoFehler);
  assert.equal(K.bitsZuByte('0100 0001'), 65);
  assert.throws(() => K.bitsZuByte('0102'), K.KryptoFehler);
  assert.throws(() => K.bitsZuByte(''), K.KryptoFehler);
  assert.equal(K.textZuBits('OK'), '0100 1111 0100 1011'); // §0a.1 Beispiel „OK“
  assert.equal(K.textZuBits('OK', { gruppe: 8 }), '01001111 01001011');
  assert.equal(K.textZuBits('OK', { gruppe: 0 }), '0100111101001011');
  assert.equal(K.textZuBits(''), '');
  assert.equal(K.bitsZuText('0100 1111 0100 1011'), 'OK');
  assert.throws(() => K.bitsZuText('0100 111'), K.KryptoFehler);
  assert.equal(K.hex([0x07, 0x17, 0x0f, 0x09]), '07170F09');
  assert.equal(K.hex(0x4f4b), '4F4B'); // ein KRYPTOS-16-Block (Zahl) → 4 Hexziffern
  assert.equal(K.hex(0x0202), '0202');
  assert.deepEqual(K.vonHex('07 17 0f 09'), [7, 23, 15, 9]);
  assert.throws(() => K.vonHex('0G'), K.KryptoFehler);
  assert.throws(() => K.vonHex('071'), K.KryptoFehler);
  assert.equal(K.hex(K.vonHex('ABCD')), 'ABCD');
});

test('xor selbstinvers', () => assert.equal(K.xorBits(K.xorBits('01000001', '10011100'), '10011100'), '01000001'));

test('xorBits, undBits, oderBits, rotiereBits', () => {
  assert.equal(K.xorBits('0100 1111', '1010 0110'), '11101001'); // W3-L1-02
  assert.equal(K.xorBits('1011 0110', '0110 1101'), '11011011'); // W3-B-02
  assert.equal(K.xorBits('11001010', '01100110'), '10101100'); // Akte W3·1 A2
  assert.equal(K.xorBits('10010110', '01011010'), '11001100'); // WU-W3-02
  assert.equal(K.xorBits('1100', '1010', '0110'), '0000'); // mehrere Operanden
  assert.equal(K.undBits('1100', '1010'), '1000');
  assert.equal(K.oderBits('1100', '1010'), '1110');
  assert.throws(() => K.xorBits('0101', '011'), K.KryptoFehler);
  assert.throws(() => K.xorBits('0102', '0110'), K.KryptoFehler);
  assert.equal(K.rotiereBits('0100 0011', 1), '10000110');
  assert.equal(K.rotiereBits('10000110', -1), '01000011');
  assert.equal(K.rotiereBits('1011', 4), '1011');
  assert.equal(K.rotiereBits('', 3), '');
});

test('Video 04: J ⊕ 10011100, One-Time-Pad NEU/ALT', () => {
  const j = K.byteZuBits(K.ascii('J'));
  assert.equal(K.xorBits(j, '10011100'), '11010110');
  assert.equal(K.bitsZuText(K.xorBits('11010110', '10011100')), 'J');
  const schl = ['11010011', '01101001', '10101110'];
  const c1 = [...'NEU'].map((c, i) => K.xorBits(K.byteZuBits(K.ascii(c)), schl[i]));
  const c2 = [...'ALT'].map((c, i) => K.xorBits(K.byteZuBits(K.ascii(c)), schl[i]));
  assert.deepEqual(c1, ['10011101', '00101100', '11111011']);
  assert.deepEqual(c2, ['10010010', '00100101', '11111010']);
  assert.equal(K.xorBits(c1[0], c2[0]), '00001111');
});

test('Bits und XOR: SPEC W3 §12 (Level 3.1, Akte W3·1, Boss, Warm-up)', () => {
  // Archivfund: FUNK ⊕ Schlüsselstreifen
  const st = [['1111 0100', '1011 0010'], ['0110 1100', '0011 1001'], ['1000 1011', '1100 0101'], ['0010 0101', '0110 1110']];
  assert.equal(K.bitsZuText(st.map(([a, b]) => K.xorBits(a, b)).join('')), 'FUNK');
  // W3-L1-01, L1-04, L1-05, L1-06
  assert.equal(K.textZuBits('OST'), '0100 1111 0101 0011 0101 0100');
  assert.equal(K.xor('OST', [0b10100110, 0b01011100, 0b11110000]), 'E90FA4');
  assert.equal(bits8(K.vonHex('E90FA4')), ohne('1110 1001 0000 1111 1010 0100'));
  assert.equal(K.xor(K.hex([0b01101111, 0b10011111, 0b00011000]), [0b00110101, 0b11001010, 0b01011111], 'ent'), 'ZUG');
  const c6 = [0b10011100, 0b00100100, 0b11001110, 0b01100011];
  assert.equal(bits8(K.vonHex(K.xor(c6, 'WEST'))), ohne('1100 1011 0110 0001 1001 1101 0011 0111'));
  assert.equal(bits8(K.vonHex(K.xor(c6, 'NORD'))), ohne('1101 0010 0110 1011 1001 1100 0010 0111'));
  // W3-L1-07: zweimal derselbe Schlüssel → C1 ⊕ C2 = M1 ⊕ M2; Crib „NORD“
  const C1 = [0b00111111, 0b11100011, 0b01001001, 0b10100000, 0b11010011, 0b01100011];
  const C2 = [0b00100010, 0b11111001, 0b01011110, 0b10100000, 0b11010011, 0b01100011];
  const D = K.vonHex(K.xor(C1, C2));
  assert.equal(bits8(D), ohne('0001 1101 0001 1010 0001 0111 0000 0000 0000 0000 0000 0000'));
  assert.deepEqual([0, 1, 2].map((p) => K.xor(K.hex(D.slice(p, p + 4)), 'NORD', 'ent')), ['SUED', 'TXRD', 'YORD']);
  assert.equal(K.xor(K.hex(D), 'NORDEN', 'ent'), 'SUEDEN');
  // Akte W3·1: A1, A3, A4, A5, A6
  assert.equal(K.bitsZuText('01010111 01001000'), 'WH');
  assert.equal(bits8(K.vonHex(K.xor('BOJE', B8('0110 1001 · 1111 0000 · 0011 0011 · 1010 0101')))), ohne('0010 1011 1011 1111 0111 1001 1110 0000'));
  const C4 = B8('0001 1110 · 1101 1010 · 0110 0111 · 1001 0001');
  assert.equal(bits8(K.vonHex(K.xor(C4, 'HALT'))), ohne('0101 0110 1001 1011 0010 1011 1100 0101'));
  assert.equal(bits8(K.vonHex(K.xor(C4, 'LAUF'))), ohne('0101 0010 1001 1011 0011 0010 1101 0111'));
  const A1 = B8('1001 0011 · 0111 0011 · 1110 1001 · 0000 0001 · 1011 0100 · 0101 0110 · 1100 0100');
  const A2 = B8('1000 0100 · 0111 0111 · 1110 0100 · 0001 0010 · 1010 0111 · 0101 1011 · 1101 1000');
  const DA = K.vonHex(K.xor(A1, A2));
  assert.equal(bits8(DA), ohne('0001 0111 0000 0100 0000 1101 0001 0011 0001 0011 0000 1101 0001 1100'));
  assert.deepEqual([0, 1, 2, 3, 4].map((p) => K.xor(K.hex(DA.slice(p, p + 3)), 'UHR', 'ent')), ['BL_', 'QEA', 'X[A', 'F[_', 'FEN']);
  assert.equal(K.xor(K.hex(DA), 'VIERUHR', 'ent'), 'AMHAFEN');
  assert.equal(bits8(K.vonHex(K.xor('EBBE', [0b00100001]))), ohne('0110 0100 0110 0011 0110 0011 0110 0100'));
  // Baukasten XOR: „FUNK“ mit AB → 07 17 0F 09
  assert.equal(K.xor('FUNK', 'AB'), '07170F09');
  assert.equal(K.xor('07 17 0F 09', 'AB', 'ent'), 'FUNK');
  // Boss: B-01, B-06, B-10 (TELEX-ROT), B-13 (Perioden), B-15
  assert.equal(K.byteZuBits(K.ascii('R')), '01010010');
  assert.equal(K.xor(K.hex([0b00000001, 0b00010110, 0b00000001]), 'OST', 'ent'), 'NEU');
  const ks = ['01000011'];
  for (let i = 0; i < 3; i++) ks.push(K.rotiereBits(ks[i], 1));
  assert.deepEqual(ks, ['01000011', '10000110', '00001101', '00011010']);
  assert.equal(bits8(K.vonHex(K.xor('TOR', ks.map(K.bitsZuByte)))), ohne('0001 0111 1100 1001 0101 1111'));
  const periode = (k) => {
    const b = K.byteZuBits(k);
    for (let p = 1; p <= 8; p++) if (K.rotiereBits(b, p) === b) return p;
    return null;
  };
  const per = {};
  for (let k = 0; k < 256; k++) per[periode(k)] = (per[periode(k)] || 0) + 1;
  assert.deepEqual(per, { 1: 2, 2: 2, 4: 12, 8: 240 });
  const C15 = [0b00001010, 0b00000100, 0b00010001, 0b00010110, 0b00000100, 0b00000101, 0b00000000, 0b00000100, 0b00001010, 0b00000110];
  assert.equal(K.xor(K.hex(C15.slice(0, 3)), 'HEU', 'ent'), 'BAD');
  assert.equal(K.xor(K.hex(C15), 'BAD', 'ent'), 'HEUTEABEND');
  // Warm-up W3-01; P3-Falle Bit 5 (W3-L2-07 Merkkasten): „ “ ⊕ 0000 1000 = „(“
  assert.equal(K.bitsZuText('01001110'), 'N');
  assert.equal(K.xor(K.hex([K.ascii(' ')]), [0b00001000], 'ent'), '(');
});

test('xor: Grenzfälle', () => {
  assert.equal(K.xor('', 'AB'), '');
  assert.equal(K.xor('', 'AB', 'ent'), '');
  assert.throws(() => K.xor('ABC', ''), K.KryptoFehler);
  assert.throws(() => K.xor('ABC', []), K.KryptoFehler);
  assert.throws(() => K.xor('Grüße', 'A'), K.KryptoFehler);
  assert.equal(K.xor('00', 'A', 'ent'), 'A');
  assert.throws(() => K.xor('41', 'A', 'ent'), K.KryptoFehler); // Ergebnis 0x00 liegt nicht in ASCII 32–126
  assert.throws(() => K.xor('4', 'A', 'ent'), K.KryptoFehler);
});

// ───────────────────────────── KRYPTOS-16 ─────────────────────────────

const K16 = K.kryptos16;
const BIN = (s) => parseInt(ohne(s), 2);
const BLK = (x) => K.byteZuBits(x, 16).replace(/(.{4})(?!$)/g, '$1 ');

test('kryptos16 S-Box und Inverse (SPEC W3 §0a.4)', () => {
  assert.equal(K16.SBOX.map((v) => v.toString(16).toUpperCase()).join(''), 'CF397A86124EB5D0');
  assert.equal(K16.SBOX_INV.map((v) => v.toString(16).toUpperCase()).join(''), 'F892AD74635C0EB1');
  for (let x = 0; x < 16; x++) {
    assert.notEqual(K16.SBOX[x], x);
    assert.notEqual(K16.SBOX[K16.SBOX[x]], x);
    assert.equal(K16.SBOX_INV[K16.SBOX[x]], x);
  }
  // W3-L2-02, Akte W3·2 A1, WU-W3-06
  assert.deepEqual([0b1011, 0b0110].map((x) => K16.SBOX[x]), [0b1110, 0b1000]);
  assert.deepEqual([0b1110, 0b0000].map((x) => K16.SBOX_INV[x]), [0b1011, 0b1111]);
  assert.deepEqual([0, 15, 9].map((x) => K16.SBOX[x]), [0b1100, 0b0000, 0b0010]);
  assert.deepEqual([9, 6].map((x) => K16.SBOX_INV[x]), [0b0011, 0b0111]);
  assert.equal(K16.SBOX[K16.SBOX[6]], 0b0001);
  assert.equal(K16.SBOX_INV[8], 0b0110);
});

test('kryptos16 Einzelschritte: S-Box je Zeile, Transposition', () => {
  assert.equal(BLK(K16.sbox(BIN('1110 1100 0010 0110'))), '1101 1011 0011 1000');
  assert.equal(BLK(K16.sbox(BIN('1101 1011 0011 1000'), 'ent')), '1110 1100 0010 0110');
  assert.equal(BLK(K16.transponiere(BIN('1101 1011 0011 1000'))), '1101 1000 0110 1110'); // W3-L2-03
  assert.equal(BLK(K16.transponiere(BIN('0010 0110 0001 1100'))), '0001 0101 1100 0010'); // Akte W3·2 A2
  assert.equal(BLK(K16.transponiere(0xf000)), '1000 1000 1000 1000'); // WU-W3-07
  // Boss B-07: S-Box, dann Transposition
  const s = K16.sbox(BIN('1011 0100 0011 1001'));
  assert.equal(BLK(s), '1110 0111 1001 0010');
  assert.equal(BLK(K16.transponiere(s)), '1010 1100 1101 0110');
});

test('kryptos16 Schlüsselplan (§0a.2, W3-L2-05, Boss B-08, Akte W3·2 Abi d)', () => {
  assert.deepEqual([1, 2, 3, 4].map((r) => K.hex(K16.rundenschluessel(0xa36d, r))), ['A36D', '36DA', '6DA3', 'DA36']);
  const k = BIN('0101 1100 1001 1110');
  assert.deepEqual([2, 3, 4].map((r) => BLK(K16.rundenschluessel(k, r))), ['1100 1001 1110 0101', '1001 1110 0101 1100', '1110 0101 1100 1001']);
  assert.equal(BLK(K16.rundenschluessel(BIN('0011 1010 1100 0101'), 3)), '1100 0101 0011 1010');
  assert.equal(K16.rundenschluessel(0x7777, 2), 0x7777);
  assert.equal(K16.rundenschluessel(0xa36d, 5), 0xa36d);
  // schwache Schlüssel: 16 mit vier gleichen Rundenschlüsseln, 240 der Form k1 k2 k1 k2 (k1 ≠ k2)
  let schwach = 0;
  let periode2 = 0;
  for (let x = 0; x < 65536; x++) {
    const r = [1, 2, 3, 4].map((i) => K16.rundenschluessel(x, i));
    if (r.every((v) => v === x)) schwach++;
    else if (r[2] === r[0] && r[3] === r[1]) periode2++;
  }
  assert.equal(schwach, 16);
  assert.equal(periode2, 240);
  assert.throws(() => K16.rundenschluessel(0x10000, 1), K.KryptoFehler);
  assert.throws(() => K16.rundenschluessel(1, 0), K.KryptoFehler);
});

test('kryptos16 Testvektor', () => {
  const erg = [1, 2, 3, 4].map((r) => K.hex(K16.verschluesseln(0x4f4b, 0xa36d, { runden: r })));
  assert.deepEqual(erg, ['D86E', 'EF3D', '116D', 'F5F8']);
});

test('kryptos16 Testvektoren §0a.6 (alle 24 Werte)', () => {
  const tv = [
    [0x4f4b, 0xa36d, ['D86E', 'EF3D', '116D', 'F5F8']],
    [0x4f4a, 0xa36d, ['C97E', '0311', 'E635', 'F24D']],
    [0x4a41, 0x5c9e, ['CA8A', 'E804', '68A1', '240D']],
    [0x4f4b, 0x0000, ['1BBA', 'EFE8', 'AA0B', '3F10']],
    [0x0000, 0x2b7e, ['57E9', 'FF18', '744F', '4081']],
    [0xffff, 0x2b7e, ['1D5F', '2F21', 'E7C4', 'DA61']],
  ];
  for (const [p, k, soll] of tv) {
    assert.deepEqual([1, 2, 3, 4].map((r) => K.hex(K16.verschluesseln(p, k, { runden: r }))), soll, K.hex(p));
    assert.equal(K16.entschluesseln(K16.verschluesseln(p, k), k), p);
  }
  assert.equal(K16.verschluesseln(0x4f4b, 0xa36d), 0xf5f8); // Standard R = 4
});

test('kryptos16 Protokoll: KRYPTOS-16/2 „OK“ (§0a.6), „NO“ (W3-L2-04), „JA“ (Akte W3·2 A4)', () => {
  const p = K16.verschluesseln(0x4f4b, 0xa36d, { runden: 2, protokoll: true });
  assert.equal(p.ergebnis, 0xef3d);
  const zeile = (r) => [r.eingang, r.schluessel, r.nachXor, r.nachSBox, r.nachTransposition].map(BLK);
  assert.deepEqual(zeile(p.runden[0]), ['0100 1111 0100 1011', '1010 0011 0110 1101', '1110 1100 0010 0110', '1101 1011 0011 1000', '1101 1000 0110 1110']);
  assert.deepEqual(zeile(p.runden[1]), ['1101 1000 0110 1110', '0011 0110 1101 1010', '1110 1110 1011 0100', '1101 1101 1110 0111', '1110 1111 0011 1101']);
  assert.equal(p.runden[1].runde, 2);
  const no = K16.verschluesseln(K16.textZuBloecken('NO')[0], BIN('0011 1111 0000 1000'), { runden: 1, protokoll: true });
  assert.deepEqual(zeile(no.runden[0]).filter((x, i) => i !== 1), ['0100 1110 0100 1111', '0111 0001 0100 0111', '0110 1111 0111 0110', '0100 1111 1111 0110']);
  const ja = K16.verschluesseln(0x4a41, 0x5c9e, { runden: 2, protokoll: true });
  assert.deepEqual(zeile(ja.runden[0]), ['0100 1010 0100 0001', '0101 1100 1001 1110', '0001 0110 1101 1111', '1111 1000 0101 0000', '1100 1010 1000 1010']);
  assert.deepEqual(zeile(ja.runden[1]), ['1100 1010 1000 1010', '1100 1001 1110 0101', '0000 0011 0110 1111', '1100 1001 1000 0000', '1110 1000 0000 0100']);
  // runde() einzeln und rückwärts
  assert.equal(K16.runde(0x4f4b, 0xa36d), 0xd86e);
  assert.equal(K16.runde(0xd86e, 0xa36d, 'ent'), 0x4f4b);
  // W3-L2-06: Werte „OJ“ nach R = 1 … 4
  assert.deepEqual([1, 2, 3, 4].map((r) => BLK(K16.verschluesseln(0x4f4a, 0xa36d, { runden: r }))), ['1100 1001 0111 1110', '0000 0011 0001 0001', '1110 0110 0011 0101', '1111 0010 0100 1101']);
});

test('kryptos16 ent∘ver = id (alle 65536 Blöcke, K=A36D)', () => {
  const gesehen = new Uint8Array(65536);
  for (let p = 0; p < 65536; p++) {
    const c = K16.verschluesseln(p, 0xa36d);
    assert.equal(gesehen[c], 0); // bijektiv
    gesehen[c] = 1;
    if (K16.entschluesseln(c, 0xa36d) !== p) assert.fail(`ent∘ver ≠ id für ${K.hex(p)}`);
  }
  for (let i = 0; i < 2000; i++) {
    const p = ganz(0, 65535);
    const k = ganz(0, 65535);
    const r = ganz(1, 8);
    assert.equal(K16.entschluesseln(K16.verschluesseln(p, k, { runden: r }), k, { runden: r }), p);
  }
});

test('kryptos16 Lawine (W3-L2-06, Akte W3·2 A5, §0a.8 exakt)', () => {
  assert.deepEqual(K16.lawine(0x4f4b, 0xa36d, 16).map((r) => r.anzahl), [3, 8, 10, 8]);
  assert.deepEqual(K16.lawine(0x4a41, 0x5c9e, 16).map((r) => r.anzahl), [3, 7, 9, 7]);
  const l = K16.lawine(0x4f4b, 0xa36d, 16, { runden: 1 });
  assert.equal(l.length, 1);
  assert.equal(l[0].runde, 1);
  assert.equal(l[0].positionen.length, 3);
  assert.ok(l[0].positionen.every((b) => b >= 1 && b <= 16));
  assert.throws(() => K16.lawine(0, 0, 17), K.KryptoFehler);
  // exakt über alle 65 536 Klartexte und 16 Bitpositionen, K = 2B7E
  const soll = [[2.63, 16.4, 2, 4], [6.89, 43.1, 4, 16], [7.71, 48.2, 2, 16], [7.9, 49.4, 1, 16]];
  const pc = (x) => { let n = 0; while (x) { n += x & 1; x >>>= 1; } return n; };
  for (let r = 1; r <= 4; r++) {
    const C = new Uint16Array(65536);
    for (let p = 0; p < 65536; p++) C[p] = K16.verschluesseln(p, 0x2b7e, { runden: r });
    let summe = 0; let min = 99; let max = 0;
    for (let p = 0; p < 65536; p++) for (let i = 0; i < 16; i++) {
      const d = pc(C[p] ^ C[p ^ (1 << i)]);
      summe += d; if (d < min) min = d; if (d > max) max = d;
    }
    const mittel = summe / 65536 / 16;
    assert.deepEqual([Math.round(mittel * 100) / 100, Math.round((mittel / 16) * 1000) / 10, min, max], soll[r - 1], `R = ${r}`);
  }
});

test('kryptos16 Vollständigkeit: nach 1 Runde 64/256, nach 2 Runden 256/256 Abhängigkeiten (§0a.8)', () => {
  for (const [r, soll] of [[1, 64], [2, 256]]) {
    let abh = 0;
    for (let i = 0; i < 16; i++) {
      let maske = 0;
      for (let p = 0; p < 65536; p += 97) maske |= K16.verschluesseln(p, 0x2b7e, { runden: r }) ^ K16.verschluesseln(p ^ (1 << (15 - i)), 0x2b7e, { runden: r });
      for (let j = 0; j < 16; j++) if ((maske >> j) & 1) abh++;
    }
    assert.equal(abh, soll);
  }
});

test('kryptos16 Padding', () => {
  // §0a.7: ungerade Zeichenzahl → Byte 01, gerade → Block 0202
  assert.deepEqual(K16.textZuBloecken('OST').map(BLK), ['0100 1111 0101 0011', '0101 0100 0000 0001']);
  assert.deepEqual(K16.textZuBloecken('JA').map(BLK), ['0100 1010 0100 0001', '0000 0010 0000 0010']);
  assert.deepEqual(K16.textZuBloecken('').map(K.hex), ['0202']);
  assert.deepEqual(K16.textZuBloecken('NEIN').map(K.hex), ['4E45', '494E', '0202']);
  assert.equal(K16.bloeckeZuText(K16.textZuBloecken('OST')), 'OST');
  assert.equal(K16.bloeckeZuText(K16.textZuBloecken('JA')), 'JA');
  assert.equal(K16.bloeckeZuText(K16.textZuBloecken('')), '');
  assert.throws(() => K16.bloeckeZuText([0x4a41]), K.KryptoFehler); // Füllbytes fehlen
  assert.throws(() => K16.bloeckeZuText([0x4a41, 0x0203]), K.KryptoFehler);
  assert.throws(() => K16.textZuBloecken('Grüße'), K.KryptoFehler);
});

test('kryptos16 Modi ECB/CBC (Akte W3·2 A6, W3-L2-07)', () => {
  // „JAJA“ mit 1 Runde, K = 5C9E, IV = 0011 0000 1100 0011 (ohne Füllblock)
  const ecb = K16.modus([0x4a41, 0x4a41], 0x5c9e, 'ECB', null, { runden: 1 });
  assert.deepEqual(ecb.map(BLK), ['1100 1010 1000 1010', '1100 1010 1000 1010']);
  const iv = BIN('0011 0000 1100 0011');
  const cbc = K16.modus([0x4a41, 0x4a41], 0x5c9e, 'CBC', iv, { runden: 1 });
  assert.deepEqual(cbc.map(BLK), ['0111 0010 1011 1011', '1010 0101 0101 0101']);
  assert.deepEqual(K16.modus(cbc, 0x5c9e, 'CBC', iv, { runden: 1, richtung: 'ent' }), [0x4a41, 0x4a41]);
  assert.deepEqual(K16.modus(ecb, 0x5c9e, 'ECB', null, { runden: 1, richtung: 'ent' }), [0x4a41, 0x4a41]);
  // W3-L2-07: „SEHR GUT“, R = 4, K = A36D, IV = 1917, Bit 5 von C₂ gekippt
  const P = K16.textZuBloecken('SEHR GUT');
  assert.equal(P.length, 5);
  const C = K16.modus(P, 0xa36d, 'CBC', 0x1917);
  const Cf = C.slice();
  Cf[1] ^= 1 << (16 - 5);
  const Pf = K16.modus(Cf, 0xa36d, 'CBC', 0x1917, { richtung: 'ent' });
  assert.equal(K.bytesZuText(Pf.slice(0, 4).flatMap((b) => [b >> 8, b & 255])), 'SEQp(GUT');
  const pc = (x) => x.toString(2).split('1').length - 1;
  assert.equal(pc(Pf[1] ^ P[1]), 5);
  assert.equal(pc(Pf[2] ^ P[2]), 1);
  const E = K16.modus(P, 0xa36d, 'ECB');
  const Ef = E.slice();
  Ef[1] ^= 1 << (16 - 5);
  const Pe = K16.modus(Ef, 0xa36d, 'ECB', null, { richtung: 'ent' });
  assert.equal(pc(Pe[1] ^ P[1]), 12);
  assert.deepEqual([0, 2, 3, 4].map((i) => Pe[i] === P[i]), [true, true, true, true]);
  assert.throws(() => K16.modus([1], 1, 'CBC'), K.KryptoFehler); // IV fehlt
  assert.throws(() => K16.modus([1], 1, 'OFB', 0), K.KryptoFehler);
  assert.throws(() => K16.verschluesseln(0x10000, 1), K.KryptoFehler);
  assert.throws(() => K16.verschluesseln(1, 1, { runden: 0 }), K.KryptoFehler);
});

// ───────────────────────────── KRYPTOS-Hash ─────────────────────────────

test('kryptosHash', () => {
  assert.equal(K.kryptosHash('nebel').wert, 9);
  assert.equal(K.kryptosHash('heute').wert, K.kryptosHash('morgen').wert);
  assert.equal(K.kryptosHash('heute').wert, 22);
});

test('kryptosHash: SPEC W5 §0a, §12', () => {
  const KH = (t) => K.kryptosHash(t).wert;
  // Validator-Testfälle §0a
  assert.equal(KH(''), 0);
  assert.equal(KH('a'), 1);
  assert.equal(KH('ueberweisetausendeuro'), 18);
  assert.equal(KH('Überweise 2 Euro'), 1); // Ziffern entfallen → „ueberweiseeuro“
  assert.equal(KH('Überweise 2 Euro'), KH('ueberweiseeuro'));
  // Rundentabelle „nebel“
  const p = K.kryptosHash('nebel', { protokoll: true });
  assert.deepEqual(p.schritte.map((s) => [s.buchstabe, s.w, s.vorher, s.summe, s.nachher]), [
    ['n', 14, 0, 14, 14], ['e', 5, 14, 47, 18], ['b', 2, 18, 56, 27], ['e', 5, 27, 86, 28], ['l', 12, 28, 96, 9],
  ]);
  assert.equal(K.kryptosHash('nebel').schritte, undefined);
  // Einzelwerte §12
  const einzel = { tee: 26, kaffee: 3, kiste: 7, kistf: 8, hafen: 4, eis: 4, anker: 11, tor: 11, post: 6, potq: 6, abe: 20, ja: 2, rabe: 13, bear: 4, nebfi: 9, haffk: 4, zoo: 4, ab: 5, t: 20, regal: 18, lager: 22, oase: 12 };
  for (const [w, h] of Object.entries(einzel)) assert.equal(KH(w), h, w);
  // Kollisionspaare
  for (const [a, b, h] of [['heute', 'morgen', 22], ['ueberweisezweieuro', 'ueberweisetausendeuro', 18], ['treffenumfuenfuhr', 'treffenumzehnuhr', 8], ['treffpunktbruecke', 'treffpunktschule', 18], ['sonne', 'geheim', 0]]) {
    assert.deepEqual([KH(a), KH(b)], [h, h], `${a}/${b}`);
  }
  // Salz, Siegel-Code
  assert.deepEqual([KH('qxsonne'), KH('kzsonne'), KH('mbsonne')], [13, 11, 16]);
  assert.equal(KH('oasekistefehltimhafen'), 27);
  assert.equal(KH('oasekistefehltimhaffk'), 27);
});

test('kryptosHash.kollisionSuchen (Schubfach-Experiment)', () => {
  const k = K.kryptosHash.kollisionSuchen('nebel');
  assert.equal(k.wert, 9);
  assert.equal(K.kryptosHash(k.text).wert, 9);
  assert.notEqual(K.nurBuchstaben(k.text), 'NEBEL');
  assert.equal(k.text, 'i'); // kürzester Kandidat zuerst (a, b, …, z, aa, …)
  const k2 = K.kryptosHash.kollisionSuchen('heute', { alphabet: 'xyz' });
  assert.equal(K.kryptosHash(k2.text).wert, 22);
  assert.ok(/^[xyz]+$/.test(k2.text));
  assert.equal(K.kryptosHash.kollisionSuchen('heute', { alphabet: 'a', max: 5 }), null);
  assert.throws(() => K.kryptosHash.kollisionSuchen('x', { alphabet: '' }), K.KryptoFehler);
});

// ───────────────────────────── Task 14: Kryptoanalyse ─────────────────────────────

const EVES_BRIEF = `ZIGNS HEGYW WUUCW JEFPY ARTLA YHVKW JHCMW JAOHT ANFKW NGGZS
JDVLT NIPNL ZIGIJ EEHLV ARFPH HOOHL ENFPW XRKLX AEPAZ WLVLF
ZIGUS IEPKW NVGYT QEPKW PEPPF CEPBS HEUAV EEDYA AFGLJ OTUWS
ATKUV ARPHU DTWUV RETIJ ANPAV EEDYA AFGKS JAEOV EEIHD AETLK
AGGSL WMOVJ CEPDW ETGYF WCJNW JUC`;
const GOLD_TEXT = 'JSCGU UPHSD QDKBR WJWPJ KGLQJ HPQGA DRTBE DMRTH MSDDT REHTP CLTUP QKRWH MSDFN SYNKO FVMSY XGRTH CONKK OXWUF OHYDL OGGEH YYPQT HOLKU PVGBO WKBYL IVEXT RWDKG DWJWP JKGLQ JHPQT ONKJS CPKGD HNSCH OB';
const WETTKNACKEN = `DHCPQ NRUMV UDNCU DODIA PBRPR PMAUD OUIRD UBUGU CMOUI OPBQI
RIPYC ONDUQ UAUMN UOZUI RDUNY CMDSO UIRUM BMDUY CUIQI RKUMN
UMDIR DUPMP ADNYC UNKMP YCUQI RNPHH UGIRP NVDNN UIRUM BPIZU
IVUGO UDIUN PAUIR NSDIR UOUDI EQIBU MNYCM UDAUM UDIUI AMDUS
RUIID UHPIR GUNUI FPIIE URUMA QYCNO PAUDN ORQMY CUDIU IPIRU
MUIUM NUOZO RUMNY CMUDA UMUMD IIUMO NDYCP IRDUG UCMUR UNKCD
GJNJK CUIPG FDIRD HPIZP UCGOV DUJSO EURUN ZUDYC UITJM FJHHO
DIEUR UMNKM PYCUB DAOUN AQYCN OPAUI RDUNU CMCPU QSDBN DIRQI
RPIRU MURDU NUGOU IUMNY CUDIU IVUMB UIQBO UWOCP OSDIR UONJN
YCMDO OSQUM NYCMD OORUI BPIZU INYCG QUNNU G`;
const r2 = (x) => Math.round(x * 100) / 100;
const r3 = (x) => Math.round(x * 1000) / 1000;
const r4 = (x) => Math.round(x * 10000) / 10000;

test('DEUTSCH Beutelspacher', () => {
  assert.equal(K.DEUTSCH.E, 17.40);
  assert.ok(Math.abs(Object.values(K.DEUTSCH).reduce((a, b) => a + b, 0) - 100) < 0.5);
});

test('DEUTSCH: SPEC W1 §12 / W2 §0.9 (Summe, Σp², Top 5/7/10)', () => {
  assert.equal(Object.keys(K.DEUTSCH).length, 26);
  assert.equal(Object.keys(K.DEUTSCH).sort().join(''), K.ALPHABET);
  assert.equal(r2(Object.values(K.DEUTSCH).reduce((a, b) => a + b, 0)), 100);
  assert.equal(r4(Object.values(K.DEUTSCH).reduce((a, p) => a + (p / 100) ** 2, 0)), 0.0762);
  const v = Object.values(K.DEUTSCH).sort((a, b) => b - a);
  const top = (k) => r2(v.slice(0, k).reduce((a, b) => a + b, 0));
  assert.deepEqual([top(5), top(7), top(10)], [49, 61.66, 75.85]);
  assert.deepEqual(Object.entries(K.DEUTSCH).sort((a, b) => b[1] - a[1]).slice(0, 7).map((e) => e[0]).join(''), 'ENISRAT');
  assert.ok(Object.isFrozen(K.DEUTSCH));
});

test('haeufigkeiten, anteile, rangfolge, bigramme: Wettknacken (SPEC W1 §9.3)', () => {
  const h = K.haeufigkeiten(WETTKNACKEN);
  assert.equal(Object.keys(h).length, 26);
  assert.equal(Object.values(h).reduce((a, b) => a + b, 0), 486);
  assert.equal(h.U, 94);
  assert.equal(h.L, 0);
  assert.equal(K.rangfolge(WETTKNACKEN).join(''), 'UIDNMROCPYQABGHSJZKVEFTW'); // Gleichstand alphabetisch, nur vorkommende
  assert.deepEqual(K.bigramme(WETTKNACKEN, { top: 6 }).map((b) => [b.bigramm, b.anzahl]), [['UI', 21], ['IR', 20], ['UM', 20], ['YC', 17], ['RU', 14], ['DI', 13]]);
  assert.equal(K.bigramme(WETTKNACKEN).length, 10);
  assert.equal(r4(K.koinzidenzindex(WETTKNACKEN)), 0.0844);
  const a = K.anteile(WETTKNACKEN);
  assert.ok(Math.abs(Object.values(a).reduce((x, y) => x + y, 0) - 1) < 1e-12);
  assert.equal(a.U, 94 / 486);
  // Klartext mit PAPYRUS: Rangfolge E N I S R (Klartext-Häufigkeiten aus der Spec)
  const klar = K.substitution(WETTKNACKEN, K.schluesselwortAlphabet('PAPYRUS'), 'ent');
  assert.ok(klar.startsWith('IMHAUSDERWEISHEITINBAGDAD'));
  const hk = K.haeufigkeiten(klar);
  assert.deepEqual(['E', 'N', 'I', 'S', 'R', 'D', 'T', 'A', 'H', 'C', 'U'].map((c) => hk[c]), [94, 52, 42, 37, 36, 32, 28, 27, 27, 17, 14]);
});

test('haeufigkeiten und bigramme: SPEC W1 §12 (Akte W1·1 A4 ZEDER, W1-L1-07, Archivfund)', () => {
  const c4 = `RAPIZ JGBQD FGDIS AGLAI ZPZVZ LALZD FEZQP ZQGAS PZACS QAGRA
NBABB APTLR NZNGA PGLRA PLZDF SPZQS ASQGA ZLAGL APMZQ AAGLR
GAEUA PQSAD ISQGD FFGLS APRAL YAJSA LTLRV ZPSAS EGQRG AVZAD
FSAPQ DFJZB ALRMD FRAPH TLCAI TPGAP EAKAP ISGFL TLRQD FJZAC
SZJZP K`;
  const h = K.haeufigkeiten(c4);
  const soll = { A: 36, Z: 19, P: 18, G: 17, L: 17, S: 15, Q: 12, R: 11, D: 10, F: 10, I: 6, B: 5, J: 5, T: 5, E: 4, C: 3, N: 3, V: 3, K: 2, M: 2, H: 1, U: 1, Y: 1 };
  for (const c of K.ALPHABET) assert.equal(h[c], soll[c] || 0, c);
  assert.equal(K.rangfolge(c4).slice(0, 5).join(''), 'AZPGL');
  const bg = Object.fromEntries(K.bigramme(c4, { top: 1000 }).map((b) => [b.bigramm, b.anzahl]));
  assert.deepEqual([bg.AP, bg.DF, bg.SA, bg.GA, bg.LR], [11, 8, 7, 6, 6]);
  assert.equal(K.bigramme(c4, { top: 1 })[0].bigramm, 'AP');
  const c7 = 'TDAPQ AOIAP QACAI CAGGR AUAOT AOPQS TQRIT TDAWS LCABA CQDCO AORIT A';
  const h7 = K.haeufigkeiten(c7);
  assert.deepEqual(['A', 'T', 'C', 'O', 'Q', 'I', 'D', 'P', 'R'].map((c) => h7[c]), [14, 6, 5, 5, 5, 4, 3, 3, 3]);
  assert.equal(K.rangfolge(c7).slice(0, 5).join(''), 'ATCOQ');
  assert.equal(K.rangfolge('ZPUCG URDUZ UDYCU IQIRR QSDIR UNORU INYCG QUNNU G')[0], 'U'); // Archivfund: U 9 × ≙ e
  assert.equal(K.haeufigkeiten('ZPUCG URDUZ UDYCU IQIRR QSDIR UNORU INYCG QUNNU G').U, 9);
});

test('haeufigkeiten u. a.: Grenzfälle', () => {
  assert.equal(Object.values(K.haeufigkeiten('')).reduce((a, b) => a + b, 0), 0);
  assert.deepEqual(Object.values(K.anteile('')), new Array(26).fill(0));
  assert.deepEqual(K.rangfolge(''), []);
  assert.deepEqual(K.bigramme('A'), []);
  assert.deepEqual(K.bigramme('AAA'), [{ bigramm: 'AA', anzahl: 2 }]); // überlappend
  assert.equal(K.haeufigkeiten('Grüße').S, 2);
});

test('koinzidenzindex BALLADE = 2/21', () => assert.ok(Math.abs(K.koinzidenzindex('BALLADE') - 2 / 21) < 1e-12));

test('koinzidenzindex n<2 → null', () => {
  assert.equal(K.koinzidenzindex('A'), null);
  assert.equal(K.koinzidenzindex(''), null);
});

test('koinzidenzindex: SPEC W2 §12', () => {
  const gleich = (t, x) => assert.ok(Math.abs(K.koinzidenzindex(t) - x) < 1e-12, t);
  gleich('ANANAS', 8 / 30);
  gleich('SERENISSIMA', 10 / 110);
  gleich('LAGUNE', 0);
  gleich('KANALBANK', 10 / 72);
  for (const t of ['ABBA', 'ANNA', 'OTTO', 'RWWR']) gleich(t, 4 / 12);
  gleich('AOPD', 0);
  assert.equal(r3(K.koinzidenzindex('ANANAS')), 0.267);
  assert.equal(r3(K.koinzidenzindex('SERENISSIMA')), 0.091);
  assert.equal(r3(K.koinzidenzindex('KANALBANK')), 0.139);
  // Caesar lässt I unverändert, Vigenère nicht (W2-L23-03)
  assert.equal(K.koinzidenzindex(K.caesar('otto', 3)), K.koinzidenzindex('otto'));
  assert.equal(K.koinzidenzindex(K.vigenere('anna', 'ABCD')), 0);
  // Archivfund LAGUNE: I(Klartext) 0,0665, I(Geheimtext) 0,0496
  assert.equal(r4(K.koinzidenzindex('derratvonvenedigliestunserebriefebenutzeabjetztnurnochdasquadrat')), 0.0665);
  assert.equal(r4(K.koinzidenzindex('OEXLN XGOTP RRPDO AYMPS ZOAWP RKVEM PFKVR RFTFY NFUEZ TGRFR TIPLO AYKHE ORGN')), 0.0496);
  // Eves Brief: I = 2434/51756; Lab-Text GOLD: I = 1132/26082
  gleich(EVES_BRIEF, 2434 / 51756);
  gleich(GOLD_TEXT, 1132 / 26082);
});

test('friedman Standardwerte iD 0,076 / iZ 0,038 (nicht 1/26)', () => {
  assert.equal(r2(K.friedmanWert(601, 0.0507)), 2.98);
  assert.equal(r2(K.friedmanWert(1001, 0.0475)), 3.99);
  assert.equal(r2(K.friedmanWert(501, 0.0456)), 4.96);
});

test('friedman: SPEC W2 §12 (Level 2.3, Akten W2·3, Kür K1, P04, Generator)', () => {
  assert.equal(r2(K.friedmanWert(1001, 0.057)), 2.0);
  assert.equal(r2(K.friedmanWert(1001, 0.0418)), 9.91);
  assert.equal(r3(K.friedmanWert(400, 0.076)), 1);
  assert.equal(Math.round(K.friedmanWert(400, 0.038) * 10) / 10, 400);
  // Kür K1: 66 Paare, davon 18 im selben Teiltext → erwartetes I = 0,0484 → k = 3 zurück
  const I = (18 * 0.076 + 48 * 0.038) / 66;
  assert.equal(r4(I), 0.0484);
  assert.equal(r3(K.friedmanWert(12, I)), 3);
  // P04: I = 410/9900 → ≈ 10,1 (0,076/0,038) bzw. ≈ 11,6 (0,0765/0,0385)
  assert.equal(Math.round(K.friedmanWert(100, 410 / 9900) * 10) / 10, 10.1);
  assert.equal(Math.round(K.friedmanWert(100, 410 / 9900, { iD: 0.0765, iZ: 0.0385 }) * 10) / 10, 11.6);
  // Generator 8: für n ∈ {501, 1001}, k = 2 … 8 rundet die Formel auf k zurück (14 Kombinationen)
  let ok = 0;
  for (const n of [501, 1001]) for (let k = 2; k <= 8; k++) {
    const Ik = Math.round((((n - k) * 0.076 + n * (k - 1) * 0.038) / ((n - 1) * k)) * 10000) / 10000;
    if (Math.round(K.friedmanWert(n, Ik)) === k) ok++;
  }
  assert.equal(ok, 14);
  // aus dem Text: Eves Brief ≈ 4,15, Lab-Text GOLD ≈ 6,78
  assert.equal(r2(K.friedman(EVES_BRIEF)), 4.15);
  assert.equal(r2(K.friedman(GOLD_TEXT)), 6.78);
  assert.equal(K.friedman('A'), null);
  assert.throws(() => K.friedmanWert(1, 0.05), K.KryptoFehler);
  assert.throws(() => K.friedmanWert(100, -1), K.KryptoFehler);
});

test('teiltexte ab Position 0', () => assert.equal(K.teiltexte('YLYTXEBYWUTPRP', 3)[1], 'LXYTP'));

test('teiltexte: SPEC W2 (W2-L22-01, Warm-up, Teiltext-Probe, Teiltext-Maxima)', () => {
  assert.deepEqual(K.teiltexte('VCVIZ TSWLE UKXMY', 3), ['VISEX', 'CZWUM', 'VTLKY']);
  assert.deepEqual(K.teiltexte('QWERT ZUIOP AS', 3), ['QRUP', 'WTIA', 'EZOS']);
  assert.deepEqual(K.teiltexte('ABC', 5), ['A', 'B', 'C', '', '']);
  assert.throws(() => K.teiltexte('ABC', 0), K.KryptoFehler);
  // mittlerer Teiltext-Koinzidenzindex Eves Brief, k = 1 … 10 (W2-L23-06) und k = 5 / 10 genau (§9 Testfall 1)
  const mittel = (t, k) => K.teiltexte(t, k).map(K.koinzidenzindex).reduce((a, b) => a + b, 0) / k;
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((k) => r3(mittel(EVES_BRIEF, k))), [0.047, 0.046, 0.046, 0.048, 0.096, 0.044, 0.047, 0.047, 0.042, 0.099]);
  assert.equal(r4(mittel(EVES_BRIEF, 5)), 0.0961);
  assert.equal(r4(mittel(EVES_BRIEF, 10)), 0.0988);
  assert.equal(r4(mittel(GOLD_TEXT, 4)), 0.0914);
  // häufigste Buchstaben je Teiltext: Eves Brief k = 5; GOLD k = 4 (je die zwei häufigsten)
  const spitze = (t) => {
    const h = K.haeufigkeiten(t);
    return K.rangfolge(t).slice(0, 2).map((c) => [c, h[c]]);
  };
  assert.deepEqual(K.teiltexte(EVES_BRIEF, 5).map((t) => spitze(t)[0]), [['A', 11], ['E', 15], ['G', 10], ['L', 7], ['W', 10]]);
  assert.deepEqual(K.teiltexte(GOLD_TEXT, 4).map(spitze), [[['K', 10], ['T', 7]], [['S', 7], ['B', 5]], [['P', 8], ['D', 5]], [['H', 9], ['Q', 6]]]);
});

test('kasiski Eves Brief', () => {
  const r = K.kasiski(EVES_BRIEF);
  assert.deepEqual(r.wiederholungen.find((w) => w.folge === 'ZIG').positionen, [0, 60, 100]);
  assert.equal(r.vorschlag[0], 5);
});

test('kasiski: SPEC W2 §9 Testfälle 1 und 2, Akte W2·2', () => {
  const r = K.kasiski(EVES_BRIEF);
  // nur maximale Wiederholungen, sortiert nach Länge, dann Anzahl, dann erster Position
  assert.deepEqual(r.wiederholungen.map((w) => [w.folge, w.positionen]), [
    ['AVEEDYAAFG', [133, 173]], ['EPKW', [106, 116]], ['ZIG', [0, 60, 100]], ['VEE', [134, 174, 189]],
    ['SHE', [4, 129]], ['KWN', [43, 108]], ['VAR', [69, 154]], ['CEP', [125, 210]],
  ]);
  assert.deepEqual(r.wiederholungen.find((w) => w.folge === 'ZIG').abstaende, [60, 40]);
  assert.deepEqual(r.wiederholungen.find((w) => w.folge === 'VEE').abstaende, [40, 15]);
  // Teilertabelle über die neun Abstände 40, 10, 60, 40, 125, 65, 85, 85, 15 (Akte W2·2 A3c)
  assert.deepEqual(r.abstaende.slice().sort((a, b) => a - b), [10, 15, 40, 40, 60, 65, 85, 85, 125]);
  assert.deepEqual([2, 3, 4, 5, 6, 7, 8, 9, 10].map((t) => r.teiler[t]), [4, 2, 3, 9, 1, 0, 2, 0, 4]);
  assert.deepEqual(Object.keys(r.teiler).map(Number), Array.from({ length: 19 }, (_, i) => i + 2));
  const g = K.kasiski(GOLD_TEXT);
  assert.deepEqual([g.wiederholungen[0].folge, g.wiederholungen[0].positionen], ['WJWPJKGLQJHPQ', [15, 131]]);
  assert.equal(g.abstaende.length, 7);
  assert.deepEqual([g.teiler[2], g.teiler[4]], [7, 7]);
  // Gleichstand: größerer Teiler zuerst (wie der ggT) – GOLD hat Länge 4
  assert.deepEqual(g.vorschlag.slice(0, 2), [4, 2]);
  for (const [f, p] of [['HMSD', [39, 59]], ['RTH', [37, 77]], ['PQT', [102, 142]], ['KGD', [128, 152]]]) {
    assert.deepEqual(g.wiederholungen.find((w) => w.folge === f).positionen, p, f);
  }
});

test('kasiski: Optionen und Grenzfälle', () => {
  const r = K.kasiski(EVES_BRIEF, { min: 4 });
  assert.deepEqual(r.wiederholungen.map((w) => w.folge), ['AVEEDYAAFG', 'EPKW']);
  const leer = K.kasiski('ABCDEFG');
  assert.deepEqual(leer.wiederholungen, []);
  assert.deepEqual(leer.abstaende, []);
  assert.deepEqual(leer.vorschlag, []);
  assert.equal(leer.teiler[2], 0);
  assert.equal(K.kasiski('').wiederholungen.length, 0);
  assert.equal(K.kasiski(EVES_BRIEF, { anzahl: 3 }).wiederholungen.length, 3);
  assert.throws(() => K.kasiski('ABC', { min: 2 }), K.KryptoFehler);
  assert.throws(() => K.kasiski('ABC', { min: 7 }), K.KryptoFehler);
  // Länge höchstens n/2: ABCABCABC → ABC (0, 3, 6), Abstände 3, 3
  assert.deepEqual(K.kasiski('ABCABCABC').wiederholungen.map((w) => [w.folge, w.positionen]), [['ABC', [0, 3, 6]]]);
  assert.deepEqual(K.kasiski('ABCABCABC').abstaende, [3, 3]);
});

test('verschiebungSchaetzen: Korrelation mit DEUTSCH (SPEC W2 §9 Reiter 6)', () => {
  const vorschlag = (t, k) => K.teiltexte(t, k).map((tt) => K.verschiebungSchaetzen(tt).buchstabe).join('');
  assert.equal(vorschlag(EVES_BRIEF, 5), 'WACHS');
  assert.equal(vorschlag(GOLD_TEXT, 4), 'GOLD');
  const v = K.verschiebungSchaetzen(K.caesar('diekurierewartenanderbrueckenebendemfischmarktaufdenabend', 19));
  assert.equal(v.k, 19);
  assert.equal(v.buchstabe, 'T');
  assert.equal(v.werte.length, 26);
  assert.equal(v.kandidaten.length, 3);
  assert.equal(v.kandidaten[0].k, 19);
  assert.ok(v.kandidaten[0].wert >= v.kandidaten[1].wert);
  assert.equal(K.verschiebungSchaetzen('').k, 0); // Gleichstand → kleineres v
});

test('chiQuadrat', () => {
  const klar = 'diekurierewartenanderbrueckenebendemfischmarktaufdenabend';
  assert.ok(K.chiQuadrat(klar) < K.chiQuadrat(K.caesar(klar, 7)));
  assert.equal(K.chiQuadrat(''), null);
  const h = K.haeufigkeiten('EEN');
  const erwartet = K.ALPHABET.split('').reduce((s, c) => s + (h[c] - (3 * K.DEUTSCH[c]) / 100) ** 2 / ((3 * K.DEUTSCH[c]) / 100), 0);
  assert.ok(Math.abs(K.chiQuadrat('EEN') - erwartet) < 1e-9);
});
