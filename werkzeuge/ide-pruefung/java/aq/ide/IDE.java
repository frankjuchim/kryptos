package aq.ide;

/**
 * Globale Funktionen der Online-IDE (online-ide.de): println/print ohne System.out und die
 * JUnit-Zusicherungen des Testrunners (Meldung als letztes Argument).
 * Vergleich in assertEquals: Zahlen numerisch (int 3 == double 3.0), Zeichenketten inhaltlich, sonst equals.
 */
public final class IDE {
    private IDE() {}

    public static void println() { System.out.println(); }
    public static void println(Object o) { System.out.println(o); }
    public static void println(char[] c) { System.out.println(c); }
    public static void print(Object o) { System.out.print(o); }

    static boolean gleich(Object erwartet, Object tatsaechlich) {
        if (erwartet == null || tatsaechlich == null) return erwartet == tatsaechlich;
        if (erwartet instanceof Number a && tatsaechlich instanceof Number b) return a.doubleValue() == b.doubleValue();
        if (erwartet instanceof Character a && tatsaechlich instanceof Number b) return (int) a == b.doubleValue();
        if (erwartet instanceof Number a && tatsaechlich instanceof Character b) return a.doubleValue() == (int) b;
        return erwartet.equals(tatsaechlich);
    }

    public static void assertEquals(Object erwartet, Object tatsaechlich, String meldung) {
        if (!gleich(erwartet, tatsaechlich))
            throw new TestFehler(meldung + " [erwartet: " + erwartet + ", tatsaechlich: " + tatsaechlich + "]");
    }
    public static void assertEquals(Object erwartet, Object tatsaechlich) { assertEquals(erwartet, tatsaechlich, ""); }
    public static void assertTrue(boolean b, String meldung) { if (!b) throw new TestFehler(meldung); }
    public static void assertTrue(boolean b) { assertTrue(b, ""); }
    public static void assertFalse(boolean b, String meldung) { if (b) throw new TestFehler(meldung); }
    public static void assertFalse(boolean b) { assertFalse(b, ""); }
    public static void fail(String meldung) { throw new TestFehler(meldung); }
    public static void fail() { fail(""); }
}
