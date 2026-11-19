package com.hospital.hms;

import com.hospital.hms.entity.*;
import com.hospital.hms.repository.*;
import com.hospital.hms.service.DoctorService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initDatabase(
            UserRepository userRepository, 
            PatientRepository patientRepository, 
            MedicineRepository medicineRepository,
            MedicineBatchRepository medicineBatchRepository,
            WardRepository wardRepository,
            BedRepository bedRepository,
            EmployeeRepository employeeRepository,
            AttendanceRepository attendanceRepository,
            DoctorService doctorService,
            PasswordEncoder passwordEncoder, 
            JdbcTemplate jdbcTemplate) {
        return args -> {
            // 0. Ensure MySQL table columns are flexible and migrated
            try {
                jdbcTemplate.execute("ALTER TABLE users MODIFY COLUMN role VARCHAR(50) NOT NULL");
            } catch (Exception ignored) {}

            try {
                jdbcTemplate.execute("ALTER TABLE users MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'PENDING'");
            } catch (Exception ignored) {}

            try {
                jdbcTemplate.execute("ALTER TABLE appointments MODIFY COLUMN status VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED'");
            } catch (Exception ignored) {}

            try {
                jdbcTemplate.execute("UPDATE appointments SET status = 'SCHEDULED' WHERE status = 'BOOKED' OR status IS NULL");
            } catch (Exception ignored) {}

            try {
                jdbcTemplate.execute("ALTER TABLE patients MODIFY COLUMN phone_number VARCHAR(255) NULL");
                jdbcTemplate.execute("ALTER TABLE patients MODIFY COLUMN date_of_birth DATE NULL");
                jdbcTemplate.execute("ALTER TABLE patients MODIFY COLUMN gender VARCHAR(50) NULL");
            } catch (Exception ignored) {}

            try {
                jdbcTemplate.execute("ALTER TABLE doctors ADD COLUMN consultation_fee DOUBLE NOT NULL DEFAULT 1500.0");
            } catch (Exception ignored) {}

            try {
                jdbcTemplate.execute("ALTER TABLE doctors ADD COLUMN user_id BIGINT UNIQUE NULL");
            } catch (Exception ignored) {}

            try {
                jdbcTemplate.execute("ALTER TABLE lab_tests MODIFY COLUMN status VARCHAR(30) NOT NULL DEFAULT 'REQUESTED'");
            } catch (Exception ignored) {}

            try {
                jdbcTemplate.execute("ALTER TABLE lab_tests ADD COLUMN test_fee DOUBLE NOT NULL DEFAULT 2500.0");
            } catch (Exception ignored) {}

            // Auto-sync approved doctor users with doctor profiles
            try {
                if (doctorService != null) {
                    doctorService.syncApprovedDoctorUsers();
                }
            } catch (Exception ex) {
                System.err.println("⚠️ Warning during startup doctor sync: " + ex.getMessage());
            }

            // 1. Ensure default "admin" user exists and is APPROVED
            userRepository.findByUsername("admin").ifPresentOrElse(
                admin -> {
                    if (admin.getStatus() == null || !"APPROVED".equals(admin.getStatus())) {
                        admin.setStatus("APPROVED");
                        userRepository.save(admin);
                    }
                },
                () -> {
                    User admin = new User();
                    admin.setUsername("admin");
                    admin.setPassword(passwordEncoder.encode("admin123")); 
                    admin.setFullName("System Administrator");
                    admin.setRole(Role.ADMIN);
                    admin.setStatus("APPROVED");
                    userRepository.save(admin);
                    System.out.println("✅ Default Admin User Created Successfully with Encoded Password!");
                }
            );

            // 2. Ensure default "doctor1" user exists and is APPROVED
            userRepository.findByUsername("doctor1").ifPresentOrElse(
                doc -> {
                    if (doc.getStatus() == null || !"APPROVED".equals(doc.getStatus())) {
                        doc.setStatus("APPROVED");
                        userRepository.save(doc);
                    }
                },
                () -> {
                    User doctor = new User();
                    doctor.setUsername("doctor1");
                    doctor.setPassword(passwordEncoder.encode("doc123"));
                    doctor.setFullName("Dr. Sunil Perera");
                    doctor.setRole(Role.DOCTOR);
                    doctor.setStatus("APPROVED");
                    userRepository.save(doctor);
                    System.out.println("✅ Default Doctor User Created!");
                }
            );

            // 3. Ensure default "receptionist1" user exists and is APPROVED
            userRepository.findByUsername("receptionist1").ifPresentOrElse(
                rec -> {
                    if (rec.getStatus() == null || !"APPROVED".equals(rec.getStatus())) {
                        rec.setStatus("APPROVED");
                        userRepository.save(rec);
                    }
                },
                () -> {
                    User receptionist = new User();
                    receptionist.setUsername("receptionist1");
                    receptionist.setPassword(passwordEncoder.encode("recep123"));
                    receptionist.setFullName("Anula Jayasinghe");
                    receptionist.setRole(Role.RECEPTIONIST);
                    receptionist.setStatus("APPROVED");
                    userRepository.save(receptionist);
                    System.out.println("✅ Default Receptionist User Created!");
                }
            );

            // 3.1. Ensure default "nurse1" user exists and is APPROVED
            userRepository.findByUsername("nurse1").ifPresentOrElse(
                nurse -> {
                    if (nurse.getStatus() == null || !"APPROVED".equals(nurse.getStatus())) {
                        nurse.setStatus("APPROVED");
                        userRepository.save(nurse);
                    }
                },
                () -> {
                    User nurse = new User();
                    nurse.setUsername("nurse1");
                    nurse.setPassword(passwordEncoder.encode("nurse123"));
                    nurse.setFullName("Nurse Kumari Silva");
                    nurse.setRole(Role.NURSE);
                    nurse.setStatus("APPROVED");
                    userRepository.save(nurse);
                    System.out.println("✅ Default Nurse User Created!");
                }
            );

            // 3.2. Ensure default "pharmacist1" user exists and is APPROVED
            userRepository.findByUsername("pharmacist1").ifPresentOrElse(
                pharm -> {
                    if (pharm.getStatus() == null || !"APPROVED".equals(pharm.getStatus())) {
                        pharm.setStatus("APPROVED");
                        userRepository.save(pharm);
                    }
                },
                () -> {
                    User pharm = new User();
                    pharm.setUsername("pharmacist1");
                    pharm.setPassword(passwordEncoder.encode("pharm123"));
                    pharm.setFullName("Pharmacist Nimal Bandara");
                    pharm.setRole(Role.PHARMACIST);
                    pharm.setStatus("APPROVED");
                    userRepository.save(pharm);
                    System.out.println("✅ Default Pharmacist User Created!");
                }
            );

            // 3.3. Ensure default "labstaff1" user exists and is APPROVED
            userRepository.findByUsername("labstaff1").ifPresentOrElse(
                lab -> {
                    if (lab.getStatus() == null || !"APPROVED".equals(lab.getStatus())) {
                        lab.setStatus("APPROVED");
                        userRepository.save(lab);
                    }
                },
                () -> {
                    User lab = new User();
                    lab.setUsername("labstaff1");
                    lab.setPassword(passwordEncoder.encode("lab123"));
                    lab.setFullName("Samantha Fernando (Lab)");
                    lab.setRole(Role.LAB_STAFF);
                    lab.setStatus("APPROVED");
                    userRepository.save(lab);
                    System.out.println("✅ Default Lab Staff User Created!");
                }
            );

            // 3.4. Ensure default "accountant1" user exists and is APPROVED
            userRepository.findByUsername("accountant1").ifPresentOrElse(
                acc -> {
                    if (acc.getStatus() == null || !"APPROVED".equals(acc.getStatus())) {
                        acc.setStatus("APPROVED");
                        userRepository.save(acc);
                    }
                },
                () -> {
                    User accountant = new User();
                    accountant.setUsername("accountant1");
                    accountant.setPassword(passwordEncoder.encode("account123"));
                    accountant.setFullName("Kavinda Dias (Accountant)");
                    accountant.setRole(Role.ACCOUNTANT);
                    accountant.setStatus("APPROVED");
                    userRepository.save(accountant);
                    System.out.println("✅ Default Accountant User Created!");
                }
            );

            // 4. Seed initial sample patients if none exist
            if (patientRepository.count() == 0) {
                Patient p1 = new Patient();
                p1.setFirstName("Sunil");
                p1.setLastName("Silva");
                p1.setNic("198512345678");
                p1.setDateOfBirth(LocalDate.of(1985, 5, 12));
                p1.setGender("Male");
                p1.setPhoneNumber("0771234567");
                p1.setAddress("No 15, Galle Road, Colombo");
                patientRepository.save(p1);

                Patient p2 = new Patient();
                p2.setFirstName("Kamala");
                p2.setLastName("Perera");
                p2.setNic("199265432100");
                p2.setDateOfBirth(LocalDate.of(1992, 10, 24));
                p2.setGender("Female");
                p2.setPhoneNumber("0719876543");
                p2.setAddress("No 42, Kandy Road, Kiribathgoda");
                patientRepository.save(p2);

                System.out.println("✅ Initial Sample Patients Seeded Successfully!");
            }

            // 5. Ensure any existing users with PATIENT role have a linked Patient entity
            List<User> patientUsers = userRepository.findAll().stream()
                    .filter(u -> u.getRole() == Role.PATIENT)
                    .toList();

            for (User u : patientUsers) {
                if (patientRepository.findByUser(u).isEmpty()) {
                    Patient p = new Patient();
                    p.setUser(u);
                    String fullName = (u.getFullName() != null && !u.getFullName().trim().isEmpty())
                            ? u.getFullName().trim()
                            : u.getUsername();
                    String[] parts = fullName.split("\\s+", 2);
                    p.setFirstName(parts[0]);
                    p.setLastName(parts.length > 1 ? parts[1] : "Patient");
                    p.setPhoneNumber("");
                    p.setGender("Not Specified");
                    p.setDateOfBirth(LocalDate.of(2000, 1, 1));
                    p.setAddress("");
                    patientRepository.save(p);
                    System.out.println("✅ Auto-linked existing PATIENT user: " + u.getUsername() + " to new Patient record.");
                }
            }

            // 6. Seed sample Medicines and Batches if none exist
            if (medicineRepository.count() == 0) {
                // Medicine 1: Paracetamol 500mg
                Medicine m1 = new Medicine();
                m1.setName("Paracetamol 500mg");
                m1.setDescription("Analgesic and antipyretic for pain and fever");
                m1.setPrice(15.0);
                m1.setStockQuantity(300);
                m1.setExpiryDate(LocalDate.now().plusMonths(3));
                Medicine savedM1 = medicineRepository.save(m1);

                MedicineBatch b1_1 = new MedicineBatch();
                b1_1.setMedicine(savedM1);
                b1_1.setBatchNumber("BATCH-PARA-EARLY");
                b1_1.setQuantity(100);
                b1_1.setExpiryDate(LocalDate.now().plusMonths(3));
                medicineBatchRepository.save(b1_1);

                MedicineBatch b1_2 = new MedicineBatch();
                b1_2.setMedicine(savedM1);
                b1_2.setBatchNumber("BATCH-PARA-LATER");
                b1_2.setQuantity(200);
                b1_2.setExpiryDate(LocalDate.now().plusMonths(12));
                medicineBatchRepository.save(b1_2);

                // Medicine 2: Amoxicillin 250mg
                Medicine m2 = new Medicine();
                m2.setName("Amoxicillin 250mg");
                m2.setDescription("Broad-spectrum antibiotic capsule");
                m2.setPrice(45.0);
                m2.setStockQuantity(200);
                m2.setExpiryDate(LocalDate.now().plusMonths(6));
                Medicine savedM2 = medicineRepository.save(m2);

                MedicineBatch b2_1 = new MedicineBatch();
                b2_1.setMedicine(savedM2);
                b2_1.setBatchNumber("BATCH-AMX-01");
                b2_1.setQuantity(50);
                b2_1.setExpiryDate(LocalDate.now().plusMonths(6));
                medicineBatchRepository.save(b2_1);

                MedicineBatch b2_2 = new MedicineBatch();
                b2_2.setMedicine(savedM2);
                b2_2.setBatchNumber("BATCH-AMX-02");
                b2_2.setQuantity(150);
                b2_2.setExpiryDate(LocalDate.now().plusMonths(18));
                medicineBatchRepository.save(b2_2);

                // Medicine 3: Omeprazole 20mg
                Medicine m3 = new Medicine();
                m3.setName("Omeprazole 20mg");
                m3.setDescription("Proton pump inhibitor for acid reflux");
                m3.setPrice(30.0);
                m3.setStockQuantity(120);
                m3.setExpiryDate(LocalDate.now().plusMonths(9));
                Medicine savedM3 = medicineRepository.save(m3);

                MedicineBatch b3_1 = new MedicineBatch();
                b3_1.setMedicine(savedM3);
                b3_1.setBatchNumber("BATCH-OMP-01");
                b3_1.setQuantity(120);
                b3_1.setExpiryDate(LocalDate.now().plusMonths(9));
                medicineBatchRepository.save(b3_1);

                System.out.println("✅ Sample Medicines & Multi-Batch Inventory Seeded Successfully!");
            }

            // 7. Seed sample Hospital Wards and Beds if none exist
            if (wardRepository.count() == 0) {
                // Ward 1: General Medical Ward
                Ward w1 = new Ward();
                w1.setName("General Medical Ward (Ward A)");
                w1.setType("GENERAL");
                w1.setDailyRate(2500.0);
                Ward savedW1 = wardRepository.save(w1);

                for (int i = 1; i <= 4; i++) {
                    Bed b = new Bed();
                    b.setWard(savedW1);
                    b.setBedNumber("BED-GWA-0" + i);
                    b.setStatus(BedStatus.AVAILABLE);
                    b.setDailyRate(2500.0);
                    bedRepository.save(b);
                }

                // Ward 2: Intensive Care Unit (ICU)
                Ward w2 = new Ward();
                w2.setName("Intensive Care Unit (ICU)");
                w2.setType("ICU");
                w2.setDailyRate(12000.0);
                Ward savedW2 = wardRepository.save(w2);

                for (int i = 1; i <= 2; i++) {
                    Bed b = new Bed();
                    b.setWard(savedW2);
                    b.setBedNumber("BED-ICU-0" + i);
                    b.setStatus(BedStatus.AVAILABLE);
                    b.setDailyRate(12000.0);
                    bedRepository.save(b);
                }

                // Ward 3: Maternity & Pediatric Ward
                Ward w3 = new Ward();
                w3.setName("Maternity & Pediatric Ward");
                w3.setType("MATERNITY");
                w3.setDailyRate(4500.0);
                Ward savedW3 = wardRepository.save(w3);

                for (int i = 1; i <= 2; i++) {
                    Bed b = new Bed();
                    b.setWard(savedW3);
                    b.setBedNumber("BED-MAT-0" + i);
                    b.setStatus(BedStatus.AVAILABLE);
                    b.setDailyRate(4500.0);
                    bedRepository.save(b);
                }

                System.out.println("✅ Initial Hospital Wards and Beds Seeded Successfully!");
            }

            // 8. Seed Staff Employees and today's Attendance if none exist
            if (employeeRepository.count() == 0) {
                userRepository.findByUsername("doctor1").ifPresent(docUser -> {
                    Employee e = new Employee();
                    e.setUser(docUser);
                    e.setDesignation("Consultant Cardiologist");
                    e.setDepartment("Cardiology");
                    e.setContactNumber("077-1122334");
                    e.setSalary(125000.0);
                    e.setStatus("ACTIVE");
                    e.setJoinedDate(LocalDate.now().minusMonths(14));
                    Employee savedDocEmp = employeeRepository.save(e);

                    Attendance att = new Attendance();
                    att.setEmployee(savedDocEmp);
                    att.setDate(LocalDate.now());
                    att.setCheckInTime(LocalTime.of(8, 15, 0));
                    att.setStatus("PRESENT");
                    att.setNotes("On time for morning OPD rounds");
                    attendanceRepository.save(att);
                });

                userRepository.findByUsername("nurse1").ifPresent(nurseUser -> {
                    Employee e = new Employee();
                    e.setUser(nurseUser);
                    e.setDesignation("Senior Staff Nurse");
                    e.setDepartment("Inpatient & ICU");
                    e.setContactNumber("071-4455667");
                    e.setSalary(65000.0);
                    e.setStatus("ACTIVE");
                    e.setJoinedDate(LocalDate.now().minusMonths(8));
                    Employee savedNurseEmp = employeeRepository.save(e);

                    Attendance att = new Attendance();
                    att.setEmployee(savedNurseEmp);
                    att.setDate(LocalDate.now());
                    att.setCheckInTime(LocalTime.of(7, 50, 0));
                    att.setStatus("PRESENT");
                    att.setNotes("Morning shift supervisor");
                    attendanceRepository.save(att);
                });

                userRepository.findByUsername("receptionist1").ifPresent(recUser -> {
                    Employee e = new Employee();
                    e.setUser(recUser);
                    e.setDesignation("Front Desk & Admissions Officer");
                    e.setDepartment("Administration");
                    e.setContactNumber("075-8899001");
                    e.setSalary(48000.0);
                    e.setStatus("ACTIVE");
                    e.setJoinedDate(LocalDate.now().minusMonths(6));
                    Employee savedRecEmp = employeeRepository.save(e);

                    Attendance att = new Attendance();
                    att.setEmployee(savedRecEmp);
                    att.setDate(LocalDate.now());
                    att.setCheckInTime(LocalTime.of(8, 25, 0));
                    att.setStatus("PRESENT");
                    att.setNotes("Front desk desk operations");
                    attendanceRepository.save(att);
                });

                userRepository.findByUsername("pharmacist1").ifPresent(pharmUser -> {
                    Employee e = new Employee();
                    e.setUser(pharmUser);
                    e.setDesignation("Head Pharmacist");
                    e.setDepartment("Pharmacy");
                    e.setContactNumber("072-3344556");
                    e.setSalary(70000.0);
                    e.setStatus("ACTIVE");
                    e.setJoinedDate(LocalDate.now().minusMonths(10));
                    Employee savedPharmEmp = employeeRepository.save(e);

                    Attendance att = new Attendance();
                    att.setEmployee(savedPharmEmp);
                    att.setDate(LocalDate.now());
                    att.setCheckInTime(LocalTime.of(8, 30, 0));
                    att.setStatus("PRESENT");
                    att.setNotes("Pharmacy dispensary inventory lead");
                    attendanceRepository.save(att);
                });

                userRepository.findByUsername("labstaff1").ifPresent(labUser -> {
                    Employee e = new Employee();
                    e.setUser(labUser);
                    e.setDesignation("Lead Medical Lab Technologist");
                    e.setDepartment("Laboratory");
                    e.setContactNumber("076-7788990");
                    e.setSalary(68000.0);
                    e.setStatus("ACTIVE");
                    e.setJoinedDate(LocalDate.now().minusMonths(5));
                    Employee savedLabEmp = employeeRepository.save(e);

                    Attendance att = new Attendance();
                    att.setEmployee(savedLabEmp);
                    att.setDate(LocalDate.now());
                    att.setCheckInTime(LocalTime.of(8, 45, 0));
                    att.setStatus("PRESENT");
                    att.setNotes("Pathology diagnostic lab lead");
                    attendanceRepository.save(att);
                });

                userRepository.findByUsername("accountant1").ifPresent(accUser -> {
                    Employee e = new Employee();
                    e.setUser(accUser);
                    e.setDesignation("Chief Accountant & Financial Controller");
                    e.setDepartment("Finance & Accounts");
                    e.setContactNumber("078-9900112");
                    e.setSalary(95000.0);
                    e.setStatus("ACTIVE");
                    e.setJoinedDate(LocalDate.now().minusMonths(12));
                    Employee savedAccEmp = employeeRepository.save(e);

                    Attendance att = new Attendance();
                    att.setEmployee(savedAccEmp);
                    att.setDate(LocalDate.now());
                    att.setCheckInTime(LocalTime.of(8, 20, 0));
                    att.setStatus("PRESENT");
                    att.setNotes("Finance and billing station supervisor");
                    attendanceRepository.save(att);
                });

                System.out.println("✅ Hospital Employees and Today's Attendance Logs Seeded Successfully!");
            }
        };
    }
}
