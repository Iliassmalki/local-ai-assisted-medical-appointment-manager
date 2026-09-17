package org.example.gestionrendezvousmedic.Controller;

import org.example.gestionrendezvousmedic.Exception.Medecinnotfound;
import org.example.gestionrendezvousmedic.Exception.NotAuth;
import org.example.gestionrendezvousmedic.dtos.AssignPatientDto;
import org.example.gestionrendezvousmedic.dtos.MedecinDashboardDto;
import org.example.gestionrendezvousmedic.dtos.PatientDto;
import org.example.gestionrendezvousmedic.dtos.RendezVousDto;
import org.example.gestionrendezvousmedic.models.Medecin;
import org.example.gestionrendezvousmedic.repos.MedecinRepository;
import org.example.gestionrendezvousmedic.services.MedecinService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/medecin")
@PreAuthorize("hasRole('MEDECIN')")
public class MedecinController {
    private static final Logger logger = LoggerFactory.getLogger(MedecinController.class);

    @Autowired
    private MedecinService medecinService;
    @Autowired
    private MedecinRepository medecinRepository;

    @GetMapping("/dashboard")
    public ResponseEntity<MedecinDashboardDto> getMedecinDashboard(Authentication authentication) {
        logger.info("Fetching dashboard for user: {}", authentication.getName());
        String email = authentication.getName();

        Medecin medecin = medecinRepository.findByEmail(email)
                .orElseThrow(() -> {
                    logger.error("Medecin not found for email: {}", email);
                    return new RuntimeException("Medecin not found");
                });

        MedecinDashboardDto dashboard = medecinService.getDashboardData(medecin.getId());
        return ResponseEntity.ok(dashboard);
    }

    @PutMapping("/updatePatient/{PatientId}")
    public ResponseEntity<PatientDto> updatePatient(Authentication authentication,
                                                    @PathVariable Long PatientId,
                                                    @RequestBody PatientDto updateDto) {
        String email = authentication.getName();
        Medecin medecin = medecinRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("Medecin not found"));

