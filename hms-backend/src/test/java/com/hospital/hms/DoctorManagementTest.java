package com.hospital.hms;

import com.hospital.hms.controller.DoctorController;
import com.hospital.hms.entity.*;
import com.hospital.hms.exception.AppointmentConflictException;
import com.hospital.hms.repository.*;
import com.hospital.hms.service.AppointmentService;
import com.hospital.hms.service.AuditLogService;
import com.hospital.hms.service.DoctorService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class DoctorManagementTest {

    @Mock
    private DoctorRepository doctorRepository;

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private AdmissionRepository admissionRepository;

    @Mock
    private LabTestRepository labTestRepository;

    @Mock
    private MedicalRecordRepository medicalRecordRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private DoctorService doctorService;

    @InjectMocks
    private AppointmentService appointmentService;

    private Doctor sampleDoctor;
    private Department sampleDepartment;
    private Patient samplePatient;

    @BeforeEach
    void setUp() {
        sampleDepartment = new Department();
        sampleDepartment.setId(5L);
        sampleDepartment.setName("Cardiology");

        sampleDoctor = new Doctor();
        sampleDoctor.setId(10L);
        sampleDoctor.setFirstName("Kasun");
        sampleDoctor.setLastName("Bandara");
        sampleDoctor.setSpecialization("Cardiologist");
        sampleDoctor.setPhoneNumber("0771234567");
        sampleDoctor.setEmail("kasun.bandara@hospital.lk");
        sampleDoctor.setConsultationFee(2000.0);
        sampleDoctor.setDepartment(sampleDepartment);
        sampleDoctor.setAvailableDays("MONDAY,WEDNESDAY,FRIDAY");
        sampleDoctor.setAvailableTimeStart(LocalTime.of(9, 0));
        sampleDoctor.setAvailableTimeEnd(LocalTime.of(16, 0));

        samplePatient = new Patient();
        samplePatient.setId(100L);
        samplePatient.setFirstName("Sunil");
        samplePatient.setLastName("Perera");
    }

    @Test
    @DisplayName("Task 3.2: Admin can successfully edit doctor details, department, fee, and availability")
    void testAdminCanUpdateDoctorDetailsAndAvailability() {
        Department newDept = new Department();
        newDept.setId(6L);
        newDept.setName("Neurology");

        Doctor updatePayload = new Doctor();
        updatePayload.setFirstName("Kasun Updated");
        updatePayload.setLastName("Bandara Updated");
        updatePayload.setSpecialization("Senior Neurologist");
        updatePayload.setPhoneNumber("0779998888");
        updatePayload.setEmail("kasun.updated@hospital.lk");
        updatePayload.setConsultationFee(2500.0);
        updatePayload.setDepartment(newDept);
        updatePayload.setAvailableDays("TUESDAY,THURSDAY");
        updatePayload.setAvailableTimeStart(LocalTime.of(10, 0));
        updatePayload.setAvailableTimeEnd(LocalTime.of(18, 0));

        when(doctorRepository.findById(10L)).thenReturn(Optional.of(sampleDoctor));
        when(doctorRepository.save(any(Doctor.class))).thenAnswer(inv -> inv.getArgument(0));

        Doctor updated = doctorService.updateDoctor(10L, updatePayload);

        assertNotNull(updated);
        assertEquals("Kasun Updated", updated.getFirstName());
        assertEquals("Bandara Updated", updated.getLastName());
        assertEquals("Senior Neurologist", updated.getSpecialization());
        assertEquals("0779998888", updated.getPhoneNumber());
        assertEquals("kasun.updated@hospital.lk", updated.getEmail());
        assertEquals(2500.0, updated.getConsultationFee());
        assertEquals(newDept, updated.getDepartment());
        assertEquals("TUESDAY,THURSDAY", updated.getAvailableDays());
        assertEquals(LocalTime.of(10, 0), updated.getAvailableTimeStart());
        assertEquals(LocalTime.of(18, 0), updated.getAvailableTimeEnd());

        verify(doctorRepository, times(1)).save(sampleDoctor);
    }

    @Test
    @DisplayName("Task 3.2: Reject appointment booking when requested date is outside doctor's working days")
    void testBookingFailsWhenDateOutsideAvailableDays() {
        // sampleDoctor is available on MONDAY, WEDNESDAY, FRIDAY
        // Find next Tuesday in the future
        LocalDateTime nextTuesday = LocalDateTime.now().plusWeeks(1)
                .with(TemporalAdjusters.next(DayOfWeek.TUESDAY))
                .withHour(11).withMinute(0).withSecond(0).withNano(0);

        Appointment appt = new Appointment();
        appt.setDoctor(sampleDoctor);
        appt.setPatient(samplePatient);
        appt.setAppointmentDateTime(nextTuesday);
        appt.setReason("Routine Check");

        when(doctorRepository.findById(10L)).thenReturn(Optional.of(sampleDoctor));
        when(patientRepository.findById(100L)).thenReturn(Optional.of(samplePatient));

        AppointmentConflictException ex = assertThrows(AppointmentConflictException.class, () -> {
            appointmentService.bookAppointment(appt);
        });

        assertTrue(ex.getMessage().contains("not available on TUESDAY"));
        assertTrue(ex.getMessage().contains("MONDAY,WEDNESDAY,FRIDAY"));
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Task 3.2: Reject appointment booking when requested time is before doctor's working hours")
    void testBookingFailsWhenTimeBeforeAvailableHours() {
        // sampleDoctor is available 09:00 - 16:00
        // Find next Monday at 08:30 (before 09:00)
        LocalDateTime nextMondayEarly = LocalDateTime.now().plusWeeks(1)
                .with(TemporalAdjusters.next(DayOfWeek.MONDAY))
                .withHour(8).withMinute(30).withSecond(0).withNano(0);

        Appointment appt = new Appointment();
        appt.setDoctor(sampleDoctor);
        appt.setPatient(samplePatient);
        appt.setAppointmentDateTime(nextMondayEarly);
        appt.setReason("Early Consultation");

        when(doctorRepository.findById(10L)).thenReturn(Optional.of(sampleDoctor));
        when(patientRepository.findById(100L)).thenReturn(Optional.of(samplePatient));

        AppointmentConflictException ex = assertThrows(AppointmentConflictException.class, () -> {
            appointmentService.bookAppointment(appt);
        });

        assertTrue(ex.getMessage().contains("outside Dr. Kasun Bandara's available hours"));
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Task 3.2: Reject appointment booking when requested time is after doctor's working hours")
    void testBookingFailsWhenTimeAfterAvailableHours() {
        // sampleDoctor is available 09:00 - 16:00
        // Find next Friday at 16:30 (after 16:00)
        LocalDateTime nextFridayLate = LocalDateTime.now().plusWeeks(1)
                .with(TemporalAdjusters.next(DayOfWeek.FRIDAY))
                .withHour(16).withMinute(30).withSecond(0).withNano(0);

        Appointment appt = new Appointment();
        appt.setDoctor(sampleDoctor);
        appt.setPatient(samplePatient);
        appt.setAppointmentDateTime(nextFridayLate);
        appt.setReason("Late Consultation");

        when(doctorRepository.findById(10L)).thenReturn(Optional.of(sampleDoctor));
        when(patientRepository.findById(100L)).thenReturn(Optional.of(samplePatient));

        AppointmentConflictException ex = assertThrows(AppointmentConflictException.class, () -> {
            appointmentService.bookAppointment(appt);
        });

        assertTrue(ex.getMessage().contains("outside Dr. Kasun Bandara's available hours"));
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Task 3.2: Successfully book appointment when date and time match doctor availability")
    void testBookingSucceedsWithinAvailableDaysAndHours() {
        // Find next Wednesday at 11:00 (within MONDAY,WEDNESDAY,FRIDAY and 09:00 - 16:00)
        LocalDateTime nextWednesdayValid = LocalDateTime.now().plusWeeks(1)
                .with(TemporalAdjusters.next(DayOfWeek.WEDNESDAY))
                .withHour(11).withMinute(0).withSecond(0).withNano(0);

        Appointment appt = new Appointment();
        appt.setDoctor(sampleDoctor);
        appt.setPatient(samplePatient);
        appt.setAppointmentDateTime(nextWednesdayValid);
        appt.setReason("Routine Consultation");

        when(doctorRepository.findById(10L)).thenReturn(Optional.of(sampleDoctor));
        when(patientRepository.findById(100L)).thenReturn(Optional.of(samplePatient));
        when(appointmentRepository.existsByDoctorIdAndAppointmentDateTimeAndStatusNot(
                eq(10L), eq(nextWednesdayValid), eq(AppointmentStatus.CANCELLED)))
                .thenReturn(false);
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(inv -> inv.getArgument(0));

        Appointment saved = appointmentService.bookAppointment(appt);

        assertNotNull(saved);
        assertEquals(AppointmentStatus.SCHEDULED, saved.getStatus());
        assertEquals(nextWednesdayValid, saved.getAppointmentDateTime());
        verify(appointmentRepository, times(1)).save(appt);
    }

    @Test
    @DisplayName("Task 3.2: Reject rescheduling when new slot falls on doctor's non-working day")
    void testReschedulingFailsWhenDayUnavailable() {
        LocalDateTime initialSlot = LocalDateTime.now().plusWeeks(1)
                .with(TemporalAdjusters.next(DayOfWeek.MONDAY))
                .withHour(10).withMinute(0).withSecond(0).withNano(0);

        Appointment appt = new Appointment();
        appt.setId(201L);
        appt.setDoctor(sampleDoctor);
        appt.setPatient(samplePatient);
        appt.setAppointmentDateTime(initialSlot);
        appt.setStatus(AppointmentStatus.SCHEDULED);

        // Try rescheduling to Sunday (outside MONDAY,WEDNESDAY,FRIDAY)
        LocalDateTime sundaySlot = LocalDateTime.now().plusWeeks(2)
                .with(TemporalAdjusters.next(DayOfWeek.SUNDAY))
                .withHour(10).withMinute(0).withSecond(0).withNano(0);

        when(appointmentRepository.findById(201L)).thenReturn(Optional.of(appt));

        AppointmentConflictException ex = assertThrows(AppointmentConflictException.class, () -> {
            appointmentService.rescheduleAppointment(201L, sundaySlot);
        });

        assertTrue(ex.getMessage().contains("not available on SUNDAY"));
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Task 3.2: Successfully reschedule when new slot is within doctor's working days and hours")
    void testReschedulingSucceedsWithinAvailability() {
        LocalDateTime initialSlot = LocalDateTime.now().plusWeeks(1)
                .with(TemporalAdjusters.next(DayOfWeek.MONDAY))
                .withHour(10).withMinute(0).withSecond(0).withNano(0);

        Appointment appt = new Appointment();
        appt.setId(202L);
        appt.setDoctor(sampleDoctor);
        appt.setPatient(samplePatient);
        appt.setAppointmentDateTime(initialSlot);
        appt.setStatus(AppointmentStatus.CONFIRMED);

        // Valid new slot: Friday at 14:00 (within MONDAY,WEDNESDAY,FRIDAY and 09:00 - 16:00)
        LocalDateTime validFridaySlot = LocalDateTime.now().plusWeeks(2)
                .with(TemporalAdjusters.next(DayOfWeek.FRIDAY))
                .withHour(14).withMinute(0).withSecond(0).withNano(0);

        when(appointmentRepository.findById(202L)).thenReturn(Optional.of(appt));
        when(appointmentRepository.existsByDoctorIdAndAppointmentDateTimeAndStatusNotAndIdNot(
                eq(10L), eq(validFridaySlot), eq(AppointmentStatus.CANCELLED), eq(202L)))
                .thenReturn(false);
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(inv -> inv.getArgument(0));

        Appointment rescheduled = appointmentService.rescheduleAppointment(202L, validFridaySlot);

        assertNotNull(rescheduled);
        assertEquals(validFridaySlot, rescheduled.getAppointmentDateTime());
        assertEquals(AppointmentStatus.SCHEDULED, rescheduled.getStatus());
        verify(appointmentRepository, times(1)).save(appt);
    }

    @Test
    @DisplayName("Task 3.2: createDoctor successfully provisions Doctor profile and APPROVED User account")
    void testCreateDoctor_CreatesDoctorAndApprovedUser() {
        DoctorController controller = new DoctorController();
        controller.setDoctorService(doctorService);
        UserRepository mockUserRepo = mock(UserRepository.class);
        DepartmentRepository mockDeptRepo = mock(DepartmentRepository.class);
        PasswordEncoder mockEncoder = mock(PasswordEncoder.class);
        AuditLogService mockAudit = mock(AuditLogService.class);
        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn("admin");

        controller.setUserRepository(mockUserRepo);
        controller.setDepartmentRepository(mockDeptRepo);
        controller.setPasswordEncoder(mockEncoder);
        controller.setAuditLogService(mockAudit);

        when(mockEncoder.encode(any())).thenReturn("hashed_pass");
        when(mockUserRepo.findByUsername("doc@gmail.com")).thenReturn(Optional.empty());
        when(doctorRepository.save(any(Doctor.class))).thenAnswer(inv -> {
            Doctor d = inv.getArgument(0);
            d.setId(99L);
            return d;
        });

        Doctor docInput = new Doctor();
        docInput.setFirstName("Docter");
        docInput.setLastName("Doc");
        docInput.setSpecialization("brain");
        docInput.setPhoneNumber("022665544823");
        docInput.setEmail("doc@gmail.com");
        docInput.setConsultationFee(1550.0);

        ResponseEntity<?> response = controller.createDoctor(docInput, auth);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(mockUserRepo).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();
        assertEquals("doc@gmail.com", savedUser.getUsername());
        assertEquals("APPROVED", savedUser.getStatus());
        assertEquals(Role.DOCTOR, savedUser.getRole());
        assertEquals("Dr. Docter Doc", savedUser.getFullName());
    }

    @Test
    @DisplayName("Task 3.2: createDoctor validates required fields")
    void testCreateDoctor_Validation() {
        DoctorController controller = new DoctorController();
        Doctor doc = new Doctor();
        doc.setFirstName("");

        ResponseEntity<?> res = controller.createDoctor(doc, null);
        assertEquals(HttpStatus.BAD_REQUEST, res.getStatusCode());
        assertTrue(res.getBody().toString().contains("First name is required"));
    }

    @Test
    @DisplayName("DoctorService: deleteDoctor successfully deletes doctor and associated user account when no records exist")
    void testDeleteDoctor_Success() {
        when(doctorRepository.findById(10L)).thenReturn(Optional.of(sampleDoctor));
        when(appointmentRepository.countByDoctorId(10L)).thenReturn(0L);
        when(admissionRepository.countByDoctorId(10L)).thenReturn(0L);
        when(labTestRepository.countByDoctorId(10L)).thenReturn(0L);
        when(medicalRecordRepository.countByDoctorId(10L)).thenReturn(0L);

        User doctorUser = new User();
        doctorUser.setUsername("kasun.bandara@hospital.lk");
        doctorUser.setRole(Role.DOCTOR);
        when(userRepository.findByUsername("kasun.bandara@hospital.lk")).thenReturn(Optional.of(doctorUser));

        doctorService.deleteDoctor(10L);

        verify(userRepository, times(1)).delete(doctorUser);
        verify(doctorRepository, times(1)).delete(sampleDoctor);
    }

    @Test
    @DisplayName("DoctorService: deleteDoctor throws IllegalStateException when doctor has existing appointments")
    void testDeleteDoctor_FailsWhenAppointmentsExist() {
        when(doctorRepository.findById(10L)).thenReturn(Optional.of(sampleDoctor));
        when(appointmentRepository.countByDoctorId(10L)).thenReturn(2L);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            doctorService.deleteDoctor(10L);
        });

        assertTrue(ex.getMessage().contains("existing appointments"));
        verify(doctorRepository, never()).delete(any());
    }

    @Test
    @DisplayName("DoctorService: deleteDoctor throws IllegalArgumentException when doctor is not found")
    void testDeleteDoctor_NotFound() {
        when(doctorRepository.findById(999L)).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            doctorService.deleteDoctor(999L);
        });

        assertTrue(ex.getMessage().contains("Doctor not found"));
        verify(doctorRepository, never()).delete(any());
    }

    @Test
    @DisplayName("DoctorController: deleteDoctor returns OK and logs audit on success")
    void testDoctorController_DeleteDoctor_Success() {
        DoctorController controller = new DoctorController();
        controller.setDoctorService(doctorService);
        AuditLogService mockAudit = mock(AuditLogService.class);
        controller.setAuditLogService(mockAudit);

        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn("admin");

        when(doctorRepository.findById(10L)).thenReturn(Optional.of(sampleDoctor));
        when(appointmentRepository.countByDoctorId(10L)).thenReturn(0L);
        when(admissionRepository.countByDoctorId(10L)).thenReturn(0L);
        when(labTestRepository.countByDoctorId(10L)).thenReturn(0L);
        when(medicalRecordRepository.countByDoctorId(10L)).thenReturn(0L);

        ResponseEntity<?> response = controller.deleteDoctor(10L, auth);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().toString().contains("deleted successfully"));
        verify(mockAudit, times(1)).log(eq("admin"), eq("DOCTOR_DELETE"), eq("SUCCESS"), anyString());
    }

    @Test
    @DisplayName("DoctorController: deleteDoctor returns Bad Request when doctor has active records")
    void testDoctorController_DeleteDoctor_BlockedByAppointments() {
        DoctorController controller = new DoctorController();
        controller.setDoctorService(doctorService);
        AuditLogService mockAudit = mock(AuditLogService.class);
        controller.setAuditLogService(mockAudit);

        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn("admin");

        when(doctorRepository.findById(10L)).thenReturn(Optional.of(sampleDoctor));
        when(appointmentRepository.countByDoctorId(10L)).thenReturn(1L);

        ResponseEntity<?> response = controller.deleteDoctor(10L, auth);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertTrue(response.getBody().toString().contains("existing appointments"));
        verify(mockAudit, times(1)).log(eq("admin"), eq("DOCTOR_DELETE"), eq("FAILED"), anyString());
    }
}
