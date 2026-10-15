'use strict';
// Rahmen „geführter Modus“ (Plan M11 Task 243, E203, E206, E207, E210, Review Focus 1 und 3): Schrittleiste, Einträge,
// Freigabe erst nach dem Lösen, kein Orakel, kein Ergebnis im DOM, Folgeschritte aus Einträgen, Erkenner-Umschaltung.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const D = require('./dom_attrappe');
const { BASIS } = require('./hilfen_labor');

/** DOM als Text: Elemente mit sortierten Attributen und Stil, Text; Einträge (.gefuehrt-eintrag) und Feldwerte ohne Inhalt */
function dom(el) {
  if (el.nodeType === 3) return el.textContent;
  if (el.nodeType !== 1) return '';
  const attr = el.getAttributeNames().sort().map((n) => `${n}=${JSON.stringify(el.getAttribute(n))}`).join(' ');
  const stil = el.style && el.style.cssText ? ` style=${JSON.stringify(el.style.cssText)}` : '';
  const innen = el.classList.contains('gefuehrt-eintrag') ? '«eintrag»' : el.childNodes.map(dom).join('');
  return `<${el.localName} ${attr}${stil}>${innen}</${el.localName}>`;
}
/** alle Texte und Attributwerte (auch aria-*, title, data-*) */
function alleTexte(el) {
  if (el.nodeType === 3) return [el.textContent];
  if (el.nodeType !== 1) return [];
  return [...el.getAttributeNames().map((n) => el.getAttribute(n)), ...el.childNodes.flatMap(alleTexte)];
}

/** Test-Hook: drei Schritte (Buchstaben), korrekt als Spion; Schritt 3 hängt vom Eintrag in Schritt 1 ab */
function testHook(k, protokoll) {
  return (container, werte) => {
    const zellen = ['A', 'B', 'C'].map((x) => {
      const td = k.document.createElement('span');
      td.className = 'zelle';
      td.textContent = x;
      container.appendChild(td);
      return td;
    });
    const anzeige = k.document.createElement('span');
    anzeige.className = 'gefuehrt-eintrag band';
    container.appendChild(anzeige);
    return {
      schritte: [
        { text: `Eingang ${werte.text[0]}`, feld: { beschriftung: 'Ausgang', art: 'buchstabe' } },
        { text: `Eingang ${werte.text[1]}`, feld: { beschriftung: 'Ausgang', art: 'buchstabe' } },
        { text: (e) => `Eingang aus Schritt 1`, feld: { beschriftung: 'Ausgang', art: 'buchstabe' } }
      ],
      markiere(i, eintraege) {
        protokoll.markiere.push([i, [...eintraege]]);
        zellen.forEach((z, j) => z.classList.toggle('markiert', j === i));
        anzeige.textContent = eintraege.join('');
      },
      korrekt() {
        protokoll.korrekt += 1;
        return ['X', 'Y', 'Z'];
      }
    };
  };
}

function starte(opt = {}) {
  const k = D.lade(BASIS);
  const ziel = k.document.createElement('div');
  k.document.getElementById('haupt').appendChild(ziel);
  const protokoll = { korrekt: 0, markiere: [] };
  const G = k.wert('KRGefuehrt');
  const inst = G.starte(ziel, testHook(k, protokoll), { werte: { text: 'QRS' }, umgebung: { rolle: 'schueler', ...(opt.umgebung || {}) }, aufgabe: opt.aufgabe === undefined ? 'W9-L1-01' : opt.aufgabe, beiEigeneWerte: opt.beiEigeneWerte });
  const feld = () => k.eins(ziel, 'input.gefuehrt-eintrag-feld');
  return { k, ziel, G, inst, protokoll, feld };
}

test('korrekt_erst_nach_freigabe', () => {
  const { k, ziel, G, protokoll, feld } = starte();
  for (let i = 0; i < 3; i++) {
    k.tippe(feld(), 'x');
    k.klick(k.eins(ziel, '.gefuehrt-weiter'));
  }
  assert.equal(protokoll.korrekt, 0, 'vor der Freigabe nie aufgerufen');
  assert.equal(k.alle(ziel, '.gefuehrt-schritt.gefuehrt-richtig, .gefuehrt-schritt.gefuehrt-falsch').length, 0);
  assert.equal(G.freigeben('W9-L1-01'), 1);
  assert.equal(protokoll.korrekt, 1);
  assert.match(k.text(k.eins(ziel, '.gefuehrt-fazit')), /Vergleich: 1 von 3/);
  assert.equal(k.alle(ziel, '.gefuehrt-schritt.gefuehrt-richtig').length, 1);
  assert.match(k.text(k.alle(ziel, '.gefuehrt-schritt')[1]), /✗ richtig wäre: Y/);
  G.freigeben('W9-L1-01');
  assert.equal(protokoll.korrekt, 1, 'genau einmal');
});

test('kein_orakel_vor_freigabe', () => {
  const { k, ziel, feld } = starte();
  const bilder = new Set();
  const ansagen = new Set();
  for (const b of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
    k.tippe(feld(), b);
    bilder.add(dom(ziel));
    ansagen.add(k.text(k.eins(ziel, '.gefuehrt-zaehler')));
  }
  assert.equal(bilder.size, 1, 'DOM bis auf den Eintrag gleich – keine Einfärbung, kein Häkchen');
  assert.equal(ansagen.size, 1, 'keine Ansage zum Eintrag');
  assert.equal(k.alle(ziel, '[role="alert"]').length, 0);
});

