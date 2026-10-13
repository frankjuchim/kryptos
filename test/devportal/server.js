'use strict';
// Entwicklungs-Portal (TECHNIK §16.4) – nur für die Entwicklung und den e2e-Test, nie im Image.
// Ein Mini-Portal mit eigenem Ed25519-Schlüssel (bei jedem Start neu erzeugt; öffentlicher Teil nach
// <DATA_DIR>/devportal.pem), das wie InfoLabs SSO-Tokens (VERTRAG §5) und Verbund-Tokens (§6) mit src/jwt.js signiert:
//   GET  /                       Übersicht: Kryptos öffnen, Verbund-Aufrufe per Knopf (Löschen, Umbenennen, Sperren, Übersicht)
//   GET  /sso/autorisieren       Auswahl des Kontos (Pseudonyme), danach Rücksprung mit Token
//   GET  /sso/weiter             signiert das Token für die Auswahl und leitet auf den Rücksprung
//   GET  /sso/abmelden           Portal-Abmeldung (Rücksprung nur auf PLATTFORM_URL + „/“)
//   GET  /sso/schluessel.pem     öffentlicher Schlüssel
//   POST /verbund/…              Verbund-Aufruf an die Plattform, Ergebnis als Text
// Keine Inline-Skripte oder -Styles (CSP), alle Ausgaben HTML-maskiert. Rücksprung nur zeichengenau, sonst Fehlerseite.

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const { signiere } = require('../../src/jwt');

const KURSE = {
  'k:1': 'LK 13 (eA)',
  'k:2': 'GK 12 (gA)'
};

/** Auswählbare Konten (nur Pseudonyme). */
const KONTEN = {
  mika: { sub: 's:1', rolle: 'schueler', name: 'Mika R.', kurse: ['k:1', 'k:2'] },
  ida: { sub: 's:2', rolle: 'schueler', name: 'Ida K.', kurse: ['k:2'] },
  // Plan M7 E117: zwei weitere Schüler im LK 13 für den Funkraum mit drei Teams (e2e 5, Sichtprüfung)
  ole: { sub: 's:3', rolle: 'schueler', name: 'Ole B.', kurse: ['k:1'] },
  nia: { sub: 's:4', rolle: 'schueler', name: 'Nia T.', kurse: ['k:1'] },
  lehrkraft: { sub: 'l:1', rolle: 'lehrkraft', name: 'Frau M.', kurse: ['k:1', 'k:2'] },
  admin: { sub: 'a:1', rolle: 'superadmin', name: 'Admin', kurse: [] }
};

const ROLLE_TEXT = { schueler: 'Schüler', lehrkraft: 'Lehrkraft', superadmin: 'Admin' };

const STIL = `body{font-family:system-ui,sans-serif;margin:0;background:#f6f1e6;color:#1d1b16}
main{max-width:46rem;margin:0 auto;padding:1rem}
h1{font-size:1.5rem}h2{font-size:1.15rem;margin-top:1.5rem}
.karte{background:#fff;border:1px solid #d9cdb3;border-radius:.5rem;padding:1rem;margin:.75rem 0}
a.knopf,button{display:inline-block;min-height:44px;padding:.6rem 1rem;margin:.25rem .25rem .25rem 0;border-radius:.4rem;
border:1px solid #B07D2B;background:#B07D2B;color:#fff;text-decoration:none;font:inherit;cursor:pointer}
a.knopf.leise,button.leise{background:#fff;color:#7a5418}
label{display:block;margin:.4rem 0}input,select{font:inherit;min-height:36px}
pre{background:#1d1b16;color:#f6f1e6;padding:.75rem;border-radius:.4rem;overflow:auto;white-space:pre-wrap}
.hinweis{color:#6b5a3a;font-size:.9rem}`;

