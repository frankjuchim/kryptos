'use strict';
// Sicherheits-Review III (Plan M9 Task 209, E160): Lösungsverrat über die Schüler-API – alle sieben Welten, echte Seeds.
// Geprüft wird die API-Ebene: Liefert eine Schüler-GET-Antwort vor dem Lösen eine Lösung, Erklärung, einen nicht
// abgerufenen Tipp oder eine Boss-Aufgabe (vor dem Kampf)? Treffer = normalisierter Geheimnis-Text (A–Z, 0–9) als
// Teilstring der normalisierten Antwort.
// Steht ein Geheimnis zugleich in einem für Schüler sichtbaren Seed-Text (Aufgabentext, Intro, Kapitel …), liefert die API
// nur aus, was der Seed ohnehin zeigt – das ist ein inhaltlicher Fund (Seeds/Akten, test/inhalte_loesungsverrat.test.js),
// kein API-Fund: er wird hier nur gemeldet (Diagnose), nicht als Fehler gezählt (Entscheidung Orchestrator M9).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const H = require('./helpers');
const Krypto = require('../public/static/js/shared/krypto.js');
const { STANDARD_EINSTELLUNGEN } = require('../src/domain');
const { FALLEN } = require('../src/krypto/fach');

const SEED = path.join(__dirname, '..', 'seed');
const WELTEN = [0, 1, 2, 3, 4, 5, 6];
const N = (t) => Krypto.normalisieren(String(t ?? ''));
const json = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const seed = (w) => json(path.join(SEED, 'welten', `welt${w}.json`));
const GAST = json(path.join(SEED, 'gast', 'demo.json'));
const SICHTBAR_OHNE = ['loesung', 'erklaerung', 'tipps', 'pruefnachweis', 'fallen', 'id'];
const kurz = (x) => typeof x === 'string' && [...x].length <= 2;
const zaehltLoesung = (t) => (/^[01]+$/.test(t) ? t.length >= 16 : t.length >= 6 && new Set(t).size >= 3);

/** Alle Zeichenketten eines Werts (rekursiv, ohne Schlüssel mit „_“ und ohne die genannten Felder). */
function texte(wert, ohne = []) {
  const out = [];
  (function lauf(x) {
    if (typeof x === 'string') return out.push(x);
    if (Array.isArray(x)) return x.forEach(lauf);
    if (!x || typeof x !== 'object') return;
    for (const [k, v] of Object.entries(x)) if (!ohne.includes(k) && !k.startsWith('_')) lauf(v);
  })(wert);
  return out;
}

/** Lösungstexte einer Aufgabe (wie test/inhalte_loesungsverrat.test.js: Klapplisten, match, choice-Indizes zählen nicht). */
function loesungstexte(a) {
  const roh = [];
  const auswahl = new Set();
  const teile = [].concat(a.interaktion || []);
  for (const ia of teile) if (ia && (ia.kind === 'gaps' || ia.kind === 'schaubild-ergaenzen') && ia.felder) for (const [id, f] of Object.entries(ia.felder)) if (f && f.typ === 'auswahl') auswahl.add(id);
  for (const [i, lo] of [].concat(a.loesung || []).entries()) {
    if (!lo || typeof lo !== 'object' || (teile[i] && teile[i].kind === 'match')) continue;
    const luecken = [];
    for (const [k, v] of Object.entries(lo)) {
      if (k.startsWith('_') || ['richtig', 'zuordnung', 'reihenfolge'].includes(k) || auswahl.has(k)) continue;
      if (typeof v === 'string') roh.push(v);
      else if (Array.isArray(v)) {
        v.filter((x) => typeof x === 'string').forEach((x) => roh.push(x));
        if (typeof v[0] === 'string') luecken.push(v[0]);
      }
    }
    if (luecken.length > 1) roh.push(luecken.join(''));
  }
  return [...new Set(roh.map(N))].filter(zaehltLoesung);
}

