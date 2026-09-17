package org.example.gestionrendezvousmedic.Exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class AppointmentNotfoundNotadmin extends RuntimeException {
    public AppointmentNotfoundNotadmin(String message) {
        super(message);
    }
}
