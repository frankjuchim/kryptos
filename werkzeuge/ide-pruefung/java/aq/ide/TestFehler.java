package aq.ide;

/** Fehlgeschlagene Zusicherung (assertEquals, assertTrue, assertFalse, fail). */
public class TestFehler extends RuntimeException {
    public TestFehler(String meldung) { super(meldung); }
}
