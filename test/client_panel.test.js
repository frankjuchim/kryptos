'use strict';
// Aufgaben-Panel „Werkzeug“ (Plan M11 Task 247, E214–E218, E221, Review Focus 4, 5): statt des Dialogs klappt das
// Werkzeug in der Aufgabe auf; mit `gefuehrt` startet es geführt, verglichen wird erst nach dem Lösen (Freigabe).
const { ERKENNER_SKRIPTE } = require('./hilfen_labor');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const D = require('./dom_attrappe');
const { pruefeBlock } = require('../src/krypto/werkzeuge');

const LABOR = ['krypto/labor/bausteine.js', 'krypto/labor/station.js', ...ERKENNER_SKRIPTE];
const SKRIPTE = ['common.js', 'shared/krypto.js', 'render.js', 'interact.js', 'krypto/oberflaeche.js', 'krypto/diagnose_chips.js', 'krypto/labor/registry.js', 'krypto/werkzeug_panel.js', 'krypto/bloecke.js'];
const IMOTQ = { t: 'werkzeug', id: 'scheibe', gefuehrt: true, hinweis: 'Stelle die Scheibe ein und lies Buchstabe für Buchstabe ab.', voreinstellung: { reiter: ['text'], text: 'IMOTQ', k: 12, richtung: 'ent' } };

function bau(bloecke, ctx = {}, extra = LABOR.concat('krypto/labor/scheibe.js')) {
  const k = D.lade([...SKRIPTE, ...extra]);
  const el = k.document.createElement('div');
  for (const [i, b] of bloecke.entries()) {
    const x = k.wert('AQR').block(b, i, { modus: 'lab', aufgabeId: 'W9-L1-01', laborUmgebung: { modus: 'lab', rolle: 'schueler', niveau: 'eA', welten: [0, 1, 2, 3, 4, 5, 6] }, ...ctx });
    if (x) el.appendChild(x);
  }
  k.document.body.appendChild(el);
  return { k, el };
}
const schalter = (k, el, i = 0) => k.alle(el, 'button.werkzeug-schalter')[i];

test('panel_eingeklappt_laedt_nichts', () => {
  const { k, el } = bau([IMOTQ], {}, []);
  const s = schalter(k, el);
  assert.equal(s.getAttribute('aria-expanded'), 'false');
  assert.match(k.text(s), /Werkzeug: Chiffrierscheibe/);
  assert.match(k.text(el), /Schritt für Schritt/, 'Chip bei gefuehrt');
  const flaeche = k.document.getElementById(s.getAttribute('aria-controls'));
  assert.equal(flaeche.getAttribute('role'), 'region');
  assert.equal(flaeche.hidden, true);
  assert.deepEqual(k.skripte, [], 'nichts nachgeladen');
});

test('panel_aufklappen_laedt_modul', () => {
  const { k, el } = bau([{ t: 'werkzeug', id: 'scheibe', voreinstellung: { k: 7 } }]);
  const s = schalter(k, el);
  s.focus();
  k.klick(s);
  assert.equal(s.getAttribute('aria-expanded'), 'true');
  assert.equal(k.document.activeElement, s, 'Fokus bleibt auf dem Schalter');
  assert.equal(k.text(k.eins(el, '.scheibe-k')), 'k = 7');
  assert.ok(k.eins(el, '.werkzeug-panel[data-offen]'));
  k.klick(s);
  assert.equal(s.getAttribute('aria-expanded'), 'false');
  assert.equal(k.alle(el, '.scheibe-k').length, 0, 'Zuklappen schließt das Werkzeug');
});

test('panel_startet_gefuehrt', () => {
  const { k, el } = bau([IMOTQ]);
  k.klick(schalter(k, el));
  assert.ok(k.eins(el, 'section.gefuehrt'), 'geführt mit den Werten der Voreinstellung');
  assert.match(k.text(k.eins(el, '.gefuehrt-zaehler')), /Schritt 1 von 5/);
  assert.match(k.text(el), /Rückmeldung bekommst du, wenn die Aufgabe gelöst ist/);
  assert.match(k.text(el), /Stelle die Scheibe ein/, 'Hinweis im Fuß');
});

