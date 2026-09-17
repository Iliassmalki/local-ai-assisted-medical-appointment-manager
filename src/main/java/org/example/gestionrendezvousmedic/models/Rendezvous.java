package org.example.gestionrendezvousmedic.models;

import jakarta.persistence.*;
import lombok.Data;

import java.nio.file.Path;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
public class Rendezvous {


        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        @Column(name = "id")
        private Long id;

        @Column(nullable = false)
        private LocalDateTime date;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "patient_id", nullable = false)
        private Patient patient;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "medecin_id", nullable = false)
        private Medecin medecin;

        @Enumerated(EnumType.STRING)
        @Column(name = "STATUS_", nullable = false)
        private Status status;

        private String reason;
    }

