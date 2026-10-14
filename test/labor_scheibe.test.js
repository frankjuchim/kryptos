'use strict';
// Werkzeug „Chiffrierscheibe“ (W0 §9.2, Plan M6 Task 111): Drehen, Formel-Modus, Text-Modus, Brute-Force, Gast.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { oeffne, Krypto: K } = require('./hilfen_labor');

test('Scheibe: drehen per Tasten und Knöpfen (zyklisch), Leiste = Krypto.caesar, aria-valuetext', () => {
  const w = oeffne('scheibe', { voreinstellung: { k: 3 } });
  const knopf = w.k.eins(w.flaeche, '.scheibe-drehknopf');
  assert.equal(w.text('.scheibe-k'), 'k = 3');
  assert.equal(knopf.getAttribute('aria-valuetext'), 'k = 3: a wird zu D');
  w.k.taste(knopf, 'ArrowRight'); w.k.klick(w.k.eins(w.flaeche, '.scheibe-plus'));
  assert.equal(w.zustand().k, 5);
  w.k.taste(knopf, 'End'); w.k.taste(knopf, 'ArrowRight');
  assert.equal(w.zustand().k, 0, '25 + 1 → 0');
  w.k.taste(knopf, 'PageUp');
  assert.equal(w.zustand().k, 5);
  const zeile = w.k.alle(w.flaeche, 'table.alphabet tbody tr').at(-1); // Geheimtextzeile (th = Beschriftung)
  assert.equal(w.k.alle(zeile, 'td').map((c) => w.k.text(c)).join(''), K.caesar(K.ALPHABET, 5));
  // Ziehen am Innenring: ein Schritt = 360/26 Grad gegen den Uhrzeigersinn → k + 1 (nur Darstellung).
  // M10 Task 226: Werkstatt-Geometrie – die Papierscheibe (innen) liegt zwischen r ≈ 69 und 115 (vorher r = 140)
  const svg = w.k.eins(w.flaeche, 'svg.scheibe-ringe');
  w.k.zeiger(svg, 'pointerdown', { clientX: 160, clientY: 65 });
  w.k.zeiger(svg, 'pointermove', { clientX: 160 - 95 * Math.sin((2 * Math.PI) / 26), clientY: 160 - 95 * Math.cos((2 * Math.PI) / 26) });
  w.k.zeiger(svg, 'pointerup', { clientX: 0, clientY: 0 });
  assert.equal(w.zustand().k, 6);
});

test('Scheibe: Formel-Modus mit Falle P2, Basis A = 0', () => {
  const w = oeffne('scheibe', { voreinstellung: { k: 3 } });
  w.k.klick(w.k.eins(w.flaeche, '.scheibe-buchstabe[data-buchstabe="W"]'));
  assert.match(w.text('.scheibe-formel'), /\(\(23 \+ 3 − 1\) mod 26\) \+ 1 = 26 → Z/);
  assert.match(w.text('.labor-hinweis'), /P2/);
  w.k.klick(w.k.eins(w.flaeche, '.labor-basis [data-basis="0"]'));
  assert.match(w.text('.scheibe-formel'), /\(22 \+ 3\) mod 26 = 25 → Z/);
  assert.equal(w.zustand().aktiv, 'W');
  w.k.klick(w.k.eins(w.flaeche, '.scheibe-buchstabe[data-buchstabe="B"]'));
  assert.match(w.text('.scheibe-formel'), /\(1 \+ 3\) mod 26 = 4 → E/);
});

