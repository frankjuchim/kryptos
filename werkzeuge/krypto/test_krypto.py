"""Feste Vektoren für den Python-Zwilling (dieselben Werte wie test/krypto.test.js; Quellen stehen dort im Testnamen).

Aufruf: python3 -I werkzeuge/krypto/test_krypto.py
Nicht übernommen (nur Laufzeit, in JS geprüft): exakter Lawinen-Mittelwert über 65 536 × 16 Blöcke und die
Vollständigkeits-Zählung (§0a.8); die Bijektivität über alle 65 536 Blöcke ist enthalten.
"""
import os
import random
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import krypto as K  # noqa: E402

F = K.KryptoFehler


def ohne(s):
    return ''.join(s.split())


def gross(s):
    return ohne(s).upper()


def b2(s):
    return int(ohne(s), 2)


def blk(x):
    b = K.byte_zu_bits(x, 16)
    return ' '.join(b[i:i + 4] for i in range(0, 16, 4))


def b8(s):
    return [K.bits_zu_byte(x) for x in s.split('·')]


def bits8(bytes_):
    return ''.join(K.byte_zu_bits(b) for b in bytes_)


EVES_BRIEF = """ZIGNS HEGYW WUUCW JEFPY ARTLA YHVKW JHCMW JAOHT ANFKW NGGZS
JDVLT NIPNL ZIGIJ EEHLV ARFPH HOOHL ENFPW XRKLX AEPAZ WLVLF
ZIGUS IEPKW NVGYT QEPKW PEPPF CEPBS HEUAV EEDYA AFGLJ OTUWS
ATKUV ARPHU DTWUV RETIJ ANPAV EEDYA AFGKS JAEOV EEIHD AETLK
AGGSL WMOVJ CEPDW ETGYF WCJNW JUC"""
GOLD_TEXT = ('JSCGU UPHSD QDKBR WJWPJ KGLQJ HPQGA DRTBE DMRTH MSDDT REHTP CLTUP QKRWH MSDFN SYNKO FVMSY XGRTH CONKK '
             'OXWUF OHYDL OGGEH YYPQT HOLKU PVGBO WKBYL IVEXT RWDKG DWJWP JKGLQ JHPQT ONKJS CPKGD HNSCH OB')
WETTKNACKEN = """DHCPQ NRUMV UDNCU DODIA PBRPR PMAUD OUIRD UBUGU CMOUI OPBQI
RIPYC ONDUQ UAUMN UOZUI RDUNY CMDSO UIRUM BMDUY CUIQI RKUMN
UMDIR DUPMP ADNYC UNKMP YCUQI RNPHH UGIRP NVDNN UIRUM BPIZU
IVUGO UDIUN PAUIR NSDIR UOUDI EQIBU MNYCM UDAUM UDIUI AMDUS
RUIID UHPIR GUNUI FPIIE URUMA QYCNO PAUDN ORQMY CUDIU IPIRU
MUIUM NUOZO RUMNY CMUDA UMUMD IIUMO NDYCP IRDUG UCMUR UNKCD
GJNJK CUIPG FDIRD HPIZP UCGOV DUJSO EURUN ZUDYC UITJM FJHHO
DIEUR UMNKM PYCUB DAOUN AQYCN OPAUI RDUNU CMCPU QSDBN DIRQI
RPIRU MURDU NUGOU IUMNY CUDIU IVUMB UIQBO UWOCP OSDIR UONJN
YCMDO OSQUM NYCMD OORUI BPIZU INYCG QUNNU G"""
FUNKGITTER = {'version': 1, 'name': 'Funkgitter', 'stufen': [
    {'typ': 'vigenere', 'param': {'schluessel': '$wort'}}, {'typ': 'spaltentransposition', 'param': {'schluessel': '$wort'}}]}
S1 = [[1, 3], [2, 2], [3, 1], [4, 4]]
S2 = [[1, 2], [2, 1], [2, 3], [4, 4]]


class Grundlagen(unittest.TestCase):
    def test_buchstabe_rest_null_ist_z(self):
        self.assertEqual([K.buchstabe(26, 1), K.buchstabe(0, 1), K.buchstabe(27, 1), K.buchstabe(26)], ['Z', 'Z', 'A', 'Z'])
        self.assertEqual([K.buchstabe(0, 0), K.buchstabe(26, 0), K.buchstabe(-1, 1)], ['A', 'A', 'Y'])

    def test_mod(self):
        self.assertEqual([K.mod(-6, 26), K.mod(26, 26), K.mod(15, 12), K.mod(27, 26), K.mod(-26, 26)], [20, 0, 3, 1, 0])
        self.assertRaises(F, K.mod, 3, 0)
        self.assertRaises(F, K.mod, 1.5, 26)

    def test_wert_verschiebung(self):
        self.assertEqual([K.wert('A'), K.wert('z'), K.wert('A', 0), K.wert('Z', 0)], [1, 26, 0, 25])
        self.assertRaises(F, K.wert, 'AB')
        self.assertRaises(F, K.wert, '1')
        self.assertEqual([K.verschiebung('A'), K.verschiebung('L'), K.verschiebung('z')], [0, 11, 25])

    def test_normalisieren(self):
        self.assertEqual(K.nur_buchstaben('Grüße, Bob!'), 'GRUESSEBOB')
        tabelle = {'Treffpunkt am Hafen!': 'TREFFPUNKTAMHAFEN', 'bohvs vjnnp': 'BOHVSVJNNP', 'Grüße aus Köln': 'GRUESSEAUSKOELN',
                   'Café – 12 Uhr': 'CAFE12UHR', 'A-D-F-G-V-X': 'ADFGVX', 'ÄÖÜẞ äöüß': 'AEOEUESSAEOEUESS',
                   'Ça, Ñandú, Élan': 'CANANDUELAN', 'Grüße': 'GRUESSE', 'Zeile 1\nZeile\t2': 'ZEILE1ZEILE2', '': ''}
        for t, n in tabelle.items():
            self.assertEqual(K.normalisieren(t), n, t)
        self.assertEqual(K.normalisieren('Café – 12 Uhr', ziffern=False), 'CAFEUHR')
        self.assertEqual(K.nur_buchstaben('1234 !?'), '')
        self.assertRaises(F, K.normalisieren, None)
        self.assertRaises(F, K.nur_buchstaben, 42)

    def test_norm_bits_gruppieren_zahlen(self):
        self.assertEqual(K.norm_bits('0100 0001'), '01000001')
        self.assertEqual(K.norm_bits(' 01_00|00.01\n'), '01000001')
        self.assertEqual(K.norm_bits('0102'), '0102')
        self.assertEqual(K.gruppieren('ABCDEFGHIJKL'), 'ABCDE FGHIJ KL')
        self.assertEqual(K.gruppieren('ABCDE FGHIJ KL'), 'ABCDE FGHIJ KL')
        self.assertEqual(K.gruppieren('ABCDEF', 2, '·'), 'AB·CD·EF')
        self.assertEqual(K.gruppieren('', 5), '')
        self.assertRaises(F, K.gruppieren, 'ABC', 0)
        self.assertEqual(K.klein('GEHEIMBOTSCHAFT'), 'geheimbotschaft')
        self.assertEqual(K.zahlen('Abz'), [1, 2, 26])
        self.assertEqual(K.zahlen('ABZ', 0), [0, 1, 25])
        self.assertEqual([K.aus_zahlen([1, 2, 26]), K.aus_zahlen([0, 27, 52]), K.aus_zahlen([0, 1, 25], 0)], ['ABZ', 'ZAZ', 'ABZ'])
        self.assertRaises(F, K.aus_zahlen, [1.5])


class Monoalphabetisch(unittest.TestCase):
    def test_caesar(self):
        self.assertEqual(K.caesar('treffpunktambrunnen', 6), 'ZXKLLVATQZGSHXATTKT')
        self.assertEqual(K.caesar('RPSPTXMZEDNSLQE', 11, 'ent'), 'GEHEIMBOTSCHAFT')
        self.assertEqual(K.caesar(K.ALPHABET, 6), 'GHIJKLMNOPQRSTUVWXYZABCDEF')
        self.assertEqual([K.caesar('ture', 6), K.caesar('RPSPT', 11), K.caesar('RPSPTXMZEDNSLQE', 15), K.caesar('a', 6, 'ent')],
                         ['ZAXK', 'CADAE', 'GEHEIMBOTSCHAFT', 'U'])

    def test_caesar_grenzfaelle(self):
        self.assertEqual([K.caesar('ABC', 0), K.caesar('ABC', 26), K.caesar('ABC', -1), K.caesar('ABC', 25), K.caesar('', 5)],
                         ['ABC', 'ABC', 'ZAB', 'ZAB', ''])
        self.assertEqual(K.caesar('Grüße!', 1), 'HSVFTTF')
        self.assertRaises(F, K.caesar, 'ABC', 1.5)
        self.assertRaises(F, K.caesar, 'ABC', '3')
        self.assertRaises(F, K.caesar, 'ABC', 3, 'rueck')

    def test_caesar_spec_w0(self):
        self.assertEqual(K.caesar('rueckzug ins lager', 3), gross('UXHFN CXJLQ VODJH U'))
        self.assertEqual(K.caesar('die legion zieht nach norden', 7), gross('KPLSL NPVUG PLOAU HJOUV YKLU'))
        self.assertEqual(K.caesar('GSBLB KEMRO XWORB GKCCO B', 10, 'ent'), 'WIRBRAUCHENMEHRWASSER')
        self.assertEqual(K.caesar('bote', 25), 'ANSD')
        for p, k, c in [('W', 3, 'Z'), ('X', 5, 'C'), ('Z', 1, 'A'), ('T', 6, 'Z'), ('Y', 1, 'Z'), ('H', 25, 'G'), ('N', 12, 'Z'),
                        ('S', 7, 'Z'), ('V', 4, 'Z')]:
            self.assertEqual(K.caesar(p, k), c)
            self.assertEqual(K.buchstabe(K.wert(p) + k), c)
        self.assertEqual(''.join(K.caesar(c, k) for c, k in zip('TYHN', [6, 1, 25, 12])), 'ZZGZ')
        self.assertEqual(''.join(K.caesar(c, k) for c, k in zip('SVH', [7, 4, 25])), 'ZZG')
        self.assertEqual(K.caesar('LXGTM MTZMA XNMX', 19, 'ent'), 'SENATTAGTHEUTE')
        self.assertEqual(K.caesar('LXGTM', 1, 'ent'), 'KWFSL')
        self.assertEqual(K.alle_caesar('LXGTM MTZMA XNMX')[19]['text'], 'SENATTAGTHEUTE')
        self.assertEqual(K.alle_caesar('BLIZV INRIK VKRDK FI')[17]['text'], 'KURIERWARTETAMTOR')
        self.assertEqual(K.caesar('galliaestomnisdivisa', 11), 'RLWWTLPDEZXYTDOTGTDL')
        self.assertEqual(K.mod(K.wert('F') - K.wert('R'), 26), 14)
        self.assertEqual(K.caesar('castra', 9), 'LJBCAJ')
        self.assertEqual([K.caesar('hilfe', 9), K.caesar(K.caesar('hilfe', 9), 20), K.caesar('hilfe', 3)], ['QRUON', 'KLOIH', 'KLOIH'])
        self.assertEqual(K.caesar(K.caesar('feldzug', 15), 11), 'FELDZUG')
        self.assertEqual(K.caesar(K.caesar('tribun', 8), 18), 'TRIBUN')
        self.assertEqual([K.caesar('ave', 4), K.caesar('IMOTQ', 12, 'ent'), K.caesar('quiz', 9)], ['EZI', 'WACHE', 'ZDRI'])
        self.assertEqual([K.caesar('legat', 6), K.caesar('PYLLU NCGMY HUN', 20, 'ent')], ['RKMGZ', 'VERRATIMSENAT'])
        self.assertEqual([K.caesar('hof', 4), K.caesar('nil', 20)], ['LSJ', 'HCF'])
        self.assertEqual(K.alle_caesar('ZUDBZ DRZQ')[25]['text'], 'AVECAESAR')
        self.assertEqual([K.caesar('YMDE', 12, 'ent'), K.caesar('rom', 3), K.caesar('KDIHQ', 3, 'ent'), K.buchstabe(29)],
                         ['MARS', 'URP', 'HAFEN', 'C'])

    def test_alle_caesar_atbash(self):
        liste = K.alle_caesar('GTVAMPTVAX')
        self.assertEqual(len(liste), 26)
        self.assertEqual(liste[19], {'k': 19, 'text': 'NACHTWACHE'})
        self.assertEqual(liste[0], {'k': 0, 'text': 'GTVAMPTVAX'})
        self.assertEqual([z['text'] for z in K.alle_caesar('')], [''] * 26)
        self.assertEqual([K.atbash('caesar'), K.atbash('legion'), K.atbash('mauer'), K.atbash('mond'), K.atbash('')],
                         ['XZVHZI', 'OVTRLM', 'NZFVI', 'NLMW', ''])
        self.assertEqual(K.atbash(K.ALPHABET), K.ALPHABET[::-1])

    def test_affin(self):
        for a in (2, 13, 0, 1.5):
            self.assertRaises(F, K.affin, 'A', a, 0)
        self.assertRaises(F, K.affin, 'A', 5, 0.5)
        self.assertEqual([x for x in [4, 5, 13, 17, 22, 25] if K.affin_schluessel_gueltig(x)], [5, 17, 25])
        self.assertEqual(sum(1 for m in range(26) if K.affin_schluessel_gueltig(m)) * 26, 312)
        self.assertEqual([K.affin_schluessel_gueltig(x) for x in (13, 2, 0, 1.5, 27, -1)], [False, False, False, False, True, True])
        self.assertEqual(K.affin('dattel', 5, 6), 'VGXXAJ')
        self.assertEqual(K.affin('VGXXAJ', 5, 6, 'ent'), 'DATTEL')
        self.assertEqual(K.affin('A', 7), 'A')
        self.assertEqual([K.affin('sultan', 7, 3), K.affin('harun', 5, 0), K.affin('minarett', 11, 4)], ['ZNCGDQ', 'JAHWN', 'GOREJWFF'])
        self.assertEqual([K.affin('RWEZWI', 9, 2, 'ent'), K.affin('CPQN', 21, 7, 'ent'), K.affin('LVTNI', 11, 3, 'ent')],
                         ['TIGRIS', 'BOTE', 'WESIR'])
        self.assertEqual(K.affin('sklave', 5, 8), 'UGLIJC')
        self.assertEqual([K.affin('en', 3, 10), K.affin('en', 11, 6), K.affin('en', 7, 11)], ['WX', 'YT', 'NY'])
        self.assertEqual(K.affin(K.affin('karawane', 3, 5), 7, 2), 'NLELFLYR')
        self.assertEqual(K.affin('karawane', 21, 11), 'NLELFLYR')
        self.assertEqual([K.affin('basar', 25, 4), K.affin('dinar', -1, 9), K.affin('GBWJS', 25, 9)], ['DEMEN', 'GBWJS', 'DINAR'])
        erwartet = ''.join(K.buchstabe(5 * K.wert(c, 1) + 6, 1) for c in 'DATTEL')
        self.assertEqual(K.affin('dattel', 5, 6, 'ver', 1), erwartet)
        self.assertEqual(K.affin(erwartet, 5, 6, 'ent', 1), 'DATTEL')
        self.assertRaises(F, K.affin, 'A', 5, 6, 'ver', 2)

    def test_schluesselwort_alphabet(self):
        self.assertEqual(K.schluesselwort_alphabet('SCHERAZADE'), 'SCHERAZDBFGIJKLMNOPQTUVWXY')
        tafel = {'KALIF': 'KALIFBCDEGHJMNOPQRSTUVWXYZ', 'ZEDER': 'ZEDRABCFGHIJKLMNOPQSTUVWXY', 'PAPYRUS': 'PAYRUSBCDEFGHIJKLMNOQTVWXZ',
                 'SULTAN': 'SULTANBCDEFGHIJKMOPQRVWXYZ', 'YASMIN': 'YASMINBCDEFGHJKLOPQRTUVWXZ', 'WUESTENWIND': 'WUESTNIDABCFGHJKLMOPQRVXYZ',
                 'TUSCHE': 'TUSCHEABDFGIJKLMNOPQRVWXYZ', 'ZIFFER': 'ZIFERABCDGHJKLMNOPQSTUVWXY'}
        for w, a in tafel.items():
            self.assertEqual(K.schluesselwort_alphabet(w), a)
        soll = {'KALIF': 14, 'SCHERAZADE': 0, 'ZEDER': 0, 'PAPYRUS': 1, 'SULTAN': 5, 'YASMIN': 1, 'WUESTENWIND': 3, 'TUSCHE': 5, 'ZIFFER': 0}
        for w, n in soll.items():
            self.assertEqual(sum(1 for c, d in zip(K.schluesselwort_alphabet(w), K.ALPHABET) if c == d), n, w)
        self.assertEqual(K.schluesselwort_alphabet('OASE')[:8], 'OASEBCDF')
        self.assertEqual(K.schluesselwort_alphabet('kalif'), tafel['KALIF'])
        self.assertEqual(K.schluesselwort_alphabet('KALIF', rest='ab_letztem'), 'KALIFGHJMNOPQRSTUVWXYZBCDE')
        self.assertEqual([K.schluesselwort_alphabet(''), K.schluesselwort_alphabet('AAAA')], [K.ALPHABET, K.ALPHABET])
        self.assertEqual(K.schluesselwort_alphabet('Zwölf'), 'ZWOELFABCDGHIJKMNPQRSTUVXY')
        self.assertRaises(F, K.schluesselwort_alphabet, 'KALIF', rest='rueckwaerts')

    def test_substitution(self):
        S = K.schluesselwort_alphabet
        self.assertEqual(K.substitution('der kalif schlaeft', S('KALIF')), gross('IFRHK JEBSL DJKFB T'))
        self.assertEqual(K.substitution('mond', S('KALIF')), 'MONI')
        self.assertEqual(K.substitution('tausend und eine nacht', S('SCHERAZADE')), gross('QSTPR KETKE RBKRK SHDQ'))
        self.assertEqual(K.substitution('VRPBO', S('SCHERAZADE'), 'ent'), 'WESIR')
        self.assertEqual(K.substitution('harun', S('SULTAN')), 'CSORI')
        self.assertEqual(K.substitution('RDBPDQ', S('YASMIN'), 'ent'), 'TIGRIS')
        self.assertEqual(K.substitution('kurier', S('WUESTENWIND')), 'CQMATM')
        self.assertEqual(K.substitution('ZPUCG URDUZ UDYCU IQIRR QSDIR UNORU INYCG QUNNU G', S('PAPYRUS'), 'ent'),
                         gross('zaehlediezeichenunddufindestdenschluessel'))
        c7 = 'TDAPQ AOIAP QACAI CAGGR AUAOT AOPQS TQRIT TDAWS LCABA CQDCO AORIT A'
        k7 = 'diesternestehenhellueberderstadtunddiewachegehtihrerunde'
        self.assertEqual(K.substitution(c7, S('SULTAN'), 'ent'), gross(k7))
        self.assertEqual(K.substitution(k7, S('SULTAN')), gross(c7))
        T = S('TUSCHE')
        self.assertEqual(K.substitution('liegt', T), 'IDHAQ')
        self.assertEqual(K.substitution('PSBDSGQ', T, 'ent') + K.substitution('KTSB', T, 'ent'), 'SCHICKTNACH')
        self.assertEqual([K.substitution(x, T, 'ent') for x in ('OHDQHQ', 'JDQ', 'HOWTOQHQ', 'DK', 'EIDHBQKTSB')],
                         ['REITET', 'MIT', 'ERWARTET', 'IN', 'FLIEHTNACH'])

    def test_substitution_grenzfaelle(self):
        kalif = K.schluesselwort_alphabet('KALIF')
        inv = K.umkehr_alphabet(kalif)
        self.assertEqual(K.substitution(K.substitution('wesir', kalif), inv), 'WESIR')
        self.assertEqual(K.umkehr_alphabet(inv), kalif)
        self.assertEqual(K.umkehr_alphabet(K.ALPHABET), K.ALPHABET)
        self.assertEqual(K.substitution('', kalif), '')
        self.assertEqual(K.substitution('abc', kalif.lower()), 'KAL')
        self.assertRaises(F, K.substitution, 'abc', 'ABC')
        self.assertRaises(F, K.substitution, 'abc', 'A' * 26)
        self.assertRaises(F, K.umkehr_alphabet, 'ABCDEFGHIJKLMNOPQRSTUVWXYY')