test('kein_ergebnis_im_dom', () => {
  const { k, ziel, feld } = starte();
  for (let i = 0; i < 3; i++) {
    k.tippe(feld(), 'q');
    k.klick(k.eins(ziel, '.gefuehrt-weiter'));
  }
  const texte = alleTexte(ziel).join(' | ');
  for (const r of ['X', 'Y', 'Z']) assert.ok(!new RegExp(`\\b${r}\\b`).test(texte), `richtiger Wert ${r} vor der Freigabe im DOM`);
});

test('folgeschritt_aus_eintrag', () => {
  const { k, ziel, protokoll, feld } = starte();
  k.tippe(feld(), 'm');
  k.klick(k.eins(ziel, '.gefuehrt-weiter'));
  k.klick(k.eins(ziel, '.gefuehrt-weiter'));
  const letzter = protokoll.markiere.at(-1);
  assert.equal(letzter[0], 2);
  assert.equal(letzter[1][0], 'M', 'Schritt 3 erhält den eigenen Eintrag aus Schritt 1, nicht den richtigen Wert');
  assert.equal(protokoll.korrekt, 0);
});

test('freies_labor_ohne_freigabe', () => {
  const { k, ziel, G, protokoll } = starte({ aufgabe: null });
  assert.match(k.text(k.eins(ziel, '.gefuehrt-hinweis')), /Mit eigenen Werten rechnet das Werkzeug frei/);
  assert.equal(G.freigeben('W9-L1-01'), 0);
  assert.equal(protokoll.korrekt, 0);
});

test('eigene_werte_verlassen_gefuehrt', () => {
  let gerufen = 0;
  const { k, ziel } = starte({ beiEigeneWerte: () => { gerufen += 1; } });
  k.klick(k.eins(ziel, 'button.gefuehrt-eigene'));
  assert.equal(gerufen, 1);
});

test('haeppchen_schalten_in_gefuehrt', () => {
  const k = D.lade(BASIS);
  const B = k.wert('KRLaborBau');
  const v = k.wert('KRErkenner').verlauf();
  const U = { rolle: 'schueler' };
  let gestartet = 0;
  const o = { gefuehrt: () => { gestartet += 1; } };
  // Scheibe: Viererfenster (Review-Fund 3) – drei Zeichen sind noch frei
  assert.equal(B.erkenne(null, 'scheibe.scheibe', { texte: ['IMO'], schluessel: ['k=12'] }, U, v, o), 'frei');
  // „Neue Nachricht“, dann TQ
  assert.equal(B.erkenne(null, 'scheibe.scheibe', { texte: ['TQ'], schluessel: ['k=12'] }, U, v, o), 'gefuehrt');
  assert.equal(gestartet, 1);
  // ohne geführten Modus: neutraler Hinweis
  const ort = k.document.createElement('div');
  assert.equal(B.erkenne(ort, 'scheibe.alle', { texte: ['IMOTQ'] }, U, null, {}), 'nicht-verfuegbar');
  assert.match(k.text(ort), /keinen Schritt-für-Schritt-Modus/);
  assert.equal(B.erkenne(ort, 'scheibe.alle', { texte: ['zinnober'] }, U, null, {}), 'frei');
  assert.equal(k.text(ort), '', 'Hinweis verschwindet bei eigenen Werten');
});

test('lehrkraft_frei', () => {
  const k = D.lade(BASIS);
  assert.equal(k.wert('KRLaborBau').erkenne(null, 'scheibe.text', { texte: ['IMOTQ'], schluessel: ['k=12'] }, { rolle: 'lehrkraft' }, null, { gefuehrt: () => {} }), 'frei');
});

test('tastatur_schritte', () => {
  const { k, ziel, feld, inst } = starte();
  feld().focus();
  k.taste(feld(), 'ArrowRight');
  assert.equal(inst.index(), 1);
  assert.equal(k.document.activeElement, feld(), 'Fokus bleibt im Eintragsfeld');
  k.taste(feld(), 'ArrowLeft');
  assert.equal(inst.index(), 0);
  k.taste(feld(), 'Enter');
  assert.equal(inst.index(), 1);
  const live = k.alle(ziel, '[aria-live]');
  assert.deepEqual(live.map((x) => x.className), ['gefuehrt-zaehler'], 'nur „Schritt i von n“ wird angesagt');
  assert.match(k.text(live[0]), /^Schritt 2 von 3: /);
});

test('vorschau_lehrkraft_sofort_freigegeben', () => {
  const { k, ziel, protokoll } = starte({ umgebung: { rolle: 'lehrkraft', modus: 'vorschau' } });
  assert.equal(protokoll.korrekt, 1);
  assert.match(k.text(ziel), /richtig wäre: X/);
});

test('freigabe_vorher_gesetzt', () => {
  const k = D.lade(BASIS);
  k.wert('KRGefuehrt').freigeben('W9-L1-02');
  const ziel = k.document.createElement('div');
  const p = { korrekt: 0, markiere: [] };
  k.wert('KRGefuehrt').starte(ziel, testHook(k, p), { werte: { text: 'QRS' }, umgebung: { rolle: 'schueler' }, aufgabe: 'W9-L1-02' });
  assert.equal(p.korrekt, 1, 'schon gelöste Aufgabe: Vergleich sofort');
});
