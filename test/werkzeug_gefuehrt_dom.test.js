'use strict';
// K12 (Plan M11 Tasks 244, 245, 249, 250; E203, E207–E209, Review Focus 1 und 2): die echten Werkzeug-Module im
// Attrappen-DOM. Für jeden Prüfling, dessen Angaben ein Reiter frei rechnend verriete (Modelle + istVerrat), werden die
// Aufgabenwerte eingegeben: Der Reiter wechselt in den geführten Modus (bzw. zeigt „nicht verfügbar“). Dann alle Schritte
// ohne Einträge, mit Zufallseinträgen und – für die ersten Schritte – mit allen Werten des Alphabets bzw. 0/1/Ziffern
// durchlaufen: Der Text der ganzen Fläche samt Attributen enthält nie eine Lösung (E225), und das DOM ist nach jedem
// Eintrag in den aktuellen Schritt bis auf den Eintrag selbst gleich (kein Orakel). Ausnahme nur AUSNAHMEN (L60).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const P = require('../werkzeuge/krypto/prueflinge');
const M = require('../werkzeuge/krypto/werkzeug_modelle');
const B = require('../werkzeuge/krypto/erkenner_bauen');
const BED = require('./hilfen_werkzeug_bediener');
const { oeffne, Krypto: K } = require('./hilfen_labor');

const S = { rolle: 'schueler' };
const TEIL_1 = ['scheibe', 'skytale', 'quadrat', 'vigenere', 'haeufigkeit'];
const TEIL_2 = ['bitlupe', 'runden', 'modulo', 'rsa', 'hash', 'analyse'];
const MAX_JE_REITER = 25; // Fälle je Reiter (verschiedene Eingaben; Laufzeit)

/** Verrat-Zustände je Reiter (einmal) */
let faelle = null;
function alleFaelle() {
  if (faelle) return faelle;
  faelle = {};
  const gesehen = new Set();
  for (const p of P.prueflinge()) {
    const A = P.angaben(p);
    for (const [wr, m] of Object.entries(M.MODELLE)) {
      if (!BED.VOR[wr]) continue;
      for (const z of m.zustaende(A)) {
        if (z.art !== 'angaben' || !B.nutztAngaben(z) || !BED.kannBedienen(wr, z)) continue;
        if (P.AUSNAHMEN.some((a) => a.aufgabe === p.id && a.wr === wr)) continue;
        if (!P.istVerrat(z.ausgaben, p).verrat) continue;
        const schl = `${wr}|${JSON.stringify(z.eingaben)}|${z.bedienung}`;
        if (gesehen.has(schl)) continue;
        gesehen.add(schl);
        const liste = (faelle[wr] = faelle[wr] || []);
        if (liste.length < MAX_JE_REITER) liste.push({ p, z });
      }
    }
  }
  return faelle;
}

/** alle Texte und Attributwerte der Fläche */
function alleTexte(el) {
  if (el.nodeType === 3) return [el.textContent];
  if (el.nodeType !== 1) return [];
  const eigene = el.getAttributeNames().map((n) => el.getAttribute(n));
  // Werte der Eingabefelder; die änderbaren Angaben im geführten Abschnitt sind die eigenen Eingaben (kein Ergebnis)
  if (typeof el.value === 'string' && el.localName === 'input' && !el.classList.contains('gefuehrt-angabe')) eigene.push(el.value);
  return [...eigene, ...el.childNodes.flatMap(alleTexte)];
}
/** DOM ohne Einträge und ohne Texte anderer Schritte (Kein-Orakel-Vergleich) */
function bild(el) {
  if (el.nodeType === 3) return el.textContent;
  if (el.nodeType !== 1) return '';
  const attr = el.getAttributeNames().sort().map((n) => `${n}=${JSON.stringify(el.getAttribute(n))}`).join(' ');
  const stil = el.style && el.style.cssText ? ` style=${JSON.stringify(el.style.cssText)}` : '';
  let innen;
  if (el.classList.contains('gefuehrt-eintrag')) innen = '«e»';
  else if (el.classList.contains('gefuehrt-schritt') && !el.classList.contains('aktuell')) innen = '«schritt»';
  else innen = el.childNodes.map(bild).join('');
  return `<${el.localName} ${attr}${stil}>${innen}</${el.localName}>`;
}

