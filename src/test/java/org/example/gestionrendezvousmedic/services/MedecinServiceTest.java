package org.example.gestionrendezvousmedic.services;

import org.example.gestionrendezvousmedic.Exception.AppointmentNotfoundNotadmin;
import org.example.gestionrendezvousmedic.Exception.PatientNotFoundNotadmin;
import org.example.gestionrendezvousmedic.Exception.Patientaddedalreadytomedecin;
import org.example.gestionrendezvousmedic.dtos.PatientDto;
import org.example.gestionrendezvousmedic.dtos.RendezVousDto;
import org.example.gestionrendezvousmedic.models.*;
import org.example.gestionrendezvousmedic.repos.MedecinRepository;
import org.example.gestionrendezvousmedic.repos.PatientRepository;
import org.example.gestionrendezvousmedic.repos.RendezVousRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * The practitioner-side rules: holding ROLE_MEDECIN is not enough — a practitioner
 * may only act on appointments that are theirs, for patients on their own list.
 */
@ExtendWith(MockitoExtension.class)
class MedecinServiceTest {

    private static final long MEDECIN_ID = 20L;
    private static final long OTHER_MEDECIN_ID = 21L;
    private static final long PATIENT_ID = 10L;

    @Mock private MedecinRepository medecinRepository;
    @Mock private RendezVousRepository appointmentRepository;
    @Mock private PatientRepository patientRepository;

    @InjectMocks private MedecinService medecinService;

    private Medecin medecin;
    private Medecin otherMedecin;
    private Patient patient;

    @BeforeEach
    void setUp() {
        medecin = new Medecin();
        medecin.setId(MEDECIN_ID);
        medecin.setEmail("doctor@example.com");

        otherMedecin = new Medecin();
        otherMedecin.setId(OTHER_MEDECIN_ID);
        otherMedecin.setEmail("other@example.com");

        patient = new Patient();
        patient.setId(PATIENT_ID);
        patient.setName("Test Patient");
        patient.setEmail("patient@example.com");
        patient.setMedecin(medecin);

        medecin.setPatients(new ArrayList<>(List.of(patient)));
    }

    private Rendezvous appointment(long id, Medecin owner, Status status) {
        Rendezvous rdv = new Rendezvous();
        rdv.setId(id);
        rdv.setMedecin(owner);
        rdv.setPatient(patient);
        rdv.setDate(LocalDateTime.now().plusDays(2));
        rdv.setStatus(status);
        return rdv;
    }

    // ── Approving and rejecting ──────────────────────────────────────────

    @Test
    @DisplayName("approving moves a pending request to APPROVED")
    void approveSetsApproved() {
        Rendezvous pending = appointment(1L, medecin, Status.PENDING);
        when(medecinRepository.findById(MEDECIN_ID)).thenReturn(Optional.of(medecin));
        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(pending));
        when(appointmentRepository.save(any(Rendezvous.class))).thenAnswer(inv -> inv.getArgument(0));

        RendezVousDto result = medecinService.AcceptRendezVous(1L, MEDECIN_ID);