test('Scheibe: Text-Modus = Krypto.caesar, Nachspiel je Buchstabe, Sperre während des Abspielens', async () => {
  const w = oeffne('scheibe', { voreinstellung: { k: 3, reiter: ['text'] } });
  w.k.tippe(w.k.eins(w.flaeche, 'textarea.labor-eingabe'), 'Kryptolabor!');
  assert.equal(w.ohneLeer('output.labor-ausgabe'), K.caesar('Kryptolabor!', 3));
  assert.equal(w.text('output.labor-ausgabe'), K.gruppieren(K.caesar('Kryptolabor!', 3)));
  w.k.klick(w.k.eins(w.flaeche, '.labor-richtung [data-richtung="ent"]'));
  assert.equal(w.ohneLeer('output.labor-ausgabe'), K.klein(K.caesar('Kryptolabor!', 3, 'ent')));
  w.k.klick(w.k.eins(w.flaeche, '.labor-richtung [data-richtung="ver"]'));
  const leiste = w.k.eins(w.flaeche, '.nachspiel');
  assert.match(w.k.text(w.k.eins(leiste, '.nachspiel-zaehler')), /von 11/);
  w.k.taste(leiste, 'ArrowRight');
  assert.match(w.k.text(w.k.eins(leiste, '.nachspiel-text')), /r \(18\) → U \(21\)/);
  assert.equal(w.zustand().aktiv, 'R', 'Scheibe markiert den Klartextbuchstaben');
  w.k.klick(w.k.eins(leiste, '.nachspiel-abspielen'));
  assert.equal(w.k.eins(w.flaeche, 'textarea.labor-eingabe').disabled, true);
  assert.equal(w.k.eins(w.flaeche, '.scheibe-plus').disabled, true);
  await w.k.ruhe();
  assert.equal(w.k.eins(w.flaeche, 'textarea.labor-eingabe').disabled, false);
  assert.equal(w.k.eins(w.flaeche, '.scheibe-plus').disabled, false);
  assert.equal(w.zustand().ausgabe, K.caesar('Kryptolabor!', 3));
});

test('Scheibe: Alle Verschiebungen (Brute-Force) ohne automatische Erkennung', () => {
  const w = oeffne('scheibe', { voreinstellung: { reiter: ['alle'] } });
  const zeilen = w.k.alle(w.flaeche, '.alle-schluessel tr[data-schluessel]');
  assert.equal(zeilen.length, 26);
  assert.deepEqual(zeilen.map((z) => w.k.text(z.querySelector('td.ergebnis')).replace(/\s/g, '')), K.alleCaesar('HLNSZWOPC').map((x) => K.klein(x.text).slice(0, 20)));
  assert.match(w.k.text(zeilen[0]), /schwacher Schlüssel/);
  assert.equal(w.k.alle(w.flaeche, '.richtig, [data-richtig]').length, 0);
  w.k.tippe(w.k.eins(w.flaeche, 'textarea.labor-eingabe'), 'X');
  assert.equal(w.k.text(w.k.alle(w.flaeche, '.alle-schluessel td.ergebnis')[1]).replace(/\s/g, ''), K.klein(K.alleCaesar('HLNSZWOPCX')[1].text));
});

test('Scheibe: Wechsel Text → Alle übernimmt die eigene Ausgabe als abgefangenen Geheimtext', () => {
  const w = oeffne('scheibe', { voreinstellung: { k: 7, text: 'nebelhorn' } });
  w.reiter('text');
  w.reiter('alle');
  assert.equal(w.k.eins(w.flaeche, 'textarea.labor-eingabe').value, K.caesar('nebelhorn', 7));
  assert.equal(w.k.text(w.k.alle(w.flaeche, '.alle-schluessel td.ergebnis')[7]).replace(/\s/g, ''), 'nebelhorn');
});

test('Scheibe im Gastmodus: alle Reiter, keine Anfragen, kein localStorage; reduzierte Bewegung ohne Animation', () => {
  const w = oeffne('scheibe', { umgebung: { modus: 'gast', rolle: null, niveau: null, welten: undefined }, ruhig: true });
  assert.deepEqual(w.k.alle(w.flaeche, '[role="tab"]').map((t) => t.dataset.reiter), ['scheibe', 'text', 'alle']);
  w.k.taste(w.k.eins(w.flaeche, '.scheibe-drehknopf'), 'ArrowRight');
  assert.equal(w.k.eins(w.flaeche, 'g.scheibe-innen').classList.contains('animiert'), false);
  assert.deepEqual(w.k.anfragen, []);
  assert.equal(w.k.window.localStorage.length, 0);
  const v = oeffne('scheibe');
  v.k.taste(v.k.eins(v.flaeche, '.scheibe-drehknopf'), 'ArrowRight');
  assert.equal(v.k.eins(v.flaeche, 'g.scheibe-innen').classList.contains('animiert'), true, 'ohne reduzierte Bewegung animiert');
});

