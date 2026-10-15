'use strict';
// Sicherheits-Abschlussreview als Tests (Plan M9 E160): Inventar statt Stichprobe.
//   Task 207: Kopfzeilen jeder Seite und der API, Cookies hinter dem Proxy, HSTS, Host-Kopf wirkungslos, statische Dateien.
//   Task 208: Routen-Inventar mit Rechten je Rolle und Rate-Limits (test/fixtures/routen_rechte.json).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const H = require('./helpers');

const SEITEN_OEFFENTLICH = ['/', '/gast', '/themen', '/datenschutz', '/robots.txt', '/gibt-es-nicht', '/fehler/keine-berechtigung.html', '/board/unbekannt', '/healthz', '/api/plattform', '/static/css/basis.css', '/akten/gibt-es-nicht.pdf', '/level/9.1'];
const SEITEN_SCHUELER = ['/spiel', '/labor', '/funkraum', '/werkstatt'];
const SEITEN_LEHRKRAFT = ['/lehrer', '/lehrer/urkunden', '/beamer/funkraum/1', '/beamer/arena/1'];
const SEITEN = [...SEITEN_OEFFENTLICH, ...SEITEN_SCHUELER, ...SEITEN_LEHRKRAFT];

const CSP_PFLICHT = ["default-src 'self'", "script-src 'self'", "style-src 'self'", "object-src 'none'", "frame-ancestors 'none'", "base-uri 'self'", "form-action 'self'"];

/** Kopfzeilen, die jede Antwort tragen muss (Seiten, API, Fehler). */
function pruefeKopf(r, wo) {
  const csp = r.headers['content-security-policy'];
  assert.ok(csp, `${wo}: CSP fehlt`);
  for (const d of CSP_PFLICHT) assert.ok(csp.includes(d), `${wo}: ${d}`);
  assert.ok(!/unsafe-inline|unsafe-eval/.test(csp), `${wo}: unsafe-*`);
  assert.equal(r.headers['x-robots-tag'], 'noindex, nofollow', wo);
  assert.equal(r.headers['x-content-type-options'], 'nosniff', wo);
  assert.equal(r.headers['x-frame-options'], 'SAMEORIGIN', wo);
  assert.equal(r.headers['x-powered-by'], undefined, wo);
}

async function rollen() {
  const app = H.makeApp({ trustProxy: 1 });
  const k = H.kurs(app);
  const schueler = await H.schuelerClient(app, k, 'Mika R.');
  const lehrkraft = await H.lehrkraftClient(app, { name: 'Frau M.', kurse: [k] });
  return { app, k, anonym: H.client(app), schueler, lehrkraft };
}

/** [pfad, agent] je Seite: öffentlich anonym, sonst mit passender Sitzung (und zusätzlich anonym → Weiterleitung). */
function alleSeitenMitAgent(r) {
  return [
    ...SEITEN.map((p) => [p, r.anonym]),
    ...SEITEN_SCHUELER.map((p) => [p, r.schueler]),
    ...SEITEN_LEHRKRAFT.map((p) => [p, r.lehrkraft])
  ];
}

test('header_jede_seite: CSP exakt, noindex, nosniff, frame-ancestors none, kein X-Powered-By', async () => {
  const r = await rollen();
  for (const [pfad, agent] of alleSeitenMitAgent(r)) {
    const a = await agent.get(pfad);
    pruefeKopf(a, `${pfad} (${a.status})`);
  }
  // mit Sitzung liefern die geschützten Seiten wirklich die Seite (nicht nur eine Weiterleitung)
  for (const p of SEITEN_SCHUELER) assert.equal((await r.schueler.get(p)).status, 200, p);
  for (const p of SEITEN_LEHRKRAFT) assert.equal((await r.lehrkraft.get(p)).status, 200, p);
  // HTML-Seiten werden nie zwischengespeichert
  for (const p of ['/', '/gast', '/themen', '/datenschutz']) assert.equal((await r.anonym.get(p)).headers['cache-control'], 'no-store', p);
});

