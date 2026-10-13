'use strict';
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const express = require('express');
const helmet = require('helmet');
const { openDatabase } = require('./db');
const { createServices } = require('./services');
const S = require('./security');
const { schuelerRoutes } = require('./routes/schueler');
const { lehrerRoutes } = require('./routes/lehrer');
const { adminRoutes } = require('./routes/admin');
const { gastRoutes } = require('./routes/gast');
const { createThemen } = require('./services/themen');
const { createLehrkraftMaterial, URL_LEHRKRAFT } = require('./services/lehrkraftMaterial');
const { createGast } = require('./services/gast');
const { createManifest } = require('./services/manifest');
const { createNiveauUebersicht } = require('./krypto/niveauUebersicht');
const { createLabor } = require('./krypto/labor');
const { createLevelMedien, createAktenNiveau } = require('./krypto/medien');
const { createTeams } = require('./krypto/teams');
const { createFunkraum } = require('./krypto/funkraum/dienst');
const { funkRouten } = require('./krypto/funkraum/routen');
const { ladeKonfig } = require('./verbund/konfig');
const { createSitzung } = require('./verbund/sitzung');
const { createSsoRouter } = require('./verbund/sso');
const { createVerbundRouter } = require('./verbund/verbund');
const { createWartung } = require('./wartung');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const ROOT_DIR = path.join(__dirname, '..');
const VERSION = require('../package.json').version;

/**
 * Express-App erzeugen.
 * @param {object} opts
 * @param {string} opts.dbFile            SQLite-Datei oder ':memory:'
 * @param {string} opts.sessionSecret     Geheimnis zum Signieren der Cookies
 * @param {object} [opts.konfig]          Verbund-Konfiguration aus ladeKonfig (Server); fehlt sie (Tests), wird sie im
 *                                         Testmodus aus opts.portalUrl, opts.portalPublicKey, opts.plattformUrl gebildet
 * @param {string|null} [opts.seedDir]    Ordner mit welten/*.json und kata/*.json
 * @param {string[]} [opts.weltDateien]   zusätzliche Welt-Dateien (Tests/Entwicklung)
 * @param {string|number|boolean} [opts.trustProxy]
 * @param {Function} [opts.log]
 * @param {Function} [opts.now]           Uhr (ms) – für Tests
 * @param {Function} [opts.random]        Zufall [0,1) für Boss-Ziehung – für Tests
 * @param {Function} [opts.trainingSeed]  Seed-Quelle für Generatoren – für Tests
 * @param {Function} [opts.zufallBytes]   (n) → Buffer mit n Zufallsbytes (Funkraum/Arena: Salze, Schlüsselblöcke,
 *                                         Auftragskarten) – für Tests fest (K41, Plan M7 E113); Standard crypto.randomBytes
 * @param {string|null} [opts.funkraumDatei] Seed-Datei des Wettknackens (Tests; Standard seed/funkraum/wettknacken.json, Plan M7 Task 138)
 * @param {object} [opts.optionen]        Dienst-Optionen (TECHNIK §4.2), überschreiben dienstOptionen() – für Tests
 * @param {string|null} [opts.arbeitsblaetterDir] Ordner mit den Akten-PDFs, ausgeliefert unter /akten/ (Kern-Name der Option
 *                                         bleibt, TECHNIK §16.2; Standard: ARBEITSBLAETTER_DIR, sonst ./akten im Image bzw.
 *                                         materialien/Akten_PDF im Repo)
 * @param {string|null} [opts.materialienDir] Ordner mit Lehrkraft_PDF/ und Loesungen_Portal/ (nur Lehrkräfte;
 *                                         Standard: MATERIALIEN_DIR, sonst ./materialien)
 */
