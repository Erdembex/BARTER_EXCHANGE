package com.takkas.common.pagination;

import java.time.Instant;

/** PostgreSQL ile uyumlu cursor tabanlı sayfalama yardımcıları. */
public final class CursorPagination {

    /** Instant.MAX JDBC/PostgreSQL tarafında geçersiz timestamp üretir. */
    public static final Instant FIRST_PAGE_CURSOR = Instant.parse("9999-12-31T23:59:59.999999Z");

    private CursorPagination() {}

    public static Instant effectiveCursor(Instant cursor) {
        return cursor != null ? cursor : FIRST_PAGE_CURSOR;
    }
}
