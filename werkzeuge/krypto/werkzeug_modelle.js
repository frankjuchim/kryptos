'use strict';
// Werkzeug-Modelle (Plan M11 Task 241, E224–E226): bilden den FREIEN Modus jedes rechnenden Labor-Reiters über Krypto.*
// nach – „Was zeigt das Werkzeug, wenn man die Angaben einer Aufgabe naheliegend eingibt?“ Grundlage für den Erkenner-
// Generator (werkzeuge/krypto/erkenner_bauen.js) und den Test K11. Den geführten Modus prüft K12 an den echten Modulen.
//
// Zustand = { art, bedienung, eingaben, ausAngaben, ausgaben }:
//   art        'allgemein' (Darstellung ohne Angaben: Alphabet, Tafel, Anlage), 'angaben' (Eingaben aus der Aufgabe),
//              'katalog' (fester Katalog ohne Eingabe, z. B. Schlüsselraum-Tabelle)
//   eingaben   { texte, schluessel, zahlen, bits, bitpaare } – genau das, was das Modul dem Erkenner meldet
//              (KRLaborBau.erkenne); Schlüssel als 'k=12', 'u=4', 'n=3', 't=5', 'st=A', 'loch=1,3;…' oder Wort GROSS
//   ausAngaben true, wenn alle Schlüssel/Parameter aus den Angaben stammen (sonst ausprobiert, E224 (3))
//   ausgaben   [{ art: 'text'|'bits'|'zahl'|'folge', wert, etikett?, werte?, nach? }] – Lösungskriterium istVerrat (E225);
//              nach = weitere Bedienung, nach der die Ausgabe erst erscheint (Schalter, Knopf)
//
// Bestandsaufnahme der Eingabefelder je Reiter (Stand M11):
//   scheibe   scheibe: Innenring k, Stempel außen/innen, Textfeld · text: Textfeld, k, Richtung · alle: Geheimtext
//   skytale   skytale: Text, Umfang u, Richtung (+ Liste „Alle Stäbe“) · gartenzaun: Text, Schienen n, Richtung ·
//             fleissner: Text, Lochung (Stanzen), Größe 4/6, Richtung · pfluegen: Text, Zeilenlänge k, Richtung (+ alle k) ·
//             ring: Text, Ringschritt t (Block 8), Richtung (+ Lesereihenfolge)
//   quadrat   polybios: Text/Zahlenpaare, Schlüsselwort (Mehr ausprobieren), Richtung · playfair: Schlüsselwort, Text, Richtung
//   vigenere  quadrat: Tafel (allgemein) · verschluesseln: Text, Schlüsselwort, Verfahren (Vigenère/Autokey/Porta/Pendel), Richtung ·
//             kasiski/teiltexte/koinzidenz/verschiebung/korrektur: Geheimtext, k, Mindestlänge, Korrekturbuchstaben
//   haeufigkeit histogramm/bigramme/teiltexte/kennzahlen: Text (+ k)
//   bitlupe   zeichen: Text ↔ Bits (Anlage) · xor: Text, Schlüssel (Text/Hex/Bits), OTP/Wiederholung · doppelnutzung: C1, C2 (Hex), Crib
//   runden    runden/lawine/verfolgung: Block, Schlüssel (16 Bit), Variante · modi/fehler: Text, Schlüssel, IV · enigma: Text, Stellung
//   modulo    uhr: a, b, m, Rechenart · tabelle: g, m · inverses: a, m · farbmischer: p, g, a, b („Mit Zahlen“)
//   rsa       rechenwerk: p, q, e, m (+ N zerlegen) · euklid: a, b · text: Text, p, q, e
//   hash      schritte: Text · lawine: zwei Texte · kollision: Wörter · baukasten: Wort, Position, neuer Buchstabe · passwort: Salz,
//             Passwort · pruefsumme: zwei Texte
//   analyse   vergleich: eigener Text (feste Beispielschlüssel) · schluesselraum: Katalog · trainer/blick: eigene Beispiele
//   baukasten Werkstatt: Stufen (Caesar, Substitution, Vigenère, Spaltentransposition, Gartenzaun, Umkehrung …) + Probelauf
// Nur Krypto.*; keine eigene Verfahrensrechnung.
const Krypto = require('../../public/static/js/shared/krypto.js');

const MAX_TEXT = 400;
const nb = (t) => Krypto.nurBuchstaben(String(t ?? ''));
const norm = (t) => Krypto.normalisieren(String(t ?? ''));
function versuche(fn) {
  try {
    return fn();
  } catch (e) {
    if (e && e.name === 'KryptoFehler') return null;
    throw e;
  }
}
const leer = () => ({ texte: [], schluessel: [], zahlen: [], bits: [], bitpaare: [] });
const ein = (o) => ({ ...leer(), ...o });
const zust = (art, bedienung, eingaben, ausAngaben, ausgaben) => ({ art, bedienung, eingaben: ein(eingaben), ausAngaben: !!ausAngaben, ausgaben: ausgaben.filter(Boolean) });
const T = (wert) => (wert ? { art: 'text', wert: String(wert) } : null);
const Z = (wert, etikett) => (wert === null || wert === undefined ? null : { art: 'zahl', wert: String(wert), ...(etikett ? { etikett } : {}) });
const BITS = (wert) => (wert ? { art: 'bits', wert: String(wert) } : null);
const FOLGE = (werte) => ({ art: 'folge', werte: werte.map(String) });
const komma = (x, n) => (x === null || x === undefined || !Number.isFinite(x) ? null : x.toFixed(n).replace('.', ','));

/* ---------- Angaben lesen ---------- */
const texte = (A) => (A.texte || []).map(norm).filter((t) => t.length >= 1 && t.length <= MAX_TEXT);
const buchstabenTexte = (A) => [...new Set(texte(A).map(nb).filter(Boolean))];
const parameter = (A, p) => (A.schluessel || []).filter((s) => s.startsWith(`${p}=`)).map((s) => s.slice(p.length + 1));
const zahlParameter = (A, p) => parameter(A, p).map(Number).filter(Number.isInteger);
const woerter = (A) => [...new Set((A.schluessel || []).filter((s) => !s.includes('=')).map(nb).filter((w) => w.length >= 1 && w.length <= 20))];
const zahlen = (A) => [...new Set((A.zahlen || []).filter((n) => Number.isSafeInteger(n) && n >= 0))].slice(0, 12);
const bereich = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const RICHTUNGEN = ['ver', 'ent'];
/** ganze Bitfolgen der Angaben (Bytes in Folge, wie gegeben) und Texte als ASCII-Bits */
function bitfolgen(A) {
  const out = [...new Set(A.bitfolgen || A.bits || [])].filter((b) => /^[01]+$/.test(b) && b.length % 8 === 0 && b.length <= 192);
  return out;
}
const asciiBits = (t) => versuche(() => Krypto.textZuBits(t, { gruppe: 0 }));
const bytesVon = (bits) => {
  const out = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) out.push(bits.slice(i, i + 8));
  return out;
};
/** ausgerichtete Bytepaare zweier Bitfolgen (Schlüssel wird wiederholt) */
function paare(a, b) {
  const x = bytesVon(a);
  const y = bytesVon(b);
  if (!x.length || !y.length) return [];
  return x.map((bx, i) => [bx, y[i % y.length]]);
}
const textBits = (bits) => versuche(() => Krypto.bitsZuText(bits)) || '';

