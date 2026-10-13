'use strict';
// Chiffren-Werkstatt und Knack-Arena im Attrappen-DOM (Plan M7 Tasks 156, 157).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const D = require('./dom_attrappe');

const WERKSTATT = ['common.js', 'krypto/oberflaeche.js', 'shared/krypto.js', 'render.js', 'krypto/diagnose_chips.js', 'krypto/bloecke.js', 'krypto/kopfzeile.js', 'krypto/werkstatt.js'];
const SITZUNG = { status: 200, body: { rolle: 'schueler', name: 'Mika R.', kurs: { id: 'k:1', name: 'LK 13 (eA)', niveau: 'eA' }, kurse: [] } };
const TEAM = { id: 1, nr: 1, name: 'Team Skytale' };
const ARENA = (status = 'werkstatt', extra = {}) => ({ status: 200, body: { arena: { id: 4, status, angriffBis: null }, team: TEAM, eigene: null, teilnahme: 12, ...extra } });
const TEXT1 = 'Am Nordtor der alten Hafenstadt stehen drei Waechter. Jeden Abend tauschen sie die Losung, damit kein Fremder durch das Tor kommt. Wer die Losung kennt, darf passieren und bringt Nachrichten in die Stadt.';
const FUNKGITTER = [{ typ: 'vigenere', param: { schluessel: 'LATERNE' } }, { typ: 'spaltentransposition', teilen: { schluessel: 1 } }];

function lade(fetch, opt = {}) {
  return D.lade(WERKSTATT, { url: 'http://x.test/werkstatt#/', zeitraffer: 10, ...opt, fetch: { 'GET /api/sitzung': SITZUNG, ...fetch } });
}
const knopf = (k) => k.eins(k.document, 'button.werkstatt-einreichen');
/** Feld leeren und neu tippen (tippe hängt bei maxlength Zeichen für Zeichen an) */
const neu = (k, el, text) => {
  el.value = '';
  k.tippe(el, text);
};

