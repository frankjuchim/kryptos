'use strict';
// Kern-Kandidat lab-kern: SSO-Empfänger einer Plattform (VERTRAG §5, TECHNIK §6.2–§6.3).
//   GET /sso/start?ziel=/pfad          → Weiterleitung zum Portal (state im kurzlebigen Cookie kr_sso_state, Path=/sso)
//   GET /sso/ende?token&state&ziel     → Token prüfen, Konto/Kurse abgleichen, eigene Sitzung, Weiterleitung auf ziel
//       bzw. ?fehler=…&state=…
//   GET /sso/portal                    → Weiterleitung auf PORTAL_URL (Link der statischen Fehlerseiten)
// Tokens und URLs dieser Routen werden nie geloggt.

const crypto = require('node:crypto');
const path = require('node:path');
const express = require('express');
const S = require('../security');
const { pruefe } = require('../jwt');

const STATE_MS = 10 * 60 * 1000; // 10 Minuten (VERTRAG §5)
const MAX_DAUER_SEK = 120;
const FEHLER_DIR = path.join(__dirname, '..', '..', 'public', 'fehler');
const ROLLE_ZU_PRAEFIX = { schueler: 's', lehrkraft: 'l', superadmin: 'a' };

/** ziel nur als relativer Pfad mit genau einem führenden „/“ (kein //host, kein /\host, keine Steuerzeichen), ≤ 300 Zeichen. */
function sicheresZiel(z) {
  // Steuerzeichen ausschließen: Browser entfernen Tab/Zeilenumbruch in URLs („/\t/host“ würde zu „//host“).
  // eslint-disable-next-line no-control-regex
  return typeof z === 'string' && z.length <= 300 && /^\/(?![/\\])/.test(z) && !/[\u0000-\u001f\u007f]/.test(z) ? z : '/';
}

/** Inhalt des Tokens nach TECHNIK §6.3 Schritt 5. */
function pruefeInhalt(t) {
  if (typeof t.sub !== 'string' || !/^[asl]:\d{1,15}$/.test(t.sub)) return false;
  if (ROLLE_ZU_PRAEFIX[t.rolle] !== t.sub[0]) return false;
  if (typeof t.name !== 'string' || t.name.trim().length < 1 || t.name.length > 60) return false;
  if (!Array.isArray(t.kurse) || t.kurse.length > 200) return false;
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

  r.get('/portal', (req, res) => {
    if (!konfig.portalUrl) return res.redirect(302, '/');
    res.redirect(302, konfig.portalUrl + '/');
  });

  return r;
}

module.exports = { createSsoRouter, sicheresZiel, pruefeInhalt, STATE_MS };