/* ---------- Text-Verfahren ---------- */

function caesarZustaende(A) {
  const out = [];
  const ks = new Set(zahlParameter(A, 'k'));
  for (const t of buchstabenTexte(A)) {
    for (const k of bereich(0, 25)) {
      for (const r of RICHTUNGEN) out.push(zust('angaben', `${r} k=${k}`, { texte: [t], schluessel: [`k=${k}`] }, ks.has(k), [T(Krypto.caesar(t, k, r))]));
    }
  }
  for (const k of ks) if (k >= 0 && k <= 25) out.push(zust('allgemein', `Alphabetleiste k=${k}`, { texte: [Krypto.ALPHABET], schluessel: [`k=${k}`] }, true, [T(Krypto.caesar(Krypto.ALPHABET, k))]));
  return out;
}

function* alleCaesar(A) {
  for (const t of buchstabenTexte(A)) yield zust('angaben', 'alle Verschiebungen', { texte: [t] }, true, Krypto.alleCaesar(t).map((x) => T(x.text)));
}

function* skytaleZ(A) {
  const us = new Set(zahlParameter(A, 'u'));
  for (const t of buchstabenTexte(A)) {
    for (const u of bereich(2, 10)) {
      for (const r of RICHTUNGEN) {
        const w = versuche(() => Krypto.skytale(t, u, r));
        if (w) yield zust('angaben', `${r} u=${u}`, { texte: [t], schluessel: [`u=${u}`] }, us.has(u), [T(w)]);
      }
    }
    // „Alle Stäbe u = 2 … 10“ (abgefangener Geheimtext, ohne Füllzeichen)
    yield zust('angaben', 'alle Stäbe', { texte: [t] }, true, bereich(2, 10).map((u) => T(versuche(() => Krypto.skytale(t, u, 'ent', { fuellzeichen: null })))));
  }
}

function* zaunZ(A) {
  const ns = new Set(zahlParameter(A, 'n'));
  for (const t of buchstabenTexte(A)) {
    for (const n of bereich(2, 8)) {
      for (const r of RICHTUNGEN) {
        const w = versuche(() => Krypto.gartenzaun(t, n, r));
        if (w) yield zust('angaben', `${r} n=${n}`, { texte: [t], schluessel: [`n=${n}`] }, ns.has(n), [T(w)]);
      }
    }
  }
}

/** Lochungen aus den Angaben: 'loch=1,3;2,2' → { groesse, schablone } */
function lochungen(A) {
  return parameter(A, 'loch').map((s) => {
    const schablone = s.split(';').map((p) => p.split(',').map(Number));
    const max = Math.max(...schablone.flat());
    return { schluessel: `loch=${s}`, groesse: max <= 4 ? 4 : 6, schablone };
  });
}
function* fleissnerZ(A) {
  for (const l of lochungen(A)) {
    for (const t of buchstabenTexte(A)) {
      for (const r of RICHTUNGEN) {
        const w = versuche(() => Krypto.fleissner(t, l.groesse, l.schablone, r));
        if (w) yield zust('angaben', `${r} ${l.schluessel}`, { texte: [t], schluessel: [l.schluessel] }, true, [T(w)]);
      }
    }
  }
}

function* pfluegenZ(A) {
  const ks = new Set(zahlParameter(A, 'k'));
  for (const t of buchstabenTexte(A)) {
    for (const k of bereich(2, 12)) {
      for (const r of RICHTUNGEN) {
        const w = versuche(() => Krypto.pfluegen(t, k, r));
        if (w) yield zust('angaben', `${r} k=${k}`, { texte: [t], schluessel: [`k=${k}`] }, ks.has(k), [T(w)]);
      }
    }
    yield zust('angaben', 'alle Zeilenlängen', { texte: [t] }, true, bereich(2, 12).map((k) => T(versuche(() => Krypto.pfluegen(t, k, 'ent')))));
  }
}

function* ringZ(A) {
  const ts = new Set(zahlParameter(A, 't'));
  for (const t of bereich(1, 7)) {
    const folge = versuche(() => Krypto.ringFolge(8, t));
    if (folge) yield zust('angaben', `Lesereihenfolge t=${t}`, { schluessel: [`t=${t}`] }, ts.has(t), [FOLGE(folge.folge)]);
  }
  for (const text of buchstabenTexte(A)) {
    for (const t of bereich(1, 7)) {
      for (const r of RICHTUNGEN) {
        const w = versuche(() => Krypto.ring(text, t, r, { block: 8 }));
        if (w) yield zust('angaben', `${r} t=${t}`, { texte: [text], schluessel: [`t=${t}`] }, ts.has(t), [T(w)]);
      }
    }
  }
}

function* polybiosZ(A) {
  const ws = ['', ...woerter(A)];
  for (const w of ws) {
    if (w) {
      const q = versuche(() => Krypto.quadrat(w));
      if (q) yield zust('angaben', `Quadrat ${w}`, { schluessel: [w] }, true, [T(q.join(''))]);
    }
    for (const t of texte(A)) {
      for (const r of RICHTUNGEN) {
        const roh = r === 'ent' ? t.replace(/[^0-9]/g, '') : nb(t);
        if (!roh) continue;
        const aus = versuche(() => Krypto.polybios(roh, w ? { schluessel: w } : {}, r));
        if (aus) yield zust('angaben', `${r}${w ? ` ${w}` : ''}`, { texte: [t], schluessel: w ? [w] : [] }, true, [T(aus)]);
      }
    }
  }
}

