'use strict';
// Datenschutzseite /datenschutz (Plan M9 Task 210, E152, E153): Pflichtangaben mit Platzhaltern der Schule (wie labs),
// vollständige Liste der Cookies (aus dem Server-Code) und der Speicher-Schlüssel im Browser (aus public/static/js),
// Löschfristen, keine echten Namen.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const WURZEL = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(WURZEL, 'public', 'datenschutz.html'), 'utf8');
/** sichtbarer Text der Seite (ohne Tags, Entities für Anführungszeichen aufgelöst) */
const text = html.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ');

function dateien(rel, endung) {
  const abs = path.join(WURZEL, rel);
  return fs.readdirSync(abs, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? dateien(`${rel}/${e.name}`, endung) : e.name.endsWith(endung) ? [`${rel}/${e.name}`] : []));
}
const lies = (rel) => fs.readFileSync(path.join(WURZEL, rel), 'utf8');

test('pflichtangaben_mit_platzhaltern (E152)', () => {
  for (const s of ['[Name der Schule]', '[Anschrift]', '[Name]', '[Name, E-Mail]', '[Hoster, Standort in der EU]', 'Art. 6 Abs. 1 lit. e DSGVO']) assert.ok(html.includes(s), s);
  assert.match(html, /Entwurf/);
  for (const h of ['Verantwortlich', 'Zweck', 'Rechtsgrundlage', 'Speicherdauer', 'Ihre Rechte', 'Beschwerde']) assert.match(html, new RegExp(`<h2[^>]*>[^<]*${h}`), h);
  assert.match(text, /Landesbeauftragte für den Datenschutz Niedersachsen/);
  for (const r of ['Auskunft', 'Berichtigung', 'Löschung', 'Einschränkung', 'Widerspruch']) assert.match(text, new RegExp(r), r);
  assert.match(text, /Sicherungskopien: \[/);
});

test('jedes_cookie_genannt: alle Cookie-Namen aus dem Server-Code stehen auf der Seite', () => {
  const namen = new Set();
  for (const d of dateien('src', '.js')) {
    const code = lies(d);
    for (const m of code.matchAll(/\bCOOKIE_[A-Z_]+\s*=\s*'([^']+)'/g)) namen.add(m[1]);
    for (const m of code.matchAll(/res\.cookie\(\s*'([^']+)'/g)) namen.add(m[1]);
  }
  assert.deepEqual([...namen].sort(), ['kr_l', 'kr_s', 'kr_sso_state'], 'Cookie-Namen im Server-Code');
  for (const n of namen) assert.ok(html.includes(`<code>${n}</code>`), `Cookie ${n} fehlt auf der Seite`);
  assert.match(text, /30 Tage/);
  assert.match(text, /8 Stunden/);
  assert.match(text, /10 Minuten/);
});

// Aufrufe mit einer Variablen, die sich nicht aus einer Konstante derselben Datei ergibt: Datei:Name → Schlüssel bzw.
// Präfix (null = Hülle, deren Aufrufer einzeln geprüft werden)
const VERWEISE = {
  'public/static/js/common.js:key': null, // AQ.speichere/AQ.lade – Aufrufe unten einzeln
  'public/static/js/krypto/werkstatt.js:n': 'kr-werkstatt:' // n = entwurfName() = PRAEFIX + Teilnahme
};

test('jeder_speicher_schluessel_genannt: alle localStorage-/sessionStorage-Schlüssel aus public/static/js stehen auf der Seite', () => {
  const schluessel = new Map(); // Schlüssel bzw. Präfix → Fundstelle
  const offen = [];
  for (const d of dateien('public/static/js', '.js')) {
    const code = lies(d);
    const konst = (name) => {
      const m = new RegExp(`\\b(?:const|let)\\s+${name}\\s*=\\s*'([^']+)'`).exec(code);
      return m ? m[1] : null;
    };
    const eigenschaft = (obj, prop) => {
      const m = new RegExp(`\\b${obj}\\s*=\\s*\\{[^}]*\\b${prop}\\s*:\\s*'([^']+)'`).exec(code);
      return m ? m[1] : null;
    };
    const aufrufe = [...code.matchAll(/(?:localStorage|sessionStorage)\.setItem\(\s*([^,]+),/g), ...code.matchAll(/\bAQ\.(?:speichere|lade)\(\s*([^,)]+)[,)]/g)];
    for (const m of aufrufe) {
      const arg = m[1].trim();
      const zeile = code.slice(0, m.index).split('\n').length;
      let wert;
      let lit;
      if ((lit = /^'([^']+)'$/.exec(arg))) wert = lit[1];
      else if ((lit = /^'([^']+)'\s*\+/.exec(arg))) wert = lit[1]; // Präfix + Teil
      else if ((lit = /^([A-Z_]+)\s*\+/.exec(arg)) && konst(lit[1])) wert = konst(lit[1]);
      else if ((lit = /^([A-Za-z_]+)\.([a-z_]+)$/.exec(arg)) && eigenschaft(lit[1], lit[2])) wert = eigenschaft(lit[1], lit[2]);
      else if (/^[A-Za-z_]+$/.test(arg) && konst(arg)) wert = konst(arg);
      else if (Object.hasOwn(VERWEISE, `${d}:${arg}`)) wert = VERWEISE[`${d}:${arg}`];
      else {
        offen.push(`${d}:${zeile} ${arg}`);
        continue;
      }
      if (wert !== null) schluessel.set(wert, `${d}:${zeile}`);
    }
  }
  assert.deepEqual(offen, [], 'Speicher-Schlüssel nicht auflösbar (VERWEISE ergänzen)');
  assert.ok(schluessel.size >= 7, [...schluessel.keys()].join(', '));
  for (const [k, wo] of schluessel) assert.ok(html.includes(`<code>${k}`), `Speicher-Schlüssel ${k} (${wo}) fehlt auf der Seite`);
  // sessionStorage wird nicht benutzt – sonst müsste die Seite es nennen
  for (const d of dateien('public/static/js', '.js')) if (/sessionStorage/.test(lies(d))) assert.match(text, /sessionStorage/, d);
});

test('loeschfristen (E153): 24 Stunden, 30 Tage, 30 Tage/8 Stunden, Löschung durch das Portal', () => {
  const abschnitt = (id) => {
    const m = new RegExp(`id="${id}"[\\s\\S]*?</section>`).exec(html);
    assert.ok(m, id);
    return m[0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  };
  const dauer = abschnitt('ds-dauer');
  assert.match(dauer, /24 Stunden/);
  assert.match(dauer, /30 Tage nach dem Schließen/);
  assert.match(dauer, /30 Tage/);
  assert.match(dauer, /8 Stunden/);
  assert.match(dauer, /Portal/);
  assert.match(dauer, /Kurs.*abläuft|Ablauf/);
  assert.match(dauer, /Sicherungskopien/);
});

test('keine_echten_namen: keine Schulnamen/Personen außer Platzhaltern; Link #portal-datenschutz bleibt', () => {
  assert.doesNotMatch(text, /\b(Gymnasium|Gesamtschule|IGS|KGS|Oberschule|Berufsbildende)\s+[A-ZÄÖÜ]/);
  assert.doesNotMatch(text, /[\w.+-]+@[\w-]+\.[a-z]{2,}/i, 'keine E-Mail-Adressen');
  assert.doesNotMatch(text, /Juchim|Frank\b/);
  assert.match(html, /<a id="portal-datenschutz" href="\/sso\/portal">/);
  // Aufsichtsbehörde ist keine Privatperson – Anschrift wie labs
  assert.match(text, /Prinzenstraße 5, 30159 Hannover/);
});

test('quellen_und_dank (Plan M10 Task 220): Krypto-Werkstatt mit Namensnennung, Werkzeuge mit übernommenen Ideen, kein Link nach außen', () => {
  const m = /<section[^>]*aria-labelledby="ds-quellen"[^>]*>([\s\S]*?)<\/section>/.exec(html);
  assert.ok(m, 'Abschnitt ds-quellen fehlt');
  const abschnitt = m[1];
  const t = abschnitt.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  for (const muss of ['Ideen von A. Bodendiek', 'Krypto-Werkstatt', 'Chiffrierscheibe', 'Skytale & Gitter']) assert.ok(t.includes(muss) || abschnitt.includes(muss.replace('&', '&amp;')), `„${muss}“ fehlt`);
  assert.match(abschnitt, /<h2 id="ds-quellen">Quellen und Dank<\/h2>/);
  assert.doesNotMatch(abschnitt, /href\s*=\s*"(https?:)?\/\//i, 'kein Link nach außen (L53)');
});
