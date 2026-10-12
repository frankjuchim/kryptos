'use strict';
// Review M3 W1: Knack-Aufgaben verraten den Schlüssel nicht (Delta §8.1 schluesselVerdeckt). Verdeckt → an Clients nur
// verfahren.typ (Lab, Boss-Kampf, Gast, Training); die Lehrkraft-Vorschau zeigt alles; nach dem Lösen/Aufdecken darf
// die Lösung den Schlüssel nennen. Validator: Hilfszeile schluessel bei verdecktem Schlüssel = Fehler; Hinweis, wenn eine
// Knack-Formulierung nicht verdeckt ist.
require('../src/krypto').registriere();
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const H = require('./helpers');
const { validiereWelt } = require('../src/content/validator');
const W = require('./fixtures/welt_beispiel.json');

const kopie = () => JSON.parse(JSON.stringify(W));
const A = (d, id) => d.aufgaben.find((a) => a.id === id);
const schreibe = (d, name = 'welt9.json') => {
  const datei = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'kryptos-verdeckt-')), name);
  fs.writeFileSync(datei, JSON.stringify(d));
  return datei;
};
/** Enthält ein Objekt einen Verfahrens-Parameter außer typ/name? */
const parameter = (v) => Object.keys(v || {}).filter((k) => !['typ', 'name'].includes(k));

test('Kryptoanalyse-Level: Schlüssel automatisch verdeckt (Lab), Vorschau der Lehrkraft vollständig, Lösung nach dem Aufdecken', async () => {
  const { s, lk } = await H.szenario();
  const a = (await s.get('/api/aufgaben/W9-L2-10').expect(200)).body.aufgabe;
  assert.deepEqual(a.interaktion.verfahren, { typ: 'caesar' });
  assert.equal(a.interaktion.schluesselVerdeckt, true);
  assert.ok(!/"k":10/.test(JSON.stringify(a)), 'k nicht in der Ausgabe');
  const lv = (await s.get('/api/levels/W9-L2').expect(200)).body;
  assert.ok(!/"k":10/.test(JSON.stringify(lv)));
  // Kryptografie-Level: Schlüssel bleibt sichtbar (er ist Teil der Aufgabe)
  assert.deepEqual((await s.get('/api/aufgaben/W9-L5-01').expect(200)).body.aufgabe.interaktion.verfahren, { typ: 'caesar', k: 3 });
  // Vorschau der Lehrkraft: alles
  assert.deepEqual((await lk.get('/api/lehrer/vorschau/W9-L2-10').expect(200)).body.aufgabe.interaktion.verfahren, { typ: 'caesar', k: 10 });
  // Prüfen funktioniert weiter (serverseitig mit vollem Verfahren), Aufdecken liefert die Lösung
  assert.equal((await s.post('/api/aufgaben/W9-L2-10/pruefen').send({ antwort: 'wolkenziehenauf' }).expect(200)).body.ok, true);
});

test('Boss-Kampf und Training: verdeckte Aufgabe (schluesselVerdeckt: true) ohne Parameter, Auswertung mit Lösung', async () => {
  const d = kopie();
  A(d, 'W9-B-05').schluesselVerdeckt = true;
  const uhr = H.uhr();
  const { app, s, lk, kurs } = await H.szenario({ now: uhr, weltDateien: [schreibe(d)] });
  await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { boss: 'offen', niveau: 'gA' } });
  const k = (await s.post('/api/boss/9/start').send({}).expect(201)).body;
  const b5 = k.aufgaben.find((a) => a.id === 'W9-B-05');
  assert.ok(b5, 'W9-B-05 gezogen');
  assert.deepEqual(parameter(b5.interaktion.verfahren), []);
  assert.ok(!JSON.stringify((await s.get(`/api/boss/kampf/${k.id}`)).body).includes('"EIS"'));
  const e = (await s.post(`/api/boss/kampf/${k.id}/beenden`).send({})).body;
  assert.ok(e.aufgaben.find((a) => a.id === 'W9-B-05').loesung, 'Auswertung mit Lösung');
  // Training: Generator-Aufgaben mit schluesselVerdeckt werden ebenso gefiltert
  const inhalte = app.locals.services.inhalte;
  const o = inhalte.oeffentlich({ id: 'T1', interaktion: { kind: 'chiffre', richtung: 'ent', verfahren: { typ: 'vigenere', schluessel: 'LUNA' }, eingabe: 'X' }, schluesselVerdeckt: true });
  assert.deepEqual(o.interaktion.verfahren, { typ: 'vigenere' });
});