function createApp(opts) {
  // Krypto-Erweiterungen in die Kern-Registries eintragen – vor Seed und Diensten (TECHNIK §4.1, idempotent)
  require('./krypto').registriere();
  const log = opts.log || (() => {});
  const db = openDatabase(opts.dbFile, { log });
  // Verbund-Konfiguration (TECHNIK §6.1): vom Server (ladeKonfig) oder – in Tests – aus opts (Testmodus, ohne Abbruch).
  const konfig =
    opts.konfig ||
    ladeKonfig(
      { PORTAL_URL: opts.portalUrl, PORTAL_PUBLIC_KEY: opts.portalPublicKey, PLATTFORM_URL: opts.plattformUrl, PLATTFORM_ID: opts.plattformId, SESSION_SECRET: opts.sessionSecret, VERTRAG_VERSION: opts.vertragVersion },
      { test: true }
    );
  const abDir = arbeitsblaetterOrdner(opts);
  const aktenVerzeichnis = ladeVerzeichnis(opts, log);
  const pdfVorhanden = (datei) => !!abDir && fs.existsSync(path.join(abDir, datei));
  // Dienst-Optionen (TECHNIK §4.2): Krypto-Hooks, in Tests durch opts.optionen überschreibbar;
  // K38: Akte und Video je Level (seed/akten.json, seed/videos.json) für das Level-Detail
  const levelMedien = createLevelMedien({ verzeichnis: aktenVerzeichnis, pdfVorhanden, videos: ladeVideos(opts, log) });
  // K40: Niveau je Akten-PDF (eA-/Kür-Akten nur für Kurse, die die Level sehen)
  const aktenNiveau = createAktenNiveau(aktenVerzeichnis);
  const optionen = { ...require('./krypto').dienstOptionen(), levelMedien, ...(opts.optionen || {}) };
  const ctx = { db, now: opts.now || (() => Date.now()), log, random: opts.random, trainingSeed: opts.trainingSeed, optionen };
  // K41 (Plan M7 E113): Server-Zufall für Funkraum/Arena nur über ctx.zufallBytes(n)
  ctx.zufallBytes = opts.zufallBytes || ((n) => crypto.randomBytes(n));
  const svc = createServices(ctx);
  ladeInhalte(svc, opts, log);
  // Ohne Anmeldung nur die Demo-PDFs aus seed/demo_materialien.json (Gastmodus, Themenseite)
  const demo = ladeDemo(opts, log);
  const themen = createThemen(ctx, { inhalte: svc.inhalte }, {
    verzeichnis: aktenVerzeichnis,
    pdfVorhanden,
    demo: (datei) => demo.schueler.has(datei)
  });
  const material = createLehrkraftMaterial({ materialienDir: materialienOrdner(opts), abDir, demo, log });
  const gast = createGast(ctx, { datei: gastDatei(opts), inhalte: svc.inhalte, material, log });
  const secret = opts.sessionSecret || konfig.sessionSecret;
  const sitzung = createSitzung({ db, secret });
  const manifest = createManifest({ inhalte: svc.inhalte, version: VERSION, konfig });
  const niveaus = createNiveauUebersicht({ inhalte: svc.inhalte });
  // Wartungsjob (TECHNIK §7.4): server.js startet ihn (wartung.starte()); Tests rufen wartung.lauf() direkt
  const wartung = createWartung({ db, svc, now: ctx.now, log });

  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', opts.trustProxy ?? 1);

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'default-src': ["'self'"],
          'script-src': ["'self'"],
          'style-src': ["'self'"],
          'img-src': ["'self'", 'data:'],
          'connect-src': ["'self'"],
          'font-src': ["'self'"],
          'object-src': ["'none'"],
          'base-uri': ["'self'"],
          'form-action': ["'self'"],
          'frame-ancestors': ["'none'"],
          'upgrade-insecure-requests': null
        }
      },
      crossOriginEmbedderPolicy: false,
      referrerPolicy: { policy: 'same-origin' }
    })
  );
  // Schul-Werkzeug: nichts indexieren (Beamer-Board ausdrücklich noindex)
  app.use((req, res, next) => {
    res.set('X-Robots-Tag', 'noindex, nofollow');
    next();
  });

  /* ---------- Sitzungen lesen (kr_s / kr_l, TECHNIK §6.4) ---------- */
  app.use((req, res, next) => {
    sitzung.lesen(req);
    next();
  });

  app.get('/healthz', (req, res) => {
    try {
      db.prepare('SELECT 1').get();
      res.json({ status: 'ok', version: VERSION });
    } catch {
      res.status(500).json({ status: 'error' });
    }
  });

  // Plattform-Manifest (Verbundvertrag, README Teil H) – öffentlich, auch für Browser des Portals lesbar
  app.get('/api/plattform', (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cache-Control', 'public, max-age=300');
    res.json(manifest(`${req.protocol}://${req.get('host')}`));
  });

  app.get('/robots.txt', (req, res) => res.type('text').send('User-agent: *\nDisallow: /\n'));

  /* ---------- SSO (VERTRAG §5, TECHNIK §6.2–§6.3) ---------- */
  app.use('/sso', createSsoRouter({ db, svc, konfig, sitzung, secret, now: ctx.now }));

  /* ---------- Verbund-API (VERTRAG §6, TECHNIK §6.7): vor dem API-Router, ohne Origin-Prüfung ---------- */
  // K41: Teams (Tischgruppen) und Funkraum-Dienst (Plan M7 Tasks 133, 134; Zufall nur über ctx.zufallBytes, E113)
  const teams = createTeams({ db, svc });
  const funkraum = createFunkraum({ db, svc, teams, now: ctx.now, zufallBytes: ctx.zufallBytes, log, quelle: opts.funkraumDatei || null });
  // K41 (Plan M7 E111): Kurs gesperrt beendet ein laufendes Funkraum-Szenario über den Funkraum-Dienst mit Auswertung
  // (typ-spezifisch; src/verbund/ bleibt krypto-frei)
  const szenarioBeenden = (dbx, szId, jetzt) => funkraum.beendeIntern(szId, jetzt);
  app.use('/api/verbund', createVerbundRouter({ db, svc, konfig, now: ctx.now, szenarioBeenden }));

  /* ---------- Helfer für die Routen ---------- */
  const helpers = {
    svc,
    now: ctx.now,
    konfig,
    sitzung,
    clearSchueler: sitzung.loescheSchueler,
    clearLehrkraft: sitzung.loescheLehrkraft,
    schueler: sitzung.schueler,
    lehrkraft: sitzung.lehrkraft,
    gesperrt: sitzung.gesperrt,
    material,
    gast,
    wartung,
    reload: () => ladeInhalte(svc, opts, log)
  };

  /* ---------- Seiten ---------- */
  const page = (file) => (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.sendFile(path.join(PUBLIC_DIR, file));
  };
  // Seiten-Wächter (TECHNIK §6.4): ohne passende Sitzung still 302 /sso/start?ziel=<Pfad>. Schüler: /spiel, /funkraum,
  // /werkstatt; Lehrkraft: /lehrer, /lehrer/urkunden, /beamer/funkraum/:id, /beamer/arena/:id; beide Rollen: /labor.
  // Öffentlich: /, /gast, /themen, /datenschutz, /board/:schluessel, /healthz, /api/plattform, /akten/* (eigene Prüfung: Demo-PDFs offen, sonst Anmeldung), /static/*,
  // /robots.txt.
  const waechterSchueler = sitzung.waechter('schueler');
  const waechterLehrkraft = sitzung.waechter('lehrkraft');
  const waechterBeide = sitzung.waechter('beide');
  app.get('/', page('index.html'));
  app.get('/spiel', waechterSchueler, page('spiel.html'));
  app.get('/lehrer', waechterLehrkraft, page('lehrer.html'));
  app.get('/lehrer/urkunden', waechterLehrkraft, page('urkunden.html'));
  app.get('/labor', waechterBeide, page('labor.html'));
  app.get('/funkraum', waechterSchueler, page('funkraum.html'));
  app.get('/werkstatt', waechterSchueler, page('werkstatt.html'));
  // Beamer (Funkraum/Knack-Arena, Inhalte M7): :id nur Ziffern, sonst weiter zur 404-Seite
  app.get('/beamer/:art/:id', (req, res, next) => (['funkraum', 'arena'].includes(req.params.art) && /^\d{1,9}$/.test(req.params.id) ? next() : next('route')), waechterLehrkraft, page('beamer.html'));
  app.get('/admin', (req, res) => res.redirect('/lehrer#/admin'));
  app.get('/board/:schluessel', page('board.html'));
  app.get('/datenschutz', page('datenschutz.html'));
  app.get('/themen', page('themen.html'));
  app.get('/gast', page('gast.html'));
  // QR-Codes der Akten (Plan M5 E50, K13): /level/<nr> (z. B. 0.1, K1) → Level-Seite. Schüler direkt, Lehrkraft in die
  // Vorschau der Welt, ohne Sitzung über den SSO-Start mit ziel=/spiel#/level/<id> (der Hash erreicht den Seiten-Wächter
  // von /spiel nicht, TECHNIK §6.2/§6.4). Unbekannte Nummer → 404-Seite.
  app.get('/level/:nr', (req, res, next) => {
    const nr = String(req.params.nr);
    if (!/^(\d\.\d|K\d)$/.test(nr)) return next();
    const treffer = [...svc.inhalte.katalog.levels.values()].filter((l) => l.nr === nr).sort((a, b) => (a.welt <= 6 ? 0 : 1) - (b.welt <= 6 ? 0 : 1) || a.welt - b.welt);
    const l = treffer[0];
    if (!l) return next();
    res.set('Cache-Control', 'no-store');
    if (helpers.schueler(req, res)) return res.redirect(302, `/spiel#/level/${encodeURIComponent(l.id)}`);
    if (helpers.lehrkraft(req)) return res.redirect(302, `/lehrer#/vorschau/welt/${l.welt}`);
    res.redirect(302, '/sso/start?ziel=' + encodeURIComponent(`/spiel#/level/${l.id}`));
  });
  app.use('/static', express.static(path.join(PUBLIC_DIR, 'static'), { maxAge: '1h', index: false }));
  // Akten (Schülerfassung, PDF; Kryptos K15: /akten statt /arbeitsblaetter) – nur .pdf, ohne Verzeichnislisten
  if (abDir) {
    app.use('/akten', (req, res, next) => {
      if (!req.path.toLowerCase().endsWith('.pdf')) return res.status(404).end();
      let rel;
      try {
        rel = decodeURIComponent(req.path.replace(/^\//, ''));
      } catch {
        return res.status(404).end();
      }
      // nur vorhandene Dateien im Ordner (Pfad-Tricks und Fehlendes: 404, ohne die Anmeldung zu verraten)
      const abs = path.resolve(abDir, rel);
      if (!abs.startsWith(path.resolve(abDir) + path.sep) || !fs.existsSync(abs)) return res.status(404).end();
      // Demo-PDFs öffentlich; alles andere nur für angemeldete Schüler und Lehrkräfte
      if (demo.schueler.has(rel)) {
        res.set('Cache-Control', 'public, max-age=3600');
        return next();
      }
      const schueler = helpers.schueler(req);
      if (!schueler && !helpers.lehrkraft(req)) return nurMitAnmeldung(res);
      // K40: Schüler nur Akten, deren Niveau im Kurs sichtbar ist (eA nicht im gA-Kurs, Kür nicht bei gesperrter Kür)
      const niveau = aktenNiveau(rel);
      if (schueler && !helpers.lehrkraft(req) && niveau && !optionen.sichtbar({ niveau }, svc.lernen.einstellungenVon(schueler))) return res.status(404).end();
      res.set('Cache-Control', 'private, max-age=3600');
      next();
    });
    app.use('/akten', express.static(abDir, { index: false, dotfiles: 'deny', cacheControl: false }));
  }

  /* ---------- API ---------- */
  const api = express.Router();
  api.use(S.sameOriginCheck);
  api.use(express.json({ limit: '30mb' }));
  api.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  // Sitzung: GET /api/sitzung, Kurswahl, Abmelden (TECHNIK §6.4, §13.1)
  sitzung.routen(api, { svc, konfig, version: VERSION });

  /* Öffentliche Themenübersicht (ohne Lösungen) */
  api.get('/themen', (req, res) => res.json(themen.uebersicht()));

  /* Öffentliche Niveau-Übersicht gA/eA (VERTRAG v1.2 §9, Manifest urls.niveaus): nur Titel, Niveaus, Anzahlen */
  api.get('/niveaus', (req, res) => res.json(niveaus.uebersicht()));

  /* Öffentliches Beamer-Board mit Board-Schlüssel (nur wenn im Kurs aktiviert) */
  api.get('/board/:schluessel', (req, res) => {
    const b = svc.auswertung.board(req.params.schluessel);
    if (!b) return res.status(404).json({ error: 'Kein Board für diesen Schlüssel (oder im Kurs nicht aktiviert).' });
    res.json(b);
  });

  /* Lehrkraft-Downloads (Lösungen u. a.): nur angemeldete Lehrkräfte, nur verzeichnete Dateien – sonst 404 */
  app.get(URL_LEHRKRAFT.replace(/\/$/, '') + '/*datei', (req, res) => {
    const l = helpers.lehrkraft(req);
    const rel = [].concat(req.params.datei).join('/');
    // Lehrkraft-Dateien nur angemeldet – außer den wenigen Demo-Dateien des Gastmodus
    const abs = l || demo.lehrkraft.has(rel) ? material.datei(rel) : null;
    res.set('Cache-Control', 'private, no-store');
    if (!abs) return res.status(404).type('text').send('Nicht gefunden.');
    res.sendFile(abs);
  });

  schuelerRoutes(api, helpers);
  // Kryptolabor: Freigaben je Schüler (TECHNIK §10.3, M4 E19)
  createLabor({ db, svc, now: ctx.now }).routen(api, helpers);
  lehrerRoutes(api, helpers);
  // K41: Teams (Tischgruppen) je Kurs – GET/PUT /api/lehrer/kurse/:kursId/teams (Plan M7 Task 133)
  teams.routen(api, helpers);
  // K41: Funkraum – Regie-Routen (Plan M7 Task 134)
  funkRouten(funkraum)(api, helpers);
  adminRoutes(api, helpers);
  gastRoutes(api, helpers);

  api.use((req, res) => res.status(404).json({ error: 'Unbekannte API-Route.' }));
  app.use('/api', api);

  app.use((req, res) => res.status(404).sendFile(path.join(PUBLIC_DIR, '404.html')));

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err && err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Ungültiges JSON.' });
    if (err && err.type === 'entity.too.large') return res.status(413).json({ error: 'Datei zu groß.' });
    const status = err && Number.isInteger(err.status) ? err.status : 500;
    // SSO: nie URL oder Token loggen – nur die Meldung (TECHNIK §6.3)
    if (status >= 500) log(req.path.startsWith('/sso/') ? `SSO-Fehler: ${err && err.message ? err.message : 'unbekannt'}` : err && err.stack ? err.stack : String(err));
    const body = { error: status >= 500 ? 'Interner Fehler.' : err.message };
    if (err && err.details) body.details = err.details;
    if (err && err.extra) Object.assign(body, err.extra);
    if (req.path.startsWith('/api/')) return res.status(status).json(body);
    res.status(status).type('text').send(body.error);
  });

  app.locals.db = db;
  app.locals.konfig = konfig;
  app.locals.services = svc;
  app.locals.wartung = wartung;
  app.locals.ctx = ctx;
  app.locals.teams = teams;
  app.locals.funkraum = funkraum;
  return app;
}

