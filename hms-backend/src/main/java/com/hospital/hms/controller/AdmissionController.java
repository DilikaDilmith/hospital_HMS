package com.hospital.hms.controller;

import com.hospital.hms.entity.Admission;
import com.hospital.hms.service.AdmissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
    public ResponseEntity<?> getAdmissionById(@PathVariable Long id) {
        return admissionService.getAdmissionById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Endpoint to retrieve admission history for a specific patient
    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE', 'PATIENT', 'ROLE_ADMIN', 'ROLE_RECEPTIONIST', 'ROLE_DOCTOR', 'ROLE_NURSE', 'ROLE_PATIENT')")
    public List<Admission> getAdmissionsByPatientId(@PathVariable Long patientId) {
        return admissionService.getAdmissionsByPatientId(patientId);
    }
}
