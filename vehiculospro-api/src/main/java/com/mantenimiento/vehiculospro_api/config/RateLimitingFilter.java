package com.mantenimiento.vehiculospro_api.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Filtro de Seguridad Anti-Fuerza Bruta y Anti-DDoS para endpoints críticos de autenticación.
 * Bloquea ataques de diccionario limitando las solicitudes por dirección IP.
 */
@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final int MAX_LOGIN_REQUESTS_PER_MINUTE = 15;
    private final Map<String, RequestCounter> requestCountsPerIp = new ConcurrentHashMap<>();

    private static class RequestCounter {
        final AtomicInteger count = new AtomicInteger(0);
        volatile long windowStartTime = System.currentTimeMillis();

        synchronized boolean allowRequest(int maxRequests) {
            long now = System.currentTimeMillis();
            if (now - windowStartTime > 60000L) { // 1 minuto
                count.set(1);
                windowStartTime = now;
                return true;
            }
            return count.incrementAndGet() <= maxRequests;
        }
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();

        // Aplicar rate limiting estricto a intentos de login
        if (path.startsWith("/api/auth/login") && "POST".equalsIgnoreCase(request.getMethod())) {
            String clientIp = getClientIp(request);
            RequestCounter counter = requestCountsPerIp.computeIfAbsent(clientIp, k -> new RequestCounter());

            if (!counter.allowRequest(MAX_LOGIN_REQUESTS_PER_MINUTE)) {
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType("application/json");
                response.setCharacterEncoding("UTF-8");
                response.getWriter().write("{\"error\": \"Demasiados intentos de acceso desde esta dirección IP. Por seguridad, espere 1 minuto antes de reintentar.\", \"success\": false}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isBlank() || "unknown".equalsIgnoreCase(xfHeader)) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }
}
