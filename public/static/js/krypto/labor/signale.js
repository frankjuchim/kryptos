/* Kryptos – Labor-Werkzeug „Codes & Signale“ (Zusatz; Plan M10 Task 230, E184–E186).
   Herkunft: Krypto-Werkstatt (Ideen von A. Bodendiek), stationen/klopfzeichen.html und stationen/freimaurer.html @59004d9 – docs/FREMDCODE.md
   Morse: Trommel mit Rand (kurz ·) und Fell (lang –) samt Schlägel, Morsetafel A–Z und 0–9; Senden: Buchstaben in der Tafel
   wählen und geführt nachschlagen oder frei trommeln, „Pause“ schließt den Buchstaben ab (zweimal = Wortlücke); Empfangen:
   Schläge → Buchstabe (Krypto.morse(…, 'ent')), die Tafel zeigt die passenden Kandidaten. Klopfcode: Zellenwand mit Rohr,
   Polybios-Standardquadrat; Senden = Zeile-Schläge, kurze Pause, Spalte-Schläge; Empfangen = Schläge zählen. Freimaurer:
   Schlüsselbild aus vier Figuren, Feld antippen → Umriss wird Symbol; Rückweg über die Symbolleiste; Übungsnachricht und
   „Symbole zählen“ (P6). Ton nur mit Schalter (Standard aus, E186), jede Information auch sichtbar. Rechnet nur über
   Krypto.* (morse, polybios, freimaurer, freimaurerBuchstabe, haeufigkeiten, schluesselraum). Speichert nichts. */
