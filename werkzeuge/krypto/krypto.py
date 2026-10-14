"""Python-Zwilling der Krypto-Bibliothek (TECHNIK §5.3).

Unabhängig geschrieben nach TECHNIK §5.2, AUFGABENFORMAT_KRYPTO §5/§6/§9.2, TECHNIK §9.2/§9.3 und den Welt-Specs
(KRYPTOS-16: SPEC W3 §0a, KRYPTOS-Hash: SPEC W5 §0a, Kasiski/Verschiebung: SPEC W2 §9) – nicht aus
public/static/js/shared/krypto.js übersetzt. Eigene Algorithmen: Playfair/Kreuzquadrat/Polybios über
Koordinaten-Wörterbücher, Spaltentransposition über Spaltenlisten, Gartenzaun über eine Zickzack-Indexliste,
Skytale über ein Raster, Fleißner über eine Lochfolge, KRYPTOS-16 über Bitlisten.

Python ≥ 3.10, nur Standardbibliothek. Fehlerhafte Parameter → KryptoFehler (deutsche Meldung).
Alle Verfahren liefern GROSSBUCHSTABEN ohne Leerzeichen.

Zuordnung JS (shared/krypto.js) ↔ Python (dieses Modul); Optionsobjekte der JS-API sind hier Schlüsselwort-Argumente
(Namen in snake_case, z. B. { fuellzeichenX } → fuellzeichen_x):

| JS                              | Python                          | JS                              | Python                      |
|---------------------------------|---------------------------------|---------------------------------|-----------------------------|
| ALPHABET, KryptoFehler          | ALPHABET, KryptoFehler          | ascii, zeichenAusAscii          | ascii_wert, zeichen_aus_ascii |
| mod, wert, buchstabe            | mod, wert, buchstabe            | textZuBytes, bytesZuText        | text_zu_bytes, bytes_zu_text |
| verschiebung                    | verschiebung                    | byteZuBits, bitsZuByte          | byte_zu_bits, bits_zu_byte  |
| normalisieren, nurBuchstaben    | normalisieren, nur_buchstaben   | textZuBits, bitsZuText          | text_zu_bits, bits_zu_text  |
| normBits, gruppieren, klein     | norm_bits, gruppieren, klein    | xorBits, undBits, oderBits      | xor_bits, und_bits, oder_bits |
| zahlen, ausZahlen               | zahlen, aus_zahlen              | xor, hex, vonHex, rotiereBits   | xor, hex_text, von_hex, rotiere_bits |
| caesar, alleCaesar, atbash      | caesar, alle_caesar, atbash     | kryptos16.SBOX / SBOX_INV       | KRYPTOS16_SBOX / KRYPTOS16_SBOX_INV |
| affin, affinSchluesselGueltig   | affin, affin_schluessel_gueltig | kryptos16.rundenschluessel      | kryptos16_rundenschluessel  |
| schluesselwortAlphabet          | schluesselwort_alphabet         | kryptos16.sbox, .transponiere   | kryptos16_sbox, kryptos16_transponiere |
| substitution, umkehrAlphabet    | substitution, umkehr_alphabet   | kryptos16.runde                 | kryptos16_runde             |
| vigenere, autokey, porta        | vigenere, autokey, porta        | kryptos16.verschluesseln/…ent…  | kryptos16_verschluesseln / kryptos16_entschluesseln |
| quadrat, playfairPaare          | quadrat, playfair_paare         | kryptos16.lawine, .modus        | kryptos16_lawine, kryptos16_modus |
| playfair, kreuzquadrat          | playfair, kreuzquadrat          | kryptos16.textZuBloecken        | kryptos16_text_zu_bloecken  |
| zweiQuadratZahl                 | zwei_quadrat_zahl               | kryptos16.bloeckeZuText         | kryptos16_bloecke_zu_text   |
| polybios, adfgvx                | polybios, adfgvx                | kryptosHash                     | kryptos_hash                |
| gartenzaun, skytale, fleissner  | gartenzaun, skytale, fleissner  | kryptosHash.kollisionSuchen     | kryptos_hash_kollision_suchen |
| schablonePruefen                | schablone_pruefen               | DEUTSCH, haeufigkeiten, anteile | DEUTSCH, haeufigkeiten, anteile |
| spaltenReihenfolge              | spalten_reihenfolge             | rangfolge, teiltexte, bigramme  | rangfolge, teiltexte, bigramme |
| spaltentransposition            | spaltentransposition            | koinzidenzindex, friedman       | koinzidenzindex, friedman   |
| umkehrung, blockrotation        | umkehrung, blockrotation        | friedmanWert, kasiski           | friedman_wert, kasiski      |
| skytaleRaster, ringFolge, ring  | skytale_raster, ring_folge, ring | pendelFolge, schluesselstrom   | pendel_folge, schluesselstrom |
| gartenzaunSchienen              | gartenzaun_schienen             | fleissnerStellungen/-Drehgruppen | fleissner_stellungen/_drehgruppen |
| ngramme, teilsubstitution       | ngramme, teilsubstitution       | musterSuchen, teilerTabelle     | muster_suchen, teiler_tabelle |
| primfaktoren                    | primfaktoren                    | mittlererKoinzidenzindex, koinzidenzindexBruch | mittlerer_koinzidenzindex, koinzidenzindex_bruch |
| kryptos16.bitweg, .kacheln      | kryptos16_bitweg, kryptos16_kacheln | kryptos16.ausKacheln        | kryptos16_aus_kacheln       |
| rm16.rundenschluessel / .runde  | rm16_rundenschluessel, rm16_runde | rm16.verschluesseln/…ent…     | rm16_verschluesseln / rm16_entschluesseln |
| miniEnigma                      | mini_enigma                     | miniEnigma.tabelle / .weg       | mini_enigma_tabelle / mini_enigma_weg |
| ordnung, teileMitRest           | ordnung, teile_mit_rest         | probedivision                   | probedivision               |
| rsa.signieren / .pruefen        | rsa_signieren, rsa_pruefen      | pruefsumme, sha256, hashZahl    | pruefsumme, sha256 (hashlib), hash_zahl |
| rsa.eKandidaten (Review M6)     | rsa_e_kandidaten                |                                 |                                         |
| kryptosHash.ausgleichen         | kryptos_hash_ausgleichen        |                                 |                             |
| ggT, erweiterterEuklid          | ggt, erweiterter_euklid         | verschiebungSchaetzen, chiQuadrat | verschiebung_schaetzen, chi_quadrat |
| inverses, modpow, istPrim       | inverses, modpow, ist_prim      | rsa.schluessel / .ver… / .ent…  | rsa_schluessel, rsa_verschluesseln, rsa_entschluesseln |
| dh.oeffentlich/.gemeinsam       | dh_oeffentlich, dh_gemeinsam    | dh.dlogKlein, schluesselanzahl  | dh_dlog_klein, schluesselanzahl |
| verfahren.TYPEN / .pruefe       | VERFAHREN_TYPEN, verfahren_pruefe | verfahren.anwenden / .varianten | verfahren_anwenden, verfahren_varianten |
| baukasten.STUFEN / .MAX_STUFEN  | BAUKASTEN_STUFEN, BAUKASTEN_MAX_STUFEN | baukasten.pruefe            | baukasten_pruefe            |
| baukasten.verschluesseln        | baukasten_verschluesseln        | baukasten.entschluesseln        | baukasten_entschluesseln    |

Rückgabe-Objekte sind dict mit den JS-Schlüsseln in snake_case (z. B. nach_xor ↔ nachXor); werkzeuge/krypto/bruecke.py
setzt sie für den Vergleich wieder in camelCase.
"""
from __future__ import annotations

import hashlib
import math
import re
import unicodedata
from fractions import Fraction

ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
ZIFFERN = '0123456789'
# Leerraum wie \s in JavaScript (die JS-Bibliothek entfernt „Leerraum“ mit diesem Zeichenvorrat).
LEERRAUM = frozenset('\t\n\v\f\r              '
                     '    　﻿')


class KryptoFehler(Exception):
    """Fehlerhafte Parameter (deutsche Meldung)."""


# ───────────────────────────── Prüfhilfen ─────────────────────────────

def _ganz(x, name='Wert'):
    """Ganze Zahl (auch 3.0); sonst KryptoFehler. Wahrheitswerte und Texte sind keine Zahlen."""
    if isinstance(x, bool):
        raise KryptoFehler(f'{name} muss eine ganze Zahl sein.')
    if isinstance(x, int):
        return x
    if isinstance(x, float) and math.isfinite(x) and x.is_integer():
        return int(x)
    raise KryptoFehler(f'{name} muss eine ganze Zahl sein.')


def _ist_ganz(x):
    try:
        _ganz(x)
        return True
    except KryptoFehler:
        return False


def _zahl(x, name='Wert'):
    if isinstance(x, bool) or not isinstance(x, (int, float)) or not math.isfinite(x):
        raise KryptoFehler(f'{name} muss eine Zahl sein.')
    return x


def _text(x, name='Text'):
    if not isinstance(x, str):
        raise KryptoFehler(f'{name} muss eine Zeichenkette sein.')
    return x


def _richtung(r):
    if r not in ('ver', 'ent'):
        raise KryptoFehler('Richtung muss „ver“ oder „ent“ sein.')
    return r


def _ohne_leerraum(s):
    return ''.join(c for c in s if c not in LEERRAUM)


# ───────────────────────────── Grundlagen ─────────────────────────────

def mod(a, m):
    a = _ganz(a, 'a')
    m = _ganz(m, 'Modul')
    if m <= 0:
        raise KryptoFehler('Der Modul muss positiv sein.')
    return a % m  # Python: kleinster nicht negativer Rest bei m > 0


def wert(b, basis=1):
    b = _text(b, 'Buchstabe').upper()
    basis = _ganz(basis, 'Basis')
    if len(b) != 1 or b not in ALPHABET:
        raise KryptoFehler('Erwartet wird genau ein Buchstabe A–Z.')
    return ALPHABET.index(b) + basis


def buchstabe(n, basis=1):
    n = _ganz(n, 'Zahl')
    basis = _ganz(basis, 'Basis')
    return ALPHABET[(n - basis) % 26]


def verschiebung(schluesselbuchstabe):
    return wert(schluesselbuchstabe, 0)


_UMLAUTE = (('ä', 'AE'), ('Ä', 'AE'), ('ö', 'OE'), ('Ö', 'OE'), ('ü', 'UE'), ('Ü', 'UE'), ('ß', 'SS'), ('ẞ', 'SS'))


def normalisieren(text, *, ziffern=True):
    """Delta §5.1: NFC, Umlaute/ß ersetzen, groß, Diakritika weg, nur A–Z (und 0–9)."""
    t = unicodedata.normalize('NFC', _text(text))
    for a, b in _UMLAUTE:
        t = t.replace(a, b)
    t = unicodedata.normalize('NFD', t.upper())
    erlaubt = ALPHABET + ZIFFERN if ziffern else ALPHABET
    return ''.join(c for c in t if c in erlaubt)


def nur_buchstaben(text):
    return normalisieren(text, ziffern=False)


def norm_bits(text):
    """Delta §5.2: Leerraum und _ | . entfernen, alles andere bleibt stehen."""
    return ''.join(c for c in _text(text) if c not in LEERRAUM and c not in '_|.')


def gruppieren(text, n=5, trenner=' '):
    t = _ohne_leerraum(_text(text))
    n = _ganz(n, 'Gruppengröße')
    if n < 1:
        raise KryptoFehler('Die Gruppengröße muss mindestens 1 sein.')
    trenner = _text(trenner, 'Trenner')
    return trenner.join(t[i:i + n] for i in range(0, len(t), n))


def klein(text):
    return _text(text).lower()


def zahlen(text, basis=1):
    basis = _ganz(basis, 'Basis')
    return [ALPHABET.index(c) + basis for c in nur_buchstaben(text)]


def aus_zahlen(liste, basis=1):
    if not isinstance(liste, list):
        raise KryptoFehler('Erwartet wird eine Liste von Zahlen.')
    return ''.join(buchstabe(_ganz(x, 'Zahl'), basis) for x in liste)


# ───────────────────────────── Monoalphabetisch ─────────────────────────────

def _verschiebe(c, k):
    return ALPHABET[(ALPHABET.index(c) + k) % 26]


def caesar(text, k, richtung='ver'):
    k = _ganz(k, 'k')
    vorzeichen = 1 if _richtung(richtung) == 'ver' else -1
    return ''.join(_verschiebe(c, vorzeichen * k) for c in nur_buchstaben(text))


def alle_caesar(text):
    return [{'k': k, 'text': caesar(text, k, 'ent')} for k in range(26)]


def atbash(text):
    spiegel = dict(zip(ALPHABET, reversed(ALPHABET)))
    return ''.join(spiegel[c] for c in nur_buchstaben(text))


def affin_schluessel_gueltig(a):
    return _ist_ganz(a) and math.gcd(_ganz(a), 26) == 1


def affin(text, a, b=0, richtung='ver', basis=0):
    a = _ganz(a, 'a')
    b = _ganz(b, 'b')
    basis = _ganz(basis, 'Basis')
    _richtung(richtung)
    if basis not in (0, 1):
        raise KryptoFehler('Die Basis muss 0 oder 1 sein.')
    if math.gcd(a, 26) != 1:
        raise KryptoFehler('a muss teilerfremd zu 26 sein.')
    a_inv = pow(a % 26, -1, 26)
    aus = []
    for c in nur_buchstaben(text):
        x = wert(c, basis)
        if richtung == 'ver':
            aus.append(buchstabe(a * x + b, basis))
        else:
            aus.append(buchstabe(a_inv * (x - b), basis))
    return ''.join(aus)


def schluesselwort_alphabet(wort, *, rest='alphabetisch'):
    if rest not in ('alphabetisch', 'ab_letztem'):
        raise KryptoFehler('rest muss „alphabetisch“ oder „ab_letztem“ sein.')
    folge = list(dict.fromkeys(nur_buchstaben(wort)))
    if rest == 'ab_letztem' and folge:
        start = ALPHABET.index(folge[-1]) + 1
        vorrat = ALPHABET[start:] + ALPHABET[:start]
    else:
        vorrat = ALPHABET
    return ''.join(dict.fromkeys(folge + list(vorrat)))


def _geheimalphabet(g):
    g = nur_buchstaben(_text(g, 'Geheimtextalphabet'))
    if len(g) != 26 or set(g) != set(ALPHABET):
        raise KryptoFehler('Das Geheimtextalphabet muss aus 26 verschiedenen Buchstaben bestehen.')
    return g


def substitution(text, geheimalphabet, richtung='ver'):
    g = _geheimalphabet(geheimalphabet)
    if _richtung(richtung) == 'ver':
        tabelle = dict(zip(ALPHABET, g))
    else:
        tabelle = dict(zip(g, ALPHABET))
    return ''.join(tabelle[c] for c in nur_buchstaben(text))


def umkehr_alphabet(geheimalphabet):
    g = _geheimalphabet(geheimalphabet)
    rueck = dict(zip(g, ALPHABET))
    return ''.join(rueck[c] for c in ALPHABET)


# ───────────────────────────── Polyalphabetisch ─────────────────────────────

def _schluesselwort(s, name='Schlüssel'):
    w = nur_buchstaben(_text(s, name))
    if not w:
        raise KryptoFehler(f'{name} muss mindestens einen Buchstaben enthalten.')
    return w


