package org.example.gestionrendezvousmedic.dtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterUserDto {

    @NotBlank(message = "Le nom est requis")
    @Size(max = 100, message = "Le nom ne peut pas dépasser 100 caractères")
    private String name;

    @NotBlank(message = "L'adresse e-mail est requise")
    @Email(message = "Adresse e-mail invalide")
    private String email;

    @NotBlank(message = "Le mot de passe est requis")
    @Size(min = 6, max = 100, message = "Le mot de passe doit contenir au moins 6 caractères")
    private String password;

    /** Practitioners only; ignored for the other roles. */
    @Size(max = 100, message = "La spécialité ne peut pas dépasser 100 caractères")
    private String specialite;
}
