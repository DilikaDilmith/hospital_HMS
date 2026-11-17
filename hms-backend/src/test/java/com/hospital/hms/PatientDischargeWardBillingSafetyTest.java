package com.hospital.hms;

import com.hospital.hms.entity.*;
import com.hospital.hms.repository.AdmissionRepository;
import com.hospital.hms.repository.BedRepository;
import com.hospital.hms.service.AdmissionService;
import com.hospital.hms.service.InvoiceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PatientDischargeWardBillingSafetyTest {

    @Mock
    private AdmissionRepository admissionRepository;

    @Mock
    private BedRepository bedRepository;

    @Mock
    private InvoiceService invoiceService;

    @InjectMocks
    private AdmissionService admissionService;

    private Admission admission;
    private Bed bed;
    private Ward ward;
    private Patient patient;
    private Doctor doctor;

    @BeforeEach
    void setUp() {
        ward = new Ward();
        ward.setId(10L);
        ward.setName("Surgical Ward");
        ward.setDailyRate(3500.0);

        bed = new Bed();
        bed.setId(101L);
        bed.setBedNumber("BED-SW-05");
        bed.setWard(ward);
        bed.setStatus(BedStatus.OCCUPIED);
        bed.setDailyRate(3500.0);

        patient = new Patient();
        patient.setId(201L);
        patient.setFirstName("Sunil");
        patient.setLastName("Silva");

        doctor = new Doctor();
        doctor.setId(301L);
        doctor.setFirstName("Dr. Nimal");
        doctor.setLastName("Perera");

        admission = new Admission();
        admission.setId(401L);
        admission.setPatient(patient);
        admission.setDoctor(doctor);
        admission.setBed(bed);
        admission.setStatus(AdmissionStatus.ADMITTED);
        admission.setAdmissionDate(LocalDateTime.now().minusDays(4));
        admission.setIsBilled(false);
    }

    @Test
    @DisplayName("Task 2.5C: Successful discharge releases bed to AVAILABLE and calculates correct ward charge")
    void testDischargeReleasesBedAndCalculatesCharges() {
        when(admissionRepository.findById(401L)).thenReturn(Optional.of(admission));
        when(bedRepository.findByIdForUpdate(101L)).thenReturn(Optional.of(bed));
        when(admissionRepository.save(any(Admission.class))).thenAnswer(inv -> inv.getArgument(0));

        Admission result = admissionService.dischargePatient(401L, "Discharged after successful appendectomy.");

        assertNotNull(result);
        assertEquals(AdmissionStatus.DISCHARGED, result.getStatus());
        assertEquals(BedStatus.AVAILABLE, bed.getStatus());
        assertTrue(result.getIsBilled());
        assertEquals(4L, result.getTotalDays());
        assertEquals(14000.0, result.getTotalBedCharge()); // 4 days * 3500.0
        assertNotNull(result.getDischargeDate());
        assertEquals("Discharged after successful appendectomy.", result.getDischargeNotes());

        verify(bedRepository, times(1)).save(bed);
        verify(admissionRepository, times(1)).save(admission);
        verify(invoiceService, times(1)).addWardFee(
                eq(patient),
                eq(401L),
                eq("Surgical Ward"),
                eq("BED-SW-05"),
                eq(4L),
                eq(3500.0),
                eq(14000.0)
        );
    }

    @Test
    @DisplayName("Task 2.5C: Same-day observation discharge charges a minimum of 1 day")
    void testSameDayDischargeMinimumOneDayCharge() {
        admission.setAdmissionDate(LocalDateTime.now()); // admitted today
        when(admissionRepository.findById(401L)).thenReturn(Optional.of(admission));
        when(bedRepository.findByIdForUpdate(101L)).thenReturn(Optional.of(bed));
        when(admissionRepository.save(any(Admission.class))).thenAnswer(inv -> inv.getArgument(0));

        Admission result = admissionService.dischargePatient(401L, "Observation complete, stable.");

        assertEquals(1L, result.getTotalDays());
        assertEquals(3500.0, result.getTotalBedCharge());
        verify(invoiceService, times(1)).addWardFee(
                eq(patient),
                eq(401L),
                eq("Surgical Ward"),
                eq("BED-SW-05"),
                eq(1L),
                eq(3500.0),
                eq(3500.0)
        );
    }

    @Test
    @DisplayName("Task 2.5C: Prevent duplicate discharge and throw IllegalStateException")
    void testPreventDuplicateDischarge() {
        admission.setStatus(AdmissionStatus.DISCHARGED);
        admission.setDischargeDate(LocalDateTime.now().minusHours(3));
        when(admissionRepository.findById(401L)).thenReturn(Optional.of(admission));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            admissionService.dischargePatient(401L, "Attempting repeated discharge");
        });

        assertTrue(ex.getMessage().contains("already been discharged"));
        verify(bedRepository, never()).save(any());
        verify(admissionRepository, never()).save(any());
        verify(invoiceService, never()).addWardFee(any(), any(), any(), any(), anyLong(), anyDouble(), anyDouble());
    }

    @Test
    @DisplayName("Task 2.5C: Prevent duplicate ward billing if admission is already marked billed")
    void testPreventDuplicateWardBilling() {
        admission.setIsBilled(true); // already billed
        when(admissionRepository.findById(401L)).thenReturn(Optional.of(admission));
        when(bedRepository.findByIdForUpdate(101L)).thenReturn(Optional.of(bed));
        when(admissionRepository.save(any(Admission.class))).thenAnswer(inv -> inv.getArgument(0));

        admissionService.dischargePatient(401L, "Discharge note");

        // Billing service must NOT be called when isBilled is true
        verify(invoiceService, never()).addWardFee(any(), any(), any(), any(), anyLong(), anyDouble(), anyDouble());
    }

    @Test
    @DisplayName("Task 2.5C: Billing failure propagates exception to trigger transaction rollback")
    void testBillingFailurePropagatesExceptionForRollback() {
        when(admissionRepository.findById(401L)).thenReturn(Optional.of(admission));
        when(bedRepository.findByIdForUpdate(101L)).thenReturn(Optional.of(bed));
        doThrow(new RuntimeException("Payment database unavailable"))
                .when(invoiceService).addWardFee(any(), any(), any(), any(), anyLong(), anyDouble(), anyDouble());

        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            admissionService.dischargePatient(401L, "Discharge note");
        });

        assertEquals("Payment database unavailable", ex.getMessage());
        // Since exception is thrown before admissionRepository.save(), the admission record is not committed
        verify(admissionRepository, never()).save(any());
    }

    @Test
    @DisplayName("Task 2.5C: Concurrent discharge requests - only one succeeds, duplicate is rejected")
    void testConcurrentDischargeOnlyOneSucceeds() throws InterruptedException, ExecutionException {
        final AtomicReference<AdmissionStatus> currentStatus = new AtomicReference<>(AdmissionStatus.ADMITTED);

        when(admissionRepository.findById(401L)).thenAnswer(inv -> {
            Admission a = new Admission();
            a.setId(401L);
            a.setPatient(patient);
            a.setDoctor(doctor);
            a.setBed(bed);
            a.setStatus(currentStatus.get());
            a.setAdmissionDate(LocalDateTime.now().minusDays(2));
            a.setIsBilled(false);
            if (currentStatus.get() == AdmissionStatus.DISCHARGED) {
                a.setDischargeDate(LocalDateTime.now().minusMinutes(5));
            }
            return Optional.of(a);
        });

        lenient().when(bedRepository.findByIdForUpdate(101L)).thenReturn(Optional.of(bed));
        lenient().when(admissionRepository.save(any(Admission.class))).thenAnswer(inv -> {
            Admission a = inv.getArgument(0);
            currentStatus.set(a.getStatus());
            return a;
        });

        int threadCount = 2;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch readyLatch = new CountDownLatch(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);

        List<Future<Boolean>> futures = new ArrayList<>();

        for (int i = 0; i < threadCount; i++) {
            futures.add(executor.submit(() -> {
                readyLatch.countDown();
                startLatch.await();
                try {
                    synchronized (admissionService) { // Simulates DB transaction lock serialization
                        admissionService.dischargePatient(401L, "Routine discharge");
                    }
                    return true;
                } catch (IllegalStateException e) {
                    return false;
                }
            }));
        }

        readyLatch.await();
        startLatch.countDown();

        int successCount = 0;
        int failureCount = 0;

        for (Future<Boolean> f : futures) {
            if (f.get()) {
                successCount++;
            } else {
                failureCount++;
            }
        }

        executor.shutdown();

        assertEquals(1, successCount, "Exactly one concurrent discharge must succeed.");
        assertEquals(1, failureCount, "The duplicate discharge must be rejected.");
        assertEquals(AdmissionStatus.DISCHARGED, currentStatus.get());
        verify(invoiceService, times(1)).addWardFee(any(), any(), any(), any(), anyLong(), anyDouble(), anyDouble());
    }
}
