'use strict';
// Gemeinsame Test-Helfer (node:test + supertest).
// Kryptos kennt keine lokale Anmeldung mehr: Konten, Kurse und Teilnahmen legen die Helfer direkt in der Datenbank an
// (wie es /sso/ende tun wird, TECHNIK §6.6) und geben Clients mit gültigen Sitzungs-Cookies kr_s/kr_l (TECHNIK §6.4).
// SSO-Helfer (TECHNIK §15): je Lauf ein Ed25519-Testschlüsselpaar des „Portals“, ssoToken()/sso() für /sso/ende,
// verbundToken() für die Verbund-API.

const path = require('node:path');
const crypto = require('node:crypto');
const request = require('supertest');
const S = require('../src/security');
const V = require('../src/validate');
const { createApp } = require('../src/app');
const { STANDARD_EINSTELLUNGEN } = require('../src/domain');
const { SCHUELER_MS, LEHRKRAFT_MS } = require('../src/verbund/sitzung');
const { signiere } = require('../src/jwt');

const SECRET = 'test-secret-0123456789abcdef-0123456789';
const HOST = 'lab.test';
const ORIGIN = 'http://' + HOST;
const FIXTURE = path.join(__dirname, 'fixtures', 'welt_beispiel.json');

/* ---------- Portal (Test) ---------- */
const PORTAL = 'https://portal.test';
const PLATTFORM = 'https://kryptos.test';
const PORTAL_SCHLUESSEL = crypto.generateKeyPairSync('ed25519');
const PORTAL_PEM = PORTAL_SCHLUESSEL.publicKey.export({ type: 'spki', format: 'pem' });

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
    portalUrl: PORTAL,
    plattformUrl: PLATTFORM,
    portalPublicKey: PORTAL_PEM,
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

/* ---------- SSO und Verbund (TECHNIK §15) ---------- */

let jtiZaehler = 0;
const neueJti = () => `jti-${process.pid}-${++jtiZaehler}-${crypto.randomBytes(8).toString('hex')}`;
/** Sekunden der App-Uhr (Tokens passen so auch zu uhr()). */
const appSek = (app) => Math.floor((app && app.locals.ctx ? app.locals.ctx.now() : Date.now()) / 1000);

/**
 * SSO-Token wie vom Portal (VERTRAG §5). felder überschreiben die Standardwerte (Schüler s:1042 in k:17);
 * o.key: anderer privater Schlüssel, o.app: Uhr der App für iat/exp.
 */
function ssoToken(felder = {}, { key = PORTAL_SCHLUESSEL.privateKey, app = null } = {}) {
  const iat = appSek(app);
  return signiere(
    {
      iss: PORTAL,
      aud: 'kryptos',
      sub: 's:1042',
      rolle: 'schueler',
      name: 'Lena S.',
      kurse: [{ id: 'k:17', name: 'LK Informatik 13', rolle: 'mitglied' }],
      iat,
      exp: iat + 90,
      jti: neueJti(),
      v: 1,
      ...felder
    },
    key
  );
}

/** Verbund-Token (VERTRAG §6): sub „portal“, zweck, 60 s. */
function verbundToken(zweck, extra = {}, { key = PORTAL_SCHLUESSEL.privateKey, app = null } = {}) {
  const iat = appSek(app);
  return signiere({ iss: PORTAL, aud: 'kryptos', sub: 'portal', zweck, iat, exp: iat + 60, jti: neueJti(), v: 1, ...extra }, key);
}

/** /sso/start aufrufen; liefert die Portal-URL der Weiterleitung (der Client hat danach das state-Cookie). */
async function ssoStart(c, ziel = '/') {
  const r = await c.get('/sso/start?ziel=' + encodeURIComponent(ziel));
  if (r.status !== 302) throw new Error(`/sso/start: ${r.status}`);
  return new URL(r.headers.location);
}

