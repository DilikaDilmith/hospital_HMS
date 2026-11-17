package com.hospital.hms.controller;

import com.hospital.hms.entity.LabTest;
import com.hospital.hms.service.LabTestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/lab-tests")
public class LabTestController {

    @Autowired
    private LabTestService labTestService;

    // Endpoint for Doctor or Admin to order a new lab test
    @PostMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'DOCTOR', 'ROLE_ADMIN', 'ROLE_DOCTOR')")
    public ResponseEntity<?> requestTest(@RequestBody LabTest labTest) {
        try {
            LabTest created = labTestService.requestTest(labTest);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to order lab test: " + e.getMessage());
        }
    }

    // Endpoint to retrieve all lab tests
    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'DOCTOR', 'LAB_STAFF', 'ROLE_ADMIN', 'ROLE_DOCTOR', 'ROLE_LAB_STAFF')")
    public List<LabTest> getAllTests() {
        return labTestService.getAllTests();
    }

    // Endpoint to retrieve single lab test by ID
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'DOCTOR', 'LAB_STAFF', 'PATIENT', 'ROLE_ADMIN', 'ROLE_DOCTOR', 'ROLE_LAB_STAFF', 'ROLE_PATIENT')")
    public ResponseEntity<?> getTestById(@PathVariable Long id) {
        return labTestService.getTestById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Endpoint to retrieve lab tests for a patient
    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'DOCTOR', 'LAB_STAFF', 'PATIENT', 'ROLE_ADMIN', 'ROLE_DOCTOR', 'ROLE_LAB_STAFF', 'ROLE_PATIENT')")
    public List<LabTest> getTestsByPatientId(@PathVariable Long patientId) {
        return labTestService.getTestsByPatientId(patientId);
    }

    // Endpoint for Lab Staff to mark sample as collected (REQUESTED -> SAMPLE_COLLECTED)
    @PutMapping("/{id}/collect-sample")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'LAB_STAFF', 'ROLE_ADMIN', 'ROLE_LAB_STAFF')")
    public ResponseEntity<?> collectSample(@PathVariable Long id) {
        try {
            LabTest updated = labTestService.collectSample(id);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to mark sample collected: " + e.getMessage());
        }
    }

    // Endpoint for Lab Staff to submit test results and complete test (triggers auto-billing)
    @PutMapping("/{id}/complete")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'LAB_STAFF', 'ROLE_ADMIN', 'ROLE_LAB_STAFF')")
    public ResponseEntity<?> completeTest(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        try {
            String result = payload.get("result");
            if (result == null || result.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Test result text/findings is required.");
            }
            LabTest updated = labTestService.completeTest(id, result.trim());
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to complete lab test: " + e.getMessage());
        }
    }
}