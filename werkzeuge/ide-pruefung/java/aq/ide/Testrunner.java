package aq.ide;

import java.lang.reflect.*;
import java.util.*;
import java.util.concurrent.*;

/**
 * Führt das Hauptprogramm und alle @Test-Methoden der übergebenen Klassen aus (je höchstens 3 s, wie ein
 * Testrunner, der eine Endlosschleife abbricht). Ausgabe je Test eine Zeile:
 *   TEST <ok|rot|timeout|fehler> <Klasse>.<Methode> <Meldung>
 * Kryptos: die Ausgabe des Hauptprogramms erscheint zeilenweise als „AUSGABE <Zeile>“ (Vergleich mit der Spec).
 * Aufruf: java aq.ide.Testrunner <Hauptklasse|-> <Testklasse> …
 */
public final class Testrunner {
    static final long LIMIT_MS = 3000;

    static String lauf(Callable<Void> c) {
        ExecutorService ex = Executors.newSingleThreadExecutor(r -> { Thread t = new Thread(null, r, "lauf", 512L << 20); t.setDaemon(true); return t; });
        Future<Void> f = ex.submit(c);
        try {
            f.get(LIMIT_MS, TimeUnit.MILLISECONDS);
            return "ok";
        } catch (TimeoutException e) {
            f.cancel(true);
            return "timeout Zeitlimit " + LIMIT_MS + " ms ueberschritten (Endlosschleife?)";
        } catch (ExecutionException e) {
            Throwable t = e.getCause();
            if (t instanceof InvocationTargetException ite) t = ite.getCause();
            if (t instanceof TestFehler) return "rot " + einzeilig(t.getMessage());
            return "fehler " + t.getClass().getSimpleName() + ": " + einzeilig(String.valueOf(t.getMessage())) + ort(t);
        } catch (InterruptedException e) {
            return "fehler unterbrochen";
        } finally {
            ex.shutdownNow();
        }
    }

    static String ort(Throwable t) {
        for (StackTraceElement s : t.getStackTrace())
            if (s.getClassName().startsWith("aq.prog.")) return " (" + s.getClassName().substring(8) + "." + s.getMethodName() + ")";
        return "";
    }

    static String einzeilig(String s) { return s == null ? "" : s.replace('\n', ' '); }

    public static void main(String[] args) throws Exception {
        java.io.PrintStream echt = System.out;
        if (!args[0].equals("-")) {
            Class<?> haupt = Class.forName("aq.prog." + args[0]);
            Method m = haupt.getDeclaredMethod("main", String[].class);
            m.setAccessible(true);
            java.io.ByteArrayOutputStream puffer = new java.io.ByteArrayOutputStream();
            System.setOut(new java.io.PrintStream(puffer, true, java.nio.charset.StandardCharsets.UTF_8));
            String r = lauf(() -> { m.invoke(null, (Object) new String[0]); return null; });
            System.setOut(echt);
            echt.println("HAUPTPROGRAMM " + r);
            for (String z : puffer.toString(java.nio.charset.StandardCharsets.UTF_8).split("\n", -1))
                if (!z.isEmpty()) echt.println("AUSGABE " + z.replace("\r", ""));
        }
        for (int i = 1; i < args.length; i++) {
            Class<?> k = Class.forName("aq.prog." + args[i]);
            List<Method> tests = new ArrayList<>();
            for (Method m : k.getDeclaredMethods()) if (m.isAnnotationPresent(Test.class)) tests.add(m);
            tests.sort(Comparator.comparing(Method::getName));
            for (Method m : tests) {
                m.setAccessible(true);
                String r;
                if (m.getParameterCount() != 0 || m.getReturnType() != void.class) {
                    r = "fehler Testmethode muss parameterlos und void sein";
                } else {
                    System.setOut(new java.io.PrintStream(java.io.OutputStream.nullOutputStream()));
                    r = lauf(() -> {
                        Constructor<?> c = k.getDeclaredConstructor();
                        c.setAccessible(true);
                        m.invoke(c.newInstance());
                        return null;
                    });
                    System.setOut(echt);
                }
                echt.println("TEST " + r.split(" ", 2)[0] + " " + k.getSimpleName() + "." + m.getName() + " " + (r.contains(" ") ? r.split(" ", 2)[1] : ""));
            }
        }
        echt.flush();
        System.exit(0);
    }
}
