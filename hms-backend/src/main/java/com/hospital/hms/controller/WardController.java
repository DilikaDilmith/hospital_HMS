package com.hospital.hms.controller;

import com.hospital.hms.entity.Bed;
import com.hospital.hms.entity.BedStatus;
import com.hospital.hms.entity.Ward;
import com.hospital.hms.service.WardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wards")
public class WardController {

    @Autowired
    private WardService wardService;

    // Endpoint to retrieve all hospital wards with bed rosters
    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE', 'ROLE_ADMIN', 'ROLE_RECEPTIONIST', 'ROLE_DOCTOR', 'ROLE_NURSE')")
    public List<Ward> getAllWards() {
        return wardService.getAllWards();
    }

    // Endpoint to create a new ward
    @PostMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<?> createWard(@RequestBody Ward ward) {
        try {
            Ward created = wardService.createWard(ward);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to create ward: " + e.getMessage());
        }
    }

    // Endpoint to retrieve all beds across the hospital
    @GetMapping("/beds")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE', 'ROLE_ADMIN', 'ROLE_RECEPTIONIST', 'ROLE_DOCTOR', 'ROLE_NURSE')")
    public List<Bed> getAllBeds() {
        return wardService.getAllBeds();
    }

    // Endpoint to retrieve only AVAILABLE beds for quick admission dropdown
    @GetMapping("/beds/available")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE', 'ROLE_ADMIN', 'ROLE_RECEPTIONIST', 'ROLE_DOCTOR', 'ROLE_NURSE')")
    public List<Bed> getAvailableBeds() {
        return wardService.getAvailableBeds();
    }

    // Endpoint to add a new bed to a ward
    @PostMapping("/{id}/beds")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<?> addBed(@PathVariable Long id, @RequestBody Bed bed) {
        try {
            Bed created = wardService.addBed(id, bed);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to add bed: " + e.getMessage());
        }
    }

    // Endpoint to change bed status (e.g. toggle MAINTENANCE)
    @PutMapping("/beds/{bedId}/status")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'NURSE', 'RECEPTIONIST', 'ROLE_ADMIN', 'ROLE_NURSE', 'ROLE_RECEPTIONIST')")
    public ResponseEntity<?> updateBedStatus(@PathVariable Long bedId, @RequestBody Map<String, String> payload) {
        try {
            String statusStr = payload.get("status");
            BedStatus status = BedStatus.valueOf(statusStr.toUpperCase());
            Bed updated = wardService.updateBedStatus(bedId, status);
            return ResponseEntity.ok(updated);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to update bed status: " + e.getMessage());
        }
    }
}
