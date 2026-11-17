package com.hospital.hms;

import com.hospital.hms.entity.*;
import com.hospital.hms.repository.AppointmentRepository;
import com.hospital.hms.repository.InvoiceItemRepository;
import com.hospital.hms.repository.InvoiceRepository;
import com.hospital.hms.service.AppointmentService;
import com.hospital.hms.service.InvoiceService;
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
public class AppointmentConsultationBillingTest {

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private InvoiceService invoiceService;

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private InvoiceItemRepository invoiceItemRepository;

    @InjectMocks
    private AppointmentService appointmentService;

    private Appointment appointment;
    private Patient patient;
    private Doctor doctor;

    @BeforeEach
    void setUp() {
        patient = new Patient();
        patient.setId(1L);
        patient.setFirstName("Sunil");
        patient.setLastName("Silva");

        doctor = new Doctor();
        doctor.setId(5L);
        doctor.setFirstName("Kasun");
        doctor.setLastName("Perera");
        doctor.setConsultationFee(2500.0);

        appointment = new Appointment();
        appointment.setId(100L);
        appointment.setPatient(patient);
        appointment.setDoctor(doctor);
        appointment.setStatus(AppointmentStatus.CHECKED_IN);
        appointment.setIsBilled(false);
        appointment.setAppointmentDateTime(LocalDateTime.now().plusDays(1));
    }

    @Test
    @DisplayName("Task 2.2: Normal completion updates status to COMPLETED and generates consultation fee once")
    void testNormalCompletionGeneratesConsultationFeeOnce() {
        when(appointmentRepository.findById(100L)).thenReturn(Optional.of(appointment));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Appointment result = appointmentService.completeAppointment(100L);

        assertNotNull(result);
        assertEquals(AppointmentStatus.COMPLETED, result.getStatus());
        assertTrue(result.getIsBilled(), "Appointment must be marked as billed.");

        // Verify consultation fee was requested exactly once with the appointment reference
        verify(invoiceService, times(1)).addConsultationFee(appointment);
        verify(appointmentRepository, times(1)).save(appointment);
    }

    @Test
    @DisplayName("Task 2.2: Repeated completion on already COMPLETED appointment is rejected with clear error")
    void testRepeatedCompletionRejected() {
        appointment.setStatus(AppointmentStatus.COMPLETED);
        appointment.setIsBilled(true);

        when(appointmentRepository.findById(100L)).thenReturn(Optional.of(appointment));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            appointmentService.completeAppointment(100L);
        });

        assertTrue(ex.getMessage().contains("already been completed"),
                "Error message should state the appointment has already been completed.");

        // Critical: Billing must NOT be triggered again
        verify(invoiceService, never()).addConsultationFee(any(Appointment.class));
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Task 2.2: Completing a CANCELLED appointment is rejected")
    void testCancelledAppointmentCompletionRejected() {
        appointment.setStatus(AppointmentStatus.CANCELLED);

        when(appointmentRepository.findById(100L)).thenReturn(Optional.of(appointment));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            appointmentService.completeAppointment(100L);
        });

        assertTrue(ex.getMessage().contains("Cannot complete cancelled appointment"),
                "Error message should reject completing a cancelled appointment.");

        verify(invoiceService, never()).addConsultationFee(any(Appointment.class));
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Task 2.2: Billing failure propagates out to trigger database rollback")
    void testBillingFailureRollback() {
        when(appointmentRepository.findById(100L)).thenReturn(Optional.of(appointment));

        // Simulate billing transaction failure (e.g. database constraint error)
        doThrow(new RuntimeException("Simulated database failure during invoice generation"))
                .when(invoiceService).addConsultationFee(appointment);

        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            appointmentService.completeAppointment(100L);
        });

        assertEquals("Simulated database failure during invoice generation", ex.getMessage());

        // The appointment entity must NOT be persisted in completed state if billing fails
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Task 2.2: Idempotency check prevents duplicate InvoiceItem even if addConsultationFee is called directly")
    void testInvoiceServiceIdempotency() {
        // Create an InvoiceService with mocks to verify idempotency logic
        InvoiceService testInvoiceService = new InvoiceService();

        // Use reflection or package access to inject dependencies
        org.springframework.test.util.ReflectionTestUtils.setField(testInvoiceService, "invoiceRepository", invoiceRepository);
        org.springframework.test.util.ReflectionTestUtils.setField(testInvoiceService, "invoiceItemRepository", invoiceItemRepository);

        // Simulate that an invoice item for this APPOINTMENT reference already exists
        when(invoiceItemRepository.existsByReferenceTypeAndReferenceId("APPOINTMENT", 100L)).thenReturn(true);

        Invoice existingInvoice = new Invoice();
        existingInvoice.setId(999L);
        existingInvoice.setStatus("UNPAID");
        when(invoiceRepository.findFirstByPatientIdAndStatusOrderByIdDesc(1L, "UNPAID"))
                .thenReturn(Optional.of(existingInvoice));

        Invoice returned = testInvoiceService.addConsultationFee(appointment);

        assertNotNull(returned);
        assertEquals(999L, returned.getId());

        // Verify that no new Invoice was created or saved
        verify(invoiceRepository, never()).save(any(Invoice.class));
    }
}
