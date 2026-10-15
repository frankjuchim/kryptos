'use strict';
// Kern-Kandidat lab-kern: SSO-Empfänger einer Plattform (VERTRAG §5, TECHNIK §6.2–§6.3).
//   GET /sso/start?ziel=/pfad          → Weiterleitung zum Portal (state im kurzlebigen Cookie kr_sso_state, Path=/sso)
//   GET /sso/ende?token&state&ziel     → Token prüfen, Konto/Kurse abgleichen, eigene Sitzung, Weiterleitung auf ziel
//       bzw. ?fehler=…&state=…
//   GET /sso/portal                    → Weiterleitung auf PORTAL_URL (Link der statischen Fehlerseiten)
// Tokens und URLs dieser Routen werden nie geloggt.

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const S = require('../security');
const { pruefe } = require('../jwt');

const STATE_MS = 10 * 60 * 1000; // 10 Minuten (VERTRAG §5)
const MAX_DAUER_SEK = 120;
const FEHLER_DIR = path.join(__dirname, '..', '..', 'public', 'fehler');
const ROLLE_ZU_PRAEFIX = { schueler: 's', lehrkraft: 'l', superadmin: 'a' };
const MAX_KURSE = 1000;
const esc = (t) => String(t).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/**
 * Seite „Kein Zugang“ (fehler=keine_berechtigung, INTEGRATION §3.2 ab v1.3): statische Datei mit dem rollenneutralen
 * Text; die Links „⌂ Zum Portal“ zeigen hier direkt auf PORTAL_URL (die Datei selbst verweist auf /sso/portal, weil
 * sie PORTAL_URL nicht kennt). Kein reflektierter Inhalt aus der Anfrage.
 */
function keinZugangSeite(portalUrl) {
  const html = fs.readFileSync(path.join(FEHLER_DIR, 'keine-berechtigung.html'), 'utf8');
  return html.split('href="/sso/portal"').join(`href="${esc(portalUrl + '/')}"`);
}

/** ziel nur als relativer Pfad mit genau einem führenden „/“ (kein //host, kein /\host, keine Steuerzeichen), ≤ 300 Zeichen. */
function sicheresZiel(z) {
  // Steuerzeichen ausschließen: Browser entfernen Tab/Zeilenumbruch in URLs („/\t/host“ würde zu „//host“).
  // eslint-disable-next-line no-control-regex
  return typeof z === 'string' && z.length <= 300 && /^\/(?![/\\])/.test(z) && !/[\u0000-\u001f\u007f]/.test(z) ? z : '/';
}

/** Seiten, die nur die jeweils andere Rolle öffnen darf (TECHNIK §6.4/§11.1; /labor ist für beide). */
const NUR_LEHRKRAFT = ['/lehrer', '/beamer'];
const NUR_SCHUELER = ['/spiel', '/funkraum', '/werkstatt'];
const unter = (pfad, basis) => pfad === basis || pfad.startsWith(basis + '/');

/**
 * ziel (nach sicheresZiel) für die Rolle: Seiten der anderen Rolle und „/“ → Startseite der Rolle (Schüler /spiel,
 * Lehrkraft/Superadmin /lehrer). Verhindert die Schleife Schüler → /lehrer → SSO → /lehrer → …
 */
