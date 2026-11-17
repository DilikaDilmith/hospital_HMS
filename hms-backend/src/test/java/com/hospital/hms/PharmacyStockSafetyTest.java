package com.hospital.hms;

import com.hospital.hms.entity.Medicine;
import com.hospital.hms.entity.MedicineBatch;
import com.hospital.hms.entity.Patient;
import com.hospital.hms.repository.MedicineBatchRepository;
import com.hospital.hms.repository.MedicineRepository;
import com.hospital.hms.service.InvoiceService;
import com.hospital.hms.service.MedicineService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PharmacyStockSafetyTest {

    @Mock
    private MedicineRepository medicineRepository;

    @Mock
    private MedicineBatchRepository medicineBatchRepository;

    @Mock
    private InvoiceService invoiceService;

    @InjectMocks
    private MedicineService medicineService;

    private Medicine medicine;
    private Patient patient;
    private MedicineBatch batch;

    @BeforeEach
    void setUp() {
        medicine = new Medicine();
        medicine.setId(50L);
        medicine.setName("Ciprofloxacin 500mg");
        medicine.setPrice(60.0);
        medicine.setStockQuantity(10);
        medicine.setBatches(new ArrayList<>());

        batch = new MedicineBatch();
        batch.setId(501L);
        batch.setMedicine(medicine);
        batch.setBatchNumber("CIPRO-BATCH-01");
        batch.setQuantity(10);
        batch.setExpiryDate(LocalDate.now().plusMonths(8));

        patient = new Patient();
        patient.setId(200L);
        patient.setFirstName("Nimal");
        patient.setLastName("Fernando");
    }

    @Test
    @DisplayName("Task 2.4: Prevent negative batch quantities on entity setter")
    void testPreventNegativeBatchQuantity() {
        MedicineBatch b = new MedicineBatch();
        b.setBatchNumber("TEST-BATCH");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            b.setQuantity(-1);
        });

        assertTrue(ex.getMessage().contains("cannot be negative"));
    }

    @Test
    @DisplayName("Task 2.4: If stock is insufficient, reject without changing inventory or creating a bill")
    void testInsufficientStockRejectsWithoutChangingInventoryOrBilling() {
        when(medicineRepository.findByIdForUpdate(50L)).thenReturn(Optional.of(medicine));
        when(medicineBatchRepository.findValidBatchesForDispensingForUpdate(eq(50L), eq(0), any(LocalDate.class)))
                .thenReturn(Collections.singletonList(batch));

        // Available: 10, Requested: 15
        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            medicineService.dispenseMedicine(50L, 15, patient);
        });

        assertTrue(ex.getMessage().contains("Insufficient non-expired stock"));

        // Batch quantity must remain unchanged at 10
        assertEquals(10, batch.getQuantity());

        // Repositories must never be saved and patient must never be billed
        verify(medicineBatchRepository, never()).save(any());
        verify(medicineRepository, never()).save(any());
        verify(invoiceService, never()).addPharmacyFee(any(), any(), anyInt(), anyDouble());
    }

    @Test
    @DisplayName("Task 2.4: Concurrent dispensing scenario - only one pharmacist can claim limited stock")
    void testConcurrentDispensingScenario() throws InterruptedException, ExecutionException {
        // Shared state for the concurrent test: only 10 units available
        final int initialStock = 10;
        final AtomicInteger availableStock = new AtomicInteger(initialStock);

        // Synchronized mock to simulate serialized DB pessimistic write lock
        when(medicineRepository.findByIdForUpdate(50L)).thenAnswer(invocation -> {
            Medicine m = new Medicine();
            m.setId(50L);
            m.setName("Ciprofloxacin 500mg");
            m.setPrice(60.0);
            m.setStockQuantity(availableStock.get());
            return Optional.of(m);
        });

        when(medicineBatchRepository.findValidBatchesForDispensingForUpdate(eq(50L), eq(0), any(LocalDate.class)))
                .thenAnswer(invocation -> {
                    synchronized (availableStock) {
                        int current = availableStock.get();
                        if (current <= 0) {
                            return Collections.emptyList();
                        }
                        MedicineBatch b = new MedicineBatch();
                        b.setId(501L);
                        b.setMedicine(medicine);
                        b.setBatchNumber("CIPRO-BATCH-01");
                        b.setQuantity(current);
                        b.setExpiryDate(LocalDate.now().plusMonths(8));
                        return Collections.singletonList(b);
                    }
                });

        doAnswer(invocation -> {
            MedicineBatch b = invocation.getArgument(0);
            synchronized (availableStock) {
                availableStock.set(b.getQuantity());
            }
            return b;
        }).when(medicineBatchRepository).save(any(MedicineBatch.class));

        // Two concurrent pharmacist threads attempt to dispense 10 units each
        int threadCount = 2;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch readyLatch = new CountDownLatch(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);

        List<Future<Boolean>> futures = new ArrayList<>();

        for (int i = 0; i < threadCount; i++) {
            futures.add(executor.submit(() -> {
                readyLatch.countDown();
                startLatch.await(); // Ensure both threads start simultaneously
                try {
                    synchronized (medicineService) { // Simulates DB transaction serialization via lock
                        medicineService.dispenseMedicine(50L, 10, patient);
                    }
                    return true;
                } catch (IllegalStateException e) {
                    return false; // Rejected due to depleted stock
                }
            }));
        }

        readyLatch.await();
        startLatch.countDown(); // Trigger simultaneous execution

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

        // Exactly one pharmacist should succeed, the other must be rejected
        assertEquals(1, successCount, "Exactly one concurrent dispensing request must succeed.");
        assertEquals(1, failureCount, "The conflicting concurrent request must be safely rejected.");
        assertEquals(0, availableStock.get(), "Final stock must be exactly 0, never negative.");

        // Patient was billed exactly once for 10 units
        verify(invoiceService, times(1)).addPharmacyFee(eq(patient), eq("Ciprofloxacin 500mg"), eq(10), eq(60.0 * 10));
    }
}
