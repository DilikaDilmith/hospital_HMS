package com.hospital.hms;

import com.hospital.hms.entity.Appointment;
import com.hospital.hms.entity.AppointmentStatus;
import com.hospital.hms.entity.Doctor;
import com.hospital.hms.entity.Patient;
import com.hospital.hms.exception.AppointmentConflictException;
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
public class AppointmentReschedulingTest {

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
    private LocalDateTime originalSlot;
    private LocalDateTime newSlot;

    @BeforeEach
    void setUp() {
        originalSlot = LocalDateTime.now().plusDays(2).withHour(9).withMinute(0).withSecond(0).withNano(0);
        newSlot = LocalDateTime.now().plusDays(5).withHour(14).withMinute(30).withSecond(0).withNano(0);

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
        appointment.setAppointmentDateTime(originalSlot);
        appointment.setStatus(AppointmentStatus.SCHEDULED);
    }

    @Test
    @DisplayName("Task 3.1B: Successfully reschedule a SCHEDULED appointment to a new future slot")
    void testRescheduleScheduledAppointmentSuccess() {
        when(appointmentRepository.findById(101L)).thenReturn(Optional.of(appointment));
        when(appointmentRepository.existsByDoctorIdAndAppointmentDateTimeAndStatusNotAndIdNot(
                eq(10L), eq(newSlot), eq(AppointmentStatus.CANCELLED), eq(101L)))
                .thenReturn(false);
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(inv -> inv.getArgument(0));

        Appointment result = appointmentService.rescheduleAppointment(101L, newSlot);

        assertNotNull(result);
        assertEquals(newSlot, result.getAppointmentDateTime());
        assertEquals(AppointmentStatus.SCHEDULED, result.getStatus());
        verify(appointmentRepository, times(1)).save(appointment);
    }

    @Test
    @DisplayName("Task 3.1B: Successfully reschedule a CONFIRMED appointment")
    void testRescheduleConfirmedAppointmentSuccess() {
        appointment.setStatus(AppointmentStatus.CONFIRMED);
        when(appointmentRepository.findById(101L)).thenReturn(Optional.of(appointment));
        when(appointmentRepository.existsByDoctorIdAndAppointmentDateTimeAndStatusNotAndIdNot(
                eq(10L), eq(newSlot), eq(AppointmentStatus.CANCELLED), eq(101L)))
                .thenReturn(false);
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(inv -> inv.getArgument(0));

        Appointment result = appointmentService.rescheduleAppointment(101L, newSlot);

        assertNotNull(result);
        assertEquals(newSlot, result.getAppointmentDateTime());
        verify(appointmentRepository, times(1)).save(appointment);
    }

    @Test
    @DisplayName("Task 3.1B: Prevent rescheduling of an already COMPLETED appointment")
    void testPreventReschedulingCompletedAppointment() {
        appointment.setStatus(AppointmentStatus.COMPLETED);
        when(appointmentRepository.findById(101L)).thenReturn(Optional.of(appointment));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            appointmentService.rescheduleAppointment(101L, newSlot);
        });

        assertTrue(ex.getMessage().contains("already completed"));
        assertEquals(originalSlot, appointment.getAppointmentDateTime());
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Task 3.1B: Prevent rescheduling of a CANCELLED appointment")
    void testPreventReschedulingCancelledAppointment() {
        appointment.setStatus(AppointmentStatus.CANCELLED);
        when(appointmentRepository.findById(101L)).thenReturn(Optional.of(appointment));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            appointmentService.rescheduleAppointment(101L, newSlot);
        });

        assertTrue(ex.getMessage().contains("has been cancelled"));
        assertEquals(originalSlot, appointment.getAppointmentDateTime());
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Task 3.1B: Prevent rescheduling to a past date/time")
    void testPreventReschedulingToPastDate() {
        LocalDateTime pastSlot = LocalDateTime.now().minusHours(2);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            appointmentService.rescheduleAppointment(101L, pastSlot);
        });

        assertTrue(ex.getMessage().contains("must be in the future"));
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Task 3.1B: Prevent double-booking when doctor has another active appointment at target slot")
    void testPreventDoubleBookingOnReschedule() {
        when(appointmentRepository.findById(101L)).thenReturn(Optional.of(appointment));
        when(appointmentRepository.existsByDoctorIdAndAppointmentDateTimeAndStatusNotAndIdNot(
                eq(10L), eq(newSlot), eq(AppointmentStatus.CANCELLED), eq(101L)))
                .thenReturn(true);

        AppointmentConflictException ex = assertThrows(AppointmentConflictException.class, () -> {
            appointmentService.rescheduleAppointment(101L, newSlot);
        });

        assertTrue(ex.getMessage().contains("already has an appointment booked"));
        assertEquals(originalSlot, appointment.getAppointmentDateTime());
        verify(appointmentRepository, never()).save(any());
    }
}
