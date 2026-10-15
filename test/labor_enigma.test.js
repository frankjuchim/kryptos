'use strict';
// Werkzeug „Enigma“ (Kür; Plan M10 Tasks 232/233, E180, E187, E197) nach der Krypto-Werkstatt (Ideen von A. Bodendiek):
// Maschine mit Tagesschlüssel, Walzenfenstern, Lampenfeld, Tastatur und Steckerbrett; Stromweg, Vorführungen, Glossar.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { oeffne, Krypto: K } = require('./hilfen_labor');

const klick = (w, sel) => w.k.klick(w.k.eins(w.flaeche, sel));
const taste = (w, b) => klick(w, `.enigma-taste[data-buchstabe="${b}"]`);
const tippe = (w, text) => {
  for (const b of K.nurBuchstaben(text)) taste(w, b);
};
const STANDARD = { walzen: ['I', 'II', 'III'], ukw: 'B', ringe: 'AAA', grund: 'AAA', stecker: '' };

test('Enigma: Standard, Tasten → BDZGO, Stellung AAF', () => {
  const w = oeffne('enigma');
  for (let i = 0; i < 5; i++) w.k.klick(w.k.eins(w.flaeche, '.enigma-taste[data-buchstabe="A"]'));
  assert.equal(w.zustand().ausgabe, 'BDZGO');
  assert.equal(w.zustand().stellung, 'AAF');
  assert.equal(w.k.eins(w.flaeche, '.enigma-lampe.an').dataset.buchstabe, 'O');
  assert.equal(w.k.alle(w.flaeche, '.enigma-lampe.an').length, 1);
  assert.equal(w.zustand().lampe, 'O');
  assert.equal(w.zustand().eingabe, 'aaaaa');
  assert.deepEqual(w.zustand().einstellung, STANDARD);
  assert.equal(w.text('.enigma-fenster[data-platz="2"] .enigma-fenster-mitte'), 'F');
  assert.equal(w.k.alle(w.flaeche, 'button.enigma-taste').length, 26);
  assert.match(w.text('.enigma-zusammenfassung'), /I-II-III · Ringe AAA · UKW B · 0 Stecker · AAA/);
});

test('Enigma: Doppelschritt im Fenster sichtbar (Grund ADU)', () => {
  const w = oeffne('enigma', { voreinstellung: { einstellung: { grund: 'ADU' } } });
  taste(w, 'A');
  assert.equal(w.zustand().stellung, 'ADV');
  taste(w, 'A');
  assert.equal(w.zustand().stellung, 'AEW');
  taste(w, 'A');
  assert.equal(w.zustand().stellung, 'BFX');
  assert.match(w.text('.station-erklaerung'), /Doppelschritt/);
  assert.equal(w.zustand().ausgabe, K.enigma('aaa', { grund: 'ADU' }));
});

test('Enigma: Beispiel mit 10 Kabeln = Krypto.enigma; Kabel per Antippen', () => {
  const w = oeffne('enigma');
  klick(w, 'button.enigma-beispiel');
  const e = w.zustand().einstellung;
  assert.deepEqual(e.walzen, ['II', 'IV', 'V']);
  assert.equal(e.ringe, 'BUL');
  assert.equal(e.stecker.split(' ').length, 10);
  tippe(w, 'leuchtturm');
  assert.equal(w.zustand().ausgabe, K.enigma('leuchtturm', e));
  // Schlüssel fest, solange geschrieben wird
  klick(w, 'button.enigma-standard');
  assert.deepEqual(w.zustand().einstellung.walzen, ['II', 'IV', 'V']);
  assert.match(w.text('.enigma-hinweis'), /Neue Nachricht/);
  klick(w, 'button.station-neu');
  klick(w, 'button.enigma-standard');
  assert.deepEqual(w.zustand().einstellung, STANDARD);
  // Kabel: Buchse antippen → Partner antippen; nochmals antippen → Kabel ab
  klick(w, '.enigma-buchse[data-buchstabe="A"]');
  klick(w, '.enigma-buchse[data-buchstabe="Z"]');
  assert.equal(w.zustand().einstellung.stecker, 'AZ');
  assert.ok(w.k.eins(w.flaeche, '.enigma-buchse[data-buchstabe="Z"]').classList.contains('gesteckt'));
  tippe(w, 'a');
  assert.equal(w.zustand().ausgabe, K.enigma('a', { stecker: 'AZ' }));
  klick(w, 'button.station-neu');
  klick(w, '.enigma-buchse[data-buchstabe="Z"]');
  assert.equal(w.zustand().einstellung.stecker, '');
  // Walzenlage, Ringe, UKW über die Bedienung
  w.k.waehle(w.k.eins(w.flaeche, 'select.enigma-walze-wahl[data-platz="0"]'), 'IV');
  assert.deepEqual(w.zustand().einstellung.walzen, ['IV', 'II', 'III']);
  klick(w, '.enigma-ring[data-platz="2"] button.enigma-ring-hoch');
  assert.equal(w.zustand().einstellung.ringe, 'AAB');
  klick(w, '.enigma-ukw button[data-ukw="C"]');
  assert.equal(w.zustand().einstellung.ukw, 'C');
  klick(w, '.enigma-fenster[data-platz="1"] button.enigma-stellung-hoch');
  assert.equal(w.zustand().einstellung.grund, 'ABA');
  tippe(w, 'kryptos');
  assert.equal(w.zustand().ausgabe, K.enigma('kryptos', w.zustand().einstellung));
});

