'use strict';
// Konfiguration des Plattform-Verbunds (VERTRAG.md v1.1 §8): PLATTFORM_ID, PLATTFORM_URL, PORTAL_URL,
// PORTAL_PUBLIC_KEY, AUTH_MODUS. SSO ist nur aktiv, wenn Modus „beides“/„portal“ UND Portal-Adresse und Schlüssel passen.

const { schluesselListe } = require('./jwt');

const ID_MUSTER = /^[a-z][a-z0-9-]{1,30}$/;

/** URL ohne Schrägstrich am Ende; nur http(s). Ungültig → null. */
function basisUrl(v) {
  if (typeof v !== 'string' || !v.trim()) return null;
  try {
    const u = new URL(v.trim().replace(/^["']|["']$/g, ''));
    if (!['https:', 'http:'].includes(u.protocol)) return null;
    u.hostname = u.hostname.replace(/\.+$/, ''); // „https://labs.frankjuchim.de.“ (Tippfehler) → ohne Punkt
    return u.origin + u.pathname.replace(/\/+$/, '');
  } catch {
    return null;
  }
}

/**
 * PORTAL_PUBLIC_KEY tolerant lesen: Anführungszeichen, „\\n“, Leerzeichen statt Zeilenumbrüchen (Einfügen in ein
 * einzeiliges Feld) oder nur der Base64-Teil – jeder Block wird als sauberes PEM neu aufgebaut.
 */
function normalisierePem(roh) {
  const text = String(roh || '').replace(/\\n/g, '\n').replace(/^\s*["']|["']\s*$/g, '');
  const bloecke = [...text.matchAll(/-----BEGIN PUBLIC KEY-----([\s\S]*?)-----END PUBLIC KEY-----/g)].map((m) => m[1]);
  if (!bloecke.length && /^[A-Za-z0-9+/=\s]{40,}$/.test(text.trim())) bloecke.push(text);
  return bloecke
    .map((b) => b.replace(/\s+/g, ''))
    .filter(Boolean)
    .map((b) => `-----BEGIN PUBLIC KEY-----\n${b.match(/.{1,64}/g).join('\n')}\n-----END PUBLIC KEY-----`)
    .join('\n');
}

/**
 * @param {object} env  Umgebung (process.env oder Testwerte)
 * @param {Function} [log]
 */
function verbundKonfig(env = process.env, log = () => {}) {
  const id = ID_MUSTER.test(env.PLATTFORM_ID || '') ? env.PLATTFORM_ID : 'algoquest';
  const modus = ['lokal', 'portal', 'beides'].includes(env.AUTH_MODUS) ? env.AUTH_MODUS : 'lokal';
  const portal = basisUrl(env.PORTAL_URL);
  const url = basisUrl(env.PLATTFORM_URL);
  let schluessel = [];
  try {
    schluessel = env.PORTAL_PUBLIC_KEY ? schluesselListe(normalisierePem(env.PORTAL_PUBLIC_KEY)) : [];
  } catch (e) {
    log(`WARNUNG: PORTAL_PUBLIC_KEY nicht lesbar (${e.message}).`);
    schluessel = [];
  }
  const sso = modus !== 'lokal' && !!portal && schluessel.length > 0;
  if (modus !== 'lokal' && !sso) log(`WARNUNG: AUTH_MODUS=${modus}, aber PORTAL_URL oder PORTAL_PUBLIC_KEY fehlen bzw. sind ungültig – Anmeldung über das Portal ist aus.`);
  return {
    id,
    modus,
    portal,
    url,
    schluessel,
    sso,
    // lokale Anmeldung/Registrierung nur in „lokal“ und „beides“ (bzw. wenn SSO nicht funktioniert)
    lokal: modus !== 'portal' || !sso
  };
}

module.exports = { verbundKonfig, basisUrl, normalisierePem };