test('ein_offenes_werkzeug', () => {
  const { k, el } = bau([IMOTQ, { t: 'werkzeug', id: 'scheibe', voreinstellung: { k: 3 } }]);
  k.klick(schalter(k, el, 0));
  k.klick(schalter(k, el, 1));
  assert.equal(schalter(k, el, 0).getAttribute('aria-expanded'), 'false');
  assert.equal(k.alle(el, '.werkzeug-panel[data-offen]').length, 1);
  assert.equal(k.wert('KRPanel').offen(), 1);
  assert.equal(k.wert('KRPanel').schliesseAlle(), 1);
  assert.equal(k.alle(el, '.werkzeug-panel[data-offen]').length, 0);
});

test('panel_boss_sperre', () => {
  const { k, el } = bau([IMOTQ]);
  k.klick(schalter(k, el));
  assert.equal(k.wert('KRLabor').sperreAlle('boss'), 1);
  assert.match(k.text(el), /Während eines Boss-Kampfs ist das Labor geschlossen/);
  const g = bau([IMOTQ], { werkzeugFrei: () => false }, []);
  assert.equal(schalter(g.k, g.el).disabled, true);
  assert.match(g.k.text(g.el), /Deine Lehrkraft schaltet dieses Werkzeug später frei/);
});

test('kein_panel_im_boss', () => {
  const k = D.lade(SKRIPTE);
  assert.equal(k.wert('AQR').block(IMOTQ, 0, { modus: 'boss' }), null);
});

test('labor_link_zweitlink', () => {
  const { k, el } = bau([IMOTQ], { laborUmgebung: { modus: 'lab', rolle: 'schueler', level: 'W9-L1' } });
  const a = k.eins(el, 'a.werkzeug-labor-link');
  assert.equal(a.getAttribute('href'), '/labor#/scheibe?reiter=text&level=W9-L1');
  assert.match(k.text(a), /Im Labor öffnen/);
  assert.ok(!k.eins(el, '.werkzeug-panel').contains(a) || a.classList.contains('knopf-leise'), 'Zweitlink, nicht der Hauptknopf');
});

test('tasten_bleiben_im_panel', () => {
  const { k, el } = bau([IMOTQ]);
  let nach = 0;
  el.addEventListener('keydown', () => nach++);
  k.klick(schalter(k, el));
  k.taste(k.eins(el, 'input.gefuehrt-eintrag-feld'), 'Enter');
  k.taste(k.eins(el, 'section.gefuehrt textarea'), 'Enter');
  assert.equal(nach, 0, 'Tasten verlassen das Panel nicht (kein „Prüfen“ der Aufgabe)');
});

test('vorschau_sofort_freigegeben', () => {
  const { k, el } = bau([IMOTQ], { modus: 'vorschau', laborUmgebung: { modus: 'vorschau', rolle: 'lehrkraft' } });
  k.klick(schalter(k, el));
  assert.ok(k.eins(el, 'section.gefuehrt[data-freigegeben]'), 'Lehrkraft sieht die richtigen Werte');
  assert.match(k.text(el), /richtig wäre: w/);
});

test('freigabe_vor_dem_oeffnen_gemerkt', async () => {
  // Freigabe, bevor das Panel aufgeklappt ist (gelöste Aufgabe geöffnet): das Panel gibt beim Öffnen frei
  const { k, el } = bau([IMOTQ]);
  k.wert('KRPanel').freigeben('W9-L1-01');
  k.klick(schalter(k, el));
  await k.ruhe();
  assert.ok(k.eins(el, 'section.gefuehrt[data-freigegeben]'));
});

/* ---------- Seiten: Freigabe nach dem Lösen, Navigation ---------- */