test('Gastmodus: Demo-Level mit rolle kryptoanalyse verdeckt den Schlüssel einer chiffre-Aufgabe', async () => {
  const quelle = path.join(__dirname, 'fixtures', 'seed_beispiel');
  const ziel = fs.mkdtempSync(path.join(os.tmpdir(), 'kryptos-gast-'));
  fs.cpSync(quelle, ziel, { recursive: true });
  const demoDatei = path.join(ziel, 'gast', 'demo.json');
  const demo = JSON.parse(fs.readFileSync(demoDatei, 'utf8'));
  const i = demo.aufgaben.findIndex((a) => a.id === 'W8-L1-06');
  demo.aufgaben[i] = { id: 'W8-L1-06', titel: 'Scheibe', stufe: 1, kategorie: 'entschluesseln', inhalt: [{ t: 'text', md: 'Entschlüssele.' }], interaktion: { kind: 'chiffre', richtung: 'ent', verfahren: { typ: 'caesar', k: 4 }, eingabe: 'LEPPS' }, loesung: { text: 'hallo' }, erklaerung: [{ t: 'text', md: 'k = 4.' }] };
  fs.writeFileSync(demoDatei, JSON.stringify(demo));
  const app = H.makeApp({ seedDir: ziel, weltDateien: [H.FIXTURE] });
  const c = H.client(app);
  const d = (await c.get('/api/gast/aufgaben/W8-L1-06').expect(200)).body;
  assert.deepEqual(d.aufgabe.interaktion.verfahren, { typ: 'caesar' });
  assert.equal((await c.post('/api/gast/aufgaben/W8-L1-06/pruefen').send({ antwort: 'hallo' }).expect(200)).body.ok, true);
});

test('Validator: schluesselVerdeckt boolean; Hilfszeile schluessel bei verdecktem Schlüssel = Fehler; Knack-Text ohne Verdecken = Hinweis', () => {
  const meld = (d) => {
    const v = validiereWelt(d, { datei: 't' });
    return { f: v.fehler.map((x) => `${x.ort}: ${x.meldung}`).join('\n'), w: v.warnungen.map((x) => `${x.ort}: ${x.meldung}`).join('\n') };
  };
  assert.equal(meld(kopie()).f, '', 'Fixture fehlerfrei');
  let d = kopie();
  A(d, 'W9-L5-02').schluesselVerdeckt = 'ja';
  assert.match(meld(d).f, /W9-L5-02.*schluesselVerdeckt muss true oder false sein/);
  d = kopie();
  A(d, 'W9-L5-02').interaktion.schluesselVerdeckt = true; // vigenere mit hilfszeilen schluessel
  assert.match(meld(d).f, /W9-L5-02.*hilfszeilen: schluessel verrät den verdeckten Schlüssel/);
  // automatisch verdeckt im Kryptoanalyse-Level: Vigenère mit Hilfszeile schluessel → Fehler, mit false erlaubt
  d = kopie();
  const vig = { ...JSON.parse(JSON.stringify(A(d, 'W9-L5-02'))), id: 'W9-L2-11' };
  d.aufgaben.push(vig);
  d.levels.find((l) => l.id === 'W9-L2').aufgaben.push('W9-L2-11');
  assert.match(meld(d).f, /W9-L2-11.*hilfszeilen: schluessel verrät den verdeckten Schlüssel/);
  vig.schluesselVerdeckt = false;
  assert.doesNotMatch(meld(d).f, /W9-L2-11/);
  // Knack-Formulierung (bestimme … Schlüssel) in einer Kategorie entschluesseln, nicht verdeckt → Hinweis
  d = kopie();
  A(d, 'W9-L5-01').inhalt[0].md = 'Nummerierung: A = 1 … Z = 26. Bestimme den Schlüssel und entschlüssele.';
  assert.match(meld(d).w, /W9-L5-01.*Knack-Aufgabe\? Der Schlüssel ist nicht verdeckt/);
  assert.doesNotMatch(meld(kopie()).w, /Knack-Aufgabe/);
});
