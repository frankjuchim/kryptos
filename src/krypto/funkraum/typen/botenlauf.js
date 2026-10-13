/* Kryptos – Funkraum-Szenario „Botenlauf“ (W0 §9.3, Plan M7 Task 137, E91, E92, E98, E108). Nur Regeln dieses Typs;
   Zustandsautomat, Sichtbarkeits-Grundregeln, Versionen, Grenzen und Löschung macht der Dienst (dienst.js).
   Drei Runden (Schlüssel ziehen die Paare offline, nichts wird gespeichert), Alice → Bob Befehl, Bob → Alice Quittung,
   Eve sieht alles und knackt über den Klartext-Hash (kein Bestätigungsknopf, E92). Runde 3: Sonderkarten der Regie
   („doppelt“ = zweimal Caesar, „zaun“ = Gartenzaun) für die Spalte „Besonderheit“ der Auswertung. */
'use strict';
const V = require('../../../validate');

const KARTEN = Object.freeze(['doppelt', 'zaun']);
const MERKSATZ = 'Schlüsselraum zu klein: 25 sinnvolle Schlüssel – Kerckhoffs: Geheim ist nur der Schlüssel.';

/** 'runde-2' → 2, sonst null */
function rundeVon(phase) {
  const m = /^runde-(\d)$/.exec(phase || '');
  return m ? Number(m[1]) : null;
}

/** Auswertung (nur Zahlen, ids, Codes): je Nachricht Runde, angekommen, geknackt, Zeit, Besonderheit; je Runde Summen */
function auswertung(ctx, sz) {
  const sonderkarten = ctx.konfig().sonderkarten || {};
  // Runde einer Nachricht nach E91 – Version des gesendet-Ereignisses (die Nachrichten-Version ändert sich beim
  // Ankommen/Knacken, E109)
  const gesendetV = new Map(ctx.ereignisse('gesendet').map((e) => [e.daten.nachricht, e.version]));
  const sekunden = new Map(ctx.ereignisse('geknackt').map((e) => [e.daten.nachricht, e.daten.sekunden]));
  const zeilen = ctx.nachrichten().map((n) => {
    const runde = rundeVon(ctx.phaseZu(gesendetV.has(n.id) ? gesendetV.get(n.id) : n.version));
    const karte = runde === 3 ? sonderkarten[n.von_team_id] || null : null;
    return {
      nachricht: n.id,
      runde,
      von: n.von_team_id,
      an: n.an_team_id,
      angekommen: !!n.angekommen,
      geknackt: n.geknackt_von !== null,
      sekunden: n.geknackt_von !== null && sekunden.has(n.id) ? sekunden.get(n.id) : null,
      besonderheit: karte
    };
  });
  const je = {};
  for (const r of [1, 2, 3]) {
    const z = zeilen.filter((x) => x.runde === r);
    je[r] = { gesendet: z.length, geknackt: z.filter((x) => x.geknackt).length };
  }
  return { zeilen, je };
}

module.exports = {
  typ: 'botenlauf',
  /** Alice/Bob senden Geheimtext + Klartext (nur als Hash gespeichert, Task 136); an = Partner (Dienst-Standard) */
  klartextPflicht: true,
  /** keine Rollen-Zustände: die Schlüssel ziehen die Paare offline */
  start() {
    return {};
  },
  anzeigen(ctx, sz, sicht) {
    const aufloesung = sz.phase === 'aufloesung';
    const out = { runde: rundeVon(sz.phase), merksatz: aufloesung ? MERKSATZ : null };
    if (aufloesung && sicht !== 'schueler') out.auswertung = auswertung(ctx, sz);
    return out;
  },
  aktionen: {
    /** Vorprüfung (Dienst hat Whitelist, Klartext-Pflicht und Partner geprüft): Klartext gesendet → 400 (E108) */
    senden(ctx, sz, betrachter, { inhalt, klartext }) {
      if (ctx.krypto.normalisieren(inhalt) === klartext) throw new V.ValidationError('Du hast den Klartext gesendet – verschlüssele zuerst.');
      return {};
    }
  },
  regie: {
    /** POST /api/lehrer/funk/:id/sonderkarte { teamId, karte } – nur Runde 3, nur Alice-Teams */
    sonderkarte(ctx, sz, body) {
      if (sz.status !== 'laeuft' || sz.phase !== 'runde-3') throw new V.ConflictError('Sonderkarten gibt es nur in Runde 3.');
      if (!KARTEN.includes(body.karte)) throw new V.ValidationError('Die Sonderkarte ist „doppelt“ oder „zaun“.');
      const rolle = ctx.rollen().find((r) => r.team_id === body.teamId);
      if (!rolle || rolle.rolle !== 'alice') throw new V.ValidationError('Sonderkarten bekommen nur Alice-Teams.');
      const konfig = ctx.konfig();
      konfig.sonderkarten = { ...(konfig.sonderkarten || {}), [body.teamId]: body.karte };
      const v = ctx.neueVersion();
      ctx.setzeKonfig(konfig);
      ctx.ereignis('sonderkarte', { team: body.teamId }, v);
      return { ok: true };
    }
  },
  /** Sonderkarten (mit Team-id) verraten Eve das Verfahren: nie an Schüler-Teams, an den Beamer erst ab der Auflösung */
  ereignisSicht(ctx, sz, e, betrachter) {
    if (e.code !== 'sonderkarte' || betrachter.art === 'regie') return true;
    if (betrachter.art === 'beamer') return sz.phase === 'aufloesung' || sz.status === 'auswertung';
    return false;
  },
  /** Chiffrierscheibe für alle Rollen, eingebettet; Eve braucht „alle“ (Brute-Force-Liste, E98) */
  werkzeuge() {
    return [{ id: 'scheibe', voreinstellung: { reiter: ['alle', 'scheibe', 'text'] } }];
  },
  auswertung
};