const SITZUNG_S = { rolle: 'schueler', name: 'Mika R.', kurs: { id: 'k:1', name: 'LK 13 (eA)', niveau: 'eA' }, kurse: [{ id: 'k:1', name: 'LK 13 (eA)', aktiv: true }], portal: 'https://portal.test', version: '0.2.0' };
const SPIEL = ['common.js', 'krypto/oberflaeche.js', 'krypto/kopfzeile.js', 'shared/krypto.js', 'render.js', 'interact.js', 'krypto/diagnose_chips.js', 'krypto/labor/registry.js', 'krypto/werkzeug_panel.js', 'krypto/bloecke.js', 'krypto/interaktionen.js', 'aufgabe.js', 'krypto/zeitleiste.js', 'krypto/epoche.js', 'krypto/level.js', 'krypto/profil.js', 'krypto/spiel.js', ...LABOR, 'krypto/labor/scheibe.js'];
const welt = { nr: 9, titel: 'Testwelt', epoche: 'Test', jahr: { von: 1900, bis: 2000, anzeige: '1900' }, farbe: '#5B6B7C', akzentHell: '#C9D3DD', frei: true, punkte: 0, maxPunkte: 10, anteil: 0, training: false, archivfund: null, kapitel: null, boss: null, levels: [] };
function seite(zustand, id = 'W9-L1-01') {
  const a = { id, titel: 'Scheibe', stufe: 1, punkte: 10, kategorie: 'entschluesseln', niveau: 'kern', fallen: [], tippsAnzahl: 0, inhalt: [{ t: 'text', md: 'Entschlüssele.' }, IMOTQ], interaktion: { kind: 'chiffre', richtung: 'ent', verfahren: { typ: 'caesar', k: 12 }, eingabe: 'IMOTQ' } };
  const ort = { welt: { nr: 9, titel: 'Testwelt', farbe: '#5B6B7C' }, level: { id: 'W9-L1', nr: '1', titel: 'Scheibe' }, index: 0, anzahl: 2, vorher: null, nachher: 'W9-L1-02' };
  return {
    'GET /api/sitzung': { status: 200, body: SITZUNG_S },
    'GET /api/welten': { status: 200, body: { welten: [welt], scoreboard: true, niveau: 'eA' } },
    'GET /api/profil': { status: 200, body: { rang: { name: 'Lehrling', index: 0, anteil: 0 }, punkte: { gesamt: 0 }, welten: [], fallen: [], abzeichen: [] } },
    'GET /api/labor': { status: 200, body: { boss: false, niveau: 'eA', welten: [0, 9], werkzeuge: [{ id: 'scheibe', titel: 'Chiffrierscheibe', welt: 0, frei: true, grund: null }] } },
    [`GET /api/aufgaben/${id}`]: { status: 200, body: { aufgabe: a, zustand, ort } },
    'GET /api/aufgaben/W9-L1-02': { status: 200, body: { aufgabe: { ...a, id: 'W9-L1-02' }, zustand: { status: 'offen', fehlversuche: 0, tippsGenutzt: 0, moeglich: 10 }, ort } },
    [`POST /api/aufgaben/${id}/pruefen`]: { status: 200, body: { ok: true, geloest: true, punkteErhalten: 10, loesung: { text: 'wache' }, erklaerung: [], zustand: { status: 'geloest', punkte: 10 } } }
  };
}
const OFFEN = { status: 'offen', fehlversuche: 0, tippsGenutzt: 0, moeglich: 10 };

test('freigabe_nach_loesen', async () => {
  const k = D.lade(SPIEL, { url: 'http://x.test/spiel#/aufgabe/W9-L1-01', fetch: seite(OFFEN) });
  await k.ruhe();
  const haupt = k.document.getElementById('haupt');
  k.klick(k.eins(haupt, 'button.werkzeug-schalter'));
  await k.ruhe();
  assert.ok(k.eins(haupt, 'section.gefuehrt'));
  assert.equal(k.alle(haupt, 'section.gefuehrt[data-freigegeben]').length, 0, 'vor dem Lösen kein Vergleich');
  assert.doesNotMatch(k.text(haupt), /richtig wäre/);
  k.tippe(k.eins(haupt, 'input.gefuehrt-eintrag-feld'), 'w');
  k.alle(haupt, 'input.kaestchen').forEach((x, i) => k.tippe(x, 'wache'[i]));
  k.klick(k.eins(haupt, '#pruefen'));
  await k.ruhe();
  assert.ok(k.eins(haupt, 'section.gefuehrt[data-freigegeben]'), 'nach dem Lösen verglichen');
  assert.match(k.text(k.eins(haupt, '.gefuehrt-fazit')), /1 von 5/);
  // nächste Aufgabe: Panel wieder ohne Vergleich
  k.window.location.hash = '#/aufgabe/W9-L1-02';
  await new Promise((r) => setTimeout(r, 5));
  await k.ruhe();
  assert.equal(k.wert('KRPanel').offen(), 0, 'Navigation schließt das Panel');
  k.klick(k.eins(haupt, 'button.werkzeug-schalter'));
  await k.ruhe();
  assert.ok(k.eins(haupt, 'section.gefuehrt'));
  assert.equal(k.alle(haupt, 'section.gefuehrt[data-freigegeben]').length, 0);
});

