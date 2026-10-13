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
  require('../src/krypto').registriere(); // Normalisierungen krypto/bits wie in der App
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

test('zuordnung (W9-L3-01): Leiste nach Häufigkeit, Vorgabe gesperrt, Live-Klartext, doppelt, Rückgängig, Antwort', () => {
  const a = oeffentlich('W9-L3-01');
  const { k, c } = baue(a);
  const H = K.haeufigkeiten(a.interaktion.geheimtext);
  const vorkommend = Object.keys(H).filter((x) => H[x] > 0).sort((x, y) => H[y] - H[x] || x.localeCompare(y));
  assert.deepEqual(k.alle(c.el, 'ul.zuordnung-leiste li').map((li) => li.getAttribute('data-g')), vorkommend);
  const feld = (g) => k.eins(c.el, `li[data-g="${g}"] input.z-feld`);
  assert.equal(feld('M').disabled, true);
  assert.equal(feld('M').value, 'E');
  assert.equal(feld('T').getAttribute('aria-label'), `Geheimbuchstabe T, ${H.T}-mal, Klartext:`);
  k.tippe(feld('T'), 't');
  assert.equal(feld('T').value, 'T');
  const tKlar = k.alle(c.el, 'span.z-paar').filter((p) => k.text(p.querySelector('.z-geheim')) === 'T').map((p) => k.text(p.querySelector('.z-klar')));
  assert.ok(tKlar.length === H.T && tKlar.every((x) => x === 't'));
  k.tippe(feld('U'), 't');
  assert.ok(k.eins(c.el, 'li[data-g="T"]').classList.contains('doppelt'));
  k.klick(k.eins(c.el, 'button.rueckgaengig'));
  assert.equal(feld('U').value, '');
  assert.equal(c.antwort().zuordnung.T, 'T');
  assert.equal(c.antwort().zuordnung.M, 'E');
  assert.equal(Object.keys(c.antwort().zuordnung).length, vorkommend.length);
  assert.ok(k.eins(c.el, 'aside.zuordnung-haeufigkeit svg.histogramm'));
});
test('zuordnung (W9-L3-02): Feedback je Buchstabe und Anteil; Lösung', () => {
  const { k, c } = baue(oeffentlich('W9-L3-02'));
  c.feedback({ ok: false, teile: [{ ok: false, anteil: 0.62, buchstaben: { S: true, M: false } }] });
  assert.equal(k.text(k.eins(c.el, 'p.zuordnung-anteil')), '62 % der Textstellen richtig');
  assert.ok(k.eins(c.el, 'li[data-g="S"]').classList.contains('ok'));
  assert.ok(k.eins(c.el, 'li[data-g="M"]').classList.contains('falsch'));
  c.loesung({ zuordnung: W.aufgaben.find((x) => x.id === 'W9-L3-02').loesung.zuordnung, klartext: 'GEHEIMTREFFENIMKELLER' });
  assert.equal(k.eins(c.el, 'li[data-g="S"] input.z-feld').value, 'G');
});
test('zuordnung Bedienung: Pfeiltasten, nur A–Z, alphabetisch, Zurücksetzen, Vorschau gedrosselt, leer/setze', async () => {
  const { k, c } = baue(oeffentlich('W9-L3-01'));
  const felder = k.alle(c.el, 'input.z-feld');
  const offen = felder.filter((f) => !f.disabled);
  k.taste(offen[1], 'ArrowRight');
  assert.equal(k.document.activeElement, offen[2]);
  k.taste(offen[2], 'ArrowLeft');
  assert.equal(k.document.activeElement, offen[1]);
  assert.equal(c.leer(), true, 'nur Vorgaben → leer');
  offen[0].value = 'ä'; offen[0].dispatchEvent(new k.window.Event('input', { bubbles: true }));
  assert.equal(offen[0].value, '');
  assert.match(k.text(k.document.getElementById('toast')), /Nur Buchstaben A–Z/);
  const alpha = k.alle(c.el, '.zuordnung-steuerung button[aria-pressed]').find((b) => k.text(b) === 'alphabetisch');
  k.klick(alpha);
  assert.equal(alpha.getAttribute('aria-pressed'), 'true');
  const reihe = k.alle(c.el, 'ul.zuordnung-leiste li').map((li) => li.getAttribute('data-g'));
  assert.deepEqual(reihe, [...reihe].sort());
  c.setze({ T: 'T', Q: 'r' });
  assert.equal(c.leer(), false);
  assert.equal(k.eins(c.el, 'li[data-g="Q"] input.z-feld').value, 'R');
  await k.ruhe();
  assert.match(k.text(k.eins(c.el, 'p.zuordnung-vorschau')), /^Klartext: [a-z·]+/);
  k.klick(k.eins(c.el, 'button.zuruecksetzen'));
  assert.equal(c.leer(), true);
  assert.equal(k.eins(c.el, 'li[data-g="M"] input.z-feld').value, 'E', 'Vorgabe bleibt');
  k.klick(k.eins(c.el, 'button.rueckgaengig'));
  assert.equal(k.eins(c.el, 'li[data-g="Q"] input.z-feld').value, 'R', 'Zurücksetzen ist rückgängig zu machen');
  c.sperren(true);
  assert.ok(k.alle(c.el, 'input.z-feld').every((f) => f.disabled));
});
test('zuordnung Rundlauf: Client-Antwort → bereinige → pruefe (W9-L3-01 klartext, W9-L3-02 zuordnung/buchstaben)', () => {
  const lo1 = W.aufgaben.find((x) => x.id === 'W9-L3-01').loesung.zuordnung;
  let { k, c } = baue(oeffentlich('W9-L3-01'));
  assert.equal(server('zuordnung', 'W9-L3-01', c.antwort()).leer, true);
  for (const [g, kl] of Object.entries(lo1)) if (g !== 'M') k.tippe(k.eins(c.el, `li[data-g="${g}"] input.z-feld`), kl.toLowerCase());
  let s = server('zuordnung', 'W9-L3-01', c.antwort());
  assert.equal(s.r.ok, true);
  assert.equal(s.r.anteil, 1);
  k.tippe(k.eins(c.el, 'li[data-g="T"] input.z-feld'), 'x');
  s = server('zuordnung', 'W9-L3-01', c.antwort());
  assert.equal(s.r.ok, false);
  c.feedback({ ok: false, teile: [s.r] });
  assert.match(k.text(k.eins(c.el, 'p.zuordnung-anteil')), /^\d+ % der Textstellen richtig$/);
  ({ k, c } = baue(oeffentlich('W9-L3-02')));
  k.tippe(k.eins(c.el, 'li[data-g="S"] input.z-feld'), 'g');
  k.tippe(k.eins(c.el, 'li[data-g="M"] input.z-feld'), 'a');
  s = server('zuordnung', 'W9-L3-02', c.antwort());
  assert.deepEqual(s.r.buchstaben, { M: false, S: true });
  c.feedback({ ok: false, teile: [s.r] });
  assert.ok(k.eins(c.el, 'li[data-g="S"]').classList.contains('ok') && k.eins(c.el, 'li[data-g="M"]').classList.contains('falsch'));
  c.setze(s.b);
  assert.equal(k.eins(c.el, 'li[data-g="M"] input.z-feld').value, 'A');
});

