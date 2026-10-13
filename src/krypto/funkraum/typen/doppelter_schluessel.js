/* Kryptos – Funkraum-Szenario „Der doppelte Schlüssel“ (W3 §9.3, Plan M7 Task 139, E94, E98). Nur Regeln dieses Typs;
   Zustandsautomat, Sichtbarkeits-Grundregeln, Versionen, Grenzen und Löschung macht der Dienst (dienst.js).
   Je Paar ein Schlüsselblock aus 64 Zufallsbytes (nur Alice und Bob sehen ihn), Abschnitt 1 = Byte 0–31, Abschnitt 2 =
   Byte 32–63. Je Alice-Team zwei Funksprüche aus dem Baukasten (≤ 24 Zeichen), gesendet als Hex-Paare; der Server prüft
   C ⊕ K_Abschnitt = M über Krypto.xor (Klartext nur im Speicher). Das Sparschwein-Paar (optionen.wiederholerTeamId,
   verdeckt) darf Abschnitt 1 zweimal benutzen – Eve rechnet C1 ⊕ C2 = M1 ⊕ M2. Der Abschnitt einer Nachricht steht bis
   zum Beenden in funk_nachrichten.fuer_schluessel („A1“/„A2“, wird beim Beenden geleert). */
'use strict';
const V = require('../../../validate');
const T = require('../text');

const BAUSTEINE = Object.freeze(['HEUTE', 'MORGEN', 'UM', '6', '7', '8', '9', 'UHR', 'AM', 'BEIM', 'HAFEN', 'BAHNHOF', 'NORDTOR', 'MARKT', 'NORD', 'SUED', 'TREFFEN', 'ABHOLEN', 'PAKET', 'BOOT', 'ZUG']);
const BLOCK = 64;
const ABSCHNITT = 32;
const SPRUECHE = 2;
const MAX_ZEICHEN = 24;
const BAUKASTEN = `Nur Wörter aus dem Funkspruch-Baukasten, höchstens ${MAX_ZEICHEN} Zeichen.`;

/** Schlüsselblock (Hex ohne Leerzeichen) des Paares, zu dem das Team gehört, oder null */
function blockFuer(ctx, teamId) {
  const rollen = ctx.rollen();
  const r = rollen.find((x) => x.team_id === teamId);
  if (!r) return null;
  const alice = r.rolle === 'alice' ? r : r.rolle === 'bob' ? rollen.find((x) => x.team_id === r.partner_id && x.rolle === 'alice') : null;
  return alice && typeof alice.zustand.schluesselblock === 'string' ? alice.zustand.schluesselblock : null;
}

/** Bytes eines Abschnitts (1 oder 2) aus dem Block */
function abschnittBytes(ctx, block, nr) {
  return ctx.krypto.vonHex(block).slice((nr - 1) * ABSCHNITT, nr * ABSCHNITT);
}

/** Funksprüche (sichtbar, Art nachricht) mit Abschnitt, nach id */
function sprueche(ctx) {
  return ctx
    .nachrichten()
    .filter((n) => n.art === 'nachricht' && n.sichtbar !== 0 && /^A[12]$/.test(n.fuer_schluessel || ''))
    .map((n) => ({ n, abschnitt: Number(n.fuer_schluessel.slice(1)) }));
}

/** Vergleiche: je Absender alle Paare von Sprüchen mit gleichem Abschnitt → C1 ⊕ C2, Bytes < 0x20 */
function vergleiche(ctx, liste) {
  const out = [];
  for (let i = 0; i < liste.length; i++) {
    for (let j = i + 1; j < liste.length; j++) {
      const a = liste[i];
      const b = liste[j];
      if (a.n.von_team_id !== b.n.von_team_id || a.abschnitt !== b.abschnitt) continue;
      const ca = ctx.krypto.vonHex(a.n.inhalt);
      const cb = ctx.krypto.vonHex(b.n.inhalt);
      const laenge = Math.min(ca.length, cb.length);
      const x = ctx.krypto.vonHex(ctx.krypto.xor(ca.slice(0, laenge), cb.slice(0, laenge)));
      out.push({ a: a.n.id, b: b.n.id, xor: T.hexPaare(ctx.krypto.hex(x)), nullen: x.filter((byte) => byte < 0x20).length, laenge });
    }
  }
  return out;
}