const PLAYFAIR_BEISPIEL = 'LEUCHTFEUER';
function* playfairZ(A) {
  const eigen = new Set(woerter(A));
  for (const w of [...eigen, PLAYFAIR_BEISPIEL]) {
    const q = versuche(() => Krypto.quadrat(w));
    if (!q) continue;
    if (eigen.has(w)) yield zust('angaben', `Quadrat ${w}`, { schluessel: [w] }, true, [T(q.join(''))]);
    for (const t of buchstabenTexte(A)) {
      for (const r of RICHTUNGEN) {
        const aus = versuche(() => Krypto.playfair(t, w, r));
        if (aus) yield zust('angaben', `${r} ${w}`, { texte: [t], schluessel: [w] }, eigen.has(w), [T(aus)]);
      }
    }
  }
  for (const t of buchstabenTexte(A)) {
    const p = versuche(() => Krypto.playfairPaare(t));
    if (p) yield zust('angaben', 'Paare bilden', { texte: [t] }, true, [T(p.join(' '))]);
  }
}

const VIG_MODI = ['vigenere', 'autokey', 'porta', 'pendel'];
function vigRechne(t, s, modus, r) {
  const folge = modus === 'pendel' ? Krypto.pendelFolge(s) : s;
  const aus = modus === 'autokey' ? Krypto.autokey(t, s, r) : modus === 'porta' ? Krypto.porta(t, s, r) : Krypto.vigenere(t, folge, r);
  const strom = Krypto.schluesselstrom(t, s, { modus: modus === 'autokey' ? 'autokey' : modus === 'pendel' ? 'pendel' : 'vigenere', richtung: r });
  return [T(aus), T(strom)];
}
function* vigenereZ(A) {
  const eigen = woerter(A);
  // Schlüsselstrom allein (beliebiger eigener Text, Schlüssel aus den Angaben – Pendelfolge W6-L2-02)
  for (const s of eigen) {
    for (const m of VIG_MODI) {
      const strom = versuche(() => Krypto.schluesselstrom('A'.repeat(24), s, { modus: m === 'autokey' ? 'autokey' : m === 'pendel' ? 'pendel' : 'vigenere', richtung: 'ver' }));
      if (strom) yield zust('angaben', `Strom ${m} ${s}`, { schluessel: [s] }, true, [T(strom)]);
    }
  }
  const tx = buchstabenTexte(A);
  // Schlüssel: Wörter der Angaben, auch die anderen Texte (E224 (4): Klartext als Schlüssel)
  const schl = [...new Set([...eigen, ...tx])].filter((s) => s.length >= 1 && s.length <= 20);
  for (const t of tx) {
    for (const s of schl) {
      if (s === t) continue;
      for (const m of VIG_MODI) {
        for (const r of RICHTUNGEN) {
          const aus = versuche(() => vigRechne(t, s, m, r));
          if (aus) yield zust('angaben', `${m} ${r} ${s}`, { texte: [t], schluessel: [s] }, true, aus);
        }
      }
    }
  }
}

function* kasiskiZ(A) {
  for (const t of buchstabenTexte(A)) {
    if (t.length < 8) continue;
    for (const min of [3, 4, 5, 6]) {
      const kas = versuche(() => Krypto.kasiski(t, { min }));
      if (!kas) continue;
      const aus = [];
      for (const w of kas.wiederholungen) {
        aus.push(T(w.folge));
        for (const p of w.positionen) aus.push(Z(p, 'pos'));
        for (const d of w.abstaende) aus.push(Z(d, 'abstand'));
      }
      const teiler = Krypto.teilerTabelle(kas.abstaende, { von: 2, bis: 20 });
      aus.push(FOLGE(Object.values(teiler)));
      yield zust('angaben', `Kasiski min=${min}`, { texte: [t] }, true, aus);
    }
  }
}

const TEIL_CACHE = new Map();
function teiltexteAus(t, k) {
  const schl = `${k}|${t}`;
  if (!TEIL_CACHE.has(schl)) {
    if (TEIL_CACHE.size > 5000) TEIL_CACHE.clear();
    TEIL_CACHE.set(schl, teiltexteRechne(t, k));
  }
  return TEIL_CACHE.get(schl);
}
function teiltexteRechne(t, k) {
  const teile = Krypto.teiltexte(t, k);
  const schaetzung = teile.map((x) => versuche(() => Krypto.verschiebungSchaetzen(x)));
  return { teile, schaetzung, vorschlag: schaetzung.map((x) => (x ? x.buchstabe : 'A')).join('') };
}
function* teiltexteZ(A) {
  const ks = new Set(zahlParameter(A, 'k'));
  for (const t of buchstabenTexte(A)) {
    for (const k of bereich(1, 12)) {
      if (k > t.length) break;
      const b = teiltexteAus(t, k);
      const aus = [...b.teile.map(T)];
      // Schalter „um den Schlüsselbuchstaben zurückschieben“
      b.teile.forEach((x, j) => aus.push({ ...T(versuche(() => Krypto.caesar(x, Krypto.wert(b.vorschlag[j], 0), 'ent'))), nach: 'Schalter zurückschieben' }));
      yield zust('angaben', `Teiltexte k=${k}`, { texte: [t], schluessel: [`k=${k}`] }, ks.has(k), aus);
    }
  }
}

const KOINZ_CACHE = new Map();
function* koinzidenzZ(A) {
  for (const t of buchstabenTexte(A)) {
    if (KOINZ_CACHE.has(t)) { if (KOINZ_CACHE.get(t)) yield KOINZ_CACHE.get(t); continue; }
    const z = koinzidenzRechne(t);
    if (KOINZ_CACHE.size > 2000) KOINZ_CACHE.clear();
    KOINZ_CACHE.set(t, z);
    if (z) yield z;
  }
}
function koinzidenzRechne(t) {
  {
    if (t.length < 2) return null;
    const br = Krypto.koinzidenzindexBruch(t);
    const ic = Krypto.koinzidenzindex(t);
    const aus = [T(br ? `${br.zaehler}/${br.nenner}` : ''), Z(komma(ic, 4), 'I'), Z(komma(ic, 3), 'I')];
    const f = versuche(() => Krypto.friedman(t));
    if (t.length >= 30 && f !== null && f > 0) aus.push(Z(komma(f, 2), 'k'));
    const mittel = bereich(1, 20).map((k) => komma(versuche(() => Krypto.mittlererKoinzidenzindex(t, k)), 4)).filter(Boolean);
    for (const m of mittel) aus.push(Z(m));
    return zust('angaben', 'Koinzidenzindex', { texte: [t] }, true, aus);
  }
}

function* verschiebungZ(A) {
  const ks = new Set(zahlParameter(A, 'k'));
  for (const t of buchstabenTexte(A)) {
    for (const k of bereich(1, 12)) {
      if (k > t.length) break;
      const b = teiltexteAus(t, k);
      yield zust('angaben', `Verschiebung k=${k}`, { texte: [t], schluessel: [`k=${k}`] }, ks.has(k), [{ art: 'text', wert: b.vorschlag, etikett: 's' }]);
    }
  }
}

