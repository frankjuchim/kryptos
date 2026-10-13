/* Kryptos – Kopfzeile (DESIGNSYSTEM §5, TECHNIK §11.2): Logo, Epoche, Bereiche je Rolle, Portal, Labor, Rang, Menü
   (Darstellung, Kurswahl, Abmelden). Keine eigene Anmeldung: öffentlich nur „Anmelden über InfoLabs“. Texte als
   Textknoten; alle Bedienelemente ≥ 44 px (CSS .kopf-link/.rang/.knopf). */
'use strict';

const KRKopf = (() => {
  const { h } = AQ;
  let rangGeladen = false;
  let laborEl = null; // Labor-Link (im Boss-Kampf ausgeblendet, laborLink)

  const BEREICHE = {
    schueler: (o) => [
      ['zeitleiste', '/spiel#/', 'Zeitleiste'],
      ['warmup', '/spiel#/warmup', 'Warm-up'],
      ['profil', '/spiel#/profil', 'Profil'],
      o.scoreboard ? ['scoreboard', '/spiel#/scoreboard', 'Scoreboard'] : null
    ],
    lehrkraft: () => [
      ['kurse', '/lehrer#/', 'Kurse'],
      ['aufgaben', '/lehrer#/vorschau', 'Aufgaben'],
      ['materialien', '/lehrer#/materialien', 'Materialien']
    ],
    superadmin: () => [...BEREICHE.lehrkraft(), ['verwaltung', '/lehrer#/admin', 'Verwaltung']],
    oeffentlich: () => [
      ['themen', '/themen', 'Themen'],
      ['gast', '/gast', 'Gastmodus']
    ]
  };

  const STARTSEITE = { schueler: ['/spiel', 'Kryptos – zur Zeitleiste'], lehrkraft: ['/lehrer', 'Kryptos – zur Kursübersicht'], superadmin: ['/lehrer', 'Kryptos – zur Kursübersicht'] };

  function link(href, text, { aktiv = false, symbol = null, kurz = false, label = null, klasse = '' } = {}) {
    return h(
      'a',
      { class: ('kopf-link ' + klasse).trim(), href, 'aria-current': aktiv ? 'page' : null, 'aria-label': label },
      symbol ? KR.symbol('icons', symbol) : null,
      kurz ? h('span', { class: 'lang' }, text) : text
    );
  }

  function darstellung() {
    const aktuell = KR.thema();
    const radio = (wert, text) =>
      h('label', { class: 'menue-wahl' }, h('input', { type: 'radio', name: 'thema', value: wert, checked: aktuell === wert, onchange: () => KR.thema(wert) }), text);
    return h(
      'fieldset',
      { class: 'menue-gruppe' },
      h('legend', null, 'Darstellung'),
      radio('hell', 'Hell'),
      radio('dunkel', 'Dunkel'),
      radio('auto', 'Automatisch (wie das Gerät)'),
      h(
        'label',
        { class: 'menue-wahl' },
        h('input', { type: 'checkbox', name: 'bewegung', checked: KR.bewegung() === 'aus', onchange: (e) => KR.bewegung(e.target.checked ? 'aus' : 'auto') }),
        'Bewegung reduzieren'
      )
    );
  }

  function kurswahl(sitzung) {
    const aktive = (sitzung.kurse || []).filter((k) => k.aktiv);
    if (aktive.length < 2) return null;
    const jetzt = sitzung.kurs && sitzung.kurs.id;
    const wahl = h(
      'select',
      { name: 'kurs', id: 'kopf-kurs' },
      aktive.map((k) => h('option', { value: k.id, selected: k.id === jetzt }, k.name))
    );
    const knopf = h('button', { type: 'button', class: 'knopf knopf-zweit kurs-wechseln' }, 'Wechseln');
    knopf.addEventListener('click', async () => {
      knopf.disabled = true;
      try {
        await AQ.api('POST', '/api/sitzung/kurs', { kurs: wahl.value });
        location.reload();
      } catch (e) {
        knopf.disabled = false;
        AQ.toast(e.message, true);
      }
    });
    return h('div', { class: 'menue-gruppe' }, h('label', { for: 'kopf-kurs', class: 'menue-titel' }, 'Kurs wechseln'), h('div', { class: 'menue-zeile' }, wahl, knopf));
  }

  async function abmelden(ueberall) {
    try {
      const r = await AQ.api('POST', '/api/abmelden', { ueberall });
      location.href = (r && r.weiter) || '/';
    } catch (e) {
      AQ.toast(e.message, true);
    }
  }

  function menue(rolle, sitzung) {
    const liste = h(
      'div',
      { class: 'menue-liste' },
      darstellung(),
      rolle === 'schueler' ? kurswahl(sitzung) : null,
      rolle
        ? h(
            'div',
            { class: 'menue-gruppe' },
            h('button', { type: 'button', class: 'kopf-link abmelden', onclick: () => abmelden(false) }, 'Abmelden'),
            h('button', { type: 'button', class: 'kopf-link abmelden-ueberall', onclick: () => abmelden(true) }, 'Überall abmelden')
          )
        : null
    );
    const det = h('details', { class: 'menue' }, h('summary', { class: 'kopf-link', 'aria-label': 'Menü' }, KR.symbol('icons', 'i-menue'), h('span', { class: 'lang' }, 'Menü')), liste);
    // schließen mit Escape oder Klick daneben
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && det.open) {
        det.open = false;
        det.querySelector('summary').focus();
      }
    });
    document.addEventListener('click', (e) => {
      if (det.open && !det.contains(e.target)) det.open = false;
    });
    return det;
  }

  /** Kopfzeile in #kopf bauen. rolle: 'schueler' | 'lehrkraft' | 'superadmin' | null (öffentlich). */
  function baue({ rolle = null, aktiv = null, sitzung = {}, scoreboard = false } = {}) {
    const kopf = document.getElementById('kopf');
    if (!kopf) return null;
    kopf.classList.add('kopf');
    const s = sitzung || {};
    const art = BEREICHE[rolle] ? rolle : 'oeffentlich';
    const [startHref, startText] = STARTSEITE[rolle] || ['/', 'Kryptos – zur Startseite'];
    const bereiche = BEREICHE[art]({ scoreboard }).filter(Boolean);

    const rechts = h('div', { class: 'kopf-nav' });
    if (rolle) {
      if (rolle === 'schueler') rechts.appendChild(h('a', { class: 'rang', id: 'kopf-rang', href: '/spiel#/profil', hidden: true }));
      laborEl = link('/labor', 'Labor', { aktiv: aktiv === 'labor', symbol: 'i-labor', kurz: true, label: 'Kryptolabor', klasse: 'labor-link' });
      rechts.appendChild(laborEl);
      if (s.portal) rechts.appendChild(link(s.portal, 'Portal', { symbol: 'i-portal', kurz: true, label: 'Zurück ins Portal InfoLabs' }));
    } else {
      rechts.appendChild(h('a', { class: 'knopf knopf-messing anmelden', href: '/sso/start?ziel=' + encodeURIComponent('/spiel') }, 'Anmelden über InfoLabs'));
    }
    rechts.appendChild(menue(rolle, s));

    AQ.mount(
      kopf,
      h(
        'div',
        { class: 'kopf-innen' },
        h('a', { class: 'logo', href: startHref, 'aria-label': startText }, KR.symbol('icons', 'logo-ring'), h('span', { 'aria-hidden': 'true' }, 'KRYPTOS')),
        h('div', { class: 'kopf-epoche' }, h('i', { 'aria-hidden': 'true' }), h('span', { id: 'kopf-epoche-text' }, 'Archiv der verborgenen Schriften')),
        h(
          'nav',
          { class: 'kopf-seiten', 'aria-label': 'Bereiche' },
          bereiche.map(([id, href, text]) => {
            const a = link(href, text, { aktiv: aktiv === id });
            a.setAttribute('data-bereich', id);
            return a;
          })
        ),
        rechts
      )
    );
    if (rolle === 'schueler' && !rangGeladen) {
      rangGeladen = true;
      rangNeu();
    }
    fuss(s);
    return kopf;
  }

  /** Fußzeile (Themen, Datenschutz, Portal, Version), nur wenn #fuss noch leer ist. */
  function fuss(sitzung) {
    const f = document.getElementById('fuss');
    if (!f || f.firstChild) return;
    f.classList.add('fuss');
    AQ.mount(
      f,
      h(
        'div',
        { class: 'fuss-innen' },
        h('span', null, 'Kryptos – Die Zeitreise der Geheimschriften', sitzung && sitzung.version ? ` · Version ${sitzung.version}` : ''),
        h('span', { class: 'knopf-reihe' }, h('a', { href: '/themen' }, 'Themen'), h('a', { href: '/datenschutz' }, 'Datenschutz'), h('a', { href: '/sso/portal' }, '⌂ Portal'))
      )
    );
  }

  /** Text der Epoche in der Mitte der Kopfzeile. */
  function epoche(text) {
    const el = document.getElementById('kopf-epoche-text');
    if (el) el.textContent = text;
  }

  /** Rang neu vom Server holen (GET /api/profil) – beim Aufbau und nach dem Lösen mit Punkten (sonst bliebe 0 %). */
  function rangNeu() {
    return AQ.api('GET', '/api/profil')
      .then((p) => p && p.rang && rang(p.rang))
      .catch(() => {});
  }

  /** Rang-Badge mit Fortschrittsring (anteil 0…1). */
  function rang({ name, anteil } = {}) {
    const el = document.getElementById('kopf-rang');
    if (!el || !name) return;
    const r = 15;
    const umfang = 2 * Math.PI * r;
    const a = Math.max(0, Math.min(1, Number(anteil) || 0));
    AQ.mount(
      el,
      AQ.s(
        'svg',
        { viewBox: '0 0 40 40', 'aria-hidden': 'true', focusable: 'false', class: 'rang-ring' },
        AQ.s('circle', { class: 'ring-spur', cx: 20, cy: 20, r }),
        AQ.s('circle', { class: 'ring-wert', cx: 20, cy: 20, r, 'stroke-dasharray': umfang.toFixed(2), 'stroke-dashoffset': (umfang * (1 - a)).toFixed(2) })
      ),
      h('span', { class: 'rang-text' }, h('b', null, name), h('small', null, KR.prozent(a)))
    );
    el.setAttribute('aria-label', `Profil: Rang ${name}, ${KR.prozent(a)}`);
    el.hidden = false;
  }

  /** Funkraum-Punkt (Haken für M7, E33): Link mit pulsierendem Punkt nur, solange ein Szenario läuft. */
  function funkPunkt(an) {
    const nav = document.querySelector('#kopf .kopf-nav');
    if (!nav) return;
    const alt = nav.querySelector('a.funk');
    if (!an) {
      if (alt) alt.remove();
      return;
    }
    if (alt) return;
    const a = link('/funkraum', 'Funkraum', { symbol: 'i-funk', kurz: true, label: 'Funkraum – Szenario läuft', klasse: 'funk' });
    a.appendChild(h('span', { class: 'punkt-funk', 'aria-hidden': 'true' }));
    nav.insertBefore(a, nav.querySelector('.menue'));
  }

  /** Labor-Link ein-/ausblenden (Boss-Kampf: aus dem DOM entfernt, damit auch kein versteckter Link bleibt). */
  function laborLink(an) {
    if (!laborEl) return;
    if (!an) {
      laborEl.remove();
      return;
    }
    if (laborEl.isConnected) return;
    const nav = document.querySelector('#kopf .kopf-nav');
    if (!nav) return;
    const portal = [...nav.querySelectorAll('a.kopf-link')].find((a) => !a.classList.contains('funk'));
    nav.insertBefore(laborEl, portal || nav.querySelector('.menue'));
  }

  /** Aktiven Bereich (aria-current) nachträglich setzen – für Hash-Routen derselben Seite. */
  function aktiv(id) {
    document.querySelectorAll('#kopf .kopf-seiten a.kopf-link').forEach((a) => {
      if (a.getAttribute('data-bereich') === id) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  return { baue, epoche, rang, rangNeu, funkPunkt, laborLink, aktiv };
})();