const eveGewinnt = (ctx) => ctx.nachrichten().some((n) => n.art === 'nachricht' && n.geknackt_von !== null);

/** Klartext eines Spruchs aus Schlüsselblock und Geheimtext berechnen (nie gespeichert) */
function klartextVon(ctx, s) {
  const block = blockFuer(ctx, s.n.von_team_id);
  if (!block) return null;
  try {
    return ctx.krypto.xor(s.n.inhalt, abschnittBytes(ctx, block, s.abschnitt), 'ent');
  } catch (e) {
    return null;
  }
}

function wiederholer(ctx) {
  return (ctx.konfig().optionen || {}).wiederholerTeamId || null;
}

module.exports = {
  typ: 'doppelter-schluessel',
  BAUSTEINE,
  /** Bob und Eve prüfen über den Klartext-Hash (Task 136) */
  klartextPflicht: true,
  /** Phasen je Prüfaktion (W3 §9.3, Review M7 W1): Bob bestätigt beim Funken, Eve knackt ab dem ersten Spruch bis zum
      Ende des Lauschens; in der Auflösung sperrt der Dienst ohnehin alles */
  aktionsPhasen: Object.freeze({ empfangen: Object.freeze(['funken']), knacken: Object.freeze(['funken', 'lauschen']) }),
  /** Sparschwein nur für ein Alice-Team (E94) */
  pruefeAnlegen(ctx, optionen, rollen) {
    if (optionen.wiederholerTeamId === undefined) return;
    const r = rollen.find((x) => x.teamId === optionen.wiederholerTeamId);
    if (!r || r.rolle !== 'alice') throw new V.ValidationError('Das Sparschwein-Paar muss ein Alice-Team sein.');
  },
  /** je Paar ein Schlüsselblock aus 64 Zufallsbytes beim Alice-Team (Reihenfolge der Paare nach Teamnummer) */
  start(ctx, sz, rollen) {
    const w = wiederholer(ctx);
    if (w !== null && !rollen.some((r) => r.team_id === w && r.rolle === 'alice')) throw new V.ValidationError('Das Sparschwein-Paar muss ein Alice-Team sein.');
    const zustaende = {};
    for (const r of rollen) if (r.rolle === 'alice') zustaende[r.team_id] = { schluesselblock: ctx.krypto.hex([...ctx.zufallBytes(BLOCK)]) };
    return { zustaende };
  },
  /** Alice/Bob: beide Abschnitte des eigenen Blocks; Sparschwein-Schalter nur für Alice; Eve: Baukasten und Spruch-Paare */
  ich(ctx, sz, rolle) {
    if (rolle.rolle === 'eve') {
      const liste = sprueche(ctx);
      const paare = [];
      for (let i = 0; i < liste.length; i++) {
        for (let j = i + 1; j < liste.length; j++) if (liste[i].n.von_team_id === liste[j].n.von_team_id) paare.push([liste[i].n.id, liste[j].n.id]);
      }
      return { bausteine: [...BAUSTEINE], paare };
    }
    const block = blockFuer(ctx, rolle.team_id);
    const out = { bausteine: [...BAUSTEINE], erneutErlaubt: rolle.rolle === 'alice' && wiederholer(ctx) === rolle.team_id };
    if (block) out.abschnitte = [1, 2].map((nr) => T.hexPaare(ctx.krypto.hex(abschnittBytes(ctx, block, nr))));
    return out;
  },
  anzeigen(ctx, sz, sicht) {
    if (sz.status === 'auswertung') return {};
    const out = { eveGewinnt: eveGewinnt(ctx) };
    // Regie sieht alle Klartexte (W3 §9.3); der Beamer erst in der Auflösung (E99)
    if (sicht === 'regie' || (sicht === 'beamer' && sz.phase === 'aufloesung')) {
      const liste = sprueche(ctx);
      out.sprueche = liste.map((s) => ({ nachricht: s.n.id, team: s.n.von_team_id, c: s.n.inhalt, m: klartextVon(ctx, s), abschnitt: s.abschnitt }));
      out.vergleiche = vergleiche(ctx, liste);
    }
    return out;
  },
  aktionen: {
    /** Vorprüfung: Phase funken, Baukasten, Abschnitt, Rückrechnung C ⊕ K = M, Reihenfolge der Abschnitte */
    senden(ctx, sz, betrachter, { body }) {
      if (sz.phase !== 'funken') throw new V.ConflictError('In dieser Phase wird nicht gesendet.');
      const roh = typeof body.klartext === 'string' ? body.klartext.toUpperCase() : '';
      if (roh.length > MAX_ZEICHEN || !/^[A-Z0-9]+( [A-Z0-9]+)*$/.test(roh) || !roh.split(' ').every((w) => BAUSTEINE.includes(w))) throw new V.ValidationError(BAUKASTEN);
      if (body.abschnitt !== 1 && body.abschnitt !== 2) throw new V.ValidationError('Der Abschnitt ist 1 oder 2.');
      const abschnitt = body.abschnitt;
      const c = T.hexPaare(body.text);
      const block = blockFuer(ctx, betrachter.teamId);
      if (!block) throw new V.ConflictError('Euer Team hat keinen Schlüsselblock.');
      let m = null;
      try {
        m = ctx.krypto.xor(c, abschnittBytes(ctx, block, abschnitt), 'ent');
      } catch (e) {
        m = null;
      }
      if (m !== roh) throw new V.ValidationError(`Der Geheimtext passt nicht zu eurem Funkspruch und Abschnitt ${abschnitt}.`);
      const bisher = ctx.nachrichten().filter((n) => n.von_team_id === betrachter.teamId && n.art === 'nachricht');
      if (bisher.length >= SPRUECHE) throw new V.ConflictError(`Euer Team hat schon ${SPRUECHE} Funksprüche gesendet.`);
      if (bisher.length === 0 && abschnitt !== 1) throw new V.ConflictError('Für den ersten Funkspruch nehmt ihr Abschnitt 1.');
      if (bisher.length === 1 && abschnitt === 1 && wiederholer(ctx) !== betrachter.teamId) throw new V.ConflictError('Abschnitt 1 ist verbraucht – nehmt Abschnitt 2.');
      return { inhalt: c, fuerSchluessel: 'A' + abschnitt };
    }
  },
  /** Bit-Lupe eingebettet: Alice/Bob OTP mit Hex-Schlüssel, Eve Doppelnutzung (Voreinstellungen schluesselart/c1/c2 ab Task 153) */
  werkzeuge(sz, rolle) {
    if (rolle === 'eve') return [{ id: 'bitlupe', voreinstellung: { reiter: ['doppelnutzung', 'xor'] } }];
    return [{ id: 'bitlupe', voreinstellung: { reiter: ['xor'], modus: 'otp', schluesselart: 'hex' } }];
  },
  /** anonyme Auswertung: je Spruch Abschnitt und geknackt, je Vergleich Nullbytes und Länge, Eve gewinnt */
  auswertung(ctx) {
    const liste = sprueche(ctx);
    return {
      sprueche: liste.map((s) => ({ nachricht: s.n.id, team: s.n.von_team_id, abschnitt: s.abschnitt, geknackt: s.n.geknackt_von !== null })),
      vergleiche: vergleiche(ctx, liste).map(({ a, b, nullen, laenge }) => ({ a, b, nullen, laenge })),
      eveGewinnt: eveGewinnt(ctx)
    };
  }
};
