package com.hospital.hms.service;

import com.hospital.hms.dto.LoginRequest;
import com.hospital.hms.entity.User;
import com.hospital.hms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    // Validates user login credentials
    public String login(LoginRequest loginRequest) {
        // Find the user by username
        Optional<User> userOptional = userRepository.findByUsername(loginRequest.getUsername());

        // Check if user exists
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            
            // Verify the password (Note: In a real app, use password encoders like BCrypt)
            if (user.getPassword().equals(loginRequest.getPassword())) {
                return "Login Successful! Welcome " + user.getFullName() + " (" + user.getRole() + ")";
            } else {
                return "Invalid Password!";
            }
        }
        return "User not found!";
    }
}