package com.hospital.hms.service;

import com.hospital.hms.entity.Appointment;
import com.hospital.hms.repository.AppointmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AppointmentService {

    @Autowired
    private AppointmentRepository appointmentRepository;

    // Save a new appointment to the database
    public Appointment bookAppointment(Appointment appointment) {
        return appointmentRepository.save(appointment);
    }

    // Retrieve all appointments from the database
    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAll();
    }
}