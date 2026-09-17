package org.example.gestionrendezvousmedic.services;

import jakarta.transaction.Transactional;
import org.example.gestionrendezvousmedic.Exception.AppointmentNotfoundNotadmin;
import org.example.gestionrendezvousmedic.Exception.Medecinnotfound;
import org.example.gestionrendezvousmedic.Exception.PatientNotFoundNotadmin;
import org.example.gestionrendezvousmedic.dtos.CreateRendezvousDTO;
import org.example.gestionrendezvousmedic.dtos.PatientDashboardDto;
import org.example.gestionrendezvousmedic.dtos.PatientDto;
import org.example.gestionrendezvousmedic.dtos.RendezVousDto;
import org.example.gestionrendezvousmedic.models.Medecin;
import org.example.gestionrendezvousmedic.models.Patient;
import org.example.gestionrendezvousmedic.models.Rendezvous;
import org.example.gestionrendezvousmedic.models.Status;
import org.example.gestionrendezvousmedic.repos.MedecinRepository;
import org.example.gestionrendezvousmedic.repos.PatientRepository;
import org.example.gestionrendezvousmedic.repos.RendezVousRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.function.Predicate;

import static java.util.stream.Collectors.toList;

@Service
public class PatientService {
    private static final Logger logger = LoggerFactory.getLogger(PatientService.class);
    @Autowired
    private final MedecinRepository medecinRepository;
    private final PatientRepository patientRepository;
private final RendezVousRepository rendezVousRepository;
    public PatientService(MedecinRepository medecinRepository, PatientRepository patientRepository, RendezVousRepository rendezVousRepository) {
        this.medecinRepository = medecinRepository;
        this.patientRepository = patientRepository;
        this.rendezVousRepository = rendezVousRepository;
    }
public PatientDashboardDto dashboard( Long patientId) {
    Patient patient = patientRepository.findById(patientId)
            .orElseThrow(() -> new PatientNotFoundNotadmin("Patient non disponible"));

    Medecin medecin = patient.getMedecin();
    if (medecin == null) {
        throw new Medecinnotfound("Aucun médecin assigné à ce patient.");
    }

   int nr= rendezVousRepository.countByMedecinId(medecin.getId());
    List <RendezVousDto> rendezVousDtoList = patient.getListRendezvous().stream().map( rdv -> new RendezVousDto( rdv.getId(),
            rdv.getMedecin().getId(),
            rdv.getPatient().getId(), rdv.getReason(),
            rdv.getDate(),
            rdv.getStatus())).toList();

    return new PatientDashboardDto(patient.getName(),medecin.getName(),medecin.getEmail(),patient.getEmail(),nr,rendezVousDtoList);
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
      Rendezvous saved = rendezVousRepository.saveAndFlush(rendezvous);
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
        Rendezvous rdv = rendezVousRepository.findById(rendezvousId)
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
        rendezVousRepository.deleteById(rendezvousId);
        logger.info("Rendezvous deleted: id={}", rendezvousId);
    }
    @Transactional()
    public RendezVousDto getRendezVous(Long rendezvousId, Long patientId) {
        logger.info("Fetching Rendezvous: id={}, patientId={}", rendezvousId, patientId);

        // Fetch Rendezvous by ID
        Rendezvous rdv = rendezVousRepository.findById(rendezvousId)
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
        Rendezvous rdv = rendezVousRepository.findById(rendezvousId)
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
        Rendezvous updated = rendezVousRepository.save(rdv);
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