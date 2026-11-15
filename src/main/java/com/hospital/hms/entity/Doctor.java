package com.hospital.hms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "doctors")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Doctor's first name
    @Column(nullable = false)
    private String firstName;

    // Doctor's last name
    @Column(nullable = false)
    private String lastName;

    // Medical specialization (e.g., Cardiologist, Surgeon)
    @Column(nullable = false)
    private String specialization;

    // Contact number of the doctor
    @Column(nullable = false)
    private String phoneNumber;

    // Professional email address
    private String email;

    // Many-to-One relationship: Multiple doctors can belong to one department
    @ManyToOne
    @JoinColumn(name = "department_id", referencedColumnName = "id")
    private Department department;
}