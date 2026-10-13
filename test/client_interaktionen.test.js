'use strict';
// Client-Interaktionen der Plattform (krypto/interaktionen.js, Delta §8) im Attrappen-DOM – inklusive Rundlauf
// Client-Antwort → Server-bereinige → pruefe mit den Fixture-Aufgaben (die Antwortform muss zum Server-Vertrag passen).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const D = require('./dom_attrappe');
const K = require('../public/static/js/shared/krypto.js');
const W = require('./fixtures/welt_beispiel.json');
const SKRIPTE = ['common.js', 'shared/krypto.js', 'render.js', 'interact.js', 'krypto/oberflaeche.js', 'krypto/diagnose_chips.js', 'krypto/labor/registry.js', 'krypto/bloecke.js', 'krypto/interaktionen.js'];
/** Aufgabe so, wie der Client sie bekommt (ohne Lösung/Erklärung). */
function oeffentlich(id) {
  const a = structuredClone(W.aufgaben.find((x) => x.id === id));
  delete a.loesung; delete a.erklaerung; delete a.tipps;
  return a;
}
function baue(a, opt = {}) {
  const k = D.lade(SKRIPTE);
  const c = k.wert('AQI').aufgabe(a, { modus: 'lab', ...opt });
  k.document.body.appendChild(c.el);
  return { k, c };
}
/** Server-Vertrag einer Interaktion: Antwort bereinigen und prüfen (wie src/krypto/lernen beim Prüfen). */
function server(art, id, antwort, teil = null) {
  const V = require(`../src/krypto/interaktionen/${art}.js`).vertrag;
  const a = W.aufgaben.find((x) => x.id === id);
  const ia = teil === null ? a.interaktion : a.interaktion[teil];
  const lo = teil === null ? a.loesung : a.loesung[teil];
  const b = V.bereinige(ia, JSON.parse(JSON.stringify(antwort)), { aufgabe: a });
  assert.deepEqual(V.bereinige(ia, b, { aufgabe: a }), b, 'kanonische Form ist Fixpunkt');
  return { b, r: V.pruefe(ia, lo, b, false, {}), leer: V.istLeer(ia, b) };
}