/** URL für /sso/ende mit Token und state (Parameter wie vom Portal). */
function endeUrl({ token, state, ziel = '/', fehler } = {}) {
  const q = new URLSearchParams();
  if (fehler !== undefined) q.set('fehler', fehler);
  if (token !== undefined) q.set('token', token);
  if (state !== undefined) q.set('state', state);
  if (ziel !== undefined && fehler === undefined) q.set('ziel', ziel);
  return '/sso/ende?' + q;
}

/**
 * Kompletter SSO-Ablauf /sso/start → Token → /sso/ende. Liefert den Client (Cookies gesetzt) mit
 * c.antwort (Antwort von /sso/ende), c.sub und – bei Schülern – c.id (aktive Teilnahme aus dem Cookie).
 * Mit o.client wird ein vorhandener Client weiterverwendet (z. B. geteiltes Tablet).
 */
async function sso(app, felder = {}, { ziel = '/', client: c = client(app) } = {}) {
  const u = await ssoStart(c, ziel);
  const token = ssoToken(felder, { app });
  const r = await c.get(endeUrl({ token, state: u.searchParams.get('state'), ziel: u.searchParams.get('ziel') }));
  c.antwort = r;
  c.sub = felder.sub || 's:1042';
  const roh = (r.headers['set-cookie'] || []).find((x) => x.startsWith(S.COOKIE_SCHUELER + '=') && !x.startsWith(S.COOKIE_SCHUELER + '=;'));
  if (roh) c.id = S.verify(decodeURIComponent(roh.split(';')[0].split('=')[1]), SECRET).t;
  return c;
}

/**
 * Kurs mit Daten in allen kurs- und personenbezogenen Tabellen füllen (Lernstand, Teams, Funkraum, Arena) – für
 * Löschtests (TECHNIK §7.3). teilnahmen: Teilnahme-ids (schueler.id); je Teilnahme ein eigenes Team (nr 1, 2, …),
 * mit o.gemeinsamesTeam alle im Team 1. Liefert { teams, szenario, arena, chiffren }.
 */
