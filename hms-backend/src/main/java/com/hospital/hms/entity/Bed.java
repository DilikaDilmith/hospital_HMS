package com.hospital.hms.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "beds")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Bed {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Many-to-One relationship to Ward
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ward_id", nullable = false)
    @JsonBackReference
    private Ward ward;

    // Bed identification label (e.g., BED-GW-01, BED-ICU-04)
    @Column(nullable = false)
    private String bedNumber;

    // Current bed status: AVAILABLE, OCCUPIED, MAINTENANCE
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private BedStatus status = BedStatus.AVAILABLE;

    // Optional daily rate override (falls back to ward.dailyRate if null)
    private Double dailyRate;

    @PrePersist
    protected void onCreate() {
        if (this.status == null) {
            this.status = BedStatus.AVAILABLE;
        }
    }

    public Double getEffectiveDailyRate() {
        if (this.dailyRate != null && this.dailyRate > 0) {
            return this.dailyRate;
        }
        if (this.ward != null && this.ward.getDailyRate() != null && this.ward.getDailyRate() > 0) {
            return this.ward.getDailyRate();
        }
        return 2500.0;
    }
}
