package com.hospital.hms.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "admissions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Admission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The admitted patient
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    // Attending doctor in charge of the patient's care
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    // Assigned hospital bed
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "bed_id", nullable = false)
    private Bed bed;

    // Date and time of admission
    @Column(nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime admissionDate;

    // Date and time of discharge
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime dischargeDate;

    // Inpatient status: ADMITTED or DISCHARGED
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AdmissionStatus status = AdmissionStatus.ADMITTED;

    // Primary reason for hospital admission / diagnosis
    private String admissionReason;

    // Clinical discharge summary and doctor instructions
    @Column(columnDefinition = "TEXT")
    private String dischargeNotes;

    // Total duration of stay in days (calculated upon discharge)
    private Long totalDays;

    // Total bed accommodation charges billed upon discharge
    private Double totalBedCharge;

    @Column(nullable = false)
    private Boolean isBilled = false;

    @PrePersist
    protected void onCreate() {
        if (this.admissionDate == null) {
            this.admissionDate = LocalDateTime.now();
        }
        if (this.status == null) {
            this.status = AdmissionStatus.ADMITTED;
        }
        if (this.isBilled == null) {
            this.isBilled = false;
        }
    }
}
