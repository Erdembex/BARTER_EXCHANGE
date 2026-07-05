package com.takkas.common.pagination;

import java.time.Instant;
import java.util.List;

public record PageResponse<T>(
    List<T> content,
    Instant nextCursor,
    boolean hasMore
) {
    public static <T> PageResponse<T> of(List<T> content, Instant nextCursor) {
        return new PageResponse<>(content, nextCursor, nextCursor != null);
    }
}
