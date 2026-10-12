/* Algo Quest Lab – Schüler-Oberfläche (Single-Page mit Hash-Routing):
 * Weltkarte, Level, Aufgabe, Trainingsplatz, Boss-Kampf, Profil, Scoreboard, Warm-up-Trainer. */
'use strict';

(async () => {
  const { h, mount, api, toast, prozent, sterne, bestaetigen, fmtDatum } = AQ;
  const app = document.getElementById('app');
  let sitzung = null;
  let einstellungen = { scoreboard: true };
  let bossTimer = null;
  let scoreboardTimer = null;

  const WELTNAMEN_ICON = { 0: '🏛️', 1: '⚒️', 2: '🏅', 3: '🌀', 4: '⚓', 5: '🌲', 6: '🐉' };
  const ART_NAMEN = {
    gaps: 'Lücken',
    choice: 'Auswahl',
    order: 'Puzzle',
    lines: 'Bug-Hunt',
    match: 'Zuordnen',
    'tree:klick': 'Baum klicken',
    'tree:bauen': 'Baum bauen',
    'array:tausch': 'Tauschen',
    'array:klick': 'Reihung klicken',
    grid: 'Raster',
    adtsim: 'ADT-Simulation'
  };

  try {
    sitzung = await api('GET', '/api/sitzung');
  } catch (e) {
    mount(app, h('main', { class: 'narrow' }, h('p', { class: 'callout warn' }, e.message)));
    return;
  }
  if (!sitzung.schueler) {
    location.href = '/';
    return;
  }

  /* ---------- Rahmen ---------- */

  function topbar(aktiv) {
    const link = (href, label, key) => h('a', { href, class: aktiv === key ? 'active' : null, 'aria-current': aktiv === key ? 'page' : null }, label);
    return h(
      'header',
      { class: 'topbar' },
      h(
        'div',
        { class: 'topbar-inner' },
        h('a', { class: 'brand', href: '#/' }, h('span', { class: 'brand-mark', 'aria-hidden': 'true' }, 'AQ'), h('span', null, 'Algo Quest ', h('small', null, 'Lab'))),
        h(
          'nav',
          { class: 'topnav', 'aria-label': 'Hauptnavigation' },
          link('#/', '🗺️ Karte', 'karte'),
          link('#/profil', '👤 Profil', 'profil'),
          einstellungen.scoreboard ? link('#/scoreboard', '🏆 Scoreboard', 'scoreboard') : null,
          link('#/kata', '🔥 Warm-up', 'kata'),
          h('a', { href: '/themen' }, '📚 Themen'),
          sitzung.verbund && sitzung.verbund.portal ? h('a', { href: sitzung.verbund.portal + '/' }, '⌂ Portal') : null,
          kursWahl(),
          h('span', { class: 'who hide-sm' }, sitzung.schueler.name),
          h('button', { type: 'button', onclick: abmelden }, 'Abmelden'),
          sitzung.schueler.portal ? h('a', { href: '/sso/abmelden' }, 'Überall abmelden') : null
        )
      )
    );
  }

  /** Portal-Schüler in mehreren Kursen: Kurs wechseln */
  function kursWahl() {
    const kurse = sitzung.schueler.kurse || [];
    if (kurse.length < 2) return null;
    const sel = h('select', { 'aria-label': 'Kurs wechseln', class: 'kurs-wahl' }, kurse.map((k) => h('option', { value: String(k.id), selected: k.aktuell }, k.name)));
    sel.addEventListener('change', async () => {
      try {
        await api('POST', '/api/kurs-wechseln', { kursId: Number(sel.value) });
        location.hash = '#/';
        location.reload();
      } catch (e) {
        AQ.toast(e.message, true);
      }
    });
    return sel;
  }

  async function abmelden() {
    const ok = await bestaetigen('Abmelden?', sitzung.schueler.portal ? 'Du meldest dich nur hier ab. Über das Portal kommst du jederzeit wieder herein.' : 'Zum Weiterspielen brauchst du deinen Namen und deinen persönlichen Code. Hast du ihn notiert?', { ok: 'Abmelden' });
    if (!ok) return;
    try {
      await api('POST', '/api/schueler/abmelden', {});
    } catch {
      /* egal */
    }
    location.href = '/';
  }

  function seite(aktiv, ...inhalt) {
    mount(app, h('a', { class: 'skip', href: '#haupt' }, 'Zum Inhalt springen'), topbar(aktiv), h('main', { id: 'haupt', tabindex: '-1' }, ...inhalt));
    window.scrollTo(0, 0);
  }

  function lade(aktiv) {
    seite(aktiv, h('p', { class: 'muted', 'aria-live': 'polite' }, 'Lädt …'));
  }

  function fehlerSeite(e, aktiv = '') {
    if (e.status === 401) {
      location.href = '/';
      return;
    }
    seite(aktiv, h('div', { class: 'callout warn' }, h('p', null, e.message)), h('a', { class: 'btn secondary', href: '#/' }, 'Zur Weltkarte'));
  }

  function weltStil(farbe) {
    return { '--welt': farbe || '#1F4E79' };
  }

  function abzeichenToast(neu) {
    if (!neu || !neu.length) return;
    neu.forEach((b, i) =>
      setTimeout(() => {
        toast(`${b.icon} Neues Abzeichen: ${b.name}`, 'gold');
        AQ.effekt.funken(document.getElementById('toast'), { stark: true });
      }, 1800 * i + 600)
    );
  }

  /* ---------- Weltkarte ---------- */

  async function karte() {
    lade('karte');
    try {
      const [w, p] = await Promise.all([api('GET', '/api/welten'), api('GET', '/api/profil')]);
      einstellungen.scoreboard = w.scoreboard;
      einstellungen.kursart = w.kursart;
      const kopf = h(
        'section',
        { class: 'card held-kopf' },
        h(
          'div',
          { class: 'row' },
          h('div', { class: 'grow' }, h('h1', null, `Hallo ${p.name}!`), h('p', { class: 'muted' }, `Kurs „${p.kurs.name}“ · Rang `, h('strong', null, p.rang.name), p.rang.naechster ? ` · nächster Rang „${p.rang.naechster.name}“ ab ${Math.round(p.rang.naechster.ab * 100)} % der Level-Punkte` : ' · höchster Rang erreicht!')),
          h('div', { class: 'stat gold' }, h('div', { class: 'n' }, String(p.punkte.gesamt)), h('div', { class: 'l' }, 'Punkte')),
          h('div', { class: 'stat' }, h('div', { class: 'n' }, String(p.abzeichen.filter((a) => a.erhalten).length)), h('div', { class: 'l' }, 'Abzeichen'))
        ),
        AQ.progress(p.rang.anteil, 'gold'),
        w.kursart === 'gA' ? h('p', { class: 'small kursart-hinweis' }, '📘 Grundkurs: Level mit „LK“ gehören im Abitur nur zum Leistungskurs – für dich freiwillig. „+“ geht über das Kerncurriculum hinaus.') : null
      );
      if (!w.welten.length) {
        seite('karte', kopf, h('div', { class: 'callout' }, 'Noch sind keine Welten geladen. Frag deine Lehrkraft.'));
        return;
      }
      const markierung = { gesetzt: false }; // nächstes offenes Level leuchtet („Hier geht’s weiter“)
      const karten = w.welten.map((welt) => weltKarte(welt, markierung));
      seite('karte', kopf, h('h2', { class: 'sr-only' }, 'Weltkarte'), h('div', { class: 'karte' }, karten));
    } catch (e) {
      fehlerSeite(e, 'karte');
    }
  }

  function ring(anteil, inhalt) {
    return h('div', { class: 'ring', style: { '--p': Math.round(Math.max(0, Math.min(1, anteil)) * 100) + '%' } }, h('span', null, inhalt));
  }

  function weltKarte(w, markierung = { gesetzt: true }) {
    const knoten = [];
    w.levels.forEach((l, i) => {
      if (i) knoten.push(h('span', { class: 'verbinder', 'aria-hidden': 'true' }));
      const fertig = l.anzahl && l.geloest >= l.anzahl;
      const aktuell = w.frei && !fertig && !markierung.gesetzt;
      if (aktuell) markierung.gesetzt = true;
      knoten.push(
        h(
          'a',
          { class: 'lvl' + (fertig ? ' fertig' : '') + (aktuell ? ' aktuell' : ''), 'aria-current': aktuell ? 'step' : null, href: w.frei ? `#/level/${encodeURIComponent(l.id)}` : null, 'aria-label': `Level ${l.nr} ${l.titel}: ${l.geloest} von ${l.anzahl} Aufgaben gelöst, ${l.punkte} von ${l.maxPunkte} Punkten` },
          AQ.niveau(l.niveau, { art: 'tag', gemischt: l.gemischt }),
          ring(l.anteil, fertig ? '✓' : l.nr || String(i + 1)),
          h('span', { class: 't' }, l.titel),
          h('span', { class: 's' }, `${l.geloest}/${l.anzahl} · ${l.punkte} P.`)
        )
      );
    });
    if (w.training) {
      knoten.push(h('span', { class: 'verbinder', 'aria-hidden': 'true' }));
      knoten.push(h('a', { class: 'lvl training', href: w.frei ? `#/training/${w.nr}` : null, 'aria-label': 'Trainingsplatz' }, ring(1, '🎯'), h('span', { class: 't' }, 'Trainingsplatz'), h('span', { class: 's' }, 'Zufallsaufgaben')));
    }
    if (w.boss) {
      const b = w.boss;
      const anteil = b.bester && b.bester.max ? b.bester.punkte / b.bester.max : 0;
      knoten.push(h('span', { class: 'verbinder', 'aria-hidden': 'true' }));
      knoten.push(
        h(
          'a',
          { class: 'lvl boss' + (b.frei ? ' bereit' : ' gesperrt') + (b.besiegt ? ' besiegt' : ''), href: w.frei ? `#/boss/${w.nr}` : null, 'aria-label': `Boss ${b.titel}` + (b.frei ? '' : ' (gesperrt)') + (b.besiegt ? ', besiegt' : '') },
          AQ.niveau(b.niveau, { art: 'tag', gemischt: b.gemischt }),
          ring(anteil, b.besiegt ? '🏆' : b.frei ? '⚔️' : '🔒'),
          h('span', { class: 't' }, b.titel),
          h('span', { class: 's' }, b.bester ? `bester: ${b.bester.punkte}/${b.bester.max}` : b.frei ? 'bereit!' : 'gesperrt')
        )
      );
    }
    return h(
      'section',
      { class: 'welt-karte' + (w.frei ? '' : ' gesperrt'), style: weltStil(w.farbe), 'aria-label': `Welt ${w.nr}: ${w.titel}` + (w.frei ? '' : ' (gesperrt)') },
      h(
        'div',
        { class: 'welt-kopf' },
        h('div', { class: 'welt-nr', 'aria-hidden': 'true' }, String(w.nr)),
        h('div', { class: 'grow' }, h('h2', null, `${WELTNAMEN_ICON[w.nr] || '✨'} ${w.titel}`), h('div', { class: 'meta' }, w.frei ? `${w.punkte} von ${w.maxPunkte} Level-Punkten (${prozent(w.anteil)})` : '🔒 noch nicht freigeschaltet'))
      ),
      h('div', { class: 'welt-pfad' }, knoten)
    );
  }

  /* ---------- Level ---------- */

  async function level(id) {
    lade('karte');
    try {
      const d = await api('GET', `/api/levels/${encodeURIComponent(id)}`);
      const l = d.level;
      einstellungen.kursart = d.kursart;
      const liste = h(
        'div',
        { class: 'aufgaben-liste' },
        d.aufgaben.map((a, i) =>
          h(
            'a',
            { class: 'aufgabe-zeile ' + (a.status === 'geloest' || a.nachgeloest ? 'geloest' : a.status), href: `#/aufgabe/${encodeURIComponent(a.id)}` },
            h('span', { class: 'nr' }, a.status === 'geloest' || a.nachgeloest ? '✓' : String(i + 1)),
            h('span', { class: 'grow' }, h('div', { class: 'titel' }, a.titel), h('div', { class: 'small muted' }, sterne(a.stufe), ' · ', a.kategorie, ' · ', a.arten.map((x) => ART_NAMEN[x] || x).join(' + '))),
            statusChip(a),
            a.niveau !== 'alle' ? AQ.niveau(a.niveau, { kursart: d.kursart }) : null,
            h('span', { class: 'pill gold' }, a.status === 'offen' ? `${a.punkte} P.` : `${a.erreicht}/${a.punkte} P.`)
          )
        )
      );
      const ide = l.ide
        ? h(
            'section',
            { class: 'card ide-karte' },
            h('h2', null, '💻 Programmieren in der Online-IDE'),
            h('p', null, l.ide),
            h('p', { class: 'hint' }, 'Diese Aufgaben bearbeitest du in der Online-IDE (online-ide.de). Das Häkchen ist nur für deinen Überblick und bringt keine Punkte.'),
            h('label', { class: 'check' }, (() => {
              const cb = h('input', { type: 'checkbox', checked: d.ideErledigt });
              cb.addEventListener('change', async () => {
                try {
                  await api('POST', `/api/levels/${encodeURIComponent(l.id)}/ide`, { erledigt: cb.checked });
                  toast(cb.checked ? 'Als erledigt markiert.' : 'Markierung entfernt.');
                } catch (e) {
                  toast(e.message, true);
                  cb.checked = !cb.checked;
                }
              });
              return cb;
            })(), 'In der IDE erledigt')
          )
        : null;
      seite(
        'karte',
        h('nav', { class: 'crumbs', 'aria-label': 'Brotkrumen' }, h('a', { href: '#/' }, 'Weltkarte'), '›', h('span', null, `Welt ${d.welt.nr}: ${d.welt.titel}`)),
        h(
          'section',
          { class: 'card level-kopf', style: weltStil(d.welt.farbe) },
          h('h1', null, `Level ${l.nr} – ${l.titel}`),
          h('p', { class: 'niveau-zeile' }, AQ.niveau(l.niveau, { gemischt: l.gemischt, kursart: d.kursart, alleZeigen: true })),
          h('p', { class: 'muted small' }, [l.ds && l.ds.length ? `DS ${l.ds.join(', ')}` : null, l.ab ? `Arbeitsblatt: ${l.ab}` : null, `${l.maxPunkte} Punkte erreichbar`].filter(Boolean).join(' · ')),
          l.intro && l.intro.length ? AQR.bloecke(l.intro, null) : null
        ),
        h('section', { class: 'card' }, h('h2', null, 'Aufgaben'), liste),
        ide,
        h('div', { class: 'btn-row' }, d.vorher ? h('a', { class: 'btn secondary', href: `#/level/${encodeURIComponent(d.vorher.id)}` }, '← ' + d.vorher.titel) : null, h('a', { class: 'btn secondary', href: '#/' }, 'Weltkarte'), d.nachher ? h('a', { class: 'btn secondary right', href: `#/level/${encodeURIComponent(d.nachher.id)}` }, d.nachher.titel + ' →') : null)
      );
    } catch (e) {
      fehlerSeite(e, 'karte');
    }
  }

  function statusChip(a) {
    if (a.status === 'geloest') return h('span', { class: 'status-chip st-geloest' }, 'gelöst');
    if (a.status === 'angesehen') return h('span', { class: 'status-chip st-angesehen' }, a.nachgeloest ? 'Lösung angesehen · nachgelöst' : 'Lösung angesehen');
    return h('span', { class: 'status-chip st-offen' }, 'offen');
  }

  /* ---------- Aufgabe (gemeinsam für Level und Training): aufgabe.js ---------- */

  const aufgabenAnsicht = (cfg) => AQA.ansicht({ abzeichenToast, kursart: einstellungen.kursart, ...cfg });

  async function aufgabe(id) {
    lade('karte');
    try {
      const d = await api('GET', `/api/aufgaben/${encodeURIComponent(id)}`);
      const o = d.ort;
      const enc = encodeURIComponent(id);
      const ansicht = aufgabenAnsicht({
        aufgabe: d.aufgabe,
        zustand: d.zustand,
        loesung: d.loesung,
        muster: d.muster,
        erklaerung: d.erklaerung,
        pruefen: (body) => api('POST', `/api/aufgaben/${enc}/pruefen`, body),
        tipp: () => api('POST', `/api/aufgaben/${enc}/tipp`, {}),
        aufdecken: () => api('POST', `/api/aufgaben/${enc}/aufdecken`, {}),
        weiter: o.nachher ? { href: `#/aufgabe/${encodeURIComponent(o.nachher)}`, text: 'Nächste Aufgabe →' } : { href: `#/level/${encodeURIComponent(o.level.id)}`, text: 'Zurück zum Level →' }
      });
      seite(
        'karte',
        h('nav', { class: 'crumbs', 'aria-label': 'Brotkrumen' }, h('a', { href: '#/' }, 'Weltkarte'), '›', h('a', { href: `#/level/${encodeURIComponent(o.level.id)}` }, `Level ${o.level.nr} – ${o.level.titel}`), '›', h('span', null, `Aufgabe ${o.index + 1} von ${o.anzahl}`)),
        h('div', { style: weltStil(o.welt.farbe) }, ansicht)
      );
    } catch (e) {
      fehlerSeite(e, 'karte');
    }
  }

  /* ---------- Trainingsplatz ---------- */

  async function training(welt) {
    lade('karte');
    let info;
    try {
      info = await api('GET', `/api/training/${welt}`);
    } catch (e) {
      return fehlerSeite(e, 'karte');
    }
    let wahl = AQ.lade('aql_training_' + welt, '');
    if (wahl && !info.generatoren.some((g) => g.key === wahl)) wahl = '';
    const stand = h('p', { class: 'muted', 'aria-live': 'polite' });
    const box = h('div');
    function zeigeStand() {
      stand.textContent = `Heute: ${info.heute} von ${info.maxProTag} Trainingspunkten · insgesamt ${info.geloestGesamt} Trainingsaufgaben gelöst.`;
    }
    const seg = h(
      'div',
      { class: 'seg', role: 'group', 'aria-label': 'Aufgabentyp' },
      [{ key: '', titel: '🎲 Zufall' }, ...info.generatoren].map((g) =>
        h('button', { type: 'button', 'aria-pressed': wahl === g.key ? 'true' : 'false', onclick: (e) => {
          wahl = g.key;
          AQ.speichere('aql_training_' + welt, wahl);
          seg.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', 'false'));
          e.currentTarget.setAttribute('aria-pressed', 'true');
          neu();
        } }, g.titel)
      )
    );
    async function zeige(t) {
      const enc = t.id;
      mount(
        box,
        aufgabenAnsicht({
          aufgabe: t.aufgabe,
          zustand: { status: t.status, fehlversuche: t.fehlversuche, tipps: [], tippsGenutzt: 0, punkte: t.punkte, moeglich: 1 },
          loesung: t.loesung,
          muster: t.muster,
          erklaerung: t.erklaerung,
          pruefen: async (body) => {
            const r = await api('POST', `/api/training/aufgabe/${enc}/pruefen`, body);
            info.heute = r.heute;
            if (r.geloest) info.geloestGesamt++;
            zeigeStand();
            return { ...r, zustand: { status: r.status, fehlversuche: r.fehlversuche, tipps: [], tippsGenutzt: 0, punkte: r.punkteErhalten, moeglich: info.heute < info.maxProTag ? 1 : 0 } };
          },
          aufdecken: async () => {
            const r = await api('POST', `/api/training/aufgabe/${enc}/aufdecken`, {});
            return { ...r, zustand: { status: r.status, fehlversuche: r.fehlversuche, tipps: [], tippsGenutzt: 0, punkte: 0, moeglich: 0 } };
          },
          weiter: { href: `#/training/${welt}`, text: 'Neue Aufgabe →', onclick: (e) => {
            e.preventDefault();
            neu();
          } },
          kopfZusatz: info.heute >= info.maxProTag ? h('span', { class: 'pill grey' }, 'Tageslimit erreicht – weiter üben ohne Punkte') : null
        })
      );
    }
    async function neu() {
      try {
        const t = await api('POST', `/api/training/${welt}/neu`, wahl ? { generator: wahl } : {});
        await zeige(t);
      } catch (e) {
        toast(e.message, true);
      }
    }
    zeigeStand();
    seite(
      'karte',
      h('nav', { class: 'crumbs' }, h('a', { href: '#/' }, 'Weltkarte'), '›', h('span', null, `Trainingsplatz Welt ${welt}`)),
      h('section', { class: 'card', style: weltStil(info.welt.farbe) }, h('h1', null, `🎯 Trainingsplatz – ${info.welt.titel}`), h('p', null, 'Zufällig erzeugte Übungsaufgaben. Jede gelöste Aufgabe bringt 1 Punkt (höchstens 30 Punkte pro Tag).'), stand, seg),
      h('div', { style: weltStil(info.welt.farbe) }, box)
    );
    if (info.offen) {
      try {
        await zeige(await api('GET', `/api/training/aufgabe/${info.offen}`));
      } catch {
        neu();
      }
    } else neu();
  }

  /* ---------- Boss ---------- */

  async function boss(welt) {
    lade('karte');
    try {
      const st = await api('GET', `/api/boss/${welt}`);
      const best = st.bester;
      const startKnopf = st.laufend
        ? h('a', { class: 'btn gold big', href: `#/kampf/${st.laufend.id}` }, '⚔️ Kampf fortsetzen')
        : h('button', { class: 'btn gold big', type: 'button', disabled: !st.frei || !!st.gesperrtBis, onclick: async () => {
            const ok = await bestaetigen('Boss-Kampf starten?', `Du hast ${st.boss.dauerMin} Minuten für ${st.boss.anzahl} Aufgaben. Der Timer läuft sofort und auch weiter, wenn du die Seite verlässt. Während des Kampfes gibt es kein Feedback – du kannst deine Antworten bis zum Ende ändern.`, { ok: 'Kampf beginnen!' });
            if (!ok) return;
            try {
              const k = await api('POST', `/api/boss/${welt}/start`, {});
              location.hash = `#/kampf/${k.id}`;
            } catch (e) {
              toast(e.message, true);
            }
          } }, '⚔️ Kampf beginnen');
      seite(
        'karte',
        h('nav', { class: 'crumbs' }, h('a', { href: '#/' }, 'Weltkarte'), '›', h('span', null, `Boss Welt ${welt}`)),
        h('div', { class: 'boss-kopf' }, h('div', { class: 'welt-nr' }, '🐉'), h('div', null, h('h1', null, st.boss.titel), h('div', null, `Welt ${st.welt.nr}: ${st.welt.titel}`))),
        h('div', { class: 'spacer' }),
        h(
          'section',
          { class: 'card' },
          h('ul', null, h('li', null, `${st.boss.anzahl} Aufgaben, ${st.boss.dauerMin} Minuten Zeit`), h('li', null, 'Kein Feedback während des Kampfes – Auswertung am Ende'), h('li', null, 'Besiegt ab 50 % der Punkte; es zählt dein bester Versuch'), h('li', null, 'Nach einem Kampf: 12 Stunden Pause bis zum nächsten Versuch')),
          !st.frei ? h('div', { class: 'callout warn' }, '🔒 ', st.grund) : null,
          st.gesperrtBis ? h('div', { class: 'callout gold' }, `⏳ Nächster Versuch ab ${fmtDatum(st.gesperrtBis)}.`) : null,
          best ? h('div', { class: 'callout ' + (best.besiegt ? 'ok' : '') }, `Bester Versuch: ${best.punkte} von ${best.maxPunkte} Punkten (${prozent(best.anteil)})`, best.besiegt ? ' – 🏆 besiegt!' : '') : null,
          startKnopf
        ),
        st.versuche.length
          ? h('section', { class: 'card' }, h('h2', null, 'Deine Versuche'), h('div', { class: 'scroll-x' }, h('table', { class: 'liste' }, h('thead', null, h('tr', null, h('th', null, 'Beendet'), h('th', { class: 'num' }, 'Punkte'), h('th', null, ''))), h('tbody', null, st.versuche.map((v) => h('tr', null, h('td', null, fmtDatum(v.ende)), h('td', { class: 'num' }, `${v.punkte}/${v.maxPunkte}`), h('td', null, h('a', { href: `#/kampf/${v.id}` }, 'Auswertung ansehen'))))))))
          : null
      );
    } catch (e) {
      fehlerSeite(e, 'karte');
    }
  }

  async function kampf(id) {
    lade('karte');
    let k;
    try {
      k = await api('GET', `/api/boss/kampf/${id}`);
    } catch (e) {
      return fehlerSeite(e, 'karte');
    }
    if (!k.laeuft) return kampfErgebnis(k);
    const versatz = Date.parse(k.serverZeit) - Date.now();
    const deadline = Date.parse(k.deadline);
    let aktuell = 0;
    const antworten = new Map(k.aufgaben.map((a) => [a.id, a.antwort]));
    const ctrls = new Map();
    const timerEl = h('div', { class: 'timer', role: 'timer', 'aria-live': 'off' }, '--:--');
    const nav = h('div', { class: 'boss-nav', role: 'tablist', 'aria-label': 'Aufgaben im Kampf' });
    const box = h('div');
    const speicherStatus = h('span', { class: 'small muted', 'aria-live': 'polite' });
    let speicherTimer = null;
    let beendet = false;

    async function speichere(aid) {
      const c = ctrls.get(aid);
      if (!c || beendet) return;
      const antwort = c.antwort();
      try {
        await api('PUT', `/api/boss/kampf/${id}/antwort`, { aufgabeId: aid, antwort });
        antworten.set(aid, antwort);
        speicherStatus.textContent = 'Antwort gespeichert ✓';
        zeichneNav();
      } catch (e) {
        if (e.status === 409) return beenden(true);
        speicherStatus.textContent = 'Speichern fehlgeschlagen: ' + e.message;
      }
    }

    function zeichneNav() {
      AQ.clear(nav);
      k.aufgaben.forEach((a, i) => {
        const beantwortet = antworten.get(a.id) !== null && antworten.get(a.id) !== undefined;
        nav.appendChild(h('button', { type: 'button', role: 'tab', 'aria-selected': i === aktuell ? 'true' : 'false', class: (beantwortet ? 'beantwortet ' : '') + (i === aktuell ? 'aktuell' : ''), 'aria-label': `Aufgabe ${i + 1}${beantwortet ? ', beantwortet' : ''}`, onclick: () => gehe(i) }, String(i + 1)));
      });
    }

    async function gehe(i) {
      const alt = k.aufgaben[aktuell];
      if (alt && ctrls.get(alt.id) && speicherTimer) {
        clearTimeout(speicherTimer);
        speicherTimer = null;
        await speichere(alt.id);
      }
      aktuell = i;
      zeichneNav();
      zeigeAufgabe();
    }

    function zeigeAufgabe() {
      const a = k.aufgaben[aktuell];
      let c = ctrls.get(a.id);
      if (!c) {
        c = AQI.aufgabe(a, {
          onChange: () => {
            speicherStatus.textContent = 'ungespeichert …';
            clearTimeout(speicherTimer);
            speicherTimer = setTimeout(() => {
              speicherTimer = null;
              speichere(a.id);
            }, 700);
          }
        });
        c.setze(antworten.get(a.id));
        ctrls.set(a.id, c);
      }
      mount(
        box,
        h(
          'section',
          { class: 'card' },
          h('div', { class: 'aufgabe-kopf' }, h('h2', null, `Aufgabe ${aktuell + 1}: ${a.titel}`), sterne(a.stufe), h('span', { class: 'pill gold' }, `${a.punkte} Punkte`)),
          c.el
        ),
        h(
          'div',
          { class: 'aktionen' },
          h('div', { class: 'btn-row' }, h('button', { class: 'btn secondary', type: 'button', disabled: aktuell === 0, onclick: () => gehe(aktuell - 1) }, '← Zurück'), h('button', { class: 'btn', type: 'button', onclick: () => speichere(a.id) }, '💾 Antwort speichern'), aktuell < k.aufgaben.length - 1 ? h('button', { class: 'btn secondary', type: 'button', onclick: () => gehe(aktuell + 1) }, 'Weiter →') : null, speicherStatus, h('button', { class: 'btn danger right', type: 'button', onclick: () => beenden(false) }, '🏁 Kampf beenden'))
        )
      );
    }

    async function beenden(automatisch) {
      if (beendet) return;
      if (!automatisch) {
        const offen = k.aufgaben.filter((a) => antworten.get(a.id) === null || antworten.get(a.id) === undefined).length;
        const ok = await bestaetigen('Kampf beenden?', offen ? `${offen} Aufgabe(n) sind noch unbeantwortet. Danach wird ausgewertet.` : 'Danach wird ausgewertet – Antworten können nicht mehr geändert werden.', { ok: 'Beenden und auswerten' });
        if (!ok) return;
        const a = k.aufgaben[aktuell];
        if (speicherTimer) {
          clearTimeout(speicherTimer);
          speicherTimer = null;
        }
        await speichere(a.id);
      }
      beendet = true;
      clearInterval(bossTimer);
      try {
        const r = await api('POST', `/api/boss/kampf/${id}/beenden`, {});
        if (automatisch) toast('⏰ Die Zeit ist abgelaufen – der Kampf wurde ausgewertet.', 'gold');
        kampfErgebnis(r);
      } catch (e) {
        fehlerSeite(e, 'karte');
      }
    }

    function tick() {
      const rest = deadline - (Date.now() + versatz);
      const sek = Math.max(0, Math.ceil(rest / 1000));
      timerEl.textContent = `${String(Math.floor(sek / 60)).padStart(2, '0')}:${String(sek % 60).padStart(2, '0')}`;
      timerEl.classList.toggle('knapp', sek <= 60);
      timerEl.setAttribute('aria-label', `noch ${Math.floor(sek / 60)} Minuten ${sek % 60} Sekunden`);
      if (rest <= 0) {
        const a = k.aufgaben[aktuell];
        if (speicherTimer) {
          clearTimeout(speicherTimer);
          speicherTimer = null;
          speichere(a.id).finally(() => beenden(true));
        } else beenden(true);
      }
    }
    clearInterval(bossTimer);
    bossTimer = setInterval(tick, 500);
    tick();
    seite('karte', h('div', { class: 'boss-kopf' }, h('div', { class: 'welt-nr' }, '⚔️'), h('div', null, h('h1', null, k.titel), h('div', null, 'Kein Feedback während des Kampfes. Antworten werden automatisch gespeichert.')), timerEl), nav, box);
    zeichneNav();
    zeigeAufgabe();
  }

  function kampfErgebnis(k) {
    clearInterval(bossTimer);
    const liste = k.aufgaben.map((a, i) => {
      const details = h('details', { class: 'card' });
      const sum = h('summary', null, h('strong', null, `${a.ok ? '✔' : '✘'} Aufgabe ${i + 1}: ${a.titel}`), ' ', h('span', { class: 'pill ' + (a.ok ? 'green' : 'red') }, `${a.erreicht}/${a.punkte} Punkte`));
      details.appendChild(sum);
      details.addEventListener(
        'toggle',
        () => {
          if (!details.open || details.dataset.geladen) return;
          details.dataset.geladen = '1';
          if (!a.interaktion) return;
          const c = AQI.aufgabe(a, {});
          c.setze(a.antwort);
          c.sperren(true);
          details.append(h('h3', null, 'Deine Antwort'), c.el);
          const c2 = AQI.aufgabe(a, {});
          c2.loesung(a.loesung, a.muster);
          c2.sperren(true);
          details.append(h('h3', null, 'Lösung'), c2.el);
          if (a.erklaerung && a.erklaerung.length) details.append(h('div', { class: 'card erklaerung' }, h('h3', null, 'Erklärung'), AQR.bloecke(a.erklaerung, null)));
        },
        { once: false }
      );
      return details;
    });
    seite(
      'karte',
      h('nav', { class: 'crumbs' }, h('a', { href: '#/' }, 'Weltkarte'), '›', h('a', { href: `#/boss/${k.welt.nr}` }, k.titel), '›', h('span', null, 'Auswertung')),
      h('section', { class: 'card boss-ergebnis' + (k.besiegt ? ' besiegt' : '') }, h('h1', null, k.besiegt ? `🏆 ${k.titel} besiegt!` : `${k.titel} – diesmal nicht besiegt`), h('div', { class: 'gross' }, `${k.punkte} / ${k.maxPunkte}`), h('p', null, `${prozent(k.anteil)} der Punkte · ${k.aufgaben.filter((a) => a.ok).length} von ${k.aufgaben.length} Aufgaben richtig`), AQ.progress(k.anteil, 'gold'), h('p', { class: 'hint' }, 'Es zählt dein bester Versuch. Ein neuer Versuch ist nach 12 Stunden möglich.')),
      h('h2', null, 'Auswertung je Aufgabe'),
      liste,
      h('a', { class: 'btn secondary', href: '#/' }, 'Zur Weltkarte')
    );
    if (k.besiegt) setTimeout(() => AQ.effekt.funken(document.querySelector('.boss-ergebnis h1'), { stark: true }), 250);
  }

  /* ---------- Profil ---------- */

  async function profil() {
    lade('profil');
    try {
      const p = await api('GET', '/api/profil');
      einstellungen.scoreboard = p.scoreboard;
      const codeEl = h('span', { class: 'code-anzeige' }, '••• – •••');
      const maxFallen = Math.max(1, ...p.fallen.map((f) => f.fehlversuche));
      const erhalten = p.abzeichen.filter((a) => a.erhalten);
      seite(
        'profil',
        h('h1', null, `Profil: ${p.name}`),
        h(
          'section',
          { class: 'stat-grid' },
          h('div', { class: 'stat gold' }, h('div', { class: 'n' }, String(p.punkte.gesamt)), h('div', { class: 'l' }, `Punkte (Level ${p.punkte.level} · Boss ${p.punkte.boss} · Training ${p.punkte.training})`)),
          h('div', { class: 'stat' }, h('div', { class: 'n text' }, p.rang.name), h('div', { class: 'l' }, `Rang · ${prozent(p.rang.anteil)} der Level-Punkte`)),
          h('div', { class: 'stat' }, h('div', { class: 'n' }, String(p.geloest)), h('div', { class: 'l' }, 'gelöste Aufgaben')),
          h('div', { class: 'stat' }, h('div', { class: 'n' }, `${erhalten.length}/${p.abzeichen.length}`), h('div', { class: 'l' }, 'Abzeichen')),
          h('div', { class: 'stat' }, h('div', { class: 'n' }, String(p.serie.serie)), h('div', { class: 'l' }, `Serie ohne Fehlversuch (Rekord ${p.serie.serie_max})`))
        ),
        h('div', { class: 'spacer' }),
        h(
          'section',
          { class: 'card' },
          h('h2', null, 'Rang'),
          h('p', null, `Du bist `, h('strong', null, p.rang.name), p.rang.naechster ? ` – bis „${p.rang.naechster.name}“ fehlen ${Math.max(0, Math.ceil(p.rang.naechster.ab * p.rang.maxPunkte) - p.rang.punkte)} Level-Punkte.` : ' – höchster Rang!'),
          AQ.progress(p.rang.anteil, 'gold'),
          h('p', { class: 'hint' }, 'Ränge: Novize 0 % · Lehrling 10 % · Geselle 30 % · Meister 55 % · Großmeister 80 % der Level-Punkte aller freigeschalteten Welten.')
        ),
        h('section', { class: 'card' }, h('h2', null, '🏅 Abzeichen'), h('div', { class: 'abzeichen-grid' }, p.abzeichen.map((a) => h('div', { class: 'abzeichen' + (a.erhalten ? '' : ' fehlt'), title: a.beschreibung }, h('div', { class: 'ic', 'aria-hidden': 'true' }, a.icon), h('div', { class: 'nm' }, a.name), h('div', { class: 'bs' }, a.erhalten ? `erhalten am ${new Date(a.am).toLocaleDateString('de-DE')}` : a.beschreibung))))),
        h('section', { class: 'card' }, h('h2', null, '🗺️ Fortschritt je Welt'), p.welten.map((w) => h('div', { class: 'board-welt', style: weltStil(w.farbe) }, h('div', { class: 'row' }, h('strong', null, `Welt ${w.nr}: ${w.titel}`), h('span', { class: 'right small muted' }, `${w.punkte}/${w.maxPunkte} Level-Punkte` + (w.boss ? ` · Boss ${w.boss.punkte}/${w.boss.max}` : '') + (w.training ? ` · Training ${w.training}` : ''))), AQ.progress(w.maxPunkte ? w.punkte / w.maxPunkte : 0, 'welt')))),
        h(
          'section',
          { class: 'card' },
          h('h2', null, '⚠️ Deine Fallen'),
          h('p', { class: 'muted small' }, 'Fehlversuche bei Aufgaben, die zu einer der „Top 10 Punktverluste“ im Abitur gehören. Trainiere gezielt die längsten Balken!'),
          p.fallen.map((f) => h('div', { class: 'fallen-balken' }, h('span', { class: 'p' }, f.p), h('div', { class: 'bar', role: 'img', 'aria-label': `${f.p} ${f.titel}: ${f.fehlversuche} Fehlversuche` }, h('span', { style: { width: Math.round((f.fehlversuche / maxFallen) * 100) + '%' } })), h('span', { class: 'n' }, String(f.fehlversuche)), h('span', { class: 't' }, `${f.titel} – ${f.text}`)))
        ),
        h(
          'section',
          { class: 'card' },
          h('h2', null, '🔑 Dein Zugang'),
          p.portal ? h('p', null, `Kurs „${p.kurs.name}“ · Name `, h('strong', null, p.name)) : null,
          p.portal ? h('p', { class: 'hint' }, 'Du bist über das Portal InfoLabs angemeldet. Name und persönlichen Code verwaltest du dort.') : null,
          p.portal ? null : h('p', null, `Kurs „${p.kurs.name}“ (Kurscode `, h('strong', null, p.kurs.code), ') · Name ', h('strong', null, p.name)),
          p.portal ? null : h('p', null, 'Persönlicher Code: ', codeEl, ' ', h('button', { class: 'btn secondary small', type: 'button', onclick: (e) => {
            codeEl.textContent = codeEl.textContent.includes('•') ? p.code : '••• – •••';
            e.currentTarget.textContent = codeEl.textContent.includes('•') ? 'Code anzeigen' : 'Code verbergen';
          } }, 'Code anzeigen')),
          p.portal ? null : h('p', { class: 'hint' }, 'Mit Name und Code kannst du auf jedem Gerät weiterspielen. Code vergessen? Deine Lehrkraft kann ihn dir anzeigen.')
        )
      );
    } catch (e) {
      fehlerSeite(e, 'profil');
    }
  }

  /* ---------- Scoreboard ---------- */

  function scoreboardKarte(d) {
    return h(
      'section',
      { class: 'card' },
      d.liste.length
        ? h('div', { class: 'scroll-x' }, h('table', { class: 'liste' }, h('thead', null, h('tr', null, h('th', null, 'Platz'), h('th', null, 'Name'), h('th', { class: 'num' }, 'Punkte'), h('th', { class: 'num' }, 'Abzeichen'))), h('tbody', null, d.liste.map((r) => h('tr', { class: r.ich ? 'ich' : null, 'aria-current': r.ich ? 'true' : null }, h('td', null, r.platz <= 3 ? ['🥇', '🥈', '🥉'][r.platz - 1] + ' ' + r.platz : String(r.platz)), h('td', null, r.name + (r.ich ? ' (du)' : '')), h('td', { class: 'num' }, String(r.punkte)), h('td', { class: 'num' }, String(r.abzeichen)))))))
        : h('p', { class: 'muted' }, 'Noch keine Einträge.'),
      h('p', { class: 'hint' }, `Aktualisiert sich alle 20 s (zuletzt ${new Date().toLocaleTimeString('de-DE')}).`)
    );
  }

  async function scoreboard(welt) {
    lade('scoreboard');
    const url = '/api/scoreboard' + (welt !== null && welt !== undefined && welt !== '' ? `?welt=${welt}` : '');
    try {
      const d = await api('GET', url);
      const seg = h('div', { class: 'seg', role: 'group', 'aria-label': 'Filter' }, h('button', { type: 'button', 'aria-pressed': d.welt === null ? 'true' : 'false', onclick: () => (location.hash = '#/scoreboard') }, 'Gesamt'), d.welten.map((w) => h('button', { type: 'button', 'aria-pressed': d.welt === w.nr ? 'true' : 'false', onclick: () => (location.hash = `#/scoreboard/${w.nr}`) }, `Welt ${w.nr}`)));
      seite(
        'scoreboard',
        h('h1', null, '🏆 Scoreboard'),
        h('div', { class: 'scroll-x' }, seg),
        h('div', { class: 'spacer' }),
        scoreboardKarte(d)
      );
      // alle 20 s nur die Tabelle austauschen (kein Springen nach oben); route() beendet den Timer
      clearInterval(scoreboardTimer);
      scoreboardTimer = setInterval(async () => {
        if (document.hidden) return;
        try {
          const neu = await api('GET', url);
          const alt = document.querySelector('#haupt > section.card');
          if (alt && location.hash.startsWith('#/scoreboard')) alt.replaceWith(scoreboardKarte(neu));
        } catch {
          /* nächster Versuch in 20 s */
        }
      }, 20000);
    } catch (e) {
      fehlerSeite(e, 'scoreboard');
    }
  }

  /* ---------- Warm-up-Trainer (Leitner, aus v1) ---------- */

  async function kata() {
    lade('kata');
    const state = { welt: '', kategorie: '', current: null, revealed: false, lastId: null, stats: null, meta: null, info: null };
    const gespeichert = AQ.lade('aql_kata_filter', {});
    state.welt = typeof gespeichert.welt === 'string' ? gespeichert.welt : '';
    state.kategorie = typeof gespeichert.kategorie === 'string' ? gespeichert.kategorie : '';
    const filterBox = h('section', { class: 'card' });
    const statsBox = h('section', { class: 'card' });
    const cardBox = h('section', { 'aria-live': 'polite' });
    try {
      state.meta = await api('GET', '/api/kata/meta');
    } catch (e) {
      return fehlerSeite(e, 'kata');
    }
    seite('kata', h('h1', null, '🔥 Warm-up-Trainer'), h('p', { class: 'muted' }, 'Trainiere wie im Abi – erst auf Papier lösen, dann Lösung aufdecken und ehrlich einschätzen. Sichere Karten wandern ins nächste Fach und kommen seltener dran. (Keine Punkte – aber ein Abzeichen für 30 Karten in Fach 5.)'), filterBox, cardBox, statsBox);
    const params = () => {
      const p = {};
      if (state.welt !== '') p.welt = state.welt;
      if (state.kategorie) p.kategorie = state.kategorie;
      return p;
    };
    const weltName = (nr) => {
      const w = state.meta.weltNamen.find((x) => x.nr === nr);
      return w ? `Welt ${nr} – ${w.name}` : `Welt ${nr}`;
    };
    function renderFilter() {
      const m = state.meta;
      const welt = h('select', { id: 'f-welt', onchange: (e) => {
        state.welt = e.target.value;
        changed();
      } }, h('option', { value: '' }, 'Alle Welten'), m.welten.map((w) => h('option', { value: String(w.welt), selected: String(w.welt) === state.welt }, `${weltName(w.welt)} (${w.anzahl})`)));
      const kat = h('select', { id: 'f-kat', onchange: (e) => {
        state.kategorie = e.target.value;
        changed();
      } }, h('option', { value: '' }, 'Alle Kategorien'), m.kategorien.map((k) => h('option', { value: k.kategorie, selected: k.kategorie === state.kategorie }, `${k.kategorie} (${k.anzahl})`)));
      mount(filterBox, h('div', { class: 'row end' }, h('div', { class: 'grow' }, h('label', { for: 'f-welt' }, 'Welt'), welt), h('div', { class: 'grow' }, h('label', { for: 'f-kat' }, 'Kategorie'), kat), h('button', { class: 'btn gold', type: 'button', onclick: () => draw(false) }, '🃏 Karte ziehen')));
    }
    function changed() {
      AQ.speichere('aql_kata_filter', { welt: state.welt, kategorie: state.kategorie });
      state.current = null;
      renderCard();
      loadStats();
    }
    function renderStats() {
      const st = state.stats;
      if (!st) return;
      const curBox = state.current ? (state.info.neu ? 0 : state.info.fach) : -1;
      const boxes = [{ n: st.neu, l: 'neu', i: 0 }, ...[1, 2, 3, 4, 5].map((i) => ({ n: st.faecher[i], l: `Fach ${i}`, i }))];
      mount(statsBox, h('h2', null, 'Deine Kartei'), h('div', { class: 'boxes' }, boxes.map((b) => h('div', { class: 'box' + (b.i === curBox ? ' cur' : '') }, h('div', { class: 'n' }, String(b.n)), h('div', { class: 'l' }, b.l)))), h('div', { class: 'spacer' }), h('p', { class: 'small' }, h('strong', null, String(st.faellig)), ` von ${st.gesamt} Karten jetzt fällig · `, h('strong', null, String(st.wiederholungen)), ` Wiederholungen · gewusst ${st.gewusst} · teilweise ${st.teilweise} · nicht gewusst ${st.nicht}`), h('p', { class: 'hint' }, 'Fächer: 1 = jedes Mal · 2 = nach 1 Tag · 3 = nach 3 Tagen · 4 = nach 7 Tagen · 5 = nach 14 Tagen. „Nicht gewusst“ schickt die Karte zurück in Fach 1.'));
    }
    function renderCard() {
      const c = state.current;
      if (!c) {
        const info = state.info;
        if (info && info.reason === 'nichts_faellig') {
          mount(cardBox, h('div', { class: 'card center' }, h('h2', null, '🎉 Alles erledigt!'), h('p', null, 'Gerade ist keine Karte fällig. Nächste Fälligkeit: ', h('strong', null, fmtDatum(info.naechsteFaelligkeit)), '.'), h('button', { class: 'btn secondary', type: 'button', onclick: () => draw(true) }, 'Trotzdem weiter üben')));
        } else if (info && info.reason === 'keine_karten') mount(cardBox, h('div', { class: 'card' }, h('p', { class: 'muted' }, 'Für diesen Filter gibt es keine Karten.')));
        else mount(cardBox, h('div', { class: 'card center' }, h('p', { class: 'muted' }, 'Wähle Welt und Kategorie und ziehe eine Karte.'), h('button', { class: 'btn gold big', type: 'button', onclick: () => draw(false) }, '🃏 Karte ziehen')));
        return;
      }
      const i = state.info;
      const pill = (t) => h('span', { class: 'pill' }, t);
      mount(
        cardBox,
        h(
          'article',
          { class: 'card kata-card' },
          h('div', { class: 'kata-head' }, pill(weltName(c.welt)), pill(c.kategorie), pill(i.neu ? '✨ neu' : `Fach ${i.fach}`), pill(`⏱ ${c.minuten} min`), h('span', { class: 'small muted right' }, c.id)),
          h('h2', null, c.titel),
          h('div', { class: 'kata-text' }, c.aufgabe),
          c.code ? h('pre', { class: 'code-pre' }, c.code) : null,
          state.revealed
            ? h('div', { class: 'solution' }, h('h3', null, 'Lösung'), h('div', { class: 'kata-text' }, c.loesung), c.loesungCode ? h('pre', { class: 'code-pre' }, c.loesungCode) : null, h('p', { class: 'small muted' }, 'Wie lief’s? Schätze dich ehrlich ein:'), h('div', { class: 'answer-row' }, h('button', { class: 'btn green', type: 'button', onclick: () => answer('gewusst') }, '✔ gewusst'), h('button', { class: 'btn gold', type: 'button', onclick: () => answer('teilweise') }, '≈ teilweise'), h('button', { class: 'btn danger', type: 'button', onclick: () => answer('nicht') }, '✘ nicht gewusst')))
            : h('div', { class: 'btn-row' }, h('button', { class: 'btn', type: 'button', onclick: () => {
                state.revealed = true;
                renderCard();
              } }, '👁 Lösung aufdecken'), h('button', { class: 'btn secondary', type: 'button', onclick: () => draw(false) }, 'Andere Karte'))
        )
      );
    }
    async function draw(force) {
      try {
        const r = await api('POST', '/api/kata/ziehen', { ...params(), excludeId: state.current ? state.current.id : state.lastId, force });
        state.info = r;
        state.current = r.card;
        state.revealed = false;
        renderCard();
        renderStats();
      } catch (e) {
        toast(e.message, true);
      }
    }
    async function answer(ergebnis) {
      const c = state.current;
      try {
        const r = await api('POST', '/api/kata/antwort', { kataId: c.id, ergebnis });
        toast(r.fach > r.vorher ? `Stark! Karte wandert in Fach ${r.fach}.` : r.fach === 1 && r.vorher !== 1 ? 'Zurück in Fach 1 – die kommt bald wieder.' : `Karte bleibt in Fach ${r.fach}.`);
        abzeichenToast(r.neueAbzeichen);
        state.lastId = c.id;
        await loadStats();
        await draw(false);
      } catch (e) {
        toast(e.message, true);
      }
    }
    async function loadStats() {
      const q = new URLSearchParams(params()).toString();
      state.stats = await api('GET', '/api/kata/statistik' + (q ? '?' + q : ''));
      renderStats();
    }
    renderFilter();
    renderCard();
    await loadStats();
  }

  /* ---------- Router ---------- */

  function route() {
    clearInterval(bossTimer);
    clearInterval(scoreboardTimer);
    const t = document.getElementById('toast');
    if (t && !t.classList.contains('gold')) t.hidden = true;
    const teile = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
    const [seiteName, arg] = teile;
    switch (seiteName) {
      case '':
      case undefined:
        return karte();
      case 'level':
        return level(arg);
      case 'aufgabe':
        return aufgabe(arg);
      case 'training':
        return training(arg);
      case 'boss':
        return boss(arg);
      case 'kampf':
        return kampf(arg);
      case 'profil':
        return profil();
      case 'scoreboard':
        return scoreboard(arg);
      case 'kata':
        return kata();
      default:
        return karte();
    }
  }
  window.addEventListener('hashchange', route);
  route();
})();