def vigenere(text, schluessel, richtung='ver'):
    s = _schluesselwort(schluessel)
    vz = 1 if _richtung(richtung) == 'ver' else -1
    return ''.join(_verschiebe(c, vz * ALPHABET.index(s[i % len(s)])) for i, c in enumerate(nur_buchstaben(text)))


def autokey(text, schluessel, richtung='ver'):
    _richtung(richtung)
    strom = list(_schluesselwort(schluessel))
    t = nur_buchstaben(text)
    aus = []
    for i, c in enumerate(t):
        k = ALPHABET.index(strom[i])
        if _richtung(richtung) == 'ver':
            aus.append(_verschiebe(c, k))
            strom.append(c)
        else:
            p = _verschiebe(c, -k)
            aus.append(p)
            strom.append(p)
    return ''.join(aus)


def porta(text, schluessel, richtung='ver'):
    _richtung(richtung)
    s = _schluesselwort(schluessel)
    aus = []
    for i, c in enumerate(nur_buchstaben(text)):
        j = ALPHABET.index(s[i % len(s)]) // 2
        x = ALPHABET.index(c)
        y = 13 + (x - j) % 13 if x < 13 else (x - 13 + j) % 13
        aus.append(ALPHABET[y])
    return ''.join(aus)


def pendel_folge(wort, laenge=None):
    """W6 §2: Pendel ohne doppelte Enden über Index-Spiegelung i mod (2L − 2); L = 1: das Wort selbst."""
    w = _schluesselwort(wort)
    L = len(w)
    p = 1 if L == 1 else 2 * L - 2
    if laenge is None:
        anzahl = p
    else:
        anzahl = _ganz(laenge, 'Länge')
        if anzahl < 0:
            raise KryptoFehler('Die Länge darf nicht negativ sein.')
    aus = []
    for i in range(anzahl):
        j = i % p
        aus.append(w[j if j < L else p - j])
    return ''.join(aus)


def schluesselstrom(text, schluessel, *, modus='vigenere', richtung='ver'):
    """W2 §9.1 Reiter 2: Schlüsselbuchstabe je Klartext-/Geheimtextbuchstabe."""
    if modus not in ('vigenere', 'autokey', 'pendel'):
        raise KryptoFehler('Unbekannter Modus des Schlüsselstroms.')
    _richtung(richtung)
    s = _schluesselwort(schluessel)
    t = nur_buchstaben(text)
    if modus == 'pendel':
        return pendel_folge(s, len(t))
    if modus == 'vigenere':
        return ''.join(s[i % len(s)] for i in range(len(t)))
    strom = list(s)
    for i, c in enumerate(t):  # autokey: Strom wächst um den Klartextbuchstaben
        if richtung == 'ver':
            strom.append(c)
        else:
            strom.append(ALPHABET[(ALPHABET.index(c) - ALPHABET.index(strom[i])) % 26])
    return ''.join(strom[:len(t)])


# ───────────────────────────── Quadrate und Bigramme ─────────────────────────────

def quadrat(schluessel='', *, groesse=5, ij='I'):
    groesse = _ganz(groesse, 'Größe')
    if groesse not in (5, 6):
        raise KryptoFehler('Quadrate gibt es nur als 5 × 5 oder 6 × 6.')
    if ij not in ('I', 'J'):
        raise KryptoFehler('ij muss „I“ oder „J“ sein.')
    if isinstance(schluessel, list):
        schluessel = ''.join(_text(z, 'Zeile') for z in schluessel)
    _text(schluessel, 'Schlüssel')
    if groesse == 5:
        weg, ziel = ('J', 'I') if ij == 'I' else ('I', 'J')
        anfang = nur_buchstaben(schluessel).replace(weg, ziel)
        vorrat = ALPHABET.replace(weg, '')
    else:
        anfang = normalisieren(schluessel)
        vorrat = ALPHABET + ZIFFERN
    folge = ''.join(dict.fromkeys(anfang + vorrat))
    return [folge[i:i + groesse] for i in range(0, groesse * groesse, groesse)]


def _koordinaten(zeilen):
    return {c: (z, s) for z, zeile in enumerate(zeilen) for s, c in enumerate(zeile)}


def _quadratbuchstabe(c, zeilen, name='Füllzeichen'):
    if not isinstance(c, str) or len(c) != 1 or c.upper() not in _koordinaten(zeilen):
        raise KryptoFehler(f'{name} muss ein Buchstabe des Quadrats sein.')
    return c.upper()


def _ij_text(text, ij='I'):
    t = nur_buchstaben(text)
    return t.replace('J', 'I') if ij == 'I' else t.replace('I', 'J')


def playfair_paare(text, *, fuellzeichen='X', fuellzeichen_x='Q', ij='I'):
    if ij not in ('I', 'J'):
        raise KryptoFehler('ij muss „I“ oder „J“ sein.')
    q = quadrat('', ij=ij)
    f = _quadratbuchstabe(fuellzeichen, q)
    fx = _quadratbuchstabe(fuellzeichen_x, q, 'Füllzeichen für X')
    if f == fx:
        raise KryptoFehler('Die beiden Füllzeichen müssen verschieden sein.')
    t = _ij_text(text, ij)
    paare = []
    i = 0
    while i < len(t):
        a = t[i]
        fuell = fx if a == f else f
        if i + 1 < len(t) and t[i + 1] != a:
            paare.append(a + t[i + 1])
            i += 2
        else:
            paare.append(a + fuell)
            i += 1
    return paare


def playfair(text, schluessel, richtung='ver', *, fuellzeichen='X', fuellzeichen_x='Q', ij='I'):
    _richtung(richtung)
    q = quadrat(schluessel, ij=ij)
    pos = _koordinaten(q)
    if richtung == 'ver':
        paare = playfair_paare(text, fuellzeichen=fuellzeichen, fuellzeichen_x=fuellzeichen_x, ij=ij)
        d = 1
    else:
        playfair_paare('', fuellzeichen=fuellzeichen, fuellzeichen_x=fuellzeichen_x, ij=ij)  # Optionen prüfen
        t = _ij_text(text, ij)
        if len(t) % 2:
            raise KryptoFehler('Ein Playfair-Geheimtext hat eine gerade Länge.')
        paare = [t[i:i + 2] for i in range(0, len(t), 2)]
        if any(p[0] == p[1] for p in paare):
            raise KryptoFehler('Ein Playfair-Geheimtextpaar besteht nie aus zwei gleichen Buchstaben.')
        d = -1
    aus = []
    for a, b in paare:
        (za, sa), (zb, sb) = pos[a], pos[b]
        if za == zb:
            aus.append(q[za][(sa + d) % 5] + q[zb][(sb + d) % 5])
        elif sa == sb:
            aus.append(q[(za + d) % 5][sa] + q[(zb + d) % 5][sb])
        else:
            aus.append(q[za][sb] + q[zb][sa])
    return ''.join(aus)


def kreuzquadrat(text, oben, unten, richtung='ver', *, fuellzeichen='X'):
    _richtung(richtung)
    o, u = quadrat(_text(oben, 'oben')), quadrat(_text(unten, 'unten'))
    po, pu = _koordinaten(o), _koordinaten(u)
    t = _ij_text(text)
    f = _quadratbuchstabe(fuellzeichen, o)
    if richtung == 'ver':
        if len(t) % 2:
            t += f
    elif len(t) % 2:
        raise KryptoFehler('Ein Kreuzquadrat-Geheimtext hat eine gerade Länge.')
    aus = []
    for i in range(0, len(t), 2):
        a, b = t[i], t[i + 1]
        if richtung == 'ver':
            (za, sa), (zb, sb) = po[a], pu[b]
            aus.append(u[za][sb] + o[zb][sa])
        else:
            (r1, t1), (r2, t2) = pu[a], po[b]
            aus.append(o[r1][t2] + u[r2][t1])
    return ''.join(aus)


def _zahlenschluessel(z):
    # Nur Ziffernfolge als Text oder Liste – als Zahl ginge eine führende 0 verloren (0314 → 314).
    if isinstance(z, str):
        z = _ohne_leerraum(z)
        if not z or any(c not in '01234' for c in z):
            raise KryptoFehler('Der Zahlenschlüssel besteht aus den Ziffern 0–4.')
        return [int(c) for c in z]
    if isinstance(z, list) and z:
        werte = [_ganz(x, 'Ziffer') for x in z]
        if all(0 <= x <= 4 for x in werte):
            return werte
    raise KryptoFehler('Der Zahlenschlüssel besteht aus den Ziffern 0–4.')


def zwei_quadrat_zahl(text, q1, q2, zahlenschluessel, richtung='ver'):
    _richtung(richtung)
    k = _zahlenschluessel(zahlenschluessel)
    a, b = quadrat(_text(q1, 'q1')), quadrat(_text(q2, 'q2'))
    von, nach, vz = (a, b, 1) if richtung == 'ver' else (b, a, -1)
    pos = _koordinaten(von)
    aus = []
    for i, c in enumerate(_ij_text(text)):
        z, s = pos[c]
        aus.append(nach[(z + vz * k[i % len(k)]) % 5][s])
    return ''.join(aus)


def polybios(text, richtung='ver', *, schluessel='', kopf='12345', ij='I'):
    _richtung(richtung)
    kopf = _text(kopf, 'Kopf').upper()
    if len(kopf) not in (5, 6) or len(set(kopf)) != len(kopf):
        raise KryptoFehler('Der Kopf besteht aus 5 oder 6 verschiedenen Zeichen.')
    n = len(kopf)
    q = quadrat(schluessel, groesse=n, ij=ij)
    if richtung == 'ver':
        t = _ij_text(text, ij) if n == 5 else normalisieren(text)
        pos = _koordinaten(q)
        return ''.join(kopf[pos[c][0]] + kopf[pos[c][1]] for c in t)
    t = _ohne_leerraum(_text(text)).upper()
    if len(t) % 2:
        raise KryptoFehler('Polybios-Geheimtext besteht aus Zeichenpaaren.')
    stelle = {c: i for i, c in enumerate(kopf)}
    aus = []
    for i in range(0, len(t), 2):
        if t[i] not in stelle or t[i + 1] not in stelle:
            raise KryptoFehler('Zeichen außerhalb des Kopfs.')
        aus.append(q[stelle[t[i]]][stelle[t[i + 1]]])
    return ''.join(aus)


def adfgvx(text, quadrat36, schluessel, richtung='ver'):
    _richtung(richtung)
    if not isinstance(quadrat36, (str, list)):
        raise KryptoFehler('Das Quadrat ist ein Text oder eine Zeilenliste.')
    q = ''.join(quadrat(quadrat36, groesse=6))
    spalten_reihenfolge(schluessel)  # Schlüssel früh prüfen
    if richtung == 'ver':
        stufe1 = polybios(text, schluessel=q, kopf='ADFGVX')
        return _spalten(stufe1, schluessel, 'ver', None)
    stufe1 = _spalten(normalisieren(text), schluessel, 'ent', None)
    return polybios(stufe1, 'ent', schluessel=q, kopf='ADFGVX')


# ───────────────────────────── Transposition ─────────────────────────────

def _zickzack(n, zeilen):
    """Zeile jedes Textzeichens im Zickzack (ab Zeile 0)."""
    liste, z, schritt = [], 0, 1
    for _ in range(n):
        liste.append(z)
        if z == 0:
            schritt = 1
        elif z == zeilen - 1:
            schritt = -1
        z += schritt
    return liste


def gartenzaun(text, zeilen, richtung='ver'):
    zeilen = _ganz(zeilen, 'Zeilen')
    _richtung(richtung)
    if zeilen < 2:
        raise KryptoFehler('Ein Gartenzaun hat mindestens 2 Zeilen.')
    t = nur_buchstaben(text)
    muster = _zickzack(len(t), zeilen)
    lesefolge = sorted(range(len(t)), key=lambda i: (muster[i], i))
    if richtung == 'ver':
        return ''.join(t[i] for i in lesefolge)
    aus = [''] * len(t)
    for c, i in zip(t, lesefolge):
        aus[i] = c
    return ''.join(aus)


def _fuell_oder_none(f):
    if f is None:
        return None
    if not isinstance(f, str) or len(f) != 1 or f.upper() not in ALPHABET:
        raise KryptoFehler('Das Füllzeichen muss ein Buchstabe sein.')
    return f.upper()


