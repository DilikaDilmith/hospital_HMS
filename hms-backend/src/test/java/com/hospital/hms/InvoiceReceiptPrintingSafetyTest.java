package com.hospital.hms;

import com.hospital.hms.controller.InvoiceController;
import com.hospital.hms.controller.LabTestController;
import com.hospital.hms.entity.*;
import com.hospital.hms.repository.InvoiceRepository;
import com.hospital.hms.repository.LabTestRepository;
import com.hospital.hms.service.InvoiceService;
import com.hospital.hms.service.LabTestService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class InvoiceReceiptPrintingSafetyTest {

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private LabTestRepository labTestRepository;

    @Mock
    private InvoiceService mockInvoiceService;

    @Mock
    private LabTestService mockLabTestService;

    @InjectMocks
    private InvoiceService invoiceService;

    @InjectMocks
    private InvoiceController invoiceController;

    @InjectMocks
    private LabTestController labTestController;

    private Patient patient1;
    private Patient patient2;
    private User patientUser1;
    private User patientUser2;
    private Invoice sampleInvoice;
    private LabTest sampleLabTest;
    private Doctor sampleDoctor;

    @BeforeEach
    void setUp() {
        patientUser1 = new User();
        patientUser1.setId(10L);
        patientUser1.setUsername("kamal_patient");
        patientUser1.setRole(Role.PATIENT);

        patient1 = new Patient();
        patient1.setId(100L);
        patient1.setFirstName("Kamal");
        patient1.setLastName("Silva");
        patient1.setNic("199012345678");
        patient1.setPhoneNumber("0771234567");
        patient1.setUser(patientUser1);

        patientUser2 = new User();
        patientUser2.setId(20L);
        patientUser2.setUsername("nimal_patient");
        patientUser2.setRole(Role.PATIENT);

        patient2 = new Patient();
        patient2.setId(200L);
        patient2.setFirstName("Nimal");
        patient2.setLastName("Perera");
        patient2.setNic("198598765432");
        patient2.setUser(patientUser2);

        sampleDoctor = new Doctor();
        sampleDoctor.setId(5L);
        sampleDoctor.setFirstName("Sunil");
        sampleDoctor.setLastName("Fernando");
        sampleDoctor.setSpecialization("Pathologist");

        sampleInvoice = new Invoice();
        sampleInvoice.setId(101L);
        sampleInvoice.setPatient(patient1);
        sampleInvoice.setDate(LocalDateTime.now().minusDays(1));
        sampleInvoice.setStatus("UNPAID");

        InvoiceItem item1 = new InvoiceItem();
        item1.setId(1L);
        item1.setCategory("CONSULTATION");
        item1.setDescription("Doctor Consultation Fee");
        item1.setAmount(1500.0);
        sampleInvoice.addItem(item1);

        InvoiceItem item2 = new InvoiceItem();
        item2.setId(2L);
        item2.setCategory("LAB");
        item2.setDescription("Full Blood Count Test");
        item2.setAmount(2500.0);
        sampleInvoice.addItem(item2);

        sampleLabTest = new LabTest();
        sampleLabTest.setId(301L);
        sampleLabTest.setTestName("Full Blood Count");
        sampleLabTest.setPatient(patient1);
        sampleLabTest.setDoctor(sampleDoctor);
        sampleLabTest.setStatus(LabTestStatus.COMPLETED);
        sampleLabTest.setResult("Hemoglobin: 14.5 g/dL (Normal: 13.5-17.5), WBC: 6,800 /uL (Normal: 4,000-11,000)");
        sampleLabTest.setTestFee(2500.0);
        sampleLabTest.setRequestedAt(LocalDateTime.now().minusDays(2));
        sampleLabTest.setSampleCollectedAt(LocalDateTime.now().minusDays(1));
        sampleLabTest.setCompletedAt(LocalDateTime.now());
    }

    @Test
    @DisplayName("Task 3.4: Invoice printing data integrity contains patient, items, and total amount")
    void testInvoicePrintingDataIntegrity() {
        assertNotNull(sampleInvoice.getId());
        assertEquals("Kamal", sampleInvoice.getPatient().getFirstName());
        assertEquals("199012345678", sampleInvoice.getPatient().getNic());
        assertEquals(2, sampleInvoice.getItems().size());
        assertEquals(4000.0, sampleInvoice.getTotalAmount());
        assertEquals("UNPAID", sampleInvoice.getStatus());
        assertNotNull(sampleInvoice.getDate());
    }

    @Test
    @DisplayName("Task 3.4: Marking invoice as PAID accurately records paidAt timestamp and payment method")
    void testPaymentReceiptDetailsRecordedWhenPaid() {
        when(invoiceRepository.findById(101L)).thenReturn(Optional.of(sampleInvoice));
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(inv -> inv.getArgument(0));

        Invoice paidInvoice = invoiceService.markInvoiceAsPaid(101L, "CASH / COUNTER");

        assertNotNull(paidInvoice);
        assertEquals("PAID", paidInvoice.getStatus());
        assertNotNull(paidInvoice.getPaidAt(), "paidAt timestamp must be recorded for receipt printing");
        assertEquals("CASH / COUNTER", paidInvoice.getPaymentMethod());
        assertEquals(4000.0, paidInvoice.getTotalAmount());

        verify(invoiceRepository, times(1)).save(sampleInvoice);
    }

    @Test
    @DisplayName("Task 3.4: Lab report data integrity includes patient, doctor, test name, dates, and diagnostic results")
    void testLabReportPrintingDataIntegrity() {
        assertEquals("Full Blood Count", sampleLabTest.getTestName());
        assertEquals(LabTestStatus.COMPLETED, sampleLabTest.getStatus());
        assertNotNull(sampleLabTest.getResult());
        assertTrue(sampleLabTest.getResult().contains("Hemoglobin: 14.5 g/dL"));
        assertEquals("Dr. Sunil Fernando", "Dr. " + sampleLabTest.getDoctor().getFirstName() + " " + sampleLabTest.getDoctor().getLastName());
        assertEquals("Kamal Silva", sampleLabTest.getPatient().getFirstName() + " " + sampleLabTest.getPatient().getLastName());
        assertNotNull(sampleLabTest.getRequestedAt());
        assertNotNull(sampleLabTest.getSampleCollectedAt());
        assertNotNull(sampleLabTest.getCompletedAt());
    }

    @Test
    @DisplayName("Task 3.4: Patient cannot access or print another patient's billing invoice (HTTP 403 Forbidden)")
    void testPatientCannotAccessAnotherPatientInvoice() {
        when(mockInvoiceService.getInvoiceById(101L)).thenReturn(Optional.of(sampleInvoice)); // Invoice belongs to Kamal

        // Nimal is logged in as a PATIENT
        Authentication nimalAuth = mock(Authentication.class);
        when(nimalAuth.getName()).thenReturn("nimal_patient");
        doReturn(Collections.singletonList(new SimpleGrantedAuthority("PATIENT")))
                .when(nimalAuth).getAuthorities();

        ResponseEntity<?> response = invoiceController.getInvoiceById(101L, nimalAuth);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertTrue(response.getBody().toString().contains("Access denied"));
    }

    @Test
    @DisplayName("Task 3.4: Patient cannot access or print another patient's lab report (HTTP 403 Forbidden)")
    void testPatientCannotAccessAnotherPatientLabReport() {
        when(mockLabTestService.getTestById(301L)).thenReturn(Optional.of(sampleLabTest)); // Lab test belongs to Kamal

        // Nimal is logged in as a PATIENT
        Authentication nimalAuth = mock(Authentication.class);
        when(nimalAuth.getName()).thenReturn("nimal_patient");
        doReturn(Collections.singletonList(new SimpleGrantedAuthority("PATIENT")))
                .when(nimalAuth).getAuthorities();

        ResponseEntity<?> response = labTestController.getTestById(301L, nimalAuth);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertTrue(response.getBody().toString().contains("Access denied"));
    }

    @Test
    @DisplayName("Task 3.4: Patient can access and print their own billing invoice (HTTP 200 OK)")
    void testPatientCanAccessOwnInvoice() {
        when(mockInvoiceService.getInvoiceById(101L)).thenReturn(Optional.of(sampleInvoice)); // Invoice belongs to Kamal

        // Kamal is logged in as a PATIENT
        Authentication kamalAuth = mock(Authentication.class);
        when(kamalAuth.getName()).thenReturn("kamal_patient");
        doReturn(Collections.singletonList(new SimpleGrantedAuthority("PATIENT")))
                .when(kamalAuth).getAuthorities();

        ResponseEntity<?> response = invoiceController.getInvoiceById(101L, kamalAuth);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        Invoice returned = (Invoice) response.getBody();
        assertNotNull(returned);
        assertEquals(101L, returned.getId());
    }

    @Test
    @DisplayName("Task 3.4: Patient can access and print their own completed lab report (HTTP 200 OK)")
    void testPatientCanAccessOwnLabReport() {
        when(mockLabTestService.getTestById(301L)).thenReturn(Optional.of(sampleLabTest)); // Lab test belongs to Kamal

        // Kamal is logged in as a PATIENT
        Authentication kamalAuth = mock(Authentication.class);
        when(kamalAuth.getName()).thenReturn("kamal_patient");
        doReturn(Collections.singletonList(new SimpleGrantedAuthority("PATIENT")))
                .when(kamalAuth).getAuthorities();

        ResponseEntity<?> response = labTestController.getTestById(301L, kamalAuth);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        LabTest returned = (LabTest) response.getBody();
        assertNotNull(returned);
        assertEquals(301L, returned.getId());
        assertEquals("Full Blood Count", returned.getTestName());
    }
}