test('Editor: FUNKGITTER mit geteiltem Schlüssel ergibt das W3-Beispiel; Hinweise mit Fallen-Chip; XOR nur zuletzt', async () => {
  const k = lade({ 'GET /api/arena': { status: 200, body: { arena: null, team: { id: 1, name: 'Team Skytale' }, eigene: null, teilnahme: 12 } } });
  await k.ruhe();
  const w = k.wert('KRWerkstatt');
  w.setzeStufen([{ typ: 'vigenere', param: { schluessel: 'FUNKE' } }, { typ: 'spaltentransposition', teilen: { schluessel: 1 } }]);
  k.tippe(k.eins(k.document, 'textarea.werkstatt-klartext'), 'Wetterbericht fuer die Nordsee');
  await k.ruhe();
  assert.equal(k.text(k.eins(k.document, 'output.werkstatt-geheimtext')), 'IMYIW BWHJS JDBPS NGRGQ EYVBL IY');
  assert.deepEqual(k.roh(w.zustand().verfahren.stufen.map((s) => s.param.schluessel)), ['$s1', '$s1']);
  assert.deepEqual(k.roh(w.zustand().schluessel), { s1: 'FUNKE' });
  assert.match(k.text(k.eins(k.document, '.werkstatt-rueck')), /Entschlüsseln liefert den Klartext/);
  // Zwischenergebnisse je Stufe
  assert.match(k.text(k.eins(k.document, 'details.werkstatt-zwischen')), /BYGDI WVRBM/);
  assert.equal(k.text(k.eins(k.document, 'p.werkstatt-laenge')), '27 Buchstaben (150–300)');
  w.setzeStufen([{ typ: 'caesar', param: { k: 3 } }, { typ: 'caesar', param: { k: 4 } }]);
  await k.ruhe();
  assert.match(k.text(k.eins(k.document, 'ul.werkstatt-hinweise')), /P8/);
  assert.ok(k.eins(k.document, 'ul.werkstatt-hinweise a.chip-falle'), 'Fallen-Chip');
  const typen = k.alle(k.eins(k.document, 'li.stufe[data-nr="1"] select.stufe-typ'), 'option').map((o) => o.value);
  assert.ok(!typen.includes('xor'), 'XOR nicht in Stufe 1 von 2');
  assert.ok(k.alle(k.eins(k.document, 'li.stufe[data-nr="2"] select.stufe-typ'), 'option').some((o) => o.value === 'xor'), 'XOR in der letzten Stufe');
  // Bedienung über die echten Felder: Stufe 2 → XOR, Schlüssel eintippen → Hex-Paare
  k.waehle(k.eins(k.document, 'li.stufe[data-nr="2"] select.stufe-typ'), 'xor');
  await k.ruhe();
  k.tippe(k.eins(k.document, 'li.stufe[data-nr="2"] input.stufe-param[data-param="schluessel"]'), 'AB');
  await k.ruhe();
  assert.match(k.text(k.eins(k.document, 'output.werkstatt-geheimtext')), /^[0-9A-F]{2}( [0-9A-F]{2})+$/);
  // neue Stufe vor einem XOR am Ende einfügen (XOR bleibt zuletzt)
  k.klick(k.eins(k.document, 'button.stufe-neu'));
  await k.ruhe();
  assert.deepEqual(k.roh(w.zustand().verfahren.stufen.map((s) => s.typ)), ['caesar', 'caesar', 'xor']);
  // Fehler bei ungültigem Wert
  k.tippe(k.eins(k.document, 'li.stufe[data-nr="1"] input.stufe-param[data-param="k"]'), '30');
  await k.ruhe();
  assert.match(k.text(k.eins(k.document, 'ol.werkstatt-fehler')), /Stufe 1: „k“ muss eine ganze Zahl von 0 bis 25 sein/);
  // Umordnen per Tastatur (Alt + Pfeil) und Knopf, Entfernen
  w.setzeStufen([{ typ: 'umkehrung' }, { typ: 'caesar', param: { k: 5 } }]);
  await k.ruhe();
  k.taste(k.eins(k.document, 'li.stufe[data-nr="2"] select.stufe-typ'), 'ArrowUp', { altKey: true });
  await k.ruhe();
  assert.deepEqual(k.roh(w.zustand().verfahren.stufen.map((s) => s.typ)), ['caesar', 'umkehrung']);
  k.klick(k.eins(k.document, 'li.stufe[data-nr="1"] button.stufe-runter'));
  await k.ruhe();
  assert.deepEqual(k.roh(w.zustand().verfahren.stufen.map((s) => s.typ)), ['umkehrung', 'caesar']);
  k.klick(k.eins(k.document, 'li.stufe[data-nr="1"] button.stufe-entfernen'));
  await k.ruhe();
  assert.deepEqual(k.roh(w.zustand().verfahren.stufen.map((s) => s.typ)), ['caesar']);
  assert.equal(k.eins(k.document, 'li.stufe[data-nr="1"] button.stufe-entfernen').disabled, true, 'mindestens eine Stufe');
});

