package com.hospital.hms.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "wards")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Ward {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Ward name (e.g., General Ward A, Intensive Care Unit, Maternity Ward)
    @Column(nullable = false, unique = true)
    private String name;

    // Ward classification (e.g., GENERAL, ICU, PRIVATE, MATERNITY, PEDIATRIC)
    @Column(nullable = false)
    private String type;

    // Standard daily stay rate for beds in this ward in LKR
    @Column(nullable = false)
    private Double dailyRate = 2500.0;

    // List of beds located within this hospital ward
    @OneToMany(mappedBy = "ward", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<Bed> beds = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        if (this.dailyRate == null || this.dailyRate <= 0) {
            this.dailyRate = 2500.0;
        }
    }

    public void addBed(Bed bed) {
        if (this.beds == null) {
            this.beds = new ArrayList<>();
        }
        this.beds.add(bed);
        bed.setWard(this);
    }
}
