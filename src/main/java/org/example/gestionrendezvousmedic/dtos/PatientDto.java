package org.example.gestionrendezvousmedic.dtos;

import jakarta.persistence.Column;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.gestionrendezvousmedic.models.Medecin;

import jakarta.validation.constraints.NotNull;

import jakarta.validation.constraints.Size;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PatientDto {

    private Long id; // Optional for updates, ignored for creation

    @NotBlank(message = "Patient ID is required")
    @Size(max = 100, message = "Name must be less than 100 characters")
    private String name;

    @NotNull(message = "Patient ID is required")
    @Email(regexp = "[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,3}",
            flags = Pattern.Flag.CASE_INSENSITIVE)
    private String email;
    /** Only populated on creation; never returned and not required on updates. */
    @Size(max = 100, message = "Password must be at most 100 characters")
    private String password;

    public PatientDto(String name, Long id, String email) {
        this.name = name;
        this.id = id;
        this.email = email;
    }

}