test('Einreichen erst bei 150–300 Buchstaben, Prüfung ok, Beschreibung und Arena-Phase werkstatt', async () => {
  const gesendet = [];
  let status = 'werkstatt';
  const k = lade({
    'GET /api/arena': () => ARENA(status),
    'POST /api/arena/4/chiffre': (b) => {
      gesendet.push(b);
      return { status: 200, body: { ok: true, geheimtext: 'MRESE IEAUI SIRUT' } };
    }
  });
  await k.ruhe();
  const w = k.wert('KRWerkstatt');
  w.setzeStufen(FUNKGITTER);
  const klar = k.eins(k.document, 'textarea.werkstatt-klartext');
  const beschr = k.eins(k.document, 'textarea.werkstatt-beschreibung');
  k.tippe(klar, TEXT1.slice(0, 145)); // < 150 Buchstaben
  k.tippe(beschr, 'Stufe 1 Vigenère, Stufe 2 Spaltentransposition, beide mit demselben Schlüsselwort.');
  await k.ruhe();
  assert.equal(knopf(k).disabled, true, 'zu kurz');
  neu(k, klar, TEXT1);
  await k.ruhe();
  assert.equal(k.text(k.eins(k.document, 'p.werkstatt-laenge')), '167 Buchstaben (150–300)');
  assert.equal(knopf(k).disabled, false);
  neu(k, beschr, '   ');
  await k.ruhe();
  assert.equal(knopf(k).disabled, true, 'Beschreibung leer');
  neu(k, beschr, 'Vigenère und Spalten mit demselben Wort.');
  w.setzeStufen([{ typ: 'vigenere', param: { schluessel: 'LATERNE' } }, { typ: 'caesar', param: { k: 40 } }]);
  await k.ruhe();
  assert.equal(knopf(k).disabled, true, 'Prüffehler');
  w.setzeStufen(FUNKGITTER);
  await k.ruhe();
  assert.equal(knopf(k).disabled, false);
  k.klick(knopf(k));
  await k.ruhe();
  assert.equal(gesendet.length, 1);
  assert.deepEqual(gesendet[0], {
    verfahren: { version: 1, stufen: [{ typ: 'vigenere', param: { schluessel: '$s1' } }, { typ: 'spaltentransposition', param: { schluessel: '$s1' } }] },
    schluessel: { s1: 'LATERNE' },
    klartext: TEXT1,
    beschreibung: 'Vigenère und Spalten mit demselben Wort.'
  });
  assert.match(k.text(k.document.body), /Eingereicht – ihr könnt bis zum Start der Angriffsphase noch ändern\./);
  // Arena-Phase angriff → kein Einreichen mehr
  status = 'angriff';
  await k.wert('KRWerkstatt').aktualisiereArena();
  await k.ruhe();
  assert.equal(knopf(k).disabled, true, 'Phase angriff');
  // ohne Team
  const ohne = lade({ 'GET /api/arena': { status: 200, body: { arena: { id: 4, status: 'werkstatt', angriffBis: null }, team: null, eigene: null, teilnahme: 12 } } });
  await ohne.ruhe();
  ohne.wert('KRWerkstatt').setzeStufen(FUNKGITTER);
  ohne.tippe(ohne.eins(ohne.document, 'textarea.werkstatt-klartext'), TEXT1);
  ohne.tippe(ohne.eins(ohne.document, 'textarea.werkstatt-beschreibung'), 'B');
  await ohne.ruhe();
  assert.equal(knopf(ohne).disabled, true, 'ohne Team');
  assert.match(ohne.text(ohne.document.body), /Du bist keinem Team zugeteilt – die Werkstatt funktioniert trotzdem, einreichen kannst du nur mit Team\./);
});

