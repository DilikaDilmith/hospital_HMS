package com.hospital.hms.service;

import com.hospital.hms.entity.Appointment;
import com.hospital.hms.entity.AppointmentStatus;
import com.hospital.hms.repository.AppointmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class AppointmentService {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private InvoiceService invoiceService;

    // Save a new appointment: Receptionist / Patient creates it, defaulted to SCHEDULED
    @Transactional
    public Appointment bookAppointment(Appointment appointment) {
        if (appointment.getStatus() == null) {
            appointment.setStatus(AppointmentStatus.SCHEDULED);
        }
        return appointmentRepository.save(appointment);
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
