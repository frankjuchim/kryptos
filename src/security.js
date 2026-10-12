'use strict';
const crypto = require('node:crypto');

/* ---------- Cookies: getrennt für Schüler und Lehrkräfte (Kryptos: kr_*, TECHNIK §6.4) ---------- */
const COOKIE_SCHUELER = 'kr_s';
const COOKIE_LEHRKRAFT = 'kr_l';
const COOKIE_SSO_STATE = 'kr_sso_state';

function b64url(buf) {
  return Buffer.from(buf).toString('base64url');
}

/** Signiertes, zustandsloses Token (HMAC-SHA256). */
function sign(payload, secret) {
  const body = b64url(JSON.stringify(payload));
  const mac = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${mac}`;
}

function verify(token, secret) {
  if (typeof token !== 'string' || token.length > 4096) return null;
  const dot = token.indexOf('.');
  if (dot < 1) return null;
  const body = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload || typeof payload !== 'object') return null;
    if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (k && !(k in out)) {
      try {
        out[k] = decodeURIComponent(v);
      } catch {
        out[k] = v;
      }
    }
  }
  return out;
}

/** Session-Cookie: httpOnly, SameSite=Lax, secure hinter HTTPS (req.secure berücksichtigt TRUST_PROXY). */
function setCookie(req, res, name, payload, secret, maxAgeMs) {
  const token = sign({ ...payload, exp: Date.now() + maxAgeMs }, secret);
  res.cookie(name, token, { httpOnly: true, sameSite: 'lax', secure: req.secure, path: '/', maxAge: maxAgeMs });
}

function clearCookie(req, res, name) {
  res.clearCookie(name, { httpOnly: true, sameSite: 'lax', secure: req.secure, path: '/' });
}

/** Konstantzeit-Vergleich zweier Strings. */
function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

/* ---------- Rate-Limits (im Speicher) ---------- */

class Limiter {
  /** @param {{max:number, windowMs:number}} o */
  constructor({ max, windowMs }) {
    this.max = max;
    this.windowMs = windowMs;
    this.map = new Map();
    // abgelaufene Einträge (Schlüssel enthalten u. a. IP-Adressen) spätestens nach einer Minute entfernen
    // (Datenschutz: IP-Adressen werden nur für die Dauer des Zeitfensters gehalten)
    this.aufraeumer = setInterval(() => this.prune(), 60 * 1000);
    this.aufraeumer.unref();
  }
  _entry(key, now) {
    let e = this.map.get(key);
    if (!e || e.reset <= now) {
      e = { count: 0, reset: now + this.windowMs };
      this.map.set(key, e);
    }
    return e;
  }
  isBlocked(key, now = Date.now()) {
    const e = this.map.get(key);
    if (!e || e.reset <= now) return false;
    return e.count >= this.max;
  }
  retryAfterSec(key, now = Date.now()) {
    const e = this.map.get(key);
    return e ? Math.max(1, Math.ceil((e.reset - now) / 1000)) : 0;
  }
  /** Zählt einen Vorgang (Fehlversuch bzw. Anfrage). */
  hit(key, now = Date.now()) {
    const e = this._entry(key, now);
    e.count += 1;
    if (this.map.size > 20000) this.prune(now);
  }
  /** Zählt und meldet, ob das Limit jetzt überschritten ist. */
  take(key, now = Date.now()) {
    if (this.isBlocked(key, now)) return false;
    this.hit(key, now);
    return true;
  }
  reset(key) {
    this.map.delete(key);
  }
  prune(now = Date.now()) {
    for (const [k, e] of this.map) if (e.reset <= now) this.map.delete(k);
  }
}

/* ---------- CSRF-Schutz: Origin-/Referer-Prüfung + JSON-Pflicht ---------- */

function sameOriginCheck(req, res, next) {
  const method = req.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return next();
  const host = req.get('host');
  const origin = req.get('origin');
  const referer = req.get('referer');
  let source = null;
  try {
    if (origin && origin !== 'null') source = new URL(origin).host;
    else if (referer) source = new URL(referer).host;
  } catch {
    source = null;
  }
  if (!source || source !== host) {
    return res.status(403).json({ error: 'Anfrage abgelehnt (Herkunft ungültig).' });
  }
  if (method !== 'DELETE' && !req.is('application/json')) {
    return res.status(415).json({ error: 'Nur JSON-Anfragen erlaubt.' });
  }
  next();
}

/* ---------- Zufall ---------- */

/** Zufallstext aus `bytes` Zufallsbytes, base64url (z. B. 9 Byte → 12 Zeichen für den Board-Schlüssel). */
function zufallsText(bytes) {
  return crypto.randomBytes(bytes).toString('base64url');
}

module.exports = {
  COOKIE_SCHUELER,
  COOKIE_LEHRKRAFT,
  COOKIE_SSO_STATE,
  sign,
  verify,
  parseCookies,
  setCookie,
  clearCookie,
  safeEqual,
  Limiter,
  sameOriginCheck,
  zufallsText
};
