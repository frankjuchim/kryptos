/* Kryptos – Netz-Grafik KRNetz für Funkraum-Tablet und Beamer (DESIGNSYSTEM §5, Plan M7 Tasks 151, 155): Teams als
   Knoten im Kreis (nach nr; Mallory in der Mitte), Linien je Paar bzw. zu Mallorys Station, Nachrichten als Punkte auf
   den Linien (unterwegs/angekommen/geknackt – je mit Symbol, nie nur Farbe), Eve/Mallory mit --fehler-Umriss (gestrichelt)
   und Rollenname. Daneben immer eine Tabelle als Alternative (Team · Rolle · gesendet · empfangen). Neue Nachrichten
   „fliegen“ 800 ms vom Absender (nur ohne AQ.ruhig()). Dazu die Ticker-Texte der Ereignis-Codes (Funkraum und Beamer).
   Nur SVG-Attribute und CSS-Klassen; Werte per CSSOM nur als Custom Properties. */
'use strict';

const KRNetz = (() => {
  const { h, s } = AQ;
  const ROLLE = Object.freeze({ alice: 'Alice', bob: 'Bob', eve: 'Eve', mallory: 'Mallory', knacker: 'Knack-Team' });
  const SONDER = new Set(['eve', 'mallory']);
  const PHASE = Object.freeze({
    'runde-1': 'Runde 1',
    'runde-2': 'Runde 2',
    'runde-3': 'Runde 3',
    aufloesung: 'Auflösung',
    knacken: 'Knacken',
    funken: 'Funken',
    lauschen: 'Lauschen',
    'ohne-zertifikate': 'Phase 1 – ohne Zertifikate',
    'mit-zertifikaten': 'Phase 2 – mit Zertifikaten'
  });
  const STATUS = Object.freeze({ vorbereitung: 'Vorbereitung', laeuft: 'läuft', pausiert: 'Pause', auswertung: 'beendet' });
  const ZUSTAND = Object.freeze({ unterwegs: ['unterwegs', '→'], angekommen: ['angekommen', '✓'], geknackt: ['geknackt', '!'] });
  const MASS = Object.freeze({ tablet: { b: 400, h: 300, r: 22, kreis: 108 }, beamer: { b: 960, h: 540, r: 40, kreis: 205 } });
  const PRO_LINIE = 5; // höchstens so viele Punkte je Richtung (die neuesten)
  const gesehen = new WeakMap(); // ziel → Set der schon gezeichneten Nachrichten-ids (für „fliegt“)

  /** „Team Skytale“ → „Skytale“ (Knotenbeschriftung) */
  const kurz = (name) => String(name || '').replace(/^Team\s+/, '');

  /** Sekunden → „1:10 min“ */
  function dauer(sek) {
    const n = Math.max(0, Math.round(Number(sek) || 0));
    return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')} min`;
  }

  /** Zustand einer Nachricht */
  const zustandVon = (n) => (n.geknackt ? 'geknackt' : n.angekommen ? 'angekommen' : 'unterwegs');

  /** Knotenpositionen: Kreis nach nr, mitte (Mallory) im Zentrum */
  function positionen(teams, mitte, m) {
    const pos = new Map();
    const cx = m.b / 2;
    const cy = m.h / 2;
    const ring = teams.filter((t) => t.id !== mitte);
    ring.forEach((t, i) => {
      const w = -Math.PI / 2 + (2 * Math.PI * i) / Math.max(1, ring.length);
      pos.set(t.id, { x: Math.round(cx + m.kreis * 1.35 * Math.cos(w)), y: Math.round(cy + m.kreis * Math.sin(w)) });
    });
    if (mitte !== null && mitte !== undefined && teams.some((t) => t.id === mitte)) pos.set(mitte, { x: cx, y: cy });
    return pos;
  }

  /**
   * Netz zeichnen (ersetzt den Inhalt von ziel).
   * @param {Element} ziel
   * @param {{ teams: object[], nachrichten: object[], ich?: object|null, ansicht?: 'tablet'|'beamer', mitte?: number|null,
   *           vorschau?: boolean }} o  vorschau: Geheimtext-Vorschau am neuesten Punkt je Linie (Beamer)
   * @returns {{ element: SVGElement, tabelle: HTMLTableElement }}
   */
  function zeichne(ziel, o) {
    const ansicht = o.ansicht === 'beamer' ? 'beamer' : 'tablet';
    const m = MASS[ansicht];
    const teams = (o.teams || []).filter((t) => t.rolle).slice().sort((a, b) => a.nr - b.nr);
    const ichId = o.ich && o.ich.team ? o.ich.team.id : null;
    const mitte = o.mitte ?? null;
    const pos = positionen(teams, mitte, m);
    const nachName = new Map((o.teams || []).map((t) => [t.id, t.name]));
    const nachrichten = (o.nachrichten || []).filter((n) => pos.has(n.von) && pos.has(n.an));
    const alt = gesehen.get(ziel);
    const erstes = !alt;
    const schonDa = alt || new Set();
    const bewegt = !erstes && !AQ.ruhig();

    // Linien: Paare (Alice ↔ Bob) und – mit Mitte – jedes Team zur Station
    const linien = [];
    const linie = (a, b) => {
      const key = [a, b].sort((x, y) => x - y).join('-');
      if (!linien.some((l) => l.key === key)) linien.push({ key, a, b });
    };
    if (mitte !== null && pos.has(mitte)) for (const t of teams) if (t.id !== mitte) linie(t.id, mitte);
    for (const t of teams) if (t.partner && pos.has(t.partner)) linie(t.id, t.partner);
    for (const n of nachrichten) linie(n.von, n.an);

    const elemente = [];
    for (const l of linien) {
      const p = pos.get(l.a);
      const q = pos.get(l.b);
      elemente.push(s('line', { class: 'netz-linie', x1: p.x, y1: p.y, x2: q.x, y2: q.y }));
    }

    // Nachrichten je Richtung, die neuesten PRO_LINIE
    const jeRichtung = new Map();
    for (const n of nachrichten) {
      const key = `${n.von}>${n.an}`;
      if (!jeRichtung.has(key)) jeRichtung.set(key, []);
      jeRichtung.get(key).push(n);
    }
    const punkte = [];
    const texte = [];
    for (const liste of jeRichtung.values()) {
      const neueste = liste.slice(-PRO_LINIE);
      neueste.forEach((n, i) => {
        const p = pos.get(n.von);
        const q = pos.get(n.an);
        const z = zustandVon(n);
        const basis = z === 'angekommen' ? 0.78 : 0.5;
        const t = Math.min(0.9, Math.max(0.15, basis - (neueste.length - 1 - i) * 0.07));
        // Richtung: leicht neben der Linie (Hin- und Rückweg getrennt)
        const dx = q.x - p.x;
        const dy = q.y - p.y;
        const laenge = Math.hypot(dx, dy) || 1;
        const versatz = m.r * 0.28;
        const x = Math.round(p.x + dx * t + (-dy / laenge) * versatz);
        const y = Math.round(p.y + dy * t + (dx / laenge) * versatz);
        const [klasse, symbol] = ZUSTAND[z];
        const fliegt = bewegt && !schonDa.has(n.id);
        const kreis = s(
          'circle',
          { class: `nachricht ${klasse}${n.ausgeblendet ? ' ausgeblendet' : ''}${fliegt ? ' fliegt' : ''}`, cx: x, cy: y, r: Math.round(m.r * 0.32), 'data-id': String(n.id) },
          s('title', null, `Nachricht von ${nachName.get(n.von) || 'Team'} an ${nachName.get(n.an) || 'Team'}: ${klasse}`)
        );
        if (fliegt) {
          kreis.style.setProperty('--dx', `${p.x - x}px`);
          kreis.style.setProperty('--dy', `${p.y - y}px`);
        }
        punkte.push(kreis);
        texte.push(s('text', { class: `nachricht-symbol ${klasse}`, x: x + Math.round(m.r * 0.42), y: y - Math.round(m.r * 0.3), 'aria-hidden': 'true' }, symbol));
        if (o.vorschau && i === neueste.length - 1 && n.inhalt) {
          const vorschau = String(n.inhalt).length > 14 ? `${String(n.inhalt).slice(0, 14)}…` : String(n.inhalt);
          texte.push(s('text', { class: 'nachricht-vorschau', x, y: y + Math.round(m.r * 0.95), 'text-anchor': 'middle' }, vorschau));
        }
      });
    }

    // Knoten
    const knoten = teams.map((t) => {
      const p = pos.get(t.id);
      const sonder = SONDER.has(t.rolle);
      const ich = t.id === ichId;
      return s(
        'g',
        { class: `knoten rolle-${t.rolle}${sonder ? ' sonder' : ''}${ich ? ' ich' : ''}`, 'data-team': String(t.id) },
        s('circle', { class: 'knoten-kreis', cx: p.x, cy: p.y, r: m.r }),
        s('text', { class: 'knoten-nr', x: p.x, y: p.y, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, sonder ? (t.rolle === 'eve' ? '◉' : '✂') : String(t.nr)),
        s('text', { class: 'knoten-name', x: p.x, y: p.y + m.r + Math.round(m.r * 0.6), 'text-anchor': 'middle' }, kurz(t.name) + (ich ? ' (ihr)' : '')),
        s('text', { class: 'knoten-rolle', x: p.x, y: p.y + m.r + Math.round(m.r * 1.15), 'text-anchor': 'middle' }, ROLLE[t.rolle] || t.rolle)
      );
    });

    for (const n of nachrichten) schonDa.add(n.id);
    gesehen.set(ziel, schonDa);

    const label = `Netz: ${teams.length} Teams, ${nachrichten.length} Nachrichten – Einzelheiten in der Tabelle darunter.`;
    const svg = s('svg', { class: `funk-netz netz-${ansicht}`, viewBox: `0 0 ${m.b} ${m.h}`, role: 'img', 'aria-label': label, focusable: 'false' }, s('g', { class: 'netz-linien' }, elemente), s('g', { class: 'netz-knoten' }, knoten), s('g', { class: 'netz-nachrichten' }, punkte, texte));

    // Tabelle als Alternative
    const zeilen = teams.map((t) =>
      h(
        'tr',
        { class: t.id === ichId ? 'ich' : null },
        h('th', { scope: 'row' }, t.name + (t.id === ichId ? ' (ihr)' : '')),
        h('td', null, ROLLE[t.rolle] || t.rolle),
        h('td', { class: 'zahl' }, String(nachrichten.filter((n) => n.von === t.id).length)),
        h('td', { class: 'zahl' }, String(nachrichten.filter((n) => n.an === t.id).length))
      )
    );
    const tabelle = h(
      'table',
      { class: 'funk-netz-tabelle' },
      h('caption', { class: 'sr' }, 'Teams im Netz'),
      h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Team'), h('th', { scope: 'col' }, 'Rolle'), h('th', { scope: 'col' }, 'gesendet'), h('th', { scope: 'col' }, 'empfangen'))),
      h('tbody', null, zeilen)
    );
    AQ.mount(ziel, svg, h('details', { class: 'funk-netz-details' }, h('summary', null, 'Netz als Tabelle'), h('div', { class: 'scroll-x' }, tabelle)));
    return { element: svg, tabelle };
  }

  /**
   * Ticker-Text eines Ereignisses oder null (nicht anzeigen).
   * @param {{ code: string, daten: object }} e
   * @param {{ teamName: (id) => string, nachricht?: (id) => object|null, ich?: number|null }} k
   */
  function ereignisText(e, k) {
    const d = e.daten || {};
    const name = (id) => (k && typeof k.teamName === 'function' ? k.teamName(id) : `Team ${id}`);
    const n = d.nachricht !== undefined && k && typeof k.nachricht === 'function' ? k.nachricht(d.nachricht) : null;
    switch (e.code) {
      case 'status':
        return d.status === 'laeuft' ? 'Das Szenario läuft.' : d.status === 'pausiert' ? 'Pause – die Lehrkraft hat den Funkraum angehalten.' : d.status === 'auswertung' ? 'Das Szenario ist beendet.' : null;
      case 'phase':
        return `Neue Phase: ${PHASE[d.phase] || d.phase}.`;
      case 'gesendet':
        return `${name(d.von)} hat ${n && n.art === 'oeffentlich' ? 'einen öffentlichen Wert' : n && n.art === 'schluessel' ? 'einen Schlüssel' : 'eine Nachricht'} an ${name(d.an)} gesendet.`;
      case 'angekommen':
        return `${name(d.team)} hat eine Nachricht entschlüsselt.`;
      case 'geknackt':
        return `${name(d.team)} hat eine Nachricht${n ? ` von ${name(n.angezeigtVon ?? n.von)}` : ''} geknackt (nach ${dauer(d.sekunden)}).`;
      case 'ausgeblendet':
        return 'Die Lehrkraft hat eine Nachricht ausgeblendet.';
      case 'stumm':
        return `${name(d.team)} ist für ${d.sekunden} Sekunden stummgeschaltet.`;
      case 'hinweis':
        return `Hinweis ${d.nr} der Lehrkraft ist da.`;
      case 'fertig':
        return `${name(d.team)} ist fertig – Platz ${d.platz}!`;
      case 'k-gemeldet':
        return `${name(d.team)} hat K verdeckt gemeldet.`;
      case 'tipp':
        return `Eve hat einen Tipp für das Paar ${name(d.paar)} abgegeben.`;
      case 'weitergeleitet':
        return 'Mallory hat eine Sendung weitergeleitet.';
      case 'ersetzt':
        return 'Mallory hat eine Sendung verändert.';
      case 'zertifikat':
        return `Trent hat das Zertifikat von ${name(d.team)} bearbeitet.`;
      case 'gemeldet':
        return `${name(d.team)} hat den Auftrag gemeldet.`;
      default:
        // fortschritt (eigene Balken), oeffentlich (= gesendet), sonderkarte (verdeckt): kein Tickertext
        return null;
    }
  }

  /**
   * Gedrosselter Ticker (aria-live höchstens eine Ansage je 5 s): neue Einträge erscheinen gesammelt; der erste Aufbau ist
   * still (aria-live erst danach).
   * @param {HTMLOListElement} ol
   * @param {{ max?: number, abstand?: number }} o
   * @returns {{ neu(eintraege: { id, text }[]): void, stopp(): void }}
   */
  function ticker(ol, { max = 12, abstand = 5000 } = {}) {
    const bekannt = new Set();
    let schlange = [];
    let letzte = -Infinity;
    let timer = null;
    let erster = true;
    function haenge(liste) {
      for (const x of liste) ol.insertBefore(h('li', { class: 'ticker-eintrag' }, x.text), ol.firstChild);
      while (ol.children.length > max) ol.removeChild(ol.lastChild);
    }
    function flush() {
      timer = null;
      if (!schlange.length) return;
      haenge(schlange);
      schlange = [];
      letzte = Date.now();
    }
    return {
      neu(eintraege) {
        const frisch = eintraege.filter((x) => x && x.text && !bekannt.has(x.id));
        for (const x of frisch) bekannt.add(x.id);
        if (erster) {
          erster = false;
          haenge(frisch.slice(-max));
          ol.setAttribute('aria-live', 'polite');
          return;
        }
        if (!frisch.length) return;
        schlange.push(...frisch);
        const warten = letzte + abstand - Date.now();
        if (warten <= 0) flush();
        else if (!timer) timer = setTimeout(flush, warten);
      },
      stopp() {
        clearTimeout(timer);
        timer = null;
      }
    };
  }

  return { zeichne, ereignisText, ticker, dauer, ROLLE, PHASE, STATUS };
})();