class Polyalphabetisch(unittest.TestCase):
    def test_vigenere(self):
        self.assertEqual(K.vigenere('kanal', 'ROT'), 'BOGRZ')
        self.assertEqual(K.vigenere('HEDKZRMAGP', 'VELA', 'ent'), 'MASKENBALL')
        for p, s, c in [('r', 'K', 'B'), ('w', 'H', 'D'), ('z', 'B', 'A'), ('t', 'M', 'F'), ('m', 'D', 'P'), ('s', 'N', 'F')]:
            self.assertEqual(K.vigenere(p, s), c)
        af = 'derratvonvenedigliestunserebriefebenutzeabjetztnurnochdasquadrat'
        af_c = 'OEXLN XGOTP RRPDO AYMPS ZOAWP RKVEM PFKVR RFTFY NFUEZ TGRFR TIPLO AYKHE ORGN'
        self.assertEqual(K.vigenere(af, 'LAGUNE'), gross(af_c))
        self.assertEqual(K.vigenere(af_c, 'LAGUNE', 'ent'), gross(af))
        faelle = [('markusplatz', 'DAME', 'PADOX SBPDT L'), ('anna', 'BBC', 'BOPB'), ('gondel', 'BOTE', 'HCGHFZ'),
                  ('seidenhandel', 'ROSA', 'JSADV BZAER WL'), ('kanalsperre', 'NEBEL', 'XEOEW FTFVC R'),
                  ('kanalwache', 'RIVA', 'BIIAC EVCYM'), ('venedig', 'DDDD', 'YHQHG LJ'), ('hafenwache', 'ABAB', 'HBFFN XADHF'),
                  ('hafenwache', 'AB', 'HBFFN XADHF'), ('hafenmauer', 'TOR', 'AOWXB DTIVK'), ('dogenpalast', 'MURANO', 'PIXEADMFRSG'),
                  ('die', 'CHS', 'FPW'), ('seidenstoffeundglasperlen', 'CEEDDF', 'UIMGH SUXSI IJWRH JOFUT IUOJP'),
                  ('gefahramkanal', 'ROSE', 'XSXEYFSQBOFEC'), ('bote', 'LUNA', 'MIGE'), ('ebbe', 'BBCC', 'FCDG'),
                  ('die', 'KRY', 'NZC'), ('Wetterbericht fuer die Nordsee', 'FUNKE', 'BYGDIWVRBMHBGPYJLQSISIENWJY'),
                  ('morgenrot', 'LUNA', 'XIEGPHEOE'), ('morgenrot', 'QZSF', 'CNJLUMJTJ'), ('n', 'F', 'S')]
        for p, s, c in faelle:
            self.assertEqual(K.vigenere(p, s), gross(c), (p, s))
        self.assertEqual(K.vigenere('JSADV BZAER WL', 'ROSA', 'ent'), 'SEIDENHANDEL')
        self.assertEqual(K.vigenere('WYISX MRZWN VWHGD FFIIS XH', 'TURM', 'ent'), gross('dergesandtekommtmorgen'))
        self.assertEqual(K.vigenere('AOWXB DTIVK', 'hafenmauer', 'ent'), 'TORTORTORT')
        self.assertEqual(K.vigenere('PAXEADMFRSG', 'MURANO', 'ent'), 'DGGENPALAST')
        self.assertEqual(K.vigenere('VCVIZ TSWLE UKXMY', 'EIS', 'ent'), 'RUDERBOOTAMSTEG')
        self.assertEqual(K.vigenere(K.vigenere('seidenstoffeundglasperlen', 'AB'), 'CDE'), 'UIMGHSUXSIIJWRHJOFUTIUOJP')
        self.assertEqual(''.join(K.vigenere('e', s) for s in 'KRYPTOS'), 'OVCTXSW')
        self.assertEqual(K.caesar(K.vigenere('morgenrot', 'LUNA'), 5), 'CNJLUMJTJ')

    def test_vigenere_lange_texte(self):
        klar = ('diegaleereausvenedigerreichtdenhafenamabenddergesandtebringtdiebriefederdiplomatindiebriefeenthaltendienamen'
                'derverbuendeteningenualestdiebriefeerstspaetindernachtundverbrenntdiebriefedanachdiegaleeresegeltammorgenweiternachgenua')
        self.assertEqual(len(K.nur_buchstaben(EVES_BRIEF)), 228)
        self.assertEqual(K.vigenere(EVES_BRIEF, 'WACHS', 'ent'), gross(klar))
        self.assertEqual(K.vigenere(klar, 'WACHS'), gross(EVES_BRIEF))
        self.assertEqual(len(K.nur_buchstaben(GOLD_TEXT)), 162)
        d7 = K.vigenere(GOLD_TEXT, 'GOLD', 'ent')
        self.assertEqual(d7[:16], 'DERDOGEEMPFAENGT')
        self.assertEqual(K.vigenere(d7, 'GOLD'), gross(GOLD_TEXT))
        tt = 'WBXDN KBXKX PTKMX GTGWX KUKNX VDXGX UXGWX FYBLV AFTKD MTNYW XGTUX GW'
        self.assertEqual(K.caesar(tt, 19, 'ent'), gross('diekurierewartenanderbrueckenebendemfischmarktaufdenabend'))
        self.assertEqual(K.vigenere(tt, 'T', 'ent'), K.caesar(tt, 19, 'ent'))

    def test_vigenere_grenzfaelle(self):
        self.assertEqual([K.vigenere('abc', 'A'), K.vigenere('abc', 'AAAA'), K.vigenere('', 'KEY'), K.vigenere('a b-c!', 'b'),
                          K.vigenere('aaa', 'Ä')], ['ABC', 'ABC', '', 'BCD', 'AEA'])
        for args in (('abc', ''), ('abc', '123'), ('abc', 'KEY', 'zurueck'), ('abc', None)):
            self.assertRaises(F, K.vigenere, *args)

    def test_autokey(self):
        self.assertEqual(K.autokey('ALVEHRA', 'ZU', 'ent'), 'BRUNNEN')
        self.assertEqual(K.autokey('brunnen', 'ZU'), 'ALVEHRA')
        self.assertEqual(K.autokey('palazzo', 'RIO'), gross('GIZPZ KO'))
        self.assertEqual(K.autokey('dogenpalast', 'MURANO'), gross('PIXEA DDZGW G'))
        self.assertEqual(K.autokey('galeerenimhafen', 'ZUG'), gross('FURKE CIRZQ UIRLN'))
        self.assertEqual(K.autokey('PAXEADDZGWG', 'MURANO', 'ent'), 'DGGENPATAST')
        self.assertEqual([K.autokey('', 'ZU'), K.autokey('abc', 'AAAA')], ['', 'ABC'])
        self.assertRaises(F, K.autokey, 'abc', '')
        self.assertRaises(F, K.autokey, '', 'ZU', 'quer')

    def test_porta(self):
        self.assertEqual(K.porta('BKPWEZP', 'SIEGEL'), 'STEMPEL')
        self.assertEqual(K.porta('nachtwache', 'LUNA'), 'FQWULGUPPU')
        self.assertEqual(K.porta('serenissima', 'PORTA'), 'MXMVAOMAZZT')
        self.assertEqual(K.porta('FQWULGUPPU', 'LUNA'), 'NACHTWACHE')
        self.assertEqual(K.porta('stempel', 'SIEGEL'), gross('BKPWE ZP'))
        self.assertEqual([K.porta('a', 'A'), K.porta('a', 'C')], ['N', 'Z'])
        self.assertEqual(K.porta('hafen', 'A'), K.porta('hafen', 'B'))
        self.assertEqual(K.porta('FQWULGUPPU', 'LUNA', 'ent'), 'NACHTWACHE')
        self.assertRaises(F, K.porta, 'abc', 'KEY', 'quer')
        self.assertRaises(F, K.porta, 'abc', '')
        self.assertEqual(K.porta('', 'LUNA'), '')
        for s in K.ALPHABET:
            for p in K.ALPHABET:
                c = K.porta(p, s)
                self.assertNotEqual(c, p)
                self.assertEqual(K.porta(c, s), p)


