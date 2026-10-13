'use strict';
// Werkzeug „Skytale & Gitter“ (W0 §9.1, Plan M6 Task 112): Skytale, Gartenzaun, Fleißner-Schablone.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { oeffne, Krypto: K } = require('./hilfen_labor');

test('Skytale: Raster = Krypto.skytaleRaster, Ausgabe = Krypto.skytale, Füllzeichen gekennzeichnet', () => {
  const w = oeffne('skytale', { voreinstellung: { text: 'wir halten den pass', umfang: 3 } });
  const zellen = w.k.alle(w.flaeche, 'table.skytale-raster tbody tr').map((z) => w.k.alle(z, 'td').map((c) => w.k.text(c)).join('').toUpperCase()); // Klartext klein angezeigt
  assert.deepEqual(zellen, K.skytaleRaster('wir halten den pass', 3));
  assert.equal(w.ohneLeer('output.labor-ausgabe'), 'WTPIEARNSHDSAEXLNX');
  assert.equal(w.k.alle(w.flaeche, 'table.skytale-raster td.fuell').length, 2);
  assert.ok(w.k.alle(w.flaeche, 'table.skytale-raster td.fuell').every((c) => c.getAttribute('title') === 'Füllzeichen'));
  assert.match(w.text('.skytale-zeilen-hinweis'), /Buchstaben unverändert: ✓/);
  w.k.taste(w.k.eins(w.flaeche, '.labor-zahl [role="spinbutton"]'), 'ArrowUp');
  assert.equal(w.ohneLeer('output.labor-ausgabe'), K.skytale('wir halten den pass', 4));
  w.k.klick(w.k.eins(w.flaeche, '.skytale-stab-minus'));
  assert.equal(w.zustand().umfang, 3, 'Stab dünner = −1');
});

test('Skytale: Entschlüsseln mit unpassender Länge → Hinweis; alle Stäbe ausprobieren', () => {
  const w = oeffne('skytale', { voreinstellung: { text: 'ABCDE ABCDE ABCDE ABCDE ABCDE', umfang: 4, richtung: 'ent' } });
  assert.match(w.text('.labor-hinweis'), /Länge 25 passt nicht zu u = 4/);
  assert.equal(w.text('output.labor-ausgabe'), '');
  const v = oeffne('skytale', { voreinstellung: { text: 'WTPIE ARNSH DSAEX LNX', richtung: 'ent', umfang: 2 } });
  v.k.klick(v.k.eins(v.flaeche, 'details.alle-staebe > summary'));
  const zeilen = v.k.alle(v.flaeche, '.alle-schluessel tr[data-schluessel]');
  assert.deepEqual(zeilen.map((z) => z.dataset.schluessel), ['2', '3', '4', '5', '6', '7', '8', '9', '10']);
  assert.equal(v.k.text(zeilen[1].querySelector('td.ergebnis')).replace(/\s/g, ''), K.klein(K.skytale('WTPIEARNSHDSAEXLNX', 3, 'ent', { fuellzeichen: null })).slice(0, 20));
  assert.equal(v.k.alle(v.flaeche, '.richtig, [data-richtig]').length, 0);
  v.k.taste(v.k.eins(v.flaeche, '.labor-zahl [role="spinbutton"]'), 'ArrowUp');
  assert.equal(v.ohneLeer('output.labor-ausgabe'), K.klein(K.skytale('WTPIEARNSHDSAEXLNX', 3, 'ent')));
  assert.match(v.text('.skytale-info'), /s = 18 : 3 = 6/);
});

test('Skytale: Nachspiel schreibt Zeichen für Zeichen und liest Spalte für Spalte', () => {
  const w = oeffne('skytale', { voreinstellung: { text: 'wir halten den pass', umfang: 3 } });
  const leiste = w.k.eins(w.flaeche, '.nachspiel');
  assert.match(w.k.text(w.k.eins(leiste, '.nachspiel-zaehler')), /von 24/, '18 Zeichen schreiben + 6 Spalten lesen');
  w.k.taste(leiste, 'ArrowRight');
  assert.equal(w.k.alle(w.flaeche, 'table.skytale-raster td.geschrieben').length, 1);
  w.k.taste(leiste, 'End');
  assert.equal(w.k.alle(w.flaeche, 'table.skytale-raster td.gelesen').length, 3);
  assert.match(w.k.text(w.k.eins(leiste, '.nachspiel-text')), /Spalte 6/);
});