function* korrekturZ(A) {
  const ks = new Set(zahlParameter(A, 'k'));
  for (const t of buchstabenTexte(A)) {
    for (const k of bereich(1, 12)) {
      if (k > t.length) break;
      const b = teiltexteAus(t, k);
      yield zust('angaben', `Korrektur k=${k} (Vorschlag)`, { texte: [t], schluessel: [`k=${k}`] }, ks.has(k), [T(b.vorschlag), T(versuche(() => Krypto.vigenere(t, b.vorschlag, 'ent')))]);
    }
    for (const s of woerter(A)) yield zust('angaben', `Korrektur ${s}`, { texte: [t], schluessel: [s] }, true, [T(versuche(() => Krypto.vigenere(t, s, 'ent')))]);
  }
}

/* ---------- Häufigkeit ---------- */

function* histogrammZ(A) {
  for (const t of buchstabenTexte(A)) {
    const hf = Krypto.haeufigkeiten(t);
    yield zust('angaben', 'Histogramm', { texte: [t] }, true, [T(Krypto.rangfolge(t).join('')), ...Object.values(hf).map((n) => Z(n))]);
  }
}
function* bigrammeZ(A) {
  for (const t of buchstabenTexte(A)) {
    const aus = [];
    for (const n of [2, 3]) for (const g of versuche(() => Krypto.ngramme(t, { n, top: 10 })) || []) aus.push(T(g.folge), Z(g.anzahl));
    yield zust('angaben', 'Bigramme', { texte: [t] }, true, aus);
  }
}
function* hTeiltexteZ(A) {
  const ks = new Set(zahlParameter(A, 'k'));
  for (const t of buchstabenTexte(A)) {
    for (const k of bereich(1, 12)) {
      if (k > t.length) break;
      yield zust('angaben', `Teiltexte k=${k}`, { texte: [t], schluessel: [`k=${k}`] }, ks.has(k), Krypto.teiltexte(t, k).map((x, j) => (j ? { ...T(x), nach: `Start s = ${j + 1}` } : T(x))));
    }
  }
}
function* kennzahlenZ(A) {
  for (const t of buchstabenTexte(A)) {
    if (t.length < 2) continue;
    const br = Krypto.koinzidenzindexBruch(t);
    const ic = Krypto.koinzidenzindex(t);
    const aus = [Z(t.length, 'n'), T(br ? `${br.zaehler}/${br.nenner}` : ''), Z(komma(ic, 4), 'I'), Z(komma(ic, 3), 'I')];
    const f = versuche(() => Krypto.friedman(t));
    if (f !== null && f > 0) aus.push(Z(komma(f, 2), 'k'));
    yield zust('angaben', 'Kennzahlen', { texte: [t] }, true, aus);
  }
}

/* ---------- Bits ---------- */

/** Operanden: gegebene Bitfolgen und Texte als ASCII-Bits (Großschreibung wie gegeben) */
function operanden(A) {
  const out = bitfolgen(A).map((b) => ({ bits: b, art: 'bits' }));
  for (const t of texte(A)) if (t.length <= 24) { const b = asciiBits(t); if (b) out.push({ bits: b, art: 'text', text: t }); }
  return out;
}
function* xorZ(A) {
  const ops = operanden(A);
  for (const a of ops) {
    for (const b of ops) {
      if (a === b || a.art === 'text' && b.art === 'text') continue;
      for (const modus of ['otp', 'wiederholung']) {
        if (modus === 'otp' && a.bits.length !== b.bits.length) continue;
        if (modus === 'wiederholung' && b.bits.length > a.bits.length) continue;
        const strom = bytesVon(a.bits).map((_, i) => bytesVon(b.bits)[i % bytesVon(b.bits).length]).join('');
        const e = versuche(() => Krypto.xorBits(a.bits, strom));
        if (!e) continue;
        yield zust('angaben', `XOR ${modus}`, { bitpaare: paare(a.bits, b.bits) }, true, [BITS(e), T(textBits(e))]);
      }
    }
  }
}
function* doppelZ(A) {
  const bf = bitfolgen(A);
  for (let i = 0; i < bf.length; i++) {
    for (let j = 0; j < bf.length; j++) {
      if (i === j) continue;
      const n = Math.min(bf[i].length, bf[j].length);
      if (n < 8) continue;
      const e = versuche(() => Krypto.xorBits(bf[i].slice(0, n), bf[j].slice(0, n)));
      if (!e) continue;
      const aus = [BITS(e)];
      // Crib-Schieber: jedes Wort der Angaben an jeder Position
      for (const t of texte(A)) {
        const cb = asciiBits(t);
        if (!cb) continue;
        for (let p = 0; p + 8 <= e.length; p += 8) {
          const stueck = e.slice(p, p + cb.length);
          const x = versuche(() => Krypto.xorBits(stueck, cb.slice(0, stueck.length)));
          if (x) aus.push(T(textBits(x)), BITS(x));
        }
      }
      yield zust('angaben', 'C1 ⊕ C2', { bitpaare: paare(bf[i].slice(0, n), bf[j].slice(0, n)) }, true, aus);
    }
  }
}

/* ---------- Runden-Labor ---------- */

