/* Kryptos – Labor-Werkzeug „Skytale & Gitter“ (W0 §9.1, Plan M6 Task 112, Plan M10 Tasks 227/228)
   Herkunft: Krypto-Werkstatt (Ideen von A. Bodendiek), stationen/skytale.html, stationen/pfluegen.html, stationen/schablone.html @59004d9 – docs/FREMDCODE.md
   M10: Holzstab mit Band (Stabwahl, Stempel, Abwickeln, Aufwickeln und Lesen) und Reiter „Pflügen · Zusatz“ nach der Werkstatt;: Skytale (Stab, Raster, alle Stäbe),
   Gartenzaun (Zickzack, Schienen), Fleißner-Schablone (Löcher stanzen, Drehgruppen, drehen), ab Welt 6 der Ring
   (W6 §9.1, Task 113: Lesereihenfolge, nie gelesene Felder, keine Schlüsselsuche). Stab, Zaun und Schablone
   sind die Objekte; darunter steht das Raster als echte Tabelle. Rechnet nur über Krypto.*; speichert nichts. */
'use strict';
(() => {
  const { h, s } = AQ;
  const B = KRLaborBau;
  const S = KRStation;
  // schablone6: Lochung der Werkstatt-Station (Plan M10 E182), gültig nach Krypto.schablonePruefen(6, …)
  const BEISPIEL = { text: 'wachwechsel am suedturm', schablone: [[1, 1], [1, 3], [2, 4], [3, 2]], schablone6: [[1, 2], [2, 1], [2, 3], [3, 2], [3, 6], [4, 4], [5, 5], [6, 3], [6, 6]] };
  const REITER_TITEL = { skytale: 'Skytale', gartenzaun: 'Gartenzaun', fleissner: 'Fleißner-Schablone', pfluegen: 'Pflügen · Zusatz', ring: 'Ring' };
  const SYMBOL = ['●', '▲', '■', '◆'];
  const GROESSE = 4;
  const MAX_TEXT = 120;

  const zeilenweise = (a, b) => a[0] - b[0] || a[1] - b[1];
  const ganz = (x, lo, hi, std) => (Number.isInteger(x) && x >= lo && x <= hi ? x : std);
  /** Gültige Lochliste aus der Voreinstellung (höchstens g²/4 verschiedene Felder 1–g), sonst null. */
  function lochListe(x, g = GROESSE) {
    if (!Array.isArray(x) || x.length > (g * g) / 4) return null;
    const ok = x.every((l) => Array.isArray(l) && l.length === 2 && l.every((n) => Number.isInteger(n) && n >= 1 && n <= g));
    if (!ok || new Set(x.map((l) => l.join(','))).size !== x.length) return null;
    return x.map((l) => l.slice()).sort(zeilenweise);
  }
  /** Fehler der Bibliothek als Meldung (KryptoFehler), sonst weiterwerfen. */
  function versuche(fn) {
    try {
      return { wert: fn() };
    } catch (e) {
      if (e && e.name === 'KryptoFehler') return { fehler: e.message };
      throw e;
    }
  }

  function oeffne(container, voreinstellung, umgebung) {
    const v = voreinstellung || {};
    const reiterListe = KRLabor.reiterFuer('skytale', v, umgebung).filter((r) => REITER_TITEL[r]);
    if (!reiterListe.length) reiterListe.push('skytale');
    const ruhig = AQ.ruhig();
    const z = {
      richtung: v.richtung === 'ent' ? 'ent' : 'ver',
      text: typeof v.text === 'string' ? v.text.slice(0, MAX_TEXT) : BEISPIEL.text,
      k: ganz(v.k, 2, 12, 5),
      umfang: ganz(v.umfang, 2, 10, 3),
      zeilen: ganz(v.zeilen, 2, 8, 3),
      groesse: v.groesse === 6 ? 6 : GROESSE,
      schablone: null,
      stellung: 1,
      block: 8,
      t: ganz(v.t, 1, 11, 3),
      ausgabe: ''
    };
    if (z.t > z.block - 1) z.t = 3;
    z.schablone = lochListe(v.schablone, z.groesse) || (z.groesse === 6 ? BEISPIEL.schablone6 : BEISPIEL.schablone).map((l) => l.slice());
    // M10 Task 227: Ohne Voreinstellung steht das Beispiel da; der erste Stempel beginnt eine eigene Nachricht
    let beispiel = typeof v.text !== 'string';
    let teil = null; // { schliesse(), zustand() } des aktiven Reiters
    const timer = new Set();
    // M11 (E208, E210, E214): Erkenner-Verlauf, Start im geführten Modus (Panel), laufender geführter Modus
    const erkVerlauf = typeof KRErkenner !== 'undefined' ? KRErkenner.verlauf() : null;
    let fuehrung = umgebung && umgebung.gefuehrt && typeof umgebung.gefuehrt === 'object' ? umgebung.gefuehrt : null;
    let gefuehrt = null;
    const mitGefuehrt = typeof KRGefuehrt !== 'undefined';
    const lochSchluessel = () => `loch=${z.schablone.map((l) => l.join(',')).sort().join(';')}`;
    /** Aufgabenwerte erkannt? → geführter Modus (Hook) und true; sonst false (frei rechnen) */
    function erkenne(reiterId, eingaben, ort) {
      const werte = { text: z.text, umfang: z.umfang, zeilen: z.zeilen, k: z.k, t: z.t, schablone: z.schablone.map((l) => l.slice()), groesse: z.groesse, richtung: z.richtung };
      return B.erkenne(ort, `skytale.${reiterId}`, eingaben, umgebung, erkVerlauf, { gefuehrt: mitGefuehrt ? () => starteGefuehrt(reiterId, werte) : null }) !== 'frei';
    }

    const r = B.reiter(reiterListe.map((id) => ({ id, titel: REITER_TITEL[id] })), { aktiv: reiterListe[0], beiWechsel: baue });
    container.appendChild(h('div', { class: 'labor-werkzeug skytale-werkzeug' }, r.element));

    /* ---------- gemeinsame Teile ---------- */

    /** Eingabe + Richtung + normalisierte Anzeige; beiAenderung() nach jeder Änderung. */
    function kopf(beiAenderung) {
      const norm = h('p', { class: 'labor-normal text-2' });
      const feld = B.textfeld({ beschriftung: 'Text (bis 120 Zeichen)', max: MAX_TEXT, wert: z.text, art: z.richtung === 'ver' ? 'klartext' : 'geheimtext', beiEingabe: (t) => { z.text = t; beispiel = false; zeigeNorm(); beiAenderung(); } });
      const ri = B.richtung({ wert: z.richtung, beiWechsel: (x) => { z.richtung = x; zeigeNorm(); beiAenderung(); } });
      function zeigeNorm() {
        const n = Krypto.nurBuchstaben(z.text);
        norm.textContent = n ? `Normalisiert: ${z.richtung === 'ver' ? Krypto.klein(n) : Krypto.gruppieren(n)}` : 'Normalisiert: –';
      }
      zeigeNorm();
      return {
        // Gartenzaun und Ring: Feld, Normalisierung und Richtung zusammen; Werkstatt-Reiter verteilen die Teile (M10)
        get element() {
          return h('div', { class: 'labor-kopf' }, feld.element, norm, ri.element);
        },
        text: () => h('div', { class: 'labor-kopf' }, feld.element, norm),
        richtung: () => ri.element,
        setze(t) {
          feld.setze(t);
          zeigeNorm();
        },
        sperre(an) {
          feld.sperre(an);
          ri.sperre(an);
        }
      };
    }

    /** Zeile „Buchstaben unverändert: ✓“ (Häufigkeiten von Ein- und Ausgabe; Füllzeichen X dürfen dazukommen). */
    function pruefZeile(ein, aus) {
      const he = Krypto.haeufigkeiten(ein);
      const ha = Krypto.haeufigkeiten(aus);
      const gleich = Object.keys(he).every((b) => (b === 'X' ? ha.X >= he.X : he[b] === ha[b]));
      const zusatz = gleich && ha.X > he.X ? ` (dazu ${ha.X - he.X} Füllzeichen X)` : '';
      return h(
        'p',
        { class: `skytale-zeilen-hinweis transposition-pruefung ${gleich ? 'ok' : 'anders'}` },
        gleich ? `Buchstaben unverändert: ✓${zusatz} – die Buchstaben tauschen nur ihre Plätze (Transposition). Eine Häufigkeitsanalyse zeigt deshalb deutsche Häufigkeiten (Falle P6).` : 'Buchstaben unverändert: ✗'
      );
    }

    /** Ausgabe setzen: Geheimtext GROSS in Fünfergruppen, Klartext klein. */
    function setzeAusgabe(aus, wert) {
      z.ausgabe = wert || '';
      aus.setze(!wert ? '' : z.richtung === 'ver' ? Krypto.gruppieren(wert) : Krypto.klein(wert));
    }

    /* ---------- Skytale: Holzstab mit Band nach der Krypto-Werkstatt (Plan M10 Task 227) ---------- */

    // Geometrie des Stabs (Seitenansicht, viewBox-Breite 1000; nach stationen/skytale.html) – nur Darstellung
    const STAB = { breite: 1000, cy: 192, winkel: (58 * Math.PI) / 180, links: 62, rechts: 950, rx: 26, schrift: 22, maxWindungen: 12 };
    STAB.anfang = STAB.links + 78;
    const stabRadius = (u) => 78 + 7 * u;
    const mische = (a, b, t) => a + (b - a) * t;
    const bogen = (a, m, b, t) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * m + t * t * b;
    /** Lage eines Buchstabens (x, y, Maßstab sx/sy, Deckkraft o) als transform/opacity setzen */
    function lege(el, p) {
      el.setAttribute('transform', `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) scale(${p.sx.toFixed(3)} ${p.sy.toFixed(3)})`);
      el.setAttribute('opacity', p.o.toFixed(2));
    }
    function zwischen(a, b, t) {
      const m = { x: a.x, y: Math.min(a.y, b.y) - 20 };
      return { x: bogen(a.x, m.x, b.x, t), y: bogen(a.y, m.y, b.y, t), sx: mische(a.sx, b.sx, t), sy: mische(a.sy, b.sy, t), o: mische(a.o, b.o, t) };
    }

    function baueSkytale() {
      let alle = null;
      let lauf = 0; // laufende Animation (wird bei jeder Änderung neu gezählt)
      // Phase der Nachricht am Objekt: ver 'stab' (auf dem Stab) | 'band' (abgewickelt); ent 'lose' | 'gelesen'
      let phase = z.richtung === 'ver' ? 'stab' : 'lose';
      let gesperrt = false;
      const anleitung = S.anleitung(null, []);
      const erklaerung = S.erklaerung(null);
      const k = kopf(() => {
        phase = z.richtung === 'ver' ? 'stab' : 'lose';
        zeichne();
      });
      const umfang = B.zahl({ beschriftung: 'Schlüssel: Umfang u (Buchstaben pro Runde)', min: 2, max: 10, wert: z.umfang, beiWechsel: (u) => setzeU(u), minusLabel: 'Stab dünner (u − 1)', plusLabel: 'Stab dicker (u + 1)' });
      // Stabwahl als Reihe von Stab-Querschnitten (HTML-Knöpfe, E197)
      const wahlKnoepfe = [2, 3, 4, 5, 6, 7, 8, 9, 10].map((u) => {
        const r = 5 + 1.35 * u; // u = 10: 18,5 – mit Rand im 44er-Feld, Abstand zur Ziffer (M10-Review Fund 6)
        const b = h(
          'button',
          { type: 'button', class: 'stab-wahl-knopf', 'data-u': String(u), 'aria-label': `Stab mit Umfang ${u}`, 'aria-pressed': 'false' },
          s('svg', { class: 'stab-querschnitt', viewBox: '0 0 44 44', 'aria-hidden': 'true', focusable: 'false' }, s('circle', { class: 'stab-stirn', cx: 22, cy: 22, r }), s('circle', { class: 'stab-jahresring', cx: 22, cy: 22, r: r * 0.5 })),
          h('span', { class: 'stab-wahl-zahl' }, String(u))
        );
        b.addEventListener('click', () => setzeU(u));
        return b;
      });
      const wahl = h('div', { class: 'stab-wahl', role: 'group', 'aria-label': 'Stab wählen (Umfang u = Buchstaben pro Runde)' }, h('span', { class: 'stab-wahl-titel' }, 'Stab wählen:'), wahlKnoepfe);
      const svg = s('svg', { class: 'stab-objekt', role: 'img', viewBox: '0 0 1000 440' });
      const stempelTitel = h('span', { class: 'stab-feldtitel' }, 'Stempel: auf den Stab');
      const stempel = S.stempel(null, (b, knopf) => stempeln(b, knopf), { beschriftung: 'Stempelkasten' });
      const baender = S.baender({ beiAenderung: () => {} });
      const abwickeln = h('button', { type: 'button', class: 'knopf knopf-zweit stab-abwickeln' }, 'Band abwickeln');
      abwickeln.addEventListener('click', () => (z.richtung === 'ver' ? wickleAb() : wickleAufUndLies()));
      const rasterOrt = h('div', { class: 'skytale-raster-ort' });
      const meldung = h('div', { class: 'skytale-meldung' });
      const aus = B.ausgabe({ beschriftung: 'Ergebnis', art: 'frei' });
      const pruef = h('div', { class: 'skytale-pruefung' });
      const info = h('p', { class: 'labor-hinweis hinweis-info skytale-info', role: 'note' });
      const nsOrt = h('div', { class: 'station-nachspiel-ort' });
      const nk = S.nachspielKnopf(nsOrt, { sperre: (an) => sperre(an), beiEnde: () => zeichneStab(), beiLeer: (t) => erklaerung.sage('Nachspielen', t) });
      const alleOrt = h('div');
      const alleDetails = B.details('Alle Stäbe ausprobieren', [h('p', { class: 'text-2' }, 'Eve wickelt den abgefangenen Geheimtext um Stäbe mit u = 2 … 10. Welche Zeile ist lesbar? Das entscheidest du.'), alleOrt], { klasse: 'alle-staebe' });
      const mehr = S.mehr(null, 'Mehr ausprobieren', 'Raster, Probe, alle Stäbe', h('p', { class: 'text-2' }, 'Auf Papier: Tabelle mit u Zeilen – zeilenweise schreiben, spaltenweise lesen. Jede Spalte ist eine Runde um den Stab.'), rasterOrt, pruef, info, alleDetails);
      const soGehts = S.soGehts(null, ['Das Band liegt lückenlos um den Stab. Eine Runde fasst u Buchstaben.', 'Den Klartext zeilenweise entlang des Stabs schreiben, Lücken am Ende mit X füllen.', 'Abgewickelt stehen die Buchstaben einer Runde nebeneinander. Entschlüsseln: auf einen gleich dicken Stab wickeln und entlang lesen.']);
      const hintergrund = S.hintergrund(null, [
        { titel: 'Schlüsselraum', zeilen: [['Schlüssel', 'Umfang u (Buchstaben pro Runde)'], ['Auf Papier', 'Tabelle mit u Zeilen, spaltenweise lesen'], ['Möglichkeiten', 'sehr wenige: bei n Buchstaben höchstens n − 2 Umfänge'], ['Art', 'Transposition']] },
        { titel: 'Warum unsicher?', text: 'Die Buchstaben bleiben gleich, nur ihre Plätze ändern sich. Eve probiert einfach verschieden dicke Stäbe aus.' },
        { titel: 'Geschichte', text: 'Schon die Spartaner sollen so Befehle verschickt haben: Ein Lederband wurde um einen Stab gewickelt und beschrieben.' }
      ]);
      const buehne = h('div', { class: 'stab-buehne' }, anleitung.element, wahl, h('div', { class: 'stab-bild' }, svg), erklaerung.element);
      // eine Bedienung wie in der Werkstatt: Richtung, Schlüssel, Stempel, Bänder, Aktionen, Nachspielen, Text eintippen
      const tippen = B.details('Text eintippen (für längere Nachrichten)', k.text(), { klasse: 'stab-tippen' });
      const bedienung = h(
        'div',
        { class: 'stab-bedienung' },
        k.richtung(),
        umfang.element,
        meldung,
        stempelTitel,
        stempel.element,
        baender.element,
        h('div', { class: 'knopf-reihe' }, abwickeln, nk.element),
        nsOrt,
        tippen
      );
      r.flaeche.append(h('div', { class: 'stab-station' }, buehne, bedienung), soGehts, mehr, hintergrund);
      KRStation.herkunft(r.flaeche);

      function setzeU(u) {
        if (gesperrt) return;
        const neu = Math.max(2, Math.min(10, u));
        umfang.setze(neu);
        if (neu === z.umfang) return;
        z.umfang = neu;
        phase = z.richtung === 'ver' ? 'stab' : 'lose';
        zeichne();
        erklaerung.sage('Stab gewählt', `Um diesen Stab passen ${neu} Buchstaben pro Runde.`);
      }

      function stempeln(b) {
        if (gesperrt) return;
        if (Krypto.nurBuchstaben(z.text).length >= MAX_TEXT) return;
        const neu = phase === 'band' || phase === 'gelesen' || beispiel;
        beispiel = false;
        if (neu) z.text = '';
        z.text = `${z.text}${z.richtung === 'ver' ? Krypto.klein(b) : b}`;
        phase = z.richtung === 'ver' ? 'stab' : 'lose';
        k.setze(z.text);
        zeichne();
        const n = Krypto.nurBuchstaben(z.text).length;
        const u = z.umfang;
        if (z.richtung === 'ver') erklaerung.sage(`Buchstabe ${n}`, 'Jeder Buchstabe landet auf einer anderen Runde. Das leuchtende Feld kommt als Nächstes.');
        else erklaerung.sage(`${n} Buchstaben`, Krypto.mod(n, u) ? `Für volle Runden fehlen noch ${u - Krypto.mod(n, u)}.` : `Das ergibt ${n / u} volle Runden. Stempel weiter oder wickle auf.`);
      }

      function sperre(an) {
        gesperrt = an;
        k.sperre(an);
        umfang.sperre(an);
        stempel.setze(!an);
        abwickeln.disabled = an;
        for (const b of wahlKnoepfe) b.disabled = an;
        S.sperre(r.flaeche, an);
      }

      /* ----- Stab zeichnen ----- */
      let bild = null; // { buchstaben: [{ el, stab, streifen }], windungen: [g], runden: [g] }
      function zeichneStab(sichtbarBis = null) {
        lauf += 1;
        AQ.clear(svg);
        const u = z.umfang;
        const ver = z.richtung === 'ver';
        const roh = Krypto.nurBuchstaben(z.text);
        // ver: auf dem Stab bis zum Abwickeln, danach aufgefüllt. Zeilenlänge = ⌈n/u⌉ wie Krypto.skytaleRaster (M10-Review
        // Fund 2: nicht „mindestens 4“ der Werkstatt – sonst zeigte der Stab eine andere Anordnung als das Abwickeln)
        const fertig = ver ? phase === 'band' : phase === 'gelesen';
        let zeichen = roh;
        let fuellAb = roh.length;
        if (ver && fertig) {
          const r2 = versuche(() => Krypto.skytaleRaster(roh, u));
          if (r2.wert) zeichen = r2.wert.join('');
        }
        const n = zeichen.length;
        const L = Math.max(1, Math.ceil(n / u));
        const W = Math.min(STAB.maxWindungen, Math.max(4, L));
        const BW = (STAB.rechts - 34 - STAB.anfang) / (W + 1.3);
        const R = stabRadius(u);
        const { cy, winkel: A } = STAB;
        const defs = s('defs');
        const holzId = B.neueId('stab-holz');
        const stirnId = B.neueId('stab-stirn');
        const schattenId = B.neueId('stab-schatten');
        const schattierungId = B.neueId('stab-band-schatten');
        defs.append(
          s('linearGradient', { id: holzId, x1: 0, y1: 0, x2: 0, y2: 1 }, ...[[0, 'dunkel'], [0.12, 'tief'], [0.3, 'mitte'], [0.4, 'hell'], [0.55, 'mitte'], [0.82, 'tief'], [1, 'dunkel']].map(([o, c]) => s('stop', { offset: o, class: `stab-holz-${c}` }))),
          s('radialGradient', { id: stirnId, cx: 0.45, cy: 0.45, r: 0.6 }, s('stop', { offset: 0, class: 'stab-holz-hell' }), s('stop', { offset: 0.7, class: 'stab-holz-mitte' }), s('stop', { offset: 1, class: 'stab-holz-tief' })),
          s('linearGradient', { id: schattierungId, gradientUnits: 'userSpaceOnUse', x1: 0, y1: cy - R, x2: 0, y2: cy + R }, ...[[0, 'dunkel', 0.5], [0.16, 'dunkel', 0.15], [0.3, 'licht', 0.25], [0.42, 'licht', 0], [0.7, 'dunkel', 0.08], [0.86, 'dunkel', 0.26], [1, 'dunkel', 0.55]].map(([o, c, a]) => s('stop', { offset: o, class: `stab-schatten-${c}`, 'stop-opacity': a }))),
          s('filter', { id: schattenId, x: '-10%', y: '-20%', width: '120%', height: '150%' }, s('feDropShadow', { class: 'stab-schlagschatten', dx: 0, dy: 8, stdDeviation: 8 }))
        );
        svg.appendChild(defs);
        // Holzstab
        const { links: XL, rechts: XR, anfang: XB, rx: RX } = STAB;
        const holz = s('g', { filter: `url(#${schattenId})` },
          s('path', { class: 'stab-holzkoerper', d: `M ${XL} ${cy - R} L ${XR} ${cy - R} A ${RX} ${R} 0 0 1 ${XR} ${cy + R} L ${XL} ${cy + R} Z`, fill: `url(#${holzId})` })
        );
        const maser = s('g', { class: 'stab-maser' });
        for (let i = 0; i < 15; i++) {
          const f = -1.35 + i * (2.7 / 14);
          const y0 = cy + R * Math.sin(f);
          const amp = 2 + Krypto.mod(i * 37, 5);
          const ph = Krypto.mod(i * 53, 100);
          let d = '';
          for (let x = XL; x <= XR + 4; x += 14) d += `${x === XL ? 'M' : 'L'} ${x} ${(y0 + amp * Math.sin((x + ph * 7) / (60 + Krypto.mod(i, 4) * 25)) * Math.cos(f)).toFixed(1)} `;
          maser.appendChild(s('path', { d, class: Krypto.mod(i, 3) === 0 ? 'stark' : null }));
        }
        holz.append(maser, s('ellipse', { class: 'stab-stirnflaeche', cx: XL, cy, rx: RX, ry: R, fill: `url(#${stirnId})` }));
        for (let i = 1; i < 6; i++) holz.appendChild(s('ellipse', { class: 'stab-ring', cx: XL + 1, cy: cy + 2, rx: (RX * i) / 6, ry: (R * i) / 6 }));
        svg.appendChild(holz);
        // Windungen des Bands (Seitenansicht schräg)
        function windung(c) {
          const l = [];
          const rr = [];
          for (let i = 0; i <= 24; i++) {
            const f = -Math.PI / 2 + (i * Math.PI) / 24;
            const t = (f + A) / (2 * A);
            const x = XB + c * BW + t * BW;
            const y = cy + R * Math.sin(f);
            l.push(`${x.toFixed(1)} ${y.toFixed(1)}`);
            rr.push(`${(x + BW).toFixed(1)} ${y.toFixed(1)}`);
          }
          return `M ${l.join(' L ')} L ${rr.reverse().join(' L ')} Z`;
        }
        const windungen = [];
        for (let c = 0; c < W; c++) {
          const d = windung(c);
          const deckkraft = ver ? (fertig ? 0 : c >= L ? 0.5 : 1) : fertig && c < L ? 1 : 0;
          const g = s('g', { class: 'stab-windung', opacity: deckkraft }, s('path', { class: 'stab-band', d }), s('path', { class: 'stab-band-schatten', d, fill: `url(#${schattierungId})` }));
          windungen.push(g);
          svg.appendChild(g);
        }
        // Klammer am Bandanfang, Marke „Zeilenende“
        svg.appendChild(s('g', { class: 'stab-klammer', transform: `translate(${XB + BW * 0.35} ${cy}) scale(.8)` }, s('rect', { x: -16, y: -40, width: 32, height: 80, rx: 8 }), s('rect', { class: 'innen', x: -9, y: -30, width: 18, height: 60, rx: 5 })));
        if (ver && !fertig) {
          const x = XB + Math.min(L, W) * BW + BW * 0.5;
          svg.append(s('line', { class: 'stab-zeilenende', x1: x, y1: cy - R - 8, x2: x, y2: cy + R + 8 }), s('text', { class: 'stab-zeilenende-text', x, y: cy - R - 14 }, 'Zeilenende'));
        }
        // Streifen (abgewickeltes bzw. loses Band) darunter
        const zellen = ver ? (fertig ? n : u * L) : Math.min(Math.max(n + 1, u), u * STAB.maxWindungen * 2);
        // schmale Bildschirme (Werkstatt: eigene Anordnung): weniger Felder je Streifenzeile, dafür größer
        const pixel = svg.getBoundingClientRect().width;
        const schmal = pixel > 0 && pixel < 640;
        svg.classList.toggle('schmal', schmal);
        const proZeileMax = schmal ? 10 : 28;
        const proZeile = Math.max(u, proZeileMax - Krypto.mod(proZeileMax, u)); // ganze Runden je Streifenzeile
        const sichtbar = Math.min(proZeile, Math.max(zellen, 1));
        const sw = Math.min(schmal ? 96 : 44, 920 / sichtbar);
        const ch = schmal ? 84 : 42;
        const x0 = (STAB.breite - sichtbar * sw) / 2;
        const oben = cy + stabRadius(10) + 64;
        const streifenPos = (i) => {
          const zeile = Math.floor(i / proZeile);
          const spalte = i - zeile * proZeile;
          const m = Math.min(schmal ? 2.4 : 1, sw / 40);
          return { x: x0 + spalte * sw + sw / 2, y: oben + zeile * (ch + 30) + ch / 2, sx: m, sy: m, o: 1 };
        };
        const zeilenStreifen = Math.ceil(Math.max(zellen, 1) / proZeile);
        const streifen = s('g', { class: 'stab-streifen' }, s('text', { class: 'stab-streifen-titel', x: x0, y: oben - 14 }, ver ? 'Abgewickeltes Band (Geheimtext)' : 'Loses Band (Geheimtext stempeln)'));
        const runden = [];
        const anzahlRunden = Math.ceil(zellen / u);
        for (let c = 0; c < anzahlRunden; c++) {
          const p = streifenPos(c * u);
          const x = p.x - sw / 2;
          const y = p.y - ch / 2;
          const cnt = Math.min(u, zellen - c * u);
          const da = ver ? fertig : !fertig && c * u < n;
          const g = s('g', { class: 'stab-runde', 'data-runde': String(c + 1) }, s('rect', { class: 'stab-runde-leer', x, y, width: cnt * sw, height: ch, rx: 3 }));
          const voll = s('g', { class: 'stab-runde-band', opacity: da ? 1 : 0 }, s('rect', { class: 'stab-runde-grund', x, y, width: cnt * sw, height: ch, rx: 3 }));
          for (let q = 1; q < cnt; q++) voll.appendChild(s('line', { class: 'stab-runde-zelle', x1: x + q * sw, y1: y + 3, x2: x + q * sw, y2: y + ch - 3 }));
          g.append(voll, s('text', { class: 'stab-runde-text', x: x + (cnt * sw) / 2, y: y + ch + (schmal ? 30 : 17) }, cnt * sw >= 80 ? `Runde ${c + 1}` : String(c + 1)));
          runden.push({ g, voll });
          streifen.appendChild(g);
        }
        svg.appendChild(streifen);
        svg.setAttribute('viewBox', `0 0 ${STAB.breite} ${Math.round(oben + zeilenStreifen * (ch + 30) + 8)}`);
        // Buchstaben
        const stabPos = (rz, c) => {
          const f = -A + ((rz + 0.5) * 2 * A) / u;
          const t = (rz + 0.5) / u;
          const cf = Math.cos(f);
          const fs = Math.min(30, BW * 0.6, ((2 * A) / u) * R * 0.8);
          return { x: XB + (c + 0.5) * BW + t * BW, y: cy + R * Math.sin(f), sx: fs / STAB.schrift, sy: (fs / STAB.schrift) * (0.35 + 0.65 * cf), o: 0.75 + 0.25 * cf };
        };
        const buchstaben = [];
        for (let i = 0; i < n; i++) {
          let rz;
          let c;
          let si;
          if (ver) {
            rz = Math.floor(i / L);
            c = i - rz * L;
            si = c * u + rz;
          } else {
            c = Math.floor(i / u);
            rz = i - c * u;
            si = i;
          }
          const fuell = ver && fertig && i >= fuellAb;
          const el = s('text', { class: `stab-buchstabe${fuell ? ' fuell' : ''}`, 'font-size': STAB.schrift, 'data-zeile': String(rz), 'data-windung': String(c) }, zeichen[i]);
          const stab = c < W ? stabPos(rz, c) : null;
          const ziel = streifenPos(si);
          const aufDemStab = (ver ? !fertig : fertig) && stab;
          lege(el, aufDemStab ? stab : ziel);
          if (sichtbarBis !== null && i > sichtbarBis) el.setAttribute('opacity', '0');
          buchstaben.push({ el, stab: stab || ziel, streifen: ziel, r: rz, c, i });
          svg.appendChild(el);
        }
        // nächstes Feld
        if (ver && !fertig && roh.length < u * L && roh.length < MAX_TEXT) {
          const rz = Math.floor(roh.length / L);
          const c = roh.length - rz * L;
          if (c < W) {
            const p = stabPos(rz, c);
            svg.appendChild(s('rect', { class: 'stab-naechst', x: p.x - BW * 0.36, y: p.y - p.sy * STAB.schrift * 0.75, width: BW * 0.72, height: p.sy * STAB.schrift * 1.5, rx: 4 }));
          }
        }
        if (L > W) svg.appendChild(s('text', { class: 'stab-mehr', x: XR - 10, y: cy + R + 26 }, `… ${L - W} weitere Runden (siehe Raster)`));
        svg.setAttribute('aria-label', `Holzstab mit Umfang ${u}: ${roh.length ? (ver ? (fertig ? `Band abgewickelt, Geheimtext ${Krypto.gruppieren(zeichen)}` : `${roh.length} Buchstaben entlang des Stabs`) : fertig ? 'Band aufgewickelt, entlang des Stabs gelesen' : `loses Band mit ${n} Buchstaben`) : 'noch leer'}`);
        bild = { buchstaben, windungen, runden, L, u };
        // Anleitung, Bänder, Knopf
        anleitung.texte(ver ? ['Stab wählen', 'Buchstaben stempeln', 'Band abwickeln'] : ['Stab wählen', 'Geheimtext stempeln', 'Aufwickeln und lesen']);
        anleitung.setze(fertig ? 2 : roh.length ? 1 : 0);
        abwickeln.textContent = ver ? 'Band abwickeln' : 'Aufwickeln und lesen';
        stempelTitel.textContent = ver ? 'Stempel: auf den Stab' : 'Stempel: auf das lose Band';
        for (const b of wahlKnoepfe) b.setAttribute('aria-pressed', String(Number(b.dataset.u) === u));
        baender.beschrifte(ver ? 'Klartext' : 'Geheimtext', ver ? 'Geheimtext' : 'Klartext', ver ? [false, true] : [true, false]);
        const ergebnis = fertig ? (ver ? z.ausgabe || '' : Krypto.klein(z.ausgabe || '')) : '';
        const oben2 = ver ? Krypto.klein(roh) : roh;
        const laenge = Math.max(oben2.length, ergebnis.length);
        baender.setze(Array.from({ length: laenge }, (_, i) => [oben2[i] || '', ergebnis[i] || '']));
      }

      /** Band abwickeln: Runde für Runde fliegen die Buchstaben vom Stab auf den Streifen (bei ruhig sofort). */
      function wickleAb() {
        if (gesperrt) return;
        const roh = Krypto.nurBuchstaben(z.text);
        if (!roh.length) {
          erklaerung.sage('Noch leer', 'Stempel zuerst deine Nachricht auf den Stab.');
          return;
        }
        if (phase === 'band') return;
        const alt = bild;
        phase = 'band';
        zeichneStab();
        const neu = bild;
        const meinLauf = lauf;
        const fehlt = neu.u * neu.L - roh.length;
        erklaerung.sage('Band abwickeln', `${fehlt ? `${fehlt > 1 ? `${fehlt} leere Felder bekommen` : 'Ein leeres Feld bekommt'} ein X, damit jede Runde gleich viele Buchstaben hat. ` : ''}Runde für Runde liegen die ${neu.u} Buchstaben einer Runde nun nebeneinander.`);
        if (AQ.ruhig()) return;
        // Ausgangslage: alle Buchstaben auf dem Stab (alte Lage), Bänder der Runden noch leer
        const vorher = neu.buchstaben.map((b) => (alt && alt.buchstaben[b.i] && b.i < Krypto.nurBuchstaben(z.text).length ? alt.buchstaben[b.i].stab : b.stab));
        neu.buchstaben.forEach((b, i) => lege(b.el, vorher[i]));
        neu.runden.forEach((x) => x.voll.setAttribute('opacity', '0'));
        neu.windungen.forEach((w, c) => w.setAttribute('opacity', c < neu.L ? '1' : '0'));
        let kette = Promise.resolve();
        for (let c = 0; c < neu.L; c++) {
          kette = kette.then(() => {
            if (meinLauf !== lauf) return null;
            const spalte = neu.buchstaben.filter((b) => b.c === c);
            return S.bewegung(700, (e) => {
              if (meinLauf !== lauf) return;
              neu.windungen[c] && neu.windungen[c].setAttribute('opacity', String(Math.max(0, 1 - e * 1.4)));
              if (neu.runden[c]) neu.runden[c].voll.setAttribute('opacity', String(Math.min(1, e * 1.6)));
              spalte.forEach((b) => lege(b.el, zwischen(vorher[b.i], b.streifen, e)));
            });
          });
        }
      }

      /** Entschlüsseln: loses Band aufwickeln, dann Zeile für Zeile entlang des Stabs lesen. */
      function wickleAufUndLies() {
        if (gesperrt) return;
        const roh = Krypto.nurBuchstaben(z.text);
        const u = z.umfang;
        if (!roh.length) {
          erklaerung.sage('Hinweis', 'Stempel zuerst den Geheimtext auf das lose Band.');
          return;
        }
        if (Krypto.mod(roh.length, u)) {
          erklaerung.sage('Band passt nicht', `${roh.length} Buchstaben ergeben keine vollen Runden mit je ${u}. Es fehlen Buchstaben oder der Stab passt nicht.`);
          return;
        }
        if (phase === 'gelesen') return;
        phase = 'gelesen';
        zeichneStab();
        const neu = bild;
        const meinLauf = lauf;
        erklaerung.sage('Aufgewickelt und gelesen', `Das Band liegt auf dem Stab. Entlang des Stabs gelesen: ${Krypto.klein(z.ausgabe || '')}.`);
        if (AQ.ruhig()) return;
        neu.buchstaben.forEach((b) => lege(b.el, b.streifen));
        neu.windungen.forEach((w) => w.setAttribute('opacity', '0'));
        let kette = Promise.resolve();
        for (let c = 0; c < neu.L; c++) {
          kette = kette.then(() => {
            if (meinLauf !== lauf) return null;
            const spalte = neu.buchstaben.filter((b) => b.c === c);
            return S.bewegung(600, (e) => {
              if (meinLauf !== lauf) return;
              if (neu.windungen[c]) neu.windungen[c].setAttribute('opacity', String(Math.min(1, e * 1.4)));
              if (neu.runden[c]) neu.runden[c].voll.setAttribute('opacity', String(Math.max(0, 1 - e * 1.4)));
              spalte.forEach((b) => lege(b.el, zwischen(b.streifen, b.stab, e)));
            });
          });
        }
      }

      /** Raster als Tabelle: Zeilenpfeile (Schreibrichtung), Spaltenpfeile (Leserichtung), Füllzeichen gekennzeichnet. */
      function rasterTabelle(raster, n, ver, zellen) {
        const spalten = raster[0].length;
        const kopfZellen = [];
        for (let j = 0; j < spalten; j++) kopfZellen.push(h('th', { scope: 'col' }, ver ? `↓ ${j + 1}` : `${j + 1}`));
        const zeilen = raster.map((zeile, i) =>
          h(
            'tr',
            null,
            h('th', { scope: 'row' }, ver ? `→ Zeile ${i + 1}` : `Zeile ${i + 1} →`),
            [...zeile].map((b, j) => {
              const idx = i * spalten + j;
              const fuell = ver && idx >= n;
              const td = h('td', { class: fuell ? 'fuell' : null, title: fuell ? 'Füllzeichen' : null, 'aria-label': fuell ? `${b}, Füllzeichen` : null, 'data-zeichen': ver ? Krypto.klein(b) : Krypto.klein(b) }, Krypto.klein(b));
              zellen.push({ td, i, j });
              return td;
            })
          )
        );
        return h(
          'div',
          { class: 'scroll-x' },
          h(
            'table',
            { class: 'skytale-raster labor-tabelle' },
            h('caption', null, ver ? `Raster u × s = ${raster.length} × ${spalten}: zeilenweise schreiben (→), spaltenweise lesen (↓)` : `Raster ${raster.length} × ${spalten}: Geheimtext spaltenweise eintragen, zeilenweise lesen (→)`),
            h('thead', null, h('tr', null, h('td', { class: 'ecke' }), kopfZellen)),
            h('tbody', null, zeilen)
          ),
          ver && n < raster.length * spalten ? h('p', { class: 'skytale-legende text-2' }, h('span', { class: 'fuell-muster', 'aria-hidden': 'true' }), ' X = Füllzeichen (schraffiert)') : null
        );
      }

      /** Schritte: Schreiben Zeichen für Zeichen, danach Lesen Spalte für Spalte (ent: Spalten schreiben, Zeilen lesen). */
      function skytaleSchritte(raster, ver) {
        const u = raster.length;
        const sp = raster[0].length;
        const schritte = [];
        const ordnung = [];
        if (ver) for (let i = 0; i < u; i++) for (let j = 0; j < sp; j++) ordnung.push([i, j]);
        else for (let j = 0; j < sp; j++) for (let i = 0; i < u; i++) ordnung.push([i, j]);
        ordnung.forEach(([i, j], n) => schritte.push({ text: `Schreiben: ${raster[i][j]} in Zeile ${i + 1}, Spalte ${j + 1}`, daten: { phase: 'schreiben', bis: n, ordnung } }));
        if (ver) for (let j = 0; j < sp; j++) schritte.push({ text: `Lesen: Spalte ${j + 1} von oben nach unten: ${raster.map((zeile) => zeile[j]).join('')}`, daten: { phase: 'lesen', spalte: j } });
        else for (let i = 0; i < u; i++) schritte.push({ text: `Lesen: Zeile ${i + 1}: ${Krypto.klein(raster[i])}`, daten: { phase: 'lesen', zeile: i } });
        return schritte;
      }

      function zeigeSchritt(zellen, d) {
        const geschrieben = new Set();
        if (d.phase === 'schreiben') for (let n = 0; n <= d.bis; n++) geschrieben.add(d.ordnung[n].join(','));
        for (const c of zellen) {
          const schon = d.phase === 'lesen' || geschrieben.has(`${c.i},${c.j}`);
          c.td.textContent = schon ? c.td.dataset.zeichen : '';
          c.td.classList.toggle('geschrieben', d.phase === 'schreiben' && schon);
          c.td.classList.toggle('gelesen', d.phase === 'lesen' && (d.spalte === c.j || d.zeile === c.i));
        }
      }

      function zeichne() {
        nk.schliesse();
        nk.setze(null);
        if (alle) alle.schliesse();
        alle = null;
        for (const el of [rasterOrt, meldung, pruef, nsOrt, alleOrt]) AQ.clear(el);
        sperre(false);
        const u = z.umfang;
        const ein = Krypto.nurBuchstaben(z.text);
        const ver = z.richtung === 'ver';
        if (erkenne('skytale', { texte: [z.text], schluessel: [`u=${u}`] }, meldung)) return;
        const erg = versuche(() => Krypto.skytale(z.text, u, z.richtung));
        let raster = null;
        if (erg.fehler) {
          setzeAusgabe(aus, '');
          const passt = !ver && ein.length > 0 && /Vielfaches/.test(erg.fehler);
          meldung.appendChild(B.hinweis('warnung', passt ? `Länge ${ein.length} passt nicht zu u = ${u} – ${erg.fehler}` : erg.fehler));
        } else if (ein.length) {
          setzeAusgabe(aus, erg.wert);
          raster = Krypto.skytaleRaster(ver ? z.text : erg.wert, u, { fuellzeichen: ver ? 'X' : null });
        } else setzeAusgabe(aus, '');
        const spalten = raster && raster.length ? raster[0].length : 0;
        const gesamt = raster ? raster.length * spalten : 0;
        info.textContent = `Entschlüsseln mit u entspricht Verschlüsseln mit s = n : u.${raster ? ` Hier: s = ${gesamt} : ${u} = ${spalten}.` : ''}`;
        const zellen = [];
        if (raster) {
          rasterOrt.appendChild(rasterTabelle(raster, ein.length, ver, zellen));
          pruef.appendChild(pruefZeile(ein, Krypto.nurBuchstaben(erg.wert)));
          nk.setze({
            titel: ver ? 'Schreiben und Lesen' : 'Geheimtext einschreiben und lesen',
            start: -1,
            schritte: skytaleSchritte(raster, ver),
            zeige: (st) => {
              zeigeSchritt(zellen, st.daten);
              // auch am Stab: Buchstaben erscheinen in der Schreibreihenfolge
              if (ver && st.daten.phase === 'schreiben' && phase === 'stab') zeichneStab(st.daten.bis);
            }
          });
        }
        zeichneStab();
        // alle Stäbe: abgefangener Geheimtext (Entschlüsseln: Eingabe, Verschlüsseln: eigene Ausgabe)
        const geheim = ver ? (erg.wert || '') : ein;
        if (geheim) {
          alle = KRLabor.alleSchluessel(alleOrt, {
            titel: 'Alle Stäbe u = 2 … 10',
            schluessel: [2, 3, 4, 5, 6, 7, 8, 9, 10],
            beschriftung: (x) => `u = ${x}`,
            probiere: (x) => Krypto.skytale(geheim, x, 'ent', { fuellzeichen: null }),
            zeichen: 20,
            eingabe: geheim
          });
        }
      }

      zeichne();
      erklaerung.sage('Bereit', z.richtung === 'ver' ? 'Wähle oben einen Stab. Dann stempel deine Nachricht auf das Band – der erste Stempel beginnt eine neue Nachricht.' : 'Wähle einen Stab und stempel den Geheimtext auf das lose Band. Dann wickle es auf und lies entlang des Stabs.');
      return {
        schliesse() {
          lauf += 1;
          nk.schliesse();
          if (alle) alle.schliesse();
        }
      };
    }

    /* ---------- Pflügen · Zusatz (Plan M10 Task 227, nach stationen/pfluegen.html) ---------- */

    function bauePfluegen() {
      let alle = null;
      let lauf = 0;
      let gepfluegt = false; // Pflugweg ganz gegangen (Bänder zeigen das Ergebnis)
      let gesperrt = false;
      const anleitung = S.anleitung(null, []);
      const erklaerung = S.erklaerung(null);
      const k = kopf(() => {
        gepfluegt = false;
        zeichne();
      });
      const breite = B.zahl({ beschriftung: 'Schlüssel: Zeilenlänge k (Spalten der Tabelle)', min: 2, max: 12, wert: z.k, beiWechsel: (x) => setzeK(x) });
      const stempelTitel = h('span', { class: 'stab-feldtitel' }, 'Stempel: in die Tabelle');
      const stempel = S.stempel(null, (b) => stempeln(b), { beschriftung: 'Stempelkasten' });
      const baender = S.baender({ beiAenderung: () => {} });
      const pfluegenKnopf = h('button', { type: 'button', class: 'knopf knopf-zweit pflug-pfluegen' }, 'Pflügen');
      pfluegenKnopf.addEventListener('click', () => pfluege());
      const rand = h('button', { type: 'button', class: 'pflug-rand', 'aria-label': 'Tabellenbreite k ändern: ziehen oder Pfeiltasten', title: 'Am Rand ziehen' }, h('span', { class: 'pflug-rand-griff', 'aria-hidden': 'true' }, '⋮'));
      const papier = h('div', { class: 'pflug-papier' });
      const aus = B.ausgabe({ beschriftung: 'Ergebnis', art: 'frei' });
      const meldung = h('div', { class: 'pflug-meldung' });
      const pruef = h('div');
      const nsOrt = h('div', { class: 'station-nachspiel-ort' });
      const nk = S.nachspielKnopf(nsOrt, { sperre: (an) => sperre(an), beiEnde: () => markiere(z.richtung === 'ver' ? (gepfluegt ? Infinity : 0) : Infinity), beiLeer: (t) => erklaerung.sage('Nachspielen', t) });
      const alleOrt = h('div');
      const alleDetails = B.details('Alle Zeilenlängen ausprobieren', [h('p', { class: 'text-2' }, 'Eve trägt den Geheimtext für k = 2 … 12 rückwärts entlang des Pflugwegs ein und liest zeilenweise. Welche Zeile ist lesbar? Das entscheidest du.'), alleOrt], { klasse: 'pflug-alle' });
      const mehr = S.mehr(null, 'Mehr ausprobieren', 'Probe, Angriff: alle Zeilenlängen', pruef, alleDetails);
      const soGehts = S.soGehts(null, ['Klartext zeilenweise in Zeilen der Länge k schreiben, die letzte Zeile mit X auffüllen.', 'Rechts beginnen: letzte Spalte von unten nach oben, die nächste von oben nach unten, immer abwechselnd.', 'Entschlüsseln: den Geheimtext auf demselben Weg eintragen und zeilenweise lesen.']);
      const hintergrund = S.hintergrund(null, [
        { titel: 'Schlüsselraum', zeilen: [['Schlüssel', 'Zeilenlänge k (und der Pflugweg)'], ['Möglichkeiten', 'wenige – nur Teiler der Textlänge passen'], ['Art', 'Transposition']] },
        { titel: 'Warum unsicher?', text: 'Die Buchstaben bleiben erhalten, nur ihre Plätze ändern sich. Eve probiert einfach alle Zeilenlängen aus.' },
        { titel: 'Zusatz', text: 'Das Pflügen steht nicht im Kerncurriculum. Es zeigt wie Skytale und Gartenzaun: Bei einer Transposition tauschen die Buchstaben nur ihre Plätze.' }
      ]);
      const buehne = h('div', { class: 'stab-buehne' }, anleitung.element, h('div', { class: 'pflug-bild scroll-x' }, h('p', { class: 'pflug-titel' }, 'Karopapier'), h('div', { class: 'pflug-tisch' }, papier, rand)), erklaerung.element);
      const tippen = B.details('Text eintippen (für längere Nachrichten)', k.text(), { klasse: 'stab-tippen' });
      const bedienung = h('div', { class: 'stab-bedienung' }, k.richtung(), breite.element, meldung, stempelTitel, stempel.element, baender.element, h('div', { class: 'knopf-reihe' }, pfluegenKnopf, nk.element), nsOrt, tippen);
      r.flaeche.append(h('div', { class: 'stab-station' }, buehne, bedienung), soGehts, mehr, hintergrund);
      KRStation.herkunft(r.flaeche);

      function setzeK(x) {
        if (gesperrt) return;
        const neu = Math.max(2, Math.min(12, x));
        breite.setze(neu);
        if (neu === z.k) return;
        z.k = neu;
        gepfluegt = false;
        zeichne();
        erklaerung.sage('Zeilenlänge', `Die Tabelle hat jetzt ${neu} Spalten.`);
      }
      // Rand ziehen (Zeiger) oder Pfeiltasten
      rand.addEventListener('keydown', (e) => {
        const d = { ArrowLeft: -1, ArrowRight: 1, ArrowDown: -1, ArrowUp: 1 }[e.key];
        if (!d) return;
        e.preventDefault();
        setzeK(z.k + d);
      });
      let zug = null;
      rand.addEventListener('pointerdown', (e) => {
        if (gesperrt) return;
        const zelle = papier.querySelector('td');
        const b = zelle ? zelle.getBoundingClientRect().width : 0;
        zug = { x: e.clientX, k: z.k, b: b > 0 ? b : 45 };
        if (rand.setPointerCapture) rand.setPointerCapture(e.pointerId);
      });
      rand.addEventListener('pointermove', (e) => {
        if (!zug) return;
        setzeK(zug.k + Math.round((e.clientX - zug.x) / zug.b));
      });
      const los = () => {
        zug = null;
      };
      rand.addEventListener('pointerup', los);
      rand.addEventListener('pointercancel', los);

      function stempeln(b) {
        if (gesperrt || Krypto.nurBuchstaben(z.text).length >= MAX_TEXT) return;
        if (gepfluegt || beispiel) z.text = '';
        beispiel = false;
        z.text = `${z.text}${z.richtung === 'ver' ? Krypto.klein(b) : b}`;
        gepfluegt = false;
        k.setze(z.text);
        zeichne();
        const n = Krypto.nurBuchstaben(z.text).length;
        erklaerung.sage(`Zeile ${Math.floor((n - 1) / z.k) + 1}`, z.richtung === 'ver' ? 'Zeile für Zeile von links nach rechts – wie beim Schreiben.' : 'Der Geheimtext wird entlang des Pflugwegs eingetragen.');
      }

      function sperre(an) {
        gesperrt = an;
        k.sperre(an);
        breite.sperre(an);
        stempel.setze(!an);
        pfluegenKnopf.disabled = an;
        rand.disabled = an;
        S.sperre(r.flaeche, an);
      }

      let zellen = []; // { td, z, s, nr }
      function tabelle(raster, nummern, n, ver) {
        const kk = z.k;
        const pfeile = [];
        for (let sp = 0; sp < kk; sp++) {
          const vonRechts = kk - 1 - sp;
          pfeile.push(h('th', { scope: 'col', class: 'pflug-pfeil', 'aria-label': `Spalte ${sp + 1}: ${Krypto.mod(vonRechts, 2) === 0 ? 'von unten nach oben' : 'von oben nach unten'}` }, Krypto.mod(vonRechts, 2) === 0 ? '↑' : '↓'));
        }
        zellen = [];
        const zeilen = raster.map((zeile, zi) =>
          h(
            'tr',
            null,
            h('th', { scope: 'row' }, `Z${zi + 1}`),
            [...zeile].map((b, sp) => {
              const nr = nummern[zi][sp];
              const fuell = ver && zi * kk + sp >= n;
              const td = h('td', { class: fuell ? 'fuell' : null, 'data-lesen': String(nr), title: fuell ? 'Füllzeichen' : null }, h('span', { class: 'pflug-zeichen' }, b ? Krypto.klein(b) : ''), h('span', { class: 'pflug-nr', 'aria-hidden': 'true' }, ''));
              zellen.push({ td, z: zi, s: sp, nr });
              return td;
            })
          )
        );
        return h(
          'table',
          { class: 'pflug-tabelle' },
          h('caption', { class: 'sr' }, `Tabelle mit ${kk} Spalten: zeilenweise schreiben, dann von rechts spaltenweise pflügen (rechts von unten nach oben, dann abwechselnd)`),
          h('thead', null, h('tr', null, h('td', { class: 'ecke' }), Array.from({ length: kk }, (_, i) => h('th', { scope: 'col' }, String(i + 1)))), h('tr', { class: 'pflug-weg' }, h('td', { class: 'ecke' }), pfeile)),
          h('tbody', null, zeilen)
        );
      }
      /** Zellen bis zur Lesenummer bis als gepflügt markieren (Nummer sichtbar) */
      function markiere(bis) {
        for (const c of zellen) {
          const an = c.nr <= bis;
          c.td.classList.toggle('gepfluegt', an);
          c.td.lastChild.textContent = an ? String(c.nr) : '';
        }
      }

      function zeichne() {
        lauf += 1;
        nk.schliesse();
        nk.setze(null);
        if (alle) alle.schliesse();
        alle = null;
        for (const el of [papier, meldung, pruef, nsOrt, alleOrt]) AQ.clear(el);
        sperre(false);
        const kk = z.k;
        const ver = z.richtung === 'ver';
        const ein = Krypto.nurBuchstaben(z.text);
        if (erkenne('pfluegen', { texte: [z.text], schluessel: [`k=${kk}`] }, meldung)) return;
        const erg = versuche(() => Krypto.pfluegen(z.text, kk, z.richtung));
        if (erg.fehler) {
          setzeAusgabe(aus, '');
          meldung.appendChild(B.hinweis('warnung', ein.length ? `Länge ${ein.length} passt nicht zu k = ${kk} – ${erg.fehler}` : erg.fehler));
        } else setzeAusgabe(aus, ein.length ? erg.wert : '');
        // Tabelle: ver – Klartext zeilenweise (aufgefüllt); ent – Geheimtext entlang des Pflugwegs eingetragen
        const zeilenZahl = Math.max(1, Math.ceil(Math.max(ein.length, 1) / kk));
        const nummern = Krypto.pfluegenReihenfolge(zeilenZahl, kk);
        let raster;
        if (ver) {
          const gefuellt = ein.length && !erg.fehler ? Krypto.pfluegen(erg.wert, kk, 'ent') : '';
          raster = Array.from({ length: zeilenZahl }, (_, zi) => Array.from({ length: kk }, (_, sp) => (gefuellt ? gefuellt[zi * kk + sp] : ein[zi * kk + sp] || '')).join('|'));
        } else {
          raster = Array.from({ length: zeilenZahl }, (_, zi) => Array.from({ length: kk }, (_, sp) => ein[nummern[zi][sp] - 1] || '').join('|'));
        }
        raster = raster.map((x) => x.split('|'));
        papier.appendChild(tabelle(raster, nummern, ein.length, ver));
        markiere(ver ? (gepfluegt ? Infinity : 0) : ein.length);
        if (ein.length && !erg.fehler) {
          pruef.appendChild(pruefZeile(ein, Krypto.nurBuchstaben(erg.wert)));
          const schritte = [];
          for (let j = 0; j < kk; j++) {
            const spalte = kk - 1 - j;
            const nrs = zellen.filter((c) => c.s === spalte).sort((a, b) => a.nr - b.nr);
            const folge = nrs.map((c) => raster[c.z][c.s]).join('');
            schritte.push({ text: `Spalte ${spalte + 1} ${Krypto.mod(j, 2) === 0 ? 'von unten nach oben' : 'von oben nach unten'}: ${ver ? folge : Krypto.klein(folge)}`, daten: { bis: nrs[nrs.length - 1].nr } });
          }
          nk.setze({ titel: ver ? 'Spalte für Spalte pflügen' : 'Entlang des Pflugwegs eintragen', start: -1, schritte, zeige: (st) => markiere(st.daten.bis) });
        }
        // Bänder und Anleitung
        anleitung.texte(ver ? ['Tabellenbreite ziehen', 'Buchstaben stempeln', 'Pflügen'] : ['Tabellenbreite ziehen', 'Geheimtext stempeln', 'Zeilenweise lesen']);
        anleitung.setze(gepfluegt ? 2 : ein.length ? 1 : 0);
        stempelTitel.textContent = ver ? 'Stempel: in die Tabelle' : 'Stempel: entlang des Pflugwegs';
        pfluegenKnopf.textContent = ver ? 'Pflügen' : 'Zeilenweise lesen';
        baender.beschrifte(ver ? 'Klartext' : 'Geheimtext', ver ? 'Geheimtext' : 'Klartext', ver ? [false, true] : [true, false]);
        zeigeBaender(gepfluegt ? Infinity : 0);
        // alle Zeilenlängen (abgefangener Geheimtext)
        const geheim = ver ? (erg.wert || '') : ein;
        if (geheim) {
          alle = KRLabor.alleSchluessel(alleOrt, {
            titel: 'Alle Zeilenlängen k = 2 … 12',
            schluessel: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
            beschriftung: (x) => `k = ${x}`,
            probiere: (x) => Krypto.pfluegen(geheim, x, 'ent'),
            zeichen: 20,
            eingabe: geheim
          });
        }
      }
      /** Bänder: oben die Eingabe, unten das Ergebnis bis zur Lesenummer bis */
      function zeigeBaender(bis) {
        const ein = Krypto.nurBuchstaben(z.text);
        const ver = z.richtung === 'ver';
        const oben = ver ? Krypto.klein(ein) : ein;
        const ergebnis = z.ausgabe ? (ver ? z.ausgabe : Krypto.klein(z.ausgabe)) : '';
        const unten = ergebnis.slice(0, Math.min(ergebnis.length, bis));
        baender.setze(Array.from({ length: Math.max(oben.length, unten.length) }, (_, i) => [oben[i] || '', unten[i] || '']));
      }

      /** Pflügen (ver) bzw. zeilenweise lesen (ent): Spalte für Spalte bzw. Zeile für Zeile, bei ruhig sofort fertig. */
      function pfluege() {
        if (gesperrt) return;
        const ein = Krypto.nurBuchstaben(z.text);
        if (!ein.length) {
          erklaerung.sage('Noch leer', z.richtung === 'ver' ? 'Stempel zuerst deine Nachricht in die Tabelle.' : 'Stempel zuerst den Geheimtext entlang des Pflugwegs.');
          return;
        }
        if (!z.ausgabe) {
          erklaerung.sage('Tabelle passt nicht', `${ein.length} Buchstaben füllen keine Tabelle mit ${z.k} Spalten.`);
          return;
        }
        gepfluegt = true;
        const ver = z.richtung === 'ver';
        const gesamt = z.ausgabe.length;
        const hoehe = gesamt / z.k;
        anleitung.setze(2);
        erklaerung.sage(ver ? 'Pflügen' : 'Lesen', ver ? `Rechts beginnen: letzte Spalte von unten nach oben, dann abwechselnd. Geheimtext: ${Krypto.gruppieren(z.ausgabe)}.` : `Zeile für Zeile gelesen: ${Krypto.klein(z.ausgabe)}.`);
        if (AQ.ruhig()) {
          markiere(Infinity);
          zeigeBaender(Infinity);
          return;
        }
        lauf += 1;
        const meinLauf = lauf;
        const schritte = ver ? z.k : hoehe;
        const je = ver ? hoehe : z.k;
        let kette = Promise.resolve();
        for (let i = 0; i < schritte; i++) {
          kette = kette.then(() =>
            meinLauf !== lauf
              ? null
              : S.bewegung(450, (e) => {
                  if (meinLauf !== lauf) return;
                  const bis = i * je + Math.round(e * je);
                  if (ver) markiere(bis);
                  zeigeBaender(bis);
                })
          );
        }
      }

      zeichne();
      erklaerung.sage('Bereit', 'Zieh den Rand auf die gewünschte Breite. Dann stempel deine Nachricht in die Tabelle und pflüge.');
      return {
        schliesse() {
          lauf += 1;
          nk.schliesse();
          if (alle) alle.schliesse();
        }
      };
    }

    /* ---------- Gartenzaun ---------- */

    function baueZaun() {
      let ns = null;
      const k = kopf(zeichne);
      const schienen = B.zahl({ beschriftung: 'Schienen n', min: 2, max: 8, wert: z.zeilen, beiWechsel: (n) => { z.zeilen = n; zeichne(); } });
      const zaunOrt = h('div');
      const plaetze = h('p', { class: 'zaun-plaetze' });
      const aus = B.ausgabe({ beschriftung: 'Ergebnis', art: 'frei' });
      const pruef = h('div');
      const nsOrt = h('div');
      r.flaeche.append(k.element, h('div', { class: 'labor-steuer' }, schienen.element), zaunOrt, plaetze, aus.element, pruef, nsOrt);
      function sperre(an) {
        k.sperre(an);
        schienen.sperre(an);
      }
      function zeichne() {
        if (ns) ns.schliesse();
        ns = null;
        for (const el of [zaunOrt, pruef, nsOrt]) AQ.clear(el);
        const ver = z.richtung === 'ver';
        const ein = Krypto.nurBuchstaben(z.text);
        if (erkenne('gartenzaun', { texte: [z.text], schluessel: [`n=${z.zeilen}`] }, zaunOrt)) {
          setzeAusgabe(aus, '');
          return;
        }
        const erg = versuche(() => Krypto.gartenzaun(z.text, z.zeilen, z.richtung));
        setzeAusgabe(aus, erg.wert || '');
        if (erg.fehler) zaunOrt.appendChild(B.hinweis('warnung', erg.fehler));
        const klar = ver ? ein : Krypto.nurBuchstaben(erg.wert || '');
        const muster = Krypto.gartenzaunSchienen(klar.length, z.zeilen);
        const anzahl = [];
        for (let i = 0; i < z.zeilen; i++) anzahl.push(muster.filter((x) => x === i).length);
        plaetze.textContent = `Plätze je Schiene: ${anzahl.join(' · ')}`;
        if (!klar.length) return;
        const zellen = [];
        const kopfZ = [...klar].map((_, p) => h('th', { scope: 'col' }, String(p)));
        const zeilen = [];
        for (let i = 0; i < z.zeilen; i++) {
          zeilen.push(
            h(
              'tr',
              { class: `schiene schiene-${i + 1}` },
              h('th', { scope: 'row' }, `Schiene ${i + 1}`),
              [...klar].map((b, p) => {
                if (muster[p] !== i) return h('td', { class: 'zaun-leer' });
                const td = h('td', { class: `besetzt schiene-${i + 1}`, 'data-position': String(p), 'data-schiene': String(i), 'data-zeichen': Krypto.klein(b) }, Krypto.klein(b));
                zellen.push({ td, p, i });
                return td;
              })
            )
          );
        }
        zaunOrt.appendChild(
          h(
            'div',
            { class: 'scroll-x' },
            h('table', { class: 'zaun labor-tabelle' }, h('caption', null, `Zickzack über ${z.zeilen} Schienen (Positionen ab 0); gelesen wird Schiene für Schiene`), h('thead', null, h('tr', null, h('td', { class: 'ecke' }), kopfZ)), h('tbody', null, zeilen))
          )
        );
        pruef.appendChild(pruefZeile(ein, Krypto.nurBuchstaben(erg.wert || '')));
        const schritte = zellen
          .slice()
          .sort((a, b) => a.p - b.p)
          .map((c) => ({ text: `Zickzack: ${c.td.dataset.zeichen} an Position ${c.p} auf Schiene ${c.i + 1}`, daten: { phase: 'schreiben', bis: c.p } }));
        for (let i = 0; i < z.zeilen; i++) {
          const folge = zellen.filter((c) => c.i === i).map((c) => c.td.dataset.zeichen).join('');
          schritte.push({ text: `Schiene ${i + 1} lesen: ${Krypto.gruppieren(Krypto.nurBuchstaben(folge)) || '–'}`, daten: { phase: 'lesen', schiene: i } });
        }
        ns = KRLabor.nachspiel(nsOrt, {
          titel: 'Zickzack schreiben, Schienen lesen',
          start: -1,
          schritte,
          beiLauf: sperre,
          zeige(st) {
            const d = st.daten;
            for (const c of zellen) {
              const schon = d.phase === 'lesen' || c.p <= d.bis;
              c.td.textContent = schon ? c.td.dataset.zeichen : '';
              c.td.classList.toggle('geschrieben', d.phase === 'schreiben' && schon);
              c.td.classList.toggle('gelesen', d.phase === 'lesen' && c.i === d.schiene);
            }
          }
        });
      }
      zeichne();
      return { schliesse: () => ns && ns.schliesse() };
    }

    /* ---------- Fleißner-Schablone als Karton (Plan M6 Task 112, Plan M10 Task 228 nach stationen/schablone.html) ---------- */

    function baueFleissner() {
      let meldung = '';
      let lochungAnsicht = false; // „Lochung ändern“: Lage-Ziffern und doppelt freie Felder
      let abgehoben = false; // Karton abgehoben: das ganze Raster ist zu sehen
      let gesperrt = false;
      const g = z.groesse;
      const anzahlLoecher = (g * g) / 4;
      const gruppen = Krypto.fleissnerDrehgruppen(g);
      const symbol = (x) => (g === 4 ? SYMBOL[x] : String(x + 1));
      const anleitung = S.anleitung(null, []);
      const erklaerung = S.erklaerung(null);
      const k = kopf(() => {
        abgehoben = false;
        z.stellung = 1;
        zeichne();
      });
      const knoepfe = [];
      const zeilen = [];
      for (let zz = 1; zz <= g; zz++) {
        const tds = [];
        for (let ss = 1; ss <= g; ss++) {
          const gr = gruppen[zz - 1][ss - 1];
          const b = h('button', { type: 'button', class: 'fleissner-loch karton-feld', 'data-z': String(zz), 'data-s': String(ss), 'data-gruppe': String(gr), tabindex: zz === 1 && ss === 1 ? '0' : '-1' },
            h('span', { class: 'loch-symbol', 'aria-hidden': 'true' }, symbol(gr)),
            h('span', { class: 'loch-zeichen' }),
            h('span', { class: 'loch-nr' }),
            h('span', { class: 'karton-lagen', 'aria-hidden': 'true' }),
            h('span', { class: 'karton-doppelt' })
          );
          knoepfe.push(b);
          tds.push(h('td', null, b));
        }
        zeilen.push(h('tr', null, h('th', { scope: 'row' }, String(zz)), tds));
      }
      const kopfSp = [];
      for (let ss = 1; ss <= g; ss++) kopfSp.push(h('th', { scope: 'col' }, String(ss)));
      const legendeSymbole = g === 4 ? '● ▲ ■ ◆' : '1 … 9';
      const tabelle = h('table', { class: `fleissner-schablone karton-groesse-${g}` }, h('caption', null, `Schablone ${g} × ${g} (Zeile, Spalte ab 1): Felder antippen stanzt oder klebt Löcher; Zeichen ${legendeSymbole} = Drehgruppen`), h('thead', null, h('tr', null, h('td', { class: 'ecke' }), kopfSp)), h('tbody', null, zeilen));
      const oben = h('span', { class: 'karton-oben', 'aria-hidden': 'true' }, '▲ OBEN');
      const flaeche = h('div', { class: 'schablone-flaeche karton' }, oben, tabelle, h('span', { class: 'karton-praegung', 'aria-hidden': 'true' }, 'Fleißner 1881'));
      const stellungText = h('p', { class: 'schablone-stellung', 'aria-live': 'polite' });
      const drehen = h('button', { type: 'button', class: 'knopf knopf-zweit drehen' }, '↻ 90° im Uhrzeigersinn drehen');
      const abheben = h('button', { type: 'button', class: 'knopf knopf-zweit karton-abheben' }, 'Abheben & ablesen');
      const pruefung = h('div', { class: 'schablone-pruefung', role: 'status' });
      const legende = h('p', { class: 'text-2 schablone-legende' }, `Drehgruppen: ${legendeSymbole} – aus jeder Gruppe genau ein Loch. Taste r dreht die Schablone.`);
      const groesseKnoepfe = [4, 6].map((n) => h('button', { type: 'button', role: 'radio', 'data-groesse': String(n), 'aria-checked': String(n === g), tabindex: n === g ? '0' : '-1' }, n === 4 ? '4 × 4' : '6 × 6 · Zusatz'));
      const groesseWahl = h('div', { class: 'karton-groesse labor-basis', role: 'radiogroup', 'aria-label': 'Größe der Schablone' }, groesseKnoepfe);
      for (const b of groesseKnoepfe) {
        b.addEventListener('click', () => {
          const n = Number(b.dataset.groesse);
          if (n === z.groesse || gesperrt) return;
          z.groesse = n;
          z.schablone = (n === 6 ? BEISPIEL.schablone6 : BEISPIEL.schablone).map((l) => l.slice());
          z.stellung = 1;
          baue('fleissner');
        });
      }
      const lochungKnopf = h('button', { type: 'button', class: 'knopf knopf-leise karton-lochung', 'aria-pressed': 'false' }, '✎ Lochung ändern');
      lochungKnopf.addEventListener('click', () => {
        lochungAnsicht = !lochungAnsicht;
        lochungKnopf.setAttribute('aria-pressed', String(lochungAnsicht));
        flaeche.classList.toggle('lochung', lochungAnsicht);
        zeigeRaster();
      });
      const stempelTitel = h('span', { class: 'stab-feldtitel' }, 'Stempel: in die Löcher');
      const stempel = S.stempel(null, (b) => stempeln(b), { beschriftung: 'Stempelkasten' });
      const baender = S.baender({ beiAenderung: () => {} });
      const aus = B.ausgabe({ beschriftung: 'Ergebnis (zeilenweise)', art: 'frei' });
      const pruef = h('div');
      const nsOrt = h('div', { class: 'station-nachspiel-ort' });
      const nk = S.nachspielKnopf(nsOrt, {
        sperre: (an) => sperre(an),
        beiEnde: () => {
          aktuell = null;
          zeigeRaster();
        },
        beiLeer: (x) => erklaerung.sage('Nachspielen', x)
      });
      const mehr = S.mehr(null, 'Mehr ausprobieren', 'eigene Lochung, Größe, Probe', h('p', { class: 'text-2' }, 'Tippe Felder am Karton an: Loch stanzen oder zukleben. Mit „Lochung ändern“ zeigen Ziffern, in welcher Lage das Feld darunter frei ist; rot und „doppelt“ = in zwei Lagen frei.'), lochungKnopf, groesseWahl, legende, pruef);
      const soGehts = S.soGehts(null, ['Schablone mit „OBEN“ nach oben auflegen und in die Löcher zeilenweise schreiben.', 'Um 90° im Uhrzeigersinn drehen und weiterschreiben – vier Lagen, der Rest wird mit X gefüllt.', 'Abheben und das Raster zeilenweise lesen. Entschlüsseln: auflegen, ablesen, drehen.']);
      const hintergrund = S.hintergrund(null, [
        { titel: 'Schlüssel', zeilen: [['Schlüssel', `die Lochschablone (${anzahlLoecher} Löcher)`], ['Dazu', 'Startlage und Drehrichtung'], ['Anzahl Schablonen', `4^${anzahlLoecher} = ${Krypto.schluesselraum('fleissner', { groesse: g }).anzahl}`], ['Art', 'Transposition']] },
        { titel: 'Schwäche', text: 'Die Buchstaben ändern sich nicht. Wer die Schablone nachbaut, liest alles. Ein Computer probiert alle Schablonen schnell durch.' },
        { titel: 'Geschichte', text: 'Eduard Fleißner von Wostrowitz soll die Drehschablone 1881 beschrieben haben.' }
      ]);
      const buehne = h('div', { class: 'stab-buehne' }, anleitung.element, h('div', { class: 'schablone-bereich' }, flaeche), stellungText, pruefung, erklaerung.element);
      const schluessel = h('div', { class: 'karton-schluessel' }, h('span', { class: 'stab-feldtitel' }, 'Schlüssel: die Schablone'), h('p', { class: 'text-2' }, '„OBEN“ liegt oben, gedreht wird im Uhrzeigersinn.'));
      const tippen = B.details('Text eintippen (für längere Nachrichten)', k.text(), { klasse: 'stab-tippen' });
      const bedienung = h('div', { class: 'stab-bedienung' }, k.richtung(), schluessel, stempelTitel, stempel.element, baender.element, h('div', { class: 'knopf-reihe' }, drehen, abheben, nk.element), nsOrt, tippen);
      r.flaeche.append(h('div', { class: 'stab-station' }, buehne, bedienung), soGehts, mehr, hintergrund);
      KRStation.herkunft(r.flaeche);
      let aktuell = null; // Loch im Nachspiel

      const istLoch = (zz, ss) => z.schablone.some((l) => l[0] === zz && l[1] === ss);
      function dreheWeiter(animiert = true) {
        z.stellung = z.stellung === 4 ? 1 : z.stellung + 1;
        abgehoben = false;
        if (animiert && !ruhig) {
          flaeche.classList.add('dreht');
          const t = setTimeout(() => {
            timer.delete(t);
            flaeche.classList.remove('dreht');
          }, 400);
          timer.add(t);
        }
        zeigeRaster();
      }
      function tippe(b) {
        const zz = Number(b.dataset.z);
        const ss = Number(b.dataset.s);
        const gr = Number(b.dataset.gruppe);
        meldung = '';
        if (istLoch(zz, ss)) z.schablone = z.schablone.filter((l) => !(l[0] === zz && l[1] === ss));
        else if (z.schablone.length < anzahlLoecher) z.schablone = [...z.schablone, [zz, ss]];
        else {
          const inGruppe = z.schablone.filter((l) => gruppen[l[0] - 1][l[1] - 1] === gr);
          if (inGruppe.length === 1) {
            z.schablone = [...z.schablone.filter((l) => l !== inGruppe[0]), [zz, ss]];
            meldung = `Loch der Drehgruppe ${symbol(gr)} versetzt.`;
          } else meldung = `Höchstens ${anzahlLoecher} Löcher – erst ein Loch entfernen.`;
        }
        z.schablone.sort(zeilenweise);
        z.stellung = 1;
        abgehoben = false;
        zeichne();
      }
      knoepfe.forEach((b) => {
        b.addEventListener('click', () => tippe(b));
        b.addEventListener('keyup', (e) => {
          if (e.key === ' ') e.preventDefault();
        });
        b.addEventListener('keydown', (e) => {
          const zz = Number(b.dataset.z);
          const ss = Number(b.dataset.s);
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            if (!b.disabled) tippe(b);
            return;
          }
          if (e.key === 'r' || e.key === 'R') {
            e.preventDefault();
            if (!drehen.disabled) dreheWeiter();
            return;
          }
          const ziel = { ArrowRight: [zz, ss + 1], ArrowLeft: [zz, ss - 1], ArrowDown: [zz + 1, ss], ArrowUp: [zz - 1, ss], Home: [zz, 1], End: [zz, g] }[e.key];
          if (!ziel) return;
          e.preventDefault();
          const [nz, nsp] = [Math.max(1, Math.min(g, ziel[0])), Math.max(1, Math.min(g, ziel[1]))];
          const nb = knoepfe.find((x) => x.dataset.z === String(nz) && x.dataset.s === String(nsp));
          for (const x of knoepfe) x.setAttribute('tabindex', x === nb ? '0' : '-1');
          nb.focus();
        });
      });
      drehen.addEventListener('click', () => {
        if (gesperrt) return;
        dreheWeiter();
        erklaerung.sage(`Lage ${z.stellung}`, z.richtung === 'ver' ? 'Neue Felder sind frei. Stempel weiter.' : 'Lies die sichtbaren Buchstaben ab.');
      });
      abheben.addEventListener('click', () => {
        if (gesperrt) return;
        abgehoben = !abgehoben;
        zeigeRaster();
        zeigeBaender();
        erklaerung.sage(abgehoben ? 'Abgehoben' : 'Aufgelegt', abgehoben ? (z.richtung === 'ver' ? `Zeilenweise gelesen: ${Krypto.gruppieren(z.ausgabe || '')}. Leere Felder bekommen ein X.` : `Lage für Lage gelesen: ${Krypto.klein(z.ausgabe || '')}.`) : 'Die Schablone liegt wieder auf.');
      });

      /** Stempeln: verschlüsseln – in das nächste freie Loch (zeilenweise je Lage), volle Lage → weiterdrehen;
          entschlüsseln – Geheimtext zeilenweise ins Raster. */
      function stempeln(b) {
        if (gesperrt) return;
        const n0 = Krypto.nurBuchstaben(z.text).length;
        if (beispiel || abgehoben) {
          z.text = '';
          beispiel = false;
          abgehoben = false;
          z.stellung = 1;
        }
        const n = Krypto.nurBuchstaben(z.text).length;
        if (n >= MAX_TEXT || (n0 === n && n >= g * g * 4)) return;
        const ver = z.richtung === 'ver';
        if (ver) {
          const blockLage = Krypto.mod(Math.floor(n / anzahlLoecher), 4) + 1;
          if (blockLage !== z.stellung) {
            z.stellung = blockLage;
            if (!ruhig) {
              flaeche.classList.add('dreht');
              const t = setTimeout(() => {
                timer.delete(t);
                flaeche.classList.remove('dreht');
              }, 400);
              timer.add(t);
            }
          }
        }
        z.text = `${z.text}${ver ? Krypto.klein(b) : b}`;
        k.setze(z.text);
        zeichne();
        const m = n + 1;
        if (ver) {
          const imBlock = Krypto.mod(m, anzahlLoecher);
          erklaerung.sage(`Lage ${z.stellung}`, imBlock === 0 ? `Alle ${anzahlLoecher} Löcher dieser Lage sind beschrieben. Drehe die Schablone im Uhrzeigersinn – oder stempel einfach weiter.` : `${imBlock} von ${anzahlLoecher} Löchern beschrieben. Das leuchtende Loch kommt als Nächstes.`);
        } else erklaerung.sage(`${m} Buchstaben`, `Der Geheimtext steht zeilenweise im Raster. Lege die Schablone auf und lies Lage für Lage ab (${g * g} Felder je Block).`);
      }

      function sperre(an) {
        gesperrt = an;
        k.sperre(an);
        drehen.disabled = an;
        abheben.disabled = an;
        stempel.setze(!an);
        for (const b of knoepfe) b.disabled = an;
        for (const b of groesseKnoepfe) b.disabled = an;
        S.sperre(r.flaeche, an);
      }

      let raster = null; // Buchstaben je Feld (zeilenweise) des ersten Blocks
      let gueltig = false;
      function zeigeRaster() {
        const stellungen = Krypto.fleissnerStellungen(g, z.schablone);
        const offen = stellungen[z.stellung - 1].slice().sort(zeilenweise);
        const ver = z.richtung === 'ver';
        const n = Krypto.nurBuchstaben(z.text).length;
        // Schreibreihenfolge der Felder (Lage für Lage, je Lage zeilenweise) für die Anzeige beim Stempeln
        const reihenfolge = [];
        stellungen.forEach((liste) => liste.slice().sort(zeilenweise).forEach((l) => reihenfolge.push(l)));
        const nachIndex = new Map(reihenfolge.map((l, i) => [`${l[0]},${l[1]}`, i]));
        stellungText.textContent = abgehoben ? 'Schablone abgehoben' : `Lage ${z.stellung} von 4`;
        flaeche.dataset.lage = String(z.stellung);
        flaeche.classList.toggle('abgehoben', abgehoben);
        // Lage-Ziffern (Lochung ändern): in welchen Lagen ist das Feld frei?
        const lagenJe = new Map();
        stellungen.forEach((liste, i) => liste.forEach((l) => {
          const key = `${l[0]},${l[1]}`;
          lagenJe.set(key, [...(lagenJe.get(key) || []), i + 1]);
        }));
        for (const b of knoepfe) {
          const zz = Number(b.dataset.z);
          const ss = Number(b.dataset.s);
          const key = `${zz},${ss}`;
          const nr = offen.findIndex((l) => l[0] === zz && l[1] === ss);
          const loch = istLoch(zz, ss);
          const lagen = lagenJe.get(key) || [];
          const doppelt = lagen.length > 1;
          b.setAttribute('aria-pressed', String(loch));
          b.classList.toggle('frei', nr >= 0);
          b.classList.toggle('aktuell', !!aktuell && aktuell[0] === zz && aktuell[1] === ss);
          b.classList.toggle('doppelt', lochungAnsicht && doppelt);
          b.querySelector('.karton-lagen').textContent = lochungAnsicht ? lagen.join(' ') : '';
          b.querySelector('.karton-doppelt').textContent = lochungAnsicht && doppelt ? 'doppelt' : '';
          // Buchstabe im Feld: beim Verschlüsseln nur bereits gestempelte (und nach dem Abheben die Füll-X)
          let zeichen = raster ? raster[(zz - 1) * g + (ss - 1)] : '';
          if (zeichen && ver && !abgehoben && nachIndex.has(key) && nachIndex.get(key) >= n) zeichen = '';
          b.querySelector('.loch-zeichen').textContent = zeichen ? Krypto.klein(zeichen) : '';
          const naechst = ver && !abgehoben && nachIndex.get(key) === n && n < g * g;
          b.classList.toggle('naechst', naechst);
          b.querySelector('.loch-nr').textContent = nr >= 0 ? String(nr + 1) : '';
          b.setAttribute('aria-label', `Feld (${zz},${ss}), Drehgruppe ${symbol(Number(b.dataset.gruppe))}${loch ? ', Loch' : ''}${nr >= 0 ? `, in Lage ${z.stellung} frei als Nummer ${nr + 1}` : ''}${lochungAnsicht && lagen.length ? `, frei in Lage ${lagen.join(' und ')}${doppelt ? ', doppelt' : ''}` : ''}${zeichen ? `, Buchstabe ${Krypto.klein(zeichen)}` : ''}`);
        }
        anleitung.texte(ver ? ['Buchstaben in die Löcher stempeln', 'Schablone drehen', 'Abheben & ablesen'] : ['Geheimtext ins Raster stempeln', 'Schablone auflegen', 'Lage für Lage ablesen']);
        anleitung.setze(abgehoben ? 2 : z.stellung > 1 ? 1 : 0);
        stempelTitel.textContent = ver ? 'Stempel: in die Löcher' : 'Stempel: ins Raster (zeilenweise)';
        abheben.textContent = abgehoben ? 'Schablone auflegen' : ver ? 'Abheben & ablesen' : 'Lage für Lage ablesen';
      }
      function zeigeBaender() {
        const ver = z.richtung === 'ver';
        const ein = Krypto.nurBuchstaben(z.text);
        const oben = ver ? Krypto.klein(ein) : ein;
        const unten = abgehoben && z.ausgabe ? (ver ? z.ausgabe : Krypto.klein(z.ausgabe)) : '';
        baender.beschrifte(ver ? 'Klartext' : 'Geheimtext', ver ? 'Geheimtext' : 'Klartext', ver ? [false, true] : [true, false]);
        baender.setze(Array.from({ length: Math.max(oben.length, unten.length) }, (_, i) => [oben[i] || '', unten[i] || '']));
      }

      function zeichne() {
        nk.schliesse();
        nk.setze(null);
        aktuell = null;
        AQ.clear(pruef);
        AQ.clear(nsOrt);
        AQ.clear(pruefung);
        sperre(false);
        const felder = g * g;
        const p = Krypto.schablonePruefen(g, z.schablone);
        gueltig = p.ok;
        if (meldung) pruefung.appendChild(B.hinweis(/versetzt/.test(meldung) ? 'info' : 'warnung', meldung));
        if (p.ok) pruefung.appendChild(B.hinweis('ok', `Gültig: Jedes Feld wird genau einmal frei (${p.abgedeckt} von ${felder} Feldern).`));
        else if (z.schablone.length < anzahlLoecher) pruefung.appendChild(B.hinweis('info', `Noch ${anzahlLoecher - z.schablone.length} Loch/Löcher setzen – ${p.abgedeckt} von ${felder} Feldern werden frei.`));
        else pruefung.appendChild(B.hinweis('warnung', `${p.fehler.join(' ')} Nur ${p.abgedeckt} von ${felder} Feldern werden frei – ungültig.`));
        const ein = Krypto.nurBuchstaben(z.text);
        raster = null;
        if (gueltig && erkenne('fleissner', { texte: [z.text], schluessel: [lochSchluessel()] }, pruefung)) return;
        if (!gueltig) setzeAusgabe(aus, '');
        else {
          const erg = versuche(() => Krypto.fleissner(z.text, g, z.schablone, z.richtung));
          if (erg.fehler) {
            setzeAusgabe(aus, '');
            pruefung.appendChild(B.hinweis('warnung', erg.fehler));
          } else if (ein.length) {
            setzeAusgabe(aus, erg.wert);
            raster = (z.richtung === 'ver' ? erg.wert : ein).slice(0, felder);
            pruef.appendChild(pruefZeile(ein, Krypto.nurBuchstaben(erg.wert)));
            if (ein.length > felder) pruef.appendChild(h('p', { class: 'text-2' }, `Die Schablone zeigt den ersten Block (${felder} Felder); die Ausgabe gilt für den ganzen Text.`));
          } else setzeAusgabe(aus, '');
        }
        drehen.disabled = false;
        abheben.disabled = !raster;
        zeigeRaster();
        zeigeBaender();
        if (raster) {
          const stellungen = Krypto.fleissnerStellungen(g, z.schablone);
          const schritte = [];
          stellungen.forEach((liste, st) => {
            liste.slice().sort(zeilenweise).forEach(([zz, ss]) => {
              const b = raster[(zz - 1) * g + (ss - 1)];
              schritte.push({ text: `Lage ${st + 1}, Loch (${zz},${ss}): ${Krypto.klein(b)}`, daten: { stellung: st + 1, loch: [zz, ss] } });
            });
          });
          nk.setze({
            titel: 'Lage für Lage, Loch für Loch',
            start: -1,
            schritte,
            zeige(st, i, o) {
              const wechsel = st.daten.stellung !== z.stellung;
              z.stellung = st.daten.stellung;
              aktuell = st.daten.loch;
              abgehoben = false;
              if (wechsel && o.animiert) {
                flaeche.classList.add('dreht');
                const t = setTimeout(() => {
                  timer.delete(t);
                  flaeche.classList.remove('dreht');
                }, 400);
                timer.add(t);
              }
              zeigeRaster();
            }
          });
        }
      }
      zeichne();
      erklaerung.sage('Bereit', `Die Schablone liegt in Lage 1 auf dem Raster. Stempel deine Nachricht in die Löcher – nach ${anzahlLoecher} Buchstaben dreht sie weiter.`);
      return {
        schliesse: () => nk.schliesse(),
        gueltig: () => gueltig
      };
    }

    /* ---------- Ring (W6 §9.1, Plan M6 Task 113) ---------- */

    function baueRing() {
      let ns = null;
      const k = kopf(zeichne);
      const blockZahl = B.zahl({ beschriftung: 'Blocklänge n', min: 4, max: 12, wert: z.block, beiWechsel: (n) => { z.block = n; tZahl.grenzen(1, n - 1); z.t = tZahl.wert(); zeichne(); } });
      const tZahl = B.zahl({ beschriftung: 'Ringschritt t', min: 1, max: z.block - 1, wert: z.t, beiWechsel: (t) => { z.t = t; zeichne(); } });
      const ringOrt = h('div', { class: 'ring-ort' });
      const folgeOrt = h('div');
      const meldung = h('div', { class: 'ring-meldung' });
      const aus = B.ausgabe({ beschriftung: 'Ergebnis', art: 'frei' });
      const nsOrt = h('div');
      r.flaeche.append(k.element, h('div', { class: 'labor-steuer' }, blockZahl.element, tZahl.element), meldung, h('div', { class: 'ring-bereich' }, ringOrt, folgeOrt), aus.element, h('p', { class: 'text-2 ring-grenze' }, 'Gezeichnet ist der erste Block; die Ausgabe gilt für den ganzen Text. Ausprobieren musst du selbst – das Werkzeug sucht keinen Schlüssel.'), nsOrt);
      function sperre(an) {
        k.sperre(an);
        blockZahl.sperre(an);
        tZahl.sperre(an);
      }
      function zeichne() {
        if (ns) ns.schliesse();
        ns = null;
        for (const el of [ringOrt, folgeOrt, meldung, nsOrt]) AQ.clear(el);
        if (erkenne('ring', { texte: [z.text], schluessel: [`t=${z.t}`] }, meldung)) {
          setzeAusgabe(aus, '');
          return;
        }
        const n = z.block;
        const { folge, nieGelesen } = Krypto.ringFolge(n, z.t);
        const umkehrbar = nieGelesen.length === 0;
        const ver = z.richtung === 'ver';
        let erg = { wert: '' };
        if (!umkehrbar) meldung.appendChild(B.hinweis('warnung', `Nicht umkehrbar – t und n müssen teilerfremd sein (Felder ${nieGelesen.join(', ')} werden nie gelesen).`));
        else {
          erg = versuche(() => Krypto.ring(z.text, z.t, z.richtung, { block: n }));
          if (erg.fehler) meldung.appendChild(B.hinweis('warnung', erg.fehler));
        }
        setzeAusgabe(aus, erg.wert || '');
        const klar = ver ? Krypto.nurBuchstaben(z.text) : Krypto.nurBuchstaben(erg.wert || '');
        const feldZeichen = (f) => (klar[f] ? Krypto.klein(klar[f]) : '');
        // Kreis mit n Feldern, Sprungpfeilen und Nummern (Geometrie = Darstellung)
        const M = 150;
        const R = 110;
        const pos = (f) => {
          const b = ((f * 360) / n) * (Math.PI / 180);
          return [M + R * Math.sin(b), M - R * Math.cos(b)];
        };
        const pfeile = [];
        for (let i = 0; i + 1 < folge.length; i++) {
          const [x1, y1] = pos(folge[i]);
          const [x2, y2] = pos(folge[i + 1]);
          const lang = Math.hypot(x2 - x1, y2 - y1) || 1;
          const kx = ((x2 - x1) / lang) * 24;
          const ky = ((y2 - y1) / lang) * 24;
          pfeile.push(s('g', { class: 'ring-sprung', 'data-schritt': String(i + 1) },
            s('line', { x1: x1 + kx, y1: y1 + ky, x2: x2 - kx, y2: y2 - ky, 'marker-end': 'url(#ring-spitze)' }),
            s('text', { class: 'ring-sprung-nr', x: (x1 + x2) / 2, y: (y1 + y2) / 2, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, String(i + 1))
          ));
        }
        const felder = [];
        for (let f = 0; f < n; f++) {
          const [x, y] = pos(f);
          const nie = nieGelesen.includes(f);
          felder.push(s('g', { class: `feld${nie ? ' nie' : ''}`, 'data-feld': String(f) },
            s('circle', { cx: x, cy: y, r: 22 }),
            s('text', { class: 'feld-zeichen', x, y: y - 3, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, feldZeichen(f)),
            s('text', { class: 'feld-nr', x, y: y + 13, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, String(f)),
            nie ? s('line', { class: 'feld-strich', x1: x - 18, y1: y + 18, x2: x + 18, y2: y - 18 }) : null
          ));
        }
        const leseText = folge.join(', ');
        const svg = s('svg', { class: 'skytale-ring', viewBox: '0 0 300 300', width: 300, height: 300, role: 'img', 'aria-label': `Ring mit ${n} Feldern, Ringschritt ${z.t}: Lesereihenfolge ${leseText}${nieGelesen.length ? `; nie gelesen: Felder ${nieGelesen.join(', ')}` : ''}.` },
          s('defs', null, s('marker', { id: 'ring-spitze', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, s('path', { class: 'ring-spitze', d: 'M0 0 L10 5 L0 10 Z' }))),
          s('circle', { class: 'ring-kreis', cx: M, cy: M, r: R }),
          pfeile,
          felder
        );
        ringOrt.appendChild(h('div', { class: 'scroll-x' }, svg));
        folgeOrt.append(
          ...[
          h('p', { class: 'ring-folge-titel' }, 'Lesereihenfolge:'),
          h('ol', { class: 'ring-folge' }, folge.map((f) => h('li', { class: nieGelesen.length && folge.indexOf(f) !== folge.lastIndexOf(f) ? 'doppelt' : null }, String(f)))),
          nieGelesen.length ? h('p', { class: 'ring-nie' }, `Nie gelesen (durchgestrichen): Felder ${nieGelesen.join(', ')}`) : null
          ].filter(Boolean)
        );
        if (umkehrbar && !erg.fehler && klar.length) {
          ns = KRLabor.nachspiel(nsOrt, {
            titel: 'Sprung für Sprung',
            start: -1,
            beiLauf: sperre,
            schritte: folge.map((f, i) => ({ text: `Sprung ${i}: Feld ${f}: ${feldZeichen(f)}`, daten: { feld: f, schritt: i } })),
            zeige(st) {
              for (const g of felder) g.classList.toggle('aktuell', g.dataset.feld === String(st.daten.feld));
              for (const p of pfeile) p.classList.toggle('aktuell', Number(p.dataset.schritt) === st.daten.schritt);
            }
          });
        }
      }
      zeichne();
      return { schliesse: () => ns && ns.schliesse() };
    }

    /* ---------- Geführter Modus (M11 Task 244, E208): Raster in Aufgabengröße leer, Zielzelle markiert ---------- */

    const zelleText = (ver, b) => (ver ? Krypto.klein(b) : b);
    /** Schreib-Schritte: je Eingabebuchstabe die Zielzelle markieren, der Eintrag kommt hinein */
    function schreibHook(container, { eingabe, ver, zeilen, spalten, zelle, caption, zeilenKopf, spaltenKopf, text }) {
      const raster = KRGefuehrt.raster(container, { zeilen, spalten, caption, zeilenKopf, spaltenKopf });
      return {
        schritte: eingabe.map((b, i) => ({
          text: text ? text(b, i) : `${ver ? 'Klartextbuchstabe' : 'Geheimtextbuchstabe'} ${zelleText(ver, b)} (Nr. ${i + 1}): in die markierte Zelle`,
          feld: { beschriftung: 'Buchstabe in der markierten Zelle', art: 'buchstabe' }
        })),
        markiere(i, eintraege) {
          raster.leeren();
          eintraege.forEach((x, j) => {
            if (x) raster.eintrag(...zelle(j), zelleText(ver, x));
          });
          raster.markiere([zelle(i)]);
        },
        korrekt: () => eingabe.map((b) => zelleText(ver, b))
      };
    }
    function skytaleHook(container, werte) {
      const ver = werte.richtung !== 'ent';
      const u = ganz(werte.umfang, 2, 10, 3);
      const ein = [...Krypto.nurBuchstaben(String(werte.text || ''))].slice(0, MAX_TEXT);
      const s = Math.max(1, Math.ceil(ein.length / u));
      const eingabe = ver ? [...ein, ...Array(u * s - ein.length).fill('X')] : ein;
      const pos = (i) => Krypto.teileMitRest(i, ver ? s : u);
      return schreibHook(container, {
        eingabe,
        ver,
        zeilen: u,
        spalten: s,
        zelle: (i) => (ver ? [pos(i).q, pos(i).r] : [pos(i).r, pos(i).q]),
        caption: ver ? `Stab mit u = ${u}: Klartext zeilenweise schreiben (Füllzeichen X)` : `Stab mit u = ${u}: Geheimtext spaltenweise (Runde für Runde) eintragen`,
        zeilenKopf: (zz) => `Zeile ${zz + 1}`,
        spaltenKopf: (ss) => `Runde ${ss + 1}`
      });
    }
    function zaunHook(container, werte) {
      const ver = werte.richtung !== 'ent';
      const n = ganz(werte.zeilen, 2, 8, 3);
      const eingabe = [...Krypto.nurBuchstaben(String(werte.text || ''))].slice(0, MAX_TEXT);
      const muster = Krypto.gartenzaunSchienen(eingabe.length, n);
      // Zellen: verschlüsseln im Zickzack (Position p auf Schiene muster[p]); entschlüsseln Schiene für Schiene
      const zickzack = muster.map((sch, p) => [sch, p]);
      const reihe = zickzack.slice().sort(zeilenweise);
      return schreibHook(container, {
        eingabe,
        ver,
        zeilen: n,
        spalten: eingabe.length,
        zelle: (i) => (ver ? zickzack[i] : reihe[i]),
        caption: ver ? `Zickzack über ${n} Schienen (Positionen ab 0)` : `Geheimtext Schiene für Schiene eintragen (${n} Schienen, Positionen ab 0)`,
        zeilenKopf: (zz) => `Schiene ${zz + 1}`,
        spaltenKopf: (ss) => String(ss)
      });
    }
    function pfluegenHook(container, werte) {
      const ver = werte.richtung !== 'ent';
      const kk = ganz(werte.k, 2, 12, 5);
      const ein = [...Krypto.nurBuchstaben(String(werte.text || ''))].slice(0, MAX_TEXT);
      const zeilenZahl = Math.max(1, Math.ceil(ein.length / kk));
      const eingabe = ver ? [...ein, ...Array(zeilenZahl * kk - ein.length).fill('X')] : ein;
      const nummern = Krypto.pfluegenReihenfolge(zeilenZahl, kk);
      const weg = [];
      nummern.forEach((zeile, zi) => zeile.forEach((nr, sp) => (weg[nr - 1] = [zi, sp])));
      return schreibHook(container, {
        eingabe,
        ver,
        zeilen: zeilenZahl,
        spalten: kk,
        zelle: (i) => (ver ? [Krypto.teileMitRest(i, kk).q, Krypto.teileMitRest(i, kk).r] : weg[i]),
        caption: ver ? `Zeilen der Länge k = ${kk}: Klartext zeilenweise schreiben (Füllzeichen X)` : `Geheimtext entlang des Pflugwegs eintragen (k = ${kk})`,
        zeilenKopf: (zz) => `Zeile ${zz + 1}`,
        spaltenKopf: (ss) => `Spalte ${ss + 1}`
      });
    }
    function fleissnerHook(container, werte) {
      const ver = werte.richtung !== 'ent';
      const g = werte.groesse === 6 ? 6 : GROESSE;
      const loecher = lochListe(werte.schablone, g) || z.schablone.map((l) => l.slice());
      const lagen = Krypto.fleissnerStellungen(g, loecher).map((l) => l.slice().sort(zeilenweise));
      const reihenfolge = lagen.flat();
      const lageVon = (i) => Krypto.teileMitRest(i, loecher.length).q + 1;
      const ein = [...Krypto.nurBuchstaben(String(werte.text || ''))].slice(0, g * g);
      if (ver) {
        const eingabe = [...ein, ...Array(Math.max(0, g * g - ein.length)).fill('X')];
        return schreibHook(container, {
          eingabe,
          ver,
          zeilen: g,
          spalten: g,
          zelle: (i) => [reihenfolge[i][0] - 1, reihenfolge[i][1] - 1],
          caption: `Schablone ${g} × ${g}: Buchstaben durch die Löcher schreiben, nach jeder Lage 90° drehen`,
          text: (b, i) => `Lage ${lageVon(i)}: ${Krypto.klein(b)} (Nr. ${i + 1}) durch das markierte Loch`
        });
      }
      // Entschlüsseln: Geheimtext liegt zeilenweise im Raster, die Schablone zeigt Loch für Loch, was zu lesen ist
      const raster = KRGefuehrt.raster(container, { zeilen: g, spalten: g, caption: `Geheimtext im Raster ${g} × ${g}: unter dem markierten Loch lesen`, inhalt: (zz, ss) => ein[zz * g + ss] || '' });
      const band = KRGefuehrt.band(container, 'Dein Klartext');
      return {
        schritte: reihenfolge.map((l, i) => ({ text: `Lage ${lageVon(i)}, Loch (${l[0]},${l[1]})`, feld: { beschriftung: 'Buchstabe unter dem Loch', art: 'buchstabe' } })),
        markiere(i, eintraege) {
          raster.markiere([[reihenfolge[i][0] - 1, reihenfolge[i][1] - 1]]);
          band.setze(eintraege.map((x) => Krypto.klein(x)));
        },
        korrekt: () => reihenfolge.map((l) => Krypto.klein(ein[(l[0] - 1) * g + (l[1] - 1)] || ''))
      };
    }
    function ringHook(container, werte) {
      const ver = werte.richtung !== 'ent';
      const n = 8;
      const t = ganz(werte.t, 1, n - 1, 3);
      const ein = [...Krypto.nurBuchstaben(String(werte.text || ''))].slice(0, MAX_TEXT);
      const bloecke = Math.max(1, Math.ceil(ein.length / n));
      const eingabe = ver ? [...ein, ...Array(bloecke * n - ein.length).fill('X')] : ein;
      const folge = Krypto.ringFolge(n, t).folge;
      const ergebnis = eingabe.length ? Krypto.ring(eingabe.join(''), t, ver ? 'ver' : 'ent', { block: n }) : '';
      const leiste = !ver && eingabe.length ? KRGefuehrt.leiste(container, eingabe.join(''), { titel: 'Geheimtext (Positionen ab 0)' }) : null;
      const raster = KRGefuehrt.raster(container, { zeilen: bloecke, spalten: n, caption: `Ring mit ${n} Feldern, Ringschritt t = ${t} (Felder ab 0)`, zeilenKopf: (b) => `Block ${b + 1}`, spaltenKopf: (f) => `Feld ${f}`, inhalt: ver ? (b, f) => Krypto.klein(eingabe[b * n + f] || '') : null });
      const band = KRGefuehrt.band(container, ver ? 'Dein Geheimtext' : 'Dein Klartext');
      const reihe = (e) => e.slice(0, n).map((x) => Number(x));
      const schritte = [];
      for (let j = 0; j < n; j++) schritte.push({ text: j === 0 ? 'Lesereihenfolge: Start bei Feld 0' : `Lesereihenfolge Nr. ${j}: dein Feld davor + ${t} (rund um den Ring)`, feld: { beschriftung: `Feld Nr. ${j}`, art: 'zahl' } });
      eingabe.forEach((_, p) => schritte.push({
        text: ver ? `Buchstabe ${p + 1} des Geheimtexts: Feld aus deiner Lesereihenfolge` : `Klartext Block ${Krypto.teileMitRest(p, n).q + 1}, Feld ${Krypto.teileMitRest(p, n).r}`,
        feld: { beschriftung: ver ? 'Buchstabe im markierten Feld' : 'Geheimtextbuchstabe für das markierte Feld', art: 'buchstabe' }
      }));
      return {
        schritte,
        markiere(i, eintraege) {
          const r2 = reihe(eintraege);
          if (i < n) {
            const vorher = i > 0 && eintraege[i - 1] !== '' && Number.isInteger(r2[i - 1]) && r2[i - 1] >= 0 && r2[i - 1] < n ? r2[i - 1] : null;
            raster.markiere(i === 0 ? [[0, 0]] : vorher === null ? [] : [[0, vorher]]);
            if (leiste) leiste.markiere([]);
          } else {
            const p = i - n;
            const { q: b, r: f } = Krypto.teileMitRest(p, n);
            if (ver) {
              const feld = r2[f];
              raster.markiere(eintraege[f] !== '' && Number.isInteger(feld) && feld >= 0 && feld < n ? [[b, feld]] : []);
            } else {
              // Entschlüsseln: Zielfeld f; der Geheimtextbuchstabe dazu steht an der Stelle deiner Reihenfolge mit Feld f
              raster.markiere([[b, f]]);
              const j = r2.findIndex((x, jj) => eintraege[jj] !== '' && x === f);
              if (leiste) leiste.markiere(j >= 0 ? [b * n + j] : []);
            }
          }
          if (!ver) {
            raster.leeren();
            eintraege.slice(n).forEach((x, p) => {
              if (x) raster.eintrag(Krypto.teileMitRest(p, n).q, Krypto.teileMitRest(p, n).r, Krypto.klein(x));
            });
          }
          band.setze(eintraege.slice(n).map((x) => (ver ? x : Krypto.klein(x))));
        },
        korrekt: () => [...folge.map(String), ...[...ergebnis].map((x) => (ver ? x : Krypto.klein(x)))]
      };
    }
    const HOOKS = { skytale: skytaleHook, gartenzaun: zaunHook, pfluegen: pfluegenHook, fleissner: fleissnerHook, ring: ringHook };
    function starteGefuehrt(id, werte) {
      const wurzel = r.flaeche;
      const fokus = typeof document !== 'undefined' && document.activeElement && wurzel.contains(document.activeElement);
      if (teil && teil.schliesse) teil.schliesse();
      teil = null;
      for (const t of timer) clearTimeout(t);
      timer.clear();
      if (gefuehrt) gefuehrt.schliesse();
      AQ.clear(r.flaeche);
      gefuehrt = KRGefuehrt.starte(r.flaeche, HOOKS[id], {
        werte,
        umgebung,
        aufgabe: fuehrung && fuehrung.aufgabe ? fuehrung.aufgabe : null,
        titel: 'Skytale & Gitter',
        beiEigeneWerte: () => {
          if (erkVerlauf) erkVerlauf.leeren();
          fuehrung = null;
          z.text = '';
          beispiel = false;
          baue(id);
        },
        text: {
          beschriftung: werte.richtung === 'ent' ? 'Geheimtext' : 'Klartext',
          wert: werte.text || '',
          fokus,
          beiAenderung: (t) => {
            z.text = t;
            beispiel = false;
            baue(id);
            B.fokusAmEnde(r.flaeche);
          }
        }
      });
    }

    /* ---------- Reiterwechsel ---------- */

    function baue(id) {
      if (gefuehrt) {
        gefuehrt.schliesse();
        gefuehrt = null;
      }
      if (fuehrung && mitGefuehrt && HOOKS[id]) {
        const w = { text: z.text, umfang: z.umfang, zeilen: z.zeilen, k: z.k, t: z.t, schablone: z.schablone.map((l) => l.slice()), groesse: z.groesse, richtung: z.richtung, ...(fuehrung.werte || {}) };
        fuehrung = { aufgabe: fuehrung.aufgabe };
        starteGefuehrt(id, w);
        return;
      }
      if (teil && teil.schliesse) teil.schliesse();
      for (const t of timer) clearTimeout(t);
      timer.clear();
      AQ.clear(r.flaeche);
      if (id === 'gartenzaun') teil = baueZaun();
      else if (id === 'fleissner') teil = baueFleissner();
      else if (id === 'ring') teil = baueRing();
      else if (id === 'pfluegen') teil = bauePfluegen();
      else teil = baueSkytale();
    }
    baue(r.aktiv());

    return {
      schliesse() {
        if (teil && teil.schliesse) teil.schliesse();
        if (gefuehrt) gefuehrt.schliesse();
        gefuehrt = null;
        for (const t of timer) clearTimeout(t);
        timer.clear();
      },
      zustand() {
        const gueltig = Krypto.schablonePruefen(z.groesse, z.schablone).ok;
        return { reiter: r.aktiv(), groesse: z.groesse, richtung: z.richtung, text: z.text, eingabe: Krypto.nurBuchstaben(z.text), umfang: z.umfang, k: z.k, zeilen: z.zeilen, schablone: z.schablone.map((l) => l.slice()), stellung: z.stellung, block: z.block, t: z.t, gueltig, ausgabe: z.ausgabe };
      }
    };
  }

  KRLabor.registriere('skytale', { titel: 'Skytale & Gitter', oeffne });
})();
