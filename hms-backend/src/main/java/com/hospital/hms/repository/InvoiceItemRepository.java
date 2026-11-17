package com.hospital.hms.repository;

import com.hospital.hms.entity.InvoiceItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvoiceItemRepository extends JpaRepository<InvoiceItem, Long> {

    // Retrieve all line items for an invoice
    List<InvoiceItem> findByInvoiceId(Long invoiceId);

    // Retrieve line items by category
    List<InvoiceItem> findByCategory(String category);
}
