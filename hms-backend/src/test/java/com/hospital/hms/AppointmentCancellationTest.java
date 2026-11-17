package com.hospital.hms;

import com.hospital.hms.entity.Appointment;
import com.hospital.hms.entity.AppointmentStatus;
import com.hospital.hms.entity.Doctor;
import com.hospital.hms.entity.Patient;
import com.hospital.hms.repository.AppointmentRepository;
import com.hospital.hms.repository.DoctorRepository;
import com.hospital.hms.repository.PatientRepository;
import com.hospital.hms.service.AppointmentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AppointmentCancellationTest {

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private DoctorRepository doctorRepository;

    @InjectMocks
    private AppointmentService appointmentService;

    private Appointment appointment;
    private Doctor doctor;
    private Patient patient;
    private LocalDateTime futureSlot;

    @BeforeEach
    void setUp() {
        futureSlot = LocalDateTime.now().plusDays(2).withHour(10).withMinute(0).withSecond(0).withNano(0);

        doctor = new Doctor();
        doctor.setId(10L);
        doctor.setFirstName("Sunil");
        doctor.setLastName("Silva");

        patient = new Patient();
        patient.setId(20L);
        patient.setFirstName("Kamal");
        patient.setLastName("Perera");

        appointment = new Appointment();
        appointment.setId(101L);
        appointment.setDoctor(doctor);
        appointment.setPatient(patient);
        appointment.setAppointmentDateTime(futureSlot);
        appointment.setStatus(AppointmentStatus.SCHEDULED);
    }

    @Test
    @DisplayName("Task 3.1A: Successfully cancel a SCHEDULED appointment")
    void testCancelScheduledAppointmentSuccess() {
        when(appointmentRepository.findById(101L)).thenReturn(Optional.of(appointment));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(inv -> inv.getArgument(0));

        Appointment result = appointmentService.cancelAppointment(101L);

        assertNotNull(result);
        assertEquals(AppointmentStatus.CANCELLED, result.getStatus());
        verify(appointmentRepository, times(1)).save(appointment);
    }

    @Test
    @DisplayName("Task 3.1A: Successfully cancel a CONFIRMED appointment")
    void testCancelConfirmedAppointmentSuccess() {
        appointment.setStatus(AppointmentStatus.CONFIRMED);
        when(appointmentRepository.findById(101L)).thenReturn(Optional.of(appointment));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(inv -> inv.getArgument(0));

        Appointment result = appointmentService.cancelAppointment(101L);

        assertEquals(AppointmentStatus.CANCELLED, result.getStatus());
        verify(appointmentRepository, times(1)).save(appointment);
    }

    @Test
    @DisplayName("Task 3.1A: Prevent cancellation of an already COMPLETED appointment")
    void testPreventCancellationOfCompletedAppointment() {
        appointment.setStatus(AppointmentStatus.COMPLETED);
        when(appointmentRepository.findById(101L)).thenReturn(Optional.of(appointment));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            appointmentService.cancelAppointment(101L);
        });

        assertTrue(ex.getMessage().contains("already completed"));
        assertEquals(AppointmentStatus.COMPLETED, appointment.getStatus());
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Task 3.1A: Prevent repeated cancellation of an already CANCELLED appointment")
    void testPreventRepeatedCancellation() {
        appointment.setStatus(AppointmentStatus.CANCELLED);
        when(appointmentRepository.findById(101L)).thenReturn(Optional.of(appointment));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            appointmentService.cancelAppointment(101L);
        });

        assertTrue(ex.getMessage().contains("already cancelled"));
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Task 3.1A: Prevent cancellation of unsupported appointment status (e.g. NO_SHOW)")
    void testPreventCancellationOfUnsupportedStatus() {
        appointment.setStatus(AppointmentStatus.NO_SHOW);
        when(appointmentRepository.findById(101L)).thenReturn(Optional.of(appointment));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            appointmentService.cancelAppointment(101L);
        });

        assertTrue(ex.getMessage().contains("Cannot cancel appointment"));
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Task 3.1A: Ensure cancelled appointment slot can be booked again without conflict")
    void testCancelledSlotCanBeBookedAgain() {
        // Exists check returns false because existing appointment has status CANCELLED
        when(appointmentRepository.existsByDoctorIdAndAppointmentDateTimeAndStatusNot(
                eq(10L), eq(futureSlot), eq(AppointmentStatus.CANCELLED)))
                .thenReturn(false);

        Patient newPatient = new Patient();
        newPatient.setId(30L);
        newPatient.setFirstName("Nimal");
        newPatient.setLastName("Fernando");

        when(doctorRepository.findById(10L)).thenReturn(Optional.of(doctor));
        when(patientRepository.findById(30L)).thenReturn(Optional.of(newPatient));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(inv -> inv.getArgument(0));

        Appointment newBooking = new Appointment();
        newBooking.setDoctor(doctor);
        newBooking.setPatient(newPatient);
        newBooking.setAppointmentDateTime(futureSlot);
        newBooking.setReason("Rebooking previously cancelled slot");

        Appointment booked = appointmentService.bookAppointment(newBooking);

        assertNotNull(booked);
        assertEquals(AppointmentStatus.SCHEDULED, booked.getStatus());
        assertEquals(doctor, booked.getDoctor());
        assertEquals(newPatient, booked.getPatient());
        verify(appointmentRepository, times(1)).save(newBooking);
    }
}
