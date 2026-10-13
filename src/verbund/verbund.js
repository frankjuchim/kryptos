'use strict';
// Kern-Kandidat lab-kern: Verbund-API (Portal → Plattform, VERTRAG §6, TECHNIK §6.7–§6.8).
//   POST /api/verbund/loeschen                  zweck „loeschen“         { sub } oder { kurs } → { geloescht: n }
//   GET  /api/verbund/kurse/:kursId/uebersicht  zweck „kurs-uebersicht“  Kennzahlen (TECHNIK §6.8), 404 unbekannt
//   POST /api/verbund/kurse/:kursId             zweck „kurs-aendern“     { name?, aktiv? } → { ok: true }
// Wird in app.js VOR dem allgemeinen API-Router eingehängt: keine Origin-Prüfung (serverseitige Aufrufe), Cache-Control:
// no-store. Reihenfolge je Route: Tokenprüfung → Rate-Limit → JSON (100 kB) → Handler. Rate-Limits: gültige
// Portal-Aufträge 600 je 10 Minuten (gesamt), abgelehnte Anfragen 120 je 10 Minuten je IP (danach 429) – eine Flut ohne
// gültiges Token verbraucht so nie das Kontingent der echten Löschaufträge; der Body wird erst nach der Prüfung gelesen.
// Jede Token-Verletzung → 401 { error: 'Token ungültig.' } ohne Details; Tokens werden nie geloggt.

const express = require('express');
const S = require('../security');
const { pruefe } = require('../jwt');
const L = require('./loeschen');

const MAX_DAUER_SEK = 60;
const ZWECKE = ['loeschen', 'kurs-uebersicht', 'kurs-aendern'];

const istObjekt = (b) => !!b && typeof b === 'object' && !Array.isArray(b);

/**
 * @param {object} o
 * @param {import('better-sqlite3').Database} o.db
 * @param {object} o.svc        Dienste (auswertung.kursUebersicht)
 * @param {object} o.konfig     Verbund-Konfiguration (ladeKonfig)
 * @param {Function} o.now      Uhr (ms)
 * @param {Function} [o.szenarioBeenden]  (db, szenarioId, jetztIso) – beendet ein laufendes Funkraum-Szenario beim
 *   Sperren des Kurses mit Auswertung (Funkraum-Dienst, Plan M7 E111); ohne: generisch (loeschen.kursInhalteBeenden)
 * @returns {import('express').Router}
 */
