'use strict';
// Testhilfe „Werkzeug-Bediener“ (Plan M11 Tasks 241, 243–245): bedient ein echtes Labor-Modul im Attrappen-DOM so, wie
// es ein Modell-Zustand beschreibt (werkzeuge/krypto/werkzeug_modelle.js), und durchläuft den geführten Modus.
//   bediene(wr, zustand, { umgebung, ruhig }) → hilfen_labor-Objekt (Werkzeug mit den Eingaben des Zustands)
//   gehe(w, i) · trage(w, i, wert) – Schritt i im geführten Modus ansteuern bzw. eintragen
//   FAELLE – feste Fälle je Reiter für den Gleichlauf Modell ↔ Modul (Test modell_gleich_werkzeug)
const { oeffne, Krypto: K } = require('./hilfen_labor');

const param = (z, p) => {
  const s = (z.eingaben.schluessel || []).find((x) => x.startsWith(`${p}=`));
  return s ? s.slice(p.length + 1) : null;
};
const zahlP = (z, p) => (param(z, p) === null ? undefined : Number(param(z, p)));
const wort = (z) => (z.eingaben.schluessel || []).find((x) => !x.includes('='));
const richtungVon = (z) => (/\bent\b/.test(z.bedienung) ? 'ent' : 'ver');
const text0 = (z) => (z.eingaben.texte || [])[0] || '';

/** Voreinstellung je Reiter aus einem Modell-Zustand; danach optional nach(w) für Eingaben ohne Voreinstellung */
const VOR = {
  'scheibe.scheibe': (z) => ({ v: { reiter: ['scheibe'], k: zahlP(z, 'k'), richtung: richtungVon(z) }, nach: (w) => { const f = w.k.alle(w.flaeche, '.scheibe-tippen textarea')[0]; if (f) w.k.tippe(f, K.klein(text0(z))); } }),
  'scheibe.text': (z) => ({ v: { reiter: ['text'], text: text0(z), k: zahlP(z, 'k'), richtung: richtungVon(z) } }),
  'scheibe.alle': (z) => ({ v: { reiter: ['alle'], text: text0(z) } }),
  'skytale.skytale': (z) => ({
    v: { reiter: ['skytale'], text: text0(z), umfang: zahlP(z, 'u') ?? 3, richtung: z.bedienung === 'alle Stäbe' ? 'ent' : richtungVon(z) },
    // Verschlüsseln: das Band abwickeln, dann steht der Geheimtext auf dem Band (Werkstatt-Bedienung)
    nach: (w) => { const b = w.k.alle(w.flaeche, '.stab-abwickeln')[0]; if (b && !b.disabled) w.k.klick(b); }
  }),
  'skytale.gartenzaun': (z) => ({ v: { reiter: ['gartenzaun'], text: text0(z), zeilen: zahlP(z, 'n'), richtung: richtungVon(z) } }),
  'skytale.pfluegen': (z) => ({
    v: { reiter: ['pfluegen'], text: text0(z), k: zahlP(z, 'k') ?? 5, richtung: z.bedienung === 'alle Zeilenlängen' ? 'ent' : richtungVon(z) },
    nach: (w) => { const b = w.k.alle(w.flaeche, '.pflug-pfluegen')[0]; if (b && !b.disabled) w.k.klick(b); }
  }),
  'skytale.ring': (z) => ({ v: { reiter: ['ring'], text: text0(z), t: zahlP(z, 't'), richtung: richtungVon(z) } }),
  'skytale.fleissner': (z) => {
    const l = param(z, 'loch').split(';').map((p) => p.split(',').map(Number));
    return {
      v: { reiter: ['fleissner'], text: text0(z), schablone: l, groesse: Math.max(...l.flat()) <= 4 ? 4 : 6, richtung: richtungVon(z) },
      nach: (w) => { const b = w.k.alle(w.flaeche, '.karton-abheben')[0]; if (b && !b.disabled) w.k.klick(b); }
    };
  },
  'quadrat.polybios': (z) => ({ v: { reiter: ['polybios'], text: text0(z), richtung: richtungVon(z), ...(wort(z) ? { schluesselwort: wort(z) } : {}) } }),
  'quadrat.playfair': (z) => ({ v: { reiter: ['playfair'], text: text0(z), richtung: richtungVon(z), ...(wort(z) ? { schluesselwort: wort(z) } : {}) } }),
  'vigenere.verschluesseln': (z) => ({
    v: { reiter: ['verschluesseln'], text: text0(z), modus: z.bedienung.split(' ')[0], richtung: richtungVon(z) },
    nach: (w) => { const f = w.k.alle(w.flaeche, 'input.vg-schluessel')[0]; if (f) w.k.tippe(f, wort(z) || ''); }
  }),
  'vigenere.teiltexte': (z) => ({ v: { reiter: ['teiltexte'], text: text0(z), schluessellaenge: zahlP(z, 'k') } }),
  'vigenere.kasiski': (z) => ({ v: { reiter: ['kasiski'], text: text0(z) } }),
  'vigenere.koinzidenz': (z) => ({ v: { reiter: ['koinzidenz'], text: text0(z) } }),
  'vigenere.verschiebung': (z) => ({ v: { reiter: ['verschiebung'], text: text0(z), schluessellaenge: zahlP(z, 'k') } }),
  'vigenere.korrektur': (z) => (wort(z) ? null : { v: { reiter: ['korrektur'], text: text0(z), schluessellaenge: zahlP(z, 'k') } }),
  'haeufigkeit.kennzahlen': (z) => ({ v: { reiter: ['kennzahlen'], text: text0(z) } }),
  'haeufigkeit.teiltexte': (z) => ({ v: { reiter: ['teiltexte'], text: text0(z), teiltexte: zahlP(z, 'k') } }),
  'runden.enigma': (z) => ({ v: { reiter: ['enigma'], stellung: param(z, 'st') }, nach: (w) => { const f = w.k.alle(w.flaeche, '.labor-textfeld textarea')[0]; if (f) w.k.tippe(f, K.klein(text0(z))); } }),
  'hash.schritte': (z) => ({ v: { reiter: ['schritte'], text: K.klein(text0(z)) } }),
  'bitlupe.xor': (z) => {
    const [a, b] = [z.eingaben.bitpaare.map((p) => p[0]).join(''), z.eingaben.bitpaare.map((p) => p[1]).join('')];
    return { v: { reiter: ['xor'], text: K.bitsZuText(a), schluessel: b, schluesselart: 'bits', modus: z.bedienung.includes('otp') ? 'otp' : 'wiederholung' } };
  }
};

