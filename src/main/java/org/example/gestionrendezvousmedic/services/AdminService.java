package org.example.gestionrendezvousmedic.services;

import jakarta.transaction.Transactional;
import org.example.gestionrendezvousmedic.Exception.AppointmentNotfoundNotadmin;
import org.example.gestionrendezvousmedic.Exception.Medecinnotfound;
import org.example.gestionrendezvousmedic.Exception.PatientNotFoundNotadmin;
import org.example.gestionrendezvousmedic.dtos.*;

import org.example.gestionrendezvousmedic.models.Medecin;
import org.example.gestionrendezvousmedic.models.Patient;
import org.example.gestionrendezvousmedic.models.Rendezvous;
import org.example.gestionrendezvousmedic.models.Status;
import org.example.gestionrendezvousmedic.repos.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class AdminService {
    private static final Logger logger = LoggerFactory.getLogger(AdminService.class);
    private final UserRepository userRepository;
    private final MedecinRepository medecinRepository;
    private final AdminRepository adminRepository;
    private final PatientRepository patientRepository;
    private final RendezVousRepository appointmentRepository;

    @Autowired
    public AdminService(UserRepository userRepository,
                        MedecinRepository medecinRepository,
                        AdminRepository adminRepository,
                        PatientRepository patientRepository,
                        RendezVousRepository appointmentRepository) {
        this.userRepository = userRepository;
        this.medecinRepository = medecinRepository;
        this.adminRepository = adminRepository;
        this.patientRepository = patientRepository;
        this.appointmentRepository = appointmentRepository;
    }

    public AdminDashboardDto getDashboardData() {
        int medecins = (int) medecinRepository.count();
        int appointments = (int) appointmentRepository.count();
        int patients = (int) patientRepository.count();
        int users = (int) userRepository.count();
        List<Medecin> medecinList = medecinRepository.findAll();
        List<Patient> patientList = patientRepository.findAll();
        return new AdminDashboardDto(users, appointments, medecins, patients);
    }

    /*  @Transactional
      public RendezVousDto CreatRendezVousDto(RendezVousDto input, Long patientId, String medecinemail){
          logger.info("Creating Rendezvous for patientId: {}, medecinname: {}, date: {}", patientId, medecinemail, input.getDate());

          // Validate medecinname
          if (medecinemail == null || medecinemail.trim().isEmpty()) {
              logger.error("Invalid medecinname: {}", medecinemail);
              throw new IllegalArgumentException("Nom du médecin requis");
          }

          // Fetch Patient
          logger.debug("Fetching Patient with id: {}", patientId);
          Patient patient = patientRepository.findById(patientId)
                  .orElseThrow(() -> {
                      logger.error("Patient not found for id: {}", patientId);
                      return new PatientNotFoundNotadmin("Patient non disponible");
                  });

          // Validate same-day appointment for Patient
          LocalDate newAppointmentDate = input.getDate().toLocalDate();
          logger.debug("Checking same-day appointments for date: {}", newAppointmentDate);
          boolean patientHasAppointment = patient.getListRendezvous().stream()
                  .anyMatch(rdv -> rdv.getDate().toLocalDate().equals(newAppointmentDate));
          if (patientHasAppointment) {
              logger.warn("Patient already has an appointment on: {}", newAppointmentDate);
              throw new IllegalStateException("Rendez-vous dans cette date déjà assigné avec vous, choisissez un autre jour.");
          }

          // Fetch Medecin by name
          logger.debug("Fetching Medecin with name: {}", medecinemail);
          Medecin medecin = medecinRepository.findByEmail(medecinemail)
                  .orElseThrow(() -> {
                      logger.error("Medecin not found for email: {}", medecinemail);
                      return new Medecinnotfound("Médecin non trouvé");
                  });

          // Verify Patient is assigned to Medecin
          logger.debug("Verifying Patient-Médecin assignment");
          if (patient.getMedecin() == null || !patient.getMedecin().getId().equals(medecin.getId())) {
              logger.warn("Patient id: {} not assigned to Medecin id: {}", patientId, medecin.getId());
              throw new IllegalStateException("Patient non assigné à ce médecin. Veuillez assigner le patient d'abord.");
          }



          // Create and configure Rendezvous
          logger.debug("Creating new Rendezvous");
          Rendezvous rd = new Rendezvous();
          rd.setDate(input.getDate());
          rd.setPatient(patient);
          rd.setMedecin(medecin);
          rd.setReason(input.getReason());
          rd.setStatus(Status.PENDING);

          // Save Rendezvous
          logger.debug("Saving Rendezvous");
          Rendezvous saved = rendezVousRepository.save(rd);
          logger.info("Rendezvous created with id: {}", saved.getId());


          return new RendezVousDto(saved.getId(),medecin.getId(), patientId, saved.getReason(), saved.getDate(), saved.getStatus());
      } */
    @Transactional
    public RendezVousDto assignRendezVous(CreateRendezvousDTO input, Long patientId) {
        logger.info("Creating rendezvous for patientId: {}, patientEmail: {}, medecinEmail: {}, date: {}",
                patientId, input.getPatientEmail(), input.getMedecinEmail(), input.getDate());

        // Validate input
        if (input.getPatientEmail() == null || input.getPatientEmail().trim().isEmpty()) {
            logger.error("Invalid patient email: {}", input.getPatientEmail());
            throw new IllegalArgumentException("Email du patient requis");
        }
        if (input.getMedecinEmail() == null || input.getMedecinEmail().trim().isEmpty()) {
            logger.error("Invalid medecin email: {}", input.getMedecinEmail());
            throw new IllegalArgumentException("Email du médecin requis");
        }
        if (input.getDate() == null) {
            logger.error("Date is null");
            throw new IllegalArgumentException("Date requise");
        }

        // Fetch Patient
        logger.debug("Fetching Patient: email={}", input.getPatientEmail());
        Patient patient = patientRepository.findByEmail(input.getPatientEmail())
                .orElseThrow(() -> {
                    logger.error("Patient not found: email={}", input.getPatientEmail());
                    return new PatientNotFoundNotadmin("Patient introuvable");
                });

        // Validate patientId matches JWT
        if (!patient.getId().equals(patientId)) {
            logger.warn("Mismatched patientId: input={}, authenticated={}", patientId, patient.getId());
            throw new IllegalStateException("L'email du patient ne correspond pas à l'utilisateur authentifié");
        }

        // Fetch Medecin
        logger.debug("Fetching Medecin: email={}", input.getMedecinEmail());
        Medecin medecin = medecinRepository.findByEmail(input.getMedecinEmail())
                .orElseThrow(() -> {
                    logger.error("Medecin not found: email={}", input.getMedecinEmail());
                    return new Medecinnotfound("Médecin introuvable");
                });

        // Verify Patient-Médecin assignment
        logger.debug("Verifying Patient-Médecin assignment: patientId={}, medecinId={}", patientId, medecin.getId());
        if (patient.getMedecin() == null || !patient.getMedecin().getId().equals(medecin.getId())) {
            logger.warn("Patient id: {} not assigned to Medecin id: {}", patientId, medecin.getId());
            throw new IllegalStateException("Patient non assigné à ce médecin. Veuillez assigner le patient d'abord.");
        }

        // Prevent duplicate rendezvous
        LocalDate appointmentDate = input.getDate().toLocalDate();
        logger.debug("Checking duplicate rendezvous: date={}", appointmentDate);
        boolean exists = patient.getListRendezvous().stream()
                .anyMatch(rdv -> rdv.getDate().toLocalDate().equals(appointmentDate));
        if (exists) {
            logger.warn("Duplicate rendezvous: patientId={}, date={}", patientId, appointmentDate);
            throw new IllegalStateException("Un rendez-vous existe déjà à cette date pour ce patient");
        }



        // Create Rendezvous
        logger.debug("Creating Rendezvous");
        Rendezvous rendezvous = new Rendezvous();
        rendezvous.setMedecin(medecin);
        rendezvous.setPatient(patient);
        rendezvous.setDate(input.getDate());
        rendezvous.setReason(input.getReason());
        rendezvous.setStatus(Status.PENDING);

        // Save and flush
        logger.debug("Saving Rendezvous");
        Rendezvous saved = appointmentRepository.saveAndFlush(rendezvous);
        logger.info("Rendezvous created: id={}", saved.getId());

        // Return DTO
        RendezVousDto result = new RendezVousDto(saved.getId(), medecin.getId(), patientId, saved.getReason(), saved.getDate(), saved.getStatus());
        logger.debug("Returning: {}", result);
        return result;
    }
    @Transactional
    public void deleteRendezVous(Long rendezvousId, Long patientId) {
        logger.info("Deleting Rendezvous: id={}, patientId={}", rendezvousId, patientId);

        // Fetch Rendezvous by ID
        Rendezvous rdv = appointmentRepository.findById(rendezvousId)
                .orElseThrow(() -> {
                    logger.error("Rendezvous not found: id={}", rendezvousId);
                    return new AppointmentNotfoundNotadmin("Rendez-vous non trouvé");
                });

        // Verify patient ownership
        if (!rdv.getPatient().getId().equals(patientId)) {
            logger.warn("Unauthorized deletion attempt: rendezvousId={}, patientId={}", rendezvousId, patientId);
            throw new IllegalStateException("Vous n'êtes pas autorisé à supprimer ce rendez-vous");
        }

        // Delete Rendezvous
        logger.debug("Deleting Rendezvous: id={}", rendezvousId);
        appointmentRepository.deleteById(rendezvousId);
        logger.info("Rendezvous deleted: id={}", rendezvousId);
    }
    @Transactional()
    public RendezVousDto getRendezVous(Long rendezvousId, Long patientId) {
        logger.info("Fetching Rendezvous: id={}, patientId={}", rendezvousId, patientId);

        // Fetch Rendezvous by ID
        Rendezvous rdv = appointmentRepository.findById(rendezvousId)
                .orElseThrow(() -> {
                    logger.error("Rendezvous not found: id={}", rendezvousId);
                    return new AppointmentNotfoundNotadmin("Rendez-vous non trouvé");
                });

        // Verify patient ownership
        if (!rdv.getPatient().getId().equals(patientId)) {
            logger.warn("Unauthorized access attempt: rendezvousId={}, patientId={}", rendezvousId, patientId);
            throw new IllegalStateException("Vous n'êtes pas autorisé à accéder à ce rendez-vous");
        }

        // Map to DTO
        RendezVousDto result = new RendezVousDto();
        result.setId(rdv.getId());
        result.setStatus(rdv.getStatus());
        result.setReason(rdv.getReason());
        result.setDate(rdv.getDate());
        result.setPatientId(rdv.getPatient().getId());
        result.setMedecinId(rdv.getMedecin().getId());

        logger.debug("Returning RendezVousDto: {}", result);
        return result;
    }

    @Transactional
    public RendezVousDto updateRendezVous(Long rendezvousId, RendezVousDto input, Long patientId) {
        logger.info("Updating Rendezvous: id={}, patientId={}", rendezvousId, patientId);

        // Fetch Rendezvous by ID
        Rendezvous rdv = appointmentRepository.findById(rendezvousId)
                .orElseThrow(() -> {
                    logger.error("Rendezvous not found: id={}", rendezvousId);
                    return new AppointmentNotfoundNotadmin("Rendez-vous non trouvé");
                });

        // Verify patient ownership
        if (!rdv.getPatient().getId().equals(patientId)) {
            logger.warn("Unauthorized update attempt: rendezvousId={}, patientId={}", rendezvousId, patientId);
            throw new IllegalStateException("Vous n'êtes pas autorisé à modifier ce rendez-vous");
        }

        // Validate input
        if (input.getDate() == null) {
            logger.error("Invalid input: date is null");
            throw new IllegalArgumentException("La date est requise");
        }


        // Update allowed fields
        rdv.setDate(input.getDate());
        if (input.getReason() != null) {
            rdv.setReason(input.getReason());
        }


        // Ignore id, medecinId, patientId from input to prevent changes
        logger.debug("Saving updated Rendezvous: id={}", rendezvousId);
        Rendezvous updated = appointmentRepository.save(rdv);
        logger.info("Rendezvous updated: id={}", rendezvousId);

        // Map to DTO
        RendezVousDto result = new RendezVousDto();
        result.setId(updated.getId());

        result.setReason(updated.getReason());
        result.setDate(updated.getDate());
        result.setPatientId(updated.getPatient().getId());
        result.setMedecinId(updated.getMedecin().getId());

        logger.debug("Returning updated RendezVousDto: {}", result);
        return result;
    }

}