test('chiffre ent (W9-L5-01): 12 Kästchen in Gruppen, aria-label, Weiterspringen, Rücktaste, Positionen', () => {
  const { k, c } = baue(oeffentlich('W9-L5-01'));
  const kae = k.alle(c.el, 'input.kaestchen');
  assert.equal(kae.length, 12);
  assert.deepEqual(k.alle(c.el, 'span.kaestchen-gruppe').map((g) => g.querySelectorAll('input').length), [5, 5, 2]);
  assert.equal(kae[6].getAttribute('aria-label'), 'Zeichen 7 von 12, zu Geheimtextbuchstabe D');
  k.tippe(kae[0], 'z');
  assert.equal(kae[0].value, 'Z');
  assert.equal(k.document.activeElement, kae[1]);
  k.taste(kae[1], 'Backspace');
  assert.equal(k.document.activeElement, kae[0]);
  assert.deepEqual(k.alle(c.el, '.hilfszeile-positionen .hz').map(k.text).filter(Boolean), ['0', '5', '10']);
  assert.match(k.text(k.eins(c.el, '.chiffre-kopf')), /Verfahren: Caesar/);
  assert.equal(c.antwort()[1], '');
  assert.equal(c.antwort().length, 12);
});
test('chiffre ver (W9-L5-02): Hilfszeilen Schlüssel und Zahlen; Feedback je Zeichen; Lösung', () => {
  const { k, c } = baue(oeffentlich('W9-L5-02'));
  assert.deepEqual(k.alle(c.el, '.hilfszeile-schluessel .hz').map(k.text).join(''), 'ROTROTROT');
  assert.deepEqual(k.alle(c.el, '.hilfszeile-zahlen .hz').map(k.text).map(Number), K.zahlen('kanalufer', 1));
  c.feedback({ ok: false, teile: [{ ok: false, zeichen: [true, false, true, true, true, true, true, true, true] }] });
  const kae = k.alle(c.el, 'input.kaestchen');
  assert.ok(kae[0].classList.contains('ok') && kae[1].classList.contains('falsch'));
  assert.equal(kae[1].getAttribute('aria-invalid'), 'true');
  c.loesung({ text: 'BOGRZNWSK' });
  c.sperren(true);
  assert.equal(kae.map((x) => x.value).join(''), 'BOGRZNWSK');
  assert.ok(kae.every((x) => x.disabled));
});
test('chiffre Zahlen (W9-L5-03): Zahl-Kästchen, Antwort als Zahlenliste mit null', () => {
  const { k, c } = baue(oeffentlich('W9-L5-03'));
  const kae = k.alle(c.el, 'input.kaestchen.zahl');
  assert.equal(kae.length, 5);
  assert.equal(kae[0].getAttribute('inputmode'), 'numeric');
  k.tippe(kae[0], '9'); k.tippe(kae[2], '19');
  assert.deepEqual(k.roh(c.antwort()), [9, null, 19, null, null]);
});
test('chiffre ohne bestimmbare Länge (W9-L5-05 Playfair): Zeilenfeld mit Live-Gruppen (E26)', () => {
  const { k, c } = baue(oeffentlich('W9-L5-05'));
  assert.equal(k.alle(c.el, 'input.kaestchen').length, 0);
  k.tippe(k.eins(c.el, 'input.chiffre-zeile'), 'nhqz sfik');
  assert.equal(k.text(k.eins(c.el, '.chiffre-zeile-vorschau')), 'NHQZS FIK');
  assert.equal(c.antwort(), 'nhqz sfik');
  assert.equal(k.wert('KRI').laenge(oeffentlich('W9-L5-07').interaktion), null, 'Baukasten');
  assert.equal(k.wert('KRI').laenge({ kind: 'chiffre', richtung: 'ver', verfahren: { typ: 'polybios' }, eingabe: 'abc' }), 6);
});
test('chiffre mit verdecktem Schlüssel: Hinweis, keine Schlüsselzeile', () => {
  const { k, c } = baue({ id: 'W9-L2-10', inhalt: [], interaktion: { kind: 'chiffre', richtung: 'ent', verfahren: { typ: 'caesar' }, schluesselVerdeckt: true, eingabe: 'GYVUO XJSOR OXKEP', hilfszeilen: ['positionen'] } });
  assert.match(k.text(k.eins(c.el, '.chiffre-kopf')), /Schlüssel verdeckt/);
  assert.equal(k.alle(c.el, '.hilfszeile-schluessel').length, 0);
});
test('chiffre Schrittprüfung: Präfix an den Server, erste falsche Position markiert', async () => {
  const praefixe = [];
  const { k, c } = baue(oeffentlich('W9-L5-01'), { schritt: async (teil, antwort) => { praefixe.push(antwort); return antwort.length === 2 ? { ok: false, ersteFalschePosition: 1 } : { ok: true, vollstaendig: false }; } });
  const schalter = k.eins(c.el, 'label.check input');
  assert.equal(schalter.checked, false, 'Schrittprüfung bei chiffre standardmäßig aus (Delta §8.1)');
  schalter.checked = true;
  const kae = k.alle(c.el, 'input.kaestchen');
  k.tippe(kae[0], 'Z');
  await k.ruhe();
  k.tippe(kae[1], 'X');
  await k.ruhe();
  assert.deepEqual(praefixe, ['Z', 'ZX']);
  assert.ok(kae[0].classList.contains('ok'));
  assert.ok(kae[1].classList.contains('falsch'));
});

/* ---------- Ergänzend: Bedienung und Rundlauf zum Server-Vertrag ---------- */

