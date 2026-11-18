package com.hospital.hms;

import com.hospital.hms.controller.PatientController;
import com.hospital.hms.entity.Patient;
import com.hospital.hms.repository.PatientRepository;
import com.hospital.hms.repository.UserRepository;
import com.hospital.hms.service.AuditLogService;
import com.hospital.hms.service.PatientService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class PatientRegistrationSafetyTest {

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private UserRepository userRepository;

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
}
