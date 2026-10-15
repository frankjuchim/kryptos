// Kryptos – Folien-Generator im Designsystem „Chronoskop“ (docs/DESIGNSYSTEM.md §9).
//
// Aufruf (normalerweise über bauen.py, das Bilder vorrendert und Pfade einträgt):
//   node kr_pptx.js quelle_vorbereitet.json ausgabe.pptx
//
// Strukturiertes Deck: Theme (Farben/Schriften je Epoche), Folienlayouts mit Platzhaltern,
// Inhalte werden je Folie komponiert. Keine Farbbalken/Akzentstreifen (Designregel).
"use strict";
const fs = require("fs");
const pptxgen = require("pptxgenjs");

const W = 13.333, H = 7.5, RAND = 0.6;
const INHALT_Y = 1.45, INHALT_UNTEN = 6.75;

function loadJSZip() {
  return require(require.resolve("jszip", { paths: [require.resolve("pptxgenjs")] }));
}

// ------------------------------------------------------------------------------------------------
// Mini-Markdown → Text-Runs
// ------------------------------------------------------------------------------------------------
const TOKEN = /(\*\*.+?\*\*|`.+?`|\*.+?\*|\^.+?\^|~.+?~|==.+?==|\[\[luecke(?::\d+)?\]\]|\n)/;

function runs(text, basis, S) {
  const out = [];
  function rek(t, opt) {
    for (const teil of String(t).split(TOKEN)) {
      if (!teil) continue;
      if (teil === "\n") { out.push({ text: "", options: { ...opt, breakLine: true } }); continue; }
      if (teil.startsWith("**") && teil.endsWith("**") && teil.length > 4) rek(teil.slice(2, -2), { ...opt, bold: true });
      else if (teil.startsWith("`") && teil.endsWith("`") && teil.length > 2) out.push({ text: teil.slice(1, -1), options: { ...opt, fontFace: S.SCHRIFT_MONO } });
      else if (teil.startsWith("==") && teil.endsWith("==") && teil.length > 4) out.push({ text: teil.slice(2, -2), options: { ...opt, bold: true, color: basis.akzent || S.MESSING_DUNKEL } });
      else if (teil.startsWith("^") && teil.endsWith("^") && teil.length > 2) out.push({ text: teil.slice(1, -1), options: { ...opt, superscript: true } });
      else if (teil.startsWith("~") && teil.endsWith("~") && teil.length > 2) out.push({ text: teil.slice(1, -1), options: { ...opt, subscript: true } });
      else if (teil.startsWith("[[luecke")) { const n = teil.includes(":") ? parseInt(teil.slice(9, -2)) : 14; out.push({ text: "_".repeat(n), options: { ...opt, color: S.TEXT2 } }); }
      else if (teil.startsWith("*") && teil.endsWith("*") && teil.length > 2) rek(teil.slice(1, -1), { ...opt, italic: true });
      else out.push({ text: teil, options: { ...opt } });
    }
  }
  rek(text, { ...(basis.opt || {}) });
  return out;
}