/** Hinweisseite für Akten-PDFs, die nur nach Anmeldung abrufbar sind (401) – im Designsystem (K20, M4 E36). */
function nurMitAnmeldung(res) {
  const css = ['schriften', 'tokens', 'epochen', 'basis', 'komponenten'].map((n) => `<link rel="stylesheet" href="/static/css/${n}.css?v=${VERSION}">`).join('');
  res
    .status(401)
    .type('html')
    .send(
      '<!doctype html><html lang="de" data-theme="auto" data-epoche="6"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
        '<meta name="robots" content="noindex, nofollow"><meta name="color-scheme" content="light dark">' +
        `<title>Nur nach Anmeldung · Kryptos</title><link rel="icon" href="/static/favicon.svg" type="image/svg+xml">${css}</head>` +
        '<body class="seite-fehler"><main id="haupt"><div class="wrap fehlerseite"><section class="karte stapel"><h1>Nur nach Anmeldung</h1>' +
        '<p>Die Akten, Papier-Bosse und Warm-up-Karten stehen nach der Anmeldung über das Portal InfoLabs bereit (Schülerinnen, Schüler und Lehrkräfte). Ohne Anmeldung zeigt der Gastmodus einige Beispiele.</p>' +
        '<p class="knopf-reihe"><a class="knopf knopf-primaer" href="/sso/start">Anmelden über InfoLabs</a> <a class="knopf knopf-zweit" href="/gast">Gastmodus</a> <a class="knopf knopf-zweit" href="/themen">Themen</a></p>' +
        '</section></div></main></body></html>'
    );
}

