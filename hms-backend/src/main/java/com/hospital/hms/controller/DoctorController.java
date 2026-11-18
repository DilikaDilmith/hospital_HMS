package com.hospital.hms.controller;

import com.hospital.hms.entity.Department;
import com.hospital.hms.entity.Doctor;
import com.hospital.hms.entity.Role;
import com.hospital.hms.entity.User;
import com.hospital.hms.repository.DepartmentRepository;
import com.hospital.hms.repository.UserRepository;
import com.hospital.hms.service.AuditLogService;
import com.hospital.hms.service.DoctorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/doctors")
public class DoctorController {

    @Autowired
    private DoctorService doctorService;

    @Autowired
    private UserRepository userRepository;

    @Autowired(required = false)
    private DepartmentRepository departmentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired(required = false)
    private AuditLogService auditLogService;

    public void setDoctorService(DoctorService doctorService) {
        this.doctorService = doctorService;
    }

    public void setUserRepository(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public void setDepartmentRepository(DepartmentRepository departmentRepository) {
        this.departmentRepository = departmentRepository;
    }

    public void setPasswordEncoder(PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
    }

    public void setAuditLogService(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<?> createDoctor(@RequestBody Doctor doctor, Authentication authentication) {
        String actor = (authentication != null) ? authentication.getName() : "ADMIN";
        try {
            if (doctor.getFirstName() == null || doctor.getFirstName().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("First name is required.");
            }
            if (doctor.getLastName() == null || doctor.getLastName().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Last name is required.");
            }
            if (doctor.getSpecialization() == null || doctor.getSpecialization().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Specialization is required.");
            }
            if (doctor.getPhoneNumber() == null || doctor.getPhoneNumber().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Phone number is required.");
            }

            // Link managed department if provided
            if (doctor.getDepartment() != null && doctor.getDepartment().getId() != null && departmentRepository != null) {
                Department dept = departmentRepository.findById(doctor.getDepartment().getId()).orElse(null);
                doctor.setDepartment(dept);
            }

            // 1. Save doctor profile first
            Doctor savedDoctor = doctorService.saveDoctor(doctor);

            // 2. Automatically create an approved login User account for this doctor
            String baseUsername = (savedDoctor.getEmail() != null && !savedDoctor.getEmail().trim().isEmpty())
                    ? savedDoctor.getEmail().trim().toLowerCase()
                    : savedDoctor.getFirstName().trim().toLowerCase().replaceAll("[^a-z0-9]", "") + "123";

            String username = baseUsername;
            int counter = 1;
            while (userRepository.findByUsername(username).isPresent()) {
                username = baseUsername.contains("@")
                        ? baseUsername.replace("@", counter + "@")
                        : baseUsername + counter;
                counter++;
                if (counter > 100) break;
            }

            if (userRepository != null && userRepository.findByUsername(username).isEmpty()) {
                User doctorUser = new User();
                doctorUser.setUsername(username);
                doctorUser.setPassword(passwordEncoder != null ? passwordEncoder.encode("doctor123") : "doctor123"); // Default password
                doctorUser.setFullName("Dr. " + savedDoctor.getFirstName() + " " + savedDoctor.getLastName());
                doctorUser.setRole(Role.DOCTOR);
                doctorUser.setStatus("APPROVED"); // Crucial: must be APPROVED for login
                
                User savedUser = userRepository.save(doctorUser);
                savedDoctor.setUser(savedUser);
                doctorService.saveDoctor(savedDoctor);
                System.out.println("✅ Created and linked login account for Doctor: " + username);
            }

            if (auditLogService != null) {
                auditLogService.log(actor, "DOCTOR_CREATE", "SUCCESS",
                        "Created doctor ID: " + savedDoctor.getId() + " (Dr. " + savedDoctor.getFirstName() + " " + savedDoctor.getLastName() + ")");
            }

            return ResponseEntity.ok(savedDoctor);
        } catch (IllegalArgumentException e) {
            if (auditLogService != null) {
                auditLogService.log(actor, "DOCTOR_CREATE", "FAILED", e.getMessage());
            }
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            String msg = e.getMessage();
            Throwable current = e;
            while (current != null) {
                if (current.getMessage() != null && (current.getMessage().toLowerCase().contains("duplicate") || current.getMessage().toLowerCase().contains("unique"))) {
                    msg = "A doctor or user account with this email or username already exists.";
                    break;
                }
                current = current.getCause();
            }
            if (auditLogService != null) {
                auditLogService.log(actor, "DOCTOR_CREATE", "FAILED", "Failed to add doctor: " + msg);
            }
            return ResponseEntity.badRequest().body("Failed to add doctor: " + msg);
        }
    }

    public ResponseEntity<?> createDoctor(Doctor doctor) {
        return createDoctor(doctor, null);
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'DOCTOR', 'RECEPTIONIST', 'NURSE', 'PATIENT', 'ROLE_ADMIN', 'ROLE_DOCTOR', 'ROLE_RECEPTIONIST', 'ROLE_NURSE', 'ROLE_PATIENT')")
    public List<Doctor> getAllDoctors() {
        return doctorService.getAllDoctors();
    }

    // Retrieve logged-in doctor's own profile
    @GetMapping("/profile")
    @PreAuthorize("hasAnyAuthority('DOCTOR', 'ROLE_DOCTOR', 'ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<?> getMyDoctorProfile(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }
        Optional<Doctor> opt = doctorService.getDoctorByUsername(authentication.getName());
        return opt.<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body("Doctor profile not found for user: " + authentication.getName()));
    }

    // Retrieve single doctor by ID
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'DOCTOR', 'RECEPTIONIST', 'NURSE', 'PATIENT', 'ROLE_ADMIN', 'ROLE_DOCTOR', 'ROLE_RECEPTIONIST', 'ROLE_NURSE', 'ROLE_PATIENT')")
    public ResponseEntity<?> getDoctorById(@PathVariable Long id) {
        return doctorService.getDoctorById(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body("Doctor not found with ID: " + id));
    }

