package com.hospital.hms;

import com.hospital.hms.controller.PatientController;
import com.hospital.hms.entity.*;
import com.hospital.hms.repository.*;
import com.hospital.hms.service.AuditLogService;
import com.hospital.hms.service.PatientDocumentService;
import com.hospital.hms.service.PatientService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.time.LocalDate;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class PatientRegistrationSafetyTest {

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AdmissionRepository admissionRepository;

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private LabTestRepository labTestRepository;

    @Mock
    private MedicalRecordRepository medicalRecordRepository;

    @Mock
    private PatientDocumentService patientDocumentService;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private PatientService patientService;

    private PatientController patientController;

    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);

        patientController = new PatientController();
        patientController.setPatientService(patientService);
        patientController.setAuditLogService(auditLogService);

        when(authentication.getName()).thenReturn("admin");
    }

    @Test
    public void testRegisterPatient_Success_WithUniqueNic() {
        Patient newPatient = new Patient();
        newPatient.setFirstName("Kushan");
        newPatient.setLastName("Sasanga");
        newPatient.setNic("200314612999");

        when(patientRepository.existsByNic("200314612999")).thenReturn(false);
        when(patientRepository.save(any(Patient.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Patient registered = patientService.registerPatient(newPatient);

        assertNotNull(registered);
        assertEquals("200314612999", registered.getNic());
        verify(patientRepository, times(1)).save(newPatient);
    }

    @Test
    public void testRegisterPatient_DuplicateNic_ThrowsException() {
        Patient duplicatePatient = new Patient();
        duplicatePatient.setFirstName("Kushan");
        duplicatePatient.setLastName("Sasanga");
        duplicatePatient.setNic("200314612000");

        when(patientRepository.existsByNic("200314612000")).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            patientService.registerPatient(duplicatePatient);
        });

        assertTrue(ex.getMessage().contains("already registered"));
        verify(patientRepository, never()).save(any());
    }

    @Test
    public void testRegisterPatient_BlankNic_BecomesNull() {
        Patient patient = new Patient();
        patient.setFirstName("John");
        patient.setLastName("Doe");
        patient.setNic("   ");

        when(patientRepository.save(any(Patient.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Patient registered = patientService.registerPatient(patient);

        assertNull(registered.getNic());
        verify(patientRepository, times(1)).save(patient);
    }

    @Test
    public void testRegisterPatient_MissingNames_ThrowsException() {
        Patient patient = new Patient();
        patient.setFirstName("");
        patient.setLastName("Doe");

        assertThrows(IllegalArgumentException.class, () -> patientService.registerPatient(patient));
    }

    @Test
    public void testPatientController_HandlesDuplicateNicGracefully() {
        Patient duplicatePatient = new Patient();
        duplicatePatient.setFirstName("Kushan");
        duplicatePatient.setLastName("Sasanga");
        duplicatePatient.setNic("200314612000");

        when(patientRepository.existsByNic("200314612000")).thenReturn(true);

        ResponseEntity<?> response = patientController.registerPatient(duplicatePatient, authentication);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertTrue(response.getBody().toString().contains("already registered"));
        verify(auditLogService, times(1)).log(eq("admin"), eq("PATIENT_REGISTER"), eq("FAILED"), anyString());
    }

    @Test
    public void testRegisterPatient_WithAgeOnly_DerivesDobAndSaves() {
        Patient patient = new Patient();
        patient.setFirstName("Baby");
        patient.setLastName("Perera");
        patient.setAge(5);

        when(patientRepository.save(any(Patient.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Patient saved = patientService.registerPatient(patient);

        assertNotNull(saved);
        assertEquals(5, saved.getAge());
        assertNotNull(saved.getDateOfBirth());
        assertNull(saved.getNic());
        verify(patientRepository, times(1)).save(patient);
    }

    @Test
    public void testRegisterPatient_WithDob_ComputesAge() {
        Patient patient = new Patient();
        patient.setFirstName("Sunil");
        patient.setLastName("Silva");
        patient.setDateOfBirth(LocalDate.now().minusYears(28));

        when(patientRepository.save(any(Patient.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Patient saved = patientService.registerPatient(patient);

        assertNotNull(saved);
        assertEquals(28, saved.getAge());
        verify(patientRepository, times(1)).save(patient);
    }

    @Test
    public void testRegisterPatient_FutureDob_ThrowsException() {
        Patient patient = new Patient();
        patient.setFirstName("Future");
        patient.setLastName("Child");
        patient.setDateOfBirth(LocalDate.now().plusDays(2));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            patientService.registerPatient(patient);
        });

        assertTrue(ex.getMessage().contains("future"));
        verify(patientRepository, never()).save(any());
    }

    @Test
    public void testRegisterPatient_InvalidAge_ThrowsException() {
        Patient patient = new Patient();
        patient.setFirstName("Invalid");
        patient.setLastName("Age");
        patient.setAge(-3);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            patientService.registerPatient(patient);
        });

        assertTrue(ex.getMessage().contains("between 0 and 130"));
        verify(patientRepository, never()).save(any());
    }

    @Test
    public void testRegisterPatient_MultiplePatients_WithoutNic_Allowed() {
        Patient child1 = new Patient();
        child1.setFirstName("ChildOne");
        child1.setLastName("Fernando");
        child1.setAge(4);
        child1.setNic(null);

        Patient child2 = new Patient();
        child2.setFirstName("ChildTwo");
        child2.setLastName("Fernando");
        child2.setAge(7);
        child2.setNic(""); // empty string should be converted to null

        when(patientRepository.save(any(Patient.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Patient saved1 = patientService.registerPatient(child1);
        Patient saved2 = patientService.registerPatient(child2);

        assertNull(saved1.getNic());
        assertNull(saved2.getNic());
        assertEquals(4, saved1.getAge());
        assertEquals(7, saved2.getAge());
        verify(patientRepository, times(2)).save(any(Patient.class));
    }

    @Test
    public void testDeletePatient_Success_DeletesPatientAndDependencies() {
        Patient patient = new Patient();
        patient.setId(50L);
        patient.setFirstName("Kasun");
        patient.setLastName("Perera");

        User patientUser = new User();
        patientUser.setId(105L);
        patientUser.setUsername("kasun@portal.lk");
        patientUser.setRole(Role.PATIENT);
        patient.setUser(patientUser);

        when(patientRepository.findById(50L)).thenReturn(Optional.of(patient));
        when(admissionRepository.existsByPatientIdAndStatus(50L, AdmissionStatus.ADMITTED)).thenReturn(false);
        when(invoiceRepository.findFirstByPatientIdAndStatusOrderByIdDesc(50L, "UNPAID")).thenReturn(Optional.empty());
        when(invoiceRepository.findByPatientIdOrderByDateDesc(50L)).thenReturn(Collections.emptyList());
        when(appointmentRepository.findByPatientId(50L)).thenReturn(Collections.emptyList());
        when(admissionRepository.findByPatientIdOrderByAdmissionDateDesc(50L)).thenReturn(Collections.emptyList());
        when(labTestRepository.findByPatientIdOrderByRequestedAtDesc(50L)).thenReturn(Collections.emptyList());
        when(medicalRecordRepository.findByPatientIdOrderByRecordDateDesc(50L)).thenReturn(Collections.emptyList());
        when(patientDocumentService.getDocumentsByPatientId(50L)).thenReturn(Collections.emptyList());

        ResponseEntity<?> response = patientController.deletePatient(50L, authentication);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().toString().contains("deleted successfully"));
        verify(userRepository, times(1)).delete(patientUser);
        verify(patientRepository, times(1)).delete(patient);
        verify(auditLogService, times(1)).log(eq("admin"), eq("PATIENT_DELETE"), eq("SUCCESS"), anyString());
    }

    @Test
    public void testDeletePatient_FailsWhenPatientActivelyAdmitted() {
        Patient patient = new Patient();
        patient.setId(50L);

        when(patientRepository.findById(50L)).thenReturn(Optional.of(patient));
        when(admissionRepository.existsByPatientIdAndStatus(50L, AdmissionStatus.ADMITTED)).thenReturn(true);

        ResponseEntity<?> response = patientController.deletePatient(50L, authentication);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertTrue(response.getBody().toString().contains("active hospital admission"));
        verify(patientRepository, never()).delete(any());
        verify(auditLogService, times(1)).log(eq("admin"), eq("PATIENT_DELETE"), eq("FAILED"), anyString());
    }

    @Test
    public void testDeletePatient_FailsWhenUnpaidInvoicesExist() {
        Patient patient = new Patient();
        patient.setId(50L);

        Invoice unpaidInv = new Invoice();
        unpaidInv.setStatus("UNPAID");

        when(patientRepository.findById(50L)).thenReturn(Optional.of(patient));
        when(admissionRepository.existsByPatientIdAndStatus(50L, AdmissionStatus.ADMITTED)).thenReturn(false);
        when(invoiceRepository.findFirstByPatientIdAndStatusOrderByIdDesc(50L, "UNPAID")).thenReturn(Optional.of(unpaidInv));

        ResponseEntity<?> response = patientController.deletePatient(50L, authentication);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertTrue(response.getBody().toString().contains("unpaid invoices"));
        verify(patientRepository, never()).delete(any());
        verify(auditLogService, times(1)).log(eq("admin"), eq("PATIENT_DELETE"), eq("FAILED"), anyString());
    }

    @Test
    public void testDeletePatient_NotFound_Returns404() {
        when(patientRepository.findById(999L)).thenReturn(Optional.empty());

        ResponseEntity<?> response = patientController.deletePatient(999L, authentication);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        verify(patientRepository, never()).delete(any());
    }
}