class Quadrate(unittest.TestCase):
    def test_quadrat(self):
        tafel = {'RIALTO': ['RIALT', 'OBCDE', 'FGHKM', 'NPQSU', 'VWXYZ'], 'GONDEL': ['GONDE', 'LABCF', 'HIKMP', 'QRSTU', 'VWXYZ'],
                 'MURANO': ['MURAN', 'OBCDE', 'FGHIK', 'LPQST', 'VWXYZ'], 'BRIEFTAUBE': ['BRIEF', 'TAUCD', 'GHKLM', 'NOPQS', 'VWXYZ'],
                 'KOMPASS': ['KOMPA', 'SBCDE', 'FGHIL', 'NQRTU', 'VWXYZ'], 'ATHEN': ['ATHEN', 'BCDFG', 'IKLMO', 'PQRSU', 'VWXYZ'],
                 'KORINTH': ['KORIN', 'THABC', 'DEFGL', 'MPQSU', 'VWXYZ'], 'FERNSCHREIBER': ['FERNS', 'CHIBA', 'DGKLM', 'OPQTU', 'VWXYZ'],
                 'JOJO': ['IOABC', 'DEFGH', 'KLMNP', 'QRSTU', 'VWXYZ']}
        for w, q in tafel.items():
            self.assertEqual(K.quadrat(w), q, w)
        self.assertEqual(K.quadrat(), ['ABCDE', 'FGHIK', 'LMNOP', 'QRSTU', 'VWXYZ'])
        self.assertEqual(K.quadrat('ZEPPELIN18', groesse=6), ['ZEPLIN', '18ABCD', 'FGHJKM', 'OQRSTU', 'VWXY02', '345679'])
        self.assertEqual(K.quadrat('FERNSPRECHER9', groesse=6), ['FERNSP', 'CH9ABD', 'GIJKLM', 'OQTUVW', 'XYZ012', '345678'])
        self.assertEqual(K.quadrat('', ij='J'), ['ABCDE', 'FGHJK', 'LMNOP', 'QRSTU', 'VWXYZ'])
        self.assertRaises(F, K.quadrat, 'ABC', groesse=4)
        self.assertRaises(F, K.quadrat, 'ABC', ij='K')

    def test_playfair_paare(self):
        self.assertEqual(K.playfair_paare('ballett'), ['BA', 'LX', 'LE', 'TX', 'TX'])
        self.assertEqual(' '.join(K.playfair_paare('dasschiffsegeltmorgen')), 'DA SX SC HI FX FS EG EL TM OR GE NX')
        self.assertEqual(' '.join(K.playfair_paare('kaffee')), 'KA FX FE EX')
        self.assertEqual(' '.join(K.playfair_paare('ballon')), 'BA LX LO NX')
        self.assertEqual(' '.join(K.playfair_paare('wasserweg')), 'WA SX SE RW EG')
        self.assertEqual(' '.join(K.playfair_paare('jagd')), 'IA GD')
        self.assertEqual([K.playfair_paare(''), K.playfair_paare('a'), K.playfair_paare('xx'), K.playfair_paare('abx'),
                          K.playfair_paare('aaa')], [[], ['AX'], ['XQ', 'XQ'], ['AB', 'XQ'], ['AX', 'AX', 'AX']])
        self.assertEqual(K.playfair_paare('aab', fuellzeichen='Q', fuellzeichen_x='Z'), ['AQ', 'AB'])
        self.assertRaises(F, K.playfair_paare, 'abc', fuellzeichen='XY')
        self.assertRaises(F, K.playfair_paare, 'abc', fuellzeichen='X', fuellzeichen_x='X')
        self.assertRaises(F, K.playfair_paare, 'abc', fuellzeichen='J')

    def test_playfair(self):
        self.assertEqual([K.playfair('HU', 'RIALTO'), K.playfair('WI', 'RIALTO'), K.playfair('HU', 'RIALTOBCDEFGHKMNPQSUVWXYZ')],
                         ['MQ', 'IB', 'MQ'])
        self.assertEqual([K.playfair(p, 'RIALTO') for p in ('OD', 'BG', 'RS')], ['BE', 'GP', 'LN'])
        self.assertEqual(K.playfair('wasserweg', 'RIALTO'), gross('XIQYU DIVBM'))
        self.assertEqual(K.playfair('dasschiffsegeltmorgen', 'RIALTO'), gross('CLQYQ DGAHV KNBMD TEUFO MBQV'))
        self.assertEqual(K.playfair('HLIRO UUQTB AY', 'RIALTO', 'ent'), 'KARTENSPIELX')
        self.assertEqual(K.playfair('GAURO TEOFH RDDHO UEZTF', 'RIALTO', 'ent'), gross('hinterdemglockenturm'))
        self.assertEqual(K.playfair('jagd', 'RIALTO'), 'ALKB')
        quadrat = ''.join(K.quadrat('RIALTO'))
        for a in quadrat:
            for b in quadrat:
                if a != b:
                    c = K.playfair(a + b, 'RIALTO')
                    self.assertEqual(K.playfair(b + a, 'RIALTO'), c[1] + c[0])
                    self.assertTrue(c[0] != c[1] and c[0] != a and c[1] != b)

    def test_playfair_grenzfaelle(self):
        self.assertEqual(K.playfair('', 'RIALTO'), '')
        self.assertEqual(len(K.playfair('xx', 'RIALTO')), 4)
        self.assertEqual(K.playfair(K.playfair('xx', 'RIALTO'), 'RIALTO', 'ent'), 'XQXQ')
        self.assertEqual(K.playfair(K.playfair('abc', 'RIALTO'), 'RIALTO', 'ent'), 'ABCX')
        self.assertRaises(F, K.playfair, 'ABC', 'RIALTO', 'ent')
        self.assertRaises(F, K.playfair, 'AABB', 'RIALTO', 'ent')
        self.assertRaises(F, K.playfair, 'ab', 'RIALTO', 'seitwaerts')
        self.assertRaises(F, K.playfair, 'EOXF', 'RIALTO', 'ent', fuellzeichen='Q', fuellzeichen_x='Q')
        self.assertRaises(F, K.playfair, 'EOXF', 'RIALTO', 'ent', fuellzeichen='J')

    def test_kreuzquadrat(self):
        kq = lambda t, r='ver', **o: K.kreuzquadrat(t, 'GONDEL', 'MURANO', r, **o)  # noqa: E731
        self.assertEqual([kq('mehl'), kq('seidenballen'), kq('fa'), kq('FBNSROBNCM', 'ent')], ['KCFQ', 'TBIANEDNOQNE', 'DE', 'KONTORBUCH'])
        self.assertEqual([kq('kommandant'), kq('kontorbuch')], [gross('FBFDE OADNS'), gross('FBNSR OBNCM')])
        self.assertEqual(kq('TBIAN EDNOQ NE', 'ent'), gross('seidenballen'))
        self.assertEqual([K.kreuzquadrat(p, 'GONDEL', 'GONDEL') for p in ('EE', 'GO', 'GL')], ['EE', 'OG', 'GL'])
        quadrat = ''.join(K.quadrat('GONDEL'))
        self.assertEqual(sum(1 for a in quadrat for b in quadrat if kq(a + b) == a + b), 18)
        self.assertEqual(kq(''), '')
        self.assertEqual(kq('m'), kq('mx'))
        self.assertEqual(kq('m', fuellzeichen='Q'), kq('mq'))
        self.assertEqual(kq('ja'), kq('ia'))
        self.assertRaises(F, kq, 'ABC', 'ent')
        self.assertRaises(F, kq, 'ab', fuellzeichen='1')

    def test_zwei_quadrat_zahl(self):
        zq = lambda t, s, r='ver': K.zwei_quadrat_zahl(t, 'BRIEFTAUBE', 'KOMPASS', s, r)  # noqa: E731
        self.assertEqual([zq('h', '3142'), zq('anna', '2222'), zq('rat', '3142'), zq('QGK', '3142', 'ent')], ['O', 'QKKQ', 'QGK', 'RAT'])
        self.assertEqual(zq('nachtwache', '3142'), gross('SGPWV OOTOD'))
        self.assertEqual(zq('WVCIQ XDQVA', '3142', 'ent'), 'ANKERPLATZ')
        self.assertEqual(zq('ankerplatz', '3142'), 'WVCIQXDQVA')
        self.assertEqual(zq(zq('rat', '3142'), '3142'), 'DNC')
        zz = lambda t, s: K.zwei_quadrat_zahl(t, 'BRIEFTAUBE', 'BRIEFTAUBE', s)  # noqa: E731
        self.assertEqual(zz(zz('abcdefghik', '3142'), '1203'), zz('abcdefghik', '4340'))
        quadrat = ''.join(K.quadrat('BRIEFTAUBE'))
        self.assertEqual(''.join(c for c in quadrat if zq(c, '0') == c), 'NVWXYZ')
        g = zq('silberflotte', '3142')
        self.assertEqual(zq(g[:3] + g[4:], '3142', 'ent'), 'SILCOSEWVVQ')
        self.assertEqual([zq('', '3142'), zq('anna', [2, 2, 2, 2])], ['', 'QKKQ'])
        self.assertEqual(zq('jagd', '0'), zq('iagd', '0'))
        for s in ('35', '', '3a', [1, 7], 3142, 0):  # Zahl → Fehler (führende 0 ginge verloren)
            self.assertRaises(F, zq, 'abc', s)
        self.assertEqual(zq('abcd', '0314'), zq('abcd', [0, 3, 1, 4]))

    def test_polybios(self):
        self.assertEqual([K.polybios('rom'), K.polybios('troia')], ['423432', '4442342411'])
        self.assertEqual([K.polybios('legion'), K.polybios('olympia'), K.polybios('forum')],
                         [ohne('31 15 22 24 34 33'), ohne('34 31 54 32 35 24 11'), ohne('21 34 42 45 32')])
        self.assertEqual([K.polybios('33 15 43 44 34 42', 'ent'), K.polybios('21 34 42 45 32', 'ent')], ['NESTOR', 'FORUM'])
        self.assertEqual(K.polybios('sieg', schluessel='KORINTH'), ohne('44 14 32 34'))
        fackel = lambda t, s: K.polybios(K.atbash(t), schluessel=s)  # noqa: E731
        for t, s, c in [('feuer', 'ATHEN', '45 51 24 51 31'), ('hilfe', 'ATHEN', '44 43 35 45 51'), ('quelle', 'ATHEN', '31 24 51 35 35 51'),
                        ('rauch', 'ATHEN', '31 55 24 53 44'), ('perser', 'KORINTH', '11 51 14 22 51 14'), ('q', 'ATHEN', '31'), ('r', 'ATHEN', '31')]:
            self.assertEqual(fackel(t, s), ohne(c))
        self.assertEqual(K.atbash(K.polybios('13 43 12 34 55 35', 'ent', schluessel='ATHEN')), 'SIGNAL')
        self.assertEqual(K.polybios('wolke', schluessel='FERNSCHREIBER', kopf='ADFGX'), 'XDGAFGFFAD')
        z = dict(schluessel='ZEPPELIN18', kopf='ADFGVX')
        self.assertEqual([K.polybios('post', **z), K.polybios('AAGXFD', 'ent', **z), K.polybios('nebel4', **z), K.polybios('ankunft8', **z)],
                         ['AFGAGGGV', 'ZUG', 'AXADDGADAGXD', 'DFAXFVGXAXFAGVDD'])
        self.assertEqual(K.polybios('tor', schluessel='FERNSPRECHER9', kopf='ADFGVX'), 'GFGAAF')
        self.assertEqual([K.polybios(''), K.polybios('j')], ['', K.polybios('i')])
        self.assertEqual(K.polybios('Café – 12'), K.polybios('cafe'))
        self.assertRaises(F, K.polybios, '123', 'ent')
        self.assertRaises(F, K.polybios, '16', 'ent')
        self.assertRaises(F, K.polybios, 'ab', kopf='1234')
        self.assertRaises(F, K.polybios, 'ab', kopf='11234')
        self.assertRaises(F, K.polybios, 'ab', 'quer')

    def test_adfgvx(self):
        Z = 'ZEPPELIN18'
        self.assertEqual(K.adfgvx('nebel4', Z, 'KARL'), 'XGGADADDDAAX')
        self.assertEqual(K.adfgvx('DGDVA AAVFG FX', Z, 'BAUM', 'ent'), 'WOLKE5')
        self.assertEqual(K.adfgvx('XFDGA DXFGA XGFA', Z, 'HAND', 'ent'), 'MORGEN6')
        self.assertEqual(K.adfgvx('ankunft8', Z, 'WOLF'), gross('XXADA GFDFV XVDFA G'))
        self.assertEqual(K.adfgvx('funk2', Z, 'TOR'), 'AAVGXVFXFX')
        self.assertEqual(K.adfgvx('GADGF DDGVF VGGDF AADXA', Z, 'TOR', 'ent'), 'BRIEFTAUBE')
        self.assertEqual(K.adfgvx('nebel4', 'ZEPLIN18ABCDFGHJKMOQRSTUVWXY02345679', 'KARL'), 'XGGADADDDAAX')
        self.assertEqual(K.adfgvx('nebel4', K.quadrat(Z, groesse=6), 'KARL'), 'XGGADADDDAAX')
        self.assertEqual([K.adfgvx('', Z, 'KARL'), K.adfgvx('a', Z, 'KARLSRUHE'), K.adfgvx('FD', Z, 'KARLSRUHE', 'ent')], ['', 'FD', 'A'])
        self.assertEqual([K.adfgvx('nebel4', Z, 'AAAA'), K.adfgvx('nebel4', Z, [1, 2, 3, 4])], ['ADAXGGAAXDDD', 'ADAXGGAAXDDD'])
        self.assertEqual(K.adfgvx('nebel4', Z, 'ANNA'), K.adfgvx('nebel4', Z, [1, 3, 4, 2]))
        self.assertEqual(K.adfgvx('nebel4', Z, 'KARL'), K.adfgvx('nebel4', Z, [2, 1, 4, 3]))
        for args in (('abc', Z, [1, 1, 2]), ('abc', Z, ''), ('ADF', Z, 'KARL', 'ent'), ('ADFB', Z, 'KARL', 'ent')):
            self.assertRaises(F, K.adfgvx, *args)
        self.assertFalse(hasattr(K, 'zwei_quadrat'))


class Transposition(unittest.TestCase):
    def test_skytale(self):
        self.assertEqual(K.skytale('wir halten den pass', 3), 'WTPIEARNSHDSAEXLNX')
        self.assertEqual(K.skytale('DTTMI EBOEL ENFAI DLENA OUEUT FUS', 4, 'ent'), gross('dieflottelaeuftbeineumondaus'))
        self.assertEqual(K.skytale('dieflottelaeuftbeineumondaus', 4), gross('DTTMI EBOEL ENFAI DLENA OUEUT FUS'))
        self.assertEqual(K.skytale('das heer wartet am fluss', 4), gross('DETFA RELSW TUHAA SERMS'))
        self.assertEqual(K.skytale('schickt mehr bogenschuetzen', 3), gross('SHHCR UHBEI OTCGZ KEETN NMSXE CX'))
        self.assertEqual(K.skytale('DSDMI ESEPS RBNET PETLZ AIENU', 5, 'ent'), gross('derpassbeidentempelnistzu'))
        self.assertEqual(K.skytale('lysander kehrt heim', 3), gross('LETYR HSKEA EINHM DRX'))
        self.assertEqual(K.skytale('NUMRA BOUCK REHOG HSMEX CMNXH TFX', 4, 'ent'), gross('nachschubkommtmorgenfruehxxx'))
        self.assertEqual(K.skytale('FRAEI GUMEE LR', 3, 'ent'), gross('feuerimlager'))
        self.assertEqual([K.skytale('eilbote', 2), K.skytale('oasen', 2)], [gross('EOITL EBX'), gross('OEANS X')])
        self.assertEqual(K.skytale('DTTMIEBOELENFAIDLENAOUEUTFUS', 7), K.skytale('DTTMIEBOELENFAIDLENAOUEUTFUS', 4, 'ent'))

    def test_skytale_grenzfaelle(self):
        self.assertEqual([K.skytale('', 3), K.skytale('', 3, 'ent'), K.skytale('abc', 5), K.skytale('ABCXX', 5, 'ent')],
                         ['', '', 'ABCXX', 'ABCXX'])
        self.assertEqual(K.skytale('abcdefg', 3, fuellzeichen='Q'), 'ADGBEQCFQ')
        self.assertEqual(K.skytale('wir halten den pass', 3, fuellzeichen=None), 'WTPIEARNSHDSAELN')
        self.assertEqual(K.skytale('WTPIEARNSHDSAELN', 3, 'ent', fuellzeichen=None), gross('wirhaltendenpass'))
        self.assertEqual(K.skytale('abcde', 4, fuellzeichen=None), 'ACEBD')
        self.assertEqual(K.skytale('ACEBD', 4, 'ent', fuellzeichen=None), 'ABCDE')
        self.assertRaises(F, K.skytale, 'ABCDE', 3, 'ent')
        self.assertRaises(F, K.skytale, 'abc', 1)
        self.assertRaises(F, K.skytale, 'abc', 2.5)
        self.assertRaises(F, K.skytale, 'abc', 3, fuellzeichen='1')

    def test_gartenzaun(self):
        self.assertEqual(K.gartenzaun('versorgung kommt spaet', 3), gross('VONMP ESRUG OMSAT RGKTE'))
        self.assertEqual(K.gartenzaun('pferde stehen bereit', 3), gross('PDEBI FRETH NEETE SER'))
        self.assertEqual(K.gartenzaun('SSFDP ASFED AATCI SNRHI', 4, 'ent'), gross('spartasschiffesindda'))
        self.assertEqual(K.gartenzaun('die mauer haelt stand', 3), gross('DAHTN IMURA LSADE EET'))
        self.assertEqual(K.gartenzaun('BTNID NEWGO ESNUT RES', 2, 'ent'), gross('botensindunterwegs'))
        self.assertEqual(K.gartenzaun('HEMBE IFKMT EESEL OUR', 3, 'ent'), gross('hilfekommtuebersee'))
        self.assertEqual(K.gartenzaun('seeschlacht', 2), gross('SECLC TESHA H'))
        zw = K.caesar('DLBVU HPZOU UTYLH OMUYL ZNTL', 7, 'ent')
        self.assertEqual(zw, 'WEUONAISHNNMREAHFNRESGME')
        self.assertEqual(K.gartenzaun(zw, 3, 'ent'), gross('wirsehenunsmorgenamhafen'))
        self.assertEqual([K.gartenzaun('', 3), K.gartenzaun('abc', 5), K.gartenzaun('ABC', 5, 'ent'), K.gartenzaun('abcdef', 6)],
                         ['', 'ABC', 'ABC', 'ABCDEF'])
        self.assertRaises(F, K.gartenzaun, 'abc', 1)
        self.assertRaises(F, K.gartenzaun, 'abc', 3, 'quer')

    def test_fleissner(self):
        self.assertEqual(K.fleissner('athen sendet hilfe', 4, S1), gross('DNAIL TSEHF TENHE E'))
        self.assertEqual(K.fleissner('DNAILTSEHFTENHEE', 4, S1, 'ent'), gross('athensendethilfe'))
        self.assertEqual(K.fleissner('boten warten am tor', 4, S2), gross('TBNMO TTWOE ANRRA E'))
        self.assertEqual(K.fleissner('rueckzug zum hafen', 4, S2), gross('ZRKAU FEZEU UMGNH C'))
        self.assertEqual(K.fleissner('ZRKAUFEZEUUMGNHC', 4, S2, 'ent'), gross('rueckzugzumhafen'))
        self.assertEqual(K.fleissner('', 4, S1), '')
        self.assertEqual(len(K.fleissner('a', 4, S1)), 16)
        self.assertEqual(K.fleissner(K.fleissner('a', 4, S1), 4, S1, 'ent'), 'A' + 'X' * 15)
        g = K.fleissner('athensendethilfeboten', 4, S1)
        self.assertEqual((len(g), g[:16]), (32, 'DNAILTSEHFTENHEE'))
        self.assertEqual(K.fleissner(g, 4, S1, 'ent'), 'ATHENSENDETHILFEBOTEN' + 'X' * 11)
        links = K.fleissner('athensendethilfe', 4, S1, drehung='links')
        self.assertNotEqual(links, 'DNAILTSEHFTENHEE')
        self.assertEqual(K.fleissner(links, 4, S1, 'ent', drehung='links'), 'ATHENSENDETHILFE')
        self.assertRaises(F, K.fleissner, 'abc', 4, [[1, 1], [1, 4], [2, 2], [3, 3]])
        self.assertRaises(F, K.fleissner, 'abc', 4, S1, drehung='oben')
        self.assertRaises(F, K.fleissner, 'ABC', 4, S1, 'ent')
        self.assertRaises(F, K.fleissner, 'abc', 5, S1)
        s6 = [[1, 1], [1, 2], [1, 3], [1, 4], [1, 5], [2, 2], [2, 3], [2, 4], [3, 3]]
        self.assertTrue(K.schablone_pruefen(6, s6)['ok'])
        t6 = 'diezweiteschablonehatsechsmalsechsfelder'
        self.assertEqual(K.fleissner(K.fleissner(t6, 6, s6), 6, s6, 'ent'), gross(t6) + 'X' * 32)

    def test_schablone_pruefen(self):
        r = K.schablone_pruefen(4, [[1, 1], [1, 4], [2, 2], [3, 3]])
        self.assertEqual((r['ok'], r['abgedeckt']), (False, 8))
        self.assertTrue(r['fehler'])
        self.assertEqual(K.schablone_pruefen(4, S1), {'ok': True, 'fehler': [], 'abgedeckt': 16})
        felder = [[z, s] for z in range(1, 5) for s in range(1, 5)]
        from itertools import combinations
        self.assertEqual(sum(1 for c in combinations(felder, 4) if K.schablone_pruefen(4, list(c))['ok']), 256)
        self.assertFalse(K.schablone_pruefen(4, [[1, 1], [1, 2], [1, 3]])['ok'])
        self.assertFalse(K.schablone_pruefen(4, [[0, 1], [1, 2], [1, 3], [2, 2]])['ok'])
        self.assertFalse(K.schablone_pruefen(5, [])['ok'])

    def test_spalten(self):
        self.assertEqual([K.spalten_reihenfolge(w) for w in ('ANNA', 'KARL', 'TAL', 'funke', 'AAAA')],
                         [[1, 3, 4, 2], [2, 1, 4, 3], [3, 1, 2], [2, 5, 4, 3, 1], [1, 2, 3, 4]])
        self.assertEqual(K.spalten_reihenfolge([3, 1, 2]), [3, 1, 2])
        for s in ('', [1, 1, 2], [0, 1]):
            self.assertRaises(F, K.spalten_reihenfolge, s)
        s1 = K.vigenere('Wetterbericht fuer die Nordsee', 'FUNKE')
        self.assertEqual(K.spaltentransposition(s1, 'FUNKE'), gross('IMYIW BWHJS JDBPS NGRGQ EYVBL IY'))
        self.assertEqual(K.vigenere(K.spaltentransposition('IMYIW BWHJS JDBPS NGRGQ EYVBL IY', 'FUNKE', 'ent'), 'FUNKE', 'ent'),
                         gross('wetterberichtfuerdienordsee'))
        self.assertEqual(K.spaltentransposition('OKTCA ELHRN', 'TAL', 'ent'), 'LOCHKARTEN')
        self.assertEqual(K.spaltentransposition('lochkarten', 'TAL'), 'OKTCAELHRN')
        self.assertEqual(K.spaltentransposition('AXADDGADAGXD', 'KARL'), 'XGGADADDDAAX')
        self.assertEqual([K.spaltentransposition('', 'TAL'), K.spaltentransposition('', 'TAL', 'ent')], ['', ''])
        self.assertEqual([K.spaltentransposition('ab', 'KARLSRUHE'), K.spaltentransposition('BA', 'KARLSRUHE', 'ent')], ['BA', 'AB'])
        self.assertEqual(K.spaltentransposition('lochkarten', [3, 1, 2]), 'OKTCAELHRN')
        self.assertEqual(K.spaltentransposition('lochkarten', 'TAL', fuellzeichen='X'), 'OKTXCAEXLHRN')
        self.assertEqual(K.spaltentransposition('OKTXCAEXLHRN', 'TAL', 'ent'), 'LOCHKARTENXX')
        self.assertRaises(F, K.spaltentransposition, 'abc', '')
        self.assertRaises(F, K.spaltentransposition, 'abc', 'TAL', fuellzeichen='1')

    def test_umkehrung_blockrotation(self):
        self.assertEqual([K.umkehrung('boje'), K.caesar(K.umkehrung('boje'), 3), K.umkehrung(''), K.umkehrung('Grüße')],
                         ['EJOB', 'HMRE', '', 'ESSEURG'])
        c7 = 'MLSNT WEVYP FAPEF PSECS PLQRF KESNL YCPO'
        self.assertEqual(K.umkehrung(K.caesar(c7, 11, 'ent')), gross('dernachtzugfaehrtheutepuenktlichab'))
        self.assertEqual([K.blockrotation('baumhoehle', 4, 1), K.blockrotation('AUMBOEHHEL', 4, 1, 'ent'),
                          K.blockrotation('EFANVKPXJO', 4, 1), K.blockrotation('anderquelle', 4, 4), K.blockrotation('baumhoehle', 2, 4)],
                         ['AUMBOEHHEL', 'BAUMHOEHLE', 'FANEKPXVOJ', 'ANDERQUELEL', 'BAUMHOEHLE'])
        t = 'ANDERQUELLE'
        for _ in range(4):
            t = K.blockrotation(t, 4, 1)
        self.assertEqual(t, 'ANDERQUELEL')
        self.assertEqual([K.blockrotation('', 4, 1), K.blockrotation('abc', 5, 2), K.blockrotation('abcdefg', 3, 2, 'ent')],
                         ['', 'CAB', 'BCAEFDG'])
        self.assertEqual(K.blockrotation([1, 2, 3, 4, 5], 2, 1), [2, 1, 4, 3, 5])
        self.assertEqual(K.blockrotation([2, 1, 4, 3, 5], 2, 1, 'ent'), [1, 2, 3, 4, 5])
        self.assertRaises(F, K.blockrotation, 'abc', 1, 1)
        self.assertRaises(F, K.blockrotation, 'abc', 3, 1.5)
        self.assertRaises(F, K.blockrotation, [1, 300], 2, 1)

    def test_ver_ent_zufall(self):
        r = random.Random(20261012)
        vorrat = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZäöüßÄÖÜ  ,.!-?é'
        for _ in range(300):
            t = ''.join(r.choice(vorrat) for _ in range(r.randint(0, 60)))
            n = K.nur_buchstaben(t)
            w = ''.join(r.choice(K.ALPHABET) for _ in range(r.randint(1, 8)))
            k = r.randint(-30, 60)
            self.assertEqual(K.caesar(K.caesar(t, k), k, 'ent'), n)
            self.assertEqual(K.vigenere(K.vigenere(t, w), w, 'ent'), n)
            self.assertEqual(K.autokey(K.autokey(t, w), w, 'ent'), n)
            self.assertEqual(K.porta(K.porta(t, w), w), n)
            self.assertEqual(K.playfair(K.playfair(t, w), w, 'ent'), ''.join(K.playfair_paare(t)))
            u = r.randint(2, 25)
            sky = K.skytale(t, u)
            self.assertEqual(K.skytale(sky, u, 'ent'), n + 'X' * (len(sky) - len(n)))
            h = r.randint(2, 12)
            self.assertEqual(K.gartenzaun(K.gartenzaun(t, h), h, 'ent'), n)
            self.assertEqual(K.spaltentransposition(K.spaltentransposition(t, w), w, 'ent'), n)
            b, um = r.randint(2, 16), r.randint(-5, 20)
            self.assertEqual(K.blockrotation(K.blockrotation(t, b, um), b, um, 'ent'), n)


