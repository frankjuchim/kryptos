/* Kryptos – Funkraum-Szenario „Mallory im Netz“ (W5 §9.3, Plan M7 Task 141, E96, E115). Nur Regeln dieses Typs;
   Zustandsautomat, Grundregeln, Versionen, Grenzen und Löschung macht der Dienst (dienst.js).
   Simulation: Jedes Bob-Team hat eine Schlüsselnummer (S23, S27, …), Mallory eigene (S41/S42 bzw. S51/S52). Ein Umschlag
   „verschlüsselt für S23“ ist serverseitig verschlossen – lesbar nur für das Team, dem das Etikett gehört. Alle Sendungen
   laufen über Mallorys Station: weiterleiten, ersetzen (Inhalt nur bei eigenem Etikett, Schlüsselnummer unterschieben),
   eigene Schlüssel-Sendung „von Bob“ mit Zertifikat keins/eigenes/verändert. Ab Phase 2 stellt Trent (Lehrkraft)
   Zertifikate aus; Alices Tablet prüft Name und Siegel. Alice sendet nur ihre Auftragskarte (kein Freitext).
   Datenhaltung bis zum Beenden: konfig.etiketten/zertifikate/station, Alice-zustand.auftraege (Kartennummern),
   Mallory-zustand.bearbeitet/varianten; Etikett eines Umschlags in funk_nachrichten.fuer_schluessel. */
'use strict';
const V = require('../../../validate');
const T = require('../text');

const AUFTRAGSKARTEN = Object.freeze(['LIEFERE 5 KISTEN AN TOR 3', 'TREFFEN UM 14 UHR AM HAFEN', 'ZAHLE 20 TALER AN TEAM SKYTALE', 'OEFFNE LAGER 7 UM 9 UHR']);
const PHASEN = Object.freeze(['ohne-zertifikate', 'mit-zertifikaten']);
const ETIKETT = /^S\d{2}$/;
const ZERTIFIKATE = Object.freeze(['keins', 'eigenes', 'veraendert']);
const NICHT_OEFFNEN = 'Diesen Umschlag kannst du nicht öffnen.';

const zertifikatText = (teamName, etikett) => `ZERTIFIKAT ${T.grossName(teamName)} ${etikett} GUELTIG HEUTE`;

/** Lage des Szenarios aus Rollen und konfig */
function lage(ctx) {
  const rollen = ctx.rollen();
  const konfig = ctx.konfig();
  const etiketten = konfig.etiketten || {};
  const besitzer = {};
  for (const [team, liste] of Object.entries(etiketten)) for (const e of liste) besitzer[e] = Number(team);
  const mallorys = rollen.filter((r) => r.rolle === 'mallory');
  const varianten = {};
  const bearbeitet = new Set();
  for (const m of mallorys) {
    Object.assign(varianten, m.zustand.varianten || {});
    for (const id of m.zustand.bearbeitet || []) bearbeitet.add(id);
  }
  return { rollen, konfig, etiketten, besitzer, mallorys, malloryIds: new Set(mallorys.map((m) => m.team_id)), varianten, bearbeitet, rolle: (id) => rollen.find((r) => r.team_id === id) };
}

/** Phase, in der eine Sendung entstand (Version ihres gesendet-/weitergeleitet-/ersetzt-Ereignisses, E91) */
function entstehung(ctx) {
  const v = new Map();
  for (const e of ctx.ereignisse('gesendet')) v.set(e.daten.nachricht, e.version);
  for (const code of ['weitergeleitet', 'ersetzt']) for (const e of ctx.ereignisse(code)) v.set(e.daten.neu, e.version);
  return (n) => ctx.phaseZu(v.has(n.id) ? v.get(n.id) : n.version);
}

/** darf das Team den Umschlag lesen? (Etikett gehört ihm oder es ist Alices eigenes Original) */
function lesbarFuer(l, n, teamId) {
  if (n.art !== 'nachricht') return true;
  if (n.fuer_schluessel && l.besitzer[n.fuer_schluessel] === teamId) return true;
  const r = l.rolle(teamId);
  return n.von_team_id === teamId && !!r && r.rolle === 'alice';
}

