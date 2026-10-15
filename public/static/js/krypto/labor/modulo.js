/* Kryptos – Labor-Werkzeug „Modulo-Uhr & Farbmischer“ (W4 §9.1, Plan M6 Task 121, E80). Die Uhr ist das Objekt: Der
   Zeiger springt sichtbar über den Überlauf (Addieren, Multiplizieren), Potenzen laufen als Pfad über das Ziffernblatt;
   Wertetabelle gˣ mod m mit Primitivwurzel-Kopf, Inverses per Tabelle. Farbmischer: Diffie-Hellman als Farbenmischen
   in vier Schritten (Nachspiel), Eve darf mischen, aber nicht entmischen; „Mit Zahlen“ dieselben Schritte mit p, g, a, b.
   Kein diskreter Logarithmus im Werkzeug (W4 §9.1 Grenze).
   Rechnet nur über Krypto.*; Grundrechenarten nur für die Anzeige („7 · 9 = 63“). Die Farbmischung (OKLab-Mittel nach
   der öffentlichen Beschreibung von Björn Ottosson, eigene Umsetzung) ist Darstellung der Analogie, keine fachliche
   Rechnung (E80). Speichert nichts. */
'use strict';
(() => {
  const { h, s } = AQ;
  const B = KRLaborBau;
  // Standardwerte: 23 + 7 aus der Werkzeugbeschreibung (W4 §9.1); DH-Zahlen eigens gewählt (in keinem Material)
  const BEISPIEL = { m: 26, a: 23, b: 7, tabelleM: 11, tabelleG: 2, invA: 7, p: 37, g: 2, alice: 5, bob: 9 };
  const REITER_TITEL = { uhr: 'Modulo-Uhr', tabelle: 'Wertetabelle', inverses: 'Inverses finden', farbmischer: 'Farbmischer' };
  const OPS = [
    { id: 'plus', titel: 'Addieren' },
    { id: 'mal', titel: 'Multiplizieren' },
    { id: 'hoch', titel: 'Potenzieren' }
  ];
  const FARBEN = ['gelb', 'rot', 'blau'];
  const FARB_TITEL = { gelb: 'Gelb', rot: 'Rot', blau: 'Blau' };
  const FARB_ROLLE = { gelb: 'öffentlich', rot: 'geheim: Alice', blau: 'geheim: Bob' };
  const MITTE = 150;
  const UHR_MAX = 30;
  const HOCH = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  const hochgestellt = (n) => [...String(n)].map((c) => HOCH[c]).join('');

  /** Ganze Zahl ≥ 0 aus einer Eingabe oder null. */
  const zahlVon = (t) => (/^\s*\d{1,7}\s*$/.test(String(t ?? '')) ? Number(String(t).trim()) : null);
  const punkt = (r, grad) => {
    const b = (grad * Math.PI) / 180;
    return [MITTE + r * Math.sin(b), MITTE - r * Math.cos(b)];
  };

  /* ---------- Farbmischung (Darstellung, E80) ---------- */
  /** sRGB-Kanal 0 … 255 → linear */
  const linear = (c) => {
    const x = c / 255;
    const srgbLinear = x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    return srgbLinear;
  };
  /** linear → sRGB-Kanal 0 … 255 */
  const gamma = (x) => {
    const y = Math.max(0, Math.min(1, x));
    const srgbKanal = y <= 0.0031308 ? 12.92 * y : 1.055 * Math.pow(y, 1 / 2.4) - 0.055;
    return Math.round(srgbKanal * 255);
  };
  function zuOklab([r8, g8, b8]) {
    const [r, g, b] = [r8, g8, b8].map(linear);
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const q = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * q, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * q, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * q];
  }
  function ausOklab([L, A, Bb]) {
    const l = L + 0.3963377774 * A + 0.2158037573 * Bb;
    const m = L - 0.1055613458 * A - 0.0638541728 * Bb;
    const q = L - 0.0894841775 * A - 1.291485548 * Bb;
    const [l3, m3, q3] = [l * l * l, m * m * m, q * q * q];
    return [4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * q3, -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * q3, -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * q3].map(gamma);
  }
  /** Deckkraft einer Farbe in der Mischung: Menge³ – eine doppelte Menge deckt achtmal so stark. So hebt sich Eves
      Mischung (Gelb doppelt) sichtbar von der gemeinsamen Farbe ab (ΔE_OK ≈ 0,09 statt 0,03 bei linearem Mittel);
      Mischungen 1 : 1 (: 1) bleiben unverändert. Darstellung der Analogie, keine fachliche Rechnung (E80). */
  const deckkraft = (n) => n * n * n;
  /** Gewichtetes Mittel der Topffarben in OKLab (Gewicht = Deckkraft) → 'rgb(r g b)' oder null (Farben nicht lesbar). */
  function farbeMischen(mengen, basis) {
    if (!basis) return null;
    const summe = FARBEN.reduce((n, f) => n + deckkraft(mengen[f] || 0), 0);
    if (!summe) return null;
    const mittel = [0, 0, 0];
    for (const f of FARBEN) {
      const w = deckkraft(mengen[f] || 0) / summe;
      if (!w) continue;
      zuOklab(basis[f]).forEach((x, i) => (mittel[i] += w * x));
    }
    const [r, g, b] = ausOklab(mittel);
    return `rgb(${r} ${g} ${b})`;
  }
  const leer = () => ({ gelb: 0, rot: 0, blau: 0 });
  const menge = (o) => ({ ...leer(), ...o });
  function farbName(mg) {
    const teile = FARBEN.filter((f) => mg[f]).map((f) => `${mg[f]} × ${FARB_TITEL[f]}`).join(' + ');
    const name = mg.gelb && mg.rot && mg.blau ? (mg.gelb > 1 ? 'Ocker (Gelb doppelt)' : 'Braun') : mg.gelb && mg.rot ? 'Orange' : mg.gelb && mg.blau ? 'Grün' : mg.gelb ? 'Gelb' : mg.rot ? 'Rot' : mg.blau ? 'Blau' : '–';
    return `${name} (${teile || 'leer'})`;
  }

  /** Radiogruppe (role=radio, ←/→). */
  function radiogruppe(liste, wert, attr, aria, klasse, beiWechsel) {
    let jetzt = wert;
    const knoepfe = liste.map((x) => h('button', { type: 'button', role: 'radio', [`data-${attr}`]: x.id }, x.titel));
    const zeige = () => {
      for (const kn of knoepfe) {
        const an = kn.getAttribute(`data-${attr}`) === jetzt;
        kn.setAttribute('aria-checked', String(an));
        kn.setAttribute('tabindex', an ? '0' : '-1');
      }
    };
    const setze = (id, fokus) => {
      jetzt = id;
      zeige();
      if (fokus) knoepfe.find((k) => k.getAttribute(`data-${attr}`) === id).focus();
      beiWechsel(id);
    };
    knoepfe.forEach((kn, i) => {
      kn.addEventListener('click', () => setze(kn.getAttribute(`data-${attr}`), false));
      kn.addEventListener('keydown', (e) => {
        const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (!d) return;
        e.preventDefault();
        setze(liste[Krypto.mod(i + d, liste.length)].id, true);
      });
    });
    zeige();
    return { element: h('div', { class: `labor-basis ${klasse}`, role: 'radiogroup', 'aria-label': aria }, knoepfe), knoepfe, sperre: (an) => knoepfe.forEach((k) => (k.disabled = !!an)) };
  }
  /** Zahlfeld (input, numerisch) mit Beschriftung. */
  function zahlFeld(klasse, titel, wert, beiEingabe) {
    const id = B.neueId(klasse);
    const f = h('input', { type: 'text', inputmode: 'numeric', id, class: `zahl-eingabe ${klasse}`, autocomplete: 'off', spellcheck: 'false' });
    f.value = wert === null || wert === undefined ? '' : String(wert);
    f.addEventListener('input', () => beiEingabe(f.value));
    const label = h('label', { for: id }, titel);
    return { element: h('div', { class: 'labor-textfeld modulo-feld' }, label, f), feld: f, label };
  }

  function oeffne(container, voreinstellung, umgebung) {
    const v = voreinstellung || {};
    const reiterListe = KRLabor.reiterFuer('modulo', v, umgebung);
    const ruhig = AQ.ruhig();
    const vZahl = (x) => (Number.isInteger(x) && x >= 0 && x <= 1000 ? x : null);
    // sichtbarer Zustand
    const z = { m: null, zeiger: null, zeile: '', potenzen: [], primitiv: null, inverses: null, alice: leer(), bob: leer(), eve: null, A: null, B: null, K: null };
    let nachspiel = null;

    const r = B.reiter(reiterListe.map((id) => ({ id, titel: REITER_TITEL[id] })), { aktiv: reiterListe[0], beiWechsel: baue });
    const wurzel = h('div', { class: 'labor-werkzeug modulo-werkzeug' }, r.element);
    container.appendChild(wurzel);
    // M11 (E208, E210, E214): Erkenner-Verlauf, Start im geführten Modus (Panel), laufender geführter Modus
    const erkVerlauf = typeof KRErkenner !== 'undefined' ? KRErkenner.verlauf() : null;
    let fuehrung = umgebung && umgebung.gefuehrt && typeof umgebung.gefuehrt === 'object' ? umgebung.gefuehrt : null;
    let sofort = !!fuehrung; // Panel (gefuehrt: true): der erste rechnende Aufbau startet geführt
    let gefuehrt = null;
    const mitGefuehrt = typeof KRGefuehrt !== 'undefined';
    function schliesseTeile() {
      if (nachspiel) nachspiel.schliesse();
      nachspiel = null;
      if (gefuehrt) gefuehrt.schliesse();
      gefuehrt = null;
    }
    /** Aufgabenwerte erkannt? → geführter Modus; true = nichts ausgeben */
    function erkenne(id, zahlen, werte) {
      if (sofort && mitGefuehrt && HOOKS[id]) {
        sofort = false;
        starteGefuehrt(id, werte);
        return true;
      }
      return B.erkenne(r.flaeche, `modulo.${id}`, { zahlen }, umgebung, erkVerlauf, { gefuehrt: mitGefuehrt && HOOKS[id] ? () => starteGefuehrt(id, werte) : null }) !== 'frei';
    }

    /* ---------- Geführter Modus (M11 Task 245, E208): Produktketten und Schrittzeilen aus den Einträgen ---------- */
    const zahlFeldG = (beschriftung) => ({ beschriftung, art: 'zahl' });
    const oder = (x) => (x === '' || x === undefined || x === null ? '…' : String(x).trim());
    /** werte = { m, a, b, op } */
    function uhrHook(container, werte) {
      const { m, a, b } = werte;
      if (werte.op === 'plus' || werte.op === 'mal') {
        const zeichen = werte.op === 'plus' ? '+' : '·';
        const tab = KRGefuehrt.raster(container, { zeilen: 1, spalten: 3, caption: `${a} ${zeichen} ${b} mod ${m}: Wert = q · ${m} + Rest`, zeilenKopf: () => `${a} ${zeichen} ${b}`, spaltenKopf: (j) => ['Wert', 'q', 'Rest'][j] });
        return {
          schritte: [
            { text: `Rechne ${a} ${zeichen} ${b}.`, feld: zahlFeldG('Wert') },
            { text: (e) => `Wie oft passt ${m} ganz in ${oder(e[0])}? (q)`, feld: zahlFeldG('q') },
            { text: (e) => `Rest: ${oder(e[0])} − ${oder(e[1])} · ${m}`, feld: zahlFeldG('Rest') }
          ],
          markiere(i, e) {
            tab.leeren();
            e.forEach((x, j) => x && tab.eintrag(0, j, x));
            tab.kopfMarke([], [i]);
          },
          korrekt() {
            const wert = werte.op === 'plus' ? a + b : a * b;
            const { q, r: rest } = Krypto.teileMitRest(wert, m);
            return [String(wert), String(q), String(rest)];
          }
        };
      }
      const n = Math.max(1, Math.min(30, b));
      const tab = KRGefuehrt.raster(container, { zeilen: n, spalten: 2, caption: `Potenzkette ${a}ˣ mod ${m}: Produkt mit der Basis, dann den Rest`, zeilenKopf: (x) => `${a}${hochgestellt(x + 1)}`, spaltenKopf: (j) => ['Produkt', `mod ${m}`][j], inhalt: (x, j) => (x === 0 && j === 0 ? String(a) : null) });
      const schritte = [];
      const ziel = [];
      for (let x = 1; x <= n; x++) {
        if (x > 1) {
          const vor = schritte.length - 1;
          schritte.push({ text: (e) => `${a}${hochgestellt(x)}: ${oder(e[vor])} · ${a} (Rest von ${a}${hochgestellt(x - 1)} mal Basis)`, feld: zahlFeldG('Produkt') });
          ziel.push([x - 1, 0]);
        }
        const pr = schritte.length - 1;
        schritte.push({ text: (e) => `${a}${hochgestellt(x)} mod ${m}: Rest von ${x === 1 ? a : oder(e[pr])} bei Division durch ${m}`, feld: zahlFeldG('Rest') });
        ziel.push([x - 1, 1]);
      }
      return {
        schritte,
        markiere(i, e) {
          tab.leeren();
          e.forEach((x, j) => x && tab.eintrag(ziel[j][0], ziel[j][1], x));
          const [zl, sp] = ziel[i];
          tab.markiere(sp === 1 ? [[zl, 0]] : [[zl - 1, 1]]);
        },
        korrekt() {
          const aus = [];
          for (let x = 1; x <= n; x++) {
            if (x > 1) aus.push(String(Krypto.modpow(a, x - 1, m) * a));
            aus.push(String(Krypto.modpow(a, x, m)));
          }
          return aus;
        }
      };
    }
    /** werte = { m, g } */
    function tabelleHook(container, werte) {
      const { m, g } = werte;
      const tab = KRGefuehrt.raster(container, { zeilen: m - 1, spalten: 1, caption: `${g}ˣ mod ${m}: jede Zeile = vorige Zeile · ${g} mod ${m}`, zeilenKopf: (x) => `x = ${x + 1}`, spaltenKopf: () => `${g}ˣ mod ${m}` });
      const schritte = [];
      for (let x = 1; x < m; x++) schritte.push({ text: x === 1 ? `x = 1: ${g}¹ mod ${m}` : (e) => `x = ${x}: ${oder(e[x - 2])} · ${g} mod ${m}`, feld: zahlFeldG(`${g}^${x} mod ${m}`) });
      schritte.push({ text: `Ordnung von ${g}: das kleinste x mit ${g}ˣ mod ${m} = 1 (– wenn es keins gibt)`, feld: zahlFeldG('Ordnung') });
      return {
        schritte,
        markiere(i, e) {
          tab.leeren();
          e.slice(0, m - 1).forEach((x, j) => x && tab.eintrag(j, 0, x));
          tab.markiere(i >= 1 && i < m - 1 ? [[i - 1, 0]] : []);
        },
        korrekt() {
          const aus = [];
          for (let x = 1; x < m; x++) aus.push(String(Krypto.modpow(g, x, m)));
          const ord = Krypto.ordnung(g, m);
          aus.push(ord === null ? '–' : String(ord));
          return aus;
        }
      };
    }
    /** werte = { a, m } */
    function inversesHook(container, werte) {
      const { a, m } = werte;
      const tab = KRGefuehrt.raster(container, { zeilen: m - 1, spalten: 1, caption: `${a} · x mod ${m} – gesucht ist die Zeile mit Rest 1`, zeilenKopf: (x) => `x = ${x + 1}`, spaltenKopf: () => `${a} · x mod ${m}` });
      const schritte = [];
      for (let x = 1; x < m; x++) schritte.push({ text: `x = ${x}: ${a} · ${x} mod ${m}`, feld: zahlFeldG('Rest') });
      schritte.push({ text: `Inverses von ${a} modulo ${m} (– wenn es keins gibt)`, feld: zahlFeldG(`${a}⁻¹ mod ${m}`) });
      return {
        schritte,
        markiere(i, e) {
          tab.leeren();
          e.slice(0, m - 1).forEach((x, j) => x && tab.eintrag(j, 0, x));
          tab.kopfMarke(i < m - 1 ? [i] : [], []);
        },
        korrekt() {
          const aus = [];
          for (let x = 1; x < m; x++) aus.push(String(Krypto.mod(a * x, m)));
          const inv = Krypto.inverses(a, m);
          aus.push(inv === null || inv === undefined ? '–' : String(inv));
          return aus;
        }
      };
    }
    /** werte = { p, g, a, b } – Farbmischer „Mit Zahlen“ als vier Schrittzeilen */
    function farbmischerHook(container, werte) {
      const { p, g, a, b } = werte;
      const tab = KRGefuehrt.raster(container, { zeilen: 4, spalten: 1, caption: `Schlüsseltausch mit p = ${p}, g = ${g}`, zeilenKopf: (z) => ['A (Alice, öffentlich)', 'B (Bob, öffentlich)', 'K bei Alice', 'K bei Bob'][z], spaltenKopf: () => 'Wert' });
      return {
        schritte: [
          { text: `Alice: A = ${g}^${a} mod ${p}`, feld: zahlFeldG('A') },
          { text: `Bob: B = ${g}^${b} mod ${p}`, feld: zahlFeldG('B') },
          { text: (e) => `Alice: K = B^a mod p = ${oder(e[1])}^${a} mod ${p}`, feld: zahlFeldG('K (Alice)') },
          { text: (e) => `Bob: K = A^b mod p = ${oder(e[0])}^${b} mod ${p}`, feld: zahlFeldG('K (Bob)') }
        ],
        markiere(i, e) {
          tab.leeren();
          e.forEach((x, j) => x && tab.eintrag(j, 0, x));
          tab.kopfMarke([i], []);
        },
        korrekt() {
          const A = Krypto.dh.oeffentlich(g, a, p);
          const Bz = Krypto.dh.oeffentlich(g, b, p);
          return [A, Bz, Krypto.dh.gemeinsam(Bz, a, p), Krypto.dh.gemeinsam(A, b, p)].map(String);
        }
      };
    }
    const HOOKS = { uhr: uhrHook, tabelle: tabelleHook, inverses: inversesHook, farbmischer: farbmischerHook };
    // Angaben bleiben im geführten Modus änderbar (Weitertippen nach dem Umschalten): Name → Feldklasse im freien Modus
    const FELDKLASSE = { uhr: { m: 'uhr-m', a: 'uhr-a', b: 'uhr-b' }, tabelle: { m: 'tab-m', g: 'tab-g' }, inverses: { a: 'inv-a', m: 'inv-m' }, farbmischer: { p: 'dh-p', g: 'dh-g', a: 'dh-a', b: 'dh-b' } };
    const BESCHRIFTUNG = { m: 'Modul m', a: 'a', b: 'k', g: 'Basis g', p: 'Primzahl p' };
    const ZUSTAND = () => ({ uhr, tabelle: tab, inverses: inv, farbmischer: dh });
    let fokusAngabe = null; // Name des Felds, das nach dem Neuaufbau den Fokus bekommt
    function fokusName(id) {
      const a = typeof document !== 'undefined' ? document.activeElement : null;
      if (!a || !wurzel.contains(a)) return null;
      if (a.dataset && a.dataset.name) return a.dataset.name;
      const eintrag = Object.entries(FELDKLASSE[id] || {}).find(([, k]) => a.classList.contains(k));
      return eintrag ? eintrag[0] : null;
    }
    function felderVon(id, werte) {
      return Object.keys(FELDKLASSE[id]).map((name) => ({ name, beschriftung: id === 'farbmischer' && name === 'a' ? 'Alices Geheimzahl a' : id === 'farbmischer' && name === 'b' ? 'Bobs Geheimzahl b' : id === 'uhr' && name === 'b' ? (werte.op === 'hoch' ? 'Exponent x' : werte.op === 'mal' ? 'b' : 'k') : BESCHRIFTUNG[name], wert: werte[name], art: 'zahl' }));
    }
    function starteGefuehrt(id, werte) {
      const fokus = fokusAngabe || fokusName(id);
      fokusAngabe = null;
      schliesseTeile();
      AQ.clear(r.flaeche);
      gefuehrt = KRGefuehrt.starte(r.flaeche, HOOKS[id], {
        werte,
        umgebung,
        aufgabe: fuehrung && fuehrung.aufgabe ? fuehrung.aufgabe : null,
        titel: 'Modulo-Uhr & Farbmischer',
        beiEigeneWerte: () => {
          if (erkVerlauf) erkVerlauf.leeren();
          fuehrung = null;
          if (id === 'uhr') Object.assign(uhr, { m: BEISPIEL.m, a: BEISPIEL.a, b: BEISPIEL.b });
          else if (id === 'tabelle') Object.assign(tab, { m: BEISPIEL.tabelleM, g: BEISPIEL.tabelleG });
          else if (id === 'inverses') Object.assign(inv, { m: BEISPIEL.m, a: BEISPIEL.invA });
          else Object.assign(dh, { p: BEISPIEL.p, g: BEISPIEL.g, a: BEISPIEL.alice, b: BEISPIEL.bob });
          baue(id);
        },
        felder: {
          felder: felderVon(id, werte),
          fokus,
          beiAenderung: (w, name) => {
            const ziel = ZUSTAND()[id];
            for (const [k, x] of Object.entries(w)) ziel[k] = zahlVon(x);
            fokusAngabe = name;
            baue(id);
            if (!gefuehrt) {
              fokusAngabe = null;
              const f = r.flaeche.querySelector(`input.${FELDKLASSE[id][name]}`);
              if (f) {
                f.focus();
                const n = String(f.value).length;
                if (typeof f.setSelectionRange === 'function') f.setSelectionRange(n, n);
              }
            }
          }
        }
      });
    }

    /* ======================= Modulo-Uhr ======================= */
    const uhr = { m: vZahl(v.modul) || BEISPIEL.m, a: vZahl(v.a) ?? BEISPIEL.a, b: vZahl(v.b) ?? BEISPIEL.b, op: OPS.some((x) => x.id === v.op) ? v.op : 'plus', beschriftung: 'zahlen', winkel: 0 };
    function baueUhr() {
      const hinweisOrt = h('div', { class: 'modulo-hinweis' });
      const fm = zahlFeld('uhr-m', 'Modul m (2 … 30 auf der Uhr)', uhr.m, (t) => { uhr.m = zahlVon(t); rechne(); });
      const fa = zahlFeld('uhr-a', 'a', uhr.a, (t) => { uhr.a = zahlVon(t); rechne(); });
      const fb = zahlFeld('uhr-b', 'k', uhr.b, (t) => { uhr.b = zahlVon(t); rechne(); });
      const op = radiogruppe(OPS, uhr.op, 'op', 'Rechenart', 'uhr-op', (x) => { uhr.op = x; rechne(); });
      const besch = radiogruppe([{ id: 'zahlen', titel: '0 … m − 1' }, { id: 'buchstaben', titel: 'A = 1 … Z = 26' }], uhr.beschriftung, 'beschriftung', 'Beschriftung der Uhr', 'uhr-beschriftung', (x) => { uhr.beschriftung = x; rechne(); });
      const uhrOrt = h('div', { class: 'uhr-ort' });
      const zeile = h('p', { class: 'uhr-zeile', 'aria-live': 'polite' });
      const liste = h('ol', { class: 'uhr-potenzen' });
      const nsOrt = h('div', { class: 'uhr-nachspiel' });
      r.flaeche.append(
        h('div', { class: 'labor-steuer' }, fm.element, fa.element, fb.element),
        op.element,
        besch.element,
        hinweisOrt,
        h('div', { class: 'uhr-bereich' }, uhrOrt, h('div', { class: 'uhr-text' }, zeile, liste, nsOrt))
      );
      // Ziffernblatt bleibt bestehen (nur Felder und Pfad werden neu gezeichnet), damit der Zeiger per CSS-Übergang
      // sichtbar über den Überlauf läuft; bei reduzierter Bewegung springt er.
      const felderG = s('g', { class: 'uhr-felder' });
      const pfadG = s('g', { class: 'uhr-pfadgruppe' });
      const zeiger = s('line', { class: `zeiger${ruhig ? '' : ' animiert'}`, x1: MITTE, y1: MITTE, x2: MITTE, y2: 40 });
      const uhrSvg = s('svg', { class: 'uhr', viewBox: '0 0 300 300', role: 'img' }, s('circle', { class: 'uhr-rand', cx: MITTE, cy: MITTE, r: 140 }), felderG, pfadG, zeiger, s('circle', { class: 'uhr-nabe', cx: MITTE, cy: MITTE, r: 6 }));
      /** Ziffernblatt mit m Feldern; ziel = Feld des Zeigers, start = Ausgangsfeld, pfad = Felder der Potenzen. */
      function ziffernblatt(m, { ziel, start, pfad, schritt }) {
        while (felderG.firstChild) felderG.firstChild.remove();
        while (pfadG.firstChild) pfadG.firstChild.remove();
        uhrSvg.setAttribute('aria-label', `Uhr mit ${m} Feldern, Zeiger auf ${ziel}`);
        const grad = 360 / m;
        for (let i = 0; i < m; i++) {
          const [x, y] = punkt(118, i * grad);
          const [xm, ym] = punkt(140, i * grad);
          const text = uhr.beschriftung === 'buchstaben' && m === 26 ? Krypto.buchstabe(Krypto.mod(i - 1, 26), 0) : String(i);
          const kl = ['uhr-feld', i === ziel ? 'ziel' : '', i === start ? 'start' : '', pfad && pfad.includes(i) ? 'pfad' : ''].filter(Boolean).join(' ');
          felderG.appendChild(s('g', { class: kl, 'data-feld': String(i) }, s('circle', { class: 'uhr-marke', cx: xm, cy: ym, r: i === ziel ? 7 : 3.5 }), s('text', { x, y, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, text)));
        }
        if (pfad && pfad.length > 1) {
          const sichtbar = pfad.slice(0, schritt === undefined ? pfad.length : schritt + 1);
          pfadG.appendChild(s('polyline', { class: 'uhr-pfad', points: sichtbar.map((i) => punkt(100, i * grad).join(',')).join(' ') }));
        }
        zeiger.style.setProperty('--winkel', `${uhr.winkel}deg`);
        return uhrSvg;
      }
      function rechne() {
        schliesseTeile();
        AQ.clear(hinweisOrt);
        AQ.clear(liste);
        AQ.clear(nsOrt);
        const { m, a, b } = uhr;
        fa.label.textContent = uhr.op === 'hoch' ? 'Basis g' : 'a';
        fb.label.textContent = uhr.op === 'plus' ? 'k (Schritte weiter)' : uhr.op === 'mal' ? 'b' : 'Exponent x (bis 30)';
        for (const kn of besch.knoepfe) kn.disabled = m !== 26 && kn.dataset.beschriftung === 'buchstaben';
        if (m !== 26) uhr.beschriftung = 'zahlen';
        for (const kn of besch.knoepfe) {
          const an = kn.dataset.beschriftung === uhr.beschriftung;
          kn.setAttribute('aria-checked', String(an));
          kn.setAttribute('tabindex', an ? '0' : '-1');
        }
        z.m = m;
        if (m === null || m < 2 || m > 1000 || a === null || b === null) {
          hinweisOrt.appendChild(B.hinweis('warnung', 'Gib ganze Zahlen ein: Modul m von 2 bis 1000, a und k ab 0.'));
          zeile.textContent = '';
          AQ.clear(uhrOrt);
          return;
        }
        if ((uhr.op !== 'hoch' || (b >= 1 && b <= 30)) && erkenne('uhr', [a, b, m], { m, a, b, op: uhr.op })) return;
        const buchstabe = (r0) => (uhr.beschriftung === 'buchstaben' && m === 26 ? ` (${Krypto.buchstabe(Krypto.mod(r0 - 1, 26), 0)})` : '');
        let ziel;
        let start = Krypto.mod(a, m);
        let pfad = null;
        if (uhr.op === 'plus' || uhr.op === 'mal') {
          const wert = uhr.op === 'plus' ? a + b : a * b;
          const { q, r: rest } = Krypto.teileMitRest(wert, m);
          ziel = rest;
          uhr.winkel = (wert * 360) / m;
          zeile.textContent = `${a} ${uhr.op === 'plus' ? '+' : '·'} ${b} = ${wert} = ${q} · ${m} + ${rest} → ${rest}${buchstabe(rest)}`;
          z.potenzen = [];
          if (uhr.op === 'plus' && q > 0) hinweisOrt.appendChild(B.hinweis('info', `Überlauf: Der Zeiger läuft ${q === 1 ? 'einmal' : `${q}-mal`} über die ${m} hinaus und landet bei ${rest}.`));
        } else {
          if (b < 1 || b > 30) {
            hinweisOrt.appendChild(B.hinweis('warnung', 'Der Exponent liegt zwischen 1 und 30.'));
            zeile.textContent = '';
            AQ.clear(uhrOrt);
            return;
          }
          const zeilen = [];
          const potenzen = [];
          let vorher = null;
          for (let x = 1; x <= b; x++) {
            const p = Krypto.modpow(a, x, m);
            const produkt = x === 1 ? a : vorher * a;
            const { q, r: rest } = Krypto.teileMitRest(produkt, m);
            zeilen.push(x === 1 ? `${a}¹ = ${a} = ${q} · ${m} + ${rest} → ${p}` : `${a}${hochgestellt(x)} = ${vorher} · ${a} = ${produkt} = ${q} · ${m} + ${rest} → ${p}`);
            potenzen.push(p);
            vorher = p;
          }
          z.potenzen = potenzen;
          ziel = potenzen[potenzen.length - 1];
          start = null;
          pfad = potenzen;
          uhr.winkel = (ziel * 360) / m;
          zeile.textContent = zeilen[zeilen.length - 1];
          for (const t of zeilen) liste.appendChild(h('li', null, t));
          if (m <= UHR_MAX && potenzen.length > 1) {
            nachspiel = KRLabor.nachspiel(nsOrt, {
              titel: 'Potenzen Schritt für Schritt',
              start: potenzen.length - 1,
              schritte: zeilen.map((t, i) => ({ text: t, daten: { i } })),
              zeige(schritt) {
                const i = schritt.daten.i;
                uhr.winkel = (potenzen[i] * 360) / m;
                zeigeUhr(ziffernblatt(m, { ziel: potenzen[i], pfad, schritt: i }));
              }
            });
          }
        }
        z.zeiger = ziel;
        z.zeile = zeile.textContent;
        if (m > UHR_MAX) {
          AQ.mount(uhrOrt, h('p', { class: 'text-2' }, `Die Uhr zeigt höchstens ${UHR_MAX} Felder – für m = ${m} gilt die Rechenzeile (oder die Wertetabelle).`));
          return;
        }
        zeigeUhr(ziffernblatt(m, { ziel, start, pfad }));
      }
      function zeigeUhr(el) {
        if (el.parentNode !== uhrOrt) AQ.mount(uhrOrt, el);
      }
      rechne();
    }

    /* ======================= Wertetabelle ======================= */
    const tab = { m: vZahl(v.modul) || BEISPIEL.tabelleM, g: vZahl(v.g) || BEISPIEL.tabelleG };
    function baueTabelle() {
      const hinweisOrt = h('div', { class: 'modulo-hinweis' });
      const kopf = h('p', { class: 'tabelle-kopf', 'aria-live': 'polite' });
      const ort = h('div', { class: 'tabelle-ort' });
      r.flaeche.append(
        h('div', { class: 'labor-steuer' }, zahlFeld('tab-m', 'Modul m (2 … 1000)', tab.m, (t) => { tab.m = zahlVon(t); rechne(); }).element, zahlFeld('tab-g', 'Basis g', tab.g, (t) => { tab.g = zahlVon(t); rechne(); }).element),
        hinweisOrt,
        kopf,
        ort
      );
      function rechne() {
        AQ.clear(hinweisOrt);
        AQ.clear(ort);
        const { m, g } = tab;
        z.m = m;
        if (m === null || g === null || m < 2 || m > 1000 || g < 1 || g >= m) {
          hinweisOrt.appendChild(B.hinweis('warnung', 'Modul m von 2 bis 1000, Basis g von 1 bis m − 1.'));
          kopf.textContent = '';
          z.potenzen = [];
          z.primitiv = null;
          return;
        }
        if (erkenne('tabelle', [g, m], { m, g })) return;
        const potenzen = [];
        for (let x = 1; x < m; x++) potenzen.push(Krypto.modpow(g, x, m));
        const ord = Krypto.ordnung(g, m);
        z.potenzen = potenzen;
        z.primitiv = ord === m - 1;
        if (ord === null) kopf.textContent = `g = ${g} und m = ${m} haben den ggT ${Krypto.ggT(g, m)} – gˣ erreicht die 1 nie.`;
        else if (ord === m - 1) kopf.textContent = `✓ ${g} ist Primitivwurzel modulo ${m}: gˣ trifft alle Reste 1 … ${m - 1}.`;
        else kopf.textContent = `${g} ist keine Primitivwurzel modulo ${m}: ord(${g}) = ${ord} – g erreicht nur ord(${g}) = ${ord} Reste, dann wiederholt sich alles.`;
        ort.appendChild(
          h(
            'div',
            { class: 'scroll-x tabelle-scroll' },
            h(
              'table',
              { class: 'labor-tabelle modulo-tabelle' },
              h('caption', null, `${g}ˣ mod ${m} für x = 1 … ${m - 1}`),
              h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'x'), h('th', { scope: 'col' }, `${g}ˣ mod ${m}`))),
              h('tbody', null, potenzen.map((p, i) => h('tr', { class: p === 1 ? 'eins' : null }, h('th', { scope: 'row' }, String(i + 1)), h('td', null, p === 1 ? `${p} ↺` : String(p)))))
            )
          )
        );
      }
      rechne();
    }

    /* ======================= Inverses ======================= */
    const inv = { m: vZahl(v.modul) || BEISPIEL.m, a: vZahl(v.a) ?? BEISPIEL.invA };
    function baueInverses() {
      const hinweisOrt = h('div', { class: 'modulo-hinweis' });
      const ort = h('div', { class: 'inverses-ort' });
      r.flaeche.append(
        h('div', { class: 'labor-steuer' }, zahlFeld('inv-a', 'Zahl a', inv.a, (t) => { inv.a = zahlVon(t); rechne(); }).element, zahlFeld('inv-m', 'Modul m (2 … 1000)', inv.m, (t) => { inv.m = zahlVon(t); rechne(); }).element),
        hinweisOrt,
        ort
      );
      function rechne() {
        AQ.clear(hinweisOrt);
        AQ.clear(ort);
        const { m, a } = inv;
        z.m = m;
        z.inverses = null;
        if (m === null || a === null || m < 2 || m > 1000 || a < 1) {
          hinweisOrt.appendChild(B.hinweis('warnung', 'Zahl a ab 1, Modul m von 2 bis 1000.'));
          return;
        }
        if (erkenne('inverses', [a, m], { a, m })) return;
        const ggt = Krypto.ggT(a, m);
        const x0 = Krypto.inverses(a, m);
        z.inverses = x0;
        if (ggt !== 1) hinweisOrt.appendChild(B.hinweis('warnung', `${a} hat modulo ${m} kein Inverses, weil ggT = ${ggt}: a · x mod ${m} trifft die 1 nie.`));
        else hinweisOrt.appendChild(B.hinweis('ok', `${a}⁻¹ mod ${m} = ${x0}, denn ${a} · ${x0} = ${a * x0} = ${Krypto.teileMitRest(a * x0, m).q} · ${m} + 1.`));
        const zeilen = [];
        for (let x = 1; x < m; x++) {
          const rest = Krypto.mod(a * x, m);
          const treffer = rest === 1;
          zeilen.push(h('tr', { class: treffer ? 'treffer' : null, 'data-x': String(x) }, h('th', { scope: 'row' }, String(x)), h('td', null, `${a} · ${x} = ${a * x}`), h('td', null, treffer ? `${rest} ✓` : String(rest))));
        }
        ort.appendChild(h('div', { class: 'scroll-x tabelle-scroll' }, h('table', { class: 'labor-tabelle modulo-tabelle' }, h('caption', null, `${a} · x mod ${m} für x = 1 … ${m - 1}`), h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'x'), h('th', { scope: 'col' }, 'a · x'), h('th', { scope: 'col' }, `mod ${m}`))), h('tbody', null, zeilen))));
      }
      rechne();
    }

    /* ======================= Farbmischer ======================= */
    const dh = { mitZahlen: vZahl(v.alice) !== null || vZahl(v.bob) !== null, p: vZahl(v.p) || BEISPIEL.p, g: vZahl(v.g) || BEISPIEL.g, a: vZahl(v.alice) ?? BEISPIEL.alice, b: vZahl(v.bob) ?? BEISPIEL.bob, schritt: 0 };
    /** Topffarben aus den Tokens lesen (Darstellung) – null, wenn der Browser sie nicht liefert. */
    function basisFarben(proben) {
      if (typeof getComputedStyle !== 'function') return null;
      const aus = {};
      for (const f of FARBEN) {
        const t = String(getComputedStyle(proben[f]).color || '');
        const n = (t.match(/[\d.]+/g) || []).map(Number);
        if (!/^rgb/.test(t) || n.length < 3) return null;
        aus[f] = n.slice(0, 3);
      }
      return aus;
    }
    const musterVon = (mg) => h('span', { class: 'muster-reihe', 'aria-hidden': 'true' }, FARBEN.flatMap((f) => Array.from({ length: mg[f] || 0 }, () => h('span', { class: `muster muster-${f}` }))));
    function baueFarbmischer() {
      const proben = Object.fromEntries(FARBEN.map((f) => [f, h('span', { class: `farb-probe farbe-${f}`, 'aria-hidden': 'true' })]));
      const toepfe = FARBEN.map((f) => h('button', { type: 'button', class: 'topf', 'data-farbe': f }, h('span', { class: `muster muster-${f} topf-farbe`, 'aria-hidden': 'true' }), h('span', { class: 'topf-name' }, FARB_TITEL[f]), h('span', { class: 'topf-rolle' }, FARB_ROLLE[f])));
      const topfInfo = h('p', { class: 'topf-info', 'aria-live': 'polite' }, 'Tippe einen Topf an.');
      const schalterId = B.neueId('mit-zahlen');
      const schalter = h('input', { type: 'checkbox', id: schalterId, class: 'mit-zahlen' });
      schalter.checked = dh.mitZahlen;
      const hinweisOrt = h('div', { class: 'modulo-hinweis' });
      const zahlenOrt = h('div', { class: 'dh-eingaben' });
      const buehne = h('div', { class: 'farb-buehne' });
      const nsOrt = h('div', { class: 'farb-nachspiel' });
      const eveMischen = h('button', { type: 'button', class: 'knopf knopf-zweit eve-mischen', disabled: true }, 'Eve: Mischungen kombinieren');
      const eveErgebnis = h('div', { class: 'eve-ergebnis', 'aria-live': 'polite' });
      r.flaeche.append(
        h('div', { class: 'farb-toepfe', role: 'group', 'aria-label': 'Farbtöpfe' }, toepfe),
        topfInfo,
        h('label', { class: 'runden-schalter modulo-schalter', for: schalterId }, schalter, 'Mit Zahlen'),
        zahlenOrt,
        hinweisOrt,
        nsOrt,
        buehne,
        h('div', { class: 'eve-bereich' }, eveMischen, eveErgebnis),
        h('p', { class: 'farb-merksatz' }, 'Mischen ist leicht, Entmischen schwer – wie gˣ mod p.'),
        h('div', { class: 'farb-proben', 'aria-hidden': 'true' }, Object.values(proben))
      );
      toepfe.forEach((t) =>
        t.addEventListener('click', () => {
          const f = t.dataset.farbe;
          topfInfo.textContent = f === 'gelb' ? 'Gelb ist öffentlich – Alice, Bob und Eve kennen es.' : f === 'rot' ? 'Rot kennt nur Alice. Es geht nie über den Kanal.' : 'Blau kennt nur Bob. Es geht nie über den Kanal.';
          t.classList.remove('geschuettet');
          if (!ruhig) t.classList.add('geschuettet');
        })
      );
      const felder = {};
      const dhFeld = (k, titel) => {
        const f = zahlFeld(`dh-${k}`, titel, dh[k], (t) => {
          dh[k] = zahlVon(t);
          zeige();
        });
        felder[k] = f;
        return f.element;
      };
      zahlenOrt.append(dhFeld('p', 'Primzahl p (bis 101)'), dhFeld('g', 'Basis g'), dhFeld('a', 'Alices Geheimzahl a'), dhFeld('b', 'Bobs Geheimzahl b'));
      zahlenOrt.hidden = !dh.mitZahlen;
      schalter.addEventListener('change', () => {
        dh.mitZahlen = schalter.checked;
        zahlenOrt.hidden = !dh.mitZahlen;
        z.eve = null;
        zeige();
      });
      eveMischen.addEventListener('click', () => {
        if (dh.mitZahlen) {
          if (z.A === null) return;
          z.eve = Krypto.mod(z.A * z.B, dh.p);
          eveErgebnis.textContent = `Eve multipliziert A · B mod p = ${z.A} · ${z.B} mod ${dh.p} = ${z.eve} – das ist gᵃ⁺ᵇ, nicht der Schlüssel K = gᵃᵇ.`;
        } else {
          z.eve = menge({ gelb: 2, rot: 1, blau: 1 });
          AQ.mount(eveErgebnis, farbKarte('eve-mischung', 'Eve kippt beide Mischungen zusammen', z.eve));
          eveErgebnis.appendChild(h('p', { class: 'text-2' }, 'Gelb ist jetzt doppelt drin (Muster: zwei Punkte-Töpfe) – deutlich gelber als die gemeinsame Farbe von Alice und Bob. Entmischen kann Eve nicht.'));
        }
      });
      let basis = null;
      function farbKarte(klasse, titel, mg) {
        const kreis = h('span', { class: `farbkreis${ruhig ? '' : ' neu'}`, 'aria-hidden': 'true' });
        const farbe = farbeMischen(mg, basis);
        if (farbe) kreis.style.setProperty('--mischung', farbe);
        return h('div', { class: `farb-karte ${klasse}` }, h('h3', null, titel), h('div', { class: 'farb-zeile' }, kreis, h('div', null, h('p', { class: 'farbname' }, farbName(mg)), musterVon(mg))));
      }
      const SCHRITTE_FARBE = [
        '1 Öffentlich: Alice und Bob einigen sich offen auf Gelb.',
        '2 Geheim: Alice mischt Gelb mit Rot, Bob mischt Gelb mit Blau. Rot und Blau bleiben geheim.',
        '3 Austausch: Die Mischungen gehen über den Kanal – Eve sieht sie.',
        '4 Fertig: Alice gibt Rot in Bobs Mischung, Bob gibt Blau in Alices Mischung – beide haben dieselbe Farbe.'
      ];
      function zustandFarbe(i) {
        z.alice = i === 0 ? menge({ gelb: 1 }) : i < 3 ? menge({ gelb: 1, rot: 1 }) : menge({ gelb: 1, rot: 1, blau: 1 });
        z.bob = i === 0 ? menge({ gelb: 1 }) : i < 3 ? menge({ gelb: 1, blau: 1 }) : menge({ gelb: 1, blau: 1, rot: 1 });
      }
      function zeigeFarbe(i) {
        dh.schritt = i;
        zustandFarbe(i);
        const kanal = [h('li', null, h('span', { class: 'muster muster-gelb', 'aria-hidden': 'true' }), ' Gelb (öffentlich)')];
        if (i >= 2) kanal.push(h('li', null, musterVon(menge({ gelb: 1, rot: 1 })), ' Mischung von Alice: ', farbName(menge({ gelb: 1, rot: 1 }))), h('li', null, musterVon(menge({ gelb: 1, blau: 1 })), ' Mischung von Bob: ', farbName(menge({ gelb: 1, blau: 1 }))));
        AQ.mount(buehne, farbKarte('farb-alice', 'Alice', z.alice), h('div', { class: 'eve-leiste' }, h('h3', null, 'Kanal – Eve sieht'), h('ul', null, kanal)), farbKarte('farb-bob', 'Bob', z.bob));
        eveMischen.disabled = i < 2;
      }
      function zeigeZahlen(i, w) {
        dh.schritt = i;
        const zeileA = i >= 1 ? `A = g^a mod p = ${dh.g}^${dh.a} mod ${dh.p} = ${w.A}` : 'a geheim';
        const zeileB = i >= 1 ? `B = g^b mod p = ${dh.g}^${dh.b} mod ${dh.p} = ${w.B}` : 'b geheim';
        const rechenweg = (basisZahl, exp) => B.tabelle({ caption: `Schnelles Potenzieren ${basisZahl}^${exp} mod ${dh.p}`, kopf: ['Exponent', 'Basis', 'Ergebnis'], zeilen: Krypto.modpow(basisZahl, exp, dh.p, { protokoll: true }).schritte.map((x) => [String(x.exponent), String(x.basis), String(x.ergebnis)]), klasse: 'dh-rechenweg' });
        const karte = (klasse, titel, geheim, zeile, rw, kZeile) => h('div', { class: `farb-karte ${klasse}` }, h('h3', null, titel), h('p', null, `kennt p = ${dh.p}, g = ${dh.g} und ${geheim}`), h('p', { class: 'dh-zeile' }, zeile), i >= 1 ? rw : null, i >= 3 ? h('p', { class: 'dh-zeile dh-k' }, kZeile) : null);
        const kanal = [h('li', null, `p = ${dh.p}`), h('li', null, `g = ${dh.g}`)];
        if (i >= 2) kanal.push(h('li', null, `A = ${w.A}`), h('li', null, `B = ${w.B}`));
        AQ.mount(
          buehne,
          karte('farb-alice', 'Alice', 'ihre Geheimzahl', zeileA, rechenweg(dh.g, dh.a), `K = B^a mod p = ${w.B}^${dh.a} mod ${dh.p} = ${w.K}`),
          h('div', { class: 'eve-leiste' }, h('h3', null, 'Kanal – Eve sieht'), h('ul', null, kanal), h('p', { class: 'text-2' }, 'Eve kennt A, aber nicht den Exponenten. Ihn zu finden (diskreter Logarithmus) kann dieses Werkzeug absichtlich nicht.')),
          karte('farb-bob', 'Bob', 'seine Geheimzahl', zeileB, rechenweg(dh.g, dh.b), `K = A^b mod p = ${w.A}^${dh.b} mod ${dh.p} = ${w.K}`)
        );
        eveMischen.disabled = i < 2;
      }
      function zeige() {
        schliesseTeile();
        AQ.clear(hinweisOrt);
        AQ.clear(eveErgebnis);
        basis = basisFarben(proben);
        const start = Math.max(0, Math.min(3, dh.schritt));
        if (!dh.mitZahlen) {
          z.A = null;
          z.B = null;
          z.K = null;
          nachspiel = KRLabor.nachspiel(nsOrt, { titel: 'Schlüsseltausch in vier Schritten', start, schritte: SCHRITTE_FARBE.map((text, i) => ({ text, daten: { i } })), zeige: (sch) => zeigeFarbe(sch.daten.i) });
          return;
        }
        const { p, g, a, b } = dh;
        z.A = null;
        z.B = null;
        z.K = null;
        if (p === null || p > 101 || !Krypto.istPrim(p)) {
          hinweisOrt.appendChild(B.hinweis('warnung', 'p muss eine Primzahl bis 101 sein.'));
          AQ.clear(buehne);
          return;
        }
        if (g === null || g < 2 || g >= p) {
          hinweisOrt.appendChild(B.hinweis('warnung', `g liegt zwischen 2 und p − 1 = ${p - 1}.`));
          AQ.clear(buehne);
          return;
        }
        const ord = Krypto.ordnung(g, p);
        if (ord !== p - 1) hinweisOrt.appendChild(B.hinweis('warnung', `g = ${g} ist keine Primitivwurzel modulo ${p} (ord(${g}) = ${ord}): gˣ trifft nur ${ord} von ${p - 1} Resten – wähle ein anderes g.`));
        if (a === null || b === null || a < 1 || b < 1 || a > p - 2 || b > p - 2) {
          hinweisOrt.appendChild(B.hinweis('warnung', `Die Geheimzahlen a und b liegen zwischen 1 und p − 2 = ${p - 2}.`));
          AQ.clear(buehne);
          return;
        }
        if (erkenne('farbmischer', [p, g, a, b], { p, g, a, b })) return;
        const A = Krypto.dh.oeffentlich(g, a, p);
        const Bz = Krypto.dh.oeffentlich(g, b, p);
        const w = { A, B: Bz, K: Krypto.dh.gemeinsam(Bz, a, p) };
        z.A = w.A;
        z.B = w.B;
        z.K = w.K;
        const texte = [
          `1 Öffentlich: p = ${p} und g = ${g} – alle kennen sie.`,
          `2 Geheim: Alice rechnet A = ${g}^a mod ${p} = ${w.A}, Bob B = ${g}^b mod ${p} = ${w.B}.`,
          `3 Austausch: A = ${w.A} und B = ${w.B} gehen über den Kanal – Eve sieht sie.`,
          `4 Fertig: Alice rechnet B^a mod p, Bob A^b mod p – beide erhalten K = ${w.K}.`
        ];
        nachspiel = KRLabor.nachspiel(nsOrt, { titel: 'Schlüsseltausch mit Zahlen', start, schritte: texte.map((text, i) => ({ text, daten: { i } })), zeige: (sch) => zeigeZahlen(sch.daten.i, w) });
      }
      zeige();
    }

    function baue(id) {
      schliesseTeile();
      AQ.clear(r.flaeche);
      if (id === 'uhr') baueUhr();
      else if (id === 'tabelle') baueTabelle();
      else if (id === 'inverses') baueInverses();
      else if (id === 'farbmischer') baueFarbmischer();
    }
    baue(r.aktiv());

    return {
      schliesse() {
        schliesseTeile();
      },
      zustand() {
        return { reiter: r.aktiv(), ...z };
      }
    };
  }

  KRLabor.registriere('modulo', { titel: 'Modulo-Uhr & Farbmischer', oeffne });
})();
