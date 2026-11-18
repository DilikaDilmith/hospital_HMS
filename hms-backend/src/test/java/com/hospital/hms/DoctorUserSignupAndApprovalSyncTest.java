package com.hospital.hms;

import com.hospital.hms.controller.AuthController;
import com.hospital.hms.controller.UserController;
import com.hospital.hms.dto.SignupRequest;
import com.hospital.hms.entity.Department;
import com.hospital.hms.entity.Doctor;
import com.hospital.hms.entity.Role;
import com.hospital.hms.entity.User;
import com.hospital.hms.repository.DepartmentRepository;
import com.hospital.hms.repository.DoctorRepository;
import com.hospital.hms.repository.UserRepository;
import com.hospital.hms.security.JwtService;
import com.hospital.hms.service.AuditLogService;
import com.hospital.hms.service.DoctorService;
import com.hospital.hms.service.PatientService;
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
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class DoctorUserSignupAndApprovalSyncTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private DoctorRepository doctorRepository;

    @Mock
    private DepartmentRepository departmentRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private PatientService patientService;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private DoctorService doctorService;

    private AuthController authController;
    private UserController userController;

    private Department defaultDept;

    @BeforeEach
    void setUp() {
        doctorService.setDoctorRepository(doctorRepository);
        doctorService.setUserRepository(userRepository);
        doctorService.setDepartmentRepository(departmentRepository);

        authController = new AuthController();
        authController.setDoctorService(doctorService);
        authController.setPatientService(patientService);
        authController.setAuditLogService(auditLogService);
        // Inject mocks into AuthController fields
        try {
            var userRepoField = AuthController.class.getDeclaredField("userRepository");
            userRepoField.setAccessible(true);
            userRepoField.set(authController, userRepository);

            var encoderField = AuthController.class.getDeclaredField("passwordEncoder");
            encoderField.setAccessible(true);
            encoderField.set(authController, passwordEncoder);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        userController = new UserController();
        userController.setDoctorService(doctorService);
        userController.setPatientService(patientService);
        userController.setAuditLogService(auditLogService);
        try {
            var userRepoField = UserController.class.getDeclaredField("userRepository");
            userRepoField.setAccessible(true);
            userRepoField.set(userController, userRepository);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        defaultDept = new Department();
        defaultDept.setId(1L);
        defaultDept.setName("Cardiology");
    }

    @Test
    @DisplayName("DoctorService.createDoctorForUser creates linked Doctor profile with proper defaults")
    void testCreateDoctorForUser_Success() {
        User user = new User();
        user.setId(50L);
        user.setUsername("doc.kasun@gmail.com");
        user.setFullName("Dr. Kasun Wickrama");
        user.setRole(Role.DOCTOR);
        user.setStatus("APPROVED");

        when(doctorRepository.findByUserId(50L)).thenReturn(Optional.empty());
        when(doctorRepository.findByUserUsername("doc.kasun@gmail.com")).thenReturn(Optional.empty());
        when(doctorRepository.findByEmailIgnoreCase("doc.kasun@gmail.com")).thenReturn(Optional.empty());
        when(departmentRepository.findAll()).thenReturn(Collections.singletonList(defaultDept));
        when(doctorRepository.save(any(Doctor.class))).thenAnswer(inv -> {
            Doctor d = inv.getArgument(0);
            d.setId(99L);
            return d;
        });

        Doctor created = doctorService.createDoctorForUser(user);

        assertNotNull(created);
        assertEquals(99L, created.getId());
        assertEquals("Kasun", created.getFirstName());
        assertEquals("Wickrama", created.getLastName());
        assertEquals("doc.kasun@gmail.com", created.getEmail());
        assertEquals("General Medicine", created.getSpecialization());
        assertEquals(1500.0, created.getConsultationFee());
        assertNotNull(created.getUser());
        assertEquals(50L, created.getUser().getId());
        assertEquals(defaultDept, created.getDepartment());
    }

    @Test
    @DisplayName("UserController.approveUser automatically provisions Doctor entity when doctor user is approved")
    void testApproveUser_CreatesDoctorEntity() {
        User pendingDoctor = new User();
        pendingDoctor.setId(51L);
        pendingDoctor.setUsername("doc.chatu@gmail.com");
        pendingDoctor.setFullName("Dr. Chathuri Samaranayaka");
        pendingDoctor.setRole(Role.DOCTOR);
        pendingDoctor.setStatus("PENDING");

        when(userRepository.findById(51L)).thenReturn(Optional.of(pendingDoctor));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        when(doctorRepository.findByUserId(51L)).thenReturn(Optional.empty());
        when(doctorRepository.findByUserUsername("doc.chatu@gmail.com")).thenReturn(Optional.empty());
        when(doctorRepository.findByEmailIgnoreCase("doc.chatu@gmail.com")).thenReturn(Optional.empty());
        when(doctorRepository.save(any(Doctor.class))).thenAnswer(inv -> {
            Doctor d = inv.getArgument(0);
            d.setId(105L);
            return d;
        });

        String result = userController.approveUser(51L);

        assertEquals("User Approved!", result);
        assertEquals("APPROVED", pendingDoctor.getStatus());
        verify(doctorRepository, times(1)).save(any(Doctor.class));
    }

    @Test
    @DisplayName("DoctorService.getAllDoctors filters out unapproved (PENDING) doctors and returns APPROVED doctors")
    void testGetAllDoctors_FiltersPendingDoctors() {
        // Doctor 1: Approved user
        User approvedUser = new User();
        approvedUser.setId(1L);
        approvedUser.setStatus("APPROVED");
        Doctor approvedDoc = new Doctor();
        approvedDoc.setId(10L);
        approvedDoc.setFirstName("Sunil");
        approvedDoc.setUser(approvedUser);

        // Doctor 2: Pending user (waiting for admin approval)
        User pendingUser = new User();
        pendingUser.setId(2L);
        pendingUser.setStatus("PENDING");
        Doctor pendingDoc = new Doctor();
        pendingDoc.setId(20L);
        pendingDoc.setFirstName("Kamal");
        pendingDoc.setUser(pendingUser);

        when(doctorRepository.findAll()).thenReturn(Arrays.asList(approvedDoc, pendingDoc));
        when(userRepository.findByRoleAndStatus(Role.DOCTOR, "APPROVED")).thenReturn(Collections.singletonList(approvedUser));
        when(doctorRepository.findByUserId(1L)).thenReturn(Optional.of(approvedDoc));

        List<Doctor> result = doctorService.getAllDoctors();

        assertEquals(1, result.size());
        assertEquals("Sunil", result.get(0).getFirstName());
    }

    @Test
    @DisplayName("DoctorService.syncApprovedDoctorUsers auto-creates Doctor records for existing approved doctor users")
    void testSyncApprovedDoctorUsers_AutoProvisionsExistingApprovedUsers() {
        User existingApprovedUser = new User();
        existingApprovedUser.setId(5L);
        existingApprovedUser.setUsername("savidu@gmail.com");
        existingApprovedUser.setFullName("Dr. Savidu Perera");
        existingApprovedUser.setRole(Role.DOCTOR);
        existingApprovedUser.setStatus("APPROVED");

        when(userRepository.findByRoleAndStatus(Role.DOCTOR, "APPROVED"))
                .thenReturn(Collections.singletonList(existingApprovedUser));
        when(doctorRepository.findByUserId(5L)).thenReturn(Optional.empty());
        when(doctorRepository.findByUserUsername("savidu@gmail.com")).thenReturn(Optional.empty());
        when(doctorRepository.findByEmailIgnoreCase("savidu@gmail.com")).thenReturn(Optional.empty());
        when(doctorRepository.save(any(Doctor.class))).thenAnswer(inv -> {
            Doctor d = inv.getArgument(0);
            d.setId(200L);
            return d;
        });

        doctorService.syncApprovedDoctorUsers();

        verify(doctorRepository, times(1)).save(any(Doctor.class));
    }

    @Test
    @DisplayName("AuthController.registerUser for DOCTOR role creates doctor record in PENDING state")
    void testSignup_DoctorRole_CreatesDoctorInPendingState() {
        SignupRequest request = new SignupRequest();
        request.setUsername("newdoctor@hospital.lk");
        request.setPassword("Secret123!");
        request.setFullName("Dr. Nimal Fernando");
        request.setRole("DOCTOR");

        when(userRepository.findByUsername("newdoctor@hospital.lk")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("Secret123!")).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(70L);
            return u;
        });

        when(doctorRepository.findByUserId(70L)).thenReturn(Optional.empty());
        when(doctorRepository.findByUserUsername("newdoctor@hospital.lk")).thenReturn(Optional.empty());
        when(doctorRepository.findByEmailIgnoreCase("newdoctor@hospital.lk")).thenReturn(Optional.empty());
        when(doctorRepository.save(any(Doctor.class))).thenAnswer(inv -> {
            Doctor d = inv.getArgument(0);
            d.setId(301L);
            return d;
        });

        ResponseEntity<?> response = authController.registerUser(request);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertTrue(response.getBody().toString().contains("pending Administrator approval"));
        verify(doctorRepository, times(1)).save(any(Doctor.class));
    }
}