test('Gartenzaun: Schienen und Plätze aus der Bibliothek', () => {
  const w = oeffne('skytale', { voreinstellung: { reiter: ['gartenzaun'], text: 'versorgung kommt spaet', zeilen: 3 } });
  assert.equal(w.ohneLeer('output.labor-ausgabe'), 'VONMPESRUGOMSATRGKTE');
  assert.match(w.text('.zaun-plaetze'), /5 · 10 · 5/);
  // Schienen in der Reihenfolge der Positionen (die Tabelle steht zeilenweise je Schiene)
  const schiene = w.k.alle(w.flaeche, 'table.zaun td[data-position]').sort((a, b) => Number(a.dataset.position) - Number(b.dataset.position)).map((z) => z.dataset.schiene).join('');
  assert.equal(schiene, K.gartenzaunSchienen(20, 3).join(''));
  assert.deepEqual(w.k.alle(w.flaeche, 'table.zaun tbody th').map((t) => w.k.text(t)), ['Schiene 1', 'Schiene 2', 'Schiene 3']);
  w.k.klick(w.k.eins(w.flaeche, '.labor-richtung [data-richtung="ent"]'));
  w.k.eins(w.flaeche, 'textarea.labor-eingabe').value = '';
  w.k.tippe(w.k.eins(w.flaeche, 'textarea.labor-eingabe'), 'VONMP ESRUG OMSAT RGKTE');
  assert.equal(w.ohneLeer('output.labor-ausgabe'), 'versorgungkommtspaet');
});

test('Fleißner: Löcher tippen, Gültigkeit, Drehgruppen, Drehen, Ausgabe = Krypto.fleissner', () => {
  const w = oeffne('skytale', { voreinstellung: { reiter: ['fleissner'], text: 'boten warten am tor', schablone: [[1, 1], [1, 4], [2, 2], [3, 3]] } });
  assert.match(w.text('.schablone-pruefung'), /Feld \(1,1\) wird mehrfach frei.*8 von 16/s);
  assert.equal(w.k.text(w.k.eins(w.flaeche, 'output.labor-ausgabe')), '');
  // fünftes Loch in einer Drehgruppe ohne Loch → Hinweis, Schablone bleibt
  w.k.klick(w.k.eins(w.flaeche, 'button.fleissner-loch[data-z="1"][data-s="2"]'));
  assert.match(w.text('.schablone-pruefung'), /Höchstens 4 Löcher/);
  assert.equal(w.zustand().schablone.length, 4);
  for (const [z, s] of [[1, 4], [3, 3], [1, 1], [2, 2], [1, 2], [2, 1], [2, 3], [4, 4]]) /* erst entfernen, dann setzen (höchstens 4 Löcher) */ w.k.klick(w.k.eins(w.flaeche, `button.fleissner-loch[data-z="${z}"][data-s="${s}"]`));
  assert.deepEqual(w.zustand().schablone, [[1, 2], [2, 1], [2, 3], [4, 4]]);
  assert.equal(w.zustand().gueltig, true);
  assert.equal(w.ohneLeer('output.labor-ausgabe'), 'TBNMOTTWOEANRRAE');
  assert.deepEqual(w.k.alle(w.flaeche, 'button.fleissner-loch').slice(0, 4).map((b) => b.dataset.gruppe), ['0', '1', '2', '0']);
  w.k.klick(w.k.eins(w.flaeche, 'button.drehen'));
  assert.equal(w.zustand().stellung, 2);
  assert.deepEqual(w.k.alle(w.flaeche, 'button.fleissner-loch.frei').map((b) => [Number(b.dataset.z), Number(b.dataset.s)]), K.fleissnerStellungen(4, [[1, 2], [2, 1], [2, 3], [4, 4]])[1]);
  // vier Löcher, Tippen in eine Drehgruppe mit genau einem Loch → das Loch wandert innerhalb der Gruppe
  w.k.klick(w.k.eins(w.flaeche, 'button.fleissner-loch[data-z="3"][data-s="3"]'));
  assert.deepEqual(w.zustand().schablone, [[1, 2], [2, 1], [3, 3], [4, 4]]);
  assert.equal(w.zustand().stellung, 1, 'Bearbeiten zeigt wieder Stellung 1');
  assert.equal(w.zustand().gueltig, true);
});

