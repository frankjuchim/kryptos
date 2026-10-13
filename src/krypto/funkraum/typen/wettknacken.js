/* Kryptos – Funkraum-Szenario „Wettknacken“ (W1 §9.2/§9.3, Plan M7 Task 138, E97, E98). Nur Regeln dieses Typs;
   Zustandsautomat, Sichtbarkeits-Grundregeln, Versionen, Grenzen und Löschung macht der Dienst (dienst.js).
   Alle Teams knacken denselben Geheimtext (Seed `seed/funkraum/wettknacken.json`) mit der eingebetteten Werkbank; der
   Server speichert je Team nur die Zuordnung Geheim → Klar und meldet den Anteil richtig entschlüsselter Positionen
   (E97). Andere Teams sehen nie fremde Zuordnungen oder Anteile (nur Beamer/Regie); Klartext nur Regie/Beamer ab
   `aufloesung`. */
'use strict';
const fs = require('node:fs');
const V = require('../../../validate');
const Krypto = require('../../../../public/static/js/shared/krypto');

const FERTIG = 0.95;
const VERLAUF_MS = 30 * 1000;
const VERLAUF_MAX = 60;
const FEHLT = 'Für das Wettknacken fehlt der Text.';

/* ---------- Seed-Text laden und prüfen (einmal je Datei) ---------- */

const cache = new Map();

/** Text prüfen: Länge = Buchstaben des Geheimtextes (≥ 400), Zuordnung bildet den Geheimtext auf den Klartext ab */
function pruefeText(t) {
  if (!t || typeof t !== 'object') throw new Error('Eintrag ist kein Objekt');
  if (typeof t.id !== 'string' || !/^[a-z0-9-]{1,40}$/.test(t.id)) throw new Error('id fehlt oder ist ungültig');
  if (typeof t.geheimtext !== 'string' || typeof t.klartext !== 'string') throw new Error(`${t.id}: geheimtext/klartext fehlt`);
  const geheim = Krypto.nurBuchstaben(t.geheimtext);
  if (geheim.length !== t.laenge || geheim.length < 400) throw new Error(`${t.id}: laenge passt nicht (${geheim.length})`);
  const z = t.loesung && t.loesung.zuordnung;
  if (!z || typeof z !== 'object') throw new Error(`${t.id}: loesung.zuordnung fehlt`);
  const klein = Object.fromEntries(Object.entries(z).map(([g, k]) => [g, String(k).toLowerCase()]));
  const ergebnis = Krypto.teilsubstitution(t.geheimtext, klein).replace(/\s/g, '');
  if (ergebnis !== Krypto.nurBuchstaben(t.klartext).toLowerCase()) throw new Error(`${t.id}: Zuordnung bildet nicht auf den Klartext ab`);
  if (!Array.isArray(t.hinweise) || t.hinweise.length !== 3 || !t.hinweise.every((h) => typeof h === 'string' && h.length <= 40)) {
    throw new Error(`${t.id}: drei Hinweise erwartet`);
  }
  return Object.freeze({ id: t.id, titel: String(t.titel || ''), geheimtext: t.geheimtext, laenge: t.laenge, zuordnung: Object.freeze({ ...z }), klartext: t.klartext, hinweise: Object.freeze([...t.hinweise]) });
}

/** Seed-Datei → [Text] (fehlt/ungültig → [], Log-Zeile; ungültige Einträge werden verworfen) */
function texte(quelle, log = () => {}) {
  if (!quelle) return [];
  if (cache.has(quelle)) return cache.get(quelle);
  let liste = [];
  try {
    const d = JSON.parse(fs.readFileSync(quelle, 'utf8'));
    if (d.version !== 1 || !Array.isArray(d.texte)) throw new Error('version 1 und texte erwartet');
    for (const t of d.texte) {
      try {
        liste.push(pruefeText(t));
      } catch (e) {
        log(`Wettknacken-Text verworfen: ${e.message}`);
      }
    }
  } catch (e) {
    log(`Wettknacken-Seed nicht lesbar: ${e.message}`);
    liste = [];
  }
  cache.set(quelle, liste);
  return liste;
}

