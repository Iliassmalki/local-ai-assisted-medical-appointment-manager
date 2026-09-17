package org.example.gestionrendezvousmedic.Controller;

import jakarta.validation.ConstraintViolationException;
import jakarta.validation.constraints.NotBlank;
import org.example.gestionrendezvousmedic.Exception.PatientNotFoundNotadmin;
import org.example.gestionrendezvousmedic.dtos.CreateRendezvousDTO;
import org.example.gestionrendezvousmedic.dtos.PatientDashboardDto;
import org.example.gestionrendezvousmedic.dtos.RendezVousDto;
import org.example.gestionrendezvousmedic.models.Patient;
import org.example.gestionrendezvousmedic.models.Status;
import org.example.gestionrendezvousmedic.repos.PatientRepository;
import org.example.gestionrendezvousmedic.services.PatientService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/patient")
@PreAuthorize("hasRole('PATIENT')")
public class PatientControler {

    private static final Logger logger = LoggerFactory.getLogger(PatientControler.class);

    @Autowired
    private PatientService patientService;

    @Autowired
    private PatientRepository patientRepository;

    // 📊 Patient dashboard
    @GetMapping("/dashboard")
    public ResponseEntity<PatientDashboardDto> getDashboard(Authentication authentication) {
        String email = authentication.getName();
        logger.info("Getting dashboard for patient with email: {}", email);

        Patient patient = patientRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Patient not found"));

        PatientDashboardDto dashboard = patientService.dashboard(patient.getId());
        return ResponseEntity.ok(dashboard);
    }

    // 📅 Create rendezvous
  /*  @PostMapping("/rendezvous/create/{medecinemail}")
    public ResponseEntity<RendezVousDto> createRendezvous(
            Authentication authentication,
            @Valid @RequestBody RendezVousDto input,
            @PathVariable @NotBlank(message = "Nom du médecin requis") String medecinemail) {
        // Extract patientId from JWT
        String email = authentication.getName();
        Patient patient = patientRepository.findByEmail(email)
                .orElseThrow(() -> new PatientNotFoundNotadmin("Patient non trouvé"));

        // Ensure input.patientId matches authenticated patient
        if (!patient.getId().equals(input.getPatientId())) {
            throw new IllegalStateException("Vous ne pouvez pas créer un rendez-vous pour un autre patient");
        }
        try {
            RendezVousDto created = patientService.CreatRendezVousDto(input, patient.getId(), medecinemail);
            logger.info("Rendezvous created successfully: {}", created);
            return ResponseEntity.ok(created);
        } catch (Exception ex) {
            logger.error("Error creating Rendezvous: {}", ex.getMessage(), ex);
            throw ex;
        }

    } */
    @PostMapping("/assign")
    public ResponseEntity<RendezVousDto> createRendezvous(
            Authentication authentication,
            @Valid @RequestBody CreateRendezvousDTO input) {
        logger.info("Request to create Rendezvous: input={}", input);

        // Extract patientId from JWT
        String email = authentication.getName();
        input.setPatientEmail(email);
        logger.debug("Fetching Patient: email={}", email);
        Patient patient = patientRepository.findByEmail(email)
                .orElseThrow(() -> {
                    logger.error("Patient not found: email={}", email);
                    return new PatientNotFoundNotadmin("Patient non trouvé");
                });

        // Validate patientEmail matches JWT

        // Create Rendezvous
        logger.debug("Calling RendezvousService: patientId={}", patient.getId());
        RendezVousDto created = patientService.assignRendezVous(input, patient.getId());
        logger.info("Rendezvous created: id={}", created.getId());
        return ResponseEntity.ok(created);
    }


    // ❌ Delete rendezvous
    @DeleteMapping("/delete/{rendezvousId}")
    public ResponseEntity<Void> deleteRendezvous(
            Authentication authentication,
            @PathVariable Long rendezvousId) {
        logger.info("Request to delete Rendezvous: id={}", rendezvousId);

        // Extract patientId from JWT
        String email = authentication.getName();
        logger.debug("Fetching Patient: email={}", email);
        Patient patient = patientRepository.findByEmail(email)
                .orElseThrow(() -> {
                    logger.error("Patient not found: email={}", email);
                    return new PatientNotFoundNotadmin("Patient non trouvé");
                });

        // Delete Rendezvous
        patientService.deleteRendezVous(rendezvousId, patient.getId());
        logger.info("Rendezvous deleted: id={}", rendezvousId);
        return ResponseEntity.noContent().build();
    }
    @ExceptionHandler(PatientNotFoundNotadmin.class)
    public ResponseEntity<String> handlePatientNotFound(PatientNotFoundNotadmin ex) {
        logger.error("PatientNotFoundNotadmin: {}", ex.getMessage());
        return new ResponseEntity<>(ex.getMessage(), HttpStatus.NOT_FOUND);
    }
    @PutMapping("/update/{rendezvousId}")
    public ResponseEntity<RendezVousDto> updateRendezvous(
            Authentication authentication,
            @PathVariable Long rendezvousId,
            @Valid @RequestBody RendezVousDto input) {
        logger.info("Request to update Rendezvous: id={}", rendezvousId);

        // Extract patientId from JWT
        String email = authentication.getName();
        logger.debug("Fetching Patient: email={}", email);
        Patient patient = patientRepository.findByEmail(email)
                .orElseThrow(() -> {
                    logger.error("Patient not found: email={}", email);
                    return new PatientNotFoundNotadmin("Patient non trouvé");
                });
input.setStatus(Status.PENDING);
        // Update Rendezvous
       RendezVousDto updated = patientService.updateRendezVous(rendezvousId,input,patient.getId());
        logger.info("Rendezvous updated: id={}", rendezvousId);
        return ResponseEntity.ok(updated);
    }


    @ExceptionHandler({IllegalStateException.class, IllegalArgumentException.class})
    public ResponseEntity<String> handleIllegalState(Exception ex) {
        logger.error("Validation error: {}", ex.getMessage());
        return new ResponseEntity<>(ex.getMessage(), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<String> handleConstraintViolation(ConstraintViolationException ex) {
        logger.error("Validation error: {}", ex.getMessage());
        return new ResponseEntity<>(ex.getMessage(), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleGenericException(Exception ex) {
        logger.error("Unexpected error: {}", ex.getMessage(), ex);
        return new ResponseEntity<>("Erreur interne du serveur", HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