class BitsXor(unittest.TestCase):
    def test_ascii_bytes_hex(self):
        self.assertEqual([K.ascii_wert(c) for c in ('A', ' ', '~', 'K', 'G', 'R', 'v')], [65, 32, 126, 75, 71, 82, 118])
        for c in ('ä', 'AB', '\n'):
            self.assertRaises(F, K.ascii_wert, c)
        self.assertEqual(K.zeichen_aus_ascii(82), 'R')
        self.assertRaises(F, K.zeichen_aus_ascii, 127)
        self.assertRaises(F, K.zeichen_aus_ascii, 31)
        self.assertEqual(K.text_zu_bytes('OK ok'), [79, 75, 32, 111, 107])
        self.assertEqual(K.bytes_zu_text([79, 75]), 'OK')
        self.assertRaises(F, K.text_zu_bytes, 'Grüße')
        self.assertRaises(F, K.bytes_zu_text, [200])
        self.assertEqual([K.byte_zu_bits(65), K.byte_zu_bits(5, 4), K.bits_zu_byte('0100 0001')], ['01000001', '0101', 65])
        self.assertRaises(F, K.byte_zu_bits, 256)
        self.assertRaises(F, K.bits_zu_byte, '0102')
        self.assertRaises(F, K.bits_zu_byte, '')
        self.assertEqual([K.text_zu_bits('OK'), K.text_zu_bits('OK', gruppe=8), K.text_zu_bits('OK', gruppe=0), K.text_zu_bits('')],
                         ['0100 1111 0100 1011', '01001111 01001011', '0100111101001011', ''])
        self.assertRaises(F, K.text_zu_bits, 'OK', gruppe=-1)
        self.assertEqual(K.bits_zu_text('0100 1111 0100 1011'), 'OK')
        self.assertRaises(F, K.bits_zu_text, '0100 111')
        self.assertEqual([K.hex_text([7, 23, 15, 9]), K.hex_text(0x4F4B), K.hex_text(0x0202)], ['07170F09', '4F4B', '0202'])
        self.assertEqual(K.von_hex('07 17 0f 09'), [7, 23, 15, 9])
        self.assertRaises(F, K.von_hex, '0G')
        self.assertRaises(F, K.von_hex, '071')
        self.assertEqual(K.hex_text(K.von_hex('ABCD')), 'ABCD')

    def test_bits(self):
        self.assertEqual(K.xor_bits(K.xor_bits('01000001', '10011100'), '10011100'), '01000001')
        self.assertEqual([K.xor_bits('0100 1111', '1010 0110'), K.xor_bits('1011 0110', '0110 1101'), K.xor_bits('11001010', '01100110'),
                          K.xor_bits('10010110', '01011010'), K.xor_bits('1100', '1010', '0110')],
                         ['11101001', '11011011', '10101100', '11001100', '0000'])
        self.assertEqual([K.und_bits('1100', '1010'), K.oder_bits('1100', '1010')], ['1000', '1110'])
        self.assertRaises(F, K.xor_bits, '0101', '011')
        self.assertRaises(F, K.xor_bits, '0102', '0110')
        self.assertEqual([K.rotiere_bits('0100 0011', 1), K.rotiere_bits('10000110', -1), K.rotiere_bits('1011', 4), K.rotiere_bits('', 3)],
                         ['10000110', '01000011', '1011', ''])
        j = K.byte_zu_bits(K.ascii_wert('J'))
        self.assertEqual(K.xor_bits(j, '10011100'), '11010110')
        self.assertEqual(K.bits_zu_text(K.xor_bits('11010110', '10011100')), 'J')
        schl = ['11010011', '01101001', '10101110']
        c1 = [K.xor_bits(K.byte_zu_bits(K.ascii_wert(c)), s) for c, s in zip('NEU', schl)]
        c2 = [K.xor_bits(K.byte_zu_bits(K.ascii_wert(c)), s) for c, s in zip('ALT', schl)]
        self.assertEqual(c1, ['10011101', '00101100', '11111011'])
        self.assertEqual(c2, ['10010010', '00100101', '11111010'])
        self.assertEqual(K.xor_bits(c1[0], c2[0]), '00001111')

    def test_xor_spec_w3(self):
        st = [('1111 0100', '1011 0010'), ('0110 1100', '0011 1001'), ('1000 1011', '1100 0101'), ('0010 0101', '0110 1110')]
        self.assertEqual(K.bits_zu_text(''.join(K.xor_bits(a, b) for a, b in st)), 'FUNK')
        self.assertEqual(K.text_zu_bits('OST'), '0100 1111 0101 0011 0101 0100')
        self.assertEqual(K.xor('OST', [0b10100110, 0b01011100, 0b11110000]), 'E90FA4')
        self.assertEqual(bits8(K.von_hex('E90FA4')), ohne('1110 1001 0000 1111 1010 0100'))
        self.assertEqual(K.xor(K.hex_text([0b01101111, 0b10011111, 0b00011000]), [0b00110101, 0b11001010, 0b01011111], 'ent'), 'ZUG')
        c6 = [0b10011100, 0b00100100, 0b11001110, 0b01100011]
        self.assertEqual(bits8(K.von_hex(K.xor(c6, 'WEST'))), ohne('1100 1011 0110 0001 1001 1101 0011 0111'))
        self.assertEqual(bits8(K.von_hex(K.xor(c6, 'NORD'))), ohne('1101 0010 0110 1011 1001 1100 0010 0111'))
        C1 = [0b00111111, 0b11100011, 0b01001001, 0b10100000, 0b11010011, 0b01100011]
        C2 = [0b00100010, 0b11111001, 0b01011110, 0b10100000, 0b11010011, 0b01100011]
        D = K.von_hex(K.xor(C1, C2))
        self.assertEqual(bits8(D), ohne('0001 1101 0001 1010 0001 0111 0000 0000 0000 0000 0000 0000'))
        self.assertEqual([K.xor(K.hex_text(D[p:p + 4]), 'NORD', 'ent') for p in range(3)], ['SUED', 'TXRD', 'YORD'])
        self.assertEqual(K.xor(K.hex_text(D), 'NORDEN', 'ent'), 'SUEDEN')
        self.assertEqual(K.bits_zu_text('01010111 01001000'), 'WH')
        self.assertEqual(bits8(K.von_hex(K.xor('BOJE', b8('0110 1001 · 1111 0000 · 0011 0011 · 1010 0101')))),
                         ohne('0010 1011 1011 1111 0111 1001 1110 0000'))
        C4 = b8('0001 1110 · 1101 1010 · 0110 0111 · 1001 0001')
        self.assertEqual(bits8(K.von_hex(K.xor(C4, 'HALT'))), ohne('0101 0110 1001 1011 0010 1011 1100 0101'))
        self.assertEqual(bits8(K.von_hex(K.xor(C4, 'LAUF'))), ohne('0101 0010 1001 1011 0011 0010 1101 0111'))
        A1 = b8('1001 0011 · 0111 0011 · 1110 1001 · 0000 0001 · 1011 0100 · 0101 0110 · 1100 0100')
        A2 = b8('1000 0100 · 0111 0111 · 1110 0100 · 0001 0010 · 1010 0111 · 0101 1011 · 1101 1000')
        DA = K.von_hex(K.xor(A1, A2))
        self.assertEqual(bits8(DA), ohne('0001 0111 0000 0100 0000 1101 0001 0011 0001 0011 0000 1101 0001 1100'))
        self.assertEqual([K.xor(K.hex_text(DA[p:p + 3]), 'UHR', 'ent') for p in range(5)], ['BL_', 'QEA', 'X[A', 'F[_', 'FEN'])
        self.assertEqual(K.xor(K.hex_text(DA), 'VIERUHR', 'ent'), 'AMHAFEN')
        self.assertEqual(bits8(K.von_hex(K.xor('EBBE', [0b00100001]))), ohne('0110 0100 0110 0011 0110 0011 0110 0100'))
        self.assertEqual([K.xor('FUNK', 'AB'), K.xor('07 17 0F 09', 'AB', 'ent')], ['07170F09', 'FUNK'])
        self.assertEqual(K.xor(K.hex_text([1, 0b00010110, 1]), 'OST', 'ent'), 'NEU')
        ks = ['01000011']
        for i in range(3):
            ks.append(K.rotiere_bits(ks[i], 1))
        self.assertEqual(ks, ['01000011', '10000110', '00001101', '00011010'])
        self.assertEqual(bits8(K.von_hex(K.xor('TOR', [K.bits_zu_byte(x) for x in ks]))), ohne('0001 0111 1100 1001 0101 1111'))
        per = {}
        for k in range(256):
            b = K.byte_zu_bits(k)
            p = next(p for p in range(1, 9) if K.rotiere_bits(b, p) == b)
            per[p] = per.get(p, 0) + 1
        self.assertEqual(per, {1: 2, 2: 2, 4: 12, 8: 240})
        C15 = [10, 4, 17, 22, 4, 5, 0, 4, 10, 6]
        self.assertEqual([K.xor(K.hex_text(C15[:3]), 'HEU', 'ent'), K.xor(K.hex_text(C15), 'BAD', 'ent')], ['BAD', 'HEUTEABEND'])
        self.assertEqual(K.bits_zu_text('01001110'), 'N')
        self.assertEqual(K.xor(K.hex_text([K.ascii_wert(' ')]), [0b00001000], 'ent'), '(')

    def test_xor_grenzfaelle(self):
        self.assertEqual([K.xor('', 'AB'), K.xor('', 'AB', 'ent'), K.xor('00', 'A', 'ent')], ['', '', 'A'])
        for args in (('ABC', ''), ('ABC', []), ('Grüße', 'A'), ('41', 'A', 'ent'), ('4', 'A', 'ent')):
            self.assertRaises(F, K.xor, *args)