/** seedDir/demo_materialien.json: PDFs, die ohne Anmeldung abrufbar sind (sonst keine). */
function ladeDemo(opts, log) {
  const seedDir = opts.seedDir === undefined ? path.join(ROOT_DIR, 'seed') : opts.seedDir;
  const kandidaten = [seedDir && path.join(seedDir, 'demo_materialien.json'), path.join(ROOT_DIR, 'seed', 'demo_materialien.json')];
  const datei = kandidaten.find((d) => d && fs.existsSync(d));
  const leer = { schueler: new Set(), lehrkraft: new Set() };
  if (!datei) return leer;
  try {
    const d = JSON.parse(fs.readFileSync(datei, 'utf8'));
    const ok = (x) => typeof x === 'string' && x.toLowerCase().endsWith('.pdf') && !x.includes('..') && !/loesung|erwartungshorizont|(_lsg|_eh)(\.|_)|klausur/i.test(x);
    return { schueler: new Set((d.schueler || []).filter(ok)), lehrkraft: new Set((d.lehrkraft || []).filter(ok)) };
  } catch (e) {
    log(`demo_materialien.json nicht lesbar: ${e.message}`);
    return leer;
  }
}

function arbeitsblaetterOrdner(opts) {
  if (opts.arbeitsblaetterDir !== undefined) return opts.arbeitsblaetterDir;
  // Kryptos: Akten unter /app/akten (Image) bzw. materialien/Akten_PDF (Repo), TECHNIK §16.2; Kern-Pfade bleiben als Rückfall.
  const kandidaten = [
    process.env.ARBEITSBLAETTER_DIR,
    path.join(ROOT_DIR, 'akten'),
    path.join(ROOT_DIR, 'materialien', 'Akten_PDF'),
    path.join(ROOT_DIR, 'arbeitsblaetter'),
    path.join(ROOT_DIR, 'materialien', 'Arbeitsblaetter_PDF')
  ];
  return kandidaten.find((d) => d && fs.existsSync(d)) || null;
}

