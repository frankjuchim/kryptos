'use strict';
// Labor-Rahmen II (Plan M6 Task 110): Reiter-Regeln, Nachspiel, Alle-Schlüssel, Nachladen, Bausteine.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const D = require('./dom_attrappe');
const { BASIS, ZEITRAFFER } = require('./hilfen_labor');
const lade = (opt = {}) => D.lade(BASIS, { zeitraffer: ZEITRAFFER, ...opt });

test('Reiter-Regeln: Welt 2 für Teiltexte, eA für Koinzidenz, Welt 6 für Ring; Lehrkraft sieht alles (E71, E87)', () => {
  const k = lade();
  const R = (id, v, u) => k.roh(k.wert('KRLabor').reiterFuer(id, v, u));
  const s1 = { modus: 'labor', rolle: 'schueler', niveau: 'gA', welten: [0, 1] };
  assert.deepEqual(R('haeufigkeit', {}, s1), ['histogramm', 'bigramme']);
  assert.deepEqual(R('haeufigkeit', {}, { ...s1, welten: [0, 1, 2] }), ['histogramm', 'bigramme', 'teiltexte']);
  assert.deepEqual(R('haeufigkeit', {}, { ...s1, niveau: 'eA', welten: [2] }), ['histogramm', 'bigramme', 'teiltexte', 'kennzahlen']);
  assert.ok(!R('vigenere', {}, { ...s1, welten: [2] }).includes('koinzidenz'));
  assert.deepEqual(R('vigenere', { reiter: ['quadrat', 'verschluesseln'] }, s1), ['quadrat', 'verschluesseln']);
  assert.deepEqual(R('vigenere', { reiter: ['unbekannt'] }, s1).slice(0, 2), ['quadrat', 'verschluesseln'], 'ungültig → Standard');
  assert.ok(!R('skytale', {}, s1).includes('ring'));
  assert.ok(R('skytale', {}, { rolle: 'lehrkraft' }).includes('ring'));
  assert.deepEqual(R('skytale', { reiter: ['ring'] }, s1), ['skytale'], 'nur verbotene Reiter → erster erlaubter Standardreiter');
  assert.deepEqual(R('substitution', {}, s1), []);
  assert.equal(k.wert('KRLabor').erlaubt('vigenere.modus.pendel', { ...s1, welten: [6] }), true);
  assert.equal(k.wert('KRLabor').erlaubt('vigenere.modus.pendel', s1), false);
  assert.equal(k.wert('KRLabor').erlaubt('vigenere.modus.pendel', { modus: 'gast', rolle: null, niveau: null }), true, 'fehlende Angaben → erlaubt');
});

