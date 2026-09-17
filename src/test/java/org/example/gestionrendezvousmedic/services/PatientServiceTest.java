package org.example.gestionrendezvousmedic.services;

import org.example.gestionrendezvousmedic.Exception.AppointmentNotfoundNotadmin;
import org.example.gestionrendezvousmedic.Exception.Medecinnotfound;
import org.example.gestionrendezvousmedic.dtos.CreateRendezvousDTO;
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
 * The patient-side authorisation rules: a patient may only book with the
 * practitioner who follows them, and may only touch their own appointments.
 * These run against mocks — no Spring context, no database.
 */
@ExtendWith(MockitoExtension.class)
class PatientServiceTest {

    private static final long PATIENT_ID = 10L;
    private static final long OTHER_PATIENT_ID = 11L;
    private static final long MEDECIN_ID = 20L;

    @Mock private MedecinRepository medecinRepository;
    @Mock private PatientRepository patientRepository;
    @Mock private RendezVousRepository rendezVousRepository;

    @InjectMocks private PatientService patientService;

    private Medecin medecin;
    private Patient patient;

    @BeforeEach
    void setUp() {
        medecin = new Medecin();
        medecin.setId(MEDECIN_ID);
        medecin.setName("Dr. Test");
        medecin.setEmail("doctor@example.com");

        patient = new Patient();
        patient.setId(PATIENT_ID);
        patient.setName("Test Patient");
        patient.setEmail("patient@example.com");
        patient.setMedecin(medecin);
        patient.setListRendezvous(new ArrayList<>());
    }

    private static CreateRendezvousDTO booking(LocalDateTime when) {
        CreateRendezvousDTO dto = new CreateRendezvousDTO();
        dto.setPatientEmail("patient@example.com");
        dto.setMedecinEmail("doctor@example.com");
        dto.setDate(when);
        dto.setReason("Consultation de suivi");
        return dto;
    }

    private Rendezvous appointment(long id, Patient owner, LocalDateTime when, Status status) {
        Rendezvous rdv = new Rendezvous();
        rdv.setId(id);
        rdv.setPatient(owner);
        rdv.setMedecin(medecin);
        rdv.setDate(when);
        rdv.setStatus(status);
        return rdv;
    }

    // ── Booking ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("a booking is saved as PENDING, never as confirmed")
    void bookingIsCreatedPending() {
        LocalDateTime when = LocalDateTime.now().plusDays(3);
        when(patientRepository.findByEmail("patient@example.com")).thenReturn(Optional.of(patient));
        when(medecinRepository.findByEmail("doctor@example.com")).thenReturn(Optional.of(medecin));
        when(rendezVousRepository.saveAndFlush(any(Rendezvous.class)))
                .thenAnswer(inv -> {
                    Rendezvous saved = inv.getArgument(0);
                    saved.setId(99L);
                    return saved;
                });

        RendezVousDto created = patientService.assignRendezVous(booking(when), PATIENT_ID);

        assertEquals(Status.PENDING, created.getStatus());
    }

    @Test
    @DisplayName("the response puts the doctor and patient ids in their own fields")
    void bookingResponseDoesNotSwapIds() {
        LocalDateTime when = LocalDateTime.now().plusDays(3);
        when(patientRepository.findByEmail("patient@example.com")).thenReturn(Optional.of(patient));
        when(medecinRepository.findByEmail("doctor@example.com")).thenReturn(Optional.of(medecin));
        when(rendezVousRepository.saveAndFlush(any(Rendezvous.class)))
                .thenAnswer(inv -> {
                    Rendezvous saved = inv.getArgument(0);
                    saved.setId(99L);
                    return saved;
                });

        RendezVousDto created = patientService.assignRendezVous(booking(when), PATIENT_ID);

        assertEquals(MEDECIN_ID, created.getMedecinId(), "medecinId must hold the doctor");
        assertEquals(PATIENT_ID, created.getPatientId(), "patientId must hold the patient");
    }