class Kryptos16(unittest.TestCase):
    def test_sbox(self):
        self.assertEqual(''.join(format(v, 'X') for v in K.KRYPTOS16_SBOX), 'CF397A86124EB5D0')
        self.assertEqual(''.join(format(v, 'X') for v in K.KRYPTOS16_SBOX_INV), 'F892AD74635C0EB1')
        for x in range(16):
            self.assertNotEqual(K.KRYPTOS16_SBOX[x], x)
            self.assertNotEqual(K.KRYPTOS16_SBOX[K.KRYPTOS16_SBOX[x]], x)
            self.assertEqual(K.KRYPTOS16_SBOX_INV[K.KRYPTOS16_SBOX[x]], x)
        S, SI = K.KRYPTOS16_SBOX, K.KRYPTOS16_SBOX_INV
        self.assertEqual([S[0b1011], S[0b0110], SI[0b1110], SI[0], S[0], S[15], S[9], SI[9], SI[6], S[S[6]], SI[8]],
                         [0b1110, 0b1000, 0b1011, 0b1111, 0b1100, 0, 0b0010, 0b0011, 0b0111, 1, 0b0110])

    def test_einzelschritte(self):
        self.assertEqual(blk(K.kryptos16_sbox(b2('1110 1100 0010 0110'))), '1101 1011 0011 1000')
        self.assertEqual(blk(K.kryptos16_sbox(b2('1101 1011 0011 1000'), 'ent')), '1110 1100 0010 0110')
        self.assertEqual(blk(K.kryptos16_transponiere(b2('1101 1011 0011 1000'))), '1101 1000 0110 1110')
        self.assertEqual(blk(K.kryptos16_transponiere(b2('0010 0110 0001 1100'))), '0001 0101 1100 0010')
        self.assertEqual(blk(K.kryptos16_transponiere(0xF000)), '1000 1000 1000 1000')
        s = K.kryptos16_sbox(b2('1011 0100 0011 1001'))
        self.assertEqual((blk(s), blk(K.kryptos16_transponiere(s))), ('1110 0111 1001 0010', '1010 1100 1101 0110'))

    def test_schluesselplan(self):
        self.assertEqual([K.hex_text(K.kryptos16_rundenschluessel(0xA36D, r)) for r in (1, 2, 3, 4)], ['A36D', '36DA', '6DA3', 'DA36'])
        k = b2('0101 1100 1001 1110')
        self.assertEqual([blk(K.kryptos16_rundenschluessel(k, r)) for r in (2, 3, 4)],
                         ['1100 1001 1110 0101', '1001 1110 0101 1100', '1110 0101 1100 1001'])
        self.assertEqual(blk(K.kryptos16_rundenschluessel(b2('0011 1010 1100 0101'), 3)), '1100 0101 0011 1010')
        self.assertEqual([K.kryptos16_rundenschluessel(0x7777, 2), K.kryptos16_rundenschluessel(0xA36D, 5)], [0x7777, 0xA36D])
        schwach = periode2 = 0
        for x in range(65536):
            r = [K.kryptos16_rundenschluessel(x, i) for i in (1, 2, 3, 4)]
            if all(v == x for v in r):
                schwach += 1
            elif r[2] == r[0] and r[3] == r[1]:
                periode2 += 1
        self.assertEqual((schwach, periode2), (16, 240))
        self.assertRaises(F, K.kryptos16_rundenschluessel, 0x10000, 1)
        self.assertRaises(F, K.kryptos16_rundenschluessel, 1, 0)

    def test_testvektoren(self):
        tv = [(0x4F4B, 0xA36D, ['D86E', 'EF3D', '116D', 'F5F8']), (0x4F4A, 0xA36D, ['C97E', '0311', 'E635', 'F24D']),
              (0x4A41, 0x5C9E, ['CA8A', 'E804', '68A1', '240D']), (0x4F4B, 0x0000, ['1BBA', 'EFE8', 'AA0B', '3F10']),
              (0x0000, 0x2B7E, ['57E9', 'FF18', '744F', '4081']), (0xFFFF, 0x2B7E, ['1D5F', '2F21', 'E7C4', 'DA61'])]
        for p, k, soll in tv:
            self.assertEqual([K.hex_text(K.kryptos16_verschluesseln(p, k, runden=r)) for r in (1, 2, 3, 4)], soll)
            self.assertEqual(K.kryptos16_entschluesseln(K.kryptos16_verschluesseln(p, k), k), p)
        self.assertEqual(K.kryptos16_verschluesseln(0x4F4B, 0xA36D), 0xF5F8)

    def test_protokoll(self):
        p = K.kryptos16_verschluesseln(0x4F4B, 0xA36D, runden=2, protokoll=True)
        self.assertEqual(p['ergebnis'], 0xEF3D)
        zeile = lambda r: [blk(r[x]) for x in ('eingang', 'schluessel', 'nach_xor', 'nach_s_box', 'nach_transposition')]  # noqa: E731
        self.assertEqual(zeile(p['runden'][0]), ['0100 1111 0100 1011', '1010 0011 0110 1101', '1110 1100 0010 0110', '1101 1011 0011 1000',
                                                 '1101 1000 0110 1110'])
        self.assertEqual(zeile(p['runden'][1]), ['1101 1000 0110 1110', '0011 0110 1101 1010', '1110 1110 1011 0100', '1101 1101 1110 0111',
                                                 '1110 1111 0011 1101'])
        self.assertEqual(p['runden'][1]['runde'], 2)
        no = K.kryptos16_verschluesseln(K.kryptos16_text_zu_bloecken('NO')[0], b2('0011 1111 0000 1000'), runden=1, protokoll=True)
        z = zeile(no['runden'][0])
        self.assertEqual([z[0]] + z[2:], ['0100 1110 0100 1111', '0111 0001 0100 0111', '0110 1111 0111 0110', '0100 1111 1111 0110'])
        ja = K.kryptos16_verschluesseln(0x4A41, 0x5C9E, runden=2, protokoll=True)
        self.assertEqual(zeile(ja['runden'][0]), ['0100 1010 0100 0001', '0101 1100 1001 1110', '0001 0110 1101 1111', '1111 1000 0101 0000',
                                                  '1100 1010 1000 1010'])
        self.assertEqual(zeile(ja['runden'][1]), ['1100 1010 1000 1010', '1100 1001 1110 0101', '0000 0011 0110 1111', '1100 1001 1000 0000',
                                                  '1110 1000 0000 0100'])
        self.assertEqual([K.kryptos16_runde(0x4F4B, 0xA36D), K.kryptos16_runde(0xD86E, 0xA36D, 'ent')], [0xD86E, 0x4F4B])
        self.assertEqual([blk(K.kryptos16_verschluesseln(0x4F4A, 0xA36D, runden=r)) for r in (1, 2, 3, 4)],
                         ['1100 1001 0111 1110', '0000 0011 0001 0001', '1110 0110 0011 0101', '1111 0010 0100 1101'])

    def test_bijektiv(self):
        gesehen = set()
        for p in range(65536):
            c = K.kryptos16_verschluesseln(p, 0xA36D)
            gesehen.add(c)
            self.assertEqual(K.kryptos16_entschluesseln(c, 0xA36D), p)
        self.assertEqual(len(gesehen), 65536)

    def test_lawine(self):
        self.assertEqual([r['anzahl'] for r in K.kryptos16_lawine(0x4F4B, 0xA36D, 16)], [3, 8, 10, 8])
        self.assertEqual([r['anzahl'] for r in K.kryptos16_lawine(0x4A41, 0x5C9E, 16)], [3, 7, 9, 7])
        l1 = K.kryptos16_lawine(0x4F4B, 0xA36D, 16, runden=1)
        self.assertEqual((len(l1), l1[0]['runde'], len(l1[0]['positionen'])), (1, 1, 3))
        self.assertTrue(all(1 <= b <= 16 for b in l1[0]['positionen']))
        self.assertRaises(F, K.kryptos16_lawine, 0, 0, 17)

    def test_padding_modi(self):
        self.assertEqual([blk(b) for b in K.kryptos16_text_zu_bloecken('OST')], ['0100 1111 0101 0011', '0101 0100 0000 0001'])
        self.assertEqual([blk(b) for b in K.kryptos16_text_zu_bloecken('JA')], ['0100 1010 0100 0001', '0000 0010 0000 0010'])
        self.assertEqual([K.hex_text(b) for b in K.kryptos16_text_zu_bloecken('')], ['0202'])
        self.assertEqual([K.hex_text(b) for b in K.kryptos16_text_zu_bloecken('NEIN')], ['4E45', '494E', '0202'])
        for t in ('OST', 'JA', ''):
            self.assertEqual(K.kryptos16_bloecke_zu_text(K.kryptos16_text_zu_bloecken(t)), t)
        self.assertRaises(F, K.kryptos16_bloecke_zu_text, [0x4A41])
        self.assertRaises(F, K.kryptos16_bloecke_zu_text, [0x4A41, 0x0203])
        self.assertRaises(F, K.kryptos16_text_zu_bloecken, 'Grüße')
        ecb = K.kryptos16_modus([0x4A41, 0x4A41], 0x5C9E, 'ECB', None, runden=1)
        self.assertEqual([blk(b) for b in ecb], ['1100 1010 1000 1010'] * 2)
        iv = b2('0011 0000 1100 0011')
        cbc = K.kryptos16_modus([0x4A41, 0x4A41], 0x5C9E, 'CBC', iv, runden=1)
        self.assertEqual([blk(b) for b in cbc], ['0111 0010 1011 1011', '1010 0101 0101 0101'])
        self.assertEqual(K.kryptos16_modus(cbc, 0x5C9E, 'CBC', iv, runden=1, richtung='ent'), [0x4A41, 0x4A41])
        self.assertEqual(K.kryptos16_modus(ecb, 0x5C9E, 'ECB', None, runden=1, richtung='ent'), [0x4A41, 0x4A41])
        P = K.kryptos16_text_zu_bloecken('SEHR GUT')
        self.assertEqual(len(P), 5)
        C = K.kryptos16_modus(P, 0xA36D, 'CBC', 0x1917)
        Cf = list(C)
        Cf[1] ^= 1 << 11
        Pf = K.kryptos16_modus(Cf, 0xA36D, 'CBC', 0x1917, richtung='ent')
        self.assertEqual(K.bytes_zu_text([x for b in Pf[:4] for x in (b >> 8, b & 255)]), 'SEQp(GUT')
        self.assertEqual((bin(Pf[1] ^ P[1]).count('1'), bin(Pf[2] ^ P[2]).count('1')), (5, 1))
        E = K.kryptos16_modus(P, 0xA36D, 'ECB')
        Ef = list(E)
        Ef[1] ^= 1 << 11
        Pe = K.kryptos16_modus(Ef, 0xA36D, 'ECB', None, richtung='ent')
        self.assertEqual(bin(Pe[1] ^ P[1]).count('1'), 12)
        self.assertTrue(all(Pe[i] == P[i] for i in (0, 2, 3, 4)))
        self.assertRaises(F, K.kryptos16_modus, [1], 1, 'CBC')
        self.assertRaises(F, K.kryptos16_modus, [1], 1, 'OFB', 0)
        self.assertRaises(F, K.kryptos16_verschluesseln, 0x10000, 1)
        self.assertRaises(F, K.kryptos16_verschluesseln, 1, 1, runden=0)


class KryptosHash(unittest.TestCase):
    def test_werte(self):
        KH = lambda t: K.kryptos_hash(t)['wert']  # noqa: E731
        self.assertEqual([KH('nebel'), KH('heute'), KH('morgen'), KH(''), KH('a'), KH('ueberweisetausendeuro'), KH('Überweise 2 Euro')],
                         [9, 22, 22, 0, 1, 18, 1])
        p = K.kryptos_hash('nebel', protokoll=True)
        self.assertEqual([[s[x] for x in ('buchstabe', 'w', 'vorher', 'summe', 'nachher')] for s in p['schritte']],
                         [['n', 14, 0, 14, 14], ['e', 5, 14, 47, 18], ['b', 2, 18, 56, 27], ['e', 5, 27, 86, 28], ['l', 12, 28, 96, 9]])
        self.assertNotIn('schritte', K.kryptos_hash('nebel'))
        einzel = {'tee': 26, 'kaffee': 3, 'kiste': 7, 'kistf': 8, 'hafen': 4, 'eis': 4, 'anker': 11, 'tor': 11, 'post': 6, 'potq': 6,
                  'abe': 20, 'ja': 2, 'rabe': 13, 'bear': 4, 'nebfi': 9, 'haffk': 4, 'zoo': 4, 'ab': 5, 't': 20, 'regal': 18, 'lager': 22,
                  'oase': 12}
        for w, h in einzel.items():
            self.assertEqual(KH(w), h, w)
        for a, b, h in [('heute', 'morgen', 22), ('ueberweisezweieuro', 'ueberweisetausendeuro', 18), ('treffenumfuenfuhr', 'treffenumzehnuhr', 8),
                        ('treffpunktbruecke', 'treffpunktschule', 18), ('sonne', 'geheim', 0)]:
            self.assertEqual([KH(a), KH(b)], [h, h])
        self.assertEqual([KH('qxsonne'), KH('kzsonne'), KH('mbsonne')], [13, 11, 16])
        self.assertEqual([KH('oasekistefehltimhafen'), KH('oasekistefehltimhaffk')], [27, 27])

    def test_kollision(self):
        k = K.kryptos_hash_kollision_suchen('nebel')
        self.assertEqual(k, {'text': 'i', 'wert': 9, 'versuche': 9})
        self.assertEqual(K.kryptos_hash_kollision_suchen('i'), {'text': 'af', 'wert': 9, 'versuche': 31})
        k2 = K.kryptos_hash_kollision_suchen('heute', alphabet='xyz')
        self.assertEqual(K.kryptos_hash(k2['text'])['wert'], 22)
        self.assertTrue(set(k2['text']) <= set('xyz'))
        self.assertIsNone(K.kryptos_hash_kollision_suchen('heute', alphabet='a', max=5))
        self.assertRaises(F, K.kryptos_hash_kollision_suchen, 'x', alphabet='')