def skytale(text, umfang, richtung='ver', *, fuellzeichen='X'):
    u = _ganz(umfang, 'Umfang')
    _richtung(richtung)
    if u < 2:
        raise KryptoFehler('Der Umfang muss mindestens 2 sein.')
    f = _fuell_oder_none(fuellzeichen)
    t = nur_buchstaben(text)
    n = len(t)
    if richtung == 'ver':
        m = -(-n // u)
        raster = [[t[z * m + s] if z * m + s < n else f for s in range(m)] for z in range(u)]
        return ''.join(raster[z][s] for s in range(m) for z in range(u) if raster[z][s] is not None)
    if f is not None:
        if n % u:
            raise KryptoFehler('Die Länge muss ein Vielfaches des Umfangs sein.')
        m = n // u
        return ''.join(t[s * u + z] for z in range(u) for s in range(m))
    m = -(-n // u)
    belegt = [[z * m + s < n for s in range(m)] for z in range(u)]
    raster = [[''] * m for _ in range(u)]
    zeichen = iter(t)
    for s in range(m):
        for z in range(u):
            if belegt[z][s]:
                raster[z][s] = next(zeichen)
    return ''.join(''.join(zeile) for zeile in raster)


def _loecher(groesse, schablone):
    if not isinstance(schablone, list):
        return None
    liste = []
    for loch in schablone:
        if not isinstance(loch, list) or len(loch) != 2 or not all(_ist_ganz(x) for x in loch):
            return None
        liste.append((_ganz(loch[0]), _ganz(loch[1])))
    return liste


def _drehe(z, s, n, drehung):
    return (s, n + 1 - z) if drehung == 'rechts' else (n + 1 - s, z)


def schablone_pruefen(groesse, schablone):
    fehler = []
    if not _ist_ganz(groesse) or _ganz(groesse) < 2 or _ganz(groesse) % 2:
        return {'ok': False, 'fehler': ['Die Schablonengröße muss eine gerade Zahl ≥ 2 sein.'], 'abgedeckt': 0}
    n = _ganz(groesse)
    loecher = _loecher(n, schablone)
    if loecher is None:
        return {'ok': False, 'fehler': ['Die Schablone ist eine Liste von Löchern [z, s].'], 'abgedeckt': 0}
    innen = [(z, s) for z, s in loecher if 1 <= z <= n and 1 <= s <= n]
    if len(innen) != len(loecher):
        fehler.append('Ein Loch liegt außerhalb der Schablone.')
    if len(loecher) != n * n // 4:
        fehler.append(f'Eine {n} × {n}-Schablone hat genau {n * n // 4} Löcher.')
    zaehler = {}
    for z, s in innen:
        for _ in range(4):
            zaehler[(z, s)] = zaehler.get((z, s), 0) + 1
            z, s = _drehe(z, s, n, 'rechts')
    if any(v > 1 for v in zaehler.values()):
        fehler.append('Ein Feld wird mehrfach freigegeben.')
    if len(zaehler) != n * n:
        fehler.append('Nicht jedes Feld wird freigegeben.')
    return {'ok': not fehler, 'fehler': fehler, 'abgedeckt': len(zaehler)}


def fleissner(text, groesse, schablone, richtung='ver', *, drehung='rechts', fuellzeichen='X'):
    _richtung(richtung)
    if drehung not in ('rechts', 'links'):
        raise KryptoFehler('drehung muss „rechts“ oder „links“ sein.')
    pruefung = schablone_pruefen(groesse, schablone)
    if not pruefung['ok']:
        raise KryptoFehler('Ungültige Schablone: ' + '; '.join(pruefung['fehler']))
    n = _ganz(groesse)
    f = _fuell_oder_none(fuellzeichen)
    if f is None:
        raise KryptoFehler('Das Füllzeichen muss ein Buchstabe sein.')
    stellungen = []
    loecher = _loecher(n, schablone)
    for _ in range(4):
        stellungen.extend(sorted(loecher))
        loecher = [_drehe(z, s, n, drehung) for z, s in loecher]
    lochfolge = [(z - 1) * n + (s - 1) for z, s in stellungen]  # Rasterindex je Schreibschritt
    t = nur_buchstaben(text)
    block = n * n
    if richtung == 'ver':
        if len(t) % block:
            t += f * (block - len(t) % block)
        aus = []
        for b in range(0, len(t), block):
            raster = [''] * block
            for c, stelle in zip(t[b:b + block], lochfolge):
                raster[stelle] = c
            aus.append(''.join(raster))
        return ''.join(aus)
    if len(t) % block:
        raise KryptoFehler('Die Länge muss ein Vielfaches der Blockgröße sein.')
    return ''.join(t[b + stelle] for b in range(0, len(t), block) for stelle in lochfolge)


def spalten_reihenfolge(schluessel):
    if isinstance(schluessel, list):
        werte = [_ganz(x, 'Spaltennummer') for x in schluessel]
        if not werte or sorted(werte) != list(range(1, len(werte) + 1)):
            raise KryptoFehler('Die Zahlenfolge muss eine Anordnung von 1 … n sein.')
        return werte
    w = _schluesselwort(schluessel)
    rang = sorted(range(len(w)), key=lambda i: (w[i], i))
    ergebnis = [0] * len(w)
    for r, i in enumerate(rang, start=1):
        ergebnis[i] = r
    return ergebnis


def _spalten(t, schluessel, richtung, fuell):
    """Spaltentransposition über Spaltenlisten (t ist bereits normalisiert)."""
    ordnung = spalten_reihenfolge(schluessel)
    n = len(ordnung)
    lesefolge = sorted(range(n), key=lambda j: ordnung[j])  # Spaltenindizes in Lesereihenfolge
    if richtung == 'ver':
        if fuell is not None and len(t) % n:
            t += fuell * (n - len(t) % n)
        spalten = [t[j::n] for j in range(n)]
        return ''.join(spalten[j] for j in lesefolge)
    laenge = [len(t) // n + (1 if j < len(t) % n else 0) for j in range(n)]
    spalten = [''] * n
    rest = t
    for j in lesefolge:
        spalten[j], rest = rest[:laenge[j]], rest[laenge[j]:]
    return ''.join(spalten[j][z] for z in range(max(laenge, default=0)) for j in range(n) if z < len(spalten[j]))


def spaltentransposition(text, schluessel, richtung='ver', *, fuellzeichen=None):
    _richtung(richtung)
    f = _fuell_oder_none(fuellzeichen)
    spalten_reihenfolge(schluessel)
    return _spalten(nur_buchstaben(text), schluessel, richtung, f if richtung == 'ver' else None)


def umkehrung(text):
    return nur_buchstaben(text)[::-1]


def _byteliste(folge, name='Bytes'):
    if not isinstance(folge, list):
        raise KryptoFehler(f'{name} müssen eine Liste sein.')
    werte = [_ganz(x, 'Byte') for x in folge]
    if any(not 0 <= x <= 255 for x in werte):
        raise KryptoFehler('Bytes liegen zwischen 0 und 255.')
    return werte


def blockrotation(folge, block, um, richtung='ver'):
    block = _ganz(block, 'Blocklänge')
    um = _ganz(um, 'Rotation')
    _richtung(richtung)
    if block < 2:
        raise KryptoFehler('Die Blocklänge muss mindestens 2 sein.')
    ist_text = isinstance(folge, str)
    werte = list(nur_buchstaben(folge)) if ist_text else _byteliste(folge)
    aus = []
    for b in range(0, len(werte), block):
        teil = werte[b:b + block]
        r = um % len(teil)
        if richtung == 'ent':
            r = (len(teil) - r) % len(teil)
        aus.extend(teil[r:] + teil[:r])
    return ''.join(aus) if ist_text else aus


def skytale_raster(text, umfang, *, fuellzeichen='X'):
    """W0 §9.1: Zeilen des Skytale-Rasters (umfang 2–30), Zelle (z, s) = Zeichen z · m + s."""
    u = _ganz(umfang, 'Umfang')
    if not 2 <= u <= 30:
        raise KryptoFehler('Der Umfang liegt zwischen 2 und 30.')
    f = _fuell_oder_none(fuellzeichen)
    t = nur_buchstaben(text)
    m = -(-len(t) // u)
    zeilen = []
    for z in range(u):
        zeile = ''
        for sp in range(m):
            i = z * m + sp
            if i < len(t):
                zeile += t[i]
            elif f is not None:
                zeile += f
        zeilen.append(zeile)
    return zeilen


def gartenzaun_schienen(laenge, zeilen):
    """Schiene je Position über die Periode 2(z − 1): Rest r, Schiene r bzw. 2(z − 1) − r."""
    n = _ganz(laenge, 'Länge')
    z = _ganz(zeilen, 'Zeilen')
    if n < 0:
        raise KryptoFehler('Die Länge darf nicht negativ sein.')
    if not 2 <= z <= 10:
        raise KryptoFehler('Ein Gartenzaun hat 2 bis 10 Schienen.')
    p = 2 * (z - 1)
    return [i % p if i % p < z else p - i % p for i in range(n)]


def _schablonen_groesse(groesse):
    if not _ist_ganz(groesse) or not 2 <= _ganz(groesse) <= 10 or _ganz(groesse) % 2:
        raise KryptoFehler('Die Schablonengröße ist eine gerade Zahl von 2 bis 10.')
    return _ganz(groesse)


def fleissner_stellungen(groesse, loecher, *, drehung='rechts'):
    n = _schablonen_groesse(groesse)
    if drehung not in ('rechts', 'links'):
        raise KryptoFehler('drehung muss „rechts“ oder „links“ sein.')
    liste = _loecher(n, loecher)
    if liste is None or any(not (1 <= z <= n and 1 <= sp <= n) for z, sp in liste):
        raise KryptoFehler('Jedes Loch [z, s] muss im Raster liegen.')
    stellungen = []
    for _ in range(4):
        stellungen.append([[z, sp] for z, sp in sorted(liste)])
        liste = [_drehe(z, sp, n, drehung) for z, sp in liste]
    return stellungen


def fleissner_drehgruppen(groesse):
    """Gruppe = Bahn eines Feldes unter vier Rechtsdrehungen; Nummer nach erstem Auftreten (zeilenweise)."""
    n = _schablonen_groesse(groesse)

    def bahn(z, sp):
        felder = []
        for _ in range(4):
            felder.append((z, sp))
            z, sp = _drehe(z, sp, n, 'rechts')
        return min(felder)

    nummer = {}
    matrix = []
    for z in range(1, n + 1):
        zeile = []
        for sp in range(1, n + 1):
            vertreter = bahn(z, sp)
            nummer.setdefault(vertreter, len(nummer))
            zeile.append(nummer[vertreter])
        matrix.append(zeile)
    return matrix


def ring_folge(n, t):
    """W6 §2: ab Feld 0 jeweils t Felder weiter (n Schritte)."""
    n = _ganz(n, 'Felderzahl')
    t = _ganz(t, 'Ringschritt')
    if not 4 <= n <= 12:
        raise KryptoFehler('Ein Ring hat 4 bis 12 Felder.')
    if not 1 <= t <= n - 1:
        raise KryptoFehler('Der Ringschritt liegt zwischen 1 und n − 1.')
    folge, feld = [], 0
    for _ in range(n):
        folge.append(feld)
        feld = (feld + t) % n
    return {'folge': folge, 'nie_gelesen': sorted(set(range(n)) - set(folge))}


def ring(text, t, richtung='ver', *, block=8, fuellzeichen='X'):
    """W6 §2 (Eves Uhrwerk, Stufe 1) über eine Feldliste je Block."""
    _richtung(richtung)
    folge = ring_folge(block, t)['folge']
    n, t = _ganz(block), _ganz(t)
    if math.gcd(t, n) != 1:
        raise KryptoFehler('Nicht umkehrbar – t und n müssen teilerfremd sein.')
    f = _fuell_oder_none(fuellzeichen)
    if f is None:
        raise KryptoFehler('Das Füllzeichen muss ein Buchstabe sein.')
    s = nur_buchstaben(text)
    if richtung == 'ent' and len(s) % n:
        raise KryptoFehler('Die Länge muss ein Vielfaches der Blocklänge sein.')
    s += f * (-len(s) % n)
    aus = []
    for b in range(0, len(s), n):
        if richtung == 'ver':
            felder = dict(enumerate(s[b:b + n]))  # Feld → Zeichen
            aus.extend(felder[k] for k in folge)
        else:
            felder = {}
            for j, c in enumerate(s[b:b + n]):
                felder[t * j % n] = c  # Zeichen j wurde von Feld t · j mod n gelesen
            aus.extend(felder[k] for k in range(n))
    return ''.join(aus)


# ───────────────────────────── Bits, ASCII, XOR ─────────────────────────────

def ascii_wert(zeichen):
    z = _text(zeichen, 'Zeichen')
    if len(z) != 1 or not 32 <= ord(z) <= 126:
        raise KryptoFehler('Erwartet wird ein Zeichen mit ASCII-Code 32–126.')
    return ord(z)


def zeichen_aus_ascii(n):
    n = _ganz(n, 'ASCII-Code')
    if not 32 <= n <= 126:
        raise KryptoFehler('ASCII-Codes liegen zwischen 32 und 126.')
    return chr(n)


def text_zu_bytes(text):
    return [ascii_wert(c) for c in _text(text)]


def bytes_zu_text(bytes_):
    return ''.join(zeichen_aus_ascii(b) for b in _byteliste(bytes_))


def byte_zu_bits(n, breite=8):
    n = _ganz(n, 'Zahl')
    breite = _ganz(breite, 'Breite')
    if breite < 1 or not 0 <= n < 2 ** breite:
        raise KryptoFehler('Die Zahl passt nicht in die Bitbreite.')
    return format(n, f'0{breite}b')


def _nur_bits(text):
    b = norm_bits(text)
    if any(c not in '01' for c in b):
        raise KryptoFehler('Bitfolgen bestehen nur aus 0 und 1.')
    return b


def bits_zu_byte(bits):
    b = _nur_bits(bits)
    if not b:
        raise KryptoFehler('Leere Bitfolge.')
    return int(b, 2)


def text_zu_bits(text, *, gruppe=4):
    gruppe = _ganz(gruppe, 'Gruppe')
    if gruppe < 0:
        raise KryptoFehler('Die Gruppengröße ist nicht negativ.')
    bits = ''.join(byte_zu_bits(b) for b in text_zu_bytes(text))
    if gruppe == 0:
        return bits
    return ' '.join(bits[i:i + gruppe] for i in range(0, len(bits), gruppe))


def bits_zu_text(bits):
    b = _nur_bits(bits)
    if len(b) % 8:
        raise KryptoFehler('Die Bitzahl muss ein Vielfaches von 8 sein.')
    return bytes_zu_text([int(b[i:i + 8], 2) for i in range(0, len(b), 8)])


def _bitweise(op, folgen):
    if len(folgen) < 2:
        raise KryptoFehler('Es werden mindestens zwei Bitfolgen gebraucht.')
    bits = [_nur_bits(f) for f in folgen]
    if len({len(b) for b in bits}) != 1:
        raise KryptoFehler('Die Bitfolgen müssen gleich lang sein.')
    ergebnis = bits[0]
    for b in bits[1:]:
        ergebnis = ''.join(str(op(int(x), int(y))) for x, y in zip(ergebnis, b))
    return ergebnis


def xor_bits(*folgen):
    return _bitweise(lambda x, y: x ^ y, folgen)


def und_bits(a, b):
    return _bitweise(lambda x, y: x & y, (a, b))


def oder_bits(a, b):
    return _bitweise(lambda x, y: x | y, (a, b))


def hex_text(wert_oder_bytes):
    if not isinstance(wert_oder_bytes, list) and not isinstance(wert_oder_bytes, bool) \
            and isinstance(wert_oder_bytes, (int, float)):
        n = _ganz(wert_oder_bytes, 'Block')
        if not 0 <= n <= 0xFFFF:
            raise KryptoFehler('Ein Block liegt zwischen 0 und FFFF.')
        return format(n, '04X')
    return ''.join(format(b, '02X') for b in _byteliste(wert_oder_bytes))


def von_hex(text):
    t = _ohne_leerraum(_text(text))
    if len(t) % 2 or any(c not in '0123456789abcdefABCDEF' for c in t):
        raise KryptoFehler('Hex besteht aus Paaren von 0–9 und A–F.')
    return [int(t[i:i + 2], 16) for i in range(0, len(t), 2)]


def xor(text_oder_bytes, schluessel, richtung='ver'):
    _richtung(richtung)
    if isinstance(schluessel, str):
        k = text_zu_bytes(schluessel)
    else:
        k = _byteliste(schluessel, 'Schlüsselbytes')
    if not k:
        raise KryptoFehler('Der Schlüssel darf nicht leer sein.')
    if richtung == 'ver':
        daten = text_zu_bytes(text_oder_bytes) if isinstance(text_oder_bytes, str) else _byteliste(text_oder_bytes)
        return hex_text([d ^ k[i % len(k)] for i, d in enumerate(daten)])
    daten = von_hex(text_oder_bytes) if isinstance(text_oder_bytes, str) else _byteliste(text_oder_bytes)
    return bytes_zu_text([d ^ k[i % len(k)] for i, d in enumerate(daten)])


def rotiere_bits(bits, um):
    b = _nur_bits(bits)
    um = _ganz(um, 'Rotation')
    if not b:
        return ''
    r = um % len(b)
    return b[r:] + b[:r]


# ───────────────────────────── KRYPTOS-16 (SPEC W3 §0a) ─────────────────────────────

KRYPTOS16_SBOX = [0xC, 0xF, 0x3, 0x9, 0x7, 0xA, 0x8, 0x6, 0x1, 0x2, 0x4, 0xE, 0xB, 0x5, 0xD, 0x0]
KRYPTOS16_SBOX_INV = [KRYPTOS16_SBOX.index(x) for x in range(16)]


def _block16(x, name='Block'):
    x = _ganz(x, name)
    if not 0 <= x <= 0xFFFF:
        raise KryptoFehler(f'{name} liegt zwischen 0000 und FFFF.')
    return x


def _bitliste(x):
    """16 Bit als Liste b1 … b16 (b1 höchstwertig)."""
    return [(x >> (15 - i)) & 1 for i in range(16)]


def _aus_bitliste(bits):
    return sum(b << (15 - i) for i, b in enumerate(bits))


def kryptos16_rundenschluessel(schluessel16, runde):
    k = _block16(schluessel16, 'Schlüssel')
    runde = _ganz(runde, 'Runde')
    if runde < 1:
        raise KryptoFehler('Runden zählen ab 1.')
    gruppen = [k >> 12 & 0xF, k >> 8 & 0xF, k >> 4 & 0xF, k & 0xF]
    r = (runde - 1) % 4
    gruppen = gruppen[r:] + gruppen[:r]  # Vierergruppen rücken nach links
    return gruppen[0] << 12 | gruppen[1] << 8 | gruppen[2] << 4 | gruppen[3]


def kryptos16_sbox(block16, richtung='ver'):
    x = _block16(block16)
    tabelle = KRYPTOS16_SBOX if _richtung(richtung) == 'ver' else KRYPTOS16_SBOX_INV
    return sum(tabelle[(x >> (12 - 4 * z)) & 0xF] << (12 - 4 * z) for z in range(4))


def kryptos16_transponiere(block16):
    bits = _bitliste(_block16(block16))
    matrix = [bits[4 * z:4 * z + 4] for z in range(4)]
    return _aus_bitliste([matrix[s][z] for z in range(4) for s in range(4)])


def _sbox_option(sbox):
    if not isinstance(sbox, bool):
        raise KryptoFehler('sbox ist ein Wahrheitswert.')
    return sbox


def kryptos16_runde(block16, rundenschluessel, richtung='ver', *, sbox=True):
    x = _block16(block16)
    k = _block16(rundenschluessel, 'Rundenschlüssel')
    mit_s = _sbox_option(sbox)
    if _richtung(richtung) == 'ver':
        y = x ^ k
        return kryptos16_transponiere(kryptos16_sbox(y) if mit_s else y)
    y = kryptos16_transponiere(x)
    return (kryptos16_sbox(y, 'ent') if mit_s else y) ^ k


def _runden(runden):
    r = _ganz(runden, 'Rundenzahl')
    if r < 1:
        raise KryptoFehler('Mindestens eine Runde.')
    return r


def kryptos16_verschluesseln(block16, schluessel16, *, runden=4, protokoll=False, sbox=True):
    x = _block16(block16)
    k = _block16(schluessel16, 'Schlüssel')
    r = _runden(runden)
    mit_s = _sbox_option(sbox)
    tabelle = []
    for i in range(1, r + 1):
        ki = kryptos16_rundenschluessel(k, i)
        nach_xor = x ^ ki
        nach_s = kryptos16_sbox(nach_xor) if mit_s else nach_xor
        nach_t = kryptos16_transponiere(nach_s)
        tabelle.append({'runde': i, 'eingang': x, 'schluessel': ki, 'nach_xor': nach_xor, 'nach_s_box': nach_s,
                        'nach_transposition': nach_t})
        x = nach_t
    if protokoll:
        return {'ergebnis': x, 'runden': tabelle}
    return x


def kryptos16_entschluesseln(block16, schluessel16, *, runden=4, sbox=True):
    x = _block16(block16)
    k = _block16(schluessel16, 'Schlüssel')
    _sbox_option(sbox)
    for i in range(_runden(runden), 0, -1):
        x = kryptos16_runde(x, kryptos16_rundenschluessel(k, i), 'ent', sbox=sbox)
    return x


def kryptos16_lawine(block16, schluessel16, bit, *, runden=4, sbox=True):
    x = _block16(block16)
    k = _block16(schluessel16, 'Schlüssel')
    bit = _ganz(bit, 'Bit')
    r = _runden(runden)
    if not 1 <= bit <= 16:
        raise KryptoFehler('Bitnummern gehen von 1 bis 16.')
    y = x ^ (1 << (16 - bit))
    ergebnis = []
    for i in range(1, r + 1):
        ki = kryptos16_rundenschluessel(k, i)
        x, y = kryptos16_runde(x, ki, sbox=sbox), kryptos16_runde(y, ki, sbox=sbox)
        positionen = [j + 1 for j, (a, b) in enumerate(zip(_bitliste(x), _bitliste(y))) if a != b]
        ergebnis.append({'runde': i, 'positionen': positionen, 'anzahl': len(positionen)})
    return ergebnis


def kryptos16_modus(bloecke, schluessel, art, iv=None, *, richtung='ver', runden=4):
    if not isinstance(bloecke, list):
        raise KryptoFehler('Blöcke müssen eine Liste sein.')
    bl = [_block16(b) for b in bloecke]
    k = _block16(schluessel, 'Schlüssel')
    _richtung(richtung)
    r = _runden(runden)
    if art not in ('ECB', 'CBC'):
        raise KryptoFehler('Betriebsmodus ECB oder CBC.')
    if art == 'ECB':
        if richtung == 'ver':
            return [kryptos16_verschluesseln(b, k, runden=r) for b in bl]
        return [kryptos16_entschluesseln(b, k, runden=r) for b in bl]
    if iv is None:
        raise KryptoFehler('CBC braucht einen Initialisierungsvektor.')
    vorher = _block16(iv, 'IV')
    aus = []
    for b in bl:
        if richtung == 'ver':
            vorher = kryptos16_verschluesseln(b ^ vorher, k, runden=r)
            aus.append(vorher)
        else:
            aus.append(kryptos16_entschluesseln(b, k, runden=r) ^ vorher)
            vorher = b
    return aus


def kryptos16_text_zu_bloecken(text):
    b = text_zu_bytes(text)
    b += [1] if len(b) % 2 else [2, 2]
    return [b[i] << 8 | b[i + 1] for i in range(0, len(b), 2)]


def kryptos16_bloecke_zu_text(bloecke):
    if not isinstance(bloecke, list) or not bloecke:
        raise KryptoFehler('Mindestens ein Block (mit Füllbytes).')
    b = []
    for x in bloecke:
        x = _block16(x)
        b += [x >> 8, x & 0xFF]
    if b[-1] == 1:
        b = b[:-1]
    elif b[-1] == 2 and b[-2] == 2:
        b = b[:-2]
    else:
        raise KryptoFehler('Die Füllbytes fehlen oder sind falsch.')
    return bytes_zu_text(b)


def kryptos16_bitweg(bit, *, variante='kryptos16', runden=None):
    """W3 §9.2 Bit-Verfolgung über Mengen von Koordinaten (z, s) ab 0; Bitnummer = 4z + s + 1."""
    bit = _ganz(bit, 'Bit')
    if not 1 <= bit <= 16:
        raise KryptoFehler('Bitnummern gehen von 1 bis 16.')
    if variante not in ('kryptos16', 'ohneSBox', 'rm16'):
        raise KryptoFehler('Unbekannte Variante.')
    r = _runden((3 if variante == 'rm16' else 4) if runden is None else runden)
    if r > 16:
        raise KryptoFehler('Höchstens 16 Runden.')

    def nummern(felder):
        return sorted({4 * z + sp + 1 for z, sp in felder})

    felder = {divmod(bit - 1, 4)}
    runden_liste, schluesselbits = [], []
    for i in range(1, r + 1):
        # Kᵢ = K um 4(i − 1) Bit nach links: Position p in Kᵢ ist Position p + 4(i − 1) (mod 16) in K
        schluessel = sorted({(4 * z + sp + 4 * (i - 1)) % 16 + 1 for z, sp in felder})
        if variante == 'kryptos16':
            mitte = {(z, spalte) for z, _ in felder for spalte in range(4)}
        elif variante == 'ohneSBox':
            mitte = set(felder)
        else:
            mitte = {(z, (sp - z) % 4) for z, sp in felder}
        danach = {(sp, z) for z, sp in mitte}
        runden_liste.append({'runde': i, 'nach_xor': nummern(felder), 'nach_mitte': nummern(mitte),
                             'nach_transposition': nummern(danach), 'schluessel': schluessel})
        schluesselbits += [k for k in schluessel if k not in schluesselbits]
        felder = danach
    return {'runden': runden_liste, 'ende': nummern(felder), 'schluesselbits': schluesselbits}


def kryptos16_kacheln(raster):
    if not isinstance(raster, list) or not raster or not all(isinstance(z, str) for z in raster):
        raise KryptoFehler('Das Bild ist eine nicht leere Liste von Zeilen.')
    breite, hoehe = len(raster[0]), len(raster)
    if breite == 0 or breite % 4 or hoehe % 4 or any(len(z) != breite for z in raster):
        raise KryptoFehler('Breite und Höhe sind Vielfache von 4.')
    if any(c not in '#.10' for z in raster for c in z):
        raise KryptoFehler('Erlaubt sind nur # . 1 0.')
    bits = [[1 if c in '#1' else 0 for c in z] for z in raster]
    bloecke = []
    for ky in range(hoehe // 4):
        for kx in range(breite // 4):
            kachel = [bits[4 * ky + y][4 * kx + x] for y in range(4) for x in range(4)]
            bloecke.append(_aus_bitliste(kachel))
    return bloecke


def kryptos16_aus_kacheln(bloecke, breite):
    if not isinstance(bloecke, list) or not bloecke:
        raise KryptoFehler('Mindestens ein Block.')
    bl = [_block16(b) for b in bloecke]
    breite = _ganz(breite, 'Breite')
    if breite < 4 or breite % 4:
        raise KryptoFehler('Die Breite ist ein Vielfaches von 4.')
    je_zeile = breite // 4
    if len(bl) % je_zeile:
        raise KryptoFehler('Die Blockzahl passt nicht zur Breite.')
    zeilen = []
    for k in range(0, len(bl), je_zeile):
        reihe = [_bitliste(b) for b in bl[k:k + je_zeile]]
        for y in range(4):
            zeilen.append(''.join('#' if b[4 * y + x] else '.' for b in reihe for x in range(4)))
    return zeilen


# ───────────────────────────── RM-16 (SPEC W3 §6 Abbildung 1) ─────────────────────────────

def _matrix(x):
    b = _bitliste(x)
    return [b[4 * z:4 * z + 4] for z in range(4)]


def _aus_matrix(m):
    return _aus_bitliste([bit for zeile in m for bit in zeile])


def rm16_rundenschluessel(schluessel16, runde):
    """Kᵢ: Zeilen von K um i − 1 Zeilen zyklisch nach oben."""
    m = _matrix(_block16(schluessel16, 'Schlüssel'))
    runde = _ganz(runde, 'Runde')
    if runde < 1:
        raise KryptoFehler('Runden zählen ab 1.')
    v = (runde - 1) % 4
    return _aus_matrix(m[v:] + m[:v])


def _rm16_rotation(m, richtung):
    return [zeile[z:] + zeile[:z] if richtung == 'ver' else zeile[-z:] + zeile[:-z] if z else zeile[:]
            for z, zeile in enumerate(m)]


def _transponiert(m):
    return [[m[z][sp] for z in range(4)] for sp in range(4)]


def _xor_matrix(a, b):
    return [[x ^ y for x, y in zip(za, zb)] for za, zb in zip(a, b)]


def rm16_runde(block16, rundenschluessel, richtung='ver'):
    m = _matrix(_block16(block16))
    k = _matrix(_block16(rundenschluessel, 'Rundenschlüssel'))
    if _richtung(richtung) == 'ver':
        return _aus_matrix(_transponiert(_rm16_rotation(_xor_matrix(m, k), 'ver')))
    return _aus_matrix(_xor_matrix(_rm16_rotation(_transponiert(m), 'ent'), k))


def rm16_verschluesseln(block16, schluessel16, *, runden=3, protokoll=False):
    m = _matrix(_block16(block16))
    k = _block16(schluessel16, 'Schlüssel')
    tabelle = []
    for i in range(1, _runden(runden) + 1):
        ki = _matrix(rm16_rundenschluessel(k, i))
        nach_xor = _xor_matrix(m, ki)
        nach_rot = _rm16_rotation(nach_xor, 'ver')
        nach_t = _transponiert(nach_rot)
        tabelle.append({'runde': i, 'eingang': _aus_matrix(m), 'schluessel': _aus_matrix(ki), 'nach_xor': _aus_matrix(nach_xor),
                        'nach_rotation': _aus_matrix(nach_rot), 'nach_transposition': _aus_matrix(nach_t)})
        m = nach_t
    if protokoll:
        return {'ergebnis': _aus_matrix(m), 'runden': tabelle}
    return _aus_matrix(m)


def rm16_entschluesseln(block16, schluessel16, *, runden=3):
    x = _block16(block16)
    k = _block16(schluessel16, 'Schlüssel')
    for i in range(_runden(runden), 0, -1):
        x = rm16_runde(x, rm16_rundenschluessel(k, i), 'ent')
    return x


# ───────────────────────────── Mini-Enigma (SPEC W3 Kür K2) ─────────────────────────────

_ME = 'ABCDEFGH'
_ME_WALZE = 'DAHBFCGE'
_ME_REFLEKTOR = 'EGHFADBC'
# Stellungstabelle wörtlich aus SPEC W3 Kür K2 (Eingang A … H je Stellung)
MINI_ENIGMA_TABELLE = {'A': 'EHFGACDB', 'B': 'HEDCBGFA', 'C': 'CFAEDBHG', 'D': 'ECBGAHDF',
                       'E': 'BAEFCDHG', 'F': 'EDFBACHG', 'G': 'HEFGBCDA', 'H': 'GDFBHCAE'}


def _me_verdrahtung(walze, reflektor):
    w = _text(walze, 'Walze').upper()
    if not re.fullmatch('[A-H]{8}', w) or len(set(w)) != 8:
        raise KryptoFehler('Die Walze ist eine Anordnung von A–H.')
    r = _text(reflektor, 'Reflektor').upper()
    if not re.fullmatch('[A-H]{8}', r):
        raise KryptoFehler('Der Reflektor ist eine Anordnung von A–H.')
    paare = dict(zip(_ME, r))
    if any(a == b or paare[b] != a for a, b in paare.items()):
        raise KryptoFehler('Der Reflektor muss die Buchstaben paarweise ohne Fixpunkt verbinden.')
    return w, r


def _me_index(x, name):
    b = _text(x, name).upper()
    if len(b) != 1 or b not in _ME:
        raise KryptoFehler(f'{name}: ein Buchstabe A–H.')
    return _ME.index(b)


def _mini_enigma_zeile(s, walze, reflektor):
    """Zeile der Stellungstabelle über die gedrehte Verdrahtung: Walze in Stellung s = W_s(x) = W(x + s) − s,
    Bild = W_s⁻¹(R(W_s(x)))."""
    w = [_ME.index(c) for c in walze]
    gedreht = [(w[(x + s) % 8] - s) % 8 for x in range(8)]
    zurueck = {b: a for a, b in enumerate(gedreht)}
    r = [_ME.index(c) for c in reflektor]
    return ''.join(_ME[zurueck[r[gedreht[x]]]] for x in range(8))


def mini_enigma_tabelle(stellung='A', *, walze=_ME_WALZE, reflektor=_ME_REFLEKTOR):
    w, r = _me_verdrahtung(walze, reflektor)
    s = _me_index(stellung, 'Stellung')
    if (w, r) == (_ME_WALZE, _ME_REFLEKTOR):
        return MINI_ENIGMA_TABELLE[_ME[s]]
    return _mini_enigma_zeile(s, w, r)


def mini_enigma(text, stellung='A', richtung='ver', *, walze=_ME_WALZE, reflektor=_ME_REFLEKTOR):
    _richtung(richtung)
    w, r = _me_verdrahtung(walze, reflektor)
    s = _me_index(stellung, 'Stellung')
    t = nur_buchstaben(text)
    if any(c not in _ME for c in t):
        raise KryptoFehler('Nur die Buchstaben A–H.')
    zeilen = [mini_enigma_tabelle(_ME[k], walze=w, reflektor=r) for k in range(8)]
    return ''.join(zeilen[(s + i) % 8][_ME.index(c)] for i, c in enumerate(t))


def mini_enigma_weg(buchstabe, stellung='A', *, walze=_ME_WALZE, reflektor=_ME_REFLEKTOR):
    w, r = _me_verdrahtung(walze, reflektor)
    x = _me_index(buchstabe, 'Buchstabe')
    s = _me_index(stellung, 'Stellung')
    weg = [(x + s) % 8]
    weg.append(_ME.index(w[weg[-1]]))           # Walze W
    weg.append((weg[-1] - s) % 8)               # − s
    weg.append(_ME.index(r[weg[-1]]))           # Reflektor R
    weg.append((weg[-1] + s) % 8)               # + s
    weg.append(w.index(_ME[weg[-1]]))           # W⁻¹
    weg.append((weg[-1] - s) % 8)               # − s
    stationen = [_ME[i] for i in weg]
    return {'eingang': _ME[x], 'stationen': stationen, 'ausgang': stationen[-1]}


# ───────────────────────────── KRYPTOS-Hash (SPEC W5 §0a) ─────────────────────────────

def kryptos_hash(text, *, protokoll=False):
    h = 0
    schritte = []
    for c in nur_buchstaben(text).lower():
        w = ord(c) - 96
        summe = 3 * h + w
        schritte.append({'buchstabe': c, 'w': w, 'vorher': h, 'summe': summe, 'nachher': summe % 29})
        h = summe % 29
    if protokoll:
        return {'wert': h, 'schritte': schritte}
    return {'wert': h}


def kryptos_hash_kollision_suchen(text, *, max=10000, alphabet='abcdefghijklmnopqrstuvwxyz'):  # noqa: A002
    grenze = _ganz(max, 'max')
    zeichen = list(dict.fromkeys(nur_buchstaben(_text(alphabet, 'Alphabet')).lower()))
    if not zeichen:
        raise KryptoFehler('Das Alphabet darf nicht leer sein.')
    ziel = kryptos_hash(text)['wert']
    selbst = nur_buchstaben(text)
    versuche = 0
    laenge = 1
    while True:
        # alle Wörter der Länge `laenge` in der Reihenfolge des Alphabets (wie ein Zähler)
        stellen = [0] * laenge
        while True:
            kandidat = ''.join(zeichen[i] for i in stellen)
            if kandidat.upper() != selbst:
                if versuche >= grenze:
                    return None
                versuche += 1
                if kryptos_hash(kandidat)['wert'] == ziel:
                    return {'text': kandidat, 'wert': ziel, 'versuche': versuche}
            i = laenge - 1
            while i >= 0 and stellen[i] == len(zeichen) - 1:
                stellen[i] = 0
                i -= 1
            if i < 0:
                break
            stellen[i] += 1
        laenge += 1


def kryptos_hash_ausgleichen(wort, j, neu):
    """W5 §9.1 Kollisionsbaukasten: Beitrag 3ʲ · Δ mod 29; der passende letzte Buchstabe wird durch Probieren aller
    26 Buchstaben gesucht (gleicher KH-Wert), keiner → wort None."""
    w = nur_buchstaben(_text(wort, 'Wort')).lower()
    j = _ganz(j, 'j')
    if not 1 <= j < len(w):
        raise KryptoFehler('j liegt zwischen 1 und Wortlänge − 1.')
    n = nur_buchstaben(_text(neu, 'neuer Buchstabe')).lower()
    if len(n) != 1:
        raise KryptoFehler('Genau ein neuer Buchstabe.')
    i = len(w) - 1 - j
    beitrag = pow(3, j, 29) * ((ord(n) - 96) - (ord(w[i]) - 96)) % 29
    ziel = kryptos_hash(w)['wert']
    vorne = w[:i] + n + w[i + 1:-1]
    for c in 'abcdefghijklmnopqrstuvwxyz':
        if kryptos_hash(vorne + c)['wert'] == ziel:
            return {'beitrag': beitrag, 'wort': vorne + c}
    return {'beitrag': beitrag, 'wort': None}


def pruefsumme(text, art='summe', modul=29):
    """W5 §0a: S(t) = Σ wᵢ mod modul, G(t) = Σ i · wᵢ mod modul (i ab 1)."""
    if art not in ('summe', 'gewichtet'):
        raise KryptoFehler('art ist „summe“ oder „gewichtet“.')
    modul = _ganz(modul, 'Modul')
    if not 2 <= modul <= 1000:
        raise KryptoFehler('Der Modul liegt zwischen 2 und 1000.')
    werte = zahlen(text)
    if art == 'summe':
        return sum(werte) % modul
    return sum(i * w for i, w in enumerate(werte, start=1)) % modul


def sha256(text):
    """Zwilling über hashlib (Plan M6 E68): UTF-8 des unveränderten Texts, 64 Hexziffern GROSS."""
    try:
        daten = _text(text).encode('utf-8')
    except UnicodeEncodeError as fehler:
        raise KryptoFehler('Der Text enthält ein ungültiges Zeichen.') from fehler
    return hashlib.sha256(daten).hexdigest().upper()


def hash_zahl(text, *, verfahren='kh', modul=None):
    """Plan M6 E69: kh → KH-Wert mod modul; sha256 → erste 8 Hexziffern (32 Bit) mod modul."""
    if verfahren not in ('kh', 'sha256'):
        raise KryptoFehler('verfahren ist „kh“ oder „sha256“.')
    if modul is None:
        raise KryptoFehler('Der Modul fehlt.')
    modul = _ganz(modul, 'Modul')
    if not 2 <= modul <= 10 ** 9:
        raise KryptoFehler('Der Modul liegt zwischen 2 und 10⁹.')
    if verfahren == 'kh':
        return kryptos_hash(text)['wert'] % modul
    return int.from_bytes(bytes.fromhex(sha256(text))[:4], 'big') % modul


# ───────────────────────────── Kryptoanalyse ─────────────────────────────

# Beutelspacher, Kryptologie (Springer Spektrum) – SPEC W2 §0.9 / W1, Prozent.
DEUTSCH = {
    'A': 6.51, 'B': 1.89, 'C': 3.06, 'D': 5.08, 'E': 17.40, 'F': 1.66, 'G': 3.01, 'H': 4.76, 'I': 7.55, 'J': 0.27,
    'K': 1.21, 'L': 3.44, 'M': 2.53, 'N': 9.78, 'O': 2.51, 'P': 0.79, 'Q': 0.02, 'R': 7.00, 'S': 7.27, 'T': 6.15,
    'U': 4.35, 'V': 0.67, 'W': 1.89, 'X': 0.03, 'Y': 0.04, 'Z': 1.13,
}


def haeufigkeiten(text):
    h = dict.fromkeys(ALPHABET, 0)
    for c in nur_buchstaben(text):
        h[c] += 1
    return h


def anteile(text):
    h = haeufigkeiten(text)
    n = sum(h.values())
    return {c: (v / n if n else 0) for c, v in h.items()}


def rangfolge(text):
    h = haeufigkeiten(text)
    return sorted((c for c in ALPHABET if h[c]), key=lambda c: (-h[c], c))


def teiltexte(text, k):
    k = _ganz(k, 'k')
    if k < 1:
        raise KryptoFehler('k muss mindestens 1 sein.')
    t = nur_buchstaben(text)
    return [t[j::k] for j in range(k)]


def bigramme(text, *, top=10):
    top = _ganz(top, 'top')
    t = nur_buchstaben(text)
    zaehler = {}
    for i in range(len(t) - 1):
        zaehler[t[i:i + 2]] = zaehler.get(t[i:i + 2], 0) + 1
    liste = sorted(zaehler.items(), key=lambda e: (-e[1], e[0]))
    return [{'bigramm': b, 'anzahl': a} for b, a in liste[:max(top, 0)]]


def koinzidenzindex(text):
    h = haeufigkeiten(text)
    n = sum(h.values())
    if n < 2:
        return None
    return float(Fraction(sum(v * (v - 1) for v in h.values()), n * (n - 1)))


def koinzidenzindex_bruch(text):
    """Zähler Σ nᵢ(nᵢ − 1) und Nenner n(n − 1) des Koinzidenzindex; n < 2 → None."""
    werte = list(haeufigkeiten(text).values())
    n = sum(werte)
    if n < 2:
        return None
    return {'zaehler': sum(v * v - v for v in werte), 'nenner': n * n - n}


def mittlerer_koinzidenzindex(text, k):
    """Mittel (exakt als Bruch gerechnet) der Teiltext-Indizes mit mindestens 2 Zeichen; keiner → None."""
    k = _ganz(k, 'k')
    if not 1 <= k <= 40:
        raise KryptoFehler('k liegt zwischen 1 und 40.')
    brueche = [koinzidenzindex_bruch(t) for t in teiltexte(text, k)]
    brueche = [Fraction(b['zaehler'], b['nenner']) for b in brueche if b is not None]
    if not brueche:
        return None
    return float(sum(brueche) / len(brueche))


def ngramme(text, *, n=2, top=10):
    n = _ganz(n, 'n')
    top = _ganz(top, 'top')
    if not 1 <= n <= 5:
        raise KryptoFehler('n liegt zwischen 1 und 5.')
    if top < 1:
        raise KryptoFehler('top muss mindestens 1 sein.')
    t = nur_buchstaben(text)
    stellen = {}
    for i in range(len(t) - n + 1):
        stellen.setdefault(t[i:i + n], []).append(i)
    reihe = sorted(stellen.items(), key=lambda e: (-len(e[1]), e[0]))[:top]
    return [{'folge': f, 'anzahl': len(p), 'positionen': p} for f, p in reihe]


def teilsubstitution(text, zuordnung, *, unbekannt='·'):
    if not isinstance(zuordnung, dict):
        raise KryptoFehler('Die Zuordnung ist ein Objekt Geheim → Klar.')
    _text(unbekannt, 'unbekannt')
    klar = {}
    for g, k in zuordnung.items():
        g = nur_buchstaben(_text(g, 'Geheimbuchstabe'))
        k = nur_buchstaben(_text(k, 'Klarbuchstabe'))
        if len(g) != 1 or len(k) > 1:
            raise KryptoFehler('Zugeordnet wird genau ein Buchstabe zu höchstens einem Buchstaben.')
        if k:
            if klar.get(g, k) != k:
                raise KryptoFehler('Widersprüchliche Zuordnung.')
            klar[g] = k
    return ''.join(klar[c].lower() if c in klar else unbekannt for c in nur_buchstaben(text))


def _kanonisch(folge):
    """Gleichheitsmuster: jedes Zeichen durch die Nummer seines ersten Auftretens ersetzt (ABA → 0 1 0)."""
    nummer = {}
    return tuple(nummer.setdefault(c, len(nummer)) for c in folge)


def muster_suchen(text, muster):
    m = _text(muster, 'Muster').upper()
    if not re.fullmatch(r'[A-Z]{2,12}', m):
        raise KryptoFehler('Das Muster besteht aus 2 bis 12 Buchstaben.')
    ziel = _kanonisch(m)
    t = nur_buchstaben(text)
    return [i for i in range(len(t) - len(m) + 1) if _kanonisch(t[i:i + len(m)]) == ziel]


def teiler_tabelle(abstaende, *, von=2, bis=20):
    if not isinstance(abstaende, list) or any(isinstance(d, bool) or not _ist_ganz(d) or d < 1 for d in abstaende):
        raise KryptoFehler('Abstände sind ganze Zahlen ab 1.')
    von = _ganz(von, 'von')
    bis = _ganz(bis, 'bis')
    if not 1 <= von <= bis <= 100:
        raise KryptoFehler('Es gilt 1 ≤ von ≤ bis ≤ 100.')
    return {t: sum(1 for d in abstaende if _ganz(d) % t == 0) for t in range(von, bis + 1)}


def primfaktoren(n):
    """Zerlegung durch wiederholtes Abspalten des kleinsten Teilers."""
    n = _ganz(n, 'n')
    if not 1 <= n <= 10 ** 7:
        raise KryptoFehler('n liegt zwischen 1 und 10 000 000.')
    faktoren = []
    while n > 1:
        p = next((d for d in range(2, math.isqrt(n) + 1) if n % d == 0), n)
        faktoren.append(p)
        n //= p
    return faktoren


def friedman_wert(n, i_wert, *, i_d=0.076, i_z=0.038):
    n = _ganz(n, 'n')
    i_wert = _zahl(i_wert, 'I')
    i_d = _zahl(i_d, 'iD')
    i_z = _zahl(i_z, 'iZ')
    if n < 2:
        raise KryptoFehler('n muss mindestens 2 sein.')
    if not 0 <= i_wert <= 1:
        raise KryptoFehler('I liegt zwischen 0 und 1.')
    zaehler = (i_d - i_z) * n
    nenner = (n - 1) * i_wert - i_z * n + i_d
    if nenner == 0:
        return None  # keine Schätzung möglich (wie koinzidenzindex bei n < 2)
    return zaehler / nenner


def friedman(text, *, i_d=0.076, i_z=0.038):
    i_wert = koinzidenzindex(text)
    if i_wert is None:
        return None
    return friedman_wert(len(nur_buchstaben(text)), i_wert, i_d=i_d, i_z=i_z)


def kasiski(text, *, min=3, anzahl=30):  # noqa: A002
    """SPEC W2 §9 Reiter 3: maximale Wiederholungen ab Länge `min` bis n/2, Abstände, Teilertabelle, Vorschlag."""
    mindest = _ganz(min, 'min')
    anzahl = _ganz(anzahl, 'anzahl')
    if not 3 <= mindest <= 6:
        raise KryptoFehler('Die Mindestlänge liegt zwischen 3 und 6.')
    if anzahl < 1:
        raise KryptoFehler('anzahl muss mindestens 1 sein.')
    t = nur_buchstaben(text)
    n = len(t)
    oben = n // 2
    # Positionsgruppen gleicher Folgen der Länge L, Verlängern um ein Zeichen nach dem folgenden Buchstaben (ohne
    # Teilzeichenketten); nur maximale Gruppen werden gespeichert: weder alle Vorkommen nach rechts noch alle nach links
    # mit demselben Zeichen verlängerbar – auch über n/2 hinaus (Review M6: wie krypto.js, Aufwand ohne Faktor L)
    laenge = mindest
    start = {}
    for i in range(n - laenge + 1):
        start.setdefault(t[i:i + laenge], []).append(i)
    ebene = [p for p in start.values() if len(p) >= 2]
    maximal = []  # (laenge, positionen)
    while ebene and laenge <= oben:
        naechste = []
        for p in ebene:
            eimer = {}
            am_ende = False
            for i in p:
                if i + laenge >= n:
                    am_ende = True
                    continue
                eimer.setdefault(t[i + laenge], []).append(i)
            rechts = not am_ende and len(eimer) == 1
            links = p[0] > 0 and all(i > 0 and t[i - 1] == t[p[0] - 1] for i in p)
            if not rechts and not links:
                maximal.append((laenge, p))
            naechste.extend(q for q in eimer.values() if len(q) >= 2)
        ebene = naechste
        laenge += 1

    maximal.sort(key=lambda e: (-e[0], -len(e[1]), e[1][0]))
    maximal = maximal[:anzahl]
    wiederholungen = [{'folge': t[p[0]:p[0] + l_], 'positionen': list(p), 'abstaende': [b - a for a, b in zip(p, p[1:])]}
                      for l_, p in maximal]
    # Abstände ohne Doppelzählung: Paar (a, d) der Länge l ist gedeckt, wenn ein früheres Paar mit demselben d bei
    # q_a <= a beginnt und bis a + l reicht (je d Präfix-Maximum des Endes über den Anfang, Fenwick-Baum wie krypto.js)
    abstaende = []
    baeume = {}

    def hoechstes_ende(d, a):
        b_ = baeume.get(d, {})
        m, i = -1, a + 1
        while i > 0:
            m = max(m, b_.get(i, -1))
            i -= i & -i
        return m

    def eintragen(d, a, ende):
        b_ = baeume.setdefault(d, {})
        i = a + 1
        while i <= n + 1:
            if b_.get(i, -1) < ende:
                b_[i] = ende
            i += i & -i

    for l_, p in maximal:
        for a, b in zip(p, p[1:]):
            if hoechstes_ende(b - a, a) < a + l_:
                abstaende.append(b - a)
                eintragen(b - a, a, a + l_)
    teiler = {t_: sum(1 for d in abstaende if d % t_ == 0) for t_ in range(2, 21)}
    vorschlag = sorted((t_ for t_ in teiler if teiler[t_] > 0), key=lambda t_: (-teiler[t_], -t_))
    return {'wiederholungen': wiederholungen, 'abstaende': abstaende, 'teiler': teiler, 'vorschlag': vorschlag}


def verschiebung_schaetzen(teiltext):
    """SPEC W2 §9 Reiter 6: χ(v) = Σₓ p_D(x) · f_T((x + v) mod 26), größtes χ, Gleichstand kleineres v."""
    f = anteile(teiltext)
    werte = []
    for v in range(26):
        werte.append(sum(DEUTSCH[x] / 100 * f[ALPHABET[(i + v) % 26]] for i, x in enumerate(ALPHABET)))
    # Rangfolge exakt (ganze Zahlen: Prozent · 100 · Anzahl) – Gleichstand → kleineres v, unabhängig von Rundung
    h = haeufigkeiten(teiltext)
    hundertstel = {c: round(p * 100) for c, p in DEUTSCH.items()}
    exakt = [sum(hundertstel[x] * h[ALPHABET[(i + v) % 26]] for i, x in enumerate(ALPHABET)) for v in range(26)]
    reihe = sorted(range(26), key=lambda v: (-exakt[v], v))
    k = reihe[0]
    return {'k': k, 'buchstabe': ALPHABET[k], 'werte': werte,
            'kandidaten': [{'k': v, 'buchstabe': ALPHABET[v], 'wert': werte[v]} for v in reihe[:3]]}


def chi_quadrat(text):
    h = haeufigkeiten(text)
    n = sum(h.values())
    if n == 0:
        return None
    return sum((h[c] - n * DEUTSCH[c] / 100) ** 2 / (n * DEUTSCH[c] / 100) for c in ALPHABET)


# ───────────────────────────── Zahlentheorie, RSA, DH ─────────────────────────────

def ggt(a, b):
    return math.gcd(_ganz(a, 'a'), _ganz(b, 'b'))


def erweiterter_euklid(a, b):
    a = _ganz(a, 'a')
    b = _ganz(b, 'b')
    if a < 0 or b < 0:
        raise KryptoFehler('a und b dürfen nicht negativ sein.')
    zeilen = []
    while b != 0:
        zeilen.append({'a': a, 'b': b, 'q': a // b, 'r': a % b})
        a, b = b, a % b
    zeilen.append({'a': a, 'b': 0, 'q': None, 'r': None, 'x': 1, 'y': 0})
    for i in range(len(zeilen) - 2, -1, -1):  # von unten nach oben einsetzen
        unten = zeilen[i + 1]
        zeilen[i]['x'] = unten['y']
        zeilen[i]['y'] = unten['x'] - zeilen[i]['q'] * unten['y']
    return {'ggt': a, 'x': zeilen[0]['x'], 'y': zeilen[0]['y'],
            'schritte': [{k: z[k] for k in ('a', 'b', 'q', 'r', 'x', 'y')} for z in zeilen]}


def inverses(a, m):
    a = _ganz(a, 'a')
    m = _ganz(m, 'Modul')
    if m < 2:
        raise KryptoFehler('Der Modul muss mindestens 2 sein.')
    if math.gcd(a, m) != 1:
        return None
    return pow(a % m, -1, m)


def modpow(basis, exponent, modul, *, protokoll=False):
    b = _ganz(basis, 'Basis')
    e = _ganz(exponent, 'Exponent')
    m = _ganz(modul, 'Modul')
    if e < 0:
        raise KryptoFehler('Der Exponent darf nicht negativ sein.')
    if m < 1:
        raise KryptoFehler('Der Modul muss positiv sein.')
    b %= m
    erg = 1 % m
    schritte = [{'exponent': e, 'basis': b, 'ergebnis': erg}]
    while e > 0:
        if e % 2:
            erg = erg * b % m
        b = b * b % m
        e //= 2
        schritte.append({'exponent': e, 'basis': b, 'ergebnis': erg})
    if protokoll:
        return {'wert': erg, 'schritte': schritte}
    return erg


def ist_prim(n):
    n = _ganz(n, 'n')
    if n >= 10 ** 7:
        raise KryptoFehler('istPrim prüft nur Zahlen unter 10 000 000.')
    if n < 2:
        return False
    return all(n % t for t in range(2, math.isqrt(n) + 1))


def _phi(m):
    ergebnis, rest, p = m, m, 2
    while p * p <= rest:
        if rest % p == 0:
            while rest % p == 0:
                rest //= p
            ergebnis -= ergebnis // p
        p += 1
    if rest > 1:
        ergebnis -= ergebnis // rest
    return ergebnis


def ordnung(a, m):
    """Kleinster Teiler x von φ(m) mit aˣ ≡ 1 (Satz von Euler/Lagrange) – nicht durch Hochzählen."""
    a = _ganz(a, 'a')
    m = _ganz(m, 'Modul')
    if not 2 <= m <= 10 ** 6:
        raise KryptoFehler('Der Modul liegt zwischen 2 und 10⁶.')
    if math.gcd(a, m) != 1:
        return None
    phi = _phi(m)
    teiler = sorted({d for k in range(1, math.isqrt(phi) + 1) if phi % k == 0 for d in (k, phi // k)})
    return next(x for x in teiler if pow(a, x, m) == 1)


def teile_mit_rest(a, m):
    a = _ganz(a, 'a')
    m = _ganz(m, 'Modul')
    if m <= 0:
        raise KryptoFehler('Der Modul muss positiv sein.')
    q, r = divmod(a, m)  # Python: r ≥ 0 bei m > 0
    return {'q': q, 'r': r}


def probedivision(n):
    """Proben 2 … ⌊√n⌋; Versuche bis zum ersten Teiler t sind t − 1."""
    n = _ganz(n, 'n')
    if not 2 <= n <= 10 ** 7:
        raise KryptoFehler('n liegt zwischen 2 und 10⁷.')
    for t in range(2, math.isqrt(n) + 1):
        if n % t == 0:
            return {'teiler': t, 'versuche': t - 1}
    return {'teiler': None, 'versuche': math.isqrt(n) - 1}


def rsa_schluessel(p, q, e=None):
    p = _ganz(p, 'p')
    q = _ganz(q, 'q')
    if p == q or not ist_prim(p) or not ist_prim(q):
        raise KryptoFehler('p und q müssen verschiedene Primzahlen sein.')
    phi = (p - 1) * (q - 1)
    if e is None:
        e = 3
        while math.gcd(e, phi) != 1:
            e += 1
    else:
        e = _ganz(e, 'e')
        if not 1 < e < phi or math.gcd(e, phi) != 1:
            raise KryptoFehler('e muss zwischen 1 und φ liegen und teilerfremd zu φ sein.')
    return {'N': p * q, 'phi': phi, 'e': e, 'd': pow(e, -1, phi)}


def rsa_e_kandidaten(p, q):
    """Review M6: zulässige öffentliche Exponenten 3 <= e < φ mit ggT(e, φ) = 1 (aufsteigend); p != q prim."""
    p = _ganz(p, 'p')
    q = _ganz(q, 'q')
    if p == q or not ist_prim(p) or not ist_prim(q):
        raise KryptoFehler('p und q müssen verschiedene Primzahlen sein.')
    phi = (p - 1) * (q - 1)
    return [e for e in range(3, phi) if math.gcd(e, phi) == 1]


def _rsa(x, exp, n, name):
    x = _ganz(x, name)
    exp = _ganz(exp, 'Exponent')
    n = _ganz(n, 'N')
    if n < 2 or not 0 <= x < n or exp < 0:
        raise KryptoFehler(f'{name} muss zwischen 0 und N − 1 liegen.')
    return pow(x, exp, n)


def rsa_verschluesseln(m, e, n):
    return _rsa(m, e, n, 'm')


def rsa_entschluesseln(c, d, n):
    return _rsa(c, d, n, 'c')


def rsa_signieren(h, d, n):
    """Plan M6 E69: s = hᵈ mod N, 0 ≤ h < N."""
    return _rsa(h, d, n, 'h')


def rsa_pruefen(s_, e, n):
    return _rsa(s_, e, n, 's')


def _dh_modul(p):
    p = _ganz(p, 'p')
    if p < 2:
        raise KryptoFehler('p muss mindestens 2 sein.')
    return p


def dh_oeffentlich(g, geheim, p):
    return modpow(g, geheim, _dh_modul(p))


def dh_gemeinsam(fremd_oeffentlich, geheim, p):
    return modpow(fremd_oeffentlich, geheim, _dh_modul(p))


def dh_dlog_klein(g, a_oeffentlich, p):
    p = _dh_modul(p)
    g = _ganz(g, 'g')
    ziel = _ganz(a_oeffentlich, 'A') % p
    if p >= 10000:
        raise KryptoFehler('Probieren nur für p < 10 000.')
    wert_ = 1 % p
    for x in range(1, p + 1):
        wert_ = wert_ * g % p
        if wert_ == ziel:
            return x
    return None


def schluesselanzahl(n):
    n = _ganz(n, 'n')
    if n < 2:
        raise KryptoFehler('Mindestens zwei Teilnehmende.')
    return {'symmetrisch': n * (n - 1) // 2, 'asymmetrisch': 2 * n}


# ───────────────────────────── Baukasten (TECHNIK §9.2/§9.3, SPEC W3 Tabelle B) ─────────────────────────────

BAUKASTEN_MAX_STUFEN = 4
BAUKASTEN_STUFEN = [
    {'typ': 'caesar', 'kuerzel': 'CAE', 'name': 'Caesar', 'parameter': {'k': {'art': 'zahl', 'min': 0, 'max': 25}},
     'einordnung': 'mono', 'ausgabe': 'buchstaben', 'nur_zuletzt': False},
    {'typ': 'substitution', 'kuerzel': 'SUB', 'name': 'Substitution',
     'parameter': {'schluesselwort': {'art': 'wort', 'min': 1, 'max': 26}},
     'einordnung': 'mono', 'ausgabe': 'buchstaben', 'nur_zuletzt': False},
    {'typ': 'vigenere', 'kuerzel': 'VIG', 'name': 'Vigenère', 'parameter': {'schluessel': {'art': 'wort', 'min': 1, 'max': 20}},
     'einordnung': 'poly', 'ausgabe': 'buchstaben', 'nur_zuletzt': False},
    {'typ': 'spaltentransposition', 'kuerzel': 'SPA', 'name': 'Spaltentransposition',
     'parameter': {'schluessel': {'art': 'wort', 'min': 2, 'max': 10}},
     'einordnung': 'transposition', 'ausgabe': 'buchstaben', 'nur_zuletzt': False},
    {'typ': 'gartenzaun', 'kuerzel': 'ZAU', 'name': 'Gartenzaun', 'parameter': {'zeilen': {'art': 'zahl', 'min': 2, 'max': 6}},
     'einordnung': 'transposition', 'ausgabe': 'buchstaben', 'nur_zuletzt': False},
    {'typ': 'blockrotation', 'kuerzel': 'ROT', 'name': 'Blockrotation',
     'parameter': {'block': {'art': 'zahl', 'min': 2, 'max': 9}, 'um': {'art': 'zahl', 'min': 1}},
     'einordnung': 'transposition', 'ausgabe': 'buchstaben', 'nur_zuletzt': False},
    {'typ': 'umkehrung', 'kuerzel': 'UMK', 'name': 'Umkehrung', 'parameter': {},
     'einordnung': 'transposition', 'ausgabe': 'buchstaben', 'nur_zuletzt': False},
    {'typ': 'xor', 'kuerzel': 'XOR', 'name': 'XOR', 'parameter': {'schluessel': {'art': 'wort', 'min': 1, 'max': 20}},
     'einordnung': 'poly', 'ausgabe': 'bytes', 'nur_zuletzt': True},
]
_STUFE = {s['typ']: s for s in BAUKASTEN_STUFEN}
_PLATZHALTER = re.compile(r'\$[a-z][a-z0-9]{0,11}')
_NAME = re.compile(r'[A-Za-zÄÖÜäöüß0-9 \-]*')


def _baukasten_statisch(verfahren, schluessel):
    """Statische Prüfung (§9.3 Nr. 1) → (fehler, aufgelöste Stufen [(typ, param)])."""
    fehler = []
    if not isinstance(verfahren, dict):
        return ['Das Verfahren muss ein Objekt sein.'], []
    if schluessel is None:
        schluessel = {}
    if not isinstance(schluessel, dict):
        return ['Der Schlüssel muss ein Objekt sein.'], []
    if verfahren.get('version') != 1 or isinstance(verfahren.get('version'), bool):
        fehler.append('Version 1 erwartet.')
    if 'name' in verfahren and verfahren['name'] is not None:
        name = verfahren['name']
        if not isinstance(name, str) or len(name) > 40 or not _NAME.fullmatch(name):
            fehler.append('Name: höchstens 40 Zeichen, nur Buchstaben, Ziffern, Leerzeichen und Bindestrich.')
    stufen = verfahren.get('stufen')
    if not isinstance(stufen, list) or not 1 <= len(stufen) <= BAUKASTEN_MAX_STUFEN:
        return fehler + [f'1 bis {BAUKASTEN_MAX_STUFEN} Stufen erwartet.'], []
    benutzt = set()
    aufgeloest = []
    for nr, stufe in enumerate(stufen, start=1):
        if not isinstance(stufe, dict) or stufe.get('typ') not in _STUFE:
            fehler.append(f'Stufe {nr}: unbekannter Typ.')
            continue
        typ = stufe['typ']
        katalog = _STUFE[typ]['parameter']
        param = stufe.get('param', {})
        if param is None:
            param = {}
        if not isinstance(param, dict):
            fehler.append(f'Stufe {nr}: Parameter müssen ein Objekt sein.')
            continue
        werte = {}
        for name in param:
            if name not in katalog:
                fehler.append(f'Stufe {nr}: unbekannter Parameter {name}.')
        for name, regel in katalog.items():
            if name not in param:
                fehler.append(f'Stufe {nr}: Parameter {name} fehlt.')
                continue
            w = param[name]
            if isinstance(w, str) and w.startswith('$'):
                if not _PLATZHALTER.fullmatch(w):
                    fehler.append(f'Stufe {nr}: ungültiger Platzhalter {w}.')
                    continue
                if w[1:] not in schluessel:
                    fehler.append(f'Stufe {nr}: Platzhalter {w} fehlt im Schlüssel.')
                    continue
                benutzt.add(w[1:])
                w = schluessel[w[1:]]
            werte[name] = w
        for name, regel in katalog.items():
            if name not in werte:
                continue
            w = werte[name]
            if regel['art'] == 'zahl':
                obergrenze = regel.get('max', (werte.get('block') if _ist_ganz(werte.get('block')) else 0) - 1)
                if not _ist_ganz(w) or not regel['min'] <= _ganz(w) <= obergrenze:
                    fehler.append(f'Stufe {nr}: {name} außerhalb des Bereichs.')
            else:
                if not isinstance(w, str) or not re.fullmatch('[A-Z]{%d,%d}' % (regel['min'], regel['max']), w.upper()):
                    fehler.append(f'Stufe {nr}: {name} muss aus {regel["min"]}–{regel["max"]} Buchstaben A–Z bestehen.')
        if typ == 'xor' and nr != len(stufen):
            fehler.append('XOR darf nur die letzte Stufe sein.')
        aufgeloest.append((typ, werte))
    for name in schluessel:
        if name not in benutzt:
            fehler.append(f'Schlüsselwert {name} wird nicht verwendet.')
    return fehler, aufgeloest


def _stufe_anwenden(typ, p, text, richtung):
    if typ == 'caesar':
        return caesar(text, p['k'], richtung)
    if typ == 'substitution':
        return substitution(text, schluesselwort_alphabet(p['schluesselwort']), richtung)
    if typ == 'vigenere':
        return vigenere(text, p['schluessel'], richtung)
    if typ == 'spaltentransposition':
        return spaltentransposition(text, p['schluessel'], richtung)
    if typ == 'gartenzaun':
        return gartenzaun(text, p['zeilen'], richtung)
    if typ == 'blockrotation':
        return blockrotation(text, p['block'], p['um'], richtung)
    if typ == 'umkehrung':
        return umkehrung(text)
    if typ == 'xor':
        return xor(text, p['schluessel'].upper(), richtung)
    raise KryptoFehler('Unbekannte Stufe.')


def _baukasten_stufen(verfahren, schluessel):
    fehler, stufen = _baukasten_statisch(verfahren, schluessel)
    if fehler:
        raise KryptoFehler('Ungültiges Verfahren: ' + '; '.join(fehler))
    return stufen


def baukasten_verschluesseln(verfahren, schluessel, klartext, *, protokoll=False):
    stufen = _baukasten_stufen(verfahren, schluessel)
    text = nur_buchstaben(klartext)
    zwischen, liste = [], []
    for typ, p in stufen:
        text = _stufe_anwenden(typ, p, text, 'ver')
        zwischen.append(text)
        liste.append({'typ': typ, 'kuerzel': _STUFE[typ]['kuerzel'], 'param': dict(p), 'ergebnis': text})
    ergebnis = {'geheimtext': text, 'zwischen': zwischen}
    if protokoll:
        ergebnis['stufen'] = liste
    return ergebnis


def baukasten_entschluesseln(verfahren, schluessel, geheimtext):
    stufen = _baukasten_stufen(verfahren, schluessel)
    text = _text(geheimtext, 'Geheimtext')
    if stufen[-1][0] != 'xor':
        text = nur_buchstaben(text)
    for typ, p in reversed(stufen):
        text = _stufe_anwenden(typ, p, text, 'ent')
    return text


_TRANSPOSITIONEN = {'spaltentransposition', 'gartenzaun', 'blockrotation', 'umkehrung'}


def baukasten_pruefe(verfahren, schluessel, *, klartext=None):
    fehler, stufen = _baukasten_statisch(verfahren, schluessel)
    hinweise = []
    if fehler:
        return {'ok': False, 'fehler': fehler, 'hinweise': hinweise}
    texte = ['Ebbe und Flut', 'A'] + ([klartext] if isinstance(klartext, str) else [])
    for t in texte:
        try:
            g = baukasten_verschluesseln(verfahren, schluessel, t)['geheimtext']
            if baukasten_entschluesseln(verfahren, schluessel, g) != nur_buchstaben(t):
                fehler.append('Entschlüsseln liefert den Klartext nicht zurück.')
        except KryptoFehler as f:
            fehler.append(str(f))
    n_klar = len(nur_buchstaben(klartext)) if isinstance(klartext, str) else None
    for typ, p in stufen:
        if typ == 'caesar' and _ganz(p['k']) == 0:
            hinweise.append({'p': 'P7', 'text': 'Caesar mit k = 0 verändert nichts.'})
        w = p['schluessel'].upper() if typ == 'vigenere' else ''
        if typ == 'vigenere' and (set(w) == {'A'} or (len(w) > 1 and len(set(w)) == 1)):
            hinweise.append({'p': 'P7', 'text': 'Ein Vigenère-Schlüssel aus lauter gleichen Buchstaben ist nur ein Caesar.'})
        if typ == 'xor' and len(set(p['schluessel'].upper())) == 1:
            hinweise.append({'p': 'P7', 'text': 'Ein XOR-Wort aus nur einem Buchstaben ist leicht zu erraten.'})
        if typ == 'spaltentransposition' and n_klar is not None:
            w = p['schluessel'].upper()
            if list(w) == sorted(w) and len(w) >= n_klar:
                hinweise.append({'p': 'P7', 'text': 'Der Spaltenschlüssel lässt den Text unverändert.'})
    typen = [typ for typ, _ in stufen]
    for a, b in zip(typen, typen[1:]):
        if (a in ('caesar', 'vigenere') and b in ('caesar', 'vigenere')) or (a == b and a in ('substitution', 'umkehrung')):
            hinweise.append({'p': 'P8', 'text': 'Zwei benachbarte Stufen verschmelzen zu einer.'})
    if all(t in _TRANSPOSITIONEN for t in typen):
        hinweise.append({'p': 'P6', 'text': 'Nur Transpositionen: Die Häufigkeitsverteilung bleibt erhalten.'})
    if not any(t in _TRANSPOSITIONEN for t in typen):
        hinweise.append({'p': None, 'text': 'Nur Substitutionen: Wortgrenzen und Reihenfolge bleiben erhalten.'})
    return {'ok': not fehler, 'fehler': fehler, 'hinweise': hinweise}


# ───────────────────────────── Verfahrens-Objekt (AUFGABENFORMAT_KRYPTO §6) ─────────────────────────────

def _p(art, pflicht=False, **weiteres):
    return {'art': art, 'pflicht': pflicht, **weiteres}


VERFAHREN_TYPEN = {
    'caesar': {'parameter': {'k': _p('zahl', True, min=0, max=25)}, 'involutorisch': False, 'art': 'mono'},
    'atbash': {'parameter': {}, 'involutorisch': True, 'art': 'mono'},
    'affin': {'parameter': {'a': _p('zahl', True), 'b': _p('zahl', min=0, max=25), 'basis': _p('wahl', werte=[0, 1])},
              'involutorisch': False, 'art': 'mono'},
    'substitution': {'parameter': {'alphabet': _p('text'), 'schluesselwort': _p('wort'),
                                   'rest': _p('wahl', werte=['alphabetisch', 'ab_letztem'])},
                     'eins_von': ['alphabet', 'schluesselwort'], 'involutorisch': False, 'art': 'mono'},
    'vigenere': {'parameter': {'schluessel': _p('wort', True)}, 'involutorisch': False, 'art': 'poly'},
    'autokey': {'parameter': {'schluessel': _p('wort', True)}, 'involutorisch': False, 'art': 'poly'},
    'porta': {'parameter': {'schluessel': _p('wort', True)}, 'involutorisch': True, 'art': 'poly'},
    'playfair': {'parameter': {'schluessel': _p('wort', True), 'fuellzeichen': _p('zeichen'), 'fuellzeichenX': _p('zeichen'),
                               'ij': _p('wahl', werte=['I', 'J'])}, 'involutorisch': False, 'art': 'bigramm'},
    'kreuzquadrat': {'parameter': {'oben': _p('wort', True), 'unten': _p('wort', True), 'fuellzeichen': _p('zeichen')},
                     'involutorisch': False, 'art': 'bigramm'},
    'zweiquadrat_zahl': {'parameter': {'q1': _p('wort', True), 'q2': _p('wort', True), 'zahlenschluessel': _p('ziffern', True)},
                         'involutorisch': False, 'art': 'bigramm'},
    'polybios': {'parameter': {'schluessel': _p('wort'), 'kopf': _p('text'), 'ij': _p('wahl', werte=['I', 'J'])},
                 'involutorisch': False, 'art': 'mono'},
    'adfgvx': {'parameter': {'quadrat': _p('text', True), 'schluessel': _p('spaltenschluessel', True)},
               'involutorisch': False, 'art': 'kombination'},
    'gartenzaun': {'parameter': {'zeilen': _p('zahl', True, min=2, max=10)}, 'involutorisch': False, 'art': 'transposition'},
    'skytale': {'parameter': {'umfang': _p('zahl', True, min=2, max=20), 'fuellzeichen': _p('zeichen')},
                'involutorisch': False, 'art': 'transposition'},
    'fleissner': {'parameter': {'groesse': _p('wahl', True, werte=[4, 6, 8]), 'schablone': _p('liste', True),
                                'drehung': _p('wahl', werte=['rechts', 'links']), 'fuellzeichen': _p('zeichen')},
                  'involutorisch': False, 'art': 'transposition'},
    'spaltentransposition': {'parameter': {'schluessel': _p('spaltenschluessel', True), 'fuellzeichen': _p('zeichen')},
                             'involutorisch': False, 'art': 'transposition'},
    'umkehrung': {'parameter': {}, 'involutorisch': True, 'art': 'transposition'},
    'blockrotation': {'parameter': {'block': _p('zahl', True, min=2, max=16), 'um': _p('zahl', True, min=1)},
                      'involutorisch': False, 'art': 'transposition'},
    # M8 E123: Eves Ring (W6 §2, Stufe 1), Eves Uhrwerk (Ring, dann Vigenère mit dem Pendel), Mini-Enigma (W3 Kür K2)
    'ring': {'parameter': {'t': _p('zahl', True, min=1, max=11), 'block': _p('zahl', min=4, max=12), 'fuellzeichen': _p('zeichen')},
             'involutorisch': False, 'art': 'transposition'},
    'uhrwerk': {'parameter': {'t': _p('wahl', True, werte=[1, 3, 5, 7]), 'pendel': _p('wort', True)},
                'involutorisch': False, 'art': 'kombination'},
    'mini_enigma': {'parameter': {'stellung': _p('wahl', True, werte=list('ABCDEFGH'))}, 'involutorisch': True, 'art': 'poly'},
    'xor': {'parameter': {'schluessel': _p('text'), 'schluesselBits': _p('bits')}, 'eins_von': ['schluessel', 'schluesselBits'],
            'involutorisch': False, 'art': 'bits'},
    'baukasten': {'parameter': {'verfahren': _p('objekt', True), 'schluessel': _p('objekt', True)},
                  'involutorisch': False, 'art': 'kombination'},
    'frei': {'parameter': {'name': _p('text')}, 'involutorisch': False, 'art': 'frei'},
}


def _wert_pruefen(typ, name, regel, w, v):
    """Fehlertext oder None für einen Parameterwert."""
    art = regel['art']
    if art == 'zahl':
        if not _ist_ganz(w):
            return f'{name} muss eine ganze Zahl sein.'
        oben = regel.get('max', (_ganz(v['block']) - 1) if name == 'um' and _ist_ganz(v.get('block')) else None)
        if w < regel.get('min', w) or (oben is not None and w > oben):
            return f'{name} liegt außerhalb des Bereichs.'
    elif art == 'wahl':
        if w not in regel['werte'] or isinstance(w, bool):
            return f'{name} hat einen unzulässigen Wert.'
    elif art in ('wort', 'text'):
        if not isinstance(w, str):
            return f'{name} muss ein Text sein.'
        if art == 'wort' and regel['pflicht'] and not nur_buchstaben(w):
            return f'{name} muss mindestens einen Buchstaben enthalten.'
    elif art == 'zeichen':
        if not (w is None or (isinstance(w, str) and len(w) == 1 and w.upper() in ALPHABET)):
            return f'{name} muss ein Buchstabe sein.'
    elif art == 'ziffern':
        try:
            _zahlenschluessel(w)
        except KryptoFehler as f:
            return str(f)
    elif art == 'spaltenschluessel':
        try:
            spalten_reihenfolge(w)
        except KryptoFehler as f:
            return str(f)
    elif art == 'liste':
        if not isinstance(w, list):
            return f'{name} muss eine Liste sein.'
    elif art == 'bits':
        try:
            b = _nur_bits(_text(w, name))
        except KryptoFehler as f:
            return str(f)
        if not b or len(b) % 8:
            return f'{name}: ganze Bytes (Vielfaches von 8 Bit) erwartet.'
    elif art == 'objekt':
        if not isinstance(w, dict):
            return f'{name} muss ein Objekt sein.'
    return None


def verfahren_pruefe(v):
    if not isinstance(v, dict) or v.get('typ') not in VERFAHREN_TYPEN:
        return {'ok': False, 'fehler': ['Unbekanntes Verfahren.']}
    typ = v['typ']
    eintrag = VERFAHREN_TYPEN[typ]
    fehler = []
    for name in v:
        if name != 'typ' and name not in eintrag['parameter']:
            fehler.append(f'Unbekannter Parameter {name}.')
    for name, regel in eintrag['parameter'].items():
        if name not in v:
            if regel['pflicht']:
                fehler.append(f'Parameter {name} fehlt.')
            continue
        meldung = _wert_pruefen(typ, name, regel, v[name], v)
        if meldung:
            fehler.append(meldung)
    if 'eins_von' in eintrag and sum(1 for n in eintrag['eins_von'] if n in v) != 1:
        fehler.append('Genau einer der Parameter ' + ' / '.join(eintrag['eins_von']) + ' wird gebraucht.')
    if fehler:
        return {'ok': False, 'fehler': fehler}
    # fachliche Prüfung der Werte
    if typ == 'affin' and math.gcd(_ganz(v['a']), 26) != 1:
        fehler.append('a muss teilerfremd zu 26 sein.')
    if typ == 'substitution' and 'alphabet' in v:
        try:
            _geheimalphabet(v['alphabet'])
        except KryptoFehler as f:
            fehler.append(str(f))
    if typ in ('vigenere', 'autokey', 'porta') and not nur_buchstaben(v['schluessel']):
        fehler.append('Der Schlüssel enthält keinen Buchstaben.')
    if typ == 'adfgvx':
        q = v['quadrat']
        if not isinstance(q, str) or len(q) != 36 or set(q.upper()) != set(ALPHABET + ZIFFERN):
            fehler.append('Das ADFGVX-Quadrat besteht aus 36 verschiedenen Zeichen A–Z, 0–9.')
    if typ == 'fleissner':
        r = schablone_pruefen(v['groesse'], v['schablone'])
        fehler.extend(r['fehler'])
    if typ == 'xor' and 'schluessel' in v:
        try:
            if not text_zu_bytes(v['schluessel']):
                fehler.append('Der Schlüssel darf nicht leer sein.')
        except KryptoFehler as f:
            fehler.append(str(f))
    if typ == 'baukasten':
        fehler.extend(_baukasten_statisch(v['verfahren'], v['schluessel'])[0])
    if typ == 'polybios' and 'kopf' in v:
        k = v['kopf']
        if len(k) not in (5, 6) or len(set(k)) != len(k):
            fehler.append('Der Kopf besteht aus 5 oder 6 verschiedenen Zeichen.')
    if typ in ('playfair',) and not fehler:
        try:
            playfair_paare('', fuellzeichen=v.get('fuellzeichen', 'X'), fuellzeichen_x=v.get('fuellzeichenX', 'Q'),
                           ij=v.get('ij', 'I'))
        except KryptoFehler as f:
            fehler.append(str(f))
    if typ == 'ring':
        n = v.get('block', 8)
        if v['t'] >= n or math.gcd(v['t'], n) != 1:
            fehler.append('t muss kleiner als der Block und teilerfremd zu ihm sein.')
        if 'fuellzeichen' in v and v['fuellzeichen'] is None:
            fehler.append('Das Füllzeichen muss ein Buchstabe sein.')
    if typ == 'kreuzquadrat' and v.get('fuellzeichen') is not None:
        if v['fuellzeichen'].upper() == 'J':
            fehler.append('Das Füllzeichen muss ein Buchstabe des Quadrats sein.')
    return {'ok': not fehler, 'fehler': fehler}


_UHRWERK_BLOCK = 8


def _uhrwerk_aufgefuellt(text):
    """Klartext des Uhrwerks wie im Ring auf ganze Blöcke mit X aufgefüllt (W6 §2)."""
    s = nur_buchstaben(text)
    return s + 'X' * (-len(s) % _UHRWERK_BLOCK)


def _uhrwerk_vigenere(s, pendel, richtung, zyklisch=False):
    """Vigenère mit dem Pendel bzw. (Diagnose P4) mit dem Wort zyklisch; leerer Text bleibt leer."""
    if not s:
        return ''
    return vigenere(s, pendel if zyklisch else pendel_folge(pendel, len(s)), richtung)


def uhrwerk(text, t, pendel, richtung='ver'):
    """Eves Uhrwerk (W6 §2): ver = Ring t, dann Vigenère mit dem Pendel; ent umgekehrt (Länge Vielfaches von 8)."""
    _richtung(richtung)
    if richtung == 'ver':
        return _uhrwerk_vigenere(ring(text, t, 'ver'), pendel, 'ver')
    s = nur_buchstaben(text)
    if len(s) % _UHRWERK_BLOCK:
        raise KryptoFehler('Die Länge des Geheimtextes muss ein Vielfaches von 8 sein.')
    return ring(_uhrwerk_vigenere(s, pendel, 'ent'), t, 'ent')


def _anwenden_text(v, text, richtung):
    typ = v['typ']
    if typ == 'caesar':
        return caesar(text, v['k'], richtung)
    if typ == 'atbash':
        return atbash(text)
    if typ == 'affin':
        return affin(text, v['a'], v.get('b', 0), richtung, v.get('basis', 0))
    if typ == 'substitution':
        g = v['alphabet'] if 'alphabet' in v else schluesselwort_alphabet(v['schluesselwort'],
                                                                          rest=v.get('rest', 'alphabetisch'))
        return substitution(text, g, richtung)
    if typ == 'vigenere':
        return vigenere(text, v['schluessel'], richtung)
    if typ == 'autokey':
        return autokey(text, v['schluessel'], richtung)
    if typ == 'porta':
        return porta(text, v['schluessel'], richtung)
    if typ == 'playfair':
        return playfair(text, v['schluessel'], richtung, fuellzeichen=v.get('fuellzeichen', 'X'),
                        fuellzeichen_x=v.get('fuellzeichenX', 'Q'), ij=v.get('ij', 'I'))
    if typ == 'kreuzquadrat':
        return kreuzquadrat(text, v['oben'], v['unten'], richtung, fuellzeichen=v.get('fuellzeichen', 'X'))
    if typ == 'zweiquadrat_zahl':
        return zwei_quadrat_zahl(text, v['q1'], v['q2'], v['zahlenschluessel'], richtung)
    if typ == 'polybios':
        return polybios(text, richtung, schluessel=v.get('schluessel', ''), kopf=v.get('kopf', '12345'), ij=v.get('ij', 'I'))
    if typ == 'adfgvx':
        return adfgvx(text, v['quadrat'], v['schluessel'], richtung)
    if typ == 'gartenzaun':
        return gartenzaun(text, v['zeilen'], richtung)
    if typ == 'skytale':
        return skytale(text, v['umfang'], richtung, fuellzeichen=v.get('fuellzeichen', 'X'))
    if typ == 'fleissner':
        return fleissner(text, v['groesse'], v['schablone'], richtung, drehung=v.get('drehung', 'rechts'),
                         fuellzeichen=v.get('fuellzeichen', 'X'))
    if typ == 'spaltentransposition':
        return spaltentransposition(text, v['schluessel'], richtung, fuellzeichen=v.get('fuellzeichen'))
    if typ == 'umkehrung':
        return umkehrung(text)
    if typ == 'blockrotation':
        return blockrotation(text, v['block'], v['um'], richtung)
    if typ == 'ring':
        return ring(text, v['t'], richtung, block=v.get('block', 8), fuellzeichen=v.get('fuellzeichen', 'X'))
    if typ == 'uhrwerk':
        return uhrwerk(text, v['t'], v['pendel'], richtung)
    if typ == 'mini_enigma':
        return mini_enigma(text, v['stellung'], richtung)
    if typ == 'xor':
        if 'schluessel' in v:
            k = v['schluessel']
        else:
            b = _nur_bits(v['schluesselBits'])
            k = [int(b[i:i + 8], 2) for i in range(0, len(b), 8)]
        return xor(text, k, richtung)
    if typ == 'baukasten':
        if richtung == 'ver':
            return baukasten_verschluesseln(v['verfahren'], v['schluessel'], text)['geheimtext']
        return baukasten_entschluesseln(v['verfahren'], v['schluessel'], text)
    raise KryptoFehler('Fremde Chiffren (frei) werden nicht berechnet.')


def _ausgabe(ergebnis, basis, ausgabe):
    if ausgabe == 'buchstaben':
        return ergebnis
    if any(c not in ALPHABET for c in ergebnis):
        raise KryptoFehler('Zahlenausgabe nur für Buchstabenergebnisse.')
    return [ALPHABET.index(c) + basis for c in ergebnis]


def _anwenden_optionen(richtung, basis, ausgabe):
    _richtung(richtung)
    if basis not in (0, 1) or isinstance(basis, bool):
        raise KryptoFehler('Die Basis muss 0 oder 1 sein.')
    if ausgabe not in ('buchstaben', 'zahlen'):
        raise KryptoFehler('ausgabe muss „buchstaben“ oder „zahlen“ sein.')


def verfahren_anwenden(v, text, richtung, *, basis=1, ausgabe='buchstaben'):
    _anwenden_optionen(richtung, basis, ausgabe)
    pruefung = verfahren_pruefe(v)
    if not pruefung['ok']:
        raise KryptoFehler('Ungültiges Verfahren: ' + '; '.join(pruefung['fehler']))
    if v['typ'] == 'frei':
        raise KryptoFehler('Fremde Chiffren (frei) werden nicht berechnet.')
    return _ausgabe(_anwenden_text(v, normalisieren(text), richtung), basis, ausgabe)


def verfahren_varianten(v, text, richtung, *, basis=1, ausgabe='buchstaben'):
    """Delta §9.2 / TECHNIK §5.2: Kandidaten typischer Fehlrechnungen, Reihenfolge P3, P1, P2, P4."""
    try:
        richtig = verfahren_anwenden(v, text, richtung, basis=basis, ausgabe=ausgabe)
    except KryptoFehler:
        return []  # ungültiges Verfahren (auch frei): keine Diagnose
    t = normalisieren(text)
    typ = v['typ']
    gegen = 'ent' if richtung == 'ver' else 'ver'
    kandidaten = []

    def dazu(p, code, rechnung):
        try:
            erg = rechnung()
        except KryptoFehler:
            return
        if isinstance(erg, str) and ausgabe == 'zahlen' and p != 'P2':
            try:
                erg = _ausgabe(erg, basis, ausgabe)
            except KryptoFehler:
                return
        if erg != richtig and all(erg != k['text'] for k in kandidaten):
            kandidaten.append({'p': p, 'code': code, 'text': erg})

    perm = VERFAHREN_TYPEN[typ]['art'] == 'transposition'
    mehrstufig_ent = richtung == 'ent' and typ in ('baukasten', 'adfgvx')
    if typ == 'uhrwerk':
        # M8 E123: Stufen vertauscht (P3 reihenfolge), Ring in der Gegenrichtung (P3 permutation); P4 pendel unten
        if richtung == 'ver':
            s = _uhrwerk_aufgefuellt(t)
            dazu('P3', 'reihenfolge', lambda: ring(_uhrwerk_vigenere(s, v['pendel'], 'ver'), v['t'], 'ver'))
            dazu('P3', 'permutation', lambda: _uhrwerk_vigenere(ring(s, v['t'], 'ent'), v['pendel'], 'ver'))
        else:
            s = nur_buchstaben(t)
            dazu('P3', 'reihenfolge', lambda: _uhrwerk_vigenere(ring(s, v['t'], 'ent'), v['pendel'], 'ent'))
            dazu('P3', 'permutation', lambda: ring(_uhrwerk_vigenere(s, v['pendel'], 'ent'), v['t'], 'ver'))
    elif not VERFAHREN_TYPEN[typ]['involutorisch'] and typ != 'baukasten' and not mehrstufig_ent:
        def gegenrichtung():
            try:
                return _anwenden_text(v, t, gegen)
            except KryptoFehler:
                if typ != 'skytale':
                    raise
                # Skytale mit Füllzeichen: falsche Länge fürs Entschlüsseln → Raster ohne Füllzeichen
                return _anwenden_text(dict(v, fuellzeichen=None), t, gegen)
        dazu('P3', 'permutation' if perm else 'richtung', gegenrichtung)
    if typ == 'fleissner':
        andere = dict(v, drehung='links' if v.get('drehung', 'rechts') == 'rechts' else 'rechts')
        dazu('P3', 'permutation', lambda: _anwenden_text(andere, t, richtung))
    if richtung == 'ent' and typ == 'baukasten':
        def falsche_reihenfolge():
            stufen = _baukasten_stufen(v['verfahren'], v['schluessel'])
            x = t if stufen[-1][0] == 'xor' else nur_buchstaben(t)
            for st_typ, p in stufen:
                x = _stufe_anwenden(st_typ, p, x, 'ent')
            return x
        dazu('P3', 'reihenfolge', falsche_reihenfolge)
    if richtung == 'ent' and typ == 'adfgvx':
        q = ''.join(quadrat(v['quadrat'], groesse=6))
        dazu('P3', 'reihenfolge',
             lambda: spaltentransposition(polybios(t, 'ent', schluessel=q, kopf='ADFGVX'), v['schluessel'], 'ent'))
    if richtung == 'ent' and typ == 'affin':
        # t nach statt vor der Multiplikation abgezogen: p' = m^-1 * c - t (SPEC W1 §8)
        bas, b = v.get('basis', 0), v.get('b', 0)
        dazu('P3', 'reihenfolge',
             lambda: ''.join(buchstabe(inverses(v['a'], 26) * wert(c, bas) - b, bas) for c in nur_buchstaben(t)))
    if typ == 'caesar':
        for dk in (1, -1):
            dazu('P1', 'zaehlbasis', lambda dk=dk: caesar(t, v['k'] + dk, richtung))
    if typ in ('vigenere', 'autokey', 'porta'):
        plus1 = caesar(v['schluessel'], 1)
        dazu('P1', 'zaehlbasis', lambda: _anwenden_text(dict(v, schluessel=plus1), t, richtung))
    if typ == 'affin':
        dazu('P1', 'zaehlbasis', lambda: affin(t, v['a'], v.get('b', 0), richtung, 1 - v.get('basis', 0)))
    if typ == 'vigenere':
        s = nur_buchstaben(v['schluessel'])
        dazu('P1', 'position', lambda: vigenere(t, s[1:] + s[:1], richtung))
    if ausgabe == 'zahlen' and basis == 1 and typ in ('caesar', 'vigenere'):
        if typ == 'caesar':
            schritte = [v['k']] * len(nur_buchstaben(t))
        else:
            s = nur_buchstaben(v['schluessel'])
            schritte = [ALPHABET.index(s[i % len(s)]) for i in range(len(nur_buchstaben(t)))]
        vz = 1 if richtung == 'ver' else -1
        roh = [ALPHABET.index(c) + 1 + vz * k for c, k in zip(nur_buchstaben(t), schritte)]
        dazu('P2', 'null_statt_z', lambda: [0 if x == 26 else x for x in richtig])
        if richtung == 'ver':
            dazu('P2', 'ueberlauf', lambda: roh)
        else:
            dazu('P2', 'negativ', lambda: roh)
    if typ == 'playfair' and richtung == 'ver':
        def ohne_trennen():
            u = _ij_text(t, v.get('ij', 'I'))
            if len(u) % 2:
                u += _quadratbuchstabe(v.get('fuellzeichen', 'X'), quadrat('', ij=v.get('ij', 'I')))
            q = quadrat(v['schluessel'], ij=v.get('ij', 'I'))
            pos = _koordinaten(q)
            aus = []
            for i in range(0, len(u), 2):
                (za, sa), (zb, sb) = pos[u[i]], pos[u[i + 1]]
                if za == zb:
                    aus.append(q[za][(sa + 1) % 5] + q[zb][(sb + 1) % 5])
                elif sa == sb:
                    aus.append(q[(za + 1) % 5][sa] + q[(zb + 1) % 5][sb])
                else:
                    aus.append(q[za][sb] + q[zb][sa])
            return ''.join(aus)
        dazu('P4', 'paare', ohne_trennen)
    if typ == 'uhrwerk':
        # P4 pendel: Vigenère mit dem Pendelwort zyklisch statt mit dem Pendel
        if richtung == 'ver':
            dazu('P4', 'pendel', lambda: _uhrwerk_vigenere(ring(t, v['t'], 'ver'), v['pendel'], 'ver', True))
        else:
            dazu('P4', 'pendel', lambda: ring(_uhrwerk_vigenere(nur_buchstaben(t), v['pendel'], 'ent', True), v['t'], 'ent'))
    if typ == 'skytale':
        anders = None if v.get('fuellzeichen', 'X') is not None else 'X'
        dazu('P4', 'fuellung', lambda: skytale(t, v['umfang'], richtung, fuellzeichen=anders))
    if typ == 'spaltentransposition':
        anders = None if v.get('fuellzeichen') is not None else 'X'
        dazu('P4', 'fuellung', lambda: spaltentransposition(t, v['schluessel'], richtung, fuellzeichen=anders))
    if typ == 'spaltentransposition' and richtung == 'ent':
        # Plan M8 Task 192: alle Spalten gleich lang (⌈n/c⌉) angenommen – nur bei kurzer letzter Zeile
        def gleich_lang():
            u = nur_buchstaben(t)
            rang = spalten_reihenfolge(v['schluessel'])
            zeilen = -(-len(u) // len(rang))
            spalten = [u[(r - 1) * zeilen:r * zeilen] for r in rang]
            return ''.join(sp[z] for z in range(zeilen) for sp in spalten if z < len(sp))
        dazu('P4', 'spaltenlaengen', gleich_lang)
    if typ == 'polybios':
        # Plan M8 Task 192: Zeile und Spalte vertauscht
        def tausche(paare):
            u = ''.join(str(paare).split()).upper()
            return ''.join(u[i + 1] + u[i] for i in range(0, len(u) - 1, 2))
        if richtung == 'ver':
            dazu('P4', 'zeile_spalte', lambda: tausche(richtig))
        else:
            dazu('P4', 'zeile_spalte', lambda: _anwenden_text(v, tausche(text), 'ent'))
    return kandidaten
