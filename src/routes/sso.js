'use strict';
// Plattform-Verbund InfoLabs (VERTRAG.md v1.1 §5, §6; Anleitung docs/INTEGRATION.md im Repo frankjuchim/labs):
//   GET  /sso/start?ziel=/pfad      → Weiterleitung zum Portal (state im kurzlebigen Cookie)
//   GET  /sso/ende?token&state&ziel → Token prüfen, Konto/Kurse abgleichen, eigene Sitzung, Weiterleitung auf ziel
//   GET  /sso/abmelden              → Sitzung hier beenden und „Überall abmelden“ am Portal
//   /api/verbund/…                  → Verbund-API (Bearer-Token des Portals, sub „portal“, zweck)
// Tokens werden nie geloggt.

const crypto = require('node:crypto');
const express = require('express');
const S = require('../security');
const { pruefe, JtiSpeicher } = require('../jwt');

const STATE_COOKIE = 'aq_sso_state';
const HINWEIS_COOKIE = 'aq_sso'; // „s“/„l“: zuletzt über das Portal angemeldet → bei abgelaufener Sitzung still neu anmelden
const STATE_MS = 10 * 60 * 1000;
const HINWEIS_MS = 400 * 24 * 3600 * 1000;

/** nur relative Pfade mit genau einem führenden „/“ (kein //host, kein /\host) */
function sicheresZiel(z) {
  return typeof z === 'string' && z.length <= 500 && /^\/(?![/\\])/.test(z) && !/[\u0000-\u001f]/.test(z) ? z : '/';
}

const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** schlichte Hinweisseite (ohne Skripte, CSP-konform) */
function seite(res, status, titel, text, links) {
  res
    .status(status)
    .type('html')
    .send(
      `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">` +
        `<title>${esc(titel)} – Algo Quest Lab</title><link rel="stylesheet" href="/static/css/style.css"></head>` +
        `<body><main class="narrow" id="haupt"><section class="card"><h1>${esc(titel)}</h1><p>${esc(text)}</p>` +
        `<p class="btn-row">${links.map(([href, label], i) => `<a class="btn${i ? ' secondary' : ''}" href="${esc(href)}">${esc(label)}</a>`).join(' ')}</p>` +
        `</section></main></body></html>`
    );
}

/**
 * @param {import('express').Express} app
 * @param {object} h  helpers aus app.js (svc, secret, now, setSchuelerCookie, setLehrkraftCookie, …)
 * @param {object} konfig  aus verbundKonfig()
 */
