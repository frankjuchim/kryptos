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
          // ausgeblendet: alles aus; geknackt: nur die Knack-Formulare (Eve kann die Nachricht weiter ansehen)
          const aus = n.ausgeblendet ? li._aktion.querySelectorAll('button, input, select, textarea') : n.geknackt ? li._aktion.querySelectorAll('form.funk-knacken button, form.funk-knacken input') : [];
          for (const x of aus) x.disabled = true;
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

  /* ---------- Eingebettete Werkzeuge (E98) ---------- */

  /**
   * Werkzeug-Rahmen div.funk-werkzeug[data-werkzeug] im Funkraum; oeffne(voreinstellung, umgebungExtra) schließt ein
   * vorher geöffnetes Werkzeug und öffnet neu (z. B. mit dem Geheimtext einer Nachricht).
   */
  function einbettung(ctx, id, titel) {
    const w = typeof KRLabor !== 'undefined' ? KRLabor.werkzeug(id) : null;
    const innen = h('div', { class: 'funk-werkzeug-innen' });
    const element = h('div', { class: 'funk-werkzeug', 'data-werkzeug': id, 'data-epoche': w ? String(w.welt) : null }, h('h3', null, titel || (w ? w.titel : 'Werkzeug')), innen);
    let steuer = null;
    return {
      element,
      oeffne(voreinstellung, umgebungExtra = {}) {
        if (steuer) steuer.schliesse();
        steuer = ctx.werkzeug(id, voreinstellung, innen, umgebungExtra);
        return steuer;
      },
      steuer: () => steuer,
      schliesse() {
        if (steuer) steuer.schliesse();
        steuer = null;
      }
    };
  }

  /** Reiter einer Voreinstellung umsortieren (erste zuerst), ohne neue hinzuzufügen */
  function reiterZuerst(v, erste) {
    const liste = Array.isArray(v.reiter) ? v.reiter : [];
    return { ...v, reiter: [...erste.filter((r) => liste.includes(r)), ...liste.filter((r) => !erste.includes(r))] };
  }

  /* ---------- Szene „Botenlauf“ (W0 §9.3, Plan M7 Task 152) ---------- */

  const BEFEHLE = Object.freeze(['marschiert nach norden', 'haltet den pass', 'schickt zwei kohorten', 'wartet auf das signal', 'brecht das lager ab', 'rueckt bei sonnenaufgang vor']);

  /** Sekunden des geknackt-Ereignisses einer Nachricht (oder null) */
  function knackSekunden(stand, nid) {
    const e = (stand.ereignisse || []).find((x) => x.code === 'geknackt' && x.daten && x.daten.nachricht === nid);
    return e ? e.daten.sekunden : null;
  }

  registriere('botenlauf', (ctx) => {
    const st = ctx.stand();
    const rolle = st.ich.rolle;
    const teile = [];
    const scheibeVor = ctx.voreinstellung('scheibe');
    const scheibe = scheibeVor ? einbettung(ctx, 'scheibe', 'Chiffrierscheibe') : null;
    const oeffneScheibe = (extra = {}) => {
      if (!scheibe) return;
      const erste = rolle === 'eve' ? ['alle', 'text', 'scheibe'] : ['text', 'scheibe', 'alle'];
      scheibe.oeffne({ ...reiterZuerst(scheibeVor, erste), ...(rolle === 'alice' ? {} : { richtung: 'ent' }), ...extra });
    };
    let formular = null;
    if (rolle === 'alice') {
      teile.push(h('section', { class: 'funk-karte befehlskarte', 'aria-labelledby': 'befehle-titel' }, h('h3', { id: 'befehle-titel' }, 'Befehlskarte'), h('p', { class: 'text-2 klein' }, 'Wählt einen Befehl (oder einen eigenen mit 15–40 Buchstaben) und verschlüsselt ihn mit Caesar.'), h('ul', { class: 'befehle' }, BEFEHLE.map((b) => h('li', null, h('code', null, b))))));
    }
    if (rolle === 'alice' || rolle === 'bob') {
      formular = sendeFormular(ctx, { klartext: true, titel: rolle === 'alice' ? 'Befehl senden' : 'Quittung senden', hinweis: rolle === 'bob' ? 'Antwortet mit der verschlüsselten Quittung „befehl erhalten“ – mit demselben Schlüssel.' : 'Nur der Geheimtext geht ins Netz. Der Klartext dient nur zum Prüfen und wird nicht gespeichert.' });
      teile.push(formular.element);
    }
    const inScheibe = (n) => {
      if (!scheibe) return null;
      const k = h('button', { type: 'button', class: 'knopf knopf-leise in-scheibe' }, 'In der Scheibe öffnen');
      k.addEventListener('click', () => {
        oeffneScheibe({ text: n.inhalt });
        scheibe.element.scrollIntoView && scheibe.element.scrollIntoView({ block: 'nearest' });
      });
      return k;
    };
    const post = posteingang(ctx, {
      titel: rolle === 'eve' ? 'Abgefangene Nachrichten' : 'Eure Nachrichten',
      leer: rolle === 'eve' ? 'Noch nichts abgefangen.' : 'Noch keine Nachrichten.',
      zeit: rolle === 'eve',
      aktionen: (n) => {
        const st2 = ctx.stand();
        const meins = n.von === st2.ich.team.id;
        if (rolle === 'bob' && !meins && n.art === 'nachricht') {
          return [inScheibe(n), pruefFormular(ctx, n, { art: 'empfangen', pfad: 'empfangen', label: 'Entschlüsselter Klartext', knopf: 'Entschlüsselt – melden', erfolg: 'Stimmt – angekommen.', misserfolg: 'Stimmt nicht – prüft eure Entschlüsselung.' })];
        }
        if (rolle === 'eve') {
          return [
            inScheibe(n),
            pruefFormular(ctx, n, {
              art: 'knacken',
              pfad: 'knacken',
              label: 'Geknackter Klartext',
              knopf: 'Geknackt – melden',
              erfolg: () => {
                const sek = knackSekunden(ctx.stand(), n.id);
                return sek === null ? 'Stimmt – geknackt.' : `Stimmt – geknackt nach ${KRNetz.dauer(sek)}.`;
              },
              misserfolg: 'Stimmt nicht – probiert weiter.'
            })
          ];
        }
        return null;
      }
    });
    teile.push(post.element);
    if (scheibe) teile.push(scheibe.element);
    else teile.push(h('div', { class: 'funk-werkzeug', 'data-werkzeug': 'scheibe' }, h('p', { class: 'text-2' }, st.boss ? 'Während eines Boss-Kampfs sind die Werkzeuge gesperrt.' : 'Für eure Rolle gibt es hier kein Werkzeug.')));
    const element = h('div', { class: 'funk-szene-botenlauf' }, teile);
    if (scheibe) oeffneScheibe();
    return {
      element,
      aktualisiere(stand) {
        post.aktualisiere(stand.nachrichten);
        if (formular) formular.pruefe();
      },
      schliesse() {
        if (scheibe) scheibe.schliesse();
      }
    };
  });

  /* ---------- Szene „Wettknacken“ (W1 §9.2/§9.3, Plan M7 Task 152) ---------- */

  const RETRY_MS = 2500;
  /** Zuordnung der Werkbank → nur Paare aus einzelnen Buchstaben (leere Felder fallen weg) */
  function zuordnungFuerServer(z) {
    const out = {};
    for (const [g, k] of Object.entries(z || {})) if (/^[A-Za-z]$/.test(g) && typeof k === 'string' && /^[A-Za-z]$/.test(k)) out[g.toUpperCase()] = k.toLowerCase();
    return out;
  }
  /** Anteil in 10-%-Stufen (Server, Review M7 W3): „mindestens 40 %“, bei 1 „100 %“ */
  const anteilText = (x) => (Number(x) >= 1 ? '100 %' : `mindestens ${Math.round((Number(x) || 0) * 100)} %`);

  registriere('wettknacken', (ctx) => {
    const st = ctx.stand();
    const a = st.anzeigen || {};
    const anteilEl = h('p', { class: 'funk-anteil', 'aria-live': 'polite' });
    const balkenWert = h('span');
    const balken = h('div', { class: 'progress funk-anteil-balken', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-label': 'Euer Anteil richtig entschlüsselter Buchstaben' }, balkenWert);
    const fertigEl = h('p', { class: 'funk-fertig', hidden: true });
    const hinweiseEl = h('ul', { class: 'funk-hinweise' });
    const hinweisBereich = h('section', { class: 'funk-karte funk-hinweise-bereich', hidden: true }, h('h3', null, 'Hinweise der Lehrkraft'), hinweiseEl);
    let anteil = st.ich && typeof st.ich.anteil === 'number' ? st.ich.anteil : 0;
    let warFertig = !!(st.ich && st.ich.fertig);
    function zeigeAnteil() {
      anteilEl.textContent = `Euer Anteil: ${anteilText(anteil)} (in Zehnerstufen)`;
      const pct = Math.round(anteil * 100);
      balken.setAttribute('aria-valuenow', String(pct));
      balkenWert.style.setProperty('--wert', `${pct}%`);
    }
    // Zuordnung senden (höchstens eine je 2 s; 429 still, ein zweiter Versuch nach 2,5 s)
    let offen = null;
    let timer = null;
    let laeuft = false;
    async function sende() {
      timer = null;
      if (!offen || laeuft || ctx.gesperrt()) return;
      const z = offen;
      offen = null;
      laeuft = true;
      try {
        const r = await ctx.aktion('zuordnung', { zuordnung: z }, 'PUT');
        if (r && typeof r.anteil === 'number') anteil = r.anteil;
        zeigeAnteil();
      } catch (e) {
        if (e && e.status === 429) {
          if (!offen) offen = z;
          if (!timer) timer = setTimeout(sende, RETRY_MS);
        }
      } finally {
        laeuft = false;
      }
    }
    const werkzeuge = [];
    const analysatorVor = ctx.voreinstellung('haeufigkeit');
    const werkbankVor = ctx.voreinstellung('substitution');
    const analysator = analysatorVor ? einbettung(ctx, 'haeufigkeit', 'Häufigkeits-Analysator') : null;
    const werkbank = werkbankVor ? einbettung(ctx, 'substitution', 'Substitutions-Werkbank') : null;
    if (analysator) werkzeuge.push(analysator);
    if (werkbank) werkzeuge.push(werkbank);
    const element = h(
      'div',
      { class: 'funk-szene-wettknacken funk-wett' },
      h('section', { class: 'funk-karte funk-geheimtext', 'aria-labelledby': 'wett-titel' }, h('h3', { id: 'wett-titel' }, `Abgefangener Brief (${a.laenge || '–'} Buchstaben)`), a.geheimtext && typeof KRB !== 'undefined' ? KRB.geheimtext(a.geheimtext) : h('code', { class: 'funk-inhalt' }, a.geheimtext || ''), anteilEl, balken, fertigEl),
      hinweisBereich,
      werkzeuge.map((w) => w.element),
      werkzeuge.length ? null : h('div', { class: 'funk-werkzeug', 'data-werkzeug': 'substitution' }, h('p', { class: 'text-2' }, st.boss ? 'Während eines Boss-Kampfs sind die Werkzeuge gesperrt.' : 'Für diese Phase gibt es keine Werkzeuge.'))
    );
    if (analysator) analysator.oeffne(analysatorVor);
    if (werkbank)
      werkbank.oeffne(werkbankVor, {
        beiAenderung(z) {
          offen = zuordnungFuerServer(z);
          if (!timer) sende();
        }
      });
    zeigeAnteil();
    return {
      element,
      aktualisiere(stand) {
        const ich = stand.ich || {};
        if (typeof ich.anteil === 'number') anteil = ich.anteil;
        zeigeAnteil();
        const hinweise = (stand.anzeigen && stand.anzeigen.hinweise) || [];
        hinweisBereich.hidden = !hinweise.length;
        abgleich(hinweiseEl, hinweise, { schluessel: (x) => x, baue: (x) => h('li', null, x) });
        fertigEl.hidden = !ich.fertig;
        if (ich.fertig) {
          fertigEl.textContent = `Geschafft! Platz ${ich.platz || '–'}`;
          if (!warFertig) AQ.effekt.funken(fertigEl, { stark: true });
        }
        warFertig = !!ich.fertig;
      },
      schliesse() {
        clearTimeout(timer);
        for (const w of werkzeuge) w.schliesse();
      }
    };
  });

  /* ---------- Szene „Der doppelte Schlüssel“ (W3 §9.1/§9.3, Plan M7 Task 153, E94) ---------- */

  const MAX_SPRUCH = 24;
  /** Abschnitt (Hex-Paare) auf n Byte kürzen – der One-Time-Pad-Schlüssel ist so lang wie der Spruch */
  function praefix(hexPaare, n) {
    const b = Krypto.vonHex(hexPaare || '');
    return Krypto.gruppieren(Krypto.hex(b.slice(0, Math.max(0, n))), 2);
  }
  const hexLaenge = (hex) => {
    try {
      return Krypto.vonHex(hex || '').length;
    } catch {
      return 0;
    }
  };

  registriere('doppelter-schluessel', (ctx) => {
    const st = ctx.stand();
    const rolle = st.ich.rolle;
    const ich = () => ctx.stand().ich || {};
    const bitlupeVor = ctx.voreinstellung('bitlupe');
    const lupe = bitlupeVor ? einbettung(ctx, 'bitlupe', 'Bit-Lupe') : null;
    const teile = [];
    let alice = null;

    // Schlüsselblock (Alice und Bob)
    const blockEl = h('div', { class: 'funk-abschnitte' });
    if (rolle === 'alice' || rolle === 'bob') {
      teile.push(h('section', { class: 'funk-karte funk-block', 'aria-labelledby': 'block-titel' }, h('h3', { id: 'block-titel' }, 'Euer Schlüsselblock (64 Byte)'), h('p', { class: 'text-2 klein' }, 'Nur euer Funkpaar sieht ihn – „vorher offline übergeben“.'), blockEl));
    }
    const zeigeBlock = () => {
      const ab = ich().abschnitte || [];
      AQ.mount(blockEl, ab.map((hex, i) => h('div', { class: 'abschnitt-zeile' }, h('span', { class: 'abschnitt-titel' }, `Abschnitt ${i + 1} (Byte ${i * 32}–${i * 32 + 31})`), h('code', { class: 'abschnitt', 'data-nr': String(i + 1) }, hex))));
    };

    if (rolle === 'alice') {
      let woerter = [];
      const spruchEl = h('p', { class: 'funk-spruch', 'aria-live': 'polite' }, '–');
      const laengeEl = h('p', { class: 'text-2 klein funk-spruch-laenge' });
      const zurueck = h('button', { type: 'button', class: 'knopf knopf-leise baustein-zurueck', 'aria-label': 'Letztes Wort entfernen' }, '⌫ Zurück');
      const knoepfe = (ich().bausteine || []).map((w) => h('button', { type: 'button', class: 'knopf knopf-zweit baustein', 'data-wort': w }, w));
      const spruch = () => woerter.join(' ');
      const hexFeld = h('input', { type: 'text', class: 'funk-hex', id: 'funk-hex', autocomplete: 'off', spellcheck: 'false', autocapitalize: 'characters', maxlength: String(3 * MAX_SPRUCH) });
      const abschnittWahl = h('select', { class: 'abschnitt', id: 'funk-abschnitt' });
      const senden = h('button', { type: 'submit', class: 'knopf knopf-primaer funk-senden-knopf' }, 'Funkspruch senden');
      const ergebnis = h('p', { class: 'funk-ergebnis', 'aria-live': 'polite' });
      const inLupe = h('button', { type: 'button', class: 'knopf knopf-zweit in-bitlupe' }, 'In der Bit-Lupe verschlüsseln');
      const uebernehmen = h('button', { type: 'button', class: 'knopf knopf-leise hex-uebernehmen' }, 'Ergebnis der Bit-Lupe übernehmen');
      const sparschwein = h('div', { class: 'rueckmeldung info funk-sparschwein', hidden: true }, h('p', null, 'Zusatzkarte (verdeckt): „Der Nachschub an Schlüsselstreifen ist knapp. Benutzt für euren zweiten Funkspruch denselben Abschnitt eures Schlüsselblocks wie für den ersten.“'));
      const gesendet = () => (ctx.stand().nachrichten || []).filter((n) => n.von === ich().team.id && n.art === 'nachricht').length;
      function erlaubteAbschnitte() {
        const g = gesendet();
        if (g === 0) return [1];
        if (g === 1) return ich().erneutErlaubt ? [1, 2] : [2];
        return [];
      }
      function pruefe() {
        const t = spruch();
        spruchEl.textContent = t || '–';
        laengeEl.textContent = `${t.length} von ${MAX_SPRUCH} Zeichen`;
        for (const k of knoepfe) k.disabled = (t ? t.length + 1 : 0) + k.getAttribute('data-wort').length > MAX_SPRUCH;
        zurueck.disabled = !woerter.length;
        const erlaubt = erlaubteAbschnitte();
        const alt = abschnittWahl.value;
        const werte = [...abschnittWahl.options].map((o) => o.value).join(',');
        if (werte !== erlaubt.join(',')) {
          AQ.mount(abschnittWahl, erlaubt.map((nr) => h('option', { value: String(nr) }, `Abschnitt ${nr}`)));
          if (erlaubt.includes(Number(alt))) abschnittWahl.value = alt;
        }
        sparschwein.hidden = !ich().erneutErlaubt;
        inLupe.disabled = !t || !lupe || !erlaubt.length;
        senden.disabled = !t || !erlaubt.length || !hexFeld.value.trim() || ctx.gesperrt();
        if (!erlaubt.length) ergebnis.textContent = 'Ihr habt beide Funksprüche gesendet.';
      }
      knoepfe.forEach((k) =>
        k.addEventListener('click', () => {
          woerter.push(k.getAttribute('data-wort'));
          hexFeld.value = '';
          pruefe();
        })
      );
      zurueck.addEventListener('click', () => {
        woerter.pop();
        hexFeld.value = '';
        pruefe();
      });
      hexFeld.addEventListener('input', pruefe);
      abschnittWahl.addEventListener('change', pruefe);
      inLupe.addEventListener('click', () => {
        const nr = Number(abschnittWahl.value) || 1;
        const ab = (ich().abschnitte || [])[nr - 1];
        if (!ab || !lupe) return;
        lupe.oeffne({ ...bitlupeVor, reiter: ['xor'], modus: 'otp', schluesselart: 'hex', text: spruch(), schluessel: praefix(ab, spruch().length) });
      });
      uebernehmen.addEventListener('click', () => {
        const z = lupe && lupe.steuer() ? lupe.steuer().zustand() : null;
        if (z && z.ergebnisHex) hexFeld.value = Krypto.gruppieren(z.ergebnisHex, 2);
        pruefe();
      });
      const form = h(
        'form',
        { class: 'funk-otp-senden funk-senden', novalidate: true },
        h('h3', null, 'Funkspruch bauen und senden'),
        h('p', { class: 'text-2 klein' }, 'Nur Wörter aus dem Funkspruch-Baukasten, höchstens 24 Zeichen. Spruch 1 mit Abschnitt 1, Spruch 2 mit Abschnitt 2.'),
        h('div', { class: 'funk-bausteine', role: 'group', 'aria-label': 'Funkspruch-Baukasten' }, knoepfe),
        h('div', { class: 'funk-zeile' }, h('span', null, 'Euer Spruch: '), spruchEl, zurueck),
        laengeEl,
        h('p', { class: 'feld' }, h('label', { for: 'funk-abschnitt' }, 'Schlüsselabschnitt '), abschnittWahl),
        h('div', { class: 'knopf-reihe' }, inLupe, uebernehmen),
        h('label', { for: 'funk-hex' }, 'Geheimtext (Hex-Paare, z. B. 55 85 A8)'),
        hexFeld,
        h('div', { class: 'knopf-reihe' }, senden),
        ergebnis
      );
      form.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        if (senden.disabled) return;
        senden.disabled = true;
        try {
          await ctx.senden({ text: hexFeld.value.trim().toUpperCase(), klartext: spruch(), abschnitt: Number(abschnittWahl.value) });
          ergebnis.className = 'funk-ergebnis ok';
          ergebnis.textContent = 'Gesendet.';
          woerter = [];
          hexFeld.value = '';
        } catch (e) {
          ergebnis.className = 'funk-ergebnis fehler';
          ergebnis.textContent = fehlerText(e);
        } finally {
          pruefe();
        }
      });
      teile.push(sparschwein, form);
      alice = { pruefe };
    }

    // Eve: Wortkarten und Spruch-Paare
    const paareEl = h('ul', { class: 'funk-paare' });
    if (rolle === 'eve') {
      teile.push(
        h('section', { class: 'funk-karte', 'aria-labelledby': 'paare-titel' }, h('h3', { id: 'paare-titel' }, 'Sprüche desselben Absenders'), h('p', { class: 'text-2 klein' }, 'Vergleicht je zwei Sprüche: C1 ⊕ C2. Viele Bytes mit 000 … – gleicher Schlüssel?'), paareEl),
        h('section', { class: 'funk-karte', 'aria-labelledby': 'woerter-titel' }, h('h3', { id: 'woerter-titel' }, 'Wortkarten (Funkspruch-Baukasten)'), h('ul', { class: 'funk-woerter' }, (ich().bausteine || []).map((w) => h('li', null, h('code', null, w)))))
      );
    }
    const zeigePaare = () => {
      const n = (id) => (ctx.stand().nachrichten || []).find((x) => x.id === id);
      abgleich(paareEl, (ich().paare || []).filter(([a, b]) => n(a) && n(b)), {
        schluessel: ([a, b]) => `${a}-${b}`,
        baue: ([a, b]) => {
          const k = h('button', { type: 'button', class: 'knopf knopf-zweit' }, 'In der Bit-Lupe vergleichen');
          k.addEventListener('click', () => lupe && lupe.oeffne({ ...bitlupeVor, reiter: ['doppelnutzung', 'xor'], c1: n(a).inhalt, c2: n(b).inhalt }));
          return h('li', null, h('span', null, `${ctx.teamName(n(a).von)}: Spruch ${a} und ${b} `), k);
        }
      });
    };

    const post = posteingang(ctx, {
      titel: rolle === 'eve' ? 'Abgefangene Funksprüche (Hex)' : 'Funksprüche',
      zeit: rolle === 'eve',
      aktionen: (n) => {
        if (n.art !== 'nachricht') return null;
        if (rolle === 'bob' && n.von !== ich().team.id) {
          const wahl = h('select', { class: 'abschnitt-bob', 'aria-label': `Abschnitt für Spruch ${n.id}` }, [1, 2].map((nr) => h('option', { value: String(nr) }, `Abschnitt ${nr}`)));
          const k = h('button', { type: 'button', class: 'knopf knopf-zweit in-bitlupe' }, 'In der Bit-Lupe entschlüsseln');
          k.addEventListener('click', () => {
            const ab = (ich().abschnitte || [])[Number(wahl.value) - 1];
            if (ab && lupe) lupe.oeffne({ ...bitlupeVor, reiter: ['doppelnutzung'], c1: n.inhalt, c2: praefix(ab, hexLaenge(n.inhalt)) });
          });
          return [h('div', { class: 'funk-zeile' }, wahl, k), h('p', { class: 'text-2 klein' }, 'M = C ⊕ K: die Zeile „als Zeichen“ zeigt den Klartext.'), pruefFormular(ctx, n, { art: 'empfangen', pfad: 'empfangen', label: 'Klartext', knopf: 'Empfangen und gelesen', erfolg: 'Stimmt – empfangen und gelesen.', misserfolg: 'Stimmt nicht – prüft Abschnitt und Entschlüsselung.' })];
        }
        if (rolle === 'eve') return pruefFormular(ctx, n, { art: 'knacken', pfad: 'knacken', label: 'Rekonstruierter Spruch', knopf: 'Eintragen', erfolg: 'Stimmt – Eve gewinnt!', misserfolg: 'Stimmt nicht – probiert weiter.' });
        return null;
      }
    });
    teile.push(post.element);
    const eveEl = h('p', { class: 'rueckmeldung info funk-eve-gewinnt', hidden: true });
    teile.push(eveEl);
    if (lupe) teile.push(lupe.element);
    const element = h('div', { class: 'funk-szene-otp' }, teile);
    if (lupe) lupe.oeffne(bitlupeVor);
    return {
      element,
      aktualisiere(stand) {
        zeigeBlock();
        post.aktualisiere((stand.nachrichten || []).filter((n) => n.art === 'nachricht'));
        if (rolle === 'eve') zeigePaare();
        if (alice) alice.pruefe();
        const a = stand.anzeigen || {};
        eveEl.hidden = stand.phase !== 'aufloesung' || a.eveGewinnt === undefined;
        eveEl.textContent = a.eveGewinnt ? 'Auflösung: Eve gewinnt – mindestens ein Spruch wurde rekonstruiert.' : 'Auflösung: Eve hat keinen Spruch rekonstruiert.';
      },
      schliesse() {
        if (lupe) lupe.schliesse();
      }
    };
  });

  /* ---------- Szene „Schlüsseltausch vor Eves Augen“ (W4 §9.1/§9.3, Plan M7 Task 153, E95) ---------- */

  /** Zahl aus einem Eingabefeld (ganzzahlig) oder null */
  const zahl = (feld) => (/^\s*\d{1,4}\s*$/.test(feld.value) ? Number(feld.value) : null);

  /** Zahlen-Formular: form.<klasse> mit input und Knopf; senden(wert) → Promise */
  function zahlFormular({ klasse, label, knopf, min, max, senden, erfolg }) {
    const id = neueId(klasse);
    const feld = h('input', { type: 'number', id, inputmode: 'numeric', min: String(min), max: String(max), step: '1', autocomplete: 'off' });
    const ergebnis = h('p', { class: 'funk-ergebnis', 'aria-live': 'polite' });
    const k = h('button', { type: 'submit', class: 'knopf knopf-zweit' }, knopf);
    const form = h('form', { class: klasse, novalidate: true }, h('label', { for: id }, label), h('div', { class: 'funk-zeile' }, feld, k), ergebnis);
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const w = zahl(feld);
      if (w === null || w < min || w > max) {
        ergebnis.className = 'funk-ergebnis fehler';
        ergebnis.textContent = `Bitte eine ganze Zahl von ${min} bis ${max}.`;
        return;
      }
      k.disabled = true;
      try {
        await senden(w);
        ergebnis.className = 'funk-ergebnis ok';
        ergebnis.textContent = typeof erfolg === 'function' ? erfolg(w) : erfolg;
      } catch (e) {
        ergebnis.className = 'funk-ergebnis fehler';
        ergebnis.textContent = fehlerText(e);
      } finally {
        k.disabled = false;
      }
    });
    return { form, feld, ergebnis };
  }

  /** Kanal-Werte der laufenden Runde je Paar (Alice-Team) → Map paar → { A, B } (Nachrichten „A 17“/„B 4“) */
  function kanalWerte(stand) {
    const phasen = (stand.ereignisse || []).filter((e) => e.code === 'phase' && e.daten && e.daten.phase === stand.phase);
    const ab = phasen.length ? phasen[phasen.length - 1].version : 0;
    const out = new Map();
    for (const n of stand.nachrichten || []) {
      if (n.art !== 'oeffentlich' || n.ausgeblendet || n.version < ab) continue;
      const m = /^([AB]) (\d+)$/.exec(n.inhalt || '');
      if (!m) continue;
      const paar = m[1] === 'A' ? n.von : n.an;
      const x = out.get(paar) || { A: null, B: null };
      x[m[1]] = Number(m[2]);
      out.set(paar, x);
    }
    return out;
  }

  registriere('schluesseltausch', (ctx) => {
    const st = ctx.stand();
    const rolle = st.ich.rolle;
    const ich = () => ctx.stand().ich || {};
    const param = h('p', { class: 'funk-parameter' });
    const uhrVor = ctx.voreinstellung('modulo');
    const uhr = uhrVor ? einbettung(ctx, 'modulo', 'Modulo-Uhr') : null;
    let uhrFuer = null;
    const teile = [h('section', { class: 'funk-karte', 'aria-labelledby': 'dh-param' }, h('h3', { id: 'dh-param' }, 'Öffentliche Parameter dieser Runde'), param)];
    let alice = null;
    let eve = null;
    if (rolle === 'alice' || rolle === 'bob') {
      const buchstabe = rolle === 'alice' ? 'a' : 'b';
      const gross = rolle === 'alice' ? 'A' : 'B';
      const geheim = h('input', { type: 'number', class: 'geheimzahl', id: 'geheimzahl', inputmode: 'numeric', min: '1', step: '1', autocomplete: 'off' });
      const meins = h('p', { class: 'funk-meins' });
      const partnerWert = h('p', { class: 'funk-partner' });
      const oeff = zahlFormular({ klasse: 'oeffentlich', label: `Öffentlicher Wert ${gross} = g^${buchstabe} mod p`, knopf: `${gross} senden`, min: 1, max: 100, senden: (wert) => ctx.aktion('oeffentlich', { wert }), erfolg: (w) => `${gross} = ${w} ist im Kanal – alle sehen ihn.` });
      const kMeld = zahlFormular({ klasse: 'k-melden', label: 'Euer Schlüssel K', knopf: 'K verdeckt an die Spielleitung melden', min: 0, max: 100, senden: (k) => ctx.aktion('k-melden', { k }), erfolg: 'Gemeldet – nur eure Lehrkraft sieht K.' });
      teile.push(
        h(
          'section',
          { class: 'funk-karte funk-dh', 'aria-labelledby': 'dh-titel' },
          h('h3', { id: 'dh-titel' }, 'Schlüsseltausch'),
          h('p', { class: 'feld' }, h('label', { for: 'geheimzahl' }, `Eure Geheimzahl ${buchstabe} (von der Karte)`), geheim),
          h('p', { class: 'text-2 klein' }, 'Eure Geheimzahl verlässt dieses Tablet nicht – sie wird nie gesendet.'),
          oeff.form,
          partnerWert,
          kMeld.form,
          meins
        )
      );
      alice = {
        aktualisiere(stand) {
          const a = stand.anzeigen || {};
          if (a.p) {
            for (const f of [oeff.feld, kMeld.feld]) f.max = String(a.p - 1);
          }
          const i = stand.ich || {};
          meins.textContent = i.oeffentlich !== null && i.oeffentlich !== undefined ? `Gesendet: ${gross} = ${i.oeffentlich}${i.k !== null && i.k !== undefined ? ` · gemeldet: K = ${i.k}` : ''}` : '';
          const w = kanalWerte(stand).get(rolle === 'alice' ? i.team.id : i.partner) || {};
          const anderes = rolle === 'alice' ? 'B' : 'A';
          partnerWert.textContent = w[anderes] !== null && w[anderes] !== undefined ? `Euer Partner-Team hat ${anderes} = ${w[anderes]} gesendet.` : `Noch kein ${anderes} von eurem Partner-Team.`;
        }
      };
    }
    if (rolle === 'eve') {
      const tbody = h('tbody');
      teile.push(
        h(
          'section',
          { class: 'funk-karte', 'aria-labelledby': 'eve-dh-titel' },
          h('h3', { id: 'eve-dh-titel' }, 'Mitgehört: p, g, A und B je Paar'),
          h('div', { class: 'scroll-x' }, h('table', { class: 'funk-dh-paare' }, h('caption', { class: 'sr' }, 'Öffentliche Werte je Paar'), h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Paar'), h('th', { scope: 'col' }, 'p'), h('th', { scope: 'col' }, 'g'), h('th', { scope: 'col' }, 'A'), h('th', { scope: 'col' }, 'B'), h('th', { scope: 'col' }, 'Euer Tipp für K'))), tbody))
        )
      );
      eve = {
        aktualisiere(stand) {
          const a = stand.anzeigen || {};
          const werte = kanalWerte(stand);
          const paare = (stand.teams || []).filter((t) => t.rolle === 'alice' && werte.has(t.id));
          abgleich(tbody, paare, {
            schluessel: (t) => `${stand.phase}-${t.id}`,
            baue: (t) => {
              const f = zahlFormular({ klasse: 'funk-tipp', label: `Tipp für das Paar ${t.name}`, knopf: 'Tipp abgeben', min: 0, max: (a.p || 101) - 1, senden: (k) => ctx.aktion('knacken', { paar: t.id, k }), erfolg: 'Tipp gespeichert – die Auflösung zeigt, ob er stimmt.' });
              f.form.setAttribute('data-paar', String(t.id));
              const tr = h('tr', null, h('th', { scope: 'row' }, t.name), h('td', { class: 'zahl dh-p' }), h('td', { class: 'zahl dh-g' }), h('td', { class: 'zahl dh-a' }), h('td', { class: 'zahl dh-b' }), h('td', null, f.form));
              tr._f = f;
              return tr;
            },
            aktualisiere: (tr, t) => {
              const w = werte.get(t.id) || {};
              const z = (sel, v) => (tr.querySelector(sel).textContent = v === null || v === undefined ? '–' : String(v));
              z('.dh-p', a.p);
              z('.dh-g', a.g);
              z('.dh-a', w.A);
              z('.dh-b', w.B);
              const tipp = ((stand.ich || {}).tipps || {})[t.id];
              if (tipp !== undefined && !tr._f.ergebnis.textContent) tr._f.ergebnis.textContent = `Euer Tipp: K = ${tipp}`;
            }
          });
        }
      };
    }
    const kanal = posteingang(ctx, { titel: 'Kanal (alle hören mit)', leer: 'Noch keine öffentlichen Werte.' });
    teile.push(kanal.element);
    if (uhr) teile.push(uhr.element);
    const element = h('div', { class: 'funk-szene-dh' }, teile);
    return {
      element,
      aktualisiere(stand) {
        const a = stand.anzeigen || {};
        param.textContent = a.p ? `Runde ${a.runde}: p = ${a.p}, g = ${a.g}` : 'Auflösung – die Lehrkraft zeigt die Ergebnisse am Beamer.';
        kanal.aktualisiere((stand.nachrichten || []).filter((n) => n.art === 'oeffentlich'));
        if (alice) alice.aktualisiere(stand);
        if (eve) eve.aktualisiere(stand);
        // Modulo-Uhr mit p und g der Runde (nur Reiter „uhr“ – keine Wertetabelle, E98)
        const v = ctx.voreinstellung('modulo');
        const key = v ? `${v.modul}-${v.g}` : null;
        if (uhr && v && key !== uhrFuer) {
          uhrFuer = key;
          uhr.oeffne({ ...v, a: v.g }); // Basis g auf der Uhr vorbelegt (Potenzieren wählen die Teams selbst)
        }
      },
      schliesse() {
        if (uhr) uhr.schliesse();
      }
    };
  });

  /* ---------- Szene „Mallory im Netz“ (W5 §9.3, Plan M7 Task 154, E96, E115) ---------- */

  const ZERT = Object.freeze({
    gueltig: { symbol: '✓', klasse: 'ok', text: () => 'Siegel gültig, Name passt' },
    fehlt: { symbol: '✗', klasse: 'falsch', text: () => 'kein gültiges Zertifikat' },
    name: { symbol: '✗', klasse: 'falsch', text: (z) => `Name passt nicht: ${z.text || ''}`.trim() },
    siegel: { symbol: '✗', klasse: 'falsch', text: () => 'Siegel ungültig' }
  });
  const ZERT_ART = Object.freeze({ keins: 'ohne Zertifikat', eigenes: 'mit eigenem Zertifikat (anderer Name)', veraendert: 'mit verändertem Zertifikat' });

  /** Knopf mit Rückmeldung in ergebnis: fn() → Promise */
  function aktionKnopf(klasse, text, fn, ergebnis, attrs = {}) {
    const k = h('button', { type: 'button', class: `knopf ${klasse}`, ...attrs }, text);
    k.addEventListener('click', async () => {
      k.disabled = true;
      try {
        const t = await fn();
        if (ergebnis && t) {
          ergebnis.className = 'funk-ergebnis ok';
          ergebnis.textContent = t;
        }
      } catch (e) {
        if (ergebnis) {
          ergebnis.className = 'funk-ergebnis fehler';
          ergebnis.textContent = fehlerText(e);
        }
      } finally {
        k.disabled = false;
      }
    });
    return k;
  }

  registriere('mallory', (ctx) => {
    const st = ctx.stand();
    const rolle = st.ich.rolle;
    const ich = () => ctx.stand().ich || {};
    const phase2 = () => ctx.stand().phase === 'mit-zertifikaten';
    const teile = [h('p', { class: 'rueckmeldung info funk-simulation' }, 'Simulation: Die Plattform verschließt die Umschläge – echte Kryptografie steckt hier nicht dahinter.')];
    const updates = [];

    if (rolle === 'alice') {
      const auftrag = h('p', { class: 'auftragskarte' });
      const angebote = h('ul', { class: 'schluessel-angebote' });
      const ergebnis = h('p', { class: 'funk-ergebnis', 'aria-live': 'polite' });
      teile.push(
        h('section', { class: 'funk-karte', 'aria-labelledby': 'auftrag-titel' }, h('h3', { id: 'auftrag-titel' }, 'Eure Auftragskarte (verdeckt)'), auftrag),
        h('section', { class: 'funk-karte', 'aria-labelledby': 'angebote-titel' }, h('h3', { id: 'angebote-titel' }, 'Empfangene Schlüssel'), h('p', { class: 'text-2 klein' }, 'Wählt einen Schlüssel, um euren Auftrag darin zu verschließen. Ab Phase 2 prüft euer Tablet Name und Siegel des Zertifikats.'), angebote, ergebnis)
      );
      updates.push(() => {
        auftrag.textContent = ich().auftrag || 'In dieser Phase gibt es keinen Auftrag.';
        abgleich(angebote, (ich().schluessel || []).slice().reverse(), {
          schluessel: (x) => x.nachricht,
          baue: (x) => {
            const li = h('li', { class: 'schluessel-angebot', 'data-nachricht': String(x.nachricht) });
            li._status = h('p', { class: 'zertifikat-status' });
            const senden = h('button', { type: 'button', class: 'knopf knopf-primaer umschlag-senden', 'data-etikett': x.etikett }, `Auftrag mit ${x.etikett} verschließen und senden`);
            senden.addEventListener('click', async () => {
              const z = li._x.zertifikat || { status: 'fehlt' };
              if (phase2() && z.status !== 'gueltig' && !(await AQ.bestaetigen('Ohne gültiges Zertifikat senden?', `Das Zertifikat für ${li._x.etikett} ist nicht grün geprüft. Wer den Schlüssel geschickt hat, ist nicht sicher.`, { ok: 'Trotzdem senden', gefahr: true }))) return;
              senden.disabled = true;
              try {
                await ctx.senden({ etikett: li._x.etikett });
                ergebnis.className = 'funk-ergebnis ok';
                ergebnis.textContent = `Umschlag für ${li._x.etikett} ist unterwegs.`;
              } catch (e) {
                ergebnis.className = 'funk-ergebnis fehler';
                ergebnis.textContent = fehlerText(e);
              } finally {
                senden.disabled = false;
              }
            });
            li.append(h('p', null, h('span', { class: 'mono' }, x.etikett), ` – angeblich von ${ctx.teamName(x.von)}`), li._status, senden);
            return li;
          },
          aktualisiere: (li, x) => {
            li._x = x;
            const z = x.zertifikat || { status: 'fehlt' };
            const d = ZERT[z.status] || ZERT.fehlt;
            const zeigen = phase2() || x.phase === 'mit-zertifikaten' || z.status === 'gueltig';
            li._status.className = `zertifikat-status ${zeigen ? d.klasse : 'neutral'}`;
            AQ.mount(li._status, zeigen ? [h('span', { class: 'zertifikat-symbol', 'aria-hidden': 'true' }, d.symbol), ' ', h('span', null, d.text(z))] : h('span', { class: 'text-2' }, 'Phase 1: Zertifikate gibt es noch nicht.'));
          }
        });
      });
    }

    let post = null;
    if (rolle === 'bob') {
      const nummer = h('p', { class: 'funk-bob-nummer' });
      const zert = h('p', { class: 'mono funk-bob-zertifikat' });
      const ergebnis = h('p', { class: 'funk-ergebnis', 'aria-live': 'polite' });
      const veroeff = aktionKnopf('knopf-primaer schluessel-veroeffentlichen', 'Schlüsselnummer veröffentlichen', async () => {
        await ctx.aktion('oeffentlich', {});
        return 'Veröffentlicht – die Nummer ist unterwegs zu eurem Alice-Team.';
      }, ergebnis);
      teile.push(h('section', { class: 'funk-karte', 'aria-labelledby': 'bob-titel' }, h('h3', { id: 'bob-titel' }, 'Euer Schlüssel'), nummer, zert, h('div', { class: 'knopf-reihe' }, veroeff), ergebnis));
      updates.push(() => {
        nummer.textContent = ich().etikett ? `Eure Schlüsselnummer: ${ich().etikett} (die Schlüsselkarte bleibt bei euch)` : 'Ihr habt keine Schlüsselnummer.';
        zert.textContent = ich().zertifikat ? `Euer Zertifikat: ${ich().zertifikat}` : phase2() ? 'Noch kein Zertifikat – fragt Trent (eure Lehrkraft).' : '';
      });
      post = posteingang(ctx, {
        titel: 'Eure Post',
        leer: 'Noch keine Umschläge.',
        kopf: (n) => `angeblich von ${ctx.teamName(n.angezeigtVon ?? n.von)}`,
        aktionen: (n) => {
          if (n.art !== 'nachricht' || !n.lesbar) return null;
          const erg = h('p', { class: 'funk-ergebnis', 'aria-live': 'polite' });
          return [
            aktionKnopf('knopf-zweit auftrag-melden', 'Auftrag melden', async () => {
              await ctx.aktion('empfangen', { nachricht: n.id });
              return 'Gemeldet – die Auflösung zeigt, ob es euer echter Auftrag war.';
            }, erg),
            erg
          ];
        }
      });
      teile.push(post.element);
    }

    if (rolle === 'mallory') {
      const etiketten = h('p', { class: 'funk-mallory-nummern' });
      const ergebnis = h('p', { class: 'funk-ergebnis', 'aria-live': 'polite' });
      const stationOl = h('ol', { class: 'station' });
      const stationLeer = h('p', { class: 'text-2' }, 'Gerade liegt nichts an eurer Station.');
      const bekannt = new Set(); // gesehene Schlüsselnummern (eigene und fremde)
      const sende = (body) => ctx.aktion('mallory', body);
      const alle = aktionKnopf('knopf-zweit alle-weiterleiten', 'Alle weiterleiten', async () => {
        const liste = (ich().station || []).map((x) => x.id);
        for (const id of liste) await sende({ aktion: 'weiterleiten', nachricht: id });
        return liste.length ? `${liste.length} Sendung(en) weitergeleitet.` : 'Nichts weiterzuleiten.';
      }, ergebnis);
      // Schlüssel unterschieben
      const an = h('select', { class: 'an', id: 'mallory-an' });
      const etikett = h('select', { class: 'etikett', id: 'mallory-etikett' });
      const zertArt = h('select', { class: 'zertifikat-art', id: 'mallory-zertifikat' });
      const unterErg = h('p', { class: 'funk-ergebnis', 'aria-live': 'polite' });
      const unter = h(
        'form',
        { class: 'schluessel-unterschieben funk-karte', novalidate: true },
        h('h3', null, 'Eigenen Schlüssel unterschieben'),
        h('p', { class: 'feld' }, h('label', { for: 'mallory-an' }, 'an das Alice-Team '), an),
        h('p', { class: 'feld' }, h('label', { for: 'mallory-etikett' }, 'eure Schlüsselnummer '), etikett),
        h('p', { class: 'feld' }, h('label', { for: 'mallory-zertifikat' }, 'Zertifikat '), zertArt),
        h('div', { class: 'knopf-reihe' }, h('button', { type: 'submit', class: 'knopf knopf-zweit' }, 'Als Bobs Schlüssel senden')),
        unterErg
      );
      unter.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        try {
          await sende({ aktion: 'schluessel', an: Number(an.value), etikett: etikett.value, zertifikat: zertArt.value });
          unterErg.className = 'funk-ergebnis ok';
          unterErg.textContent = `${etikett.value} ist unterwegs – angeblich von Bob.`;
        } catch (e) {
          unterErg.className = 'funk-ergebnis fehler';
          unterErg.textContent = fehlerText(e);
        }
      });
      teile.push(
        h('section', { class: 'funk-karte', 'aria-labelledby': 'station-titel' }, h('h3', { id: 'station-titel' }, 'Eure Station (Postamt)'), etiketten, stationLeer, stationOl, h('div', { class: 'knopf-reihe' }, alle), ergebnis),
        unter
      );
      const optionen = (sel, werte) => {
        const alt = sel.value;
        const neu = werte.map(([w]) => w).join(',');
        if ([...sel.options].map((o) => o.value).join(',') === neu) return;
        AQ.mount(sel, werte.map(([w, t]) => h('option', { value: String(w) }, t)));
        if (werte.some(([w]) => String(w) === alt)) sel.value = alt;
      };
      updates.push(() => {
        const eigene = ich().etiketten || [];
        for (const e of eigene) bekannt.add(e);
        for (const x of ich().station || []) if (x.art === 'schluessel' && /^S\d{2}$/.test(x.inhalt)) bekannt.add(x.inhalt);
        etiketten.textContent = `Eure Schlüsselnummern: ${eigene.join(', ') || '–'}`;
        optionen(an, (ctx.stand().teams || []).filter((t) => t.rolle === 'alice').map((t) => [t.id, t.name]));
        optionen(etikett, eigene.map((e) => [e, e]));
        optionen(zertArt, (phase2() ? ['keins', 'eigenes', 'veraendert'] : ['keins']).map((z) => [z, ZERT_ART[z]]));
        const liste = ich().station || [];
        stationLeer.hidden = liste.length > 0;
        abgleich(stationOl, liste, {
          schluessel: (x) => x.id,
          baue: (x) => {
            const li = h('li', { class: 'station-sendung', 'data-id': String(x.id), 'data-art': x.art });
            const erg = h('p', { class: 'funk-ergebnis', 'aria-live': 'polite' });
            const kopf = h('p', { class: 'klein text-2' }, `${x.art === 'schluessel' ? 'Schlüssel' : 'Umschlag'} angeblich von ${ctx.teamName(x.angezeigtVon)} an ${ctx.teamName(x.ziel)}`);
            const weiter = aktionKnopf('knopf-zweit weiterleiten', 'Unverändert weiterleiten', async () => {
              await sende({ aktion: 'weiterleiten', nachricht: x.id });
              return 'Weitergeleitet.';
            }, erg);
            const teile2 = [kopf, h('code', { class: 'funk-inhalt' }, x.lesbar ? x.inhalt : `${x.inhalt} – nicht euer Schlüssel, ihr könnt ihn nicht öffnen`)];
            if (x.art === 'schluessel') {
              const wahl = h('select', { class: 'etikett-ersetzen', 'aria-label': `Schlüsselnummer statt ${x.inhalt}` }, (ich().etiketten || []).map((e) => h('option', { value: e }, e)));
              teile2.push(h('div', { class: 'funk-zeile' }, wahl, aktionKnopf('knopf-zweit ersetzen', 'Nummer ersetzen', async () => {
                await sende({ aktion: 'ersetzen', nachricht: x.id, etikett: wahl.value });
                return `Ersetzt durch ${wahl.value}.`;
              }, erg)));
            } else if (x.lesbar) {
              const f = sendeFormular(ctx, { titel: null, knopf: 'Text übernehmen' });
              f.element.querySelector('.funk-senden-knopf').closest('.knopf-reihe').hidden = true;
              f.feld.value = x.inhalt;
              f.pruefe();
              const wahl = h('select', { class: 'neu-verschliessen', 'aria-label': 'Neu verschließen mit' }, [...bekannt].sort().map((e) => h('option', { value: e, selected: e === x.etikett }, e)));
              wahl.addEventListener('focus', () => {
                const alt = wahl.value;
                AQ.mount(wahl, [...bekannt].sort().map((e) => h('option', { value: e }, e)));
                wahl.value = alt;
              });
              teile2.push(
                f.element,
                h('p', { class: 'feld' }, h('span', null, 'neu verschließen mit '), wahl),
                aktionKnopf('knopf-primaer ersetzen', 'Ändern und weiterleiten', async () => {
                  const b = bereite(f.feld.value);
                  if (!b.gueltig) throw new Error('Nur A–Z, 0–9 und Leerzeichen');
                  const body = { aktion: 'ersetzen', nachricht: x.id };
                  if (b.text !== x.inhalt) body.text = b.text;
                  if (wahl.value !== x.etikett) body.etikett = wahl.value;
                  if (body.text === undefined && body.etikett === undefined) body.text = b.text;
                  await sende(body);
                  return 'Verändert und weitergeleitet.';
                }, erg)
              );
            }
            teile2.push(h('div', { class: 'knopf-reihe' }, weiter), erg);
            li.append(...teile2);
            return li;
          }
        });
      });
    }

    const element = h('div', { class: 'funk-szene-mallory' }, teile);
    return {
      element,
      aktualisiere(stand) {
        for (const f of updates) f();
        if (post) post.aktualisiere((stand.nachrichten || []).filter((n) => n.an === (stand.ich.team || {}).id && n.art === 'nachricht').map((n) => (n.lesbar ? n : { ...n, inhalt: `Umschlag für ${String(n.inhalt).replace(/^UMSCHLAG\s*/, '') || '?'} – du kannst ihn nicht öffnen.` })));
      },
      schliesse() {}
    };
  });

  /** Szene für den Typ bauen (registriert oder allgemein) */
  function zeige(typ, ctx) {
    const fabrik = SZENEN.get(typ) || allgemein;
    return fabrik(ctx);
  }

  return { registriere, zeige, rollenkarte, sendeFormular, posteingang, pruefFormular, abgleich, bereite, fehlerText, vor, chips, einbettung, reiterZuerst, ROLLEN_TEXTE, BEFEHLE, MAX };
})();