/** Werkzeug zum Zustand öffnen und bedienen */
function bediene(wr, z, { umgebung = {}, ruhig = true } = {}) {
  const [id] = wr.split('.');
  const f = VOR[wr];
  if (!f) throw new Error(`Kein Bediener für ${wr}`);
  const r = f(z);
  if (!r) throw new Error(`Zustand nicht bedienbar: ${wr} ${z.bedienung}`);
  const { v, nach } = r;
  for (const k of Object.keys(v)) if (v[k] === undefined) delete v[k];
  const w = oeffne(id, { voreinstellung: v, umgebung, ruhig });
  if (nach) nach(w);
  return w;
}

/** Schritt i im geführten Modus ansteuern (Zähler über Weiter/Zurück) */
function gehe(w, i) {
  const zaehler = () => Number((/Schritt (\d+) von/.exec(w.k.text(w.k.eins(w.flaeche, '.gefuehrt-zaehler'))) || [0, 1])[1]) - 1;
  let n = 0;
  while (zaehler() < i && n++ < 500) w.k.klick(w.k.eins(w.flaeche, '.gefuehrt-weiter'));
  while (zaehler() > i && n++ < 1000) w.k.klick(w.k.eins(w.flaeche, '.gefuehrt-zurueck'));
  return zaehler();
}
/** Eintrag für Schritt i */
function trage(w, i, wert) {
  gehe(w, i);
  w.k.tippe(w.k.eins(w.flaeche, 'input.gefuehrt-eintrag-feld'), String(wert));
}

