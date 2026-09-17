package org.example.gestionrendezvousmedic.repos;

import org.example.gestionrendezvousmedic.models.Patient;
import org.example.gestionrendezvousmedic.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
}
