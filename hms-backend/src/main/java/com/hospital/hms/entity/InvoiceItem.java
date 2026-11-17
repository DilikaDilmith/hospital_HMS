package com.hospital.hms.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "invoice_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Many-to-One relationship to parent Invoice
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", referencedColumnName = "id", nullable = false)
    @JsonBackReference
    private Invoice invoice;

    // Description of item or service (e.g. "Doctor Consultation Fee", "Full Blood Count", "Paracetamol 500mg")
    @Column(nullable = false)
    private String description;

    // Itemized charge amount
    @Column(nullable = false)
    private Double amount;

    // Item category: CONSULTATION, LAB, PHARMACY, WARD, MISC
    @Column(nullable = false, length = 50)
    private String category;

    // Idempotency tracking for the origin of charges (e.g. APPOINTMENT, LAB_TEST, PHARMACY, WARD)
    @Column(name = "reference_type", length = 50)
    private String referenceType;

    // Originating event or entity ID
    @Column(name = "reference_id")
    private Long referenceId;

    // Date and time item was created
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.amount == null) {
            this.amount = 0.0;
        }
    }
}