/** Demo-Aufgaben des Gastmodus: seedDir/gast/demo.json (opts.gastDatei überschreibt; null = kein Schüler-Gastmodus). */
function gastDatei(opts) {
  if (opts.gastDatei !== undefined) return opts.gastDatei;
  const seedDir = opts.seedDir === undefined ? path.join(ROOT_DIR, 'seed') : opts.seedDir;
  const repo = path.join(ROOT_DIR, 'seed', 'gast', 'demo.json');
  return (seedDir && fs.existsSync(path.join(seedDir, 'gast', 'demo.json')) && path.join(seedDir, 'gast', 'demo.json')) || (fs.existsSync(repo) ? repo : null);
}

function materialienOrdner(opts) {
  if (opts.materialienDir !== undefined) return opts.materialienDir;
  const kandidaten = [process.env.MATERIALIEN_DIR, path.join(ROOT_DIR, 'materialien')];
  return kandidaten.find((d) => d && fs.existsSync(d)) || null;
}

/** seedDir/akten.json (Verzeichnis der Akten, TECHNIK §14.2; Kryptos K15 statt arbeitsblaetter.json); fehlt sie, zeigt /themen nur die Level. */
function ladeVerzeichnis(opts, log) {
  const seedDir = opts.seedDir === undefined ? path.join(ROOT_DIR, 'seed') : opts.seedDir;
  const datei = seedDir && path.join(seedDir, 'akten.json');
  if (!datei || !fs.existsSync(datei)) return null;
  try {
    return JSON.parse(fs.readFileSync(datei, 'utf8'));
  } catch (e) {
    log(`akten.json nicht lesbar: ${e.message}`);
    return null;
  }
}