test('schaubild-ergaenzen (W9-L6-05): Chips in der Liste, Auswahlpaare mit Schritt-Label, Antwort nur vollständig', () => {
  const { k, c } = baue(oeffentlich('W9-L6-05'));
  const art = k.eins(c.el, 'select.sb-art');
  assert.equal(art.getAttribute('aria-label'), 'Schritt 2: Schlüsselart');
  assert.deepEqual(k.alle(art, 'option').map((o) => o.value).filter(Boolean), ['oeffentlich', 'privat', 'sitzung']);
  const inh = k.eins(c.el, 'select.sb-inhaber');
  assert.deepEqual(k.alle(inh, 'option').map(k.text).filter((t) => t.startsWith('von')), ['von Alice', 'von Bob']);
  art.value = 'privat'; art.dispatchEvent(new k.window.Event('change'));
  assert.deepEqual(k.roh(c.antwort()), {}, 'nur Art gewählt → noch nicht vollständig');
  inh.value = 'A'; inh.dispatchEvent(new k.window.Event('change'));
  assert.deepEqual(k.roh(c.antwort()), { s1: { art: 'privat', inhaber: 'A' } });
  assert.equal(k.text(k.eins(c.el, 'details.sb-chip summary')), 'privater Schlüssel von Alice');
  c.feedback({ ok: false, teile: [{ ok: false, felder: { s1: true, s2: false } }] });
  assert.ok(k.alle(c.el, 'details.sb-chip')[1].classList.contains('falsch'));
});
test('schaubild-ergaenzen (W9-L6-06): Auswahl und Textfeld', () => {
  const { k, c } = baue(oeffentlich('W9-L6-06'));
  assert.equal(k.alle(k.eins(c.el, 'select.sb-auswahl'), 'option').length, 4);
  k.tippe(k.eins(c.el, 'input.sb-text'), 'Mallory');
  assert.equal(c.antwort().z2, 'Mallory');
});
test('bits-rechnen xor (W9-L6-01): Bit-Schaltflächen zyklisch, Tasten 0/1, Antwort mit _', () => {
  const { k, c } = baue(oeffentlich('W9-L6-01'));
  const bits = k.alle(c.el, '.bits-eingabe button.bit');
  assert.equal(bits.length, 8);
  assert.equal(bits[0].getAttribute('aria-label'), 'Bit 1 von 8, leer');
  k.klick(bits[0]); k.klick(bits[0]);
  assert.equal(bits[0].getAttribute('aria-label'), 'Bit 1 von 8, Wert 1');
  assert.equal(bits[0].getAttribute('aria-pressed'), 'true');
  k.taste(bits[1], '0');
  assert.equal(k.document.activeElement, bits[2]);
  assert.equal(c.antwort(), '10______');
  c.feedback({ ok: false, teile: [{ ok: false, bits: [false, true, false, false, false, false, false, false] }] });
  assert.ok(bits[0].classList.contains('falsch') && bits[1].classList.contains('ok'));
});
test('bits-rechnen ascii zu-bits (W9-L6-03), zu-text (W9-L6-04), lawine (W9-L3-04)', () => {
  let { k, c } = baue(oeffentlich('W9-L6-03'));
  assert.equal(k.alle(c.el, '.bits-eingabe button.bit').length, 8);
  ({ k, c } = baue(oeffentlich('W9-L6-04')));
  k.tippe(k.eins(c.el, 'input.bits-text'), 'A');
  assert.equal(c.antwort(), 'A');
  ({ k, c } = baue(oeffentlich('W9-L3-04')));
  const lw = k.alle(c.el, 'button.bit.lawine');
  assert.equal(lw.length, 16);
  [3, 5, 7, 13].forEach((i) => k.klick(lw[i]));
  assert.deepEqual(k.roh(c.antwort()), [3, 5, 7, 13]);
});

