package com.hospital.hms.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "medicine_batches")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MedicineBatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Many-to-One relationship: Batch belongs to a specific medicine
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "medicine_id", nullable = false)
    @JsonBackReference
    private Medicine medicine;

    // Unique batch identifier code (e.g. BATCH-2026-A1)
    @Column(nullable = false, length = 50)
    private String batchNumber;

    // Available inventory quantity in this specific batch
    @Column(nullable = false)
    private Integer quantity;

    // Expiry date of this batch
    @Column(nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate expiryDate;

    // Timestamp when this batch was recorded
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    @PreUpdate
    protected void onValidate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.quantity == null) {
            this.quantity = 0;
        } else if (this.quantity < 0) {
            throw new IllegalStateException("Batch quantity cannot be negative: " + this.quantity);
        }
    }

    public void setQuantity(Integer quantity) {
        if (quantity != null && quantity < 0) {
            throw new IllegalArgumentException("Batch quantity cannot be negative: " + quantity);
        }
        this.quantity = quantity;
    }
}