/** seedDir/videos.json (sonst seed/videos.json des Repos): Liste der Erklärvideos { nr, titel, url } oder null. */
function ladeVideos(opts, log) {
  const seedDir = opts.seedDir === undefined ? path.join(ROOT_DIR, 'seed') : opts.seedDir;
  const datei = [seedDir && path.join(seedDir, 'videos.json'), path.join(ROOT_DIR, 'seed', 'videos.json')].find((d) => d && fs.existsSync(d));
  if (!datei) return null;
  try {
    const d = JSON.parse(fs.readFileSync(datei, 'utf8'));
    return Array.isArray(d && d.videos) ? d.videos : null;
  } catch (e) {
    log(`videos.json nicht lesbar: ${e.message}`);
    return null;
  }
}

/** Seed: seedDir/welten/*.json (+ opts.weltDateien) und seedDir/kata/*.json. Fehler werden nur protokolliert. */
function ladeInhalte(svc, opts, log) {
  const lies = (dir) => {
    if (!dir || !fs.existsSync(dir)) return [];
    return fs
      .readdirSync(dir)
      .filter((f) => f.toLowerCase().endsWith('.json'))
      .sort()
      .map((f) => path.join(dir, f));
  };
  const quellen = (dateien) => {
    const out = [];
    for (const f of dateien) {
      try {
        out.push({ name: path.basename(f), text: fs.readFileSync(f, 'utf8') });
      } catch (e) {
        log(`Seed ${f} nicht lesbar: ${e.message}`);
      }
    }
    return out;
  };
  const seedDir = opts.seedDir === undefined ? path.join(__dirname, '..', 'seed') : opts.seedDir;
  const welten = [...lies(seedDir && path.join(seedDir, 'welten')), ...(opts.weltDateien || [])];
  let ergebnis = [];
  try {
    ergebnis = svc.inhalte.seedWelten(quellen(welten));
  } catch (e) {
    log(`Welt-Seed fehlgeschlagen: ${e.stack || e.message}`);
    svc.inhalte.lade();
  }
  for (const r of ergebnis) {
    if (r.status === 'übersprungen') log(`Welt-Seed ${r.datei}: ÜBERSPRUNGEN – ${r.fehler.slice(0, 5).join(' · ')}`);
    else if (r.status === 'geladen') log(`Welt-Seed ${r.datei}: ${r.aufgaben} Aufgaben geladen${r.ausgelassen ? `, ${r.ausgelassen} fehlerhafte ausgelassen` : ''}${r.fehler.length ? ` (${r.fehler.length} Fehler, z. B. ${r.fehler[0]})` : ''}.`);
  }
  const kata = svc.kata.seed(quellen(lies(seedDir && path.join(seedDir, 'warmup'))));
  for (const r of kata) {
    if (r.fehler) log(`Warm-up-Seed ${r.datei} fehlgeschlagen: ${r.fehler}`);
    else if (!r.uebersprungen) log(`Warm-up-Seed ${r.datei}: ${r.neu} neu, ${r.aktualisiert} aktualisiert.`);
  }
  return { welten: ergebnis, kata };
}

module.exports = { createApp, ladeInhalte, VERSION };
