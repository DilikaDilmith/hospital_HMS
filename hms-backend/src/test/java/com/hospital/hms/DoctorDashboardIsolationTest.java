package com.hospital.hms;

import com.hospital.hms.controller.DashboardController;
import com.hospital.hms.dto.DashboardResponse;
import com.hospital.hms.entity.*;
import com.hospital.hms.repository.*;
import com.hospital.hms.service.DashboardService;
import com.hospital.hms.service.DoctorService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class DoctorDashboardIsolationTest {

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private LabTestRepository labTestRepository;

    @Mock
    private DoctorRepository doctorRepository;

    @Mock
    private DoctorService doctorService;

    @Mock
    private DashboardService mockDashboardService;

    @Mock
    private Authentication doctorAuth;

    @Mock
    private Authentication adminAuth;

    @InjectMocks
    private DashboardService dashboardService;

    private DashboardController dashboardController;

    private Doctor doctorA;
    private Doctor doctorB;
    private Patient patient1;
    private Patient patient2;
    private Appointment apptDocA;
    private Appointment apptDocB;

    @BeforeEach
    void setUp() {
        dashboardService.setDoctorService(doctorService);
        dashboardService.setDoctorRepository(doctorRepository);
        dashboardService.setAppointmentRepository(appointmentRepository);
        dashboardService.setLabTestRepository(labTestRepository);

        dashboardController = new DashboardController();
        dashboardController.setDashboardService(mockDashboardService);

        // Doctor A (Dr. Chathuri)
        User userA = new User();
        userA.setId(10L);
        userA.setUsername("dr_chathuri");
        userA.setRole(Role.DOCTOR);

        doctorA = new Doctor();
        doctorA.setId(101L);
        doctorA.setFirstName("Chathuri");
        doctorA.setLastName("Samaranayaka");
        doctorA.setUser(userA);

        // Doctor B (Dr. Sunil)
        User userB = new User();
        userB.setId(20L);
        userB.setUsername("dr_sunil");
        userB.setRole(Role.DOCTOR);

        doctorB = new Doctor();
        doctorB.setId(102L);
        doctorB.setFirstName("Sunil");
        doctorB.setLastName("Perera");
        doctorB.setUser(userB);

        // Patients
        patient1 = new Patient();
        patient1.setId(1L);
        patient1.setFirstName("Nimal");

        patient2 = new Patient();
        patient2.setId(2L);
        patient2.setFirstName("Kamal");

        // Appointment 1: Booked with Doctor A
        apptDocA = new Appointment();
        apptDocA.setId(501L);
        apptDocA.setDoctor(doctorA);
        apptDocA.setPatient(patient1);
        apptDocA.setAppointmentDateTime(LocalDateTime.now().plusHours(2));
        apptDocA.setStatus(AppointmentStatus.SCHEDULED);

        // Appointment 2: Booked with Doctor B
        apptDocB = new Appointment();
        apptDocB.setId(502L);
        apptDocB.setDoctor(doctorB);
        apptDocB.setPatient(patient2);
        apptDocB.setAppointmentDateTime(LocalDateTime.now().plusDays(1));
        apptDocB.setStatus(AppointmentStatus.SCHEDULED);
    }

    @Test
    @DisplayName("DashboardService.getDoctorDashboardStats returns ONLY that doctor's appointment and patient count")
    void testService_GetDoctorDashboardStats_IsolatesToTargetDoctor() {
        when(doctorService.getDoctorByUsername("dr_chathuri")).thenReturn(Optional.of(doctorA));
        when(appointmentRepository.findByDoctorId(101L)).thenReturn(List.of(apptDocA));

        DashboardResponse response = dashboardService.getDoctorDashboardStats("dr_chathuri");

        assertNotNull(response);
        assertEquals(1, response.getTotalAppointments(), "Doctor should see ONLY their own appointment count");
        assertEquals(1, response.getTotalPatients(), "Doctor should see ONLY their unique patients count");
        assertEquals(1, response.getTodaysAppointments(), "Should count today's appointments for this doctor");
    }

    @Test
    @DisplayName("DashboardService.getDoctorDashboardStats returns 0 when doctor has no appointments")
    void testService_GetDoctorDashboardStats_ZeroBookings() {
        when(doctorService.getDoctorByUsername("dr_chathuri")).thenReturn(Optional.of(doctorA));
        when(appointmentRepository.findByDoctorId(101L)).thenReturn(Collections.emptyList());

        DashboardResponse response = dashboardService.getDoctorDashboardStats("dr_chathuri");

        assertNotNull(response);
        assertEquals(0, response.getTotalAppointments());
        assertEquals(0, response.getTotalPatients());
    }

    @Test
    @DisplayName("DashboardController routes Doctor caller to doctor-scoped metrics")
    void testController_DoctorCaller_RoutesToDoctorStats() {
        when(doctorAuth.getName()).thenReturn("dr_chathuri");
        doReturn(Collections.singletonList(new SimpleGrantedAuthority("DOCTOR")))
                .when(doctorAuth).getAuthorities();

        DashboardResponse doctorStats = new DashboardResponse();
        doctorStats.setTotalAppointments(1L);
        doctorStats.setTotalPatients(1L);

        when(mockDashboardService.getDoctorDashboardStats("dr_chathuri")).thenReturn(doctorStats);

        DashboardResponse result = dashboardController.getDashboardMetrics(doctorAuth);

        assertNotNull(result);
        assertEquals(1, result.getTotalAppointments());
        assertEquals(1, result.getTotalPatients());
        verify(mockDashboardService).getDoctorDashboardStats("dr_chathuri");
        verify(mockDashboardService, never()).getDashboardStats();
    }

    @Test
    @DisplayName("DashboardController routes Admin caller to hospital-wide metrics")
    void testController_AdminCaller_RoutesToGlobalStats() {
        doReturn(Collections.singletonList(new SimpleGrantedAuthority("ROLE_ADMIN")))
                .when(adminAuth).getAuthorities();

        DashboardResponse globalStats = new DashboardResponse();
        globalStats.setTotalAppointments(10L);
        globalStats.setTotalPatients(6L);

        when(mockDashboardService.getDashboardStats()).thenReturn(globalStats);

        DashboardResponse result = dashboardController.getDashboardMetrics(adminAuth);

        assertNotNull(result);
        assertEquals(10, result.getTotalAppointments(), "Admin should receive hospital-wide total");
        assertEquals(6, result.getTotalPatients(), "Admin should receive hospital-wide total patients");
        verify(mockDashboardService).getDashboardStats();
        verify(mockDashboardService, never()).getDoctorDashboardStats(anyString());
    }

    @Test
    @DisplayName("Explicit /api/dashboard/doctor/my endpoint delegates to doctor-scoped stats")
    void testController_ExplicitDoctorEndpoint() {
        when(doctorAuth.getName()).thenReturn("dr_chathuri");
        DashboardResponse doctorStats = new DashboardResponse();
        doctorStats.setTotalAppointments(2L);

        when(mockDashboardService.getDoctorDashboardStats("dr_chathuri")).thenReturn(doctorStats);

        DashboardResponse result = dashboardController.getDoctorDashboardStats(doctorAuth);

        assertNotNull(result);
        assertEquals(2, result.getTotalAppointments());
        verify(mockDashboardService).getDoctorDashboardStats("dr_chathuri");
    }
}