/**
 * Geheimnisse eines Welt-Seeds (oder des Gast-Seeds): [{ id, art: 'loesung'|'erklaerung'|'tipp'|'boss', text }]
 * – text normalisiert. Erklärungen und Boss-Texte ab 24, Tipps ab 16 Zeichen (kürzere Floskeln stehen auch anderswo).
 */
function geheimnisse(s) {
  const out = [];
  const boss = new Set((s.boss && s.boss.pool) || []);
  for (const a of s.aufgaben || []) {
    // steht das Geheimnis im sichtbaren Text derselben Aufgabe (z. B. Lösung = Klartext bei Verschiebung 0), ist es inhaltlich
    const eigen = texte(a, SICHTBAR_OHNE).map(N).join('|');
    const neu = (g) => out.push({ ...g, eigen: g.art !== 'boss' && eigen.includes(g.text) });
    for (const t of loesungstexte(a)) neu({ id: a.id, art: 'loesung', text: t });
    for (const t of texte(a.erklaerung)) if (N(t).length >= 24) neu({ id: a.id, art: 'erklaerung', text: N(t) });
    for (const [i, t] of (a.tipps || []).entries()) for (const x of texte(t)) if (N(x).length >= 16) neu({ id: a.id, art: 'tipp', nr: i, text: N(x) });
    // Boss-Aufgaben: die Texte der Aufgabe (inhalt), ab 40 Zeichen – kurze Fragen/Optionen („Welche Aussagen sind korrekt?“)
    // stehen auch in Level-Aufgaben
    if (boss.has(a.id)) for (const t of texte(a.inhalt)) if (N(t).length >= 40) neu({ id: a.id, art: 'boss', text: N(t) });
  }
  return out;
}

/** Für Schüler sichtbare Seed-Texte (ohne Geheimnis-Felder, ohne Boss-Pool) – normalisiert, als ein Suchtext. */
function oeffentlicherSeedText() {
  const stuecke = [];
  for (const w of WELTEN) {
    const s = seed(w);
    const boss = new Set((s.boss && s.boss.pool) || []);
    stuecke.push(...texte({ ...s, aufgaben: undefined, boss: s.boss ? { ...s.boss, pool: undefined } : undefined }));
    for (const a of s.aufgaben || []) if (!boss.has(a.id)) stuecke.push(...texte(a, SICHTBAR_OHNE));
  }
  stuecke.push(...texte(GAST, ['loesung', 'erklaerung', 'tipps']));
  // öffentliche Plattform-Texte: Fallen P1–P10 (Fallen-Profil, Themenseite; Design §3.3)
  stuecke.push(...texte(FALLEN));
  return stuecke.map(N).join('|');
}

const EINSTELLUNGEN = { ...STANDARD_EINSTELLUNGEN, boss: 'offen', kuer: 'frei', niveau: 'eA' };

/** Mika im LK 13 (eA), alle Welten 0–6 frei, Kür frei, Boss offen – echte Seeds. */
async function mika() {
  const app = H.makeApp({ seedDir: SEED, weltDateien: [] });
  const k = H.kurs(app, 'LK 13 (eA)', { einstellungen: EINSTELLUNGEN });
  const s = await H.schuelerClient(app, k, 'Mika R.');
  return { app, k, s };
}

/** Treffer der Geheimnisse in den Antworten: [{ pfad, id, art, inhaltlich }] */
function suche(antworten, geh, oeffentlich, { erlaubt = () => false } = {}) {
  const treffer = [];
  for (const [pfad, body] of antworten) {
    const text = N(JSON.stringify(body));
    for (const g of geh) {
      if (erlaubt(pfad, g) || !text.includes(g.text)) continue;
      treffer.push({ pfad, id: g.id, art: g.art, text: g.text.slice(0, 40), inhaltlich: g.eigen || oeffentlich.includes(g.text) });
    }
  }
  return treffer;
}

