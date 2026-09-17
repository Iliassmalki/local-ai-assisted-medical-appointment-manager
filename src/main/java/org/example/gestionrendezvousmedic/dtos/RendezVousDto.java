package org.example.gestionrendezvousmedic.dtos;



import lombok.AllArgsConstructor;
import lombok.Data;
import org.example.gestionrendezvousmedic.models.Status;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
@AllArgsConstructor
@Data
public class RendezVousDto {

    private Long id; // ID is usually only returned, not required on creation

    /** Server-derived on responses; ignored when a patient submits an update. */
    private Long medecinId;

    /** Server-derived on responses; ignored when a patient submits an update. */
    private Long patientId;
private String reason;
    @NotNull(message = "Date is required")
    @Future(message = "Date must be in the future")
    private LocalDateTime date;

    /** Set by the server: a patient's update always returns the request to PENDING. */
    private Status status;

    public RendezVousDto() {}

   }

