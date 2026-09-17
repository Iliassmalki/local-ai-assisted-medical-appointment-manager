package org.example.gestionrendezvousmedic.Exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;
@ResponseStatus(HttpStatus.FORBIDDEN)
public class NotAuth extends RuntimeException {

    public NotAuth(String message) {
        super(message);
    }
}
