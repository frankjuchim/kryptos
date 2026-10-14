/* Kryptos – Labor-Werkzeug „Versteckte Botschaften“ (Zusatz; Plan M10 Task 231, E183).
   Herkunft: Krypto-Werkstatt (Ideen von A. Bodendiek), stationen/steganographie.html @59004d9 – docs/FREMDCODE.md
   Nullchiffre: Brief auf liniertem Papier mit Briefmarke („Post für dich“). „Brief schreiben“: Buchstaben stempeln → Wort-
   vorschläge nach der Leseregel (1./2./3. Buchstabe) oder ein eigenes Wort → der Brief wächst; „Brief aufdecken“: in jedem
   Wort eines Übungsbriefs den zählenden Buchstaben antippen. Punktmethode: Zeitungsmeldung; „Punkte stechen“: Nachricht
   stempeln, Punkte unter passende Buchstaben (Krypto.punkteSetzen), Sichtbarkeit per Regler; „Punkte finden“: Lupe (Klon,
   per CSS vergrößert; Pfeiltasten bewegen sie) und markierte Buchstaben antippen (Krypto.punktmethode). Beispieltexte ohne
   Vornamen (E183). Rechnet nur über Krypto.*; speichert nichts. */
'use strict';
(() => {
  const { h } = AQ;
  const B = KRLaborBau;
  const S = KRStation;
  // Eigene Wörter und Texte (Regeltest: in keinem Seed/Material/Video; keine Vornamen, E183)
  const BEISPIEL = {
    woerter:
      'Abends Adler Ahornblatt alte Ameisen Apfelbaum Aquarell Aquarium Avocado Axt Azur Bach backen bald Bananen Beeren bellen Boje Boxer Buche bunte Butterbrot Chor Clown Comic Dackel Delfin dicke Docht Dorfplatz Drachen Duft dunkel Dusche Echo Echse Ecke Edelstein Efeu Eichel Eichen Elch Erbsen Eselchen Exot Fahrrad Falter Farn Federn Feldweg Fenster Fisch Fjord Flöte fröhlich Frosch Fuchs Gabel Gans Garten Geige gelbe gerne Glocke Gras grüne Gyros Hafer Hase Hexe Himbeeren Hof Holz Huhn Hummeln Hyäne Igel Ikone Jacke Jaguar Joghurt Jubel Juli Juni Käfer Kajak Kakao Kamel Kanu Kartoffeln Kiefer Kiwi Knopf Kojote Koje Kuchen Kuh Lachs Laub laut Lava Lavendel Leiter Linsen Löwen Luchs Lupe Luxus Lyra Mais malen Marmelade Maus Meer Milch Mixer Möwen Mühle munter Muschel Mythen Nachbar Nachts Nashorn Nest neue Nixe Nudeln nur Ofen Ohren Oktober Olive Onkel Otter Ovale Ozean Ozelot Panda Physik Pilze Pirat Pizza Pony prima Pyramide Quark Qualle quer Quitte Rabe Radio Raupe reife Riese Rose rote Rüben Rucksack Ruhe Sachen Sack Salat Sand Schaf sehr Seil Sequenz Socken Specht Squash Stern Suppe Tante Taxi Tee Text Tiger Tomaten Topf Tulpen Tyrann Ufer Uhr Uhu Vase Vater Vogel Vulkan Waage Wald Wiese Wolle Wurm Xylophon Yak Yoga Zebra Zecke Zelt Ziege Zimt Zirkus Zucker zwei Zylinder',
    briefe: [
      { stelle: 1, text: 'Pandas im Laub zanken.' },
      { stelle: 2, text: 'Otter malen Flusskiesel.' },
      { stelle: 3, text: 'Frösche, Schnecken, Herbstlaub.' }
    ],
    zeitung: 'Am Samstag lädt der Kleingartenverein zum Hoffest. Besucher bestaunen Kürbisse, kosten Apfelsaft und schauen den Imkern über die Schulter.',
    punkte: 'bis dann'
  };
  const WOERTER = BEISPIEL.woerter.split(' ');
  const REITER_TITEL = { nullchiffre: 'Nullchiffre', punkte: 'Punktmethode' };
  const MAX = 40; // Wörter bzw. Buchstaben je Nachricht
  const LUPE = 2.2; // Vergrößerung

  /** Text in Wörter und Zwischenräume zerlegen (Darstellung) */
  function teile(text) {
    return String(text).match(/[A-Za-zÄÖÜäöüß]+|[^A-Za-zÄÖÜäöüß]+/g) || [];
  }
  const istWort = (t) => /^[A-Za-zÄÖÜäöüß]+$/.test(t);

  function oeffne(container, voreinstellung, umgebung) {
    const v = voreinstellung || {};
    const reiterListe = KRLabor.reiterFuer('verstecke', v, umgebung);
    const vorRichtung = v.richtung === 'ent' ? 'ent' : 'ver';
    const stand = {
      nullchiffre: { richtung: vorRichtung, stelle: [1, 2, 3].includes(v.stelle) ? v.stelle : 1, woerter: [], brief: 0, gefunden: [] },
      punkte: { richtung: vorRichtung, nachricht: '', gefunden: [], sicht: 0.35 }
    };
    let gesperrt = false;
    let teil = null;

    const r = B.reiter(reiterListe.map((id) => ({ id, titel: REITER_TITEL[id] })), { aktiv: reiterListe[0], beiWechsel: baue });
    const wurzel = h('div', { class: 'labor-werkzeug verstecke-werkzeug' }, r.element);
    container.appendChild(wurzel);
    KRStation.herkunft(wurzel);

    const SO_GEHTS = ['Nullchiffre: In einem harmlosen Brief zählt in jedem Wort nur ein Buchstabe – zum Beispiel der erste.', 'Punktmethode: Winzige Nadelstiche markieren Buchstaben in einer Zeitung.', 'Wer die Regel kennt, sammelt die Buchstaben der Reihe nach ein. Alle anderen lesen nur einen gewöhnlichen Text.'];
    const HINTERGRUND = [
      { titel: 'Verstecken ≠ verschlüsseln', zeilen: [['Steganographie', 'versteckt, dass es eine Nachricht gibt'], ['Kryptographie', 'macht den Inhalt unlesbar'], ['Geheim ist hier', 'die Regel selbst']] },
      { titel: 'Schwäche', text: 'Nach Kerckhoffs soll nur der Schlüssel geheim sein. Beim Verstecken ist die Methode das Geheimnis – wer sie kennt, liest alles. Deshalb erst verschlüsseln, dann verstecken.' },
      { titel: 'Geschichte', text: 'Histiaios soll eine Botschaft auf den geschorenen Kopf eines Boten tätowiert haben. Geheimtinte aus Zitronensaft wird beim Erwärmen sichtbar, Mikropunkte verkleinern ganze Seiten auf die Größe eines i-Punkts.' }
    ];

    /** gemeinsamer Rahmen: Bühne | Richtung, Bänder, Nachspielen, Mehr; darunter „So funktioniert’s“ und Hintergrund */
    function rahmen(z, { objekt, bedienung = [], mehrTeile = [], mehrStichworte = '', richtungTexte, beiRichtung, beiSperre, baenderVer, baenderEnt, schritteVer, schritteEnt, beiAenderung }) {
      let bereit = false;
      const anleitung = S.anleitung(null, []);
      const erklaerung = S.erklaerung(null);
      const richtungWahl = B.richtung({ wert: z.richtung, texte: richtungTexte, beiWechsel: (x) => wechsle(x) });
      const baender = S.baender({ beiAenderung: (bd) => bereit && !gesperrt && beiAenderung(bd.eintraege.length) });
      const nsOrt = h('div', { class: 'verstecke-nachspiel' });
      const nk = S.nachspielKnopf(nsOrt, { sperre: (an) => sperre(an), beiEnde: () => beiAenderung(), beiLeer: (t) => erklaerung.sage('Nachspielen', t) });
      const mehr = S.mehr(null, 'Mehr ausprobieren', mehrStichworte, ...mehrTeile);
      const buehne = h('div', { class: 'verstecke-buehne' }, anleitung.element, objekt, erklaerung.element);
      const rechts = h('div', { class: 'verstecke-bedienung' }, richtungWahl.element, ...bedienung, baender.element, nk.element, nsOrt, mehr);
      r.flaeche.append(h('div', { class: 'verstecke-objekt' }, buehne, rechts), S.soGehts(null, SO_GEHTS), S.hintergrund(null, HINTERGRUND));
      function beschriften() {
        const [o, u, g, ww] = z.richtung === 'ver' ? baenderVer : baenderEnt;
        baender.beschrifte(o, u, g, [0, 0], ww || [false, false]);
        anleitung.texte(z.richtung === 'ver' ? schritteVer : schritteEnt);
      }
      function wechsle(x) {
        z.richtung = x;
        beschriften();
        beiRichtung(x);
      }
      function sperre(an) {
        gesperrt = an;
        S.sperre(r.flaeche, an);
        richtungWahl.sperre(an);
        for (const b of baender.element.querySelectorAll('button')) b.disabled = an || b.disabled;
        if (typeof beiSperre === 'function') beiSperre(an);
      }
      return {
        anleitung,
        erklaerung,
        baender,
        nk,
        zeigeBaender(liste) {
          bereit = false;
          baender.setze(liste);
          bereit = true;
        },
        start() {
          beschriften();
          bereit = true;
        }
      };
    }

    function schliesseTeil() {
      if (teil) teil.schliesse();
      teil = null;
      gesperrt = false;
      S.sperre(r.flaeche, false);
    }

    /* ---------- Reiter „Nullchiffre“ ---------- */
    function baueNullchiffre() {
      const z = stand.nullchiffre;
      let gewaehlt = null; // gestempelter Buchstabe (Brief schreiben)
      const titel = h('p', { class: 'verstecke-brief-titel' }, 'Post für dich');
      const koerper = h('p', { class: 'verstecke-brief-text' });
      const brief = h('div', { class: 'verstecke-brief' }, h('span', { class: 'verstecke-marke', 'aria-hidden': 'true' }), h('span', { class: 'verstecke-lochung', 'aria-hidden': 'true' }), titel, koerper);
      const briefwahl = h('div', { class: 'verstecke-briefwahl', role: 'group', 'aria-label': 'Übungsbrief wählen' }, BEISPIEL.briefe.map((b, i) => h('button', { type: 'button', class: 'knopf knopf-leise', 'data-brief': String(i) }, `Brief ${i + 1} · ${b.stelle}. Buchstabe`)));
      const stempelTitel = h('p', { class: 'verstecke-feldtitel' }, '① Buchstaben stempeln, den du verstecken willst');
      const stempel = S.stempel(null, (b) => waehle(b), { beschriftung: 'Stempel für die geheime Nachricht' });
      const vorschlaege = h('div', { class: 'verstecke-vorschlaege', role: 'group', 'aria-label': 'Wortvorschläge' });
      const eigenFeld = h('input', { type: 'text', class: 'labor-eingabe', maxlength: '20', autocomplete: 'off', spellcheck: 'false', 'aria-label': 'Eigenes Wort' });
      const eigenKnopf = h('button', { type: 'button', class: 'knopf knopf-leise' }, 'Eigenes Wort nehmen');
      const eigen = h('div', { class: 'verstecke-eigen' }, eigenFeld, eigenKnopf);
      const schreibTeil = h('div', { class: 'verstecke-schreiben' }, stempelTitel, stempel.element, h('p', { class: 'verstecke-feldtitel' }, '② Passendes Wort antippen'), vorschlaege, eigen);
      const stelleKnoepfe = [1, 2, 3].map((n) => h('button', { type: 'button', role: 'radio', 'data-stelle': String(n) }, `${n}. Buchstabe`));
      const stelleWahl = h('div', { class: 'verstecke-stelle labor-basis', role: 'radiogroup', 'aria-label': 'Leseregel' }, stelleKnoepfe);
      const R = rahmen(z, {
        objekt: h('div', { class: 'verstecke-tisch' }, brief),
        bedienung: [briefwahl, schreibTeil],
        mehrStichworte: 'Leseregel',
        mehrTeile: [h('p', { class: 'verstecke-feldtitel' }, 'Leseregel: Welcher Buchstabe jedes Wortes zählt?'), stelleWahl, h('p', { class: 'text-2' }, 'Jedes Wort zählt – wähle Wörter, die zusammen natürlich klingen.')],
        richtungTexte: { ver: 'Brief schreiben', ent: 'Brief aufdecken' },
        beiRichtung: () => {
          gewaehlt = null;
          z.gefunden = [];
          zeige();
          R.erklaerung.sage(z.richtung === 'ver' ? 'Brief schreiben' : 'Brief aufdecken', z.richtung === 'ver' ? 'Stempel einen Buchstaben und wähle ein Wort. So wächst ein harmloser Brief.' : 'Tippe in jedem Wort den Buchstaben an, der laut Leseregel zählt.');
        },
        beiSperre: (an) => {
          stempel.setze(!an);
          eigenKnopf.disabled = an;
          for (const b of [...vorschlaege.querySelectorAll('button'), ...briefwahl.querySelectorAll('button'), ...stelleKnoepfe]) b.disabled = an;
        },
        baenderVer: ['Versteckte Nachricht', 'Brief (Wörter)', [false, false], [false, true]],
        baenderEnt: ['Gefundene Buchstaben', 'Nachricht', [false, false]],
        schritteVer: ['Buchstaben stempeln', 'Wort wählen', 'Brief wächst'],
        schritteEnt: ['Brief wählen', 'In jedem Wort den Buchstaben antippen', 'Nachricht ablesen'],
        beiAenderung: (n) => {
          if (n !== undefined && z.richtung === 'ver') z.woerter = z.woerter.slice(0, n);
          if (n !== undefined && z.richtung === 'ent') z.gefunden = z.gefunden.slice(0, n);
          zeige();
        }
      });
      const briefText = () => (z.richtung === 'ver' ? z.woerter.join(' ') : BEISPIEL.briefe[z.brief].text);
      const stelle = () => (z.richtung === 'ver' ? z.stelle : BEISPIEL.briefe[z.brief].stelle);
      function zaehlt(wort) {
        return Krypto.nurBuchstaben(wort)[stelle() - 1];
      }
      function zeigeBrief() {
        AQ.clear(koerper);
        if (z.richtung === 'ver' && !z.woerter.length) {
          koerper.appendChild(h('span', { class: 'verstecke-leer' }, 'Dein Brief ist noch leer. Stempel rechts den ersten Buchstaben deiner Nachricht.'));
          return;
        }
        let nr = 0;
        for (const t of teile(briefText())) {
          if (!istWort(t)) {
            koerper.appendChild(document.createTextNode(t));
            continue;
          }
          const i = nr++;
          const fertig = z.richtung === 'ent' && i < z.gefunden.length;
          const wort = h('span', { class: `verstecke-wort${fertig ? ' fertig' : ''}${z.richtung === 'ent' && i === z.gefunden.length ? ' naechst' : ''}`, 'data-wort': String(i) });
          [...t].forEach((c, p) => {
            const zaehltHier = p === stelle() - 1;
            const sichtbar = z.richtung === 'ver' ? zaehltHier : fertig && zaehltHier;
            if (z.richtung === 'ent') {
              const k = h('button', { type: 'button', class: `verstecke-buchstabe${sichtbar ? ' zaehlt' : ''}`, 'data-wort': String(i), 'data-pos': String(p), 'aria-label': `Wort ${i + 1}, Buchstabe ${p + 1}: ${c}` }, c);
              k.addEventListener('click', () => antippen(i, p, k));
              wort.appendChild(k);
            } else wort.appendChild(h('span', { class: sichtbar ? 'zaehlt' : null }, c));
          });
          koerper.appendChild(wort);
        }
      }
      function zeigeVorschlaege() {
        AQ.clear(vorschlaege);
        if (!gewaehlt) {
          vorschlaege.appendChild(h('p', { class: 'text-2' }, 'Stempel zuerst einen Buchstaben.'));
          return;
        }
        const passend = WOERTER.filter((w) => Krypto.nurBuchstaben(w)[z.stelle - 1] === gewaehlt).slice(0, 8);
        if (!passend.length) vorschlaege.appendChild(h('p', { class: 'text-2' }, 'Kein Vorschlag – nimm ein eigenes Wort.'));
        for (const w of passend) {
          const k = h('button', { type: 'button', class: 'knopf knopf-leise' }, w);
          k.addEventListener('click', () => nimm(w, k));
          vorschlaege.appendChild(k);
        }
      }
      function zeige() {
        const ver = z.richtung === 'ver';
        briefwahl.hidden = ver;
        schreibTeil.hidden = !ver;
        titel.textContent = ver ? 'Post für dich' : `Übungsbrief ${z.brief + 1} · Leseregel: ${stelle()}. Buchstabe`;
        for (const k of briefwahl.querySelectorAll('button')) k.setAttribute('aria-pressed', String(Number(k.dataset.brief) === z.brief));
        for (const k of stelleKnoepfe) {
          const an = Number(k.dataset.stelle) === z.stelle;
          k.setAttribute('aria-checked', String(an));
          k.setAttribute('tabindex', an ? '0' : '-1');
        }
        stempel.markiere(gewaehlt);
        zeigeBrief();
        zeigeVorschlaege();
        const liste = ver ? z.woerter.map((w) => [Krypto.klein(zaehlt(w)), `${w} `]) : z.gefunden.map((b) => [b, b]);
        R.zeigeBaender(liste);
        R.anleitung.setze(ver ? (gewaehlt ? 1 : z.woerter.length ? 2 : 0) : z.gefunden.length ? 2 : 1);
        const woerter = teile(briefText()).filter(istWort);
        R.nk.setze(
          liste.length
            ? {
                titel: 'In Ruhe ansehen',
                start: -1,
                schritte: (ver ? z.woerter : woerter.slice(0, z.gefunden.length)).map((w, i) => ({ text: `Wort ${i + 1}: ${w} – der ${stelle()}. Buchstabe ${zaehlt(w)} zählt.`, daten: { n: i + 1 } })),
                zeige(st) {
                  R.zeigeBaender(liste.slice(0, st.daten.n));
                  for (const wEl of koerper.querySelectorAll('.verstecke-wort')) wEl.classList.toggle('nachspiel', Number(wEl.dataset.wort) === st.daten.n - 1);
                }
              }
            : null
        );
      }
      function waehle(b) {
        if (gesperrt) return;
        gewaehlt = b;
        zeige();
        R.erklaerung.sage(`${b} gestempelt`, `Wähle ein Wort, dessen ${z.stelle}. Buchstabe ein ${b} ist – oder tipp ein eigenes ein.`);
      }
      function nimm(wort, von) {
        if (gesperrt || !gewaehlt) return;
        if (Krypto.nurBuchstaben(wort)[z.stelle - 1] !== gewaehlt) {
          return R.erklaerung.sage('Passt nicht', `Bei „${wort}“ ist der ${z.stelle}. Buchstabe kein ${gewaehlt}.`);
        }
        if (z.woerter.length >= MAX) return;
        z.woerter.push(wort);
        const b = gewaehlt;
        gewaehlt = null;
        zeige();
        const neu = koerper.querySelector(`.verstecke-wort[data-wort="${z.woerter.length - 1}"]`);
        S.flug(von, neu, wort);
        R.erklaerung.sage(`Wort ${z.woerter.length}`, `„${wort}“ versteckt das ${b}. Der Brief liest sich ganz normal.`);
      }
      function antippen(i, p, k) {
        if (gesperrt) return;
        if (i !== z.gefunden.length) return R.erklaerung.sage('Der Reihe nach', `Nimm dir zuerst Wort ${z.gefunden.length + 1} vor.`);
        if (p !== stelle() - 1) return R.erklaerung.sage('Noch nicht', `Welcher Buchstabe zählt bei diesem Brief? Leseregel: der ${stelle()}. Buchstabe jedes Wortes.`);
        const wort = teile(briefText()).filter(istWort)[i];
        z.gefunden.push(Krypto.klein(zaehlt(wort)));
        zeige();
        S.flug(k, R.baender.letztes(0), z.gefunden[z.gefunden.length - 1]);
        const alle = teile(briefText()).filter(istWort).length;
        if (z.gefunden.length === alle) {
          R.erklaerung.sage('Aufgedeckt', `Die versteckte Nachricht lautet: ${z.gefunden.join('')}.`);
          S.funken(koerper);
        } else R.erklaerung.sage(`Wort ${i + 1}`, `${zaehlt(wort)} gefunden. Weiter mit Wort ${i + 2}.`);
      }
      stelleKnoepfe.forEach((k) =>
        k.addEventListener('click', () => {
          if (gesperrt) return;
          const neu = Number(k.dataset.stelle);
          if (neu === z.stelle) return;
          const hatte = z.woerter.length > 0;
          z.stelle = neu;
          z.woerter = [];
          gewaehlt = null;
          zeige();
          R.erklaerung.sage(`Leseregel: ${neu}. Buchstabe`, `${hatte ? 'Neuer Brief begonnen. ' : ''}Jetzt zählt in jedem Wort der ${neu}. Buchstabe.`);
        })
      );
      for (const k of briefwahl.querySelectorAll('button')) {
        k.addEventListener('click', () => {
          if (gesperrt) return;
          z.brief = Number(k.dataset.brief);
          z.gefunden = [];
          zeige();
          R.erklaerung.sage(`Übungsbrief ${z.brief + 1}`, `Leseregel: der ${stelle()}. Buchstabe jedes Wortes. Tippe ihn in jedem Wort an.`);
        });
      }
      eigenKnopf.addEventListener('click', () => {
        if (gesperrt) return;
        const roh = eigenFeld.value.trim();
        if (!gewaehlt) return R.erklaerung.sage('Erst stempeln', 'Stempel zuerst den Buchstaben, den das Wort verstecken soll.');
        if (!istWort(roh)) return R.erklaerung.sage('Ein Wort', 'Gib genau ein Wort ein (nur Buchstaben).');
        if (Krypto.nurBuchstaben(roh)[z.stelle - 1] !== gewaehlt) return R.erklaerung.sage('Passt nicht', `Bei „${roh}“ ist der ${z.stelle}. Buchstabe kein ${gewaehlt}.`);
        eigenFeld.value = '';
        nimm(roh, eigenKnopf);
      });
      R.start();
      zeige();
      R.erklaerung.sage(z.richtung === 'ver' ? 'Brief schreiben' : 'Brief aufdecken', z.richtung === 'ver' ? 'Stempel rechts einen Buchstaben und wähle ein Wort. So wächst ein harmloser Brief.' : 'Wähle einen Übungsbrief und tippe in jedem Wort den zählenden Buchstaben an.');
      return {
        schliesse: () => R.nk.schliesse(),
        zustand() {
          const ver = z.richtung === 'ver';
          return {
            brief: briefText(),
            stelle: stelle(),
            eingabe: ver ? z.woerter.map((w) => Krypto.klein(zaehlt(w))).join('') : z.gefunden.join(''),
            ausgabe: ver ? briefText() : z.gefunden.join('')
          };
        }
      };
    }

    /* ---------- Reiter „Punktmethode“ ---------- */
    function bauePunkte() {
      const z = stand.punkte;
      const ruhig = AQ.ruhig();
      const zeitung = BEISPIEL.zeitung;
      const vorgabe = Krypto.punkteSetzen(zeitung, BEISPIEL.punkte).markiert;
      const zeichen = []; // { el, pos: [Positionen in nurBuchstaben] }
      const blatt = h('div', { class: 'verstecke-zeitung' });
      const kopf = h('p', { class: 'verstecke-zeitung-kopf' }, 'Aus der Region');
      const text = h('p', { class: 'verstecke-zeitung-text' });
      const lupeInhalt = h('div', { class: 'verstecke-lupe-inhalt', 'aria-hidden': 'true' });
      const lupe = h('div', { class: 'verstecke-lupe', tabindex: '0', role: 'img', 'aria-label': 'Lupe: mit den Pfeiltasten bewegen' }, lupeInhalt);
      blatt.append(kopf, text, lupe);
      let lx = 60;
      let ly = 40;
      const stempelTitel = h('p', { class: 'verstecke-feldtitel' }, 'Nachricht stempeln – die Nadel sticht unter passende Buchstaben');
      const stempel = S.stempel(null, (b) => steche(b), { beschriftung: 'Stempel für die Nachricht' });
      const sicht = h('input', { type: 'range', class: 'verstecke-sichtbarkeit', min: '5', max: '100', step: '5', 'aria-label': 'Sichtbarkeit der Punkte' });
      sicht.value = String(Math.round(z.sicht * 100));
      const sichtText = h('span', { class: 'text-2' });
      const stechTeil = h('div', { class: 'verstecke-schreiben' }, stempelTitel, stempel.element);
      const R = rahmen(z, {
        objekt: h('div', { class: 'verstecke-tisch' }, blatt),
        bedienung: [stechTeil],
        mehrStichworte: 'Sichtbarkeit der Punkte',
        mehrTeile: [h('label', { class: 'verstecke-feldtitel' }, 'Sichtbarkeit der Punkte'), h('div', { class: 'verstecke-regler' }, sicht, sichtText)],
        richtungTexte: { ver: 'Punkte stechen', ent: 'Punkte finden' },
        beiRichtung: () => {
          z.gefunden = [];
          zeige();
          R.erklaerung.sage(z.richtung === 'ver' ? 'Punkte stechen' : 'Punkte finden', z.richtung === 'ver' ? 'Stempel deine Nachricht. Unter passende Buchstaben der Zeitung kommt ein winziger Punkt.' : 'Fahr mit der Lupe über die Zeitung und tippe die Buchstaben mit Punkt der Reihe nach an.');
        },
        beiSperre: (an) => {
          stempel.setze(!an);
          sicht.disabled = an;
        },
        baenderVer: ['Nachricht', 'Gestochene Buchstaben', [false, false]],
        baenderEnt: ['Gefundene Buchstaben', 'Nachricht', [false, false]],
        schritteVer: ['Buchstaben stempeln', 'Punkt wird gestochen', 'Zeitung weitergeben'],
        schritteEnt: ['Lupe bewegen', 'Buchstaben mit Punkt antippen', 'Nachricht ablesen'],
        beiAenderung: (n) => {
          if (n !== undefined && z.richtung === 'ver') z.nachricht = z.nachricht.slice(0, n);
          if (n !== undefined && z.richtung === 'ent') z.gefunden = z.gefunden.slice(0, n);
          zeige();
        }
      });
      const markiert = () => (z.richtung === 'ver' ? (z.nachricht ? Krypto.punkteSetzen(zeitung, z.nachricht).markiert : []) : vorgabe);
      // Zeitung aufbauen: Zeichen mit ihren Positionen in nurBuchstaben (Umlaute zählen doppelt: ä → AE)
      let pos = 0;
      function zeichneText(ziel, mitKnoepfen) {
        let p = 0;
        for (const c of zeitung) {
          const n = Krypto.nurBuchstaben(c).length;
          if (!n) {
            ziel.appendChild(document.createTextNode(c));
            continue;
          }
          const liste = [];
          for (let i = 0; i < n; i++) liste.push(p + i);
          p += n;
          if (mitKnoepfen) {
            const el = h('button', { type: 'button', class: 'verstecke-zeichen', 'data-pos': String(liste[0]), tabindex: '-1' }, c);
            el.addEventListener('click', () => antippen(liste, el));
            zeichen.push({ el, pos: liste });
            ziel.appendChild(el);
          } else ziel.appendChild(h('span', { class: 'verstecke-zeichen', 'data-pos': String(liste[0]) }, c));
        }
        return p;
      }
      pos = zeichneText(text, true);
      zeichneText(lupeInhalt, false);
      const lupeZeichen = [...lupeInhalt.querySelectorAll('.verstecke-zeichen')];
      function setzeLupe(x, y) {
        lx = Math.max(0, Math.min(x, 640));
        ly = Math.max(0, Math.min(y, 400));
        lupe.style.setProperty('--lupe-x', `${lx}px`);
        lupe.style.setProperty('--lupe-y', `${ly}px`);
        lupe.style.setProperty('--lupe-faktor', String(LUPE));
        // Klon in der Lupe genauso umbrechen wie den Text (nur Darstellung)
        if (text.clientWidth) {
          lupeInhalt.style.setProperty('--text-b', `${text.clientWidth}px`);
          lupeInhalt.style.setProperty('--text-x', `${text.offsetLeft}px`);
          lupeInhalt.style.setProperty('--text-y', `${text.offsetTop}px`);
        }
      }
      setzeLupe(lx, ly);
      blatt.addEventListener('pointermove', (e) => {
        if (z.richtung !== 'ent' || typeof blatt.getBoundingClientRect !== 'function') return;
        const rr = blatt.getBoundingClientRect();
        setzeLupe(e.clientX - rr.left, e.clientY - rr.top);
      });
      lupe.addEventListener('keydown', (e) => {
        const d = { ArrowRight: [24, 0], ArrowLeft: [-24, 0], ArrowDown: [0, 24], ArrowUp: [0, -24] }[e.key];
        if (!d) return;
        e.preventDefault();
        setzeLupe(lx + d[0], ly + d[1]);
      });
      function setzeSicht() {
        z.sicht = Number(sicht.value) / 100;
        blatt.style.setProperty('--punkt-deckkraft', String(z.sicht));
        sichtText.textContent = z.sicht < 0.3 ? 'kaum sichtbar' : z.sicht < 0.7 ? 'erkennbar' : 'deutlich';
      }
      sicht.addEventListener('input', setzeSicht);
      setzeSicht();
      function zeige() {
        const ver = z.richtung === 'ver';
        stechTeil.hidden = !ver;
        lupe.hidden = ver;
        blatt.classList.toggle('finden', !ver);
        blatt.classList.toggle('ruhig', ruhig);
        const m = new Set(markiert());
        const gef = new Set(z.gefunden.map((g) => g.pos));
        for (const zc of zeichen) {
          const hat = zc.pos.some((p) => m.has(p));
          zc.el.classList.toggle('punkt', hat);
          zc.el.classList.toggle('gefunden', zc.pos.some((p) => gef.has(p)));
          zc.el.tabIndex = ver ? -1 : 0;
        }
        lupeZeichen.forEach((el, i) => el.classList.toggle('punkt', zeichen[i].pos.some((p) => m.has(p))));
        stempel.markiere(null);
        const nb = Krypto.nurBuchstaben(zeitung);
        const liste = ver ? [...Krypto.nurBuchstaben(z.nachricht)].map((b, i) => [Krypto.klein(b), Krypto.klein(nb[markiert()[i]])]) : z.gefunden.map((g) => [g.b, g.b]);
        R.zeigeBaender(liste);
        R.anleitung.setze(liste.length ? 2 : ver ? 0 : 1);
        R.nk.setze(
          liste.length
            ? {
                titel: 'In Ruhe ansehen',
                start: -1,
                schritte: liste.map((e, i) => ({ text: `Buchstabe ${i + 1}: Punkt unter dem ${e[1]} (Stelle ${(ver ? markiert()[i] : z.gefunden[i].pos) + 1} der Meldung).`, daten: { n: i + 1, p: ver ? markiert()[i] : z.gefunden[i].pos } })),
                zeige(st) {
                  R.zeigeBaender(liste.slice(0, st.daten.n));
                  for (const zc of zeichen) zc.el.classList.toggle('nachspiel', zc.pos.includes(st.daten.p));
                }
              }
            : null
        );
      }
      function steche(b) {
        if (gesperrt || z.richtung !== 'ver') return;
        if (z.nachricht.length >= MAX) return;
        const versuch = Krypto.punkteSetzen(zeitung, z.nachricht + b);
        if (!versuch.vollstaendig) return R.erklaerung.sage('Kein Platz', `Hinter dem letzten Punkt steht in der Meldung kein ${b} mehr. Nimm einen anderen Buchstaben oder beginne neu.`);
        z.nachricht += b;
        zeige();
        const p = versuch.markiert[versuch.markiert.length - 1];
        const ziel = zeichen.find((zc) => zc.pos.includes(p));
        if (ziel && !ruhig) {
          ziel.el.classList.remove('gestochen');
          void ziel.el.offsetWidth;
          ziel.el.classList.add('gestochen');
        }
        R.erklaerung.sage(`Punkt ${z.nachricht.length}`, `Unter das ${Krypto.nurBuchstaben(zeitung)[p]} an Stelle ${p + 1} kommt ein winziger Punkt.`);
      }
      function antippen(liste, el) {
        if (gesperrt || z.richtung !== 'ent') return;
        const m = vorgabe.filter((p) => liste.includes(p));
        if (!m.length) return R.erklaerung.sage('Kein Punkt', 'Unter diesem Buchstaben ist kein Punkt. Schau mit der Lupe genauer hin.');
        if (z.gefunden.some((g) => g.pos === m[0])) return R.erklaerung.sage('Schon gefunden', 'Diesen Buchstaben hast du schon.');
        const b = Krypto.klein(Krypto.punktmethode(zeitung, [m[0]]));
        z.gefunden.push({ pos: m[0], b });
        z.gefunden.sort((a, c) => a.pos - c.pos);
        zeige();
        S.flug(el, R.baender.letztes(0), b);
        if (z.gefunden.length === vorgabe.length) {
          R.erklaerung.sage('Alle Punkte gefunden', `Die Nachricht lautet: ${Krypto.klein(Krypto.punktmethode(zeitung, vorgabe))}.`);
          S.funken(blatt);
        } else R.erklaerung.sage('Punkt gefunden', `${b} – noch ${vorgabe.length - z.gefunden.length} Punkte versteckt.`);
      }
      R.start();
      zeige();
      R.erklaerung.sage(z.richtung === 'ver' ? 'Punkte stechen' : 'Punkte finden', z.richtung === 'ver' ? 'Stempel deine Nachricht. Unter passende Buchstaben der Zeitung kommt ein winziger Punkt.' : 'Fahr mit der Lupe über die Zeitung (oder Pfeiltasten) und tippe die Buchstaben mit Punkt an.');
      return {
        schliesse: () => R.nk.schliesse(),
        zustand() {
          const ver = z.richtung === 'ver';
          const m = ver ? markiert() : z.gefunden.map((g) => g.pos);
          return {
            zeitung,
            markiert: m,
            buchstaben: pos,
            eingabe: ver ? Krypto.klein(z.nachricht) : z.gefunden.map((g) => g.b).join(''),
            ausgabe: ver ? (m.length ? Krypto.klein(Krypto.punktmethode(zeitung, m)) : '') : z.gefunden.map((g) => g.b).join('')
          };
        }
      };
    }

    function baue(id) {
      schliesseTeil();
      AQ.clear(r.flaeche);
      teil = id === 'punkte' ? bauePunkte() : baueNullchiffre();
    }
    baue(r.aktiv());

    return {
      schliesse() {
        schliesseTeil();
      },
      zustand() {
        const id = r.aktiv();
        return { reiter: id, richtung: (stand[id] || stand.nullchiffre).richtung, ...(teil ? teil.zustand() : {}), gesperrt };
      }
    };
  }

  KRLabor.registriere('verstecke', { titel: 'Versteckte Botschaften', oeffne });
})();