test('header_api_und_fehler: JSON-Antworten (200, 401, 404, 429, 500) mit denselben Kopfzeilen', async () => {
  const r = await rollen();
  const faelle = [
    [200, await r.anonym.get('/api/themen')],
    [200, await r.schueler.get('/api/profil')],
    [401, await r.anonym.get('/api/profil')],
    [401, await r.anonym.get('/api/lehrer/kurse')],
    [404, await r.anonym.get('/api/gibt-es-nicht')],
    [403, await H.client(r.app).post('/api/abmelden').set('Origin', 'https://boese.example').send({})]
  ];
  // 429: Prüf-Limit 90/min je Schüler
  let letzte;
  for (let i = 0; i < 91; i++) letzte = await r.schueler.post('/api/aufgaben/W9-L1-01/pruefen').send({ antwort: { g1: '0' } });
  faelle.push([429, letzte]);
  for (const [status, a] of faelle) {
    assert.equal(a.status, status, `${a.req.path}: ${a.status}`);
    pruefeKopf(a, `${a.req.method} ${a.req.path} (${status})`);
    assert.match(a.headers['content-type'], /application\/json/, a.req.path);
    if (a.req.path.startsWith('/api/') && a.req.path !== '/api/plattform') assert.equal(a.headers['cache-control'], 'no-store', a.req.path);
  }
  // 500: Datenbank geschlossen → Fehler-Handler bzw. /healthz, ohne Stack in der Antwort
  const kaputt = await rollen();
  kaputt.app.locals.db.close();
  for (const a of [await kaputt.anonym.get('/healthz'), await kaputt.schueler.get('/api/profil')]) {
    assert.equal(a.status, 500, a.req.path);
    pruefeKopf(a, `${a.req.path} (500)`);
    assert.doesNotMatch(JSON.stringify(a.body), /at |\.js:|database/i, 'keine Details im Fehler');
  }
});

test('sso_kopfzeilen: /sso/start, /sso/ende (gültig und ungültig) mit Cache-Control no-store und Referrer-Policy no-referrer', async () => {
  const { app } = await rollen();
  const c = H.client(app);
  const start = await c.get('/sso/start?ziel=/spiel');
  assert.equal(start.status, 302);
  const u = new URL(start.headers.location);
  const gueltig = await c.get(H.endeUrl({ token: H.ssoToken({}, { app }), state: u.searchParams.get('state'), ziel: '/spiel' }));
  assert.equal(gueltig.status, 302);
  const ungueltig = await H.client(app).get(H.endeUrl({ token: 'kaputt', state: 'falsch' }));
  assert.equal(ungueltig.status, 401);
  for (const a of [start, gueltig, ungueltig]) {
    pruefeKopf(a, a.req.path);
    assert.equal(a.headers['cache-control'], 'no-store', a.req.path);
    assert.equal(a.headers['referrer-policy'], 'no-referrer', a.req.path);
  }
});

/** Set-Cookie-Zeilen nach Name (gesetzte, nicht gelöschte). */
const gesetzt = (r, name) => (r.headers['set-cookie'] || []).filter((x) => x.startsWith(name + '=') && !x.startsWith(name + '=;'));

/**
 * SSO-Ablauf von Hand (der Cookie-Speicher von supertest schickt Secure-Cookies über http nicht zurück):
 * /sso/start → state-Cookie → /sso/ende. Liefert { start, ende }.
 */
async function ssoVonHand(app, felder, https) {
  const req = (p) => {
    const r = require('supertest')(app).get(p).set('Host', H.HOST);
    return https ? r.set('X-Forwarded-Proto', 'https') : r;
  };
  const start = await req('/sso/start?ziel=/');
  const state = new URL(start.headers.location).searchParams.get('state');
  const cookie = gesetzt(start, 'kr_sso_state')[0].split(';')[0];
  const ende = await req(H.endeUrl({ token: H.ssoToken(felder, { app }), state, ziel: '/' })).set('Cookie', cookie);
  assert.equal(ende.status, 302, `/sso/ende: ${ende.status} ${ende.headers['x-kryptos-grund'] || ''}`);
  return { start, ende };
}

