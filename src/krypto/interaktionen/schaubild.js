'use strict';
// Interaktion schaubild-ergaenzen (AUFGABENFORMAT_KRYPTO §8.3): Lücken [[id]] im Pfeiltext eines schaubild-Blocks.
// Feldtypen: schluessel (Schlüsselart × Inhaber), auswahl (optionen, exakt), text (norm wie gaps). Feedback je Feld,
// Fallen-Diagnose §9.5 (P9), Validator: Block, Lücken ↔ Felder, angebotene Arten/Inhaber.
// Kanonische Antwort: { id: { art, inhaber } | Text | null } für alle Felder (null = leer).

const C = require('../../content/checker');
const F = require('../../content/format');
const D = require('../diagnose');

const { AntwortFehler } = C;
const ARTEN = ['oeffentlich', 'privat', 'sitzung'];
const TYPEN = ['schluessel', 'auswahl', 'text'];
const MAX_TEXT = 200;

const istObjekt = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
const leer = (x) => x === undefined || x === null || (typeof x === 'string' && x.trim() === '');

/** Akteur-ids des schaubild-Blocks, auf den ia.block zeigt (oder null, wenn unbekannt). */
function akteure(ia, aufgabe) {
  const b = aufgabe && Array.isArray(aufgabe.inhalt) ? aufgabe.inhalt[ia.block] : null;
  if (!istObjekt(b) || b.t !== 'schaubild' || !Array.isArray(b.akteure)) return null;
  return b.akteure.filter((a) => istObjekt(a) && typeof a.id === 'string').map((a) => a.id);
}

const artenVon = (feld) => (Array.isArray(feld.arten) ? feld.arten : ARTEN);
function inhaberVon(feld, ia, aufgabe) {
  if (Array.isArray(feld.inhaber)) return feld.inhaber;
  return akteure(ia, aufgabe);
}

function bereinige(ia, antwort, kontext = {}) {
  let a = antwort;
  if (a === undefined || a === null) a = {};
  if (!istObjekt(a)) throw new AntwortFehler('Antwort muss ein Objekt { feld: … } sein.');
  const felder = istObjekt(ia.felder) ? ia.felder : {};
  for (const k of Object.keys(a)) if (!(k in felder)) throw new AntwortFehler('Unbekanntes Feld.');
  const out = {};
  for (const [id, feld] of Object.entries(felder)) {
    const v = a[id];
    if ((feld && feld.typ) === 'schluessel') {
      if (v === undefined || v === null) {
        out[id] = null;
        continue;
      }
      if (!istObjekt(v)) throw new AntwortFehler('Ein Schlüssel besteht aus Art und Inhaber.');
      if (leer(v.art) && leer(v.inhaber)) {
        out[id] = null;
        continue;
      }
      if (typeof v.art !== 'string' || !artenVon(feld).includes(v.art)) throw new AntwortFehler('Unbekannte Schlüsselart.');
      const inh = inhaberVon(feld, ia, kontext && kontext.aufgabe);
      const gueltig = inh ? inh.includes(v.inhaber) : typeof v.inhaber === 'string' && /^[A-Z0-9]{1,4}$/.test(v.inhaber);
      if (!gueltig) throw new AntwortFehler('Unbekannter Inhaber.');
      out[id] = { art: v.art, inhaber: v.inhaber };
    } else {
      if (leer(v)) {
        out[id] = null;
        continue;
      }
      if (typeof v !== 'string' && typeof v !== 'number') throw new AntwortFehler('Antwort muss Text sein.');
      const s = String(v);
      if (s.length > MAX_TEXT) throw new AntwortFehler('Antwort ist zu lang.');
      out[id] = s;
    }
  }
  return out;
}

function istLeer(ia, a) {
  return Object.values(a || {}).every((x) => x === null);
}

/** Ist ein Feld richtig? schluessel: art und inhaber gleich; auswahl: exakt; text: norm (Std. code). */
function feldRichtig(feld, wert, akzeptiert) {
  const liste = Array.isArray(akzeptiert) ? akzeptiert : [akzeptiert];
  if (wert === null || wert === undefined) return false;
  if ((feld && feld.typ) === 'schluessel') return liste.some((x) => istObjekt(x) && x.art === wert.art && x.inhaber === wert.inhaber);
  return C.feldRichtig(feld, wert, liste.filter((x) => typeof x === 'string' || typeof x === 'number'));
}

function pruefe(ia, lo, a, teilweise, opt = {}) {
  const felder = {};
  let ok = true;
  for (const [id, feld] of Object.entries(ia.felder || {})) {
    felder[id] = feldRichtig(feld, a ? a[id] : null, lo ? lo[id] : undefined);
    if (!felder[id]) ok = false;
  }
  const r = { ok, felder };
  if (!ok && opt.diagnose && !istLeer(ia, a)) {
    const d = D.schaubild(ia, lo, a);
    if (d.length) r.diagnose = d;
  }
  return r;
}

function muster(ia, lo) {
  const out = {};
  for (const id of Object.keys(ia.felder || {})) {
    const v = lo ? lo[id] : undefined;
    out[id] = Array.isArray(v) ? (v[0] === undefined ? null : v[0]) : v === undefined ? null : v;
  }
  return out;
}

