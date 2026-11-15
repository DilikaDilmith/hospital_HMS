package com.hospital.hms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "medical_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MedicalRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The diagnosed disease or condition
    @Column(nullable = false)
    private String diagnosis;

    // Medicines prescribed by the doctor
    @Column(columnDefinition = "TEXT")
    private String prescription;

    // Details about past treatments or current treatment plan
    @Column(columnDefinition = "TEXT")
    private String treatmentHistory;

    // Date and time when the record was created
    private LocalDateTime recordDate;

    // The patient this record belongs to
    @ManyToOne
    @JoinColumn(name = "patient_id", referencedColumnName = "id")
    private Patient patient;

    // The doctor who created this record
    @ManyToOne
    @JoinColumn(name = "doctor_id", referencedColumnName = "id")
    private Doctor doctor;
}