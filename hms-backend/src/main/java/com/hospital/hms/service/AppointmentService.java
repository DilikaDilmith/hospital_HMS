package com.hospital.hms.service;

import com.hospital.hms.entity.Appointment;
import com.hospital.hms.entity.AppointmentStatus;
import com.hospital.hms.entity.Doctor;
import com.hospital.hms.entity.Patient;
import com.hospital.hms.exception.AppointmentConflictException;
import com.hospital.hms.repository.AppointmentRepository;
import com.hospital.hms.repository.DoctorRepository;
import com.hospital.hms.repository.PatientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class AppointmentService {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private InvoiceService invoiceService;

    // Validate that the doctor does not already have an active (non-cancelled) appointment at the requested date and time
    public void validateNoDoctorConflict(Long doctorId, LocalDateTime dateTime, Long currentAppointmentId) {
        boolean conflict;
        if (currentAppointmentId != null) {
            conflict = appointmentRepository.existsByDoctorIdAndAppointmentDateTimeAndStatusNotAndIdNot(
                    doctorId, dateTime, AppointmentStatus.CANCELLED, currentAppointmentId);
        } else {
            conflict = appointmentRepository.existsByDoctorIdAndAppointmentDateTimeAndStatusNot(
                    doctorId, dateTime, AppointmentStatus.CANCELLED);
        }

        if (conflict) {
            throw new AppointmentConflictException(
                    "The selected doctor already has an appointment booked at this date and time. Please choose another time slot.");
        }
    }

    // Save a new appointment (Staff booking): defaulted to SCHEDULED and validated
    @Transactional
    public Appointment bookAppointment(Appointment appointment) {
        appointment.setStatus(AppointmentStatus.SCHEDULED);

        if (appointment.getAppointmentDateTime() == null) {
            throw new IllegalArgumentException("Appointment date and time is required.");
        }
        if (appointment.getAppointmentDateTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Appointment date and time must be in the future.");
        }

        if (appointment.getDoctor() == null || appointment.getDoctor().getId() == null) {
            throw new IllegalArgumentException("A valid doctor must be selected.");
        }

        Doctor doctor = doctorRepository.findById(appointment.getDoctor().getId())
                .orElseThrow(() -> new RuntimeException("Doctor not found with ID: " + appointment.getDoctor().getId()));
        appointment.setDoctor(doctor);

        if (appointment.getPatient() != null && appointment.getPatient().getId() != null) {
            Patient patient = patientRepository.findById(appointment.getPatient().getId())
                    .orElseThrow(() -> new RuntimeException("Patient not found with ID: " + appointment.getPatient().getId()));
            appointment.setPatient(patient);
        }

        // Prevent double booking for the same doctor at the same date and time (excluding CANCELLED)
        validateNoDoctorConflict(doctor.getId(), appointment.getAppointmentDateTime(), appointment.getId());

        return appointmentRepository.save(appointment);
    }

    // Save a new appointment directly for the authenticated patient user (prevents identity spoofing)
    @Transactional
    public Appointment bookAppointmentForUser(Appointment appointment, String username) {
        Patient patient = patientRepository.findByUserUsername(username)
                .orElseThrow(() -> new RuntimeException("No patient profile found for user: " + username + ". Please ensure your patient profile exists."));

        if (appointment.getAppointmentDateTime() == null) {
            throw new IllegalArgumentException("Appointment date and time is required.");
        }
        if (appointment.getAppointmentDateTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Appointment date and time must be in the future.");
        }

        if (appointment.getDoctor() == null || appointment.getDoctor().getId() == null) {
            throw new IllegalArgumentException("A valid doctor must be selected.");
        }
        Doctor doctor = doctorRepository.findById(appointment.getDoctor().getId())
                .orElseThrow(() -> new RuntimeException("Doctor not found with ID: " + appointment.getDoctor().getId()));

        appointment.setPatient(patient);
        appointment.setDoctor(doctor);
        appointment.setStatus(AppointmentStatus.SCHEDULED); // Enforce server-side default

        // Prevent double booking for the same doctor at the same date and time (excluding CANCELLED)
        validateNoDoctorConflict(doctor.getId(), appointment.getAppointmentDateTime(), appointment.getId());

        return appointmentRepository.save(appointment);
    }

    // Retrieve appointments for a specific patient by username
    public List<Appointment> getAppointmentsByPatientUsername(String username) {
        return appointmentRepository.findByPatientUserUsernameOrderByAppointmentDateTimeDesc(username);
    }

    // Retrieve all appointments from the database
    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAll();
    }

    // Retrieve an appointment by ID
    public Optional<Appointment> getAppointmentById(Long id) {
        return appointmentRepository.findById(id);
    }

    // Retrieve appointments for a specific patient
    public List<Appointment> getAppointmentsByPatientId(Long patientId) {
        return appointmentRepository.findByPatientId(patientId);
    }

    // Retrieve appointments for a specific doctor
    public List<Appointment> getAppointmentsByDoctorId(Long doctorId) {
        return appointmentRepository.findByDoctorId(doctorId);
    }

    // Change appointment status to CHECKED_IN
    @Transactional
    public Appointment checkInAppointment(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found with ID: " + appointmentId));
        appointment.setStatus(AppointmentStatus.CHECKED_IN);
        return appointmentRepository.save(appointment);
    }

    // Complete appointment and automatically trigger Doctor's consultation fee billing
    @Transactional
    public Appointment completeAppointment(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found with ID: " + appointmentId));

        appointment.setStatus(AppointmentStatus.COMPLETED);
        Appointment saved = appointmentRepository.save(appointment);

        // Billing Logic: When an appointment is marked 'COMPLETED', automatically create an InvoiceItem
        // for the Doctor's Consultation Fee and attach it to the patient's active Invoice.
        if (saved.getPatient() != null && saved.getDoctor() != null) {
            try {
                invoiceService.addConsultationFee(saved.getPatient(), saved.getDoctor());
            } catch (Exception e) {
                System.err.println("⚠️ Warning: Could not auto-generate consultation fee: " + e.getMessage());
            }
        }

        return saved;
    }

    // Update appointment status to any of the 7 states
    @Transactional
    public Appointment updateAppointmentStatus(Long id, AppointmentStatus status) {
        if (status == AppointmentStatus.COMPLETED) {
            return completeAppointment(id);
        } else if (status == AppointmentStatus.CHECKED_IN) {
            return checkInAppointment(id);
        }

        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found with ID: " + id));
        appointment.setStatus(status);
        return appointmentRepository.save(appointment);
    }
}
