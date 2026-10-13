/* Kryptos – Funkraum: Whitelist, Normalisierung und Klartext-Hash (TECHNIK §12.3, Plan M7 Task 131, E93, E108).
   Einziger Weg für Text in funk_nachrichten.inhalt ist pruefeInhalt (Whitelist ^[A-Z0-9 ]{1,160}$ nach toUpperCase,
   keine andere stille Umformung). Klartexte werden nie gespeichert, nur HMAC-SHA256(salz, Krypto.normalisieren(text)) –
   Ziffern zählen (E93: „TOR 3“ ≠ „TOR 8“). */
'use strict';
const crypto = require('node:crypto');
const Krypto = require('../../../public/static/js/shared/krypto');
const { ValidationError } = require('../../validate');

const WHITELIST = /^[A-Z0-9 ]{1,160}$/;
const MELDUNG_INHALT = 'Nur A–Z, 0–9 und Leerzeichen, höchstens 160 Zeichen.';

/** Funkraum-Text prüfen → GROSS; sonst 400 (Umlaute ersetzt der Client vorher sichtbar) */
function pruefeInhalt(text) {
  if (typeof text !== 'string') throw new ValidationError(MELDUNG_INHALT);
  // vor der Großschreibung nur ASCII zulassen: 'ß'.toUpperCase() = 'SS' wäre eine stille Umformung
  if (!/^[A-Za-z0-9 ]*$/.test(text)) throw new ValidationError(MELDUNG_INHALT);
  const gross = text.toUpperCase();
  if (!WHITELIST.test(gross) || !/[A-Z0-9]/.test(gross)) throw new ValidationError(MELDUNG_INHALT);
  return gross;
}

/** Klartext zum Prüfen → Normalform (A–Z, 0–9), 1–max Zeichen; sonst 400 */
function pruefeKlartext(text, { max = 160 } = {}) {
  const meldung = `Der Klartext muss 1 bis ${max} Buchstaben oder Ziffern haben.`;
  if (typeof text !== 'string' || text.length > 4 * max + 100) throw new ValidationError(meldung);
  const n = Krypto.normalisieren(text);
  if (n.length < 1 || n.length > max) throw new ValidationError(meldung);
  return n;
}

/** HMAC-SHA256(salz, normalisieren(text)) als 64 Hexziffern */
function hash(salz, text) {
  return crypto.createHmac('sha256', String(salz)).update(Krypto.normalisieren(String(text)), 'utf8').digest('hex');
}

/** Konstantzeit-Vergleich zweier Hex-Hashes; ungleiche Länge oder Nicht-Strings → false */
function gleich(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
}

/** Hex-Text → „55 85 A8 2E“ (GROSS, Paare mit einem Leerzeichen); ungültig → 400 */
function hexPaare(text) {
  if (typeof text !== 'string') throw new ValidationError('Hex besteht aus Paaren der Zeichen 0–9 und A–F.');
  let bytes;
  try { bytes = Krypto.vonHex(text); } catch (e) { throw new ValidationError('Hex besteht aus Paaren der Zeichen 0–9 und A–F.'); }
  if (!bytes.length) throw new ValidationError('Hex besteht aus Paaren der Zeichen 0–9 und A–F.');
  return bytes.map((b) => Krypto.hex([b])).join(' ');
}

/** Teamname in Whitelist-Form: „Team Schlüsselpaar“ → „TEAM SCHLUESSELPAAR“ (je Wort normalisiert) */
function grossName(teamName) {
  return String(teamName).split(/\s+/).map((w) => Krypto.normalisieren(w)).filter(Boolean).join(' ');
}

/** neues Salz: 32 Zufallsbytes als base64url (43 Zeichen) */
function neuesSalz(zufallBytes) {
  return Buffer.from(zufallBytes(32)).toString('base64url');
}

module.exports = { WHITELIST, pruefeInhalt, pruefeKlartext, hash, gleich, hexPaare, grossName, neuesSalz };
