/* Kryptos – Funkraum-Szenario „Schlüsseltausch vor Eves Augen“ (W4 §9.3, Plan M7 Task 140, E95, E98). Nur Regeln
   dieses Typs; Zustandsautomat, Sichtbarkeits-Grundregeln, Versionen, Grenzen und Löschung macht der Dienst (dienst.js).
   Runde 1 (p = 23, g = 5) und Runde 2 (p = 101, g = 2) für alle Paare. Alice/Bob senden ihren öffentlichen Wert als
   Kanal-Nachricht („A 17“), melden K verdeckt an die Spielleitung (nur Regie sieht es); Eve gibt je Paar und Runde einen
   Tipp ab – ohne Rückmeldung (sonst wäre der Server ein Orakel, E95). Wahres K = B^(dlog_g A) mod p über Krypto.dh /
   Krypto.modpow; die Geheimzahlen a, b kennt der Server nie. */
'use strict';
const V = require('../../../validate');
const { SZENARIEN } = require('../szenarien');

const PARAMETER = SZENARIEN.schluesseltausch.parameter;
const RUNDEN = Object.keys(PARAMETER); // ['runde-1', 'runde-2']

/** 'runde-2' → 2, sonst null */
function rundeVon(phase) {
  const i = RUNDEN.indexOf(phase);
  return i < 0 ? null : i + 1;
}
const parameter = (runde) => PARAMETER[RUNDEN[runde - 1]];
/** bisher erreichte Runden (Auflösung: alle) */
function runden(sz) {
  const r = rundeVon(sz.phase);
  return r === null ? RUNDEN.map((_, i) => i + 1) : Array.from({ length: r }, (_, i) => i + 1);
}

/** aktuelle Runde mit Parametern oder 409 */
function laufendeRunde(sz) {
  const r = rundeVon(sz.phase);
  if (r === null) throw new V.ConflictError('In dieser Phase wird nicht getauscht.');
  return { runde: r, ...parameter(r) };
}

function ganzzahl(wert, min, max, text) {
  if (!Number.isInteger(wert) || wert < min || wert > max) throw new V.ValidationError(text);
  return wert;
}

/** je Paar und Runde { m: Meldung, tipps: alle Eve-Tipps mit Zeit } */
function meldungenIntern(ctx, sz) {
  const rollen = ctx.rollen();
  const eves = rollen.filter((r) => r.rolle === 'eve');
  const out = [];
  for (const alice of rollen.filter((r) => r.rolle === 'alice')) {
    const bob = rollen.find((r) => r.team_id === alice.partner_id) || { zustand: {} };
    for (const runde of runden(sz)) {
      const { p, g } = parameter(runde);
      const A = ((alice.zustand.oeffentlich || {})[runde]) ?? null;
      const B = ((bob.zustand.oeffentlich || {})[runde]) ?? null;
      let kWahr = null;
      if (A !== null && B !== null) {
        const a = ctx.krypto.dh.dlogKlein(g, A, p);
        kWahr = a === null ? null : ctx.krypto.modpow(B, a, p);
      }
      const zeitAB = Math.max(Date.parse(((alice.zustand.oeffentlichZeit || {})[runde]) || 0), Date.parse(((bob.zustand.oeffentlichZeit || {})[runde]) || 0));
      const tipps = eves.map((e) => {
        const t = (((e.zustand.tipps || {})[runde]) || {})[alice.team_id];
        return t ? { team: e.team_id, k: t.k, richtig: kWahr !== null && t.k === kWahr, sekunden: Math.max(0, Math.round((Date.parse(t.zeit) - zeitAB) / 1000)) } : null;
      });
      const m = {
        paar: alice.team_id,
        runde,
        kAlice: ((alice.zustand.k || {})[runde]) ?? null,
        kBob: ((bob.zustand.k || {})[runde]) ?? null,
        kWahr,
        eve: tipps[0] ? { k: tipps[0].k, richtig: tipps[0].richtig } : null
      };
      if (eves.length > 1) m.eve2 = tipps[1] ? { k: tipps[1].k, richtig: tipps[1].richtig } : null;
      out.push({ m, tipps: tipps.filter(Boolean) });
    }
  }
  return out;
}

/** Meldungen (nur Regie, Beamer ab Auflösung): K von Alice und Bob, wahres K, Eve-Tipp (eve2 nur bei zwei Eve-Teams) */
const meldungen = (ctx, sz) => meldungenIntern(ctx, sz).map((x) => x.m);

/** anonyme Auswertung je Paar und Runde: K gleich (Alice = Bob = wahres K), Eve richtig, Eves Zeit ab beiden Werten */
function auswertung(ctx, sz) {
  return meldungenIntern(ctx, sz).map(({ m, tipps }) => {
    const richtige = tipps.filter((t) => t.richtig);
    return {
      paar: m.paar,
      runde: m.runde,
      kGleich: m.kWahr !== null && m.kAlice === m.kWahr && m.kBob === m.kWahr,
      eveRichtig: richtige.length > 0,
      eveSekunden: richtige.length ? Math.min(...richtige.map((t) => t.sekunden)) : null
    };
  });
}

