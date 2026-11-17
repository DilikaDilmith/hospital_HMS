package com.hospital.hms;

import com.hospital.hms.controller.UserController;
import com.hospital.hms.dto.ChangePasswordRequest;
import com.hospital.hms.dto.DashboardResponse;
import com.hospital.hms.entity.Role;
import com.hospital.hms.entity.User;
import com.hospital.hms.repository.UserRepository;
import com.hospital.hms.service.AuditLogService;
import com.hospital.hms.service.DashboardService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

public class FinalSrsReviewAndTestingTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private UserController userController;

    private User sampleUser;

    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);

        sampleUser = new User();
        sampleUser.setId(1L);
        sampleUser.setUsername("testuser");
        sampleUser.setPassword("encoded_old_pw");
        sampleUser.setFullName("Test User");
        sampleUser.setRole(Role.ADMIN);
        sampleUser.setStatus("APPROVED");

        when(authentication.getName()).thenReturn("testuser");
    }

    @Test
    public void testChangePassword_Success() {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("OldPassword123", "encoded_old_pw")).thenReturn(true);
        when(passwordEncoder.encode("NewPassword123")).thenReturn("encoded_new_pw");

        ChangePasswordRequest request = new ChangePasswordRequest("OldPassword123", "NewPassword123");
        ResponseEntity<?> response = userController.changePassword(request, authentication);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("encoded_new_pw", sampleUser.getPassword());
        verify(userRepository, times(1)).save(sampleUser);
        verify(auditLogService, times(1)).logAction(eq("testuser"), eq("PASSWORD_CHANGE"), eq("SUCCESS"), anyString());
    }

    @Test
    public void testChangePassword_IncorrectCurrentPassword() {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("WrongPassword", "encoded_old_pw")).thenReturn(false);

        ChangePasswordRequest request = new ChangePasswordRequest("WrongPassword", "NewPassword123");
        ResponseEntity<?> response = userController.changePassword(request, authentication);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Current password does not match.", response.getBody());
        verify(userRepository, never()).save(any());
        verify(auditLogService, times(1)).logAction(eq("testuser"), eq("PASSWORD_CHANGE"), eq("FAILED"), anyString());
    }

    @Test
    public void testChangePassword_TooShort() {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(sampleUser));

        ChangePasswordRequest request = new ChangePasswordRequest("OldPassword123", "short");
        ResponseEntity<?> response = userController.changePassword(request, authentication);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("New password must be at least 6 characters long.", response.getBody());
        verify(userRepository, never()).save(any());
    }

    @Test
    public void testChangePassword_MissingCurrentPassword() {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(sampleUser));

        ChangePasswordRequest request = new ChangePasswordRequest("", "NewPassword123");
        ResponseEntity<?> response = userController.changePassword(request, authentication);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Current password is required.", response.getBody());
    }

    @Test
    public void testChangePassword_Unauthenticated() {
        ChangePasswordRequest request = new ChangePasswordRequest("OldPassword123", "NewPassword123");
        ResponseEntity<?> response = userController.changePassword(request, null);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    @Test
    public void testDashboardResponse_TodaysAppointmentsField() {
        DashboardResponse response = new DashboardResponse();
        response.setTotalAppointments(42L);
        response.setTodaysAppointments(5L);

        assertEquals(42L, response.getTotalAppointments());
        assertEquals(5L, response.getTodaysAppointments());
    }

    @Test
    public void testAllSrsRoles_ConfiguredInRoleEnum() {
        // SRS Section 2: Administrator, Doctors, Nurses, Receptionists, Laboratory Staff, Pharmacists, Accountants, Patients
        assertNotNull(Role.valueOf("ADMIN"));
        assertNotNull(Role.valueOf("DOCTOR"));
        assertNotNull(Role.valueOf("NURSE"));
        assertNotNull(Role.valueOf("RECEPTIONIST"));
        assertNotNull(Role.valueOf("LAB_STAFF"));
        assertNotNull(Role.valueOf("PHARMACIST"));
        assertNotNull(Role.valueOf("ACCOUNTANT"));
        assertNotNull(Role.valueOf("PATIENT"));
    }
}
