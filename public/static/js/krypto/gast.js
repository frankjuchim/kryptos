/* Kryptos – Gastmodus /gast (M4 Task 65, Delta §12, Design §7.8): ohne Anmeldung, nichts wird gespeichert.
   Hash-Router:
     #/ Übersicht (Schüler, Lehrkraft, Kryptolabor: Chiffrierscheibe)
     #/schueler · #/schueler/aufgabe/<id>   Demo-Aufgaben (W8-*) aus GET /api/gast/schueler, Prüfung serverseitig;
                                            Fehlversuche/Tipps zählt der Browser und schickt sie nur zur Anzeige mit
     #/lehrkraft/<tab> · #/lehrkraft/vorschau/<id>   erfundener Demo-Kurs nur lesend (Bausteine aus KRLehrer)
     #/labor/scheibe                        Chiffrierscheibe über KRLabor (nachgeladen, M6 Task 126); andere ids: Hinweis, kein Nachladen;
                                            mit Schüler-Sitzung im laufenden Boss-Kampf gesperrt (Review M6, TECHNIK §10.3)
   Startet nur auf body.seite-gast. Texte nur als Textknoten (AQ.h). */
'use strict';

const KRGast = (() => {
  const { h, api, mount } = AQ;
  const enc = encodeURIComponent;
  const WERKZEUG = 'scheibe'; // einziges Werkzeug im Gastmodus (Delta §12)
  const werkzeugFrei = (id) => id === WERKZEUG;
  const UMGEBUNG = Object.freeze({ modus: 'gast', rolle: null }); // Gast: keine Rolle, alle Scheiben-Reiter (E71)
  const zaehler = new Map(); // id → { fehlversuche, tipps, angesehen } – nur im Browser, nur zur Anzeige
  let haupt = null;
  let routeNr = 0;
  let lehrkraftDaten = null;
  let offen = null;
  let schuelerSitzung = false; // angemeldete Schülerin/angemeldeter Schüler im selben Browser (Boss-Sperre, Review M6)

  /** Läuft für die angemeldete Schülerin/den angemeldeten Schüler gerade ein Boss-Kampf? Ohne Schüler-Sitzung (fremdes
      Gerät, privates Fenster) nicht feststellbar – bewusste Grenze (TECHNIK §10.3). */
  async function bossLaeuft() {
    if (!schuelerSitzung) return false;
    const r = await api('GET', '/api/labor').catch(() => null);
    return !!(r && r.boss);
  }
  const umgebungFrisch = async () => ((await bossLaeuft()) ? { ...UMGEBUNG, gesperrt: 'boss' } : { ...UMGEBUNG });

  const HINWEIS = 'Nichts wird gespeichert.';

  function seite(titel, ...inhalt) {
    document.title = `${titel} · Gastmodus · Kryptos`;
    mount(haupt, ...inhalt);
    const h1 = haupt.querySelector('h1');
    if (h1) {
      if (!h1.hasAttribute('tabindex')) h1.setAttribute('tabindex', '-1');
      h1.focus();
    }
    if (typeof window.scrollTo === 'function') window.scrollTo(0, 0);
  }

  function fehler(e, zurueck = { href: '#/', text: 'Zum Gastmodus' }) {
    document.title = 'Fehler · Kryptos';
    mount(haupt, h('div', { class: 'wrap gast' }, h('div', { class: 'fehler-ziel' })));
    KR.fehler(haupt.querySelector('.fehler-ziel'), e, { zurueck });
  }

  const brotkrumen = (...teile) =>
    h(
      'nav',
      { class: 'brotkrumen', 'aria-label': 'Brotkrümel' },
      h('a', { href: '#/' }, 'Gastmodus'),
      teile.flatMap((t) => [h('span', { 'aria-hidden': 'true' }, '›'), t])
    );

  const hinweis = () => h('div', { class: 'rueckmeldung info gast-hinweis', role: 'note' }, h('p', null, h('b', null, HINWEIS), ' Im Gastmodus probierst du Kryptos ohne Anmeldung aus. Mit deinem Kurs meldest du dich über das Portal InfoLabs an.'));

  /* ---------- Übersicht ---------- */

  function karte(href, titel, text, symbol) {
    return h('a', { class: 'karte gast-karte', href }, KR.symbol('icons', symbol, { klasse: 'gast-karte-symbol' }), h('b', { class: 'gast-karte-titel' }, titel), h('span', { class: 'text-2' }, text));
  }

  function uebersicht() {
    KR.epoche(6);
    KRKopf.epoche('Gastmodus');
    seite(
      'Übersicht',
      h(
        'div',
        { class: 'wrap gast' },
        h('h1', null, 'Gastmodus'),
        h('p', { class: 'lesen' }, 'Schau dich in Kryptos um – ohne Anmeldung. Probiere sechs Demo-Aufgaben aus, sieh dir einen erfundenen Kurs aus Sicht der Lehrkraft an oder dreh an der Chiffrierscheibe.'),
        hinweis(),
        h(
          'div',
          { class: 'gast-raster' },
          karte('#/schueler', 'Als Schülerin/Schüler', 'Sechs Demo-Aufgaben: Caesar, Häufigkeiten, Vigenère, XOR, Signatur, fremde Chiffre.', 'i-lupe'),
          karte('#/lehrkraft/schueler', 'Als Lehrkraft', 'Ein erfundener Demo-Kurs mit Auswertung, Fallen-Profil und Einstellungen – nur lesend.', 'i-zahnrad'),
          karte(`#/labor/${WERKZEUG}`, 'Kryptolabor: Chiffrierscheibe', 'Das erste Werkzeug aus dem Kryptolabor.', 'i-labor')
        )
      )
    );
  }

  /* ---------- Schüler: Demo-Aufgaben ---------- */

  async function schuelerListe(r) {
    const d = await api('GET', '/api/gast/schueler');
    if (!r.gueltig()) return;
    KR.epoche(6);
    KRKopf.epoche('Gastmodus · Demo-Aufgaben');
    if (!d.vorhanden) {
      seite('Demo-Aufgaben', h('div', { class: 'wrap gast' }, brotkrumen(h('span', { 'aria-current': 'page' }, 'Demo-Aufgaben')), h('h1', null, 'Demo-Aufgaben'), hinweis(), h('div', { class: 'leer-zustand karte' }, h('p', null, 'Auf diesem Server gibt es noch keine Demo-Aufgaben.'))));
      return;
    }
    seite(
      'Demo-Aufgaben',
      h(
        'div',
        { class: 'wrap gast' },
        brotkrumen(h('span', { 'aria-current': 'page' }, 'Demo-Aufgaben')),
        h('h1', null, d.titel || 'Demo-Aufgaben'),
        d.level ? h('p', { class: 'lesen' }, d.level) : null,
        hinweis(),
        Array.isArray(d.intro) && d.intro.length ? h('section', { class: 'karte' }, AQR.bloecke(d.intro, null)) : null,
        h(
          'ol',
          { class: 'aufgaben-liste' },
          (d.aufgaben || []).map((a, i) =>
            h(
              'li',
              { class: 'aufgabe-eintrag status-offen' },
              h(
                'a',
                { href: `#/schueler/aufgabe/${enc(a.id)}` },
                h('span', { class: 'aufgabe-nr', 'aria-hidden': 'true' }, String(i + 1)),
                h('span', { class: 'aufgabe-text' }, h('b', null, a.titel), h('span', { class: 'aufgabe-meta' }, AQ.sterne(a.stufe), a.kategorie ? ` · ${KR.KATEGORIEN[a.kategorie] || a.kategorie}` : '')),
                h('span', { class: 'chip-reihe' }, h('span', { class: 'chip chip-neutral zahl' }, `${a.punkte} P.`))
              )
            )
          )
        )
      )
    );
  }

  async function schuelerAufgabe(id, r) {
    const d = await api('GET', `/api/gast/aufgaben/${enc(id)}`);
    if (!r.gueltig()) return;
    const z = zaehler.get(id) || { fehlversuche: 0, tipps: 0, angesehen: false };
    zaehler.set(id, z);
    const merke = (x) => {
      if (x && x.zustand) {
        z.fehlversuche = x.zustand.fehlversuche;
        z.tipps = x.zustand.tippsGenutzt;
      }
      return x;
    };
    const pfad = `/api/gast/aufgaben/${enc(id)}`;
    const o = d.ort || { index: 0, anzahl: 1 };
    KR.epoche(6);
    KRKopf.epoche('Gastmodus · Demo-Aufgaben');
    const ansicht = AQA.ansicht({
      aufgabe: d.aufgabe,
      zustand: { ...d.zustand, fehlversuche: z.fehlversuche, tippsGenutzt: z.tipps },
      modus: 'gast',
      zusatz: { werkzeugFrei, laborUmgebung: UMGEBUNG, laborFrisch: umgebungFrisch },
      anzeige: KRDiag.anzeige,
      pruefen: async (body) => merke(await api('POST', `${pfad}/pruefen`, { ...body, fehlversuche: z.fehlversuche, tipps: z.tipps, angesehen: z.angesehen })),
      tipp: async () => merke(await api('POST', `${pfad}/tipp`, { fehlversuche: z.fehlversuche, tipps: z.tipps })),
      aufdecken: async () => {
        z.angesehen = true;
        return api('POST', `${pfad}/aufdecken`, {});
      },
      punkteText: (x) => (x.punkteErhalten ? `✔ Richtig! Mit Anmeldung gäbe es dafür ${x.punkteErhalten} ${x.punkteErhalten === 1 ? 'Punkt' : 'Punkte'}.` : '✔ Richtig!'),
      weiter: o.nachher ? { href: `#/schueler/aufgabe/${enc(o.nachher)}`, text: 'Nächste Aufgabe →' } : { href: '#/schueler', text: 'Zur Übersicht →' }
    });
    seite(
      d.aufgabe.titel,
      h(
        'div',
        { class: 'wrap aufgabe-seite gast' },
        brotkrumen(h('a', { href: '#/schueler' }, 'Demo-Aufgaben'), h('span', { 'aria-current': 'page' }, `Aufgabe ${o.index + 1} von ${o.anzahl}`)),
        h('p', { class: 'klein text-2 gast-hinweis-kurz' }, `Gastmodus – ${HINWEIS}`),
        ansicht
      )
    );
  }

  /* ---------- Lehrkraft: Demo-Kurs (nur lesend) ---------- */

  const TABS = [
    ['schueler', 'Schüler'],
    ['auswertung', 'Auswertung'],
    ['einstellungen', 'Einstellungen'],
    ['materialien', 'Materialien'],
    ['vorschau', 'Aufgaben']
  ];

  async function demoKurs() {
    if (!lehrkraftDaten) lehrkraftDaten = await api('GET', '/api/gast/lehrkraft');
    return lehrkraftDaten;
  }

  function tabLeiste(aktiv) {
    return h(
      'nav',
      { class: 'gast-tabs knopf-reihe', 'aria-label': 'Bereiche des Demo-Kurses' },
      TABS.map(([key, text]) => h('a', { class: 'knopf ' + (key === aktiv ? 'knopf-primaer' : 'knopf-zweit'), href: `#/lehrkraft/${key}`, 'aria-current': key === aktiv ? 'page' : null }, text))
    );
  }

  function materialien(m) {
    const liste = (m && m.welt0) || [];
    return [
      h('p', { class: 'text-2 lesen' }, 'Im echten Bereich für Lehrkräfte stehen hier Präsentationen, Lehrerhinweise, Lösungen und Klausuren. Im Gastmodus sind nur die Titel sichtbar; herunterladen lassen sich nur ausgewählte Demo-Dateien.'),
      liste.length
        ? h(
            'ul',
            { class: 'material-liste' },
            liste.map((e) =>
              h(
                'li',
                { class: 'material-eintrag' },
                h('b', null, e.titel),
                h(
                  'span',
                  { class: 'knopf-reihe' },
                  (e.dateien || []).map((x) => (x.url ? h('a', { class: 'knopf knopf-zweit', href: x.url, target: '_blank', rel: 'noopener' }, KR.symbol('icons', 'i-download'), x.label || 'PDF') : h('span', { class: 'klein text-2' }, `${x.label || 'Datei'}: nur mit Anmeldung`)))
                )
              )
            )
          )
        : h('p', { class: 'text-2' }, 'Für die Demo sind noch keine Materialien hinterlegt.'),
      m && m.weitere ? h('p', { class: 'klein text-2' }, `… und ${m.weitere} weitere Einträge in den anderen Epochen.`) : null
    ];
  }

  function vorschauListe() {
    return api('GET', '/api/gast/schueler').then((d) =>
      d && d.vorhanden
        ? h(
            'ul',
            { class: 'vorschau-liste' },
            d.aufgaben.map((a) => h('li', { class: 'vorschau-aufgabe' }, h('a', { href: `#/lehrkraft/vorschau/${enc(a.id)}` }, a.titel), h('span', { class: 'aufgabe-meta' }, AQ.sterne(a.stufe), h('span', { class: 'klein text-2' }, ` ${a.punkte} P. · ${KR.KATEGORIEN[a.kategorie] || a.kategorie}`)), h('span', { class: 'klein text-2 mono' }, a.id)))
          )
        : h('p', { class: 'text-2' }, 'Keine Demo-Aufgaben vorhanden.')
    );
  }

  async function lehrkraftTab(tab, r) {
    const d = await demoKurs();
    if (!r.gueltig()) return;
    KR.epoche(6);
    KRKopf.epoche('Gastmodus · Demo-Kurs');
    const box = h('div', { id: 'tab-inhalt', class: 'tab-inhalt' });
    const werkzeuge = (d.werkzeuge || []).map((id) => KRLabor.werkzeug(id)).filter(Boolean);
    const kurs = { id: 'demo', aktiv: true, einstellungen: d.einstellungen, boardSchluessel: '' };
    const inhalt = {
      schueler: () => KRLehrer.schuelerTabelle((d.schueler || []).map((s) => ({ aktiv: true, ...s }))),
      auswertung: () => [
        h('section', { class: 'auswertung-teil', 'aria-labelledby': 'aw-matrix' }, h('h2', { id: 'aw-matrix' }, 'Fortschritt je Level'), !(d.levels || []).length ? h('p', { class: 'text-2' }, 'Die Epochen des Demo-Kurses sind auf diesem Server noch nicht geladen.') : KRLehrer.matrixTabelle({ levels: d.levels, zeilen: (d.matrix && d.matrix.zeilen) || [] }, { niveau: d.einstellungen && d.einstellungen.niveau })),
        h('section', { class: 'auswertung-teil', 'aria-labelledby': 'aw-fallen' }, h('h2', { id: 'aw-fallen' }, 'Fallen-Profil des Kurses'), KRLehrer.fallenProfil(d.fallen)),
        h('section', { class: 'auswertung-teil', 'aria-labelledby': 'aw-boss' }, h('h2', { id: 'aw-boss' }, 'Boss-Ergebnisse'), KRLehrer.bossTabelle(d.boss)),
        h('section', { class: 'auswertung-teil', 'aria-labelledby': 'aw-aufgaben' }, h('h2', { id: 'aw-aufgaben' }, 'Aufgabenstatistik (Demo-Aufgaben)'), KRLehrer.aufgabenStatistik((d.aufgaben || []).map((a) => ({ ...a }))))
      ],
      einstellungen: () => [h('p', { class: 'klein text-2' }, 'Im Gastmodus nur lesend.'), KRLehrer.einstellungen(kurs, { nurLesen: true, welten: d.welten || [], werkzeuge })],
      materialien: () => materialien(d.materialien),
      vorschau: () => vorschauListe()
    }[tab];
    seite(
      `Demo-Kurs – ${(TABS.find(([k]) => k === tab) || [])[1] || ''}`,
      h(
        'div',
        { class: 'wrap lehrer-seite gast' },
        brotkrumen(h('span', { 'aria-current': 'page' }, 'Demo-Kurs')),
        h('h1', null, (d.kurs && d.kurs.name) || 'Demo-Kurs'),
        h('div', { class: 'rueckmeldung info gast-hinweis', role: 'note' }, h('p', null, 'Erfundener Kurs mit erfundenen Namen – nur lesend. Echte Kurse kommen aus dem Portal InfoLabs.')),
        tabLeiste(tab),
        box
      )
    );
    const x = await inhalt();
    if (!r.gueltig()) return;
    mount(box, ...(Array.isArray(x) ? x : [x]));
    // Links der Aufgabenstatistik zeigen im Gastmodus auf die Demo-Vorschau
    box.querySelectorAll('a[href^="#/vorschau/aufgabe/"]').forEach((a) => a.setAttribute('href', a.getAttribute('href').replace('#/vorschau/aufgabe/', '#/lehrkraft/vorschau/')));
  }

  async function lehrkraftVorschau(id, r) {
    const d = await api('GET', `/api/gast/vorschau/${enc(id)}`);
    if (!r.gueltig()) return;
    const a = d.aufgabe;
    KR.epoche(6);
    KRKopf.epoche('Gastmodus · Demo-Kurs');
    const ctrl = AQI.aufgabe(a, { modus: 'vorschau', vorschau: true, zusatz: { werkzeugFrei } });
    ctrl.loesung(d.loesung, d.muster);
    ctrl.sperren(true);
    seite(
      `Vorschau ${a.titel}`,
      h(
        'div',
        { class: 'wrap lehrer-seite vorschau aufgabe-seite gast' },
        brotkrumen(h('a', { href: '#/lehrkraft/vorschau' }, 'Demo-Kurs: Aufgaben'), h('span', { 'aria-current': 'page' }, a.titel)),
        h('div', { class: 'aufgabe-kopf' }, h('h1', null, a.titel), AQ.sterne(a.stufe), h('span', { class: 'pill gold' }, `${a.punkte} ${a.punkte === 1 ? 'Punkt' : 'Punkte'}`), a.kategorie ? h('span', { class: 'pill' }, KR.KATEGORIEN[a.kategorie] || a.kategorie) : null, (a.fallen || []).map((p) => KRDiag.chip(p))),
        h('div', { class: 'rueckmeldung info' }, h('p', null, 'Vorschau mit eingesetzter Lösung – so sehen Lehrkräfte jede Aufgabe.')),
        h('section', { class: 'card' }, ctrl.el),
        d.tipps && d.tipps.length ? h('section', { class: 'card' }, h('h2', null, 'Tipps'), d.tipps.map((t, i) => h('div', { class: 'tipp-box' }, h('strong', null, `Tipp ${i + 1}: `), AQR.md(t, null, 'span')))) : null,
        d.erklaerung && d.erklaerung.length ? h('section', { class: 'card erklaerung' }, h('h2', null, 'Erklärung'), AQR.bloecke(d.erklaerung, null)) : null,
        h('p', { class: 'knopf-reihe' }, h('a', { class: 'knopf knopf-zweit', href: '#/lehrkraft/vorschau' }, '← Zur Aufgabenliste'))
      )
    );
  }

  /* ---------- Labor-Platz ---------- */

  async function labor(id, r) {
    const w = KRLabor.werkzeug(id);
    if (!w || !werkzeugFrei(id)) {
      fehler(new Error('Im Gastmodus gibt es nur die Chiffrierscheibe.'));
      return;
    }
    const umgebung = await umgebungFrisch(); // im laufenden Kampf gesperrt (Grund statt Werkzeug)
    if (!r.gueltig()) return;
    KR.epoche(w.welt);
    KRKopf.epoche('Gastmodus · Kryptolabor');
    const flaeche = h('div', { class: 'werkzeug-flaeche' });
    seite(
      w.titel,
      h(
        'section',
        { class: 'labor-vollseite', 'data-epoche': String(w.welt), 'aria-labelledby': 'werkzeug-titel' },
        h('div', { class: 'werkzeug-kopfband' }, KR.symbol('icons', 'i-labor'), h('h1', { id: 'werkzeug-titel' }, w.titel), h('span', { class: 'werkzeug-epoche' }, KR.WELTEN_KURZ[w.welt] || '')),
        flaeche,
        h('div', { class: 'labor-steuerleiste' }, h('a', { class: 'knopf knopf-zweit', href: '#/' }, KR.symbol('icons', 'i-pfeil-l'), 'Zum Gastmodus'))
      )
    );
    offen = KRLabor.oeffne(id, {}, flaeche, umgebung); // Modul wird nachgeladen (E72)
  }

  /* ---------- Router ---------- */

  function teileDerAdresse() {
    try {
      return (location.hash || '').replace(/^#\/?/, '').split('/').map(decodeURIComponent);
    } catch {
      return [''];
    }
  }

  async function navigiere() {
    if (offen) {
      offen.schliesse();
      offen = null;
    }
    const meine = ++routeNr;
    const r = { gueltig: () => meine === routeNr };
    const [bereich, a, b] = teileDerAdresse();
    KR.laden(haupt);
    try {
      if (bereich === 'schueler' && a === 'aufgabe' && b) await schuelerAufgabe(b, r);
      else if (bereich === 'schueler') await schuelerListe(r);
      else if (bereich === 'lehrkraft' && a === 'vorschau' && b) await lehrkraftVorschau(b, r);
      else if (bereich === 'lehrkraft') await lehrkraftTab(TABS.some(([k]) => k === a) ? a : 'schueler', r);
      else if (bereich === 'labor' && a) await labor(a, r);
      else uebersicht();
    } catch (e) {
      if (r.gueltig()) fehler(e);
    }
  }

  async function start() {
    if (!document.body.classList.contains('seite-gast')) return;
    haupt = document.getElementById('haupt');
    const sitzung = await api('GET', '/api/sitzung').catch(() => ({}));
    const rolle = sitzung && ['schueler', 'lehrkraft', 'superadmin'].includes(sitzung.rolle) ? sitzung.rolle : null;
    KRKopf.baue({ rolle, aktiv: rolle ? null : 'gast', sitzung: sitzung || {} });
    schuelerSitzung = rolle === 'schueler';
    window.addEventListener('hashchange', navigiere);
    // Rückkehr in den Tab: Kampf begonnen → offene Scheibe schließen (nur mit Schüler-Sitzung)
    if (schuelerSitzung) KRLabor.wache(async () => {
      if (await bossLaeuft()) KRLabor.sperreAlle('boss');
    });
    await navigiere();
  }
  document.addEventListener('DOMContentLoaded', start);

  return { start, werkzeugFrei, HINWEIS };
})();
