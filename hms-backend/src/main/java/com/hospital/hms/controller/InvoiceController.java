package com.hospital.hms.controller;

import com.hospital.hms.entity.Invoice;
import com.hospital.hms.entity.InvoiceItem;
import com.hospital.hms.service.AuditLogService;
import com.hospital.hms.service.InvoiceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {

    @Autowired
    private InvoiceService invoiceService;

    @Autowired
    private AuditLogService auditLogService;

    public void setAuditLogService(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    public void setInvoiceService(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    // Endpoint to retrieve all invoices (Staff only - Patients use /my)
    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'RECEPTIONIST', 'ACCOUNTANT', 'ROLE_ADMIN', 'ROLE_RECEPTIONIST', 'ROLE_ACCOUNTANT')")
    public List<Invoice> getAllInvoices() {
        return invoiceService.getAllInvoices();
    }

    // Endpoint for authenticated patients to retrieve their own invoices
    @GetMapping("/my")
    @PreAuthorize("hasAnyAuthority('PATIENT', 'ROLE_PATIENT')")
    public List<Invoice> getMyInvoices(Authentication authentication) {
        return invoiceService.getInvoicesByPatientUsername(authentication.getName());
    }

    // Endpoint to retrieve an invoice by ID (Staff can view any; Patient can only view their own)
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'RECEPTIONIST', 'ACCOUNTANT', 'PATIENT', 'ROLE_ADMIN', 'ROLE_RECEPTIONIST', 'ROLE_ACCOUNTANT', 'ROLE_PATIENT')")
    public ResponseEntity<?> getInvoiceById(@PathVariable Long id, Authentication authentication) {
        Invoice invoice = invoiceService.getInvoiceById(id).orElse(null);
        if (invoice == null) {
            return ResponseEntity.notFound().build();
        }

        if (isCallerPatientOnly(authentication)) {
            if (invoice.getPatient() == null || invoice.getPatient().getUser() == null
                    || !invoice.getPatient().getUser().getUsername().equals(authentication.getName())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Access denied: You are not authorized to view other patients' billing invoices.");
            }
        }

        return ResponseEntity.ok(invoice);
    }

    // Endpoint to retrieve invoices for a specific patient
    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'RECEPTIONIST', 'ACCOUNTANT', 'PATIENT', 'ROLE_ADMIN', 'ROLE_RECEPTIONIST', 'ROLE_ACCOUNTANT', 'ROLE_PATIENT')")
    public ResponseEntity<?> getInvoicesByPatientId(@PathVariable Long patientId, Authentication authentication) {
        List<Invoice> list = invoiceService.getInvoicesByPatientId(patientId);

        if (isCallerPatientOnly(authentication)) {
            boolean mismatch = list.stream().anyMatch(inv -> inv.getPatient() != null && inv.getPatient().getUser() != null
                    && !inv.getPatient().getUser().getUsername().equals(authentication.getName()));
            if (mismatch) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Access denied: You cannot view other patients' billing history.");
            }
        }

        return ResponseEntity.ok(list);
    }

    // Endpoint to generate a new invoice
    @PostMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'RECEPTIONIST', 'ACCOUNTANT', 'ROLE_ADMIN', 'ROLE_RECEPTIONIST', 'ROLE_ACCOUNTANT')")
    public ResponseEntity<?> createInvoice(@RequestBody Invoice invoice, Authentication authentication) {
        String actor = (authentication != null) ? authentication.getName() : "STAFF";
        try {
            Invoice created = invoiceService.createInvoice(invoice);
            if (auditLogService != null) {
                auditLogService.log(actor, "INVOICE_CREATE", "SUCCESS",
                        "Created invoice #" + created.getId() + " (Total: LKR " + created.getTotalAmount() + ")");
            }
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            if (auditLogService != null) {
                auditLogService.log(actor, "INVOICE_CREATE", "FAILED", "Failed to create invoice: " + e.getMessage());
            }
            return ResponseEntity.badRequest().body("Failed to create invoice: " + e.getMessage());
        }
    }

    public ResponseEntity<?> createInvoice(Invoice invoice) {
        return createInvoice(invoice, null);
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
    public ResponseEntity<?> markInvoiceAsPaid(
            @PathVariable Long id,
            @RequestBody(required = false) java.util.Map<String, String> payload,
            Authentication authentication) {
        String actor = (authentication != null) ? authentication.getName() : "STAFF";
        try {
            String paymentMethod = payload != null ? payload.get("paymentMethod") : null;
            Invoice updated = invoiceService.markInvoiceAsPaid(id, paymentMethod);
            if (auditLogService != null) {
                auditLogService.log(actor, "INVOICE_PAYMENT", "SUCCESS",
                        "Marked invoice #" + id + " as PAID via " + (paymentMethod != null ? paymentMethod : "Standard payment"));
            }
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            if (auditLogService != null) {
                auditLogService.log(actor, "INVOICE_PAYMENT", "FAILED",
                        "Failed payment on invoice #" + id + ": " + e.getMessage());
            }
            return ResponseEntity.badRequest().body("Failed to mark invoice as paid: " + e.getMessage());
        }
    }

    public ResponseEntity<?> markInvoiceAsPaid(Long id, java.util.Map<String, String> payload) {
        return markInvoiceAsPaid(id, payload, null);
    }

    // Endpoint to delete an invoice
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<?> deleteInvoice(@PathVariable Long id, Authentication authentication) {
        String actor = (authentication != null) ? authentication.getName() : "ADMIN";
        try {
            invoiceService.deleteInvoice(id);
            if (auditLogService != null) {
                auditLogService.log(actor, "INVOICE_DELETE", "SUCCESS", "Deleted invoice #" + id);
            }
            return ResponseEntity.ok("Invoice deleted successfully!");
        } catch (Exception e) {
            if (auditLogService != null) {
                auditLogService.log(actor, "INVOICE_DELETE", "FAILED",
                        "Failed to delete invoice #" + id + ": " + e.getMessage());
            }
            return ResponseEntity.badRequest().body("Failed to delete invoice: " + e.getMessage());
        }
    }

    public ResponseEntity<?> deleteInvoice(Long id) {
        return deleteInvoice(id, null);
    }

    private boolean isCallerPatientOnly(Authentication authentication) {
        if (authentication == null) return false;
        boolean hasPatient = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("PATIENT") || a.getAuthority().equals("ROLE_PATIENT"));
        boolean hasStaff = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().contains("ADMIN") || a.getAuthority().contains("RECEPTIONIST") 
                            || a.getAuthority().contains("ACCOUNTANT") || a.getAuthority().contains("DOCTOR"));
        return hasPatient && !hasStaff;
    }
}
