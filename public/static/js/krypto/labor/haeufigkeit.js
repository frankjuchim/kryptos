/* Kryptos – Labor-Werkzeug „Häufigkeits-Analysator“ (W1 §9.1, Plan M6 Task 114). Der Text ist das Objekt: zählen
   (Histogramm mit Referenz Deutsch, auch Rang neben Rang), Bigramme/Trigramme antippen → alle Stellen im Text markiert,
   Teiltexte „jede k-te Stelle“ (ab Welt 2), Koinzidenzindex (ab Welt 2, eA). Das Zählen lässt sich nachspielen.
   Keine Zuordnung, keine Entschlüsselung. Rechnet nur über Krypto.*; speichert nichts. */
'use strict';
(() => {
  const { h } = AQ;
  const B = KRLaborBau;
  const BEISPIEL = { text: 'Quallen tanzen nachts um Bojen, ein Krake zupft an Tauen, Muscheln schweigen, und Moewen kreischen laut am Kai der Mole' };
  const REITER_TITEL = { histogramm: 'Histogramm', bigramme: 'Bigramme & Trigramme', teiltexte: 'Teiltexte', kennzahlen: 'Kennzahlen' };
  const MAX = 3000;

  /** Dezimalzahl mit Komma (Anzeige). */
  const komma = (x, stellen) => x.toFixed(stellen).replace('.', ',');

  function oeffne(container, voreinstellung, umgebung) {
    const v = voreinstellung || {};
    const reiterListe = KRLabor.reiterFuer('haeufigkeit', v, umgebung);
    let text = typeof v.text === 'string' ? v.text.slice(0, MAX) : BEISPIEL.text;
    let sortierung = v.ansicht === 'absteigend' ? 'absteigend' : 'alphabetisch';
    let einheit = 'absolut';
    let k = Number.isInteger(v.teiltexte) && v.teiltexte >= 1 && v.teiltexte <= 12 ? v.teiltexte : 2;
    let s = 1;
    let markiert = null; // gewähltes N-Gramm (GROSS)
    let nachspiel = null;

    const feld = B.textfeld({
      beschriftung: 'Text (bis 3 000 Zeichen, Geheimtext oder Klartext)',
      max: MAX,
      wert: text,
      art: 'geheimtext',
      zeilen: 4,
      beiEingabe: (t) => {
        text = t;
        markiert = null;
        baue(r.aktiv());
      }
    });
    const r = B.reiter(reiterListe.map((id) => ({ id, titel: REITER_TITEL[id] })), { aktiv: reiterListe[0], beiWechsel: baue });
    const grenze = h('p', { class: 'haeufigkeit-grenze text-2' }, 'Dieses Werkzeug zählt nur – es ordnet nicht zu und entschlüsselt nicht. Zum Zuordnen: Substitutions-Werkbank.');
    const wurzel = h('div', { class: 'labor-werkzeug haeufigkeit-werkzeug' }, feld.element, r.element, grenze);
    container.appendChild(wurzel);

    const buchstaben = () => Krypto.nurBuchstaben(text);
    // M11 (E208, E210, E214): Erkenner-Verlauf, Start im geführten Modus (Panel), laufender geführter Modus
    const erkVerlauf = typeof KRErkenner !== 'undefined' ? KRErkenner.verlauf() : null;
    let fuehrung = umgebung && umgebung.gefuehrt && typeof umgebung.gefuehrt === 'object' ? umgebung.gefuehrt : null;
    let gefuehrt = null;
    const mitGefuehrt = typeof KRGefuehrt !== 'undefined';

    function schliesseTeile() {
      if (nachspiel) nachspiel.schliesse();
      nachspiel = null;
      if (gefuehrt) gefuehrt.schliesse();
      gefuehrt = null;
      feld.sperre(false);
    }
    /** Aufgabenwerte erkannt? → geführter Modus; true = nichts ausgeben */
    function erkenne(id, eingaben) {
      return B.erkenne(r.flaeche, `haeufigkeit.${id}`, eingaben, umgebung, erkVerlauf, { gefuehrt: mitGefuehrt && HOOKS[id] ? () => starteGefuehrt(id, { text, k }) : null }) !== 'frei';
    }

    /* ---------- Geführter Modus (M11 Task 244, E208): Positionsleiste bzw. selbst zählen ---------- */
    const ALPHA = [...Krypto.ALPHABET];
    function teiltexteHook(container, werte) {
      const t = Krypto.nurBuchstaben(String(werte.text || '')).slice(0, 600);
      const kk = Number.isInteger(werte.k) && werte.k >= 1 ? werte.k : 1;
      const leiste = KRGefuehrt.leiste(container, t, { titel: `Text (Positionen ab 0), jede ${kk}. Stelle` });
      const baender = Array.from({ length: kk }, (_, j) => KRGefuehrt.band(container, `Teiltext ${j + 1}`));
      const positionen = [];
      for (let j = 0; j < kk; j++) for (let p = j; p < t.length; p += kk) positionen.push({ j, p });
      return {
        schritte: positionen.map(({ j, p }) => ({ text: `Teiltext ${j + 1}: Buchstabe an Position ${p}`, feld: { beschriftung: 'Buchstabe', art: 'buchstabe' } })),
        markiere(i, e) {
          leiste.markiere([positionen[i].p]);
          baender.forEach((bd, j) => bd.setze(positionen.map((x, n) => (x.j === j ? e[n] : null)).filter((x) => x !== null)));
        },
        korrekt: () => positionen.map(({ p }) => t[p])
      };
    }
    function kennzahlenHook(container, werte) {
      const t = Krypto.nurBuchstaben(String(werte.text || '')).slice(0, 600);
      KRGefuehrt.leiste(container, t, { titel: `Text (n = ${t.length} Buchstaben, Positionen ab 0)` });
      const tab = KRGefuehrt.raster(container, { zeilen: 1, spalten: 26, caption: 'Zähle jeden Buchstaben selbst', zeilenKopf: () => 'nᵢ', spaltenKopf: (x) => ALPHA[x] });
      const schritte = ALPHA.map((b) => ({ text: `Wie oft kommt ${b} vor?`, feld: { beschriftung: `Anzahl n(${b})`, art: 'zahl' } }));
      schritte.push({ text: 'Zähler: Σ nᵢ(nᵢ − 1) aus deinen Anzahlen', feld: { beschriftung: 'Σ nᵢ(nᵢ − 1)', art: 'zahl' } });
      schritte.push({ text: `Nenner: n(n − 1) mit n = ${t.length}`, feld: { beschriftung: 'n(n − 1)', art: 'zahl' } });
      schritte.push({ text: 'I = Zähler : Nenner (3 Nachkommastellen, mit Komma)', feld: { beschriftung: 'I', art: 'zahl' } });
      return {
        schritte,
        markiere(i, e) {
          tab.leeren();
          e.slice(0, 26).forEach((x, j) => x && tab.eintrag(0, j, x));
          tab.kopfMarke([], i < 26 ? [i] : []);
        },
        korrekt() {
          const hf = Krypto.haeufigkeiten(t);
          const br = Krypto.koinzidenzindexBruch(t);
          return [...ALPHA.map((b) => String(hf[b] || 0)), String(br ? br.zaehler : 0), String(br ? br.nenner : 0), komma(Krypto.koinzidenzindex(t) || 0, 3)];
        }
      };
    }
    const HOOKS = { teiltexte: teiltexteHook, kennzahlen: kennzahlenHook };
    function starteGefuehrt(id, werte) {
      schliesseTeile();
      AQ.clear(r.flaeche);
      zuletzt = id;
      gefuehrt = KRGefuehrt.starte(r.flaeche, HOOKS[id], {
        werte,
        umgebung,
        aufgabe: fuehrung && fuehrung.aufgabe ? fuehrung.aufgabe : (umgebung && typeof umgebung.aufgabe === 'string' && umgebung.aufgabe) || null,
        titel: 'Häufigkeits-Analysator',
        beiEigeneWerte: () => {
          if (erkVerlauf) erkVerlauf.leeren();
          fuehrung = null;
          text = '';
          feld.setze('');
          baue(id);
        }
      });
    }

    /** Histogramm-Block (KRB) für einen Text mit den aktuellen Ansichts-Einstellungen. */
    function histogramm(quelle, titel) {
      return KRB.haeufigkeit({
        t: 'haeufigkeit',
        quelle: 'text',
        text: quelle,
        referenz: 'deutsch',
        sortierung,
        einheit: einheit === 'relativ' ? 'prozent' : 'absolut',
        referenzRang: true,
        einheitUmschalter: true,
        titel,
        beiAnsicht(a) {
          sortierung = a.sortierung;
          einheit = a.einheit;
        }
      });
    }

    /* ---------- Histogramm ---------- */
    function baueHistogramm() {
      const t = buchstaben();
      const n = t.length;
      if (n === 0) r.flaeche.append(B.hinweis('info', 'Gib oben einen Text ein – dann wird gezählt.'));
      else if (n < 100) r.flaeche.append(B.hinweis('warnung', 'Kurzer Text – die Ränge weichen stark ab (P6).'));
      const ort = h('div', { class: 'haeufigkeit-histo' });
      const zeichne = (quelle, titel) => AQ.mount(ort, histogramm(quelle, titel));
      zeichne(t, 'Häufigkeiten im Text');
      r.flaeche.append(ort, h('p', { class: 'haeufigkeit-quelle text-2' }, 'Referenz Deutsch nach Beutelspacher (Kryptologie).'));
      if (!n) return;
      // Fundstellen je Buchstabe (Krypto.ngramme mit n = 1): der i-te Buchstabe ist das (Rang in seinen Stellen + 1)-te Vorkommen
      const stellen = new Map(Krypto.ngramme(t, { n: 1, top: 26 }).map((e) => [e.folge, e.positionen]));
      const nsOrt = h('div', { class: 'haeufigkeit-nachspiel' });
      r.flaeche.append(nsOrt);
      nachspiel = KRLabor.nachspiel(nsOrt, {
        titel: 'Zählen – Buchstabe für Buchstabe',
        start: -1,
        schritte: [...t].map((c, i) => ({ text: `Buchstabe ${i + 1}: ${c} – ${c} jetzt ${stellen.get(c).indexOf(i) + 1}-mal`, daten: { i } })),
        zeige(_s, i) {
          zeichne(t.slice(0, i + 1), i === n - 1 ? 'Häufigkeiten im Text' : `Häufigkeiten der ersten ${i + 1} Buchstaben`);
        },
        beiLauf: (an) => feld.sperre(an)
      });
    }

    /* ---------- Bigramme und Trigramme ---------- */
    function baueNgramme() {
      const t = buchstaben();
      if (t.length < 2) {
        r.flaeche.append(B.hinweis('info', 'Für Bigramme braucht der Text mindestens zwei Buchstaben.'));
        return;
      }
      const listen = [
        { n: 2, top: 15, titel: 'Bigramme (Top 15)' },
        { n: 3, top: 10, titel: 'Trigramme (Top 10)' }
      ].map((x) => ({ ...x, eintraege: t.length >= x.n ? Krypto.ngramme(t, { n: x.n, top: x.top }) : [] }));
      const textOrt = h('div', { class: 'haeufigkeit-text' });
      const status = h('p', { class: 'haeufigkeit-status', role: 'status', 'aria-live': 'polite' });
      const knoepfe = [];
      function zeigeText() {
        const treffer = markiert ? listen.flatMap((l) => l.eintraege).find((e) => e.folge === markiert) : null;
        const marken = treffer ? treffer.positionen.map((p) => ({ von: p, laenge: treffer.folge.length, art: 'a' })) : [];
        AQ.mount(textOrt, KRB.geheimtext(t, { gruppe: 0, kopieren: false, markiert: marken }));
        status.textContent = treffer ? `${treffer.folge} kommt ${treffer.anzahl}-mal vor – Positionen ${treffer.positionen.join(', ')} (ab 0).` : 'Tippe ein Bigramm oder Trigramm an – dann werden alle Stellen im Text markiert.';
        for (const b of knoepfe) b.setAttribute('aria-pressed', String(b.dataset.folge === markiert));
      }
      const spalten = listen.map((l) =>
        h(
          'div',
          { class: 'ngramme-spalte' },
          h('h3', { class: 'ngramme-titel' }, l.titel),
          l.eintraege.length
            ? h(
                'ol',
                { class: `ngramme ngramme-${l.n}` },
                l.eintraege.map((e) => {
                  const b = h('button', { type: 'button', class: 'knopf knopf-leise ngramm', 'data-folge': e.folge, 'aria-pressed': 'false', 'aria-label': `${e.folge}: ${e.anzahl}-mal, alle Stellen markieren` }, `${e.folge} · ${e.anzahl}`);
                  b.addEventListener('click', () => {
                    markiert = markiert === e.folge ? null : e.folge;
                    zeigeText();
                  });
                  knoepfe.push(b);
                  return h('li', null, b);
                })
              )
            : h('p', { class: 'text-2' }, 'Text zu kurz.')
        )
      );
      r.flaeche.append(h('div', { class: 'ngramme-listen' }, spalten), status, textOrt);
      zeigeText();
    }

    /* ---------- Teiltexte (ab Welt 2) ---------- */
    function baueTeiltexte() {
      const ort = h('div', { class: 'teiltext' });
      const zk = B.zahl({ beschriftung: 'jede k-te Stelle', min: 1, max: 12, wert: k, format: (x) => `k = ${x}`, beiWechsel: (x) => { k = x; zs.grenzen(1, k); s = zs.wert(); zeige(); } });
      const zs = B.zahl({ beschriftung: 'Start s', min: 1, max: k, wert: s, format: (x) => `s = ${x}`, beiWechsel: (x) => { s = x; zeige(); } });
      s = zs.wert();
      function zeige() {
        if (erkenne('teiltexte', { texte: [text], schluessel: [`k=${k}`] })) return;
        const t = buchstaben();
        const teil = t.length ? Krypto.teiltexte(t, k)[s - 1] : '';
        AQ.mount(
          ort,
          h('p', { class: 'teiltext-info' }, `Teiltext ${s} von ${k}: Positionen ${s - 1}, ${s - 1 + k}, ${s - 1 + 2 * k}, … (ab 0) · ${teil.length} Buchstaben`),
          h('p', { class: 'geheimtext teiltext-zeile' }, teil ? Krypto.gruppieren(teil) : '–'),
          histogramm(teil, `Häufigkeiten im Teiltext ${s}`)
        );
      }
      r.flaeche.append(h('div', { class: 'labor-steuer' }, zk.element, zs.element), ort);
      zeige();
    }

    /* ---------- Kennzahlen (ab Welt 2, eA) ---------- */
    function baueKennzahlen() {
      if (erkenne('kennzahlen', { texte: [text] })) return;
      const bruch = Krypto.koinzidenzindexBruch(text);
      if (!bruch) {
        r.flaeche.append(B.hinweis('info', 'Für den Koinzidenzindex braucht der Text mindestens zwei Buchstaben.'));
        return;
      }
      const I = Krypto.koinzidenzindex(text);
      r.flaeche.append(
        h(
          'div',
          { class: 'kennzahlen' },
          h('p', { class: 'kennzahl-bruch' }, `I = Σ nᵢ(nᵢ − 1) / (n(n − 1)) = ${bruch.zaehler} / ${bruch.nenner}`),
          h('p', { class: 'kennzahl-wert' }, `I ≈ ${komma(I, 4)}`),
          h('p', { class: 'kennzahl-referenz text-2' }, 'Zum Vergleich: deutscher Text I_D = 0,076 · zufällige Buchstaben I_Z = 0,038.')
        )
      );
    }

    let zuletzt = null;
    function baue(id) {
      if (fuehrung && mitGefuehrt && HOOKS[id]) {
        const w = { text, k, ...(fuehrung.werte || {}) };
        fuehrung = { aufgabe: fuehrung.aufgabe };
        starteGefuehrt(id, w);
        return;
      }
      schliesseTeile();
      AQ.clear(r.flaeche);
      zuletzt = id;
      if (id === 'histogramm') baueHistogramm();
      else if (id === 'bigramme') baueNgramme();
      else if (id === 'teiltexte') baueTeiltexte();
      else if (id === 'kennzahlen') baueKennzahlen();
    }
    baue(r.aktiv());

    return {
      schliesse() {
        schliesseTeile();
      },
      zustand() {
        return { reiter: zuletzt, n: buchstaben().length, sortierung, einheit, markiert, k, s };
      }
    };
  }

  KRLabor.registriere('haeufigkeit', { titel: 'Häufigkeits-Analysator', oeffne });
})();
