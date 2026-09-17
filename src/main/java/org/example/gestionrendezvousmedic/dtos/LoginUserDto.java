package org.example.gestionrendezvousmedic.dtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.example.gestionrendezvousmedic.models.Role;

@Data
public class LoginUserDto {

    @NotBlank(message = "L'adresse e-mail est requise")
    @Email(message = "Adresse e-mail invalide")
    private String email;

    @NotBlank(message = "Le mot de passe est requis")
    private String password;

    /** Selects which account type the credentials are checked against. */
    @NotNull(message = "Le rôle est requis")
    private Role role;
}
