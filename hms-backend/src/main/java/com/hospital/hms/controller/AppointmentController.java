package com.hospital.hms.controller;

import com.hospital.hms.entity.Appointment;
import com.hospital.hms.entity.AppointmentStatus;
import com.hospital.hms.exception.AppointmentConflictException;
import com.hospital.hms.service.AppointmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    @Autowired
    private AppointmentService appointmentService;

    // Endpoint to book an appointment (Patients auto-bind to their own profile; Staff can specify patient)
    @PostMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'PATIENT', 'ROLE_ADMIN', 'ROLE_RECEPTIONIST', 'ROLE_DOCTOR', 'ROLE_PATIENT')")
    public ResponseEntity<?> bookAppointment(@RequestBody Appointment appointment, Authentication authentication) {
        try {
            if (isCallerPatientOnly(authentication)) {
                // Ignore any client-sent patient ID or status; securely bind to authenticated principal
                Appointment created = appointmentService.bookAppointmentForUser(appointment, authentication.getName());
                return ResponseEntity.status(HttpStatus.CREATED).body(created);
            } else {
                Appointment created = appointmentService.bookAppointment(appointment);
                return ResponseEntity.status(HttpStatus.CREATED).body(created);
            }
        } catch (AppointmentConflictException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to book appointment: " + e.getMessage());
        }
    }

    // Endpoint to retrieve all appointments (Staff only - Patients must use /my)
    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE', 'ROLE_ADMIN', 'ROLE_RECEPTIONIST', 'ROLE_DOCTOR', 'ROLE_NURSE')")
    public List<Appointment> getAllAppointments() {
        return appointmentService.getAllAppointments();
    }

    // Endpoint for authenticated patients to view their own appointment schedule
    @GetMapping("/my")
    @PreAuthorize("hasAnyAuthority('PATIENT', 'ROLE_PATIENT')")
    public List<Appointment> getMyAppointments(Authentication authentication) {
        return appointmentService.getAppointmentsByPatientUsername(authentication.getName());
    }

    // Endpoint to retrieve an appointment by ID (Staff can view any; Patients can only view their own)
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE', 'PATIENT', 'ROLE_ADMIN', 'ROLE_RECEPTIONIST', 'ROLE_DOCTOR', 'ROLE_NURSE', 'ROLE_PATIENT')")
    public ResponseEntity<?> getAppointmentById(@PathVariable Long id, Authentication authentication) {
        Appointment appointment = appointmentService.getAppointmentById(id).orElse(null);
        if (appointment == null) {
            return ResponseEntity.notFound().build();
        }

        if (isCallerPatientOnly(authentication)) {
            if (appointment.getPatient() == null || appointment.getPatient().getUser() == null
                    || !appointment.getPatient().getUser().getUsername().equals(authentication.getName())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Access denied: You are not authorized to view other patients' appointments.");
            }
        }

        return ResponseEntity.ok(appointment);
    }

    // Endpoint to retrieve appointments for a specific patient
    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE', 'PATIENT', 'ROLE_ADMIN', 'ROLE_RECEPTIONIST', 'ROLE_DOCTOR', 'ROLE_NURSE', 'ROLE_PATIENT')")
    public ResponseEntity<?> getAppointmentsByPatientId(@PathVariable Long patientId, Authentication authentication) {
        List<Appointment> list = appointmentService.getAppointmentsByPatientId(patientId);

        if (isCallerPatientOnly(authentication)) {
            // Verify patientId belongs to the caller
            boolean mismatch = list.stream().anyMatch(a -> a.getPatient() != null && a.getPatient().getUser() != null
                    && !a.getPatient().getUser().getUsername().equals(authentication.getName()));
            if (mismatch) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Access denied: You can only retrieve your own appointment schedule.");
            }
        }

        return ResponseEntity.ok(list);
    }

    // Endpoint to retrieve appointments for a specific doctor
    @GetMapping("/doctor/{doctorId}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'DOCTOR', 'RECEPTIONIST', 'NURSE', 'ROLE_ADMIN', 'ROLE_DOCTOR', 'ROLE_RECEPTIONIST', 'ROLE_NURSE')")
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
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
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
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to complete appointment: " + e.getMessage());
        }
    }

    // Dedicated endpoint to cancel an appointment (Patients can only cancel their own)
    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'PATIENT', 'ROLE_ADMIN', 'ROLE_RECEPTIONIST', 'ROLE_DOCTOR', 'ROLE_PATIENT')")
    public ResponseEntity<?> cancelAppointment(@PathVariable Long id, Authentication authentication) {
        try {
            if (isCallerPatientOnly(authentication)) {
                Appointment appt = appointmentService.getAppointmentById(id).orElse(null);
                if (appt == null) {
                    return ResponseEntity.notFound().build();
                }
                if (appt.getPatient() == null || appt.getPatient().getUser() == null
                        || !appt.getPatient().getUser().getUsername().equals(authentication.getName())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body("Access denied: You can only cancel your own appointments.");
                }
            }

            Appointment cancelled = appointmentService.cancelAppointment(id);
            return ResponseEntity.ok(cancelled);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to cancel appointment: " + e.getMessage());
        }
    }

    // Dedicated endpoint to reschedule an appointment (Patients can only reschedule their own)
    @PutMapping("/{id}/reschedule")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'PATIENT', 'ROLE_ADMIN', 'ROLE_RECEPTIONIST', 'ROLE_DOCTOR', 'ROLE_PATIENT')")
    public ResponseEntity<?> rescheduleAppointment(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload,
            Authentication authentication) {
        try {
            if (isCallerPatientOnly(authentication)) {
                Appointment appt = appointmentService.getAppointmentById(id).orElse(null);
                if (appt == null) {
                    return ResponseEntity.notFound().build();
                }
                if (appt.getPatient() == null || appt.getPatient().getUser() == null
                        || !appt.getPatient().getUser().getUsername().equals(authentication.getName())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body("Access denied: You can only reschedule your own appointments.");
                }
            }

            String dateTimeStr = payload != null ? payload.get("appointmentDateTime") : null;
            if (dateTimeStr == null || dateTimeStr.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("New appointment date and time is required.");
            }

            LocalDateTime newDateTime;
            try {
                newDateTime = LocalDateTime.parse(dateTimeStr.trim());
            } catch (Exception parseEx) {
                return ResponseEntity.badRequest().body("Invalid date format. Expected ISO-8601 format (e.g. 2026-11-20T10:30:00).");
            }

            Appointment rescheduled = appointmentService.rescheduleAppointment(id, newDateTime);
            return ResponseEntity.ok(rescheduled);
        } catch (AppointmentConflictException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to reschedule appointment: " + e.getMessage());
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
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid appointment status. Allowed values: SCHEDULED, CONFIRMED, CHECKED_IN, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to update appointment: " + e.getMessage());
        }
    }

    private boolean isCallerPatientOnly(Authentication authentication) {
        if (authentication == null) return false;
        boolean hasPatient = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("PATIENT") || a.getAuthority().equals("ROLE_PATIENT"));
        boolean hasStaff = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().contains("ADMIN") || a.getAuthority().contains("DOCTOR") 
                            || a.getAuthority().contains("RECEPTIONIST") || a.getAuthority().contains("NURSE"));
        return hasPatient && !hasStaff;
    }
}
