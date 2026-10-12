'use strict';
// Warm-up-Trainer (Leitner, 5 Fächer) – aus v1 übernommen, ohne Punkte. Karten: seed/warmup/*.json.

const crypto = require('node:crypto');
const V = require('../validate');
const { KATA_KATEGORIEN, LEITNER_INTERVAL_DAYS, WELTEN } = require('../domain');

const { ValidationError, NotFoundError } = V;

function createKata(ctx) {
  const { db } = ctx;

  function kataRow(k) {
    return { id: k.id, welt: k.welt, kategorie: k.kategorie, titel: k.titel, aufgabe: k.aufgabe, code: k.code, loesung: k.loesung, loesungCode: k.loesung_code, minuten: k.minuten };
  }

  function filterSql(filter = {}) {
    const where = [];
    const params = [];
    if (filter.welt !== undefined && filter.welt !== null && filter.welt !== '') {
      where.push('k.welt = ?');
      params.push(V.int(filter.welt, 'Welt', { min: 0, max: 99 }));
    }
    if (filter.kategorie) {
      if (!KATA_KATEGORIEN.includes(filter.kategorie)) throw new ValidationError('Unbekannte Kategorie.');
      where.push('k.kategorie = ?');
      params.push(filter.kategorie);
    }
    return { sql: where.length ? 'WHERE ' + where.join(' AND ') : '', params };
  }

  function liste(filter) {
    const f = filterSql(filter);
    return db.prepare(`SELECT * FROM katas k ${f.sql} ORDER BY k.welt, k.id`).all(...f.params).map(kataRow);
  }

  function meta() {
    const welten = db.prepare('SELECT welt, COUNT(*) AS n FROM katas GROUP BY welt ORDER BY welt').all();
    const kategorien = db.prepare('SELECT kategorie, COUNT(*) AS n FROM katas GROUP BY kategorie').all();
    return {
      welten: welten.map((w) => ({ welt: w.welt, anzahl: w.n })),
      kategorien: KATA_KATEGORIEN.filter((k) => kategorien.some((x) => x.kategorie === k)).map((k) => ({ kategorie: k, anzahl: kategorien.find((x) => x.kategorie === k).n })),
      weltNamen: WELTEN.map((w) => ({ nr: w.nr, name: w.name }))
    };
  }

  function pruefeKarte(k, i) {
    const where = `Karte ${i + 1}${k && typeof k.id === 'string' ? ` (${k.id})` : ''}`;
    if (!k || typeof k !== 'object' || Array.isArray(k)) throw new ValidationError(`${where}: ist kein Objekt.`);
    const idv = V.str(k.id, `${where}: id`, { min: 1, max: 40 });
    if (!/^[A-Za-z0-9._-]+$/.test(idv)) throw new ValidationError(`${where}: id darf nur A–Z, 0–9, Punkt, - und _ enthalten.`);
    const kategorie = V.str(k.kategorie, `${where}: kategorie`, { min: 1, max: 60 });
    if (!KATA_KATEGORIEN.includes(kategorie)) throw new ValidationError(`${where}: unbekannte kategorie „${kategorie}“.`);
    return {
      id: idv,
      welt: V.int(k.welt, `${where}: welt`, { min: 0, max: 9 }),
      kategorie,
      titel: V.str(k.titel, `${where}: titel`, { min: 1, max: 200 }),
      aufgabe: V.str(k.aufgabe, `${where}: aufgabe`, { min: 1, max: 20000, trim: false }),
      code: V.str(k.code === undefined ? '' : k.code, `${where}: code`, { max: 20000, trim: false }),
      loesung: V.str(k.loesung, `${where}: loesung`, { min: 1, max: 20000, trim: false }),
      loesungCode: V.str(k.loesungCode === undefined ? '' : k.loesungCode, `${where}: loesungCode`, { max: 20000, trim: false }),
      minuten: k.minuten === undefined ? 5 : V.int(k.minuten, `${where}: minuten`, { min: 1, max: 90 })
    };
  }

  /** Import { version: 1, karten: [...] } – ergänzt/ersetzt nach id, alles oder nichts. */
  function importieren(data) {
    if (!data || typeof data !== 'object' || !Array.isArray(data.karten)) throw new ValidationError('Ungültige Datei: erwartet wird {"version": 1, "karten": [...]}.');
    if (data.version !== undefined && data.version !== 1) throw new ValidationError('Nicht unterstützte Version (erwartet: 1).');
    if (data.karten.length > 5000) throw new ValidationError('Zu viele Karten in einer Datei (max. 5000).');
    const errors = [];
    const clean = [];
    const seen = new Set();
    data.karten.forEach((k, i) => {
      try {
        const c = pruefeKarte(k, i);
        if (seen.has(c.id)) throw new ValidationError(`Karte ${i + 1}: id „${c.id}“ kommt doppelt vor.`);
        seen.add(c.id);
        clean.push(c);
      } catch (e) {
        if (e instanceof ValidationError) errors.push(e.message);
        else throw e;
      }
    });
    if (errors.length) throw new ValidationError(`Import abgebrochen – ${errors.length} fehlerhafte Karte(n).`, errors.slice(0, 50));
    let neu = 0;
    let aktualisiert = 0;
    const exists = db.prepare('SELECT 1 FROM katas WHERE id = ?');
    const upsert = db.prepare(
      `INSERT INTO katas (id, welt, kategorie, titel, aufgabe, code, loesung, loesung_code, minuten, updated_at)
       VALUES (@id, @welt, @kategorie, @titel, @aufgabe, @code, @loesung, @loesungCode, @minuten, datetime('now'))
       ON CONFLICT(id) DO UPDATE SET welt = excluded.welt, kategorie = excluded.kategorie, titel = excluded.titel,
         aufgabe = excluded.aufgabe, code = excluded.code, loesung = excluded.loesung, loesung_code = excluded.loesung_code,
         minuten = excluded.minuten, updated_at = excluded.updated_at`
    );
    db.transaction(() => {
      for (const c of clean) {
        if (exists.get(c.id)) aktualisiert++;
        else neu++;
        upsert.run(c);
      }
    })();
    return { neu, aktualisiert, gesamt: db.prepare('SELECT COUNT(*) AS n FROM katas').get().n };
  }

  function loeschen(id) {
    if (!db.prepare('DELETE FROM katas WHERE id = ?').run(String(id)).changes) throw new NotFoundError('Karte nicht gefunden.');
  }

  /** Seed beim Start (unveränderte Dateien werden über einen Fingerabdruck übersprungen). */
  function seed(quellen) {
    const getMeta = db.prepare('SELECT value FROM meta WHERE key = ?');
    const setMeta = db.prepare('INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
    return quellen.map((q) => {
      const key = 'seed-kata:' + q.name;
      const hash = crypto.createHash('sha256').update(q.text).digest('hex');
      const cur = getMeta.get(key);
      if (cur && cur.value === hash) return { datei: q.name, uebersprungen: true, neu: 0, aktualisiert: 0 };
      try {
        const r = importieren(JSON.parse(q.text));
        setMeta.run(key, hash);
        return { datei: q.name, uebersprungen: false, neu: r.neu, aktualisiert: r.aktualisiert };
      } catch (e) {
        const details = e.details ? ' – ' + e.details.slice(0, 3).join(' · ') : '';
        return { datei: q.name, uebersprungen: false, neu: 0, aktualisiert: 0, fehler: e.message + details };
      }
    });
  }

  /* ---------- Leitner ---------- */

  function addDays(now, days) {
    return new Date(now.getTime() + days * 86400000).toISOString();
  }

  function kandidaten(sid, filter) {
    const f = filterSql(filter);
    return db
      .prepare(`SELECT k.*, l.box AS l_box, l.due_at AS l_due FROM katas k LEFT JOIN leitner l ON l.kata_id = k.id AND l.schueler_id = ? ${f.sql}`)
      .all(sid, ...f.params)
      .map((r) => ({ row: r, box: r.l_box || 1, due: r.l_due || '1970-01-01T00:00:00.000Z', neu: r.l_box === null }));
  }

  function ziehen(sid, filter = {}, { excludeId = null, force = false, random = Math.random } = {}) {
    const now = new Date(ctx.now());
    const nowIso = now.toISOString();
    const all = kandidaten(sid, filter);
    if (!all.length) return { card: null, reason: 'keine_karten', faellig: 0, gesamt: 0 };
    const due = all.filter((c) => c.due <= nowIso);
    let pick = null;
    if (due.length) {
      const minBox = Math.min(...due.map((c) => c.box));
      let pool = due.filter((c) => c.box === minBox);
      if (excludeId && pool.length > 1) pool = pool.filter((c) => c.row.id !== excludeId);
      else if (excludeId && pool.length === 1 && pool[0].row.id === excludeId && due.length > 1) {
        const rest = due.filter((c) => c.row.id !== excludeId);
        const nb = Math.min(...rest.map((c) => c.box));
        pool = rest.filter((c) => c.box === nb);
      }
      pick = pool[Math.floor(random() * pool.length)];
    } else if (force) {
      pick = [...all].sort((a, b) => a.box - b.box || (a.due < b.due ? -1 : a.due > b.due ? 1 : 0))[0];
    } else {
      const next = all.map((c) => c.due).sort()[0];
      return { card: null, reason: 'nichts_faellig', naechsteFaelligkeit: next, faellig: 0, gesamt: all.length };
    }
    return { card: kataRow(pick.row), fach: pick.box, neu: pick.neu, faellig: due.length, gesamt: all.length };
  }

  const ERGEBNISSE = ['gewusst', 'teilweise', 'nicht'];

  function antworten(sid, kataId, result) {
    if (!ERGEBNISSE.includes(result)) throw new ValidationError('Ungültige Selbsteinschätzung.');
    const kata = db.prepare('SELECT id FROM katas WHERE id = ?').get(String(kataId));
    if (!kata) throw new NotFoundError('Karte nicht gefunden.');
    const now = new Date(ctx.now());
    const cur = db.prepare('SELECT * FROM leitner WHERE schueler_id = ? AND kata_id = ?').get(sid, kata.id);
    const oldBox = cur ? cur.box : 1;
    let box = oldBox;
    if (result === 'gewusst') box = Math.min(5, oldBox + 1);
    else if (result === 'nicht') box = 1;
    const dueAt = addDays(now, LEITNER_INTERVAL_DAYS[box]);
    db.prepare(
      `INSERT INTO leitner (schueler_id, kata_id, box, due_at, reviews, gewusst, teilweise, nicht, last_at)
       VALUES (@p, @k, @box, @due, 1, @g, @t, @n, @now)
       ON CONFLICT(schueler_id, kata_id) DO UPDATE SET box = @box, due_at = @due, reviews = reviews + 1,
         gewusst = gewusst + @g, teilweise = teilweise + @t, nicht = nicht + @n, last_at = @now`
    ).run({ p: sid, k: kata.id, box, due: dueAt, g: result === 'gewusst' ? 1 : 0, t: result === 'teilweise' ? 1 : 0, n: result === 'nicht' ? 1 : 0, now: now.toISOString() });
    return { kataId: kata.id, vorher: oldBox, fach: box, faelligAb: dueAt };
  }

  function statistik(sid, filter = {}) {
    const nowIso = new Date(ctx.now()).toISOString();
    const all = kandidaten(sid, filter);
    const faecher = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let neu = 0;
    let faellig = 0;
    for (const c of all) {
      if (c.neu) neu++;
      else faecher[c.box]++;
      if (c.due <= nowIso) faellig++;
    }
    const t = db
      .prepare('SELECT COALESCE(SUM(reviews),0) AS r, COALESCE(SUM(gewusst),0) AS g, COALESCE(SUM(teilweise),0) AS t, COALESCE(SUM(nicht),0) AS n FROM leitner WHERE schueler_id = ?')
      .get(sid);
    return { gesamt: all.length, neu, faecher, faellig, wiederholungen: t.r, gewusst: t.g, teilweise: t.t, nicht: t.n };
  }

  return { liste, meta, importieren, loeschen, seed, ziehen, antworten, statistik };
}

module.exports = { createKata };
