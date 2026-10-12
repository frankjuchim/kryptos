'use strict';
// Generatoren für den Trainingsplatz (SPEC §6): deterministisch aus einem Seed, Ausgabe im Aufgabenformat §3–§5.

const Baum = require('../../public/static/js/shared/baum');

/* ---------- Zufall (deterministisch) ---------- */

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function zufall(seed) {
  const r = mulberry32(seed);
  const z = {
    r,
    int: (a, b) => a + Math.floor(r() * (b - a + 1)),
    pick: (arr) => arr[Math.floor(r() * arr.length)],
    bool: (p = 0.5) => r() < p,
    mische(arr) {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(r() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
    verschiedene(n, lo, hi) {
      const s = new Set();
      while (s.size < n) s.add(z.int(lo, hi));
      return [...s];
    }
  };
  return z;
}

const txt = (md) => ({ t: 'text', md });
const code = (c) => ({ t: 'code', code: c, nummern: true });

/* ---------- Stapel / Schlange ---------- */

function stapelSchlange(art, seed) {
  const z = zufall(seed);
  const stapel = art === 'stapel';
  const start = z.verschiedene(z.int(1, 3), 1, 30);
  const inhalt = [...start];
  const zeilen = [];
  const anzahl = z.int(5, 8);
  const werte = new Set(start);
  const neuerWert = () => {
    let v;
    do v = z.int(1, 40);
    while (werte.has(v));
    werte.add(v);
    return v;
  };
  const var_ = stapel ? 's' : 'q';
  for (let i = 0; i < anzahl; i++) {
    const op = inhalt.length === 0 ? 0 : z.pick([0, 0, 1, 1, 2]);
    if (op === 0) {
      const v = neuerWert();
      zeilen.push(stapel ? `s.push(${v});` : `q.enqueue(${v});`);
      inhalt.push(v);
    } else if (op === 1) {
      zeilen.push(stapel ? 's.pop();' : 'q.dequeue();');
      if (stapel) inhalt.pop();
      else inhalt.shift();
    } else {
      // lesender Zugriff + erneutes Einfügen (typische Abi-Mischaufgabe)
      if (stapel) {
        zeilen.push('int x = (Integer) s.pop();', 's.push(x + 1);');
        const x = inhalt.pop();
        inhalt.push(x + 1);
      } else {
        zeilen.push('int y = (Integer) q.dequeue();', 'q.enqueue(y * 2);');
        const y = inhalt.shift();
        inhalt.push(y * 2);
      }
    }
  }
  // Variablennamen eindeutig halten (x/y dürfen mehrfach vorkommen → Deklaration nur einmal)
  let dekl = false;
  const code_ = zeilen.map((l) => {
    if (/^int [xy] =/.test(l)) {
      if (dekl) return l.replace(/^int /, '');
      dekl = true;
    }
    return l;
  });
  const name = stapel ? 'Stapel' : 'Schlange';
  return {
    titel: `${name}: Befehlsfolge ausführen`,
    kategorie: 'protokoll',
    fallen: ['P1', 'P4'],
    inhalt: [
      txt(`Der ${name} \`${var_}\` hat den abgebildeten Startzustand (${stapel ? 'unten → oben, oben = rechts' : 'vorn → hinten'}). Danach wird folgender Code ausgeführt:`),
      { t: 'adt', art, inhalt: start },
      code(code_.join('\n')),
      txt(`Baue den Endzustand ${stapel ? 'des Stapels (unten → oben)' : 'der Schlange (vorn → hinten)'}.`)
    ],
    interaktion: { kind: 'adtsim', art, start },
    loesung: { inhalt: inhalt.map(String) },
    erklaerung: [
      txt(
        stapel
          ? `Ein Stapel arbeitet nach dem **LIFO**-Prinzip: \`push\` legt oben auf, \`pop\` nimmt das oberste Element. Endzustand (unten → oben): **${inhalt.join(', ') || 'leer'}**.`
          : `Eine Schlange arbeitet nach dem **FIFO**-Prinzip: \`enqueue\` stellt hinten an, \`dequeue\` entfernt vorn. Endzustand (vorn → hinten): **${inhalt.join(', ') || 'leer'}**.`
      )
    ]
  };
}

/* ---------- Dynamische Reihung ---------- */

function dynarray(seed) {
  const z = zufall(seed);
  const start = z.verschiedene(z.int(2, 4), 1, 30);
  const d = [...start];
  const zeilen = [];
  const anzahl = z.int(4, 6);
  for (let i = 0; i < anzahl; i++) {
    const ops = ['append', 'insertAt', 'setItem'];
    if (d.length > 1) ops.push('delete', 'delete');
    const op = z.pick(ops);
    const v = z.int(1, 50);
    if (op === 'append') {
      zeilen.push(`d.append(${v});`);
      d.push(v);
    } else if (op === 'insertAt') {
      const k = z.int(0, d.length);
      zeilen.push(`d.insertAt(${k}, ${v});`);
      d.splice(k, 0, v);
    } else if (op === 'setItem') {
      const k = z.int(0, d.length - 1);
      zeilen.push(`d.setItem(${k}, ${v});`);
      d[k] = v;
    } else {
      const k = z.int(0, d.length - 1);
      zeilen.push(`d.delete(${k});`);
      d.splice(k, 1);
    }
  }
  return {
    titel: 'Dynamische Reihung: Befehlsfolge ausführen',
    kategorie: 'protokoll',
    fallen: ['P1', 'P6'],
    inhalt: [
      txt('Die dynamische Reihung `d` hat den abgebildeten Startzustand. Danach wird folgender Code ausgeführt:'),
      { t: 'adt', art: 'dynarray', inhalt: start },
      code(zeilen.join('\n')),
      txt('Baue den Endzustand der dynamischen Reihung (Index 0 zuerst).')
    ],
    interaktion: { kind: 'adtsim', art: 'dynarray', start },
    loesung: { inhalt: d.map(String) },
    erklaerung: [
      txt(
        `\`insertAt(i, x)\` schiebt ab Index i alles nach rechts, \`delete(i)\` schließt die Lücke, \`setItem(i, x)\` überschreibt. Endzustand: **${d.join(', ')}**.`
      )
    ]
  };
}

/* ---------- Bäume ---------- */

function bstAus(werte) {
  let t = null;
  for (const v of werte) t = Baum.bstEinfuegen(t, v);
  return t;
}

function bstEinfuegen(seed) {
  const z = zufall(seed);
  const alle = z.verschiedene(z.int(5, 8), 1, 60);
  const k = z.int(0, Math.min(4, alle.length - 3));
  const startWerte = alle.slice(0, k);
  const neu = alle.slice(k);
  const start = bstAus(startWerte);
  let ziel = start;
  for (const v of neu) ziel = Baum.bstEinfuegen(ziel, v);
  return {
    titel: 'Suchbaum: Werte einfügen',
    kategorie: 'einordnen',
    fallen: [],
    inhalt: [
      txt(
        `${start ? 'In den abgebildeten binären Suchbaum' : 'In einen leeren binären Suchbaum'} werden nacheinander die Werte **${neu.join(', ')}** eingefügt (kleiner → links, größer → rechts). Baue den Suchbaum nach allen Einfügungen.`
      )
    ],
    interaktion: { kind: 'tree', modus: 'bauen', start: Baum.stringify(start), werte: neu.map(String) },
    loesung: { baum: Baum.stringify(ziel) },
    erklaerung: [
      txt(`Jeder neue Wert wird ab der Wurzel verglichen und wandert nach links (kleiner) oder rechts (größer), bis eine leere Stelle erreicht ist. Ergebnis: \`${Baum.stringify(ziel)}\`.`)
    ]
  };
}

const ORDNUNGEN = {
  pre: { name: 'Preorder', regel: 'Wurzel – links – rechts', f: Baum.preorder },
  in: { name: 'Inorder', regel: 'links – Wurzel – rechts', f: Baum.inorder },
  post: { name: 'Postorder', regel: 'links – rechts – Wurzel', f: Baum.postorder },
  level: { name: 'Levelorder', regel: 'ebenenweise von oben nach unten, je Ebene von links nach rechts', f: Baum.levelorder }
};

function traversierung(seed) {
  const z = zufall(seed);
  const t = bstAus(z.verschiedene(z.int(6, 9), 1, 60));
  const key = z.pick(Object.keys(ORDNUNGEN));
  const o = ORDNUNGEN[key];
  const folge = o.f(t);
  const werte = folge.map((p) => Baum.knotenAn(t, p).v);
  return {
    titel: `Traversierung: ${o.name}`,
    kategorie: 'einordnen',
    fallen: ['P7'],
    inhalt: [txt(`Klicke die Knoten in der Reihenfolge an, in der sie bei einer **${o.name}**-Traversierung (${o.regel}) besucht werden.`)],
    interaktion: { kind: 'tree', modus: 'klick', baum: Baum.stringify(t) },
    loesung: { folge },
    erklaerung: [txt(`${o.name} (${o.regel}): **${werte.join(', ')}**.`)]
  };
}

/* ---------- Sortieren (ein Durchlauf) ---------- */

function sortierDurchlauf(verfahren, seed) {
  const z = zufall(seed);
  for (let versuch = 0; versuch < 50; versuch++) {
    const n = z.int(6, 7);
    const a = z.verschiedene(n, 1, 60);
    const auf = z.bool(0.6);
    const vor = (x, y) => (auf ? x < y : x > y); // x gehört vor y
    const durchlauf = z.int(1, 2);
    const r = [...a];
    let tausche = [];
    const tausch = (i, j) => {
      [r[i], r[j]] = [r[j], r[i]];
    };
    for (let d = 1; d <= durchlauf; d++) {
      const protokoll = [];
      if (verfahren === 'bubble') {
        for (let j = 0; j < n - d; j++) {
          if (vor(r[j + 1], r[j])) {
            tausch(j, j + 1);
            protokoll.push([j, j + 1]);
          }
        }
      } else if (verfahren === 'selection') {
        const i = d - 1;
        let best = i;
        for (let j = i + 1; j < n; j++) if (vor(r[j], r[best])) best = j;
        if (best !== i) {
          tausch(i, best);
          protokoll.push([i, best]);
        }
      } else {
        const i = d; // Insertionsort: Element an Index d wird eingefügt
        for (let j = i; j > 0 && vor(r[j], r[j - 1]); j--) {
          tausch(j - 1, j);
          protokoll.push([j - 1, j]);
        }
      }
      if (d === durchlauf) tausche = protokoll;
    }
    if (!tausche.length && versuch < 49) continue;
    // Startzustand = Zustand vor dem gefragten Durchlauf
    const startZustand = [...r];
    for (let k = tausche.length - 1; k >= 0; k--) {
      const [i, j] = tausche[k];
      [startZustand[i], startZustand[j]] = [startZustand[j], startZustand[i]];
    }
    const namen = { bubble: 'Bubblesort', selection: 'Selectionsort', insertion: 'Insertionsort' };
    const regeln = {
      bubble: `Benachbarte Elemente werden von links nach rechts verglichen und vertauscht, wenn sie falsch herum stehen. Im ${durchlauf}. Durchlauf werden die Positionen 0 bis ${n - 1 - durchlauf} mit ihrem rechten Nachbarn verglichen.`,
      selection: `Im ${durchlauf}. Durchlauf wird ab Index ${durchlauf - 1} das ${auf ? 'kleinste' : 'größte'} Element gesucht und – falls es nicht schon dort steht – mit dem Element an Index ${durchlauf - 1} vertauscht.`,
      insertion: `Im ${durchlauf}. Durchlauf wird das Element an Index ${durchlauf} durch Vertauschen mit dem linken Nachbarn so weit nach links bewegt, bis es richtig steht (der Bereich davor ist schon sortiert).`
    };
    return {
      titel: `${namen[verfahren]}: ${durchlauf}. Durchlauf`,
      kategorie: 'transposition',
      fallen: ['P6'],
      inhalt: [
        txt(
          `Die Reihung soll mit **${namen[verfahren]}** ${auf ? '**aufsteigend**' : '**absteigend**'} sortiert werden. ${durchlauf > 1 ? `Der ${durchlauf - 1}. Durchlauf ist bereits erfolgt – die Abbildung zeigt den Zustand danach. ` : ''}Führe den **${durchlauf}. Durchlauf** aus: Tippe jeweils zwei Felder an, um sie zu vertauschen. Wenn keine weiteren Tausche nötig sind, tippe auf „Fertig“.`
        )
      ],
      interaktion: { kind: 'array', modus: 'tausch', start: startZustand, fertigKnopf: true },
      loesung: { tausche },
      erklaerung: [
        txt(
          `${regeln[verfahren]} Tausche: ${tausche.length ? tausche.map(([i, j]) => `(${i} ↔ ${j})`).join(', ') : 'keine'}. Ergebnis: **${r.join(', ')}**.`
        )
      ]
    };
  }
  throw new Error('Generator fehlgeschlagen');
}

/* ---------- Binäre Suche ---------- */

function binaereSuche(seed) {
  const z = zufall(seed);
  const n = z.int(8, 15);
  const a = z.verschiedene(n, 1, 99).sort((x, y) => x - y);
  const vorhanden = z.bool(0.7);
  let x;
  if (vorhanden) x = z.pick(a);
  else {
    do x = z.int(1, 99);
    while (a.includes(x));
  }
  const folge = [];
  const schritte = [];
  let lo = 0;
  let hi = n - 1;
  while (lo <= hi) {
    const mitte = Math.floor((lo + hi) / 2);
    folge.push(mitte);
    schritte.push(`lo = ${lo}, hi = ${hi}, mitte = ${mitte} (Wert ${a[mitte]})`);
    if (a[mitte] === x) break;
    if (a[mitte] < x) lo = mitte + 1;
    else hi = mitte - 1;
  }
  return {
    titel: 'Binäre Suche: mitte bestimmen',
    kategorie: 'transposition',
    fallen: ['P6', 'P4'],
    inhalt: [
      txt(
        `In der aufsteigend sortierten Reihung wird mit der binären Suche nach **${x}** gesucht (\`mitte = (lo + hi) / 2\`, ganzzahlige Division). Tippe nacheinander die Felder an, die als \`mitte\` untersucht werden – bis der Wert gefunden ist oder \`lo > hi\` gilt.`
      )
    ],
    interaktion: { kind: 'array', modus: 'klick', start: a },
    loesung: { folge },
    erklaerung: [txt(`${schritte.join(' → ')}. ${vorhanden ? `Gefunden an Index ${folge[folge.length - 1]}.` : 'Danach gilt lo > hi: nicht gefunden.'}`)]
  };
}

/* ---------- Ausdruck → Typ und Wert ---------- */

const TYPEN = ['int', 'double', 'boolean', 'char', 'String'];

function fmtDouble(v) {
  return Number.isInteger(v) ? v.toFixed(1) : String(v);
}

function ausdruck(seed) {
  const z = zufall(seed);
  const a = z.int(7, 29);
  const b = z.int(2, 6);
  const c = z.int(2, 9);
  const ch = z.pick(['a', 'b', 'c', 'x', 'A', 'B', 'K']);
  const vorlagen = [
    () => ({ e: `${a} / ${b}`, typ: 'int', wert: Math.trunc(a / b), falle: 'P4', why: 'Ganzzahl / Ganzzahl ergibt eine ganzzahlige Division (Nachkommastellen werden abgeschnitten).' }),
    () => ({ e: `${a} % ${b}`, typ: 'int', wert: a % b, why: '% liefert den Rest der ganzzahligen Division.' }),
    () => ({ e: `${a} / ${b}.0`, typ: 'double', wert: a / b, why: 'Ist ein Operand eine Kommazahl, wird mit Kommazahlen gerechnet.' }),
    () => ({ e: `(double) ${a} / ${b}`, typ: 'double', wert: a / b, why: 'Der Cast bindet stärker als /: zuerst wird a in double umgewandelt, dann geteilt.' }),
    () => ({ e: `(double) (${a} / ${b})`, typ: 'double', wert: Math.trunc(a / b), falle: 'P4', why: 'Die Klammer wird zuerst ganzzahlig berechnet, erst danach umgewandelt.' }),
    () => ({ e: `(int) ${a}.${c}`, typ: 'int', wert: a, why: 'Der Cast nach int schneidet die Nachkommastellen ab (kein Runden).' }),
    () => ({ e: `${a} - ${b} * ${c}`, typ: 'int', wert: a - b * c, why: 'Punkt- vor Strichrechnung.' }),
    () => ({ e: `${b} + ${a} % ${c}`, typ: 'int', wert: b + (a % c), why: '% gehört zur Punktrechnung und wird zuerst ausgewertet.' }),
    () => ({ e: `"Gold" + ${b} + ${c}`, typ: 'String', wert: `Gold${b}${c}`, falle: 'P4', why: 'Von links nach rechts: "Gold" + b ergibt eine Zeichenkette, an die c angehängt wird.' }),
    () => ({ e: `${b} + ${c} + "Gold"`, typ: 'String', wert: `${b + c}Gold`, falle: 'P4', why: 'Von links nach rechts: zuerst wird b + c als Zahl addiert, dann verkettet.' }),
    () => ({ e: `${a} > ${b * c} && ${b} != ${c}`, typ: 'boolean', wert: a > b * c && b !== c, why: '&& ist nur wahr, wenn beide Teilbedingungen wahr sind.' }),
    () => ({ e: `!(${a} % 2 == 0) || ${b} > ${c}`, typ: 'boolean', wert: !(a % 2 === 0) || b > c, why: '|| ist wahr, wenn mindestens eine Teilbedingung wahr ist.' }),
    () => ({ e: `'${ch}' + ${b}`, typ: 'int', wert: ch.charCodeAt(0) + b, falle: 'P4', why: `Zeichen + Ganzzahl ergibt eine Ganzzahl (ASCII-Wert von '${ch}' ist ${ch.charCodeAt(0)}).` }),
    () => ({ e: `(char) ('${ch}' + ${b})`, typ: 'char', wert: String.fromCharCode(ch.charCodeAt(0) + b), falle: 'P4', why: 'Der Cast nach char macht aus dem ASCII-Wert wieder ein Zeichen.' })
  ];
  const v = z.pick(vorlagen)();
  let akzeptiert;
  let feldTyp = 'text';
  if (v.typ === 'int') {
    akzeptiert = [String(v.wert)];
    feldTyp = 'zahl';
  } else if (v.typ === 'double') {
    const r = Math.round(v.wert * 1e6) / 1e6;
    akzeptiert = [fmtDouble(r)];
    feldTyp = 'zahl';
  } else if (v.typ === 'boolean') akzeptiert = [String(v.wert)];
  else if (v.typ === 'char') akzeptiert = [`'${v.wert}'`, v.wert];
  else akzeptiert = [`"${v.wert}"`, v.wert];
  const wertFeld = v.typ === 'boolean' ? { typ: 'auswahl', optionen: ['true', 'false'] } : feldTyp === 'zahl' ? { typ: 'zahl', breite: 10 } : { typ: 'text', norm: 'exakt', breite: 12 };
  const anzeige = v.typ === 'double' ? fmtDouble(Math.round(v.wert * 1e6) / 1e6) : v.typ === 'char' ? `'${v.wert}'` : v.typ === 'String' ? `"${v.wert}"` : String(v.wert);
  return {
    titel: 'Ausdruck: Typ und Wert',
    kategorie: 'modulo',
    fallen: v.falle ? [v.falle] : [],
    inhalt: [txt('Bestimme Typ und Wert des Java-Ausdrucks:'), { t: 'code', code: v.e, nummern: false }, txt('Typ: [[typ]]   Wert: [[wert]]')],
    interaktion: { kind: 'gaps', felder: { typ: { typ: 'auswahl', optionen: TYPEN }, wert: wertFeld } },
    loesung: { typ: [v.typ], wert: akzeptiert },
    erklaerung: [txt(`Typ **${v.typ}**, Wert **${anzeige}**. ${v.why}`)]
  };
}

/* ---------- Register ---------- */

const GENERATOREN = {
  stapel: { titel: 'Stapel-Befehlsfolgen', welten: [4, 6], make: (s) => stapelSchlange('stapel', s) },
  schlange: { titel: 'Schlangen-Befehlsfolgen', welten: [4, 6], make: (s) => stapelSchlange('schlange', s) },
  dynarray: { titel: 'Dynamische Reihung', welten: [4, 6], make: dynarray },
  bst: { titel: 'Suchbaum: Einfügen', welten: [5, 6], make: bstEinfuegen },
  traversierung: { titel: 'Traversierungen', welten: [5, 6], make: traversierung },
  bubble: { titel: 'Bubblesort: ein Durchlauf', welten: [2, 6], make: (s) => sortierDurchlauf('bubble', s) },
  selection: { titel: 'Selectionsort: ein Durchlauf', welten: [2, 6], make: (s) => sortierDurchlauf('selection', s) },
  insertion: { titel: 'Insertionsort: ein Durchlauf', welten: [2, 6], make: (s) => sortierDurchlauf('insertion', s) },
  binsuche: { titel: 'Binäre Suche', welten: [2, 6], make: binaereSuche },
  ausdruck: { titel: 'Ausdruck → Typ und Wert', welten: [0, 6], make: ausdruck }
};

function generatorenFuerWelt(welt) {
  return Object.entries(GENERATOREN)
    .filter(([, g]) => g.welten.includes(welt))
    .map(([key, g]) => ({ key, titel: g.titel }));
}

/** Aufgabe erzeugen (deterministisch). Punkte: immer 1 (Trainingsplatz). */
function erzeuge(key, seed) {
  const g = GENERATOREN[key];
  if (!g) throw new Error(`Unbekannter Generator „${key}“.`);
  const a = g.make(seed >>> 0);
  return { id: `T-${key}-${seed >>> 0}`, stufe: 1, punkte: 1, tipps: [], ...a };
}

module.exports = { GENERATOREN, generatorenFuerWelt, erzeuge, mulberry32, zufall };
