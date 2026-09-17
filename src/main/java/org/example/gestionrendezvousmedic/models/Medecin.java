package org.example.gestionrendezvousmedic.models;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.example.gestionrendezvousmedic.dtos.PatientDto;

import java.util.ArrayList;
import java.util.List;
@Entity
@Table(name = "medecin") // lowercase table names are a best practice
@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Medecin extends User {

    @Column(name = "specialite")
    private String specialite;

    @OneToMany(mappedBy = "medecin", cascade = CascadeType.ALL,fetch = FetchType.LAZY)
    private List<Patient> patients=new ArrayList<>();

    public Medecin(String name, String email, String password, Role role, String specialite) {
        super(name, email, role);
        this.setPassword(password);
        this.specialite = specialite;
    }
    @Override
    public String toString() {
        return "Medecin{id=" + getId() + ", name='" + getName() + "', specialite='" + specialite + "'}";
    }
}

