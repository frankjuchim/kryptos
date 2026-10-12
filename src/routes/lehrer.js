'use strict';
// API für Lehrkräfte: Kurse (vom Portal), Einstellungen, Schülerliste, Auswertung, CSV, Vorschau, Materialien.
// Registrierung, Anmeldung, Passwort, Kurs anlegen/löschen, Schüler umbenennen/neuer Code/löschen und Beitritts-QR
// gibt es in Kryptos nicht (Anmeldung und Verwaltung über das Portal, TECHNIK §6.5).

const express = require('express');
const V = require('../validate');

function lehrerRoutes(api, h) {
  const { svc } = h;

  const r = express.Router();
  r.use((req, res, next) => {
    const l = h.lehrkraft(req);
    if (!l) {
      if (req.sL) h.clearLehrkraft(req, res);
      return res.status(401).json({ error: 'Bitte als Lehrkraft anmelden.', anmelden: true, sso: '/sso/start' });
    }
    req.lk = l;
    next();
  });

  r.get('/ich', (req, res) => res.json(svc.konten.ansicht(req.lk.konto)));

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

  r.get('/kurse', (req, res) => res.json(svc.kurse.kursListe(req.lk)));
  r.get('/kurse/:kursId', (req, res) => res.json(svc.kurse.kursFuer(req.lk, kid(req))));
  r.patch('/kurse/:kursId', (req, res) => res.json(svc.kurse.kursAendern(req.lk, kid(req), req.body)));

  r.get('/kurse/:kursId/schueler', (req, res) => res.json(svc.auswertung.schuelerListe(req.lk, kid(req))));

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
    res.set('Content-Disposition', `attachment; filename="kryptos_${art}_${safe}.csv"`);
    res.send(text);
  });

  api.use('/lehrer', r);
}

module.exports = { lehrerRoutes };
