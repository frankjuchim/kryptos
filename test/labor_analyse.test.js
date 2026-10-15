'use strict';
// Werkzeug „Angreifer-Labor“ (Plan M10 Task 234, E180, E188, E189) nach der Krypto-Werkstatt (Ideen von A. Bodendiek):
// Häufigkeitsvergleich mit Vorhersage, Schlüsselraum (ab Welt 2), Vorhersage-Trainer, Angreifer-Blick.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { oeffne, Krypto: K } = require('./hilfen_labor');

const klick = (w, sel) => w.k.klick(w.k.eins(w.flaeche, sel));
/** fester Zufall: liefert reihum die Werte der Liste */
const zufall = (...werte) => {
  let i = 0;
  return () => werte[i++ % werte.length];
};

test('Vergleich: erst Vorhersage, dann Ansehen; Histogramm = Krypto.haeufigkeiten', () => {
  const w = oeffne('analyse');
  assert.equal(w.k.eins(w.flaeche, 'button.analyse-ansehen').disabled, true);
  assert.ok(w.k.eins(w.flaeche, '.analyse-geheim-histogramm').classList.contains('verdeckt'));
  assert.match(w.text('.analyse-geheim-histogramm'), /noch verdeckt/);
  const verdeckt = w.k.eins(w.flaeche, '.analyse-geheim-histogramm').firstChild;
  assert.equal(verdeckt.getAttribute('aria-hidden'), 'true', 'verdecktes Diagramm nicht vorgelesen');
  assert.equal(verdeckt.inert, true, 'verdecktes Diagramm nicht per Tastatur erreichbar');
  w.k.klick(w.k.alle(w.flaeche, '.analyse-vorhersage button')[0]);
  w.k.klick(w.k.eins(w.flaeche, 'button.analyse-ansehen'));
  assert.equal(w.zustand().gezeigt, true);
  assert.equal(w.k.eins(w.flaeche, '.analyse-geheim-histogramm').classList.contains('verdeckt'), false);
  assert.equal(w.k.eins(w.flaeche, '.analyse-geheim-histogramm').firstChild.getAttribute('aria-hidden'), null);
  // Säulen = Krypto.haeufigkeiten des Geheimtexts (Tabelle der Histogramm-Komponente)
  const { geheimtext, verfahren } = w.zustand();
  assert.equal(verfahren, 'skytale');
  const hf = K.haeufigkeiten(geheimtext);
  const zeilen = w.k.alle(w.flaeche, '.analyse-geheim-histogramm .haeufigkeit-tabelle tbody tr');
  const e = zeilen.find((z) => w.k.text(z).trim().startsWith('E'));
  assert.match(w.k.text(e), new RegExp(`\\b${hf.E}\\b`));
  // Transposition: Häufigkeiten wie im Klartext → Vorhersage „genau wie im Deutschen“ stimmt
  assert.match(w.text('.analyse-rueckmeldung'), /Richtig|stimmt/i);
  assert.match(w.text('.analyse-merke'), /Transposition/);
  // Verfahren wechseln setzt die Vorhersage zurück
  klick(w, '.analyse-verfahren [data-verfahren="caesar"]');
  assert.equal(w.zustand().gezeigt, false);
  assert.equal(w.zustand().geheimtext, K.caesar(w.zustand().klartext, 3));
});

test('Vergleich: eigener Text, Hinweis unter 80 Buchstaben', () => {
  const w = oeffne('analyse');
  w.k.tippe(w.k.eins(w.flaeche, '.analyse-eigen textarea'), 'kurzer text');
  assert.match(w.text('.analyse-textinfo'), /80/);
  assert.equal(w.zustand().klartext, K.nurBuchstaben('kurzer text'));
});

test('schluesselraum_erst_ab_welt2 und Optionen nach Welt', () => {
  const w = oeffne('analyse', { umgebung: { welten: [0, 1] } });
  assert.equal(w.k.alle(w.flaeche, '[role="tab"][data-reiter="schluesselraum"]').length, 0);
  assert.equal(w.k.alle(w.flaeche, '.analyse-verfahren [data-verfahren="playfair"]').length, 0);
  assert.equal(w.k.alle(w.flaeche, '.analyse-verfahren [data-verfahren="vigenere"]').length, 0);
  const v = oeffne('analyse', { umgebung: { welten: [0, 1, 2] } });
  assert.equal(v.k.alle(v.flaeche, '[role="tab"][data-reiter="schluesselraum"]').length, 1);
  assert.equal(v.k.alle(v.flaeche, '.analyse-verfahren [data-verfahren="playfair"]').length, 1);
  assert.equal(v.k.alle(v.flaeche, '.analyse-verfahren [data-verfahren="enigma"]').length, 0, 'Enigma erst ab Welt 3');
});

