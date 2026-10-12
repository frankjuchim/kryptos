/* Algo Quest Lab – Klammerformat für Binärbäume (gemeinsam für Server und Browser, kein Build)
 *
 * Format:  wert(links,rechts)   leerer Baum: -   Blatt: x  (≙ x(-,-))
 * Werte enthalten keine Zeichen ( ) , – Leerzeichen um Werte werden ignoriert.
 * Beispiel: 8(3(1,6(4,7)),10(-,14(13,-)))
 *
 * Knoten im Speicher: { v: 'wert', l: Knoten|null, r: Knoten|null }  (null = leerer Baum)
 * Pfade: "" = Wurzel, je Schritt L oder R (z. B. "LR").
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AQBaum = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class BaumFehler extends Error {}

  /** Klammerstring → Knoten (null = leer). Wirft BaumFehler mit verständlicher Meldung. */
  function parse(text) {
    if (typeof text !== 'string') throw new BaumFehler('Baum muss als Text angegeben werden.');
    if (text.length > 5000) throw new BaumFehler('Baum ist zu groß.');
    let i = 0;
    const s = text;
    let knoten = 0;
    const ws = () => {
      while (i < s.length && /\s/.test(s[i])) i++;
    };
    function baum(tiefe) {
      if (tiefe > 60) throw new BaumFehler('Baum ist zu tief verschachtelt.');
      ws();
      if (s[i] === '-' && !wertFolgt(i + 1)) {
        i++;
        ws();
        return null;
      }
      const start = i;
      while (i < s.length && !'(),'.includes(s[i])) i++;
      const v = s.slice(start, i).trim();
      if (!v) throw new BaumFehler(`Wert erwartet an Position ${start + 1}.`);
      if (++knoten > 500) throw new BaumFehler('Baum hat zu viele Knoten (max. 500).');
      ws();
      if (s[i] === '(') {
        i++;
        const l = baum(tiefe + 1);
        ws();
        if (s[i] !== ',') throw new BaumFehler(`Komma erwartet an Position ${i + 1}.`);
        i++;
        const r = baum(tiefe + 1);
        ws();
        if (s[i] !== ')') throw new BaumFehler(`Schließende Klammer erwartet an Position ${i + 1}.`);
        i++;
        ws();
        return { v, l, r };
      }
      return { v, l: null, r: null };
    }
    // "-5" ist ein Wert (negative Zahl), "-" allein ist der leere Baum
    function wertFolgt(j) {
      while (j < s.length && /\s/.test(s[j])) j++;
      return j < s.length && !'(),'.includes(s[j]);
    }
    const t = baum(0);
    ws();
    if (i !== s.length) throw new BaumFehler(`Unerwartetes Zeichen „${s[i]}“ an Position ${i + 1}.`);
    return t;
  }

  /** Knoten → kanonischer Klammerstring (Blatt ohne Klammern, leer = "-"). */
  function stringify(n) {
    if (!n) return '-';
    if (!n.l && !n.r) return n.v;
    return `${n.v}(${stringify(n.l)},${stringify(n.r)})`;
  }

  /** Kanonische Form eines Klammerstrings (für Vergleiche). */
  function normalize(text) {
    return stringify(parse(text));
  }

  function istGueltig(text) {
    try {
      parse(text);
      return true;
    } catch {
      return false;
    }
  }

  function knotenAn(n, pfad) {
    let k = n;
    for (const c of String(pfad)) {
      if (!k) return null;
      if (c === 'L') k = k.l;
      else if (c === 'R') k = k.r;
      else return null;
    }
    return k;
  }

  /** Alle Knoten mit Pfad (Preorder). */
  function knotenListe(n, pfad = '', out = []) {
    if (!n) return out;
    out.push({ pfad, v: n.v, knoten: n });
    knotenListe(n.l, pfad + 'L', out);
    knotenListe(n.r, pfad + 'R', out);
    return out;
  }

  function anzahl(n) {
    return n ? 1 + anzahl(n.l) + anzahl(n.r) : 0;
  }

  /** Höhe: leerer Baum 0, Blatt 1 (Konvention der Einheit). */
  function hoehe(n) {
    return n ? 1 + Math.max(hoehe(n.l), hoehe(n.r)) : 0;
  }

  function kopie(n) {
    return n ? { v: n.v, l: kopie(n.l), r: kopie(n.r) } : null;
  }

  /** Setzt am Pfad einen Teilbaum (null = entfernen). Liefert neue Wurzel. */
  function setzeAn(wurzel, pfad, teil) {
    if (!pfad) return teil;
    const w = kopie(wurzel);
    const eltern = knotenAn(w, pfad.slice(0, -1));
    if (!eltern) throw new BaumFehler('Pfad existiert nicht.');
    if (pfad.endsWith('L')) eltern.l = teil;
    else eltern.r = teil;
    return w;
  }

  /** Traversierungen als Pfadfolgen. */
  function preorder(n, p = '', out = []) {
    if (!n) return out;
    out.push(p);
    preorder(n.l, p + 'L', out);
    preorder(n.r, p + 'R', out);
    return out;
  }
  function inorder(n, p = '', out = []) {
    if (!n) return out;
    inorder(n.l, p + 'L', out);
    out.push(p);
    inorder(n.r, p + 'R', out);
    return out;
  }
  function postorder(n, p = '', out = []) {
    if (!n) return out;
    postorder(n.l, p + 'L', out);
    postorder(n.r, p + 'R', out);
    out.push(p);
    return out;
  }
  function levelorder(n) {
    const out = [];
    const q = n ? [{ n, p: '' }] : [];
    while (q.length) {
      const { n: k, p } = q.shift();
      out.push(p);
      if (k.l) q.push({ n: k.l, p: p + 'L' });
      if (k.r) q.push({ n: k.r, p: p + 'R' });
    }
    return out;
  }

  /** Vergleich zweier Werte für Suchbäume: numerisch, wenn beide Zahlen sind, sonst lexikographisch. */
  function vergleiche(a, b) {
    const na = Number(a);
    const nb = Number(b);
    if (a !== '' && b !== '' && Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
    return a < b ? -1 : a > b ? 1 : 0;
  }

  /** Suchbaum: Wert einfügen (Duplikate werden ignoriert). Liefert neue Wurzel. */
  function bstEinfuegen(n, v) {
    if (!n) return { v: String(v), l: null, r: null };
    const c = vergleiche(String(v), n.v);
    if (c < 0) return { v: n.v, l: bstEinfuegen(n.l, v), r: n.r };
    if (c > 0) return { v: n.v, l: n.l, r: bstEinfuegen(n.r, v) };
    return n;
  }

  /**
   * Layout für die Zeichnung: x = Position in Inorder, y = Tiefe.
   * Liefert [{pfad, v, x, y, elternPfad}] sowie Breite/Höhe in Einheiten.
   */
  function layout(n) {
    const out = [];
    let x = 0;
    let maxY = 0;
    (function lauf(k, p, y, eltern) {
      if (!k) return;
      lauf(k.l, p + 'L', y + 1, p);
      out.push({ pfad: p, v: k.v, x: x++, y, elternPfad: eltern });
      if (y > maxY) maxY = y;
      lauf(k.r, p + 'R', y + 1, p);
    })(n, '', 0, null);
    return { knoten: out, breite: x, hoehe: n ? maxY + 1 : 0 };
  }

  return {
    BaumFehler,
    parse,
    stringify,
    normalize,
    istGueltig,
    knotenAn,
    knotenListe,
    anzahl,
    hoehe,
    kopie,
    setzeAn,
    preorder,
    inorder,
    postorder,
    levelorder,
    vergleiche,
    bstEinfuegen,
    layout
  };
});
