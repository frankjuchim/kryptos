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
  if (typeof el.value === 'string' && el.localName === 'input') eigene.push(el.value);
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
  const ausgaben = [{ art: 'text', wert: ganz }, { art: 'bits', wert: ganz }, ...zahlen.map((x) => ({ art: 'zahl', wert: x.replace(/^,|,$/g, '') }))];
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

for (const id of TEIL_1) {
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
  // Scheibe k = 12: IMOT stempeln, „Neue Nachricht“, Q stempeln → geführt, kein „wache“
  const w = geoeffnet('scheibe', { reiter: ['scheibe'], k: 12, richtung: 'ent' });
  const stempel = (b) => w.k.klick(w.k.eins(w.flaeche, `.scheibe-segment-innen[data-buchstabe="${b}"]`));
  for (const b of 'IMOT') stempel(b);
  assert.ok(!hat(w, 'section.gefuehrt'));
  w.k.klick(w.k.eins(w.flaeche, '.station-neu'));
  stempel('Q');
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