test('Nachspiel: Einzelschritt, Tasten, Abspielen mit Timer, reduzierte Bewegung, Sperre, Aufräumen (E67)', async () => {
  const k = lade();
  const ziel = k.document.createElement('div');
  k.document.getElementById('haupt').appendChild(ziel);
  const gezeigt = [];
  const laeufe = [];
  const ns = k.wert('KRLabor').nachspiel(ziel, { titel: 'Test', schritte: [{ text: 'eins' }, { text: 'zwei' }, { text: 'drei' }], zeige: (s, i, o) => gezeigt.push([i, o.animiert]), beiLauf: (an) => laeufe.push(an) });
  const leiste = k.eins(ziel, '.nachspiel');
  assert.equal(leiste.getAttribute('role'), 'group');
  assert.equal(leiste.getAttribute('aria-label'), 'Nachspielen');
  assert.match(k.text(k.eins(leiste, '.nachspiel-zaehler')), /Schritt 1 von 3/);
  k.taste(leiste, 'ArrowRight');
  assert.match(k.text(k.eins(leiste, '.nachspiel-text')), /zwei/);
  assert.equal(k.eins(leiste, '.nachspiel-text').getAttribute('aria-live'), 'polite');
  k.taste(leiste, 'End');
  assert.equal(ns.index(), 2);
  assert.equal(k.eins(leiste, '.nachspiel-vor').disabled, true, 'am Ende kein „Schritt vor“');
  k.taste(leiste, 'Home');
  assert.equal(ns.index(), 0);
  assert.equal(k.eins(leiste, '.nachspiel-zurueck').disabled, true);
  k.klick(k.eins(leiste, '.nachspiel-abspielen'));
  assert.equal(ziel.dataset.nachspiel, 'laeuft');
  assert.equal(k.eins(leiste, '.nachspiel-abspielen').getAttribute('aria-pressed'), 'true');
  assert.ok(k.timer.some((t) => t.ms === 900), 'Tempo Normal');
  await k.ruhe();
  assert.equal(ns.index(), 2);
  assert.equal(ns.laeuft(), false);
  assert.equal(ziel.dataset.nachspiel, undefined);
  assert.deepEqual(laeufe, [true, false]);
  assert.ok(gezeigt.some(([, animiert]) => animiert === true));
  // Leertaste startet, Zeitlupe 2400 ms; Pause hält an
  ns.anfang();
  k.klick(k.eins(leiste, '.nachspiel-tempo [data-tempo="zeitlupe"]'));
  k.taste(leiste, ' ');
  assert.equal(ns.laeuft(), true);
  assert.ok(k.timer.some((t) => t.ms === 2400), 'Tempo Zeitlupe');
  k.taste(leiste, ' ');
  assert.equal(ns.laeuft(), false);
  ns.schliesse();
  assert.equal(ziel.querySelector('.nachspiel'), null);
  await k.ruhe();
  assert.equal(ns.index(), 0, 'nach dem Schließen läuft nichts weiter');
  // reduzierte Bewegung: Einzelschritt statt Animation – Abspielen gesperrt, Leertaste = Schritt vor
  const r = lade({ vorher: (kk) => { kk.medien['(prefers-reduced-motion: reduce)'] = true; } });
  const z2 = r.document.createElement('div');
  const g2 = [];
  const ns2 = r.wert('KRLabor').nachspiel(z2, { schritte: [{ text: 'a' }, { text: 'b' }], zeige: (s, i, o) => g2.push(o.animiert) });
  r.klick(r.eins(z2, '.nachspiel-abspielen'));
  await r.ruhe();
  assert.ok(g2.every((x) => x === false), 'reduzierte Bewegung: nie animiert');
  assert.equal(ns2.laeuft(), false);
  assert.match(r.text(r.eins(z2, '.nachspiel')), /Schritt für Schritt/);
  r.taste(r.eins(z2, '.nachspiel'), ' ');
  assert.equal(ns2.index(), 1, 'Leertaste = Schritt vor');
  // Profil „Bewegung aus“ wirkt wie die Media-Query
  const b = lade({ vorher: (kk) => kk.window.localStorage.setItem('kr_einstellungen', JSON.stringify({ bewegung: 'aus' })) });
  const z3 = b.document.createElement('div');
  b.wert('KRLabor').nachspiel(z3, { schritte: [{ text: 'a' }, { text: 'b' }], zeige() {} });
  assert.equal(b.eins(z3, '.nachspiel-abspielen').disabled, true);
});

test('Alle Schlüssel: Tabelle, Anmerkung, Nachspiel markiert Zeile, keine automatische Lösung', () => {
  const k = lade();
  const ziel = k.document.createElement('div');
  const K = k.wert('Krypto');
  k.wert('KRLabor').alleSchluessel(ziel, { titel: 'Alle Verschiebungen', schluessel: [...Array(26).keys()], beschriftung: (x) => `k = ${x}`, probiere: (x) => K.alleCaesar('WHWFYBZ')[x].text, anmerkung: (x) => (x === 0 ? '= Geheimtext (schwacher Schlüssel)' : null), zeichen: 20, eingabe: 'WHWFYBZ' });
  const zeilen = k.alle(ziel, 'tr[data-schluessel]');
  assert.equal(zeilen.length, 26);
  assert.match(k.text(zeilen[7]), /k = 7\s*papyrus/);
  assert.match(k.text(zeilen[0]), /schwacher Schlüssel/);
  assert.equal(k.eins(ziel, 'table caption').textContent, 'Alle Verschiebungen');
  k.taste(k.eins(ziel, '.nachspiel'), 'ArrowRight');
  assert.ok(zeilen[1].classList.contains('aktuell'));
  assert.ok(!zeilen[0].classList.contains('aktuell'));
  assert.match(k.text(k.eins(ziel, '.nachspiel-text')), /k = 1: Aus WHWFY… wird vgvex… – ist das lesbares Deutsch\?/);
  assert.equal(k.alle(ziel, '.richtig, [data-richtig]').length, 0, 'keine automatische Erkennung');
  // Fehler der Bibliothek je Schlüssel → „passt nicht“
  const z2 = k.document.createElement('div');
  k.wert('KRLabor').alleSchluessel(z2, { titel: 'Stäbe', schluessel: [2, 4], beschriftung: (u) => `u = ${u}`, probiere: (u) => K.skytale('ABCDEABCDE', u, 'ent') });
  assert.match(k.text(k.alle(z2, 'tr[data-schluessel]')[1]), /passt nicht/);
});