    @Test
    @DisplayName("a patient cannot book with a practitioner who does not follow them")
    void bookingRequiresTheDoctorToFollowThePatient() {
        Medecin stranger = new Medecin();
        stranger.setId(99L);
        stranger.setEmail("stranger@example.com");
        patient.setMedecin(stranger);           // attached to someone else

        when(patientRepository.findByEmail("patient@example.com")).thenReturn(Optional.of(patient));
        when(medecinRepository.findByEmail("doctor@example.com")).thenReturn(Optional.of(medecin));

        assertThrows(IllegalStateException.class,
                () -> patientService.assignRendezVous(booking(LocalDateTime.now().plusDays(2)), PATIENT_ID));

        verify(rendezVousRepository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("an unattached patient cannot book at all")
    void bookingRequiresAnAttachedPatient() {
        patient.setMedecin(null);
        when(patientRepository.findByEmail("patient@example.com")).thenReturn(Optional.of(patient));
        when(medecinRepository.findByEmail("doctor@example.com")).thenReturn(Optional.of(medecin));

        assertThrows(IllegalStateException.class,
                () -> patientService.assignRendezVous(booking(LocalDateTime.now().plusDays(2)), PATIENT_ID));
    }

    @Test
    @DisplayName("a second appointment on the same calendar day is refused")
    void oneAppointmentPerDay() {
        LocalDateTime morning = LocalDateTime.now().plusDays(4).withHour(9).withMinute(0);
        LocalDateTime afternoon = morning.withHour(16);
        patient.setListRendezvous(List.of(appointment(1L, patient, morning, Status.APPROVED)));

        when(patientRepository.findByEmail("patient@example.com")).thenReturn(Optional.of(patient));
        when(medecinRepository.findByEmail("doctor@example.com")).thenReturn(Optional.of(medecin));

        assertThrows(IllegalStateException.class,
                () -> patientService.assignRendezVous(booking(afternoon), PATIENT_ID));

        verify(rendezVousRepository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("booking for a different patient than the caller is refused")
    void cannotBookOnBehalfOfSomeoneElse() {
        when(patientRepository.findByEmail("patient@example.com")).thenReturn(Optional.of(patient));

        assertThrows(IllegalStateException.class,
                () -> patientService.assignRendezVous(
                        booking(LocalDateTime.now().plusDays(2)), OTHER_PATIENT_ID));
    }

    // ── Ownership on existing appointments ───────────────────────────────

    @Test
    @DisplayName("a patient cannot cancel another patient's appointment")
    void cannotCancelSomeoneElsesAppointment() {
        Patient other = new Patient();
        other.setId(OTHER_PATIENT_ID);
        Rendezvous theirs = appointment(5L, other, LocalDateTime.now().plusDays(1), Status.APPROVED);

        when(rendezVousRepository.findById(5L)).thenReturn(Optional.of(theirs));

        assertThrows(IllegalStateException.class,
                () -> patientService.deleteRendezVous(5L, PATIENT_ID));

        verify(rendezVousRepository, never()).deleteById(any());
    }

    @Test
    @DisplayName("a patient can cancel their own appointment")
    void canCancelOwnAppointment() {
        Rendezvous mine = appointment(5L, patient, LocalDateTime.now().plusDays(1), Status.APPROVED);
        when(rendezVousRepository.findById(5L)).thenReturn(Optional.of(mine));

        patientService.deleteRendezVous(5L, PATIENT_ID);

        verify(rendezVousRepository).deleteById(5L);
    }

    @Test
    @DisplayName("cancelling an appointment that does not exist is reported, not ignored")
    void cancellingAMissingAppointmentFails() {
        when(rendezVousRepository.findById(404L)).thenReturn(Optional.empty());

        assertThrows(AppointmentNotfoundNotadmin.class,
                () -> patientService.deleteRendezVous(404L, PATIENT_ID));
    }

    @Test
    @DisplayName("a patient cannot read another patient's appointment")
    void cannotReadSomeoneElsesAppointment() {
        Patient other = new Patient();
        other.setId(OTHER_PATIENT_ID);
        Rendezvous theirs = appointment(7L, other, LocalDateTime.now().plusDays(1), Status.PENDING);

        when(rendezVousRepository.findById(7L)).thenReturn(Optional.of(theirs));

        assertThrows(IllegalStateException.class,
                () -> patientService.getRendezVous(7L, PATIENT_ID));
    }

    // ── Dashboard ────────────────────────────────────────────────────────

    @Test
    @DisplayName("the dashboard reports when no practitioner has taken the patient on")
    void dashboardFailsWithoutAnAttachedDoctor() {
        patient.setMedecin(null);
        when(patientRepository.findById(PATIENT_ID)).thenReturn(Optional.of(patient));

        assertThrows(Medecinnotfound.class, () -> patientService.dashboard(PATIENT_ID));
    }

    @Test
    @DisplayName("the dashboard exposes the practitioner's email, which booking needs")
    void dashboardExposesTheDoctorEmail() {
        when(patientRepository.findById(PATIENT_ID)).thenReturn(Optional.of(patient));
        when(rendezVousRepository.countByMedecinId(MEDECIN_ID)).thenReturn(0);

        assertEquals("doctor@example.com", patientService.dashboard(PATIENT_ID).getMedecinEmail());
    }
}