/* ---------- Ergänzend: Tastatur, Labels, Rundlauf (schaubild-ergaenzen, bits-rechnen) ---------- */

test('schaubild-ergaenzen Rundlauf und Lösung (W9-L6-05, W9-L6-06)', () => {
  let { k, c } = baue(oeffentlich('W9-L6-05'));
  assert.equal(c.leer(), true);
  assert.equal(server('schaubild', 'W9-L6-05', c.antwort()).leer, true);
  const wahl = (sel, i, v) => { const e = k.alle(c.el, sel)[i]; e.value = v; e.dispatchEvent(new k.window.Event('change')); };
  wahl('select.sb-art', 0, 'privat'); wahl('select.sb-inhaber', 0, 'A');
  wahl('select.sb-art', 1, 'oeffentlich'); wahl('select.sb-inhaber', 1, 'B');
  assert.equal(k.alle(c.el, 'select.sb-art')[1].getAttribute('aria-label'), 'Schritt 4: Schlüsselart');
  assert.equal(k.alle(c.el, 'select.sb-inhaber')[1].getAttribute('aria-label'), 'Schritt 4: Inhaber');
  let s = server('schaubild', 'W9-L6-05', c.antwort());
  assert.deepEqual(s.r.felder, { s1: true, s2: false });
  c.feedback({ ok: false, teile: [s.r] });
  const chips = k.alle(c.el, 'details.sb-chip');
  assert.ok(chips[0].classList.contains('ok') && chips[1].classList.contains('falsch'));
  assert.match(k.text(chips[1]), /✗/);
  c.setze(s.b);
  assert.deepEqual(k.roh(c.antwort()), { s1: { art: 'privat', inhaber: 'A' }, s2: { art: 'oeffentlich', inhaber: 'B' } });
  c.loesung(W.aufgaben.find((x) => x.id === 'W9-L6-05').loesung);
  c.sperren(true);
  assert.equal(k.text(k.alle(c.el, 'details.sb-chip summary')[1]), 'öffentlicher Schlüssel von Alice');
  assert.ok(k.alle(c.el, 'select').every((x) => x.disabled));
  ({ k, c } = baue(oeffentlich('W9-L6-06')));
  const aus = k.eins(c.el, 'select.sb-auswahl');
  assert.equal(aus.getAttribute('aria-label'), 'Schritt 1: Auswahl');
  aus.value = 'Zertifikat'; aus.dispatchEvent(new k.window.Event('change'));
  k.tippe(k.eins(c.el, 'input.sb-text'), 'mallory');
  s = server('schaubild', 'W9-L6-06', c.antwort());
  assert.equal(s.r.ok, true);
});
test('bits-rechnen Tastatur, Rundlauf, Lücken, kryptos16 (W9-L6-01, W9-L3-03, W9-L6-03/04, W9-L3-04)', () => {
  let { k, c } = baue(oeffentlich('W9-L6-01'));
  assert.deepEqual(k.alle(c.el, '.bits-label').map(k.text).slice(0, 3), ['M ("K")', 'K', 'C']);
  const bits = k.alle(c.el, '.bits-eingabe button.bit');
  assert.equal(c.leer(), true);
  '00100001'.split('').forEach((b, i) => k.taste(bits[i], b));
  assert.equal(k.document.activeElement, bits[7], 'am Ende bleibt der Fokus stehen');
  let s = server('bits', 'W9-L6-01', c.antwort());
  assert.equal(s.r.ok, true);
  k.taste(bits[7], 'ArrowLeft');
  assert.equal(k.document.activeElement, bits[6]);
  k.taste(bits[6], 'Backspace');
  assert.equal(bits[6].getAttribute('aria-label'), 'Bit 7 von 8, leer');
  // Lücke mitten in der Folge: der Server entfernt _ (Delta §5.2) – Rückmeldung nur bis zur ersten Lücke positionsgenau
  k.taste(bits[2], 'Delete');
  assert.equal(c.antwort(), '00_000_1');
  s = server('bits', 'W9-L6-01', c.antwort());
  c.feedback({ ok: false, teile: [s.r] });
  assert.ok(bits[0].classList.contains('ok') && bits[1].classList.contains('ok'));
  assert.ok(bits[2].classList.contains('falsch') && bits[6].classList.contains('falsch'), 'leere Stellen falsch');
  assert.ok(!bits[3].classList.contains('ok') && !bits[3].classList.contains('falsch'), 'nach einer Lücke keine Einzelrückmeldung');
  c.loesung({ bits: '00100001' });
  assert.equal(bits.map((b) => k.text(b)).join(''), '00100001');
  // kryptos16
  ({ k, c } = baue(oeffentlich('W9-L3-03')));
  assert.equal(k.alle(c.el, '.bits-eingabe button.bit').length, 16);
  assert.match(k.text(c.el), /Runden: 1, Richtung: ver/);
  assert.deepEqual(k.alle(c.el, '.bits-label').map(k.text).slice(0, 2), ['Block', 'Schlüssel K']);
  c.setze('1101 1000 0110 1110');
  assert.equal(server('bits', 'W9-L3-03', c.antwort()).r.ok, true);
  // ascii
  ({ k, c } = baue(oeffentlich('W9-L6-03')));
  c.setze('01001011');
  assert.equal(server('bits', 'W9-L6-03', c.antwort()).r.ok, true);
  ({ k, c } = baue(oeffentlich('W9-L6-04')));
  assert.equal(k.eins(c.el, 'input.bits-text').getAttribute('maxlength'), '1');
  k.tippe(k.eins(c.el, 'input.bits-text'), 'A');
  assert.equal(server('bits', 'W9-L6-04', c.antwort()).r.ok, true);
  // lawine
  ({ k, c } = baue(oeffentlich('W9-L3-04')));
  const lw = k.alle(c.el, 'button.bit.lawine');
  assert.equal(lw[3].getAttribute('aria-label'), 'Bit 4 von 16 (Position 3), unverändert');
  [13, 3, 7, 5].forEach((i) => k.klick(lw[i]));
  assert.equal(lw[3].getAttribute('aria-pressed'), 'true');
  assert.equal(server('bits', 'W9-L3-04', c.antwort()).r.ok, true);
  k.klick(lw[13]);
  assert.deepEqual(k.roh(c.antwort()), [3, 5, 7]);
  c.loesung({ positionen: [3, 5, 7, 13] });
  assert.equal(lw[13].getAttribute('aria-pressed'), 'true');
});
test('bits-rechnen lawine: nur das gekippte Bit des Blocks ist markiert', () => {
  const { k, c } = baue(oeffentlich('W9-L3-04'));
  const zeilen = k.alle(c.el, '.bits-zeile');
  assert.equal(k.alle(zeilen[0], '.bit.markiert').length, 1);
  assert.equal(k.alle(zeilen[1], '.bit.markiert').length, 0);
});
