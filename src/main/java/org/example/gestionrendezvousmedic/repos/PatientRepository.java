package org.example.gestionrendezvousmedic.repos;

import org.example.gestionrendezvousmedic.models.Patient;
import org.example.gestionrendezvousmedic.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

//import java.lang.ScopedValue;
import java.util.List;
import java.util.Optional;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {
    Optional<Patient> findByEmail(String email);
    boolean existsByEmail(String email);

    int countDistinctByMedecinId(Long medecinId);
List<Patient> findByMedecinId(Long medecinId);
    Optional <Patient>  findByIdAndMedecinId(Long patientId, Long medecinId);

}