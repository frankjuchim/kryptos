/* Kryptos – Labor-Werkzeug „Angreifer-Labor“ (Plan M10 Task 234, E180, E188, E189).
   Herkunft: Krypto-Werkstatt (Ideen von A. Bodendiek), stationen/analyse.html @59004d9 – docs/FREMDCODE.md
   Häufigkeitsvergleich (erst vorhersagen, dann ansehen; Histogramm verdeckt bis „Ansehen“, Deutsch-Referenz, Kasten
   „Verfahren · Art · Schlüssel“ und „Merke“), Schlüsselraum (ab Welt 2: logarithmische Balken, Rechenleistung, Dauer aus
   Krypto.suchdauer, Pointe „groß ist nicht sicher“), Vorhersage-Trainer (Aufgaben aus BEISPIEL mit umgebung.zufall,
   Lösungsweg nach dem Prüfen, Serie nur im offenen Werkzeug – E189) und Angreifer-Blick (abgefangener Geheimtext,
   Urteil in vier Gruppen, Auflösung). Playfair/Vigenère ab Welt 2, Enigma ab Welt 3 (E180). Rechnet nur über Krypto.*;
   Histogramme über KRB.haeufigkeit. Speichert nichts. */
'use strict';
(() => {
  const { h } = AQ;
  const B = KRLaborBau;
  const S = KRStation;
  // eigene Texte und Schlüssel (Regeltest: in keinem Seed/Material/Video)
  const BEISPIEL = {
    texte: [
      'Am Hafenkai hieven Hafenarbeiter bauchige Holzfaesser voller Orangen, Zitronen und Bananen. Abends brennt die Laterne am Molenkopf, und die Fischkutter laufen nacheinander mit vollen Netzen ein.',
      'Im Obstgarten brummen Bienen um Kirschbaeume und Apfelbaeume. Ein Specht klopft am Stamm, waehrend Spatzen um Brotkrumen streiten und eine Amsel auf dem Zaunpfahl singt.',
      'Die Seilbahn schwebt gemaechlich hinauf zur Berghuette. Oben gibt es Kakao mit Sahne, Pfannkuchen mit Preiselbeeren und eine weite Aussicht auf die Gipfel ringsum.'
    ],
    woerter: ['tanne', 'kamel', 'zebra', 'pinie', 'birne', 'mango', 'kakadu', 'walross'],
    zuordnung: 'QWERTZUIOPASDFGHJKLYXCVBNM',
    playfair: 'LEUCHTFEUER',
    vigenere: 'ZIMT'
  };
  const REITER_TITEL = { vergleich: 'Häufigkeitsvergleich', schluesselraum: 'Schlüsselraum', trainer: 'Vorhersage-Trainer', blick: 'Angreifer-Blick' };
  const FORM = { gleich: 'genau wie im Deutschen (E vorn)', verschoben: 'gleiche Form, aber verschoben', durcheinander: 'gleiche Höhen, aber anderen Buchstaben zugeordnet', flach: 'deutlich flacher, ohne klare Spitze' };
  const ENIGMA_BSP = { walzen: ['II', 'IV', 'V'], ukw: 'B', ringe: 'BUL', grund: 'BLA', stecker: 'AV BS CG DL FU HZ IN KM OW RX' };
  /** Verfahren im Vergleich: Rechnung über Krypto.*, Art, Schlüssel, erwartete Form, Erklärung, Regel (E180) */
  const VERFAHREN = [
    { id: 'skytale', name: 'Skytale (Umfang 5)', art: 'Transposition', schluessel: 'Umfang 5', f: (t) => Krypto.skytale(t, 5), form: 'gleich', erkl: 'Eine Transposition stellt nur um. Jeder Buchstabe bleibt erhalten – das Diagramm ist genau das des Klartexts.' },
    { id: 'pfluegen', name: 'Pflügen (6 Spalten)', art: 'Transposition', schluessel: '6 Spalten', f: (t) => Krypto.pfluegen(t, 6), form: 'gleich', erkl: 'Auch beim Pflügen bleibt jeder Buchstabe erhalten: gleiche Verteilung wie im Klartext – ein klares Zeichen für eine Transposition.' },
    { id: 'caesar', name: 'Caesar (D)', art: 'Verschiebung', schluessel: 'a wird zu D', f: (t) => Krypto.caesar(t, 3), form: 'verschoben', erkl: 'Die Form bleibt, sie wandert nur um den Schlüssel weiter. Die höchste Säule steht dort, wo das e gelandet ist.' },
    { id: 'substitution', name: 'Beliebige Zuordnung', art: 'monoalphabetisch', schluessel: 'QWERTZ …', f: (t) => Krypto.substitution(t, BEISPIEL.zuordnung), form: 'durcheinander', erkl: 'Die Säulenhöhen sind dieselben wie im Deutschen, nur anderen Buchstaben zugeordnet. Die Häufigkeitsanalyse findet e, n, r … trotzdem.' },
    { id: 'playfair', name: `Playfair (${BEISPIEL.playfair})`, art: 'bigraphisch', schluessel: `Schlüsselwort ${BEISPIEL.playfair}`, f: (t) => Krypto.playfair(t, BEISPIEL.playfair), form: 'flach', erkl: 'Weil Paare verschlüsselt werden, wird derselbe Buchstabe je nach Partner verschieden verschlüsselt. Die Spitzen verwischen.', regel: 'analyse.verfahren.playfair' },
    { id: 'vigenere', name: `Vigenère (${BEISPIEL.vigenere})`, art: 'polyalphabetisch', schluessel: `Schlüsselwort ${BEISPIEL.vigenere}`, f: (t) => Krypto.vigenere(t, BEISPIEL.vigenere), form: 'flach', erkl: 'Mehrere Alphabete im Wechsel glätten die Verteilung. Erst mit der Schlüssellänge zerfällt der Text wieder in Caesar-Teile.', regel: 'analyse.verfahren.vigenere' },
    { id: 'enigma', name: 'Enigma (10 Kabel)', art: 'polyalphabetisch (Maschine)', schluessel: 'II – IV – V, BUL, BLA', f: (t) => Krypto.enigma(t, ENIGMA_BSP), form: 'flach', erkl: 'Nach jedem Buchstaben dreht sich eine Walze – fast jeder Buchstabe bekommt ein eigenes Alphabet. Die Verteilung ist nahezu flach.', regel: 'analyse.verfahren.enigma' }
  ];
  const GRUPPEN = [
    ['trans', 'Transposition', 'Verteilung wie im Deutschen'],
    ['caesar', 'Verschiebung', 'Form verschoben'],
    ['mono', 'Beliebige Zuordnung', 'gleiche Höhen, andere Buchstaben'],
    ['flach', 'Paare oder mehrere Alphabete', 'deutlich flacher']
  ];
  const GRUPPE_VON = { gleich: 'trans', verschoben: 'caesar', durcheinander: 'mono', flach: 'flach' };
  const LEISTUNG = [[6, 'Schulrechner (10⁶ /s)'], [9, 'PC (10⁹ /s)'], [15, 'Rechenzentrum (10¹⁵ /s)']];

  function oeffne(container, voreinstellung, umgebung) {
    const v = voreinstellung || {};
    const u = umgebung || {};
    const reiterListe = KRLabor.reiterFuer('analyse', v, umgebung);
    const zufall = typeof u.zufall === 'function' ? u.zufall : Math.random;
    const wahl = (liste) => liste[Math.min(liste.length - 1, Math.floor(zufall() * liste.length))];
    const verfahren = VERFAHREN.filter((x) => !x.regel || KRLabor.erlaubt(x.regel, umgebung));
    const z = { verfahren: 'skytale', text: 0, eigen: '', vorhersage: null, gezeigt: false, leistung: 9, laenge: 30, serie: 0, beste: 0, aufgabe: null, status: null, fall: null, urteil: null };
    let teil = null;

    const r = B.reiter(reiterListe.map((id) => ({ id, titel: REITER_TITEL[id] })), { aktiv: reiterListe[0], beiWechsel: baue });
    const wurzel = h('div', { class: 'labor-werkzeug analyse-werkzeug' }, h('p', { class: 'analyse-einleitung text-2' }, 'Hier untersuchst du Verfahren wie ein Angreifer: Was verrät die Häufigkeit der Buchstaben? Wie viele Schlüssel gibt es? Und kannst du vorhersagen, was ein Verfahren tut, bevor das Werkzeug es zeigt?'), r.element);
    container.appendChild(wurzel);
    KRStation.herkunft(wurzel);

    const SO_GEHTS = ['Erst vorhersagen, dann ansehen: Wie sieht das Häufigkeitsdiagramm des Geheimtexts aus?', 'Transpositionen behalten die Verteilung, Verschiebungen verschieben sie, Zuordnungen vertauschen die Säulen.', 'Paare und mehrere Alphabete machen das Diagramm flach – dann braucht der Angreifer andere Werkzeuge.'];
    const deutschHistogramm = () => KRB.haeufigkeit({ quelle: 'werte', werte: Krypto.DEUTSCH, titel: 'Deutsch (Erwartung)', einheit: 'prozent' });
    const klartext = () => Krypto.nurBuchstaben(z.eigen || BEISPIEL.texte[z.text]);

    /* ---------- Häufigkeitsvergleich ---------- */
    function baueVergleich() {
      const chips = h('div', { class: 'analyse-verfahren', role: 'group', 'aria-label': 'Verfahren' }, verfahren.map((x) => h('button', { type: 'button', class: 'knopf knopf-leise', 'data-verfahren': x.id, 'aria-pressed': 'false' }, x.name)));
      const frage = h('p', { class: 'analyse-frage-titel' });
      const vorhersage = h('div', { class: 'analyse-vorhersage', role: 'group', 'aria-label': 'Deine Vorhersage' }, Object.entries(FORM).map(([k, t]) => h('button', { type: 'button', 'data-form': k, 'aria-pressed': 'false' }, t)));
      const ansehen = h('button', { type: 'button', class: 'knopf knopf-zweit analyse-ansehen' }, 'Ansehen');
      const rueck = h('p', { class: 'analyse-rueckmeldung', 'aria-live': 'polite' });
      const geheimOrt = h('div', { class: 'analyse-geheim-histogramm verdeckt' });
      const geheimText = h('p', { class: 'analyse-geheimtext' });
      const textChips = h('div', { class: 'analyse-texte', role: 'group', 'aria-label': 'Klartext' }, BEISPIEL.texte.map((_, i) => h('button', { type: 'button', class: 'knopf knopf-leise', 'data-text': String(i), 'aria-pressed': 'false' }, `Text ${i + 1}`)));
      const eigen = B.textfeld({ beschriftung: 'Oder eigener Text (mindestens 80 Buchstaben für ein aussagekräftiges Diagramm)', max: 600, art: 'klartext', beiEingabe: (t) => { z.eigen = t; zuruecksetzen(); } });
      const textInfo = h('p', { class: 'analyse-textinfo text-2' });
      const kasten = h('dl', { class: 'station-kv analyse-kasten' });
      const merke = h('p', { class: 'analyse-merke' }, 'Transpositionen verraten sich, weil die Verteilung gleich bleibt. Monoalphabetische Verfahren verraten sich, weil die Form gleich bleibt. Erst Paare und mehrere Alphabete verwischen die Spuren.');
      r.flaeche.append(
        h(
          'div',
          { class: 'analyse-objekt' },
          h('div', { class: 'analyse-buehne' }, chips, h('div', { class: 'analyse-vorhersage-kasten' }, frage, vorhersage, h('div', { class: 'knopf-reihe' }, ansehen), rueck), h('div', { class: 'analyse-histogramme' }, h('div', { class: 'analyse-histo' }, deutschHistogramm()), geheimOrt), h('p', { class: 'analyse-feldtitel' }, 'Geheimtext'), geheimText),
          h('div', { class: 'analyse-bedienung' }, h('p', { class: 'analyse-feldtitel' }, 'Klartext'), textChips, h('div', { class: 'analyse-eigen' }, eigen.element), textInfo, h('p', { class: 'analyse-feldtitel' }, 'Verfahren'), kasten, h('p', { class: 'analyse-feldtitel' }, 'Merke'), merke)
        ),
        S.soGehts(null, SO_GEHTS),
        S.hintergrund(null, hintergrund())
      );
      const aktuell = () => verfahren.find((x) => x.id === z.verfahren) || verfahren[0];
      function zuruecksetzen() {
        z.vorhersage = null;
        z.gezeigt = false;
        zeige();
      }
      function zeige() {
        const x = aktuell();
        const kt = klartext();
        const gt = kt ? x.f(kt) : '';
        z.geheimtext = gt;
        for (const k of chips.querySelectorAll('button')) k.setAttribute('aria-pressed', String(k.dataset.verfahren === x.id));
        for (const k of textChips.querySelectorAll('button')) k.setAttribute('aria-pressed', String(!z.eigen && Number(k.dataset.text) === z.text));
        for (const k of vorhersage.querySelectorAll('button')) {
          k.setAttribute('aria-pressed', String(k.dataset.form === z.vorhersage));
          k.classList.toggle('richtig', z.gezeigt && k.dataset.form === x.form);
          k.disabled = z.gezeigt;
        }
        frage.textContent = `Deine Vorhersage für „${x.name}“: Das Diagramm ist …`;
        ansehen.disabled = !z.vorhersage || z.gezeigt || !gt;
        AQ.clear(geheimOrt);
        geheimOrt.classList.toggle('verdeckt', !z.gezeigt);
        if (gt) {
          const diagramm = KRB.haeufigkeit({ quelle: 'text', text: gt, titel: 'Geheimtext', einheit: 'prozent' });
          // verdeckt: weder lesbar noch per Tastatur oder Vorleser erreichbar (nur der Hinweis darunter)
          if (!z.gezeigt) {
            diagramm.setAttribute('aria-hidden', 'true');
            diagramm.inert = true;
          }
          geheimOrt.appendChild(diagramm);
        }
        if (!z.gezeigt) geheimOrt.appendChild(h('p', { class: 'analyse-verdeckt-text' }, 'noch verdeckt – erst vorhersagen'));
        geheimText.textContent = gt ? Krypto.gruppieren(gt) : '–';
        textInfo.textContent = `Untersucht: ${kt.length} Buchstaben${kt.length < 80 ? ' – unter 80 Buchstaben ist das Diagramm wenig aussagekräftig.' : ''}`;
        AQ.clear(kasten);
        kasten.append(h('dt', null, 'Art'), h('dd', null, x.art), h('dt', null, 'Schlüssel'), h('dd', null, x.schluessel));
        if (!z.gezeigt) rueck.textContent = '';
      }
      for (const k of chips.querySelectorAll('button')) k.addEventListener('click', () => { z.verfahren = k.dataset.verfahren; zuruecksetzen(); });
      for (const k of textChips.querySelectorAll('button')) k.addEventListener('click', () => { z.text = Number(k.dataset.text); z.eigen = ''; eigen.setze(''); zuruecksetzen(); });
      for (const k of vorhersage.querySelectorAll('button')) k.addEventListener('click', () => { if (z.gezeigt) return; z.vorhersage = k.dataset.form; zeige(); });
      ansehen.addEventListener('click', () => {
        if (!z.vorhersage || z.gezeigt) return;
        z.gezeigt = true;
        zeige();
        const x = aktuell();
        const ok = z.vorhersage === x.form;
        rueck.textContent = `${ok ? 'Richtig vorhergesagt!' : `Nicht ganz – das Diagramm ist ${FORM[x.form]}.`} ${x.erkl}`;
        rueck.classList.toggle('analyse-stimmt', ok);
        if (ok) S.funken(rueck);
      });
      if (!verfahren.some((x) => x.id === z.verfahren)) z.verfahren = verfahren[0].id;
      zeige();
      return { schliesse() {}, zustand: () => ({ verfahren: z.verfahren, klartext: klartext(), geheimtext: z.geheimtext, vorhersage: z.vorhersage, gezeigt: z.gezeigt }) };
    }

    /* ---------- Schlüsselraum (ab Welt 2) ---------- */
    function baueSchluesselraum() {
      const leistung = h('div', { class: 'analyse-leistung labor-basis', role: 'radiogroup', 'aria-label': 'Rechenleistung des Angreifers' }, LEISTUNG.map(([e, t]) => h('button', { type: 'button', role: 'radio', 'data-leistung': String(e) }, t)));
      const laenge = h('input', { type: 'range', class: 'analyse-laenge', min: '12', max: '60', step: '1', 'aria-label': 'Bandlänge (Skytale, Pflügen)' });
      laenge.value = String(z.laenge);
      const laengeText = h('span', { class: 'text-2' });
      const liste = h('div', { class: 'analyse-raum' });
      const pointe = h('p', { class: 'analyse-pointe' }, 'Groß ist nicht sicher: Die beliebige Zuordnung hat 26! ≈ 4 · 10²⁶ Schlüssel – und fällt trotzdem in Minuten durch die Häufigkeitsanalyse. Ein riesiger Schlüsselraum schützt nur, wenn es keinen besseren Angriff gibt.');
      r.flaeche.append(
        h('div', { class: 'analyse-objekt' }, h('div', { class: 'analyse-buehne' }, h('p', { class: 'text-2' }, 'Wie lange bräuchte ein Angreifer, um alle Schlüssel durchzuprobieren? Die Balken sind logarithmisch: Jeder Strich mehr bedeutet zehnmal so viele Schlüssel.'), liste, pointe), h('div', { class: 'analyse-bedienung' }, h('p', { class: 'analyse-feldtitel' }, 'Rechenleistung des Angreifers'), leistung, h('p', { class: 'analyse-feldtitel' }, 'Bandlänge (Skytale, Pflügen)'), laenge, laengeText)),
        S.soGehts(null, ['Jedes Verfahren hat eine Anzahl möglicher Schlüssel.', 'Die Dauer ergibt sich aus Anzahl geteilt durch Versuche pro Sekunde.', 'Entscheidend ist aber, ob es einen schnelleren Angriff gibt als das Durchprobieren.']),
        S.hintergrund(null, hintergrund())
      );
      function eintraege() {
        const n = z.laenge;
        const liste2 = [
          ['skytale', `Skytale (Band mit ${n} Buchstaben)`, Krypto.schluesselraum('skytale', { n }), 'Alle Umfänge ausprobieren'],
          ['pfluegen', `Pflügen (${n} Buchstaben)`, Krypto.schluesselraum('pfluegen', { n }), 'Alle Zeilenlängen ausprobieren'],
          ['caesar', 'Caesar', Krypto.schluesselraum('caesar'), 'Brute Force oder Häufigkeit des e'],
          ['affin', 'Affine Chiffre', Krypto.schluesselraum('affin'), 'Brute Force'],
          ['substitution', 'Beliebige Zuordnung', Krypto.schluesselraum('substitution'), 'Häufigkeitsanalyse'],
          ['playfair', 'Playfair', Krypto.schluesselraum('playfair'), 'Paarhäufigkeiten'],
          ['vigenere', 'Vigenère (Schlüsselwort mit 6 Buchstaben)', Krypto.schluesselraum('vigenere', { laenge: 6 }), 'Kasiski-Test, dann Caesar je Spalte'],
          ['fleissner', 'Fleißner-Schablone 6 × 6', Krypto.schluesselraum('fleissner', { groesse: 6 }), 'Lesbare Bruchstücke suchen']
        ];
        if (KRLabor.erlaubt('analyse.verfahren.enigma', umgebung)) liste2.push(['enigma', 'Enigma (3 aus 5 Walzen, 10 Kabel)', Krypto.schluesselraum('enigma', { kabel: 10 }), 'Crib: kein Buchstabe wird zu sich selbst']);
        return liste2;
      }
      function zeige() {
        for (const k of leistung.querySelectorAll('button')) {
          const an = Number(k.dataset.leistung) === z.leistung;
          k.setAttribute('aria-checked', String(an));
          k.setAttribute('tabindex', an ? '0' : '-1');
        }
        laengeText.textContent = `${z.laenge} Buchstaben`;
        AQ.clear(liste);
        const daten = eintraege();
        const max = Math.max(...daten.map(([, , x]) => x.log10), 1);
        for (const [id, name, raum, angriff] of daten) {
          const dauer = Krypto.suchdauer(raum.log10, Number(`1e${z.leistung}`));
          const zeile = h(
            'div',
            { class: 'analyse-raum-zeile', 'data-verfahren': id },
            h('span', { class: 'analyse-raum-name' }, name),
            h('span', { class: 'analyse-balken', 'aria-hidden': 'true' }, h('span', { class: 'analyse-balken-fuellung' })),
            h('span', { class: 'analyse-raum-zahl' }, raum.formel.length < 24 ? `${raum.formel} = ${S.ungefaehr(raum.anzahl)}` : S.ungefaehr(raum.anzahl)),
            h('span', { class: 'analyse-raum-dauer' }, `Alles durchprobieren: ${dauer.text}`),
            h('span', { class: 'analyse-raum-angriff text-2' }, `Besserer Angriff: ${angriff}`)
          );
          zeile.style.setProperty('--balken', String(Math.max(0.02, raum.log10 / max)));
          liste.appendChild(zeile);
        }
      }
      for (const k of leistung.querySelectorAll('button')) k.addEventListener('click', () => { z.leistung = Number(k.dataset.leistung); zeige(); });
      laenge.addEventListener('input', () => { const n = Number(laenge.value); if (n >= 12 && n <= 60) z.laenge = n; zeige(); });
      zeige();
      return { schliesse() {}, zustand: () => ({ leistung: z.leistung, laenge: z.laenge }) };
    }

    /* ---------- Vorhersage-Trainer ---------- */
    const AUFGABEN = {
      caesar() {
        const b = wahl([...Krypto.ALPHABET]);
        const k = 1 + Math.floor(zufall() * 25);
        const a = Krypto.caesar(b, k);
        return { titel: 'Caesar im Kopf', frage: `Welcher Geheimtextbuchstabe entsteht aus ${Krypto.klein(b)} bei Verschiebung k = ${k} (a wird zu ${Krypto.caesar('A', k)})?`, antwort: a, weg: `${Krypto.klein(b)} hat die Nummer ${Krypto.wert(b, 1)} (A = 1). ${Krypto.wert(b, 1)} + ${k} = ${Krypto.wert(b, 1) + k}${Krypto.wert(b, 1) + k > 26 ? `, minus 26 = ${Krypto.wert(b, 1) + k - 26}` : ''} → ${a}.` };
      },
      skytale() {
        const w = wahl(BEISPIEL.woerter);
        const uu = 2 + Math.floor(zufall() * 2);
        const g = Krypto.skytale(w, uu);
        const pos = 1 + Math.floor(zufall() * Math.min(4, g.length));
        return { titel: 'Skytale vorhersagen', frage: `${w} wird mit einer Skytale vom Umfang ${uu} verschlüsselt (Füllzeichen X). Welcher Buchstabe steht im Geheimtext an Stelle ${pos}?`, antwort: g[pos - 1], weg: `Zeilenweise in ${uu} Spalten schreiben und spaltenweise lesen: ${Krypto.gruppieren(g)}. An Stelle ${pos} steht ${g[pos - 1]}.` };
      },
      polybios() {
        const b = wahl([...Krypto.ALPHABET.replace('J', '')]);
        const a = Krypto.polybios(b);
        return { titel: 'Polybios-Paar', frage: `Welches Zahlenpaar (Zeile, Spalte) hat ${Krypto.klein(b)} im Standardquadrat?`, antwort: a, weg: `${Krypto.klein(b)} steht in Zeile ${a[0]} und Spalte ${a[1]}: ${a}.` };
      },
      pfluegen() {
        const w = wahl(BEISPIEL.woerter);
        const k = 2 + Math.floor(zufall() * 2);
        const g = Krypto.pfluegen(w, k);
        return { titel: 'Pflügen vorhersagen', frage: `${w} wird in Zeilen der Länge ${k} geschrieben und gepflügt (Füllzeichen X). Mit welchem Buchstaben beginnt der Geheimtext?`, antwort: g[0], weg: `Die Reihenfolge der Bibliothek ergibt ${Krypto.gruppieren(g)} – der erste Buchstabe ist ${g[0]}.` };
      },
      art() {
        const w = wahl(BEISPIEL.woerter);
        const trans = zufall() < 0.5;
        const g = trans ? Krypto.skytale(w, 2, 'ver', { fuellzeichen: null }) : Krypto.caesar(w, 1 + Math.floor(zufall() * 24));
        return { titel: 'Transposition oder Substitution?', frage: `Klartext ${w}, Geheimtext ${g}. Wurde umgestellt (T) oder ersetzt (S)?`, antwort: trans ? 'T' : 'S', weg: trans ? 'Dieselben Buchstaben in anderer Reihenfolge: Transposition.' : 'Andere Buchstaben an denselben Plätzen: Substitution.' };
      }
    };
    function baueTrainer() {
      const frageEl = h('p', { class: 'analyse-frage' });
      const titelEl = h('p', { class: 'analyse-feldtitel' });
      const eingabe = h('input', { type: 'text', class: 'labor-eingabe', maxlength: '4', autocomplete: 'off', spellcheck: 'false', 'aria-label': 'Deine Antwort' });
      const pruefen = h('button', { type: 'button', class: 'knopf knopf-zweit analyse-pruefen' }, 'Prüfen');
      const naechste = h('button', { type: 'button', class: 'knopf knopf-leise analyse-naechste' }, 'Überspringen');
      const rueck = h('p', { class: 'analyse-rueckmeldung', 'aria-live': 'polite' });
      const weg = h('p', { class: 'analyse-weg' });
      const serie = h('p', { class: 'analyse-serie' });
      const art = h('select', { class: 'analyse-art', 'aria-label': 'Aufgabenart' }, h('option', { value: 'alle' }, 'gemischt'), Object.keys(AUFGABEN).map((k) => h('option', { value: k }, AUFGABEN[k] === AUFGABEN.art ? 'Transposition oder Substitution?' : { caesar: 'Caesar im Kopf', skytale: 'Skytale vorhersagen', polybios: 'Polybios-Paar', pfluegen: 'Pflügen vorhersagen' }[k])));
      let artWahl = 'alle';
      r.flaeche.append(
        h(
          'div',
          { class: 'analyse-objekt' },
          h('div', { class: 'analyse-buehne analyse-aufgabe' }, h('p', { class: 'analyse-feldtitel' }, 'Vorhersagen statt durchklicken'), titelEl, frageEl, h('div', { class: 'analyse-antwort' }, eingabe, pruefen, naechste), rueck, weg),
          h('div', { class: 'analyse-bedienung' }, serie, h('p', { class: 'analyse-feldtitel' }, 'Aufgaben'), art, h('p', { class: 'text-2' }, 'Erst im Kopf oder auf Papier lösen, dann eingeben – und anschließend im passenden Werkzeug nachprüfen. Die Serie zählt nur, solange dieses Werkzeug offen ist.'))
        ),
        S.soGehts(null, ['Lies die Aufgabe und überlege, was das Verfahren tut.', 'Gib deine Vorhersage ein und prüfe sie.', 'Danach siehst du den Lösungsweg – und kannst es im Werkzeug nachspielen.']),
        S.hintergrund(null, hintergrund())
      );
      function neu() {
        const keys = artWahl === 'alle' ? Object.keys(AUFGABEN) : [artWahl];
        z.aufgabe = AUFGABEN[wahl(keys)]();
        z.status = null;
        zeige();
      }
      function zeige() {
        const a = z.aufgabe;
        titelEl.textContent = a.titel;
        frageEl.textContent = a.frage;
        eingabe.disabled = !!z.status;
        pruefen.disabled = !!z.status;
        naechste.textContent = z.status ? 'Nächste Aufgabe ▶' : 'Überspringen';
        rueck.textContent = z.status === 'ok' ? 'Richtig!' : z.status === 'falsch' ? `Leider nicht. Richtig ist ${a.antwort}.` : '';
        rueck.classList.toggle('analyse-stimmt', z.status === 'ok');
        weg.textContent = z.status ? `So geht es: ${a.weg}` : '';
        serie.textContent = `Serie: ${z.serie} · Beste Serie: ${z.beste}`;
      }
      pruefen.addEventListener('click', () => {
        if (z.status) return;
        const roh = String(eingabe.value).trim();
        if (!roh) return;
        let antwort;
        try {
          antwort = /\d/.test(roh) ? roh.replace(/\D/g, '') : Krypto.nurBuchstaben(roh);
        } catch {
          antwort = roh;
        }
        const ok = antwort === z.aufgabe.antwort;
        z.status = ok ? 'ok' : 'falsch';
        z.serie = ok ? z.serie + 1 : 0;
        z.beste = Math.max(z.beste, z.serie);
        zeige();
        if (ok) S.funken(rueck);
      });
      eingabe.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); pruefen.click(); } });
      naechste.addEventListener('click', () => { eingabe.value = ''; neu(); });
      art.addEventListener('change', () => { artWahl = art.value; eingabe.value = ''; neu(); });
      neu();
      return { schliesse() {}, zustand: () => ({ aufgabe: { ...z.aufgabe }, status: z.status, serie: z.serie }) };
    }

    /* ---------- Angreifer-Blick ---------- */
    function baueBlick() {
      const kandidaten = verfahren.filter((x) => x.id !== 'enigma');
      const geheimEl = h('p', { class: 'analyse-geheimtext' });
      const histos = h('div', { class: 'analyse-histogramme' });
      const urteil = h('div', { class: 'analyse-urteil', role: 'group', 'aria-label': 'Dein Urteil' }, GRUPPEN.map(([k, t, s2]) => h('button', { type: 'button', 'data-gruppe': k }, h('b', null, t), h('small', null, s2))));
      const aufloesung = h('div', { class: 'analyse-aufloesung', 'aria-live': 'polite' });
      const neuKnopf = h('button', { type: 'button', class: 'knopf knopf-leise analyse-neu' }, 'Nächster Funkspruch ▶');
      r.flaeche.append(
        h(
          'div',
          { class: 'analyse-objekt' },
          h('div', { class: 'analyse-buehne analyse-blick' }, h('p', { class: 'text-2' }, 'Du hast nur einen abgefangenen Geheimtext. Kein Schlüssel, kein Hinweis. Welche Art von Verfahren steckt dahinter?'), geheimEl, histos, h('p', { class: 'analyse-feldtitel' }, 'Dein Urteil'), urteil, aufloesung, h('p', { class: 'analyse-kerckhoffs' }, 'Kerckhoffs: Eve kennt alle Verfahren – nur nicht den Schlüssel.')),
          h('div', { class: 'analyse-bedienung' }, h('p', { class: 'analyse-feldtitel' }, 'Vorgehen'), h('ol', { class: 'analyse-vorgehen' }, ['Vergleiche die beiden Diagramme: gleiche Form? Gleiche Buchstaben vorn?', 'Gleiche Buchstaben vorn → umgestellt.', 'Gleiche Form, verschoben → Caesar.', 'Gleiche Höhen, andere Buchstaben → beliebige Zuordnung.', 'Keine klare Spitze → Paare oder mehrere Alphabete.'].map((t) => h('li', null, t))), neuKnopf)
        ),
        S.soGehts(null, SO_GEHTS),
        S.hintergrund(null, hintergrund())
      );
      function neuerFall() {
        const x = wahl(kandidaten);
        const kt = Krypto.nurBuchstaben(wahl(BEISPIEL.texte));
        let f = x.f;
        let schluessel = x.schluessel;
        if (x.id === 'caesar') {
          const k = 3 + Math.floor(zufall() * 20);
          f = (t) => Krypto.caesar(t, k);
          schluessel = `a wird zu ${Krypto.caesar('A', k)}`;
        } else if (x.id === 'skytale') {
          const uu = 4 + Math.floor(zufall() * 3);
          f = (t) => Krypto.skytale(t, uu);
          schluessel = `Umfang ${uu}`;
        } else if (x.id === 'pfluegen') {
          const k = 4 + Math.floor(zufall() * 4);
          f = (t) => Krypto.pfluegen(t, k);
          schluessel = `${k} Spalten`;
        }
        z.fall = { verfahren: x.id, name: x.name.replace(/ \(.*\)$/, ''), schluessel, geheimtext: f(kt), gruppe: GRUPPE_VON[x.form], erkl: x.erkl };
        z.urteil = null;
        zeige();
      }
      function zeige() {
        const fall = z.fall;
        geheimEl.textContent = Krypto.gruppieren(fall.geheimtext);
        AQ.clear(histos);
        histos.append(h('div', { class: 'analyse-histo' }, KRB.haeufigkeit({ quelle: 'text', text: fall.geheimtext, titel: `Abgefangen (${fall.geheimtext.length} Buchstaben)`, einheit: 'prozent' })), h('div', { class: 'analyse-histo' }, deutschHistogramm()));
        for (const k of urteil.querySelectorAll('button')) {
          k.disabled = !!z.urteil;
          k.classList.toggle('richtig', !!z.urteil && k.dataset.gruppe === fall.gruppe);
          k.classList.toggle('analyse-daneben', !!z.urteil && k.dataset.gruppe === z.urteil && z.urteil !== fall.gruppe);
        }
        AQ.clear(aufloesung);
        if (z.urteil) {
          const ok = z.urteil === fall.gruppe;
          aufloesung.append(h('p', { class: ok ? 'analyse-stimmt' : null }, `${ok ? 'Richtig erkannt.' : 'Nicht ganz.'} Verschlüsselt wurde mit ${fall.name} (${fall.schluessel}).`), h('p', null, fall.erkl));
        }
      }
      for (const k of urteil.querySelectorAll('button')) {
        k.addEventListener('click', () => {
          if (z.urteil) return;
          z.urteil = k.dataset.gruppe;
          zeige();
          if (z.urteil === z.fall.gruppe) S.funken(aufloesung);
        });
      }
      neuKnopf.addEventListener('click', neuerFall);
      neuerFall();
      return { schliesse() {}, zustand: () => ({ fall: { ...z.fall }, urteil: z.urteil }) };
    }

    function hintergrund() {
      return [
        { titel: 'Häufigkeit', text: 'Im Deutschen ist e mit rund 17 % der häufigste Buchstabe, dann n, i, r, s. Diese Spur überlebt jede Umstellung und jede einfache Ersetzung.' },
        { titel: 'Vorhersagen', text: 'Wer vorher überlegt, was passieren muss, versteht das Verfahren als Regel – und merkt sofort, wenn das Ergebnis anders aussieht.' },
        { titel: 'Kerckhoffs', text: 'Ein Angreifer kennt alle Verfahren. Sicher ist ein Verfahren nur, wenn ihm auch dieses Wissen nicht weiterhilft.' }
      ];
    }

    function baue(id) {
      if (teil) teil.schliesse();
      AQ.clear(r.flaeche);
      teil = id === 'schluesselraum' ? baueSchluesselraum() : id === 'trainer' ? baueTrainer() : id === 'blick' ? baueBlick() : baueVergleich();
    }
    baue(r.aktiv());

    return {
      schliesse() {
        if (teil) teil.schliesse();
      },
      zustand() {
        return { reiter: r.aktiv(), ...(teil ? teil.zustand() : {}) };
      }
    };
  }

  KRLabor.registriere('analyse', { titel: 'Angreifer-Labor', oeffne });
})();
