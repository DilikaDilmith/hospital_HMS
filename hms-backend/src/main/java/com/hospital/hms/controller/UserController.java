package com.hospital.hms.controller;

import com.hospital.hms.entity.User;
import com.hospital.hms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    // Get all users who are waiting for approval
    @GetMapping("/pending")
    @PreAuthorize("hasAuthority('ADMIN')")
    public List<User> getPendingUsers() {
        return userRepository.findByStatus("PENDING");
    }

    // Approve a user
    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAuthority('ADMIN')")
    public String approveUser(@PathVariable Long id) {
        User user = userRepository.findById(id).orElseThrow();
        user.setStatus("APPROVED");
        userRepository.save(user);
        return "User Approved!";
    }

    // Reject a user
    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAuthority('ADMIN')")
    public String rejectUser(@PathVariable Long id) {
        User user = userRepository.findById(id).orElseThrow();
        user.setStatus("REJECTED");
        userRepository.save(user);
        return "User Rejected!";
    }
    
    // Endpoint to get the currently logged-in user's profile details
    @GetMapping("/profile")
    public User getUserProfile(Authentication authentication) {
        // Get the username from the security context
        String username = authentication.getName();
        // Fetch the user from the database
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found!"));
    }
}