module.exports = {
  typ: 'schluesseltausch',
  /** nichts zu verteilen: Geheimzahlen ziehen die Teams auf Karten */
  start() {
    return {};
  },
  /** eigene Werte der aktuellen Runde (Alice/Bob: öffentlicher Wert, gemeldetes K; Eve: eigene Tipps) */
  ich(ctx, sz, rolle) {
    const r = rundeVon(sz.phase);
    const z = JSON.parse(rolle.zustand || '{}');
    if (r === null) return {};
    if (rolle.rolle === 'eve') return { tipps: Object.fromEntries(Object.entries(((z.tipps || {})[r]) || {}).map(([paar, t]) => [paar, t.k])) };
    return { oeffentlich: ((z.oeffentlich || {})[r]) ?? null, k: ((z.k || {})[r]) ?? null };
  },
  anzeigen(ctx, sz, sicht) {
    const r = rundeVon(sz.phase);
    const out = r === null ? { runde: null, p: null, g: null } : { runde: r, ...parameter(r) };
    if (sz.status === 'auswertung') return out;
    // K-Meldungen und Tipps: Regie immer, Beamer erst in der Auflösung (E99)
    if (sicht === 'regie' || (sicht === 'beamer' && sz.phase === 'aufloesung')) out.meldungen = meldungen(ctx, sz);
    if (sicht !== 'schueler' && sz.phase === 'aufloesung') out.auswertung = auswertung(ctx, sz);
    return out;
  },
  /** öffentlicher Wert wie eine Nachricht: Stummschaltung und 1 je Team in 10 s; K-Meldungen wie Prüfversuche */
  grenzen: { oeffentlich: 'senden', 'k-melden': { max: 30, ms: 5 * 60 * 1000, text: 'Zu viele Meldungen – höchstens 30 in 5 Minuten.' } },
  aktionen: {
    /** POST /api/funk/:id/oeffentlich { wert } (Alice/Bob): Kanal-Nachricht „A 17“ an den Partner, letzter Wert zählt */
    oeffentlich(ctx, sz, b, body) {
      const { runde, p } = laufendeRunde(sz);
      const wert = ganzzahl(body.wert, 1, p - 1, `Der öffentliche Wert liegt zwischen 1 und ${p - 1} (p − 1).`);
      const z = ctx.zustand(b.teamId) || {};
      const v = ctx.neueVersion();
      const nid = ctx.neueNachricht({ von: b.teamId, an: b.partner, schuelerId: b.schuelerId, art: 'oeffentlich', inhalt: `${b.rolle === 'alice' ? 'A' : 'B'} ${wert}` }, v);
      ctx.setzeZustand(b.teamId, { ...z, oeffentlich: { ...(z.oeffentlich || {}), [runde]: wert }, oeffentlichZeit: { ...(z.oeffentlichZeit || {}), [runde]: ctx.iso() } });
      ctx.ereignis('gesendet', { nachricht: nid, von: b.teamId, an: b.partner }, v);
      ctx.ereignis('oeffentlich', { team: b.teamId, runde }, v);
      return { ok: true, nachricht: nid };
    },
    /** POST /api/funk/:id/k-melden { k } (Alice/Bob): K verdeckt an die Spielleitung, ohne Bewertung */
    'k-melden'(ctx, sz, b, body) {
      const { runde, p } = laufendeRunde(sz);
      const k = ganzzahl(body.k, 0, p - 1, `K liegt zwischen 0 und ${p - 1}.`);
      const z = ctx.zustand(b.teamId) || {};
      const v = ctx.neueVersion();
      ctx.setzeZustand(b.teamId, { ...z, k: { ...(z.k || {}), [runde]: k } });
      ctx.ereignis('k-gemeldet', { team: b.teamId, runde }, v);
      return { ok: true };
    },
    /** POST /api/funk/:id/knacken { paar, k } (Eve): ein Tipp je Paar und Runde, überschreibbar, OHNE richtig (E95) */
    knacken(ctx, sz, b, body) {
      const { runde, p } = laufendeRunde(sz);
      const paar = body.paar;
      if (!ctx.rollen().some((r) => r.rolle === 'alice' && r.team_id === paar)) throw new V.ValidationError('Dieses Paar gibt es nicht.');
      const k = ganzzahl(body.k, 0, p - 1, `K liegt zwischen 0 und ${p - 1}.`);
      const z = ctx.zustand(b.teamId) || {};
      const tipps = { ...(z.tipps || {}) };
      tipps[runde] = { ...(tipps[runde] || {}), [paar]: { k, zeit: ctx.iso() } };
      const v = ctx.neueVersion();
      ctx.setzeZustand(b.teamId, { ...z, tipps });
      ctx.ereignis('tipp', { team: b.teamId, paar, runde }, v);
      return { ok: true };
    }
  },
  /** Modulo-Uhr nur mit Reiter „uhr“ (keine Wertetabelle → kein dlog, E98), Parameter der Runde */
  werkzeuge(sz) {
    const r = rundeVon(sz.phase) || RUNDEN.length;
    const { p, g } = parameter(r);
    return [{ id: 'modulo', voreinstellung: { reiter: ['uhr'], modul: p, g } }];
  },
  auswertung
};
