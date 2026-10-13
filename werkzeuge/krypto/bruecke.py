"""Brücke JS ↔ Python-Zwilling (TECHNIK §5.3).

Liest JSON-Zeilen {"f": "<JS-Name>", "args": [...]} von stdin und schreibt je Zeile
{"ok": true, "r": …} bzw. {"ok": false, "art": "KryptoFehler" | "intern", "fehler": "…"} nach stdout.
JS-Namen (auch mit Punkt, z. B. "kryptos16.verschluesseln") werden über ZUORDNUNG auf krypto.py abgebildet;
Optionsobjekte der JS-API werden zu Schlüsselwort-Argumenten (camelCase → snake_case), Rückgabe-Schlüssel
wieder zu camelCase. Aufruf: python3 -I werkzeuge/krypto/bruecke.py
"""
import json
import math
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import krypto as K  # noqa: E402

# JS-Name → (Python-Funktion, Index des Optionsobjekts in der JS-Argumentliste oder None)
ZUORDNUNG = {
    'mod': (K.mod, None), 'wert': (K.wert, None), 'buchstabe': (K.buchstabe, None),
    'verschiebung': (K.verschiebung, None), 'normalisieren': (K.normalisieren, 1),
    'nurBuchstaben': (K.nur_buchstaben, None), 'normBits': (K.norm_bits, None), 'gruppieren': (K.gruppieren, None),
    'klein': (K.klein, None), 'zahlen': (K.zahlen, None), 'ausZahlen': (K.aus_zahlen, None),
    'caesar': (K.caesar, None), 'alleCaesar': (K.alle_caesar, None), 'atbash': (K.atbash, None),
    'affin': (K.affin, None), 'affinSchluesselGueltig': (K.affin_schluessel_gueltig, None),
    'schluesselwortAlphabet': (K.schluesselwort_alphabet, 1), 'substitution': (K.substitution, None),
    'umkehrAlphabet': (K.umkehr_alphabet, None), 'vigenere': (K.vigenere, None), 'autokey': (K.autokey, None),
    'porta': (K.porta, None), 'quadrat': (K.quadrat, 1), 'playfairPaare': (K.playfair_paare, 1),
    'playfair': (K.playfair, 3), 'kreuzquadrat': (K.kreuzquadrat, 4), 'zweiQuadratZahl': (K.zwei_quadrat_zahl, None),
    'polybios': (K.polybios, 1), 'adfgvx': (K.adfgvx, None), 'gartenzaun': (K.gartenzaun, None),
    'skytale': (K.skytale, 3), 'fleissner': (K.fleissner, 4), 'schablonePruefen': (K.schablone_pruefen, None),
    'spaltenReihenfolge': (K.spalten_reihenfolge, None), 'spaltentransposition': (K.spaltentransposition, 3),
    'umkehrung': (K.umkehrung, None), 'blockrotation': (K.blockrotation, None),
    'ascii': (K.ascii_wert, None), 'zeichenAusAscii': (K.zeichen_aus_ascii, None),
    'textZuBytes': (K.text_zu_bytes, None), 'bytesZuText': (K.bytes_zu_text, None),
    'byteZuBits': (K.byte_zu_bits, None), 'bitsZuByte': (K.bits_zu_byte, None), 'textZuBits': (K.text_zu_bits, 1),
    'bitsZuText': (K.bits_zu_text, None), 'xorBits': (K.xor_bits, None), 'undBits': (K.und_bits, None),
    'oderBits': (K.oder_bits, None), 'xor': (K.xor, None), 'hex': (K.hex_text, None), 'vonHex': (K.von_hex, None),
    'rotiereBits': (K.rotiere_bits, None),
    # M6 (Plan Task 105–108)
    'skytaleRaster': (K.skytale_raster, 2), 'gartenzaunSchienen': (K.gartenzaun_schienen, None),
    'fleissnerStellungen': (K.fleissner_stellungen, 2), 'fleissnerDrehgruppen': (K.fleissner_drehgruppen, None),
    'ringFolge': (K.ring_folge, None), 'ring': (K.ring, 3), 'pendelFolge': (K.pendel_folge, None),
    'schluesselstrom': (K.schluesselstrom, 2),
    'ngramme': (K.ngramme, 1), 'teilsubstitution': (K.teilsubstitution, 2), 'musterSuchen': (K.muster_suchen, None),
    'teilerTabelle': (K.teiler_tabelle, 1), 'primfaktoren': (K.primfaktoren, None),
    'mittlererKoinzidenzindex': (K.mittlerer_koinzidenzindex, None),
    'koinzidenzindexBruch': (K.koinzidenzindex_bruch, None),
    'kryptos16.bitweg': (K.kryptos16_bitweg, 1), 'kryptos16.kacheln': (K.kryptos16_kacheln, None),
    'kryptos16.ausKacheln': (K.kryptos16_aus_kacheln, None),
    'rm16.rundenschluessel': (K.rm16_rundenschluessel, None), 'rm16.runde': (K.rm16_runde, None),
    'rm16.verschluesseln': (K.rm16_verschluesseln, 2), 'rm16.entschluesseln': (K.rm16_entschluesseln, 2),
    'miniEnigma': (K.mini_enigma, 3), 'miniEnigma.tabelle': (K.mini_enigma_tabelle, 1),
    'miniEnigma.weg': (K.mini_enigma_weg, 2),
    'kryptos16.rundenschluessel': (K.kryptos16_rundenschluessel, None), 'kryptos16.sbox': (K.kryptos16_sbox, None),
    'kryptos16.transponiere': (K.kryptos16_transponiere, None), 'kryptos16.runde': (K.kryptos16_runde, 3),
    'kryptos16.verschluesseln': (K.kryptos16_verschluesseln, 2),
    'kryptos16.entschluesseln': (K.kryptos16_entschluesseln, 2), 'kryptos16.lawine': (K.kryptos16_lawine, 3),
    'kryptos16.modus': (K.kryptos16_modus, 4), 'kryptos16.textZuBloecken': (K.kryptos16_text_zu_bloecken, None),
    'kryptos16.bloeckeZuText': (K.kryptos16_bloecke_zu_text, None),
    'kryptosHash': (K.kryptos_hash, 1), 'kryptosHash.kollisionSuchen': (K.kryptos_hash_kollision_suchen, 1),
    'haeufigkeiten': (K.haeufigkeiten, None), 'anteile': (K.anteile, None), 'rangfolge': (K.rangfolge, None),
    'teiltexte': (K.teiltexte, None), 'bigramme': (K.bigramme, 1), 'koinzidenzindex': (K.koinzidenzindex, None),
    'friedman': (K.friedman, 1), 'friedmanWert': (K.friedman_wert, 2), 'kasiski': (K.kasiski, 1),
    'verschiebungSchaetzen': (K.verschiebung_schaetzen, None), 'chiQuadrat': (K.chi_quadrat, None),
    'ggT': (K.ggt, None), 'erweiterterEuklid': (K.erweiterter_euklid, None), 'inverses': (K.inverses, None),
    'modpow': (K.modpow, 3), 'istPrim': (K.ist_prim, None),
    'rsa.schluessel': (K.rsa_schluessel, None), 'rsa.verschluesseln': (K.rsa_verschluesseln, None),
    'rsa.entschluesseln': (K.rsa_entschluesseln, None),
    'dh.oeffentlich': (K.dh_oeffentlich, None), 'dh.gemeinsam': (K.dh_gemeinsam, None),
    'dh.dlogKlein': (K.dh_dlog_klein, None), 'schluesselanzahl': (K.schluesselanzahl, None),
    'verfahren.pruefe': (K.verfahren_pruefe, None), 'verfahren.anwenden': (K.verfahren_anwenden, 3),
    'verfahren.varianten': (K.verfahren_varianten, 3),
    'baukasten.pruefe': (K.baukasten_pruefe, 2), 'baukasten.verschluesseln': (K.baukasten_verschluesseln, 3),
    'baukasten.entschluesseln': (K.baukasten_entschluesseln, None),
}


