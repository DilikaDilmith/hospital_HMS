package com.hospital.hms.controller;

import com.hospital.hms.entity.Admission;
import com.hospital.hms.service.AdmissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admissions")
public class AdmissionController {

    @Autowired
    private AdmissionService admissionService;

    // Endpoint to admit a patient to a bed (Sets Bed to OCCUPIED)
    @PostMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'ROLE_ADMIN', 'ROLE_RECEPTIONIST', 'ROLE_DOCTOR')")
    public ResponseEntity<?> admitPatient(@RequestBody Admission admission) {
        try {
            Admission created = admissionService.admitPatient(admission);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to admit patient: " + e.getMessage());
        }
    }

    // Endpoint to discharge a patient (Calculates days * rate, auto-bills WARD fee, sets Bed to AVAILABLE)
    @PutMapping("/{id}/discharge")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE', 'ROLE_ADMIN', 'ROLE_RECEPTIONIST', 'ROLE_DOCTOR', 'ROLE_NURSE')")
    public ResponseEntity<?> dischargePatient(
            @PathVariable Long id, 
            @RequestBody(required = false) Map<String, String> payload) {
        try {
            String notes = payload != null ? payload.get("dischargeNotes") : "";
            Admission discharged = admissionService.dischargePatient(id, notes);
            return ResponseEntity.ok(discharged);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to discharge patient: " + e.getMessage());
        }
    }

    // Endpoint to retrieve all admissions
    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE', 'ROLE_ADMIN', 'ROLE_RECEPTIONIST', 'ROLE_DOCTOR', 'ROLE_NURSE')")
    public List<Admission> getAllAdmissions() {
        return admissionService.getAllAdmissions();
    }

    // Endpoint to retrieve currently admitted inpatients (for Nurse Dashboard & Inpatient Ward)
    @GetMapping("/active")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE', 'ROLE_ADMIN', 'ROLE_RECEPTIONIST', 'ROLE_DOCTOR', 'ROLE_NURSE')")
    public List<Admission> getActiveAdmissions() {
        return admissionService.getActiveAdmissions();
    }

    // Endpoint to retrieve single admission details by ID
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE', 'PATIENT', 'ROLE_ADMIN', 'ROLE_RECEPTIONIST', 'ROLE_DOCTOR', 'ROLE_NURSE', 'ROLE_PATIENT')")
    public ResponseEntity<?> getAdmissionById(@PathVariable Long id, Authentication authentication) {
        Admission admission = admissionService.getAdmissionById(id).orElse(null);
        if (admission == null) {
            return ResponseEntity.notFound().build();
        }

        if (isCallerPatientOnly(authentication)) {
            if (admission.getPatient() == null || admission.getPatient().getUser() == null
                    || !admission.getPatient().getUser().getUsername().equals(authentication.getName())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Access denied: You are not authorized to view other patients' admission records.");
            }
        }

        return ResponseEntity.ok(admission);
    }

    // Endpoint for authenticated patients to retrieve their own admissions
    @GetMapping("/my")
    @PreAuthorize("hasAnyAuthority('PATIENT', 'ROLE_PATIENT')")
    public List<Admission> getMyAdmissions(Authentication authentication) {
        return admissionService.getAdmissionsByPatientUsername(authentication.getName());
    }

    // Endpoint to retrieve admission history for a specific patient
    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE', 'PATIENT', 'ROLE_ADMIN', 'ROLE_RECEPTIONIST', 'ROLE_DOCTOR', 'ROLE_NURSE', 'ROLE_PATIENT')")
    public ResponseEntity<?> getAdmissionsByPatientId(@PathVariable Long patientId, Authentication authentication) {
        List<Admission> list = admissionService.getAdmissionsByPatientId(patientId);

        if (isCallerPatientOnly(authentication)) {
            boolean mismatch = list.stream().anyMatch(a -> a.getPatient() != null && a.getPatient().getUser() != null
                    && !a.getPatient().getUser().getUsername().equals(authentication.getName()));
            if (mismatch) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Access denied: You cannot view other patients' admission records.");
            }
        }

        return ResponseEntity.ok(list);
    }

    private boolean isCallerPatientOnly(Authentication authentication) {
        if (authentication == null) return false;
        boolean hasPatient = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("PATIENT") || a.getAuthority().equals("ROLE_PATIENT"));
        boolean hasStaff = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().contains("ADMIN") || a.getAuthority().contains("DOCTOR") 
                            || a.getAuthority().contains("NURSE") || a.getAuthority().contains("RECEPTIONIST"));
        return hasPatient && !hasStaff;
    }
}