function createVerbundRouter({ db, svc, konfig, now, szenarioBeenden }) {
  const r = express.Router();
  const limit = new S.Limiter({ max: 600, windowMs: 10 * 60 * 1000 }); // gültige Aufträge (gesamt)
  const abgelehntLimit = new S.Limiter({ max: 120, windowMs: 10 * 60 * 1000 }); // abgelehnte Anfragen je IP
  const json = express.json({ limit: '100kb' });
  const jetztSek = () => Math.floor(now() / 1000);
  const jtiMerken = db.prepare('INSERT INTO sso_jti (jti, exp) VALUES (?, ?) ON CONFLICT(jti) DO NOTHING');
  const jtiAufraeumen = db.prepare('DELETE FROM sso_jti WHERE exp < ?');

  r.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  const zuViele = (res, l, key) => {
    res.set('Retry-After', String(l.retryAfterSec(key, now())));
    return res.status(429).json({ error: 'Zu viele Anfragen.' });
  };
  /** Abgelehnte Anfrage: je IP zählen; über dem Limit 429 statt 401. */
  const abgelehnt = (req, res) => {
    const key = 'ip:' + req.ip;
    if (abgelehntLimit.isBlocked(key, now())) return zuViele(res, abgelehntLimit, key);
    abgelehntLimit.hit(key, now());
    return res.status(401).json({ error: 'Token ungültig.' });
  };
  const fehler400 = (res, text) => res.status(400).json({ error: text });

  /**
   * Middleware-Kette: Bearer-Token des Portals mit passendem zweck, sub „portal“, jti einmalig (sso_jti, Präfix „v:“);
   * danach Rate-Limit der gültigen Aufträge und erst dann der JSON-Parser.
   */
  function verbund(zweck) {
    if (!ZWECKE.includes(zweck)) throw new Error(`unbekannter zweck ${zweck}`);
    const pruefen = (req, res, next) => {
      if (!konfig.portalUrl || !konfig.schluessel || !konfig.schluessel.length) return abgelehnt(req, res);
      const m = /^Bearer ([A-Za-z0-9_.-]{1,8192})$/.exec(req.get('authorization') || '');
      if (!m) return abgelehnt(req, res);
      const p = pruefe(m[1], konfig.schluessel, { iss: konfig.portalUrl, aud: konfig.plattformId, maxDauerSek: MAX_DAUER_SEK, jetztSek: jetztSek() });
      if (!p.ok) return abgelehnt(req, res);
      const t = p.nutzlast;
      if (t.sub !== 'portal' || t.zweck !== zweck) return abgelehnt(req, res);
      jtiAufraeumen.run(jetztSek() - 60);
      if (jtiMerken.run('v:' + t.jti, t.exp).changes !== 1) return abgelehnt(req, res);
      if (!limit.take('gesamt', now())) return zuViele(res, limit, 'gesamt');
      next();
    };
    return [pruefen, json];
  }

  /** :kursId (Express dekodiert k%3A17) → „k:17“ oder null. */
  const kursParam = (req) => (L.KURS_MUSTER.test(req.params.kursId) ? req.params.kursId : null);

  r.post('/loeschen', verbund('loeschen'), (req, res) => {
    const b = req.body;
    if (!istObjekt(b)) return fehler400(res, 'Bitte sub oder kurs angeben.');
    const hatSub = b.sub !== undefined;
    const hatKurs = b.kurs !== undefined;
    if (hatSub === hatKurs) return fehler400(res, 'Bitte genau eins angeben: sub oder kurs.');
    if (hatSub) {
      if (typeof b.sub !== 'string' || !L.SUB_MUSTER.test(b.sub)) return fehler400(res, 'sub ungültig.');
      return res.json({ geloescht: L.nachSub(db, b.sub, { jetzt: new Date(now()).toISOString() }) });
    }
    if (typeof b.kurs !== 'string' || !L.KURS_MUSTER.test(b.kurs)) return fehler400(res, 'kurs ungültig.');
    res.json({ geloescht: L.nachKurs(db, b.kurs, { jetzt: new Date(now()).toISOString() }) });
  });

  r.get('/kurse/:kursId/uebersicht', verbund('kurs-uebersicht'), (req, res) => {
    const u = kursParam(req) ? svc.auswertung.kursUebersicht(kursParam(req)) : null;
    if (!u) return res.status(404).json({ error: 'Kurs unbekannt.' });
    res.json(u);
  });

  r.post('/kurse/:kursId', verbund('kurs-aendern'), (req, res) => {
    const kursId = kursParam(req);
    if (!kursId) return fehler400(res, 'Kurs-ID ungültig.');
    const b = req.body === undefined ? {} : req.body;
    if (!istObjekt(b)) return fehler400(res, 'Ungültige Anfrage.');
    let name;
    if (b.name !== undefined) {
      if (typeof b.name !== 'string' || b.name.trim().length < 1 || b.name.trim().length > 80) return fehler400(res, 'name muss 1–80 Zeichen lang sein.');
      name = b.name.trim();
    }
    if (b.aktiv !== undefined && typeof b.aktiv !== 'boolean') return fehler400(res, 'aktiv muss true oder false sein.');
    const jetzt = new Date(now()).toISOString();
    db.transaction(() => {
      const k = db.prepare('SELECT id, aktiv FROM kurse WHERE kurs_id = ?').get(kursId);
      if (!k) return; // unbekannt: wird beim nächsten SSO angelegt
      if (name !== undefined) db.prepare('UPDATE kurse SET name = ?, updated_at = ? WHERE id = ?').run(name, jetzt, k.id);
      if (b.aktiv !== undefined) {
        db.prepare('UPDATE kurse SET aktiv = ?, updated_at = ? WHERE id = ?').run(b.aktiv ? 1 : 0, jetzt, k.id);
        if (!b.aktiv) L.kursInhalteBeenden(db, k.id, jetzt, { szenarioBeenden });
      }
    })();
    if (b.aktiv === false) L.walLeeren(db); // geleerte Funkraum-/Arena-Inhalte auch aus dem WAL (Plan M7 Task 160)
    res.json({ ok: true });
  });

  r.use((req, res) => res.status(404).json({ error: 'Unbekannte Verbund-Route.' }));
  return r;
}

module.exports = { createVerbundRouter };