class Kryptoanalyse(unittest.TestCase):
    def test_deutsch(self):
        self.assertEqual(K.DEUTSCH['E'], 17.40)
        self.assertEqual(sorted(K.DEUTSCH), list(K.ALPHABET))
        self.assertEqual(round(sum(K.DEUTSCH.values()), 2), 100)
        self.assertEqual(round(sum((p / 100) ** 2 for p in K.DEUTSCH.values()), 4), 0.0762)
        v = sorted(K.DEUTSCH.values(), reverse=True)
        self.assertEqual([round(sum(v[:k]), 2) for k in (5, 7, 10)], [49, 61.66, 75.85])
        self.assertEqual(''.join(sorted(K.DEUTSCH, key=lambda c: -K.DEUTSCH[c])[:7]), 'ENISRAT')

    def test_haeufigkeiten(self):
        h = K.haeufigkeiten(WETTKNACKEN)
        self.assertEqual((len(h), sum(h.values()), h['U'], h['L']), (26, 486, 94, 0))
        self.assertEqual(''.join(K.rangfolge(WETTKNACKEN)), 'UIDNMROCPYQABGHSJZKVEFTW')
        self.assertEqual([(b['bigramm'], b['anzahl']) for b in K.bigramme(WETTKNACKEN, top=6)],
                         [('UI', 21), ('IR', 20), ('UM', 20), ('YC', 17), ('RU', 14), ('DI', 13)])
        self.assertEqual(len(K.bigramme(WETTKNACKEN)), 10)
        self.assertEqual(round(K.koinzidenzindex(WETTKNACKEN), 4), 0.0844)
        a = K.anteile(WETTKNACKEN)
        self.assertAlmostEqual(sum(a.values()), 1, places=12)
        self.assertEqual(a['U'], 94 / 486)
        klar = K.substitution(WETTKNACKEN, K.schluesselwort_alphabet('PAPYRUS'), 'ent')
        self.assertTrue(klar.startswith('IMHAUSDERWEISHEITINBAGDAD'))
        hk = K.haeufigkeiten(klar)
        self.assertEqual([hk[c] for c in 'ENISRDTAHCU'], [94, 52, 42, 37, 36, 32, 28, 27, 27, 17, 14])
        c4 = ('RAPIZ JGBQD FGDIS AGLAI ZPZVZ LALZD FEZQP ZQGAS PZACS QAGRA NBABB APTLR NZNGA PGLRA PLZDF SPZQS ASQGA ZLAGL '
              'APMZQ AAGLR GAEUA PQSAD ISQGD FFGLS APRAL YAJSA LTLRV ZPSAS EGQRG AVZAD FSAPQ DFJZB ALRMD FRAPH TLCAI TPGAP EAKAP '
              'ISGFL TLRQD FJZAC SZJZP K')
        soll = {'A': 36, 'Z': 19, 'P': 18, 'G': 17, 'L': 17, 'S': 15, 'Q': 12, 'R': 11, 'D': 10, 'F': 10, 'I': 6, 'B': 5, 'J': 5, 'T': 5,
                'E': 4, 'C': 3, 'N': 3, 'V': 3, 'K': 2, 'M': 2, 'H': 1, 'U': 1, 'Y': 1}
        h4 = K.haeufigkeiten(c4)
        self.assertEqual({c: n for c, n in h4.items() if n}, soll)
        self.assertEqual(''.join(K.rangfolge(c4)[:5]), 'AZPGL')
        bg = {b['bigramm']: b['anzahl'] for b in K.bigramme(c4, top=1000)}
        self.assertEqual([bg['AP'], bg['DF'], bg['SA'], bg['GA'], bg['LR']], [11, 8, 7, 6, 6])
        c7 = 'TDAPQ AOIAP QACAI CAGGR AUAOT AOPQS TQRIT TDAWS LCABA CQDCO AORIT A'
        h7 = K.haeufigkeiten(c7)
        self.assertEqual([h7[c] for c in 'ATCOQIDPR'], [14, 6, 5, 5, 5, 4, 3, 3, 3])
        self.assertEqual(''.join(K.rangfolge(c7)[:5]), 'ATCOQ')
        self.assertEqual(K.haeufigkeiten('ZPUCG URDUZ UDYCU IQIRR QSDIR UNORU INYCG QUNNU G')['U'], 9)
        self.assertEqual([sum(K.haeufigkeiten('').values()), list(K.anteile('').values()), K.rangfolge(''), K.bigramme('A')],
                         [0, [0] * 26, [], []])
        self.assertEqual(K.bigramme('AAA'), [{'bigramm': 'AA', 'anzahl': 2}])
        self.assertEqual(K.haeufigkeiten('Grüße')['S'], 2)

    def test_koinzidenzindex(self):
        self.assertAlmostEqual(K.koinzidenzindex('BALLADE'), 2 / 21, places=12)
        self.assertIsNone(K.koinzidenzindex('A'))
        self.assertIsNone(K.koinzidenzindex(''))
        for t, x in [('ANANAS', 8 / 30), ('SERENISSIMA', 10 / 110), ('LAGUNE', 0), ('KANALBANK', 10 / 72), ('ABBA', 4 / 12), ('OTTO', 4 / 12),
                     ('AOPD', 0), (EVES_BRIEF, 2434 / 51756), (GOLD_TEXT, 1132 / 26082)]:
            self.assertAlmostEqual(K.koinzidenzindex(t), x, places=12)
        self.assertEqual(K.koinzidenzindex(K.caesar('otto', 3)), K.koinzidenzindex('otto'))
        self.assertEqual(K.koinzidenzindex(K.vigenere('anna', 'ABCD')), 0)
        self.assertEqual(round(K.koinzidenzindex('derratvonvenedigliestunserebriefebenutzeabjetztnurnochdasquadrat'), 4), 0.0665)
        self.assertEqual(round(K.koinzidenzindex('OEXLN XGOTP RRPDO AYMPS ZOAWP RKVEM PFKVR RFTFY NFUEZ TGRFR TIPLO AYKHE ORGN'), 4), 0.0496)

    def test_friedman(self):
        fw = K.friedman_wert
        self.assertEqual([round(fw(601, 0.0507), 2), round(fw(1001, 0.0475), 2), round(fw(501, 0.0456), 2)], [2.98, 3.99, 4.96])
        self.assertEqual([round(fw(1001, 0.057), 2), round(fw(1001, 0.0418), 2), round(fw(400, 0.076), 3), round(fw(400, 0.038), 1)],
                         [2.0, 9.91, 1, 400])
        i_k1 = (18 * 0.076 + 48 * 0.038) / 66
        self.assertEqual((round(i_k1, 4), round(fw(12, i_k1), 3)), (0.0484, 3))
        self.assertEqual(round(fw(100, 410 / 9900), 1), 10.1)
        self.assertEqual(round(fw(100, 410 / 9900, i_d=0.0765, i_z=0.0385), 1), 11.6)
        ok = 0
        for n in (501, 1001):
            for k in range(2, 9):
                ik = round(((n - k) * 0.076 + n * (k - 1) * 0.038) / ((n - 1) * k), 4)
                ok += round(fw(n, ik)) == k
        self.assertEqual(ok, 14)
        self.assertEqual([round(K.friedman(EVES_BRIEF), 2), round(K.friedman(GOLD_TEXT), 2)], [4.15, 6.78])
        self.assertIsNone(K.friedman('A'))
        self.assertRaises(F, fw, 1, 0.05)
        self.assertRaises(F, fw, 100, -1)
        self.assertIsNone(fw(2, 0))  # Nenner 0 → None
        self.assertIsNone(K.friedman('AB'))

    def test_teiltexte(self):
        self.assertEqual(K.teiltexte('YLYTXEBYWUTPRP', 3)[1], 'LXYTP')
        self.assertEqual(K.teiltexte('VCVIZ TSWLE UKXMY', 3), ['VISEX', 'CZWUM', 'VTLKY'])
        self.assertEqual(K.teiltexte('QWERT ZUIOP AS', 3), ['QRUP', 'WTIA', 'EZOS'])
        self.assertEqual(K.teiltexte('ABC', 5), ['A', 'B', 'C', '', ''])
        self.assertRaises(F, K.teiltexte, 'ABC', 0)
        mittel = lambda t, k: sum(K.koinzidenzindex(x) for x in K.teiltexte(t, k)) / k  # noqa: E731
        self.assertEqual([round(mittel(EVES_BRIEF, k), 3) for k in range(1, 11)],
                         [0.047, 0.046, 0.046, 0.048, 0.096, 0.044, 0.047, 0.047, 0.042, 0.099])
        self.assertEqual([round(mittel(EVES_BRIEF, 5), 4), round(mittel(EVES_BRIEF, 10), 4), round(mittel(GOLD_TEXT, 4), 4)],
                         [0.0961, 0.0988, 0.0914])

        def spitze(t):
            h = K.haeufigkeiten(t)
            return [(c, h[c]) for c in K.rangfolge(t)[:2]]
        self.assertEqual([spitze(t)[0] for t in K.teiltexte(EVES_BRIEF, 5)], [('A', 11), ('E', 15), ('G', 10), ('L', 7), ('W', 10)])
        self.assertEqual([spitze(t) for t in K.teiltexte(GOLD_TEXT, 4)],
                         [[('K', 10), ('T', 7)], [('S', 7), ('B', 5)], [('P', 8), ('D', 5)], [('H', 9), ('Q', 6)]])

    def test_kasiski(self):
        r = K.kasiski(EVES_BRIEF)
        self.assertEqual([(w['folge'], w['positionen']) for w in r['wiederholungen']],
                         [('AVEEDYAAFG', [133, 173]), ('EPKW', [106, 116]), ('ZIG', [0, 60, 100]), ('VEE', [134, 174, 189]),
                          ('SHE', [4, 129]), ('KWN', [43, 108]), ('VAR', [69, 154]), ('CEP', [125, 210])])
        finde = lambda r_, f: next(w for w in r_['wiederholungen'] if w['folge'] == f)  # noqa: E731
        self.assertEqual(finde(r, 'ZIG')['abstaende'], [60, 40])
        self.assertEqual(finde(r, 'VEE')['abstaende'], [40, 15])
        self.assertEqual(r['vorschlag'][0], 5)
        self.assertEqual(sorted(r['abstaende']), [10, 15, 40, 40, 60, 65, 85, 85, 125])
        self.assertEqual([r['teiler'][t] for t in range(2, 11)], [4, 2, 3, 9, 1, 0, 2, 0, 4])
        self.assertEqual(list(r['teiler']), list(range(2, 21)))
        g = K.kasiski(GOLD_TEXT)
        self.assertEqual((g['wiederholungen'][0]['folge'], g['wiederholungen'][0]['positionen']), ('WJWPJKGLQJHPQ', [15, 131]))
        self.assertEqual(len(g['abstaende']), 7)
        self.assertEqual([g['teiler'][2], g['teiler'][4]], [7, 7])
        self.assertEqual(g['vorschlag'][:2], [4, 2])
        for f, p in [('HMSD', [39, 59]), ('RTH', [37, 77]), ('PQT', [102, 142]), ('KGD', [128, 152])]:
            self.assertEqual(finde(g, f)['positionen'], p)
        self.assertEqual([w['folge'] for w in K.kasiski(EVES_BRIEF, min=4)['wiederholungen']], ['AVEEDYAAFG', 'EPKW'])
        leer = K.kasiski('ABCDEFG')
        self.assertEqual((leer['wiederholungen'], leer['abstaende'], leer['vorschlag'], leer['teiler'][2]), ([], [], [], 0))
        self.assertEqual(K.kasiski('')['wiederholungen'], [])
        self.assertEqual(len(K.kasiski(EVES_BRIEF, anzahl=3)['wiederholungen']), 3)
        self.assertRaises(F, K.kasiski, 'ABC', min=2)
        self.assertRaises(F, K.kasiski, 'ABC', min=7)
        self.assertEqual([(w['folge'], w['positionen']) for w in K.kasiski('ABCABCABC')['wiederholungen']], [('ABC', [0, 3, 6])])
        self.assertEqual(K.kasiski('ABCABCABC')['abstaende'], [3, 3])

    def test_verschiebung_chi(self):
        vorschlag = lambda t, k: ''.join(K.verschiebung_schaetzen(x)['buchstabe'] for x in K.teiltexte(t, k))  # noqa: E731
        self.assertEqual([vorschlag(EVES_BRIEF, 5), vorschlag(GOLD_TEXT, 4)], ['WACHS', 'GOLD'])
        klar = 'diekurierewartenanderbrueckenebendemfischmarktaufdenabend'
        v = K.verschiebung_schaetzen(K.caesar(klar, 19))
        self.assertEqual((v['k'], v['buchstabe'], len(v['werte']), len(v['kandidaten']), v['kandidaten'][0]['k']), (19, 'T', 26, 3, 19))
        self.assertGreaterEqual(v['kandidaten'][0]['wert'], v['kandidaten'][1]['wert'])
        self.assertEqual(K.verschiebung_schaetzen('')['k'], 0)
        g = K.verschiebung_schaetzen('irbnIos')  # exakter Gleichstand χ(4) = χ(14) → kleineres v
        self.assertEqual((g['k'], [c['k'] for c in g['kandidaten']]), (4, [4, 14, 0]))
        self.assertLess(K.chi_quadrat(klar), K.chi_quadrat(K.caesar(klar, 7)))
        self.assertIsNone(K.chi_quadrat(''))
        h = K.haeufigkeiten('EEN')
        erwartet = sum((h[c] - 3 * K.DEUTSCH[c] / 100) ** 2 / (3 * K.DEUTSCH[c] / 100) for c in K.ALPHABET)
        self.assertAlmostEqual(K.chi_quadrat('EEN'), erwartet, places=9)


class Zahlentheorie(unittest.TestCase):
    def test_grundwerte(self):
        self.assertEqual([K.rsa_verschluesseln(9, 7, 77), K.rsa_entschluesseln(37, 43, 77), K.rsa_schluessel(7, 11, 7)['d']], [37, 9, 43])
        self.assertEqual([K.dh_oeffentlich(3, 4, 17), K.dh_oeffentlich(3, 6, 17), K.dh_gemeinsam(15, 4, 17), K.dh_dlog_klein(3, 13, 17)],
                         [13, 15, 16, 4])
        self.assertEqual(K.schluesselanzahl(5), {'symmetrisch': 10, 'asymmetrisch': 10})
        self.assertEqual(K.schluesselanzahl(6), {'symmetrisch': 15, 'asymmetrisch': 12})
        self.assertEqual([K.inverses(7, 60), K.inverses(2, 26)], [43, None])
        self.assertEqual(K.modpow(9, 7, 77), 37)
        p = K.modpow(9, 7, 77, protokoll=True)
        self.assertEqual(p['wert'], 37)
        self.assertGreaterEqual(len(p['schritte']), 3)

    def test_schluesselanzahl(self):
        soll = {2: (1, 4), 3: (3, 6), 4: (6, 8), 5: (10, 10), 6: (15, 12), 7: (21, 14), 8: (28, 16), 9: (36, 18), 10: (45, 20), 12: (66, 24),
                30: (435, 60)}
        for n, (s, a) in soll.items():
            self.assertEqual(K.schluesselanzahl(n), {'symmetrisch': s, 'asymmetrisch': a})
        n = 2
        while K.schluesselanzahl(n)['symmetrisch'] <= K.schluesselanzahl(n)['asymmetrisch']:
            n += 1
        self.assertEqual(n, 6)
        self.assertRaises(F, K.schluesselanzahl, 1)
        self.assertRaises(F, K.schluesselanzahl, 2.5)

    def test_ggt_inverses(self):
        self.assertEqual([K.ggt(60, 7), K.ggt(42, 63), K.ggt(-12, 18), K.ggt(0, 0)], [1, 21, 6, 0])
        self.assertEqual([K.inverses(a, 26) for a in (1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25)], [1, 9, 21, 15, 3, 19, 7, 23, 11, 5, 17, 25])
        inv29 = {1: 1, 2: 15, 3: 10, 4: 22, 5: 6, 6: 5, 7: 25, 8: 11, 9: 13, 12: 17, 14: 27, 16: 20, 18: 21, 19: 26, 23: 24, 28: 28}
        for a, x in inv29.items():
            self.assertEqual(K.inverses(a, 29), x)
        self.assertIsNone(K.inverses(13, 26))
        self.assertEqual([K.inverses(a, m) for a, m in [(5, 48), (7, 48), (5, 192), (7, 96), (3, 32), (5, 17), (8, 29), (3, 26), (27, 352)]],
                         [29, 7, 77, 55, 11, 7, 11, 9, 339])
        self.assertEqual(K.inverses(-17, 60), K.inverses(43, 60))
        self.assertRaises(F, K.inverses, 3, 0)

    def test_euklid(self):
        r = K.erweiterter_euklid(60, 7)
        self.assertEqual((r['ggt'], r['x'], r['y']), (1, 2, -17))
        self.assertEqual([[s[k] for k in 'abqrxy'] for s in r['schritte']],
                         [[60, 7, 8, 4, 2, -17], [7, 4, 1, 3, -1, 2], [4, 3, 1, 1, 1, -1], [3, 1, 3, 0, 0, 1], [1, 0, None, None, 1, 0]])
        self.assertEqual(K.mod(r['y'], 60), 43)
        r2 = K.erweiterter_euklid(192, 5)
        self.assertEqual((r2['x'], r2['y']), (-2, 77))
        self.assertEqual([[s[k] for k in 'abqr'] for s in r2['schritte'][:3]], [[192, 5, 38, 2], [5, 2, 2, 1], [2, 1, 2, 0]])
        for phi, e, d in [(60, 7, 43), (192, 5, 77), (96, 7, 55), (48, 5, 29)]:
            self.assertEqual(K.mod(K.erweiterter_euklid(phi, e)['y'], phi), d)
        g = K.erweiterter_euklid(42, 63)
        self.assertEqual((g['ggt'], 42 * g['x'] + 63 * g['y']), (21, 21))
        self.assertRaises(F, K.erweiterter_euklid, -3, 5)

    def test_modpow(self):
        p = K.modpow(37, 43, 77, protokoll=True)
        self.assertEqual(p['wert'], 9)
        self.assertEqual([[s['exponent'], s['basis'], s['ergebnis']] for s in p['schritte']],
                         [[43, 37, 1], [21, 60, 37], [10, 58, 64], [5, 53, 64], [2, 37, 4], [1, 60, 4], [0, 58, 9]])
        self.assertEqual([K.modpow(37, e, 77) for e in (2, 4, 8, 16, 32)], [60, 58, 53, 37, 60])
        self.assertEqual([K.modpow(3, e, 17) for e in (2, 4, 8, 13)], [9, 13, 16, 12])
        self.assertEqual([K.modpow(3, i, 17) for i in range(1, 17)], [3, 9, 10, 13, 5, 15, 11, 16, 14, 8, 7, 4, 12, 2, 6, 1])
        self.assertEqual([K.modpow(2, i, 19) for i in range(1, 19)], [2, 4, 8, 16, 13, 7, 14, 9, 18, 17, 15, 11, 3, 6, 12, 5, 10, 1])
        self.assertEqual([K.modpow(3, 4, 7), K.modpow(2, 3, 15), K.modpow(5, 0, 7), K.modpow(5, 3, 1), K.modpow(-2, 3, 7)], [4, 8, 1, 0, 6])
        self.assertEqual(K.modpow(123456789, 987654321, 1000000007), pow(123456789, 987654321, 1000000007))
        self.assertRaises(F, K.modpow, 2, -1, 7)
        self.assertRaises(F, K.modpow, 2, 3, 0)

    def test_ist_prim(self):
        self.assertEqual([n for n in range(30) if K.ist_prim(n)], [2, 3, 5, 7, 11, 13, 17, 19, 23, 29])
        self.assertEqual([K.ist_prim(101), K.ist_prim(391), K.ist_prim(9999991)], [True, False, True])
        self.assertRaises(F, K.ist_prim, 10000000)
        self.assertRaises(F, K.ist_prim, 2.5)

    def test_rsa(self):
        self.assertEqual(K.rsa_schluessel(7, 11, 7), {'N': 77, 'phi': 60, 'e': 7, 'd': 43})
        self.assertEqual(K.rsa_schluessel(5, 13, 5), {'N': 65, 'phi': 48, 'e': 5, 'd': 29})
        self.assertEqual(K.rsa_schluessel(5, 13, 7)['d'], 7)
        self.assertEqual(K.rsa_schluessel(3, 17, 3), {'N': 51, 'phi': 32, 'e': 3, 'd': 11})
        self.assertEqual(K.rsa_schluessel(17, 23, 27), {'N': 391, 'phi': 352, 'e': 27, 'd': 339})
        self.assertEqual([K.rsa_schluessel(13, 17, 5)['d'], K.rsa_schluessel(7, 19, 5)['d'], K.rsa_schluessel(7, 11)['e'],
                          K.rsa_schluessel(5, 11)['e']], [77, 65, 7, 3])
        self.assertEqual([K.rsa_verschluesseln(3, 5, 65), K.rsa_entschluesseln(48, 29, 65)], [48, 3])
        self.assertEqual([K.modpow(48, e, 65) for e in (2, 4, 8, 16)], [29, 61, 16, 61])
        self.assertEqual([K.rsa_verschluesseln(4, 3, 51), K.rsa_entschluesseln(13, 11, 51)], [13, 4])
        self.assertEqual([K.modpow(13, e, 51) for e in (2, 4, 8)], [16, 1, 1])
        self.assertEqual([K.rsa_verschluesseln(65, 27, 391), K.rsa_entschluesseln(333, 339, 391)], [333, 65])
        self.assertEqual([K.rsa_verschluesseln(10, 5, 133), K.rsa_entschluesseln(117, 65, 133)], [117, 10])
        for m in range(133):
            self.assertEqual(K.rsa_entschluesseln(K.rsa_verschluesseln(m, 5, 133), 65, 133), m)
        self.assertEqual([K.rsa_verschluesseln(5, 7, 77), K.rsa_entschluesseln(47, 43, 77)], [47, 5])
        self.assertEqual(K.caesar('FGMTQ ZSLRT WLJS', K.rsa_entschluesseln(47, 43, 77), 'ent'), 'ABHOLUNGMORGEN')
        self.assertEqual(K.rsa_schluessel(5, 11, 3)['d'], 27)
        for t, h, sig in [('nebel', 9, 4), ('kisteliegtimhafen', 15, 5), ('treffenumfuenfuhr', 8, 2), ('ueberweisezweieuro', 18, 17)]:
            self.assertEqual(K.kryptos_hash(t)['wert'], h)
            self.assertEqual(K.rsa_entschluesseln(h, 27, 55), sig)
            self.assertEqual(K.rsa_verschluesseln(sig, 3, 55), h)
        self.assertEqual(K.kryptos_hash('kisteliegtimhaus')['wert'], 11)
        self.assertNotEqual(K.rsa_verschluesseln(5, 3, 55), 11)
        for args in ((7, 7), (7, 9), (7, 11, 6)):
            self.assertRaises(F, K.rsa_schluessel, *args)
        self.assertRaises(F, K.rsa_verschluesseln, 77, 7, 77)
        self.assertRaises(F, K.rsa_entschluesseln, -1, 43, 77)

    def test_dh(self):
        def werte(p, g, a, b):
            A, B = K.dh_oeffentlich(g, a, p), K.dh_oeffentlich(g, b, p)
            return [A, B, K.dh_gemeinsam(B, a, p), K.dh_gemeinsam(A, b, p)]
        self.assertEqual([werte(17, 3, 4, 6), werte(19, 2, 7, 5), werte(13, 2, 5, 8), werte(29, 2, 5, 8), werte(11, 2, 4, 3)],
                         [[13, 15, 16, 16], [14, 13, 10, 10], [6, 9, 3, 3], [3, 24, 7, 7], [5, 8, 4, 4]])
        self.assertEqual(werte(7, 3, 2, 4)[:3], [2, 4, 2])
        self.assertEqual(werte(101, 2, 37, 58)[:3], [55, 47, 82])
        self.assertEqual(len({K.modpow(7, i, 11) for i in range(1, 11)}), 10)
        M = K.dh_oeffentlich(5, 4, 23)
        self.assertEqual([K.dh_oeffentlich(5, 6, 23), K.dh_oeffentlich(5, 9, 23), M], [8, 11, 4])
        self.assertEqual([K.dh_gemeinsam(M, 6, 23), K.dh_gemeinsam(M, 9, 23), K.dh_gemeinsam(11, 6, 23)], [2, 13, 9])
        self.assertEqual([K.dh_oeffentlich(2, 3, 29), K.dh_gemeinsam(3, 3, 29), K.dh_gemeinsam(24, 3, 29)], [8, 27, 20])
        self.assertEqual([K.dh_dlog_klein(3, 12, 17), K.dh_dlog_klein(2, 3, 29), K.dh_dlog_klein(2, 14, 19), K.dh_dlog_klein(2, 3, 7)],
                         [13, 5, 7, None])
        self.assertRaises(F, K.dh_dlog_klein, 2, 3, 10007)
        self.assertRaises(F, K.dh_oeffentlich, 2, 3, 1)


