package org.example.gestionrendezvousmedic.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
 @AllArgsConstructor
@Data
public class AdminDashboardDto {
    private int totalUsers;
    private int totalAppointments;
    private int activeDoctors;
    private int activePatients;


    // getters and setters
}
