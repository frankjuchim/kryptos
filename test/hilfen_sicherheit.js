'use strict';
// Hilfen für das Routen-Inventar (Plan M9 Task 208, test/sicherheit.test.js): registrierte Routen aus dem Express-Stapel,
// eine Fixture mit allen Rollen (anonym, Schüler, Lehrkraft, Admin), Kurs mit Teams, Funkraum-Szenario und Arena, und
// konkrete Pfade für die Platzhalter der Routen.
const fs = require('node:fs');
const path = require('node:path');
const H = require('./helpers');
const F = require('./hilfen_funk');

const WURZEL = path.join(__dirname, '..');
const json = (rel) => JSON.parse(fs.readFileSync(path.join(WURZEL, rel), 'utf8'));
/** erste Demo-Aufgabe des Gastmodus (seed/gast/demo.json) und erste Lehrkraft-Datei, die keine Demo-Datei ist */
const GAST_AUFGABE = json('seed/gast/demo.json').aufgaben[0].id;
const DEMO_LK = new Set(json('seed/demo_materialien.json').lehrkraft);
const LK_DATEI = JSON.stringify(json('materialien/Lehrkraft_PDF/verzeichnis.json'))
  .match(/"pfad":"[^"]+"/g)
  .map((x) => JSON.parse(x.slice(7)))
  .find((p) => p.startsWith('Lehrkraft_PDF/') && !DEMO_LK.has(p));

// Einhängepunkte der Unter-Router (Express 5 speichert den Pfad nicht als Text, nur als Matcher)
const EINHAENGEPUNKTE = ['/sso', '/api/verbund', '/api', '/lehrer', '/admin'];

/** Alle registrierten Routen als „METHODE /pfad“ (rekursiv über app.router.stack, Unter-Router mit Einhängepunkt). */
function registrierteRouten(app) {
  const aus = [];
  const lauf = (stack, basis) => {
    for (const l of stack) {
      if (l.route) {
        for (const m of Object.keys(l.route.methods).filter((x) => l.route.methods[x] && x !== '_all')) aus.push(`${m.toUpperCase()} ${basis}${l.route.path}`);
      } else if (l.handle && Array.isArray(l.handle.stack)) {
        const mp = EINHAENGEPUNKTE.find((c) => {
          try {
            const r = l.matchers[0](c);
            return r && r.path === c;
          } catch {
            return false;
          }
        });
        if (!mp) throw new Error(`Unter-Router ohne bekannten Einhängepunkt (EINHAENGEPUNKTE ergänzen): ${l.name}`);
        lauf(l.handle.stack, basis + mp);
      }
    }
  };
  lauf(app.router.stack, '');
  return aus;
}

/**
 * Fixture: Kurs „LK 13 (eA)“ mit drei Teams, Lehrkraft Frau M., Admin, laufender Botenlauf, Arena in
 * der Werkstatt-Phase mit einer Chiffre. Liefert { app, f, sz, rolle(name) → frischer Client }.
 */
async function fixture() {
  const f = await F.arenaMitChiffren(3, { phase: 'werkstatt' });
  const sz = await F.starte(f, 'botenlauf');
  const admin = H.konto(f.app, 'superadmin', 'Admin');
  const s = f.teams[0].s[0];
  f.cidFest = f.cid(1); // Chiffre eines anderen Teams (vor allen schreibenden Anfragen ermittelt)
  const rolle = (name) => {
    if (name === 'anonym') return H.client(f.app);
    if (name === 'schueler') return H.alsSchueler(f.app, s.sub, s.id);
    if (name === 'lehrkraft') return H.alsLehrkraft(f.app, f.lk.sub);
    if (name === 'admin') return H.alsLehrkraft(f.app, admin);
    throw new Error(name);
  };
  return { app: f.app, f, sz, rolle };
}

/** Konkreter Pfad für eine Route der Tabelle (Platzhalter aus der Fixture). */
function konkret(pfad, { f, sz }) {
  const ersetze = {
    '/api/levels/:id': 'W9-L1',
    '/api/aufgaben/:id': 'W9-L1-01',
    '/api/archivfund/:welt': '9',
    '/api/training/aufgabe/:id': 'T-unbekannt',
    '/api/training/:welt': '9',
    '/api/boss/kampf/:id': '1',
    '/api/boss/:welt': '9',
    '/api/lehrer/vorschau/:id': 'W9-L1-01',
    '/api/funk/:id': String(sz.id),
    '/api/lehrer/funk/:id': String(sz.id),
    '/api/arena/:id': String(f.arenaId),
    '/api/lehrer/arena/:id': String(f.arenaId),
    '/api/gast/aufgaben/:id': GAST_AUFGABE,
    '/api/gast/vorschau/:id': 'W9-L1-01',
    '/api/verbund/kurse/:kursId': 'k:1'
  };
  let p = pfad;
  for (const [muster, wert] of Object.entries(ersetze)) {
    if (p.startsWith(muster)) p = p.replace(muster, muster.replace(/:[a-zA-Z]+$/, wert));
  }
  return p
    .replace(':kursId', String(f.kurs.id))
    .replace(':nid', '1')
    .replace(':teamId', String(f.teams[0].id))
    .replace(':cid', String(f.cidFest))
    .replace(':kataId', '1')
    .replace(':schluessel', 'unbekannt')
    .replace('/beamer/:art/:id', '/beamer/funkraum/1')
    .replace(':nr', '9.1')
    .replace('*datei', LK_DATEI);
}

/** Anfrage einer Rolle an eine Route (schreibend mit gültiger Origin und leerem JSON-Körper {}). */
async function anfrage(fx, rolle, methode, pfad) {
  const c = fx.rolle(rolle);
  const p = konkret(pfad, fx);
  const m = methode.toLowerCase();
  const r = m === 'get' ? c.get(p) : c[m](p).send({});
  return r;
}

module.exports = { registrierteRouten, fixture, konkret, anfrage, EINHAENGEPUNKTE, LK_DATEI, GAST_AUFGABE };
