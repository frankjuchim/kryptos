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

/* ---------- M10 Task 227: Holzstab mit Band nach der Krypto-Werkstatt, Reiter „Pflügen · Zusatz“ ---------- */
const stempeln = (w, text) => {
  for (const b of text) w.k.klick(w.k.eins(w.flaeche, `button.station-stempel[data-buchstabe="${b.toUpperCase()}"]`));
};

test('Skytale: Stabwahl, Stempeln, Abwickeln = Krypto.skytale', async () => {
  const w = oeffne('skytale');
  assert.ok(w.zustand().text.length > 0, 'ohne Voreinstellung steht das Beispiel da – der erste Stempel beginnt eine eigene Nachricht');
  const wahl = w.k.alle(w.flaeche, '.stab-wahl button[data-u]');
  assert.deepEqual(wahl.map((b) => b.dataset.u), ['2', '3', '4', '5', '6', '7', '8', '9', '10']);
  w.k.klick(w.k.eins(w.flaeche, '.stab-wahl button[data-u="4"]'));
  assert.equal(w.k.eins(w.flaeche, '.stab-wahl button[data-u="4"]').getAttribute('aria-pressed'), 'true');
  assert.equal(w.zustand().umfang, 4);
  stempeln(w, 'feuerholz');
  assert.equal(w.k.alle(w.flaeche, 'svg.stab-objekt text.stab-buchstabe').length, 9, 'neun Buchstaben auf dem Stab');
  assert.equal(w.ohneLeer('.station-baender output.klar'), 'feuerholz');
  assert.equal(w.ohneLeer('.station-baender output.geheim'), '', 'der Geheimtext entsteht erst beim Abwickeln');
  w.k.klick(w.k.eins(w.flaeche, 'button.stab-abwickeln'));
  await w.k.ruhe();
  assert.equal(w.zustand().ausgabe, K.skytale('feuerholz', 4));
  assert.equal(w.ohneLeer('.station-baender output.geheim'), K.skytale('feuerholz', 4));
  // Plan-Korrektur: je Windung (Spalte des Rasters) eine Runde – 9 Buchstaben bei u = 4 → ⌈9/4⌉ = 3 Runden
  assert.equal(w.k.alle(w.flaeche, '.stab-streifen .stab-runde').length, 3);
  assert.equal(w.k.alle(w.flaeche, 'svg.stab-objekt text.stab-buchstabe.fuell').length, 3, 'drei Füllzeichen X');
  assert.match(w.text('.stab-streifen'), /Runde 1/);
});

test('Skytale: Entschlüsseln – Geheimtext stempeln, aufwickeln und entlang des Stabs lesen', async () => {
  const w = oeffne('skytale', { voreinstellung: { richtung: 'ent', umfang: 3 } });
  const geheim = K.skytale('wir halten den pass', 3);
  stempeln(w, geheim);
  w.k.klick(w.k.eins(w.flaeche, 'button.stab-abwickeln'));
  await w.k.ruhe();
  assert.equal(w.ohneLeer('.station-baender output.klar'), K.klein(K.skytale(geheim, 3, 'ent')));
  const v = oeffne('skytale', { voreinstellung: { richtung: 'ent', umfang: 4 } });
  stempeln(v, 'ABCDE');
  v.k.klick(v.k.eins(v.flaeche, 'button.stab-abwickeln'));
  assert.match(v.text('.station-erklaerung-text'), /passt nicht/);
});

test('Skytale: Text eintippen schreibt dieselbe Nachricht; Stab immer sichtbar, Herkunft, Hintergrund', () => {
  const w = oeffne('skytale', { voreinstellung: { text: '' } });
  w.k.tippe(w.k.eins(w.flaeche, 'textarea.labor-eingabe'), 'abc');
  assert.equal(w.ohneLeer('.station-baender output.klar'), 'abc');
  assert.equal(w.k.alle(w.flaeche, 'svg.stab-objekt text.stab-buchstabe').length, 3);
  assert.equal(w.k.eins(w.flaeche, 'svg.stab-objekt').getAttribute('role'), 'img');
  assert.match(w.k.eins(w.flaeche, 'svg.stab-objekt').getAttribute('aria-label'), /Umfang 3/);
  assert.equal(w.text('p.werkzeug-herkunft'), 'Ideen von A. Bodendiek (Krypto-Werkstatt)');
  assert.match(w.text('details.station-hintergrund'), /Umfang u/);
});

