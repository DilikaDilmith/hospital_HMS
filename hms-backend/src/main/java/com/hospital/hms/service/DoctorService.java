package com.hospital.hms.service;

import com.hospital.hms.entity.Doctor;
import com.hospital.hms.repository.DoctorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class DoctorService {

    @Autowired
    private DoctorRepository doctorRepository;

    // Save a new doctor to the database
    @Transactional
    public Doctor saveDoctor(Doctor doctor) {
        return doctorRepository.save(doctor);
    }

    // Retrieve all doctors from the database
    public List<Doctor> getAllDoctors() {
        return doctorRepository.findAll();
    }

    // Retrieve single doctor by ID
    public Optional<Doctor> getDoctorById(Long id) {
        return doctorRepository.findById(id);
    }

    // Update doctor details, contact info, consultation fee, department and availability
    @Transactional
    public Doctor updateDoctor(Long id, Doctor doctorDetails) {
        Doctor existing = doctorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Doctor not found with ID: " + id));

        if (doctorDetails.getFirstName() != null && !doctorDetails.getFirstName().trim().isEmpty()) {
            existing.setFirstName(doctorDetails.getFirstName().trim());
        }
        if (doctorDetails.getLastName() != null && !doctorDetails.getLastName().trim().isEmpty()) {
            existing.setLastName(doctorDetails.getLastName().trim());
        }
        if (doctorDetails.getSpecialization() != null && !doctorDetails.getSpecialization().trim().isEmpty()) {
            existing.setSpecialization(doctorDetails.getSpecialization().trim());
        }
        if (doctorDetails.getPhoneNumber() != null && !doctorDetails.getPhoneNumber().trim().isEmpty()) {
            existing.setPhoneNumber(doctorDetails.getPhoneNumber().trim());
        }
        if (doctorDetails.getEmail() != null) {
            existing.setEmail(doctorDetails.getEmail().trim());
        }
        if (doctorDetails.getConsultationFee() != null && doctorDetails.getConsultationFee() > 0) {
            existing.setConsultationFee(doctorDetails.getConsultationFee());
        }
        if (doctorDetails.getDepartment() != null) {
            existing.setDepartment(doctorDetails.getDepartment());
        }

        // Doctor availability management
        if (doctorDetails.getAvailableDays() != null && !doctorDetails.getAvailableDays().trim().isEmpty()) {
            existing.setAvailableDays(doctorDetails.getAvailableDays().trim());
        }
        if (doctorDetails.getAvailableTimeStart() != null) {
            existing.setAvailableTimeStart(doctorDetails.getAvailableTimeStart());
        }
        if (doctorDetails.getAvailableTimeEnd() != null) {
            existing.setAvailableTimeEnd(doctorDetails.getAvailableTimeEnd());
        }

        return doctorRepository.save(existing);
    }
}