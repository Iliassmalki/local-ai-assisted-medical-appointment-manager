package org.example.gestionrendezvousmedic.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;

import jakarta.validation.constraints.NotNull;
@AllArgsConstructor
@Data
public class AssignPatientDto {

    @NotNull(message = "Patient email is required")
    private String patientemail;

    @NotNull(message = "Medecin ID is required")
    private Long medecinId;
}
