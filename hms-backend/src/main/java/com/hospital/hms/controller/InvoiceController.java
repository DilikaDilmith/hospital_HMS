package com.hospital.hms.controller;

import com.hospital.hms.entity.Invoice;
import com.hospital.hms.entity.InvoiceItem;
import com.hospital.hms.service.InvoiceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {

    @Autowired
    private InvoiceService invoiceService;

    // Endpoint to retrieve all invoices
    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'RECEPTIONIST', 'ACCOUNTANT', 'ROLE_ADMIN', 'ROLE_RECEPTIONIST', 'ROLE_ACCOUNTANT')")
    public List<Invoice> getAllInvoices() {
        return invoiceService.getAllInvoices();
    }

    // Endpoint to retrieve an invoice by ID
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'RECEPTIONIST', 'ACCOUNTANT', 'PATIENT', 'ROLE_ADMIN', 'ROLE_RECEPTIONIST', 'ROLE_ACCOUNTANT', 'ROLE_PATIENT')")
    public ResponseEntity<?> getInvoiceById(@PathVariable Long id) {
        return invoiceService.getInvoiceById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Endpoint to retrieve invoices for a specific patient
    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'RECEPTIONIST', 'ACCOUNTANT', 'PATIENT', 'ROLE_ADMIN', 'ROLE_RECEPTIONIST', 'ROLE_ACCOUNTANT', 'ROLE_PATIENT')")
    public List<Invoice> getInvoicesByPatientId(@PathVariable Long patientId) {
        return invoiceService.getInvoicesByPatientId(patientId);
    }

    // Endpoint to generate a new invoice
    @PostMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'RECEPTIONIST', 'ACCOUNTANT', 'ROLE_ADMIN', 'ROLE_RECEPTIONIST', 'ROLE_ACCOUNTANT')")
    public ResponseEntity<?> createInvoice(@RequestBody Invoice invoice) {
        try {
            Invoice created = invoiceService.createInvoice(invoice);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to create invoice: " + e.getMessage());
        }
    }

    // Endpoint to add an itemized charge to an invoice
    @PostMapping("/{id}/items")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'RECEPTIONIST', 'ACCOUNTANT', 'DOCTOR', 'ROLE_ADMIN', 'ROLE_RECEPTIONIST', 'ROLE_ACCOUNTANT', 'ROLE_DOCTOR')")
    public ResponseEntity<?> addItemToInvoice(@PathVariable Long id, @RequestBody InvoiceItem item) {
        try {
            Invoice updated = invoiceService.addItemToInvoice(id, item);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to add item to invoice: " + e.getMessage());
        }
    }

    // Endpoint to mark an invoice as PAID
    @PutMapping("/{id}/pay")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'RECEPTIONIST', 'ACCOUNTANT', 'ROLE_ADMIN', 'ROLE_RECEPTIONIST', 'ROLE_ACCOUNTANT')")
    public ResponseEntity<?> markInvoiceAsPaid(@PathVariable Long id) {
        try {
            Invoice updated = invoiceService.markInvoiceAsPaid(id);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to mark invoice as paid: " + e.getMessage());
        }
    }

    // Endpoint to delete an invoice
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<?> deleteInvoice(@PathVariable Long id) {
        try {
            invoiceService.deleteInvoice(id);
            return ResponseEntity.ok("Invoice deleted successfully!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to delete invoice: " + e.getMessage());
        }
    }
}