test('Entwurf: gespeichert unter kr-werkstatt:<teilnahme>, beim Laden zurück, beim Abmelden gelöscht, ohne localStorage kein Fehler', async () => {
  const k = lade({ 'GET /api/arena': ARENA(), 'POST /api/abmelden': { status: 200, body: { weiter: '/' } } });
  await k.ruhe();
  k.window.localStorage.setItem('kr-werkstatt:99', '{}'); // Entwurf einer anderen Teilnahme auf demselben Tablet
  k.window.localStorage.setItem('kr-thema', 'dunkel');
  k.wert('KRWerkstatt').setzeStufen(FUNKGITTER);
  k.tippe(k.eins(k.document, 'textarea.werkstatt-klartext'), TEXT1);
  await k.ruhe();
  const roh = k.window.localStorage.getItem('kr-werkstatt:12');
  assert.ok(roh && roh.includes('Nordtor'), 'Entwurf enthält den Text');
  assert.deepEqual(JSON.parse(roh).schluessel, { s1: 'LATERNE' });
  assert.match(k.text(k.document.body), /Auf geteilten Tablets nach der Stunde abmelden – dann wird der Entwurf gelöscht\./);
  // neu laden: Entwurf zurück
  const k2 = lade({ 'GET /api/arena': ARENA() }, { vorher: (x) => x.window.localStorage.setItem('kr-werkstatt:12', roh) });
  await k2.ruhe();
  assert.equal(k2.eins(k2.document, 'textarea.werkstatt-klartext').value, TEXT1);
  assert.equal(k2.eins(k2.document, 'li.stufe[data-nr="1"] input.stufe-param').value, 'LATERNE');
  assert.equal(k2.text(k2.eins(k2.document, 'output.werkstatt-geheimtext')).slice(0, 17), 'MRESE IEAUI SIRUT');
  // Entwurf verwerfen
  k2.bestaetigen = true;
  k2.klick(k2.eins(k2.document, 'button.entwurf-verwerfen'));
  await k2.ruhe();
  assert.equal(k2.window.localStorage.getItem('kr-werkstatt:12'), null);
  assert.equal(k2.eins(k2.document, 'textarea.werkstatt-klartext').value, '');
  // Abmelden löscht alle Werkstatt-Entwürfe, sonst nichts
  k.klick(k.eins(k.document, 'button.abmelden'));
  await k.ruhe();
  assert.equal(k.window.localStorage.getItem('kr-werkstatt:12'), null);
  assert.equal(k.window.localStorage.getItem('kr-werkstatt:99'), null);
  assert.equal(k.window.localStorage.getItem('kr-thema'), 'dunkel');
  // werfender Speicher: Seite lädt und rechnet trotzdem
  const kaputt = lade({ 'GET /api/arena': ARENA() }, {
    vorher: (x) => {
      const wirf = () => {
        throw new Error('SecurityError');
      };
      Object.assign(x.window.localStorage, { getItem: wirf, setItem: wirf, removeItem: wirf, key: wirf });
    }
  });
  await kaputt.ruhe();
  kaputt.wert('KRWerkstatt').setzeStufen(FUNKGITTER);
  kaputt.tippe(kaputt.eins(kaputt.document, 'textarea.werkstatt-klartext'), TEXT1);
  await kaputt.ruhe();
  assert.equal(kaputt.text(kaputt.eins(kaputt.document, 'output.werkstatt-geheimtext')).slice(0, 17), 'MRESE IEAUI SIRUT');
});

test('Teilen bleibt beim Umordnen, Entfernen und Typwechsel erhalten (Wert wandert mit)', async () => {
  const k = lade({ 'GET /api/arena': ARENA() });
  await k.ruhe();
  const w = k.wert('KRWerkstatt');
  w.setzeStufen(FUNKGITTER);
  await k.ruhe();
  k.taste(k.eins(k.document, 'li.stufe[data-nr="2"] select.stufe-typ'), 'ArrowUp', { altKey: true });
  await k.ruhe();
  let z = k.roh(w.zustand());
  assert.deepEqual(z.verfahren.stufen.map((s) => [s.typ, s.param.schluessel]), [['spaltentransposition', '$s1'], ['vigenere', '$s1']]);
  assert.deepEqual(z.schluessel, { s1: 'LATERNE' });
  assert.equal(k.eins(k.document, 'li.stufe[data-nr="2"] select.stufe-teilen').value.endsWith(':schluessel'), true);
  // Stufe 1 entfernen: Stufe 2 behält den Wert
  k.klick(k.eins(k.document, 'li.stufe[data-nr="1"] button.stufe-entfernen'));
  await k.ruhe();
  z = k.roh(w.zustand());
  assert.deepEqual(z.schluessel, { s1: 'LATERNE' });
  assert.equal(k.eins(k.document, 'li.stufe[data-nr="1"] input.stufe-param').value, 'LATERNE');
  // Typwechsel der Quelle: die teilende Stufe übernimmt den Wert
  w.setzeStufen(FUNKGITTER);
  await k.ruhe();
  k.waehle(k.eins(k.document, 'li.stufe[data-nr="1"] select.stufe-typ'), 'caesar');
  await k.ruhe();
  z = k.roh(w.zustand());
  assert.deepEqual(z.verfahren.stufen.map((s) => s.typ), ['caesar', 'spaltentransposition']);
  assert.equal(z.schluessel.s2, 'LATERNE');
});