def snake(name):
    return re.sub(r'([A-Z])', lambda m: '_' + m.group(1).lower(), name)


def camel(name):
    if not isinstance(name, str):
        return name
    return re.sub(r'_([a-z])', lambda m: m.group(1).upper(), name)


def nach_js(x):
    """Rückgabe in JSON-Form wie JSON.stringify in JS (camelCase-Schlüssel, ±∞/NaN → null)."""
    if isinstance(x, dict):
        return {camel(k): nach_js(v) for k, v in x.items()}
    if isinstance(x, (list, tuple)):
        return [nach_js(v) for v in x]
    if isinstance(x, float) and not math.isfinite(x):
        return None
    return x


def aufrufen(f, args):
    if f not in ZUORDNUNG:
        raise LookupError(f'unbekannte Funktion {f}')
    funktion, opt_index = ZUORDNUNG[f]
    args = list(args)
    kwargs = {}
    if opt_index is not None and opt_index < len(args):
        optionen = args.pop(opt_index)
        if optionen is not None:
            if not isinstance(optionen, dict):
                raise K.KryptoFehler('Optionen müssen ein Objekt sein.')
            kwargs = {snake(k): v for k, v in optionen.items()}
    return funktion(*args, **kwargs)


def main():
    for zeile in sys.stdin:
        if not zeile.strip():
            continue
        try:
            auftrag = json.loads(zeile)
            antwort = {'ok': True, 'r': nach_js(aufrufen(auftrag['f'], auftrag.get('args', [])))}
        except K.KryptoFehler as fehler:
            antwort = {'ok': False, 'art': 'KryptoFehler', 'fehler': str(fehler)}
        except Exception as fehler:  # noqa: BLE001 – jeder andere Fehler ist ein Fehler des Zwillings
            antwort = {'ok': False, 'art': 'intern', 'fehler': f'{type(fehler).__name__}: {fehler}'}
        sys.stdout.write(json.dumps(antwort, ensure_ascii=False, allow_nan=False) + '\n')
        sys.stdout.flush()


if __name__ == '__main__':
    main()