test('Nachladen: fehlendes Modul → Skript mit ?v= wird angehängt, Ladehinweis; Fehler → Meldung (E72)', async () => {
  const k = lade({ vorher: (kk) => { kk.document.head.appendChild(Object.assign(kk.document.createElement('script'), { src: '/static/js/krypto/oberflaeche.js?v=9.9.9' })); } });
  assert.equal(k.wert('KR.VERSION'), '9.9.9');
  const flaeche = k.document.createElement('div');
  const ctrl = k.wert('KRLabor').oeffne('skytale', {}, flaeche, { modus: 'labor' });
  assert.match(k.text(flaeche), /Wird geladen/);
  assert.ok(k.skripte.some((s) => s === '/static/js/krypto/labor/skytale.js?v=9.9.9'));
  assert.equal(k.skripte.filter((s) => s.includes('bausteine')).length, 0, 'Bausteine sind schon da');
  assert.equal(ctrl.zustand(), null);
  k.skriptEreignis('/static/js/krypto/labor/skytale.js?v=9.9.9', 'error'); // Attrappe feuert „error“ am angehängten Skript
  await k.ruhe();
  assert.match(k.text(flaeche), /konnte nicht geladen werden/);
  // erfolgreich: Modul registriert sich beim Laden; Bausteine fehlen → erst bausteine.js, dann das Modul
  const m = D.lade(BASIS.filter((d) => d !== 'krypto/labor/bausteine.js'), { zeitraffer: ZEITRAFFER });
  const f2 = m.document.createElement('div');
  m.wert('KRLabor').oeffne('scheibe', { text: 'x' }, f2, { modus: 'labor' });
  assert.deepEqual(m.skripte.filter((s) => s.includes('/labor/')), ['/static/js/krypto/labor/bausteine.js']);
  D.fuehreAus(m, ['krypto/labor/bausteine.js']);
  m.skriptEreignis('/static/js/krypto/labor/bausteine.js', 'load');
  await m.ruhe();
  assert.deepEqual(m.skripte.filter((s) => s.includes('/labor/')), ['/static/js/krypto/labor/bausteine.js', '/static/js/krypto/labor/scheibe.js']);
  m.wert(`KRLabor.registriere('scheibe', { titel: 'Chiffrierscheibe', oeffne(c, v) { c.appendChild(document.createTextNode('Scheibe bereit: ' + v.text)); return { schliesse() {}, zustand: () => ({ v }) }; } })`);
  m.skriptEreignis('/static/js/krypto/labor/scheibe.js', 'load');
  await m.ruhe();
  assert.match(m.text(f2), /Scheibe bereit: x/);
  assert.deepEqual(m.roh(m.wert('KRLabor').aktiv().zustand()), { v: { text: 'x' } });
});

test('Noch nicht gebaute Werkzeuge: „noch in Arbeit“ ohne Ladeversuch; gebaute laden nach (KRLabor.bereit)', async () => {
  const k = lade();
  const L = k.wert('KRLabor');
  assert.deepEqual(k.roh(L.WERKZEUGE.filter((w) => L.bereit(w.id)).map((w) => w.id)), ['skytale', 'scheibe', 'haeufigkeit', 'substitution', 'vigenere', 'bitlupe']);
  const f = k.document.createElement('div');
  const ctrl = L.oeffne('rsa', {}, f, { modus: 'labor' });
  assert.match(k.text(f), /Dieses Werkzeug ist noch in Arbeit\./);
  assert.doesNotMatch(k.text(f), /konnte nicht geladen werden|Wird geladen/);
  assert.equal(k.skripte.filter((s) => s.includes('/labor/')).length, 0, 'kein Skript angefordert (kein 404 in der Konsole)');
  assert.equal(ctrl.zustand(), null);
  // ein registriertes Modul (Test) öffnet trotzdem – das Kennzeichen betrifft nur das Nachladen
  k.wert(`KRLabor.registriere('rsa', { titel: 'RSA', oeffne(c) { c.appendChild(document.createTextNode('RSA da')); return {}; } })`);
  const f2 = k.document.createElement('div');
  L.oeffne('rsa', {}, f2, { modus: 'labor' });
  assert.match(k.text(f2), /RSA da/);
  // Dialog zeigt dieselbe Meldung
  const d = L.dialog('hash', {}, { modus: 'lab' });
  assert.match(k.text(d), /noch in Arbeit/);
  // bereites Werkzeug ohne geladenes Modul: Nachladen
  const f3 = k.document.createElement('div');
  L.oeffne('vigenere', {}, f3, { modus: 'labor' });
  assert.match(k.text(f3), /Wird geladen/);
  assert.ok(k.skripte.some((s) => s.startsWith('/static/js/krypto/labor/vigenere.js')));
});