/** 16-Bit-Blöcke als Bits: gegebene 16-Bit-Folgen und Texte mit zwei Zeichen (ASCII) */
function bloecke16(A) {
  const out = [];
  for (const b of bitfolgen(A)) if (b.length === 16) out.push(b);
  for (const t of texte(A)) if (t.length === 2) { const b = asciiBits(t); if (b) out.push(b); }
  return [...new Set(out)];
}
const zahlVon = (bits) => Krypto.bitsZuByte(bits.slice(0, 8)) * 256 + Krypto.bitsZuByte(bits.slice(8, 16));
const bits16 = (n) => Krypto.byteZuBits(Math.floor(n / 256)) + Krypto.byteZuBits(n % 256);
/** alle 16-Bit-Zustände eines Protokolls als Bits */
const zustaendeAus = (wert) => {
  const out = [];
  (function lauf(x, schl) {
    if (Number.isInteger(x) && x >= 0 && x <= 0xffff && !['runde', 'anzahl'].includes(schl)) out.push(bits16(x));
    else if (Array.isArray(x)) x.forEach((y) => lauf(y, schl));
    else if (x && typeof x === 'object') for (const [k, v] of Object.entries(x)) lauf(v, k);
  })(wert, '');
  return out;
};
function* rundenZ(A) {
  const bl = bloecke16(A);
  for (const b of bl) {
    const n = zahlVon(b);
    yield zust('angaben', 'Transponieren / S-Box', { bits: [b] }, true, [BITS(bits16(Krypto.kryptos16.transponiere(n))), BITS(bits16(Krypto.kryptos16.sbox(n)))]);
    // Schlüsselplan aus einem Schlüssel allein (Runden 1–4)
    yield zust('angaben', 'Schlüsselplan', { bits: [b] }, true, bereich(1, 4).map((r) => BITS(bits16(Krypto.kryptos16.rundenschluessel(n, r)))));
    for (const k of bl) {
      if (k === b) continue;
      const kn = zahlVon(k);
      for (const sbox of [true, false]) {
        const p = versuche(() => Krypto.kryptos16.verschluesseln(n, kn, { runden: 4, protokoll: true, sbox }));
        if (p) yield zust('angaben', `Runden ${sbox ? 'mit' : 'ohne'} S-Box`, { bits: [b, k], bitpaare: paare(b, k) }, true, zustaendeAus(p).map(BITS));
      }
      const rm = versuche(() => Krypto.rm16.verschluesseln(n, kn, { runden: 3, protokoll: true }));
      if (rm) yield zust('angaben', 'RM-16', { bits: [b, k], bitpaare: paare(b, k) }, true, zustaendeAus(rm).map(BITS));
    }
  }
}
function* lawineZ(A) {
  const bl = bloecke16(A);
  for (const b of bl) {
    for (const k of bl) {
      if (k === b) continue;
      const aus = [...zustaendeAus(versuche(() => Krypto.kryptos16.verschluesseln(zahlVon(b), zahlVon(k), { runden: 4, protokoll: true }))).map(BITS)];
      for (const c of bl) if (c !== b && c !== k) aus.push(...zustaendeAus(versuche(() => Krypto.kryptos16.verschluesseln(zahlVon(c), zahlVon(k), { runden: 4, protokoll: true }))).map(BITS));
      for (let bit = 0; bit < 16; bit++) {
        const l = versuche(() => Krypto.kryptos16.lawine(zahlVon(b), zahlVon(k), bit));
        if (l) aus.push(FOLGE(l.map((x) => x.anzahl)));
      }
      yield zust('angaben', 'Lawine', { bits: [b, k], bitpaare: paare(b, k) }, true, aus);
    }
  }
}
function* modiZ(A) {
  const keys = bloecke16(A);
  for (const t of texte(A)) {
    if (t.length < 3) continue;
    const bloecke = versuche(() => Krypto.kryptos16.textZuBloecken(t));
    if (!bloecke) continue;
    for (const k of keys) {
      for (const iv of [null, ...keys.filter((x) => x !== k)]) {
        for (const art of ['ECB', 'CBC']) {
          if (art === 'CBC' && !iv) continue;
          const m = versuche(() => Krypto.kryptos16.modus(bloecke, zahlVon(k), art, iv ? zahlVon(iv) : null));
          if (m) yield zust('angaben', art, { texte: [t], bits: [k, ...(iv ? [iv] : [])] }, true, zustaendeAus(m).map(BITS));
        }
      }
    }
  }
}
function* miniEnigmaZ(A) {
  const st = new Set(parameter(A, 'st'));
  for (const t of buchstabenTexte(A)) {
    if (!/^[A-H]+$/.test(t)) continue;
    for (const s of 'ABCDEFGH') {
      for (const r of RICHTUNGEN) {
        const aus = versuche(() => Krypto.miniEnigma(t, s, r));
        if (aus) yield zust('angaben', `${r} st=${s}`, { texte: [t], schluessel: [`st=${s}`] }, st.has(s), [T(aus)]);
      }
    }
  }
}

/* ---------- Zahlen ---------- */