test('cookies_hinter_proxy (Review Focus 5): X-Forwarded-Proto https → kr_s, kr_l, kr_sso_state mit Secure; ohne → ohne Secure; immer HttpOnly, SameSite=Lax', async () => {
  const { app } = await rollen();
  let n = 500;
  for (const https of [true, false]) {
    const s = await ssoVonHand(app, { sub: `s:${++n}`, name: 'Ole B.', kurse: [{ id: 'k:51', name: 'LK 13', rolle: 'mitglied' }] }, https);
    const l = await ssoVonHand(app, { sub: `l:${++n}`, rolle: 'lehrkraft', name: 'Frau M.', kurse: [{ id: 'k:51', name: 'LK 13', rolle: 'lehrkraft' }] }, https);
    const zeilen = [...gesetzt(s.ende, 'kr_s'), ...gesetzt(l.ende, 'kr_l'), ...gesetzt(s.start, 'kr_sso_state')];
    assert.equal(zeilen.length, 3, JSON.stringify(zeilen));
    // auch die Lösch-Zeilen (abgelaufene Cookies) tragen dieselben Attribute
    const alle = [...zeilen, ...(s.ende.headers['set-cookie'] || []), ...(l.ende.headers['set-cookie'] || [])];
    for (const z of alle) {
      assert.match(z, /;\s*HttpOnly/i, z);
      assert.match(z, /;\s*SameSite=Lax/i, z);
      if (https) assert.match(z, /;\s*Secure/i, z);
      else assert.doesNotMatch(z, /;\s*Secure/i, z);
    }
  }
});

test('hsts_bei_https: Strict-Transport-Security bei X-Forwarded-Proto https', async () => {
  const { app } = await rollen();
  for (const p of ['/', '/api/themen', '/sso/start', '/gibt-es-nicht']) {
    const r = await H.client(app).get(p).set('X-Forwarded-Proto', 'https');
    assert.match(r.headers['strict-transport-security'] || '', /max-age=\d{7,}/, p);
  }
});

test('host_kopf_wirkungslos (Review Focus 5): /sso/start mit Host: boese.example → ruecksprung bleibt https://kryptos.test/sso/ende; Abmelden-weiter bleibt Portal-URL', async () => {
  const { app } = await rollen();
  const boese = () => H.client(app).set('Host', 'boese.example').set('Origin', 'http://boese.example').set('X-Forwarded-Host', 'boese.example');
  const start = await boese().get('/sso/start?ziel=/spiel');
  const u = new URL(start.headers.location);
  assert.equal(u.origin, H.PORTAL);
  assert.equal(u.searchParams.get('ruecksprung'), `${H.PLATTFORM}/sso/ende`);
  // Abmelden „überall“: weiter immer aus PORTAL_URL/PLATTFORM_URL
  const s = await H.sso(app, {}, { client: boese(), ziel: '/spiel' });
  const ab = await s.post('/api/abmelden').send({ ueberall: true });
  assert.equal(ab.status, 200);
  assert.equal(ab.body.weiter, `${H.PORTAL}/sso/abmelden?ruecksprung=${encodeURIComponent(H.PLATTFORM + '/')}`);
  // Portal-Link der Fehlerseiten, Manifest-Basis
  assert.equal((await boese().get('/sso/portal')).headers.location, H.PORTAL + '/');
  assert.equal((await boese().get('/api/plattform')).body.basis, H.PLATTFORM);
  // Weiterleitungen der Seiten-Wächter und /admin bleiben relativ (kein fremder Rechner)
  for (const p of ['/spiel', '/lehrer', '/admin', '/level/9.1']) {
    const r = await boese().get(p);
    assert.equal(r.status, 302, p);
    assert.match(r.headers.location, /^\/(?!\/)/, `${p}: ${r.headers.location}`);
  }
  // /sso/ende leitet nur auf relative Ziele weiter
  const c = boese();
  const st = new URL((await c.get('/sso/start')).headers.location).searchParams.get('state');
  const ende = await c.get(H.endeUrl({ token: H.ssoToken({}, { app }), state: st, ziel: '//boese.example/x' }));
  assert.equal(ende.status, 302);
  assert.match(ende.headers.location, /^\/(?!\/)/);
});

test('statische Dateien: kein Verzeichnislisting, keine Quelltext-Dateien außerhalb public (/static/../src/app.js → 404)', async () => {
  const { app } = await rollen();
  const c = H.client(app);
  const pfade = ['/static/', '/static/css/', '/static/js/', '/static/../src/app.js', '/static/%2e%2e/src/app.js', '/static/..%2fsrc%2fapp.js', '/static/%2e%2e%2f%2e%2e%2fpackage.json',
    '/akten/', '/akten/../src/app.js.pdf', '/akten/%2e%2e%2f%2e%2e%2fsrc%2fapp.js', '/lehrkraft/dateien/..%2f..%2fsrc%2fapp.js', '/fehler/../../src/app.js', '/src/app.js', '/package.json', '/.env', '/data/kryptos.db', '/static/.gitkeep'];
  for (const p of pfade) {
    const r = await c.get(p);
    assert.equal(r.status, 404, `${p}: ${r.status}`);
    assert.doesNotMatch(r.text || '', /createApp|"dependencies"|Index of/, p);
    pruefeKopf(r, p);
  }
});


