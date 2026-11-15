package com.hospital.hms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "bills")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Bill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Total amount to be paid by the patient
    @Column(nullable = false)
    private Double totalAmount;

    // Payment status (e.g., PAID, UNPAID, PENDING)
    @Column(nullable = false)
    private String paymentStatus;

    // Description of the charges (e.g., Consultation, Lab Test, Pharmacy)
    private String description;

    // Date and time when the bill was generated
    private LocalDateTime billDate;

    // Many-to-One relationship: Multiple bills can belong to one patient
    @ManyToOne
    @JoinColumn(name = "patient_id", referencedColumnName = "id")
    private Patient patient;
}