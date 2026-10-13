'use strict';
/*
 * Attrappen-DOM für Client-Tests (M4 Task 46) – ohne neue Abhängigkeit, nur node:vm/fs/path.
 *
 *   const D = require('./dom_attrappe');
 *   const k = D.lade(['common.js', 'krypto/oberflaeche.js'], { url, fetch, vorher(k) {} });
 *   k.wert('AQ') · k.document · k.window · k.eins(el, sel) · k.alle(el, sel) · k.text(el)
 *   k.klick(el) · k.tippe(el, 'abc') · k.taste(el, 'Enter') · k.anfragen · k.navigiert · k.neugeladen · k.gedruckt
 *   k.medien · k.zwischenablage (Liste der geschriebenen Texte) · k.timer · k.roh(x) · await k.ruhe()
 *   k.skripte · k.skriptEreignis(src, 'load'|'error') · k.zeiger(el, 'pointerdown', { clientX, clientY })
 *   D.lade(…, { zeitraffer: 100 }) – Timer laufen 100-mal schneller (k.timer zeigt die angeforderte Zeit)
 *   D.fuehreAus(k, ['weiteres.js'])
 *
 * Skripte liegen relativ zu public/static/js. Das Seiten-Grundgerüst (header#kopf, main#haupt, footer#fuss) wird immer
 * angelegt; nach dem letzten Skript feuert die Attrappe DOMContentLoaded und load.
 * Selektoren: Typ, .klasse, #id, [attr], [attr="wert"] (auch ^= $= *=), zusammengesetzt, Nachfahre (Leerzeichen), Kind (>), Komma.
 * Timer sind echt, aber unref: ein Promise, das nur auf Attrappen-Timer wartet, erst nach `await k.ruhe()` abwarten.
 * Fehler-Konstruktoren (Error, TypeError, RangeError, SyntaxError) stammen aus dem Test-Realm, damit
 * assert.throws(…, TypeError) funktioniert; Arrays/Objekte aus dem Skript-Kontext vor deepEqual mit k.roh holen.
 */
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

const JS = path.join(__dirname, '..', 'public', 'static', 'js');
const SVG_NS = 'http://www.w3.org/2000/svg';
const HTML_NS = 'http://www.w3.org/1999/xhtml';

/* ---------- Ereignisse ---------- */
class Event {
  constructor(type, init = {}) {
    this.type = type;
    this.bubbles = !!init.bubbles;
    this.cancelable = !!init.cancelable;
    this.defaultPrevented = false;
    this.target = null;
    this.currentTarget = null;
    this._stop = false;
    this._sofortStop = false;
  }
  preventDefault() {
    if (this.cancelable) this.defaultPrevented = true;
  }
  stopPropagation() {
    this._stop = true;
  }
  stopImmediatePropagation() {
    this._stop = true;
    this._sofortStop = true;
  }
}
class KeyboardEvent extends Event {
  constructor(type, init = {}) {
    super(type, init);
    this.key = init.key || '';
    this.code = init.code || '';
    for (const m of ['shiftKey', 'ctrlKey', 'altKey', 'metaKey']) this[m] = !!init[m];
  }
}

class Ziel {
  constructor() {
    this._hoerer = new Map();
  }
  addEventListener(typ, fn, opt) {
    if (typeof fn !== 'function' && !(fn && typeof fn.handleEvent === 'function')) return;
    if (!this._hoerer.has(typ)) this._hoerer.set(typ, []);
    const liste = this._hoerer.get(typ);
    if (!liste.some((h) => h.fn === fn)) liste.push({ fn, einmal: !!(opt && typeof opt === 'object' && opt.once) });
  }
  removeEventListener(typ, fn) {
    const liste = this._hoerer.get(typ);
    if (liste) this._hoerer.set(typ, liste.filter((h) => h.fn !== fn));
  }
  _rufe(ev) {
    const liste = [...(this._hoerer.get(ev.type) || [])];
    ev.currentTarget = this;
    for (const h of liste) {
      if (h.einmal) this.removeEventListener(ev.type, h.fn);
      if (typeof h.fn === 'function') h.fn.call(this, ev);
      else h.fn.handleEvent(ev);
      if (ev._sofortStop) break;
    }
  }
  _elternZiel() {
    return null;
  }
  dispatchEvent(ev) {
    ev.target = this;
    let z = this;
    while (z) {
      z._rufe(ev);
      if (ev._stop || !ev.bubbles) break;
      z = z._elternZiel();
    }
    ev.currentTarget = null;
    return !ev.defaultPrevented;
  }
}

