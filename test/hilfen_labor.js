'use strict';
// Testhilfe Kryptolabor (Plan M6 Task 110): Werkzeug-Modul im Attrappen-DOM öffnen. Timer laufen im Zeitraffer (÷ 100),
// damit Nachspiele mit 900/2400 ms in `await k.ruhe()` durchlaufen; k.timer zeigt weiter die angeforderten Millisekunden.
const D = require('./dom_attrappe');
const Krypto = require('../public/static/js/shared/krypto.js');

const fs = require('node:fs');
const path = require('node:path');
// M11: Erkenner und seine Daten (labor/erkenner/<id>.js) gehören zum Rahmen jedes Werkzeugs
const ERKENNER = fs.readdirSync(path.join(__dirname, '..', 'public', 'static', 'js', 'krypto', 'labor', 'erkenner')).filter((f) => f.endsWith('.js')).sort().map((f) => `krypto/labor/erkenner/${f}`);
const BASIS = ['common.js', 'krypto/oberflaeche.js', 'shared/krypto.js', 'render.js', 'krypto/diagnose_chips.js', 'krypto/labor/registry.js', 'krypto/werkzeug_panel.js', 'krypto/bloecke.js', 'krypto/labor/bausteine.js', 'krypto/labor/station.js', 'krypto/labor/erkenner.js', 'krypto/labor/gefuehrt.js', ...ERKENNER];
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

module.exports = { oeffne, BASIS, ZEITRAFFER, Krypto, ERKENNER_SKRIPTE: ['krypto/labor/erkenner.js', 'krypto/labor/gefuehrt.js', ...ERKENNER] };
