/* Kryptos – Erkenner für Aufgabenwerte im Kryptolabor (Plan M11 Task 242, E210–E213; entsteht aus der Sperr-Idee D17).
   Kennt nur SHA-256-Kennungen (8 Hex) von Signaturen der Angaben aller Prüflinge, bei denen ein Reiter frei rechnend
   eine Lösung ausgäbe (Daten in labor/erkenner/<id>.js, erzeugt von werkzeuge/krypto/erkenner_bauen.js). Erkennt ein
   Werkzeug solche Werte, wechselt es in den geführten Modus bzw. zeigt „nicht verfügbar“ (KRLaborBau.erkenne).
   Signaturen (E212, alles normalisiert A–Z/0–9, Bits 0/1):
     t:<Fenster>          Text: Fenster aus 5 Zeichen; Texte und Wörter unter 5 Zeichen als ganzes Token
     g:<Text>             ganzer Text (für Klartexte, die allein erkannt werden)
     t:<Fenster>|s:<S>    Text mit Schlüssel/Parameter (k=12, u=4, n=3, t=5, st=A, loch=…, Wort)
     s:<S>                Schlüssel allein (Alphabet- und Quadrat-Trick)
     z:<a,b,…>            Zahlen (aufsteigend, Teilmengen ab 2 der eingegebenen Zahlen)
     b:<bits>             eine Bitfolge, b:<x>|b:<y> zwei Bitfolgen bzw. ausgerichtete Bytepaare (XOR)
     t:<Fenster>|b:<bits> Text mit Bitschlüssel (Runden-Modi)
   Verlauf (E213): alle Eingaben seit dem Öffnen (auch über „Neue Nachricht“, „⌫“, Reiterwechsel) zählen mit.
   Lehrkräfte: nie erkannt. Rahmen ohne Verfahrensrechnung; Hash nur über Krypto.sha256. Speichert nichts. */
