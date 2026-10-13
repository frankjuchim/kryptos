/* Kryptos – Funkraum: Szenario-Konfiguration, Rollenvorschlag und Rollenprüfung (TECHNIK §12.2, §12.6,
   Plan M7 Task 134, E107). SZENARIEN ist der Block aus TECHNIK §12.6 (wörtlich, eingefroren); die Regeln der einzelnen
   Szenarien stehen in den Typ-Modulen `typen/<typ>.js`. */
'use strict';
const { ValidationError } = require('../../validate');

function friere(o) {
  if (o && typeof o === 'object') {
    for (const v of Object.values(o)) friere(v);
    Object.freeze(o);
  }
  return o;
}

const SZENARIEN = friere({
  botenlauf: { titel: 'Botenlauf', welt: 0, ds: 2, teamsMin: 3, rollen: { paar: ['alice', 'bob'], sonder: 'eve' },
    phasen: ['runde-1', 'runde-2', 'runde-3', 'aufloesung'], senden: ['runde-1', 'runde-2', 'runde-3'],
    aktionen: { alice: ['senden'], bob: ['senden', 'empfangen'], eve: ['knacken'] }, sicht: { eve: 'alle' } },
  wettknacken: { titel: 'Wettknacken', welt: 1, ds: 4, teamsMin: 2, rollen: { alle: 'knacker' }, phasen: ['knacken', 'aufloesung'],
    quelle: 'seed/funkraum/wettknacken.json', aktionen: { knacker: ['zuordnung'] } },
  'doppelter-schluessel': { titel: 'Der doppelte Schlüssel', welt: 3, ds: 9, teamsMin: 3, rollen: { paar: ['alice', 'bob'], sonder: 'eve' },
    phasen: ['funken', 'lauschen', 'aufloesung'], schluesselblock: 64, abschnitt: 32, sprueche: 2, maxZeichen: 24,
    aktionen: { alice: ['senden'], bob: ['empfangen'], eve: ['knacken'] }, sicht: { eve: 'alle' } },
  schluesseltausch: { titel: 'Schlüsseltausch vor Eves Augen', welt: 4, ds: 12, teamsMin: 3, rollen: { paar: ['alice', 'bob'], sonder: 'eve' },
    phasen: ['runde-1', 'runde-2', 'aufloesung'], parameter: { 'runde-1': { p: 23, g: 5 }, 'runde-2': { p: 101, g: 2 } },
    aktionen: { alice: ['oeffentlich', 'k-melden'], bob: ['oeffentlich', 'k-melden'], eve: ['knacken'] }, sicht: { eve: 'alle', alle: 'oeffentlich' } },
  mallory: { titel: 'Mallory im Netz', welt: 5, ds: 16, teamsMin: 3, rollen: { paar: ['alice', 'bob'], sonder: 'mallory', lehrkraft: 'trent' },
    phasen: ['ohne-zertifikate', 'mit-zertifikaten', 'aufloesung'], leitung: 'ueber-mallory',
    aktionen: { alice: ['senden'], bob: ['oeffentlich', 'empfangen'], mallory: ['mallory'] } }
});

const TYPEN = Object.freeze(Object.keys(SZENARIEN));

/** Anzeigename einer Rolle für Fehlermeldungen */
const ROLLEN_NAME = { alice: 'Alice', bob: 'Bob', eve: 'Eve', mallory: 'Mallory', knacker: 'Knacker' };

function konfigVon(typ) {
  if (!Object.prototype.hasOwnProperty.call(SZENARIEN, typ)) throw new ValidationError('Unbekannter Szenario-Typ.');
  return SZENARIEN[typ];
}

/**
 * Vorschlag (E107): Teams nach `nr`; Wettknacken alle `knacker`; sonst Sonderrolle für die s = n − 2·⌊(n − 1)/2⌋ (1 oder
 * 2) Teams mit den höchsten Nummern, Paare Alice ↔ Bob aus den übrigen (1↔2, 3↔4, …).
 * @param {string} typ
 * @param {{ id: number, nr: number }[]} teams
 * @returns {{ teamId: number, rolle: string, partnerId: number|null }[]}
 */
