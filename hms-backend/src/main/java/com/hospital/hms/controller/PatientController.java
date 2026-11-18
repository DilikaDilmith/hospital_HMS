package com.hospital.hms.controller;

import com.hospital.hms.entity.Patient;
import com.hospital.hms.entity.User;
import com.hospital.hms.repository.UserRepository;
import com.hospital.hms.service.AuditLogService;
import com.hospital.hms.service.PatientService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/patients")
public class PatientController {

    @Autowired
    private PatientService patientService;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired(required = false)
    private UserRepository userRepository;

    public void setAuditLogService(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    public void setPatientService(PatientService patientService) {
        this.patientService = patientService;
    }

    public void setUserRepository(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // Endpoint to register a new patient (POST request)
    @PostMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'ROLE_ADMIN', 'ROLE_RECEPTIONIST', 'ROLE_DOCTOR')")
    public ResponseEntity<?> registerPatient(@RequestBody Patient patient, Authentication authentication) {
        String actor = (authentication != null) ? authentication.getName() : "STAFF";
        try {
            Patient savedPatient = patientService.registerPatient(patient);
            if (auditLogService != null) {
                auditLogService.log(actor, "PATIENT_REGISTER", "SUCCESS",
                        "Registered patient ID: " + savedPatient.getId() + " (" + savedPatient.getFirstName() + " " + savedPatient.getLastName() + ")");
            }
            return ResponseEntity.ok(savedPatient);
        } catch (IllegalArgumentException e) {
            if (auditLogService != null) {
                auditLogService.log(actor, "PATIENT_REGISTER", "FAILED", e.getMessage());
            }
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            String errorMsg = e.getMessage();
            Throwable current = e;
            boolean isDuplicateNic = false;
            while (current != null) {
                String msg = current.getMessage();
                if (msg != null && (msg.contains("Duplicate entry") || msg.contains("UK2bet3hc33mwd8qepbkgx0bsr") || msg.contains("UK2bet3hc33mwd8qiepbkgx0bsr") || msg.toLowerCase().contains("nic"))) {
                    isDuplicateNic = true;
                    break;
                }
                current = current.getCause();
            }

            if (isDuplicateNic) {
                errorMsg = "A patient with this National Identity Card (NIC) is already registered in the system.";
            } else {
                errorMsg = "Failed to register patient: " + (errorMsg != null ? errorMsg : "Unexpected error");
            }
            if (auditLogService != null) {
                auditLogService.log(actor, "PATIENT_REGISTER", "FAILED", errorMsg);
            }
            return ResponseEntity.badRequest().body(errorMsg);
        }
    }

    public ResponseEntity<?> registerPatient(Patient patient) {
        return registerPatient(patient, null);
    }

    // Endpoint to get a list of all patients (Staff only - Patients are forbidden)
    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'DOCTOR', 'RECEPTIONIST', 'NURSE', 'ACCOUNTANT', 'ROLE_ADMIN', 'ROLE_DOCTOR', 'ROLE_RECEPTIONIST', 'ROLE_NURSE', 'ROLE_ACCOUNTANT')")
    public ResponseEntity<List<Patient>> getAllPatients() {
        return ResponseEntity.ok(patientService.getAllPatients());
    }

    // Endpoint to get the logged-in patient's own profile (reflecting User-Patient link)
    @GetMapping("/profile")
    @PreAuthorize("hasAnyAuthority('PATIENT', 'ROLE_PATIENT', 'ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<?> getMyProfile(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }
        String username = authentication.getName();
        Optional<Patient> opt = patientService.getPatientByUsername(username);
        if (opt.isPresent()) {
            return ResponseEntity.ok(opt.get());
        }
        // Auto-provision unique linked Patient record if user is registered as a patient
        if (userRepository != null) {
            User user = userRepository.findByUsername(username).orElse(null);
            if (user != null) {
                Patient created = patientService.createPatientForUser(user);
                return ResponseEntity.ok(created);
            }
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }

    // Endpoint to update the logged-in patient's profile details
    @PutMapping("/profile")
    @PreAuthorize("hasAnyAuthority('PATIENT', 'ROLE_PATIENT', 'ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<?> updateMyProfile(Authentication authentication, @RequestBody Patient updatedDetails) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }
        String username = authentication.getName();
        try {
            Patient updated = patientService.updatePatientByUsername(username, updatedDetails);
            if (auditLogService != null) {
                auditLogService.log(username, "PATIENT_PROFILE_UPDATE", "SUCCESS", "Patient updated personal profile");
            }
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            if (auditLogService != null) {
                auditLogService.log(username, "PATIENT_PROFILE_UPDATE", "FAILED", e.getMessage());
            }
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            if (auditLogService != null) {
                auditLogService.log(username, "PATIENT_PROFILE_UPDATE", "FAILED", "Failed profile update: " + e.getMessage());
            }
            return ResponseEntity.badRequest().body("Failed to update profile: " + e.getMessage());
        }
    }

    // Endpoint to get a specific patient by ID (Staff can view any; Patients can only view their own)
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'DOCTOR', 'RECEPTIONIST', 'NURSE', 'ACCOUNTANT', 'PATIENT', 'ROLE_ADMIN', 'ROLE_DOCTOR', 'ROLE_RECEPTIONIST', 'ROLE_NURSE', 'ROLE_ACCOUNTANT', 'ROLE_PATIENT')")
    public ResponseEntity<?> getPatientById(@PathVariable Long id, Authentication authentication) {
        Patient patient = patientService.getPatientById(id).orElse(null);
        if (patient == null) {
            return ResponseEntity.notFound().build();
        }

        // Ownership enforcement for patients
        if (isCallerPatientOnly(authentication)) {
            if (patient.getUser() == null || !patient.getUser().getUsername().equals(authentication.getName())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Access denied: You are not authorized to view other patients' confidential records.");
            }
        }

        return ResponseEntity.ok(patient);
    }

