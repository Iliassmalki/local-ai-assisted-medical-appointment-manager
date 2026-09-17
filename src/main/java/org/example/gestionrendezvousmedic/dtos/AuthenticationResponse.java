package org.example.gestionrendezvousmedic.dtos;

import lombok.Builder;
import lombok.Data;

/**
 * Issued on signup, login and refresh. {@code token} is the short-lived access
 * token sent on every request; {@code refreshToken} is exchanged at
 * {@code /api/auth/refresh} when the access token expires.
 */
@Data
@Builder
public class AuthenticationResponse {

    private String token;
    private String refreshToken;
    private long expiresIn;

    public AuthenticationResponse() {}

    public AuthenticationResponse(String token, String refreshToken, long expiresIn) {
        this.token = token;
        this.refreshToken = refreshToken;
        this.expiresIn = expiresIn;
    }
}
