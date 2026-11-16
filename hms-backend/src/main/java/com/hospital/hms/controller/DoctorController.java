package com.hospital.hms.controller;

import com.hospital.hms.entity.Doctor;
import com.hospital.hms.entity.Role;
import com.hospital.hms.entity.User;
import com.hospital.hms.repository.UserRepository;
import com.hospital.hms.service.DoctorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/doctors")
public class DoctorController {

    @Autowired
    private DoctorService doctorService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public Doctor createDoctor(@RequestBody Doctor doctor) {
        
        // 1. Save the doctor profile first
        Doctor savedDoctor = doctorService.saveDoctor(doctor);

        // 2. Automatically create a User account for this doctor so they can log in
        // We use the doctor's email prefix or a generic name as the username
        String username = savedDoctor.getFirstName().toLowerCase() + "123"; // e.g., kamal123
        
        if (userRepository.findByUsername(username).isEmpty()) {
            User doctorUser = new User();
            doctorUser.setUsername(username);
            doctorUser.setPassword(passwordEncoder.encode("doctor123")); // Default password
            doctorUser.setFullName("Dr. " + savedDoctor.getFirstName() + " " + savedDoctor.getLastName());
            doctorUser.setRole(Role.DOCTOR);
            
            userRepository.save(doctorUser);
            System.out.println("✅ Created login account for Doctor: " + username);
        }

        return savedDoctor;
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'DOCTOR', 'RECEPTIONIST', 'ROLE_ADMIN', 'ROLE_DOCTOR', 'ROLE_RECEPTIONIST')")
    public List<Doctor> getAllDoctors() {
        return doctorService.getAllDoctors();
    }
}