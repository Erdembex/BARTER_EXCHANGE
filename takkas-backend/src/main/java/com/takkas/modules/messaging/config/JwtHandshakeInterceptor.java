package com.takkas.modules.messaging.config;

import com.takkas.common.security.JwtTokenProvider;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.*;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.*;

@Component
@RequiredArgsConstructor
public class JwtHandshakeInterceptor implements HandshakeInterceptor {

    private final JwtTokenProvider tokenProvider;

    @Override
    public boolean beforeHandshake(ServerHttpRequest req, ServerHttpResponse res,
                                    WebSocketHandler h, Map<String, Object> attrs) {
        String token = extractToken(req);
        if (token == null || !tokenProvider.validateToken(token)) {
            res.setStatusCode(HttpStatus.UNAUTHORIZED);
            return false;
        }
        Claims claims = tokenProvider.parseToken(token);
        attrs.put("userId",    UUID.fromString(claims.getSubject()));
        attrs.put("userType",  claims.get("userType", String.class));
        attrs.put("profileId", UUID.fromString(claims.get("profileId", String.class)));
        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest req, ServerHttpResponse res,
                                WebSocketHandler h, Exception ex) {}

    private String extractToken(ServerHttpRequest req) {
        List<String> auth = req.getHeaders().get("Authorization");
        if (auth != null && !auth.isEmpty() && auth.get(0).startsWith("Bearer "))
            return auth.get(0).substring(7);
        String query = req.getURI().getQuery();
        if (query != null) for (String p : query.split("&"))
            if (p.startsWith("token=")) return p.substring(6);
        return null;
    }
}
