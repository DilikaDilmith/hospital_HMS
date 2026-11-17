package com.hospital.hms.repository;

import com.hospital.hms.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    // Retrieve all invoices ordered by latest date first
    List<Invoice> findAllByOrderByDateDesc();

    // Retrieve all invoices for a specific patient
    List<Invoice> findByPatientIdOrderByDateDesc(Long patientId);

    // Retrieve all invoices for a patient by username
    List<Invoice> findByPatientUserUsernameOrderByDateDesc(String username);

    // Retrieve active (UNPAID) invoice for a patient, ordered by latest first
    Optional<Invoice> findFirstByPatientIdAndStatusOrderByIdDesc(Long patientId, String status);

    // Filter invoices by status (PAID or UNPAID)
    List<Invoice> findByStatus(String status);

    // Calculate total revenue across all invoices
    @Query("SELECT COALESCE(SUM(i.totalAmount), 0.0) FROM Invoice i")
    Double getTotalRevenue();

    // Calculate total paid revenue
    @Query("SELECT COALESCE(SUM(i.totalAmount), 0.0) FROM Invoice i WHERE i.status = 'PAID'")
    Double getPaidRevenue();
}