class VerfahrenBaukasten(unittest.TestCase):
    def test_baukasten_funkgitter(self):
        r = K.baukasten_verschluesseln(FUNKGITTER, {'wort': 'FUNKE'}, 'Wetterbericht fuer die Nordsee')
        self.assertEqual(r['geheimtext'], gross('IMYIW BWHJS JDBPS NGRGQ EYVBL IY'))
        self.assertEqual(r['zwischen'], ['BYGDIWVRBMHBGPYJLQSISIENWJY', gross('IMYIW BWHJS JDBPS NGRGQ EYVBL IY')])
        self.assertEqual(K.baukasten_entschluesseln(FUNKGITTER, {'wort': 'FUNKE'}, 'IMYIW BWHJS JDBPS NGRGQ EYVBL IY'),
                         gross('wetterberichtfuerdienordsee'))
        p = K.baukasten_pruefe(FUNKGITTER, {'wort': 'FUNKE'})
        self.assertEqual((p['ok'], p['fehler'], p['hinweise']), (True, [], []))
        self.assertTrue(K.baukasten_pruefe(FUNKGITTER, {'wort': 'FUNKE'}, klartext='Ebbe und Flut, Wind und Wetter')['ok'])

    def test_baukasten_beispiele(self):
        v1 = lambda typ, param: {'version': 1, 'stufen': [{'typ': typ, 'param': param}]}  # noqa: E731
        self.assertEqual(K.baukasten_verschluesseln(v1('substitution', {'schluesselwort': 'WALZE'}), {}, 'FUNKER')['geheimtext'], 'BSKHEP')
        self.assertEqual(K.baukasten_verschluesseln(v1('xor', {'schluessel': 'AB'}), {}, 'FUNK')['geheimtext'], '07170F09')
        self.assertEqual(K.baukasten_entschluesseln(v1('xor', {'schluessel': 'AB'}), {}, '07 17 0F 09'), 'FUNK')
        l304 = {'version': 1, 'stufen': [{'typ': 'umkehrung'}, {'typ': 'caesar', 'param': {'k': 3}}]}
        self.assertEqual(K.baukasten_verschluesseln(l304, {}, 'boje'), {'geheimtext': 'HMRE', 'zwischen': ['EJOB', 'HMRE']})
        l305 = {'version': 1, 'stufen': [{'typ': 'vigenere', 'param': {'schluessel': 'LUNA'}}, {'typ': 'caesar', 'param': {'k': 5}}]}
        self.assertEqual(K.baukasten_verschluesseln(l305, {}, 'morgenrot')['zwischen'], ['XIEGPHEOE', 'CNJLUMJTJ'])
        self.assertEqual(K.baukasten_entschluesseln(v1('spaltentransposition', {'schluessel': 'TAL'}), {}, 'OKTCA ELHRN'), 'LOCHKARTEN')
        l307 = {'version': 1, 'stufen': [{'typ': 'umkehrung'}, {'typ': 'caesar', 'param': {'k': '$k'}}]}
        self.assertEqual(K.baukasten_entschluesseln(l307, {'k': 11}, 'MLSNT WEVYP FAPEF PSECS PLQRF KESNL YCPO'),
                         gross('dernachtzugfaehrtheutepuenktlichab'))
        self.assertEqual(K.baukasten_verschluesseln(v1('gartenzaun', {'zeilen': 3}), {}, 'versorgung kommt spaet')['geheimtext'],
                         gross('VONMP ESRUG OMSAT RGKTE'))
        self.assertEqual(K.baukasten_verschluesseln(v1('blockrotation', {'block': 4, 'um': 1}), {}, 'baumhoehle')['geheimtext'], 'AUMBOEHHEL')
        pr = K.baukasten_verschluesseln(l307, {'k': 11}, 'ab', protokoll=True)
        self.assertEqual([[s['typ'], s['kuerzel'], s['param'], s['ergebnis']] for s in pr['stufen']],
                         [['umkehrung', 'UMK', {}, 'BA'], ['caesar', 'CAE', {'k': 11}, 'ML']])

    def test_baukasten_stufen(self):
        self.assertEqual([s['kuerzel'] for s in K.BAUKASTEN_STUFEN], ['CAE', 'SUB', 'VIG', 'SPA', 'ZAU', 'ROT', 'UMK', 'XOR'])
        self.assertEqual([s['einordnung'] for s in K.BAUKASTEN_STUFEN],
                         ['mono', 'mono', 'poly', 'transposition', 'transposition', 'transposition', 'transposition', 'poly'])
        st = {s['typ']: s for s in K.BAUKASTEN_STUFEN}
        self.assertEqual(st['gartenzaun']['parameter']['zeilen'], {'art': 'zahl', 'min': 2, 'max': 6})
        self.assertEqual(st['blockrotation']['parameter']['block'], {'art': 'zahl', 'min': 2, 'max': 9})
        self.assertTrue(st['xor']['nur_zuletzt'])
        self.assertEqual(K.BAUKASTEN_MAX_STUFEN, 4)

    def test_baukasten_fehler(self):
        f = lambda v, s=None: K.baukasten_pruefe(v, s or {})['fehler']  # noqa: E731
        eine = lambda typ, param: {'version': 1, 'stufen': [{'typ': typ, 'param': param}]}  # noqa: E731
        xor_vorn = {'version': 1, 'stufen': [{'typ': 'xor', 'param': {'schluessel': 'AB'}}, {'typ': 'umkehrung'}]}
        self.assertTrue(f(xor_vorn))
        self.assertRaises(F, K.baukasten_verschluesseln, xor_vorn, {}, 'abc')
        self.assertTrue(f({'version': 1, 'stufen': [{'typ': 'xor', 'param': {'schluessel': 'A'}}, {'typ': 'xor', 'param': {'schluessel': 'B'}}]}))
        for v in (eine('caesar', {'k': 26}), eine('caesar', {'k': 1.5}), eine('gartenzaun', {'zeilen': 7}),
                  eine('spaltentransposition', {'schluessel': 'ABCDEFGHIJK'}), eine('spaltentransposition', {'schluessel': 'A'}),
                  eine('vigenere', {'schluessel': 'A' * 21}), eine('vigenere', {'schluessel': 'ÄBC'}), eine('blockrotation', {'block': 4, 'um': 4}),
                  eine('blockrotation', {'block': 10, 'um': 1}), eine('substitution', {}), eine('caesar', {'k': 3, 'z': 1}),
                  eine('playfair', {'schluessel': 'X'}), {'version': 1, 'stufen': []}, {'version': 1, 'stufen': [{'typ': 'umkehrung'}] * 5},
                  {'version': 2, 'stufen': [{'typ': 'umkehrung'}]}, {'version': 1, 'name': 'x' * 41, 'stufen': [{'typ': 'umkehrung'}]},
                  {'version': 1, 'name': '<b>', 'stufen': [{'typ': 'umkehrung'}]}):
            self.assertTrue(f(v), v)
        self.assertTrue(f(FUNKGITTER))
        self.assertTrue(f(FUNKGITTER, {'wort': 'FUNKE', 'rest': 3}))
        self.assertTrue(f(eine('caesar', {'k': '$K'}), {'K': 3}))
        self.assertTrue(f(FUNKGITTER, {'wort': 'F'}))
        self.assertFalse(K.baukasten_pruefe(None, {})['ok'])

    def test_baukasten_hinweise(self):
        hin = lambda v, s=None, **o: [h['p'] for h in K.baukasten_pruefe(v, s or {}, **o)['hinweise']]  # noqa: E731
        st = lambda *s: {'version': 1, 'stufen': list(s)}  # noqa: E731
        cae = lambda k: {'typ': 'caesar', 'param': {'k': k}}  # noqa: E731
        self.assertIn('P8', hin(st(cae(3), cae(5))))
        self.assertTrue(K.baukasten_pruefe(st(cae(3), cae(5)), {})['ok'])
        self.assertIn('P8', hin(st({'typ': 'vigenere', 'param': {'schluessel': 'LUNA'}}, cae(5))))
        self.assertIn('P8', hin(st({'typ': 'substitution', 'param': {'schluesselwort': 'A'}}, {'typ': 'substitution', 'param': {'schluesselwort': 'B'}})))
        self.assertIn('P8', hin(st({'typ': 'umkehrung'}, {'typ': 'umkehrung'})))
        self.assertNotIn('P8', hin(st(cae(3), {'typ': 'umkehrung'}, cae(3))))
        self.assertIn('P7', hin(st(cae(0))))
        self.assertIn('P7', hin(st({'typ': 'vigenere', 'param': {'schluessel': 'AAA'}})))
        self.assertIn('P7', hin(st({'typ': 'xor', 'param': {'schluessel': 'A'}})))
        spa = st({'typ': 'spaltentransposition', 'param': {'schluessel': 'ABCDE'}})
        self.assertIn('P7', hin(spa, klartext='abc'))
        self.assertNotIn('P7', hin(spa, klartext='abcdefgh'))
        self.assertIn('P6', hin(st({'typ': 'gartenzaun', 'param': {'zeilen': 3}}, {'typ': 'umkehrung'})))
        nur_sub = K.baukasten_pruefe(st({'typ': 'vigenere', 'param': {'schluessel': 'LUNA'}}), {})['hinweise']
        self.assertTrue(any(h['p'] is None and 'Reihenfolge' in h['text'] for h in nur_sub))
        self.assertEqual(hin(FUNKGITTER, {'wort': 'FUNKE'}), [])

    def test_verfahren_typen_pruefe(self):
        self.assertEqual(list(K.VERFAHREN_TYPEN), ['caesar', 'atbash', 'affin', 'substitution', 'vigenere', 'autokey', 'porta', 'playfair',
                                                   'kreuzquadrat', 'zweiquadrat_zahl', 'polybios', 'adfgvx', 'gartenzaun', 'skytale',
                                                   'fleissner', 'spaltentransposition', 'umkehrung', 'blockrotation', 'xor', 'baukasten', 'frei'])
        self.assertEqual([t for t, e in K.VERFAHREN_TYPEN.items() if e['involutorisch']], ['atbash', 'porta', 'umkehrung'])
        ok = lambda v: K.verfahren_pruefe(v)['ok']  # noqa: E731
        faelle = [({'typ': 'caesar', 'k': 3}, True), ({'typ': 'caesar'}, False), ({'typ': 'caesar', 'k': 26}, False),
                  ({'typ': 'caesar', 'k': 3, 'x': 1}, False), ({'typ': 'affin', 'a': 5, 'b': 6}, True), ({'typ': 'affin', 'a': 13}, False),
                  ({'typ': 'affin', 'a': 5, 'basis': 2}, False), ({'typ': 'substitution', 'schluesselwort': 'KALIF'}, True),
                  ({'typ': 'substitution', 'alphabet': K.schluesselwort_alphabet('KALIF')}, True), ({'typ': 'substitution', 'alphabet': 'ABC'}, False),
                  ({'typ': 'substitution'}, False), ({'typ': 'substitution', 'alphabet': K.ALPHABET, 'schluesselwort': 'A'}, False),
                  ({'typ': 'gartenzaun', 'zeilen': 10}, True), ({'typ': 'gartenzaun', 'zeilen': 11}, False),
                  ({'typ': 'blockrotation', 'block': 16, 'um': 15}, True), ({'typ': 'blockrotation', 'block': 4, 'um': 0}, False),
                  ({'typ': 'skytale', 'umfang': 3, 'fuellzeichen': None}, True), ({'typ': 'fleissner', 'groesse': 4, 'schablone': S1}, True),
                  ({'typ': 'fleissner', 'groesse': 4, 'schablone': [[1, 1], [1, 4], [2, 2], [3, 3]]}, False),
                  ({'typ': 'fleissner', 'groesse': 5, 'schablone': []}, False),
                  ({'typ': 'adfgvx', 'quadrat': 'ZEPLIN18ABCDFGHJKMOQRSTUVWXY02345679', 'schluessel': 'KARL'}, True),
                  ({'typ': 'adfgvx', 'quadrat': 'ZEPPELIN18', 'schluessel': 'KARL'}, False),
                  ({'typ': 'zweiquadrat_zahl', 'q1': 'BRIEFTAUBE', 'q2': 'KOMPASS', 'zahlenschluessel': '3142'}, True),
                  ({'typ': 'zweiquadrat_zahl', 'q1': 'BRIEFTAUBE', 'q2': 'KOMPASS', 'zahlenschluessel': '3152'}, False),
                  ({'typ': 'xor', 'schluessel': 'AB'}, True), ({'typ': 'xor', 'schluesselBits': '0100 0001'}, True),
                  ({'typ': 'xor', 'schluesselBits': '0100'}, False), ({'typ': 'xor'}, False),
                  ({'typ': 'spaltentransposition', 'schluessel': [3, 1, 2]}, True), ({'typ': 'spaltentransposition', 'schluessel': [3, 3, 2]}, False),
                  ({'typ': 'baukasten', 'verfahren': FUNKGITTER, 'schluessel': {'wort': 'FUNKE'}}, True),
                  ({'typ': 'baukasten', 'verfahren': FUNKGITTER, 'schluessel': {}}, False), ({'typ': 'frei', 'name': 'domino'}, True),
                  ({'typ': 'enigma'}, False), (None, False),
                  ({'typ': 'playfair', 'schluessel': 'IMA', 'fuellzeichen': 'Q'}, False),
                  ({'typ': 'playfair', 'schluessel': 'IMA', 'fuellzeichen': 'Q', 'fuellzeichenX': 'Z'}, True)]
        for v, soll in faelle:
            self.assertEqual(ok(v), soll, v)

    def test_verfahren_anwenden(self):
        an = K.verfahren_anwenden
        fg = {'typ': 'baukasten', 'verfahren': FUNKGITTER, 'schluessel': {'wort': 'FUNKE'}}
        faelle = [({'typ': 'caesar', 'k': 6}, 'treffpunktambrunnen', 'ver', 'ZXKLLVATQZGSHXATTKT'),
                  ({'typ': 'caesar', 'k': 11}, 'RPSPT XMZED NSLQE', 'ent', 'GEHEIMBOTSCHAFT'), ({'typ': 'atbash'}, 'caesar', 'ver', 'XZVHZI'),
                  ({'typ': 'affin', 'a': 5, 'b': 6}, 'dattel', 'ver', 'VGXXAJ'),
                  ({'typ': 'affin', 'a': 5, 'b': 6, 'basis': 1}, 'dattel', 'ver', K.affin('dattel', 5, 6, 'ver', 1)),
                  ({'typ': 'substitution', 'schluesselwort': 'KALIF'}, 'mond', 'ver', 'MONI'),
                  ({'typ': 'substitution', 'schluesselwort': 'KALIF', 'rest': 'ab_letztem'}, 'z', 'ver', 'E'),
                  ({'typ': 'substitution', 'alphabet': K.schluesselwort_alphabet('SULTAN')}, 'harun', 'ver', 'CSORI'),
                  ({'typ': 'vigenere', 'schluessel': 'ROT'}, 'kanal', 'ver', 'BOGRZ'), ({'typ': 'autokey', 'schluessel': 'ZU'}, 'ALVEHRA', 'ent', 'BRUNNEN'),
                  ({'typ': 'porta', 'schluessel': 'SIEGEL'}, 'BKPWEZP', 'ent', 'STEMPEL'),
                  ({'typ': 'playfair', 'schluessel': 'RIALTO'}, 'wasserweg', 'ver', 'XIQYUDIVBM'),
                  ({'typ': 'kreuzquadrat', 'oben': 'GONDEL', 'unten': 'MURANO'}, 'mehl', 'ver', 'KCFQ'),
                  ({'typ': 'zweiquadrat_zahl', 'q1': 'BRIEFTAUBE', 'q2': 'KOMPASS', 'zahlenschluessel': '3142'}, 'rat', 'ver', 'QGK'),
                  ({'typ': 'polybios'}, 'rom', 'ver', '423432'), ({'typ': 'polybios', 'schluessel': 'ATHEN'}, '45 51 24 51 31', 'ent', K.atbash('feuer')),
                  ({'typ': 'adfgvx', 'quadrat': 'ZEPLIN18ABCDFGHJKMOQRSTUVWXY02345679', 'schluessel': 'KARL'}, 'nebel4', 'ver', 'XGGADADDDAAX'),
                  ({'typ': 'gartenzaun', 'zeilen': 3}, 'die mauer haelt stand', 'ver', 'DAHTNIMURALSADEEET'),
                  ({'typ': 'skytale', 'umfang': 3}, 'wir halten den pass', 'ver', 'WTPIEARNSHDSAEXLNX'),
                  ({'typ': 'fleissner', 'groesse': 4, 'schablone': S1}, 'athen sendet hilfe', 'ver', 'DNAILTSEHFTENHEE'),
                  ({'typ': 'spaltentransposition', 'schluessel': 'TAL'}, 'OKTCAELHRN', 'ent', 'LOCHKARTEN'),
                  ({'typ': 'umkehrung'}, 'boje', 'ver', 'EJOB'), ({'typ': 'blockrotation', 'block': 4, 'um': 1}, 'baumhoehle', 'ver', 'AUMBOEHHEL'),
                  ({'typ': 'xor', 'schluessel': 'AB'}, 'FUNK', 'ver', '07170F09'),
                  ({'typ': 'xor', 'schluesselBits': '0100 0001 0100 0010'}, '07170F09', 'ent', 'FUNK'),
                  (fg, 'Wetterbericht fuer die Nordsee', 'ver', gross('IMYIW BWHJS JDBPS NGRGQ EYVBL IY')),
                  (fg, 'IMYIWBWHJSJDBPSNGRGQEYVBLIY', 'ent', gross('wetterberichtfuerdienordsee'))]
        for v, t, r, soll in faelle:
            self.assertEqual(an(v, t, r), soll, v)
        self.assertEqual(an({'typ': 'caesar', 'k': 3}, 'W', 'ver', ausgabe='zahlen'), [26])
        self.assertEqual(an({'typ': 'caesar', 'k': 3}, 'W', 'ver', ausgabe='zahlen', basis=0), [25])
        self.assertRaises(F, an, {'typ': 'frei', 'name': 'domino'}, 'abc', 'ver')
        self.assertRaises(F, an, {'typ': 'caesar', 'k': 99}, 'abc', 'ver')
        self.assertRaises(F, an, {'typ': 'caesar', 'k': 3}, 'abc', 'ver', ausgabe='roemisch')

    def test_verfahren_varianten(self):
        va = K.verfahren_varianten
        finde = lambda liste, p, code: [x['text'] for x in liste if x['p'] == p and x['code'] == code]  # noqa: E731
        c = va({'typ': 'caesar', 'k': 6}, 'treffpunkt', 'ver')
        self.assertEqual(finde(c, 'P3', 'richtung'), [K.caesar('treffpunkt', 6, 'ent')])
        self.assertEqual(sorted(finde(c, 'P1', 'zaehlbasis')), sorted([K.caesar('treffpunkt', 5), K.caesar('treffpunkt', 7)]))
        self.assertTrue(all(x['text'] != K.caesar('treffpunkt', 6) for x in c))
        v = va({'typ': 'vigenere', 'schluessel': 'ROT'}, 'kanal', 'ver')
        self.assertIn(K.vigenere('kanal', 'SPU'), finde(v, 'P1', 'zaehlbasis'))
        self.assertIn(K.vigenere('kanal', 'OTR'), finde(v, 'P1', 'position'))
        self.assertIn(K.affin('dattel', 5, 6, 'ver', 1), finde(va({'typ': 'affin', 'a': 5, 'b': 6}, 'dattel', 'ver'), 'P1', 'zaehlbasis'))
        # affin ent: t nach statt vor der Multiplikation abgezogen (SPEC W1 §8): CPQN, (21, 7), m^-1 = 5 -> DQVG
        self.assertEqual(finde(va({'typ': 'affin', 'a': 21, 'b': 7}, 'CPQN', 'ent'), 'P3', 'reihenfolge'), ['DQVG'])
        self.assertEqual(finde(va({'typ': 'affin', 'a': 21, 'b': 7}, 'abc', 'ver'), 'P3', 'reihenfolge'), [])
        sk = va({'typ': 'skytale', 'umfang': 3}, 'wirhaltendenpass', 'ver')
        self.assertEqual(len(finde(sk, 'P3', 'permutation')), 1)
        self.assertIn(K.skytale('wirhaltendenpass', 3, fuellzeichen=None), finde(sk, 'P4', 'fuellung'))
        fl = va({'typ': 'fleissner', 'groesse': 4, 'schablone': S1}, 'athensendethilfe', 'ver')
        self.assertIn(K.fleissner('athensendethilfe', 4, S1, drehung='links'), finde(fl, 'P3', 'permutation'))
        v303 = {'version': 1, 'stufen': [{'typ': 'gartenzaun', 'param': {'zeilen': 3}}, {'typ': 'vigenere', 'param': {'schluessel': 'LUNA'}},
                                         {'typ': 'umkehrung'}]}
        g303 = K.baukasten_verschluesseln(v303, {}, 'sternenhimmel')['geheimtext']
        falsch = K.umkehrung(K.vigenere(K.gartenzaun(g303, 3, 'ent'), 'LUNA', 'ent'))
        self.assertEqual(finde(va({'typ': 'baukasten', 'verfahren': v303, 'schluessel': {}}, g303, 'ent'), 'P3', 'reihenfolge'), [falsch])
        self.assertNotEqual(falsch, 'STERNENHIMMEL')
        self.assertGreaterEqual(len(finde(va({'typ': 'playfair', 'schluessel': 'RIALTO'}, 'ballett', 'ver'), 'P4', 'paare')), 1)
        z = va({'typ': 'caesar', 'k': 3}, 'WXY', 'ver', ausgabe='zahlen')
        self.assertEqual((finde(z, 'P2', 'null_statt_z'), finde(z, 'P2', 'ueberlauf')), ([[0, 1, 2]], [[26, 27, 28]]))
        self.assertEqual(finde(va({'typ': 'caesar', 'k': 3}, 'ABC', 'ent', ausgabe='zahlen'), 'P2', 'negativ'), [[-2, -1, 0]])
        self.assertEqual(va({'typ': 'frei'}, 'abc', 'ver'), [])
        self.assertEqual(finde(va({'typ': 'atbash'}, 'abc', 'ver'), 'P3', 'richtung'), [])


