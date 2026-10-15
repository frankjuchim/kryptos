/* Kryptos – Labor-Werkzeug „Runden-Labor“ (W3 §9.2, §6, Plan M6 Tasks 119/120, E83). Die 4 × 4-Bitmatrizen sind die
   Objekte: KRYPTOS-16 (auch „ohne S-Box“) und RM-16 Runde für Runde, Schritt für Schritt aufdecken; ein Bit antippen
   kippt es (Lawine, zwei Läufe nebeneinander) bzw. verfolgt seinen Weg durch die Runden.
   Rechnet nur über Krypto.*; Indexarithmetik nur für Zeilen/Spalten der Matrizen. Speichert nichts. */
'use strict';
(() => {
  const { h, s } = AQ;
  const B = KRLaborBau;
  // Standard = Testvektor des Lernverfahrens (W3 §0a, kein Lab-Wert); Pixelbild „Schlüssel“ aus W3 §9.2 (Lernmaterial);
  // Fehler-Text erfunden
  const BEISPIEL = {
    block: 'OK',
    schluessel: 'A36D',
    lawineSchluessel: '2B7E',
    modiSchluessel: '2B7E',
    iv: '1917',
    fehlertext: 'Lachs im Teich',
    pixel: [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '......########..................',
    '.....##########.................',
    '....############................',
    '...#####....#####...............',
    '...####......####...............',
    '...###........################..',
    '...###........################..',
    '...###........################..',
    '...###........################..',
    '...####......####.....###.####..',
    '...#####....#####.....###.####..',
    '....############......###.####..',
    '.....##########.......###.####..',
    '......########........###.####..',
    '..........................####..',
    '..........................####..',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................'
    ]
  };
  const REITER_TITEL = { runden: 'Runde für Runde', lawine: 'Lawine', verfolgung: 'Bit-Verfolgung', modi: 'ECB vs. CBC', fehler: 'Fehler einbauen', enigma: 'Mini-Enigma' };
    const VARIANTEN = [
    { id: 'kryptos16', titel: 'KRYPTOS-16' },
    { id: 'ohneSBox', titel: 'ohne S-Box' },
    { id: 'rm16', titel: 'RM-16' }
  ];
  const MITTE_TITEL = { kryptos16: 'nach S-Box', ohneSBox: 'S-Box ausgelassen', rm16: 'nach Zeilenrotation' };
  // Mittelwerte aus W3 §0a.8 (Info neben dem Zähler, keine Rechnung im Werkzeug)
  const LAWINE_MITTEL = ['16,4 %', '43,1 %', '48,2 %', '49,4 %'];
  const HEX4 = /^[0-9A-Fa-f]{4}$/;
  // Verdrahtung der Mini-Enigma laut W3 Kür K2 (Anzeige als Vorgabe für „eigene Verdrahtung“; gerechnet wird in Krypto.miniEnigma)
  const SPEC_VERDRAHTUNG = { walze: 'DAHBFCGE', reflektor: 'EGHFADBC' };
  const ME = [...'ABCDEFGH'];
  const PIXEL = 32;

  /** Bitnummer 1 … 16 (b1 = höchstwertig, zeilenweise) ↔ Zeile/Spalte ab 1 – reine Indexarithmetik der Matrix. */
  const POSITION = [];
  for (let z = 1; z <= 4; z++) for (let s = 1; s <= 4; s++) POSITION.push({ bit: 4 * (z - 1) + s, z, s });
  const ortVon = (bit) => POSITION[bit - 1];

  const istKryptoFehler = (e) => e && e.name === 'KryptoFehler';
  const bits16 = (n) => Krypto.byteZuBits(n, 16);
  const vonBits = (b) => Krypto.bitsZuByte(b);
  const einsen = (bits) => [...bits].filter((c) => c === '1').length;
  /** Maske mit Einsen an den Bitnummern der Menge (für Krypto.xorBits). */
  const maske = (menge) => POSITION.map((p) => (menge.has(p.bit) ? '1' : '0')).join('');

  /** Block: 2 Zeichen (ASCII der Anlage) oder 4 Hexziffern → 16-Bit-Zahl; sonst KryptoFehler. */
  function leseBlock(eingabe) {
    const t = String(eingabe ?? '').trim();
    if (HEX4.test(t) && [...t].length === 4) return vonBits(Krypto.vonHex(t).map((b) => Krypto.byteZuBits(b)).join(''));
    if ([...t].length === 2) return vonBits(Krypto.textZuBytes(t).map((b) => Krypto.byteZuBits(b)).join(''));
    throw new Krypto.KryptoFehler('Klartextblock: 2 Zeichen (z. B. OK) oder 4 Hexziffern (z. B. 4F4B).');
  }
  function leseSchluessel(eingabe) {
    const t = String(eingabe ?? '').replace(/\s+/g, '');
    if (HEX4.test(t)) return vonBits(Krypto.vonHex(t).map((b) => Krypto.byteZuBits(b)).join(''));
    if (/^[01]{16}$/.test(t)) return vonBits(t);
    throw new Krypto.KryptoFehler('Schlüssel: 4 Hexziffern (16 Bit), z. B. A36D.');
  }

  /** Protokoll je Variante: { ergebnis, runden: [{ runde, eingang, schluessel, nachXor, mitte, nachTransposition }] } */
  function protokoll(block, schluessel, runden, variante) {
    if (variante === 'rm16') {
      const p = Krypto.rm16.verschluesseln(block, schluessel, { runden, protokoll: true });
      return { ergebnis: p.ergebnis, runden: p.runden.map((r) => ({ ...r, mitte: r.nachRotation })) };
    }
    const p = Krypto.kryptos16.verschluesseln(block, schluessel, { runden, protokoll: true, sbox: variante === 'kryptos16' });
    return { ergebnis: p.ergebnis, runden: p.runden.map((r) => ({ ...r, mitte: r.nachSBox })) };
  }

  /**
   * 4 × 4-Bitmatrix als echte Tabelle (caption mit Titel und Hex). o = { titel, klasse, zelle(bit) → Klassen,
   * knopf: { beiKlick(bit), gedrueckt(bit), gesperrt }, verdeckt }. Bits als Knöpfe: Pfeiltasten wandern (Roving).
   */
  function bitmatrix(wert, o = {}) {
    const b = bits16(wert);
    const knoepfe = [];
    const zeilen = [1, 2, 3, 4].map((z) =>
      h(
        'tr',
        null,
        POSITION.filter((p) => p.z === z).map((p) => {
          const v = o.verdeckt ? '?' : b[p.bit - 1];
          const kl = typeof o.zelle === 'function' && !o.verdeckt ? o.zelle(p.bit) : '';
          if (!o.knopf) return h('td', { class: kl || null }, v);
          const an = typeof o.knopf.gedrueckt === 'function' && o.knopf.gedrueckt(p.bit);
          const kn = h('button', { type: 'button', class: `gitter-bit${kl ? ' ' + kl : ''}`, 'data-bit': String(p.bit), 'aria-pressed': String(!!an), tabindex: p.bit === 1 ? '0' : '-1', disabled: !!o.knopf.gesperrt, 'aria-label': `Bit ${p.bit} (Zeile ${p.z}, Spalte ${p.s}): ${v}` }, v);
          if (!o.knopf.gesperrt) kn.addEventListener('click', () => o.knopf.beiKlick(p.bit));
          knoepfe.push(kn);
          return h('td', { class: kl || null }, kn);
        })
      )
    );
    const tabelle = h('table', { class: `bitgitter ${o.klasse || 'bitmatrix'}${o.verdeckt ? ' verdeckt' : ''}` }, h('caption', null, o.titel || '', h('span', { class: 'bitgitter-hex' }, o.verdeckt ? '= ?' : `= ${Krypto.hex(wert)}`)), h('tbody', null, zeilen));
    if (knoepfe.length && !o.knopf.gesperrt) {
      tabelle.addEventListener('keydown', (e) => {
        const t = e.target;
        if (!t.dataset || !t.dataset.bit) return;
        const p = Number(t.dataset.bit);
        const ort = ortVon(p);
        const ziel = { ArrowRight: ort.s < 4 ? p + 1 : null, ArrowLeft: ort.s > 1 ? p - 1 : null, ArrowDown: ort.z < 4 ? p + 4 : null, ArrowUp: ort.z > 1 ? p - 4 : null, Home: 1, End: 16 }[e.key];
        if (ziel === undefined) return;
        e.preventDefault();
        if (ziel === null) return;
        for (const k of knoepfe) k.setAttribute('tabindex', Number(k.dataset.bit) === ziel ? '0' : '-1');
        knoepfe[ziel - 1].focus();
      });
    }
    return tabelle;
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
    return { element: h('div', { class: `labor-basis ${klasse}`, role: 'radiogroup', 'aria-label': aria }, knoepfe), sperre: (an) => knoepfe.forEach((k) => (k.disabled = !!an)) };
  }

  function oeffne(container, voreinstellung, umgebung) {
    const v = voreinstellung || {};
    const reiterListe = KRLabor.reiterFuer('runden', v, umgebung);
    let variante = VARIANTEN.some((x) => x.id === v.variante) ? v.variante : 'kryptos16';
    let blockEingabe = typeof v.block === 'string' ? v.block.slice(0, 16) : BEISPIEL.block;
    let schluesselEingabe = typeof v.schluessel === 'string' ? v.schluessel.slice(0, 20) : BEISPIEL.schluessel;
    // M11: ohne eigene Eingaben zeigt die Lawine ein eigenes Beispiel – „OK“ mit A36D ist die Aufgabe W3-L2-06 (Erkenner)
    let eigeneEingaben = typeof v.block === 'string' || typeof v.schluessel === 'string';
    let runden = Number.isInteger(v.runden) && v.runden >= 1 && v.runden <= 4 ? v.runden : variante === 'rm16' ? 3 : 4;
    let block = null;
    let schluessel = null;
    let p = null; // Protokoll
    let nachspiel = null;
    let schrittweise = false;
    const gekippt = { klartext: new Set(), schluessel: new Set() };
    let verfolgt = null; // Bitnummer
    let zaehler = [];
    let weg = null;
    // Reiter 4–6 (Task 120)
    let pixel = BEISPIEL.pixel.slice();
    let cursor = { z: 0, s: 0 };
    let modiK = BEISPIEL.modiSchluessel;
    let modiIv = BEISPIEL.iv;
    let kacheln = null;
    let fehlerText = typeof v.block === 'string' && [...v.block].length > 4 ? v.block.slice(0, 16) : BEISPIEL.fehlertext;
    let fehlerBits = null; // { ecb, cbc } veränderte Geheimtexte als Bitfolgen
    let geloescht = false;
    let betroffen = { ecb: [], cbc: [] };
    const startStellung = typeof v.stellung === 'string' && ME.includes(v.stellung.toUpperCase()) ? v.stellung.toUpperCase() : 'A';
    let stellung0 = Krypto.wert(startStellung, 0); // Stellung A … H → 0 … 7
    let enigmaText = typeof v.text === 'string' ? Krypto.nurBuchstaben(v.text).slice(0, 40) : '';
    let enigmaAusgabe = '';
    let verdrahtung = 'spec';
    let eigene = { ...SPEC_VERDRAHTUNG };

    const r = B.reiter(reiterListe.map((id) => ({ id, titel: REITER_TITEL[id] })), { aktiv: reiterListe[0], beiWechsel: baue });
    const wurzel = h(
      'div',
      { class: 'labor-werkzeug runden-werkzeug' },
      umgebung && umgebung.rolle === 'lehrkraft'
        ? h('p', { class: 'runden-lehrkraft text-2', role: 'note' }, 'Hinweis für Lehrkräfte: Mit „RM-16“ rechnet das Runden-Labor die Teilaufgaben b) und d) des Papier-Bosses W3 vor. Sperren Sie das Runden-Labor in der Papier-Boss-Stunde über die Werkzeug-Freigaben des Kurses.')
        : null,
      r.element
    );
    container.appendChild(wurzel);

    function rechne() {
      block = null;
      schluessel = null;
      p = null;
      const fehler = [];
      try {
        block = leseBlock(blockEingabe);
      } catch (e) {
        if (!istKryptoFehler(e)) throw e;
        fehler.push(e.message);
      }
      try {
        schluessel = leseSchluessel(schluesselEingabe);
      } catch (e) {
        if (!istKryptoFehler(e)) throw e;
        fehler.push(e.message);
      }
      if (block !== null && schluessel !== null) p = protokoll(block, schluessel, runden, variante);
      return fehler;
    }

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
    /** Aufgabenwerte erkannt? → geführter Modus bzw. „nicht verfügbar“; true = nichts ausgeben */
    function erkenne(id, eingaben, werte) {
      if (sofort && mitGefuehrt && HOOKS[id]) {
        sofort = false;
        starteGefuehrt(id, werte);
        return true;
      }
      return B.erkenne(r.flaeche, `runden.${id}`, eingaben, umgebung, erkVerlauf, { gefuehrt: mitGefuehrt && HOOKS[id] ? () => starteGefuehrt(id, werte) : null }) !== 'frei';
    }
    /** 16-Bit-Block und -Schlüssel als Erkenner-Eingaben (Bitfolgen und Bytepaare) */
    const blockEingaben = (b, k) => {
      const x = bits16(b);
      const y = bits16(k);
      return { bits: [x, y], bitpaare: [[x.slice(0, 8), y.slice(0, 8)], [x.slice(8), y.slice(8)]] };
    };

    /* ---------- Geführter Modus (M11 Task 245, E208): Teilschritte mit markiertem Eingang, Mini-Enigma Stufe für Stufe ---------- */
    const gruppen = (bits) => [0, 4, 8, 12].map((i) => bits.slice(i, i + 4));
    /** werte = { block, schluessel, runden, variante } – Lauf A Runde für Runde (auch Lawine) */
    function rundenHook(container, werte) {
      const R = Number.isInteger(werte.runden) && werte.runden >= 1 && werte.runden <= 4 ? werte.runden : 4;
      const vari = VARIANTEN.some((x) => x.id === werte.variante) ? werte.variante : 'kryptos16';
      const mitMitte = vari !== 'ohneSBox';
      // Zeilen des Rasters: Eingang, je Runde K, ⊕, (Mitte), Transposition
      const zeilen = [{ titel: 'Klartextblock', fest: bits16(werte.block) }];
      const schritte = [];
      const ziele = []; // je Schritt: { zeile, spalte (null = ganze Zeile), eingang: [[z, s] …] }
      let zustand = 0; // Zeile des aktuellen Zustands
      let kVorher = null;
      for (let rd = 1; rd <= R; rd++) {
        const kZeile = zeilen.length;
        zeilen.push({ titel: `K${rd}`, fest: rd === 1 ? bits16(werte.schluessel) : null });
        if (rd > 1) {
          schritte.push({ text: `Runde ${rd}: K${rd} = K${rd - 1} um 4 Bit nach links rotiert (Vierergruppen rücken eine Stelle nach links)`, feld: { beschriftung: `K${rd} (16 Bit)`, art: 'bits' } });
          ziele.push({ zeile: kZeile, eingang: [0, 1, 2, 3].map((x) => [kVorher, x]) });
        }
        const xZeile = zeilen.length;
        zeilen.push({ titel: `nach ⊕ K${rd}`, fest: null });
        schritte.push({ text: `Runde ${rd}: Zustand ⊕ K${rd} (Bit für Bit)`, feld: { beschriftung: `nach ⊕ K${rd} (16 Bit)`, art: 'bits' } });
        ziele.push({ zeile: xZeile, eingang: [0, 1, 2, 3].flatMap((x) => [[zustand, x], [kZeile, x]]) });
        let tEingang = xZeile;
        if (mitMitte) {
          const mZeile = zeilen.length;
          zeilen.push({ titel: vari === 'rm16' ? `Runde ${rd}: rotiert` : `Runde ${rd}: S-Box`, fest: null });
          for (let zz = 1; zz <= 4; zz++) {
            schritte.push({
              text: vari === 'rm16' ? `Runde ${rd}: Zeile ${zz} um ${zz - 1} ${zz - 1 === 1 ? 'Stelle' : 'Stellen'} nach links rotieren` : `Runde ${rd}: Zeile ${zz} (Vierergruppe ${zz}) mit der S-Box ersetzen`,
              feld: { beschriftung: `Zeile ${zz} (4 Bit)`, art: 'bits' }
            });
            ziele.push({ zeile: mZeile, spalte: zz - 1, eingang: [[xZeile, zz - 1]] });
          }
          tEingang = mZeile;
        }
        const tZeile = zeilen.length;
        zeilen.push({ titel: `nach Runde ${rd}`, fest: null });
        schritte.push({ text: `Runde ${rd}: Transposition – Zeile z wird Spalte z`, feld: { beschriftung: `nach Runde ${rd} (16 Bit)`, art: 'bits' } });
        ziele.push({ zeile: tZeile, eingang: [0, 1, 2, 3].map((x) => [tEingang, x]) });
        zustand = tZeile;
        kVorher = kZeile;
      }
      if (vari === 'kryptos16') {
        KRGefuehrt.raster(container, {
          zeilen: 2,
          spalten: 16,
          caption: 'S-Box (W3 §0a.4)',
          zeilenKopf: (z) => (z === 0 ? 'Eingang' : 'S'),
          spaltenKopf: (j) => Krypto.hex([j]).slice(1),
          inhalt: (z, j) => (z === 0 ? Krypto.byteZuBits(j, 4) : Krypto.byteZuBits(Krypto.kryptos16.SBOX[j], 4))
        });
      }
      const tab = KRGefuehrt.raster(container, {
        zeilen: zeilen.length,
        spalten: 4,
        caption: `${vari === 'rm16' ? 'RM-16' : vari === 'ohneSBox' ? 'KRYPTOS-16 ohne S-Box' : 'KRYPTOS-16'}, ${R} ${R === 1 ? 'Runde' : 'Runden'}: Zeilen der Bitmatrix`,
        zeilenKopf: (z) => zeilen[z].titel,
        spaltenKopf: (j) => `Zeile ${j + 1}`,
        inhalt: (z, j) => (zeilen[z].fest ? gruppen(zeilen[z].fest)[j] : null)
      });
      return {
        schritte,
        markiere(i, e) {
          tab.leeren();
          e.forEach((x, j) => {
            if (!x) return;
            const b = KRGefuehrt.norm('bits', x);
            const zl = ziele[j];
            if (Number.isInteger(zl.spalte)) tab.eintrag(zl.zeile, zl.spalte, b);
            else gruppen(b).forEach((g, sp) => g && tab.eintrag(zl.zeile, sp, g));
          });
          tab.markiere(ziele[i].eingang);
        },
        korrekt() {
          const p0 = protokoll(werte.block, werte.schluessel, R, vari);
          const aus = [];
          for (const rd of p0.runden) {
            if (rd.runde > 1) aus.push(bits16(rd.schluessel));
            aus.push(bits16(rd.nachXor));
            if (mitMitte) aus.push(...gruppen(bits16(rd.mitte)));
            aus.push(bits16(rd.nachTransposition));
          }
          return aus;
        }
      };
    }
    const STATIONEN = ['+ s: zur Walze', 'W: durch die Walze', '− s: zum Reflektor', 'R: Reflektor', '+ s: zurück zur Walze', 'W⁻¹: Walze rückwärts', '− s: zur Lampe'];
    /** werte = { text (A–H), stellung0 } – Standard-Verdrahtung, Stufe für Stufe; Lampe erst nach der Freigabe */
    function enigmaHook(container, werte) {
      const t = [...Krypto.nurBuchstaben(String(werte.text || ''))].slice(0, 40);
      const s0 = Number.isInteger(werte.stellung0) ? werte.stellung0 : 0;
      const stellungen = t.map((_, i) => Krypto.buchstabe(Krypto.mod(s0 + i, 8), 0));
      const verdr = KRGefuehrt.raster(container, {
        zeilen: 3,
        spalten: 8,
        caption: 'Standard-Verdrahtung (W3 K2): Walze W und Reflektor R',
        zeilenKopf: (z) => ['Buchstabe', 'Walze W', 'Reflektor R'][z],
        spaltenKopf: (j) => ME[j],
        inhalt: (z, j) => [ME[j], SPEC_VERDRAHTUNG.walze[j], SPEC_VERDRAHTUNG.reflektor[j]][z]
      });
      const weg = KRGefuehrt.raster(container, {
        zeilen: t.length,
        spalten: 7,
        caption: 'Stromweg: je Buchstabe sieben Stationen',
        zeilenKopf: (i) => `${t[i]} (Stellung ${stellungen[i]})`,
        spaltenKopf: (j) => String(j + 1)
      });
      const lampen = ME.map((b) => h('span', { class: 'lampe', 'data-lampe': b }, b));
      container.appendChild(h('div', { class: 'enigma-lampen', 'aria-hidden': 'true' }, lampen));
      let frei = null;
      let jetzt = 0; // Buchstabe des aktuellen Schritts
      const lampe = () => {
        for (const l of lampen) l.classList.toggle('leuchtet', !!frei && l.dataset.lampe === frei[7 * jetzt + 6]);
      };
      const schritte = [];
      t.forEach((b, i) => STATIONEN.forEach((st, j) => schritte.push({ text: `Buchstabe ${i + 1} (${b}, Stellung ${stellungen[i]}, s = ${Krypto.wert(stellungen[i], 0)}): Station ${j + 1} ${st}`, feld: { beschriftung: `Station ${j + 1}`, art: 'buchstabe' } })));
      return {
        schritte,
        markiere(i, e) {
          weg.leeren();
          e.forEach((x, j) => {
            const { q, r: rest } = Krypto.teileMitRest(j, 7);
            if (x) weg.eintrag(q, rest, x);
          });
          const { q: n, r: j } = Krypto.teileMitRest(i, 7);
          const ein = j === 0 ? t[n] : Krypto.nurBuchstaben(e[i - 1] || '');
          const spalte = /^[A-H]$/.test(ein) ? Krypto.wert(ein, 0) : -1;
          const marken = [];
          if (spalte >= 0) {
            if (j === 1) marken.push([1, spalte]);
            else if (j === 3) marken.push([2, spalte]);
            else if (j === 5) ME.forEach((_, x) => SPEC_VERDRAHTUNG.walze[x] === ein && marken.push([1, x]));
            else marken.push([0, spalte]);
          }
          verdr.markiere(marken);
          jetzt = n;
          lampe();
        },
        korrekt: () => t.flatMap((b, i) => Krypto.miniEnigma.weg(b, stellungen[i]).stationen),
        nachFreigabe(richtig) {
          frei = richtig;
          lampe();
        }
      };
    }
    const HOOKS = { runden: rundenHook, lawine: rundenHook, enigma: enigmaHook };
    // Angaben bleiben im geführten Modus änderbar: Name → Feld im freien Modus
    const FELD = { block: 'input.runden-block', schluessel: 'input.runden-schluessel' };
    let fokusAngabe = null;
    function fokusName() {
      const a = typeof document !== 'undefined' ? document.activeElement : null;
      if (!a || !wurzel.contains(a)) return null;
      if (a.dataset && a.dataset.name) return a.dataset.name;
      const eintrag = Object.entries(FELD).find(([, sel]) => a.matches && a.matches(sel));
      return eintrag ? eintrag[0] : null;
    }
    const fokusEnde = (f) => {
      if (!f) return;
      f.focus();
      const n = String(f.value).length;
      if (typeof f.setSelectionRange === 'function') f.setSelectionRange(n, n);
    };
    function starteGefuehrt(id, werte) {
      const aktiv = typeof document !== 'undefined' ? document.activeElement : null;
      const fokusFeld = fokusAngabe || fokusName();
      const textFokus = !fokusFeld && !!aktiv && wurzel.contains(aktiv);
      fokusAngabe = null;
      schliesseTeile();
      AQ.clear(r.flaeche);
      gefuehrt = KRGefuehrt.starte(r.flaeche, HOOKS[id], {
        felder: id === 'enigma'
          ? null
          : {
              felder: [{ name: 'block', beschriftung: 'Klartextblock (2 Zeichen oder 4 Hex)', wert: blockEingabe, max: 20 }, { name: 'schluessel', beschriftung: 'Schlüssel K (4 Hex)', wert: schluesselEingabe, max: 20 }],
              fokus: fokusFeld,
              beiAenderung: (w, name) => {
                blockEingabe = String(w.block || '').slice(0, 20);
                schluesselEingabe = String(w.schluessel || '').slice(0, 20);
                eigeneEingaben = true;
                fokusAngabe = name;
                baue(id);
                if (!gefuehrt) {
                  fokusAngabe = null;
                  fokusEnde(r.flaeche.querySelector(FELD[name]));
                }
              }
            },
        text: id === 'enigma'
          ? {
              beschriftung: 'Text (nur A–H, bis 40 Zeichen)',
              max: 40,
              wert: werte.text,
              art: 'klartext',
              fokus: textFokus,
              beiAenderung: (t) => {
                enigmaText = t;
                baue(id);
                B.fokusAmEnde(r.flaeche);
              }
            }
          : null,
        werte,
        umgebung,
        aufgabe: fuehrung && fuehrung.aufgabe ? fuehrung.aufgabe : null,
        titel: id === 'enigma' ? 'Mini-Enigma' : 'Runden-Labor',
        beiEigeneWerte: () => {
          if (erkVerlauf) erkVerlauf.leeren();
          fuehrung = null;
          if (id === 'enigma') enigmaText = '';
          else {
            blockEingabe = '';
            schluesselEingabe = '';
          }
          baue(id);
        }
      });
    }

    /** Gemeinsame Steuerung (Block, Schlüssel, Runden, Variante); beiAenderung baut nur den Inhalt neu. */
    function steuerung(beiAenderung, id) {
      const feld = (klasse, titel, wert, setze) => {
        const id = B.neueId(klasse);
        const f = h('input', { type: 'text', id, class: klasse, autocomplete: 'off', spellcheck: 'false', autocapitalize: 'characters' });
        f.value = wert;
        f.addEventListener('input', () => {
          setze(f.value.slice(0, 20));
          aktualisiere();
        });
        return { element: h('div', { class: 'labor-textfeld runden-feld' }, h('label', { for: id }, titel), f), f };
      };
      if (!eigeneEingaben) {
        blockEingabe = BEISPIEL.block;
        schluesselEingabe = id === 'lawine' ? BEISPIEL.lawineSchluessel : BEISPIEL.schluessel;
      }
      const fb = feld('runden-block', 'Klartextblock (2 Zeichen oder 4 Hex)', blockEingabe, (x) => {
        blockEingabe = x;
        eigeneEingaben = true;
      });
      const fk = feld('runden-schluessel', 'Schlüssel K (4 Hex)', schluesselEingabe, (x) => {
        schluesselEingabe = x;
        eigeneEingaben = true;
      });
      const zahl = B.zahl({ beschriftung: 'Runden R', min: 1, max: 4, wert: runden, beiWechsel: (n) => { runden = n; aktualisiere(); } });
      const wahl = radiogruppe(VARIANTEN, variante, 'variante', 'Variante', 'runden-variante', (x) => {
        variante = x;
        if (x === 'rm16') {
          runden = 3;
          zahl.setze(3);
        }
        aktualisiere();
      });
      const hinweisOrt = h('div', { class: 'runden-hinweis' });
      const ergebnis = h('p', { class: 'runden-ergebnis', 'aria-live': 'polite' });
      const element = h('div', { class: 'runden-steuerung' }, h('div', { class: 'labor-steuer' }, fb.element, fk.element, zahl.element), wahl.element, hinweisOrt, ergebnis);
      function aktualisiere() {
        const fehler = rechne();
        if (p && id && erkenne(id, blockEingaben(block, schluessel), { block, schluessel, runden, variante })) return;
        AQ.clear(hinweisOrt);
        for (const f of fehler) hinweisOrt.appendChild(B.hinweis('warnung', f));
        if (variante === 'rm16' && p) hinweisOrt.appendChild(B.hinweis('info', 'RM-16: Zeilenrotation statt S-Box – Zeile z wird um z − 1 Stellen nach links rotiert (W3 §6).'));
        if (variante === 'ohneSBox' && p) hinweisOrt.appendChild(B.hinweis('info', 'Ohne S-Box ist jede Runde linear: XOR und Transposition – gut zu sehen, aber leicht zu brechen.'));
        ergebnis.textContent = p ? `Geheimtextblock nach ${runden} ${runden === 1 ? 'Runde' : 'Runden'}: ${Krypto.hex(p.ergebnis)} = ${Krypto.gruppieren(bits16(p.ergebnis), 4)}` : '';
        beiAenderung();
      }
      return {
        element,
        aktualisiere,
        sperre(an) {
          fb.f.disabled = !!an;
          fk.f.disabled = !!an;
          zahl.sperre(an);
          wahl.sperre(an);
        }
      };
    }

    /* ======================= Runde für Runde ======================= */
    function baueRunden() {
      const inhalt = h('div', { class: 'runden-inhalt' });
      const nsOrt = h('div', { class: 'runden-nachspiel' });
      const schalterId = B.neueId('schrittweise');
      const schalter = h('input', { type: 'checkbox', id: schalterId, class: 'schrittweise' });
      schalter.checked = schrittweise;
      const st = steuerung(() => {
        zeigeNachspiel();
      }, 'runden');
      schalter.addEventListener('change', () => {
        schrittweise = schalter.checked;
        zeigeNachspiel();
      });
      r.flaeche.append(st.element, h('label', { class: 'runden-schalter', for: schalterId }, schalter, 'Schritt für Schritt aufdecken'), nsOrt, inhalt);

      /** Reihenfolge der aufdeckbaren Matrizen: Runde 1 Eingang, dann je Runde XOR, Mitte, Transposition. */
      function folge() {
        const f = [];
        p.runden.forEach((rd) => {
          if (rd.runde === 1) f.push({ runde: 1, art: 'eingang' });
          f.push({ runde: rd.runde, art: 'nachXor' }, { runde: rd.runde, art: 'mitte' }, { runde: rd.runde, art: 'nachTransposition' });
        });
        return f;
      }
      function zeigeRunden(sichtbar) {
        AQ.clear(inhalt);
        if (!p) return;
        const f = folge();
        const offen = new Set(f.slice(0, sichtbar === undefined ? f.length : sichtbar + 1).map((x) => `${x.runde}-${x.art}`));
        const istOffen = (runde, art) => (art === 'eingang' && runde > 1 ? offen.has(`${runde - 1}-nachTransposition`) : offen.has(`${runde}-${art}`));
        for (const rd of p.runden) {
          const fig = (art, titel) => h('figure', { class: 'runde-schritt' }, bitmatrix(rd[art], { titel, verdeckt: !istOffen(rd.runde, art) }));
          inhalt.appendChild(
            h(
              'section',
              { class: 'runde', 'aria-label': `Runde ${rd.runde}` },
              h('h3', null, `Runde ${rd.runde}`),
              h(
                'div',
                { class: 'runde-matrizen' },
                fig('eingang', 'Eingang'),
                h('figure', { class: 'runde-schritt runde-schluessel' }, bitmatrix(rd.schluessel, { titel: `Rundenschlüssel K${rd.runde}`, klasse: 'schluesselmatrix' })),
                fig('nachXor', `nach XOR mit K${rd.runde}`),
                fig('mitte', MITTE_TITEL[variante]),
                fig('nachTransposition', 'nach Transposition')
              )
            )
          );
        }
      }
      function zeigeNachspiel() {
        schliesseTeile();
        AQ.clear(nsOrt);
        if (!p || !schrittweise) {
          zeigeRunden();
          return;
        }
        const texte = { eingang: (rd) => `Runde ${rd.runde}: Eingang ${Krypto.hex(rd.eingang)}`, nachXor: (rd) => `Runde ${rd.runde}: XOR mit K${rd.runde} = ${Krypto.hex(rd.schluessel)} → ${Krypto.hex(rd.nachXor)}`, mitte: (rd) => (variante === 'kryptos16' ? `Runde ${rd.runde}: S-Box auf jede Zeile → ${Krypto.hex(rd.mitte)}` : variante === 'rm16' ? `Runde ${rd.runde}: Zeilenrotation → ${Krypto.hex(rd.mitte)}` : `Runde ${rd.runde}: S-Box ausgelassen → ${Krypto.hex(rd.mitte)}`), nachTransposition: (rd) => `Runde ${rd.runde}: Transposition (Zeile ↔ Spalte) → ${Krypto.hex(rd.nachTransposition)}` };
        nachspiel = KRLabor.nachspiel(nsOrt, {
          titel: 'Runde für Runde aufdecken',
          schritte: folge().map((x) => ({ text: texte[x.art](p.runden[x.runde - 1]), daten: x })),
          zeige(_s, i) {
            zeigeRunden(i);
          },
          beiLauf: (an) => {
            st.sperre(an);
            schalter.disabled = !!an;
          }
        });
      }
      st.aktualisiere();
    }

    /* ======================= Lawine ======================= */
    function baueLawine() {
      const eingabe = h('div', { class: 'lawine-eingabe' });
      const laeufe = h('div', { class: 'laeufe' });
      const zaehlerOrt = h('div', { class: 'lawine-zaehler-ort' });
      const zurueck = h('button', { type: 'button', class: 'knopf knopf-leise lawine-zurueck' }, 'Alle Bits zurückkippen');
      zurueck.addEventListener('click', () => {
        gekippt.klartext.clear();
        gekippt.schluessel.clear();
        zeige();
      });
      const st = steuerung(() => zeige(), 'lawine');
      r.flaeche.append(st.element, h('p', { class: 'text-2' }, 'Tippe ein Bit des Klartextblocks oder des Schlüssels an – es kippt. Lauf B rechnet mit den gekippten Bits.'), eingabe, zurueck, zaehlerOrt, laeufe);
      function zeige() {
        AQ.clear(eingabe);
        AQ.clear(laeufe);
        AQ.clear(zaehlerOrt);
        zaehler = [];
        if (!p) return;
        const kippe = (menge, bit) => {
          if (menge.has(bit)) menge.delete(bit);
          else menge.add(bit);
          zeige();
          const kn = eingabe.querySelector(`.${menge === gekippt.klartext ? 'lawine-klartext' : 'lawine-schluessel'} button.gitter-bit[data-bit="${bit}"]`);
          if (kn) kn.focus();
        };
        const bB = vonBits(Krypto.xorBits(bits16(block), maske(gekippt.klartext)));
        const kB = vonBits(Krypto.xorBits(bits16(schluessel), maske(gekippt.schluessel)));
        eingabe.append(
          h('figure', { class: 'lawine-klartext' }, bitmatrix(bB, { titel: 'Klartextblock (Lauf B)', klasse: 'eingabematrix', zelle: (bit) => (gekippt.klartext.has(bit) ? 'anders' : ''), knopf: { beiKlick: (bit) => kippe(gekippt.klartext, bit), gedrueckt: (bit) => gekippt.klartext.has(bit) } })),
          h('figure', { class: 'lawine-schluessel' }, bitmatrix(kB, { titel: 'Schlüssel (Lauf B)', klasse: 'eingabematrix', zelle: (bit) => (gekippt.schluessel.has(bit) ? 'anders' : ''), knopf: { beiKlick: (bit) => kippe(gekippt.schluessel, bit), gedrueckt: (bit) => gekippt.schluessel.has(bit) } }))
        );
        const pB = protokoll(bB, kB, runden, variante);
        const diff = p.runden.map((rd, i) => Krypto.xorBits(bits16(rd.nachTransposition), bits16(pB.runden[i].nachTransposition)));
        zaehler = diff.map(einsen);
        const lauf = (klasse, titel, prot, anfang) =>
          h(
            'div',
            { class: `lauf ${klasse}` },
            h('h3', null, titel),
            h('div', { class: 'lauf-matrizen' }, bitmatrix(anfang, { titel: 'Klartextblock' }), prot.runden.map((rd, i) => bitmatrix(rd.nachTransposition, { titel: `nach Runde ${rd.runde}`, zelle: (bit) => (diff[i][bit - 1] === '1' ? 'anders' : '') })))
          );
        laeufe.append(lauf('lauf-a', 'Lauf A – ohne Kippen', p, block), lauf('lauf-b', 'Lauf B – mit gekippten Bits', pB, bB));
        zaehlerOrt.append(
          h(
            'div',
            { class: 'scroll-x' },
            h(
              'table',
              { class: 'labor-tabelle lawine-zaehler' },
              h('caption', null, 'Gekippte Bits nach jeder Runde (Lauf A gegen Lauf B)'),
              h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Runde'), h('th', { scope: 'col' }, 'gekippte Bits'), h('th', { scope: 'col' }, 'Anteil (Linie = 8 von 16)'))),
              h(
                'tbody',
                null,
                zaehler.map((n, i) => {
                  const balken = h('span', { class: 'lawine-balken' }, h('span', { class: 'lawine-fuellung' }), h('span', { class: 'lawine-linie', 'aria-hidden': 'true' }));
                  balken.style.setProperty('--anteil', `${(n * 100) / 16}%`);
                  return h('tr', null, h('th', { scope: 'row' }, `Runde ${i + 1}`), h('td', null, `${n} von 16`), h('td', null, balken));
                })
              )
            )
          ),
          h('p', { class: 'lawine-info text-2' }, `Zum Vergleich KRYPTOS-16 im Mittel über alle Klartexte (W3 §0a.8): ${LAWINE_MITTEL.slice(0, runden).join(' · ')} – ideal sind 50 % (8 von 16 Bits). Hier zählt nur dieser eine Lauf.`)
        );
      }
      st.aktualisiere();
    }

    /* ======================= Bit-Verfolgung ======================= */
    function baueVerfolgung() {
      const eingabe = h('div', { class: 'verfolgung-eingabe' });
      const inhalt = h('div', { class: 'verfolgung-inhalt' });
      const liste = h('ol', { class: 'verfolgung-liste', 'aria-live': 'polite' });
      const st = steuerung(() => zeige());
      r.flaeche.append(st.element, h('p', { class: 'text-2' }, 'Tippe ein Bit des Klartextblocks an – sein Weg durch die Runden und die beteiligten Schlüsselbits werden hervorgehoben.'), eingabe, liste, inhalt);
      const ortText = (bit) => {
        const o = ortVon(bit);
        return `Bit ${bit} (Zeile ${o.z}, Spalte ${o.s})`;
      };
      function zeige() {
        AQ.clear(eingabe);
        AQ.clear(inhalt);
        AQ.clear(liste);
        weg = null;
        if (!p) return;
        if (verfolgt) weg = Krypto.kryptos16.bitweg(verfolgt, { variante, runden });
        const schluesselBits = new Set(weg ? weg.schluesselbits : []);
        eingabe.append(
          h('figure', { class: 'verfolgung-klartext' }, bitmatrix(block, { titel: 'Klartextblock – Bit wählen', klasse: 'eingabematrix', zelle: (bit) => (bit === verfolgt ? 'weg' : ''), knopf: { beiKlick: (bit) => { verfolgt = bit; zeige(); const kn = eingabe.querySelector(`.verfolgung-klartext button.gitter-bit[data-bit="${bit}"]`); if (kn) kn.focus(); }, gedrueckt: (bit) => bit === verfolgt } })),
          h('figure', { class: 'verfolgung-schluessel' }, bitmatrix(schluessel, { titel: 'Schlüssel K – beteiligte Bits', klasse: 'eingabematrix', zelle: (bit) => (schluesselBits.has(bit) ? 'weg' : ''), knopf: { gesperrt: true, gedrueckt: (bit) => schluesselBits.has(bit) } }))
        );
        if (!weg) {
          liste.appendChild(h('li', null, 'Noch kein Bit gewählt.'));
          return;
        }
        weg.runden.forEach((wr, i) => {
          const rd = p.runden[i];
          const menge = (l) => new Set(l);
          const xor = menge(wr.nachXor);
          const mitte = menge(wr.nachMitte);
          const trans = menge(wr.nachTransposition);
          const mitteKlasse = variante === 'kryptos16' ? 'beeinflusst' : 'weg';
          inhalt.appendChild(
            h(
              'section',
              { class: 'runde verfolgung-runde', 'aria-label': `Runde ${wr.runde}` },
              h('h3', null, `Runde ${wr.runde}`),
              h(
                'div',
                { class: 'runde-matrizen' },
                bitmatrix(rd.nachXor, { titel: `nach XOR mit K${wr.runde}`, zelle: (bit) => (xor.has(bit) ? 'weg' : '') }),
                bitmatrix(rd.mitte, { titel: MITTE_TITEL[variante], zelle: (bit) => (mitte.has(bit) ? mitteKlasse : '') }),
                bitmatrix(rd.nachTransposition, { titel: 'nach Transposition', zelle: (bit) => (trans.has(bit) ? 'weg' : '') })
              )
            )
          );
          const mitteText = variante === 'kryptos16' ? `nach S-Box beeinflusst ${wr.nachMitte.length} Bits (ganze Zeilen: ${wr.nachMitte.join(', ')})` : `${MITTE_TITEL[variante]} ${wr.nachMitte.map(ortText).join(', ')}`;
          liste.appendChild(h('li', null, `Runde ${wr.runde}: nach XOR ${wr.nachXor.map(ortText).join(', ')} mit Schlüsselbit ${wr.schluessel.join(', ')} von K · ${mitteText} · nach Transposition ${wr.nachTransposition.length > 4 ? `${wr.nachTransposition.length} Bits` : wr.nachTransposition.map(ortText).join(', ')}`));
        });
        liste.appendChild(h('li', null, `Beteiligte Schlüsselbits von K: ${weg.schluesselbits.join(', ')}`));
      }
      st.aktualisiere();
    }


    /* ======================= ECB vs. CBC (Task 120) ======================= */
    const leseHex4 = (t) => {
      const x = String(t ?? '').replace(/\s+/g, '');
      if (!HEX4.test(x)) throw new Krypto.KryptoFehler('4 Hexziffern (16 Bit), z. B. 2B7E.');
      return vonBits(Krypto.vonHex(x).map((b) => Krypto.byteZuBits(b)).join(''));
    };
    const verschiedene = (liste) => new Set(liste).size;
    function hexFeld(klasse, titel, wert, setze, nachher) {
      const id = B.neueId(klasse);
      const f = h('input', { type: 'text', id, class: klasse, autocomplete: 'off', spellcheck: 'false', autocapitalize: 'characters' });
      f.value = wert;
      f.addEventListener('input', () => {
        setze(f.value.slice(0, 8));
        nachher();
      });
      return h('div', { class: 'labor-textfeld runden-feld' }, h('label', { for: id }, titel), f);
    }
    /** Pixelbild als SVG (schwarze Pixel als Rechtecke, Kachelgitter), role=img mit Zählung. */
    function pixelbild(raster, modus, titel, anzahl) {
      const svg = s('svg', { class: 'pixelbild', 'data-modus': modus, viewBox: `0 0 ${PIXEL} ${PIXEL}`, role: 'img', 'aria-label': `${titel}: ${anzahl} verschiedene Kacheln von 64`, 'shape-rendering': 'crispEdges' }, s('rect', { class: 'pixel-grund', x: 0, y: 0, width: PIXEL, height: PIXEL }));
      raster.forEach((zeile, y) => [...zeile].forEach((c, x) => c === '#' && svg.appendChild(s('rect', { class: 'pixel', x, y, width: 1, height: 1 }))));
      for (let i = 4; i < PIXEL; i += 4) svg.append(s('line', { class: 'kachel-linie', x1: i, y1: 0, x2: i, y2: PIXEL }), s('line', { class: 'kachel-linie', x1: 0, y1: i, x2: PIXEL, y2: i }));
      return h('figure', { class: 'pixel-figur' }, svg, h('figcaption', null, h('strong', null, titel), ` – ${anzahl} verschiedene Kacheln von 64`));
    }
    function baueModi() {
      const hinweisOrt = h('div', { class: 'runden-hinweis' });
      const bilder = h('div', { class: 'pixelbilder' });
      const status = h('p', { class: 'malraster-status', 'aria-live': 'polite' });
      const malSvg = s('svg', { class: 'malraster-bild', viewBox: `0 0 ${PIXEL} ${PIXEL}`, 'aria-hidden': 'true', 'shape-rendering': 'crispEdges' });
      const raster = h('div', { class: 'malraster', role: 'group', 'aria-roledescription': 'Mal-Raster', tabindex: '0', 'aria-label': 'Eigenes Bild malen: Pfeiltasten bewegen den Cursor, Leertaste kippt das Pixel' }, malSvg);
      const zuruecksetzen = h('button', { type: 'button', class: 'knopf knopf-leise modi-zuruecksetzen' }, 'Ausgangsbild');
      const leeren = h('button', { type: 'button', class: 'knopf knopf-leise modi-leeren' }, 'Leeren');
      r.flaeche.append(
        h('div', { class: 'labor-steuer' }, hexFeld('modi-schluessel', 'Schlüssel K (4 Hex)', modiK, (x) => (modiK = x), zeige), hexFeld('modi-iv', 'IV für CBC (4 Hex)', modiIv, (x) => (modiIv = x), zeige)),
        h('p', { class: 'text-2' }, 'Jede Kachel aus 4 × 4 Pixeln ist ein 16-Bit-Block (KRYPTOS-16, 4 Runden). Gleiche Klartextkacheln ergeben in ECB gleiche Geheimtextkacheln.'),
        hinweisOrt,
        bilder,
        h('div', { class: 'malbereich' }, h('div', { class: 'malraster-rahmen' }, raster, status), h('div', { class: 'malraster-knoepfe' }, zuruecksetzen, leeren))
      );
      function kippe(z, sp) {
        const zeile = [...pixel[z]];
        zeile[sp] = zeile[sp] === '#' ? '.' : '#';
        pixel[z] = zeile.join('');
        zeige();
      }
      raster.addEventListener('keydown', (e) => {
        const d = { ArrowRight: [0, 1], ArrowLeft: [0, -1], ArrowDown: [1, 0], ArrowUp: [-1, 0] }[e.key];
        if (d) {
          e.preventDefault();
          cursor = { z: Math.max(0, Math.min(PIXEL - 1, cursor.z + d[0])), s: Math.max(0, Math.min(PIXEL - 1, cursor.s + d[1])) };
          zeigeRaster();
        } else if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          kippe(cursor.z, cursor.s);
        }
      });
      malSvg.addEventListener('pointerdown', (e) => {
        const b = malSvg.getBoundingClientRect();
        if (!b.width || !b.height) return;
        const sp = Math.floor(((e.clientX - b.left) * PIXEL) / b.width);
        const z = Math.floor(((e.clientY - b.top) * PIXEL) / b.height);
        if (z < 0 || z >= PIXEL || sp < 0 || sp >= PIXEL) return;
        cursor = { z, s: sp };
        kippe(z, sp);
      });
      zuruecksetzen.addEventListener('click', () => {
        pixel = BEISPIEL.pixel.slice();
        zeige();
      });
      leeren.addEventListener('click', () => {
        pixel = pixel.map((zeile) => zeile.replace(/#/g, '.'));
        zeige();
      });
      function zeigeRaster() {
        while (malSvg.firstChild) malSvg.firstChild.remove();
        malSvg.appendChild(s('rect', { class: 'pixel-grund', x: 0, y: 0, width: PIXEL, height: PIXEL }));
        pixel.forEach((zeile, y) => [...zeile].forEach((c, x) => c === '#' && malSvg.appendChild(s('rect', { class: 'pixel', x, y, width: 1, height: 1 }))));
        malSvg.appendChild(s('rect', { class: 'mal-cursor', x: cursor.s, y: cursor.z, width: 1, height: 1 }));
        status.textContent = `Cursor Zeile ${cursor.z + 1}, Spalte ${cursor.s + 1}: ${pixel[cursor.z][cursor.s] === '#' ? 'schwarz' : 'weiß'}`;
      }
      function zeige() {
        AQ.clear(hinweisOrt);
        AQ.clear(bilder);
        zeigeRaster();
        let k;
        let iv;
        try {
          k = leseHex4(modiK);
          iv = leseHex4(modiIv);
        } catch (e) {
          if (!istKryptoFehler(e)) throw e;
          hinweisOrt.appendChild(B.hinweis('warnung', `Schlüssel und IV: ${e.message}`));
          kacheln = null;
          return;
        }
        if (erkenne('modi', { bits: [bits16(k), bits16(iv)] }, null)) return;
        const klar = Krypto.kryptos16.kacheln(pixel);
        const ecb = Krypto.kryptos16.modus(klar, k, 'ECB');
        const cbc = Krypto.kryptos16.modus(klar, k, 'CBC', iv);
        kacheln = { original: verschiedene(klar), ecb: verschiedene(ecb), cbc: verschiedene(cbc) };
        bilder.append(pixelbild(pixel, 'original', 'Original', kacheln.original), pixelbild(Krypto.kryptos16.ausKacheln(ecb, PIXEL), 'ecb', 'ECB', kacheln.ecb), pixelbild(Krypto.kryptos16.ausKacheln(cbc, PIXEL), 'cbc', 'CBC', kacheln.cbc));
      }
      zeige();
    }

    /* ======================= Fehler einbauen (Task 120) ======================= */
    function baueFehler() {
      const feld = B.textfeld({ beschriftung: 'Klartext (bis 16 Zeichen)', max: 16, wert: fehlerText, art: 'frei', zeilen: 1, beiEingabe: (t) => { fehlerText = t; fehlerBits = null; geloescht = false; zeige(); } });
      const hinweisOrt = h('div', { class: 'runden-hinweis' });
      const bloeckeOrt = h('div', { class: 'fehler-bloecke' });
      const ergebnisOrt = h('div', { class: 'fehler-ergebnis' });
      const zurueck = h('button', { type: 'button', class: 'knopf knopf-leise fehler-zuruecksetzen' }, 'Geheimtexte zurücksetzen');
      zurueck.addEventListener('click', () => {
        fehlerBits = null;
        geloescht = false;
        zeige();
      });
      r.flaeche.append(
        feld.element,
        h('p', { class: 'text-2' }, `ECB und CBC mit K = ${BEISPIEL.modiSchluessel}, IV = ${BEISPIEL.iv}, 4 Runden. „⇅“ kippt ein Bit, „✕“ löscht es – in beiden Geheimtexten an derselben Stelle.`),
        hinweisOrt,
        bloeckeOrt,
        zurueck,
        ergebnisOrt
      );
      const blockZeichen = (b) => {
        const bits = bits16(b);
        return [bits.slice(0, 8), bits.slice(8)].map((x) => {
          try {
            return Krypto.zeichenAusAscii(Krypto.bitsZuByte(x));
          } catch (e) {
            if (!istKryptoFehler(e)) throw e;
            return '·';
          }
        }).join('');
      };
      const inBloecke = (bits) => {
        const aus = [];
        for (let i = 0; i + 16 <= bits.length; i += 16) aus.push(vonBits(bits.slice(i, i + 16)));
        return aus;
      };
      function zeige() {
        AQ.clear(hinweisOrt);
        AQ.clear(bloeckeOrt);
        AQ.clear(ergebnisOrt);
        betroffen = { ecb: [], cbc: [] };
        let klar;
        try {
          klar = Krypto.kryptos16.textZuBloecken(fehlerText);
        } catch (e) {
          if (!istKryptoFehler(e)) throw e;
          hinweisOrt.appendChild(B.hinweis('warnung', 'Nur Zeichen der Anlage (ASCII 32–126, keine Umlaute).'));
          return;
        }
        const k = leseHex4(BEISPIEL.modiSchluessel);
        const iv = leseHex4(BEISPIEL.iv);
        if (erkenne('fehler', { texte: [fehlerText], bits: [bits16(k), bits16(iv)] }, null)) return;
        if (!fehlerBits) {
          const zuBits = (l) => l.map(bits16).join('');
          fehlerBits = { ecb: zuBits(Krypto.kryptos16.modus(klar, k, 'ECB')), cbc: zuBits(Krypto.kryptos16.modus(klar, k, 'CBC', iv)) };
        }
        if (geloescht) hinweisOrt.appendChild(B.hinweis('warnung', 'Bit gelöscht – alle folgenden Bits rücken nach vorn: Blockgrenzen verschoben.'));
        const rest = fehlerBits.ecb.length - 16 * inBloecke(fehlerBits.ecb).length;
        if (rest) hinweisOrt.appendChild(B.hinweis('info', `Am Ende bleiben ${rest} Bits übrig – kein ganzer Block mehr.`));
        const n = inBloecke(fehlerBits.ecb).length;
        for (let j = 0; j < n; j++) {
          const ecbBits = fehlerBits.ecb.slice(16 * j, 16 * j + 16);
          const cbcBits = fehlerBits.cbc.slice(16 * j, 16 * j + 16);
          const spalten = POSITION.map((pos) => {
            const g = 16 * j + pos.bit - 1;
            const kippen = h('button', { type: 'button', class: 'fehler-kippen', 'data-bit': String(pos.bit), 'aria-label': `Block C${j + 1}, Bit ${pos.bit} kippen` }, '⇅');
            const loeschen = h('button', { type: 'button', class: 'fehler-loeschen', 'data-bit': String(pos.bit), 'aria-label': `Block C${j + 1}, Bit ${pos.bit} löschen` }, '✕');
            kippen.addEventListener('click', () => {
              const m = [...fehlerBits.ecb].map((_, i) => (i === g ? '1' : '0')).join('');
              fehlerBits = { ecb: Krypto.xorBits(fehlerBits.ecb, m), cbc: Krypto.xorBits(fehlerBits.cbc, m) };
              zeige();
              const neu = bloeckeOrt.querySelector(`.fehler-block[data-block="${j}"] button.fehler-kippen[data-bit="${pos.bit}"]`);
              if (neu) neu.focus();
            });
            loeschen.addEventListener('click', () => {
              fehlerBits = { ecb: fehlerBits.ecb.slice(0, g) + fehlerBits.ecb.slice(g + 1), cbc: fehlerBits.cbc.slice(0, g) + fehlerBits.cbc.slice(g + 1) };
              geloescht = true;
              zeige();
            });
            return h('div', { class: 'fehler-spalte' }, h('span', { class: 'fehler-nr', 'aria-hidden': 'true' }, String(pos.bit)), h('span', { class: 'fehler-wert', title: 'ECB' }, ecbBits[pos.bit - 1]), h('span', { class: 'fehler-wert cbc', title: 'CBC' }, cbcBits[pos.bit - 1]), kippen, loeschen);
          });
          const gruppen = [0, 4, 8, 12].map((a) => h('div', { class: 'fehler-gruppe' }, spalten.slice(a, a + 4)));
          bloeckeOrt.appendChild(
            h(
              'figure',
              { class: 'fehler-block', 'data-block': String(j) },
              h('figcaption', null, `Geheimtextblock C${j + 1}`, h('span', { class: 'sr' }, `: ECB ${Krypto.gruppieren(ecbBits, 4)}, CBC ${Krypto.gruppieren(cbcBits, 4)}`)),
              h('div', { class: 'fehler-legende', 'aria-hidden': 'true' }, h('span', null, 'Nr.'), h('span', null, 'ECB'), h('span', null, 'CBC')),
              h('div', { class: 'fehler-spalten' }, gruppen)
            )
          );
        }
        const decE = n ? Krypto.kryptos16.modus(inBloecke(fehlerBits.ecb), k, 'ECB', null, { richtung: 'ent' }) : [];
        const decC = n ? Krypto.kryptos16.modus(inBloecke(fehlerBits.cbc), k, 'CBC', iv, { richtung: 'ent' }) : [];
        const anders = (dec) => dec.map((b, i) => (b !== klar[i] ? i : null)).filter((i) => i !== null);
        betroffen = { ecb: anders(decE), cbc: anders(decC) };
        const zeile = (titel, liste, betr) => h('tr', null, h('th', { scope: 'row' }, titel), liste.map((b, i) => h('td', { class: betr.includes(i) ? 'betroffen' : null }, h('span', { class: 'fehler-hex' }, Krypto.hex(b)), ' ', h('span', { class: 'fehler-zeichen' }, blockZeichen(b)), betr.includes(i) ? h('span', { class: 'betroffen-zeichen' }, ' !') : null)));
        ergebnisOrt.append(
          h(
            'div',
            { class: 'scroll-x' },
            h(
              'table',
              { class: 'labor-tabelle fehler-tabelle' },
              h('caption', null, 'Entschlüsselt (Hex und Zeichen, · = kein Anlagezeichen, ! = betroffen)'),
              h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Block'), klar.map((_, i) => h('th', { scope: 'col' }, `P${i + 1}`)))),
              h('tbody', null, zeile('Klartext', klar, []), zeile('ECB', decE, betroffen.ecb), zeile('CBC', decC, betroffen.cbc))
            )
          ),
          h('p', { class: 'fehler-fazit', 'aria-live': 'polite' }, `Betroffen – ECB: ${betroffen.ecb.length ? betroffen.ecb.map((i) => `P${i + 1}`).join(', ') : 'keiner'} · CBC: ${betroffen.cbc.length ? betroffen.cbc.map((i) => `P${i + 1}`).join(', ') : 'keiner'}`)
        );
      }
      zeige();
    }

    /* ======================= Mini-Enigma (Kür K2, Task 120) ======================= */
    function baueEnigma() {
      const optionen = () => (verdrahtung === 'eigen' ? { walze: eigene.walze, reflektor: eigene.reflektor } : {});
      const zahl = B.zahl({ beschriftung: 'Startstellung der Walze', min: 0, max: 7, wert: stellung0, format: (n) => Krypto.buchstabe(n, 0), minusLabel: 'Walze eine Stellung zurück', plusLabel: 'Walze eine Stellung weiter', beiWechsel: (n) => { stellung0 = n; zeige(); } });
      const tastatur = h('div', { class: 'enigma-tastatur', role: 'group', 'aria-label': 'Tastatur A bis H' }, ME.map((b) => h('button', { type: 'button', class: 'knopf taste', 'data-taste': b }, b)));
      const feld = B.textfeld({ beschriftung: 'Text (nur A–H, bis 40 Zeichen)', max: 40, wert: enigmaText, art: 'klartext', zeilen: 1, beiEingabe: (t) => { enigmaText = t; zeige(); } });
      const lampen = ME.map((b) => h('span', { class: 'lampe', 'data-lampe': b }, b));
      const lampenfeld = h('div', { class: 'enigma-lampen', 'aria-hidden': 'true' }, lampen);
      const aus = B.ausgabe({ beschriftung: 'Ausgabe (Lampenfeld)', art: 'frei' });
      const stellungJetzt = h('p', { class: 'enigma-stellung', 'aria-live': 'polite' });
      const hinweisOrt = h('div', { class: 'runden-hinweis' });
      const wegOrt = h('div', { class: 'enigma-weg' });
      const nsOrt = h('div', { class: 'enigma-nachspiel' });
      const tabOrt = h('div', { class: 'enigma-tabelle' });
      const wahl = radiogruppe(
        [
          { id: 'spec', titel: 'Standard-Verdrahtung' },
          { id: 'eigen', titel: 'eigene Verdrahtung' }
        ],
        verdrahtung,
        'verdrahtung',
        'Verdrahtung',
        'enigma-verdrahtung',
        (x) => {
          verdrahtung = x;
          eigenFelder.hidden = x !== 'eigen';
          zeige();
        }
      );
      const eigenFeld = (klasse, titel, schluessel) => {
        const id = B.neueId(klasse);
        const f = h('input', { type: 'text', id, class: klasse, autocomplete: 'off', spellcheck: 'false', autocapitalize: 'characters' });
        f.value = eigene[schluessel];
        f.addEventListener('input', () => {
          eigene[schluessel] = f.value.slice(0, 8).toUpperCase();
          zeige();
        });
        return h('div', { class: 'labor-textfeld runden-feld' }, h('label', { for: id }, titel), f);
      };
      const eigenFelder = h('div', { class: 'labor-steuer enigma-eigen', hidden: verdrahtung !== 'eigen' }, eigenFeld('enigma-walze', 'Walze: Bilder von A … H', 'walze'), eigenFeld('enigma-reflektor', 'Reflektor: Partner von A … H', 'reflektor'));
      r.flaeche.append(
        h('div', { class: 'labor-steuer' }, zahl.element, stellungJetzt),
        wahl.element,
        eigenFelder,
        hinweisOrt,
        tastatur,
        feld.element,
        lampenfeld,
        aus.element,
        wegOrt,
        nsOrt,
        tabOrt
      );
      for (const kn of tastatur.querySelectorAll('button.taste')) {
        kn.addEventListener('click', () => {
          if (Krypto.nurBuchstaben(enigmaText).length >= 40) return;
          enigmaText = `${enigmaText}${Krypto.klein(kn.dataset.taste)}`;
          feld.setze(enigmaText);
          zeige();
          kn.focus();
        });
      }
      /** Stromweg als SVG: hin (gestrichelt) über Walze zum Reflektor, zurück (durchgezogen); Stationen ①–⑦. */
      function stromweg(w, s0) {
        const STUFEN = [
          ['+ s', 'Eingang Walze'],
          ['W', 'Walze'],
          ['− s', 'zum Reflektor'],
          ['R', 'Reflektor'],
          ['+ s', 'zurück'],
          ['W⁻¹', 'Walze rückwärts'],
          ['− s', 'Lampe']
        ];
        const ort = (i) => (i < 3 ? [70 + 75 * i, 30] : i === 3 ? [295, 80] : [70 + 75 * (6 - i), 130]);
        const svg = s('svg', { class: 'stromweg', viewBox: '0 0 340 160', role: 'img', 'aria-label': `Stromweg von ${w.eingang} in Stellung ${s0}: ${w.stationen.join(' → ')}; Lampe ${w.ausgang}` });
        const linie = (a, b, klasse) => svg.appendChild(s('line', { class: `strom ${klasse}`, x1: a[0], y1: a[1], x2: b[0], y2: b[1] }));
        linie([20, 30], ort(0), 'hin');
        for (let i = 0; i < 6; i++) linie(ort(i), ort(i + 1), i < 3 ? 'hin' : 'rueck');
        linie(ort(6), [20, 130], 'rueck');
        svg.append(s('text', { class: 'strom-ende', x: 14, y: 34, 'text-anchor': 'middle' }, w.eingang), s('text', { class: 'strom-ende', x: 14, y: 134, 'text-anchor': 'middle' }, w.ausgang));
        w.stationen.forEach((b, i) => {
          const [x, y] = ort(i);
          svg.append(
            s('circle', { class: 'strom-station', cx: x, cy: y, r: 16 }),
            s('text', { class: 'strom-buchstabe', x, y: y + 5, 'text-anchor': 'middle', 'data-station': String(i + 1) }, b),
            s('text', { class: 'strom-nr', x, y: i < 3 || i === 3 ? y - 21 : y + 30, 'text-anchor': 'middle' }, `${String(i + 1)} ${STUFEN[i][0]}`)
          );
        });
        return svg;
      }
      function zeigeWeg(i, liste) {
        AQ.clear(wegOrt);
        for (const l of lampen) l.classList.remove('leuchtet');
        if (i < 0 || !liste[i]) {
          wegOrt.appendChild(h('p', { class: 'text-2' }, 'Tippe einen Buchstaben – dann leuchtet eine Lampe und der Stromweg erscheint.'));
          return;
        }
        const x = liste[i];
        wegOrt.appendChild(h('figure', { class: 'stromweg-figur' }, stromweg(x.weg, x.stellung), h('figcaption', null, `Buchstabe ${i + 1}: ${x.weg.eingang} in Stellung ${x.stellung} → ${x.weg.stationen.join(' → ')} → Lampe ${x.weg.ausgang}`)));
        const l = lampen.find((y) => y.dataset.lampe === x.weg.ausgang);
        if (l) l.classList.add('leuchtet');
      }
      function zeige() {
        schliesseTeile();
        AQ.clear(hinweisOrt);
        AQ.clear(nsOrt);
        AQ.clear(tabOrt);
        const t = Krypto.nurBuchstaben(enigmaText);
        const opt = optionen();
        stellungJetzt.textContent = `Walze jetzt in Stellung ${Krypto.buchstabe(Krypto.mod(stellung0 + t.length, 8), 0)}`;
        try {
          Krypto.miniEnigma.tabelle('A', opt);
        } catch (e) {
          if (!istKryptoFehler(e)) throw e;
          hinweisOrt.appendChild(B.hinweis('warnung', e.message));
          enigmaAusgabe = '';
          aus.setze('');
          zeigeWeg(-1, []);
          return;
        }
        if (/[^A-H]/.test(t)) {
          hinweisOrt.appendChild(B.hinweis('warnung', 'Die Mini-Enigma kennt nur die Buchstaben A–H.'));
          enigmaAusgabe = '';
          aus.setze('');
          zeigeWeg(-1, []);
        } else {
          const s0 = Krypto.buchstabe(stellung0, 0);
          if (verdrahtung === 'spec' && t && erkenne('enigma', { texte: [t], schluessel: [`st=${s0}`] }, { text: t, stellung0 })) return;
          enigmaAusgabe = Krypto.miniEnigma(t, s0, 'ver', opt);
          aus.setze(enigmaAusgabe);
          const liste = [...t].map((b, i) => {
            const st = Krypto.buchstabe(Krypto.mod(stellung0 + i, 8), 0);
            return { stellung: st, weg: Krypto.miniEnigma.weg(b, st, opt) };
          });
          zeigeWeg(liste.length - 1, liste);
          if (liste.length) {
            nachspiel = KRLabor.nachspiel(nsOrt, {
              titel: 'Stromweg Buchstabe für Buchstabe',
              start: liste.length - 1,
              schritte: liste.map((x, i) => ({ text: `Buchstabe ${i + 1}: ${x.weg.eingang} in Stellung ${x.stellung} → Lampe ${x.weg.ausgang}`, daten: { i } })),
              zeige(schritt) {
                zeigeWeg(schritt.daten.i, liste);
              },
              beiLauf: (an) => {
                feld.sperre(an);
                zahl.sperre(an);
                for (const kn of tastatur.querySelectorAll('button')) kn.disabled = !!an;
              }
            });
          }
        }
        tabOrt.appendChild(
          B.tabelle({
            caption: 'Stellungstabelle: Bild von A … H in jeder Stellung',
            kopf: ['Stellung', ...ME],
            zeilen: ME.map((st) => [st, ...Krypto.miniEnigma.tabelle(st, opt)]),
            klasse: 'enigma-stellungen'
          })
        );
        for (const tr of tabOrt.querySelectorAll('tbody tr')) tr.setAttribute('data-stellung', tr.firstChild.textContent);
      }
      zeige();
    }

    function baue(id) {
      schliesseTeile();
      AQ.clear(r.flaeche);
      if (id === 'runden') baueRunden();
      else if (id === 'lawine') baueLawine();
      else if (id === 'verfolgung') baueVerfolgung();
      else if (id === 'modi') baueModi();
      else if (id === 'fehler') baueFehler();
      else if (id === 'enigma') baueEnigma();
    }
    baue(r.aktiv());

    const hexOder = (n) => (n === null || n === undefined ? null : Krypto.hex(n));
    return {
      schliesse() {
        schliesseTeile();
      },
      zustand() {
        return {
          reiter: r.aktiv(),
          variante,
          block: hexOder(block),
          schluessel: hexOder(schluessel),
          runden,
          ergebnis: p ? Krypto.hex(p.ergebnis) : null,
          protokoll: p ? p.runden.map((x) => ({ runde: x.runde, eingang: Krypto.hex(x.eingang), schluessel: Krypto.hex(x.schluessel), nachXor: Krypto.hex(x.nachXor), mitte: Krypto.hex(x.mitte), nachTransposition: Krypto.hex(x.nachTransposition) })) : [],
          gekippt: { klartext: [...gekippt.klartext].sort((a, b) => a - b), schluessel: [...gekippt.schluessel].sort((a, b) => a - b) },
          zaehler,
          weg,
          kacheln,
          betroffen,
          stellung: Krypto.buchstabe(Krypto.mod(stellung0 + Krypto.nurBuchstaben(enigmaText).length, 8), 0),
          enigmaAusgabe
        };
      }
    };
  }

  KRLabor.registriere('runden', { titel: 'Runden-Labor', oeffne });
})();