// ── Task 208: Routen-Inventar mit Rechten je Rolle und Rate-Limits ──
const request = require('supertest');
const HS = require('./hilfen_sicherheit');
const TABELLE = require('./fixtures/routen_rechte.json');
const ROLLEN = ['anonym', 'schueler', 'lehrkraft', 'admin'];
const SCHREIBEND = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
// Reihenfolge wie beim Erheben der Tabelle: erst lesen, dann schreiben, Löschen zuletzt (Zustand der Fixture)
const rang = (z) => (z.methode === 'GET' ? 0 : z.methode === 'DELETE' ? 2 : 1);

test('routen_inventar: jede registrierte Route steht in routen_rechte.json und umgekehrt', () => {
  const ist = HS.registrierteRouten(H.makeApp());
  assert.ok(ist.length > 100, 'Routen gefunden');
  const soll = new Set(TABELLE.map((z) => `${z.methode} ${z.pfad}`));
  assert.equal(soll.size, TABELLE.length, 'doppelte Zeile in der Tabelle');
  assert.deepEqual(ist.filter((r) => !soll.has(r)), [], 'Route ohne Eintrag');
  assert.deepEqual([...soll].filter((r) => !ist.includes(r)), [], 'Eintrag ohne Route');
  // Im Portal-Modus entfernte Kern-Routen (TECHNIK §6.5) bleiben entfernt
  for (const r of ['POST /api/lehrer/registrieren', 'POST /api/lehrer/anmelden', 'POST /api/lehrer/passwort', 'POST /api/schueler/beitreten', 'POST /api/schueler/anmelden', 'GET /api/kurs/:code', 'GET /k/:code', 'POST /api/lehrer/kurse', 'DELETE /api/lehrer/kurse/:kursId', 'GET /api/admin/lehrkraefte']) {
    assert.ok(!ist.includes(r), `entfernte Route wieder da: ${r}`);
  }
  assert.ok(!ist.some((r) => /lehrkraefte|beitreten|registrieren|passwort/.test(r)), 'Kern-Anmeldung im Portal-Modus');
});

test('rechte_je_rolle: Status für anonym/schueler/lehrkraft/admin wie in der Tabelle', { timeout: 60000 }, async () => {
  const fx = await HS.fixture();
  const abweichungen = [];
  for (const z of [...TABELLE].sort((a, b) => rang(a) - rang(b))) {
    for (const rolle of ROLLEN) {
      const r = await HS.anfrage(fx, rolle, z.methode, z.pfad);
      if (r.status !== z[rolle]) abweichungen.push(`${z.methode} ${z.pfad} als ${rolle}: ${r.status} statt ${z[rolle]}`);
    }
  }
  assert.deepEqual(abweichungen, []);
});

test('rechte_je_bereich: Tabelle ist in sich stimmig (fremde Rollen abgewiesen, eigene Rolle nie 401/403)', () => {
  const ab = (s) => [401, 302].includes(s); // ohne passende Sitzung: API 401, Seite Weiterleitung zum SSO-Start
  const fehler = [];
  for (const z of TABELLE) {
    const w = `${z.methode} ${z.pfad}`;
    const ok = {
      schueler: () => ab(z.anonym) && ab(z.lehrkraft) && ab(z.admin) && !ab(z.schueler),
      lehrkraft: () => [z.anonym, z.schueler].every((s) => ab(s) || s === 404) && ![401, 403, 302].includes(z.lehrkraft) && ![401, 403, 302].includes(z.admin),
      admin: () => z.anonym === 401 && z.schueler === 401 && z.lehrkraft === 403 && ![401, 403].includes(z.admin),
      verbund: () => ROLLEN.every((r) => z[r] === 401), // Sitzungen zählen nicht – nur das Verbund-Token
      'schueler+lehrkraft': () => ab(z.anonym) && ![401, 302].includes(z.schueler) && ![401, 302].includes(z.lehrkraft),
      oeffentlich: () => ROLLEN.every((r) => z[r] === z.anonym)
    }[z.bereich];
    if (!ok) fehler.push(`${w}: unbekannter Bereich ${z.bereich}`);
    else if (!ok()) fehler.push(`${w}: Status passt nicht zum Bereich ${z.bereich}`);
    if (z.bereich === 'oeffentlich' && SCHREIBEND.has(z.methode) && !/^\/api\/(abmelden|gast\/)/.test(z.pfad)) fehler.push(`${w}: schreibend und öffentlich`);
  }
  assert.deepEqual(fehler, []);
});