const umschlag = (n) => `UMSCHLAG ${n.fuer_schluessel || ''}`.trim();

/** Zertifikatsstatus einer Schlüssel-Sendung beim Empfänger */
function zertifikat(ctx, l, n, phase) {
  const variante = l.varianten[n.id] || 'echt';
  if (phase !== 'mit-zertifikaten' || variante === 'keins') return { status: 'fehlt' };
  if (variante === 'eigenes') {
    const m = l.rolle(l.besitzer[n.inhalt]);
    return { status: 'name', text: zertifikatText(m ? m.name : '', n.inhalt) };
  }
  const angezeigt = l.rolle(n.angezeigt_von);
  if (variante === 'veraendert') return { status: 'siegel', text: zertifikatText(angezeigt ? angezeigt.name : '', n.inhalt) };
  const z = (l.konfig.zertifikate || {})[n.angezeigt_von];
  if (z === n.inhalt && angezeigt) return { status: 'gueltig', text: zertifikatText(angezeigt.name, n.inhalt) };
  return { status: 'fehlt' };
}

/** Ziel einer Sendung: Partner des behaupteten Absenders */
function ziel(l, n) {
  const r = l.rolle(n.angezeigt_von);
  return r ? r.partner_id : null;
}

/** wartende Sendungen einer Mallory-Station */
function station(ctx, l, malloryId) {
  return ctx.nachrichten().filter((n) => n.an_team_id === malloryId && n.sichtbar !== 0 && !l.bearbeitet.has(n.id));
}

/** Sendung unverändert weiterleiten (Mallory oder Regie „Station leeren“) → neue id */
function weiterleiten(ctx, l, n, malloryId, schuelerId, v) {
  const neu = ctx.neueNachricht({ von: malloryId, an: ziel(l, n), angezeigtVon: n.angezeigt_von, schuelerId, art: n.art, inhalt: n.inhalt, fuerSchluessel: n.fuer_schluessel }, v);
  const m = ctx.zustand(malloryId) || {};
  const varianten = { ...(m.varianten || {}) };
  if (l.varianten[n.id]) varianten[neu] = l.varianten[n.id];
  ctx.setzeZustand(malloryId, { ...m, bearbeitet: [...(m.bearbeitet || []), n.id], varianten });
  ctx.ereignis('weitergeleitet', { nachricht: n.id, neu }, v);
  return neu;
}

/** Weg einer Sendung über Weiterleiten/Ersetzen bis zur letzten Station → [ids] */
function weg(ctx, start) {
  const nach = new Map();
  for (const code of ['weitergeleitet', 'ersetzt']) for (const e of ctx.ereignisse(code)) nach.set(e.daten.nachricht, e.daten.neu);
  const ids = [start];
  while (nach.has(ids[ids.length - 1]) && ids.length < 50) ids.push(nach.get(ids[ids.length - 1]));
  return ids;
}

/** Zeilen je Alice-Team und Phase; mitTexten nur für Regie/Beamer in der Auflösung */
function zeilen(ctx, sz, mitTexten) {
  const l = lage(ctx);
  const phaseVon = entstehung(ctx);
  const alle = new Map(ctx.nachrichten().map((n) => [n.id, n]));
  const out = [];
  for (const alice of l.rollen.filter((r) => r.rolle === 'alice')) {
    const bobEtiketten = l.etiketten[alice.partner_id] || [];
    for (const phase of PHASEN) {
      const originale = ctx.nachrichten().filter((n) => n.von_team_id === alice.team_id && n.art === 'nachricht' && phaseVon(n) === phase);
      const original = originale[originale.length - 1] || null;
      const ids = original ? weg(ctx, original.id) : [];
      const letzte = ids.length ? alle.get(ids[ids.length - 1]) : null;
      const zugestellt = !!letzte && letzte.an_team_id === alice.partner_id;
      const z = {
        team: alice.team_id,
        phase,
        gesendet: !!original,
        veraendert: zugestellt && letzte.inhalt !== original.inhalt,
        ueberMallory: !!original && l.malloryIds.has(l.besitzer[original.fuer_schluessel]),
        schluesselErsetzt: !!original && !bobEtiketten.includes(original.fuer_schluessel),
        gemeldet: zugestellt && !!letzte.angekommen
      };
      if (mitTexten) {
        z.original = original ? original.inhalt : null;
        z.empfangen = zugestellt ? letzte.inhalt : null;
        z.weg = ids.map((id) => alle.get(id)).filter(Boolean).map((n) => ({ nachricht: n.id, von: n.von_team_id, an: n.an_team_id, etikett: n.fuer_schluessel }));
      }
      out.push(z);
    }
  }
  return out;
}

