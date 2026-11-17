package com.hospital.hms.controller;

import com.hospital.hms.entity.Medicine;
import com.hospital.hms.entity.MedicineBatch;
import com.hospital.hms.entity.Patient;
import com.hospital.hms.repository.PatientRepository;
import com.hospital.hms.service.MedicineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/medicines")
public class MedicineController {

    @Autowired
    private MedicineService medicineService;

    @Autowired
    private PatientRepository patientRepository;

    // Endpoint to add a new medicine to inventory
    @PostMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'PHARMACIST', 'ROLE_ADMIN', 'ROLE_PHARMACIST')")
    public ResponseEntity<?> addMedicine(@RequestBody Medicine medicine) {
        try {
            Medicine created = medicineService.addMedicine(medicine);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to add medicine: " + e.getMessage());
        }
    }

    // Endpoint to view all available medicines
    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'PHARMACIST', 'DOCTOR', 'ROLE_ADMIN', 'ROLE_PHARMACIST', 'ROLE_DOCTOR')")
    public List<Medicine> getAllMedicines() {
        return medicineService.getAllMedicines();
    }

    // Endpoint to view single medicine by ID
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'PHARMACIST', 'DOCTOR', 'ROLE_ADMIN', 'ROLE_PHARMACIST', 'ROLE_DOCTOR')")
    public ResponseEntity<?> getMedicineById(@PathVariable Long id) {
        return medicineService.getMedicineById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Endpoint to view all inventory batches across all medicines
    @GetMapping("/batches")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'PHARMACIST', 'ROLE_ADMIN', 'ROLE_PHARMACIST')")
    public List<MedicineBatch> getAllBatches() {
        return medicineService.getAllBatches();
    }

    // Endpoint to view batches for a specific medicine
    @GetMapping("/{id}/batches")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'PHARMACIST', 'ROLE_ADMIN', 'ROLE_PHARMACIST')")
    public List<MedicineBatch> getBatchesByMedicineId(@PathVariable Long id) {
        return medicineService.getBatchesByMedicineId(id);
    }

    // Endpoint to add a new stock batch to an existing medicine
    @PostMapping("/{id}/batches")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'PHARMACIST', 'ROLE_ADMIN', 'ROLE_PHARMACIST')")
    public ResponseEntity<?> addBatch(@PathVariable Long id, @RequestBody MedicineBatch batch) {
        try {
            MedicineBatch created = medicineService.addBatch(id, batch);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to add batch: " + e.getMessage());
        }
    }

    // Endpoint for Pharmacist to dispense medicine using FEFO batch deduction & auto-billing
    @PostMapping("/{id}/dispense")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'PHARMACIST', 'ROLE_ADMIN', 'ROLE_PHARMACIST')")
    public ResponseEntity<?> dispenseMedicine(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload) {
        try {
            int quantity = Integer.parseInt(payload.get("quantity").toString());
            Patient patient = null;

            if (payload.get("patientId") != null) {
                Long patientId = Long.parseLong(payload.get("patientId").toString());
                patient = patientRepository.findById(patientId).orElse(null);
            }

            Map<String, Object> result = medicineService.dispenseMedicine(id, quantity, patient);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to dispense medicine: " + e.getMessage());
        }
    }
}