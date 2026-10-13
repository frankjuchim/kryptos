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
