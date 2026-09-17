package org.example.gestionrendezvousmedic.services;

import jakarta.transaction.Transactional;
import org.example.gestionrendezvousmedic.Exception.EmailAlreadyExistsException;
import org.example.gestionrendezvousmedic.dtos.AuthenticationResponse;
import org.example.gestionrendezvousmedic.dtos.LoginUserDto;
import org.example.gestionrendezvousmedic.dtos.PatientDto;

import org.example.gestionrendezvousmedic.dtos.RegisterUserDto;
import org.example.gestionrendezvousmedic.models.*;
import org.example.gestionrendezvousmedic.repos.AdminRepository;
import org.example.gestionrendezvousmedic.repos.MedecinRepository;
import org.example.gestionrendezvousmedic.repos.PatientRepository;
import org.example.gestionrendezvousmedic.repos.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import org.example.gestionrendezvousmedic.dtos.RefreshRequest;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;

import java.util.HashMap;
import java.util.Map;

@Service
public class AuthenticationService {
    private static final Logger logger = LoggerFactory.getLogger(AuthenticationService.class);
    @Autowired
    private JwtService jwtService;

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private MedecinRepository medecinRepository;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;

    @Autowired
    private UserDetailsService userDetailsService;

    /** One place to build the token pair, so every entry point returns the same shape. */
    private AuthenticationResponse tokensFor(UserDetails user) {
        return new AuthenticationResponse(
                jwtService.generateToken(user),
                jwtService.generateRefreshToken(user),
                jwtService.getExpirationTime());
    }

    /**
     * Exchanges a valid refresh token for a fresh access token. The refresh token is
     * re-issued at the same time, so a client that keeps refreshing never has to log in
     * again, while a leaked access token still expires on its own short schedule.
     */
    public AuthenticationResponse refresh(RefreshRequest request) {
        String email = jwtService.extractUsername(request.getRefreshToken());
        UserDetails user = userDetailsService.loadUserByUsername(email);

        if (!jwtService.isRefreshTokenValid(request.getRefreshToken(), user)) {
            throw new UsernameNotFoundException("Refresh token invalide ou expiré");
        }
        return tokensFor(user);
    }

    @Autowired
    public AuthenticationService(
            UserRepository userRepository,
            AuthenticationManager authenticationManager,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.authenticationManager = authenticationManager;
        this.passwordEncoder = passwordEncoder;
    }

    // ------------------ PATIENT ------------------
    @Transactional
    public AuthenticationResponse signupPatient(RegisterUserDto input) {
        if(patientRepository.findByEmail(input.getEmail()).isPresent()) {
            throw new EmailAlreadyExistsException("Email est deja utilisé!");
        }
        Patient patient = new Patient();
        patient.setName(input.getName());
        patient.setEmail(input.getEmail());
        patient.setPassword(passwordEncoder.encode(input.getPassword()));
        patient.setRole(Role.PATIENT);
        patientRepository.save(patient);
        return tokensFor(patient);
    }

    public AuthenticationResponse authenticatePatient(LoginUserDto input) {
        authenticationManager.authenticate (new UsernamePasswordAuthenticationToken(input.getEmail(), input.getPassword()));

        Patient patient = patientRepository.findByEmail(input.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException("Patient not found"));

        return tokensFor(patient);
    }

    // ------------------ MEDECIN ------------------
    @Transactional
    public Map<String, Object> signupMedecin(RegisterUserDto input) {
        Medecin medecin = new Medecin();
        medecin.setName(input.getName());
        medecin.setEmail(input.getEmail());
        medecin.setPassword(passwordEncoder.encode(input.getPassword()));
        medecin.setRole(Role.MEDECIN);
        medecin.setSpecialite(input.getSpecialite());

        logger.info("Medecin before save: email={}, name={}, role={}, specialite={}",
                medecin.getEmail(), medecin.getName(), medecin.getRole(), medecin.getSpecialite());
        if (medecinRepository.existsByEmail(input.getEmail())) {
            throw new EmailAlreadyExistsException("Cet email est deja utilise!");
        }
        Medecin savedMedecin = medecinRepository.save(medecin);
        logger.info(" succesfully!! Saved Medecin: {}", savedMedecin); // extra debug log

        AuthenticationResponse tokens = tokensFor(savedMedecin);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Medecin registered successfully");
        response.put("token", tokens.getToken());
        response.put("refreshToken", tokens.getRefreshToken());
        response.put("expiresIn", tokens.getExpiresIn());
        response.put("user", Map.of(
                "id", savedMedecin.getId(),
                "name", savedMedecin.getName(),
                "email", savedMedecin.getEmail(),
                "role", savedMedecin.getRole().toString(),
                "specialite", savedMedecin.getSpecialite()
        ));

        return response;
    }


    public AuthenticationResponse authenticateMedecin(LoginUserDto input) {
        System.out.println("[AUTH] Attempting login for email: " + input.getEmail());

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(input.getEmail(), input.getPassword())
            );

            System.out.println("[AUTH] Authentication successful for: " + input.getEmail());
            System.out.println("[AUTH] Authenticated Principal: " + authentication.getPrincipal());

        } catch (Exception ex) {
            System.err.println("[AUTH] Authentication failed for: " + input.getEmail() + " - Reason: " + ex.getMessage());
            throw ex; // rethrow to keep existing behavior
        }

        Medecin medecin = medecinRepository.findByEmail(input.getEmail())
                .orElseThrow(() -> {
                    System.err.println("[AUTH] Medecin not found in database: " + input.getEmail());
                    return new UsernameNotFoundException("Medecin not found");
                });

        System.out.println("[AUTH] Medecin entity found: " + medecin.getName());
        System.out.println("[AUTH] Role: " + medecin.getRole());

        logger.info("[AUTH] Tokens issued for {}", input.getEmail());
        return tokensFor(medecin);
    }


    // ------------------ ADMINISTRATEUR ------------------
    public AuthenticationResponse signupAdmin(RegisterUserDto input) {
        Administateur admin = new Administateur();
        admin.setName(input.getName());
        admin.setEmail(input.getEmail());
        admin.setPassword(passwordEncoder.encode(input.getPassword()));
        admin.setRole(Role.ADMIN);

        adminRepository.save(admin);
        return tokensFor(admin);
    }

    public AuthenticationResponse authenticateAdmin(LoginUserDto input) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(input.getEmail(), input.getPassword())
        );

        Administateur admin = adminRepository.findByEmail(input.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException("Admin not found"));

        return tokensFor(admin);
    }







}
