package com.hospital.hms;

import com.hospital.hms.controller.AuditLogController;
import com.hospital.hms.controller.AuthController;
import com.hospital.hms.dto.LoginRequest;
import com.hospital.hms.entity.AuditLog;
import com.hospital.hms.entity.Role;
import com.hospital.hms.entity.User;
import com.hospital.hms.repository.AuditLogRepository;
import com.hospital.hms.repository.UserRepository;
import com.hospital.hms.security.JwtAuthenticationFilter;
import com.hospital.hms.security.JwtService;
import com.hospital.hms.service.AuditLogService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SecurityAuditAndSessionSafetyTest {

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private UserDetailsService userDetailsService;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    @InjectMocks
    private AuditLogService auditLogService;

    private JwtService jwtService;
    private AuthController authController;
    private AuditLogController auditLogController;
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        jwtService = new JwtService();

        authController = new AuthController();
        authController.setAuditLogService(auditLogService);

        auditLogController = new AuditLogController();
        auditLogController.setAuditLogService(auditLogService);

        jwtAuthenticationFilter = new JwtAuthenticationFilter();
        jwtAuthenticationFilter.setJwtService(jwtService);
        jwtAuthenticationFilter.setUserDetailsService(userDetailsService);
    }

    @Test
    @DisplayName("Audit Log: Successfully records audit log with correct action, actor and timestamp")
    void testAuditLogCreation() {
        when(auditLogRepository.save(any(AuditLog.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AuditLog log = auditLogService.log("admin_user", "STAFF_CREATE", "SUCCESS", "Created employee profile for John Doe");

        assertNotNull(log);
        assertEquals("admin_user", log.getUsername());
        assertEquals("STAFF_CREATE", log.getAction());
        assertEquals("SUCCESS", log.getResult());
        assertEquals("Created employee profile for John Doe", log.getDetails());
        assertNotNull(log.getTimestamp());
        verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }

    @Test
    @DisplayName("Audit Log Safety: Strictly redacts passwords and tokens from log details")
    void testAuditLogSanitizesSensitiveData() {
        when(auditLogRepository.save(any(AuditLog.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AuditLog log = auditLogService.log("admin_user", "USER_LOGIN", "SUCCESS",
                "User login attempt with password=SecretPassword123 and token=eyJhbGciOiJIUzI1NiJ9");

        assertNotNull(log);
        assertFalse(log.getDetails().contains("SecretPassword123"));
        assertFalse(log.getDetails().contains("eyJhbGciOiJIUzI1NiJ9"));
        assertTrue(log.getDetails().contains("password=[REDACTED]"));
        assertTrue(log.getDetails().contains("token=[REDACTED]"));
    }

    @Test
    @DisplayName("Audit Log Controller: Admin can view all audit logs")
    void testGetAuditLogs() {
        AuditLog sampleLog = new AuditLog();
        sampleLog.setId(1L);
        sampleLog.setUsername("admin");
        sampleLog.setAction("INVOICE_PAYMENT");
        sampleLog.setResult("SUCCESS");
        sampleLog.setDetails("Invoice #10 marked as PAID");

        when(auditLogRepository.findAllByOrderByTimestampDesc()).thenReturn(List.of(sampleLog));

        ResponseEntity<List<AuditLog>> response = auditLogController.getAuditLogs();
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        assertEquals("INVOICE_PAYMENT", response.getBody().get(0).getAction());
    }

    @Test
    @DisplayName("Session Security: Valid JWT is accepted and recognized as active")
    void testValidJwtToken() {
        String token = jwtService.generateToken("doctor_perera");
        assertNotNull(token);
        assertTrue(jwtService.isTokenValid(token, "doctor_perera"));
        assertFalse(jwtService.isTokenExpired(token));
        assertEquals("doctor_perera", jwtService.extractUsername(token));
    }

    @Test
    @DisplayName("Session Security: Expired JWT is strictly rejected by JwtService")
    void testExpiredJwtTokenRejected() {
        // Generate an immediately expired token (expiration time in the past: -1000ms)
        String expiredToken = jwtService.generateToken("nurse_kamal", -1000L);

        assertNotNull(expiredToken);
        // Expired token must return false for isTokenValid and true for isTokenExpired
        assertFalse(jwtService.isTokenValid(expiredToken, "nurse_kamal"));
        assertTrue(jwtService.isTokenExpired(expiredToken));
    }

    @Test
    @DisplayName("Session Security: JwtAuthenticationFilter rejects expired token and does not authenticate")
    void testExpiredJwtTokenRejectedByFilter() throws Exception {
        String expiredToken = jwtService.generateToken("patient_sam", -5000L);

        when(request.getHeader("Authorization")).thenReturn("Bearer " + expiredToken);

        jwtAuthenticationFilter.doFilter(request, response, filterChain);

        // Security context must remain unauthenticated
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain, times(1)).doFilter(request, response);
        verify(userDetailsService, never()).loadUserByUsername(anyString());
    }

    @Test
    @DisplayName("Audit Integration: Login failure records an audit log entry with FAILED result")
    void testLoginFailureLogsAudit() {
        // Setup mock auth failure
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));
        when(auditLogRepository.save(any(AuditLog.class))).thenAnswer(inv -> inv.getArgument(0));

        // Inject dependencies into authController
        authController = new AuthController();
        authController.setAuditLogService(auditLogService);

        try {
            java.lang.reflect.Field authMgrField = AuthController.class.getDeclaredField("authenticationManager");
            authMgrField.setAccessible(true);
            authMgrField.set(authController, authenticationManager);
        } catch (Exception e) {
            fail("Reflection setup failed: " + e.getMessage());
        }

        LoginRequest req = new LoginRequest();
        req.setUsername("bad_actor");
        req.setPassword("wrong_pass");

        ResponseEntity<?> res = authController.loginUser(req);
        assertEquals(HttpStatus.UNAUTHORIZED, res.getStatusCode());

        // Verify auditLogRepository saved a FAILED login attempt
        verify(auditLogRepository, times(1)).save(argThat(log ->
                "bad_actor".equals(log.getUsername()) &&
                "USER_LOGIN".equals(log.getAction()) &&
                "FAILED".equals(log.getResult())
        ));
    }
}
