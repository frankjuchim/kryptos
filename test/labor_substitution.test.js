'use strict';
// Kryptolabor „Substitutions-Werkbank“ (W1 §9.2, Plan M6 Task 115, E74, E78): Anzeige = Krypto.* im Test-Realm.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { oeffne, Krypto: K } = require('./hilfen_labor');
const G = K.substitution('die werkbank zeigt jede zuordnung sofort im klartext an', K.schluesselwortAlphabet('tinte'));
const feld = (w, g) => w.k.eins(w.flaeche, `input.zuordnung[data-geheim="${g}"]`);

test('Werkbank: Live-Klartext = Krypto.teilsubstitution, Anzahl und Rang aus der Bibliothek', () => {
  const w = oeffne('substitution', { voreinstellung: { text: G } });
  assert.equal(w.k.alle(w.flaeche, 'input.zuordnung').length, 26);
  w.k.tippe(feld(w, 'E'), 'd');
  w.k.tippe(feld(w, 'F'), 'i');
  assert.equal(w.text('.werkbank-klartext').replace(/\s/g, ''), K.teilsubstitution(G, { E: 'd', F: 'i' }));
  assert.equal(w.k.text(w.k.eins(w.flaeche, 'td.anzahl[data-geheim="A"]')), String(K.haeufigkeiten(G).A));
  assert.equal(w.k.text(w.k.eins(w.flaeche, 'td.rang[data-geheim="A"]')), String(K.rangfolge(G).indexOf('A') + 1));
  const fehlt = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').find((c) => !G.includes(c));
  assert.equal(w.k.text(w.k.eins(w.flaeche, `td.rang[data-geheim="${fehlt}"]`)), '–');
  assert.match(w.text('.werkbank-fortschritt'), new RegExp(`2 von ${K.rangfolge(G).length} verschiedenen`));
  assert.equal(w.zustand().klartext, K.teilsubstitution(G, { E: 'd', F: 'i' }));
  assert.equal(w.zustand().text, G);
});

test('Werkbank: Konflikt sichtbar, Rückgängig/Wiederholen, Zurücksetzen, Vorgaben gesperrt', () => {
  const w = oeffne('substitution', { voreinstellung: { text: G, vorgabe: { A: 'e' } } });
  assert.equal(feld(w, 'A').readOnly, true);
  w.k.tippe(feld(w, 'Q'), 'e');
  assert.ok(feld(w, 'Q').classList.contains('konflikt') && feld(w, 'A').classList.contains('konflikt'));
  assert.match(w.text('.labor-hinweis'), /e ist schon A zugeordnet/);
  assert.deepEqual(w.zustand().konflikte, ['A', 'Q']);
  w.k.klick(w.k.eins(w.flaeche, 'button.rueckgaengig'));
  assert.equal(feld(w, 'Q').value, '');
  w.k.klick(w.k.eins(w.flaeche, 'button.wiederholen'));
  assert.equal(feld(w, 'Q').value, 'e');
  w.k.klick(w.k.eins(w.flaeche, 'button.zuruecksetzen'));
  assert.deepEqual(w.zustand().zuordnung, { A: 'e' });
});

test('Werkbank: Tastatur – Tippen springt weiter, Pfeile wechseln, Rücktaste leert, Strg+Z/Y', () => {
  const w = oeffne('substitution', { voreinstellung: { text: G } });
  feld(w, 'E').focus();
  w.k.tippe(feld(w, 'E'), 'd');
  const naechstes = 'FGHIJKLMNOPQRSTUVWXYZ'.split('').find((c) => G.includes(c));
  assert.equal(w.k.document.activeElement.dataset.geheim, naechstes, 'springt zum nächsten vorkommenden Geheimbuchstaben');
  w.k.taste(w.k.document.activeElement, 'ArrowLeft');
  assert.equal(w.k.document.activeElement.dataset.geheim, String.fromCharCode(naechstes.charCodeAt(0) - 1), '← zum linken Nachbarfeld');
  w.k.taste(feld(w, 'E'), 'Backspace');
  assert.equal(feld(w, 'E').value, '');
  assert.deepEqual(w.zustand().zuordnung, {});
  w.k.taste(feld(w, 'E'), 'z', { ctrlKey: true });
  assert.deepEqual(w.zustand().zuordnung, { E: 'd' });
  w.k.taste(feld(w, 'E'), 'y', { ctrlKey: true });
  assert.deepEqual(w.zustand().zuordnung, {});
});

