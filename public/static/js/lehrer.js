/* Algo Quest Lab – Bereich für Lehrkräfte und Superadmin:
 * Login/Registrierung, Passwortwechsel, Kurse, Schüler, Beitritt (QR), Einstellungen, Auswertung, Materialien (PDF),
 * Superadmin-Verwaltung. */
'use strict';

(async () => {
  const { h, mount, api, toast, bestaetigen, fmtDatum, prozent, download, readFile } = AQ;
  const app = document.getElementById('app');
  let konto = null;
  let inhalte = { welten: [] };
  let verbund = { portal: null, sso: false, lokal: true }; // Plattform-Verbund InfoLabs (aus /api/sitzung)

  /* ---------- Rahmen ---------- */

  function topbar(aktiv) {
    const link = (href, label, key) => h('a', { href, class: aktiv === key ? 'active' : null, 'aria-current': aktiv === key ? 'page' : null }, label);
    return h(
      'header',
      { class: 'topbar' },
      h(
        'div',
        { class: 'topbar-inner' },
        h('a', { class: 'brand', href: '#/' }, h('span', { class: 'brand-mark', 'aria-hidden': 'true' }, 'AQ'), h('span', null, 'Algo Quest ', h('small', null, 'Lab · Lehrkräfte'))),
        konto
          ? h(
              'nav',
              { class: 'topnav', 'aria-label': 'Hauptnavigation' },
              link('#/', '📚 Kurse', 'kurse'),
              link('#/vorschau', '📖 Aufgaben', 'vorschau'),
              link('#/materialien', '📂 Materialien', 'materialien'),
              h('a', { href: '/themen' }, '📚 Themen'),
              konto.rolle === 'superadmin' ? link('#/admin', '🛡️ Verwaltung', 'admin') : null,
              konto.portal ? null : link('#/konto', '🔑 Konto', 'konto'),
              verbund.portal ? h('a', { href: verbund.portal + '/' }, '⌂ Portal') : null,
              h('span', { class: 'who hide-sm' }, konto.name),
              h('button', { type: 'button', onclick: abmelden }, 'Abmelden'),
              konto.portal ? h('a', { href: '/sso/abmelden' }, 'Überall abmelden') : null
            )
          : h('nav', { class: 'topnav' }, verbund.portal ? h('a', { href: verbund.portal + '/' }, '⌂ Portal') : null, h('a', { href: '/' }, 'Zur Schülerseite'))
      )
    );
  }

  function seite(aktiv, ...inhalt) {
    mount(app, h('a', { class: 'skip', href: '#haupt' }, 'Zum Inhalt springen'), topbar(aktiv), h('main', { id: 'haupt', tabindex: '-1' }, ...inhalt));
  }

  async function abmelden() {
    try {
      await api('POST', '/api/lehrer/abmelden', {});
    } catch {
      /* egal */
    }
    konto = null;
    location.hash = '#/';
    start();
  }

  function fehler(e) {
    if (e.status === 401) {
      konto = null;
      return anmeldeSeite();
    }
    if (e.data && e.data.mussPasswortAendern) return passwortSeite(true);
    toast(e.message, true);
  }

  /* ---------- Anmeldung / Registrierung ---------- */

  function anmeldeSeite() {
    const fehlerL = h('p', { class: 'callout warn', role: 'alert', hidden: true });
    const fehlerR = h('p', { class: 'callout warn', role: 'alert', hidden: true });
    const okR = h('div', { class: 'callout ok', role: 'status', hidden: true });
    const feld = (id, label, attrs = {}) => h('div', { class: 'field' }, h('label', { for: id }, label), h(attrs.tag || 'input', { id, ...attrs, tag: null }));
    const login = h(
      'form',
      { class: 'card', autocomplete: 'on' },
      h('h2', null, 'Anmelden'),
      feld('l-mail', 'E-Mail', { type: 'text', autocomplete: 'username', required: true, spellcheck: 'false', autocapitalize: 'off' }),
      feld('l-pw', 'Passwort', { type: 'password', autocomplete: 'current-password', required: true }),
      fehlerL,
      h('button', { class: 'btn big', type: 'submit' }, 'Anmelden')
    );
    login.addEventListener('submit', async (e) => {
      e.preventDefault();
      fehlerL.hidden = true;
      try {
        const r = await api('POST', '/api/lehrer/anmelden', { email: login.querySelector('#l-mail').value, passwort: login.querySelector('#l-pw').value });
        konto = r.konto;
        if (konto.mussPasswortAendern) return passwortSeite(true);
        route();
      } catch (err) {
        fehlerL.textContent = err.message;
        fehlerL.hidden = false;
      }
    });
    const reg = h(
      'form',
      { class: 'card', autocomplete: 'on' },
      h('h2', null, 'Zugang beantragen'),
      h('p', { class: 'small muted' }, 'Lehrkräfte erhalten nach Prüfung durch den Administrator Zugang. Es werden keine E-Mails versendet – bitte später einfach anmelden.'),
      feld('r-name', 'Name', { type: 'text', autocomplete: 'name', required: true }),
      feld('r-mail', 'Dienstliche E-Mail', { type: 'email', autocomplete: 'email', required: true }),
      feld('r-schule', 'Schule', { type: 'text', autocomplete: 'organization', required: true }),
      feld('r-pw', 'Passwort (mind. 10 Zeichen)', { type: 'password', autocomplete: 'new-password', required: true, minlength: '10' }),
      h('div', { class: 'field' }, h('label', { for: 'r-msg' }, 'Nachricht an den Administrator (optional)'), h('textarea', { id: 'r-msg', maxlength: '1000' })),
      fehlerR,
      okR,
      h('button', { class: 'btn secondary big', type: 'submit' }, 'Zugang beantragen')
    );
    reg.addEventListener('submit', async (e) => {
      e.preventDefault();
      fehlerR.hidden = true;
      try {
        const r = await api('POST', '/api/lehrer/registrieren', { name: reg.querySelector('#r-name').value, email: reg.querySelector('#r-mail').value, schule: reg.querySelector('#r-schule').value, passwort: reg.querySelector('#r-pw').value, nachricht: reg.querySelector('#r-msg').value });
        okR.textContent = r.hinweis;
        okR.hidden = false;
        reg.reset();
      } catch (err) {
        fehlerR.textContent = err.message;
        fehlerR.hidden = false;
      }
    });
    const portalKarte = verbund.sso
      ? h('section', { class: 'card' }, h('h2', null, 'Anmeldung über InfoLabs'), h('p', null, 'Mit Ihrem Konto im Portal InfoLabs (gemeinsame Anmeldung für alle Plattformen).'), h('a', { class: 'btn big gold', href: '/sso/start?ziel=%2Flehrer' }, '⌂ Über InfoLabs anmelden'))
      : null;
    seite('', h('h1', null, 'Bereich für Lehrkräfte'), portalKarte, verbund.lokal ? h('div', { class: 'grid grid-2' }, login, reg) : null);
  }

  function passwortSeite(zwang) {
    const msg = h('p', { class: 'callout warn', role: 'alert', hidden: true });
    const f = h(
      'form',
      { class: 'card' },
      h('h1', null, zwang ? 'Bitte neues Passwort festlegen' : 'Passwort ändern'),
      zwang ? h('p', { class: 'callout gold' }, 'Sie haben sich mit einem Einmal-Passwort angemeldet. Legen Sie jetzt Ihr eigenes Passwort fest.') : null,
      h('div', { class: 'field' }, h('label', { for: 'p-alt' }, zwang ? 'Einmal-Passwort' : 'Bisheriges Passwort'), h('input', { id: 'p-alt', type: 'password', autocomplete: 'current-password', required: true })),
      h('div', { class: 'field' }, h('label', { for: 'p-neu' }, 'Neues Passwort (mind. 10 Zeichen)'), h('input', { id: 'p-neu', type: 'password', autocomplete: 'new-password', required: true, minlength: '10' })),
      h('div', { class: 'field' }, h('label', { for: 'p-neu2' }, 'Neues Passwort wiederholen'), h('input', { id: 'p-neu2', type: 'password', autocomplete: 'new-password', required: true })),
      msg,
      h('button', { class: 'btn', type: 'submit' }, 'Passwort speichern')
    );
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      msg.hidden = true;
      const neu = f.querySelector('#p-neu').value;
      if (neu !== f.querySelector('#p-neu2').value) {
        msg.textContent = 'Die beiden neuen Passwörter stimmen nicht überein.';
        msg.hidden = false;
        return;
      }
      try {
        const r = await api('POST', '/api/lehrer/passwort', { alt: f.querySelector('#p-alt').value, neu });
        konto = r.konto;
        toast('Passwort gespeichert.');
        location.hash = '#/';
        route();
      } catch (err) {
        msg.textContent = err.message;
        msg.hidden = false;
      }
    });
    seite('konto', h('div', { class: 'narrow' }, f), konto && konto.rolle === 'superadmin' ? h('p', { class: 'hint' }, 'Hinweis: Das Superadmin-Passwort wird über die Umgebungsvariable ADMIN_PASSWORD gesetzt.') : null);
  }

  /* ---------- Kurse ---------- */

  async function kursListe() {
    let liste;
    try {
      liste = await api('GET', '/api/lehrer/kurse');
    } catch (e) {
      return fehler(e);
    }
    const name = h('input', { id: 'k-name', type: 'text', required: true, maxlength: '80', placeholder: 'z. B. LK Informatik Abi 2027' });
    const form = h('form', { class: 'card' }, h('h2', null, 'Neuen Kurs anlegen'), h('div', { class: 'row end' }, h('div', { class: 'grow' }, h('label', { for: 'k-name' }, 'Kursname'), name), h('button', { class: 'btn', type: 'submit' }, '＋ Anlegen')));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const k = await api('POST', '/api/lehrer/kurse', { name: name.value });
        toast(`Kurs „${k.name}“ angelegt – Kurscode ${k.code}.`);
        location.hash = `#/kurs/${k.id}/beitritt`;
      } catch (err) {
        fehler(err);
      }
    });
    const su = konto.rolle === 'superadmin';
    const anlegen = konto.portal
      ? h('p', { class: 'callout' }, 'Kurse legen Sie im Portal InfoLabs an und schalten dort Algo Quest frei. Nach der nächsten Anmeldung erscheinen sie hier.')
      : form;
    seite(
      'kurse',
      h('h1', null, su ? 'Alle Kurse' : 'Meine Kurse'),
      liste.length
        ? h(
            'section',
            { class: 'card' },
            h(
              'div',
              { class: 'scroll-x' },
              h(
                'table',
                { class: 'liste' },
                h('thead', null, h('tr', null, h('th', null, 'Kurs'), h('th', null, 'Kurscode'), su ? h('th', null, 'Lehrkraft') : null, h('th', { class: 'num' }, 'Schüler'), h('th', null, 'zuletzt aktiv'), h('th', null, ''))),
                h('tbody', null, liste.map((k) => h('tr', null, h('td', null, h('a', { href: `#/kurs/${k.id}/schueler` }, h('strong', null, k.name))), h('td', { class: 'code-anzeige' }, k.portal ? 'Portal' : k.code), su ? h('td', null, `${k.lehrkraft} (${k.lehrkraftEmail})`) : null, h('td', { class: 'num' }, String(k.schueler)), h('td', null, fmtDatum(k.zuletztAktiv)), h('td', null, h('a', { class: 'btn small secondary', href: `#/kurs/${k.id}/schueler` }, 'Öffnen')))))
              )
            )
          )
        : h('p', { class: 'callout' }, konto.portal ? 'Noch keine Kurse.' : 'Noch keine Kurse. Lege unten deinen ersten Kurs an.'),
      anlegen
    );
  }

  const KURS_TABS = [
    ['schueler', '👥 Schüler'],
    ['beitritt', '🔗 Beitritt & QR'],
    ['auswertung', '📊 Auswertung'],
    ['scoreboard', '🏆 Scoreboard'],
    ['einstellungen', '⚙️ Einstellungen']
  ];

  async function kurs(id, tab = 'schueler') {
    let k;
    try {
      k = await api('GET', `/api/lehrer/kurse/${id}`);
      if (!inhalte.welten.length) inhalte = await api('GET', '/api/lehrer/inhalte');
    } catch (e) {
      return fehler(e);
    }
    const box = h('div');
    seite(
      'kurse',
      h('nav', { class: 'crumbs' }, h('a', { href: '#/' }, 'Kurse'), '›', h('span', null, k.name)),
      h('div', { class: 'row' }, h('h1', { class: 'grow' }, k.name, ' ', h('span', { class: 'pill gold code-anzeige' }, k.code)), h('a', { class: 'btn gold', href: `/lehrer/urkunden?kurs=${k.id}` }, '🏅 Urkunden')),
      h('div', { class: 'tabs', role: 'tablist' }, KURS_TABS.map(([key, label]) => h('button', { type: 'button', role: 'tab', 'aria-selected': key === tab ? 'true' : 'false', onclick: () => (location.hash = `#/kurs/${id}/${key}`) }, label))),
      box
    );
    const f = { schueler: tabSchueler, beitritt: tabBeitritt, auswertung: tabAuswertung, scoreboard: tabScoreboard, einstellungen: tabEinstellungen }[tab] || tabSchueler;
    try {
      await f(k, box);
    } catch (e) {
      fehler(e);
    }
  }

  async function tabSchueler(k, box) {
    const liste = await api('GET', `/api/lehrer/kurse/${k.id}/schueler`);
    const zeigeCodes = AQ.lade('aql_codes_' + k.id, false);
    const tab = h(
      'table',
      { class: 'liste' },
      h('thead', null, h('tr', null, h('th', null, 'Name'), h('th', null, 'Code'), h('th', { class: 'num' }, 'Punkte'), h('th', { class: 'num' }, 'gelöst'), h('th', null, 'Rang'), h('th', null, 'zuletzt aktiv'), h('th', null, 'Aktionen'))),
      h(
        'tbody',
        null,
        liste.map((s) =>
          h(
            'tr',
            null,
            h('td', null, h('strong', null, s.name)),
            h('td', { class: 'code-anzeige' }, s.portal ? 'Portal' : zeigeCodes ? s.code : '•••-•••'),
            h('td', { class: 'num' }, String(s.punkte)),
            h('td', { class: 'num' }, String(s.geloest)),
            h('td', null, s.rang),
            h('td', null, fmtDatum(s.zuletztAktiv)),
            h(
              'td',
              null,
              h(
                'div',
                { class: 'btn-row' },
                s.portal ? null : h('button', { class: 'btn small secondary', type: 'button', onclick: async () => {
                  const neu = await bestaetigen('Namen ändern', `Neuer Name für „${s.name}“:`, { ok: 'Speichern', eingabe: { label: 'Name' } });
                  if (!neu) return;
                  try {
                    await api('PATCH', `/api/lehrer/kurse/${k.id}/schueler/${s.id}`, { name: neu });
                    toast('Name geändert.');
                    tabSchueler(k, box);
                  } catch (e) {
                    fehler(e);
                  }
                } }, 'Umbenennen'),
                s.portal ? null : h('button', { class: 'btn small secondary', type: 'button', onclick: async () => {
                  if (!(await bestaetigen('Neuen Code erzeugen?', `„${s.name}“ erhält einen neuen persönlichen Code. Der alte Code gilt nicht mehr und offene Sitzungen werden abgemeldet.`, { ok: 'Neuen Code erzeugen' }))) return;
                  try {
                    const r = await api('POST', `/api/lehrer/kurse/${k.id}/schueler/${s.id}/neuer-code`, {});
                    await bestaetigen('Neuer Code', h('p', null, `Neuer Code für ${r.name}: `, h('span', { class: 'code-gross' }, r.code)), { ok: 'OK', abbrechen: 'Schließen' });
                    tabSchueler(k, box);
                  } catch (e) {
                    fehler(e);
                  }
                } }, 'Neuer Code'),
                h('button', { class: 'btn small danger', type: 'button', onclick: async () => {
                  if (!(await bestaetigen('Schüler löschen?', `„${s.name}“ und der gesamte Lernstand werden endgültig gelöscht.`, { ok: 'Endgültig löschen', gefahr: true }))) return;
                  try {
                    await api('DELETE', `/api/lehrer/kurse/${k.id}/schueler/${s.id}`);
                    toast('Gelöscht.');
                    tabSchueler(k, box);
                  } catch (e) {
                    fehler(e);
                  }
                } }, 'Löschen')
              )
            )
          )
        )
      )
    );
    mount(
      box,
      h(
        'section',
        { class: 'card' },
        h('div', { class: 'row' }, h('h2', null, `Schüler (${liste.length})`), h('label', { class: 'check right' }, (() => {
          const cb = h('input', { type: 'checkbox', checked: zeigeCodes });
          cb.addEventListener('change', () => {
            AQ.speichere('aql_codes_' + k.id, cb.checked);
            tabSchueler(k, box);
          });
          return cb;
        })(), 'Codes anzeigen')),
        liste.length ? h('div', { class: 'scroll-x' }, tab) : h('p', { class: 'muted' }, 'Noch niemand beigetreten. Teile den Beitritts-Link oder QR-Code (Reiter „Beitritt & QR“).')
      )
    );
  }

  async function tabBeitritt(k, box) {
    const url = `${location.origin}/k/${k.code}`;
    const board = h('section', { class: 'card' }, h('h2', null, 'Beamer-Board'), k.einstellungen.beamer ? h('p', null, 'Aktiv: ', h('a', { href: `/board/${k.code}`, target: '_blank', rel: 'noopener' }, `${location.origin}/board/${k.code}`)) : h('p', { class: 'muted' }, 'Das Beamer-Board ist ausgeschaltet (Einstellungen).'));
    if (k.portal) {
      return mount(
        box,
        h('section', { class: 'card' }, h('h2', null, 'Beitritt über das Portal'), h('p', null, 'Dieser Kurs wird im Portal InfoLabs verwaltet: Schüler treten dort mit dem Kurscode des Portals bei und kommen über „Weiter zu Algo Quest“ hierher. Namen und persönliche Codes ändern Sie im Portal.'), verbund.portal ? h('p', null, h('a', { class: 'btn secondary', href: verbund.portal + '/' }, '⌂ Zum Portal')) : null),
        board
      );
    }
    mount(
      box,
      h(
        'section',
        { class: 'card' },
        h('h2', null, 'Beitritt'),
        h('div', { class: 'row' }, h('img', { class: 'qr', src: `/api/lehrer/kurse/${k.id}/qr.svg`, alt: `QR-Code für ${url}` }), h('div', { class: 'grow' }, h('p', null, 'Beitritts-Link:'), h('p', { class: 'link-box' }, url), h('div', { class: 'btn-row' }, h('button', { class: 'btn secondary', type: 'button', onclick: async () => {
          try {
            await navigator.clipboard.writeText(url);
            toast('Link kopiert.');
          } catch {
            toast('Kopieren nicht möglich – bitte markieren und kopieren.', true);
          }
        } }, '📋 Link kopieren'), h('a', { class: 'btn secondary', href: `/api/lehrer/kurse/${k.id}/qr.svg`, download: `qr_${k.code}.svg` }, '⬇ QR-Code (SVG)')), h('p', { class: 'hint' }, `Alternativ auf der Startseite „Kurs beitreten“ mit Kurscode ${k.code}. Schüler wählen ihren Namen (Empfehlung: Vorname + Initial) und erhalten einen persönlichen Code.`), k.einstellungen.anmeldung ? null : h('p', { class: 'callout warn' }, 'Die Anmeldung neuer Schüler ist derzeit geschlossen (Einstellungen).')))
      ),
      h('section', { class: 'card' }, h('h2', null, 'Beamer-Board'), k.einstellungen.beamer ? h('p', null, 'Aktiv: ', h('a', { href: `/board/${k.code}`, target: '_blank', rel: 'noopener' }, `${location.origin}/board/${k.code}`)) : h('p', { class: 'muted' }, 'Das Beamer-Board ist ausgeschaltet (Einstellungen).'))
    );
  }

  async function tabEinstellungen(k, box) {
    const e = k.einstellungen;
    const name = h('input', { id: 'e-name', type: 'text', value: k.name, maxlength: '80' });
    const weltBoxen = inhalte.welten.map((w) => {
      const cb = h('input', { type: 'checkbox', checked: e.welten.includes(w.nr), dataset: { nr: String(w.nr) } });
      return h('label', { class: 'check' }, cb, `Welt ${w.nr}: ${w.titel}`);
    });
    const boss = h('select', { id: 'e-boss' }, [['auto', 'automatisch (ab 60 % der Level-Punkte der Welt)'], ['offen', 'offen (sofort spielbar)'], ['gesperrt', 'gesperrt']].map(([v, t]) => h('option', { value: v, selected: e.boss === v }, t)));
    const schalter = (key, text) => {
      const cb = h('input', { type: 'checkbox', checked: !!e[key], dataset: { key } });
      return h('label', { class: 'check' }, cb, text);
    };
    const kursart = h('select', { id: 'e-kursart' }, [['eA', 'Leistungskurs (eA)'], ['gA', 'Grundkurs (gA)']].map(([v, t]) => h('option', { value: v, selected: (e.kursart || 'eA') === v }, t)));
    const sb = schalter('scoreboard', 'Scoreboard für Schüler sichtbar');
    const bm = schalter('beamer', 'Beamer-Board aktiv (öffentlich unter /board/<Kurscode>)');
    const an = schalter('anmeldung', 'Anmeldung neuer Schüler offen');
    const form = h(
      'form',
      { class: 'card' },
      h('h2', null, 'Einstellungen'),
      h('div', { class: 'field' }, h('label', { for: 'e-name' }, 'Kursname'), name),
      h('fieldset', { class: 'field' }, h('legend', null, h('strong', null, 'Freigeschaltete Welten')), weltBoxen.length ? weltBoxen : h('p', { class: 'muted' }, 'Noch keine Welten geladen.')),
      h('div', { class: 'field' }, h('label', { for: 'e-boss' }, 'Bosse'), boss),
      h(
        'div',
        { class: 'field' },
        h('label', { for: 'e-kursart' }, 'Kursart'),
        kursart,
        h('p', { class: 'hint' }, 'Grundkurs: Level und Aufgaben, die laut Kerncurriculum nur zum Leistungskurs gehören („Erweiterung eA“ – Effizienz, Rekursion, Klassendiagramme, Bäume), werden den Schülern als „im Grundkurs freiwillig“ angezeigt; Bosse ziehen dann nur Aufgaben für beide Kurse (soweit vorhanden). Reine LK-Welten (3, 5) am besten oben abwählen.')
      ),
      sb,
      bm,
      an,
      h('button', { class: 'btn', type: 'submit' }, 'Speichern')
    );
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const andere = e.welten.filter((nr) => !inhalte.welten.some((w) => w.nr === nr));
      const welten = [...andere, ...weltBoxen.map((l) => l.querySelector('input')).filter((cb) => cb.checked).map((cb) => Number(cb.dataset.nr))];
      try {
        await api('PATCH', `/api/lehrer/kurse/${k.id}`, { name: name.value, einstellungen: { welten, boss: boss.value, kursart: kursart.value, scoreboard: sb.querySelector('input').checked, beamer: bm.querySelector('input').checked, anmeldung: an.querySelector('input').checked } });
        toast('Gespeichert.');
        kurs(k.id, 'einstellungen');
      } catch (err) {
        fehler(err);
      }
    });
    const gefahr = h(
      'section',
      { class: 'card danger-zone' },
      h('h2', null, '⚠️ Löschen'),
      h('p', null, 'Am Schuljahresende: alle Schüler (mit Lernständen) löschen oder den ganzen Kurs entfernen. Zur Bestätigung muss der Kursname eingetippt werden.'),
      h(
        'div',
        { class: 'btn-row' },
        h('button', { class: 'btn danger', type: 'button', onclick: async () => {
          const v = await bestaetigen('Alle Schüler löschen?', `Alle Schüler des Kurses „${k.name}“ und ihr gesamter Lernstand werden endgültig gelöscht.`, { ok: 'Alle löschen', gefahr: true, eingabe: { label: 'Kursname eintippen', muss: k.name.trim() } });
          if (!v) return;
          try {
            const r = await api('POST', `/api/lehrer/kurse/${k.id}/alle-schueler-loeschen`, { bestaetigung: v });
            toast(`${r.geloescht} Schüler gelöscht.`);
          } catch (err) {
            fehler(err);
          }
        } }, 'Alle Schüler löschen'),
        h('button', { class: 'btn danger', type: 'button', onclick: async () => {
          const v = await bestaetigen('Kurs löschen?', `Der Kurs „${k.name}“ mit allen Schülern und Lernständen wird endgültig gelöscht.`, { ok: 'Kurs löschen', gefahr: true, eingabe: { label: 'Kursname eintippen', muss: k.name.trim() } });
          if (!v) return;
          try {
            await api('DELETE', `/api/lehrer/kurse/${k.id}`, { bestaetigung: v });
            toast('Kurs gelöscht.');
            location.hash = '#/';
          } catch (err) {
            fehler(err);
          }
        } }, 'Kurs löschen')
      )
    );
    if (k.portal) gefahr.querySelectorAll('button')[1].remove();
    mount(box, form, gefahr);
  }

  function heat(anteil) {
    // hell (0 %) → grün (100 %)
    const a = Math.max(0, Math.min(1, anteil));
    return `hsl(${Math.round(10 + a * 100)}, ${Math.round(45 + a * 15)}%, ${Math.round(94 - a * 34)}%)`;
  }

  async function tabAuswertung(k, box) {
    const d = await api('GET', `/api/lehrer/kurse/${k.id}/auswertung`);
    const m = d.matrix;
    const matrix = m.zeilen.length
      ? h(
          'div',
          { class: 'scroll-x' },
          h(
            'table',
            { class: 'liste matrix' },
            h('thead', null, h('tr', null, h('th', null, 'Name'), m.levels.map((l) => h('th', { class: 'lv', title: l.titel, scope: 'col' }, `${l.nr || l.id} ${l.titel}`)))),
            h('tbody', null, m.zeilen.map((z) => h('tr', null, h('th', { scope: 'row' }, z.name), z.werte.map((w, i) => {
              const td = h('td', { class: 'wert', title: `${m.levels[i].titel}: ${w.punkte}/${m.levels[i].maxPunkte} Punkte, ${w.geloest} gelöst, ${w.angesehen} Lösung angesehen` }, Math.round(w.anteil * 100) + '');
              td.style.background = heat(w.anteil);
              return td;
            }))))
          )
        )
      : h('p', { class: 'muted' }, 'Noch keine Schüler.');
    const bossZelle = (w) => (w ? `${w.punkte}/${w.max} (${prozent(w.max ? w.punkte / w.max : 0)})${w.max && w.punkte / w.max >= 0.5 ? ' 🏆' : ''} · ${w.versuche}×` : '–');
    const boss = d.boss.welten.length
      ? h(
          'div',
          { class: 'scroll-x' },
          h(
            'table',
            { class: 'liste' },
            h('thead', null, h('tr', null, h('th', null, 'Name'), d.boss.welten.map((w) => h('th', null, `W${w.nr}: ${w.titel}`)))),
            h('tbody', null, d.boss.zeilen.map((z) => h('tr', null, h('th', { scope: 'row' }, z.name), z.werte.map((w) => h('td', null, bossZelle(w))))))
          )
        )
      : h('p', { class: 'muted' }, 'Keine Bosse geladen.');
    const weltFilter = h('select', { 'aria-label': 'Welt filtern' }, h('option', { value: '' }, 'Alle Welten'), inhalte.welten.map((w) => h('option', { value: String(w.nr) }, `Welt ${w.nr}: ${w.titel}`)));
    const statBox = h('div', { class: 'scroll-x' });
    function zeigeStatistik() {
      const f = weltFilter.value;
      const zeilen = d.aufgaben.filter((a) => f === '' || String(a.welt) === f);
      mount(
        statBox,
        h(
          'table',
          { class: 'liste' },
          h('thead', null, h('tr', null, h('th', null, 'Aufgabe'), h('th', null, 'Stufe'), h('th', null, 'Kategorie / Fallen'), h('th', { class: 'num' }, 'versucht'), h('th', { class: 'num' }, 'Lösungsquote'), h('th', { class: 'num' }, 'Ø Fehlversuche'), h('th', { class: 'num' }, 'angesehen'), h('th', null, 'häufige falsche Antworten'))),
          h('tbody', null, zeilen.map((a) => h('tr', null, h('td', null, h('strong', null, a.titel), h('div', { class: 'small muted' }, a.id)), h('td', null, '★'.repeat(a.stufe)), h('td', { class: 'small' }, a.kategorie, a.fallen.length ? ' · ' + a.fallen.join(' ') : ''), h('td', { class: 'num' }, String(a.versucht)), h('td', { class: 'num' }, a.quote === null ? '–' : prozent(a.quote)), h('td', { class: 'num' }, a.fehlversucheSchnitt === null ? '–' : a.fehlversucheSchnitt.toFixed(1)), h('td', { class: 'num' }, String(a.angesehen)), h('td', { class: 'small' }, a.falscheAntworten.map((x) => h('div', null, h('code', null, x.antwort), ` ×${x.anzahl}`))))))
        )
      );
    }
    weltFilter.addEventListener('change', zeigeStatistik);
    zeigeStatistik();
    const maxF = Math.max(1, ...d.fallen.map((f) => f.fehlversuche));
    mount(
      box,
      h('section', { class: 'card' }, h('div', { class: 'row' }, h('h2', null, 'Export'), h('div', { class: 'btn-row right' }, h('button', { class: 'btn secondary small', type: 'button', onclick: () => download(`/api/lehrer/kurse/${k.id}/export.csv?art=uebersicht`) }, '⬇ Übersicht (CSV)'), h('button', { class: 'btn secondary small', type: 'button', onclick: () => download(`/api/lehrer/kurse/${k.id}/export.csv?art=matrix`) }, '⬇ Matrix (CSV)'), h('button', { class: 'btn secondary small', type: 'button', onclick: () => download(`/api/lehrer/kurse/${k.id}/export.csv?art=aufgaben`) }, '⬇ Aufgaben (CSV)')))),
      h('section', { class: 'card' }, h('h2', null, 'Fortschrittsmatrix (% der Level-Punkte)'), matrix),
      h('section', { class: 'card' }, h('h2', null, 'Boss-Ergebnisse (bester Versuch)'), boss),
      h('section', { class: 'card' }, h('h2', null, 'Fallen-Profil des Kurses'), h('p', { class: 'small muted' }, 'Fehlversuche bei Aufgaben, die einer der „Top 10 Punktverluste“ (P1–P10) zugeordnet sind.'), d.fallen.map((f) => h('div', { class: 'fallen-balken' }, h('span', { class: 'p' }, f.p), h('div', { class: 'bar', role: 'img', 'aria-label': `${f.p}: ${f.fehlversuche} Fehlversuche` }, h('span', { style: { width: Math.round((f.fehlversuche / maxF) * 100) + '%' } })), h('span', { class: 'n' }, String(f.fehlversuche)), h('span', { class: 't' }, `${f.titel} – betrifft ${f.schueler} von ${f.schuelerGesamt} Schülern`)))),
      h('section', { class: 'card' }, h('div', { class: 'row' }, h('h2', null, 'Aufgabenstatistik'), h('div', { class: 'right' }, weltFilter)), statBox)
    );
  }

  async function tabScoreboard(k, box) {
    // solange der Reiter offen ist alle 20 s neu laden (z. B. am Beamer) – nicht beim Bedienen der Auswahl, nicht im Hintergrund
    if (!box.dataset.live) {
      box.dataset.live = '1';
      const t = setInterval(() => {
        if (!box.isConnected) return clearInterval(t);
        if (document.hidden || box.contains(document.activeElement)) return;
        tabScoreboard(k, box).catch(() => {});
      }, 20000);
    }
    const welt = AQ.lade('aql_sb_welt', '');
    const d = await api('GET', `/api/lehrer/kurse/${k.id}/scoreboard${welt !== '' ? '?welt=' + welt : ''}`);
    const sel = h('select', { 'aria-label': 'Filter' }, h('option', { value: '' }, 'Gesamt'), inhalte.welten.map((w) => h('option', { value: String(w.nr), selected: String(w.nr) === String(welt) }, `Welt ${w.nr}: ${w.titel}`)));
    sel.addEventListener('change', () => {
      AQ.speichere('aql_sb_welt', sel.value);
      tabScoreboard(k, box);
    });
    mount(box, h('section', { class: 'card' }, h('div', { class: 'row' }, h('h2', null, 'Scoreboard'), h('div', { class: 'right' }, sel)), h('div', { class: 'scroll-x' }, h('table', { class: 'liste' }, h('thead', null, h('tr', null, h('th', null, 'Platz'), h('th', null, 'Name'), h('th', { class: 'num' }, 'Punkte'), h('th', { class: 'num' }, 'Abzeichen'), h('th', { class: 'num' }, 'gelöst'))), h('tbody', null, d.liste.map((r) => h('tr', null, h('td', null, String(r.platz)), h('td', null, r.name), h('td', { class: 'num' }, String(r.punkte)), h('td', { class: 'num' }, String(r.abzeichen)), h('td', { class: 'num' }, String(r.geloest))))))), h('p', { class: 'hint' }, (k.einstellungen.scoreboard ? 'Das Scoreboard ist für Schüler sichtbar.' : 'Das Scoreboard ist für Schüler ausgeblendet.') + ` Aktualisiert sich alle 20 s (zuletzt ${new Date().toLocaleTimeString('de-DE')}).`)));
  }

  /* ---------- Aufgaben-Vorschau (mit Lösungen) ---------- */

  const ARTEN = { gaps: 'Lücken', choice: 'Auswahl', order: 'Puzzle', lines: 'Bug-Hunt', match: 'Zuordnen', 'tree:klick': 'Baum klicken', 'tree:bauen': 'Baum bauen', 'array:tausch': 'Tauschen', 'array:klick': 'Reihung klicken', grid: 'Raster', adtsim: 'ADT-Simulation' };
  let vorschauCache = null;

  async function vorschauDaten() {
    if (!vorschauCache) vorschauCache = (await api('GET', '/api/lehrer/vorschau')).welten;
    return vorschauCache;
  }

  function aufgabenTabelle(liste) {
    return h(
      'div',
      { class: 'scroll-x' },
      h(
        'table',
        { class: 'liste' },
        h('thead', null, h('tr', null, h('th', null, 'Aufgabe'), h('th', null, 'Stufe'), h('th', { class: 'num' }, 'Punkte'), h('th', null, 'Kategorie'), h('th', null, 'Interaktion'), h('th', null, 'Fallen'))),
        h('tbody', null, liste.map((a) => h('tr', null, h('td', null, h('a', { href: `#/vorschau/aufgabe/${encodeURIComponent(a.id)}` }, h('strong', null, a.titel)), h('div', { class: 'small muted' }, a.id)), h('td', null, AQ.sterne(a.stufe)), h('td', { class: 'num' }, String(a.punkte)), h('td', { class: 'small' }, a.kategorie, a.niveau && a.niveau !== 'alle' ? [' ', AQ.niveau(a.niveau)] : null), h('td', { class: 'small' }, a.arten.map((x) => ARTEN[x] || x).join(' + ')), h('td', { class: 'small' }, a.fallen.join(' ')))))
      )
    );
  }

  async function vorschau(art, arg) {
    try {
      const welten = await vorschauDaten();
      if (art === 'aufgabe') return vorschauAufgabe(arg);
      if (art === 'welt') {
        const w = welten.find((x) => String(x.nr) === String(arg));
        if (!w) throw Object.assign(new Error('Welt nicht gefunden.'), { status: 404 });
        return seite(
          'vorschau',
          h('nav', { class: 'crumbs' }, h('a', { href: '#/vorschau' }, 'Aufgaben'), '›', h('span', null, `Welt ${w.nr}`)),
          h('h1', null, `Welt ${w.nr}: ${w.titel}`),
          h('p', { class: 'muted' }, `${w.levels.length} Level · ${w.aufgabenAnzahl} Aufgaben · ${w.maxPunkte} Level-Punkte` + (w.boss ? ` · Boss-Pool ${w.boss.pool.length}` : '')),
          w.levels.map((l) => {
            const el = h(
              'section',
              { class: 'card level-kopf', id: 'level-' + l.id },
              h('h2', null, `Level ${l.nr} – ${l.titel}`),
              h('p', { class: 'niveau-zeile' }, AQ.niveau(l.niveau, { gemischt: l.gemischt, alleZeigen: true })),
              h('p', { class: 'small muted' }, [l.ds && l.ds.length ? `DS ${l.ds.join(', ')}` : null, `${l.aufgaben.length} Aufgaben`, `${l.maxPunkte} Punkte`].filter(Boolean).join(' · ')),
              l.ab ? h('p', null, h('strong', null, '📄 Arbeitsblatt: '), l.ab) : null,
              l.ide ? h('p', null, h('strong', null, '💻 Online-IDE: '), l.ide) : null,
              l.intro && l.intro.length ? h('details', null, h('summary', null, 'Merkkasten (Intro)'), AQR.bloecke(l.intro, null)) : null,
              aufgabenTabelle(l.aufgaben)
            );
            el.style.setProperty('--welt', w.farbe);
            return el;
          }),
          w.boss ? h('section', { class: 'card' }, h('h2', null, `⚔️ Boss: ${w.boss.titel}`), h('p', { class: 'small muted' }, `${w.boss.anzahl} von ${w.boss.pool.length} Aufgaben werden gezogen · ${w.boss.dauerMin} Minuten` + (w.boss.mix ? ` · Mix Stufe 1/2/3: ${w.boss.mix['1'] || 0}/${w.boss.mix['2'] || 0}/${w.boss.mix['3'] || 0}` : '')), aufgabenTabelle(w.boss.pool)) : null
        );
      }
      seite(
        'vorschau',
        h('h1', null, '📖 Aufgaben der Welten'),
        h('p', { class: 'muted' }, 'Alle Lab-Aufgaben mit Lösung und Erklärung – zum Nachschlagen passend zu den Arbeitsblättern (nur für Lehrkräfte sichtbar).'),
        welten.length
          ? h(
              'div',
              { class: 'karte' },
              welten.map((w) => {
                const el = h('a', { class: 'welt-karte', href: `#/vorschau/welt/${w.nr}` }, h('div', { class: 'welt-kopf' }, h('div', { class: 'welt-nr' }, String(w.nr)), h('div', { class: 'grow' }, h('h2', null, w.titel), h('div', { class: 'meta' }, `${w.levels.length} Level · ${w.aufgabenAnzahl} Aufgaben` + (w.boss ? ` · Boss „${w.boss.titel}“ (${w.boss.pool.length})` : '')))));
                el.style.setProperty('--welt', w.farbe);
                el.style.textDecoration = 'none';
                return el;
              })
            )
          : h('p', { class: 'callout' }, 'Noch keine Welten geladen.')
      );
    } catch (e) {
      fehler(e);
    }
  }

  /* ---------- Materialien (Lösungen, Präsentationen, Lehrerhinweise, Klausuren als PDF) ---------- */

  const MATERIAL_ARTEN = { praesentation: '🖥️', hinweise: '🧭', ab: '📄', boss: '⚔️', probeklausur: '📝', klausur: '🎓', warmup: '🔥', werkzeug: '🧰' };

  function materialTabelle(eintraege) {
    const knopf = (d) =>
      d.url
        ? h('a', { class: 'btn small ' + (d.lehrkraft ? '' : 'secondary'), href: d.url, target: '_blank', rel: 'noopener', title: d.lehrkraft ? 'nur für Lehrkräfte' : 'Schülerfassung (für angemeldete Schüler auf /themen)' }, (d.lehrkraft ? '🔒 ' : '') + d.label)
        : h('span', { class: 'small muted' }, `${d.label}: fehlt`);
    return h(
      'div',
      { class: 'scroll-x' },
      h(
        'table',
        { class: 'liste material' },
        h('thead', null, h('tr', null, h('th', null, 'Material'), h('th', { class: 'hide-sm' }, 'DS'), h('th', null, 'PDF'))),
        h('tbody', null, eintraege.map((e) => h('tr', null, h('td', null, `${MATERIAL_ARTEN[e.art] || '📄'} `, e.titel), h('td', { class: 'hide-sm small' }, e.ds && e.ds.length ? e.ds.join(', ') : ''), h('td', null, h('div', { class: 'btn-row' }, e.dateien.map(knopf))))))
      )
    );
  }

  async function materialien() {
    try {
      const [m, welten] = await Promise.all([api('GET', '/api/lehrer/materialien'), vorschauDaten()]);
      const titel = new Map(welten.map((w) => [w.nr, w]));
      seite(
        'materialien',
        h('h1', null, '📂 Materialien für Lehrkräfte'),
        h('p', { class: 'muted' }, 'Lösungen, Erwartungshorizonte, Präsentationen, Lehrerhinweise und Klausuren als PDF – sortiert nach Welten. 🔒 = nur für angemeldete Lehrkräfte; die Schülerfassungen finden angemeldete Schüler zusätzlich auf der Themenseite.'),
        h('p', { class: 'callout warn' }, h('strong', null, 'Bitte nicht an Schülerinnen und Schüler weitergeben: '), 'Die 🔒-Dateien enthalten Lösungen bzw. Klausuren.'),
        !m.welten.length ? h('p', { class: 'callout' }, 'Auf diesem Server sind keine Materialien hinterlegt.') : null,
        m.allgemein.length ? h('section', { class: 'card' }, h('h2', null, 'Allgemein'), materialTabelle(m.allgemein)) : null,
        h('nav', { class: 'card chips', 'aria-label': 'Sprung zur Welt' }, h('strong', null, 'Welten: '), m.welten.map((w) => h('a', { class: 'pill', href: '#/materialien', onclick: (ev) => { ev.preventDefault(); const z = document.getElementById(`material-welt-${w.nr}`); if (z) z.scrollIntoView(); } }, `${w.nr} ${titel.has(w.nr) ? titel.get(w.nr).titel : ''}`))),
        m.welten.map((w) => {
          const t = titel.get(w.nr);
          const el = h('section', { class: 'card level-kopf', id: `material-welt-${w.nr}` }, h('h2', null, `Welt ${w.nr}${t ? ': ' + t.titel : ''}`), materialTabelle(w.eintraege));
          if (t) el.style.setProperty('--welt', t.farbe);
          return el;
        })
      );
    } catch (e) {
      fehler(e);
    }
  }

  async function vorschauAufgabe(id) {
    const d = await api('GET', `/api/lehrer/vorschau/${encodeURIComponent(id)}`);
    const a = d.aufgabe;
    const o = d.ort;
    const ctrl = AQI.aufgabe(a, { vorschau: true });
    ctrl.loesung(d.loesung, d.muster);
    ctrl.sperren(true);
    const nav = (aid, text) => (aid ? h('a', { class: 'btn secondary', href: `#/vorschau/aufgabe/${encodeURIComponent(aid)}` }, text) : null);
    const box = h(
      'div',
      null,
      h('nav', { class: 'crumbs' }, h('a', { href: '#/vorschau' }, 'Aufgaben'), '›', h('a', { href: `#/vorschau/welt/${o.welt.nr}` }, `Welt ${o.welt.nr}: ${o.welt.titel}`), '›', h('span', null, o.level ? `Level ${o.level.nr} – ${o.level.titel}` : `Boss-Pool: ${o.boss ? o.boss.titel : ''}`), '›', h('span', null, `${o.index + 1} von ${o.anzahl}`)),
      h('div', { class: 'aufgabe-kopf' }, h('h1', null, a.titel), AQ.sterne(a.stufe), h('span', { class: 'pill gold' }, `${a.punkte} Punkte`), h('span', { class: 'pill' }, a.kategorie), AQ.niveau(a.niveau), (a.fallen || []).map((p) => h('span', { class: 'pill red' }, '⚠ ' + p)), h('span', { class: 'pill grey' }, a.id)),
      o.level && (o.level.ab || o.level.ide) ? h('p', { class: 'small muted' }, o.level.ab ? `📄 ${o.level.ab}` : '', o.level.ab && o.level.ide ? ' · ' : '', o.level.ide ? `💻 ${o.level.ide}` : '') : null,
      h('div', { class: 'callout ok small' }, 'Vorschau mit eingesetzter Lösung (blau markiert). Nur lesend – Schülerstände werden nicht verändert.'),
      h('section', { class: 'card' }, ctrl.el),
      d.tipps && d.tipps.length ? h('section', { class: 'card' }, h('h2', null, '💡 Tipps'), d.tipps.map((t, i) => h('div', { class: 'tipp-box' }, h('strong', null, `Tipp ${i + 1}: `), AQR.md(t, null, 'span')))) : null,
      d.erklaerung && d.erklaerung.length ? h('section', { class: 'card erklaerung' }, h('h2', null, '📖 Erklärung'), AQR.bloecke(d.erklaerung, null)) : null,
      h('div', { class: 'btn-row' }, nav(o.vorher, '← vorherige Aufgabe'), h('a', { class: 'btn secondary', href: `#/vorschau/welt/${o.welt.nr}` }, 'Übersicht der Welt'), nav(o.nachher, 'nächste Aufgabe →'))
    );
    box.style.setProperty('--welt', o.welt.farbe);
    seite('vorschau', box);
    window.scrollTo(0, 0);
  }

  /* ---------- Superadmin ---------- */

  const ADMIN_TABS = [
    ['lehrkraefte', '👩‍🏫 Lehrkräfte & Anfragen'],
    ['inhalte', '📦 Inhalte'],
    ['kata', '🔥 Warm-up-Import'],
    ['backup', '💾 Backup & Verbund']
  ];

  async function admin(tab = 'lehrkraefte') {
    if (konto.rolle !== 'superadmin') return kursListe();
    const box = h('div');
    seite('admin', h('h1', null, 'Verwaltung (Superadmin)'), h('div', { class: 'tabs', role: 'tablist' }, ADMIN_TABS.map(([key, label]) => h('button', { type: 'button', role: 'tab', 'aria-selected': key === tab ? 'true' : 'false', onclick: () => (location.hash = `#/admin/${key}`) }, label))), box);
    try {
      await ({ lehrkraefte: adminLehrkraefte, inhalte: adminInhalte, kata: adminKata, backup: adminBackup }[tab] || adminLehrkraefte)(box);
    } catch (e) {
      fehler(e);
    }
  }

  async function adminLehrkraefte(box) {
    const liste = await api('GET', '/api/admin/lehrkraefte');
    const aktion = async (lk, status, text) => {
      if (!(await bestaetigen(text, `${lk.name} (${lk.email})`, { ok: text, gefahr: status !== 'aktiv' }))) return;
      try {
        await api('POST', `/api/admin/lehrkraefte/${lk.id}/status`, { status });
        toast('Gespeichert.');
        adminLehrkraefte(box);
      } catch (e) {
        fehler(e);
      }
    };
    const wartend = liste.filter((l) => l.status === 'wartet');
    const STATUS = { wartet: ['gold', 'wartet'], aktiv: ['green', 'aktiv'], abgelehnt: ['red', 'abgelehnt'], deaktiviert: ['grey', 'deaktiviert'] };
    mount(
      box,
      h(
        'section',
        { class: 'card' },
        h('h2', null, `Offene Anfragen (${wartend.length})`),
        wartend.length
          ? wartend.map((l) => h('div', { class: 'callout gold' }, h('p', null, h('strong', null, l.name), ` · ${l.email} · ${l.schule} · ${fmtDatum(l.erstellt)}`), l.nachricht ? h('p', { class: 'small' }, '„', l.nachricht, '“') : null, h('div', { class: 'btn-row' }, h('button', { class: 'btn green small', type: 'button', onclick: () => aktion(l, 'aktiv', 'Freigeben') }, '✔ Freigeben'), h('button', { class: 'btn danger small', type: 'button', onclick: () => aktion(l, 'abgelehnt', 'Ablehnen') }, '✘ Ablehnen'))))
          : h('p', { class: 'muted' }, 'Keine offenen Anfragen.')
      ),
      h(
        'section',
        { class: 'card' },
        h('h2', null, 'Alle Konten'),
        h(
          'div',
          { class: 'scroll-x' },
          h(
            'table',
            { class: 'liste' },
            h('thead', null, h('tr', null, h('th', null, 'Name'), h('th', null, 'E-Mail'), h('th', null, 'Schule'), h('th', null, 'Status'), h('th', { class: 'num' }, 'Kurse'), h('th', { class: 'num' }, 'Schüler'), h('th', null, 'letzter Login'), h('th', null, 'Aktionen'))),
            h(
              'tbody',
              null,
              liste.map((l) =>
                h(
                  'tr',
                  null,
                  h('td', null, h('strong', null, l.name), l.rolle === 'superadmin' ? h('span', { class: 'pill gold' }, 'Superadmin') : null),
                  h('td', null, l.email),
                  h('td', null, l.schule),
                  h('td', null, h('span', { class: 'pill ' + STATUS[l.status][0] }, STATUS[l.status][1]), l.mussPasswortAendern ? h('div', { class: 'small muted' }, 'Einmal-Passwort aktiv') : null),
                  h('td', { class: 'num' }, String(l.kurse)),
                  h('td', { class: 'num' }, String(l.schueler)),
                  h('td', null, fmtDatum(l.letzterLogin)),
                  h(
                    'td',
                    null,
                    l.rolle === 'superadmin'
                      ? h('span', { class: 'small muted' }, 'über ADMIN_PASSWORD')
                      : h(
                          'div',
                          { class: 'btn-row' },
                          l.status === 'aktiv' ? h('button', { class: 'btn small secondary', type: 'button', onclick: () => aktion(l, 'deaktiviert', 'Deaktivieren') }, 'Deaktivieren') : null,
                          l.status === 'deaktiviert' || l.status === 'abgelehnt' ? h('button', { class: 'btn small secondary', type: 'button', onclick: () => aktion(l, 'aktiv', 'Aktivieren') }, 'Aktivieren') : null,
                          h('button', { class: 'btn small secondary', type: 'button', onclick: async () => {
                            if (!(await bestaetigen('Einmal-Passwort setzen?', `Für ${l.name} wird ein neues Passwort erzeugt. Es wird genau einmal angezeigt und muss beim nächsten Login geändert werden.`, { ok: 'Erzeugen' }))) return;
                            try {
                              const r = await api('POST', `/api/admin/lehrkraefte/${l.id}/einmalpasswort`, {});
                              await bestaetigen('Einmal-Passwort', h('div', null, h('p', null, `Bitte ${l.name} auf sicherem Weg mitteilen:`), h('p', { class: 'code-gross' }, r.passwort)), { ok: 'Notiert', abbrechen: 'Schließen' });
                              adminLehrkraefte(box);
                            } catch (e) {
                              fehler(e);
                            }
                          } }, 'Einmal-Passwort'),
                          h('button', { class: 'btn small danger', type: 'button', onclick: async () => {
                            if (!(await bestaetigen('Konto löschen?', `${l.name} wird mit allen ${l.kurse} Kursen und ${l.schueler} Schülern endgültig gelöscht.`, { ok: 'Endgültig löschen', gefahr: true, eingabe: { label: 'E-Mail eintippen', muss: l.email } }))) return;
                            try {
                              await api('DELETE', `/api/admin/lehrkraefte/${l.id}`);
                              toast('Gelöscht.');
                              adminLehrkraefte(box);
                            } catch (e) {
                              fehler(e);
                            }
                          } }, 'Löschen')
                        )
                  )
                )
              )
            )
          )
        )
      )
    );
  }

  async function adminInhalte(box) {
    const d = await api('GET', '/api/admin/inhalte');
    const zeigeBericht = (bericht) =>
      bericht.length
        ? bericht.map((r) => h('div', { class: 'callout ' + (r.status === 'übersprungen' ? 'warn' : r.fehler.length ? 'gold' : 'ok') }, h('p', null, h('strong', null, r.datei), ` – ${r.status}`, r.aufgaben ? `, ${r.aufgaben} Aufgaben aktiv` : '', r.ausgelassen ? `, ${r.ausgelassen} fehlerhafte ausgelassen` : '', r.warnungen ? `, ${r.warnungen} Hinweise` : ''), r.fehler.length ? h('ul', { class: 'small' }, r.fehler.slice(0, 30).map((f) => h('li', null, f))) : null))
        : h('p', { class: 'muted' }, 'In diesem Lauf wurden keine Welt-Dateien gefunden.');
    const berichtBox = h('div', null, zeigeBericht(d.bericht));
    mount(
      box,
      h(
        'section',
        { class: 'card' },
        h('h2', null, 'Geladene Welten'),
        d.welten.length
          ? h(
              'div',
              { class: 'scroll-x' },
              h(
                'table',
                { class: 'liste' },
                h('thead', null, h('tr', null, h('th', null, 'Welt'), h('th', { class: 'num' }, 'Level'), h('th', { class: 'num' }, 'Aufgaben'), h('th', { class: 'num' }, 'Boss-Pool'), h('th', { class: 'num' }, 'Level-Punkte'))),
                h('tbody', null, d.welten.map((w) => h('tr', null, h('td', null, `${w.nr}: ${w.titel}`), h('td', { class: 'num' }, String(w.levels)), h('td', { class: 'num' }, String(w.aufgaben)), h('td', { class: 'num' }, String(w.bossPool)), h('td', { class: 'num' }, String(w.maxPunkte)))))
              )
            )
          : h('p', { class: 'muted' }, 'Keine Welten geladen.'),
        h('p', { class: 'small muted' }, `Warm-up-Karten: ${d.katas.welten.reduce((x, w) => x + w.anzahl, 0)}`)
      ),
      h(
        'section',
        { class: 'card' },
        h('div', { class: 'row' }, h('h2', null, 'Seed-Bericht'), h('button', { class: 'btn secondary small right', type: 'button', onclick: async () => {
          try {
            const r = await api('POST', '/api/admin/inhalte/neu-laden', {});
            mount(berichtBox, zeigeBericht(r.bericht));
            toast('Inhalte neu geladen.');
          } catch (e) {
            fehler(e);
          }
        } }, '↻ seed/welten neu einlesen')),
        h('p', { class: 'small muted' }, 'Welt-Dateien liegen in seed/welten/*.json und werden bei jedem Start per Upsert eingelesen (Lernstände bleiben). Fehlerhafte Aufgaben werden ausgelassen; eine unbrauchbare Datei wird übersprungen.'),
        berichtBox
      )
    );
  }

  async function adminKata(box) {
    const datei = h('input', { type: 'file', accept: '.json,application/json', 'aria-label': 'Warm-up-Datei' });
    const ergebnis = h('div', { 'aria-live': 'polite' });
    mount(
      box,
      h(
        'section',
        { class: 'card' },
        h('h2', null, 'Warm-up-Karten importieren'),
        h('p', { class: 'small muted' }, 'JSON im Format {"version": 1, "karten": [...]} (wie Werkzeuge/warmup_w*.json). Karten werden nach id ergänzt bzw. ersetzt; fehlerhafte Dateien werden komplett abgelehnt.'),
        h('div', { class: 'row' }, datei, h('button', { class: 'btn', type: 'button', onclick: async () => {
          if (!datei.files[0]) return toast('Bitte eine Datei wählen.', true);
          try {
            const r = await api('POST', '/api/admin/katas/import', JSON.parse(await readFile(datei.files[0])));
            mount(ergebnis, h('p', { class: 'callout ok' }, `${r.neu} neu, ${r.aktualisiert} aktualisiert – insgesamt ${r.gesamt} Karten.`));
          } catch (e) {
            mount(ergebnis, h('div', { class: 'callout warn' }, h('p', null, e.message), e.details ? h('ul', { class: 'small' }, e.details.map((x) => h('li', null, x))) : null));
          }
        } }, 'Importieren')),
        ergebnis
      )
    );
  }

  /** Verbund Phase 2: Zuordnung aus dem Portal (Download „Zuordnung“ im Portal) – erst Probelauf, dann einspielen */
  function zuordnungKarte() {
    const datei = h('input', { type: 'file', accept: '.json,application/json', 'aria-label': 'Zuordnungsdatei' });
    const ergebnis = h('div');
    const lauf = async (probelauf) => {
      if (!datei.files[0]) return toast('Bitte die Zuordnungsdatei wählen.', true);
      try {
        const zuordnung = JSON.parse(await readFile(datei.files[0]));
        if (!probelauf && !(await bestaetigen('Zuordnung einspielen?', 'Konten, Kurse und Schüler werden auf die Kennungen des Portals umgestellt. Schüler melden sich danach nur noch über das Portal an (gleicher Name und Code). Vorher ein Backup herunterladen!', { ok: 'Einspielen' }))) return;
        const r = await api('POST', '/api/admin/verbund/zuordnung', { zuordnung, probelauf });
        mount(
          ergebnis,
          h('div', { class: 'callout ' + (probelauf ? 'gold' : 'ok') },
            h('p', null, h('strong', null, probelauf ? 'Probelauf (nichts geändert): ' : 'Eingespielt: '), `${r.lehrkraefte} Lehrkräfte, ${r.kurse} Kurse, ${r.schueler} Schüler umgestellt · ${r.zusammengefuehrt} zusammengeführt · ${r.unveraendert} schon aktuell.`),
            r.hinweise.length ? h('ul', null, r.hinweise.map((t) => h('li', null, t))) : null,
            r.uebersprungen.length ? h('p', null, h('strong', null, 'Übersprungen: '), r.uebersprungen.join(' · ')) : null
          )
        );
      } catch (e) {
        mount(ergebnis, h('p', { class: 'callout warn' }, e.message));
      }
    };
    return h(
      'section',
      { class: 'card' },
      h('h2', null, '⌂ Verbund InfoLabs: Zuordnung einspielen'),
      h('p', { class: 'small muted' }, 'Nach der Datenübernahme im Portal (Backup hochladen → Import) dort die Zuordnung herunterladen und hier einspielen. Lernstände bleiben erhalten; Lehrkräfte und Schüler finden ihren Stand nach der Anmeldung über das Portal wieder. Mehrfaches Einspielen ist unschädlich.'),
      h('div', { class: 'row' }, datei, h('button', { class: 'btn secondary', type: 'button', onclick: () => lauf(true) }, 'Probelauf'), h('button', { class: 'btn gold', type: 'button', onclick: () => lauf(false) }, 'Einspielen')),
      ergebnis
    );
  }

  async function adminBackup(box) {
    const datei = h('input', { type: 'file', accept: '.json,application/json', 'aria-label': 'Backup-Datei' });
    mount(
      box,
      zuordnungKarte(),
      h('section', { class: 'card' }, h('h2', null, 'Backup herunterladen'), h('p', { class: 'small muted' }, 'Vollständige Sicherung aller Tabellen als JSON (Konten, Kurse, Schüler, Lernstände, Inhalte, Warm-up-Karten).'), h('button', { class: 'btn', type: 'button', onclick: () => download('/api/admin/backup') }, '⬇ Backup (JSON)')),
      h(
        'section',
        { class: 'card danger-zone' },
        h('h2', null, 'Backup wiederherstellen'),
        h('p', null, 'Ersetzt ALLE Daten durch den Inhalt der Datei. Der Superadmin aus den Umgebungsvariablen bleibt erhalten.'),
        h('div', { class: 'row' }, datei, h('button', { class: 'btn danger', type: 'button', onclick: async () => {
          if (!datei.files[0]) return toast('Bitte eine Datei wählen.', true);
          if (!(await bestaetigen('Wirklich wiederherstellen?', 'Alle aktuellen Daten werden ersetzt.', { ok: 'Wiederherstellen', gefahr: true, eingabe: { label: 'WIEDERHERSTELLEN eintippen', muss: 'WIEDERHERSTELLEN' } }))) return;
          try {
            const r = await api('POST', '/api/admin/restore', JSON.parse(await readFile(datei.files[0])));
            toast(`Wiederhergestellt: ${Object.entries(r.counts).filter(([, n]) => n).map(([t, n]) => `${t} ${n}`).join(', ')}`);
          } catch (e) {
            fehler(e);
          }
        } }, 'Wiederherstellen'))
      )
    );
  }

  /* ---------- Router ---------- */

  function route() {
    if (!konto) return anmeldeSeite();
    if (konto.mussPasswortAendern) return passwortSeite(true);
    const [name, a, b] = location.hash.replace(/^#\/?/, '').split('/');
    if (name === 'kurs' && a) return kurs(Number(a), b);
    if (name === 'konto') return passwortSeite(false);
    if (name === 'admin') return admin(a);
    if (name === 'vorschau') return vorschau(a, b && decodeURIComponent(b));
    if (name === 'materialien') return materialien();
    return kursListe();
  }

  async function start() {
    try {
      const s = await api('GET', '/api/sitzung');
      konto = s.lehrkraft;
      if (s.verbund) verbund = s.verbund;
    } catch {
      konto = null;
    }
    route();
  }
  window.addEventListener('hashchange', route);
  start();
})();
