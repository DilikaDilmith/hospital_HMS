package com.hospital.hms;

import com.hospital.hms.controller.PatientDocumentController;
import com.hospital.hms.entity.Patient;
import com.hospital.hms.entity.PatientDocument;
import com.hospital.hms.entity.Role;
import com.hospital.hms.entity.User;
import com.hospital.hms.repository.PatientDocumentRepository;
import com.hospital.hms.repository.PatientRepository;
import com.hospital.hms.service.PatientDocumentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PatientDocumentSafetyTest {

    @TempDir
    Path tempUploadDir;

    @Mock
    private PatientDocumentRepository patientDocumentRepository;

    @Mock
    private PatientRepository patientRepository;

    @InjectMocks
    private PatientDocumentService patientDocumentService;

    @InjectMocks
    private PatientDocumentController patientDocumentController;

    private Patient patient1;
    private Patient patient2;
    private User patientUser1;
    private User patientUser2;

    @BeforeEach
    void setUp() {
        patientDocumentService.setUploadPath(tempUploadDir);
        patientDocumentController.setPatientDocumentService(patientDocumentService);
        patientDocumentController.setPatientRepository(patientRepository);

        patientUser1 = new User();
        patientUser1.setId(1L);
        patientUser1.setUsername("alice_patient");
        patientUser1.setRole(Role.PATIENT);

        patient1 = new Patient();
        patient1.setId(10L);
        patient1.setFirstName("Alice");
        patient1.setLastName("Smith");
        patient1.setUser(patientUser1);

        patientUser2 = new User();
        patientUser2.setId(2L);
        patientUser2.setUsername("bob_patient");
        patientUser2.setRole(Role.PATIENT);

        patient2 = new Patient();
        patient2.setId(20L);
        patient2.setFirstName("Bob");
        patient2.setLastName("Jones");
        patient2.setUser(patientUser2);
    }

    @Test
    @DisplayName("Task 3.3: Authorized staff can successfully upload a valid PDF document")
    void testUploadValidPdfDocumentSuccess() throws IOException {
        byte[] pdfContent = "%PDF-1.4 sample content".getBytes();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "lab-report.pdf",
                "application/pdf",
                pdfContent
        );

        when(patientRepository.findById(10L)).thenReturn(Optional.of(patient1));
        when(patientDocumentRepository.save(any(PatientDocument.class))).thenAnswer(inv -> {
            PatientDocument doc = inv.getArgument(0);
            doc.setId(101L);
            return doc;
        });

        PatientDocument saved = patientDocumentService.uploadDocument(10L, file, "Blood Count Test", "receptionist_kamal");

        assertNotNull(saved);
        assertEquals("lab-report.pdf", saved.getOriginalFileName());
        assertEquals("application/pdf", saved.getFileType());
        assertEquals(pdfContent.length, saved.getFileSize());
        assertEquals("Blood Count Test", saved.getDescription());
        assertEquals("receptionist_kamal", saved.getUploadedBy());
        assertNotNull(saved.getStoredFileName());
        assertTrue(saved.getStoredFileName().endsWith(".pdf"));

        // Verify physical file was written into upload directory
        Path storedFile = tempUploadDir.resolve(saved.getStoredFileName());
        assertTrue(Files.exists(storedFile), "Physical file must exist in upload directory");
        assertEquals(pdfContent.length, Files.size(storedFile));

        verify(patientDocumentRepository, times(1)).save(any(PatientDocument.class));
    }

    @Test
    @DisplayName("Task 3.3: Reject upload when file size exceeds the 5 MB limit")
    void testUploadExceeding5MbRejected() {
        // Create 5.5 MB mock file
        byte[] largeBytes = new byte[5 * 1024 * 1024 + 500 * 1024];
        MockMultipartFile largeFile = new MockMultipartFile(
                "file",
                "scan-huge.jpg",
                "image/jpeg",
                largeBytes
        );

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            patientDocumentService.uploadDocument(10L, largeFile, "MRI Scan", "admin");
        });

        assertTrue(ex.getMessage().contains("maximum limit of 5 MB"));
        verify(patientDocumentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Task 3.3: Reject upload when file format is not PDF, JPG or PNG")
    void testUploadInvalidFileTypeRejected() {
        MockMultipartFile exeFile = new MockMultipartFile(
                "file",
                "malicious_script.exe",
                "application/x-msdownload",
                "malicious bytecode".getBytes()
        );

        IllegalArgumentException ex1 = assertThrows(IllegalArgumentException.class, () -> {
            patientDocumentService.uploadDocument(10L, exeFile, "Executable", "admin");
        });
        assertTrue(ex1.getMessage().contains("Only PDF, JPG, and PNG"));

        MockMultipartFile textFile = new MockMultipartFile(
                "file",
                "notes.txt",
                "text/plain",
                "some notes".getBytes()
        );

        IllegalArgumentException ex2 = assertThrows(IllegalArgumentException.class, () -> {
            patientDocumentService.uploadDocument(10L, textFile, "Text", "admin");
        });
        assertTrue(ex2.getMessage().contains("Only PDF, JPG, and PNG"));

        verify(patientDocumentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Task 3.3: Reject upload when file is empty")
    void testUploadEmptyFileRejected() {
        MockMultipartFile emptyFile = new MockMultipartFile(
                "file",
                "empty.png",
                "image/png",
                new byte[0]
        );

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            patientDocumentService.uploadDocument(10L, emptyFile, "Empty Image", "admin");
        });

        assertTrue(ex.getMessage().contains("Please select a file to upload"));
        verify(patientDocumentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Task 3.3: Delete document removes both disk file and database record")
    void testDeleteDocumentRemovesFileAndRecord() throws IOException {
        String filename = "sample-to-delete.pdf";
        Path diskFile = tempUploadDir.resolve("unique_stored_file.pdf");
        Files.write(diskFile, "Sample content".getBytes());
        assertTrue(Files.exists(diskFile));

        PatientDocument doc = new PatientDocument();
        doc.setId(505L);
        doc.setPatient(patient1);
        doc.setOriginalFileName(filename);
        doc.setStoredFileName("unique_stored_file.pdf");
        doc.setFileType("application/pdf");
        doc.setFileSize(14L);

        when(patientDocumentRepository.findById(505L)).thenReturn(Optional.of(doc));

        patientDocumentService.deleteDocument(505L);

        // Verify physical file was removed from disk
        assertFalse(Files.exists(diskFile), "Physical file must be deleted from disk");
        verify(patientDocumentRepository, times(1)).delete(doc);
    }

    @Test
    @DisplayName("Task 3.3: Patient cannot access another patient's document list (HTTP 403 Forbidden)")
    void testPatientCannotAccessAnotherPatientDocuments() {
        when(patientRepository.findById(20L)).thenReturn(Optional.of(patient2)); // Bob's profile

        // Alice is logged in as a PATIENT
        Authentication aliceAuth = mock(Authentication.class);
        when(aliceAuth.getName()).thenReturn("alice_patient");
        doReturn(Collections.singletonList(new SimpleGrantedAuthority("PATIENT")))
                .when(aliceAuth).getAuthorities();

        // Alice tries to get Bob's documents (/api/patients/20/documents)
        ResponseEntity<?> response = patientDocumentController.getPatientDocuments(20L, aliceAuth);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertTrue(response.getBody().toString().contains("Access denied"));
        verify(patientDocumentRepository, never()).findByPatientIdOrderByUploadedAtDesc(20L);
    }

    @Test
    @DisplayName("Task 3.3: Patient can view their own document list (HTTP 200 OK)")
    void testPatientCanAccessOwnDocumentList() {
        when(patientRepository.findById(10L)).thenReturn(Optional.of(patient1)); // Alice's profile

        PatientDocument doc = new PatientDocument();
        doc.setId(1L);
        doc.setPatient(patient1);
        doc.setOriginalFileName("alice-report.pdf");

        when(patientDocumentRepository.findByPatientIdOrderByUploadedAtDesc(10L))
                .thenReturn(Collections.singletonList(doc));

        // Alice is logged in
        Authentication aliceAuth = mock(Authentication.class);
        when(aliceAuth.getName()).thenReturn("alice_patient");
        doReturn(Collections.singletonList(new SimpleGrantedAuthority("PATIENT")))
                .when(aliceAuth).getAuthorities();

        ResponseEntity<?> response = patientDocumentController.getPatientDocuments(10L, aliceAuth);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        List<?> docs = (List<?>) response.getBody();
        assertEquals(1, docs.size());
    }

    @Test
    @DisplayName("Task 3.3: Patient cannot download another patient's document (HTTP 403 Forbidden)")
    void testPatientCannotDownloadAnotherPatientDocument() {
        PatientDocument bobsDoc = new PatientDocument();
        bobsDoc.setId(99L);
        bobsDoc.setPatient(patient2); // Belongs to Bob
        bobsDoc.setOriginalFileName("bob-private-scan.png");
        bobsDoc.setStoredFileName("stored_bob.png");
        bobsDoc.setFileType("image/png");

        when(patientDocumentRepository.findById(99L)).thenReturn(Optional.of(bobsDoc));

        // Alice is logged in
        Authentication aliceAuth = mock(Authentication.class);
        when(aliceAuth.getName()).thenReturn("alice_patient");
        doReturn(Collections.singletonList(new SimpleGrantedAuthority("PATIENT")))
                .when(aliceAuth).getAuthorities();

        ResponseEntity<?> response = patientDocumentController.downloadDocument(99L, aliceAuth);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertTrue(response.getBody().toString().contains("Access denied"));
    }
}
