package com.takkas.modules.user;

import com.takkas.common.exception.BusinessRuleException;

import java.util.Locale;
import java.util.regex.Pattern;

public final class UsernameUtils {

    private static final Pattern VALID = Pattern.compile("^[a-z0-9_]{3,30}$");

    private UsernameUtils() {}

    public static String normalize(String raw) {
        if (raw == null) return "";
        String value = raw.trim().toLowerCase(Locale.ROOT)
            .replaceAll("[^a-z0-9_]", "_")
            .replaceAll("_+", "_")
            .replaceAll("^_|_$", "");
        if (value.length() > 30) {
            value = value.substring(0, 30).replaceAll("_+$", "");
        }
        return value;
    }

    public static String slugFromFullName(String fullName) {
        String base = normalize(fullName.replace(' ', '_'));
        if (base.length() < 3) {
            base = "user_" + base;
        }
        return base.length() > 24 ? base.substring(0, 24) : base;
    }

    public static void validate(String username) {
        if (!VALID.matcher(username).matches()) {
            throw new BusinessRuleException(
                "Kullanıcı adı 3-30 karakter olmalı; yalnızca küçük harf, rakam ve _ kullanılabilir.");
        }
    }
}