function ssoRoutes(app, h, konfig) {
  const { svc, secret } = h;
  const jetztSek = () => Math.floor(h.now() / 1000);
  const ssoJti = new JtiSpeicher();
  const verbundJti = new JtiSpeicher();
  const ssoLimit = new S.Limiter({ max: 120, windowMs: 10 * 60 * 1000 });
  const verbundLimit = new S.Limiter({ max: 600, windowMs: 10 * 60 * 1000 });
  const basis = (req) => konfig.url || `${req.protocol}://${req.get('host')}`;

  app.get('/sso/start', (req, res) => {
    res.set('Cache-Control', 'no-store');
    if (!konfig.sso) return seite(res, 404, 'Anmeldung über das Portal nicht eingerichtet', 'Diese Plattform ist (noch) nicht mit dem Portal verbunden.', [['/', 'Zur Startseite']]);
    const state = crypto.randomBytes(16).toString('base64url');
    const ziel = sicheresZiel(req.query.ziel);
    S.setCookie(req, res, STATE_COOKIE, { st: state }, secret, STATE_MS);
    const u = new URL(konfig.portal + '/sso/autorisieren');
    u.searchParams.set('plattform', konfig.id);
    u.searchParams.set('ruecksprung', basis(req) + '/sso/ende');
    u.searchParams.set('state', state);
    u.searchParams.set('ziel', ziel);
    res.redirect(302, u.href);
  });

  app.get('/sso/ende', (req, res) => {
    res.set('Referrer-Policy', 'no-referrer');
    res.set('Cache-Control', 'no-store');
    const cookies = S.parseCookies(req.headers.cookie);
    const gemerkt = cookies[STATE_COOKIE] ? S.verify(cookies[STATE_COOKIE], secret) : null;
    S.clearCookie(req, res, STATE_COOKIE);
    if (!konfig.sso) return seite(res, 404, 'Anmeldung über das Portal nicht eingerichtet', 'Diese Plattform ist (noch) nicht mit dem Portal verbunden.', [['/', 'Zur Startseite']]);
    const ipKey = 'ip:' + req.ip;
    if (!ssoLimit.take(ipKey)) return seite(res, 429, 'Zu viele Versuche', 'Bitte warte ein paar Minuten und versuche es dann erneut.', [['/', 'Zur Startseite']]);
    const nochmal = [['/sso/start', 'Erneut anmelden'], ['/', 'Zur Startseite']];
    const state = typeof req.query.state === 'string' ? req.query.state : '';
    if (!gemerkt || typeof gemerkt.st !== 'string' || !state || !S.safeEqual(gemerkt.st, state)) {
      return seite(res, 401, 'Anmeldung abgelaufen', 'Die Anmeldung über das Portal konnte nicht zugeordnet werden (abgelaufen oder in einem anderen Fenster begonnen). Bitte starte sie noch einmal.', nochmal);
    }
    const fehler = req.query.fehler;
    if (fehler === 'abgebrochen') return res.redirect(302, '/');
    if (fehler === 'keine_berechtigung') {
      return seite(res, 403, 'Kein Zugang', 'Kein Zugang – deine Lehrkraft hat diese Plattform für deinen Kurs nicht freigeschaltet. (Lehrkräfte: Die Plattform ist für Ihr Konto noch nicht freigeschaltet.) Ohne Anmeldung kannst du den Gastmodus ausprobieren.', [['/gast', '👀 Gastmodus'], [konfig.portal + '/', '⌂ Zum Portal']]);
    }
    if (fehler) return seite(res, 401, 'Anmeldung fehlgeschlagen', 'Das Portal hat die Anmeldung abgelehnt.', nochmal);
    const p = pruefe(req.query.token, konfig.schluessel, { iss: konfig.portal, aud: konfig.id, maxDauerSek: 120, jetztSek: jetztSek() });
    if (!p.ok) return seite(res, 401, 'Anmeldung ungültig', 'Die Anmeldung über das Portal war ungültig oder abgelaufen. Bitte starte sie noch einmal.', nochmal);
    const t = p.nutzlast;
    if (!ssoJti.merke(t.jti, t.exp, jetztSek())) return seite(res, 401, 'Anmeldung ungültig', 'Dieser Anmeldelink wurde schon verwendet. Bitte starte die Anmeldung noch einmal.', nochmal);
    if (!svc.verbund.pruefeInhalt(t)) return seite(res, 401, 'Anmeldung ungültig', 'Die Anmeldedaten des Portals sind unvollständig.', nochmal);
    const ziel = sicheresZiel(req.query.ziel);
    const hinweis = (wert) => res.cookie(HINWEIS_COOKIE, wert, { httpOnly: true, sameSite: 'lax', secure: req.secure, path: '/', maxAge: HINWEIS_MS });

    if (t.rolle === 'schueler') {
      const kursWunsch = (() => {
        try {
          return new URL(ziel, 'http://x').searchParams.get('kurs');
        } catch {
          return null;
        }
      })();
      const r = svc.verbund.schuelerAnmelden(t, { kursWunsch });
      if (r.fehler) {
        return seite(res, 403, 'Kein Zugang', r.fehler === 'gesperrt' ? 'Dein Kurs ist auf dieser Plattform gerade gesperrt. Frag deine Lehrkraft.' : 'Kein Zugang – deine Lehrkraft hat diese Plattform für deinen Kurs nicht freigeschaltet.', [['/gast', '👀 Gastmodus'], [konfig.portal + '/', '⌂ Zum Portal']]);
      }
      h.clearLehrkraft(req, res);
      h.setSchuelerCookie(req, res, r, { portal: true });
      hinweis('s');
      return res.redirect(302, ziel === '/' ? '/spiel' : ziel);
    }
    const r = svc.verbund.lehrkraftAnmelden(t);
    if (r.fehler) return seite(res, 403, 'Konto deaktiviert', 'Ihr Konto ist auf dieser Plattform deaktiviert. Bitte wenden Sie sich an den Administrator.', [['/', 'Zur Startseite']]);
    h.clearSchueler(req, res);
    h.setLehrkraftCookie(req, res, r, { portal: true });
    hinweis('l');
    res.redirect(302, ziel === '/' ? '/lehrer' : ziel);
  });

  // „Überall abmelden“: eigene Sitzung beenden, dann Abmeldung am Portal (das zurück auf die Startseite leitet)
  app.get('/sso/abmelden', (req, res) => {
    res.set('Cache-Control', 'no-store');
    h.clearSchueler(req, res);
    h.clearLehrkraft(req, res);
    S.clearCookie(req, res, HINWEIS_COOKIE);
    if (!konfig.portal) return res.redirect(302, '/');
    res.redirect(302, `${konfig.portal}/sso/abmelden?ruecksprung=${encodeURIComponent(basis(req) + '/')}`);
  });

  /** Geschützte Seite ohne Sitzung: still über das Portal neu anmelden (Modus „portal“ oder zuletzt über das Portal angemeldet). */
  function stillAnmelden(art) {
    return (req, res, next) => {
      if (!konfig.sso) return next();
      const angemeldet = art === 's' ? h.schueler(req) : h.lehrkraft(req);
      if (angemeldet) return next();
      const c = S.parseCookies(req.headers.cookie)[HINWEIS_COOKIE];
      if (konfig.modus === 'portal' || c === art) return res.redirect(302, `/sso/start?ziel=${encodeURIComponent(req.originalUrl)}`);
      next();
    };
  }

  /* ---------- Verbund-API ---------- */

  const api = express.Router();
  api.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (!verbundLimit.take('ip:' + req.ip)) return res.status(429).json({ error: 'Zu viele Anfragen.' });
    next();
  });
  api.use(express.json({ limit: '100kb' }));

  function verbund(zweck) {
    return (req, res, next) => {
      const m = /^Bearer (\S+)$/.exec(req.get('authorization') || '');
      const p = konfig.sso && m ? pruefe(m[1], konfig.schluessel, { iss: konfig.portal, aud: konfig.id, maxDauerSek: 60, jetztSek: jetztSek() }) : { ok: false };
      const ok = p.ok && p.nutzlast.sub === 'portal' && p.nutzlast.zweck === zweck && verbundJti.merke(p.nutzlast.jti, p.nutzlast.exp, jetztSek());
      if (!ok) return res.status(401).json({ error: 'Token ungültig.' });
      next();
    };
  }

  api.post('/loeschen', verbund('loeschen'), (req, res) => res.json({ geloescht: svc.verbund.loeschen(req.body) }));
  api.get('/kurse/:kursId/uebersicht', verbund('kurs-uebersicht'), (req, res) => {
    const u = svc.verbund.uebersicht(req.params.kursId);
    if (!u) return res.status(404).json({ error: 'Kurs unbekannt.' });
    res.json(u);
  });
  api.post('/kurse/:kursId', verbund('kurs-aendern'), (req, res) => res.json(svc.verbund.kursAendern(req.params.kursId, req.body)));
  api.use((req, res) => res.status(404).json({ error: 'Unbekannte Verbund-Route.' }));
  app.use('/api/verbund', api);

  return { stillAnmelden, HINWEIS_COOKIE };
}

module.exports = { ssoRoutes, sicheresZiel, STATE_COOKIE, HINWEIS_COOKIE };