function reinText(md) {
  return String(md || "").replace(/\*\*|==|`|\^|~|\*/g, "").replace(/\[\[luecke(?::\d+)?\]\]/g, "______________");
}

// Höhe eines Textes abschätzen (Zoll) – Calibri ≈ 0,5 em mittlere Zeichenbreite
function textHoehe(md, breite, pt, faktor = 0.5, zeilenAbstand = 1.22) {
  const proZeile = Math.max(8, Math.floor((breite * 72) / (pt * faktor)));
  let zeilen = 0;
  for (const absatz of reinText(md).split("\n")) zeilen += Math.max(1, Math.ceil(absatz.length / proZeile));
  return (zeilen * pt * zeilenAbstand) / 72;
}

// ------------------------------------------------------------------------------------------------
// Kontrast (WCAG 2.1 AA, DESIGNSYSTEM §2.2, E25) – gleiche Regel wie kr_stil.textfarbe
// ------------------------------------------------------------------------------------------------
function leuchtdichte(h) {
  const c = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function kontrast(a, b) {
  const [x, y] = [leuchtdichte(a), leuchtdichte(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
// Farbe für Text auf hg: farbe, wenn zulässig (kein Epochen-Akzent auf Papier-2, ≥ 4,5 : 1 bzw. großer Text ≥ 3 : 1),
// sonst helle Akzent-Variante (dunkler Grund) bzw. Tinte/Papier.
function textfarbe(S, farbe, hg, pt = 11, fett = false) {
  farbe = String(farbe).toUpperCase(); hg = String(hg).toUpperCase();
  const soll = pt >= 18 || (fett && pt >= 14) ? 3 : 4.5;
  const ok = (f) => !(hg === S.PAPIER2 && S.AKZENTE.includes(f)) && kontrast(f, hg) >= soll;
  if (ok(farbe)) return farbe;
  for (const e of Object.values(S.EPOCHEN)) if (farbe === e.akzent && ok(e.hell)) return e.hell;
  return kontrast(S.TINTE, hg) >= kontrast(S.PAPIER, hg) ? S.TINTE : S.PAPIER;
}

// ------------------------------------------------------------------------------------------------
// Blöcke
// ------------------------------------------------------------------------------------------------
class Setzer {
  constructor(pres, S, ctx) { this.pres = pres; this.S = S; this.ctx = { akzentText: ctx.akzent, ...ctx }; }

  // Setzer für Inhalte auf der Fläche hg: Akzent-Text nur, wo er lesbar ist
  mit(hg) { return new Setzer(this.pres, this.S, { ...this.ctx, akzentText: textfarbe(this.S, this.ctx.akzentText, hg) }); }

  bloecke(slide, liste, x, y, w, pt, dry, farbe) {
    let yy = y;
    for (const b of liste || []) {
      if (b.nur_loesung) continue;
      const h = this.block(slide, b, x, yy, w, pt, dry, farbe);
      yy += h + (b.t === "abstand" ? 0 : 0.14);
    }
    return yy - y;
  }

  block(slide, b, x, y, w, pt, dry, farbe) {
    const S = this.S, ctx = this.ctx;
    farbe = farbe || S.TEXT;
    const t = b.t;
    if (t === "p" || t === "h" || t === "formel") {
      const groesse = t === "h" ? pt + 2 : t === "formel" ? pt + 4 : (b.klein ? pt - 4 : pt);
      const h = textHoehe(b.md, w, groesse) + 0.05;
      if (!dry) slide.addText(runs(b.md, { akzent: ctx.akzentText, opt: { bold: t === "h", fontFace: t === "h" ? S.SCHRIFT_KOPF : undefined, color: t === "h" ? ctx.akzentText : farbe } }, S),
        { x, y, w, h, fontSize: groesse, color: farbe, margin: 0, valign: "top", isTextBox: true, align: (t === "formel" || b.zentriert) ? "center" : "left", fit: "none" });
      return h;
    }
    if (t === "liste") {
      const items = b.items.map((it, i) => {
        const r = runs(it, { akzent: ctx.akzentText, opt: {} }, S);
        const marke = () => (b.nummeriert ? { type: "number", indent: 24 } : b.buchstaben ? { type: "number", style: "alphaLcParenR", indent: 24 } : { code: "25CF", indent: 22 });
        r[0].options = { ...r[0].options, bullet: marke(), paraSpaceAfter: 6 };
        if (i < b.items.length - 1) r[r.length - 1].options = { ...r[r.length - 1].options, breakLine: true };
        return r;
      }).flat();
      let h = 0.05;
      for (const it of b.items) h += textHoehe(it, w - 0.35, pt) + 0.09;
      if (!dry) slide.addText(items, { x, y, w, h, fontSize: pt, color: farbe, margin: 0, valign: "top", isTextBox: true, fit: "none" });
      return h;
    }
    if (t === "geheimtext" || t === "klartext") {
      const roh = String(b.text).replace(/\s+/g, "");
      const n = t === "geheimtext" ? (b.gruppen ?? 5) : 0;
      const gr = b.groesse || Math.max(pt + 2, 20);
      const zeichenProZeile = Math.floor(((w - 0.6) * 72) / (gr * 0.55 + 2));
      const gruppenProZeile = n ? Math.max(1, Math.floor((zeichenProZeile + 1) / (n + 1))) : 0;
      let zeilen = [];
      if (n) { const g = []; for (let i = 0; i < roh.length; i += n) g.push(roh.slice(i, i + n)); for (let i = 0; i < g.length; i += gruppenProZeile) zeilen.push(g.slice(i, i + gruppenProZeile).join(" ")); }
      else zeilen = [b.text];
      const label = b.label ? 0.32 : 0;
      const h = label + zeilen.length * gr * 1.45 / 72 + 0.3;
      if (!dry) {
        slide.addShape(this.pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: S.PAPIER2 }, line: { color: S.LINIE, width: 0.75 }, objectName: "Geheimtext-Kasten" });
        if (b.label) slide.addText(b.label, { x: x + 0.25, y: y + 0.08, w: w - 0.5, h: 0.28, fontSize: 12, bold: true, color: S.TEXT2, charSpacing: 1, margin: 0, isTextBox: true });
        slide.addText(zeilen.join("\n"), { x: x + 0.25, y: y + 0.12 + label, w: w - 0.5, h: h - 0.24 - label, fontFace: S.SCHRIFT_MONO, fontSize: gr, bold: t === "geheimtext", color: t === "geheimtext" ? S.TEXT : S.TEXT2, charSpacing: 2, margin: 0, valign: "top", isTextBox: true, fit: "none", lineSpacingMultiple: 1.15 });
      }
      return h;
    }
    if (t === "tabelle" || t === "verlauf") {
      const kopf = b.kopf || (t === "verlauf" ? ["Phase", "Zeit", "Inhalt", "Sozialform", "Material"] : null);
      const zeilen = b.zeilen;
      const ns = Math.max(kopf ? kopf.length : 0, ...zeilen.map((z) => z.length));
      const gr = b.schrift_folie || Math.min(pt, ns > 8 ? 13 : 16);
      let colW = b.breiten ? b.breiten.map((v) => v) : Array(ns).fill(w / ns);
      const summe = colW.reduce((a, c) => a + c, 0);
      colW = colW.map((c) => (c * Math.min(w, summe > w ? w : summe)) / summe);
      const tw = colW.reduce((a, c) => a + c, 0);
      const hl = new Set((b.hervor || []).map((p) => p.join(",")));
      const zelle = (wert, kopfzelle, erste, key) => {
        const fuell = kopfzelle || (erste && b.kopfspalte) ? S.PAPIER2 : (hl.has(key) ? "F3E1C3" : "FFFFFF");
        return {
          text: runs(wert, { akzent: textfarbe(S, ctx.akzentText, fuell), opt: { bold: kopfzelle || (erste && b.kopfspalte), fontFace: b.mono ? S.SCHRIFT_MONO : undefined } }, S),
          options: { fill: { color: fuell }, align: (b.zentriert || b.mono) ? "center" : "left", valign: "middle" },
        };
      };
      const rows = [];
      if (kopf) rows.push(kopf.map((k, i) => zelle(k, true, i === 0, "")));
      zeilen.forEach((z, ri) => rows.push(Array.from({ length: ns }, (_, i) => zelle(z[i] ?? "", false, i === 0, ri + "," + i))));
      let h = 0;
      for (const r of rows) {
        let m = gr * 1.5 / 72;
        r.forEach((c, i) => { m = Math.max(m, textHoehe(c.text.map((x) => x.text).join(""), colW[i] - 0.12, gr) + 0.1); });
        h += m;
      }
      if (!dry) slide.addTable(rows, { x: x + (b.zentriert_tabelle ? (w - tw) / 2 : 0), y, w: tw, colW, fontSize: gr, color: S.TEXT, fontFace: S.SCHRIFT_TEXT, border: { type: "solid", pt: 0.75, color: S.LINIE }, margin: [0.04, 0.07, 0.04, 0.07], autoPage: false });
      return h;
    }
    if (t === "alphabet") {
      const start = b.nummerierung === undefined ? 1 : b.nummerierung;
      const rows = [];
      const buch = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
      rows.push(buch);
      if (start !== null) rows.push(buch.map((_, i) => String(i + start)));
      for (const z of b.zeilen || []) rows.push(Array.from({ length: 26 }, (_, i) => (z.leer ? "" : (z.werte || "")[i] || "")));
      const cw = w / 26;
      const gr = Math.min(pt - 2, cw * 72 * 0.55);
      const data = rows.map((r, ri) => r.map((v) => ({ text: v, options: { fontFace: ri === 1 && start !== null ? S.SCHRIFT_TEXT : S.SCHRIFT_MONO, bold: !(ri === 1 && start !== null), fontSize: ri === 1 && start !== null ? gr * 0.75 : gr, color: ri === 1 && start !== null ? S.TEXT2 : S.TEXT, fill: { color: ri === 0 ? S.PAPIER2 : "FFFFFF" }, align: "center", valign: "middle" } })));
      const h = rows.length * (gr * 1.7 / 72);
      if (!dry) slide.addTable(data, { x, y, w, colW: Array(26).fill(cw), border: { type: "solid", pt: 0.5, color: S.LINIE }, margin: 0.01 });
      return h;
    }
    if (t === "quadrat") {
      let zeilen, kopf, seiten;
      if (b.art === "vigenere") {
        zeilen = Array.from({ length: 26 }, (_, r) => Array.from({ length: 26 }, (_, s) => String.fromCharCode(65 + ((r + s) % 26))));
        kopf = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)); seiten = kopf;
      } else { zeilen = b.zeilen.map((z) => (typeof z === "string" ? z.split("") : z)); kopf = b.kopfzeile; seiten = b.kopfspalte; }
      const nz = zeilen.length + (kopf ? 1 : 0), ns = zeilen[0].length + (seiten ? 1 : 0);
      const maxH = b.max_hoehe || (b.art === "vigenere" ? 5.0 : Math.min(4.6, nz * 0.62));
      const zelle = Math.min(w / ns, maxH / nz, 0.7);
      const gr = Math.max(7, Math.min(28, zelle * 72 * 0.5));
      const hl = new Set((b.hervor || []).map((p) => p.join(",")));
      const data = [];
      if (kopf) data.push([...(seiten ? [{ text: b.ecke || "", options: { fill: { color: S.PAPIER2 } } }] : []), ...kopf.map((k) => ({ text: k, options: { bold: true, fill: { color: S.PAPIER2 } } }))]);
      zeilen.forEach((z, ri) => data.push([...(seiten ? [{ text: seiten[ri], options: { bold: true, fill: { color: S.PAPIER2 } } }] : []), ...z.map((v, si) => ({ text: String(v), options: { bold: b.art !== "vigenere", fill: { color: hl.has(ri + "," + si) ? "F3E1C3" : "FFFFFF" } } }))]));
      const tw = zelle * ns;
      if (!dry) slide.addTable(data, { x: x + (w - tw) / 2, y, w: tw, colW: Array(ns).fill(zelle), rowH: Array(nz).fill(zelle), fontFace: S.SCHRIFT_MONO, fontSize: gr, color: S.TEXT, align: "center", valign: "middle", border: { type: "solid", pt: 0.5, color: b.art === "vigenere" ? S.LINIE : S.TEXT2 }, margin: 0 });
      return zelle * nz;
    }
    if (t === "bits") {
      const rows = b.zeilen.map((z) => [
        { text: reinText(z.label || ""), options: { bold: true, color: S.TEXT2, align: "right", fontFace: S.SCHRIFT_TEXT } },
        { text: z.leer && !this.ctx.loesung ? z.bits.split(" ").map((g) => "_".repeat(g.length)).join(" ") : z.bits, options: { bold: true, fontFace: S.SCHRIFT_MONO, charSpacing: 3, border: z.strich ? [{ type: "solid", pt: 1.5, color: S.TEXT }, { type: "none" }, { type: "none" }, { type: "none" }] : undefined } },
      ]);
      const gr = Math.max(pt, 22);
      const h = rows.length * gr * 1.6 / 72;
      if (!dry) slide.addTable(rows, { x, y, w: Math.min(w, 9), colW: [1.8, Math.min(w, 9) - 1.8], fontSize: gr, color: S.TEXT, border: { type: "none" }, margin: [0.02, 0.1, 0.02, 0.1] });
      return h;
    }
    if (t === "code") {
      const zeilen = b.text.split("\n");
      const gr = Math.min(pt - 2, 16);
      const h = zeilen.length * gr * 1.25 / 72 + 0.25;
      if (!dry) {
        slide.addShape(this.pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: "F6F4EF" }, line: { color: S.LINIE, width: 0.75 } });
        slide.addText(b.text, { x: x + 0.15, y: y + 0.1, w: w - 0.3, h: h - 0.2, fontFace: S.SCHRIFT_MONO, fontSize: gr, color: S.TEXT, margin: 0, valign: "top", isTextBox: true, fit: "none" });
      }
      return h;
    }
    if (t === "haeufigkeit") {
      const buch = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
      let werte = b.werte || {};
      if (b.text) { werte = {}; buch.forEach((c) => (werte[c] = 0)); for (const c of b.text.toUpperCase()) if (werte[c] !== undefined) werte[c]++; }
      const ges = Object.values(werte).reduce((a, c) => a + c, 0) || 1;
      let labels = buch;
      if (b.sortiert) labels = [...buch].sort((a, c) => (werte[c] || 0) - (werte[a] || 0));
      const daten = [{ name: b.text ? "Geheimtext (%)" : (b.reihe || "Anteil (%)"), labels, values: labels.map((c) => Math.round((1000 * (werte[c] || 0)) / ges) / 10) }];
      if (b.referenz) {
        const dt = this.ctx.deutsch;
        const ref = b.sortiert ? Object.values(dt).sort((a, c) => c - a) : labels.map((c) => dt[c]);
        daten.push({ name: b.sortiert ? "Deutsch nach Rang (%)" : "Deutsch (%)", labels, values: ref });
      }
      const h = b.hoehe || 2.7;
      if (!dry) slide.addChart(this.pres.charts.BAR, daten, {
        x, y, w, h, barDir: "col", barGapWidthPct: 40, chartColors: b.referenz ? [ctx.akzent, S.MESSING] : [ctx.akzent], showLegend: !!b.referenz, legendPos: "t", legendFontSize: 12,
        catAxisLabelFontFace: S.SCHRIFT_MONO, catAxisLabelFontSize: 12, catAxisLabelColor: S.TEXT, valAxisLabelFontSize: 11, valAxisLabelColor: S.TEXT2,
        valGridLine: { color: S.LINIE, size: 0.5 }, catGridLine: { style: "none" }, showTitle: !!b.titel, title: b.titel || "", titleFontSize: 14, titleColor: S.TEXT,
        valAxisLabelFormatCode: "0", objectName: "Häufigkeitsdiagramm",
      });
      return h;
    }
    if (t === "struktogramm" || t === "schaubild" || t === "bild") {
      const verh = b._verh || 0.6;
      let bw = Math.min(b.breite_folie || w, w);
      let bh = bw * verh;
      const maxH = b._maxH || 4.9;
      if (bh > maxH) { bh = maxH; bw = bh / verh; }
      if (!dry) slide.addImage({ path: b._png, x: x + (w - bw) / 2, y, w: bw, h: bh, altText: b.alt || reinText(b.titel || t) });
      // Bildunterschrift (Plan M10 Task 240: Namensnennung der Objektbilder aus dem Kryptolabor)
      if (t === "bild" && b.unterschrift) {
        if (!dry) slide.addText(reinText(b.unterschrift), { x, y: y + bh + 0.04, w, h: 0.3, fontSize: 12, italic: true, color: S.TEXT2, align: "center", margin: 0, isTextBox: true });
        return bh + 0.36;
      }
      return bh;
    }
    if (t === "hinweis" || t === "merke_klein") {
      const inner = b.md ? [{ t: "p", md: b.md }] : b.inhalt;
      const FARBEN = { akzent: [ctx.akzent, S.PAPIER2], messing: [S.MESSING_DUNKEL, "FBF3E2"], hinweis: [S.HINWEIS, "EEF3FA"], ok: [S.OK, "EEF6EE"], fehler: [S.FEHLER, "FDF3F2"] };
      const [linie, fuell] = FARBEN[b.farbe || "hinweis"] || FARBEN.hinweis;
      const innen = this.mit(fuell);
      const hi = innen.bloecke(slide, inner, x + 0.25, y + 0.5, w - 0.5, pt - 2, true);
      const h = hi + 0.65;
      if (!dry) {
        slide.addShape(this.pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.08, fill: { color: fuell }, line: { color: linie, width: 1 } });
        slide.addText(b.kopf || "HINWEIS", { x: x + 0.25, y: y + 0.12, w: w - 0.5, h: 0.3, fontSize: 13, bold: true, color: textfarbe(S, linie, fuell, 13, true), charSpacing: 2, margin: 0, isTextBox: true });
        innen.bloecke(slide, inner, x + 0.25, y + 0.5, w - 0.5, pt - 2, false);
      }
      return h;
    }
    if (t === "zweispaltig") {
      const a = b.anteil || 0.5, gap = 0.4;
      const w1 = (w - gap) * a, w2 = (w - gap) * (1 - a);
      const h1 = this.bloecke(slide, b.links, x, y, w1, pt, dry, farbe);
      const h2 = this.bloecke(slide, b.rechts, x + w1 + gap, y, w2, pt, dry, farbe);
      return Math.max(h1, h2);
    }
    if (t === "platzhalter") {
      const h = b.hoehe || 3.2;
      if (!dry) {
        slide.addShape(this.pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: "FFFFFF" }, line: { color: S.TEXT2, width: 1.25, dashType: "dash" }, objectName: "Bildplatzhalter" });
        slide.addText([{ text: "BILD EINFÜGEN\n", options: { bold: true, color: S.TEXT2, fontSize: 14, charSpacing: 2 } }, { text: reinText(b.beschreibung || ""), options: { color: S.TEXT2, fontSize: 14 } }],
          { x: x + 0.3, y: y + 0.3, w: w - 0.6, h: h - 0.6, align: "center", valign: "middle", margin: 0, isTextBox: true, fit: "none" });
      }
      return h;
    }
    if (t === "abstand") return (b.pt || 6) / 72;
    if (t === "schreiblinien" || t === "seitenumbruch") return 0;
    throw new Error("Unbekannter Blocktyp auf Folie: " + t);
  }
}

// ------------------------------------------------------------------------------------------------
// Deck
// ------------------------------------------------------------------------------------------------
async function baue(q, aus) {
  const S = q._stil;
  const ep = S.EPOCHEN[String(q.welt)] || S.EPOCHEN["9"];
  const ctx = { akzent: ep.akzent, hell: ep.hell, deutsch: q._deutsch, loesung: false };
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";
  pres.author = "Frank Juchim";
  pres.company = "Kryptos";
  pres.title = q.titel;
  pres.subject = "Kryptos – Die Zeitreise der Geheimschriften";
  pres.theme = { headFontFace: S.SCHRIFT_KOPF, bodyFontFace: S.SCHRIFT_TEXT };
  const fussText = q.welt >= 0 && q.welt <= 6 ? `Kryptos · Welt ${q.welt} · ${ep.name}` : "Kryptos – Die Zeitreise der Geheimschriften";
  const A = q._assets;
  const fuss = (farbe) => [
    { text: { text: fussText, options: { x: RAND, y: 7.02, w: 8, h: 0.3, fontSize: 10, color: farbe, fontFace: S.SCHRIFT_TEXT, margin: 0 } } },
  ];
  pres.defineSlideMaster({
    title: "KR Titel", background: { color: S.TINTE },
    objects: [{ placeholder: { options: { name: "titel", type: "title", x: RAND, y: 2.55, w: 8.2, h: 1.7, fontFace: S.SCHRIFT_KOPF, fontSize: 46, bold: true, color: S.PAPIER, valign: "top", align: "left", margin: 0 }, text: "" } },
      { placeholder: { options: { name: "untertitel", type: "body", x: RAND, y: 4.3, w: 8.0, h: 1.0, fontFace: S.SCHRIFT_TEXT, fontSize: 22, color: S.MESSING_HELL, valign: "top", align: "left", margin: 0 }, text: "" } }],
  });
  pres.defineSlideMaster({
    title: "KR Abschnitt", background: { color: S.TINTE },
    objects: [{ placeholder: { options: { name: "titel", type: "title", x: RAND + 1.2, y: 2.9, w: 10.5, h: 1.2, fontFace: S.SCHRIFT_KOPF, fontSize: 40, bold: true, color: S.PAPIER, valign: "middle", align: "left", margin: 0 }, text: "" } },
      { image: { path: A.siegel, x: RAND, y: 3.05, w: 0.95, h: 0.95 } }, ...fuss(S.MESSING_HELL)],
    slideNumber: { x: 12.2, y: 7.02, w: 0.55, h: 0.3, fontSize: 10, color: S.MESSING_HELL, align: "right" },
  });
  pres.defineSlideMaster({
    title: "KR Inhalt", background: { color: S.PAPIER },
    objects: [{ image: { path: A.siegel, x: RAND, y: 0.42, w: 0.62, h: 0.62 } },
      { placeholder: { options: { name: "titel", type: "title", x: RAND + 0.85, y: 0.38, w: W - 2 * RAND - 0.85, h: 0.72, fontFace: S.SCHRIFT_KOPF, fontSize: 30, bold: true, color: S.TINTE, valign: "middle", align: "left", margin: 0 }, text: "" } },
      ...fuss(S.TEXT2)],
    slideNumber: { x: 12.2, y: 7.02, w: 0.55, h: 0.3, fontSize: 10, color: S.TEXT2, align: "right" },
  });
  pres.defineSlideMaster({
    title: "KR Dunkel", background: { color: S.NACHT },
    objects: [{ image: { path: A.siegel, x: RAND, y: 0.42, w: 0.62, h: 0.62 } },
      { placeholder: { options: { name: "titel", type: "title", x: RAND + 0.85, y: 0.38, w: W - 2 * RAND - 0.85, h: 0.72, fontFace: S.SCHRIFT_KOPF, fontSize: 30, bold: true, color: S.PAPIER, valign: "middle", align: "left", margin: 0 }, text: "" } },
      ...fuss(S.MESSING_HELL)],
    slideNumber: { x: 12.2, y: 7.02, w: 0.55, h: 0.3, fontSize: 10, color: S.MESSING_HELL, align: "right" },
  });

  const setzer = new Setzer(pres, S, ctx);
  const probleme = [];
  let abschnitt = null;

  // hg: Hintergrund der Inhalte (Folie oder Kasten) – bestimmt die Akzent-Textfarbe
  function inhaltSetzen(slide, f, bloecke, x, y, w, unten, nr, farbe, hg = S.PAPIER) {
    const s = setzer.mit(hg);
    let pt = f.schrift || 22;
    let h = s.bloecke(slide, bloecke, x, y, w, pt, true, farbe);
    while (h > unten - y && pt > 16) { pt -= 2; h = s.bloecke(slide, bloecke, x, y, w, pt, true, farbe); }
    if (h > unten - y + 0.05) probleme.push(`Folie ${nr} „${f.titel || f.layout}“: Inhalt zu hoch (${h.toFixed(2)} > ${(unten - y).toFixed(2)} Zoll) – kürzen oder teilen`);
    s.bloecke(slide, bloecke, x, y, w, pt, false, farbe);
  }

  (q.folien || []).forEach((f, i) => {
    const nr = i + 1;
    if (f.abschnitt && f.abschnitt !== abschnitt) { abschnitt = f.abschnitt; pres.addSection({ title: abschnitt }); }
    const sec = abschnitt ? { sectionTitle: abschnitt } : {};
    const lay = f.layout || "inhalt";
    let slide;
    const breite = f.video ? 8.0 : W - 2 * RAND;
    if (lay === "titel") {
      slide = pres.addSlide({ masterName: "KR Titel", ...sec });
      slide.addImage({ path: A.scheibe, x: 7.9, y: -1.1, w: 7.4, h: 7.4, transparency: 55, objectName: "Chiffrierscheibe" });
      slide.addImage({ path: A.siegel, x: RAND, y: 0.75, w: 1.1, h: 1.1 });
      slide.addText(f.oberzeile || `WELT ${q.welt} · ${ep.jahr.toUpperCase()} · ${ep.ort.toUpperCase()}`, { x: RAND, y: 2.0, w: 8.5, h: 0.4, fontFace: S.SCHRIFT_MONO, fontSize: 16, bold: true, color: ep.hell, charSpacing: 3, margin: 0, isTextBox: true });
      slide.addText(f.titel, { placeholder: "titel" });
      if (f.untertitel) slide.addText(f.untertitel, { placeholder: "untertitel" });
      slide.addText("KRYPTOS · DIE ZEITREISE DER GEHEIMSCHRIFTEN", { x: RAND, y: 6.75, w: 8, h: 0.35, fontSize: 12, color: S.MESSING_HELL, charSpacing: 4, margin: 0, isTextBox: true });
    } else if (lay === "abschnitt") {
      slide = pres.addSlide({ masterName: "KR Abschnitt", ...sec });
      slide.addText(f.titel, { placeholder: "titel" });
      if (f.untertitel) slide.addText(f.untertitel, { x: RAND + 1.2, y: 4.1, w: 10.5, h: 0.6, fontSize: 20, color: S.MESSING_HELL, margin: 0, isTextBox: true });
    } else if (lay === "archivfund" || lay === "funkraum" || lay === "dunkel") {
      slide = pres.addSlide({ masterName: "KR Dunkel", ...sec });
      slide.addText(f.titel || "Archivfund", { placeholder: "titel" });
      let y = INHALT_Y + 0.1;
      if (f.geheimtext) {
        const gr = f.groesse || 30;
        const roh = f.geheimtext.replace(/\s+/g, "");
        const g = []; for (let k = 0; k < roh.length; k += 5) g.push(roh.slice(k, k + 5));
        const pro = Math.max(1, Math.floor((9.0 * 72) / ((gr * 0.55 + 3) * 6)));
        const zeilen = []; for (let k = 0; k < g.length; k += pro) zeilen.push(g.slice(k, k + pro).join(" "));
        const dh = zeilen.length * gr * 1.5 / 72 + (f.label ? 0.9 : 0.6);
        slide.addShape(pres.shapes.RECTANGLE, { x: 1.7, y, w: 9.9, h: dh, rotate: -1.2, fill: { color: S.PAPIER }, line: { color: S.MESSING, width: 1.5 }, shadow: { type: "outer", color: "000000", opacity: 0.45, blur: 12, offset: 6, angle: 90 }, objectName: "Dokument" });
        if (f.label) slide.addText(f.label, { x: 2.05, y: y + 0.18, w: 9.2, h: 0.35, fontSize: 13, bold: true, color: ctx.akzent, charSpacing: 2, margin: 0, rotate: -1.2, isTextBox: true });
        slide.addText(zeilen.join("\n"), { x: 2.05, y: y + (f.label ? 0.6 : 0.3), w: 9.2, h: dh - (f.label ? 0.8 : 0.5), fontFace: S.SCHRIFT_MONO, fontSize: gr, bold: true, color: S.TEXT, charSpacing: 3, margin: 0, rotate: -1.2, valign: "top", isTextBox: true, lineSpacingMultiple: 1.1 });
        y += dh + 0.45;
      }
      if (f.qr) { slide.addImage({ path: f._qr, x: W - RAND - 1.9, y: 4.6, w: 1.9, h: 1.9 }); }
      if (f.inhalt) inhaltSetzen(slide, f, f.inhalt, RAND + 0.2, y, f.qr ? W - 2 * RAND - 2.6 : W - 2 * RAND - 0.4, INHALT_UNTEN, nr, S.PAPIER, S.NACHT);
    } else if (lay === "merke") {
      slide = pres.addSlide({ masterName: "KR Inhalt", ...sec });
      slide.addText(f.titel || "Merke", { placeholder: "titel" });
      // Video-Folien: Kasten nur in der linken Inhaltsbreite (Kamera-Zone unten rechts frei, LIESMICH; Plan M9 Task 214)
      const x = RAND + 0.6, y = INHALT_Y + 0.2, w = (f.video ? breite : W - 2 * RAND) - 1.2;
      const hi = setzer.bloecke(slide, f.inhalt, x + 0.45, y + 0.8, w - 0.9, f.schrift || 24, true);
      const h = Math.min(INHALT_UNTEN - y, hi + 1.15);
      slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.1, fill: { color: "FBF3E2" }, line: { color: S.MESSING, width: 1.5 }, objectName: "Merke-Kasten" });
      slide.addText("MERKE", { x: x + 0.45, y: y + 0.25, w: 4, h: 0.45, fontFace: S.SCHRIFT_KOPF, fontSize: 20, bold: true, color: S.MESSING_DUNKEL, charSpacing: 4, margin: 0, isTextBox: true });
      inhaltSetzen(slide, f, f.inhalt, x + 0.45, y + 0.8, w - 0.9, y + h - 0.2, nr, undefined, "FBF3E2");
    } else if (lay === "falle") {
      slide = pres.addSlide({ masterName: "KR Inhalt", ...sec });
      slide.addText(`Falle ${f.nr} · ${f.titel}`, { placeholder: "titel" });
      let y = INHALT_Y;
      const fb = f.video ? breite : W - 2 * RAND; // Video-Folien: Kamera-Zone frei (Plan M9 Task 214)
      const rg = f.video ? 20 : 22; // schmalere Video-Spalten: Regel etwas kleiner, damit beide Spalten Platz haben
      if (f.regel) { const hr = textHoehe(f.regel, fb, rg) + 0.1; slide.addText(runs(f.regel, { akzent: ctx.akzent, opt: {} }, S), { x: RAND, y, w: fb, h: hr, fontSize: rg, color: S.TEXT, margin: 0, isTextBox: true, valign: "top" }); y += hr + 0.2; }
      const sw = (fb - 0.4) / 2;
      const spalten = [["SO NICHT  ✗", f.falsch, "FDF3F2", S.FEHLER], ["SO RICHTIG  ✓", f.richtig, "EEF6EE", S.OK]];
      spalten.forEach(([kopf, inhalt, fuell, farbe], k) => {
        const x = RAND + k * (sw + 0.4);
        const bl = typeof inhalt === "string" ? [{ t: "p", md: inhalt }] : inhalt || [];
        const hb = Math.min(INHALT_UNTEN - y, Math.max(1.6, setzer.bloecke(slide, bl, x + 0.3, y + 0.75, sw - 0.6, f.schrift || 22, true) + 1.0));
        slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: sw, h: hb, rectRadius: 0.08, fill: { color: fuell }, line: { color: farbe, width: 1.25 } });
        slide.addText(kopf, { x: x + 0.3, y: y + 0.2, w: sw - 0.6, h: 0.4, fontSize: 18, bold: true, color: textfarbe(S, farbe, fuell, 18, true), charSpacing: 2, margin: 0, isTextBox: true });
        inhaltSetzen(slide, f, bl, x + 0.3, y + 0.75, sw - 0.6, y + hb - 0.15, nr, undefined, fuell);
      });
    } else if (lay === "auftrag") {
      slide = pres.addSlide({ masterName: "KR Inhalt", ...sec });
      slide.addText(f.titel || "Auftrag", { placeholder: "titel" });
      const chips = [f.sozialform, f.zeit].filter(Boolean);
      let x = RAND;
      slide.addText("AUFTRAG", { x, y: INHALT_Y, w: 1.6, h: 0.42, fontSize: 14, bold: true, color: "FFFFFF", fill: { color: ctx.akzent }, align: "center", valign: "middle", charSpacing: 3, margin: 0, isTextBox: true });
      x += 1.75;
      for (const c of chips) { const cw = 0.35 + c.length * 0.12; slide.addText(c, { x, y: INHALT_Y, w: cw, h: 0.42, fontSize: 14, color: S.TEXT, fill: { color: S.PAPIER2 }, align: "center", valign: "middle", margin: 0, isTextBox: true }); x += cw + 0.15; }
      inhaltSetzen(slide, f, f.inhalt, RAND, INHALT_Y + 0.7, breite, INHALT_UNTEN, nr);
    } else {
      slide = pres.addSlide({ masterName: "KR Inhalt", ...sec });
      slide.addText(f.titel || "", { placeholder: "titel" });
      if (lay === "zweispaltig") {
        inhaltSetzen(slide, f, [{ t: "zweispaltig", links: f.links, rechts: f.rechts, anteil: f.anteil }], RAND, INHALT_Y, breite, INHALT_UNTEN, nr);
      } else {
        inhaltSetzen(slide, f, f.inhalt, RAND, INHALT_Y, breite, f.video ? 6.75 : INHALT_UNTEN, nr);
      }
    }
    if (f.niveau && f.niveau !== "kern") {
      const [txt, farbe] = S.NIVEAU[f.niveau] || [String(f.niveau).toUpperCase(), S.TINTE];
      slide.addText(txt, { x: W - RAND - 1.6, y: 0.5, w: 1.6, h: 0.36, fontSize: 12, bold: true, color: "FFFFFF", fill: { color: farbe }, align: "center", valign: "middle", charSpacing: 2, margin: 0, isTextBox: true, objectName: "Niveau" });
    }
    if (f.notizen) slide.addNotes(f.notizen);
  });

  await pres.writeFile({ fileName: aus });
  // Theme-Farben eintragen
  const T = { name: `Kryptos ${ep.kurz}`, dk1: S.TEXT, lt1: "FFFFFF", dk2: S.TINTE, lt2: S.PAPIER, accent1: ep.akzent, accent2: S.MESSING, accent3: S.HINWEIS, accent4: S.OK, accent5: S.FEHLER, accent6: S.TEXT2, hlink: S.HINWEIS, folHlink: S.MESSING_DUNKEL };
  const JSZip = loadJSZip();
  const zip = await JSZip.loadAsync(fs.readFileSync(aus));
  const teil = "ppt/theme/theme1.xml";
  const slots = ["dk1", "lt1", "dk2", "lt2", "accent1", "accent2", "accent3", "accent4", "accent5", "accent6", "hlink", "folHlink"];
  const scheme = `<a:clrScheme name="${T.name}">` + slots.map((k) => `<a:${k}><a:srgbClr val="${T[k]}"/></a:${k}>`).join("") + "</a:clrScheme>";
  let xml = await zip.file(teil).async("string");
  xml = xml.replace(/<a:clrScheme\b[\s\S]*?<\/a:clrScheme>/, () => scheme).replace(/(<a:(?:theme|fontScheme)\b[^>]*?\bname=")[^"]*"/g, (_, k) => `${k}${T.name}"`);
  zip.file(teil, xml);
  // pptxgenjs-Fehler beheben: zweite <a:pPr> mitten im Absatz (nach einem Lauf) entfernen
  for (const name of Object.keys(zip.files)) {
    if (!/^ppt\/slides\/slide\d+\.xml$/.test(name)) continue;
    const alt = await zip.file(name).async("string");
    const neu = alt.replace(/(<\/a:r>)<a:pPr\b[^>]*?(?:\/>|>[\s\S]*?<\/a:pPr>)/g, "$1");
    if (neu !== alt) zip.file(name, neu);
  }
  fs.writeFileSync(aus, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
  return probleme;
}

if (require.main === module) {
  const [quelle, aus] = process.argv.slice(2);
  const q = JSON.parse(fs.readFileSync(quelle, "utf8"));
  baue(q, aus).then((p) => {
    if (p.length) { console.error("WARNUNGEN:\n" + p.join("\n")); process.exitCode = 3; }
    console.log(aus);
  }, (e) => { console.error("FEHLER: " + e.stack); process.exit(1); });
}
module.exports = { baue };