/** Text des Szenarios (konfig.textId, sonst der erste) oder null */
function textVon(ctx, textId) {
  const liste = texte(ctx.quelle, ctx.log);
  return (textId ? liste.find((t) => t.id === textId) : liste[0]) || null;
}

/* ---------- Anteil (E97) ---------- */

/** Anteil richtig entschlüsselter Positionen (Zuordnung Geheim → Klar, Groß/Klein egal), drei Nachkommastellen */
function anteilVon(text, zuordnung) {
  const klein = Object.fromEntries(Object.entries(zuordnung).map(([g, k]) => [g, k.toLowerCase()]));
  const ist = Krypto.teilsubstitution(text.geheimtext, klein).replace(/\s/g, '');
  const soll = Krypto.nurBuchstaben(text.klartext).toLowerCase();
  let richtig = 0;
  for (let i = 0; i < soll.length; i++) if (ist[i] === soll[i]) richtig++;
  return Math.round((richtig / soll.length) * 1000) / 1000;
}

/** Eingabe prüfen: Objekt, ≤ 26 Einträge, Schlüssel und Werte einzelne Buchstaben A–Z, nach Großschreibung eindeutig */
function pruefeZuordnung(z) {
  const fehler = 'Die Zuordnung besteht aus höchstens 26 Paaren einzelner Buchstaben A–Z.';
  if (!z || typeof z !== 'object' || Array.isArray(z)) throw new V.ValidationError(fehler);
  const eintraege = Object.entries(z);
  if (eintraege.length > 26) throw new V.ValidationError(fehler);
  const out = {};
  for (const [g, k] of eintraege) {
    if (!/^[A-Za-z]$/.test(g) || typeof k !== 'string' || !/^[A-Za-z]$/.test(k)) throw new V.ValidationError(fehler);
    const G = g.toUpperCase();
    if (Object.prototype.hasOwnProperty.call(out, G)) throw new V.ValidationError('Jeder Geheimtextbuchstabe kommt höchstens einmal vor.');
    out[G] = k.toUpperCase();
  }
  return out;
}

const knackerTeams = (ctx) => ctx.rollen().filter((r) => r.rolle === 'knacker');

function fortschritt(ctx) {
  return knackerTeams(ctx).map((r) => ({ team: r.team_id, anteil: r.zustand.anteil || 0, fertig: !!r.zustand.fertig, platz: r.zustand.platz || null }));
}

function verlauf(ctx) {
  return Object.fromEntries(knackerTeams(ctx).map((r) => [r.team_id, r.zustand.verlauf || []]));
}

function freigegebeneHinweise(ctx, text) {
  return (ctx.konfig().hinweise || []).slice().sort((a, b) => a - b).map((nr) => text.hinweise[nr - 1]);
}