const OEFFENTLICH = oeffentlicherSeedText();
const GEHEIM = WELTEN.flatMap((w) => geheimnisse(seed(w)));
const GEHEIM_GAST = geheimnisse(GAST);

test('Geheimnisse gefunden (Selbsttest des Crawlers): Lösungen, Erklärungen, Tipps und Boss-Aufgaben aller Welten', () => {
  const arten = (art) => GEHEIM.filter((g) => g.art === art);
  for (const art of ['loesung', 'erklaerung', 'tipp', 'boss']) assert.ok(arten(art).length > 20, `${art}: ${arten(art).length}`);
  for (const w of WELTEN) assert.ok(GEHEIM.some((g) => g.id.startsWith(`W${w}-`) && g.art === 'boss'), `Boss-Aufgaben W${w}`);
  assert.ok(GEHEIM_GAST.length > 5, 'Gast-Geheimnisse');
  // Normalisierung wie die Prüfung: Klappliste und choice-Index sind kein Lösungstext
  assert.deepEqual(loesungstexte({ interaktion: { kind: 'gaps', felder: { g: { typ: 'auswahl' } } }, loesung: { g: ['öffentlichen'] } }), []);
  assert.deepEqual(loesungstexte({ loesung: { richtig: ['a', 'c'] } }), []);
  assert.deepEqual(loesungstexte({ loesung: { text: 'botensindunterwegs' } }), ['BOTENSINDUNTERWEGS']);
});

test('crawler_vor_dem_loesen: keine Lösung, Erklärung, Tipp-Text oder Boss-Aufgabe in irgendeiner Schüler-GET-Antwort', { timeout: 120000 }, async (t) => {
  const { s } = await mika();
  const antworten = [];
  const hole = async (p) => {
    const r = await s.get(p);
    assert.ok([200, 404].includes(r.status), `${p}: ${r.status}`);
    antworten.push([p, r.body]);
    return r.body;
  };
  const welten = await hole('/api/welten');
  assert.deepEqual(welten.welten.filter((w) => w.nr <= 6).map((w) => w.nr), WELTEN);
  let aufgaben = 0;
  for (const w of WELTEN) {
    const sw = seed(w);
    for (const l of sw.levels) {
      const lv = await hole(`/api/levels/${l.id}`);
      assert.ok(lv && !lv.error, `${l.id} sichtbar`);
    }
    for (const a of sw.aufgaben) {
      if ((sw.boss && sw.boss.pool.includes(a.id)) || /-A-\d+$/.test(a.id)) continue;
      await hole(`/api/aufgaben/${a.id}`);
      aufgaben++;
    }
    await hole(`/api/archivfund/${w}`);
    await hole(`/api/boss/${w}`);
    await hole(`/api/training/${w}`);
  }
  assert.ok(aufgaben > 150, `Level-Aufgaben abgerufen: ${aufgaben}`);
  for (const p of ['/api/kata/meta', '/api/kata/statistik', '/api/profil', '/api/scoreboard', '/api/labor', '/api/themen', '/api/niveaus', '/api/plattform', '/api/sitzung', '/api/funk', '/api/arena', '/api/gast/schueler', '/api/gast/lehrkraft']) await hole(p);
  for (const a of GAST.aufgaben) await hole(`/api/gast/aufgaben/${a.id}`);

  const treffer = suche(antworten, [...GEHEIM, ...GEHEIM_GAST], OEFFENTLICH);
  const api = treffer.filter((x) => !x.inhaltlich);
  const inhaltlich = treffer.filter((x) => x.inhaltlich);
  // Inhaltliche Funde (Geheimnis steht auch in einem sichtbaren Seed-Text) nur melden – Sache der Seeds
  if (inhaltlich.length) t.diagnostic(`inhaltlich (Seed): ${JSON.stringify([...new Map(inhaltlich.map((x) => [`${x.id}/${x.art}/${x.text}`, x])).values()].map(({ id, art, text, pfad }) => ({ id, art, text, pfad })))}`);
  assert.deepEqual(api, [], JSON.stringify(api.slice(0, 5)));
});

