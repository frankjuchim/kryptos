/* Kryptos – Labor-Werkzeug „Enigma“ (Kür; Plan M10 Tasks 232/233, E180, E187, E197).
   Herkunft: Krypto-Werkstatt (Ideen von A. Bodendiek), stationen/enigma.html @59004d9 – docs/FREMDCODE.md
   Maschine: aufklappbarer Tagesschlüssel (Walzenkasten I–V und drei Plätze – antippen und Auswahllisten –, Ringe am roten
   Punkt, Umkehrwalze B/C, „Standard“, „Beispiel mit 10 Kabeln“, „Alle Kabel ab“), Gehäuse mit Walzenfenstern (▲/▼, Kerbe,
   Kerbenlampe), Lampenfeld und Tastatur (QWERTZ, auch physische Tasten bei Fokus in der Maschine), Steckerbrett (Buchse
   antippen → Partner antippen; Kabelfarben --mat-kabel-*, Nummer). Jeder Tastendruck über Krypto.enigmaSchritt:
   Walzen drehen (Doppelschritt sichtbar), Lampe leuchtet, Bänder. Speichert nichts. */
'use strict';
(() => {
  const { h, s } = AQ;
  const B = KRLaborBau;
  const S = KRStation;
  const BEISPIEL = { probe: 'wetterlage' }; // eigenes Wort für Vorführungen, in keinem Material
  const REITER_TITEL = { maschine: 'Maschine', innenleben: 'Innenleben', vorfuehren: 'Vorführen', glossar: 'Glossar' };
  const WALZEN = ['I', 'II', 'III', 'IV', 'V'];
  const ABC = [...Krypto.ALPHABET];
  const REIHEN = ['QWERTZUIO', 'ASDFGHJK', 'PYXCVBNML'];
  const PLATZ = ['links', 'Mitte', 'rechts'];
  const MAX = 250;
  // Werkstatt-Beispiel „mit 10 Kabeln“ (II – IV – V, Ringe BUL, UKW B, Grundstellung BLA)
  const ZEHN = Object.freeze({ walzen: ['II', 'IV', 'V'], ukw: 'B', ringe: 'BUL', grund: 'BLA', stecker: 'AV BS CG DL FU HZ IN KM OW RX' });
  const STANDARD = Object.freeze({ walzen: ['I', 'II', 'III'], ukw: 'B', ringe: 'AAA', grund: 'AAA', stecker: '' });

  /** Buchstabe um d weiterdrehen (Darstellung der Fenster/Ringe, über Krypto.mod) */
  const dreh = (b, d) => ABC[Krypto.mod(Krypto.wert(b, 0) + d, 26)];
  const zwei = (b) => String(Krypto.wert(b, 1)).padStart(2, '0');

  /** gültige Einstellung aus der Voreinstellung (fehlende Felder: Standard; Prüfung über Krypto.enigmaSchritt) */
  function einstellungVon(v) {
    const e = { ...STANDARD, walzen: [...STANDARD.walzen] };
    const x = v && typeof v.einstellung === 'object' && v.einstellung ? v.einstellung : {};
    const kandidat = { ...e, ...x, walzen: Array.isArray(x.walzen) ? [...x.walzen] : e.walzen, ukw: v && (v.ukw === 'B' || v.ukw === 'C') ? v.ukw : x.ukw || e.ukw };
    for (const k of ['ringe', 'grund']) if (typeof kandidat[k] === 'string') kandidat[k] = kandidat[k].toUpperCase();
    try {
      Krypto.enigmaSchritt(kandidat, kandidat.grund, 'A');
      kandidat.stecker = steckerText(paareVon(kandidat.stecker));
      return kandidat;
    } catch {
      return e;
    }
  }
  function paareVon(text) {
    return String(text || '').trim() ? String(text).trim().toUpperCase().split(/\s+/) : [];
  }
  function steckerText(paare) {
    return paare.join(' ');
  }

  function oeffne(container, voreinstellung, umgebung) {
    const v = voreinstellung || {};
    const reiterListe = KRLabor.reiterFuer('enigma', v, umgebung);
    const ruhig = AQ.ruhig();
    const z = {
      einst: einstellungVon(v),
      stellung: null, // aktuelle Stellung (= grund bei leerer Nachricht)
      richtung: 'ver',
      liste: [], // [ein, aus] mit .schritt
      gewaehlteBuchse: null,
      gewaehlteWalze: null,
      letzter: null // letzter Tastendruck { einst, stellung, buchstabe } für „Blick ins Innere“
    };
    z.stellung = z.einst.grund;
    let gesperrt = false;
    let teil = null;

    const r = B.reiter(reiterListe.map((id) => ({ id, titel: REITER_TITEL[id] })), { aktiv: reiterListe[0], beiWechsel: baue });
    const wurzel = h('div', { class: 'labor-werkzeug enigma-werkzeug' }, r.element);
    container.appendChild(wurzel);
    KRStation.herkunft(wurzel);

    const einstellung = () => ({ walzen: [...z.einst.walzen], ukw: z.einst.ukw, ringe: z.einst.ringe, grund: z.einst.grund, stecker: z.einst.stecker });
    const zusammenfassung = () => `${z.einst.walzen.join('-')} · Ringe ${z.einst.ringe} · UKW ${z.einst.ukw} · ${paareVon(z.einst.stecker).length} Stecker · ${z.einst.grund}`;

    function schliesseTeil() {
      if (teil) teil.schliesse();
      teil = null;
      gesperrt = false;
      S.sperre(r.flaeche, false);
    }

    /* ---------- Reiter „Maschine“ ---------- */
    function baueMaschine() {
      let bereit = false;
      const anleitung = S.anleitung(null, []);
      const erklaerung = S.erklaerung(null);
      const hinweis = h('p', { class: 'enigma-hinweis', role: 'status' });

      /* Tagesschlüssel */
      const summe = h('span', { class: 'enigma-zusammenfassung' });
      const kasten = h('div', { class: 'enigma-walzenkasten', role: 'group', 'aria-label': 'Walzenkasten' });
      const plaetze = [0, 1, 2].map((i) => {
        const wahl = h('select', { class: 'enigma-walze-wahl', 'data-platz': String(i), 'aria-label': `Walze ${PLATZ[i]}` }, WALZEN.map((n) => h('option', { value: n }, n)));
        const knopf = h('button', { type: 'button', class: 'enigma-platz', 'data-platz': String(i), 'aria-label': `Platz ${PLATZ[i]}` });
        const ringText = h('span', { class: 'enigma-ring-text' });
        const ring = h('div', { class: 'enigma-ring', 'data-platz': String(i) }, h('span', { class: 'enigma-ring-punkt', 'aria-hidden': 'true' }), ringText, h('button', { type: 'button', class: 'knopf knopf-leise enigma-ring-hoch', 'aria-label': `Ring ${PLATZ[i]} weiter` }, '▲'), h('button', { type: 'button', class: 'knopf knopf-leise enigma-ring-runter', 'aria-label': `Ring ${PLATZ[i]} zurück` }, '▼'));
        return { wahl, knopf, ring, ringText, element: h('div', { class: 'enigma-platz-teil' }, knopf, h('span', { class: 'enigma-platz-name' }, PLATZ[i]), wahl, ring) };
      });
      const ukwKnoepfe = ['B', 'C'].map((u) => h('button', { type: 'button', 'data-ukw': u, 'aria-pressed': 'false' }, h('span', null, 'UKW'), h('b', null, u)));
      const ukwWahl = h('div', { class: 'enigma-ukw', role: 'group', 'aria-label': 'Umkehrwalze' }, ukwKnoepfe);
      const standard = h('button', { type: 'button', class: 'knopf knopf-leise enigma-standard' }, 'Standard');
      const beispiel = h('button', { type: 'button', class: 'knopf knopf-leise enigma-beispiel' }, 'Beispiel mit 10 Kabeln');
      const kabelAb = h('button', { type: 'button', class: 'knopf knopf-leise enigma-kabel-ab' }, 'Alle Kabel ab');
      const tagesschluessel = h(
        'details',
        { class: 'enigma-tagesschluessel' },
        h('summary', null, h('span', { class: 'enigma-ts-titel' }, 'Tagesschlüssel einstellen'), summe),
        h(
          'div',
          { class: 'enigma-ts-inhalt' },
          h('div', { class: 'enigma-ts-reihe' }, h('div', { class: 'enigma-ts-block' }, h('p', { class: 'enigma-feldtitel' }, 'Walzenkasten'), kasten), h('div', { class: 'enigma-ts-block' }, h('p', { class: 'enigma-feldtitel' }, 'Walzen: links – Mitte – rechts · Ring am roten Punkt'), h('div', { class: 'enigma-plaetze' }, plaetze.map((p) => p.element)))),
          h('div', { class: 'enigma-ts-block' }, h('p', { class: 'enigma-feldtitel' }, 'Umkehrwalze'), ukwWahl),
          h('p', { class: 'text-2' }, 'Walze im Kasten antippen, dann den Platz – oder die Auswahlliste nutzen. Kabel steckst du unten am Steckerbrett, die Startbuchstaben stellst du im Fenster ein.'),
          h('div', { class: 'knopf-reihe' }, standard, beispiel, kabelAb)
        )
      );

      /* Gehäuse: Fenster, Lampen, Tastatur, Steckerbrett */
      const fenster = [0, 1, 2].map((i) => {
        const oben = h('span', { class: 'enigma-fenster-oben', 'aria-hidden': 'true' });
        const mitte = h('span', { class: 'enigma-fenster-mitte' });
        const unten = h('span', { class: 'enigma-fenster-unten', 'aria-hidden': 'true' });
        const walze = h('span', { class: 'enigma-walzenrad' }, oben, mitte, unten);
        const titel = h('span', { class: 'enigma-fenster-titel' });
        const info = h('span', { class: 'enigma-fenster-info' });
        const kerbe = h('span', { class: 'enigma-kerbe', 'aria-hidden': 'true' });
        const hoch = h('button', { type: 'button', class: 'enigma-stellung-hoch', 'aria-label': `Walze ${PLATZ[i]} weiterdrehen` }, '▲');
        const runter = h('button', { type: 'button', class: 'enigma-stellung-runter', 'aria-label': `Walze ${PLATZ[i]} zurückdrehen` }, '▼');
        const el = h('div', { class: 'enigma-fenster', 'data-platz': String(i) }, titel, h('div', { class: 'enigma-fenster-rad' }, walze, h('span', { class: 'enigma-fenster-knoepfe' }, hoch, runter)), h('span', { class: 'enigma-fenster-fuss' }, info, kerbe));
        return { el, oben, mitte, unten, walze, titel, info, kerbe, hoch, runter };
      });
      const ukwSchild = h('span', { class: 'enigma-ukw-schild' }, h('span', null, 'UKW'), h('b'));
      const lampen = new Map();
      const tasten = new Map();
      const buchsen = new Map();
      const reihe = (art, map) =>
        REIHEN.map((zeile) =>
          h(
            'div',
            { class: `enigma-reihe enigma-reihe-${art}` },
            [...zeile].map((b) => {
              const el =
                art === 'lampe'
                  ? h('span', { class: 'enigma-lampe', 'data-buchstabe': b }, b)
                  : art === 'taste'
                    ? h('button', { type: 'button', class: 'enigma-taste', 'data-buchstabe': b, 'aria-label': `Taste ${b}` }, b)
                    : h('button', { type: 'button', class: 'enigma-buchse', 'data-buchstabe': b, 'aria-label': `Buchse ${b}` }, h('span', { class: 'enigma-buchse-b' }, b), h('span', { class: 'enigma-buchse-loch', 'aria-hidden': 'true' }), h('span', { class: 'enigma-buchse-nr', 'aria-hidden': 'true' }));
              map.set(b, el);
              return el;
            })
          )
        );
      const lampenfeld = h('div', { class: 'enigma-lampenfeld', role: 'img', 'aria-label': 'Lampenfeld' }, reihe('lampe', lampen));
      const tastatur = h('div', { class: 'enigma-tastatur', role: 'group', 'aria-label': 'Tastatur' }, reihe('taste', tasten));
      const steckerbrett = h('div', { class: 'enigma-steckerbrett', role: 'group', 'aria-label': 'Steckerbrett' }, reihe('buchse', buchsen));
      const kabelSvg = s('svg', { class: 'enigma-kabel', 'aria-hidden': 'true', focusable: 'false' });
      const brettTeil = h('div', { class: 'enigma-brett-teil' }, steckerbrett, kabelSvg, h('p', { class: 'enigma-feldtitel enigma-mittig' }, 'Steckerbrett'));
      const gehaeuse = h(
        'div',
        { class: 'enigma-gehaeuse enigma-maschine', tabindex: '-1' },
        h('div', { class: 'enigma-walzenfach' }, ukwSchild, fenster.map((f) => f.el)),
        h('p', { class: 'enigma-feldtitel enigma-mittig' }, 'Lampen'),
        lampenfeld,
        h('p', { class: 'enigma-feldtitel enigma-mittig' }, 'Tastatur'),
        tastatur,
        brettTeil
      );

      /* rechte Spalte */
      const richtungWahl = B.richtung({ wert: z.richtung, beiWechsel: (x) => wechsleRichtung(x) });
      const baender = S.baender({ beiAenderung: (bd) => geaendert(bd) });
      const nsOrt = h('div', { class: 'enigma-nachspiel' });
      const nk = S.nachspielKnopf(nsOrt, { sperre: (an) => sperre(an), beiEnde: () => zeige(), beiLeer: (t) => erklaerung.sage('Nachspielen', t) });
      const gegenprobe = h('button', { type: 'button', class: 'knopf knopf-zweit enigma-gegenprobe' }, '↺ Zurück auf Grundstellung');
      const blick = h('button', { type: 'button', class: 'knopf knopf-leise enigma-blick' }, 'Letzten Buchstaben ansehen');
      const tabelle = h('dl', { class: 'station-kv enigma-ts-tabelle' });
      const mehr = S.mehr(
        null,
        'Mehr ausprobieren',
        'Gegenprobe, Blick ins Innere, Tagesschlüssel',
        h('p', { class: 'enigma-feldtitel' }, 'Gegenprobe'),
        h('p', { class: 'text-2' }, 'Walzen zurück auf die Grundstellung, dann den Geheimtext tippen: Die Lampen zeigen wieder den Klartext.'),
        gegenprobe,
        reiterListe.includes('innenleben') ? h('p', { class: 'enigma-feldtitel' }, 'Blick ins Innere') : null,
        reiterListe.includes('innenleben') ? h('p', { class: 'text-2' }, 'Zeigt den Weg des Stroms für deinen letzten Buchstaben.') : null,
        reiterListe.includes('innenleben') ? blick : null,
        h('p', { class: 'enigma-feldtitel' }, 'Tagesschlüssel'),
        tabelle
      );
      const raum = Krypto.schluesselraum('enigma');
      const buehne = h('div', { class: 'enigma-buehne' }, anleitung.element, tagesschluessel, gehaeuse, hinweis, erklaerung.element);
      const rechts = h('div', { class: 'enigma-bedienung' }, richtungWahl.element, baender.element, nk.element, nsOrt, mehr);
      r.flaeche.append(
        h('div', { class: 'enigma-objekt' }, buehne, rechts),
        S.soGehts(null, ['Vor jedem Buchstaben dreht sich die rechte Walze weiter – deshalb ändert sich die Verschlüsselung ständig.', 'Der Strom läuft durch Steckerbrett und Walzen zur Umkehrwalze und auf einem anderen Weg zurück.', 'Eine Lampe leuchtet: der verschlüsselte Buchstabe.', 'Entschlüsseln: gleiche Einstellung, Geheimtext tippen.']),
        S.hintergrund(null, [
          { titel: 'Schlüsselraum', zeilen: [['Walzenlage', '5 · 4 · 3 = 60'], ['Grundstellung', '26³ = 17 576'], ['10 Kabel', S.ungefaehr(raum.formel.split(' · ').pop())], ['zusammen', S.ungefaehr(raum.anzahl)], ['Art', 'polyalphabetisch']] },
          { titel: 'Warum die Enigma fiel', text: 'Kein Buchstabe wird zu sich selbst. Mit einem vermuteten Klartextstück (Crib) ließen sich so viele Einstellungen ausschließen. Dazu kamen Bedienfehler.' },
          { titel: 'Einordnung', text: 'Wie die Maschine funktioniert, darf jeder wissen (Kerckhoffs). Geheim ist nur der Tagesschlüssel.' }
        ])
      );
      function setzeEinst(neu, meldung) {
        if (z.liste.length) {
          hinweis.textContent = 'Während du tippst, bleibt der Schlüssel fest. Mit „✕ Neue Nachricht“ kannst du ihn ändern.';
          return false;
        }
        z.einst = { ...z.einst, ...neu, walzen: neu.walzen ? [...neu.walzen] : [...z.einst.walzen] };
        z.stellung = z.einst.grund;
        z.gewaehlteBuchse = null;
        hinweis.textContent = meldung || '';
        zeige();
        return true;
      }
      function zeige() {
        const e = z.einst;
        summe.textContent = zusammenfassung();
        AQ.clear(kasten);
        for (const n of WALZEN) {
          const benutzt = e.walzen.includes(n);
          const k = h('button', { type: 'button', class: `enigma-walzenstein${benutzt ? ' benutzt' : ''}${z.gewaehlteWalze === n ? ' gewaehlt' : ''}`, 'data-walze': n, disabled: benutzt || gesperrt, 'aria-label': `Walze ${n}, Kerbe ${Krypto.ENIGMA.WALZEN[n].kerbe}` }, h('b', null, n), h('span', { class: 'enigma-nabe', 'aria-hidden': 'true' }), h('small', null, `Kerbe ${Krypto.ENIGMA.WALZEN[n].kerbe}`));
          k.addEventListener('click', () => {
            if (gesperrt) return;
            z.gewaehlteWalze = n;
            zeige();
            erklaerung.sage(`Walze ${n}`, 'Tippe jetzt den Platz an (links, Mitte oder rechts).');
          });
          kasten.appendChild(k);
        }
        plaetze.forEach((p, i) => {
          const n = e.walzen[i];
          p.wahl.value = n;
          AQ.clear(p.knopf);
          p.knopf.append(h('b', null, n), h('span', { class: 'enigma-nabe', 'aria-hidden': 'true' }), h('small', null, `Kerbe ${Krypto.ENIGMA.WALZEN[n].kerbe}`));
          p.knopf.classList.toggle('bereit', !!z.gewaehlteWalze);
          p.ringText.textContent = `Ring ${e.ringe[i]} ${zwei(e.ringe[i])}`;
        });
        for (const k of ukwKnoepfe) k.setAttribute('aria-pressed', String(k.dataset.ukw === e.ukw));
        ukwSchild.lastChild.textContent = e.ukw;
        fenster.forEach((f, i) => {
          const b = z.stellung[i];
          f.oben.textContent = dreh(b, -1);
          f.mitte.textContent = b;
          f.unten.textContent = dreh(b, 1);
          f.titel.textContent = `Walze ${e.walzen[i]}`;
          f.info.textContent = `Ring ${e.ringe[i]} · Kerbe ${Krypto.ENIGMA.WALZEN[e.walzen[i]].kerbe}`;
          f.kerbe.classList.toggle('an', b === Krypto.ENIGMA.WALZEN[e.walzen[i]].kerbe);
          f.el.setAttribute('aria-label', `Walze ${e.walzen[i]} ${PLATZ[i]}: Fenster ${b}`);
        });
        const paare = paareVon(e.stecker);
        for (const [b, el] of buchsen) {
          const nr = paare.findIndex((p) => p.includes(b));
          el.classList.toggle('gesteckt', nr >= 0);
          el.classList.toggle('gewaehlt', z.gewaehlteBuchse === b);
          for (let k = 1; k <= 10; k++) el.classList.toggle(`kabel-${k}`, nr >= 0 && Krypto.mod(nr, 10) + 1 === k);
          el.lastChild.textContent = nr >= 0 ? String(nr + 1) : '';
          el.setAttribute('aria-label', nr >= 0 ? `Buchse ${b}: Kabel ${nr + 1} zu ${paare[nr].replace(b, '')}` : `Buchse ${b}: frei`);
        }
        zeichneKabel();
        const letzte = z.liste[z.liste.length - 1];
        for (const [b, el] of lampen) el.classList.toggle('an', !!letzte && letzte.schritt.weg.lampe === b);
        AQ.clear(tabelle);
        for (const [dt, dd] of [['Walzen', e.walzen.join(' – ')], ['Ringe', [...e.ringe].map((x) => `${x} (${zwei(x)})`).join(' ')], ['Umkehrwalze', `UKW ${e.ukw}`], ['Stecker', e.stecker || 'keine'], ['Grundstellung', e.grund], ['Stellung jetzt', z.stellung]]) tabelle.append(h('dt', null, dt), h('dd', null, dd));
        anleitung.setze(z.liste.length ? 2 : 1);
        if (!z.liste.length) hinweis.textContent = hinweis.textContent.startsWith('Während') ? '' : hinweis.textContent;
        nk.setze(
          z.liste.length
            ? {
                titel: 'Deine Nachricht in Ruhe ansehen',
                start: -1,
                schritte: z.liste.map((e2, i) => ({ text: `Taste ${e2.schritt.weg.taste}: Walzen drehen ${e2.schritt.stellungVorher} → ${e2.schritt.stellung}${e2.schritt.doppelschritt ? ' (Doppelschritt)' : ''}, Lampe ${e2.schritt.weg.lampe}.`, daten: { n: i + 1 } })),
                zeige(st) {
                  bereit = false;
                  baender.setze(z.liste.slice(0, st.daten.n).map((x) => [x[0], x[1]]));
                  bereit = true;
                  const sch = z.liste[st.daten.n - 1].schritt;
                  zeigeStellung(sch.stellung);
                  for (const [b, el] of lampen) el.classList.toggle('an', sch.weg.lampe === b);
                }
              }
            : null
        );
      }
      function zeigeStellung(st) {
        fenster.forEach((f, i) => {
          f.oben.textContent = dreh(st[i], -1);
          f.mitte.textContent = st[i];
          f.unten.textContent = dreh(st[i], 1);
        });
      }
      /** Kabel als Kurven zwischen den Buchsen (nur mit Layout, z. B. im Browser) */
      function zeichneKabel() {
        AQ.clear(kabelSvg);
        if (typeof steckerbrett.getBoundingClientRect !== 'function') return;
        const r0 = brettTeil.getBoundingClientRect();
        if (!r0.width) return;
        kabelSvg.setAttribute('viewBox', `0 0 ${r0.width} ${r0.height}`);
        paareVon(z.einst.stecker).forEach((p, nr) => {
          const a = buchsen.get(p[0]).getBoundingClientRect();
          const b = buchsen.get(p[1]).getBoundingClientRect();
          const x1 = a.left + a.width / 2 - r0.left;
          const y1 = a.top + a.height * 0.62 - r0.top;
          const x2 = b.left + b.width / 2 - r0.left;
          const y2 = b.top + b.height * 0.62 - r0.top;
          const tief = Math.max(y1, y2) + 26 + Krypto.mod(nr, 3) * 8;
          kabelSvg.appendChild(s('path', { class: `enigma-kabelweg kabel-${Krypto.mod(nr, 10) + 1}`, d: `M${x1} ${y1} C${x1} ${tief} ${x2} ${tief} ${x2} ${y2}` }));
        });
      }
      function geaendert(bd) {
        if (!bereit || gesperrt) return;
        if (bd.eintraege.length < z.liste.length) {
          z.liste = z.liste.slice(0, bd.eintraege.length);
          z.stellung = z.liste.length ? z.liste[z.liste.length - 1].schritt.stellung : z.einst.grund;
          if (!z.liste.length) hinweis.textContent = '';
        }
        zeige();
      }
      function beschriften() {
        const ver = z.richtung === 'ver';
        baender.beschrifte(ver ? 'Klartext' : 'Geheimtext', ver ? 'Geheimtext' : 'Klartext', ver ? [false, true] : [true, false]);
        anleitung.texte(ver ? ['Tagesschlüssel prüfen', 'Tasten drücken', 'Lampen ablesen'] : ['Gleichen Schlüssel einstellen', 'Geheimtext tippen', 'Klartext ablesen']);
      }
      function neueNachricht() {
        z.liste = [];
        z.stellung = z.einst.grund;
        bereit = false;
        baender.leeren();
        bereit = true;
      }
      function wechsleRichtung(x) {
        z.richtung = x;
        neueNachricht();
        beschriften();
        zeige();
        erklaerung.sage(x === 'ver' ? 'Verschlüsseln' : 'Entschlüsseln', x === 'ver' ? 'Drück die Tasten deiner Nachricht. Zu jedem Tastendruck leuchtet eine Lampe.' : 'Stell denselben Tagesschlüssel ein und tippe den Geheimtext – die Lampen zeigen den Klartext.');
      }
      function druecke(b) {
        if (gesperrt) return erklaerung.sage('Nachspielen läuft', 'Während des Nachspielens ist die Eingabe gesperrt.');
        if (z.liste.length >= MAX) return;
        const sch = Krypto.enigmaSchritt(einstellung(), z.stellung, b);
        const ver = z.richtung === 'ver';
        const e = ver ? [Krypto.klein(b), sch.weg.lampe] : [b, Krypto.klein(sch.weg.lampe)];
        e.schritt = sch;
        z.liste.push(e);
        z.stellung = sch.stellung;
        z.letzter = { einst: einstellung(), stellung: sch.stellungVorher, buchstabe: b };
        bereit = false;
        baender.push(e[0], e[1]);
        bereit = true;
        zeige();
        if (!ruhig) {
          sch.bewegt.forEach((bew, i) => {
            if (!bew) return;
            fenster[i].walze.classList.remove('dreht');
            void fenster[i].walze.offsetWidth;
            fenster[i].walze.classList.add('dreht');
          });
        }
        S.flug(lampen.get(sch.weg.lampe), baender.letztes(1), e[1], { klasse: ver ? '' : 'klar' });
        erklaerung.sage(
          sch.doppelschritt ? 'Doppelschritt' : `Taste ${b}`,
          sch.doppelschritt
            ? `Die mittlere Walze stand auf ihrer Kerbe – sie dreht sich gleich noch einmal und nimmt die linke mit: ${sch.stellungVorher} → ${sch.stellung}. Lampe ${sch.weg.lampe}.`
            : `Die Walzen drehen ${sch.stellungVorher} → ${sch.stellung}, dann fließt der Strom: ${b} → Lampe ${sch.weg.lampe}.`
        );
      }
      function sperre(an) {
        gesperrt = an;
        S.sperre(r.flaeche, an);
        richtungWahl.sperre(an);
        for (const el of [...tasten.values(), ...buchsen.values(), ...fenster.flatMap((f) => [f.hoch, f.runter]), standard, beispiel, kabelAb, gegenprobe, blick]) el.disabled = an;
        for (const b of baender.element.querySelectorAll('button')) b.disabled = an || b.disabled;
        if (!an) zeige();
      }

      /* Handgriffe */
      for (const [b, el] of tasten) el.addEventListener('click', () => druecke(b));
      gehaeuse.addEventListener('keydown', (ev) => {
        if (ev.ctrlKey || ev.metaKey || ev.altKey || typeof ev.key !== 'string' || ev.key.length !== 1) return;
        const b = Krypto.nurBuchstaben(ev.key);
        if (b.length !== 1) return;
        ev.preventDefault();
        druecke(b);
      });
      for (const [b, el] of buchsen) {
        el.addEventListener('click', () => {
          if (gesperrt) return;
          const paare = paareVon(z.einst.stecker);
          const hat = paare.find((p) => p.includes(b));
          if (hat) {
            if (setzeEinst({ stecker: steckerText(paare.filter((p) => p !== hat)) })) erklaerung.sage('Kabel ab', `Das Kabel ${hat[0]}–${hat[1]} ist abgezogen.`);
            return;
          }
          if (!z.gewaehlteBuchse) {
            if (z.liste.length) return setzeEinst({});
            z.gewaehlteBuchse = b;
            zeige();
            return erklaerung.sage(`Buchse ${b}`, 'Tippe jetzt die Partner-Buchse an.');
          }
          if (z.gewaehlteBuchse === b) {
            z.gewaehlteBuchse = null;
            zeige();
            return;
          }
          if (paare.length >= 13) return erklaerung.sage('Kein Kabel mehr', 'Das Steckerbrett hat höchstens 13 Kabel.');
          const a = z.gewaehlteBuchse;
          if (setzeEinst({ stecker: steckerText([...paare, a + b]) })) erklaerung.sage(`Kabel ${paare.length + 1}`, `${a} und ${b} sind jetzt vertauscht – vor und nach den Walzen.`);
        });
      }
      fenster.forEach((f, i) => {
        const drehe = (d) => {
          if (gesperrt) return;
          const g = [...z.einst.grund];
          g[i] = dreh(g[i], d);
          if (setzeEinst({ grund: g.join('') })) erklaerung.sage('Grundstellung', `Die Walzen stehen jetzt auf ${g.join('')}.`);
        };
        f.hoch.addEventListener('click', () => drehe(1));
        f.runter.addEventListener('click', () => drehe(-1));
      });
      plaetze.forEach((p, i) => {
        const setze = (n) => {
          const w = [...z.einst.walzen];
          const alt = w.indexOf(n);
          if (alt >= 0) w[alt] = w[i];
          w[i] = n;
          z.gewaehlteWalze = null;
          if (setzeEinst({ walzen: w })) erklaerung.sage('Walzenlage', `Links – Mitte – rechts: ${w.join(' – ')}.`);
        };
        p.wahl.addEventListener('change', () => setze(p.wahl.value));
        p.knopf.addEventListener('click', () => {
          if (gesperrt) return;
          if (z.gewaehlteWalze) setze(z.gewaehlteWalze);
          else erklaerung.sage(`Platz ${PLATZ[i]}`, 'Tippe zuerst im Walzenkasten eine freie Walze an – oder wähle sie in der Liste.');
        });
        const ring = (d) => {
          const rr = [...z.einst.ringe];
          rr[i] = dreh(rr[i], d);
          if (setzeEinst({ ringe: rr.join('') })) erklaerung.sage('Ringstellung', `Ring ${PLATZ[i]}: ${rr[i]} (${zwei(rr[i])}). Der Ring verschiebt die Verdrahtung gegenüber dem Buchstaben im Fenster.`);
        };
        p.ring.querySelector('.enigma-ring-hoch').addEventListener('click', () => ring(1));
        p.ring.querySelector('.enigma-ring-runter').addEventListener('click', () => ring(-1));
      });
      for (const k of ukwKnoepfe) k.addEventListener('click', () => setzeEinst({ ukw: k.dataset.ukw }) && erklaerung.sage('Umkehrwalze', `UKW ${k.dataset.ukw} ist eingesetzt.`));
      standard.addEventListener('click', () => setzeEinst({ ...STANDARD }, 'Standard: Walzen I – II – III, Ringe AAA, UKW B, keine Stecker, Grundstellung AAA.'));
      beispiel.addEventListener('click', () => setzeEinst({ ...ZEHN }, 'Beispiel: II – IV – V, Ringe BUL, UKW B, 10 Kabel, Grundstellung BLA.'));
      kabelAb.addEventListener('click', () => setzeEinst({ stecker: '' }, 'Alle Kabel abgezogen.'));
      gegenprobe.addEventListener('click', () => {
        if (gesperrt) return;
        const geheim = z.liste.map((e) => (z.richtung === 'ver' ? e[1] : e[0])).join('');
        z.richtung = z.richtung === 'ver' ? 'ent' : 'ver';
        richtungWahl.setze(z.richtung);
        neueNachricht();
        beschriften();
        zeige();
        erklaerung.sage('Gegenprobe', geheim ? `Die Walzen stehen wieder auf ${z.einst.grund}. Tippe jetzt ${Krypto.gruppieren(geheim)} – die Lampen zeigen den Klartext.` : `Die Walzen stehen wieder auf ${z.einst.grund}.`);
      });
      blick.addEventListener('click', () => {
        if (!z.letzter) return erklaerung.sage('Blick ins Innere', 'Drück zuerst eine Taste.');
        r.waehle('innenleben', { fokus: true });
      });

      beschriften();
      bereit = true;
      baender.setze(z.liste.map((e) => [e[0], e[1]]));
      zeige();
      erklaerung.sage('Bereit', 'Drück die Tasten der Maschine. Zu jedem Tastendruck leuchtet eine Lampe.');
      return {
        schliesse: () => nk.schliesse(),
        zustand: () => ({})
      };
    }

    /* ---------- gemeinsamer Hintergrund (Innenleben, Vorführen, Glossar) ---------- */
    function hintergrundKarten() {
      const raum = Krypto.schluesselraum('enigma', { kabel: 10 });
      return [
        { titel: 'Schlüsselraum', zeilen: [['Walzenlage', '5 · 4 · 3 = 60'], ['Grundstellung', '26³ = 17 576'], ['10 Kabel', S.ungefaehr(raum.formel.split(' · ').pop())], ['zusammen', S.ungefaehr(raum.anzahl)]] },
        { titel: 'Kerckhoffs', text: 'Wie die Enigma verdrahtet ist, durfte der Gegner wissen – und wusste es. Geheim war nur der Tagesschlüssel: Walzenlage, Ringe, Stecker und Grundstellung.' },
        { titel: 'Schwäche', text: 'Kein Buchstabe wird zu sich selbst verschlüsselt. Wer ein Stück Klartext vermutet (Crib), kann damit viele Stellungen sofort ausschließen.' }
      ];
    }

    /* ---------- Reiter „Innenleben“: Stromweg ---------- */
    const RH = 20;
    const TOP = 120;
    const yy = (b) => TOP + Krypto.wert(b, 0) * RH + RH / 2;
    const ROT_X = [140, 320, 500];
    const RW = 150;
    const G = { ukwX0: 20, ukwX1: 112, ukwDot: 92, etwX0: 680, etwX1: 730, stX0: 760, stX1: 872, stL: 768, stR: 846, keyX: 930 };
    const kurve = (x1, y1, x2, y2) => `M ${x1} ${y1} C ${x1 + (x2 - x1) * 0.42} ${y1} ${x1 + (x2 - x1) * 0.58} ${y2} ${x2} ${y2}`;

    function baueInnenleben() {
      const quelle = z.letzter || { einst: einstellung(), stellung: z.stellung, buchstabe: null };
      let auswahl = quelle.buchstabe;
      const anleitung = S.anleitung(null, ['Buchstaben wählen', 'Stromweg verfolgen', 'Lampe ablesen']);
      const erklaerung = S.erklaerung(null);
      const wahl = h('div', { class: 'enigma-wahl', role: 'group', 'aria-label': 'Buchstaben wählen' }, ABC.map((b) => h('button', { type: 'button', 'data-buchstabe': b, 'aria-pressed': 'false' }, b)));
      const svg = s('svg', { class: 'enigma-schaubild', viewBox: '0 0 980 700', role: 'img', 'aria-label': 'Schaubild des Stromwegs durch die Enigma' });
      const liste = h('ol', { class: 'enigma-weg' });
      const legende = h('p', { class: 'enigma-legende text-2' }, h('span', { class: 'enigma-legende-hin' }, '━ Hinweg'), '  ', h('span', { class: 'enigma-legende-rueck' }, '┅ Rückweg'), ' · Taste → Steckerbrett → rechte, mittlere, linke Walze → Umkehrwalze → zurück zur Lampe');
      const nsOrt = h('div', { class: 'enigma-nachspiel' });
      const nk = S.nachspielKnopf(nsOrt, { sperre: (an) => sperre(an), beiEnde: () => zeichne(Infinity), beiLeer: (t) => erklaerung.sage('Nachspielen', t) });
      const info = h('dl', { class: 'station-kv enigma-ts-tabelle' });
      r.flaeche.append(
        h('div', { class: 'enigma-objekt' }, h('div', { class: 'enigma-buehne' }, anleitung.element, h('div', { class: 'enigma-schaubild-rahmen scroll-x' }, svg), legende, erklaerung.element), h('div', { class: 'enigma-bedienung' }, h('p', { class: 'enigma-feldtitel' }, 'Buchstaben wählen'), wahl, liste, nk.element, nsOrt, h('p', { class: 'enigma-feldtitel' }, 'Einstellung'), info)),
        S.soGehts(null, ['Vor dem Strom dreht sich die rechte Walze weiter (manchmal auch die mittlere und linke).', 'Hinweg: Steckerbrett, rechte, mittlere, linke Walze, Umkehrwalze.', 'Rückweg: durch dieselben Walzen auf anderen Drähten zurück – das Steckerbrett tauscht noch einmal, dann leuchtet die Lampe.']),
        S.hintergrund(null, hintergrundKarten())
      );
      const e0 = quelle.einst;
      for (const [dt, dd] of [['Walzen', e0.walzen.join(' – ')], ['Ringe', e0.ringe], ['UKW', e0.ukw], ['Stecker', e0.stecker || 'keine'], ['Stellung vor dem Tastendruck', quelle.stellung]]) info.append(h('dt', null, dt), h('dd', null, dd));

      function stationen(sch) {
        const w = sch.weg;
        const n = e0.walzen;
        return [
          { name: 'stecker-hin', aus: w.steckerEin, text: `Steckerbrett: ${w.taste} → ${w.steckerEin}${w.taste === w.steckerEin ? ' (kein Kabel)' : ''}` },
          ...w.vor.map((x, i) => ({ name: `vor-${i}`, aus: x.aus, text: `Walze ${x.walze} (${['rechts', 'Mitte', 'links'][i]}): ${x.ein} → ${x.aus}` })),
          { name: 'ukw', aus: w.ukwAus, text: `Umkehrwalze ${e0.ukw}: ${w.ukwEin} → ${w.ukwAus}` },
          ...w.zurueck.map((x, i) => ({ name: `zurueck-${i}`, aus: x.aus, text: `Walze ${x.walze} (${['links', 'Mitte', 'rechts'][i]}, zurück): ${x.ein} → ${x.aus}` })),
          { name: 'lampe', aus: w.lampe, text: `Steckerbrett: ${w.zurueck[2].aus} → ${w.steckerAus} · Lampe ${w.lampe}` }
        ].map((x) => ({ ...x, n }));
      }
      function grundgeruest(sch) {
        AQ.clear(svg);
        const text = (x, y, t, klasse = 'enigma-sb-titel') => s('text', { class: klasse, x, y }, t);
        const rahmen = (x0, x1) => s('rect', { class: 'enigma-sb-kasten', x: x0, y: TOP - 6, width: x1 - x0, height: 26 * RH + 12, rx: 10 });
        // Umkehrwalze
        svg.append(rahmen(G.ukwX0, G.ukwX1), text((G.ukwX0 + G.ukwX1) / 2, 30, `UKW ${e0.ukw}`), text((G.ukwX0 + G.ukwX1) / 2, 48, 'dreht nicht', 'enigma-sb-unter'));
        const u = Krypto.ENIGMA.UKW[e0.ukw];
        ABC.forEach((b, i) => {
          svg.appendChild(text(G.ukwX1 - 12, yy(b) + 4, b, 'enigma-sb-b'));
          const p = u[i];
          if (Krypto.wert(p, 0) > i) {
            const dp = Math.min(64, 10 + (Krypto.wert(p, 0) - i) * 2.4);
            svg.appendChild(s('path', { class: 'enigma-sb-draht', d: `M ${G.ukwDot} ${yy(b)} C ${G.ukwDot - dp} ${yy(b)} ${G.ukwDot - dp} ${yy(p)} ${G.ukwDot} ${yy(p)}` }));
          }
        });
        // drei Walzen: Verdrahtung in der Stellung nach dem Drehen (nur Darstellung)
        [0, 1, 2].forEach((i) => {
          const x0 = ROT_X[i];
          const name = e0.walzen[i];
          const versatz = Krypto.wert(sch.stellung[i], 0) - Krypto.wert(e0.ringe[i], 0);
          const v = Krypto.ENIGMA.WALZEN[name].verdrahtung;
          svg.append(rahmen(x0, x0 + RW), text(x0 + RW / 2, 30, `Walze ${name}`), text(x0 + RW / 2, 52, `${PLATZ[i]} · Ring ${e0.ringe[i]} · Fenster ${sch.stellung[i]}`, 'enigma-sb-unter'));
          ABC.forEach((b, r) => {
            const innen = v[Krypto.mod(r + versatz, 26)];
            const aus = ABC[Krypto.mod(Krypto.wert(innen, 0) - versatz, 26)];
            svg.appendChild(s('path', { class: 'enigma-sb-draht', d: kurve(x0 + RW - 28, yy(b), x0 + 10, yy(aus)) }));
            svg.appendChild(text(x0 + RW - 13, yy(b) + 4, ABC[Krypto.mod(r + Krypto.wert(sch.stellung[i], 0), 26)], r === 0 ? 'enigma-sb-b enigma-sb-fenster' : 'enigma-sb-b'));
          });
        });
        svg.append(rahmen(G.etwX0, G.etwX1), text((G.etwX0 + G.etwX1) / 2, 30, 'ETW'), text((G.etwX0 + G.etwX1) / 2, 48, 'Eintrittswalze', 'enigma-sb-unter'));
        svg.append(rahmen(G.stX0, G.stX1), text((G.stX0 + G.stX1) / 2, 30, 'Steckerbrett'), text((G.stX0 + G.stX1) / 2, 48, `${paareVon(e0.stecker).length} Kabel`, 'enigma-sb-unter'));
        svg.append(rahmen(G.keyX - 24, G.keyX + 24), text(G.keyX, 30, 'Taste'), text(G.keyX, 48, 'Lampe'));
        ABC.forEach((b) => {
          svg.appendChild(s('line', { class: 'enigma-sb-draht', x1: G.etwX0 + 6, y1: yy(b), x2: G.etwX1 - 6, y2: yy(b) }));
          svg.appendChild(text((G.etwX0 + G.etwX1) / 2, yy(b) + 4, b, 'enigma-sb-b'));
          svg.appendChild(s('circle', { class: 'enigma-sb-taste', 'data-buchstabe': b, cx: G.keyX, cy: yy(b), r: 8.5 }));
          svg.appendChild(text(G.keyX, yy(b) + 4, b, 'enigma-sb-b'));
          const paar = paareVon(e0.stecker).find((x) => x.includes(b));
          const p = paar ? paar.replace(b, '') : b; // Steckerbrett-Partner
          svg.appendChild(s('path', { class: `enigma-sb-draht${p !== b ? ' gesteckt' : ''}`, d: kurve(G.stR, yy(b), G.stL, yy(p)) }));
        });
      }
      let segmente = [];
      function zeichne(bis) {
        AQ.clear(liste);
        for (const k of wahl.querySelectorAll('button')) k.setAttribute('aria-pressed', String(k.dataset.buchstabe === auswahl));
        if (!auswahl) {
          grundgeruest({ stellung: quelle.stellung });
          liste.appendChild(h('li', { class: 'text-2' }, 'Wähle einen Buchstaben.'));
          nk.setze(null);
          return;
        }
        const sch = Krypto.enigmaSchritt(e0, quelle.stellung, auswahl);
        grundgeruest(sch);
        const w = sch.weg;
        const st = stationen(sch);
        // Segmente: [Station, Klasse, Pfad]
        const vx = (i, seite) => (seite === 'r' ? ROT_X[i] + RW - 28 : ROT_X[i] + 10); // i = Platz 0 links … 2 rechts
        segmente = [
          [0, 'hin', kurve(G.keyX - 9, yy(w.taste), G.stR, yy(w.taste))],
          [0, 'hin', kurve(G.stR, yy(w.taste), G.stL, yy(w.steckerEin))],
          [0, 'hin', kurve(G.stL, yy(w.steckerEin), vx(2, 'r'), yy(w.steckerEin))],
          ...w.vor.map((x, i) => [i + 1, 'hin', `${kurve(vx(2 - i, 'r'), yy(x.ein), vx(2 - i, 'l'), yy(x.aus))} ${i < 2 ? `L ${vx(1 - i, 'r')} ${yy(x.aus)}` : `L ${G.ukwDot} ${yy(x.aus)}`}`]),
          [4, 'hin', `M ${G.ukwDot} ${yy(w.ukwEin)} C ${G.ukwDot - 60} ${yy(w.ukwEin)} ${G.ukwDot - 60} ${yy(w.ukwAus)} ${G.ukwDot} ${yy(w.ukwAus)}`],
          ...w.zurueck.map((x, i) => [i + 5, 'rueck', `M ${i === 0 ? G.ukwDot : vx(i - 1, 'r')} ${yy(x.ein)} L ${vx(i, 'l')} ${yy(x.ein)} ${kurve(vx(i, 'l'), yy(x.ein), vx(i, 'r'), yy(x.aus)).replace(/^M [^C]*/, '')}`]),
          [8, 'rueck', `M ${vx(2, 'r')} ${yy(w.zurueck[2].aus)} L ${G.stL} ${yy(w.zurueck[2].aus)}`],
          [8, 'rueck', kurve(G.stL, yy(w.zurueck[2].aus), G.stR, yy(w.steckerAus))],
          [8, 'rueck', kurve(G.stR, yy(w.steckerAus), G.keyX - 9, yy(w.lampe))]
        ];
        for (const [nr, art, d] of segmente) {
          if (nr > bis) continue;
          svg.appendChild(s('path', { class: art === 'hin' ? 'enigma-hinweg' : 'enigma-rueckweg', 'data-station': String(nr), d }));
        }
        const lampe = svg.querySelector(`.enigma-sb-taste[data-buchstabe="${w.lampe}"]`);
        const taste = svg.querySelector(`.enigma-sb-taste[data-buchstabe="${w.taste}"]`);
        if (taste) taste.classList.add('taste');
        if (lampe && bis >= 8) lampe.classList.add('lampe');
        st.forEach((x, i) => liste.appendChild(h('li', { 'data-station': x.name, 'data-aus': x.aus, class: i <= bis ? 'an' : null }, x.text)));
        nk.setze({
          titel: `Stromweg für ${auswahl}`,
          start: -1,
          schritte: [{ text: `Taste ${auswahl}: Zuerst drehen die Walzen ${sch.stellungVorher} → ${sch.stellung}${sch.doppelschritt ? ' (Doppelschritt)' : ''}.`, daten: { bis: -1 } }, ...st.map((x, i) => ({ text: x.text, daten: { bis: i } }))],
          zeige: (schritt) => zeichne(schritt.daten.bis)
        });
        anleitung.setze(bis >= 8 ? 2 : 1);
      }
      function sperre(an) {
        gesperrt = an;
        S.sperre(r.flaeche, an);
        for (const k of wahl.querySelectorAll('button')) k.disabled = an;
      }
      for (const k of wahl.querySelectorAll('button')) {
        k.addEventListener('click', () => {
          if (gesperrt) return;
          auswahl = k.dataset.buchstabe;
          zeichne(Infinity);
          const w = Krypto.enigmaSchritt(e0, quelle.stellung, auswahl).weg;
          erklaerung.sage(`Taste ${auswahl}`, `Der Strom läuft über ${stationen({ weg: w }).length} Stationen und kommt bei Lampe ${w.lampe} an.`);
        });
      }
      zeichne(Infinity);
      erklaerung.sage('Innenleben', auswahl ? `Dein letzter Tastendruck: ${auswahl} → Lampe ${Krypto.enigmaSchritt(e0, quelle.stellung, auswahl).weg.lampe}.` : 'Wähle einen Buchstaben – dann siehst du, welchen Weg der Strom nimmt.');
      return { schliesse: () => nk.schliesse(), zustand: () => ({ lampe: null, auswahl }) };
    }

    /* ---------- Reiter „Vorführen“ ---------- */
    function baueVorfuehren() {
      const e0 = einstellung();
      const kurz = (t) => Krypto.gruppieren(t);
      const EXPERIMENTE = [
        {
          id: 'fuenfmal',
          titel: 'Fünfmal dieselbe Taste',
          frage: 'Was passiert, wenn du fünfmal A drückst?',
          lauf() {
            const aus = Krypto.enigma('AAAAA', e0);
            let st = e0.grund;
            const schritte = [...'AAAAA'].map((b, i) => {
              const sch = Krypto.enigmaSchritt(e0, st, b);
              st = sch.stellung;
              return { text: `${i + 1}. A: Walzen ${sch.stellungVorher} → ${sch.stellung}, Lampe ${sch.weg.lampe}.` };
            });
            return { ergebnis: `AAAAA → ${aus}: Jeder Tastendruck benutzt ein anderes Geheimtextalphabet.`, schritte };
          }
        },
        {
          id: 'selbst',
          titel: 'Kein Buchstabe wird zu sich selbst',
          frage: 'Kann E jemals als E herauskommen?',
          lauf() {
            const aus = Krypto.enigma('E'.repeat(26), e0);
            const anzahl = [...aus].filter((c) => c === 'E').length;
            return { ergebnis: `26-mal E → ${kurz(aus)}: ${anzahl === 0 ? 'kein einziges E' : `${anzahl}-mal E`}. Der Strom kommt nie auf demselben Draht zurück.`, schritte: [{ text: `26-mal E ergibt ${kurz(aus)}.` }, { text: 'Die Umkehrwalze verbindet immer zwei verschiedene Kontakte – deshalb leuchtet nie die gedrückte Taste selbst.' }] };
          }
        },
        {
          id: 'gegenprobe',
          titel: 'Gegenprobe: gleiche Einstellung, gleicher Vorgang',
          frage: 'Wie entschlüsselt man, wenn die Maschine keinen Schalter „Entschlüsseln“ hat?',
          lauf() {
            const klar = BEISPIEL.probe.toUpperCase();
            const geheim = Krypto.enigma(klar, e0);
            const zurueck = Krypto.enigma(geheim, e0);
            return { ergebnis: `${klar} → ${kurz(geheim)} → ${zurueck}: Dieselbe Einstellung macht den Geheimtext wieder zum Klartext.`, schritte: [{ text: `Verschlüsseln ab ${e0.grund}: ${klar} → ${kurz(geheim)}.` }, { text: `Walzen zurück auf ${e0.grund}, Geheimtext tippen: ${zurueck}.` }] };
          }
        },
        {
          id: 'doppelschritt',
          titel: 'Doppelschritt der mittleren Walze',
          frage: 'Beobachte die mittlere Walze ab der Stellung ADU.',
          lauf() {
            const e = { ...e0, walzen: ['I', 'II', 'III'], grund: 'ADU' };
            let st = 'ADU';
            const folge = [st];
            const schritte = [];
            for (let i = 0; i < 3; i++) {
              const sch = Krypto.enigmaSchritt(e, st, 'A');
              st = sch.stellung;
              folge.push(st);
              schritte.push({ text: `Taste ${i + 1}: ${sch.stellungVorher} → ${sch.stellung}${sch.doppelschritt ? ' – Doppelschritt: Die mittlere Walze dreht sich gleich noch einmal.' : ''}` });
            }
            return { ergebnis: `Walzen I – II – III: ${folge.join(' → ')}. Die mittlere Walze dreht sich zweimal hintereinander.`, schritte };
          }
        },
        {
          id: 'stecker',
          titel: 'Steckerbrett vertauscht vor und nach den Walzen',
          frage: 'Was macht ein einzelnes Kabel A–Z?',
          lauf() {
            const ohne = Krypto.enigmaSchritt({ ...e0, stecker: '' }, e0.grund, 'A').weg;
            const mit = Krypto.enigmaSchritt({ ...e0, stecker: 'AZ' }, e0.grund, 'A').weg;
            return { ergebnis: `Ohne Kabel: A → Lampe ${ohne.lampe}. Mit Kabel A–Z: A wird zu ${mit.steckerEin}, die Walzen liefern ${mit.zurueck[2].aus}, das Steckerbrett macht daraus ${mit.lampe}.`, schritte: [{ text: `Hinweg: A → ${mit.steckerEin} (Kabel).` }, { text: `Durch die Walzen: ${mit.steckerEin} → ${mit.zurueck[2].aus}.` }, { text: `Rückweg: ${mit.zurueck[2].aus} → ${mit.lampe}.` }] };
          }
        },
        {
          id: 'walzenlage',
          titel: 'Walzenlage ändern',
          frage: 'Wie stark ändert sich alles, wenn nur zwei Walzen getauscht werden?',
          lauf() {
            const klar = BEISPIEL.probe.toUpperCase();
            const a = Krypto.enigma(klar, { ...e0, walzen: ['I', 'II', 'III'] });
            const b = Krypto.enigma(klar, { ...e0, walzen: ['II', 'I', 'III'] });
            return { ergebnis: `I – II – III: ${kurz(a)} · II – I – III: ${kurz(b)}. Schon eine andere Lage ergibt einen völlig anderen Geheimtext.`, schritte: [{ text: `I – II – III: ${kurz(a)}.` }, { text: `II – I – III: ${kurz(b)}.` }] };
          }
        }
      ];
      const erklaerung = S.erklaerung(null);
      const nsOrt = h('div', { class: 'enigma-nachspiel' });
      const karten = EXPERIMENTE.map((x) => {
        const start = h('button', { type: 'button', class: 'knopf knopf-zweit enigma-vorfuehren-start', 'data-experiment': x.id }, '▶ Vorführen');
        const ergebnis = h('p', { class: 'enigma-ergebnis', 'aria-live': 'polite' });
        const ort = h('div', { class: 'enigma-experiment-nachspiel' });
        start.addEventListener('click', () => {
          const { ergebnis: t, schritte } = x.lauf();
          ergebnis.textContent = t;
          for (const o of r.flaeche.querySelectorAll('.enigma-experiment-nachspiel')) AQ.clear(o);
          if (aktiv) aktiv.schliesse();
          aktiv = KRLabor.nachspiel(ort, { titel: x.titel, schritte: schritte.map((sc) => ({ text: sc.text, daten: {} })), zeige: () => {} });
          erklaerung.sage(x.titel, t);
        });
        return h('section', { class: 'enigma-experiment station-karte', 'data-experiment': x.id }, h('h3', null, x.titel), h('p', { class: 'text-2' }, x.frage), start, ergebnis, ort);
      });
      let aktiv = null;
      r.flaeche.append(
        h('p', { class: 'text-2' }, `Alle Vorführungen rechnen mit deinem Tagesschlüssel aus „Maschine“: ${zusammenfassung()}.`),
        h('div', { class: 'enigma-experimente' }, karten),
        nsOrt,
        erklaerung.element,
        S.hintergrund(null, hintergrundKarten())
      );
      erklaerung.sage('Vorführen', 'Wähle ein Experiment und lass es vorführen – Schritt für Schritt.');
      return { schliesse: () => aktiv && aktiv.schliesse(), zustand: () => ({}) };
    }

    /* ---------- Reiter „Glossar“ ---------- */
    function baueGlossar() {
      const BEGRIFFE = [
        ['Walze', 'Drehbares Rad mit 26 Kontakten auf jeder Seite, innen kreuz und quer verdrahtet. Drei davon stecken in der Maschine.', 'maschine'],
        ['Ring', 'Der Buchstabenring einer Walze lässt sich gegen die Verdrahtung verdrehen (Ringstellung). Er verschiebt, wo die Kerbe sitzt und welcher Buchstabe im Fenster steht.', 'maschine'],
        ['Kerbe', 'Steht eine Walze an ihrer Kerbe, nimmt sie beim nächsten Tastendruck die linke Nachbarwalze mit.', 'maschine'],
        ['Umkehrwalze (UKW)', 'Dreht sich nicht. Sie schickt den Strom auf einem anderen Draht zurück durch die Walzen – deshalb ist die Enigma symmetrisch.', 'innenleben'],
        ['Steckerbrett', 'Kabel vertauschen Buchstabenpaare – einmal auf dem Hinweg, einmal auf dem Rückweg.', 'maschine'],
        ['Grundstellung', 'Die drei Buchstaben in den Fenstern, bevor die erste Taste gedrückt wird.', 'maschine'],
        ['Tagesschlüssel', 'Walzenlage, Ringstellung, Umkehrwalze, Stecker und Grundstellung – für einen Tag festgelegt.', 'maschine'],
        ['Crib', 'Ein vermutetes Stück Klartext („Wetterbericht“). Da kein Buchstabe zu sich selbst wird, fallen viele Stellungen sofort weg.', 'vorfuehren'],
        ['Doppelschritt', 'Steht die mittlere Walze an ihrer Kerbe, dreht sie sich beim nächsten Tastendruck noch einmal – zusammen mit der linken.', 'vorfuehren']
      ];
      const liste = h(
        'dl',
        { class: 'enigma-glossar' },
        BEGRIFFE.map(([b, t, ziel]) => {
          const knopf = reiterListe.includes(ziel) ? h('button', { type: 'button', class: 'knopf knopf-leise', 'data-ziel': ziel }, `→ ${REITER_TITEL[ziel]}`) : null;
          if (knopf) knopf.addEventListener('click', () => r.waehle(ziel, { fokus: true }));
          return [h('dt', null, b), h('dd', null, h('span', null, t), knopf ? ' ' : null, knopf)];
        })
      );
      r.flaeche.append(liste, S.hintergrund(null, hintergrundKarten(), { offen: true }));
      return { schliesse() {}, zustand: () => ({}) };
    }

    function baue(id) {
      schliesseTeil();
      AQ.clear(r.flaeche);
      teil = id === 'innenleben' ? baueInnenleben() : id === 'vorfuehren' ? baueVorfuehren() : id === 'glossar' ? baueGlossar() : baueMaschine();
    }
    baue(r.aktiv());

    return {
      schliesse() {
        schliesseTeil();
      },
      zustand() {
        const letzte = z.liste[z.liste.length - 1];
        return {
          reiter: r.aktiv(),
          einstellung: einstellung(),
          stellung: z.stellung,
          eingabe: z.liste.map((e) => e[0]).join(''),
          ausgabe: z.liste.map((e) => e[1]).join(''),
          lampe: letzte ? letzte.schritt.weg.lampe : null,
          richtung: z.richtung,
          gesperrt,
          ...(teil ? teil.zustand() : {})
        };
      }
    };
  }

  KRLabor.registriere('enigma', { titel: 'Enigma', oeffne });
})();