/** HTML-Maskierung für Textknoten und Attribute. */
function h(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function seite(titel, inhalt) {
  return (
    '<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
    `<title>${h(titel)} – Dev-Portal</title><link rel="stylesheet" href="/stil.css"></head><body><main>` +
    `<h1>${h(titel)}</h1>${inhalt}<p class="hinweis">Entwicklungs-Portal (nur lokal) – kein echtes InfoLabs.</p></main></body></html>`
  );
}

/**
 * @param {object} o
 * @param {string} o.portalUrl      eigene Adresse (iss), z. B. http://localhost:3100
 * @param {string} o.plattformUrl   Kryptos, z. B. http://localhost:3000
 * @param {string} [o.plattformId]  aud (Standard kryptos)
 * @param {Function} [o.fetch]      für Verbund-Aufrufe (Standard: globales fetch)
 * @returns {{ app: import('express').Express, publicPem: string, privateKey: import('node:crypto').KeyObject, token: Function, verbundToken: Function }}
 */
function createDevPortal({ portalUrl, plattformUrl, plattformId = 'kryptos', fetch: holen = globalThis.fetch }) {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  const publicPem = publicKey.export({ type: 'spki', format: 'pem' });
  const ruecksprungErlaubt = plattformUrl + '/sso/ende';
  const jetztSek = () => Math.floor(Date.now() / 1000);
  const jti = () => crypto.randomBytes(16).toString('base64url');

  function token(konto) {
    const iat = jetztSek();
    const rolleImKurs = konto.rolle === 'schueler' ? 'mitglied' : 'lehrkraft';
    return signiere(
      {
        iss: portalUrl,
        aud: plattformId,
        sub: konto.sub,
        rolle: konto.rolle,
        name: konto.name,
        kurse: konto.kurse.map((id) => ({ id, name: KURSE[id], rolle: rolleImKurs })),
        iat,
        exp: iat + 90,
        jti: jti(),
        v: 1
      },
      privateKey
    );
  }

  function verbundToken(zweck) {
    const iat = jetztSek();
    return signiere({ iss: portalUrl, aud: plattformId, sub: 'portal', zweck, iat, exp: iat + 60, jti: jti(), v: 1 }, privateKey);
  }

  const app = express();
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.set('Content-Security-Policy', "default-src 'self'; script-src 'none'; style-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'");
    res.set('Cache-Control', 'no-store');
    res.set('Referrer-Policy', 'no-referrer');
    next();
  });
  app.use(express.urlencoded({ extended: false, limit: '10kb' }));
  app.get('/stil.css', (req, res) => res.type('css').send(STIL));
  app.get('/favicon.ico', (req, res) => res.status(204).end()); // kein 404 in der Browser-Konsole (e2e)

  const fehler = (res, text) => res.status(400).type('html').send(seite('Ungültige Anfrage', `<div class="karte"><p>${h(text)}</p><p>Es wird nicht weitergeleitet.</p></div>`));

  /** Parameter der Plattform prüfen (VERTRAG §5: Rücksprung zeichengenau, sonst Fehlerseite, nie weiterleiten). */
  function anfrage(q) {
    if (q.plattform !== plattformId) return { fehler: `Unbekannte Plattform „${q.plattform || ''}“.` };
    if (q.ruecksprung !== ruecksprungErlaubt) return { fehler: 'Rücksprung-Adresse ist nicht freigegeben.' };
    if (typeof q.state !== 'string' || !/^[A-Za-z0-9_-]{16,64}$/.test(q.state)) return { fehler: 'state fehlt oder ist ungültig.' };
    const ziel = typeof q.ziel === 'string' && q.ziel.startsWith('/') ? q.ziel : '/';
    return { state: q.state, ziel };
  }

  const params = (a, extra = {}) => new URLSearchParams({ plattform: plattformId, ruecksprung: ruecksprungErlaubt, state: a.state, ziel: a.ziel, ...extra });

  app.get('/', (req, res) => {
    const kursOptionen = Object.entries(KURSE).map(([id, n]) => `<option value="${h(id)}">${h(id)} ${h(n)}</option>`).join('');
    const subOptionen = Object.values(KONTEN).map((k) => `<option value="${h(k.sub)}">${h(k.sub)} ${h(k.name)}</option>`).join('');
    res.type('html').send(
      seite(
        'Dev-Portal',
        `<div class="karte"><p>Anmelden wie im Portal: Kryptos starten, das Dev-Portal fragt nach dem Konto.</p>
<p><a class="knopf" href="${h(plattformUrl)}/sso/start?ziel=%2F">Kryptos öffnen (Anmeldung)</a>
<a class="knopf leise" href="${h(plattformUrl)}/">Startseite von Kryptos</a></p>
<p class="hinweis">Konten: ${Object.values(KONTEN).map((k) => `${h(k.name)} (${h(ROLLE_TEXT[k.rolle])}, ${h(k.sub)})`).join(' · ')}. Kurse: ${Object.entries(KURSE).map(([id, n]) => `${h(id)} „${h(n)}“`).join(' · ')}.</p></div>
<h2>Verbund-Aufrufe (VERTRAG §6)</h2>
<form class="karte" method="post" action="/verbund/loeschen"><label>Konto löschen <select name="sub">${subOptionen}</select></label><button type="submit">Konto löschen</button></form>
<form class="karte" method="post" action="/verbund/loeschen"><label>Kurs löschen <select name="kurs">${kursOptionen}</select></label><button type="submit">Kurs löschen</button></form>
<form class="karte" method="post" action="/verbund/umbenennen"><label>Kurs <select name="kurs">${kursOptionen}</select></label><label>Neuer Name <input name="name" maxlength="80" value="LK 13 (eA) neu"></label><button type="submit">Umbenennen</button></form>
<form class="karte" method="post" action="/verbund/aktiv"><label>Kurs <select name="kurs">${kursOptionen}</select></label><label>Kryptos für den Kurs <select name="aktiv"><option value="false">abschalten</option><option value="true">einschalten</option></select></label><button type="submit">Übernehmen</button></form>
<form class="karte" method="post" action="/verbund/uebersicht"><label>Kurs <select name="kurs">${kursOptionen}</select></label><button type="submit">Kursübersicht holen</button></form>`
      )
    );
  });

  app.get('/sso/schluessel.pem', (req, res) => res.type('text/plain').send(publicPem));

  app.get('/sso/autorisieren', (req, res) => {
    const a = anfrage(req.query);
    if (a.fehler) return fehler(res, a.fehler);
    const knoepfe = Object.entries(KONTEN)
      .map(([wer, k]) => `<a class="knopf" href="/sso/weiter?${h(params(a, { wer }).toString())}">${h(k.name)} (${h(ROLLE_TEXT[k.rolle])})</a>`)
      .join('\n');
    res.type('html').send(
      seite(
        'Anmelden bei Kryptos',
        `<div class="karte"><p>Als wer möchtest du dich anmelden?</p>${knoepfe}</div>
<div class="karte"><a class="knopf leise" href="/sso/weiter?${h(params(a, { wer: 'keine_berechtigung' }).toString())}">Ohne Freischaltung (keine_berechtigung)</a>
<a class="knopf leise" href="/sso/weiter?${h(params(a, { wer: 'abgebrochen' }).toString())}">Abbrechen</a></div>`
      )
    );
  });

  app.get('/sso/weiter', (req, res) => {
    const a = anfrage(req.query);
    if (a.fehler) return fehler(res, a.fehler);
    const wer = req.query.wer;
    if (wer === 'keine_berechtigung' || wer === 'abgebrochen') {
      return res.redirect(302, `${ruecksprungErlaubt}?${new URLSearchParams({ fehler: wer, state: a.state })}`);
    }
    const konto = Object.prototype.hasOwnProperty.call(KONTEN, wer) ? KONTEN[wer] : null;
    if (!konto) return fehler(res, 'Unbekanntes Konto.');
    res.redirect(302, `${ruecksprungErlaubt}?${new URLSearchParams({ token: token(konto), state: a.state, ziel: a.ziel })}`);
  });

  app.get('/sso/abmelden', (req, res) => {
    if (req.query.ruecksprung === plattformUrl + '/') return res.redirect(302, plattformUrl + '/');
    res.type('html').send(seite('Abgemeldet', '<div class="karte"><p>Du bist im Dev-Portal abgemeldet.</p><p><a class="knopf" href="/">Zur Übersicht</a></p></div>'));
  });

  /* ---------- Verbund-Aufrufe per Knopf ---------- */

  async function verbund(res, zweck, methode, pfad, body) {
    let text;
    try {
      const r = await holen(plattformUrl + pfad, {
        method: methode,
        headers: { Authorization: 'Bearer ' + verbundToken(zweck), ...(body ? { 'Content-Type': 'application/json' } : {}) },
        body: body ? JSON.stringify(body) : undefined
      });
      const roh = await r.text();
      let schoen = roh;
      try {
        schoen = JSON.stringify(JSON.parse(roh), null, 2);
      } catch {
        /* kein JSON */
      }
      text = `${methode} ${pfad} → ${r.status}\n\n${schoen}`;
    } catch (e) {
      text = `${methode} ${pfad} → nicht erreichbar (${e.message})`;
    }
    res.type('html').send(seite('Verbund-Aufruf', `<pre>${h(text)}</pre><p><a class="knopf" href="/">Zurück</a></p>`));
  }

  const kursAus = (b) => (Object.prototype.hasOwnProperty.call(KURSE, b.kurs) ? b.kurs : null);

  app.post('/verbund/loeschen', (req, res) => {
    const b = req.body || {};
    if (b.sub) return verbund(res, 'loeschen', 'POST', '/api/verbund/loeschen', { sub: String(b.sub) });
    if (kursAus(b)) return verbund(res, 'loeschen', 'POST', '/api/verbund/loeschen', { kurs: kursAus(b) });
    fehler(res, 'sub oder kurs fehlt.');
  });
  app.post('/verbund/umbenennen', (req, res) => {
    const b = req.body || {};
    if (!kursAus(b)) return fehler(res, 'Kurs fehlt.');
    verbund(res, 'kurs-aendern', 'POST', '/api/verbund/kurse/' + encodeURIComponent(kursAus(b)), { name: String(b.name || '') });
  });
  app.post('/verbund/aktiv', (req, res) => {
    const b = req.body || {};
    if (!kursAus(b)) return fehler(res, 'Kurs fehlt.');
    verbund(res, 'kurs-aendern', 'POST', '/api/verbund/kurse/' + encodeURIComponent(kursAus(b)), { aktiv: b.aktiv === 'true' });
  });
  app.post('/verbund/uebersicht', (req, res) => {
    const b = req.body || {};
    if (!kursAus(b)) return fehler(res, 'Kurs fehlt.');
    verbund(res, 'kurs-uebersicht', 'GET', '/api/verbund/kurse/' + encodeURIComponent(kursAus(b)) + '/uebersicht');
  });

  app.use((req, res) => res.status(404).type('text').send('Nicht gefunden.'));
  return { app, publicPem, privateKey, token, verbundToken };
}