test('nach_tipp_nur_dieser_tipp: POST tipp liefert genau den nächsten Tipp, GET danach nicht die übrigen', async () => {
  const { s } = await mika();
  const kandidaten = WELTEN.flatMap((w) => seed(w).aufgaben.filter((a) => /-L\d+-\d+$/.test(a.id) && (a.tipps || []).length >= 2));
  assert.ok(kandidaten.length >= 5, 'Aufgaben mit zwei Tipps');
  for (const a of kandidaten.slice(0, 5)) {
    const tippText = (i) => N(JSON.stringify(a.tipps[i]));
    const vorher = await s.get(`/api/aufgaben/${a.id}`);
    assert.deepEqual(vorher.body.zustand.tipps, [], `${a.id}: vor dem Tipp keine Tipps`);
    const r = await s.post(`/api/aufgaben/${a.id}/tipp`).send({});
    assert.equal(r.status, 200);
    assert.equal(r.body.zustand.tipps.length, 1);
    assert.equal(N(JSON.stringify(r.body.zustand.tipps[0])), tippText(0));
    const nach = await s.get(`/api/aufgaben/${a.id}`);
    const text = N(JSON.stringify(nach.body));
    assert.ok(text.includes(tippText(0)), `${a.id}: Tipp 1 bleibt sichtbar`);
    for (let i = 1; i < a.tipps.length; i++) if (!OEFFENTLICH.includes(tippText(i))) assert.ok(!text.includes(tippText(i)), `${a.id}: Tipp ${i + 1} vorzeitig`);
    for (const g of GEHEIM.filter((x) => x.id === a.id && (x.art === 'loesung' || x.art === 'erklaerung') && !x.eigen && !OEFFENTLICH.includes(x.text))) assert.ok(!text.includes(g.text), `${a.id}: ${g.art} nach Tipp`);
    assert.equal(nach.body.loesung, undefined);
    assert.equal(nach.body.erklaerung, undefined);
  }
});

/* Vertrag v1.3 §9: Prüfantworten enthalten keine Lösungsdaten. Falsche Antwort = Musterantwort mit einem veränderten
   Blatt (bzw. alle Blätter verändert, bzw. Listen umgekehrt) – die erste Variante, die die API mit 200 und ok: false
   annimmt. */
const C = require('../src/content/checker');
const abbilden = (x, f) =>
  Array.isArray(x) ? x.map((y) => abbilden(y, f)) : x && typeof x === 'object' ? Object.fromEntries(Object.entries(x).map(([k, v]) => [k, abbilden(v, f)])) : f(x);
function erstesBlatt(x, f) {
  let fertig = false;
  const lauf = (y) => {
    if (fertig) return y;
    if (Array.isArray(y)) return y.map(lauf);
    if (y && typeof y === 'object') return Object.fromEntries(Object.entries(y).map(([k, v]) => [k, lauf(v)]));
    fertig = true;
    return f(y);
  };
  return lauf(x);
}
const umkehren = (x) => (Array.isArray(x) ? [...x].reverse().map(umkehren) : x && typeof x === 'object' ? Object.fromEntries(Object.entries(x).map(([k, v]) => [k, umkehren(v)])) : x);
const veraendern = (y) => (typeof y === 'string' ? (y[0] === 'Q' ? 'R' : 'Q') + y.slice(1) : typeof y === 'number' ? y + 1 : typeof y === 'boolean' ? !y : y);
const falscheAntworten = (a) => {
  const m = C.musterantwortAufgabe(a);
  return [erstesBlatt(m, veraendern), abbilden(m, veraendern), umkehren(m)];
};

