package com.hospital.hms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "lab_tests")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LabTest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Name of the test (e.g., Blood Test, X-Ray, MRI)
    @Column(nullable = false)
    private String testName;

    // Current status of the test (e.g., REQUESTED, COLLECTED, COMPLETED)
    @Column(nullable = false)
    private String status;

    // The medical result of the test
    @Column(columnDefinition = "TEXT")
    private String result;

    // Date and time when the test was requested
    private LocalDateTime requestedAt;

    // The patient who needs the test
    @ManyToOne
    @JoinColumn(name = "patient_id", referencedColumnName = "id")
    private Patient patient;

    // The doctor who requested the test
    @ManyToOne
    @JoinColumn(name = "doctor_id", referencedColumnName = "id")
    private Doctor doctor;
}