test('Werkbank: Musterwortsuche und Bigramm-Hinweise über die Bibliothek', () => {
  const w = oeffne('substitution', { voreinstellung: { text: G } });
  assert.equal(w.k.alle(w.flaeche, '.werkbank tr.werkbank-referenz[hidden]').length, 2, 'Hinweise zunächst aus');
  w.k.klick(w.k.eins(w.flaeche, 'input.hinweise-an'));
  w.k.tippe(w.k.eins(w.flaeche, 'input.muster'), 'ABA');
  const fundstellen = new Set(w.k.alle(w.flaeche, '.geheimtext mark.muster').map((m) => m.dataset.von));
  assert.deepEqual([...fundstellen].map(Number), K.musterSuchen(G, 'ABA'));
  assert.ok(w.k.alle(w.flaeche, '.werkbank td.referenz').length > 0);
  assert.equal(w.k.alle(w.flaeche, '.werkbank tr.werkbank-referenz[hidden]').length, 0);
  // Referenzrang: i-häufigster Geheimbuchstabe ↔ i-häufigster deutscher Buchstabe
  const deutsch = Object.keys(K.DEUTSCH).sort((a, b) => K.DEUTSCH[b] - K.DEUTSCH[a] || a.localeCompare(b));
  const erster = K.rangfolge(G)[0];
  assert.equal(w.k.text(w.k.eins(w.flaeche, `td.referenz[data-geheim="${erster}"]`)), K.klein(deutsch[0]));
  const bi = K.ngramme(G, { n: 2, top: 1 })[0];
  assert.ok(w.k.alle(w.flaeche, '.geheimtext mark.bigramm').some((m) => Number(m.dataset.von) === bi.positionen[0]));
});

test('Werkbank: Nachspiel „Verlauf“ zeigt den Zustand nach jeder Zuordnung', () => {
  const w = oeffne('substitution', { voreinstellung: { text: G } });
  w.k.tippe(feld(w, 'E'), 'd');
  w.k.tippe(feld(w, 'F'), 'i');
  w.k.klick(w.k.eins(w.flaeche, 'details.werkbank-verlauf > summary'));
  const leiste = w.k.eins(w.flaeche, '.werkbank-verlauf .nachspiel');
  w.k.taste(leiste, 'Home');
  assert.match(w.k.text(w.k.eins(leiste, '.nachspiel-zaehler')), /Schritt 1 von 3/);
  w.k.taste(leiste, 'ArrowRight');
  assert.match(w.k.text(w.k.eins(leiste, '.nachspiel-text')), /E ↦ d/);
  assert.equal(w.text('.verlauf-klartext').replace(/\s/g, ''), K.teilsubstitution(G, { E: 'd' }));
});

test('Werkbank: Funkraum-Haken entprellt (2 s), kein Speicher, keine Anfragen', async () => {
  const gesendet = [];
  const w = oeffne('substitution', { voreinstellung: { text: G }, umgebung: { beiAenderung: (z) => gesendet.push(z) } });
  w.k.tippe(feld(w, 'E'), 'd');
  w.k.tippe(feld(w, 'F'), 'i');
  assert.ok(w.k.timer.some((t) => t.ms === 2000));
  await w.k.ruhe();
  assert.equal(gesendet.length, 1);
  assert.deepEqual(w.k.roh(gesendet[0]), { E: 'd', F: 'i' });
  assert.deepEqual(w.k.anfragen, []);
  assert.equal(w.k.window.localStorage.length, 0);
});