test('Scheibe: ungültige Voreinstellung fällt auf den Standard zurück (k = 3, Basis 1)', () => {
  const w = oeffne('scheibe', { voreinstellung: { k: 99, basis: 7, richtung: 'quer' } });
  assert.deepEqual([w.zustand().k, w.zustand().basis, w.zustand().richtung], [3, 1, 'ver']);
});

test('Scheibe (Funkraum, M7 Task 152): beginnt die Voreinstellung mit „alle“, ist text der abgefangene Geheimtext', () => {
  const w = oeffne('scheibe', { voreinstellung: { reiter: ['alle', 'scheibe', 'text'], text: 'OHSAL AKLUW HZZ' } });
  assert.equal(w.k.eins(w.flaeche, 'textarea.labor-eingabe').value, 'OHSAL AKLUW HZZ');
  assert.equal(w.k.text(w.k.alle(w.flaeche, '.alle-schluessel td.ergebnis')[7]).replace(/\s/g, ''), K.klein(K.alleCaesar('OHSALAKLUWHZZ')[7].text).slice(0, 20));
});

/* ---------- M10 Task 226: Scheibe nach der Krypto-Werkstatt ---------- */
test('Scheibe: Außenring antippen schreibt Klartext und Geheimtext (Flug), Rechnung = Krypto.caesar', () => {
  const w = oeffne('scheibe', { voreinstellung: { k: 3 } });
  for (const b of ['h', 'u', 'n', 'd']) w.k.klick(w.k.eins(w.flaeche, `.scheibe-aussen [data-buchstabe="${b}"]`));
  assert.equal(w.zustand().eingabe, 'hund');
  assert.equal(w.zustand().ausgabe, K.caesar('hund', 3));
  assert.equal(w.ohneLeer('.station-baender output.geheim'), 'KXQG');
  assert.equal(w.ohneLeer('.station-baender output.klar'), 'hund');
  assert.equal(w.k.animiert.length, 8, 'je Buchstabe zwei Flüge (außen und innen)');
  assert.match(w.text('.scheibe-nabe-zeile'), /a → D · Verschiebung 3/);
  assert.equal(w.k.eins(w.flaeche, 'ol.station-anleitung li[aria-current="step"]').textContent.includes('Geheimtext ablesen'), true);
  // Text eintippen schreibt dieselbe Nachricht (E171)
  assert.equal(w.k.eins(w.flaeche, '.scheibe-tippen textarea').value, 'hund');
  w.k.tippe(w.k.eins(w.flaeche, '.scheibe-tippen textarea'), 'e');
  assert.equal(w.zustand().ausgabe, K.caesar('hunde', 3));
});

test('Scheibe: ent – Innenring antippen ergibt den Klartext', () => {
  const w = oeffne('scheibe', { voreinstellung: { k: 3, richtung: 'ent' } });
  for (const b of 'KXQG') w.k.klick(w.k.eins(w.flaeche, `.scheibe-innen [data-buchstabe="${b}"]`));
  assert.equal(w.zustand().eingabe, 'KXQG');
  assert.equal(w.zustand().ausgabe, 'hund');
  w.k.klick(w.k.eins(w.flaeche, '.scheibe-aussen [data-buchstabe="a"]'));
  assert.equal(w.zustand().eingabe, 'KXQG', 'außen antippen schreibt beim Entschlüsseln nichts');
  assert.match(w.text('.station-erklaerung-text'), /inneren Scheibe/);
});

test('Scheibe: Schlüsselwechsel mitten in der Nachricht nur über „Neue Nachricht mit neuem Schlüssel“', () => {
  const w = oeffne('scheibe', { voreinstellung: { k: 3 } });
  w.k.klick(w.k.eins(w.flaeche, '.scheibe-aussen [data-buchstabe="h"]'));
  w.k.klick(w.k.eins(w.flaeche, '.scheibe-plus'));
  assert.equal(w.zustand().k, 3, 'Schlüssel bleibt');
  assert.match(w.text('.scheibe-sperre'), /Neue Nachricht mit neuem Schlüssel\?/);
  w.k.klick(w.k.eins(w.flaeche, 'button.scheibe-neu-schluessel'));
  assert.equal(w.zustand().k, 4);
  assert.equal(w.zustand().eingabe, '');
});

