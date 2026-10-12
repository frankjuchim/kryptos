'use strict';
// API für den Superadmin: Anfragen bestätigen/ablehnen, Lehrkräfte verwalten, Einmal-Passwort,
// Backup/Restore (JSON), Kata-Import, Inhalte neu laden.

const express = require('express');
const V = require('../validate');

function adminRoutes(api, h) {
  const { svc } = h;
  const r = express.Router();
  r.use((req, res, next) => {
    const l = h.lehrkraft(req);
    if (!l) return res.status(401).json({ error: 'Bitte anmelden.', anmelden: true });
    if (l.rolle !== 'superadmin') return res.status(403).json({ error: 'Nur für den Superadmin.' });
    req.lk = l;
    next();
  });

  const lid = (req) => V.id(req.params.id, 'Lehrkraft');

  r.get('/lehrkraefte', (req, res) => res.json(svc.konten.liste()));
  r.post('/lehrkraefte/:id/status', (req, res) => {
    const status = (req.body || {}).status;
    if (!['aktiv', 'abgelehnt', 'deaktiviert'].includes(status)) throw new V.ValidationError('status muss aktiv, abgelehnt oder deaktiviert sein.');
    res.json(svc.konten.setzeStatus(lid(req), status));
  });
  r.post('/lehrkraefte/:id/einmalpasswort', async (req, res) => res.json(await svc.konten.einmalPasswort(lid(req))));
  r.delete('/lehrkraefte/:id', (req, res) => {
    svc.konten.loeschen(lid(req));
    res.json({ ok: true });
  });

  r.get('/backup', (req, res) => {
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
    res.set('Content-Disposition', `attachment; filename="algoquest-lab_backup_${stamp}.json"`);
    res.json(svc.daten.exportieren());
  });
  r.post('/restore', (req, res) => {
    const counts = svc.daten.wiederherstellen(req.body);
    // Superadmin aus der Umgebung sicherstellen (falls das Backup ein anderes Passwort enthält)
    h.sichereAdmin();
    res.json({ ok: true, counts });
  });

  // Verbund Phase 2: Zuordnung aus dem Portal einspielen ({ zuordnung, probelauf })
  r.post('/verbund/zuordnung', (req, res) => {
    const b = req.body || {};
    res.json(svc.verbund.zuordnungEinspielen(b.zuordnung, { plattformId: h.konfig.id, portal: h.konfig.portal, probelauf: b.probelauf !== false }));
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