test('schreibende_routen_haben_limit: jede POST/PUT/PATCH/DELETE-Zeile hat limit oder grund', () => {
  for (const z of TABELLE) {
    assert.ok(typeof z.limit === 'string' ? z.limit.length > 3 : z.limit === null, `${z.methode} ${z.pfad}: limit`);
    if (z.limit === null) assert.ok(typeof z.grund === 'string' && z.grund.length >= 10, `${z.methode} ${z.pfad}: limit null ohne grund`);
  }
  // Prüf-, Tipp- und Aufdeck-Routen der Schüler (inkl. Boss-Antwort, neue Trainingsaufgabe) und alles ohne Anmeldung, das
  // schreibt, sind begrenzt (Warm-up-Antworten zählen nicht: Selbsteinschätzung ohne Punkte und ohne Prüfung)
  for (const z of TABELLE.filter((x) => /\/(pruefen|tipp|aufdecken|neu)$|\/boss\/kampf\/:id\/antwort$/.test(x.pfad) && x.bereich === 'schueler')) assert.ok(z.limit, `${z.methode} ${z.pfad} ohne Limit`);
  for (const z of TABELLE.filter((x) => x.bereich === 'oeffentlich' && SCHREIBEND.has(x.methode) && x.pfad !== '/api/abmelden')) assert.ok(z.limit, `${z.methode} ${z.pfad} ohne Limit`);
});

test('klasse_hinter_einer_ip (Review Focus 3): 32 SSO-Anmeldungen und je 3 Prüfungen von einer IP in < 60 s ohne 429', { timeout: 60000 }, async () => {
  const app = H.makeApp({ trustProxy: 1 });
  const beginn = Date.now();
  const status = [];
  for (let i = 0; i < 32; i++) {
    // alle über dieselbe Schul-IP (X-Forwarded-For hinter dem Proxy)
    const c = H.client(app).set('X-Forwarded-For', '203.0.113.7');
    await H.sso(app, { sub: `s:${3000 + i}`, name: `Tablet ${i + 1}`, kurse: [{ id: 'k:77', name: 'LK 13', rolle: 'mitglied' }] }, { client: c, ziel: '/spiel' });
    status.push(c.antwort.status);
    for (const p of ['/spiel', '/api/sitzung', '/api/welten', '/api/profil']) status.push((await c.get(p)).status);
    for (let j = 0; j < 3; j++) status.push((await c.post(`/api/aufgaben/W9-L1-0${j + 1}/pruefen`).send({ antwort: j === 2 ? ['a'] : { g1: '0' } })).status);
  }
  assert.ok(Date.now() - beginn < 60000);
  assert.equal(status.filter((s) => s === 429).length, 0, 'Rate-Limit für eine ganze Klasse');
  assert.equal(status.filter((s) => s === 302).length, 32, 'alle angemeldet');
});

test('verbund_ohne_origin: /api/verbund/* ohne Origin erlaubt, aber nur mit Token (401 ohne)', async () => {
  const app = H.makeApp();
  const ohne = await request(app).post('/api/verbund/loeschen').send({ sub: 's:1' });
  assert.equal(ohne.status, 401);
  const fremd = await request(app).post('/api/verbund/loeschen').set('Origin', 'https://boese.example').send({ sub: 's:1' });
  assert.equal(fremd.status, 401, 'fremde Origin ändert nichts – nur das Token zählt');
  // Sitzung ersetzt das Token nicht
  const lk = await H.lehrkraftClient(app);
  assert.equal((await lk.post('/api/verbund/loeschen').send({ sub: 's:1' })).status, 401);
  const mit = await request(app).post('/api/verbund/loeschen').set('Authorization', 'Bearer ' + H.verbundToken('loeschen')).send({ sub: 's:1' });
  assert.equal(mit.status, 200, JSON.stringify(mit.body));
  const uebersicht = await request(app).get('/api/verbund/kurse/k:1/uebersicht').set('Authorization', 'Bearer ' + H.verbundToken('loeschen'));
  assert.equal(uebersicht.status, 401, 'Token mit falschem Zweck');
});

