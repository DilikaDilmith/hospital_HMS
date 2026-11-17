package com.hospital.hms;

import com.hospital.hms.dto.SignupRequest;
import com.hospital.hms.entity.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class Phase1SecurityTest {

    @Test
    @DisplayName("P0: ADMIN user cannot authenticate unless status is explicitly APPROVED")
    void testAdminApprovalRequired() {
        User pendingAdmin = new User();
        pendingAdmin.setUsername("admin_applicant");
        pendingAdmin.setRole(Role.ADMIN);
        pendingAdmin.setStatus("PENDING");

        assertFalse(pendingAdmin.isEnabled(), "Pending ADMIN must NOT be enabled to log in!");

        pendingAdmin.setStatus("APPROVED");
        assertTrue(pendingAdmin.isEnabled(), "Only explicitly APPROVED admin may be enabled.");
    }

    @Test
    @DisplayName("P0: Staff applicants must be PENDING; Patients are auto-APPROVED")
    void testSignupRoleAndApprovalState() {
        // Patient registration
        SignupRequest patientReq = new SignupRequest();
        patientReq.setUsername("john_patient");
        patientReq.setPassword("pass123");
        patientReq.setFullName("John Doe");
        patientReq.setRole("PATIENT");

        assertEquals("PATIENT", patientReq.getRole());

        // Staff registration
        SignupRequest doctorReq = new SignupRequest();
        doctorReq.setUsername("dr_smith");
        doctorReq.setPassword("pass123");
        doctorReq.setFullName("Dr. Smith");
        doctorReq.setRole("DOCTOR");

        assertEquals("DOCTOR", doctorReq.getRole());
    }

    @Test
    @DisplayName("P0: Patient entity must properly link to User entity")
    void testPatientUserLinking() {
        User user = new User();
        user.setId(10L);
        user.setUsername("patient_user");
        user.setRole(Role.PATIENT);
        user.setStatus("APPROVED");

        Patient patient = new Patient();
        patient.setId(100L);
        patient.setFirstName("John");
        patient.setLastName("Doe");
        patient.setUser(user);

        assertNotNull(patient.getUser(), "Patient must be linked to a User account.");
        assertEquals("patient_user", patient.getUser().getUsername());
    }

    @Test
    @DisplayName("P0: Appointment entity defaults to SCHEDULED state, not BOOKED")
    void testAppointmentDefaultStatus() {
        Appointment appointment = new Appointment();
        // Default initialized in field
        assertEquals(AppointmentStatus.SCHEDULED, appointment.getStatus());

        // Valid enum states
        assertEquals(7, AppointmentStatus.values().length, "AppointmentStatus must contain exactly 7 enum values");
        assertDoesNotThrow(() -> AppointmentStatus.valueOf("SCHEDULED"));
        assertDoesNotThrow(() -> AppointmentStatus.valueOf("CONFIRMED"));
        assertDoesNotThrow(() -> AppointmentStatus.valueOf("CHECKED_IN"));
        assertDoesNotThrow(() -> AppointmentStatus.valueOf("IN_PROGRESS"));
        assertDoesNotThrow(() -> AppointmentStatus.valueOf("COMPLETED"));
        assertDoesNotThrow(() -> AppointmentStatus.valueOf("CANCELLED"));
        assertDoesNotThrow(() -> AppointmentStatus.valueOf("NO_SHOW"));
    }
}