const A = (o) => ({ texte: [], schluessel: [], zahlen: [], bits: [], ...o });
const bed = (s) => (z) => z.bedienung === s;
/** Gleichlauf Modell ↔ Modul: eigene Werte (kommen in keinem Material vor), dazu das Beispiel des Moduls */
const FAELLE = {
  'scheibe.text': [{ angaben: A({ texte: ['ZINNOBER'], schluessel: ['k=7'] }), passt: bed('ver k=7') }, { angaben: A({ texte: ['QUARZSAND'], schluessel: ['k=19'] }), passt: bed('ent k=19') }],
  'scheibe.scheibe': [{ angaben: A({ texte: ['KIESEL'], schluessel: ['k=4'] }), passt: bed('ver k=4') }],
  'scheibe.alle': [{ angaben: A({ texte: ['HLNSZWOPC'] }), passt: bed('alle Verschiebungen') }],
  'skytale.skytale': [{ angaben: A({ texte: ['WACHWECHSELAMSUEDTURM'] }), passt: bed('ver u=3') }, { angaben: A({ texte: ['TRMEUPNIOELLTTEN'] }), passt: bed('ent u=4') }, { angaben: A({ texte: ['OLMEKN'] }), passt: bed('alle Stäbe') }],
  'skytale.gartenzaun': [{ angaben: A({ texte: ['FLUSSKIESEL'] }), passt: bed('ver n=3') }, { angaben: A({ texte: ['BRNSIEKEE'] }), passt: bed('ent n=2') }],
  'skytale.pfluegen': [{ angaben: A({ texte: ['ZWIEBELTURM'] }), passt: bed('ver k=4') }],
  'skytale.ring': [{ angaben: A({ texte: ['GLOCKENSPIEL'] }), passt: bed('ver t=3') }],
  'skytale.fleissner': [{ angaben: A({ texte: ['WACHWECHSELAMSUE'], schluessel: ['loch=1,1;1,3;2,4;3,2'] }), passt: (z) => z.bedienung.startsWith('ver ') }],
  'quadrat.polybios': [{ angaben: A({ texte: ['NEBELHORN'] }), passt: bed('ver') }],
  'quadrat.playfair': [{ angaben: A({ texte: ['MOEWENFLUG'], schluessel: ['LEUCHTFEUER'] }), passt: bed('ver LEUCHTFEUER') }, { angaben: A({ texte: ['KUPFERKESSEL'], schluessel: ['BERNSTEIN'] }), passt: bed('ver BERNSTEIN') }],
  'vigenere.verschluesseln': [{ angaben: A({ texte: ['PFLAUME'], schluessel: ['GLOBUS'] }), passt: bed('vigenere ver GLOBUS') }, { angaben: A({ texte: ['HOLUNDERBEERE'], schluessel: ['MOOS'] }), passt: bed('autokey ver MOOS') }],
  'vigenere.teiltexte': [{ angaben: A({ texte: ['KAMINFEUERKNISTERT'] }), passt: bed('Teiltexte k=3') }],
  'haeufigkeit.teiltexte': [{ angaben: A({ texte: ['WALNUSSKERNEKNACKEN'] }), passt: bed('Teiltexte k=4') }],
  'runden.enigma': [{ angaben: A({ texte: ['CAFE'], schluessel: ['st=C'] }), passt: bed('ver st=C') }],
  'hash.schritte': [{ angaben: A({ texte: ['ANKER'] }), passt: bed('KH Schritt für Schritt') }],
  'bitlupe.xor': [{ angaben: A({ texte: ['OK'], bits: ['10100110'], bitfolgen: ['1010011001011010'] }), passt: (z) => z.bedienung === 'XOR otp' && z.eingaben.bitpaare[0][0] === '01001111' }]
};

/** Lässt sich der Zustand über Voreinstellung/Felder eingeben? */
const kannBedienen = (wr, z) => {
  try {
    return !!(VOR[wr] && VOR[wr](z));
  } catch {
    return false;
  }
};

module.exports = { bediene, gehe, trage, FAELLE, VOR, kannBedienen };
