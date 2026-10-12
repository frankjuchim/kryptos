'use strict';
// API für Lehrkräfte: Registrierung, Login, Passwort, Kurse, Schüler, Einstellungen, Auswertung, QR-Code, CSV.

const express = require('express');
const QRCode = require('qrcode');
const S = require('../security');
const V = require('../validate');

function lehrerRoutes(api, h) {
  const { svc } = h;
  const loginIp = new S.Limiter({ max: 20, windowMs: 15 * 60 * 1000 });
  const loginKonto = new S.Limiter({ max: 8, windowMs: 15 * 60 * 1000 });
  const registrierIp = new S.Limiter({ max: 5, windowMs: 60 * 60 * 1000 });

  const zuViele = (res, l, key, text) => {
    res.set('Retry-After', String(l.retryAfterSec(key)));
    return res.status(429).json({ error: text || 'Zu viele Versuche. Bitte später erneut versuchen.' });
  };

  /* ---------- Öffentlich ---------- */

  // AUTH_MODUS=portal: Registrierung und Anmeldung nur über das Portal InfoLabs
  const nurPortal = (req, res, next) => (h.konfig.lokal ? next() : res.status(403).json({ error: 'Die Anmeldung läuft über das Portal InfoLabs.', portal: true }));

  api.post('/lehrer/registrieren', nurPortal, async (req, res) => {
    const key = 'ip:' + req.ip;
    if (!registrierIp.take(key)) return zuViele(res, registrierIp, key, 'Zu viele Registrierungen von diesem Netzwerk. Bitte später erneut versuchen.');
    const konto = await svc.konten.registrieren(req.body);
    res.status(201).json({ ok: true, status: konto.status, hinweis: 'Danke! Ihre Anfrage wird vom Administrator geprüft. Sie können sich nach der Freigabe anmelden.' });
  });

  api.post('/lehrer/anmelden', nurPortal, async (req, res) => {
    const b = req.body || {};
    const ipKey = 'ip:' + req.ip;
    const kontoKey = 'm:' + String(b.email || '').trim().toLowerCase();
    if (loginIp.isBlocked(ipKey)) return zuViele(res, loginIp, ipKey);
    if (loginKonto.isBlocked(kontoKey)) return zuViele(res, loginKonto, kontoKey);
    let row;
    try {
      row = await svc.konten.anmelden(b.email, b.passwort, { superadminAktiv: h.superadminAktiv });
    } catch (e) {
      if (e.status === 401) {
        loginIp.hit(ipKey);
        loginKonto.hit(kontoKey);
      }
      throw e;
    }
    loginKonto.reset(kontoKey);
    h.setLehrkraftCookie(req, res, row);
    res.json({ ok: true, konto: svc.konten.ansicht(row) });
  });

  api.post('/lehrer/abmelden', (req, res) => {
    h.clearLehrkraft(req, res);
    res.json({ ok: true });
  });

  /* ---------- Angemeldet ---------- */

  const r = express.Router();
  r.use((req, res, next) => {
    const l = h.lehrkraft(req);
    if (!l) {
      if (req.sL) h.clearLehrkraft(req, res);
      return res.status(401).json({ error: 'Bitte als Lehrkraft anmelden.', anmelden: true });
    }
    req.lk = l;
    // Nach Einmal-Passwort: nur Passwortwechsel erlaubt
    const frei = ['/ich', '/passwort'];
    if (l.muss_pw_aendern && !frei.includes(req.path)) {
      return res.status(403).json({ error: 'Bitte zuerst ein neues Passwort festlegen.', mussPasswortAendern: true });
    }
    next();
  });

  r.get('/ich', (req, res) => res.json(svc.konten.ansicht(req.lk)));
  r.post('/passwort', async (req, res) => {
    const b = req.body || {};
    const row = await svc.konten.passwortAendern(req.lk.id, b.alt, b.neu);
    h.setLehrkraftCookie(req, res, row);
    res.json({ ok: true, konto: svc.konten.ansicht(row) });
  });

  /** Inhaltsübersicht (für Einstellungen/Auswertung). */
  r.get('/inhalte', (req, res) => {
    const welten = [...svc.inhalte.katalog.welten.values()].map((w) => ({
      nr: w.nr,
      titel: w.titel,
      farbe: w.farbe,
      levels: w.levels.map((l) => ({ id: l.id, nr: l.nr, titel: l.titel, aufgaben: l.aufgaben.length, maxPunkte: l.maxPunkte })),
      boss: w.boss ? { titel: w.boss.titel, pool: w.boss.pool.length, anzahl: w.boss.anzahl, dauerMin: w.boss.dauerMin } : null,
      maxPunkte: w.maxPunkte
    }));
    res.json({ welten });
  });

  /** Aufgaben-Vorschau mit Lösungen (nur Lehrkräfte/Superadmin). */
  // Materialien zum Download (Lösungen, Präsentationen, Lehrerhinweise, Klausuren) – nur für Lehrkräfte
  r.get('/materialien', (req, res) => res.json(h.material.uebersicht() || { allgemein: [], welten: [] }));
  r.get('/vorschau', (req, res) => res.json({ welten: svc.inhalte.vorschauWelten() }));
  r.get('/vorschau/:id', (req, res) => res.json(svc.inhalte.vorschauAufgabe(req.params.id)));

  const kid = (req) => V.id(req.params.kursId, 'Kurs');
  const sid = (req) => V.id(req.params.schuelerId, 'Schüler');

  r.get('/kurse', (req, res) => res.json(svc.kurse.kursListe(req.lk)));
  r.post('/kurse', (req, res) => res.status(201).json(svc.kurse.kursAnlegen(req.lk, req.body)));
  r.get('/kurse/:kursId', (req, res) => res.json(svc.kurse.kursFuer(req.lk, kid(req))));
  r.patch('/kurse/:kursId', (req, res) => res.json(svc.kurse.kursAendern(req.lk, kid(req), req.body)));
  r.delete('/kurse/:kursId', (req, res) => {
    svc.kurse.kursLoeschen(req.lk, kid(req), (req.body || {}).bestaetigung);
    res.json({ ok: true });
  });

  r.get('/kurse/:kursId/schueler', (req, res) => res.json(svc.auswertung.schuelerListe(req.lk, kid(req))));
  r.patch('/kurse/:kursId/schueler/:schuelerId', (req, res) => res.json(svc.kurse.umbenennen(req.lk, kid(req), sid(req), (req.body || {}).name)));
  r.post('/kurse/:kursId/schueler/:schuelerId/neuer-code', (req, res) => res.json(svc.kurse.neuerCode(req.lk, kid(req), sid(req))));
  r.delete('/kurse/:kursId/schueler/:schuelerId', (req, res) => {
    svc.kurse.schuelerLoeschen(req.lk, kid(req), sid(req));
    res.json({ ok: true });
  });
  r.post('/kurse/:kursId/alle-schueler-loeschen', (req, res) => res.json(svc.kurse.alleSchuelerLoeschen(req.lk, kid(req), (req.body || {}).bestaetigung)));

  r.get('/kurse/:kursId/scoreboard', (req, res) => {
    const k = svc.kurse.kursFuer(req.lk, kid(req));
    const welt = req.query.welt === undefined || req.query.welt === '' ? null : V.int(req.query.welt, 'Welt', { min: 0, max: 9 });
    res.json({ welt, liste: svc.lernen.scoreboard(k.id, welt) });
  });
  r.get('/kurse/:kursId/urkunden', (req, res) => res.json(svc.auswertung.urkunden(req.lk, kid(req))));
  r.get('/kurse/:kursId/auswertung', (req, res) => res.json(svc.auswertung.auswertung(req.lk, kid(req))));
  r.get('/kurse/:kursId/export.csv', (req, res) => {
    const art = ['uebersicht', 'matrix', 'aufgaben'].includes(req.query.art) ? req.query.art : 'uebersicht';
    const { kurs, text } = svc.auswertung.exportCsv(req.lk, kid(req), art);
    const safe = kurs.name.replace(/[^A-Za-z0-9_-]+/g, '_').slice(0, 40) || 'kurs';
    res.set('Content-Type', 'text/csv; charset=utf-8');
    res.set('Content-Disposition', `attachment; filename="algoquest-lab_${art}_${safe}.csv"`);
    res.send(text);
  });

  /** Beitritts-Link als QR-Code (serverseitig als SVG erzeugt). */
  r.get('/kurse/:kursId/qr.svg', async (req, res) => {
    const k = svc.kurse.kursFuer(req.lk, kid(req));
    const url = `${req.protocol}://${req.get('host')}/k/${k.code}`;
    const svg = await QRCode.toString(url, { type: 'svg', margin: 2, errorCorrectionLevel: 'M', color: { dark: '#000000', light: '#ffffff' } });
    res.set('Content-Type', 'image/svg+xml; charset=utf-8');
    res.send(svg);
  });

  api.use('/lehrer', r);
}

module.exports = { lehrerRoutes };
