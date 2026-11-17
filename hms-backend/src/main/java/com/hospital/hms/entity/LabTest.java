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

    // Name of the test (e.g., Full Blood Count, Lipid Profile, Liver Function Test)
    @Column(nullable = false)
    private String testName;

    // Strict states: REQUESTED -> SAMPLE_COLLECTED -> COMPLETED
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private LabTestStatus status = LabTestStatus.REQUESTED;

    // The medical result or findings of the test
    @Column(columnDefinition = "TEXT")
    private String result;

    // Standard fee charged for this laboratory test (defaults to 2500.0 LKR)
    @Column(nullable = false)
    private Double testFee = 2500.0;

    // Doctor clinical notes or special instructions for the lab
    @Column(columnDefinition = "TEXT")
    private String clinicalNotes;

    // Date and time when the test was ordered
    @Column(nullable = false)
    private LocalDateTime requestedAt;

    // Date and time when sample (blood/urine/specimen) was collected
    private LocalDateTime sampleCollectedAt;

    // Date and time when lab technician finalized results
    private LocalDateTime completedAt;

    // The patient who needs the test
    @ManyToOne
    @JoinColumn(name = "patient_id", referencedColumnName = "id", nullable = false)
    private Patient patient;

    // The doctor who requested the test
    @ManyToOne
    @JoinColumn(name = "doctor_id", referencedColumnName = "id")
    private Doctor doctor;

    // Tracks whether lab fee has been billed for this test
    @Column(name = "is_billed", nullable = false)
    private Boolean isBilled = false;

    @PrePersist
    protected void onCreate() {
        if (this.requestedAt == null) {
            this.requestedAt = LocalDateTime.now();
        }
        if (this.status == null) {
            this.status = LabTestStatus.REQUESTED;
        }
        if (this.testFee == null) {
            this.testFee = 2500.0;
        }
        if (this.isBilled == null) {
            this.isBilled = false;
        }
    }
}