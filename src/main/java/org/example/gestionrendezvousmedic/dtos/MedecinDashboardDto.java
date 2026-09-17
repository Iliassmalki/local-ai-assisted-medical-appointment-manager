package org.example.gestionrendezvousmedic.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;
import org.example.gestionrendezvousmedic.dtos.AppointmentSummaryDto;
import org.example.gestionrendezvousmedic.models.Patient;

import java.util.List;
@Data
@Getter
@Setter
@AllArgsConstructor
public class MedecinDashboardDto {

    private int totalAppointments;
    private int totalPatients;
    private List<AppointmentSummaryDto> recentAppointments;
    private  List<PatientsummaryDto> listofclients;

    // Constructors
    public MedecinDashboardDto() {}


    // Getters and Setters
    public int getTotalAppointments() {
        return totalAppointments;
    }

    public void setTotalAppointments(int totalAppointments) {
        this.totalAppointments = totalAppointments;
    }

    public int getTotalPatients() {
        return totalPatients;
    }

    public void setTotalPatients(int totalPatients) {
        this.totalPatients = totalPatients;
    }

    public List<AppointmentSummaryDto> getRecentAppointments() {
        return recentAppointments;
    }

    public void setRecentAppointments(List<AppointmentSummaryDto> recentAppointments) {
        this.recentAppointments = recentAppointments;
    }
}
