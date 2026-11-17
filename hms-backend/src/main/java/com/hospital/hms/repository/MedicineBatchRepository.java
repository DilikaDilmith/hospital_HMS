package com.hospital.hms.repository;

import com.hospital.hms.entity.MedicineBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface MedicineBatchRepository extends JpaRepository<MedicineBatch, Long> {

    // Retrieve all batches for a specific medicine ordered by earliest expiry date (FEFO)
    List<MedicineBatch> findByMedicineIdOrderByExpiryDateAsc(Long medicineId);

    // Retrieve active batches with positive stock for FEFO deduction
    List<MedicineBatch> findByMedicineIdAndQuantityGreaterThanOrderByExpiryDateAsc(Long medicineId, int minQuantity);

    // Retrieve all inventory batches ordered by earliest expiry date
    List<MedicineBatch> findAllByOrderByExpiryDateAsc();

    // Find expired batches
    List<MedicineBatch> findByExpiryDateBefore(LocalDate date);
}

