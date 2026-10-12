'use strict';
// API für den Superadmin (Konto a:<n> aus dem Portal): Backup/Restore (JSON), Warm-up-Import, Inhalte neu laden.
// Lehrkraft-Verwaltung und Einmal-Passwort gibt es in Kryptos nicht (Portal, TECHNIK §6.5).

const express = require('express');

function adminRoutes(api, h) {
  const { svc } = h;
  const r = express.Router();
  r.use((req, res, next) => {
    const l = h.lehrkraft(req);
    if (!l) return res.status(401).json({ error: 'Bitte anmelden.', anmelden: true });
    if (l.konto.rolle !== 'superadmin') return res.status(403).json({ error: 'Nur für den Superadmin.' });
    req.lk = l;
    next();
  });

  r.get('/backup', (req, res) => {
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
    res.set('Content-Disposition', `attachment; filename="kryptos_backup_${stamp}.json"`);
    res.json(svc.daten.exportieren());
  });
  r.post('/restore', (req, res) => {
    const counts = svc.daten.wiederherstellen(req.body);
    res.json({ ok: true, counts });
  });

  r.get('/katas', (req, res) => res.json(svc.kata.liste({ welt: req.query.welt, kategorie: req.query.kategorie })));
  r.post('/katas/import', (req, res) => res.json(svc.kata.importieren(req.body)));
  r.delete('/katas/:kataId', (req, res) => {
    svc.kata.loeschen(req.params.kataId);
    res.json({ ok: true });
  });

  r.get('/inhalte', (req, res) => {
    const k = svc.inhalte.katalog;
    res.json({
      bericht: svc.inhalte.bericht,
      welten: [...k.welten.values()].map((w) => ({ nr: w.nr, titel: w.titel, levels: w.levels.length, aufgaben: w.aufgabenAnzahl, bossPool: w.boss ? w.boss.pool.length : 0, maxPunkte: w.maxPunkte })),
      katas: svc.kata.meta()
    });
  });
  r.post('/inhalte/neu-laden', (req, res) => {
    const e = h.reload();
    res.json({ ok: true, bericht: e.welten, kata: e.kata });
  });

  api.use('/admin', r);
}

module.exports = { adminRoutes };
