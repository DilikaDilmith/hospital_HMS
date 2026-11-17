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
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class MedicineExpiryValidationTest {

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

    @BeforeEach
    void setUp() {
        medicine = new Medicine();
        medicine.setId(10L);
        medicine.setName("Amoxicillin 500mg");
        medicine.setPrice(45.0);
        medicine.setStockQuantity(50);
        medicine.setBatches(new ArrayList<>());

        patient = new Patient();
        patient.setId(100L);
        patient.setFirstName("Kamal");
        patient.setLastName("Silva");
    }

    @Test
    @DisplayName("Task 2.3: Dispense only from valid non-expired batches following FEFO")
    void testDispenseOnlyFromValidBatchesFEFO() {
        MedicineBatch validBatch1 = new MedicineBatch();
        validBatch1.setId(1L);
        validBatch1.setMedicine(medicine);
        validBatch1.setBatchNumber("BATCH-EARLY-VALID");
        validBatch1.setQuantity(10);
        validBatch1.setExpiryDate(LocalDate.now().plusMonths(2));

        MedicineBatch validBatch2 = new MedicineBatch();
        validBatch2.setId(2L);
        validBatch2.setMedicine(medicine);
        validBatch2.setBatchNumber("BATCH-LATER-VALID");
        validBatch2.setQuantity(20);
        validBatch2.setExpiryDate(LocalDate.now().plusMonths(6));

        when(medicineRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(medicine));
        when(medicineBatchRepository.findValidBatchesForDispensingForUpdate(eq(10L), eq(0), any(LocalDate.class)))
                .thenReturn(Arrays.asList(validBatch1, validBatch2));

        // Request 15 units: should consume all 10 from Batch 1, and 5 from Batch 2
        Map<String, Object> result = medicineService.dispenseMedicine(10L, 15, patient);

        assertNotNull(result);
        assertEquals(15, result.get("dispensedQuantity"));
        assertEquals(0, validBatch1.getQuantity());
        assertEquals(15, validBatch2.getQuantity());

        verify(medicineBatchRepository, times(1)).save(validBatch1);
        verify(medicineBatchRepository, times(1)).save(validBatch2);
        verify(invoiceService, times(1)).addPharmacyFee(eq(patient), eq("Amoxicillin 500mg"), eq(15), eq(45.0 * 15));
    }

    @Test
    @DisplayName("Task 2.3: Exclude expired batches even if they have earliest expiry date")
    void testExcludeExpiredBatchesEvenWithEarliestExpiry() {
        // Expired batch in past
        MedicineBatch expiredBatch = new MedicineBatch();
        expiredBatch.setId(99L);
        expiredBatch.setMedicine(medicine);
        expiredBatch.setBatchNumber("BATCH-EXPIRED");
        expiredBatch.setQuantity(50);
        expiredBatch.setExpiryDate(LocalDate.now().minusDays(5));

        // Valid batch in future
        MedicineBatch validBatch = new MedicineBatch();
        validBatch.setId(100L);
        validBatch.setMedicine(medicine);
        validBatch.setBatchNumber("BATCH-VALID");
        validBatch.setQuantity(30);
        validBatch.setExpiryDate(LocalDate.now().plusMonths(3));

        when(medicineRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(medicine));
        // The repository method findValidBatchesForDispensingForUpdate strictly excludes the expired batch
        when(medicineBatchRepository.findValidBatchesForDispensingForUpdate(eq(10L), eq(0), any(LocalDate.class)))
                .thenReturn(Collections.singletonList(validBatch));

        // Request 10 units
        Map<String, Object> result = medicineService.dispenseMedicine(10L, 10, patient);

        assertNotNull(result);
        // Valid batch deducted
        assertEquals(20, validBatch.getQuantity());
        verify(medicineBatchRepository, times(1)).save(validBatch);

        // Expired batch must NEVER be saved or deducted
        verify(medicineBatchRepository, never()).save(expiredBatch);
        assertEquals(50, expiredBatch.getQuantity());
    }

    @Test
    @DisplayName("Task 2.3: Reject dispensing when all available stock is expired")
    void testRejectDispensingWhenAllStockIsExpired() {
        when(medicineRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(medicine));
        // No valid non-expired batches found
        when(medicineBatchRepository.findValidBatchesForDispensingForUpdate(eq(10L), eq(0), any(LocalDate.class)))
                .thenReturn(Collections.emptyList());

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            medicineService.dispenseMedicine(10L, 5, patient);
        });

        assertTrue(ex.getMessage().contains("No valid, non-expired stock available"),
                "Should state that no valid non-expired stock is available.");

        verify(medicineBatchRepository, never()).save(any());
        verify(invoiceService, never()).addPharmacyFee(any(), any(), anyInt(), anyDouble());
    }

    @Test
    @DisplayName("Task 2.3: Reject dispensing when mixed inventory has insufficient non-expired stock")
    void testRejectWhenMixedStockHasInsufficientValidStock() {
        // Only 5 valid units available
        MedicineBatch validBatch = new MedicineBatch();
        validBatch.setId(1L);
        validBatch.setMedicine(medicine);
        validBatch.setBatchNumber("BATCH-VALID-SMALL");
        validBatch.setQuantity(5);
        validBatch.setExpiryDate(LocalDate.now().plusMonths(1));

        when(medicineRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(medicine));
        when(medicineBatchRepository.findValidBatchesForDispensingForUpdate(eq(10L), eq(0), any(LocalDate.class)))
                .thenReturn(Collections.singletonList(validBatch));

        // Request 10 units (more than 5 valid units)
        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            medicineService.dispenseMedicine(10L, 10, patient);
        });

        assertTrue(ex.getMessage().contains("Insufficient non-expired stock"),
                "Should state insufficient non-expired stock.");
        assertTrue(ex.getMessage().contains("Available valid stock: 5"),
                "Should report exact valid stock available.");

        // Must not deduct from valid batch or bill patient
        verify(medicineBatchRepository, never()).save(any());
        verify(invoiceService, never()).addPharmacyFee(any(), any(), anyInt(), anyDouble());
    }
}
