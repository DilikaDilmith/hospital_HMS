package com.hospital.hms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "employees")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Link each Employee record to a registered system User
    @OneToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id", nullable = false, unique = true)
    private User user;

    // Professional designation (e.g. Senior Medical Officer, Head Nurse, Pharmacist)
    @Column(nullable = false)
    private String designation;

    // Department name (e.g. Cardiology, Emergency, Inpatient, Pharmacy, Laboratory)
    @Column(nullable = false)
    private String department;

    // Direct contact phone number
    private String contactNumber;

    // Employment start date
    private LocalDate joinedDate = LocalDate.now();

    // Basic monthly salary
    private Double salary = 50000.0;

    // Employment status: ACTIVE, ON_LEAVE, RESIGNED
    @Column(nullable = false)
    private String status = "ACTIVE";
}
