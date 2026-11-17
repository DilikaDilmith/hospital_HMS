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

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
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

    // Validate that the requested appointment date and time falls within the doctor's available working days and hours
    public void validateDoctorAvailability(Doctor doctor, LocalDateTime appointmentDateTime) {
        if (doctor == null || appointmentDateTime == null) {
            return;
        }

        // 1. Check Working Days
        String availableDays = doctor.getAvailableDays();
        if (availableDays != null && !availableDays.trim().isEmpty()) {
            DayOfWeek apptDay = appointmentDateTime.getDayOfWeek();
            String dayName = apptDay.name(); // e.g. "MONDAY"

            boolean dayMatches = Arrays.stream(availableDays.split(","))
                    .map(String::trim)
                    .anyMatch(d -> d.equalsIgnoreCase(dayName) || d.equalsIgnoreCase(dayName.substring(0, Math.min(3, dayName.length()))));

            if (!dayMatches) {
                throw new AppointmentConflictException(
                        "Dr. " + doctor.getFirstName() + " " + doctor.getLastName() + 
                        " is not available on " + dayName + "s. Available working days: " + availableDays);
            }
        }

        // 2. Check Available Time Range
        LocalTime apptTime = appointmentDateTime.toLocalTime();
        LocalTime start = doctor.getAvailableTimeStart();
        LocalTime end = doctor.getAvailableTimeEnd();

        if (start != null && end != null) {
            if (apptTime.isBefore(start) || apptTime.isAfter(end)) {
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm");
                throw new AppointmentConflictException(
                        "Selected appointment time (" + apptTime.format(formatter) + 
                        ") is outside Dr. " + doctor.getFirstName() + " " + doctor.getLastName() + 
                        "'s available hours (" + start.format(formatter) + " - " + end.format(formatter) + ").");
            }
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

        // Validate doctor working days and hours
        validateDoctorAvailability(doctor, appointment.getAppointmentDateTime());

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

        // Validate doctor working days and hours
        validateDoctorAvailability(doctor, appointment.getAppointmentDateTime());

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

        if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new IllegalStateException("Cannot check in appointment #" + appointmentId + " because it is already completed.");
        }
        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new IllegalStateException("Cannot check in cancelled appointment #" + appointmentId + ".");
        }

        appointment.setStatus(AppointmentStatus.CHECKED_IN);
        return appointmentRepository.save(appointment);
    }

    // Complete appointment and automatically trigger Doctor's consultation fee billing in one atomic transaction
    @Transactional
    public Appointment completeAppointment(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found with ID: " + appointmentId));

        // 1. Prevent duplicate completion requests
        if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new IllegalStateException("Appointment #" + appointmentId + " has already been completed.");
        }

        // 2. Prevent completing cancelled appointments
        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new IllegalStateException("Cannot complete cancelled appointment #" + appointmentId + ".");
        }

        if (appointment.getPatient() == null) {
            throw new IllegalStateException("Cannot complete appointment without a linked patient.");
        }
        if (appointment.getDoctor() == null) {
            throw new IllegalStateException("Cannot complete appointment without a linked doctor.");
        }

        // 3. Update appointment status to COMPLETED
        appointment.setStatus(AppointmentStatus.COMPLETED);

        // 4. Atomic billing: generate consultation fee within the same transaction if not already billed
        if (!Boolean.TRUE.equals(appointment.getIsBilled())) {
            invoiceService.addConsultationFee(appointment);
            appointment.setIsBilled(true);
        }

        return appointmentRepository.save(appointment);
    }

    // Cancel an appointment: allow scheduled or confirmed appointments to be cancelled, prevent completed
    @Transactional
    public Appointment cancelAppointment(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found with ID: " + appointmentId));

        if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new IllegalStateException("Cannot cancel appointment #" + appointmentId + " because it is already completed.");
        }
        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new IllegalStateException("Appointment #" + appointmentId + " is already cancelled.");
        }
        if (appointment.getStatus() != AppointmentStatus.SCHEDULED 
                && appointment.getStatus() != AppointmentStatus.CONFIRMED
                && appointment.getStatus() != AppointmentStatus.CHECKED_IN) {
            throw new IllegalStateException("Cannot cancel appointment #" + appointmentId + " with status: " + appointment.getStatus());
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);
        return appointmentRepository.save(appointment);
    }

    // Reschedule an appointment: allow scheduled or confirmed appointments to be updated to a new future time slot
    @Transactional
    public Appointment rescheduleAppointment(Long appointmentId, LocalDateTime newDateTime) {
        if (newDateTime == null) {
            throw new IllegalArgumentException("New appointment date and time is required.");
        }
        if (newDateTime.isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Rescheduled appointment date and time must be in the future.");
        }

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found with ID: " + appointmentId));

        if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new IllegalStateException("Cannot reschedule appointment #" + appointmentId + " because it is already completed.");
        }
        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new IllegalStateException("Cannot reschedule appointment #" + appointmentId + " because it has been cancelled.");
        }
        if (appointment.getStatus() != AppointmentStatus.SCHEDULED && appointment.getStatus() != AppointmentStatus.CONFIRMED) {
            throw new IllegalStateException("Cannot reschedule appointment #" + appointmentId + " with status: " + appointment.getStatus());
        }

        if (appointment.getDoctor() == null || appointment.getDoctor().getId() == null) {
            throw new IllegalStateException("Cannot reschedule appointment without an assigned doctor.");
        }

        // Validate doctor working days and hours
        validateDoctorAvailability(appointment.getDoctor(), newDateTime);

        // Prevent double booking for the same doctor at the new time slot (excluding this appointment and cancelled)
        validateNoDoctorConflict(appointment.getDoctor().getId(), newDateTime, appointmentId);

        appointment.setAppointmentDateTime(newDateTime);
        appointment.setStatus(AppointmentStatus.SCHEDULED);

        return appointmentRepository.save(appointment);
    }

    // Update appointment status to any of the 7 states
    @Transactional
    public Appointment updateAppointmentStatus(Long id, AppointmentStatus status) {
        if (status == AppointmentStatus.COMPLETED) {
            return completeAppointment(id);
        } else if (status == AppointmentStatus.CHECKED_IN) {
            return checkInAppointment(id);
        } else if (status == AppointmentStatus.CANCELLED) {
            return cancelAppointment(id);
        }

        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found with ID: " + id));

        if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new IllegalStateException("Cannot modify appointment #" + id + " because it has already been completed.");
        }
        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new IllegalStateException("Cannot modify cancelled appointment #" + id + ".");
        }

        appointment.setStatus(status);
        return appointmentRepository.save(appointment);
    }
}
