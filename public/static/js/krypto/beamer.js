/* Kryptos – Beamer-Ansicht /beamer/funkraum/:id und /beamer/arena/:id (DESIGNSYSTEM §5, TECHNIK §11.1, Plan M7 Task 155,
   E99, E114): Nacht-Vollbild ohne Kopfzeile. Funkraum: KRPoll auf den Lehrkraft-Stand mit ?ansicht=beamer (verdeckt bis zur
   Auflösung, E99), Netz (KRNetz, Ansicht beamer, Geheimtext-Vorschau), Ticker (letzte 8, gedrosselt), QR-Code zum
   Funkraum, Pause-Banner und je Szenario Fortschritt bzw. Auflösung. Arena (Task 158, E103): KRPoll auf
   /api/lehrer/arena/<id>/beamer (2 s, ETag/304), Karten je Team (nie Beschreibung oder Beurteilung), Ticker der Erfolge,
   Restzeit-Uhr bis angriffBis, QR-Code zur Werkstatt.
   Texte nur als Textknoten; Werte per CSSOM nur als Custom Properties. */
'use strict';

const KRBeamer = (() => {
  const { h, s } = AQ;
  const TITEL = { funkraum: 'Funkraum', arena: 'Knack-Arena' };
  const WELT = Object.freeze({ botenlauf: 0, wettknacken: 1, 'doppelter-schluessel': 3, schluesseltausch: 4, mallory: 5 });
  const KARTEN = Object.freeze({ doppelt: 'zweimal Caesar', zaun: 'Gartenzaun 3' });
  const INTERVALL = 2000;
  let poller = null;
  let ticker = null;
  let uhr = null; // Restzeit der Arena

  /** Art und id aus dem Pfad: { art: 'funkraum'|'arena'|null, id } */
  function art(pfad = location.pathname) {
    const m = /^\/beamer\/(funkraum|arena)\/\d+$/.exec(pfad);
    return m ? m[1] : null;
  }
  const idAusPfad = (pfad = location.pathname) => (/\/(\d+)$/.exec(pfad) || [])[1] || null;

  function stopp() {
    if (poller) poller.stopp();
    poller = null;
    if (ticker) ticker.stopp();
    ticker = null;
    clearInterval(uhr);
  }

  function leer(haupt, titel, text = 'Kein laufendes Szenario.') {
    AQ.mount(
      haupt,
      h(
        'div',
        { class: 'beamer-flaeche' },
        h('div', { class: 'beamer-titel' }, KR.symbol('icons', 'logo-ring'), h('h1', null, titel)),
        h('div', { class: 'leer-zustand' }, KR.ornament(6), h('p', null, text), h('a', { class: 'knopf knopf-zweit', href: '/lehrer#/' }, 'Zurück zur Lehrkraft-Ansicht'))
      )
    );
  }

  const ja = (b) => (b ? '✓ ja' : '✗ nein');
  const tabelle = (klasse, caption, kopf, zeilen) =>
    h('div', { class: 'scroll-x' }, h('table', { class: `beamer-tabelle ${klasse}` }, h('caption', null, caption), h('thead', null, h('tr', null, kopf.map((k) => h('th', { scope: 'col' }, k)))), h('tbody', null, zeilen)));

  /* ---------- je Szenario ---------- */

  function botenlauf(st, name) {
    const a = st.anzeigen || {};
    const aus = st.auswertung || a.auswertung;
    if (!aus || !Array.isArray(aus.zeilen)) return a.runde ? h('p', { class: 'beamer-gross' }, `Runde ${a.runde} von 3`) : null;
    const zeilen = aus.zeilen.map((z) => h('tr', null, h('td', null, z.runde === null ? '–' : String(z.runde)), h('td', null, name(z.von)), h('td', null, ja(z.geknackt)), h('td', null, z.sekunden === null || z.sekunden === undefined ? '–' : KRNetz.dauer(z.sekunden)), h('td', null, KARTEN[z.besonderheit] || '–')));
    return h('div', { class: 'beamer-typ' }, tabelle('beamer-auswertung', 'Auflösung: Welche Nachricht war wie schnell geknackt?', ['Runde', 'Absender', 'geknackt', 'Zeit', 'Besonderheit'], zeilen), a.merksatz ? h('p', { class: 'beamer-merksatz' }, a.merksatz) : null);
  }

  function kurven(verlauf, name, reihenfolge) {
    const teams = reihenfolge.filter((id) => Array.isArray(verlauf[id]) && verlauf[id].length);
    const maxS = Math.max(60, ...teams.flatMap((id) => verlauf[id].map((p) => p.s)));
    const x = (sek) => Math.round(40 + (sek / maxS) * 540);
    const y = (anteil) => Math.round(190 - anteil * 170);
    return s(
      'svg',
      { class: 'beamer-kurven', viewBox: '0 0 640 210', role: 'img', 'aria-label': `Fortschrittskurven von ${teams.length} Teams` },
      s('line', { class: 'kurve-ziel', x1: 40, x2: 580, y1: y(0.95), y2: y(0.95) }),
      s('text', { class: 'kurve-text', x: 586, y: y(0.95) + 4 }, '95 %'),
      s('line', { class: 'kurve-achse', x1: 40, x2: 580, y1: 190, y2: 190 }),
      teams.map((id, i) => {
        const pkt = verlauf[id].map((p) => `${x(p.s)},${y(p.anteil)}`);
        const letzter = verlauf[id][verlauf[id].length - 1];
        return s('g', { class: `kurve muster-${reihenfolge.indexOf(id) % 4}` }, s('polyline', { points: (pkt.length === 1 ? [`${x(0)},${y(0)}`, ...pkt] : pkt).join(' ') }), s('text', { class: 'kurve-text', x: Math.min(x(letzter.s) + 6, 600), y: y(letzter.anteil) - 4 - i * 2 }, name(id).replace(/^Team\s+/, '')));
      })
    );
  }

  function wettknacken(st, name) {
    const a = st.anzeigen || {};
    const aus = st.auswertung || {};
    const fortschritt = a.fortschritt || aus.teams || [];
    const verlauf = a.verlauf || Object.fromEntries((aus.teams || []).map((t) => [t.team, t.verlauf || []]));
    const reihenfolge = fortschritt.map((f) => f.team);
    const balken = fortschritt.map((f, i) => {
      const pct = Math.round((f.anteil || 0) * 100);
      const b = h('span', { class: 'balken-wert' });
      b.style.setProperty('--wert', `${pct}%`);
      return h('div', { class: 'balken', 'data-muster': String(i % 4) }, h('span', { class: 'balken-name' }, name(f.team)), h('span', { class: 'balken-spur', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(pct), 'aria-label': `${name(f.team)}: ${pct} Prozent` }, b), h('span', { class: 'balken-zahl' }, `${pct} %${f.fertig ? ` · ✓ Platz ${f.platz}` : ''}`));
    });
    const aufl = st.phase === 'aufloesung' || st.status === 'auswertung';
    return h(
      'div',
      { class: 'beamer-typ' },
      h('div', { class: 'beamer-balken' }, balken),
      aufl ? kurven(verlauf, name, reihenfolge) : null,
      aufl && a.klartext ? h('section', { class: 'beamer-klartext' }, h('h2', null, 'Der Brief aus dem Haus der Weisheit'), h('p', null, a.klartext)) : null
    );
  }

  function doppelterSchluessel(st, name) {
    const a = st.anzeigen || {};
    const sprueche = (st.nachrichten || []).filter((n) => n.art === 'nachricht' && !n.ausgeblendet);
    const liste = h('ol', { class: 'beamer-hexliste' }, sprueche.map((n) => h('li', null, h('span', { class: 'beamer-klein' }, name(n.von)), h('code', null, n.inhalt))));
    const vergleiche = (a.vergleiche || []).filter((v) => typeof v.xor === 'string');
    const teile = [liste];
    for (const v of vergleiche) {
      const bytes = v.xor.split(' ').filter(Boolean);
      teile.push(
        h(
          'section',
          { class: 'beamer-vergleich' },
          h('h2', null, `C1 ⊕ C2 (Spruch ${v.a} und ${v.b})`),
          h('p', { class: 'beamer-bytes' }, bytes.map((b) => h('code', { class: parseInt(b, 16) < 0x20 ? 'byte null' : 'byte' }, b))),
          h('p', { class: 'beamer-gross' }, `${v.nullen} von ${v.laenge} Bytes beginnen mit 000`)
        )
      );
    }
    if (Array.isArray(a.sprueche) && (st.phase === 'aufloesung' || st.status === 'auswertung')) {
      teile.push(tabelle('beamer-sprueche', 'Die Klartexte', ['Team', 'Abschnitt', 'Spruch'], a.sprueche.map((x) => h('tr', null, h('td', null, name(x.team)), h('td', null, String(x.abschnitt)), h('td', null, h('code', null, x.m || '–'))))));
    }
    if (a.eveGewinnt !== undefined && (st.phase === 'aufloesung' || st.status === 'auswertung')) teile.push(h('p', { class: 'beamer-gross' }, a.eveGewinnt ? 'Eve gewinnt!' : 'Eve hat keinen Spruch rekonstruiert.'));
    return h('div', { class: 'beamer-typ' }, teile);
  }

  function kanalWerte(st) {
    const phasen = (st.ereignisse || []).filter((e) => e.code === 'phase' && e.daten && e.daten.phase === st.phase);
    const ab = phasen.length ? phasen[phasen.length - 1].version : 0;
    const out = new Map();
    for (const n of st.nachrichten || []) {
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

  function schluesseltausch(st, name) {
    const a = st.anzeigen || {};
    if (Array.isArray(a.meldungen)) {
      const zeilen = a.meldungen.map((m) => h('tr', null, h('td', null, name(m.paar)), h('td', null, String(m.runde)), h('td', null, m.kWahr === null ? '–' : String(m.kWahr)), h('td', null, m.kWahr !== null && m.kAlice === m.kWahr && m.kBob === m.kWahr ? '✓ gleich' : '✗ nicht gleich'), h('td', null, m.eve ? (m.eve.richtig ? '✓ richtig' : '✗ falsch') : '– kein Tipp')));
      return h('div', { class: 'beamer-typ' }, tabelle('beamer-dh', 'Auflösung: Haben Alice und Bob dasselbe K? Hat Eve es erraten?', ['Paar', 'Runde', 'K', 'K bei Alice und Bob', 'Eve'], zeilen));
    }
    const werte = kanalWerte(st);
    const paare = (st.teams || []).filter((t) => t.rolle === 'alice');
    const z = (v) => (v === null || v === undefined ? '–' : String(v));
    return h(
      'div',
      { class: 'beamer-typ' },
      a.p ? h('p', { class: 'beamer-gross' }, `Runde ${a.runde}: p = ${a.p}, g = ${a.g}`) : null,
      tabelle('beamer-dh-kanal', 'Was alle im Kanal sehen', ['Paar', 'p', 'g', 'A', 'B'], paare.map((t) => h('tr', null, h('td', null, t.name), h('td', null, z(a.p)), h('td', null, z(a.g)), h('td', null, z((werte.get(t.id) || {}).A)), h('td', null, z((werte.get(t.id) || {}).B)))))
    );
  }

  function mallory(st, name) {
    const a = st.anzeigen || {};
    const zeilen = Array.isArray(a.auswertung) ? a.auswertung : null;
    if (!zeilen) return st.phase === 'mit-zertifikaten' ? h('p', { class: 'beamer-gross' }, 'Phase 2: Trent stellt Zertifikate aus.') : null;
    const weg = (w) => (Array.isArray(w) && w.length ? [name(w[0].von), ...w.map((x) => `${name(x.an)}${x.etikett ? ` (${x.etikett})` : ''}`)].join(' → ') : '–');
    return h(
      'div',
      { class: 'beamer-typ' },
      tabelle('beamer-mallory', 'Auflösung: Original, empfangen und Weg', ['Alice-Team', 'Phase', 'Original', 'bei Bob angekommen', 'Weg', 'verändert'], zeilen.map((z) => h('tr', null, h('td', null, name(z.team)), h('td', null, KRNetz.PHASE[z.phase] || z.phase), h('td', null, h('code', null, z.original || '–')), h('td', null, h('code', null, z.empfangen || '–')), h('td', null, weg(z.weg)), h('td', null, ja(z.veraendert)))))
    );
  }

  const TYPEN = { botenlauf, wettknacken, 'doppelter-schluessel': doppelterSchluessel, schluesseltausch, mallory };

  /* ---------- Funkraum ---------- */

  function funkraum(haupt, id) {
    const titel = h('h1', null, 'Funkraum');
    const phase = h('p', { class: 'beamer-phase' });
    const banner = h('div', { class: 'beamer-banner' });
    const netz = h('div', { class: 'beamer-netz' });
    const typOrt = h('div', { class: 'beamer-typ-ort' });
    const tickerOl = h('ol', { class: 'funk-ticker beamer-ticker' });
    const verbindung = h('p', { class: 'beamer-verbindung', role: 'status' });
    ticker = KRNetz.ticker(tickerOl, { max: 8 });
    const qr = h('figure', { class: 'beamer-qr-rahmen' }, h('img', { class: 'beamer-qr', src: '/api/lehrer/qr.svg?ziel=funkraum', alt: 'QR-Code zum Funkraum', width: '220', height: '220' }), h('figcaption', null, 'Funkraum öffnen'));
    const flaeche = h(
        'div',
        { class: 'beamer-flaeche beamer-funkraum' },
        h('div', { class: 'beamer-kopf' }, h('div', { class: 'beamer-titel' }, KR.symbol('icons', 'logo-ring'), h('div', null, titel, phase)), qr),
        banner,
        h('div', { class: 'beamer-raster' }, h('div', { class: 'beamer-haupt' }, netz, typOrt), h('aside', { class: 'beamer-seite', 'aria-labelledby': 'beamer-ticker-titel' }, h('h2', { id: 'beamer-ticker-titel' }, 'Ticker'), tickerOl, verbindung))
      );
    AQ.mount(haupt, flaeche);
    let stand = null;
    const name = (tid) => {
      const t = stand && (stand.teams || []).find((x) => x.id === tid);
      return t ? t.name : `Team ${tid}`;
    };
    function zeige(st) {
      stand = st;
      if (WELT[st.typ] !== undefined) KR.epoche(WELT[st.typ]);
      document.title = `${st.titel || 'Funkraum'} · Beamer · Kryptos`;
      titel.textContent = st.titel || 'Funkraum';
      phase.textContent = st.status === 'auswertung' ? 'Beendet – alle Nachrichten sind gelöscht.' : `${KRNetz.PHASE[st.phase] || st.phase} · ${KRNetz.STATUS[st.status] || st.status}`;
      AQ.mount(banner, st.status === 'pausiert' ? h('p', { class: 'beamer-pause', role: 'status' }, 'Pause') : null);
      const mitte = st.typ === 'mallory' ? ((st.teams || []).find((t) => t.rolle === 'mallory') || {}).id ?? null : null;
      if (st.status === 'auswertung') AQ.clear(netz);
      else KRNetz.zeichne(netz, { teams: st.teams || [], nachrichten: st.nachrichten || [], ich: null, ansicht: 'beamer', mitte, vorschau: true });
      const f = TYPEN[st.typ];
      AQ.mount(typOrt, f ? f(st, name) : null);
      // Auflösung: Ergebnisse oben, das Netz klein darunter (passt auf 1920 × 1080)
      const aufl = st.phase === 'aufloesung' || st.status === 'auswertung';
      flaeche.classList.toggle('beamer-aufloesung', aufl);
      if (aufl && typOrt.nextSibling !== netz) typOrt.parentNode.insertBefore(typOrt, netz);
      if (!aufl && netz.nextSibling !== typOrt) netz.parentNode.insertBefore(netz, typOrt);
      ticker.neu((st.ereignisse || []).map((e) => ({ id: e.id, text: KRNetz.ereignisText(e, { teamName: name, nachricht: (nid) => (st.nachrichten || []).find((n) => n.id === nid) || null }) })));
    }
    poller = KRPoll.starte({
      url: (seit) => `/api/lehrer/funk/${encodeURIComponent(id)}/stand?seit=${encodeURIComponent(seit)}&ansicht=beamer`,
      intervall: INTERVALL,
      mischen: true,
      beiDaten: zeige,
      beiZustand: (z) => {
        if (z === 'ende') {
          stopp();
          leer(haupt, 'Funkraum');
          return;
        }
        verbindung.textContent = z === 'gestoert' ? 'Verbindung unterbrochen – wird wiederhergestellt' : '';
      }
    });
  }

  /* ---------- Arena (Task 158) ---------- */
  const ARENA_PHASE = Object.freeze({ werkstatt: 'Werkstatt – die Teams bauen ihre Verfahren', angriff: 'Angriffsphase', beurteilung: 'Beurteilung', geschlossen: 'geschlossen' });

  function arena(haupt, id) {
    const titel = h('h1', null, 'Knack-Arena');
    const phase = h('p', { class: 'beamer-phase' });
    const rest = h('p', { class: 'beamer-restzeit', 'aria-label': 'Restzeit der Angriffsphase' });
    const karten = h('ol', { class: 'beamer-arena-karten' });
    const tickerOl = h('ol', { class: 'arena-ticker' });
    const verbindung = h('p', { class: 'beamer-verbindung', role: 'status' });
    const qr = h('figure', { class: 'beamer-qr-rahmen' }, h('img', { class: 'beamer-qr', src: '/api/lehrer/qr.svg?ziel=werkstatt', alt: 'QR-Code zur Werkstatt', width: '220', height: '220' }), h('figcaption', null, 'Werkstatt öffnen'));
    KR.epoche(3);
    AQ.mount(
      haupt,
      h(
        'div',
        { class: 'beamer-flaeche beamer-arena' },
        h('div', { class: 'beamer-kopf' }, h('div', { class: 'beamer-titel' }, KR.symbol('icons', 'logo-ring'), h('div', null, titel, phase)), rest, qr),
        h('div', { class: 'beamer-raster' }, h('div', { class: 'beamer-haupt' }, karten), h('aside', { class: 'beamer-seite', 'aria-labelledby': 'beamer-ticker-titel' }, h('h2', { id: 'beamer-ticker-titel' }, 'Geknackt'), tickerOl, verbindung))
      )
    );
    let bis = NaN;
    function restzeit() {
      if (Number.isNaN(bis)) {
        rest.hidden = true;
        return;
      }
      const sek = Math.max(0, Math.round((bis - Date.now()) / 1000));
      rest.hidden = false;
      rest.textContent = `${Math.floor(sek / 60)}:${String(sek % 60).padStart(2, '0')}`;
    }
    clearInterval(uhr);
    uhr = setInterval(restzeit, 1000);
    function karte(k, status) {
      const symbol = k.geknackt ? '🔓' : '🔒';
      const zustand = status === 'werkstatt' ? 'eingereicht' : k.geknackt ? `geknackt von ${(k.von || []).join(', ')}${Number.isInteger(k.sekunden) ? ` nach ${KRNetz.dauer(k.sekunden)}` : ''}` : 'ungeknackt';
      return h(
        'li',
        { class: `beamer-arena-karte${k.geknackt ? ' geknackt' : ''}` },
        h('h2', null, k.team.name),
        k.name ? h('p', { class: 'beamer-arena-name' }, k.name) : null,
        k.ausschnitt ? h('p', { class: 'beamer-arena-ausschnitt' }, k.ausschnitt) : null,
        Array.isArray(k.stufen) && k.stufen.length ? h('p', { class: 'beamer-arena-stufen' }, k.stufen.join(' → ')) : null,
        h('p', { class: 'beamer-arena-status' }, h('span', { 'aria-hidden': 'true' }, status === 'werkstatt' ? '✉' : symbol), ' ', zustand),
        status === 'werkstatt' ? null : h('p', { class: 'beamer-arena-angriffe' }, `${k.angriffe} ${k.angriffe === 1 ? 'Angriff' : 'Angriffe'}`)
      );
    }
    function zeige(d) {
      document.title = 'Knack-Arena · Beamer · Kryptos';
      phase.textContent = ARENA_PHASE[d.status] || d.status;
      bis = d.status === 'angriff' && d.angriffBis ? Date.parse(d.angriffBis) : NaN;
      restzeit();
      AQ.mount(karten, (d.karten || []).map((k) => karte(k, d.status)));
      const t = (d.ticker || []).slice(-8).reverse();
      AQ.mount(tickerOl, t.length ? t.map((e) => h('li', null, `${e.von} hat die Chiffre von ${e.ziel} geknackt`)) : h('li', { class: 'leer' }, 'Noch nichts geknackt.'));
    }
    poller = KRPoll.starte({
      url: () => `/api/lehrer/arena/${encodeURIComponent(id)}/beamer`,
      intervall: INTERVALL,
      beiDaten: zeige,
      beiZustand: (z) => {
        if (z === 'ende') {
          stopp();
          leer(haupt, 'Knack-Arena', 'Keine Arena geöffnet.');
          return;
        }
        verbindung.textContent = z === 'gestoert' ? 'Verbindung unterbrochen – wird wiederhergestellt' : '';
      }
    });
  }

  function start() {
    const haupt = document.getElementById('haupt');
    const a = art();
    const titel = TITEL[a] || 'Beamer';
    document.title = `${titel} · Beamer · Kryptos`;
    if (a === 'funkraum' && typeof KRPoll !== 'undefined') return funkraum(haupt, idAusPfad());
    if (a === 'arena' && typeof KRPoll !== 'undefined') return arena(haupt, idAusPfad());
    leer(haupt, titel);
  }
  document.addEventListener('DOMContentLoaded', start);
  return { start, art, stopp, _poller: () => poller };
})();