class BibliothekM6I(unittest.TestCase):
    """Plan M6 Task 105 (W0 §9.1, W2 §9.1, W6 §2/§9.1) – dieselben Vektoren wie test/krypto.test.js."""

    def test_raster_schienen_stellungen(self):
        self.assertEqual(K.skytale_raster('wir halten den pass', 3), ['WIRHAL', 'TENDEN', 'PASSXX'])
        self.assertEqual(K.skytale_raster('abcde', 2, fuellzeichen=None), ['ABC', 'DE'])
        self.assertRaises(F, K.skytale_raster, 'abc', 1)
        self.assertEqual(''.join(map(str, K.gartenzaun_schienen(20, 3))), '01210121012101210121')
        self.assertEqual([K.gartenzaun_schienen(20, 3).count(r) for r in range(3)], [5, 10, 5])
        self.assertEqual(K.gartenzaun_schienen(3, 5), [0, 1, 2])
        self.assertRaises(F, K.gartenzaun_schienen, 5, 1)
        self.assertEqual(K.fleissner_stellungen(4, [[1, 2], [2, 1], [2, 3], [4, 4]]), [
            [[1, 2], [2, 1], [2, 3], [4, 4]], [[1, 3], [2, 4], [3, 3], [4, 1]], [[1, 1], [3, 2], [3, 4], [4, 3]],
            [[1, 4], [2, 2], [3, 1], [4, 2]]])
        self.assertEqual(K.fleissner_stellungen(4, [[1, 2]], drehung='links'), [[[1, 2]], [[3, 1]], [[4, 3]], [[2, 4]]])
        self.assertRaises(F, K.fleissner_stellungen, 4, [[5, 1]])
        self.assertEqual(K.fleissner_drehgruppen(4), [[0, 1, 2, 0], [2, 3, 3, 1], [1, 3, 3, 2], [0, 2, 1, 0]])
        self.assertEqual(K.fleissner('boten warten am tor', 4, [[1, 2], [2, 1], [2, 3], [4, 4]]), 'TBNMOTTWOEANRRAE')

    def test_ring_pendel_schluesselstrom(self):
        self.assertEqual(K.ring_folge(8, 5), {'folge': [0, 5, 2, 7, 4, 1, 6, 3], 'nie_gelesen': []})
        self.assertEqual(K.ring_folge(8, 3)['folge'], [0, 3, 6, 1, 4, 7, 2, 5])
        self.assertEqual(K.ring_folge(8, 2), {'folge': [0, 2, 4, 6, 0, 2, 4, 6], 'nie_gelesen': [1, 3, 5, 7]})
        self.assertEqual(K.ring('ZEITMASC', 5), 'ZAICMEST')
        self.assertEqual(K.ring('zeitmaschine', 3), 'ZTSEMCIAHEXIXXNX')
        self.assertEqual(K.ring('ZTSEMCIAHEXIXXNX', 3, 'ent'), 'ZEITMASCHINEXXXX')
        with self.assertRaisesRegex(F, 'teilerfremd'):
            K.ring('ZEITMASC', 2)
        self.assertRaises(F, K.ring, 'ABC', 3, 'ent')
        self.assertEqual(K.vigenere(K.ring('zeitreisebeendet', 3), 'UHRH'), 'TAZLLZZLYLVIHAVK')  # Prüfwert W6-2-e3
        self.assertEqual(K.pendel_folge('SAND'), 'SANDNA')
        self.assertEqual(K.pendel_folge('SAND', 10), 'SANDNASAND')
        self.assertEqual(K.pendel_folge('uhr'), 'UHRH')
        self.assertEqual(K.pendel_folge('A', 3), 'AAA')
        self.assertEqual(K.vigenere('ZAICMESTHRNIFIEE', K.pendel_folge('SAND')), 'RAVFZEKTUUAIXIRH')  # Prüfwert W6-2-e4
        self.assertEqual(K.schluesselstrom('treffen', 'ZU', modus='autokey'), 'ZUTREFF')
        self.assertEqual(K.schluesselstrom('SLXWJJS', 'ZU', modus='autokey', richtung='ent'), 'ZUTREFF')
        self.assertEqual(K.schluesselstrom('abc defg', 'KEY'), 'KEYKEYK')
        self.assertEqual(K.schluesselstrom('a' * 10, 'SAND', modus='pendel'), 'SANDNASAND')
        self.assertRaises(F, K.schluesselstrom, 'abc', 'KEY', modus='beaufort')


class BibliothekM6II(unittest.TestCase):
    """Plan M6 Task 106 (W1 §9.1/§9.2, W2 §9.1 Testfälle 1 und 2)."""

    def test_ngramme_teilsubstitution_muster(self):
        t = 'die dichter und denker der dichten nacht'
        self.assertEqual(K.ngramme(t, n=3, top=1), [{'folge': 'CHT', 'anzahl': 3, 'positionen': [5, 24, 31]}])
        self.assertEqual([(x['folge'], x['anzahl']) for x in K.ngramme(t, n=2, top=10)],
                         [(x['bigramm'], x['anzahl']) for x in K.bigramme(t, top=10)])
        self.assertEqual(K.ngramme('', n=3), [])
        self.assertRaises(F, K.ngramme, t, n=6)
        self.assertEqual(K.substitution('kryptolabor', K.schluesselwort_alphabet('tinte')), 'HQYOSMJTIMQ')
        self.assertEqual(K.teilsubstitution('HQYOS MJTIM Q', {'H': 'k', 'q': 'R', 'S': 'o', 'T': ''}), 'kr··o·····r')
        self.assertEqual(K.teilsubstitution('HQ', {}, unbekannt='_'), '__')
        self.assertRaises(F, K.teilsubstitution, 'HQ', {'H': 'ab'})
        self.assertEqual(K.muster_suchen('ananas', 'ABA'), [0, 1, 2])
        self.assertEqual(K.muster_suchen('ABCABC', 'ABCA'), [0, 1, 2])
        self.assertEqual(K.muster_suchen('abc', 'AA'), [])
        self.assertRaises(F, K.muster_suchen, 'abc', 'A')

    def test_teiler_primfaktoren_koinzidenz(self):
        eve = gross(EVES_BRIEF)
        ks = K.kasiski(eve)
        self.assertEqual(K.teiler_tabelle(ks['abstaende']), ks['teiler'])
        self.assertEqual(K.teiler_tabelle([a for a in ks['abstaende'] if a != 125])[5], 8)
        self.assertEqual(list(K.teiler_tabelle([12], von=2, bis=4)), [2, 3, 4])
        self.assertEqual(K.primfaktoren(40), [2, 2, 2, 5])
        self.assertEqual(K.primfaktoren(125), [5, 5, 5])
        self.assertEqual(K.primfaktoren(1), [])
        self.assertRaises(F, K.primfaktoren, 0)
        self.assertEqual(f'{K.mittlerer_koinzidenzindex(eve, 5):.4f}', '0.0961')
        self.assertEqual(f'{K.mittlerer_koinzidenzindex(eve, 10):.4f}', '0.0988')
        self.assertEqual(f'{K.mittlerer_koinzidenzindex(GOLD_TEXT, 4):.4f}', '0.0914')
        self.assertIsNone(K.mittlerer_koinzidenzindex('A', 3))
        self.assertEqual(K.koinzidenzindex_bruch(eve), {'zaehler': 2434, 'nenner': 51756})
        self.assertEqual(K.koinzidenzindex_bruch(GOLD_TEXT), {'zaehler': 1132, 'nenner': 26082})
        self.assertIsNone(K.koinzidenzindex_bruch('A'))


if __name__ == '__main__':
    unittest.main()