test('Enigma: Gegenprobe – Grundstellung, Geheimtext tippen ergibt Klartext', () => {
  const w = oeffne('enigma');
  tippe(w, 'funkspruch');
  const geheim = w.zustand().ausgabe;
  klick(w, 'button.enigma-gegenprobe');
  assert.equal(w.zustand().stellung, 'AAA');
  assert.equal(w.zustand().eingabe, '');
  tippe(w, geheim);
  assert.equal(K.klein(w.zustand().ausgabe), 'funkspruch');
});

test('Enigma: physische Tasten nur bei Fokus in der Maschine; ruhig; Herkunft', async () => {
  const w = oeffne('enigma', { ruhig: true });
  w.k.taste(w.k.eins(w.flaeche, '.enigma-tastatur'), 'a');
  assert.equal(w.zustand().ausgabe, 'B');
  w.k.taste(w.k.eins(w.flaeche, '.station-baender'), 'a');
  assert.equal(w.zustand().ausgabe, 'B', 'außerhalb der Maschine nichts');
  await w.k.ruhe();
  assert.equal(w.k.animiert.length, 0);
  assert.equal(w.text('p.werkzeug-herkunft'), 'Ideen von A. Bodendiek (Krypto-Werkstatt)');
  assert.match(w.text('.station-so-gehts'), /Walze/);
  // Nachspiel sperrt die Tastatur
  klick(w, 'button.station-nachspielen');
  taste(w, 'A');
  assert.equal(w.zustand().ausgabe, 'B');
  klick(w, 'button.station-nachspiel-ende');
  taste(w, 'A');
  assert.equal(w.zustand().ausgabe, 'BD');
  const L = w.k.wert('KRLabor');
  assert.equal(w.k.roh(L.WERKZEUGE.find((x) => x.id === 'enigma')).art, 'kuer');
});

test('Innenleben: Stationen = enigmaSchritt.weg', () => {
  const w = oeffne('enigma', { voreinstellung: { reiter: ['innenleben'] } });
  w.k.klick(w.k.eins(w.flaeche, '.enigma-wahl [data-buchstabe="A"]'));
  const weg = K.enigmaSchritt({ walzen: ['I', 'II', 'III'], ukw: 'B', ringe: 'AAA', grund: 'AAA', stecker: '' }, 'AAA', 'A').weg;
  assert.deepEqual(w.k.alle(w.flaeche, '.enigma-weg [data-station]').map((e) => e.dataset.aus), [weg.steckerEin, ...weg.vor.map((x) => x.aus), weg.ukwAus, ...weg.zurueck.map((x) => x.aus), weg.lampe]);
  // Hin- und Rückweg im Schaubild: durchgezogen bzw. gestrichelt
  assert.ok(w.k.alle(w.flaeche, 'svg.enigma-schaubild path.enigma-hinweg').length >= 4);
  assert.ok(w.k.alle(w.flaeche, 'svg.enigma-schaubild path.enigma-rueckweg').length >= 4);
  assert.equal(w.zustand().lampe, null, 'Innenleben schreibt keine Nachricht');
  // Schritte über KRLabor.nachspiel (je Station ein Schritt)
  klick(w, 'button.station-nachspielen');
  assert.match(w.text('.nachspiel .nachspiel-zaehler'), /von 1[01]/);
});