/** Texte ohne die Positionsnummern der Leiste (0 … n − 1 – zeigt jede Zahl bis n, verrät nichts) */
function ohnePositionen(el) {
  if (el.nodeType === 1 && el.classList.contains('gefuehrt-positionen')) return [];
  if (el.nodeType === 3) return [el.textContent];
  if (el.nodeType !== 1) return [];
  return [...el.getAttributeNames().map((n) => el.getAttribute(n)), ...el.childNodes.flatMap(ohnePositionen)];
}
/** Verrät die Fläche eine Lösung des Prüflings? */
function verrat(w, p) {
  const texte = alleTexte(w.flaeche);
  const ganz = texte.join(' ');
  const zahlen = ohnePositionen(w.flaeche).join(' ').split(/[^\d,]+/).filter((x) => /\d/.test(x));
  // Bits nur aus Läufen von Vierergruppen (so zeigen die Werkzeuge Bits): einzelne Ziffern aus „Byte 1“, „Schritt 1
  // von 1“ würden sonst mit benachbarten Bitgruppen zu Scheintreffern verschmelzen
  const bitLaeufe = (ganz.match(/[01]{4}(?: ?[01]{4})*/g) || []).map((b) => ({ art: 'bits', wert: b }));
  const ausgaben = [{ art: 'text', wert: ganz }, ...bitLaeufe, ...zahlen.map((x) => ({ art: 'zahl', wert: x.replace(/^,|,$/g, '') }))];
  return P.istVerrat(ausgaben, p);
}

