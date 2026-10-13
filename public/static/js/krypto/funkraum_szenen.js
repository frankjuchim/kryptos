/* Kryptos – Szenen des Funkraums KRFunkSzenen (TECHNIK §11.2, §12.6, Plan M7 Tasks 151–154): Registry der Szenen je
   Szenario-Typ, Rollenkarten (ROLLEN_TEXTE, aus den Rollenkarten in quellen/material/W0–W5 (funkraum_W0 … W5.json), geduzt, an die
   digitale Fassung angepasst), generisches Senden-Formular mit sichtbarer Umlaut-Ersetzung (Whitelist A–Z, 0–9,
   Leerzeichen, ≤ 160 Zeichen) und Posteingang. Eine Szene baut ihr DOM einmal und bekommt bei jedem neuen Stand
   aktualisiere(stand) – Eingaben und eingebettete Werkzeuge bleiben dabei erhalten (keyed Listen).
   Szene = fabrik(ctx) → { element, aktualisiere(stand), schliesse() }; ctx siehe funkraum.js. Texte nur als Textknoten. */
'use strict';

const KRFunkSzenen = (() => {
  const { h } = AQ;
  const SZENEN = new Map();
  const MAX = 160;
  const ERSETZUNG = Object.freeze([
    ['ä', 'AE'],
    ['ö', 'OE'],
    ['ü', 'UE'],
    ['Ä', 'AE'],
    ['Ö', 'OE'],
    ['Ü', 'UE'],
    ['ß', 'SS']
  ]);

  /* ---------- Rollenkarten ---------- */

  const ROLLEN_TEXTE = Object.freeze({
    botenlauf: {
      alice: {
        titel: 'Rollenkarte · Alice-Team',
        text: 'Ihr schickt Befehle an euer Bob-Team. Verschlüsselt mit Caesar und eurem geheimen Schlüssel. Eve darf nichts verstehen.',
        schritte: [
          'Zieht mit eurem Bob-Team geheim eine Schlüsselkarte (nicht laut sagen!).',
          'Wählt einen Befehl von eurer Befehlskarte und verschlüsselt ihn (Nummerierung: A = 1 … Z = 26, Geheimtext GROSS in Fünfergruppen).',
          'Sendet nur den Geheimtext ins Netz. Den Klartext gebt ihr zum Prüfen mit an – er wird nicht gespeichert.',
          'Ob Eve euren Befehl geknackt hat, prüft die Plattform automatisch.'
        ]
      },
      bob: {
        titel: 'Rollenkarte · Bob-Team',
        text: 'Ihr empfangt die Befehle eures Alice-Teams.',
        schritte: [
          'Den Schlüssel kennt ihr von der gemeinsamen Schlüsselkarte.',
          'Entschlüsselt jeden Befehl, der für euch ankommt (um k nach links), und meldet den Klartext.',
          'Antwortet mit der verschlüsselten Quittung „befehl erhalten“ – mit demselben Schlüssel.'
        ]
      },
      eve: {
        titel: 'Rollenkarte · Eve-Team',
        text: 'Ihr seht alle Nachrichten im Netz. Ihr wisst: Alle benutzen Caesar. Den Schlüssel kennt ihr nicht.',
        schritte: [
          'Probiert die Verschiebungen aus (Chiffrierscheibe, Reiter „Alle Verschiebungen“).',
          'Meldet den Klartext einer geknackten Nachricht – die Plattform prüft ihn sofort.',
          'Ziel: so viele Befehle wie möglich lesen!'
        ]
      }
    },
    wettknacken: {
      knacker: {
        titel: 'Euer Auftrag',
        text: 'Ihr habt einen langen Brief aus dem Haus der Weisheit abgefangen. Jeder Buchstabe wurde durch einen anderen ersetzt – immer durch denselben.',
        schritte: [
          'Zählen: Rangfolge der Geheimtextbuchstaben notieren.',
          'Häufigster Buchstabe ≙ e.',
          'Paare und Dreiergruppen suchen: er, en, ch, sch, der, und.',
          'Lesen: Wörter ergänzen, Zuordnung verbessern.',
          'Ziel: ≥ 95 % richtig – schneller als die anderen Teams. Kein Brute Force – nur denken und zählen.'
        ]
      }
    },
    'doppelter-schluessel': {
      alice: {
        titel: 'Rolle · Alice-Team (Funkpaar)',
        text: 'Ihr seid die Funkstelle. Mit eurem Bob-Team teilt ihr einen geheimen Schlüsselblock – er wurde „vorher offline übergeben“.',
        schritte: [
          'Baut zwei Funksprüche aus dem Funkspruch-Baukasten (höchstens 24 Zeichen).',
          'Verschlüsselt Spruch 1 mit Abschnitt 1, Spruch 2 mit Abschnitt 2 (Bit-Lupe, OTP-Modus).',
          'Sendet die Hex-Folgen. Alle – auch Eve – sehen sie.',
          'Regel: Jeder Schlüsselabschnitt nur einmal!'
        ]
      },
      bob: {
        titel: 'Rolle · Bob-Team (Funkpaar)',
        text: 'Ihr seid die Empfangsstelle. Ihr besitzt denselben Schlüsselblock wie euer Alice-Team.',
        schritte: [
          'Wartet auf die Funksprüche eures Alice-Teams.',
          'Entschlüsselt jeden Spruch mit dem passenden Abschnitt: M = C ⊕ K.',
          'Bestätigt „empfangen und gelesen“ – und verratet den Klartext niemandem.',
          'Beobachtet: Kann Eve euren Spruch lesen?'
        ]
      },
      eve: {
        titel: 'Rolle · Eve-Team',
        text: 'Ihr hört alles mit: Alle Funksprüche erscheinen als Hex-Folge am Beamer und auf eurem Tablet. Den Schlüssel kennt ihr nicht.',
        schritte: [
          'Bildet in der Bit-Lupe (Doppelnutzungs-Modus) C1 ⊕ C2 für Sprüche desselben Absenders.',
          'Grün markierte Bytes 0000 0000: gleiche Zeichen in beiden Sprüchen.',
          'Schiebt Bausteinwörter als Crib über alle Positionen. Sinnvolle Buchstaben → Treffer!',
          'Tragt die rekonstruierten Sprüche ein. Ihr gewinnt, wenn ihr mindestens einen Spruch richtig rekonstruiert.'
        ]
      }
    },
    schluesseltausch: {
      alice: {
        titel: 'Rollenkarte · Alice-Team',
        text: 'Euer Ziel: mit eurem Bob-Team einen gemeinsamen Schlüssel K vereinbaren – obwohl Eve jede Nachricht mitliest.',
        schritte: [
          'Zieht verdeckt eine Geheimzahlkarte: das ist a. Niemand außer euch darf sie sehen.',
          'Berechnet A = gᵃ mod p (nach jeder Multiplikation mod p reduzieren!).',
          'Sendet A an euer Bob-Team.',
          'Wartet auf B. Berechnet K = Bᵃ mod p – mit B, nicht mit A!',
          'Meldet K verdeckt an die Spielleitung. Verratet a nie.'
        ]
      },
      bob: {
        titel: 'Rollenkarte · Bob-Team',
        text: 'Euer Ziel: mit eurem Alice-Team einen gemeinsamen Schlüssel K vereinbaren – obwohl Eve jede Nachricht mitliest.',
        schritte: [
          'Zieht verdeckt eine Geheimzahlkarte: das ist b. Niemand außer euch darf sie sehen.',
          'Berechnet B = gᵇ mod p (nach jeder Multiplikation mod p reduzieren!).',
          'Sendet B an euer Alice-Team.',
          'Wartet auf A. Berechnet K = Aᵇ mod p – mit A, nicht mit B!',
          'Meldet K verdeckt an die Spielleitung. Verratet b nie.'
        ]
      },
      eve: {
        titel: 'Rollenkarte · Eve-Team',
        text: 'Euer Ziel: den Schlüssel K jedes Paares herausfinden. Ihr seht alles, was über den Kanal geht: p, g, A und B.',
        schritte: [
          'Notiert für jedes Paar p, g, A und B.',
          'Überlegt: Was müsstet ihr kennen, um K selbst auszurechnen? Wie kommt ihr von A zurück zu a?',
          'Gebt für jedes Paar euren Tipp für K ab – so schnell wie möglich. Ob er stimmt, zeigt erst die Auflösung.',
          'Regel: Ihr dürft nur zuhören, keine Nachrichten verändern.'
        ]
      }
    },
    mallory: {
      alice: {
        titel: 'Rolle · Alice-Team',
        text: 'Ihr sendet einen Auftrag an euer Bob-Team. Ziel: Bob führt genau euren Auftrag aus.',
        schritte: [
          'Eure Auftragskarte hat die Plattform verdeckt gezogen. Niemand außer euch und eurem Bob-Team darf sie kennen.',
          'Wartet auf Bobs öffentlichen Schlüssel (Schlüsselnummer).',
          'Verschließt euren Auftrag damit und sendet ihn ab.',
          'Phase 2: Verwendet nur Schlüssel mit grün geprüftem Zertifikat.',
          'Ihr wisst nicht, wer sonst noch im Netz sitzt …'
        ]
      },
      bob: {
        titel: 'Rolle · Bob-Team',
        text: 'Ihr empfangt einen Auftrag von eurem Alice-Team und führt ihn aus.',
        schritte: [
          'Veröffentlicht eure Schlüsselnummer.',
          'Öffnen könnt ihr nur Umschläge mit eurer Nummer – die Schlüsselkarte bleibt bei euch.',
          'Lest den empfangenen Auftrag und meldet ihn der Spielleitung.',
          'Phase 2: Lasst euch von Trent (eurer Lehrkraft) ein Zertifikat ausstellen.'
        ]
      },
      mallory: {
        titel: 'Rolle · Mallory-Team (Postamt)',
        text: 'Ihr sitzt zwischen allen Paaren. Alle Nachrichten und alle Schlüssel laufen über euch. Ziel: Aufträge unbemerkt verändern (z. B. TOR 3 → TOR 8).',
        schritte: [
          'Ersetzt Bobs Schlüsselnummer durch eure eigene.',
          'Öffnet Umschläge mit euren Schlüsseln, lest, ändert, verschließt neu mit Bobs echter Nummer.',
          'Leitet alles andere ganz normal weiter – niemand soll etwas merken.',
          'Phase 2: Versucht es weiter: Schlüssel ohne Zertifikat, Zertifikat auf euren Namen, verändertes Zertifikat …',
          'Ihr brecht kein Verfahren – ihr tauscht nur Schlüssel.'
        ]
      }
    }
  });

  /** Rollenkarte als Element (oder null) */
  function rollenkarte(typ, rolle) {
    const r = (ROLLEN_TEXTE[typ] || {})[rolle];
    if (!r) return null;
    return h('aside', { class: 'karte funk-rollenkarte', 'aria-label': r.titel }, h('h2', null, r.titel), h('p', null, r.text), h('ol', { class: 'funk-schritte' }, r.schritte.map((x) => h('li', null, x))));
  }

  /* ---------- Whitelist und Senden-Formular ---------- */

  /**
   * Eingabe für den Funkraum vorbereiten: Umlaute sichtbar ersetzen, großschreiben, prüfen.
   * @returns {{ text: string, ersetzt: string[], gueltig: boolean, leer: boolean }}
   */
  function bereite(roh) {
    let t = String(roh ?? '');
    const ersetzt = [];
    for (const [von, nach] of ERSETZUNG) {
      if (t.includes(von)) {
        ersetzt.push(`${von} → ${nach}`);
        t = t.split(von).join(nach);
      }
    }
    const gross = t.toUpperCase();
    if (gross !== t && /[a-z]/.test(t)) ersetzt.push('klein → GROSS');
    const leer = !gross.trim();
    const gueltig = !leer && gross.length <= MAX && /^[A-Z0-9 ]+$/.test(gross);
    return { text: gross, ersetzt, gueltig, leer };
  }

  /** Server-Fehler als Text (429 mit Wartezeit) */
  function fehlerText(e) {
    if (!e) return 'Das hat nicht geklappt.';
    return e.message || 'Das hat nicht geklappt.';
  }

  let zaehler = 0;
  const neueId = (p) => `${p}-${++zaehler}`;

  /**
   * Senden-Formular: textarea.funk-text (≤ 160), p.funk-ersetzt (sichtbare Ersetzung), p.funk-fehler, optional
   * input.funk-klartext, button.funk-senden-knopf, p.funk-ergebnis (Rückmeldung, aria-live).
   * @param {object} ctx  Funkraum-Kontext
   * @param {{ klartext?: boolean, titel?: string, knopf?: string, extra?: () => object, vorSenden?: () => string|null,
   *           nachSenden?: Function, hinweis?: string }} o
   */
  function sendeFormular(ctx, o = {}) {
    const id = neueId('funk-text');
    const kid = neueId('funk-klartext');
    const feld = h('textarea', { class: 'funk-text', id, maxlength: String(MAX), rows: '3', autocomplete: 'off', spellcheck: 'false', autocapitalize: 'characters' });
    const ersetztEl = h('p', { class: 'funk-ersetzt text-2 klein', 'aria-live': 'polite' });
    const fehlerEl = h('p', { class: 'funk-fehler fehler', hidden: true });
    const klar = o.klartext ? h('input', { type: 'text', class: 'funk-klartext', id: kid, maxlength: String(MAX), autocomplete: 'off', spellcheck: 'false' }) : null;
    const knopf = h('button', { type: 'submit', class: 'knopf knopf-primaer funk-senden-knopf', disabled: true }, o.knopf || 'Senden');
    const ergebnis = h('p', { class: 'funk-ergebnis', 'aria-live': 'polite' });
    let laeuft = false;
    function pruefe() {
      const b = bereite(feld.value);
      ersetztEl.textContent = b.leer ? '' : `Gesendet wird: ${b.text}${b.ersetzt.length ? ` (${b.ersetzt.join(', ')})` : ''}`;
      const falsch = !b.leer && !b.gueltig;
      fehlerEl.hidden = !falsch;
      fehlerEl.textContent = falsch ? (b.text.length > MAX ? `Höchstens ${MAX} Zeichen.` : 'Nur A–Z, 0–9 und Leerzeichen') : '';
      const ohneKlar = klar && !klar.value.trim();
      knopf.disabled = laeuft || !b.gueltig || !!ohneKlar || (typeof ctx.gesperrt === 'function' && ctx.gesperrt());
      return b;
    }
    feld.addEventListener('input', pruefe);
    if (klar) klar.addEventListener('input', pruefe);
    const form = h(
      'form',
      { class: 'funk-senden', novalidate: true },
      o.titel ? h('h3', null, o.titel) : null,
      o.hinweis ? h('p', { class: 'text-2 klein' }, o.hinweis) : null,
      h('label', { for: id }, 'Geheimtext (A–Z, 0–9, Leerzeichen, höchstens 160 Zeichen)'),
      feld,
      ersetztEl,
      fehlerEl,
      klar ? h('label', { for: kid }, 'Klartext zum Prüfen (wird nicht gespeichert)') : null,
      klar,
      h('div', { class: 'knopf-reihe' }, knopf),
      ergebnis
    );
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const b = pruefe();
      if (!b.gueltig || knopf.disabled) return;
      const body = { text: b.text, ...(klar ? { klartext: klar.value } : {}), ...(typeof o.extra === 'function' ? o.extra() || {} : {}) };
      laeuft = true;
      knopf.disabled = true;
      try {
        await ctx.senden(body);
        feld.value = '';
        if (klar) klar.value = '';
        ergebnis.className = 'funk-ergebnis ok';
        ergebnis.textContent = 'Gesendet.';
        if (typeof o.nachSenden === 'function') o.nachSenden();
      } catch (e) {
        ergebnis.className = 'funk-ergebnis fehler';
        ergebnis.textContent = fehlerText(e);
      } finally {
        laeuft = false;
        pruefe();
      }
    });
    pruefe();
    return { element: form, feld, klar, pruefe, ergebnis };
  }

  /* ---------- Listen mit stabilen Einträgen ---------- */

  /**
   * Liste nach Schlüssel abgleichen: neue Einträge bauen (baue), vorhandene aktualisieren, verschwundene entfernen.
   * Reihenfolge = Reihenfolge von eintraege.
   */
  function abgleich(ol, eintraege, { schluessel, baue, aktualisiere }) {
    const alt = new Map([...ol.children].map((li) => [li.getAttribute('data-schluessel'), li]));
    const neu = [];
    for (const e of eintraege) {
      const k = String(schluessel(e));
      let li = alt.get(k);
      if (!li) {
        li = baue(e);
        li.setAttribute('data-schluessel', k);
      }
      if (typeof aktualisiere === 'function') aktualisiere(li, e);
      alt.delete(k);
      neu.push(li);
    }
    for (const li of alt.values()) li.remove();
    neu.forEach((li, i) => {
      if (ol.children[i] !== li) ol.insertBefore(li, ol.children[i] || null);
    });
  }

  /** „vor 1:10 min“ aus ISO-Zeit */
  function vor(iso) {
    const t = Date.parse(iso);
    if (Number.isNaN(t)) return '';
    const sek = (Date.now() - t) / 1000;
    return sek < 10 ? 'gerade eben' : `vor ${KRNetz.dauer(sek)}`;
  }

  /** Status-Chips einer Nachricht (Symbol und Text) */
  function chips(n) {
    return [
      n.angekommen ? h('span', { class: 'chip angekommen' }, '✓ angekommen') : null,
      n.geknackt ? h('span', { class: 'chip geknackt' }, '! geknackt') : null,
      n.ausgeblendet ? h('span', { class: 'chip ausgeblendet' }, '– ausgeblendet') : null
    ];
  }

  /**
   * Posteingang: ol.funk-post mit li.funk-nachricht[data-id][data-art]; aktionen(n) baut einmal je Nachricht die Formulare.
   * @returns {{ element, aktualisiere(nachrichten) }}
   */
  function posteingang(ctx, { titel = 'Nachrichten', leer = 'Noch keine Nachrichten.', aktionen = null, kopf = null, zeit = false } = {}) {
    const ol = h('ol', { class: 'funk-post' });
    const leerEl = h('p', { class: 'text-2 funk-post-leer' }, leer);
    const element = h('section', { class: 'funk-post-bereich' }, h('h3', null, titel), leerEl, ol);
    function aktualisiere(nachrichten) {
      const liste = (nachrichten || []).slice().sort((a, b) => b.id - a.id);
      leerEl.hidden = liste.length > 0;
      abgleich(ol, liste, {
        schluessel: (n) => n.id,
        baue: (n) => {
          const li = h('li', { class: 'funk-nachricht', 'data-id': String(n.id), 'data-art': n.art || 'nachricht' });
          li._kopf = h('p', { class: 'funk-nachricht-kopf klein text-2' });
          li._inhalt = h('code', { class: 'funk-inhalt' });
          li._chips = h('span', { class: 'funk-chips' });
          li._aktion = h('div', { class: 'funk-aktion' });
          li.append(li._kopf, li._inhalt, li._chips, li._aktion);
          if (typeof aktionen === 'function') AQ.mount(li._aktion, aktionen(n, li));
          return li;
        },
        aktualisiere: (li, n) => {
          li.classList.toggle('ausgeblendet', !!n.ausgeblendet);
          li._kopf.textContent = kopf ? kopf(n) : `${ctx.teamName(n.angezeigtVon ?? n.von)} → ${ctx.teamName(n.an)}${zeit ? ` · gesendet ${vor(n.zeit)}` : ''}`;
          li._inhalt.textContent = n.ausgeblendet ? '(ausgeblendet)' : n.inhalt || '';
          AQ.mount(li._chips, chips(n));
          li._n = n;
          if (n.ausgeblendet || n.geknackt) for (const x of li._aktion.querySelectorAll('button, input, select, textarea')) x.disabled = true;
        }
      });
    }
    return { element, aktualisiere, ol };
  }

  /**
   * Prüf-Formular je Nachricht (Bob „Entschlüsselt – melden“, Eve „Geknackt – melden“): form.funk-empfangen bzw.
   * form.funk-knacken[data-nachricht] mit input.funk-klartext und p.funk-ergebnis.
   */
  function pruefFormular(ctx, n, { art, knopf, label, erfolg, misserfolg, pfad }) {
    const id = neueId(`funk-${art}`);
    const feld = h('input', { type: 'text', class: 'funk-klartext', id, maxlength: String(MAX), autocomplete: 'off', spellcheck: 'false' });
    const ergebnis = h('p', { class: 'funk-ergebnis', 'aria-live': 'polite' });
    const k = h('button', { type: 'submit', class: 'knopf knopf-zweit' }, knopf);
    const form = h('form', { class: `funk-${art}`, 'data-nachricht': String(n.id), novalidate: true }, h('label', { for: id }, label), h('div', { class: 'funk-zeile' }, feld, k), ergebnis);
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      if (!feld.value.trim()) {
        ergebnis.className = 'funk-ergebnis fehler';
        ergebnis.textContent = 'Gib zuerst den Klartext ein.';
        return;
      }
      k.disabled = true;
      try {
        const r = await ctx.aktion(pfad, { nachricht: n.id, klartext: feld.value });
        ergebnis.className = `funk-ergebnis ${r && r.richtig ? 'ok' : 'falsch'}`;
        ergebnis.textContent = r && r.richtig ? (typeof erfolg === 'function' ? erfolg(r) : erfolg) : misserfolg;
      } catch (e) {
        ergebnis.className = 'funk-ergebnis fehler';
        ergebnis.textContent = fehlerText(e);
      } finally {
        k.disabled = false;
      }
    });
    return form;
  }

  /* ---------- Registry ---------- */

  /** Szene registrieren: fabrik(ctx) → { element, aktualisiere(stand), schliesse() } */
  function registriere(typ, fabrik) {
    SZENEN.set(typ, fabrik);
  }

  /** Allgemeine Szene (Typ ohne eigene Szene): Senden (wenn die Rolle sendet) und Posteingang */
  const SENDET = Object.freeze({ botenlauf: { alice: true, bob: true } });
  const KLARTEXT = Object.freeze({ botenlauf: true });
  function allgemein(ctx) {
    const st = ctx.stand();
    const rolle = st.ich && st.ich.rolle;
    const sendet = !!((SENDET[st.typ] || {})[rolle]);
    const formular = sendet ? sendeFormular(ctx, { klartext: !!KLARTEXT[st.typ], titel: 'Nachricht senden' }) : null;
    const post = posteingang(ctx, { titel: 'Nachrichten im Netz', zeit: true });
    const element = h('div', { class: 'funk-szene-allgemein' }, formular ? formular.element : null, post.element);
    return {
      element,
      aktualisiere(stand) {
        post.aktualisiere(stand.nachrichten);
        if (formular) formular.pruefe();
      },
      schliesse() {}
    };
  }

  /** Szene für den Typ bauen (registriert oder allgemein) */
  function zeige(typ, ctx) {
    const fabrik = SZENEN.get(typ) || allgemein;
    return fabrik(ctx);
  }

  return { registriere, zeige, rollenkarte, sendeFormular, posteingang, pruefFormular, abgleich, bereite, fehlerText, vor, chips, ROLLEN_TEXTE, MAX };
})();