test('chiffre Bedienung: Einfügen verteilt, Pfeiltasten, Umlaut, Länge je Verfahren (E26)', () => {
  const { k, c } = baue(oeffentlich('W9-L5-01'));
  const kae = k.alle(c.el, 'input.kaestchen');
  k.tippe(kae[0], 'zuver laessig');
  assert.equal(kae.map((x) => x.value).join(''), 'ZUVERLAESSIG');
  assert.equal(kae[0].getAttribute('maxlength'), '1');
  assert.equal(kae[0].getAttribute('autocapitalize'), 'characters');
  k.taste(kae[4], 'ArrowLeft');
  assert.equal(k.document.activeElement, kae[3]);
  k.taste(kae[3], 'ArrowRight');
  assert.equal(k.document.activeElement, kae[4]);
  // Umlaut im Kästchen → ae über zwei Kästchen (Konvention Design §6.2)
  kae[2].value = 'ä'; kae[2].dispatchEvent(new k.window.Event('input', { bubbles: true }));
  assert.deepEqual([kae[2].value, kae[3].value], ['A', 'E']);
  // Ziffern sind bei Buchstaben-Verfahren kein Zeichen
  kae[5].value = '7'; kae[5].dispatchEvent(new k.window.Event('input', { bubbles: true }));
  assert.equal(kae[5].value, '');
  const L = k.wert('KRI').laenge;
  const ia = (typ, extra = {}) => ({ kind: 'chiffre', richtung: 'ver', verfahren: { typ, ...extra }, eingabe: 'kanalufer', ...(extra.ia || {}) });
  assert.equal(L(ia('spaltentransposition')), 9);
  assert.equal(L(ia('spaltentransposition', { fuellzeichen: 'X' })), null);
  assert.equal(L(ia('playfair')), null);
  assert.equal(L({ kind: 'chiffre', richtung: 'ent', verfahren: { typ: 'polybios' }, eingabe: '11 12 13' }), 3);
  assert.equal(L({ kind: 'chiffre', richtung: 'ent', verfahren: { typ: 'adfgvx' }, eingabe: 'ADF' }), null, 'ungerade Länge');
  assert.equal(L({ kind: 'chiffre', richtung: 'ver', verfahren: { typ: 'xor' }, ausgabe: 'hex', eingabe: 'ok' }), 4);
  assert.equal(L({ kind: 'chiffre', richtung: 'ver', verfahren: { typ: 'xor' }, eingabe: 'ok' }), null);
  assert.equal(L({ kind: 'chiffre', richtung: 'ver', verfahren: { typ: 'frei' }, eingabe: 'ok' }), null);
});
test('chiffre: zeichenweise bei unbekannter Länge mit „＋ Kästchen“; zeile ausdrücklich', () => {
  const a = oeffentlich('W9-L5-05');
  a.interaktion.darstellung = 'zeichenweise';
  const { k, c } = baue(a);
  assert.equal(k.alle(c.el, 'input.kaestchen').length, 11);
  assert.equal(k.eins(c.el, 'input.kaestchen').getAttribute('aria-label'), 'Zeichen 1 von 11');
  k.klick(k.eins(c.el, 'button.mehr-kaestchen'));
  assert.equal(k.alle(c.el, 'input.kaestchen').length, 12);
  c.loesung({ text: 'NHQZSFIKRHIS' });
  assert.equal(k.alle(c.el, 'input.kaestchen').map((x) => x.value).join(''), 'NHQZSFIKRHIS');
  const b = oeffentlich('W9-L5-01');
  b.interaktion.darstellung = 'zeile';
  const z = baue(b);
  assert.equal(z.k.alle(z.c.el, 'input.kaestchen').length, 0);
  assert.equal(z.k.eins(z.c.el, 'input.chiffre-zeile').getAttribute('aria-label'), 'Antwort');
  z.c.feedback({ ok: false, teile: [{ ok: false, zeichen: [true, true, false] }] });
  assert.equal(z.k.text(z.k.eins(z.c.el, '.chiffre-ergebnis')), '2 von 3 Zeichen richtig');
  assert.equal(z.k.alle(z.c.el, '.zeichen-feedback .zf').length, 3);
});
test('chiffre Rundlauf: Kästchen-Antwort → bereinige → pruefe (W9-L5-01, -02, -03, -04, -05, -06)', () => {
  // vollständig richtig
  let { k, c } = baue(oeffentlich('W9-L5-01'));
  k.tippe(k.eins(c.el, 'input.kaestchen'), 'ZUVERLAESSIG');
  assert.equal(server('chiffre', 'W9-L5-01', c.antwort()).r.ok, true);
  // Lücke in der Mitte bleibt an ihrer Stelle (_), Feedback je Position passt zu den Kästchen
  c.setze('ZU_ERLAESSIG');
  assert.equal(c.antwort()[2], '');
  const s = server('chiffre', 'W9-L5-01', c.antwort());
  assert.equal(s.b, 'ZU_ERLAESSIG');
  assert.deepEqual(s.r.zeichen.map((x, i) => (x ? i : -1)).filter((i) => i >= 0).length, 11);
  assert.equal(s.r.zeichen[2], false);
  c.feedback({ ok: false, teile: [s.r] });
  const kae = k.alle(c.el, 'input.kaestchen');
  assert.ok(kae[2].classList.contains('falsch') && kae[3].classList.contains('ok'));
  // leer
  ({ k, c } = baue(oeffentlich('W9-L5-01')));
  assert.equal(c.leer(), true);
  assert.equal(server('chiffre', 'W9-L5-01', c.antwort()).leer, true);
  // ver mit Schlüsselzeile
  ({ k, c } = baue(oeffentlich('W9-L5-02')));
  k.tippe(k.eins(c.el, 'input.kaestchen'), 'bogrznwsk');
  assert.equal(server('chiffre', 'W9-L5-02', c.antwort()).r.ok, true);
  // Zahlen
  ({ k, c } = baue(oeffentlich('W9-L5-03')));
  const z = k.alle(c.el, 'input.kaestchen.zahl');
  ['9', '11', '19', '5', '14'].forEach((x, i) => k.tippe(z[i], x));
  assert.deepEqual(k.roh(c.antwort()), [9, 11, 19, 5, 14]);
  assert.equal(server('chiffre', 'W9-L5-03', c.antwort()).r.ok, true);
  c.setze([9, null, 19]);
  assert.deepEqual(server('chiffre', 'W9-L5-03', c.antwort()).b, [9, null, 19, null, null]);
  // mehrteilig, Zahlen
  ({ k, c } = baue(oeffentlich('W9-L5-04')));
  c.setze(['26 1 2 3 4', [24, 25, 26, 20, 21]]);
  const [a0, a1] = k.roh(c.antwort());
  assert.equal(server('chiffre', 'W9-L5-04', a0, 0).r.ok, true);
  assert.equal(server('chiffre', 'W9-L5-04', a1, 1).r.ok, true);
  // Zeile (Playfair) – auch Kleinschreibung mit Leerzeichen; Alternative I/J
  ({ k, c } = baue(oeffentlich('W9-L5-05')));
  k.tippe(k.eins(c.el, 'input.chiffre-zeile'), 'nhqzs fjkrh js');
  assert.equal(server('chiffre', 'W9-L5-05', c.antwort()).r.ok, true);
  // Spaltentransposition ohne Füllzeichen: 10 Kästchen, ohne „zu …“ (keine Zeichen-Entsprechung)
  ({ k, c } = baue(oeffentlich('W9-L5-06')));
  const t = k.alle(c.el, 'input.kaestchen');
  assert.equal(t.length, 10);
  assert.equal(t[0].getAttribute('aria-label'), 'Zeichen 1 von 10');
  k.tippe(t[0], 'RFNEPKTFUT');
  assert.equal(server('chiffre', 'W9-L5-06', c.antwort()).r.ok, true);
  // gespeicherte kanonische Antwort (Boss) wieder einsetzen
  ({ k, c } = baue(oeffentlich('W9-L5-06')));
  c.setze('RFN_PKTFUT');
  assert.equal(k.alle(c.el, 'input.kaestchen').map((x) => x.value || '_').join(''), 'RFN_PKTFUT');
});