/* ---------- Knack-Arena (Task 157) ---------- */
const ARENA_SEITE = [...WERKSTATT.slice(0, -1), 'krypto/profil.js', 'krypto/funkpoll.js', 'krypto/arena.js', 'krypto/werkstatt.js'];
const CHIFFRE = (id, team, extra = {}) => ({
  id,
  team,
  name: id === 1 ? 'FUNKGITTER' : 'Nur Caesar',
  stufen: id === 1 ? [{ typ: 'vigenere', kuerzel: 'VIG', param: { schluessel: 'geheim' } }, { typ: 'spaltentransposition', kuerzel: 'SPA', param: { schluessel: 'geheim' } }] : [{ typ: 'caesar', kuerzel: 'CAE', param: { k: 'geheim' } }],
  schluesselFelder: id === 1 ? [{ name: 'wort', art: 'wort', min: 2, max: 10, stufen: [1, 2] }] : [{ name: 'k', art: 'zahl', min: 0, max: 25, stufen: [1] }],
  beschreibung: id === 1 ? 'Stufe 1 Vigenère, Stufe 2 Spalten.' : 'Caesar.',
  geheimtext: id === 1 ? 'MRESE IEAUI SIRUT' : 'KLYSL BJOAA',
  klartextLaenge: 167,
  geknackt: false,
  versuche: 0,
  eigene: false,
  ...extra
});
const SKYTALE = { id: 1, name: 'Team Skytale' };
const SCHEIBE = { id: 2, name: 'Team Scheibe' };
function ladeArena(status, chiffren, routen = {}) {
  return D.lade(ARENA_SEITE, {
    url: 'http://x.test/werkstatt#/arena',
    zeitraffer: 10,
    fetch: {
      'GET /api/sitzung': SITZUNG,
      'GET /api/arena': ARENA(status, { team: { id: 2, nr: 2, name: 'Team Scheibe' } }),
      'GET /api/arena/4/chiffren': { status: 200, body: chiffren },
      'GET /api/profil': { status: 200, body: { abzeichen: [] } },
      ...routen
    }
  });
}

test('Arena: in der Werkstatt nur die eigene Chiffre, ohne Angriffsformular; Hinweis auf den Start', async () => {
  const k = ladeArena('werkstatt', [CHIFFRE(2, SCHEIBE, { eigene: true })]);
  await k.ruhe();
  assert.match(k.text(k.document.body), /Die Angriffsphase beginnt, wenn eure Lehrkraft sie startet\./);
  const li = k.alle(k.document, 'ol.arena-chiffren li.arena-chiffre');
  assert.equal(li.length, 1);
  assert.equal(li[0].querySelector('form.arena-angriff'), null);
  assert.match(k.text(li[0]), /eure Chiffre/);
});