const ZAHL_MAX = 100000;
function* tripel(liste, f) {
  for (const a of liste) for (const b of liste) for (const c of liste) if (a !== b || b !== c) yield* f(a, b, c);
}
function* uhrZ(A) {
  const zs = zahlen(A).filter((n) => n <= ZAHL_MAX);
  yield* tripel(zs, function* (a, b, m) {
    if (m < 2 || m > 200 || b > 200 || a > 1000) return;
    const kette = versuche(() => Krypto.modpow(a, b, m, { protokoll: true }));
    const potenzen = b >= 1 && b <= 40 ? bereich(1, b).map((x) => versuche(() => Krypto.modpow(a, x, m))) : [];
    yield zust('angaben', `uhr ${a},${b} mod ${m}`, { zahlen: [a, b, m] }, true, [
      Z(Krypto.mod(a + b, m), 'summe'), Z(Krypto.mod(a * b, m), 'produkt'), kette ? Z(kette.wert, 'potenz') : null,
      kette ? FOLGE(kette.schritte.map((s) => s.ergebnis)) : null, kette ? FOLGE(kette.schritte.map((s) => s.basis)) : null, FOLGE(potenzen)
    ]);
  });
}
function* tabelleZ(A) {
  const zs = zahlen(A).filter((n) => n <= 200);
  for (const g of zs) for (const m of zs) {
    if (m < 2 || g === m) continue;
    const werte = bereich(1, m - 1).map((x) => versuche(() => Krypto.modpow(g, x, m)));
    yield zust('angaben', `Tabelle ${g}^x mod ${m}`, { zahlen: [g, m] }, true, [FOLGE(werte), Z(versuche(() => Krypto.ordnung(g, m)), 'ordnung')]);
  }
}
function* inversesZ(A) {
  const zs = zahlen(A).filter((n) => n <= 200);
  for (const a of zs) for (const m of zs) {
    if (m < 2 || a === m) continue;
    const inv = versuche(() => Krypto.inverses(a, m));
    yield zust('angaben', `Inverses ${a} mod ${m}`, { zahlen: [a, m] }, true, [Z(inv, 'inv'), FOLGE(bereich(1, m - 1).map((x) => Krypto.mod(a * x, m)))]);
  }
}
function* farbmischerZ(A) {
  const zs = zahlen(A).filter((n) => n <= 1000);
  for (const p of zs.filter((x) => Krypto.istPrim(x))) for (const g of zs) for (const a of zs) for (const b of zs) {
    if (g >= p || a === b || a >= p || b >= p || g < 2) continue;
    const AA = versuche(() => Krypto.modpow(g, a, p));
    const BB = versuche(() => Krypto.modpow(g, b, p));
    if (AA === null || BB === null) continue;
    yield zust('angaben', `DH p=${p} g=${g} a=${a} b=${b}`, { zahlen: [p, g, a, b] }, true, [Z(AA, 'A'), Z(BB, 'B'), Z(versuche(() => Krypto.modpow(BB, a, p)), 'k'), Z(versuche(() => Krypto.modpow(AA, b, p)), 'k')]);
  }
}
function* rechenwerkZ(A) {
  const zs = zahlen(A).filter((n) => n <= ZAHL_MAX);
  const primz = zs.filter((x) => x >= 2 && Krypto.istPrim(x));
  for (const p of primz) for (const q of primz) for (const e of zs) {
    if (p === q || e < 2) continue;
    const s = versuche(() => Krypto.rsa.schluessel(p, q, e));
    const N = p * q;
    const phi = (p - 1) * (q - 1);
    const aus = [Z(N, 'N'), Z(phi, 'φ')];
    if (s) aus.push(Z(s.d, 'd'));
    for (const m of zs) {
      if (m >= N) continue;
      const c = versuche(() => Krypto.rsa.verschluesseln(m, e, N));
      if (c !== null) aus.push(Z(c, 'c'));
      const kette = versuche(() => Krypto.modpow(m, e, N, { protokoll: true }));
      if (kette) aus.push(FOLGE(kette.schritte.map((x) => x.basis)), FOLGE(kette.schritte.map((x) => x.ergebnis)));
      if (s) {
        const k2 = versuche(() => Krypto.modpow(m, s.d, N, { protokoll: true }));
        if (k2) aus.push(Z(k2.wert, 'm'), FOLGE(k2.schritte.map((x) => x.basis)), FOLGE(k2.schritte.map((x) => x.ergebnis)));
      }
    }
    yield zust('angaben', `RSA p=${p} q=${q} e=${e}`, { zahlen: [p, q, e] }, true, aus);
  }
  // Eve-Modus „N zerlegen“ (Probedivision)
  for (const n of zs) {
    if (n < 4 || n > ZAHL_MAX || Krypto.istPrim(n)) continue;
    const pd = versuche(() => Krypto.probedivision(n));
    if (pd && pd.teiler) yield zust('angaben', `N zerlegen ${n}`, { zahlen: [n] }, true, [Z(pd.teiler, 'p'), Z(n / pd.teiler, 'q')]);
  }
}
function* euklidZ(A) {
  const zs = zahlen(A).filter((n) => n <= ZAHL_MAX);
  for (const a of zs) for (const b of zs) {
    if (a <= b || b < 1) continue;
    const e = versuche(() => Krypto.erweiterterEuklid(a, b));
    if (!e) continue;
    const sp = (f) => FOLGE(e.schritte.map((x) => x[f]).filter((x) => x !== null));
    const spR = (f) => FOLGE(e.schritte.map((x) => x[f]).filter((x) => x !== null).reverse());
    yield zust('angaben', `Euklid ${a}, ${b}`, { zahlen: [a, b] }, true, [sp('q'), sp('r'), sp('x'), sp('y'), spR('x'), spR('y'), Z(e.ggt, 'ggT'), Z(Krypto.mod(e.y, a), 'd'), Z(e.y, 'y'), Z(e.x, 'x')]);
  }
}
function* rsaTextZ(A) {
  const zs = zahlen(A).filter((n) => n <= 1000);
  const primz = zs.filter((x) => Krypto.istPrim(x));
  for (const t of buchstabenTexte(A)) for (const p of primz) for (const q of primz) for (const e of zs) {
    if (p === q || e < 2) continue;
    const N = p * q;
    const z = versuche(() => Krypto.zahlen(t));
    if (!z) continue;
    const c = z.map((m) => versuche(() => Krypto.modpow(m, e, N)));
    yield zust('angaben', `Text p=${p} q=${q} e=${e}`, { texte: [t], zahlen: [p, q, e] }, true, [FOLGE(z), FOLGE(c)]);
  }
}

/* ---------- Hash ---------- */

function khProtokoll(t) {
  const p = versuche(() => Krypto.kryptosHash(t, { protokoll: true }));
  if (!p) return [];
  const s = p.schritte;
  return [Z(p.wert, 'h'), FOLGE(s.map((x) => x.nachher)), FOLGE(s.flatMap((x) => [x.summe, x.nachher])), FOLGE(s.map((x) => x.summe)), FOLGE(s.flatMap((x) => [x.w, x.nachher])), FOLGE(s.flatMap((x) => [x.w, x.summe, x.nachher])), FOLGE(s.flatMap((x) => [x.vorher, x.w, x.summe, x.nachher]))];
}
function* schritteZ(A) {
  for (const t of buchstabenTexte(A)) yield zust('angaben', 'KH Schritt für Schritt', { texte: [t] }, true, khProtokoll(t));
}
function* kollisionZ(A) {
  for (const t of buchstabenTexte(A)) yield zust('angaben', 'Schubfach', { texte: [t] }, true, [Z(versuche(() => Krypto.kryptosHash(t)), 'h')]);
}
function* baukastenHashZ(A) {
  for (const t of buchstabenTexte(A)) {
    if (t.length < 2) continue;
    const aus = [];
    for (let j = 1; j < t.length; j++) for (const neu of Krypto.ALPHABET) {
      const x = versuche(() => Krypto.kryptosHash.ausgleichen(t, j, neu));
      if (x && x.wort) aus.push(T(x.wort));
    }
    yield zust('angaben', 'Kollisionsbaukasten', { texte: [t] }, true, aus);
  }
}
function* passwortZ(A) {
  const tx = buchstabenTexte(A).filter((t) => t.length <= 20);
  for (const s of tx) for (const p of tx) {
    if (s === p) continue;
    yield zust('angaben', `Salz ${s} + ${p}`, { texte: [s + p], schluessel: [s] }, true, khProtokoll(s + p));
  }
}
function* pruefsummeZ(A) {
  for (const t of buchstabenTexte(A)) {
    const S = versuche(() => Krypto.pruefsumme(t, 'summe'));
    const G = versuche(() => Krypto.pruefsumme(t, 'gewichtet'));
    yield zust('angaben', 'Prüfsummen', { texte: [t] }, true, [Z(S, 's'), Z(G, 'g')]);
  }
}
function* lawineHashZ(A) {
  for (const t of buchstabenTexte(A)) {
    const h = versuche(() => Krypto.sha256(Krypto.klein(t)));
    yield zust('angaben', 'SHA-256', { texte: [t] }, true, [T(h)]);
  }
}

/* ---------- Angreifer-Labor ---------- */

