/* Algo Quest Lab – Gastmodus (/gast): kleiner Einblick ohne Anmeldung.
 * Schüler: sechs Demo-Aufgaben (nicht aus den Welten), echte Aufgabenansicht, nichts wird gespeichert.
 * Lehrkraft: erfundener Demo-Kurs mit den Ansichten des Lehrkraft-Bereichs – nur lesend. */
'use strict';

(() => {
  const { h, mount, api, toast, prozent, fmtDatum, sterne } = AQ;
  const app = document.getElementById('app');
  const ARTEN = { gaps: 'Lücken', choice: 'Auswahl', order: 'Puzzle', lines: 'Bug-Hunt', match: 'Zuordnen', 'tree:klick': 'Baum klicken', 'tree:bauen': 'Baum bauen', 'array:tausch': 'Tauschen', 'array:klick': 'Reihung klicken', grid: 'Raster', adtsim: 'ADT-Simulation' };
  const SYMBOL = { praesentation: '🖥️', hinweise: '🧭', ab: '📄', boss: '⚔️', probeklausur: '📝', klausur: '🎓', warmup: '🔥' };
  /** Zähler je Demo-Aufgabe – nur im Browser, für die Punkte-Anzeige */
  const zaehler = new Map();

  function seite(aktiv, ...inhalt) {
    const link = (href, label, key) => h('a', { href, class: aktiv === key ? 'active' : null, 'aria-current': aktiv === key ? 'page' : null }, label);
    mount(
      app,
      h('a', { class: 'skip', href: '#haupt' }, 'Zum Inhalt springen'),
      h(
        'header',
        { class: 'topbar' },
        h(
          'div',
          { class: 'topbar-inner' },
          h('a', { class: 'brand', href: '#/' }, h('span', { class: 'brand-mark', 'aria-hidden': 'true' }, 'AQ'), h('span', null, 'Algo Quest ', h('small', null, 'Gastmodus'))),
          h('nav', { class: 'topnav', 'aria-label': 'Hauptnavigation' }, link('#/', '👀 Übersicht', 'start'), link('#/schueler', '🎒 Schüler', 'schueler'), link('#/lehrkraft', '🧑‍🏫 Lehrkraft', 'lehrkraft'), h('a', { href: '/themen' }, '📚 Themen'), h('a', { href: '/' }, '▶ Zum Lab'))
        )
      ),
      h('main', { id: 'haupt', tabindex: '-1' }, h('p', { class: 'callout gold small gast-banner' }, h('strong', null, '👀 Gastmodus: '), 'Beispielaufgaben und erfundene Beispieldaten – nichts wird gespeichert. Das echte Lab braucht einen Kurscode deiner Lehrkraft.'), ...inhalt)
    );
    window.scrollTo(0, 0);
  }

  function fehler(e) {
    seite('start', h('p', { class: 'callout warn' }, e.message || 'Fehler beim Laden.'));
  }

  /* ---------- Auswahl ---------- */

  function start() {
    const karte = (href, icon, titel, text, punkte) =>
      h('a', { class: 'card gast-wahl', href }, h('div', { class: 'gast-icon', 'aria-hidden': 'true' }, icon), h('h2', null, titel), h('p', null, text), h('ul', null, punkte.map((p) => h('li', null, p))), h('span', { class: 'btn' }, 'Ausprobieren →'));
    seite(
      'start',
      h('h1', null, 'Algo Quest Lab ausprobieren'),
      h('p', { class: 'muted' }, 'Algo Quest ist die Übungsplattform zur Einheit „Algorithmik und Datenstrukturen“ im Informatik-LK: sieben Welten, automatisch geprüfte Aufgaben im Abitur-Stil, Bosse auf Zeit, Trainingsplatz und Warm-up-Karten. Wähle, wie du reinschnuppern möchtest:'),
      h(
        'div',
        { class: 'gast-wahlen' },
        karte('#/schueler', '🎒', 'Als Schüler', 'Löse sechs Probeaufgaben – genau so, wie sie im Lab funktionieren.', ['Tracetabelle, Struktogramm, Bug-Hunt', 'Baum anklicken, Stapel simulieren, Sortieren', 'Prüfen, Tipps, Lösung zeigen, Erklärung']),
        karte('#/lehrkraft', '🧑‍🏫', 'Als Lehrkraft', 'Sieh dir einen erfundenen Demo-Kurs an – nur lesend.', ['Schülerliste und Fortschrittsmatrix', 'Fallen-Profil P1–P10 und Aufgabenstatistik', 'Materialien und Aufgaben-Vorschau'])
      ),
      h('p', { class: 'small muted' }, 'Im echten Lab: 7 Welten · 36 Level · knapp 400 Aufgaben · 7 Bosse · Trainingsplatz · Warm-up-Trainer. Lehrkräfte erhalten einen Zugang auf Anfrage im ', h('a', { href: '/lehrer' }, 'Bereich für Lehrkräfte'), '.')
    );
  }

  /* ---------- Schüler ---------- */

  /** Beispiel-PDFs für Schüler (nur die Demo-PDFs sind ohne Anmeldung abrufbar) */
  function demoPdfs(themen) {
    if (!themen) return null;
    const liste = [];
    if (themen.werkzeugkarten && themen.werkzeugkarten.demo && themen.werkzeugkarten.url) liste.push({ titel: themen.werkzeugkarten.titel, url: themen.werkzeugkarten.url });
    for (const w of themen.welten) for (const a of [...w.arbeitsblaetter, ...(w.weitere || [])]) if (a.demo && a.url) liste.push({ titel: a.nr ? `Welt ${w.nr} · AB ${a.nr}: ${a.titel}` : a.titel, url: a.url });
    if (!liste.length) return null;
    return h(
      'section',
      { class: 'card' },
      h('h2', null, '📄 Beispiel-Arbeitsblätter (PDF)'),
      h('p', { class: 'small muted' }, 'So sehen die Arbeitsblätter aus. Alle weiteren Arbeitsblätter, Papier-Bosse und Warm-up-Karten gibt es nach der Anmeldung im Lab.'),
      h('ul', { class: 'ab-liste' }, liste.map((x) => h('li', null, h('a', { class: 'pdf', href: x.url, target: '_blank', rel: 'noopener' }, x.titel))))
    );
  }

  async function schueler() {
    try {
      const [d, themen] = await Promise.all([api('GET', '/api/gast/schueler'), api('GET', '/api/themen').catch(() => null)]);
      if (!d.vorhanden) return seite('schueler', h('p', { class: 'callout' }, 'Die Probeaufgaben sind gerade nicht verfügbar.'));
      const welten = themen ? themen.welten : [];
      seite(
        'schueler',
        h('nav', { class: 'crumbs' }, h('a', { href: '#/' }, 'Gastmodus'), '›', h('span', null, 'Schüler')),
        h(
          'section',
          { class: 'card level-kopf', style: { '--welt': d.farbe } },
          h('h1', null, `🧪 ${d.level}`),
          AQR.bloecke(d.intro, null),
          h(
            'ol',
            { class: 'aufgaben-liste gast-liste' },
            d.aufgaben.map((a, i) =>
              h('li', null, h('a', { href: `#/schueler/aufgabe/${encodeURIComponent(a.id)}` }, h('span', { class: 'nr' }, String(i + 1)), h('span', { class: 'grow' }, h('strong', null, a.titel), h('span', { class: 'small muted' }, ` ${'★'.repeat(a.stufe)} · ${a.kategorie} · ${a.arten.map((x) => ARTEN[x] || x).join(' + ')}`)), h('span', { class: 'pill gold' }, `${a.punkte} P.`)))
            )
          )
        ),
        demoPdfs(themen),
        welten.length
          ? h(
              'section',
              { class: 'card' },
              h('h2', null, '🗺️ Die Welten im echten Lab'),
              h('p', { class: 'small muted' }, 'Mit Kurscode deiner Lehrkraft geht es hier weiter – Level für Level, mit Boss am Ende jeder Welt.'),
              h('div', { class: 'chips' }, welten.map((w) => h('span', { class: 'pill', style: { borderLeft: `4px solid ${w.farbe}` } }, `🔒 ${w.nr} ${w.titel} · ${w.levels.length} Level`)))
            )
          : null
      );
    } catch (e) {
      fehler(e);
    }
  }

  async function schuelerAufgabe(id) {
    try {
      const d = await api('GET', `/api/gast/aufgaben/${encodeURIComponent(id)}`);
      const enc = encodeURIComponent(id);
      const z = zaehler.get(id) || { fehlversuche: 0, tipps: 0, angesehen: false };
      zaehler.set(id, z);
      const merke = (r) => {
        if (r && r.zustand) {
          z.fehlversuche = r.zustand.fehlversuche;
          z.tipps = r.zustand.tippsGenutzt;
        }
        return r;
      };
      const o = d.ort;
      const ansicht = AQA.ansicht({
        aufgabe: d.aufgabe,
        zustand: { ...d.zustand, fehlversuche: z.fehlversuche, tippsGenutzt: z.tipps },
        pruefen: async (body) => merke(await api('POST', `/api/gast/aufgaben/${enc}/pruefen`, { ...body, fehlversuche: z.fehlversuche, tipps: z.tipps, angesehen: z.angesehen })),
        tipp: async () => merke(await api('POST', `/api/gast/aufgaben/${enc}/tipp`, { fehlversuche: z.fehlversuche, tipps: z.tipps })),
        aufdecken: async () => {
          z.angesehen = true;
          return api('POST', `/api/gast/aufgaben/${enc}/aufdecken`, {});
        },
        punkteText: (r) => (r.punkteErhalten ? `✔ Richtig! Im echten Lab gäbe es dafür ${r.punkteErhalten} ${r.punkteErhalten === 1 ? 'Punkt' : 'Punkte'}.` : '✔ Richtig!'),
        weiter: o.nachher ? { href: `#/schueler/aufgabe/${encodeURIComponent(o.nachher)}`, text: 'Nächste Aufgabe →' } : { href: '#/schueler', text: 'Zur Übersicht →' }
      });
      seite('schueler', h('nav', { class: 'crumbs' }, h('a', { href: '#/' }, 'Gastmodus'), '›', h('a', { href: '#/schueler' }, 'Probeaufgaben'), '›', h('span', null, `Aufgabe ${o.index + 1} von ${o.anzahl}`)), ansicht);
    } catch (e) {
      fehler(e);
    }
  }

  /* ---------- Lehrkraft (Demo-Kurs, nur lesend) ---------- */

  const TABS = [
    ['schueler', '👥 Schüler'],
    ['auswertung', '📊 Auswertung'],
    ['einstellungen', '⚙️ Einstellungen'],
    ['materialien', '📂 Materialien'],
    ['vorschau', '📖 Aufgaben-Vorschau']
  ];
  let demoKurs = null;
  const gesperrt = (text) => h('button', { class: 'btn small secondary', type: 'button', disabled: true, title: 'Im Gastmodus deaktiviert' }, text);

  function heat(anteil) {
    const a = Math.max(0, Math.min(1, anteil));
    return `hsl(${Math.round(10 + a * 100)}, ${Math.round(45 + a * 15)}%, ${Math.round(94 - a * 34)}%)`;
  }

  async function lehrkraft(tab = 'schueler', arg) {
    try {
      if (!demoKurs) demoKurs = await api('GET', '/api/gast/lehrkraft');
      const d = demoKurs;
      if (!TABS.some(([k]) => k === tab)) tab = 'schueler';
      const box = h('div');
      seite(
        'lehrkraft',
        h('nav', { class: 'crumbs' }, h('a', { href: '#/' }, 'Gastmodus'), '›', h('span', null, 'Lehrkraft')),
        h('h1', null, d.kurs.name, ' ', h('span', { class: 'pill' }, d.kurs.code)),
        h('p', { class: 'small muted' }, 'Erfundener Demo-Kurs mit Beispieldaten. Im echten Lehrkraft-Bereich verwaltest du deine Kurse, siehst den Lernstand und lädst alle Materialien herunter.'),
        h('div', { class: 'tabs', role: 'tablist' }, TABS.map(([key, label]) => h('button', { type: 'button', role: 'tab', 'aria-selected': key === tab ? 'true' : 'false', onclick: () => (location.hash = `#/lehrkraft/${key}`) }, label))),
        box
      );
      ({ schueler: tabSchueler, auswertung: tabAuswertung, einstellungen: tabEinstellungen, materialien: tabMaterialien, vorschau: tabVorschau })[tab](d, box, arg);
    } catch (e) {
      fehler(e);
    }
  }

  function tabSchueler(d, box) {
    mount(
      box,
      h(
        'section',
        { class: 'card' },
        h('h2', null, `Schüler (${d.schueler.length})`),
        h(
          'div',
          { class: 'scroll-x' },
          h(
            'table',
            { class: 'liste' },
            h('thead', null, h('tr', null, h('th', null, 'Name'), h('th', null, 'Code'), h('th', { class: 'num' }, 'Punkte'), h('th', { class: 'num' }, 'gelöst'), h('th', null, 'Rang'), h('th', null, 'zuletzt aktiv'), h('th', null, 'Aktionen'))),
            h('tbody', null, d.schueler.map((s) => h('tr', null, h('td', null, h('strong', null, s.name)), h('td', { class: 'code-anzeige' }, s.code), h('td', { class: 'num' }, String(s.punkte)), h('td', { class: 'num' }, String(s.geloest)), h('td', null, s.rang), h('td', null, fmtDatum(s.zuletztAktiv)), h('td', null, h('div', { class: 'btn-row' }, gesperrt('Umbenennen'), gesperrt('Neuer Code'))))))
          )
        ),
        h('p', { class: 'hint' }, 'Schüler treten selbst bei (Kurscode + Name, Empfehlung „Vorname + Initial“) und spielen mit Name + persönlichem Code weiter. Codes kannst du jederzeit anzeigen oder neu erzeugen.')
      )
    );
  }

  function tabAuswertung(d, box) {
    const maxF = Math.max(1, ...d.fallen.map((f) => f.fehlversuche));
    mount(
      box,
      h(
        'section',
        { class: 'card' },
        h('h2', null, 'Fortschrittsmatrix (% der Level-Punkte)'),
        h(
          'div',
          { class: 'scroll-x' },
          h(
            'table',
            { class: 'liste matrix' },
            h('thead', null, h('tr', null, h('th', null, 'Name'), d.levels.map((l) => h('th', { class: 'lv', title: l.titel, scope: 'col' }, `${l.nr} ${l.titel}`)))),
            h('tbody', null, d.matrix.zeilen.map((z) => h('tr', null, h('th', { scope: 'row' }, z.name), z.werte.map((w, i) => {
              const td = h('td', { class: 'wert', title: `${d.levels[i].titel}: ${w.punkte}/${d.levels[i].maxPunkte} Punkte` }, String(Math.round(w.anteil * 100)));
              td.style.background = heat(w.anteil);
              return td;
            }))))
          )
        )
      ),
      h(
        'section',
        { class: 'card' },
        h('h2', null, 'Boss-Ergebnisse (bester Versuch)'),
        h('div', { class: 'scroll-x' }, h('table', { class: 'liste' }, h('thead', null, h('tr', null, h('th', null, 'Name'), d.boss.welten.map((w) => h('th', null, `W${w.nr}: ${w.titel}`)))), h('tbody', null, d.boss.zeilen.map((z) => h('tr', null, h('th', { scope: 'row' }, z.name), z.werte.map((w) => h('td', null, w ? `${w.punkte}/${w.max} (${prozent(w.punkte / w.max)})${w.punkte / w.max >= 0.5 ? ' 🏆' : ''} · ${w.versuche}×` : '–')))))))
      ),
      h(
        'section',
        { class: 'card' },
        h('h2', null, 'Fallen-Profil des Kurses'),
        h('p', { class: 'small muted' }, 'Fehlversuche bei Aufgaben, die einer der „Top 10 Punktverluste“ (P1–P10) zugeordnet sind – so siehst du, was im Unterricht wiederholt werden sollte.'),
        d.fallen.map((f) => h('div', { class: 'fallen-balken' }, h('span', { class: 'p' }, f.p), h('div', { class: 'bar', role: 'img', 'aria-label': `${f.p}: ${f.fehlversuche} Fehlversuche` }, h('span', { style: { width: Math.round((f.fehlversuche / maxF) * 100) + '%' } })), h('span', { class: 'n' }, String(f.fehlversuche)), h('span', { class: 't' }, `${f.titel} – betrifft ${f.schueler} von ${f.schuelerGesamt} Schülern`)))
      ),
      h(
        'section',
        { class: 'card' },
        h('h2', null, 'Aufgabenstatistik (Beispiel: Probeaufgaben)'),
        h('div', { class: 'scroll-x' }, h('table', { class: 'liste' }, h('thead', null, h('tr', null, h('th', null, 'Aufgabe'), h('th', null, 'Stufe'), h('th', { class: 'num' }, 'Lösungsquote'), h('th', { class: 'num' }, 'Ø Fehlversuche'), h('th', null, 'häufige falsche Antworten'))), h('tbody', null, d.aufgaben.map((a) => h('tr', null, h('td', null, h('strong', null, a.titel)), h('td', null, '★'.repeat(a.stufe)), h('td', { class: 'num' }, prozent(a.quote)), h('td', { class: 'num' }, a.fehlversucheSchnitt.toFixed(1)), h('td', { class: 'small' }, a.falscheAntworten.map((x) => h('div', null, h('code', null, x.antwort), ` ×${x.anzahl}`)))))))),
        h('div', { class: 'btn-row' }, gesperrt('⬇ Übersicht (CSV)'), gesperrt('⬇ Matrix (CSV)'), gesperrt('🏅 Urkunden'))
      )
    );
  }

  function tabEinstellungen(d, box) {
    const zeile = (an, text) => h('li', null, an ? '✅ ' : '⬜ ', text);
    mount(
      box,
      h(
        'section',
        { class: 'card' },
        h('h2', null, 'Einstellungen (nur Anzeige)'),
        h('ul', { class: 'gast-einstellungen' }, zeile(true, `Freigeschaltete Welten: ${d.einstellungen.welten.join(', ')} (von ${d.weltenGesamt})`), zeile(true, 'Bosse: automatisch frei ab 60 % der Level-Punkte der Welt'), zeile(d.einstellungen.scoreboard, 'Scoreboard für Schüler sichtbar'), zeile(d.einstellungen.beamer, 'Beamer-Board (Top 15, Kursfortschritt, letzte Erfolge)'), zeile(d.einstellungen.anmeldung, 'Anmeldung neuer Schüler offen')),
        h('p', { class: 'hint' }, 'Im echten Kurs schaltest du Welten Woche für Woche frei und steuerst Bosse, Scoreboard und Beamer-Board selbst.')
      )
    );
  }

  function tabMaterialien(d, box) {
    const m = d.materialien;
    mount(
      box,
      h(
        'section',
        { class: 'card' },
        h('h2', null, '📂 Materialien – Beispiel Welt 0'),
        h('p', { class: 'small muted' }, 'Im echten Lehrkraft-Bereich stehen hier zu jeder Welt alle Dateien als PDF bereit. Im Gastmodus kannst du einzelne Beispiele öffnen (Kickoff-Präsentation, Lehrerhinweise Welt 0, Arbeitsblatt „Das Portal“); alles andere erscheint nur als Titel.'),
        m.welt0.length
          ? h('div', { class: 'scroll-x' }, h('table', { class: 'liste material' }, h('thead', null, h('tr', null, h('th', null, 'Material'), h('th', null, 'PDF'))), h('tbody', null, m.welt0.map((e) => h('tr', null, h('td', null, `${SYMBOL[e.art] || '📄'} `, e.titel), h('td', null, h('div', { class: 'btn-row' }, e.dateien.map((x) => (x.url ? h('a', { class: 'btn small secondary', href: x.url, target: '_blank', rel: 'noopener' }, '📄 ' + x.label) : gesperrt('🔒 ' + x.label))))))))))
          : h('p', { class: 'muted' }, 'Keine Materialien hinterlegt.'),
        m.weitere ? h('p', { class: 'hint' }, `… und ${m.weitere} weitere Einträge für die Welten 1–6 (Arbeitsblätter mit Lösungen, Präsentationen, Lehrerhinweise, Bosse mit Erwartungshorizont, Probeklausur und Klausuren). Nach der Anmeldung als Lehrkraft sind alle Dateien abrufbar.`) : null
      )
    );
  }

  async function tabVorschau(d, box, id) {
    const s = await api('GET', '/api/gast/schueler');
    if (!id) {
      mount(box, h('section', { class: 'card' }, h('h2', null, '📖 Aufgaben-Vorschau (Probeaufgaben)'), h('p', { class: 'small muted' }, 'Lehrkräfte sehen jede Lab-Aufgabe mit eingesetzter Lösung, Tipps und Erklärung – hier am Beispiel der Probeaufgaben.'), h('ol', null, (s.aufgaben || []).map((a) => h('li', null, h('a', { href: `#/lehrkraft/vorschau/${encodeURIComponent(a.id)}` }, a.titel), h('span', { class: 'small muted' }, ` · ${a.kategorie}`))))));
      return;
    }
    const v = await api('GET', `/api/gast/vorschau/${encodeURIComponent(id)}`);
    const a = v.aufgabe;
    const ctrl = AQI.aufgabe(a, { vorschau: true });
    ctrl.loesung(v.loesung, v.muster);
    ctrl.sperren(true);
    mount(
      box,
      h('div', { class: 'aufgabe-kopf' }, h('h2', null, a.titel), sterne(a.stufe), h('span', { class: 'pill gold' }, `${a.punkte} Punkte`), h('span', { class: 'pill' }, a.kategorie), (a.fallen || []).map((p) => h('span', { class: 'pill red' }, '⚠ ' + p))),
      h('div', { class: 'callout ok small' }, 'Vorschau mit eingesetzter Lösung (blau markiert).'),
      h('section', { class: 'card' }, ctrl.el),
      v.tipps && v.tipps.length ? h('section', { class: 'card' }, h('h2', null, '💡 Tipps'), v.tipps.map((t, i) => h('div', { class: 'tipp-box' }, h('strong', null, `Tipp ${i + 1}: `), AQR.md(t, null, 'span')))) : null,
      v.erklaerung && v.erklaerung.length ? h('section', { class: 'card erklaerung' }, h('h2', null, '📖 Erklärung'), AQR.bloecke(v.erklaerung, null)) : null,
      h('div', { class: 'btn-row' }, h('a', { class: 'btn secondary', href: '#/lehrkraft/vorschau' }, '← Zur Liste'))
    );
  }

  /* ---------- Router ---------- */

  function route() {
    const [name, a, b] = location.hash.replace(/^#\/?/, '').split('/');
    if (name === 'schueler' && a === 'aufgabe' && b) return schuelerAufgabe(decodeURIComponent(b));
    if (name === 'schueler') return schueler();
    if (name === 'lehrkraft') return lehrkraft(a, b && decodeURIComponent(b));
    return start();
  }
  window.addEventListener('hashchange', route);
  window.addEventListener('error', () => toast('Unerwarteter Fehler im Gastmodus.', true));
  route();
})();
