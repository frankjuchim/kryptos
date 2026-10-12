/* Algo Quest Lab – Themenübersicht (/themen): Welten mit Leveln, Arbeitsblättern (PDF), Boss, Trainingsplatz und
 * Warm-up; Querschnitte nach Aufgabentyp und nach Fallen P1–P10. Öffentlich, ohne Lösungen. */
(() => {
  const { h, api, mount } = AQ;
  const ziel = document.getElementById('themen-inhalt');

  const dsText = (ds) => (!ds || !ds.length ? '' : ds.length === 1 ? `DS ${ds[0]}` : `DS ${ds.join(', ')}`);
  const dsSpanne = (ds) => (!ds ? '' : ds[0] === ds[1] ? `DS ${ds[0]}` : `DS ${ds[0]}–${ds[1]}`);
  // Schüler üben im Lab; eine angemeldete Lehrkraft landet in der Aufgaben-Vorschau (mit Lösungen) der Welt
  let lehrkraft = false;
  const levelLink = (l) => (lehrkraft ? `/lehrer#/vorschau/welt/${l.welt}` : `/spiel#/level/${encodeURIComponent(l.id)}`);
  let angemeldet = false; // Schüler oder Lehrkraft: alle PDFs; sonst nur Demo-PDFs
  const pdf = (url, text, demo = false) => {
    if (!url) return h('span', null, text);
    if (!angemeldet && !demo) return h('span', { class: 'pdf gesperrt', title: 'Nach der Anmeldung im Lab abrufbar' }, '🔒 ', text);
    return h('a', { class: 'pdf', href: url, target: '_blank', rel: 'noopener' }, text);
  };

  function einleitung(d) {
    return h(
      'section',
      { class: 'card' },
      h('h1', null, 'Themen und Arbeitsblätter'),
      h('p', null, 'Alles, was in der Einheit „Algorithmik und Datenstrukturen“ fürs Abitur wichtig ist – sortiert nach den sieben Welten. Zu jedem Thema gibt es ein Arbeitsblatt (PDF) und ein Level im Lab mit automatisch geprüften Aufgaben im Abitur-Stil.'),
      h('p', null, 'Neugierig? ', h('a', { href: '/gast' }, '👀 Im Gastmodus reinschnuppern'), ' – Probeaufgaben lösen oder einen Demo-Kurs aus Sicht der Lehrkraft ansehen, ganz ohne Anmeldung.'),
      angemeldet ? null : h('p', { class: 'callout' }, '🔒 Die Arbeitsblätter, Papier-Bosse und Warm-up-Karten (PDF) stehen nach der ', h('a', { href: '/' }, 'Anmeldung im Lab'), ' zur Verfügung. Ohne Anmeldung sind als Beispiele das Arbeitsblatt „Das Portal“ (Welt 0) und die Werkzeugkarten abrufbar.'),
      h(
        'ol',
        { class: 'schritte' },
        h('li', null, h('b', null, '1. Thema wählen'), 'Unten nach Welt, nach Aufgabentyp (z. B. Tracetabelle) oder nach deinen Fallen P1–P10 suchen.'),
        h('li', null, h('b', null, '2. Arbeitsblatt lesen'), 'Infoteile und Beispiele im PDF durcharbeiten, Aufgaben auf Papier lösen – wie im Abitur.'),
        h('li', null, h('b', null, '3. Im Lab üben'), '„Üben →“ öffnet das passende Level (Anmeldung mit Name und persönlichem Code). Ohne Tipp und Fehlversuch gibt es die meisten Punkte.'),
        h('li', null, h('b', null, '4. Boss als Abi-Probe'), 'Je Welt ein Online-Boss im Lab (auf Zeit, Auswertung mit Erklärungen) und ein Papier-Boss als PDF – handschriftlich in 60 Minuten wie im Abitur.'),
        h('li', null, h('b', null, '5. Dranbleiben'), 'Trainingsplatz (Zufallsaufgaben) und Warm-up-Karten – im Lab mit Lösungen (Leitner) oder als PDF für 10 Minuten auf Papier.')
      ),
      h('p', { class: 'callout niveau-legende' }, h('strong', null, 'Grundkurs (gA) oder Leistungskurs (eA)? '), 'Die ', h('a', { href: '#niveaus' }, 'Niveau-Übersicht'), ' zeigt, welche Welten, Level und Materialien für welches Niveau gedacht sind.'),
      d.werkzeugkarten
        ? h('p', { class: 'callout gold' }, h('strong', null, 'Immer dabei: '), pdf(d.werkzeugkarten.url, d.werkzeugkarten.titel, d.werkzeugkarten.demo), ' – Abi-Check vor der Abgabe, Zeitbudget, Struktogramm- und Klassendiagramm-Notation.')
        : null
    );
  }

  function weltKarte(w) {
    const kopf = h(
      'div',
      { class: 'welt-kopf' },
      h('div', { class: 'welt-nr', 'aria-hidden': 'true' }, String(w.nr)),
      h('div', { class: 'grow' }, h('h2', null, `Welt ${w.nr} – ${w.titel}`), h('div', { class: 'meta' }, [dsSpanne(w.ds), `${w.levels.length} Level`, `${w.aufgaben} Aufgaben`].filter(Boolean).join(' · ')))
    );
    const tabelle = h(
      'div',
      { class: 'scroll-x' },
      h(
        'table',
        { class: 'liste levels' },
        h('thead', null, h('tr', null, h('th', null, 'Level'), h('th', null, 'Thema'), h('th', { class: 'hide-sm' }, 'DS'), h('th', null, 'Arbeitsblatt'), h('th', null, 'Lab'))),
        h(
          'tbody',
          null,
          w.levels.map((l) =>
            h(
              'tr',
              null,
              h('td', { class: 'lvl-nr' }, l.nr),
              h('td', null, l.titel, ' ', AQ.niveau(l.niveau, { gemischt: l.gemischt }), l.ide ? h('div', { class: 'muted klein' }, 'Online-IDE: ', l.ide) : null),
              h('td', { class: 'hide-sm klein ds' }, dsText(l.ds)),
              h('td', { class: 'klein ab' }, l.abBlatt && l.abBlatt.url ? pdf(l.abBlatt.url, l.ab, l.abBlatt.demo) : l.ab || '–'),
              h('td', { class: 'lab' }, h('a', { href: levelLink(l), 'aria-label': `Level ${l.nr} üben` }, 'Üben →'), h('span', { class: 'muted klein' }, ` ${l.aufgaben} Aufgaben`))
            )
          )
        )
      )
    );
    const abs = w.arbeitsblaetter.length
      ? h('div', null, h('h3', null, 'Arbeitsblätter (PDF)'), h('ul', { class: 'ab-liste' }, w.arbeitsblaetter.map((a) => h('li', null, pdf(a.url, `AB ${a.nr}: ${a.titel}`, a.demo), a.ds.length ? h('span', { class: 'muted klein' }, ` · ${dsText(a.ds)}`) : null))))
      : null;
    const symbol = { boss: '⚔️', probeklausur: '📝', warmup: '🔥' };
    const weitere = w.weitere && w.weitere.length
      ? h('div', null, h('h3', null, 'Training auf Papier (PDF)'), h('ul', { class: 'ab-liste' }, w.weitere.map((x) => h('li', null, `${symbol[x.art] || '📄'} `, pdf(x.url, x.titel, x.demo)))))
      : null;
    const extras = h(
      'div',
      { class: 'extras' },
      w.boss ? h('span', { class: 'pill gold' }, `⚔️ Online-Boss im Lab: ${w.boss.titel} (${w.boss.anzahl} Aufgaben, ${w.boss.dauerMin} min)`) : null,
      w.training.length ? h('span', { class: 'pill green', title: w.training.join(' · ') }, `🎯 Trainingsplatz: ${w.training.length} Aufgabenarten`) : null,
      w.warmup ? h('span', { class: 'pill' }, `🔥 ${w.warmup} Warm-up-Karten im Lab`) : null
    );
    return h('section', { class: 'welt-karte', id: `welt-${w.nr}`, style: { '--welt': w.farbe } }, kopf, h('div', { class: 'welt-inhalt' }, tabelle, abs, weitere, extras));
  }

  /** „Kür: Zugbuch und Initiative – Spielmodule“ → „Zugbuch und Initiative“ */
  /** Übersicht „Was ist für welches Niveau?“ (Vertrag v1.2 §9, Manifest urls.niveaus = /themen#niveaus) */
  function niveauUebersicht(d) {
    const zelle = (liste) => (liste.length ? h('ul', { class: 'niveau-liste' }, liste) : h('span', { class: 'muted' }, '–'));
    const eintrag = (nr, titel, zusatz) => h('li', null, h('strong', null, nr), ' ', titel, zusatz ? h('span', { class: 'muted klein' }, ' ' + zusatz) : null);
    const zeilen = d.welten.map((w) => {
      const sp = { alle: [], eA: [], plus: [] };
      for (const l of w.levels) sp[l.niveau || 'alle'].push(eintrag(l.nr, kurztitel(l.titel), l.gemischt ? '(einzelne Aufgaben nur eA)' : ''));
      if (w.boss) sp[w.boss.niveau || 'alle'].push(eintrag('⚔️', `Boss: ${w.boss.titel}`, w.boss.gemischt ? '(einzelne Aufgaben nur eA)' : ''));
      return h('tr', null, h('th', { scope: 'row' }, h('a', { href: `#welt-${w.nr}` }, `Welt ${w.nr}`), h('div', { class: 'muted klein' }, w.titel.replace(/^(Der|Die|Das)\s+/, ''))), h('td', null, zelle(sp.alle)), h('td', null, zelle(sp.eA)), h('td', null, zelle(sp.plus)));
    });
    return h(
      'section',
      { class: 'card niveau-uebersicht', id: 'niveaus' },
      h('h2', null, '🎚️ Was ist für welches Niveau?'),
      h('p', null, 'Algo Quest ist für den ', h('strong', null, 'Grundkurs (gA)'), ' und den ', h('strong', null, 'Leistungskurs (eA)'), ' gedacht. Maßstab ist das Kerncurriculum Informatik (2017), Lernfeld „Algorithmen und Datenstrukturen“: Der Kern gilt für beide Kurse; die Spalte „Erweiterung eA“ ist im Abitur nur im Leistungskurs gefordert – Effizienz beurteilen (Speicherbedarf und Zahl der Operationen), Rekursion und „Teile und herrsche“, Klassenbeziehungen und Klassendiagramme, Binärbäume und binäre Suchbäume.'),
      h(
        'div',
        { class: 'scroll-x' },
        h(
          'table',
          { class: 'liste niveau-tabelle' },
          h('thead', null, h('tr', null, h('th', null, 'Welt'), h('th', null, AQ.niveau('alle', { alleZeigen: true }), h('div', { class: 'klein' }, 'gA und eA')), h('th', null, AQ.niveau('eA'), h('div', { class: 'klein' }, 'nur eA')), h('th', null, AQ.niveau('plus'), h('div', { class: 'klein' }, 'weder gA noch eA gefordert')))),
          h('tbody', null, zeilen)
        )
      ),
      h('p', { class: 'hint' }, 'Im Lab tragen die Level auf der Weltkarte die Etiketten „LK“ (nur eA), „teils LK“ oder „+“ (Zusatz); Aufgaben zeigen „nur Leistungskurs (eA)“. Jedes Arbeitsblatt, jeder Papier-Boss und die Probeklausur nennt im Kopf das Niveau; einzelne eA-Aufgaben sind mit „◆ nur LK (eA)“ markiert. Lehrkräfte stellen im Kurs „Kursart: Grundkurs“ ein – dann gilt eA-Stoff als freiwillig und die Online-Bosse ziehen nur Aufgaben für beide Kurse.')
    );
  }

  const kurztitel = (t) => t.replace(/^Kür:\s*/, '').split(/[:–]/)[0].trim();

  function ortLinks(orte, welten) {
    const farbe = new Map(welten.map((w) => [w.nr, w.farbe]));
    return h(
      'div',
      { class: 'ort-links' },
      orte.map((o) =>
        h('a', { href: levelLink(o), title: `Level ${o.nr} – ${o.titel}` }, h('span', { class: 'pill', style: { borderLeft: `4px solid ${farbe.get(o.welt) || '#1f4e79'}` } }, `${o.nr} ${kurztitel(o.titel)}`, h('span', { class: 'muted' }, ` ×${o.anzahl}`)))
      )
    );
  }

  function aufgabentypen(d) {
    return h(
      'section',
      { class: 'card' },
      h('p', { class: 'muted' }, 'Die Abiturklassiker quer durch alle Welten – mit der Zahl passender Lab-Aufgaben je Level. Ein Klick öffnet das Level.'),
      h(
        'div',
        { class: 'scroll-x' },
        h(
          'table',
          { class: 'liste' },
          h('thead', null, h('tr', null, h('th', null, 'Aufgabentyp'), h('th', { class: 'num' }, 'Aufgaben'), h('th', null, 'Wo üben?'))),
          h('tbody', null, d.kategorien.map((k) => h('tr', null, h('td', null, h('strong', null, k.kategorie)), h('td', { class: 'num' }, String(k.anzahl)), h('td', null, ortLinks(k.orte, d.welten)))))
        )
      )
    );
  }

  function fallen(d) {
    return h(
      'section',
      { class: 'card' },
      h('p', { class: 'muted' }, 'Die zehn häufigsten Punktverluste im Abitur. In deinem Profil im Lab siehst du unter „Deine Fallen“, wo du noch Fehlversuche hast – hier findest du die passenden Level dazu.'),
      h(
        'div',
        { class: 'scroll-x' },
        h(
          'table',
          { class: 'liste' },
          h('thead', null, h('tr', null, h('th', null, 'Falle'), h('th', { class: 'num' }, 'Aufgaben'), h('th', null, 'Wo üben?'))),
          h(
            'tbody',
            null,
            d.fallen.map((f) => h('tr', null, h('td', null, h('strong', null, `${f.p} ${f.titel}`), h('div', { class: 'muted klein' }, f.text)), h('td', { class: 'num' }, String(f.anzahl)), h('td', null, ortLinks(f.orte, d.welten))))
          )
        )
      )
    );
  }

  async function start() {
    try {
      const sitzung = await api('GET', '/api/sitzung');
      lehrkraft = !sitzung.schueler && !!sitzung.lehrkraft;
      angemeldet = !!(sitzung.schueler || sitzung.lehrkraft);
      if (!sitzung.schueler) {
        const z = document.getElementById('zum-lab');
        z.textContent = sitzung.lehrkraft ? '▶ Lehrkraft-Bereich' : '▶ Anmelden';
        z.href = sitzung.lehrkraft ? '/lehrer' : '/';
      }
    } catch {
      /* Navigation bleibt beim Standard */
    }
    let d;
    try {
      d = await api('GET', '/api/themen');
    } catch (e) {
      mount(ziel, h('p', { class: 'callout warn' }, 'Die Übersicht konnte nicht geladen werden: ', e.message));
      return;
    }
    mount(
      ziel,
      einleitung(d),
      h('nav', { class: 'card chips', 'aria-label': 'Sprung zur Welt' }, h('strong', null, 'Welten: '), d.welten.map((w) => h('a', { href: `#welt-${w.nr}`, class: 'pill', style: { borderLeft: `4px solid ${w.farbe}` } }, `${w.nr} ${w.titel.replace(/^(Der|Die|Das)\s+/, '')}`))),
      niveauUebersicht(d),
      h('h2', { class: 'abschnitt', id: 'welten' }, '🗺️ Nach Welten'),
      d.welten.map(weltKarte),
      h('h2', { class: 'abschnitt', id: 'aufgabentypen' }, '🧩 Nach Aufgabentyp'),
      aufgabentypen(d),
      h('h2', { class: 'abschnitt', id: 'fallen' }, '⚠️ Nach Fallen P1–P10'),
      fallen(d)
    );
    if (location.hash) {
      const el = document.getElementById(location.hash.slice(1));
      if (el) el.scrollIntoView();
    }
  }

  start();
})();