const ANALYSE_FEST = { zuordnung: 'QWERTZUIOPASDFGHJKLYXCVBNM', playfair: 'LEUCHTFEUER', vigenere: 'ZIMT' };
function* vergleichZ(A) {
  for (const t of buchstabenTexte(A)) {
    const aus = [
      versuche(() => Krypto.skytale(t, 5)), versuche(() => Krypto.pfluegen(t, 6)), versuche(() => Krypto.caesar(t, 3)),
      versuche(() => Krypto.substitution(t, ANALYSE_FEST.zuordnung)), versuche(() => Krypto.playfair(t, ANALYSE_FEST.playfair)), versuche(() => Krypto.vigenere(t, ANALYSE_FEST.vigenere))
    ].map(T);
    yield zust('angaben', 'Häufigkeitsvergleich (feste Beispielschlüssel)', { texte: [t] }, false, aus);
  }
}
const LEISTUNG = [6, 9, 15];
const HOCHZIFFER = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9' };
/** Anzeige großer Anzahlen wie KRStation.ungefaehr (nur Darstellung): bis 6 Stellen ganz, sonst „≈ m,m · 10ᵉ“ */
function ungefaehr(anzahl) {
  const z = String(anzahl ?? '').replace(/^0+(?=\d)/, '');
  if (!/^\d+$/.test(z) || z.length <= 6) return [Z(z)];
  let m = Math.round(Number(z.slice(0, 3)) / 10);
  let e = z.length - 1;
  if (m >= 100) { m = 10; e += 1; }
  return [Z(`${Math.floor(m / 10)},${String(m).slice(-1)}`), Z(String(e), 'exp')];
}
/** Exponent aus „≈ 1,3 · 10¹⁰ Jahre“ (Darstellung von Krypto.suchdauer) */
function exponent(text) {
  const m = /10([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/.exec(String(text ?? ''));
  return m ? [...m[1]].map((c) => HOCHZIFFER[c]).join('') : null;
}
let katalogCache = null;
function* schluesselraumZ() {
  if (!katalogCache) katalogCache = [...schluesselraumRechne()];
  yield* katalogCache;
}
function* schluesselraumRechne() {
  // Katalog ohne Eingabe (nur Bandlänge 12–60 und Rechenleistung): jede angezeigte Zahl und Dauer
  const verfahren = [['caesar', {}], ['affin', {}], ['substitution', {}], ['playfair', {}], ['vigenere', { laenge: 6 }], ['fleissner', { groesse: 6 }], ['enigma', { kabel: 10 }]];
  for (const n of bereich(12, 60)) { verfahren.push(['skytale', { n }]); verfahren.push(['pfluegen', { n }]); }
  for (const [v, o] of verfahren) {
    const raum = versuche(() => Krypto.schluesselraum(v, o));
    if (!raum) continue;
    for (const l of LEISTUNG) {
      const d = versuche(() => Krypto.suchdauer(raum.log10, Number(`1e${l}`)));
      yield zust('katalog', `${v} ${JSON.stringify(o)} 10^${l}/s`, {}, true, [...ungefaehr(raum.anzahl), T(raum.formel), d ? T(d.text) : null, d ? Z(exponent(d.text), 'exp') : null]);
    }
  }
}

function* enigmaKatalog() {
  const raum = versuche(() => Krypto.schluesselraum('enigma', { kabel: 10 }));
  yield zust('katalog', 'Hintergrund Schlüsselraum', {}, true, [Z('60'), Z(Krypto.schluesselraum('vigenere', { laenge: 3 }).anzahl), ...(raum ? ungefaehr(raum.anzahl) : [])]);
}

/* ---------- Werkstatt-Baukasten ---------- */

function stufenAus(A) {
  const out = [{ typ: 'umkehrung', param: {}, schl: [] }];
  for (const k of zahlParameter(A, 'k')) if (k >= 0 && k <= 25) out.push({ typ: 'caesar', param: { k }, schl: [`k=${k}`] });
  for (const n of zahlParameter(A, 'n')) if (n >= 2 && n <= 10) out.push({ typ: 'gartenzaun', param: { zeilen: n }, schl: [`n=${n}`] });
  for (const w of woerter(A)) {
    out.push({ typ: 'vigenere', param: { schluessel: w }, schl: [w] });
    out.push({ typ: 'substitution', param: { schluesselwort: w }, schl: [w] });
    out.push({ typ: 'spaltentransposition', param: { schluessel: w }, schl: [w] });
  }
  // Spaltentransposition mit Spaltenzahl (W6-L1-06: 3 Spalten)
  for (const n of zahlen(A).filter((x) => x >= 2 && x <= 8)) out.push({ typ: 'spaltentransposition', param: { schluessel: bereich(1, n).join(' ') }, schl: [`spalten=${n}`] });
  return out;
}
function* baukastenZ(A) {
  const stufen = stufenAus(A);
  // Geheimtextalphabet zum Schlüsselwort (Alphabet-Trick, W1-L1-01)
  for (const w of woerter(A)) {
    const al = versuche(() => Krypto.schluesselwortAlphabet(w));
    if (al) yield zust('angaben', `Alphabet ${w}`, { schluessel: [w] }, true, [T(al)]);
  }
  const ketten = [];
  for (const a of stufen) { ketten.push([a]); for (const b of stufen) if (b !== a) ketten.push([a, b]); }
  for (const t of buchstabenTexte(A)) {
    for (const kette of ketten) {
      const verfahren = { version: 1, stufen: kette.map((s) => ({ typ: s.typ, param: s.param })) };
      const schl = [...new Set(kette.flatMap((s) => s.schl))];
      const v = versuche(() => Krypto.baukasten.verschluesseln(verfahren, {}, t, { protokoll: false }));
      if (v) yield zust('angaben', `Probelauf ver ${kette.map((s) => s.typ).join('+')}`, { texte: [t], schluessel: schl }, true, [T(v.geheimtext), ...v.zwischen.map(T)]);
      const e = versuche(() => Krypto.baukasten.entschluesseln(verfahren, {}, t));
      if (e) yield zust('angaben', `Probelauf ent ${kette.map((s) => s.typ).join('+')}`, { texte: [t], schluessel: schl }, true, [T(e)]);
    }
  }
}

/* ---------- Tabellen ---------- */

// zustaende(A) liefert einen Generator (einmal durchlaufbar) – spart Speicher bei vielen Prüflingen
const gen = (f) => ({ zustaende: (A) => f(A || {}) });
const MODELLE = Object.freeze({
  'scheibe.scheibe': gen(caesarZustaende),
  'scheibe.text': gen(caesarZustaende),
  'scheibe.alle': gen(alleCaesar),
  'skytale.skytale': gen(skytaleZ),
  'skytale.gartenzaun': gen(zaunZ),
  'skytale.fleissner': gen(fleissnerZ),
  'skytale.pfluegen': gen(pfluegenZ),
  'skytale.ring': gen(ringZ),
  'quadrat.polybios': gen(polybiosZ),
  'quadrat.playfair': gen(playfairZ),
  'vigenere.quadrat': gen(function* () { yield zust('allgemein', 'Vigenère-Tafel', {}, true, [T(Krypto.ALPHABET)]); }),
  'vigenere.verschluesseln': gen(vigenereZ),
  'vigenere.kasiski': gen(kasiskiZ),
  'vigenere.teiltexte': gen(teiltexteZ),
  'vigenere.koinzidenz': gen(koinzidenzZ),
  'vigenere.verschiebung': gen(verschiebungZ),
  'vigenere.korrektur': gen(korrekturZ),
  'haeufigkeit.histogramm': gen(histogrammZ),
  'haeufigkeit.bigramme': gen(bigrammeZ),
  'haeufigkeit.teiltexte': gen(hTeiltexteZ),
  'haeufigkeit.kennzahlen': gen(kennzahlenZ),
  'bitlupe.zeichen': gen(function* (A) { for (const t of texte(A)) if (t.length <= 24) yield zust('allgemein', 'Zeichen → Bits (Anlage)', { texte: [t] }, true, [BITS(asciiBits(t))]); }),
  'bitlupe.xor': gen(xorZ),
  'bitlupe.doppelnutzung': gen(doppelZ),
  'runden.runden': gen(rundenZ),
  'runden.lawine': gen(lawineZ),
  'runden.verfolgung': gen(function* () { for (let bit = 0; bit < 16; bit++) yield zust('allgemein', `Bitweg ${bit}`, {}, true, []); }),
  'runden.modi': gen(modiZ),
  'runden.fehler': gen(modiZ),
  'runden.enigma': gen(miniEnigmaZ),
  'modulo.uhr': gen(uhrZ),
  'modulo.tabelle': gen(tabelleZ),
  'modulo.inverses': gen(inversesZ),
  'modulo.farbmischer': gen(farbmischerZ),
  'rsa.rechenwerk': gen(rechenwerkZ),
  'rsa.euklid': gen(euklidZ),
  'rsa.text': gen(rsaTextZ),
  'hash.schritte': gen(schritteZ),
  'hash.lawine': gen(lawineHashZ),
  'hash.kollision': gen(kollisionZ),
  'hash.baukasten': gen(baukastenHashZ),
  'hash.passwort': gen(passwortZ),
  'hash.pruefsumme': gen(pruefsummeZ),
  'analyse.vergleich': gen(vergleichZ),
  // Enigma: keine Aufgabe nennt eine Einstellung (Walzen, Ringe, Stecker); geprüft wird der feste Hintergrund
  // „Schlüsselraum“ (Katalog) in Maschine und Innenleben
  'enigma.maschine': gen(enigmaKatalog),
  'enigma.innenleben': gen(enigmaKatalog),
  'analyse.schluesselraum': gen(schluesselraumZ),
  baukasten: gen(baukastenZ)
});

/** Reiter ohne Rechnung mit Aufgabenwerten – mit Grund (Test modelle_decken_alle_reiter_ab) */
const OHNE_RECHNUNG = Object.freeze({
  substitution: 'Die Zuordnung trägt man selbst ein; das Werkzeug wendet nur die eigene Zuordnung an und schlägt nichts vor (Eigenleistung).',
  'signatur.signatur': 'Simulator mit eigenen, festen Beispielschlüsseln und -nachrichten; Werte einer Aufgabe lassen sich nicht eingeben (Test labor_signatur).',
  'signatur.zertifikat': 'Zertifikatskette mit eigenen Namen (Trent CA …); Abläufe ohne Werte einer Aufgabe (E201 d), Schaubild-Aufgaben umgebaut (E205).',
  'signatur.mitm': 'Szene mit eigenen Beispielzahlen; die Abfolge zeigt kein Schaubild einer Aufgabe mehr (Umbau W5-L3-04, E205).',
  'signale.morse': 'Öffentliche Codetabelle zum Nachschlagen wie die Anlage (E201 c); kein Schlüssel, keine Rechnung mit Aufgabenwerten.',
  'signale.klopfcode': 'Klopfcode = Polybios-Standardquadrat zum Nachschlagen (E201 c); Aufgaben mit verändertem Quadrat sind umgebaut (D16).',
  'signale.freimaurer': 'Symbole werden einzeln über das Schlüsselbild nachgeschlagen (feste Tabelle, E201 c); Aufgaben nennen keine Symbole.',
  'verstecke.nullchiffre': 'Die Leseregel wendet man im Brief selbst an (zählenden Buchstaben antippen); keine Aufgabe enthält einen Nullchiffre-Brief.',
  'verstecke.punkte': 'Punkte setzt bzw. findet man selbst in der eigenen Zeitungsmeldung; keine Aufgabe nennt eine Punktmethode-Nachricht.',
  'enigma.vorfuehren': 'Vorführung mit dem festen Beispielwort; im Level W3-L5 ausgeblendet (REITER_REGELN).',
  'enigma.glossar': 'Begriffserklärungen ohne Rechnung.',
  'analyse.trainer': 'Übungsaufgaben aus eigenen Beispielwörtern (BEISPIEL); Aufgabenwerte lassen sich nicht eingeben.',
  'analyse.blick': 'Abgefangene Geheimtexte aus eigenen Beispielen; Aufgabenwerte lassen sich nicht eingeben.'
});

/** Reiter mit geführtem Modus (E208) – alle anderen rechnenden Reiter sind mit erkannten Werten nicht verfügbar (E209) */
const GEFUEHRT = Object.freeze([
  'scheibe.scheibe', 'scheibe.text',
  'skytale.skytale', 'skytale.gartenzaun', 'skytale.fleissner', 'skytale.pfluegen', 'skytale.ring',
  'quadrat.polybios', 'quadrat.playfair',
  'vigenere.verschluesseln', 'vigenere.kasiski', 'vigenere.teiltexte', 'vigenere.koinzidenz',
  'haeufigkeit.teiltexte', 'haeufigkeit.kennzahlen',
  'bitlupe.xor', 'bitlupe.doppelnutzung',
  'runden.runden', 'runden.lawine', 'runden.modi', 'runden.fehler', 'runden.enigma',
  'modulo.uhr', 'modulo.tabelle', 'modulo.inverses', 'modulo.farbmischer',
  'rsa.rechenwerk', 'rsa.euklid', 'rsa.text',
  'hash.schritte', 'hash.pruefsumme', 'hash.passwort'
]);

module.exports = { MODELLE, OHNE_RECHNUNG, GEFUEHRT, versuche };
