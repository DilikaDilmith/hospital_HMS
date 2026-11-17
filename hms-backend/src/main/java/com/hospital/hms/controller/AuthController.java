package com.hospital.hms.controller;

import com.hospital.hms.dto.AuthResponse;
import com.hospital.hms.dto.LoginRequest;
import com.hospital.hms.dto.SignupRequest;
import com.hospital.hms.entity.Role;
import com.hospital.hms.entity.User;
import com.hospital.hms.repository.UserRepository;
import com.hospital.hms.security.JwtService;
import com.hospital.hms.service.PatientService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private PatientService patientService;

    // Endpoint to handle user login requests
    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody LoginRequest loginRequest) {
        try {
            // 1. Authenticate the user using Spring Security
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getUsername(),
                            loginRequest.getPassword()));

            // 2. If authentication is successful, generate a JWT token
            if (authentication.isAuthenticated()) {
                String token = jwtService.generateToken(loginRequest.getUsername());
                User user = userRepository.findByUsername(loginRequest.getUsername())
                        .orElseThrow(() -> new RuntimeException("User not found!"));

                return ResponseEntity.ok(new AuthResponse(token, user.getRole().name()));
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials!");
            }
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid username or password!");
        } catch (DisabledException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Your account is pending administrator approval!");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Login failed: " + e.getMessage());
        }
    }

    // Endpoint to handle new user registration (Signup) with strict role allowlist & admin protection
    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@RequestBody SignupRequest request) {
        try {
            if (request.getUsername() == null || request.getUsername().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Username is required!");
            }
            if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Password is required!");
            }

            String username = request.getUsername().trim();
            if (userRepository.findByUsername(username).isPresent()) {
                return ResponseEntity.badRequest().body("Username already exists!");
            }

            // Role assignment & allowlist validation
            Role assignedRole = Role.PATIENT;
            if (request.getRole() != null && !request.getRole().trim().isEmpty()) {
                String roleStr = request.getRole().trim().toUpperCase();

                // Security check: NEVER allow public self-registration as ADMIN
                if ("ADMIN".equals(roleStr) || "ROLE_ADMIN".equals(roleStr)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body("Registration for ADMIN role is not permitted via public registration.");
                }

                try {
                    assignedRole = Role.valueOf(roleStr.replace("ROLE_", ""));
                    if (assignedRole == Role.ADMIN) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                .body("Registration for ADMIN role is not permitted via public registration.");
                    }
                } catch (IllegalArgumentException ex) {
                    return ResponseEntity.badRequest().body("Invalid role specified. Permitted roles: PATIENT, DOCTOR, NURSE, RECEPTIONIST, LAB_STAFF, PHARMACIST, ACCOUNTANT.");
                }
            }

            User user = new User();
            user.setUsername(username);
            user.setPassword(passwordEncoder.encode(request.getPassword().trim()));
            user.setFullName((request.getFullName() != null && !request.getFullName().trim().isEmpty())
                    ? request.getFullName().trim()
                    : username);
            user.setRole(assignedRole);

            // PATIENT users are auto-approved; all applicant staff roles require admin approval
            if (assignedRole == Role.PATIENT) {
                user.setStatus("APPROVED");
            } else {
                user.setStatus("PENDING");
            }

            User savedUser = userRepository.save(user);

            // Automatically create and link a corresponding Patient record for PATIENT role
            if (savedUser.getRole() == Role.PATIENT) {
                try {
                    patientService.createPatientForUser(savedUser);
                    System.out.println("✅ Automatically created linked Patient record for User: " + savedUser.getUsername());
                } catch (Exception pe) {
                    System.err.println("⚠️ Warning: Could not auto-create linked Patient record: " + pe.getMessage());
                }
            }

            System.out.println("✅ User registered: " + savedUser.getUsername() + " [Role: " + savedUser.getRole() + ", Status: " + savedUser.getStatus() + "]");
            String msg = (savedUser.getRole() == Role.PATIENT)
                    ? "Patient registered successfully! You may now log in."
                    : "Staff registration submitted successfully! Your account is pending Administrator approval.";

            return ResponseEntity.status(HttpStatus.CREATED).body(msg);
        } catch (Exception e) {
            System.err.println("❌ Registration error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Registration failed: " + e.getMessage());
        }
    }
}