test('Bausteine: Reiter per Pfeiltaste, Zahlregler mit Grenzen, Ausgabe kopiert ohne Gruppen', async () => {
  const k = lade();
  const B = k.wert('KRLaborBau');
  const gewechselt = [];
  const r = B.reiter([{ id: 'a', titel: 'A' }, { id: 'b', titel: 'B' }], { aktiv: 'a', beiWechsel: (id) => gewechselt.push(id) });
  k.taste(k.eins(r.element, '[role="tab"][data-reiter="a"]'), 'ArrowRight');
  assert.equal(r.aktiv(), 'b');
  assert.equal(k.eins(r.element, '[data-reiter="b"]').getAttribute('aria-selected'), 'true');
  assert.equal(k.eins(r.element, '[data-reiter="a"]').getAttribute('tabindex'), '-1');
  assert.deepEqual(gewechselt, ['b']);
  assert.equal(r.flaeche.getAttribute('role'), 'tabpanel');
  const z = B.zahl({ beschriftung: 'Umfang u', min: 2, max: 10, wert: 10 });
  k.klick(k.eins(z.element, '.zahl-plus'));
  assert.equal(z.wert(), 10);
  k.taste(k.eins(z.element, '[role="spinbutton"]'), 'Home');
  assert.equal(z.wert(), 2);
  assert.equal(k.eins(z.element, '[role="spinbutton"]').getAttribute('aria-valuenow'), '2');
  k.taste(k.eins(z.element, '[role="spinbutton"]'), 'PageUp');
  assert.equal(z.wert(), 7);
  const a = B.ausgabe({ beschriftung: 'Geheimtext', art: 'geheimtext' });
  a.setze('WTPIEARNSHDSAEXLNX');
  assert.equal(k.text(a.element.querySelector('output')), 'WTPIE ARNSH DSAEX LNX');
  assert.equal(a.element.querySelector('output').getAttribute('aria-live'), 'polite');
  k.klick(k.eins(a.element, '.labor-kopieren'));
  await k.ruhe();
  assert.deepEqual(k.zwischenablage, ['WTPIEARNSHDSAEXLNX']);
  const kl = B.ausgabe({ beschriftung: 'Klartext', art: 'klartext' });
  kl.setze('PAPYRUS');
  assert.equal(k.text(kl.element.querySelector('output')), 'papyrus');
  const t = B.textfeld({ beschriftung: 'Klartext', max: 120 });
  k.tippe(k.eins(t.element, 'textarea.labor-eingabe'), 'Wir halten!');
  assert.equal(k.text(k.eins(t.element, '.labor-laenge')), 'n = 9 Buchstaben');
  const ri = B.richtung({ wert: 'ver' });
  k.taste(k.eins(ri.element, '[data-richtung="ver"]'), 'ArrowRight');
  assert.equal(ri.wert(), 'ent');
  const h = B.hinweis('falle', '(p + k) mod 26 = 0 → Z', { falle: 'P2' });
  assert.equal(h.getAttribute('role'), 'status');
  assert.match(k.text(h), /P2/);
});

test('BEREIT = vorhandene Werkzeug-Module (labor/<id>.js)', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const k = lade();
  const L = k.wert('KRLabor');
  const dateien = new Set(fs.readdirSync(path.join(__dirname, '..', 'public', 'static', 'js', 'krypto', 'labor')).map((d) => d.replace(/\.js$/, '')));
  for (const w of k.roh(L.WERKZEUGE)) assert.equal(L.bereit(w.id), dateien.has(w.id), w.id);
});
