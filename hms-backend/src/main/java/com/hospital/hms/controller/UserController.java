package com.hospital.hms.controller;

import com.hospital.hms.dto.ChangePasswordRequest;
import com.hospital.hms.entity.Role;
import com.hospital.hms.entity.User;
import com.hospital.hms.repository.UserRepository;
import com.hospital.hms.service.AuditLogService;
import com.hospital.hms.service.DoctorService;
import com.hospital.hms.service.PatientService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired(required = false)
    private PasswordEncoder passwordEncoder;

    @Autowired(required = false)
    private AuditLogService auditLogService;

    @Autowired(required = false)
    private DoctorService doctorService;

    @Autowired(required = false)
    private PatientService patientService;

    public UserController() {}

    public UserController(UserRepository userRepository, PasswordEncoder passwordEncoder, AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditLogService = auditLogService;
    }

    public void setUserRepository(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public void setAuditLogService(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    public void setDoctorService(DoctorService doctorService) {
        this.doctorService = doctorService;
    }

    public void setPatientService(PatientService patientService) {
        this.patientService = patientService;
    }

    // Get all users who are waiting for approval
    @GetMapping("/pending")
    @PreAuthorize("hasAuthority('ADMIN')")
    public List<User> getPendingUsers() {
        return userRepository.findByStatus("PENDING");
    }

    // Approve a user
    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAuthority('ADMIN')")
    public String approveUser(@PathVariable Long id, Authentication authentication) {
        String actor = (authentication != null) ? authentication.getName() : "ADMIN";
        User user = userRepository.findById(id).orElseThrow();
        user.setStatus("APPROVED");
        User savedUser = userRepository.save(user);

        // Auto-provision Doctor or Patient entity upon Admin approval
        if (savedUser.getRole() == Role.DOCTOR && doctorService != null) {
            try {
                doctorService.createDoctorForUser(savedUser);
            } catch (Exception e) {
                System.err.println("⚠️ Warning: Could not auto-create Doctor entity for approved user: " + e.getMessage());
            }
        } else if (savedUser.getRole() == Role.PATIENT && patientService != null) {
            try {
                patientService.createPatientForUser(savedUser);
            } catch (Exception e) {
                System.err.println("⚠️ Warning: Could not auto-create Patient entity for approved user: " + e.getMessage());
            }
        }

        if (auditLogService != null) {
            auditLogService.log(actor, "USER_APPROVE", "SUCCESS",
                    "Approved user: " + savedUser.getUsername() + " [Role: " + savedUser.getRole() + "]");
        }

        return "User Approved!";
    }

    public String approveUser(Long id) {
        return approveUser(id, null);
    }

    // Reject a user
    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAuthority('ADMIN')")
    public String rejectUser(@PathVariable Long id) {
        User user = userRepository.findById(id).orElseThrow();
        user.setStatus("REJECTED");
        userRepository.save(user);
        return "User Rejected!";
    }
    
    // Endpoint to get the currently logged-in user's profile details
    @GetMapping("/profile")
    public User getUserProfile(Authentication authentication) {
        // Get the username from the security context
        String username = authentication.getName();
        // Fetch the user from the database
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found!"));
    }

    // Endpoint to change password for the currently logged-in user (SRS 3.1: Password Management)
    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request, Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }
        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found!"));

        if (request.getCurrentPassword() == null || request.getCurrentPassword().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Current password is required.");
        }
        if (request.getNewPassword() == null || request.getNewPassword().trim().length() < 6) {
            return ResponseEntity.badRequest().body("New password must be at least 6 characters long.");
        }
        if (passwordEncoder != null && !passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            if (auditLogService != null) {
                auditLogService.logAction(user.getUsername(), "PASSWORD_CHANGE", "FAILED", "Incorrect current password");
            }
            return ResponseEntity.badRequest().body("Current password does not match.");
        }

        if (passwordEncoder != null) {
            user.setPassword(passwordEncoder.encode(request.getNewPassword().trim()));
        } else {
            user.setPassword(request.getNewPassword().trim());
        }
        userRepository.save(user);

        if (auditLogService != null) {
            auditLogService.logAction(user.getUsername(), "PASSWORD_CHANGE", "SUCCESS", "User changed password successfully");
        }
        return ResponseEntity.ok("Password changed successfully!");
    }
}