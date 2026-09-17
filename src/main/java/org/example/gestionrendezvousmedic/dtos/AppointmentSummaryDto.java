package org.example.gestionrendezvousmedic.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;
import org.example.gestionrendezvousmedic.models.Status;

import java.time.LocalDateTime;
@AllArgsConstructor
@Data
@Getter
@Setter
public class AppointmentSummaryDto {
    private String patientName;
    private LocalDateTime appointmentDate;
    private Status status;

    public AppointmentSummaryDto() {}


}