function zielFuerRolle(ziel, rolle) {
  const start = rolle === 'schueler' ? '/spiel' : '/lehrer';
  const pfad = ziel.split(/[?#]/)[0];
  const verboten = rolle === 'schueler' ? NUR_LEHRKRAFT : NUR_SCHUELER;
  return ziel === '/' || verboten.some((b) => unter(pfad, b)) ? start : ziel;
}

/** Inhalt des Tokens nach TECHNIK §6.3 Schritt 5. */
function pruefeInhalt(t) {
  if (typeof t.sub !== 'string' || !/^[asl]:\d{1,15}$/.test(t.sub)) return false;
  if (ROLLE_ZU_PRAEFIX[t.rolle] !== t.sub[0]) return false;
  // Name ≤ 80 (Portal: Lehrkraft-Namen 2–80, Schüler 2–30); Kurse ≤ 1000 (Superadmin: alle Kurse der Plattform –
  // praktisch begrenzt jwt.pruefe die Token-Länge auf 8192 Zeichen, das sind je nach Kursnamen etwa 80–120 Kurse)
  if (typeof t.name !== 'string' || t.name.trim().length < 1 || t.name.length > 80) return false;
  if (!Array.isArray(t.kurse) || t.kurse.length > MAX_KURSE) return false;
  const kursRolle = t.rolle === 'schueler' ? 'mitglied' : 'lehrkraft';
  for (const k of t.kurse) {
    if (!k || typeof k !== 'object' || Array.isArray(k)) return false;
    if (typeof k.id !== 'string' || !/^k:\d{1,15}$/.test(k.id)) return false;
    if (typeof k.name !== 'string' || k.name.trim().length < 1 || k.name.length > 80) return false;
    if (k.rolle !== kursRolle) return false;
  }
  return true;
}

/**
 * @param {object} o
 * @param {import('better-sqlite3').Database} o.db
 * @param {object} o.svc        Dienste (konten.upsert, kurse.upsertAusToken)
 * @param {object} o.konfig     Verbund-Konfiguration (ladeKonfig)
 * @param {object} o.sitzung    aus createSitzung
 * @param {string} o.secret     Cookie-Geheimnis
 * @param {Function} o.now      Uhr (ms)
 * @returns {import('express').Router}
 */
function createSsoRouter({ db, svc, konfig, sitzung, secret, now }) {
  const r = express.Router();
  const startLimit = new S.Limiter({ max: 300, windowMs: 10 * 60 * 1000 });
  const jetztSek = () => Math.floor(now() / 1000);
  const bereit = () => !!(konfig.portalUrl && konfig.plattformUrl && konfig.schluessel && konfig.schluessel.length);
  const jtiMerken = db.prepare('INSERT INTO sso_jti (jti, exp) VALUES (?, ?) ON CONFLICT(jti) DO NOTHING');
  const jtiAufraeumen = db.prepare('DELETE FROM sso_jti WHERE exp < ?');

  const nichtEingerichtet = (res) => res.status(503).type('text').send('Die Anmeldung über das Portal ist auf dieser Plattform nicht eingerichtet.');

  /** Einmaligkeit der jti, persistent (überlebt Neustarts). false = schon verwendet. */
  function merkeJti(jti, exp) {
    jtiAufraeumen.run(jetztSek() - 60);
    return jtiMerken.run('s:' + jti, exp).changes === 1;
  }

  r.get('/start', (req, res) => {
    res.set('Cache-Control', 'no-store');
    // Die Weiterleitung zum Portal trägt state und ziel in der URL – kein Referrer (wie /sso/ende; M9 Task 207)
    res.set('Referrer-Policy', 'no-referrer');
    const key = 'ip:' + req.ip;
    if (!startLimit.take(key)) {
      res.set('Retry-After', String(startLimit.retryAfterSec(key)));
      return res.status(429).type('text').send('Zu viele Anmeldungen in kurzer Zeit. Bitte warte ein paar Minuten.');
    }
    if (!bereit()) return nichtEingerichtet(res);
    const state = crypto.randomBytes(16).toString('base64url');
    res.cookie(S.COOKIE_SSO_STATE, S.sign({ st: state, exp: Date.now() + STATE_MS }, secret), {
      httpOnly: true,
      sameSite: 'lax',
      secure: req.secure,
      path: '/sso',
      maxAge: STATE_MS
    });
    const q = new URLSearchParams({
      plattform: konfig.plattformId,
      ruecksprung: konfig.plattformUrl + '/sso/ende',
      state,
      ziel: sicheresZiel(req.query.ziel)
    });
    res.redirect(302, `${konfig.portalUrl}/sso/autorisieren?${q}`);
  });

  r.get('/ende', (req, res) => {
    res.set('Referrer-Policy', 'no-referrer');
    res.set('Cache-Control', 'no-store');
    const fehlerSeite = (status, datei, grund) => {
      res.set('X-Kryptos-Grund', grund);
      return res.status(status).sendFile(path.join(FEHLER_DIR, datei), { cacheControl: false, lastModified: false, etag: false });
    };

    // 1. state-Cookie lesen und sofort löschen
    const roh = S.parseCookies(req.headers.cookie)[S.COOKIE_SSO_STATE];
    const gemerkt = roh ? S.verify(roh, secret) : null;
    res.clearCookie(S.COOKIE_SSO_STATE, { httpOnly: true, sameSite: 'lax', secure: req.secure, path: '/sso' });
    if (!bereit()) return nichtEingerichtet(res);
    const q = req.query;
    const state = typeof q.state === 'string' ? q.state : '';
    if (!gemerkt || typeof gemerkt.st !== 'string' || !state || !S.safeEqual(gemerkt.st, state)) {
      // Ein gültig signiertes Token ist trotzdem verbraucht (INTEGRATION §5: Token genau einmal verwendbar) –
      // sonst ließe es sich nach dem Fehlschlag mit passendem state erneut einlösen.
      if (typeof q.token === 'string') {
        const p = pruefe(q.token, konfig.schluessel, { iss: konfig.portalUrl, aud: konfig.plattformId, maxDauerSek: MAX_DAUER_SEK, jetztSek: jetztSek() });
        if (p.ok) merkeJti(p.nutzlast.jti, p.nutzlast.exp);
      }
      return fehlerSeite(401, 'anmeldung-fehlgeschlagen.html', 'state');
    }

    // 2. Ablehnung durch das Portal
    if (q.fehler !== undefined) {
      if (q.fehler === 'keine_berechtigung') {
        res.set('X-Kryptos-Grund', 'keine_berechtigung');
        return res.status(403).type('html').send(keinZugangSeite(konfig.portalUrl));
      }
      if (q.fehler === 'abgebrochen') return res.redirect(302, '/?abgebrochen=1');
      return fehlerSeite(401, 'anmeldung-fehlgeschlagen.html', 'portal');
    }

    // 3. Token prüfen (Signatur, iss, aud, Zeiten, v)
    const p = pruefe(q.token, konfig.schluessel, { iss: konfig.portalUrl, aud: konfig.plattformId, maxDauerSek: MAX_DAUER_SEK, jetztSek: jetztSek() });
    if (!p.ok) return fehlerSeite(401, 'anmeldung-fehlgeschlagen.html', p.grund);
    const t = p.nutzlast;

    // 4. jti genau einmal (persistent in sso_jti)
    if (!merkeJti(t.jti, t.exp)) return fehlerSeite(401, 'anmeldung-fehlgeschlagen.html', 'wiederverwendet');

    // 5. Inhalt
    if (!pruefeInhalt(t)) return fehlerSeite(401, 'anmeldung-fehlgeschlagen.html', 'inhalt');

    // 6. Konto und Kursabgleich in einer Transaktion (TECHNIK §6.6)
    const konto = db.transaction(() => {
      const k = svc.konten.upsert({ sub: t.sub, rolle: t.rolle, name: t.name });
      svc.kurse.upsertAusToken(t.sub, t.rolle, t.kurse);
      return k;
    })();

    const ziel = zielFuerRolle(sicheresZiel(q.ziel), t.rolle);
    if (t.rolle === 'schueler') {
      // 7. Schüler ohne aktive Teilnahme in einem aktiven Kurs: keine Sitzung
      const teilnahme = sitzung.ersteTeilnahme(konto.sub);
      if (!teilnahme) return fehlerSeite(403, 'kurs-gesperrt.html', 'kurs-gesperrt');
      // 8. Sitzung; das jeweils andere Sitzungs-Cookie löschen (geteilte Tablets)
      sitzung.setzeSchueler(req, res, konto, teilnahme.id);
      sitzung.loescheLehrkraft(req, res);
      // 9. Weiterleitung
      return res.redirect(302, ziel);
    }
    sitzung.setzeLehrkraft(req, res, konto);
    sitzung.loescheSchueler(req, res);
    res.redirect(302, ziel);
  });

  r.get('/portal', (req, res) => {
    if (!konfig.portalUrl) return res.redirect(302, '/');
    res.redirect(302, konfig.portalUrl + '/');
  });

  return r;
}

module.exports = { createSsoRouter, sicheresZiel, zielFuerRolle, pruefeInhalt, STATE_MS };
