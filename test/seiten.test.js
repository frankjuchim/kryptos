'use strict';
// Seitenprüfung (TECHNIK §11.2, §11.4–§11.6, §15): CSP-konforme HTML-Seiten, sicheres DOM-JavaScript,
// Cache-Versionen, Schriftlizenzen, keine Algo-Quest-Texte, lang="de".
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const PUBLIC = path.join(__dirname, '..', 'public');
const VERSION = require('../package.json').version;

/** alle Dateien unterhalb von dir (rekursiv), relativ zu PUBLIC */
function alleDateien(dir) {
  if (!fs.existsSync(dir)) return [];
  const aus = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) aus.push(...alleDateien(p));
    else aus.push(p);
  }
  return aus;
}
const rel = (p) => path.relative(PUBLIC, p);
const lies = (p) => fs.readFileSync(p, 'utf8');

const htmlDateien = alleDateien(PUBLIC).filter((p) => p.endsWith('.html'));
const jsDateien = alleDateien(path.join(PUBLIC, 'static', 'js')).filter((p) => p.endsWith('.js'));
const cssDateien = alleDateien(path.join(PUBLIC, 'static', 'css')).filter((p) => p.endsWith('.css'));
const TEXT_ENDUNGEN = /\.(html|js|css|svg|json|txt|md)$/;

test('es gibt HTML-Seiten und Skripte', () => {
  assert.ok(htmlDateien.length >= 5, 'HTML-Seiten fehlen');
  assert.ok(jsDateien.length >= 1, 'Skripte fehlen');
});

