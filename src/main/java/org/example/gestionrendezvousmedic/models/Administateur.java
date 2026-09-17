package org.example.gestionrendezvousmedic.models;

import jakarta.persistence.Entity;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data

public class Administateur extends User {
    public Administateur() {
        super(Role.ADMIN);
    }

    public Administateur(String name, String email) {
        super(name, email,Role.ADMIN);
    }


}
