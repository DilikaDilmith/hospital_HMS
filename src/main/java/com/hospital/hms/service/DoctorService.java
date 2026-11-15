package com.hospital.hms.service;

import com.hospital.hms.entity.Doctor;
import com.hospital.hms.repository.DoctorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DoctorService {

    @Autowired
    private DoctorRepository doctorRepository;

    // Save a new doctor to the database
    public Doctor saveDoctor(Doctor doctor) {
        return doctorRepository.save(doctor);
    }

    // Retrieve all doctors from the database
    public List<Doctor> getAllDoctors() {
        return doctorRepository.findAll();
    }
}