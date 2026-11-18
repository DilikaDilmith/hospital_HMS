package com.hospital.hms.service;

import com.hospital.hms.entity.Doctor;
import com.hospital.hms.entity.Role;
import com.hospital.hms.entity.User;
import com.hospital.hms.repository.AdmissionRepository;
import com.hospital.hms.repository.AppointmentRepository;
import com.hospital.hms.repository.DoctorRepository;
import com.hospital.hms.repository.LabTestRepository;
import com.hospital.hms.repository.MedicalRecordRepository;
import com.hospital.hms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class DoctorService {

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired(required = false)
    private AppointmentRepository appointmentRepository;

    @Autowired(required = false)
    private AdmissionRepository admissionRepository;

    @Autowired(required = false)
    private LabTestRepository labTestRepository;

    @Autowired(required = false)
    private MedicalRecordRepository medicalRecordRepository;

    @Autowired(required = false)
    private UserRepository userRepository;

    public void setDoctorRepository(DoctorRepository doctorRepository) {
        this.doctorRepository = doctorRepository;
    }

    public void setAppointmentRepository(AppointmentRepository appointmentRepository) {
        this.appointmentRepository = appointmentRepository;
    }

    public void setAdmissionRepository(AdmissionRepository admissionRepository) {
        this.admissionRepository = admissionRepository;
    }

    public void setLabTestRepository(LabTestRepository labTestRepository) {
        this.labTestRepository = labTestRepository;
    }

    public void setMedicalRecordRepository(MedicalRecordRepository medicalRecordRepository) {
        this.medicalRecordRepository = medicalRecordRepository;
    }

    public void setUserRepository(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

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

    // Delete doctor by ID (safely verifying no active appointments or clinical records)
    @Transactional
    public void deleteDoctor(Long id) {
        Doctor existing = doctorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Doctor not found with ID: " + id));

        // 1. Guard against deleting doctor with existing appointments
        if (appointmentRepository != null && appointmentRepository.countByDoctorId(id) > 0) {
            throw new IllegalStateException("Cannot delete doctor: Doctor has existing appointments. Please cancel or reassign appointments first.");
        }

        // 2. Guard against deleting doctor with active or historic admissions
        if (admissionRepository != null && admissionRepository.countByDoctorId(id) > 0) {
            throw new IllegalStateException("Cannot delete doctor: Doctor has assigned patient admissions.");
        }

        // 3. Guard against deleting doctor with lab test orders
        if (labTestRepository != null && labTestRepository.countByDoctorId(id) > 0) {
            throw new IllegalStateException("Cannot delete doctor: Doctor has associated laboratory test orders.");
        }

        // 4. Guard against deleting doctor with medical records
        if (medicalRecordRepository != null && medicalRecordRepository.countByDoctorId(id) > 0) {
            throw new IllegalStateException("Cannot delete doctor: Doctor has existing patient medical records.");
        }

        // 5. Clean up associated login User account if one was auto-created for this doctor
        if (userRepository != null) {
            if (existing.getEmail() != null && !existing.getEmail().trim().isEmpty()) {
                userRepository.findByUsername(existing.getEmail().trim().toLowerCase()).ifPresent(u -> {
                    if (u.getRole() == Role.DOCTOR) {
                        userRepository.delete(u);
                    }
                });
            }
            String altUsername = existing.getFirstName().trim().toLowerCase().replaceAll("[^a-z0-9]", "") + "123";
            userRepository.findByUsername(altUsername).ifPresent(u -> {
                if (u.getRole() == Role.DOCTOR) {
                    userRepository.delete(u);
                }
            });
        }

        // 6. Delete doctor profile
        doctorRepository.delete(existing);
    }

    // Find doctor entity corresponding to a logged-in username with robust fallback and auto-linking
    public Optional<Doctor> getDoctorByUsername(String username) {
        if (username == null || username.trim().isEmpty()) {
            return Optional.empty();
        }
        String cleanUsername = username.trim();

        // 1. Direct link by user.username
        Optional<Doctor> byUser = doctorRepository.findByUserUsername(cleanUsername);
        if (byUser.isPresent()) {
            return byUser;
        }

        // 2. Direct match by professional email
        Optional<Doctor> byEmail = doctorRepository.findByEmailIgnoreCase(cleanUsername);
        if (byEmail.isPresent()) {
            if (userRepository != null && byEmail.get().getUser() == null) {
                userRepository.findByUsername(cleanUsername).ifPresent(u -> {
                    byEmail.get().setUser(u);
                    doctorRepository.save(byEmail.get());
                });
            }
            return byEmail;
        }

        // 3. Match via linked User's full name (e.g. "Dr. Sunil Perera")
        if (userRepository != null) {
            User user = userRepository.findByUsername(cleanUsername).orElse(null);
            if (user != null && user.getFullName() != null) {
                String cleanName = user.getFullName().replaceFirst("(?i)^dr\\.?\\s+", "").trim();
                String[] parts = cleanName.split("\\s+", 2);
                if (parts.length >= 2) {
                    Optional<Doctor> byName = doctorRepository.findByFirstNameIgnoreCaseAndLastNameIgnoreCase(parts[0], parts[1]);
                    if (byName.isPresent()) {
                        byName.get().setUser(user);
                        doctorRepository.save(byName.get());
                        return byName;
                    }
                } else if (parts.length == 1) {
                    List<Doctor> match = doctorRepository.findAll().stream()
                            .filter(d -> d.getFirstName().equalsIgnoreCase(parts[0]))
                            .toList();
                    if (match.size() == 1) {
                        Doctor d = match.get(0);
                        d.setUser(user);
                        doctorRepository.save(d);
                        return Optional.of(d);
                    }
                }
            }
        }

        // 4. Match by username containing first name (e.g. "doc@gmail.com" or "sunil123")
        List<Doctor> all = doctorRepository.findAll();
        for (Doctor d : all) {
            String f = d.getFirstName() != null ? d.getFirstName().toLowerCase().replaceAll("[^a-z0-9]", "") : "";
            if (!f.isEmpty() && cleanUsername.toLowerCase().contains(f)) {
                if (userRepository != null && d.getUser() == null) {
                    userRepository.findByUsername(cleanUsername).ifPresent(u -> {
                        d.setUser(u);
                        doctorRepository.save(d);
                    });
                }
                return Optional.of(d);
            }
        }

        return Optional.empty();
    }
}