test('Innenleben: „Blick ins Innere“ zeigt den letzten Tastendruck der Maschine', () => {
  const w = oeffne('enigma');
  tippe(w, 'ab');
  klick(w, 'button.enigma-blick');
  assert.equal(w.zustand().reiter, 'innenleben');
  const weg = K.enigmaSchritt(STANDARD, 'AAB', 'B').weg;
  assert.equal(w.k.alle(w.flaeche, '.enigma-weg [data-station]').at(-1).dataset.aus, weg.lampe);
});

test('vorfuehren_nicht_in_w3_l5', () => {
  const w = oeffne('enigma', { umgebung: { level: 'W3-L5' } });
  assert.equal(w.k.alle(w.flaeche, '[role="tab"][data-reiter="vorfuehren"]').length, 0);
  const l = oeffne('enigma', { umgebung: { level: 'W3-L5', rolle: 'lehrkraft' } });
  assert.equal(l.k.alle(l.flaeche, '[role="tab"][data-reiter="vorfuehren"]').length, 1);
  const v = oeffne('enigma', { voreinstellung: { reiter: ['vorfuehren'] } });
  klick(v, 'button.enigma-vorfuehren-start[data-experiment="selbst"]');
  assert.match(v.text('.enigma-experiment[data-experiment="selbst"] .enigma-ergebnis'), /kein einziges E/i);
  assert.doesNotMatch(K.enigma('E'.repeat(26), STANDARD), /E/);
  klick(v, 'button.enigma-vorfuehren-start[data-experiment="doppelschritt"]');
  assert.match(v.text('.enigma-experiment[data-experiment="doppelschritt"] .enigma-ergebnis'), /ADU → ADV → AEW → BFX/);
  klick(v, 'button.enigma-vorfuehren-start[data-experiment="fuenfmal"]');
  assert.match(v.text('.enigma-experiment[data-experiment="fuenfmal"] .enigma-ergebnis'), new RegExp(K.enigma('AAAAA', STANDARD)));
});

test('Glossar und Hintergrund: Schlüsselraum aus der Bibliothek', () => {
  const w = oeffne('enigma');
  w.reiter('glossar');
  const text = w.text('.enigma-glossar');
  for (const b of ['Walze', 'Ring', 'Kerbe', 'Umkehrwalze', 'Steckerbrett', 'Grundstellung', 'Tagesschlüssel', 'Crib', 'Doppelschritt']) assert.match(text, new RegExp(b));
  assert.ok(w.k.alle(w.flaeche, '.enigma-glossar button[data-ziel]').length >= 3, 'Verweise auf die Reiter');
  const raum = K.schluesselraum('enigma', { kabel: 10 });
  assert.ok(w.text('details.station-hintergrund').includes(raum.formel.split(' · ').pop().slice(0, 3)) || /10/.test(w.text('details.station-hintergrund')));
  assert.match(w.text('details.station-hintergrund'), /Kerckhoffs/);
  klick(w, '.enigma-glossar button[data-ziel="maschine"]');
  assert.equal(w.zustand().reiter, 'maschine');
});

test('Ringstellung wie am Gerät (E176, M10-Review Fund 5): „A (01)“ im Tagesschlüssel und am Walzenfenster', () => {
  const w = oeffne('enigma');
  const ringe = w.k.alle(w.flaeche, '.enigma-ring-text').map((x) => x.textContent);
  assert.deepEqual(ringe, ['Ring A (01)', 'Ring A (01)', 'Ring A (01)']);
  for (const f of w.k.alle(w.flaeche, '.enigma-fenster-info')) assert.match(f.textContent, /^Ring A \(01\) · Kerbe [A-Z]$/);
  // Beispiel mit 10 Kabeln: Ringe BUL → B (02), U (21), L (12)
  w.k.klick(w.k.eins(w.flaeche, 'button.enigma-beispiel'));
  assert.deepEqual(w.k.alle(w.flaeche, '.enigma-fenster-info').map((f) => f.textContent.split(' · ')[0]), ['Ring B (02)', 'Ring U (21)', 'Ring L (12)']);
});
