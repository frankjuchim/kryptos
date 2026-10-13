/* Kryptos – Labor-Werkzeug „Skytale & Gitter“ (W0 §9.1, Plan M6 Task 112): Skytale (Stab, Raster, alle Stäbe),
   Gartenzaun (Zickzack, Schienen), Fleißner-Schablone (Löcher stanzen, Drehgruppen, drehen). Stab, Zaun und Schablone
   sind die Objekte; darunter steht das Raster als echte Tabelle. Rechnet nur über Krypto.*; speichert nichts. */
'use strict';
(() => {
  const { h, s } = AQ;
  const B = KRLaborBau;
  const BEISPIEL = { text: 'wachwechsel am suedturm', schablone: [[1, 1], [1, 3], [2, 4], [3, 2]] };
  const REITER_TITEL = { skytale: 'Skytale', gartenzaun: 'Gartenzaun', fleissner: 'Fleißner-Schablone', ring: 'Ring' };
  const SYMBOL = ['●', '▲', '■', '◆'];
  const GROESSE = 4;
  const MAX_TEXT = 120;

  const zeilenweise = (a, b) => a[0] - b[0] || a[1] - b[1];
  const ganz = (x, lo, hi, std) => (Number.isInteger(x) && x >= lo && x <= hi ? x : std);
  /** Gültige Lochliste aus der Voreinstellung (höchstens 4 verschiedene Felder 1–4), sonst null. */
  function lochListe(x) {
    if (!Array.isArray(x) || x.length > 4) return null;
    const ok = x.every((l) => Array.isArray(l) && l.length === 2 && l.every((n) => Number.isInteger(n) && n >= 1 && n <= GROESSE));
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
    const reiterListe = KRLabor.reiterFuer('skytale', v, umgebung).filter((r) => REITER_TITEL[r] && r !== 'ring');
    if (!reiterListe.length) reiterListe.push('skytale');
    const ruhig = AQ.ruhig();
    const z = {
      richtung: v.richtung === 'ent' ? 'ent' : 'ver',
      text: typeof v.text === 'string' ? v.text.slice(0, MAX_TEXT) : BEISPIEL.text,
      umfang: ganz(v.umfang, 2, 10, 3),
      zeilen: ganz(v.zeilen, 2, 8, 3),
      schablone: lochListe(v.schablone) || BEISPIEL.schablone.map((l) => l.slice()),
      stellung: 1,
      ausgabe: ''
    };
    let teil = null; // { schliesse(), zustand() } des aktiven Reiters
    const timer = new Set();

    const r = B.reiter(reiterListe.map((id) => ({ id, titel: REITER_TITEL[id] })), { aktiv: reiterListe[0], beiWechsel: baue });
    container.appendChild(h('div', { class: 'labor-werkzeug skytale-werkzeug' }, r.element));

    /* ---------- gemeinsame Teile ---------- */

    /** Eingabe + Richtung + normalisierte Anzeige; beiAenderung() nach jeder Änderung. */
    function kopf(beiAenderung) {
      const norm = h('p', { class: 'labor-normal text-2' });
      const feld = B.textfeld({ beschriftung: 'Text (bis 120 Zeichen)', max: MAX_TEXT, wert: z.text, art: z.richtung === 'ver' ? 'klartext' : 'geheimtext', beiEingabe: (t) => { z.text = t; zeigeNorm(); beiAenderung(); } });
      const ri = B.richtung({ wert: z.richtung, beiWechsel: (x) => { z.richtung = x; zeigeNorm(); beiAenderung(); } });
      function zeigeNorm() {
        const n = Krypto.nurBuchstaben(z.text);
        norm.textContent = n ? `Normalisiert: ${z.richtung === 'ver' ? Krypto.klein(n) : Krypto.gruppieren(n)}` : 'Normalisiert: –';
      }
      zeigeNorm();
      return {
        element: h('div', { class: 'labor-kopf' }, feld.element, norm, ri.element),
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
        gleich ? `Buchstaben unverändert: ✓${zusatz} – nur die Reihenfolge ändert sich (Transposition). Eine Häufigkeitsanalyse zeigt deshalb deutsche Häufigkeiten (Falle P6).` : 'Buchstaben unverändert: ✗'
      );
    }

    /** Ausgabe setzen: Geheimtext GROSS in Fünfergruppen, Klartext klein. */
    function setzeAusgabe(aus, wert) {
      z.ausgabe = wert || '';
      aus.setze(!wert ? '' : z.richtung === 'ver' ? Krypto.gruppieren(wert) : Krypto.klein(wert));
    }

    /* ---------- Skytale ---------- */

    function baueSkytale() {
      let ns = null;
      let alle = null;
      const k = kopf(zeichne);
      const umfang = B.zahl({ beschriftung: 'Umfang u (Zeilen)', min: 2, max: 10, wert: z.umfang, beiWechsel: (u) => { z.umfang = u; zeichne(); } });
      const duenner = h('button', { type: 'button', class: 'knopf knopf-leise skytale-stab-minus' }, '◀ Stab dünner');
      const dicker = h('button', { type: 'button', class: 'knopf knopf-leise skytale-stab-plus' }, 'Stab dicker ▶');
      duenner.addEventListener('click', () => { umfang.setze(z.umfang - 1); z.umfang = umfang.wert(); zeichne(); });
      dicker.addEventListener('click', () => { umfang.setze(z.umfang + 1); z.umfang = umfang.wert(); zeichne(); });
      const rasterOrt = h('div', { class: 'skytale-raster-ort' });
      const meldung = h('div', { class: 'skytale-meldung' });
      const aus = B.ausgabe({ beschriftung: 'Ergebnis', art: 'frei' });
      const pruef = h('div', { class: 'skytale-pruefung' });
      const info = h('p', { class: 'labor-hinweis hinweis-info skytale-info', role: 'note' });
      const nsOrt = h('div');
      const stabOrt = h('div', { class: 'skytale-stab-ort' });
      const alleOrt = h('div');
      const stabDetails = B.details('Stab-Ansicht', stabOrt, { klasse: 'stab-ansicht' });
      const alleDetails = B.details('Alle Stäbe ausprobieren', [h('p', { class: 'text-2' }, 'Der abgefangene Geheimtext wird mit u = 2 … 10 entschlüsselt. Welche Zeile ist lesbar? Das entscheidest du.'), alleOrt], { klasse: 'alle-staebe' });
      r.flaeche.append(k.element, h('div', { class: 'labor-steuer' }, umfang.element, h('div', { class: 'skytale-stab-knoepfe' }, duenner, dicker)), rasterOrt, meldung, aus.element, pruef, info, nsOrt, stabDetails, alleDetails);

      function sperre(an) {
        k.sperre(an);
        umfang.sperre(an);
        duenner.disabled = an || z.umfang <= 2;
        dicker.disabled = an || z.umfang >= 10;
      }

      function zeichne() {
        if (ns) ns.schliesse();
        if (alle) alle.schliesse();
        ns = null;
        alle = null;
        for (const el of [rasterOrt, meldung, pruef, nsOrt, alleOrt]) AQ.clear(el);
        sperre(false);
        const u = z.umfang;
        const ein = Krypto.nurBuchstaben(z.text);
        const ver = z.richtung === 'ver';
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
          ns = KRLabor.nachspiel(nsOrt, { titel: ver ? 'Schreiben und Lesen' : 'Geheimtext einschreiben und lesen', start: -1, schritte: skytaleSchritte(raster, ver), zeige: (st) => zeigeSchritt(zellen, st.daten), beiLauf: sperre });
        }
        stab(raster, erg.wert);
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

      /** Stab-Ansicht: Streifen um den Stab (u Windungen sichtbar als Zeilen), Abwickeln zeigt den Geheimtext. */
      function stab(raster, ergebnis) {
        AQ.clear(stabOrt);
        if (!raster) {
          stabOrt.appendChild(h('p', { class: 'text-2' }, 'Erst einen passenden Text eingeben.'));
          return;
        }
        const sp = raster[0].length;
        const bandText = Krypto.gruppieren(Krypto.nurBuchstaben(z.richtung === 'ver' ? ergebnis : z.text));
        const breite = Math.max(220, 40 + sp * 26, 40 + bandText.length * 10);
        const zeilenH = 26;
        const hoehe = raster.length * zeilenH + 40;
        const gewickelt = s('g', { class: 'stab-gewickelt' },
          s('rect', { class: 'stab-holz', x: 10, y: 10, width: breite - 20, height: hoehe - 20, rx: 14 }),
          raster.map((zeile, i) => s('g', null,
            s('rect', { class: 'stab-streifen', x: 18, y: 20 + i * zeilenH, width: breite - 36, height: zeilenH - 4, rx: 3 }),
            [...zeile].map((b, j) => s('text', { class: 'stab-zeichen', x: 34 + j * 26, y: 20 + i * zeilenH + 12, 'dominant-baseline': 'central', 'text-anchor': 'middle' }, Krypto.klein(b)))
          ))
        );
        const bandG = s('g', { class: 'stab-band' },
          s('rect', { class: 'stab-streifen', x: 10, y: hoehe / 2 - 14, width: breite - 20, height: 28, rx: 3 }),
          s('text', { class: 'stab-zeichen', x: breite / 2, y: hoehe / 2, 'dominant-baseline': 'central', 'text-anchor': 'middle' }, bandText)
        );
        const svg = s('svg', { class: 'skytale-stab', viewBox: `0 0 ${breite} ${hoehe}`, width: breite, height: hoehe, role: 'img', 'aria-label': `Stab mit Umfang ${raster.length}: Der Streifen trägt zeilenweise den Klartext; abgewickelt zeigt er den Geheimtext ${bandText}.` }, gewickelt, bandG);
        const knopf = h('button', { type: 'button', class: 'knopf knopf-zweit stab-abwickeln', 'aria-pressed': 'false' }, 'Streifen abwickeln');
        knopf.addEventListener('click', () => {
          const an = knopf.getAttribute('aria-pressed') !== 'true';
          knopf.setAttribute('aria-pressed', String(an));
          knopf.textContent = an ? 'Streifen aufwickeln' : 'Streifen abwickeln';
          svg.classList.toggle('animiert', !ruhig);
          svg.classList.toggle('abgewickelt', an);
        });
        stabOrt.append(h('div', { class: 'scroll-x' }, svg), knopf);
      }

      zeichne();
      return {
        schliesse() {
          if (ns) ns.schliesse();
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
                if (muster[p] !== i) return h('td', { class: 'leer' });
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

    /* ---------- Fleißner-Schablone ---------- */

    function baueFleissner() {
      let ns = null;
      let meldung = '';
      const gruppen = Krypto.fleissnerDrehgruppen(GROESSE);
      const k = kopf(zeichne);
      const knoepfe = [];
      const zeilen = [];
      for (let zz = 1; zz <= GROESSE; zz++) {
        const tds = [];
        for (let ss = 1; ss <= GROESSE; ss++) {
          const g = gruppen[zz - 1][ss - 1];
          const b = h('button', { type: 'button', class: 'loch', 'data-z': String(zz), 'data-s': String(ss), 'data-gruppe': String(g), tabindex: zz === 1 && ss === 1 ? '0' : '-1' },
            h('span', { class: 'loch-symbol', 'aria-hidden': 'true' }, SYMBOL[g]),
            h('span', { class: 'loch-zeichen' }),
            h('span', { class: 'loch-nr' })
          );
          knoepfe.push(b);
          tds.push(h('td', null, b));
        }
        zeilen.push(h('tr', null, h('th', { scope: 'row' }, String(zz)), tds));
      }
      const kopfSp = [];
      for (let ss = 1; ss <= GROESSE; ss++) kopfSp.push(h('th', { scope: 'col' }, String(ss)));
      const tabelle = h('table', { class: 'schablone' }, h('caption', null, 'Schablone 4 × 4 (Zeile, Spalte ab 1): Löcher antippen; Symbole = Drehgruppen'), h('thead', null, h('tr', null, h('td', { class: 'ecke' }), kopfSp)), h('tbody', null, zeilen));
      const flaeche = h('div', { class: 'schablone-flaeche' }, tabelle);
      const stellungText = h('p', { class: 'schablone-stellung', 'aria-live': 'polite' });
      const drehen = h('button', { type: 'button', class: 'knopf knopf-zweit drehen' }, '↻ 90° im Uhrzeigersinn drehen');
      const pruefung = h('div', { class: 'schablone-pruefung', role: 'status' });
      const legende = h('p', { class: 'text-2 schablone-legende' }, 'Drehgruppen: ● ▲ ■ ◆ – aus jeder Gruppe genau ein Loch. Taste r dreht die Schablone.');
      const aus = B.ausgabe({ beschriftung: 'Ergebnis (zeilenweise)', art: 'frei' });
      const pruef = h('div');
      const nsOrt = h('div');
      r.flaeche.append(k.element, h('div', { class: 'schablone-bereich' }, flaeche, h('div', { class: 'schablone-seite' }, stellungText, drehen, legende, pruefung)), aus.element, pruef, nsOrt);
      let aktuell = null; // Loch im Nachspiel

      const istLoch = (zz, ss) => z.schablone.some((l) => l[0] === zz && l[1] === ss);
      function dreheWeiter(animiert = true) {
        z.stellung = z.stellung === 4 ? 1 : z.stellung + 1;
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
        const g = Number(b.dataset.gruppe);
        meldung = '';
        if (istLoch(zz, ss)) z.schablone = z.schablone.filter((l) => !(l[0] === zz && l[1] === ss));
        else if (z.schablone.length < 4) z.schablone = [...z.schablone, [zz, ss]];
        else {
          const inGruppe = z.schablone.filter((l) => gruppen[l[0] - 1][l[1] - 1] === g);
          if (inGruppe.length === 1) {
            z.schablone = [...z.schablone.filter((l) => l !== inGruppe[0]), [zz, ss]];
            meldung = `Loch der Drehgruppe ${SYMBOL[g]} versetzt.`;
          } else meldung = 'Höchstens 4 Löcher – erst ein Loch entfernen.';
        }
        z.schablone.sort(zeilenweise);
        z.stellung = 1;
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
          const ziel = { ArrowRight: [zz, ss + 1], ArrowLeft: [zz, ss - 1], ArrowDown: [zz + 1, ss], ArrowUp: [zz - 1, ss], Home: [zz, 1], End: [zz, GROESSE] }[e.key];
          if (!ziel) return;
          e.preventDefault();
          const [nz, nsp] = [Math.max(1, Math.min(GROESSE, ziel[0])), Math.max(1, Math.min(GROESSE, ziel[1]))];
          const nb = knoepfe.find((x) => x.dataset.z === String(nz) && x.dataset.s === String(nsp));
          for (const x of knoepfe) x.setAttribute('tabindex', x === nb ? '0' : '-1');
          nb.focus();
        });
      });
      drehen.addEventListener('click', () => dreheWeiter());

      function sperre(an) {
        k.sperre(an);
        drehen.disabled = an;
        for (const b of knoepfe) b.disabled = an;
      }

      let raster = null; // Buchstaben je Feld (zeilenweise) des ersten Blocks
      let gueltig = false;
      function zeigeRaster() {
        const stellungen = Krypto.fleissnerStellungen(GROESSE, z.schablone);
        const offen = stellungen[z.stellung - 1].slice().sort(zeilenweise);
        stellungText.textContent = `Stellung ${z.stellung} von 4`;
        for (const b of knoepfe) {
          const zz = Number(b.dataset.z);
          const ss = Number(b.dataset.s);
          const nr = offen.findIndex((l) => l[0] === zz && l[1] === ss);
          const loch = istLoch(zz, ss);
          b.setAttribute('aria-pressed', String(loch));
          b.classList.toggle('frei', nr >= 0);
          b.classList.toggle('aktuell', !!aktuell && aktuell[0] === zz && aktuell[1] === ss);
          const zeichen = raster ? raster[(zz - 1) * GROESSE + (ss - 1)] : '';
          b.querySelector('.loch-zeichen').textContent = zeichen ? Krypto.klein(zeichen) : '';
          b.querySelector('.loch-nr').textContent = nr >= 0 ? String(nr + 1) : '';
          b.setAttribute('aria-label', `Feld (${zz},${ss}), Drehgruppe ${SYMBOL[Number(b.dataset.gruppe)]}${loch ? ', Loch' : ''}${nr >= 0 ? `, in Stellung ${z.stellung} frei als Nummer ${nr + 1}` : ''}${zeichen ? `, Buchstabe ${Krypto.klein(zeichen)}` : ''}`);
        }
      }

      function zeichne() {
        if (ns) ns.schliesse();
        ns = null;
        aktuell = null;
        AQ.clear(pruef);
        AQ.clear(nsOrt);
        AQ.clear(pruefung);
        const p = Krypto.schablonePruefen(GROESSE, z.schablone);
        gueltig = p.ok;
        if (meldung) pruefung.appendChild(B.hinweis(/versetzt/.test(meldung) ? 'info' : 'warnung', meldung));
        if (p.ok) pruefung.appendChild(B.hinweis('ok', `Gültig: Jedes Feld wird genau einmal frei (${p.abgedeckt} von 16 Feldern).`));
        else if (z.schablone.length < 4) pruefung.appendChild(B.hinweis('info', `Noch ${4 - z.schablone.length} Loch/Löcher setzen – ${p.abgedeckt} von 16 Feldern werden frei.`));
        else pruefung.appendChild(B.hinweis('warnung', `${p.fehler.join(' ')} Nur ${p.abgedeckt} von 16 Feldern werden frei – ungültig.`));
        const ein = Krypto.nurBuchstaben(z.text);
        raster = null;
        if (!gueltig) setzeAusgabe(aus, '');
        else {
          const erg = versuche(() => Krypto.fleissner(z.text, GROESSE, z.schablone, z.richtung));
          if (erg.fehler) {
            setzeAusgabe(aus, '');
            pruefung.appendChild(B.hinweis('warnung', erg.fehler));
          } else if (ein.length) {
            setzeAusgabe(aus, erg.wert);
            raster = (z.richtung === 'ver' ? erg.wert : ein).slice(0, 16);
            pruef.appendChild(pruefZeile(ein, Krypto.nurBuchstaben(erg.wert)));
            if (ein.length > 16) pruef.appendChild(h('p', { class: 'text-2' }, 'Die Schablone zeigt den ersten Block (16 Felder); die Ausgabe gilt für den ganzen Text.'));
          } else setzeAusgabe(aus, '');
        }
        zeigeRaster();
        if (raster) {
          const stellungen = Krypto.fleissnerStellungen(GROESSE, z.schablone);
          const schritte = [];
          stellungen.forEach((liste, st) => {
            liste.slice().sort(zeilenweise).forEach(([zz, ss]) => {
              const b = raster[(zz - 1) * GROESSE + (ss - 1)];
              schritte.push({ text: `Stellung ${st + 1}, Loch (${zz},${ss}): ${Krypto.klein(b)}`, daten: { stellung: st + 1, loch: [zz, ss] } });
            });
          });
          ns = KRLabor.nachspiel(nsOrt, {
            titel: 'Stellung für Stellung, Loch für Loch',
            start: -1,
            schritte,
            beiLauf: sperre,
            zeige(st, i, o) {
              const wechsel = st.daten.stellung !== z.stellung;
              z.stellung = st.daten.stellung;
              aktuell = st.daten.loch;
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
      return {
        schliesse: () => ns && ns.schliesse(),
        gueltig: () => gueltig
      };
    }

    /* ---------- Reiterwechsel ---------- */

    function baue(id) {
      if (teil && teil.schliesse) teil.schliesse();
      for (const t of timer) clearTimeout(t);
      timer.clear();
      AQ.clear(r.flaeche);
      if (id === 'gartenzaun') teil = baueZaun();
      else if (id === 'fleissner') teil = baueFleissner();
      else teil = baueSkytale();
    }
    baue(r.aktiv());

    return {
      schliesse() {
        if (teil && teil.schliesse) teil.schliesse();
        for (const t of timer) clearTimeout(t);
        timer.clear();
      },
      zustand() {
        const gueltig = Krypto.schablonePruefen(GROESSE, z.schablone).ok;
        return { reiter: r.aktiv(), richtung: z.richtung, text: z.text, umfang: z.umfang, zeilen: z.zeilen, schablone: z.schablone.map((l) => l.slice()), stellung: z.stellung, gueltig, ausgabe: z.ausgabe };
      }
    };
  }

  KRLabor.registriere('skytale', { titel: 'Skytale & Gitter', oeffne });
})();