    // Update doctor details, contact info, consultation fee, department and availability (Admin only)
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<?> updateDoctor(@PathVariable Long id, @RequestBody Doctor doctorDetails) {
        try {
            Doctor updated = doctorService.updateDoctor(id, doctorDetails);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to update doctor: " + e.getMessage());
        }
    }

    // Delete doctor by ID (Admin only)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<?> deleteDoctor(@PathVariable Long id, Authentication authentication) {
        String actor = (authentication != null) ? authentication.getName() : "ADMIN";
        try {
            Doctor doctor = doctorService.getDoctorById(id).orElse(null);
            String docName = (doctor != null) ? ("Dr. " + doctor.getFirstName() + " " + doctor.getLastName()) : ("ID #" + id);

            doctorService.deleteDoctor(id);

            if (auditLogService != null) {
                auditLogService.log(actor, "DOCTOR_DELETE", "SUCCESS", "Deleted doctor profile: " + docName + " (ID: " + id + ")");
            }

            return ResponseEntity.ok("Doctor " + docName + " deleted successfully.");
        } catch (IllegalArgumentException e) {
            if (auditLogService != null) {
                auditLogService.log(actor, "DOCTOR_DELETE", "FAILED", e.getMessage());
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (IllegalStateException e) {
            if (auditLogService != null) {
                auditLogService.log(actor, "DOCTOR_DELETE", "FAILED", e.getMessage());
            }
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            if (auditLogService != null) {
                auditLogService.log(actor, "DOCTOR_DELETE", "FAILED", "Failed to delete doctor ID " + id + ": " + e.getMessage());
            }
            return ResponseEntity.badRequest().body("Failed to delete doctor: " + e.getMessage());
        }
    }

    public ResponseEntity<?> deleteDoctor(Long id) {
        return deleteDoctor(id, null);
    }
}