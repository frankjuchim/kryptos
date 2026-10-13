'use strict';
// Review M6 W5: keine Überflutung des Screenreaders. Ausgaben sind nicht selbst live, sondern sagen entprellt (≈ 500 ms)
// „Ergebnis aktualisiert, n Zeichen“ an; je Reiter höchstens ein laufender Live-Bereich (Hash, RSA); die Anzeige k der
// Scheibe nur über aria-valuetext; Nachspiel im Tempo „Normal“ ohne Ansage je Schritt (nur Einzelschritt/Pause).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const D = require('./dom_attrappe');
const { oeffne, BASIS } = require('./hilfen_labor');

const live = (k, el) => k.alle(el, '[aria-live="polite"]').filter((x) => !x.classList.contains('nachspiel-text'));

test('Ausgabe: output nicht live; entprellte Ansage „Ergebnis aktualisiert, n Zeichen“ (500 ms), erste Belegung still', async () => {
  const k = D.lade(BASIS, { zeitraffer: 100 });
  const B = k.wert('KRLaborBau');
  const a = B.ausgabe({ beschriftung: 'Ergebnis', art: 'geheimtext' });
  k.document.getElementById('haupt').appendChild(a.element);
  assert.notEqual(a.ausgabe.getAttribute('aria-live'), 'polite', 'output selbst nicht live');
  const ansage = k.eins(a.element, '.labor-ansage');
  assert.equal(ansage.getAttribute('aria-live'), 'polite');
  assert.ok(ansage.classList.contains('sr'), 'nur für Screenreader');
  a.setze('ABCDE');
  await k.ruhe();
  assert.equal(k.text(ansage), '', 'erste Belegung ohne Ansage');
  a.setze('ABCDEF');
  a.setze('ABCDEFG');
  assert.equal(k.text(ansage), '', 'noch nicht angesagt (entprellt)');
  await k.ruhe();
  assert.equal(k.text(ansage), 'Ergebnis aktualisiert, 7 Zeichen');
  assert.ok(k.timer.some((t) => t.ms === 500), 'Entprellung 500 ms');
  a.setze('');
  await k.ruhe();
  assert.equal(k.text(ansage), 'Ergebnis leer');
});

test('Scheibe: k nur über aria-valuetext des Drehknopfs, die Anzeige ist nicht live', () => {
  const w = oeffne('scheibe');
  assert.notEqual(w.k.eins(w.flaeche, '.scheibe-k').getAttribute('aria-live'), 'polite');
  assert.match(w.k.eins(w.flaeche, '.scheibe-drehknopf').getAttribute('aria-valuetext'), /3/);
});

test('Hash-Labor: je Reiter höchstens ein Live-Bereich', () => {
  for (const r of ['schritte', 'lawine', 'kollision', 'baukasten', 'passwort', 'pruefsumme']) {
    const w = oeffne('hash', { voreinstellung: { reiter: [r] }, umgebung: { zufall: () => 0.5 } });
    assert.ok(live(w.k, w.flaeche).length <= 1, `${r}: ${live(w.k, w.flaeche).map((x) => x.getAttribute('class')).join(', ')}`);
  }
});

test('RSA-Rechenwerk: Schlüssel, Warnungen und Ergebnis nicht einzeln live – eine entprellte Ansage (plus Eve-Antwort)', async () => {
  const w = oeffne('rsa');
  for (const sel of ['.rsa-schluessel', '.rsa-warnungen', '.rsa-ergebnis']) assert.notEqual(w.k.eins(w.flaeche, sel).getAttribute('aria-live'), 'polite', sel);
  assert.ok(live(w.k, w.flaeche).length <= 2, live(w.k, w.flaeche).map((x) => x.getAttribute('class')).join(', '));
  const ansage = w.k.eins(w.flaeche, '.labor-ansage');
  w.k.tippe(w.k.eins(w.flaeche, 'input.rsa-m'), '7');
  await w.k.ruhe();
  assert.match(w.k.text(ansage), /= \d+/, 'Ergebnis angesagt');
  for (const r of ['euklid', 'text']) {
    const v = oeffne('rsa', { voreinstellung: { reiter: [r] } });
    assert.ok(live(v.k, v.flaeche).length <= 2, `${r}: ${live(v.k, v.flaeche).map((x) => x.getAttribute('class')).join(', ')}`);
  }
});

test('Nachspiel: im Tempo „Normal“ während des Abspielens nicht live, bei Pause und Einzelschritt wieder live', async () => {
  const w = oeffne('skytale');
  const leiste = w.k.eins(w.flaeche, '.nachspiel');
  const text = w.k.eins(leiste, '.nachspiel-text');
  assert.equal(text.getAttribute('aria-live'), 'polite', 'Einzelschritt: live');
  w.k.klick(w.k.eins(leiste, '.nachspiel-tempo-wahl[data-tempo="normal"]'));
  w.k.klick(w.k.eins(leiste, '.nachspiel-abspielen'));
  assert.equal(text.getAttribute('aria-live'), 'off', 'Normal läuft: still');
  w.k.klick(w.k.eins(leiste, '.nachspiel-abspielen'));
  assert.equal(text.getAttribute('aria-live'), 'polite', 'Pause: live');
  w.k.klick(w.k.eins(leiste, '.nachspiel-tempo-wahl[data-tempo="zeitlupe"]'));
  w.k.klick(w.k.eins(leiste, '.nachspiel-abspielen'));
  assert.equal(text.getAttribute('aria-live'), 'polite', 'Zeitlupe: live');
  w.ctrl.schliesse();
});
