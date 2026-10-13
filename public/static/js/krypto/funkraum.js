/* Kryptos – Seite /funkraum (TECHNIK §11.2, §12.4, Plan M7 Task 151): Kopf (Szenario, Rolle, Phase, Verbindung),
   Rollenkarte, Netz (KRNetz), Szene je Typ (KRFunkSzenen), Ticker. Polling über KRPoll auf /api/funk/<id>/stand
   (ETag/seit, Rückfall, Pause bei hidden). Leerzustände: kein Szenario, kein Team, Team spielt nicht mit; Pause sperrt
   die Eingaben, nach dem Beenden nur die Auswertung (Zahlen). Eingebettete Werkzeuge über KRLabor.oeffne mit
   umgebung.modus = 'funkraum' (E98); ein laufender Boss-Kampf sperrt sie. Texte nur als Textknoten, Lernende geduzt. */
'use strict';

const KRFunkraum = (() => {
  const { h } = AQ;
  const enc = encodeURIComponent;
  const INTERVALL = 2000;
  const LEER_KEIN = 'Gerade läuft in deinem Kurs kein Funkraum-Szenario. Deine Lehrkraft startet es im Unterricht.';
  const LEER_TEAM = 'Du bist keinem Team zugeteilt. Deine Lehrkraft teilt die Tischgruppen ein.';
  const NICHT_DABEI = 'Dein Team spielt diesmal nicht mit – schau auf den Beamer.';
  const BOSS = 'Während eines Boss-Kampfs sind die Werkzeuge gesperrt.';
  const SPALTE = Object.freeze({ runde: 'Runde', von: 'von', an: 'an', team: 'Team', paar: 'Paar', angekommen: 'angekommen', geknackt: 'geknackt', sekunden: 'Sekunden', besonderheit: 'Besonderheit', gesendet: 'gesendet', anteil: 'Anteil', fertig: 'fertig', platz: 'Platz', hinweise: 'Hinweise', abschnitt: 'Abschnitt', nullen: 'Bytes 000…', laenge: 'Länge', eveGewinnt: 'Eve gewinnt', kGleich: 'K gleich', eveRichtig: 'Eve richtig', eveSekunden: 'Eve Sekunden', phase: 'Phase', veraendert: 'verändert', ueberMallory: 'über Mallory', schluesselErsetzt: 'Schlüssel ersetzt', gemeldet: 'gemeldet', nachricht: 'Nachricht', a: 'Spruch A', b: 'Spruch B', je: 'je Runde', zeilen: 'Nachrichten', teams: 'Teams', sprueche: 'Funksprüche', vergleiche: 'Vergleiche' });
  const TEAM_SPALTEN = new Set(['team', 'von', 'an', 'paar']);
  /** Epoche je Szenario-Typ (= SZENARIEN[typ].welt, src/krypto/funkraum/szenarien.js) */
  const WELT = Object.freeze({ botenlauf: 0, wettknacken: 1, 'doppelter-schluessel': 3, schluesseltausch: 4, mallory: 5 });

  let poller = null;
  let warte = null; // Leerzustand: alle 20 s nachsehen, ob ein Szenario startet
  let haupt = null;
  let ansicht = null; // aufgebaute Ansicht für ein Szenario

  function stopp() {
    if (poller) poller.stopp();
    poller = null;
    clearInterval(warte);
    clearTimeout(warte);
    warte = null;
    if (ansicht) ansicht.schliesse();
    ansicht = null;
  }

  function leer(text, { nachsehen = false } = {}) {
    stopp();
    AQ.mount(
      haupt,
      h(
        'div',
        { class: 'wrap funkraum' },
        h('h1', null, 'Funkraum'),
        h('div', { class: 'leer-zustand', role: 'status' }, KR.symbol('icons', 'i-funk'), h('p', { class: 'leer-zustand-text' }, text), h('a', { class: 'knopf knopf-zweit', href: '/spiel#/' }, 'Zur Zeitleiste'))
      )
    );
    if (nachsehen) {
      warte = setInterval(() => {
        if (document.hidden === true) return;
        AQ.api('GET', '/api/funk')
          .then((d) => {
            if (d && d.szenario && d.team) lade();
          })
          .catch(() => {});
      }, 20000);
    }
  }

  /** Auswertung (nur Zahlen, ids, Codes) als Tabellen; Team-ids → Namen */
  function auswertungAnsicht(wert, teamName, titel = null) {
    const zelle = (key, v) => {
      if (v === null || v === undefined) return '–';
      if (typeof v === 'boolean') return v ? 'ja' : 'nein';
      if (TEAM_SPALTEN.has(key) && typeof v === 'number') return teamName(v);
      if (key === 'anteil' && typeof v === 'number') return KR.prozent(v);
      if (key === 'phase') return KRNetz.PHASE[v] || String(v);
      if (Array.isArray(v)) return v.length ? `${v.length} Einträge` : '–';
      if (typeof v === 'object') return Object.entries(v).map(([a, b]) => `${SPALTE[a] || a}: ${zelle(a, b)}`).join(' · ');
      return String(v);
    };
    if (Array.isArray(wert)) {
      const zeilen = wert.filter((x) => x && typeof x === 'object');
      if (!zeilen.length) return h('p', { class: 'text-2' }, 'Keine Einträge.');
      const spalten = [...new Set(zeilen.flatMap((z) => Object.keys(z)))].filter((s) => !['verlauf', 'weg', 'xor'].includes(s));
      return h('div', { class: 'scroll-x' }, h('table', { class: 'funk-auswertung' }, titel ? h('caption', null, titel) : null, h('thead', null, h('tr', null, spalten.map((s) => h('th', { scope: 'col' }, SPALTE[s] || s)))), h('tbody', null, zeilen.map((z) => h('tr', null, spalten.map((s) => h('td', null, zelle(s, z[s]))))))));
    }
    if (wert && typeof wert === 'object') {
      const teile = [];
      const einfach = [];
      for (const [key, v] of Object.entries(wert)) {
        if (Array.isArray(v)) teile.push(auswertungAnsicht(v, teamName, SPALTE[key] || key));
        else if (v && typeof v === 'object' && Object.values(v).every((x) => x && typeof x === 'object')) teile.push(auswertungAnsicht(Object.entries(v).map(([nr, x]) => ({ runde: Number(nr) || nr, ...x })), teamName, SPALTE[key] || key));
        else einfach.push(h('div', null, h('dt', null, SPALTE[key] || key), h('dd', null, zelle(key, v))));
      }
      return h('div', { class: 'funk-auswertung-teil' }, einfach.length ? h('dl', { class: 'funk-kennzahlen' }, einfach) : null, teile);
    }
    return h('p', { class: 'text-2' }, 'Keine Auswertung vorhanden.');
  }

  /** Ansicht eines Szenarios aufbauen; liefert { aktualisiere(stand), verbindung(z), schliesse() } */
  function baueAnsicht(szId) {
    const titel = h('h1', null, 'Funkraum');
    const rolleEl = h('p', { class: 'funk-rolle' });
    const phaseEl = h('p', { class: 'funk-phase' });
    const verbindungEl = h('p', { class: 'funk-verbindung text-2 klein', role: 'status' }, 'Verbunden.');
    const banner = h('div', { class: 'funk-banner' });
    const karteOrt = h('div', { class: 'funk-rollenkarte-ort' });
    const netzOrt = h('div', { class: 'funk-netz-ort' });
    const szeneOrt = h('div', { class: 'funk-szene' });
    const tickerOl = h('ol', { class: 'funk-ticker' });
    const ticker = KRNetz.ticker(tickerOl, { max: 12 });
    const tickerBereich = h('section', { class: 'funk-ticker-bereich', 'aria-labelledby': 'funk-ticker-titel' }, h('h2', { id: 'funk-ticker-titel' }, 'Ticker'), tickerOl);
    AQ.mount(
      haupt,
      h(
        'div',
        { class: 'wrap funkraum' },
        h('section', { class: 'funk-kopf', 'aria-labelledby': 'funk-h1' }, titel, rolleEl, phaseEl, verbindungEl),
        banner,
        h('div', { class: 'funk-raster' }, h('div', { class: 'funk-spalte-netz' }, netzOrt, karteOrt), h('div', { class: 'funk-spalte-szene' }, szeneOrt, tickerBereich))
      )
    );
    titel.setAttribute('id', 'funk-h1');

    let stand = null;
    let szene = null;
    let szeneArt = null; // 'szene' | 'nicht-dabei' | 'vorbereitung' | 'auswertung'
    let karteRolle = undefined;
    const werkzeuge = new Set();
    const teamName = (id) => {
      const t = stand && (stand.teams || []).find((x) => x.id === id);
      return t ? t.name : id === null || id === undefined ? '–' : `Team ${id}`;
    };
    const nachricht = (id) => (stand && (stand.nachrichten || []).find((n) => n.id === id)) || null;
    // Pause, Vorbereitung, Auswertung – und die Auflösung: dann prüft der Server nichts mehr (409, Review M7 W1)
    const gesperrt = () => !!stand && (stand.status !== 'laeuft' || stand.phase === 'aufloesung');

    async function nachAktion() {
      if (poller) await poller.jetzt();
    }

    const ctx = {
      id: szId,
      stand: () => stand,
      teamName,
      nachricht,
      gesperrt,
      async senden(body) {
        const r = await AQ.api('POST', `/api/funk/${enc(szId)}/nachrichten`, body);
        await nachAktion();
        return r;
      },
      async aktion(pfad, body, methode = 'POST') {
        const r = await AQ.api(methode, `/api/funk/${enc(szId)}/${pfad}`, body === undefined ? {} : body);
        await nachAktion();
        return r;
      },
      /** eingebettetes Labor-Werkzeug (E98); im Boss-Kampf nur der Hinweis */
      werkzeug(id, voreinstellung, container, umgebungExtra = {}) {
        const rahmen = container.classList && container.classList.contains('funk-werkzeug') ? container : null;
        if (rahmen) rahmen.setAttribute('data-werkzeug', id);
        if (stand && stand.boss) {
          AQ.mount(container, h('p', { class: 'leer-zustand-text text-2' }, BOSS));
          return null;
        }
        const steuer = KRLabor.oeffne(id, voreinstellung || {}, container, { modus: 'funkraum', rolle: 'schueler', ...umgebungExtra });
        werkzeuge.add(steuer);
        return steuer;
      },
      /** Werkzeug-Rahmen div.funk-werkzeug[data-werkzeug] mit Überschrift */
      werkzeugRahmen(id, titel) {
        const w = KRLabor.werkzeug(id);
        const innen = h('div', { class: 'funk-werkzeug-innen' });
        const el = h('section', { class: 'funk-werkzeug', 'data-werkzeug': id, 'data-epoche': w ? String(w.welt) : null }, h('h3', null, titel || (w ? w.titel : 'Werkzeug')), innen);
        return { element: el, innen };
      },
      /** Werkzeug der Rolle aus stand.werkzeuge */
      voreinstellung(id) {
        const w = ((stand && stand.werkzeuge) || []).find((x) => x.id === id);
        return w ? w.voreinstellung || {} : null;
      },
      melde(text) {
        AQ.toast(text);
      }
    };

    function schliesseSzene() {
      for (const w of werkzeuge) {
        try {
          w.schliesse();
        } catch {
          /* weiter */
        }
      }
      werkzeuge.clear();
      if (szene && typeof szene.schliesse === 'function') szene.schliesse();
      szene = null;
    }

    function sperreEingaben(an) {
      for (const el of szeneOrt.querySelectorAll('button, input, select, textarea')) {
        if (an) {
          if (!el.disabled) {
            el.disabled = true;
            el.setAttribute('data-pause', '1');
          }
        } else if (el.getAttribute('data-pause')) {
          el.removeAttribute('data-pause');
          el.disabled = false;
        }
      }
    }

    function kopf() {
      const ich = stand.ich || {};
      if (WELT[stand.typ] !== undefined) {
        KR.epoche(WELT[stand.typ]);
        KRKopf.epoche(`Funkraum · ${KR.WELTEN_KURZ[WELT[stand.typ]]}`);
      }
      document.title = `${stand.titel || 'Funkraum'} · Funkraum · Kryptos`;
      titel.textContent = stand.titel || 'Funkraum';
      const team = ich.team ? ich.team.name : '';
      AQ.mount(rolleEl, ich.rolle ? ['Ihr seid ', h('strong', null, KRNetz.ROLLE[ich.rolle] || ich.rolle), ` – ${team}`] : [team ? `${team} · ` : '', 'ohne Rolle']);
      const phasen = (stand.phasen || []).filter((p) => p !== 'aufloesung');
      const i = phasen.indexOf(stand.phase);
      const phaseText = KRNetz.PHASE[stand.phase] || stand.phase;
      phaseEl.textContent = `${stand.status === 'vorbereitung' ? 'Vorbereitung' : `Phase: ${phaseText}${i >= 0 && phasen.length > 1 ? ` (${i + 1} von ${phasen.length})` : ''}`} · ${KRNetz.STATUS[stand.status] || stand.status}`;
    }

    function bannerZeigen() {
      const ich = stand.ich || {};
      const teile = [];
      if (stand.status === 'pausiert') teile.push(h('div', { class: 'rueckmeldung info funk-pause', role: 'status' }, h('p', null, 'Pause – deine Lehrkraft hat den Funkraum angehalten.')));
      else if (stand.status === 'laeuft' && stand.phase === 'aufloesung') teile.push(h('div', { class: 'rueckmeldung info funk-aufloesung', role: 'status' }, h('p', null, 'Auflösung – schaut auf den Beamer. Gesendet und geprüft wird jetzt nichts mehr.')));
      if (ich.stummBis && Date.parse(ich.stummBis) > Date.now()) teile.push(h('div', { class: 'rueckmeldung info funk-stumm', role: 'status' }, h('p', null, `Euer Team ist bis ${new Date(ich.stummBis).toLocaleTimeString('de-DE')} stummgeschaltet.`)));
      if (stand.boss) teile.push(h('div', { class: 'rueckmeldung info', role: 'status' }, h('p', null, BOSS)));
      AQ.mount(banner, teile);
    }

    function aktualisiere(neu) {
      stand = neu;
      kopf();
      bannerZeigen();
      // Rollenkarte nur beim Wechsel neu
      const rolle = (stand.ich && stand.ich.rolle) || null;
      if (rolle !== karteRolle) {
        karteRolle = rolle;
        AQ.mount(karteOrt, rolle ? KRFunkSzenen.rollenkarte(stand.typ, rolle) : null);
      }
      // Netz (eigenes Team mit Partner, damit die Paarlinie erscheint)
      const ich = stand.ich || {};
      const teams = (stand.teams || []).map((t) => (ich.team && t.id === ich.team.id ? { ...t, partner: ich.partner } : t));
      const mitte = stand.typ === 'mallory' ? ((teams.find((t) => t.rolle === 'mallory') || {}).id ?? null) : null;
      if (stand.status !== 'auswertung') KRNetz.zeichne(netzOrt, { teams, nachrichten: stand.nachrichten || [], ich, ansicht: 'tablet', mitte });
      else AQ.clear(netzOrt);
      // Szene
      let art = 'szene';
      if (stand.status === 'auswertung') art = 'auswertung';
      else if (!rolle) art = 'nicht-dabei';
      else if (stand.status === 'vorbereitung') art = 'vorbereitung';
      if (art !== szeneArt) {
        schliesseSzene();
        szeneArt = art;
        if (art === 'auswertung') {
          AQ.mount(
            szeneOrt,
            h('section', { class: 'funk-auswertung-bereich', 'aria-labelledby': 'funk-auswertung-titel' }, h('h2', { id: 'funk-auswertung-titel' }, 'Auswertung'), h('p', { class: 'rueckmeldung info' }, 'Das Szenario ist beendet. Alle Nachrichten wurden gelöscht.'), auswertungAnsicht(stand.auswertung, teamName))
          );
        } else if (art === 'nicht-dabei') {
          AQ.mount(szeneOrt, h('div', { class: 'leer-zustand', role: 'status' }, KR.symbol('icons', 'i-funk'), h('p', { class: 'leer-zustand-text' }, NICHT_DABEI)));
        } else if (art === 'vorbereitung') {
          AQ.mount(szeneOrt, h('div', { class: 'leer-zustand', role: 'status' }, KR.symbol('icons', 'i-funk'), h('p', { class: 'leer-zustand-text' }, 'Deine Lehrkraft bereitet das Szenario vor. Lest schon einmal eure Rollenkarte.')));
        } else {
          szene = KRFunkSzenen.zeige(stand.typ, ctx);
          AQ.mount(szeneOrt, szene.element);
        }
      }
      if (szene) {
        sperreEingaben(false);
        szene.aktualisiere(stand);
        if (gesperrt()) sperreEingaben(true);
      }
      if (stand.boss && werkzeuge.size) KRLabor.sperreAlle('boss');
      // Ticker (nach dem Beenden ausgeblendet – übrig ist nur die Auswertung)
      tickerBereich.hidden = stand.status === 'auswertung';
      ticker.neu((stand.ereignisse || []).map((e) => ({ id: e.id, text: KRNetz.ereignisText(e, { teamName, nachricht }) })));
      KRKopf.funkPunkt(stand.status === 'laeuft' || stand.status === 'pausiert');
    }

    function verbindung(z) {
      verbindungEl.textContent = z === 'gestoert' ? 'Verbindung unterbrochen – wird wiederhergestellt' : 'Verbunden.';
      verbindungEl.classList.toggle('gestoert', z === 'gestoert');
    }

    return {
      aktualisiere,
      verbindung,
      schliesse() {
        ticker.stopp();
        schliesseSzene();
      }
    };
  }

  async function lade() {
    stopp();
    let d;
    try {
      d = await AQ.api('GET', '/api/funk');
    } catch (e) {
      // Grenze 6 je Minute (TECHNIK §13.2): kurz warten und erneut versuchen statt einer Fehlerseite
      if (e && e.status === 429) {
        leer('Der Funkraum ist gerade sehr gefragt – gleich geht es weiter.');
        warte = setTimeout(lade, 10000);
        return;
      }
      KR.fehler(haupt, e, { zurueck: { href: '/spiel#/', text: 'Zur Zeitleiste' } });
      return;
    }
    if (!d || !d.szenario) return leer(LEER_KEIN, { nachsehen: true });
    if (!d.team) return leer(LEER_TEAM);
    const id = d.szenario.id;
    ansicht = baueAnsicht(id);
    const meine = ansicht;
    poller = KRPoll.starte({
      url: (seit) => `/api/funk/${enc(id)}/stand?seit=${enc(seit)}`,
      intervall: INTERVALL,
      mischen: true,
      beiDaten: (stand) => {
        if (ansicht === meine) meine.aktualisiere(stand);
      },
      beiZustand: (z, fehler) => {
        if (ansicht !== meine) return;
        if (z === 'ende') {
          if (fehler && fehler.status === 403) return leer(fehler.message || LEER_TEAM);
          return leer('Das Szenario wurde geschlossen. Deine Lehrkraft startet bei Bedarf ein neues.', { nachsehen: true });
        }
        meine.verbindung(z);
      }
    });
  }

  async function start() {
    haupt = document.getElementById('haupt');
    try {
      const sitzung = await AQ.api('GET', '/api/sitzung');
      KRKopf.baue({ rolle: sitzung.rolle, aktiv: 'funkraum', sitzung });
      if (sitzung.rolle !== 'schueler') {
        AQ.mount(haupt, h('div', { class: 'wrap funkraum' }, h('h1', null, 'Funkraum'), h('div', { class: 'leer-zustand' }, KR.symbol('icons', 'i-funk'), h('p', null, 'Den Funkraum steuern Sie im Lehrkraft-Bereich (Kurs → Tab „Funkraum“).'), h('a', { class: 'knopf knopf-zweit', href: '/lehrer#/' }, 'Zur Kursübersicht'))));
        return;
      }
    } catch (e) {
      KR.fehler(haupt, e, { zurueck: { href: '/spiel#/', text: 'Zur Zeitleiste' } });
      return;
    }
    await lade();
  }
  document.addEventListener('DOMContentLoaded', start);
  return { start, stopp, lade };
})();