const lueckenFelder = (ia) => Object.keys((ia && istObjekt(ia.felder) && ia.felder) || {});

function validiere(ia, lo, aufgabe, ort, fa) {
  const lort = ort.replace('interaktion', 'loesung');
  const b = aufgabe && Array.isArray(aufgabe.inhalt) && Number.isInteger(ia.block) ? aufgabe.inhalt[ia.block] : null;
  const blockOk = istObjekt(b) && b.t === 'schaubild';
  if (!blockOk) fa(ort, 'block muss auf einen schaubild-Block in inhalt zeigen.');
  if (!istObjekt(ia.felder) || !Object.keys(ia.felder).length) return fa(ort, 'felder fehlt oder ist leer.');
  const ids = blockOk ? akteure(ia, aufgabe) || [] : null;
  // Lücken dieses Blocks ↔ Felder (beide Richtungen)
  if (blockOk) {
    const imBlock = new Set(F.luecken([b]).map((x) => x.id));
    for (const g of imBlock) if (!(g in ia.felder)) fa(ort, `Lücke [[${g}]] im Schaubild hat kein Feld.`);
    for (const fid of Object.keys(ia.felder)) if (!imBlock.has(fid)) fa(`${ort}.felder.${fid}`, `Feld „${fid}“ hat keine Lücke [[${fid}]] im Schaubild.`);
  }
  for (const [fid, feld] of Object.entries(ia.felder)) {
    const o = `${ort}.felder.${fid}`;
    if (!istObjekt(feld)) {
      fa(o, 'Feld muss ein Objekt ({ "typ": "schluessel" }) sein.');
      continue;
    }
    if (!TYPEN.includes(feld.typ)) {
      fa(o, `typ muss ${TYPEN.join(' | ')} sein.`);
      continue;
    }
    if (feld.typ === 'schluessel') {
      if (feld.arten !== undefined && (!Array.isArray(feld.arten) || !feld.arten.length || !feld.arten.every((x) => ARTEN.includes(x)))) {
        fa(o, `arten muss eine Liste aus ${ARTEN.join(', ')} sein.`);
      }
      if (feld.inhaber !== undefined && (!Array.isArray(feld.inhaber) || !feld.inhaber.length || (ids && !feld.inhaber.every((x) => ids.includes(x))))) {
        fa(o, 'inhaber muss eine Liste von Akteur-ids des Schaubilds sein.');
      }
    } else if (feld.typ === 'auswahl') {
      if (!Array.isArray(feld.optionen) || feld.optionen.length < 2 || feld.optionen.length > 8 || !feld.optionen.every((x) => typeof x === 'string' && x.trim())) {
        fa(o, 'auswahl braucht optionen (2–8 Texte).');
      }
    } else if (feld.norm !== undefined && !F.NORMEN.includes(feld.norm)) fa(o, `norm „${feld.norm}“ unbekannt (${F.NORMEN.join(' | ')}).`);

    // Lösung des Feldes
    const acc = lo[fid];
    const lo2 = `${lort}.${fid}`;
    if (!Array.isArray(acc) || !acc.length) {
      fa(lo2, `Lösung ${fid} muss eine nicht leere Liste akzeptierter Antworten sein.`);
      continue;
    }
    if (feld.typ === 'schluessel') {
      const arten = Array.isArray(feld.arten) ? feld.arten : ARTEN;
      const inhaber = Array.isArray(feld.inhaber) ? feld.inhaber : ids;
      for (const x of acc) {
        if (!istObjekt(x)) {
          fa(lo2, `Lösung ${fid}: Eintrag braucht art und inhaber.`);
          continue;
        }
        if (!arten.includes(x.art)) fa(lo2, `Lösung ${fid}: art „${x.art}“ wird nicht angeboten.`);
        if (inhaber && !inhaber.includes(x.inhaber)) fa(lo2, `Lösung ${fid}: inhaber „${x.inhaber}“ wird nicht angeboten.`);
      }
    } else if (!acc.every((x) => (typeof x === 'string' && x.trim()) || typeof x === 'number')) {
      fa(lo2, `Lösung ${fid}: Liste von Texten erwartet.`);
    } else if (feld.typ === 'auswahl' && Array.isArray(feld.optionen) && !acc.every((x) => feld.optionen.includes(String(x)))) {
      fa(lo2, `Lösung ${fid} muss eine der optionen sein.`);
    }
  }
  for (const k of Object.keys(lo)) if (!(k in ia.felder) && !k.startsWith('_')) fa(lort, `Lösung enthält unbekanntes Feld „${k}“.`);
}

const vertrag = Object.freeze({
  bereinige,
  istLeer,
  pruefe,
  muster,
  validiere,
  lueckenFelder,
  schritt: false,
  boss: Object.freeze({ erlaubt: true })
});

function registriere(Fmt) {
  Fmt.registriereInteraktion('schaubild-ergaenzen', vertrag);
}

module.exports = { vertrag, registriere };
