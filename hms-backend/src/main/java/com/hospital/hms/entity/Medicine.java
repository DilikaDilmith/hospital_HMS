package com.hospital.hms.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "medicines")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Medicine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Name of the medicine (e.g., Paracetamol 500mg, Amoxicillin 250mg)
    @Column(nullable = false)
    private String name;

    // Brief description or manufacturer details
    private String description;

    // Price per unit in LKR
    @Column(nullable = false)
    private Double price;

    // Aggregated current available stock quantity across all batches
    @Column(nullable = false)
    private Integer stockQuantity = 0;

    // Earliest expiry date across all active batches
    @Column(nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate expiryDate;

    // Inventory batches tracked for this medicine (FEFO deduction)
    @OneToMany(mappedBy = "medicine", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<MedicineBatch> batches = new ArrayList<>();

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        recalculateStock();
    }

    public void addBatch(MedicineBatch batch) {
        if (this.batches == null) {
            this.batches = new ArrayList<>();
        }
        this.batches.add(batch);
        batch.setMedicine(this);
        recalculateStock();
    }

    public void recalculateStock() {
        if (this.batches != null && !this.batches.isEmpty()) {
            this.stockQuantity = this.batches.stream()
                    .mapToInt(b -> b.getQuantity() != null ? b.getQuantity() : 0)
                    .sum();

            // Set expiry date to earliest expiring batch with positive quantity
            this.batches.stream()
                    .filter(b -> b.getQuantity() != null && b.getQuantity() > 0 && b.getExpiryDate() != null)
                    .map(MedicineBatch::getExpiryDate)
                    .min(LocalDate::compareTo)
                    .ifPresent(earliest -> this.expiryDate = earliest);
        } else {
            if (this.stockQuantity == null) {
                this.stockQuantity = 0;
            }
            if (this.expiryDate == null) {
                this.expiryDate = LocalDate.now().plusMonths(12);
            }
        }
    }
}