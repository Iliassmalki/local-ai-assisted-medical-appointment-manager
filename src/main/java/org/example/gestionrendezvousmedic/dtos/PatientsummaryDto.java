package org.example.gestionrendezvousmedic.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import org.springframework.web.bind.annotation.GetMapping;

@Data
@Getter
@AllArgsConstructor
public class PatientsummaryDto {
    String name;
    String email;

}
