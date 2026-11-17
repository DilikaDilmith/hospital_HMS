package com.hospital.hms.controller;

import com.hospital.hms.entity.Patient;
import com.hospital.hms.service.PatientService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/patients")
public class PatientController {

    @Autowired
    private PatientService patientService;

    // Endpoint to register a new patient (POST request)
    @PostMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'ROLE_ADMIN', 'ROLE_RECEPTIONIST', 'ROLE_DOCTOR')")
    public ResponseEntity<?> registerPatient(@RequestBody Patient patient) {
        try {
            Patient savedPatient = patientService.registerPatient(patient);
            return ResponseEntity.ok(savedPatient);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to register patient: " + e.getMessage());
        }
    }

    // Endpoint to get a list of all patients (GET request)
    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'DOCTOR', 'RECEPTIONIST', 'NURSE', 'ACCOUNTANT', 'PATIENT', 'ROLE_ADMIN', 'ROLE_DOCTOR', 'ROLE_RECEPTIONIST', 'ROLE_NURSE', 'ROLE_ACCOUNTANT', 'ROLE_PATIENT')")
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
        return patientService.getPatientByUsername(username)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
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
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to update profile: " + e.getMessage());
        }
    }

    // Endpoint to get a specific patient by ID
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'DOCTOR', 'RECEPTIONIST', 'NURSE', 'ACCOUNTANT', 'PATIENT', 'ROLE_ADMIN', 'ROLE_DOCTOR', 'ROLE_RECEPTIONIST', 'ROLE_NURSE', 'ROLE_ACCOUNTANT', 'ROLE_PATIENT')")
    public ResponseEntity<?> getPatientById(@PathVariable Long id) {
        return patientService.getPatientById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Endpoint to update a patient by ID (Admin / Receptionist)
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'ROLE_ADMIN', 'ROLE_RECEPTIONIST', 'ROLE_DOCTOR')")
    public ResponseEntity<?> updatePatient(@PathVariable Long id, @RequestBody Patient updatedPatient) {
        try {
            Patient patient = patientService.updatePatient(id, updatedPatient);
            return ResponseEntity.ok(patient);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to update patient: " + e.getMessage());
        }
    }
}
