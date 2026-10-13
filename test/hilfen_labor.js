'use strict';
// Testhilfe Kryptolabor (Plan M6 Task 110): Werkzeug-Modul im Attrappen-DOM öffnen. Timer laufen im Zeitraffer (÷ 100),
// damit Nachspiele mit 900/2400 ms in `await k.ruhe()` durchlaufen; k.timer zeigt weiter die angeforderten Millisekunden.
const D = require('./dom_attrappe');
const Krypto = require('../public/static/js/shared/krypto.js');

const BASIS = ['common.js', 'krypto/oberflaeche.js', 'shared/krypto.js', 'render.js', 'krypto/diagnose_chips.js', 'krypto/labor/registry.js', 'krypto/bloecke.js', 'krypto/labor/bausteine.js'];
const ZEITRAFFER = 100;

/** Werkzeug id im Attrappen-DOM öffnen. opt: { voreinstellung, umgebung, ruhig, zufall } */
function oeffne(id, opt = {}) {
  const k = D.lade([...BASIS, `krypto/labor/${id}.js`], {
    zeitraffer: ZEITRAFFER,
    vorher(kk) {
      if (opt.ruhig) kk.medien['(prefers-reduced-motion: reduce)'] = true;
    }
  });
  const flaeche = k.document.createElement('div');
  k.document.getElementById('haupt').appendChild(flaeche);
  const umgebung = { modus: 'labor', rolle: 'schueler', niveau: 'eA', welten: [0, 1, 2, 3, 4, 5, 6], ...(opt.umgebung || {}) };
  if (opt.zufall) umgebung.zufall = opt.zufall;
  const ctrl = k.wert('KRLabor').oeffne(id, opt.voreinstellung || {}, flaeche, umgebung);
  const zustand = () => k.roh(ctrl.zustand());
  const text = (sel) => k.text(k.eins(flaeche, sel));
  const ohneLeer = (sel) => text(sel).replace(/\s+/g, '');
  const reiter = (r) => k.klick(k.eins(flaeche, `[role="tab"][data-reiter="${r}"]`));
  return { k, flaeche, ctrl, zustand, text, ohneLeer, reiter, Krypto };
}

module.exports = { oeffne, BASIS, ZEITRAFFER, Krypto };
