package org.example.gestionrendezvousmedic.repos;

import io.micrometer.common.lang.NonNull;
import io.micrometer.common.lang.NonNullApi;
import org.example.gestionrendezvousmedic.models.Medecin;
import org.example.gestionrendezvousmedic.models.Rendezvous;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import jakarta.validation.constraints.NotNull;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Repository
public interface RendezVousRepository extends JpaRepository<Rendezvous, Long> {
    @NonNull
    Optional<Rendezvous> findById(@NonNull Long id);

@NonNull
    int countByMedecinId(Long medecinId);
Optional<Rendezvous> findByIdAndMedecinId(Long id, Long medecinId);
    List<Rendezvous>  findTop5ByMedecinIdOrderByDateDesc(Long medecinId);
    int countRendezvousByMedecinId(Long medecinId);
    List<Rendezvous> findByMedecinId(Long medecinId);
int countRendezVousByPatientId(Long patientId);
List<Rendezvous> findByPatientId(Long patientId);
}