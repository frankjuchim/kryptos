"""Spec-Vektoren der fremden Verfahren W0–W6 (Plan M5 Task 70, E43; Plan M8 Task 170, E133). Nur Standardbibliothek.

Aufruf: python3 -I werkzeuge/krypto/test_fremde_verfahren.py
"""
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fremde_verfahren import VERFAHREN as V, multiplikationsrad, produkt_hash_13, spiegelbote, spiegelpaar, telex_rot  # noqa: E402


class FremdeVerfahren(unittest.TestCase):
    def test_spiegelbote(self):                       # W0 §5 Material und B-11/B-12
        self.assertEqual(spiegelbote('rom siegt', 1), 'TNPSUHFJ')
        self.assertEqual(V['spiegelbote_k2']('wir kommen'), 'MTKYGOOQZZZP')
        self.assertEqual(V['spiegelbote_k3']('LKFVE HIIQQ HUAAQ H', 'ent'), 'SCHIFFEBRENNENXX')

    def test_spiegelkurier(self):                     # W1-B-11/-12, Involution
        self.assertEqual(V['spiegelkurier_t4']('basar'), 'DEMEN')
        self.assertEqual(V['spiegelkurier_t9']('GBWJS', 'ent'), 'DINAR')
        self.assertEqual(V['spiegelkurier_t4']('DEMEN', 'ent'), 'BASAR')

    def test_nomenklator(self):                        # W1 §2 Beispiel, L3-01, L3-02, L3-03, L3-06
        n = V['nomenklator_850']
        self.assertEqual(n('die karawane erreicht basra am morgen'), '5862HOOHDSBQ90TJ74')
        self.assertEqual(n('der wesir bringt gold und seide'), '3918UODKAQ271653')
        self.assertEqual(n('3947H OWTOQ HQ005 862DK 35', 'ent'), 'DERKALIFERWARTETDIEKARAWANEINBAGDAD')
        self.assertEqual(n('39001 8EIDH BQKTS B90', 'ent'), 'DERWESIRFLIEHTNACHBASRA')
        self.assertEqual(n('5862D PQDK0 03981 RHUHO ETIIH KWLOC HK', 'ent'), 'DIEKARAWANEISTINDERNACHTUEBERFALLENWORDEN')

    def test_nomenklator_unbekannter_code(self):
        with self.assertRaises(ValueError):
            V['nomenklator_850']('3947 12', 'ent')     # 12 steht nicht im Codebuch

    def test_homophon(self):                           # W1-L2-06
        self.assertEqual(V['homophon_kalif']('seide'), '5642151377')
        self.assertEqual(V['homophon_kalif']('5642151377', 'ent'), 'SEIDE')
        with self.assertRaises(ValueError):
            V['homophon_kalif']('karte')                # k steht nicht im Tabellen-Ausschnitt

    def test_depesche(self):                           # W2-B-11
        self.assertEqual(V['depesche_rose']('gefahramkanal'), 'XSXEZGTRDQHGF')
        self.assertEqual(V['depesche_rose']('XSXEZ GTRDQ HGF', 'ent'), 'GEFAHRAMKANAL')

    def test_telex_rot(self):                          # W3 §5, W3-B-10
        self.assertEqual(V['telex_rot_k43']('TOR'), '000101111100100101011111')
        self.assertEqual(V['telex_rot_k43']('0001 0111 1100 1001 0101 1111', 'ent'), 'TOR')
        self.assertEqual(telex_rot('TOR', '01000011'), '000101111100100101011111')
        # Schlüsselbyte nach 8 Zeichen wieder gleich (W3-B-11: Periode 8)
        self.assertEqual(telex_rot('A' * 9, '01000011')[:8], telex_rot('A' * 9, '01000011')[64:72])
        with self.assertRaises(ValueError):
            telex_rot('TOR', '0100')

    def test_multiplikationsrad(self):                 # W6-B-09
        self.assertEqual(V['multiplikationsrad']('GCPK', 'ent'), 'KANU')
        self.assertEqual(V['multiplikationsrad']('kanu'), 'GCPK')
        self.assertEqual(multiplikationsrad('z'), 'Z')       # 26 · 3 = 78 ≡ 0 → 26 (Rest 0 → Z, P2)

    def test_spiegelpaar(self):                        # W6-B-10
        self.assertEqual(V['spiegelpaar']('MTOJXQ', 'ent'), 'PINSEL')
        self.assertEqual(spiegelpaar('pinsel'), 'MTOJXQ')

    def test_produkt_hash_13(self):                    # W5-B-07/-08, W5 §12
        self.assertEqual([produkt_hash_13(w) for w in ('rabe', 'kai', 'bear', 'mut', 'zoo')], [11, 8, 11, 0, 0])

    def test_richtung(self):
        for name in ('depesche_rose', 'spiegelbote_k2', 'spiegelkurier_t4', 'nomenklator_850', 'homophon_kalif',
                     'telex_rot_k43', 'multiplikationsrad', 'spiegelpaar'):
            with self.assertRaises(ValueError, msg=name):
                V[name]('abc', 'quer')


if __name__ == '__main__':
    unittest.main()
