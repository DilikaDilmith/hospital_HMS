package com.hospital.hms.service;

import com.hospital.hms.entity.Patient;
import com.hospital.hms.entity.User;
import com.hospital.hms.repository.PatientRepository;
import com.hospital.hms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class PatientService {

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private UserRepository userRepository;

    // Register a new patient in the system
    @Transactional
    public Patient registerPatient(Patient patient) {
        // Validate names
        if (patient.getFirstName() == null || patient.getFirstName().trim().isEmpty()) {
            throw new IllegalArgumentException("First name is required.");
        }
        if (patient.getLastName() == null || patient.getLastName().trim().isEmpty()) {
            throw new IllegalArgumentException("Last name is required.");
        }
        patient.setFirstName(patient.getFirstName().trim());
        patient.setLastName(patient.getLastName().trim());

        // Validate Date of Birth and Age
        if (patient.getDateOfBirth() != null) {
            if (patient.getDateOfBirth().isAfter(LocalDate.now())) {
                throw new IllegalArgumentException("Date of birth cannot be in the future.");
            }
            int calculatedAge = java.time.Period.between(patient.getDateOfBirth(), LocalDate.now()).getYears();
            if (calculatedAge > 130) {
                throw new IllegalArgumentException("Date of birth indicates an age over 130 years. Please check the birth year.");
            }
            patient.setAge(calculatedAge);
        } else if (patient.getAge() != null) {
            if (patient.getAge() < 0 || patient.getAge() > 130) {
                throw new IllegalArgumentException("Patient age must be between 0 and 130 years.");
            }
            patient.setDateOfBirth(LocalDate.now().minusYears(patient.getAge()).withMonth(1).withDayOfMonth(1));
        }

        // Validate Phone Number
        if (patient.getPhoneNumber() != null && !patient.getPhoneNumber().trim().isEmpty()) {
            patient.setPhoneNumber(patient.getPhoneNumber().trim());
        }

        // Validate Gender
        if (patient.getGender() != null && !patient.getGender().trim().isEmpty()) {
            patient.setGender(patient.getGender().trim());
        } else {
            patient.setGender("Other");
        }

        // Address
        if (patient.getAddress() != null) {
            patient.setAddress(patient.getAddress().trim());
        }

        // Sanitize and validate NIC uniqueness (optional - some patients don't have NIC)
        if (patient.getNic() != null && !patient.getNic().trim().isEmpty()) {
            String cleanNic = patient.getNic().trim();
            if (patientRepository.existsByNic(cleanNic)) {
                throw new IllegalArgumentException("A patient with NIC '" + cleanNic + "' is already registered in the system.");
            }
            patient.setNic(cleanNic);
        } else {
            patient.setNic(null); // CRUCIAL: must be null so multiple patients without NIC do not violate unique key
        }

        // Link existing user if provided
        if (patient.getUser() != null && patient.getUser().getId() != null) {
            userRepository.findById(patient.getUser().getId())
                    .ifPresent(patient::setUser);
        }

        return patientRepository.save(patient);
    }

    // Automatically create a linked Patient record for a newly registered User with PATIENT role
    @Transactional
    public Patient createPatientForUser(User user) {
        // If patient already exists for this user, return it
        Optional<Patient> existing = patientRepository.findByUser(user);
        if (existing.isPresent()) {
            return existing.get();
        }

        Patient patient = new Patient();
        patient.setUser(user);

        // Derive first and last name from user's full name
        String fullName = (user.getFullName() != null && !user.getFullName().trim().isEmpty())
                ? user.getFullName().trim()
                : user.getUsername();
        String[] parts = fullName.split("\\s+", 2);
        patient.setFirstName(parts[0]);
        patient.setLastName(parts.length > 1 ? parts[1] : "Patient");

        // Safe initial defaults
        patient.setPhoneNumber("");
        patient.setGender("Not Specified");
        patient.setDateOfBirth(LocalDate.of(2000, 1, 1));
        patient.setAddress("");

        return patientRepository.save(patient);
    }

    // Retrieve a list of all registered patients
    public List<Patient> getAllPatients() {
        return patientRepository.findAll();
    }

    // Retrieve a single patient by ID
    public Optional<Patient> getPatientById(Long id) {
        return patientRepository.findById(id);
    }

    // Retrieve a patient by linked username
    public Optional<Patient> getPatientByUsername(String username) {
        return patientRepository.findByUserUsername(username);
    }

    // Retrieve a patient by linked user ID
    public Optional<Patient> getPatientByUserId(Long userId) {
        return patientRepository.findByUserId(userId);
    }

    // Update patient profile for the currently logged-in user
    @Transactional
    public Patient updatePatientByUsername(String username, Patient updatedData) {
        Patient patient = patientRepository.findByUserUsername(username)
                .orElseGet(() -> {
                    // If not found, create one for the user
                    User user = userRepository.findByUsername(username)
                            .orElseThrow(() -> new RuntimeException("User not found with username: " + username));
                    return createPatientForUser(user);
                });

        if (updatedData.getFirstName() != null && !updatedData.getFirstName().trim().isEmpty()) {
            patient.setFirstName(updatedData.getFirstName().trim());
        }
        if (updatedData.getLastName() != null && !updatedData.getLastName().trim().isEmpty()) {
            patient.setLastName(updatedData.getLastName().trim());
        }
        if (updatedData.getNic() != null) {
            String cleanNic = updatedData.getNic().trim();
            if (!cleanNic.isEmpty()) {
                if (patient.getId() != null && patientRepository.existsByNicAndIdNot(cleanNic, patient.getId())) {
                    throw new IllegalArgumentException("A patient with NIC '" + cleanNic + "' is already registered in the system.");
                }
                patient.setNic(cleanNic);
            } else {
                patient.setNic(null);
            }
        }
        if (updatedData.getDateOfBirth() != null) {
            if (updatedData.getDateOfBirth().isAfter(LocalDate.now())) {
                throw new IllegalArgumentException("Date of birth cannot be in the future.");
            }
            patient.setDateOfBirth(updatedData.getDateOfBirth());
            patient.setAge(java.time.Period.between(updatedData.getDateOfBirth(), LocalDate.now()).getYears());
        } else if (updatedData.getAge() != null) {
            if (updatedData.getAge() < 0 || updatedData.getAge() > 130) {
                throw new IllegalArgumentException("Patient age must be between 0 and 130 years.");
            }
            patient.setAge(updatedData.getAge());
            patient.setDateOfBirth(LocalDate.now().minusYears(updatedData.getAge()).withMonth(1).withDayOfMonth(1));
        }
        if (updatedData.getGender() != null) {
            patient.setGender(updatedData.getGender());
        }
        if (updatedData.getPhoneNumber() != null) {
            patient.setPhoneNumber(updatedData.getPhoneNumber().trim());
        }
        if (updatedData.getAddress() != null) {
            patient.setAddress(updatedData.getAddress().trim());
        }

        return patientRepository.save(patient);
    }

    // Update patient by ID (Admin / Receptionist)
    @Transactional
    public Patient updatePatient(Long id, Patient updatedData) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Patient not found with ID: " + id));

        if (updatedData.getFirstName() != null) patient.setFirstName(updatedData.getFirstName().trim());
        if (updatedData.getLastName() != null) patient.setLastName(updatedData.getLastName().trim());
        if (updatedData.getNic() != null) {
            String cleanNic = updatedData.getNic().trim();
            if (!cleanNic.isEmpty()) {
                if (patient.getId() != null && patientRepository.existsByNicAndIdNot(cleanNic, patient.getId())) {
                    throw new IllegalArgumentException("A patient with NIC '" + cleanNic + "' is already registered in the system.");
                }
                patient.setNic(cleanNic);
            } else {
                patient.setNic(null);
            }
        }
        if (updatedData.getDateOfBirth() != null) {
            if (updatedData.getDateOfBirth().isAfter(LocalDate.now())) {
                throw new IllegalArgumentException("Date of birth cannot be in the future.");
            }
            patient.setDateOfBirth(updatedData.getDateOfBirth());
            patient.setAge(java.time.Period.between(updatedData.getDateOfBirth(), LocalDate.now()).getYears());
        } else if (updatedData.getAge() != null) {
            if (updatedData.getAge() < 0 || updatedData.getAge() > 130) {
                throw new IllegalArgumentException("Patient age must be between 0 and 130 years.");
            }
            patient.setAge(updatedData.getAge());
            patient.setDateOfBirth(LocalDate.now().minusYears(updatedData.getAge()).withMonth(1).withDayOfMonth(1));
        }
        if (updatedData.getGender() != null) patient.setGender(updatedData.getGender());
        if (updatedData.getPhoneNumber() != null) patient.setPhoneNumber(updatedData.getPhoneNumber().trim());
        if (updatedData.getAddress() != null) patient.setAddress(updatedData.getAddress().trim());

        return patientRepository.save(patient);
    }
}