test('Schlüsselraum: Balken und Dauer aus der Bibliothek', () => {
  const w = oeffne('analyse', { voreinstellung: { reiter: ['schluesselraum'] } });
  klick(w, '.analyse-leistung button[data-leistung="9"]');
  const zeile = w.k.eins(w.flaeche, '.analyse-raum [data-verfahren="substitution"]');
  assert.match(w.k.text(zeile), /≈ 1,3 · 10¹⁰ Jahre/);
  assert.equal(K.suchdauer(K.schluesselraum('substitution').log10, 1e9).text, '≈ 1,3 · 10¹⁰ Jahre');
  assert.match(w.k.text(zeile), /26!/);
  const caesar = w.k.eins(w.flaeche, '.analyse-raum [data-verfahren="caesar"]');
  assert.match(w.k.text(caesar), /< 1 Sekunde/);
  assert.ok(Number.parseFloat(zeile.style.getPropertyValue('--balken')) > Number.parseFloat(caesar.style.getPropertyValue('--balken')));
  assert.match(w.text('.analyse-pointe'), /Häufigkeit/);
  // Bandlänge für Skytale/Pflügen
  w.k.tippe(w.k.eins(w.flaeche, 'input.analyse-laenge'), '');
  assert.match(w.k.text(w.k.eins(w.flaeche, '.analyse-raum [data-verfahren="skytale"]')), /n − 2/);
});

test('Trainer und Blick: deterministisch mit zufall, Rückmeldung, keine Speicherung', () => {
  const t1 = oeffne('analyse', { voreinstellung: { reiter: ['trainer'] }, umgebung: { zufall: zufall(0.1, 0.5, 0.3, 0.7) } });
  const t2 = oeffne('analyse', { voreinstellung: { reiter: ['trainer'] }, umgebung: { zufall: zufall(0.1, 0.5, 0.3, 0.7) } });
  assert.equal(t1.text('.analyse-frage'), t2.text('.analyse-frage'), 'gleicher Zufall → gleiche Aufgabe');
  const loesung = t1.zustand().aufgabe.antwort;
  assert.ok(loesung, 'Aufgabe hat eine Antwort (bleibt im Werkzeug)');
  assert.equal(t1.text('.analyse-rueckmeldung'), '', 'vor dem Prüfen keine Lösung sichtbar');
  t1.k.tippe(t1.k.eins(t1.flaeche, '.analyse-antwort input'), loesung);
  klick(t1, 'button.analyse-pruefen');
  assert.match(t1.text('.analyse-rueckmeldung'), /Richtig/);
  assert.match(t1.text('.analyse-weg'), /\S/);
  assert.equal(t1.zustand().serie, 1);
  klick(t1, 'button.analyse-naechste');
  t1.k.tippe(t1.k.eins(t1.flaeche, '.analyse-antwort input'), '#');
  klick(t1, 'button.analyse-pruefen');
  assert.equal(t1.zustand().serie, 0);
  assert.match(t1.text('.analyse-rueckmeldung'), /Leider nicht/);
  assert.equal(t1.k.anfragen.length, 0, 'keine Anfragen');

  const b = oeffne('analyse', { voreinstellung: { reiter: ['blick'] }, umgebung: { zufall: zufall(0, 0.2, 0.4) } });
  assert.equal(b.k.alle(b.flaeche, '.analyse-blick .histogramm').length, 2);
  assert.equal(b.text('.analyse-aufloesung'), '');
  const gruppe = b.zustand().fall.gruppe;
  klick(b, `.analyse-urteil button[data-gruppe="${gruppe}"]`);
  assert.match(b.text('.analyse-aufloesung'), /Richtig erkannt/);
  assert.match(b.text('.analyse-blick'), /Kerckhoffs/);
  klick(b, 'button.analyse-neu');
  assert.equal(b.text('.analyse-aufloesung'), '');
  const a = oeffne('analyse', { voreinstellung: { reiter: ['blick'] }, umgebung: { welten: [0, 1], zufall: zufall(0.99, 0.5) } });
  assert.ok(['skytale', 'pfluegen', 'caesar', 'substitution'].includes(a.zustand().fall.verfahren), 'nur erlaubte Verfahren');
});

test('analyse: Herkunft, ruhig, So funktioniert’s', () => {
  const w = oeffne('analyse', { ruhig: true });
  assert.equal(w.text('p.werkzeug-herkunft'), 'Ideen von A. Bodendiek (Krypto-Werkstatt)');
  assert.match(w.text('.station-so-gehts'), /vorher/i);
  assert.equal(w.k.animiert.length, 0);
});