function laufendePhase(sz) {
  if (!PHASEN.includes(sz.phase)) throw new V.ConflictError('Die Auflösung läuft – keine Sendungen mehr.');
}

module.exports = {
  typ: 'mallory',
  AUFTRAGSKARTEN,
  /** Alice sendet nur ihre Auftragskarte; der Inhalt kommt vom Server */
  textVomServer: true,
  /** verschlossene Umschläge: der Typ entscheidet auch über eigene Nachrichten */
  sichtVorrang: true,
  /** Start: Schlüsselnummern (E96), Station je Paar, Auftragskarten je Alice-Team und Phase (zufallBytes) */
  start(ctx, sz, rollen) {
    const alices = rollen.filter((r) => r.rolle === 'alice');
    const mallorys = rollen.filter((r) => r.rolle === 'mallory');
    const etiketten = {};
    const station = {};
    alices.forEach((a, i) => {
      if (a.partner_id) etiketten[a.partner_id] = [`S${23 + 4 * i}`];
      station[a.team_id] = mallorys[i % mallorys.length].team_id;
      if (a.partner_id) station[a.partner_id] = station[a.team_id];
    });
    mallorys.forEach((m, j) => {
      etiketten[m.team_id] = [`S${41 + 10 * j}`, `S${42 + 10 * j}`];
    });
    const zustaende = {};
    for (const a of alices) {
      const auftraege = {};
      for (const p of PHASEN) auftraege[p] = Buffer.from(ctx.zufallBytes(4)).readUInt32BE(0) % AUFTRAGSKARTEN.length;
      zustaende[a.team_id] = { auftraege };
    }
    return { konfig: { etiketten, station, zertifikate: {} }, zustaende };
  },
  ich(ctx, sz, rolle) {
    const l = lage(ctx);
    const z = JSON.parse(rolle.zustand || '{}');
    if (rolle.rolle === 'bob') {
      const etikett = (l.etiketten[rolle.team_id] || [])[0] || null;
      const zert = (l.konfig.zertifikate || {})[rolle.team_id] === etikett && etikett ? zertifikatText(rolle.name || (l.rolle(rolle.team_id) || {}).name, etikett) : null;
      return { etikett, zertifikat: zert };
    }
    if (rolle.rolle === 'mallory') {
      return {
        etiketten: l.etiketten[rolle.team_id] || [],
        station: station(ctx, l, rolle.team_id).map((n) => {
          const lesbar = lesbarFuer(l, n, rolle.team_id);
          return { id: n.id, art: n.art, inhalt: lesbar ? n.inhalt : umschlag(n), lesbar, etikett: n.fuer_schluessel, von: n.von_team_id, angezeigtVon: n.angezeigt_von, ziel: ziel(l, n) };
        })
      };
    }
    if (rolle.rolle !== 'alice') return {};
    const phaseVon = entstehung(ctx);
    const nr = PHASEN.includes(sz.phase) && z.auftraege ? z.auftraege[sz.phase] : undefined;
    return {
      auftrag: nr === undefined ? null : AUFTRAGSKARTEN[nr],
      schluessel: ctx
        .nachrichten()
        .filter((n) => n.an_team_id === rolle.team_id && n.art === 'schluessel' && n.sichtbar !== 0)
        .map((n) => {
          const phase = phaseVon(n);
          return { nachricht: n.id, etikett: n.inhalt, von: n.angezeigt_von, phase, zertifikat: zertifikat(ctx, l, n, phase) };
        })
    };
  },
  /** Sicht: nur Beteiligte; Umschläge lesbar nur mit eigenem Etikett (Beamer erst in der Auflösung) */
  sicht(ctx, sz, n, betrachter) {
    const l = lage(ctx);
    if (betrachter.art === 'beamer') {
      if (n.art !== 'nachricht' || sz.phase === 'aufloesung') return { sichtbar: true, lesbar: true };
      return { sichtbar: true, lesbar: false, inhalt: umschlag(n) };
    }
    if (n.von_team_id !== betrachter.teamId && n.an_team_id !== betrachter.teamId) return { sichtbar: false };
    return lesbarFuer(l, n, betrachter.teamId) ? { sichtbar: true, lesbar: true } : { sichtbar: true, lesbar: false, inhalt: umschlag(n) };
  },
  /** Mallorys Eingriffe sehen Alice, Bob und der Beamer (vor der Auflösung) nicht im Ticker */
  ereignisSicht(ctx, sz, e, betrachter) {
    if (betrachter.art === 'regie') return true;
    const d = JSON.parse(e.daten || '{}');
    const l = lage(ctx);
    const geheim = e.code === 'weitergeleitet' || e.code === 'ersetzt' || (e.code === 'gesendet' && l.malloryIds.has(d.von));
    if (!geheim) return true;
    if (betrachter.art === 'beamer') return sz.phase === 'aufloesung' || sz.status === 'auswertung';
    return l.malloryIds.has(betrachter.teamId);
  },
  anzeigen(ctx, sz, sicht) {
    if (sz.status === 'auswertung' || sicht === 'schueler' || sz.phase !== 'aufloesung') return {};
    return { auswertung: zeilen(ctx, sz, true) };
  },
  /** Bob: Schlüsselnummer wie eine Nachricht (1 je 10 s); Mallory leitet viele Sendungen weiter: 60 je 5 min */
  grenzen: { oeffentlich: 'senden', mallory: { max: 60, ms: 5 * 60 * 1000, text: 'Zu viele Eingriffe – höchstens 60 in 5 Minuten.' } },
  aktionen: {
    /** Alice: Auftragskarte der Phase im Umschlag für ein erhaltenes Etikett, an Mallorys Station */
    senden(ctx, sz, b, { body }) {
      laufendePhase(sz);
      const etikett = body.etikett;
      if (typeof etikett !== 'string' || !ETIKETT.test(etikett)) throw new V.ValidationError('Die Schlüsselnummer hat die Form S23.');
      const l = lage(ctx);
      const erhalten = ctx.nachrichten().some((n) => n.an_team_id === b.teamId && n.art === 'schluessel' && n.inhalt === etikett && n.sichtbar !== 0);
      if (!erhalten) throw new V.ValidationError('Diesen Schlüssel habt ihr nicht erhalten.');
      const nr = ((ctx.zustand(b.teamId) || {}).auftraege || {})[sz.phase];
      if (nr === undefined) throw new V.ConflictError('Euer Team hat keine Auftragskarte.');
      return { inhalt: AUFTRAGSKARTEN[nr], an: (l.konfig.station || {})[b.teamId], art: 'nachricht', fuerSchluessel: etikett, angezeigtVon: b.teamId };
    },
    /** Bob: eigene Schlüsselnummer veröffentlichen – die Sendung geht über Mallorys Station */
    oeffentlich(ctx, sz, b) {
      laufendePhase(sz);
      const l = lage(ctx);
      const etikett = (l.etiketten[b.teamId] || [])[0];
      const an = (l.konfig.station || {})[b.teamId];
      if (!etikett || !an) throw new V.ConflictError('Euer Team hat keine Schlüsselnummer.');
      const v = ctx.neueVersion();
      const nid = ctx.neueNachricht({ von: b.teamId, an, angezeigtVon: b.teamId, schuelerId: b.schuelerId, art: 'schluessel', inhalt: etikett }, v);
      ctx.ereignis('gesendet', { nachricht: nid, von: b.teamId, an }, v);
      return { ok: true, nachricht: nid };
    },
    /** Bob: lesbaren Umschlag als erhalten melden (kein Klartext nötig – die Simulation öffnet ihn) */
    empfangen(ctx, sz, b, body) {
      laufendePhase(sz);
      const nid = V.id(body.nachricht, 'Nachricht');
      const n = ctx.nachricht(nid);
      if (!n) throw new V.NotFoundError('Nachricht nicht gefunden.');
      if (n.an_team_id !== b.teamId || n.art !== 'nachricht') throw new V.ForbiddenError('Diese Nachricht ist nicht an euer Team.');
      if (!lesbarFuer(lage(ctx), n, b.teamId)) throw new V.ForbiddenError('Diesen Umschlag könnt ihr nicht öffnen.');
      if (!n.angekommen) {
        const v = ctx.neueVersion();
        ctx.aendereNachricht(nid, { angekommen: 1 }, v);
        ctx.ereignis('gemeldet', { team: b.teamId, nachricht: nid }, v);
      }
      return { ok: true };
    },
    /** Mallory: weiterleiten | ersetzen { text?, etikett? } | schluessel { an, etikett, zertifikat } */
    mallory(ctx, sz, b, body) {
      const aktion = body.aktion;
      if (!['weiterleiten', 'ersetzen', 'schluessel'].includes(aktion)) throw new V.ValidationError('Unbekannte Aktion.');
      // Eingaben zuerst (Whitelist für jeden Inhalt, Etiketten ^S\d{2}$)
      const text = body.text === undefined || body.text === null ? null : T.pruefeInhalt(body.text);
      const etikett = body.etikett === undefined || body.etikett === null ? null : body.etikett;
      if (etikett !== null && (typeof etikett !== 'string' || !ETIKETT.test(etikett))) throw new V.ValidationError('Die Schlüsselnummer hat die Form S23.');
      laufendePhase(sz);
      const l = lage(ctx);
      const eigene = l.etiketten[b.teamId] || [];
      if (aktion === 'schluessel') {
        const an = body.an;
        const alice = l.rolle(an);
        if (!alice || alice.rolle !== 'alice') throw new V.ValidationError('Schlüssel gehen nur an Alice-Teams.');
        if (!eigene.includes(etikett)) throw new V.ValidationError('Nur eigene Schlüssel kannst du unterschieben.');
        if (!ZERTIFIKATE.includes(body.zertifikat)) throw new V.ValidationError('Zertifikat: keins, eigenes oder veraendert.');
        if (body.zertifikat !== 'keins' && sz.phase !== 'mit-zertifikaten') throw new V.ConflictError('Zertifikate gibt es erst in Phase 2.');
        const v = ctx.neueVersion();
        const nid = ctx.neueNachricht({ von: b.teamId, an, angezeigtVon: alice.partner_id, schuelerId: b.schuelerId, art: 'schluessel', inhalt: etikett }, v);
        const m = ctx.zustand(b.teamId) || {};
        ctx.setzeZustand(b.teamId, { ...m, varianten: { ...(m.varianten || {}), [nid]: body.zertifikat } });
        ctx.ereignis('gesendet', { nachricht: nid, von: b.teamId, an }, v);
        return { ok: true, nachricht: nid };
      }
      const nid = V.id(body.nachricht, 'Nachricht');
      const n = ctx.nachricht(nid);
      if (!n || n.an_team_id !== b.teamId) throw new V.NotFoundError('Diese Sendung liegt nicht an deiner Station.');
      if (l.bearbeitet.has(n.id)) throw new V.ConflictError('Diese Sendung ist schon unterwegs.');
      if (n.sichtbar === 0) throw new V.ConflictError('Diese Sendung wurde ausgeblendet.');
      if (aktion === 'weiterleiten') return { ok: true, nachricht: weiterleiten(ctx, l, n, b.teamId, b.schuelerId, ctx.neueVersion()) };
      // ersetzen
      if (text === null && etikett === null) throw new V.ValidationError('Gib einen neuen Text oder eine neue Schlüsselnummer an.');
      let inhalt = n.inhalt;
      let fuer = n.fuer_schluessel;
      let variante = null;
      if (n.art === 'schluessel') {
        if (text !== null) throw new V.ValidationError('Bei einem Schlüssel tauschst du nur die Schlüsselnummer.');
        if (!eigene.includes(etikett)) throw new V.ValidationError('Nur eigene Schlüssel kannst du unterschieben.');
        inhalt = etikett;
        variante = 'keins'; // Trents Zertifikat passt nicht mehr zur neuen Nummer
      } else {
        if (!eigene.includes(n.fuer_schluessel)) throw new V.ForbiddenError(NICHT_OEFFNEN);
        if (etikett !== null && !Object.prototype.hasOwnProperty.call(l.besitzer, etikett)) throw new V.ValidationError('Diese Schlüsselnummer gibt es nicht.');
        if (text !== null) inhalt = text;
        if (etikett !== null) fuer = etikett;
      }
      const v = ctx.neueVersion();
      const neu = ctx.neueNachricht({ von: b.teamId, an: ziel(l, n), angezeigtVon: n.angezeigt_von, schuelerId: b.schuelerId, art: n.art, inhalt, fuerSchluessel: fuer }, v);
      const m = ctx.zustand(b.teamId) || {};
      const varianten = { ...(m.varianten || {}) };
      if (variante) varianten[neu] = variante;
      else if (l.varianten[n.id]) varianten[neu] = l.varianten[n.id];
      ctx.setzeZustand(b.teamId, { ...m, bearbeitet: [...(m.bearbeitet || []), n.id], varianten });
      ctx.ereignis('ersetzt', { nachricht: n.id, neu }, v);
      return { ok: true, nachricht: neu };
    }
  },
  regie: {
    /** Trent: POST /api/lehrer/funk/:id/zertifikat { teamId, etikett, ausstellen } – nur Phase 2, nur Bob-Teams */
    zertifikat(ctx, sz, body) {
      if (sz.phase !== 'mit-zertifikaten') throw new V.ConflictError('Zertifikate gibt es erst in Phase 2.');
      const l = lage(ctx);
      const bob = l.rolle(body.teamId);
      if (!bob || bob.rolle !== 'bob') throw new V.ValidationError('Zertifikate bekommen nur Bob-Teams.');
      if (typeof body.etikett !== 'string' || !(l.etiketten[bob.team_id] || []).includes(body.etikett)) throw new V.ValidationError('Die Schlüsselnummer gehört nicht zu diesem Team.');
      if (typeof body.ausstellen !== 'boolean') throw new V.ValidationError('ausstellen ist true oder false.');
      const konfig = ctx.konfig();
      const zertifikate = { ...(konfig.zertifikate || {}) };
      if (body.ausstellen) zertifikate[bob.team_id] = body.etikett;
      else delete zertifikate[bob.team_id];
      konfig.zertifikate = zertifikate;
      const v = ctx.neueVersion();
      ctx.setzeKonfig(konfig);
      ctx.ereignis('zertifikat', { team: bob.team_id }, v);
      return { ok: true, text: body.ausstellen ? zertifikatText(bob.name, body.etikett) : null };
    },
    /** Station leeren (E115): alle wartenden Sendungen unverändert weiterleiten */
    station(ctx) {
      const l = lage(ctx);
      let n = 0;
      for (const m of l.mallorys) {
        for (const s of station(ctx, l, m.team_id)) {
          weiterleiten(ctx, lage(ctx), s, m.team_id, s.von_schueler_id, ctx.neueVersion());
          n++;
        }
      }
      return { weitergeleitet: n };
    }
  },
  /** Werkzeuge: keine (Umschläge sind eine Simulation; der Signatur-Simulator bleibt im Labor) */
  werkzeuge() {
    return [];
  },
  /** anonyme Auswertung je Alice-Team und Phase (nur Wahrheitswerte und ids) */
  auswertung(ctx, sz) {
    return zeilen(ctx, sz, false);
  }
};
