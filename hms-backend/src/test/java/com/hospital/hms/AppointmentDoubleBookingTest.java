package com.hospital.hms;

import com.hospital.hms.entity.*;
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
public class AppointmentDoubleBookingTest {

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private DoctorRepository doctorRepository;

    @InjectMocks
    private AppointmentService appointmentService;

    private Doctor doctor1;
    private Doctor doctor2;
    private Patient patient1;
    private Patient patient2;
    private LocalDateTime futureSlot;

    @BeforeEach
    void setUp() {
        doctor1 = new Doctor();
        doctor1.setId(1L);
        doctor1.setFirstName("John");
        doctor1.setLastName("Watson");

        doctor2 = new Doctor();
        doctor2.setId(2L);
        doctor2.setFirstName("Sarah");
        doctor2.setLastName("Connor");

        patient1 = new Patient();
        patient1.setId(10L);
        patient1.setFirstName("Alice");

        patient2 = new Patient();
        patient2.setId(20L);
        patient2.setFirstName("Bob");

        futureSlot = LocalDateTime.now().plusDays(2).withHour(10).withMinute(0).withSecond(0).withNano(0);
    }

    @Test
    @DisplayName("Task 2.1: Prevent booking two active appointments for the same doctor at the same time")
    void testPreventDoubleBookingSameDoctorSameTime() {
        Appointment newAppointment = new Appointment();
        newAppointment.setDoctor(doctor1);
        newAppointment.setPatient(patient1);
        newAppointment.setAppointmentDateTime(futureSlot);
        newAppointment.setReason("General Checkup");

        when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor1));
        when(patientRepository.findById(10L)).thenReturn(Optional.of(patient1));

        // Active appointment already exists for doctor1 at futureSlot
        when(appointmentRepository.existsByDoctorIdAndAppointmentDateTimeAndStatusNot(
                eq(1L), eq(futureSlot), eq(AppointmentStatus.CANCELLED)))
                .thenReturn(true);

        AppointmentConflictException ex = assertThrows(AppointmentConflictException.class, () -> {
            appointmentService.bookAppointment(newAppointment);
        });

        assertTrue(ex.getMessage().contains("already has an appointment booked at this date and time"));
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Task 2.1: Allow different doctors to have appointments at the same time")
    void testAllowDifferentDoctorsSameTime() {
        // Doctor 2 appointment at the same slot
        Appointment doctor2Appointment = new Appointment();
        doctor2Appointment.setDoctor(doctor2);
        doctor2Appointment.setPatient(patient2);
        doctor2Appointment.setAppointmentDateTime(futureSlot);
        doctor2Appointment.setReason("Eye Examination");

        when(doctorRepository.findById(2L)).thenReturn(Optional.of(doctor2));
        when(patientRepository.findById(20L)).thenReturn(Optional.of(patient2));

        // No conflict for doctor 2 at this slot
        when(appointmentRepository.existsByDoctorIdAndAppointmentDateTimeAndStatusNot(
                eq(2L), eq(futureSlot), eq(AppointmentStatus.CANCELLED)))
                .thenReturn(false);

        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Appointment saved = appointmentService.bookAppointment(doctor2Appointment);

        assertNotNull(saved);
        assertEquals(doctor2, saved.getDoctor());
        assertEquals(AppointmentStatus.SCHEDULED, saved.getStatus());
        verify(appointmentRepository, times(1)).save(doctor2Appointment);
    }

    @Test
    @DisplayName("Task 2.1: Allow cancelled appointment slots to be booked again")
    void testAllowCancelledSlotToBeBookedAgain() {
        Appointment newBooking = new Appointment();
        newBooking.setDoctor(doctor1);
        newBooking.setPatient(patient2);
        newBooking.setAppointmentDateTime(futureSlot);
        newBooking.setReason("Follow-up visit");

        when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor1));
        when(patientRepository.findById(20L)).thenReturn(Optional.of(patient2));

        // The only prior appointment was CANCELLED, so existsBy...StatusNot(CANCELLED) returns false
        when(appointmentRepository.existsByDoctorIdAndAppointmentDateTimeAndStatusNot(
                eq(1L), eq(futureSlot), eq(AppointmentStatus.CANCELLED)))
                .thenReturn(false);

        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Appointment booked = appointmentService.bookAppointment(newBooking);

        assertNotNull(booked);
        assertEquals(AppointmentStatus.SCHEDULED, booked.getStatus());
        assertEquals(doctor1, booked.getDoctor());
        verify(appointmentRepository, times(1)).save(newBooking);
    }

    @Test
    @DisplayName("Task 2.1: Reject appointments scheduled in the past")
    void testRejectPastAppointmentDateTime() {
        Appointment pastAppointment = new Appointment();
        pastAppointment.setDoctor(doctor1);
        pastAppointment.setPatient(patient1);
        pastAppointment.setAppointmentDateTime(LocalDateTime.now().minusHours(2));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            appointmentService.bookAppointment(pastAppointment);
        });

        assertTrue(ex.getMessage().contains("must be in the future"));
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Task 2.1: Patient booking via bookAppointmentForUser enforces double-booking check")
    void testPatientUserBookingEnforcesDoubleBookingCheck() {
        User user = new User();
        user.setUsername("alice_user");
        patient1.setUser(user);

        Appointment userAppointment = new Appointment();
        userAppointment.setDoctor(doctor1);
        userAppointment.setAppointmentDateTime(futureSlot);
        userAppointment.setReason("Dental ache");

        when(patientRepository.findByUserUsername("alice_user")).thenReturn(Optional.of(patient1));
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor1));

        // Doctor 1 is already booked at this slot
        when(appointmentRepository.existsByDoctorIdAndAppointmentDateTimeAndStatusNot(
                eq(1L), eq(futureSlot), eq(AppointmentStatus.CANCELLED)))
                .thenReturn(true);

        AppointmentConflictException ex = assertThrows(AppointmentConflictException.class, () -> {
            appointmentService.bookAppointmentForUser(userAppointment, "alice_user");
        });

        assertTrue(ex.getMessage().contains("already has an appointment booked at this date and time"));
        verify(appointmentRepository, never()).save(any());
    }
}
