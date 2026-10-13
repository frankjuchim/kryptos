/* Kryptos – Datenschutz /datenschutz (M4 Task 61, Design §12): der Text steht statisch im HTML (funktioniert ohne
   Skript). Hier nur: Kopfzeile je Rolle und der Link auf die zentrale Erklärung des Portals (<portal>/datenschutz),
   sobald /api/sitzung die Portal-Adresse liefert (sonst bleibt /sso/portal). */
'use strict';

const KRDatenschutz = (() => {
  /** Link #portal-datenschutz auf <portal>/datenschutz setzen (nur http(s)-Adressen). */
  function portalLink(portal) {
    const a = document.getElementById('portal-datenschutz');
    if (!a || !portal || !/^https?:\/\/[^\s"'<>]+$/.test(String(portal))) return;
    a.setAttribute('href', String(portal).replace(/\/+$/, '') + '/datenschutz');
  }

  async function start() {
    KR.epoche(6);
    const sitzung = await AQ.api('GET', '/api/sitzung').catch(() => ({}));
    const rolle = sitzung && ['schueler', 'lehrkraft', 'superadmin'].includes(sitzung.rolle) ? sitzung.rolle : null;
    if (typeof KRKopf !== 'undefined') KRKopf.baue({ rolle, sitzung: sitzung || {} });
    portalLink(sitzung && sitzung.portal);
  }
  document.addEventListener('DOMContentLoaded', start);

  return { portalLink };
})();
