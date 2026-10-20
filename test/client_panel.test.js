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
  assert.match(k.text(s), /Chiffrierscheibe benutzen/); // M12 E231
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

test('esc_schliesst_panel (Nachtrag M11)', () => {
  const { k, el } = bau([IMOTQ]);
  let nach = 0;
  el.addEventListener('keydown', () => nach++);
  const s = schalter(k, el);
  k.klick(s);
  assert.equal(s.getAttribute('aria-expanded'), 'true');
  k.taste(k.eins(el, 'input.gefuehrt-eintrag-feld'), 'Escape');
  assert.equal(s.getAttribute('aria-expanded'), 'false', 'Esc klappt das Panel zu');
  assert.equal(k.eins(el, 'section.werkzeug-panel-flaeche').hidden, true);
  assert.equal(k.document.activeElement, s, 'Fokus zurück auf dem Schalter');
  assert.equal(nach, 0, 'Esc verlässt das Panel nicht');
  assert.equal(k.wert('KRPanel').offen(), 0);
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

/* ---------- M12 (E231, E232): Schalter „<Objekt> benutzen“, Feld offen ---------- */

test('m12_schalter_nennt_das_objekt', () => {
  const P = (b) => {
    const { k, el } = bau([b], {}, []);
    return k.text(schalter(k, el));
  };
  assert.match(P({ t: 'werkzeug', id: 'skytale', voreinstellung: { reiter: ['skytale'] } }), /Skytale-Stab benutzen/);
  assert.match(P({ t: 'werkzeug', id: 'skytale', voreinstellung: { reiter: ['gartenzaun'] } }), /Gartenzaun benutzen/);
  assert.match(P({ t: 'werkzeug', id: 'skytale', voreinstellung: { reiter: ['fleissner'] } }), /Fleißner-Karton benutzen/);
  assert.match(P({ t: 'werkzeug', id: 'skytale' }), /Skytale-Stab benutzen/, 'ohne Reiter: erster Reiter');
  assert.match(P({ t: 'werkzeug', id: 'quadrat', voreinstellung: { reiter: ['polybios'] } }), /Polybios-Quadrat benutzen/);
  assert.match(P({ t: 'werkzeug', id: 'signale', voreinstellung: { reiter: ['morse'] } }), /Morse-Tafel benutzen/);
  assert.match(P({ t: 'werkzeug', id: 'runden', voreinstellung: { reiter: ['enigma'] } }), /Mini-Enigma benutzen/);
  assert.match(P({ t: 'werkzeug', id: 'hash' }), /Hash-Labor benutzen/, 'sonst der Werkzeugname');
});

test('m12_offen_klappt_beim_anzeigen_auf', async () => {
  const { k, el } = bau([{ t: 'werkzeug', id: 'scheibe', offen: true, voreinstellung: { k: 7 } }]);
  await k.ruhe();
  const s = schalter(k, el);
  assert.equal(s.getAttribute('aria-expanded'), 'true');
  assert.equal(k.text(k.eins(el, '.scheibe-k')), 'k = 7', 'Modul sofort geladen');
  assert.ok(k.eins(el, '.werkzeug-panel.panel-offen-start'));
  k.klick(s);
  assert.equal(s.getAttribute('aria-expanded'), 'false', 'zuklappen geht weiter');
  // ohne offen: eingeklappt
  const z = bau([{ t: 'werkzeug', id: 'scheibe', voreinstellung: { k: 7 } }], {}, []);
  await z.k.ruhe();
  assert.equal(schalter(z.k, z.el).getAttribute('aria-expanded'), 'false');
  assert.deepEqual(z.k.skripte, []);
  // im Boss nie
  assert.equal(bau([{ t: 'werkzeug', id: 'scheibe', offen: true }], { modus: 'boss' }, []).el.children.length, 0);
});

test('m12_offen_validator', () => {
  const r = pruefeBlock({ t: 'werkzeug', id: 'scheibe', offen: 'ja' }, { aufgabe: 'W0-L2-01', welt: 0 });
  assert.ok(r.fehler.some((f) => /offen muss true oder false/.test(f)), r.fehler.join(' | '));
  assert.deepEqual(pruefeBlock({ t: 'werkzeug', id: 'scheibe', offen: true }, { aufgabe: 'W0-L2-01', welt: 0 }).fehler, []);
});

test('m12_w0_werkstatt_aufgaben_offen', () => {
  // E232: alle W0-Aufgaben mit einem Werkstatt-Objekt (Skytale & Gitter, Scheibe, Polybios, Morse) klappen auf
  const w = require('../seed/welten/welt0.json');
  const fehlt = [];
  let n = 0;
  for (const a of w.aufgaben) {
    for (const b of a.inhalt || []) {
      if (b.t !== 'werkzeug') continue;
      n += 1;
      if (['skytale', 'scheibe', 'quadrat', 'signale'].includes(b.id) && b.offen !== true) fehlt.push(a.id);
    }
  }
  assert.ok(n >= 19, `W0 hat ${n} Panels`);
  assert.deepEqual(fehlt, []);
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

/* ---------- Level-Karten „Hier ausprobieren“ (Task 248, E222) ---------- */

const RUNDEN = ['krypto/labor/runden.js', 'krypto/labor/signatur.js', 'krypto/labor/enigma.js'];
function levelSeite(levelId, werkzeug, werkzeuge, welten = [0, 1, 2, 3, 4, 5, 6]) {
  const level = { level: { id: levelId, nr: '1', titel: 'Probe', niveau: 'kern', rolle: 'kryptografie', werkzeug, intro: [], aufgaben: [] }, welt: { nr: Number(levelId[1]), titel: 'Probe' }, aufgaben: [] };
  const f = { ...seite(OFFEN), [`GET /api/levels/${levelId}`]: { status: 200, body: level }, 'GET /api/labor': { status: 200, body: { boss: false, niveau: 'eA', welten, werkzeuge } } };
  return D.lade([...SPIEL, ...RUNDEN], { url: `http://x.test/spiel#/level/${levelId}`, fetch: f });
}

test('level_karte_hier_ausprobieren', async () => {
  const k = levelSeite('W0-L1', [{ id: 'scheibe', voreinstellung: { reiter: ['scheibe'] } }], [{ id: 'scheibe', titel: 'Chiffrierscheibe', welt: 0, frei: true, grund: null }]);
  await k.ruhe();
  const haupt = k.document.getElementById('haupt');
  assert.deepEqual(k.alle(haupt, 'a.werkzeug-link').map((a) => a.getAttribute('href')), ['/labor#/scheibe?reiter=scheibe&level=W0-L1'], 'Link unverändert');
  const s = k.eins(haupt, 'button.werkzeug-schalter');
  assert.match(k.text(s), /Hier ausprobieren/);
  k.klick(s);
  await k.ruhe();
  assert.ok(k.eins(haupt, '.scheibe-drehknopf'), 'Werkzeug direkt auf der Level-Seite, frei');
  assert.equal(k.alle(haupt, 'section.gefuehrt').length, 0);
});

test('level_karte_reiter_regeln', async () => {
  const k = levelSeite('W5-L3', [{ id: 'signatur' }], [{ id: 'signatur', titel: 'Signatur- & Zertifikats-Simulator', welt: 5, frei: true, grund: null }]);
  await k.ruhe();
  const haupt = k.document.getElementById('haupt');
  k.klick(k.eins(haupt, 'button.werkzeug-schalter'));
  await k.ruhe();
  assert.ok(k.alle(haupt, '[role="tab"]').length >= 1);
  assert.ok(!k.alle(haupt, '[role="tab"]').some((t) => t.dataset.reiter === 'mitm'), 'W5-L3 ohne MitM');
  const e = levelSeite('W3-L5', [{ id: 'enigma' }], [{ id: 'enigma', titel: 'Enigma', welt: 3, frei: true, grund: null, art: 'kuer' }]);
  await e.ruhe();
  const he = e.document.getElementById('haupt');
  e.klick(e.eins(he, 'button.werkzeug-schalter'));
  await e.ruhe();
  assert.ok(!e.alle(he, '[role="tab"]').some((t) => t.dataset.reiter === 'vorfuehren'), 'W3-L5 ohne Vorführen');
});

test('level_karte_erkenner', async () => {
  const k = levelSeite('W3-L5', [{ id: 'runden', voreinstellung: { reiter: ['enigma'] } }], [{ id: 'runden', titel: 'Runden-Labor', welt: 3, frei: true, grund: null }]);
  await k.ruhe();
  const haupt = k.document.getElementById('haupt');
  k.klick(k.eins(haupt, 'button.werkzeug-schalter'));
  await k.ruhe();
  const feld = k.eins(haupt, '.werkzeug-panel-flaeche textarea');
  feld.focus();
  k.tippe(feld, 'fade');
  assert.ok(k.eins(haupt, 'section.gefuehrt'), 'Mini-Enigma mit fade → geführt');
  assert.equal(k.alle(haupt, '.lampe.leuchtet').length, 0, 'keine Lampe');
});

test('panel_tablet_hoch_antwort_klebt (1.3.2): offenes Panel unter 960 px – die Antwort klebt über der Knopfleiste, beim Schließen nicht mehr', async () => {
  const MQ = '(min-width: 768px) and (max-width: 959.98px) and (min-height: 640px)';
  for (const tablet of [true, false]) {
    const k = D.lade([...SKRIPTE, ...LABOR, 'krypto/labor/scheibe.js']);
    if (tablet) k.medien[MQ] = true;
    const box = k.document.createElement('div');
    box.className = 'aufgabe-box';
    const inhalt = k.document.createElement('div');
    inhalt.appendChild(k.wert('AQR').block({ t: 'werkzeug', id: 'scheibe', voreinstellung: { k: 7 } }, 0, { modus: 'lab', aufgabeId: 'W9-L1-01' }));
    box.appendChild(inhalt);
    const antwort = k.document.createElement('div');
    antwort.setAttribute('role', 'group');
    antwort.setAttribute('aria-label', 'Antwort');
    box.appendChild(antwort);
    k.document.body.appendChild(box);
    const s = k.eins(box, 'button.werkzeug-schalter');
    k.klick(s);
    await k.ruhe();
    assert.equal(antwort.classList.contains('antwort-klebt'), tablet, `offen, tablet ${tablet}`);
    k.klick(s);
    assert.equal(antwort.classList.contains('antwort-klebt'), false, 'geschlossen');
  }
});

test('panel_tablet_hoch_luecken_kleben_oben (1.3.2): Lückentext vor dem Werkzeug (ohne Antwortteil) klebt oben', async () => {
  const k = D.lade([...SKRIPTE, ...LABOR, 'krypto/labor/scheibe.js']);
  k.medien['(min-width: 768px) and (max-width: 959.98px) and (min-height: 640px)'] = true;
  const box = k.document.createElement('div');
  box.className = 'aufgabe-box';
  const inhalt = k.document.createElement('div');
  inhalt.className = 'inhalt';
  const text = k.document.createElement('div');
  const luecke = k.document.createElement('input');
  luecke.className = 'luecke';
  text.appendChild(luecke);
  inhalt.appendChild(text);
  inhalt.appendChild(k.wert('AQR').block({ t: 'werkzeug', id: 'scheibe', voreinstellung: { k: 7 } }, 1, { modus: 'lab', aufgabeId: 'W9-L1-01' }));
  box.appendChild(inhalt);
  k.document.body.appendChild(box);
  const s = k.eins(box, 'button.werkzeug-schalter');
  k.klick(s);
  await k.ruhe();
  assert.ok(text.classList.contains('antwort-klebt-oben'));
  k.klick(s);
  assert.equal(text.classList.contains('antwort-klebt-oben'), false);
});

/*
 * 1.3.3 (Entscheidung der Lehrkraft): Sprung-Knopf „↓ Zur Antwort“ / „↑ Zum Werkzeug“ – nur bei offenem Panel ohne
 * Seitenleiste, wenn die Antwort nicht klebt und Werkzeug und Antwort nicht zugleich im Bild sind.
 */
function sprungAufbau({ panelRect, antwortRect, fest = false, klebt = false }) {
  const k = D.lade([...SKRIPTE, ...LABOR, 'krypto/labor/scheibe.js']);
  const box = k.document.createElement('div');
  box.className = 'aufgabe-box';
  const inhalt = k.document.createElement('div');
  inhalt.className = 'inhalt';
  inhalt.appendChild(k.wert('AQR').block({ t: 'werkzeug', id: 'scheibe', voreinstellung: { k: 7 } }, 0, { modus: 'lab', aufgabeId: 'W9-L1-01' }));
  box.appendChild(inhalt);
  const antwort = k.document.createElement('div');
  antwort.setAttribute('role', 'group');
  const voll = k.document.createElement('input');
  voll.value = 'K';
  const leer = k.document.createElement('input');
  antwort.appendChild(voll);
  antwort.appendChild(leer);
  box.appendChild(antwort);
  k.document.body.appendChild(box);
  const flaeche = k.eins(box, '.werkzeug-panel-flaeche');
  const r = (x) => ({ ...x, left: 0, right: 300, width: 300, height: x.bottom - x.top });
  flaeche.getBoundingClientRect = () => r(panelRect());
  antwort.getBoundingClientRect = () => r(antwortRect());
  if (fest) flaeche.style.setProperty('position', 'fixed');
  const aufrufe = [];
  k.window.scrollBy = (o) => aufrufe.push(['antwort', o]);
  flaeche.scrollIntoView = (o) => aufrufe.push(['werkzeug', o]);
  if (klebt) k.medien['(min-width: 768px) and (max-width: 959.98px) and (min-height: 640px)'] = true; // kompakte Antwort klebt
  k.klick(k.eins(box, 'button.werkzeug-schalter'));
  return { k, antwort, leer, flaeche, aufrufe };
}
const sprung = (k) => k.alle(k.document.body, 'button.werkzeug-sprung')[0] || null;
const scrolle = async (k) => {
  k.window.dispatchEvent(new k.window.Event('scroll'));
  await k.ruhe();
};

test('panel_sprung_zur_antwort (1.3.3): Werkzeug im Bild, Antwort darunter → „↓ Zur Antwort“, Tippen rollt und fokussiert das erste leere Feld', async () => {
  const { k, leer, aufrufe } = sprungAufbau({ panelRect: () => ({ top: 100, bottom: 1500 }), antwortRect: () => ({ top: 1600, bottom: 1700 }) });
  await scrolle(k);
  const b = sprung(k);
  assert.ok(b && !b.hidden, 'Knopf sichtbar');
  assert.match(k.text(b), /Zur Antwort/);
  assert.match(b.getAttribute('aria-label'), /Antwort/);
  k.klick(b);
  assert.equal(aufrufe[0][0], 'antwort');
  assert.equal(aufrufe[0][1].top, 1600 - 350, 'Antwort (100 px) mittig im sichtbaren Bereich (800 px)');
  assert.equal(k.document.activeElement, leer, 'Fokus im ersten leeren Antwortfeld');
});

test('panel_sprung_zum_werkzeug (1.3.3): Antwort im Bild, Werkzeug darüber → „↑ Zum Werkzeug“, Tippen rollt zum Panel', async () => {
  const { k, flaeche, aufrufe } = sprungAufbau({ panelRect: () => ({ top: -1500, bottom: -100 }), antwortRect: () => ({ top: 300, bottom: 400 }) });
  await scrolle(k);
  const b = sprung(k);
  assert.ok(b && !b.hidden);
  assert.match(k.text(b), /Zum Werkzeug/);
  k.klick(b);
  assert.equal(aufrufe[0][0], 'werkzeug');
  assert.equal(k.document.activeElement, flaeche, 'Fokus auf dem Panel');
});

test('panel_sprung_nicht_noetig (1.3.3): beides im Bild, Seitenleiste, klebende Antwort oder Panel zu → kein Knopf', async () => {
  const faelle = [
    { name: 'beides im Bild', o: { panelRect: () => ({ top: 100, bottom: 500 }), antwortRect: () => ({ top: 550, bottom: 650 }) } },
    { name: 'Seitenleiste', o: { fest: true, panelRect: () => ({ top: 0, bottom: 800 }), antwortRect: () => ({ top: 1600, bottom: 1700 }) } },
    { name: 'klebt', o: { klebt: true, panelRect: () => ({ top: 100, bottom: 1500 }), antwortRect: () => ({ top: 1600, bottom: 1700 }) } }
  ];
  for (const f of faelle) {
    const { k, antwort } = sprungAufbau(f.o);
    await scrolle(k);
    if (f.o.klebt) assert.ok(antwort.classList.contains('antwort-klebt'), 'Antwort klebt');
    const b = sprung(k);
    assert.ok(!b || b.hidden, f.name);
  }
  const { k } = sprungAufbau({ panelRect: () => ({ top: 100, bottom: 1500 }), antwortRect: () => ({ top: 1600, bottom: 1700 }) });
  await scrolle(k);
  assert.ok(!sprung(k).hidden);
  k.klick(k.eins(k.document.body, 'button.werkzeug-schalter')); // zuklappen
  await scrolle(k);
  assert.ok(sprung(k).hidden, 'Panel zu → Knopf weg');
});

test('panel_sprung_bewegung (1.3.3): weiches Rollen nur ohne reduzierte Bewegung', async () => {
  for (const [reduziert, erwartet] of [[false, 'smooth'], [true, 'auto']]) {
    const { k, aufrufe } = sprungAufbau({ panelRect: () => ({ top: 100, bottom: 1500 }), antwortRect: () => ({ top: 1600, bottom: 1700 }) });
    if (reduziert) k.medien['(prefers-reduced-motion: reduce)'] = true;
    await scrolle(k);
    k.klick(sprung(k));
    assert.equal(aufrufe[0][1].behavior, erwartet, `reduziert ${reduziert}`);
  }
});
