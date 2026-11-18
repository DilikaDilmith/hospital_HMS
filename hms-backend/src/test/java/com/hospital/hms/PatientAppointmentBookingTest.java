package com.hospital.hms;

import com.hospital.hms.controller.AppointmentController;
import com.hospital.hms.entity.*;
import com.hospital.hms.exception.AppointmentConflictException;
import com.hospital.hms.repository.*;
import com.hospital.hms.service.AppointmentService;
import com.hospital.hms.service.AuditLogService;
import com.hospital.hms.service.PatientService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

public class PatientAppointmentBookingTest {

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private DoctorRepository doctorRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PatientService patientService;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private AppointmentService appointmentService;

    private AppointmentController appointmentController;

    private Department cardiologyDept;
    private Doctor cardiologist;
    private Patient patient;
    private User patientUser;

    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);

        appointmentService.setUserRepository(userRepository);
        appointmentService.setPatientService(patientService);

        appointmentController = new AppointmentController();
        appointmentController.setAppointmentService(appointmentService);
        appointmentController.setAuditLogService(auditLogService);

        cardiologyDept = new Department();
        cardiologyDept.setId(10L);
        cardiologyDept.setName("Cardiology");

        cardiologist = new Doctor();
        cardiologist.setId(20L);
        cardiologist.setFirstName("Sarah");
        cardiologist.setLastName("Connor");
        cardiologist.setSpecialization("Cardiologist");
        cardiologist.setDepartment(cardiologyDept);
        cardiologist.setConsultationFee(2000.0);
        cardiologist.setAvailableDays("MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY");
        cardiologist.setAvailableTimeStart(LocalTime.of(9, 0));
        cardiologist.setAvailableTimeEnd(LocalTime.of(17, 0));

        patientUser = new User();
        patientUser.setId(1L);
        patientUser.setUsername("patient_john");
        patientUser.setFullName("John Patient");
        patientUser.setRole(Role.PATIENT);

        patient = new Patient();
        patient.setId(100L);
        patient.setUser(patientUser);
        patient.setFirstName("John");
        patient.setLastName("Patient");

        doReturn(Collections.singletonList(new SimpleGrantedAuthority("ROLE_PATIENT")))
                .when(authentication).getAuthorities();
        when(authentication.getName()).thenReturn("patient_john");
    }

    @Test
    public void testPatientBookAppointment_Success() {
        // Next Monday at 10:00 AM (guaranteed weekday within 09:00 - 17:00)
        LocalDate nextMonday = LocalDate.now().plusWeeks(1);
        while (nextMonday.getDayOfWeek() != java.time.DayOfWeek.MONDAY) {
            nextMonday = nextMonday.plusDays(1);
        }
        LocalDateTime appointmentTime = nextMonday.atTime(10, 0);

        Appointment req = new Appointment();
        req.setDoctor(cardiologist);
        req.setAppointmentDateTime(appointmentTime);
        req.setReason("Chest tightness consultation");

        when(patientRepository.findByUserUsername("patient_john")).thenReturn(Optional.of(patient));
        when(doctorRepository.findById(20L)).thenReturn(Optional.of(cardiologist));
        when(appointmentRepository.existsByDoctorIdAndAppointmentDateTimeAndStatusNot(eq(20L), eq(appointmentTime), eq(AppointmentStatus.CANCELLED)))
                .thenReturn(false);
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(inv -> {
            Appointment a = inv.getArgument(0);
            a.setId(501L);
            return a;
        });

        ResponseEntity<?> response = appointmentController.bookAppointment(req, authentication);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof Appointment);
        Appointment created = (Appointment) response.getBody();
        assertEquals(AppointmentStatus.SCHEDULED, created.getStatus());
        assertEquals("Sarah", created.getDoctor().getFirstName());
        assertEquals("Cardiology", created.getDoctor().getDepartment().getName());
        assertEquals(patient, created.getPatient());

        verify(auditLogService, times(1)).log(eq("patient_john"), eq("APPOINTMENT_BOOK"), eq("SUCCESS"), anyString());
    }

    @Test
    public void testPatientBookAppointment_AutoProvisionsPatientProfileIfMissing() {
        LocalDate nextTuesday = LocalDate.now().plusWeeks(1);
        while (nextTuesday.getDayOfWeek() != java.time.DayOfWeek.TUESDAY) {
            nextTuesday = nextTuesday.plusDays(1);
        }
        LocalDateTime appointmentTime = nextTuesday.atTime(11, 0);

        Appointment req = new Appointment();
        req.setDoctor(cardiologist);
        req.setAppointmentDateTime(appointmentTime);
        req.setReason("Routine heart checkup");

        // First lookup fails
        when(patientRepository.findByUserUsername("patient_john")).thenReturn(Optional.empty());
        when(userRepository.findByUsername("patient_john")).thenReturn(Optional.of(patientUser));
        when(patientService.createPatientForUser(patientUser)).thenReturn(patient);
        when(doctorRepository.findById(20L)).thenReturn(Optional.of(cardiologist));
        when(appointmentRepository.existsByDoctorIdAndAppointmentDateTimeAndStatusNot(eq(20L), eq(appointmentTime), eq(AppointmentStatus.CANCELLED)))
                .thenReturn(false);
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(inv -> {
            Appointment a = inv.getArgument(0);
            a.setId(502L);
            return a;
        });

        ResponseEntity<?> response = appointmentController.bookAppointment(req, authentication);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        verify(patientService, times(1)).createPatientForUser(patientUser);
    }

    @Test
    public void testPatientBookAppointment_DoctorNotAvailableOnSunday_ReturnsConflict() {
        // Next Sunday at 10:00 AM (doctor only works Mon-Fri)
        LocalDate nextSunday = LocalDate.now().plusWeeks(1);
        while (nextSunday.getDayOfWeek() != java.time.DayOfWeek.SUNDAY) {
            nextSunday = nextSunday.plusDays(1);
        }
        LocalDateTime appointmentTime = nextSunday.atTime(10, 0);

        Appointment req = new Appointment();
        req.setDoctor(cardiologist);
        req.setAppointmentDateTime(appointmentTime);
        req.setReason("Sunday appointment test");

        when(patientRepository.findByUserUsername("patient_john")).thenReturn(Optional.of(patient));
        when(doctorRepository.findById(20L)).thenReturn(Optional.of(cardiologist));

        ResponseEntity<?> response = appointmentController.bookAppointment(req, authentication);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertTrue(response.getBody().toString().contains("not available on SUNDAY"));
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    public void testPatientBookAppointment_TimeOutsideWorkingHours_ReturnsConflict() {
        LocalDate nextMonday = LocalDate.now().plusWeeks(1);
        while (nextMonday.getDayOfWeek() != java.time.DayOfWeek.MONDAY) {
            nextMonday = nextMonday.plusDays(1);
        }
        // 07:00 AM is outside doctor's 09:00 - 17:00
        LocalDateTime earlyTime = nextMonday.atTime(7, 0);

        Appointment req = new Appointment();
        req.setDoctor(cardiologist);
        req.setAppointmentDateTime(earlyTime);
        req.setReason("Too early appointment");

        when(patientRepository.findByUserUsername("patient_john")).thenReturn(Optional.of(patient));
        when(doctorRepository.findById(20L)).thenReturn(Optional.of(cardiologist));

        ResponseEntity<?> response = appointmentController.bookAppointment(req, authentication);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertTrue(response.getBody().toString().contains("outside Dr. Sarah Connor's available hours"));
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    public void testPatientBookAppointment_DoctorAlreadyBooked_ReturnsConflict() {
        LocalDate nextWednesday = LocalDate.now().plusWeeks(1);
        while (nextWednesday.getDayOfWeek() != java.time.DayOfWeek.WEDNESDAY) {
            nextWednesday = nextWednesday.plusDays(1);
        }
        LocalDateTime busySlot = nextWednesday.atTime(14, 0);

        Appointment req = new Appointment();
        req.setDoctor(cardiologist);
        req.setAppointmentDateTime(busySlot);
        req.setReason("Double booking test");

        when(patientRepository.findByUserUsername("patient_john")).thenReturn(Optional.of(patient));
        when(doctorRepository.findById(20L)).thenReturn(Optional.of(cardiologist));
        when(appointmentRepository.existsByDoctorIdAndAppointmentDateTimeAndStatusNot(eq(20L), eq(busySlot), eq(AppointmentStatus.CANCELLED)))
                .thenReturn(true);

        ResponseEntity<?> response = appointmentController.bookAppointment(req, authentication);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertTrue(response.getBody().toString().contains("already has an appointment booked"));
        verify(appointmentRepository, never()).save(any());
    }
}
