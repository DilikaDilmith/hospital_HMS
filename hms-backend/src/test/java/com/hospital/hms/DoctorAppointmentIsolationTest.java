package com.hospital.hms;

import com.hospital.hms.controller.AppointmentController;
import com.hospital.hms.entity.*;
import com.hospital.hms.repository.AppointmentRepository;
import com.hospital.hms.repository.DoctorRepository;
import com.hospital.hms.repository.UserRepository;
import com.hospital.hms.service.AppointmentService;
import com.hospital.hms.service.DoctorService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class DoctorAppointmentIsolationTest {

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private DoctorRepository doctorRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private Authentication doctorAuth;

    @Mock
    private Authentication adminAuth;

    @InjectMocks
    private DoctorService doctorService;

    @InjectMocks
    private AppointmentService appointmentService;

    private AppointmentController appointmentController;

    private Doctor doctorA;
    private Doctor doctorB;
    private User doctorUserA;
    private User doctorUserB;
    private Appointment appointmentA;
    private Appointment appointmentB;

    @BeforeEach
    void setUp() {
        appointmentService.setDoctorService(doctorService);

        appointmentController = new AppointmentController();
        appointmentController.setAppointmentService(appointmentService);
        appointmentController.setDoctorService(doctorService);

        // Doctor A
        doctorUserA = new User();
        doctorUserA.setId(4L);
        doctorUserA.setUsername("doctorA");
        doctorUserA.setRole(Role.DOCTOR);

        doctorA = new Doctor();
        doctorA.setId(10L);
        doctorA.setFirstName("Sunil");
        doctorA.setLastName("Perera");
        doctorA.setEmail("sunil@hospital.lk");
        doctorA.setUser(doctorUserA);

        // Doctor B
        doctorUserB = new User();
        doctorUserB.setId(5L);
        doctorUserB.setUsername("doctorB");
        doctorUserB.setRole(Role.DOCTOR);

        doctorB = new Doctor();
        doctorB.setId(20L);
        doctorB.setFirstName("Kamal");
        doctorB.setLastName("Silva");
        doctorB.setEmail("kamal@hospital.lk");
        doctorB.setUser(doctorUserB);

        // Appointment for Doctor A
        appointmentA = new Appointment();
        appointmentA.setId(101L);
        appointmentA.setDoctor(doctorA);
        appointmentA.setAppointmentDateTime(LocalDateTime.now().plusDays(1));
        appointmentA.setStatus(AppointmentStatus.SCHEDULED);

        // Appointment for Doctor B
        appointmentB = new Appointment();
        appointmentB.setId(102L);
        appointmentB.setDoctor(doctorB);
        appointmentB.setAppointmentDateTime(LocalDateTime.now().plusDays(2));
        appointmentB.setStatus(AppointmentStatus.SCHEDULED);
    }

    @Test
    @DisplayName("Doctor views only their own appointments via getAllAppointments")
    void testDoctor_ViewsOnlyTheirOwnAppointments() {
        when(doctorAuth.getName()).thenReturn("doctorA");
        doReturn(Collections.singletonList(new SimpleGrantedAuthority("DOCTOR")))
                .when(doctorAuth).getAuthorities();

        when(doctorRepository.findByUserUsername("doctorA")).thenReturn(Optional.of(doctorA));
        when(appointmentRepository.findByDoctorId(10L)).thenReturn(Collections.singletonList(appointmentA));

        List<Appointment> result = appointmentController.getAllAppointments(doctorAuth);

        assertEquals(1, result.size());
        assertEquals(101L, result.get(0).getId());
        assertEquals("Sunil", result.get(0).getDoctor().getFirstName());
    }

    @Test
    @DisplayName("Doctor views only their own appointments via /doctor/my endpoint")
    void testDoctor_GetMyDoctorAppointments() {
        when(doctorAuth.getName()).thenReturn("doctorA");
        when(doctorRepository.findByUserUsername("doctorA")).thenReturn(Optional.of(doctorA));
        when(appointmentRepository.findByDoctorId(10L)).thenReturn(Collections.singletonList(appointmentA));

        List<Appointment> result = appointmentController.getMyDoctorAppointments(doctorAuth);

        assertEquals(1, result.size());
        assertEquals(101L, result.get(0).getId());
    }

    @Test
    @DisplayName("Admin sees all appointments across all doctors")
    void testAdmin_SeesAllAppointments() {
        doReturn(Collections.singletonList(new SimpleGrantedAuthority("ADMIN")))
                .when(adminAuth).getAuthorities();

        when(appointmentRepository.findAll()).thenReturn(Arrays.asList(appointmentA, appointmentB));

        List<Appointment> result = appointmentController.getAllAppointments(adminAuth);

        assertEquals(2, result.size());
    }

    @Test
    @DisplayName("Doctor accessing their own appointment by ID succeeds (200 OK)")
    void testDoctor_GetOwnAppointmentById_Success() {
        when(doctorAuth.getName()).thenReturn("doctorA");
        doReturn(Collections.singletonList(new SimpleGrantedAuthority("DOCTOR")))
                .when(doctorAuth).getAuthorities();

        when(appointmentRepository.findById(101L)).thenReturn(Optional.of(appointmentA));
        when(doctorRepository.findByUserUsername("doctorA")).thenReturn(Optional.of(doctorA));

        ResponseEntity<?> response = appointmentController.getAppointmentById(101L, doctorAuth);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        Appointment appt = (Appointment) response.getBody();
        assertNotNull(appt);
        assertEquals(101L, appt.getId());
    }

    @Test
    @DisplayName("Doctor accessing another doctor's appointment by ID is blocked (403 Forbidden)")
    void testDoctor_GetOtherDoctorAppointmentById_Forbidden() {
        when(doctorAuth.getName()).thenReturn("doctorA");
        doReturn(Collections.singletonList(new SimpleGrantedAuthority("DOCTOR")))
                .when(doctorAuth).getAuthorities();

        when(appointmentRepository.findById(102L)).thenReturn(Optional.of(appointmentB));
        when(doctorRepository.findByUserUsername("doctorA")).thenReturn(Optional.of(doctorA));

        ResponseEntity<?> response = appointmentController.getAppointmentById(102L, doctorAuth);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertTrue(response.getBody().toString().contains("Access denied"));
    }

    @Test
    @DisplayName("Doctor rescheduling another doctor's appointment is blocked (403 Forbidden)")
    void testDoctor_RescheduleOtherDoctorAppointment_Forbidden() {
        when(doctorAuth.getName()).thenReturn("doctorA");
        doReturn(Collections.singletonList(new SimpleGrantedAuthority("DOCTOR")))
                .when(doctorAuth).getAuthorities();

        when(appointmentRepository.findById(102L)).thenReturn(Optional.of(appointmentB));
        when(doctorRepository.findByUserUsername("doctorA")).thenReturn(Optional.of(doctorA));

        Map<String, String> payload = new HashMap<>();
        payload.put("appointmentDateTime", LocalDateTime.now().plusDays(5).toString());

        ResponseEntity<?> response = appointmentController.rescheduleAppointment(102L, payload, doctorAuth);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertTrue(response.getBody().toString().contains("Access denied"));
    }

    @Test
    @DisplayName("Doctor updating status of another doctor's appointment is blocked (403 Forbidden)")
    void testDoctor_UpdateStatusOfOtherDoctorAppointment_Forbidden() {
        when(doctorAuth.getName()).thenReturn("doctorA");
        doReturn(Collections.singletonList(new SimpleGrantedAuthority("DOCTOR")))
                .when(doctorAuth).getAuthorities();

        when(appointmentRepository.findById(102L)).thenReturn(Optional.of(appointmentB));
        when(doctorRepository.findByUserUsername("doctorA")).thenReturn(Optional.of(doctorA));

        Map<String, String> payload = new HashMap<>();
        payload.put("status", "COMPLETED");

        ResponseEntity<?> response = appointmentController.updateAppointmentStatus(102L, payload, doctorAuth);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertTrue(response.getBody().toString().contains("Access denied"));
    }
}
