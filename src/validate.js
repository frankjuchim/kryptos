'use strict';
// Kleine Validierungshelfer (aus v1 übernommen und erweitert). Werfen ValidationError mit deutscher Meldung.

class ValidationError extends Error {
  constructor(message, details) {
    super(message);
    this.status = 400;
    this.details = details;
  }
}

class NotFoundError extends Error {
  constructor(message = 'Nicht gefunden.') {
    super(message);
    this.status = 404;
  }
}

function str(value, field, { min = 0, max = 200, trim = true, optional = false } = {}) {
  if (value === undefined || value === null) {
    if (optional) return '';
    throw new ValidationError(`${field} fehlt.`);
  }
  if (typeof value !== 'string') throw new ValidationError(`${field} muss Text sein.`);
  const v = trim ? value.trim() : value;
  if (v.length < min) throw new ValidationError(min <= 1 ? `${field} darf nicht leer sein.` : `${field} ist zu kurz (mind. ${min} Zeichen).`);
  if (v.length > max) throw new ValidationError(`${field} ist zu lang (max. ${max} Zeichen).`);
  return v;
}

function int(value, field, { min = -Infinity, max = Infinity, optional = false } = {}) {
  if (value === undefined || value === null || value === '') {
    if (optional) return null;
    throw new ValidationError(`${field} fehlt.`);
  }
  const n = typeof value === 'number' ? value : typeof value === 'string' && /^-?\d+$/.test(value.trim()) ? Number(value) : NaN;
  if (!Number.isInteger(n)) throw new ValidationError(`${field} muss eine ganze Zahl sein.`);
  if (n < min || n > max) throw new ValidationError(`${field} muss zwischen ${min} und ${max} liegen.`);
  return n;
}

/** Kommazahl (Zahl oder Text mit Punkt/Komma, höchstens 3 Nachkommastellen). */
function num(value, field, { min = -1e12, max = 1e12, optional = false } = {}) {
  if (value === undefined || value === null || value === '') {
    if (optional) return null;
    throw new ValidationError(`${field} fehlt.`);
  }
  let n = NaN;
  if (typeof value === 'number') n = value;
  else if (typeof value === 'string' && /^-?\d{1,13}([.,]\d{1,3})?$/.test(value.trim())) n = Number(value.trim().replace(',', '.'));
  if (!Number.isFinite(n)) throw new ValidationError(`${field} muss eine Zahl sein.`);
  if (n < min || n > max) throw new ValidationError(`${field} muss zwischen ${min} und ${max} liegen.`);
  return Math.round(n * 1000) / 1000;
}

function bool(value, field) {
  if (value === true || value === 1 || value === '1' || value === 'true') return true;
  if (value === false || value === 0 || value === '0' || value === 'false') return false;
  throw new ValidationError(`${field} muss ja oder nein sein.`);
}

function id(value, field = 'ID') {
  return int(value, field, { min: 1, max: Number.MAX_SAFE_INTEGER });
}

function color(value, field = 'Farbe') {
  const v = str(value, field, { min: 4, max: 7 });
  if (!/^#[0-9a-fA-F]{6}$/.test(v)) throw new ValidationError(`${field} muss im Format #RRGGBB angegeben werden.`);
  return v.toUpperCase();
}

function date(value, field = 'Datum') {
  const v = str(value, field, { min: 10, max: 10 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(v + 'T00:00:00Z'))) {
    throw new ValidationError(`${field} muss im Format JJJJ-MM-TT angegeben werden.`);
  }
  return v;
}

/**
 * Schülername (SPEC §1): getrimmt, 2–30 Zeichen, Buchstaben/Ziffern/Leerzeichen/.-'
 * Liefert { name, key } – key ist die Vergleichsform (case-insensitiv, Leerzeichen zusammengefasst).
 */
function schuelerName(value) {
  if (typeof value !== 'string') throw new ValidationError('Bitte gib einen Namen ein.');
  const v = value.normalize('NFC').trim().replace(/\s+/g, ' ');
  if (v.length < 2) throw new ValidationError('Der Name ist zu kurz (mindestens 2 Zeichen).');
  if (v.length > 30) throw new ValidationError('Der Name ist zu lang (höchstens 30 Zeichen).');
  if (!/^[\p{L}\p{N} .\-']+$/u.test(v)) {
    throw new ValidationError('Der Name darf nur Buchstaben, Ziffern, Leerzeichen, Punkt, Bindestrich und Apostroph enthalten.');
  }
  return { name: v, key: v.toLocaleLowerCase('de-DE') };
}

function email(value) {
  const v = str(value, 'E-Mail', { min: 3, max: 200 }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) throw new ValidationError('Bitte eine gültige E-Mail-Adresse angeben.');
  return v;
}

function passwort(value, field = 'Passwort') {
  if (typeof value !== 'string') throw new ValidationError(`${field} fehlt.`);
  if (value.length < 10) throw new ValidationError(`${field} muss mindestens 10 Zeichen lang sein.`);
  if (value.length > 200) throw new ValidationError(`${field} ist zu lang.`);
  return value;
}

function idList(value, field) {
  if (!Array.isArray(value) || value.length === 0) throw new ValidationError(`${field}: mindestens eine Auswahl nötig.`);
  if (value.length > 500) throw new ValidationError(`${field}: zu viele Einträge.`);
  return [...new Set(value.map((v) => id(v, field)))];
}

function today() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

class ForbiddenError extends Error {
  constructor(message = 'Keine Berechtigung.') {
    super(message);
    this.status = 403;
  }
}

class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.status = 409;
  }
}

module.exports = { ValidationError, NotFoundError, ForbiddenError, ConflictError, str, int, num, bool, id, color, date, schuelerName, email, passwort, idList, today };
