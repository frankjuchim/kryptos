/* Algo Quest Lab – Abschluss-Urkunden (nur Lehrkraft/Superadmin): eine A4-Urkunde je Schüler, druckbar.
 * Optional eine leere Zeile für den vollständigen Namen (wird nirgends gespeichert). */
'use strict';
(async () => {
  const { h, mount, api } = AQ;
  const app = document.getElementById('app');
  const id = Number(new URLSearchParams(location.search).get('kurs'));
  const TITEL = 'Algo Quest – Das Dungeon der Datenstrukturen';
  const heute = () => {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  };
  const fmt = (iso) => (/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}` : '');
  const opt = { auswahl: 'alle', gewaehlt: new Set(), platz: 'alle', datum: heute(), unterschrift: 'Kursleitung', namenszeile: true };

  try {
    const s = await api('GET', '/api/sitzung');
    if (!s.lehrkraft) {
      location.href = '/lehrer';
      return;
    }
    if (!Number.isInteger(id) || id < 1) throw new Error('Kein Kurs gewählt. Bitte die Urkunden über den Lehrkraft-Bereich öffnen.');
    const data = await api('GET', `/api/lehrer/kurse/${id}/urkunden`);
    document.title = `Urkunden – ${data.kurs.name}`;
    start(data);
  } catch (e) {
    mount(app, h('main', { class: 'narrow' }, h('p', { class: 'callout warn' }, e.message), h('p', null, h('a', { href: '/lehrer' }, 'Zurück zum Lehrkraft-Bereich'))));
  }

  function start(data) {
    const seiten = h('div', { class: 'cert-pages' });
    const zaehler = h('p', { class: 'muted small' });
    const einzelBox = h('div', { class: 'cert-auswahl', hidden: true, role: 'group', 'aria-label': 'Schüler auswählen' },
      data.schueler.map((s) => {
        const cb = h('input', { type: 'checkbox', onchange: (e) => {
          if (e.target.checked) opt.gewaehlt.add(s.id);
          else opt.gewaehlt.delete(s.id);
          zeichne();
        } });
        return h('label', { class: 'check' }, cb, s.name);
      }));
    const auswahl = h('select', { id: 'u-auswahl', onchange: (e) => {
      opt.auswahl = e.target.value;
      einzelBox.hidden = opt.auswahl !== 'einzeln';
      zeichne();
    } }, h('option', { value: 'alle' }, `Alle Schüler (${data.anzahl})`), h('option', { value: 'einzeln' }, 'Einzelne Schüler auswählen …'));
    const platz = h('select', { id: 'u-platz', onchange: (e) => {
      opt.platz = e.target.value;
      zeichne();
    } }, h('option', { value: 'alle' }, 'auf jeder Urkunde zeigen'), h('option', { value: 'top3' }, 'nur bei Platz 1–3 zeigen'), h('option', { value: 'aus' }, 'ausblenden'));
    const datum = h('input', { type: 'date', id: 'u-datum', value: opt.datum, oninput: (e) => {
      opt.datum = e.target.value;
      zeichne();
    } });
    const unterschrift = h('input', { type: 'text', id: 'u-sig', maxlength: '60', value: opt.unterschrift, oninput: (e) => {
      opt.unterschrift = e.target.value;
      zeichne();
    } });
    const namenszeile = h('input', { type: 'checkbox', checked: opt.namenszeile, onchange: (e) => {
      opt.namenszeile = e.target.checked;
      zeichne();
    } });

    mount(
      app,
      h(
        'main',
        { class: 'cert-main' },
        h(
          'section',
          { class: 'no-print card cert-options', 'aria-label': 'Optionen' },
          h('div', { class: 'row' }, h('div', { class: 'grow' }, h('h1', null, '🏅 Urkunden – ', data.kurs.name), zaehler), h('button', { class: 'btn gold', type: 'button', id: 'drucken', onclick: () => window.print() }, '🖨 Drucken'), h('a', { class: 'btn secondary', href: `/lehrer#/kurs/${data.kurs.id}/schueler` }, 'Zurück')),
          h('div', { class: 'row end' }, h('div', { class: 'grow' }, h('label', { for: 'u-auswahl' }, 'Auswahl'), auswahl), h('div', { class: 'grow' }, h('label', { for: 'u-platz' }, 'Platzierung im Kurs'), platz), h('div', null, h('label', { for: 'u-datum' }, 'Datum'), datum), h('div', { class: 'grow' }, h('label', { for: 'u-sig' }, 'Text unter der Unterschrift'), unterschrift)),
          einzelBox,
          h('label', { class: 'check' }, namenszeile, ' Leere Zeile für den vollständigen Namen (handschriftlich, wird nicht gespeichert)'),
          h('p', { class: 'hint' }, 'Je Urkunde eine A4-Seite (hochkant). Im Druckdialog Skalierung 100 % und „Hintergrundgrafiken“ wählen.')
        ),
        seiten
      )
    );

    function fakt(wert, label) {
      return h('div', { class: 'cert-fact' }, h('div', { class: 'v' }, wert), h('div', { class: 'l' }, label));
    }

    function urkunde(s) {
      const zeigePlatz = opt.platz === 'alle' || (opt.platz === 'top3' && s.platz <= 3);
      return h(
        'article',
        { class: 'cert-page' },
        h(
          'div',
          { class: 'cert' },
          h(
            'div',
            { class: 'cert-inner' },
            h('div', { class: 'cert-head' }, h('span', { class: 'brand-mark', 'aria-hidden': 'true' }, 'AQ')),
            h('h2', { class: 'cert-title' }, 'Urkunde'),
            h('p', { class: 'cert-kind' }, TITEL),
            h('p', { class: 'cert-lead' }, 'Im Kurs ', h('strong', null, data.kurs.name), ' hat'),
            h('div', { class: 'cert-name' }, s.name),
            opt.namenszeile ? h('div', { class: 'cert-realname' }, h('span', null, 'Name:'), h('span', { class: 'blank' })) : null,
            h('p', { class: 'cert-lead' }, 'das Dungeon der Datenstrukturen durchquert und den Rang'),
            h('div', { class: 'cert-rank' }, s.rang),
            h('p', { class: 'cert-lead' }, 'erreicht.'),
            h('ol', { class: 'cert-ladder', 'aria-label': 'Rangstufen' }, data.raenge.map((r) => h('li', { class: r === s.rang ? 'on' : null }, r))),
            h('div', { class: 'cert-facts' }, fakt(String(s.punkte), 'Punkte'), fakt(String(s.geloest), 'gelöste Aufgaben'), zeigePlatz ? fakt(`${s.platz}.`, `Platz im Kurs (von ${data.anzahl})`) : null, fakt(String(s.abzeichen.length), s.abzeichen.length === 1 ? 'Abzeichen' : 'Abzeichen')),
            s.abzeichen.length ? h('div', { class: 'cert-badges' }, h('div', { class: 'cert-badges-title' }, 'Errungene Abzeichen'), h('ul', null, s.abzeichen.map((b) => h('li', null, h('span', { 'aria-hidden': 'true' }, b.icon), b.name)))) : null,
            h('div', { class: 'cert-grow' }),
            h('div', { class: 'cert-foot' }, h('div', { class: 'cert-line' }, h('div', { class: 'val' }, fmt(opt.datum)), h('div', { class: 'lbl' }, 'Datum')), h('div', { class: 'cert-line' }, h('div', { class: 'val' }, ''), h('div', { class: 'lbl' }, opt.unterschrift.trim() || 'Unterschrift')))
          )
        )
      );
    }

    function zeichne() {
      const liste = opt.auswahl === 'alle' ? data.schueler : data.schueler.filter((s) => opt.gewaehlt.has(s.id));
      zaehler.textContent = `${liste.length} Urkunde${liste.length === 1 ? '' : 'n'} (je eine A4-Seite)`;
      mount(seiten, liste.length ? liste.map(urkunde) : h('p', { class: 'muted no-print' }, opt.auswahl === 'alle' ? 'Noch keine Schüler im Kurs.' : 'Bitte Schüler auswählen.'));
    }
    zeichne();
  }
})();
