package com.hospital.hms;

import com.hospital.hms.entity.Role;
import com.hospital.hms.entity.User;
import com.hospital.hms.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initDatabase(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            // Ensure default "admin" user exists and is APPROVED
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

            // Ensure default "doctor1" user exists and is APPROVED
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
        };
    }
}