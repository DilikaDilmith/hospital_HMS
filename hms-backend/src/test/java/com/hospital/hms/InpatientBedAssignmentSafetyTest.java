package com.hospital.hms;

import com.hospital.hms.entity.*;
import com.hospital.hms.repository.AdmissionRepository;
import com.hospital.hms.repository.BedRepository;
import com.hospital.hms.repository.DoctorRepository;
import com.hospital.hms.repository.PatientRepository;
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
public class InpatientBedAssignmentSafetyTest {

    @Mock
    private AdmissionRepository admissionRepository;

    @Mock
    private BedRepository bedRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private DoctorRepository doctorRepository;

    @Mock
    private InvoiceService invoiceService;

    @InjectMocks
    private AdmissionService admissionService;

    private Bed availableBed;
    private Bed occupiedBed;
    private Bed maintenanceBed;
    private Patient patient1;
    private Patient patient2;
    private Doctor doctor;
    private Ward ward;

    @BeforeEach
    void setUp() {
        ward = new Ward();
        ward.setId(1L);
        ward.setName("Medical Ward");
        ward.setDailyRate(3000.0);

        availableBed = new Bed();
        availableBed.setId(101L);
        availableBed.setBedNumber("BED-MW-01");
        availableBed.setWard(ward);
        availableBed.setStatus(BedStatus.AVAILABLE);
        availableBed.setDailyRate(3000.0);

        occupiedBed = new Bed();
        occupiedBed.setId(102L);
        occupiedBed.setBedNumber("BED-MW-02");
        occupiedBed.setWard(ward);
        occupiedBed.setStatus(BedStatus.OCCUPIED);
        occupiedBed.setDailyRate(3000.0);

        maintenanceBed = new Bed();
        maintenanceBed.setId(103L);
        maintenanceBed.setBedNumber("BED-MW-03");
        maintenanceBed.setWard(ward);
        maintenanceBed.setStatus(BedStatus.MAINTENANCE);
        maintenanceBed.setDailyRate(3000.0);

        patient1 = new Patient();
        patient1.setId(201L);
        patient1.setFirstName("Sunil");
        patient1.setLastName("Perera");

        patient2 = new Patient();
        patient2.setId(202L);
        patient2.setFirstName("Kamal");
        patient2.setLastName("Silva");

        doctor = new Doctor();
        doctor.setId(301L);
        doctor.setFirstName("Nihal");
        doctor.setLastName("Gunaratne");
    }

    @Test
    @DisplayName("Task 2.5B: Successfully admit patient when bed is AVAILABLE and mark bed OCCUPIED")
    void testAdmitPatientSuccess() {
        when(bedRepository.findByIdForUpdate(101L)).thenReturn(Optional.of(availableBed));
        when(admissionRepository.existsByBedIdAndStatus(101L, AdmissionStatus.ADMITTED)).thenReturn(false);
        when(admissionRepository.existsByPatientIdAndStatus(201L, AdmissionStatus.ADMITTED)).thenReturn(false);
        when(patientRepository.findById(201L)).thenReturn(Optional.of(patient1));
        when(doctorRepository.findById(301L)).thenReturn(Optional.of(doctor));
        when(admissionRepository.save(any(Admission.class))).thenAnswer(i -> i.getArgument(0));

        Admission admissionReq = new Admission();
        admissionReq.setBed(availableBed);
        admissionReq.setPatient(patient1);
        admissionReq.setDoctor(doctor);
        admissionReq.setAdmissionReason("Acute observation");

        Admission result = admissionService.admitPatient(admissionReq);

        assertNotNull(result);
        assertEquals(AdmissionStatus.ADMITTED, result.getStatus());
        assertEquals(BedStatus.OCCUPIED, availableBed.getStatus());
        assertEquals(patient1, result.getPatient());
        assertEquals(doctor, result.getDoctor());
        assertEquals(availableBed, result.getBed());
        assertFalse(result.getIsBilled());

        verify(bedRepository, times(1)).save(availableBed);
        verify(admissionRepository, times(1)).save(any(Admission.class));
    }

