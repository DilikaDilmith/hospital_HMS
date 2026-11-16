package com.hospital.hms;

import com.hospital.hms.entity.Patient;
import com.hospital.hms.entity.Role;
import com.hospital.hms.entity.User;
import com.hospital.hms.repository.PatientRepository;
import com.hospital.hms.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initDatabase(UserRepository userRepository, PatientRepository patientRepository, PasswordEncoder passwordEncoder) {
        return args -> {
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
        };
    }
}