test('json_groesse (Fund Task 208): große JSON-Körper nur für Backup-Restore und Warm-up-Import (Superadmin), sonst 413 vor dem Parsen', async () => {
  const app = H.makeApp();
  const gross = JSON.stringify({ x: 'a'.repeat(2 * 1024 * 1024) }); // 2 MB
  const anonym = await H.client(app).post('/api/abmelden').set('Content-Type', 'application/json').send(gross);
  assert.equal(anonym.status, 413, 'ohne Anmeldung kein 2-MB-Körper');
  const s = await H.schuelerClient(app, H.kurs(app));
  assert.equal((await s.post('/api/aufgaben/W9-L1-01/pruefen').set('Content-Type', 'application/json').send(gross)).status, 413);
  // normale Körper bis 1 MB gehen weiter
  assert.notEqual((await s.post('/api/aufgaben/W9-L1-01/pruefen').send({ antwort: { g1: 'x'.repeat(1000) } })).status, 413);
  // Superadmin: Restore und Warm-up-Import nehmen große Dateien an (bis 30 MB; Inhalt hier ungültig → 400, nicht 413)
  const admin = await H.adminClient(app);
  for (const p of ['/api/admin/restore', '/api/admin/katas/import']) {
    const r = await admin.post(p).set('Content-Type', 'application/json').send(gross);
    assert.notEqual(r.status, 413, p);
  }
  // … aber nur mit Superadmin-Sitzung: ohne Anmeldung bzw. als Lehrkraft gilt auch dort die 1-MB-Grenze
  assert.equal((await H.client(app).post('/api/admin/restore').set('Content-Type', 'application/json').send(gross)).status, 413);
  const lk = await H.lehrkraftClient(app);
  assert.equal((await lk.post('/api/admin/katas/import').set('Content-Type', 'application/json').send(gross)).status, 413);
  assert.equal((await lk.post('/api/admin/katas/import').send({})).status, 403, 'kleiner Körper: Rechteprüfung wie bisher');
});

/* ---------- Vertrag v1.3 §9: keine Ausführung von Code oder Abfragen der Schülerinnen und Schüler ---------- */

test('v1.3 §9 kein_fremdcode: Server und Oberfläche führen keinen Code und keine Abfragen aus (kein eval, new Function, vm, child_process, Worker)', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const WURZEL = path.join(__dirname, '..');
  const dateien = ['src', path.join('public', 'static', 'js')].flatMap((d) =>
    fs.readdirSync(path.join(WURZEL, d), { recursive: true }).filter((f) => f.endsWith('.js')).map((f) => path.join(d, f))
  );
  assert.ok(dateien.length > 50, `Dateien: ${dateien.length}`);
  const VERBOTEN = [
    [/\beval\s*\(/, 'eval'],
    [/\bnew\s+Function\s*\(|\bFunction\s*\(\s*['"`]/, 'new Function'],
    [/require\(\s*['"](node:)?(vm|child_process|worker_threads|cluster)['"]\s*\)/, 'vm/child_process/worker_threads/cluster'],
    [/\bnew\s+(Shared)?Worker\s*\(/, 'Worker'],
    [/\bset(Timeout|Interval)\s*\(\s*['"`]/, 'setTimeout mit Text'],
    [/\bimport\s*\(\s*[^'"\s]/, 'dynamischer Import mit berechnetem Pfad'] // JSDoc-Typen wie import('express') sind erlaubt
  ];
  const funde = [];
  for (const d of dateien) {
    const text = fs.readFileSync(path.join(WURZEL, d), 'utf8');
    for (const [muster, name] of VERBOTEN) if (muster.test(text)) funde.push(`${d}: ${name}`);
  }
  assert.deepEqual(funde, []);
  // Einziges db.exec: die festen Migrationen in src/db.js (kein Text aus Anfragen)
  const exec = dateien.filter((d) => /\bdb\.exec\s*\(/.test(fs.readFileSync(path.join(WURZEL, d), 'utf8')));
  assert.deepEqual(exec, [path.join('src', 'db.js')]);
});
