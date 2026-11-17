package com.hospital.hms.controller;

import com.hospital.hms.dto.AuthResponse;
import com.hospital.hms.dto.LoginRequest;
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

    // Endpoint to handle new user registration (Signup)
    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@RequestBody User user) {
        try {
            if (user.getUsername() == null || user.getUsername().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Username is required!");
            }
            if (user.getPassword() == null || user.getPassword().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Password is required!");
            }

            String username = user.getUsername().trim();
            if (userRepository.findByUsername(username).isPresent()) {
                return ResponseEntity.ok("Username already exists!");
            }

            user.setUsername(username);
            if (user.getFullName() != null) {
                user.setFullName(user.getFullName().trim());
            } else {
                user.setFullName(username);
            }

            user.setPassword(passwordEncoder.encode(user.getPassword()));

            if (user.getRole() == null) {
                user.setRole(Role.PATIENT);
            }

            // PATIENT users are auto-approved; staff require admin approval
            if (user.getRole() == Role.PATIENT) {
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

            System.out.println("✅ User registered successfully: " + savedUser.getUsername() + " with role: " + savedUser.getRole() + " and status: " + savedUser.getStatus());
            return ResponseEntity.ok("User registered successfully! Awaiting Admin Approval (if staff).");
        } catch (Exception e) {
            System.err.println("❌ Registration error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Registration failed: " + e.getMessage());
        }
    }
}
