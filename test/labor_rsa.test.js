'use strict';
// Kryptolabor: RSA-Rechenwerk (W4 §9.2, Plan M6 Task 122).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { oeffne, Krypto: K } = require('./hilfen_labor');
const waehle = (w, sel, v) => { const s = w.k.eins(w.flaeche, sel); s.value = String(v); s.dispatchEvent(new w.k.window.Event('change', { bubbles: true })); };
test('Schlüssel: p = 5, q = 11, e = 3 → N 55, φ 40, d 27 mit Probe; e-Liste teilerfremd', () => {
  const w = oeffne('rsa', { voreinstellung: { p: 5, q: 11, e: 3 } });
  const z = w.zustand();
  assert.deepEqual([z.N, z.phi, z.d], [55, 40, 27]);
  assert.match(w.text('.rsa-probe'), /3 · 27 = 81 = 2 · 40 \+ 1/);
  const eListe = w.k.alle(w.flaeche, 'select.rsa-e option').map((o) => Number(o.value));
  assert.ok(eListe.every((e) => K.ggT(e, 40) === 1) && eListe.includes(3) && !eListe.includes(5));
});
test('Warnungen: d = e, p = q, m ≥ N, Fixpunkt', () => {
  const w = oeffne('rsa', { voreinstellung: { p: 5, q: 7, e: 5 } });
  assert.match(w.text('.rsa-warnungen'), /privater Schlüssel = öffentlicher Schlüssel/);
  waehle(w, 'select.rsa-q', 5);
  assert.match(w.text('.labor-hinweis'), /N = p² ist leicht zu zerlegen/);
  const v = oeffne('rsa', { voreinstellung: { p: 5, q: 11, e: 3 } });
  v.k.tippe(v.k.eins(v.flaeche, 'input.rsa-m'), '56');
  assert.match(v.text('.rsa-warnungen'), /Klarzahl muss kleiner als N sein/);
  v.k.tippe(v.k.eins(v.flaeche, 'input.rsa-m'), '11');
  assert.equal(K.rsa.verschluesseln(11, 3, 55), 11);
  assert.match(v.text('.rsa-warnungen'), /Geheimzahl = Klarzahl/);
});
// eigene Werte (p = 5, q = 23, e = 3): 7/11/7 ist seit Task 250 Aufgabe W4-L3-06 und startet den geführten Modus
test('Entschlüsseln 37 mit d = 59, N = 115: Quadrierkette = modpow-Protokoll (7 Zeilen), Ergebnis 63', () => {
  const w = oeffne('rsa', { voreinstellung: { p: 5, q: 23, e: 3 } });
  w.k.klick(w.k.eins(w.flaeche, '.labor-richtung [data-richtung="ent"]'));
  w.k.tippe(w.k.eins(w.flaeche, 'input.rsa-m'), '37');
  assert.equal(w.zustand().m, 63);
  assert.equal(w.k.alle(w.flaeche, 'table.quadrierkette tbody tr').length, K.modpow(37, 59, 115, { protokoll: true }).schritte.length);
});
test('Eve-Modus: Probedivision mit Zähler; Euklid-Tabelle im Nachspiel; Text als Zahlen mit P5', () => {
  const w = oeffne('rsa', { voreinstellung: { p: 5, q: 11, e: 3 } });
  w.k.klick(w.k.eins(w.flaeche, 'button.eve-zerlegen'));
  assert.match(w.text('.eve-ergebnis'), /5 gefunden nach 4 Versuchen/);
  const e = oeffne('rsa', { voreinstellung: { p: 5, q: 11, e: 3, reiter: ['euklid'] } });
  assert.deepEqual(e.zustand().euklid.schritte, e.k.roh(K.erweiterterEuklid(40, 3)).schritte);
  e.k.taste(e.k.eins(e.flaeche, '.nachspiel'), 'End');
  assert.match(e.text('.euklid-ende'), /d = y mod φ = −13 mod 40 = 27/);
  const t = oeffne('rsa', { voreinstellung: { p: 5, q: 11, e: 3, reiter: ['text'] } });
  t.k.tippe(t.k.eins(t.flaeche, 'textarea.labor-eingabe'), 'hallo');
  assert.deepEqual(t.k.alle(t.flaeche, 'table.text-zahlen td.klar').map((x) => Number(t.k.text(x))), K.zahlen('hallo'));
  assert.match(t.text('.labor-hinweis'), /monoalphabetische Substitution – unsicher \(P5\)/);
});

test('Rechenwerk: Standardwerte eigens gewählt, Produktkette = Zwischenergebnisse des Protokolls, Nachspiel Zeile für Zeile', () => {
  const w = oeffne('rsa');
  const z = w.zustand();
  const k = K.rsa.schluessel(z.p, z.q, z.e);
  assert.deepEqual([z.N, z.phi, z.d], [k.N, k.phi, k.d]);
  assert.equal(z.c, K.rsa.verschluesseln(z.m, z.e, z.N));
  assert.deepEqual(z.warnungen, []);
  // Standardschlüssel kommt in keinem Material vor (Prüfwerte rsa.schluessel)
  const fs = require('node:fs');
  const path = require('node:path');
  const ordner = path.join(__dirname, '..', 'quellen', 'pruefwerte');
  for (const d of fs.readdirSync(ordner).filter((x) => x.endsWith('.json'))) {
    for (const e of JSON.parse(fs.readFileSync(path.join(ordner, d), 'utf8')).werte) {
      if (e.verfahren === 'rsa.schluessel') assert.notDeepEqual([e.eingabe[0], e.eingabe[1]].sort(), [z.p, z.q].sort(), `${d} ${e.id}`);
      if (/^(modpow|rsa\.)/.test(e.verfahren)) assert.notEqual(e.eingabe[2], z.N, `${d} ${e.id}`);
    }
  }
  const proto = K.modpow(z.m, z.e, z.N, { protokoll: true });
  const produkte = w.k.alle(w.flaeche, 'ol.produktkette li').map((li) => Number(w.k.text(li).split('→ ')[1]));
  const erwartet = [];
  proto.schritte.forEach((s, i) => { if (i < proto.schritte.length - 1 && K.mod(s.exponent, 2) === 1) erwartet.push(proto.schritte[i + 1].ergebnis); });
  assert.deepEqual(produkte, erwartet);
  const leiste = w.k.eins(w.flaeche, '.nachspiel');
  w.k.taste(leiste, 'Home');
  assert.equal(w.k.alle(w.flaeche, 'table.quadrierkette tbody tr.kommt').length, proto.schritte.length - 1);
  w.k.taste(leiste, 'End');
  assert.equal(w.k.alle(w.flaeche, 'table.quadrierkette tbody tr.kommt').length, 0);
});

test('Rechenwerk: e-Auswahl aus der Bibliothek (Krypto.rsa.eKandidaten), φ nicht selbst gerechnet (Review M6)', () => {
  const w = oeffne('rsa', { voreinstellung: { p: 13, q: 19 } });
  const werte = w.k.alle(w.flaeche, 'select.rsa-e option').map((o) => Number(o.value));
  assert.deepEqual(werte, K.rsa.eKandidaten(13, 19));
  const src = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'public', 'static', 'js', 'krypto', 'labor', 'rsa.js'), 'utf8');
  assert.doesNotMatch(src, /-\s*1\)\s*\*\s*\(/, 'kein (p − 1) · (q − 1) im Werkzeug');
});