function rollenVorschlag(typ, teams) {
  const k = konfigVon(typ);
  const t = [...teams].sort((a, b) => a.nr - b.nr);
  if (k.rollen.alle) return t.map((x) => ({ teamId: x.id, rolle: k.rollen.alle, partnerId: null }));
  const n = t.length;
  if (!n) return [];
  const s = n - 2 * Math.floor((n - 1) / 2);
  const paare = n - s;
  const [a, b] = k.rollen.paar;
  const out = [];
  for (let i = 0; i + 1 < paare; i += 2) {
    out.push({ teamId: t[i].id, rolle: a, partnerId: t[i + 1].id });
    out.push({ teamId: t[i + 1].id, rolle: b, partnerId: t[i].id });
  }
  for (let i = paare; i < n; i++) out.push({ teamId: t[i].id, rolle: k.rollen.sonder, partnerId: null });
  return out;
}

/**
 * Rollen prüfen (vor dem Speichern): nur Teams des Kurses, jedes höchstens einmal, Rollen des Typs, mindestens
 * `teamsMin` Teams, Paare gegenseitig (alice.partner = bob, bob.partner = alice), Sonderrolle 1–2 Teams.
 * @param {string} typ
 * @param {unknown} rollen
 * @param {number[]} teamIds  Teams des Kurses
 * @returns {{ teamId: number, rolle: string, partnerId: number|null }[]} bereinigt
 */
function pruefeRollen(typ, rollen, teamIds) {
  const k = konfigVon(typ);
  if (!Array.isArray(rollen)) throw new ValidationError('rollen muss eine Liste sein.');
  if (rollen.length > 12) throw new ValidationError('Höchstens 12 Teams.');
  const erlaubt = k.rollen.alle ? [k.rollen.alle] : [...k.rollen.paar, k.rollen.sonder];
  const kursTeams = new Set(teamIds);
  const gesehen = new Set();
  const liste = rollen.map((r) => {
    if (!r || typeof r !== 'object' || Array.isArray(r)) throw new ValidationError('Eine Rolle ist ungültig.');
    const fremd = Object.keys(r).filter((x) => !['teamId', 'rolle', 'partnerId'].includes(x));
    if (fremd.length) throw new ValidationError(`Unbekanntes Feld: ${fremd[0]}`);
    if (!Number.isInteger(r.teamId) || !kursTeams.has(r.teamId)) throw new ValidationError('Ein Team gehört nicht zu diesem Kurs.');
    if (gesehen.has(r.teamId)) throw new ValidationError('Jedes Team hat höchstens eine Rolle.');
    gesehen.add(r.teamId);
    if (!erlaubt.includes(r.rolle)) throw new ValidationError('Diese Rolle gibt es in diesem Szenario nicht.');
    const partnerId = r.partnerId === undefined || r.partnerId === null ? null : r.partnerId;
    if (partnerId !== null && (!Number.isInteger(partnerId) || !kursTeams.has(partnerId))) throw new ValidationError('Ein Partner-Team gehört nicht zu diesem Kurs.');
    return { teamId: r.teamId, rolle: r.rolle, partnerId };
  });
  if (liste.length < k.teamsMin) throw new ValidationError(`Für dieses Szenario braucht ihr mindestens ${k.teamsMin} Teams.`);
  if (k.rollen.alle) {
    if (liste.some((r) => r.partnerId !== null)) throw new ValidationError('In diesem Szenario gibt es keine Paare.');
    return liste;
  }
  const [a, b] = k.rollen.paar;
  const nach = new Map(liste.map((r) => [r.teamId, r]));
  for (const r of liste) {
    if (r.rolle === k.rollen.sonder) {
      if (r.partnerId !== null) throw new ValidationError(`${ROLLEN_NAME[r.rolle]} hat kein Partner-Team.`);
      continue;
    }
    const gegen = r.rolle === a ? b : a;
    const p = r.partnerId === null ? null : nach.get(r.partnerId);
    if (!p || p.rolle !== gegen || p.partnerId !== r.teamId) {
      throw new ValidationError(`Jedes Paar besteht aus einem ${ROLLEN_NAME[a]}- und einem ${ROLLEN_NAME[b]}-Team, die sich gegenseitig als Partner haben.`);
    }
  }
  const sonder = liste.filter((r) => r.rolle === k.rollen.sonder).length;
  const name = ROLLEN_NAME[k.rollen.sonder];
  if (sonder < 1) throw new ValidationError(`Mindestens ein Team braucht die Rolle ${name}.`);
  if (sonder > 2) throw new ValidationError(`Es können höchstens 2 Teams die Rolle ${name} haben.`);
  if (!liste.some((r) => r.rolle === a)) throw new ValidationError(`Mindestens ein Paar ${ROLLEN_NAME[a]}/${ROLLEN_NAME[b]} ist nötig.`);
  return liste;
}

module.exports = { SZENARIEN, TYPEN, ROLLEN_NAME, konfigVon, rollenVorschlag, pruefeRollen };
