package org.example.gestionrendezvousmedic.Controller;

import jakarta.validation.Valid;
import org.example.gestionrendezvousmedic.dtos.LoginUserDto;
import org.example.gestionrendezvousmedic.dtos.RefreshRequest;
import org.example.gestionrendezvousmedic.dtos.RegisterUserDto;
import org.example.gestionrendezvousmedic.services.AuthenticationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationService authService;

    @PostMapping("/signup/patient")
    public ResponseEntity<?> registerPatient(@Valid @RequestBody RegisterUserDto dto) {
        return ResponseEntity.ok(authService.signupPatient(dto));
    }

    @PostMapping("/signup/medecin")
    public ResponseEntity<?> registerMedecin(@Valid @RequestBody RegisterUserDto dto) {
        return ResponseEntity.ok(authService.signupMedecin(dto));
    }

    @PostMapping("/signup/admin")
    public ResponseEntity<?> registerAdmin(@Valid @RequestBody RegisterUserDto dto) {
        return ResponseEntity.ok(authService.signupAdmin(dto));
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@Valid @RequestBody RefreshRequest request) {
        return ResponseEntity.ok(authService.refresh(request));
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticate(@Valid @RequestBody LoginUserDto dto) {


         switch (dto.getRole()) {
         case ADMIN:
           return ResponseEntity.ok(authService.authenticateAdmin(dto));
          case MEDECIN:
          return ResponseEntity.ok(authService.authenticateMedecin(dto));
         case PATIENT:
        return ResponseEntity.ok(authService.authenticatePatient(dto));
           default:
         return ResponseEntity.badRequest().body("Invalid role specified.");
         }
         }}
