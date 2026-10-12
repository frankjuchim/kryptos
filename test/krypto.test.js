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
