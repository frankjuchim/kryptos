'use strict';
// Kryptolabor: Freigaben je Schüler (TECHNIK §10.3) – GET /api/labor { boss, niveau, welten, werkzeuge } (welten/niveau:
// Reiter-Regeln im Client, Plan M6 E71). Die Werkzeuge selbst sind Client-Module;
// Texte zu den Gründen macht der Client (M4 Task 53).
//   grund: null (frei) · 'lehrkraft' (in den Kurseinstellungen gesperrt) · 'welt' (auto, Welt nicht freigeschaltet) ·
//          'boss' (Boss-Kampf läuft: alle Werkzeuge gesperrt)

const { WERKZEUGE } = require('./werkzeuge');

/**
 * @param {{ db: import('better-sqlite3').Database, svc: object, now: () => number }} o
 */
function createLabor({ db, svc, now }) {
  const laufenderBoss = db.prepare('SELECT 1 FROM boss_versuche WHERE schueler_id = ? AND ende_at IS NULL AND deadline_at > ? LIMIT 1');

  /** Freigaben für eine Teilnahme (Zeile aus schueler). */
  function freigaben(s) {
    const einst = svc.kurse.einstellungen(svc.kurse.kursRow(s.kurs_id).einstellungen);
    const boss = !!laufenderBoss.get(s.id, new Date(now()).toISOString());
    const werkzeuge = WERKZEUGE.map(({ id, titel, welt }) => {
      const einstellung = einst.werkzeuge[id]; // 'frei' | 'gesperrt' | undefined (= auto)
      let grund = null;
      if (boss) grund = 'boss';
      else if (einstellung === 'gesperrt') grund = 'lehrkraft';
      else if (einstellung !== 'frei' && !svc.stand.istFrei(einst, welt)) grund = 'welt';
      return { id, titel, welt, frei: grund === null, grund };
    });
    // M6 E71: freigeschaltete Welten (aufsteigend) und Niveau des Kurses für die Reiter-Regeln im Client
    const welten = [...new Set((Array.isArray(einst.welten) ? einst.welten : []).filter((nr) => Number.isInteger(nr) && svc.stand.istFrei(einst, nr)))].sort((a, b) => a - b);
    return { boss, niveau: einst.niveau === 'gA' ? 'gA' : 'eA', welten, werkzeuge };
  }

  /** GET /api/labor – nur Schüler; Antworten ohne Sitzung wie die Kern-Schülerrouten (401 bzw. 403 gesperrt). */
  function routen(api, h) {
    api.get('/labor', (req, res) => {
      const s = h.schueler(req, res);
      if (!s) {
        if (h.gesperrt(req)) return res.status(403).json({ error: 'Kryptos ist für deinen Kurs abgeschaltet.' });
        if (req.sS) h.clearSchueler(req, res);
        return res.status(401).json({ error: 'Bitte melde dich an.', anmelden: true, sso: '/sso/start' });
      }
      res.json(freigaben(s));
    });
  }

  return { freigaben, routen };
}

module.exports = { createLabor };