    @Test
    @DisplayName("Task 2.5B: Reject admission when bed is OCCUPIED")
    void testAdmitPatientRejectsWhenBedOccupied() {
        when(bedRepository.findByIdForUpdate(102L)).thenReturn(Optional.of(occupiedBed));

        Admission admissionReq = new Admission();
        admissionReq.setBed(occupiedBed);
        admissionReq.setPatient(patient1);
        admissionReq.setDoctor(doctor);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            admissionService.admitPatient(admissionReq);
        });

        assertTrue(ex.getMessage().contains("currently OCCUPIED and cannot be assigned"));
        verify(bedRepository, never()).save(any());
        verify(admissionRepository, never()).save(any());
    }

    @Test
    @DisplayName("Task 2.5B: Reject admission when bed is in MAINTENANCE")
    void testAdmitPatientRejectsWhenBedInMaintenance() {
        when(bedRepository.findByIdForUpdate(103L)).thenReturn(Optional.of(maintenanceBed));

        Admission admissionReq = new Admission();
        admissionReq.setBed(maintenanceBed);
        admissionReq.setPatient(patient1);
        admissionReq.setDoctor(doctor);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            admissionService.admitPatient(admissionReq);
        });

        assertTrue(ex.getMessage().contains("currently MAINTENANCE and cannot be assigned"));
        verify(bedRepository, never()).save(any());
        verify(admissionRepository, never()).save(any());
    }

    @Test
    @DisplayName("Task 2.5B: Reject admission if bed already has an active admission record")
    void testAdmitPatientRejectsWhenActiveAdmissionExistsOnBed() {
        when(bedRepository.findByIdForUpdate(101L)).thenReturn(Optional.of(availableBed));
        when(admissionRepository.existsByBedIdAndStatus(101L, AdmissionStatus.ADMITTED)).thenReturn(true);

        Admission admissionReq = new Admission();
        admissionReq.setBed(availableBed);
        admissionReq.setPatient(patient1);
        admissionReq.setDoctor(doctor);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            admissionService.admitPatient(admissionReq);
        });

        assertTrue(ex.getMessage().contains("already has an active inpatient admission"));
        verify(bedRepository, never()).save(any());
        verify(admissionRepository, never()).save(any());
    }

    @Test
    @DisplayName("Task 2.5B: Reject admission if patient is already admitted to another bed")
    void testAdmitPatientRejectsWhenPatientAlreadyAdmitted() {
        when(bedRepository.findByIdForUpdate(101L)).thenReturn(Optional.of(availableBed));
        when(admissionRepository.existsByBedIdAndStatus(101L, AdmissionStatus.ADMITTED)).thenReturn(false);
        when(admissionRepository.existsByPatientIdAndStatus(201L, AdmissionStatus.ADMITTED)).thenReturn(true);

        Admission admissionReq = new Admission();
        admissionReq.setBed(availableBed);
        admissionReq.setPatient(patient1);
        admissionReq.setDoctor(doctor);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            admissionService.admitPatient(admissionReq);
        });

        assertTrue(ex.getMessage().contains("already admitted to another bed"));
        verify(bedRepository, never()).save(any());
        verify(admissionRepository, never()).save(any());
    }

    @Test
    @DisplayName("Task 2.5B: Rollback and reject if doctor or patient does not exist")
    void testRollbackWhenDoctorOrPatientNotFound() {
        when(bedRepository.findByIdForUpdate(101L)).thenReturn(Optional.of(availableBed));
        when(admissionRepository.existsByBedIdAndStatus(101L, AdmissionStatus.ADMITTED)).thenReturn(false);
        when(admissionRepository.existsByPatientIdAndStatus(201L, AdmissionStatus.ADMITTED)).thenReturn(false);
        when(patientRepository.findById(201L)).thenReturn(Optional.of(patient1));
        when(doctorRepository.findById(999L)).thenReturn(Optional.empty());

        Doctor invalidDoctor = new Doctor();
        invalidDoctor.setId(999L);

        Admission admissionReq = new Admission();
        admissionReq.setBed(availableBed);
        admissionReq.setPatient(patient1);
        admissionReq.setDoctor(invalidDoctor);

        assertThrows(IllegalArgumentException.class, () -> {
            admissionService.admitPatient(admissionReq);
        });

        assertEquals(BedStatus.AVAILABLE, availableBed.getStatus());
        verify(bedRepository, never()).save(any());
        verify(admissionRepository, never()).save(any());
    }

    @Test
    @DisplayName("Task 2.5B: Discharge patient, release bed to AVAILABLE and auto-bill ward stay")
    void testDischargePatientSuccessAndBedReleased() {
        Admission activeAdmission = new Admission();
        activeAdmission.setId(501L);
        activeAdmission.setBed(occupiedBed);
        activeAdmission.setPatient(patient1);
        activeAdmission.setDoctor(doctor);
        activeAdmission.setStatus(AdmissionStatus.ADMITTED);
        activeAdmission.setAdmissionDate(LocalDateTime.now().minusDays(3));
        activeAdmission.setIsBilled(false);

        when(admissionRepository.findById(501L)).thenReturn(Optional.of(activeAdmission));
        when(bedRepository.findByIdForUpdate(102L)).thenReturn(Optional.of(occupiedBed));
        when(admissionRepository.save(any(Admission.class))).thenAnswer(i -> i.getArgument(0));

        Admission discharged = admissionService.dischargePatient(501L, "Satisfactory recovery");

        assertEquals(AdmissionStatus.DISCHARGED, discharged.getStatus());
        assertEquals(BedStatus.AVAILABLE, occupiedBed.getStatus());
        assertTrue(discharged.getIsBilled());
        assertEquals(3L, discharged.getTotalDays());

        verify(bedRepository, times(1)).save(occupiedBed);
        verify(invoiceService, times(1)).addWardFee(eq(patient1), eq(501L), eq("Medical Ward"), eq("BED-MW-02"), eq(3L), eq(3000.0), eq(9000.0));
    }

    @Test
    @DisplayName("Task 2.5B: Reject repeated discharge for already discharged patient")
    void testRepeatedDischargeRejected() {
        Admission dischargedAdmission = new Admission();
        dischargedAdmission.setId(501L);
        dischargedAdmission.setStatus(AdmissionStatus.DISCHARGED);
        dischargedAdmission.setDischargeDate(LocalDateTime.now().minusHours(2));

        when(admissionRepository.findById(501L)).thenReturn(Optional.of(dischargedAdmission));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            admissionService.dischargePatient(501L, "Notes");
        });

        assertTrue(ex.getMessage().contains("already been discharged"));
        verify(invoiceService, never()).addWardFee(any(), any(), any(), any(), anyLong(), anyDouble(), anyDouble());
    }

    @Test
    @DisplayName("Task 2.5B: Concurrent admission attempts to same bed - exactly one succeeds, second is rejected")
    void testConcurrentAdmissionAttemptsOnlyOneSucceeds() throws InterruptedException, ExecutionException {
        final AtomicReference<BedStatus> currentBedStatus = new AtomicReference<>(BedStatus.AVAILABLE);

        when(bedRepository.findByIdForUpdate(101L)).thenAnswer(inv -> {
            Bed b = new Bed();
            b.setId(101L);
            b.setBedNumber("BED-MW-01");
            b.setWard(ward);
            b.setStatus(currentBedStatus.get());
            b.setDailyRate(3000.0);
            return Optional.of(b);
        });

        when(admissionRepository.existsByBedIdAndStatus(eq(101L), eq(AdmissionStatus.ADMITTED)))
                .thenAnswer(inv -> currentBedStatus.get() == BedStatus.OCCUPIED);

        lenient().when(patientRepository.findById(201L)).thenReturn(Optional.of(patient1));
        lenient().when(patientRepository.findById(202L)).thenReturn(Optional.of(patient2));
        lenient().when(doctorRepository.findById(301L)).thenReturn(Optional.of(doctor));

        doAnswer(inv -> {
            Bed b = inv.getArgument(0);
            currentBedStatus.set(b.getStatus());
            return b;
        }).when(bedRepository).save(any(Bed.class));

        lenient().when(admissionRepository.save(any(Admission.class))).thenAnswer(i -> i.getArgument(0));

        int threadCount = 2;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch readyLatch = new CountDownLatch(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);

        List<Future<Boolean>> futures = new ArrayList<>();

        // Patient 1 task
        futures.add(executor.submit(() -> {
            readyLatch.countDown();
            startLatch.await();
            try {
                Admission req = new Admission();
                Bed targetBed = new Bed();
                targetBed.setId(101L);
                req.setBed(targetBed);
                req.setPatient(patient1);
                req.setDoctor(doctor);

                synchronized (admissionService) { // Simulates DB pessimistic write lock serialization
                    admissionService.admitPatient(req);
                }
                return true;
            } catch (IllegalStateException e) {
                return false;
            }
        }));

        // Patient 2 task
        futures.add(executor.submit(() -> {
            readyLatch.countDown();
            startLatch.await();
            try {
                Admission req = new Admission();
                Bed targetBed = new Bed();
                targetBed.setId(101L);
                req.setBed(targetBed);
                req.setPatient(patient2);
                req.setDoctor(doctor);

                synchronized (admissionService) { // Simulates DB pessimistic write lock serialization
                    admissionService.admitPatient(req);
                }
                return true;
            } catch (IllegalStateException e) {
                return false;
            }
        }));

        readyLatch.await();
        startLatch.countDown(); // Fire both threads simultaneously

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

        // Exactly one concurrent admission should succeed, other rejected
        assertEquals(1, successCount, "Exactly one concurrent admission request must succeed.");
        assertEquals(1, failureCount, "The conflicting admission request must be rejected.");
        assertEquals(BedStatus.OCCUPIED, currentBedStatus.get(), "Bed status must be OCCUPIED after successful admission.");
    }
}
