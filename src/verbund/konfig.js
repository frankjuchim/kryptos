'use strict';
// Kern-Kandidat lab-kern: Verbund-Konfiguration einer Plattform (VERTRAG §8, TECHNIK §6.1).
// Liest die Umgebungsvariablen, prüft sie streng und wirft bei Fehlern einen Error mit deutscher Meldung
// (server.js bricht dann den Start ab). Im Testmodus ({ test: true }) dürfen Pflichtwerte fehlen; angegebene Werte
// werden trotzdem geprüft. ADMIN_EMAIL/ADMIN_PASSWORD werden bewusst nicht gelesen (Superadmin kommt vom Portal).

const crypto = require('node:crypto');
const path = require('node:path');
const { schluesselListe } = require('../jwt');

const STANDARD_ID = 'kryptos';
const ID_MUSTER = /^[a-z][a-z0-9-]{1,30}$/;
const VERTRAG_VERSIONEN = ['1.1', '1.2'];

function fehler(text) {
  return new Error(`Konfiguration: ${text}`);
}

const leer = (v) => v === undefined || v === null || String(v).trim() === '';

/** http(s)-Adresse ohne „/“ am Ende, ohne Query und Fragment. Gibt die Adresse unverändert zurück oder wirft. */
function basisUrl(name, wert) {
  const v = String(wert).trim();
  let u;
  try {
    u = new URL(v);
  } catch {
    throw fehler(`${name} ist keine gültige Adresse.`);
  }
  if (!['https:', 'http:'].includes(u.protocol)) throw fehler(`${name} muss mit https:// (oder http://) beginnen.`);
  if (v.endsWith('/')) throw fehler(`${name} ohne Schrägstrich am Ende angeben (z. B. https://kryptos.frankjuchim.de).`);
  if (u.search || u.hash || u.username || u.password) throw fehler(`${name} darf keine Parameter, Anker oder Zugangsdaten enthalten.`);
  return v;
}

/** PEM-Blöcke aus PORTAL_PUBLIC_KEY (auch einzeilig mit „\n“, mehrere Blöcke für den Schlüsselwechsel). */
function leseSchluessel(roh) {
  const text = String(roh).replace(/\\n/g, '\n').trim();
  let schluessel;
  try {
    schluessel = schluesselListe(text);
  } catch {
    throw fehler('PORTAL_PUBLIC_KEY enthält einen unlesbaren Schlüssel.');
  }
  if (!schluessel.length) throw fehler('PORTAL_PUBLIC_KEY enthält keinen Schlüssel (erwartet: PEM „-----BEGIN PUBLIC KEY-----“).');
  if (schluessel.some((k) => k.asymmetricKeyType !== 'ed25519')) throw fehler('PORTAL_PUBLIC_KEY: nur Ed25519-Schlüssel sind erlaubt.');
  const pem = schluessel.map((k) => k.export({ type: 'spki', format: 'pem' }).trim()).join('\n');
  return { schluessel, pem };
}

function trustProxyWert(v) {
  if (leer(v)) return 1;
  const s = String(v).trim();
  if (/^\d+$/.test(s)) return Number(s);
  if (s === 'true') return true;
  if (s === 'false') return false;
  return s; // Express versteht auch Adresslisten wie „loopback“
}

/**
 * @param {object} env  Umgebung (process.env oder Testwerte)
 * @param {{ test?: boolean }} [o]  test: fehlende Pflichtwerte erlaubt (Konfiguration kommt aus createApp(opts))
 * @returns {{ plattformId: string, plattformUrl: string|null, portalUrl: string|null, portalPublicKey: string|null,
 *   schluessel: import('node:crypto').KeyObject[], sessionSecret: string, vertragVersion: '1.1'|'1.2',
 *   authModus: 'portal', dataDir: string, port: number, trustProxy: number|boolean|string }}
 */
function ladeKonfig(env = process.env, { test = false } = {}) {
  const e = env || {};
  const pflicht = (name) => {
    if (leer(e[name])) {
      if (test) return null;
      throw fehler(`${name} fehlt.`);
    }
    return e[name];
  };

  const authModus = leer(e.AUTH_MODUS) ? 'portal' : String(e.AUTH_MODUS).trim();
  if (authModus !== 'portal') throw fehler(`Kryptos unterstützt nur AUTH_MODUS=portal (gesetzt: „${authModus}“).`);

  const plattformId = leer(e.PLATTFORM_ID) ? STANDARD_ID : String(e.PLATTFORM_ID).trim();
  if (!ID_MUSTER.test(plattformId)) throw fehler('PLATTFORM_ID muss aus Kleinbuchstaben, Ziffern und „-“ bestehen (2–31 Zeichen, Beginn mit Buchstabe).');

  const plattformRoh = pflicht('PLATTFORM_URL');
  const plattformUrl = plattformRoh === null ? null : basisUrl('PLATTFORM_URL', plattformRoh);
  const portalRoh = pflicht('PORTAL_URL');
  const portalUrl = portalRoh === null ? null : basisUrl('PORTAL_URL', portalRoh);

  const schluesselRoh = pflicht('PORTAL_PUBLIC_KEY');
  const { schluessel, pem } = schluesselRoh === null ? { schluessel: [], pem: null } : leseSchluessel(schluesselRoh);

  let sessionSecret = leer(e.SESSION_SECRET) ? null : String(e.SESSION_SECRET);
  if (!test && (!sessionSecret || sessionSecret.length < 32)) throw fehler('SESSION_SECRET fehlt oder ist kürzer als 32 Zeichen.');
  if (!sessionSecret) sessionSecret = crypto.randomBytes(32).toString('hex');

  const vertragVersion = leer(e.VERTRAG_VERSION) ? '1.1' : String(e.VERTRAG_VERSION).trim();
  if (!VERTRAG_VERSIONEN.includes(vertragVersion)) throw fehler('VERTRAG_VERSION muss 1.1 oder 1.2 sein.');

  let port = 80;
  if (!leer(e.PORT)) {
    if (!/^\d{1,5}$/.test(String(e.PORT).trim()) || Number(e.PORT) > 65535) throw fehler('PORT muss eine Zahl zwischen 0 und 65535 sein.');
    port = Number(e.PORT);
  }

  return {
    plattformId,
    plattformUrl,
    portalUrl,
    portalPublicKey: pem,
    schluessel,
    sessionSecret,
    vertragVersion,
    authModus,
    dataDir: leer(e.DATA_DIR) ? path.join(__dirname, '..', '..', 'data') : String(e.DATA_DIR),
    port,
    trustProxy: trustProxyWert(e.TRUST_PROXY)
  };
}

module.exports = { ladeKonfig, STANDARD_ID };
