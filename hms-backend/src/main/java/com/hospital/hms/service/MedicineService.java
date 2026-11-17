package com.hospital.hms.service;

import com.hospital.hms.entity.Medicine;
import com.hospital.hms.entity.MedicineBatch;
import com.hospital.hms.entity.Patient;
import com.hospital.hms.repository.MedicineBatchRepository;
import com.hospital.hms.repository.MedicineRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class MedicineService {

    @Autowired
    private MedicineRepository medicineRepository;

    @Autowired
    private MedicineBatchRepository medicineBatchRepository;

    @Autowired
    private InvoiceService invoiceService;

    // Add a new medicine to the inventory
    @Transactional
    public Medicine addMedicine(Medicine medicine) {
        if (medicine.getExpiryDate() == null) {
            medicine.setExpiryDate(LocalDate.now().plusMonths(12));
        }

        // Save medicine record first
        Medicine saved = medicineRepository.save(medicine);

        // If initial stock quantity was provided, auto-create its initial batch
        if (saved.getStockQuantity() != null && saved.getStockQuantity() > 0) {
            MedicineBatch initialBatch = new MedicineBatch();
            initialBatch.setMedicine(saved);
            initialBatch.setBatchNumber("BATCH-" + System.currentTimeMillis() % 100000);
            initialBatch.setQuantity(saved.getStockQuantity());
            initialBatch.setExpiryDate(saved.getExpiryDate());
            medicineBatchRepository.save(initialBatch);
        }

        return saved;
    }

    // Retrieve all medicines in inventory
    public List<Medicine> getAllMedicines() {
        return medicineRepository.findAll();
    }

    // Retrieve single medicine by ID
    public Optional<Medicine> getMedicineById(Long id) {
        return medicineRepository.findById(id);
    }

    // Retrieve all inventory batches ordered by earliest expiry date
    public List<MedicineBatch> getAllBatches() {
        return medicineBatchRepository.findAllByOrderByExpiryDateAsc();
    }

    // Retrieve batches for a specific medicine
    public List<MedicineBatch> getBatchesByMedicineId(Long medicineId) {
        return medicineBatchRepository.findByMedicineIdOrderByExpiryDateAsc(medicineId);
    }

    // Add a new stock batch to an existing medicine
    @Transactional
    public MedicineBatch addBatch(Long medicineId, MedicineBatch batch) {
        Medicine medicine = medicineRepository.findById(medicineId)
                .orElseThrow(() -> new RuntimeException("Medicine not found with ID: " + medicineId));

        batch.setMedicine(medicine);
        if (batch.getBatchNumber() == null || batch.getBatchNumber().trim().isEmpty()) {
            batch.setBatchNumber("BATCH-" + System.currentTimeMillis() % 100000);
        }
        if (batch.getExpiryDate() == null) {
            batch.setExpiryDate(LocalDate.now().plusMonths(12));
        }

        MedicineBatch savedBatch = medicineBatchRepository.save(batch);

        // Recalculate medicine total stock and earliest expiry date
        medicine.recalculateStock();
        medicineRepository.save(medicine);

        return savedBatch;
    }

    // Dispense medicine by deducting from earliest expiring batch (FEFO) and auto-billing
    @Transactional
    public Map<String, Object> dispenseMedicine(Long medicineId, int requestedQuantity, Patient patient) {
        if (requestedQuantity <= 0) {
            throw new IllegalArgumentException("Dispense quantity must be greater than zero.");
        }

        Medicine medicine = medicineRepository.findById(medicineId)
                .orElseThrow(() -> new RuntimeException("Medicine not found with ID: " + medicineId));

        if (medicine.getStockQuantity() < requestedQuantity) {
            throw new IllegalStateException("Insufficient stock for " + medicine.getName() + ". Available: " + medicine.getStockQuantity() + ", Requested: " + requestedQuantity);
        }

        // Fetch active batches with stock > 0, ordered by earliest expiry date (FEFO)
        List<MedicineBatch> batches = medicineBatchRepository.findByMedicineIdAndQuantityGreaterThanOrderByExpiryDateAsc(medicineId, 0);

        int remainingToDeduct = requestedQuantity;
        StringBuilder batchesDeducted = new StringBuilder();

        for (MedicineBatch b : batches) {
            if (remainingToDeduct <= 0) break;

            int deduct = Math.min(b.getQuantity(), remainingToDeduct);
            b.setQuantity(b.getQuantity() - deduct);
            remainingToDeduct -= deduct;
            medicineBatchRepository.save(b);

            if (batchesDeducted.length() > 0) batchesDeducted.append(", ");
            batchesDeducted.append(b.getBatchNumber()).append(" (-").append(deduct).append(")");
        }

        // Recalculate total stock on medicine
        medicine.recalculateStock();
        medicineRepository.save(medicine);

        Double totalPrice = medicine.getPrice() * requestedQuantity;

        // Auto-billing to patient's active invoice
        if (patient != null && patient.getId() != null) {
            try {
                invoiceService.addPharmacyFee(patient, medicine.getName(), requestedQuantity, totalPrice);
            } catch (Exception e) {
                System.err.println("⚠️ Warning: Could not auto-bill pharmacy medication: " + e.getMessage());
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("medicineId", medicine.getId());
        result.put("medicineName", medicine.getName());
        result.put("dispensedQuantity", requestedQuantity);
        result.put("totalPrice", totalPrice);
        result.put("remainingStock", medicine.getStockQuantity());
        result.put("batchesUsed", batchesDeducted.toString());
        return result;
    }
}