module.exports = {
  typ: 'wettknacken',
  texte,
  anteilVon,
  /** beim Anlegen: ohne gültigen Text nicht anlegbar (400) */
  pruefeAnlegen(ctx, optionen) {
    if (!textVon(ctx, optionen.textId)) throw new V.ValidationError(FEHLT);
  },
  /** Start: Text festhalten, je Team leere Zuordnung */
  start(ctx, sz, rollen) {
    const optionen = ctx.konfig().optionen || {};
    const text = textVon(ctx, optionen.textId);
    if (!text) throw new V.ValidationError(FEHLT);
    const zustaende = {};
    for (const r of rollen) if (r.rolle === 'knacker') zustaende[r.team_id] = { zuordnung: {}, anteil: 0, verlauf: [] };
    return { konfig: { textId: text.id, hinweise: [] }, zustaende };
  },
  /** eigene Werte: Anteil, fertig, Platz – nie fremde */
  ich(ctx, sz, rolle) {
    const z = JSON.parse(rolle.zustand || '{}');
    return { anteil: z.anteil || 0, fertig: !!z.fertig, platz: z.platz || null };
  },
  /** Fortschritt anderer Teams sehen nur Beamer und Regie */
  ereignisSicht(ctx, sz, e, betrachter) {
    if (betrachter.art !== 'team' || e.code !== 'fortschritt') return true;
    return JSON.parse(e.daten || '{}').team === betrachter.teamId;
  },
  anzeigen(ctx, sz, sicht) {
    if (sz.status === 'auswertung') return {};
    const text = textVon(ctx, ctx.konfig().textId);
    if (!text) return {};
    const out = { geheimtext: text.geheimtext, laenge: text.laenge, hinweise: freigegebeneHinweise(ctx, text) };
    if (sicht === 'schueler') return out;
    out.fortschritt = fortschritt(ctx);
    out.verlauf = verlauf(ctx);
    if (sz.phase === 'aufloesung') out.klartext = text.klartext;
    return out;
  },
  /** PUT /api/funk/:id/zuordnung: höchstens eine je Team in 2 s (W1 §9.2 „höchstens alle 2 s“) */
  grenzen: { zuordnung: { max: 1, ms: 2000, text: 'Höchstens eine Zuordnung je Team in 2 Sekunden.' } },
  aktionen: {
    zuordnung(ctx, sz, betrachter, body) {
      if (sz.phase !== 'knacken') throw new V.ConflictError('In dieser Phase wird nicht mehr geknackt.');
      const zuordnung = pruefeZuordnung(body.zuordnung);
      const text = textVon(ctx, ctx.konfig().textId);
      if (!text) throw new V.ValidationError(FEHLT);
      const anteil = anteilVon(text, zuordnung);
      const jetzt = ctx.now();
      const z = ctx.zustand(betrachter.teamId) || {};
      const sek = Math.max(0, Math.round((jetzt - Date.parse(sz.gestartet_at)) / 1000));
      const punkte = Array.isArray(z.verlauf) ? z.verlauf.slice() : [];
      const letzter = punkte[punkte.length - 1];
      if (letzter && (sek - letzter.s) * 1000 < VERLAUF_MS) letzter.anteil = anteil;
      else punkte.push({ s: sek, anteil });
      while (punkte.length > VERLAUF_MAX) punkte.shift();
      const neu = { ...z, zuordnung, anteil, verlauf: punkte };
      const v = ctx.neueVersion();
      if (!z.fortschrittAt || jetzt - z.fortschrittAt >= VERLAUF_MS) {
        neu.fortschrittAt = jetzt;
        ctx.ereignis('fortschritt', { team: betrachter.teamId, prozent: Math.floor(anteil * 100) }, v);
      }
      if (anteil >= FERTIG && !z.fertig) {
        neu.fertig = true;
        neu.platz = knackerTeams(ctx).filter((r) => r.zustand.fertig).length + 1;
        ctx.ereignis('fertig', { team: betrachter.teamId, platz: neu.platz }, v);
      }
      ctx.setzeZustand(betrachter.teamId, neu);
      return { anteil };
    }
  },
  regie: {
    /** POST /api/lehrer/funk/:id/hinweis { nr } – 1–3, je einmal, Reihenfolge egal */
    hinweis(ctx, sz, body) {
      const nr = V.int(body.nr, 'nr', { min: 1, max: 3 });
      const konfig = ctx.konfig();
      const hinweise = konfig.hinweise || [];
      if (hinweise.includes(nr)) throw new V.ConflictError(`Hinweis ${nr} ist schon gesendet.`);
      konfig.hinweise = [...hinweise, nr];
      const v = ctx.neueVersion();
      ctx.setzeKonfig(konfig);
      ctx.ereignis('hinweis', { nr }, v);
      return { ok: true };
    }
  },
  /** Analysator und Werkbank eingebettet, mit dem Geheimtext vorbelegt (E98) */
  werkzeuge(sz, rolle, ctx) {
    const text = ctx ? textVon(ctx, ctx.konfig().textId) : null;
    const vor = text ? { text: text.geheimtext } : {};
    return [
      { id: 'haeufigkeit', voreinstellung: { ...vor, reiter: ['histogramm', 'bigramme'] } },
      { id: 'substitution', voreinstellung: { ...vor } }
    ];
  },
  /** anonyme Auswertung: Anteil, fertig, Platz, Verlauf je Team, Zahl der Hinweise (nur Zahlen) */
  auswertung(ctx) {
    return {
      teams: fortschritt(ctx).map((f) => ({ ...f, verlauf: (ctx.zustand(f.team) || {}).verlauf || [] })),
      hinweise: (ctx.konfig().hinweise || []).length
    };
  }
};