test('Skytale: Schablone per Tastatur, reduzierte Bewegung ohne Animation', () => {
  const w = oeffne('skytale', { voreinstellung: { reiter: ['fleissner'] }, ruhig: true });
  const erstes = w.k.eins(w.flaeche, 'button.fleissner-loch[data-z="1"][data-s="1"]');
  w.k.taste(erstes, 'ArrowRight');
  assert.equal(w.k.document.activeElement.dataset.s, '2');
  w.k.taste(w.k.document.activeElement, ' ');
  assert.equal(w.k.eins(w.flaeche, 'button.fleissner-loch[data-z="1"][data-s="2"]').getAttribute('aria-pressed'), 'true');
  assert.equal(w.k.eins(w.flaeche, 'button.fleissner-loch[data-z="2"][data-s="4"]').getAttribute('aria-pressed'), 'false', 'Loch der Drehgruppe ▲ versetzt');
  w.k.klick(w.k.eins(w.flaeche, 'button.drehen'));
  assert.equal(w.k.eins(w.flaeche, '.schablone-flaeche').classList.contains('dreht'), false);
  w.k.taste(w.k.eins(w.flaeche, 'button.fleissner-loch[data-z="1"][data-s="1"]'), 'r');
  assert.equal(w.zustand().stellung, 3, 'Taste r dreht');
  const v = oeffne('skytale', { voreinstellung: { reiter: ['fleissner'] } });
  v.k.klick(v.k.eins(v.flaeche, 'button.drehen'));
  assert.equal(v.k.eins(v.flaeche, '.schablone-flaeche').classList.contains('dreht'), true, 'ohne reduzierte Bewegung animiert');
});

test('Skytale & Gitter: Beispiel-Schablone gültig, Standardtext, keine Anfragen', () => {
  const w = oeffne('skytale', { voreinstellung: { reiter: ['fleissner'] } });
  assert.equal(w.zustand().gueltig, true);
  assert.deepEqual(w.zustand().schablone, [[1, 1], [1, 3], [2, 4], [3, 2]]);
  assert.equal(w.zustand().ausgabe, K.fleissner(w.zustand().text, 4, [[1, 1], [1, 3], [2, 4], [3, 2]]));
  assert.deepEqual(w.k.anfragen, []);
  assert.equal(w.k.window.localStorage.length, 0);
});

test('Ring (W6): Lesereihenfolge, nie gelesene Felder, Ausgabe = Krypto.ring; nur ab Welt 6', () => {
  const ohne = oeffne('skytale', { umgebung: { welten: [0, 1, 2] } });
  assert.equal(ohne.k.alle(ohne.flaeche, '[role="tab"][data-reiter="ring"]').length, 0);
  const w = oeffne('skytale', { voreinstellung: { reiter: ['ring'], text: 'ZEITMASC', t: 5 } });
  assert.match(w.text('ol.ring-folge'), /0\s*5\s*2\s*7\s*4\s*1\s*6\s*3/);
  assert.equal(w.ohneLeer('output.labor-ausgabe'), 'ZAICMEST');
  w.k.taste(w.k.alle(w.flaeche, '.labor-zahl [role="spinbutton"]')[1], 'Home'); // t = 1
  w.k.taste(w.k.alle(w.flaeche, '.labor-zahl [role="spinbutton"]')[1], 'ArrowUp'); // t = 2
  assert.deepEqual(w.k.alle(w.flaeche, 'svg.skytale-ring .nie').map((x) => x.dataset.feld), ['1', '3', '5', '7']);
  assert.match(w.text('.labor-hinweis'), /teilerfremd/);
  assert.equal(w.text('output.labor-ausgabe'), '');
});

test('Ring: Lehrkraft sieht den Reiter, Textalternative, Nachspiel Sprung für Sprung, Entschlüsseln = Krypto.ring', () => {
  const w = oeffne('skytale', { umgebung: { rolle: 'lehrkraft', welten: undefined, niveau: undefined }, voreinstellung: { reiter: ['ring'], text: 'ZAICMEST', t: 5, richtung: 'ent' } });
  assert.equal(w.ohneLeer('output.labor-ausgabe'), K.klein(K.ring('ZAICMEST', 5, 'ent')));
  assert.equal(w.k.eins(w.flaeche, 'svg.skytale-ring').getAttribute('role'), 'img');
  assert.match(w.k.eins(w.flaeche, 'svg.skytale-ring').getAttribute('aria-label'), /0, 5, 2, 7, 4, 1, 6, 3/);
  assert.doesNotMatch(w.k.text(w.flaeche), /\bnull\b|undefined/, 'keine leeren Platzhalter im Text');
  const leiste = w.k.eins(w.flaeche, '.nachspiel');
  w.k.taste(leiste, 'ArrowRight');
  w.k.taste(leiste, 'ArrowRight');
  assert.match(w.k.text(w.k.eins(leiste, '.nachspiel-text')), /Feld 5: a/);
  w.k.taste(w.k.alle(w.flaeche, '.labor-zahl [role="spinbutton"]')[0], 'End'); // n = 12
  assert.equal(w.k.alle(w.flaeche, 'svg.skytale-ring g.feld').length, 12);
  assert.equal(w.k.alle(w.flaeche, '.labor-zahl [role="spinbutton"]')[1].getAttribute('aria-valuemax'), '11');
});
