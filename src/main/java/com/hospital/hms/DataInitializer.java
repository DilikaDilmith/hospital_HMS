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
            // If "admin" user doesn't exist, create it
            if (userRepository.findByUsername("admin").isEmpty()) {
                User admin = new User();
                admin.setUsername("admin");
                // Encode the password before saving to the database
                admin.setPassword(passwordEncoder.encode("admin123")); 
                admin.setFullName("System Administrator");
                admin.setRole(Role.ADMIN);
                
                userRepository.save(admin);
                System.out.println("✅ Default Admin User Created Successfully with Encoded Password!");
            }
            // Create a default Doctor user for testing
            if (userRepository.findByUsername("doctor1").isEmpty()) {
                User doctor = new User();
                doctor.setUsername("doctor1");
                doctor.setPassword(passwordEncoder.encode("doc123"));
                doctor.setFullName("Dr. Sunil Perera");
                doctor.setRole(Role.DOCTOR); // Assigning DOCTOR role
                userRepository.save(doctor);
                System.out.println("✅ Default Doctor User Created!");
            }
        };
    }
}