/**
 * Dev-Portal starten und den öffentlichen Schlüssel nach <dataDir>/devportal.pem schreiben.
 * @returns {Promise<{ server: import('node:http').Server, publicPem: string, pemDatei: string }>}
 */
function starte({ port = 3100, portalUrl = `http://localhost:${port}`, plattformUrl = 'http://localhost:3000', dataDir = path.join(__dirname, '..', '..', 'data') } = {}) {
  const dp = createDevPortal({ portalUrl, plattformUrl });
  fs.mkdirSync(dataDir, { recursive: true });
  const pemDatei = path.join(dataDir, 'devportal.pem');
  fs.writeFileSync(pemDatei, dp.publicPem);
  return new Promise((resolve, reject) => {
    const server = dp.app.listen(port, () => resolve({ server, publicPem: dp.publicPem, pemDatei }));
    server.on('error', reject);
  });
}

if (require.main === module) {
  const port = Number(process.env.DEVPORTAL_PORT || 3100);
  starte({ port, plattformUrl: process.env.PLATTFORM_URL || 'http://localhost:3000', dataDir: process.env.DATA_DIR || undefined })
    .then(({ pemDatei }) => console.log(`Dev-Portal läuft auf http://localhost:${port} (öffentlicher Schlüssel: ${pemDatei})`))
    .catch((e) => {
      console.error(`Dev-Portal startet nicht: ${e.message}`);
      process.exit(1);
    });
}

module.exports = { createDevPortal, starte, KONTEN, KURSE };
