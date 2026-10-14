'use strict';
// Kern-Kandidat lab-kern: Verbund-Konfiguration einer Plattform (VERTRAG §8, TECHNIK §6.1).
// Liest die Umgebungsvariablen, prüft sie streng und wirft bei Fehlern einen Error mit deutscher Meldung
// (server.js bricht dann den Start ab). Im Testmodus ({ test: true }) dürfen Pflichtwerte fehlen; angegebene Werte
// werden trotzdem geprüft. ADMIN_EMAIL/ADMIN_PASSWORD werden bewusst nicht gelesen (Superadmin kommt vom Portal).

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { schluesselListe } = require('../jwt');

const STANDARD_ID = 'kryptos';
const ID_MUSTER = /^[a-z][a-z0-9-]{1,30}$/;
// Verbindlich ist labs-VERTRAG.md v1.2 (Entscheidung der Lehrkraft, TECHNIK §6.10). Kryptos erfüllt nur diese Fassung
// (Manifest mit niveaus/urls.niveaus, Niveau-Übersicht §9); jeder andere Wert bricht den Start ab, damit eine alte
// Einstellung (z. B. VERTRAG_VERSION=1.1 aus früheren Anleitungen) nicht still ein anderes Verhalten verspricht.
const VERTRAG_VERSION = '1.2';

function fehler(text) {
  return new Error(`Konfiguration: ${text}`);
}

const leer = (v) => v === undefined || v === null || String(v).trim() === '';

// Rechnernamen, für die im Betrieb (NODE_ENV=production) auch http:// erlaubt ist (Docker-Nachbau, Portal-e2e; E149)
const LOKALE_RECHNER = new Set(['localhost', '127.0.0.1', '[::1]']);

/**
 * http(s)-Adresse ohne „/“ am Ende, ohne Query und Fragment. Gibt die Adresse unverändert zurück oder wirft.
 * Im Betrieb ({ produktion: true }) nur https://, Ausnahme lokale Rechnernamen (M9 E149).
 */
function basisUrl(name, wert, { produktion = false } = {}) {
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
  if (produktion && u.protocol !== 'https:' && !LOKALE_RECHNER.has(u.hostname)) throw fehler(`${name} muss im Betrieb mit https:// beginnen.`);
  return v;
}

/**
 * PORTAL_PUBLIC_KEY so bereinigen, wie er beim Einfügen oft ankommt (M9 E150): umgebende Anführungszeichen,
 * Windows-Zeilenenden (echt oder als „\r“), Leerzeichen am Rand, einzeilig mit „\n“.
 */
function bereinigeSchluessel(roh) {
  let text = String(roh).trim();
  for (let i = 0; i < 2 && /^(["']).*\1$/s.test(text); i++) text = text.slice(1, -1).trim();
  return text.replace(/\\r/g, '').replace(/\\n/g, '\n').replace(/\r/g, '').trim();
}

/** PEM-Blöcke aus PORTAL_PUBLIC_KEY (auch einzeilig mit „\n“, mehrere Blöcke für den Schlüsselwechsel). */
function leseSchluessel(roh) {
  const text = bereinigeSchluessel(roh);
  // Verwechslung mit dem privaten Schlüssel des Portals: eigene Meldung, nie den Schlüsseltext ausgeben
  if (/PRIVATE KEY/.test(text)) throw fehler('PORTAL_PUBLIC_KEY enthält einen privaten Schlüssel – nur den öffentlichen Schlüssel des Portals eintragen.');
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
 *   schluessel: import('node:crypto').KeyObject[], sessionSecret: string, vertragVersion: '1.2',
 *   authModus: 'portal', dataDir: string, port: number, trustProxy: number|boolean|string }}
 */
function ladeKonfig(env = process.env, { test = false } = {}) {
  const e = env || {};
  const produktion = String(e.NODE_ENV || '').trim() === 'production';
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
  const plattformUrl = plattformRoh === null ? null : basisUrl('PLATTFORM_URL', plattformRoh, { produktion });
  const portalRoh = pflicht('PORTAL_URL');
  const portalUrl = portalRoh === null ? null : basisUrl('PORTAL_URL', portalRoh, { produktion });

  const schluesselRoh = pflicht('PORTAL_PUBLIC_KEY');
  const { schluessel, pem } = schluesselRoh === null ? { schluessel: [], pem: null } : leseSchluessel(schluesselRoh);

  let sessionSecret = leer(e.SESSION_SECRET) ? null : String(e.SESSION_SECRET);
  if (!test && (!sessionSecret || sessionSecret.length < 32)) throw fehler('SESSION_SECRET fehlt oder ist kürzer als 32 Zeichen.');
  if (!sessionSecret) sessionSecret = crypto.randomBytes(32).toString('hex');

  const vertragVersion = leer(e.VERTRAG_VERSION) ? VERTRAG_VERSION : String(e.VERTRAG_VERSION).trim();
  if (vertragVersion !== VERTRAG_VERSION) throw fehler(`VERTRAG_VERSION muss ${VERTRAG_VERSION} sein (Vertrag labs v${VERTRAG_VERSION}; gesetzt: „${vertragVersion}“). Am besten weglassen.`);

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

/** Fingerabdruck eines öffentlichen Schlüssels: „sha256:“ + erste 16 Hex von SHA-256 über die SPKI-DER-Form. */
function fingerabdruck(key) {
  return 'sha256:' + crypto.createHash('sha256').update(key.export({ type: 'spki', format: 'der' })).digest('hex').slice(0, 16);
}

/**
 * Startzeile ohne Geheimnisse (M9 E151): kein SESSION_SECRET, kein Schlüsseltext – nur Anzahl und Fingerabdrücke.
 * @returns {{ plattformId: string, plattformUrl: string|null, portalUrl: string|null, schluessel: number,
 *   fingerabdruecke: string[], dataDir: string, port: number, trustProxy: number|boolean|string, vertrag: string }}
 */
function konfigZusammenfassung(konfig) {
  return {
    plattformId: konfig.plattformId,
    plattformUrl: konfig.plattformUrl,
    portalUrl: konfig.portalUrl,
    schluessel: konfig.schluessel.length,
    fingerabdruecke: konfig.schluessel.map(fingerabdruck),
    dataDir: konfig.dataDir,
    port: konfig.port,
    trustProxy: konfig.trustProxy,
    vertrag: konfig.vertragVersion
  };
}

/**
 * DATA_DIR vor dem Öffnen der Datenbank prüfen (Review Focus M9/1: CapRover-Volume gehört root, Benutzer node):
 * rekursiv anlegen, Probe-Datei schreiben und löschen. Wirft einen Error mit deutscher Meldung.
 */
function pruefeDatenDir(dir) {
  const probe = path.join(dir, '.schreibprobe');
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(probe, 'ok');
    fs.unlinkSync(probe);
  } catch (e) {
    throw fehler(`DATA_DIR ${dir} ist nicht beschreibbar (${e.code || 'Fehler'}). Ordner anlegen und dem Benutzer des Servers (im Image: node) Schreibrechte geben.`);
  }
}

module.exports = { ladeKonfig, konfigZusammenfassung, pruefeDatenDir, bereinigeSchluessel, STANDARD_ID, VERTRAG_VERSION };