function befuelle(app, k, teilnahmen, { gemeinsamesTeam = false } = {}) {
  const db = app.locals.db;
  const t0 = jetzt();
  const id = (info) => Number(info.lastInsertRowid);
  db.prepare("INSERT OR IGNORE INTO katas (id, welt, kategorie, titel, aufgabe, loesung) VALUES ('test-kata', 9, 'modulo', 'Karte', 'Frage', 'Antwort')").run();
  db.prepare('INSERT INTO falsche_antworten (kurs_id, aufgabe_id, antwort, anzahl) VALUES (?, ?, ?, 1)').run(k.id, 'W9-L1-01', 'FALSCH' + k.id);
  const teams = [];
  const team = (nr) => {
    if (!teams[nr - 1]) teams[nr - 1] = id(db.prepare('INSERT INTO teams (kurs_id, nr, name) VALUES (?, ?, ?)').run(k.id, nr, `Team Skytale ${nr}`));
    return teams[nr - 1];
  };
  teilnahmen.forEach((sid, i) => {
    db.prepare("INSERT INTO fortschritt (schueler_id, aufgabe_id, status, punkte, geloest_at, updated_at) VALUES (?, 'W9-L1-01', 'geloest', 10, ?, ?)").run(sid, t0, t0);
    db.prepare("INSERT INTO fallen_zaehler (schueler_id, falle, anzahl) VALUES (?, 'P2', 1)").run(sid);
    db.prepare("INSERT INTO ide_erledigt (schueler_id, level_id, at) VALUES (?, 'W9-L1', ?)").run(sid, t0);
    db.prepare("INSERT INTO abzeichen (schueler_id, schluessel, at) VALUES (?, 'erste_schritte', ?)").run(sid, t0);
    db.prepare("INSERT INTO erfolge (kurs_id, schueler_id, text, at) VALUES (?, ?, '{name} hat das Abzeichen „Erste Schritte“ erhalten', ?)").run(k.id, sid, t0);
    db.prepare("INSERT INTO training (schueler_id, welt, generator, seed, daten, tag, created_at) VALUES (?, 9, 'g', 1, '{}', '2026-10-12', ?)").run(sid, t0);
    db.prepare("INSERT INTO boss_versuche (schueler_id, welt, aufgaben, start_at, deadline_at, ende_at, punkte, max_punkte) VALUES (?, 9, '[]', ?, ?, ?, 5, 10)").run(sid, t0, t0, t0);
    db.prepare("INSERT INTO leitner (schueler_id, kata_id, due_at) VALUES (?, 'test-kata', ?)").run(sid, t0);
    db.prepare("INSERT INTO funk_teilnahmen (schueler_id, typ, at) VALUES (?, 'botenlauf', ?)").run(sid, t0);
    db.prepare('INSERT INTO team_mitglieder (team_id, schueler_id) VALUES (?, ?)').run(team(gemeinsamesTeam ? 1 : i + 1), sid);
  });
  if (teams.length < 2) team(teams.length + 1); // zweites Team (ohne Mitglieder) als Gegenüber
  const ende = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
  const szenario = id(
    db.prepare("INSERT INTO funk_szenarien (kurs_id, typ, status, phase, konfig, endet_spaetestens, created_at, gestartet_at) VALUES (?, 'botenlauf', 'laeuft', 'senden', '{\"salz\":\"x\"}', ?, ?, ?)").run(k.id, ende, t0, t0)
  );
  teams.forEach((tid, i) => db.prepare("INSERT INTO funk_rollen (szenario_id, team_id, rolle, zustand) VALUES (?, ?, ?, '{\"schluessel\":7}')").run(szenario, tid, i === 0 ? 'alice' : 'bob'));
  teilnahmen.forEach((sid, i) => {
    const von = teams[gemeinsamesTeam ? 0 : i];
    const an = teams.find((x) => x !== von) || null;
    db.prepare("INSERT INTO funk_nachrichten (szenario_id, von_team_id, an_team_id, von_schueler_id, art, inhalt, klartext_hash, version, zeit) VALUES (?, ?, ?, ?, 'nachricht', 'GEHEIMTEXT', 'hash', 1, ?)").run(szenario, von, an, sid, t0);
  });
  db.prepare("INSERT INTO funk_ereignisse (szenario_id, code, version, zeit) VALUES (?, 'phase', 1, ?)").run(szenario, t0);
  const arena = id(db.prepare("INSERT INTO arena (kurs_id, status, salz, created_at) VALUES (?, 'angriff', 'salz', ?)").run(k.id, t0));
  const chiffren = teams.map((tid) =>
    id(
      db
        .prepare("INSERT INTO arena_chiffren (arena_id, team_id, verfahren, beschreibung, geheimtext, klartext_hash, klartext_laenge, beurteilung, eingereicht_at) VALUES (?, ?, '{}', 'Verfahren', 'ABCDE', 'h', 5, 'gut', ?)")
        .run(arena, tid, t0)
    )
  );
  teilnahmen.forEach((sid, i) => {
    const eigenes = teams[gemeinsamesTeam ? 0 : i];
    const ziel = chiffren[teams.findIndex((x) => x !== eigenes)];
    db.prepare("INSERT INTO arena_versuche (arena_id, chiffre_id, team_id, schueler_id, art, erfolg, zeit) VALUES (?, ?, ?, ?, 'klartext', 0, ?)").run(arena, ziel, eigenes, sid, t0);
  });
  return { teams, szenario, arena, chiffren };
}

/** Anzahl Zeilen einer Tabelle (optional mit WHERE-Bedingung). */
function zaehle(app, tabelle, where = '1', ...p) {
  return app.locals.db.prepare(`SELECT COUNT(*) AS n FROM ${tabelle} WHERE ${where}`).get(...p).n;
}

module.exports = {
  befuelle,
  zaehle,
  makeApp,
  ssoToken,
  verbundToken,
  ssoStart,
  endeUrl,
  sso,
  PORTAL,
  PLATTFORM,
  PORTAL_SCHLUESSEL,
  PORTAL_PEM,
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
