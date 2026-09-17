package org.example.gestionrendezvousmedic.services;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

/**
 * Issues and verifies the two tokens the API uses:
 * <ul>
 *   <li>an <b>access token</b>, short-lived, sent on every request;</li>
 *   <li>a <b>refresh token</b>, longer-lived, exchanged at {@code /api/auth/refresh}
 *       for a new access token.</li>
 * </ul>
 * Both are HS256-signed. The {@code typ} claim distinguishes them so a refresh token
 * cannot be replayed as an access token, or the other way round.
 */
@Service
public class JwtService {

    static final String CLAIM_TYPE = "typ";
    static final String TYPE_ACCESS = "access";
    static final String TYPE_REFRESH = "refresh";

    @Value("${security.jwt.secret-key}")
    private String secretKey;

    @Value("${security.jwt.expiration-time}")
    private long jwtExpiration;

    @Value("${security.jwt.refresh-expiration-time}")
    private long refreshExpiration;

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        return claimsResolver.apply(extractAllClaims(token));
    }

    /** Access token: subject = email, {@code role} = granted authorities. */
    public String generateToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", userDetails.getAuthorities().stream()
                .map(auth -> auth.getAuthority())
                .toList());
        claims.put(CLAIM_TYPE, TYPE_ACCESS);
        return buildToken(claims, userDetails, jwtExpiration);
    }

    /** Refresh token: carries no authorities, only enough to re-issue an access token. */
    public String generateRefreshToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        claims.put(CLAIM_TYPE, TYPE_REFRESH);
        return buildToken(claims, userDetails, refreshExpiration);
    }

    public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        return buildToken(extraClaims, userDetails, jwtExpiration);
    }

    public long getExpirationTime() {
        return jwtExpiration;
    }

    public long getRefreshExpirationTime() {
        return refreshExpiration;
    }

    private String buildToken(Map<String, Object> extraClaims, UserDetails userDetails, long expiration) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .setClaims(extraClaims)
                .setSubject(userDetails.getUsername())
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(now + expiration))
                .signWith(getSignInKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    /** A token is usable as an access token only if it belongs to this user and has not expired. */
    public boolean isTokenValid(String token, UserDetails userDetails) {
        return isTokenValid(token, userDetails, TYPE_ACCESS);
    }

    public boolean isRefreshTokenValid(String token, UserDetails userDetails) {
        return isTokenValid(token, userDetails, TYPE_REFRESH);
    }

    private boolean isTokenValid(String token, UserDetails userDetails, String expectedType) {
        final Claims claims = extractAllClaims(token);
        // Tokens issued before the typ claim existed are treated as access tokens.
        final Object type = claims.get(CLAIM_TYPE);
        final String actualType = type == null ? TYPE_ACCESS : type.toString();

        return expectedType.equals(actualType)
                && userDetails.getUsername().equals(claims.getSubject())
                && claims.getExpiration().after(new Date());
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSignInKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Key getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
