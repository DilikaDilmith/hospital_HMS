package com.hospital.hms;

import com.hospital.hms.entity.*;
import com.hospital.hms.repository.InvoiceItemRepository;
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

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class LabBillingSafetyTest {

    @Mock
    private LabTestRepository labTestRepository;

    @Mock
    private InvoiceService invoiceService;

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private InvoiceItemRepository invoiceItemRepository;

    @InjectMocks
    private LabTestService labTestService;

    private LabTest labTest;
    private Patient patient;
    private Doctor doctor;

    @BeforeEach
    void setUp() {
        patient = new Patient();
        patient.setId(50L);
        patient.setFirstName("Sunil");
        patient.setLastName("Silva");

        doctor = new Doctor();
        doctor.setId(12L);
        doctor.setFirstName("Kasun");
        doctor.setLastName("Perera");

        labTest = new LabTest();
        labTest.setId(300L);
        labTest.setTestName("Full Blood Count (FBC)");
        labTest.setTestFee(3500.0);
        labTest.setPatient(patient);
        labTest.setDoctor(doctor);
        labTest.setStatus(LabTestStatus.SAMPLE_COLLECTED);
        labTest.setIsBilled(false);
        labTest.setRequestedAt(LocalDateTime.now().minusHours(4));
        labTest.setSampleCollectedAt(LocalDateTime.now().minusHours(2));
    }

    @Test
    @DisplayName("Task 2.5A: Normal lab test completion updates status to COMPLETED and bills fee once")
    void testNormalCompletionGeneratesLabFeeOnce() {
        when(labTestRepository.findById(300L)).thenReturn(Optional.of(labTest));
        when(labTestRepository.save(any(LabTest.class))).thenAnswer(invocation -> invocation.getArgument(0));

        LabTest result = labTestService.completeTest(300L, "WBC: 6.5, Hemoglobin: 14.2 g/dL, Platelets: 250k");

        assertNotNull(result);
        assertEquals(LabTestStatus.COMPLETED, result.getStatus());
        assertEquals("WBC: 6.5, Hemoglobin: 14.2 g/dL, Platelets: 250k", result.getResult());
        assertTrue(result.getIsBilled(), "Lab test must be marked as billed.");
        assertNotNull(result.getCompletedAt());

        // Verify lab fee was billed exactly once
        verify(invoiceService, times(1)).addLabFee(patient, labTest);
        verify(labTestRepository, times(1)).save(labTest);
    }

    @Test
    @DisplayName("Task 2.5A: Repeated completion request on already COMPLETED lab test is rejected")
    void testRepeatedCompletionRejected() {
        labTest.setStatus(LabTestStatus.COMPLETED);
        labTest.setIsBilled(true);

        when(labTestRepository.findById(300L)).thenReturn(Optional.of(labTest));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            labTestService.completeTest(300L, "Duplicate Result Input");
        });

        assertTrue(ex.getMessage().contains("already been completed"),
                "Error message should state the lab test has already been completed.");

        // Critical: Billing must NOT be triggered again
        verify(invoiceService, never()).addLabFee(any(Patient.class), any(LabTest.class));
        verify(labTestRepository, never()).save(any());
    }

    @Test
    @DisplayName("Task 2.5A: Billing failure propagates out to trigger database rollback")
    void testBillingFailureRollback() {
        when(labTestRepository.findById(300L)).thenReturn(Optional.of(labTest));

        // Simulate billing transaction failure
        doThrow(new RuntimeException("Simulated invoice generation failure"))
                .when(invoiceService).addLabFee(patient, labTest);

        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            labTestService.completeTest(300L, "Platelets: 210k");
        });

        assertEquals("Simulated invoice generation failure", ex.getMessage());

        // The lab test entity must NOT be saved as completed if billing fails
        verify(labTestRepository, never()).save(any());
    }

    @Test
    @DisplayName("Task 2.5A: Idempotency check prevents duplicate InvoiceItem even if addLabFee is called directly")
    void testInvoiceServiceIdempotencyLabFee() {
        InvoiceService testInvoiceService = new InvoiceService();

        org.springframework.test.util.ReflectionTestUtils.setField(testInvoiceService, "invoiceRepository", invoiceRepository);
        org.springframework.test.util.ReflectionTestUtils.setField(testInvoiceService, "invoiceItemRepository", invoiceItemRepository);

        // Simulate that an invoice item for this LAB_TEST reference already exists
        when(invoiceItemRepository.existsByReferenceTypeAndReferenceId("LAB_TEST", 300L)).thenReturn(true);

        Invoice existingInvoice = new Invoice();
        existingInvoice.setId(888L);
        existingInvoice.setStatus("UNPAID");
        when(invoiceRepository.findFirstByPatientIdAndStatusOrderByIdDesc(50L, "UNPAID"))
                .thenReturn(Optional.of(existingInvoice));

        Invoice returned = testInvoiceService.addLabFee(patient, labTest);

        assertNotNull(returned);
        assertEquals(888L, returned.getId());

        // Verify that no new Invoice was created or saved
        verify(invoiceRepository, never()).save(any(Invoice.class));
    }

    @Test
    @DisplayName("Task 2.5A: Cannot collect sample on an already COMPLETED lab test")
    void testCannotCollectSampleOnCompletedTest() {
        labTest.setStatus(LabTestStatus.COMPLETED);

        when(labTestRepository.findById(300L)).thenReturn(Optional.of(labTest));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            labTestService.collectSample(300L);
        });

        assertTrue(ex.getMessage().contains("already completed"));
        verify(labTestRepository, never()).save(any());
    }
}
