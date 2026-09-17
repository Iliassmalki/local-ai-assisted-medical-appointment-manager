package org.example.gestionrendezvousmedic.models;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;
import java.util.Objects;

@EqualsAndHashCode(callSuper = true)
@Entity
@Data


public class Patient extends User {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medecin_id")

    Medecin medecin;

  @OneToMany(mappedBy = "patient")
List<Rendezvous> listRendezvous;

    public Patient(List<Rendezvous> listRendezvous) {
        this.listRendezvous = listRendezvous;
    }

    public Patient(String name, String email, List<Rendezvous> listRendezvous) {
        super(name, email, Role.PATIENT);
        //this.listRendezvous = listRendezvous;
    }

    public Patient() {
super(Role.PATIENT);
    }
    @Override
    public String toString() {
        return "Patient{id=" + getId() + ", name='" + getName() + "'}";
    }

}