(function (wurzel, fabrik) {
  const K = typeof module === 'object' && module.exports ? require('../../shared/krypto.js') : wurzel.Krypto;
  const api = fabrik(K);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else wurzel.KRErkenner = api;
})(typeof self !== 'undefined' ? self : this, function (Krypto) {
  'use strict';

  const FENSTER = 5;
  const MAX_TEXT = 600; // Zeichen je Text bzw. Verlaufsstrom
  const MAX_ZAHLEN = 8; // Teilmengen nur der ersten 8 Zahlen
  const PRAEFIX = 'KR-E1|';

  const norm = (t) => Krypto.normalisieren(String(t ?? '')).slice(0, MAX_TEXT);
  const bits = (t) => String(t ?? '').replace(/[^01]/g, '');

  /**
   * Formen eines Texts, mit denen ein Werkzeug rechnen kann: normalisiert (A–Z, 0–9) und nur Buchstaben – die meisten
   * Werkzeuge rechnen mit Krypto.nurBuchstaben, eingestreute Ziffern dürfen den Erkenner nicht umgehen (Review-Fund 1).
   */
  const formen = (roh) => [...new Set([norm(roh), Krypto.nurBuchstaben(norm(roh))])].filter(Boolean);

  /** Text-Signaturen eines Texts (je Form): Fenster bzw. ganzes Token, dazu jedes kurze Wort als Token */
  function textSignaturen(roh) {
    const out = new Set();
    for (const n of formen(roh)) {
      if (n.length < FENSTER) out.add(`t:${n}`);
      else {
        for (let i = 0; i + FENSTER <= n.length; i++) out.add(`t:${n.slice(i, i + FENSTER)}`);
        out.add(`g:${n}`); // ganzer Text (Klartexte allein: kein Fehlalarm bei einzelnen Wörtern)
      }
    }
    for (const w of String(roh ?? '').split(/[^0-9A-Za-zÄÖÜäöüß]+/)) {
      for (const x of formen(w)) if (x.length >= 2 && x.length < FENSTER) out.add(`t:${x}`);
    }
    return out;
  }

  /** Teilmengen (Größe ≥ 2) einer Zahlenliste und einzelne Zahlen ab 10 als z-Signaturen */
  function zahlSignaturen(liste) {
    const z = [...new Set((liste || []).map(Number).filter((x) => Number.isSafeInteger(x) && x >= 0))].slice(0, MAX_ZAHLEN).sort((a, b) => a - b);
    const out = z.filter((x) => x >= 10).map((x) => `z:${x}`); // einzelne Zahlen ab 10 (z. B. Exponent d = 53)
    (function lauf(ab, teil) {
      if (teil.length >= 2) out.push(`z:${teil.join(',')}`);
      for (let i = ab; i < z.length; i++) lauf(i + 1, [...teil, z[i]]);
    })(0, []);
    return out;
  }

  /**
   * Alle Signaturen einer Eingabe. eingaben = { texte, schluessel, zahlen, bits, bitpaare } (alles optional).
   * wr („werkzeug.reiter“) bleibt für spätere Sonderregeln; die Signatur hängt nur von den Werten ab.
   */
  function signaturen(wr, eingaben) {
    const e = eingaben || {};
    const out = new Set();
    const texte = new Set();
    for (const t of e.texte || []) for (const s of textSignaturen(t)) texte.add(s);
    const schluessel = [...new Set((e.schluessel || []).map((s) => String(s).toUpperCase().replace(/[^A-Z0-9=,;]/g, '')).filter(Boolean))];
    const folgen = [...new Set((e.bits || []).map(bits).filter((b) => b.length >= 8))];
    for (const t of texte) out.add(t);
    for (const s of schluessel) {
      out.add(`s:${s}`);
      for (const t of texte) out.add(`${t}|s:${s}`);
    }
    for (const b of folgen) {
      out.add(`b:${b}`);
      for (const t of texte) out.add(`${t}|b:${b}`);
    }
    for (let i = 0; i < folgen.length; i++) for (let j = i + 1; j < folgen.length; j++) out.add(`b:${[folgen[i], folgen[j]].sort().join('|b:')}`);
    for (const p of e.bitpaare || []) {
      const x = bits(p && p[0]);
      const y = bits(p && p[1]);
      if (x.length === 8 && y.length === 8) out.add(`b:${[x, y].sort().join('|b:')}`);
    }
    for (const z of zahlSignaturen(e.zahlen)) out.add(z);
    return [...out];
  }

  const CACHE = new Map();
  /** Kennung = 8 Hex von SHA-256('KR-E1|' + Signatur) */
  function kennung(sig) {
    let k = CACHE.get(sig);
    if (!k) {
      k = Krypto.sha256(PRAEFIX + sig).slice(0, 8).toLowerCase();
      if (CACHE.size > 20000) CACHE.clear();
      CACHE.set(sig, k);
    }
    return k;
  }

  const DATEN = new Map(); // id → Map(reiter → Set(kennung))
  /** Erkenner-Daten eines Werkzeugs registrieren (labor/erkenner/<id>.js): { reiter: [kennung …] } */
  function daten(id, tabelle) {
    const m = new Map();
    for (const [r, liste] of Object.entries(tabelle || {})) m.set(r, new Set((Array.isArray(liste) ? liste : []).filter((x) => /^[0-9a-f]{8}$/.test(x))));
    DATEN.set(id, m);
  }
  const hatDaten = (id) => DATEN.has(id);
  /** id und Reiter aus „werkzeug.reiter“ (ohne Reiter: '*') */
  function teile(wr) {
    const i = String(wr).indexOf('.');
    return i < 0 ? [String(wr), '*'] : [wr.slice(0, i), wr.slice(i + 1)];
  }

  /**
   * Verlauf seit dem Öffnen (E213): merkt Texte (ganz und als fortlaufender Strom – häppchenweise Eingaben, „Neue
   * Nachricht“) und Schlüssel. mit(eingaben) ergänzt aktuelle Eingaben um den Verlauf.
   */
  function verlauf() {
    const texte = [];
    const schluessel = new Set();
    let strom = '';
    let letzter = '';
    function merke(e) {
      for (const roh of (e && e.texte) || []) {
        const t = norm(roh);
        if (!t) continue;
        if (!texte.includes(String(roh))) {
          texte.push(String(roh).slice(0, MAX_TEXT));
          if (texte.length > 40) texte.shift();
        }
        if (t.startsWith(letzter)) strom += t.slice(letzter.length);
        else if (!letzter.startsWith(t)) strom += t;
        letzter = t;
        if (strom.length > MAX_TEXT) strom = strom.slice(-MAX_TEXT);
      }
      for (const s of (e && e.schluessel) || []) if (schluessel.size < 60) schluessel.add(String(s));
    }
    return {
      merke,
      mit(e) {
        const x = e || {};
        return { ...x, texte: [...(x.texte || []), ...texte, ...(strom ? [strom] : [])], schluessel: [...new Set([...(x.schluessel || []), ...schluessel])] };
      },
      leeren() {
        texte.length = 0;
        schluessel.clear();
        strom = '';
        letzter = '';
      },
      get strom() {
        return strom;
      }
    };
  }

  /** Erkennt der Reiter wr Aufgabenwerte in den Eingaben (samt Verlauf)? Lehrkraft: nie. */
  function erkannt(wr, eingaben, umgebung, v) {
    if (umgebung && umgebung.rolle === 'lehrkraft') return false;
    const [id, reiter] = teile(wr);
    const m = DATEN.get(id);
    const tab = m && m.get(reiter);
    if (!tab || !tab.size) return false;
    const e = v && typeof v.mit === 'function' ? v.mit(eingaben) : eingaben;
    for (const s of signaturen(wr, e)) if (tab.has(kennung(s))) return true;
    return false;
  }

  return { FENSTER, signaturen, textSignaturen, zahlSignaturen, kennung, daten, hatDaten, verlauf, erkannt, teile };
});
