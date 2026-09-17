package org.example.gestionrendezvousmedic.services;

import io.jsonwebtoken.JwtException;
import org.example.gestionrendezvousmedic.models.Role;
import org.example.gestionrendezvousmedic.models.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Token issuance and validation. No Spring context and no database — the two
 * {@code @Value} fields are injected directly.
 */
class JwtServiceTest {

    /** Test-only signing key, unrelated to any deployed configuration. */
    private static final String TEST_KEY = "bWVkb3JhLXVuaXQtdGVzdC1zaWduaW5nLWtleS0yNTZiaXRzISE=";

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKey", TEST_KEY);
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", 3_600_000L);
    }

    private static User user(String email, Role role) {
        return new User("Test User", email, role);
    }

    @Test
    @DisplayName("the subject of the token is the user's email")
    void subjectIsTheEmail() {
        String token = jwtService.generateToken(user("patient@example.com", Role.PATIENT));

        assertEquals("patient@example.com", jwtService.extractUsername(token));
    }

    @Test
    @DisplayName("the granted authority is carried as a claim")
    void authorityIsCarriedAsAClaim() {
        String token = jwtService.generateToken(user("doctor@example.com", Role.MEDECIN));

        Object roles = jwtService.extractClaim(token, claims -> claims.get("role"));

        assertEquals(List.of("ROLE_MEDECIN"), roles);
    }

    @Test
    @DisplayName("a token is valid for the user it was issued to")
    void tokenIsValidForItsOwner() {
        User owner = user("patient@example.com", Role.PATIENT);

        assertTrue(jwtService.isTokenValid(jwtService.generateToken(owner), owner));
    }

    @Test
    @DisplayName("a token issued to one user is not valid for another")
    void tokenIsNotValidForSomeoneElse() {
        String token = jwtService.generateToken(user("patient@example.com", Role.PATIENT));

        assertFalse(jwtService.isTokenValid(token, user("other@example.com", Role.PATIENT)));
    }

    @Test
    @DisplayName("a token signed with a different key is rejected")
    void tokenSignedWithAnotherKeyIsRejected() {
        JwtService attacker = new JwtService();
        ReflectionTestUtils.setField(attacker, "secretKey",
                "YW5vdGhlci1rZXktdGhhdC1pcy1sb25nLWVub3VnaC0yNTZiaXRz");
        ReflectionTestUtils.setField(attacker, "jwtExpiration", 3_600_000L);

        String forged = attacker.generateToken(user("patient@example.com", Role.PATIENT));

        assertThrows(JwtException.class, () -> jwtService.extractUsername(forged));
    }

    @Test
    @DisplayName("a tampered payload invalidates the signature")
    void tamperedTokenIsRejected() {
        String token = jwtService.generateToken(user("patient@example.com", Role.PATIENT));
        String[] parts = token.split("\\.");
        String tampered = parts[0] + "." + parts[1] + "x." + parts[2];

        assertThrows(JwtException.class, () -> jwtService.extractUsername(tampered));
    }
}