/* ---------- Selektoren ---------- */
function parseSelektor(sel) {
  const gruppen = [];
  for (const teil of String(sel).split(',')) {
    const t = teil.trim();
    if (!t) throw new Error('Selektor nicht unterstützt: ' + sel);
    const schritte = []; // { comb: ' ' | '>', comp }
    let rest = t;
    let comb = null;
    while (rest.length) {
      const ws = /^\s*(>)?\s*/.exec(rest);
      if (schritte.length && ws[0].length) comb = ws[1] ? '>' : ' ';
      rest = rest.slice(ws[0].length);
      if (!rest.length) break;
      const m = /^([a-zA-Z][a-zA-Z0-9-]*|\*)?((?:[.#][a-zA-Z0-9_-]+|\[[a-zA-Z_:][a-zA-Z0-9_:.-]*(?:[\^$*]?=(?:"[^"]*"|'[^']*'|[^\]\s"']+))?\])*)/.exec(rest);
      if (!m || !m[0].length) throw new Error('Selektor nicht unterstützt: ' + sel);
      const comp = { tag: m[1] && m[1] !== '*' ? m[1].toLowerCase() : null, ids: [], klassen: [], attrs: [] };
      const re = /([.#])([a-zA-Z0-9_-]+)|\[([a-zA-Z_:][a-zA-Z0-9_:.-]*)(?:([\^$*]?)=(?:"([^"]*)"|'([^']*)'|([^\]\s"']+)))?\]/g;
      let x;
      while ((x = re.exec(m[2]))) {
        if (x[1] === '#') comp.ids.push(x[2]);
        else if (x[1] === '.') comp.klassen.push(x[2]);
        else comp.attrs.push({ name: x[3], op: x[4] || '', wert: x[5] ?? x[6] ?? x[7] ?? null });
      }
      schritte.push({ comb: schritte.length ? comb || ' ' : null, comp });
      comb = null;
      rest = rest.slice(m[0].length);
      if (rest.length && !/^\s|^>/.test(rest)) throw new Error('Selektor nicht unterstützt: ' + sel);
    }
    gruppen.push(schritte);
  }
  return gruppen;
}
function passtComp(el, c) {
  if (el.nodeType !== 1) return false;
  if (c.tag && el.localName.toLowerCase() !== c.tag) return false;
  for (const id of c.ids) if (el.getAttribute('id') !== id) return false;
  for (const k of c.klassen) if (!el.classList.contains(k)) return false;
  for (const a of c.attrs) {
    if (!el.hasAttribute(a.name)) return false;
    if (a.wert !== null) {
      const v = el.getAttribute(a.name);
      if (a.op === '^' ? !v.startsWith(a.wert) : a.op === '$' ? !v.endsWith(a.wert) : a.op === '*' ? !v.includes(a.wert) : v !== a.wert) return false;
    }
  }
  return true;
}
function passtSchritte(el, schritte, i, wurzel) {
  if (!passtComp(el, schritte[i].comp)) return false;
  if (i === 0) return true;
  const comb = schritte[i].comb;
  let p = el.parentNode;
  if (comb === '>') return !!p && p !== wurzel && p.nodeType === 1 && passtSchritte(p, schritte, i - 1, wurzel);
  while (p && p.nodeType === 1) {
    if (passtSchritte(p, schritte, i - 1, wurzel)) return true;
    p = p.parentNode;
  }
  return false;
}
function passt(el, gruppen) {
  return gruppen.some((g) => passtSchritte(el, g, g.length - 1, null));
}
function nachfahren(knoten, aus = []) {
  for (const c of knoten.childNodes) {
    if (c.nodeType === 1) {
      aus.push(c);
      nachfahren(c, aus);
    }
  }
  return aus;
}

/* ---------- DOM ---------- */
function erzeugeDom({ url = 'http://x.test/' } = {}) {
  const dom = {};

  class Node extends Ziel {
    constructor(doc) {
      super();
      this.ownerDocument = doc;
      this.parentNode = null;
      this.childNodes = [];
    }
    get parentElement() {
      return this.parentNode && this.parentNode.nodeType === 1 ? this.parentNode : null;
    }
    get firstChild() {
      return this.childNodes[0] || null;
    }
    get lastChild() {
      return this.childNodes[this.childNodes.length - 1] || null;
    }
    get children() {
      return this.childNodes.filter((c) => c.nodeType === 1);
    }
    get firstElementChild() {
      return this.children[0] || null;
    }
    get lastElementChild() {
      const c = this.children;
      return c[c.length - 1] || null;
    }
    get childElementCount() {
      return this.children.length;
    }
    _geschwister(d, nurElemente) {
      if (!this.parentNode) return null;
      const l = this.parentNode.childNodes;
      for (let i = l.indexOf(this) + d; i >= 0 && i < l.length; i += d) if (!nurElemente || l[i].nodeType === 1) return l[i];
      return null;
    }
    get nextSibling() {
      return this._geschwister(1, false);
    }
    get previousSibling() {
      return this._geschwister(-1, false);
    }
    get nextElementSibling() {
      return this._geschwister(1, true);
    }
    get previousElementSibling() {
      return this._geschwister(-1, true);
    }
    get isConnected() {
      let n = this;
      while (n.parentNode) n = n.parentNode;
      return n.nodeType === 9;
    }
    _elternZiel() {
      if (this.parentNode) return this.parentNode;
      return null;
    }
    _pruefeKind(kind) {
      if (!(kind instanceof Node)) throw new TypeError('Kein Knoten: ' + String(kind));
      for (let n = this; n; n = n.parentNode) if (n === kind) throw new Error('Knoten kann nicht in sich selbst eingefügt werden.');
    }
    insertBefore(kind, ref) {
      this._pruefeKind(kind);
      if (kind.nodeType === 11) {
        for (const c of [...kind.childNodes]) this.insertBefore(c, ref);
        return kind;
      }
      if (kind.parentNode) kind.parentNode.removeChild(kind);
      const i = ref ? this.childNodes.indexOf(ref) : -1;
      if (ref && i < 0) throw new Error('Referenzknoten ist kein Kind.');
      if (i < 0) this.childNodes.push(kind);
      else this.childNodes.splice(i, 0, kind);
      kind.parentNode = this;
      // angehängte <script src> protokollieren (k.skripte, M6 E72) – geladen wird nichts
      if (kind.nodeType === 1 && kind.localName === 'script' && kind.hasAttribute('src') && kind.isConnected && dom.beiSkript) dom.beiSkript(kind);
      return kind;
    }
    appendChild(kind) {
      return this.insertBefore(kind, null);
    }
    removeChild(kind) {
      const i = this.childNodes.indexOf(kind);
      if (i < 0) throw new Error('Knoten ist kein Kind.');
      this.childNodes.splice(i, 1);
      kind.parentNode = null;
      const doc = this.ownerDocument || this;
      if (doc._aktiv && (doc._aktiv === kind || kind.contains(doc._aktiv))) doc._aktiv = null;
      return kind;
    }
    replaceChild(neu, alt) {
      this.insertBefore(neu, alt);
      this.removeChild(alt);
      return alt;
    }
    _alsKnoten(x) {
      return x instanceof Node ? x : (this.ownerDocument || this).createTextNode(String(x));
    }
    append(...xs) {
      for (const x of xs) this.appendChild(this._alsKnoten(x));
    }
    prepend(...xs) {
      const erst = this.firstChild;
      for (const x of xs) this.insertBefore(this._alsKnoten(x), erst);
    }
    before(...xs) {
      if (this.parentNode) for (const x of xs) this.parentNode.insertBefore(this._alsKnoten(x), this);
    }
    after(...xs) {
      if (!this.parentNode) return;
      const p = this.parentNode;
      let ref = this.nextSibling;
      for (const x of xs) p.insertBefore(this._alsKnoten(x), ref);
    }
    replaceWith(...xs) {
      if (!this.parentNode) return;
      const p = this.parentNode;
      const ref = this.nextSibling;
      p.removeChild(this);
      for (const x of xs) p.insertBefore(this._alsKnoten(x), ref);
    }
    replaceChildren(...xs) {
      for (const c of [...this.childNodes]) this.removeChild(c);
      this.append(...xs);
    }
    remove() {
      if (this.parentNode) this.parentNode.removeChild(this);
    }
    contains(n) {
      for (; n; n = n.parentNode) if (n === this) return true;
      return false;
    }
    hasChildNodes() {
      return this.childNodes.length > 0;
    }
    get textContent() {
      return this.childNodes.map((c) => (c.nodeType === 8 ? '' : c.textContent)).join('');
    }
    set textContent(t) {
      for (const c of [...this.childNodes]) this.removeChild(c);
      if (t !== null && t !== undefined && String(t) !== '') this.appendChild((this.ownerDocument || this).createTextNode(String(t)));
    }
    querySelectorAll(sel) {
      const g = parseSelektor(sel);
      return nachfahren(this).filter((el) => passt(el, g));
    }
    querySelector(sel) {
      return this.querySelectorAll(sel)[0] || null;
    }
    cloneNode(tief) {
      const k = this._klon();
      if (tief) for (const c of this.childNodes) k.appendChild(c.cloneNode(true));
      return k;
    }
  }

  class Text extends Node {
    constructor(doc, data) {
      super(doc);
      this.data = String(data);
    }
    get nodeType() {
      return 3;
    }
    get nodeName() {
      return '#text';
    }
    get textContent() {
      return this.data;
    }
    set textContent(t) {
      this.data = String(t);
    }
    get nodeValue() {
      return this.data;
    }
    set nodeValue(t) {
      this.data = String(t);
    }
    _klon() {
      return new Text(this.ownerDocument, this.data);
    }
  }

  class DocumentFragment extends Node {
    get nodeType() {
      return 11;
    }
    get nodeName() {
      return '#document-fragment';
    }
    _klon() {
      return new DocumentFragment(this.ownerDocument);
    }
  }

  function klassenListe(el) {
    const lies = () => (el.getAttribute('class') || '').split(/\s+/).filter(Boolean);
    const schreib = (l) => el.setAttribute('class', l.join(' '));
    return {
      add: (...c) => schreib([...new Set([...lies(), ...c])]),
      remove: (...c) => schreib(lies().filter((x) => !c.includes(x))),
      toggle(c, an) {
        const hat = lies().includes(c);
        const soll = an === undefined ? !hat : !!an;
        if (soll && !hat) this.add(c);
        if (!soll && hat) this.remove(c);
        return soll;
      },
      contains: (c) => lies().includes(c),
      replace(a, b) {
        if (!lies().includes(a)) return false;
        schreib(lies().map((x) => (x === a ? b : x)));
        return true;
      },
      get length() {
        return lies().length;
      },
      item: (i) => lies()[i] ?? null,
      toString: () => lies().join(' '),
      [Symbol.iterator]: () => lies()[Symbol.iterator]()
    };
  }
  const kebab = (s) => s.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
  const kamel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  function datensatz(el) {
    return new Proxy(
      {},
      {
        get: (_, k) => (typeof k === 'string' && el.hasAttribute('data-' + kebab(k)) ? el.getAttribute('data-' + kebab(k)) : undefined),
        set: (_, k, v) => {
          el.setAttribute('data-' + kebab(String(k)), String(v));
          return true;
        },
        deleteProperty: (_, k) => {
          el.removeAttribute('data-' + kebab(String(k)));
          return true;
        },
        has: (_, k) => el.hasAttribute('data-' + kebab(String(k))),
        ownKeys: () => [...el._attrs.keys()].filter((n) => n.startsWith('data-')).map((n) => kamel(n.slice(5))),
        getOwnPropertyDescriptor: (_, k) => (el.hasAttribute('data-' + kebab(String(k))) ? { value: el.getAttribute('data-' + kebab(String(k))), enumerable: true, configurable: true, writable: true } : undefined)
      }
    );
  }
  function stil() {
    const werte = new Map();
    const s = {
      setProperty: (n, v) => {
        if (v === null || v === undefined || v === '') werte.delete(n);
        else werte.set(n, String(v));
      },
      getPropertyValue: (n) => (werte.has(n) ? werte.get(n) : s[kamel(n)] !== undefined && typeof s[kamel(n)] !== 'function' ? String(s[kamel(n)]) : ''),
      removeProperty: (n) => {
        const alt = werte.get(n) || '';
        werte.delete(n);
        if (typeof s[kamel(n)] === 'string') delete s[kamel(n)];
        return alt;
      }
    };
    Object.defineProperty(s, 'cssText', { get: () => [...werte].map(([k, v]) => `${k}: ${v};`).join(' '), set: () => { throw new Error('style.cssText ist verboten (CSP-Regel).'); }, enumerable: false });
    return s;
  }
  const verboten = (name) => ({
    get: () => {
      throw new Error(`${name} ist in der Attrappe verboten (XSS-Regel).`);
    },
    set: () => {
      throw new Error(`${name} ist in der Attrappe verboten (XSS-Regel).`);
    }
  });

  class Element extends Node {
    constructor(doc, tag, ns) {
      super(doc);
      this.namespaceURI = ns || HTML_NS;
      this.localName = ns === SVG_NS ? tag : tag.toLowerCase();
      this._attrs = new Map();
      this.classList = klassenListe(this);
      this.dataset = datensatz(this);
      this.style = stil();
      this._wert = undefined;
      this._checked = undefined;
      this._selected = undefined;
    }
    get nodeType() {
      return 1;
    }
    get tagName() {
      return this.namespaceURI === HTML_NS ? this.localName.toUpperCase() : this.localName;
    }
    get nodeName() {
      return this.tagName;
    }
    get attributes() {
      return [...this._attrs].map(([name, value]) => ({ name, value }));
    }
    setAttribute(n, v) {
      this._attrs.set(String(n), String(v));
    }
    getAttribute(n) {
      return this._attrs.has(n) ? this._attrs.get(n) : null;
    }
    hasAttribute(n) {
      return this._attrs.has(n);
    }
    removeAttribute(n) {
      this._attrs.delete(n);
    }
    toggleAttribute(n, an) {
      const soll = an === undefined ? !this.hasAttribute(n) : !!an;
      if (soll) this.setAttribute(n, this.getAttribute(n) ?? '');
      else this.removeAttribute(n);
      return soll;
    }
    getAttributeNames() {
      return [...this._attrs.keys()];
    }
    get id() {
      return this.getAttribute('id') || '';
    }
    set id(v) {
      this.setAttribute('id', v);
    }
    get className() {
      return this.getAttribute('class') || '';
    }
    set className(v) {
      this.setAttribute('class', v);
    }
    _bool(n, v) {
      if (v) this.setAttribute(n, '');
      else this.removeAttribute(n);
    }
    get disabled() {
      return this.hasAttribute('disabled');
    }
    set disabled(v) {
      this._bool('disabled', v);
    }
    get hidden() {
      return this.hasAttribute('hidden');
    }
    set hidden(v) {
      this._bool('hidden', v);
    }
    get open() {
      return this.hasAttribute('open');
    }
    set open(v) {
      this._bool('open', v);
    }
    get required() {
      return this.hasAttribute('required');
    }
    set required(v) {
      this._bool('required', v);
    }
    get href() {
      return this.getAttribute('href') || '';
    }
    set href(v) {
      this.setAttribute('href', v);
    }
    get type() {
      const t = this.getAttribute('type');
      if (this.localName === 'button') return t || 'submit';
      if (this.localName === 'input') return t || 'text';
      return t || '';
    }
    set type(v) {
      this.setAttribute('type', v);
    }
    get name() {
      return this.getAttribute('name') || '';
    }
    set name(v) {
      this.setAttribute('name', v);
    }
    get tabIndex() {
      const t = this.getAttribute('tabindex');
      return t === null ? (['a', 'button', 'input', 'select', 'textarea'].includes(this.localName) ? 0 : -1) : Number(t);
    }
    set tabIndex(v) {
      this.setAttribute('tabindex', String(v));
    }
    get title() {
      return this.getAttribute('title') || '';
    }
    set title(v) {
      this.setAttribute('title', v);
    }
    get maxLength() {
      const m = this.getAttribute('maxlength');
      return m === null ? -1 : Number(m);
    }
    set maxLength(v) {
      this.setAttribute('maxlength', String(v));
    }
    get src() {
      return this.getAttribute('src') || '';
    }
    set src(v) {
      this.setAttribute('src', v);
    }
    setPointerCapture(id) {
      this._zeiger = id;
    }
    releasePointerCapture() {
      this._zeiger = undefined;
    }
    hasPointerCapture(id) {
      return this._zeiger === id;
    }
    get placeholder() {
      return this.getAttribute('placeholder') || '';
    }
    set placeholder(v) {
      this.setAttribute('placeholder', v);
    }
    get value() {
      if (this.localName === 'select') {
        if (this._wert !== undefined) return this._wert;
        const opts = this.querySelectorAll('option');
        const gew = opts.find((o) => o.selected) || opts[0];
        return gew ? gew.value : '';
      }
      if (this.localName === 'option') return this.hasAttribute('value') ? this.getAttribute('value') : this.textContent;
      if (this.localName === 'output') return this.textContent;
      if (this._wert !== undefined) return this._wert;
      if (this.localName === 'textarea') return this.textContent;
      return this.getAttribute('value') ?? (this.type === 'checkbox' || this.type === 'radio' ? 'on' : '');
    }
    set value(v) {
      const s = v === null || v === undefined ? '' : String(v);
      if (this.localName === 'option') this.setAttribute('value', s);
      else if (this.localName === 'output') this.textContent = s;
      else if (this.localName === 'select') {
        this._wert = s;
        for (const o of this.querySelectorAll('option')) o._selected = o.value === s;
      } else this._wert = s;
    }
    get selectedIndex() {
      return this.querySelectorAll('option').findIndex((o) => o.value === this.value);
    }
    get options() {
      return this.querySelectorAll('option');
    }
    get checked() {
      return this._checked === undefined ? this.hasAttribute('checked') : this._checked;
    }
    set checked(v) {
      this._checked = !!v;
    }
    get selected() {
      return this._selected === undefined ? this.hasAttribute('selected') : this._selected;
    }
    set selected(v) {
      this._selected = !!v;
    }
    get form() {
      return this.closest('form');
    }
    matches(sel) {
      return passt(this, parseSelektor(sel));
    }
    closest(sel) {
      const g = parseSelektor(sel);
      for (let n = this; n && n.nodeType === 1; n = n.parentNode) if (passt(n, g)) return n;
      return null;
    }
    focus() {
      const doc = this.ownerDocument;
      if (doc._aktiv === this) return;
      const alt = doc._aktiv;
      doc._aktiv = this;
      if (alt) alt.dispatchEvent(new Event('blur'));
      this.dispatchEvent(new Event('focus'));
      this.dispatchEvent(new Event('focusin', { bubbles: true }));
    }
    blur() {
      const doc = this.ownerDocument;
      if (doc._aktiv !== this) return;
      doc._aktiv = null;
      this.dispatchEvent(new Event('blur'));
      this.dispatchEvent(new Event('focusout', { bubbles: true }));
    }
    select() {}
    setSelectionRange() {}
    click() {
      if (this.disabled && ['button', 'input', 'select', 'textarea'].includes(this.localName)) return;
      const typ = this.localName === 'input' ? this.type : null;
      let altChecked = null;
      if (typ === 'checkbox') {
        altChecked = this.checked;
        this.checked = !this.checked;
      } else if (typ === 'radio') {
        altChecked = this.checked;
        if (this.name) {
          let wurzel = this.form || this;
          while (wurzel.parentNode && !this.form) wurzel = wurzel.parentNode;
          for (const r of wurzel.querySelectorAll('input[type="radio"]')) if (r.name === this.name) r.checked = false;
        }
        this.checked = true;
      }
      const ev = new Event('click', { bubbles: true, cancelable: true });
      this.dispatchEvent(ev);
      if (typ === 'checkbox' || typ === 'radio') {
        if (ev.defaultPrevented) this.checked = altChecked;
        else if (altChecked !== this.checked) {
          this.dispatchEvent(new Event('input', { bubbles: true }));
          this.dispatchEvent(new Event('change', { bubbles: true }));
        }
        return;
      }
      if (ev.defaultPrevented) return;
      if (this.localName === 'button' && this.type === 'submit' && this.form) this.form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      if (this.localName === 'summary' && this.parentNode && this.parentNode.localName === 'details') {
        this.parentNode.open = !this.parentNode.open;
        this.parentNode.dispatchEvent(new Event('toggle'));
      }
    }
    requestSubmit() {
      this.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    }
    showModal() {
      this.open = true;
    }
    show() {
      this.open = true;
    }
    close(wert) {
      if (wert !== undefined) this.returnValue = String(wert);
      const war = this.open;
      this.open = false;
      if (war) this.dispatchEvent(new Event('close'));
    }
    getBoundingClientRect() {
      return { x: 0, y: 0, top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 };
    }
    getClientRects() {
      return [];
    }
    scrollIntoView() {}
    scrollTo() {}
    get offsetWidth() {
      return 0;
    }
    get offsetHeight() {
      return 0;
    }
    get clientWidth() {
      return 0;
    }
    get scrollWidth() {
      return 0;
    }
    _klon() {
      const k = new Element(this.ownerDocument, this.localName, this.namespaceURI);
      for (const [n, v] of this._attrs) k._attrs.set(n, v);
      return k;
    }
  }
  for (const n of ['innerHTML', 'outerHTML']) Object.defineProperty(Element.prototype, n, verboten(n));
  Element.prototype.insertAdjacentHTML = function () {
    throw new Error('insertAdjacentHTML ist in der Attrappe verboten (XSS-Regel).');
  };

  class Document extends Node {
    constructor() {
      super(null);
      this._aktiv = null;
      this.readyState = 'loading';
      this.cookie = '';
      this.documentElement = this.createElement('html');
      this.appendChild(this.documentElement);
      this.head = this.createElement('head');
      this.body = this.createElement('body');
      this.documentElement.append(this.head, this.body);
    }
    get nodeType() {
      return 9;
    }
    get nodeName() {
      return '#document';
    }
    _elternZiel() {
      return dom.window || null;
    }
    createElement(tag) {
      return new Element(this, String(tag), HTML_NS);
    }
    createElementNS(ns, tag) {
      return new Element(this, String(tag), ns);
    }
    createTextNode(t) {
      return new Text(this, t);
    }
    createDocumentFragment() {
      return new DocumentFragment(this);
    }
    createComment() {
      const c = new Text(this, '');
      Object.defineProperty(c, 'nodeType', { value: 8 });
      return c;
    }
    getElementById(id) {
      return nachfahren(this).find((el) => el.getAttribute('id') === id) || null;
    }
    get activeElement() {
      return this._aktiv || this.body;
    }
    get title() {
      const t = this.head.querySelector('title');
      return t ? t.textContent : '';
    }
    set title(v) {
      let t = this.head.querySelector('title');
      if (!t) t = this.head.appendChild(this.createElement('title'));
      t.textContent = v;
    }
    get textContent() {
      return null;
    }
    write() {
      throw new Error('document.write ist in der Attrappe verboten.');
    }
  }

  const document = new Document();
  dom.document = document;
  dom.Node = Node;
  dom.Element = Element;
  dom.Text = Text;
  dom.DocumentFragment = DocumentFragment;
  dom.url = url;
  return dom;
}

/* ---------- Kontext ---------- */
function textVon(knoten) {
  const sammle = (n) => {
    if (n.nodeType === 3) return n.data;
    if (n.nodeType === 8) return '';
    return ' ' + n.childNodes.map(sammle).join('') + ' ';
  };
  return sammle(knoten).replace(/\s+/g, ' ').trim();
}

function lade(dateien = [], opt = {}) {
  const dom = erzeugeDom({ url: opt.url });
  const { document } = dom;
  const k = {
    document,
    anfragen: [],
    navigiert: [],
    neugeladen: 0,
    gedruckt: 0, // Aufrufe von window.print() (Urkunden, M4 Task 64)
    medien: {},
    zwischenablage: [],
    timer: [],
    skripte: [], // src angehängter <script>-Elemente (KRLabor.lade, M6 E72)
    _skriptEl: [],
    _offen: { fetch: 0, timer: new Set() },
    _ctx: null
  };

  // Seiten-Grundgerüst
  for (const [tag, id] of [['header', 'kopf'], ['main', 'haupt'], ['footer', 'fuss']]) {
    const el = document.createElement(tag);
    el.setAttribute('id', id);
    document.body.appendChild(el);
  }

  // window = globales Objekt des Kontexts; Ereignisse über ein eigenes Ziel
  const fensterZiel = new Ziel();
  let ort = new URL(opt.url || 'http://x.test/');
  const location = {
    get href() {
      return ort.href;
    },
    set href(v) {
      navigiere(v, 'href');
    },
    get pathname() {
      return ort.pathname;
    },
    get hash() {
      return ort.hash;
    },
    set hash(v) {
      const h = String(v);
      navigiere(h.startsWith('#') || h === '' ? h || '#' : '#' + h, 'hash');
    },
    get search() {
      return ort.search;
    },
    get origin() {
      return ort.origin;
    },
    get host() {
      return ort.host;
    },
    get hostname() {
      return ort.hostname;
    },
    get protocol() {
      return ort.protocol;
    },
    assign: (v) => navigiere(v, 'assign'),
    replace: (v) => navigiere(v, 'replace'),
    reload: () => {
      k.neugeladen++;
    },
    toString: () => ort.href
  };
  function navigiere(v, _art) {
    const s = String(v);
    k.navigiert.push(s);
    const neu = new URL(s, ort.href);
    const nurHash = neu.origin === ort.origin && neu.pathname === ort.pathname && neu.search === ort.search && neu.hash !== ort.hash;
    ort = neu;
    if (nurHash) setTimeout(() => k.window.dispatchEvent(new Event('hashchange')), 0);
  }
  const history = {
    replaceState: (_s, _t, u) => {
      if (u !== undefined && u !== null) ort = new URL(String(u), ort.href);
    },
    pushState: (_s, _t, u) => {
      if (u !== undefined && u !== null) ort = new URL(String(u), ort.href);
    },
    back() {},
    length: 1
  };

  const speicher = new Map();
  const localStorage = {
    getItem: (n) => (speicher.has(String(n)) ? speicher.get(String(n)) : null),
    setItem: (n, v) => speicher.set(String(n), String(v)),
    removeItem: (n) => speicher.delete(String(n)),
    clear: () => speicher.clear(),
    key: (i) => [...speicher.keys()][i] ?? null,
    get length() {
      return speicher.size;
    }
  };

  // Timer (echt, unref) – kurze Einmal-Timer (≤ 50 ms) zählen für k.ruhe(). opt.zeitraffer = n teilt die echte Wartezeit
  // durch n (Nachspiele im Kryptolabor, M6); k.timer zeigt die angeforderte Zeit.
  const raffer = Number(opt.zeitraffer) > 1 ? Number(opt.zeitraffer) : 1;
  function setTimeout_(fn, ms = 0, ...args) {
    const angefordert = Number(ms) || 0;
    const dauer = Math.ceil(angefordert / raffer);
    k.timer.push({ ms: angefordert, wiederholt: false });
    const h = setTimeout(() => {
      k._offen.timer.delete(h);
      if (typeof fn === 'function') fn(...args);
    }, dauer);
    if (h.unref) h.unref();
    if (dauer <= 50) k._offen.timer.add(h);
    return h;
  }
  function clearTimeout_(h) {
    if (!h) return;
    k._offen.timer.delete(h);
    clearTimeout(h);
  }
  function setInterval_(fn, ms = 0, ...args) {
    k.timer.push({ ms: Number(ms) || 0, wiederholt: true });
    const h = setInterval(() => fn(...args), Math.max(1, Number(ms) || 0));
    if (h.unref) h.unref();
    return h;
  }

  // fetch-Attrappe
  const routen = opt.fetch || {};
  function fetch_(url, init = {}) {
    const methode = String(init.method || 'GET').toUpperCase();
    const u = new URL(String(url), ort.href);
    let body;
    if (init.body !== undefined && init.body !== null) {
      try {
        body = JSON.parse(String(init.body));
      } catch {
        body = String(init.body);
      }
    }
    k.anfragen.push({ methode, pfad: u.pathname, body });
    const eintrag = routen[`${methode} ${u.pathname}`];
    let antwort = eintrag === undefined ? { status: 404, body: { error: 'Unbekannte API-Route.' } } : typeof eintrag === 'function' ? eintrag(body) : eintrag;
    antwort = antwort || { status: 200, body: null };
    const status = antwort.status ?? 200;
    const daten = antwort.body === undefined ? null : JSON.parse(JSON.stringify(antwort.body));
    // { typ, text }: Antwort ohne JSON (z. B. HTML-Fehlerseite eines Proxys, Review M4 K1)
    const typ = antwort.typ || 'application/json; charset=utf-8';
    const roh = typeof antwort.text === 'string' ? antwort.text : JSON.stringify(daten);
    k._offen.fetch++;
    return new Promise((resolve) => {
      setImmediate(() => {
        k._offen.fetch--;
        resolve({
          ok: status >= 200 && status < 300,
          status,
          headers: { get: (n) => (String(n).toLowerCase() === 'content-type' ? typ : null) },
          json: async () => JSON.parse(roh),
          text: async () => roh
        });
      });
    });
  }

  const CSS = {
    escape: (s) => String(s).replace(/[^a-zA-Z0-9_-]/g, (c) => '\\' + c),
    supports: () => true
  };

  const sandbox = {
    console,
    document,
    location,
    history,
    localStorage,
    sessionStorage: { getItem: () => null, setItem() {}, removeItem() {}, clear() {} },
    navigator: {
      userAgent: 'Attrappe',
      language: 'de-DE',
      clipboard: {
        writeText: async (t) => {
          k.zwischenablage.push(String(t));
        }
      }
    },
    matchMedia: (q) => ({ matches: k.medien[q] === true, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }),
    getComputedStyle: (el) => ({ getPropertyValue: (n) => (el && el.style ? el.style.getPropertyValue(n) : '') }),
    setTimeout: setTimeout_,
    clearTimeout: clearTimeout_,
    setInterval: setInterval_,
    clearInterval: (h) => h && clearInterval(h),
    requestAnimationFrame: (fn) => setTimeout_(() => fn(Date.now()), 0),
    cancelAnimationFrame: clearTimeout_,
    queueMicrotask,
    structuredClone,
    fetch: fetch_,
    CSS,
    Event,
    KeyboardEvent,
    CustomEvent: class CustomEvent extends Event {
      constructor(t, init = {}) {
        super(t, init);
        this.detail = init.detail ?? null;
      }
    },
    Node: dom.Node,
    Element: dom.Element,
    HTMLElement: dom.Element,
    SVGElement: dom.Element,
    Text: dom.Text,
    DocumentFragment: dom.DocumentFragment,
    URL,
    URLSearchParams,
    TextEncoder,
    TextDecoder,
    Error,
    TypeError,
    RangeError,
    SyntaxError,
    innerWidth: 1280,
    innerHeight: 800,
    scrollX: 0,
    scrollY: 0,
    devicePixelRatio: 1,
    scrollTo() {},
    print() {
      k.gedruckt++;
    },
    alert() {},
    addEventListener: (...a) => fensterZiel.addEventListener(...a),
    removeEventListener: (...a) => fensterZiel.removeEventListener(...a),
    dispatchEvent: (ev) => {
      ev.target = ev.target || k.window;
      fensterZiel._rufe(ev);
      return !ev.defaultPrevented;
    }
  };
  const ctx = vm.createContext(sandbox);
  vm.runInContext('globalThis.window = globalThis; globalThis.self = globalThis;', ctx);
  k._ctx = ctx;
  k.window = sandbox;
  dom.window = { _rufe: (ev) => fensterZiel._rufe(ev), _elternZiel: () => null };

  k.wert = (ausdruck) => vm.runInContext(String(ausdruck), ctx);
  k.roh = (x) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));
  k.eins = (el, sel) => {
    const t = el.querySelector(sel);
    if (!t) throw new Error('Kein Element für Selektor: ' + sel);
    return t;
  };
  k.alle = (el, sel) => [...el.querySelectorAll(sel)];
  k.text = (el) => (el ? textVon(el) : '');
  k.klick = (el) => el.click();
  k.tippe = (el, text) => {
    const max = el.maxLength;
    if (max > 0) {
      let ziel = el;
      for (const ch of String(text)) {
        ziel.value = max === 1 ? ch : (String(ziel.value) + ch).slice(0, max);
        ziel.dispatchEvent(new Event('input', { bubbles: true }));
        const akt = document._aktiv;
        if (akt && akt !== ziel && ['input', 'textarea'].includes(akt.localName)) ziel = akt;
      }
      return;
    }
    el.value = String(text);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  };
  k.taste = (el, key, mehr = {}) => {
    const ev = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key, ...mehr });
    el.dispatchEvent(ev);
    return ev;
  };
  // angehängte Skripte: k.skripte (src), k.skriptEreignis(src, 'load'|'error') feuert das Ereignis am Element
  dom.beiSkript = (el) => {
    k.skripte.push(el.getAttribute('src'));
    k._skriptEl.push(el);
  };
  k.skriptEreignis = (src, typ) => {
    const el = k._skriptEl.find((x) => x.getAttribute('src') === src);
    if (!el) throw new Error('Kein angehängtes Skript: ' + src);
    el.dispatchEvent(new Event(typ));
  };
  // Zeiger-Ereignisse (pointerdown/move/up) mit pointerId 1 und Koordinaten
  k.zeiger = (el, typ, { clientX = 0, clientY = 0, pointerId = 1 } = {}) => {
    const ev = new Event(typ, { bubbles: true, cancelable: true });
    Object.assign(ev, { clientX, clientY, pointerId, button: 0, isPrimary: true, pointerType: 'mouse' });
    el.dispatchEvent(ev);
    return ev;
  };
  k.ruhe = async () => {
    const ende = Date.now() + 3000;
    let ruhig = 0;
    while (Date.now() < ende) {
      if (k._offen.fetch === 0 && k._offen.timer.size === 0) {
        if (++ruhig >= 3) return;
        await new Promise((r) => setImmediate(r));
      } else {
        ruhig = 0;
        await new Promise((r) => (k._offen.timer.size ? setTimeout(r, 2) : setImmediate(r)));
      }
    }
  };

  if (typeof opt.vorher === 'function') opt.vorher(k);
  fuehreAus(k, dateien);
  document.readyState = 'interactive';
  document.dispatchEvent(new Event('DOMContentLoaded', { bubbles: true }));
  document.readyState = 'complete';
  k.window.dispatchEvent(new Event('load'));
  return k;
}

function fuehreAus(k, dateien) {
  for (const d of dateien) {
    const datei = path.join(JS, d);
    vm.runInContext(fs.readFileSync(datei, 'utf8'), k._ctx, { filename: datei });
  }
  return k;
}

module.exports = { erzeugeDom, lade, fuehreAus, Event, KeyboardEvent };
