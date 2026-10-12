/* Algo Quest Lab – Startseite: Kurs beitreten (Kurscode + Name → persönlicher Code) oder weiterspielen (Name + Code). */
'use strict';
(async () => {
  const { api } = AQ;
  const $ = (id) => document.getElementById(id);
  const tabNeu = $('tab-neu');
  const tabWeiter = $('tab-weiter');

  function zeigeTab(weiter) {
    tabNeu.setAttribute('aria-selected', weiter ? 'false' : 'true');
    tabWeiter.setAttribute('aria-selected', weiter ? 'true' : 'false');
    $('form-neu').hidden = weiter;
    $('form-weiter').hidden = !weiter;
  }
  tabNeu.addEventListener('click', () => zeigeTab(false));
  tabWeiter.addEventListener('click', () => zeigeTab(true));

  // Beitritts-Link /k/<KURSCODE>
  const m = /^\/k\/([A-Za-z0-9]{4,12})\/?$/.exec(location.pathname);
  if (m) {
    const code = m[1].toUpperCase();
    $('neu-kurs').value = code;
    try {
      const k = await api('GET', `/api/kurs/${code}`);
      const info = $('kurs-info');
      info.hidden = false;
      info.textContent = k.anmeldung ? `Kurs „${k.name}“ – wähle deinen Namen.` : `Kurs „${k.name}“: Die Anmeldung neuer Schüler ist gerade geschlossen.`;
      $('neu-name').focus();
    } catch {
      /* Kurs unbekannt – Fehler erscheint beim Absenden */
    }
  }

  try {
    const s = await api('GET', '/api/sitzung');
    // Plattform-Verbund: Anmeldung über das Portal anbieten; im Modus „portal“ keine lokalen Formulare
    if (s.verbund && s.verbund.sso) $('portal-box').hidden = false;
    if (s.verbund && !s.verbund.lokal) $('formulare').hidden = true;
    if (s.schueler) {
      $('weiter-box').hidden = false;
      $('weiter-name').textContent = `${s.schueler.name} (Kurs „${s.schueler.kurs}“)`;
    }
  } catch {
    /* egal */
  }

  function fehler(id, text) {
    const el = $(id);
    el.textContent = text || '';
    el.hidden = !text;
  }

  $('form-neu').addEventListener('submit', async (e) => {
    e.preventDefault();
    fehler('neu-fehler', '');
    try {
      const r = await api('POST', '/api/schueler/beitreten', { kurscode: $('neu-kurs').value.trim(), name: $('neu-name').value });
      $('formulare').hidden = true;
      $('weiter-box').hidden = true;
      $('code-box').hidden = false;
      $('code-name').textContent = r.name;
      $('code-name2').textContent = r.name;
      $('code-kurs').textContent = `${r.kurs} (${r.kurscode})`;
      $('code-wert').textContent = r.code;
      $('code-box').scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      fehler('neu-fehler', err.message);
      if (err.status === 409) $('w-name').value = $('neu-name').value;
    }
  });

  const los = $('code-los');
  los.addEventListener('click', (e) => {
    if (!$('code-ok').checked) {
      e.preventDefault();
      AQ.toast('Bitte bestätige, dass du deinen Code notiert hast.', true);
      $('code-ok').focus();
    }
  });
  $('code-ok').addEventListener('change', () => los.setAttribute('aria-disabled', $('code-ok').checked ? 'false' : 'true'));

  $('form-weiter').addEventListener('submit', async (e) => {
    e.preventDefault();
    fehler('w-fehler', '');
    try {
      const kurscode = $('w-kurs-feld').hidden ? '' : $('w-kurs').value.trim();
      await api('POST', '/api/schueler/anmelden', { name: $('w-name').value, code: $('w-code').value, ...(kurscode ? { kurscode } : {}) });
      location.href = '/spiel';
    } catch (err) {
      fehler('w-fehler', err.message);
      // nur bei alten, doppelt vergebenen Codes: Kurscode zusätzlich abfragen
      if (err.data && err.data.kurscodeNoetig) {
        $('w-kurs-feld').hidden = false;
        $('w-kurs').required = true;
        $('w-kurs').focus();
      }
    }
  });
})();
