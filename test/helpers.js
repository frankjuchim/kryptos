'use strict';
// Gemeinsame Test-Helfer (node:test + supertest).
// Kryptos kennt keine lokale Anmeldung mehr: Konten, Kurse und Teilnahmen legen die Helfer direkt in der Datenbank an
// (wie es /sso/ende tun wird, TECHNIK §6.6) und geben Clients mit gültigen Sitzungs-Cookies kr_s/kr_l (TECHNIK §6.4).
// Die SSO-Helfer sso()/verbundToken() (TECHNIK §15) kommen mit Plan Task 5.

const path = require('node:path');
const request = require('supertest');
const S = require('../src/security');
const V = require('../src/validate');
const { createApp } = require('../src/app');
const { STANDARD_EINSTELLUNGEN } = require('../src/domain');
const { SCHUELER_MS, LEHRKRAFT_MS } = require('../src/verbund/sitzung');

const SECRET = 'test-secret-0123456789abcdef-0123456789';
const HOST = 'lab.test';
const ORIGIN = 'http://' + HOST;
const FIXTURE = path.join(__dirname, 'fixtures', 'welt_beispiel.json');

/** Steuerbare Uhr für Timer-Tests. */
function uhr(start = Date.parse('2026-10-08T08:00:00Z')) {
  let t = start;
  const f = () => t;
  f.vor = (ms) => {
    t += ms;
    return t;
  };
  f.setze = (x) => {
    t = x;
  };
  return f;
}

function makeApp(extra = {}) {
  const app = createApp({
    dbFile: ':memory:',
    sessionSecret: SECRET,
    seedDir: null,
    weltDateien: [FIXTURE],
    trustProxy: false,
    ...extra
  });
  app.locals.testZaehler = 0;
  return app;
}

/** supertest-Agent mit Cookie-Speicher und gleicher Herkunft (Origin = Host). */
function client(app) {
  const agent = request.agent(app);
  agent.set('Host', HOST).set('Origin', ORIGIN);
  agent.app = app;
  return agent;
}

const jetzt = () => new Date().toISOString();
const naechsteNr = (app) => 1000 + ++app.locals.testZaehler;

/** Konto anlegen (rolle schueler | lehrkraft | superadmin). Liefert die sub. */
function konto(app, rolle, name, sub) {
  const praefix = { schueler: 's', lehrkraft: 'l', superadmin: 'a' }[rolle];
  const s = sub || `${praefix}:${naechsteNr(app)}`;
  app.locals.db.prepare('INSERT INTO konten (sub, rolle, name, created_at) VALUES (?, ?, ?, ?)').run(s, rolle, name, jetzt());
  return s;
}

