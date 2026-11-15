package com.hospital.hms;

import com.hospital.hms.entity.Role;
import com.hospital.hms.entity.User;
import com.hospital.hms.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initDatabase(UserRepository userRepository) {
        return args -> {
            // Username එක "admin" කෙනෙක් නැත්නම් විතරක් අලුතෙන් හදනවා
            if (userRepository.findByUsername("admin").isEmpty()) {
                User admin = new User();
                admin.setUsername("admin");
                admin.setPassword("admin123"); // පස්සේ අපි මේක Encrypt කරමු
                admin.setFullName("System Administrator");
                admin.setRole(Role.ADMIN);
                
                userRepository.save(admin);
                System.out.println("✅ Default Admin User Created Successfully!");
            }
        };
    }
}