test('Arena: Angriff per Schlüssel mit den Feldern der Platzhalter, per Klartext, Grenzen und 429; eigene Chiffre ohne Formular', async () => {
  const gesendet = [];
  let n = 0;
  const k = ladeArena('angriff', [CHIFFRE(1, SKYTALE), CHIFFRE(2, SCHEIBE, { eigene: true })], {
    'POST /api/arena/4/chiffren/1/angriff': (b) => {
      gesendet.push(b);
      n++;
      if (n === 3) return { status: 429, headers: { 'retry-after': '20' }, body: { error: 'Ein Versuch je 30 Sekunden auf dieselbe Chiffre.' } };
      return { status: 200, body: { erfolg: n === 2, geknackt: n === 2, rest: { chiffre: 30, team: 60 - n } } };
    }
  });
  await k.ruhe();
  const fremd = k.eins(k.document, 'li.arena-chiffre[data-id="1"]');
  const eigen = k.eins(k.document, 'li.arena-chiffre[data-id="2"]');
  assert.equal(eigen.querySelector('form.arena-angriff'), null, 'eigene Chiffre ohne Formular');
  assert.match(k.text(fremd), /Team Skytale/);
  assert.match(k.text(fremd), /VIG.*SPA/);
  assert.match(k.text(fremd), /Stufe 1 Vigenère, Stufe 2 Spalten\./);
  assert.match(k.text(fremd), /ungeknackt/);
  const form = k.eins(fremd, 'form.arena-angriff');
  // Reiter Klartext
  k.tippe(k.eins(form, 'textarea.arena-klartext'), 'am nordtor');
  form.dispatchEvent(new k.window.Event('submit', { cancelable: true }));
  await k.ruhe();
  assert.deepEqual(k.roh(gesendet[0]), { klartext: 'am nordtor' });
  assert.match(k.text(k.eins(fremd, 'p.arena-ergebnis')), /Leider nicht\./);
  assert.match(k.text(k.eins(fremd, 'p.arena-rest')), /Nächster Versuch auf diese Chiffre in 30 s · noch 59 Versuche in 10 min/);
  // Reiter Schlüssel: je Platzhalter ein Feld
  k.klick(k.eins(form, 'button.arena-reiter[data-reiter="schluessel"]'));
  const felder = k.alle(form, 'input.arena-schluessel');
  assert.deepEqual(felder.map((f) => f.getAttribute('data-name')), ['wort']);
  k.tippe(felder[0], 'LATERNE');
  form.dispatchEvent(new k.window.Event('submit', { cancelable: true }));
  await k.ruhe();
  assert.deepEqual(k.roh(gesendet[1]), { schluessel: { wort: 'LATERNE' } });
  assert.match(k.text(k.eins(fremd, 'p.arena-ergebnis')), /Geknackt!/);
  // 429 als Meldung
  form.dispatchEvent(new k.window.Event('submit', { cancelable: true }));
  await k.ruhe();
  assert.match(k.text(k.eins(fremd, 'p.arena-ergebnis')), /Ein Versuch je 30 Sekunden/);
  // Labor-Links ohne Texte in der URL
  const links = k.alle(k.document, 'a.arena-labor').map((a) => a.getAttribute('href'));
  assert.deepEqual(links, ['/labor#/haeufigkeit', '/labor#/vigenere', '/labor#/bitlupe']);
  // Zahl-Platzhalter wird als Zahl gesendet
  const k2 = ladeArena('angriff', [CHIFFRE(3, SKYTALE)], { 'POST /api/arena/4/chiffren/3/angriff': (b) => (gesendet.push(b), { status: 200, body: { erfolg: false, geknackt: false, rest: { chiffre: 30, team: 59 } } }) });
  await k2.ruhe();
  const f2 = k2.eins(k2.document, 'form.arena-angriff');
  k2.klick(k2.eins(f2, 'button.arena-reiter[data-reiter="schluessel"]'));
  k2.tippe(k2.eins(f2, 'input.arena-schluessel[data-name="k"]'), '7');
  f2.dispatchEvent(new k2.window.Event('submit', { cancelable: true }));
  await k2.ruhe();
  assert.deepEqual(k2.roh(gesendet.at(-1)), { schluessel: { k: 7 } });
});

