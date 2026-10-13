package aq.ide;

import java.lang.annotation.*;

/** Nachbau der @Test-Annotation der Online-IDE (Testrunner). */
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface Test {}