'use strict';
(() => {
  const { h, s } = AQ;
  const B = KRLaborBau;
  const S = KRStation;
  const BEISPIEL = { uebung: 'zinnkrug im giebel' }; // eigene Wörter, in keinem Material
  const REITER_TITEL = { morse: 'Morse-Trommel', klopfcode: 'Klopfcode', freimaurer: 'Freimaurer' };
  const MAX = 120;
  const TAFEL = [...Krypto.ALPHABET, ...'0123456789'];
  const KREUZ_LAGE = { 1: 'oben', 2: 'links', 3: 'rechts', 4: 'unten' };

  /** Symbol des Freimaurer-Alphabets als SVG (Linien aus { figur, feld, punkt }) */
  function symbolSvg({ figur, feld, punkt }, groesse = 'klein') {
    let d;
    let dot;
    if (figur === 'gitter') {
      const sp = Krypto.mod(feld - 1, 3) + 1;
      const z = (feld - sp) / 3 + 1;
      d = [z > 1 ? 'M8 8H32' : '', z < 3 ? 'M8 32H32' : '', sp > 1 ? 'M8 8V32' : '', sp < 3 ? 'M32 8V32' : ''].join('');
      dot = [20, 20];
    } else {
      d = { 1: 'M6 8L20 26L34 8', 2: 'M8 6L26 20L8 34', 3: 'M32 6L14 20L32 34', 4: 'M6 32L20 14L34 32' }[feld];
      dot = { 1: [20, 11], 2: [11, 20], 3: [29, 20], 4: [20, 29] }[feld];
    }
    return s('svg', { class: `signale-symbol signale-symbol-${groesse}`, viewBox: '0 0 40 40', 'aria-hidden': 'true', focusable: 'false' }, s('path', { d }), punkt ? s('circle', { cx: dot[0], cy: dot[1], r: 3.2 }) : null);
  }
  const symbolName = ({ figur, feld, punkt }) => `${figur === 'gitter' ? 'Gitter' : 'Kreuz'}, Feld ${figur === 'gitter' ? feld : KREUZ_LAGE[feld]}, ${punkt ? 'mit Punkt' : 'ohne Punkt'}`;
  const symbolCode = ({ figur, feld, punkt }) => `${figur === 'gitter' ? 'G' : 'K'}${feld}${punkt ? '•' : ''}`;
  const schlagWort = (c) => (c === '·' ? 'Rand' : 'Fell');

  function oeffne(container, voreinstellung, umgebung) {
    const v = voreinstellung || {};
    const reiterListe = KRLabor.reiterFuer('signale', v, umgebung);
    const vorRichtung = v.richtung === 'ent' ? 'ent' : 'ver';
    const vorText = typeof v.text === 'string' ? v.text.slice(0, 200) : '';
    const stand = {};
    for (const id of ['morse', 'klopfcode', 'freimaurer']) stand[id] = { richtung: vorRichtung, liste: [] };
    let gesperrt = false;
    let teil = null;

    const r = B.reiter(reiterListe.map((id) => ({ id, titel: REITER_TITEL[id] })), { aktiv: reiterListe[0], beiWechsel: baue });
    const wurzel = h('div', { class: 'labor-werkzeug signale-werkzeug' }, r.element);
    container.appendChild(wurzel);
    KRStation.herkunft(wurzel);

    /**
     * Gemeinsamer Rahmen einer Station: Kurzanleitung, Objekt, Erklärung | Richtung, Bänder, Knöpfe, Nachspielen,
     * Text eintippen, Mehr ausprobieren; darunter „So funktioniert’s“ und Hintergrund. → Teile
     */
    function rahmen(z, { objekt, richtungTexte, knoepfe = [], mehrTeile = null, mehrStichworte = '', soGehts, hintergrund, tippen = true, beiRichtung, beiTippen, beiSperre, beiAenderung, schritteVer, schritteEnt, baenderVer, baenderEnt }) {
      let bereit = false;
      const anleitung = S.anleitung(null, []);
      const erklaerung = S.erklaerung(null);
      const richtungWahl = B.richtung({ wert: z.richtung, texte: richtungTexte, beiWechsel: (x) => wechsle(x) });
      const baender = S.baender({ beiAenderung: (bd) => geaendert(bd) });
      const nsOrt = h('div', { class: 'signale-nachspiel' });
      const nk = S.nachspielKnopf(nsOrt, { sperre: (an) => sperre(an), beiEnde: () => beiAenderung(), beiLeer: (t) => erklaerung.sage('Nachspielen', t) });
      const feld = tippen ? B.textfeld({ beschriftung: 'Nachricht eintippen (statt antippen)', max: MAX, art: z.richtung === 'ver' ? 'klartext' : 'geheimtext', beiEingabe: (t) => !gesperrt && beiTippen(t) }) : null;
      const tippenTeil = feld ? h('details', { class: 'signale-tippen labor-details' }, h('summary', null, 'Text eintippen'), h('div', { class: 'labor-details-inhalt' }, feld.element)) : null;
      const mehr = mehrTeile ? S.mehr(null, 'Mehr ausprobieren', mehrStichworte, ...mehrTeile) : null;
      const buehne = h('div', { class: 'signale-buehne' }, anleitung.element, objekt, erklaerung.element);
      const rechts = h('div', { class: 'signale-bedienung' }, richtungWahl.element, baender.element, h('div', { class: 'knopf-reihe' }, ...knoepfe, nk.element), nsOrt, tippenTeil, mehr);
      r.flaeche.append(h('div', { class: 'signale-objekt' }, buehne, rechts), S.soGehts(null, soGehts), S.hintergrund(null, hintergrund));
      function beschriften() {
        const [o, u, g, gr] = z.richtung === 'ver' ? baenderVer : baenderEnt;
        baender.beschrifte(o, u, g, gr);
        anleitung.texte(z.richtung === 'ver' ? schritteVer : schritteEnt);
        if (tippenTeil) tippenTeil.hidden = z.richtung === 'ent' && !beiTippen.ent;
      }
      function wechsle(x) {
        z.richtung = x;
        z.liste = [];
        beschriften();
        baender.leeren();
        if (feld) feld.setze('');
        beiRichtung(x);
      }
      function geaendert(bd) {
        if (!bereit || gesperrt) return;
        z.liste = z.liste.slice(0, bd.eintraege.length);
        beiAenderung();
      }
      function sperre(an) {
        gesperrt = an;
        S.sperre(r.flaeche, an);
        richtungWahl.sperre(an);
        if (feld) feld.sperre(an);
        for (const b of baender.element.querySelectorAll('button')) b.disabled = an || b.disabled;
        for (const b of knoepfe) b.disabled = an;
        if (typeof beiSperre === 'function') beiSperre(an);
      }
      const api = {
        anleitung,
        erklaerung,
        baender,
        feld,
        nk,
        /** Eintrag [ein, aus, daten] anhängen (zuerst schreiben, dann fliegen) */
        schreibe(e, von) {
          if (z.liste.length >= MAX) return false;
          z.liste.push(e);
          baender.push(e[0], e[1]);
          if (von) {
            S.flug(von, baender.letztes(0), e[0], { klasse: z.richtung === 'ver' ? 'klar' : '' });
            S.flug(von, baender.letztes(1), e[1], { klasse: z.richtung === 'ver' ? '' : 'klar' });
          }
          return true;
        },
        setze(liste) {
          z.liste = liste.slice(0, MAX);
          bereit = false;
          baender.setze(z.liste.map((e) => [e[0], e[1]]));
          bereit = true;
          beiAenderung();
        },
        start() {
          beschriften();
          bereit = true;
          baender.setze(z.liste.map((e) => [e[0], e[1]]));
          beiAenderung();
        }
      };
      return api;
    }

    function schliesseTeil() {
      if (teil) teil.schliesse();
      teil = null;
      gesperrt = false;
      S.sperre(r.flaeche, false);
    }

    /* ---------- Reiter „Morse-Trommel“ ---------- */
    function baueMorse() {
      const z = stand.morse;
      let puffer = ''; // Schläge des aktuellen Buchstabens
      let ziel = null; // in der Tafel gewählter Buchstabe (Senden, geführt)
      let lauf = null;
      const ruhig = AQ.ruhig();
      /* Trommel (SVG nach der Werkstatt, Farben über Tokens) */
      const id = (x) => B.neueId(`signale-${x}`);
      const ids = { holz: id('holz'), fell: id('fell'), reif: id('reif'), reifS: id('reifs'), clip: id('clip') };
      const CX = 260;
      const CY = 150;
      const ORX = 196;
      const ORY = 64;
      const IRX = 172;
      const IRY = 52;
      const ellipse = (cx, cy, rx, ry) => `M ${cx - rx} ${cy} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`;
      let schnuere = '';
      for (let k = 0; k <= 12; k++) {
        const th = ((12 + k * 13) * Math.PI) / 180;
        schnuere += `${k ? ' L ' : 'M '}${CX + ORX * Math.cos(th)} ${CY + 12 + ORY * Math.sin(th)}`;
        if (k < 12) {
          const th2 = ((18.5 + k * 13) * Math.PI) / 180;
          schnuere += ` L ${CX + 140 * Math.cos(th2)} ${368 + 40 * Math.sin(th2)}`;
        }
      }
      const stockLinie = s('line', { class: 'signale-stock' });
      const stockSpitze = s('circle', { class: 'signale-stock-spitze', r: 11 });
      const fellGruppe = s('g', { class: 'signale-fell-gruppe' }, s('ellipse', { class: 'signale-fell', cx: CX, cy: CY, rx: IRX, ry: IRY, fill: `url(#${ids.fell})` }));
      const randGruppe = s('g', { class: 'signale-rand-gruppe' }, s('ellipse', { cx: CX, cy: CY + 12, rx: ORX, ry: ORY, fill: `url(#${ids.reifS})` }), s('path', { class: 'signale-reif', d: `${ellipse(CX, CY, ORX, ORY)} ${ellipse(CX, CY, IRX, IRY)}`, 'fill-rule': 'evenodd', fill: `url(#${ids.reif})` }));
      const trommelSvg = s(
        'svg',
        { class: 'signale-trommel-bild', viewBox: '0 0 520 420', 'aria-hidden': 'true', focusable: 'false' },
        s(
          'defs',
          null,
          s('linearGradient', { id: ids.holz, x1: '0', x2: '1' }, s('stop', { offset: '0', class: 'signale-holz-1' }), s('stop', { offset: '.22', class: 'signale-holz-2' }), s('stop', { offset: '.42', class: 'signale-holz-3' }), s('stop', { offset: '.6', class: 'signale-holz-2' }), s('stop', { offset: '1', class: 'signale-holz-1' })),
          s('radialGradient', { id: ids.fell, cx: '.46', cy: '.4', r: '.7' }, s('stop', { offset: '0', class: 'signale-fell-1' }), s('stop', { offset: '1', class: 'signale-fell-2' })),
          s('linearGradient', { id: ids.reif, x1: '0', y1: '0', x2: '0', y2: '1' }, s('stop', { offset: '0', class: 'signale-reif-1' }), s('stop', { offset: '.5', class: 'signale-reif-2' }), s('stop', { offset: '1', class: 'signale-reif-3' })),
          s('linearGradient', { id: ids.reifS, x1: '0', x2: '1' }, s('stop', { offset: '0', class: 'signale-reif-3' }), s('stop', { offset: '.45', class: 'signale-reif-2' }), s('stop', { offset: '1', class: 'signale-reif-3' }))
        ),
        s('ellipse', { class: 'signale-schatten', cx: CX, cy: 384, rx: 170, ry: 22 }),
        s('path', { d: `M ${CX - ORX + 2} ${CY + 10} C ${CX - ORX + 4} 262 ${CX - 150} 330 ${CX - 142} 368 A 142 40 0 0 0 ${CX + 142} 368 C ${CX + 150} 330 ${CX + ORX - 4} 262 ${CX + ORX - 2} ${CY + 10} Z`, fill: `url(#${ids.holz})` }),
        s('path', { class: 'signale-schnur-schatten', d: schnuere }),
        s('path', { class: 'signale-schnur', d: schnuere }),
        s('path', { class: 'signale-fuss', d: `M ${CX - 142} 368 A 142 40 0 0 0 ${CX + 142} 368`, stroke: `url(#${ids.reifS})` }),
        randGruppe,
        fellGruppe,
        s('text', { class: 'signale-trommel-text', x: 40, y: 36 }, 'RAND'),
        s('path', { class: 'signale-zeiger', d: 'M 62 46 Q 58 100 76 140' }),
        s('g', { class: 'signale-stock-gruppe' }, stockLinie, stockSpitze)
      );
      const HAND = [600, -90];
      const SLEN = 250;
      const REST = [430, 48];
      const ZIEL = { rand: [338, 203], fell: [290, 146] };
      function setzeStock(p) {
        const dx = HAND[0] - p[0];
        const dy = HAND[1] - p[1];
        const l = Math.hypot(dx, dy);
        stockLinie.setAttribute('x1', String(p[0]));
        stockLinie.setAttribute('y1', String(p[1]));
        stockLinie.setAttribute('x2', String(p[0] + (dx / l) * SLEN));
        stockLinie.setAttribute('y2', String(p[1] + (dy / l) * SLEN));
        stockSpitze.setAttribute('cx', String(p[0]));
        stockSpitze.setAttribute('cy', String(p[1]));
      }
      setzeStock(REST);
      const mische = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      function schlagBild(art) {
        if (lauf) lauf.abbrechen();
        const zielP = ZIEL[art];
        lauf = S.bewegung(260, (e) => setzeStock(e < 0.5 ? mische(REST, zielP, e * 2) : mische(zielP, REST, (e - 0.5) * 2)));
        const g = art === 'rand' ? randGruppe : fellGruppe;
        if (!ruhig) {
          g.classList.remove('schwingt');
          void g.getBoundingClientRect();
          g.classList.add('schwingt');
        }
      }
      const randKnopf = h('button', { type: 'button', class: 'signale-trommel-rand', 'aria-label': 'Rand anschlagen: kurz (Punkt ·)' });
      const fellKnopf = h('button', { type: 'button', class: 'signale-trommel-fell', 'aria-label': 'Fell anschlagen: lang (Strich –)' });
      const trommel = h('div', { class: 'signale-trommel' }, trommelSvg, randKnopf, fellKnopf);
      const legende = h('p', { class: 'signale-legende' }, h('span', { class: 'signale-legende-rand' }, '▲'), ' Rand = kurz (Punkt ·)  ', h('span', { class: 'signale-legende-fell' }, '●'), ' Fell = lang (Strich –)');
      const pufferAnzeige = h('p', { class: 'signale-puffer', 'aria-live': 'polite' });
      /* Morsetafel */
      const tafelKnoepfe = TAFEL.map((b) => {
        const code = Krypto.morse(b);
        return h('button', { type: 'button', 'data-buchstabe': b, 'aria-label': `${b}: ${[...code].map(schlagWort).join(', ')}` }, h('b', null, b), h('span', { class: 'signale-code', 'aria-hidden': 'true' }, [...code].map((c) => h('span', { class: c === '·' ? 'signale-punkt' : 'signale-strich' }))));
      });
      const tafel = h('div', { class: 'signale-tafel', role: 'group', 'aria-label': 'Morsetafel' }, tafelKnoepfe);
      const pause = h('button', { type: 'button', class: 'knopf knopf-zweit signale-pause' }, 'Pause');
      const ton = S.tonSchalter(null);
      const objekt = h('div', { class: 'signale-tisch' }, h('div', { class: 'signale-trommel-teil' }, trommel, legende, pufferAnzeige), h('div', { class: 'signale-tafel-teil' }, h('p', { class: 'signale-teiltitel' }, 'Morsetafel'), tafel, ton.element));
      const R = rahmen(z, {
        objekt,
        richtungTexte: { ver: 'Senden', ent: 'Empfangen' },
        knoepfe: [pause],
        soGehts: ['Trommel: Ein Punkt ist ein Schlag auf den Rand (kurz), ein Strich ein Schlag aufs Fell (lang).', 'Nach jedem Buchstaben drückst du „Pause“, nach einem Wort zweimal.', 'Die Morsetafel kennt jeder – das ist eine Codierung, keine Verschlüsselung.'],
        hintergrund: [
          { titel: 'Codierung ≠ Verschlüsselung', text: 'Ein Code übersetzt nur in eine andere Darstellung – Schläge, Töne, Licht. Einen geheimen Schlüssel gibt es nicht: Wer die Tafel kennt, liest mit.' },
          { titel: 'Geschichte', text: 'Der Telegrafen-Code wird Samuel Morse und Alfred Vail zugeschrieben (ab 1837). Mit Sprechtrommeln sollen in Westafrika Nachrichten über weite Strecken gegangen sein.' },
          { titel: 'Kurz und lang', text: 'Häufige Buchstaben haben kurze Zeichen (e = ein Punkt, t = ein Strich) – so geht das Senden schneller.' }
        ],
        beiRichtung: (x) => {
          puffer = '';
          ziel = null;
          zeige();
          R.erklaerung.sage(x === 'ver' ? 'Senden' : 'Empfangen', x === 'ver' ? 'Tippe in der Tafel einen Buchstaben an und schlag ihn auf der Trommel nach.' : 'Schlag, was du hörst: Rand = kurz, Fell = lang. Nach jedem Buchstaben „Pause“.');
        },
        beiTippen: Object.assign((t) => tippe(t), { ent: true }),
        beiSperre: (an) => {
          randKnopf.disabled = an;
          fellKnopf.disabled = an;
        },
        beiAenderung: () => zeige(),
        schritteVer: ['Buchstaben in der Tafel antippen', 'Auf der Trommel nachschlagen', 'Pause – nächster Buchstabe'],
        schritteEnt: ['Rand oder Fell schlagen', 'Pause: Buchstabe fertig', 'Text ablesen'],
        baenderVer: ['Text', 'Schläge (· Rand, – Fell, / Pause)', [false, false], [0, 0]],
        baenderEnt: ['Schläge (· Rand, – Fell, / Pause)', 'Text', [false, false], [0, 0]]
      });
      const klartext = () => z.liste.map((e) => e.klar).join('');
      function zeige() {
        const code = ziel ? Krypto.morse(ziel) : '';
        for (const k of tafelKnoepfe) {
          const b = k.dataset.buchstabe;
          const c = Krypto.morse(b);
          k.classList.toggle('ziel', b === ziel);
          k.classList.toggle('kandidat', z.richtung === 'ent' && !!puffer && c.startsWith(puffer) && c !== puffer);
          k.classList.toggle('an', z.richtung === 'ent' && !!puffer && c === puffer);
          [...k.querySelectorAll('.signale-code > span')].forEach((sp, j) => sp.classList.toggle('jetzt', b === ziel && j === puffer.length));
        }
        pufferAnzeige.textContent = puffer ? `Jetzt: ${puffer}` : ziel ? `${ziel}: ${code} – schlag nach` : '';
        R.anleitung.setze(z.richtung === 'ver' ? (ziel ? (puffer.length === code.length ? 2 : 1) : 0) : puffer ? 1 : z.liste.length ? 2 : 0);
        R.nk.setze(
          z.liste.length
            ? {
                titel: 'Deine Nachricht in Ruhe ansehen',
                start: -1,
                schritte: z.liste.map((e, i) => ({
                  text: e.klar === ' ' ? `Zeichen ${i + 1}: Wortlücke – zweimal Pause.` : `Zeichen ${i + 1}: ${e.klar} = ${[...e.code].map(schlagWort).join(', ')}, dann Pause.`,
                  daten: { n: i + 1, b: e.klar.toUpperCase() }
                })),
                zeige(st) {
                  R.baender.setze(z.liste.slice(0, st.daten.n).map((e) => [e[0], e[1]]));
                  for (const k of tafelKnoepfe) k.classList.toggle('ziel', k.dataset.buchstabe === st.daten.b);
                }
              }
            : null
        );
      }
      const eintrag = (b, code) => {
        // b GROSS oder ' ' (Wortlücke); Senden [Text, Schläge], Empfangen [Schläge, Text]
        const klar = b === ' ' ? ' ' : Krypto.klein(b);
        const e = z.richtung === 'ver' ? [klar, `${code}/`] : [`${code}/`, klar];
        e.klar = klar;
        e.code = code;
        return e;
      };
      function schlag(art) {
        if (gesperrt) return R.erklaerung.sage('Nachspielen läuft', 'Während des Nachspielens ist die Eingabe gesperrt.');
        const c = art === 'rand' ? '·' : '–';
        if (z.richtung === 'ver' && ziel) {
          const code = Krypto.morse(ziel);
          if (puffer.length >= code.length) return R.erklaerung.sage('Fertig getrommelt', `${ziel} ist vollständig. Drück jetzt „Pause“.`);
          const soll = code[puffer.length];
          if (c !== soll) return R.erklaerung.sage('Anderer Schlag', `Für ${ziel} kommt jetzt ein Schlag auf ${soll === '·' ? 'den Rand (kurz)' : 'das Fell (lang)'}.`);
        }
        if (puffer.length >= 6) return R.erklaerung.sage('Zu viele Schläge', 'Kein Zeichen der Tafel hat mehr als fünf Schläge. Drück „Pause“ und beginne neu.');
        puffer += c;
        S.ton(art);
        schlagBild(art);
        zeige();
        if (z.richtung === 'ver' && ziel && puffer === Krypto.morse(ziel)) R.erklaerung.sage('Geschafft', `${ziel} = ${puffer}. Drück „Pause“ – dann ist der Buchstabe fertig.`);
        else R.erklaerung.sage(art === 'rand' ? 'Rand: kurz' : 'Fell: lang', `Bisher: ${puffer}`);
      }
      function abschliessen() {
        if (gesperrt) return R.erklaerung.sage('Nachspielen läuft', 'Während des Nachspielens ist die Eingabe gesperrt.');
        if (!puffer) {
          const letzte = z.liste[z.liste.length - 1];
          if (letzte && letzte.klar !== ' ') {
            R.schreibe(eintrag(' ', ''));
            ziel = null;
            zeige();
            return R.erklaerung.sage('Wortlücke', 'Zweimal Pause trennt die Wörter.');
          }
          return R.erklaerung.sage('Pause', z.richtung === 'ver' ? 'Wähle zuerst einen Buchstaben in der Tafel und schlag ihn nach.' : 'Schlag zuerst auf Rand oder Fell.');
        }
        if (z.richtung === 'ver' && ziel && puffer !== Krypto.morse(ziel)) return R.erklaerung.sage('Noch nicht fertig', `${ziel} hat ${Krypto.morse(ziel).length} Schläge – es fehlen noch welche.`);
        let b;
        try {
          b = Krypto.morse(puffer, 'ent');
        } catch {
          puffer = '';
          zeige();
          return R.erklaerung.sage('Unbekannt', 'Diese Schlagfolge steht nicht in der Tafel. Versuch es noch einmal.');
        }
        const code = puffer;
        puffer = '';
        ziel = null;
        const knopf = tafelKnoepfe.find((k) => k.dataset.buchstabe === b);
        R.schreibe(eintrag(b, code), knopf);
        zeige();
        R.erklaerung.sage(`Zeichen ${z.liste.length}`, `${code} = ${Krypto.klein(b)}.`);
      }
      function tippe(t) {
        puffer = '';
        ziel = null;
        const liste = [];
        try {
          const code = z.richtung === 'ver' ? Krypto.morse(t) : String(t);
          const woerter = code.split('//');
          woerter.forEach((w, i) => {
            if (i > 0 && liste.length) liste.push(eintrag(' ', ''));
            for (const teilCode of w.split('/')) {
              const c = teilCode.replace(/\./g, '·').replace(/-/g, '–').replace(/\s+/g, '');
              if (c) liste.push(eintrag(Krypto.morse(c, 'ent'), c));
            }
          });
        } catch (fehler) {
          return R.erklaerung.sage('So geht es nicht', fehler && fehler.message ? fehler.message : 'Diese Eingabe passt nicht.');
        }
        R.setze(liste);
      }
      for (const k of tafelKnoepfe) {
        k.addEventListener('click', () => {
          if (gesperrt) return;
          const b = k.dataset.buchstabe;
          if (z.richtung === 'ent') {
            zeige();
            return R.erklaerung.sage(b, `${b} = ${[...Krypto.morse(b)].map(schlagWort).join(', ')}.`);
          }
          ziel = b;
          puffer = '';
          zeige();
          R.erklaerung.sage(`${b} gewählt`, `${b} = ${Krypto.morse(b)}. Schlag jetzt nach: Punkt = Rand, Strich = Fell.`);
        });
      }
      randKnopf.addEventListener('click', () => schlag('rand'));
      fellKnopf.addEventListener('click', () => schlag('fell'));
      pause.addEventListener('click', abschliessen);
      R.start();
      if (!z.liste.length && vorText && r.aktiv() === reiterListe[0]) tippe(vorText);
      R.erklaerung.sage('Bereit', z.richtung === 'ver' ? 'Tippe in der Morsetafel einen Buchstaben an und schlag ihn auf der Trommel nach.' : 'Schlag auf Rand oder Fell. Nach jedem Buchstaben „Pause“.');
      return {
        schliesse() {
          if (lauf) lauf.abbrechen();
          R.nk.schliesse();
        },
        zustand() {
          const klar = klartext();
          let morse = '';
          try {
            morse = klar.trim() ? Krypto.morse(klar) : '';
          } catch {
            morse = '';
          }
          return z.richtung === 'ver' ? { eingabe: klar, ausgabe: morse } : { eingabe: morse, ausgabe: klar };
        }
      };
    }

    /* ---------- Reiter „Klopfcode“ ---------- */
    function baueKlopfcode() {
      const z = stand.klopfcode;
      const ruhig = AQ.ruhig();
      let zaehler = 0; // Schläge der aktuellen Gruppe (Empfangen)
      let zeile = 0; // erste Gruppe (Empfangen)
      let lauf = 0;
      const zeilen = Krypto.quadrat('');
      const felder = new Map();
      const quadrat = h(
        'table',
        { class: 'signale-quadrat' },
        h('caption', { class: 'sr' }, 'Polybios-Standardquadrat: Zeile, dann Spalte'),
        h('thead', null, h('tr', null, h('th', { scope: 'col', class: 'ecke' }), [1, 2, 3, 4, 5].map((n) => h('th', { scope: 'col' }, String(n))))),
        h(
          'tbody',
          null,
          zeilen.map((zl, i) =>
            h(
              'tr',
              null,
              h('th', { scope: 'row' }, String(i + 1)),
              [...zl].map((b) => {
                const knopf = h('button', { type: 'button', 'data-buchstabe': b, 'aria-label': b === 'I' ? 'I und J' : b }, b === 'I' ? 'I/J' : b);
                felder.set(b, knopf);
                return h('td', null, knopf);
              })
            )
          )
        )
      );
      /* Zellenwand mit Rohr (SVG nach der Werkstatt) */
      const mid = B.neueId('signale-mauer');
      const rid = B.neueId('signale-rohr');
      const schlaegeG = s('g', { class: 'signale-wand-schlaege' });
      const wand = s(
        'svg',
        { class: 'signale-wand', viewBox: '0 0 560 330', 'aria-hidden': 'true', focusable: 'false' },
        s(
          'defs',
          null,
          s('pattern', { id: mid, width: 84, height: 40, patternUnits: 'userSpaceOnUse' }, s('rect', { class: 'signale-fuge', width: 84, height: 40 }), s('rect', { class: 'signale-stein', x: 2, y: 2, width: 80, height: 17, rx: 2 }), s('rect', { class: 'signale-stein-2', x: -40, y: 22, width: 80, height: 16, rx: 2 }), s('rect', { class: 'signale-stein', x: 44, y: 22, width: 80, height: 16, rx: 2 })),
          s('linearGradient', { id: rid, x1: '0', y1: '0', x2: '0', y2: '1' }, s('stop', { offset: '0', class: 'signale-rohr-1' }), s('stop', { offset: '.3', class: 'signale-rohr-2' }), s('stop', { offset: '1', class: 'signale-rohr-1' }))
        ),
        s('rect', { width: 560, height: 330, rx: 12, fill: `url(#${mid})` }),
        s('rect', { class: 'signale-rohr-bild', x: 470, y: -10, width: 44, height: 252, fill: `url(#${rid})` }),
        s('rect', { class: 'signale-rohr-bild', x: -10, y: 198, width: 524, height: 44, rx: 4, fill: `url(#${rid})` }),
        [110, 330].map((x) => s('rect', { class: 'signale-schelle', x, y: 186, width: 20, height: 68, rx: 3 })),
        schlaegeG
      );
      const rohr = h('button', { type: 'button', class: 'signale-rohr', 'aria-label': 'An das Rohr klopfen' });
      const wandTeil = h('div', { class: 'signale-wand-teil' }, wand, rohr);
      const zaehlAnzeige = h('p', { class: 'signale-puffer', 'aria-live': 'polite' });
      const pause = h('button', { type: 'button', class: 'knopf knopf-zweit signale-pause' }, 'Kurze Pause');
      const ton = S.tonSchalter(null);
      const objekt = h('div', { class: 'signale-tisch' }, h('div', { class: 'signale-trommel-teil' }, wandTeil, zaehlAnzeige), h('div', { class: 'signale-tafel-teil' }, h('p', { class: 'signale-teiltitel' }, 'Klopftafel (Polybios-Quadrat)'), quadrat, ton.element));
      const R = rahmen(z, {
        objekt,
        richtungTexte: { ver: 'Senden', ent: 'Empfangen' },
        knoepfe: [pause],
        soGehts: ['Such den Buchstaben im Quadrat (I und J teilen sich ein Feld).', 'Klopf so oft wie die Zeile, mach eine kurze Pause, dann klopf so oft wie die Spalte.', 'Beim Empfangen zählst du mit: erste Gruppe = Zeile, zweite Gruppe = Spalte.'],
        hintergrund: [
          { titel: 'Codierung ≠ Verschlüsselung', text: 'Das Quadrat ist öffentlich. Wer mithört und die Tafel kennt, versteht alles – geschützt ist die Nachricht nicht.' },
          { titel: 'Geschichte', text: 'Gefangene sollen sich so durch Zellenwände und über Heizungsrohre verständigt haben. Fünf Schläge genügen für jede Zeile und Spalte.' },
          { titel: 'Polybios', text: 'Das Klopfquadrat ist das Polybios-Quadrat aus dem Werkzeug „Polybios & Playfair“: Zeile und Spalte geben jedem Buchstaben ein Zahlenpaar.' }
        ],
        beiRichtung: (x) => {
          zaehler = 0;
          zeile = 0;
          zeige();
          R.erklaerung.sage(x === 'ver' ? 'Senden' : 'Empfangen', x === 'ver' ? 'Tippe einen Buchstaben im Quadrat an – dann wird geklopft.' : 'Klopf ans Rohr. Nach der Zeile „Kurze Pause“, nach der Spalte noch einmal.');
        },
        beiTippen: Object.assign((t) => tippe(t), { ent: true }),
        beiSperre: (an) => {
          rohr.disabled = an;
          for (const k of felder.values()) k.disabled = an;
        },
        beiAenderung: () => zeige(),
        schritteVer: ['Buchstaben antippen', 'Zeile klopfen, Pause, Spalte klopfen', 'Zahlenpaare ablesen'],
        schritteEnt: ['Zeile klopfen, Pause', 'Spalte klopfen, Pause', 'Text ablesen'],
        baenderVer: ['Text', 'Klopfzeichen (Zeile, Spalte)', [false, true], [0, 2]],
        baenderEnt: ['Klopfzeichen (Zeile, Spalte)', 'Text', [true, false], [2, 0]]
      });
      function lageVon(b) {
        const code = Krypto.polybios(b);
        return [Number(code[0]), Number(code[1])];
      }
      function markiere(b, zl = 0) {
        for (const [x, k] of felder) {
          const [a] = lageVon(x);
          k.classList.toggle('an', x === b);
          k.classList.toggle('zeile', !b && zl > 0 && a === zl);
        }
      }
      function zeige() {
        pause.hidden = z.richtung !== 'ent';
        if (z.richtung === 'ent') zaehlAnzeige.textContent = zeile ? `Zeile ${zeile} – jetzt die Spalte: ${'•'.repeat(zaehler)}` : zaehler ? `Zeile: ${'•'.repeat(zaehler)}` : '';
        R.anleitung.setze(z.richtung === 'ent' ? (zeile ? 1 : z.liste.length ? 2 : 0) : z.liste.length ? 2 : 0);
        R.nk.setze(
          z.liste.length
            ? {
                titel: 'Deine Nachricht in Ruhe ansehen',
                start: -1,
                schritte: z.liste.map((e, i) => {
                  const [a, b] = lageVon(e.klar.toUpperCase());
                  return { text: `Buchstabe ${i + 1}: ${e.klar} – ${a}-mal klopfen (Zeile), kurze Pause, ${b}-mal klopfen (Spalte).`, daten: { n: i + 1, b: e.klar.toUpperCase() } };
                }),
                zeige(st) {
                  R.baender.setze(z.liste.slice(0, st.daten.n).map((e) => [e[0], e[1]]));
                  markiere(st.daten.b);
                }
              }
            : null
        );
      }
      const eintrag = (b) => {
        const code = Krypto.polybios(b);
        const klar = Krypto.klein(b);
        const e = z.richtung === 'ver' ? [klar, code] : [code, klar];
        e.klar = klar;
        return e;
      };
      function zeichneSchlaege(a, b, bis) {
        AQ.clear(schlaegeG);
        const punkte = [];
        for (let i = 0; i < a; i++) punkte.push([150 + i * 34, 120]);
        for (let i = 0; i < b; i++) punkte.push([340 + i * 34, 120]);
        punkte.slice(0, bis).forEach(([x, y]) => schlaegeG.appendChild(s('circle', { class: 'signale-wand-schlag', cx: x, cy: y, r: 12 })));
        if (bis > 0) schlaegeG.appendChild(s('text', { class: 'signale-wand-text', x: 150, y: 80 }, `Zeile ${Math.min(bis, a)}`));
        if (bis > a) schlaegeG.appendChild(s('text', { class: 'signale-wand-text', x: 340, y: 80 }, `Spalte ${bis - a}`));
      }
      function vorklopfen(b) {
        const [a, c] = lageVon(b);
        const meins = ++lauf;
        const gesamt = a + c;
        if (ruhig) {
          zeichneSchlaege(a, c, gesamt);
          return;
        }
        let i = 0;
        const weiter = () => {
          if (meins !== lauf) return;
          i += 1;
          S.ton('klopf');
          zeichneSchlaege(a, c, i);
          if (i < gesamt) setTimeout(weiter, i === a ? 520 : 240);
        };
        weiter();
      }
      function senden(b) {
        if (gesperrt) return R.erklaerung.sage('Nachspielen läuft', 'Während des Nachspielens ist die Eingabe gesperrt.');
        if (z.richtung === 'ent') return R.erklaerung.sage('Hinweis', 'Beim Empfangen klopfst du ans Rohr – das Quadrat zeigt dir dann den Buchstaben.');
        if (!R.schreibe(eintrag(b), felder.get(b))) return;
        markiere(b);
        vorklopfen(b);
        const [a, c] = lageVon(b);
        R.erklaerung.sage(`Buchstabe ${z.liste.length}`, `${Krypto.klein(b)}: Zeile ${a}, Spalte ${c} → ${a}-mal klopfen, kurze Pause, ${c}-mal klopfen.`);
      }
      function klopf() {
        if (gesperrt) return R.erklaerung.sage('Nachspielen läuft', 'Während des Nachspielens ist die Eingabe gesperrt.');
        if (z.richtung === 'ver') return R.erklaerung.sage('Hinweis', 'Beim Senden tippst du den Buchstaben im Quadrat an – geklopft wird dann von selbst.');
        zaehler += 1;
        S.ton('klopf');
        zeichneSchlaege(zeile || zaehler, zeile ? zaehler : 0, (zeile || 0) + zaehler);
        zeige();
      }
      function kurzePause() {
        if (gesperrt) return R.erklaerung.sage('Nachspielen läuft', 'Während des Nachspielens ist die Eingabe gesperrt.');
        if (z.richtung === 'ver') return R.erklaerung.sage('Hinweis', 'Beim Senden macht das Werkzeug die Pausen selbst.');
        if (!zaehler) return R.erklaerung.sage('Kurze Pause', 'Klopf zuerst ans Rohr.');
        if (zaehler > 5) {
          zaehler = 0;
          zeige();
          return R.erklaerung.sage('Zu viele Schläge', 'Es gibt höchstens 5 Zeilen und höchstens 5 Spalten. Klopf diese Gruppe noch einmal.');
        }
        if (!zeile) {
          zeile = zaehler;
          zaehler = 0;
          markiere(null, zeile);
          zeige();
          return R.erklaerung.sage(`Zeile ${zeile}`, 'Jetzt die Spalte klopfen, dann wieder „Kurze Pause“.');
        }
        const b = Krypto.polybios(`${zeile}${zaehler}`, {}, 'ent');
        const code = `${zeile}${zaehler}`;
        zeile = 0;
        zaehler = 0;
        R.schreibe(eintrag(b), felder.get(b));
        markiere(b);
        zeige();
        R.erklaerung.sage(`Buchstabe ${z.liste.length}`, `Zeile ${code[0]}, Spalte ${code[1]} → ${Krypto.klein(b)}.`);
      }
      function tippe(t) {
        zaehler = 0;
        zeile = 0;
        if (z.richtung === 'ver') return R.setze([...Krypto.nurBuchstaben(t)].map((b) => eintrag(b === 'J' ? 'I' : b)));
        const ziffern = String(t).replace(/[^1-5]/g, '');
        const liste = [];
        for (let i = 0; i + 1 < ziffern.length; i += 2) liste.push(eintrag(Krypto.polybios(ziffern.slice(i, i + 2), {}, 'ent')));
        R.setze(liste);
      }
      for (const [b, k] of felder) k.addEventListener('click', () => senden(b));
      rohr.addEventListener('click', klopf);
      pause.addEventListener('click', kurzePause);
      R.start();
      if (!z.liste.length && vorText && r.aktiv() === reiterListe[0]) tippe(vorText);
      R.erklaerung.sage('Bereit', z.richtung === 'ver' ? 'Tippe im Quadrat einen Buchstaben an – er wird an die Wand geklopft.' : 'Klopf ans Rohr: erst die Zeile, „Kurze Pause“, dann die Spalte.');
      return {
        schliesse() {
          lauf += 1;
          R.nk.schliesse();
        },
        zustand: () => ({ eingabe: z.liste.map((e) => e[0]).join(''), ausgabe: z.liste.map((e) => e[1]).join('') })
      };
    }

    /* ---------- Reiter „Freimaurer“ ---------- */
    function baueFreimaurer() {
      const z = stand.freimaurer;
      const felder = []; // { knopf, symbol }
      const figur = (art, punkt, titel) => {
        const anzahl = art === 'gitter' ? 9 : 4;
        const knoepfe = [];
        for (let f = 1; f <= anzahl; f++) {
          const sym = { figur: art, feld: f, punkt };
          const b = Krypto.freimaurerBuchstabe(sym);
          const knopf = h('button', { type: 'button', class: `signale-figur-feld feld-${f}`, 'data-figur': art, 'data-feld': String(f), 'data-punkt': String(punkt), 'aria-label': `${b}: ${symbolName(sym)}` }, h('span', { class: 'signale-figur-b' }, b), punkt ? h('span', { class: 'signale-figur-punkt', 'aria-hidden': 'true' }, '•') : null);
          felder.push({ knopf, sym, b });
          knoepfe.push(knopf);
        }
        return h('div', { class: 'signale-figur' }, h('div', { class: `signale-figur-${art}` }, knoepfe), h('p', { class: 'signale-figur-titel' }, titel));
      };
      const bild = h('div', { class: 'signale-schluesselbild', role: 'group', 'aria-label': 'Schlüsselbild' }, figur('gitter', false, 'Gitter'), figur('gitter', true, 'Gitter mit Punkt'), figur('kreuz', false, 'Kreuz'), figur('kreuz', true, 'Kreuz mit Punkt'));
      const gross = h('div', { class: 'signale-gross', 'aria-hidden': 'true' });
      const grossText = h('p', { class: 'signale-gross-text text-2' });
      const leiste = h(
        'div',
        { class: 'signale-symbolleiste', role: 'group', 'aria-label': 'Symbole zum Entschlüsseln' },
        felder.map(({ sym }) => h('button', { type: 'button', 'data-figur': sym.figur, 'data-feld': String(sym.feld), 'data-punkt': String(sym.punkt), 'aria-label': symbolName(sym) }, symbolSvg(sym)))
      );
      const leisteTeil = h('div', { class: 'signale-leiste-teil' }, h('p', { class: 'signale-teiltitel' }, 'Symbol wählen'), leiste);
      const objekt = h('div', { class: 'signale-tisch signale-tisch-bild' }, h('div', { class: 'signale-papier' }, bild), h('div', { class: 'signale-symbolpanel' }, h('p', { class: 'signale-teiltitel' }, 'Symbol'), gross, grossText), leisteTeil);
      // Mehr ausprobieren: Übungsnachricht, Symbole zählen
      const uebSymbole = h('div', { class: 'signale-uebung-symbole', 'aria-label': 'Übungsnachricht in Symbolen', role: 'img' });
      for (const wort of BEISPIEL.uebung.split(' ')) uebSymbole.appendChild(h('span', { class: 'signale-wort' }, Krypto.freimaurer(wort).map((x) => symbolSvg(x))));
      const uebFeld = B.textfeld({ beschriftung: 'Deine Lösung', max: 60, zeilen: 1, art: 'klartext' });
      const pruefen = h('button', { type: 'button', class: 'knopf knopf-leise signale-pruefen' }, 'Prüfen');
      const uebErgebnis = h('p', { class: 'signale-uebung-ergebnis', 'aria-live': 'polite' });
      const zaehlen = h('button', { type: 'button', class: 'knopf knopf-leise signale-zaehlen' }, 'Deine Nachricht zählen');
      const zaehlung = h('div', { class: 'signale-zaehlung', 'aria-live': 'polite' });
      const raum = Krypto.schluesselraum('substitution');
      const R = rahmen(z, {
        objekt,
        richtungTexte: { ver: 'Verschlüsseln', ent: 'Entschlüsseln' },
        mehrStichworte: 'Übungsnachricht, Symbole zählen',
        mehrTeile: [
          h('p', { class: 'signale-teiltitel' }, 'Übungsnachricht entschlüsseln'),
          h('div', { class: 'signale-uebung' }, uebSymbole, uebFeld.element, pruefen, uebErgebnis),
          h('p', { class: 'signale-teiltitel' }, 'Angriff: Symbole zählen'),
          h('p', { class: 'text-2' }, 'Jedes Symbol steht immer für denselben Buchstaben. Das häufigste ist oft e.'),
          zaehlen,
          zaehlung
        ],
        soGehts: ['Such den Buchstaben im Schlüsselbild.', 'Die Linien um sein Feld sind das Symbol – in den Figuren mit Punkt gehört der Punkt dazu.', 'Entschlüsseln: Such das Feld mit genau diesem Umriss.'],
        hintergrund: [
          { titel: 'Schlüssel', zeilen: [['Standardbelegung', 'öffentlich → nur eine Codierung'], ['Eigene Belegung', 'geheime Reihenfolge der 26 Buchstaben'], ['Möglichkeiten', `${raum.formel} ${S.ungefaehr(raum.anzahl)}`]] },
          { titel: 'Warum unsicher?', text: 'Jeder Buchstabe hat immer dasselbe Symbol. In einem langen Text verraten die Häufigkeiten die Buchstaben – meist zuerst das e.' },
          { titel: 'Geschichte', text: 'Freimaurer sollen das Alphabet im 18. Jahrhundert genutzt haben. Es ist eine monoalphabetische Ersetzung mit Bildern statt Buchstaben.' }
        ],
        tippen: true,
        beiRichtung: (x) => {
          zeige();
          R.erklaerung.sage(x === 'ver' ? 'Verschlüsseln' : 'Entschlüsseln', x === 'ver' ? 'Tippe im Schlüsselbild ein Feld an. Sein Umriss wird zum Symbol.' : 'Wähle unten ein Symbol. Das passende Feld leuchtet, der Buchstabe kommt ins Band.');
        },
        beiTippen: Object.assign((t) => R.setze([...Krypto.nurBuchstaben(t)].map((b) => eintrag(Krypto.freimaurer(b)[0]))), { ent: false }),
        beiSperre: (an) => {
          for (const f of felder) f.knopf.disabled = an;
          for (const k of leiste.querySelectorAll('button')) k.disabled = an;
        },
        beiAenderung: () => zeige(),
        schritteVer: ['Feld antippen', 'Symbol entsteht', 'Geheimtext ablesen'],
        schritteEnt: ['Symbol wählen', 'Feld leuchtet', 'Klartext ablesen'],
        baenderVer: ['Klartext', 'Geheimtext (Symbole)', [false, true], [0, 0]],
        baenderEnt: ['Geheimtext (Symbole)', 'Klartext', [true, false], [0, 0]]
      });
      function eintrag(sym) {
        const klar = Krypto.klein(sym.buchstabe || Krypto.freimaurerBuchstabe(sym));
        const code = symbolCode(sym);
        const e = z.richtung === 'ver' ? [klar, code] : [code, klar];
        e.klar = klar;
        e.sym = { figur: sym.figur, feld: sym.feld, punkt: sym.punkt };
        return e;
      }
      // Symbole statt Codes im Geheimtext-Band
      function zeichneSymbole(bis = z.liste.length) {
        const ziel = R.baender.ausgaben[z.richtung === 'ver' ? 1 : 0];
        AQ.clear(ziel);
        z.liste.slice(0, bis).forEach((e, i) => ziel.appendChild(h('span', { class: `station-zeichen signale-band-symbol${i === bis - 1 ? ' neu' : ''}`, 'aria-label': symbolName(e.sym) }, symbolSvg(e.sym))));
      }
      function leuchte(sym) {
        for (const f of felder) f.knopf.classList.toggle('an', !!sym && f.sym.figur === sym.figur && f.sym.feld === sym.feld && f.sym.punkt === sym.punkt);
        AQ.clear(gross);
        if (sym) gross.appendChild(symbolSvg(sym, 'gross'));
        grossText.textContent = sym ? `${Krypto.klein(Krypto.freimaurerBuchstabe(sym))}: ${symbolName(sym)}` : 'Tippe ein Feld an.';
      }
      function zeige() {
        zeichneSymbole();
        leisteTeil.hidden = z.richtung !== 'ent';
        const letzte = z.liste[z.liste.length - 1];
        leuchte(letzte ? letzte.sym : null);
        R.anleitung.setze(z.liste.length ? 2 : 0);
        R.nk.setze(
          z.liste.length
            ? {
                titel: 'Deine Nachricht in Ruhe ansehen',
                start: -1,
                schritte: z.liste.map((e, i) => ({ text: `Zeichen ${i + 1}: ${e.klar} – ${symbolName(e.sym)}.`, daten: { n: i + 1 } })),
                zeige(st) {
                  R.baender.setze(z.liste.slice(0, st.daten.n).map((e) => [e[0], e[1]]));
                  zeichneSymbole(st.daten.n);
                  leuchte(z.liste[st.daten.n - 1].sym);
                }
              }
            : null
        );
      }
      function waehle(sym, von) {
        if (gesperrt) return R.erklaerung.sage('Nachspielen läuft', 'Während des Nachspielens ist die Eingabe gesperrt.');
        const b = Krypto.freimaurerBuchstabe(sym);
        if (!R.schreibe(eintrag({ ...sym, buchstabe: b }), von)) return;
        zeige();
        R.erklaerung.sage(`Zeichen ${z.liste.length}`, z.richtung === 'ver' ? `${Krypto.klein(b)} steht im Feld „${symbolName(sym)}“ – die Linien um das Feld sind das Symbol.` : `Dieses Symbol gehört zum Feld von ${Krypto.klein(b)}.`);
      }
      for (const f of felder) {
        f.knopf.addEventListener('click', () => {
          if (z.richtung === 'ent') return R.erklaerung.sage('Hinweis', 'Beim Entschlüsseln wählst du unten das Symbol – das Feld leuchtet dann von selbst.');
          waehle(f.sym, f.knopf);
        });
      }
      for (const k of leiste.querySelectorAll('button')) {
        k.addEventListener('click', () => waehle({ figur: k.dataset.figur, feld: Number(k.dataset.feld), punkt: k.dataset.punkt === 'true' }, k));
      }
      pruefen.addEventListener('click', () => {
        const ok = Krypto.nurBuchstaben(uebFeld.wert()) === Krypto.nurBuchstaben(BEISPIEL.uebung);
        uebErgebnis.textContent = ok ? '✓ Stimmt!' : 'Noch nicht – vergleiche die Umrisse noch einmal mit dem Schlüsselbild.';
        uebErgebnis.classList.toggle('signale-stimmt', ok);
        if (ok) S.funken(uebErgebnis);
      });
      zaehlen.addEventListener('click', () => {
        AQ.clear(zaehlung);
        const klar = z.liste.map((e) => e.klar).join('');
        if (!klar) return zaehlung.appendChild(h('p', { class: 'text-2' }, 'Schreib zuerst eine Nachricht.'));
        const hf = Krypto.haeufigkeiten(klar);
        const liste = Object.entries(hf).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).slice(0, 8);
        zaehlung.appendChild(h('div', { class: 'signale-zaehl-liste' }, liste.map(([b, n]) => h('span', { class: 'signale-zaehl', 'aria-label': `${symbolName(Krypto.freimaurer(b)[0])}: ${n}-mal` }, symbolSvg(Krypto.freimaurer(b)[0]), h('b', null, `${n}×`)))));
        zaehlung.appendChild(B.hinweis('falle', 'Bei kurzen Texten weichen die Häufigkeiten stark von der deutschen Sprache ab – erst lange Texte verraten zuverlässig das e.', { falle: 'P6' }));
      });
      R.start();
      if (!z.liste.length && vorText && r.aktiv() === reiterListe[0] && z.richtung === 'ver') R.setze([...Krypto.nurBuchstaben(vorText)].map((b) => eintrag(Krypto.freimaurer(b)[0])));
      R.erklaerung.sage('Bereit', z.richtung === 'ver' ? 'Tippe im Schlüsselbild ein Feld an. Sein Umriss wird zum Symbol.' : 'Wähle unten ein Symbol – das passende Feld leuchtet.');
      return {
        schliesse() {
          R.nk.schliesse();
        },
        zustand: () => ({ eingabe: z.liste.map((e) => (z.richtung === 'ver' ? e.klar : e[0])).join(''), ausgabe: z.liste.map((e) => (z.richtung === 'ver' ? e[1] : e.klar)).join(''), symbole: z.liste.map((e) => ({ ...e.sym })) })
      };
    }

    function baue(id) {
      schliesseTeil();
      AQ.clear(r.flaeche);
      teil = id === 'klopfcode' ? baueKlopfcode() : id === 'freimaurer' ? baueFreimaurer() : baueMorse();
    }
    baue(r.aktiv());

    return {
      schliesse() {
        schliesseTeil();
      },
      zustand() {
        const id = r.aktiv();
        const z = stand[id] || stand.morse;
        const extra = teil ? teil.zustand() : {};
        return { reiter: id, richtung: z.richtung, eingabe: '', ausgabe: '', symbole: [], ...extra, gesperrt };
      }
    };
  }

  KRLabor.registriere('signale', { titel: 'Codes & Signale', oeffne });
})();