test('Arena: Beurteilung sendet PUT mit Text, zeigt „Gespeichert“; Hinweise aller Chiffren sichtbar; geschlossen nur lesen', async () => {
  const puts = [];
  const k = ladeArena('beurteilung', [CHIFFRE(1, SKYTALE, { geknackt: true, geknacktVon: [{ id: 2, name: 'Team Scheibe' }], geknacktNachSek: 70, hinweise: [] }), CHIFFRE(2, SCHEIBE, { eigene: true, hinweise: [{ p: null, text: 'Nur Substitutionsstufen: Wortgrenzen …' }] })], {
    'PUT /api/arena/4/beurteilung': (b) => (puts.push(b), { status: 200, body: { ok: true } })
  });
  await k.ruhe();
  assert.match(k.text(k.eins(k.document, 'li.arena-chiffre[data-id="1"]')), /geknackt von Team Scheibe/);
  assert.match(k.text(k.eins(k.document, 'li.arena-chiffre[data-id="2"]')), /Nur Substitutionsstufen/);
  const form = k.eins(k.document, 'form.arena-beurteilung');
  assert.match(k.text(form), /Schlüsselraum/);
  assert.match(k.text(form), /Fehlerfortpflanzung/);
  k.tippe(k.eins(form, 'textarea'), 'Insgesamt ist unser Verfahren schwach, weil Caesar nur 25 Schlüssel hat.');
  form.dispatchEvent(new k.window.Event('submit', { cancelable: true }));
  await k.ruhe();
  assert.deepEqual(k.roh(puts), [{ text: 'Insgesamt ist unser Verfahren schwach, weil Caesar nur 25 Schlüssel hat.' }]);
  assert.match(k.text(form), /Gespeichert/);
  assert.equal(k.alle(k.document, 'form.arena-angriff').length, 0, 'keine Angriffe in der Beurteilung');
  const g = ladeArena('geschlossen', [CHIFFRE(1, SKYTALE), CHIFFRE(2, SCHEIBE, { eigene: true })]);
  await g.ruhe();
  assert.equal(g.alle(g.document, 'form').length, 0, 'geschlossen: nur lesen');
  assert.match(g.text(g.document.body), /nur lesen/);
});

test('Arena: Abzeichen-Toast nur für neu erhaltene Abzeichen (/api/profil listet alle mit „erhalten“)', async () => {
  let erhalten = false;
  const profil = () => ({
    status: 200,
    body: {
      abzeichen: [
        { key: 'erste_schritte', icon: 'a-stern', name: 'Erste Schritte', erhalten: true, am: '2026-10-13T08:00:00.000Z' },
        { key: 'arena_knacker', icon: 'a-knacker', name: 'Arena-Knacker', erhalten, am: erhalten ? '2026-10-13T09:00:00.000Z' : null },
        { key: 'unknackbar', icon: 'a-unknackbar', name: 'Unknackbar', erhalten: false, am: null }
      ]
    }
  });
  const k = ladeArena('angriff', [CHIFFRE(1, SKYTALE), CHIFFRE(2, SCHEIBE, { eigene: true })], {
    'GET /api/profil': profil,
    'POST /api/arena/4/chiffren/1/angriff': () => {
      erhalten = true;
      return { status: 200, body: { erfolg: true, geknackt: true, rest: { chiffre: 30, team: 59 } } };
    }
  });
  await k.ruhe();
  const toast = () => k.document.getElementById('toast');
  assert.ok(!toast() || toast().hidden || !/Abzeichen/.test(k.text(toast())), 'kein Toast beim Öffnen');
  const form = k.eins(k.document, 'li.arena-chiffre[data-id="1"] form.arena-angriff');
  k.tippe(k.eins(form, 'textarea.arena-klartext'), 'am nordtor');
  form.dispatchEvent(new k.window.Event('submit', { cancelable: true }));
  await k.ruhe();
  await new Promise((r) => setTimeout(r, 100)); // Toast nach 300 ms (Zeitraffer 10)
  await k.ruhe();
  assert.ok(toast(), 'Toast vorhanden');
  assert.match(k.text(toast()), /Abzeichen: Arena-Knacker/);
  assert.doesNotMatch(k.text(toast()), /Unknackbar|Erste Schritte/);
});