        assertEquals(Status.APPROVED, result.getStatus());
        assertEquals(MEDECIN_ID, result.getMedecinId());
        assertEquals(PATIENT_ID, result.getPatientId());
    }

    @Test
    @DisplayName("rejecting moves a pending request to REJECTED")
    void rejectSetsRejected() {
        Rendezvous pending = appointment(1L, medecin, Status.PENDING);
        when(medecinRepository.findById(MEDECIN_ID)).thenReturn(Optional.of(medecin));
        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(pending));
        when(appointmentRepository.save(any(Rendezvous.class))).thenAnswer(inv -> inv.getArgument(0));

        assertEquals(Status.REJECTED, medecinService.RejectRendezVous(1L, MEDECIN_ID).getStatus());
    }

    @Test
    @DisplayName("a practitioner cannot approve another practitioner's appointment")
    void cannotApproveSomeoneElsesAppointment() {
        Rendezvous theirs = appointment(2L, otherMedecin, Status.PENDING);
        when(medecinRepository.findById(MEDECIN_ID)).thenReturn(Optional.of(medecin));
        when(appointmentRepository.findById(2L)).thenReturn(Optional.of(theirs));

        assertThrows(AppointmentNotfoundNotadmin.class,
                () -> medecinService.AcceptRendezVous(2L, MEDECIN_ID));

        verify(appointmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("a practitioner cannot approve for a patient who is not on their list")
    void cannotApproveForAnUnlistedPatient() {
        medecin.setPatients(new ArrayList<>());   // patient no longer followed
        Rendezvous rdv = appointment(3L, medecin, Status.PENDING);
        when(medecinRepository.findById(MEDECIN_ID)).thenReturn(Optional.of(medecin));
        when(appointmentRepository.findById(3L)).thenReturn(Optional.of(rdv));

        assertThrows(AppointmentNotfoundNotadmin.class,
                () -> medecinService.AcceptRendezVous(3L, MEDECIN_ID));
    }

    @Test
    @DisplayName("approving twice is refused rather than silently repeated")
    void cannotApproveTwice() {
        Rendezvous already = appointment(4L, medecin, Status.APPROVED);
        when(medecinRepository.findById(MEDECIN_ID)).thenReturn(Optional.of(medecin));
        when(appointmentRepository.findById(4L)).thenReturn(Optional.of(already));

        assertThrows(IllegalStateException.class,
                () -> medecinService.AcceptRendezVous(4L, MEDECIN_ID));
    }

    @Test
    @DisplayName("comparing patients by id does not recurse through the JPA association")
    void ownershipCheckDoesNotOverflowTheStack() {
        // Patient and Medecin reference each other, and Lombok's generated equals()
        // walks that cycle. The check must compare ids, not whole entities.
        Rendezvous rdv = appointment(5L, medecin, Status.PENDING);
        when(medecinRepository.findById(MEDECIN_ID)).thenReturn(Optional.of(medecin));
        when(appointmentRepository.findById(5L)).thenReturn(Optional.of(rdv));
        when(appointmentRepository.save(any(Rendezvous.class))).thenAnswer(inv -> inv.getArgument(0));

        assertDoesNotThrow(() -> medecinService.AcceptRendezVous(5L, MEDECIN_ID));
    }

    // ── Listing ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("the schedule returns every appointment, not just the first")
    void scheduleReturnsEveryAppointment() {
        when(appointmentRepository.findByMedecinId(MEDECIN_ID)).thenReturn(List.of(
                appointment(1L, medecin, Status.APPROVED),
                appointment(2L, medecin, Status.PENDING),
                appointment(3L, medecin, Status.REJECTED)));

        assertEquals(3, medecinService.getAllRendezVous(MEDECIN_ID).size());
    }

    @Test
    @DisplayName("the patient list returns every attached patient")
    void patientListReturnsEveryPatient() {
        Patient second = new Patient();
        second.setId(11L);
        second.setName("Second Patient");
        second.setEmail("second@example.com");
        when(patientRepository.findByMedecinId(MEDECIN_ID)).thenReturn(List.of(patient, second));

        List<PatientDto> patients = medecinService.getAllPatients(MEDECIN_ID);

        assertEquals(2, patients.size());
        assertEquals("patient@example.com", patients.get(0).getEmail());
    }

    // ── Attaching patients ───────────────────────────────────────────────

    @Test
    @DisplayName("attaching an unknown email is reported, not silently ignored")
    void attachingAnUnknownPatientFails() {
        when(medecinRepository.findById(MEDECIN_ID)).thenReturn(Optional.of(medecin));
        when(patientRepository.findByEmail("nobody@example.com")).thenReturn(Optional.empty());

        assertThrows(PatientNotFoundNotadmin.class,
                () -> medecinService.addPatient(MEDECIN_ID, "nobody@example.com"));
    }

    @Test
    @DisplayName("attaching the same patient twice is refused")
    void attachingTwiceFails() {
        when(medecinRepository.findById(MEDECIN_ID)).thenReturn(Optional.of(medecin));
        when(patientRepository.findByEmail("patient@example.com")).thenReturn(Optional.of(patient));

        assertThrows(Patientaddedalreadytomedecin.class,
                () -> medecinService.addPatient(MEDECIN_ID, "patient@example.com"));
    }

    @Test
    @DisplayName("attaching a patient links them to the practitioner")
    void attachingLinksThePatient() {
        Patient fresh = new Patient();
        fresh.setId(12L);
        fresh.setEmail("fresh@example.com");
        when(medecinRepository.findById(MEDECIN_ID)).thenReturn(Optional.of(medecin));
        when(patientRepository.findByEmail("fresh@example.com")).thenReturn(Optional.of(fresh));
        when(patientRepository.save(any(Patient.class))).thenAnswer(inv -> inv.getArgument(0));

        medecinService.addPatient(MEDECIN_ID, "fresh@example.com");

        assertEquals(MEDECIN_ID, fresh.getMedecin().getId());
        verify(patientRepository).save(fresh);
    }
}