test('Scheibe: Formel-Modus und A = 0 bleiben (Leiste unter der Scheibe)', () => {
  const w = oeffne('scheibe', { voreinstellung: { k: 3 } });
  w.k.klick(w.k.eins(w.flaeche, '.scheibe-buchstabe[data-buchstabe="W"]'));
  assert.match(w.text('.scheibe-formel'), /= 26 → Z/);
  w.k.klick(w.k.eins(w.flaeche, '.labor-basis [data-basis="0"]'));
  assert.match(w.text('.scheibe-formel'), /\(22 \+ 3\) mod 26 = 25 → Z/);
  assert.equal(w.zustand().eingabe, '', 'die Leiste schreibt nicht in die Nachricht');
});

test('Scheibe: nachspiel_sperrt_handgriffe – während des Nachspiels kein Antippen, kein Drehen; danach Nachricht gleich', () => {
  const w = oeffne('scheibe', { voreinstellung: { k: 3 } });
  for (const b of ['h', 'u', 'n', 'd']) w.k.klick(w.k.eins(w.flaeche, `.scheibe-aussen [data-buchstabe="${b}"]`));
  w.k.klick(w.k.eins(w.flaeche, 'button.station-nachspielen'));
  assert.equal(w.zustand().gesperrt, true);
  assert.match(w.text('.station-sperrhinweis'), /Während des Nachspielens/);
  const leiste = w.k.eins(w.flaeche, '.nachspiel');
  w.k.taste(leiste, 'ArrowRight');
  w.k.taste(leiste, 'ArrowRight');
  assert.equal(w.ohneLeer('.station-baender output.geheim'), 'KX', 'Bänder wachsen Schritt für Schritt');
  w.k.klick(w.k.eins(w.flaeche, '.scheibe-aussen [data-buchstabe="z"]'));
  w.k.klick(w.k.eins(w.flaeche, '.scheibe-plus'));
  assert.equal(w.zustand().k, 3);
  w.k.klick(w.k.eins(w.flaeche, 'button.station-nachspiel-ende'));
  assert.equal(w.zustand().gesperrt, false);
  assert.equal(w.zustand().eingabe, 'hund');
  assert.equal(w.zustand().ausgabe, 'KXQG');
  assert.equal(w.k.alle(w.flaeche, '.station-sperrhinweis').length, 0);
});

test('Scheibe: ruhig ohne animate (keine Flüge, Ring ohne Animation)', () => {
  const w = oeffne('scheibe', { voreinstellung: { k: 3 }, ruhig: true });
  for (const b of ['a', 'b', 'c']) w.k.klick(w.k.eins(w.flaeche, `.scheibe-aussen [data-buchstabe="${b}"]`));
  assert.equal(w.k.animiert.length, 0);
  assert.equal(w.zustand().ausgabe, 'DEF');
});

test('Scheibe: Herkunftszeile und Hintergrund mit Schlüsselraum aus der Bibliothek', () => {
  const w = oeffne('scheibe');
  assert.equal(w.text('p.werkzeug-herkunft'), 'Ideen von A. Bodendiek (Krypto-Werkstatt)');
  assert.match(w.text('details.station-hintergrund'), new RegExp(`${K.schluesselraum('caesar').anzahl}, davon 25 sinnvoll`));
  // Wechsel Scheibe → Alle: der eigene Geheimtext wird abgefangen
  for (const b of ['h', 'u', 'n', 'd']) w.k.klick(w.k.eins(w.flaeche, `.scheibe-aussen [data-buchstabe="${b}"]`));
  w.reiter('alle');
  assert.equal(w.k.eins(w.flaeche, 'textarea.labor-eingabe').value, 'KXQG');
});
