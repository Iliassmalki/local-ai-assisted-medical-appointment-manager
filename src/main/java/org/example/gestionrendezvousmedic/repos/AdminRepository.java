package org.example.gestionrendezvousmedic.repos;

import org.example.gestionrendezvousmedic.models.Administateur;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AdminRepository extends JpaRepository<Administateur, Long> {
    Optional<Administateur> findByEmail(String email);
    boolean existsByEmail(String email);
// Custom method to find by email
}