/** Kurs (vom Portal) anlegen. Liefert { id, kurs: 'k:<n>', name, boardSchluessel, einstellungen }. */
function kurs(app, name = 'LK Informatik 13', { einstellungen = STANDARD_EINSTELLUNGEN, aktiv = true } = {}) {
  const kursId = `k:${naechsteNr(app)}`;
  const boardSchluessel = S.zufallsText(9);
  const info = app.locals.db
    .prepare('INSERT INTO kurse (kurs_id, name, einstellungen, aktiv, board_schluessel, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(kursId, name, JSON.stringify(einstellungen), aktiv ? 1 : 0, boardSchluessel, jetzt(), jetzt());
  return { id: Number(info.lastInsertRowid), kurs: kursId, name, boardSchluessel, einstellungen: app.locals.services.kurse.einstellungen(JSON.stringify(einstellungen)) };
}

/** Teilnahme eines Schülerkontos an einem Kurs. Liefert die Teilnahme-id (schueler.id). */
function teilnahme(app, k, sub, name, { aktiv = true } = {}) {
  const { name: n, key } = V.schuelerName(name);
  const info = app.locals.db
    .prepare('INSERT INTO schueler (kurs_id, sub, name, name_key, aktiv, created_at, last_active_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(k.id, sub, n, key, aktiv ? 1 : 0, jetzt(), jetzt());
  return Number(info.lastInsertRowid);
}

/** Lehrkraft einem Kurs zuordnen (wie die Kursliste im SSO-Token). */
function zuordnen(app, k, sub, { aktiv = true } = {}) {
  app.locals.db.prepare('INSERT INTO kurs_lehrkraefte (kurs_id, sub, aktiv) VALUES (?, ?, ?) ON CONFLICT(kurs_id, sub) DO UPDATE SET aktiv = excluded.aktiv').run(k.id, sub, aktiv ? 1 : 0);
}

/** Cookie-Wert wie src/verbund/sitzung.js (S.sign mit exp). */
function cookieWert(payload, ms) {
  return S.sign({ ...payload, exp: Date.now() + ms }, SECRET);
}

/** Client mit gesetztem Sitzungs-Cookie (im Cookie-Speicher des Agents). */
function mitCookie(c, name, wert) {
  c.jar.setCookie(`${name}=${wert}; Path=/`, '127.0.0.1', '/');
  return c;
}

/** Sitzung als Schüler (sub) mit Teilnahme t – neuer Client, wenn keiner übergeben wird. */
function alsSchueler(app, sub, t, c = client(app)) {
  const g = app.locals.db.prepare('SELECT session_gen FROM konten WHERE sub = ?').get(sub).session_gen;
  return mitCookie(c, S.COOKIE_SCHUELER, cookieWert({ sub, g, t }, SCHUELER_MS));
}

function alsLehrkraft(app, sub, c = client(app)) {
  const g = app.locals.db.prepare('SELECT session_gen FROM konten WHERE sub = ?').get(sub).session_gen;
  return mitCookie(c, S.COOKIE_LEHRKRAFT, cookieWert({ sub, g }, LEHRKRAFT_MS));
}

/** Superadmin (Konto a:<n> aus dem Portal) mit Sitzung. */
async function adminClient(app, name = 'Admin') {
  const sub = konto(app, 'superadmin', name);
  const c = alsLehrkraft(app, sub);
  c.sub = sub;
  return c;
}

/** Lehrkraft (Konto l:<n>) mit Sitzung; optional gleich Kursen zugeordnet. */
async function lehrkraftClient(app, { name = 'Frau Lehrer', kurse = [] } = {}) {
  const sub = konto(app, 'lehrkraft', name);
  for (const k of kurse) zuordnen(app, k, sub);
  const c = alsLehrkraft(app, sub);
  c.sub = sub;
  return c;
}

/** Kurs anlegen und der Lehrkraft (Client aus lehrkraftClient) zuordnen. */
async function kursAnlegen(lk, name = 'LK Informatik 13', o) {
  const k = kurs(lk.app, name, o);
  zuordnen(lk.app, k, lk.sub);
  return k;
}

/** Neues Schülerkonto mit Teilnahme am Kurs und Sitzung. Client-Felder: sub, id (Teilnahme), name. */
async function schuelerClient(app, k, name = 'Lena S.') {
  const sub = konto(app, 'schueler', name);
  const t = teilnahme(app, k, sub, name);
  const c = alsSchueler(app, sub, t);
  c.sub = sub;
  c.id = t;
  c.name = name;
  return c;
}

/** Komplett: App + Superadmin + Lehrkraft + Kurs + Schüler. */
async function szenario(extra = {}) {
  const app = makeApp(extra);
  const admin = await adminClient(app);
  const lk = await lehrkraftClient(app);
  const k = await kursAnlegen(lk);
  const s = await schuelerClient(app, k);
  return { app, admin, lk, kurs: k, s };
}

module.exports = {
  makeApp,
  client,
  konto,
  kurs,
  teilnahme,
  zuordnen,
  alsSchueler,
  alsLehrkraft,
  adminClient,
  lehrkraftClient,
  kursAnlegen,
  schuelerClient,
  szenario,
  uhr,
  SECRET,
  HOST,
  ORIGIN,
  FIXTURE
};