        PatientDto updatedPatient = medecinService.updatePatient(medecin.getId(), PatientId, updateDto);
        return ResponseEntity.ok(updatedPatient);
    }

    @DeleteMapping("/deletePatient/{PatientId}")
    public ResponseEntity<?> deletePatient(@PathVariable Long PatientId,
                                           Authentication authentication,
                                           @RequestBody PatientDto deleteDto) {
        String email = authentication.getName();
        Medecin medecin = medecinRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("Medecin not found"));
        medecinService.deletePatient(medecin.getId(), deleteDto.getId());
        return ResponseEntity.ok().build();

    }

    @PostMapping("/addpatient/{pemail}")
    public ResponseEntity<AssignPatientDto> CreatePatient(@PathVariable String pemail, Authentication authentication) {
        String email = authentication.getName();
        Medecin medecin = medecinRepository.findByEmail(email).orElseThrow(() -> new Medecinnotfound("Medecin not found"));

        AssignPatientDto addedPatient = medecinService.addPatient(medecin.getId(), pemail);
        return new ResponseEntity<>(addedPatient, HttpStatus.CREATED);

    }

    @PutMapping("/getallpatients")
    public ResponseEntity<List<PatientDto>> GetallPatients(Authentication authentication) {
        String email = authentication.getName();
        Medecin medecin = medecinRepository.findByEmail(email)
                .orElseThrow(() -> new Medecinnotfound("Medecin not found"));

        List<PatientDto> patients = medecinService.getAllPatients(medecin.getId());
        return ResponseEntity.ok(patients);
    }

    // ✅ Get One Patient
    @PutMapping("/patients/getpatient/{patientId}")
    public ResponseEntity<PatientDto> getPatient(@PathVariable Long patientId, Authentication authentication) {
        String email = authentication.getName();
        Medecin medecin = medecinRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Medecin not found"));

        PatientDto patient = medecinService.getPatientDto(medecin.getId(), patientId);
        return ResponseEntity.ok(patient);
    }

    //-----------------------------------------------END OF PATIENT---------------------------------
    //--------------------------------------Appointments----------------------------------------
  /*  @PostMapping("rendezvous/addrendezvous")
    public ResponseEntity <RendezVousDto> addRendezVous (Authentication authentication, @Valid @RequestBody RendezVousDto rdvdto) {

        String email = authentication.getName();
        Medecin medecin = medecinRepository.findByEmail(email).orElseThrow( () -> new RuntimeException("Medecin not found"));
        RendezVousDto addedrdv = medecinService.createRendezVous(medecin.getId(),rdvdto );
        return ResponseEntity.ok(addedrdv);
    }*/
    @GetMapping("rendezvous/getrendezvous/{rendezvousId}")
    public ResponseEntity<RendezVousDto> getRendezVous(Authentication authentication, @PathVariable @Valid Long rendezvousId) {
        String email = authentication.getName();
        Medecin medecin = medecinRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("Medecin not found"));
        RendezVousDto foundrdv = medecinService.getRendezVousData(medecin.getId(), rendezvousId);
        return ResponseEntity.ok(foundrdv);
    }

    @GetMapping("/rendezvous/getallrendezvous")
    public ResponseEntity<List<RendezVousDto>> getAllRendezVous(Authentication authentication) {
        String email = authentication.getName();
        Medecin medecin = medecinRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Medecin not found"));

        List<RendezVousDto> allRendezVous = medecinService.getAllRendezVous(medecin.getId());
        return ResponseEntity.ok(allRendezVous);
    }

    @PutMapping("/rendezvous/updaterendezvous/{rendezvousId}")
    public ResponseEntity<RendezVousDto> updateRendezVous(
            @PathVariable Long rendezvousId,
            @RequestBody RendezVousDto updateDto,
            Authentication authentication
    ) {
        String email = authentication.getName();
        Medecin medecin = medecinRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Medecin not found"));

        RendezVousDto updatedRdv = medecinService.updateRendezVous(medecin.getId(), rendezvousId, updateDto);
        return ResponseEntity.ok(updatedRdv);
    }

    @DeleteMapping("/rendezvous/deleterendezvous/{rendezvousId}")
    public ResponseEntity<?> deleteRendezVous(
            @PathVariable Long rendezvousId,
            Authentication authentication
    ) {
        String email = authentication.getName();
        Medecin medecin = medecinRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Medecin not found"));

        medecinService.deleteRendezVous(medecin.getId(), rendezvousId);
        return ResponseEntity.noContent().build();
    }
    @PostMapping("/{rendezvousId}/approve")
    public ResponseEntity<RendezVousDto> approveRendezvous(
            Authentication authentication,
            @PathVariable Long rendezvousId) {
        logger.info("Request to approve Rendezvous: id={}", rendezvousId);

        // Extract medecinId from JWT
        String email = authentication.getName();
        logger.debug("Fetching Medecin: email={}", email);
        Medecin medecin = medecinRepository.findByEmail(email)
                .orElseThrow(() -> {
                    logger.error("Medecin not found: email={}", email);
                    return new Medecinnotfound("Médecin non trouvé");
                });

        // Approve Rendezvous
        RendezVousDto updated = medecinService.AcceptRendezVous(rendezvousId, medecin.getId());
        logger.info("Rendezvous approved: id={}", rendezvousId);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{rendezvousId}/reject")
    public ResponseEntity<RendezVousDto> rejectRendezvous(
            Authentication authentication,
            @PathVariable Long rendezvousId) {
        logger.info("Request to reject Rendezvous: id={}", rendezvousId);

        // Extract medecinId from JWT
        String email = authentication.getName();
        logger.debug("Fetching Medecin: email={}", email);
        Medecin medecin = medecinRepository.findByEmail(email)
                .orElseThrow(() -> {
                    logger.error("Medecin not found: email={}", email);
                    return new Medecinnotfound("Médecin non trouvé");
                });

        // Reject Rendezvous
        RendezVousDto updated = medecinService.RejectRendezVous(rendezvousId, medecin.getId());
        logger.info("Rendezvous rejected: id={}", rendezvousId);
        return ResponseEntity.ok(updated);
    }


}