    // Endpoint to update a patient by ID (Staff can update any; Patients can only update their own)
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'PATIENT', 'ROLE_ADMIN', 'ROLE_RECEPTIONIST', 'ROLE_DOCTOR', 'ROLE_PATIENT')")
    public ResponseEntity<?> updatePatient(@PathVariable Long id, @RequestBody Patient updatedPatient, Authentication authentication) {
        try {
            Patient existing = patientService.getPatientById(id).orElse(null);
            if (existing == null) {
                return ResponseEntity.notFound().build();
            }

            if (isCallerPatientOnly(authentication)) {
                if (existing.getUser() == null || !existing.getUser().getUsername().equals(authentication.getName())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body("Access denied: You are not authorized to modify other patients' profiles.");
                }
            }

            Patient patient = patientService.updatePatient(id, updatedPatient);
            if (auditLogService != null) {
                auditLogService.log(authentication != null ? authentication.getName() : "STAFF",
                        "PATIENT_UPDATE", "SUCCESS", "Updated patient record ID: " + id);
            }
            return ResponseEntity.ok(patient);
        } catch (Exception e) {
            if (auditLogService != null) {
                auditLogService.log(authentication != null ? authentication.getName() : "STAFF",
                        "PATIENT_UPDATE", "FAILED", "Failed to update patient ID: " + id + " - " + e.getMessage());
            }
            return ResponseEntity.badRequest().body("Failed to update patient: " + e.getMessage());
        }
    }

    // Endpoint to delete a patient by ID (Admin only)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<?> deletePatient(@PathVariable Long id, Authentication authentication) {
        String actor = (authentication != null) ? authentication.getName() : "ADMIN";
        try {
            Patient patient = patientService.getPatientById(id).orElse(null);
            String patientName = (patient != null) ? (patient.getFirstName() + " " + patient.getLastName()) : ("ID #" + id);

            patientService.deletePatient(id);

            if (auditLogService != null) {
                auditLogService.log(actor, "PATIENT_DELETE", "SUCCESS", "Deleted patient profile: " + patientName + " (ID: " + id + ")");
            }

            return ResponseEntity.ok("Patient " + patientName + " was deleted successfully.");
        } catch (IllegalArgumentException e) {
            if (auditLogService != null) {
                auditLogService.log(actor, "PATIENT_DELETE", "FAILED", e.getMessage());
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (IllegalStateException e) {
            if (auditLogService != null) {
                auditLogService.log(actor, "PATIENT_DELETE", "FAILED", e.getMessage());
            }
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            if (auditLogService != null) {
                auditLogService.log(actor, "PATIENT_DELETE", "FAILED", "Failed to delete patient ID " + id + ": " + e.getMessage());
            }
            return ResponseEntity.badRequest().body("Failed to delete patient: " + e.getMessage());
        }
    }

    public ResponseEntity<?> deletePatient(Long id) {
        return deletePatient(id, null);
    }

    // Helper: returns true if the authenticated user only has PATIENT role
    private boolean isCallerPatientOnly(Authentication authentication) {
        if (authentication == null) return false;
        boolean hasPatient = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("PATIENT") || a.getAuthority().equals("ROLE_PATIENT"));
        boolean hasStaff = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().contains("ADMIN") || a.getAuthority().contains("DOCTOR") 
                            || a.getAuthority().contains("RECEPTIONIST") || a.getAuthority().contains("NURSE")
                            || a.getAuthority().contains("ACCOUNTANT"));
        return hasPatient && !hasStaff;
    }
}
