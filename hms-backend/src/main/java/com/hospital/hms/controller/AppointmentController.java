package com.hospital.hms.controller;

import com.hospital.hms.entity.Appointment;
import com.hospital.hms.entity.AppointmentStatus;
import com.hospital.hms.service.AppointmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    @Autowired
    private AppointmentService appointmentService;

    // Endpoint to book an appointment (defaulted to SCHEDULED)
    @PostMapping
    public Appointment bookAppointment(@RequestBody Appointment appointment) {
        // Enforce default status as SCHEDULED for new appointments
        if (appointment.getStatus() == null) {
            appointment.setStatus(AppointmentStatus.SCHEDULED);
        }
        return appointmentService.bookAppointment(appointment);
    }

    // Endpoint to retrieve all appointments
    @GetMapping
    public List<Appointment> getAllAppointments() {
        return appointmentService.getAllAppointments();
    }

    // Endpoint to retrieve an appointment by ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getAppointmentById(@PathVariable Long id) {
        return appointmentService.getAppointmentById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Endpoint to retrieve appointments for a specific patient
    @GetMapping("/patient/{patientId}")
    public List<Appointment> getAppointmentsByPatientId(@PathVariable Long patientId) {
        return appointmentService.getAppointmentsByPatientId(patientId);
    }

    // Endpoint to retrieve appointments for a specific doctor
    @GetMapping("/doctor/{doctorId}")
    public List<Appointment> getAppointmentsByDoctorId(@PathVariable Long doctorId) {
        return appointmentService.getAppointmentsByDoctorId(doctorId);
    }

    // Dedicated endpoint to change status to 'CHECKED_IN'
    @PutMapping("/{id}/check-in")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE', 'ROLE_ADMIN', 'ROLE_RECEPTIONIST', 'ROLE_DOCTOR', 'ROLE_NURSE')")
    public ResponseEntity<?> checkInAppointment(@PathVariable Long id) {
        try {
            Appointment updated = appointmentService.checkInAppointment(id);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to check in appointment: " + e.getMessage());
        }
    }

    // Dedicated endpoint to change status to 'COMPLETED' (triggers consultation fee billing)
    @PutMapping("/{id}/complete")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'DOCTOR', 'RECEPTIONIST', 'ROLE_ADMIN', 'ROLE_DOCTOR', 'ROLE_RECEPTIONIST')")
    public ResponseEntity<?> completeAppointment(@PathVariable Long id) {
        try {
            Appointment updated = appointmentService.completeAppointment(id);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to complete appointment: " + e.getMessage());
        }
    }

    // General status update endpoint (SCHEDULED, CONFIRMED, CHECKED_IN, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW)
    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE', 'ROLE_ADMIN', 'ROLE_RECEPTIONIST', 'ROLE_DOCTOR', 'ROLE_NURSE')")
    public ResponseEntity<?> updateAppointmentStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> statusUpdate) {
        try {
            String statusStr = statusUpdate.get("status");
            if (statusStr == null || statusStr.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Status value is required.");
            }
            AppointmentStatus status = AppointmentStatus.valueOf(statusStr.trim().toUpperCase());
            Appointment updated = appointmentService.updateAppointmentStatus(id, status);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid appointment status. Allowed values: SCHEDULED, CONFIRMED, CHECKED_IN, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to update appointment: " + e.getMessage());
        }
    }
}