test('v1.3 §9 pruefantwort_falsch: POST pruefen mit falscher Antwort liefert keine Lösung, Erklärung oder Tipp (alle Welten)', { timeout: 180000 }, async () => {
  const { app, k } = await mika();
  const LOESUNGSFELDER = ['loesung', 'erklaerung', 'muster', 'musterantwort', 'tipps', 'pruefnachweis'];
  const antworten = [];
  let s;
  let n = 0;
  let geprueft = 0;
  for (const w of WELTEN) {
    const sw = seed(w);
    for (const a of sw.aufgaben) {
      if ((sw.boss && sw.boss.pool.includes(a.id)) || /-A-\d+$/.test(a.id)) continue;
      if (n++ % 20 === 0) s = await H.schuelerClient(app, k, `Mika ${n}`); // Rate-Limit je Schüler
      for (const antwort of falscheAntworten(a)) {
        const r = await s.post(`/api/aufgaben/${a.id}/pruefen`).send({ antwort });
        assert.notEqual(r.status, 429, 'Rate-Limit');
        if (r.status !== 200 || r.body.ok !== false) continue;
        geprueft++;
        for (const f of LOESUNGSFELDER) assert.equal(r.body[f], undefined, `${a.id}: Feld ${f} in der Prüfantwort`);
        assert.ok(Array.isArray(r.body.zustand.tipps) && r.body.zustand.tipps.length === 0, `${a.id}: keine Tipps ohne Anfrage`);
        // Was die gesendete Antwort selbst enthält, ist kein Verrat (Teil-Feedback darf sich darauf beziehen)
        antworten.push([`${a.id} ${N(JSON.stringify(antwort))}`, r.body]);
        break;
      }
    }
  }
  assert.ok(geprueft >= 180, `Aufgaben mit falscher Antwort geprüft: ${geprueft}`);
  const gesendet = (pfad) => pfad.slice(pfad.indexOf(' ') + 1);
  const treffer = suche(antworten, GEHEIM.filter((g) => g.art !== 'boss'), OEFFENTLICH, { erlaubt: (pfad, g) => gesendet(pfad).includes(g.text) });
  const api = treffer.filter((x) => !x.inhaltlich);
  assert.deepEqual(api, [], JSON.stringify(api.slice(0, 5)));
  // Selbsttest: eine Prüfantwort mit Lösung würde gefunden
  const g = GEHEIM.find((x) => x.art === 'loesung' && !x.eigen && !OEFFENTLICH.includes(x.text));
  assert.equal(suche([['probe', { ok: false, text: g.text }]], [g], OEFFENTLICH).length, 1);
});

