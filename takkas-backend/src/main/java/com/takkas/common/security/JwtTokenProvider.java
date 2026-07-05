package com.takkas.common.security;

import com.takkas.modules.user.domain.User;
import com.takkas.modules.user.domain.enums.UserType;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtTokenProvider {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.access-token-expiry-ms}")
    private long accessTokenExpiryMs;

    public String generateAccessToken(User user, UUID profileId) {
        return Jwts.builder()
            .subject(user.getId().toString())
            .claim("email",     user.getEmail())
            .claim("userType",  user.getUserType().name())
            .claim("profileId", profileId.toString())
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + accessTokenExpiryMs))
            .signWith(getSigningKey())
            .compact();
    }

    public Claims parseToken(String token) {
        return Jwts.parser()
            .verifyWith(getSigningKey())
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    public boolean validateToken(String token) {
        try { parseToken(token); return true; }
        catch (JwtException | IllegalArgumentException e) { return false; }
    }

    public UserPrincipal principalFromToken(String token) {
        Claims c = parseToken(token);
        return new UserPrincipal(
            UUID.fromString(c.getSubject()),
            c.get("email", String.class),
            UserType.valueOf(c.get("userType", String.class)),
            UUID.fromString(c.get("profileId", String.class))
        );
    }

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(java.nio.charset.StandardCharsets.UTF_8));
    }
}
