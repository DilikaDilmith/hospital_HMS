package com.hospital.hms.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "invoices")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Many-to-One relationship to Patient
    @ManyToOne
    @JoinColumn(name = "patient_id", referencedColumnName = "id", nullable = false)
    private Patient patient;

    // Total calculated amount of all invoice items
    @Column(nullable = false)
    private Double totalAmount = 0.0;

    // Invoice payment status: PAID or UNPAID
    @Column(nullable = false, length = 20)
    private String status = "UNPAID";

    // Date when invoice was generated or issued
    @Column(nullable = false)
    private LocalDateTime date;

    // Date when payment was received (for receipts)
    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    // Payment method recorded (e.g. CASH / COUNTER, CARD)
    @Column(name = "payment_method", length = 50)
    private String paymentMethod;

    // Multiple itemized charges under this invoice
    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<InvoiceItem> items = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        if (this.date == null) {
            this.date = LocalDateTime.now();
        }
        if (this.status == null || this.status.trim().isEmpty()) {
            this.status = "UNPAID";
        }
        if (this.totalAmount == null) {
            this.totalAmount = 0.0;
        }
    }

    // Helper method to add an item and update total
    public void addItem(InvoiceItem item) {
        if (this.items == null) {
            this.items = new ArrayList<>();
        }
        this.items.add(item);
        item.setInvoice(this);
        recalculateTotal();
    }

    // Recalculate total amount from items
    public void recalculateTotal() {
        if (this.items != null && !this.items.isEmpty()) {
            this.totalAmount = this.items.stream()
                    .mapToDouble(i -> i.getAmount() != null ? i.getAmount() : 0.0)
                    .sum();
        } else {
            this.totalAmount = 0.0;
        }
    }
}