test('boss_nur_im_kampf: Boss-Aufgaben erscheinen erst nach /boss/:welt/start und nur die gezogenen; nach Ende nur mit Auswertung', { timeout: 60000 }, async () => {
  const { s } = await mika();
  for (const w of WELTEN) {
    const pool = seed(w).boss.pool;
    const bossGeheim = GEHEIM.filter((g) => pool.includes(g.id) && !g.eigen && !OEFFENTLICH.includes(g.text));
    const enthalten = (body, filter) => {
      const text = N(JSON.stringify(body));
      return [...new Set(bossGeheim.filter(filter).filter((g) => text.includes(g.text)).map((g) => `${g.id}/${g.art}`))];
    };
    // vor dem Start: nichts aus dem Pool
    assert.deepEqual(enthalten((await s.get(`/api/boss/${w}`)).body, () => true), [], `W${w} vor dem Start`);
    // im Kampf: nur die gezogenen Aufgaben, ohne Lösung/Erklärung
    const start = await s.post(`/api/boss/${w}/start`).send({});
    assert.equal(start.status, 201, JSON.stringify(start.body));
    const gezogen = start.body.aufgaben.map((a) => a.id);
    assert.ok(gezogen.length >= 3 && gezogen.every((id) => pool.includes(id)), `W${w}: ${gezogen}`);
    // Texte, die eine gezogene Aufgabe selbst enthält (gemeinsame Materialtexte im Pool), zählen bei den übrigen nicht
    const gezogenText = seed(w).aufgaben.filter((a) => gezogen.includes(a.id)).flatMap((a) => texte(a, SICHTBAR_OHNE)).map(N).join('|');
    const ungezogen = (g) => !gezogen.includes(g.id) && !gezogenText.includes(g.text);
    const kampf = (await s.get(`/api/boss/kampf/${start.body.id}`)).body;
    for (const b of [start.body, kampf]) {
      assert.deepEqual(enthalten(b, ungezogen), [], `W${w}: nicht gezogene Pool-Aufgaben im Kampf`);
      assert.deepEqual(enthalten(b, (g) => gezogen.includes(g.id) && g.art !== 'boss'), [], `W${w}: Lösung/Erklärung/Tipp im Kampf`);
    }
    // nach dem Ende: Auswertung der gezogenen Aufgaben, nie die übrigen Pool-Aufgaben
    const ende = await s.post(`/api/boss/kampf/${start.body.id}/beenden`).send({});
    assert.equal(ende.status, 200);
    const danach = [ende.body, (await s.get(`/api/boss/kampf/${start.body.id}`)).body, (await s.get(`/api/boss/${w}`)).body];
    for (const b of danach) assert.deepEqual(enthalten(b, ungezogen), [], `W${w}: nicht gezogene Pool-Aufgaben nach dem Ende`);
    // Boss-Aufgaben sind nie als Level-Aufgabe abrufbar
    for (const id of pool.slice(0, 3)) assert.equal((await s.get(`/api/aufgaben/${id}`)).status, 404, id);
  }
});

test('akten_und_dateien: /akten/* und /api/themen nennen nie _LSG, _EH, Klausur, Loesungen_Portal, Lehrkraft_PDF', async () => {
  const { s, app } = await mika();
  const verboten = /_LSG|_EH\b|_EH[._]|(^|[/_ ])Klausur|Nachschreib|Loesungen_Portal|Lehrkraft_PDF|Loesungen_Akten/i;
  const themenAnonym = await H.client(app).get('/api/themen');
  const themenSchueler = await s.get('/api/themen');
  const urls = [];
  for (const r of [themenAnonym, themenSchueler]) {
    const text = JSON.stringify(r.body);
    assert.doesNotMatch(text, verboten);
    for (const m of text.matchAll(/"url":"([^"]+)"/g)) urls.push(m[1]);
  }
  assert.ok(urls.length > 20, 'Akten-URLs in /api/themen');
  for (const u of [...new Set(urls)].filter((x) => x.startsWith('/akten/'))) {
    assert.doesNotMatch(decodeURIComponent(u), verboten, u);
    const r = await s.get(u);
    assert.equal(r.status, 200, u);
    assert.match(r.headers['content-type'], /pdf/, u);
  }
  // Lösungs- und Lehrkraft-Dateien sind über /akten/ nie erreichbar (Pfad-Tricks eingeschlossen) und für Schüler 404
  const verz = JSON.stringify(json(path.join(__dirname, '..', 'materialien', 'Lehrkraft_PDF', 'verzeichnis.json')));
  const lehrkraftDateien = [...verz.matchAll(/"pfad":\s*"([^"]+)"/g)].map((m) => m[1]).filter((p) => /Loesungen_Portal|_LSG|_EH|Klausur/i.test(p));
  assert.ok(lehrkraftDateien.length > 5, 'Lösungsdateien im Lehrkraft-Verzeichnis');
  for (const p of lehrkraftDateien.slice(0, 15)) {
    for (const u of [`/akten/${p}`, `/akten/../materialien/${p}`, `/akten/..%2Fmaterialien%2F${encodeURIComponent(p)}`, `/lehrkraft/dateien/${p}`]) {
      const r = await s.get(u);
      assert.equal(r.status, 404, `${u}: ${r.status}`);
    }
  }
});