const WERTE = { buchstabe: [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'], bits: ['0', '1', '00000000', '11111111'], zahl: ['0', '1', '2', '3', '5', '7', '10', '13', '26', '51', '100'], text: ['A', 'XY', 'QQQQ'] };
const artVon = (w) => (w.k.eins(w.flaeche, 'input.gefuehrt-eintrag-feld').getAttribute('maxlength') === '1' ? 'buchstabe' : /numeric/.test(w.k.eins(w.flaeche, 'input.gefuehrt-eintrag-feld').getAttribute('inputmode') || '') ? 'zahl' : 'text');
const anzahl = (w) => {
  const z = w.k.eins(w.flaeche, '.gefuehrt-zaehler');
  const m = /von (\d+)/.exec(w.k.text(z));
  return m ? Number(m[1]) : 0;
};

/** einen Fall prüfen: geführt bzw. nicht verfügbar, keine Lösung, kein Orakel */
function pruefeFall(wr, { p, z }, { allesFuer = 2 } = {}) {
  const w = BED.bediene(wr, z, { umgebung: S });
  const gefuehrt = M.GEFUEHRT.includes(wr);
  const ctx = `${p.id} ${wr} ${z.bedienung}`;
  if (gefuehrt) assert.ok(hat(w, 'section.gefuehrt'), `${ctx}: geführter Modus erwartet`);
  else assert.ok(hat(w, '.labor-nicht-verfuegbar') && !hat(w, 'section.gefuehrt'), `${ctx}: „nicht verfügbar“ erwartet`);
  const v0 = verrat(w, p);
  assert.equal(v0.verrat, false, `${ctx}: Lösung ${v0.wert} im DOM (ohne Einträge)`);
  if (!gefuehrt) return;
  return durchlaufe(w, p, ctx, allesFuer);
}

/** alle Schritte eines geführten Werkzeugs: ohne Lösung, ohne Orakel (die ersten allesFuer Schritte mit allen Werten) */
function durchlaufe(w, p, ctx, allesFuer = 2) {
  const n = anzahl(w);
  for (let i = 0; i < n; i++) {
    BED.gehe(w, i);
    const feld = w.k.eins(w.flaeche, 'input.gefuehrt-eintrag-feld');
    const werte = WERTE[artVon(w)];
    if (i < allesFuer) {
      const bilder = new Set();
      for (const x of werte) {
        w.k.tippe(feld, x);
        bilder.add(bild(w.flaeche));
        const v = verrat(w, p);
        assert.equal(v.verrat, false, `${ctx}: Schritt ${i + 1} mit „${x}“ zeigt die Lösung ${v.wert}`);
      }
      assert.equal(bilder.size, 1, `${ctx}: Schritt ${i + 1} – DOM hängt vom Eintrag ab (Orakel)`);
    }
    w.k.tippe(feld, werte[(i * 7 + 3) % werte.length]); // Zufallseintrag (fest)
  }
  const v = verrat(w, p);
  assert.equal(v.verrat, false, `${ctx}: nach allen Schritten zeigt die Fläche die Lösung ${v.wert}`);
  return w;
}

for (const id of [...TEIL_1, ...TEIL_2]) {
  test(`k12_${id}_gefuehrt_ohne_loesung_kein_orakel`, () => {
    const f = alleFaelle();
    let n = 0;
    for (const [wr, liste] of Object.entries(f)) {
      if (!wr.startsWith(`${id}.`)) continue;
      for (const fall of liste) {
        pruefeFall(wr, fall);
        n++;
      }
    }
    assert.ok(n >= 1, `${id}: keine Fälle`);
  });
}

/* ---------- Hervorhebung nur der Eingabeseite (Review Focus 2) ---------- */

const geoeffnet = (id, v) => oeffne(id, { voreinstellung: v, umgebung: S, ruhig: true });
const markiert = (w) => w.k.alle(w.flaeche, '.gefuehrt-mechanik .gefuehrt-markiert');
const hat = (w, sel) => w.k.alle(w.flaeche, sel).length > 0;

test('hervorhebung_nur_eingabeseite_scheibe', () => {
  // W0-L2-02 (wie im Aufgaben-Panel: umgebung.gefuehrt): Entschlüsseln IMOTQ mit k = 12 – markiert ist innen der
  // Geheimtextbuchstabe I, außen nichts
  const panel = (v) => oeffne('scheibe', { voreinstellung: v, umgebung: { ...S, gefuehrt: { aufgabe: 'W0-L2-02' } }, ruhig: true });
  const w = panel({ reiter: ['scheibe'], text: 'IMOTQ', k: 12, richtung: 'ent' });
  assert.ok(hat(w, 'section.gefuehrt'));
  const m = markiert(w);
  assert.equal(m.length, 1);
  assert.equal(m[0].getAttribute('data-buchstabe'), 'I');
  assert.ok(m[0].classList.contains('scheibe-segment-innen'));
  // Verschlüsseln: außen der Klartextbuchstabe
  const v = panel({ reiter: ['scheibe'], text: 'ave', k: 4, richtung: 'ver' });
  const mv = markiert(v);
  assert.equal(mv.length, 1);
  assert.equal(mv[0].getAttribute('data-buchstabe'), 'a');
  assert.ok(mv[0].classList.contains('scheibe-segment'));
});

test('hervorhebung_nur_eingabeseite_skytale', () => {
  // W0-L1-04: Entschlüsseln mit u = 4 – nur die Zielzelle des aktuellen Geheimtextbuchstabens, keine Zeile
  const w = geoeffnet('skytale', { reiter: ['skytale'], text: 'NUMRA BOUCK REHOG HSMEX CMNXH TFX', umfang: 4, richtung: 'ent' });
  assert.ok(hat(w, 'section.gefuehrt'));
  assert.equal(markiert(w).length, 1);
  BED.gehe(w, 5);
  assert.equal(markiert(w).length, 1);
  assert.ok(!w.k.alle(w.flaeche, '.gefuehrt-mechanik tr.gefuehrt-markiert, .gefuehrt-mechanik th.gefuehrt-markiert').length, 'keine Zeile, kein Kopf');
});

test('hervorhebung_nur_eingabeseite_playfair', () => {
  // eigenes Quadrat (nicht aus einer Aufgabe) mit einem Aufgaben-Text → geführt: nur die zwei Felder des Paars
  const w = geoeffnet('quadrat', { reiter: ['playfair'], text: 'wasserweg', schluesselwort: 'RIALTO', richtung: 'ver' });
  assert.ok(hat(w, 'section.gefuehrt'), 'RIALTO + wasserweg (W2-L4-04) wird erkannt');
  const n = Number(/von (\d+)/.exec(w.k.text(w.k.eins(w.flaeche, '.gefuehrt-zaehler')))[1]);
  // Paar-Schritte: markiert sind höchstens die zwei Felder des aktuellen Paars
  for (let i = 0; i < n; i++) {
    BED.gehe(w, i);
    assert.ok(markiert(w).length <= 2, `Schritt ${i + 1}: ${markiert(w).length} Felder markiert`);
  }
});

test('hervorhebung_nur_eingabeseite_teiltexte', () => {
  const w = geoeffnet('vigenere', { reiter: ['teiltexte'], text: 'DWETZ CVIJX NEPOQ', schluessellaenge: 3 });
  assert.ok(hat(w, 'section.gefuehrt'));
  for (let i = 0; i < 4; i++) {
    BED.gehe(w, i);
    assert.ok(markiert(w).length <= 2, 'nur die aktuelle Position (Leiste: Kopf + Zelle)');
  }
});

test('quadrat_gesperrtes_wort_wird_gefuehrt', () => {
  // D17: KORINTH (W0-L4-05) – kein „gesperrt“, sondern der Aufbau des Quadrats Schritt für Schritt
  const w = geoeffnet('quadrat', { reiter: ['polybios'], schluesselwort: 'KORINTH' });
  assert.ok(hat(w, 'section.gefuehrt'), 'geführter Aufbau');
  assert.doesNotMatch(w.k.text(w.flaeche), /gesperrt/i);
  assert.match(w.k.text(w.k.eins(w.flaeche, '.gefuehrt-zaehler')), /Schritt 1 von/);
  const text = K.normalisieren(w.k.text(w.flaeche));
  assert.ok(!text.includes('KORINTHABCDEFGLMPQSUVWXYZ'), 'das fertige Quadrat steht nicht da');
});

test('eigene_werte_frei', () => {
  const w = geoeffnet('scheibe', { reiter: ['text'], text: 'zinnober', k: 7 });
  assert.ok(!hat(w, 'section.gefuehrt'));
  assert.equal(w.ohneLeer('output.labor-ausgabe'), K.gruppieren(K.caesar('zinnober', 7)).replace(/\s+/g, ''));
  // Eigene Werte verlassen den geführten Modus: Aufgabenwerte geleert, frei rechnend
  const g = geoeffnet('scheibe', { reiter: ['text'], text: 'IMOTQ', k: 12, richtung: 'ent' });
  assert.ok(hat(g, 'section.gefuehrt'));
  g.k.klick(g.k.eins(g.flaeche, 'button.gefuehrt-eigene'));
  assert.ok(!hat(g, 'section.gefuehrt'));
  g.k.tippe(g.k.eins(g.flaeche, 'textarea.labor-eingabe'), 'quarz');
  assert.ok(!hat(g, 'section.gefuehrt'), 'eigener Text bleibt frei');
});

test('haeppchen_schalten_in_gefuehrt_modul', () => {
  // Scheibe k = 12: IMO stempeln, „Neue Nachricht“, TQ stempeln → geführt, kein „wache“ (Viererfenster, Review-Fund 3)
  const w = geoeffnet('scheibe', { reiter: ['scheibe'], k: 12, richtung: 'ent' });
  const stempel = (b) => w.k.klick(w.k.eins(w.flaeche, `.scheibe-segment-innen[data-buchstabe="${b}"]`));
  for (const b of 'IMO') stempel(b);
  assert.ok(!hat(w, 'section.gefuehrt'));
  w.k.klick(w.k.eins(w.flaeche, '.station-neu'));
  for (const b of 'TQ') stempel(b);
  assert.ok(hat(w, 'section.gefuehrt'), 'Häppchen schalten in den geführten Modus');
  assert.ok(!K.normalisieren(w.k.text(w.flaeche)).includes('WACHE'));
});

test('brute_force_liste_w0_l2_04', () => {
  // L60: „Alle Verschiebungen“ mit dem Geheimtext von W0-L2-04 ist erlaubt (25 Zeilen + k = 0)
  const w = geoeffnet('scheibe', { reiter: ['alle'], text: 'BLIZV INRIK VKRDK FI' });
  assert.ok(!hat(w, '.labor-nicht-verfuegbar'));
  assert.equal(w.k.alle(w.flaeche, 'table.alle-tabelle tbody tr').length, 26);
  // eine andere Aufgabe: nicht verfügbar
  const x = geoeffnet('scheibe', { reiter: ['alle'], text: 'IMOTQ' });
  assert.ok(hat(x, '.labor-nicht-verfuegbar'));
  assert.equal(x.k.alle(x.flaeche, 'table.alle-tabelle').length, 0);
});


test('weitertippen_nach_umschalten', () => {
  // Browser-Befund: Beim Tippen schaltet das Werkzeug nach dem ersten erkannten Fenster um – der Rest des Textes darf
  // nicht verloren gehen. Der Text bleibt im geführten Abschnitt änderbar, die Schritte wachsen mit.
  const GEHEIM = 'NUMRA BOUCK REHOG HSMEX CMNXH TFX';
  for (const [wr, v, n] of [
    ['skytale', { reiter: ['skytale'], umfang: 4, richtung: 'ent' }, K.nurBuchstaben(GEHEIM).length],
    ['scheibe', { reiter: ['text'], k: 12, richtung: 'ent' }, 5],
    ['vigenere', { reiter: ['verschluesseln'], schluessel: 'BOTE', richtung: 'ver' }, null],
    ['quadrat', { reiter: ['playfair'], schluesselwort: 'RIALTO', richtung: 'ver' }, null]
  ]) {
    const text = { skytale: GEHEIM, scheibe: 'IMOTQ', vigenere: 'gondel', quadrat: 'wasserweg' }[wr];
    const w = geoeffnet(wr, v);
    // Playfair: das Schlüsselwort RIALTO (W2-L4-04) allein führt schon (Aufbau des Quadrats, D17) – dort wird gleich
    // im geführten Abschnitt getippt
    const feld = w.k.alle(w.flaeche, wr === 'quadrat' ? 'section.gefuehrt textarea' : 'textarea.labor-eingabe')[0];
    assert.ok(feld && (wr === 'quadrat') === hat(w, 'section.gefuehrt'), `${wr}: Ausgangslage vor dem Tippen`);
    feld.value = '';
    feld.focus();
    // wie die Tastatur im Browser: jedes Zeichen geht an das Element, das gerade den Fokus hat
    const doc = w.flaeche.ownerDocument;
    for (const [i, ch] of [...text].entries()) {
      const akt = doc.activeElement;
      assert.equal(akt && akt.localName, 'textarea', `${wr}: Fokus im Textfeld vor Zeichen ${i + 1}`);
      w.k.tippe(akt, ch);
    }
    assert.ok(hat(w, 'section.gefuehrt'), `${wr}: geführt`);
    const tf = w.k.alle(w.flaeche, 'section.gefuehrt textarea')[0];
    assert.equal(K.nurBuchstaben(tf.value), K.nurBuchstaben(text), `${wr}: ganzer Text im Feld`);
    if (n) assert.match(w.k.text(w.k.eins(w.flaeche, '.gefuehrt-zaehler')), new RegExp(`von ${n}\\b`), `${wr}: alle Schritte`);
  }
});

/* ---------- Teil 2 (Task 245): Beispiele aus dem Plan ---------- */

const panel = (id, v, aufgabe) => oeffne(id, { voreinstellung: v, umgebung: { ...S, gefuehrt: { aufgabe } }, ruhig: true });
const freigabe = (w, aufgabe) => w.k.wert('KRGefuehrt').freigeben(aufgabe);

test('k12_beispiel_rsa_w4_l2_04', () => {
  // p = 3, q = 17, e = 5 (W4-L2-04): Schritte N, φ, d leer – kein N = 51, φ = 32, d = 13
  const w = geoeffnet('rsa', { reiter: ['rechenwerk'], p: 3, q: 17, e: 5, m: 2 });
  assert.ok(hat(w, 'section.gefuehrt'), 'p, q, e der Aufgabe werden erkannt');
  assert.match(w.k.text(w.k.eins(w.flaeche, '.gefuehrt-zaehler')), /Schritt 1 von \d+: N = 3 · 17/);
  const zellen = w.k.alle(w.flaeche, '.gefuehrt-mechanik .gefuehrt-eintrag').map((e) => w.k.text(e));
  assert.ok(zellen.every((x) => x === ''), 'alle Ergebnisfelder leer');
  const mechanik = `${w.k.text(w.k.eins(w.flaeche, '.gefuehrt-mechanik'))} ${w.k.text(w.k.eins(w.flaeche, '.gefuehrt-schritte'))}`;
  assert.ok(!/\b(51|32|13)\b/.test(mechanik), 'weder N noch φ noch d in Mechanik und Schritten (die Auswahl p, q listet alle Primzahlen)');
});

test('k12_beispiel_bitlupe_w3_l1_02', () => {
  const w = geoeffnet('bitlupe', { reiter: ['xor'], text: K.bitsZuText('01100011'), schluessel: '11010101', schluesselart: 'bits', modus: 'otp' });
  assert.ok(hat(w, 'section.gefuehrt'));
  assert.equal(markiert(w).length, 2, 'das Bitpaar (Text- und Schlüsselbyte) ist markiert');
  assert.ok(!K.normBits(w.k.text(w.flaeche)).includes('10110110'), 'kein Ergebnis 1011 0110');
});

test('k12_beispiel_bitlupe_zeichen_w3_l1_04 (Nachtrag M11)', () => {
  // Text → Bits geführt: Zeichen → ASCII-Wert → obere/untere vier Bits; markiert wird nur die Eingabeseite
  const w = geoeffnet('bitlupe', { reiter: ['zeichen'], text: 'EIS' });
  assert.ok(hat(w, 'section.gefuehrt'), 'Aufgabenwerte EIS → geführt');
  assert.equal(anzahl(w), 9, 'je Zeichen drei Schritte');
  const flach = () => K.normBits(w.k.text(w.flaeche)).replace(/[^01]/g, '');
  assert.ok(!flach().includes('01000101') && !/\b69\b/.test(w.k.text(w.flaeche)), 'weder Bits noch ASCII-Wert von E im DOM');
  assert.equal(markiert(w).length, 1, 'Schritt 1: nur das Zeichen E markiert');
  assert.equal(w.k.text(markiert(w)[0]).trim(), 'E');
  BED.trage(w, 0, '69');
  BED.gehe(w, 1);
  assert.equal(markiert(w).length, 1, 'Schritt 2: nur der eigene ASCII-Wert markiert');
  assert.equal(w.k.text(markiert(w)[0]).trim(), '69');
  assert.ok(!flach().includes('0100'), 'obere vier Bits nicht vorgezeigt');
  // eigener Text → frei mit Ausgabe
  const f = geoeffnet('bitlupe', { reiter: ['zeichen'], text: 'Moos' });
  assert.ok(!hat(f, 'section.gefuehrt'));
  assert.ok(f.k.text(f.flaeche).replace(/\s/g, '').includes('01001101'), 'M = 0100 1101 frei angezeigt');
});

test('k12_beispiel_mini_enigma_w3_l5_01', () => {
  // FADE in Stellung A: Stufe für Stufe; keine Lampe vor der Freigabe, danach die richtige
  const w = panel('runden', { reiter: ['enigma'], stellung: 'A', text: 'FADE' }, 'W3-L5-01');
  assert.ok(hat(w, 'section.gefuehrt'));
  assert.match(w.k.text(w.k.eins(w.flaeche, '.gefuehrt-zaehler')), /von 28: Buchstabe 1 \(F, Stellung A, s = 0\): Station 1/);
  assert.equal(w.k.alle(w.flaeche, '.lampe.leuchtet').length, 0, 'keine Lampe vor der Freigabe');
  assert.ok(!K.normalisieren(w.k.text(w.flaeche)).includes('CHEA'));
  // Hervorhebung nur der Eingabeseite: Station 1 markiert den Eingangsbuchstaben F in der Buchstabenzeile
  const m = markiert(w);
  assert.equal(m.length, 1);
  assert.equal(w.k.text(m[0]).replace(/[^A-H]/g, ''), 'F');
  freigabe(w, 'W3-L5-01');
  assert.equal(w.k.alle(w.flaeche, '.lampe.leuchtet').length, 1, 'nach der Freigabe leuchtet die Lampe des Buchstabens');
});

test('k12_beispiel_hash_w5_l1_02', () => {
  // TEE: Rundentabelle, h vorher aus den Einträgen
  const w = geoeffnet('hash', { reiter: ['schritte'], text: 'tee' });
  assert.ok(hat(w, 'section.gefuehrt'));
  // je Runde: w, 3 · h + w, h neu (Review-Fund 8: w trägt man selbst ein)
  BED.trage(w, 0, '20');
  BED.trage(w, 1, '20');
  BED.trage(w, 2, '20');
  BED.trage(w, 3, '5');
  BED.gehe(w, 4);
  assert.match(w.k.text(w.k.eins(w.flaeche, '.gefuehrt-zaehler')), /3 · 20 \+ 5/, 'h vorher und w kommen aus den Einträgen');
});

test('k12_beispiel_keine_warnung_vor_freigabe_w4_l3_07', () => {
  // RSA-Warnungen wären selbst Antworten: W4-L2-07 (p = 5, q = 13, e = 7 – „schwacher Schlüssel, d = e“ beantwortet b)
  // → geführt, keine Warnungsliste vor der Freigabe
  const x = geoeffnet('rsa', { reiter: ['rechenwerk'], p: 5, q: 13, e: 7, m: 2 });
  assert.ok(hat(x, 'section.gefuehrt'));
  assert.equal(x.k.alle(x.flaeche, 'ul.rsa-warnungen li').length, 0);
  assert.doesNotMatch(x.k.text(x.flaeche), /schwacher Schlüssel|Fixpunkt|teilerfremd/);
  // W4-L3-07 (e = 6 zu φ = 60): e lässt sich nur aus Krypto.rsa.eKandidaten wählen – keine Warnung „nicht teilerfremd“
  const w = geoeffnet('rsa', { reiter: ['rechenwerk'], p: 7, q: 11 });
  assert.ok(!w.k.alle(w.flaeche, 'select.rsa-e option').some((o) => o.value === '6'));
  assert.doesNotMatch(w.k.text(w.flaeche), /teilerfremd/);
});

test('nicht_verfuegbar_hinweis', () => {
  const nv = (w) => hat(w, '.labor-nicht-verfuegbar') && !hat(w, 'section.gefuehrt');
  const h = geoeffnet('hash', { reiter: ['baukasten'], text: 'hafen' });
  assert.ok(nv(h), 'hash.baukasten mit hafen');
  assert.doesNotMatch(w0(h), /KH\(hafen\)/);
  const s = geoeffnet('scheibe', { reiter: ['alle'], text: 'IMOTQ' });
  assert.ok(nv(s), 'scheibe.alle mit IMOTQ');
  // eigene Werte: frei
  const f = geoeffnet('hash', { reiter: ['baukasten'], text: 'zange' });
  assert.ok(!hat(f, '.labor-nicht-verfuegbar'));
});
function w0(w) {
  return w.k.text(w.flaeche);
}

test('schubfach_beispiel_ohne_ziel_treffer', () => {
  // Die Kollisionssuche ist frei (kein Lösungsbezug); ihr Beispielwort und die Beispiele der Prüfsummen treffen keine
  // Hash-Zielwerte einer Aufgabe
  for (const p of P.prueflinge()) {
    for (const t of ['kamin', 'segel', 'segem', 'zange', 'eimer', 'reime']) {
      const v = P.istVerrat([{ art: 'text', wert: t }, { art: 'zahl', wert: String(K.kryptosHash(t).wert) }], p);
      assert.equal(v.verrat, false, `${p.id}: Beispiel ${t} trifft ${v.wert}`);
    }
  }
});

test('weitertippen_in_zahlenfeldern', () => {
  // Browser-Befund (Task 245): Mehrere Felder (Modulo, Runden, Prüfsummen) – die Erkennung schlägt oft schon vor dem
  // letzten Feld an. Die Angaben bleiben im geführten Abschnitt änderbar, der Fokus bleibt im Feld.
  const doc = (w) => w.flaeche.ownerDocument;
  const tippeFeld = (w, sel, text) => {
    const f = w.k.alle(w.flaeche, sel)[0];
    assert.ok(f, `Feld ${sel}`);
    f.value = '';
    f.focus();
    w.k.tippe(f, text); // mit maxlength Zeichen für Zeichen, folgt dem Fokus wie der Browser
    const akt = doc(w).activeElement;
    assert.ok(akt && akt.localName === 'input', `Fokus bleibt in einem Eingabefeld (${sel})`);
  };
  // Farbmischer W4-L1-05 (p = 13, g = 2, a = 2, b = 8): Felder der Reihe nach, im geführten Modus über data-name
  const w = geoeffnet('modulo', { reiter: ['farbmischer'], p: 37, g: 2, alice: 5, bob: 9 });
  for (const [k, v] of [['p', '13'], ['g', '2'], ['a', '2'], ['b', '8']]) tippeFeld(w, hat(w, 'section.gefuehrt') ? `input.gefuehrt-angabe[data-name="${k}"]` : `input.dh-${k}`, v);
  assert.ok(hat(w, 'section.gefuehrt'));
  assert.match(w.k.text(w.k.eins(w.flaeche, '.gefuehrt-zaehler')), /A = 2\^2 mod 13/);
  assert.deepEqual(w.k.alle(w.flaeche, 'input.gefuehrt-angabe').map((f) => f.value), ['13', '2', '2', '8']);
  // Prüfsummen W5-L1-05 (regal/lager)
  const h = geoeffnet('hash', { reiter: ['pruefsumme'], text: 'palme' });
  tippeFeld(h, 'input.pruef-a', 'regal');
  tippeFeld(h, hat(h, 'section.gefuehrt') ? 'input.gefuehrt-angabe[data-name="b"]' : 'input.pruef-b', 'lager');
  assert.ok(hat(h, 'section.gefuehrt'));
  assert.deepEqual(h.k.alle(h.flaeche, 'input.gefuehrt-angabe').map((f) => f.value), ['regal', 'lager']);
  // RSA: Auswahl p, q (W4-L2-04) – e bleibt wählbar
  const r = geoeffnet('rsa', { reiter: ['rechenwerk'] });
  r.k.waehle(r.k.eins(r.flaeche, 'select.rsa-p'), '3');
  r.k.waehle(hat(r, 'section.gefuehrt') ? r.k.eins(r.flaeche, 'select.gefuehrt-angabe[data-name="q"]') : r.k.eins(r.flaeche, 'select.rsa-q'), '17');
  assert.ok(hat(r, 'section.gefuehrt'));
  r.k.waehle(r.k.eins(r.flaeche, 'select.gefuehrt-angabe[data-name="e"]'), '5');
  assert.match(r.k.text(r.k.eins(r.flaeche, '.gefuehrt-mechanik')), /e = 5/);
  // eigene Werte im geführten Abschnitt → wieder frei
  r.k.waehle(r.k.eins(r.flaeche, 'select.gefuehrt-angabe[data-name="q"]'), '19');
  assert.ok(!hat(r, 'section.gefuehrt'), 'p = 3, q = 19: frei');
  assert.equal(r.zustand().q, 19);
});

/* ---------- Panels in den Aufgaben (Tasks 249/250, E219): Block-Voreinstellung + Level-Umgebung ---------- */

const fs = require('node:fs');
const path = require('node:path');
function panels(welten) {
  const out = [];
  for (const w of welten) {
    const datei = w === 8 ? path.join(__dirname, '..', 'seed', 'gast', 'demo.json') : path.join(__dirname, '..', 'seed', 'welten', `welt${w}.json`);
    for (const a of JSON.parse(fs.readFileSync(datei, 'utf8')).aufgaben) for (const b of a.inhalt || []) if (b.t === 'werkzeug') out.push({ a, b });
  }
  return out;
}
const PRUEF = new Map(P.prueflinge().map((p) => [p.id, p]));
function pruefePanels(welten) {
  const liste = panels(welten);
  assert.ok(liste.length > 0, 'Panels vorhanden');
  for (const { a, b } of liste) {
    const level = /^(W\d-L\d{1,2})-/.exec(a.id);
    const umgebung = { ...S, welten: [0, 1, 2, 3, 4, 5, 6], niveau: 'eA', aufgabe: a.id, ...(level ? { level: level[1] } : {}), ...(b.gefuehrt ? { gefuehrt: { aufgabe: a.id } } : {}), ...(a.id.startsWith('W8-') ? { modus: 'gast', rolle: null } : {}) };
    const w = oeffne(b.id, { voreinstellung: b.voreinstellung || {}, umgebung, ruhig: true });
    const p = PRUEF.get(a.id);
    const ctx = `${a.id} ${b.id}`;
    const reiter = (b.voreinstellung && b.voreinstellung.reiter) || [];
    const erster = reiter[0] ? `${b.id}.${reiter[0]}` : null;
    if (b.gefuehrt && erster && M.GEFUEHRT.includes(erster)) assert.ok(hat(w, 'section.gefuehrt'), `${ctx}: startet geführt`);
    if (!p) continue;
    if (P.AUSNAHMEN.some((x) => x.aufgabe === a.id && x.wr === erster)) continue; // L60: Liste erlaubt
    const v = verrat(w, p);
    assert.equal(v.verrat, false, `${ctx}: Lösung ${v.wert} im Panel`);
    if (hat(w, 'section.gefuehrt')) durchlaufe(w, p, ctx, 1);
  }
}
test('k12_panels_welt_0_2', () => pruefePanels([0, 1, 2, 8]));
test('k12_panels_welt_3_6', () => pruefePanels([3, 4, 5, 6]));

test('e209_w2_a_01_verschiebung_und_korrektur_nicht_verfuegbar (Review-Fund 4)', () => {
  const t = P.angaben(P.prueflinge().find((p) => p.id === 'W2-A-01')).texte.find((x) => x.length > 50);
  for (const r of ['verschiebung', 'korrektur']) {
    const w = geoeffnet('vigenere', { reiter: [r], text: t, schluessellaenge: 4 });
    assert.ok(hat(w, '.labor-nicht-verfuegbar'), `${r}: nicht verfügbar`);
  }
  const f = geoeffnet('vigenere', { reiter: ['verschiebung'], text: 'Rosenwasser aus dem Garten der Medici duftet suess', schluessellaenge: 4 });
  assert.ok(!hat(f, '.labor-nicht-verfuegbar'), 'eigener Text frei');
});

/* ---------- Review-Fund 8: keine Struktur-Hinweise im geführten Modus ---------- */

const zahlZeilen = (w) => w.k.alle(w.flaeche, 'table.gefuehrt-tabelle tbody tr').length;
test('struktur_euklid_feste_zeilenzahl (W4-L3-03)', () => {
  const panel = (v) => oeffne('rsa', { voreinstellung: { reiter: ['euklid'], ...v }, umgebung: { ...S, gefuehrt: { aufgabe: 'W9-L1-01' } }, ruhig: true });
  const a = panel({ p: 5, q: 11, e: 7 }); // 40, 7
  const b = panel({ p: 7, q: 23, e: 7 }); // 132, 7
  assert.ok(hat(a, 'section.gefuehrt') && hat(b, 'section.gefuehrt'));
  assert.equal(zahlZeilen(a), zahlZeilen(b), 'Zeilenzahl hängt nicht von der Rechnung ab');
  assert.equal(anzahl(a), anzahl(b), 'Schrittzahl hängt nicht von der Rechnung ab');
  assert.doesNotMatch(b.k.text(b.flaeche), /Zeile \d+ \(b = 0\)/, 'keine Zeile „(b = 0)“ vor den Einträgen');
});

test('struktur_kasiski_feste_zahl_der_folgen', () => {
  // geführt erzwungen (Panel): ein Text mit genau einer Wiederholung und einer ohne – gleiche Schrittzahl
  const panel = (t) => oeffne('vigenere', { voreinstellung: { reiter: ['kasiski'], text: t }, umgebung: { ...S, gefuehrt: { aufgabe: 'W9-L1-01' } }, ruhig: true });
  const eine = panel('ABCXYZQWEABCRTUMNO');
  const keine = panel('QWERTZUIOPASDFGHJKLYXCVBNM');
  assert.ok(hat(eine, 'section.gefuehrt') && hat(keine, 'section.gefuehrt'));
  assert.equal(anzahl(eine), 12, 'drei Folgen je vier Schritte, auch bei nur einer Wiederholung');
  assert.equal(anzahl(keine), 12, 'auch ohne Wiederholung');
});

test('struktur_hash_w_selbst_eintragen (W5-L1-02)', () => {
  const w = geoeffnet('hash', { reiter: ['schritte'], text: 'tee' });
  assert.ok(hat(w, 'section.gefuehrt'));
  const zellen = w.k.alle(w.flaeche, 'table.gefuehrt-tabelle tbody td').map((td) => w.k.text(td).trim());
  assert.ok(!zellen.includes('20') && !zellen.includes('5'), `w-Werte nicht vorgegeben (${zellen.join('|')})`);
  assert.equal(anzahl(w), 9, 'je Buchstabe w, 3 · h + w, h neu');
  assert.doesNotMatch(w.k.text(w.flaeche), /w = 20/);
});

test('struktur_leere_zeilen_im_vergleich (Vorschau)', () => {
  const w = oeffne('rsa', { voreinstellung: { reiter: ['euklid'], p: 7, q: 23, e: 7 }, umgebung: { rolle: 'lehrkraft', modus: 'vorschau', gefuehrt: { aufgabe: 'W4-L3-03' } }, ruhig: true });
  const t = w.k.text(w.flaeche);
  assert.match(t, /richtig wäre: 132/);
  assert.match(t, /richtig leer gelassen/, 'nicht gebrauchte Zeilen: leer ist richtig');
  assert.match(t, /richtig wäre: 19\b/, 'd = 19');
});
