package com.hospital.hms.service;

import com.hospital.hms.entity.Patient;
import com.hospital.hms.repository.PatientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PatientService {

    @Autowired
    private PatientRepository patientRepository;

    // Register a new patient in the system
    public Patient registerPatient(Patient patient) {
        // Sanitize NIC: if empty or only whitespace, set to null to avoid unique constraint violations in DB
        if (patient.getNic() != null && patient.getNic().trim().isEmpty()) {
            patient.setNic(null);
        } else if (patient.getNic() != null) {
            patient.setNic(patient.getNic().trim());
        }
        return patientRepository.save(patient);
    }

    // Retrieve a list of all registered patients
    public List<Patient> getAllPatients() {
        return patientRepository.findAll();
    }
}