test('Skytale: ruhig ohne animate, nachspiel_sperrt_handgriffe', async () => {
  const w = oeffne('skytale', { ruhig: true });
  stempeln(w, 'ruhe');
  w.k.klick(w.k.eins(w.flaeche, 'button.stab-abwickeln'));
  await w.k.ruhe();
  assert.equal(w.k.animiert.length, 0);
  assert.equal(w.ohneLeer('.station-baender output.geheim'), K.skytale('ruhe', 3));
  const v = oeffne('skytale', { voreinstellung: { text: 'wir halten den pass', umfang: 3 } });
  v.k.klick(v.k.eins(v.flaeche, '.nachspiel .nachspiel-abspielen'));
  assert.ok(v.k.alle(v.flaeche, 'button.station-stempel').every((b) => b.disabled), 'Stempel gesperrt');
  assert.match(v.text('.station-sperrhinweis'), /Während des Nachspielens/);
  await v.k.ruhe();
  assert.ok(v.k.alle(v.flaeche, 'button.station-stempel').every((b) => !b.disabled));
  assert.equal(v.zustand().text, 'wir halten den pass', 'Nachricht unverändert');
});

test('Pflügen: Breite, Reihenfolge, Ausgabe', async () => {
  const w = oeffne('skytale', { voreinstellung: { reiter: ['pfluegen'], text: 'wintersonne', k: 4 } });
  assert.equal(w.zustand().ausgabe, 'XOTNSENRIWEN');
  const nr = w.k.alle(w.flaeche, 'table.pflug-tabelle td[data-lesen]').map((z) => Number(z.dataset.lesen));
  assert.deepEqual(nr, K.pfluegenReihenfolge(3, 4).flat());
  assert.match(w.text('[role="tab"][data-reiter="pfluegen"]'), /Pflügen · Zusatz/);
  assert.equal(w.k.alle(w.flaeche, 'table.pflug-tabelle td.fuell').length, 1, 'ein Füllzeichen X');
  // Pflügen: Geheimtext-Band entsteht Spalte für Spalte
  w.k.klick(w.k.eins(w.flaeche, 'button.pflug-pfluegen'));
  await w.k.ruhe();
  assert.equal(w.ohneLeer('.station-baender output.geheim'), 'XOTNSENRIWEN');
  assert.equal(w.k.alle(w.flaeche, 'table.pflug-tabelle td.gepfluegt').length, 12);
  // Breite per Tastatur am Rand und per Zahlregler
  w.k.taste(w.k.eins(w.flaeche, 'button.pflug-rand'), 'ArrowLeft');
  assert.equal(w.zustand().k, 3);
  assert.equal(w.zustand().ausgabe, K.pfluegen('wintersonne', 3));
  // Ziehen am Rand: zwei Spaltenbreiten nach rechts
  const rand = w.k.eins(w.flaeche, 'button.pflug-rand');
  w.k.zeiger(rand, 'pointerdown', { clientX: 100 });
  w.k.zeiger(rand, 'pointermove', { clientX: 190 });
  w.k.zeiger(rand, 'pointerup', { clientX: 190 });
  assert.equal(w.zustand().k, 5);
});

test('Pflügen: stempeln, entschlüsseln, alle Zeilenlängen, ruhig, Sperre im Nachspiel', async () => {
  const w = oeffne('skytale', { voreinstellung: { reiter: ['pfluegen'], k: 4 }, ruhig: true });
  stempeln(w, 'laterne');
  assert.equal(w.zustand().ausgabe, K.pfluegen('laterne', 4));
  w.k.klick(w.k.eins(w.flaeche, 'button.pflug-pfluegen'));
  await w.k.ruhe();
  assert.equal(w.k.animiert.length, 0);
  const e = oeffne('skytale', { voreinstellung: { reiter: ['pfluegen'], richtung: 'ent', text: 'XOTNSENRIWEN', k: 4 } });
  assert.equal(e.zustand().ausgabe, K.pfluegen('XOTNSENRIWEN', 4, 'ent'));
  e.k.klick(e.k.eins(e.flaeche, 'details.pflug-alle > summary'));
  const zeilen = e.k.alle(e.flaeche, '.alle-schluessel tr[data-schluessel]');
  assert.deepEqual(zeilen.map((z) => z.dataset.schluessel), ['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']);
  assert.match(e.k.text(zeilen[3]), /passt nicht/, 'k = 5 passt nicht zu 12 Buchstaben');
  const n = oeffne('skytale', { voreinstellung: { reiter: ['pfluegen'], text: 'wintersonne', k: 4 } });
  n.k.klick(n.k.eins(n.flaeche, '.nachspiel .nachspiel-abspielen'));
  assert.ok(n.k.alle(n.flaeche, 'button.station-stempel').every((b) => b.disabled));
  await n.k.ruhe();
  assert.equal(n.zustand().text, 'wintersonne');
  assert.equal(n.text('p.werkzeug-herkunft'), 'Ideen von A. Bodendiek (Krypto-Werkstatt)');
});

