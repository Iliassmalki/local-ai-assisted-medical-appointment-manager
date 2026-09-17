package org.example.gestionrendezvousmedic.repos;

import org.example.gestionrendezvousmedic.models.Medecin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MedecinRepository extends JpaRepository<Medecin, Long> {
    Optional<Medecin> findByEmail(String email);
    boolean existsByEmail(String email);

 Optional<Medecin> findByName(String name);
}
