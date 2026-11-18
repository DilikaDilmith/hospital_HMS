package com.hospital.hms;

import com.hospital.hms.controller.AdmissionController;
import com.hospital.hms.controller.DoctorController;
import com.hospital.hms.entity.*;
import com.hospital.hms.repository.DepartmentRepository;
import com.hospital.hms.repository.UserRepository;
import com.hospital.hms.service.AdmissionService;
import com.hospital.hms.service.AuditLogService;
import com.hospital.hms.service.DoctorService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.lang.reflect.Method;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class NurseInpatientAdmissionSecurityTest {

    @Mock
    private DoctorService doctorService;

    @Mock
    private AdmissionService admissionService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private DepartmentRepository departmentRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private DoctorController doctorController;

    @InjectMocks
    private AdmissionController admissionController;

    @BeforeEach
    void setUp() {
        doctorController.setDoctorService(doctorService);
        doctorController.setUserRepository(userRepository);
        doctorController.setDepartmentRepository(departmentRepository);
        doctorController.setPasswordEncoder(passwordEncoder);
        doctorController.setAuditLogService(auditLogService);
    }

    @Test
    @DisplayName("DoctorController.getAllDoctors permits NURSE authority in @PreAuthorize")
    void testDoctorController_GetAllDoctors_PermitsNurse() throws NoSuchMethodException {
        Method method = DoctorController.class.getMethod("getAllDoctors");
        PreAuthorize preAuth = method.getAnnotation(PreAuthorize.class);
        assertNotNull(preAuth, "@PreAuthorize annotation must be present on getAllDoctors");
        assertTrue(preAuth.value().contains("'NURSE'"), "@PreAuthorize must explicitly authorize 'NURSE'");
        assertTrue(preAuth.value().contains("'ROLE_NURSE'"), "@PreAuthorize must explicitly authorize 'ROLE_NURSE'");
    }

    @Test
    @DisplayName("DoctorController.getDoctorById permits NURSE authority in @PreAuthorize")
    void testDoctorController_GetDoctorById_PermitsNurse() throws NoSuchMethodException {
        Method method = DoctorController.class.getMethod("getDoctorById", Long.class);
        PreAuthorize preAuth = method.getAnnotation(PreAuthorize.class);
        assertNotNull(preAuth, "@PreAuthorize annotation must be present on getDoctorById");
        assertTrue(preAuth.value().contains("'NURSE'"), "@PreAuthorize must explicitly authorize 'NURSE'");
        assertTrue(preAuth.value().contains("'ROLE_NURSE'"), "@PreAuthorize must explicitly authorize 'ROLE_NURSE'");
    }

    @Test
    @DisplayName("AdmissionController.admitPatient permits NURSE authority in @PreAuthorize")
    void testAdmissionController_AdmitPatient_PermitsNurse() throws NoSuchMethodException {
        Method method = AdmissionController.class.getMethod("admitPatient", Admission.class);
        PreAuthorize preAuth = method.getAnnotation(PreAuthorize.class);
        assertNotNull(preAuth, "@PreAuthorize annotation must be present on admitPatient");
        assertTrue(preAuth.value().contains("'NURSE'"), "@PreAuthorize must explicitly authorize 'NURSE'");
        assertTrue(preAuth.value().contains("'ROLE_NURSE'"), "@PreAuthorize must explicitly authorize 'ROLE_NURSE'");
    }

    @Test
    @DisplayName("Nurse successfully fetches doctors list for Inpatient Admission modal")
    void testNurse_FetchDoctorsList_Success() {
        Doctor doc = new Doctor();
        doc.setId(1L);
        doc.setFirstName("Sunil");
        doc.setLastName("Perera");
        when(doctorService.getAllDoctors()).thenReturn(Collections.singletonList(doc));

        List<Doctor> result = doctorController.getAllDoctors();
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Sunil", result.get(0).getFirstName());
    }

    @Test
    @DisplayName("Nurse successfully admits a patient via AdmissionController")
    void testNurse_AdmitPatient_Success() {
        Admission admission = new Admission();
        Patient patient = new Patient();
        patient.setId(10L);
        Doctor doctor = new Doctor();
        doctor.setId(20L);
        Bed bed = new Bed();
        bed.setId(30L);

        admission.setPatient(patient);
        admission.setDoctor(doctor);
        admission.setBed(bed);
        admission.setAdmissionReason("Post-operative recovery");

        Admission saved = new Admission();
        saved.setId(100L);
        saved.setPatient(patient);
        saved.setDoctor(doctor);
        saved.setBed(bed);
        saved.setStatus(AdmissionStatus.ADMITTED);

        when(admissionService.admitPatient(admission)).thenReturn(saved);

        ResponseEntity<?> response = admissionController.admitPatient(admission);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        Admission body = (Admission) response.getBody();
        assertNotNull(body);
        assertEquals(100L, body.getId());
        assertEquals(AdmissionStatus.ADMITTED, body.getStatus());
    }
}
