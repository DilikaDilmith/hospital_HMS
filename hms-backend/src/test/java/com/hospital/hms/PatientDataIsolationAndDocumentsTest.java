package com.hospital.hms;

import com.hospital.hms.controller.PatientDocumentController;
import com.hospital.hms.entity.Patient;
import com.hospital.hms.entity.PatientDocument;
import com.hospital.hms.entity.User;
import com.hospital.hms.entity.Role;
import com.hospital.hms.repository.PatientRepository;
import com.hospital.hms.service.PatientDocumentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PatientDataIsolationAndDocumentsTest {

    @Mock
    private PatientDocumentService patientDocumentService;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private PatientDocumentController patientDocumentController;

    private Patient patientA;
    private Patient patientB;
    private PatientDocument docA;
    private PatientDocument docB;

    @BeforeEach
    void setUp() {
        patientDocumentController.setPatientRepository(patientRepository);

        User userA = new User();
        userA.setId(10L);
        userA.setUsername("patient_a");
        userA.setRole(Role.PATIENT);

        patientA = new Patient();
        patientA.setId(1L);
        patientA.setUser(userA);
        patientA.setFirstName("Alice");
        patientA.setLastName("Perera");

        User userB = new User();
        userB.setId(20L);
        userB.setUsername("patient_b");
        userB.setRole(Role.PATIENT);

        patientB = new Patient();
        patientB.setId(2L);
        patientB.setUser(userB);
        patientB.setFirstName("Bob");
        patientB.setLastName("Silva");

        docA = new PatientDocument();
        docA.setId(101L);
        docA.setPatient(patientA);
        docA.setOriginalFileName("alice_report.pdf");
        docA.setStoredFileName("uuid-alice_report.pdf");
        docA.setFileType("application/pdf");
        docA.setFileSize(2048L);

        docB = new PatientDocument();
        docB.setId(202L);
        docB.setPatient(patientB);
        docB.setOriginalFileName("bob_scan.png");
        docB.setStoredFileName("uuid-bob_scan.png");
        docB.setFileType("image/png");
        docB.setFileSize(4096L);
    }

    @Test
    @DisplayName("Patient can retrieve only their own documents via /api/documents/my")
    void testGetMyDocuments_ReturnsOnlyCallerDocuments() {
        when(authentication.getName()).thenReturn("patient_a");
        when(patientDocumentService.getDocumentsByPatientUsername("patient_a"))
                .thenReturn(List.of(docA));

        List<PatientDocument> result = patientDocumentController.getMyDocuments(authentication);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("alice_report.pdf", result.get(0).getOriginalFileName());
        assertEquals(1L, result.get(0).getPatient().getId());
    }

    @Test
    @DisplayName("Patient viewing own document inline is allowed (200 OK)")
    void testViewDocument_PatientViewingOwnDocument_Success() throws Exception {
        when(authentication.getName()).thenReturn("patient_a");
        doReturn(Collections.singletonList(new SimpleGrantedAuthority("PATIENT")))
                .when(authentication).getAuthorities();

        when(patientDocumentService.getDocumentById(101L)).thenReturn(Optional.of(docA));
        Resource dummyResource = new ByteArrayResource("PDF-DATA".getBytes());
        when(patientDocumentService.loadFileAsResource(101L)).thenReturn(dummyResource);

        ResponseEntity<?> response = patientDocumentController.viewDocument(101L, authentication);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
    }

    @Test
    @DisplayName("Patient viewing another patient document is blocked with 403 Forbidden")
    void testViewDocument_PatientViewingOtherPatientDocument_Forbidden() throws Exception {
        when(authentication.getName()).thenReturn("patient_a"); // Caller is Alice
        doReturn(Collections.singletonList(new SimpleGrantedAuthority("ROLE_PATIENT")))
                .when(authentication).getAuthorities();

        when(patientDocumentService.getDocumentById(202L)).thenReturn(Optional.of(docB)); // Belongs to Bob

        ResponseEntity<?> response = patientDocumentController.viewDocument(202L, authentication);

        assertNotNull(response);
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        verify(patientDocumentService, never()).loadFileAsResource(anyLong());
    }

    @Test
    @DisplayName("Patient downloading another patient document is blocked with 403 Forbidden")
    void testDownloadDocument_PatientDownloadingOtherPatientDocument_Forbidden() throws Exception {
        when(authentication.getName()).thenReturn("patient_a"); // Caller is Alice
        doReturn(Collections.singletonList(new SimpleGrantedAuthority("PATIENT")))
                .when(authentication).getAuthorities();

        when(patientDocumentService.getDocumentById(202L)).thenReturn(Optional.of(docB)); // Belongs to Bob

        ResponseEntity<?> response = patientDocumentController.downloadDocument(202L, authentication);

        assertNotNull(response);
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        verify(patientDocumentService, never()).loadFileAsResource(anyLong());
    }

    @Test
    @DisplayName("Hospital Staff (Doctor) can view patient documents without restriction (200 OK)")
    void testViewDocument_DoctorViewingPatientDocument_Success() throws Exception {
        doReturn(Collections.singletonList(new SimpleGrantedAuthority("ROLE_DOCTOR")))
                .when(authentication).getAuthorities();

        when(patientDocumentService.getDocumentById(101L)).thenReturn(Optional.of(docA));
        Resource dummyResource = new ByteArrayResource("PDF-DATA".getBytes());
        when(patientDocumentService.loadFileAsResource(101L)).thenReturn(dummyResource);

        ResponseEntity<?> response = patientDocumentController.viewDocument(101L, authentication);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    @DisplayName("Patient listing documents of another patient via ID endpoint is blocked with 403 Forbidden")
    void testGetDocumentsByPatientId_PatientAccessingOtherPatientList_Forbidden() {
        when(authentication.getName()).thenReturn("patient_a"); // Caller is Alice
        doReturn(Collections.singletonList(new SimpleGrantedAuthority("PATIENT")))
                .when(authentication).getAuthorities();

        when(patientRepository.findById(2L)).thenReturn(Optional.of(patientB));

        ResponseEntity<?> response = patientDocumentController.getPatientDocuments(2L, authentication);

        assertNotNull(response);
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
    }
}
