package com.hospital.hms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "medicines")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Medicine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Name of the medicine (e.g., Paracetamol, Amoxicillin)
    @Column(nullable = false)
    private String name;

    // Brief description or manufacturer details
    private String description;

    // Price per unit
    @Column(nullable = false)
    private Double price;

    // Current available stock quantity
    @Column(nullable = false)
    private Integer stockQuantity;

    // Date when the medicine expires
    @Column(nullable = false)
    private LocalDate expiryDate;
}