/* ---------- M10 Task 228: Fleißner-Schablone als Karton nach der Krypto-Werkstatt, Größe 6 × 6 als Zusatz ---------- */
const L6 = [[1, 2], [2, 1], [2, 3], [3, 2], [3, 6], [4, 4], [5, 5], [6, 3], [6, 6]];

test('Fleißner 6 × 6: Werkstatt-Lochung gültig, Ausgabe = Krypto.fleissner', () => {
  assert.equal(K.schablonePruefen(6, L6).ok, true);
  const w = oeffne('skytale', { voreinstellung: { reiter: ['fleissner'], groesse: 6, text: 'leuchtturm am kap' } });
  assert.deepEqual(w.zustand().schablone, L6);
  assert.equal(w.zustand().groesse, 6);
  assert.equal(w.zustand().gueltig, true);
  assert.equal(w.zustand().ausgabe, K.fleissner('leuchtturm am kap', 6, L6));
  assert.equal(w.k.alle(w.flaeche, 'button.fleissner-loch').length, 36);
  assert.match(w.text('.karton-oben'), /OBEN/);
  // Drehgruppen bei 6 × 6: neun Gruppen mit Ziffern 1–9
  assert.deepEqual([...new Set(w.k.alle(w.flaeche, 'button.fleissner-loch .loch-symbol').map((x) => w.k.text(x)))].sort(), ['1', '2', '3', '4', '5', '6', '7', '8', '9']);
  // Größenwahl zurück auf 4 × 4: Beispiel-Schablone M6
  w.k.klick(w.k.eins(w.flaeche, '.karton-groesse button[data-groesse="4"]'));
  assert.deepEqual(w.zustand().schablone, [[1, 1], [1, 3], [2, 4], [3, 2]]);
  assert.match(w.text('.karton-groesse button[data-groesse="6"]'), /6 × 6 · Zusatz/);
});

test('Fleißner: Lage-Ziffern und doppelt frei rot (Lochung ändern)', () => {
  const w = oeffne('skytale', { voreinstellung: { reiter: ['fleissner'], schablone: [[1, 1], [1, 4]] } });
  w.k.klick(w.k.eins(w.flaeche, 'button.karton-lochung'));
  assert.equal(w.k.eins(w.flaeche, 'button.karton-lochung').getAttribute('aria-pressed'), 'true');
  const st = K.fleissnerStellungen(4, [[1, 1], [1, 4]]);
  const lagen = (zz, ss) => st.map((liste, i) => (liste.some((l) => l[0] === zz && l[1] === ss) ? i + 1 : null)).filter(Boolean);
  const feld = (zz, ss) => w.k.eins(w.flaeche, `button.karton-feld[data-z="${zz}"][data-s="${ss}"]`);
  assert.equal(w.k.text(feld(1, 4).querySelector('.karton-lagen')), lagen(1, 4).join(' '));
  // (1,1) und (1,4) gehören zur selben Drehgruppe: (1,4) ist frei in Lage 1 und (als (1,1) gedreht) in Lage 2 → doppelt
  assert.ok(lagen(1, 4).length > 1);
  assert.ok(feld(1, 4).classList.contains('doppelt'));
  assert.match(w.k.text(feld(1, 4)), /doppelt/);
  assert.ok(!feld(2, 2).classList.contains('doppelt'));
  w.k.klick(feld(1, 4)); // Loch zukleben
  assert.ok(!feld(1, 4).classList.contains('doppelt'));
});

test('Fleißner: Stempeln füllt die Löcher zeilenweise, Drehen → Lage 2, Abheben zeigt das Raster; ruhig ohne Animation', () => {
  const w = oeffne('skytale', { voreinstellung: { reiter: ['fleissner'], text: '' }, ruhig: true });
  for (const b of 'ABCDE') w.k.klick(w.k.eins(w.flaeche, `button.station-stempel[data-buchstabe="${b}"]`));
  assert.equal(w.zustand().text, 'abcde');
  assert.equal(w.zustand().stellung, 2, 'nach vier Buchstaben dreht die Schablone weiter');
  assert.match(w.text('.schablone-stellung'), /Lage 2 von 4/);
  assert.equal(w.k.eins(w.flaeche, '.schablone-flaeche').classList.contains('dreht'), false, 'ruhig: keine Drehanimation');
  w.k.klick(w.k.eins(w.flaeche, 'button.karton-abheben'));
  assert.ok(w.k.eins(w.flaeche, '.schablone-flaeche').classList.contains('abgehoben'));
  assert.equal(w.ohneLeer('.station-baender output.geheim'), K.fleissner('abcde', 4, [[1, 1], [1, 3], [2, 4], [3, 2]]));
  assert.equal(w.k.animiert.length, 0);
  assert.equal(w.text('p.werkzeug-herkunft'), 'Ideen von A. Bodendiek (Krypto-Werkstatt)');
});