test('(a) HTML: keine Inline-Skripte, keine <style>-Blöcke, keine style-/on*-Attribute, keine externen Ressourcen', () => {
  for (const p of htmlDateien) {
    const f = rel(p);
    const html = lies(p);
    for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
      assert.match(m[1], /\ssrc="\/static\//, `${f}: Skript ohne lokale Quelle`);
      assert.equal(m[2].trim(), '', `${f}: Inline-Skript`);
    }
    assert.doesNotMatch(html, /<style\b/i, `${f}: <style>`);
    assert.doesNotMatch(html, /\sstyle\s*=/i, `${f}: style-Attribut`);
    assert.doesNotMatch(html, /\son[a-z]+\s*=/i, `${f}: Event-Handler-Attribut`);
    assert.doesNotMatch(html, /(src|href)\s*=\s*"(https?:)?\/\//i, `${f}: externe Ressource`);
  }
});

test('(b) JavaScript: kein innerHTML/outerHTML/insertAdjacentHTML/document.write/setAttribute(style), kein eval', () => {
  for (const p of jsDateien) {
    const js = lies(p);
    assert.doesNotMatch(js, /innerHTML|outerHTML|insertAdjacentHTML|document\.write/, rel(p));
    assert.doesNotMatch(js, /setAttribute\(\s*['"`]style['"`]/, `${rel(p)}: setAttribute('style', …) – CSSOM verwenden`);
    assert.doesNotMatch(js, /\beval\(|new Function\(/, rel(p));
  }
});

test('(c) kein „Algo Quest“ in public/**', () => {
  for (const p of alleDateien(PUBLIC).filter((x) => TEXT_ENDUNGEN.test(x))) {
    assert.doesNotMatch(lies(p), /algo\s*quest/i, rel(p));
  }
});

test('(d) jede HTML-Seite hat lang="de" und einen Titel', () => {
  for (const p of htmlDateien) {
    const html = lies(p);
    assert.match(html, /<html\b[^>]*\slang="de"/, `${rel(p)}: lang="de" fehlt`);
    assert.match(html, /<title>[^<]+<\/title>/, `${rel(p)}: <title> fehlt`);
  }
});

test('Cache-Versionen: jedes ?v= gleich der package.json-Version, verlinkte static-Dateien existieren', () => {
  for (const p of htmlDateien) {
    const html = lies(p);
    for (const m of html.matchAll(/\?v=([^"'&\s>#]+)/g)) assert.equal(m[1], VERSION, `${rel(p)}: ?v=${m[1]} ≠ ${VERSION}`);
    for (const m of html.matchAll(/(?:src|href)="(\/static\/[^"?#]+)(?:\?v=([^"#]+))?(?:#[^"]*)?"/g)) {
      assert.ok(fs.existsSync(path.join(PUBLIC, m[1])), `${rel(p)}: ${m[1]} fehlt`);
      if (/\.(js|css)$/.test(m[1])) assert.equal(m[2], VERSION, `${rel(p)}: ${m[1]} ohne ?v=${VERSION}`);
    }
  }
});

test('Sprite-Verweise mit ?v=: <use href> in HTML mit aktueller Version, im JS nur über KR.sprite/KR.symbol', () => {
  for (const p of htmlDateien) {
    for (const m of lies(p).matchAll(/<use\b[^>]*\shref="(\/static\/img\/[^"]+)"/g)) assert.match(m[1], new RegExp(`\\.svg\\?v=${VERSION.replace(/\./g, '\\.')}#[\\w-]+$`), `${rel(p)}: ${m[1]} ohne ?v=${VERSION}`);
  }
  for (const p of alleDateien(path.join(PUBLIC, 'static', 'js')).filter((x) => x.endsWith('.js'))) {
    assert.doesNotMatch(lies(p), /\/static\/img\/[\w/-]+\.svg#/, `${rel(p)}: Sprite-Verweis ohne Version – KR.sprite(datei, id) benutzen`);
  }
});

test('Schriften: jede Schriftdatei hat eine Lizenz in fonts/LIZENZEN/OFL-<Familie>.txt (leerer Ordner ok)', () => {
  const fonts = path.join(PUBLIC, 'static', 'fonts');
  const schriften = alleDateien(fonts).filter((p) => /\.(woff2?|ttf|otf)$/i.test(p));
  for (const p of schriften) {
    const familie = path.basename(p).split(/[-.]/)[0];
    const lizenz = path.join(fonts, 'LIZENZEN', `OFL-${familie}.txt`);
    assert.ok(fs.existsSync(lizenz), `${rel(p)}: Lizenzdatei ${rel(lizenz)} fehlt`);
    assert.match(lies(lizenz), /SIL OPEN FONT LICENSE/i, `${rel(lizenz)}: kein OFL-Text`);
    assert.match(lies(lizenz), /Copyright/i, `${rel(lizenz)}: Copyright-Zeile fehlt`);
  }
});

test('SVG-Dateien ohne Skript und ohne externe Verweise', () => {
  const svgs = alleDateien(path.join(PUBLIC, 'static')).filter((p) => p.endsWith('.svg'));
  assert.ok(svgs.length >= 1, 'keine SVG-Dateien');
  for (const p of svgs) {
    const svg = lies(p);
    assert.doesNotMatch(svg, /<script/i, `${rel(p)}: <script>`);
    assert.doesNotMatch(svg, /\son\w+\s*=/i, `${rel(p)}: Event-Handler-Attribut`);
    assert.doesNotMatch(svg, /href\s*=\s*"(https?:)?\/\//i, `${rel(p)}: externer Verweis`);
  }
});

/* ---------- Seitenliste, Grundgerüst, Skript-Reihenfolge (M4 Task 48, TECHNIK §11.1, §4.4) ---------- */
const SEITEN = ['index', 'spiel', 'labor', 'funkraum', 'werkstatt', 'beamer', 'lehrer', 'urkunden', 'board', 'themen', 'gast', 'datenschutz', '404', 'fehler/keine-berechtigung', 'fehler/anmeldung-fehlgeschlagen', 'fehler/kurs-gesperrt'];
const seite = (n) => path.join(PUBLIC, n + '.html');
const skripte = (html) => [...html.matchAll(/<script\b[^>]*\ssrc="\/static\/js\/([^"?]+)[^"]*"[^>]*>/gi)].map((m) => ({ datei: m[1], defer: /\sdefer\b/.test(m[0]), index: m.index }));

test('Seitenliste TECHNIK §11.1: alle Seiten vorhanden', () => {
  for (const n of SEITEN) assert.ok(fs.existsSync(seite(n)), `${n}.html fehlt`);
});

test('Grundgerüst: jede Seite nach dem gemeinsamen Baustein (M4 abgeschlossen, keine Platzhalter)', () => {
  assert.ok(htmlDateien.length >= SEITEN.length);
  for (const p of htmlDateien) {
    const f = rel(p);
    const html = lies(p);
    assert.match(html, /<html\b[^>]*\sdata-theme="auto"/, `${f}: data-theme="auto"`);
    assert.match(html, /<html\b[^>]*\sdata-epoche="\d+"/, `${f}: data-epoche`);
    const css = [...html.matchAll(/<link rel="stylesheet" href="\/static\/css\/([a-z-]+)\.css/g)].map((m) => m[1]);
    assert.deepEqual(css.slice(0, 5), ['schriften', 'tokens', 'epochen', 'basis', 'komponenten'], `${f}: Basis-Stylesheets`);
    const kopfEnde = html.indexOf('</head>');
    const sk = skripte(html);
    for (const datei of ['common.js', 'krypto/oberflaeche.js']) {
      const s = sk.find((x) => x.datei === datei);
      assert.ok(s && s.index < kopfEnde && !s.defer, `${f}: ${datei} ohne defer im <head>`);
    }
    assert.ok(sk.findIndex((x) => x.datei === 'common.js') < sk.findIndex((x) => x.datei === 'krypto/oberflaeche.js'), `${f}: common.js vor oberflaeche.js`);
    for (const s of sk.filter((x) => x.index > kopfEnde)) assert.ok(s.defer, `${f}: ${s.datei} im <body> mit defer`);
    assert.match(html, /<a class="sprung" href="#haupt">/, `${f}: Sprunglink`);
    assert.match(html, /<main id="haupt"/, `${f}: <main id="haupt"`);
  }
});

test('Skript-Reihenfolge TECHNIK §4.4 auf Seiten mit aufgabe.js', () => {
  const REIHE = ['common.js', 'shared/krypto.js', 'render.js', 'interact.js', 'krypto/bloecke.js', 'krypto/interaktionen.js', 'aufgabe.js'];
  for (const p of htmlDateien) {
    const sk = skripte(lies(p)).map((x) => x.datei);
    if (!sk.includes('aufgabe.js')) continue;
    const pos = REIHE.map((d) => sk.indexOf(d));
    assert.ok(pos.every((i) => i >= 0), `${rel(p)}: es fehlt ${REIHE.filter((d, i) => pos[i] < 0).join(', ')}`);
    assert.deepEqual([...pos].sort((a, b) => a - b), pos, `${rel(p)}: Reihenfolge ${REIHE.join(' → ')}`);
    assert.ok(pos.at(-1) < sk.length - 1, `${rel(p)}: aufgabe.js vor dem Seitenskript`);
  }
});

test('Keine Seite trägt noch einen Platzhalter (Task 68): weder „Platzhalter“ noch „Oberfläche im Aufbau“', () => {
  for (const p of htmlDateien) {
    const html = lies(p);
    assert.ok(!/Platzhalter|Oberfläche im Aufbau/.test(html), `${rel(p)}: Platzhalter`);
  }
  for (const d of ['css', 'js/krypto']) {
    for (const f of fs.readdirSync(path.join(PUBLIC, 'static', d), { recursive: true }).filter((x) => /\.(css|js)$/.test(x))) {
      assert.ok(!/Platzhalter-(Seite|Themenseite)|Oberfläche im Aufbau/.test(fs.readFileSync(path.join(PUBLIC, 'static', d, f), 'utf8')), `${d}/${f}: Platzhalter-Seite erwähnt`);
    }
  }
});
test('Fehlerseiten und 404 statisch: nur common.js und oberflaeche.js, Kopf mit Portal-Link und Gastmodus', () => {
  for (const n of ['404.html', 'fehler/keine-berechtigung.html', 'fehler/anmeldung-fehlgeschlagen.html', 'fehler/kurs-gesperrt.html']) {
    const html = lies(path.join(PUBLIC, n));
    assert.deepEqual(skripte(html).map((x) => x.datei), ['common.js', 'krypto/oberflaeche.js'], n);
    assert.match(html, /<header class="kopf"[^>]*>[\s\S]*href="\/sso\/portal"[\s\S]*href="\/gast"[\s\S]*<\/header>/, n);
  }
});
test('Kein externer Link auf die Krypto-Werkstatt (Design O11, bis die Erlaubnis geklärt ist)', () => {
  for (const p of [...htmlDateien, ...jsDateien]) assert.doesNotMatch(lies(p), /andrebodendiek|enigma\./i, rel(p));
});
test('Review M4 K6: Fehlerseiten trennen die Anrede (kein Absatz mit du und Sie zugleich)', () => {
  const du = /\b(du|dein|deine|deinen|deinem|deiner|dich|dir)\b/i;
  const sie = /\b(Sie|Ihr|Ihre|Ihren|Ihrem|Ihrer|Ihnen)\b/;
  for (const n of ['fehler/keine-berechtigung.html', 'fehler/anmeldung-fehlgeschlagen.html', 'fehler/kurs-gesperrt.html', '404.html']) {
    const html = fs.readFileSync(path.join(__dirname, '..', 'public', n), 'utf8');
    for (const m of html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)) {
      const t = m[1].replace(/<[^>]+>/g, ' ');
      assert.ok(!(du.test(t) && sie.test(t)), `${n}: gemischte Anrede in „${t.trim()}“`);
    }
  }
});

test('Scrollbereiche (.scroll-x) halten absolut positionierte Screenreader-Texte (.sr) fest – kein Querscrollen bei 360 px', () => {
  const css = fs.readFileSync(path.join(__dirname, '..', 'public', 'static', 'css', 'basis.css'), 'utf8');
  const regel = /\.scroll-x\s*\{([^}]*)\}/.exec(css);
  assert.ok(regel, '.scroll-x fehlt in basis.css');
  assert.match(regel[1], /position:\s*relative/, '.scroll-x braucht position: relative (sonst ragen .sr-Spans der Matrix-Köpfe aus der Seite)');
});
test('Fremdcode (M6 E66): FREMDCODE.md vorhanden, nichts aus der Werkstatt übernommen, kein Link', () => {
  const fremd = fs.readFileSync(path.join(__dirname, '..', 'docs', 'FREMDCODE.md'), 'utf8');
  assert.match(fremd, /nichts übernommen; nur Bedienideen; Lizenz ungeklärt/);
  assert.doesNotMatch(fremd, /https?:\/\/|andrebodendiek|enigma\./i, 'kein Link auf die Werkstatt');
  const verboten = /andrebodendiek|kryptologie-werkstatt|\bKW\.(player|shell|controls|workbench)\b|portal\.js/i;
  for (const p of [...htmlDateien, ...jsDateien, ...cssDateien]) assert.doesNotMatch(lies(p), verboten, `${rel(p)}: Werkstatt-Spur`);
});