test('freigabe_bei_geloest_geladen', async () => {
  for (const status of ['geloest', 'angesehen']) {
    const k = D.lade(SPIEL, { url: 'http://x.test/spiel#/aufgabe/W9-L1-01', fetch: seite({ status, fehlversuche: 0, tippsGenutzt: 0, moeglich: 0, punkte: 10 }) });
    await k.ruhe();
    const haupt = k.document.getElementById('haupt');
    k.klick(k.eins(haupt, 'button.werkzeug-schalter'));
    await k.ruhe();
    assert.ok(k.eins(haupt, 'section.gefuehrt[data-freigegeben]'), `${status}: sofort verglichen`);
  }
});

test('panel_schliesst_bei_navigation', async () => {
  const k = D.lade(SPIEL, { url: 'http://x.test/spiel#/aufgabe/W9-L1-01', fetch: seite(OFFEN) });
  await k.ruhe();
  k.klick(k.eins(k.document, 'button.werkzeug-schalter'));
  await k.ruhe();
  assert.equal(k.wert('KRPanel').offen(), 1);
  k.window.location.hash = '#/';
  await new Promise((r) => setTimeout(r, 5));
  await k.ruhe();
  assert.equal(k.wert('KRPanel').offen(), 0);
});

/* ---------- Validator (E217) ---------- */

test('gefuehrt_pflicht_bei_aufgabenwerten', () => {
  const fehler = pruefeBlock({ t: 'werkzeug', id: 'scheibe', voreinstellung: { reiter: ['text'], text: 'IMOTQ', k: 12, richtung: 'ent' } }, { aufgabe: 'W0-L2-02', welt: 0 });
  assert.ok(fehler.fehler.some((f) => /gefuehrt/.test(f)), fehler.fehler.join(' | '));
  assert.deepEqual(pruefeBlock({ ...IMOTQ }, { aufgabe: 'W0-L2-02', welt: 0 }).fehler, []);
  // Ausnahme L60: W0-L2-04 „alle“ mit dem Geheimtext
  assert.deepEqual(pruefeBlock({ t: 'werkzeug', id: 'scheibe', gefuehrt: true, voreinstellung: { reiter: ['scheibe', 'alle'], text: 'BLIZV INRIK VKRDK FI' } }, { aufgabe: 'W0-L2-04', welt: 0 }), { fehler: [], hinweise: [] });
  // „alle“ mit einem anderen Geheimtext: nicht verfügbar → Hinweis
  const ohne = pruefeBlock({ t: 'werkzeug', id: 'scheibe', voreinstellung: { reiter: ['alle'], text: 'IMOTQ' } }, { aufgabe: 'W0-L2-02', welt: 0 });
  assert.ok(ohne.hinweise.some((x) => /alle/.test(x)), ohne.hinweise.join(' | '));
});

test('gefuehrt_nur_mit_hook', () => {
  const r = pruefeBlock({ t: 'werkzeug', id: 'substitution', gefuehrt: true }, { aufgabe: 'W1-L1-01', welt: 1 });
  assert.ok(r.fehler.some((f) => /gefuehrt/.test(f)));
});

test('hinweis_hoechstens_160', () => {
  const r = pruefeBlock({ ...IMOTQ, hinweis: 'x'.repeat(161) }, { aufgabe: 'W0-L2-02', welt: 0 });
  assert.ok(r.fehler.some((f) => /hinweis/.test(f)));
});

test('werkzeug_spaetere_welt_hinweis', () => {
  const r = pruefeBlock({ t: 'werkzeug', id: 'rsa' }, { aufgabe: 'W1-L1-01', welt: 1 });
  assert.ok(r.hinweise.some((x) => /Welt 4/.test(x)));
});

test('gast_panel_scheibe', () => {
  const { k, el } = bau([{ t: 'werkzeug', id: 'scheibe' }], { modus: 'gast', werkzeugFrei: (id) => id === 'scheibe', laborUmgebung: { modus: 'gast', rolle: null } });
  k.klick(schalter(k, el));
  assert.ok(k.eins(el, '.scheibe-drehknopf'), 'Scheibe im Panel');
  const v = bau([{ t: 'werkzeug', id: 'vigenere' }], { modus: 'gast', werkzeugFrei: (id) => id === 'scheibe' }, []);
  assert.equal(schalter(v.k, v.el).disabled, true, 'andere Werkzeuge im Gastmodus gesperrt');
});
